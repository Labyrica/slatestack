import { FastifyPluginAsync } from "fastify";
import { sql } from "drizzle-orm";
import { db } from "../shared/database/index.js";

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/api/health", async (request, reply) => {
    try {
      // Test database connection
      await db.execute(sql`SELECT 1`);

      return {
        status: "ok",
        database: "connected"
      };
    } catch (error) {
      request.log.error(error, "Health check failed");

      reply.code(503);
      return {
        status: "error",
        database: "disconnected"
      };
    }
  });
};

export default healthRoutes;
