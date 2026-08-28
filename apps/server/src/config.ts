export interface ServerConfig {
  nodeEnv: "development" | "test" | "production";
  port: number;
  publicOrigin: string;
  allowedOrigins: string[];
  databaseUrl: string | null;
  redisUrl: string | null;
  cookieSecret: string;
  secureCookies: boolean;
  exposeDevMagicLinks: boolean;
  allowGuests: boolean;
  allowOriginlessWebSockets: boolean;
}

const bool = (value: string | undefined, fallback: boolean): boolean => value === undefined ? fallback : value === "true";

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): ServerConfig {
  const nodeEnv = environment.NODE_ENV === "production" ? "production" : environment.NODE_ENV === "test" ? "test" : "development";
  const port = Number(environment.PORT ?? 2567);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be an integer from 1 to 65535");
  const publicOrigin = environment.PUBLIC_ORIGIN ?? `http://localhost:${port}`;
  const defaultAllowedOrigins = nodeEnv === "production"
    ? [publicOrigin]
    : [publicOrigin, "http://localhost:4173", "http://127.0.0.1:4173", "http://localhost:5173", "http://127.0.0.1:5173"];
  const cookieSecret = environment.COOKIE_SECRET ?? (nodeEnv === "production" ? "" : "development-only-change-me");
  if (cookieSecret.length < 24) throw new Error("COOKIE_SECRET must be at least 24 characters");
  return {
    nodeEnv,
    port,
    publicOrigin,
    allowedOrigins: (environment.ALLOWED_ORIGINS ?? defaultAllowedOrigins.join(",")).split(",").map((value) => value.trim()).filter(Boolean),
    databaseUrl: environment.DATABASE_URL || null,
    redisUrl: environment.REDIS_URL || null,
    cookieSecret,
    secureCookies: bool(environment.SECURE_COOKIES, nodeEnv === "production"),
    exposeDevMagicLinks: bool(environment.EXPOSE_DEV_MAGIC_LINKS, nodeEnv !== "production"),
    allowGuests: bool(environment.ALLOW_GUESTS, nodeEnv !== "production"),
    allowOriginlessWebSockets: bool(environment.ALLOW_ORIGINLESS_WEBSOCKETS, nodeEnv !== "production"),
  };
}
