import type { ActionCommand, AppearanceV2, InputFrame, TravelRequest, WorldTransform } from "./contracts.js";
import { MORPH_KEYS, WORLD_SIZE_METERS } from "./contracts.js";

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const sequence = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const safeId = (value: unknown): value is string => typeof value === "string" && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(value);
const contentTargetId = (value: unknown): value is string => typeof value === "string" && /^[a-z0-9][a-z0-9._-]{0,95}$/.test(value);

export function validateWorldTransform(value: unknown): ValidationResult<WorldTransform> {
  if (!record(value)) return { ok: false, errors: ["transform must be an object"] };
  const errors: string[] = [];
  for (const key of ["x", "y", "z", "yaw"] as const) if (!finite(value[key])) errors.push(`${key} must be finite`);
  if (finite(value.x) && (value.x < 0 || value.x >= WORLD_SIZE_METERS)) errors.push("x is outside Hearthmere");
  if (finite(value.z) && (value.z < 0 || value.z >= WORLD_SIZE_METERS)) errors.push("z is outside Hearthmere");
  if (finite(value.y) && (value.y < -8 || value.y > 32)) errors.push("y is outside Hearthmere vertical bounds");
  return errors.length ? { ok: false, errors } : { ok: true, value: value as unknown as WorldTransform };
}

export function validateAppearanceV2(value: unknown): ValidationResult<AppearanceV2> {
  if (!record(value)) return { ok: false, errors: ["appearance must be an object"] };
  const errors: string[] = [];
  if (value.version !== 2) errors.push("appearance version must be 2");
  for (const key of ["bodyId", "faceId", "hairId", "originId", "skinPaletteId", "hairPaletteId", "eyePaletteId", "markingId", "markingPaletteId"] as const) {
    if (!safeId(value[key])) errors.push(`${key} must be a stable ID`);
  }
  if (!record(value.morphs)) errors.push("morphs must be an object");
  else for (const key of MORPH_KEYS) if (!finite(value.morphs[key]) || Number(value.morphs[key]) < -1 || Number(value.morphs[key]) > 1) errors.push(`${key} must be between -1 and 1`);
  if (!record(value.plague)) errors.push("plague must be an object");
  else for (const key of ["pallor", "lesions", "veinDarkening", "eyeClouding"] as const) if (!finite(value.plague[key]) || Number(value.plague[key]) < 0 || Number(value.plague[key]) > 1) errors.push(`${key} must be between 0 and 1`);
  if (!record(value.equippedVisualIds)) errors.push("equippedVisualIds must be an object");
  else for (const key of ["head", "torso", "legs", "hands", "feet", "mainHand", "offHand", "back"] as const) {
    const field = value.equippedVisualIds[key];
    if (field !== null && !safeId(field)) errors.push(`${key} must be null or a stable ID`);
  }
  return errors.length ? { ok: false, errors } : { ok: true, value: value as unknown as AppearanceV2 };
}

export function validateInputFrame(value: unknown): ValidationResult<InputFrame> {
  if (!record(value)) return { ok: false, errors: ["input must be an object"] };
  const errors: string[] = [];
  if (!sequence(value.sequence)) errors.push("sequence must be a non-negative safe integer");
  if (!sequence(value.clientTick)) errors.push("clientTick must be a non-negative safe integer");
  for (const key of ["moveX", "moveZ"] as const) if (!finite(value[key]) || Math.abs(Number(value[key])) > 1) errors.push(`${key} must be between -1 and 1`);
  if (!finite(value.yaw) || Math.abs(value.yaw) > Math.PI * 4) errors.push("yaw is outside accepted bounds");
  if (typeof value.sprint !== "boolean") errors.push("sprint must be boolean");
  return errors.length ? { ok: false, errors } : { ok: true, value: value as unknown as InputFrame };
}

export function validateTravelRequest(value: unknown): ValidationResult<TravelRequest> {
  if (!record(value)) return { ok: false, errors: ["travel request must be an object"] };
  const errors: string[] = [];
  if (!sequence(value.sequence)) errors.push("sequence must be a non-negative safe integer");
  if (!sequence(value.clientTick)) errors.push("clientTick must be a non-negative safe integer");
  const destination = validateWorldTransform(value.destination);
  if (!destination.ok) errors.push(...destination.errors.map((error) => `destination.${error}`));
  return errors.length ? { ok: false, errors } : { ok: true, value: value as unknown as TravelRequest };
}

const actionKinds = new Set(["light_attack", "heavy_attack", "dodge", "interact", "gather", "craft"]);

export function validateActionCommand(value: unknown): ValidationResult<ActionCommand> {
  if (!record(value)) return { ok: false, errors: ["action must be an object"] };
  const errors: string[] = [];
  if (!safeId(value.commandId)) errors.push("commandId must be a stable ID");
  if (!sequence(value.sequence)) errors.push("sequence must be a non-negative safe integer");
  if (!sequence(value.clientTick)) errors.push("clientTick must be a non-negative safe integer");
  if (typeof value.kind !== "string" || !actionKinds.has(value.kind)) errors.push("kind is unknown");
  if (value.targetId !== undefined && !contentTargetId(value.targetId)) errors.push("targetId must be a stable content ID");
  if (value.recipeId !== undefined && !safeId(value.recipeId)) errors.push("recipeId must be a stable ID");
  if (value.directionYaw !== undefined && !finite(value.directionYaw)) errors.push("directionYaw must be finite");
  if (value.kind === "craft" && !safeId(value.recipeId)) errors.push("craft requires recipeId");
  if (["light_attack", "heavy_attack", "interact", "gather"].includes(String(value.kind)) && !contentTargetId(value.targetId)) errors.push(`${String(value.kind)} requires targetId`);
  return errors.length ? { ok: false, errors } : { ok: true, value: value as unknown as ActionCommand };
}
