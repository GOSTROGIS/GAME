import { config, repository, server } from "./app.config.js";

await server.listen(config.port);
console.info(JSON.stringify({ level: "info", event: "server.listening", port: config.port, persistence: config.databaseUrl ? "postgres" : "memory", presence: config.redisUrl ? "redis" : "local" }));

const shutdown = async (signal: string) => {
  console.info(JSON.stringify({ level: "info", event: "server.shutdown", signal }));
  await server.gracefullyShutdown(false);
  await repository.close();
  process.exit(0);
};
process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
