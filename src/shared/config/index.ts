import { Type, Static } from "@sinclair/typebox";

const EnvSchema = Type.Object({
  DATABASE_URL: Type.String({ minLength: 1 }),
  BETTER_AUTH_SECRET: Type.String({ minLength: 32 }),
  BETTER_AUTH_URL: Type.String(),
  ADMIN_EMAIL: Type.String(),
  ADMIN_PASSWORD: Type.String({ minLength: 8 }),
  PORT: Type.Number({ default: 3000 }),
  NODE_ENV: Type.Union(
    [
      Type.Literal("development"),
      Type.Literal("production"),
      Type.Literal("test"),
    ],
    { default: "development" }
  ),
  LOG_LEVEL: Type.Union(
    [
      Type.Literal("fatal"),
      Type.Literal("error"),
      Type.Literal("warn"),
      Type.Literal("info"),
      Type.Literal("debug"),
      Type.Literal("trace"),
    ],
    { default: "info" }
  ),
  MAX_FILE_SIZE: Type.Number({ default: 10485760 }), // 10MB default
  UPLOAD_DIR: Type.String({ default: "./uploads" }),
  METRICS_SALT: Type.String({ default: "change-me-in-production" }),
  TRUST_PROXY: Type.Optional(Type.String()),
  CORS_ORIGINS: Type.Optional(Type.String()),
});

export type EnvConfig = Static<typeof EnvSchema>;

export const envSchema = EnvSchema;

declare module "fastify" {
  interface FastifyInstance {
    config: EnvConfig;
  }
}

/**
 * Known placeholder values that must never appear in a production deployment.
 * Matched as substrings (case-insensitive) so variations are also rejected.
 */
const PLACEHOLDER_FRAGMENTS = [
  "change-me",
  "change_me",
  "changeme",
  "must-be-at-least-32-chars",
  "your-32-char-secret",
  "your-admin-password",
  "adminpassword123",
  "dev-secret",
  "dev-metrics-salt",
];

function looksLikePlaceholder(value: string | undefined): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return PLACEHOLDER_FRAGMENTS.some((p) => lower.includes(p));
}

/**
 * Refuse to start a production deployment with publicly-known placeholder
 * secrets. Development and test allow them so the default workflow keeps
 * working.
 */
export function assertProductionSecrets(config: EnvConfig): void {
  if (config.NODE_ENV !== "production") return;

  const offenders: string[] = [];
  if (looksLikePlaceholder(config.BETTER_AUTH_SECRET)) offenders.push("BETTER_AUTH_SECRET");
  if (looksLikePlaceholder(config.ADMIN_PASSWORD)) offenders.push("ADMIN_PASSWORD");
  if (looksLikePlaceholder(config.METRICS_SALT)) offenders.push("METRICS_SALT");

  if (offenders.length > 0) {
    throw new Error(
      `Refusing to start: ${offenders.join(", ")} ` +
        `still set to a known placeholder value. Set real secrets before deploying to production.`
    );
  }
}
