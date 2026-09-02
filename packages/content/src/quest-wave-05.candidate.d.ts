export type QuestWave05SiteId = "site.salt-watch" | "site.cairnmarket" | "site.ember-gate";
export type QuestWave05TerritoryId = "territory.mirror-salt-waste" | "territory.graven-march" | "territory.cinderward";
export type QuestWave05LeadFactionId = "lucent_synod" | "charnel_night";
export type QuestWave05PortfolioId = "settlement" | "faction_schism" | "character_guest_follower" | "regional" | "profession_systemic" | "relic_creature_ecology";
export type QuestWave05StateDomain = "authority" | "admission" | "memory" | "ecology" | "infrastructure" | "obligation";

export interface QuestWave05CandidateClaims {
  readonly canonical: false;
  readonly accepted: false;
  readonly independentlyReviewed: false;
  readonly releaseAttested: false;
  readonly runtimeIntegrated: false;
  readonly productionGeometry: false;
  readonly constructionReady: false;
  readonly artAccepted: false;
  readonly staticModelReady: false;
  readonly animatedModelReady: false;
}

export interface QuestWave05CandidateRecord {
  readonly schemaVersion: 1;
  readonly maturity: "noncanonical_candidate";
  readonly claims: QuestWave05CandidateClaims;
}

export interface QuestWave05CandidateMeta {
  readonly schemaVersion: 1;
  readonly id: "quest-wave-05-three-unfinished-civic-edges-candidate-v1";
  readonly title: "Three Unfinished Civic Edges";
  readonly status: "noncanonical_candidate";
  readonly authority: "authored_proposal";
  readonly counts: Readonly<{
    quests: 12;
    supportingCharacters: 12;
    signatureItems: 12;
    environmentBriefs: 12;
    previouslyUnusedExpansionCreatures: 18;
  }>;
  readonly sitePlan: readonly Readonly<{
    siteId: QuestWave05SiteId;
    territoryId: QuestWave05TerritoryId;
    questCount: 4;
    lucentLed: 2;
    charnelLed: 2;
  }>[];
  readonly authorship: Readonly<{
    authorRole: "wave05-candidate-author";
    reviewerRoles: readonly [];
    approvalRecords: readonly [];
    statement: string;
  }>;
  readonly sourcePolicy: Readonly<{
    authorityOrder: readonly string[];
    prohibitedPromotion: string;
    privacy: string;
  }>;
  readonly claims: QuestWave05CandidateClaims;
}

export interface QuestWave05Pipeline {
  readonly family: string;
  readonly conceptMaster: null;
  readonly transparentCutout: null;
  readonly staticModel: null;
  readonly animatedModel: null;
  readonly artStatus: "awaiting-art-after-narrative-review";
  readonly staticModelStatus: "unassessed";
  readonly animatedModelStatus: "unassessed";
}

export interface QuestWave05Voice {
  readonly cadence: string;
  readonly imagery: string;
  readonly signature: string;
}

export interface QuestWave05SupportingCharacter extends QuestWave05CandidateRecord {
  readonly id: string;
  readonly name: string;
  readonly epithet: string;
  readonly factionId: "league_of_remaining_hands" | "charnel_night" | "lucent_synod";
  readonly role: string;
  readonly questId: string;
  readonly desire: string;
  readonly fear: string;
  readonly contradiction: string;
  readonly secret: string;
  readonly ownedDecision: string;
  readonly voice: QuestWave05Voice;
  readonly visualBrief: string;
  readonly pipeline: QuestWave05Pipeline;
}

export interface QuestWave05SignatureItem extends QuestWave05CandidateRecord {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly questId: string;
  readonly mechanic: string;
  readonly lore: string;
  readonly custody: Readonly<{
    defaultHolderId: string;
    transferRule: string;
  }>;
  readonly activation: Readonly<{
    evidence: readonly string[];
    procedure: string;
  }>;
  readonly cost: Readonly<{
    limitation: string;
    worldDebt: string;
  }>;
  readonly laterContest: Readonly<{
    triggerStateKey: string;
    contestedQuestion: string;
    venue: string;
  }>;
}

export interface QuestWave05EnvironmentTopology {
  readonly id: string;
  readonly nodes: readonly string[];
  readonly edges: readonly string[];
  readonly concurrency: string;
  readonly resetPolicy: string;
}

export interface QuestWave05EnvironmentBrief extends QuestWave05CandidateRecord {
  readonly id: string;
  readonly questId: string;
  readonly siteId: QuestWave05SiteId;
  readonly territoryId: QuestWave05TerritoryId;
  readonly typologyIds: readonly string[];
  readonly habitatPlacement: "supported_by_existing_site_affinity" | "proposed_site_local_charnel_presence_requires_independent_review";
  readonly locationId: string;
  readonly coordinate: null;
  readonly siteAnchorUse: "canonical_site_identity_only";
  readonly geometryStatus: "proposed_topology_not_measured_geometry";
  readonly runtimeStatus: "not_integrated";
  readonly safeCellRule: string;
  readonly topology: QuestWave05EnvironmentTopology;
  readonly environmentNeeds: readonly string[];
  readonly utilitiesAndActivity: readonly string[];
  readonly decisiveMutation: string;
  readonly failurePersistence: string;
  readonly artDirection: string;
}

export interface QuestWave05Mechanic {
  readonly id: string;
  readonly verb: string;
  readonly description: string;
  readonly pressure: string;
}

export interface QuestWave05Dilemma {
  readonly id: string;
  readonly poles: readonly [string, string, string];
  readonly irreducibleCost: string;
}

export interface QuestWave05Objective {
  readonly id: string;
  readonly type: string;
  readonly nodeIds: readonly string[];
  readonly success: string;
  readonly failureCarry: string;
}

export interface QuestWave05StateWrite {
  readonly key: string;
  readonly values: readonly [string, string, string];
}

export interface QuestWave05Outcome {
  readonly id: string;
  readonly consequence: string;
}

export interface QuestWave05StructuralSignature {
  readonly interactionGraph: string;
  readonly coreVerb: string;
  readonly decisionMaterial: string;
  readonly failureCarrier: string;
  readonly spatialChange: string;
}

export interface QuestWave05AuthorshipProof {
  readonly setpiece: string;
  readonly failureTransformation: string;
  readonly dialogueConstraint: string;
  readonly persistentWorldChange: string;
  readonly forbiddenSubstitution: string;
}

export interface QuestWave05CollisionAnalysis {
  readonly comparedAcceptedQuestIds: readonly string[];
  readonly highRiskAnalogueIdsChecked: readonly string[];
  readonly nearestAcceptedQuestIds: readonly string[];
  readonly distinction: string;
  readonly uniqueGenome: string;
}

export interface QuestWave05Quest extends QuestWave05CandidateRecord {
  readonly type: "authored_quest_candidate";
  readonly id: string;
  readonly title: string;
  readonly siteId: QuestWave05SiteId;
  readonly territoryId: QuestWave05TerritoryId;
  readonly portfolioId: QuestWave05PortfolioId;
  readonly leadFactionId: QuestWave05LeadFactionId;
  readonly giverId: string;
  readonly giverReadinessGate?: string;
  readonly supportingCharacterIds: readonly [string];
  readonly creatureIds: readonly string[];
  readonly signatureItemId: string;
  readonly environmentId: string;
  readonly locationId: string;
  readonly premise: string;
  readonly loreReveal: string;
  readonly dialogueThesis: string;
  readonly primaryMechanic: QuestWave05Mechanic;
  readonly dilemma: QuestWave05Dilemma;
  readonly objectiveTopology: string;
  readonly objectives: readonly QuestWave05Objective[];
  readonly decisiveBeat: string;
  readonly failurePersistence: string;
  readonly characterVoiceConstraint: string;
  readonly stateDomain: QuestWave05StateDomain;
  readonly stateReads: readonly unknown[];
  readonly stateWrites: readonly [QuestWave05StateWrite];
  readonly prerequisiteQuestIds: readonly string[];
  readonly returningCharacterIds: readonly string[];
  readonly outcomes: readonly [QuestWave05Outcome, QuestWave05Outcome, QuestWave05Outcome];
  readonly spatialMutation: string;
  readonly structuralSignature: QuestWave05StructuralSignature;
  readonly authorshipProof: QuestWave05AuthorshipProof;
  readonly collisionAnalysis: QuestWave05CollisionAnalysis;
}

export interface QuestWave05HighRiskAnalogue {
  readonly questId: string;
  readonly risk: string;
  readonly prohibition: string;
}

export interface QuestWave05ArtAndRegistryImplications {
  readonly maturity: "planning_only_until_narrative_review";
  readonly creatureArtBaseline: Readonly<Record<string, unknown>>;
  readonly supportingCharacterArtBaseline: Readonly<Record<string, unknown>>;
  readonly environmentArtBaseline: Readonly<Record<string, unknown>>;
  readonly totalPlannedPngs: 51;
  readonly modelRegistry: Readonly<Record<string, string>>;
  readonly sennAvirGate: string;
  readonly claims: QuestWave05CandidateClaims;
}

export const QUEST_WAVE_05_CANDIDATE_META: QuestWave05CandidateMeta;
export const QUEST_WAVE_05_ACCEPTED_COLLISION_SCOPE: readonly string[];
export const QUEST_WAVE_05_HIGH_RISK_ANALOGUES: readonly QuestWave05HighRiskAnalogue[];
export const QUEST_WAVE_05_SUPPORTING_CHARACTERS: readonly QuestWave05SupportingCharacter[];
export const QUEST_WAVE_05_SIGNATURE_ITEMS: readonly QuestWave05SignatureItem[];
export const QUEST_WAVE_05_ENVIRONMENT_BRIEFS: readonly QuestWave05EnvironmentBrief[];
export const QUEST_WAVE_05_QUESTS: readonly QuestWave05Quest[];
export const QUEST_WAVE_05_ART_AND_REGISTRY_IMPLICATIONS: QuestWave05ArtAndRegistryImplications;
export const QUEST_WAVE_05_CHARACTER_BY_ID: ReadonlyMap<string, QuestWave05SupportingCharacter>;
export const QUEST_WAVE_05_ITEM_BY_ID: ReadonlyMap<string, QuestWave05SignatureItem>;
export const QUEST_WAVE_05_ENVIRONMENT_BY_ID: ReadonlyMap<string, QuestWave05EnvironmentBrief>;
export const QUEST_WAVE_05_QUEST_BY_ID: ReadonlyMap<string, QuestWave05Quest>;

declare const questWave05Candidate: Readonly<{
  meta: QuestWave05CandidateMeta;
  acceptedCollisionScope: readonly string[];
  highRiskAnalogues: readonly QuestWave05HighRiskAnalogue[];
  supportingCharacters: readonly QuestWave05SupportingCharacter[];
  signatureItems: readonly QuestWave05SignatureItem[];
  environmentBriefs: readonly QuestWave05EnvironmentBrief[];
  quests: readonly QuestWave05Quest[];
  artAndRegistryImplications: QuestWave05ArtAndRegistryImplications;
}>;

export default questWave05Candidate;
