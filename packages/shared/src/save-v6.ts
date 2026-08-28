import { normalizeAppearanceV2 } from "./appearance.js";
import {
  LEGACY_TILE_SIZE_METERS,
  WORLD_MAX_COORDINATE_METERS,
  type AppearanceV2,
  type LegacySaveV3,
  type ServerSaveV4,
  type ServerSaveV5,
  type WorldTransform,
} from "./contracts.js";
import { isLegacySaveV3, isServerSaveV4, isServerSaveV5, legacySaveFingerprint, legacySaveFingerprintV1 } from "./migration.js";
import {
  HEARTHMERE_SPATIAL_CONTEXT,
  type CoordinateSpaceId,
  type SpatialContext,
} from "./spatial.js";
import { validateAppearanceV2 } from "./validation.js";

export const SERVER_SAVE_SCHEMA_VERSION_V6 = 6 as const;
export const LOCAL_SAVE_SCHEMA_VERSION_V4 = 4 as const;

/** Active encounters are room-resident and deliberately have no crash recovery in this slice. */
export const ACTIVE_ENCOUNTER_DURABILITY = "excluded_not_crash_recoverable" as const;

export const SERVER_SAVE_V6_DEFAULTS = Object.freeze({
  attributes: Object.freeze({ vigor: 5, endurance: 5, attunement: 5 }),
  vitals: Object.freeze({ health: 108, maximumHealth: 108, stamina: 87, maximumStamina: 87, focus: 70, maximumFocus: 70 }),
  techniqueLedgerKeys: Object.freeze([
    "purchasedNodes", "techniquePoints", "awardedTechniqueLevels", "milestoneStates",
    "masteryStates", "actionMastery", "repetition",
  ] as const),
});

export type SaveScalar = string | number | boolean | null;
export type SaveValue = SaveScalar | SaveValue[] | { [key: string]: SaveValue };
export type SaveRecord = { [key: string]: SaveValue };

export interface NamedWorldPosition {
  coordinateSpaceId: CoordinateSpaceId;
  transform: WorldTransform;
  spatial: SpatialContext;
}

export interface SavedVitalsV6 {
  health: number;
  maximumHealth: number;
  stamina: number;
  maximumStamina: number;
  focus: number;
  maximumFocus: number;
}

export interface LegacyImportProtectionV6 {
  schemaVersion: 3;
  importedAt: string;
  fingerprint: string;
  algorithm: "sha256" | "legacy-fnv1a64x4-v1";
}

export interface DurableWorldStateV6 {
  gathered: SaveRecord;
  enemies: SaveRecord[];
}

interface DurableSaveFieldsV6 {
  identity: { accountId: string | null; characterId: string | null };
  character: SaveRecord;
  appearance: AppearanceV2;
  location: NamedWorldPosition;
  vitals: SavedVitalsV6;
  /** Skill XP keyed by stable skill ID. */
  skillXp: SaveRecord;
  /** Purchased techniques and their durable mastery/progression ledgers. */
  techniques: SaveRecord;
  progression: SaveRecord;
  inventory: SaveRecord;
  quests: SaveRecord;
  worldEvents: SaveRecord;
  discoveries: string[];
  respawn: NamedWorldPosition;
  worldState: DurableWorldStateV6;
  trackedQuestId: string | null;
  playSeconds: number;
  legacyImport: LegacyImportProtectionV6 | null;
  /** A declarative limitation, not serialized encounter state. */
  activeEncounterDurability: typeof ACTIVE_ENCOUNTER_DURABILITY;
}

export interface LocalGameSaveV4 extends DurableSaveFieldsV6 {
  version: typeof LOCAL_SAVE_SCHEMA_VERSION_V4;
  contentRevision: number;
}

export interface ServerSaveV6 extends DurableSaveFieldsV6 {
  version: typeof SERVER_SAVE_SCHEMA_VERSION_V6;
  savedAt: string;
}

const TRANSIENT_COMBAT_KEYS = new Set([
  "activeEncounter", "activeEncounters", "turnEncounter", "turnEncounters", "encounterState",
  "cooldown", "cooldowns", "combatCooldowns", "cooldownWindow", "cooldownWindows", "cooldownEndsAt",
  "attackCooldown", "dodgeCooldown", "invulnerable", "invulnerabilityWindow", "invulnerabilityWindows",
  "invulnerabilityWindowMs", "invulnerabilityEndsAt", "hitFlash", "intent", "intents", "intentMoveId",
  "enemyIntent", "enemyIntents", "realtimeIntent", "realtimeEnemyIntent", "realtimeEnemyIntents",
  "actionStartedAt", "windupEndsAt", "impactAt", "recoveryEndsAt",
]);

const SERVER_SAVE_V6_KEYS = new Set([
  "version", "savedAt", "identity", "character", "appearance", "location", "vitals", "skillXp", "techniques",
  "progression", "inventory", "quests", "worldEvents", "discoveries", "respawn", "worldState", "trackedQuestId",
  "playSeconds", "legacyImport", "activeEncounterDurability",
]);
const LOCAL_SAVE_V4_KEYS = new Set([...SERVER_SAVE_V6_KEYS].filter((key) => key !== "savedAt").concat("contentRevision"));
const IDENTITY_KEYS = new Set(["accountId", "characterId"]);
const TRANSFORM_KEYS = new Set(["x", "y", "z", "yaw"]);
const MAX_DURABLE_HORIZONTAL_METERS = 65_536;
const MAX_DURABLE_VERTICAL_METERS = 8_192;
const MAX_DURABLE_YAW_RADIANS = 100_000;

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));
const isPlainRecord = (value: unknown): value is Record<string, unknown> => {
  if (!isRecord(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};
const finite = (value: unknown, fallback = 0): number => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const positive = (value: unknown, fallback: number): number => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
const stringOrNull = (value: unknown): string | null => typeof value === "string" && value.length > 0 ? value : null;
const clamp = (value: number, maximum: number): number => Math.max(0, Math.min(maximum, value));
const validDate = (value: unknown): value is string => typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
const validLegacyFingerprint = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{64}$/.test(value);

function assertKnownKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>, label: string): void {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) throw new Error(`${label} contains unknown fields: ${unknown.sort().join(", ")}`);
}

function assertDenseArray(value: readonly unknown[], label: string): void {
  for (let index = 0; index < value.length; index += 1) if (!Object.hasOwn(value, index)) throw new Error(`${label} cannot be sparse`);
}

function cloneSanitizedValue(value: unknown, label = "save", ancestors = new Set<object>()): SaveValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${label} must contain only finite numbers`);
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    assertDenseArray(value, label);
    if (ancestors.has(value)) throw new Error(`${label} cannot be cyclic`);
    ancestors.add(value);
    const result = value.map((child, index) => cloneSanitizedValue(child, `${label}[${index}]`, ancestors));
    ancestors.delete(value);
    return result;
  }
  if (isPlainRecord(value)) {
    if (ancestors.has(value)) throw new Error(`${label} cannot be cyclic`);
    ancestors.add(value);
    const result: SaveRecord = {};
    for (const [key, child] of Object.entries(value)) {
      if (TRANSIENT_COMBAT_KEYS.has(key)) continue;
      if (child === undefined || typeof child === "function" || typeof child === "symbol" || typeof child === "bigint") throw new Error(`${label}.${key} is not durable JSON`);
      result[key] = cloneSanitizedValue(child, `${label}.${key}`, ancestors);
    }
    ancestors.delete(value);
    return result;
  }
  throw new Error(`${label} must contain only plain durable JSON values`);
}

function cloneRecord(value: unknown, label: string): SaveRecord {
  if (value === undefined || value === null) return {};
  if (!isPlainRecord(value)) throw new Error(`${label} must be an object`);
  return cloneSanitizedValue(value, label) as SaveRecord;
}

function sourcePayload(input: Record<string, unknown>): Record<string, unknown> {
  const legacy = isPlainRecord(input.legacyPayload) ? input.legacyPayload : {};
  const legacyCharacter = isPlainRecord(legacy.character) ? legacy.character : {};
  const character = isPlainRecord(input.character) ? input.character : {};
  return { ...legacy, ...input, character: { ...legacyCharacter, ...character } };
}

function importedFrom(input: Record<string, unknown>, payload: Record<string, unknown>, importedAt: string): LegacyImportProtectionV6 | null {
  const candidate = isPlainRecord(input.importedFrom) ? input.importedFrom : isPlainRecord(input.legacyImport) ? input.legacyImport : null;
  const legacySource = isPlainRecord(input.legacyPayload) && isLegacySaveV3(input.legacyPayload)
    ? input.legacyPayload
    : input.version === 3 && isLegacySaveV3(input) ? input : null;
  if (candidate) {
    if (candidate.schemaVersion !== 3 || !validDate(candidate.importedAt) || !validLegacyFingerprint(candidate.fingerprint)) throw new Error("legacy import protection is malformed");
    let algorithm = candidate.algorithm;
    if (legacySource) {
      if (candidate.fingerprint === legacySaveFingerprint(legacySource)) algorithm = "sha256";
      else if (candidate.fingerprint === legacySaveFingerprintV1(legacySource)) algorithm = "legacy-fnv1a64x4-v1";
      else throw new Error("legacy import fingerprint does not match its source payload");
    }
    if (algorithm !== "sha256" && algorithm !== "legacy-fnv1a64x4-v1") throw new Error("legacy import fingerprint algorithm is malformed");
    return { schemaVersion: 3, importedAt: candidate.importedAt, fingerprint: candidate.fingerprint, algorithm };
  }
  if (legacySource) return { schemaVersion: 3, importedAt, fingerprint: legacySaveFingerprint(legacySource), algorithm: "sha256" };
  return null;
}

function appearanceFrom(payload: Record<string, unknown>): AppearanceV2 {
  const character = isPlainRecord(payload.character) ? payload.character : {};
  const appearance = isPlainRecord(payload.appearance) ? payload.appearance : character.appearance;
  return normalizeAppearanceV2({
    ...(isPlainRecord(appearance) ? appearance : {}),
    originId: isPlainRecord(appearance) && appearance.originId !== undefined ? appearance.originId : character.origin,
  });
}

function attribute(character: Record<string, unknown>, key: "vigor" | "endurance" | "attunement"): number {
  const attributes = isPlainRecord(character.attributes) ? character.attributes : {};
  return positive(attributes[key], SERVER_SAVE_V6_DEFAULTS.attributes[key]);
}

function vitalsFrom(payload: Record<string, unknown>): SavedVitalsV6 {
  const player = isPlainRecord(payload.player) ? payload.player : {};
  const vitals = isPlainRecord(payload.vitals) ? payload.vitals : {};
  const character = isPlainRecord(payload.character) ? payload.character : {};
  const derivedHealth = 78 + attribute(character, "vigor") * 6;
  const derivedStamina = 62 + attribute(character, "endurance") * 5;
  const derivedFocus = 45 + attribute(character, "attunement") * 5;
  const maximumHealth = positive(vitals.maximumHealth ?? vitals.maxHealth ?? player.maxHp, derivedHealth);
  const maximumStamina = positive(vitals.maximumStamina ?? vitals.maxStamina ?? player.maxStamina, derivedStamina);
  const maximumFocus = positive(vitals.maximumFocus ?? vitals.maxFocus ?? player.maxFocus, derivedFocus);
  return {
    health: clamp(finite(vitals.health ?? player.hp, maximumHealth), maximumHealth),
    maximumHealth,
    stamina: clamp(finite(vitals.stamina ?? player.stamina, maximumStamina), maximumStamina),
    maximumStamina,
    focus: clamp(finite(vitals.focus ?? player.focus, maximumFocus), maximumFocus),
    maximumFocus,
  };
}

function transformFromLegacyPlayer(player: Record<string, unknown>): WorldTransform {
  const maximumTile = WORLD_MAX_COORDINATE_METERS / LEGACY_TILE_SIZE_METERS;
  return {
    x: Math.max(0, Math.min(maximumTile, finite(player.x))) * LEGACY_TILE_SIZE_METERS,
    y: 0,
    z: Math.max(0, Math.min(maximumTile, finite(player.y))) * LEGACY_TILE_SIZE_METERS,
    yaw: finite(player.yaw),
  };
}

function validTransform(value: unknown): value is WorldTransform {
  return isPlainRecord(value) && [value.x, value.y, value.z, value.yaw].every((part) => typeof part === "number" && Number.isFinite(part));
}

function validDurableTransform(value: unknown, coordinateSpaceId: string, allowTransientExtras: boolean): value is WorldTransform {
  if (!validTransform(value)) return false;
  if (!allowTransientExtras && Object.keys(value).some((key) => !TRANSFORM_KEYS.has(key))) return false;
  if (Math.abs(value.x) > MAX_DURABLE_HORIZONTAL_METERS || Math.abs(value.z) > MAX_DURABLE_HORIZONTAL_METERS
    || Math.abs(value.y) > MAX_DURABLE_VERTICAL_METERS || Math.abs(value.yaw) > MAX_DURABLE_YAW_RADIANS) return false;
  if (coordinateSpaceId === HEARTHMERE_SPATIAL_CONTEXT.address.coordinateSpaceId) {
    return value.x >= 0 && value.x <= WORLD_MAX_COORDINATE_METERS
      && value.z >= 0 && value.z <= WORLD_MAX_COORDINATE_METERS
      && value.y >= -8 && value.y <= 32;
  }
  return true;
}

function sanitizedTransform(value: WorldTransform): WorldTransform {
  return {
    x: Object.is(value.x, -0) ? 0 : value.x,
    y: Object.is(value.y, -0) ? 0 : value.y,
    z: Object.is(value.z, -0) ? 0 : value.z,
    yaw: Object.is(value.yaw, -0) ? 0 : value.yaw,
  };
}

function validSpatialContext(value: unknown): value is SpatialContext {
  if (!isPlainRecord(value) || !isPlainRecord(value.address)) return false;
  const address = value.address;
  if (typeof address.coordinateSpaceId !== "string" || !address.coordinateSpaceId || typeof address.territoryId !== "string" || !address.territoryId) return false;
  if (address.siteId !== null && typeof address.siteId !== "string") return false;
  if (address.macroCellId !== null && typeof address.macroCellId !== "string") return false;
  if (value.siteTransform === null) return true;
  if (!isPlainRecord(value.siteTransform) || !isPlainRecord(value.siteTransform.atlasOrigin) || !isPlainRecord(value.siteTransform.localAxes)) return false;
  const site = value.siteTransform;
  const origin = site.atlasOrigin as Record<string, unknown>;
  const axes = site.localAxes as Record<string, unknown>;
  return typeof site.siteId === "string" && typeof site.atlasCoordinateSpaceId === "string" && typeof site.localCoordinateSpaceId === "string"
    && [origin.easting, origin.northing, origin.elevation].every((part) => typeof part === "number" && Number.isFinite(part))
    && axes.x === "east" && axes.y === "up" && axes.z === "south";
}

function cloneSpatialContext(value: SpatialContext, label: string): SpatialContext {
  return cloneSanitizedValue(value, label) as unknown as SpatialContext;
}

function position(transform: WorldTransform, spatial: SpatialContext = HEARTHMERE_SPATIAL_CONTEXT): NamedWorldPosition {
  return { coordinateSpaceId: spatial.address.coordinateSpaceId, transform: sanitizedTransform(transform), spatial: cloneSpatialContext(spatial, "spatial") };
}

function locationFrom(input: Record<string, unknown>, payload: Record<string, unknown>): NamedWorldPosition {
  const existing = isPlainRecord(input.location) ? input.location : null;
  if (existing) {
    if (!validTransform(existing.transform) || !validSpatialContext(existing.spatial)) throw new Error("location is malformed");
    const coordinateSpaceId = typeof existing.coordinateSpaceId === "string" && existing.coordinateSpaceId ? existing.coordinateSpaceId : existing.spatial.address.coordinateSpaceId;
    if (coordinateSpaceId !== existing.spatial.address.coordinateSpaceId) throw new Error("location coordinate space does not match its spatial address");
    return { coordinateSpaceId, transform: sanitizedTransform(existing.transform), spatial: cloneSpatialContext(existing.spatial, "location.spatial") };
  }
  const spatial = input.spatial === undefined ? HEARTHMERE_SPATIAL_CONTEXT : input.spatial;
  if (!validSpatialContext(spatial)) throw new Error("spatial context is malformed");
  if (validTransform(input.transform)) return position(input.transform, spatial);
  const player = isPlainRecord(payload.player) ? payload.player : {};
  return position(transformFromLegacyPlayer(player), spatial);
}

function respawnFrom(payload: Record<string, unknown>, location: NamedWorldPosition): NamedWorldPosition {
  const existing = isPlainRecord(payload.respawn) ? payload.respawn : null;
  if (existing && "transform" in existing) {
    if (!validTransform(existing.transform)) throw new Error("respawn transform is malformed");
    const spatial = existing.spatial === undefined ? location.spatial : existing.spatial;
    if (!validSpatialContext(spatial)) throw new Error("respawn spatial context is malformed");
    const coordinateSpaceId = typeof existing.coordinateSpaceId === "string" && existing.coordinateSpaceId ? existing.coordinateSpaceId : spatial.address.coordinateSpaceId;
    if (coordinateSpaceId !== spatial.address.coordinateSpaceId) throw new Error("respawn coordinate space does not match its spatial address");
    return { coordinateSpaceId, transform: sanitizedTransform(existing.transform), spatial: cloneSpatialContext(spatial, "respawn.spatial") };
  }
  if (existing && typeof existing.x === "number" && typeof existing.y === "number") return position(transformFromLegacyPlayer(existing), location.spatial);
  return position(location.transform, location.spatial);
}

function emptyTechniqueLedgers(): SaveRecord {
  return Object.fromEntries(SERVER_SAVE_V6_DEFAULTS.techniqueLedgerKeys.map((key) => [key, {}]));
}

function techniquesFrom(payload: Record<string, unknown>): SaveRecord {
  const progression = isPlainRecord(payload.progression) ? payload.progression : {};
  const explicit = cloneRecord(payload.techniques, "techniques");
  const result = { ...emptyTechniqueLedgers(), ...explicit };
  for (const key of SERVER_SAVE_V6_DEFAULTS.techniqueLedgerKeys) result[key] = cloneRecord(explicit[key] ?? progression[key], `techniques.${key}`);
  return result;
}

function discoveriesFrom(payload: Record<string, unknown>): string[] {
  const discoveries = Array.isArray(payload.discoveries) ? payload.discoveries : Array.isArray(payload.discovered) ? payload.discovered : [];
  assertDenseArray(discoveries, "discoveries");
  if (discoveries.some((entry) => typeof entry !== "string" || !entry)) throw new Error("discoveries must contain stable string IDs");
  return [...new Set(discoveries as string[])];
}

function worldStateFrom(payload: Record<string, unknown>): DurableWorldStateV6 {
  const worldState = isPlainRecord(payload.worldState) ? payload.worldState : {};
  const enemySource = worldState.enemies ?? payload.enemies;
  if (enemySource !== undefined && !Array.isArray(enemySource)) throw new Error("worldState.enemies must be an array");
  const enemies = Array.isArray(enemySource)
    ? (assertDenseArray(enemySource, "worldState.enemies"), enemySource.map((enemy, index) => cloneRecord(enemy, `worldState.enemies[${index}]`)))
    : [];
  return { gathered: cloneRecord(worldState.gathered ?? payload.gathered, "worldState.gathered"), enemies };
}

function durableFields(input: Record<string, unknown>, importedAt: string): DurableSaveFieldsV6 {
  const payload = sourcePayload(input);
  const character = cloneRecord(payload.character, "character");
  if (typeof character.name !== "string" || !character.name.trim()) character.name = "The Unnamed";
  const location = locationFrom(input, payload);
  return {
    identity: {
      accountId: stringOrNull(input.accountId) ?? (isPlainRecord(input.identity) ? stringOrNull(input.identity.accountId) : null) ?? stringOrNull(payload.accountId),
      characterId: stringOrNull(input.characterId) ?? (isPlainRecord(input.identity) ? stringOrNull(input.identity.characterId) : null) ?? stringOrNull(payload.characterId) ?? stringOrNull(character.id),
    },
    character,
    appearance: appearanceFrom(payload),
    location,
    vitals: vitalsFrom(payload),
    skillXp: cloneRecord(payload.skillXp ?? payload.skills ?? payload.experience, "skillXp"),
    techniques: techniquesFrom(payload),
    progression: cloneRecord(payload.progression, "progression"),
    inventory: cloneRecord(payload.inventory, "inventory"),
    quests: cloneRecord(payload.quests, "quests"),
    worldEvents: cloneRecord(payload.worldEvents, "worldEvents"),
    discoveries: discoveriesFrom(payload),
    respawn: respawnFrom(payload, location),
    worldState: worldStateFrom(payload),
    trackedQuestId: stringOrNull(payload.trackedQuestId) ?? stringOrNull(payload.trackedQuest),
    playSeconds: Math.max(0, finite(payload.playSeconds)),
    legacyImport: importedFrom(input, payload, importedAt),
    activeEncounterDurability: ACTIVE_ENCOUNTER_DURABILITY,
  };
}

function validVitals(value: unknown): value is SavedVitalsV6 {
  if (!isPlainRecord(value)) return false;
  const fields = [value.health, value.maximumHealth, value.stamina, value.maximumStamina, value.focus, value.maximumFocus];
  return fields.every((part) => typeof part === "number" && Number.isFinite(part) && part >= 0)
    && Number(value.maximumHealth) > 0 && Number(value.maximumStamina) > 0 && Number(value.maximumFocus) > 0
    && Number(value.health) <= Number(value.maximumHealth) && Number(value.stamina) <= Number(value.maximumStamina) && Number(value.focus) <= Number(value.maximumFocus);
}

function validNamedPosition(value: unknown, allowTransientExtras: boolean): value is NamedWorldPosition {
  return isPlainRecord(value) && typeof value.coordinateSpaceId === "string" && Boolean(value.coordinateSpaceId)
    && validDurableTransform(value.transform, value.coordinateSpaceId, allowTransientExtras) && validSpatialContext(value.spatial)
    && value.coordinateSpaceId === value.spatial.address.coordinateSpaceId;
}

function assertDurableJsonTree(value: unknown, label: string, rejectTransient: boolean, ancestors = new Set<object>()): void {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") { if (!Number.isFinite(value)) throw new Error(`${label} contains a non-finite number`); return; }
  if (Array.isArray(value)) {
    assertDenseArray(value, label);
    if (ancestors.has(value)) throw new Error(`${label} cannot be cyclic`);
    ancestors.add(value); value.forEach((child, index) => assertDurableJsonTree(child, `${label}[${index}]`, rejectTransient, ancestors)); ancestors.delete(value); return;
  }
  if (!isPlainRecord(value)) throw new Error(`${label} must contain only plain JSON values`);
  if (ancestors.has(value)) throw new Error(`${label} cannot be cyclic`);
  ancestors.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (rejectTransient && TRANSIENT_COMBAT_KEYS.has(key)) throw new Error(`${label}.${key} is transient combat state`);
    if (child === undefined || typeof child === "function" || typeof child === "symbol" || typeof child === "bigint") throw new Error(`${label}.${key} is not durable JSON`);
    assertDurableJsonTree(child, `${label}.${key}`, rejectTransient, ancestors);
  }
  ancestors.delete(value);
}

function assertSaveFields(value: Record<string, unknown>, rejectTransient: boolean): void {
  assertDurableJsonTree(value, "save", rejectTransient);
  if (!isPlainRecord(value.identity)) throw new Error("identity is malformed");
  assertKnownKeys(value.identity, IDENTITY_KEYS, "identity");
  if ((value.identity.accountId !== null && (typeof value.identity.accountId !== "string" || !value.identity.accountId))
    || (value.identity.characterId !== null && (typeof value.identity.characterId !== "string" || !value.identity.characterId))) throw new Error("identity is malformed");
  if (!isPlainRecord(value.character) || typeof value.character.name !== "string" || !value.character.name.trim()) throw new Error("character is malformed");
  if (!validateAppearanceV2(value.appearance).ok) throw new Error("appearance is malformed");
  if (!validNamedPosition(value.location, !rejectTransient) || !validNamedPosition(value.respawn, !rejectTransient)) throw new Error("named coordinates are malformed");
  if (!validVitals(value.vitals)) throw new Error("vitals are malformed");
  for (const key of ["skillXp", "techniques", "progression", "inventory", "quests", "worldEvents"] as const) if (!isPlainRecord(value[key])) throw new Error(`${key} must be an object`);
  if (isPlainRecord(value.skillXp) && Object.values(value.skillXp).some((xp) => typeof xp !== "number" || !Number.isFinite(xp) || xp < 0)) throw new Error("skillXp is malformed");
  if (isPlainRecord(value.inventory) && Object.values(value.inventory).some((quantity) => typeof quantity !== "number" || !Number.isFinite(quantity) || quantity < 0)) throw new Error("inventory is malformed");
  if (isPlainRecord(value.techniques)) for (const ledger of SERVER_SAVE_V6_DEFAULTS.techniqueLedgerKeys) if (!isPlainRecord(value.techniques[ledger])) throw new Error(`techniques.${ledger} is malformed`);
  if (!Array.isArray(value.discoveries) || value.discoveries.some((entry) => typeof entry !== "string" || !entry) || new Set(value.discoveries).size !== value.discoveries.length) throw new Error("discoveries are malformed");
  if (!isPlainRecord(value.worldState) || !isPlainRecord(value.worldState.gathered) || !Array.isArray(value.worldState.enemies) || value.worldState.enemies.some((enemy) => !isPlainRecord(enemy))) throw new Error("worldState is malformed");
  if (value.trackedQuestId !== null && typeof value.trackedQuestId !== "string") throw new Error("trackedQuestId is malformed");
  if (typeof value.playSeconds !== "number" || !Number.isFinite(value.playSeconds) || value.playSeconds < 0) throw new Error("playSeconds is malformed");
  if (value.legacyImport !== null) {
    if (!isPlainRecord(value.legacyImport) || value.legacyImport.schemaVersion !== 3 || !validDate(value.legacyImport.importedAt) || !validLegacyFingerprint(value.legacyImport.fingerprint)
      || (value.legacyImport.algorithm !== "sha256" && value.legacyImport.algorithm !== "legacy-fnv1a64x4-v1")) throw new Error("legacyImport is malformed");
  }
  if (value.activeEncounterDurability !== ACTIVE_ENCOUNTER_DURABILITY) throw new Error("active encounter durability marker is malformed");
}

function assertServerSaveV6Shape(value: unknown, rejectTransient: boolean): asserts value is ServerSaveV6 {
  if (!isPlainRecord(value) || value.version !== SERVER_SAVE_SCHEMA_VERSION_V6 || !validDate(value.savedAt)) throw new Error("ServerSaveV6 header is malformed");
  if (Object.hasOwn(value, "accountId") || Object.hasOwn(value, "characterId")) throw new Error("ServerSaveV6 cannot contain legacy root identity aliases");
  const allowed = rejectTransient ? SERVER_SAVE_V6_KEYS : new Set([...SERVER_SAVE_V6_KEYS, ...TRANSIENT_COMBAT_KEYS]);
  assertKnownKeys(value, allowed, "ServerSaveV6");
  assertSaveFields(value, rejectTransient);
  if (!isPlainRecord(value.identity) || value.identity.accountId === null || value.identity.characterId === null) throw new Error("ServerSaveV6 identity must be bound to an account and character");
}

function assertLocalGameSaveV4Shape(value: unknown, rejectTransient: boolean): asserts value is LocalGameSaveV4 {
  if (!isPlainRecord(value) || value.version !== LOCAL_SAVE_SCHEMA_VERSION_V4 || !Number.isSafeInteger(value.contentRevision) || Number(value.contentRevision) < 0) throw new Error("LocalGameSaveV4 header is malformed");
  const allowed = rejectTransient ? LOCAL_SAVE_V4_KEYS : new Set([...LOCAL_SAVE_V4_KEYS, ...TRANSIENT_COMBAT_KEYS]);
  assertKnownKeys(value, allowed, "LocalGameSaveV4");
  assertSaveFields(value, rejectTransient);
}

function assertServerSaveV4(value: unknown): asserts value is ServerSaveV4 {
  if (!isServerSaveV4(value) || !validateAppearanceV2(value.character.appearance).ok) throw new Error("ServerSaveV4 is malformed");
  assertDurableJsonTree(value, "serverSaveV4", false);
}

function assertServerSaveV5(value: unknown): asserts value is ServerSaveV5 {
  if (!isServerSaveV5(value) || !validateAppearanceV2(value.character.appearance).ok || !validSpatialContext(value.spatial)) throw new Error("ServerSaveV5 is malformed");
  assertDurableJsonTree(value, "serverSaveV5", false);
}

function finalizeServerSave(fields: DurableSaveFieldsV6, savedAt: string): ServerSaveV6 {
  if (!validDate(savedAt)) throw new Error("savedAt must be an ISO-compatible timestamp");
  const save: ServerSaveV6 = { version: SERVER_SAVE_SCHEMA_VERSION_V6, savedAt, ...fields };
  assertServerSaveV6Shape(save, true);
  return save;
}

function withBoundIdentity(fields: DurableSaveFieldsV6, identity?: { accountId: string; characterId: string }): DurableSaveFieldsV6 {
  return identity ? { ...fields, identity: { ...identity } } : fields;
}

export function migrateLocalSaveV3ToV4(input: unknown, importedAt = new Date().toISOString()): LocalGameSaveV4 {
  if (!isLegacySaveV3(input)) throw new Error("Only validated local schema-v3 saves can migrate to LocalGameSaveV4");
  assertDurableJsonTree(input, "localSaveV3", false);
  const save: LocalGameSaveV4 = { version: LOCAL_SAVE_SCHEMA_VERSION_V4, contentRevision: Math.max(0, Math.floor(finite(input.contentRevision))), ...durableFields(input, importedAt) };
  assertLocalGameSaveV4Shape(save, true);
  return save;
}

export function migrateServerSaveV4ToV6(input: ServerSaveV4, savedAt = new Date().toISOString(), identity?: { accountId: string; characterId: string }): ServerSaveV6 {
  assertServerSaveV4(input);
  return finalizeServerSave(withBoundIdentity(durableFields(input as unknown as Record<string, unknown>, savedAt), identity), savedAt);
}

export function migrateServerSaveV5ToV6(input: ServerSaveV5, savedAt = new Date().toISOString(), identity?: { accountId: string; characterId: string }): ServerSaveV6 {
  assertServerSaveV5(input);
  return finalizeServerSave(withBoundIdentity(durableFields(input as unknown as Record<string, unknown>, savedAt), identity), savedAt);
}

export function migrateLegacySaveV3ToV6(input: unknown, importedAt = new Date().toISOString(), identity?: { accountId: string; characterId: string }): ServerSaveV6 {
  if (!isLegacySaveV3(input)) throw new Error("Only validated schema-v3 saves can migrate to ServerSaveV6");
  assertDurableJsonTree(input, "legacySaveV3", false);
  return finalizeServerSave(withBoundIdentity(durableFields(input, importedAt), identity), importedAt);
}

export function isLocalGameSaveV4(value: unknown): value is LocalGameSaveV4 {
  try { assertLocalGameSaveV4Shape(value, true); return true; } catch { return false; }
}

export function isServerSaveV6(value: unknown): value is ServerSaveV6 {
  try { assertServerSaveV6Shape(value, true); return true; } catch { return false; }
}

/**
 * Idempotent entrypoint for durable v3/v4/v5/v6 records. A valid V6 input is
 * still cloned and rebuilt, so nested transient fields cannot bypass sanitation.
 */
export function migrateServerSaveToV6(input: unknown, now = new Date().toISOString(), identity?: { accountId: string; characterId: string }): ServerSaveV6 {
  if (!isPlainRecord(input)) throw new Error("Save root must be a plain object");
  if (input.version === SERVER_SAVE_SCHEMA_VERSION_V6) {
    assertServerSaveV6Shape(input, false);
    return finalizeServerSave(durableFields(input, input.savedAt), input.savedAt);
  }
  if (input.version === 5) return migrateServerSaveV5ToV6(input as unknown as ServerSaveV5, now, identity);
  if (input.version === 4 && "transform" in input) return migrateServerSaveV4ToV6(input as unknown as ServerSaveV4, now, identity);
  if (input.version === 4) {
    assertLocalGameSaveV4Shape(input, false);
    return finalizeServerSave(withBoundIdentity(durableFields(input, now), identity), now);
  }
  if (input.version === 3) return migrateLegacySaveV3ToV6(input, now, identity);
  throw new Error(`Unsupported save schema ${String(input.version)}`);
}
