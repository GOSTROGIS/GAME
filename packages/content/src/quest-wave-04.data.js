import waveSourceJson from "../manifests/quest-wave-04-v11.narrative.json" with { type: "json" };

const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
};

// The embedded source deliberately retains its freeze-time candidate flags.
// Reviewers did not mutate those bytes or grant merge authority. This sibling
// record is the coordinator decision that admits the exact, hash-bound source
// after two independent PASS reviews and a post-main compatibility audit.
export const QUEST_WAVE_04_ACCEPTANCE = deepFreeze({
  schema: "SableReachQuestWaveAcceptanceV1",
  waveId: "quest-wave-04-v11",
  status: "accepted_canonical_content",
  coordinatorAuthorization: "project_owner_directive",
  acceptedOn: "2026-09-01",
  rights: {
    status: "project_owned_original",
    repositoryUseAuthorized: true,
  },
  maturity: {
    narrative: "accepted_canonical_content",
    environmentPrograms: "accepted_authored_blockout_contract",
    conceptArt: "awaiting_or_separately_indexed",
    productionGeometry: "unassessed",
  },
  source: {
    path: "design-review/quest-release-evidence/quest-wave-04-v11.machine-annex.json",
    bytes: 4245855,
    sha256: "12183ae9cbded83a65503c42b32c75f4824fad80c0da5f6c5340abd6dce11962",
    freezeTimeStatusIsHistorical: true,
  },
  runtimeContract: {
    path: "packages/content/src/quest-wave-04.runtime.js",
    bytes: 16412,
    sha256: "8a59a9bf876d22986e4d9ff801a3ddf35d52444beca5102cc7742e4d53f1b18e",
  },
  runtimeCompatibility: {
    canonicalInterpreter: "interpretCanonicalQuestStateRead",
    path: "packages/content/src/narrative.data.js",
    narrativeDomainResolution: "unique_prior_canonical_state_writer_domain",
    rawRuntimeDomainSource: "freeze_time_contract_preserved_as_reviewed_evidence",
  },
  derivedInterfaces: [
    {
      path: "packages/content/manifests/quest-wave-04-v11.narrative.json",
      bytes: 311366,
      sha256: "3ef2724d281e25cdde6aae24df14beb996e040a836429bac810bc7814e6a7ebb",
    },
    {
      path: "packages/content/manifests/quest-wave-04-v11.spatial-index.json",
      bytes: 113103,
      sha256: "a1793a15ba051e0df2235323e8c04393ad5db4c804111877a0269ff00eb930c2",
    },
    {
      path: "packages/content/manifests/quest-wave-04-v11.world.json",
      bytes: 3859148,
      sha256: "4f22d16df22704fff5a95d9af6541122dd405818d9631ab9126837895fd24eee",
    },
  ],
  independentReviews: [
    {
      role: "review-a",
      path: "design-review/quest-release-evidence/quest-wave-04-v11.review-a.manifest.json",
      verdict: "PASS",
      sha256: "cdad9291283cfa2f413f9da4bac681bf899c5a04dc9b3d4d4ee30cd867367f66",
    },
    {
      role: "review-b",
      path: "design-review/quest-release-evidence/quest-wave-04-v11.review-b.manifest.json",
      verdict: "PASS",
      sha256: "7913bfb59b444e93843b7aa402e52207067ed05176d491eb0ae2d0d9949ef01b",
    },
  ],
  admittedCounts: {
    supportingCharacters: 21,
    creatures: 6,
    signatureItems: 30,
    quests: 12,
    phaseGraphs: 12,
    companionAndAgencyContracts: 4,
    environmentPrograms: 12,
  },
  authorityBoundary: {
    loreAndQuestContent: "canon",
    environmentPrograms: "authored_blockout_contract",
    atlasPlacement: "provisional_placement",
    conceptArt: "pipeline_status_only",
    staticModels: "unassessed_unless_explicitly_linked",
    animatedModels: "unassessed_unless_explicitly_linked",
    runtimePerformance: "unverified",
    gameplayBalance: "unverified",
  },
});

export const QUEST_WAVE_04_SOURCE = deepFreeze(waveSourceJson);
export const QUEST_WAVE_04_SUPPORTING_CHARACTERS = QUEST_WAVE_04_SOURCE.supportingCharacters;
export const QUEST_WAVE_04_CREATURES = QUEST_WAVE_04_SOURCE.newCreatures;
export const QUEST_WAVE_04_ITEMS = QUEST_WAVE_04_SOURCE.signatureItems;
export const QUEST_WAVE_04_QUESTS = QUEST_WAVE_04_SOURCE.quests;
export const QUEST_WAVE_04_PHASE_GRAPHS = QUEST_WAVE_04_SOURCE.phaseGraphs;
export const QUEST_WAVE_04_COMPANION_CONTRACTS = QUEST_WAVE_04_SOURCE.companionContracts;
export const QUEST_WAVE_04_AUTONOMOUS_COMPANION_CONTRACTS = deepFreeze(QUEST_WAVE_04_COMPANION_CONTRACTS.filter(({ schemaVersion }) => schemaVersion === 1));
export const QUEST_WAVE_04_BOUNDED_PARTICIPATION_CONTRACTS = deepFreeze(QUEST_WAVE_04_COMPANION_CONTRACTS.filter(({ schemaVersion }) => schemaVersion === 4));

export const QUEST_WAVE_04_CHARACTER_BY_ID = new Map(QUEST_WAVE_04_SUPPORTING_CHARACTERS.map((entry) => [entry.id, entry]));
export const QUEST_WAVE_04_CREATURE_BY_ID = new Map(QUEST_WAVE_04_CREATURES.map((entry) => [entry.id, entry]));
export const QUEST_WAVE_04_ITEM_BY_ID = new Map(QUEST_WAVE_04_ITEMS.map((entry) => [entry.id, entry]));
export const QUEST_WAVE_04_QUEST_BY_ID = new Map(QUEST_WAVE_04_QUESTS.map((entry) => [entry.id, entry]));
export const QUEST_WAVE_04_PHASE_GRAPH_BY_ID = new Map(QUEST_WAVE_04_PHASE_GRAPHS.map((entry) => [entry.id, entry]));
