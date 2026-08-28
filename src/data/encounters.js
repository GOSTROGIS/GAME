/** Data-driven placements for the vertical slice. Future regions can supply chunks. */
export const ENCOUNTER_SPAWNS = Object.freeze([
  { id: "hearthmere_ash_01", enemyId: "ash_husk", regionId: "hearthmere", position: { x: 6, y: 8 } },
  { id: "march_ash_01", enemyId: "ash_husk", regionId: "graven_march", position: { x: 4, y: 15 } },
  { id: "march_ash_02", enemyId: "ash_husk", regionId: "graven_march", position: { x: 6, y: 18 } },
  { id: "hearthmere_ledger_01", enemyId: "ledger_crawler", regionId: "hearthmere", position: { x: 5, y: 8 } },
  { id: "march_hound_01", enemyId: "cairn_hound", regionId: "graven_march", position: { x: 7, y: 19 } },
  { id: "march_hound_02", enemyId: "cairn_hound", regionId: "graven_march", position: { x: 15, y: 5 } },
  { id: "march_archer_01", enemyId: "wax_seal_archer", regionId: "graven_march", position: { x: 10, y: 19 } },
  { id: "march_sapper_01", enemyId: "sealed_sapper", regionId: "graven_march", position: { x: 17, y: 5 } },
  { id: "dunmire_bound_01", enemyId: "mirebound", regionId: "dunmire", position: { x: 10, y: 10 } },
  { id: "dunmire_bound_02", enemyId: "mirebound", regionId: "dunmire", position: { x: 19, y: 13 } },
  { id: "dunmire_bound_03", enemyId: "mirebound", regionId: "dunmire", position: { x: 20, y: 15 } },
  { id: "dunmire_bound_04", enemyId: "mirebound", regionId: "dunmire", position: { x: 18, y: 14 } },
  { id: "dunmire_witch_01", enemyId: "reed_witch", regionId: "dunmire", position: { x: 19, y: 12 } },
  { id: "dunmire_charm_01", enemyId: "bog_charm_tender", regionId: "dunmire", position: { x: 18, y: 13 } },
  { id: "cinder_thrall_01", enemyId: "kiln_thrall", regionId: "cinderward", position: { x: 24, y: 5 } },
  { id: "cinder_thrall_02", enemyId: "kiln_thrall", regionId: "cinderward", position: { x: 25, y: 8 } },
  { id: "cinder_thrall_03", enemyId: "kiln_thrall", regionId: "cinderward", position: { x: 26, y: 10 } },
  { id: "cinder_rusk", enemyId: "kiln_knight_rusk", regionId: "cinderward", position: { x: 29, y: 11 }, unique: true },
  { id: "abbey_monk_01", enemyId: "hush_monk", regionId: "hollow_abbey", position: { x: 25, y: 17 } },
  { id: "abbey_monk_02", enemyId: "hush_monk", regionId: "hollow_abbey", position: { x: 29, y: 18 } },
  { id: "abbey_monk_03", enemyId: "hush_monk", regionId: "hollow_abbey", position: { x: 26, y: 18 } },
  { id: "abbey_monk_04", enemyId: "hush_monk", regionId: "hollow_abbey", position: { x: 29, y: 20 } },
  { id: "abbey_monk_05", enemyId: "hush_monk", regionId: "hollow_abbey", position: { x: 26, y: 20 } },
  { id: "abbey_cantor", enemyId: "cantor_oss", regionId: "hollow_abbey", position: { x: 27, y: 21 }, unique: true },
]);

export const ENCOUNTERS = Object.freeze([
  { id: "hearthmere_broken_ledger", regionId: "hearthmere", tier: "intro", spawnIds: ["hearthmere_ash_01", "hearthmere_ledger_01"], budget: [2, 2], activation: { center: { x: 6, y: 8 }, radius: 4 }, roleIntent: "A slow bruiser pins the road while a skirmisher punishes tunnel vision.", reset: "wayshrine_or_45_seconds" },
  { id: "march_sealed_patrol", regionId: "graven_march", tier: "field", spawnIds: ["march_ash_01", "march_ash_02", "march_hound_01", "march_hound_02", "march_archer_01", "march_sapper_01"], budget: [3, 6], activation: { center: { x: 10, y: 16 }, radius: 14 }, roleIntent: "Hounds displace the player into an archer lane while the sapper seals the easiest retreat.", reset: "leave_region_or_45_seconds" },
  { id: "dunmire_drowned_procession", regionId: "dunmire", tier: "field", spawnIds: ["dunmire_bound_01", "dunmire_bound_02", "dunmire_bound_03", "dunmire_bound_04", "dunmire_witch_01", "dunmire_charm_01"], budget: [3, 6], activation: { center: { x: 17, y: 13 }, radius: 8 }, roleIntent: "Mirebound claim causeway space while coven support and control punish standing in water.", reset: "leave_region_or_45_seconds" },
  { id: "cinderward_cooling_line", regionId: "cinderward", tier: "field", spawnIds: ["cinder_thrall_01", "cinder_thrall_02", "cinder_thrall_03"], budget: [2, 3], activation: { center: { x: 25, y: 8 }, radius: 6 }, roleIntent: "Kiln bruisers alternate pressure across narrow foundry lanes and cooling pockets.", reset: "leave_region_or_45_seconds" },
  { id: "cinderward_royal_seal", regionId: "cinderward", tier: "boss", spawnIds: ["cinder_rusk"], budget: [1, 1], activation: { center: { x: 29, y: 11 }, radius: 4 }, roleIntent: "A duel set piece teaches delayed heat telegraphs and awards the Abbey gate key.", reset: "unique_persistent" },
  { id: "abbey_silent_office", regionId: "hollow_abbey", tier: "field", spawnIds: ["abbey_monk_01", "abbey_monk_02", "abbey_monk_03", "abbey_monk_04", "abbey_monk_05"], budget: [2, 5], activation: { center: { x: 27, y: 18 }, radius: 6 }, roleIntent: "Duelists stagger their cadence across side aisles, forcing varied attack timing.", reset: "leave_region_or_45_seconds" },
  { id: "abbey_last_litany", regionId: "hollow_abbey", tier: "boss", spawnIds: ["abbey_cantor"], budget: [1, 1], activation: { center: { x: 27, y: 21 }, radius: 4 }, roleIntent: "A controller boss owns the crypt until its voice is silenced and the Clapper can be reached.", reset: "unique_persistent" },
]);

export function validateEncounterSpawns(enemyRegistry, isWalkable, regionResolver = null, spawns = ENCOUNTER_SPAWNS) {
  const errors = [];
  const ids = new Set();
  const hasEnemy = (id) => enemyRegistry instanceof Set ? enemyRegistry.has(id) : Boolean(enemyRegistry?.[id]);
  for (const spawn of spawns) {
    if (ids.has(spawn.id)) errors.push(`Duplicate spawn ID ${spawn.id}`);
    ids.add(spawn.id);
    if (!hasEnemy(spawn.enemyId)) errors.push(`${spawn.id} references missing enemy ${spawn.enemyId}`);
    if (!isWalkable(spawn.position.x, spawn.position.y)) errors.push(`${spawn.id} is placed on blocked terrain`);
    if (!spawn.regionId) errors.push(`${spawn.id} has no declared region`);
    if (regionResolver && regionResolver(spawn.position.x, spawn.position.y)?.id !== spawn.regionId) errors.push(`${spawn.id} resolves outside declared region ${spawn.regionId}`);
    const definition = enemyRegistry instanceof Set ? null : enemyRegistry?.[spawn.enemyId];
    if (definition && !definition.regionIds.includes(spawn.regionId)) errors.push(`${spawn.id} places ${spawn.enemyId} outside its authored regions`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateEncounterGroups(encounters = ENCOUNTERS, spawns = ENCOUNTER_SPAWNS) {
  const errors = [];
  const encounterIds = new Set();
  const spawnById = new Map(spawns.map((spawn) => [spawn.id, spawn]));
  const ownership = new Map();
  for (const encounter of encounters) {
    if (encounterIds.has(encounter.id)) errors.push(`Duplicate encounter ID ${encounter.id}`);
    encounterIds.add(encounter.id);
    if (!Array.isArray(encounter.spawnIds) || !encounter.spawnIds.length) errors.push(`${encounter.id} has no roster`);
    if (!Array.isArray(encounter.budget) || encounter.budget[0] < 1 || encounter.budget[1] < encounter.budget[0]) errors.push(`${encounter.id} has an invalid budget`);
    if (!encounter.activation?.center || !(encounter.activation.radius > 0) || !encounter.roleIntent || !encounter.reset) errors.push(`${encounter.id} lacks activation, intent, or reset rules`);
    for (const spawnId of encounter.spawnIds || []) {
      const spawn = spawnById.get(spawnId);
      if (!spawn) { errors.push(`${encounter.id} references missing spawn ${spawnId}`); continue; }
      if (spawn.regionId !== encounter.regionId) errors.push(`${encounter.id} owns cross-region spawn ${spawnId}`);
      if (encounter.activation?.center && Math.hypot(spawn.position.x - encounter.activation.center.x, spawn.position.y - encounter.activation.center.y) > encounter.activation.radius) errors.push(`${spawnId} lies outside ${encounter.id}'s activation radius`);
      if (ownership.has(spawnId)) errors.push(`${spawnId} belongs to both ${ownership.get(spawnId)} and ${encounter.id}`);
      ownership.set(spawnId, encounter.id);
    }
  }
  for (const spawn of spawns) if (!ownership.has(spawn.id)) errors.push(`${spawn.id} has no encounter owner`);
  return { valid: errors.length === 0, errors };
}
