import type { AppearanceV2, MorphValues } from "./contracts.js";
import { MORPH_KEYS } from "./contracts.js";
import { stableFingerprint } from "./hash.js";

const zeroMorphs = (): MorphValues => Object.fromEntries(MORPH_KEYS.map((key) => [key, 0])) as MorphValues;

export const DEFAULT_APPEARANCE_V2: AppearanceV2 = {
  version: 2,
  bodyId: "wayfarer",
  faceId: "weathered",
  hairId: "pilgrim_knot",
  originId: "gloamfarer",
  skinPaletteId: "umber_04",
  hairPaletteId: "charcoal",
  eyePaletteId: "amber",
  markingId: "none",
  markingPaletteId: "ash",
  morphs: zeroMorphs(),
  plague: { pallor: 0.35, lesions: 0.08, veinDarkening: 0.15, eyeClouding: 0.05 },
  equippedVisualIds: {
    head: null, torso: "patched_road_cloak", legs: null, hands: null, feet: "hide_shoes",
    mainHand: "ashwood_spear", offHand: null, back: "bedroll",
  },
};

const clampUnit = (value: unknown, fallback = 0): number => typeof value === "number" && Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : fallback;
const clamp01 = (value: unknown, fallback = 0): number => typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
const idOr = (value: unknown, fallback: string): string => typeof value === "string" && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(value) ? value : fallback;

export function normalizeAppearanceV2(input: unknown): AppearanceV2 {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const legacyMorphs = source.morphs && typeof source.morphs === "object" ? source.morphs as Record<string, unknown> : {};
  const plague = source.plague && typeof source.plague === "object" ? source.plague as Record<string, unknown> : {};
  const equipped = source.equippedVisualIds && typeof source.equippedVisualIds === "object" ? source.equippedVisualIds as Record<string, unknown> : {};
  const nullableId = (key: keyof AppearanceV2["equippedVisualIds"]): string | null => {
    const value = equipped[key];
    if (value === null) return null;
    const fallback = DEFAULT_APPEARANCE_V2.equippedVisualIds[key];
    return idOr(value, fallback ?? "") || null;
  };
  return {
    version: 2,
    bodyId: idOr(source.bodyId ?? source.body, DEFAULT_APPEARANCE_V2.bodyId),
    faceId: idOr(source.faceId ?? source.face, DEFAULT_APPEARANCE_V2.faceId),
    hairId: idOr(source.hairId ?? source.hair, DEFAULT_APPEARANCE_V2.hairId),
    originId: idOr(source.originId ?? source.origin, DEFAULT_APPEARANCE_V2.originId),
    skinPaletteId: idOr(source.skinPaletteId ?? source.skin, DEFAULT_APPEARANCE_V2.skinPaletteId),
    hairPaletteId: idOr(source.hairPaletteId ?? source.hairColor, DEFAULT_APPEARANCE_V2.hairPaletteId),
    eyePaletteId: idOr(source.eyePaletteId ?? source.eye, DEFAULT_APPEARANCE_V2.eyePaletteId),
    markingId: idOr(source.markingId ?? source.marking, DEFAULT_APPEARANCE_V2.markingId),
    markingPaletteId: idOr(source.markingPaletteId ?? source.markingColor, DEFAULT_APPEARANCE_V2.markingPaletteId),
    morphs: Object.fromEntries(MORPH_KEYS.map((key) => [key, clampUnit(legacyMorphs[key])])) as MorphValues,
    plague: {
      pallor: clamp01(plague.pallor, DEFAULT_APPEARANCE_V2.plague.pallor),
      lesions: clamp01(plague.lesions, DEFAULT_APPEARANCE_V2.plague.lesions),
      veinDarkening: clamp01(plague.veinDarkening, DEFAULT_APPEARANCE_V2.plague.veinDarkening),
      eyeClouding: clamp01(plague.eyeClouding, DEFAULT_APPEARANCE_V2.plague.eyeClouding),
    },
    equippedVisualIds: {
      head: nullableId("head"), torso: nullableId("torso"), legs: nullableId("legs"), hands: nullableId("hands"),
      feet: nullableId("feet"), mainHand: nullableId("mainHand"), offHand: nullableId("offHand"), back: nullableId("back"),
    },
  };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, canonicalize(child)]));
  return value;
}

export function appearanceSignature(appearance: AppearanceV2): string {
  return stableFingerprint(JSON.stringify(canonicalize(appearance))).slice(0, 24);
}
