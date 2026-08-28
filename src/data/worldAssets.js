/**
 * Production-facing environment kit manifest. These are stable asset IDs rather
 * than implementation-specific filenames, so 2D, 3D, audio, and VFX teams can
 * build against the same regional vocabulary.
 */

const kit = (id, name, reference, palette, lighting, surfaces, structures, props, foliage, decals, vfx, audio) => ({
  id, name, reference, palette, lighting, surfaces, structures, props, foliage, decals, vfx, audio,
});

const GENERATED_ASSET_METADATA = Object.freeze({
  revision: 1,
  dimensions: Object.freeze({ width: 1672, height: 941 }),
  provenance: "Generated for this project with OpenAI's built-in image-generation model on 2026-08-22.",
  rightsNote: "Project-local generated reference; usage remains subject to the applicable OpenAI service terms.",
  approvalStatus: "approved_direction",
});

export const WORLD_CONCEPT_ASSETS = Object.freeze([
  {
    id: "concept_hearthmere_hold",
    regionId: "hearthmere",
    path: "./assets/world/hearthmere-hold.png",
    ...GENERATED_ASSET_METADATA,
    sha256: "7f17a219ef090f7d3c20e22ab24275a9c39483c4d3c89a8297ef4ef006258b3c",
    type: "environment_keyframe",
    use: ["hub_layout", "material_reference", "lighting_reference", "architecture_language"],
    promptSummary: "Fortified warm-spring refuge in cold rain; traversable wet-slate hub with palisade, bell tower, shrine plaza, and layered routes.",
  },
  {
    id: "concept_dunmire_causeway",
    regionId: "dunmire",
    path: "./assets/world/dunmire-causeway.png",
    ...GENERATED_ASSET_METADATA,
    sha256: "f5f7d5c22da1cb175bfc9da6777ba05c9092f60d6c813b92c4c46b6633f99702",
    type: "environment_keyframe",
    use: ["route_composition", "water_material", "ambush_readability", "gathering_ecology"],
    promptSummary: "Broken causeway over a drowned parish; blackwater, submerged roofs, guide lanterns, reeds, bridge landmark, and combat pockets.",
  },
  {
    id: "concept_cinderward_foundry",
    regionId: "cinderward",
    path: "./assets/world/cinderward-foundry.png",
    ...GENERATED_ASSET_METADATA,
    sha256: "37de3ab742e5368998d6a215ebaa4b96fccfe1d15aeb73e02e5a8b4936c077fa",
    type: "environment_keyframe",
    use: ["industrial_kit", "boss_arena", "vertical_traversal", "shortcut_language"],
    promptSummary: "Breathing royal bell-metal foundry with furnace arena, chain lifts, gantries, slag canals, mining route, and shortcut loops.",
  },
  {
    id: "concept_hollow_abbey_nave",
    regionId: "hollow_abbey",
    path: "./assets/world/hollow-abbey-nave.png",
    ...GENERATED_ASSET_METADATA,
    sha256: "d79488872142049443b55ef98532470d632dba9bd9ae5e90ba02bd8403e7bc3b",
    type: "environment_keyframe",
    use: ["interior_kit", "combat_lanes", "resonant_urn_mechanic", "eclipse_lighting"],
    promptSummary: "Rain-open mute nave with delayed echoes, burial urns, side aisles, upper traversal, eclipse shafts, and the route to the Last Bell crypt.",
  },
]);

export const WORLD_SOURCE_ASSETS = Object.freeze([
  {
    id: "source_cinderward_foundry_annotated_draft",
    path: "./assets/world/cinderward-foundry-draft.png",
    type: "rejected_generation_draft",
    dimensions: GENERATED_ASSET_METADATA.dimensions,
    provenance: GENERATED_ASSET_METADATA.provenance,
    rightsNote: GENERATED_ASSET_METADATA.rightsNote,
    approvalStatus: "rejected_text_overlay",
    replacedBy: "concept_cinderward_foundry",
    sha256: "b3a0c42f2f71f9cbc238d9801224412bd4e41b06220d5ba08c7acd9f55a194df",
  },
]);

export const REGION_ASSET_KITS = Object.freeze([
  kit(
    "hearthmere", "Hearthmere Hold", "concept_hearthmere_hold",
    { shadow: "#0b1113", stone: "#424b4c", timber: "#332a24", cloth: "#683f37", accent: "#c18b46", fog: "#829492" },
    { key: "cold_overcast", fill: "warm_spring_bounce", practicals: "banked_braziers", contrast: 0.62, wetness: 0.82 },
    ["slate_cobbles_wet", "slate_steps_chipped", "spring_limestone", "peat_mud_tracks", "oak_planks_dark", "clay_tile_tablets"],
    ["hold_house_small", "hold_house_corner", "bell_tower_timber", "palisade_repaired", "spring_channel_arch", "vigil_shrine_old", "gatehouse_patchwork"],
    ["ember_ledger_desk", "clay_name_rack", "banked_brazier", "rope_bell_small", "rain_barrel_iron", "market_awning_patch", "traveler_bench", "herb_drying_frame", "guard_weapon_rest", "spring_cup_stone"],
    ["blackpine_sapling", "steam_moss", "ridge_heather", "cold_reed_clump", "wall_lichen_gray"],
    ["boot_mud_cluster", "braizer_soot_fan", "chalk_ward_broken", "rain_streak_wall", "old_blood_wash", "mended_stone_seam"],
    ["spring_steam_low", "brazier_ember_fall", "roof_rain_sheet", "bell_dust_pulse", "lantern_moth_sparse"],
    ["hearthmere_rain_roof", "spring_water_close", "braziers_low", "timber_creak_safe", "bell_false_double", "hub_murmur_sparse"],
  ),
  kit(
    "graven_march", "The Graven March", null,
    { shadow: "#090d0d", stone: "#3a4140", timber: "#242927", cloth: "#4a4038", accent: "#a78d5e", fog: "#77847f" },
    { key: "ash_filtered_moon", fill: "ground_fog", practicals: "cairn_candles", contrast: 0.7, wetness: 0.48 },
    ["ash_road_packed", "flint_shingle", "cairn_stone_warm", "pine_needles_black", "old_road_blocks", "grave_loam"],
    ["pilgrim_arch_fallen", "cairn_ring", "watch_post_empty", "road_shrine_split", "march_bridge_rope", "burial_wall_low"],
    ["map_marker_blank", "pilgrim_pack_rotted", "sealed_order_case", "cairn_bowl", "road_chain_post", "broken_cart_narrow", "wind_chime_bone", "banner_pole_bare", "grave_tithe_box", "trail_snare_old"],
    ["blackpine_mature", "needle_brush", "grave_fern", "wind_grass_ash", "thorn_brake"],
    ["cairn_handprint", "old_march_arrow", "hoofprints_wrongway", "ash_body_outline", "map_ink_spill", "warm_stone_crack"],
    ["ash_drift_surface", "ground_fog_ribbon", "cairn_heat_shimmer", "pine_spore_fall", "distant_banner_ghost"],
    ["pine_trunks_wind", "cairn_sub_bass", "ash_steps_delayed", "hound_stone_click", "orders_whisper", "no_bird_silence"],
  ),
  kit(
    "dunmire", "Dunmire Causeway", "concept_dunmire_causeway",
    { shadow: "#071114", water: "#0d2930", stone: "#414846", reed: "#746b4d", accent: "#c69a53", fog: "#5b7676" },
    { key: "moonless_cyan", fill: "blackwater_bounce", practicals: "guide_lanterns", contrast: 0.73, wetness: 1 },
    ["causeway_blocks_sunk", "chapel_slate_submerged", "mire_silt", "salt_shelf_pale", "algae_stone", "reed_mat_floating"],
    ["drowned_roof_peak", "vestry_wall_submerged", "reedward_bridge", "lantern_post_crooked", "flooded_crypt_door", "parish_belfry_broken", "water_stair_lost"],
    ["bell_rope_drowned", "parish_pew_floating", "salt_harvest_pan", "reed_sister_marker", "guide_lantern_hook", "fishing_creel_black", "grave_moss_basket", "chapel_key_chain", "mire_boat_flat", "childhood_knock_stone"],
    ["witch_reed_tall", "grave_moss_bed", "blackwater_lily", "mire_bird_nest", "saltgrass_white"],
    ["waterline_scum", "drag_marks_road", "salt_handprint", "submerged_mosaic", "lantern_oil_rainbow", "knock_tally_stone"],
    ["blackwater_ripple_wrongwind", "marsh_light_drifter", "mire_bubble_body", "reed_whisper_wave", "salt_glint_sparse", "submerged_door_shadow"],
    ["reeds_close_whisper", "water_lap_hollow", "distant_bell_underwater", "guide_lantern_chain", "mirebound_knock", "witch_hex_breath"],
  ),
  kit(
    "cinderward", "Cinderward", "concept_cinderward_foundry",
    { shadow: "#080a0d", iron: "#20262a", brick: "#4a3028", slag: "#1c1615", accent: "#df6e32", cool: "#344d62" },
    { key: "ash_blue_night", fill: "furnace_bounce", practicals: "slag_and_vents", contrast: 0.88, wetness: 0.18 },
    ["firebrick_cracked", "iron_plate_riveted", "slag_glass_cooled", "foundry_stone_soot", "gantry_grate", "cistern_tile"],
    ["grand_furnace_breathing", "widow_forge_annex", "chain_lift_tower", "cooling_cistern_broken", "ore_crusher_manual", "slag_gate_arch", "boss_ring_rusk", "gantry_shortcut"],
    ["anvil_vow_chain", "ore_cart_tipped", "furnace_shield_rack", "bell_mold_giant", "smith_quench_trough", "chain_counterweight", "vent_wheel_seized", "kiln_scale_heap", "glasswood_crate", "royal_seal_press"],
    ["glasswood_black", "ember_lichen", "slag_thorn", "soot_mushroom"],
    ["heat_bleach_wall", "hammer_arc_gouge", "royal_foundry_stamp", "slag_splash_frozen", "soot_body_shadow", "coolant_runoff"],
    ["furnace_breath_cycle", "ember_iron_spark", "heat_haze_heavy", "slag_drip_glow", "soot_fall_dense", "vent_pressure_tell"],
    ["furnace_inhale", "chain_lift_groan", "slag_pop", "kiln_plate_tick", "hammer_far", "coolant_hiss", "glasswood_chime"],
  ),
  kit(
    "hollow_abbey", "Hollow Abbey", "concept_hollow_abbey_nave",
    { shadow: "#07090f", stone: "#777876", bronze: "#3e655f", linen: "#77746d", accent: "#b59b61", eclipse: "#d5d9d2" },
    { key: "eclipse_shafts", fill: "wet_floor_bounce", practicals: "resonant_urns", contrast: 0.9, wetness: 0.77 },
    ["nave_flagstone_wet", "bone_limestone_eroded", "crypt_stair_black", "bronze_inlay_resonant", "choir_tile_cracked", "burial_dust"],
    ["tongueless_saint_niche", "nave_arch_broken", "upper_cloister_walk", "crypt_stair_sealed", "choir_screen_mute", "side_chapel_urn", "gate_exact_words", "last_bell_vault"],
    ["resonant_urn_small", "resonant_urn_boss", "vow_thread_loom", "tongue_reliquary_empty", "choir_stall_rotted", "rain_catch_basin", "monk_prayer_board", "clapper_chain_great", "memory_tablet_stack", "cantor_music_stand"],
    ["crypt_mold_white", "rain_lichen_gold", "grave_vine_blind", "urn_moss_velvet"],
    ["removed_tongue_chisel", "choir_step_wear", "delayed_rain_ring", "vow_script_scraped", "urn_resonance_crack", "kneeling_dust_print"],
    ["delayed_rain_echo", "urn_resonance_wave", "eclipse_dust_column", "choir_spectral_voice", "memory_glyph_drift", "silence_pressure_distort"],
    ["rain_now_layer", "rain_echo_layer", "urn_hum_pitchset", "choir_missing_voice", "stone_step_late", "cantor_subharmonic", "absolute_silence_hit"],
  ),
]);

export const WORLD_ASSET_BUDGETS = Object.freeze({
  textureTexelsPerMeter: { hero: 1024, standard: 512, background: 256 },
  propTriangles: { hero: 48000, standard: 12000, minor: 2800 },
  modularGridMeters: 0.5,
  collision: { complexPerRegion: 24, simplePerChunk: 160 },
  dynamicLightsVisible: 18,
  activeParticles: 2400,
  simultaneousAmbientVoices: 14,
});

export const getRegionAssetKit = (regionId) => REGION_ASSET_KITS.find(({ id }) => id === regionId) || null;

export function validateWorldAssets() {
  const errors = [];
  const ids = new Set();
  for (const region of REGION_ASSET_KITS) {
    if (ids.has(region.id)) errors.push(`Duplicate region kit: ${region.id}`);
    ids.add(region.id);
    for (const field of ["surfaces", "structures", "props", "foliage", "decals", "vfx", "audio"]) {
      if (!Array.isArray(region[field]) || region[field].length < 4) errors.push(`${region.id}.${field} is underspecified`);
      if (new Set(region[field]).size !== region[field].length) errors.push(`${region.id}.${field} has duplicates`);
    }
  }
  for (const concept of WORLD_CONCEPT_ASSETS) {
    if (!ids.has(concept.regionId)) errors.push(`Concept ${concept.id} has unknown region ${concept.regionId}`);
    if (!concept.path || !concept.sha256 || !concept.provenance || !concept.rightsNote) errors.push(`Concept ${concept.id} lacks production provenance`);
    if (concept.dimensions?.width !== 1672 || concept.dimensions?.height !== 941) errors.push(`Concept ${concept.id} has unexpected dimensions`);
  }
  const conceptIds = new Set(WORLD_CONCEPT_ASSETS.map(({ id }) => id));
  for (const source of WORLD_SOURCE_ASSETS) if (!conceptIds.has(source.replacedBy)) errors.push(`Source ${source.id} has unresolved replacement ${source.replacedBy}`);
  return { valid: errors.length === 0, errors };
}
