import assert from "node:assert/strict";
import {
  DEFAULT_REPOSITORY_ROOT,
  SITE_BLOCKOUT_V2_SCHEMA_PATH,
  readJson,
} from "../tools/worldgen/validate-site-blockout-reference-v2.mjs";
import {
  WAVE_03C_EXPECTED_STATS,
  WAVE_03C_INDEX_PATH,
  WAVE_03C_PROVENANCE_PATH,
  WAVE_03C_REVIEW_A_PATH,
  WAVE_03C_REVIEW_B_PATH,
  WAVE_03C_REVIEWED_MATURITY,
  WAVE_03C_SITE_PATH,
  validateWorldSpatialWave03c,
} from "../tools/worldgen/validate-world-spatial-wave-03c.mjs";

const site = await readJson(DEFAULT_REPOSITORY_ROOT, WAVE_03C_SITE_PATH);
const schema = await readJson(DEFAULT_REPOSITORY_ROOT, SITE_BLOCKOUT_V2_SCHEMA_PATH);
const index = await readJson(DEFAULT_REPOSITORY_ROOT, WAVE_03C_INDEX_PATH);
const provenance = await readJson(DEFAULT_REPOSITORY_ROOT, WAVE_03C_PROVENANCE_PATH);
const reviewA = await readJson(DEFAULT_REPOSITORY_ROOT, WAVE_03C_REVIEW_A_PATH);
const reviewB = await readJson(DEFAULT_REPOSITORY_ROOT, WAVE_03C_REVIEW_B_PATH);
const baseline = await validateWorldSpatialWave03c();

assert.equal(baseline.valid, true, JSON.stringify(baseline.errors, null, 2));
assert.deepEqual(baseline.stats, WAVE_03C_EXPECTED_STATS);
assert.equal(baseline.reviewStatus, WAVE_03C_REVIEWED_MATURITY);
assert.equal(index.status, WAVE_03C_REVIEWED_MATURITY);
assert.equal(provenance.maturity, WAVE_03C_REVIEWED_MATURITY);
assert.equal(reviewA.review.disposition, "accept_noncanonical_reference");
assert.equal(reviewB.review.disposition, "accept_noncanonical_reference");
assert.equal(reviewA.review.independent, true);
assert.equal(reviewB.review.independent, true);
assert.notEqual(reviewA.review.role, reviewB.review.role);
assert.equal(provenance.reviewEvidence.reviewAManifestSha256, baseline.evidence.reviews.a.sha256);
assert.equal(provenance.reviewEvidence.reviewBManifestSha256, baseline.evidence.reviews.b.sha256);
assert.equal(
  baseline.evidence.immutableSceneSha256,
  "44b724a389efbf2203ede8f870583620e6977b0375e6807632486e277fd99ead",
);
assert.deepEqual(baseline.evidence.externalGraphCanonicalRecordSha256, {
  "environment_graph.v6.hearthmere_counterfactual_cistern": "f78be3a79b220d6cf0a9b97a08e246c7d596437c2b782393e885eb819cce3ee9",
  "environment_graph.v6.hearthmere_six_wing_aftercare": "b1207d4e04fcfd2c4b4c6e0141a865746051d249cbfe50b06ba4d9d8c7759ab0",
});

let rejectedFixtures = 0;

async function assertRejected(label, mutate, expectedFragment) {
  const fixture = structuredClone(site);
  mutate(fixture);
  const result = await validateWorldSpatialWave03c({ siteOverride: fixture });
  assert.equal(result.valid, false, `${label} fixture must be rejected`);
  const fragments = Array.isArray(expectedFragment) ? expectedFragment : [expectedFragment];
  assert.ok(
    result.errors.some((message) => fragments.some((fragment) => message.includes(fragment))),
    `${label}: missing one of ${JSON.stringify(fragments)}\n${JSON.stringify(result.errors, null, 2)}`,
  );
  rejectedFixtures += 1;
}

await assertRejected("schema-extra-property", (fixture) => {
  fixture.unexpectedTopLevelProperty = true;
}, "Schema validation failed");

await assertRejected("missing-required-links", (fixture) => {
  delete fixture.links;
}, "Schema validation failed");

await assertRejected("wrong-links-type", (fixture) => {
  fixture.links = {};
}, "Schema validation failed");

await assertRejected("missing-surface-link", (fixture) => {
  fixture.links.splice(0, 1);
}, "Wave 03C links contract drifted");

await assertRejected("reverse-duplicate-link", (fixture) => {
  fixture.links.at(-1).fromNodeId = fixture.links[0].toNodeId;
  fixture.links.at(-1).toNodeId = fixture.links[0].fromNodeId;
}, ["Base links contain a duplicate", "Wave 03C links contract drifted"]);

await assertRejected("one-way-link", (fixture) => {
  fixture.links[0].bidirectional = false;
}, "Wave 03C base links must remain 41 bidirectional links");

await assertRejected("proxy-made-traversable", (fixture) => {
  fixture.nodes.find(({ id }) => id === "node.hearthmere.overlay.counterfactual-cistern").traversable = true;
}, "Wave 03C nodes contract drifted");

await assertRejected("proxy-added-to-base-link", (fixture) => {
  fixture.links[0].fromNodeId = "node.hearthmere.overlay.counterfactual-cistern";
}, "illegally turns an overlay proxy into base traversal");

await assertRejected("scene-space-bound-offset", (fixture) => {
  fixture.spaces.find(({ code }) => code === "S00").boundsLocalMeters.minimum[0] = 1;
}, "Wave 03C spaces contract drifted");

await assertRejected("space-code-reorder", (fixture) => {
  [fixture.spaces[0].code, fixture.spaces[1].code] = [fixture.spaces[1].code, fixture.spaces[0].code];
}, "Exact Hearthmere space-code partition drifted");

await assertRejected("axis-adapter-relabel", (fixture) => {
  fixture.spatialReference.axes.y = "local north";
}, "East/south/up packet-to-scene axis adapter drifted");

await assertRejected("atlas-anchor-offset", (fixture) => {
  fixture.spatialReference.atlasSiteAnchor[0] += 32;
  fixture.spatialReference.localOriginAtlasCoordinate[0] += 32;
}, "Packet atlas anchor differs from canonical Hearthmere");

await assertRejected("core-envelope-expansion", (fixture) => {
  fixture.spatialReference.localBoundsMeters.maximum[0] = 256;
}, "Packet core-radius bounding box or vertical envelope drifted");

await assertRejected("zone-partition-duplication", (fixture) => {
  fixture.zones[1].spaceIds[0] = fixture.zones[0].spaceIds[0];
}, "Zones must not claim the same space twice");

await assertRejected("tenant-threshold-removal", (fixture) => {
  fixture.links.splice(fixture.links.findIndex(({ id }) => id === "link.hearthmere.tenant.05.kitchen-yard"), 1);
}, "Wave 03C links contract drifted");

await assertRejected("tenant-service-route-collapse", (fixture) => {
  const route = fixture.routePrograms.find(({ id }) => id === "route-program.hearthmere.tenant-service");
  route.nodeIds = route.nodeIds.filter((id) => id !== "node.hearthmere.tenant.yard");
  route.linkIds = [];
}, "Tenant rear service route drifted");

await assertRejected("hospice-width-reduced", (fixture) => {
  fixture.routePrograms.find(({ id }) => id === "route-program.hearthmere.hospice-staff").minimumClearWidthMeters = 1.2;
}, "Hospice staff/bed route minimum width drifted");

await assertRejected("hospice-appeal-removed", (fixture) => {
  const route = fixture.routePrograms.find(({ id }) => id === "route-program.hearthmere.hospice-appeal");
  route.nodeIds = route.nodeIds.filter((id) => id !== "node.hearthmere.hospice.appeal");
  route.linkIds = route.linkIds.slice(0, Math.max(0, route.nodeIds.length - 1));
}, "Hospice patient-controlled appeal route drifted");

await assertRejected("civic-service-lane-removed", (fixture) => {
  const route = fixture.routePrograms.find(({ id }) => id === "route-program.hearthmere.civic-service");
  route.nodeIds = route.nodeIds.filter((id) => id !== "node.hearthmere.civic.lane");
  route.linkIds = [];
}, "Civic seven-lamp service route drifted");

await assertRejected("vertical-bell-floor-retyped", (fixture) => {
  fixture.spaces.find(({ code }) => code === "C05").kind = "flat_storage";
}, "Wave 03C spaces contract drifted");

await assertRejected("route-order-drift", (fixture) => {
  [fixture.routePrograms[0], fixture.routePrograms[1]] = [fixture.routePrograms[1], fixture.routePrograms[0]];
}, "Exact 21-route program contract drifted");

await assertRejected("safe-cell-removal", (fixture) => {
  fixture.safeCells.pop();
}, "Exact six safe-cell references drifted");

await assertRejected("safe-cell-nonclaim-weakened", (fixture) => {
  fixture.safeCells[0].exclusionRule = "Safe.";
}, "Wave 03C safeCells contract drifted");

await assertRejected("phase-order-drift", (fixture) => {
  [fixture.activityPhases[0], fixture.activityPhases[1]] = [fixture.activityPhases[1], fixture.activityPhases[0]];
}, "Exact five-phase activity contract drifted");

await assertRejected("spring-bellwater-localized", (fixture) => {
  fixture.hydrologySystems[0].id = "hydrology.hearthmere.bellwater-stream";
}, "Regional Bellwater hydrology was improperly localized");

await assertRejected("spring-nonclaim-removed", (fixture) => {
  fixture.hydrologySystems.find(({ id }) => id === "hydrology.hearthmere.spring-channel").nonclaim = "Connection confirmed.";
}, "Hearth Spring/Bellwater nonconnection nonclaim drifted");

await assertRejected("clean-wash-prohibition-removed", (fixture) => {
  const clean = fixture.hydrologySystems.find(({ id }) => id === "hydrology.hearthmere.hospice-clean-header");
  clean.prohibitedHydrologyIds = clean.prohibitedHydrologyIds.filter((id) => id !== "hydrology.hearthmere.hospice-contaminated-wash");
}, ["prohibition against", "Hospice clean and contaminated hydrology separation drifted"]);

await assertRejected("clean-wash-space-overlap", (fixture) => {
  fixture.hydrologySystems.find(({ id }) => id === "hydrology.hearthmere.hospice-contaminated-wash").spaceIds.push("space.hearthmere.hospice.receiving");
}, "Hospice clean and contaminated hydrology share a local space");

await assertRejected("habitat-invented-form", (fixture) => {
  fixture.habitats.find(({ id }) => id === "habitat.hearthmere.ashbound").creatureIds[0] = "invented_ash_form";
}, "ashbound habitat does not project exactly its canonical Hearthmere-affine forms");

await assertRejected("habitat-form-omission", (fixture) => {
  fixture.habitats.find(({ id }) => id === "habitat.hearthmere.march-deserters").creatureIds.pop();
}, "march_deserters habitat does not project exactly its canonical Hearthmere-affine forms");

await assertRejected("habitat-safe-exclusion-removed", (fixture) => {
  fixture.habitats[0].safeCellExclusionIds.pop();
}, "must exclude all six safe cells");

await assertRejected("habitat-safe-space-overlap", (fixture) => {
  fixture.habitats[0].spaceIds.push("space.hearthmere.tenant.street");
}, "overlaps a proposed safe-cell space");

await assertRejected("forecast-population-expanded", (fixture) => {
  fixture.habitats.find(({ id }) => id === "habitat.hearthmere.sixth-shutter-forecast").population.maximum = 2;
}, "must remain a population-one external overlay");

await assertRejected("oculus-base-space-localized", (fixture) => {
  fixture.habitats.find(({ id }) => id === "habitat.hearthmere.contrition-oculus").spaceIds.push("space.hearthmere.hospice.ward");
}, "must remain a population-one external overlay");

await assertRejected("actor-order-drift", (fixture) => {
  [fixture.actorSlots[0], fixture.actorSlots[1]] = [fixture.actorSlots[1], fixture.actorSlots[0]];
}, "Exact 26-actor Hearthmere roster drifted");

await assertRejected("unauthorized-actor-spawn", (fixture) => {
  const actor = fixture.actorSlots.find(({ actorId }) => actorId === "avren_doss");
  actor.slotKind = "founding_schedule";
  actor.homeSpaceId = "space.hearthmere.surface.00";
  actor.spawnAuthorized = true;
}, "Only the three immutable-scene actors may have local spawn authority");

await assertRejected("ysra-home-region-rewrite", (fixture) => {
  fixture.actorSlots.find(({ actorId }) => actorId === "ysra_pell").spawnPolicy = "Hearthmere is the canonical home region.";
}, "Ysra scene presence improperly rewrites her canonical home region");

await assertRejected("static-model-claim", (fixture) => {
  fixture.actorSlots[0].assetMaturity.staticModelPath = "assets/models/maela.glb";
}, "Schema validation failed");

await assertRejected("animated-model-claim", (fixture) => {
  fixture.actorSlots[1].assetMaturity.animatedModelPath = "assets/models/torren.glb";
}, "Schema validation failed");

await assertRejected("encounter-count-drift", (fixture) => {
  fixture.encounterSlots.pop();
}, "Exact four-slot encounter contract drifted");

await assertRejected("encounter-safe-exclusion-removed", (fixture) => {
  fixture.encounterSlots[0].safeCellExclusionIds.pop();
}, "Every encounter must exclude all six safe cells");

await assertRejected("external-encounter-localized", (fixture) => {
  fixture.encounterSlots[2].spaceIds.push("space.hearthmere.surface.10");
}, "Wave 04 creature pressures must not be localized into base spaces");

await assertRejected("local-overlay-fabricated-graph", (fixture) => {
  const overlay = fixture.overlayBindings[0];
  overlay.sourceGraphId = "fabricated.graph";
  overlay.sourceGraphRecordSha256 = "0".repeat(64);
}, "local overlay must not claim an accepted source graph");

await assertRejected("local-overlay-fabricated-count", (fixture) => {
  fixture.overlayBindings[1].expectedCounts.nodes = 1;
}, "local overlay must not claim copied graph counts");

await assertRejected("external-graph-hash-drift", (fixture) => {
  fixture.overlayBindings[8].sourceGraphRecordSha256 = "0".repeat(64);
}, "graph canonical JSON hash drifted");

await assertRejected("external-graph-count-drift", (fixture) => {
  fixture.overlayBindings[8].expectedCounts.nodes = 15;
}, "graph count summary drifted");

await assertRejected("external-egress-interface-removed", (fixture) => {
  const overlay = fixture.overlayBindings[8];
  overlay.interfaceBindings = overlay.interfaceBindings.filter(({ sourceAnchorId }) => !sourceAnchorId.endsWith(".egress_s"));
}, "must preserve two distinct egress interfaces");

await assertRejected("external-egress-interfaces-collapsed", (fixture) => {
  const overlay = fixture.overlayBindings[9];
  const egresses = overlay.interfaceBindings.filter(({ sourceAnchorId }) => /egress/i.test(sourceAnchorId));
  egresses[1].localNodeId = egresses[0].localNodeId;
}, "must preserve two distinct egress interfaces");

await assertRejected("external-route-copies-link", (fixture) => {
  const route = fixture.routePrograms.at(-2);
  route.linkIds.push("link.hearthmere.surface.001.00-10");
}, "external overlay route must not copy base or source links");

await assertRejected("quest-order-drift", (fixture) => {
  [fixture.questCrosswalk[0], fixture.questCrosswalk[1]] = [fixture.questCrosswalk[1], fixture.questCrosswalk[0]];
}, "Exact ten-quest crosswalk order drifted");

await assertRejected("quest-objective-target-drift", (fixture) => {
  fixture.questCrosswalk[0].objectives[0].target = "invented_target";
}, "objective target order drifted");

await assertRejected("quest-objective-order-drift", (fixture) => {
  [fixture.questCrosswalk[1].objectives[0], fixture.questCrosswalk[1].objectives[1]] = [fixture.questCrosswalk[1].objectives[1], fixture.questCrosswalk[1].objectives[0]];
}, ["objective indices must be contiguous", "objective target order drifted"]);

await assertRejected("quest-record-hash-drift", (fixture) => {
  fixture.questCrosswalk[2].questRecordSha256 = "0".repeat(64);
}, ["crosswalk hash differs from its source binding", "quest-record hash drifted"]);

await assertRejected("state-machine-premature-resolution", (fixture) => {
  fixture.stateMachines[1].initialState = fixture.stateMachines[1].states[1];
}, "state machine no longer projects its exact canonical state-write values");

await assertRejected("state-write-value-omission", (fixture) => {
  fixture.stateMachines[2].states.pop();
  fixture.stateMachines[2].transitions.pop();
  fixture.stateMachines[2].rules.pop();
}, "state machine no longer projects its exact canonical state-write values");

await assertRejected("state-transition-trigger-collision", (fixture) => {
  const machine = fixture.stateMachines[3];
  machine.transitions[1].trigger = machine.transitions[0].trigger;
}, "transitions must be deterministic");

await assertRejected("ember-ledger-initial-state-drift", (fixture) => {
  fixture.stateMachines[0].initialState = "ember-ledger-restored";
}, "Immutable scene Ember Ledger phase adapter drifted");

await assertRejected("art-reference-removed", (fixture) => {
  fixture.artDirection.acceptedReferenceIds[0] = "concept_invented";
}, "Hearthmere accepted art-reference binding drifted");

await assertRejected("art-reference-made-geometric", (fixture) => {
  fixture.artDirection.referenceBoundary = "Exact plan geometry.";
}, "Art reference must remain direction-only and non-geometric");

await assertRejected("review-count-self-lowered", (fixture) => {
  fixture.consumerHandoff.requiredIndependentReviews = 1;
}, "Wave 03C must require two future independent reviews");

await assertRejected("review-nonclaim-removed", (fixture) => {
  fixture.consumerHandoff.limitations = fixture.consumerHandoff.limitations.filter((line) => !line.includes("No independent review manifest"));
}, "Wave 03C must preserve the no-review-yet nonclaim");

await assertRejected("canonical-claim", (fixture) => {
  fixture.claims.canonical = true;
}, "Schema validation failed");

await assertRejected("release-claim", (fixture) => {
  fixture.claims.releaseReady = true;
}, "Schema validation failed");

await assertRejected("private-url", (fixture) => {
  fixture.consumerHandoff.limitations.push("Recovered from https://drive.google.com/private");
}, "private provenance");

await assertRejected("absolute-workstation-path", (fixture) => {
  fixture.consumerHandoff.limitations.push("C:\\Users\\example\\private");
}, "private provenance");

await assertRejected("source-selector-relabel", (fixture) => {
  fixture.sourceBindings.find(({ id }) => id === "source.atlas.hearthmere").selector = "sites[id=site.other]";
}, "exact source paths, selectors, authorities, or selected-record hashes drifted");

await assertRejected("scene-authority-promotion", (fixture) => {
  fixture.sourceBindings.find(({ id }) => id === "source.scene.hearthmere").authority = "canon";
}, "exact source paths, selectors, authorities, or selected-record hashes drifted");

await assertRejected("source-record-hash-relabel", (fixture) => {
  fixture.sourceBindings.find(({ id }) => id === "source.quest.main-noon").recordSha256 = "0".repeat(64);
}, ["selected-record hash drifted", "crosswalk hash differs from its source binding"]);

await assertRejected("source-artifact-hash-drift", (fixture) => {
  fixture.sourceBindings.find(({ id }) => id === "source.scene.hearthmere").sha256 = "0".repeat(64);
}, "source artifact hash drifted");

await assertRejected("source-path-relabel", (fixture) => {
  const target = fixture.sourceBindings.find(({ id }) => id === "source.atlas.hearthmere");
  const replacement = fixture.sourceBindings.find(({ id }) => id === "source.scene.hearthmere");
  target.path = replacement.path;
  target.sha256 = replacement.sha256;
  target.bytes = replacement.bytes;
}, "exact source paths, selectors, authorities, or selected-record hashes drifted");

const specializedSchema = structuredClone(schema);
specializedSchema.properties.spaces.maxItems = 32;
const specializedSchemaResult = await validateWorldSpatialWave03c({ schemaOverride: specializedSchema });
assert.equal(specializedSchemaResult.valid, false);
assert.ok(specializedSchemaResult.errors.some((message) => message.includes("V2 schema spaces must remain reusable and variable-count")));
rejectedFixtures += 1;

const nestedSpecializedSchema = structuredClone(schema);
nestedSpecializedSchema.$defs.zone.properties.spaceIds.maxItems = 9;
const nestedSpecializedSchemaResult = await validateWorldSpatialWave03c({ schemaOverride: nestedSpecializedSchema });
assert.equal(nestedSpecializedSchemaResult.valid, false);
assert.ok(nestedSpecializedSchemaResult.errors.some((message) => message.includes("Generic V2 schema contains packet-specific maxItems")));
rejectedFixtures += 1;

const nestedMinimumSchema = structuredClone(schema);
nestedMinimumSchema.$defs.zone.properties.spaceIds.minItems = 2;
const nestedMinimumSchemaResult = await validateWorldSpatialWave03c({ schemaOverride: nestedMinimumSchema });
assert.equal(nestedMinimumSchemaResult.valid, false);
assert.ok(nestedMinimumSchemaResult.errors.some((message) => message.includes("Generic V2 schema semantic and nested cardinality contract drifted")));
rejectedFixtures += 1;

const spatialRejectedFixtures = rejectedFixtures;
assert.equal(spatialRejectedFixtures, 73, "Frozen site/schema adversarial fixture count drifted");

const invalidIndex = structuredClone(index);
invalidIndex.status = "author_draft";
const invalidIndexResult = await validateWorldSpatialWave03c({ indexOverride: invalidIndex });
assert.equal(invalidIndexResult.valid, false);
assert.ok(invalidIndexResult.errors.some((message) => message.includes("review maturity drifted")));
rejectedFixtures += 1;

const overclaimingIndex = structuredClone(index);
overclaimingIndex.claims.runtimeIntegrated = true;
const overclaimingIndexResult = await validateWorldSpatialWave03c({ indexOverride: overclaimingIndex });
assert.equal(overclaimingIndexResult.valid, false);
assert.ok(overclaimingIndexResult.errors.some((message) => message.includes("readiness overclaim")));
rejectedFixtures += 1;

const malformedIndex = structuredClone(index);
malformedIndex.sites = {};
const malformedIndexResult = await validateWorldSpatialWave03c({ indexOverride: malformedIndex });
assert.equal(malformedIndexResult.valid, false);
assert.ok(malformedIndexResult.errors.some((message) => message.includes("index has an invalid structural shape")));
rejectedFixtures += 1;

const canonicalEvidenceDrift = structuredClone(index);
canonicalEvidenceDrift.sites[0].canonicalRecordSha256 = "0".repeat(64);
const canonicalEvidenceDriftResult = await validateWorldSpatialWave03c({ indexOverride: canonicalEvidenceDrift });
assert.equal(canonicalEvidenceDriftResult.valid, false);
assert.ok(canonicalEvidenceDriftResult.errors.some((message) => message.includes("canonical-record evidence drifted")));
rejectedFixtures += 1;

const invalidProvenance = structuredClone(provenance);
invalidProvenance.records.find(({ role }) => role === "release_index").role = "renamed_release_index";
const invalidProvenanceResult = await validateWorldSpatialWave03c({ provenanceOverride: invalidProvenance });
assert.equal(invalidProvenanceResult.valid, false);
assert.ok(invalidProvenanceResult.errors.some((message) => message.includes("provenance evidence drifted")));
rejectedFixtures += 1;

const malformedProvenance = structuredClone(provenance);
malformedProvenance.records = {};
const malformedProvenanceResult = await validateWorldSpatialWave03c({ provenanceOverride: malformedProvenance });
assert.equal(malformedProvenanceResult.valid, false);
assert.ok(malformedProvenanceResult.errors.some((message) => message.includes("provenance has an invalid structural shape")));
rejectedFixtures += 1;

const privateProvenance = structuredClone(provenance);
privateProvenance.direction.text += " https://drive.google.com/private";
const privateProvenanceResult = await validateWorldSpatialWave03c({ provenanceOverride: privateProvenance });
assert.equal(privateProvenanceResult.valid, false);
assert.ok(privateProvenanceResult.errors.some((message) => message.includes("publication contains private provenance")));
rejectedFixtures += 1;

const unacceptedReviewA = structuredClone(reviewA);
unacceptedReviewA.review.disposition = "revise";
const unacceptedReviewAResult = await validateWorldSpatialWave03c({ reviewAOverride: unacceptedReviewA });
assert.equal(unacceptedReviewAResult.valid, false);
assert.ok(unacceptedReviewAResult.errors.some((message) => message.includes("review A disposition or independence drifted")));
rejectedFixtures += 1;

const selfApprovedReviewB = structuredClone(reviewB);
selfApprovedReviewB.review.independent = false;
const selfApprovedReviewBResult = await validateWorldSpatialWave03c({ reviewBOverride: selfApprovedReviewB });
assert.equal(selfApprovedReviewBResult.valid, false);
assert.ok(selfApprovedReviewBResult.errors.some((message) => message.includes("review B disposition or independence drifted")));
rejectedFixtures += 1;

const roleDriftReviewB = structuredClone(reviewB);
roleDriftReviewB.review.role = reviewA.review.role;
const roleDriftReviewBResult = await validateWorldSpatialWave03c({ reviewBOverride: roleDriftReviewB });
assert.equal(roleDriftReviewBResult.valid, false);
assert.ok(roleDriftReviewBResult.errors.some((message) => message.includes("independent review roles drifted")));
rejectedFixtures += 1;

const unfrozenReviewB = structuredClone(reviewB);
unfrozenReviewB.subject.testSha256 = "0".repeat(64);
const unfrozenReviewBResult = await validateWorldSpatialWave03c({ reviewBOverride: unfrozenReviewB });
assert.equal(unfrozenReviewBResult.valid, false);
assert.ok(unfrozenReviewBResult.errors.some((message) => message.includes("reviews do not bind the frozen")));
rejectedFixtures += 1;

const unboundReviewProvenance = structuredClone(provenance);
unboundReviewProvenance.reviewEvidence.reviewBManifestSha256 = "0".repeat(64);
const unboundReviewProvenanceResult = await validateWorldSpatialWave03c({ provenanceOverride: unboundReviewProvenance });
assert.equal(unboundReviewProvenanceResult.valid, false);
assert.ok(unboundReviewProvenanceResult.errors.some((message) => message.includes("review-evidence chain drifted")));
rejectedFixtures += 1;

const unknownClaimIndex = structuredClone(index);
unknownClaimIndex.claims.runtimeReady = true;
const unknownClaimIndexResult = await validateWorldSpatialWave03c({ indexOverride: unknownClaimIndex });
assert.equal(unknownClaimIndexResult.valid, false);
assert.ok(unknownClaimIndexResult.errors.some((message) => message.includes("index has an invalid structural shape")));
rejectedFixtures += 1;

const unknownTopLevelIndex = structuredClone(index);
unknownTopLevelIndex.productionReady = true;
const unknownTopLevelIndexResult = await validateWorldSpatialWave03c({ indexOverride: unknownTopLevelIndex });
assert.equal(unknownTopLevelIndexResult.valid, false);
assert.ok(unknownTopLevelIndexResult.errors.some((message) => message.includes("index has an invalid structural shape")));
rejectedFixtures += 1;

const sensitiveKeyProvenance = structuredClone(provenance);
sensitiveKeyProvenance.reviewEvidence.username = "private-operator";
const sensitiveKeyProvenanceResult = await validateWorldSpatialWave03c({ provenanceOverride: sensitiveKeyProvenance });
assert.equal(sensitiveKeyProvenanceResult.valid, false);
assert.ok(sensitiveKeyProvenanceResult.errors.some((message) => message.includes("provenance has an invalid structural shape")));
rejectedFixtures += 1;

const emptyDirectionProvenance = structuredClone(provenance);
emptyDirectionProvenance.direction.text = "";
emptyDirectionProvenance.direction.sha256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
const emptyDirectionProvenanceResult = await validateWorldSpatialWave03c({ provenanceOverride: emptyDirectionProvenance });
assert.equal(emptyDirectionProvenanceResult.valid, false);
assert.ok(emptyDirectionProvenanceResult.errors.some((message) => message.includes("direction text or hash drifted")));
rejectedFixtures += 1;

const emptyReviewEvidence = structuredClone(reviewA);
emptyReviewEvidence.review.verified = emptyReviewEvidence.review.verified.map(() => "");
const emptyReviewEvidenceResult = await validateWorldSpatialWave03c({ reviewAOverride: emptyReviewEvidence });
assert.equal(emptyReviewEvidenceResult.valid, false);
assert.ok(emptyReviewEvidenceResult.errors.some((message) => message.includes("scope or limitation evidence drifted")));
rejectedFixtures += 1;

const extraReviewKey = structuredClone(reviewB);
extraReviewKey.review.providerId = "private-provider";
const extraReviewKeyResult = await validateWorldSpatialWave03c({ reviewBOverride: extraReviewKey });
assert.equal(extraReviewKeyResult.valid, false);
assert.ok(extraReviewKeyResult.errors.some((message) => message.includes("review B manifest has an invalid structural shape")));
rejectedFixtures += 1;

const privateIndexTitle = structuredClone(index);
privateIndexTitle.title = "OpenAI private operator 550e8400-e29b-41d4-a716-446655440000 /root/private";
const privateIndexTitleResult = await validateWorldSpatialWave03c({ indexOverride: privateIndexTitle });
assert.equal(privateIndexTitleResult.valid, false);
assert.ok(privateIndexTitleResult.errors.some((message) => message.includes("index title drifted")));
rejectedFixtures += 1;

const providerProvenance = structuredClone(provenance);
providerProvenance.direction.text = "OpenAI private provider run";
const providerProvenanceResult = await validateWorldSpatialWave03c({ provenanceOverride: providerProvenance });
assert.equal(providerProvenanceResult.valid, false);
assert.ok(providerProvenanceResult.errors.some((message) => message.includes("external provider identity")));
rejectedFixtures += 1;

assert.equal(rejectedFixtures, 93, "Total Wave 03C adversarial fixture count drifted");

console.log(JSON.stringify({
  valid: true,
  stats: baseline.stats,
  evidence: baseline.evidence,
  reviewStatus: baseline.reviewStatus,
  spatialRejectedFixtures,
  rejectedFixtures,
}, null, 2));
