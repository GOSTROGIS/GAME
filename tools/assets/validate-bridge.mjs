#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";
import { within } from "./slipcurve-bridge/lib/canonical.mjs";
import { assertSafeGameOutputRoots } from "./slipcurve-bridge/lib/safe-paths.mjs";

const GAME_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:([A-Za-z]):)/, "$1:")), "../..");
const MANIFEST_ROOT = path.join(GAME_ROOT, "packages/content/manifests");
const CATALOG_ROOT = path.join(MANIFEST_ROOT, "slipcurve-seeds");
const RUNTIME_ROOT = path.join(GAME_ROOT, "assets/3d/runtime/bridge");
const SEED_ROOT = path.join(GAME_ROOT, "assets/3d/seeds/slipcurve");
const metadataOnly = process.argv.includes("--metadata-only");
const strictProduction = process.argv.includes("--strict-production");
for (const argument of process.argv.slice(2)) if (!["--metadata-only", "--strict-production"].includes(argument)) throw new Error(`Unknown bridge validation argument ${argument}`);
const digest = (value) => createHash("sha256").update(value).digest("hex");
const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));
const relative = (root, file) => path.relative(root, file).replaceAll("\\", "/");

function assertHash(value, label) {
  assert.match(value, /^[a-f0-9]{64}$/, `${label} must be a SHA-256 digest`);
}

function collectUris(value, found = []) {
  if (!value || typeof value !== "object") return found;
  if (Array.isArray(value)) { for (const nested of value) collectUris(nested, found); return found; }
  for (const [key, nested] of Object.entries(value)) {
    if (key === "uri" && typeof nested === "string") found.push(nested);
    collectUris(nested, found);
  }
  return found;
}

function inspectGlb(buffer, label) {
  assert.ok(buffer.length >= 20, `${label} is truncated`);
  assert.equal(buffer.readUInt32LE(0), 0x46546c67, `${label} GLB magic`);
  assert.equal(buffer.readUInt32LE(4), 2, `${label} GLB version`);
  assert.equal(buffer.readUInt32LE(8), buffer.length, `${label} GLB length`);
  const jsonLength = buffer.readUInt32LE(12);
  assert.equal(buffer.readUInt32LE(16), 0x4e4f534a, `${label} JSON chunk`);
  const gltf = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString("utf8").trim());
  assert.deepEqual(collectUris(gltf), [], `${label} must be self-contained`);
  return gltf;
}

async function walkExactAssets(root) {
  const rootInfo = await lstat(root);
  assert.equal(rootInfo.isSymbolicLink(), false, `${relative(GAME_ROOT, root)} root must not be a symlink/reparse point`);
  assert.equal(within(await realpath(GAME_ROOT), await realpath(root)), true, `${relative(GAME_ROOT, root)} root must resolve inside GAME`);
  const found = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      const stat = await lstat(full);
      assert.equal(stat.isSymbolicLink(), false, `${relative(root, full)} must not be a symlink`);
      if (stat.isDirectory()) await visit(full);
      else if (stat.isFile()) found.push(relative(root, full));
      else assert.fail(`${relative(root, full)} has an unsupported file type`);
    }
  }
  await visit(root);
  return found.sort();
}

await assertSafeGameOutputRoots(GAME_ROOT, [MANIFEST_ROOT, CATALOG_ROOT, RUNTIME_ROOT, SEED_ROOT]);

const [index, sourceLock, bridgeSource, authored, sceneIndex, lineage, assignmentIndex, runtime, licenses, seedIndex] = await Promise.all([
  readJson(path.join(CATALOG_ROOT, "index.json")),
  readJson(path.join(GAME_ROOT, "tools/assets/slipcurve-bridge/source-lock.json")),
  readJson(path.join(MANIFEST_ROOT, "sable-reach.bridge-source.json")),
  readJson(path.join(MANIFEST_ROOT, "sable-reach.bridge-authored.json")),
  readJson(path.join(MANIFEST_ROOT, "sable-reach.bridge-scenes.json")),
  readJson(path.join(MANIFEST_ROOT, "sable-reach.bridge-lineage.json")),
  readJson(path.join(MANIFEST_ROOT, "sable-reach.bridge-seed-assignments.json")),
  readJson(path.join(MANIFEST_ROOT, "sable-reach.bridge-runtime.json")),
  readJson(path.join(MANIFEST_ROOT, "hearthmere.licenses.json")),
  readJson(path.join(SEED_ROOT, "index.json")),
]);

assert.equal(sourceLock.schema, "SlipcurveSourceLockV1");
assert.equal(index.sourceIdentity, sourceLock.sourceIdentity);
assert.equal(bridgeSource.sourceIdentity, sourceLock.sourceIdentity);
assert.equal(runtime.runtimeAssetPacks.every(({ provenance }) => provenance.sourceId === sourceLock.sourceIdentity), true);
assert.equal(index.sourceContentCommit, sourceLock.sourceContentCommit);
assert.equal(index.captureWorkspaceHead, sourceLock.captureWorkspaceHead);
assert.equal(bridgeSource.pins.sourceContentCommit, sourceLock.sourceContentCommit);
assert.equal(bridgeSource.pins.captureWorkspaceHead, sourceLock.captureWorkspaceHead);
assert.equal(index.instrumentationVersion, sourceLock.instrumentationVersion);
assert.deepEqual(index.chromium, sourceLock.chromium);
assert.equal(bridgeSource.pins.instrumentationVersion, sourceLock.instrumentationVersion);
assert.deepEqual(bridgeSource.pins.chromium, sourceLock.chromium);
assert.deepEqual(index.inputHashes, sourceLock.inputs);
assert.equal(bridgeSource.inputSetHash, index.inputSetHash);
assert.equal(lineage.sourceCatalogInputSetHash, index.inputSetHash);
assert.equal(assignmentIndex.sourceCatalogInputSetHash, index.inputSetHash);
assert.equal(sourceLock.authorization.id, index.authorization.id);
assert.equal(sourceLock.authorization.id, bridgeSource.authorization.id);
assert.ok(Object.values(sourceLock.authorization).filter((value) => typeof value === "boolean").every(Boolean));
assert.equal(sourceLock.historicalCrosswalk.distinctGeneratorRepresentatives, index.counts.records);
assert.equal(sourceLock.historicalCrosswalk.acceptedVocabularyExports, index.counts.historicalAcceptedVocabulary);
assert.equal(sourceLock.historicalCrosswalk.rejectedVocabularyCandidates, index.counts.historicalRejectedVocabulary);
assert.equal(sourceLock.historicalCrosswalk.phaseRotationViewSceneReferences, index.counts.historicalReferences);
assert.equal(bridgeSource.historicalCrosswalk.representatives, sourceLock.historicalCrosswalk.distinctGeneratorRepresentatives);
assert.equal(bridgeSource.historicalCrosswalk.acceptedVocabularyExports, sourceLock.historicalCrosswalk.acceptedVocabularyExports);
assert.equal(bridgeSource.historicalCrosswalk.rejectedVocabularyCandidates, sourceLock.historicalCrosswalk.rejectedVocabularyCandidates);
assert.equal(bridgeSource.historicalCrosswalk.phaseRotationViewSceneReferences, sourceLock.historicalCrosswalk.phaseRotationViewSceneReferences);
const license = licenses.licenses.find(({ id }) => id === sourceLock.authorization.id);
const sourceNotice = licenses.sources.find(({ id }) => id === "source.slipcurve.sitelib.generator-snapshot");
assert.ok(license?.commercialUse && license?.redistributableWithProject, "owner authorization must be published in the license manifest");
assert.equal(sourceNotice?.licenseId, sourceLock.authorization.id);
assert.equal(sourceNotice?.contentHash, index.inputSetHash);
assert.equal(authored.derivativeCount, 96);
assert.equal(sceneIndex.sceneBackedCellCount, 7);
assert.equal(sceneIndex.dataOnlyCellCount, 761);

const shardNames = (await readdir(CATALOG_ROOT)).filter((name) => /^catalog-\d{4}-\d{4}\.json$/.test(name)).sort();
assert.deepEqual(shardNames, index.shards.map(({ path: shardPath }) => shardPath));
const shardDocuments = await Promise.all(shardNames.map(async (name) => {
  const buffer = await readFile(path.join(CATALOG_ROOT, name));
  const ref = index.shards.find(({ path: shardPath }) => shardPath === name);
  assert.equal(digest(buffer), ref.sha256, `${name} hash drifted`);
  const document = JSON.parse(buffer.toString("utf8"));
  assert.equal(document.records.length, ref.count);
  return document;
}));
const records = shardDocuments.flatMap(({ records: shardRecords }) => shardRecords);
assert.equal(records.length, 1087);
assert.equal(new Set(records.map(({ id }) => id)).size, 1087);
assert.equal(new Set(records.map(({ generatorIdentity }) => generatorIdentity)).size, 1087);
assert.deepEqual(Object.fromEntries(["accepted_seed", "quarantined", "rejected"].map((classification) => [classification, records.filter((record) => record.classification === classification).length])), index.counts.classifications);
for (const record of records) {
  assert.equal(record.schema, "CatalogAssetRecordV1");
  assert.equal(record.maturity, "prototype_geometry");
  assert.equal(record.productionEligible, false);
  assert.ok(["accepted_seed", "quarantined", "rejected"].includes(record.classification));
  assert.equal(record.primitiveScene?.schema, "PrimitiveSceneV1");
  assert.equal(record.primitiveScene?.coordinateSpace, "game_y_up");
  assert.equal(record.primitiveScene?.sourceToGameAxes, "(x,y,z)->(x,z,y)");
  assert.equal(record.primitiveScene?.quantizationMetres, 0.001);
  assertHash(record.primitiveScene.eventHash, `${record.id} event hash`);
  assertHash(record.primitiveScene.topologySignature, `${record.id} topology signature`);
  assertHash(record.primitiveScene.deterministicHash, `${record.id} deterministic hash`);
  if (record.primitiveScene.bounds === null) assert.equal(record.primitiveScene.events.length, 0, `${record.id} null bounds require empty geometry`);
  else for (const tuple of [record.primitiveScene.bounds.min, record.primitiveScene.bounds.max]) assert.ok(tuple.length === 3 && tuple.every(Number.isFinite), `${record.id} has invalid bounds`);
  if (record.classification === "accepted_seed") {
    assert.ok(record.topology && record.topology.signature === record.primitiveScene.topologySignature, `${record.id} accepted topology is unresolved`);
    assert.ok(record.primitiveScene.events.length > 0 && record.primitiveScene.bounds !== null, `${record.id} accepted seed lacks finite geometry`);
    assert.deepEqual(record.primitiveScene.unsupportedOutputEvidence, []);
    assert.deepEqual(record.evidence, []);
  }
}
const accepted = new Map(records.filter(({ classification }) => classification === "accepted_seed").map((record) => [record.id, record]));

assert.equal(lineage.records.length, 96);
assert.equal(new Set(lineage.records.map(({ derivativeId }) => derivativeId)).size, 96);
assert.equal(new Set(lineage.records.map(({ outputSha256 }) => outputSha256)).size, 96, "all runtime derivatives must have distinct topology bytes");
assert.ok(new Set(lineage.records.map(({ originalPatternId }) => originalPatternId)).size >= 20, "authored repertoire is too narrow");
assert.equal(new Set(lineage.records.map(({ authoredTopologySignature }) => authoredTopologySignature)).size, 96, "every derivative needs a substantively distinct authored topology recipe");
assert.equal(Object.keys(lineage.assignments).length, 96);
assert.deepEqual(assignmentIndex.assignments, lineage.assignments);
assert.equal(runtime.maturity, "prototype_geometry");
assert.equal(runtime.productionEligible, false);
assert.equal(runtime.runtimeAssetPacks.length, 7);
assert.equal(authored.derivativeCount, lineage.records.length);
const runtimeDependencies = runtime.runtimeAssetPacks.flatMap(({ dependencies }) => dependencies);
assert.equal(runtimeDependencies.length, 96);
assert.equal(new Set(runtimeDependencies.map(({ id }) => id)).size, 96);
for (const record of lineage.records) {
  const seed = accepted.get(record.sourceSeedId);
  assert.ok(seed, `${record.derivativeId} does not resolve an accepted seed`);
  assert.equal(seed.topology.signature, record.sourceTopologySignature);
  assert.equal(lineage.assignments[record.derivativeId], record.sourceSeedId);
  assert.equal(record.maturity, "prototype_geometry");
  assert.equal(record.productionEligible, false);
  assert.equal(record.sourceEventRetention, 0, `${record.derivativeId} retained source primitives`);
  assertHash(record.authoredTopologySignature, `${record.derivativeId} authored topology signature`);
  assert.match(record.originalityMethod, /not transformed or retained/i);
  assert.equal(record.sourceBoundsAspect.length, 3);
  assert.ok(record.sourceBoundsAspect.every((value) => Number.isFinite(value) && value >= .78 && value <= 1.22));
  assert.deepEqual(record.materialUsage, [0, 1, 2]);
  assert.equal(record.materialCount, 3);
  assert.deepEqual(record.pivot, { mode: "ground_center", offset: [0, 0, 0] });
  assert.ok(record.colliderProfile.height > 0 && (record.colliderProfile.shape === "box" ? record.colliderProfile.size?.every((axis) => axis > 0) : record.colliderProfile.radius > 0), `${record.derivativeId} lacks a usable authored collider`);
  assert.equal(record.lodTriangles.length, 3);
  assert.ok(record.lodTriangles[0] > record.lodTriangles[1] && record.lodTriangles[1] > record.lodTriangles[2], `${record.derivativeId} LOD triangles are not strictly decreasing`);
}

for (const pack of runtime.runtimeAssetPacks) {
  const expected = pack.siteId === "site.hearthmere" ? 24 : 12;
  assert.equal(pack.dependencies.length, expected);
  assert.equal(pack.dependencyIds.length, expected);
  assert.equal(new Set(pack.dependencyIds).size, expected);
  assert.equal(pack.decodedGpuBytes, pack.dependencies.reduce((sum, dependency) => sum + dependency.gpuBytes.total, 0));
  assert.equal(pack.encodedBytes, pack.dependencies.reduce((sum, dependency) => sum + dependency.encodedBytes, 0));
  assert.ok(pack.decodedGpuBytes <= pack.limits.integratedGpuBytes);
  assert.deepEqual(pack.provenance.recipeIds, pack.dependencyIds.map((id) => `bridge.recipe.${id.slice("bridge.asset.".length)}`));
  for (const dependency of pack.dependencies) {
    assert.deepEqual(dependency.externalUris, []);
    assert.match(dependency.path, /^assets\/3d\/runtime\/bridge\/(?:[a-z0-9][a-z0-9._-]*\/)+[a-z0-9][a-z0-9._-]*\.glb$/);
    assertHash(dependency.sha256, `${dependency.id} runtime hash`);
    assert.equal(dependency.kind, "glb");
    assert.equal(dependency.gpuBytes.total, dependency.gpuBytes.vertex + dependency.gpuBytes.index + dependency.gpuBytes.textureMipChain);
  }
}

const eagerBarrel = await readFile(path.join(GAME_ROOT, "packages/content/src/index.ts"), "utf8");
assert.doesNotMatch(eagerBarrel, /bridgeCatalog|bridgeAssets|siteScenes|slipcurve-seeds/);

if (!metadataOnly) {
  const declaredRuntime = runtimeDependencies.map(({ path: runtimePath }) => runtimePath.slice("assets/3d/runtime/bridge/".length)).sort();
  const diskRuntime = await walkExactAssets(RUNTIME_ROOT);
  assert.deepEqual(diskRuntime, declaredRuntime, "runtime bridge directory contains missing, orphaned, or undeclared assets");
  for (const dependency of runtimeDependencies) {
    const buffer = await readFile(path.join(GAME_ROOT, dependency.path));
    assert.equal(buffer.length, dependency.encodedBytes);
    assert.equal(digest(buffer), dependency.sha256);
    const gltf = inspectGlb(buffer, dependency.id);
    assert.deepEqual(gltf.nodes.map(({ name }) => name), ["LOD0", "LOD1", "LOD2"]);
    assert.equal(gltf.meshes.length, 3);
    assert.equal(gltf.materials.length, 3);
    assert.equal(gltf.images, undefined);
    assert.deepEqual([...new Set(gltf.meshes.flatMap((mesh) => mesh.primitives.map(({ material }) => material)))].sort(), [0, 1, 2], `${dependency.id} must realize all semantic materials`);
    assert.deepEqual([...new Set(gltf.meshes[0].primitives.map(({ material }) => material))].sort(), [0, 1, 2], `${dependency.id} LOD0 must preserve all semantic material partitions`);
    for (const mesh of gltf.meshes) {
      const positionAccessors = mesh.primitives.map(({ attributes }) => gltf.accessors[attributes.POSITION]);
      const minimum = [0, 1, 2].map((axis) => Math.min(...positionAccessors.map(({ min }) => min[axis])));
      const maximum = [0, 1, 2].map((axis) => Math.max(...positionAccessors.map(({ max }) => max[axis])));
      assert.ok(Math.abs(minimum[1]) <= .001, `${dependency.id}/${mesh.name} is not grounded at y=0`);
      assert.ok(Math.abs(minimum[0] + maximum[0]) <= .001 && Math.abs(minimum[2] + maximum[2]) <= .001, `${dependency.id}/${mesh.name} is not centered on its x/z pivot`);
    }
    const line = lineage.records.find(({ derivativeId }) => derivativeId === dependency.id);
    const triangles = gltf.meshes.map((mesh) => mesh.primitives.reduce((sum, primitive) => sum + gltf.accessors[primitive.indices].count / 3, 0));
    assert.deepEqual(triangles, line.lodTriangles);
    const vertex = gltf.bufferViews.filter(({ target }) => target === 34962).reduce((sum, view) => sum + view.byteLength, 0);
    const indices = gltf.bufferViews.filter(({ target }) => target === 34963).reduce((sum, view) => sum + view.byteLength, 0);
    assert.equal(dependency.gpuBytes.vertex, vertex);
    assert.equal(dependency.gpuBytes.index, indices);
  }

  assert.equal(seedIndex.count, 24);
  assert.equal(seedIndex.assets.length, 24);
  const diskSeeds = (await walkExactAssets(SEED_ROOT)).filter((name) => name.endsWith(".glb"));
  assert.deepEqual(diskSeeds, seedIndex.assets.map(({ path: seedPath }) => seedPath).sort(), "representative seed directory contains orphaned GLBs");
  for (const asset of seedIndex.assets) {
    const buffer = await readFile(path.join(SEED_ROOT, asset.path));
    assert.equal(buffer.length, asset.bytes);
    assert.equal(digest(buffer), asset.sha256);
    assert.deepEqual(collectUris(inspectGlb(buffer, asset.recordId)), []);
    assert.equal(asset.maturity, "prototype_geometry");
    assert.equal(asset.productionEligible, false);
  }
}

if (strictProduction) {
  for (const id of [...runtimeDependencies.map(({ id }) => id), ...seedIndex.assets.map(({ recordId }) => recordId)]) console.error(`ERROR [production_gate] ${id} remains prototype_geometry and is intentionally ineligible for production approval`);
  console.error(`FAIL bridge strict-production gate · ${runtimeDependencies.length + seedIndex.assets.length} prototype assets remain red`);
  process.exitCode = 1;
} else {
  console.log(`PASS bridge ${metadataOnly ? "metadata" : "full-asset"} validation · ${records.length} classified · ${lineage.records.length} original derivatives · ${runtime.runtimeAssetPacks.length} site packs · strict production remains red`);
}
