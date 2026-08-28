import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { loadWorldContent, mutatedFixture, summarizeWorldContent, validateWorldContent } from "../tools/assets/lib/world-content.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifests = await loadWorldContent(rootDir);
const baseline = await validateWorldContent(manifests, { rootDir });
assert.equal(baseline.valid, true, baseline.errors.map(({ message }) => message).join("\n"));

const summary = summarizeWorldContent(manifests);
assert.deepEqual(summary.playableMeters, [96, 96]);
assert.equal(summary.chunks, 9);
assert.equal(summary.navCells, 9);
assert.equal(summary.navLinks, 12);
assert.equal(summary.assetsByCategory.structure, 7);
assert.equal(summary.assetsByCategory.surface, 6);
assert.equal(summary.assetsByCategory.prop, 10);
assert.equal(summary.assetsByCategory.foliage, 5);
assert.equal(summary.assetsByCategory.decal, 6);
assert.equal(summary.assetsByCategory.character, 4);
assert.equal(summary.assetsByCategory.enemy, 2);

const anchors = manifests.scene.chunks.flatMap((chunk) => [...chunk.interactionAnchors, ...chunk.spawnAnchors]);
const anchorById = new Map(anchors.map((anchor) => [anchor.id, anchor]));
assert.deepEqual(anchorById.get("player.start").transform.position, [28, 0, 16]);
assert.deepEqual(anchorById.get("landmark.hearthmere-square").transform.position, [28, 0, 20]);
assert.deepEqual(anchorById.get("landmark.old-vigil-shrine").transform.position, [16, 0, 28]);
assert.deepEqual(anchorById.get("npc.maela-voss").transform.position, [32, 0, 16]);
assert.deepEqual(anchorById.get("npc.torren-vale").transform.position, [36, 0, 20]);
assert.deepEqual(anchorById.get("npc.ysra-pell").transform.position, [20, 0, 28]);
assert.deepEqual(anchorById.get("enemy.ash-husk").transform.position, [24, 0, 32]);
assert.deepEqual(anchorById.get("enemy.ledger-crawler").transform.position, [20, 0, 32]);

async function rejectsFixture(name, fixture, code) {
  const result = await validateWorldContent(fixture, { rootDir, checkFiles: false });
  assert.equal(result.valid, false, `${name} fixture unexpectedly passed`);
  assert.ok(result.errors.some((error) => error.code === code), `${name} did not emit ${code}: ${JSON.stringify(result.errors)}`);
}

await rejectsFixture("duplicate asset", mutatedFixture(manifests, ({ assets }) => {
  assets.assets.push(structuredClone(assets.assets[0]));
}), "duplicate_id");

await rejectsFixture("triangle budget", mutatedFixture(manifests, ({ assets }) => {
  assets.assets.find(({ id }) => id === "hm.prop.rain-barrel-iron").geometry.lodTriangles[0] = 999999;
}), "triangle_budget");

await rejectsFixture("disconnected navigation", mutatedFixture(manifests, ({ scene }) => {
  for (const chunk of scene.chunks) chunk.navigation.links = chunk.navigation.links.filter((link) => !link.id.startsWith("navlink.00-"));
}), "disconnected_navigation");

await rejectsFixture("missing provenance", mutatedFixture(manifests, ({ assets }) => {
  assets.assets[0].provenance.sourceId = "source.missing";
}), "missing_provenance");

await rejectsFixture("incomplete external provenance", mutatedFixture(manifests, ({ licenses }) => {
  licenses.sources[0].originType = "external_cc0";
  licenses.sources[0].sourceUri = "https://example.invalid/source";
  licenses.sources[0].retrievedAt = null;
  licenses.sources[0].contentHash = null;
}), "incomplete_external_provenance");

await rejectsFixture("unknown phase", mutatedFixture(manifests, ({ scene }) => {
  scene.chunks[0].instances[0].phaseIds = ["invented-phase"];
}), "unknown_phase");

await rejectsFixture("exclusive phase conflict", mutatedFixture(manifests, ({ scene }) => {
  scene.chunks[0].instances[0].phaseIds = ["ember-ledger-unrestored", "ember-ledger-restored"];
}), "exclusive_phase_conflict");

await rejectsFixture("legacy mapping drift", mutatedFixture(manifests, ({ scene }) => {
  scene.chunks[0].spawnAnchors.find(({ id }) => id === "player.start").transform.position[0] += 1;
}), "legacy_mapping");

await rejectsFixture("missing referenced asset", mutatedFixture(manifests, ({ scene }) => {
  scene.chunks[0].instances[0].assetId = "hm.structure.missing";
}), "missing_asset");

const strict = await validateWorldContent(manifests, { rootDir, strictProduction: true, checkFiles: false });
assert.equal(strict.valid, false, "Strict production gate accepted procedural prototypes");
assert.equal(strict.errors.filter(({ code }) => code === "production_gate").length, manifests.assets.assets.length);

console.log(JSON.stringify({
  valid: true,
  assertions: 36,
  summary,
  adversarialFixtures: 9,
  strictProductionFailures: strict.errors.filter(({ code }) => code === "production_gate").length,
}, null, 2));
