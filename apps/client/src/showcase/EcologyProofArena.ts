import * as THREE from "three";
import {
  NETWORK_PROTOCOL_VERSION,
  type CanonicalReactionReservation,
  type CanonicalTurnAction,
  type SceneChunkManifestV2,
  type TurnKernelActorV1,
} from "@hollow-march/shared";
import type { AssetResidencyManager } from "../world/AssetResidencyManager.js";
import type { BridgeSiteSceneController } from "./BridgeSiteScene.js";
import type { EcologyProofRuntimeEntry } from "./EcologyProof.js";
import { resolveOfflineCanvasTurn } from "../turn/OfflineCanvasTurnRuntime.js";

export interface EcologyProofArenaController { destroy(): void }

interface ArenaState {
  playerHealth: number;
  enemyHealth: number;
  enemyMaximum: number;
  playerStamina: number;
  playerFocus: number;
  enemyStamina: number;
  round: number;
  eventSequence: number;
  plannedAction: "move" | "light_attack" | "heavy_attack" | "hold";
  reaction: "none" | "dodge" | "guard";
  defeated: boolean;
}

const BUTTON_STYLE = "padding:.55rem .75rem;border:1px solid rgba(205,184,132,.4);background:#151b1c;color:#e4dcc7;font:600 .72rem system-ui;cursor:pointer";
let bridgeResidencyManager: AssetResidencyManager | null = null;
const publishBridgeResidency = () => {
  (globalThis as typeof globalThis & { __SABLE_REACH_BRIDGE__?: unknown }).__SABLE_REACH_BRIDGE__ = bridgeResidencyManager?.getStats() ?? null;
};

function combinedSiteChunk(chunks: readonly SceneChunkManifestV2[], siteId: string, packId: string): SceneChunkManifestV2 {
  const first = chunks[0];
  if (!first) throw new Error(`Bridge scene ${siteId} has no chunks`);
  return Object.freeze({
    ...first,
    id: `bridge.chunk.${siteId.slice("site.".length)}.combined-proof`,
    assetPackIds: Object.freeze([packId]),
    instances: Object.freeze(chunks.flatMap(({ instances }) => instances)),
    colliders: Object.freeze(chunks.flatMap(({ colliders }) => colliders)),
    navigation: Object.freeze({
      graphId: `nav.graph.${siteId.slice("site.".length)}.combined-proof`,
      hash: first.navigation.hash,
      links: Object.freeze(chunks.flatMap(({ navigation }) => navigation.links)),
      nodes: Object.freeze(chunks.flatMap(({ navigation }) => navigation.nodes)),
      edges: Object.freeze(chunks.flatMap(({ navigation }) => navigation.edges)),
    }),
    occluders: Object.freeze(chunks.flatMap(({ occluders }) => occluders)),
    lights: Object.freeze(chunks.flatMap(({ lights }) => lights)),
    volumes: Object.freeze(chunks.flatMap(({ volumes }) => volumes)),
    interactionAnchors: Object.freeze(chunks.flatMap(({ interactionAnchors }) => interactionAnchors)),
    spawnAnchors: Object.freeze(chunks.flatMap(({ spawnAnchors }) => spawnAnchors)),
  });
}

async function loadBridgeEnvironment(siteId: string, signal: AbortSignal): Promise<BridgeSiteSceneController> {
  const [managerModule, packLoader, sceneRenderer, runtimeContent, sceneContent] = await Promise.all([
    import("../world/AssetResidencyManager.js"),
    import("../world/RuntimePackLoader.js"),
    import("./BridgeSiteScene.js"),
    import("@hearthmere/content/bridge-runtime"),
    import("@hearthmere/content/site-scenes"),
  ]);
  bridgeResidencyManager ??= new managerModule.AssetResidencyManager({ profile: new URLSearchParams(location.search).get("quality") === "integrated" ? "integrated" : "discrete" });
  const pack = await packLoader.loadRuntimePackForSite(async () => runtimeContent, siteId);
  const siteScene = sceneContent.SABLE_REACH_PROOF_SITE_SCENES.find((candidate) => candidate.siteId === siteId);
  if (!siteScene) throw new Error(`No bridge proof scene resolves ${siteId}`);
  return sceneRenderer.createBridgeSiteScene(bridgeResidencyManager, pack, combinedSiteChunk(siteScene.chunks, siteId, pack.id), { signal });
}

const LOCATION_RECIPES: Readonly<Record<string, { floor: string; accent: string; prop: "terrace" | "coast" | "mire" | "cairns" | "abbey" | "salt" | "cinder" }>> = Object.freeze({
  "site.hearthmere": { floor: "#202725", accent: "#8ba79a", prop: "terrace" },
  "site.gloamharbor": { floor: "#11191b", accent: "#627f86", prop: "coast" },
  "site.warden-reed": { floor: "#18201b", accent: "#71804c", prop: "mire" },
  "site.cairnmarket": { floor: "#292722", accent: "#8d826c", prop: "cairns" },
  "site.hollow-abbey": { floor: "#252623", accent: "#aaa68e", prop: "abbey" },
  "site.salt-watch": { floor: "#49473f", accent: "#d4cfae", prop: "salt" },
  "site.ember-gate": { floor: "#211b19", accent: "#bd5e35", prop: "cinder" },
});

function createEcologyProofLocation(siteId: string) {
  const recipe = LOCATION_RECIPES[siteId] ?? LOCATION_RECIPES["site.hearthmere"]!;
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: recipe.floor, roughness: 0.95 });
  const accent = new THREE.MeshStandardMaterial({ color: recipe.accent, roughness: 0.72, emissive: recipe.prop === "cinder" ? recipe.accent : "#000000", emissiveIntensity: recipe.prop === "cinder" ? 0.45 : 0 });
  const place = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, ry = 0) => { const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); mesh.rotation.y = ry; group.add(mesh); };
  if (recipe.prop === "terrace") for (let index = -2; index <= 2; index += 1) place(new THREE.BoxGeometry(0.7, 0.15, 0.38), stone, index * 0.72, 0.08, -1.15 + Math.abs(index) * 0.08, index * 0.12);
  if (recipe.prop === "coast") { place(new THREE.CylinderGeometry(0.75, 1.05, 0.7, 6), stone, -1.8, 0.25, -0.7, 0.2); place(new THREE.CylinderGeometry(0.45, 0.8, 1.1, 5), stone, 1.9, 0.4, -0.9, -0.4); }
  if (recipe.prop === "mire") for (let index = 0; index < 11; index += 1) place(new THREE.CylinderGeometry(0.025, 0.04, 0.65 + index % 3 * 0.16, 5), accent, -2.5 + index * 0.5, 0.34, -1.25 + (index % 2) * 0.28, index * 0.4);
  if (recipe.prop === "cairns") for (let cairn = -2; cairn <= 2; cairn += 1) for (let layer = 0; layer < 3; layer += 1) place(new THREE.BoxGeometry(0.48 - layer * 0.08, 0.2, 0.34 - layer * 0.05), stone, cairn * 1.1, 0.1 + layer * 0.2, -1.2, cairn * 0.23 + layer * 0.4);
  if (recipe.prop === "abbey") { place(new THREE.BoxGeometry(0.35, 2.1, 0.4), stone, -1.7, 1.05, -1.25); place(new THREE.BoxGeometry(0.35, 2.1, 0.4), stone, 1.7, 1.05, -1.25); place(new THREE.BoxGeometry(3.7, 0.32, 0.4), stone, 0, 2, -1.25); }
  if (recipe.prop === "salt") for (let index = -3; index <= 3; index += 1) place(new THREE.ConeGeometry(0.18 + Math.abs(index) * 0.025, 0.8 + (index & 1) * 0.5, 5), accent, index * 0.72, 0.4, -1.25 + Math.abs(index) * 0.08, index * 0.5);
  if (recipe.prop === "cinder") for (let index = -2; index <= 2; index += 1) { place(new THREE.BoxGeometry(0.42, 1.2 + (index & 1) * 0.6, 0.42), stone, index * 1.05, 0.6, -1.3, index * 0.18); place(new THREE.SphereGeometry(0.09, 8, 6), accent, index * 1.05, 1.32 + (index & 1) * 0.6, -1.3); }
  return { group, floorColor: recipe.floor, dispose() { group.traverse((object) => { if (object instanceof THREE.Mesh) object.geometry.dispose(); }); stone.dispose(); accent.dispose(); } };
}

/** A local Canvas/Three.js proof driven only by the shared deterministic kernel. */
export function mountEcologyProofArena(host: HTMLElement, entry: EcologyProofRuntimeEntry, dropLabels: readonly string[]): EcologyProofArenaController {
  host.replaceChildren();
  const shell = document.createElement("section");
  shell.setAttribute("aria-label", `${entry.familyId.replaceAll("_", " ")} prototype encounter`);
  shell.style.cssText = "display:grid;grid-template-columns:minmax(18rem,1fr) minmax(15rem,.65fr);gap:.8rem;margin-top:.8rem;padding:.8rem;border:1px solid rgba(216,208,189,.18);background:#080c0d;color:#d8d0bd";
  const canvas = document.createElement("canvas");
  canvas.width = 640; canvas.height = 360; canvas.style.cssText = "display:block;width:100%;min-height:18rem;background:radial-gradient(circle at 50% 45%,#26302d,#080b0c 70%)";
  canvas.setAttribute("aria-label", `${entry.familyId.replaceAll("_", " ")} prototype creature view`);
  const panel = document.createElement("div"); panel.style.cssText = "display:grid;align-content:start;gap:.65rem";
  const eyebrow = document.createElement("p"); eyebrow.textContent = `${entry.siteId.replaceAll(".", " ")} · prototype asset`; eyebrow.style.cssText = "margin:0;color:#b99552;font:600 .68rem system-ui;letter-spacing:.1em;text-transform:uppercase";
  const title = document.createElement("h3"); title.textContent = entry.familyId.replaceAll("_", " "); title.style.cssText = "margin:0;font:500 1.35rem Georgia,serif;text-transform:capitalize";
  const health = document.createElement("p"); health.style.cssText = "margin:0;font:.8rem system-ui";
  const telegraph = document.createElement("p"); telegraph.setAttribute("role", "status"); telegraph.setAttribute("aria-live", "assertive"); telegraph.style.cssText = "min-height:5rem;margin:0;padding:.65rem;border-left:3px solid #8b4e43;background:#111718;font:.82rem/1.45 Georgia,serif";
  const controls = document.createElement("div"); controls.style.cssText = "display:flex;flex-wrap:wrap;gap:.45rem";
  const move = document.createElement("button"); move.type = "button"; move.textContent = "M · Plan move"; move.style.cssText = BUTTON_STYLE;
  const light = document.createElement("button"); light.type = "button"; light.textContent = "1 · Plan light"; light.style.cssText = BUTTON_STYLE;
  const heavy = document.createElement("button"); heavy.type = "button"; heavy.textContent = "2 · Plan heavy"; heavy.style.cssText = BUTTON_STYLE;
  const dodge = document.createElement("button"); dodge.type = "button"; dodge.textContent = "D · Reserve dodge"; dodge.style.cssText = BUTTON_STYLE;
  const guard = document.createElement("button"); guard.type = "button"; guard.textContent = "G · Reserve guard"; guard.style.cssText = BUTTON_STYLE;
  const commit = document.createElement("button"); commit.type = "button"; commit.textContent = "Enter · Resolve round"; commit.style.cssText = BUTTON_STYLE;
  const reset = document.createElement("button"); reset.type = "button"; reset.textContent = "Reset proof"; reset.style.cssText = BUTTON_STYLE; reset.hidden = true;
  controls.append(move, light, heavy, dodge, guard, commit, reset);
  const counter = document.createElement("p"); counter.style.cssText = "margin:0;color:#aeb5ad;font:.77rem/1.4 system-ui"; counter.textContent = `Counterplay: ${entry.telegraphs[0]!.counterplay}`;
  const evidence = document.createElement("small"); evidence.style.cssText = "color:#7f8a84;font:.68rem/1.4 system-ui"; evidence.textContent = `Offline local proof using the shared deterministic turn kernel for handler ${entry.mechanicHandlerId} · sharedRewardsEnabled=false · durableSettlementEnabled=false · navigation ${entry.navigationCell.id} is active · production model and playtest not claimed.`;
  panel.append(eyebrow, title, health, telegraph, controls, counter, evidence); shell.append(canvas, panel); host.append(shell);

  let renderer: THREE.WebGLRenderer | null = null;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch { canvas.replaceWith(Object.assign(document.createElement("p"), { textContent: "WebGL unavailable. Combat proof remains playable through the accessible controls and telegraphs." })); }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 50); camera.position.set(0, 1.7, 5.6); camera.lookAt(0, 1, 0);
  scene.add(new THREE.HemisphereLight("#a8b9b2", "#141819", 2.4));
  const key = new THREE.DirectionalLight("#e1d4b8", 3); key.position.set(3, 6, 4); scene.add(key);
  const locationProof = createEcologyProofLocation(entry.siteId); scene.add(locationProof.group);
  const bridgeAbort = new AbortController();
  let bridgeSite: BridgeSiteSceneController | null = null;
  void loadBridgeEnvironment(entry.siteId, bridgeAbort.signal).then((controller) => {
    if (bridgeAbort.signal.aborted) { controller.destroy(); return; }
    bridgeSite = controller;
    const siteSpan = entry.siteId === "site.hearthmere" ? 96 : 192;
    controller.group.scale.setScalar(4.8 / siteSpan);
    controller.group.position.set(-2.4, 0.01, -2.1);
    scene.add(controller.group);
    scene.remove(locationProof.group);
    locationProof.dispose();
    const bridgePlayerSpawn = controller.worldSpawn("player");
    if (bridgePlayerSpawn) playerMarker.position.set(bridgePlayerSpawn.x, playerMarker.position.y, bridgePlayerSpawn.z);
    const bridgeEnemySpawn = controller.worldSpawn("enemy");
    if (bridgeEnemySpawn) rig.position.set(bridgeEnemySpawn.x, rig.position.y, bridgeEnemySpawn.z);
    evidence.textContent = `${evidence.textContent} Active pack ${controller.lease.packId}: ${controller.instanceCount} manifest placements, ${controller.colliderCount} physical colliders, and ${controller.navigationNodeCount} local navigation nodes/${controller.navigationEdgeCount} traversable edges batched into ${controller.drawObjectCount} draw objects.`;
    publishBridgeResidency();
  }).catch((error) => {
    if (!bridgeAbort.signal.aborted) evidence.textContent = `${evidence.textContent} Bridge pack unavailable; accessible combat remains active (${error instanceof Error ? error.message : "unknown error"}).`;
  });
  const enemySpawn = entry.navigationCell.spawnAnchors.enemy;
  const playerSpawn = entry.navigationCell.spawnAnchors.player;
  const rig = entry.createPrototype({ seed: 41 }); rig.position.set(enemySpawn[0], enemySpawn[1], enemySpawn[2]); scene.add(rig);
  const bounds = entry.navigationCell.bounds;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ), new THREE.MeshStandardMaterial({ color: locationProof.floorColor, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set((bounds.minX + bounds.maxX) / 2, 0, (bounds.minZ + bounds.maxZ) / 2); scene.add(floor);
  const playerMaterial = new THREE.MeshStandardMaterial({ color: "#d8ccb1", roughness: 0.7, emissive: "#38453e", emissiveIntensity: 0.35 });
  const playerMarker = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.38, 5, 10), playerMaterial);
  playerMarker.position.set(playerSpawn[0], 0.38, playerSpawn[2]); scene.add(playerMarker);
  const colliderMaterial = new THREE.MeshStandardMaterial({ color: "#303735", roughness: 1, transparent: true, opacity: 0.72 });
  const colliderMeshes = entry.navigationCell.colliders.map((collider) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(collider.size[0], 0.36, collider.size[1]), colliderMaterial);
    mesh.position.set(collider.center[0], 0.18, collider.center[1]); scene.add(mesh); return mesh;
  });
  const navigationNodeById = new Map(entry.navigationCell.nodes.map((node) => [node.id, node]));
  const navigationLineGeometry = new THREE.BufferGeometry().setFromPoints(entry.navigationCell.links.flatMap((link) => {
    const from = navigationNodeById.get(link.from)!; const to = navigationNodeById.get(link.to)!;
    return [new THREE.Vector3(from.x, 0.025, from.z), new THREE.Vector3(to.x, 0.025, to.z)];
  }));
  const navigationLineMaterial = new THREE.LineBasicMaterial({ color: "#6f8c7e", transparent: true, opacity: 0.28 });
  const navigationLines = new THREE.LineSegments(navigationLineGeometry, navigationLineMaterial); scene.add(navigationLines);
  renderer?.setSize(640, 360, false); renderer?.setPixelRatio(1);

  const state: ArenaState = { playerHealth: 100, enemyHealth: 100, enemyMaximum: 100, playerStamina: 100, playerFocus: 50, enemyStamina: 100, round: 1, eventSequence: 0, plannedAction: "light_attack", reaction: "none", defeated: false };
  let frame = 0; let disposed = false; let last = performance.now();
  const cue = entry.telegraphs[0]!;

  const announceIdle = () => { telegraph.textContent = `Round ${state.round} planning · ${state.plannedAction.replaceAll("_", " ")} · ${state.reaction} reaction. Enemy intent: standard band, 14–16 damage. Visual cue: ${cue.visual}. Nonvisual cue: ${cue.nonvisual}.`; };
  const updateHealth = () => { health.textContent = `Pilgrim ${state.playerHealth}/100 · stamina ${state.playerStamina}/100 · focus ${state.playerFocus}/50 · ${entry.creatureId.replaceAll("_", " ")} ${state.enemyHealth}/${state.enemyMaximum}`; };
  const resetState = () => {
    Object.assign(state, { playerHealth: 100, enemyHealth: 100, playerStamina: 100, playerFocus: 50, enemyStamina: 100, round: 1, eventSequence: 0, plannedAction: "light_attack", reaction: "none", defeated: false });
    playerMarker.position.set(playerSpawn[0], .38, playerSpawn[2]); rig.position.set(enemySpawn[0], enemySpawn[1], enemySpawn[2]);
    rig.visible = true; rig.setTelegraph(0); reset.hidden = true; announceIdle(); updateHealth();
  };
  const hold = (actorId: string, beat: 0 | 1): CanonicalTurnAction => ({ actionId: `${actorId}.hold.${state.round}.${beat}`, definitionId: "action.hold", kind: "hold", beat, band: "aftermath", apCost: 0, staminaCost: 0, focusCost: 0, posthumous: false, reactionTrigger: "none", targetRelation: "self" });
  const playerPlan = (): readonly CanonicalTurnAction[] => {
    const common = { actionId: `player.${state.plannedAction}.${state.round}`, definitionId: `action.${state.plannedAction}`, beat: 0 as const, posthumous: false };
    if (state.plannedAction === "heavy_attack") return [{ ...common, kind: "heavy_attack", band: "heavy", apCost: 2, staminaCost: 28, focusCost: 0, targetActorId: "enemy", rangeMm: 5_000, damage: 18, hitChancePermille: 1_000, interrupts: true, reactionTrigger: "hostile_targeted", targetRelation: "hostile", occupiesBothBeats: true }];
    if (state.plannedAction === "light_attack") return [{ ...common, kind: "light_attack", band: "standard", apCost: 1, staminaCost: 14, focusCost: 0, targetActorId: "enemy", rangeMm: 5_000, damage: 9, hitChancePermille: 1_000, interrupts: false, reactionTrigger: "hostile_targeted", targetRelation: "hostile" }, hold("player", 1)];
    if (state.plannedAction === "move") {
      const toEnemy = new THREE.Vector2(rig.position.x - playerMarker.position.x, rig.position.z - playerMarker.position.z); if (toEnemy.lengthSq() > 0) toEnemy.setLength(Math.min(4, toEnemy.length()));
      return [{ ...common, kind: "move", band: "movement", apCost: 1, staminaCost: 8, focusCost: 0, destinationMm: { x: Math.round((playerMarker.position.x + toEnemy.x) * 1_000), y: 0, z: Math.round((playerMarker.position.z + toEnemy.y) * 1_000) }, destinationYawTenThousandthRadians: 0, reactionTrigger: "none", targetRelation: "self" }, hold("player", 1)];
    }
    return [hold("player", 0), hold("player", 1)];
  };
  const playerReaction = (): CanonicalReactionReservation | null => {
    if (state.reaction === "guard") return { reactionId: `player.guard.${state.round}`, definitionId: "reaction.guard", kind: "guard", staminaReserved: 8, mitigationPermille: 500 };
    if (state.reaction === "dodge") {
      const away = new THREE.Vector2(playerMarker.position.x - rig.position.x, playerMarker.position.z - rig.position.z); if (away.lengthSq() === 0) away.set(0, 1); away.setLength(3);
      return { reactionId: `player.dodge.${state.round}`, definitionId: "reaction.dodge", kind: "dodge", staminaReserved: 24, destinationMm: { x: Math.round((playerMarker.position.x + away.x) * 1_000), y: 0, z: Math.round((playerMarker.position.z + away.y) * 1_000) }, destinationYawTenThousandthRadians: 0 };
    }
    return null;
  };
  const resolveRound = () => {
    if (state.defeated || state.playerHealth <= 0) return;
    const enemyPlan: readonly CanonicalTurnAction[] = state.enemyStamina >= 14 ? [{ actionId: `enemy.attack.${state.round}`, definitionId: `creature.${entry.mechanicHandlerId}`, kind: "light_attack", beat: 0, band: "standard", apCost: 1, staminaCost: 14, focusCost: 0, posthumous: false, targetActorId: "player", rangeMm: 6_000, damage: 16, hitChancePermille: 1_000, interrupts: false, reactionTrigger: "hostile_targeted", targetRelation: "hostile" }, hold("enemy", 1)] : [{ actionId: `enemy.recover.${state.round}`, definitionId: "action.recover", kind: "recover", beat: 0, band: "aftermath", apCost: 1, staminaCost: 0, focusCost: 0, posthumous: false, reactionTrigger: "none", targetRelation: "self" }, hold("enemy", 1)];
    const actors: readonly TurnKernelActorV1[] = [
      { actorId: "player", team: "players", initiative: 12, positionMm: { x: Math.round(playerMarker.position.x * 1_000), y: 0, z: Math.round(playerMarker.position.z * 1_000) }, yawTenThousandthRadians: 0, health: state.playerHealth, maxHealth: 100, stamina: state.playerStamina, maxStamina: 100, focus: state.playerFocus, maxFocus: 50, plan: playerPlan(), reaction: playerReaction() },
      { actorId: "enemy", team: "enemies", initiative: 8, positionMm: { x: Math.round(rig.position.x * 1_000), y: 0, z: Math.round(rig.position.z * 1_000) }, yawTenThousandthRadians: 0, health: state.enemyHealth, maxHealth: state.enemyMaximum, stamina: state.enemyStamina, maxStamina: 100, focus: 1, maxFocus: 1, plan: enemyPlan, reaction: null },
    ];
    const offline = resolveOfflineCanvasTurn({
      protocolVersion: NETWORK_PROTOCOL_VERSION, encounterId: entry.encounterId, leaseGeneration: 1, round: state.round, serverSeed: `local.${entry.encounterId}`, eventSequenceStart: state.eventSequence, actors,
      authority: {
        canTraverse: ({ toMm }) => {
          const x = toMm.x / 1_000, z = toMm.z / 1_000, margin = .2;
          const candidate = new THREE.Vector3(x, .38, z);
          return x >= bounds.minX + margin && x <= bounds.maxX - margin && z >= bounds.minZ + margin && z <= bounds.maxZ - margin
            && !entry.navigationCell.colliders.some((collider) => Math.abs(x - collider.center[0]) <= collider.size[0] / 2 + margin && Math.abs(z - collider.center[1]) <= collider.size[1] / 2 + margin)
            && !(bridgeSite?.isWorldPointBlocked(candidate, margin, 1) ?? false)
            && (bridgeSite?.isWorldPointNavigable(candidate, .42) ?? true);
        },
        hasLineOfSight: () => true,
        resolveEffect: () => ({ resolved: false, reason: "no_local_effect_handler", operations: [] }),
      },
    });
    const player = offline.result.actors.find(({ actorId }) => actorId === "player")!; const enemy = offline.result.actors.find(({ actorId }) => actorId === "enemy")!;
    state.playerHealth = player.health; state.playerStamina = player.stamina; state.playerFocus = player.focus; state.enemyHealth = enemy.health; state.enemyStamina = enemy.stamina; state.eventSequence = offline.result.latestEventSequence + 1; state.round += 1;
    playerMarker.position.set(player.positionMm.x / 1_000, .38, player.positionMm.z / 1_000); rig.position.set(enemy.positionMm.x / 1_000, rig.position.y, enemy.positionMm.z / 1_000);
    state.defeated = offline.result.outcome !== "ongoing"; rig.visible = enemy.health > 0; reset.hidden = !state.defeated;
    const summary = offline.result.events.slice(-4).map((event) => event.type.replaceAll("_", " ")).join(" · ");
    telegraph.textContent = state.defeated ? `${offline.result.outcome.replaceAll("_", " ")}. Potential drop preview: ${dropLabels.join(", ")}. No reward or durable settlement was written.` : `Round resolved: ${summary}. ${cue.counterplay}`;
    updateHealth();
  };
  const selectAction = (action: ArenaState["plannedAction"]) => { state.plannedAction = action; announceIdle(); };
  const selectReaction = (reaction: ArenaState["reaction"]) => { state.reaction = state.reaction === reaction ? "none" : reaction; announceIdle(); };
  move.addEventListener("click", () => selectAction("move")); light.addEventListener("click", () => selectAction("light_attack")); heavy.addEventListener("click", () => selectAction("heavy_attack")); dodge.addEventListener("click", () => selectReaction("dodge")); guard.addEventListener("click", () => selectReaction("guard")); commit.addEventListener("click", resolveRound); reset.addEventListener("click", resetState);
  const onKey = (event: KeyboardEvent) => {
    if (!host.isConnected) return;
    if (event.key === "1") selectAction("light_attack");
    if (event.key === "2") selectAction("heavy_attack");
    if (event.key.toLowerCase() === "m") selectAction("move");
    if (event.key.toLowerCase() === "d") selectReaction("dodge");
    if (event.key.toLowerCase() === "g") selectReaction("guard");
    if (event.key === "Enter") { event.preventDefault(); resolveRound(); }
  };
  addEventListener("keydown", onKey);

  const tick = (now: number) => {
    if (disposed) return;
    const delta = Math.min(0.05, (now - last) / 1000); last = now;
    rig.update(delta, now / 1000); rig.rotation.y = Math.sin(now / 3000) * 0.28;
    renderer?.render(scene, camera); frame = requestAnimationFrame(tick);
  };
  announceIdle(); updateHealth(); frame = requestAnimationFrame(tick);

  return { destroy() { disposed = true; bridgeAbort.abort(); bridgeSite?.destroy(); publishBridgeResidency(); cancelAnimationFrame(frame); removeEventListener("keydown", onKey); rig.dispose(); if (locationProof.group.parent) locationProof.dispose(); floor.geometry.dispose(); (floor.material as THREE.Material).dispose(); playerMarker.geometry.dispose(); playerMaterial.dispose(); for (const mesh of colliderMeshes) mesh.geometry.dispose(); colliderMaterial.dispose(); navigationLineGeometry.dispose(); navigationLineMaterial.dispose(); renderer?.dispose(); host.replaceChildren(); } };
}
