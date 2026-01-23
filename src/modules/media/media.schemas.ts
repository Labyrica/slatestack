import { Type } from "@sinclair/typebox";

export const MediaFileResponseSchema = Type.Object({
  id: Type.String(),
  filename: Type.String(),
  originalName: Type.String(),
  mimeType: Type.String(),
  size: Type.Number(),
  width: Type.Union([Type.Number(), Type.Null()]),
  height: Type.Union([Type.Number(), Type.Null()]),
  altText: Type.Union([Type.String(), Type.Null()]),
  path: Type.String(),
  thumbnailPath: Type.Union([Type.String(), Type.Null()]),
  url: Type.String(),
  thumbnailUrl: Type.Union([Type.String(), Type.Null()]),
  uploadedBy: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

export const UploadResponseSchema = Type.Object({
  files: Type.Array(MediaFileResponseSchema),
});
