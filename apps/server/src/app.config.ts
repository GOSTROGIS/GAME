import express from "express";
import { defineRoom, defineServer } from "@colyseus/core";
import { RedisDriver } from "@colyseus/redis-driver";
import { RedisPresence } from "@colyseus/redis-presence";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { AuthService, ConsoleMagicLinkSender } from "./auth/service.js";
import { createApiRouter } from "./auth/routes.js";
import { loadConfig } from "./config.js";
import { InMemoryGameRepository, InMemoryTurnPersistence, PostgresGameRepository, PostgresTurnPersistenceAdapter, createRepository } from "./persistence/index.js";
import { HearthmereRoom } from "./rooms/HearthmereRoom.js";
import { installRoomDependencies } from "./rooms/dependencies.js";
import { metrics } from "./telemetry/metrics.js";
import { isAllowedWebSocketOrigin } from "./transport-security.js";

export const config = loadConfig();
export const repository = createRepository(config);
export const turnPersistence = repository instanceof PostgresGameRepository
  ? new PostgresTurnPersistenceAdapter(repository.pool)
  : new InMemoryTurnPersistence(repository instanceof InMemoryGameRepository ? repository : null);
export const auth = new AuthService(repository, config, new ConsoleMagicLinkSender(config.exposeDevMagicLinks));
installRoomDependencies({ auth, repository, turnPersistence, config });

export const server = defineServer({
  rooms: { hearthmere: defineRoom(HearthmereRoom) },
  transport: new WebSocketTransport({
    pingInterval: 10_000,
    pingMaxRetries: 4,
    maxPayload: 64 * 1024,
    verifyClient: (info: { origin: string }) => isAllowedWebSocketOrigin(info.origin || undefined, config.allowedOrigins, config.allowOriginlessWebSockets),
  }),
  ...(config.redisUrl ? { presence: new RedisPresence(config.redisUrl) } : {}),
  ...(config.redisUrl ? { driver: new RedisDriver(config.redisUrl) } : {}),
  express: (app) => {
    app.disable("x-powered-by");
    app.use((request, response, next) => {
      response.setHeader("X-Content-Type-Options", "nosniff");
      response.setHeader("Referrer-Policy", "no-referrer");
      response.setHeader("Cross-Origin-Resource-Policy", "same-site");
      const origin = request.headers.origin;
      if (origin && !config.allowedOrigins.includes(origin)) { response.status(403).json({ error: "origin_not_allowed" }); return; }
      if (origin && config.allowedOrigins.includes(origin)) {
        response.setHeader("Access-Control-Allow-Origin", origin);
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setHeader("Vary", "Origin");
      }
      if (request.method === "OPTIONS") {
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.status(204).end(); return;
      }
      next();
    });
    app.use(express.json({ limit: "64kb", strict: true }));
    app.get("/health/live", (_request, response) => response.json({ status: "ok" }));
    app.get("/health/ready", async (_request, response) => {
      const ready = await repository.health();
      response.status(ready ? 200 : 503).json({ status: ready ? "ready" : "unavailable", persistence: ready });
    });
    app.get("/metrics", (_request, response) => { response.type("text/plain; version=0.0.4").send(metrics.render()); });
    app.use(createApiRouter({ auth, repository, config }));
  },
});

export type HearthmereServer = typeof server;
