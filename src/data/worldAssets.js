/**
 * Production-facing environment kit manifest. These are stable asset IDs rather
 * than implementation-specific filenames, so 2D, 3D, audio, and VFX teams can
 * build against the same regional vocabulary.
 */

const kit = (id, name, reference, palette, lighting, surfaces, structures, props, foliage, decals, vfx, audio) => ({
  id, name, reference, palette, lighting, surfaces, structures, props, foliage, decals, vfx, audio,
});

const PROJECT_ART_METADATA = Object.freeze({
  revision: 1,
  provenance: "Owner-authorized original project art; public records retain repository-relative, content-addressed evidence only.",
  rightsNote: "Owner-authorized original project art for environment direction and blockout reference.",
  maturity: "approved_environment_direction_and_legacy_runtime_backdrop_not_production",
  runtimeBackdrop: true,
  runtimeIntegrated: true,
  productionAsset: false,
  approvalStatus: "approved_direction",
});

const DIRECTION_ONLY_ART_METADATA = Object.freeze({
  revision: 1,
  provenance: "Owner-authorized original project art; public records retain repository-relative, content-addressed evidence only.",
  rightsNote: "Owner-authorized original project art for environment direction and blockout reference.",
  maturity: "approved_environment_direction_not_runtime_or_production",
  runtimeBackdrop: false,
  runtimeIntegrated: false,
  productionAsset: false,
  approvalStatus: "approved_direction",
});

const TECHNICAL_REFERENCE_METADATA = Object.freeze({
  provenance: "Owner-authorized original project reference; public records retain repository-relative, content-addressed evidence only.",
  rightsNote: "Owner-authorized original project topology reference for environment blockout.",
  maturity: "independently_reviewed_2d_topology_reference_not_production",
  runtimeBackdrop: false,
  runtimeIntegrated: false,
  productionAsset: false,
  technicalReadiness: false,
  approvalStatus: "approved_2d_topology_reference",
});

export const WORLD_CONCEPT_ASSETS = Object.freeze([
  {
    id: "concept_hearthmere_hold",
    regionId: "hearthmere",
    path: "./assets/world/hearthmere-hold.png",
    ...PROJECT_ART_METADATA,
    dimensions: Object.freeze({ width: 1672, height: 941 }),
    referenceScope: "regional",
    generationTool: "built_in_image_generation",
    generationMode: "new_image",
    sha256: "7f17a219ef090f7d3c20e22ab24275a9c39483c4d3c89a8297ef4ef006258b3c",
    type: "environment_keyframe",
    use: ["hub_layout", "material_reference", "lighting_reference", "architecture_language"],
    promptSummary: "Fortified warm-spring refuge in cold rain; traversable wet-slate hub with palisade, bell tower, shrine plaza, and layered routes.",
  },
  {
    id: "concept_hearthmere_civic_spring_spine",
    environmentId: "environment.hearthmere-hold-civic-spring-spine",
    regionId: "hearthmere",
    siteId: "site.hearthmere",
    locationId: "hearthmere_civic_spring_spine",
    path: "./assets/world/hearthmere-civic-spring-spine-v1.png",
    ...DIRECTION_ONLY_ART_METADATA,
    dimensions: Object.freeze({ width: 1536, height: 1024 }),
    bytes: 3207738,
    colorSpace: "sRGB",
    alphaPolicy: "opaque",
    referenceScope: "site_civic_exterior",
    generationTool: "built_in_image_generation",
    generationMode: "reference_guided_revision",
    promptSha256: "ea8266cdf3984dee3a11da727515d69ae1f5287575780243f46ea17a791c639e",
    sha256: "d8f74db7b7bb138475b15d64d0ee86f779804bafa6b6054afbc0adb46e310a79",
    type: "environment_keyframe",
    use: ["civic_spring_spine", "three_route_hierarchy", "resident_scale", "spring_runoff_separation", "working_civic_artifacts", "hearthmere_material_law"],
    promptSummary: "Inhabited player-height civic spring spine with exactly eight residents, one open timber tower, one square, one spring arch, three connected route roles, and visibly separate spring and roof-runoff systems.",
  },
  {
    id: "concept_dunmire_causeway",
    regionId: "dunmire",
    path: "./assets/world/dunmire-causeway.png",
    ...PROJECT_ART_METADATA,
    dimensions: Object.freeze({ width: 1672, height: 941 }),
    referenceScope: "regional",
    generationTool: "built_in_image_generation",
    generationMode: "new_image",
    sha256: "f5f7d5c22da1cb175bfc9da6777ba05c9092f60d6c813b92c4c46b6633f99702",
    type: "environment_keyframe",
    use: ["route_composition", "water_material", "ambush_readability", "gathering_ecology"],
    promptSummary: "Broken causeway over a drowned parish; blackwater, submerged roofs, guide lanterns, reeds, bridge landmark, and combat pockets.",
  },
  {
    id: "concept_cinderward_foundry",
    regionId: "cinderward",
    path: "./assets/world/cinderward-foundry.png",
    ...PROJECT_ART_METADATA,
    dimensions: Object.freeze({ width: 1672, height: 941 }),
    referenceScope: "regional",
    generationTool: "built_in_image_generation",
    generationMode: "versioned_reference_edit",
    sha256: "37de3ab742e5368998d6a215ebaa4b96fccfe1d15aeb73e02e5a8b4936c077fa",
    type: "environment_keyframe",
    use: ["industrial_kit", "boss_arena", "vertical_traversal", "shortcut_language"],
    promptSummary: "Breathing royal bell-metal foundry with furnace arena, chain lifts, gantries, slag canals, mining route, and shortcut loops.",
  },
  {
    id: "concept_hollow_abbey_nave",
    regionId: "hollow_abbey",
    path: "./assets/world/hollow-abbey-nave.png",
    ...PROJECT_ART_METADATA,
    dimensions: Object.freeze({ width: 1672, height: 941 }),
    referenceScope: "regional",
    generationTool: "built_in_image_generation",
    generationMode: "new_image",
    sha256: "d79488872142049443b55ef98532470d632dba9bd9ae5e90ba02bd8403e7bc3b",
    type: "environment_keyframe",
    use: ["interior_kit", "combat_lanes", "resonant_urn_mechanic", "eclipse_lighting"],
    promptSummary: "Rain-open mute nave with delayed echoes, burial urns, side aisles, upper traversal, eclipse shafts, and the route to the Last Bell crypt.",
  },
  {
    id: "concept_graven_march_black_pine_occlusion_basin",
    regionId: "graven_march",
    locationId: "graven_march_black_pine_occlusion_basin",
    questId: "regional_cairns_keep_winter",
    path: "./assets/world/graven-march-black-pine-occlusion-basin-v5.png",
    ...PROJECT_ART_METADATA,
    dimensions: Object.freeze({ width: 1536, height: 1024 }),
    referenceScope: "regional_quest_location",
    generationTool: "built_in_image_generation",
    generationMode: "versioned_reference_edit",
    promptSha256: "f25da864676be53b357135c8b9fc2ecd153352244745c97ced067d32c04fbb0a",
    sha256: "8b756803451bbd6893c445a36303c9a7b0b4c0736b98c0d64e4204f777ab9b76",
    type: "environment_keyframe",
    use: ["basin_topology", "winter_road_closure", "cairn_beast_ecology", "black_pine_occlusion"],
    promptSummary: "Black-pine winter basin with twelve dormant cairn bodies, three failed dens, five shadow intervals, a closed public road, and a readable trade detour.",
  },
  {
    id: "concept_cathedral_six_rehearsed_dawns",
    regionId: "hollow_abbey",
    locationId: "cathedral_of_six_rehearsed_dawns",
    questId: "faction_heresy_gentle_horizon",
    path: "./assets/world/cathedral-six-rehearsed-dawns-v2.png",
    ...PROJECT_ART_METADATA,
    dimensions: Object.freeze({ width: 1536, height: 1024 }),
    referenceScope: "quest_location",
    maturity: "approved_environment_direction_not_runtime_or_production",
    runtimeBackdrop: false,
    runtimeIntegrated: false,
    generationTool: "built_in_image_generation",
    generationMode: "versioned_reference_edit",
    promptSha256: "14ff3a3f05e2a2963e48ce7ecc4e5acb8a718dcb7606b7646884df9221a32913",
    sha256: "5c2ab84059a4e62234f5c63fdfaffa9eb226ebe1d3ea11d53a2dea26cd11221c",
    type: "environment_keyframe",
    use: ["six_refusal_bays", "arrested_contact_geometry", "lucent_material_law", "service_release_route"],
    promptSummary: "Lucent doctrinal interior with six distinct refusal bays, a central pressure vessel, a restrained hand canopy stopped one finger-width away, and a dark service-release route.",
  },
  {
    id: "concept_warden_reed_four_bank_visibility_exterior",
    environmentId: "environment.warden-reed-four-bank-visibility",
    regionId: "dunmire",
    siteId: "site.warden-reed",
    locationId: "warden_reed_four_bank_visibility",
    questId: "regional_the_fog_came_to_collect_our_outlines",
    path: "./assets/world/warden-reed-four-bank-visibility-exterior-v1.png",
    ...DIRECTION_ONLY_ART_METADATA,
    dimensions: Object.freeze({ width: 1536, height: 1024 }),
    bytes: 2709612,
    colorSpace: "sRGB",
    alphaPolicy: "opaque",
    referenceScope: "quest_location_exterior",
    generationTool: "built_in_image_generation",
    generationMode: "new_image",
    sha256: "52d94e5252c7f4935772daaa970b58668ea82746491a969d0cad616403eaf17e",
    type: "environment_keyframe",
    use: ["four_bank_visibility", "public_service_route_separation", "fog_wayfinding", "stilt_settlement_materials"],
    promptSummary: "Occupied four-bank Warden Reed settlement with a single civic escrow frame, separate public, service, ferry, and high-rope routes, blackwater stilt foundations, guide lanterns, and accountable fog visibility.",
  },
  {
    id: "concept_warden_reed_stilt_service_house_interior",
    environmentId: "environment.warden-reed-four-bank-visibility",
    regionId: "dunmire",
    siteId: "site.warden-reed",
    locationId: "warden_reed_four_bank_visibility",
    questId: "regional_the_fog_came_to_collect_our_outlines",
    path: "./assets/world/warden-reed-stilt-service-house-interior-v1.png",
    ...DIRECTION_ONLY_ART_METADATA,
    dimensions: Object.freeze({ width: 1536, height: 1024 }),
    bytes: 2729693,
    colorSpace: "sRGB",
    alphaPolicy: "opaque",
    referenceScope: "quest_location_interior",
    generationTool: "built_in_image_generation",
    generationMode: "reference_guided_new_image",
    sha256: "5494c36be429b7a76b2f2857059cce8a28a495fa23bc27a2e405adf950037089",
    type: "environment_interior_keyframe",
    use: ["stilt_service_house", "wet_entry_circulation", "ledger_work_screen", "blackwater_boat_egress", "cistern_and_loft_utilities"],
    promptSummary: "Occupied stilt service-house interior with a wet entry, family work table, screened ledger station, loft and cistern access, blackwater boat hatch, and readable separation between household, public, and service circulation.",
  },
  {
    id: "concept_hollow_abbey_processional_west_arrival",
    environmentId: "environment.hollow-abbey-processional-and-mute-nave",
    regionId: "hollow_abbey",
    siteId: "site.hollow-abbey",
    routeId: "route.processional-steps",
    locationId: "hollow_abbey_processional_and_mute_nave",
    questId: "main_a_litany_unspoken",
    landmarkIds: Object.freeze(["abbey_gate"]),
    path: "./assets/world/hollow-abbey-processional-west-arrival-v1.png",
    ...DIRECTION_ONLY_ART_METADATA,
    dimensions: Object.freeze({ width: 1536, height: 1024 }),
    bytes: 2762634,
    colorSpace: "sRGB",
    alphaPolicy: "opaque",
    referenceScope: "site_arrival_exterior",
    generationTool: "built_in_image_generation",
    generationMode: "reference_guided_revision",
    promptSha256: "4229aa8e863a160b9bb4cfb871ddce757b7ff8ca55bfe4ab55a55deb21664298",
    sha256: "e10cf6c4e1469d23f49f0fc38ebb49d0dad51f490b1f8bf23c1c2e82ced72e29",
    type: "environment_keyframe",
    use: ["processional_steps_arrival", "exact_word_gate_hierarchy", "optional_high_shelf_loop", "salt_watch_onward_route", "karst_rain_materials"],
    promptSummary: "West arrival at Hollow Abbey with a central Exact-Word gate stair, a fully framed high-shelf loop that rejoins the lower route, and a continuous Processional Steps departure toward Salt Watch.",
  },
  {
    id: "concept_hollow_abbey_mute_nave_route_read",
    environmentId: "environment.hollow-abbey-processional-and-mute-nave",
    regionId: "hollow_abbey",
    siteId: "site.hollow-abbey",
    routeId: "route.processional-steps",
    locationId: "hollow_abbey_processional_and_mute_nave",
    questId: "main_a_litany_unspoken",
    landmarkIds: Object.freeze(["mute_nave", "last_bell_crypt"]),
    path: "./assets/world/hollow-abbey-mute-nave-route-read-v1.png",
    ...DIRECTION_ONLY_ART_METADATA,
    dimensions: Object.freeze({ width: 1536, height: 1024 }),
    bytes: 2715661,
    colorSpace: "sRGB",
    alphaPolicy: "opaque",
    referenceScope: "site_interior_route_read",
    generationTool: "built_in_image_generation",
    generationMode: "reference_guided_revision",
    promptSha256: "436ea290791c6001a7c2a709d3e0abf07e46bf7520ff0127ced7010a00b188fb",
    sha256: "2e5582779702fed33fef3ee092f109a0c39403431752f11c22bbad95b7288826",
    type: "environment_interior_keyframe",
    use: ["player_height_route_read", "side_aisle_loops", "upper_cloister_ascent_and_return", "crypt_descent_legibility", "urn_field_combat_occlusion"],
    promptSummary: "Off-axis player-height Mute Nave route study with a central quest spine, lateral aisle loops, upper-cloister ascent and return, edge-clustered urn cover, and a materially black crypt descent.",
  },
  {
    id: "concept_hollow_abbey_rain_court_work_nexus",
    environmentId: "environment.hollow-abbey-processional-and-mute-nave",
    regionId: "hollow_abbey",
    siteId: "site.hollow-abbey",
    routeId: "route.processional-steps",
    locationId: "hollow_abbey_processional_and_mute_nave",
    questId: "main_a_litany_unspoken",
    landmarkIds: Object.freeze(["abbey_gate", "mute_nave"]),
    path: "./assets/world/hollow-abbey-rain-court-work-nexus-v1.png",
    ...DIRECTION_ONLY_ART_METADATA,
    dimensions: Object.freeze({ width: 1536, height: 1024 }),
    bytes: 3200004,
    colorSpace: "sRGB",
    alphaPolicy: "opaque",
    referenceScope: "site_court_work_nexus",
    generationTool: "built_in_image_generation",
    generationMode: "reference_guided_revision",
    promptSha256: "2f5f5b0207448f1c253c5fa240094798fd0511233e06e695bb0638bdf5718c9c",
    sha256: "a5e5ae1dfe2ec15a7f17f649356404f4f276ba8db89bcdd07bc2273cd555b074",
    type: "environment_keyframe",
    use: ["deep_exact_word_gate", "rain_court_four_way_route_hierarchy", "gatewarden_nhal_staging", "shallow_local_karst_drainage", "maintained_work_thresholds"],
    promptSummary: "Player-height rain-court work nexus from inside the deep Exact-Word gate, with a clear regroup pocket, four materially distinct destinations, one laterally staged Gatewarden Nhal, and maintained shallow local drainage.",
  },
  {
    id: "concept_hollow_abbey_foundry_operational_chain",
    environmentId: "environment.hollow-abbey-processional-and-mute-nave",
    regionId: "hollow_abbey",
    siteId: "site.hollow-abbey",
    locationId: "hollow_abbey_foundry_of_borrowed_quiet",
    questId: "profession_bell_paid_in_silence",
    path: "./assets/world/hollow-abbey-foundry-operational-chain-v1.png",
    ...DIRECTION_ONLY_ART_METADATA,
    dimensions: Object.freeze({ width: 1536, height: 1024 }),
    bytes: 2656904,
    colorSpace: "sRGB",
    alphaPolicy: "opaque",
    referenceScope: "site_foundry_operational_interior",
    generationTool: "built_in_image_generation",
    generationMode: "reference_guided_revision",
    promptSha256: "edc49b7f065a5ef4ec45a9976e8120c3b6ba238f59e7d76f18ffa294cb121ec6",
    sha256: "a4b6c7ee808befc1ac6b1adfefa1a801c4e5d5fe48e71e42e1820c789a48b1bc",
    type: "environment_interior_keyframe",
    use: ["f01_f08_operational_chain", "seven_silence_rooms_simultaneous_read", "deaf_worker_blackwater_ripple_sightline", "funeral_route_bypasses_molten_floor", "rain_open_casting_lantern_seven_baffles", "worker_egress_clearance_repair_and_weathering"],
    promptSummary: "Player-height Foundry of Borrowed Quiet operational study with the complete F01–F08 work chain, seven simultaneously readable silence rooms, closed blackwater quench witness, safe funeral bypass, and a rain-open seven-baffle casting lantern.",
  },
]);

export const WORLD_SOURCE_ASSETS = Object.freeze([
  {
    id: "source_cinderward_foundry_annotated_draft",
    path: "./assets/world/cinderward-foundry-draft.png",
    type: "rejected_generation_draft",
    dimensions: Object.freeze({ width: 1672, height: 941 }),
    provenance: PROJECT_ART_METADATA.provenance,
    rightsNote: PROJECT_ART_METADATA.rightsNote,
    maturity: "rejected_source_not_for_runtime_or_direction",
    approvalStatus: "rejected_text_overlay",
    replacedBy: "concept_cinderward_foundry",
    sha256: "b3a0c42f2f71f9cbc238d9801224412bd4e41b06220d5ba08c7acd9f55a194df",
  },
]);

export const WORLD_TECHNICAL_ASSETS = Object.freeze([
  {
    id: "technical_veil_coast_gloamharbor_tide_refuge",
    territoryId: "territory.veil-coast",
    siteId: "site.gloamharbor",
    subjectId: "gloamharbor_tide_refuge_precinct",
    path: "./assets/world/technical/veil-coast-gloamharbor-tide-refuge-blueprint-v14.png",
    topologyPath: "./assets/world/technical/veil-coast-gloamharbor-tide-refuge-topology-v14.json",
    ...TECHNICAL_REFERENCE_METADATA,
    dimensions: Object.freeze({ width: 1536, height: 1024 }),
    referenceScope: "site_interior_circulation",
    exactAtlasCoordinate: null,
    coordinateSemantics: "diagram_pixels_not_meters",
    generationTool: "deterministic_local_vector_renderer",
    generationMode: "source_defined_rasterization",
    sha256: "9784d16b16b5905aa2dbf43cbea32701f68c70eaf955199822ba4583a29d67ab",
    topologySha256: "0accae6f553bc87cedab082453ed7bd91d44b1991a72add2eb6b6e344f8b9b9a",
    reviewAFreezeSha256: "f3b4186f316e56f4ccbba7659af2c8dc49be6584370c71434072dd8784aa03de",
    reviewBFreezeSha256: "66f49d6d11f1a3cc2b3fc8097c746a6f50c39cdde255a74e82d9b85b466fbcda",
    type: "environment_topology_blueprint",
    use: Object.freeze([
      "five_cell_adjacency",
      "continuous_step_free_bell_route",
      "independent_right_boardwalk",
      "roof_and_canopy_coverage",
      "utility_chain_separation",
    ]),
    claims: Object.freeze({
      cells: 5,
      internalOpenings: 4,
      exteriorDoors: 2,
      frontExteriorDoors: 1,
      wheelchairRouteNodes: 13,
      wheelchairRouteEdges: 12,
      rightBoardwalkNodes: 5,
      rightBoardwalkEdges: 4,
      completeSeparateUtilities: 2,
    }),
    limitations: Object.freeze([
      "Not an environment keyframe or mood reference.",
      "Not CAD, structural, construction, accessibility-code, GIS, runtime, collision, navigation, gameplay, or 3D authority.",
      "All JSON x/y values are diagram pixels, never world meters.",
      "Does not establish an exact atlas coordinate, final dimensions, construction detail, or production readiness.",
    ]),
  },
]);

const SPATIAL_BLOCKOUT_REFERENCE_METADATA = Object.freeze({
  authority: "independently_reviewed_noncanonical_reference",
  coordinateSemantics: "candidate_site_local_fictional_meters",
  runtimeIntegrated: false,
  constructionReady: false,
  productionGeometry: false,
  staticScene: false,
  animatedScene: false,
  releaseReady: false,
});

/**
 * Lightweight, on-demand pointers to reviewed spatial handoffs. The payloads
 * remain JSON files rather than being imported into MODEL MAKER's default
 * bundle; Claude Design can inspect them without confusing a blockout with a
 * static or animated production scene.
 */
export const WORLD_SPATIAL_BLOCKOUT_ASSETS = Object.freeze([
  Object.freeze({
    id: "spatial_blockout.world-spatial-wave-02-v9",
    waveId: "world-spatial-wave-02-v9",
    name: "World Spatial Wave 02 · Six-Site Deep Blockout",
    sourceType: "multi_site_annex",
    environmentIds: Object.freeze([]),
    siteIds: Object.freeze([
      "site.gloamharbor",
      "site.sluice-chapel",
      "site.pale-measure",
      "site.anchor-field",
      "site.smothered-kiln",
      "site.white-meridian",
    ]),
    indexPath: null,
    payloadPath: "assets/world/spatial/world-spatial-wave-02-v9.annex.json",
    provenancePath: "assets/world/spatial/world-spatial-wave-02-v9.provenance.json",
    schemaPath: null,
    schemaVersion: null,
    sha256: "4ddba07f2e7c74700d021421cbc20dd0ee27e9ccef730e9258fb6cfaebb3ffe4",
    bytes: 49416945,
    counts: Object.freeze({ sites: 6, frames: 9, structures: 12, rooms: 67, habitats: 28, utilities: 64, verticalAccess: 36, independentEgress: 36, questCrosswalks: 3 }),
    summary: "Nine local frames bind twelve structures, sixty-seven rooms, habitat and utility networks, vertical access, independent emergency stairs, and three quest crosswalks across six sites.",
    limitations: Object.freeze([
      "Site-local fictional meters are not atlas coordinates or diagram pixels.",
      "Data-only reference; not accepted art, production geometry, runtime navigation or collision, construction guidance, or engineering certification.",
    ]),
    ...SPATIAL_BLOCKOUT_REFERENCE_METADATA,
  }),
  Object.freeze({
    id: "spatial_blockout.wave-03a.warden-reed",
    waveId: "world-spatial-wave-03a",
    name: "World Spatial Wave 03A · Warden Reed",
    sourceType: "site_blockout_reference",
    environmentIds: Object.freeze(["environment.warden-reed-four-bank-visibility"]),
    siteIds: Object.freeze(["site.warden-reed"]),
    indexPath: "assets/world/spatial/wave-03a/index.json",
    payloadPath: "assets/world/spatial/wave-03a/warden-reed.site.json",
    provenancePath: "assets/world/spatial/wave-03a/provenance.json",
    schemaPath: "assets/world/spatial/site-blockout-reference-v1.schema.json",
    schemaVersion: 1,
    sha256: "04a4791e66f486c5ddd0bc05129086203bde2d7dbfe8ad7e2ffe2ac83360ca60",
    bytes: 76805,
    counts: Object.freeze({ sites: 1, structures: 2, rooms: 12, anchorNodes: 18, thresholds: 15, utilities: 6, hazards: 5, habitats: 4, routes: 8, activityPhases: 4, questObjectives: 4 }),
    summary: "Two structures and twelve room roles bind eighteen exact anchor ports, independent egress domains, utilities, hazards, habitats, routes, four activity phases, and four objective crosswalks.",
    limitations: Object.freeze([
      "The complete local frame is relocatable within the authored Warden Reed site envelope.",
      "Reference only; not canonical geometry, atlas placement, runtime navigation or collision, construction guidance, or a static or animated production scene.",
    ]),
    ...SPATIAL_BLOCKOUT_REFERENCE_METADATA,
  }),
  Object.freeze({
    id: "spatial_blockout.wave-03b.hollow-abbey",
    waveId: "world-spatial-wave-03b",
    name: "World Spatial Wave 03B · Hollow Abbey",
    sourceType: "site_blockout_reference",
    environmentIds: Object.freeze(["environment.hollow-abbey-processional-and-mute-nave"]),
    siteIds: Object.freeze(["site.hollow-abbey"]),
    indexPath: "assets/world/spatial/wave-03b/index.json",
    payloadPath: "assets/world/spatial/wave-03b/hollow-abbey.site.json",
    provenancePath: "assets/world/spatial/wave-03b/provenance.json",
    schemaPath: "assets/world/spatial/site-blockout-reference-v2.schema.json",
    schemaVersion: 2,
    sha256: "db08828beb8d82934e7a4ec1212672ea2e2b8d3145bab3fec16ca7f3a33cf9b3",
    bytes: 215770,
    counts: Object.freeze({ sites: 1, zones: 3, spaces: 45, nodes: 48, links: 60, directedArcs: 120, safeCells: 6, stateMachines: 6, activityPhases: 4, hydrologySystems: 5, habitats: 7, actorSlots: 13, encounterSlots: 3, routePrograms: 15, overlayBindings: 2, questObjectives: 15 }),
    summary: "Forty-five base spaces and forty-eight nodes bind the court, nave, crypt, foundry, hydrology, habitats, actor schedules, encounters, and three quest crossings while preserving the accepted cause-frame graph as an external overlay.",
    limitations: Object.freeze([
      "The Gate-centered local frame is relocatable and subordinate to canonical identities, route order, quest state, and the atlas site anchor.",
      "Reference only; not surveyed or canonical geometry, runtime navigation or collision, construction guidance, static or animated models, or a production asset.",
    ]),
    ...SPATIAL_BLOCKOUT_REFERENCE_METADATA,
  }),
  Object.freeze({
    id: "spatial_blockout.wave-03c.hearthmere",
    waveId: "world-spatial-wave-03c",
    name: "World Spatial Wave 03C · Hearthmere",
    sourceType: "site_blockout_reference",
    environmentIds: Object.freeze(["environment.hearthmere-hold-civic-spring-spine"]),
    siteIds: Object.freeze(["site.hearthmere"]),
    indexPath: "assets/world/spatial/wave-03c/index.json",
    payloadPath: "assets/world/spatial/wave-03c/hearthmere.site.json",
    provenancePath: "assets/world/spatial/wave-03c/provenance.json",
    schemaPath: "assets/world/spatial/site-blockout-reference-v2.schema.json",
    schemaVersion: 2,
    sha256: "b2d46282e15d7db4753eb64ab39221b8482503d7b6eebef5eec9b62b1633cfe1",
    bytes: 214988,
    counts: Object.freeze({ sites: 1, zones: 4, spaces: 32, nodes: 37, traversableNodes: 35, overlayProxyNodes: 2, links: 41, directedArcs: 82, safeCells: 6, stateMachines: 11, phases: 5, hydrology: 6, habitats: 11, actors: 26, encounters: 4, routes: 21, overlays: 10, quests: 10, objectives: 35, sourceBindings: 28 }),
    summary: "Thirty-two spaces and thirty-seven nodes bind Hearthmere's civic spring spine, clean-water and runoff systems, resident schedules, habitats, encounters, routes, overlays, and ten quest crossings without promoting the reference to canon.",
    limitations: Object.freeze([
      "The site-local fictional-meter frame is relocatable and subordinate to canonical identities, quest state, and the atlas site anchor.",
      "Reference only; not exact or surveyed placement, atlas-export geometry, runtime navigation or collision, construction guidance, production geometry, static or animated models, or a release-ready asset.",
    ]),
    ...SPATIAL_BLOCKOUT_REFERENCE_METADATA,
  }),
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
    "graven_march", "The Graven March", "concept_graven_march_black_pine_occlusion_basin",
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
  const regionIds = new Set();
  for (const region of REGION_ASSET_KITS) {
    if (regionIds.has(region.id)) errors.push(`Duplicate region kit: ${region.id}`);
    regionIds.add(region.id);
    for (const field of ["surfaces", "structures", "props", "foliage", "decals", "vfx", "audio"]) {
      if (!Array.isArray(region[field]) || region[field].length < 4) errors.push(`${region.id}.${field} is underspecified`);
      if (new Set(region[field]).size !== region[field].length) errors.push(`${region.id}.${field} has duplicates`);
    }
  }
  const conceptIds = new Set();
  for (const concept of WORLD_CONCEPT_ASSETS) {
    if (conceptIds.has(concept.id)) errors.push(`Duplicate concept asset: ${concept.id}`);
    conceptIds.add(concept.id);
    if (!regionIds.has(concept.regionId)) errors.push(`Concept ${concept.id} has unknown region ${concept.regionId}`);
    if (!concept.path || !concept.sha256 || !concept.provenance || !concept.rightsNote || !concept.maturity) errors.push(`Concept ${concept.id} lacks production provenance`);
    const { width, height } = concept.dimensions ?? {};
    if (!Number.isInteger(width) || !Number.isInteger(height) || Math.min(width, height) < 768 || Math.max(width, height) > 4096) errors.push(`Concept ${concept.id} has unexpected dimensions`);
    if (concept.referenceScope?.includes("quest_location") && (!concept.locationId || !concept.questId)) errors.push(`Quest-location concept ${concept.id} lacks canonical links`);
    if (concept.bytes !== undefined && (!Number.isInteger(concept.bytes) || concept.bytes <= 0)) errors.push(`Concept ${concept.id} has an invalid byte count`);
    if (concept.maturity === DIRECTION_ONLY_ART_METADATA.maturity) {
      if (concept.runtimeBackdrop || concept.runtimeIntegrated || concept.productionAsset) errors.push(`Direction-only concept ${concept.id} overstates implementation readiness`);
      if (concept.environmentId && (concept.colorSpace !== "sRGB" || concept.alphaPolicy !== "opaque")) errors.push(`Direction-only concept ${concept.id} lacks reviewed raster policy`);
    }
  }
  for (const source of WORLD_SOURCE_ASSETS) if (!conceptIds.has(source.replacedBy)) errors.push(`Source ${source.id} has unresolved replacement ${source.replacedBy}`);
  const technicalIds = new Set();
  for (const reference of WORLD_TECHNICAL_ASSETS) {
    if (technicalIds.has(reference.id)) errors.push(`Duplicate technical reference: ${reference.id}`);
    technicalIds.add(reference.id);
    if (!reference.path || !reference.topologyPath || !reference.sha256 || !reference.topologySha256) errors.push(`Technical reference ${reference.id} lacks content-addressed files`);
    const { width, height } = reference.dimensions ?? {};
    if (!Number.isInteger(width) || !Number.isInteger(height) || Math.min(width, height) < 768 || Math.max(width, height) > 4096) errors.push(`Technical reference ${reference.id} has unexpected dimensions`);
    if (reference.approvalStatus !== "approved_2d_topology_reference" || reference.referenceScope !== "site_interior_circulation") errors.push(`Technical reference ${reference.id} overstates or obscures its accepted scope`);
    if (reference.runtimeBackdrop || reference.runtimeIntegrated || reference.productionAsset || reference.technicalReadiness) errors.push(`Technical reference ${reference.id} makes a false implementation claim`);
    if (reference.exactAtlasCoordinate !== null) errors.push(`Technical reference ${reference.id} claims an unreviewed atlas coordinate`);
    if (reference.coordinateSemantics !== "diagram_pixels_not_meters") errors.push(`Technical reference ${reference.id} obscures diagram-coordinate semantics`);
    if (reference.claims?.cells !== 5 || reference.claims?.internalOpenings !== 4 || reference.claims?.completeSeparateUtilities !== 2) errors.push(`Technical reference ${reference.id} lost reviewed topology claims`);
    if (!Array.isArray(reference.limitations) || reference.limitations.length < 3) errors.push(`Technical reference ${reference.id} lacks explicit non-authority boundaries`);
  }
  const spatialBlockoutIds = new Set();
  for (const reference of WORLD_SPATIAL_BLOCKOUT_ASSETS) {
    if (spatialBlockoutIds.has(reference.id)) errors.push(`Duplicate spatial blockout reference: ${reference.id}`);
    spatialBlockoutIds.add(reference.id);
    if (!/^spatial_blockout\./.test(reference.id) || !reference.waveId) errors.push(`Spatial blockout ${reference.id} lacks stable identity`);
    if (!Array.isArray(reference.siteIds) || reference.siteIds.length < 1 || new Set(reference.siteIds).size !== reference.siteIds.length) errors.push(`Spatial blockout ${reference.id} has invalid site bindings`);
    if (!Array.isArray(reference.environmentIds) || new Set(reference.environmentIds).size !== reference.environmentIds.length) errors.push(`Spatial blockout ${reference.id} has invalid environment bindings`);
    if (!reference.payloadPath || !reference.provenancePath || !/^[a-f0-9]{64}$/.test(reference.sha256) || !Number.isInteger(reference.bytes) || reference.bytes < 1) errors.push(`Spatial blockout ${reference.id} lacks content-addressed payload evidence`);
    for (const repositoryPath of [reference.indexPath, reference.payloadPath, reference.provenancePath, reference.schemaPath].filter(Boolean)) {
      if (repositoryPath.startsWith('/') || repositoryPath.includes('\\') || /^[A-Za-z]:/.test(repositoryPath) || repositoryPath.split('/').includes('..')) errors.push(`Spatial blockout ${reference.id} has a non-repository path`);
    }
    if (!reference.counts || reference.counts.sites !== reference.siteIds.length) errors.push(`Spatial blockout ${reference.id} has inconsistent site counts`);
    if (reference.sourceType === 'site_blockout_reference' && (!Number.isInteger(reference.schemaVersion) || !reference.schemaPath || !reference.indexPath)) errors.push(`Spatial blockout ${reference.id} lacks its site contract`);
    if (reference.authority !== 'independently_reviewed_noncanonical_reference') errors.push(`Spatial blockout ${reference.id} obscures its authority`);
    if (reference.runtimeIntegrated || reference.constructionReady || reference.productionGeometry || reference.staticScene || reference.animatedScene || reference.releaseReady) errors.push(`Spatial blockout ${reference.id} makes a false implementation claim`);
    if (!Array.isArray(reference.limitations) || reference.limitations.length < 2) errors.push(`Spatial blockout ${reference.id} lacks explicit nonclaims`);
  }
  return { valid: errors.length === 0, errors };
}
