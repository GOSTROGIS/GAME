import {
  ALIGNMENT_HOOKS as alignmentHooksData,
  COSMIC_FACTIONS as factionData,
  EXPANSION_CHARACTERS as characterData,
  EXPANSION_PRINCIPALS as principalData,
  EXPANSION_CREATURES as creatureData,
  EXPANSION_ITEMS as itemData,
  EXPANSION_QUESTS as questData,
  NARRATIVE_TARGETS as targetsData,
  QUEST_AUTHORING_LAW as authoringLawData,
  QUEST_SUPPORT_CHARACTERS as questSupportData,
  WORLD_PREMISE as premiseData,
  questSimilarity as similarityData,
  validateNarrativeExpansion as validateData,
} from "./narrative.data.js";

export type CosmicAlignment = "restoration" | "opposition" | "mortal_continuity";
export type ExpansionArtStatus = "awaiting-art" | "in-review" | "accepted" | "refused";
export type ExpansionModelStatus = "unassessed" | "queued" | "sculpted" | "animated" | "refused";
export type QuestStateDomain = "authority" | "admission" | "memory" | "ecology" | "infrastructure" | "obligation";
export type QuestStateReadMode = "all-values" | "value-precondition";
export type QuestPortfolioId = "main_cosmic" | "faction_schism" | "character_guest_follower" | "regional" | "settlement" | "profession_systemic" | "world_state_reaction" | "relic_creature_ecology";

export interface CosmicFaction {
  readonly id: string;
  readonly name: string;
  readonly alignment: CosmicAlignment;
  readonly iconography: string;
  readonly publicDoctrine: string;
  readonly indispensableTruth: string;
  readonly unforgivableMethod: string;
  readonly internalSchism: string;
  readonly playerRelations: readonly string[];
}

export interface ExpansionAssetPipeline {
  readonly family: string;
  readonly conceptMaster: string | null;
  readonly transparentCutout: string | null;
  readonly staticModel: string | null;
  readonly animatedModel: string | null;
  readonly artStatus: ExpansionArtStatus;
  readonly staticModelStatus: ExpansionModelStatus;
  readonly animatedModelStatus: ExpansionModelStatus;
}

export interface ExpansionCharacter {
  readonly id: string;
  readonly name: string;
  readonly epithet: string;
  readonly factionId: string;
  readonly role: string;
  readonly desire: string;
  readonly fear: string;
  readonly contradiction: string;
  readonly secret: string;
  readonly voice: { readonly cadence: string; readonly imagery: string; readonly signature: string };
  readonly alignmentOptions: readonly string[];
  readonly visualBrief: string;
  readonly questArcIds: readonly string[];
  readonly pipeline: ExpansionAssetPipeline;
}

export interface ExpansionCreature {
  readonly schemaVersion: 1;
  readonly genericTemplateAllowed: false;
  readonly id: string;
  readonly name: string;
  readonly familyId: string;
  readonly factionAffinityIds: readonly string[];
  readonly rank: string;
  readonly combatRole: string;
  readonly anatomy: string;
  readonly locomotion: string;
  readonly ecology: string;
  readonly origin: string;
  readonly mechanic: { readonly id: string; readonly cue: string; readonly counterplay: string };
  readonly narrativeUse: string;
  readonly visualBrief: string;
  readonly pipeline: ExpansionAssetPipeline;
}

export interface ExpansionItem {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly mechanic: string;
  readonly lore: string;
}

export interface ExpansionQuestObjective {
  readonly type: string;
  readonly target: string;
  readonly required?: number;
  readonly rule?: string;
}

export interface QuestAuthorshipProof {
  readonly setpiece: string;
  readonly failureTransformation: string;
  readonly dialogueConstraint: string;
  readonly persistentWorldChange: string;
  readonly forbiddenSubstitution: string;
}

export interface QuestStateReadContract {
  readonly key: string;
  readonly mode: QuestStateReadMode;
  readonly values: readonly string[];
}

export interface ExpansionQuest {
  readonly schemaVersion: 2;
  readonly id: string;
  readonly chainId: string;
  readonly order: number;
  readonly type: "main" | "side" | "faction" | "character" | "regional" | "world";
  readonly portfolioId: QuestPortfolioId;
  readonly title: string;
  readonly giverId: string;
  readonly supportingCharacterIds: readonly string[];
  readonly creatureIds: readonly string[];
  readonly stateDomain: QuestStateDomain;
  readonly stateReads: readonly QuestStateReadContract[];
  readonly stateWrites: readonly { readonly domain: QuestStateDomain; readonly key: string; readonly values: readonly string[] }[];
  readonly premise: string;
  readonly primaryMechanicId: string;
  readonly dilemmaId: string;
  readonly locationId: string;
  readonly consequenceId: string;
  readonly objectives: readonly ExpansionQuestObjective[];
  readonly outcomes: readonly string[];
  readonly rewardItemIds: readonly string[];
  readonly loreReveal: string;
  readonly dialogueThesis: string;
  readonly authorshipProof: QuestAuthorshipProof;
}

export interface NarrativeValidationResult {
  readonly valid: boolean;
  readonly errors: readonly { readonly path: string; readonly code: string; readonly message: string }[];
  readonly stats: { readonly factions: number; readonly characters: number; readonly creatures: number; readonly items: number; readonly quests: number; readonly capacityTarget: number };
}

export const NARRATIVE_TARGETS = targetsData as Readonly<{
  foundingBestiaryForms: 178;
  foundingNamedCharacters: 42;
  foundingOrigins: 8;
  authoredQuestTarget: 5000;
  expansionCharacterLimit: null;
  expansionCreatureLimit: null;
  uniqueSupportingCharacterPerQuest: true;
  uniqueSignatureItemPerQuest: true;
  genericEnemiesAllowed: false;
  policy: string;
}>;
export const QUEST_AUTHORING_LAW = authoringLawData as Readonly<{
  batchSize: 12;
  independentReviewers: 2;
  authorMayApproveOwnQuest: false;
  immutableAfterAcceptance: true;
  requiredProofFields: readonly (keyof QuestAuthorshipProof)[];
  collisionAxes: readonly string[];
  rejectionRule: string;
  productionRule: string;
  stateDomains: readonly QuestStateDomain[];
  stateReadModes: readonly QuestStateReadMode[];
  portfolioIds: readonly QuestPortfolioId[];
}>;
export const WORLD_PREMISE = premiseData as Readonly<Record<string, string>>;
export const COSMIC_FACTIONS = factionData as readonly CosmicFaction[];
export const EXPANSION_CHARACTERS = characterData as readonly ExpansionCharacter[];
export const EXPANSION_PRINCIPALS = principalData as readonly ExpansionCharacter[];
export const QUEST_SUPPORT_CHARACTERS = questSupportData as readonly ExpansionCharacter[];
export const EXPANSION_CREATURES = creatureData as readonly ExpansionCreature[];
export const ALIGNMENT_HOOKS = alignmentHooksData as readonly { readonly characterId: string; readonly affinities: readonly string[]; readonly fracture: string }[];
export const EXPANSION_ITEMS = itemData as readonly ExpansionItem[];
export const EXPANSION_QUESTS = questData as readonly ExpansionQuest[];

export const EXPANSION_CHARACTER_BY_ID: ReadonlyMap<string, ExpansionCharacter> = new Map(EXPANSION_CHARACTERS.map((character) => [character.id, character]));
export const EXPANSION_CREATURE_BY_ID: ReadonlyMap<string, ExpansionCreature> = new Map(EXPANSION_CREATURES.map((creature) => [creature.id, creature]));
export const EXPANSION_ITEM_BY_ID: ReadonlyMap<string, ExpansionItem> = new Map(EXPANSION_ITEMS.map((item) => [item.id, item]));
export const EXPANSION_QUEST_BY_ID: ReadonlyMap<string, ExpansionQuest> = new Map(EXPANSION_QUESTS.map((quest) => [quest.id, quest]));

export function questSimilarity(left: ExpansionQuest, right: ExpansionQuest): number {
  return similarityData(left, right);
}

export function validateNarrativeExpansion(input?: {
  readonly factions?: readonly CosmicFaction[];
  readonly characters?: readonly ExpansionCharacter[];
  readonly creatures?: readonly ExpansionCreature[];
  readonly items?: readonly ExpansionItem[];
  readonly quests?: readonly ExpansionQuest[];
}): NarrativeValidationResult {
  return validateData(input) as NarrativeValidationResult;
}
