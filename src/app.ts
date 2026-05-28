import Fastify, { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { TypeBoxValidatorCompiler } from "@fastify/type-provider-typebox";
import fastifyEnv from "@fastify/env";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import fastifyRateLimit from "@fastify/rate-limit";
import path from "path";
import { assertProductionSecrets, envSchema } from "./shared/config/index.js";
import { isAppError } from "./shared/errors/index.js";
import authPlugin from "./plugins/auth.js";
import tickerPlugin from "./plugins/ticker.js";
import { authRoutes, userRoutes } from "./modules/auth/index.js";
import { collectionRoutes, entryRoutes, publicContentRoutes } from "./modules/content/index.js";
import { mediaRoutes } from "./modules/media/index.js";
import { metricsRoutes, metricsAdminRoutes, metricsPublicRoutes } from "./modules/metrics/index.js";
import { systemInfoRoutes } from "./modules/admin/index.js";
import { updateRoutes } from "./modules/update/index.js";
import { apiKeyRoutes } from "./modules/apikeys/index.js";
import { webhookRoutes } from "./modules/webhooks/index.js";
import { formRoutes } from "./modules/forms/index.js";
import staticRoutes from "./routes/static.js";
import healthRoutes from "./routes/health.js";

function parseTrustProxy(value: string | undefined): boolean | string | string[] {
  if (!value) return false;
  if (value === "true") return true;
  if (value === "false") return false;
  if (value.includes(",")) return value.split(",").map((s) => s.trim()).filter(Boolean);
  return value;
}

function parseCorsOrigins(value: string | undefined): string[] {
  if (!value) return ["http://localhost:5173", "http://127.0.0.1:5173"];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      // Pretty-print in development only
      ...(process.env.NODE_ENV === 'development' && {
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      }),
    },
    trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
    disableRequestLogging: false,
  })
    .withTypeProvider<TypeBoxTypeProvider>()
    .setValidatorCompiler(TypeBoxValidatorCompiler);

  // Register environment validation
  await fastify.register(fastifyEnv, {
    schema: envSchema,
    dotenv: true,
  });

  // Refuse to start in production with known placeholder secrets
  assertProductionSecrets(fastify.config);

  // Global error handler — maps typed AppError to its statusCode and lets
  // Fastify's built-in validation errors and 4xx FastifyError responses
  // pass through unchanged.
  fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    if (isAppError(error)) {
      const body: Record<string, unknown> = { error: error.message };
      const details = (error as { details?: unknown }).details;
      if (details !== undefined) body.details = details;
      return reply.status(error.statusCode).send(body);
    }

    // Fastify schema-validation errors set `.validation` and a 400 statusCode.
    if (error.validation) {
      return reply.status(error.statusCode ?? 400).send({
        error: error.message,
        details: error.validation.map((v) => ({
          field: (v.instancePath || v.schemaPath || "").replace(/^\//, ""),
          message: v.message ?? "Invalid value",
        })),
      });
    }

    // Known FastifyError with explicit statusCode (e.g. 4xx).
    if (typeof error.statusCode === "number" && error.statusCode < 500) {
      return reply.status(error.statusCode).send({ error: error.message });
    }

    request.log.error({ err: error }, "Unhandled error");
    return reply.status(500).send({ error: "Internal Server Error" });
  });

  // Baseline security headers. Skip CSP for the admin SPA shell since Vite-built
  // assets pull from same-origin hashed paths only; tighter CSP can be added per
  // deployment via a reverse proxy.
  fastify.addHook("onSend", async (request, reply, payload) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("X-Frame-Options", "DENY");
    reply.header("Referrer-Policy", "no-referrer");
    reply.header("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    reply.header("Cross-Origin-Opener-Policy", "same-origin");
    if (process.env.NODE_ENV === "production") {
      reply.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    return payload;
  });

  // Register CORS — origins driven by CORS_ORIGINS env (comma-separated).
  await fastify.register(fastifyCors, {
    origin: parseCorsOrigins(process.env.CORS_ORIGINS),
    credentials: true,
  });

  // Register cookie support
  await fastify.register(fastifyCookie);

  // Global rate limiter. Routes opt in via `config.rateLimit`; we set a generous
  // ceiling here as a safety net and tighter per-route limits below.
  await fastify.register(fastifyRateLimit, {
    global: true,
    max: 600,
    timeWindow: "1 minute",
    // Always allow the health probe and the admin SPA static shell.
    allowList: (request) =>
      request.url === "/api/health" ||
      request.url.startsWith("/admin/") ||
      request.url.startsWith("/uploads/"),
  });

  // Register multipart support for file uploads
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: fastify.config.MAX_FILE_SIZE,
      files: 10,
      fields: 10,
    },
  });

  // Register static file serving for uploads
  await fastify.register(fastifyStatic, {
    root: path.resolve(fastify.config.UPLOAD_DIR),
    prefix: "/uploads/",
    decorateReply: false,
  });

  // Register health check (before auth, so it doesn't require authentication)
  await fastify.register(healthRoutes);

  // Register auth plugin
  await fastify.register(authPlugin);

  // Register auth routes
  await fastify.register(authRoutes);

  // Register user management routes
  await fastify.register(userRoutes);

  // Register collection management routes
  await fastify.register(collectionRoutes);

  // Register entry management routes
  await fastify.register(entryRoutes);

  // Register media upload routes
  await fastify.register(mediaRoutes);

  // Register metrics admin routes
  await fastify.register(metricsAdminRoutes);

  // Register system info routes (admin only)
  await fastify.register(systemInfoRoutes);

  // Register update routes (admin only)
  await fastify.register(updateRoutes);

  // API keys / webhooks admin routes
  await fastify.register(apiKeyRoutes);
  await fastify.register(webhookRoutes);

  // Form collection routes (public submit + admin list/delete)
  await fastify.register(formRoutes);

  // Register metrics public routes (public, rate-limited)
  await fastify.register(metricsPublicRoutes);

  // Register metrics routes (public pageview tracking, rate-limited)
  await fastify.register(metricsRoutes);

  // Register public content routes (no auth required)
  await fastify.register(publicContentRoutes);

  // Background ticker for scheduled publishing + webhook deliveries
  await fastify.register(tickerPlugin);

  // Register static file serving for admin SPA (must be last)
  await fastify.register(staticRoutes);

  return fastify;
}
