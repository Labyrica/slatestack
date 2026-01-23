import Fastify from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { TypeBoxValidatorCompiler } from "@fastify/type-provider-typebox";
import fastifyEnv from "@fastify/env";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import { envSchema } from "./shared/config/index.js";
import authPlugin from "./plugins/auth.js";
import { authRoutes, userRoutes } from "./modules/auth/index.js";
import { collectionRoutes, entryRoutes, publicContentRoutes } from "./modules/content/index.js";

export async function buildApp() {
  const fastify = Fastify({
    logger: true,
  })
    .withTypeProvider<TypeBoxTypeProvider>()
    .setValidatorCompiler(TypeBoxValidatorCompiler);

  // Register environment validation
  await fastify.register(fastifyEnv, {
    schema: envSchema,
    dotenv: true,
  });

  // Register CORS
  await fastify.register(fastifyCors, {
    credentials: true,
  });

  // Register cookie support
  await fastify.register(fastifyCookie);

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

  // Register public content routes (no auth required)
  await fastify.register(publicContentRoutes);

  return fastify;
}
