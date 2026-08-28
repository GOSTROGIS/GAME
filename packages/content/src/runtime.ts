import assetManifestJson from "../manifests/hearthmere.assets.json" with { type: "json" };
import sceneManifestJson from "../manifests/hearthmere.scene.json" with { type: "json" };
import type {
  AssetDefinition,
  HearthmereAssetManifest,
  HearthmereSceneManifest,
  NavCell,
  NavLink,
  PhaseBound,
  SceneCollider,
  SceneInstance,
  SemanticAnchor,
  SpawnAnchor,
  Vec3,
  WorldTransform,
} from "./index.js";

const SCENE = sceneManifestJson as unknown as HearthmereSceneManifest;
const ASSETS = assetManifestJson as unknown as HearthmereAssetManifest & {
  productionPathRules: Record<string, {
    authoringDirectory: string;
    runtimeDirectory: string;
    sourceExtension: string;
    runtimeExtension: string;
  }>;
};

export type RuntimePipelineStatus = "prototype_geometry" | "production_ready";
export type RuntimeActorKind = "player" | "npc" | "enemy";
export type WorldPointLike = Vec3 | { x: number; y?: number; z: number };

export interface AssetRuntimeRecipe {
  assetId: string;
  category: string;
  subtype?: string;
  status: RuntimePipelineStatus;
  delivery: "procedural" | "file";
  generatorId?: string;
  parameters: Readonly<Record<string, unknown>>;
  capabilities: Readonly<Record<string, readonly string[]>>;
  geometry: { lodTriangles: Vec3 };
  materials: Readonly<Record<string, unknown>>;
  productionTarget: { sourcePath: string; runtimePath: string };
}

export interface RuntimeInstance extends SceneInstance {
  chunkId: string;
  recipeId: string;
}

export interface RuntimeCollider extends SceneCollider {
  chunkId: string;
}

export interface RuntimeNavCell extends NavCell {
  chunkId: string;
}

export interface RuntimeNavLink extends NavLink {
  chunkId: string;
}

export interface RuntimeActorSpawn extends PhaseBound {
  spawnId: string;
  contentId: string;
  kind: RuntimeActorKind;
  assetId: string;
  recipeId: string;
  instanceId?: string;
  encounterId?: string;
  respawnSeconds?: number;
  transform: WorldTransform;
  radiusMeters: number;
}

export interface RuntimeInteractableSpawn extends PhaseBound {
  spawnId: string;
  contentId: string;
  kind: string;
  assetId?: string;
  recipeId?: string;
  instanceId?: string;
  transform: WorldTransform;
  radiusMeters: number;
}

export interface HearthmereRuntimeProjection {
  projectionVersion: 1;
  sceneId: string;
  catalogId: string;
  units: "meters";
  prototypeContentPresent: boolean;
  bounds: HearthmereSceneManifest["bounds"];
  phaseDefinitions: HearthmereSceneManifest["phaseDefinitions"];
  phasePolicy: HearthmereSceneManifest["phasePolicy"];
  assetRecipesById: Readonly<Record<string, AssetRuntimeRecipe>>;
  instances: readonly RuntimeInstance[];
  instancesById: Readonly<Record<string, RuntimeInstance>>;
  actors: {
    player: RuntimeActorSpawn;
    npcs: readonly RuntimeActorSpawn[];
    enemies: readonly RuntimeActorSpawn[];
  };
  actorsBySpawnId: Readonly<Record<string, RuntimeActorSpawn>>;
  interactables: readonly RuntimeInteractableSpawn[];
  interactablesBySpawnId: Readonly<Record<string, RuntimeInteractableSpawn>>;
  colliders: readonly RuntimeCollider[];
  collidersById: Readonly<Record<string, RuntimeCollider>>;
  navigation: {
    cells: readonly RuntimeNavCell[];
    cellsById: Readonly<Record<string, RuntimeNavCell>>;
    links: readonly RuntimeNavLink[];
    linksById: Readonly<Record<string, RuntimeNavLink>>;
  };
}

export interface DestinationValidation {
  valid: boolean;
  code: "walkable" | "invalid_point" | "outside_world" | "outside_navigation" | "blocked_by_collider";
  position: Vec3 | null;
  cellId?: string;
  colliderId?: string;
}

export interface NavigationPathResult {
  valid: boolean;
  code: "path_found" | "invalid_start" | "invalid_destination" | "unreachable";
  start: DestinationValidation;
  destination: DestinationValidation;
  cellIds: readonly string[];
  linkIds: readonly string[];
  waypoints: readonly Vec3[];
}

export interface WalkablePathValidation {
  valid: boolean;
  code: "walkable_path" | "too_few_points" | "invalid_waypoint" | "blocked_segment";
  waypointIndex?: number;
  segmentIndex?: number;
  destination?: DestinationValidation;
}

const asKeyedRecord = <T>(entries: readonly T[], keyOf: (entry: T) => string, label: string): Readonly<Record<string, T>> => {
  const record: Record<string, T> = {};
  for (const entry of entries) {
    const id = keyOf(entry);
    if (record[id]) throw new Error(`Duplicate ${label} ID ${id}`);
    record[id] = entry;
  }
  return Object.freeze(record);
};

function requireEntry<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

function freezeArray<T>(entries: T[]): readonly T[] {
  entries.forEach(deepFreeze);
  return Object.freeze(entries);
}

function productionTarget(asset: AssetDefinition, assetManifest: typeof ASSETS) {
  const rule = requireEntry(assetManifest.productionPathRules[asset.category], `Asset ${asset.id} has no production path rule`);
  return Object.freeze({
    sourcePath: `${rule.authoringDirectory}/${asset.targetSlug}${rule.sourceExtension}`,
    runtimePath: `${rule.runtimeDirectory}/${asset.targetSlug}${rule.runtimeExtension}`,
  });
}

function recipeFor(asset: AssetDefinition, assetManifest: typeof ASSETS): AssetRuntimeRecipe {
  if (asset.pipelineStatus === "prototype_geometry" && (asset.runtime.delivery !== "procedural" || !asset.runtime.generatorId)) {
    throw new Error(`Prototype ${asset.id} must resolve to a named procedural generator`);
  }
  return Object.freeze({
    assetId: asset.id,
    category: asset.category,
    ...(asset.subtype ? { subtype: asset.subtype } : {}),
    status: asset.pipelineStatus,
    delivery: asset.runtime.delivery,
    ...(asset.runtime.generatorId ? { generatorId: asset.runtime.generatorId } : {}),
    parameters: deepFreeze(structuredClone(asset.runtime.parameters || {})),
    capabilities: deepFreeze(structuredClone(asset.runtime.capabilities || {})),
    geometry: deepFreeze({ lodTriangles: structuredClone(asset.geometry.lodTriangles) }),
    materials: deepFreeze(structuredClone(asset.materials)),
    productionTarget: productionTarget(asset, assetManifest),
  });
}

function actorFromAnchor(anchor: SemanticAnchor | SpawnAnchor, kind: RuntimeActorKind): RuntimeActorSpawn {
  const assetId = requireEntry(anchor.assetId, `Actor anchor ${anchor.id} has no assetId`);
  return Object.freeze({
    spawnId: anchor.id,
    contentId: anchor.legacySource?.id || anchor.id,
    kind,
    assetId,
    recipeId: assetId,
    ...(anchor.instanceId ? { instanceId: anchor.instanceId } : {}),
    ...("encounterId" in anchor && anchor.encounterId ? { encounterId: anchor.encounterId } : {}),
    ...("respawnSeconds" in anchor && anchor.respawnSeconds !== undefined ? { respawnSeconds: anchor.respawnSeconds } : {}),
    transform: deepFreeze(structuredClone(anchor.transform)),
    radiusMeters: anchor.radiusMeters,
    phaseIds: deepFreeze([...anchor.phaseIds]),
  });
}

function interactableFromAnchor(anchor: SemanticAnchor, instanceById: Readonly<Record<string, RuntimeInstance>>): RuntimeInteractableSpawn {
  const assetId = anchor.assetId || (anchor.instanceId ? instanceById[anchor.instanceId]?.assetId : undefined);
  return Object.freeze({
    spawnId: anchor.id,
    contentId: anchor.legacySource?.id || anchor.id,
    kind: anchor.kind,
    ...(assetId ? { assetId, recipeId: assetId } : {}),
    ...(anchor.instanceId ? { instanceId: anchor.instanceId } : {}),
    transform: deepFreeze(structuredClone(anchor.transform)),
    radiusMeters: anchor.radiusMeters,
    phaseIds: deepFreeze([...anchor.phaseIds]),
  });
}

export function buildHearthmereRuntimeProjection(
  scene: HearthmereSceneManifest = SCENE,
  assets: HearthmereAssetManifest & typeof ASSETS = ASSETS,
): HearthmereRuntimeProjection {
  const recipes = assets.assets.map((asset) => recipeFor(asset, assets));
  const assetRecipesById = asKeyedRecord(recipes, ({ assetId }) => assetId, "asset recipe");
  const recipeExists = (assetId: string | undefined, owner: string) => {
    if (!assetId || !assetRecipesById[assetId]) throw new Error(`${owner} references missing runtime recipe ${assetId}`);
  };

  const instances = freezeArray(scene.chunks.flatMap((chunk) => chunk.instances.map((instance) => {
    recipeExists(instance.assetId, instance.id);
    return { ...structuredClone(instance), chunkId: chunk.id, recipeId: instance.assetId } satisfies RuntimeInstance;
  })));
  const instancesById = asKeyedRecord(instances, ({ id }) => id, "runtime instance");
  const colliders = freezeArray(scene.chunks.flatMap((chunk) => chunk.colliders.map((collider) => ({ ...structuredClone(collider), chunkId: chunk.id }))));
  const cells = freezeArray(scene.chunks.flatMap((chunk) => chunk.navigation.cells.map((cell) => ({ ...structuredClone(cell), chunkId: chunk.id }))));
  const links = freezeArray(scene.chunks.flatMap((chunk) => chunk.navigation.links.map((link) => ({ ...structuredClone(link), chunkId: chunk.id }))));
  const interactionAnchors = scene.chunks.flatMap((chunk) => chunk.interactionAnchors);
  const spawnAnchors = scene.chunks.flatMap((chunk) => chunk.spawnAnchors);

  const playerAnchor = requireEntry(spawnAnchors.find((anchor) => anchor.kind === "player"), "Hearthmere has no canonical player spawn");
  const npcAnchors = interactionAnchors.filter((anchor) => anchor.kind === "npc");
  const enemyAnchors = spawnAnchors.filter((anchor) => anchor.kind === "enemy");
  const player = actorFromAnchor(playerAnchor, "player");
  const npcs = freezeArray(npcAnchors.map((anchor) => actorFromAnchor(anchor, "npc")));
  const enemies = freezeArray(enemyAnchors.map((anchor) => actorFromAnchor(anchor, "enemy")));
  const actors = [player, ...npcs, ...enemies];
  actors.forEach((actor) => recipeExists(actor.assetId, actor.spawnId));

  const interactables = freezeArray(interactionAnchors.filter((anchor) => anchor.kind !== "npc").map((anchor) => interactableFromAnchor(anchor, instancesById)));
  interactables.forEach((anchor) => { if (anchor.assetId) recipeExists(anchor.assetId, anchor.spawnId); });

  const cellsById = asKeyedRecord(cells, ({ id }) => id, "navigation cell");
  const linksById = asKeyedRecord(links, ({ id }) => id, "navigation link");
  for (const link of links) {
    requireEntry(cellsById[link.from], `Navigation link ${link.id} has missing source ${link.from}`);
    requireEntry(cellsById[link.to], `Navigation link ${link.id} has missing destination ${link.to}`);
  }

  return deepFreeze({
    projectionVersion: 1,
    sceneId: scene.id,
    catalogId: assets.catalogId,
    units: scene.units,
    prototypeContentPresent: recipes.some((recipe) => recipe.status === "prototype_geometry"),
    bounds: structuredClone(scene.bounds),
    phaseDefinitions: structuredClone(scene.phaseDefinitions),
    phasePolicy: structuredClone(scene.phasePolicy),
    assetRecipesById,
    instances,
    instancesById,
    actors: deepFreeze({ player, npcs, enemies }),
    actorsBySpawnId: asKeyedRecord(actors, ({ spawnId }) => spawnId, "actor spawn"),
    interactables,
    interactablesBySpawnId: asKeyedRecord(interactables, ({ spawnId }) => spawnId, "interactable spawn"),
    colliders,
    collidersById: asKeyedRecord(colliders, ({ id }) => id, "collider"),
    navigation: deepFreeze({ cells, cellsById, links, linksById }),
  });
}

export const HEARTHMERE_RUNTIME_PROJECTION = buildHearthmereRuntimeProjection();

export function resolveActivePhaseIds(requested: Iterable<string> = []): ReadonlySet<string> {
  const known = new Set(HEARTHMERE_RUNTIME_PROJECTION.phaseDefinitions.map(({ id }) => id));
  const active = new Set(HEARTHMERE_RUNTIME_PROJECTION.phasePolicy.alwaysActive);
  for (const phaseId of requested) {
    if (!known.has(phaseId)) throw new Error(`Unknown Hearthmere phase ${phaseId}`);
    active.add(phaseId);
  }
  for (const group of HEARTHMERE_RUNTIME_PROJECTION.phasePolicy.exclusiveGroups) {
    const selected = group.filter((phaseId) => active.has(phaseId));
    if (selected.length > 1) throw new Error(`Mutually exclusive Hearthmere phases requested: ${selected.join(", ")}`);
    if (selected.length === 0) {
      const defaultPhase = HEARTHMERE_RUNTIME_PROJECTION.phasePolicy.defaultCharacterPhases.find((phaseId) => group.includes(phaseId));
      if (defaultPhase) active.add(defaultPhase);
    }
  }
  return active;
}

export function isVisibleInPhases(record: PhaseBound, requested: Iterable<string> = []): boolean {
  const active = resolveActivePhaseIds(requested);
  return record.phaseIds.every((phaseId) => active.has(phaseId));
}

export function selectRuntimeInstances(requested: Iterable<string> = []): readonly RuntimeInstance[] {
  const active = resolveActivePhaseIds(requested);
  return HEARTHMERE_RUNTIME_PROJECTION.instances.filter((instance) => instance.phaseIds.every((phaseId) => active.has(phaseId)));
}

export function resolveAssetRuntimeRecipe(assetId: string): AssetRuntimeRecipe | null {
  return HEARTHMERE_RUNTIME_PROJECTION.assetRecipesById[assetId] || null;
}

export function resolveInstanceRuntimeRecipe(instanceId: string): AssetRuntimeRecipe | null {
  const instance = HEARTHMERE_RUNTIME_PROJECTION.instancesById[instanceId];
  return instance ? resolveAssetRuntimeRecipe(instance.recipeId) : null;
}

function toVec3(point: WorldPointLike): Vec3 | null {
  const position = "x" in point ? [point.x, point.y || 0, point.z] : point;
  return position.length === 3 && position.every(Number.isFinite) ? [position[0]!, position[1]!, position[2]!] : null;
}

function pointOnSegmentXZ(point: Vec3, start: Vec3, end: Vec3): boolean {
  const cross = (point[2] - start[2]) * (end[0] - start[0]) - (point[0] - start[0]) * (end[2] - start[2]);
  if (Math.abs(cross) > 1e-7) return false;
  const dot = (point[0] - start[0]) * (end[0] - start[0]) + (point[2] - start[2]) * (end[2] - start[2]);
  const lengthSquared = (end[0] - start[0]) ** 2 + (end[2] - start[2]) ** 2;
  return dot >= 0 && dot <= lengthSquared;
}

function pointInPolygonXZ(point: Vec3, polygon: readonly Vec3[]): boolean {
  let inside = false;
  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current, current += 1) {
    const a = polygon[previous]!;
    const b = polygon[current]!;
    if (pointOnSegmentXZ(point, a, b)) return true;
    const crosses = (a[2] > point[2]) !== (b[2] > point[2]);
    if (crosses && point[0] < ((b[0] - a[0]) * (point[2] - a[2])) / (b[2] - a[2]) + a[0]) inside = !inside;
  }
  return inside;
}

function pointInNavCell(point: Vec3, cell: RuntimeNavCell): boolean {
  const xs = cell.polygon.map((vertex) => vertex[0]);
  const zs = cell.polygon.map((vertex) => vertex[2]);
  const minX = Math.min(...xs); const maxX = Math.max(...xs);
  const minZ = Math.min(...zs); const maxZ = Math.max(...zs);
  return point[0] >= minX && point[0] < maxX && point[2] >= minZ && point[2] < maxZ && pointInPolygonXZ(point, cell.polygon);
}

function colliderContainsXZ(collider: RuntimeCollider, position: Vec3): boolean {
  if (collider.walkable) return false;
  if (collider.shape === "box" && collider.size) {
    return Math.abs(position[0] - collider.center[0]) <= collider.size[0] / 2
      && Math.abs(position[2] - collider.center[2]) <= collider.size[2] / 2;
  }
  if (collider.shape === "cylinder" && collider.radius !== undefined) {
    return Math.hypot(position[0] - collider.center[0], position[2] - collider.center[2]) <= collider.radius;
  }
  if (collider.shape === "capsule" && collider.radius !== undefined) {
    return Math.hypot(position[0] - collider.center[0], position[2] - collider.center[2]) <= collider.radius;
  }
  return false;
}

export function validateWalkableDestination(point: WorldPointLike, requested: Iterable<string> = []): DestinationValidation {
  const position = toVec3(point);
  if (!position) return { valid: false, code: "invalid_point", position: null };
  const bounds = HEARTHMERE_RUNTIME_PROJECTION.bounds;
  if (position[0] < bounds.min[0] || position[0] >= bounds.max[0] || position[2] < bounds.min[2] || position[2] >= bounds.max[2]) {
    return { valid: false, code: "outside_world", position };
  }
  const active = resolveActivePhaseIds(requested);
  const cell = HEARTHMERE_RUNTIME_PROJECTION.navigation.cells.find((candidate) => candidate.phaseIds.every((phaseId) => active.has(phaseId)) && pointInNavCell(position, candidate));
  if (!cell) return { valid: false, code: "outside_navigation", position };
  const collider = HEARTHMERE_RUNTIME_PROJECTION.colliders.find((candidate) => candidate.phaseIds.every((phaseId) => active.has(phaseId)) && colliderContainsXZ(candidate, position));
  if (collider) return { valid: false, code: "blocked_by_collider", position, cellId: cell.id, colliderId: collider.id };
  return { valid: true, code: "walkable", position, cellId: cell.id };
}

export function findNavigationPath(startPoint: WorldPointLike, destinationPoint: WorldPointLike, requested: Iterable<string> = []): NavigationPathResult {
  const start = validateWalkableDestination(startPoint, requested);
  const destination = validateWalkableDestination(destinationPoint, requested);
  if (!start.valid) return { valid: false, code: "invalid_start", start, destination, cellIds: [], linkIds: [], waypoints: [] };
  if (!destination.valid) return { valid: false, code: "invalid_destination", start, destination, cellIds: [], linkIds: [], waypoints: [] };
  const active = resolveActivePhaseIds(requested);
  if (start.cellId === destination.cellId) return { valid: true, code: "path_found", start, destination, cellIds: [start.cellId!], linkIds: [], waypoints: [start.position!, destination.position!] };

  const links = HEARTHMERE_RUNTIME_PROJECTION.navigation.links.filter((link) => link.phaseIds.every((phaseId) => active.has(phaseId)));
  const pending = [start.cellId!];
  const previous = new Map<string, { cellId: string; link: RuntimeNavLink }>();
  const visited = new Set([start.cellId!]);
  while (pending.length) {
    const cellId = pending.shift()!;
    for (const link of links) {
      const next = link.from === cellId ? link.to : link.bidirectional && link.to === cellId ? link.from : null;
      if (!next || visited.has(next)) continue;
      visited.add(next);
      previous.set(next, { cellId, link });
      if (next === destination.cellId) pending.length = 0;
      else pending.push(next);
    }
  }
  if (!previous.has(destination.cellId!)) return { valid: false, code: "unreachable", start, destination, cellIds: [], linkIds: [], waypoints: [] };

  const reversedCells = [destination.cellId!];
  const reversedLinks: RuntimeNavLink[] = [];
  let cursor = destination.cellId!;
  while (cursor !== start.cellId) {
    const step = previous.get(cursor)!;
    reversedLinks.push(step.link);
    reversedCells.push(step.cellId);
    cursor = step.cellId;
  }
  const cellIds = reversedCells.reverse();
  const orderedLinks = reversedLinks.reverse();
  const waypoints: Vec3[] = [start.position!];
  for (const link of orderedLinks) {
    waypoints.push([
      (link.portal[0][0] + link.portal[1][0]) / 2,
      (link.portal[0][1] + link.portal[1][1]) / 2,
      (link.portal[0][2] + link.portal[1][2]) / 2,
    ]);
  }
  waypoints.push(destination.position!);
  return { valid: true, code: "path_found", start, destination, cellIds, linkIds: orderedLinks.map(({ id }) => id), waypoints };
}

export function validateWalkablePath(points: readonly WorldPointLike[], requested: Iterable<string> = [], sampleStepMeters = 0.5): WalkablePathValidation {
  if (points.length < 2) return { valid: false, code: "too_few_points" };
  const normalized: Vec3[] = [];
  for (let index = 0; index < points.length; index += 1) {
    const validation = validateWalkableDestination(points[index]!, requested);
    if (!validation.valid) return { valid: false, code: "invalid_waypoint", waypointIndex: index, destination: validation };
    normalized.push(validation.position!);
  }
  const step = Number.isFinite(sampleStepMeters) && sampleStepMeters > 0 ? Math.min(sampleStepMeters, 1) : 0.5;
  for (let segmentIndex = 0; segmentIndex < normalized.length - 1; segmentIndex += 1) {
    const start = normalized[segmentIndex]!;
    const end = normalized[segmentIndex + 1]!;
    const distance = Math.hypot(end[0] - start[0], end[2] - start[2]);
    const samples = Math.max(1, Math.ceil(distance / step));
    for (let sample = 1; sample < samples; sample += 1) {
      const ratio = sample / samples;
      const validation = validateWalkableDestination([
        start[0] + (end[0] - start[0]) * ratio,
        start[1] + (end[1] - start[1]) * ratio,
        start[2] + (end[2] - start[2]) * ratio,
      ], requested);
      if (!validation.valid) return { valid: false, code: "blocked_segment", segmentIndex, destination: validation };
    }
  }
  return { valid: true, code: "walkable_path" };
}
