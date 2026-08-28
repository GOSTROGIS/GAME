import { BESTIARY, ENEMY_FAMILIES, type CreatureDefinitionV3 } from "./bestiary.js";
import {
  SABLE_REACH_ATLAS,
  SABLE_REACH_MACRO_CELLS,
  atlasMacroCellIdAt,
  findAtlasRoute,
} from "./atlas.js";

export interface ShowcaseDropTable {
  id: string;
  creatureId: string;
  entries: CreatureDefinitionV3["drops"];
}

export interface ProofNavigationCellRecord {
  schemaVersion: 1;
  id: string;
  siteId: string;
  coordinateSpaceId: "site_local_meters_v1";
  origin: { easting: number; northing: number; elevation: number };
  bounds: { minX: number; minZ: number; maxX: number; maxZ: number };
  walkablePolygons: readonly { id: string; vertices: readonly (readonly [number, number])[] }[];
  colliders: readonly { id: string; shape: "box"; center: readonly [number, number]; size: readonly [number, number] }[];
  nodes: readonly { id: string; x: number; z: number; kind: "spawn" | "waypoint" | "encounter" }[];
  links: readonly { id: string; from: string; to: string; bidirectional: true; cost: number }[];
  spawnAnchors: { player: readonly [number, number, number]; enemy: readonly [number, number, number] };
}

export interface EcologyProofEncounterRecord {
  id: string;
  familyId: string;
  creatureId: string;
  siteId: string;
  territoryId: string;
  spatialAddress: {
    coordinateSpaceId: "veyl_local_grid_v1";
    territoryId: string;
    siteId: string;
    macroCellId: string;
  };
  atlasCoordinate: { easting: number; northing: number; elevation: number };
  prototypeAssetId: string;
  mechanicHandlerId: string;
  authority: {
    protocolVersion: 1;
    roomType: "HearthmereRoom";
    commandMessage: "ecology_proof_action";
    stateMessage: "ecology_proof_state";
    implementationStatus: "server_implemented";
  };
  telegraphs: readonly {
    cueId: string;
    visual: string;
    nonvisual: string;
    seconds: number;
    counterplay: string;
  }[];
  dropTableIds: readonly string[];
  habitat: {
    habitatCellId: string;
    suitability: number;
    reachable: true;
    navigationCellId: string;
    routeNodeId: string;
    ruleIds: readonly string[];
  };
  maturity: {
    authored: true;
    validated: true;
    habitat_valid: true;
    encounter_placed: true;
    runtime_integrated: true;
    prototype_asset: true;
    production_asset: false;
    playtested: false;
  };
}

export interface EcologyProofEncounterManifest {
  schemaVersion: 1;
  id: "atlas.sable-reach.ecology-proofs.v1";
  coordinateSpaceId: "veyl_local_grid_v1";
  navigationCells: readonly ProofNavigationCellRecord[];
  encounters: readonly EcologyProofEncounterRecord[];
}

const proofById = new Map(SABLE_REACH_ATLAS.proofLocations.map((proof) => [proof.id, proof]));
const siteById = new Map(SABLE_REACH_ATLAS.sites.map((site) => [site.id, site]));
const cellById = new Map(SABLE_REACH_MACRO_CELLS.map((cell) => [cell.id, cell]));
const familyById = new Map(ENEMY_FAMILIES.map((family) => [family.id, family]));
const representatives = new Map<string, CreatureDefinitionV3>();

for (const creature of BESTIARY) {
  if (!representatives.has(creature.familyId)) representatives.set(creature.familyId, creature);
}

const requireValue = <T>(value: T | undefined | null, message: string): T => {
  if (value === undefined || value === null) throw new Error(message);
  return value;
};

const freeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) freeze(nested);
    Object.freeze(value);
  }
  return value;
};

const segmentCrossesCollider = (start: { x: number; z: number }, end: { x: number; z: number }, collider: ProofNavigationCellRecord["colliders"][number]): boolean => {
  const minimum = [collider.center[0] - collider.size[0] / 2, collider.center[1] - collider.size[1] / 2] as const;
  const maximum = [collider.center[0] + collider.size[0] / 2, collider.center[1] + collider.size[1] / 2] as const;
  let near = 0;
  let far = 1;
  for (const [origin, delta, low, high] of [[start.x, end.x - start.x, minimum[0], maximum[0]], [start.z, end.z - start.z, minimum[1], maximum[1]]] as const) {
    if (Math.abs(delta) < 1e-9) {
      if (origin >= low && origin <= high) continue;
      return false;
    }
    const first = (low - origin) / delta;
    const second = (high - origin) / delta;
    near = Math.max(near, Math.min(first, second));
    far = Math.min(far, Math.max(first, second));
    if (near > far) return false;
  }
  return true;
};

const navigationColliderRecipes: Readonly<Record<string, readonly { center: readonly [number, number]; size: readonly [number, number] }[]>> = Object.freeze({
  "site.hearthmere": [{ center: [0, 0.55], size: [0.9, 0.7] }, { center: [-2.45, -1.35], size: [0.45, 1.1] }],
  "site.gloamharbor": [{ center: [0.12, 0.52], size: [1.05, 0.64] }, { center: [2.38, -1.28], size: [0.72, 0.72] }],
  "site.warden-reed": [{ center: [-0.08, 0.58], size: [0.78, 0.82] }, { center: [-2.42, -1.18], size: [0.38, 1.3] }],
  "site.cairnmarket": [{ center: [0, 0.48], size: [1.12, 0.6] }, { center: [2.5, -1.32], size: [0.5, 0.9] }],
  "site.hollow-abbey": [{ center: [0.06, 0.6], size: [0.82, 0.78] }, { center: [-2.52, -1.22], size: [0.42, 1.18] }],
  "site.salt-watch": [{ center: [-0.1, 0.54], size: [0.98, 0.68] }, { center: [2.42, -1.26], size: [0.58, 0.96] }],
  "site.ember-gate": [{ center: [0.1, 0.56], size: [0.88, 0.76] }, { center: [-2.48, -1.3], size: [0.48, 1.02] }],
});

const navigationCells: ProofNavigationCellRecord[] = SABLE_REACH_ATLAS.proofLocations.map((proof) => {
  const site = requireValue(siteById.get(proof.siteId), `Missing proof site ${proof.siteId}`);
  const id = `nav.${proof.id}`;
  const playerNode = `${id}.player`;
  const westNode = `${id}.west`;
  const eastNode = `${id}.east`;
  const enemyNode = `${id}.enemy`;
  const nodeCoordinates = new Map([
    [playerNode, [0, 1.8] as const],
    [westNode, [-1.6, 0.35] as const],
    [eastNode, [1.6, 0.35] as const],
    [enemyNode, [0, -0.9] as const],
  ]);
  const link = (suffix: string, from: string, to: string) => {
    const start = requireValue(nodeCoordinates.get(from), `Missing navigation node ${from}`);
    const end = requireValue(nodeCoordinates.get(to), `Missing navigation node ${to}`);
    return { id: `${id}.${suffix}`, from, to, bidirectional: true as const, cost: Number(Math.hypot(end[0] - start[0], end[1] - start[1]).toFixed(3)) };
  };
  return freeze({
    schemaVersion: 1,
    id,
    siteId: site.id,
    coordinateSpaceId: "site_local_meters_v1",
    origin: { easting: site.coordinate[0], northing: site.coordinate[1], elevation: site.coordinate[2] },
    bounds: { minX: -3.2, minZ: -2.5, maxX: 3.2, maxZ: 2.5 },
    walkablePolygons: [{ id: `${id}.walkable`, vertices: [[-3.2, -2.5], [3.2, -2.5], [3.2, 2.5], [-3.2, 2.5]] }],
    colliders: (navigationColliderRecipes[site.id] ?? []).map((collider, index) => ({ id: `${id}.collider.${index + 1}`, shape: "box" as const, center: collider.center, size: collider.size })),
    nodes: [
      { id: playerNode, x: 0, z: 1.8, kind: "spawn" },
      { id: westNode, x: -1.6, z: 0.35, kind: "waypoint" },
      { id: eastNode, x: 1.6, z: 0.35, kind: "waypoint" },
      { id: enemyNode, x: 0, z: -0.9, kind: "encounter" },
    ],
    links: [link("player-west", playerNode, westNode), link("player-east", playerNode, eastNode), link("west-enemy", westNode, enemyNode), link("east-enemy", eastNode, enemyNode)],
    spawnAnchors: { player: [0, 0, 1.8], enemy: [0, 0, -0.9] },
  });
});

export const SABLE_REACH_PROOF_NAVIGATION_CELLS: readonly ProofNavigationCellRecord[] = freeze(navigationCells);
const navigationById = new Map(SABLE_REACH_PROOF_NAVIGATION_CELLS.map((cell) => [cell.id, cell]));

const encounters: EcologyProofEncounterRecord[] = SABLE_REACH_ATLAS.familyShowcases.map((placement) => {
  const proof = requireValue(proofById.get(placement.proofLocationId), `Missing proof location ${placement.proofLocationId}`);
  const site = requireValue(siteById.get(proof.siteId), `Missing proof site ${proof.siteId}`);
  const creature = requireValue(representatives.get(placement.familyId), `Missing representative for ${placement.familyId}`);
  requireValue(familyById.get(placement.familyId), `Unknown family ${placement.familyId}`);
  if (!creature.habitatProfile.territoryIds.includes(site.territoryId)) {
    throw new Error(`${creature.id} cannot be placed in ${site.territoryId}`);
  }
  const macroCellId = requireValue(atlasMacroCellIdAt([site.coordinate[0], site.coordinate[1]]), `Proof site ${site.id} is outside the atlas macro grid`);
  const cell = requireValue(cellById.get(macroCellId), `Missing macro cell ${macroCellId}`);
  const navigationCell = requireValue(navigationById.get(`nav.${proof.id}`), `Missing proof navigation for ${proof.id}`);
  if (navigationCell.siteId !== site.id) throw new Error(`${navigationCell.id} belongs to ${navigationCell.siteId}, not ${site.id}`);
  if (cell.territoryId !== site.territoryId) throw new Error(`${site.id} resolves to ${cell.territoryId}, not ${site.territoryId}`);
  if (cell.habitatIds.length === 0) throw new Error(`${macroCellId} has no viable habitat layer`);
  const matchingHabitatIds = cell.habitatIds.filter((habitatId) => creature.habitatProfile.habitatIds.includes(habitatId));
  if (matchingHabitatIds.length === 0) throw new Error(`${creature.id} has no required habitat in showcase cell ${macroCellId}`);
  const route = findAtlasRoute("site.hearthmere", site.id);
  if (!route.valid) throw new Error(`${site.id} is unreachable from Hearthmere`);
  const telegraph = creature.mechanicContract.telegraphs;
  const dropTableId = `drops.${creature.id}`;
  return freeze({
    id: `encounter.proof.${placement.familyId}`,
    familyId: placement.familyId,
    creatureId: creature.id,
    siteId: site.id,
    territoryId: site.territoryId,
    spatialAddress: {
      coordinateSpaceId: "veyl_local_grid_v1",
      territoryId: site.territoryId,
      siteId: site.id,
      macroCellId,
    },
    atlasCoordinate: { easting: site.coordinate[0], northing: site.coordinate[1], elevation: site.coordinate[2] },
    prototypeAssetId: `prototype_creature.${placement.familyId}`,
    mechanicHandlerId: creature.mechanicContract.handlerId,
    authority: {
      protocolVersion: 1,
      roomType: "HearthmereRoom",
      commandMessage: "ecology_proof_action",
      stateMessage: "ecology_proof_state",
      implementationStatus: "server_implemented",
    },
    telegraphs: [{
      cueId: `cue.${creature.id}.${creature.mechanicContract.moveId}`,
      visual: telegraph.visual,
      nonvisual: telegraph.audio,
      seconds: telegraph.seconds,
      counterplay: creature.mechanicContract.counterplay,
    }],
    dropTableIds: [dropTableId],
    habitat: {
      habitatCellId: macroCellId,
      suitability: Number(Math.max(0.5, 1 - cell.corruption * 0.2 - cell.meanSlopeDegrees / 180).toFixed(3)),
      reachable: true,
      navigationCellId: navigationCell.id,
      routeNodeId: site.id,
      ruleIds: [...matchingHabitatIds, "rule.route_graph_reachable"],
    },
    maturity: {
      authored: true,
      validated: true,
      habitat_valid: true,
      encounter_placed: true,
      runtime_integrated: true,
      prototype_asset: true,
      production_asset: false,
      playtested: false,
    },
  } satisfies EcologyProofEncounterRecord);
});

export const SHOWCASE_DROP_TABLES: readonly ShowcaseDropTable[] = freeze(encounters.map((encounter) => {
  const creature = requireValue(representatives.get(encounter.familyId), `Missing representative for ${encounter.familyId}`);
  return { id: encounter.dropTableIds[0]!, creatureId: creature.id, entries: creature.drops };
}));

export const SABLE_REACH_ECOLOGY_PROOF_ENCOUNTERS: EcologyProofEncounterManifest = freeze({
  schemaVersion: 1,
  id: "atlas.sable-reach.ecology-proofs.v1",
  coordinateSpaceId: "veyl_local_grid_v1",
  navigationCells: SABLE_REACH_PROOF_NAVIGATION_CELLS,
  encounters,
});

export function validateEcologyProofContent(): readonly string[] {
  const errors: string[] = [];
  const families = new Set<string>();
  const drops = new Set(SHOWCASE_DROP_TABLES.map(({ id }) => id));
  if (SABLE_REACH_PROOF_NAVIGATION_CELLS.length !== 7) errors.push("Exactly seven proof navigation cells are required");
  for (const navigation of SABLE_REACH_PROOF_NAVIGATION_CELLS) {
    const nodesById = new Map(navigation.nodes.map((node) => [node.id, node]));
    const nodeIds = new Set(nodesById.keys());
    const adjacency = new Map(navigation.nodes.map((node) => [node.id, new Set<string>()]));
    const insideBounds = (x: number, z: number) => x >= navigation.bounds.minX && x <= navigation.bounds.maxX && z >= navigation.bounds.minZ && z <= navigation.bounds.maxZ;
    const insideCollider = (x: number, z: number) => navigation.colliders.some((collider) => Math.abs(x - collider.center[0]) <= collider.size[0] / 2 && Math.abs(z - collider.center[1]) <= collider.size[1] / 2);
    for (const node of navigation.nodes) {
      if (!insideBounds(node.x, node.z)) errors.push(`${node.id} is outside ${navigation.id}`);
      if (insideCollider(node.x, node.z)) errors.push(`${node.id} is blocked by a collider`);
    }
    for (const link of navigation.links) {
      if (!nodeIds.has(link.from) || !nodeIds.has(link.to) || link.cost <= 0) errors.push(`${link.id} has unresolved endpoints or cost`);
      const start = nodesById.get(link.from);
      const end = nodesById.get(link.to);
      if (start && end) {
        if (navigation.colliders.some((collider) => segmentCrossesCollider(start, end, collider))) errors.push(`${link.id} crosses a declared collider`);
        adjacency.get(link.from)?.add(link.to);
        adjacency.get(link.to)?.add(link.from);
      }
    }
    for (const spawn of Object.values(navigation.spawnAnchors)) {
      if (!insideBounds(spawn[0], spawn[2]) || insideCollider(spawn[0], spawn[2])) errors.push(`${navigation.id} has an invalid spawn anchor`);
    }
    const start = navigation.nodes.find(({ kind }) => kind === "spawn")?.id;
    const target = navigation.nodes.find(({ kind }) => kind === "encounter")?.id;
    const visited = new Set<string>(start ? [start] : []);
    const queue = start ? [start] : [];
    while (queue.length) for (const next of adjacency.get(queue.shift()!) ?? []) if (!visited.has(next)) { visited.add(next); queue.push(next); }
    if (!target || !visited.has(target)) errors.push(`${navigation.id} has no walkable spawn-to-encounter path`);
  }
  if (SABLE_REACH_ECOLOGY_PROOF_ENCOUNTERS.encounters.length !== 21) errors.push("Exactly 21 ecology-proof encounters are required");
  for (const encounter of SABLE_REACH_ECOLOGY_PROOF_ENCOUNTERS.encounters) {
    if (families.has(encounter.familyId)) errors.push(`Duplicate showcase family ${encounter.familyId}`);
    families.add(encounter.familyId);
    if (!BESTIARY.some(({ id }) => id === encounter.creatureId)) errors.push(`Missing creature ${encounter.creatureId}`);
    if (!encounter.dropTableIds.every((id) => drops.has(id))) errors.push(`Unresolved drops for ${encounter.id}`);
    if (!cellById.has(encounter.habitat.habitatCellId)) errors.push(`Unresolved habitat cell for ${encounter.id}`);
    const navigation = navigationById.get(encounter.habitat.navigationCellId);
    if (!navigation || navigation.siteId !== encounter.siteId || navigation.nodes.length < 4 || navigation.links.length < 4) errors.push(`Unresolved proof navigation for ${encounter.id}`);
    const creature = BESTIARY.find(({ id }) => id === encounter.creatureId);
    const cell = cellById.get(encounter.habitat.habitatCellId);
    if (!creature || !cell || !cell.habitatIds.some((habitatId) => creature.habitatProfile.habitatIds.includes(habitatId))) errors.push(`Required habitat mismatch for ${encounter.id}`);
    if (!findAtlasRoute("site.hearthmere", encounter.siteId).valid) errors.push(`Unreachable proof encounter ${encounter.id}`);
  }
  for (const family of ENEMY_FAMILIES) if (!families.has(family.id)) errors.push(`Missing showcase family ${family.id}`);
  return Object.freeze(errors);
}
