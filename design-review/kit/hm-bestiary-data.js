/* =========================================================================
   hm-bestiary-data.js — recovered from repo source
   -------------------------------------------------------------------------
   WHY THIS FILE EXISTS. `Hollow March Character Audit.dc.html` was deleted
   this session as "superseded by the Art Bible". It was not superseded: the
   Art Bible has no equivalent of its encounter-role, ecological-family,
   origin or ambient-life sections. A project-wide grep after the deletion
   returned nothing for content that had been visible an hour earlier.

   Recovery path: that page was a VIEW of repository data, so the canonical
   half is re-readable rather than gone. Everything marked `source: 'repo'`
   below is transcribed from Ostrowidzki1989/sable-reach@main —
   `packages/content/src/bestiary.data.js` — read 2026-08-27, not recalled.

   What is NOT recoverable that way: the movement and turn-economy prose in
   that page was AUTHORED, not read from the repo. Fragments held verbatim
   are carried across and marked `recovered: true`. The rest is marked
   `lost: true` with an empty string rather than paraphrased — a plausible
   rewrite of authored prose is the same failure the manifest law forbids
   for art, and it applies to writing too.
   ========================================================================= */

export const PROVENANCE = {
  recoveredFrom: 'Ostrowidzki1989/sable-reach@main',
  files: ['packages/content/src/bestiary.data.js', 'src/data/characters.js'],
  readOn: '2026-08-27',
  lostIn: 'Hollow March Character Audit.dc.html (deleted 2026-08-26)',
  /* GitHub was unlinked immediately after this read. Google Drive is now the
     only external source. That makes this file the VENDORED copy of the
     canonical data rather than a cache of a live source — which is the state
     it should have been in from the start, and the same argument that applies
     to the concept-art plates: a project that depends on an external fetch
     loses the data the moment access changes. Nothing here needs re-fetching.
     If the numbers below ever have to be reconciled again, the authority is
     Drive, not this file. */
  sourceNowUnavailable: true,
  currentSource: 'Google Drive working folder',
  vendored: true,
  note: 'Canonical data vendored locally before GitHub access ended. Authored prose partially unrecoverable and marked as such.',
};

/* ---------------------------------------------------------------- roles
   Ten encounter roles. `id`, `label` and `purpose` are repo-exact. `world`
   and `turn` were authored in the deleted page; three survived in a grep
   transcript and are carried verbatim. */
export const ENCOUNTER_ROLES = [
  { id: 'bruiser', label: 'Bruiser', purpose: 'Claims space with slow, punishing attacks.', t: [0.7, 0.34, 0.92], world: '', turn: '', lost: true },
  { id: 'skirmisher', label: 'Skirmisher', purpose: 'Tests spacing with rapid entries and retreats.', t: [0.42, 0.24, 0.56], world: '', turn: '', lost: true },
  { id: 'controller', label: 'Controller', purpose: 'Changes terrain, movement, or safe positioning.', t: [0.9, 0.46, 1.05], recovered: true,
    world: 'It advances only while the surrounding escape geometry is changing.',
    turn: 'Cannot move and act in the same turn. Its move phase reshapes two tiles; its action phase punishes whoever is still standing in them.' },
  { id: 'artillery', label: 'Artillery', purpose: 'Applies ranged pressure with readable firing lanes.', t: [1.08, 0.3, 1.12], recovered: true,
    world: 'It relocates only while its firing anatomy is occluded or recovering.',
    turn: 'Five AP and the longest telegraph in the system. The firing lane is drawn on the grid a full turn before it resolves.' },
  { id: 'ambusher', label: 'Ambusher', purpose: 'Begins from concealment and punishes careless travel.', t: [0.48, 0.28, 0.72], recovered: true,
    world: 'It translates only across unobserved seams and becomes rigid under direct witness.',
    turn: 'Three AP to translate between any two unwatched tiles. Being looked at costs it its whole turn, so player facing is a real resource.' },
  { id: 'support', label: 'Support', purpose: 'Empowers allies or weakens the player.', t: [0.82, 0.4, 0.88], world: '', turn: '', lost: true },
  { id: 'duelist', label: 'Duelist', purpose: 'Responds to cadence, defense, and repeated patterns.', t: [0.58, 0.22, 0.66], world: '', turn: '', lost: true },
  { id: 'swarm', label: 'Swarm', purpose: 'Threatens through numbers, flanks, and interruption.', t: [0.36, 0.5, 0.62], world: '', turn: '', lost: true },
  { id: 'hunter', label: 'Hunter', purpose: 'Tracks vulnerable targets and denies retreat.', t: [0.64, 0.32, 0.7], world: '', turn: '', lost: true },
  { id: 'juggernaut', label: 'Juggernaut', purpose: 'Acts as a durable mobile objective.', t: [1.2, 0.52, 1.2], world: '', turn: '', lost: true },
];

/* -------------------------------------------------------------- families
   Twenty-one ecological families, repo-exact on every field except
   `movement`. Habitat numerics omitted here; they are in the repo and not
   what the deleted page displayed. */
const F = (id, name, regions, ecology, material, palette, shape, posture, features, resists, weak, frontier, movement, recovered) =>
  ({ id, name, regions, ecology, material, palette, shape, posture, features, resists, weak, frontier, movement, recovered: !!recovered, lost: !movement, source: 'repo' });

export const ENEMY_FAMILIES = [
  F('ashbound', 'Ashbound', ['hearthmere', 'graven_march'],
    "Bodies animated by names incompletely burned from Hearthmere's clay ledgers.",
    'spent_cinder', ['ash', 'old_cloth', 'ember'], 'human', 'collapsed', ['smoke_seams', 'clay_tags'],
    ['poison', 'sleep'], ['strike', 'radiance'], false, '', false),

  F('cairn_beasts', 'Cairn Beasts', ['graven_march'],
    'Scavengers that nest in warm cairns and carry grave heat through the black-pine food chain.',
    'cairn_fang', ['charcoal_fur', 'grave_lichen', 'warm_stone'], 'beast', 'low', ['stone_growths', 'heat_breath'],
    ['bleed', 'frost'], ['fire', 'pierce'], false, '', false),

  F('march_deserters', 'March Deserters', ['graven_march', 'hearthmere'],
    'Soldiers and camp-followers trapped by sealed orders from a war omitted from every official record.',
    'sealed_order_scrap', ['rust', 'black_wool', 'wax_red'], 'human', 'guarded', ['blank_banners', 'sealed_helms'],
    ['slash', 'fear'], ['lightning', 'backstab'], false,
    'Marches in formation cadence even alone. Step count is fixed by the order it carries, which makes its spacing predictable and its flank open.', true),

  F('drowned_parish', 'Drowned Parish', ['dunmire'],
    'The drowned congregation repeats fragments of its final service whenever the blackwater falls.',
    'drowned_token', ['reed_green', 'silt', 'corpse_pale'], 'human', 'waterlogged', ['reed_halo', 'dripping_robes'],
    ['frost', 'poison'], ['lightning', 'slash'], false, '', false),

  F('reed_coven', 'Reed Coven', ['dunmire'],
    'Mire-workers who learned to bargain with the drowned parish and slowly became part of its wetland rites.',
    'witch_reed', ['pale_reed', 'bog_ink', 'marshlight'], 'human', 'crooked', ['reed_masks', 'hanging_charms'],
    ['hex', 'frost'], ['fire', 'pierce'], false,
    'Crooked gait keyed to charm orientation. Moves only while its hanging charms face away, so its approach is announced by silence, not sound.', true),

  F('kilnforged', 'Kilnforged', ['cinderward'],
    'Foundry workers and royal guards fused into the furnace systems they were ordered to seal.',
    'ember_iron', ['soot_iron', 'furnace_orange', 'scale'], 'armored', 'weighted', ['vent_grilles', 'chain_tendons'],
    ['fire', 'slash'], ['frost', 'strike'], false, '', false),

  F('glasswood', 'Glasswood Brood', ['cinderward'],
    'Fauna cut and remade by iron trees whose sap cools into razor glass.',
    'glasswood_shard', ['obsidian', 'oil_rainbow', 'sap_gold'], 'beast', 'angular', ['glass_antlers', 'translucent_organs'],
    ['slash', 'fire'], ['strike', 'sonic'], false,
    'Angular leaps that only land where light refracts. In darkness it is immobile, which makes lamp discipline a movement mechanic.', true),

  F('hush_order', 'Hush Order', ['hollow_abbey'],
    'Tongueless monastics who guard the abbey by turning combat rhythms into a silent liturgy.',
    'vow_thread', ['chalk_linen', 'verdigris', 'bloodless_gray'], 'human', 'composed', ['stitched_veils', 'prayer_knots'],
    ['hex', 'radiance'], ['thrust', 'bleed'], false, '', false),

  F('echo_choir', 'Echo Choir', ['hollow_abbey'],
    'Voices preserved without bodies, nesting in urns, bells, and hollows within the abbey stone.',
    'resonant_dust', ['bell_bronze', 'violet_echo', 'crypt_black'], 'spectral', 'floating', ['open_mouths', 'sound_rings'],
    ['radiance', 'hex'], ['strike', 'silence'], false, '', false),

  F('ossuary_vermin', 'Ossuary Vermin', ['hollow_abbey', 'graven_march'],
    'Small scavengers that assemble borrowed skeletons into increasingly ambitious communal bodies.',
    'gnawed_relic', ['old_bone', 'mold_green', 'tooth_white'], 'composite', 'scrambling', ['too_many_limbs', 'borrowed_skulls'],
    ['pierce', 'bleed'], ['strike', 'fire'], false, '', false),

  F('bell_revenants', 'Bell Revenants', ['hearthmere', 'dunmire', 'cinderward', 'hollow_abbey'],
    'Consecrated bells sometimes remember their ringers so fiercely that memory takes up arms.',
    'memory_bronze', ['verdigris', 'ember_gold', 'rain_black'], 'armored', 'ceremonial', ['bell_cavities', 'rope_limbs'],
    ['radiance', 'strike'], ['lightning', 'silence'], false, '', false),

  F('salt_waste', 'Salt-Waste Pilgrims', ['salt_waste_frontier'],
    'A future frontier hook: pilgrims cross the eastern salt waste carrying sealed mirrors toward the Reach.',
    'mirror_salt', ['salt_white', 'mirror_blue', 'sunless_gold'], 'robed', 'wind_bent', ['mirror_faces', 'salt_crust'],
    ['frost', 'radiance'], ['water', 'strike'], true,
    "Wind-bent lean sets a single permitted bearing. Turning requires a full stop, which is why the basin's wind direction is level design.", true),

  F('veil_coast', 'Veil-Coast Kin', ['veil_coast_frontier'],
    "A future frontier hook: tide-born raiders follow a moonless current inland, searching for the Bell's missing echo.",
    'black_coral', ['deep_blue', 'coral_red', 'pearl_gray'], 'amphibious', 'swaying', ['coral_armor', 'lantern_organs'],
    ['water', 'bleed'], ['lightning', 'fire'], true,
    'Sways on a tidal period rather than a footstep. Its reachable tiles change with the tide clock, not with its own decisions.', true),

  F('shuttered_ward', 'Shuttered Ward', ['hearthmere', 'dunmire'],
    'Empty pesthouses continue a care regimen whose absent patients answer from sealed beds.',
    'ward_seal', ['boiled_linen', 'lamp_black', 'candle_tallow'], 'humanoid', 'solicitous', ['vacant_aprons', 'inward_hands'],
    ['poison', 'fear'], ['fire', 'silence'], false, '', false),

  F('charnel_measures', 'Charnel Measures', ['graven_march', 'hollow_abbey'],
    'Mortuary clerks obey a storage geometry that folds bodies, rooms, and distances into one inventory.',
    'measure_bone', ['chalk_bone', 'ink_brown', 'crypt_blue'], 'composite', 'right_angled', ['measuring_limbs', 'drawer_ribs'],
    ['bleed', 'pierce'], ['strike', 'fire'], false, '', false),

  F('black_sluice', 'Black Sluice', ['dunmire', 'veil_coast_frontier'],
    'Drainage water copies the dead imperfectly and sends those reflections upstream in search of faces.',
    'sluice_glass', ['pitch_water', 'silver_film', 'reed_green'], 'reflected', 'inverted', ['mirror_skin', 'drain_mouths'],
    ['water', 'hex'], ['lightning', 'radiance'], false, '', false),

  F('last_pest_cart', 'Last Pest Cart', ['hearthmere', 'graven_march', 'dunmire'],
    'A quarantine convoy repeats an evacuation order along roads from which every destination has been erased.',
    'quarantine_nail', ['road_mud', 'yellow_wax', 'old_oak'], 'convoy', 'forward_pulled', ['wheel_joints', 'sealed_canopies'],
    ['fear', 'poison'], ['fire', 'strike'], false, '', false),

  F('breath_tithe', 'Breath Tithe', ['cinderward'],
    'A foundry levy learned to collect exhalations, leaving soot-filled garments to perform the labor of vanished bodies.',
    'tithe_cinder', ['soot_black', 'breath_blue', 'copper_red'], 'hollow_garment', 'inhaling', ['empty_sleeves', 'bellows_chests'],
    ['fire', 'silence'], ['frost', 'slash'], false, '', false),

  F('white_ague', 'White Ague', ['salt_waste_frontier'],
    'A directional curse strips away every bearing except a false horizon that its pilgrims must follow.',
    'horizon_salt', ['salt_white', 'shadow_violet', 'dawnless_gray'], 'attenuated', 'horizon_bent', ['compass_bones', 'blank_faces'],
    ['frost', 'radiance'], ['water', 'sonic'], true,
    'Pulls the landscape toward itself instead of walking. In the turn economy it moves the arena, which breaks any grid assumption built for the others.', true),

  F('pallid_root_communion', 'Pallid Root Communion', ['graven_march', 'hollow_abbey'],
    'Grave roots coordinate neglected remains through fungal signals older than the names above them.',
    'pallid_mycelium', ['root_pale', 'mold_gold', 'grave_black'], 'rooted_cadaver', 'canopy_pulled', ['root_nerves', 'fungal_eyes'],
    ['poison', 'root'], ['fire', 'slash'], false,
    'Reeled forward by impulses in buried root lines. Burning a root segment severs its movement path for the rest of the encounter.', true),

  F('anchored_quarantine', 'Anchored Quarantine', ['veil_coast_frontier', 'dunmire'],
    'A plague fleet never reached harbor; its anchor shadows now tow drowned crews through inland soil.',
    'anchor_scale', ['deep_iron', 'tide_green', 'signal_red'], 'nautical_humanoid', 'dragged', ['anchor_shadows', 'signal_bones'],
    ['water', 'strike'], ['lightning', 'fire'], true,
    'Dragged by an anchor shadow it does not control. Direct light beaches it, so illumination is both weapon and terrain.', true),
];

/* -------------------------------------------------------------- factions
   Repo-exact from src/data/characters.js. The `hiddenConflict` field is the
   most useful thing in the file and appeared nowhere in this project before:
   every faction's public goal has a private contradiction, which is the
   Fallout-style no-good-guys structure already sitting in the data. */
export const FACTIONS = [
  { id: 'ember_ledger', name: 'The Ember Ledger', homeRegion: 'hearthmere',
    ethos: 'A community survives only while every name and debt is remembered.',
    publicGoal: 'Keep Hearthmere supplied, recorded, and protected through the Ninth Dimming.',
    hiddenConflict: 'The Ledger has begun quietly removing names it cannot afford to feed.',
    standingAxis: ['unentered', 'recorded', 'entrusted'] },
  { id: 'bell_wardens', name: 'Bell-Wardens', homeRegion: 'hearthmere',
    ethos: 'A bell rung on time is a wall no darkness can cross.',
    publicGoal: 'Defend settlement bells and train enough ringers to keep the dusk circuit alive.',
    hiddenConflict: 'Their oldest defensive cadence is also a summons to something below the Abbey.',
    standingAxis: ['untested', 'watchmate', 'warden_sworn'] },
  { id: 'reed_sisters', name: 'The Reed Sisters', homeRegion: 'dunmire',
    ethos: 'Nothing drowned is wholly lost; nothing returned is wholly safe.',
    publicGoal: "Treat marsh sickness, guide causeway travelers, and negotiate with Dunmire's dead.",
    hiddenConflict: "A faction within the sisters wants to restore the drowned parish at Hearthmere's expense.",
    standingAxis: ['dry_foot', 'reed_friend', 'mire_kin'] },
  { id: 'cinder_compact', name: 'The Cinder Compact', homeRegion: 'cinderward',
    ethos: 'Every useful thing is a promise between hand, material, and heat.',
    publicGoal: 'Reclaim Cinderward craft without reopening the royal furnace.',
    hiddenConflict: 'Several smiths are secretly feeding the furnace to keep loved ones alive inside it.',
    standingAxis: ['cold_hand', 'journeyman', 'compact_sealbearer'] },
  { id: 'exact_word', name: 'Custodians of the Exact Word', homeRegion: 'hollow_abbey',
    ethos: 'Careless language made the Last Bell hungry; precise language may bind it again.',
    publicGoal: 'Contain Hollow Abbey and prevent its liturgies from reaching inhabited bells.',
    hiddenConflict: 'Their binding sentence requires one living settlement to be deliberately forgotten.',
    standingAxis: ['inexact', 'witness', 'clause_bearer'] },
  { id: 'unwritten_roads', name: 'The Unwritten Roads', homeRegion: 'graven_march',
    ethos: 'A road exists because someone returns to describe it.',
    publicGoal: 'Map shifting routes, escort travelers, and preserve places the Reach erases.',
    hiddenConflict: 'Their master map is not recording the land; it is deciding which land remains.',
    standingAxis: ['unmapped', 'waymark', 'roadkeeper'] },
  { id: 'grave_tithe', name: 'The Grave Tithe', homeRegion: 'graven_march',
    ethos: 'The dead owe nothing; the living owe the dead privacy, proof, and a proper road home.',
    publicGoal: 'Recover bodies, expose false casualty rolls, and return keepsakes without official sanction.',
    hiddenConflict: 'Their smuggling network is financed by selling selected memories to bell revenants.',
    standingAxis: ['collector', 'name_runner', 'tithe_forgiven'] },
];

/** Recovery status, measured. Prints the real loss rather than implying none. */
export function recoveryTally() {
  const roleLost = ENCOUNTER_ROLES.filter((r) => r.lost).length;
  const famLost = ENEMY_FAMILIES.filter((f) => f.lost).length;
  return {
    roles: ENCOUNTER_ROLES.length,
    rolesWithProse: ENCOUNTER_ROLES.length - roleLost,
    rolesLostProse: roleLost,
    families: ENEMY_FAMILIES.length,
    familiesWithProse: ENEMY_FAMILIES.length - famLost,
    familiesLostProse: famLost,
    factions: FACTIONS.length,
    canonicalRecovered: true,
    authoredProseRecovered: `${ENCOUNTER_ROLES.length - roleLost + ENEMY_FAMILIES.length - famLost} of ${ENCOUNTER_ROLES.length + ENEMY_FAMILIES.length}`,
  };
}
