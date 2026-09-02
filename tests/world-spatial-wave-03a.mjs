import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  canonicalJson,
  validateJsonSchema,
  validateWorldSpatialWave03a,
} from "../tools/worldgen/validate-world-spatial-wave-03a.mjs";

const site = JSON.parse(readFileSync(new URL("../assets/world/spatial/wave-03a/warden-reed.site.json", import.meta.url), "utf8"));
const index = JSON.parse(readFileSync(new URL("../assets/world/spatial/wave-03a/index.json", import.meta.url), "utf8"));
const provenance = JSON.parse(readFileSync(new URL("../assets/world/spatial/wave-03a/provenance.json", import.meta.url), "utf8"));
const schema = JSON.parse(readFileSync(new URL("../assets/world/spatial/site-blockout-reference-v1.schema.json", import.meta.url), "utf8"));

const validation = await validateWorldSpatialWave03a();
assert.equal(validation.valid, true, JSON.stringify(validation.errors, null, 2));
assert.deepEqual(validation.stats, {
  sites: 1,
  structures: 2,
  rooms: 12,
  thresholds: 15,
  egressPaths: 2,
  utilities: 6,
  hazards: 5,
  habitats: 4,
  routes: 8,
  activityPhases: 4,
  questObjectives: 4,
  sourceBindings: 8,
  provenanceRecords: 3,
  canonicalClaims: 0,
  runtimeClaims: 0,
  constructionClaims: 0,
});

assert.equal(index.status, "independently_reviewed_noncanonical_reference");
assert.equal(provenance.maturity, "independently_reviewed_noncanonical_reference");
assert.deepEqual(
  Object.fromEntries(provenance.records.map(({ path, role, maturity }) => [path, { role, maturity }])),
  {
    "assets/world/spatial/site-blockout-reference-v1.schema.json": {
      role: "machine_contract",
      maturity: "reference_schema_v1",
    },
    "assets/world/spatial/wave-03a/index.json": {
      role: "release_index",
      maturity: "independently_reviewed_noncanonical_reference",
    },
    "assets/world/spatial/wave-03a/warden-reed.site.json": {
      role: "site_local_spatial_reference",
      maturity: "independently_reviewed_noncanonical_reference",
    },
  },
);

assert.equal(schema.additionalProperties, false);
assert.equal(schema.properties.claims.additionalProperties, false);
assert.equal(schema.properties.structures.minItems, 2);
assert.equal(schema.properties.structures.maxItems, 2);
assert.equal(schema.$defs.structure.properties.rooms.minItems, 6);
assert.equal(schema.$defs.structure.properties.rooms.maxItems, 6);
assert.equal(schema.$defs.egressPath.properties.minimumClearWidthMeters.const, 2.2);
assert.deepEqual(validateJsonSchema(schema, site), []);

const falseClaimKeys = [
  "canonical",
  "runtimeIntegrated",
  "constructionReady",
  "productionGeometry",
  "atlasExportEligible",
  "releaseReady",
  "authorSelfApproval",
  "integrationAuthorized",
];
for (const claims of [index.claims, site.claims]) {
  assert.ok(falseClaimKeys.every((key) => claims[key] === false));
}

assert.equal(site.structures.length, 2);
assert.deepEqual(site.structures.map(({ rooms }) => rooms.length), [6, 6]);
assert.equal(site.utilities.length, 6);
assert.equal(site.utilities.filter(({ sourceEndpointBinding }) => sourceEndpointBinding !== null).length, 5);
assert.equal(new Set(site.utilities.filter(({ sourceEndpointBinding }) => sourceEndpointBinding !== null).map(({ sourceEndpointBinding }) => sourceEndpointBinding.id)).size, 5);
assert.equal(site.hazards.length, 5);
assert.equal(site.anchorPlacements.length, 18);
assert.equal(new Set(site.anchorPlacements.map(({ anchorId }) => anchorId)).size, 18);
assert.equal(new Set(site.anchorPlacements.map(({ portId }) => portId)).size, 18);
const refugeRoomId = "room.warden-reed.exchange.raised-refuge";
assert.deepEqual(
  site.anchorPlacements.filter(({ macroRoomId }) => macroRoomId === refugeRoomId).map(({ anchorId }) => anchorId),
  ["anchor.warden_reed_four_bank_visibility.refuge"],
);
for (const anchorId of [
  "anchor.warden_reed_four_bank_visibility.egress_a",
  "anchor.warden_reed_four_bank_visibility.egress_b",
  "anchor.warden_reed_four_bank_visibility.egress_domain_a",
  "anchor.warden_reed_four_bank_visibility.egress_domain_b",
]) {
  assert.equal(site.anchorPlacements.find((placement) => placement.anchorId === anchorId).macroRoomId, null);
}
const sharedLedgerMacroPlacements = site.anchorPlacements.filter(({ anchorId }) => [
  "anchor.warden_reed_four_bank_visibility.frame_ab",
  "anchor.warden_reed_four_bank_visibility.ledger",
  "anchor.warden_reed_four_bank_visibility.frame_cd",
].includes(anchorId));
assert.equal(new Set(sharedLedgerMacroPlacements.map(({ macroRoomId }) => macroRoomId)).size, 1);
assert.equal(new Set(sharedLedgerMacroPlacements.map(({ portId }) => portId)).size, 3);

const sourceRouteSegments = site.routes.flatMap(({ sourceSegments }) => sourceSegments);
assert.equal(sourceRouteSegments.length, 46);
assert.equal(new Set(sourceRouteSegments.map(({ edgeId }) => edgeId)).size, 46);
const bankSpine = site.routes.find(({ id }) => id === "route.warden-reed.bank-spine");
assert.equal(bankSpine.sourceSegments.length, 12);
assert.equal(bankSpine.topology, "bank_a_and_bank_b_join_at_frame_ab_then_ledger_then_frame_cd_splits_to_bank_c_and_bank_d");
assert.deepEqual(site.routes.find(({ id }) => id === "route.warden-reed.edge-exchange").phaseAvailability, ["first_light", "day", "fog_fall", "night"]);
assert.ok(site.hazards.find(({ id }) => id === "hazard.warden-reed.peat-fire").avoidanceRouteIds.includes("route.warden-reed.refuge-clear-return"));

const exchangeThresholds = site.thresholds.filter(({ sourceBindingId }) => sourceBindingId === null);
assert.equal(exchangeThresholds.length, 10);
assert.ok(exchangeThresholds.every(({ sourceDirectedEdgeBindings }) => sourceDirectedEdgeBindings.length === 2));
assert.equal(new Set(exchangeThresholds.flatMap(({ sourceDirectedEdgeBindings }) => sourceDirectedEdgeBindings.map(({ edgeId }) => edgeId))).size, 20);
const houseThresholdSourceIds = site.thresholds.filter(({ sourceBindingId }) => sourceBindingId !== null).map(({ sourceBindingId }) => sourceBindingId);
assert.equal(new Set(houseThresholdSourceIds).size, 5);
assert.equal(site.egress.paths.length, 2);
assert.equal(new Set(site.egress.paths.map(({ id }) => id)).size, 2);
assert.equal(new Set(site.egress.paths.map(({ sourcePathId }) => sourcePathId)).size, 2);
assert.equal(new Set(site.egress.paths.map(({ routeId }) => routeId)).size, 2);
assert.notEqual(site.egress.paths[0].thresholdIds[0], site.egress.paths[1].thresholdIds[0]);
assert.notEqual(site.egress.paths[0].failureDomainId, site.egress.paths[1].failureDomainId);
assert.notEqual(site.egress.paths[0].destinationAnchorId, site.egress.paths[1].destinationAnchorId);
assert.deepEqual(
  site.egress.paths[0].anchorIds.filter((id) => site.egress.paths[1].anchorIds.includes(id)),
  [site.egress.originAnchorId],
);
assert.ok(site.egress.paths.every(({ minimumClearWidthMeters, stepFree }) => minimumClearWidthMeters === 2.2 && stepFree === true));
assert.ok(site.egress.paths.every(({ thresholdIds }) => thresholdIds.every((id) => site.thresholds.find((threshold) => threshold.id === id).clearWidthMeters === 2.2)));
assert.ok(site.egress.paths.every(({ routeId }) => site.routes.find((route) => route.id === routeId).widthMeters === 2.2));
const dryServiceSegment = site.routes.find(({ id }) => id === "route.warden-reed.egress-a-dry").sourceSegments
  .find(({ edgeId }) => edgeId === "edge.v6.warden_reed_four_bank_visibility.035.dry_egress");
assert.deepEqual(dryServiceSegment, {
  edgeId: "edge.v6.warden_reed_four_bank_visibility.035.dry_egress",
  fromPortId: "port.warden-reed.service",
  toPortId: "port.warden-reed.egress-a",
});

assert.equal(site.questCrosswalk.bindingMode, "id_and_canonical_json_hash_no_contract_copy");
assert.equal(site.questCrosswalk.questId, "regional_the_fog_came_to_collect_our_outlines");
assert.equal(site.questCrosswalk.locationId, "warden_reed_four_bank_visibility");
assert.equal(site.questCrosswalk.objectives.length, 4);
assert.equal(new Set(site.questCrosswalk.objectives.map(({ objectiveId }) => objectiveId)).size, 4);
assert.equal("premise" in site.questCrosswalk, false);
assert.ok(site.questCrosswalk.objectives.every((objective) => (
  "objectiveType" in objective === false
  && "completionEvidence" in objective === false
  && "routeSubsetEdgeIds" in objective === false
)));

assert.equal(canonicalJson({ b: 2, a: [3, { d: 4, c: 5 }] }), canonicalJson({ a: [3, { c: 5, d: 4 }], b: 2 }));
assert.equal(validation.evidence.questRecordSha256, site.questCrosswalk.questRecordSha256);
assert.equal(validation.evidence.environmentProgramSha256, site.questCrosswalk.environmentProgramSha256);

async function assertRejectedFixture(label, mutate, expectedFragments) {
  const fixture = structuredClone(site);
  mutate(fixture);
  const result = await validateWorldSpatialWave03a({ siteOverride: fixture });
  assert.equal(result.valid, false, `${label} fixture must be rejected`);
  for (const fragment of Array.isArray(expectedFragments) ? expectedFragments : [expectedFragments]) {
    assert.ok(result.errors.some((message) => message.includes(fragment)), `${label}: missing ${fragment}\n${JSON.stringify(result.errors, null, 2)}`);
  }
  return result;
}

await assertRejectedFixture("schema-extra-property", (fixture) => {
  fixture.unexpectedTopLevelProperty = true;
}, "Schema validation failed: $.unexpectedTopLevelProperty is not allowed");

await assertRejectedFixture("endpoint-swap", (fixture) => {
  const binding = fixture.thresholds.find(({ id }) => id === "threshold.warden-reed.exchange.bank-a-frame-ab").sourceDirectedEdgeBindings[0];
  [binding.sourceFromAnchorId, binding.sourceToAnchorId] = [binding.sourceToAnchorId, binding.sourceFromAnchorId];
}, "incorrect endpoint orientation");

await assertRejectedFixture("egress-threshold-width", (fixture) => {
  fixture.thresholds.find(({ id }) => id === "threshold.warden-reed.exchange.refuge-domain-a").clearWidthMeters = 1;
}, "clear width must equal exactly 2.2 meters");

await assertRejectedFixture("egress-route-width", (fixture) => {
  fixture.routes.find(({ id }) => id === "route.warden-reed.egress-a-dry").widthMeters = 1;
}, "local egress route width must equal exactly 2.2 meters");

await assertRejectedFixture("duplicate-objective", (fixture) => {
  fixture.questCrosswalk.objectives[3] = structuredClone(fixture.questCrosswalk.objectives[0]);
}, "Quest crosswalk must uniquely and exactly bind all four accepted objective endpoints");

await assertRejectedFixture("duplicate-house-binding", (fixture) => {
  const houseThresholds = fixture.thresholds.filter(({ sourceBindingId }) => sourceBindingId !== null);
  houseThresholds[1].sourceBindingId = houseThresholds[0].sourceBindingId;
}, "House thresholds must uniquely and exactly bind the five accepted typology thresholds");

await assertRejectedFixture("duplicate-utility-endpoint", (fixture) => {
  fixture.utilities[1].sourceEndpointBinding = structuredClone(fixture.utilities[0].sourceEndpointBinding);
}, "Utilities must uniquely and exactly bind all five accepted utility endpoints");

await assertRejectedFixture("duplicate-egress-path-id", (fixture) => {
  fixture.egress.paths[1].id = fixture.egress.paths[0].id;
}, "Egress path record IDs must be unique");

await assertRejectedFixture("duplicate-route-id", (fixture) => {
  fixture.routes[1].id = fixture.routes[0].id;
}, "Route IDs must be unique");

await assertRejectedFixture("phase-incompatible-maintenance-and-objective", (fixture) => {
  fixture.routes.find(({ id }) => id === "route.warden-reed.edge-exchange").phaseAvailability = ["fog_fall"];
}, [
  "objective.04 requires a local route unavailable in its accepted objective phase",
  "utility.warden-reed.ferry-power",
  "during first_light",
]);

await assertRejectedFixture("peat-fire-disconnected-bank-d", (fixture) => {
  const hazard = fixture.hazards.find(({ id }) => id === "hazard.warden-reed.peat-fire");
  hazard.avoidanceRouteIds = hazard.avoidanceRouteIds.filter((id) => id !== "route.warden-reed.refuge-clear-return");
}, "hazard.warden-reed.peat-fire affected room room.warden-reed.exchange.bank-d-dark-watch cannot reach an unaffected room, refuge, or egress");

const invalidProvenanceRole = structuredClone(provenance);
invalidProvenanceRole.records.find(({ path }) => path === "assets/world/spatial/wave-03a/index.json").role = "renamed_release_index";
const invalidProvenanceRoleResult = await validateWorldSpatialWave03a({ provenanceOverride: invalidProvenanceRole });
assert.equal(invalidProvenanceRoleResult.valid, false, "Renaming an expected provenance role must be rejected");
assert.ok(invalidProvenanceRoleResult.errors.some((message) => message.includes(
  "Provenance contract drifted for assets/world/spatial/wave-03a/index.json",
)));

for (const repositoryRelativePath of [
  ...site.sourceBindings.map(({ path }) => path),
  ...provenance.records.map(({ path }) => path),
  index.schemaPath,
  index.provenancePath,
]) {
  assert.equal(repositoryRelativePath.startsWith("/"), false);
  assert.equal(repositoryRelativePath.includes("\\"), false);
  assert.doesNotMatch(repositoryRelativePath, /^[A-Za-z]:/);
  assert.equal(repositoryRelativePath.split("/").includes(".."), false);
}

const publishedSurface = JSON.stringify({ index, site, provenance });
assert.doesNotMatch(publishedSurface, /https?:\/\//i);
assert.doesNotMatch(publishedSurface, /drive\.google|[?&](?:signature|token|expires)=|call[_-]?id["']?\s*:\s*["'][^"']+|session[_-]?id["']?\s*:\s*["'][^"']+/i);
assert.doesNotMatch(publishedSurface, /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/);
assert.doesNotMatch(publishedSurface, /[A-Za-z]:\\|\/Users\/|\/home\//);
assert.doesNotMatch(publishedSurface, /\b(?:anthropic|chatgpt|claude|openai)\b/i);
assert.equal(provenance.publication.externalProviderIdentifiers, false);
assert.equal(provenance.publication.workstationPaths, false);

assert.ok(site.artDirection.exteriorRead.length >= 5);
assert.ok(site.artDirection.interiorRead.length >= 5);
assert.ok(site.artDirection.forbidden.some((value) => value.includes("no plural Escrow bodies")));
assert.ok(site.artDirection.forbidden.some((value) => value.includes("no final structural")));

console.log(JSON.stringify({
  valid: true,
  stats: validation.stats,
  evidence: validation.evidence,
}, null, 2));
