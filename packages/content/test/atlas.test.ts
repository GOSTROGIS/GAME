import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import {
  SABLE_REACH_ATLAS,
  SABLE_REACH_MACRO_CELLS,
  atlasMacroCellIdAt,
  atlasToHearthmereLocal,
  findAtlasRoute,
  hearthmereLocalToAtlas,
  pointInTerritory,
  resolveSpatialContext,
  validateSableReachAtlas,
} from "../src/atlas.js";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

test("atlas satisfies its public GIS invariants", () => {
  const result = validateSableReachAtlas();
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(SABLE_REACH_ATLAS.classification, "fictional_modeled_not_measured");
  assert.equal(SABLE_REACH_ATLAS.maturity.seamlessTraversal, false);
  assert.equal(SABLE_REACH_ATLAS.maturity.productionTerrainAssets, false);
});

test("six exclusive territories cover the metric extent without sampled gaps or overlaps", () => {
  for (let northing = 32; northing < 12_288; northing += 64) {
    for (let easting = 32; easting < 16_384; easting += 64) {
      const owners = SABLE_REACH_ATLAS.territories.filter((territory) => pointInTerritory([easting, northing], territory, false));
      assert.equal(owners.length, 1, `${easting},${northing} has ${owners.length} owners`);
    }
  }
  for (const site of SABLE_REACH_ATLAS.sites) {
    const owner = SABLE_REACH_ATLAS.territories.find(({ id }) => id === site.territoryId);
    assert.ok(owner);
    assert.equal(pointInTerritory([site.coordinate[0], site.coordinate[1]], owner, false), true, site.id);
  }
});

test("all 768 compact cell manifests decode and retain individual hashes", () => {
  assert.equal(SABLE_REACH_MACRO_CELLS.length, 768);
  assert.equal(new Set(SABLE_REACH_MACRO_CELLS.map(({ id }) => id)).size, 768);
  for (const [index, encoded] of SABLE_REACH_ATLAS.macroCells.records.entries()) {
    const [body, digest] = [encoded.slice(0, encoded.lastIndexOf("|")), encoded.slice(encoded.lastIndexOf("|") + 1)];
    assert.equal(sha256(body), digest, `cell record ${index}`);
  }
  assert.equal(atlasMacroCellIdAt([6400, 8320]), "atlas.cell.r16.c12");
});

test("terrain, hydrology, habitat, and topology evidence is present", () => {
  assert.equal(SABLE_REACH_ATLAS.terrainLayers.length, 13);
  assert.deepEqual(new Set(SABLE_REACH_ATLAS.terrainLayers.map(({ id }) => id)), new Set([
    "dtm_raw", "dtm_conditioned", "slope_degrees", "aspect_degrees", "curvature_laplacian", "tpi_3x3", "ruggedness_tri",
    "d8_flow_direction", "d8_flow_accumulation", "d8_watershed", "stream_mask", "mfd_wetness", "hillshade_multidirectional",
  ]));
  for (const stream of SABLE_REACH_ATLAS.hydrology.streams) {
    for (let index = 1; index < stream.modeledBedElevationsMeters.length; index += 1) {
      assert.ok(stream.modeledBedElevationsMeters[index]! < stream.modeledBedElevationsMeters[index - 1]!, stream.id);
    }
  }
  const audit = SABLE_REACH_ATLAS.hydrology.conditioningAudit;
  assert.equal(audit.method, "whitebox_least_cost_breach_wang_liu_fill_with_preserved_depressions_v3");
  assert.ok(audit.meanAbsoluteDeltaMeters <= audit.gates.maximumMeanAbsoluteDeltaMeters);
  assert.ok(audit.p95AbsoluteDeltaMeters <= audit.gates.maximumP95AbsoluteDeltaMeters);
  assert.ok(audit.p99AbsoluteDeltaMeters <= audit.gates.maximumP99AbsoluteDeltaMeters);
  assert.ok(audit.maximumAbsoluteDeltaMeters <= audit.gates.maximumAbsoluteDeltaMeters);
  assert.ok(audit.modifiedCellFraction <= audit.gates.maximumModifiedCellFraction);
  assert.ok(audit.rawConditionedCorrelation >= audit.gates.minimumRawConditionedCorrelation);
  assert.ok(audit.receiverRawDownhillFraction >= audit.gates.minimumReceiverRawDownhillFraction);
  assert.ok(audit.actualTerminalCellCount >= audit.declaredOutletCount);
  assert.equal(SABLE_REACH_ATLAS.hydrology.terminalCellIndices.length, audit.actualTerminalCellCount);
  assert.equal(SABLE_REACH_ATLAS.hydrology.terminalCellIndices.reduce((sum, terminal) => sum + terminal.terrainDerivedCatchmentCellCount, 0), 2048 * 1536);
  const terminalById = new Map(SABLE_REACH_ATLAS.hydrology.terminals.map((terminal) => [terminal.id, terminal]));
  for (const terminalCell of SABLE_REACH_ATLAS.hydrology.terminalCellIndices) {
    const terminal = terminalById.get(terminalCell.terminalId);
    assert.ok(terminal, terminalCell.terminalId);
    assert.deepEqual(terminalCell.coordinate, [(terminalCell.column + 0.5) * 8, 12_288 - (terminalCell.row + 0.5) * 8]);
    if (terminal.kind === "coast") {
      assert.equal(terminal.boundarySide, "west");
      assert.equal(terminalCell.column, 0);
    } else if (terminal.kind === "boundary") {
      assert.ok(terminal.boundarySide);
      assert.equal({ north: terminalCell.row === 0, south: terminalCell.row === 1535, west: terminalCell.column === 0, east: terminalCell.column === 2047 }[terminal.boundarySide!], true);
    }
  }
  assert.ok(Object.values(SABLE_REACH_ATLAS.habitatAvailability).every(({ viableCellCount }) => viableCellCount > 0));
  assert.equal(SABLE_REACH_ATLAS.proofLocations.length, 7);
  assert.ok(SABLE_REACH_ATLAS.proofLocations.every(({ status }) => status === "prototype_playable"));
  assert.equal(SABLE_REACH_ATLAS.maturity.otherProofLocations, "prototype_playable");
  assert.equal(SABLE_REACH_ATLAS.familyShowcases.length, 21);
  assert.deepEqual(new Set(SABLE_REACH_ATLAS.macroCells.alignedDerivatives.map(({ id }) => id)), new Set(["land_cover", "traversal_cost", "corruption", "habitat_suitability"]));
  assert.ok(SABLE_REACH_ATLAS.macroCells.alignedDerivatives.every(({ sha256 }) => /^[a-f0-9]{64}$/.test(sha256)));
  assert.deepEqual(SABLE_REACH_ATLAS.macroCells.habitatWeightEncoding, { kind: "sparse_binary_membership", listedHabitatWeight: 1, unlistedHabitatWeight: 0, emptyToken: "-", codebookField: "habitatCodebook" });
  for (const proof of SABLE_REACH_ATLAS.proofLocations) {
    const [column, row] = proof.macroCell;
    const cell = SABLE_REACH_MACRO_CELLS.find(({ id }) => id === `atlas.cell.r${row.toString().padStart(2, "0")}.c${column.toString().padStart(2, "0")}`);
    assert.ok(cell?.habitatIds.length, proof.id);
  }
});

test("Hearthmere site transform preserves the 96-meter local coordinate frame", () => {
  assert.deepEqual(atlasToHearthmereLocal([6400, 8320, 184]), [0, 0, 0]);
  assert.deepEqual(hearthmereLocalToAtlas([96, 6, 96]), [6496, 8224, 190]);
  const restored = atlasToHearthmereLocal(hearthmereLocalToAtlas([31.125, -2.5, 77.875]));
  assert.ok(restored.every((value, index) => Math.abs(value - [31.125, -2.5, 77.875][index]!) <= 0.001));
  const context = resolveSpatialContext([6400, 8320, 184]);
  assert.equal(context?.territory.id, "territory.graven-march");
  assert.equal(context?.address.siteId, "site.hearthmere");
});

test("walking route graph connects representative territories with explicit impedance", () => {
  const route = findAtlasRoute("site.gloamharbor", "site.ember-gate");
  assert.equal(route.valid, true);
  assert.ok(route.sectionIds.length >= 2);
  assert.ok(route.walkingSeconds > 0);
  assert.equal(SABLE_REACH_ATLAS.routeGraph.travelMode.hierarchy, false);
  assert.equal(SABLE_REACH_ATLAS.routeGraph.travelMode.impedance, "seconds");
  for (const section of SABLE_REACH_ATLAS.routes.flatMap(({ sections }) => sections)) {
    assert.equal(section.leastCostAudit.algorithm, "least_cost_raster_dijkstra_v1");
    assert.equal(section.leastCostAudit.analysisCellSizeMeters, 128);
    assert.ok(Object.keys(section.leastCostAudit.substratePenalties).length >= 6);
  }
  assert.ok(SABLE_REACH_ATLAS.bridges.length > 0);
});

test("canonical GIS exports are committed while remaining targets stay explicit", () => {
  assert.ok(SABLE_REACH_ATLAS.artifacts.some(({ format, status }) => format === "GeoPackage" && status === "committed"));
  assert.ok(SABLE_REACH_ATLAS.artifacts.some(({ format, status }) => format.includes("GeoTIFF") && status === "committed"));
  assert.ok(SABLE_REACH_ATLAS.artifacts.some(({ format, status }) => format === "TopoJSON" && status === "committed"));
  assert.ok(SABLE_REACH_ATLAS.artifacts.some(({ format, status }) => format === "WebP" && status === "committed"));
  assert.ok(SABLE_REACH_ATLAS.uncommittedAuthoringTargets.every(({ status }) => status === "generator_target_not_committed"));
});
