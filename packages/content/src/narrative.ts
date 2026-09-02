import {
  ALIGNMENT_HOOKS as alignmentHooksData,
  COMPANION_AGENCY_CONTRACTS as companionAgencyContractData,
  COMPANION_QUEST_CONTRACTS as companionContractData,
  COSMIC_FACTIONS as factionData,
  EXPANSION_CHARACTERS as characterData,
  EXPANSION_PRINCIPALS as principalData,
  EXPANSION_CREATURES as creatureData,
  EXPANSION_ITEMS as itemData,
  EXPANSION_QUESTS as questData,
  NARRATIVE_TARGETS as targetsData,
  QUEST_AUTHORING_LAW as authoringLawData,
  QUEST_SUPPORT_CHARACTERS as questSupportData,
  QUEST_ACTOR_CONTRACTS as questActorContractData,
  WORLD_PREMISE as premiseData,
  interpretCanonicalQuestStateRead as interpretCanonicalStateReadData,
  questSimilarity as similarityData,
  validateNarrativeExpansion as validateData,
} from "./narrative.data.js";

export type CosmicAlignment = "restoration" | "opposition" | "mortal_continuity";
export type ExpansionArtStatus = "awaiting-art" | "in-review" | "accepted" | "refused";
export type ExpansionModelStatus = "unassessed" | "queued" | "sculpted" | "animated" | "refused";
export type NarrativeQuestStateDomain = "authority" | "admission" | "memory" | "ecology" | "infrastructure" | "obligation";
export type OperationalQuestStateDomain = "living_aftercare_operation";
export type QuestStateDomain = NarrativeQuestStateDomain | OperationalQuestStateDomain;
export type NarrativeQuestStateReadMode = "all-values" | "value-precondition";
export type OperationalQuestStateReadMode = "living_actor_record_only" | "six_physical_cutoffs" | "occupied_threshold_and_exit" | "three_bounded_material_loads" | "all_four_independent_exits" | "read_only_encounter_pressure" | "named_living_borrowers_only" | "exactly_one_body" | "exactly_four_bank_positions";
export type QuestStateReadMode = NarrativeQuestStateReadMode | OperationalQuestStateReadMode;
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
  readonly secret?: string;
  readonly depthVariant?: "equivalent-depth-without-secret-v1";
  readonly voice?: { readonly cadence: string; readonly imagery: string; readonly signature: string };
  readonly dialogueProfile?: { readonly register: string; readonly taboo: string; readonly signature: string };
  readonly alignmentOptions: readonly string[];
  readonly visualBrief?: string;
  readonly questArcIds: readonly string[];
  readonly ownedDecision?: string;
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
  readonly sound?: string;
  readonly ecology: string;
  readonly origin: string;
  readonly purpose?: string;
  readonly mechanic: { readonly id: string; readonly cue: string; readonly counterplay: string };
  readonly narrativeUse: string;
  readonly visualBrief: string;
  readonly pipeline: ExpansionAssetPipeline;
}

export interface ExpansionItemV1 {
  readonly schemaVersion?: 1;
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly mechanic: string;
  readonly lore: string;
}

export interface ExpansionArtifactV2 {
  readonly schemaVersion: 2;
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly mechanic: string;
  readonly lore: string;
  readonly custody: { readonly defaultHolderId: string; readonly transferRule: string };
  readonly activation: { readonly evidence: readonly string[]; readonly procedure: string };
  readonly cost: { readonly limitation: string; readonly worldDebt: string };
  readonly laterContest: { readonly triggerStateKey: string; readonly contestedQuestion: string; readonly venue: string };
}

export interface ExpansionArtifactV9 extends Omit<ExpansionArtifactV2, "schemaVersion"> {
  readonly schemaVersion: 9;
  readonly itemSpecificClauseHash: string;
  readonly agency?: string;
  readonly aggregateCapacityPersons?: number;
  readonly boatCount?: number;
  readonly canCarryVictimReflexAuthority?: boolean;
  readonly canCreateOffice?: boolean;
  readonly canGrantPermission?: boolean;
  readonly canSupplyRemedy?: boolean;
  readonly canTransferCommand?: boolean;
  readonly canonicalServiceIds?: readonly string[];
  readonly capacityPerBoatPersons?: number;
  readonly capacityPersons?: number;
  readonly count?: number;
  readonly serviceEvidence?: {
    readonly systemId: string;
    readonly canonicalServiceIds: readonly string[];
    readonly allFiveServiceRoutesBound: boolean;
    readonly formerSiteOutageRemainsVisible: boolean;
  };
}

export type ExpansionItem = ExpansionItemV1 | ExpansionArtifactV2 | ExpansionArtifactV9;

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

export interface NarrativeQuestStateReadContract {
  readonly key: string;
  readonly mode: NarrativeQuestStateReadMode;
  readonly values: readonly string[];
  readonly readKind?: never;
  readonly domain?: never;
}

export interface OperationalQuestStateReadContract {
  readonly key: string;
  readonly mode: OperationalQuestStateReadMode;
  readonly values: readonly string[];
  readonly readKind: "operational-state-v1";
  readonly domain: OperationalQuestStateDomain;
}

export type QuestStateReadContract = NarrativeQuestStateReadContract | OperationalQuestStateReadContract;

export interface ExpansionQuestBase {
  readonly id: string;
  readonly chainId: string;
  readonly order: number;
  readonly type: "main" | "side" | "faction" | "character" | "regional" | "world";
  readonly portfolioId: QuestPortfolioId;
  readonly title: string;
  readonly giverId: string;
  readonly supportingCharacterIds: readonly string[];
  readonly creatureIds: readonly string[];
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

export interface ExpansionQuestV2 extends ExpansionQuestBase {
  readonly schemaVersion: 2;
  readonly stateDomain: NarrativeQuestStateDomain;
  readonly stateReads: readonly NarrativeQuestStateReadContract[];
  readonly stateWrites: readonly { readonly domain: NarrativeQuestStateDomain; readonly key: string; readonly values: readonly string[] }[];
  readonly signatureRewardStructure?: never;
  readonly phaseGraphId?: never;
  readonly participantCharacterIds?: never;
  readonly returningCharacterIds?: never;
}

export interface ExpansionQuestV9 extends ExpansionQuestBase {
  readonly schemaVersion: 9;
  readonly stateDomain: QuestStateDomain;
  readonly stateReads: readonly QuestStateReadContract[];
  readonly stateWrites: readonly { readonly domain: QuestStateDomain; readonly key: string; readonly values: readonly string[] }[];
  readonly signatureRewardStructure: Readonly<{
    kind: string;
    portableSignatureItemId: string | null;
    itemIds: readonly string[];
    noPortableSignatureReason: string | null;
  }>;
  readonly phaseGraphId: string;
  readonly participantCharacterIds: readonly string[];
  readonly returningCharacterIds: readonly string[];
  readonly creatureAliasIds: readonly string[];
  readonly foundingCreatureOverlayIds: readonly string[];
  readonly prerequisiteQuestIds: readonly string[];
  readonly authoredSemanticContract: Readonly<Record<string, unknown>>;
  readonly decisiveBeat: Readonly<Record<string, unknown>>;
  readonly failurePersistence: Readonly<Record<string, unknown>>;
  readonly outcomeProgram: Readonly<Record<string, unknown>>;
  readonly structuralDiversityContract: Readonly<Record<string, unknown>>;
  readonly structuralSignature: string;
}

export type ExpansionQuest = ExpansionQuestV2 | ExpansionQuestV9;

export interface CompanionQuestContract {
  readonly schemaVersion: 1;
  readonly questId: string;
  readonly companionId: string;
  readonly mode: "autonomous_guest" | "autonomous_follower";
  readonly entryReason: string;
  readonly entryCondition: { readonly stateKey: string; readonly allowedValues: readonly string[] };
  readonly independentAction: {
    readonly id: string;
    readonly trigger: string;
    readonly playerOverride: false;
    readonly behaviorByTrustValue?: Readonly<Record<string, string>>;
    readonly behaviorByUpstreamValue?: Readonly<Record<string, string>>;
    readonly trustModifier?: Readonly<Record<string, string>>;
  };
  readonly refusalActionIds: readonly string[];
  readonly autonomousPriority: { readonly id: string; readonly whenPlayerDoesNothing: string };
  readonly trust: {
    readonly key: string;
    readonly values: readonly string[];
    readonly initialByUpstreamValue: Readonly<Record<string, string>>;
    readonly transitions: readonly { readonly eventId: string; readonly from: string; readonly to: string }[];
  };
  readonly availability: {
    readonly availableTrustValues: readonly string[];
    readonly effectByTrustValue: Readonly<Record<string, string>>;
    readonly violationCounter: { readonly key: string; readonly incrementEventId: string; readonly forcedExitAt: number };
  };
  readonly exit: {
    readonly normalTrigger: string;
    readonly normalAction: string;
    readonly forcedTrigger: string;
    readonly forcedAction: string;
    readonly forcedOutcomeLock: string;
    readonly forcedTerminalBinding?: Readonly<{
      schemaVersion: 1;
      bindingKind: "existing-owning-quest-outcome-to-phase-terminal";
      questId: string;
      outcomeId: string;
      phaseGraphId: string;
      fromPhaseId: string;
      terminalPhaseId: string;
      transitionKind: string;
      causalProof: string;
    }>;
  };
  readonly pipeline: ExpansionAssetPipeline;
  readonly executableSelectionRules?: Readonly<{
    eligibleQuery: string;
    deterministicTieBreak: readonly string[];
    inaccessibleFallback: string;
  }>;
}

export interface CompanionAgencyContract {
  readonly schemaVersion: 4;
  readonly questId: string;
  readonly companionId: string;
  readonly entryReason: string;
  readonly prohibitedActions: readonly string[];
  readonly deterministicOperation?: Readonly<{
    query: string;
    order: readonly string[];
    result: string;
    inaccessibleFallback: string;
  }>;
  readonly authorizesNothing?: true;
  readonly agencyBoundary?: string;
  readonly physicalOperator?: false;
  readonly readOnlyOrderingOnly?: true;
  readonly executableActions?: readonly string[];
  readonly rosePaneBoundary?: Readonly<{ function: string; transfers: readonly [] }>;
  readonly mortalFallbackRequired?: true;
}

export type QuestActorContract = CompanionQuestContract | CompanionAgencyContract;

export interface QuestStateReadResult {
  readonly readKind: "narrative-state-v1" | "operational-state-v1";
  readonly domain: QuestStateDomain;
  readonly key: string;
  readonly value: string;
  readonly satisfied: boolean;
}

export interface NarrativeValidationResult {
  readonly valid: boolean;
  readonly errors: readonly { readonly path: string; readonly code: string; readonly message: string }[];
  readonly stats: { readonly factions: number; readonly characters: number; readonly creatures: number; readonly items: number; readonly quests: number; readonly companionContracts: number; readonly boundedParticipationContracts: number; readonly capacityTarget: number };
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
  operationalStateDomains: readonly QuestStateDomain[];
  stateReadModes: readonly QuestStateReadMode[];
  acceptedQuestSchemaVersions: readonly (2 | 9)[];
  acceptedItemSchemaVersions: readonly (1 | 2 | 9)[];
  acceptedCompanionSchemaVersions: readonly (1 | 4)[];
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
export const COMPANION_QUEST_CONTRACTS = companionContractData as readonly CompanionQuestContract[];
export const COMPANION_AGENCY_CONTRACTS = companionAgencyContractData as readonly CompanionAgencyContract[];
export const BOUNDED_PARTICIPATION_CONTRACTS = COMPANION_AGENCY_CONTRACTS;
export const QUEST_ACTOR_CONTRACTS = questActorContractData as readonly QuestActorContract[];

export const EXPANSION_CHARACTER_BY_ID: ReadonlyMap<string, ExpansionCharacter> = new Map(EXPANSION_CHARACTERS.map((character) => [character.id, character]));
export const EXPANSION_CREATURE_BY_ID: ReadonlyMap<string, ExpansionCreature> = new Map(EXPANSION_CREATURES.map((creature) => [creature.id, creature]));
export const EXPANSION_ITEM_BY_ID: ReadonlyMap<string, ExpansionItem> = new Map(EXPANSION_ITEMS.map((item) => [item.id, item]));
export const EXPANSION_QUEST_BY_ID: ReadonlyMap<string, ExpansionQuest> = new Map(EXPANSION_QUESTS.map((quest) => [quest.id, quest]));
export const COMPANION_QUEST_CONTRACT_BY_KEY: ReadonlyMap<string, CompanionQuestContract> = new Map(COMPANION_QUEST_CONTRACTS.map((contract) => [`${contract.questId}|${contract.companionId}`, contract]));
export const COMPANION_AGENCY_CONTRACT_BY_KEY: ReadonlyMap<string, CompanionAgencyContract> = new Map(COMPANION_AGENCY_CONTRACTS.map((contract) => [`${contract.questId}|${contract.companionId}`, contract]));

export function questSimilarity(left: ExpansionQuest, right: ExpansionQuest): number {
  return similarityData(left, right);
}

export function interpretCanonicalQuestStateRead(
  questOrId: string | ExpansionQuest,
  read: QuestStateReadContract,
  stateByDomain: Readonly<Record<string, Readonly<Record<string, unknown>>>>,
  context: Readonly<Record<string, unknown>> = {},
): QuestStateReadResult {
  return interpretCanonicalStateReadData(
    questOrId,
    read as unknown as Readonly<Record<string, unknown>>,
    stateByDomain,
    context,
  ) as QuestStateReadResult;
}

export function validateNarrativeExpansion(input?: {
  readonly factions?: readonly CosmicFaction[];
  readonly characters?: readonly ExpansionCharacter[];
  readonly creatures?: readonly ExpansionCreature[];
  readonly items?: readonly ExpansionItem[];
  readonly quests?: readonly ExpansionQuest[];
  readonly companionContracts?: readonly CompanionQuestContract[];
  readonly boundedParticipationContracts?: readonly CompanionAgencyContract[];
}): NarrativeValidationResult {
  return validateData(input) as NarrativeValidationResult;
}
