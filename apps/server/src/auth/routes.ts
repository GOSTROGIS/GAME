import { Router, type NextFunction, type Request, type Response } from "express";
import {
  DEFAULT_APPEARANCE_V2,
  NETWORK_PROTOCOL_VERSION,
  PHASES,
  SAVE_SCHEMA_VERSION,
  composePhaseMask,
  migrateLegacySaveV3ToV6,
  validateAppearanceV2,
} from "@hollow-march/shared";
import type { ServerConfig } from "../config.js";
import { LegacyImportConflictError, type GameRepository } from "../persistence/types.js";
import { canonicalAnchorTransform } from "../world/hearthmere.js";
import { FixedWindowRateLimiter } from "./rate-limit.js";
import { AuthService, parseCookie } from "./service.js";

type AuthenticatedRequest = Request & { accountId?: string };

export function createApiRouter(dependencies: { auth: AuthService; repository: GameRepository; config: ServerConfig }): Router {
  const router = Router();
  const ipLimiter = new FixedWindowRateLimiter(10, 15 * 60_000);
  const emailLimiter = new FixedWindowRateLimiter(5, 15 * 60_000);
  const authenticate = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    const session = await dependencies.auth.resolveSession(parseCookie(request.headers.cookie, "hm_session"));
    if (!session) { response.status(401).json({ error: "authentication_required" }); return; }
    request.accountId = session.accountId;
    next();
  };

  router.post("/auth/request-link", async (request, response) => {
    const emailKey = String(request.body?.email ?? "").trim().toLowerCase();
    if (!ipLimiter.allow(request.ip ?? "unknown") || !emailLimiter.allow(emailKey)) { response.status(429).json({ error: "rate_limited" }); return; }
    try {
      const result = await dependencies.auth.requestMagicLink(request.body?.email);
      response.status(202).json({ accepted: true, ...(result.devUrl ? { devMagicLink: result.devUrl } : {}) });
    } catch {
      response.status(202).json({ accepted: true });
    }
  });

  router.get("/auth/verify", async (request, response) => {
    const verified = await dependencies.auth.verifyMagicLink(request.query.token);
    if (!verified) { response.status(400).json({ error: "invalid_or_expired_magic_link" }); return; }
    response.cookie("hm_session", verified.cookieValue, {
      httpOnly: true, secure: dependencies.config.secureCookies, sameSite: "strict", path: "/", expires: verified.expiresAt,
    });
    await dependencies.repository.appendAuditEvent({ accountId: verified.account.id, kind: "auth.magic_link_verified", subjectId: verified.account.id, detail: {} });
    response.json({ account: { id: verified.account.id, email: verified.account.email } });
  });

  router.get("/characters", authenticate, async (request: AuthenticatedRequest, response) => {
    response.json({ characters: await dependencies.repository.listCharacters(request.accountId!) });
  });

  router.post("/characters", authenticate, async (request: AuthenticatedRequest, response) => {
    const name = normalizeCharacterName(request.body?.name);
    const appearanceResult = validateAppearanceV2(request.body?.appearance ?? DEFAULT_APPEARANCE_V2);
    if (!name || !appearanceResult.ok) {
      response.status(400).json({ error: "invalid_character", details: [...(!name ? ["name must contain 2-32 printable characters"] : []), ...(!appearanceResult.ok ? appearanceResult.errors : [])] });
      return;
    }
    const character = await dependencies.repository.createCharacter({
      accountId: request.accountId!, name, appearance: appearanceResult.value,
      transform: canonicalAnchorTransform("player.start"), publicPhaseMask: PHASES.PUBLIC,
      personalPhaseMask: composePhaseMask(PHASES.PUBLIC, PHASES.HEARTHMERE_UNRESTORED),
    });
    await dependencies.repository.appendAuditEvent({ accountId: request.accountId!, kind: "character.created", subjectId: character.id, detail: { name } });
    response.status(201).json({ character });
  });

  router.get("/bootstrap", authenticate, async (request: AuthenticatedRequest, response) => {
    const characters = await dependencies.repository.listCharacters(request.accountId!);
    response.json({
      protocolVersion: NETWORK_PROTOCOL_VERSION, saveSchemaVersion: SAVE_SCHEMA_VERSION, room: "hearthmere", simulationHz: 30, patchHz: 20,
      characters, legacyImportEligible: characters.some((character) => character.legacyImportFingerprint === null),
    });
  });

  router.post("/characters/:characterId/import-legacy-v3", authenticate, async (request: AuthenticatedRequest, response, next) => {
    const parameter = request.params.characterId;
    const characterId = Array.isArray(parameter) ? parameter[0] : parameter;
    if (!characterId) { response.status(400).json({ error: "invalid_character_id" }); return; }
    let migrated: ReturnType<typeof migrateLegacySaveV3ToV6>;
    try { migrated = migrateLegacySaveV3ToV6(request.body, new Date().toISOString(), { accountId: request.accountId!, characterId }); }
    catch { response.status(400).json({ error: "invalid_legacy_save" }); return; }
    try {
      const character = await dependencies.repository.importLegacySaveOnce(characterId, request.accountId!, migrated);
      response.json({ character });
    } catch (error) {
      if (error instanceof LegacyImportConflictError) { response.status(409).json({ error: "legacy_import_already_used" }); return; }
      next(error);
    }
  });

  return router;
}

function normalizeCharacterName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  return name.length >= 2 && name.length <= 32 && !/[\u0000-\u001f\u007f]/.test(name) ? name : null;
}
