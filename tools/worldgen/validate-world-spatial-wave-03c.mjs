#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  DEFAULT_REPOSITORY_ROOT,
  FALSE_CLAIM_KEYS_V2,
  SITE_BLOCKOUT_V2_SCHEMA_PATH,
  canonicalRecordSha256,
  fileEvidence,
  readJson,
  sha256,
  validateSiteBlockoutReferenceV2,
} from "./validate-site-blockout-reference-v2.mjs";

export const WAVE_03C_INDEX_PATH = "assets/world/spatial/wave-03c/index.json";
export const WAVE_03C_SITE_PATH = "assets/world/spatial/wave-03c/hearthmere.site.json";
export const WAVE_03C_PROVENANCE_PATH = "assets/world/spatial/wave-03c/provenance.json";
export const WAVE_03C_REVIEW_A_PATH = "assets/world/spatial/wave-03c/review-a.manifest.json";
export const WAVE_03C_REVIEW_B_PATH = "assets/world/spatial/wave-03c/review-b.manifest.json";
export const WAVE_03C_VALIDATOR_PATH = "tools/worldgen/validate-world-spatial-wave-03c.mjs";
export const WAVE_03C_TEST_PATH = "tests/world-spatial-wave-03c.mjs";

const ATLAS_PATH = "packages/content/manifests/sable-reach.atlas-runtime.json";
const SCENE_PATH = "packages/content/manifests/hearthmere.scene.json";
const WORLD_SPATIAL_PATH = "packages/content/src/world-spatial.data.js";
const CHARACTERS_PATH = "src/data/characters.js";
const BESTIARY_PATH = "packages/content/src/bestiary.data.js";
const NARRATIVE_PATH = "packages/content/src/narrative.data.js";
const WAVE_04_NARRATIVE_PATH = "packages/content/manifests/quest-wave-04-v11.narrative.json";
const WAVE_04_WORLD_PATH = "packages/content/manifests/quest-wave-04-v11.world.json";

export const WAVE_03C_REVIEWED_MATURITY = "independently_reviewed_noncanonical_reference";
export const WAVE_03C_INDEX_TITLE = "World Spatial Wave 03C Hearthmere machine packet";
export const WAVE_03C_DIRECTION_TEXT = "Bind Hearthmere to canonical atlas, character, bestiary, quest, authored world-spatial, immutable scene, accepted Wave 04, and accepted art-direction records; author exactly 32 site-local spaces, 37 nodes, and 41 stored bidirectional links with explicit state, hydrology, habitat, actor, encounter, route, overlay, and quest boundaries, while claiming no canonical, surveyed, atlas-export, runtime, model, construction, production, integration, or release authority.";
export const WAVE_03C_REVIEW_A_VERIFIED = Object.freeze([
  "exact_32_space_37_node_41_link_topology_and_axis_adapter",
  "canonical_and_authored_source_precedence_with_selected_record_hashes",
  "six_safe_cells_and_clean_contaminated_hydrology_separation",
  "accepted_external_graph_hash_counts_and_distinct_egress_interfaces",
  "actor_encounter_route_overlay_and_quest_projection",
  "generic_v2_schema_reuse_and_73_frozen_adversarial_rejections",
  "strict_release_evidence_privacy_and_nonclaim_boundaries",
  "index_site_validator_and_test_frozen_hash_binding",
]);
export const WAVE_03C_REVIEW_B_VERIFIED = Object.freeze([
  "twenty_six_actor_roster_and_three_scene_backed_spawn_limits",
  "eleven_habitats_and_four_encounters_exclude_all_six_safe_cells",
  "clean_and_contaminated_hydrology_and_regional_stream_nonconnection",
  "ten_quest_crosswalks_thirty_five_ordered_objectives_and_state_writes",
  "twenty_one_routes_ten_overlays_and_two_hash_only_external_graphs",
  "founding_and_expansion_creature_affinity_without_model_claims",
  "strict_release_evidence_privacy_and_nonclaim_boundaries",
  "index_site_validator_and_test_frozen_hash_binding",
]);
export const WAVE_03C_REVIEW_LIMITATIONS = Object.freeze([
  "noncanonical_site_local_reference_only",
  "no_exact_or_surveyed_atlas_placement_claim",
  "no_runtime_navigation_collision_or_streaming_claim",
  "no_construction_engineering_or_production_geometry_claim",
  "no_static_or_animated_model_claim",
  "no_integration_or_release_authority_claim",
  "review_roles_are_workflow_separation_not_legal_identity_proof",
  "bound_records_do_not_expand_upstream_canonical_authority",
]);
const SCHEMA_CANONICAL_RECORD_SHA256 = "b1d0d2187d90bf812734e4aff6bbe1dfeeab227d89dc50cece6798995cbb3a2f";

export const WAVE_03C_EXPECTED_STATS = Object.freeze({
  zones: 4,
  spaces: 32,
  nodes: 37,
  traversableNodes: 35,
  overlayProxyNodes: 2,
  links: 41,
  derivedDirectedArcs: 82,
  safeCells: 6,
  stateMachines: 11,
  activityPhases: 5,
  hydrologySystems: 6,
  habitats: 11,
  actorSlots: 26,
  encounterSlots: 4,
  routePrograms: 21,
  overlayBindings: 10,
  questBindings: 10,
  questObjectives: 35,
  sourceBindings: 28,
  canonicalClaims: 0,
  runtimeClaims: 0,
  constructionClaims: 0,
  modelClaims: 0,
});

const TOP_LEVEL_HASHES = Object.freeze({
  identity: "7d4450a93ee1a08e4222728ac1104903a0ddd06b3717dd9f27492da7e1ec1f10",
  authority: "943b2200626de37df1a7c704984a13c6925c51821dca425c958ffe8974f7ce84",
  claims: "d45423563599db19680af0ecd35759c6d6a696429d1eb10e795c6d2057b78e43",
  sourceBindings: "2825229eeb0df2f5259c02205669a1f2aadba0851d56b7e04e90c71b7532728c",
});

const SECTION_HASHES = Object.freeze({
  spatialReference: "b5440cd897d61dc482f58208e3580c94cbb896b104cf5e892e45d7ffc668f011",
  zones: "3e53b752da0bed08b07eee99ff3b5c7fcaecf5516e82b3d5ded6c00f332722ac",
  spaces: "4317e968af5b1810270bb375030c664fa7a7ed6db1b7e77db989e59f77368fdc",
  nodes: "11f78f196f79983d63e64c68ef78ae89618ab10bdc6984ae21a7c38a66303e22",
  links: "b0ad34c2b0134f6576e91c3fa924eb8c1ecbfef10b5410ad1bb90adea905d65b",
  safeCells: "b9d14c717b51fda4e58b736f844521f85052d9ee82d36266fb38fb24723fd2b9",
  stateMachines: "a42bf1bc3f51490865e82c3c37817e7cbc1c3e6f9353852d3dd2e53bc0a6c465",
  activityPhases: "255ca41af6804734dd76473d4d1e7369211932352eb8a90513f32d62862ddf8d",
  hydrologySystems: "4a24f369b328476fdafaa0966567e7416ce57a6020b8b1c372a95c5eb2d3acbe",
  habitats: "3a6da3c5469cc341d9fe26c1a30731e0d72a973c24c55f91cfba78f219e6b57d",
  actorSlots: "ac909f46cea0394f4b640ad448e9ec1a6061c7cc5ce69af32608bcf1d9579ee3",
  encounterSlots: "4e441347aa91559e9c0acf9b8df3e400c71c9e783e4f0f21909f73f0a405cf1e",
  routePrograms: "662fa9ada76d56610da04e817769b02dd07d5de27325c1c85ea230d02ce2af49",
  overlayBindings: "f41453f7217fd5d09aeb9b07e753da041432b0ba0e5fe7911a93f5c614f6c12a",
  questCrosswalk: "dd311d7a4de88459a1cf7974017609acf4aac0c2b6886ee28b19d00f468c244d",
  artDirection: "58606ec8d73e2c54036038faffaa30fedebb003cda716d18450152815b316714",
  consumerHandoff: "b09945fbb0cb5fd1ae42bee8c063a4bc430b4be705a9c19b5ba86a1c066f7215",
});

const SOURCE_BINDING_CONTRACT = Object.freeze([
  ["source.atlas.crs", ATLAS_PATH, "coordinateReferenceSystem[id=veyl_local_grid_v1]", "selected_record", "canon", "a39f552ff941848c50ecb0d758c661121df252fb987d164885d05859ebc3a606"],
  ["source.atlas.graven-march", ATLAS_PATH, "territories[id=territory.graven-march]", "selected_record", "canon", "f523b68d8aa111b885b8b7c45ca26bc4a4178dd3ec7faabc50c14127ce305f4e"],
  ["source.atlas.hearthmere", ATLAS_PATH, "sites[id=site.hearthmere]", "selected_record", "canon", "06cb77f1b4563f803460fffeed7a294f83b4bea328fe286b8607608fba0a314b"],
  ["source.atlas.hearthmere-transform", ATLAS_PATH, "hearthmereTransform[siteId=site.hearthmere]", "selected_record", "canon", "7025d0921c5386292b2b33379483fc5183648385295d482aa2a34aaae9cd51bc"],
  ["source.atlas.hearthmere-routes", ATLAS_PATH, "routes[id in route.bellwater-road,route.reedward-causeway,route.iron-spine-road]", "selected_record_set", "canon", "336ed59e6f27c3c992b231ba0052578fe8883c17d078bac6b66880ef42816319"],
  ["source.atlas.hearthmere-habitats", ATLAS_PATH, "habitats[id in habitat.graven-upland,habitat.quarantine-road]", "selected_record_set", "canon", "34c2ba43aad17376eef477067d7bd91871c4df23bdeed1cd7483e5f0fe663cfe"],
  ["source.scene.hearthmere", SCENE_PATH, "$file", "whole_file", "authored_design_constraint", "44b724a389efbf2203ede8f870583620e6977b0375e6807632486e277fd99ead"],
  ["source.spatial.graven-march", WORLD_SPATIAL_PATH, "REGION_SPATIAL_PROFILES[id=territory.graven-march]", "selected_record", "authored_design_constraint", "aec88483fb4b0f63eea3a4fc91798c1c676cb143c589112cb9a3850a6d1dfa87"],
  ["source.spatial.hearthmere-envelope", WORLD_SPATIAL_PATH, "SITE_SPATIAL_ENVELOPES[id=site.hearthmere]", "selected_record", "authored_design_constraint", "ae611f21319dec61e415d69ac5e53f07edd9765205d45734b0b0872cd204b188"],
  ["source.spatial.hearthmere-activity", WORLD_SPATIAL_PATH, "SITE_ACTIVITY_CYCLES[siteId=site.hearthmere]", "selected_record", "authored_design_constraint", "5d0e38f49eece299a22e0f45ea768353abfbcb1f713f590b059975c2c82b6ab4"],
  ["source.spatial.hearthmere-typologies", WORLD_SPATIAL_PATH, "BUILDING_TYPOLOGIES[id in hearthmere_slate_tenant_house,hearthmere_unlit_hospice,hearthmere_bell_civic]", "selected_record_set", "authored_design_constraint", "40f4e19c0e17ec845725c9cf9ac7b5d5ec53e3344b98bfbee3e5e54b486be203"],
  ["source.spatial.streaming-lod", WORLD_SPATIAL_PATH, "WORLD_STREAMING_AND_LOD", "selected_record", "authored_design_constraint", "0d08374781f9707ba62baf4ba405687c97981f796608c47310a5679d1a9a06f3"],
  ["source.spatial.hearthmere-expansion-habitats", WORLD_SPATIAL_PATH, "EXPANSION_CREATURE_HABITAT_ENVELOPES[creatureId in deed_eater_wren,shadow_census_moth,lumen_tithe_burr,tenancy_aureole,sixth_shutter_forecast,contrition_oculus]", "selected_record_set", "authored_design_constraint", "65b9c15b29c503cfff86bdc5f3f1ac132aea52fc950352d025d6590f7f4e5ce7"],
  ["source.art.hearthmere-accepted", WORLD_SPATIAL_PATH, "ENVIRONMENT_ART_DIRECTION.acceptedVisualReferences[id=concept_hearthmere_hold]", "selected_record", "accepted_art_direction", "49263736754c0173f9e0695dfb02d925535ae2fe653d7fe66a73adcceeff5474"],
  ["source.characters.hearthmere-founding-ten", CHARACTERS_PATH, "CHARACTERS[id in maela_voss,avren_doss,bera_claymother,fenn_joryn,dessa_mirel,kett_sable,torren_vale,alda_rime,iva_pell,ilse_crow]", "selected_record_set", "canon", "b1f81b272700ada68ca05b9827650204f5d0f1d688c1e75a130fe3e673cdd535"],
  ["source.bestiary.hearthmere-families", BESTIARY_PATH, "BESTIARY[familyId in ashbound,march_deserters,bell_revenants,shuttered_ward,last_pest_cart]", "selected_record_set", "canon", "5c12204e96b471446cc50086207c9d0f95b1e3a3942a5753d0fc452ab52f71fa"],
  ["source.wave04.hearthmere-environments", WAVE_04_WORLD_PATH, "environmentPrograms[locationId in hearthmere_counterfactual_cistern,hearthmere_six_wing_aftercare]", "selected_record_set", "accepted_quest_contract", "595e98ef579e89de3d976bd1048b6d52e7bc96c2329a28e29407deec9dd43f36"],
  ["source.wave04.hearthmere-habitats", WAVE_04_WORLD_PATH, "creatureHabitatEnvelopes[id in habitat.sixth_shutter_forecast.captive_lamp_cistern,overlay.contrition_oculus.hearthmere_aftercare_pressure]", "selected_record_set", "accepted_quest_contract", "e7eed7c53389ae3d087009284b59326ad454320039cd1a15d5f21a7e98936ba5"],
  ["source.quest.main-noon", NARRATIVE_PATH, "EXPANSION_QUESTS[id=main_noon_came_bleeding]", "selected_record", "canon", "92a9de650bea99f375500d2d70a4823dc79293e55266491acd1c57b54657debb"],
  ["source.quest.disease-grief", NARRATIVE_PATH, "EXPANSION_QUESTS[id=side_the_disease_called_grief]", "selected_record", "canon", "8fd0befe31f8ac8ddae3a3568f1de780d512216a22fd7e6992f71683ba63912e"],
  ["source.quest.seven-lamps", NARRATIVE_PATH, "EXPANSION_QUESTS[id=side_seven_lamps_for_six_streets]", "selected_record", "canon", "c11930d2cb15513546d2908d40ef8620cb14ae32e4b6535dad7d436d9bde0b22"],
  ["source.quest.hospice-heart", NARRATIVE_PATH, "EXPANSION_QUESTS[id=side_the_hospice_grows_a_heart]", "selected_record", "canon", "79db99f24faf414fbc2acaef8d0f367f68b688bca7c4d0430b9fa55eae6fb902"],
  ["source.quest.house-tenants", NARRATIVE_PATH, "EXPANSION_QUESTS[id=aftermath_house_outlived_tenants]", "selected_record", "canon", "96af1fdac7bb2c20a9200c0176be6dc7fcb1725351cdae46033cd2220a09ccab"],
  ["source.quest.census-absences", NARRATIVE_PATH, "EXPANSION_QUESTS[id=aftermath_census_of_absences]", "selected_record", "canon", "73a800a41b277dc964a504ece5c6edcb90337c81fc632f9eda61d10bf5b56732"],
  ["source.quest.purity-dusk", NARRATIVE_PATH, "EXPANSION_QUESTS[id=aftermath_purity_blooms_at_dusk]", "selected_record", "canon", "6aa1506e9b4f66425cce2f76862c9e753fdf978f41d359a80ebb2c3fe3cd6cec"],
  ["source.quest.orchard-shadow", NARRATIVE_PATH, "EXPANSION_QUESTS[id=reaction_orchard_casts_legal_shadow]", "selected_record", "canon", "efb7b0cc72ffe267648f9fa4418e28259cbdc3b9a0ff2be1be22f4054e54e044"],
  ["source.quest.lantern-last", WAVE_04_NARRATIVE_PATH, "quests[id=faction_the_lantern_named_us_last]", "selected_record", "accepted_quest_contract", "3fc86dfd31735812236332cef730a83837516484589d0e60f31fe4a0d0d7a6bc"],
  ["source.quest.living-aftercare", WAVE_04_NARRATIVE_PATH, "quests[id=faction_living_appeal_aftercare]", "selected_record", "accepted_quest_contract", "8af6181cca5a327726bb08226b9835b3c21a0e58ca19b02f994adc2a71764b64"],
]);

const SPACE_CODES = Object.freeze([
  "S00", "S10", "S20", "S01", "S11", "S21", "S02", "S12", "S22",
  "T01", "T02", "T03", "T04", "T05", "T06",
  "H01", "H02", "H03", "H04", "H05", "H06", "H07", "H08", "H09",
  "C01", "C02", "C03", "C04", "C05", "C06", "C07", "C08",
]);

const SAFE_CELL_IDS = Object.freeze([
  "safe-cell.hearthmere.tenant-street",
  "safe-cell.hearthmere.tenant-yard",
  "safe-cell.hearthmere.hospice-receiving",
  "safe-cell.hearthmere.hospice-appeal",
  "safe-cell.hearthmere.civic-steps",
  "safe-cell.hearthmere.civic-lane",
]);

const PHASE_IDS = Object.freeze(["pre_dawn", "dawn", "late_day", "dusk", "deep_night"]);

const ACTOR_IDS = Object.freeze([
  "maela_voss", "torren_vale", "ysra_pell", "avren_doss", "bera_claymother", "fenn_joryn",
  "dessa_mirel", "kett_sable", "alda_rime", "iva_pell", "ilse_crow",
  "enoch_last_lamplighter", "nima_sorn_keeper_of_one_shadow", "canoness_vael_kindly_knife",
  "davren_holt_widower_of_unrecorded_wife", "roa_nullstreet_seventh_tenant",
  "sister_calve_unlit_hospice", "bek_tallow_patient_zero_of_policy", "mara_quoin_counter_deed",
  "kessa_pale_absence_clerk", "roen_fitch_dusk_gardener", "tesse_amble_shadow_midwife",
  "latch_vey_counterfactual_lamplighter", "minn_ash_public_route_witness",
  "leto_fain_custodian_unclaimed_symptoms", "senn_avir_residue_orderly",
]);

const QUEST_IDS = Object.freeze([
  "main_noon_came_bleeding",
  "side_the_disease_called_grief",
  "side_seven_lamps_for_six_streets",
  "side_the_hospice_grows_a_heart",
  "aftermath_house_outlived_tenants",
  "aftermath_census_of_absences",
  "aftermath_purity_blooms_at_dusk",
  "reaction_orchard_casts_legal_shadow",
  "faction_the_lantern_named_us_last",
  "faction_living_appeal_aftercare",
]);

const ROUTE_IDS = Object.freeze([
  "route-program.hearthmere.prototype-grid",
  "route-program.hearthmere.approach-bellwater",
  "route-program.hearthmere.approach-reedward",
  "route-program.hearthmere.approach-iron-spine",
  "route-program.hearthmere.tenant-public",
  "route-program.hearthmere.tenant-service",
  "route-program.hearthmere.hospice-patient",
  "route-program.hearthmere.hospice-staff",
  "route-program.hearthmere.hospice-appeal",
  "route-program.hearthmere.civic-public",
  "route-program.hearthmere.civic-service",
  "route-program.hearthmere.quest-main-noon",
  "route-program.hearthmere.quest-disease-grief",
  "route-program.hearthmere.quest-seven-lamps",
  "route-program.hearthmere.quest-hospice-heart",
  "route-program.hearthmere.quest-house-tenants",
  "route-program.hearthmere.quest-census-absences",
  "route-program.hearthmere.quest-purity-dusk",
  "route-program.hearthmere.quest-orchard-shadow",
  "route-program.hearthmere.overlay-counterfactual-cistern",
  "route-program.hearthmere.overlay-six-wing-aftercare",
]);

const FAMILY_CONTRACT = Object.freeze({
  ashbound: ["ash_husk", "ledger_crawler", "cinder_mourner", "pyre_bailiff", "the_unentered", "ash_tenant", "wicket_eater", "smoke_notary", "redaction_warden"],
  march_deserters: ["bannerless_scout", "receipt_soldier", "trench_waif", "command_leech", "armistice_giant"],
  bell_revenants: ["ropewalker", "dusk_toll_collector", "bell_without_tower", "rope_larva", "cracked_acolyte", "echo_sutler", "vesper_engine"],
  shuttered_ward: ["sheet_orderly", "wax_nurse", "curtain_listener", "night_physician", "matron_empty_beds", "house_that_cares"],
  last_pest_cart: ["wheel_porter", "wax_driver", "route_surgeon", "last_outrider", "empty_caravan", "destination_erased"],
});

const EXTERNAL_OVERLAY_CONTRACT = Object.freeze({
  "overlay.hearthmere.counterfactual-cistern": {
    locationId: "hearthmere_counterfactual_cistern",
    proxy: "node.hearthmere.overlay.counterfactual-cistern",
    graphId: "environment_graph.v6.hearthmere_counterfactual_cistern",
    graphHash: "f78be3a79b220d6cf0a9b97a08e246c7d596437c2b782393e885eb819cce3ee9",
    counts: { nodes: 14, directedEdges: 54, safeCells: 1, utilityEndpoints: 5, egressPaths: 2, objectiveEndpoints: 4, habitats: 1 },
  },
  "overlay.hearthmere.six-wing-aftercare": {
    locationId: "hearthmere_six_wing_aftercare",
    proxy: "node.hearthmere.overlay.six-wing-aftercare",
    graphId: "environment_graph.v6.hearthmere_six_wing_aftercare",
    graphHash: "b1207d4e04fcfd2c4b4c6e0141a865746051d249cbfe50b06ba4d9d8c7759ab0",
    counts: { nodes: 18, directedEdges: 47, safeCells: 1, utilityEndpoints: 5, egressPaths: 2, objectiveEndpoints: 5, habitats: 1 },
  },
});

const sameArray = (left, right) => Array.isArray(left) && left.length === right.length && left.every((value, index) => value === right[index]);
const sameObject = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const sameSet = (left, right) => left.size === right.size && [...left].every((value) => right.has(value));
const ids = (records, field = "id") => new Set((records ?? []).map((record) => record[field]));
const byId = (records, id, field = "id") => records.find((record) => record[field] === id);
const exactKeys = (value, expected) => value && typeof value === "object" && !Array.isArray(value)
  && sameSet(new Set(Object.keys(value)), new Set(expected));

function stringValues(value, output = []) {
  if (typeof value === "string") output.push(value);
  else if (Array.isArray(value)) value.forEach((child) => stringValues(child, output));
  else if (value && typeof value === "object") Object.values(value).forEach((child) => stringValues(child, output));
  return output;
}

function privateString(value) {
  return /https?:\/\//i.test(value)
    || /drive\.google\.com|usp=drive|signed[_ -]?url|session[_ -]?id|call[_ -]?id/i.test(value)
    || /\b(?:execution|job|request|trace|run)[_ -]?id\s*[:=]?\s*[a-z0-9_-]{6,}\b/i.test(value)
    || /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i.test(value)
    || /\b[A-Za-z]:[\\/]/.test(value)
    || /(?:^|[\s"'(])\\\\[^\\/\s]+[\\/][^\\/\s]+/.test(value)
    || /(?:^|\s)\/mnt\/[a-z]\/(?:Users|home)\//i.test(value)
    || /(?:^|[\s"'(])\/(?:Users|home|root|tmp|var|workspace|workspaces)\//.test(value)
    || /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value);
}

function privateProviderString(value) {
  return /\b(?:openai|anthropic|midjourney|stability\s*ai|dall[- ]?e|chatgpt|claude)\b/i.test(value);
}

function unexpectedSchemaMaxItems(value, currentPath = "$") {
  if (!value || typeof value !== "object") return [];
  const failures = [];
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${currentPath}.${key}`;
    if (key === "maxItems" && !(currentPath === "$.$defs.vector3" && child === 3)) failures.push(childPath);
    failures.push(...unexpectedSchemaMaxItems(child, childPath));
  }
  return failures;
}

async function importRepositoryModule(repositoryRoot, repositoryRelativePath) {
  return import(pathToFileURL(path.join(repositoryRoot, repositoryRelativePath)).href);
}

function sourceContractProjection(binding) {
  return [binding.id, binding.path, binding.selector, binding.bindingKind, binding.authority, binding.recordSha256];
}

function externalGraphCounts(program) {
  return {
    nodes: program.directedEnvironmentGraph.nodes.length,
    directedEdges: program.directedEnvironmentGraph.edges.length,
    safeCells: program.safeObservationCells.length,
    utilityEndpoints: program.utilityGraph.endpoints.length,
    egressPaths: program.independentEgress.paths.length,
    objectiveEndpoints: program.objectivePhaseEndpoints.length,
    habitats: program.habitatAnchors.length,
  };
}

export async function validateWorldSpatialWave03c({
  repositoryRoot = DEFAULT_REPOSITORY_ROOT,
  schemaOverride = null,
  indexOverride = null,
  siteOverride = null,
  provenanceOverride = null,
  reviewAOverride = null,
  reviewBOverride = null,
} = {}) {
  const errors = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };

  let schema;
  let index;
  let site;
  let provenance;
  let reviewA;
  let reviewB;
  let atlas;
  let scene;
  let worldSpatial;
  let characters;
  let bestiary;
  let narrative;
  let wave04Narrative;
  let wave04World;
  try {
    const loaded = await Promise.all([
      readJson(repositoryRoot, SITE_BLOCKOUT_V2_SCHEMA_PATH),
      readJson(repositoryRoot, WAVE_03C_INDEX_PATH),
      readJson(repositoryRoot, WAVE_03C_SITE_PATH),
      readJson(repositoryRoot, WAVE_03C_PROVENANCE_PATH),
      readJson(repositoryRoot, WAVE_03C_REVIEW_A_PATH),
      readJson(repositoryRoot, WAVE_03C_REVIEW_B_PATH),
      readJson(repositoryRoot, ATLAS_PATH),
      readJson(repositoryRoot, SCENE_PATH),
      importRepositoryModule(repositoryRoot, WORLD_SPATIAL_PATH),
      importRepositoryModule(repositoryRoot, CHARACTERS_PATH),
      importRepositoryModule(repositoryRoot, BESTIARY_PATH),
      importRepositoryModule(repositoryRoot, NARRATIVE_PATH),
      readJson(repositoryRoot, WAVE_04_NARRATIVE_PATH),
      readJson(repositoryRoot, WAVE_04_WORLD_PATH),
    ]);
    [schema, index, site, provenance, reviewA, reviewB, atlas, scene, worldSpatial, characters, bestiary, narrative, wave04Narrative, wave04World] = loaded;
    schema = schemaOverride ?? schema;
    index = indexOverride ?? index;
    site = siteOverride ?? site;
    provenance = provenanceOverride ?? provenance;
    reviewA = reviewAOverride ?? reviewA;
    reviewB = reviewBOverride ?? reviewB;
  } catch (error) {
    return { valid: false, errors: [`Unable to load Wave 03C inputs: ${error.message}`], stats: null };
  }

  const generic = await validateSiteBlockoutReferenceV2({ repositoryRoot, schema, site });
  errors.push(...generic.errors);
  if (generic.stats === null) {
    return {
      valid: false,
      errors,
      stats: null,
      evidence: { sourceArtifacts: generic.evidence?.sourceArtifacts ?? {} },
      reviewStatus: "not_independently_reviewed",
    };
  }

  const validIndexShape = exactKeys(index, ["schemaVersion", "id", "title", "status", "claims", "schemaPath", "provenancePath", "validatorPath", "testPath", "sites"])
    && exactKeys(index.claims, FALSE_CLAIM_KEYS_V2)
    && Array.isArray(index.sites)
    && index.sites.every((record) => exactKeys(record, ["id", "siteId", "path", "sha256", "canonicalRecordSha256", "bytes", "counts"]));
  const validProvenanceShape = exactKeys(provenance, ["schemaVersion", "id", "publication", "tool", "rights", "maturity", "direction", "reviewEvidence", "records"])
    && exactKeys(provenance.direction, ["text", "sha256"])
    && exactKeys(provenance.publication, ["privacy", "externalProviderIdentifiers", "workstationPaths", "usernames", "emails", "signedUrls"])
    && exactKeys(provenance.tool, ["name", "mode"])
    && exactKeys(provenance.reviewEvidence, ["reviewMode", "schemaSha256", "indexSha256", "siteSha256", "siteCanonicalRecordSha256", "validatorSha256", "testSha256", "reviewAManifestPath", "reviewAManifestSha256", "reviewBManifestPath", "reviewBManifestSha256"])
    && Array.isArray(provenance.records)
    && provenance.records.every((record) => exactKeys(record, ["path", "sha256", "bytes", "role", "rights", "maturity"]));
  const validReviewShape = (review) => exactKeys(review, ["schema", "id", "subject", "review"])
    && exactKeys(review.subject, ["schemaPath", "schemaSha256", "indexPath", "indexSha256", "sitePath", "siteSha256", "validatorPath", "validatorSha256", "testPath", "testSha256"])
    && exactKeys(review.review, ["role", "mode", "independent", "mutationDuringReview", "disposition", "verified", "rejectedFixtureCount", "limitations"])
    && Array.isArray(review.review.verified) && Array.isArray(review.review.limitations);
  if (!validIndexShape || !validProvenanceShape || !validReviewShape(reviewA) || !validReviewShape(reviewB)) {
    if (!validIndexShape) errors.push("Wave 03C index has an invalid structural shape");
    if (!validProvenanceShape) errors.push("Wave 03C provenance has an invalid structural shape");
    if (!validReviewShape(reviewA)) errors.push("Wave 03C review A manifest has an invalid structural shape");
    if (!validReviewShape(reviewB)) errors.push("Wave 03C review B manifest has an invalid structural shape");
    return {
      valid: false,
      errors,
      stats: generic.stats,
      evidence: { sourceArtifacts: generic.evidence?.sourceArtifacts ?? {} },
      reviewStatus: "not_independently_reviewed",
    };
  }

  check(sameObject(generic.stats, WAVE_03C_EXPECTED_STATS), `Wave 03C count contract drifted: ${JSON.stringify(generic.stats)}`);
  check(schema.$id === SITE_BLOCKOUT_V2_SCHEMA_PATH && schema.additionalProperties === false, "V2 schema identity or strict top-level contract drifted");
  for (const key of ["sourceBindings", "zones", "spaces", "nodes", "links", "activityPhases", "routePrograms"]) {
    check(schema.properties?.[key]?.minItems === 1 && schema.properties[key].maxItems === undefined, `V2 schema ${key} must remain reusable and variable-count`);
  }
  const specializedPaths = unexpectedSchemaMaxItems(schema);
  check(specializedPaths.length === 0, `Generic V2 schema contains packet-specific maxItems at ${specializedPaths.join(", ")}`);
  check(canonicalRecordSha256(schema) === SCHEMA_CANONICAL_RECORD_SHA256, "Generic V2 schema semantic and nested cardinality contract drifted");

  check(index.schemaVersion === 2 && site.schemaVersion === 2 && provenance.schemaVersion === 2, "Wave 03C schema versions must equal two");
  check(index.id === "world-spatial-wave-03c" && site.id === "site-blockout.wave-03c.hearthmere" && site.siteId === "site.hearthmere", "Wave 03C identity drifted");
  check(index.title === WAVE_03C_INDEX_TITLE, "Wave 03C index title drifted");
  check(index.status === WAVE_03C_REVIEWED_MATURITY && provenance.maturity === WAVE_03C_REVIEWED_MATURITY, "Wave 03C review maturity drifted");
  check(index.schemaPath === SITE_BLOCKOUT_V2_SCHEMA_PATH
    && index.provenancePath === WAVE_03C_PROVENANCE_PATH
    && index.validatorPath === WAVE_03C_VALIDATOR_PATH
    && index.testPath === WAVE_03C_TEST_PATH, "Wave 03C index path binding drifted");
  for (const [scope, claims] of [["index", index.claims], ["site", site.claims]]) {
    check(claims && FALSE_CLAIM_KEYS_V2.every((key) => claims[key] === false), `${scope} contains an authority or readiness overclaim`);
  }
  check(index.sites?.length === 1
    && index.sites[0]?.id === site.id
    && index.sites[0]?.siteId === site.siteId
    && index.sites[0]?.path === WAVE_03C_SITE_PATH, "Index must contain exactly the Hearthmere packet record");
  check(sameObject(index.sites?.[0]?.counts, WAVE_03C_EXPECTED_STATS), "Index counts differ from the exact packet contract");

  const [schemaEvidence, indexEvidence, siteEvidence, validatorEvidence, testEvidence, reviewAEvidence, reviewBEvidence] = await Promise.all([
    fileEvidence(repositoryRoot, SITE_BLOCKOUT_V2_SCHEMA_PATH),
    fileEvidence(repositoryRoot, WAVE_03C_INDEX_PATH),
    fileEvidence(repositoryRoot, WAVE_03C_SITE_PATH),
    fileEvidence(repositoryRoot, WAVE_03C_VALIDATOR_PATH),
    fileEvidence(repositoryRoot, WAVE_03C_TEST_PATH),
    fileEvidence(repositoryRoot, WAVE_03C_REVIEW_A_PATH),
    fileEvidence(repositoryRoot, WAVE_03C_REVIEW_B_PATH),
  ]);
  check(index.sites?.[0]?.sha256 === siteEvidence.sha256 && index.sites?.[0]?.bytes === siteEvidence.bytes, "Index site payload evidence drifted");
  check(index.sites?.[0]?.canonicalRecordSha256 === canonicalRecordSha256(site), "Index site canonical-record evidence drifted");

  const frozenReviewSubject = {
    schemaPath: SITE_BLOCKOUT_V2_SCHEMA_PATH,
    schemaSha256: schemaEvidence.sha256,
    indexPath: WAVE_03C_INDEX_PATH,
    indexSha256: indexEvidence.sha256,
    sitePath: WAVE_03C_SITE_PATH,
    siteSha256: siteEvidence.sha256,
    validatorPath: WAVE_03C_VALIDATOR_PATH,
    validatorSha256: validatorEvidence.sha256,
    testPath: WAVE_03C_TEST_PATH,
    testSha256: testEvidence.sha256,
  };
  check(reviewA.schema === "SableReachSpatialReviewManifestV1" && reviewA.id === "review.world-spatial-wave-03c.a", "Wave 03C review A identity drifted");
  check(reviewB.schema === "SableReachSpatialReviewManifestV1" && reviewB.id === "review.world-spatial-wave-03c.b", "Wave 03C review B identity drifted");
  check(sameObject(reviewA.subject, frozenReviewSubject) && sameObject(reviewB.subject, frozenReviewSubject), "Wave 03C reviews do not bind the frozen schema/index/site/tooling artifacts");
  check(reviewA.review?.role === "independent_canon_and_spatial_semantics_reviewer"
    && reviewB.review?.role === "independent_living_world_and_quest_environment_reviewer", "Wave 03C independent review roles drifted");
  for (const [label, manifest] of [["A", reviewA], ["B", reviewB]]) {
    check(manifest.review.mode === "independent_read_only_frozen_artifact_review"
      && manifest.review.independent === true
      && manifest.review.mutationDuringReview === false
      && manifest.review.disposition === "accept_noncanonical_reference", `Wave 03C review ${label} disposition or independence drifted`);
    const expectedVerified = label === "A" ? WAVE_03C_REVIEW_A_VERIFIED : WAVE_03C_REVIEW_B_VERIFIED;
    check(sameArray(manifest.review.verified, expectedVerified)
      && sameArray(manifest.review.limitations, WAVE_03C_REVIEW_LIMITATIONS), `Wave 03C review ${label} scope or limitation evidence drifted`);
    check(manifest.review.rejectedFixtureCount === 73, `Wave 03C review ${label} frozen adversarial-fixture evidence drifted`);
  }

  const identity = { schemaVersion: site.schemaVersion, id: site.id, siteId: site.siteId, title: site.title };
  check(canonicalRecordSha256(identity) === TOP_LEVEL_HASHES.identity, "Wave 03C identity contract drifted");
  check(canonicalRecordSha256(site.authority) === TOP_LEVEL_HASHES.authority, "Wave 03C authority map drifted");
  check(canonicalRecordSha256(site.claims) === TOP_LEVEL_HASHES.claims, "Wave 03C zero-claim contract drifted");
  check(canonicalRecordSha256(site.sourceBindings) === TOP_LEVEL_HASHES.sourceBindings, "Wave 03C source selector and record-hash contract drifted");
  check(FALSE_CLAIM_KEYS_V2.every((key) => site.claims?.[key] === false), "Wave 03C contains an unsupported authority, runtime, construction, model, or release claim");

  for (const [section, expectedHash] of Object.entries(SECTION_HASHES)) {
    check(canonicalRecordSha256(site[section]) === expectedHash, `Wave 03C ${section} contract drifted`);
  }

  check(
    sameObject(site.sourceBindings.map(sourceContractProjection), SOURCE_BINDING_CONTRACT),
    "Wave 03C exact source paths, selectors, authorities, or selected-record hashes drifted",
  );

  const atlasRoutes = ["route.bellwater-road", "route.reedward-causeway", "route.iron-spine-road"];
  const atlasHabitats = ["habitat.graven-upland", "habitat.quarantine-road"];
  const typologyIds = ["hearthmere_slate_tenant_house", "hearthmere_unlit_hospice", "hearthmere_bell_civic"];
  const foundingIds = ["maela_voss", "avren_doss", "bera_claymother", "fenn_joryn", "dessa_mirel", "kett_sable", "torren_vale", "alda_rime", "iva_pell", "ilse_crow"];
  const familyIds = Object.keys(FAMILY_CONTRACT);
  const expansionCreatureIds = ["deed_eater_wren", "shadow_census_moth", "lumen_tithe_burr", "tenancy_aureole", "sixth_shutter_forecast", "contrition_oculus"];
  const worldLocationIds = Object.values(EXTERNAL_OVERLAY_CONTRACT).map(({ locationId }) => locationId);
  const worldHabitatIds = ["habitat.sixth_shutter_forecast.captive_lamp_cistern", "overlay.contrition_oculus.hearthmere_aftercare_pressure"];

  const questById = new Map([
    ...narrative.EXPANSION_QUESTS.map((record) => [record.id, record]),
    ...wave04Narrative.quests.map((record) => [record.id, record]),
  ]);

  const selectedRecords = new Map([
    ["source.atlas.crs", atlas.coordinateReferenceSystem],
    ["source.atlas.graven-march", byId(atlas.territories, "territory.graven-march")],
    ["source.atlas.hearthmere", byId(atlas.sites, "site.hearthmere")],
    ["source.atlas.hearthmere-transform", atlas.hearthmereTransform],
    ["source.atlas.hearthmere-routes", atlas.routes.filter(({ id }) => atlasRoutes.includes(id))],
    ["source.atlas.hearthmere-habitats", atlas.habitats.filter(({ id }) => atlasHabitats.includes(id))],
    ["source.spatial.graven-march", byId(worldSpatial.REGION_SPATIAL_PROFILES, "territory.graven-march")],
    ["source.spatial.hearthmere-envelope", byId(worldSpatial.SITE_SPATIAL_ENVELOPES, "site.hearthmere")],
    ["source.spatial.hearthmere-activity", byId(worldSpatial.SITE_ACTIVITY_CYCLES, "site.hearthmere", "siteId")],
    ["source.spatial.hearthmere-typologies", worldSpatial.BUILDING_TYPOLOGIES.filter(({ id }) => typologyIds.includes(id))],
    ["source.spatial.streaming-lod", worldSpatial.WORLD_STREAMING_AND_LOD],
    ["source.spatial.hearthmere-expansion-habitats", worldSpatial.EXPANSION_CREATURE_HABITAT_ENVELOPES.filter(({ creatureId }) => expansionCreatureIds.includes(creatureId))],
    ["source.art.hearthmere-accepted", byId(worldSpatial.ENVIRONMENT_ART_DIRECTION.acceptedVisualReferences, "concept_hearthmere_hold")],
    ["source.characters.hearthmere-founding-ten", characters.CHARACTERS.filter(({ id }) => foundingIds.includes(id))],
    ["source.bestiary.hearthmere-families", bestiary.BESTIARY.filter(({ familyId }) => familyIds.includes(familyId))],
    ["source.wave04.hearthmere-environments", wave04World.environmentPrograms.filter(({ locationId }) => worldLocationIds.includes(locationId))],
    ["source.wave04.hearthmere-habitats", wave04World.creatureHabitatEnvelopes.filter(({ id }) => worldHabitatIds.includes(id))],
  ]);
  for (const [sourceId, questId] of [
    ["source.quest.main-noon", "main_noon_came_bleeding"],
    ["source.quest.disease-grief", "side_the_disease_called_grief"],
    ["source.quest.seven-lamps", "side_seven_lamps_for_six_streets"],
    ["source.quest.hospice-heart", "side_the_hospice_grows_a_heart"],
    ["source.quest.house-tenants", "aftermath_house_outlived_tenants"],
    ["source.quest.census-absences", "aftermath_census_of_absences"],
    ["source.quest.purity-dusk", "aftermath_purity_blooms_at_dusk"],
    ["source.quest.orchard-shadow", "reaction_orchard_casts_legal_shadow"],
    ["source.quest.lantern-last", "faction_the_lantern_named_us_last"],
    ["source.quest.living-aftercare", "faction_living_appeal_aftercare"],
  ]) selectedRecords.set(sourceId, questById.get(questId));

  for (const binding of site.sourceBindings) {
    if (binding.bindingKind === "whole_file") continue;
    const selected = selectedRecords.get(binding.id);
    check(selected !== undefined, `${binding.id} exact selector did not resolve`);
    if (selected !== undefined) {
      check(canonicalRecordSha256(selected) === binding.recordSha256, `${binding.id} selected-record hash drifted`);
    }
  }

  const atlasSite = byId(atlas.sites, "site.hearthmere");
  const atlasTerritory = byId(atlas.territories, "territory.graven-march");
  const siteEnvelope = byId(worldSpatial.SITE_SPATIAL_ENVELOPES, "site.hearthmere");
  check(atlas.coordinateReferenceSystem.id === "veyl_local_grid_v1" && atlas.coordinateReferenceSystem.authorityCode === null, "Fictional atlas CRS identity or no-EPSG status drifted");
  check(sameArray(atlasSite.coordinate, [6400, 8320, 184]), "Canonical Hearthmere atlas anchor drifted");
  check(sameArray(site.spatialReference.atlasSiteAnchor, atlasSite.coordinate), "Packet atlas anchor differs from canonical Hearthmere");
  check(sameArray(atlas.hearthmereTransform.atlasOrigin, atlasSite.coordinate) && atlas.hearthmereTransform.preservesExistingLocalCoordinates === true, "Immutable Hearthmere atlas-to-scene transform drifted");
  check(siteEnvelope.designEnvelope.coreRadiusMeters === 192 && siteEnvelope.designEnvelope.influenceRadiusMeters === 640, "Authored Hearthmere core or influence envelope drifted");
  check(sameArray(siteEnvelope.designEnvelope.verticalRangeMeters.map((value) => value - atlasSite.coordinate[2]), [-16, 48]), "Packet vertical envelope does not derive from authored atlas elevation range");
  check(
    sameObject(site.spatialReference.localBoundsMeters, { minimum: [-192, -192, -16], maximum: [192, 192, 48] }),
    "Packet core-radius bounding box or vertical envelope drifted",
  );
  check(
    atlasTerritory.polygon.every(([east, north]) => Number.isFinite(east) && Number.isFinite(north))
      && atlasSite.coordinate[0] >= 3072 && atlasSite.coordinate[0] <= 10240
      && atlasSite.coordinate[1] >= 5632 && atlasSite.coordinate[1] <= 12288,
    "Hearthmere anchor no longer lies in the canonical Graven March envelope",
  );
  check(
    site.spatialReference.axes.x.includes("scene +X")
      && site.spatialReference.axes.y.includes("scene +Z")
      && site.spatialReference.axes.z === "local up"
      && site.spatialReference.precisionNotice.includes("packet [x,y,z] = scene [X,Z,Y]"),
    "East/south/up packet-to-scene axis adapter drifted",
  );

  check(scene.id === "hearthmere.shard.96m.v1" && scene.schemaVersion === 1, "Immutable 96 m Hearthmere scene identity drifted");
  check(scene.coordinateSystem.handedness === "right" && scene.coordinateSystem.up === "+Y" && scene.coordinateSystem.east === "+X" && scene.coordinateSystem.south === "+Z", "Immutable scene axis contract drifted");
  check(sameArray(scene.bounds.min, [0, -8, 0]) && sameArray(scene.bounds.max, [96, 32, 96]) && sameArray(scene.bounds.playableSize, [96, 96]), "Immutable 96 m scene bounds drifted");
  check(scene.chunks.length === 9, "Immutable scene must remain a 3 by 3 set of 32 m chunks");
  for (const chunk of scene.chunks) {
    const suffix = chunk.id.replace("hm.chunk.", "");
    const packetSpace = byId(site.spaces, `space.hearthmere.surface.${suffix}`);
    const adaptedMinimum = [chunk.bounds.min[0], chunk.bounds.min[2], chunk.bounds.min[1]];
    const adaptedMaximum = [chunk.bounds.max[0], chunk.bounds.max[2], chunk.bounds.max[1]];
    check(
      packetSpace && sameArray(packetSpace.boundsLocalMeters.minimum, adaptedMinimum) && sameArray(packetSpace.boundsLocalMeters.maximum, adaptedMaximum),
      `${chunk.id} immutable bounds are not preserved through the east/south/up adapter`,
    );
  }
  check(sameArray(site.spaces.map(({ code }) => code), SPACE_CODES), "Exact Hearthmere space-code partition drifted");

  const surfacePairs = site.links.slice(0, 12).map(({ fromNodeId, toNodeId }) => [fromNodeId, toNodeId].sort().join("/"));
  const expectedSurfacePairs = [
    ["00", "10"], ["00", "01"], ["10", "20"], ["10", "11"], ["20", "21"], ["01", "11"],
    ["01", "02"], ["11", "21"], ["11", "12"], ["21", "22"], ["02", "12"], ["12", "22"],
  ].map(([left, right]) => [`node.hearthmere.surface.${left}`, `node.hearthmere.surface.${right}`].sort().join("/"));
  check(sameArray(surfacePairs, expectedSurfacePairs), "Immutable shard surface topology drifted");
  check(site.links.every(({ bidirectional }) => bidirectional === true), "Wave 03C base links must remain 41 bidirectional links and 82 derived arcs");
  check(site.links.filter(({ id }) => id.startsWith("link.hearthmere.tie.")).length === 6, "Six building-to-surface proposal ties must remain explicit");
  check(site.links.filter(({ id }) => id.startsWith("link.hearthmere.route.")).length === 3, "Three regional route-port proposal links must remain explicit");

  const typologies = new Map(worldSpatial.BUILDING_TYPOLOGIES.filter(({ id }) => typologyIds.includes(id)).map((record) => [record.id, record]));
  check(typologies.get("hearthmere_slate_tenant_house").roomGraph.edges.length === 5, "Tenant-house five-threshold source contract drifted");
  check(typologies.get("hearthmere_unlit_hospice").roomGraph.edges.length === 8, "Hospice eight-threshold source contract drifted");
  check(typologies.get("hearthmere_bell_civic").roomGraph.edges.length === 7, "Civic-house seven-threshold source contract drifted");
  check(typologies.get("hearthmere_unlit_hospice").traversalRules.includes("bed route minimum 1.8 meters"), "Hospice 1.8 m bed-route source rule drifted");
  check(typologies.get("hearthmere_unlit_hospice").traversalRules.includes("appeal courtyard is visible from every ward route"), "Hospice appeal-route source rule drifted");
  check(typologies.get("hearthmere_bell_civic").traversalRules.includes("bell stair supplies vertical landmark"), "Civic vertical-landmark source rule drifted");
  check(byId(site.routePrograms, "route-program.hearthmere.tenant-service").nodeIds.includes("node.hearthmere.tenant.yard"), "Tenant rear service route drifted");
  check(byId(site.routePrograms, "route-program.hearthmere.hospice-appeal").nodeIds.includes("node.hearthmere.hospice.appeal"), "Hospice patient-controlled appeal route drifted");
  check(byId(site.routePrograms, "route-program.hearthmere.hospice-staff").minimumClearWidthMeters === 1.8, "Hospice staff/bed route minimum width drifted");
  check(byId(site.routePrograms, "route-program.hearthmere.civic-service").nodeIds.includes("node.hearthmere.civic.lane"), "Civic seven-lamp service route drifted");
  check(sameArray(site.routePrograms.map(({ id }) => id), ROUTE_IDS), "Exact 21-route program contract drifted");

  check(sameArray(site.safeCells.map(({ id }) => id), SAFE_CELL_IDS), "Exact six safe-cell references drifted");
  check(sameArray(site.activityPhases.map(({ canonicalPhaseId }) => canonicalPhaseId), PHASE_IDS), "Exact five-phase activity contract drifted");
  const sourceActivity = byId(worldSpatial.SITE_ACTIVITY_CYCLES, "site.hearthmere", "siteId");
  check(sameArray(sourceActivity.cycles.map(({ phase }) => phase), PHASE_IDS), "Authored Hearthmere phase order drifted at source");

  const cleanHeader = byId(site.hydrologySystems, "hydrology.hearthmere.hospice-clean-header");
  const contaminatedWash = byId(site.hydrologySystems, "hydrology.hearthmere.hospice-contaminated-wash");
  const springChannel = byId(site.hydrologySystems, "hydrology.hearthmere.spring-channel");
  check(site.hydrologySystems.every(({ id }) => !/bellwater/i.test(id)), "Regional Bellwater hydrology was improperly localized");
  check(springChannel?.nonclaim.includes("No surveyed discharge, capacity, or connection to the regional modeled Bellwater stream is claimed."), "Hearth Spring/Bellwater nonconnection nonclaim drifted");
  check(cleanHeader && contaminatedWash && cleanHeader.prohibitedHydrologyIds.includes(contaminatedWash.id) && contaminatedWash.prohibitedHydrologyIds.includes(cleanHeader.id), "Hospice clean and contaminated hydrology separation drifted");
  const cleanSpaces = new Set(cleanHeader?.spaceIds ?? []);
  check(contaminatedWash?.spaceIds.every((id) => !cleanSpaces.has(id)), "Hospice clean and contaminated hydrology share a local space");

  const safeSpaceIds = new Set(site.safeCells.map(({ spaceId }) => spaceId));
  for (const habitat of site.habitats) {
    check(sameArray(habitat.safeCellExclusionIds, SAFE_CELL_IDS), `${habitat.id} must exclude all six safe cells`);
    check(habitat.spaceIds.every((id) => !safeSpaceIds.has(id)), `${habitat.id} overlaps a proposed safe-cell space`);
  }
  for (const [familyId, expectedCreatureIds] of Object.entries(FAMILY_CONTRACT)) {
    const habitat = byId(site.habitats, `habitat.hearthmere.${familyId.replaceAll("_", "-")}`);
    const sourceCreatureIds = bestiary.BESTIARY
      .filter((record) => record.familyId === familyId && record.habitatProfile.siteIds.includes("site.hearthmere"))
      .map(({ id }) => id);
    check(sameArray(sourceCreatureIds, expectedCreatureIds), `${familyId} canonical Hearthmere-affine form set drifted at source`);
    check(habitat && sameArray(habitat.creatureIds, expectedCreatureIds), `${familyId} habitat does not project exactly its canonical Hearthmere-affine forms`);
  }
  check(Object.values(FAMILY_CONTRACT).flat().length === 33, "Founding Hearthmere-affine bestiary projection must remain exactly 33 forms");
  for (const [id, overlayId] of [
    ["habitat.hearthmere.sixth-shutter-forecast", "overlay.hearthmere.counterfactual-cistern"],
    ["habitat.hearthmere.contrition-oculus", "overlay.hearthmere.six-wing-aftercare"],
  ]) {
    const habitat = byId(site.habitats, id);
    check(habitat && habitat.spaceIds.length === 0 && habitat.population.minimum === 1 && habitat.population.maximum === 1 && habitat.overlayBindingId === overlayId, `${id} must remain a population-one external overlay with no base-space placement`);
  }

  check(sameArray(site.actorSlots.map(({ actorId }) => actorId), ACTOR_IDS), "Exact 26-actor Hearthmere roster drifted");
  check(sameArray(site.actorSlots.filter(({ spawnAuthorized }) => spawnAuthorized).map(({ actorId }) => actorId), ["maela_voss", "torren_vale", "ysra_pell"]), "Only the three immutable-scene actors may have local spawn authority");
  check(site.actorSlots.slice(3).every((actor) => actor.slotKind === "off_site_marker" && actor.homeSpaceId === null && actor.schedule.length === 0), "The remaining 23 actor records must stay off-site markers");
  check(site.actorSlots.every((actor) => actor.assetMaturity.staticModelPath === null && actor.assetMaturity.animatedModelPath === null), "Wave 03C must not claim static or animated models");
  const sceneCharacterInstanceIds = scene.chunks.flatMap(({ instances }) => instances)
    .filter(({ type }) => type === "character")
    .map(({ id }) => id);
  check(sameArray(sceneCharacterInstanceIds, ["instance.ysra-pell", "instance.maela-voss", "instance.torren-vale"]), "Immutable scene character-anchor set drifted");
  const ysra = byId(characters.CHARACTERS, "ysra_pell");
  check(ysra.region === "dunmire", "Ysra Pell's canonical Dunmire region identity drifted");
  check(byId(site.actorSlots, "ysra_pell", "actorId")?.spawnPolicy.includes("home-region canon remains unchanged"), "Ysra scene presence improperly rewrites her canonical home region");

  check(site.encounterSlots.length === 4, "Exact four-slot encounter contract drifted");
  check(site.encounterSlots.every(({ safeCellExclusionIds }) => sameArray(safeCellExclusionIds, SAFE_CELL_IDS)), "Every encounter must exclude all six safe cells");
  check(sameArray(site.encounterSlots.slice(0, 2).map(({ actorOrCreatureId }) => actorOrCreatureId), ["ash_husk", "ledger_crawler"]), "Immutable scene Ash Husk and Ledger Crawler encounter projection drifted");
  check(site.encounterSlots.slice(2).every(({ spaceIds }) => spaceIds.length === 0), "Wave 04 creature pressures must not be localized into base spaces");

  const localOverlays = site.overlayBindings.slice(0, 8);
  check(localOverlays.every((overlay) =>
    overlay.kind === "local_stateful_cell"
      && overlay.localProxyNodeId === null
      && overlay.sourceGraphId === null
      && overlay.sourceGraphRecordSha256 === null
      && Object.values(overlay.expectedCounts).every((value) => value === 0)
  ), "Eight local quest programs must remain zero-count overlays without accepted graph claims");

  const externalOverlays = site.overlayBindings.slice(8);
  check(externalOverlays.length === 2, "Exactly two Wave 04 hash-only external graph overlays are required");
  for (const overlay of externalOverlays) {
    const contract = EXTERNAL_OVERLAY_CONTRACT[overlay.id];
    const program = wave04World.environmentPrograms.find(({ locationId }) => locationId === contract?.locationId);
    check(Boolean(contract && program), `${overlay.id} external graph source did not resolve`);
    if (!contract || !program) continue;
    check(overlay.kind === "accepted_external_graph" && overlay.bindingMode === "id_and_canonical_json_hash_no_contract_copy", `${overlay.id} must remain an ID-and-hash-only accepted graph binding`);
    check(overlay.localProxyNodeId === contract.proxy && byId(site.nodes, contract.proxy)?.traversable === false, `${overlay.id} proxy identity or non-traversability drifted`);
    check(overlay.sourceGraphId === contract.graphId && program.directedEnvironmentGraph.id === contract.graphId, `${overlay.id} graph identity drifted`);
    check(overlay.sourceGraphRecordSha256 === contract.graphHash && canonicalRecordSha256(program.directedEnvironmentGraph) === contract.graphHash, `${overlay.id} graph canonical JSON hash drifted`);
    check(sameObject(overlay.expectedCounts, contract.counts) && sameObject(externalGraphCounts(program), contract.counts), `${overlay.id} graph count summary drifted`);
    const egressInterfaces = overlay.interfaceBindings.filter(({ sourceAnchorId }) => /egress/i.test(sourceAnchorId));
    check(egressInterfaces.length === 2 && new Set(egressInterfaces.map(({ localNodeId }) => localNodeId)).size === 2, `${overlay.id} must preserve two distinct egress interfaces`);
  }
  const externalRoutes = site.routePrograms.slice(-2);
  check(externalRoutes.every((route) => route.topologyMode === "external_overlay_reference" && route.linkIds.length === 0 && route.nodeIds.length === 1), "External overlay routes must remain nontraversable proxies with no copied links");

  check(sameArray(site.questCrosswalk.map(({ questId }) => questId), QUEST_IDS), "Exact ten-quest crosswalk order drifted");
  for (const crosswalk of site.questCrosswalk) {
    const quest = questById.get(crosswalk.questId);
    check(Boolean(quest), `${crosswalk.questId} canonical quest source did not resolve`);
    if (!quest) continue;
    check(canonicalRecordSha256(quest) === crosswalk.questRecordSha256, `${crosswalk.questId} quest-record hash drifted`);
    check(sameArray(crosswalk.objectives.map(({ target }) => target), quest.objectives.map(({ target }) => target)), `${crosswalk.questId} objective target order drifted`);
    const overlay = byId(site.overlayBindings, crosswalk.overlayBindingId);
    const machine = byId(site.stateMachines, overlay.stateMachineId);
    const write = quest.stateWrites[0];
    check(write && machine && sameArray(machine.states, ["unresolved", ...write.values]) && machine.initialState === "unresolved", `${crosswalk.questId} state machine no longer projects its exact canonical state-write values`);
  }
  check(site.questCrosswalk.reduce((total, quest) => total + quest.objectives.length, 0) === 35, "Quest objective projection must remain exactly 35 source-ordered objectives");

  const emberMachine = byId(site.stateMachines, "state.hearthmere.ember-ledger");
  check(emberMachine && sameArray(emberMachine.states, ["ember-ledger-unrestored", "ember-ledger-restored"]) && emberMachine.initialState === "ember-ledger-unrestored", "Immutable scene Ember Ledger phase adapter drifted");

  const artReference = byId(worldSpatial.ENVIRONMENT_ART_DIRECTION.acceptedVisualReferences, "concept_hearthmere_hold");
  check(sameArray(site.artDirection.acceptedReferenceIds, ["concept_hearthmere_hold"]), "Hearthmere accepted art-reference binding drifted");
  check(site.artDirection.referenceBoundary.startsWith("Direction only:"), "Art reference must remain direction-only and non-geometric");
  try {
    const artEvidence = await fileEvidence(repositoryRoot, artReference.path);
    check(artEvidence.sha256 === artReference.sha256, "Accepted Hearthmere art payload hash drifted");
  } catch (error) {
    errors.push(`Accepted Hearthmere art evidence failed: ${error.message}`);
  }

  const partitions = worldSpatial.WORLD_STREAMING_AND_LOD.spatialPartitions;
  check(
    sameArray(partitions.map(({ sizeMeters }) => sizeMeters[0]), [512, 32, 16])
      && partitions.every(({ sizeMeters }) => sizeMeters[0] === sizeMeters[1]),
    "Authored 512/32/16 metre streaming partition contract drifted",
  );

  check(site.consumerHandoff.requiredIndependentReviews === 2, "Wave 03C must require two future independent reviews");
  check(site.consumerHandoff.limitations.includes("No independent review manifest or approval exists in this pass."), "Wave 03C must preserve the no-review-yet nonclaim");
  check(site.claims.authorSelfApproval === false && site.claims.integrationAuthorized === false && site.claims.releaseReady === false, "Wave 03C must not claim review, integration, or release approval");

  const evidenceMaturity = "evidence_for_independently_reviewed_noncanonical_reference";
  const expectedProvenance = new Map([
    [SITE_BLOCKOUT_V2_SCHEMA_PATH, { ...schemaEvidence, role: "machine_contract", maturity: "reference_schema_v2" }],
    [WAVE_03C_INDEX_PATH, { ...indexEvidence, role: "release_index", maturity: WAVE_03C_REVIEWED_MATURITY }],
    [WAVE_03C_SITE_PATH, { ...siteEvidence, role: "site_local_spatial_reference", maturity: WAVE_03C_REVIEWED_MATURITY }],
    [WAVE_03C_VALIDATOR_PATH, { ...validatorEvidence, role: "release_validator", maturity: evidenceMaturity }],
    [WAVE_03C_TEST_PATH, { ...testEvidence, role: "adversarial_acceptance_test", maturity: evidenceMaturity }],
    [WAVE_03C_REVIEW_A_PATH, { ...reviewAEvidence, role: "independent_review_manifest", maturity: evidenceMaturity }],
    [WAVE_03C_REVIEW_B_PATH, { ...reviewBEvidence, role: "independent_review_manifest", maturity: evidenceMaturity }],
  ]);
  check(provenance.id === "provenance.world-spatial-wave-03c" && provenance.records?.length === 7, "Wave 03C provenance identity or record count drifted");
  check(provenance.rights === "original_project_owned_authorized_for_repository", "Wave 03C provenance rights statement drifted");
  check(provenance.tool?.name === "built_in_code_workflow" && provenance.tool?.mode === "site_local_reference_authoring", "Wave 03C provenance tool/mode drifted");
  check(provenance.publication?.privacy === "repository_relative_redacted"
    && ["externalProviderIdentifiers", "workstationPaths", "usernames", "emails", "signedUrls"].every((key) => provenance.publication[key] === false), "Wave 03C provenance privacy flags drifted");
  check(provenance.direction?.text === WAVE_03C_DIRECTION_TEXT
    && provenance.direction?.sha256 === sha256(Buffer.from(WAVE_03C_DIRECTION_TEXT, "utf8")), "Wave 03C direction text or hash drifted");
  check(sameObject(provenance.reviewEvidence, {
    reviewMode: "two_independent_read_only_frozen_artifact_reviews",
    schemaSha256: schemaEvidence.sha256,
    indexSha256: indexEvidence.sha256,
    siteSha256: siteEvidence.sha256,
    siteCanonicalRecordSha256: canonicalRecordSha256(site),
    validatorSha256: validatorEvidence.sha256,
    testSha256: testEvidence.sha256,
    reviewAManifestPath: WAVE_03C_REVIEW_A_PATH,
    reviewAManifestSha256: reviewAEvidence.sha256,
    reviewBManifestPath: WAVE_03C_REVIEW_B_PATH,
    reviewBManifestSha256: reviewBEvidence.sha256,
  }), "Wave 03C provenance review-evidence chain drifted");
  check(sameSet(ids(provenance.records, "path"), new Set(expectedProvenance.keys())), "Wave 03C provenance path set drifted");
  for (const record of provenance.records ?? []) {
    const expected = expectedProvenance.get(record.path);
    check(expected
      && record.sha256 === expected.sha256
      && record.bytes === expected.bytes
      && record.role === expected.role
      && record.maturity === expected.maturity
      && record.rights === "original_project_owned_authorized_for_repository", `Wave 03C provenance evidence drifted for ${record.path}`);
  }
  check(!stringValues({ index, site, provenance, reviewA, reviewB }).some(privateString), "Wave 03C publication contains private provenance, an external URL, or a workstation path");
  check(!stringValues({ index, provenance, reviewA, reviewB }).some(privateProviderString), "Wave 03C release evidence contains an external provider identity");

  return {
    valid: errors.length === 0,
    errors,
    stats: generic.stats,
    evidence: {
      schema: schemaEvidence,
      index: indexEvidence,
      site: siteEvidence,
      tooling: { validator: validatorEvidence, test: testEvidence },
      reviews: { a: reviewAEvidence, b: reviewBEvidence },
      sourceArtifacts: generic.evidence?.sourceArtifacts ?? {},
      schemaCanonicalRecordSha256: canonicalRecordSha256(schema),
      siteCanonicalRecordSha256: canonicalRecordSha256(site),
      immutableSceneSha256: byId(site.sourceBindings, "source.scene.hearthmere")?.sha256 ?? null,
      externalGraphCanonicalRecordSha256: Object.fromEntries(externalOverlays.map((overlay) => [overlay.sourceGraphId, overlay.sourceGraphRecordSha256])),
    },
    reviewStatus: WAVE_03C_REVIEWED_MATURITY,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = await validateWorldSpatialWave03c();
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exitCode = 1;
}
