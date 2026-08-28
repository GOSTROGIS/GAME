import { DEFAULT_APPEARANCE_V2, normalizeAppearanceV2 } from "./appearance.js";
import { LEGACY_TILE_SIZE_METERS, WORLD_MAX_COORDINATE_METERS, type LegacySaveV3, type ServerSaveV4, type ServerSaveV5 } from "./contracts.js";
import { sha256Fingerprint, stableFingerprint } from "./hash.js";
import { HEARTHMERE_SPATIAL_CONTEXT, type SpatialContext } from "./spatial.js";

const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (record(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

export function legacySaveFingerprint(save: LegacySaveV3): string {
  return sha256Fingerprint(canonicalJson(save));
}

/** Compatibility identity for saves issued before V6; never label this SHA-256. */
export function legacySaveFingerprintV1(save: LegacySaveV3): string {
  return stableFingerprint(canonicalJson(save));
}

export function isLegacySaveV3(value: unknown): value is LegacySaveV3 {
  if (!record(value) || value.version !== 3 || !record(value.player)) return false;
  return Number.isFinite(value.player.x) && Number.isFinite(value.player.y);
}

export function migrateLegacyV3Save(input: unknown, importedAt = new Date().toISOString()): ServerSaveV4 {
  if (!isLegacySaveV3(input)) throw new Error("Only validated schema-v3 saves can be imported");
  const legacyAppearance = record(input.character?.appearance) ? input.character.appearance : {};
  const appearance = normalizeAppearanceV2({ ...legacyAppearance, originId: input.character?.origin ?? DEFAULT_APPEARANCE_V2.originId });
  const tileX = Math.max(0, Math.min(WORLD_MAX_COORDINATE_METERS / LEGACY_TILE_SIZE_METERS, input.player.x));
  const tileY = Math.max(0, Math.min(WORLD_MAX_COORDINATE_METERS / LEGACY_TILE_SIZE_METERS, input.player.y));
  return {
    version: 4,
    importedFrom: { schemaVersion: 3, importedAt, fingerprint: legacySaveFingerprint(input) },
    character: {
      name: typeof input.character?.name === "string" && input.character.name.trim() ? input.character.name.trim().slice(0, 32) : "The Unnamed",
      appearance,
    },
    transform: { x: tileX * LEGACY_TILE_SIZE_METERS, y: 0, z: tileY * LEGACY_TILE_SIZE_METERS, yaw: 0 },
    legacyPayload: input,
  };
}

export function isServerSaveV4(value: unknown): value is ServerSaveV4 {
  if (!record(value) || value.version !== 4 || !record(value.character) || !record(value.transform)) return false;
  const transform = value.transform;
  return [transform.x, transform.y, transform.z, transform.yaw].every(Number.isFinite);
}

export function isServerSaveV5(value: unknown): value is ServerSaveV5 {
  if (!record(value) || value.version !== 5 || !record(value.character) || !record(value.transform) || !record(value.spatial)) return false;
  const transform = value.transform;
  return [transform.x, transform.y, transform.z, transform.yaw].every(Number.isFinite)
    && record(value.spatial.address)
    && typeof value.spatial.address.coordinateSpaceId === "string";
}

export function migrateServerSaveV4ToV5(
  input: ServerSaveV4,
  spatial: SpatialContext = HEARTHMERE_SPATIAL_CONTEXT,
): ServerSaveV5 {
  return {
    version: 5,
    importedFrom: input.importedFrom,
    character: input.character,
    transform: input.transform,
    spatial,
    legacyPayload: input.legacyPayload,
  };
}

export function migrateLegacyV3SaveToV5(input: unknown, importedAt = new Date().toISOString()): ServerSaveV5 {
  return migrateServerSaveV4ToV5(migrateLegacyV3Save(input, importedAt));
}

/** Idempotent public entrypoint for v3 imports and durable v4/v5 records. */
export function migrateServerSaveToV5(input: unknown, importedAt = new Date().toISOString()): ServerSaveV5 {
  if (isServerSaveV5(input)) return input;
  if (isServerSaveV4(input)) return migrateServerSaveV4ToV5(input);
  return migrateLegacyV3SaveToV5(input, importedAt);
}
