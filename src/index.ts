import "dotenv/config";
import { buildApp } from "./app.js";
import { seedAdminUser } from "./shared/database/seed.js";

const SHUTDOWN_TIMEOUT_MS = 15_000;

async function main() {
  const app = await buildApp();

  // Seed admin user if needed
  await seedAdminUser();

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.log.info({ signal }, "Shutdown signal received, draining requests");

    // Hard-timeout fallback so a stuck handler can't pin the process forever.
    const timer = setTimeout(() => {
      app.log.error("Shutdown timed out, forcing exit");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    timer.unref();

    try {
      await app.close();
      app.log.info("Server closed cleanly");
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, "Error during shutdown");
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  try {
    await app.listen({
      port: app.config.PORT,
      host: "0.0.0.0",
    });

    app.log.info(`Server listening on http://0.0.0.0:${app.config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
