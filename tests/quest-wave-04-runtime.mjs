import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  QUEST_WAVE_04_AUTONOMOUS_COMPANION_CONTRACTS,
  QUEST_WAVE_04_BOUNDED_PARTICIPATION_CONTRACTS,
  QUEST_WAVE_04_COMPANION_CONTRACTS,
  QUEST_WAVE_04_CREATURES,
  QUEST_WAVE_04_ITEMS,
  QUEST_WAVE_04_PHASE_GRAPH_BY_ID,
  QUEST_WAVE_04_PHASE_GRAPHS,
  QUEST_WAVE_04_QUEST_BY_ID,
  QUEST_WAVE_04_QUESTS,
  QUEST_WAVE_04_SUPPORTING_CHARACTERS,
} from "../packages/content/src/quest-wave-04.data.js";
import {
  NARRATIVE_READ_MODES,
  OPERATIONAL_MODE_DEFINITIONS,
  OPERATIONAL_READ_KIND,
  classifyStateRead,
  interpretStateRead,
  normalizeOperationalSnapshot,
  normalizeSupportCharacterRecord,
  validateForcedTerminalBinding,
  validateSupportCharacterDepth,
} from "../packages/content/src/quest-wave-04.runtime.js";
import {
  BOUNDED_PARTICIPATION_CONTRACTS,
  COMPANION_QUEST_CONTRACTS,
  EXPANSION_CHARACTERS,
  EXPANSION_CREATURES,
  EXPANSION_ITEMS,
  EXPANSION_QUESTS,
  QUEST_ACTOR_CONTRACTS,
  interpretCanonicalQuestStateRead,
  validateNarrativeExpansion,
} from "../packages/content/src/narrative.data.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = JSON.parse(await readFile(new URL("./fixtures/quest-wave-04-v11.json", import.meta.url), "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

for (const binding of [fixture.source, fixture.runtime, ...fixture.evidence]) {
  const bytes = await readFile(resolve(root, binding.path));
  assert.equal(bytes.length, binding.bytes, `${binding.path} byte count changed`);
  assert.equal(sha256(bytes), binding.sha256, `${binding.path} hash changed`);
}

assert.deepEqual({
  supportingCharacters: QUEST_WAVE_04_SUPPORTING_CHARACTERS.length,
  newCreatures: QUEST_WAVE_04_CREATURES.length,
  signatureItems: QUEST_WAVE_04_ITEMS.length,
  quests: QUEST_WAVE_04_QUESTS.length,
  phaseGraphs: QUEST_WAVE_04_PHASE_GRAPHS.length,
  companionContracts: QUEST_WAVE_04_COMPANION_CONTRACTS.length,
  autonomousCompanionContracts: QUEST_WAVE_04_AUTONOMOUS_COMPANION_CONTRACTS.length,
  boundedParticipationContracts: QUEST_WAVE_04_BOUNDED_PARTICIPATION_CONTRACTS.length,
}, Object.fromEntries(Object.entries(fixture.sourceCounts).slice(0, 8)));

assert.deepEqual({
  characters: EXPANSION_CHARACTERS.length,
  creatures: EXPANSION_CREATURES.length,
  items: EXPANSION_ITEMS.length,
  quests: EXPANSION_QUESTS.length,
  autonomousCompanionContracts: COMPANION_QUEST_CONTRACTS.length,
  boundedParticipationContracts: BOUNDED_PARTICIPATION_CONTRACTS.length,
  actorContracts: QUEST_ACTOR_CONTRACTS.length,
}, Object.fromEntries(Object.entries(fixture.integratedCounts).slice(0, 7)));

const narrativeResult = validateNarrativeExpansion();
assert.equal(narrativeResult.valid, true, JSON.stringify(narrativeResult.errors, null, 2));

const readCounts = { narrative: 0, operational: 0 };
for (const quest of QUEST_WAVE_04_QUESTS) {
  for (const read of quest.stateReads) {
    const classification = classifyStateRead(read);
    if (classification.kind === OPERATIONAL_READ_KIND) {
      readCounts.operational += 1;
      assert.equal(classification.definition.questId, quest.id, `${read.mode} owner drifted`);
    } else {
      readCounts.narrative += 1;
      assert.ok(NARRATIVE_READ_MODES.includes(read.mode));
    }
  }
}
assert.deepEqual(readCounts, fixture.readPartitions);
assert.equal(OPERATIONAL_MODE_DEFINITIONS.length, fixture.readPartitions.operational);

const definitionByMode = new Map(OPERATIONAL_MODE_DEFINITIONS.map((definition) => [definition.mode, definition]));
assert.deepEqual(
  fixture.operationalPositiveFixtures.map(({ mode }) => mode).sort(),
  OPERATIONAL_MODE_DEFINITIONS.map(({ mode }) => mode).sort(),
  "Positive fixtures must cover every operational mode exactly once",
);
for (const positive of fixture.operationalPositiveFixtures) {
  const definition = definitionByMode.get(positive.mode);
  assert.ok(definition, `Unknown positive-fixture mode ${positive.mode}`);
  const row = {
    readKind: OPERATIONAL_READ_KIND,
    domain: definition.domain,
    key: definition.key,
    mode: definition.mode,
    values: definition.values,
  };
  assert.equal(normalizeOperationalSnapshot(row, positive.snapshot), positive.value);
  assert.deepEqual(
    interpretStateRead(row, { [definition.domain]: { [definition.key]: positive.snapshot } }),
    {
      readKind: OPERATIONAL_READ_KIND,
      domain: definition.domain,
      key: definition.key,
      value: positive.value,
      satisfied: true,
    },
  );
}
for (const negative of fixture.operationalNegativeFixtures) {
  const definition = definitionByMode.get(negative.mode);
  assert.ok(definition, `Unknown negative-fixture mode ${negative.mode}`);
  const row = {
    readKind: OPERATIONAL_READ_KIND,
    domain: definition.domain,
    key: definition.key,
    mode: definition.mode,
    values: definition.values,
  };
  assert.throws(() => normalizeOperationalSnapshot(row, negative.snapshot), new RegExp(negative.error));
}

let narrativeInterpretationCount = 0;
let crossDomainProof = null;
for (const quest of QUEST_WAVE_04_QUESTS) {
  for (const read of quest.stateReads) {
    if (classifyStateRead(read).kind === OPERATIONAL_READ_KIND) continue;
    const writer = EXPANSION_QUESTS.find((candidate) => candidate.stateWrites.some(({ key }) => key === read.key));
    assert.ok(writer, `No canonical writer found for ${read.key}`);
    const value = read.values[0];
    const stateByDomain = { [writer.stateDomain]: { [read.key]: value } };
    assert.deepEqual(interpretCanonicalQuestStateRead(quest.id, read, stateByDomain), {
      readKind: "narrative-state-v1",
      domain: writer.stateDomain,
      key: read.key,
      value,
      satisfied: true,
    });
    narrativeInterpretationCount += 1;
    if (!crossDomainProof && writer.stateDomain !== quest.stateDomain) crossDomainProof = { quest, read, writer, stateByDomain };
  }
}
assert.equal(narrativeInterpretationCount, fixture.readPartitions.narrative);
assert.ok(crossDomainProof, "Wave 04 needs a cross-domain narrative-read proof fixture");
assert.throws(
  () => interpretStateRead(crossDomainProof.read, crossDomainProof.stateByDomain, { questStateDomain: crossDomainProof.quest.stateDomain }),
  /state_read_value_missing/,
  "The immutable raw runtime must not be used directly for cross-domain narrative reads",
);
assert.equal(
  interpretCanonicalQuestStateRead(crossDomainProof.quest.id, crossDomainProof.read, crossDomainProof.stateByDomain).domain,
  crossDomainProof.writer.stateDomain,
);
const foreignQuest = QUEST_WAVE_04_QUESTS.find(({ id }) => id !== crossDomainProof.quest.id);
assert.throws(
  () => interpretCanonicalQuestStateRead(foreignQuest.id, crossDomainProof.read, crossDomainProof.stateByDomain),
  /state_read_not_owned_by_quest/,
);

const ownerDefinition = definitionByMode.get(fixture.ownerMismatch.mode);
const ownerRead = {
  readKind: OPERATIONAL_READ_KIND,
  domain: ownerDefinition.domain,
  key: ownerDefinition.key,
  mode: ownerDefinition.mode,
  values: [...ownerDefinition.values],
};
const ownerMismatchQuests = EXPANSION_QUESTS.map((quest) => quest.id === fixture.ownerMismatch.targetQuestId
  ? { ...quest, stateReads: [...quest.stateReads, ownerRead] }
  : quest);
const ownerMismatchResult = validateNarrativeExpansion({ quests: ownerMismatchQuests });
assert.equal(ownerMismatchResult.valid, false);
assert.ok(ownerMismatchResult.errors.some(({ code }) => code === "operational_read_owner_mismatch"));

const operationalQuest = QUEST_WAVE_04_QUESTS.find((quest) => quest.stateReads.some((read) => classifyStateRead(read).kind === OPERATIONAL_READ_KIND));
assert.ok(operationalQuest, "Wave 04 needs an operational schema-v9 downgrade proof fixture");
const downgradedQuest = { ...operationalQuest, schemaVersion: 2 };
const downgradeResult = validateNarrativeExpansion({
  quests: EXPANSION_QUESTS.map((quest) => quest.id === downgradedQuest.id ? downgradedQuest : quest),
});
assert.equal(downgradeResult.valid, false);
assert.ok(downgradeResult.errors.some(({ code }) => code === "schema_v2_forbidden_field"));
assert.ok(downgradeResult.errors.some(({ code }) => code === "operational_read_requires_schema_v9"));

const missingEntryReason = { ...COMPANION_QUEST_CONTRACTS[0] };
delete missingEntryReason.entryReason;
const missingEntryReasonResult = validateNarrativeExpansion({
  companionContracts: [missingEntryReason, ...COMPANION_QUEST_CONTRACTS.slice(1)],
});
assert.equal(missingEntryReasonResult.valid, false);
assert.ok(missingEntryReasonResult.errors.some(({ code }) => code === "missing_companion_entry_reason"));

const autonomyLeak = { ...BOUNDED_PARTICIPATION_CONTRACTS[0], mode: "autonomous_follower" };
const autonomyLeakResult = validateNarrativeExpansion({
  boundedParticipationContracts: [autonomyLeak, ...BOUNDED_PARTICIPATION_CONTRACTS.slice(1)],
});
assert.equal(autonomyLeakResult.valid, false);
assert.ok(autonomyLeakResult.errors.some(({ code }) => code === "bounded_contract_autonomy_field"));

const schemaV9Item = QUEST_WAVE_04_ITEMS.find(({ schemaVersion }) => schemaVersion === 9);
assert.ok(schemaV9Item, "Wave 04 needs a schema-v9 artifact downgrade proof fixture");
const downgradedItem = { ...schemaV9Item, schemaVersion: 2, itemSpecificClauseHash: "not-a-hash" };
const itemDowngradeResult = validateNarrativeExpansion({
  items: EXPANSION_ITEMS.map((item) => item.id === downgradedItem.id ? downgradedItem : item),
});
assert.equal(itemDowngradeResult.valid, false);
assert.ok(itemDowngradeResult.errors.some(({ code }) => code === "schema_v2_forbidden_item_field"));

const malformedV9Item = { ...schemaV9Item, itemSpecificClauseHash: "not-a-hash" };
const malformedV9ItemResult = validateNarrativeExpansion({
  items: EXPANSION_ITEMS.map((item) => item.id === malformedV9Item.id ? malformedV9Item : item),
});
assert.equal(malformedV9ItemResult.valid, false);
assert.ok(malformedV9ItemResult.errors.some(({ code }) => code === "invalid_clause_hash"));

assert.equal(QUEST_WAVE_04_SUPPORTING_CHARACTERS.length, fixture.sourceCounts.supportingCharacters);
const normalizedSignatures = [];
for (const character of QUEST_WAVE_04_SUPPORTING_CHARACTERS) {
  const normalized = normalizeSupportCharacterRecord(character);
  assert.equal(Object.hasOwn(normalized, "questIds"), false);
  assert.ok(Array.isArray(normalized.questArcIds) && normalized.questArcIds.length > 0);
  assert.equal(new Set(normalized.questArcIds).size, normalized.questArcIds.length);
  const signature = normalized.voice?.signature ?? normalized.dialogueProfile?.signature;
  assert.equal(typeof signature, "string", `${normalized.id} is missing a dialogue signature`);
  normalizedSignatures.push(signature.normalize("NFKC").trim().toLowerCase());
}
assert.equal(new Set(normalizedSignatures).size, normalizedSignatures.length, "Wave 04 dialogue signatures must remain unique after normalization");

for (const [label, integrated, wave] of [
  ["character", EXPANSION_CHARACTERS, QUEST_WAVE_04_SUPPORTING_CHARACTERS],
  ["creature", EXPANSION_CREATURES, QUEST_WAVE_04_CREATURES],
  ["item", EXPANSION_ITEMS, QUEST_WAVE_04_ITEMS],
  ["quest", EXPANSION_QUESTS, QUEST_WAVE_04_QUESTS],
]) {
  assert.equal(new Set(integrated.map(({ id }) => id)).size, integrated.length, `${label} union contains an ID collision`);
  assert.equal(new Set(wave.map(({ id }) => id)).size, wave.length, `Wave 04 ${label} IDs are not unique`);
  for (const { id } of wave) assert.equal(integrated.filter((entry) => entry.id === id).length, 1, `${label} ${id} collides with pre-Wave canon`);
}

const noSecretCharacters = QUEST_WAVE_04_SUPPORTING_CHARACTERS.filter(({ secret }) => !secret);
assert.deepEqual(noSecretCharacters.map(({ id }) => id).sort(), [...fixture.noSecretCharacterIds].sort());
for (const character of noSecretCharacters) {
  assert.deepEqual(validateSupportCharacterDepth(character), { variant: "equivalent-depth-without-secret-v1", valid: true });
  const missingVariant = { ...character };
  delete missingVariant.depthVariant;
  assert.throws(() => validateSupportCharacterDepth(missingVariant), /missing_explicit_depth_variant/);
}

const missingBriefCharacters = QUEST_WAVE_04_SUPPORTING_CHARACTERS.filter(({ visualBrief }) => !visualBrief);
assert.deepEqual(missingBriefCharacters.map(({ id }) => id).sort(), [...fixture.missingVisualBriefCharacterIds].sort());
for (const character of missingBriefCharacters) {
  assert.equal(character.pipeline.artStatus, "awaiting-art");
  assert.equal(character.pipeline.conceptMaster, null);
  assert.equal(character.pipeline.transparentCutout, null);
  assert.equal(character.pipeline.staticModel, null);
  assert.equal(character.pipeline.animatedModel, null);
}

const halixContract = QUEST_WAVE_04_AUTONOMOUS_COMPANION_CONTRACTS.find(({ companionId }) => companionId === fixture.halix.companionId);
assert.ok(halixContract);
const halixQuest = QUEST_WAVE_04_QUEST_BY_ID.get(fixture.halix.questId);
const halixPhaseGraph = QUEST_WAVE_04_PHASE_GRAPH_BY_ID.get(fixture.halix.phaseGraphId);
assert.ok(halixQuest && halixPhaseGraph);
assert.deepEqual(validateForcedTerminalBinding(halixContract, halixQuest, halixPhaseGraph), {
  outcomeId: fixture.halix.outcomeId,
  terminalPhaseId: fixture.halix.terminalPhaseId,
  valid: true,
});
assert.throws(
  () => validateForcedTerminalBinding({ ...halixContract, questId: "wrong_owner" }, halixQuest, halixPhaseGraph),
  /forced_terminal_binding_owner_mismatch/,
);

console.log(JSON.stringify({ valid: true, sourceCounts: fixture.sourceCounts, integratedCounts: fixture.integratedCounts, readCounts }, null, 2));
