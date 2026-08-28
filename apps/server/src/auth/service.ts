import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { ServerConfig } from "../config.js";
import type { AccountRecord, GameRepository } from "../persistence/types.js";

const MAGIC_LINK_TTL_MS = 10 * 60_000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60_000;

export interface MagicLinkSender {
  send(message: { email: string; url: string; expiresAt: Date }): Promise<void>;
}

export class ConsoleMagicLinkSender implements MagicLinkSender {
  constructor(readonly exposeUrl = true) {}
  async send(message: { email: string; url: string; expiresAt: Date }): Promise<void> {
    if (!this.exposeUrl) throw new Error("Production magic-link delivery is not configured");
    console.info(JSON.stringify({ level: "info", event: "dev_magic_link", ...message, expiresAt: message.expiresAt.toISOString() }));
  }
}

export interface VerifiedSession { account: AccountRecord; cookieValue: string; expiresAt: Date }

export class AuthService {
  constructor(
    readonly repository: GameRepository,
    readonly config: ServerConfig,
    readonly sender: MagicLinkSender,
    readonly now: () => Date = () => new Date(),
  ) {}

  async requestMagicLink(rawEmail: unknown): Promise<{ devUrl: string | null }> {
    const email = normalizeEmail(rawEmail);
    const rawToken = randomBytes(32).toString("base64url");
    const expiresAt = new Date(this.now().getTime() + MAGIC_LINK_TTL_MS);
    await this.repository.putMagicLink(email, sha256(rawToken), expiresAt);
    const url = new URL("/auth/verify", this.config.publicOrigin);
    url.searchParams.set("token", rawToken);
    await this.sender.send({ email, url: url.toString(), expiresAt });
    return { devUrl: this.config.exposeDevMagicLinks ? url.toString() : null };
  }

  async verifyMagicLink(rawToken: unknown): Promise<VerifiedSession | null> {
    if (typeof rawToken !== "string" || rawToken.length < 32 || rawToken.length > 128) return null;
    const account = await this.repository.consumeMagicLink(sha256(rawToken), this.now());
    if (!account) return null;
    const rawSession = randomBytes(32).toString("base64url");
    const expiresAt = new Date(this.now().getTime() + SESSION_TTL_MS);
    await this.repository.putSession(sha256(rawSession), account.id, expiresAt);
    return { account, cookieValue: `${rawSession}.${this.sign(rawSession)}`, expiresAt };
  }

  async resolveSession(signedValue: unknown): Promise<{ accountId: string } | null> {
    if (typeof signedValue !== "string") return null;
    const separator = signedValue.lastIndexOf(".");
    if (separator < 1) return null;
    const rawSession = signedValue.slice(0, separator);
    const provided = signedValue.slice(separator + 1);
    const expected = this.sign(rawSession);
    if (!safeEqual(provided, expected)) return null;
    const session = await this.repository.findSession(sha256(rawSession), this.now());
    return session ? { accountId: session.accountId } : null;
  }

  private sign(value: string): string {
    return createHmac("sha256", this.config.cookieSecret).update(value).digest("base64url");
  }
}

export function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") throw new Error("A valid email is required");
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("A valid email is required");
  return email;
}

export function parseCookie(header: string | undefined, name: string): string | null {
  for (const pair of (header ?? "").split(";")) {
    const [key, ...rest] = pair.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function sha256(value: string): string { return createHash("sha256").update(value).digest("hex"); }
function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
