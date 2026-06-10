import pino from "pino";

/**
 * Structured logger for code that runs outside a request context
 * (services, seeding, background work). Request handlers should keep
 * using request.log / fastify.log so entries carry request metadata.
 * Mirrors the Fastify logger config in app.ts.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  // Pretty-print in development only
  ...(process.env.NODE_ENV === "development" && {
    transport: {
      target: "pino-pretty",
      options: { translateTime: "HH:MM:ss Z", ignore: "pid,hostname" },
    },
  }),
});
