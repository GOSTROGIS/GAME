import type { AtlasCoordinate, SpatialAddress } from "@hollow-march/shared";
import {
  CREATURE_FAMILY_IDS,
  createPrototypeCreatureRig,
  isCreatureFamilyId,
  type CreatureFamilyId,
  type PrototypeCreatureOptions,
  type PrototypeCreatureRig,
} from "../world/PrototypeCreatureFactory.js";

export interface EcologyProofMaturity {
  authored: boolean;
  validated: boolean;
  habitat_valid: boolean;
  encounter_placed: boolean;
  runtime_integrated: boolean;
  prototype_asset: boolean;
  production_asset: boolean;
  playtested: boolean;
}

export interface EcologyProofTelegraph {
  cueId: string;
  visual: string;
  nonvisual: string;
  seconds: number;
  counterplay: string;
}

export interface EcologyProofHabitatEvidence {
  habitatCellId: string;
  suitability: number;
  reachable: boolean;
  navigationCellId: string;
  routeNodeId: string;
  ruleIds: readonly string[];
}

export interface EcologyProofNavigationCell {
  schemaVersion: 1;
  id: string;
  siteId: string;
  coordinateSpaceId: "site_local_meters_v1";
  origin: AtlasCoordinate;
  bounds: { minX: number; minZ: number; maxX: number; maxZ: number };
  walkablePolygons: readonly { id: string; vertices: readonly (readonly [number, number])[] }[];
  colliders: readonly { id: string; shape: "box"; center: readonly [number, number]; size: readonly [number, number] }[];
  nodes: readonly { id: string; x: number; z: number; kind: "spawn" | "waypoint" | "encounter" }[];
  links: readonly { id: string; from: string; to: string; bidirectional: true; cost: number }[];
  spawnAnchors: { player: readonly [number, number, number]; enemy: readonly [number, number, number] };
}

export interface EcologyProofEncounter {
  id: string;
  familyId: CreatureFamilyId;
  creatureId: string;
  siteId: string;
  territoryId: string;
  spatialAddress: SpatialAddress;
  atlasCoordinate: AtlasCoordinate;
  prototypeAssetId: `prototype_creature.${CreatureFamilyId}` | string;
  mechanicHandlerId: string;
  telegraphs: readonly EcologyProofTelegraph[];
  dropTableIds: readonly string[];
  habitat: EcologyProofHabitatEvidence;
  maturity: EcologyProofMaturity;
}

export interface EcologyProofEncounterManifest {
  schemaVersion: 1;
  id: string;
  coordinateSpaceId: "veyl_local_grid_v1";
  navigationCells: readonly EcologyProofNavigationCell[];
  encounters: readonly EcologyProofEncounter[];
}

export interface EcologyProofRuntimeEntry {
  encounterId: string;
  creatureId: string;
  familyId: CreatureFamilyId;
  siteId: string;
  territoryId: string;
  atlasCoordinate: AtlasCoordinate;
  mechanicHandlerId: string;
  telegraphs: readonly EcologyProofTelegraph[];
  prototypeAssetId: string;
  navigationCell: EcologyProofNavigationCell;
  createPrototype(options?: PrototypeCreatureOptions): PrototypeCreatureRig;
}

export interface EcologyProofRuntimePlan {
  manifestId: string;
  coordinateSpaceId: "veyl_local_grid_v1";
  entries: readonly EcologyProofRuntimeEntry[];
  byFamilyId: Readonly<Record<CreatureFamilyId, EcologyProofRuntimeEntry>>;
}

export interface EcologyProofValidation {
  valid: boolean;
  errors: readonly string[];
}

const ID_PATTERN = /^[a-z0-9][a-z0-9_.-]{0,127}$/;
const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));
const validId = (value: unknown): value is string => typeof value === "string" && ID_PATTERN.test(value);
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export function validateEcologyProofEncounterManifest(value: unknown): EcologyProofValidation {
  const errors: string[] = [];
  if (!record(value)) return { valid: false, errors: ["Manifest must be an object"] };
  if (value.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (!validId(value.id)) errors.push("manifest id is missing or invalid");
  if (value.coordinateSpaceId !== "veyl_local_grid_v1") errors.push("coordinateSpaceId must be veyl_local_grid_v1");
  if (!Array.isArray(value.navigationCells) || value.navigationCells.length === 0) return { valid: false, errors: [...errors, "navigationCells must contain canonical proof navigation"] };
  if (!Array.isArray(value.encounters)) return { valid: false, errors: [...errors, "encounters must be an array"] };
  if (value.encounters.length !== CREATURE_FAMILY_IDS.length) errors.push(`expected ${CREATURE_FAMILY_IDS.length} ecology-proof encounters, received ${value.encounters.length}`);

  const encounterIds = new Set<string>();
  const familyIds = new Set<CreatureFamilyId>();
  const navigationById = new Map<string, Record<string, unknown>>();
  value.navigationCells.forEach((navigation, index) => {
    const path = `navigationCells[${index}]`;
    if (!record(navigation)) { errors.push(`${path} must be an object`); return; }
    if (navigation.schemaVersion !== 1 || !validId(navigation.id) || navigationById.has(String(navigation.id))) errors.push(`${path}.id/schemaVersion is missing, invalid, or duplicated`);
    else navigationById.set(navigation.id, navigation);
    if (!validId(navigation.siteId) || navigation.coordinateSpaceId !== "site_local_meters_v1") errors.push(`${path} must identify a site-local metre frame`);
    if (!record(navigation.origin) || !finite(navigation.origin.easting) || !finite(navigation.origin.northing) || !finite(navigation.origin.elevation)) errors.push(`${path}.origin must be a finite atlas coordinate`);
    if (!record(navigation.bounds) || !finite(navigation.bounds.minX) || !finite(navigation.bounds.minZ) || !finite(navigation.bounds.maxX) || !finite(navigation.bounds.maxZ) || Number(navigation.bounds.minX) >= Number(navigation.bounds.maxX) || Number(navigation.bounds.minZ) >= Number(navigation.bounds.maxZ)) errors.push(`${path}.bounds must define a positive walkable area`);
    if (!Array.isArray(navigation.walkablePolygons) || navigation.walkablePolygons.length === 0 || navigation.walkablePolygons.some((polygon) => !record(polygon) || !validId(polygon.id) || !Array.isArray(polygon.vertices) || polygon.vertices.length < 3 || polygon.vertices.some((point) => !Array.isArray(point) || point.length !== 2 || !point.every(finite)))) errors.push(`${path}.walkablePolygons must contain finite polygons`);
    if (!Array.isArray(navigation.colliders) || navigation.colliders.some((collider) => !record(collider) || !validId(collider.id) || collider.shape !== "box" || !Array.isArray(collider.center) || collider.center.length !== 2 || !collider.center.every(finite) || !Array.isArray(collider.size) || collider.size.length !== 2 || !collider.size.every((size) => finite(size) && size > 0))) errors.push(`${path}.colliders must contain valid boxes`);
    if (!Array.isArray(navigation.nodes) || navigation.nodes.length < 4 || navigation.nodes.some((node) => !record(node) || !validId(node.id) || !finite(node.x) || !finite(node.z))) errors.push(`${path}.nodes must contain spawn, waypoint, and encounter nodes`);
    const nodeIds = new Set(Array.isArray(navigation.nodes) ? navigation.nodes.filter(record).map((node) => String(node.id)) : []);
    if (!Array.isArray(navigation.links) || navigation.links.length < 4 || navigation.links.some((link) => !record(link) || !validId(link.id) || !nodeIds.has(String(link.from)) || !nodeIds.has(String(link.to)) || link.bidirectional !== true || !finite(link.cost) || link.cost <= 0)) errors.push(`${path}.links must resolve a bidirectional route graph`);
    const validSpawn = (spawn: unknown) => Array.isArray(spawn) && spawn.length === 3 && spawn.every(finite);
    if (!record(navigation.spawnAnchors) || !validSpawn(navigation.spawnAnchors.player) || !validSpawn(navigation.spawnAnchors.enemy)) errors.push(`${path}.spawnAnchors must contain finite player and enemy positions`);
  });
  value.encounters.forEach((entry, index) => {
    const path = `encounters[${index}]`;
    if (!record(entry)) { errors.push(`${path} must be an object`); return; }
    if (!validId(entry.id) || encounterIds.has(entry.id)) errors.push(`${path}.id is missing, invalid, or duplicated`);
    else encounterIds.add(entry.id);
    if (typeof entry.familyId !== "string" || !isCreatureFamilyId(entry.familyId)) errors.push(`${path}.familyId is not one of the 21 canonical families`);
    else if (familyIds.has(entry.familyId)) errors.push(`${path}.familyId duplicates ${entry.familyId}`);
    else familyIds.add(entry.familyId);
    for (const key of ["creatureId", "siteId", "territoryId", "prototypeAssetId", "mechanicHandlerId"] as const) if (!validId(entry[key])) errors.push(`${path}.${key} is missing or invalid`);
    if (typeof entry.familyId === "string" && isCreatureFamilyId(entry.familyId) && entry.prototypeAssetId !== `prototype_creature.${entry.familyId}`) errors.push(`${path}.prototypeAssetId must resolve to its family prototype`);

    if (!record(entry.spatialAddress) || entry.spatialAddress.coordinateSpaceId !== "veyl_local_grid_v1" || entry.spatialAddress.siteId !== entry.siteId || entry.spatialAddress.territoryId !== entry.territoryId || !validId(entry.spatialAddress.macroCellId)) {
      errors.push(`${path}.spatialAddress must resolve the encounter's site, territory, and macro cell in the atlas grid`);
    }
    if (!record(entry.atlasCoordinate) || !finite(entry.atlasCoordinate.easting) || !finite(entry.atlasCoordinate.northing) || !finite(entry.atlasCoordinate.elevation)) errors.push(`${path}.atlasCoordinate must contain finite easting, northing, and elevation`);

    if (!Array.isArray(entry.telegraphs) || entry.telegraphs.length === 0) errors.push(`${path}.telegraphs must contain at least one readable cue`);
    else entry.telegraphs.forEach((telegraph, telegraphIndex) => {
      if (!record(telegraph) || !validId(telegraph.cueId) || typeof telegraph.visual !== "string" || !telegraph.visual.trim() || typeof telegraph.nonvisual !== "string" || !telegraph.nonvisual.trim() || !finite(telegraph.seconds) || telegraph.seconds <= 0 || typeof telegraph.counterplay !== "string" || !telegraph.counterplay.trim()) errors.push(`${path}.telegraphs[${telegraphIndex}] is incomplete`);
    });
    if (!Array.isArray(entry.dropTableIds) || entry.dropTableIds.length === 0 || entry.dropTableIds.some((id) => !validId(id))) errors.push(`${path}.dropTableIds must resolve at least one valid table`);

    if (!record(entry.habitat) || !validId(entry.habitat.habitatCellId) || !finite(entry.habitat.suitability) || entry.habitat.suitability < 0 || entry.habitat.suitability > 1 || entry.habitat.reachable !== true || !validId(entry.habitat.navigationCellId) || !validId(entry.habitat.routeNodeId) || !Array.isArray(entry.habitat.ruleIds) || entry.habitat.ruleIds.length === 0 || entry.habitat.ruleIds.some((id) => !validId(id))) {
      errors.push(`${path}.habitat must prove suitability, route reachability, navigation, and applied rules`);
    }
    const navigation = record(entry.habitat) && typeof entry.habitat.navigationCellId === "string" ? navigationById.get(entry.habitat.navigationCellId) : undefined;
    if (!navigation || navigation.siteId !== entry.siteId) errors.push(`${path}.habitat.navigationCellId must resolve canonical navigation for the encounter site`);
    if (!record(entry.maturity)) errors.push(`${path}.maturity is missing`);
    else {
      for (const key of ["authored", "validated", "habitat_valid", "encounter_placed", "runtime_integrated", "prototype_asset"] as const) if (entry.maturity[key] !== true) errors.push(`${path}.maturity.${key} must be true for a showcase encounter`);
      for (const key of ["production_asset", "playtested"] as const) if (typeof entry.maturity[key] !== "boolean") errors.push(`${path}.maturity.${key} must be explicit`);
    }
  });
  for (const familyId of CREATURE_FAMILY_IDS) if (!familyIds.has(familyId)) errors.push(`missing ecology-proof encounter for ${familyId}`);
  return { valid: errors.length === 0, errors };
}

/**
 * Runtime seam for packages/content. The content package can export a manifest
 * satisfying EcologyProofEncounterManifest without importing any Three.js code.
 */
export function consumeEcologyProofEncounterManifest(value: unknown): EcologyProofEncounterManifest {
  const validation = validateEcologyProofEncounterManifest(value);
  if (!validation.valid) throw new Error(`Invalid ecology-proof encounter manifest:\n${validation.errors.join("\n")}`);
  return value as unknown as EcologyProofEncounterManifest;
}

export function buildEcologyProofRuntimePlan(value: unknown): EcologyProofRuntimePlan {
  const manifest = consumeEcologyProofEncounterManifest(value);
  const navigationById = new Map(manifest.navigationCells.map((cell) => [cell.id, cell]));
  const entries = manifest.encounters.map((encounter): EcologyProofRuntimeEntry => Object.freeze({
    encounterId: encounter.id,
    creatureId: encounter.creatureId,
    familyId: encounter.familyId,
    siteId: encounter.siteId,
    territoryId: encounter.territoryId,
    atlasCoordinate: encounter.atlasCoordinate,
    mechanicHandlerId: encounter.mechanicHandlerId,
    telegraphs: encounter.telegraphs,
    prototypeAssetId: encounter.prototypeAssetId,
    navigationCell: navigationById.get(encounter.habitat.navigationCellId)!,
    createPrototype: (options = {}) => createPrototypeCreatureRig(encounter.familyId, options),
  }));
  const byFamilyId = Object.fromEntries(entries.map((entry) => [entry.familyId, entry])) as Record<CreatureFamilyId, EcologyProofRuntimeEntry>;
  return Object.freeze({ manifestId: manifest.id, coordinateSpaceId: manifest.coordinateSpaceId, entries: Object.freeze(entries), byFamilyId: Object.freeze(byFamilyId) });
}
