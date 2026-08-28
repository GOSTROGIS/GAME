import assert from "node:assert/strict";
import test from "node:test";
import {
  buildReferenceAtlasViewModel,
  findDirectionalSite,
  type ReferenceAtlasData,
} from "../src/atlas/ReferenceAtlas.js";
import { adaptSableReachAtlasManifest, type SableReachAtlasRuntimeManifestLike } from "../src/atlas/AtlasManifestAdapter.js";
import {
  CREATURE_FAMILY_IDS,
  PROTOTYPE_CREATURE_RECIPES,
  createPrototypeCreatureRig,
  prototypeSilhouetteSignature,
} from "../src/world/PrototypeCreatureFactory.js";
import {
  buildEcologyProofRuntimePlan,
  validateEcologyProofEncounterManifest,
  type EcologyProofEncounterManifest,
} from "../src/showcase/EcologyProof.js";
import { SABLE_REACH_ATLAS } from "@hearthmere/content/atlas";
import { SABLE_REACH_ECOLOGY_PROOF_ENCOUNTERS } from "@hearthmere/content/showcases";

const atlasFixture: ReferenceAtlasData = {
  id: "sable_reach_test",
  title: "Sable Reach",
  coordinateSpaceId: "veyl_local_grid_v1",
  generationVersion: "test-seed-1",
  extent: { minEasting: 0, minNorthing: 0, maxEasting: 16384, maxNorthing: 12288 },
  disclosure: "Modelled terrain, derived water, and authored sites. This is reference geography, not seamless finished 3D terrain.",
  territories: [
    { id: "dunmire", name: "Dunmire", evidence: "authored", description: "Drowned lower catchment.", polygon: [{ easting: 0, northing: 0 }, { easting: 8192, northing: 0 }, { easting: 8192, northing: 12288 }, { easting: 0, northing: 12288 }] },
    { id: "cinderward", name: "Cinderward", evidence: "authored", description: "Eastern mineral ridge.", polygon: [{ easting: 8192, northing: 0 }, { easting: 16384, northing: 0 }, { easting: 16384, northing: 12288 }, { easting: 8192, northing: 12288 }] },
  ],
  terrainContours: [{ id: "contour_184", name: "184 metre contour", evidence: "derived", points: [{ easting: 0, northing: 8192 }, { easting: 16384, northing: 8192 }] }],
  waterways: [{ id: "water_dun", name: "Dun channel", evidence: "derived", points: [{ easting: 6400, northing: 10000 }, { easting: 5500, northing: 5000 }, { easting: 0, northing: 1200 }] }],
  routes: [{ id: "route_ember", name: "Ember road", evidence: "modelled", travelMinutes: 86, points: [{ easting: 6400, northing: 8320 }, { easting: 9000, northing: 7400 }, { easting: 13000, northing: 6500 }] }],
  sites: [
    { id: "hearthmere", name: "Hearthmere", kind: "settlement", coordinate: { easting: 6400, northing: 8320 }, territoryId: "dunmire", discovered: true, evidence: "surveyed", summary: "A geothermal terrace settlement.", travelMinutesFromHearthmere: 0 },
    { id: "kiln_gate", name: "Kiln Gate", kind: "ruin", coordinate: { easting: 13000, northing: 6500 }, territoryId: "cinderward", discovered: true, evidence: "authored", summary: "A sealed foundry approach.", travelMinutesFromHearthmere: 86 },
    { id: "north_watch", name: "North Watch", kind: "landmark", coordinate: { easting: 6400, northing: 11000 }, territoryId: "dunmire", discovered: true, evidence: "authored", summary: "A watch cairn above the terrace." },
  ],
};

function ecologyProofFixture(): EcologyProofEncounterManifest {
  return {
    schemaVersion: 1,
    id: "sable_reach_ecology_proofs_v1",
    coordinateSpaceId: "veyl_local_grid_v1",
    navigationCells: CREATURE_FAMILY_IDS.map((familyId, index) => ({
      schemaVersion: 1,
      id: `nav.${familyId}`,
      siteId: `site_${index}`,
      coordinateSpaceId: "site_local_meters_v1",
      origin: { easting: 256 + index * 512, northing: 512 + index * 128, elevation: 20 + index },
      bounds: { minX: -3, minZ: -2.5, maxX: 3, maxZ: 2.5 },
      walkablePolygons: [{ id: `nav.${familyId}.walkable`, vertices: [[-3, -2.5], [3, -2.5], [3, 2.5], [-3, 2.5]] }],
      colliders: [{ id: `nav.${familyId}.collider`, shape: "box", center: [0, 0.5], size: [0.8, 0.6] }],
      nodes: [
        { id: `nav.${familyId}.player`, x: 0, z: 1.8, kind: "spawn" },
        { id: `nav.${familyId}.west`, x: -1.5, z: 0.3, kind: "waypoint" },
        { id: `nav.${familyId}.east`, x: 1.5, z: 0.3, kind: "waypoint" },
        { id: `nav.${familyId}.enemy`, x: 0, z: -0.9, kind: "encounter" },
      ],
      links: [
        { id: `nav.${familyId}.pw`, from: `nav.${familyId}.player`, to: `nav.${familyId}.west`, bidirectional: true, cost: 2.1 },
        { id: `nav.${familyId}.pe`, from: `nav.${familyId}.player`, to: `nav.${familyId}.east`, bidirectional: true, cost: 2.1 },
        { id: `nav.${familyId}.we`, from: `nav.${familyId}.west`, to: `nav.${familyId}.enemy`, bidirectional: true, cost: 1.9 },
        { id: `nav.${familyId}.ee`, from: `nav.${familyId}.east`, to: `nav.${familyId}.enemy`, bidirectional: true, cost: 1.9 },
      ],
      spawnAnchors: { player: [0, 0, 1.8], enemy: [0, 0, -0.9] },
    })),
    encounters: CREATURE_FAMILY_IDS.map((familyId, index) => ({
      id: `proof.${familyId}`,
      familyId,
      creatureId: `showcase.${familyId}`,
      siteId: `site_${index}`,
      territoryId: index % 2 ? "cinderward" : "dunmire",
      spatialAddress: { coordinateSpaceId: "veyl_local_grid_v1", territoryId: index % 2 ? "cinderward" : "dunmire", siteId: `site_${index}`, macroCellId: `macro_${String(index).padStart(2, "0")}_00` },
      atlasCoordinate: { easting: 256 + index * 512, northing: 512 + index * 128, elevation: 20 + index },
      prototypeAssetId: `prototype_creature.${familyId}`,
      mechanicHandlerId: `mechanic.${familyId}`,
      telegraphs: [{ cueId: `cue.${familyId}`, visual: "The silhouette opens along its signature seam.", nonvisual: "Its family sound grammar gives one warning measure.", seconds: 0.7, counterplay: "Cross the declared safe lane during windup." }],
      dropTableIds: [`drops.${familyId}`],
      habitat: { habitatCellId: `habitat.${familyId}`, suitability: 0.75, reachable: true, navigationCellId: `nav.${familyId}`, routeNodeId: `route.${familyId}`, ruleIds: [`rule.${familyId}`] },
      maturity: { authored: true, validated: true, habitat_valid: true, encounter_placed: true, runtime_integrated: true, prototype_asset: true, production_asset: false, playtested: false },
    })),
  };
}

test("reference atlas projects the 16,384 by 12,288 metre grid and supports directional site navigation", () => {
  const model = buildReferenceAtlasViewModel(atlasFixture);
  assert.equal(model.extent.maxEasting, 16384);
  assert.equal(model.extent.maxNorthing, 12288);
  const hearthmere = model.sites.find(({ id }) => id === "hearthmere")!;
  assert.equal(hearthmere.screen.x, 400);
  assert.equal(hearthmere.screen.y, 248);
  assert.equal(findDirectionalSite(model.sites, "hearthmere", "ArrowRight")?.id, "kiln_gate");
  assert.equal(findDirectionalSite(model.sites, "hearthmere", "ArrowUp")?.id, "north_watch");
  assert.match(model.disclosure, /not seamless finished 3D terrain/i);
});

test("reference atlas rejects out-of-bounds features and unknown territory placement", () => {
  assert.throws(() => buildReferenceAtlasViewModel({ ...atlasFixture, sites: [{ ...atlasFixture.sites[0]!, coordinate: { easting: 17000, northing: 8320 } }] }), /outside the atlas extent/);
  assert.throws(() => buildReferenceAtlasViewModel({ ...atlasFixture, sites: [{ ...atlasFixture.sites[0]!, territoryId: "nowhere" }] }), /unknown territory/);
});

test("committed GIS runtime manifest adapts directly into the accessible atlas model", () => {
  const runtime = SABLE_REACH_ATLAS as SableReachAtlasRuntimeManifestLike;
  const adapted = adaptSableReachAtlasManifest(runtime);
  const model = buildReferenceAtlasViewModel(adapted);
  assert.equal(model.territories.length, 6);
  assert.equal(model.sites.length, 12);
  assert.equal(model.waterways.length, 4);
  assert.equal(model.routes.length, 10);
  assert.deepEqual([...new Set(runtime.familyShowcases.map(({ familyId }) => familyId))].sort(), [...CREATURE_FAMILY_IDS].sort());
  assert.equal(model.sites.find(({ id }) => id === "site.hearthmere")?.evidence, "authored");
  assert.match(model.disclosure, /fictional modelled geography/i);
  assert.match(model.disclosure, /seamless traversal: not complete/i);
  assert.match(model.disclosure, /production terrain: not complete/i);
});

test("all 21 creature families resolve to distinct prototype silhouette recipes", () => {
  assert.equal(CREATURE_FAMILY_IDS.length, 21);
  const signatures = CREATURE_FAMILY_IDS.map((familyId) => prototypeSilhouetteSignature(PROTOTYPE_CREATURE_RECIPES[familyId]));
  assert.equal(new Set(signatures).size, 21);
  for (const familyId of CREATURE_FAMILY_IDS) {
    const rig = createPrototypeCreatureRig(familyId, { seed: 17 });
    const debug = rig.debugPrototype();
    assert.equal(debug.familyId, familyId);
    assert.equal(debug.contentStatus, "prototype_asset");
    assert.ok(Number(debug.meshCount) >= 3);
    rig.update(1 / 60, 1);
    rig.setTelegraph(1);
    rig.dispose();
  }
});

test("ecology-proof runtime plan requires one playable prototype encounter per family", () => {
  const fixture = ecologyProofFixture();
  assert.deepEqual(validateEcologyProofEncounterManifest(fixture), { valid: true, errors: [] });
  const plan = buildEcologyProofRuntimePlan(fixture);
  assert.equal(plan.entries.length, 21);
  assert.equal(Object.keys(plan.byFamilyId).length, 21);
  const prototype = plan.byFamilyId.anchored_quarantine.createPrototype();
  assert.equal(prototype.recipe.familyId, "anchored_quarantine");
  prototype.dispose();

  const broken = structuredClone(fixture);
  broken.encounters[20]!.familyId = "ashbound";
  const validation = validateEcologyProofEncounterManifest(broken);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((message) => message.includes("duplicates ashbound")));
  assert.ok(validation.errors.some((message) => message.includes("missing ecology-proof encounter for anchored_quarantine")));

  const brokenNavigation = structuredClone(fixture);
  brokenNavigation.encounters[0]!.habitat.navigationCellId = "nav.missing";
  assert.ok(validateEcologyProofEncounterManifest(brokenNavigation).errors.some((message) => message.includes("must resolve canonical navigation")));
});

test("canonical content manifest consumes all 21 runtime prototype factories", () => {
  const validation = validateEcologyProofEncounterManifest(SABLE_REACH_ECOLOGY_PROOF_ENCOUNTERS);
  assert.deepEqual(validation, { valid: true, errors: [] });
  const plan = buildEcologyProofRuntimePlan(SABLE_REACH_ECOLOGY_PROOF_ENCOUNTERS);
  assert.equal(plan.entries.length, 21);
  for (const entry of plan.entries) {
    const prototype = entry.createPrototype({ seed: 23 });
    assert.equal(prototype.recipe.familyId, entry.familyId);
    prototype.setTelegraph(0.5);
    prototype.update(1 / 30, 1);
    prototype.dispose();
  }
});
