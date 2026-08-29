import assert from "node:assert/strict";
import test from "node:test";
import {
  COSMIC_FACTIONS,
  EXPANSION_CHARACTERS,
  EXPANSION_CREATURES,
  EXPANSION_ITEMS,
  EXPANSION_QUESTS,
  NARRATIVE_TARGETS,
  QUEST_AUTHORING_LAW,
  questSimilarity,
  validateNarrativeExpansion,
} from "../src/narrative.js";

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
});

test("every quest has a unique story genome and low prose similarity", () => {
  const genomes = EXPANSION_QUESTS.map((quest) => [quest.primaryMechanicId, quest.dilemmaId, quest.locationId, quest.consequenceId].join("|"));
  assert.equal(new Set(genomes).size, genomes.length);
  assert.equal(new Set(EXPANSION_QUESTS.map(({ primaryMechanicId }) => primaryMechanicId)).size, EXPANSION_QUESTS.length);
  assert.equal(new Set(EXPANSION_QUESTS.map(({ rewardItemIds }) => rewardItemIds[0])).size, EXPANSION_QUESTS.length);
  assert.ok(EXPANSION_QUESTS.every(({ authorshipProof }) => QUEST_AUTHORING_LAW.requiredProofFields.every((field) => authorshipProof[field])));
  assert.ok(EXPANSION_QUESTS.every(({ stateDomain, stateWrites }) => QUEST_AUTHORING_LAW.stateDomains.includes(stateDomain) && stateWrites.length === 1));
  assert.ok(EXPANSION_QUESTS.every(({ schemaVersion }) => schemaVersion === 2));
  assert.ok(EXPANSION_QUESTS.every(({ portfolioId }) => QUEST_AUTHORING_LAW.portfolioIds.includes(portfolioId)));
  assert.ok(EXPANSION_QUESTS.every(({ stateReads }) => stateReads.every(({ key, mode, values }) => key && QUEST_AUTHORING_LAW.stateReadModes.includes(mode) && values.length > 0)));
  for (let left = 0; left < EXPANSION_QUESTS.length; left += 1) {
    for (let right = left + 1; right < EXPANSION_QUESTS.length; right += 1) {
      assert.ok(questSimilarity(EXPANSION_QUESTS[left]!, EXPANSION_QUESTS[right]!) <= 0.42);
    }
  }
});

test("no expansion creature is admitted as a generic enemy", () => {
  assert.equal(EXPANSION_CREATURES.length, 24);
  assert.equal(EXPANSION_CHARACTERS.length, 37);
  assert.equal(EXPANSION_QUESTS.length, 25);
  assert.equal(EXPANSION_ITEMS.length, 25);
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
  const questIndex = EXPANSION_QUESTS.findIndex(({ stateReads }) => stateReads.some(({ mode }) => mode === "all-values"));
  const target = EXPANSION_QUESTS[questIndex]!;
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
