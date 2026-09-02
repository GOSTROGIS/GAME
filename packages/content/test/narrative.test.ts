import assert from "node:assert/strict";
import test from "node:test";
import {
  BOUNDED_PARTICIPATION_CONTRACTS,
  COMPANION_AGENCY_CONTRACTS,
  COMPANION_QUEST_CONTRACTS,
  COSMIC_FACTIONS,
  EXPANSION_CHARACTERS,
  EXPANSION_CREATURES,
  EXPANSION_ITEMS,
  EXPANSION_QUESTS,
  NARRATIVE_TARGETS,
  QUEST_AUTHORING_LAW,
  QUEST_ACTOR_CONTRACTS,
  questSimilarity,
  validateNarrativeExpansion,
} from "../src/narrative.js";
import type {
  CompanionAgencyContract,
  CompanionQuestContract,
  ExpansionCharacter,
  ExpansionQuest,
} from "../src/narrative.js";
import { QUEST_WAVE_04_PHASE_GRAPH_BY_ID } from "../src/quest-wave-04.data.js";
import {
  NARRATIVE_READ_MODES,
  OPERATIONAL_MODE_DEFINITIONS,
  OPERATIONAL_READ_KIND,
  classifyStateRead,
  validateForcedTerminalBinding,
  validateSupportCharacterDepth,
} from "../src/quest-wave-04.runtime.js";

const asRecord = (value: unknown): Readonly<Record<string, unknown>> => value as Readonly<Record<string, unknown>>;

test("narrative expansion preserves founding catalogue as an uncapped floor", () => {
  assert.equal(NARRATIVE_TARGETS.foundingBestiaryForms, 178);
  assert.equal(NARRATIVE_TARGETS.foundingNamedCharacters, 42);
  assert.equal(NARRATIVE_TARGETS.foundingOrigins, 8);
  assert.equal(NARRATIVE_TARGETS.authoredQuestTarget, 5000);
  assert.equal(NARRATIVE_TARGETS.expansionCharacterLimit, null);
  assert.equal(NARRATIVE_TARGETS.expansionCreatureLimit, null);
  assert.equal(QUEST_AUTHORING_LAW.authorMayApproveOwnQuest, false);
  assert.equal(QUEST_AUTHORING_LAW.independentReviewers, 2);
});

test("foundation cast, relics, and first campaign tranche validate", () => {
  const result = validateNarrativeExpansion();
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
  assert.equal(result.stats.factions, COSMIC_FACTIONS.length);
  assert.equal(result.stats.characters, EXPANSION_CHARACTERS.length);
  assert.equal(result.stats.creatures, EXPANSION_CREATURES.length);
  assert.equal(result.stats.items, EXPANSION_ITEMS.length);
  assert.equal(result.stats.quests, EXPANSION_QUESTS.length);
  assert.equal(result.stats.companionContracts, 4);
  assert.equal(result.stats.boundedParticipationContracts, 2);
  assert.deepEqual({
    characters: EXPANSION_CHARACTERS.length,
    creatures: EXPANSION_CREATURES.length,
    items: EXPANSION_ITEMS.length,
    quests: EXPANSION_QUESTS.length,
    autonomousCompanions: COMPANION_QUEST_CONTRACTS.length,
    boundedAgency: COMPANION_AGENCY_CONTRACTS.length,
    actorContracts: QUEST_ACTOR_CONTRACTS.length,
  }, {
    characters: 70,
    creatures: 39,
    items: 67,
    quests: 49,
    autonomousCompanions: 4,
    boundedAgency: 2,
    actorContracts: 6,
  });
});

test("every quest has a unique story genome and low prose similarity", () => {
  const genomes = EXPANSION_QUESTS.map((quest) => [quest.primaryMechanicId, quest.dilemmaId, quest.locationId, quest.consequenceId].join("|"));
  const rewardIds = EXPANSION_QUESTS.flatMap(({ rewardItemIds }) => rewardItemIds);
  const acceptedStateDomains = new Set([...QUEST_AUTHORING_LAW.stateDomains, ...QUEST_AUTHORING_LAW.operationalStateDomains]);
  assert.equal(new Set(genomes).size, genomes.length);
  assert.equal(new Set(EXPANSION_QUESTS.map(({ primaryMechanicId }) => primaryMechanicId)).size, EXPANSION_QUESTS.length);
  assert.equal(rewardIds.length, 63);
  assert.equal(new Set(rewardIds).size, rewardIds.length);
  assert.ok(rewardIds.every((id) => EXPANSION_ITEMS.some((item) => item.id === id)));
  assert.ok(EXPANSION_QUESTS.every(({ authorshipProof }) => QUEST_AUTHORING_LAW.requiredProofFields.every((field) => authorshipProof[field])));
  assert.ok(EXPANSION_QUESTS.every(({ stateDomain, stateWrites }) => acceptedStateDomains.has(stateDomain) && stateWrites.length === 1));
  assert.equal(EXPANSION_QUESTS.filter(({ schemaVersion }) => schemaVersion === 2).length, 37);
  assert.equal(EXPANSION_QUESTS.filter(({ schemaVersion }) => schemaVersion === 9).length, 12);
  assert.deepEqual(new Set(EXPANSION_QUESTS.map(({ schemaVersion }) => schemaVersion)), new Set([2, 9]));
  assert.ok(EXPANSION_QUESTS.every(({ portfolioId }) => QUEST_AUTHORING_LAW.portfolioIds.includes(portfolioId)));
  for (let left = 0; left < EXPANSION_QUESTS.length; left += 1) {
    for (let right = left + 1; right < EXPANSION_QUESTS.length; right += 1) {
      assert.ok(questSimilarity(EXPANSION_QUESTS[left]!, EXPANSION_QUESTS[right]!) <= 0.42);
    }
  }
});

test("Wave 04 discriminates operational state reads from narrative consequence reads", () => {
  const waveQuests = EXPANSION_QUESTS.filter(({ schemaVersion }) => schemaVersion === 9);
  const classifiedReads = waveQuests.flatMap((quest) => quest.stateReads.map((read) => ({
    quest,
    read,
    classification: classifyStateRead(asRecord(read)),
  })));
  const operational = classifiedReads.filter(({ classification }) => classification.kind === OPERATIONAL_READ_KIND);
  const narrative = classifiedReads.filter(({ classification }) => classification.kind === "narrative-state-v1");

  assert.equal(OPERATIONAL_MODE_DEFINITIONS.length, 9);
  assert.equal(new Set(OPERATIONAL_MODE_DEFINITIONS.map(({ mode }) => mode)).size, 9);
  assert.equal(operational.length, 9);
  assert.equal(narrative.length, 17);
  assert.equal(classifiedReads.length, 26);

  for (const { quest, read, classification } of operational) {
    assert.equal(read.readKind, OPERATIONAL_READ_KIND);
    assert.ok(read.domain);
    assert.equal(classification.kind, OPERATIONAL_READ_KIND);
    assert.equal(classification.definition.questId, quest.id);
  }
  for (const { read, classification } of narrative) {
    assert.equal(classification.kind, "narrative-state-v1");
    assert.ok(NARRATIVE_READ_MODES.includes(read.mode as (typeof NARRATIVE_READ_MODES)[number]));
    assert.equal(Object.hasOwn(read, "readKind"), false);
    assert.equal(Object.hasOwn(read, "domain"), false);
  }

  const source = operational[0]!;
  const targetIndex = EXPANSION_QUESTS.findIndex(({ schemaVersion, id }) => schemaVersion === 9 && id !== source.quest.id);
  const target = EXPANSION_QUESTS[targetIndex]!;
  if (target.schemaVersion !== 9) throw new Error("Operational-read transplant fixture must target schema v9");
  const transplanted = {
    ...target,
    stateReads: [source.read, ...target.stateReads.slice(1)],
  } satisfies ExpansionQuest;
  const transplantResult = validateNarrativeExpansion({
    quests: EXPANSION_QUESTS.map((quest, index) => index === targetIndex ? transplanted : quest),
  });
  assert.equal(transplantResult.valid, false);
  assert.ok(transplantResult.errors.some(({ code }) => code === "operational_read_owner_mismatch"));

  const { readKind: _readKind, ...undiscriminatedOperationalRead } = source.read;
  assert.throws(() => classifyStateRead(asRecord(undiscriminatedOperationalRead)), /undiscriminated_custom_mode_rejected/);
  const narrativeRead = narrative[0]!.read;
  assert.throws(() => classifyStateRead(asRecord({ ...narrativeRead, domain: "authority" })), /narrative_domain_must_come_from_quest/);
});

test("equivalent-depth characters remain explicit no-secret records and missing visual briefs stay absent", () => {
  const noSecretCharacters = EXPANSION_CHARACTERS.filter((character) => !character.secret);
  assert.deepEqual(noSecretCharacters.map(({ id }) => id).sort(), [
    "mora_quay_dry_berth_steward",
    "senn_avir_residue_orderly",
  ]);
  for (const character of noSecretCharacters) {
    assert.equal(character.depthVariant, "equivalent-depth-without-secret-v1");
    assert.ok(character.ownedDecision);
    assert.ok(character.dialogueProfile?.register);
    assert.ok(character.dialogueProfile?.taboo);
    assert.ok(character.dialogueProfile?.signature);
    assert.deepEqual(validateSupportCharacterDepth(asRecord(character)), {
      variant: "equivalent-depth-without-secret-v1",
      valid: true,
    });
  }

  const missingVisualBriefs = EXPANSION_CHARACTERS.filter((character) => !Object.hasOwn(character, "visualBrief"));
  assert.deepEqual(missingVisualBriefs.map(({ id }) => id).sort(), [
    "leto_fain_custodian_unclaimed_symptoms",
    "senn_avir_residue_orderly",
  ]);
  assert.ok(missingVisualBriefs.every(({ visualBrief }) => visualBrief === undefined));

  const sennIndex = EXPANSION_CHARACTERS.findIndex(({ id }) => id === "senn_avir_residue_orderly");
  const senn = EXPANSION_CHARACTERS[sennIndex]!;
  const invalidSenn = { ...senn, depthVariant: undefined } as unknown as ExpansionCharacter;
  const invalidDepthResult = validateNarrativeExpansion({
    characters: EXPANSION_CHARACTERS.map((character, index) => index === sennIndex ? invalidSenn : character),
  });
  assert.equal(invalidDepthResult.valid, false);
  assert.ok(invalidDepthResult.errors.some(({ code }) => code === "invalid_character_depth"));
});

test("autonomous companions and bounded agency contracts remain separate executable schemas", () => {
  assert.equal(BOUNDED_PARTICIPATION_CONTRACTS, COMPANION_AGENCY_CONTRACTS);
  assert.equal(COMPANION_QUEST_CONTRACTS.length, 4);
  assert.equal(COMPANION_AGENCY_CONTRACTS.length, 2);
  assert.equal(QUEST_ACTOR_CONTRACTS.length, 6);
  assert.ok(COMPANION_QUEST_CONTRACTS.every(({ schemaVersion, mode }) => schemaVersion === 1 && ["autonomous_guest", "autonomous_follower"].includes(mode)));
  assert.ok(COMPANION_AGENCY_CONTRACTS.every((contract) => contract.schemaVersion === 4 && !("mode" in contract)));
  assert.equal(new Set(QUEST_ACTOR_CONTRACTS.map(({ questId, companionId }) => `${questId}|${companionId}`)).size, 6);

  const vaelIndex = COMPANION_AGENCY_CONTRACTS.findIndex(({ companionId }) => companionId === "canoness_vael_kindly_knife");
  const vael = COMPANION_AGENCY_CONTRACTS[vaelIndex]!;
  assert.ok(vael.deterministicOperation);
  assert.equal(vael.authorizesNothing, true);
  assert.equal(vael.physicalOperator, false);
  assert.equal(vael.readOnlyOrderingOnly, true);
  const invalidVael = { ...vael, authorizesNothing: false as true } satisfies CompanionAgencyContract;
  const invalidAgencyResult = validateNarrativeExpansion({
    boundedParticipationContracts: COMPANION_AGENCY_CONTRACTS.map((contract, index) => index === vaelIndex ? invalidVael : contract),
  });
  assert.equal(invalidAgencyResult.valid, false);
  assert.ok(invalidAgencyResult.errors.some(({ code }) => code === "agency_boundary_mismatch"));
});

test("Halix forced exit is bound to the exact existing harbor terminal", () => {
  const halixIndex = COMPANION_QUEST_CONTRACTS.findIndex(({ companionId }) => companionId === "deacon_halix_bell_of_noon");
  const halix = COMPANION_QUEST_CONTRACTS[halixIndex]!;
  const binding = halix.exit.forcedTerminalBinding;
  assert.deepEqual(binding, {
    schemaVersion: 1,
    bindingKind: "existing-owning-quest-outcome-to-phase-terminal",
    questId: "settlement_the_harbor_rang_below_tide",
    outcomeId: "mortal_watch_replaces_unsafe_bell_route",
    phaseGraphId: "phase.v6.harbor.reversible_tide",
    fromPhaseId: "harbor.flood",
    terminalPhaseId: "harbor.return",
    transitionKind: "advance",
    causalProof: "Halix's forced departure removes the unsafe restorative bell route; Nerin's existing mortal-watch outcome completes the final layer through the existing harbor.return terminal.",
  });
  assert.equal(halix.exit.forcedOutcomeLock, binding?.outcomeId);

  const quest = EXPANSION_QUESTS.find(({ id }) => id === binding?.questId);
  const phaseGraph = binding ? QUEST_WAVE_04_PHASE_GRAPH_BY_ID.get(binding.phaseGraphId) : undefined;
  assert.ok(quest);
  assert.ok(phaseGraph);
  assert.deepEqual(validateForcedTerminalBinding(asRecord(halix), asRecord(quest), phaseGraph), {
    outcomeId: "mortal_watch_replaces_unsafe_bell_route",
    terminalPhaseId: "harbor.return",
    valid: true,
  });

  const invalidHalix = {
    ...halix,
    exit: {
      ...halix.exit,
      forcedTerminalBinding: { ...binding!, terminalPhaseId: "harbor.flood" },
    },
  } satisfies CompanionQuestContract;
  const invalidBindingResult = validateNarrativeExpansion({
    companionContracts: COMPANION_QUEST_CONTRACTS.map((contract, index) => index === halixIndex ? invalidHalix : contract),
  });
  assert.equal(invalidBindingResult.valid, false);
  assert.ok(invalidBindingResult.errors.some(({ code }) => code === "invalid_forced_terminal_binding"));
});

test("no expansion creature is admitted as a generic enemy", () => {
  assert.ok(EXPANSION_CREATURES.length > 0);
  assert.equal(new Set(EXPANSION_QUESTS.map(({ supportingCharacterIds }) => supportingCharacterIds[0])).size, EXPANSION_QUESTS.length);
  assert.equal(new Set(EXPANSION_CREATURES.map(({ mechanic }) => mechanic.id)).size, EXPANSION_CREATURES.length);
  for (const creature of EXPANSION_CREATURES) {
    assert.equal(creature.genericTemplateAllowed, false);
    assert.ok(creature.origin);
    assert.ok(creature.locomotion);
    assert.ok(creature.ecology);
    assert.ok(creature.mechanic.cue);
    assert.ok(creature.mechanic.counterplay);
  }
});

test("validator rejects copy-paste quest structure", () => {
  const duplicate = { ...EXPANSION_QUESTS[0]!, id: "copy", title: "Copy" };
  const result = validateNarrativeExpansion({ quests: [...EXPANSION_QUESTS, duplicate] });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(({ code }) => code === "duplicate_story_genome"));
  assert.ok(result.errors.some(({ code }) => code === "duplicate_primary_mechanic"));
  assert.ok(result.errors.some(({ code }) => code === "duplicate_quest_support"));
  assert.ok(result.errors.some(({ code }) => code === "duplicate_objective_shape"));
});

test("schema-v2 state contracts reject omitted and impossible upstream outcomes", () => {
  const questIndex = EXPANSION_QUESTS.findIndex(({ schemaVersion, stateReads }) => schemaVersion === 2 && stateReads.some(({ mode }) => mode === "all-values"));
  const target = EXPANSION_QUESTS[questIndex]!;
  if (target.schemaVersion !== 2) throw new Error("State-contract mutation fixture must target schema v2");
  const readIndex = target.stateReads.findIndex(({ mode }) => mode === "all-values");
  const omitted = {
    ...target,
    stateReads: target.stateReads.map((read, index) => index === readIndex ? { ...read, values: read.values.slice(1) } : read),
  };
  const omittedResult = validateNarrativeExpansion({ quests: EXPANSION_QUESTS.map((quest, index) => index === questIndex ? omitted : quest) });
  assert.equal(omittedResult.valid, false);
  assert.ok(omittedResult.errors.some(({ code }) => code === "omitted_upstream_state_value"));

  const impossible = {
    ...target,
    stateReads: target.stateReads.map((read, index) => index === readIndex ? { ...read, values: [...read.values, "impossible_unwritten_outcome"] } : read),
  };
  const impossibleResult = validateNarrativeExpansion({ quests: EXPANSION_QUESTS.map((quest, index) => index === questIndex ? impossible : quest) });
  assert.equal(impossibleResult.valid, false);
  assert.ok(impossibleResult.errors.some(({ code }) => code === "impossible_state_value"));
});

test("schema-v9 mutations reject invalid reward structures and artifact clause hashes", () => {
  const questIndex = EXPANSION_QUESTS.findIndex(({ schemaVersion }) => schemaVersion === 9);
  const quest = EXPANSION_QUESTS[questIndex]!;
  assert.ok(quest.signatureRewardStructure);
  const invalidQuest = {
    ...quest,
    signatureRewardStructure: {
      ...quest.signatureRewardStructure,
      itemIds: quest.rewardItemIds.slice(1),
    },
  } satisfies ExpansionQuest;
  const questResult = validateNarrativeExpansion({
    quests: EXPANSION_QUESTS.map((entry, index) => index === questIndex ? invalidQuest : entry),
  });
  assert.equal(questResult.valid, false);
  assert.ok(questResult.errors.some(({ code }) => code === "signature_reward_structure_mismatch"));

  const itemIndex = EXPANSION_ITEMS.findIndex(({ schemaVersion }) => schemaVersion === 9);
  const item = EXPANSION_ITEMS[itemIndex]!;
  if (item.schemaVersion !== 9) assert.fail("Expected a schema-v9 artifact");
  const invalidItem = { ...item, itemSpecificClauseHash: "not-a-sha256" };
  const itemResult = validateNarrativeExpansion({
    items: EXPANSION_ITEMS.map((entry, index) => index === itemIndex ? invalidItem : entry),
  });
  assert.equal(itemResult.valid, false);
  assert.ok(itemResult.errors.some(({ code }) => code === "invalid_clause_hash"));
});
