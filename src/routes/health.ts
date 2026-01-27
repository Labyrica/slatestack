import { FastifyPluginAsync } from "fastify";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { db } from "../shared/database/index.js";

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/api/health", async (request, reply) => {
    let databaseStatus: "connected" | "disconnected" = "disconnected";
    let mediaStatus: "writable" | "unavailable" = "unavailable";

    // Test database connection
    try {
      await db.execute(sql`SELECT 1`);
      databaseStatus = "connected";
    } catch (error) {
      request.log.error(error, "Database health check failed");
    }

    // Test media storage writability with actual write operation
    // fs.access() has race conditions and false positives on NFS/Windows
    const uploadDir = process.env.UPLOAD_DIR || "./uploads";
    const testFile = path.join(uploadDir, `.health-check-${Date.now()}`);
    try {
      await fs.promises.writeFile(testFile, "health-check");
      await fs.promises.unlink(testFile);
      mediaStatus = "writable";
    } catch (error) {
      request.log.warn(
        { err: error, uploadDir },
        "Media storage writability check failed - uploads may not work"
      );
    }

    // Determine overall status
    let status: "ok" | "degraded" | "error";
    if (databaseStatus === "disconnected") {
      status = "error";
    } else if (mediaStatus === "unavailable") {
      status = "degraded";
    } else {
      status = "ok";
    }

    // Set appropriate HTTP status code
    if (status === "error") {
      reply.code(503);
    } else if (status === "degraded") {
      reply.code(200); // Still functional, just degraded
    }

    return {
      status,
      database: databaseStatus,
      media: mediaStatus
    };
  });
};

export default healthRoutes;
