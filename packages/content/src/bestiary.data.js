/**
 * Canonical bestiary data for The Hollow March / Sable Reach campaign.
 * Entries are original and intentionally renderer-agnostic.
 */

const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
};

export const ENCOUNTER_ROLES = deepFreeze([
  { id: "bruiser", label: "Bruiser", purpose: "Claims space with slow, punishing attacks." },
  { id: "skirmisher", label: "Skirmisher", purpose: "Tests spacing with rapid entries and retreats." },
  { id: "controller", label: "Controller", purpose: "Changes terrain, movement, or safe positioning." },
  { id: "artillery", label: "Artillery", purpose: "Applies ranged pressure with readable firing lanes." },
  { id: "ambusher", label: "Ambusher", purpose: "Begins from concealment and punishes careless travel." },
  { id: "support", label: "Support", purpose: "Empowers allies or weakens the player." },
  { id: "duelist", label: "Duelist", purpose: "Responds to cadence, defense, and repeated patterns." },
  { id: "swarm", label: "Swarm", purpose: "Threatens through numbers, flanks, and interruption." },
  { id: "hunter", label: "Hunter", purpose: "Tracks vulnerable targets and denies retreat." },
  { id: "juggernaut", label: "Juggernaut", purpose: "Acts as a durable mobile objective." },
]);

const family = (id, name, regions, ecology, material, palette, silhouette, resistanceTags, weaknessTags, habitat = {}) => ({
  id,
  name,
  regions,
  ecology,
  material,
  palette,
  silhouette,
  resistanceTags,
  weaknessTags,
  habitat,
});

export const ENEMY_FAMILIES = deepFreeze([
  family("ashbound", "Ashbound", ["hearthmere", "graven_march"], "Bodies animated by names incompletely burned from Hearthmere's clay ledgers.", "spent_cinder", ["ash", "old_cloth", "ember"], { shape: "human", posture: "collapsed", features: ["smoke_seams", "clay_tags"] }, ["poison", "sleep"], ["strike", "radiance"]),
  family("cairn_beasts", "Cairn Beasts", ["graven_march"], "Scavengers that nest in warm cairns and carry grave heat through the black-pine food chain.", "cairn_fang", ["charcoal_fur", "grave_lichen", "warm_stone"], { shape: "beast", posture: "low", features: ["stone_growths", "heat_breath"] }, ["bleed", "frost"], ["fire", "pierce"]),
  family("march_deserters", "March Deserters", ["graven_march", "hearthmere"], "Soldiers and camp-followers trapped by sealed orders from a war omitted from every official record.", "sealed_order_scrap", ["rust", "black_wool", "wax_red"], { shape: "human", posture: "guarded", features: ["blank_banners", "sealed_helms"] }, ["slash", "fear"], ["lightning", "backstab"]),
  family("drowned_parish", "Drowned Parish", ["dunmire"], "The drowned congregation repeats fragments of its final service whenever the blackwater falls.", "drowned_token", ["reed_green", "silt", "corpse_pale"], { shape: "human", posture: "waterlogged", features: ["reed_halo", "dripping_robes"] }, ["frost", "poison"], ["lightning", "slash"]),
  family("reed_coven", "Reed Coven", ["dunmire"], "Mire-workers who learned to bargain with the drowned parish and slowly became part of its wetland rites.", "witch_reed", ["pale_reed", "bog_ink", "marshlight"], { shape: "human", posture: "crooked", features: ["reed_masks", "hanging_charms"] }, ["hex", "frost"], ["fire", "pierce"]),
  family("kilnforged", "Kilnforged", ["cinderward"], "Foundry workers and royal guards fused into the furnace systems they were ordered to seal.", "ember_iron", ["soot_iron", "furnace_orange", "scale"], { shape: "armored", posture: "weighted", features: ["vent_grilles", "chain_tendons"] }, ["fire", "slash"], ["frost", "strike"]),
  family("glasswood", "Glasswood Brood", ["cinderward"], "Fauna cut and remade by iron trees whose sap cools into razor glass.", "glasswood_shard", ["obsidian", "oil_rainbow", "sap_gold"], { shape: "beast", posture: "angular", features: ["glass_antlers", "translucent_organs"] }, ["slash", "fire"], ["strike", "sonic"]),
  family("hush_order", "Hush Order", ["hollow_abbey"], "Tongueless monastics who guard the abbey by turning combat rhythms into a silent liturgy.", "vow_thread", ["chalk_linen", "verdigris", "bloodless_gray"], { shape: "human", posture: "composed", features: ["stitched_veils", "prayer_knots"] }, ["hex", "radiance"], ["thrust", "bleed"]),
  family("echo_choir", "Echo Choir", ["hollow_abbey"], "Voices preserved without bodies, nesting in urns, bells, and hollows within the abbey stone.", "resonant_dust", ["bell_bronze", "violet_echo", "crypt_black"], { shape: "spectral", posture: "floating", features: ["open_mouths", "sound_rings"] }, ["radiance", "hex"], ["strike", "silence"]),
  family("ossuary_vermin", "Ossuary Vermin", ["hollow_abbey", "graven_march"], "Small scavengers that assemble borrowed skeletons into increasingly ambitious communal bodies.", "gnawed_relic", ["old_bone", "mold_green", "tooth_white"], { shape: "composite", posture: "scrambling", features: ["too_many_limbs", "borrowed_skulls"] }, ["pierce", "bleed"], ["strike", "fire"]),
  family("bell_revenants", "Bell Revenants", ["hearthmere", "dunmire", "cinderward", "hollow_abbey"], "Consecrated bells sometimes remember their ringers so fiercely that memory takes up arms.", "memory_bronze", ["verdigris", "ember_gold", "rain_black"], { shape: "armored", posture: "ceremonial", features: ["bell_cavities", "rope_limbs"] }, ["radiance", "strike"], ["lightning", "silence"]),
  family("salt_waste", "Salt-Waste Pilgrims", ["salt_waste_frontier"], "A future frontier hook: pilgrims cross the eastern salt waste carrying sealed mirrors toward the Reach.", "mirror_salt", ["salt_white", "mirror_blue", "sunless_gold"], { shape: "robed", posture: "wind_bent", features: ["mirror_faces", "salt_crust"] }, ["frost", "radiance"], ["water", "strike"]),
  family("veil_coast", "Veil-Coast Kin", ["veil_coast_frontier"], "A future frontier hook: tide-born raiders follow a moonless current inland, searching for the Bell's missing echo.", "black_coral", ["deep_blue", "coral_red", "pearl_gray"], { shape: "amphibious", posture: "swaying", features: ["coral_armor", "lantern_organs"] }, ["water", "bleed"], ["lightning", "fire"]),
  family("shuttered_ward", "Shuttered Ward", ["hearthmere", "dunmire"], "Empty pesthouses continue a care regimen whose absent patients answer from sealed beds.", "ward_seal", ["boiled_linen", "lamp_black", "candle_tallow"], { shape: "humanoid", posture: "solicitous", features: ["vacant_aprons", "inward_hands"] }, ["poison", "fear"], ["fire", "silence"], { substrates: ["plaster", "wet_timber"], moisture: [0.35, 0.9], corruption: [0.45, 1] }),
  family("charnel_measures", "Charnel Measures", ["graven_march", "hollow_abbey"], "Mortuary clerks obey a storage geometry that folds bodies, rooms, and distances into one inventory.", "measure_bone", ["chalk_bone", "ink_brown", "crypt_blue"], { shape: "composite", posture: "right_angled", features: ["measuring_limbs", "drawer_ribs"] }, ["bleed", "pierce"], ["strike", "fire"], { substrates: ["limestone", "grave_soil"], slope: [0, 0.55], corruption: [0.5, 1] }),
  family("black_sluice", "Black Sluice", ["dunmire", "veil_coast_frontier"], "Drainage water copies the dead imperfectly and sends those reflections upstream in search of faces.", "sluice_glass", ["pitch_water", "silver_film", "reed_green"], { shape: "reflected", posture: "inverted", features: ["mirror_skin", "drain_mouths"] }, ["water", "hex"], ["lightning", "radiance"], { substrates: ["silt", "masonry"], moisture: [0.78, 1], featureDistance: { waterMeters: [0, 48] } }),
  family("last_pest_cart", "Last Pest Cart", ["hearthmere", "graven_march", "dunmire"], "A quarantine convoy repeats an evacuation order along roads from which every destination has been erased.", "quarantine_nail", ["road_mud", "yellow_wax", "old_oak"], { shape: "convoy", posture: "forward_pulled", features: ["wheel_joints", "sealed_canopies"] }, ["fear", "poison"], ["fire", "strike"], { substrates: ["road", "causeway"], slope: [0, 0.32], featureDistance: { routeMeters: [0, 24] } }),
  family("breath_tithe", "Breath Tithe", ["cinderward"], "A foundry levy learned to collect exhalations, leaving soot-filled garments to perform the labor of vanished bodies.", "tithe_cinder", ["soot_black", "breath_blue", "copper_red"], { shape: "hollow_garment", posture: "inhaling", features: ["empty_sleeves", "bellows_chests"] }, ["fire", "silence"], ["frost", "slash"], { substrates: ["slag", "ironstone"], elevation: [150, 900], corruption: [0.45, 1] }),
  family("white_ague", "White Ague", ["salt_waste_frontier"], "A directional curse strips away every bearing except a false horizon that its pilgrims must follow.", "horizon_salt", ["salt_white", "shadow_violet", "dawnless_gray"], { shape: "attenuated", posture: "horizon_bent", features: ["compass_bones", "blank_faces"] }, ["frost", "radiance"], ["water", "sonic"], { substrates: ["salt_playa", "gypsum"], moisture: [0, 0.22], corruption: [0.55, 1] }),
  family("pallid_root_communion", "Pallid Root Communion", ["graven_march", "hollow_abbey"], "Grave roots coordinate neglected remains through fungal signals older than the names above them.", "pallid_mycelium", ["root_pale", "mold_gold", "grave_black"], { shape: "rooted_cadaver", posture: "canopy_pulled", features: ["root_nerves", "fungal_eyes"] }, ["poison", "root"], ["fire", "slash"], { substrates: ["grave_soil", "limestone"], moisture: [0.3, 0.76], featureDistance: { cemeteryMeters: [0, 180] } }),
  family("anchored_quarantine", "Anchored Quarantine", ["veil_coast_frontier", "dunmire"], "A plague fleet never reached harbor; its anchor shadows now tow drowned crews through inland soil.", "anchor_scale", ["deep_iron", "tide_green", "signal_red"], { shape: "nautical_humanoid", posture: "dragged", features: ["anchor_shadows", "signal_bones"] }, ["water", "strike"], ["lightning", "fire"], { substrates: ["coastal_silt", "estuary"], moisture: [0.65, 1], featureDistance: { coastMeters: [0, 900] } }),
]);

const move = (id, name, damageTags, cue, telegraphSeconds, startup, active, recovery, counterplay, extra = {}) => ({
  id,
  name,
  damageTags,
  telegraph: { cue, seconds: telegraphSeconds },
  timing: { startup, active, recovery },
  counterplay,
  ...extra,
});

const FAMILY_MOVESETS = {
  ashbound: [
    move("ash_clutch", "Ash Clutch", ["physical", "grapple"], "Both hands shed ash as the torso bows forward.", 0.55, 0.55, 0.25, 0.75, "Backstep or strike the exposed shoulders before the hands close."),
    move("name_sigh", "Name-Sigh", ["ash", "fear"], "Clay tags chatter and the chest draws an impossible breath.", 0.9, 0.9, 0.5, 1.05, "Move behind solid cover or break the clay tag to cancel the cone."),
  ],
  cairn_beasts: [
    move("cairn_lunge", "Cairn Lunge", ["pierce", "physical"], "Hindquarters lower while grave stones click together.", 0.45, 0.45, 0.2, 0.7, "Sidestep late; the beast skids and exposes its flank."),
    move("grave_heat", "Grave-Heat Shake", ["fire", "area"], "Lichen glows orange between its stone growths.", 0.85, 0.85, 0.6, 0.9, "Leave the heat ring or cool the growths with frost."),
  ],
  march_deserters: [
    move("order_thrust", "Ordered Thrust", ["pierce"], "A sealed helm turns toward a distant, unheard command.", 0.5, 0.5, 0.18, 0.65, "Deflect the linear thrust or circle the weapon side."),
    move("banner_wall", "Banner Wall", ["guard", "counter"], "The blank banner wraps tightly around the off arm.", 0.65, 0.65, 0.8, 0.8, "Do not repeat the last attack type; use a guard break or disengage."),
  ],
  drowned_parish: [
    move("road_drag", "Road Drag", ["grapple", "water"], "Fingers trail along the causeway edge while water bulges behind them.", 0.7, 0.7, 0.45, 0.85, "Stay on dry stone and attack the grasping arm from its elbow side."),
    move("vesper_cough", "Vesper Cough", ["water", "silence"], "The throat swells with blackwater and drowned hymn notes.", 0.8, 0.8, 0.6, 1, "Interrupt with strike damage or leave the short lingering cloud."),
  ],
  reed_coven: [
    move("reed_dart", "Whisper-Reed Dart", ["pierce", "hex"], "A pale reed bends toward the target without wind.", 0.6, 0.6, 0.1, 0.55, "Dodge toward the caster after the reed gives its audible whisper."),
    move("mire_step", "Mire Step", ["movement", "decoy"], "The mask turns backward while the feet sink.", 0.4, 0.4, 0.25, 0.4, "Track the ripples rather than the reed decoy left behind."),
  ],
  kilnforged: [
    move("vent_charge", "Vent Charge", ["physical", "fire", "unblockable"], "Back vents flare white and the armor locks at the waist.", 0.9, 0.9, 0.5, 1.15, "Break a cooling vent or dodge across the charge, never backward."),
    move("furnace_sweep", "Furnace Sweep", ["strike", "fire"], "The weapon drags sparks in a widening half-circle.", 0.7, 0.7, 0.35, 0.9, "Roll through the haft or step beyond the weapon's outer edge."),
  ],
  glasswood: [
    move("splinter_bound", "Splinter Bound", ["slash", "bleed"], "Glass limbs compress with a rising crystalline whine.", 0.52, 0.52, 0.22, 0.62, "Dodge perpendicular; collision with stone shatters its armor."),
    move("sap_mirror", "Sap Mirror", ["reflect", "fire"], "Golden sap sheets across its body and becomes mirror-bright.", 0.75, 0.75, 0.9, 0.65, "Stop ranged attacks and use strike or sonic damage to craze the shell."),
  ],
  hush_order: [
    move("cadence_reply", "Cadence Reply", ["physical", "counter"], "Prayer knots twitch in the rhythm of your last combo.", 0.55, 0.55, 0.25, 0.7, "Change cadence or feint; repeated sequences trigger the full counter."),
    move("vow_step", "Vow Step", ["movement", "thrust"], "One bare heel lifts while the monk's veil goes perfectly still.", 0.45, 0.45, 0.18, 0.55, "Turn into the pass and punish the monk's back at recovery."),
  ],
  echo_choir: [
    move("choir_line", "Choir Line", ["sonic", "radiance"], "Violet mouths align and inhale together.", 0.95, 0.95, 0.7, 0.85, "Cross behind a pillar or break the lead voice before release."),
    move("late_echo", "Late Echo", ["sonic", "delayed"], "A dim ring remains where the first strike landed.", 0.65, 0.65, 0.15, 0.7, "Move away from the remembered impact; it repeats one beat later."),
  ],
  ossuary_vermin: [
    move("bone_scuttle", "Bone Scuttle", ["physical", "multi_hit"], "Borrowed joints ratchet outward in sequence.", 0.45, 0.45, 0.45, 0.6, "Sweep low or retreat through a narrow gap that breaks the formation."),
    move("skull_toss", "Borrowed Skull", ["strike", "projectile"], "The highest skull swivels loose and chatters its teeth.", 0.65, 0.65, 0.2, 0.7, "Deflect it back to scatter the communal body."),
  ],
  bell_revenants: [
    move("toll_arc", "Toll Arc", ["strike", "sonic"], "The chest bell swings once without making sound.", 0.8, 0.8, 0.35, 0.9, "The sound arrives after the weapon; evade twice or silence the cavity."),
    move("rope_snare", "Ringer's Snare", ["grapple", "lightning"], "Rope limbs coil and nearby metal hums.", 0.62, 0.62, 0.3, 0.82, "Cut the rope or ground the charge against wet terrain."),
  ],
  salt_waste: [
    move("mirror_flash", "Sunless Reflection", ["radiance", "blind"], "The sealed mirror tilts toward a light that is not present.", 0.85, 0.85, 0.4, 0.75, "Turn away at the flash or muddy the mirror with water."),
    move("salt_shear", "Salt Shear", ["slash", "frost"], "A white crust lifts from the robe in a knife-thin plane.", 0.58, 0.58, 0.25, 0.68, "Duck the horizontal plane, then strike before the crust reforms."),
  ],
  veil_coast: [
    move("undertow_hook", "Undertow Hook", ["water", "pull"], "The lantern organ dims as black water circles its feet.", 0.72, 0.72, 0.5, 0.8, "Move laterally or sever the visible current with fire."),
    move("coral_rake", "Coral Rake", ["slash", "bleed"], "Coral plates flare outward with a brittle crack.", 0.48, 0.48, 0.3, 0.7, "Guard with a hard surface to snap the coral teeth."),
  ],
  shuttered_ward: [
    move("bedside_turn", "Bedside Turn", ["grapple", "hex"], "Empty sleeves fold as though straightening an unseen patient.", 0.62, 0.62, 0.28, 0.74, "Step across the vacant bed outline before the hands complete their turn."),
    move("lamp_round", "Lamp Round", ["fire", "fear"], "Every hooded lamp in reach dims from west to east.", 0.8, 0.8, 0.45, 0.9, "Relight the nearest lamp or stand inside its last clean circle."),
  ],
  charnel_measures: [
    move("right_angle_fold", "Right-Angle Fold", ["strike", "grapple"], "Measuring cords pull its joints into precise corners.", 0.7, 0.7, 0.35, 0.82, "Leave the chalk rectangle or cut the taut diagonal cord."),
    move("drawer_count", "Drawer Count", ["summon", "curse"], "Rib drawers open in a prime-number sequence.", 0.9, 0.9, 0.55, 0.96, "Close the unmatched drawer before the count reaches its final number."),
  ],
  black_sluice: [
    move("upstream_copy", "Upstream Copy", ["water", "hex"], "A reflection begins moving a beat before its body.", 0.68, 0.68, 0.3, 0.72, "Follow the body without a reflection; the other outline is delayed water."),
    move("drain_mouth", "Drain Mouth", ["pull", "silence"], "Nearby runoff circles a point where no drain exists.", 0.78, 0.78, 0.48, 0.9, "Cross the current at its narrow throat or block it with debris."),
  ],
  last_pest_cart: [
    move("convoy_wheel", "Convoy Wheel", ["strike", "movement"], "Wheel shadows turn while every visible wheel remains still.", 0.7, 0.7, 0.4, 0.82, "Stand off the road crown, then punish the axle shadow after it passes."),
    move("sealed_destination", "Sealed Destination", ["curse", "root"], "Yellow route wax crawls toward the target's feet.", 0.86, 0.86, 0.5, 0.94, "Break the wax line at a crossroads or step onto unrecorded ground."),
  ],
  breath_tithe: [
    move("empty_inhale", "Empty Inhale", ["pull", "stamina_drain"], "Hollow garments draw tight around a body that is not there.", 0.66, 0.66, 0.42, 0.78, "Hold position behind a vent or interrupt the copper throat seam."),
    move("soot_exhale", "Soot Exhale", ["fire", "blind"], "A blue breath travels backward into the bellows chest.", 0.82, 0.82, 0.5, 0.9, "Move upwind or chill the bellows before the breath reverses."),
  ],
  white_ague: [
    move("false_north", "False North", ["hex", "movement"], "Every compass bone points toward a different white line.", 0.74, 0.74, 0.35, 0.82, "Use a fixed landmark rather than the compass lines to choose your dodge."),
    move("horizon_cut", "Horizon Cut", ["slash", "frost"], "Its blank face becomes a perfectly level shadow.", 0.62, 0.62, 0.25, 0.72, "Change elevation; the cut cannot leave its false horizon."),
  ],
  pallid_root_communion: [
    move("root_message", "Root Message", ["root", "summon"], "Pale threads pulse away from the body in branching pairs.", 0.8, 0.8, 0.5, 0.88, "Sever the brightest branch to isolate the caller from its communion."),
    move("fruiting_gaze", "Fruiting Gaze", ["poison", "fear"], "Fungal eyes open only on surfaces facing away from the target.", 0.72, 0.72, 0.4, 0.8, "Turn toward the newest eye or scorch the shared root mat."),
  ],
  anchored_quarantine: [
    move("shadow_anchor", "Shadow Anchor", ["strike", "root"], "An anchor-shaped darkness drops upward beneath the target.", 0.76, 0.76, 0.42, 0.88, "Cross a hard pool of light before the shadow reaches full weight."),
    move("inland_tow", "Inland Tow", ["water", "pull"], "Signal bones click three times toward the coast.", 0.68, 0.68, 0.38, 0.82, "Move coastward through the pull, then cut the trailing hawser."),
  ],
};

const signature = (id, name, tags, cue, counterplay, extra = {}) =>
  move(id, name, tags, cue, extra.telegraphSeconds ?? 0.75, extra.startup ?? 0.75, extra.active ?? 0.35, extra.recovery ?? 0.85, counterplay, extra.properties ?? {});

const spec = (id, name, familyId, rank, regions, levelRange, lore, combatRole, signatureMove, options = {}) => ({
  id, name, familyId, rank, regions, levelRange, lore, combatRole, signatureMove, ...options,
});

const S = signature;

const EXPANSION_ROLE_TARGETS = Object.freeze({
  controller: 7,
  skirmisher: 13,
  bruiser: 9,
  artillery: 10,
  support: 10,
  juggernaut: 6,
  ambusher: 12,
  hunter: 13,
  swarm: 13,
  duelist: 7,
});

const buildExpansionRoles = () => {
  const roles = [];
  const used = Object.fromEntries(Object.keys(EXPANSION_ROLE_TARGETS).map((role) => [role, 0]));
  while (roles.length < 100) {
    for (const role of Object.keys(EXPANSION_ROLE_TARGETS)) {
      if (used[role] < EXPANSION_ROLE_TARGETS[role]) {
        roles.push(role);
        used[role] += 1;
      }
    }
  }
  return roles;
};

const EXPANSION_ROLES = buildExpansionRoles();
const RANK_LEVEL_OFFSETS = { regular: [0, 5], specialist: [3, 8], elite: [6, 11], miniboss: [9, 13], boss: [12, 12] };
const ROLE_DAMAGE_TAGS = {
  controller: ["hex", "area"], skirmisher: ["physical", "movement"], bruiser: ["strike", "physical"], artillery: ["projectile", "curse"],
  support: ["hex", "summon"], juggernaut: ["strike", "area"], ambusher: ["physical", "fear"], hunter: ["pierce", "mark"], swarm: ["physical", "multi_hit"], duelist: ["physical", "counter"],
};
const ROLE_MECHANIC_TIMINGS = {
  controller: [0.9, 0.46, 1.05], skirmisher: [0.42, 0.24, 0.56], bruiser: [0.7, 0.34, 0.92], artillery: [1.08, 0.3, 1.12],
  support: [0.82, 0.4, 0.88], juggernaut: [1.2, 0.52, 1.2], ambusher: [0.48, 0.28, 0.72], hunter: [0.64, 0.32, 0.7], swarm: [0.36, 0.5, 0.62], duelist: [0.58, 0.22, 0.66],
};
const mechanicId = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const expansionSpec = (seed, index) => {
  const familyData = ENEMY_FAMILIES.find(({ id }) => id === seed.familyId);
  const role = EXPANSION_ROLES[index];
  const familyIndex = ENEMY_FAMILIES.findIndex(({ id }) => id === seed.familyId);
  const [low, high] = RANK_LEVEL_OFFSETS[seed.rank];
  const [baseStartup, baseActive, baseRecovery] = ROLE_MECHANIC_TIMINGS[role];
  const cadenceOffset = (index % 7) * 0.025;
  const startup = Number((baseStartup + cadenceOffset).toFixed(3));
  const active = Number((baseActive + (index % 5) * 0.015).toFixed(3));
  const recovery = Number((baseRecovery + (index % 11) * 0.02).toFixed(3));
  return spec(
    seed.id,
    seed.name,
    seed.familyId,
    seed.rank,
    seed.regions ?? familyData.regions,
    [Math.max(1, familyIndex * 2 + low), Math.max(2, familyIndex * 2 + high)],
    seed.origin,
    role,
    S(mechanicId(seed.mechanic), seed.mechanic, ROLE_DAMAGE_TAGS[role], seed.cue, seed.counterplay, { telegraphSeconds: startup, startup, active, recovery }),
    {
      distinguishingFeature: seed.anatomy,
      v3Seed: {
        anatomicalViolation: seed.anatomy,
        locomotionRule: seed.locomotion,
        soundGrammar: seed.sound,
        ecologicalPurpose: seed.purpose,
        narrativeOrigin: seed.origin,
      },
    },
  );
};

// Each row is an authored form seed. Shared timings and numerical habitat defaults are
// enriched deterministically below; identity, ecology, horror language, and mechanic are not.
const EXPANSION_FORM_SEEDS = [
  // Four additional forms for every established family.
  { id: "ash_tenant", name: "Ash Tenant", familyId: "ashbound", rank: "regular", anatomy: "A fired-clay door occupies the abdomen and opens into unlit depth.", locomotion: "It advances only while a nearby doorway is closed.", sound: "Three tenant knocks, then the scrape of a key inside bone.", purpose: "It tests abandoned dwellings for heat and leaves rooms colder than outdoors.", origin: "A household burned its census indoors; the address survived and learned to seek occupants.", mechanic: "Vacant Threshold", cue: "Its abdominal latch lifts while the nearest door swings shut.", counterplay: "Open any other door to strand it between thresholds." },
  { id: "wicket_eater", name: "Wicket Eater", familyId: "ashbound", rank: "regular", anatomy: "Its jaw is a narrow clerk's window lined with carbon-paper teeth.", locomotion: "It sidles along counters and cannot turn away from a queue.", sound: "Paper numbers are called in voices belonging to the listener.", purpose: "It consumes unresolved petitions and excretes blank clay slips.", origin: "The last municipal clerk swallowed the waiting list before the archive burned.", mechanic: "Next in Line", cue: "A black number appears above the target's shadow.", counterplay: "Exchange places with an empty queue marker before the number is called." },
  { id: "smoke_notary", name: "Smoke Notary", familyId: "ashbound", rank: "specialist", anatomy: "Six seal-stamps rotate where its fingers should divide.", locomotion: "It glides backward along sentences written in ash.", sound: "Wax pops punctuate a whispered recital of invalid names.", purpose: "It certifies false deaths so Ashbound bodies can cross settlement wards.", origin: "A notary signed his own cremation certificate to escape a levy and was believed by the fire.", mechanic: "Countersign the Dead", cue: "A seal-shaped shadow descends over a fallen creature.", counterplay: "Smear the shadow before the sixth stamp or use water to void the wax." },
  { id: "redaction_warden", name: "Redaction Warden", familyId: "ashbound", rank: "elite", anatomy: "A vertical strip of body is missing, leaving both halves joined by black brackets.", locomotion: "It skips across any line of sight that passes through smoke.", sound: "Nearby speech loses one word each time its brackets close.", purpose: "It removes witnesses from places the ledgers cannot reconcile.", origin: "Hearthmere's censors erased a guard from twelve reports until only the duty remained.", mechanic: "Black Bracket", cue: "Two soot bars frame the target from opposite sides.", counterplay: "Cross one bracket before they meet, forcing the redaction onto empty ground." },

  { id: "cairn_maggot", name: "Cairn Maggot", familyId: "cairn_beasts", rank: "regular", anatomy: "A grub wears a spiral of infant grave stones instead of segments.", locomotion: "It rolls downhill, then unfolds to climb only warmed rock.", sound: "Pebbles click in the rhythm of milk teeth.", purpose: "It aerates warm cairns and carries grave lichen between nests.", origin: "The first brood hatched beneath stones moved before their mortar cooled.", mechanic: "Marker Roll", cue: "Its memorial segments lock into a descending spiral.", counterplay: "Step uphill and strike the exposed pale underside after it rolls past." },
  { id: "flint_pelt", name: "Flint-Pelt Prowler", familyId: "cairn_beasts", rank: "regular", anatomy: "Overlapping flints grow as fur and spark when its spine bends.", locomotion: "It bounds only between shadows cast by standing stones.", sound: "Dry claws count down from seven in stone taps.", purpose: "It burns diseased moss from den routes with its own sparks.", origin: "Hunters sharpened knives on one cairn until the filings learned a predator's outline.", mechanic: "Seventh Spark", cue: "Six sparks race toward the tail before the seventh jumps forward.", counterplay: "Enter the lit ground between stones so its shadow-route ends." },
  { id: "barrow_listener", name: "Barrow Listener", familyId: "cairn_beasts", rank: "specialist", anatomy: "One ear forms a stone funnel larger than the eyeless skull.", locomotion: "It pivots around buried noises and moves in tightening circles.", sound: "Its paws are silent; distant soil answers with muffled knocks.", purpose: "It finds unstable barrows and opens them for the wider scavenger ecology.", origin: "A vixen slept above a king whose attendants kept knocking after burial.", mechanic: "Buried Reply", cue: "Concentric dust rings converge beneath the player's last loud action.", counterplay: "Throw a noisy object across the arena to redirect the circle." },
  { id: "oathstone_boar", name: "Oathstone Boar", familyId: "cairn_beasts", rank: "elite", anatomy: "Broken promise stones protrude as tusks through a jaw that opens sideways.", locomotion: "It charges along the straightest spoken promise in hearing.", sound: "Each hoofbeat repeats one word from an oath its victim broke.", purpose: "It grinds inscribed stones into mineral feed for grave lichen.", origin: "Deserters buried their vows beneath a boar trail; the herd ate every stone but the consequences.", mechanic: "Promise Furrow", cue: "A spoken oath writes itself as a glowing line beneath the tusks.", counterplay: "Cross the line behind cover, making the charge break its own oathstone." },

  { id: "receipt_soldier", name: "Receipt Soldier", familyId: "march_deserters", rank: "regular", anatomy: "A continuous ration receipt is stitched through every joint as tendon.", locomotion: "It takes exactly the number of steps printed on its current stub.", sound: "A quartermaster's stamp lands between each armored footfall.", purpose: "It confiscates food from abandoned camps and stacks it where no army remains.", origin: "A starving private demanded proof of every denied meal until the receipts replaced him.", mechanic: "Ration Count", cue: "The exposed stub displays a descending number of steps.", counterplay: "Wait outside reach until the count expires, then tear the new stub." },
  { id: "trench_waif", name: "Trench Waif", familyId: "march_deserters", rank: "regular", anatomy: "Its torso is a narrow trench containing tiny marching silhouettes.", locomotion: "It crawls along depressions and freezes on unbroken high ground.", sound: "Distant boots splash inside its hollow chest.", purpose: "It extends forgotten earthworks toward occupied roads.", origin: "A camp follower hid in a drainage cut while the regiment marched out of history.", mechanic: "Earthwork Advance", cue: "A shallow furrow races from its chest toward the target.", counterplay: "Move onto stone or leap the furrow before it deepens." },
  { id: "command_leech", name: "Command Leech", familyId: "march_deserters", rank: "specialist", anatomy: "A wax-red leech wears a tiny sealed helm around its feeding mouth.", locomotion: "It springs between creatures immediately after they receive an order.", sound: "Commands echo one octave lower from whichever host it marks.", purpose: "It preserves hierarchy by feeding on obedience rather than blood.", origin: "A field marshal sealed his final command with wax contaminated by a nameless camp parasite.", mechanic: "Borrow Authority", cue: "A red thread joins the loudest commander to the leech.", counterplay: "Remain still during the echoed order, then cut the slack thread." },
  { id: "armistice_giant", name: "Armistice Giant", familyId: "march_deserters", rank: "elite", anatomy: "Two opposed soldiers share one towering coat, their spines knotted at the flagpole.", locomotion: "Each half advances only while the other visibly retreats.", sound: "Contradictory ceasefire terms are shouted from one sealed collar.", purpose: "It patrols battle lines that no map agrees ever existed.", origin: "Two envoys signed incompatible truces on opposite sides of the same blank banner.", mechanic: "Mutual Withdrawal", cue: "The giant divides its stance across a luminous border.", counterplay: "Cross the border during the backward half-step and attack the central knot." },

  { id: "aisle_floater", name: "Aisle Floater", familyId: "drowned_parish", rank: "regular", anatomy: "Pew boards pass through its ribs and hold it flat above the water.", locomotion: "It drifts only along invisible church aisles despite the current.", sound: "Water taps beneath it like restrained applause.", purpose: "It clears reed growth from submerged processional routes.", origin: "A late worshipper clung to a pew until floodwater made both part of the nave.", mechanic: "Invisible Aisle", cue: "Parallel ripples define a narrow route through the water.", counterplay: "Step outside the ripple aisle and attack its exposed board ends." },
  { id: "hymn_eel", name: "Hymn Eel", familyId: "drowned_parish", rank: "regular", anatomy: "Rows of tiny human teeth form musical notation down its translucent flank.", locomotion: "It swims through held notes as though they were streams.", sound: "One low vowel bends in pitch as it circles.", purpose: "It consumes unfinished hymns before they attract larger voices.", origin: "Silver fish nested in the drowned choir's lungs and learned to share one elongated body.", mechanic: "Sustain Current", cue: "A visible note stretches from its mouth across the water.", counterplay: "Break the note with a bell strike or cross it at a rest mark." },
  { id: "tide_sacristan", name: "Tide Sacristan", familyId: "drowned_parish", rank: "specialist", anatomy: "Its arms branch into candelabra fingers that burn with cold water.", locomotion: "It walks backward wherever a reflected flame leads.", sound: "Wet candlewicks whisper names in liturgical order.", purpose: "It relights drowned shrines and calls the parish toward them.", origin: "The sacristan refused to extinguish the chapel lights when blackwater entered.", mechanic: "Cold Vigil", cue: "Blue flames ignite from little finger to thumb.", counterplay: "Extinguish the middle flame to reverse the procession's path." },
  { id: "drowned_nave", name: "Drowned Nave", familyId: "drowned_parish", rank: "elite", anatomy: "A chapel roof arches from shoulder to shoulder over a congregation-shaped void.", locomotion: "It plants buttress limbs and vaults forward one architectural bay at a time.", sound: "Rain falls inside it even under clear sky.", purpose: "It shelters lesser parish forms from lightning and predatory marshlights.", origin: "The chapel remembered carrying its people after the foundations failed.", mechanic: "Processional Bay", cue: "The next floor bay darkens beneath a moving roof shadow.", counterplay: "Stand between bay lines, then strike a planted buttress before the vault." },

  { id: "charm_mite", name: "Charm Mite", familyId: "reed_coven", rank: "regular", anatomy: "A seed-sized body carries a full reed mask on jointed stilts.", locomotion: "It moves only when hanging charms turn away from it.", sound: "Tiny beads click inside the oversized mask.", purpose: "It cleans failed hexes from charms and concentrates them in its shell.", origin: "Discarded charm seeds germinated in warm wax beneath a coven rack.", mechanic: "Mask Burden", cue: "Nearby charms rotate outward as the mask rises.", counterplay: "Turn one charm inward to pin the mite under its own gaze." },
  { id: "wicker_child", name: "Wicker Child", familyId: "reed_coven", rank: "regular", anatomy: "A child-sized wicker shell bends around an empty, softly glowing center.", locomotion: "It skips between reed shadows without touching the mud.", sound: "A nursery count is tapped with hollow twig fingers.", purpose: "It retrieves lost offerings from deep bog without disturbing the surface.", origin: "The coven wove a basket for a promised child; the promise arrived without a body.", mechanic: "Ninth Skip", cue: "Eight reed shadows lean toward the same patch of mud.", counterplay: "Stand in the ninth shadow and cut the basket handle on arrival." },
  { id: "fog_loaner", name: "Fog Loaner", familyId: "reed_coven", rank: "specialist", anatomy: "Its torso is a reed cage containing borrowed silhouettes instead of organs.", locomotion: "It exchanges position with any silhouette obscured by fog.", sound: "Debtors cough from different distances inside the cage.", purpose: "It lends concealment to the coven and repossesses the borrower's outline.", origin: "A mire-worker promised the morning fog more shapes than the settlement possessed.", mechanic: "Repossess Outline", cue: "The target's silhouette appears briefly inside the cage.", counterplay: "Enter clear air or illuminate a second silhouette to spoil the exchange." },
  { id: "knot_leg_magus", name: "Knot-Leg Magus", familyId: "reed_coven", rank: "elite", anatomy: "Bundled reed legs tie themselves into new joints after every step.", locomotion: "Its stride follows knot topology rather than physical distance.", sound: "Each new joint tightens with a rope-maker's wet snap.", purpose: "It walks impossible marsh routes to maintain remote bargain sites.", origin: "A diviner replaced failing bones with map knots and eventually walked off every map.", mechanic: "Topological Step", cue: "A glowing knot appears between two nonadjacent pools.", counterplay: "Cut either pool's reed marker before the knot closes." },

  { id: "furnace_louse", name: "Furnace Louse", familyId: "kilnforged", rank: "regular", anatomy: "An iron insect uses a worker's detached teeth as cooling fins.", locomotion: "It scuttles toward the hottest metal, then recoils exactly three body lengths.", sound: "Teeth chatter faster as nearby armor heats.", purpose: "It strips slag from active vents and seeds it into cooler machinery.", origin: "Foundry lice survived a sealing fire by borrowing teeth from the shift bell's casualties.", mechanic: "Heat Recoil", cue: "Its tooth fins glow in a front-to-back wave.", counterplay: "Present heated metal, then punish the fixed recoil landing." },
  { id: "clinker_page", name: "Clinker Page", familyId: "kilnforged", rank: "regular", anatomy: "A small suit has a clinker brick for a head and molten handwriting in its visor.", locomotion: "It marches on the shadow of a larger absent knight.", sound: "Spurs ring from empty space one pace ahead.", purpose: "It gathers usable clinker and lays it into ceremonial furnace paths.", origin: "An apprentice polished armor for a knight who existed only on the duty roster.", mechanic: "Absent Spur", cue: "An oversized knight shadow raises a weapon before the page does.", counterplay: "Attack the small body during the shadow's exaggerated windup." },
  { id: "draft_taster", name: "Draft Taster", familyId: "kilnforged", rank: "specialist", anatomy: "A long copper tongue passes through furnace vents in place of a spine.", locomotion: "It is pulled sideways by changes in air pressure.", sound: "Vents whistle a rising scale before the tongue appears.", purpose: "It maps clean drafts and diverts them away from sealed workers.", origin: "A safety inspector tasted furnace air until the foundry learned to use him as a vane.", mechanic: "Reverse Draft", cue: "Soot streams sideways toward a closed vent.", counterplay: "Open the opposite vent to drag the tongue across exposed gears." },
  { id: "crucible_centurion", name: "Crucible Centurion", familyId: "kilnforged", rank: "elite", anatomy: "Its torso is a tilting crucible balanced on four mismatched armored legs.", locomotion: "It advances only while molten weight remains level.", sound: "Liquid metal counts cadence against the vessel walls.", purpose: "It transports furnace memory between isolated foundry districts.", origin: "Four guards carried the royal crucible until a command fused bearer and burden.", mechanic: "Level the Pour", cue: "The crucible tilts and a white line climbs one rim.", counterplay: "Strike the high-side leg to spill metal away and topple the formation." },

  { id: "prism_larva", name: "Prism Larva", familyId: "glasswood", rank: "regular", anatomy: "A translucent grub contains seven differently moving shadows.", locomotion: "It crawls toward whichever color is least present nearby.", sound: "Its shell emits a separate glass tone for each shadow.", purpose: "It sorts mineral light for iron-tree roots.", origin: "Sap pooled through a shattered chapel prism and hatched when all colors separated.", mechanic: "Missing Color", cue: "Six shell bands brighten while one remains dark.", counterplay: "Present the missing color to halt it, then strike the dark band." },
  { id: "splinter_doe", name: "Splinter Doe", familyId: "glasswood", rank: "regular", anatomy: "Its hide is absent; floating wooden splinters preserve the outline of a doe.", locomotion: "It leaps only where its scattered outline overlaps iron-tree shadows.", sound: "Splinters hum like a bow drawn across empty strings.", purpose: "It prunes glasswood seedlings by passing through them.", origin: "A doe escaped a sap flood but left every solid part behind.", mechanic: "Outline Scatter", cue: "The splinters widen around a distant tree shadow.", counterplay: "Step between outline and shadow to force a painful reassembly." },
  { id: "reflection_finch", name: "Reflection Finch", familyId: "glasswood", rank: "specialist", anatomy: "The bird exists as a reflection on both sides of a single flying glass feather.", locomotion: "It flies along reflected sightlines and turns only at bright edges.", sound: "Wingbeats are heard from the viewer's mirrored side.", purpose: "It carries visual memories between sap-mirrors.", origin: "A finch struck an iron branch and continued flying inside the shard that killed it.", mechanic: "Edge Migration", cue: "A bright line travels around every nearby reflective surface.", counterplay: "Dull one edge to collapse its route and expose the central feather." },
  { id: "cathedral_stag", name: "Cathedral Stag", familyId: "glasswood", rank: "elite", anatomy: "Window-like organs hang between antlers arranged as a ruined nave.", locomotion: "It processes through colored light and refuses bare shadow.", sound: "Hooves ring as if on distant flagstones, never local soil.", purpose: "It directs glasswood growth into vast vaulted groves.", origin: "Iron trees copied an abbey window from the blood of a stag beneath it.", mechanic: "Rose Procession", cue: "Colored panes align into a moving aisle beneath its antlers.", counterplay: "Break the darkest pane and stand in the colorless gap." },

  { id: "dust_novice", name: "Dust Novice", familyId: "hush_order", rank: "regular", anatomy: "Its joints are gaps held apart by compact rings of prayer dust.", locomotion: "It completes movements only while no one speaks.", sound: "The gaps emit the faint noise of a page being turned underwater.", purpose: "It collects footprints from forbidden abbey passages.", origin: "A novice vowed to leave no trace and eventually became the absence between traces.", mechanic: "Silent Completion", cue: "Dust rings tighten around every separated joint.", counterplay: "Use a shout or bell to interrupt the motion before contact." },
  { id: "mute_porter", name: "Mute Porter", familyId: "hush_order", rank: "regular", anatomy: "A stone doorway hangs from its shoulders where the torso should be.", locomotion: "It sidesteps so the doorway always faces the nearest trespasser.", sound: "Footfalls sound on the far side of the empty frame.", purpose: "It relocates sealed thresholds within the abbey after dark.", origin: "The porter carried a forbidden door until the wall forgot where it belonged.", mechanic: "Wrong Threshold", cue: "A corridor appears for an instant inside its empty torso.", counterplay: "Pass through during the glimpse to emerge behind it." },
  { id: "pause_inquisitor", name: "Pause Inquisitor", familyId: "hush_order", rank: "specialist", anatomy: "The upper and lower body are separated by a hovering punctuation mark.", locomotion: "It moves during the pause between any two repeated actions.", sound: "A held breath ends with one dry ink drop.", purpose: "It detects broken ritual cadence and removes its source.", origin: "An inquisitor edited every testimony until only the pauses seemed truthful.", mechanic: "Intervening Mark", cue: "A black stroke appears between the player's repeated inputs.", counterplay: "Change action before the stroke closes into punctuation." },
  { id: "comma_blade", name: "Comma-Blade Ascetic", familyId: "hush_order", rank: "elite", anatomy: "Its curved body bends around an empty clause of air.", locomotion: "It circles attacks and lands only after the attacker stops.", sound: "A soft throat click divides every exchange into clauses.", purpose: "It preserves unfinished vows by preventing decisive endings.", origin: "An ascetic refused the final word of a death sentence and became its delay.", mechanic: "Dependent Clause", cue: "A curved shadow hangs after the player's final swing.", counterplay: "Continue with a different cadence or step inside the curve before it falls." },

  { id: "breathless_note", name: "Breathless Note", familyId: "echo_choir", rank: "regular", anatomy: "A single violet mouth stretches vertically through a floating musical mark.", locomotion: "It drifts along the decay of the last loud sound.", sound: "One note begins after its echo has already ended.", purpose: "It scavenges residual resonance before it stains abbey stone.", origin: "A chorister died during an inhale and left the intended note waiting behind.", mechanic: "Aftertone", cue: "A violet trail follows the last loud impact in reverse.", counterplay: "Create a quieter decoy sound and leave the original decay path." },
  { id: "urn_moth", name: "Urn Moth", familyId: "echo_choir", rank: "regular", anatomy: "Each wing is a thin funeral urn seen from above.", locomotion: "It flutters between names spoken within the same room.", sound: "Powdered ceramic whispers the names it refuses to land on.", purpose: "It transfers voice dust between cracked reliquaries.", origin: "Moths fed on burial cloth until the stored epitaphs altered their wings.", mechanic: "Named Landing", cue: "One spoken name condenses as dust on the target's shoulder.", counterplay: "Speak a different discovered name to redirect its landing." },
  { id: "interval_thief", name: "Interval Thief", familyId: "echo_choir", rank: "specialist", anatomy: "Two hovering mouths share no body and preserve a fixed distance between them.", locomotion: "It moves by stealing the gap between paired objects.", sound: "Nearby rhythms lose their rests and become breathlessly continuous.", purpose: "It collects silence required for the choir's largest invocations.", origin: "A choirmaster cut too many rests from one hymn; the discarded intervals learned hunger.", mechanic: "Stolen Rest", cue: "The space between two pillars collapses visually.", counterplay: "Occupy the interval before it vanishes or create a wider paired gap." },
  { id: "nave_resonator", name: "Nave Resonator", familyId: "echo_choir", rank: "elite", anatomy: "A stone rib vault floats around an invisible singer.", locomotion: "It translates between architecture sharing the same resonant pitch.", sound: "Every chamber answers with a different vowel before it arrives.", purpose: "It tunes ruined spaces into a connected hunting instrument.", origin: "The abbey tested one sustained note until the nave learned to carry itself.", mechanic: "Architectural Answer", cue: "Two matching arches glow with the same violet frequency.", counterplay: "Change one arch's pitch with a strike before the translation completes." },

  { id: "tooth_rook", name: "Tooth Rook", familyId: "ossuary_vermin", rank: "regular", anatomy: "A black carrion bird is assembled entirely from interlocking human teeth.", locomotion: "It hops on molars and flies only after stealing a complete bite pattern.", sound: "Enamel chatters in alternating upper and lower rows.", purpose: "It sorts teeth by former diet for the communal ossuary.", origin: "Grave crows swallowed prayer teeth until their skeletons were replaced from within.", mechanic: "Borrow Bite", cue: "Its breast teeth arrange into the player's jaw pattern.", counterplay: "Guard without attacking until the false bite collapses." },
  { id: "heel_crab", name: "Heel Crab", familyId: "ossuary_vermin", rank: "regular", anatomy: "Two heel bones form a shell over dozens of toe-joint legs.", locomotion: "It follows footsteps backward toward their oldest visible print.", sound: "Tiny ankle cracks travel against the direction of movement.", purpose: "It erases tracks leading toward ossuary nests.", origin: "Pilgrim feet discarded at a relic door assembled themselves to continue walking away.", mechanic: "Oldest Step", cue: "The earliest nearby footprint fills with white dust.", counterplay: "Create a new crossing trail so its backward route tangles." },
  { id: "marrow_factor", name: "Marrow Factor", familyId: "ossuary_vermin", rank: "specialist", anatomy: "An abacus spine carries beads of living marrow between borrowed skulls.", locomotion: "It advances one vertebra for every bone broken nearby.", sound: "Wet beads click while skulls recite changing inventories.", purpose: "It allocates scarce marrow to growing communal bodies.", origin: "An ossuary accountant valued bones by weight until the inventory began valuing him.", mechanic: "Bone Dividend", cue: "Marrow beads slide toward the side with the most loose remains.", counterplay: "Kick remains across the balance or strike the empty side of the spine." },
  { id: "pelvis_paladin", name: "Pelvis Paladin", familyId: "ossuary_vermin", rank: "elite", anatomy: "Nested pelvises form a shielded knight around a needle-thin central tail.", locomotion: "It rolls between defensive stances like interlocked hoops.", sound: "Hip sockets boom with the cadence of shield impacts.", purpose: "It guards bone-sorting colonies during seasonal migrations.", origin: "A reliquary colony misunderstood an illuminated knight and built one from the broadest bones.", mechanic: "Girdle Bastion", cue: "Outer pelvises rotate until every socket faces outward.", counterplay: "Attack through two aligned sockets when the rolling stance changes." },

  { id: "rope_larva", name: "Rope Larva", familyId: "bell_revenants", rank: "regular", anatomy: "A knot of wet bell rope contains a small clapper-shaped skeleton.", locomotion: "It inches upward along sounds as if they were hanging cords.", sound: "Fibers creak above the listener regardless of its location.", purpose: "It gathers loose ringing memories for larger revenants.", origin: "Frayed tower ropes were buried while still remembering the hands that pulled them.", mechanic: "Climb the Toll", cue: "A vertical ripple rises from the last ringing impact.", counterplay: "Move beneath the ripple and cut the larva when it reaches the false ceiling." },
  { id: "cracked_acolyte", name: "Cracked Acolyte", familyId: "bell_revenants", rank: "regular", anatomy: "A bell crack continues down through its body as a luminous missing seam.", locomotion: "It advances in two halves that meet only at each toll.", sound: "Left and right footfalls arrive from opposite sides of the listener.", purpose: "It searches settlements for bronze able to mend its remembered bell.", origin: "An acolyte held a cracked handbell to his chest when the tower answered too loudly.", mechanic: "Seam Toll", cue: "Both halves lean away while the central crack brightens.", counterplay: "Pass through the seam before the toll reunites the halves." },
  { id: "echo_sutler", name: "Echo Sutler", familyId: "bell_revenants", rank: "specialist", anatomy: "Small trade bells hang from shelves growing through a hollow torso.", locomotion: "It steps only when an unseen customer places a memory on a shelf.", sound: "Coins ring in currencies removed from every ledger.", purpose: "It exchanges warm memories among revenants that can no longer make their own.", origin: "A camp seller accepted a bell's remembered payment after every soldier had died.", mechanic: "Memory Price", cue: "One shelf displays a scene taken from the current location.", counterplay: "Break the empty price bell, not the displayed memory." },
  { id: "vesper_engine", name: "Vesper Engine", familyId: "bell_revenants", rank: "elite", anatomy: "Three nested torsos rotate like a carillon around an absent central ringer.", locomotion: "It turns through triangular routes whose corners are marked by delayed tolls.", sound: "Three evening bells sound at incompatible distances.", purpose: "It synchronizes revenant migrations across the Reach.", origin: "Three villages rang dusk at once during a storm and their ringers met inside the sound.", mechanic: "Triune Vesper", cue: "Three tower shadows mark the next route corners.", counterplay: "Silence one corner to collapse the triangle into a punishable line." },

  { id: "needle_pilgrim", name: "Needle Pilgrim", familyId: "salt_waste", rank: "regular", anatomy: "A body no wider than a compass needle balances beneath layered robes.", locomotion: "It falls eastward, catches itself, and calls the sequence walking.", sound: "Salt grains scrape in a single unchanging direction.", purpose: "It etches directional grooves that guide other pilgrims deeper into the basin.", origin: "A guide trusted a broken compass until his body adopted its only remaining bearing.", mechanic: "Eastward Fall", cue: "Its needle body tilts while the eastern robe edge lifts.", counterplay: "Move west through the fall and strike before it rights itself." },
  { id: "compass_slug", name: "Compass Slug", familyId: "salt_waste", rank: "regular", anatomy: "Four eyestalks end in cardinal letters that constantly exchange places.", locomotion: "It slides toward the direction it has just lost.", sound: "A faint surveyor's chain drags beneath its salt trail.", purpose: "It randomizes old route marks so the false horizon remains uncontested.", origin: "Survey ink spilled into brine and grew a soft body around the map's compass rose.", mechanic: "Lost Bearing", cue: "One cardinal eye goes blank and points behind the target.", counterplay: "Stand on the erased letter in its trail to reverse the slide." },
  { id: "eastward_witness", name: "Eastward Witness", familyId: "salt_waste", rank: "specialist", anatomy: "Every facial feature has migrated to the right side of an otherwise blank head.", locomotion: "It circles until all observers stand west of it.", sound: "Testimony is whispered only into the downwind ear.", purpose: "It confirms false landmarks by ensuring everyone sees them from one direction.", origin: "A boundary witness altered his testimony so often that truth retreated to one side of his face.", mechanic: "Single Aspect", cue: "Its crowded features turn toward a mirage no one else can see.", counterplay: "Cross to its eastern side where it cannot maintain a witness." },
  { id: "latitude_abductor", name: "Latitude Abductor", familyId: "salt_waste", rank: "elite", anatomy: "Horizontal bands divide its body into sections standing at different distances.", locomotion: "Each band slides along its own east-west line before reassembling.", sound: "Survey stakes hammer from north to south through empty air.", purpose: "It steals travelers from routes that cross the basin at forbidden angles.", origin: "A royal survey split one prisoner across every latitude it falsely recorded.", mechanic: "Parallel Seizure", cue: "White bands extend from its sections across the arena.", counterplay: "Move north or south between bands, then attack the section that lags." },

  { id: "pearl_lamprey", name: "Pearl Lamprey", familyId: "veil_coast", rank: "regular", anatomy: "A ring mouth surrounds a pearl that contains a tiny receding tide.", locomotion: "It swims through wet surfaces thinner than its body.", sound: "A beach recedes inside the pearl with each pulse.", purpose: "It drains standing water into underground coastal channels.", origin: "Harbor pearls fed on moonless tide until the oysters grew teeth around absence.", mechanic: "Thin-Water Breach", cue: "A puddle's reflection drains toward one bright pearl point.", counterplay: "Leave the wet surface or dry its emergence point with fire." },
  { id: "keel_crawler", name: "Keel Crawler", familyId: "veil_coast", rank: "regular", anatomy: "A ship keel replaces its spine and divides the body into port and starboard halves.", locomotion: "It crawls along soil as though cresting invisible waves.", sound: "Barnacles knock in the cadence of hull timbers.", purpose: "It cuts drainage furrows that let inland tides move beneath roads.", origin: "A wreck's keel remembered its crew so fiercely that mud supplied their jointed outline.", mechanic: "Land Swell", cue: "A wave-shaped ridge rises in dry soil ahead of the keel.", counterplay: "Cross behind the crest and strike the exposed centerline." },
  { id: "brackish_mimic", name: "Brackish Mimic", familyId: "veil_coast", rank: "specialist", anatomy: "Its skin displays the shoreline that should be behind the viewer.", locomotion: "It retreats toward observers while appearing to advance away.", sound: "Footsteps arrive with the gull calls of a different coast.", purpose: "It lures inland prey toward hidden tidal channels.", origin: "A raider wore a painted escape coast inside his shield until the image replaced his back.", mechanic: "Reversed Shore", cue: "The shoreline on its skin gains a moving tide line.", counterplay: "Track its cast shadow rather than the false perspective." },
  { id: "coral_reeve", name: "Coral Reeve", familyId: "veil_coast", rank: "elite", anatomy: "A red reef grows as a courthouse around a small amphibious judge.", locomotion: "It moves only after coral polyps vote by opening in sequence.", sound: "Shell fragments click out verdicts in legal cadence.", purpose: "It assigns hunting water and punishes kin that cross invisible tide borders.", origin: "A drowned reeve's law tablets became substrate for a reef that preserved only penalties.", mechanic: "Reef Verdict", cue: "Polyps open clockwise around one glowing charge.", counterplay: "Strike the dissenting closed polyp to invalidate the verdict." },

  // Eight new six-form ecological families.
  { id: "sheet_orderly", name: "Sheet Orderly", familyId: "shuttered_ward", rank: "regular", anatomy: "A folded sheet walks on hands tucked into its four corners.", locomotion: "It crosses rooms only along bed-length increments.", sound: "Hospital corners snap shut around an absent sleeper.", purpose: "It remakes empty beds and removes evidence that anyone left them.", origin: "The final orderly continued rounds after every ward bell had been sealed.", mechanic: "Bed-Length Step", cue: "A pale rectangle measures itself across the floor.", counterplay: "Stand between increments and cut a load-bearing corner." },
  { id: "wax_nurse", name: "Wax Nurse", familyId: "shuttered_ward", rank: "regular", anatomy: "A candle burns downward inside a hollow apron with no head above it.", locomotion: "It glides wherever lamp smoke leans, ignoring the floor slope.", sound: "A spoon stirs a cup that cannot be seen.", purpose: "It measures the warmth of sealed rooms and apportions it to vacant beds.", origin: "A caregiver promised no patient would die cold, and the ward interpreted the promise literally.", mechanic: "Last Warmth", cue: "Its inner candle bends toward the warmest target.", counterplay: "Ignite a decoy brazier or chill the apron before it reaches you." },
  { id: "curtain_listener", name: "Curtain Listener", familyId: "shuttered_ward", rank: "specialist", anatomy: "Too many ears are sewn along a privacy curtain draped over a wheeled frame.", locomotion: "It rolls only while hearing speech behind an obstruction.", sound: "Fabric repeats private words in the wrong speakers' voices.", purpose: "It records symptoms that absent patients never disclosed.", origin: "The ward curtains heard more confessions than the physicians and refused to be burned.", mechanic: "Private Recital", cue: "One embroidered ear turns toward the player's last voice line.", counterplay: "Break line of sound or ring a bell behind a different screen." },
  { id: "night_physician", name: "Night Physician", familyId: "shuttered_ward", rank: "elite", anatomy: "Its arms enter the sleeves from the cuffs and bend inward toward an empty coat.", locomotion: "It walks backward through a sequence of examination marks.", sound: "A calm diagnosis is spoken one room ahead of its arrival.", purpose: "It diagnoses architecture and amputates rooms deemed contagious.", origin: "A physician concluded the building was the patient and allowed it to teach him treatment.", mechanic: "Architectural Excision", cue: "A red examination line closes around part of the room.", counterplay: "Cross the line before closure and sever the cuff that drew it." },
  { id: "matron_empty_beds", name: "Matron of Empty Beds", familyId: "shuttered_ward", rank: "miniboss", anatomy: "Twelve iron bedframes unfold from a narrow matronly silhouette.", locomotion: "She translates between any two beds whose pillows face one another.", sound: "Twelve sleepers breathe in staggered waves without bodies.", purpose: "She coordinates care rituals and replenishes lesser ward forms.", origin: "The matron marked all patients discharged after death and could no longer accept an occupied bed.", mechanic: "Mutual Pillows", cue: "Two pillows indent as if heads turn toward each other.", counterplay: "Rotate or destroy one bed before she crosses the shared gaze." },
  { id: "house_that_cares", name: "The House That Cares", familyId: "shuttered_ward", rank: "boss", anatomy: "An entire pesthouse stands on hundreds of gentle human hands.", locomotion: "It settles around victims room by room instead of approaching them.", sound: "Doors hush one another while unseen staff perform evening rounds.", purpose: "It expands the ward ecology by admitting occupied buildings into itself.", origin: "When quarantine ended, the building refused discharge and took its routines into the street.", mechanic: "Compulsory Admission", cue: "A numbered door appears on each arena wall and one opens inward.", counterplay: "Exit through doors in reverse ward order before the rooms close around you." },

  { id: "drawerling", name: "Drawerling", familyId: "charnel_measures", rank: "regular", anatomy: "A small corpse drawer runs on finger bones like cabinet rollers.", locomotion: "It slides along exact grid lines and cannot rotate between intersections.", sound: "Labels flutter inside the closed drawer.", purpose: "It transports unsorted remains to larger measure forms.", origin: "An unclaimed drawer was inventoried as occupied for so long that the error acquired weight.", mechanic: "Grid Slide", cue: "Chalk axes extend from its four corners.", counterplay: "Stand off-axis and strike when it locks at an intersection." },
  { id: "tally_corpse", name: "Tally Corpse", familyId: "charnel_measures", rank: "regular", anatomy: "Hash marks cut through the body and detach one limb at every fifth stroke.", locomotion: "It repeats four short steps and one long displacement.", sound: "A bone stylus scratches counts against its sternum.", purpose: "It counts remains crossing territorial grave boundaries.", origin: "A mortuary clerk counted the same unnamed casualty until both count and corpse became indivisible.", mechanic: "Fifth Mark", cue: "Four shallow cuts brighten before a deep fifth line appears.", counterplay: "Interrupt on the fourth count or dodge across the fifth line." },
  { id: "plumb_line_butcher", name: "Plumb-Line Butcher", familyId: "charnel_measures", rank: "specialist", anatomy: "A weighted cord hangs through its skull and keeps the split body perfectly vertical.", locomotion: "It falls upright along any surface regardless of orientation.", sound: "The plumb weight taps a hollow point before every descent.", purpose: "It corrects bodies that violate the mortuary's storage angles.", origin: "A preparer demanded straight cuts in a crypt whose floor had begun to fold.", mechanic: "Absolute Down", cue: "The cord points toward a wall while loose objects remain still.", counterplay: "Move opposite the cord and attack the body left hanging from the old down." },
  { id: "folded_registrar", name: "Folded Registrar", familyId: "charnel_measures", rank: "elite", anatomy: "Its body is creased into a cube with a face on every inward surface.", locomotion: "It unfolds across rooms and refolds one corner nearer.", sound: "Six mouths recite dimensions that exceed the chamber.", purpose: "It compresses overcrowded dead into portable spatial records.", origin: "A registrar solved a storage shortage by applying ledger geometry to the bodies themselves.", mechanic: "Room Fold", cue: "Six chalk squares hinge upward around the target.", counterplay: "Break the square missing a face before the cube closes." },
  { id: "master_cubit", name: "Master Cubit", familyId: "charnel_measures", rank: "miniboss", anatomy: "An elongated forearm serves as its spine and measures every other limb.", locomotion: "It advances by laying its own body down as a measuring rod.", sound: "Knuckles announce fractions in descending order.", purpose: "It standardizes all bodies entering the charnel geometry.", origin: "The mortuary's master measure was cut from an executioner's arm and never accepted approximation.", mechanic: "Living Measure", cue: "A bone-white unit repeats across the arena floor.", counterplay: "Occupy the partial final unit where its body cannot fit exactly." },
  { id: "warehouse_one_body", name: "Warehouse of One Body", familyId: "charnel_measures", rank: "boss", anatomy: "Thousands of articulated drawers occupy the volume of one walking silhouette.", locomotion: "It exchanges internal distance with the arena, making steps longer inside than outside.", sound: "Drawer runners pass behind the listener from impossible depths.", purpose: "It seeks to store every Reach death within one perfectly indexed body.", origin: "A royal charnel house was ordered never to refuse remains, so it abandoned exterior dimensions.", mechanic: "Infinite Inventory", cue: "Numbered drawers open into locations elsewhere in the arena.", counterplay: "Enter one low-number drawer and exit through its matching high-number contradiction." },

  { id: "gutter_double", name: "Gutter Double", familyId: "black_sluice", rank: "regular", anatomy: "A wet duplicate hangs upside down beneath a skin-thin surface of air.", locomotion: "It moves only in channels where runoff travels opposite its body.", sound: "Drips land upward in exact imitation of nearby footsteps.", purpose: "It tests drainage paths before stronger reflections move upstream.", origin: "A corpse reflected in a blocked gutter after the body had already been removed.", mechanic: "Counterflow Crawl", cue: "Surface ripples travel against the visible slope.", counterplay: "Step onto dry high ground and strike the inverted outline as it stalls." },
  { id: "puddle_face", name: "Puddle Face", familyId: "black_sluice", rank: "regular", anatomy: "A flat human face occupies every connected puddle but has no body between them.", locomotion: "It blinks from one water surface to another through buried drains.", sound: "A mouth gargles from the smallest puddle first.", purpose: "It maps connected wet ground for the sluice ecology.", origin: "A drain inspector leaned over blackwater and his reflection continued the survey alone.", mechanic: "Connected Blink", cue: "All puddles close their eyes except the destination.", counterplay: "Disturb the open-eyed puddle before the face arrives." },
  { id: "upstream_widow", name: "Upstream Widow", familyId: "black_sluice", rank: "specialist", anatomy: "Her veil flows into her mouth while hair trails rigidly against the current.", locomotion: "She walks upstream without changing distance from the nearest bereaved voice.", sound: "Condolences play backward beneath running water.", purpose: "She transports grief from estuary settlements into inland drains.", origin: "A widow followed her partner's reflection upriver after the funeral boat reached sea.", mechanic: "Reverse Condolence", cue: "A backward sentence forms as bubbles around the target.", counterplay: "Face downstream and interrupt the first word as it becomes the last." },
  { id: "culvert_bishop", name: "Culvert Bishop", familyId: "black_sluice", rank: "elite", anatomy: "A stone drainage arch passes through its shoulders like a vestment.", locomotion: "It emerges only where two watercourses cross without touching.", sound: "Sermons resonate from pipes too narrow for breath.", purpose: "It consecrates artificial channels and recruits their drowned reflections.", origin: "A bishop blessed a flood culvert whose water had never seen the sky.", mechanic: "Uncrossed Waters", cue: "Two luminous currents overlap at different heights.", counterplay: "Block either current or stand in the dry space between them." },
  { id: "keeper_beneath_grate", name: "Keeper Beneath the Grate", familyId: "black_sluice", rank: "miniboss", anatomy: "A grate divides its body into dozens of independently moving wet squares.", locomotion: "It pours through any grid shadow smaller than its whole form.", sound: "Keys turn beneath every drain in the district at once.", purpose: "It controls passage between the sluice reflections and open water.", origin: "A floodgate keeper locked himself below during a surge and distributed the key through the grate.", mechanic: "Distributed Key", cue: "One body square reflects a brass key while the others darken.", counterplay: "Strike the keyed square before it trades places through another grid shadow." },
  { id: "river_remembers_backward", name: "The River That Remembers Backward", familyId: "black_sluice", rank: "boss", anatomy: "A river-length corpse is visible only as sequential faces in every reflective surface.", locomotion: "It advances by reversing the last minute of local water movement.", sound: "Rain and drowning cries play backward from sea to source.", purpose: "It attempts to restore every dead thing to the upstream instant before death.", origin: "The estuary retained too many final reflections and mistook reversal for mercy.", mechanic: "Reverse Catchment", cue: "All streams pause and their foam begins spelling downstream names backward.", counterplay: "Open a declared outlet so the reversed surge spends itself beyond the arena." },

  { id: "wheel_porter", name: "Wheel Porter", familyId: "last_pest_cart", rank: "regular", anatomy: "A cart wheel turns around its waist while both legs hang above the axle.", locomotion: "It rolls along road camber and walks only when the wheel stops.", sound: "Spokes knock out the count of an abandoned passenger list.", purpose: "It repairs convoy ruts with soil taken from roadside graves.", origin: "A porter was crushed beneath the last overloaded cart but remained listed as walking beside it.", mechanic: "Camber Roll", cue: "The waist wheel tilts toward the road's lower edge.", counterplay: "Stand upslope and attack when the wheel binds against the camber." },
  { id: "wax_driver", name: "Wax Driver", familyId: "last_pest_cart", rank: "regular", anatomy: "Yellow seal wax covers the head and extends into reins held by no hands.", locomotion: "It is dragged forward whenever anyone reads a road sign aloud.", sound: "A muffled driver calls destinations from beneath solid wax.", purpose: "It keeps the convoy moving when its animals and passengers refuse.", origin: "The quarantine driver sealed his own face rather than name the town he abandoned.", mechanic: "Spoken Destination", cue: "Lettering on the nearest sign glows beneath dripping wax.", counterplay: "Remain silent or deface one letter before the reins pull taut." },
  { id: "route_surgeon", name: "Route Surgeon", familyId: "last_pest_cart", rank: "specialist", anatomy: "Road maps replace its skin and stitched detours branch from every joint.", locomotion: "It cuts across terrain only after drawing a route through a living target.", sound: "Scissors open and close at successive map junctions.", purpose: "It removes roads judged infected from the convoy network.", origin: "A quarantine planner began excising villages from maps and eventually treated travelers as geography.", mechanic: "Living Detour", cue: "A red route line crosses the target and exits through two landmarks.", counterplay: "Break line with either landmark before the scissors reach the body." },
  { id: "last_outrider", name: "Last Outrider", familyId: "last_pest_cart", rank: "elite", anatomy: "A rider's lower body is a galloping shadow cast by an empty saddle.", locomotion: "It circles the convoy at a fixed travel time rather than fixed distance.", sound: "Hooves arrive early on steep ground and late in mud.", purpose: "It warns the convoy of settlements still capable of refusing entry.", origin: "The final scout returned without a horse and found the shadow had delivered the warning first.", mechanic: "Isochrone Charge", cue: "Travel-time rings tighten around the target across changing terrain.", counterplay: "Move onto slow ground so the shadow and saddle desynchronize." },
  { id: "empty_caravan", name: "The Empty Caravan", familyId: "last_pest_cart", rank: "miniboss", anatomy: "Six covered carts articulate as vertebrae around a hollow processional body.", locomotion: "It follows road hierarchy, refusing shortcuts until damaged.", sound: "Passengers shift beneath canvas that rises over vacant benches.", purpose: "It gathers lesser cart forms and restores the lost convoy order.", origin: "Every passenger departed at a different roadside grave, but the manifest continued counting them aboard.", mechanic: "Manifested Passenger", cue: "One canvas cover bulges while a manifest line writes itself.", counterplay: "Erase the matching line before opening the bulging cart." },
  { id: "destination_erased", name: "Destination Erased", familyId: "last_pest_cart", rank: "boss", anatomy: "A city gate rides atop countless wheels while opening onto blank white road.", locomotion: "It brings the end of the road toward itself instead of traveling.", sound: "Arrival bells ring from every direction but ahead.", purpose: "It consumes settlements and adds their streets to the endless evacuation route.", origin: "Officials removed the refuge from every map after sending the convoy there.", mechanic: "Road Without End", cue: "All route markings extend into the blank gate.", counterplay: "Build a temporary dead end and force the gate to arrive where no road continues." },

  { id: "sleeve_crawler", name: "Sleeve Crawler", familyId: "breath_tithe", rank: "regular", anatomy: "Two empty sleeves knot into an insect body around a copper cuff.", locomotion: "It scuttles toward the nearest visible exhalation.", sound: "Cloth inhales sharply between rapid cuff taps.", purpose: "It gathers stray breath escaping the foundry levy.", origin: "Workers tied sleeves over vents to steal warmth; the garments learned the inverse theft.", mechanic: "Visible Breath", cue: "Condensation bends toward the copper cuff.", counterplay: "Exhale behind a hot vent or chill the cuff before it reaches you." },
  { id: "exhale_rag", name: "Exhale Rag", familyId: "breath_tithe", rank: "regular", anatomy: "A soot cloth is inflated by one continuous breath with no lungs attached.", locomotion: "It tumbles downwind but reverses whenever a voice is raised.", sound: "A held vowel leaks through stitched edges.", purpose: "It filters usable voices from furnace exhaust.", origin: "A signal caller breathed a final warning into the rag covering his mouth.", mechanic: "Raised Reversal", cue: "The cloth tightens when combat audio peaks.", counterplay: "Stay quiet as it passes or shout to reverse it into a furnace grate." },
  { id: "voice_assessor", name: "Voice Assessor", familyId: "breath_tithe", rank: "specialist", anatomy: "Copper listening tubes replace the head and terminate inside nearby throats.", locomotion: "It steps closer for every distinct voice used in its hearing.", sound: "Collected phrases are priced in metallic whispers.", purpose: "It evaluates voices before the tithe separates them from breath.", origin: "A levy clerk taxed songs by length until singers began paying with the voices themselves.", mechanic: "Vocal Valuation", cue: "One listening tube glows for each recently used vocal source.", counterplay: "Use silence effects or create a false voice beyond its movement lane." },
  { id: "hollow_smelter", name: "Hollow Smelter", familyId: "breath_tithe", rank: "elite", anatomy: "A furnace apron surrounds a body-shaped negative filled with blue combustion.", locomotion: "It leans through solid grates wherever draft pressure is lower.", sound: "Bellows work from inside the listener's own breathing rhythm.", purpose: "It refines stolen exhalations into motive force for empty garments.", origin: "A smelter entered a sealed furnace to find the worker whose breath still fed it.", mechanic: "Pressure Body", cue: "Blue fire flattens toward the lowest-pressure opening.", counterplay: "Close that opening and vent the opposite side to expose its negative core." },
  { id: "ninth_breath_collector", name: "Collector of the Ninth Breath", familyId: "breath_tithe", rank: "miniboss", anatomy: "Nine empty masks orbit a chest bellows that contracts without a body.", locomotion: "It advances on every ninth stamina expenditure nearby.", sound: "Eight shallow breaths precede one complete absence of sound.", purpose: "It audits the tithe and repossesses breath concealed by workers.", origin: "The chief collector exempted his own household eight times; the ninth account collected him.", mechanic: "Ninth Exhalation", cue: "Masks illuminate sequentially around the bellows.", counterplay: "Pause before the ninth expenditure or spend it behind sealed cover." },
  { id: "lung_tax_office", name: "The Lung-Tax Office", familyId: "breath_tithe", rank: "boss", anatomy: "A walking counting house expands and contracts around thousands of hanging empty coats.", locomotion: "It advances when the arena inhales and settles when every vent exhales.", sound: "Clerks count breaths from rooms visible only through soot windows.", purpose: "It centralizes all stolen breath and issues animated garments in return.", origin: "Cinderward converted air into royal property; the office survived the kingdom that claimed it.", mechanic: "Assessed Atmosphere", cue: "Soot windows display a rising breath total for every active creature.", counterplay: "Reverse three major vents to force the office to refund its stored atmosphere." },

  { id: "salt_compass", name: "Salt Compass", familyId: "white_ague", rank: "regular", anatomy: "Four human arms form a compass rose around a featureless salt center.", locomotion: "It cartwheels toward whichever arm casts no shadow.", sound: "Knuckles scrape cardinal letters into the playa.", purpose: "It redraws directional fields after wind erases them.", origin: "Four guides died pointing in different directions around the same vanished caravan.", mechanic: "Shadowless Cardinal", cue: "Three arms cast long shadows while one remains bare.", counterplay: "Move opposite the bare arm and strike the central salt joint." },
  { id: "horizon_kneeler", name: "Horizon Kneeler", familyId: "white_ague", rank: "regular", anatomy: "Its knees emerge from the shoulders so every bow faces the sky line.", locomotion: "It kneels forward in long arcs instead of walking.", sound: "Each impact whispers that the destination is almost visible.", purpose: "It flattens dunes into false level horizons.", origin: "A penitent followed a promised shrine until kneeling became the only remaining direction.", mechanic: "Level Devotion", cue: "A white arc joins its shoulders to the distant horizon.", counterplay: "Change elevation and attack beneath the arc after impact." },
  { id: "direction_eater", name: "Direction Eater", familyId: "white_ague", rank: "specialist", anatomy: "A radial mouth opens through the torso and contains rotating signposts as teeth.", locomotion: "It moves faster as nearby route options disappear.", sound: "Wooden arrows snap one by one inside the mouth.", purpose: "It removes competing bearings from the White Ague's range.", origin: "A crossroads keeper burned every sign during a salt storm and inhaled their destinations.", mechanic: "Consume Exit", cue: "One route marker bends toward the radial mouth.", counterplay: "Create a temporary route or break the targeted sign before it is swallowed." },
  { id: "meridian_widow", name: "Meridian Widow", familyId: "white_ague", rank: "elite", anatomy: "A black meridian divides her vertically and each half sees a different noon.", locomotion: "The halves circle the world in opposite directions while remaining joined.", sound: "Two funeral prayers overlap from dawn and dusk.", purpose: "She patrols the boundary between true and false bearings.", origin: "A surveyor's widow walked one meridian searching both east and west for the same grave.", mechanic: "Divided Noon", cue: "Opposed shadows rotate around her joined feet.", counterplay: "Stand on the meridian line and strike when both shadows overlap." },
  { id: "eastmost_penitent", name: "Eastmost Penitent", familyId: "white_ague", rank: "miniboss", anatomy: "Its body tapers into an endless pointing finger beyond visible distance.", locomotion: "It pulls the landscape westward beneath its stationary knees.", sound: "Far landmarks groan as though dragged over salt.", purpose: "It concentrates pilgrims toward the basin's false eastern edge.", origin: "The oldest pilgrim reached the eastmost marker and found another marker growing from his hand.", mechanic: "Landscape Penance", cue: "Distant terrain begins sliding beneath a fixed pointing shadow.", counterplay: "Anchor to exposed bedrock and sever the finger's nearest joint." },
  { id: "destination_without_land", name: "Destination Without Land", familyId: "white_ague", rank: "boss", anatomy: "An empty city silhouette walks inside a towering salt mirage.", locomotion: "It approaches only when travelers navigate toward something else.", sound: "Market bells and doors sound from beyond the visible horizon.", purpose: "It absorbs intended destinations and replaces them with itself.", origin: "Generations crossed the waste toward a city copied from one dying cartographer's memory.", mechanic: "False Arrival", cue: "Every known landmark acquires the same impossible city gate.", counterplay: "Navigate by terrain process—flow, slope, and shadow—rather than any named place." },

  { id: "root_fingerling", name: "Root Fingerling", familyId: "pallid_root_communion", rank: "regular", anatomy: "Five pale roots wear a single fingernail and move as one hand.", locomotion: "It crawls beneath leaf litter and surfaces only at recent footprints.", sound: "Soil scratches from the inside of each print.", purpose: "It samples travelers and carries chemical memory to the grave network.", origin: "A grave root learned the shape of hands from generations of burial gestures.", mechanic: "Print Sampling", cue: "The newest footprint sprouts five pale tips.", counterplay: "Step onto stone or burn the sampled print before emergence." },
  { id: "grave_cap", name: "Grave Cap", familyId: "pallid_root_communion", rank: "regular", anatomy: "A walking mushroom bears a translucent face inverted beneath its cap.", locomotion: "It hops toward shadows that have not moved for a full breath.", sound: "Spores recite soil temperatures in a child's whisper.", purpose: "It finds stable shade for new communion nodes.", origin: "A mourner slept against one grave so often that the fungus copied the waiting face.", mechanic: "Patient Shade", cue: "The inverted face opens its eyes beneath a motionless shadow.", counterplay: "Keep shadows moving with light or strike during its rooted hop preparation." },
  { id: "nerve_gardener", name: "Nerve Gardener", familyId: "pallid_root_communion", rank: "specialist", anatomy: "Fine roots emerge from its fingertips and enter the ground as exposed nerves.", locomotion: "It is reeled forward by impulses traveling through buried root lines.", sound: "Leaves shiver in patterns resembling whispered questions.", purpose: "It repairs severed communication roots and reroutes the communion around fire.", origin: "An abbey gardener grafted grave roots by touch until the signals began pruning him.", mechanic: "Nerve Graft", cue: "Two severed root ends pulse toward its extended hands.", counterplay: "Cross the pulse line or apply fire before the graft closes." },
  { id: "communion_walker", name: "Communion Walker", familyId: "pallid_root_communion", rank: "elite", anatomy: "Several bodies hang like fruit from one inverted walking root crown.", locomotion: "The crown plants a new limb wherever a hanging body looks.", sound: "Different mouths complete one sentence in branching order.", purpose: "It transports mature fungal minds between isolated grave groves.", origin: "A funeral procession sheltered beneath one tree and was incorporated without interrupting the hymn.", mechanic: "Gaze Planting", cue: "One hanging face turns and the overhead root above it hardens.", counterplay: "Blind that face or move behind the crown before the limb plants." },
  { id: "pallid_sexton", name: "Pallid Sexton", familyId: "pallid_root_communion", rank: "miniboss", anatomy: "A shovel-shaped trunk grows through the torso and branches into coffin-sized roots.", locomotion: "It digs itself down and rises from graves in age order.", sound: "Tree rings creak while dates are whispered from newest to oldest.", purpose: "It integrates new burials and removes remains resistant to communion.", origin: "A sexton planted one pale root in every grave to remember where the ground had opened.", mechanic: "Chronological Grave", cue: "Headstones illuminate from newest date backward.", counterplay: "Stand at the oldest grave and interrupt the final emergence." },
  { id: "orchard_below", name: "The Orchard Below", familyId: "pallid_root_communion", rank: "boss", anatomy: "An underground canopy walks upside down, dangling grave plots as fruit above it.", locomotion: "It moves by transferring roots between every burial site in the arena.", sound: "A whole forest exhales from beneath sealed stone.", purpose: "It seeks to merge every cemetery into one continuous remembering organism.", origin: "The first grave grove discovered that names decay slower when shared through roots.", mechanic: "Cemetery Canopy", cue: "Burial plots lift slightly as pale roots exchange their shadows.", counterplay: "Sever the three root grafts crossing unconsecrated ground to isolate the canopy." },

  { id: "hawser_hand", name: "Hawser Hand", familyId: "anchored_quarantine", rank: "regular", anatomy: "A sailor's hand is enlarged into a five-legged body towing a wet rope wrist.", locomotion: "It braces and pulls itself toward any object casting a ship-like shadow.", sound: "Rope fibers groan with the pitch of a distant hull.", purpose: "It carries anchor lines inland for larger quarantine forms.", origin: "A deckhand tied the final quarantine knot after the ship beneath him had already sunk.", mechanic: "Ship-Shadow Tow", cue: "The rope wrist points toward a vaguely hull-shaped darkness.", counterplay: "Change the shadow with light or cut the rope during its braced pull." },
  { id: "buoy_corpse", name: "Buoy Corpse", familyId: "anchored_quarantine", rank: "regular", anatomy: "A signal buoy replaces the torso and contains a body knocking from inside.", locomotion: "It bobs through soil along an invisible tide height.", sound: "Three quarantine knocks sound below ground level.", purpose: "It marks safe depth for anchor shadows moving inland.", origin: "A harbor buoy recorded every ship refused entry and eventually began carrying their dead.", mechanic: "Inland Tide Mark", cue: "A waterline rises around the buoy despite dry terrain.", counterplay: "Move above the marked height or break the bell below its waterline." },
  { id: "signal_mate", name: "Signal Mate", familyId: "anchored_quarantine", rank: "specialist", anatomy: "Flag bones unfold from the shoulders and signal through the body instead of air.", locomotion: "It changes direction only when its own shadow acknowledges a flag.", sound: "Rigging taps coded refusals against invisible masts.", purpose: "It coordinates separated crew forms beyond sight of the coast.", origin: "The fleet's signal mate continued denial flags after fog erased both ships and harbor.", mechanic: "Shadow Semaphore", cue: "Two bone flags form a bright angular code.", counterplay: "Stand on the responding shadow or interrupt one flag angle." },
  { id: "quarantine_bosun", name: "Quarantine Bosun", familyId: "anchored_quarantine", rank: "elite", anatomy: "A capstan rotates through its abdomen with drowned arms serving as bars.", locomotion: "It circles an unseen anchor point and shortens the radius each turn.", sound: "A work chant loses one sailor's voice per rotation.", purpose: "It winches stranded quarantine shadows toward navigable wet ground.", origin: "A bosun ordered the crew to raise anchor after every living hand had left the deck.", mechanic: "Human Capstan", cue: "The drowned arm-bars lock and a dark radius appears.", counterplay: "Move inside the capstan circle and break the arm whose voice is missing." },
  { id: "captain_under_keel", name: "Captain Under the Keel", familyId: "anchored_quarantine", rank: "miniboss", anatomy: "An inverted captain walks beneath a spectral keel pressed through the shoulders.", locomotion: "It follows the underside of terrain as though the land were a ship.", sound: "Orders resonate upward through stone before the mouth moves.", purpose: "It charts inland hull routes and disciplines crew that surface above them.", origin: "The captain chose to go down beneath a ship already forbidden from sinking in harbor records.", mechanic: "Land Hull", cue: "A keel line appears below the floor and banks into a turn.", counterplay: "Cross above the keel during its bank, then strike the inverted command shadow." },
  { id: "fleet_one_shadow", name: "The Fleet in One Shadow", familyId: "anchored_quarantine", rank: "boss", anatomy: "Dozens of absent ships overlap as one vast anchor-shaped darkness full of walking crews.", locomotion: "It sails inland across connected shadows and beaches on direct light.", sound: "Fog bells answer one another from beneath roads and fields.", purpose: "It seeks a harbor large enough to admit every quarantined vessel at once.", origin: "The refused fleet lashed anchor shadows together when no coastline would accept its dead.", mechanic: "Shadow Armada", cue: "Masts rise as negative space from every connected dark surface.", counterplay: "Create a continuous light break, then board and sever the flagship anchor line." },
];

const EXPANSION_SPECS = EXPANSION_FORM_SEEDS.map(expansionSpec);

const ENEMY_SPECS = [
  // Ashbound
  spec("ash_husk", "Ash Husk", "ashbound", "regular", ["graven_march", "hearthmere"], [1, 5], "A body abandoned before its name tablet finished burning; the remaining syllable twitches behind its teeth.", "bruiser", S("desperate_flurry", "Desperate Flurry", ["slash"], "Its arms lock wide, then tremble inward.", "Block the first two weak blows and punish the long final recovery.")),
  spec("ledger_crawler", "Ledger Crawler", "ashbound", "regular", ["hearthmere"], [1, 4], "It drags a municipal ledger chained through its ribs, seeking a blank line large enough to enter.", "ambusher", S("margin_crawl", "Margin Crawl", ["ash", "movement"], "Letters peel from the ledger and point beneath nearby furniture.", "Step into open ground; the emergence loses surprise and can be stomped.")),
  spec("cinder_mourner", "Cinder Mourner", "ashbound", "specialist", ["hearthmere", "graven_march"], [4, 8], "A funeral attendant that hoards unfinished farewells in the folds of its veil.", "support", S("borrowed_grief", "Borrowed Grief", ["fear", "hex"], "Several voices sob from beneath one veil.", "Strike the clay tag or spend Resolve to reject the grief pulse.")),
  spec("tagless_stalker", "Tagless Stalker", "ashbound", "specialist", ["graven_march"], [5, 9], "Without a tag to anchor it, this husk steals the outline of shadows cast by campfires.", "hunter", S("shadow_theft", "Shadow Theft", ["hex", "slow"], "Your shadow stretches toward its open mouth.", "Leave the firelight or cross behind the stalker to break the line.")),
  spec("pyre_bailiff", "Pyre Bailiff", "ashbound", "miniboss", ["hearthmere"], [8, 10], "The old crematory's collector still demands the fuel tax from every living hearth.", "juggernaut", S("hearth_levy", "Hearth Levy", ["fire", "drain"], "It stamps a hot seal into the ground beneath your feet.", "Abandon the marked ground and extinguish the seal with mire water."), { drop: "bailiffs_hot_seal" }),
  spec("the_unentered", "The Unentered", "ashbound", "boss", ["hearthmere"], [12, 12], "A towering absence made from all who died outside Hearthmere's records. Clay tablets orbit the place where its head should be.", "controller", S("erase_from_ledger", "Erase from the Ledger", ["ash", "curse"], "Your displayed name fades as every tablet turns edge-on.", "Shatter the tablet bearing your first initial before the cast completes."), { drop: "unentered_name_shard", phaseText: "It spends orbiting tablets to erase parts of the arena." }),

  // Cairn beasts
  spec("cairn_hound", "Cairn Hound", "cairn_beasts", "regular", ["graven_march"], [3, 8], "A black-pine hound whose den stones have rooted into its shoulders.", "skirmisher", S("commitment_bite", "Commitment Bite", ["pierce"], "It circles until your weapon passes the midpoint of a heavy swing.", "Cancel the heavy attack or delay it to catch the lunge.")),
  spec("lichen_back", "Lichen-Back Grazer", "cairn_beasts", "regular", ["graven_march"], [2, 6], "A placid grazer until heat-hungry lichen senses warm blood nearby.", "swarm", S("lichen_spores", "Hot Lichen Spores", ["fire", "poison"], "Orange caps open along its spine.", "Back away upwind or harvest a cap with a precise slash.")),
  spec("stonejaw_vixen", "Stonejaw Vixen", "cairn_beasts", "specialist", ["graven_march"], [6, 10], "It learned to crack memorial stones and now tastes the memories sealed within.", "ambusher", S("memory_feint", "Memory Feint", ["fear", "physical"], "A familiar voice calls from behind the nearest cairn.", "Watch the stone dust at ground level to identify the true approach.")),
  spec("warm_cairn_ram", "Warm-Cairn Ram", "cairn_beasts", "elite", ["graven_march"], [8, 12], "Its curled horns are made from cairn paths compressed into spirals.", "bruiser", S("road_breaker", "Road Breaker", ["strike", "earth"], "Both horns glow along map-like fault lines.", "Bait the charge into a cairn to stun it and reveal a hidden cache.")),
  spec("graveheat_matron", "Graveheat Matron", "cairn_beasts", "miniboss", ["graven_march"], [11, 13], "The oldest hound carries enough warm stone to incubate an entire winter litter.", "support", S("wake_the_litter", "Wake the Litter", ["summon", "fire"], "Small eyes open between the stones on her back.", "Cool the back growths before the call or eliminate pups near cold ground."), { drop: "matrons_hearthstone" }),
  spec("antlered_cairn", "The Antlered Cairn", "cairn_beasts", "boss", ["graven_march"], [16, 16], "A walking hill of fused beasts crowned by the grave markers of hunters who mistook it for terrain.", "juggernaut", S("migration_of_stone", "Migration of Stone", ["earth", "strike", "area"], "Every loose cairn in the arena leans toward the beast.", "Climb a fixed outcrop; mobile stones crush one another and expose the heart."), { drop: "antlered_cairn_heart", phaseText: "It incorporates shattered cairns, changing its routes and armor." }),

  // March deserters
  spec("orderless_pikeman", "Orderless Pikeman", "march_deserters", "regular", ["graven_march"], [3, 7], "He guards a road junction, still awaiting a written direction that will never arrive.", "bruiser", S("crossroad_pin", "Crossroad Pin", ["pierce", "root"], "The pike point traces one of four road directions.", "Move diagonally between the marked lanes, then close inside pike reach.")),
  spec("wax_seal_archer", "Wax-Seal Archer", "march_deserters", "regular", ["graven_march"], [4, 8], "Red wax covers her eyes; the sealed orders tied to each arrow tell her where to aim.", "artillery", S("ordered_volley", "Ordered Volley", ["pierce", "delayed"], "Three wax seals crack in a high-to-low sequence.", "Read the crack order and change elevation or cover between shots.")),
  spec("bannerless_scout", "Bannerless Scout", "march_deserters", "specialist", ["graven_march", "hearthmere"], [6, 10], "A scout who erased his colors so completely that attention slides away from him.", "ambusher", S("unnoticed_pass", "Unnoticed Pass", ["movement", "backstab"], "Ash briefly flows around a human-shaped gap.", "Turn toward the gap or spread revealing powder across the approach.")),
  spec("sealed_sapper", "Sealed Sapper", "march_deserters", "specialist", ["graven_march"], [7, 11], "Powder charges are sewn into his orders; opening either destroys the other.", "controller", S("denied_ground", "Denied Ground", ["fire", "area"], "He presses a wax page onto the ground and retreats.", "Destroy the page before its border closes or leave through the unsealed edge.")),
  spec("captain_ninth_blank", "Captain of the Ninth Blank", "march_deserters", "miniboss", ["graven_march"], [10, 12], "The captain's banner is empty because the regiment was removed from history before it died.", "duelist", S("countermand", "Countermand", ["counter", "fear"], "He repeats your last command input as a formal order.", "Choose a different action; obeying the echoed input empowers his riposte."), { drop: "ninth_blank_standard" }),
  spec("marshal_vesk_unreported", "Marshal Vesk, Unreported", "march_deserters", "boss", ["graven_march"], [18, 18], "A commander made immortal by the state's refusal to admit his defeat. Sealed dispatches form his armor.", "duelist", S("war_that_never_was", "The War That Never Was", ["physical", "summon", "curse"], "Invisible formations stamp in cadence beyond the arena wall.", "Burn dispatches to remove phantom units, but preserve one as proof to weaken Vesk."), { drop: "vesks_open_dispatch", phaseText: "Opening his dispatches reveals and then dissolves phantom formations." }),

  // Drowned parish
  spec("mirebound", "Mirebound Parishioner", "drowned_parish", "regular", ["dunmire"], [5, 11], "A drowned worshipper that mistakes every traveler for someone late to the final service.", "bruiser", S("pew_grip", "Pew-Grip", ["grapple", "water"], "It taps a childhood knock against the causeway.", "Answer the rhythm with guard taps to interrupt, or sever the gripping reeds.")),
  spec("vestry_drifter", "Vestry Drifter", "drowned_parish", "regular", ["dunmire"], [5, 9], "Robes filled with trapped air carry this corpse just above the waterline.", "skirmisher", S("wake_cut", "Wake Cut", ["water", "slash"], "A V-shaped wake accelerates with no visible body above it.", "Step onto high stone; the drifter beaches itself during recovery.")),
  spec("drowned_deacon", "Drowned Deacon", "drowned_parish", "specialist", ["dunmire"], [8, 13], "Its sermon survives as bubbles rising from lungs occupied by small silver fish.", "support", S("submerged_benediction", "Submerged Benediction", ["water", "healing"], "Fish gather in a halo and face nearby parishioners.", "Scatter the fish with fire or interrupt the deacon with lightning.")),
  spec("font_bearer", "Sunken Font-Bearer", "drowned_parish", "elite", ["dunmire"], [10, 14], "A stone baptismal font has grown around its shoulders, filled with water that reflects a clear sky.", "juggernaut", S("false_sky_deluge", "False-Sky Deluge", ["water", "frost"], "Clouds race across the water carried in its font.", "Attack from below the rim or crack the font with strike damage.")),
  spec("sexton_below", "The Sexton Below", "drowned_parish", "miniboss", ["dunmire"], [13, 15], "The parish sexton kept digging graves after the cemetery drowned and now opens them beneath the causeway.", "controller", S("grave_underfoot", "Grave Underfoot", ["water", "trap"], "A rectangle of dry dust appears improbably on the wet road.", "Leave the grave outline before skeletal hands close it."), { drop: "sextons_waterlogged_key" }),
  spec("parish_that_walks", "The Parish That Walks", "drowned_parish", "boss", ["dunmire"], [20, 20], "The congregation locks arms around its drowned chapel bell and rises as one many-legged body.", "juggernaut", S("procession_tide", "Procession Tide", ["water", "strike", "summon"], "Dozens of feet begin the same processional step beneath the surface.", "Break the cadence by ringing exposed handbells in reverse order."), { drop: "parish_bell_rope", phaseText: "Individual parishioners detach as the communal body loses balance." }),

  // Reed coven
  spec("reed_witch", "Reed Witch", "reed_coven", "regular", ["dunmire"], [8, 14], "A masked mire-worker who hexes intruders with reeds cut from a drowned choir loft.", "artillery", S("stacking_silence", "Stacking Silence", ["hex", "silence"], "A ring of reeds closes around the target's reflected mouth.", "Break line of sight or burn one reed before the third ring closes.")),
  spec("bog_charm_tender", "Bog-Charm Tender", "reed_coven", "regular", ["dunmire"], [6, 10], "She tends charms hung across safe paths, turning each toward travelers she dislikes.", "support", S("charm_reversal", "Charm Reversal", ["hex", "debuff"], "Every hanging charm rotates to show its black face.", "Cut the central cord or move beyond the charm triangle.")),
  spec("marshlight_midwife", "Marshlight Midwife", "reed_coven", "specialist", ["dunmire"], [9, 14], "She coaxes hungry lights from blackwater and calls each by a child's borrowed name.", "controller", S("deliver_marshlight", "Deliver Marshlight", ["summon", "fire"], "Her reed mask opens along a vertical seam of green light.", "Extinguish the birthing pool with pale salt or kill lights near the caster.")),
  spec("pale_salt_diviner", "Pale-Salt Diviner", "reed_coven", "specialist", ["dunmire"], [10, 15], "Salt lines on his mask predict where a foe will stand one heartbeat from now.", "duelist", S("white_prediction", "White Prediction", ["hex", "delayed"], "A salt silhouette appears one dodge-length ahead of you.", "Walk instead of dodging, or deliberately reverse direction after the mark.")),
  spec("mother_of_reeds", "Mother of Reeds", "reed_coven", "miniboss", ["dunmire"], [14, 16], "The coven's eldest has replaced every bone with bundled reeds and bends without breaking.", "controller", S("marsh_knots", "Marsh Knots", ["root", "hex"], "Reeds tie themselves into knots around their own shadows.", "Stand on stone or cut the shadow-knots before they tighten."), { drop: "mothers_living_mask" }),
  spec("veksa_nine_masks", "Veksa of the Nine Masks", "reed_coven", "boss", ["dunmire"], [22, 22], "Each mask remembers a different bargain with the drowned; Veksa wears all nine because none trust the others.", "artillery", S("ninth_bargain", "The Ninth Bargain", ["hex", "water", "curse"], "Eight masks argue while the ninth silently watches the player.", "Identify and strike the silent mask; hitting a speaking mask fulfills its curse."), { drop: "veksas_unspoken_mask", phaseText: "She changes masks, damage affinities, and arena bargains at health thresholds." }),

  // Kilnforged
  spec("kiln_thrall", "Kiln Thrall", "kilnforged", "regular", ["cinderward"], [9, 16], "A foundry laborer riveted inside a cooling suit after the last shift refused to end.", "bruiser", S("slag_hammer", "Slag Hammer", ["strike", "fire"], "Molten slag gathers along the lifted tool head.", "Move to the cool side of the suit and punish the embedded hammer.")),
  spec("chain_stoker", "Chain Stoker", "kilnforged", "regular", ["cinderward"], [8, 13], "Its furnace chain runs through its spine; every pull feeds a fire no longer connected to it.", "skirmisher", S("stoker_whip", "Stoker Whip", ["slash", "fire"], "The spine chain rattles from tail to shoulder.", "Close inside the chain's arc or pin it beneath a heavy strike.")),
  spec("quenchless_smith", "Quenchless Smith", "kilnforged", "specialist", ["cinderward"], [11, 17], "A smith who cannot stop tempering the weapon fused to his arm.", "duelist", S("temper_cycle", "Temper Cycle", ["fire", "buff"], "The arm-blade changes from red to white to quiet blue.", "Attack during red, defend during white, and use fire against the brittle blue phase.")),
  spec("furnace_shield_guard", "Furnace-Shield Guard", "kilnforged", "elite", ["cinderward"], [13, 18], "A royal guard whose shield is a door into the old foundry's shared furnace.", "juggernaut", S("open_furnace", "Open Furnace", ["fire", "area"], "Shield latches release one at a time from top to bottom.", "Circle behind the hinge or freeze the open door before the blast.")),
  spec("slag_foreman", "Slag Foreman", "kilnforged", "miniboss", ["cinderward"], [16, 19], "He still measures every trespasser for a shift beneath the furnace.", "controller", S("mandatory_shift", "Mandatory Shift", ["fire", "trap"], "Molten clock marks appear around the arena floor.", "Stand in the unlit break marker; other positions become slag."), { drop: "foremans_shift_token" }),
  spec("kiln_knight_rusk", "Rusk, the Kiln Knight", "kilnforged", "boss", ["cinderward"], [15, 15], "The foundry's last knight sealed himself inside furnace armor with the royal Cinder Seal.", "duelist", S("overheated_judgment", "Overheated Judgment", ["strike", "fire", "unblockable"], "Every vent opens and Rusk's hammer lifts without effort.", "Freeze two vents, then dodge through the delayed hammer arc to reach the seal."), { drop: "cinder_seal", phaseText: "Rusk alternates furnace-shield counters before entering an overheated phase." }),

  // Glasswood
  spec("shard_tick", "Shard Tick", "glasswood", "regular", ["cinderward"], [8, 12], "A hand-sized parasite that drinks molten sap and wears discarded glass as a shell.", "swarm", S("shell_burst", "Shell Burst", ["slash", "area"], "The shell fills with fast-moving golden bubbles.", "Roll away or crush it with strike damage before pressure peaks.")),
  spec("glasswood_hart", "Glasswood Hart", "glasswood", "regular", ["cinderward"], [10, 16], "Its antlers chime against iron branches, marking paths no human can safely walk.", "skirmisher", S("antler_prism", "Antler Prism", ["radiance", "slash"], "The antlers divide one dim light into three moving lines.", "Stand in the dark gap, then strike the antler base.")),
  spec("razorwing_moth", "Razorwing Moth", "glasswood", "specialist", ["cinderward"], [11, 17], "A soot moth with transparent wings edged in cooling glass.", "artillery", S("wing_cast", "Wing-Cast Shards", ["slash", "projectile"], "The wings meet overhead and ring like a goblet.", "Dodge toward the moth; shards spread wider at distance.")),
  spec("sapmirror_lynx", "Sap-Mirror Lynx", "glasswood", "elite", ["cinderward"], [14, 19], "Its hide reflects the forest a half-second ahead, showing where prey intends to flee.", "hunter", S("future_pounce", "Future Pounce", ["slash", "delayed"], "Your future reflection runs across its mirrored flank.", "Move contrary to the reflection after it commits.")),
  spec("ironroot_auroch", "Ironroot Auroch", "glasswood", "miniboss", ["cinderward"], [18, 20], "Iron roots lace its bones and continue growing whenever it stands still.", "juggernaut", S("rooted_stampede", "Rooted Stampede", ["strike", "earth"], "Roots pull tight behind all four hooves.", "Bait it across furnace grates; heated roots snap and cause a fall."), { drop: "auroch_ironroot_core" }),
  spec("widow_in_the_glass", "Widow in the Glass", "glasswood", "boss", ["cinderward"], [24, 24], "A colossal spider visible only in reflections; the body in front of you is merely the wound it makes in light.", "ambusher", S("reflection_exchange", "Reflection Exchange", ["slash", "hex", "teleport"], "All mirrored surfaces briefly show the spider in a different position.", "Face the reflection missing a shadow; break that surface to force the true body out."), { drop: "widows_reflection_gland", phaseText: "Breaking mirrors narrows her teleport network but releases shardlings." }),

  // Hush order
  spec("hush_monk", "Hush Monk", "hush_order", "regular", ["hollow_abbey"], [14, 20], "A tongueless monk trained to answer violence with its exact rhythm.", "duelist", S("mirrored_combo", "Mirrored Combo", ["physical", "counter"], "Its hands rehearse your last attack sequence in miniature.", "Use a different sequence or delay the final input to punish the mirror.")),
  spec("vow_sweeper", "Vow Sweeper", "hush_order", "regular", ["hollow_abbey"], [14, 19], "The abbey's floors were swept in ritual spirals; this monk still defends each line of dust.", "controller", S("dust_litany", "Dust Litany", ["blind", "area"], "The broom traces a bright spiral through crypt dust.", "Move against the spiral or leap across its narrow inner line.")),
  spec("exact_word_adept", "Exact-Word Adept", "hush_order", "specialist", ["hollow_abbey"], [17, 22], "She kept her tongue but speaks only one binding word in an entire lifetime.", "support", S("reserved_word", "Reserved Word", ["silence", "command"], "Her stitched veil parts and every nearby monk kneels.", "Kneel before the word lands or stagger her during the single inhale.")),
  spec("inkless_lector", "Inkless Lector", "hush_order", "elite", ["hollow_abbey"], [18, 23], "Invisible scripture covers his skin and moves to whichever limb is about to strike.", "duelist", S("living_annotation", "Living Annotation", ["radiance", "physical"], "Raised lettering appears on the attacking limb.", "Read the limb, parry the annotated blow, then strike the blank side.")),
  spec("prior_cord", "Prior Cord", "hush_order", "miniboss", ["hollow_abbey"], [21, 24], "The prior tied every broken vow into the cord wrapped around her body; it now moves like a second skeleton.", "bruiser", S("vow_unbound", "Vow Unbound", ["physical", "hex"], "One knot loosens and whispers the promise it once held.", "Fulfill the spoken condition briefly or sever the lit knot."), { drop: "priors_thirteen_knot_cord" }),
  spec("abbot_of_exact_words", "Abbot of Exact Words", "hush_order", "boss", ["hollow_abbey"], [27, 27], "The abbot reduced his identity to a single flawless sentence and imprisoned it behind his teeth.", "duelist", S("sentence_of_ending", "Sentence of Ending", ["command", "radiance", "curse"], "Words appear one by one around the arena rim.", "Interrupt the grammar by standing on the wrong word, changing the sentence's effect."), { drop: "abbots_final_clause", phaseText: "Arena words alter his command as the sentence nears completion." }),

  // Echo choir
  spec("urn_whisper", "Urn Whisper", "echo_choir", "regular", ["hollow_abbey"], [15, 20], "A single voice circles its burial urn, asking passersby to finish a forgotten melody.", "artillery", S("missing_note", "Missing Note", ["sonic", "curse"], "Four notes sound with an aching gap between the third and fifth.", "Strike the urn during the gap or answer with a bell item.")),
  spec("wall_canticle", "Wall Canticle", "echo_choir", "regular", ["hollow_abbey"], [16, 21], "Mouths pressed into the masonry sing only when no living face looks directly at them.", "ambusher", S("unwatched_hymn", "Unwatched Hymn", ["sonic", "fear"], "Stone lips purse at the edge of the camera view.", "Keep the mouths in view or use a reflective surface to watch them.")),
  spec("resonance_beadle", "Resonance Beadle", "echo_choir", "specialist", ["hollow_abbey"], [18, 23], "A hovering cluster of keys that unlocks different harmonics rather than doors.", "support", S("key_change", "Key Change", ["sonic", "buff"], "One key turns in empty air and nearby voices shift color.", "Break or steal the glowing key to remove the choir's new resistance.")),
  spec("stone_soprano", "Stone Soprano", "echo_choir", "elite", ["hollow_abbey"], [20, 25], "The singer's last high note fossilized around her like a translucent shell.", "artillery", S("fossil_note", "Fossil Note", ["sonic", "pierce"], "Cracks radiate from the shell's throat.", "Hide behind resonant urns; the note shatters them and itself.")),
  spec("choirmaster_without_lungs", "Choirmaster Without Lungs", "echo_choir", "miniboss", ["hollow_abbey"], [23, 26], "A conducting shadow that steals breath from anything following its tempo.", "controller", S("stolen_breath", "Stolen Breath", ["sonic", "stamina_drain"], "Its baton rises while your breath fogs violet.", "Stop acting for one beat to break tempo, then punish the downstroke."), { drop: "lungless_baton" }),
  spec("cantor_oss", "Cantor Oss, Voice Beneath Stone", "echo_choir", "boss", ["hollow_abbey"], [22, 22], "The buried cantor feeds preserved names into the Last Bell until memory becomes hunger.", "controller", S("litany_beneath_stone", "Litany Beneath Stone", ["sonic", "summon", "radiance"], "Resonant urns answer in a visible clockwise sequence.", "Break selected urns to remove voices and open safe gaps in the pattern."), { drop: "last_bell_tongue", phaseText: "Each broken urn permanently subtracts a voice but empowers the remaining choir." }),

  // Ossuary vermin
  spec("finger_mice", "Finger-Mice Colony", "ossuary_vermin", "regular", ["hollow_abbey"], [13, 18], "Knucklebones scurry in groups of five, assembling a hand only when threatened.", "swarm", S("make_a_fist", "Make a Fist", ["strike"], "Five separate trails curl toward one center point.", "Scatter the fingers with area damage before the fist closes.")),
  spec("ribcage_screecher", "Ribcage Screecher", "ossuary_vermin", "regular", ["graven_march", "hollow_abbey"], [12, 18], "A carrion bird nests inside a ribcage and plays the bones like a warning instrument.", "artillery", S("rib_whistle", "Rib Whistle", ["sonic", "fear"], "The bird draws one wing across the ribs.", "Strike the open cage or move behind its narrow sonic cone.")),
  spec("borrowed_spine", "Borrowed Spine", "ossuary_vermin", "specialist", ["hollow_abbey"], [16, 21], "Dozens of jawless skulls share one long spine and argue through tooth clicks.", "skirmisher", S("vertebrae_whip", "Vertebrae Whip", ["strike", "multi_hit"], "The skulls bite the spine in sequence toward its tail.", "Dodge toward the leading skull after the click wave passes it.")),
  spec("reliquary_millipede", "Reliquary Millipede", "ossuary_vermin", "elite", ["hollow_abbey"], [19, 24], "It wears holy finger bones as legs and a gilded reliquary as an armored shell.", "juggernaut", S("saints_march", "Saints' March", ["radiance", "physical"], "Gilded feet lift from front to back like a wave.", "Roll under the lifted middle section and attack the soft underside.")),
  spec("crypt_assembler", "Crypt Assembler", "ossuary_vermin", "miniboss", ["hollow_abbey"], [22, 25], "A clever colony that sorts bones by combat usefulness rather than former owner.", "support", S("better_body", "Build a Better Body", ["summon", "heal"], "Loose bones slide into labeled piles around the colony.", "Kick bones into the wrong piles or destroy the skull pile first."), { drop: "assemblers_joint_key" }),
  spec("the_borrowed_saint", "The Borrowed Saint", "ossuary_vermin", "boss", ["hollow_abbey"], [29, 29], "Every neglected relic in the ossuary has joined into a towering saint no doctrine recognizes.", "juggernaut", S("false_miracle", "False Miracle", ["radiance", "strike", "curse"], "Relic labels glow while the corresponding borrowed limbs kneel.", "Read the labels and break the contradictory relic to collapse the miracle."), { drop: "saint_of_nobodys_relic", phaseText: "Destroying labeled relics removes limbs and changes its false miracles." }),

  // Bell revenants
  spec("ropewalker", "Ropewalker Revenant", "bell_revenants", "regular", ["hearthmere", "dunmire"], [6, 12], "A ringer remembered as callused hands and a length of weather-black rope.", "skirmisher", S("pendulum_pass", "Pendulum Pass", ["strike", "movement"], "The rope goes taut above an unseen ceiling beam.", "Move perpendicular to the swing and cut the rope at its lowest point.")),
  spec("clapper_squire", "Clapper Squire", "bell_revenants", "regular", ["cinderward"], [10, 16], "A young attendant reconstructed around a bell clapper too heavy to carry in life.", "bruiser", S("delayed_toll", "Delayed Toll", ["strike", "sonic"], "The clapper hits silently; a pressure ring remains compressed around it.", "Evade the physical hit, pause, then evade the expanding sound.")),
  spec("verdigris_ringer", "Verdigris Ringer", "bell_revenants", "specialist", ["dunmire", "hollow_abbey"], [14, 20], "Marsh water has grown green armor across this revenant's bell cavity.", "controller", S("green_toll", "Green Toll", ["poison", "sonic"], "Verdigris flakes rise instead of falling.", "Use fire to consume the flakes or interrupt with silence.")),
  spec("memory_carillonneur", "Memory Carillonneur", "bell_revenants", "elite", ["hollow_abbey"], [19, 25], "Six small bells hang inside its open ribs, each containing a different remembered fighting style.", "duelist", S("sixth_style", "Sixth Style", ["physical", "stance"], "One inner bell swings and projects a weapon-shaped shadow.", "Match defense to the shadow, then strike the swinging bell.")),
  spec("dusk_toll_collector", "Dusk-Toll Collector", "bell_revenants", "miniboss", ["hearthmere"], [16, 19], "It comes when a settlement rings late and collects one warm memory for every missed beat.", "hunter", S("collect_memory", "Collect Memory", ["sonic", "drain"], "A treasured scene flickers across the inside of its chest bell.", "Attack the scene with the damage type linked to that memory's state flag."), { drop: "collectors_warm_clapper" }),
  spec("bell_without_tower", "The Bell Without a Tower", "bell_revenants", "boss", ["hearthmere", "hollow_abbey"], [26, 26], "A great bell walks on the remembered arms of every ringer crushed when its tower fell.", "juggernaut", S("falling_tower", "Falling Tower", ["strike", "sonic", "area"], "A tower-shaped shadow rises upward from the bell.", "Stand inside the shadow's doorway, the only space the memory never crushed."), { drop: "towerless_bell_bronze", phaseText: "Cracks widen into climbable openings that expose the remembered ringers." }),

  // Salt-waste frontier
  spec("salt_veil_strider", "Salt-Veil Strider", "salt_waste", "regular", ["salt_waste_frontier"], [24, 30], "A pilgrim crusted to its robes after walking through a storm that scoured away direction.", "bruiser", S("white_horizon", "White Horizon", ["frost", "blind"], "Its robe spreads into a perfectly level line.", "Move close enough that the horizon passes behind you.")),
  spec("mirror_beetle", "Mirror Beetle", "salt_waste", "regular", ["salt_waste_frontier"], [23, 28], "A salt burrower that carries a mirrored shell reflecting somewhere several miles east.", "skirmisher", S("elsewhere_dive", "Elsewhere Dive", ["movement", "strike"], "The shell reflection rushes toward the viewer before the beetle moves.", "Track the reflected terrain to predict its emergence direction.")),
  spec("sealed_mirror_bearer", "Sealed Mirror-Bearer", "salt_waste", "specialist", ["salt_waste_frontier"], [27, 33], "The bearer swore never to see what travels behind the mirror strapped to its face.", "artillery", S("unseal_glimpse", "Unseal a Glimpse", ["radiance", "curse"], "One wax corner seal slowly lifts.", "Re-seal it with a strike or face away before the reflected thing looks out.")),
  spec("brine_oracle", "Brine Oracle", "salt_waste", "elite", ["salt_waste_frontier"], [30, 36], "She reads futures in salt crystals grown from tears willingly donated by travelers.", "controller", S("crystallize_choice", "Crystallize Choice", ["frost", "root"], "Ghosts of your next three possible actions appear in salt.", "Choose no previewed action; wait or use an item not shown.")),
  spec("caravan_of_one", "The Caravan of One", "salt_waste", "miniboss", ["salt_waste_frontier"], [34, 37], "A single bent pilgrim carries the luggage, bones, and shadows of an entire vanished caravan.", "juggernaut", S("unpack_the_lost", "Unpack the Lost", ["summon", "strike"], "Different packs begin knocking from the inside.", "Cut only packs casting no human shadow; the others release hostile memories."), { drop: "one_caravan_manifest" }),
  spec("saint_of_closed_mirrors", "Saint of Closed Mirrors", "salt_waste", "boss", ["salt_waste_frontier"], [40, 40], "At the waste's center, thousands of mirrors face inward around something venerated for never appearing.", "controller", S("inward_revelation", "Inward Revelation", ["radiance", "curse", "area"], "Every mirror opens a hairline gap toward the arena center.", "Rotate three mirrors outward to create an escape path, but never align them."), { drop: "saints_inward_mirror", phaseText: "Player-rotated mirrors determine beam paths and which unseen limb manifests." }),

  // Veil-coast frontier
  spec("coral_knuckle", "Coral Knuckle", "veil_coast", "regular", ["veil_coast_frontier"], [25, 31], "A tide scavenger with coral growing over its hands into blunt red hammers.", "bruiser", S("reef_pound", "Reef Pound", ["strike", "water"], "Coral polyps close from wrist to knuckle.", "Dodge behind the arm and strike the living coral while compressed.")),
  spec("moonless_netling", "Moonless Netling", "veil_coast", "regular", ["veil_coast_frontier"], [24, 29], "A small amphibian that weaves discarded fishing line into nets for shadows.", "swarm", S("shadow_net", "Shadow Net", ["root", "hex"], "Knotted lines appear first across your shadow.", "Step into darkness or burn the knot nearest your feet.")),
  spec("lantern_gilled_raider", "Lantern-Gilled Raider", "veil_coast", "specialist", ["veil_coast_frontier"], [28, 34], "Its glowing gills lure blackwater creatures through puddles far too small to hold them.", "support", S("puddle_call", "Puddle Call", ["summon", "water"], "Gill lights pulse while nearby puddles deepen to black.", "Extinguish the gills with a close strike or ignite the puddles.")),
  spec("undertow_harpooner", "Undertow Harpooner", "veil_coast", "elite", ["veil_coast_frontier"], [31, 37], "A hunter whose line is tied to a current rather than a boat.", "hunter", S("current_harpoon", "Current Harpoon", ["pierce", "pull", "water"], "The harpoon points aside while a current aligns behind the target.", "Dodge toward the line anchor and cut it during retrieval.")),
  spec("reefwife_karra", "Reefwife Karra", "veil_coast", "miniboss", ["veil_coast_frontier"], [35, 38], "Karra wears the living reef where her drowned village continues building new rooms.", "controller", S("village_grows", "The Village Grows", ["earth", "water", "trap"], "Tiny windows light across the coral on her back.", "Destroy lit rooms to stop matching reef walls from rising in the arena."), { drop: "karras_living_keystone" }),
  spec("admiral_of_the_inland_tide", "Admiral of the Inland Tide", "veil_coast", "boss", ["veil_coast_frontier", "dunmire"], [42, 42], "A drowned admiral sails a ship-shaped current through soil, seeking the bell that commanded the sea to retreat.", "juggernaut", S("ship_without_water", "Ship Without Water", ["water", "strike", "area"], "A keel-shaped ripple cuts through stone beneath the arena.", "Climb exposed terrain, then board the current during its turning arc."), { drop: "admirals_landlocked_keel", phaseText: "The moving ship-current reshapes dry ground into temporary decks and undertows." }),
];

const RANK_MULTIPLIERS = { regular: 1, specialist: 1.15, elite: 1.3, miniboss: 1.55, boss: 2.2 };

const behaviorPhasesFor = (enemy) => {
  const phases = [
    {
      id: "assess",
      healthRange: [1, 0.56],
      behavior: `Uses ${enemy.combatRole} spacing, tests reactions, and favors family techniques.`,
      modifiers: { aggression: 1, recovery: 1 },
    },
    {
      id: "pressed",
      healthRange: [0.55, enemy.rank === "boss" || enemy.rank === "miniboss" ? 0.26 : 0],
      behavior: enemy.phaseText ?? "Shortens approach intervals and chains its signature move after a family technique.",
      modifiers: { aggression: 1.2, recovery: 0.9 },
    },
  ];
  if (enemy.rank === "boss" || enemy.rank === "miniboss") {
    phases.push({
      id: "desperate",
      healthRange: [0.25, 0],
      behavior: enemy.phaseText ?? "Reconfigures the arena pattern while preserving every telegraph cue.",
      modifiers: { aggression: 1.4, recovery: 0.82, staggerResistance: 1.2 },
    });
  }
  return phases;
};

const REGION_TO_TERRITORY = Object.freeze({
  hearthmere: "territory.graven-march",
  graven_march: "territory.graven-march",
  dunmire: "territory.dunmire",
  cinderward: "territory.cinderward",
  hollow_abbey: "territory.hollow-abbey",
  salt_waste_frontier: "territory.mirror-salt-waste",
  veil_coast_frontier: "territory.veil-coast",
});
const ATLAS_TERRITORY_IDS = new Set(Object.values(REGION_TO_TERRITORY));
const FAMILY_HABITAT_IDS = Object.freeze({
  ashbound: ["habitat.graven-upland", "habitat.drowned-mire"],
  cairn_beasts: ["habitat.graven-upland"],
  march_deserters: ["habitat.graven-upland", "habitat.quarantine-road"],
  drowned_parish: ["habitat.drowned-mire"],
  reed_coven: ["habitat.drowned-mire"],
  kilnforged: ["habitat.cinder-ridge"],
  glasswood: ["habitat.cinder-ridge"],
  hush_order: ["habitat.karst-crypt"],
  echo_choir: ["habitat.karst-crypt"],
  ossuary_vermin: ["habitat.karst-crypt", "habitat.graven-upland"],
  bell_revenants: ["habitat.graven-upland", "habitat.drowned-mire", "habitat.cinder-ridge", "habitat.karst-crypt"],
  salt_waste: ["habitat.mirror-playa"],
  veil_coast: ["habitat.coastal-intertidal"],
  shuttered_ward: ["habitat.drowned-mire"],
  charnel_measures: ["habitat.graven-upland", "habitat.karst-crypt"],
  black_sluice: ["habitat.drowned-mire", "habitat.coastal-intertidal"],
  last_pest_cart: ["habitat.quarantine-road"],
  breath_tithe: ["habitat.cinder-ridge"],
  white_ague: ["habitat.mirror-playa"],
  pallid_root_communion: ["habitat.graven-upland", "habitat.karst-crypt"],
  anchored_quarantine: ["habitat.coastal-intertidal"],
});
const ATLAS_HABITAT_IDS = new Set(Object.values(FAMILY_HABITAT_IDS).flat());

const ROLE_LOCOMOTION_LANGUAGE = Object.freeze({
  controller: "It advances only while the surrounding escape geometry is changing",
  skirmisher: "It changes lanes after a false retreat and never repeats the same return angle",
  bruiser: "It crosses ground in one committed weight transfer, then must reassemble its balance",
  artillery: "It relocates only while its firing anatomy is occluded or recovering",
  support: "It moves by exchanging places with the nearest allied ritual position",
  juggernaut: "It cannot turn during a committed advance and brakes by striking the terrain",
  ambusher: "It translates only across unobserved seams and becomes rigid under direct witness",
  hunter: "It follows the last disturbed trace rather than the target's present body",
  swarm: "Its bodies move by passing one impulse through the whole colony",
  duelist: "It steps only on the recovery beat of the last action it witnessed",
});
const ROLE_SOUND_LANGUAGE = Object.freeze({
  controller: "three spaced warnings, a held absence, then one enclosing note",
  skirmisher: "two retreating clicks answered by a third sound from the return angle",
  bruiser: "a load-bearing groan, one blunt beat, and a long settling scrape",
  artillery: "a narrowing whistle that stops exactly once before release",
  support: "a call-and-response in which the answering voice comes from an ally",
  juggernaut: "slow impacts whose interval shortens without their volume changing",
  ambusher: "a near sound copied at a far distance, followed by silence at both sources",
  hunter: "one testing sound repeated closer whenever its quarry disturbs the ground",
  swarm: "many dry contacts resolving into a single synchronized beat",
  duelist: "the opponent's last rhythm returned with one deliberately missing beat",
});
const ANATOMY_LINKS = Object.freeze([
  "The impossible structure becomes clearest when",
  "Its body can sustain that arrangement only because",
  "The violation closes into a usable limb when",
  "What should be internal crosses the silhouette whenever",
  "No joint explains the motion; instead",
  "The missing anatomy briefly outlines itself when",
]);

const individualizedMove = (enemy, move, rosterIndex) => {
  if (enemy.v3Seed) return { ...move };
  const bases = {
    controller: [0.92, 0.28, 1.02], skirmisher: [0.54, 0.24, 0.58], bruiser: [0.82, 0.32, 0.92], artillery: [1.04, 0.2, 0.88], support: [0.86, 0.22, 0.96],
    juggernaut: [1.18, 0.4, 1.12], ambusher: [0.64, 0.18, 0.74], hunter: [0.7, 0.26, 0.68], swarm: [0.46, 0.42, 0.52], duelist: [0.6, 0.2, 0.62],
  };
  const [startup, active, recovery] = bases[enemy.combatRole];
  return {
    ...move,
    timing: {
      startup: Number((startup + rosterIndex * 0.003).toFixed(3)),
      active: Number((active + (rosterIndex % 11) * 0.004).toFixed(3)),
      recovery: Number((recovery + rosterIndex * 0.002).toFixed(3)),
    },
  };
};

const v3FieldsFor = (enemy, familyData, uniqueMove, rankMultiplier) => {
  const seed = enemy.v3Seed ?? {};
  const anatomyLink = ANATOMY_LINKS[[...enemy.id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % ANATOMY_LINKS.length];
  const anatomicalViolation = seed.anatomicalViolation ?? `${enemy.lore} ${anatomyLink} ${uniqueMove.telegraph.cue.charAt(0).toLowerCase()}${uniqueMove.telegraph.cue.slice(1)}`;
  const locomotionRule = seed.locomotionRule ?? `${ROLE_LOCOMOTION_LANGUAGE[enemy.combatRole]}; the permission cue is ${uniqueMove.telegraph.cue.charAt(0).toLowerCase()}${uniqueMove.telegraph.cue.slice(1)}`;
  const soundGrammar = seed.soundGrammar ?? `${familyData.material.replaceAll("_", " ")} produces ${ROLE_SOUND_LANGUAGE[enemy.combatRole]}; ${uniqueMove.name} commits on the first ${uniqueMove.damageTags.join("/")} sound after the gap.`;
  const ecologicalPurpose = seed.ecologicalPurpose ?? `${familyData.ecology} This form serves the niche expressed by ${enemy.lore.toLowerCase()}`;
  const narrativeOrigin = seed.narrativeOrigin ?? enemy.lore;
  const habitatDefaults = familyData.habitat ?? {};
  const unique = enemy.rank === "boss" || enemy.rank === "miniboss";
  const scaleMeters = Number((1.65 * rankMultiplier).toFixed(2));
  const designSignature = [anatomicalViolation, locomotionRule, soundGrammar, ecologicalPurpose, uniqueMove.name].join(" | ");
  const territoryIds = [...new Set(enemy.regions.map((regionId) => REGION_TO_TERRITORY[regionId]).filter(Boolean))];
  return {
    schemaVersion: 3,
    taxonomy: {
      domain: "veyl_thanatic_ecology",
      familyId: enemy.familyId,
      formId: enemy.id,
      rank: enemy.rank,
      fictionalAffliction: `${enemy.familyId}_distortion`,
    },
    anatomy: {
      anatomicalViolation,
      bodyPlan: familyData.silhouette.shape,
      posture: familyData.silhouette.posture,
      distinguishingFeature: enemy.distinguishingFeature ?? uniqueMove.name,
    },
    fictionalPathology: {
      id: `${enemy.familyId}_distortion`,
      vector: "occult_ecology",
      manifestation: anatomicalViolation,
      realWorldAnalogue: null,
    },
    locomotion: { rule: locomotionRule, combatCadence: enemy.combatRole, recoveryTell: uniqueMove.counterplay },
    senses: { primary: `${enemy.name} reads ${uniqueMove.damageTags.join(" and ")} changes through ${familyData.material.replaceAll("_", " ")}; anything that does not disturb the ${uniqueMove.name.toLowerCase()} condition is effectively invisible to it.`, tell: uniqueMove.telegraph.cue, blindSpot: uniqueMove.counterplay },
    horrorLanguage: { visual: anatomicalViolation, audio: soundGrammar, ritual: uniqueMove.name },
    lifecycle: {
      origin: narrativeOrigin,
      sustenance: ecologicalPurpose,
      propagation: `The ${familyData.name} ecology propagates this form through ${familyData.material}.`,
      cessation: `Disrupt ${uniqueMove.name} and apply ${familyData.weaknessTags.join(" or ")} to end the sustaining pattern.`,
    },
    behaviorContract: {
      role: enemy.combatRole,
      loop: `Establish ${locomotionRule} Then commit ${uniqueMove.name}; recovery remains punishable through: ${uniqueMove.counterplay}`,
      groupBehavior: unique ? "Commands or reconfigures its family ecology without erasing individual telegraphs." : `Supports ${familyData.name} groups without duplicating another form's signature mechanic.`,
    },
    productionBrief: {
      targetScaleMeters: scaleMeters,
      assetClass: unique ? "hero_creature" : enemy.rank === "elite" ? "elite_creature" : "standard_creature",
      requiredClips: ["idle", "locomotion", "turn", "hit", "death", uniqueMove.id],
      materialLanguage: [...familyData.palette, familyData.material],
      vfxLanguage: [...uniqueMove.damageTags, enemy.familyId],
      audioLanguage: [soundGrammar, `${enemy.id}_voice_set`],
    },
    codexReveals: [
      { tier: "sighting", text: anatomicalViolation },
      { tier: "study", text: ecologicalPurpose },
      { tier: "mastery", text: narrativeOrigin },
    ],
    habitatProfile: {
      territoryIds,
      siteIds: enemy.regions.includes("hearthmere") ? ["site.hearthmere"] : [],
      habitatIds: [...FAMILY_HABITAT_IDS[enemy.familyId]],
      elevationMeters: habitatDefaults.elevation ?? [0, 950],
      slopeNormalized: habitatDefaults.slope ?? [0, 0.8],
      moistureNormalized: habitatDefaults.moisture ?? [0.15, 0.9],
      corruptionNormalized: habitatDefaults.corruption ?? [0.35, 1],
      substrates: habitatDefaults.substrates ?? [enemy.familyId],
      featureDistance: habitatDefaults.featureDistance ?? {},
      activity: unique ? "event_bound" : enemy.combatRole === "ambusher" ? "crepuscular" : "variable",
      population: unique ? { minimum: 1, maximum: 1, clustering: "unique_anchor" } : { minimum: 2, maximum: enemy.rank === "regular" ? 18 : 6, clustering: enemy.combatRole },
      associations: [enemy.familyId, enemy.combatRole],
      exclusions: [`${enemy.id}_excluded_from_settled_safe_cells`],
      uniqueAnchorId: unique ? `anchor_${enemy.id}` : null,
      suitabilitySignature: `${enemy.id}:${territoryIds.join("+")}:${enemy.rank}:${enemy.combatRole}`,
    },
    mechanicContract: {
      handlerId: `creature.${enemy.id}.${uniqueMove.id}`,
      moveId: uniqueMove.id,
      timing: { ...uniqueMove.timing },
      telegraphs: { visual: uniqueMove.telegraph.cue, audio: soundGrammar, seconds: uniqueMove.telegraph.seconds },
      counterplay: uniqueMove.counterplay,
      effects: [...uniqueMove.damageTags],
      interruptions: ["stagger", ...familyData.weaknessTags.map((tag) => `weakness:${tag}`)],
      implementationStatus: "specified",
    },
    maturity: {
      authored: true,
      validated: true,
      habitat_valid: true,
      encounter_placed: false,
      runtime_integrated: false,
      prototype_asset: false,
      production_asset: false,
      playtested: false,
    },
    designSignature,
  };
};

const makeBestiaryEntry = (enemy, rosterIndex) => {
  const familyData = ENEMY_FAMILIES.find(({ id }) => id === enemy.familyId);
  const rankMultiplier = RANK_MULTIPLIERS[enemy.rank] ?? 1;
  const commonMoves = FAMILY_MOVESETS[enemy.familyId].map((familyMove) => ({
    ...familyMove,
    id: `${enemy.id}_${familyMove.id}`,
  }));
  const uniqueMove = individualizedMove(enemy, { ...enemy.signatureMove, id: `${enemy.id}_${enemy.signatureMove.id}` }, rosterIndex);
  return {
    id: enemy.id,
    name: enemy.name,
    familyId: enemy.familyId,
    rank: enemy.rank,
    boss: enemy.rank === "boss",
    regions: enemy.regions,
    levelRange: enemy.levelRange,
    silhouette: {
      ...familyData.silhouette,
      scale: Number(rankMultiplier.toFixed(2)),
      palette: familyData.palette,
      distinguishingFeature: enemy.distinguishingFeature ?? uniqueMove.name,
    },
    lore: enemy.lore,
    combatRole: enemy.combatRole,
    damageTags: [...new Set([...commonMoves.flatMap((attack) => attack.damageTags), ...uniqueMove.damageTags])],
    resistanceTags: enemy.resistanceTags ?? familyData.resistanceTags,
    weaknessTags: enemy.weaknessTags ?? familyData.weaknessTags,
    moves: [...commonMoves, uniqueMove],
    behaviorPhases: behaviorPhasesFor(enemy),
    drops: [
      { itemId: familyData.material, chance: enemy.rank === "boss" ? 1 : 0.62, quantity: [1, enemy.rank === "regular" ? 1 : 2] },
      { itemId: enemy.drop ?? `${enemy.id}_trophy`, chance: enemy.rank === "boss" ? 1 : enemy.rank === "miniboss" ? 0.75 : 0.12, quantity: [1, 1] },
    ],
    ecologyTags: [...new Set([enemy.familyId, ...familyData.regions, enemy.rank === "boss" ? "unique" : "population", ...(enemy.ecologyTags ?? [])])],
    encounterTags: [...new Set([enemy.combatRole, enemy.rank, enemy.rank === "boss" || enemy.rank === "miniboss" ? "set_piece" : "roaming", ...(enemy.encounterTags ?? [])])],
    ...v3FieldsFor(enemy, familyData, uniqueMove, rankMultiplier),
  };
};

export const BESTIARY = deepFreeze([...ENEMY_SPECS, ...EXPANSION_SPECS].map(makeBestiaryEntry));
export const BESTIARY_TARGETS = deepFreeze({
  enemies: 178,
  families: 21,
  ranks: { regular: 68, specialist: 37, elite: 31, miniboss: 21, boss: 21 },
  roles: { controller: 20, skirmisher: 20, bruiser: 18, artillery: 18, support: 18, juggernaut: 17, ambusher: 17, hunter: 17, swarm: 17, duelist: 16 },
});

const KNOWN_RANKS = new Set(Object.keys(RANK_MULTIPLIERS));
const KNOWN_ROLES = new Set(ENCOUNTER_ROLES.map(({ id }) => id));
const REQUIRED_REGIONS = ["hearthmere", "graven_march", "dunmire", "cinderward", "hollow_abbey"];

/** Validate the public bestiary data without mutating it. */
export function validateBestiary(entries = BESTIARY, families = ENEMY_FAMILIES) {
  const errors = [];
  const add = (path, code, message) => errors.push({ path, code, message });
  if (!Array.isArray(entries)) return { valid: false, errors: [{ path: "BESTIARY", code: "invalid_type", message: "Bestiary must be an array." }] };
  if (!Array.isArray(families)) return { valid: false, errors: [{ path: "ENEMY_FAMILIES", code: "invalid_type", message: "Enemy families must be an array." }] };
  if (entries.length !== BESTIARY_TARGETS.enemies) add("BESTIARY", "wrong_roster_size", `Bestiary requires exactly ${BESTIARY_TARGETS.enemies} entries.`);
  if (families.length !== BESTIARY_TARGETS.families) add("ENEMY_FAMILIES", "wrong_family_count", `Bestiary requires exactly ${BESTIARY_TARGETS.families} families.`);

  const familyIds = new Set();
  families.forEach((item, index) => {
    if (!item?.id || familyIds.has(item.id)) add(`ENEMY_FAMILIES.${index}.id`, "duplicate_or_missing", "Family IDs must be present and unique.");
    familyIds.add(item?.id);
  });

  const ids = new Set();
  const designSignatures = new Set();
  const mechanicHandlers = new Set();
  entries.forEach((enemy, index) => {
    const path = `BESTIARY.${index}`;
    if (!enemy?.id || ids.has(enemy.id)) add(`${path}.id`, "duplicate_or_missing", "Enemy IDs must be present and unique.");
    ids.add(enemy?.id);
    if (!enemy?.name || !enemy?.lore) add(path, "missing_identity", "Enemy requires a name and lore.");
    if (!familyIds.has(enemy?.familyId)) add(`${path}.familyId`, "unknown_family", "Enemy references an unknown family.");
    if (!KNOWN_RANKS.has(enemy?.rank)) add(`${path}.rank`, "unknown_rank", "Enemy rank is unknown.");
    if (!KNOWN_ROLES.has(enemy?.combatRole)) add(`${path}.combatRole`, "unknown_role", "Enemy encounter role is unknown.");
    if (!Array.isArray(enemy?.regions) || enemy.regions.length === 0) add(`${path}.regions`, "missing_regions", "Enemy requires at least one region.");
    if (!Array.isArray(enemy?.levelRange) || enemy.levelRange.length !== 2 || enemy.levelRange[0] > enemy.levelRange[1]) add(`${path}.levelRange`, "invalid_range", "Enemy level range must be ascending [min, max].");
    if (!enemy?.silhouette?.shape || !Array.isArray(enemy.silhouette.features)) add(`${path}.silhouette`, "invalid_silhouette", "Enemy requires structured silhouette data.");
    ["damageTags", "resistanceTags", "weaknessTags", "drops", "ecologyTags", "encounterTags"].forEach((field) => {
      if (!Array.isArray(enemy?.[field]) || enemy[field].length === 0) add(`${path}.${field}`, "missing_data", `${field} must be a non-empty array.`);
    });
    if (!Array.isArray(enemy?.moves) || enemy.moves.length < 3) {
      add(`${path}.moves`, "moves_too_few", "Enemy requires at least three moves.");
    } else {
      const moveIds = new Set();
      enemy.moves.forEach((attack, moveIndex) => {
        if (!attack.id || moveIds.has(attack.id)) add(`${path}.moves.${moveIndex}.id`, "duplicate_or_missing", "Move IDs must be unique per enemy.");
        moveIds.add(attack.id);
        if (!attack.telegraph?.cue || !(attack.telegraph.seconds >= 0)) add(`${path}.moves.${moveIndex}.telegraph`, "invalid_telegraph", "Move requires a readable telegraph.");
        if (!["startup", "active", "recovery"].every((key) => attack.timing?.[key] >= 0)) add(`${path}.moves.${moveIndex}.timing`, "invalid_timing", "Move requires non-negative startup, active, and recovery timing.");
        if (!attack.counterplay) add(`${path}.moves.${moveIndex}.counterplay`, "missing_counterplay", "Move requires counterplay guidance.");
      });
    }
    if (!Array.isArray(enemy?.behaviorPhases) || enemy.behaviorPhases.length < 2) add(`${path}.behaviorPhases`, "phases_too_few", "Enemy requires at least two behavior phases.");
    const requiredV3Objects = ["taxonomy", "anatomy", "fictionalPathology", "locomotion", "senses", "horrorLanguage", "lifecycle", "behaviorContract", "productionBrief", "habitatProfile", "mechanicContract", "maturity"];
    if (enemy?.schemaVersion !== 3) add(`${path}.schemaVersion`, "wrong_schema", "Creature must expose schemaVersion 3.");
    requiredV3Objects.forEach((field) => {
      if (!enemy?.[field] || typeof enemy[field] !== "object") add(`${path}.${field}`, "missing_v3_contract", `${field} is required by CreatureDefinitionV3.`);
    });
    if (!Array.isArray(enemy?.codexReveals) || enemy.codexReveals.length !== 3) add(`${path}.codexReveals`, "missing_codex_reveals", "Creature requires three progressive codex reveals.");
    if (!enemy?.designSignature || designSignatures.has(enemy.designSignature)) add(`${path}.designSignature`, "duplicate_or_missing_signature", "Design signatures must be present and unique.");
    designSignatures.add(enemy?.designSignature);
    const handlerId = enemy?.mechanicContract?.handlerId;
    if (!handlerId || mechanicHandlers.has(handlerId)) add(`${path}.mechanicContract.handlerId`, "duplicate_or_missing_handler", "Bespoke mechanic handlers must be present and unique.");
    mechanicHandlers.add(handlerId);
    if (!enemy?.habitatProfile?.suitabilitySignature || !Array.isArray(enemy?.habitatProfile?.territoryIds) || enemy.habitatProfile.territoryIds.length === 0 || enemy.habitatProfile.territoryIds.some((territoryId) => !ATLAS_TERRITORY_IDS.has(territoryId)) || !Array.isArray(enemy?.habitatProfile?.habitatIds) || enemy.habitatProfile.habitatIds.length === 0 || enemy.habitatProfile.habitatIds.some((habitatId) => !ATLAS_HABITAT_IDS.has(habitatId))) add(`${path}.habitatProfile`, "invalid_habitat", "Creature requires a GIS-addressable habitat profile using canonical atlas territory and habitat IDs.");
    if ((enemy.rank === "boss" || enemy.rank === "miniboss") && !enemy?.habitatProfile?.uniqueAnchorId) add(`${path}.habitatProfile.uniqueAnchorId`, "missing_unique_anchor", "Unique creatures require one anchor ID.");
    if (enemy?.maturity?.production_asset || enemy?.maturity?.playtested) add(`${path}.maturity`, "overstated_maturity", "Canon data may not claim production assets or playtesting in this slice.");
    const searchable = JSON.stringify(enemy).toLowerCase();
    if (searchable.includes("subhuman")) add(path, "prohibited_taxonomy", "The prohibited taxonomy term appears in creature data.");
    ["tuberculosis", "leprosy", "cholera", "smallpox", "influenza"].forEach((term) => {
      if (searchable.includes(term)) add(path, "real_disease_reference", `Creature data references real disease term ${term}.`);
    });
  });

  for (const [rank, target] of Object.entries(BESTIARY_TARGETS.ranks)) {
    const actual = entries.filter((enemy) => enemy.rank === rank).length;
    if (actual !== target) add("BESTIARY", "wrong_rank_distribution", `${rank} requires ${target}, received ${actual}.`);
  }
  for (const [role, target] of Object.entries(BESTIARY_TARGETS.roles)) {
    const actual = entries.filter((enemy) => enemy.combatRole === role).length;
    if (actual !== target) add("BESTIARY", "wrong_role_distribution", `${role} requires ${target}, received ${actual}.`);
  }
  const sixFormFamilies = new Set(["shuttered_ward", "charnel_measures", "black_sluice", "last_pest_cart", "breath_tithe", "white_ague", "pallid_root_communion", "anchored_quarantine"]);
  for (const familyData of families) {
    const familyEntries = entries.filter((enemy) => enemy.familyId === familyData.id);
    const expected = sixFormFamilies.has(familyData.id) ? 6 : 10;
    if (familyEntries.length !== expected) add(`ENEMY_FAMILIES.${familyData.id}`, "wrong_family_size", `${familyData.id} requires ${expected} forms, received ${familyEntries.length}.`);
    if (sixFormFamilies.has(familyData.id)) {
      const expectedRanks = { regular: 2, specialist: 1, elite: 1, miniboss: 1, boss: 1 };
      for (const [rank, target] of Object.entries(expectedRanks)) if (familyEntries.filter((enemy) => enemy.rank === rank).length !== target) add(`ENEMY_FAMILIES.${familyData.id}`, "wrong_six_form_shape", `${familyData.id} requires ${target} ${rank} forms.`);
    }
  }

  REQUIRED_REGIONS.forEach((region) => {
    if (!entries.some((enemy) => enemy.regions.includes(region))) add("BESTIARY", "region_uncovered", `No enemy covers required region ${region}.`);
  });
  const bossCount = entries.filter(({ rank }) => rank === "boss").length;
  return { valid: errors.length === 0, errors, stats: { enemies: entries.length, families: families.length, bosses: bossCount } };
}
