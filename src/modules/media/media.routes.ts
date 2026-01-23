import { FastifyPluginAsync } from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { requireRole } from "../auth/auth.service.js";
import { uploadFile } from "./media.service.js";
import { UploadResponseSchema } from "./media.schemas.js";

export const mediaRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<TypeBoxTypeProvider>();

  // POST /api/admin/media/upload - Upload files
  app.post(
    "/api/admin/media/upload",
    {
      preHandler: [requireRole("editor")],
      schema: {
        response: {
          200: UploadResponseSchema,
          400: Type.Object({ error: Type.String() }),
        },
      },
    },
    async (request, reply) => {
      try {
        const parts = request.parts();
        const uploadedFiles = [];

        for await (const part of parts) {
          if (part.type === "file") {
            const buffer = await part.toBuffer();

            // Check file size (multipart plugin should handle this, but double-check)
            if (buffer.length > fastify.config.MAX_FILE_SIZE) {
              throw new Error(
                `File size exceeds maximum allowed size of ${fastify.config.MAX_FILE_SIZE} bytes`
              );
            }

            const file = await uploadFile(
              buffer,
              part.filename,
              part.mimetype,
              request.user!.id
            );
            uploadedFiles.push(file);
          }
        }

        if (uploadedFiles.length === 0) {
          return reply.status(400).send({
            error: "No files uploaded",
          });
        }

        return reply.send({ files: uploadedFiles });
      } catch (error) {
        // Handle file type errors
        if (error instanceof Error && error.message.includes("Invalid file type")) {
          return reply.status(400).send({
            error: error.message,
          });
        }
        throw error;
      }
    }
  );
};
