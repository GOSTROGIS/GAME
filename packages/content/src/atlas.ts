import atlasRuntimeJson from "../manifests/sable-reach.atlas-runtime.json" with { type: "json" };
import atlasSourceJson from "../manifests/sable-reach.atlas-source.json" with { type: "json" };

export type AtlasCoordinate = readonly [easting: number, northing: number, elevation: number];
export type AtlasPoint2 = readonly [easting: number, northing: number];
export type SiteLocalCoordinate = readonly [x: number, y: number, z: number];
export type CoordinateSpaceId = "veyl_local_grid_v1" | "hearthmere_local_meters";

export interface SpatialAddress {
  coordinateSpaceId: CoordinateSpaceId;
  territoryId: string;
  siteId: string | null;
  macroCellId: string | null;
}

export interface TerritoryDefinition {
  id: string;
  name: string;
  code: string;
  substrate: string;
  polygon: readonly AtlasPoint2[];
}

export interface SiteDefinition {
  id: string;
  name: string;
  kind: "settlement" | "ruin";
  territoryId: string;
  containedByTerritoryId: string;
  coordinate: AtlasCoordinate;
  placementStatus: "atlas_placed";
  productionStatus: "prototype_playable" | "world_data_only";
  waterSource?: string;
  access?: string;
  subsistence?: string;
  industry?: string;
  burialPractice?: string;
  governance?: string;
}

export interface TerrainLayerSummary {
  id: string;
  dataType: "float32" | "uint8" | "uint32";
  units: string;
  algorithm: string;
  statistics: { minimum: number; maximum: number; mean: number; standardDeviation: number };
  sha256: string;
}

export interface HydrologyTerminal {
  id: string;
  kind: "coast" | "boundary" | "closed_basin" | "pond";
  coordinate: AtlasPoint2;
  boundarySide?: "west" | "south" | "north" | "east";
  captureRadiusMeters?: number;
  preservationRadiusMeters?: number;
}

export interface TerrainConditioningAudit {
  method: "whitebox_least_cost_breach_wang_liu_fill_with_preserved_depressions_v3";
  meanAbsoluteDeltaMeters: number;
  p95AbsoluteDeltaMeters: number;
  p99AbsoluteDeltaMeters: number;
  maximumAbsoluteDeltaMeters: number;
  modifiedCellCount: number;
  modifiedCellFraction: number;
  rawConditionedCorrelation: number;
  receiverRawDownhillFraction: number;
  actualTerminalCellCount: number;
  declaredOutletCount: number;
  gates: {
    maximumMeanAbsoluteDeltaMeters: number;
    maximumP95AbsoluteDeltaMeters: number;
    maximumP99AbsoluteDeltaMeters: number;
    maximumAbsoluteDeltaMeters: number;
    maximumModifiedCellFraction: number;
    minimumRawConditionedCorrelation: number;
    minimumReceiverRawDownhillFraction: number;
  };
}

export interface AtlasStream {
  id: string;
  name: string;
  terminalId: string;
  coordinates: readonly AtlasPoint2[];
  modeledBedElevationsMeters: readonly number[];
  lengthMeters: number;
  profileStatus: "modeled_monotonic_not_surveyed";
  d8TraceCellCount: number;
  streamMaskIntersectionCells: number;
}

export interface AtlasRouteSection {
  id: string;
  fromSiteId: string;
  toSiteId: string;
  coordinates: readonly AtlasPoint2[];
  lengthMeters: number;
  walkingSeconds: number;
  leastCostAudit: {
    algorithm: "least_cost_raster_dijkstra_v1";
    analysisCellSizeMeters: 128;
    impedanceCost: number;
    visitedCellCount: number;
    slopeWeight: number;
    wetnessWeight: number;
    streamCrossingWeight: number;
    substratePenalties: Readonly<Record<string, number>>;
    streamCrossingCellCount: number;
  };
}

export interface AtlasRoute {
  id: string;
  name: string;
  class: "road" | "causeway" | "trail";
  surface: string;
  nodes: readonly string[];
  historicalReason: string;
  sections: readonly AtlasRouteSection[];
}

export interface HabitatDefinition {
  id: string;
  territoryIds: readonly string[];
  substrates: readonly string[];
  elevationMeters: readonly [number, number];
  slopeDegrees: readonly [number, number];
  moisture: readonly [number, number];
  corruption: readonly [number, number];
}

export interface AtlasSpatialContext {
  address: SpatialAddress;
  coordinate: AtlasCoordinate;
  territory: TerritoryDefinition;
  nearestSite: SiteDefinition | null;
  habitatIds: readonly string[];
}

export interface AtlasMacroCellRecord {
  id: string;
  territoryId: string;
  meanElevationMeters: number;
  meanSlopeDegrees: number;
  moisture: number;
  corruption: number;
  landCover: string;
  traversalCostMultiplier: number;
  habitatIds: readonly string[];
  sha256: string;
}

/** Canonical 512-metre runtime world-cell contract; unrelated to legacy map tiles. */
export type WorldCellManifest = AtlasMacroCellRecord;

export interface WorldAtlasManifest {
  schemaVersion: 1;
  id: string;
  name: string;
  classification: "fictional_modeled_not_measured";
  maturity: {
    atlas: "gis_valid";
    hearthmere: "prototype_playable";
    otherProofLocations: "prototype_playable";
    seamlessTraversal: false;
    productionTerrainAssets: false;
  };
  coordinateReferenceSystem: {
    id: "veyl_local_grid_v1";
    authorityCode: null;
    type: "engineering";
    axisOrder: readonly ["easting", "northing", "elevation"];
    horizontalUnits: "meters";
    verticalUnits: "meters";
    wkt: string;
    wktSha256: string;
  };
  extent: { minimumEasting: number; minimumNorthing: number; maximumEasting: number; maximumNorthing: number; widthMeters: number; heightMeters: number };
  terrainGrid: { columns: number; rows: number; cellSizeMeters: number; noData: number; sampleLocation: string; registration: string; rowDirection: string; surfaceDefinition: string; verticalDatum: string; verticalAccuracy: null; accuracyStatement: string };
  terrainLayers: readonly TerrainLayerSummary[];
  hydrology: { routing: Record<string, unknown>; conditioningAudit: TerrainConditioningAudit; terminals: readonly HydrologyTerminal[]; terminalCellIndices: readonly { terminalId: string; row: number; column: number; coordinate: AtlasPoint2; terrainDerivedCatchmentCellCount: number; rawTerminalElevationMeters: number; conditionedTerminalElevationMeters: number }[]; streams: readonly AtlasStream[]; preservedDepressionIds: readonly string[] };
  territories: readonly TerritoryDefinition[];
  sites: readonly SiteDefinition[];
  routes: readonly AtlasRoute[];
  bridges: readonly { id: string; coordinate: AtlasPoint2; routeSectionId: string; streamId: string; kind: "modeled_crossing"; status: "atlas_validated_not_production_asset" }[];
  routeGraph: { travelMode: Record<string, unknown>; nodes: readonly string[]; edges: readonly { id: string; from: string; to: string; bidirectional: boolean; costSeconds: number }[] };
  habitats: readonly HabitatDefinition[];
  habitatAvailability: Readonly<Record<string, { viableCellCount: number; representativeCellIds: readonly string[]; cellSetSha256: string }>>;
  macroCells: {
    columns: 32;
    rows: 24;
    cellSizeMeters: 512;
    count: 768;
    rowOrigin: "south";
    columnOrigin: "west";
    idPattern: string;
    legacyTileRelationship: "none";
    territoryCodeRowsSouthToNorth: readonly string[];
    recordEncoding: readonly string[];
    landCoverCodebook: Readonly<Record<string, string>>;
    habitatCodebook: Readonly<Record<string, string>>;
    records: readonly string[];
    recordsSha256: string;
    alignedDerivatives: readonly { id: "land_cover" | "traversal_cost" | "corruption" | "habitat_suitability"; dataType: string; units: string; sha256: string; statistics?: { minimum: number; maximum: number; mean: number }; classCount?: number; nonemptyCellCount?: number; weightSemantics?: { listedHabitatWeight: 1; unlistedHabitatWeight: 0 } }[];
    habitatWeightEncoding: { kind: "sparse_binary_membership"; listedHabitatWeight: 1; unlistedHabitatWeight: 0; emptyToken: "-"; codebookField: "habitatCodebook" };
  };
  hearthmereTransform: {
    siteId: "site.hearthmere";
    atlasOrigin: AtlasCoordinate;
    localBoundsMeters: { minimum: SiteLocalCoordinate; maximum: SiteLocalCoordinate };
    mapping: Record<string, string>;
    preservesExistingLocalCoordinates: true;
  };
  proofLocations: readonly { id: string; siteId: string; macroCell: readonly [number, number]; status: "prototype_playable" }[];
  familyShowcases: readonly { familyId: string; proofLocationId: string; encounterStatus: "prototype_contract_placed" }[];
  topologyRules: readonly { id: string; rule: string; toleranceMeters?: number }[];
  artifacts: readonly { path: string; role: string; format: string; status: "committed"; bytes: number; sha256: string; layers: readonly string[] }[];
  uncommittedAuthoringTargets: readonly { path: string; format: string; status: "generator_target_not_committed"; requires?: readonly string[] }[];
  provenance: { generatorId: string; seed: number; configPath: string; configSha256: string; sourceManifestSha256: string; wktPath: string; wktSha256: string; numpyVersion: string };
  contentSha256: string;
}

export interface AtlasValidationResult {
  valid: boolean;
  errors: readonly string[];
}

export interface AtlasRouteResult {
  valid: boolean;
  fromSiteId: string;
  toSiteId: string;
  sectionIds: readonly string[];
  walkingSeconds: number;
}

export const SABLE_REACH_ATLAS_SOURCE = atlasSourceJson;
export const SABLE_REACH_ATLAS = atlasRuntimeJson as unknown as WorldAtlasManifest;

const territoryByCode = new Map(SABLE_REACH_ATLAS.territories.map((territory) => [territory.code, territory]));
const habitatIdByCode = SABLE_REACH_ATLAS.macroCells.habitatCodebook;

function pointOnSegment(point: AtlasPoint2, start: AtlasPoint2, end: AtlasPoint2): boolean {
  const cross = (point[0] - start[0]) * (end[1] - start[1]) - (point[1] - start[1]) * (end[0] - start[0]);
  return Math.abs(cross) <= 1e-7
    && point[0] >= Math.min(start[0], end[0]) - 1e-7 && point[0] <= Math.max(start[0], end[0]) + 1e-7
    && point[1] >= Math.min(start[1], end[1]) - 1e-7 && point[1] <= Math.max(start[1], end[1]) + 1e-7;
}

export function pointInTerritory(point: AtlasPoint2, territory: TerritoryDefinition, includeBoundary = true): boolean {
  let inside = false;
  for (let currentIndex = 0, previousIndex = territory.polygon.length - 1; currentIndex < territory.polygon.length; previousIndex = currentIndex, currentIndex += 1) {
    const current = territory.polygon[currentIndex]!;
    const previous = territory.polygon[previousIndex]!;
    if (pointOnSegment(point, previous, current)) return includeBoundary;
    if ((current[1] > point[1]) !== (previous[1] > point[1])) {
      const intersection = (previous[0] - current[0]) * (point[1] - current[1]) / (previous[1] - current[1]) + current[0];
      if (point[0] < intersection) inside = !inside;
    }
  }
  return inside;
}

export function resolveTerritory(point: AtlasPoint2): TerritoryDefinition | null {
  return SABLE_REACH_ATLAS.territories.find((territory) => pointInTerritory(point, territory, false))
    ?? SABLE_REACH_ATLAS.territories.find((territory) => pointInTerritory(point, territory, true))
    ?? null;
}

export function parseAtlasMacroCellRecord(encoded: string): AtlasMacroCellRecord {
  const fields = encoded.split("|");
  if (fields.length !== 10) throw new Error(`Invalid AtlasMacroCell record: ${encoded.slice(0, 48)}`);
  const [id, territoryCode, elevation, slope, moisture, corruption, landCoverCode, traversalCost, habitatCodes, sha256] = fields as [string, string, string, string, string, string, string, string, string, string];
  const territory = territoryByCode.get(territoryCode);
  if (!territory) throw new Error(`Unknown territory code ${territoryCode} in ${id}`);
  const habitatIds = habitatCodes === "-" ? [] : [...habitatCodes].map((code) => {
    const habitatId = habitatIdByCode[code];
    if (!habitatId) throw new Error(`Unknown habitat code ${code} in ${id}`);
    return habitatId;
  });
  const landCover = SABLE_REACH_ATLAS.macroCells.landCoverCodebook[landCoverCode];
  if (!landCover) throw new Error(`Unknown land-cover code ${landCoverCode} in ${id}`);
  return Object.freeze({ id, territoryId: territory.id, meanElevationMeters: Number(elevation) / 10, meanSlopeDegrees: Number(slope) / 100, moisture: Number(moisture) / 1000, corruption: Number(corruption) / 1000, landCover, traversalCostMultiplier: Number(traversalCost) / 1000, habitatIds: Object.freeze(habitatIds), sha256 });
}

export const SABLE_REACH_MACRO_CELLS: readonly AtlasMacroCellRecord[] = Object.freeze(SABLE_REACH_ATLAS.macroCells.records.map(parseAtlasMacroCellRecord));
const macroCellById: ReadonlyMap<string, AtlasMacroCellRecord> = new Map(SABLE_REACH_MACRO_CELLS.map((cell) => [cell.id, cell]));

export function atlasToHearthmereLocal(coordinate: AtlasCoordinate): SiteLocalCoordinate {
  const [originEasting, originNorthing, originElevation] = SABLE_REACH_ATLAS.hearthmereTransform.atlasOrigin;
  return [coordinate[0] - originEasting, coordinate[2] - originElevation, originNorthing - coordinate[1]];
}

export function hearthmereLocalToAtlas(local: SiteLocalCoordinate): AtlasCoordinate {
  const [originEasting, originNorthing, originElevation] = SABLE_REACH_ATLAS.hearthmereTransform.atlasOrigin;
  return [originEasting + local[0], originNorthing - local[2], originElevation + local[1]];
}

export function atlasMacroCellIdAt(point: AtlasPoint2): string | null {
  const { extent, macroCells } = SABLE_REACH_ATLAS;
  if (point[0] < extent.minimumEasting || point[0] >= extent.maximumEasting || point[1] < extent.minimumNorthing || point[1] >= extent.maximumNorthing) return null;
  const column = Math.floor((point[0] - extent.minimumEasting) / macroCells.cellSizeMeters);
  const row = Math.floor((point[1] - extent.minimumNorthing) / macroCells.cellSizeMeters);
  return `atlas.cell.r${row.toString().padStart(2, "0")}.c${column.toString().padStart(2, "0")}`;
}

export function resolveSpatialContext(coordinate: AtlasCoordinate): AtlasSpatialContext | null {
  const point: AtlasPoint2 = [coordinate[0], coordinate[1]];
  const macroCellId = atlasMacroCellIdAt(point);
  const territory = resolveTerritory(point);
  if (!macroCellId || !territory) return null;
  const macroCell = macroCellById.get(macroCellId);
  if (!macroCell) return null;
  const nearestSite = SABLE_REACH_ATLAS.sites.reduce<SiteDefinition | null>((nearest, site) => {
    if (!nearest) return site;
    const candidateDistance = Math.hypot(site.coordinate[0] - coordinate[0], site.coordinate[1] - coordinate[1]);
    const currentDistance = Math.hypot(nearest.coordinate[0] - coordinate[0], nearest.coordinate[1] - coordinate[1]);
    return candidateDistance < currentDistance ? site : nearest;
  }, null);
  return Object.freeze({
    address: Object.freeze({ coordinateSpaceId: "veyl_local_grid_v1", macroCellId, territoryId: territory.id, siteId: nearestSite && Math.hypot(nearestSite.coordinate[0] - coordinate[0], nearestSite.coordinate[1] - coordinate[1]) <= 256 ? nearestSite.id : null }),
    coordinate,
    territory,
    nearestSite,
    habitatIds: macroCell.habitatIds,
  });
}

export function findAtlasRoute(fromSiteId: string, toSiteId: string): AtlasRouteResult {
  if (fromSiteId === toSiteId) return { valid: true, fromSiteId, toSiteId, sectionIds: [], walkingSeconds: 0 };
  const adjacency = new Map<string, { siteId: string; sectionId: string; cost: number }[]>();
  for (const edge of SABLE_REACH_ATLAS.routeGraph.edges) {
    adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), { siteId: edge.to, sectionId: edge.id, cost: edge.costSeconds }]);
    if (edge.bidirectional) adjacency.set(edge.to, [...(adjacency.get(edge.to) ?? []), { siteId: edge.from, sectionId: edge.id, cost: edge.costSeconds }]);
  }
  const distances = new Map<string, number>([[fromSiteId, 0]]);
  const previous = new Map<string, { siteId: string; sectionId: string }>();
  const pending = new Set([fromSiteId]);
  while (pending.size) {
    const current = [...pending].reduce((best, candidate) => (distances.get(candidate) ?? Infinity) < (distances.get(best) ?? Infinity) ? candidate : best);
    pending.delete(current);
    if (current === toSiteId) break;
    for (const edge of adjacency.get(current) ?? []) {
      const candidate = (distances.get(current) ?? Infinity) + edge.cost;
      if (candidate < (distances.get(edge.siteId) ?? Infinity)) {
        distances.set(edge.siteId, candidate);
        previous.set(edge.siteId, { siteId: current, sectionId: edge.sectionId });
        pending.add(edge.siteId);
      }
    }
  }
  const cost = distances.get(toSiteId);
  if (cost === undefined) return { valid: false, fromSiteId, toSiteId, sectionIds: [], walkingSeconds: 0 };
  const reversed: string[] = [];
  let cursor = toSiteId;
  while (cursor !== fromSiteId) {
    const step = previous.get(cursor);
    if (!step) return { valid: false, fromSiteId, toSiteId, sectionIds: [], walkingSeconds: 0 };
    reversed.push(step.sectionId);
    cursor = step.siteId;
  }
  return { valid: true, fromSiteId, toSiteId, sectionIds: reversed.reverse(), walkingSeconds: cost };
}

function polygonArea(polygon: readonly AtlasPoint2[]): number {
  return Math.abs(polygon.reduce((total, point, index) => {
    const next = polygon[(index + 1) % polygon.length]!;
    return total + point[0] * next[1] - next[0] * point[1];
  }, 0) / 2);
}

export function validateSableReachAtlas(atlas: WorldAtlasManifest = SABLE_REACH_ATLAS): AtlasValidationResult {
  const errors: string[] = [];
  if (atlas.extent.widthMeters !== 16_384 || atlas.extent.heightMeters !== 12_288) errors.push("Atlas extent must be 16,384×12,288 meters");
  if (atlas.terrainGrid.columns !== 2048 || atlas.terrainGrid.rows !== 1536 || atlas.terrainGrid.cellSizeMeters !== 8) errors.push("Terrain grid must be 2048×1536 at 8 meters");
  if (atlas.coordinateReferenceSystem.authorityCode !== null || atlas.coordinateReferenceSystem.id !== "veyl_local_grid_v1") errors.push("Synthetic CRS must use veyl_local_grid_v1 without a false authority code");
  if (atlas.territories.length !== 6) errors.push("Atlas must contain exactly six territories");
  const atlasArea = atlas.extent.widthMeters * atlas.extent.heightMeters;
  if (Math.abs(atlas.territories.reduce((sum, territory) => sum + polygonArea(territory.polygon), 0) - atlasArea) > 0.001) errors.push("Territory polygons do not exhaustively cover the extent");
  for (const site of atlas.sites) {
    const owner = atlas.territories.find((territory) => territory.id === site.territoryId);
    if (!owner || !pointInTerritory([site.coordinate[0], site.coordinate[1]], owner, false) || site.containedByTerritoryId !== site.territoryId) errors.push(`Site ${site.id} is not strictly contained by ${site.territoryId}`);
  }
  const terminalIds = new Set(atlas.hydrology.terminals.map((terminal) => terminal.id));
  for (const stream of atlas.hydrology.streams) {
    if (!terminalIds.has(stream.terminalId)) errors.push(`Stream ${stream.id} has no declared terminal`);
    if (stream.modeledBedElevationsMeters.some((elevation, index) => index > 0 && elevation >= stream.modeledBedElevationsMeters[index - 1]!)) errors.push(`Stream ${stream.id} does not descend strictly`);
  }
  const audit = atlas.hydrology.conditioningAudit;
  if (audit.meanAbsoluteDeltaMeters > audit.gates.maximumMeanAbsoluteDeltaMeters
    || audit.p95AbsoluteDeltaMeters > audit.gates.maximumP95AbsoluteDeltaMeters
    || audit.p99AbsoluteDeltaMeters > audit.gates.maximumP99AbsoluteDeltaMeters
    || audit.maximumAbsoluteDeltaMeters > audit.gates.maximumAbsoluteDeltaMeters
    || audit.modifiedCellFraction > audit.gates.maximumModifiedCellFraction
    || audit.rawConditionedCorrelation < audit.gates.minimumRawConditionedCorrelation
    || audit.receiverRawDownhillFraction < audit.gates.minimumReceiverRawDownhillFraction) errors.push("Terrain conditioning or terrain-derived catchment fidelity exceeds its declared gate");
  if (atlas.hydrology.terminalCellIndices.length !== audit.actualTerminalCellCount
    || atlas.hydrology.terminalCellIndices.reduce((sum, terminal) => sum + terminal.terrainDerivedCatchmentCellCount, 0) !== atlas.terrainGrid.columns * atlas.terrainGrid.rows) errors.push("Terrain-derived terminal catchments do not partition the grid");
  const terminalById = new Map(atlas.hydrology.terminals.map((terminal) => [terminal.id, terminal]));
  for (const terminalCell of atlas.hydrology.terminalCellIndices) {
    const terminal = terminalById.get(terminalCell.terminalId);
    if (!terminal) {
      errors.push(`Terrain terminal ${terminalCell.terminalId} is undeclared`);
      continue;
    }
    if (terminal.kind === "coast" && (terminal.boundarySide !== "west" || terminalCell.column !== 0)) errors.push(`Coast terminal ${terminal.id} is not on the west boundary`);
    if (terminal.kind === "boundary") {
      const sideMatches = terminal.boundarySide === "north" ? terminalCell.row === 0
        : terminal.boundarySide === "south" ? terminalCell.row === atlas.terrainGrid.rows - 1
          : terminal.boundarySide === "west" ? terminalCell.column === 0
            : terminal.boundarySide === "east" ? terminalCell.column === atlas.terrainGrid.columns - 1
              : false;
      if (!sideMatches) errors.push(`Boundary terminal ${terminal.id} is not on its declared side`);
    }
  }
  if (atlas.macroCells.count !== 768 || atlas.macroCells.records.length !== 768) errors.push("Atlas must contain 768 macro-cell manifests");
  if (atlas.terrainLayers.length !== 13 || atlas.terrainLayers.some((layer) => !/^[a-f0-9]{64}$/.test(layer.sha256))) errors.push("All terrain derivatives must have SHA-256 evidence");
  if (atlas.proofLocations.length !== 7 || atlas.familyShowcases.length !== 21) errors.push("Atlas must place seven proof locations and 21 family showcases");
  if (atlas.uncommittedAuthoringTargets.some((output) => output.status !== "generator_target_not_committed")) errors.push("Unavailable authoring targets may not be described as committed");
  const hearthmere = atlas.sites.find((site) => site.id === "site.hearthmere");
  if (!hearthmere || hearthmere.coordinate.some((value, index) => value !== atlas.hearthmereTransform.atlasOrigin[index])) errors.push("Hearthmere site and transform origins disagree");
  const roundTrip = hearthmereLocalToAtlas(atlasToHearthmereLocal([6496, 190, 8224]));
  if (roundTrip.some((value, index) => Math.abs(value - [6496, 190, 8224][index]!) > 0.001)) errors.push("Hearthmere transform round-trip exceeds one millimeter");
  const route = findAtlasRoute("site.gloamharbor", "site.ember-gate");
  if (!route.valid) errors.push("Representative settlement route graph is disconnected");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}
