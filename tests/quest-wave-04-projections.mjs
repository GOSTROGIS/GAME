import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = JSON.parse(await readFile(new URL("./fixtures/quest-wave-04-v11.json", import.meta.url), "utf8"));
const sourceBytes = await readFile(resolve(root, fixture.source.path));
const source = JSON.parse(sourceBytes.toString("utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const stableBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");

assert.equal(sourceBytes.length, fixture.source.bytes);
assert.equal(sha256(sourceBytes), fixture.source.sha256);

const sourceBinding = { ...fixture.source };
const narrative = {
  schemaVersion: 1,
  kind: "quest-wave-canonical-narrative-adapter",
  waveId: "quest-wave-04-v11",
  sourceBinding,
  supportingCharacters: source.supportingCharacters,
  newCreatures: source.newCreatures,
  signatureItems: source.signatureItems,
  quests: source.quests,
  phaseGraphs: source.phaseGraphs,
  companionContracts: source.companionContracts,
};
const world = {
  schemaVersion: 1,
  kind: "quest-wave-world-blockout-contract",
  waveId: "quest-wave-04-v11",
  sourceBinding,
  authority: {
    content: "accepted_authored_blockout_contract",
    atlasPlacement: "provisional_placement",
    runtimeIntegrated: false,
    productionGeometry: false,
    constructionReady: false,
  },
  provisionalFamilyLaws: source.provisionalFamilyLaws,
  existingCreatureEcologyDeepenings: source.existingCreatureEcologyDeepenings,
  creatureHabitatEnvelopes: source.creatureHabitatEnvelopes,
  environmentPrograms: source.environmentPrograms,
};
const spatialIndex = {
  schemaVersion: 1,
  kind: "quest-wave-spatial-compatibility-index",
  waveId: "quest-wave-04-v11",
  sourceBinding,
  fullWorldContractPath: fixture.projections.world.path,
  creatureHabitatEnvelopes: source.creatureHabitatEnvelopes
    .filter((entry) => source.newCreatures.some(({ id }) => id === entry.creatureId))
    .map((entry) => ({ ...entry })),
  environmentPrograms: source.environmentPrograms.map((entry) => ({
    schemaVersion: entry.schemaVersion,
    questId: entry.questId,
    locationId: entry.locationId,
    programKind: entry.programKind,
    territoryIds: entry.territoryIds,
    hostSiteId: entry.hostSiteId,
    hostAtlasAnchor: entry.canonicalGisEnvelope.hostAtlasAnchor,
    placement: entry.placement,
    designEnvelopeMeters: entry.designEnvelopeMeters,
    typologyIds: entry.typologyBindings.map(({ id }) => id),
    materialTags: [...new Set(entry.typologyBindings.flatMap(({ canonicalRecord }) => canonicalRecord.exteriorMaterials ?? []))],
    semanticAnchors: entry.semanticAnchors.map(({ id, anchorKey, kind, retainedSemanticAnchor, capacity, stateRule }) => ({
      id,
      anchorKey,
      kind,
      retainedSemanticAnchor,
      ...(capacity === undefined ? {} : { capacity }),
      ...(stateRule === undefined ? {} : { stateRule }),
    })),
    mutableLayers: entry.mutableLayers,
    environmentArtPipeline: entry.environmentArtPipeline,
    graphId: entry.blockoutExecutionContract.graphId,
    safeObservationCellIds: entry.blockoutExecutionContract.safeObservationCellIds,
    objectiveEndpointIds: entry.blockoutExecutionContract.objectiveEndpointIds,
    independentEgressPathIds: entry.blockoutExecutionContract.independentEgressPathIds,
    maturity: entry.streamingAndLod.maturity,
  })),
};

for (const [key, value] of Object.entries({ narrative, spatialIndex, world })) {
  const binding = fixture.projections[key];
  const expected = stableBytes(value);
  const actual = await readFile(resolve(root, binding.path));
  assert.equal(expected.length, binding.bytes, `${key} independently projected byte count changed`);
  assert.equal(sha256(expected), binding.sha256, `${key} independently projected hash changed`);
  assert.deepEqual(actual, expected, `${key} is not the reproducible source projection`);
}

assert.deepEqual({
  provisionalFamilyLaws: world.provisionalFamilyLaws.length,
  existingCreatureEcologyDeepenings: world.existingCreatureEcologyDeepenings.length,
  creatureHabitatEnvelopes: world.creatureHabitatEnvelopes.length,
  environmentPrograms: world.environmentPrograms.length,
}, {
  provisionalFamilyLaws: fixture.sourceCounts.provisionalFamilyLaws,
  existingCreatureEcologyDeepenings: fixture.sourceCounts.existingCreatureEcologyDeepenings,
  creatureHabitatEnvelopes: fixture.sourceCounts.creatureHabitatEnvelopes,
  environmentPrograms: fixture.sourceCounts.environmentPrograms,
});
assert.equal(spatialIndex.creatureHabitatEnvelopes.length, fixture.sourceCounts.newCreatures);
assert.equal(spatialIndex.environmentPrograms.length, fixture.sourceCounts.environmentPrograms);

const sorted = (values) => [...values].sort();
const questIds = narrative.quests.map(({ id }) => id);
assert.deepEqual(sorted(narrative.phaseGraphs.map(({ questId }) => questId)), sorted(questIds));
assert.deepEqual(sorted(world.environmentPrograms.map(({ questId }) => questId)), sorted(questIds));

const detailedCounts = {
  utilityEndpoints: 0,
  safeObservationCells: 0,
  objectiveEndpoints: 0,
  independentEgressPaths: 0,
};
for (const program of world.environmentPrograms) {
  detailedCounts.utilityEndpoints += program.utilityGraph.endpoints.length;
  detailedCounts.safeObservationCells += program.safeObservationCells.length;
  detailedCounts.objectiveEndpoints += program.objectivePhaseEndpoints.length;
  detailedCounts.independentEgressPaths += program.independentEgress.paths.length;
  assert.equal(program.placement.exactAtlasCoordinate, null);
  assert.equal(program.environmentArtPipeline.environmentKeyframe, null);
  assert.equal(program.environmentArtPipeline.blockoutMesh, null);
  assert.equal(program.environmentArtPipeline.productionMesh, null);
  assert.deepEqual(program.blockoutExecutionContract.utilityEndpointIds, program.utilityGraph.endpoints.map(({ id }) => id));
  assert.deepEqual(program.blockoutExecutionContract.safeObservationCellIds, program.safeObservationCells.map(({ id }) => id));
  assert.deepEqual(program.blockoutExecutionContract.objectiveEndpointIds, program.objectivePhaseEndpoints.map(({ objectiveId }) => objectiveId));
  assert.deepEqual(program.blockoutExecutionContract.independentEgressPathIds, program.independentEgress.paths.map(({ id }) => id));
}
assert.deepEqual(detailedCounts, {
  utilityEndpoints: 60,
  safeObservationCells: 12,
  objectiveEndpoints: 62,
  independentEgressPaths: 24,
});
assert.deepEqual(world.authority, {
  content: "accepted_authored_blockout_contract",
  atlasPlacement: "provisional_placement",
  runtimeIntegrated: false,
  productionGeometry: false,
  constructionReady: false,
});

console.log(JSON.stringify({
  valid: true,
  source: fixture.source,
  projections: fixture.projections,
  detailedCounts,
}, null, 2));
