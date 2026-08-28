import {
  HEARTHMERE_RUNTIME_PROJECTION,
  type RuntimeActorSpawn,
  type RuntimeInteractableSpawn,
} from "@hearthmere/content/runtime";
import type { WorldTransform } from "@hollow-march/shared";

export interface CanonicalHearthmereAnchor {
  id: string;
  contentId: string;
  kind: string;
  phaseIds: readonly string[];
  transform: WorldTransform;
  radiusMeters: number;
}

const transformFromProjection = (source: RuntimeActorSpawn["transform"] | RuntimeInteractableSpawn["transform"]): WorldTransform => ({
  x: source.position[0],
  y: source.position[1],
  z: source.position[2],
  yaw: source.rotation[1],
});

const actorAnchor = (spawn: RuntimeActorSpawn): CanonicalHearthmereAnchor => Object.freeze({
  id: spawn.spawnId,
  contentId: spawn.contentId,
  kind: spawn.kind,
  phaseIds: spawn.phaseIds,
  transform: Object.freeze(transformFromProjection(spawn.transform)),
  radiusMeters: spawn.radiusMeters,
});

const interactableAnchor = (spawn: RuntimeInteractableSpawn): CanonicalHearthmereAnchor => Object.freeze({
  id: spawn.spawnId,
  contentId: spawn.contentId,
  kind: spawn.kind,
  phaseIds: spawn.phaseIds,
  transform: Object.freeze(transformFromProjection(spawn.transform)),
  radiusMeters: spawn.radiusMeters,
});

const playerAnchor = actorAnchor(HEARTHMERE_RUNTIME_PROJECTION.actors.player);
const npcAnchors = HEARTHMERE_RUNTIME_PROJECTION.actors.npcs.map(actorAnchor);
const enemyAnchors = HEARTHMERE_RUNTIME_PROJECTION.actors.enemies.map(actorAnchor);
const interactableAnchors = HEARTHMERE_RUNTIME_PROJECTION.interactables.map(interactableAnchor);
const anchors = [playerAnchor, ...npcAnchors, ...enemyAnchors, ...interactableAnchors];
const anchorEntries = anchors.map((anchor) => [anchor.id, anchor] as const);

if (new Set(anchorEntries.map(([id]) => id)).size !== anchorEntries.length) {
  throw new Error("Hearthmere runtime projection contains duplicate anchor IDs");
}

export const HEARTHMERE_ANCHOR_BY_ID: ReadonlyMap<string, CanonicalHearthmereAnchor> = new Map(anchorEntries);
export const HEARTHMERE_BOUNDS = HEARTHMERE_RUNTIME_PROJECTION.bounds;

export function canonicalAnchor(id: string): CanonicalHearthmereAnchor {
  const anchor = HEARTHMERE_ANCHOR_BY_ID.get(id);
  if (!anchor) throw new Error(`Hearthmere runtime projection is missing required anchor ${id}`);
  return anchor;
}

export function canonicalAnchorTransform(id: string): WorldTransform {
  return { ...canonicalAnchor(id).transform };
}

export function canonicalAnchorsByKind(kind: string): CanonicalHearthmereAnchor[] {
  return anchors.filter((anchor) => anchor.kind === kind && anchor.phaseIds.includes("public"));
}

export function canonicalEnemySpawns(): CanonicalHearthmereAnchor[] {
  return enemyAnchors.filter((anchor) => anchor.phaseIds.includes("public"));
}

export function canonicalPublicInteractionAnchors(): CanonicalHearthmereAnchor[] {
  return [...npcAnchors, ...interactableAnchors].filter((anchor) => anchor.phaseIds.includes("public"));
}

for (const requiredId of ["player.start", "npc.maela-voss", "npc.torren-vale", "npc.ysra-pell", "enemy.ash-husk", "enemy.ledger-crawler"]) {
  canonicalAnchor(requiredId);
}
