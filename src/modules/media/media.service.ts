import { nanoid } from "nanoid";
import { db } from "../../shared/database/index.js";
import { mediaFile } from "../../shared/database/schema.js";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import type { MediaFileInput, MediaFileResponse } from "./media.types.js";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "audio/mpeg",
];

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  uploadedBy: string
): Promise<MediaFileResponse> {
  // Validate file type using magic numbers
  const detectedType = await fileTypeFromBuffer(buffer);
  if (!detectedType || !ALLOWED_TYPES.includes(detectedType.mime)) {
    throw new Error(
      `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`
    );
  }

  // Use detected MIME type instead of declared
  const validatedMimeType = detectedType.mime;

  // Generate unique filename
  const filename = generateUniqueFilename(originalName);

  // Get upload directory for current date
  const uploadDir = await getUploadDir();
  const filePath = path.join(uploadDir, filename);

  // Write original file to disk
  await fs.writeFile(filePath, buffer);

  const fileData: MediaFileInput = {
    filename,
    originalName,
    mimeType: validatedMimeType,
    size: buffer.length,
    path: filePath,
    uploadedBy,
  };

  // Process images
  if (validatedMimeType.startsWith("image/")) {
    const processedImage = await processImage(filePath);
    fileData.width = processedImage.width;
    fileData.height = processedImage.height;
    fileData.thumbnailPath = processedImage.thumbnailPath;
  }

  // Insert into database
  const [inserted] = await db
    .insert(mediaFile)
    .values({
      id: nanoid(),
      ...fileData,
    })
    .returning();

  // Build response with URLs
  return {
    id: inserted.id,
    filename: inserted.filename,
    originalName: inserted.originalName,
    mimeType: inserted.mimeType,
    size: inserted.size,
    width: inserted.width,
    height: inserted.height,
    altText: inserted.altText,
    path: inserted.path,
    thumbnailPath: inserted.thumbnailPath,
    url: buildMediaUrl(inserted.path),
    thumbnailUrl: inserted.thumbnailPath
      ? buildMediaUrl(inserted.thumbnailPath)
      : null,
    uploadedBy: inserted.uploadedBy,
    createdAt: inserted.createdAt.toISOString(),
    updatedAt: inserted.updatedAt.toISOString(),
  };
}

export async function processImage(
  filePath: string
): Promise<{ width: number; height: number; thumbnailPath: string }> {
  const image = sharp(filePath);

  // Get metadata
  const metadata = await image.metadata();

  // Generate WebP version
  const webpPath = filePath.replace(/\.[^.]+$/, ".webp");
  await image.toFormat("webp").toFile(webpPath);

  // Generate 200x200 thumbnail
  const thumbnailPath = filePath.replace(/\.[^.]+$/, "-thumb.webp");
  await sharp(filePath).resize(200, 200, { fit: "cover" }).webp().toFile(thumbnailPath);

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    thumbnailPath,
  };
}

async function getUploadDir(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");

  const uploadDir = path.join(process.env.UPLOAD_DIR || "./uploads", year, month);

  // Create directory if it doesn't exist
  await fs.mkdir(uploadDir, { recursive: true });

  return uploadDir;
}

function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const randomBytes = crypto.randomBytes(16).toString("hex");
  return `${randomBytes}${ext}`;
}

function buildMediaUrl(filePath: string): string {
  // Convert absolute path to relative URL
  // e.g., ./uploads/2026/01/abc123.jpg -> /uploads/2026/01/abc123.jpg
  const normalized = filePath.replace(/\\/g, "/");
  const uploadsIndex = normalized.indexOf("uploads/");
  if (uploadsIndex !== -1) {
    return "/" + normalized.substring(uploadsIndex);
  }
  return filePath;
}
