/** Dynamic proof-site scene entry. It is intentionally absent from src/index.ts. */
import hearthmereSceneJson from "../manifests/hearthmere.scene.json" with { type: "json" };
import type { ProofSiteSceneManifestV1, SceneChunkManifestV2, SceneInstanceV2, WorldCellSceneRef, WorldTransform } from "@hollow-march/shared";
import { SABLE_REACH_ATLAS, SABLE_REACH_MACRO_CELLS } from "./atlas.js";
import { SABLE_REACH_BRIDGE_ASSETS, SABLE_REACH_BRIDGE_PACK_PLANS, type BridgeAssetDefinition } from "./bridgeAssets.js";

export type BridgeWorldTransform = WorldTransform;
export type BridgeSceneInstance = SceneInstanceV2;
export type BridgeSceneChunkManifestV2 = SceneChunkManifestV2;

export type ProofSiteSceneManifest = ProofSiteSceneManifestV1;

export type BridgeWorldCellSceneRef = WorldCellSceneRef;

interface LegacyTransform {
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  scale: readonly [number, number, number];
}

interface LegacyScene {
  id: string;
  chunks: readonly {
    id: string;
    bounds: { min: readonly [number, number, number]; max: readonly [number, number, number] };
    instances: readonly { id: string; assetId: string; type: string; transform: LegacyTransform; phaseIds: readonly string[] }[];
    colliders: readonly {
      id: string;
      instanceId: string;
      shape: "box" | "cylinder";
      center: readonly [number, number, number];
      size?: readonly [number, number, number];
      radius?: number;
      height?: number;
      layer: "static-world";
      walkable: boolean;
      phaseIds: readonly string[];
    }[];
    occluders: readonly { instanceId: string }[];
    navigation: {
      cells: readonly { id: string; polygon: readonly (readonly [number, number, number])[] }[];
      links: readonly { id: string; from: string; to: string; bidirectional: boolean; cost: number }[];
    };
    lights: readonly { id: string; type: string; intensity: number; castShadow: boolean; transform: LegacyTransform }[];
    volumes: readonly { id: string; kind: string; phaseIds: readonly string[] }[];
    audioZones: readonly { id: string; phaseIds: readonly string[] }[];
    interactionAnchors: readonly { id: string; instanceId?: string; transform: LegacyTransform; radiusMeters: number; phaseIds: readonly string[] }[];
    spawnAnchors: readonly { id: string; kind: string; transform: LegacyTransform; radiusMeters: number; phaseIds: readonly string[] }[];
  }[];
}

const hearthmereLegacy = hearthmereSceneJson as unknown as LegacyScene;
const PHASE_BITS: Readonly<Record<string, number>> = Object.freeze({ public: 1, "ember-ledger-unrestored": 2, "ember-ledger-restored": 4 });

function phaseMask(phaseIds: readonly string[]): number {
  return phaseIds.reduce((mask, id) => mask | (PHASE_BITS[id] ?? 0), 0) || 1;
}

function transform(legacy: LegacyTransform): BridgeWorldTransform {
  return Object.freeze({ x: legacy.position[0], y: legacy.position[1], z: legacy.position[2], yaw: legacy.rotation[1] });
}

function at(position: readonly [number, number, number], yaw = 0): BridgeWorldTransform {
  return Object.freeze({ x: position[0], y: position[1], z: position[2], yaw });
}

function polygonCenter(polygon: readonly (readonly [number, number, number])[]): BridgeWorldTransform {
  const divisor = Math.max(1, polygon.length);
  return Object.freeze({
    x: polygon.reduce((sum, point) => sum + point[0], 0) / divisor,
    y: polygon.reduce((sum, point) => sum + point[1], 0) / divisor,
    z: polygon.reduce((sum, point) => sum + point[2], 0) / divisor,
    yaw: 0,
  });
}

function token(value: string): string {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    first = Math.imul(first ^ value.charCodeAt(index), 0x01000193) >>> 0;
    second = Math.imul(second ^ value.charCodeAt(index), 0x85ebca6b) >>> 0;
  }
  return `${first.toString(16).padStart(8, "0")}${second.toString(16).padStart(8, "0")}`.repeat(4);
}

function macroCellId(column: number, row: number): string {
  return `atlas.cell.r${row.toString().padStart(2, "0")}.c${column.toString().padStart(2, "0")}`;
}

function siteSlug(siteId: string): string {
  return siteId.slice("site.".length);
}

function selectHearthmereAsset(instanceType: string, indexByRole: Record<string, number>): string | null {
  const role = instanceType === "structure" ? "structure" : instanceType === "prop" ? "prop" : instanceType === "foliage" ? "foliage" : null;
  if (!role) return null;
  let pool = SABLE_REACH_BRIDGE_ASSETS.filter((asset) => asset.siteId === "site.hearthmere" && asset.role === role);
  if (role === "structure") pool = SABLE_REACH_BRIDGE_ASSETS.filter((asset) => asset.siteId === "site.hearthmere" && (asset.role === "structure" || asset.role === "landmark_traversal"));
  const index = indexByRole[role] ?? 0;
  indexByRole[role] = index + 1;
  return pool[index % pool.length]!.id;
}

function adaptHearthmereChunks(): readonly BridgeSceneChunkManifestV2[] {
  const navNodeToChunk = new Map<string, string>();
  for (const chunk of hearthmereLegacy.chunks) for (const link of chunk.navigation.links) navNodeToChunk.set(link.from, chunk.id);
  const indexByRole: Record<string, number> = {};
  return Object.freeze(hearthmereLegacy.chunks.map((chunk) => {
    const instances = chunk.instances.map((instance) => {
      const bridgeAssetId = selectHearthmereAsset(instance.type, indexByRole);
      return Object.freeze({
        id: instance.id,
        assetId: bridgeAssetId ?? instance.assetId,
        sourceAssetId: instance.assetId,
        transform: transform(instance.transform),
        scale: Object.freeze([...instance.transform.scale] as [number, number, number]),
        phaseMask: phaseMask(instance.phaseIds),
        instanceGroupId: bridgeAssetId ? `instance-group.${bridgeAssetId}` : null,
      });
    });
    return Object.freeze({
      schemaVersion: 2 as const,
      id: chunk.id,
      siteId: "site.hearthmere",
      coordinateSpaceId: "hearthmere_local_meters",
      assetPackIds: Object.freeze(["bridge.pack.hearthmere", "hearthmere.legacy.pack"]),
      bounds: Object.freeze({ min: at(chunk.bounds.min), max: at(chunk.bounds.max) }),
      instances: Object.freeze(instances),
      colliders: Object.freeze(chunk.colliders.map((collider) => {
        const height = collider.height ?? collider.size?.[1];
        if (collider.shape === "cylinder") return Object.freeze({
          id: collider.id,
          instanceId: collider.instanceId,
          transform: at(collider.center),
          phaseMask: phaseMask(collider.phaseIds),
          collisionLayer: collider.layer,
          walkable: collider.walkable,
          shape: "cylinder" as const,
          size: null,
          radius: collider.radius!,
          height: height!,
        });
        return Object.freeze({
          id: collider.id,
          instanceId: collider.instanceId,
          transform: at(collider.center),
          phaseMask: phaseMask(collider.phaseIds),
          collisionLayer: collider.layer,
          walkable: collider.walkable,
          shape: "box" as const,
          size: Object.freeze([...collider.size!] as [number, number, number]),
          radius: null,
          height: height!,
        });
      })),
      navigation: Object.freeze({
        graphId: `nav.graph.${chunk.id}`,
        hash: token(JSON.stringify(chunk.navigation)),
        links: Object.freeze(chunk.navigation.links.map((link) => Object.freeze({ toChunkId: navNodeToChunk.get(link.to) ?? chunk.id, fromAnchor: link.from, toAnchor: link.to }))),
        nodes: Object.freeze(chunk.navigation.cells.map((cell) => Object.freeze({ id: cell.id, transform: polygonCenter(cell.polygon), radius: 1.5 }))),
        edges: Object.freeze(chunk.navigation.links.map((link) => Object.freeze({ id: link.id, fromNodeId: link.from, toNodeId: link.to, bidirectional: link.bidirectional, cost: link.cost }))),
      }),
      occluders: Object.freeze(chunk.occluders.map((occluder) => Object.freeze({ instanceId: occluder.instanceId, fadeGroup: `fade.${chunk.id}` }))),
      lights: Object.freeze(chunk.lights.map((light) => Object.freeze({ id: light.id, kind: light.type === "spot" ? "spot" as const : "point" as const, transform: transform(light.transform), intensity: light.intensity, castsShadow: light.castShadow }))),
      volumes: Object.freeze([
        ...chunk.volumes.map((volume) => Object.freeze({ id: volume.id, kind: volume.kind.includes("rain") ? "rain" as const : volume.kind.includes("phase") ? "phase" as const : "fog" as const, phaseMask: phaseMask(volume.phaseIds) })),
        ...chunk.audioZones.map((zone) => Object.freeze({ id: zone.id, kind: "audio" as const, phaseMask: phaseMask(zone.phaseIds) })),
      ]),
      interactionAnchors: Object.freeze(chunk.interactionAnchors.map((anchor) => Object.freeze({ id: anchor.id, instanceId: anchor.instanceId ?? null, transform: transform(anchor.transform), radius: anchor.radiusMeters, phaseMask: phaseMask(anchor.phaseIds) }))),
      spawnAnchors: Object.freeze(chunk.spawnAnchors.map((anchor) => Object.freeze({ id: anchor.id, kind: anchor.kind === "enemy" ? "enemy" as const : anchor.kind === "player" ? "player" as const : "npc" as const, transform: transform(anchor.transform), radius: anchor.radiusMeters, phaseMask: phaseMask(anchor.phaseIds) }))),
      legacy: Object.freeze({ sourceManifestId: hearthmereLegacy.id, preservesInstanceIds: true as const, preservesCoordinates: true as const, preservesSemanticAnchors: true as const }),
      maturity: "prototype_geometry" as const,
    });
  }));
}

function sitePlacement(siteId: string, asset: BridgeAssetDefinition, assetIndex: number, repeat: number): Readonly<{ transform: BridgeWorldTransform; scale: readonly [number, number, number] }> {
  const role = asset.role;
  const scale = 0.86 + ((assetIndex * 7 + repeat * 3) % 8) * 0.045;
  let x = 0;
  let y = 0;
  let z = 0;
  let yaw = 0;
  if (siteId === "site.gloamharbor") {
    if (role === "structure") { x = 58 + repeat * 20; z = 28 + assetIndex * 52 + (repeat % 2) * 3; yaw = Math.PI / 2; }
    else if (role === "landmark_traversal") { x = 24 + repeat * 27; z = 96 + (repeat % 2) * 5; yaw = Math.PI / 2; }
    else if (role === "foliage") { x = 18 + repeat * 30; z = 34 + (assetIndex - 8) * 56; yaw = repeat * 0.7; }
    else { x = 72 + repeat * 18; z = 22 + (assetIndex - 3) * 31 + (repeat % 2) * 6; yaw = Math.PI / 2 + repeat * 0.13; }
    y = role === "landmark_traversal" ? 0.7 : -0.25 + Math.min(1.2, x / 180);
  } else if (siteId === "site.warden-reed") {
    if (role === "structure") { x = repeat % 2 === 0 ? 22 : 170; z = 22 + Math.floor(repeat / 2) * 66 + assetIndex * 7; yaw = repeat % 2 === 0 ? 0.18 : Math.PI - 0.18; }
    else { x = 22 + repeat * 29; z = 30 + ((assetIndex * 19 + repeat * 13) % 132); yaw = Math.atan2(Math.cos(repeat), 1); }
    y = role === "foliage" ? -0.35 : role === "prop" ? 0.45 : 1.15;
  } else if (siteId === "site.cairnmarket") {
    const angle = (assetIndex * 6 + repeat) * Math.PI / 36;
    const radius = role === "structure" ? 66 : role === "foliage" ? 77 : role === "landmark_traversal" ? 38 + repeat * 5 : 28 + repeat * 4;
    x = 96 + Math.cos(angle) * radius;
    z = 96 + Math.sin(angle) * radius;
    y = 0.2 + (repeat % 3) * 0.22;
    yaw = angle + Math.PI / 2;
  } else if (siteId === "site.hollow-abbey") {
    if (role === "structure") { x = repeat % 2 === 0 ? 40 : 152; z = 24 + Math.floor(repeat / 2) * 64 + assetIndex * 5; }
    else if (role === "landmark_traversal") { x = 96 + (repeat % 2 === 0 ? -8 : 8); z = 24 + repeat * 28; }
    else { x = 56 + (repeat % 3) * 40 + (assetIndex % 2) * 5; z = 26 + Math.floor(repeat / 3) * 94 + (assetIndex % 4) * 13; }
    y = Math.max(0, (170 - z) * 0.055) + (role === "structure" ? 1.2 : 0);
    yaw = role === "structure" ? (x < 96 ? Math.PI / 2 : -Math.PI / 2) : (repeat % 3 - 1) * 0.18;
  } else if (siteId === "site.salt-watch") {
    if (role === "structure") { x = 20 + repeat * 30; z = 30 + assetIndex * 36 + (repeat % 2) * 4; yaw = -0.12; }
    else if (role === "landmark_traversal") { x = 18 + repeat * 31; z = 142 + (repeat % 2) * 8; yaw = 0.08; }
    else { x = 16 + repeat * 31 + (assetIndex % 3) * 3; z = 18 + ((assetIndex * 17 + repeat * 7) % 112); yaw = -0.32 + repeat * 0.11; }
    y = role === "structure" ? 0.35 : -1.8 + (assetIndex % 4) * 0.24;
  } else if (siteId === "site.ember-gate") {
    if (role === "structure") { x = repeat % 2 === 0 ? 38 : 154; z = 18 + Math.floor(repeat / 2) * 67 + assetIndex * 5; yaw = x < 96 ? 0.28 : Math.PI - 0.28; }
    else { x = 66 + (assetIndex % 3) * 31 + (repeat % 2) * 7; z = 18 + repeat * 28 + (assetIndex % 4) * 4; yaw = 0.22 + (assetIndex % 3) * 0.17; }
    y = 0.5 + z * 0.045 + (role === "landmark_traversal" ? 1.4 : 0);
  } else {
    throw new Error(`No authored bridge layout for ${siteId}`);
  }
  return Object.freeze({ transform: Object.freeze({ x, y, z, yaw }), scale: Object.freeze([scale, scale + (repeat % 2) * 0.04, scale] as const) });
}

function deterministicInstances(siteId: string, assets: readonly BridgeAssetDefinition[]): readonly BridgeSceneInstance[] {
  const slug = siteSlug(siteId);
  return Object.freeze(assets.flatMap((asset, assetIndex) => Array.from({ length: 6 }, (_, repeat) => {
    const placement = sitePlacement(siteId, asset, assetIndex, repeat);
    return Object.freeze({
      id: `bridge.instance.${slug}.${asset.slug}.${repeat}`,
      assetId: asset.id,
      sourceAssetId: null,
      transform: placement.transform,
      scale: placement.scale,
      phaseMask: 1,
      instanceGroupId: `instance-group.${asset.id}`,
    });
  })));
}

function navPoints(...points: readonly (readonly [number, number, number])[]): readonly (readonly [number, number, number])[] {
  return Object.freeze(points.map((point) => Object.freeze([...point] as [number, number, number])));
}

const SITE_NAVIGATION_POINTS: Readonly<Record<string, readonly (readonly [number, number, number])[]>> = Object.freeze({
  "site.gloamharbor": navPoints([174, 0.8, 172], [148, 0.7, 172], [120, 0.5, 172], [92, 0.35, 172], [62, 0.2, 172], [34, 0, 170], [28, 0.3, 134], [28, 0.7, 96]),
  "site.warden-reed": navPoints([42, 1.1, 22], [56, 1.1, 40], [72, 1.1, 34], [92, 1.1, 60], [116, 1.1, 52], [132, 1.1, 78], [146, 1.1, 108], [150, 1.1, 144]),
  "site.cairnmarket": navPoints([96, 0.4, 80], [107, 0.4, 85], [112, 0.5, 96], [107, 0.5, 107], [96, 0.4, 112], [85, 0.4, 107], [80, 0.5, 96], [85, 0.4, 85]),
  "site.hollow-abbey": navPoints([24, 0, 178], [24, 1.4, 150], [24, 3.2, 126], [24, 5.2, 96], [24, 6.4, 72], [30, 5.2, 96], [30, 3.2, 126], [24, 8.2, 26]),
  "site.salt-watch": navPoints([18, -1.4, 174], [44, -1.4, 168], [70, -1.3, 174], [96, -1.2, 166], [122, -1.1, 174], [148, -1, 166], [174, -0.8, 174], [174, -0.6, 146]),
  "site.ember-gate": navPoints([52, 1.2, 174], [52, 2.1, 150], [52, 3.1, 126], [52, 4.1, 102], [52, 5.2, 78], [52, 6.2, 56], [52, 7.3, 36], [52, 8.2, 18]),
});

function localNavigation(siteId: string) {
  const slug = siteSlug(siteId);
  const points = SITE_NAVIGATION_POINTS[siteId];
  if (!points) throw new Error(`No authored navigation for ${siteId}`);
  const nodes = points.map((point, index) => Object.freeze({ id: `nav.${slug}.${index}`, transform: at(point), radius: 1.4 }));
  const edgePairs: readonly (readonly [number, number])[] = siteId === "site.hollow-abbey"
    ? Object.freeze([[0, 1], [1, 2], [2, 3], [3, 4], [1, 6], [6, 5], [5, 4], [4, 7]])
    : siteId === "site.cairnmarket"
      ? Object.freeze([[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0]])
      : Object.freeze(points.slice(1).map((_, index) => Object.freeze([index, index + 1] as const)));
  const edges = edgePairs.map(([from, to], index) => {
    const start = nodes[from]!.transform;
    const end = nodes[to]!.transform;
    return Object.freeze({ id: `nav-edge.${slug}.${index}`, fromNodeId: nodes[from]!.id, toNodeId: nodes[to]!.id, bidirectional: true, cost: Math.round(Math.hypot(end.x - start.x, end.y - start.y, end.z - start.z) * 1000) / 1000 });
  });
  return Object.freeze({ nodes: Object.freeze(nodes), edges: Object.freeze(edges) });
}

function proofCollider(instance: BridgeSceneInstance, asset: BridgeAssetDefinition) {
  const profile = asset.colliderProfile;
  const height = profile.height * instance.scale[1];
  const transform = Object.freeze({ ...instance.transform, y: instance.transform.y + height / 2 });
  if (profile.shape === "cylinder") return Object.freeze({
    id: `collider.${instance.id}`, instanceId: instance.id, transform, phaseMask: instance.phaseMask,
    collisionLayer: profile.collisionLayer, walkable: profile.walkable, shape: "cylinder" as const, size: null,
    radius: profile.radius! * Math.max(instance.scale[0], instance.scale[2]), height,
  });
  const size = profile.size!;
  return Object.freeze({
    id: `collider.${instance.id}`, instanceId: instance.id, transform, phaseMask: instance.phaseMask,
    collisionLayer: profile.collisionLayer, walkable: profile.walkable,
    shape: "box" as const, size: Object.freeze([size[0] * instance.scale[0], height, size[2] * instance.scale[2]] as const), radius: null, height,
  });
}

function createProofChunk(siteId: string): BridgeSceneChunkManifestV2 {
  const slug = siteSlug(siteId);
  const assets = SABLE_REACH_BRIDGE_ASSETS.filter((asset) => asset.siteId === siteId);
  const instances = deterministicInstances(siteId, assets);
  const solid = new Set(assets.filter((asset) => asset.role === "structure" || asset.role === "landmark_traversal").map((asset) => asset.id));
  const landmark = assets.find((asset) => asset.role === "landmark_traversal")!;
  const landmarkInstance = instances.find((instance) => instance.assetId === landmark.id)!;
  const assetById = new Map(assets.map((asset) => [asset.id, asset] as const));
  const navigation = localNavigation(siteId);
  return Object.freeze({
    schemaVersion: 2 as const,
    id: `bridge.chunk.${slug}.proof`,
    siteId,
    coordinateSpaceId: "site_local_meters_v1",
    assetPackIds: Object.freeze([`bridge.pack.${slug}`]),
    bounds: Object.freeze({ min: Object.freeze({ x: 0, y: -8, z: 0, yaw: 0 }), max: Object.freeze({ x: 192, y: 48, z: 192, yaw: 0 }) }),
    instances,
    colliders: Object.freeze(instances.map((instance) => proofCollider(instance, assetById.get(instance.assetId)!))),
    navigation: Object.freeze({ graphId: `nav.graph.${slug}.proof`, hash: token(JSON.stringify(navigation)), links: Object.freeze([]), nodes: navigation.nodes, edges: navigation.edges }),
    occluders: Object.freeze(instances.filter((instance) => solid.has(instance.assetId)).slice(0, 12).map((instance) => Object.freeze({ instanceId: instance.id, fadeGroup: `fade.${slug}.structures` }))),
    lights: Object.freeze([
      Object.freeze({ id: `light.${slug}.cold-key`, kind: "area" as const, transform: Object.freeze({ x: 96, y: 28, z: 74, yaw: 0.7 }), intensity: 1.1, castsShadow: false }),
      Object.freeze({ id: `light.${slug}.near-practical`, kind: "point" as const, transform: Object.freeze({ x: 92, y: 3, z: 98, yaw: 0 }), intensity: 3.4, castsShadow: true }),
    ]),
    volumes: Object.freeze([
      Object.freeze({ id: `volume.${slug}.weather`, kind: siteId === "site.salt-watch" ? "fog" as const : "rain" as const, phaseMask: 1 }),
      Object.freeze({ id: `volume.${slug}.ambience`, kind: "audio" as const, phaseMask: 1 }),
    ]),
    interactionAnchors: Object.freeze([Object.freeze({ id: `landmark.${slug}.proof`, instanceId: landmarkInstance.id, transform: landmarkInstance.transform, radius: 5, phaseMask: 1 })]),
    spawnAnchors: Object.freeze([
      Object.freeze({ id: `spawn.${slug}.player`, kind: "player" as const, transform: navigation.nodes[0]!.transform, radius: 1, phaseMask: 1 }),
      Object.freeze({ id: `spawn.${slug}.enemy`, kind: "enemy" as const, transform: navigation.nodes.at(-1)!.transform, radius: 4, phaseMask: 1 }),
    ]),
    legacy: null,
    maturity: "prototype_geometry" as const,
  });
}

const proofBySite = new Map(SABLE_REACH_ATLAS.proofLocations.map((proof) => [proof.siteId, proof]));

export const SABLE_REACH_PROOF_SITE_SCENES: readonly ProofSiteSceneManifest[] = Object.freeze(SABLE_REACH_BRIDGE_PACK_PLANS.map((pack) => {
  const proof = proofBySite.get(pack.siteId)!;
  const sceneId = `bridge.scene.${siteSlug(pack.siteId)}`;
  return Object.freeze({
    schemaVersion: 1 as const,
    id: sceneId,
    siteId: pack.siteId,
    macroCellId: macroCellId(proof.macroCell[0], proof.macroCell[1]),
    packId: pack.id,
    chunks: pack.siteId === "site.hearthmere" ? adaptHearthmereChunks() : Object.freeze([createProofChunk(pack.siteId)]),
    maturity: "prototype_geometry" as const,
    seamlessTraversalApproved: false as const,
  });
}));

const sceneByCell = new Map(SABLE_REACH_PROOF_SITE_SCENES.map((scene) => [scene.macroCellId, scene]));

export const SABLE_REACH_WORLD_CELL_SCENE_REFS: readonly BridgeWorldCellSceneRef[] = Object.freeze(SABLE_REACH_MACRO_CELLS.map((cell) => {
  const scene = sceneByCell.get(cell.id);
  return Object.freeze({ worldCellId: cell.id, sceneRef: scene ? Object.freeze({ siteId: scene.siteId, sceneId: scene.id, packId: scene.packId }) : null });
}));

function connectedNavigation(nodeIds: readonly string[], edges: readonly Readonly<{ fromNodeId: string; toNodeId: string; bidirectional: boolean }>[]): boolean {
  if (nodeIds.length === 0) return false;
  const known = new Set(nodeIds);
  const adjacency = new Map(nodeIds.map((id) => [id, new Set<string>()]));
  for (const edge of edges) {
    if (!known.has(edge.fromNodeId) || !known.has(edge.toNodeId)) return false;
    adjacency.get(edge.fromNodeId)!.add(edge.toNodeId);
    if (edge.bidirectional) adjacency.get(edge.toNodeId)!.add(edge.fromNodeId);
  }
  const reached = new Set<string>();
  const pending = [nodeIds[0]!];
  while (pending.length > 0) {
    const current = pending.pop()!;
    if (reached.has(current)) continue;
    reached.add(current);
    for (const next of adjacency.get(current) ?? []) if (!reached.has(next)) pending.push(next);
  }
  return reached.size === nodeIds.length;
}

function colliderHasDimensions(collider: BridgeSceneChunkManifestV2["colliders"][number]): boolean {
  if (!(collider.height > 0) || !Number.isFinite(collider.transform.x + collider.transform.y + collider.transform.z)) return false;
  if (collider.shape === "box") return collider.radius === null && collider.size.length === 3 && collider.size.every((axis) => Number.isFinite(axis) && axis > 0);
  return collider.size === null && Number.isFinite(collider.radius) && collider.radius > 0;
}

function navigationSegmentHitsCollider(start: BridgeWorldTransform, end: BridgeWorldTransform, collider: BridgeSceneChunkManifestV2["colliders"][number]): boolean {
  if (collider.walkable) return false;
  const cosine = Math.cos(collider.transform.yaw);
  const sine = Math.sin(collider.transform.yaw);
  const local = (point: BridgeWorldTransform) => {
    const dx = point.x - collider.transform.x;
    const dz = point.z - collider.transform.z;
    return { x: cosine * dx + sine * dz, z: -sine * dx + cosine * dz };
  };
  const from = local(start);
  const to = local(end);
  if (collider.shape === "cylinder") {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const divisor = dx * dx + dz * dz;
    const t = divisor === 0 ? 0 : Math.max(0, Math.min(1, -(from.x * dx + from.z * dz) / divisor));
    return Math.hypot(from.x + dx * t, from.z + dz * t) <= collider.radius + 0.5;
  }
  let entry = 0;
  let exit = 1;
  for (const [origin, delta, half] of [[from.x, to.x - from.x, collider.size[0] / 2 + 0.5], [from.z, to.z - from.z, collider.size[2] / 2 + 0.5]] as const) {
    if (Math.abs(delta) < 1e-9) {
      if (origin < -half || origin > half) return false;
      continue;
    }
    const first = (-half - origin) / delta;
    const second = (half - origin) / delta;
    entry = Math.max(entry, Math.min(first, second));
    exit = Math.min(exit, Math.max(first, second));
    if (entry > exit) return false;
  }
  return true;
}

function siteGeographyIsDistinct(scene: ProofSiteSceneManifest): boolean {
  const instances = scene.chunks.flatMap(({ instances }) => instances);
  const assets = new Map(SABLE_REACH_BRIDGE_ASSETS.filter(({ siteId }) => siteId === scene.siteId).map((asset) => [asset.id, asset]));
  const structures = instances.filter(({ assetId }) => assets.get(assetId)?.role === "structure");
  const landmarks = instances.filter(({ assetId }) => assets.get(assetId)?.role === "landmark_traversal");
  const ys = instances.map(({ transform }) => transform.y);
  if (scene.siteId === "site.gloamharbor") return Math.min(...landmarks.map(({ transform }) => transform.x)) <= 24 && Math.max(...structures.map(({ transform }) => transform.z)) - Math.min(...structures.map(({ transform }) => transform.z)) > 90;
  if (scene.siteId === "site.warden-reed") return structures.every(({ transform }) => transform.x <= 24 || transform.x >= 168) && new Set(instances.map(({ transform }) => transform.z)).size > 30;
  if (scene.siteId === "site.cairnmarket") return structures.every(({ transform }) => Math.abs(Math.hypot(transform.x - 96, transform.z - 96) - 66) < 0.001);
  if (scene.siteId === "site.hollow-abbey") return Math.max(...ys) - Math.min(...ys) > 8 && structures.every(({ transform }) => transform.x === 40 || transform.x === 152);
  if (scene.siteId === "site.salt-watch") return Math.min(...ys) < -1 && landmarks.every(({ transform }) => transform.z >= 142);
  if (scene.siteId === "site.ember-gate") return Math.max(...ys) - Math.min(...ys) > 7 && structures.every(({ transform }) => transform.x === 38 || transform.x === 154);
  return false;
}

export function validateBridgeSiteScenes(scenes: readonly ProofSiteSceneManifest[] = SABLE_REACH_PROOF_SITE_SCENES, refs: readonly BridgeWorldCellSceneRef[] = SABLE_REACH_WORLD_CELL_SCENE_REFS): readonly string[] {
  const errors: string[] = [];
  if (scenes.length !== 7) errors.push(`Expected seven scene-backed proof sites, received ${scenes.length}`);
  if (refs.length !== 768 || refs.filter(({ sceneRef }) => sceneRef === null).length !== 761) errors.push("World cell scene references must contain seven scenes and 761 null references");
  const hearthmere = scenes.find(({ siteId }) => siteId === "site.hearthmere");
  const hearthmereInstances = hearthmere?.chunks.flatMap(({ instances }) => instances) ?? [];
  const legacyInstances = hearthmereLegacy.chunks.flatMap(({ instances }) => instances);
  if (hearthmereInstances.length !== 51) errors.push(`Hearthmere V2 adapter must preserve 51 instances, received ${hearthmereInstances.length}`);
  for (const legacy of legacyInstances) {
    const adapted = hearthmereInstances.find(({ id }) => id === legacy.id);
    if (!adapted || JSON.stringify(adapted.transform) !== JSON.stringify(transform(legacy.transform))) errors.push(`Hearthmere instance ${legacy.id} did not preserve identity and coordinates`);
  }
  for (const legacyChunk of hearthmereLegacy.chunks) {
    const adaptedChunk = hearthmere?.chunks.find(({ id }) => id === legacyChunk.id);
    if (!adaptedChunk) { errors.push(`Missing Hearthmere chunk ${legacyChunk.id}`); continue; }
    if (adaptedChunk.navigation.links.length !== legacyChunk.navigation.links.length) errors.push(`${legacyChunk.id} navigation links drifted`);
    if ((adaptedChunk.navigation.nodes?.length ?? -1) !== legacyChunk.navigation.cells.length) errors.push(`${legacyChunk.id} navigation cells were not represented as V2 nodes`);
    if ((adaptedChunk.navigation.edges?.length ?? -1) !== legacyChunk.navigation.links.length) errors.push(`${legacyChunk.id} navigation edges drifted`);
    for (const legacyCollider of legacyChunk.colliders) {
      const adaptedCollider = adaptedChunk.colliders.find(({ id }) => id === legacyCollider.id);
      if (!adaptedCollider || adaptedCollider.instanceId !== legacyCollider.instanceId || adaptedCollider.shape !== legacyCollider.shape || JSON.stringify(adaptedCollider.transform) !== JSON.stringify(at(legacyCollider.center)) || adaptedCollider.walkable !== legacyCollider.walkable || adaptedCollider.phaseMask !== phaseMask(legacyCollider.phaseIds)) errors.push(`${legacyCollider.id} identity, geometry, or phase mask drifted`);
      else if (legacyCollider.shape === "box" && (adaptedCollider.shape !== "box" || JSON.stringify(adaptedCollider.size) !== JSON.stringify(legacyCollider.size))) errors.push(`${legacyCollider.id} box dimensions drifted`);
      else if (legacyCollider.shape === "cylinder" && (adaptedCollider.shape !== "cylinder" || adaptedCollider.radius !== legacyCollider.radius || adaptedCollider.height !== legacyCollider.height)) errors.push(`${legacyCollider.id} cylinder dimensions drifted`);
    }
    for (const legacyAnchor of [...legacyChunk.interactionAnchors, ...legacyChunk.spawnAnchors]) {
      const adaptedAnchor = [...adaptedChunk.interactionAnchors, ...adaptedChunk.spawnAnchors].find(({ id }) => id === legacyAnchor.id);
      if (!adaptedAnchor || JSON.stringify(adaptedAnchor.transform) !== JSON.stringify(transform(legacyAnchor.transform)) || adaptedAnchor.phaseMask !== phaseMask(legacyAnchor.phaseIds)) errors.push(`${legacyAnchor.id} semantic anchor or phase mask drifted`);
    }
  }
  const packById = new Map(SABLE_REACH_BRIDGE_PACK_PLANS.map((pack) => [pack.id, pack]));
  const siteById = new Map(SABLE_REACH_ATLAS.sites.map((site) => [site.id, site]));
  for (const scene of scenes) {
    const pack = packById.get(scene.packId);
    const site = siteById.get(scene.siteId);
    if (!pack || pack.siteId !== scene.siteId) errors.push(`${scene.id} does not resolve its active site pack`);
    if (!site || !site.territoryId.startsWith("territory.")) errors.push(`${scene.id} does not resolve a valid atlas site/territory`);
    const available = new Set(pack?.assetIds ?? []);
    for (const instance of scene.chunks.flatMap(({ instances }) => instances).filter(({ assetId }) => assetId.startsWith("bridge.asset."))) if (!available.has(instance.assetId)) errors.push(`${instance.id} is absent from ${scene.packId}`);
  }
  for (const scene of scenes.filter(({ siteId }) => siteId !== "site.hearthmere")) {
    const instances = scene.chunks.flatMap(({ instances }) => instances);
    if (instances.length < 60 || instances.length > 120) errors.push(`${scene.siteId} must contain 60-120 deterministic instances`);
    const groups = new Set(instances.map(({ instanceGroupId }) => instanceGroupId));
    if (groups.size !== 12 || instances.some(({ instanceGroupId }) => instanceGroupId === null)) errors.push(`${scene.siteId} must group repeated meshes by all 12 assets`);
    if (!siteGeographyIsDistinct(scene)) errors.push(`${scene.siteId} does not satisfy its authored geographic composition`);
    for (const chunk of scene.chunks) {
      const instanceIds = new Set(chunk.instances.map(({ id }) => id));
      if (chunk.colliders.length !== chunk.instances.length) errors.push(`${chunk.id} must dimension every manifest-driven derivative placement`);
      for (const collider of chunk.colliders) {
        if (!instanceIds.has(collider.instanceId)) errors.push(`${collider.id} does not bind a scene instance`);
        if (!colliderHasDimensions(collider)) errors.push(`${collider.id} has unusable dimensions`);
      }
      const nodes = chunk.navigation.nodes ?? [];
      const edges = chunk.navigation.edges ?? [];
      if (nodes.length < 6 || edges.length < nodes.length - 1 || !connectedNavigation(nodes.map(({ id }) => id), edges)) errors.push(`${chunk.id} requires a connected local navigation graph`);
      if (nodes.some(({ transform: node }) => node.x < chunk.bounds.min.x || node.x > chunk.bounds.max.x || node.z < chunk.bounds.min.z || node.z > chunk.bounds.max.z)) errors.push(`${chunk.id} navigation escapes chunk bounds`);
      const nodeById = new Map(nodes.map((node) => [node.id, node]));
      for (const edge of edges) {
        const start = nodeById.get(edge.fromNodeId)?.transform;
        const end = nodeById.get(edge.toNodeId)?.transform;
        if (start && end && chunk.colliders.some((collider) => navigationSegmentHitsCollider(start, end, collider))) errors.push(`${edge.id} crosses a non-walkable collider`);
      }
      const landmarkAnchor = chunk.interactionAnchors.find(({ id }) => id === `landmark.${siteSlug(scene.siteId)}.proof`);
      const landmarkInstance = chunk.instances.find(({ id }) => id === landmarkAnchor?.instanceId);
      if (!landmarkAnchor?.instanceId || !landmarkInstance || JSON.stringify(landmarkAnchor.transform) !== JSON.stringify(landmarkInstance.transform)) errors.push(`${chunk.id} landmark anchor is not bound to its placed landmark instance`);
    }
  }
  const layoutSignatures = scenes.filter(({ siteId }) => siteId !== "site.hearthmere").map((scene) => scene.chunks.flatMap(({ instances }) => instances).map(({ transform: point }) => `${point.x.toFixed(3)},${point.y.toFixed(3)},${point.z.toFixed(3)}`).join("|"));
  if (new Set(layoutSignatures).size !== 6) errors.push("Proof sites reuse a placement lattice instead of site-authored geography");
  return Object.freeze(errors);
}
