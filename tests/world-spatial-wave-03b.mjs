import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { sha256, validateJsonSchema } from "../tools/worldgen/validate-site-blockout-reference-v2.mjs";
import {
  WAVE_03B_EXPECTED_STATS,
  WAVE_03B_REVIEW_A_PATH,
  WAVE_03B_REVIEW_B_PATH,
  WAVE_03B_REVIEWED_MATURITY,
  validateWorldSpatialWave03b,
} from "../tools/worldgen/validate-world-spatial-wave-03b.mjs";

const readJson = (url) => JSON.parse(readFileSync(url, "utf8"));
const schema = readJson(new URL("../assets/world/spatial/site-blockout-reference-v2.schema.json", import.meta.url));
const index = readJson(new URL("../assets/world/spatial/wave-03b/index.json", import.meta.url));
const site = readJson(new URL("../assets/world/spatial/wave-03b/hollow-abbey.site.json", import.meta.url));
const provenance = readJson(new URL("../assets/world/spatial/wave-03b/provenance.json", import.meta.url));
const reviewA = readJson(new URL(`../${WAVE_03B_REVIEW_A_PATH}`, import.meta.url));
const reviewB = readJson(new URL(`../${WAVE_03B_REVIEW_B_PATH}`, import.meta.url));

const validation = await validateWorldSpatialWave03b();
assert.equal(validation.valid, true, JSON.stringify(validation.errors, null, 2));
assert.deepEqual(validation.stats, WAVE_03B_EXPECTED_STATS);
assert.deepEqual(validateJsonSchema(schema, site), []);

assert.equal(schema.additionalProperties, false);
for (const key of ["sourceBindings", "zones", "spaces", "nodes", "links", "activityPhases", "routePrograms"]) {
  assert.equal(schema.properties[key].minItems, 1);
  assert.equal("maxItems" in schema.properties[key], false, `${key} count belongs in the packet validator, not the reusable schema`);
}
assert.equal(index.status, WAVE_03B_REVIEWED_MATURITY);
assert.equal(provenance.maturity, WAVE_03B_REVIEWED_MATURITY);
assert.equal(reviewA.review.disposition, "accept_noncanonical_reference");
assert.equal(reviewB.review.disposition, "accept_noncanonical_reference");
assert.equal(reviewA.review.independent, true);
assert.equal(reviewB.review.independent, true);
assert.notEqual(reviewA.review.role, reviewB.review.role);
assert.equal(provenance.reviewEvidence.reviewAManifestSha256, validation.evidence.reviews.a.sha256);
assert.equal(provenance.reviewEvidence.reviewBManifestSha256, validation.evidence.reviews.b.sha256);
assert.equal(site.spaces.length, 45);
assert.deepEqual(site.zones.map(({ spaceIds }) => spaceIds.length), [10, 21, 14]);
assert.equal(site.nodes.length, 48);
assert.equal(site.nodes.filter(({ traversable }) => traversable).length, 47);
assert.equal(site.links.length, 60);
assert.equal(site.links.reduce((count, { bidirectional }) => count + (bidirectional ? 2 : 1), 0), 120);
assert.ok(site.links.every(({ bidirectional }) => bidirectional));
assert.ok(site.links.some(({ id }) => id === "link.hollow-abbey.021.n01-n03"));
assert.ok(site.links.some(({ id }) => id === "link.hollow-abbey.044.o01-m01"));
assert.equal(site.spaces.some(({ code }) => code === "X01"), false);
assert.equal(site.nodes.find(({ kind }) => kind === "overlay_proxy").traversable, false);
assert.equal(site.links.some(({ fromNodeId, toNodeId }) => [fromNodeId, toNodeId].includes("node.hollow-abbey.overlay-cause-frames")), false);
assert.equal(site.spatialReference.coordinateSpaceId, "veyl_local_grid_v1");
assert.deepEqual(site.spatialReference.atlasAnchorToLocalOriginOffsetMeters, [0, 0, 12]);
assert.deepEqual(site.spatialReference.localOriginAtlasCoordinate, [11776, 2048, 108]);
assert.deepEqual(site.spaces.find(({ code }) => code === "G01").localCentroidMeters, [0, 0, 0]);

const mainState = site.stateMachines.find(({ id }) => id === "state.hollow-abbey.main-litany");
const preReleaseStates = mainState.states.slice(0, -1);
assert.deepEqual(
  mainState.rules
    .filter(({ targetId, state }) => targetId === "link.hollow-abbey.046.m01-m02" && preReleaseStates.includes(state))
    .map(({ state }) => state),
  preReleaseStates,
);
assert.ok(mainState.rules
  .filter(({ targetId, state }) => targetId === "link.hollow-abbey.046.m01-m02" && preReleaseStates.includes(state))
  .every(({ behavior }) => /sealed and non-traversable/i.test(behavior)));
assert.deepEqual(
  site.routePrograms.find(({ id }) => id === "route-program.hollow-abbey.foundry-funeral").nodeIds,
  ["node.hollow-abbey.f06", "node.hollow-abbey.f07", "node.hollow-abbey.p06", "node.hollow-abbey.route-outbound"],
);
assert.deepEqual(
  site.habitats.find(({ id }) => id === "habitat.hollow-abbey.foreword-cantor").population,
  { minimum: 1, maximum: 4, rule: "One per active result-cause debt within the accepted overlay; never substitute for Cantor Oss or ambient Echo Choir." },
);
assert.deepEqual(site.artDirection.acceptedReferenceIds, [
  "concept_hollow_abbey_nave",
  "concept_hollow_abbey_processional_west_arrival",
  "concept_hollow_abbey_mute_nave_route_read",
  "concept_hollow_abbey_rain_court_work_nexus",
]);
assert.equal(
  site.sourceBindings.find(({ id }) => id === "source.art.hollow-abbey-accepted").selector,
  "ENVIRONMENT_ART_DIRECTION.acceptedVisualReferences[id in concept_hollow_abbey_nave,concept_hollow_abbey_processional_west_arrival,concept_hollow_abbey_mute_nave_route_read,concept_hollow_abbey_rain_court_work_nexus]",
  "The accepted Foundry direction must not be retroactively inserted into the frozen Wave 03B art-input selector",
);

let rejectedFixtures = 0;

async function assertRejectedSite(label, mutate, expectedFragment) {
  const fixture = structuredClone(site);
  mutate(fixture);
  const result = await validateWorldSpatialWave03b({ siteOverride: fixture });
  assert.equal(result.valid, false, `${label} fixture must be rejected`);
  assert.ok(result.errors.some((message) => message.includes(expectedFragment)), `${label}: missing ${expectedFragment}\n${JSON.stringify(result.errors, null, 2)}`);
  rejectedFixtures += 1;
}

await assertRejectedSite("schema-extra-property", (fixture) => {
  fixture.unexpectedTopLevelProperty = true;
}, "Schema validation failed: $.unexpectedTopLevelProperty is not allowed");

await assertRejectedSite("missing-n01-n03", (fixture) => {
  fixture.links.splice(fixture.links.findIndex(({ id }) => id === "link.hollow-abbey.021.n01-n03"), 1);
}, "Required N01-N03 link is missing");

await assertRejectedSite("missing-o01-m01", (fixture) => {
  fixture.links.splice(fixture.links.findIndex(({ id }) => id === "link.hollow-abbey.044.o01-m01"), 1);
}, "Required O01-M01 link is missing");

await assertRejectedSite("reverse-duplicate-link", (fixture) => {
  fixture.links.at(-1).fromNodeId = fixture.links[0].toNodeId;
  fixture.links.at(-1).toNodeId = fixture.links[0].fromNodeId;
}, "Base links contain a duplicate or reverse-duplicate endpoint pair");

await assertRejectedSite("overlay-proxy-traversal", (fixture) => {
  fixture.links[0].fromNodeId = "node.hollow-abbey.overlay-cause-frames";
}, "illegally turns an overlay proxy into base traversal");

await assertRejectedSite("m02-missing-pre-release-rule", (fixture) => {
  const machine = fixture.stateMachines.find(({ id }) => id === "state.hollow-abbey.main-litany");
  machine.rules = machine.rules.filter(({ targetId, state }) => !(targetId === "link.hollow-abbey.046.m01-m02" && state === "gate_sealed"));
}, "M02 must be explicitly sealed and non-traversable in every pre-release state");

await assertRejectedSite("m02-premature-release", (fixture) => {
  fixture.stateMachines.find(({ id }) => id === "state.hollow-abbey.main-litany").initialState = "memory_return_released";
}, "Main Litany state order drifted");

await assertRejectedSite("m02-south-side-premature-open", (fixture) => {
  const rules = fixture.stateMachines.find(({ id }) => id === "state.hollow-abbey.main-litany").rules;
  rules.find(({ targetId, state }) => targetId === "link.hollow-abbey.047.m02-n06" && state === "crypt_discovered").linkTraversal = "open";
}, "link.hollow-abbey.047.m02-n06 exact Main Litany traversal matrix drifted");

await assertRejectedSite("m02-south-side-rule-removed", (fixture) => {
  const machine = fixture.stateMachines.find(({ id }) => id === "state.hollow-abbey.main-litany");
  machine.rules = machine.rules.filter(({ targetId, state }) => !(targetId === "link.hollow-abbey.047.m02-n06" && state === "crypt_discovered"));
}, "link.hollow-abbey.047.m02-n06 exact Main Litany traversal matrix drifted");

await assertRejectedSite("m02-inner-side-late-reseal", (fixture) => {
  const rules = fixture.stateMachines.find(({ id }) => id === "state.hollow-abbey.main-litany").rules;
  rules.find(({ targetId, state }) => targetId === "link.hollow-abbey.046.m01-m02" && state === "memory_return_released").linkTraversal = "closed";
}, "link.hollow-abbey.046.m01-m02 exact Main Litany traversal matrix drifted");

await assertRejectedSite("m02-south-side-late-reseal", (fixture) => {
  const rules = fixture.stateMachines.find(({ id }) => id === "state.hollow-abbey.main-litany").rules;
  rules.find(({ targetId, state }) => targetId === "link.hollow-abbey.047.m02-n06" && state === "memory_return_released").linkTraversal = "closed";
}, "link.hollow-abbey.047.m02-n06 exact Main Litany traversal matrix drifted");

await assertRejectedSite("exact-word-gate-late-reseal", (fixture) => {
  const rules = fixture.stateMachines.find(({ id }) => id === "state.hollow-abbey.main-litany").rules;
  rules.find(({ targetId, state }) => targetId === "link.hollow-abbey.009.g01-c01" && state === "memory_return_released").linkTraversal = "closed";
}, "link.hollow-abbey.009.g01-c01 exact Main Litany traversal matrix drifted");

await assertRejectedSite("p06-relation-asserted", (fixture) => {
  fixture.stateMachines.find(({ id }) => id === "state.hollow-abbey.outbound-relation").initialState = "blockout_test_gate_related";
}, "P06/G01 relation must remain an explicit unresolved open question");

await assertRejectedSite("collapsed-silence-room", (fixture) => {
  fixture.spaces.find(({ code }) => code === "F03g").kind = fixture.spaces.find(({ code }) => code === "F03a").kind;
}, "Seven silence rooms must remain geometrically and functionally distinct");

await assertRejectedSite("funeral-crosses-molten-floor", (fixture) => {
  fixture.routePrograms.find(({ id }) => id === "route-program.hollow-abbey.foundry-funeral").nodeIds[1] = "node.hollow-abbey.f02";
}, "Foundry funeral route must remain F06-F07-P06-outbound");

await assertRejectedSite("blackwater-open", (fixture) => {
  fixture.hydrologySystems.find(({ id }) => id === "hydrology.hollow-abbey.foundry-blackwater").scope = "local_open_surface";
}, "Foundry blackwater must remain a closed F02/F04/F06 loop");

await assertRejectedSite("abbey-sink-localized", (fixture) => {
  fixture.hydrologySystems.find(({ id }) => id === "hydrology.hollow-abbey.abbey-sink").spaceIds.push("space.hollow-abbey.p01");
}, "off-precinct exclusion must have no local geometry");

await assertRejectedSite("keth-on-site", (fixture) => {
  const keth = fixture.actorSlots.find(({ actorId }) => actorId === "wound_scribe_keth");
  keth.slotKind = "quest_bound";
  keth.homeSpaceId = "space.hollow-abbey.p07";
  keth.spawnAuthorized = true;
}, "Wound-Scribe Keth must remain off-site and non-spawnable");

await assertRejectedSite("foreword-population", (fixture) => {
  fixture.habitats.find(({ id }) => id === "habitat.hollow-abbey.foreword-cantor").population.maximum = 5;
}, "Foreword Cantor habitat must remain 1-4 and roof-rain-only");

await assertRejectedSite("cause-graph-hash", (fixture) => {
  fixture.overlayBindings.find(({ id }) => id === "overlay.hollow-abbey.foreword-cause-frames").sourceGraphRecordSha256 = "0".repeat(64);
}, "Cause-frame 19-node/53-edge hash binding drifted");

await assertRejectedSite("cause-interface", (fixture) => {
  const overlay = fixture.overlayBindings.find(({ id }) => id === "overlay.hollow-abbey.foreword-cause-frames");
  overlay.interfaceBindings = overlay.interfaceBindings.filter(({ sourceAnchorId }) => !sourceAnchorId.endsWith(".refuge"));
}, "Cause-frame entry, egress, crypt, service, drain, or refuge interface drifted");

await assertRejectedSite("selected-source-hash", (fixture) => {
  fixture.sourceBindings.find(({ id }) => id === "source.quest.main-litany").recordSha256 = "0".repeat(64);
}, "source.quest.main-litany selected-record hash drifted");

await assertRejectedSite("art-reference", (fixture) => {
  fixture.artDirection.acceptedReferenceIds.pop();
}, "Accepted Hollow Abbey art-reference set or order drifted");

await assertRejectedSite("duplicate-state-trigger", (fixture) => {
  const machine = fixture.stateMachines.find(({ id }) => id === "state.hollow-abbey.outbound-relation");
  machine.transitions[1].trigger = machine.transitions[0].trigger;
}, "transitions must be deterministic for each from-state and trigger");

await assertRejectedSite("missing-outbound-test-rule", (fixture) => {
  const machine = fixture.stateMachines.find(({ id }) => id === "state.hollow-abbey.outbound-relation");
  machine.rules = machine.rules.filter(({ state, targetId }) => !(state === "blockout_test_independent" && targetId === "link.hollow-abbey.007.p04-p06"));
}, "P06/G01 test states must remain explicit, reversible, and noncanonical");

await assertRejectedSite("missing-pre-cantor-shortcut-seal", (fixture) => {
  const machine = fixture.stateMachines.find(({ id }) => id === "state.hollow-abbey.main-litany");
  machine.rules = machine.rules.filter(({ state, targetId }) => !(state === "crypt_discovered" && targetId === "link.hollow-abbey.044.o01-m01"));
}, "link.hollow-abbey.044.o01-m01 must be explicitly closed in crypt_discovered");

await assertRejectedSite("detached-controlled-link", (fixture) => {
  fixture.links.find(({ id }) => id === "link.hollow-abbey.046.m01-m02").stateMachineId = null;
}, "affected links must exactly match links controlled by that state machine");

await assertRejectedSite("removed-symmetric-hydrology-prohibition", (fixture) => {
  const roof = fixture.hydrologySystems.find(({ id }) => id === "hydrology.hollow-abbey.roof-rain");
  const blackwater = fixture.hydrologySystems.find(({ id }) => id === "hydrology.hollow-abbey.foundry-blackwater");
  roof.prohibitedHydrologyIds = roof.prohibitedHydrologyIds.filter((id) => id !== blackwater.id);
  blackwater.prohibitedHydrologyIds = blackwater.prohibitedHydrologyIds.filter((id) => id !== roof.id);
}, "Exact Hollow Abbey hydrology separation contract drifted");

await assertRejectedSite("collapsed-external-overlay-route", (fixture) => {
  const route = fixture.routePrograms.find(({ id }) => id === "route-program.hollow-abbey.cause-frame-overlay");
  route.topologyMode = "ordered_local_trace";
  route.nodeIds = ["node.hollow-abbey.p07", "node.hollow-abbey.c01"];
  route.linkIds = ["link.hollow-abbey.016.c01-p07"];
}, "Cause-frame route must remain an isolated external-overlay proxy with no copied links");

await assertRejectedSite("missing-overlay-return-interface", (fixture) => {
  const overlay = fixture.overlayBindings.find(({ id }) => id === "overlay.hollow-abbey.foreword-cause-frames");
  overlay.interfaceBindings = overlay.interfaceBindings.filter(({ sourceAnchorId }) => !sourceAnchorId.endsWith(".return_a"));
}, "Complete cause-frame entry, egress, return, roof, crypt, service, drain, and refuge interface contract drifted");

await assertRejectedSite("source-path-relabel", (fixture) => {
  const target = fixture.sourceBindings.find(({ id }) => id === "source.atlas.hollow-abbey");
  const replacement = fixture.sourceBindings.find(({ id }) => id === "source.quest.main-litany");
  target.path = replacement.path;
  target.sha256 = replacement.sha256;
  target.bytes = replacement.bytes;
}, "source.atlas.hollow-abbey path, selector, binding kind, or authority drifted");

await assertRejectedSite("source-selector-relabel", (fixture) => {
  fixture.sourceBindings.find(({ id }) => id === "source.quest.main-litany").selector = "QUESTS[id=unrelated]";
}, "source.quest.main-litany path, selector, binding kind, or authority drifted");

await assertRejectedSite("missing-required-collection", (fixture) => {
  delete fixture.links;
}, "Schema validation failed: $.links is required");

await assertRejectedSite("wrong-collection-type", (fixture) => {
  fixture.links = {};
}, "Schema validation failed: $.links must have type array");

await assertRejectedSite("gate-datum-offset", (fixture) => {
  fixture.spatialReference.atlasAnchorToLocalOriginOffsetMeters = [0, 0, 0];
  fixture.spatialReference.localOriginAtlasCoordinate = [...fixture.spatialReference.atlasSiteAnchor];
}, "Gate-centered atlas-anchor offset drifted");

await assertRejectedSite("invented-habitat-creature", (fixture) => {
  fixture.habitats.find(({ id }) => id === "habitat.hollow-abbey.hush-order").creatureIds[0] = "invented_hush_creature";
}, "creature set drifted from canonical family hush_order");

await assertRejectedSite("wrong-source-habitat", (fixture) => {
  fixture.habitats.find(({ id }) => id === "habitat.hollow-abbey.echo-choir").sourceHabitatId = "habitat.invented";
}, "source habitat must remain the canonical karst crypt");

await assertRejectedSite("unknown-encounter-actor", (fixture) => {
  fixture.encounterSlots.find(({ id }) => id === "encounter-slot.hollow-abbey.hush-monks").actorOrCreatureId = "invented_hush_creature";
}, "actor, count, state, or overlay binding drifted");

await assertRejectedSite("hush-required-count", (fixture) => {
  fixture.encounterSlots.find(({ id }) => id === "encounter-slot.hollow-abbey.hush-monks").requiredCount = 4;
}, "actor, count, state, or overlay binding drifted");

await assertRejectedSite("false-concept-pair", (fixture) => {
  fixture.actorSlots.find(({ actorId }) => actorId === "ader_coil_deaf_bellwright").assetMaturity.status = "concept_pair_only";
}, "concept_pair_only status requires both concept master and transparent cutout paths");

await assertRejectedSite("profession-objective-target", (fixture) => {
  const objectives = fixture.questCrosswalk.find(({ questId }) => questId === "profession_bell_paid_in_silence").objectives;
  [objectives[0].target, objectives[1].target] = [objectives[1].target, objectives[0].target];
}, "profession_bell_paid_in_silence objective target order drifted in spatial crosswalk");

await assertRejectedSite("wave04-objective-target", (fixture) => {
  fixture.questCrosswalk.find(({ questId }) => questId === "regional_an_echo_arrived_first").objectives[0].target = "invented_result";
}, "regional_an_echo_arrived_first objective target order drifted in spatial crosswalk");

const specializedSchema = structuredClone(schema);
specializedSchema.properties.spaces.maxItems = 45;
const specializedSchemaResult = await validateWorldSpatialWave03b({ schemaOverride: specializedSchema });
assert.equal(specializedSchemaResult.valid, false);
assert.ok(specializedSchemaResult.errors.some((message) => message.includes("V2 schema spaces must remain reusable and variable-count")));
rejectedFixtures += 1;

const nestedSpecializedSchema = structuredClone(schema);
nestedSpecializedSchema.$defs.zone.properties.spaceIds.maxItems = 21;
const nestedSpecializedSchemaResult = await validateWorldSpatialWave03b({ schemaOverride: nestedSpecializedSchema });
assert.equal(nestedSpecializedSchemaResult.valid, false);
assert.ok(nestedSpecializedSchemaResult.errors.some((message) => message.includes("Generic V2 schema contains packet-specific maxItems")));
rejectedFixtures += 1;

const nestedMinimumSchema = structuredClone(schema);
nestedMinimumSchema.$defs.zone.properties.spaceIds.minItems = 10;
const nestedMinimumSchemaResult = await validateWorldSpatialWave03b({ schemaOverride: nestedMinimumSchema });
assert.equal(nestedMinimumSchemaResult.valid, false);
assert.ok(nestedMinimumSchemaResult.errors.some((message) => message.includes("Generic V2 schema semantic and nested cardinality contract drifted")));
rejectedFixtures += 1;

const invalidIndex = structuredClone(index);
invalidIndex.sites[0].counts.spaces = 44;
const invalidIndexResult = await validateWorldSpatialWave03b({ indexOverride: invalidIndex });
assert.equal(invalidIndexResult.valid, false);
assert.ok(invalidIndexResult.errors.some((message) => message.includes("Index counts differ from the exact packet contract")));
rejectedFixtures += 1;

const invalidProvenance = structuredClone(provenance);
invalidProvenance.records.find(({ role }) => role === "release_index").role = "renamed_release_index";
const invalidProvenanceResult = await validateWorldSpatialWave03b({ provenanceOverride: invalidProvenance });
assert.equal(invalidProvenanceResult.valid, false);
assert.ok(invalidProvenanceResult.errors.some((message) => message.includes("provenance evidence drifted")));
rejectedFixtures += 1;

const malformedProvenanceCollection = structuredClone(provenance);
malformedProvenanceCollection.records = {};
const malformedProvenanceCollectionResult = await validateWorldSpatialWave03b({ provenanceOverride: malformedProvenanceCollection });
assert.equal(malformedProvenanceCollectionResult.valid, false);
assert.ok(malformedProvenanceCollectionResult.errors.some((message) => message.includes("provenance has an invalid structural shape")));
rejectedFixtures += 1;

const malformedProvenanceRecord = structuredClone(provenance);
malformedProvenanceRecord.records[0] = null;
const malformedProvenanceRecordResult = await validateWorldSpatialWave03b({ provenanceOverride: malformedProvenanceRecord });
assert.equal(malformedProvenanceRecordResult.valid, false);
assert.ok(malformedProvenanceRecordResult.errors.some((message) => message.includes("provenance has an invalid structural shape")));
rejectedFixtures += 1;

const privateProvenance = structuredClone(provenance);
privateProvenance.direction.text = "C:\\Users\\example\\private";
privateProvenance.direction.sha256 = sha256(Buffer.from(privateProvenance.direction.text, "utf8"));
const privateProvenanceResult = await validateWorldSpatialWave03b({ provenanceOverride: privateProvenance });
assert.equal(privateProvenanceResult.valid, false);
assert.ok(privateProvenanceResult.errors.some((message) => message.includes("workstation-identifying text")));
rejectedFixtures += 1;

const providerProvenance = structuredClone(provenance);
providerProvenance.direction.text = "OpenAI execution abc123 remains private";
providerProvenance.direction.sha256 = sha256(Buffer.from(providerProvenance.direction.text, "utf8"));
const providerProvenanceResult = await validateWorldSpatialWave03b({ provenanceOverride: providerProvenance });
assert.equal(providerProvenanceResult.valid, false);
assert.ok(providerProvenanceResult.errors.some((message) => message.includes("workstation-identifying text")));
rejectedFixtures += 1;

const uncProvenance = structuredClone(provenance);
uncProvenance.direction.text = "\\\\example-server\\private-share\\example-user";
uncProvenance.direction.sha256 = sha256(Buffer.from(uncProvenance.direction.text, "utf8"));
const uncProvenanceResult = await validateWorldSpatialWave03b({ provenanceOverride: uncProvenance });
assert.equal(uncProvenanceResult.valid, false);
assert.ok(uncProvenanceResult.errors.some((message) => message.includes("workstation-identifying text")));
rejectedFixtures += 1;

const wslProvenance = structuredClone(provenance);
wslProvenance.direction.text = "/mnt/c/Users/example/private";
wslProvenance.direction.sha256 = sha256(Buffer.from(wslProvenance.direction.text, "utf8"));
const wslProvenanceResult = await validateWorldSpatialWave03b({ provenanceOverride: wslProvenance });
assert.equal(wslProvenanceResult.valid, false);
assert.ok(wslProvenanceResult.errors.some((message) => message.includes("workstation-identifying text")));
rejectedFixtures += 1;

const unacceptedReviewA = structuredClone(reviewA);
unacceptedReviewA.review.disposition = "revise";
const unacceptedReviewAResult = await validateWorldSpatialWave03b({ reviewAOverride: unacceptedReviewA });
assert.equal(unacceptedReviewAResult.valid, false);
assert.ok(unacceptedReviewAResult.errors.some((message) => message.includes("review A disposition or independence drifted")));
rejectedFixtures += 1;

const selfApprovedReviewB = structuredClone(reviewB);
selfApprovedReviewB.review.independent = false;
const selfApprovedReviewBResult = await validateWorldSpatialWave03b({ reviewBOverride: selfApprovedReviewB });
assert.equal(selfApprovedReviewBResult.valid, false);
assert.ok(selfApprovedReviewBResult.errors.some((message) => message.includes("review B disposition or independence drifted")));
rejectedFixtures += 1;

const unfrozenReviewB = structuredClone(reviewB);
unfrozenReviewB.subject.siteSha256 = "0".repeat(64);
const unfrozenReviewBResult = await validateWorldSpatialWave03b({ reviewBOverride: unfrozenReviewB });
assert.equal(unfrozenReviewBResult.valid, false);
assert.ok(unfrozenReviewBResult.errors.some((message) => message.includes("reviews do not bind the frozen")));
rejectedFixtures += 1;

const unboundReviewProvenance = structuredClone(provenance);
unboundReviewProvenance.reviewEvidence.reviewBManifestSha256 = "0".repeat(64);
const unboundReviewProvenanceResult = await validateWorldSpatialWave03b({ provenanceOverride: unboundReviewProvenance });
assert.equal(unboundReviewProvenanceResult.valid, false);
assert.ok(unboundReviewProvenanceResult.errors.some((message) => message.includes("review-evidence chain drifted")));
rejectedFixtures += 1;

console.log(JSON.stringify({
  valid: true,
  stats: validation.stats,
  evidence: validation.evidence,
  rejectedFixtures,
}, null, 2));
