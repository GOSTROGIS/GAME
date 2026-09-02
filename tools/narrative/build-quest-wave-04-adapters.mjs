#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const SOURCE_PATH = resolve(ROOT, "design-review/quest-release-evidence/quest-wave-04-v11.machine-annex.json");
const EXPECTED_SOURCE_BYTES = 4245855;
const EXPECTED_SOURCE_SHA256 = "12183ae9cbded83a65503c42b32c75f4824fad80c0da5f6c5340abd6dce11962";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const stableBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");

const sourceBytes = await readFile(SOURCE_PATH);
if (sourceBytes.length !== EXPECTED_SOURCE_BYTES || sha256(sourceBytes) !== EXPECTED_SOURCE_SHA256) {
  throw new Error("quest_wave_04_source_binding_mismatch");
}
const source = JSON.parse(sourceBytes.toString("utf8"));

const sourceBinding = {
  path: "design-review/quest-release-evidence/quest-wave-04-v11.machine-annex.json",
  bytes: EXPECTED_SOURCE_BYTES,
  sha256: EXPECTED_SOURCE_SHA256,
};

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
  fullWorldContractPath: "packages/content/manifests/quest-wave-04-v11.world.json",
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

const outputs = [
  ["packages/content/manifests/quest-wave-04-v11.narrative.json", stableBytes(narrative)],
  ["packages/content/manifests/quest-wave-04-v11.spatial-index.json", stableBytes(spatialIndex)],
  ["packages/content/manifests/quest-wave-04-v11.world.json", stableBytes(world)],
];

for (const [relativePath, bytes] of outputs) {
  const outputPath = resolve(ROOT, relativePath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, bytes);
}

process.stdout.write(`${JSON.stringify({
  sourceBinding,
  outputs: outputs.map(([path, bytes]) => ({ path, bytes: bytes.length, sha256: sha256(bytes) })),
}, null, 2)}\n`);
