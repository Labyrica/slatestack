import Fastify from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { TypeBoxValidatorCompiler } from "@fastify/type-provider-typebox";
import fastifyEnv from "@fastify/env";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import { envSchema } from "./shared/config/index.js";

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

  return fastify;
}
