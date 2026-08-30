import { SKILLS, RECIPES, xpForLevel, levelFromXp, xpRewardForAction } from "./data/skills.js";
import { WORLD, MAP_ROWS, GATHER_NODES, regionAtPosition } from "./data/world.js";
import { QUESTS } from "./data/quests.js";
import { BODY_OPTIONS, ORIGINS, VOWS, ATTRIBUTES, DEFAULT_CHARACTER, APPEARANCE_PALETTES, validateCharacter, characterSilhouette } from "./data/character.js";
import { WORLD_CONCEPT_ASSETS, REGION_ASSET_KITS } from "./data/worldAssets.js";
import { SKILL_TREES, SKILL_ACTIONS, CROSS_SKILL_SYNERGIES, MASTERY_TRIALS } from "./data/skillTrees.js";
import { ENEMY_FAMILIES } from "./data/bestiary.js";
import { FACTIONS, CHARACTER_RELATIONSHIPS } from "./data/characters.js";
import { ENEMY_DEFINITIONS, PLACED_CHARACTERS, CHARACTER_DEFINITIONS, getItemDefinition, resolveSkillId } from "./data/registries.js";
import { ENCOUNTER_SPAWNS } from "./data/encounters.js";
import { SAVE_SCHEMA_VERSION, CONTENT_REVISION, createProgressionState, createWorldEvents, createEnemyState, migrateSave } from "./core/saveMigrations.js";
import { recordWorldObjective, hydrateQuestFromLedger, canOpenHollowAbbey, canResolveLastBell, lastBellOutcome } from "./core/worldProgression.js";
import { evaluateTechniquePurchase, purchaseTechniqueInState } from "./core/techniqueProgression.js";
import { rollLoot } from "./core/loot.js";
import { awardSkillAction } from "./core/skillActions.js";
import { damageAffinityMultiplier, behaviorPhaseAt, enemyMoveRuntime } from "./core/combat.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clone = (value) => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const SAVE_KEY = "hollow-march-save-v1";
const ATLAS_PROOF_SITES = Object.freeze([
  ["site.hearthmere", "Hearthmere", "Graven March"],
  ["site.gloamharbor", "Gloamharbor", "Veil Coast"],
  ["site.warden-reed", "Warden Reed", "Dunmire"],
  ["site.cairnmarket", "Cairnmarket", "Graven March"],
  ["site.hollow-abbey", "Hollow Abbey", "Hollow Abbey"],
  ["site.salt-watch", "Salt Watch", "Mirror-Salt Waste"],
  ["site.ember-gate", "Ember Gate", "Cinderward"],
]);
const legacyAtlasFallbackMarkup = () => `<figure class="world-atlas-static"><img src="./tools/worldgen/generated/runtime/hillshade.webp" alt="Modeled hillshade of the fictional Sable Reach engineering grid"><figcaption>Modeled terrain reference · veyl_local_grid_v1 · 16,384 × 12,288 meters</figcaption></figure><table class="atlas-fallback-table"><caption>Seven prototype-playable ecology locations</caption><thead><tr><th>Location</th><th>Territory</th><th>Status</th></tr></thead><tbody>${ATLAS_PROOF_SITES.map(([id,name,territory])=>`<tr data-atlas-site="${id}"><th>${name}</th><td>${territory}</td><td>Prototype playable</td></tr>`).join("")}</tbody></table>`;
const ALL_RECIPES = RECIPES;
const ENEMIES = ENEMY_DEFINITIONS;
const NPCS = PLACED_CHARACTERS;
const ORIGIN_ART = Object.freeze({
  gloamfarer: "./assets/characters/gloamfarer-v2.png",
  thorn_poacher: "./assets/characters/gloamfarer-v2.png",
  bell_warden: "./assets/characters/bell-warden-v2-cutout.png",
  cinder_mason: "./assets/characters/bell-warden-v2-cutout.png",
  mire_physicker: "./assets/characters/mire-physicker-v2-cutout.png",
  starved_seer: "./assets/characters/mire-physicker-v2-cutout.png",
  oathless_scion: "./assets/characters/oathless-scion-v2-cutout.png",
  grave_tithe_runner: "./assets/characters/oathless-scion-v2-cutout.png",
});
const originArtPath = (originId) => ORIGIN_ART[originId] || ORIGIN_ART.gloamfarer;
const NPC_ART = Object.freeze({
  maela_voss: ORIGIN_ART.oathless_scion,
  torren_vale: ORIGIN_ART.bell_warden,
  ysra_pell: ORIGIN_ART.mire_physicker,
  orik_senn: ORIGIN_ART.bell_warden,
  gatewarden_nhal: ORIGIN_ART.oathless_scion,
  vellin_the_unwritten: ORIGIN_ART.gloamfarer,
});
const characterSprites = {};
for(const path of new Set(Object.values(ORIGIN_ART))){
  const image=new Image();image.src=path;image.onload=()=>{characterSprites[path]=image;};
}
const REGION_BACKDROP_PATHS = Object.freeze({
  hearthmere: "./assets/world/hearthmere-hold.png",
  graven_march: "./assets/world/graven-march-black-pine-occlusion-basin-v5.png",
  dunmire: "./assets/world/dunmire-causeway.png",
  cinderward: "./assets/world/cinderward-foundry.png",
  hollow_abbey: "./assets/world/hollow-abbey-nave.png",
});
const regionBackdrops = Object.fromEntries(Object.entries(REGION_BACKDROP_PATHS).map(([id,path])=>{const image=new Image();image.src=path;return [id,image];}));

const canvas = $("#world");
const ctx = canvas.getContext("2d");
const portraitCanvas = $("#portrait");
const portraitCtx = portraitCanvas.getContext("2d");
let width = innerWidth;
let height = innerHeight;
let dpr = Math.min(devicePixelRatio || 1, 2);
let lastTime = performance.now();
let animationTime = 0;
let currentPanel = null;
let creatorStep = 0;
let draftCharacter = clone(DEFAULT_CHARACTER);
let pendingAction = null;
let pointer = { x: 0, y: 0, tile: null };
const keys = new Set();
let worldAuthorityBridge = null;

const TILE_W = 82;
const TILE_H = 41;
const camera = { x: 0, y: 0, shake: 0 };

function baseState(character = clone(DEFAULT_CHARACTER)) {
  const vigor = character.attributes.vigor;
  const endurance = character.attributes.endurance;
  const skillXp = Object.fromEntries(SKILLS.map((skill) => [skill.id, 0]));
  const origin = ORIGINS.find((entry) => entry.id === character.origin) || ORIGINS[0];
  Object.entries(origin.skillBonuses || {}).forEach(([id, bonus]) => {
    const skillId = resolveSkillId(id);
    if (skillId && skillId in skillXp) skillXp[skillId] = xpForLevel(Math.max(1, bonus));
  });

  return {
    version: SAVE_SCHEMA_VERSION,
    contentRevision: CONTENT_REVISION,
    character,
    player: {
      x: WORLD.map.startingPosition.x,
      y: WORLD.map.startingPosition.y,
      hp: 78 + vigor * 6,
      maxHp: 78 + vigor * 6,
      stamina: 62 + endurance * 5,
      maxStamina: 62 + endurance * 5,
      focus: 45 + character.attributes.attunement * 5,
      maxFocus: 45 + character.attributes.attunement * 5,
      path: [],
      facing: 1,
      attackCooldown: 0,
      dodgeCooldown: 0,
      invulnerable: 0,
      mend: 3,
      lantern: true,
      afflictions: {},
      sableMarks: 40,
    },
    skills: skillXp,
    progression: createProgressionState(),
    worldEvents: createWorldEvents(),
    inventory: { rust_sword: 1, field_torch: 2, ashleaf: 2, sable_marks: 40 },
    quests: Object.fromEntries(QUESTS.map((quest, index) => [quest.id, {
      status: index === 0 ? "active" : quest.prerequisites.length === 0 ? "available" : "locked",
      progress: quest.objectives.map(() => 0),
    }])),
    trackedQuest: QUESTS[0].id,
    discovered: ["hearthmere_square"],
    gathered: {},
    enemies: createEnemies(),
    playSeconds: 0,
    respawn: { x: WORLD.map.startingPosition.x, y: WORLD.map.startingPosition.y },
  };
}

function createEnemies() {
  return ENCOUNTER_SPAWNS.map(createEnemyState);
}

let game = baseState();

function itemDef(id) {
  return getItemDefinition(id) || { id, name: `Unknown item (${id})`, icon: "?", description: "Corrupted or obsolete save reference.", tier: 0, contentStatus: "diagnostic" };
}

function saveGame() {
  if (worldAuthorityBridge?.isConnected?.()) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(game)); } catch { /* private storage can fail */ }
}

function loadGame() {
  try {
    const stored = JSON.parse(localStorage.getItem(SAVE_KEY));
    const migrated = migrateSave(stored);
    if (!migrated.ok) { console.error("Save migration failed", migrated.errors); return false; }
    game = migrated.save;
    reconcileTechniqueDerivedStats();
    if (migrated.migrated) saveGame();
    return true;
  } catch { return false; }
}

/**
 * Renderer-neutral bridge used by the WebGL migration client. Gameplay remains
 * authoritative here until the Colyseus room assumes ownership of simulation.
 */
export function getWorldClientSnapshot() {
  const hudVisible = !$("#hud").hidden;
  return {
    active: hudVisible && $("#dialogue").hidden && $("#death-screen").hidden && !currentPanel,
    hudVisible,
    character: game.character,
    silhouette: characterSilhouette(game.character),
    player: game.player,
    regionId: regionAt(game.player.x, game.player.y).id,
    npcs: NPCS,
    enemies: game.enemies.map((enemy) => ({
      ...enemy,
      definition: ENEMIES.find((entry) => entry.id === enemy.defId),
    })),
    nodes: GATHER_NODES,
    landmarks: WORLD.landmarks,
    worldEvents: game.worldEvents,
    playSeconds: game.playSeconds,
  };
}

export function requestWorldTravel(worldX, worldZ) {
  if ($("#hud").hidden || !Number.isFinite(worldX) || !Number.isFinite(worldZ)) return false;
  const tile = { x: Math.round(worldX / 4), y: Math.round(worldZ / 4) };
  if (!isWalkable(tile.x, tile.y)) return false;
  game.player.path = findPath(game.player, tile);
  pendingAction = null;
  return game.player.path.length > 0;
}

/**
 * Installs the shared-world command/state bridge. The legacy runtime remains
 * renderer/UI compatibility code, but it stops mutating movement, combat and
 * persistence as soon as the authoritative room is connected.
 */
export function setWorldAuthorityBridge(bridge) {
  worldAuthorityBridge = bridge && typeof bridge === "object" ? bridge : null;
  keys.clear();
}

function authoritativeActor() {
  return worldAuthorityBridge?.isConnected?.() ? worldAuthorityBridge.getLocalActor?.() ?? null : null;
}

function syncAuthoritativeActor(actor) {
  if (!actor?.transform) return false;
  const player = game.player;
  player.x = actor.transform.x / 4;
  player.y = actor.transform.z / 4;
  player.path = [];
  player.hp = Number.isFinite(actor.hp) ? actor.hp : player.hp;
  player.maxHp = Number.isFinite(actor.maxHp) ? actor.maxHp : player.maxHp;
  if (Number.isFinite(actor.stamina)) player.stamina = actor.stamina;
  if (Number.isFinite(actor.maxStamina)) player.maxStamina = actor.maxStamina;
  if (Number.isFinite(actor.focus)) player.focus = actor.focus;
  if (Number.isFinite(actor.maxFocus)) player.maxFocus = actor.maxFocus;
  return true;
}

function requestAuthoritativeAction(kind) {
  if (!worldAuthorityBridge?.isConnected?.()) return false;
  worldAuthorityBridge.requestAction?.(kind, worldAuthorityBridge.nearestTargetId?.(kind));
  return true;
}

function resize() {
  width = innerWidth;
  height = innerHeight;
  dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function tileToScreen(x, y) {
  return { x: (x - y) * TILE_W / 2 + camera.x, y: (x + y) * TILE_H / 2 + camera.y };
}

export function projectWorldMillimetersToCanvas(positionMm) {
  if (!positionMm || !Number.isFinite(positionMm.x) || !Number.isFinite(positionMm.z)) return null;
  const point = tileToScreen(positionMm.x / 4000, positionMm.z / 4000);
  return { x: point.x, y: point.y, visible: point.x >= -80 && point.x <= width + 80 && point.y >= -120 && point.y <= height + 80 };
}

function screenToTile(x, y) {
  const sx = x - camera.x;
  const sy = y - camera.y;
  return { x: Math.floor(sy / TILE_H + sx / TILE_W + 0.5), y: Math.floor(sy / TILE_H - sx / TILE_W + 0.5) };
}

function tileAt(x, y) { return MAP_ROWS[y]?.[x] || "#"; }
function isWalkable(x, y) {
  if (!WORLD.tileLegend[tileAt(x, y)]?.walkable) return false;
  const abbeyLocked = game?.worldEvents && !game.worldEvents.gates?.hollow_abbey_open;
  if (abbeyLocked && x >= 24 && y >= 13) return false;
  return true;
}

function findPath(start, goal) {
  const gx = Math.round(goal.x); const gy = Math.round(goal.y);
  if (!isWalkable(gx, gy)) return [];
  const sx = Math.round(start.x); const sy = Math.round(start.y);
  const key = (x, y) => `${x},${y}`;
  const queue = [{ x: sx, y: sy }];
  const previous = new Map([[key(sx, sy), null]]);
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  while (queue.length) {
    const current = queue.shift();
    if (current.x === gx && current.y === gy) {
      const path = [];
      let cursor = current;
      while (cursor && !(cursor.x === sx && cursor.y === sy)) {
        path.unshift(cursor);
        cursor = previous.get(key(cursor.x, cursor.y));
      }
      return path;
    }
    for (const [dx, dy] of dirs) {
      const next = { x: current.x + dx, y: current.y + dy };
      const nextKey = key(next.x, next.y);
      if (!previous.has(nextKey) && isWalkable(next.x, next.y)) {
        previous.set(nextKey, current); queue.push(next);
      }
    }
  }
  return [];
}

function pathAdjacentTo(position) {
  const options = [[1,0],[-1,0],[0,1],[0,-1]]
    .map(([dx,dy]) => ({ x: position.x + dx, y: position.y + dy }))
    .filter(({x,y}) => isWalkable(x,y))
    .map((goal) => ({ goal, path: findPath(game.player, goal) }))
    .filter((entry) => entry.path.length || distance(game.player, entry.goal) < .6)
    .sort((a,b) => a.path.length - b.path.length);
  return options[0]?.path || [];
}

function regionAt(x, y) {
  const authoritativeRegionId = worldAuthorityBridge?.isConnected?.() ? worldAuthorityBridge.getRegionId?.() : null;
  if (authoritativeRegionId) {
    const authoritativeRegion = WORLD.regions.find((region) => region.id === authoritativeRegionId);
    if (authoritativeRegion) return authoritativeRegion;
  }
  return regionAtPosition(x, y);
}

function nearbyEntity(tile) {
  const enemy = game.enemies.find((entry) => !entry.dead && Math.round(entry.x) === tile.x && Math.round(entry.y) === tile.y);
  if (enemy) return { type: "enemy", data: enemy, position: enemy };
  const npc = NPCS.find((entry) => entry.position.x === tile.x && entry.position.y === tile.y);
  if (npc) return { type: "npc", data: npc, position: npc.position };
  const node = GATHER_NODES.find((entry) => entry.position.x === tile.x && entry.position.y === tile.y);
  if (node) return { type: "node", data: node, position: node.position };
  const landmark = WORLD.landmarks.find((entry) => entry.position.x === tile.x && entry.position.y === tile.y);
  if (landmark) return { type: "landmark", data: landmark, position: landmark.position };
  return null;
}

function handleWorldClick(event) {
  if ($("#hud").hidden || !$("#dialogue").hidden || !$("#death-screen").hidden || currentPanel) return;
  const rect = canvas.getBoundingClientRect();
  const tile = screenToTile(event.clientX - rect.left, event.clientY - rect.top);
  const entity = nearbyEntity(tile);
  if (entity) {
    pendingAction = entity;
    if (distance(game.player, entity.position) <= 1.55) performPendingAction();
    else game.player.path = pathAdjacentTo(entity.position);
  } else if (isWalkable(tile.x, tile.y)) {
    pendingAction = null;
    game.player.path = findPath(game.player, tile);
    pulseAt(tile.x, tile.y);
  }
}

function update(dt) {
  if ($("#hud").hidden || !$("#dialogue").hidden || !$("#death-screen").hidden) return;
  const roomActor = authoritativeActor();
  if (worldAuthorityBridge?.isConnected?.()) {
    if (roomActor) syncAuthoritativeActor(roomActor);
    animationTime += dt;
    updateHud();
    return;
  }
  game.playSeconds += dt;
  animationTime += dt;
  const player = game.player;
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.dodgeCooldown = Math.max(0, player.dodgeCooldown - dt);
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  player.stamina = Math.min(player.maxStamina, player.stamina + 15 * dt);
  player.focus = Math.min(player.maxFocus, player.focus + 2.5 * dt);

  let dx = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
  let dy = (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0);
  if (dx || dy) {
    player.path = []; pendingAction = null;
    const length = Math.hypot(dx, dy); dx /= length; dy /= length;
    movePlayer(dx * dt * 3.1, dy * dt * 3.1);
  } else if (player.path.length) {
    const target = player.path[0];
    const vx = target.x - player.x; const vy = target.y - player.y;
    const remaining = Math.hypot(vx, vy);
    if (remaining < .08) {
      player.x = target.x; player.y = target.y; player.path.shift();
      if (!player.path.length && pendingAction) performPendingAction();
    } else {
      const step = Math.min(remaining, dt * 2.65);
      movePlayer(vx / remaining * step, vy / remaining * step);
    }
  }

  updateEnemies(dt);
  checkDiscoveries();
  updateInteractionPrompt();
  updateHud();
  camera.shake = Math.max(0, camera.shake - dt * 2);
}

function movePlayer(dx, dy) {
  const player = game.player;
  if (isWalkable(Math.round(player.x + dx), Math.round(player.y))) player.x += dx;
  if (isWalkable(Math.round(player.x), Math.round(player.y + dy))) player.y += dy;
  if (Math.abs(dx) > .01) player.facing = Math.sign(dx);
}

function updateEnemies(dt) {
  const now = Date.now();
  for (const enemy of game.enemies) {
    if (enemy.dead) {
      if (now >= enemy.respawnAt && !ENEMIES.find((entry) => entry.id === enemy.defId)?.boss) {
        enemy.dead = false; enemy.x = enemy.homeX; enemy.y = enemy.homeY; enemy.hp = enemy.maxHp;
      }
      continue;
    }
    enemy.cooldown -= dt; enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    const def = ENEMIES.find((entry) => entry.id === enemy.defId);
    const profile = def.runtime;
    const phase = behaviorPhaseAt(def, enemy.hp, enemy.maxHp);
    const dist = distance(enemy, game.player);
    if (enemy.intent > 0) {
      enemy.intent -= dt;
      if (enemy.intent <= 0) {
        const resolved = enemyMoveRuntime(def, enemy.intentMoveId, enemy.hp, enemy.maxHp);
        if (resolved.effectKind === "movement") {
          const awayX = enemy.x - game.player.x; const awayY = enemy.y - game.player.y; const awayDistance = Math.max(.01, Math.hypot(awayX, awayY));
          const nx = enemy.x + awayX / awayDistance * .55; const ny = enemy.y + awayY / awayDistance * .55;
          if (isWalkable(Math.round(nx), Math.round(enemy.y))) enemy.x = nx;
          if (isWalkable(Math.round(enemy.x), Math.round(ny))) enemy.y = ny;
        } else if ((resolved.damage > 0 || resolved.status) && distance(enemy, game.player) < resolved.range + .3) hurtPlayer(resolved.damage, enemy, resolved.status);
        enemy.intentMoveId = null;
      }
      continue;
    }
    if (dist < profile.perceptionRadius) {
      if (dist > profile.attackRange) {
        const speed = profile.movementSpeed * clamp(phase.modifiers.aggression || 1, .85, 1.25) * dt;
        const vx = (game.player.x - enemy.x) / dist; const vy = (game.player.y - enemy.y) / dist;
        const nx = enemy.x + vx * speed; const ny = enemy.y + vy * speed;
        if (isWalkable(Math.round(nx), Math.round(enemy.y))) enemy.x = nx;
        if (isWalkable(Math.round(enemy.x), Math.round(ny))) enemy.y = ny;
      } else if (enemy.cooldown <= 0) {
        const move = def.moves[Math.floor((game.playSeconds + enemy.level) % def.moves.length)];
        enemy.intentMoveId = move.id;
        enemy.intent = Math.max(.05, move.telegraph.seconds);
        enemy.cooldown = Math.max(.8, move.timing.startup + move.timing.active + move.timing.recovery * (phase.modifiers.recovery || 1));
      }
    } else if (distance(enemy, {x:enemy.homeX,y:enemy.homeY}) > .2) {
      const homeDist = distance(enemy, {x:enemy.homeX,y:enemy.homeY});
      enemy.x += (enemy.homeX - enemy.x) / homeDist * dt * .45;
      enemy.y += (enemy.homeY - enemy.y) / homeDist * dt * .45;
    }
  }
}

function hurtPlayer(amount, source, status = null) {
  if (game.player.invulnerable > 0) { floatText("DODGED", "#96b9b2"); return; }
  if (amount > 0) game.player.hp = Math.max(0, game.player.hp - Math.round(amount));
  if (status) game.player.afflictions[status] = Math.min(100, (game.player.afflictions[status] || 0) + 8);
  camera.shake = amount > 0 ? .4 : .12;
  floatText(amount > 0 ? `−${Math.round(amount)}` : status.toUpperCase(), amount > 0 ? "#c8675c" : "#9b78bd");
  setTarget(source);
  if (game.player.hp <= 0) {
    $("#death-screen").hidden = false;
    saveGame();
  }
}

function nearestEnemy(range = 1.65) {
  return game.enemies.filter((enemy) => !enemy.dead && distance(enemy, game.player) <= range).sort((a,b) => distance(a,game.player)-distance(b,game.player))[0];
}

function purchasedTechniques(skillId) {
  game.progression.purchasedNodes[skillId] ||= [];
  return game.progression.purchasedNodes[skillId];
}

function hasTechnique(nodeId) {
  const skillId = nodeId.split(".")[0];
  return purchasedTechniques(skillId).includes(nodeId);
}

function techniquePotency(hook) {
  for (const tree of Object.values(SKILL_TREES)) {
    const node = tree.nodes.find((entry) => entry.effects.some((effect) => effect.hook === hook));
    if (node && hasTechnique(node.id)) return node.effects.find((effect) => effect.hook === hook)?.potency || 0;
  }
  return 0;
}

function purchaseTechnique(nodeId) {
  const result = purchaseTechniqueInState(game.progression, game.skills, nodeId);
  if (!result.allowed) { toast(result.message); return; }
  toast(`<b>${result.node.name}</b> learned`);
  reconcileTechniqueDerivedStats(true);
  renderSkillTree(result.skillId);
  saveGame();
}

function reconcileTechniqueDerivedStats(refillIncrease = false) {
  if (!game?.player || !game?.character) return;
  const previous = game.player.maxStamina;
  const baseStamina = 62 + game.character.attributes.endurance * 5;
  const endingBonus = game.worldEvents?.choices?.lastBell === "release" ? 8 : 0;
  game.player.maxStamina = Math.round(baseStamina * (1 + techniquePotency("actor.stats.max_stamina"))) + endingBonus;
  game.player.stamina = refillIncrease && game.player.maxStamina > previous ? Math.min(game.player.maxStamina, game.player.stamina + game.player.maxStamina - previous) : Math.min(game.player.stamina, game.player.maxStamina);
}

function attack(kind = "light") {
  const player = game.player;
  if (player.attackCooldown > 0) return;
  const baseCost = kind === "heavy" ? 32 : 17;
  const staminaReduction = kind === "light" ? techniquePotency("combat.stamina.light_attack") : techniquePotency("combat.weight.heavy_weapon");
  const cost = Math.max(1, Number((baseCost * (1 - staminaReduction)).toFixed(2)));
  if (player.stamina < cost) { toast("Not enough stamina"); return; }
  const target = nearestEnemy(kind === "heavy" ? 1.9 : 1.65);
  if (!target) { player.attackCooldown = .35; player.stamina -= cost * .35; return; }
  player.stamina -= cost;
  player.attackCooldown = kind === "heavy" ? .95 : .48;
  const stats = game.character.attributes;
  const skillId = kind === "heavy" ? "heavy_arms" : "swordsmanship";
  const skillLevel = levelFromXp(game.skills[skillId] || 0);
  const base = kind === "heavy" ? 16 + stats.might * 1.45 : 8 + stats.finesse * .95;
  const targetDef = ENEMIES.find((entry) => entry.id === target.defId);
  const damageTag = kind === "heavy" ? "strike" : "slash";
  const damage = Math.round(base * (1 + skillLevel * .018) * (.88 + Math.random() * .22) * damageAffinityMultiplier(targetDef, damageTag));
  target.hp -= damage; target.hitFlash = .18; camera.shake = kind === "heavy" ? .28 : .12;
  setTarget(target); floatText(`${damage}`, kind === "heavy" ? "#e2bd72" : "#d8d0bd");
  addActionXp(skillId, kind === "heavy" ? "heavy_arms.charged_impact" : "swordsmanship.mixed_chain", { difficultyRatio: target.level / Math.max(1, skillLevel), timing: 1, quality: kind === "heavy" ? 1.08 : 1 });
  if (target.hp <= 0) defeatEnemy(target);
}

function dodge() {
  const player = game.player;
  if (player.dodgeCooldown || player.stamina < 24) return;
  player.stamina -= 24; player.invulnerable = .42; player.dodgeCooldown = .7;
  const direction = player.facing || 1;
  movePlayer(direction * .65, 0);
}

function mend() {
  const player = game.player;
  if (!player.mend || player.hp >= player.maxHp) return;
  player.mend -= 1; player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp * .42));
  toast("The vigil flask restores you"); addSkillXp("vitality", 12);
}

function defeatEnemy(enemy) {
  enemy.dead = true; enemy.respawnAt = Date.now() + 45000;
  const def = ENEMIES.find((entry) => entry.id === enemy.defId);
  const awardedLoot = rollLoot(def.lootTable);
  for (const loot of awardedLoot) addItem(loot.itemId, loot.quantity);
  game.player.sableMarks += 4 + enemy.level * 2; game.inventory.sable_marks = game.player.sableMarks;
  toast(`<b>${def.name}</b> stilled · ${4 + enemy.level * 2} marks`);
  progressObjectives("defeat", def.id, 1);
  if (enemy.unique && !game.worldEvents.uniqueDefeats.includes(def.id)) game.worldEvents.uniqueDefeats.push(def.id);
  for (const loot of awardedLoot) progressObjectives("acquire", loot.itemId, loot.quantity);
  if (def.id === "kiln_knight_rusk" && !awardedLoot.some(({ itemId }) => itemId === "cinder_seal")) progressObjectives("acquire", "cinder_seal", 1);
  saveGame();
}

function setTarget(enemy) {
  const def = ENEMIES.find((entry) => entry.id === enemy.defId);
  $("#target-card").hidden = false;
  $("#target-kind").textContent = def.boss ? "OATHBORN ADVERSARY" : `LEVEL ${enemy.level} · ${def.combatStyle.replaceAll("_", " ")}`;
  $("#target-name").textContent = def.name;
  $("#target-health").style.width = `${clamp(enemy.hp / enemy.maxHp * 100, 0, 100)}%`;
}

function addItem(id, quantity) { game.inventory[id] = (game.inventory[id] || 0) + quantity; }

function addSkillXp(id, amount) {
  if (!(id in game.skills)) return;
  const before = levelFromXp(game.skills[id]);
  game.skills[id] += amount;
  const after = levelFromXp(game.skills[id]);
  if (after > before) {
    const awarded = game.progression.awardedTechniqueLevels[id] ||= [];
    const earned = SKILL_TREES[id].techniquePointRules.earnedAtLevels.filter((threshold) => before < threshold && threshold <= after && !awarded.includes(threshold));
    awarded.push(...earned);
    game.progression.techniquePoints[id] += earned.length;
    toast(`<b>${SKILLS.find((skill) => skill.id === id).name}</b> reached level ${after}${earned.length ? ` · ${earned.length} technique point${earned.length === 1 ? "" : "s"}` : ""}`);
  }
}

function addActionXp(skillId, actionId, context = {}) {
  const award = awardSkillAction(game.progression, { skillId, actionId, ...context });
  if (award.awarded) addSkillXp(skillId, award.xp);
  return award;
}

function performPendingAction() {
  if (!pendingAction) return;
  const action = pendingAction; pendingAction = null;
  if (action.type === "enemy") attack("light");
  if (action.type === "npc") talkToNpc(action.data);
  if (action.type === "node") gatherNode(action.data);
  if (action.type === "landmark") interactLandmark(action.data);
}

function gatherNode(node) {
  const depletedUntil = game.gathered[node.id] || 0;
  if (Date.now() < depletedUntil) { toast("This source has not yet renewed"); return; }
  const skillId = node.skill === "excavation" ? "mining" : node.skill;
  const level = levelFromXp(game.skills[skillId] || 0);
  const prototypeLevel = Math.max(1, Math.ceil(node.level / 5));
  if (level < prototypeLevel) { toast(`${node.name} requires ${skillId} ${prototypeLevel}`); return; }
  let quantity = node.yield[0] + Math.floor(Math.random() * (node.yield[1] - node.yield[0] + 1));
  if (skillId === "mining" && Math.random() < techniquePotency("gather.mining.perfect_strike")) quantity += 1;
  addItem(node.resourceId, quantity);
  const gatherActions = { mining: "mining.clean_strike", woodcutting: "woodcutting.rhythm_pair", foraging: "foraging.clean_harvest" };
  const harvestQuality = skillId === "foraging" ? 0.82 + techniquePotency("gather.foraging.harvest_window") : 0.82;
  if (gatherActions[skillId]) addActionXp(skillId, gatherActions[skillId], { difficultyRatio: node.level / Math.max(1, level * 5), timing: 0.88, quality: harvestQuality });
  else addSkillXp(skillId, xpRewardForAction(skillId, Math.max(1, Math.ceil(node.level / 15))));
  game.gathered[node.id] = Date.now() + node.respawnSeconds * 1000;
  progressObjectives("gather", node.resourceId, quantity);
  toast(`${itemDef(node.resourceId).icon} ${node.name}: <b>+${quantity}</b>`);
  saveGame();
}

function interactLandmark(landmark) {
  if (landmark.id === "abbey_gate" && !game.worldEvents.gates.hollow_abbey_open) {
    if (!canOpenHollowAbbey(game.inventory, game.worldEvents.uniqueDefeats)) { toast("The Gate of Exact Words refuses you · a Cinder Seal is required"); return; }
    game.worldEvents.gates.hollow_abbey_open = true;
    toast("The Cinder Seal answers · Hollow Abbey is open");
  }
  if (landmark.id === "memory_clapper" && !game.worldEvents.choices.lastBell) {
    const finalQuest = QUESTS.find(({ id }) => id === "main_a_litany_unspoken");
    if (!canResolveLastBell(finalQuest, questState(finalQuest.id), game.worldEvents)) { toast("The Clapper is silent · complete the Litany and still Cantor Oss first"); return; }
    showLastBellChoice(); return;
  }
  progressObjectives("interact", landmark.id, 1);
  if (!game.discovered.includes(landmark.id)) { game.discovered.push(landmark.id); progressObjectives("discover", landmark.id, 1); addActionXp("wayfaring", "wayfaring.map_landmark", { difficultyRatio: 1, timing: 1, quality: 1, restedEligible: false }); }
  if (tileAt(landmark.position.x, landmark.position.y) === "S") {
    game.respawn = clone(landmark.position); game.player.mend = 3; game.player.hp = game.player.maxHp;
    toast("Wayshrine kindled · rest restored");
  } else toast(`${landmark.name} answers your touch`);
  saveGame();
}

function showLastBellChoice() {
  $("#speaker-mark").textContent = "◯";
  $("#speaker-role").textContent = "THE CLAPPER OF NAMES";
  $("#speaker-name").textContent = "A final remembering";
  $("#dialogue-text").textContent = "Thousands of names wait inside the bronze. Return them to Hearthmere and bind the living to their weight, or release them and let the Reach forget in peace.";
  $("#dialogue-choices").innerHTML = `<button data-ending="remember">Return every name</button><button data-ending="release">Release the dead</button>`;
  $("#dialogue").hidden = false;
  $$("[data-ending]").forEach((button) => button.addEventListener("click", () => {
    const ending = button.dataset.ending;
    game.worldEvents.choices.lastBell = ending;
    const outcome = lastBellOutcome(ending);
    if (outcome.stat === "focus") { game.player.maxFocus += outcome.amount; game.player.focus = game.player.maxFocus; }
    else { game.player.maxStamina += outcome.amount; game.player.stamina = game.player.maxStamina; }
    addItem(outcome.itemId, outcome.quantity);
    $("#dialogue").hidden = true;
    progressObjectives("interact", "memory_clapper", 1);
    toast(ending === "remember" ? "The names return · Hearthmere will carry them" : "The names depart · the Reach grows quiet");
    saveGame();
  }));
}

function checkDiscoveries() {
  for (const landmark of WORLD.landmarks) {
    if (!game.discovered.includes(landmark.id) && distance(game.player, landmark.position) < 1.25) {
      game.discovered.push(landmark.id); progressObjectives("discover", landmark.id, 1); addActionXp("wayfaring", "wayfaring.map_landmark", { difficultyRatio: 1, timing: 1, quality: 1, restedEligible: false });
      toast(`Discovered <b>${landmark.name}</b>`);
    }
  }
}

function questState(id) { return game.quests[id]; }
function activeQuests() { return QUESTS.filter((quest) => ["active", "ready"].includes(questState(quest.id)?.status)); }

function recordObjectiveEvent(type, target, amount) {
  recordWorldObjective(game.worldEvents, type, target, amount);
}

function hydrateQuestProgress(quest) {
  hydrateQuestFromLedger(quest, questState(quest.id), game.worldEvents, game.inventory, game.discovered);
}

function progressObjectives(type, target, amount) {
  recordObjectiveEvent(type, target, amount);
  for (const quest of activeQuests()) {
    const qState = questState(quest.id);
    quest.objectives.forEach((objective, index) => {
      if (objective.type === type && objective.target === target) qState.progress[index] = Math.min(objective.required, qState.progress[index] + amount);
    });
    if (quest.objectives.every((objective, index) => qState.progress[index] >= objective.required)) completeQuest(quest);
  }
  renderQuestTracker();
}

function completeQuest(quest) {
  const qState = questState(quest.id);
  if (qState.status === "completed") return;
  qState.status = "completed";
  Object.entries(quest.rewards.skillXp || {}).forEach(([id, xp]) => addSkillXp(resolveSkillId(id), xp));
  game.player.sableMarks += quest.rewards.currency?.sableMarks || 0;
  game.inventory.sable_marks = game.player.sableMarks;
  (quest.rewards.items || []).forEach((item) => addItem(item.id, item.quantity));
  for (const candidate of QUESTS) {
    const candidateState = questState(candidate.id);
    if (candidateState.status === "locked" && candidate.prerequisites.every((id) => questState(id)?.status === "completed")) candidateState.status = "available";
  }
  const next = QUESTS.find((candidate) => questState(candidate.id).status === "available" && candidate.chain === quest.chain);
  if (next) {
    questState(next.id).status = "active"; hydrateQuestProgress(next); game.trackedQuest = next.id;
    if (next.objectives.every((objective, index) => questState(next.id).progress[index] >= objective.required)) completeQuest(next);
  }
  toast(`Quest complete · <b>${quest.title}</b>`);
  saveGame();
}

function relevantQuestForNpc(npcId) {
  return QUESTS.find((quest) => quest.giverNpcId === npcId && ["active", "available", "ready"].includes(questState(quest.id)?.status));
}

function talkToNpc(npc) {
  const quest = relevantQuestForNpc(npc.id);
  let text = npc.description;
  let stage = null;
  if (quest) {
    const qState = questState(quest.id);
    if (qState.status === "available") { qState.status = "active"; hydrateQuestProgress(quest); }
    stage = quest.dialogueStages.find((entry) => entry.stage === (qState.progress.some(Boolean) ? "in_progress" : "offer")) || quest.dialogueStages[0];
    text = stage.lines.map((line) => line.text).join(" ");
    game.trackedQuest = quest.id;
  }
  progressObjectives("talk", npc.id, 1);
  $("#speaker-mark").textContent = npc.name[0];
  $("#speaker-role").textContent = npc.title;
  $("#speaker-name").textContent = npc.name;
  $("#dialogue-text").textContent = text;
  $("#dialogue-choices").innerHTML = `
    ${quest ? `<button data-dialogue="track">Track “${quest.title}”</button>` : ""}
    <button data-dialogue="lore">Ask about this place</button>
    <button data-dialogue="leave">Leave</button>`;
  $("#dialogue").hidden = false;
  $$("[data-dialogue]").forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.dialogue === "track" && quest) { game.trackedQuest = quest.id; renderQuestTracker(); }
    if (button.dataset.dialogue === "lore") $("#dialogue-text").textContent = WORLD.regions.find((region) => region.id === npc.regionId)?.lore || regionAt(npc.position.x,npc.position.y).lore;
    else if (button.dataset.dialogue !== "lore") $("#dialogue").hidden = true;
  }));
  saveGame();
}

function updateInteractionPrompt() {
  const candidates = [
    ...NPCS.map((data) => ({type:"npc",data,position:data.position,label:`Speak with ${data.name}`})),
    ...GATHER_NODES.map((data) => ({type:"node",data,position:data.position,label:`Gather ${data.name}`})),
    ...WORLD.landmarks.map((data) => ({type:"landmark",data,position:data.position,label:`Inspect ${data.name}`})),
  ].filter((entry) => distance(game.player, entry.position) < 1.5).sort((a,b) => distance(game.player,a.position)-distance(game.player,b.position));
  const prompt = $("#interaction-prompt");
  if (candidates[0]) { prompt.hidden = false; prompt.innerHTML = `<kbd>E</kbd> ${candidates[0].label}`; prompt.dataset.type = candidates[0].type; prompt.dataset.id = candidates[0].data.id; }
  else prompt.hidden = true;
}

function interactNearby() {
  const prompt = $("#interaction-prompt");
  if (prompt.hidden) return;
  const collections = { npc: NPCS, node: GATHER_NODES, landmark: WORLD.landmarks };
  const data = collections[prompt.dataset.type].find((entry) => entry.id === prompt.dataset.id);
  pendingAction = { type: prompt.dataset.type, data, position: data.position }; performPendingAction();
}

function craft(recipeId) {
  const recipe = ALL_RECIPES.find((entry) => entry.id === recipeId);
  if (!recipe) return;
  const level = levelFromXp(game.skills[recipe.skillId] || 0);
  if (level < recipe.levelRequired) { toast(`Requires ${recipe.skillId} ${recipe.levelRequired}`); return; }
  if (!recipe.ingredients.every((ingredient) => (game.inventory[ingredient.itemId] || 0) >= ingredient.quantity)) { toast("You lack the required materials"); return; }
  recipe.ingredients.forEach((ingredient) => game.inventory[ingredient.itemId] -= ingredient.quantity);
  recipe.outputs.forEach((output) => addItem(output.itemId, output.quantity));
  const action = SKILL_ACTIONS[recipe.skillId]?.[0];
  const craftQuality = recipe.skillId === "smithing" ? 0.82 + techniquePotency("craft.smithing.heat_band") : 0.82;
  if (action) addActionXp(recipe.skillId, action.id, { difficultyRatio: recipe.levelRequired / Math.max(1, level), timing: 0.86, quality: craftQuality });
  else addSkillXp(recipe.skillId, recipe.xp);
  progressObjectives("craft", recipe.id, 1);
  toast(`Crafted <b>${recipe.name}</b>`); renderPanel("inventory"); saveGame();
}

function render() {
  ctx.clearRect(0, 0, width, height);
  const playerScreenBase = { x: (game.player.x - game.player.y) * TILE_W / 2, y: (game.player.x + game.player.y) * TILE_H / 2 };
  const shakeX = camera.shake ? (Math.random() - .5) * camera.shake * 16 : 0;
  const shakeY = camera.shake ? (Math.random() - .5) * camera.shake * 10 : 0;
  camera.x = width * .49 - playerScreenBase.x + shakeX;
  camera.y = height * .48 - playerScreenBase.y + shakeY;

  drawRegionBackdrop();
  drawWorld();
  drawEntities();
  drawAtmosphere();
}

function drawRegionBackdrop(){
  const region=regionAt(game.player.x,game.player.y);const image=regionBackdrops[region.id];if(!image?.complete||!image.naturalWidth)return;
  const scale=Math.max(width/image.naturalWidth,height/image.naturalHeight);const drawWidth=image.naturalWidth*scale,drawHeight=image.naturalHeight*scale;
  ctx.save();ctx.globalAlpha=.2;ctx.filter="saturate(.48) brightness(.46) contrast(1.18) blur(1.5px)";ctx.drawImage(image,(width-drawWidth)/2,(height-drawHeight)/2,drawWidth,drawHeight);ctx.filter="none";
  const veil=ctx.createLinearGradient(0,0,0,height);veil.addColorStop(0,"rgba(3,7,9,.18)");veil.addColorStop(.48,"rgba(4,9,11,.68)");veil.addColorStop(1,"rgba(3,5,6,.9)");ctx.globalAlpha=1;ctx.fillStyle=veil;ctx.fillRect(0,0,width,height);ctx.restore();
}

const tileColors = {
  "#": ["#070b0d", "#0a0e10"], ".": ["#263034", "#1c2528"], "=": ["#4a4b45", "#333a39"],
  ",": ["#263d3d", "#1a2e31"], "~": ["#132b31", "#0b2027"], "B": ["#4a443b", "#302f2b"],
  "T": ["#172a27", "#0d1918"], "^": ["#343b3c", "#22292b"], "H": ["#3b3430", "#242426"],
  "r": ["#37373a", "#292b2d"], "S": ["#4c4234", "#2a2927"], "F": ["#553a2d", "#332721"],
  "G": ["#32383a", "#222629"], "M": ["#3b3939", "#292a2b"],
};

function diamond(x, y, fill, stroke = null) {
  ctx.beginPath(); ctx.moveTo(x, y - TILE_H/2); ctx.lineTo(x + TILE_W/2, y); ctx.lineTo(x, y + TILE_H/2); ctx.lineTo(x - TILE_W/2, y); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

function drawWorld() {
  for (let y = 0; y < MAP_ROWS.length; y++) {
    for (let x = 0; x < MAP_ROWS[y].length; x++) {
      const screen = tileToScreen(x,y); if (screen.x < -TILE_W || screen.x > width+TILE_W || screen.y < -100 || screen.y > height+100) continue;
      const char = tileAt(x,y); const colors = tileColors[char] || tileColors["."];
      const variation = ((x*13+y*19)%7)/100;
      const material=ctx.createLinearGradient(screen.x,screen.y-TILE_H/2,screen.x,screen.y+TILE_H/2);material.addColorStop(0,colors[0]);material.addColorStop(.5,colors[(x+y)%2]);material.addColorStop(1,colors[1]);
      diamond(screen.x, screen.y, material, `rgba(177,188,176,${.055+variation})`);
      drawTileSurface(char,screen.x,screen.y,x,y);
      drawTileProp(char, screen.x, screen.y, x, y);
    }
  }
  if (pointer.tile && isWalkable(pointer.tile.x,pointer.tile.y)) {
    const s = tileToScreen(pointer.tile.x,pointer.tile.y); diamond(s.x,s.y,"rgba(190,166,105,.08)","rgba(218,194,127,.34)");
  }
  for (const step of game.player.path) { const s=tileToScreen(step.x,step.y); ctx.fillStyle="rgba(218,194,127,.18)";ctx.beginPath();ctx.arc(s.x,s.y,2,0,Math.PI*2);ctx.fill(); }
}

function drawTileSurface(char,x,y,tx,ty){
  const hash=(tx*92821+ty*68917)%997;ctx.save();
  ctx.strokeStyle="rgba(220,225,210,.055)";ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x-TILE_W/2+2,y);ctx.lineTo(x,y-TILE_H/2+1);ctx.lineTo(x+TILE_W/2-2,y);ctx.stroke();
  ctx.strokeStyle="rgba(0,0,0,.22)";ctx.beginPath();ctx.moveTo(x-TILE_W/2+2,y);ctx.lineTo(x,y+TILE_H/2-1);ctx.lineTo(x+TILE_W/2-2,y);ctx.stroke();
  if([".","=","^","r","B"].includes(char)&&hash%3===0){ctx.strokeStyle="rgba(9,13,14,.34)";ctx.beginPath();ctx.moveTo(x-12+(hash%9),y-2);ctx.lineTo(x-2,y+2);ctx.lineTo(x+9-(hash%7),y-1);ctx.stroke();}
  if([",","T","."].includes(char)&&hash%4===0){ctx.strokeStyle=char===","?"rgba(113,139,104,.28)":"rgba(86,109,91,.24)";ctx.beginPath();for(let blade=0;blade<3;blade++){ctx.moveTo(x-8+blade*4,y+5);ctx.lineTo(x-10+blade*5,y-2-(hash%4));}ctx.stroke();}
  if(char==="~"||char===","){ctx.strokeStyle=char==="~"?"rgba(145,190,193,.2)":"rgba(129,160,133,.15)";ctx.beginPath();ctx.moveTo(x-23,y+(hash%5)-2);ctx.quadraticCurveTo(x,y-6+Math.sin(animationTime*1.7+tx)*2,x+24,y-1);ctx.stroke();}
  ctx.restore();
}

function drawTileProp(char, x, y, tx, ty) {
  if (char === "T") {
    shadow(x,y,15);const sway=Math.sin(animationTime*.7+tx*2.1+ty)*1.2;ctx.fillStyle="#211d1b";ctx.fillRect(x-2,y-25,5,24);
    const treeGrad=ctx.createLinearGradient(x,y-75,x,y-7);treeGrad.addColorStop(0,"#172724");treeGrad.addColorStop(1,"#091411");ctx.fillStyle=treeGrad;
    for(const [top,half] of [[-74,11],[-60,18],[-45,23],[-29,27]]){ctx.beginPath();ctx.moveTo(x+sway,y+top);ctx.lineTo(x-half,y+top+29);ctx.quadraticCurveTo(x,y+top+24,x+half,y+top+29);ctx.closePath();ctx.fill();}
    ctx.strokeStyle="rgba(96,115,103,.2)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+sway,y-72);ctx.lineTo(x-5,y-18);ctx.stroke();
  }
  if (char === "H" || char === "G") {
    shadow(x,y,29);const left=char==="G"?"#272d2d":"#312d2a",right=char==="G"?"#171d1e":"#211e1d";
    ctx.fillStyle=left;ctx.beginPath();ctx.moveTo(x-27,y-55);ctx.lineTo(x,y-43);ctx.lineTo(x,y-3);ctx.lineTo(x-27,y-16);ctx.closePath();ctx.fill();
    ctx.fillStyle=right;ctx.beginPath();ctx.moveTo(x,y-43);ctx.lineTo(x+27,y-55);ctx.lineTo(x+27,y-16);ctx.lineTo(x,y-3);ctx.closePath();ctx.fill();
    const roof=ctx.createLinearGradient(x,y-80,x,y-48);roof.addColorStop(0,"#141819");roof.addColorStop(1,"#292728");ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(x-32,y-56);ctx.lineTo(x,y-78);ctx.lineTo(x+33,y-56);ctx.lineTo(x,y-39);ctx.closePath();ctx.fill();ctx.strokeStyle="rgba(174,176,162,.14)";ctx.stroke();
    const glow=.34+Math.sin(animationTime*3+tx)*.08;ctx.fillStyle=`rgba(212,135,60,${glow})`;ctx.fillRect(x+8,y-35,7,12);ctx.fillStyle=`rgba(235,159,73,${glow*.35})`;ctx.beginPath();ctx.ellipse(x+12,y-28,18,11,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="rgba(151,146,131,.14)";ctx.beginPath();for(let seam=0;seam<3;seam++){ctx.moveTo(x-24,y-23-seam*9);ctx.lineTo(x-2,y-13-seam*9);}ctx.stroke();
  }
  if (["S","M","F"].includes(char)) {
    shadow(x,y,14);const stone=ctx.createLinearGradient(x-8,y-58,x+8,y-3);stone.addColorStop(0,"#454748");stone.addColorStop(1,"#1c2021");ctx.fillStyle=stone;ctx.beginPath();ctx.moveTo(x-8,y-47);ctx.lineTo(x,y-63);ctx.lineTo(x+8,y-47);ctx.lineTo(x+7,y-5);ctx.lineTo(x-7,y-5);ctx.closePath();ctx.fill();ctx.strokeStyle="rgba(184,179,162,.18)";ctx.stroke();
    ctx.strokeStyle="rgba(12,15,16,.58)";ctx.beginPath();ctx.moveTo(x-3,y-42);ctx.lineTo(x+2,y-34);ctx.lineTo(x-2,y-24);ctx.stroke();
    if (char === "S") { const flame=.58+Math.sin(animationTime*4+tx)*.16;const light=ctx.createRadialGradient(x,y-54,1,x,y-54,32);light.addColorStop(0,`rgba(241,183,91,${flame})`);light.addColorStop(.25,`rgba(203,111,45,${flame*.5})`);light.addColorStop(1,"rgba(105,52,25,0)");ctx.fillStyle=light;ctx.fillRect(x-34,y-88,68,68);ctx.fillStyle="#e2a04b";ctx.beginPath();ctx.moveTo(x,y-61);ctx.quadraticCurveTo(x-8,y-50,x,y-45);ctx.quadraticCurveTo(x+8,y-51,x,y-61);ctx.fill(); }
  }
}

function drawEntities() {
  const entities = [];
  NPCS.forEach((data) => entities.push({ kind:"npc", y:data.position.x+data.position.y, data, x:data.position.x, ty:data.position.y }));
  GATHER_NODES.forEach((data) => entities.push({ kind:"node", y:data.position.x+data.position.y, data, x:data.position.x, ty:data.position.y }));
  game.enemies.filter((entry)=>!entry.dead).forEach((data) => entities.push({ kind:"enemy", y:data.x+data.y, data, x:data.x, ty:data.y }));
  entities.push({kind:"player",y:game.player.x+game.player.y,data:game.player,x:game.player.x,ty:game.player.y});
  entities.sort((a,b)=>a.y-b.y);
  for (const entity of entities) {
    const s=tileToScreen(entity.x,entity.ty);
    if (entity.kind==="node") drawNode(entity.data,s.x,s.y);
    if (entity.kind==="npc") drawFigure(s.x,s.y,{spritePath:NPC_ART[entity.data.id],friendly:true,label:entity.data.name});
    if (entity.kind==="enemy") drawEnemy(entity.data,s.x,s.y);
    if (entity.kind==="player") { const sil=characterSilhouette(game.character);drawFigure(s.x,s.y,{spritePath:originArtPath(game.character.origin),body:"#4a4f50",cape:"#1a2325",skin:sil.palette.skin,hair:sil.palette.hair,player:true}); }
  }
}

function shadow(x,y,size=22){ctx.fillStyle="rgba(0,0,0,.48)";ctx.beginPath();ctx.ellipse(x,y+3,size,6.5,0,0,Math.PI*2);ctx.fill();}
function drawFigure(x,y,opt={}) {
  const sprite=characterSprites[opt.spritePath];if(sprite){shadow(x,y,15);const bob=Math.sin(animationTime*3+x)*.55;ctx.save();ctx.translate(x,y+bob);if(opt.friendly){ctx.strokeStyle="rgba(177,146,78,.32)";ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,-31,18,29,0,0,Math.PI*2);ctx.stroke();}ctx.drawImage(sprite,-29,-82,58,84);ctx.restore();if(opt.label){ctx.textAlign="center";ctx.font="9px Inter";ctx.fillStyle="#c0bcb0";ctx.shadowColor="#000";ctx.shadowBlur=5;ctx.fillText(opt.label,x,y-86);ctx.shadowBlur=0;}return;}
  shadow(x,y,14);const bob=Math.sin(animationTime*3+x)*.65;ctx.save();ctx.translate(x,y+bob);
  if(opt.friendly){ctx.strokeStyle="rgba(177,146,78,.3)";ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,-27,17,26,0,0,Math.PI*2);ctx.stroke();}
  ctx.strokeStyle="#131719";ctx.lineCap="round";ctx.lineWidth=3.2;ctx.beginPath();ctx.moveTo(-3.5,-18);ctx.lineTo(-5,0);ctx.moveTo(3.5,-18);ctx.lineTo(5.5,0);ctx.stroke();
  ctx.fillStyle=opt.cape||"#202629";ctx.beginPath();ctx.moveTo(-6,-45);ctx.quadraticCurveTo(-13,-31,-10,-5);ctx.lineTo(-2,-9);ctx.lineTo(3,-4);ctx.lineTo(10,-8);ctx.quadraticCurveTo(12,-31,6,-45);ctx.closePath();ctx.fill();
  const bodyGrad=ctx.createLinearGradient(-7,-44,7,-15);bodyGrad.addColorStop(0,opt.body||"#424a49");bodyGrad.addColorStop(1,"#202728");ctx.fillStyle=bodyGrad;ctx.beginPath();ctx.moveTo(-7,-43);ctx.quadraticCurveTo(0,-47,7,-43);ctx.lineTo(5,-17);ctx.lineTo(-5,-17);ctx.closePath();ctx.fill();
  ctx.strokeStyle="#252b2c";ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(-6,-40);ctx.lineTo(-10,-18);ctx.moveTo(6,-40);ctx.lineTo(10,-19);ctx.stroke();
  ctx.fillStyle=opt.skin||"#817269";ctx.beginPath();ctx.ellipse(0,-52,5.1,7.5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="rgba(35,27,27,.38)";ctx.beginPath();ctx.ellipse(0,-50,4.3,2.8,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=opt.hair||"#272322";ctx.beginPath();ctx.ellipse(0,-56,5.5,3.8,0,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle="#9da99e";ctx.fillRect(-2.7,-53,1,1);ctx.fillRect(1.7,-53,1,1);
  ctx.strokeStyle="#6b5735";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-6,-38);ctx.lineTo(6,-23);ctx.stroke();ctx.strokeStyle="rgba(165,154,129,.28)";ctx.beginPath();ctx.moveTo(-5,-31);ctx.lineTo(4,-31);ctx.stroke();
  if(opt.player){ctx.strokeStyle="#8d7446";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(7,-36);ctx.lineTo(14,-3);ctx.stroke();ctx.fillStyle="#b99a58";ctx.fillRect(12,-14,2,11);}
  ctx.restore();if(opt.label){ctx.textAlign="center";ctx.font="9px Inter";ctx.fillStyle="#b8b5aa";ctx.shadowColor="#000";ctx.shadowBlur=4;ctx.fillText(opt.label,x,y-68);ctx.shadowBlur=0;}
}
function drawEnemy(enemy,x,y){
  const def=ENEMIES.find((entry)=>entry.id===enemy.defId);if(!def)return;const silhouette=def.silhouette||{};const shape=silhouette.shape||"human";const features=new Set(silhouette.features||[]);const scale=clamp(.9+((silhouette.scale||1)-1)*.34,.88,1.55);const flash=Boolean(enemy.hitFlash);
  const palettes={ashbound:["#514b48","#26282a","#8e8075"],march_deserters:["#4b403a","#1d2224","#81766e"],drowned_parish:["#3d5049","#1a292b","#91a39a"],reed_coven:["#465344","#1d2926","#a39b74"],kilnforged:["#5b5047","#242729","#b65f39"],hush_order:["#696b61","#262b2c","#aaa89a"],bell_revenants:["#52605a","#202526","#9c8761"],salt_waste:["#77746c","#35373a","#b9bbb5"],veil_coast:["#334f55","#15272d","#81a2a0"]};
  const [mid,dark,accent]=palettes[def.familyId]||["#494b47","#202526","#9b9181"];shadow(x,y,17*scale);ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.lineCap="round";ctx.lineJoin="round";
  if(shape==="beast"){
    const hide=ctx.createLinearGradient(-24,-37,22,-9);hide.addColorStop(0,flash?"#d7c0a6":"#566057");hide.addColorStop(1,"#1b2524");ctx.fillStyle=hide;ctx.beginPath();ctx.moveTo(-22,-31);ctx.quadraticCurveTo(-5,-43,17,-32);ctx.lineTo(27,-26);ctx.lineTo(16,-16);ctx.quadraticCurveTo(-5,-11,-22,-20);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#1a2221";ctx.lineWidth=4;for(const leg of [[-15,-21,-19,0],[-5,-18,-2,1],[11,-18,8,1],[20,-22,23,-1]]){ctx.beginPath();ctx.moveTo(leg[0],leg[1]);ctx.lineTo(leg[2],leg[3]);ctx.stroke();}
    ctx.fillStyle="#28302e";ctx.beginPath();ctx.moveTo(14,-34);ctx.lineTo(31,-34);ctx.lineTo(36,-28);ctx.lineTo(23,-20);ctx.closePath();ctx.fill();ctx.fillStyle=accent;ctx.fillRect(27,-31,2,1.5);
    if(features.has("stone_growths")||features.has("glass_antlers")){ctx.strokeStyle=features.has("glass_antlers")?"#91b7b2":"#746f60";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(20,-34);ctx.lineTo(24,-51);ctx.lineTo(31,-58);ctx.moveTo(24,-46);ctx.lineTo(35,-49);ctx.moveTo(15,-35);ctx.lineTo(10,-47);ctx.stroke();}
    ctx.strokeStyle="rgba(184,177,153,.2)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-17,-29);ctx.quadraticCurveTo(-2,-36,18,-27);ctx.stroke();
  }else if(shape==="spectral"){
    const ghost=ctx.createLinearGradient(0,-64,0,0);ghost.addColorStop(0,flash?"rgba(220,211,198,.9)":"rgba(132,121,148,.82)");ghost.addColorStop(1,"rgba(42,54,63,.08)");ctx.fillStyle=ghost;ctx.beginPath();ctx.ellipse(0,-53,7,10,0,0,Math.PI*2);ctx.moveTo(-8,-48);ctx.quadraticCurveTo(-15,-29,-9,-5);ctx.lineTo(-3,-15);ctx.lineTo(2,-2);ctx.lineTo(8,-17);ctx.lineTo(13,-7);ctx.quadraticCurveTo(15,-32,8,-48);ctx.closePath();ctx.fill();
    ctx.strokeStyle="rgba(153,126,180,.46)";ctx.lineWidth=1;for(let ring=0;ring<3;ring++){ctx.beginPath();ctx.ellipse(0,-38,12+ring*5,4+ring*2,0,0,Math.PI*2);ctx.stroke();}
    ctx.fillStyle="#17151e";ctx.beginPath();ctx.ellipse(0,-52,features.has("open_mouths")?3.5:2,features.has("open_mouths")?6:2.5,0,0,Math.PI*2);ctx.fill();
  }else if(shape==="composite"){
    ctx.strokeStyle=flash?"#d7c0a6":"#827d6d";ctx.lineWidth=2.8;for(let limb=-3;limb<=3;limb++){ctx.beginPath();ctx.moveTo(limb*3,-25-Math.abs(limb));ctx.quadraticCurveTo(limb*6,-13,limb*8+(limb%2)*4,0);ctx.stroke();}
    const bone=ctx.createLinearGradient(-17,-43,17,-15);bone.addColorStop(0,"#918a78");bone.addColorStop(1,"#3f443c");ctx.fillStyle=bone;ctx.beginPath();ctx.ellipse(0,-28,18,11,-.15,0,Math.PI*2);ctx.fill();for(let skull=-1;skull<=1;skull++){ctx.fillStyle="#9b9482";ctx.beginPath();ctx.ellipse(skull*9,-39+Math.abs(skull)*3,5.5,6.5,skull*.15,0,Math.PI*2);ctx.fill();ctx.fillStyle="#252622";ctx.fillRect(skull*9-3,-40,2,2);ctx.fillRect(skull*9+1,-40,2,2);}
  }else if(shape==="amphibious"){
    const skin=ctx.createLinearGradient(-14,-47,14,-4);skin.addColorStop(0,flash?"#d7c0a6":"#52706e");skin.addColorStop(1,"#152d31");ctx.strokeStyle="#20393b";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-8,-29);ctx.quadraticCurveTo(-25,-17,-25,-2);ctx.moveTo(8,-29);ctx.quadraticCurveTo(25,-16,27,-3);ctx.stroke();ctx.fillStyle=skin;ctx.beginPath();ctx.moveTo(-10,-42);ctx.quadraticCurveTo(0,-51,12,-41);ctx.lineTo(14,-10);ctx.lineTo(-14,-9);ctx.closePath();ctx.fill();ctx.beginPath();ctx.ellipse(0,-49,9,7,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#9bc0ab";ctx.fillRect(-5,-50,2,2);ctx.fillRect(3,-50,2,2);
  }else{
    const armored=shape==="armored";const robed=shape==="robed"||def.familyId==="reed_coven"||def.familyId==="drowned_parish"||def.familyId==="hush_order";const shoulder=armored?14:10;const hem=robed?12:7;
    ctx.strokeStyle=dark;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-4,-18);ctx.lineTo(-5,0);ctx.moveTo(4,-18);ctx.lineTo(5,0);ctx.moveTo(-shoulder+2,-40);ctx.lineTo(-13,-17);ctx.moveTo(shoulder-2,-40);ctx.lineTo(13,-17);ctx.stroke();
    const cloth=ctx.createLinearGradient(-shoulder,-48,hem,-5);cloth.addColorStop(0,flash?"#d7c0a6":mid);cloth.addColorStop(.55,dark);cloth.addColorStop(1,"#11191a");ctx.fillStyle=cloth;ctx.beginPath();ctx.moveTo(-shoulder,-43);ctx.quadraticCurveTo(0,-48,shoulder,-43);ctx.lineTo(hem,-6);ctx.lineTo(2,-10);ctx.lineTo(-3,-5);ctx.lineTo(-hem,-7);ctx.closePath();ctx.fill();
    if(armored){ctx.strokeStyle="rgba(177,160,132,.42)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-12,-41);ctx.lineTo(12,-41);ctx.moveTo(-10,-34);ctx.lineTo(10,-34);ctx.moveTo(-8,-27);ctx.lineTo(8,-27);ctx.stroke();}
    ctx.fillStyle=dark;ctx.beginPath();ctx.ellipse(0,-51,armored?8:7,armored?10:9,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=armored?"#5f5c54":accent;ctx.beginPath();ctx.ellipse(0,-51,4.4,6.8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=def.familyId==="kilnforged"?"#df7440":"#aab7aa";ctx.fillRect(-3.2,-52,1.5,1.2);ctx.fillRect(1.7,-52,1.5,1.2);
    if(features.has("smoke_seams")){ctx.strokeStyle="rgba(151,148,139,.42)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-6,-37);ctx.lineTo(5,-29);ctx.lineTo(-2,-20);ctx.stroke();ctx.beginPath();ctx.moveTo(4,-55);ctx.quadraticCurveTo(12,-66,6,-71);ctx.stroke();}
    if(features.has("clay_tags")){ctx.fillStyle="#8f7255";for(const [tagX,tagY] of [[-8,-31],[4,-24],[8,-37]])ctx.fillRect(tagX,tagY,3,6);}
    if(features.has("vent_grilles")){ctx.fillStyle="#cb673b";ctx.fillRect(-8,-38,16,2);ctx.fillRect(-6,-31,12,1.5);}
    if(features.has("reed_masks")){ctx.strokeStyle="#b0a06a";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-6,-59);ctx.lineTo(0,-45);ctx.lineTo(6,-59);ctx.moveTo(-9,-56);ctx.lineTo(-2,-45);ctx.stroke();}
    if(features.has("reed_halo")){ctx.strokeStyle="rgba(154,145,95,.6)";ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,-51,12,Math.PI*.9,Math.PI*2.1);ctx.stroke();}
    if(features.has("blank_banners")){ctx.strokeStyle="#6f6045";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(12,-37);ctx.lineTo(16,-66);ctx.stroke();ctx.fillStyle="#3b302d";ctx.beginPath();ctx.moveTo(16,-65);ctx.lineTo(28,-61);ctx.lineTo(17,-49);ctx.closePath();ctx.fill();}
    if(features.has("stitched_veils")){ctx.strokeStyle="#252829";ctx.lineWidth=.8;for(let stitch=-3;stitch<=3;stitch+=2){ctx.beginPath();ctx.moveTo(stitch,-55);ctx.lineTo(stitch+1,-47);ctx.stroke();}}
    if(features.has("bell_cavities")){ctx.strokeStyle="#a18450";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-31,5,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#101416";ctx.beginPath();ctx.arc(0,-31,2.7,0,Math.PI*2);ctx.fill();}
    if(features.has("mirror_faces")){ctx.fillStyle="rgba(173,194,196,.78)";ctx.beginPath();ctx.ellipse(0,-51,4.5,6.8,0,0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle="rgba(187,176,151,.2)";ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(-7,-41);ctx.lineTo(5,-17);ctx.moveTo(7,-38);ctx.lineTo(-4,-22);ctx.stroke();
  }
  ctx.restore();
  if(enemy.intent>0){const move=enemyMoveRuntime(def,enemy.intentMoveId,enemy.hp,enemy.maxHp);ctx.strokeStyle=move.status==="fire"?"#e18450":move.status==="hex"||move.status==="curse"?"#9b78bd":move.status==="frost"||move.status==="water"?"#72a9b0":"#c7664d";ctx.lineWidth=2;ctx.beginPath();if(move.shape==="line"){ctx.moveTo(x,y-28);ctx.lineTo(x+(game.player.x-enemy.x)*TILE_W*.55,y+(game.player.y-enemy.y)*TILE_H*.55-28);}else{ctx.arc(x,y-28,(move.shape==="area"?38:30)+Math.sin(animationTime*15)*3,0,Math.PI*2);}ctx.stroke();}
  if(enemy.hp<enemy.maxHp){ctx.fillStyle="#141617";ctx.fillRect(x-22,y-66,44,3);ctx.fillStyle="#9e443d";ctx.fillRect(x-22,y-66,44*enemy.hp/enemy.maxHp,3);}
}
function drawNode(node,x,y){const gone=Date.now()<(game.gathered[node.id]||0);shadow(x,y,13);ctx.globalAlpha=gone?.25:1;ctx.strokeStyle=node.skill==="mining"?"#8a8581":"#668071";ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<5;i++){ctx.moveTo(x,y-3);ctx.lineTo(x+(i-2)*5,y-18-Math.abs(i-2)*5);}ctx.stroke();ctx.globalAlpha=1;}
function drawAtmosphere(){
  const grad=ctx.createLinearGradient(0,0,0,height);grad.addColorStop(0,"rgba(3,8,11,.28)");grad.addColorStop(.5,"rgba(8,15,17,.02)");grad.addColorStop(1,"rgba(1,4,5,.5)");ctx.fillStyle=grad;ctx.fillRect(0,0,width,height);
  for(let bank=0;bank<3;bank++){const fy=(height*(.28+bank*.23)+Math.sin(animationTime*.13+bank)*24);const fog=ctx.createLinearGradient(0,fy-70,0,fy+70);fog.addColorStop(0,"rgba(95,116,113,0)");fog.addColorStop(.5,`rgba(101,120,116,${.035+bank*.012})`);fog.addColorStop(1,"rgba(95,116,113,0)");ctx.fillStyle=fog;ctx.fillRect(0,fy-70,width,140);}
  ctx.strokeStyle="rgba(179,196,190,.075)";ctx.lineWidth=.7;for(let i=0;i<42;i++){const x=(i*113+animationTime*44)%(width+160)-80;const y=(i*71+animationTime*96)%height;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-7,y+19);ctx.stroke();}
  if(game.player.lantern){const p=tileToScreen(game.player.x,game.player.y);const glow=ctx.createRadialGradient(p.x,p.y-28,4,p.x,p.y-28,145);glow.addColorStop(0,"rgba(227,154,72,.13)");glow.addColorStop(.36,"rgba(174,96,43,.055)");glow.addColorStop(1,"rgba(80,42,20,0)");ctx.fillStyle=glow;ctx.fillRect(p.x-150,p.y-178,300,300);}
  for(let i=0;i<34;i++){const x=(i*137+animationTime*7)% (width+100)-50;const y=(i*73+Math.sin(i)*70)%height;ctx.fillStyle=`rgba(190,209,198,${.025+(i%4)*.008})`;ctx.fillRect(x,y,1,1);}
}

function pulseAt(x,y){pointer.pulse={x,y,until:performance.now()+500};}
function floatText(text,color){const el=$("#combat-text");el.textContent=text;el.style.color=color;el.animate([{opacity:1,transform:"translateY(0)"},{opacity:0,transform:"translateY(-45px)"}],{duration:750,easing:"ease-out"});}
function toast(html){const el=document.createElement("div");el.className="toast";el.innerHTML=html;$("#toast-stack").append(el);setTimeout(()=>el.remove(),3200);}

function updateHud() {
  const p=game.player;$("#hud-name").textContent=game.character.name;$("#player-rune").textContent="";$("#player-rune").style.backgroundImage=`linear-gradient(rgba(8,12,13,.12),rgba(8,12,13,.5)),url('${originArtPath(game.character.origin)}')`;
  const totalLevel=SKILLS.reduce((sum,skill)=>sum+levelFromXp(game.skills[skill.id]||0),0);$("#hud-level").textContent=`Renown ${Math.max(1,Math.floor(totalLevel/12))}`;
  $("#health-bar").style.width=`${p.hp/p.maxHp*100}%`;$("#health-text").textContent=`${Math.ceil(p.hp)} / ${p.maxHp}`;$("#stamina-bar").style.width=`${p.stamina/p.maxStamina*100}%`;$("#focus-bar").style.width=`${p.focus/p.maxFocus*100}%`;$("#mend-count").textContent=p.mend;
  const region=regionAt(p.x,p.y);$("#region-label").textContent=WORLD.name.toUpperCase();$("#location-label").textContent=region.name;$("#world-time").textContent=region.ambience;
}

function renderQuestTracker(){
  const quest=QUESTS.find((entry)=>entry.id===game.trackedQuest) || activeQuests()[0];const el=$("#quest-tracker");
  if(!quest){el.hidden=true;return;} el.hidden=false;const qState=questState(quest.id);const done=qState.progress.reduce((a,b)=>a+b,0);const total=quest.objectives.reduce((a,b)=>a+b.required,0);
  el.innerHTML=`<span>${quest.type.toUpperCase()} QUEST</span><h3>${quest.title}</h3><progress max="${total}" value="${done}"></progress>${quest.objectives.map((o,i)=>`<div class="quest-objective ${qState.progress[i]>=o.required?"done":""}"><b>${qState.progress[i]>=o.required?"✓":"◇"}</b><span>${objectiveLabel(o)} <em>${qState.progress[i]}/${o.required}</em></span></div>`).join("")}`;
}
function objectiveLabel(objective){const names={...Object.fromEntries(NPCS.map(n=>[n.id,n.name])),...Object.fromEntries(ENEMIES.map(e=>[e.id,e.name])),...Object.fromEntries(WORLD.landmarks.map(l=>[l.id,l.name]))};const verbs={talk:"Speak with",gather:"Gather",interact:"Inspect",defeat:"Defeat",discover:"Discover",acquire:"Acquire",craft:"Craft"};return `${verbs[objective.type]||objective.type} ${names[objective.target]||itemDef(objective.target).name}`;}

function renderSkillTree(skillId) {
  const skill = SKILLS.find((entry) => entry.id === skillId);
  const tree = SKILL_TREES[skillId];
  const actions = SKILL_ACTIONS[skillId] || [];
  const trial = MASTERY_TRIALS.find((entry) => entry.skillId === skillId);
  if (!skill || !tree) return renderPanel("skills");
  const owned = purchasedTechniques(skillId);
  const points = game.progression.techniquePoints[skillId] || 0;
  const level = levelFromXp(game.skills[skillId] || 0);
  $("#panel-kicker").textContent = `${tree.category} discipline · level ${level}`;
  $("#panel-title").textContent = `${skill.name} techniques`;
  $("#panel-content").innerHTML = `<button class="codex-back" data-skill-back>← All disciplines</button>
    <div class="technique-summary"><span class="skill-icon" style="color:${skill.color}">${skill.icon}</span><div><b>${points}</b><small>Technique points</small></div><p>${skill.description}</p></div>
    <div class="technique-grid">${tree.nodes.map((node) => {
      const learned = owned.includes(node.id);
      const eligibility = evaluateTechniquePurchase(game.progression, game.skills, node.id);
      const unavailable = !learned && !eligibility.allowed;
      const status = learned ? "Learned" : eligibility.message;
      return `<article class="technique-node ${learned ? "learned" : ""} ${unavailable ? "unavailable" : ""}" data-technique-node="${node.id}"><span>Tier ${node.tierIndex} · ${node.tier} · level ${node.levelRequired}</span><h3>${node.name}</h3><p>${node.effects[0].description}</p><button data-technique="${node.id}" ${learned || unavailable ? "disabled" : ""}>${status}</button></article>`;
    }).join("")}</div>
    <p class="field-label">Actions</p><div class="action-codex">${actions.map((action) => `<article><b>${action.name}</b><span>Tier ${action.tier} · level ${action.requirements.skillLevel}</span><small>${action.hook.replaceAll("_", " ")}</small></article>`).join("")}</div>
    <p class="field-label">Mastery trial</p><article class="mastery-card"><span>Level ${trial.levelRequired}</span><h3>${trial.name}</h3><p>${trial.premise}</p></article>`;
  $("[data-skill-back]").onclick = () => renderPanel("skills");
  $$('[data-technique]').forEach((button) => button.onclick = () => purchaseTechnique(button.dataset.technique));
}

function openPanel(name){currentPanel=currentPanel===name?null:name;dispatchEvent(new CustomEvent("world-panel-change",{detail:{name:currentPanel}}));$("#panel").hidden=!currentPanel;$$('[data-panel]').forEach(b=>b.classList.toggle("active",b.dataset.panel===currentPanel));if(currentPanel)renderPanel(currentPanel);}
function renderPanel(name){
  currentPanel=name;dispatchEvent(new CustomEvent("world-panel-change",{detail:{name}}));const titles={skills:["Pilgrim's disciplines","Skills"],inventory:["What the road allowed","Pack & craft"],quests:["Promises made and broken","Journal"],world:["Places the Reach remembers","World atlas"],bestiary:["Predators, penitents, and worse","Bestiary"],lore:["Allegiances written in ash","People & factions"],character:["Oathbound record","Character"],help:["Survive the Reach","Controls"]};[$("#panel-kicker").textContent,$("#panel-title").textContent]=titles[name];const content=$("#panel-content");
  if(name==="skills"){
    const total=SKILLS.reduce((sum,s)=>sum+levelFromXp(game.skills[s.id]||0),0);content.innerHTML=`<div class="skill-summary"><b>${total}</b><span>Total discipline<br>18 trees · 216 techniques · 144 actions</span></div><div class="skills-grid">${SKILLS.map(s=>{const xp=game.skills[s.id]||0,lvl=levelFromXp(xp),start=xpForLevel(lvl),end=xpForLevel(Math.min(99,lvl+1)),pct=lvl===99?100:(xp-start)/(end-start)*100,points=game.progression.techniquePoints[s.id]||0;return `<button class="skill-tile" data-skill-detail="${s.id}" title="${s.description}"><span class="skill-icon" style="color:${s.color}">${s.icon}</span><strong>${s.name}</strong><b>${lvl}</b><small>${xp.toLocaleString()} XP · ${points} TP</small><div class="xp-line"><i style="width:${pct}%"></i></div></button>`}).join("")}</div>`;$$('[data-skill-detail]',content).forEach((button) => button.onclick = () => renderSkillTree(button.dataset.skillDetail));
  }
  if(name==="inventory"){
    const entries=Object.entries(game.inventory).filter(([,q])=>q>0);const craftable=ALL_RECIPES.filter(r=>r.levelRequired<=Math.max(10,levelFromXp(game.skills[r.skillId]||0))).slice(0,10);content.innerHTML=`<p class="eyebrow">${game.player.sableMarks} sable marks · ${entries.length}/36 slots</p><div class="inventory-grid">${entries.map(([id,q])=>{const item=itemDef(id);return `<button class="item-slot"><span class="icon">${item.icon}</span><b>${q}</b><small><strong>${item.name}</strong><br>${item.description}</small></button>`}).join("")}${Array.from({length:Math.max(0,18-entries.length)},()=>`<div class="item-slot"></div>`).join("")}</div><p class="field-label">Field recipes</p>${craftable.map(r=>`<div class="journal-entry"><i></i><div><strong>${r.icon} ${r.name}</strong><p>${r.ingredients.map(i=>`${i.quantity} ${itemDef(i.itemId).name}`).join(" · ")}</p></div><button class="ghost" data-craft="${r.id}">Craft</button></div>`).join("")}`;$$('[data-craft]',content).forEach(b=>b.onclick=()=>craft(b.dataset.craft));
  }
  if(name==="quests")content.innerHTML=QUESTS.map(q=>{const s=questState(q.id);return `<div class="journal-entry" data-track="${q.id}"><i></i><div><strong>${q.title}</strong><p>${q.summary}</p></div><span>${s.status}</span></div>`}).join("");$$('[data-track]',content).forEach(e=>e.onclick=()=>{if(questState(e.dataset.track).status!=="locked"){game.trackedQuest=e.dataset.track;renderQuestTracker();}});
  if(name==="world"){content.innerHTML=`<div id="reference-atlas-host" class="reference-atlas-host" role="region" aria-label="Sable Reach reference atlas">${legacyAtlasFallbackMarkup()}</div><section id="ecology-proof-host" aria-live="polite"><p class="form-intro">Select a proof location on the atlas to inspect its prototype-playable family encounters.</p></section>`;dispatchEvent(new CustomEvent("world-atlas-open"));}
  if(name==="bestiary")content.innerHTML=`<p class="form-intro">${ENEMIES.length} authored enemies across ${ENEMY_FAMILIES.length} ecological families. “Placed” entries have runtime encounters; “design” entries are validated production specifications whose deeper counterplay and phases are not yet live.</p><div class="family-strip">${ENEMY_FAMILIES.map((family) => `<article><b>${family.name}</b><span>${ENEMIES.filter((enemy) => enemy.familyId === family.id).length} forms</span><small>${family.ecology}</small></article>`).join("")}</div><div class="bestiary-grid">${ENEMIES.map((enemy) => {const signature=enemy.moves.at(-1),family=ENEMY_FAMILIES.find((entry)=>entry.id===enemy.familyId),placed=ENCOUNTER_SPAWNS.some((spawn)=>spawn.enemyId===enemy.id),frontier=enemy.availability==="planned_frontier";return `<article class="enemy-codex-card" data-bestiary-entry="${enemy.id}" data-content-status="${placed?"placed":"design"}"><header><span>${enemy.rank} · ${enemy.combatRole}</span><b>Lv ${enemy.levelRange[0]}–${enemy.levelRange[1]}</b></header><div class="status-row"><i>${placed?"PLACED":"DESIGN"}</i>${frontier?"<i>FRONTIER</i>":enemy.availability==="revisit_encounter"?"<i>REVISIT</i>":""}<small>${family.name} · ${enemy.regions.map((region)=>region.replaceAll("_"," ")).join(" / ")}</small></div><h3>${enemy.name}</h3><p>${enemy.lore}</p><dl><dt>Signature</dt><dd>${signature.name}</dd><dt>Authored counter</dt><dd>${signature.counterplay}</dd><dt>Weak</dt><dd>${enemy.weaknessTags.join(" · ")}</dd></dl></article>`}).join("")}</div>`;
  if(name==="lore")content.innerHTML=`<p class="form-intro">${CHARACTER_DEFINITIONS.length} named inhabitants and ${CHARACTER_RELATIONSHIPS.length} authored relationship hooks bind the Reach's seven competing factions. Placement badges distinguish the playable slice from future arcs; private story state remains sealed.</p><div class="faction-grid">${FACTIONS.map((faction) => `<article class="faction-card"><span>${faction.homeRegion.replaceAll("_", " ")}</span><h3>${faction.name}</h3><p>${faction.ethos}</p><small>${faction.publicGoal}</small><div class="locked-lore">◇ Buried conflict · undiscovered</div></article>`).join("")}</div><p class="field-label">People of the Reach</p><div class="character-codex">${CHARACTER_DEFINITIONS.map((character) => `<article data-character-entry="${character.id}" data-content-status="${character.placed?"placed":"planned"}"><header><span>${FACTIONS.find((faction) => faction.id === character.factionId)?.name || "Unaffiliated"}</span><b>${character.regionId.replaceAll("_", " ")}</b></header><div class="status-row"><i>${character.placed?"PLACED":"PLANNED"}</i><small>Story hook · ${character.questArcs[0].title}</small></div><h3>${character.name}</h3><em>${character.role}</em><p>${character.motivations[0]}</p><small>${character.dialogueVoice.sampleLine}</small><div class="locked-lore">◇ Private truth · undiscovered</div></article>`).join("")}</div><p class="field-label">Relationship hooks · undiscovered design layer</p><div class="relationship-codex">${CHARACTER_RELATIONSHIPS.map(()=>`<article><div class="locked-lore">◇ Relationship identity and detail · undiscovered</div></article>`).join("")}</div>`;
  if(name==="character"){
    const origin=ORIGINS.find(o=>o.id===game.character.origin),vow=VOWS.find(v=>v.id===game.character.vow);content.innerHTML=`<div class="character-sheet"><div class="paper-doll"><img src="${originArtPath(game.character.origin)}" alt="${origin.label} character render"></div><div><div class="sheet-title"><h3>${game.character.name}</h3><p>${origin.label} · ${vow.label}</p></div><div class="sheet-attrs">${ATTRIBUTES.map(a=>`<div class="sheet-stat"><b>${a.abbreviation}</b><strong>${game.character.attributes[a.id]}</strong><small>${a.label}</small></div>`).join("")}</div><p class="field-label">Oath</p><p class="form-intro">${vow.description}</p></div></div>`;
  }
  if(name==="help")content.innerHTML=`<p class="form-intro">Click any walkable place to path there. Click people, enemies, harvest nodes, and landmarks to approach and act.</p><div class="help-list"><kbd>WASD</kbd><span>Move freely</span><kbd>Click</kbd><span>Pathfind, target, and interact</span><kbd>1 / F</kbd><span>Light attack</span><kbd>2 / R</kbd><span>Heavy attack</span><kbd>Space</kbd><span>Dodge with brief invulnerability</span><kbd>4 / Q</kbd><span>Drink from the vigil flask</span><kbd>E</kbd><span>Use the nearest person, node, or landmark</span><kbd>I · K · J · M · B · L · C</kbd><span>Open pack, skills, journal, atlas, bestiary, lore, or character</span><kbd>Esc</kbd><span>Close the current overlay</span></div>`;
}

const creatorSteps=["Identity","Origin","Appearance","Attributes","Vow","Confirm"];
function openCreator(){draftCharacter=clone(DEFAULT_CHARACTER);creatorStep=0;$("#title-screen").hidden=true;$("#creator").hidden=false;renderCreator();}
function renderCreator(){
  $("#creator-steps").innerHTML=creatorSteps.map((_,i)=>`<i class="${i<=creatorStep?"active":""}"></i>`).join("");const form=$("#creator-form");const origin=ORIGINS.find(o=>o.id===draftCharacter.origin);$("#preview-name").textContent=draftCharacter.name||"The Unnamed";$("#preview-epithet").textContent=origin.epithet;$("#origin-art").src=originArtPath(draftCharacter.origin);$("#origin-art").alt=`Gaunt ${origin.label} origin character`;$("#creator").classList.add("show-origin-art");$("#creator").classList.toggle("show-morph-profile",creatorStep===2);drawPortrait(portraitCanvas,draftCharacter);
  const optionCards=(options,path)=>`<div class="option-grid">${options.map(o=>`<button class="option-card ${getPath(draftCharacter,path)===o.id?"selected":""}" data-choice="${path}" data-value="${o.id}"><strong>${o.label}</strong><span>${o.description||o.lore||""}</span>${o.epithet?`<em>${o.epithet}</em>`:""}</button>`).join("")}</div>`;
  if(creatorStep===0)form.innerHTML=`<p class="form-intro">Names have weight in the Veyl. Choose the one the bells will remember, and how its keepers will speak of you.</p><label class="field-label" for="creator-name">Pilgrim's name</label><input id="creator-name" class="text-field" maxlength="24" value="${draftCharacter.name}"/><span class="field-label">Pronouns</span>${optionCards(BODY_OPTIONS.pronouns,"pronoun")}`;
  if(creatorStep===1)form.innerHTML=`<p class="form-intro">No one reaches Hearthmere untouched. Your former life grants a small head start, a handful of tools, and complications yet to be collected.</p><span class="field-label">Choose an origin</span>${optionCards(ORIGINS,"origin")}`;
  if(creatorStep===2)form.innerHTML=`<p class="form-intro">Shape a face weathered by the Ninth Dimming. Appearance never locks equipment, attributes, or romance paths.</p><div class="select-row">${selectField("Body",BODY_OPTIONS.bodies,"appearance.body")}${selectField("Face",BODY_OPTIONS.faces,"appearance.face")}${selectField("Hair",BODY_OPTIONS.hair,"appearance.hair")}${selectField("Marking",BODY_OPTIONS.markings,"appearance.marking")}</div>${swatchField("Skin",APPEARANCE_PALETTES.skin,"appearance.skin")}${swatchField("Hair color",APPEARANCE_PALETTES.hair,"appearance.hairColor")}${swatchField("Eyes",APPEARANCE_PALETTES.eye,"appearance.eye")}<span class="field-label">Fine shaping</span><div class="morph-grid">${BODY_OPTIONS.morphs.map(m=>`<div class="morph-row"><label>${m.label}</label><input type="range" min="-1" max="1" step=".05" value="${draftCharacter.appearance.morphs[m.id]}" data-morph="${m.id}"/></div>`).join("")}</div>`;
  if(creatorStep===3){const budget=attributeBudget();form.innerHTML=`<div class="budget">${budget} points remaining</div><p class="form-intro">Attributes define combat resources and dialogue possibilities. Discipline skills still grow independently through use.</p><div class="attribute-list">${ATTRIBUTES.map(a=>`<div class="attribute-row"><b>${a.abbreviation}</b><strong>${a.label}</strong><span>${a.description}</span><div class="stat-stepper"><button data-stat="${a.id}" data-delta="-1">−</button><output>${draftCharacter.attributes[a.id]}</output><button data-stat="${a.id}" data-delta="1">+</button></div></div>`).join("")}</div>`;}
  if(creatorStep===4)form.innerHTML=`<p class="form-intro">A vow is an optional rule you place upon yourself. Its strength always carries a cost. Remain Unbound if you prefer no modifier.</p><span class="field-label">Choose your vow</span>${optionCards(VOWS,"vow")}`;
  if(creatorStep===5){const vow=VOWS.find(v=>v.id===draftCharacter.vow);form.innerHTML=`<p class="eyebrow">The road opens</p><h2>${draftCharacter.name}</h2><p class="form-intro">${origin.lore}</p><p class="field-label">Origin</p><p>${origin.label} · ${origin.epithet}</p><p class="field-label">Vow</p><p>${vow.label}<br><span class="form-intro">${vow.description}</span></p><p class="field-label">Starting attributes</p><div class="sheet-attrs">${ATTRIBUTES.map(a=>`<div class="sheet-stat"><b>${a.abbreviation}</b><strong>${draftCharacter.attributes[a.id]}</strong><small>${a.label}</small></div>`).join("")}</div>`;}
  bindCreatorInputs();$("[data-action='creator-back']").textContent=creatorStep===0?"Cancel":"Back";$("[data-action='creator-next']").textContent=creatorStep===creatorSteps.length-1?"Enter the March":"Continue";$("#creator-hint").textContent=["Names are the first promises.","Every past leaves a tool and a debt.","No feature changes your potential.","Spend all twelve free attribute points.","Power answers chosen limits.","The bell waits for no perfect pilgrim."][creatorStep];
}
function getPath(object,path){return path.split(".").reduce((value,key)=>value[key],object)}function setPath(object,path,value){const parts=path.split(".");const key=parts.pop();const target=parts.reduce((v,k)=>v[k],object);target[key]=value;}
function selectField(label,options,path){return `<label><span class="field-label">${label}</span><select class="select-box" data-select="${path}">${options.map(o=>`<option value="${o.id}" ${getPath(draftCharacter,path)===o.id?"selected":""}>${o.label}</option>`).join("")}</select></label>`;}
function swatchField(label,options,path){return `<span class="field-label">${label}</span><div class="swatches">${options.map(o=>`<button class="swatch ${getPath(draftCharacter,path)===o.id?"selected":""}" style="background:${o.color}" title="${o.label}" data-choice="${path}" data-value="${o.id}"></button>`).join("")}</div>`;}
function attributeBudget(){return ATTRIBUTES.reduce((sum,a)=>sum+a.base,0)+12-Object.values(draftCharacter.attributes).reduce((a,b)=>a+b,0);}
function bindCreatorInputs(){
  const name=$("#creator-name");if(name)name.oninput=()=>{draftCharacter.name=name.value;$("#preview-name").textContent=name.value||"The Unnamed";};
  $$('[data-choice]').forEach(b=>b.onclick=()=>{setPath(draftCharacter,b.dataset.choice,b.dataset.value);renderCreator();});
  $$('[data-select]').forEach(s=>s.onchange=()=>{setPath(draftCharacter,s.dataset.select,s.value);renderCreator();});
  $$('[data-morph]').forEach(r=>r.oninput=()=>{draftCharacter.appearance.morphs[r.dataset.morph]=Number(r.value);drawPortrait(portraitCanvas,draftCharacter);});
  $$('[data-stat]').forEach(b=>b.onclick=()=>{const a=ATTRIBUTES.find(x=>x.id===b.dataset.stat),delta=Number(b.dataset.delta),current=draftCharacter.attributes[a.id];if(current+delta<a.min||current+delta>a.creationMax||(delta>0&&attributeBudget()<=0))return;draftCharacter.attributes[a.id]+=delta;renderCreator();});
}

function drawPortrait(target,character,compact=false){
  const c=target.getContext("2d"),w=target.width,h=target.height,s=characterSilhouette(character);
  c.clearRect(0,0,w,h);const scale=(compact?2.85:4.7)*h/650;c.save();c.translate(w/2,h*.9);c.scale(scale,scale);
  const bh=s.body.height,shoulder=s.body.shoulderWidth*.84,hip=s.body.hipWidth*.82,limb=s.body.limbWidth*.58;
  const originTones={gloamfarer:"#3f5455",bell_warden:"#4d4d52",grave_tithe_runner:"#4b3e43",mire_physicker:"#40534b",oathless_scion:"#4c4758",cinder_mason:"#57443b",starved_seer:"#454158",thorn_poacher:"#3d5043"};
  const cloth=originTones[character.origin]||"#465052";
  const aura=c.createRadialGradient(0,-55,5,0,-55,92);aura.addColorStop(0,"rgba(112,137,132,.19)");aura.addColorStop(1,"rgba(8,11,12,0)");c.fillStyle=aura;c.fillRect(-120,-155,240,175);
  c.fillStyle="rgba(0,0,0,.48)";c.beginPath();c.ellipse(0,1,50,7,0,0,Math.PI*2);c.fill();

  // Back cloak, with a slightly asymmetric travel-worn hem.
  c.fillStyle="#1d2426";c.beginPath();c.moveTo(-shoulder*.46,-bh*.76);c.quadraticCurveTo(-shoulder*.7,-bh*.46,-hip*.75,-8);c.lineTo(-hip*.12,-4);c.lineTo(hip*.16,-8);c.lineTo(hip*.7,-5);c.quadraticCurveTo(shoulder*.65,-bh*.48,shoulder*.44,-bh*.76);c.closePath();c.fill();
  c.strokeStyle="rgba(167,183,175,.12)";c.lineWidth=.8;c.stroke();

  // Boots, wrapped trousers, and layered knees.
  c.lineCap="round";c.strokeStyle="#15191a";c.lineWidth=limb*.72;c.beginPath();c.moveTo(-hip*.3,-bh*.36);c.lineTo(-hip*.28,-6);c.moveTo(hip*.3,-bh*.36);c.lineTo(hip*.28,-6);c.stroke();
  c.strokeStyle="#34393a";c.lineWidth=limb*.78;c.beginPath();c.moveTo(-hip*.3,-bh*.36);c.lineTo(-hip*.29,-bh*.17);c.moveTo(hip*.3,-bh*.36);c.lineTo(hip*.29,-bh*.17);c.stroke();
  c.strokeStyle="#6b5b44";c.lineWidth=.8;for(let wrap=0;wrap<3;wrap++){const ly=-bh*.17+wrap*3;c.beginPath();c.moveTo(-hip*.29-limb*.4,ly);c.lineTo(-hip*.29+limb*.4,ly+1);c.moveTo(hip*.29-limb*.4,ly);c.lineTo(hip*.29+limb*.4,ly+1);c.stroke();}

  // Arms and gloves sit behind the torso armor.
  c.strokeStyle="#30383a";c.lineWidth=limb*1.08;c.beginPath();c.moveTo(-shoulder*.42,-bh*.7);c.quadraticCurveTo(-shoulder*.58,-bh*.48,-hip*.57,-bh*.3);c.moveTo(shoulder*.42,-bh*.7);c.quadraticCurveTo(shoulder*.58,-bh*.48,hip*.57,-bh*.3);c.stroke();
  c.fillStyle=s.palette.skin;c.beginPath();c.arc(-hip*.57,-bh*.285,limb*.62,0,Math.PI*2);c.arc(hip*.57,-bh*.285,limb*.62,0,Math.PI*2);c.fill();

  // Main tunic: curved shoulders, fitted waist, broad hem.
  const tunic=c.createLinearGradient(-shoulder/2,-bh*.8,shoulder/2,-bh*.32);tunic.addColorStop(0,cloth);tunic.addColorStop(.55,"#303a3b");tunic.addColorStop(1,"#202729");c.fillStyle=tunic;
  c.beginPath();c.moveTo(-shoulder/2,-bh*.76);c.quadraticCurveTo(0,-bh*.84,shoulder/2,-bh*.76);c.lineTo(hip*.56,-bh*.34);c.quadraticCurveTo(0,-bh*.29,-hip*.56,-bh*.34);c.closePath();c.fill();
  c.strokeStyle="rgba(203,207,196,.18)";c.lineWidth=.75;c.stroke();
  c.fillStyle="#313739";c.beginPath();c.ellipse(-shoulder*.42,-bh*.72,shoulder*.16,5,-.28,0,Math.PI*2);c.ellipse(shoulder*.42,-bh*.72,shoulder*.16,5,.28,0,Math.PI*2);c.fill();
  c.fillStyle="#171b1c";c.fillRect(-hip*.5,-bh*.4,hip,-3);c.fillStyle="#8d7446";c.fillRect(-3,-bh*.42,6,6);c.strokeStyle="#c0a467";c.strokeRect(-2.2,-bh*.414,4.4,4.4);
  c.strokeStyle="#826b3f";c.lineWidth=2;c.beginPath();c.moveTo(-shoulder*.42,-bh*.67);c.lineTo(hip*.38,-bh*.39);c.stroke();
  c.strokeStyle="rgba(218,196,135,.25)";c.lineWidth=.6;c.beginPath();c.moveTo(-shoulder*.41,-bh*.68);c.lineTo(hip*.39,-bh*.4);c.stroke();

  // Neck and face planes.
  const headY=-bh*.88,headR=12*s.head.scale;c.fillStyle=s.palette.skin;c.fillRect(-headR*.28,headY+headR*.65,headR*.56,headR*.8);
  c.beginPath();c.ellipse(0,headY,headR*(1+s.head.jaw*.06),headR*1.16,0,0,Math.PI*2);c.fill();
  c.fillStyle="rgba(35,24,22,.28)";c.beginPath();c.ellipse(-headR*.45,headY+headR*.2,headR*.3,headR*.5,-.2,0,Math.PI*2);c.ellipse(headR*.42,headY+headR*.22,headR*.25,headR*.45,.2,0,Math.PI*2);c.fill();

  // Hair silhouettes retain length/volume choices, including gathered styles.
  c.fillStyle=s.palette.hair;if(s.hair.style!=="none"){
    c.beginPath();c.ellipse(0,headY-headR*.42,headR*(1+s.hair.volume*.16),headR*.82,0,Math.PI,Math.PI*2);c.fill();
    if(s.hair.length>.2){const fall=headR*(.6+s.hair.length*2);c.beginPath();c.moveTo(-headR,headY-headR*.35);c.quadraticCurveTo(-headR*1.2,headY+fall*.45,-headR*.62,headY+fall);c.lineTo(-headR*.2,headY+headR*.3);c.closePath();c.fill();c.beginPath();c.moveTo(headR,headY-headR*.35);c.quadraticCurveTo(headR*1.2,headY+fall*.45,headR*.62,headY+fall);c.lineTo(headR*.2,headY+headR*.3);c.closePath();c.fill();}
    if(["knot","coils"].includes(s.hair.style)){c.beginPath();c.arc(0,headY-headR*1.1,headR*(.25+s.hair.volume*.25),0,Math.PI*2);c.fill();}
  }
  const eyeY=headY-2;c.fillStyle="rgba(33,20,22,.34)";c.beginPath();c.ellipse(-4.4,eyeY+.2,4.8,2.8,-.08,0,Math.PI*2);c.ellipse(4.4,eyeY+.2,4.8,2.8,.08,0,Math.PI*2);c.fill();c.strokeStyle="rgba(30,22,22,.72)";c.lineWidth=.9;c.beginPath();c.moveTo(-7,eyeY-2.4);c.lineTo(-2,eyeY-3.1);c.moveTo(2,eyeY-3.1);c.lineTo(7,eyeY-2.4);c.stroke();
  c.fillStyle=s.palette.eye;c.shadowColor=s.palette.eye;c.shadowBlur=s.palette.eyeGlow*25;c.beginPath();c.arc(-4.2*(1+s.head.eyeSpacing),eyeY,1.15*s.head.eyeScale,0,Math.PI*2);c.arc(4.2*(1+s.head.eyeSpacing),eyeY,1.15*s.head.eyeScale,0,Math.PI*2);c.fill();c.shadowBlur=0;
  c.strokeStyle="rgba(55,35,29,.55)";c.lineWidth=.8;c.beginPath();c.moveTo(0,eyeY+1);c.lineTo(-1,eyeY+5+s.head.nose*1.5);c.lineTo(1.5,eyeY+5.5);c.moveTo(-3.5,eyeY+9);c.quadraticCurveTo(0,eyeY+10.5,3.5,eyeY+9);c.stroke();
  c.strokeStyle="rgba(104,77,60,.32)";c.lineWidth=.45;for(let vein=0;vein<3;vein++){c.beginPath();c.moveTo(-headR*.72+vein*2,headY-4+vein*3);c.quadraticCurveTo(-headR*.2,headY+vein*2,headR*.55,headY-6+vein*5);c.stroke();}
  if(s.marking.pattern!=="none"){c.strokeStyle=s.palette.marking;c.globalAlpha=s.marking.opacity;c.lineWidth=1.2;c.beginPath();c.moveTo(-headR*.65,headY-7);c.lineTo(headR*.42,headY+9);c.stroke();c.globalAlpha=1;}
  c.restore();
}

function beginGame(character){game=baseState(clone(character));$("#creator").hidden=true;$("#title-screen").hidden=true;$("#hud").hidden=false;$("#death-screen").hidden=true;scrollTo(0,0);renderQuestTracker();updateHud();saveGame();canvas.focus({preventScroll:true});dispatchEvent(new CustomEvent("world-character-ready"));toast(`Welcome to the Veyl, <b>${character.name}</b>`);}
function continueGame(){if(loadGame()){$("#title-screen").hidden=true;$("#hud").hidden=false;$("#death-screen").hidden=true;scrollTo(0,0);renderQuestTracker();updateHud();canvas.focus({preventScroll:true});dispatchEvent(new CustomEvent("world-character-ready"));}}
function respawn(){const p=game.player;p.x=game.respawn.x;p.y=game.respawn.y;p.hp=p.maxHp;p.stamina=p.maxStamina;p.mend=3;p.path=[];game.player.sableMarks=Math.max(0,Math.floor(game.player.sableMarks*.9));$("#death-screen").hidden=true;saveGame();toast("A vigil flame recalls you");}

function creatorNext(){
  if(creatorStep===0){draftCharacter.name=draftCharacter.name.trim();if(draftCharacter.name.length<2){toast("Choose a name of at least two letters");return;}}
  if(creatorStep===3&&attributeBudget()!==0){toast(`Spend the remaining ${attributeBudget()} attribute points`);return;}
  if(creatorStep<creatorSteps.length-1){creatorStep++;renderCreator();return;}
  const validation=validateCharacter(draftCharacter);if(!validation.valid){toast(validation.errors[0].message);return;}beginGame(draftCharacter);
}

function keyboard(event,down){
  const key=event.key.toLowerCase();if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"," "].includes(key))event.preventDefault();
  if(down)keys.add(key);else keys.delete(key);if(!down||$("#hud").hidden)return;
  if(key==="1"||key==="f"){if(!requestAuthoritativeAction("light_attack"))attack("light");}if(key==="2"||key==="r"){if(!requestAuthoritativeAction("heavy_attack"))attack("heavy");}if(key===" "||key==="3"){if(!requestAuthoritativeAction("dodge"))dodge();}if(key==="4"||key==="q"){if(!worldAuthorityBridge?.isConnected?.())mend();}if(key==="e"){if(!requestAuthoritativeAction("interact"))interactNearby();}
  if(key==="i")openPanel("inventory");if(key==="k")openPanel("skills");if(key==="j")openPanel("quests");if(key==="m")openPanel("world");if(key==="b")openPanel("bestiary");if(key==="l")openPanel("lore");if(key==="c")openPanel("character");if(key==="escape"){currentPanel=null;$("#panel").hidden=true;$("#dialogue").hidden=true;}
}

function bindEvents(){
  addEventListener("resize",resize);canvas.addEventListener("click",handleWorldClick);canvas.addEventListener("mousemove",event=>{const r=canvas.getBoundingClientRect();pointer.x=event.clientX-r.left;pointer.y=event.clientY-r.top;pointer.tile=screenToTile(pointer.x,pointer.y);});addEventListener("keydown",e=>keyboard(e,true));addEventListener("keyup",e=>keyboard(e,false));
  $$('[data-action]').forEach(button=>button.addEventListener("click",()=>{const a=button.dataset.action;if(a==="new-game")openCreator();if(a==="continue")continueGame();if(a==="creator-next")creatorNext();if(a==="creator-back"){if(creatorStep>0){creatorStep--;renderCreator();}else{$("#creator").hidden=true;$("#title-screen").hidden=false;}}if(a==="close-panel")openPanel(currentPanel);if(a==="respawn")respawn();}));
  $$('[data-panel]').forEach(button=>button.addEventListener("click",()=>openPanel(button.dataset.panel)));$$('[data-hotkey]').forEach(button=>button.addEventListener("click",()=>{const action=Number(button.dataset.hotkey);if(action===1&&!requestAuthoritativeAction("light_attack"))attack("light");if(action===2&&!requestAuthoritativeAction("heavy_attack"))attack("heavy");if(action===3&&!requestAuthoritativeAction("dodge"))dodge();if(action===4&&!worldAuthorityBridge?.isConnected?.())mend();if(action===5){game.player.lantern=!game.player.lantern;toast(`Lantern ${game.player.lantern?"lit":"hooded"}`);}}));
}

function loop(now){const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;update(dt);render();requestAnimationFrame(loop);}

resize();bindEvents();$("[data-action='continue']").hidden=!localStorage.getItem(SAVE_KEY);drawPortrait(portraitCanvas,draftCharacter);requestAnimationFrame(loop);setInterval(()=>{if(!$("#hud").hidden)saveGame();},15000);
