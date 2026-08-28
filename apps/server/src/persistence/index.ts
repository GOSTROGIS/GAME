import type { ServerConfig } from "../config.js";
import { InMemoryGameRepository } from "./memory.js";
import { PostgresGameRepository } from "./postgres.js";
import type { GameRepository } from "./types.js";

export function createRepository(config: ServerConfig): GameRepository {
  return config.databaseUrl ? new PostgresGameRepository(config.databaseUrl) : new InMemoryGameRepository();
}

export * from "./memory.js";
export * from "./postgres.js";
export * from "./postgres-turn-store.js";
export * from "./turn-store.js";
export * from "./types.js";
