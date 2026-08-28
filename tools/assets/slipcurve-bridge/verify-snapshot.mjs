import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const TOOL_ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:([A-Za-z]):)/, "$1:"));
const GAME_ROOT = path.resolve(TOOL_ROOT, "../../..");
const CATALOG_ROOT = path.join(GAME_ROOT, "packages/content/manifests/slipcurve-seeds");
const SEED_ROOT = path.join(GAME_ROOT, "assets/3d/seeds/slipcurve");
const digest = (buffer) => createHash("sha256").update(buffer).digest("hex");

const index = JSON.parse(await readFile(path.join(CATALOG_ROOT, "index.json"), "utf8"));
assert.equal(index.schema, "SlipcurveSeedCatalogIndexV1");
assert.equal(index.sourceIdentity, "slipcurve-sitelib");
assert.equal(index.counts.records, 1087);
assert.equal(index.counts.historicalAcceptedVocabulary, 982);
assert.equal(index.counts.historicalRejectedVocabulary, 105);
assert.equal(index.counts.historicalReferences, 134);
assert.equal(index.maturity, "prototype_geometry");
assert.equal(index.productionEligible, false);

const records = [], ids = new Set();
for (const shardRef of index.shards) {
  const buffer = await readFile(path.join(CATALOG_ROOT, shardRef.path));
  assert.equal(digest(buffer), shardRef.sha256, `${shardRef.path} hash`);
  const shard = JSON.parse(buffer.toString("utf8"));
  assert.equal(shard.records.length, shardRef.count);
  assert.equal(shard.start, shardRef.start);
  for (const record of shard.records) {
    assert.equal(ids.has(record.id), false, `duplicate ${record.id}`);
    ids.add(record.id);
    assert.equal(record.maturity, "prototype_geometry");
    assert.equal(record.productionEligible, false);
    assert.ok(["accepted_seed", "quarantined", "rejected"].includes(record.classification));
    if (record.classification === "accepted_seed") {
      assert.equal(record.primitiveScene.schema, "PrimitiveSceneV1");
      assert.ok(record.primitiveScene.events.length > 0);
      assert.equal(record.primitiveScene.unsupportedOutputEvidence.length, 0);
      assert.equal(record.evidence.length, 0);
    }
    records.push(record);
  }
}
assert.equal(records.length, 1087);
for (const classification of ["accepted_seed", "quarantined", "rejected"]) {
  assert.equal(records.filter((record) => record.classification === classification).length, index.counts.classifications[classification]);
}

const references = JSON.parse(await readFile(path.join(CATALOG_ROOT, "references.json"), "utf8"));
assert.equal(references.count, 134);
assert.equal(references.references.length, 134);

const seeds = JSON.parse(await readFile(path.join(SEED_ROOT, "index.json"), "utf8"));
assert.equal(seeds.count, 24);
for (const asset of seeds.assets) {
  const buffer = await readFile(path.join(SEED_ROOT, asset.path));
  assert.equal(buffer.length, asset.bytes);
  assert.equal(digest(buffer), asset.sha256);
  assert.equal(buffer.readUInt32LE(0), 0x46546c67);
  assert.equal(buffer.readUInt32LE(4), 2);
  assert.equal(asset.maturity, "prototype_geometry");
  assert.equal(asset.productionEligible, false);
}

console.log(`slipcurve snapshot verified: ${records.length} records, ${index.counts.classifications.accepted_seed} accepted seeds, ${seeds.count} representative GLBs`);
