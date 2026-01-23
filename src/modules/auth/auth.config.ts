import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../../shared/database/index.js";
import * as schema from "../../shared/database/schema.js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  plugins: [
    admin(), // Enables role field and admin APIs
  ],
  trustedOrigins: [
    process.env.BETTER_AUTH_URL!,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ],
});

export type Auth = typeof auth;
