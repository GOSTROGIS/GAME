export const NARRATIVE_TARGETS: Readonly<Record<string, unknown>>;
export const QUEST_AUTHORING_LAW: Readonly<Record<string, unknown>>;
export const WORLD_PREMISE: Readonly<Record<string, unknown>>;
export const COSMIC_FACTIONS: readonly unknown[];
export const EXPANSION_PRINCIPALS: readonly unknown[];
export const QUEST_SUPPORT_CHARACTERS: readonly unknown[];
export const EXPANSION_CHARACTERS: readonly unknown[];
export const EXPANSION_CREATURES: readonly unknown[];
export const ALIGNMENT_HOOKS: readonly unknown[];
export const EXPANSION_ITEMS: readonly unknown[];
export const EXPANSION_QUESTS: readonly unknown[];
export const COMPANION_QUEST_CONTRACTS: readonly unknown[];
export const COMPANION_AGENCY_CONTRACTS: readonly unknown[];
export const BOUNDED_PARTICIPATION_CONTRACTS: readonly unknown[];
export const QUEST_ACTOR_CONTRACTS: readonly unknown[];
export function questSimilarity(left: unknown, right: unknown): number;
export function interpretCanonicalQuestStateRead(
  questOrId: string | Readonly<{ id: string }>,
  read: Readonly<Record<string, unknown>>,
  stateByDomain: Readonly<Record<string, Readonly<Record<string, unknown>>>>,
  context?: Readonly<Record<string, unknown>>,
): Readonly<{ readKind: string; domain: string; key: string; value: string; satisfied: boolean }>;
export function validateNarrativeExpansion(input?: Readonly<Record<string, readonly unknown[]>>): unknown;
