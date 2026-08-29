import assert from 'node:assert/strict';

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
} from '../packages/content/src/narrative.data.js';

const result = validateNarrativeExpansion();
assert.equal(result.valid, true, JSON.stringify(result.errors, null, 2));
assert.equal(NARRATIVE_TARGETS.authoredQuestTarget, 5_000);
assert.equal(NARRATIVE_TARGETS.expansionCharacterLimit, null);
assert.equal(NARRATIVE_TARGETS.expansionCreatureLimit, null);
assert.equal(QUEST_AUTHORING_LAW.authorMayApproveOwnQuest, false);
assert.equal(QUEST_AUTHORING_LAW.independentReviewers, 2);
assert.equal(COSMIC_FACTIONS.length, 3);
assert.equal(EXPANSION_CHARACTERS.length, 37);
assert.equal(EXPANSION_CREATURES.length, 24);
assert.equal(EXPANSION_QUESTS.length, 25);
assert.equal(EXPANSION_ITEMS.length, 25);
assert.equal(EXPANSION_ITEMS.length, EXPANSION_QUESTS.length);

const acceptedExpansionMasters = new Map([
  ['arch_lumen_seraphel_orr', 'assets/characters/npcs/lucent-synod/arch-lumen-seraphel-orr-v1.png'],
  ['canoness_vael_kindly_knife', 'assets/characters/npcs/lucent-synod/canoness-vael-kindly-knife-v2.png'],
  ['deacon_halix_bell_of_noon', 'assets/characters/npcs/lucent-synod/deacon-halix-bell-of-noon-v2.png'],
  ['saint_vespera_second_shadow', 'assets/characters/npcs/lucent-synod/saint-vespera-second-shadow-v3.png'],
  ['apse_seraph', 'assets/bestiary/forms/lucent-procession/apse-seraph-v2.png'],
  ['misericord_of_borrowed_pain', 'assets/bestiary/forms/lucent-procession/misericord-of-borrowed-pain-v1.png'],
  ['noon_bailiff', 'assets/bestiary/forms/lucent-procession/noon-bailiff-v2.png'],
  ['unbroken_note_engine', 'assets/bestiary/forms/lucent-procession/unbroken-note-engine-v3.png'],
  ['reliquary_of_the_last_breath', 'assets/bestiary/forms/lucent-procession/reliquary-of-the-last-breath-v1.png'],
  ['gold_shutter_penitent', 'assets/bestiary/forms/lucent-procession/gold-shutter-penitent-v2.png'],
  ['enoch_last_lamplighter', 'assets/characters/npcs/remaining-hands/enoch-last-lamplighter-v1.png'],
  ['sister_calve_unlit_hospice', 'assets/characters/npcs/remaining-hands/sister-calve-unlit-hospice-v1.png'],
  ['tor_vannic_defector_of_dawn', 'assets/characters/npcs/remaining-hands/tor-vannic-defector-of-dawn-v1.png'],
  ['king_ash_without_country', 'assets/characters/npcs/remaining-hands/king-ash-without-country-v1.png'],
  ['nima_sorn_keeper_of_one_shadow', 'assets/characters/npcs/remaining-hands/nima-sorn-keeper-of-one-shadow-v1.png'],
  ['oren_lusk_last_calendarer', 'assets/characters/npcs/remaining-hands/oren-lusk-last-calendarer-v1.png'],
  ['ilar_rook_unhoused_shadow', 'assets/characters/npcs/charnel-households/ilar-rook-unhoused-shadow-v1.png'],
  ['ilyen_doorborn_outer_age', 'assets/characters/npcs/charnel-households/ilyen-doorborn-outer-age-v1.png'],
  ['throat_orchard', 'assets/bestiary/forms/charnel-households/throat-orchard-v1.png'],
  ['jointless_advocate', 'assets/bestiary/forms/charnel-households/jointless-advocate-v1.png'],
  ['mercy_eater', 'assets/bestiary/forms/charnel-households/mercy-eater-v1.png'],
  ['corridor_maw', 'assets/bestiary/forms/charnel-households/corridor-maw-v1.png'],
]);

const unique = (records, selector) => new Set(records.map(selector)).size === records.length;
assert.ok(unique(EXPANSION_CHARACTERS, ({ id }) => id));
assert.ok(unique(EXPANSION_CHARACTERS, ({ voice }) => voice.signature));
assert.ok(unique(EXPANSION_CREATURES, ({ id }) => id));
assert.ok(unique(EXPANSION_CREATURES, ({ mechanic }) => mechanic.id));
assert.ok(unique(EXPANSION_QUESTS, ({ primaryMechanicId }) => primaryMechanicId));
assert.ok(unique(EXPANSION_QUESTS, ({ rewardItemIds }) => rewardItemIds[0]));
assert.ok(unique(EXPANSION_QUESTS, ({ supportingCharacterIds }) => supportingCharacterIds[0]));
assert.ok(EXPANSION_QUESTS.every(({ supportingCharacterIds }) => supportingCharacterIds.length >= 1));
assert.ok(EXPANSION_QUESTS.every(({ authorshipProof }) => QUEST_AUTHORING_LAW.requiredProofFields.every((field) => authorshipProof[field])));
assert.ok(EXPANSION_QUESTS.every(({ stateDomain, stateWrites }) => QUEST_AUTHORING_LAW.stateDomains.includes(stateDomain) && stateWrites.length === 1));
assert.ok(EXPANSION_QUESTS.every(({ schemaVersion }) => schemaVersion === 2));
assert.ok(EXPANSION_QUESTS.every(({ portfolioId }) => QUEST_AUTHORING_LAW.portfolioIds.includes(portfolioId)));
assert.ok(EXPANSION_QUESTS.every(({ stateReads }) => stateReads.every(({ key, mode, values }) => key && QUEST_AUTHORING_LAW.stateReadModes.includes(mode) && values.length >= 1)));

const conditionalSuccession = EXPANSION_QUESTS.find(({ id }) => id === 'aftermath_person_engine_must_outlive');
assert.ok(conditionalSuccession);
assert.deepEqual(
  conditionalSuccession.stateReads.find(({ key }) => key === 'dawn_shutdown_architecture'),
  { key: 'dawn_shutdown_architecture', mode: 'value-precondition', values: ['player_holds_off_switch'] },
);

for (const creature of EXPANSION_CREATURES) {
  assert.equal(creature.genericTemplateAllowed, false);
  assert.ok(creature.locomotion);
  assert.ok(creature.mechanic.cue && creature.mechanic.counterplay);
  assert.ok(creature.pipeline && Object.hasOwn(creature.pipeline, 'animatedModel'));
}

for (const [id, conceptMaster] of acceptedExpansionMasters) {
  const subject = [...EXPANSION_CHARACTERS, ...EXPANSION_CREATURES].find((candidate) => candidate.id === id);
  assert.ok(subject, `${id} is missing from narrative expansion data`);
  assert.equal(subject.pipeline.conceptMaster, conceptMaster);
  assert.equal(subject.pipeline.transparentCutout, null);
  assert.equal(subject.pipeline.staticModel, null);
  assert.equal(subject.pipeline.animatedModel, null);
  assert.equal(subject.pipeline.artStatus, 'accepted');
  assert.equal(subject.pipeline.staticModelStatus, 'unassessed');
  assert.equal(subject.pipeline.animatedModelStatus, 'unassessed');
}

for (let left = 0; left < EXPANSION_QUESTS.length; left += 1) {
  for (let right = left + 1; right < EXPANSION_QUESTS.length; right += 1) {
    assert.ok(
      questSimilarity(EXPANSION_QUESTS[left], EXPANSION_QUESTS[right]) <= 0.42,
      `${EXPANSION_QUESTS[left].id} is too similar to ${EXPANSION_QUESTS[right].id}`,
    );
  }
}

const copiedQuest = { ...EXPANSION_QUESTS[0], id: 'forbidden_copy', title: 'Forbidden Copy' };
const copiedResult = validateNarrativeExpansion({ quests: [...EXPANSION_QUESTS, copiedQuest] });
assert.equal(copiedResult.valid, false);
assert.ok(copiedResult.errors.some(({ code }) => code === 'duplicate_story_genome'));
assert.ok(copiedResult.errors.some(({ code }) => code === 'duplicate_quest_support'));
assert.ok(copiedResult.errors.some(({ code }) => code === 'duplicate_objective_shape'));

const genericCreature = { ...EXPANSION_CREATURES[0], id: 'generic_enemy', genericTemplateAllowed: true };
const genericResult = validateNarrativeExpansion({ creatures: [...EXPANSION_CREATURES, genericCreature] });
assert.equal(genericResult.valid, false);
assert.ok(genericResult.errors.some(({ code }) => code === 'generic_enemy'));

const contractedQuestIndex = EXPANSION_QUESTS.findIndex(({ stateReads }) => stateReads.some(({ mode }) => mode === 'all-values'));
const contractedQuest = EXPANSION_QUESTS[contractedQuestIndex];
const allValueReadIndex = contractedQuest.stateReads.findIndex(({ mode }) => mode === 'all-values');
const incompleteRead = contractedQuest.stateReads[allValueReadIndex];
const questWithOmittedStateValue = {
  ...contractedQuest,
  stateReads: contractedQuest.stateReads.map((read, index) => index === allValueReadIndex ? { ...read, values: read.values.slice(1) } : read),
};
const omittedValueQuests = EXPANSION_QUESTS.map((quest, index) => index === contractedQuestIndex ? questWithOmittedStateValue : quest);
const omittedValueResult = validateNarrativeExpansion({ quests: omittedValueQuests });
assert.equal(omittedValueResult.valid, false);
assert.ok(omittedValueResult.errors.some(({ code }) => code === 'omitted_upstream_state_value'));

const questWithImpossibleStateValue = {
  ...contractedQuest,
  stateReads: contractedQuest.stateReads.map((read, index) => index === allValueReadIndex ? { ...read, values: [...read.values, 'impossible_unwritten_outcome'] } : read),
};
const impossibleValueQuests = EXPANSION_QUESTS.map((quest, index) => index === contractedQuestIndex ? questWithImpossibleStateValue : quest);
const impossibleValueResult = validateNarrativeExpansion({ quests: impossibleValueQuests });
assert.equal(impossibleValueResult.valid, false);
assert.ok(impossibleValueResult.errors.some(({ code }) => code === 'impossible_state_value'));

console.log(JSON.stringify({ valid: true, stats: result.stats }, null, 2));
