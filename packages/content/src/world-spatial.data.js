import atlasJson from "../manifests/sable-reach.atlas-runtime.json" with { type: "json" };
import questWave04SpatialIndexJson from "../manifests/quest-wave-04-v11.spatial-index.json" with { type: "json" };

import { BESTIARY, ENEMY_FAMILIES } from "./bestiary.data.js";
import { EXPANSION_CREATURES, EXPANSION_QUESTS, NARRATIVE_TARGETS } from "./narrative.data.js";

const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
};

const unique = (values) => [...new Set(values)];
const unionField = (records, field) => unique(records.flatMap((record) => record[field] ?? []));
const rangeAcross = (records, field, fallback = [0, 1]) => records.length
  ? [Math.min(...records.map((record) => record[field][0])), Math.max(...records.map((record) => record[field][1]))]
  : fallback;

export const QUEST_WAVE_04_SPATIAL_INDEX = deepFreeze(questWave04SpatialIndexJson);

export const WORLD_SPATIAL_TARGETS = deepFreeze({
  schemaVersion: 1,
  authoredQuestCapacity: NARRATIVE_TARGETS.authoredQuestTarget,
  currentAcceptedQuestCount: EXPANSION_QUESTS.length,
  foundingCreatureFamilyCount: ENEMY_FAMILIES.length,
  foundingCreatureFormCount: BESTIARY.length,
  currentExpansionCreatureCount: EXPANSION_CREATURES.length,
  coordinatePolicy: "Use the canonical fictional engineering grid for atlas-fixed facts; never synthesize survey precision for an unplaced location.",
  placementPolicy: "Quest identity and spatial program may be canonical while its atlas coordinate remains provisional.",
});

export const SPATIAL_AUTHORITY_LEVELS = deepFreeze([
  {
    id: "canon",
    meaning: "Accepted GAME canon or an accepted modeled atlas fact.",
    coordinateRule: "May preserve exact modeled coordinates while retaining the atlas classification fictional_modeled_not_measured.",
  },
  {
    id: "authored_design_constraint",
    meaning: "A production constraint derived from canon for blockout, art, traversal, or encounter work.",
    coordinateRule: "May define ranges, capacities, relationships, and envelopes; it is not a surveyed fact.",
  },
  {
    id: "provisional_placement",
    meaning: "A location or boundary reserved for production but not yet fixed by the atlas coordinator.",
    coordinateRule: "Must not expose an invented exact atlas point; use a host region/site and a design envelope only.",
  },
  {
    id: "reference",
    meaning: "Human-readable or independently reviewed supporting material that explains an accepted constraint without becoming canon geometry.",
    coordinateRule: "May visualize relationships or diagram coordinates, but cannot establish surveyed/GIS placement, world meters, or runtime geometry.",
  },
]);

export const VEYL_PROJECTED_CRS = deepFreeze({
  id: atlasJson.coordinateReferenceSystem.id,
  name: "Veyl Local Engineering Grid v1",
  classification: atlasJson.classification,
  authorityCode: null,
  type: "engineering",
  axes: ["easting", "northing", "elevation"],
  horizontalUnit: "meters",
  verticalUnit: "meters",
  extent: atlasJson.extent,
  wkt: atlasJson.coordinateReferenceSystem.wkt,
  wktSha256: atlasJson.coordinateReferenceSystem.wktSha256,
  precisionNotice: "All positions describe a fictional modeled world. Values are design coordinates, not real-world observations or survey claims.",
  authority: "canon",
  maturity: "gis_valid",
});

const REGION_DESIGN = deepFreeze({
  "territory.veil-coast": {
    regionId: "veil_coast",
    elevationEnvelopeMeters: [-12, 80],
    landform: ["wind-cut marine shelf", "brackish estuary", "tidal flats", "black-coral shoal"],
    soils: [{ id: "marine_alluvium", drainage: "tidal", bearing: "poor", erosion: "bank-undercut and salt creep" }],
    hydrology: { streamIds: ["stream.reedward"], terminalIds: ["outlet.veil-estuary"], waterTable: "surface-coupled", floodPattern: "twice-daily tide plus storm surge" },
    weather: { precipitation: "salt rain and hard lateral squalls", wind: "persistent onshore with abrupt veil calms", thermalBandC: [-2, 13], seasonality: "storm-dominant; little dependable summer" },
    light: { baseline: "cold cyan overcast", occlusion: "dense moving veil", practicals: "hooded harbor bells and pearl-oil lamps", readableContrast: "wet silhouettes against pale surf" },
    senses: { visibilityMeters: [45, 900], acoustic: ["rigging knock", "undertow under stone", "distant quarantine bell"], scent: ["iodine", "wet rope", "brine rot", "lamp oil"] },
    traversal: { favored: ["raised causeway", "tide stair", "rope ferry"], hazards: ["tide cut", "suction silt", "salt glare", "false inland tide"] },
    materialLaw: ["salt-whitened timber", "black coral", "marine slate", "iron fasteners with green runout"],
    weatheringLaw: ["lower courses carry a hard tide line", "windward faces bleach", "metal stains run downward before they pit"],
  },
  "territory.dunmire": {
    regionId: "dunmire",
    elevationEnvelopeMeters: [-4, 90],
    landform: ["peat basin", "drowned parish shelves", "reed channels", "raised causeway islands"],
    soils: [{ id: "peat", drainage: "waterlogged", bearing: "very poor", erosion: "bank slough and subsidence" }],
    hydrology: { streamIds: ["stream.reedward"], terminalIds: ["outlet.dunmire-ward-pond", "outlet.dunmire-vestry-pond"], waterTable: "at or above grade", floodPattern: "slow seasonal rise with localized ceiling-flood anomalies" },
    weather: { precipitation: "steady rain, ground fog, and still-water condensation", wind: "low except along causeway gaps", thermalBandC: [1, 15], seasonality: "wet throughout; late cold locks shallow channels" },
    light: { baseline: "moonless teal-gray", occlusion: "reed walls and ground fog", practicals: "crooked guide lanterns", readableContrast: "warm pin lights reflected in blackwater" },
    senses: { visibilityMeters: [18, 420], acoustic: ["reed whisper", "hollow water lap", "submerged bell", "knock below the road"], scent: ["peat", "cold algae", "grave moss", "lamp oil rainbow"] },
    traversal: { favored: ["causeway crown", "flat mire boat", "reed mat"], hazards: ["hidden doorway", "soft shoulder", "uphill flood", "false reflection"] },
    materialLaw: ["sunk causeway block", "wet oak", "reed wicker", "submerged chapel slate"],
    weatheringLaw: ["masonry darkens upward from water", "timber bows before it breaks", "salt shelves form on still edges"],
  },
  "territory.graven-march": {
    regionId: "graven_march",
    elevationEnvelopeMeters: [70, 420],
    landform: ["slate upland", "black-pine occlusion basin", "cairn ridge", "ash road terrace"],
    soils: [{ id: "slate_and_grave_loam", drainage: "fast on ridge, perched at cairns", bearing: "good except ash pockets", erosion: "frost-shatter and trail gullying" }],
    hydrology: { streamIds: ["stream.bellwater"], terminalIds: ["outlet.bellwater"], waterTable: "deep except spring cuts", floodPattern: "brief snowmelt pulses" },
    weather: { precipitation: "ash-filtered drizzle and winter sleet", wind: "ridge gusts; dead calm under black pine", thermalBandC: [-8, 12], seasonality: "long hibernation winter with unreliable thaw" },
    light: { baseline: "ash-filtered moon and iron cloud", occlusion: "pine canopy and cairn shadow", practicals: "cairn candles and road lamps", readableContrast: "warm grave cracks against blue slate" },
    senses: { visibilityMeters: [30, 1200], acoustic: ["pine strain", "stone click", "delayed footfall", "absent birds"], scent: ["cold resin", "grave loam", "wet slate", "old ash"] },
    traversal: { favored: ["Bellwater Road", "Crown Road", "slate switchback"], hazards: ["warm cairn", "blank order post", "closed winter interval", "wrong-way hoof trace"] },
    materialLaw: ["split slate", "black pine", "flint shingle", "clay name tablet"],
    weatheringLaw: ["edges frost-spall", "lichen favors sheltered names", "repairs use visible timber splints and mismatched slate"],
  },
  "territory.hollow-abbey": {
    regionId: "hollow_abbey",
    elevationEnvelopeMeters: [20, 360],
    landform: ["karst shelf", "sink valley", "ossuary cave", "collapsed processional terrace"],
    soils: [{ id: "karst_limestone", drainage: "rapid into voids", bearing: "strong until undermined", erosion: "solution cavity and roof fall" }],
    hydrology: { streamIds: ["stream.abbey-sink"], terminalIds: ["outlet.south-karst"], waterTable: "discontinuous karst", floodPattern: "rain enters roof and disappears through tuned drains" },
    weather: { precipitation: "cold roof rain and cave condensation", wind: "vertical draw through broken nave", thermalBandC: [0, 11], seasonality: "interior climate stable; exterior eclipse storms" },
    light: { baseline: "eclipse shafts in deep neutral shadow", occlusion: "vault, dust, and rain", practicals: "resonant urns and low funeral candles", readableContrast: "silver rain against bone limestone" },
    senses: { visibilityMeters: [12, 600], acoustic: ["one-beat-late footstep", "urn pitch", "missing choir voice", "pressure silence"], scent: ["wet limestone", "grave wax", "old bronze", "fungal thread"] },
    traversal: { favored: ["processional step", "upper cloister", "crypt stair"], hazards: ["resonant floor", "sink edge", "delayed echo lure", "sealed exact-word gate"] },
    materialLaw: ["bone limestone", "verdigris bronze", "wet black flagstone", "rotted choir oak"],
    weatheringLaw: ["water follows carved doctrine", "scraped inscriptions remain as lighter scars", "bronze blooms green at resonant cracks"],
  },
  "territory.mirror-salt-waste": {
    regionId: "mirror_salt_waste",
    elevationEnvelopeMeters: [30, 260],
    landform: ["closed playa", "gypsum rib", "false-horizon pan", "brine-still shelf"],
    soils: [{ id: "salt_clay", drainage: "closed basin", bearing: "hard crust over weak brine", erosion: "wind scour and crust collapse" }],
    hydrology: { streamIds: ["stream.white-run"], terminalIds: ["outlet.mirror-salt-playa"], waterTable: "brine lens below crust", floodPattern: "rare sheet flood ending in mirrored pan" },
    weather: { precipitation: "rare white rain and abrasive salt wind", wind: "persistent directional shear", thermalBandC: [-5, 22], seasonality: "wide thermal swing; brief playa flooding" },
    light: { baseline: "pearl-gray glare without reliable compass shadow", occlusion: "salt veil and reflected horizon", practicals: "covered brine lamps", readableContrast: "dark travelers against pale ground" },
    senses: { visibilityMeters: [80, 2400], acoustic: ["salt hiss", "mirror tick", "distant route chime"], scent: ["gypsum dust", "hot brine", "dry lichen", "sealed wax"] },
    traversal: { favored: ["False Horizon Track", "compass-post arc", "caravan mat"], hazards: ["crust sink", "borrowed distance", "direction loss", "one-way refuge"] },
    materialLaw: ["salt clay", "gypsum", "sealed mirror glass", "cloth-wrapped timber"],
    weatheringLaw: ["leeward edges accrete white fins", "glass abrades matte except at touched routes", "iron is wax-sealed rather than exposed"],
  },
  "territory.cinderward": {
    regionId: "cinderward",
    elevationEnvelopeMeters: [100, 700],
    landform: ["ironstone ridge", "slag ravine", "glasswood rise", "foundry terrace"],
    soils: [{ id: "volcanic_ironstone", drainage: "fast except cistern cuts", bearing: "very good", erosion: "thermal fracture and slag slump" }],
    hydrology: { streamIds: [], terminalIds: ["outlet.east-cinder"], waterTable: "deep; condensate captured", floodPattern: "industrial runoff and quench surges" },
    weather: { precipitation: "dry ash fall with localized steam rain", wind: "stack-driven drafts and ridge crosswind", thermalBandC: [-4, 28], seasonality: "ambient cold; furnace microclimates persist" },
    light: { baseline: "ash-blue night", occlusion: "soot and iron gantry", practicals: "furnace mouths, vents, slag", readableContrast: "controlled orange heat inside cold black iron" },
    senses: { visibilityMeters: [25, 1100], acoustic: ["furnace inhale", "chain groan", "coolant hiss", "glasswood chime"], scent: ["iron scale", "hot slag", "quench steam", "soot fungus"] },
    traversal: { favored: ["Iron Spine Road", "gantry loop", "chain lift", "slag-gate bridge"], hazards: ["breathing furnace", "heat wash", "seized vent", "glasswood splinter"] },
    materialLaw: ["riveted iron plate", "cracked firebrick", "cooled slag glass", "soot stone"],
    weatheringLaw: ["heat bleaches radial fans", "soot preserves body-shaped voids", "quenched iron scales in layered plates"],
  },
});

const polygonBounds = (polygon) => ({
  minimumEasting: Math.min(...polygon.map(([easting]) => easting)),
  minimumNorthing: Math.min(...polygon.map(([, northing]) => northing)),
  maximumEasting: Math.max(...polygon.map(([easting]) => easting)),
  maximumNorthing: Math.max(...polygon.map(([, northing]) => northing)),
});

export const REGION_SPATIAL_PROFILES = deepFreeze(atlasJson.territories.map((territory) => ({
  id: territory.id,
  name: territory.name,
  code: territory.code,
  envelope: {
    coordinateSpaceId: VEYL_PROJECTED_CRS.id,
    polygon: territory.polygon,
    bounds: polygonBounds(territory.polygon),
    boundaryStatus: "atlas_fixed",
  },
  substrate: territory.substrate,
  ...REGION_DESIGN[territory.id],
  authority: { envelope: "canon", environment: "authored_design_constraint" },
  maturity: { atlas: "gis_valid", environment: "production_direction" },
})));

const SITE_ENVELOPE_DESIGN = deepFreeze({
  "site.hearthmere": { coreRadiusMeters: 192, influenceRadiusMeters: 640, verticalDesignMeters: 48, typologyIds: ["hearthmere_slate_tenant_house", "hearthmere_unlit_hospice", "hearthmere_bell_civic"], populationRange: [780, 1160] },
  "site.gloamharbor": { coreRadiusMeters: 176, influenceRadiusMeters: 720, verticalDesignMeters: 34, typologyIds: ["veil_coast_harbor_house"], populationRange: [410, 690] },
  "site.warden-reed": { coreRadiusMeters: 160, influenceRadiusMeters: 680, verticalDesignMeters: 24, typologyIds: ["dunmire_stilt_house", "dunmire_submerged_vestry"], populationRange: [330, 560] },
  "site.cairnmarket": { coreRadiusMeters: 176, influenceRadiusMeters: 760, verticalDesignMeters: 42, typologyIds: ["graven_cairn_hall", "graven_road_assize"], populationRange: [460, 740] },
  "site.hollow-abbey": { coreRadiusMeters: 256, influenceRadiusMeters: 960, verticalDesignMeters: 88, typologyIds: ["hollow_abbey_nave", "hollow_abbey_foundry"], populationRange: [0, 48] },
  "site.salt-watch": { coreRadiusMeters: 144, influenceRadiusMeters: 720, verticalDesignMeters: 28, typologyIds: ["salt_watch_caravan_house"], populationRange: [180, 330] },
  "site.ember-gate": { coreRadiusMeters: 208, influenceRadiusMeters: 800, verticalDesignMeters: 72, typologyIds: ["cinderward_furnace_dwelling", "cinderward_law_forge"], populationRange: [620, 980] },
  "site.sluice-chapel": { coreRadiusMeters: 112, influenceRadiusMeters: 320, verticalDesignMeters: 30, typologyIds: ["dunmire_submerged_vestry"], populationRange: [0, 12] },
  "site.pale-measure": { coreRadiusMeters: 96, influenceRadiusMeters: 280, verticalDesignMeters: 38, typologyIds: ["hollow_abbey_nave"], populationRange: [0, 8] },
  "site.anchor-field": { coreRadiusMeters: 128, influenceRadiusMeters: 460, verticalDesignMeters: 22, typologyIds: ["veil_coast_harbor_house"], populationRange: [0, 18] },
  "site.smothered-kiln": { coreRadiusMeters: 128, influenceRadiusMeters: 400, verticalDesignMeters: 62, typologyIds: ["cinderward_law_forge"], populationRange: [0, 22] },
  "site.white-meridian": { coreRadiusMeters: 112, influenceRadiusMeters: 520, verticalDesignMeters: 30, typologyIds: ["salt_watch_caravan_house"], populationRange: [0, 20] },
});

export const SITE_SPATIAL_ENVELOPES = deepFreeze(atlasJson.sites.map((site) => {
  const design = SITE_ENVELOPE_DESIGN[site.id];
  const [easting, northing, elevation] = site.coordinate;
  return {
    id: site.id,
    name: site.name,
    kind: site.kind,
    territoryId: site.territoryId,
    atlasAnchor: { coordinateSpaceId: VEYL_PROJECTED_CRS.id, coordinate: site.coordinate, authority: "canon", placementStatus: site.placementStatus },
    designEnvelope: {
      shape: "radial_influence_not_boundary",
      coreRadiusMeters: design.coreRadiusMeters,
      influenceRadiusMeters: design.influenceRadiusMeters,
      verticalRangeMeters: [elevation - Math.round(design.verticalDesignMeters / 3), elevation + design.verticalDesignMeters],
      bounds: {
        minimumEasting: easting - design.influenceRadiusMeters,
        minimumNorthing: northing - design.influenceRadiusMeters,
        maximumEasting: easting + design.influenceRadiusMeters,
        maximumNorthing: northing + design.influenceRadiusMeters,
      },
      authority: "authored_design_constraint",
      boundaryStatus: "provisional_not_cadastral",
    },
    productionStatus: site.productionStatus,
    typologyIds: design.typologyIds,
    populationRange: design.populationRange,
    waterSource: site.waterSource ?? null,
    access: site.access ?? null,
    subsistence: site.subsistence ?? null,
    industry: site.industry ?? null,
    burialPractice: site.burialPractice ?? null,
    governance: site.governance ?? null,
  };
}));

export const TRAVERSAL_SURFACE_PROFILES = deepFreeze([
  { id: "slate_road", tags: ["slate", "road"], baseCostMultiplier: 1, wetCostMultiplier: 1.12, cartMultiplier: 1.08, sound: "hard footfall", scent: "rain on slate", clearanceMeters: 3.5 },
  { id: "oak_reed_causeway", tags: ["oak_and_reed", "causeway"], baseCostMultiplier: 1.22, wetCostMultiplier: 1.48, cartMultiplier: 1.65, sound: "hollow timber report", scent: "wet reed and pitch", clearanceMeters: 2.8 },
  { id: "limestone_step", tags: ["limestone", "trail"], baseCostMultiplier: 1.3, wetCostMultiplier: 1.58, cartMultiplier: null, sound: "late stone echo", scent: "wet lime", clearanceMeters: 1.8 },
  { id: "ironstone_road", tags: ["ironstone", "road"], baseCostMultiplier: 1.06, wetCostMultiplier: 1.12, cartMultiplier: 1.18, sound: "metallic grit", scent: "iron dust", clearanceMeters: 3.8 },
  { id: "salt_clay_track", tags: ["salt_clay", "trail"], baseCostMultiplier: 1.28, wetCostMultiplier: 2.4, cartMultiplier: 1.7, sound: "crust shear", scent: "brine dust", clearanceMeters: 4.2 },
  { id: "peat_mire", tags: ["peat", "offroad"], baseCostMultiplier: 1.85, wetCostMultiplier: 2.35, cartMultiplier: null, sound: "suction step", scent: "opened peat", clearanceMeters: 1.2 },
  { id: "karst_interior", tags: ["karst_limestone", "interior"], baseCostMultiplier: 1.35, wetCostMultiplier: 1.62, cartMultiplier: null, sound: "resonant stone", scent: "mineral damp", clearanceMeters: 1.5 },
  { id: "living_interior", tags: ["charnel", "interior_mobile"], baseCostMultiplier: 1.5, wetCostMultiplier: 1.5, cartMultiplier: null, sound: "structural breath", scent: "nacre, rain, and warm iron", clearanceMeters: 1.4 },
]);

const surfaceForRoute = (route) => TRAVERSAL_SURFACE_PROFILES.find((profile) => profile.tags.includes(route.surface))?.id ?? null;

export const TRAVERSAL_NETWORK = deepFreeze(atlasJson.routes.flatMap((route) => route.sections.map((section) => ({
  id: section.id,
  routeId: route.id,
  routeName: route.name,
  class: route.class,
  surfaceProfileId: surfaceForRoute(route),
  fromSiteId: section.fromSiteId,
  toSiteId: section.toSiteId,
  modeledPolyline: section.coordinates,
  modeledLengthMeters: section.lengthMeters,
  modeledWalkingSeconds: section.walkingSeconds,
  crossingIds: atlasJson.bridges.filter((bridge) => bridge.routeSectionId === section.id).map((bridge) => bridge.id),
  historicalReason: route.historicalReason,
  authority: "canon",
  maturity: "gis_valid_not_production_geometry",
}))));

export const SENSOR_FIELD_PROFILES = deepFreeze(REGION_SPATIAL_PROFILES.map((region) => ({
  id: `sensor.${region.regionId}`,
  territoryId: region.id,
  visibility: {
    baselineMeters: region.senses.visibilityMeters,
    occluders: unique([...region.landform, region.light.occlusion]),
    contrastRule: region.light.readableContrast,
  },
  acoustic: {
    emitters: region.senses.acoustic,
    propagation: region.substrate === "peat" ? "absorbed_low_with_waterborne_spikes" : region.substrate === "karst_limestone" ? "long_delayed_reflection" : "wind_and_structure_dependent",
    masking: [region.weather.precipitation, region.weather.wind],
  },
  scent: {
    emitters: region.senses.scent,
    transport: region.substrate === "marine_alluvium" ? "tidal_and_onshore" : region.substrate === "peat" ? "low_ground_and_waterborne" : "wind_and_thermal_plume",
  },
  authority: "authored_design_constraint",
})));

const FAMILY_SPATIAL_LAW = deepFreeze({
  ashbound: { microhabitats: ["burned tenancy threshold", "name-rack ash", "warm ruin lee"], exclusions: ["continuous deep water"], cue: "paper, soot, and jointed ledger silhouettes interrupt warm fog", acoustic: "dry page scrape under ember hiss", scent: "cold soot and fired clay" },
  cairn_beasts: { microhabitats: ["warm cairn edge", "black-pine den", "closed winter road"], exclusions: ["open tidal flat"], cue: "stone mass carries residual grave heat", acoustic: "pebble clicks and chest-stone sub-bass", scent: "lichen, warmed slate, and wet fur" },
  march_deserters: { microhabitats: ["blank order post", "bannerless road cut", "collapsed trench"], exclusions: ["trackless deep mire"], cue: "military spacing without heraldry", acoustic: "sealed paper, absent cadence, dragged pike", scent: "wax, old cloth, and wet iron" },
  drowned_parish: { microhabitats: ["submerged nave", "vestry roof", "blackwater aisle"], exclusions: ["dry high ridge"], cue: "architecture and bodies share a waterline", acoustic: "hymn below water and timber knock", scent: "algae, wax, and drowned slate" },
  reed_coven: { microhabitats: ["reed wall", "charm island", "fog channel"], exclusions: ["bare salt pan"], cue: "knotted reeds move against ambient wind", acoustic: "borrowed whisper and wicker tick", scent: "cut reed, peat smoke, and pale salt" },
  kilnforged: { microhabitats: ["furnace throat", "slag gate", "chain-lift shadow"], exclusions: ["deep standing water"], cue: "heat-bearing silhouette against cold foundry", acoustic: "plate strain and furnace breath", scent: "hot iron, quench steam, and clinker" },
  glasswood: { microhabitats: ["slag-root seam", "reflection grove", "abandoned ore cut"], exclusions: ["soft peat"], cue: "hard black growth splits orange industrial light", acoustic: "glass chime with animal cadence", scent: "ozone, hot sap, and mineral dust" },
  hush_order: { microhabitats: ["mute aisle", "exact-word gate", "vow archive"], exclusions: ["uncontrolled market noise"], cue: "cloth and blade align around deliberately empty sound space", acoustic: "removed syllable and broom on stone", scent: "dust, inkless vellum, and grave wax" },
  echo_choir: { microhabitats: ["resonant urn field", "choir vault", "delayed rain ring"], exclusions: ["sound-dead peat"], cue: "forms answer architecture one beat late", acoustic: "layered interval with one missing source", scent: "wet bronze, urn dust, and rain lichen" },
  ossuary_vermin: { microhabitats: ["bone drawer", "crypt spoil", "cairn breach"], exclusions: ["salt-flooded exterior"], cue: "small silhouettes assemble from accountable remains", acoustic: "tooth click and dry joint spill", scent: "bone dust, grave soil, and old linen" },
  bell_revenants: { microhabitats: ["bell road", "abandoned belfry", "memory-clapper route"], exclusions: ["acoustically isolated void"], cue: "rope, bronze, and absent tower geometry", acoustic: "toll whose return is spatially displaced", scent: "verdigris, rope tar, and rain" },
  salt_waste: { microhabitats: ["false horizon", "mirror-salt camp", "compass-post arc"], exclusions: ["enclosed low-ceiling interior"], cue: "directional organs break the pale horizon", acoustic: "salt hiss and sealed mirror tick", scent: "gypsum, brine wax, and dry cloth" },
  veil_coast: { microhabitats: ["reef shelf", "tide causeway", "black-coral salvage"], exclusions: ["high dry upland"], cue: "gill, rope, and coral shapes read through surf", acoustic: "wet rigging and undertow percussion", scent: "iodine, fish oil, and wet rope" },
  shuttered_ward: { microhabitats: ["abandoned ward", "wet-plaster corridor", "bed threshold"], exclusions: ["open unroofed salt pan"], cue: "care architecture behaves before the body does", acoustic: "curtain rings, sheet drag, restrained breathing", scent: "wax, wet plaster, and bitter herb" },
  charnel_measures: { microhabitats: ["grave survey", "limestone warehouse", "body-scale registry"], exclusions: ["unstructured open water"], cue: "measurement tools and anatomy share load paths", acoustic: "plumb line, drawer knock, and tally rasp", scent: "lime, grave soil, and black nacre" },
  black_sluice: { microhabitats: ["culvert mouth", "ceiling-flood room", "masonry gutter"], exclusions: ["dry exposed ridge"], cue: "reflections lead the body upstream", acoustic: "reverse drain and ceiling drip", scent: "silt, cold brick, and blackwater" },
  last_pest_cart: { microhabitats: ["quarantine road", "causeway lay-by", "erased destination"], exclusions: ["roadless crypt chamber"], cue: "vehicle anatomy persists without a complete ordinary vehicle", acoustic: "unaxled wheel and waxed harness", scent: "road dust, plague wax, and damp canvas" },
  breath_tithe: { microhabitats: ["smelter exhaust", "slag stair", "vent court"], exclusions: ["clean windward coast"], cue: "respiratory machinery meters visible pressure", acoustic: "assessed exhale and sleeve scrape", scent: "hot slag, iron, and spent breath" },
  white_ague: { microhabitats: ["white meridian", "gypsum hollow", "destinationless pan"], exclusions: ["dense wet forest"], cue: "orientation fails around a hard pale silhouette", acoustic: "dry compass scrape and horizon hum", scent: "salt dust, gypsum, and sealed skin" },
  pallid_root_communion: { microhabitats: ["grave-root seam", "orchard below", "cemetery edge"], exclusions: ["sterile slag floor"], cue: "root networks visibly negotiate bone and soil", acoustic: "root tension and cap spore breath", scent: "grave loam, pale fungus, and wet limestone" },
  anchored_quarantine: { microhabitats: ["anchor field", "estuary fleet shadow", "quarantine buoy line"], exclusions: ["landlocked high ridge"], cue: "nautical mass is held by an impossible shared anchor", acoustic: "hawser strain and hull knock without sea room", scent: "tar, brine, wet iron, and quarantine smoke" },
});

export const FAMILY_HABITAT_ENVELOPES = deepFreeze(ENEMY_FAMILIES.map((family) => {
  const forms = BESTIARY.filter((creature) => creature.familyId === family.id);
  const profiles = forms.map((creature) => creature.habitatProfile);
  const law = FAMILY_SPATIAL_LAW[family.id];
  return {
    familyId: family.id,
    familyName: family.name,
    formIds: forms.map((creature) => creature.id),
    territoryIds: unionField(profiles, "territoryIds"),
    siteIds: unionField(profiles, "siteIds"),
    habitatIds: unionField(profiles, "habitatIds"),
    environmentalEnvelope: {
      elevationMeters: rangeAcross(profiles, "elevationMeters"),
      slopeNormalized: rangeAcross(profiles, "slopeNormalized"),
      moistureNormalized: rangeAcross(profiles, "moistureNormalized"),
      corruptionNormalized: rangeAcross(profiles, "corruptionNormalized"),
      substrates: unique([...unionField(profiles, "substrates"), ...((family.habitat?.substrates) ?? [])]),
      canonicalFamilyConstraint: family.habitat,
    },
    activityModes: unique(profiles.map((profile) => profile.activity)),
    populationEnvelope: {
      perEncounter: [Math.min(...profiles.map((profile) => profile.population.minimum)), Math.max(...profiles.map((profile) => profile.population.maximum))],
      clustering: unique(profiles.map((profile) => profile.population.clustering)),
    },
    microhabitats: law.microhabitats,
    exclusions: unique([...law.exclusions, ...profiles.flatMap((profile) => profile.exclusions)]),
    sensorySignature: { visibilityCue: law.cue, acoustic: law.acoustic, scent: law.scent },
    authority: {
      identityAndCanonicalRange: "canon",
      productionEnvelope: "authored_design_constraint",
    },
    maturity: "habitat_valid",
  };
}));

const EXPANSION_FAMILY_ENVELOPES = deepFreeze({
  lucent_procession: {
    territoryIds: ["territory.graven-march", "territory.hollow-abbey", "territory.cinderward"],
    siteIds: ["site.hearthmere", "site.hollow-abbey", "site.ember-gate"],
    habitatIds: ["habitat.graven-upland", "habitat.karst-crypt", "habitat.cinder-ridge"],
    spatialMode: "processional_route_and_restoration_site",
    microhabitats: ["repaired facade", "cathedral threshold", "artificial noon corridor"],
    environmentalLimits: ["requires a witnessed rule or restoration target", "leaves a high-contrast lawful approach lane"],
    acoustic: "precise metal, held note, and an absence where a human answer should fall",
    scent: "cold stone, hot gold, and clean rain",
  },
  charnel_households: {
    territoryIds: ["territory.dunmire", "territory.graven-march", "territory.hollow-abbey"],
    siteIds: [],
    habitatIds: ["habitat.drowned-mire", "habitat.graven-upland", "habitat.karst-crypt"],
    spatialMode: "mobile_living_interior_and_revocable_threshold",
    microhabitats: ["rib doorway", "refugee route", "living civic chamber"],
    environmentalLimits: ["must preserve a readable entry and exit relation", "horror anatomy carries a protective social function"],
    acoustic: "structural breath, wet latch, and displaced interior distance",
    scent: "black nacre, warm iron, rain, and lived-in cloth",
  },
  remaining_ecologies: {
    territoryIds: atlasJson.territories.map((territory) => territory.id),
    siteIds: atlasJson.sites.filter((site) => site.kind === "settlement").map((site) => site.id),
    habitatIds: atlasJson.habitats.map((habitat) => habitat.id),
    spatialMode: "civic_edge_and_adapted_ecology",
    microhabitats: ["maintained road margin", "disputed field", "unclaimed burial route"],
    environmentalLimits: ["persists outside combat through a named service or ecological exchange", "keeps a non-factional escape route"],
    acoustic: "weather, work tools, and creature-specific warning cadence",
    scent: "local soil plus maintained oil, cloth, or seed",
  },
  noon_wound_ecologies: {
    territoryIds: ["territory.graven-march"],
    siteIds: ["site.hearthmere"],
    habitatIds: ["habitat.graven-upland"],
    spatialMode: "restored_building_and_shadow_refuge_edge",
    microhabitats: ["misremembered tenancy", "census light boundary", "repaired wall with an excluded history"],
    environmentalLimits: ["requires conflicting occupancy evidence", "must show the restoration rule changing physical access"],
    acoustic: "hinge replay, paper dust, and light-muted wingbeat",
    scent: "new plaster over old soot and dry paper",
  },
  lucent_propagules: {
    territoryIds: ["territory.graven-march"],
    siteIds: ["site.hearthmere"],
    habitatIds: ["habitat.graven-upland"],
    spatialMode: "breath_and_masonry_seed_corridor",
    microhabitats: ["gutter seam", "shared breath route", "repaired garden wall"],
    environmentalLimits: ["propagation route must connect organism, building, and accountable custodian", "no anonymous decorative vine field"],
    acoustic: "small hooks aligning through a shared inhale",
    scent: "ozone, white sap, and damp mortar",
  },
  charnel_weather: {
    territoryIds: atlasJson.territories.map((territory) => territory.id),
    siteIds: [],
    habitatIds: atlasJson.habitats.map((habitat) => habitat.id),
    spatialMode: "migrating_atmospheric_body",
    microhabitats: ["roofless settlement", "storm appeal field", "named drought recipient"],
    environmentalLimits: ["benefit and downstream cost must be visible in the same composition", "weather body remains spatially accountable"],
    acoustic: "rafter breath, valve turn, and displaced rain",
    scent: "wet timber, nacre, and first rain on dry soil",
  },
  dawn_engine_symbionts: {
    territoryIds: ["territory.cinderward"],
    siteIds: ["site.ember-gate", "site.smothered-kiln"],
    habitatIds: ["habitat.cinder-ridge"],
    spatialMode: "maintenance_ring_and_dependency_chamber",
    microhabitats: ["service gasket", "shutdown chamber", "artificial noon ring"],
    environmentalLimits: ["maintenance access remains legible", "excluded dependency is a spatially distinct seat"],
    acoustic: "incomplete service chord under machine pressure",
    scent: "hot gasket, bell bronze, and quench steam",
  },
  cairn_beasts: {
    territoryIds: ["territory.graven-march"],
    siteIds: ["site.cairnmarket"],
    habitatIds: ["habitat.graven-upland"],
    spatialMode: "seasonal_hibernation_basin",
    microhabitats: ["black-pine occlusion", "unused winter road", "warm cairn den"],
    environmentalLimits: ["requires a complete no-footfall interval", "grave heat is contextual, not transferred as a prop"],
    acoustic: "stone chest cadence and a held cold note",
    scent: "cold lichen, black pine, and warmed slate",
  },
  dunmire_reflections: {
    territoryIds: ["territory.dunmire"],
    siteIds: ["site.warden-reed", "site.sluice-chapel"],
    habitatIds: ["habitat.drowned-mire"],
    spatialMode: "upstream_reflection_and_maintained_room",
    microhabitats: ["sluice room", "ceiling flood", "family route confluence"],
    environmentalLimits: ["real and reflected room doors remain jointly readable", "water may move uphill only as an authored supernatural state"],
    acoustic: "reverse drain, household maintenance, and reflected knock",
    scent: "pitch water, wet brick, and heirloom wood",
  },
  salt_waste_brood: {
    territoryIds: ["territory.mirror-salt-waste"],
    siteIds: ["site.salt-watch", "site.white-meridian"],
    habitatIds: ["habitat.mirror-playa"],
    spatialMode: "migratory_false_horizon_nursery",
    microhabitats: ["mirror womb", "uncompassed landscape", "refugee destination debt"],
    environmentalLimits: ["every horizon is a reachable or refused destination", "direction is anatomy rather than interface annotation"],
    acoustic: "salt crust, organ hum, and distant route chime",
    scent: "brine wax, gypsum, and warm mirror glass",
  },
});

const EXPANSION_CREATURE_MICROHABITATS = deepFreeze({
  apse_seraph: ["collapsed worship threshold", "settlement survey line"],
  misericord_of_borrowed_pain: ["hospice approach", "battlefield convalescent row"],
  noon_bailiff: ["flat-shadow warrant court", "repaired civic facade"],
  unbroken_note_engine: ["stopped village belfry", "artificial-noon service ring"],
  reliquary_of_the_last_breath: ["plague hospice archive", "last-breath cradle chamber"],
  gold_shutter_penitent: ["processional roadhead", "measured dawn exposure lane"],
  door_lung_courser: ["sanctuary approach road", "revocable rib crossing"],
  reverse_rib_bride: ["treaty threshold", "two-position vow court"],
  throat_orchard: ["mute amphitheatre", "warning grove inside a living polity"],
  jointless_advocate: ["precedent hearing", "exception-marked boundary"],
  mercy_eater: ["refugee healing perimeter", "interior predator passage"],
  corridor_maw: ["restrained front-line mouth", "unconsumed interior path"],
  shutter_stag: ["twilight strip", "shutter migration crossing"],
  rain_notary: ["bridge truce shelter", "storm witness route"],
  witness_crab: ["tidal testimony grave", "disaster debris line"],
  acre_that_walks: ["famine field boundary", "shared harvest corridor"],
  funeral_kite: ["pauper burial road", "unclaimed-name updraft"],
  ember_midwife: ["ash adaptation nursery", "threat-conditioned cocoon site"],
  deed_eater_wren: ["restored tenant house", "obsolete deed cavity"],
  shadow_census_moth: ["double census queue", "shuttered lamp perimeter"],
  lumen_tithe_burr: ["breath-and-gutter seedfront", "custody corridor"],
  threshold_lamb: ["hundred rib-door passage", "child-safe exit rehearsal"],
  eave_lung: ["migrating storm roof", "named drought leak"],
  veto_gasket_choir: ["seven-ring maintenance array", "unseated dependency chamber"],
  tenancy_aureole: ["orchard of second births", "rotating legal threshold"],
  weather_edict_widow: ["open-sky appeal field", "contradictory exposure tower"],
  arrear_seraph: ["unelapsed maintenance minute", "rusted infrastructure interval"],
  contrition_oculus: ["cathedral of rehearsed dawns", "refusal horizon"],
  appetite_bailiff: ["fear exchange", "restraint lot"],
  unsounded_host: ["moving vote road", "formal vacancy horizon"],
  winter_cairn_choir: ["black-pine occlusion basin", "unused public road"],
  sluice_son: ["uphill drowning genealogy", "reflected household room"],
  elsewhere_calf: ["false-horizon nursery", "route-debt refuge"],
});

const questIdsByCreature = new Map(EXPANSION_CREATURES.map((creature) => [
  creature.id,
  EXPANSION_QUESTS.filter((quest) => quest.creatureIds.includes(creature.id)).map((quest) => quest.id),
]));
const questWave04HabitatByCreatureId = new Map(QUEST_WAVE_04_SPATIAL_INDEX.creatureHabitatEnvelopes.map((entry) => [entry.creatureId, entry]));
const questWave04EnvironmentByQuestId = new Map(QUEST_WAVE_04_SPATIAL_INDEX.environmentPrograms.map((entry) => [entry.questId, entry]));

export const EXPANSION_CREATURE_HABITAT_ENVELOPES = deepFreeze(EXPANSION_CREATURES.map((creature) => {
  const questHabitat = questWave04HabitatByCreatureId.get(creature.id);
  if (questHabitat) {
    const environment = questWave04EnvironmentByQuestId.get(questHabitat.questId);
    const territoryIds = questHabitat.regionIds ?? environment?.territoryIds ?? [];
    const siteIds = unique([
      ...(questHabitat.siteId ? [questHabitat.siteId] : []),
      ...(questHabitat.siteCells ?? []).map((cell) => cell.split(":")[0]),
      ...(environment?.hostSiteId ? [environment.hostSiteId] : []),
    ]);
    const population = questHabitat.population;
    const exactCount = questHabitat.exactBodyCount;
    const localCount = Number.isInteger(exactCount)
      ? [exactCount, exactCount]
      : [population?.minimum ?? 1, population?.maximum ?? 1];
    const regionSenses = REGION_DESIGN[territoryIds[0]]?.senses;
    return {
      creatureId: creature.id,
      creatureName: creature.name,
      familyId: creature.familyId,
      territoryIds,
      siteIds,
      habitatIds: [questHabitat.habitatId ?? questHabitat.id],
      spatialMode: questHabitat.recordKind ?? questHabitat.lifecycleState ?? "quest_bound_authored_habitat",
      microhabitats: questHabitat.siteCells ?? questHabitat.semanticAnchorIds ?? [environment?.locationId].filter(Boolean),
      environmentalLimits: questHabitat.exclusions ?? questHabitat.excluded ?? questHabitat.required ?? [],
      populationEnvelope: {
        localCount,
        clustering: population?.uniqueness ?? population?.densityRule ?? population?.ontology ?? questHabitat.lifecycleState ?? "quest_bound_population",
        authority: "authored_design_constraint",
      },
      activity: questHabitat.anchorBehavior ?? questHabitat.lifecycleState,
      locomotionConstraint: creature.locomotion,
      sensorySignature: {
        visualCue: creature.mechanic.cue,
        acoustic: creature.sound,
        scent: regionSenses?.scent?.join(", ") ?? "",
      },
      canonicalQuestIds: questIdsByCreature.get(creature.id),
      placement: { status: "provisional_placement", exactCoordinate: null },
      sourceHabitatId: questHabitat.habitatId ?? questHabitat.id,
      fullWorldContractPath: QUEST_WAVE_04_SPATIAL_INDEX.fullWorldContractPath,
      authority: { identityAndEcology: "canon", spatialEnvelope: "authored_design_constraint", atlasPlacement: "provisional_placement" },
    };
  }
  const family = EXPANSION_FAMILY_ENVELOPES[creature.familyId];
  const uniquePopulation = ["boss", "miniboss"].includes(creature.rank);
  return {
    creatureId: creature.id,
    creatureName: creature.name,
    familyId: creature.familyId,
    territoryIds: family.territoryIds,
    siteIds: family.siteIds,
    habitatIds: family.habitatIds,
    spatialMode: family.spatialMode,
    microhabitats: unique([...family.microhabitats, ...(EXPANSION_CREATURE_MICROHABITATS[creature.id] ?? [])]),
    environmentalLimits: family.environmentalLimits,
    populationEnvelope: {
      localCount: uniquePopulation ? [1, 1] : creature.rank === "elite" ? [1, 3] : creature.rank === "specialist" ? [1, 4] : [2, 8],
      clustering: uniquePopulation ? "unique_setpiece_or_solitary" : "ecology_dependent_population",
      authority: "authored_design_constraint",
    },
    activity: creature.ecology,
    locomotionConstraint: creature.locomotion,
    sensorySignature: {
      visualCue: creature.mechanic.cue,
      acoustic: creature.sound ?? family.acoustic,
      scent: family.scent,
    },
    canonicalQuestIds: questIdsByCreature.get(creature.id),
    placement: { status: "provisional_placement", exactCoordinate: null },
    authority: { identityAndEcology: "canon", spatialEnvelope: "authored_design_constraint", atlasPlacement: "provisional_placement" },
  };
}));

const edge = (from, to, thresholdId, access = "openable") => ({ from, to, thresholdId, access });
const building = (id, name, territoryIds, footprintMeters, stories, structure, exteriorMaterials, weathering, roof, utilities, rooms, edges, thresholds, propFamilies, traversalRules) => ({
  id,
  name,
  territoryIds,
  footprintMeters,
  stories,
  structure,
  exteriorMaterials,
  weathering,
  roof,
  utilities,
  roomGraph: { rooms, edges },
  thresholds: edges.map((roomEdge) => thresholds.find((threshold) => threshold.id === roomEdge.thresholdId) ?? ({
    id: roomEdge.thresholdId,
    rule: `${roomEdge.access} circulation threshold; retain readable clearance and state.`,
  })),
  propFamilies,
  traversalRules,
  authority: "authored_design_constraint",
  maturity: "blockout_ready_not_production_geometry",
});

export const BUILDING_TYPOLOGIES = deepFreeze([
  building(
    "hearthmere_slate_tenant_house", "Hearthmere slate tenant house", ["territory.graven-march"], [6, 12], [1, 2],
    "black-pine cruck frame inside repaired slate load walls", ["wet split slate", "dark oak", "clay name tablets", "patched lime"],
    ["visible mismatched repair courses", "rain-dark lower slate", "soot fan above shared hearth", "doorframes preserve prior tenant heights"], "steep slate with spring-rill gutter",
    { water: "shared spring rill and rain barrel", heat: "banked common hearth", waste: "sealed ash crock", light: "oil shutter and hearth bounce" },
    ["street_threshold", "work_kitchen", "shared_hearth", "sleep_loft", "name_alcove", "rear_service_yard"],
    [edge("street_threshold", "work_kitchen", "door.street"), edge("work_kitchen", "shared_hearth", "arch.hearth"), edge("shared_hearth", "sleep_loft", "ladder.loft"), edge("shared_hearth", "name_alcove", "shutter.names"), edge("work_kitchen", "rear_service_yard", "door.service")],
    [{ id: "door.street", rule: "opens inward behind a rain break" }, { id: "shutter.names", rule: "private evidence threshold; never decorative" }, { id: "door.service", rule: "wide enough for handcart repair" }],
    ["clay_name_rack", "banked_brazier", "rain_barrel_iron", "traveller_splint_bench", "peat_drying_rack"],
    ["one public-to-private turn", "one rear maintenance exit", "upper floor never blocks the only egress"],
  ),
  building(
    "hearthmere_unlit_hospice", "Unlit Hospice ward house", ["territory.graven-march"], [18, 30], [1, 2],
    "slate plinth, black-pine frame, and adaptable living wall grafts", ["washed slate", "dark timber", "unbleached linen", "copper drain"],
    ["hand-height polish at bed turns", "repair seams remain dated by material", "no sacred white cleanliness"], "broad slate roof with controlled rain court",
    { water: "spring header with visible isolation valves", heat: "zoned flue and warming stones", waste: "separate ash and contaminated wash route", light: "low reflected lanterns; no compulsory glare" },
    ["receiving", "consent_room", "six_bed_ward", "living_heart_gallery", "memory_ward", "wash_room", "herb_store", "appeal_courtyard", "mortuary_exit"],
    [edge("receiving", "consent_room", "door.consent"), edge("consent_room", "six_bed_ward", "threshold.ward"), edge("six_bed_ward", "living_heart_gallery", "track.beds"), edge("six_bed_ward", "memory_ward", "door.memory"), edge("six_bed_ward", "wash_room", "door.wash"), edge("wash_room", "herb_store", "hatch.herb"), edge("six_bed_ward", "appeal_courtyard", "door.appeal"), edge("memory_ward", "mortuary_exit", "door.mortuary")],
    [{ id: "door.consent", rule: "conversation before clinical visibility" }, { id: "track.beds", rule: "six bed routes remain independently readable" }, { id: "door.appeal", rule: "patient-controlled exterior exit" }],
    ["rolling_bed", "memory_thread_frame", "herb_drying_frame", "covered_instrument_tray", "patient_property_box"],
    ["bed route minimum 1.8 meters", "staff shortcut never bypasses consent room", "appeal courtyard is visible from every ward route"],
  ),
  building(
    "hearthmere_bell_civic", "Hearthmere bell-and-ledger civic house", ["territory.graven-march"], [12, 22], [2, 4],
    "slate civic base with splinted timber bell frame", ["wet slate", "bell bronze", "black pine", "clay docket tile"],
    ["bell vibration opens hairline lime cracks", "public steps wear unevenly toward service desks", "new repairs never erase old names"], "open bell yoke over steep civic roof",
    { water: "spring cistern at ground court", heat: "public brazier court", waste: "clay-sealed civic drain", light: "bell-floor lantern cage" },
    ["public_steps", "ledger_hall", "lamp_store", "bell_stair", "bell_floor", "council_gallery", "archive_vault", "rear_maintenance_lane"],
    [edge("public_steps", "ledger_hall", "door.public"), edge("ledger_hall", "lamp_store", "gate.issue"), edge("ledger_hall", "bell_stair", "door.stair"), edge("bell_stair", "bell_floor", "hatch.bell"), edge("ledger_hall", "council_gallery", "rail.hearing"), edge("ledger_hall", "archive_vault", "door.archive"), edge("lamp_store", "rear_maintenance_lane", "door.maintenance")],
    [{ id: "rail.hearing", rule: "separates speakers without hiding them" }, { id: "door.archive", rule: "two-witness latch" }, { id: "door.maintenance", rule: "wide seven-lamp service route" }],
    ["clay_name_rack", "lamp_service_bench", "bell_rope_small", "ration_scale", "blank_address_plate"],
    ["public loop and service loop intersect once", "bell stair supplies vertical landmark", "archive has two accountable approaches"],
  ),
  building(
    "veil_coast_harbor_house", "Veil Coast harbor-bell house", ["territory.veil-coast"], [7, 16], [1, 3],
    "salt timber frame pinned to marine-slate plinth", ["salt-whitened oak", "black coral", "marine slate", "tarred sailcloth"],
    ["windward boards bleach", "iron runs green", "tide line remains continuous across repairs"], "steep tied roof with removable storm panels",
    { water: "veil cistern", heat: "covered peat stove", waste: "ebb-timed sealed chute", light: "hooded pearl-oil lamp" },
    ["tide_stair", "rope_room", "common_room", "dry_loft", "bell_balcony", "storm_cellar"],
    [edge("tide_stair", "rope_room", "door.tide"), edge("rope_room", "common_room", "door.inner"), edge("common_room", "dry_loft", "ladder.dry"), edge("dry_loft", "bell_balcony", "hatch.bell"), edge("common_room", "storm_cellar", "hatch.storm")],
    [{ id: "door.tide", rule: "opens above current tide line" }, { id: "hatch.storm", rule: "counterweighted for one-person use" }],
    ["salt_rope_coil", "eel_weir_tool", "weighted_sailcloth", "pearl_oil_lamp", "black_coral_salvage"],
    ["vertical refuge above surge", "tide stair readable from offshore", "no dead-end below flood line"],
  ),
  building(
    "dunmire_stilt_house", "Dunmire causeway stilt house", ["territory.dunmire"], [6, 14], [1, 2],
    "oak-and-reed frame on mismatched stone and driven timber piles", ["wet oak", "reed mat", "sunk chapel slate", "pitch cloth"],
    ["pile settlement produces deliberate lean", "waterline algae records flood history", "wicker repairs are newer and lighter"], "low reed roof tied for flood release",
    { water: "raised rain cistern", heat: "peat box stove", waste: "sealed reed cage above flood", light: "guide-lantern hook" },
    ["causeway_step", "mud_room", "family_room", "cistern_loft", "boat_hatch", "reed_work_balcony"],
    [edge("causeway_step", "mud_room", "door.road"), edge("mud_room", "family_room", "door.dry"), edge("family_room", "cistern_loft", "ladder.cistern"), edge("family_room", "boat_hatch", "hatch.water"), edge("family_room", "reed_work_balcony", "door.balcony")],
    [{ id: "door.road", rule: "threshold remains above modeled ordinary flood" }, { id: "hatch.water", rule: "rescue exit, never furniture-blocked" }],
    ["reed_grain_bin", "mudfish_creel", "guide_lantern", "peat_drying_rack", "family_route_board"],
    ["causeway and boat exits form a loop", "upper refuge holds whole household", "reflected and real doors must not overlap visually"],
  ),
  building(
    "dunmire_submerged_vestry", "Drowned parish vestry", ["territory.dunmire"], [10, 24], [1, 3],
    "limestone parish shell undermined by peat and water", ["submerged slate", "algae stone", "dark oak", "salt shelf"],
    ["one continuous historic waterline", "roof peaks remain navigational islands", "mosaic survives only below scoured hand height"], "broken steep nave roof with exposed belfry frame",
    { water: "uncontrolled blackwater with maintained sluice pockets", heat: "none", waste: "historic crypt drains reversed", light: "external guide lantern reflection" },
    ["roof_landing", "drowned_nave", "vestry", "sluice_room", "crypt_door", "belfry_frame"],
    [edge("roof_landing", "drowned_nave", "break.roof"), edge("drowned_nave", "vestry", "arch.vestry"), edge("vestry", "sluice_room", "door.sluice"), edge("drowned_nave", "crypt_door", "stair.submerged"), edge("roof_landing", "belfry_frame", "ladder.bell")],
    [{ id: "door.sluice", rule: "real and reflected leaves can open together" }, { id: "stair.submerged", rule: "water route with visible return air pocket" }],
    ["drowned_bell_rope", "floating_pew", "chapel_key_chain", "waterlogged_record_box", "sluice_tool"],
    ["surface, submerged, and roof paths remain distinct", "every underwater room has a readable air or exit contract", "bell frame is a long-range landmark"],
  ),
  building(
    "graven_cairn_hall", "Graven March cairn hall", ["territory.graven-march"], [9, 18], [1, 2],
    "dry-stacked slate around black-pine tie beams", ["warm cairn stone", "black pine", "flint shingle", "grave lichen"],
    ["handled stones remain warmer and cleaner", "winter moss stops at opened family courses", "windward joints pack with ash"], "low flint-shingle roof with smoke notch",
    { water: "snowmelt tank", heat: "central grave-safe brazier", waste: "ash trench", light: "cairn candle niches" },
    ["road_apron", "oath_circle", "market_bay", "family_cairn_gallery", "winter_store", "rear_den_gate"],
    [edge("road_apron", "oath_circle", "door.oath"), edge("oath_circle", "market_bay", "arch.market"), edge("oath_circle", "family_cairn_gallery", "gate.cairn"), edge("market_bay", "winter_store", "door.store"), edge("family_cairn_gallery", "rear_den_gate", "gate.den")],
    [{ id: "gate.cairn", rule: "opened once per winter under witnessed custody" }, { id: "gate.den", rule: "seasonal wildlife interval overrides public access" }],
    ["cairn_bowl", "blank_map_marker", "black_rye_sack", "lichen_drying_frame", "pack_harness"],
    ["public road can close without sealing residents", "animal winter route crosses no active hearth", "oath circle supports a visible audience ring"],
  ),
  building(
    "graven_road_assize", "Countryless road assize", ["territory.graven-march"], [14, 28], [1, 2],
    "open slate court with movable timber jurisdiction frames", ["split slate", "bare black pine", "ash trays", "unmarked iron"],
    ["chair wear records who was admitted", "ash deposits stay materially distinct", "frames carry reversible latch scars"], "partial canopy leaving sky and road visible",
    { water: "covered witness jars", heat: "perimeter braziers", waste: "ash handled as evidence", light: "neutral open sky plus low lamps" },
    ["road_entry", "witness_ring", "three_ash_chairs", "living_gallery", "evidence_bay", "appeal_exit"],
    [edge("road_entry", "witness_ring", "gate.jurisdiction"), edge("witness_ring", "three_ash_chairs", "rail.dead"), edge("witness_ring", "living_gallery", "rail.living"), edge("witness_ring", "evidence_bay", "gate.evidence"), edge("witness_ring", "appeal_exit", "door.appeal")],
    [{ id: "gate.jurisdiction", rule: "movable and visibly revocable" }, { id: "rail.dead", rule: "three deposits never merge" }, { id: "door.appeal", rule: "remains unlocked during verdict" }],
    ["ash_council_tray", "blank_chair", "grave_tithe_box", "road_chain_post", "witness_lantern"],
    ["three testimony positions maintain separate sightlines", "road remains a functioning route around the hearing", "failure changes evidence placement rather than resetting"],
  ),
  building(
    "cinderward_furnace_dwelling", "Cinderward furnace dwelling", ["territory.cinderward"], [7, 15], [2, 4],
    "firebrick party walls and riveted iron floor frames", ["firebrick", "iron plate", "cooled slag glass", "soot plaster"],
    ["thermal expansion cracks radiate from shared flues", "quench streaks are pale", "address plates migrate independently of doors"], "iron-rib roof with condensate hood",
    { water: "condensate header", heat: "shared furnace flue with cutoff", waste: "slag-sealed chute", light: "vent glow and shielded ember lamp" },
    ["address_threshold", "work_room", "heat_gallery", "sleep_cell", "condensate_room", "civic_function_slot", "fire_escape_gantry"],
    [edge("address_threshold", "work_room", "door.address"), edge("work_room", "heat_gallery", "gate.heat"), edge("heat_gallery", "sleep_cell", "door.sleep"), edge("work_room", "condensate_room", "door.water"), edge("work_room", "civic_function_slot", "plate.function"), edge("heat_gallery", "fire_escape_gantry", "hatch.escape")],
    [{ id: "door.address", rule: "physical opening and civic address are separate systems" }, { id: "gate.heat", rule: "visible cutoff owned by occupants" }, { id: "hatch.escape", rule: "opens away from furnace draw" }],
    ["address_plate", "quench_bucket", "slag_niche", "flue_tool", "function_ledger"],
    ["every dwelling has two heat-separated exits", "address transfer remains visually traceable", "gantry connects without crossing furnace mouth"],
  ),
  building(
    "cinderward_law_forge", "Cinderward law forge and dawn-service hall", ["territory.cinderward"], [28, 60], [2, 7],
    "massive ironstone base, firebrick pressure cores, and riveted gantry frame", ["black iron", "cracked firebrick", "bell bronze", "cooled slag glass"],
    ["service paths are hand-polished", "expired seals remain visible but blank", "thermal scars identify prior shutdowns"], "stack crown and retractable service shutters",
    { water: "redundant quench cisterns", heat: "isolated furnace loops", waste: "cooled slag canal", light: "artificial noon rings with manual dark windows" },
    ["ore_entry", "law_forge_floor", "three_shutdown_bays", "seven_service_rings", "dependency_chamber", "quench_gallery", "veto_floor", "maintenance_exit"],
    [edge("ore_entry", "law_forge_floor", "gate.ore"), edge("law_forge_floor", "three_shutdown_bays", "rail.test"), edge("law_forge_floor", "seven_service_rings", "lift.rings"), edge("seven_service_rings", "dependency_chamber", "seal.dependency"), edge("dependency_chamber", "veto_floor", "door.quorum"), edge("law_forge_floor", "quench_gallery", "bridge.quench"), edge("quench_gallery", "maintenance_exit", "gate.service")],
    [{ id: "rail.test", rule: "three disasters remain concurrently visible" }, { id: "seal.dependency", rule: "can be opened without disabling all rings" }, { id: "gate.service", rule: "manual egress survives total power loss" }],
    ["blank_ballot_seal", "veto_gasket", "service_clock", "quench_wheel", "shutdown_handle", "maintenance_ledger"],
    ["three independent test loops", "seven ring lines never collapse into decorative concentric circles", "manual maintenance path survives every authored phase"],
  ),
  building(
    "hollow_abbey_nave", "Hollow Abbey mute nave", ["territory.hollow-abbey"], [30, 72], [2, 6],
    "karst limestone basilica shell with bronze resonant ties", ["bone limestone", "wet black flagstone", "verdigris bronze", "rotted oak"],
    ["rain traces carved doctrine", "tongue removals remain chisel scars", "resonant cracks carry green bronze bloom"], "broken high vault open to eclipse rain",
    { water: "roof rain basins and karst drains", heat: "isolated candle and worker braziers", waste: "ossuary sorting and sealed wash", light: "eclipse shaft, candles, resonant urn glow" },
    ["processional_steps", "mute_nave", "side_aisles", "upper_cloister", "resonant_urn_field", "exact_word_gate", "crypt_descent", "ossuary_drawers"],
    [edge("processional_steps", "mute_nave", "gate.nave"), edge("mute_nave", "side_aisles", "arches.aisle"), edge("side_aisles", "upper_cloister", "stairs.cloister"), edge("mute_nave", "resonant_urn_field", "rail.urn"), edge("mute_nave", "exact_word_gate", "gate.exact"), edge("resonant_urn_field", "crypt_descent", "stair.crypt"), edge("crypt_descent", "ossuary_drawers", "door.ossuary")],
    [{ id: "gate.exact", rule: "opens only to authored exact-word state; never generic key" }, { id: "rail.urn", rule: "urn pitches remain spatially separable" }, { id: "stair.crypt", rule: "descent visible from main encounter lane" }],
    ["resonant_urn", "rain_catch_basin", "empty_tongue_reliquary", "memory_tablet", "clapper_chain"],
    ["central, aisle, upper, and crypt routes form distinct loops", "rain and delayed echo show depth", "no decorative readable text"],
  ),
  building(
    "hollow_abbey_foundry", "Foundry of Borrowed Quiet", ["territory.hollow-abbey"], [22, 46], [2, 5],
    "limestone casting hall reinforced with bronze silence frames", ["sooted limestone", "bell bronze", "blackwater quench tile", "dark oak"],
    ["hammer wear is visible without musical notation", "quiet rooms show use through untouched dust edges", "creditor cracks remain named only in data, not baked text"], "rain-open casting lantern with seven acoustic baffles",
    { water: "blackwater quench circuit", heat: "bell furnace with manual dampers", waste: "slag and wax separated", light: "furnace bounce plus narrow roof rain" },
    ["material_receiving", "molten_bell_floor", "seven_silence_rooms", "ripple_gallery", "wage_archive", "cooling_vault", "funeral_exit"],
    [edge("material_receiving", "molten_bell_floor", "gate.charge"), edge("molten_bell_floor", "seven_silence_rooms", "spokes.silence"), edge("molten_bell_floor", "ripple_gallery", "rail.ripple"), edge("ripple_gallery", "wage_archive", "door.wage"), edge("molten_bell_floor", "cooling_vault", "gate.cool"), edge("cooling_vault", "funeral_exit", "door.funeral")],
    [{ id: "spokes.silence", rule: "seven rooms remain simultaneously legible and non-musical" }, { id: "rail.ripple", rule: "deaf-worker sightline to blackwater" }, { id: "door.funeral", rule: "advance-funeral route never crosses molten floor" }],
    ["bell_mold", "blackwater_ripple_tray", "future_silence_room", "wage_token", "cooling_tool"],
    ["operation order is spatially fixed by cooling physics", "failure cracks point to a creditor station", "all worker exits remain visible from furnace control"],
  ),
  building(
    "salt_watch_caravan_house", "Salt Watch caravan and brine-still house", ["territory.mirror-salt-waste"], [8, 20], [1, 2],
    "gypsum-block wind wall around flexible cloth-and-timber rooms", ["gypsum", "salt clay", "wax-sealed mirror", "wrapped timber"],
    ["leeward salt fins grow", "touched mirror paths stay glossy", "windward cloth receives layered patches"], "low tied canopy behind a high wind wall",
    { water: "covered brine still", heat: "sunless evaporation hearth", waste: "dry sealed latrine", light: "hooded brine lamp and reflected sky" },
    ["track_entry", "wind_lock", "caravan_common", "brine_still", "mirror_nursery", "sleep_cells", "route_debt_exit"],
    [edge("track_entry", "wind_lock", "door.wind"), edge("wind_lock", "caravan_common", "curtain.salt"), edge("caravan_common", "brine_still", "door.still"), edge("caravan_common", "mirror_nursery", "seal.mirror"), edge("caravan_common", "sleep_cells", "curtains.sleep"), edge("mirror_nursery", "route_debt_exit", "gate.horizon")],
    [{ id: "door.wind", rule: "two-stage wind lock" }, { id: "seal.mirror", rule: "gestational mirror cannot be treated as decorative glazing" }, { id: "gate.horizon", rule: "shows a destination but no compass label" }],
    ["brine_still", "compass_post_blank", "waxed_mirror_wrap", "caravan_store", "lichen_cake_rack"],
    ["horizon sightline survives every room", "nursery has two accountable claimant approaches", "false destination route is one-way only when quest state requires"],
  ),
  building(
    "lucent_processional_cathedral", "Lucent processional cathedral", ["territory.graven-march", "territory.hollow-abbey"], [36, 84], [3, 9],
    "impossibly precise pale stone armature bound in restrained gold", ["cold ivory stone", "thin gold seam", "black shutter cloth", "clear repair glass"],
    ["restored faces are too exact beside materially older occupancy", "gold remains narrow and structural", "refusal thresholds interrupt symmetry"], "folding horizon vault and measured oculus",
    { water: "purified rain in visible return channels", heat: "regulated noon panels", waste: "classified and hidden by doctrine until exposed", light: "cold raking white-gold with physically reachable shutters" },
    ["mortal_forecourt", "processional_axis", "six_horizon_aisles", "refusal_thresholds", "witness_gallery", "pressure_vessel_crypt", "service_dark"],
    [edge("mortal_forecourt", "processional_axis", "gate.admission"), edge("processional_axis", "six_horizon_aisles", "arches.horizon"), edge("six_horizon_aisles", "refusal_thresholds", "doors.refusal"), edge("processional_axis", "witness_gallery", "rail.witness"), edge("refusal_thresholds", "pressure_vessel_crypt", "seal.pressure"), edge("six_horizon_aisles", "service_dark", "shutter.service")],
    [{ id: "gate.admission", rule: "entry classification is visible and contestable" }, { id: "doors.refusal", rule: "benefit remains materially possible after refusal" }, { id: "shutter.service", rule: "manual dark route contradicts apparent perfection" }],
    ["blank_reliquary", "gold_shutter", "witness_seat", "service_latch", "refusal_marker_unwritten"],
    ["beauty preserves coercive sightline", "service dark connects every miracle bay", "symmetry breaks only where a named refusal or prior harm requires"],
  ),
  building(
    "charnel_living_interior", "Charnel living civic interior", ["territory.dunmire", "territory.graven-march", "territory.hollow-abbey"], [20, 90], [1, 6],
    "load-bearing black nacre ribs, living membranes, and ordinary resident repairs", ["black nacre", "dark wet cartilage", "worn domestic timber", "patched tenant cloth"],
    ["handled latches polish", "resident patches age independently of host tissue", "healed seams remain legible"], "mobile rib canopy with accountable exterior openings",
    { water: "condensed weather and named leak route", heat: "host circulation with resident shutoff", waste: "separate civic and host return channels", light: "borrowed weather, hand lamps, and revocable rib apertures" },
    ["outer_threshold", "rib_street", "resident_ward", "vote_chamber", "artery_service_route", "host_boundary", "revocable_exit"],
    [edge("outer_threshold", "rib_street", "door.rib"), edge("rib_street", "resident_ward", "door.tenant"), edge("rib_street", "vote_chamber", "arch.vote"), edge("resident_ward", "artery_service_route", "hatch.service"), edge("artery_service_route", "host_boundary", "valve.host"), edge("vote_chamber", "revocable_exit", "door.exit")],
    [{ id: "door.rib", rule: "entry and exit sides remain unambiguous" }, { id: "door.tenant", rule: "host protection never substitutes for resident consent" }, { id: "door.exit", rule: "can be revoked by the represented resident, not only the host" }],
    ["ordinary_chair", "tenant_patch", "rain_cistern", "vote_weight", "service_latch", "family_meal_table"],
    ["domestic scale interrupts horror scale", "every protected ward owns an exit question", "interior route changes can alter information without deleting whole neighborhoods"],
  ),
]);

const SITE_ACTIVITY_DESIGN = deepFreeze({
  "site.hearthmere": {
    populationKinds: ["spring households", "hospice patients and carers", "lamplighters", "bell and bronze workers", "road refugees"],
    cycles: [
      { phase: "pre_dawn", activity: ["spring channels cleared", "hospice night appeals", "braziers banked"], density: "sparse_service" },
      { phase: "dawn", activity: ["water and bread distribution", "name tablets fired", "road arrivals counted"], density: "hub_peak" },
      { phase: "late_day", activity: ["market repair", "bell-bronze work", "ward visiting"], density: "distributed_busy" },
      { phase: "dusk", activity: ["seven-lamp maintenance", "vigil assembly", "gate ration audit"], density: "route_peak" },
      { phase: "deep_night", activity: ["shadow-refuge patrol", "quiet hospice transfer", "spring-watch"], density: "sparse_guarded" },
    ],
    persistentStorySignals: ["ration queue length", "which facades retain shadows", "number and route of civic lamps", "hospice appeal beds"],
  },
  "site.gloamharbor": {
    populationKinds: ["eel-weir crews", "salt-rope makers", "black-coral salvagers", "quarantine bell keepers", "tide pilots"],
    cycles: [
      { phase: "ebb", activity: ["weirs emptied", "salvage paths open", "weighted burials depart"], density: "shore_peak" },
      { phase: "slack_water", activity: ["rope market", "cistern draw", "quarantine claims"], density: "harbor_peak" },
      { phase: "flood_tide", activity: ["upper walks used", "storm panels tied", "ferries suspended"], density: "vertical_refuge" },
      { phase: "night", activity: ["bell compact watch", "pearl lamps hooded", "reef listening"], density: "sparse_watch" },
    ],
    persistentStorySignals: ["tide line on inhabited walls", "which fleet shadows share an anchor", "quarantine smoke color", "bell access roster"],
  },
  "site.warden-reed": {
    populationKinds: ["causeway wardens", "reed-grain farmers", "peat cutters", "lamp-oil workers", "mudfish households"],
    cycles: [
      { phase: "first_light", activity: ["causeway sections sounded", "rain cisterns opened", "fish cages checked"], density: "route_peak" },
      { phase: "day", activity: ["reed cutting", "peat drying", "causeway repair"], density: "distributed_work" },
      { phase: "fog_fall", activity: ["guide lanterns lit", "boats recalled", "flood rooms inspected"], density: "threshold_peak" },
      { phase: "night", activity: ["sluice watch", "reed-cage funerals", "knock listening"], density: "sparse_watch" },
    ],
    persistentStorySignals: ["causeway ownership marks", "water moving uphill", "which family routes are maintained", "lantern count"],
  },
  "site.cairnmarket": {
    populationKinds: ["goat and pack handlers", "slate cutters", "grave-lichen gatherers", "oath brokers", "winter road keepers"],
    cycles: [
      { phase: "cold_morning", activity: ["snowmelt tanks measured", "pack stock fed", "cairn heat checked"], density: "yard_peak" },
      { phase: "market_day", activity: ["slate and lichen exchange", "road claims heard", "winter closures posted without text"], density: "court_peak" },
      { phase: "dusk", activity: ["family cairns visited", "road chains set", "animal corridors cleared"], density: "ridge_routes" },
      { phase: "winter_night", activity: ["market closes", "hibernation interval protected", "warm stone watched"], density: "deliberate_absence" },
    ],
    persistentStorySignals: ["unused-road frost", "public access chain position", "cairn den disturbance", "pack-route detours"],
  },
  "site.hollow-abbey": {
    populationKinds: ["pilgrims", "deaf bellwrights", "ossuary workers", "root tenders", "unclaimed echoes"],
    cycles: [
      { phase: "roof_rain", activity: ["basins placed", "urn pitches checked", "karst drains cleared"], density: "aisle_work" },
      { phase: "eclipse_high", activity: ["processional routes open", "archive hearings", "upper cloister traversal"], density: "nave_peak" },
      { phase: "quiet_shift", activity: ["bell casting", "future-silence escrow", "ossuary sorting"], density: "specialist_cells" },
      { phase: "absolute_silence", activity: ["all hammering ceases", "crypt routes change", "echo entities active"], density: "deliberate_absence" },
    ],
    persistentStorySignals: ["which exact-word gates are open", "creditor crack locations", "urn pitch distribution", "rain route through doctrine"],
  },
  "site.salt-watch": {
    populationKinds: ["brine-still keepers", "caravan stores", "mirror-salt cutters", "compass-post tenders", "route-debt witnesses"],
    cycles: [
      { phase: "cold_glare", activity: ["stills uncovered", "tracks sounded", "false horizons compared"], density: "perimeter_work" },
      { phase: "wind_peak", activity: ["caravans shelter", "cloth walls retied", "mirror work stops"], density: "interior_peak" },
      { phase: "long_shadow", activity: ["route departures", "destination debts heard", "brine lamps lit"], density: "track_peak" },
      { phase: "white_night", activity: ["compass keeper rotates", "nursery mirrors covered", "crust watch"], density: "sparse_watch" },
    ],
    persistentStorySignals: ["post arc around playa", "one-way refuge horizons", "mirror-womb custody", "caravan refusal route"],
  },
  "site.ember-gate": {
    populationKinds: ["furnace allotment households", "ironstone miners", "kiln-glass workers", "condensate keepers", "shutdown technicians"],
    cycles: [
      { phase: "cold_shift", activity: ["condensate galleries opened", "slag canals sounded", "furnace law posted through hardware state"], density: "service_peak" },
      { phase: "furnace_inhale", activity: ["ore movement pauses", "gantry lanes clear", "pressure cues watched"], density: "controlled_absence" },
      { phase: "hot_shift", activity: ["casting", "glasswood cutting", "address-function work"], density: "industrial_peak" },
      { phase: "quench_window", activity: ["service rings darken", "cisterns discharge", "maintenance votes meet"], density: "maintenance_peak" },
      { phase: "ash_night", activity: ["street fire watch", "flue patrol", "fungus vault distribution"], density: "district_routes" },
    ],
    persistentStorySignals: ["which address owns a civic function", "shutdown owner route", "expired maintenance seals", "burn scar distribution"],
  },
  "site.sluice-chapel": {
    populationKinds: ["temporary sluice crews", "flood witnesses", "reflection researchers"],
    cycles: [
      { phase: "low_water", activity: ["roof landing exposed", "sluice duty performed", "memory rooms inspected"], density: "small_crew" },
      { phase: "high_water", activity: ["exterior abandoned", "ceiling flood observed", "boat hatch staffed"], density: "interior_refuge" },
      { phase: "unmaintained", activity: ["no planned presence", "reflection ecology active"], density: "deliberate_absence" },
    ],
    persistentStorySignals: ["real-reflected door alignment", "maintained surname route", "guest-room water level"],
  },
  "site.pale-measure": {
    populationKinds: ["rare survey teams", "ossuary claimants", "measure entities"],
    cycles: [
      { phase: "survey_window", activity: ["limestone datum checked", "drawers opened", "load paths recorded"], density: "small_crew" },
      { phase: "closed", activity: ["human access withdrawn", "measure ecologies move"], density: "deliberate_absence" },
    ],
    persistentStorySignals: ["which body-scale datum is current", "drawer displacement", "plumb-line route"],
  },
  "site.anchor-field": {
    populationKinds: ["quarantine salvagers", "harbor witnesses", "temporary cordon crews"],
    cycles: [
      { phase: "ebb", activity: ["anchors exposed", "hawser condition checked", "fleet shadows counted"], density: "shore_crew" },
      { phase: "flood", activity: ["field withdrawn", "buoy line watched from height"], density: "sparse_watch" },
    ],
    persistentStorySignals: ["shared anchor tension", "fleet shadow count", "cordon route"],
  },
  "site.smothered-kiln": {
    populationKinds: ["maintenance expeditions", "slag salvagers", "breath-tithe observers"],
    cycles: [
      { phase: "vent_calm", activity: ["kiln entered", "service seals inspected", "slag sampled"], density: "small_crew" },
      { phase: "pressure_rise", activity: ["human withdrawal", "vent tells watched remotely"], density: "deliberate_absence" },
    ],
    persistentStorySignals: ["breath assessment hardware", "sealed service route", "pressure stain"],
  },
  "site.white-meridian": {
    populationKinds: ["route witnesses", "salt-ague observers", "temporary caravan refuge"],
    cycles: [
      { phase: "stable_horizon", activity: ["post arc checked", "crust route opened", "mirror sheaths aired"], density: "small_crew" },
      { phase: "direction_loss", activity: ["routes close", "witness shelters occupied", "destination forms active"], density: "shelter_cluster" },
    ],
    persistentStorySignals: ["directional failure arc", "refuge occupancy", "sealed mirror orientation"],
  },
});

export const SITE_ACTIVITY_CYCLES = deepFreeze(SITE_SPATIAL_ENVELOPES.map((site) => ({
  siteId: site.id,
  residentPopulationRange: site.populationRange,
  ...SITE_ACTIVITY_DESIGN[site.id],
  authority: "authored_design_constraint",
  maturity: "simulation_contract_not_spawn_schedule",
})));

export const ENVIRONMENTAL_STORYTELLING_LAWS = deepFreeze({
  global: [
    "Every set carries at least three readable time layers: old-world intention, survival repair, and current faction or civic pressure.",
    "A prop that owns testimony, custody, access, debt, or consent receives a stable semantic anchor; it is not anonymous clutter.",
    "Player outcomes alter routes, maintenance states, admission boundaries, ecology, or evidence placement—not only banners or color grading.",
    "Repairs remain additive and materially legible. New work never erases the silhouette of the harm it addresses.",
    "No baked text, labels, arrows, UI, logos, or heraldic shorthand substitutes for spatial state. Information is carried by topology, wear, light, sound, occupancy, and prop state.",
    "Environmental horror must retain a service, ecology, household, or political function outside combat.",
  ],
  evidenceStack: [
    { order: 1, id: "substrate_and_deep_history", placement: "terrain, foundations, buried routes" },
    { order: 2, id: "failed_institution", placement: "civic geometry, ritual hardware, abandoned utilities" },
    { order: 3, id: "ordinary_survival", placement: "repairs, food, water, beds, work tools, informal paths" },
    { order: 4, id: "current_dispute", placement: "revocable thresholds, queues, moved functions, ecology boundaries" },
    { order: 5, id: "player_consequence", placement: "persistent route, access, population, material, and maintenance changes" },
  ],
  regionalApplications: REGION_SPATIAL_PROFILES.map((region) => ({
    territoryId: region.id,
    deepHistoryMaterials: [region.substrate, ...region.materialLaw.slice(0, 2)],
    survivalWeathering: region.weatheringLaw,
    currentConflictSurfaces: region.traversal.hazards,
    senseEvidence: region.senses,
  })),
});

export const ENVIRONMENT_ART_DIRECTION = deepFreeze({
  globalLaws: [
    "Grounded stylized dark-fantasy production design with physically plausible load, drainage, access, repair, and use.",
    "The world is decayed and dying, but still inhabited and maintained; avoid empty ruin tourism.",
    "Cold desaturated atmosphere dominates. Warmth is scarce, local, and tied to an accountable service or danger.",
    "Lucent spaces are angelic, precise, pale, and beautiful with narrow restrained gold; coercion appears as admission geometry, symmetry, classification, and light that cannot stop.",
    "Charnel spaces are horrifying black-nacre living architecture; protection, household use, exits, repairs, and civic life remain visibly real.",
    "Remaining Hands spaces foreground work, repair, rationing, weather, and contested access without heroic heraldry.",
    "Third-person traversal, encounter lanes, landmark hierarchy, cover, return routes, and vertical access must read in one view.",
    "No floating concept-art debris, purposeless spikes, impossible stairs, decorative machinery, generic castle language, or unexplained monumental scale.",
    "No text, captions, labels, maps, arrows, logos, watermarks, interface, frame, or presentation board.",
  ],
  composition: {
    camera: "human third-person eye or slightly elevated production keyframe",
    landmarkCount: [1, 3],
    routeHierarchy: ["primary readable route", "risk or service route", "return/shortcut route"],
    scaleEvidence: ["ordinary doors", "stairs with believable rise", "workers or residents", "handrails or bed/cart clearances"],
    valueStructure: "near-black mass, cold midtone structure, restrained practical accent",
  },
  acceptedVisualReferences: [
    { id: "concept_hearthmere_hold", path: "assets/world/hearthmere-hold.png", sha256: "7f17a219ef090f7d3c20e22ab24275a9c39483c4d3c89a8297ef4ef006258b3c", status: "approved_direction", use: ["hub layout", "wet slate", "warm spring contrast", "layered routes"] },
    { id: "concept_dunmire_causeway", path: "assets/world/dunmire-causeway.png", sha256: "f5f7d5c22da1cb175bfc9da6777ba05c9092f60d6c813b92c4c46b6633f99702", status: "approved_direction", use: ["causeway composition", "blackwater", "guide lights", "drowned architecture"] },
    { id: "concept_cinderward_foundry", path: "assets/world/cinderward-foundry.png", sha256: "37de3ab742e5368998d6a215ebaa4b96fccfe1d15aeb73e02e5a8b4936c077fa", status: "approved_direction", use: ["industrial verticality", "cold/heat contrast", "shortcut loops", "furnace arena"] },
    { id: "concept_hollow_abbey_nave", path: "assets/world/hollow-abbey-nave.png", sha256: "d79488872142049443b55ef98532470d632dba9bd9ae5e90ba02bd8403e7bc3b", status: "approved_direction", use: ["nave lanes", "eclipse rain", "upper traversal", "resonant urn field"] },
    { id: "concept_graven_march_black_pine_occlusion_basin", path: "assets/world/graven-march-black-pine-occlusion-basin-v5.png", sha256: "8b756803451bbd6893c445a36303c9a7b0b4c0736b98c0d64e4204f777ab9b76", status: "approved_direction", referenceScope: "regional_quest_location", locationId: "graven_march_black_pine_occlusion_basin", exactCoordinate: null, runtimeBackdrop: true, productionAsset: false, use: ["basin topology", "winter road closure", "ecological absence", "five black-pine shadow bands"] },
    { id: "concept_cathedral_six_rehearsed_dawns", path: "assets/world/cathedral-six-rehearsed-dawns-v2.png", sha256: "5c2ab84059a4e62234f5c63fdfaffa9eb226ebe1d3ea11d53a2dea26cd11221c", status: "approved_direction", referenceScope: "quest_location", locationId: "cathedral_of_six_rehearsed_dawns", exactCoordinate: null, runtimeBackdrop: false, productionAsset: false, use: ["six refusal bays", "Lucent material law", "arrested-contact hand canopy", "service-release circulation"] },
    {
      id: "concept_warden_reed_four_bank_visibility_exterior",
      path: "assets/world/warden-reed-four-bank-visibility-exterior-v1.png",
      sha256: "52d94e5252c7f4935772daaa970b58668ea82746491a969d0cad616403eaf17e",
      status: "approved_direction",
      referenceScope: "site_quest_location_exterior",
      siteId: "site.warden-reed",
      locationId: "warden_reed_four_bank_visibility",
      questId: "regional_the_fog_came_to_collect_our_outlines",
      exactCoordinate: null,
      runtimeBackdrop: false,
      runtimeIntegrated: false,
      productionAsset: false,
      provenancePath: "assets/world/world-environments.current.batch-02.provenance.json",
      promptPacketPath: "assets/world/prompts/world-environments.current.batch-02.prompt-packets.json",
      visualReviewBoundary: "Approved exterior art direction only; visual review does not validate GIS placement, machine-blockout topology, construction, runtime behavior, or production geometry.",
      use: ["four-bank settlement identity", "independent dry and boat circulation", "fog-band wayfinding", "occupied wetland utilities", "escrow-frame silhouette"],
    },
    {
      id: "concept_warden_reed_stilt_service_house_interior",
      path: "assets/world/warden-reed-stilt-service-house-interior-v1.png",
      sha256: "5494c36be429b7a76b2f2857059cce8a28a495fa23bc27a2e405adf950037089",
      status: "approved_direction",
      referenceScope: "site_service_house_interior",
      siteId: "site.warden-reed",
      locationId: "warden_reed_four_bank_visibility",
      questId: "regional_the_fog_came_to_collect_our_outlines",
      exactCoordinate: null,
      runtimeBackdrop: false,
      runtimeIntegrated: false,
      productionAsset: false,
      provenancePath: "assets/world/world-environments.current.batch-02.provenance.json",
      promptPacketPath: "assets/world/prompts/world-environments.current.batch-02.prompt-packets.json",
      visualReviewBoundary: "Approved interior art direction only; visual review does not certify room dimensions, egress, utilities, construction, runtime behavior, or production geometry.",
      use: ["occupied service-house identity", "causeway-to-boat circulation loop", "ledger-work zoning", "accountable household utilities", "fog-fall interior lighting"],
    },
    {
      id: "concept_hollow_abbey_processional_west_arrival",
      path: "assets/world/hollow-abbey-processional-west-arrival-v1.png",
      sha256: "e10cf6c4e1469d23f49f0fc38ebb49d0dad51f490b1f8bf23c1c2e82ced72e29",
      status: "approved_direction",
      referenceScope: "site_arrival_exterior",
      siteId: "site.hollow-abbey",
      routeId: "route.processional-steps",
      locationId: "hollow_abbey_processional_and_mute_nave",
      questId: "main_a_litany_unspoken",
      landmarkIds: ["abbey_gate"],
      exactCoordinate: null,
      runtimeBackdrop: false,
      runtimeIntegrated: false,
      productionAsset: false,
      provenancePath: "assets/world/world-environments.current.batch-03.provenance.json",
      promptPacketPath: "assets/world/prompts/world-environments.current.batch-03.prompt-packets.json",
      visualReviewBoundary: "Approved arrival, route hierarchy, material continuity, framing, and forbidden-content direction only; facade massing, stairs, measurements, GIS placement, construction, runtime behavior, and production geometry remain illustrative.",
      use: ["west processional arrival", "Exact-Word gate hierarchy", "high-shelf loop rejoin", "lower onward route toward Salt Watch", "rain-wet karst material identity"],
    },
    {
      id: "concept_hollow_abbey_mute_nave_route_read",
      path: "assets/world/hollow-abbey-mute-nave-route-read-v1.png",
      sha256: "2e5582779702fed33fef3ee092f109a0c39403431752f11c22bbad95b7288826",
      status: "approved_direction",
      referenceScope: "site_interior_route_read",
      siteId: "site.hollow-abbey",
      routeId: "route.processional-steps",
      locationId: "hollow_abbey_processional_and_mute_nave",
      questId: "main_a_litany_unspoken",
      landmarkIds: ["mute_nave", "last_bell_crypt"],
      exactCoordinate: null,
      runtimeBackdrop: false,
      runtimeIntegrated: false,
      productionAsset: false,
      provenancePath: "assets/world/world-environments.current.batch-03.provenance.json",
      promptPacketPath: "assets/world/prompts/world-environments.current.batch-03.prompt-packets.json",
      visualReviewBoundary: "Approved playable-camera circulation, route readability, material continuity, framing, and forbidden-content direction only; stairs, pits, inlay, dimensions, topology, creature anatomy, runtime behavior, construction, and production geometry remain illustrative.",
      use: ["player-height Mute Nave scale", "central quest spine", "side-aisle loops", "upper-cloister ascent and return", "black crypt descent", "urn-field combat occlusion"],
    },
    {
      id: "concept_hollow_abbey_rain_court_work_nexus",
      path: "assets/world/hollow-abbey-rain-court-work-nexus-v1.png",
      sha256: "a5e5ae1dfe2ec15a7f17f649356404f4f276ba8db89bcdd07bc2273cd555b074",
      status: "approved_direction",
      referenceScope: "site_court_work_nexus",
      siteId: "site.hollow-abbey",
      routeId: "route.processional-steps",
      locationId: "hollow_abbey_processional_and_mute_nave",
      questId: "main_a_litany_unspoken",
      landmarkIds: ["abbey_gate", "mute_nave"],
      exactCoordinate: null,
      runtimeBackdrop: false,
      runtimeIntegrated: false,
      productionAsset: false,
      provenancePath: "assets/world/world-environments.current.batch-04a.provenance.json",
      promptPacketPath: "assets/world/prompts/world-environments.current.batch-04a.prompt-packets.json",
      visualReviewBoundary: "Approved player-height gate and rain-court composition, four-way route hierarchy, Nhal staging and supernatural rain cue, shallow local drainage, maintenance evidence, material continuity, framing, and forbidden-content direction only; exact architecture, measurements, GIS placement, drainage behavior, collision, final Nhal construction and VFX, runtime integration, and production geometry remain illustrative and unapproved.",
      use: ["deep Exact-Word gate volume", "rain-court four-way route hierarchy", "nonblocking Gatewarden Nhal staging", "shallow local karst drainage", "maintained work-threshold evidence"],
    },
  ],
  acceptedTechnicalReferences: [
    {
      id: "technical_veil_coast_gloamharbor_tide_refuge",
      territoryId: "territory.veil-coast",
      siteId: "site.gloamharbor",
      subjectId: "gloamharbor_tide_refuge_precinct",
      imagePath: "assets/world/technical/veil-coast-gloamharbor-tide-refuge-blueprint-v14.png",
      imageSha256: "9784d16b16b5905aa2dbf43cbea32701f68c70eaf955199822ba4583a29d67ab",
      topologyPath: "assets/world/technical/veil-coast-gloamharbor-tide-refuge-topology-v14.json",
      topologySha256: "0accae6f553bc87cedab082453ed7bd91d44b1991a72add2eb6b6e344f8b9b9a",
      status: "approved_2d_topology_reference",
      referenceScope: "site_interior_circulation",
      exactCoordinate: null,
      coordinateSemantics: "diagram_pixels_not_meters",
      environmentKeyframe: false,
      runtimeBackdrop: false,
      runtimeIntegrated: false,
      productionAsset: false,
      technicalReadiness: false,
      use: ["five-cell adjacency", "continuous step-free bell route", "independent right boardwalk", "roof and canopy coverage", "separate utility chains"],
      limitations: ["not a keyframe or mood reference", "not GIS or surveyed placement; JSON x/y values are diagram pixels, never meters", "not CAD, structural, construction, or accessibility-code authority", "not collision, navigation, runtime, gameplay, 3D, or production authority"],
    },
  ],
  acceptedSpatialBlockoutReferences: [
    {
      id: "technical_world_spatial_wave_02_v9",
      path: "assets/world/spatial/world-spatial-wave-02-v9.annex.json",
      provenancePath: "assets/world/spatial/world-spatial-wave-02-v9.provenance.json",
      sha256: "4ddba07f2e7c74700d021421cbc20dd0ee27e9ccef730e9258fb6cfaebb3ffe4",
      bytes: 49_416_945,
      status: "approved_noncanonical_blockout_reference",
      referenceScope: "six_site_executable_spatial_contract",
      coordinateSemantics: "site_local_fictional_meters_not_atlas_coordinates",
      siteIds: ["site.gloamharbor", "site.sluice-chapel", "site.pale-measure", "site.anchor-field", "site.smothered-kiln", "site.white-meridian"],
      counts: {
        frames: 9,
        structures: 12,
        rooms: 67,
        habitats: 28,
        hazards: 24,
        utilityNetworks: 64,
        utilityNodes: 1_529,
        utilityEdges: 1_247,
        serviceProfiles: 69,
        roles: 30,
        operatingTasks: 67,
        spatialDomains: 378,
        spatialNodes: 1_783,
        spatialRoutes: 1_465,
        safeCells: 62,
        stateGates: 51,
        thresholds: 389,
        verticalAccessSystems: 36,
        emergencyStairs: 36,
        emergencyStairFlights: 402,
        emergencyStairTreads: 3_360,
        emergencyStairSupports: 72,
        landingPlatforms: 144,
        questCrosswalks: 3,
      },
      reviewedRepairEvidence: {
        sourceStationContacts: "132/144",
        acceptedStationContacts: "144/144",
        repairedSystems: 10,
        repairedTransitions: 12,
        changedPolygonRoots: 24,
        changedPrimitiveLeaves: 80,
        outsideAllowlistChanges: 0,
      },
      canonical: false,
      atlasExportEligible: false,
      exactPlacementClaim: false,
      runtimeIntegrated: false,
      productionGeometry: false,
      productionAsset: false,
      releaseReady: false,
      constructionReady: false,
      limitations: [
        "published derivative removes 39 unpublished workspace locator fields; hashes and semantic-delta evidence are bound in the provenance sidecar",
        "not canonical atlas placement and never scale-compatible with diagram-pixel topology references",
        "not final structural, accessibility, fire, geotechnical, code, or construction engineering",
        "not validated runtime navigation, collision, streaming, traversal, or production performance",
      ],
    },
  ],
});

export const WORLD_STREAMING_AND_LOD = deepFreeze({
  authority: "authored_design_constraint",
  maturity: "runtime_budget_direction_not_implementation_claim",
  spatialPartitions: [
    { id: "atlas_macro", sizeMeters: [512, 512], source: "canonical atlas", role: "terrain, ecology, route, and distant-state address" },
    { id: "site_chunk", sizeMeters: [32, 32], source: "canonical Hearthmere prototype contract", role: "local geometry, navigation, interaction, audio, and phase payload" },
    { id: "interior_cell", sizeMeters: [16, 16], source: "authored design constraint", role: "room graph and mobile-interior streaming" },
  ],
  lodRings: [
    { id: "lod0_gameplay", distanceMeters: [0, 42], requirements: ["full collision", "mechanic cues", "interactive thresholds", "hero material"], characterRig: "full" },
    { id: "lod1_site", distanceMeters: [42, 128], requirements: ["silhouette-preserving mesh", "large route state", "major light and VFX"], characterRig: "simplified" },
    { id: "lod2_landmark", distanceMeters: [128, 384], requirements: ["landmark mass", "roof and skyline", "large environmental state"], characterRig: "crowd_impostor_or_none" },
    { id: "lod3_atlas", distanceMeters: [384, null], requirements: ["terrain envelope", "hydrology", "route thread", "regional weather"], characterRig: "none" },
  ],
  budgets: {
    textureTexelsPerMeter: { hero: 1024, standard: 512, background: 256 },
    propTriangles: { hero: 48000, standard: 12000, minor: 2800 },
    dynamicLightsVisible: 18,
    activeParticles: 2400,
    simultaneousAmbientVoices: 14,
    highQualityMaxVisibleDrawCalls: 700,
  },
  phaseRules: [
    "Quest outcomes stream as compact state deltas over a stable base set; do not duplicate whole settlements for each outcome.",
    "Navigation, collision, audio, scent, light, and population deltas share one phase identifier.",
    "Critical setpiece actors, exits, and fail-forward evidence are pinned before their approach sightline opens.",
    "Mobile Charnel interiors use a stable local graph and a separately streamed atlas ingress/egress anchor.",
    "Artificial-noon and weather bodies may cross cells, but their authority, cost, and affected population state remain deterministic.",
  ],
});

const locationProgram = (territoryIds, hostSiteId, placementMode, designEnvelopeMeters, typologyIds, materialTags, spatialBeats, sensory, mutableLayers, streamingClass = "site_setpiece") => ({
  territoryIds,
  hostSiteId,
  placementMode,
  placementStatus: "provisional_placement",
  exactAtlasCoordinate: null,
  designEnvelopeMeters,
  typologyIds,
  materialTags,
  spatialBeats,
  sensory,
  mutableLayers,
  streamingClass,
  authority: { identity: "canon", program: "authored_design_constraint", atlasPlacement: "provisional_placement" },
});

const BASE_QUEST_LOCATION_PROGRAMS = deepFreeze({
  hearthmere_dusk_circuit: locationProgram(
    ["territory.graven-march"], "site.hearthmere", "settlement_exterior_loop", [220, 180, 46], ["hearthmere_slate_tenant_house", "hearthmere_bell_civic"],
    ["wet slate", "patched black pine", "clay names", "cold repaired stone", "banked ember"],
    ["one continuous shade-cart circuit", "vertical noon wound visible from every circuit quarter", "resident door thresholds along both safe and exposed sides", "shadow-refuge return lane"],
    { visibility: "moving occlusion makes cover state readable on walls and people", acoustic: "cart wheel, false-double bell, and silence at exposed shadows", scent: "rain slate, ember, and new lime" },
    ["facade repair", "resident shadow ownership", "purity-mark route", "refuge access"], "settlement_phase_cluster",
  ),
  vespera_processional_ruin: locationProgram(
    ["territory.hollow-abbey"], "site.hollow-abbey", "ruined_processional_court", [120, 76, 64], ["lucent_processional_cathedral", "hollow_abbey_nave"],
    ["bone limestone", "narrow gold seam", "wet flagstone", "black veil cloth"],
    ["two incompatible shadow-cast lanes", "three witness rescue pockets", "black halo-nail focus", "neutral exterior asylum route"],
    { visibility: "direct and reflected light never collapse into one angle", acoustic: "rain-now and footstep-late expose timeline disagreement", scent: "wet lime, cold gold, and lamp smoke" },
    ["which shadow owns testimony", "witness rescue access", "sanctuary admission", "saint separation"],
  ),
  three_stopped_villages: locationProgram(
    ["territory.graven-march"], null, "multi_settlement_route", [2400, 1600, 90], ["hearthmere_bell_civic", "graven_cairn_hall"],
    ["wet slate", "black pine", "clay name doors", "bell bronze", "seasonal ground states"],
    ["three distinct village noon marks", "visible bell-note corridor linking settlements", "relationship-name doors along the wave", "counter-toll site outside all three civic centers"],
    { visibility: "noon geometry crosses weather without becoming an interface line", acoustic: "one repaired toll changes by lost relationship", scent: "seasonal soil changes with each restored routine" },
    ["season and time", "door names", "social recognition", "calendar routing"], "multi_site_story_cluster",
  ),
  nacre_internal_village: locationProgram(
    [], null, "mobile_living_settlement_interior", [260, 140, 88], ["charnel_living_interior"],
    ["black nacre rib", "worn domestic timber", "tenant cloth", "condensed rain", "living artery"],
    ["outer rib door", "ward-scale voting routes", "organ repair junctions that control evidence delivery", "safe exit artery", "revocable exterior threshold"],
    { visibility: "domestic lamps and exterior age-light remain distinct", acoustic: "host breath underneath ordinary village work", scent: "warm nacre, cooked food, damp cloth, and exterior rain" },
    ["ward information", "resident vote", "host health", "exit safety and consent"], "mobile_interior_cluster",
  ),
  mute_amphitheatre: locationProgram(
    ["territory.hollow-abbey"], "site.hollow-abbey", "open_civic_amphitheatre", [92, 92, 34], ["hollow_abbey_nave", "graven_road_assize"],
    ["wet limestone", "thirteen dark throat stations", "blank bronze", "rain basin"],
    ["thirteen separately addressable voice positions", "central deliberate-rest volume", "thirteenth ballot exit", "auditor ring outside the Prince's body"],
    { visibility: "every throat position has an unmerged sightline", acoustic: "cadence supports one materially silent political position", scent: "wet stone, breath, and old bronze" },
    ["voice ownership", "treaty obligation", "representation", "release route"],
  ),
  scar_margin_archive: locationProgram(
    ["territory.graven-march", "territory.hollow-abbey"], null, "archive_at_territory_margin", [110, 70, 42], ["graven_road_assize", "hollow_abbey_nave"],
    ["hinged slate relief", "wound-red stone seam", "black archive cloth", "blank witness plinth"],
    ["four non-overlapping wound-margin stations", "four willing-witness positions", "public/private publication threshold", "relief history visible only through assigned burden"],
    { visibility: "each margin reveals a different causal slice", acoustic: "hinge movement and bearer breathing, no narration loudspeaker", scent: "wet stone, iron, and archive dust" },
    ["historical causal links", "witness injury", "publication state", "public route to evidence"],
  ),
  interior_of_restrained_maw: locationProgram(
    [], null, "sentient_predator_interior", [360, 70, 64], ["charnel_living_interior"],
    ["black nacre corridor", "restrained tooth buttress", "worn party rope", "lamp soot", "unconsumed tissue"],
    ["negotiated mouth threshold", "single unconsumed path with branching cover", "companion hiding alcoves", "three edible-memory temptations", "exterior emergence that preserves orientation"],
    { visibility: "each lamp opens route information while raising visible hunger", acoustic: "teeth counted only after mercy", scent: "wet nacre, lamp oil, fear sweat, and restrained appetite" },
    ["hunger", "companion visibility", "memory temptation", "emergency wound"], "mobile_interior_cluster",
  ),
  cinderward_law_forge: locationProgram(
    ["territory.cinderward"], "site.ember-gate", "industrial_governance_interior", [96, 88, 74], ["cinderward_law_forge"],
    ["black iron", "firebrick", "bell bronze", "quench water", "blank service seals"],
    ["three simultaneous disaster bays", "rewiring floor with physical ownership routes", "distributed veto gallery", "manual shutdown approach", "known-fault egress to inheriting settlement"],
    { visibility: "benefit and catastrophic propagation share one frame", acoustic: "furnace inhale, relay strike, and mortal cutoff", scent: "hot gasket, quench steam, and iron" },
    ["shutdown design", "fault inheritance", "veto ownership", "service access"],
  ),
  crucible_at_worlds_late_edge: locationProgram(
    ["territory.mirror-salt-waste"], null, "remote_cosmology_crucible", [180, 180, 110], ["salt_watch_caravan_house", "lucent_processional_cathedral"],
    ["mirror salt", "black iron witness ring", "small controlled light", "weathered faction materials"],
    ["hand-sized crucible at human access height", "separate orbits for warmth, truth, growth, and admission", "three faction witness routes", "campaign-consequence gallery", "open late-world horizon"],
    { visibility: "cosmic laws remain physical, limited, and hand-scale", acoustic: "each prior cost has a distinct embodied witness", scent: "cold salt, warm metal, rain carried from elsewhere" },
    ["available cosmology laws", "named exceptions", "admission boundary", "continuation of Late World"], "finale_pinned_cluster",
  ),
  unlit_hospice_memory_ward: locationProgram(
    ["territory.graven-march"], "site.hearthmere", "clinical_memory_interior", [28, 20, 14], ["hearthmere_unlit_hospice"],
    ["washed slate", "unbleached linen", "four surgical thread paths", "patient property"],
    ["four grief-layer stations", "widower movement test", "consent seat", "memory-suture table", "appeal courtyard sightline"],
    { visibility: "function, pain, testimony, and identity use four separable thread routes", acoustic: "breath and thread tension over quiet ward work", scent: "bitter herb, clean linen, and banked hearth" },
    ["symptom function", "memory evidence", "consent", "co-bearer state"],
  ),
  hearthmere_unbudgeted_street: locationProgram(
    ["territory.graven-march"], "site.hearthmere", "moving_hidden_street", [150, 40, 28], ["hearthmere_slate_tenant_house", "hearthmere_bell_civic"],
    ["wet slate", "seven distinct lamp technologies", "unregistered tenant repairs", "blank address plates"],
    ["six mapped street joins", "one address moving between maintenance rounds", "seven unique lamp service points", "ration and tax threshold", "Unwritten Roads egress"],
    { visibility: "lamp state reveals civic existence rather than simply illumination", acoustic: "each lamp has a different maintenance cue", scent: "rain, lamp oils, cooking, and ledger clay" },
    ["street geometry", "household jurisdiction", "ration entitlement", "tax visibility"], "settlement_phase_cluster",
  ),
  unlit_hospice_living_ward: locationProgram(
    ["territory.graven-march"], "site.hearthmere", "adaptive_clinical_interior", [46, 30, 18], ["hearthmere_unlit_hospice"],
    ["washed slate", "rolling bed tracks", "living wall graft", "dark timber", "herb store"],
    ["six independently traceable bed routes", "heart gallery", "denied-care threshold", "bias edit station", "manual-care fallback loop"],
    { visibility: "bed order and denied access remain readable without UI", acoustic: "bed rollers, living pulse, and ward appeal bell", scent: "herb, linen, spring water, and living wall" },
    ["patient priority", "learned bias", "care access", "heart survival"],
  ),
  countryless_assize: locationProgram(
    ["territory.graven-march"], "site.cairnmarket", "roadside_civic_hearing", [72, 54, 24], ["graven_road_assize"],
    ["split slate", "three distinct ash deposits", "blank chairs", "road timber"],
    ["three extinct council chairs", "living descendant contest ring", "ash evidence bay", "appeal exit", "public road bypass"],
    { visibility: "ash deposits never merge into one dead electorate", acoustic: "chair scrape, ash sift, and open-road wind", scent: "cold ash, slate, and pine" },
    ["dead-settlement authority", "descendant standing", "country claim", "road access"],
  ),
  hearthmere_folded_townhouse: locationProgram(
    ["territory.graven-march"], "site.hearthmere", "transforming_domestic_interior", [24, 18, 22], ["hearthmere_slate_tenant_house"],
    ["layered tenant coats translated to layered rooms", "wet slate", "mismatched doorframes", "dinner hearth"],
    ["ordinary family dinner anchor", "room-by-room folding path", "centuries of distinct doorframes", "ledger exclusion pocket", "safe domestic exit"],
    { visibility: "architecture changes without becoming a combat dungeon", acoustic: "hinges, tableware, and residents continuing dinner", scent: "stew, damp wool, old timber, and lime" },
    ["recognized tenancy", "room access", "deed evidence", "household continuity"],
  ),
  hearthmere_double_census: locationProgram(
    ["territory.graven-march"], "site.hearthmere", "civic_light_queue", [64, 42, 20], ["hearthmere_bell_civic"],
    ["wet slate", "one shuttered lamp", "blank census roll", "unowned shadow field"],
    ["body queue", "silhouette queue", "single light pivot", "four separated absence areas", "witness appeal station"],
    { visibility: "totals change physically with light movement, never as overlay numerals", acoustic: "paper roll, moth scale, and queue testimony", scent: "lamp oil, wet paper, and rain" },
    ["population standing", "shadow ownership", "absence publication", "ration count"],
  ),
  hearthmere_breath_and_gutter_seedfront: locationProgram(
    ["territory.graven-march"], "site.hearthmere", "connected_roofs_and_breath_route", [160, 96, 42], ["hearthmere_slate_tenant_house", "hearthmere_unlit_hospice"],
    ["wet gutter copper", "white-gold burrs", "dark slate", "breath frost", "garden wall"],
    ["ward-scale connected gutter", "shared breath corridor", "prior and next custodian thresholds", "repair benefit visible downstream", "seed quarantine return"],
    { visibility: "every hook aligns toward one accountable cultivator", acoustic: "ward inhale passes through masonry", scent: "ozone sap, damp mortar, and herb beds" },
    ["seed warrant", "host liability", "repair state", "propagation route"], "settlement_phase_cluster",
  ),
  stationary_cart_assize: locationProgram(
    ["territory.graven-march"], "site.cairnmarket", "vehicle_civic_hearing", [82, 64, 42], ["graven_road_assize"],
    ["old road slate", "single detached wheel grammar", "blank seals", "ruined brick", "unowned shadows"],
    ["motionless suspended cart", "single axle evidence focus", "four evidence orbits kept distinct", "public witness ring", "road-office threshold"],
    { visibility: "vehicle remains stationary while office evidence carries motion", acoustic: "wheel bearing, paper seal, and road wind", scent: "road dust, wax, wet brick, and old canvas" },
    ["cart legal personhood", "road office", "evidence weight", "tax and repair duty"],
  ),
  three_age_family_hearing: locationProgram(
    [], null, "living_household_time_interior", [58, 42, 32], ["charnel_living_interior"],
    ["black nacre", "ordinary family table", "three age-specific repair layers", "premature graves"],
    ["single meal table spanning three ages", "three separately legible family routes", "grave arrivals at one threshold", "outside chronology aperture", "consent exit"],
    { visibility: "ages coexist without ghost-opacity shorthand", acoustic: "same family routine at three material ages", scent: "shared meal, wet nacre, old linen, and grave loam" },
    ["resident age relation", "grave claim", "outside time", "village freedom"], "mobile_interior_cluster",
  ),
  hundred_rib_door_passage: locationProgram(
    [], null, "mass_living_threshold_array", [260, 84, 86], ["charnel_living_interior"],
    ["black nacre", "hundreds of repaired tenant doors", "lethal exterior rain", "hinge-worn cloth"],
    ["hundreds of outward-opening doors", "one maternal voice route", "resident-specific revocation stations", "weather exposure corridor", "safe return thresholds"],
    { visibility: "doors read as individual resident boundaries, not a texture wall", acoustic: "one voice changes through hundreds of hinges", scent: "rain, household smoke, nacre, and cold exterior" },
    ["door consent", "resident voice attribution", "outside hazard", "sanctuary boundary"], "mobile_interior_cluster",
  ),
  migrating_storm_roof: locationProgram(
    ["territory.dunmire", "territory.graven-march"], null, "weather_body_over_village", [320, 240, 140], ["charnel_living_interior", "dunmire_stilt_house"],
    ["storm-black rafter cloud", "ordinary roofless homes", "named drought soil", "rain channels"],
    ["roofless beneficiary village", "single migrating storm body", "rafter formation zones", "downstream drought panorama", "accountable leak route"],
    { visibility: "benefit above and cost below share one navigable composition", acoustic: "roof rain moves with structural breathing", scent: "first rain, wet timber, and dry soil receiving no water" },
    ["weather custody", "drought recipient", "roof access", "migration route"], "weather_body_cluster",
  ),
  pell_unfolded_black_heath: locationProgram(
    ["territory.graven-march"], null, "open_heath_route_setpiece", [420, 180, 60], [],
    ["black heath", "wet flint", "approaching road surfaces", "small mortal clothing scale"],
    ["human-scale sequence of seven anatomical route turns", "multiple road approaches", "recognition and recoil zones", "safe witness ridge", "no literal giant body road"],
    { visibility: "Pell remains a small person while route logic expands around him", acoustic: "roads arrive through substrate before they are seen", scent: "wet heath, flint, old road dust" },
    ["road recognition", "witness account", "public route", "personal autonomy"], "territory_setpiece_cluster",
  ),
  triune_dawn_control_chambers: locationProgram(
    ["territory.cinderward"], "site.ember-gate", "linked_civic_control_interior", [86, 52, 38], ["cinderward_law_forge"],
    ["black iron", "one impossible handle", "mortal leather", "empty office glove", "communal heat-scar prosthesis"],
    ["three distinct civic chambers", "single handle passing through all", "three pull vectors", "separate appeal routes", "visible machine consequence beyond walls"],
    { visibility: "three hands and obligations never merge into a decorative triad", acoustic: "three tension states in lever linkage", scent: "leather, hot iron, and communal repair oil" },
    ["veto quorum", "office standing", "communal labor", "machine operation"],
  ),
  seven_ring_dawn_service_array: locationProgram(
    ["territory.cinderward"], "site.ember-gate", "artificial_noon_maintenance_array", [120, 120, 96], ["cinderward_law_forge"],
    ["seven artificial-noon rings", "service black", "crops and wards", "truce boundary", "blank gaskets"],
    ["seven independently darkenable rings", "assigned-darkness service bays", "crop, worker, defense, and ceasefire dependencies", "unseated maintenance quorum", "manual dark egress"],
    { visibility: "ring count and blackout order are exact without interface labels", acoustic: "incomplete gasket chord and controlled extinguish reports", scent: "hot seals, crop air, metal, and quench steam" },
    ["maintenance window", "dependency survival", "quorum authority", "artificial noon continuity"], "industrial_pinned_cluster",
  ),
  three_succession_chambers: locationProgram(
    ["territory.cinderward"], "site.ember-gate", "personal_engine_governance_interior", [72, 40, 30], ["cinderward_law_forge"],
    ["black iron", "blank office devices", "ordinary mortal workwear", "pulse and shadow evidence"],
    ["shadow chamber", "pulse chamber", "sworn-name chamber", "free walking body corridor", "succession appeal floor"],
    { visibility: "exactly three detachable offices stay distinct from the living person", acoustic: "pulse, quiet clasp, and name witness spoken by others", scent: "work leather, warm metal, and ordinary sweat" },
    ["office succession", "personal mortality", "engine authority", "appeal standing"],
  ),
  maintenance_fracture_ratification_floor: locationProgram(
    ["territory.cinderward"], "site.ember-gate", "fracture_and_ballot_floor", [92, 72, 32], ["cinderward_law_forge"],
    ["black iron floor", "visible maintenance fracture", "blank expired seals", "service cuffs", "fading benefit light"],
    ["fracture origin at lit engine ring", "intact-to-cracked ballot seals", "claimant body threshold", "benefit fade perimeter", "appeal and re-seat route"],
    { visibility: "one continuous fracture route changes custody without becoming decorative lightning", acoustic: "material crack passes through quiet seal pops", scent: "hot iron, dry seal fiber, and cooling air" },
    ["cost standing", "maintenance debt", "benefit continuation", "new claimant consent"],
  ),
  hearthmere_orchard_of_second_births: locationProgram(
    ["territory.graven-march"], "site.hearthmere", "civic_orchard_and_threshold_array", [118, 92, 46], ["hearthmere_slate_tenant_house", "lucent_processional_cathedral"],
    ["dark orchard timber", "white-gold genealogical instruments", "wet slate thresholds", "forming organic silhouette"],
    ["newborn silhouette tree", "five rotating legal thresholds", "forming organ route", "recognized claimant station", "household custody exit"],
    { visibility: "lineage machinery stays precise while household evidence stays worn and human", acoustic: "small door latches and sap tension", scent: "wet bark, white sap, hearth smoke, and new plaster" },
    ["genealogical standing", "newborn custody", "organ admission", "household protection"], "settlement_phase_cluster",
  ),
  nacre_open_sky_appeal_field: locationProgram(
    ["territory.dunmire", "territory.graven-march"], null, "open_weather_hearing", [240, 200, 160], ["charnel_living_interior", "graven_road_assize"],
    ["five ordinary observation towers", "black-nacre weather body", "open soil", "contradictory cloud strata"],
    ["five independently exposed towers", "least-contested forecast stitch zone", "unnamed drought witness station", "published-weather archive shelter", "live contradiction route"],
    { visibility: "possible skies remain meteorologically distinct rather than portal panels", acoustic: "tower instruments, rafter breath, and moving rain", scent: "five local soils, first rain, and nacre" },
    ["forecast authority", "observed weather", "drought obligation", "emergency precedent"], "weather_body_cluster",
  ),
  unelapsed_minute_beneath_cinderward: locationProgram(
    ["territory.cinderward"], "site.smothered-kiln", "time_interval_under_industrial_site", [220, 90, 110], ["cinderward_law_forge", "lucent_processional_cathedral"],
    ["rusted Cinderward above", "single stopped second", "twelve clock-wing structure", "ordinary possessions aging backward"],
    ["surface rust timeline", "unelapsed service interval below", "backward seraph route", "generational lived terraces", "institutional record exit"],
    { visibility: "stopped time has spatial consequences without clock-face UI", acoustic: "one moving wing in a silent machine minute", scent: "rust, hot dust, old cloth becoming new" },
    ["maintenance arrears", "biographical time", "institutional admission", "infrastructure repair"], "temporal_pinned_cluster",
  ),
  cathedral_of_six_rehearsed_dawns: locationProgram(
    ["territory.hollow-abbey"], "site.hollow-abbey", "lucent_doctrinal_cathedral", [160, 110, 96], ["lucent_processional_cathedral", "hollow_abbey_nave"],
    ["cold ivory stone", "restrained gold", "six folding horizon structures", "black refusal thresholds", "exterior silent panels"],
    ["six materially different refusal bays", "Liora pressure-vessel center", "white-gold oculus approach", "damaged-community witness routes", "service-dark release path"],
    { visibility: "each beautiful horizon offers a real benefit and reachable refusal", acoustic: "thousands of hands stop one finger-width away in controlled quiet", scent: "cold rain, clean stone, hot gold, and service oil" },
    ["refusal doctrine", "restoration pressure", "vessel consent", "sainthood judgment"], "cathedral_pinned_cluster",
  ),
  fear_exchange_beneath_thirteen_tables: locationProgram(
    [], null, "charnel_market_interior", [96, 72, 44], ["charnel_living_interior"],
    ["black nacre", "thirteen wet ledger ribs", "ordinary worker tables", "blank appetite scales"],
    ["thirteen separately legible tables", "restraint lot", "fear-worker exit routes", "bailiff kneeling station", "reparation rib-ledger"],
    { visibility: "prepared bite and voluntary stop are both physically readable", acoustic: "nested jaw cue, ledger wetness, and worker breath", scent: "food, fear sweat, nacre, and lamp smoke" },
    ["feeding title", "fear labor", "restraint value", "reparation"], "mobile_interior_cluster",
  ),
  mortal_estate_inside_vespera_veil: locationProgram(
    ["territory.hollow-abbey"], "site.hollow-abbey", "magnified_mortal_estate_interior", [84, 56, 72], ["hearthmere_slate_tenant_house", "lucent_processional_cathedral"],
    ["ordinary cottage timber at cathedral scale", "cold veil light", "mortal furniture", "articulated second shadow"],
    ["four probate rooms", "autonomous companion entry", "sight/heat/speech/shadow mode routes", "cross-mode evidence filing", "restitution exit"],
    { visibility: "furniture remains ordinary and specific despite scale", acoustic: "room sounds appear only in compatible sense mode", scent: "old cottage wood, veil rain, and sealed belongings" },
    ["estate rights", "inherited duties", "companion sense access", "dependant protection"], "companion_pinned_cluster",
  ),
  road_that_moves_only_by_vote: locationProgram(
    ["territory.graven-march", "territory.dunmire", "territory.veil-coast"], null, "multi_border_mobile_road", [1800, 120, 80], ["graven_road_assize"],
    ["old road surfaces", "thirteen throat collars", "border threshold materials", "immense unchosen-road absence"],
    ["thirteen constituency starting positions", "weight/pace/silence/sound ballot lanes", "body, voice, and silence borders", "midstep safe exit", "destination admission threshold"],
    { visibility: "votes alter locomotion and geography without polling UI", acoustic: "spoken and silent positions remain separable", scent: "road dust changes at each border; living body and wet absence remain distinct" },
    ["collective direction", "individual exit", "border standing", "destination obligation"], "multi_site_story_cluster",
  ),
  graven_march_black_pine_occlusion_basin: locationProgram(
    ["territory.graven-march"], "site.cairnmarket", "seasonal_ecology_basin", [620, 480, 130], ["graven_cairn_hall"],
    ["black pine", "cold slate", "five occlusion intervals", "dormant cairn bodies", "unused roads"],
    ["three failed dens", "five black-pine shadow gates", "twelve-muzzle choir basin", "public road closure points", "trade detour overlook"],
    { visibility: "cold is composed through absence and shadow, not blue magic fog", acoustic: "one note begins only after all footfall stops", scent: "pine resin, cold lichen, snow, and warm cairn fading" },
    ["hibernation interval", "public access", "trade route", "herd continuity"], "territory_setpiece_cluster",
  ),
  dunmire_uphill_drowning_genealogy: locationProgram(
    ["territory.dunmire"], "site.sluice-chapel", "reverse_hydrology_settlement_route", [420, 260, 90], ["dunmire_stilt_house", "dunmire_submerged_vestry"],
    ["pitch water", "family stair routes", "reflected houses", "wet brick", "real maintenance tools"],
    ["three rescued households", "four uphill confluences", "staircase family-tree route", "heirloom room test", "real/reflected door pair"],
    { visibility: "uphill water movement remains physically traceable", acoustic: "maintenance acts precede reverse flow", scent: "pitch water, wet timber, family kitchens, and sluice silt" },
    ["performed kinship", "flood service", "memory room custody", "water body standing"], "territory_setpiece_cluster",
  ),
  cinderward_readdressing_district: locationProgram(
    ["territory.cinderward"], "site.ember-gate", "settlement_industrial_district", [280, 180, 96], ["cinderward_furnace_dwelling", "cinderward_law_forge"],
    ["inhabited firebrick street", "iron crown furnace", "movable blank address plates", "soot-direction evidence"],
    ["six historic address transfers", "four live civic address plates", "approaching legal-fire route", "occupied function testimony points", "unavoidable-loss evacuation loops"],
    { visibility: "praise, blame, and silence alter a physical target without spelling words in flame", acoustic: "address hardware moves under furnace inhale", scent: "soot, hot brick, household cooking, and quench steam" },
    ["address ownership", "civic function", "sacrifice target", "district governance"], "settlement_phase_cluster",
  ),
  hollow_abbey_foundry_of_borrowed_quiet: locationProgram(
    ["territory.hollow-abbey"], "site.hollow-abbey", "silence_labor_foundry", [110, 86, 62], ["hollow_abbey_foundry"],
    ["sooted limestone", "molten bell bronze", "seven quiet rooms", "blackwater ripple trays", "blank wage hardware"],
    ["seven future-silence rooms", "molten bell floor", "deaf-worker ripple sightline", "wage archive", "advance funeral route", "cooling-physics operation order"],
    { visibility: "seven silences are social scenes, not musical notes or labels", acoustic: "hammering understood through visible ripples; spent silence is materially abrupt", scent: "bronze heat, wet limestone, grave wax, and cooling water" },
    ["silence wage", "worker future", "restored names", "creditor crack"], "industrial_pinned_cluster",
  ),
  salt_waste_nursery_of_false_horizons: locationProgram(
    ["territory.mirror-salt-waste"], "site.white-meridian", "migratory_creature_nursery", [340, 240, 90], ["salt_watch_caravan_house"],
    ["mirror womb", "salt-white ground", "nine-legged calf scale", "translucent destination organs", "refuge cloth"],
    ["responsive mirror-womb", "four uncompassed landscape approaches", "three destination feeding stations", "route-debt rescue", "creature-first custody choice"],
    { visibility: "each organ contains a landscape without becoming a framed portal or UI card", acoustic: "organ hum, mirror tick, and calf movement on crust", scent: "warm mirror glass, brine wax, gypsum, and caravan cloth" },
    ["creature custody", "route debt", "refuge destination", "mirror parenthood"], "territory_setpiece_cluster",
  ),
});

export const QUEST_WAVE_04_LOCATION_PROGRAMS = deepFreeze(Object.fromEntries(
  QUEST_WAVE_04_SPATIAL_INDEX.environmentPrograms.map((program) => {
    const regionSenses = REGION_DESIGN[program.territoryIds[0]]?.senses;
    return [program.locationId, {
      territoryIds: program.territoryIds,
      hostSiteId: program.hostSiteId,
      placementMode: program.placement.placementMode,
      placementStatus: "provisional_placement",
      sourcePlacementStatus: program.placement.placementStatus,
      exactAtlasCoordinate: program.placement.exactAtlasCoordinate,
      designEnvelopeMeters: [program.designEnvelopeMeters.width, program.designEnvelopeMeters.length, program.designEnvelopeMeters.height],
      typologyIds: program.typologyIds,
      materialTags: program.materialTags,
      spatialBeats: program.semanticAnchors.map((anchor) => `${anchor.kind}: ${anchor.stateRule ?? anchor.id}`),
      sensory: {
        visibility: regionSenses?.visibilityMeters ? `regional authored visibility ${regionSenses.visibilityMeters[0]}-${regionSenses.visibilityMeters[1]} meters` : "",
        acoustic: regionSenses?.acoustic?.join(", ") ?? "",
        scent: regionSenses?.scent?.join(", ") ?? "",
      },
      mutableLayers: program.mutableLayers,
      streamingClass: program.programKind,
      blockoutGraphId: program.graphId,
      safeObservationCellIds: program.safeObservationCellIds,
      objectiveEndpointIds: program.objectiveEndpointIds,
      independentEgressPathIds: program.independentEgressPathIds,
      environmentArtPipeline: program.environmentArtPipeline,
      fullWorldContractPath: QUEST_WAVE_04_SPATIAL_INDEX.fullWorldContractPath,
      authority: { identity: "canon", program: "authored_design_constraint", atlasPlacement: "provisional_placement" },
    }];
  }),
));

const QUEST_LOCATION_PROGRAMS = deepFreeze({
  ...BASE_QUEST_LOCATION_PROGRAMS,
  ...QUEST_WAVE_04_LOCATION_PROGRAMS,
});

export const QUEST_LOCATION_SPATIAL_PROGRAMS = QUEST_LOCATION_PROGRAMS;

export const QUEST_ENVIRONMENT_REQUIREMENTS = deepFreeze(EXPANSION_QUESTS.map((quest) => {
  const location = QUEST_LOCATION_PROGRAMS[quest.locationId];
  return {
    questId: quest.id,
    questTitle: quest.title,
    locationId: quest.locationId,
    primaryMechanicId: quest.primaryMechanicId,
    canonicalSetpiece: quest.authorshipProof.setpiece,
    failForwardEnvironmentMutation: quest.authorshipProof.failureTransformation,
    forbiddenSubstitution: quest.authorshipProof.forbiddenSubstitution,
    giverId: quest.giverId,
    supportingCharacterIds: quest.supportingCharacterIds,
    creatureIds: quest.creatureIds,
    stateReads: quest.stateReads,
    stateWrites: quest.stateWrites,
    outcomeIds: quest.outcomes,
    ...location,
    productionChecklist: [
      "Block primary, risk/service, and return routes before prop dressing.",
      "Keep the canonical setpiece, mechanic cue, moral cost, and affected population readable in the same spatial program.",
      "Author fail-forward geometry or prop state; do not reset the set after failure.",
      "Provide stable semantic anchors for every threshold, witness station, creature cue, and persistent state delta.",
      "Preserve ordinary human scale evidence even where the setpiece is cosmic or anatomical.",
    ],
    maturity: "authored_blockout_contract",
  };
}));

export const WORLD_SPATIAL_SOURCE_LEDGER = deepFreeze([
  { path: "packages/content/manifests/sable-reach.atlas-runtime.json", role: "canonical fictional GIS atlas", authority: "canon" },
  { path: "tools/worldgen/crs/veyl_local_grid_v1.wkt", role: "canonical engineering coordinate reference system", authority: "canon" },
  { path: "packages/content/src/bestiary.data.js", role: "canonical founding creature families and habitat profiles", authority: "canon" },
  { path: "packages/content/src/narrative.data.js", role: "canonical expansion quests, creatures, and world-state contracts", authority: "canon" },
  { path: "packages/content/manifests/quest-wave-04-v11.spatial-index.json", role: "compact accepted Wave 04 spatial compatibility index", authority: "authored_design_constraint" },
  { path: "packages/content/manifests/quest-wave-04-v11.world.json", role: "full Wave 04 Claude Design environment, habitat, utility, and blockout contract", authority: "authored_design_constraint" },
  { path: "src/data/worldAssets.js", role: "accepted regional environment language and runtime budgets", authority: "canon" },
  { path: "packages/content/manifests/hearthmere.scene.json", role: "canonical local chunk and prototype spatial contract", authority: "canon" },
  { path: "design-review/SABLE-REACH-NARRATIVE-BIBLE.md", role: "human narrative and faction context", authority: "reference" },
  { path: "assets/world/technical/veil-coast-gloamharbor-tide-refuge-topology-v14.json", role: "independently reviewed Gloamharbor two-dimensional topology contract", authority: "reference" },
  { path: "assets/world/technical/veil-coast-gloamharbor-tide-refuge-blueprint-v14.png", role: "independently reviewed Gloamharbor two-dimensional topology visualization", authority: "reference" },
  { path: "assets/world/spatial/world-spatial-wave-02-v9.annex.json", role: "independently reviewed noncanonical six-site spatial blockout reference", authority: "reference" },
  { path: "assets/world/spatial/world-spatial-wave-02-v9.provenance.json", role: "redacted review and maturity record for the six-site spatial blockout reference", authority: "reference" },
  { path: "assets/world/spatial/site-blockout-reference-v1.schema.json", role: "strict Warden Reed site-local blockout reference contract", authority: "reference" },
  { path: "assets/world/spatial/wave-03a/warden-reed.site.json", role: "independently reviewed noncanonical Warden Reed site-local blockout reference", authority: "reference" },
  { path: "assets/world/spatial/wave-03a/index.json", role: "content-addressed Wave 03A release index", authority: "reference" },
  { path: "assets/world/spatial/wave-03a/provenance.json", role: "redacted review and maturity record for Wave 03A", authority: "reference" },
  { path: "assets/world/spatial/site-blockout-reference-v2.schema.json", role: "strict Hollow Abbey site-local topology, state, hydrology, and habitat reference contract", authority: "reference" },
  { path: "assets/world/spatial/wave-03b/hollow-abbey.site.json", role: "independently reviewed noncanonical Hollow Abbey site-local blockout reference", authority: "reference" },
  { path: "assets/world/spatial/wave-03b/index.json", role: "content-addressed Wave 03B release index", authority: "reference" },
  { path: "assets/world/spatial/wave-03b/provenance.json", role: "redacted review and maturity record for Wave 03B", authority: "reference" },
]);

const idsEqual = (left, right) => left.size === right.size && [...left].every((id) => right.has(id));

export function validateWorldSpatialFoundation({
  regions = REGION_SPATIAL_PROFILES,
  sites = SITE_SPATIAL_ENVELOPES,
  routes = TRAVERSAL_NETWORK,
  familyHabitats = FAMILY_HABITAT_ENVELOPES,
  expansionHabitats = EXPANSION_CREATURE_HABITAT_ENVELOPES,
  buildingTypologies = BUILDING_TYPOLOGIES,
  activityCycles = SITE_ACTIVITY_CYCLES,
  questLocations = QUEST_LOCATION_SPATIAL_PROGRAMS,
  questEnvironments = QUEST_ENVIRONMENT_REQUIREMENTS,
} = {}) {
  const errors = [];
  const push = (path, code, message) => errors.push({ path, code, message });
  const duplicateIds = (records, label) => {
    const seen = new Set();
    for (const record of records) {
      if (seen.has(record.id)) push(label, "duplicate_id", `Duplicate ${label} ID ${record.id}`);
      seen.add(record.id);
    }
  };

  if (WORLD_SPATIAL_TARGETS.authoredQuestCapacity !== 5_000) push("targets.authoredQuestCapacity", "wrong_capacity", "Spatial foundation must scale to the canonical 5,000 authored-quest target");
  if (VEYL_PROJECTED_CRS.id !== atlasJson.coordinateReferenceSystem.id
    || VEYL_PROJECTED_CRS.authorityCode !== null
    || VEYL_PROJECTED_CRS.horizontalUnit !== "meters"
    || VEYL_PROJECTED_CRS.verticalUnit !== "meters") push("coordinateReferenceSystem", "invalid_crs", "Spatial foundation must preserve the fictional meter-based Veyl engineering grid without a false authority code");

  duplicateIds(regions, "regions");
  duplicateIds(sites, "sites");
  duplicateIds(routes, "routes");
  duplicateIds(buildingTypologies, "buildingTypologies");
  const atlasTerritoryIds = new Set(atlasJson.territories.map(({ id }) => id));
  const atlasSiteIds = new Set(atlasJson.sites.map(({ id }) => id));
  if (!idsEqual(new Set(regions.map(({ id }) => id)), atlasTerritoryIds)) push("regions", "territory_set_mismatch", "Region profiles must equal the canonical atlas territory set");
  if (!idsEqual(new Set(sites.map(({ id }) => id)), atlasSiteIds)) push("sites", "site_set_mismatch", "Site envelopes must equal the canonical atlas site set");
  for (const region of regions) {
    const atlasTerritory = atlasJson.territories.find(({ id }) => id === region.id);
    if (!atlasTerritory || JSON.stringify(region.envelope.polygon) !== JSON.stringify(atlasTerritory.polygon)) push(`regions.${region.id}.envelope`, "changed_atlas_polygon", "Region polygon must preserve the canonical atlas bytes");
    if (region.authority.envelope !== "canon" || region.maturity.atlas !== "gis_valid") push(`regions.${region.id}`, "dishonest_maturity", "Atlas envelope and environmental direction must carry separate authority and maturity states");
  }

  const typologyIds = new Set(buildingTypologies.map(({ id }) => id));
  for (const site of sites) {
    if (!atlasTerritoryIds.has(site.territoryId)) push(`sites.${site.id}.territoryId`, "unknown_territory", `Unknown territory ${site.territoryId}`);
    if (site.designEnvelope.boundaryStatus !== "provisional_not_cadastral" || site.designEnvelope.authority !== "authored_design_constraint") push(`sites.${site.id}.designEnvelope`, "false_precision", "Site design envelopes must remain explicitly provisional boundaries");
    for (const typologyId of site.typologyIds) if (!typologyIds.has(typologyId)) push(`sites.${site.id}.typologyIds`, "unknown_typology", `Unknown building typology ${typologyId}`);
  }

  const canonicalRouteSectionIds = new Set(atlasJson.routes.flatMap((route) => route.sections.map((section) => section.id)));
  if (!idsEqual(new Set(routes.map(({ id }) => id)), canonicalRouteSectionIds)) push("routes", "route_set_mismatch", "Traversal network must cover every canonical atlas route section exactly once");
  for (const route of routes) {
    if (!atlasSiteIds.has(route.fromSiteId) || !atlasSiteIds.has(route.toSiteId)) push(`routes.${route.id}`, "unknown_route_site", "Route endpoints must reference canonical atlas sites");
    if (!TRAVERSAL_SURFACE_PROFILES.some(({ id }) => id === route.surfaceProfileId)) push(`routes.${route.id}.surfaceProfileId`, "unknown_surface", `Unknown traversal surface ${route.surfaceProfileId}`);
  }

  const canonicalFamilyIds = new Set(ENEMY_FAMILIES.map(({ id }) => id));
  const habitatFamilyIds = new Set(familyHabitats.map(({ familyId }) => familyId));
  if (!idsEqual(habitatFamilyIds, canonicalFamilyIds)) push("familyHabitats", "family_set_mismatch", "Family habitat envelopes must cover every canonical creature family exactly once");
  const habitatFormIds = familyHabitats.flatMap(({ formIds }) => formIds);
  if (!idsEqual(new Set(habitatFormIds), new Set(BESTIARY.map(({ id }) => id))) || habitatFormIds.length !== BESTIARY.length) push("familyHabitats.formIds", "form_set_mismatch", "Family habitat envelopes must partition every founding creature form exactly once");
  for (const habitat of familyHabitats) {
    if (habitat.authority?.identityAndCanonicalRange !== "canon" || habitat.authority?.productionEnvelope !== "authored_design_constraint") push(`familyHabitats.${habitat.familyId}.authority`, "dishonest_authority", "Canonical family identity and range must remain distinct from authored microhabitat and sensory production direction");
    for (const territoryId of habitat.territoryIds) if (!atlasTerritoryIds.has(territoryId)) push(`familyHabitats.${habitat.familyId}.territoryIds`, "unknown_territory", `Unknown territory ${territoryId}`);
    if (!habitat.microhabitats.length || !habitat.sensorySignature.visibilityCue || !habitat.sensorySignature.acoustic || !habitat.sensorySignature.scent) push(`familyHabitats.${habitat.familyId}`, "underspecified_habitat", "Family habitats require microhabitat plus visibility, acoustic, and scent direction");
  }

  const expansionCreatureIds = new Set(EXPANSION_CREATURES.map(({ id }) => id));
  const expansionHabitatIds = expansionHabitats.map(({ creatureId }) => creatureId);
  if (!idsEqual(new Set(expansionHabitatIds), expansionCreatureIds) || expansionHabitatIds.length !== EXPANSION_CREATURES.length) push("expansionHabitats", "expansion_creature_set_mismatch", "Expansion habitat envelopes must cover every canonical expansion creature exactly once");
  for (const habitat of expansionHabitats) {
    if (habitat.placement.status !== "provisional_placement" || habitat.placement.exactCoordinate !== null) push(`expansionHabitats.${habitat.creatureId}.placement`, "false_precision", "Expansion creature atlas placement must remain provisional without an invented coordinate");
    for (const territoryId of habitat.territoryIds) if (!atlasTerritoryIds.has(territoryId)) push(`expansionHabitats.${habitat.creatureId}.territoryIds`, "unknown_territory", `Unknown territory ${territoryId}`);
    if (!habitat.microhabitats.length || !habitat.locomotionConstraint || !habitat.sensorySignature.visualCue) push(`expansionHabitats.${habitat.creatureId}`, "underspecified_habitat", "Expansion creature envelope lacks spatial, locomotion, or cue direction");
  }

  for (const typology of buildingTypologies) {
    const roomIds = new Set(typology.roomGraph.rooms);
    const thresholdIds = new Set(typology.thresholds.map(({ id }) => id));
    if (roomIds.size !== typology.roomGraph.rooms.length) push(`buildingTypologies.${typology.id}.rooms`, "duplicate_room", "Room graph contains duplicate room IDs");
    if (thresholdIds.size !== typology.thresholds.length) push(`buildingTypologies.${typology.id}.thresholds`, "duplicate_threshold", "Building contains duplicate threshold IDs");
    for (const roomEdge of typology.roomGraph.edges) {
      if (!roomIds.has(roomEdge.from) || !roomIds.has(roomEdge.to)) push(`buildingTypologies.${typology.id}.roomGraph`, "dangling_room_edge", `${roomEdge.from} -> ${roomEdge.to} references an unknown room`);
      if (!thresholdIds.has(roomEdge.thresholdId)) push(`buildingTypologies.${typology.id}.thresholds`, "missing_threshold", `Missing threshold contract ${roomEdge.thresholdId}`);
    }
    if (!typology.utilities.water || !typology.utilities.heat || !typology.utilities.waste || !typology.utilities.light) push(`buildingTypologies.${typology.id}.utilities`, "missing_utility", "Every building typology requires water, heat, waste, and light contracts");
  }

  if (!idsEqual(new Set(activityCycles.map(({ siteId }) => siteId)), atlasSiteIds)) push("activityCycles", "activity_site_set_mismatch", "Population/activity cycles must cover every canonical atlas site");
  for (const activity of activityCycles) {
    if (!activity.cycles.length || !activity.populationKinds.length || !activity.persistentStorySignals.length) push(`activityCycles.${activity.siteId}`, "underspecified_activity", "Site cycle requires population kinds, activity phases, and persistent story signals");
  }

  const canonicalLocationIds = new Set(EXPANSION_QUESTS.map(({ locationId }) => locationId));
  const programmedLocationIds = new Set(Object.keys(questLocations));
  if (!idsEqual(programmedLocationIds, canonicalLocationIds)) push("questLocations", "quest_location_set_mismatch", "Quest spatial programs must cover the exact accepted canonical location set");
  const canonicalQuestIds = new Set(EXPANSION_QUESTS.map(({ id }) => id));
  const environmentQuestIds = questEnvironments.map(({ questId }) => questId);
  if (!idsEqual(new Set(environmentQuestIds), canonicalQuestIds) || environmentQuestIds.length !== EXPANSION_QUESTS.length) push("questEnvironments", "quest_set_mismatch", "Environment requirements must cover every accepted canonical expansion quest exactly once");
  for (const requirement of questEnvironments) {
    if (requirement.placementStatus !== "provisional_placement" || requirement.exactAtlasCoordinate !== null) push(`questEnvironments.${requirement.questId}.placement`, "false_precision", "Quest placements must remain provisional without invented exact coordinates");
    if (!requirement.canonicalSetpiece || !requirement.failForwardEnvironmentMutation || !requirement.spatialBeats?.length || !requirement.mutableLayers?.length) push(`questEnvironments.${requirement.questId}`, "underspecified_setpiece", "Quest environment requires setpiece, fail-forward mutation, spatial beats, and mutable layers");
    if (requirement.hostSiteId !== null && !atlasSiteIds.has(requirement.hostSiteId)) push(`questEnvironments.${requirement.questId}.hostSiteId`, "unknown_site", `Unknown host site ${requirement.hostSiteId}`);
    for (const territoryId of requirement.territoryIds) if (!atlasTerritoryIds.has(territoryId)) push(`questEnvironments.${requirement.questId}.territoryIds`, "unknown_territory", `Unknown territory ${territoryId}`);
    for (const typologyId of requirement.typologyIds) if (!typologyIds.has(typologyId)) push(`questEnvironments.${requirement.questId}.typologyIds`, "unknown_typology", `Unknown building typology ${typologyId}`);
    for (const creatureId of requirement.creatureIds) if (!expansionCreatureIds.has(creatureId)) push(`questEnvironments.${requirement.questId}.creatureIds`, "unknown_creature", `Unknown expansion creature ${creatureId}`);
  }

  const privacySurface = JSON.stringify({
    WORLD_SPATIAL_SOURCE_LEDGER,
    ENVIRONMENT_ART_DIRECTION,
    regions,
    sites,
    familyHabitats,
    expansionHabitats,
    questEnvironments,
  });
  if (/(?:[A-Za-z]:\\|https?:\/\/|drive\/folders|call[_-]?id|session[_-]?id|username|e-?mail|@(?:gmail|outlook))/i.test(privacySurface)) push("privacy", "provenance_leak", "Published world-spatial surface contains an external locator, workstation path, or personal identifier");

  return deepFreeze({
    valid: errors.length === 0,
    errors,
    stats: {
      regions: regions.length,
      sites: sites.length,
      routeSections: routes.length,
      buildingTypologies: buildingTypologies.length,
      familyHabitats: familyHabitats.length,
      foundingFormsCovered: habitatFormIds.length,
      expansionCreatureHabitats: expansionHabitats.length,
      questEnvironments: questEnvironments.length,
      authoredQuestCapacity: WORLD_SPATIAL_TARGETS.authoredQuestCapacity,
    },
  });
}

export const WORLD_SPATIAL_FOUNDATION = deepFreeze({
  schema: "SableReachWorldSpatialFoundationV1",
  targets: WORLD_SPATIAL_TARGETS,
  coordinateReferenceSystem: VEYL_PROJECTED_CRS,
  authorityLevels: SPATIAL_AUTHORITY_LEVELS,
  regions: REGION_SPATIAL_PROFILES,
  sites: SITE_SPATIAL_ENVELOPES,
  traversalSurfaces: TRAVERSAL_SURFACE_PROFILES,
  traversalNetwork: TRAVERSAL_NETWORK,
  sensorFields: SENSOR_FIELD_PROFILES,
  familyHabitats: FAMILY_HABITAT_ENVELOPES,
  expansionCreatureHabitats: EXPANSION_CREATURE_HABITAT_ENVELOPES,
  buildingTypologies: BUILDING_TYPOLOGIES,
  siteActivityCycles: SITE_ACTIVITY_CYCLES,
  environmentalStorytelling: ENVIRONMENTAL_STORYTELLING_LAWS,
  artDirection: ENVIRONMENT_ART_DIRECTION,
  streamingAndLod: WORLD_STREAMING_AND_LOD,
  questLocationPrograms: QUEST_LOCATION_SPATIAL_PROGRAMS,
  questEnvironmentRequirements: QUEST_ENVIRONMENT_REQUIREMENTS,
  questWave04SpatialIndex: QUEST_WAVE_04_SPATIAL_INDEX,
  sourceLedger: WORLD_SPATIAL_SOURCE_LEDGER,
});

export const WORLD_SPATIAL_BY_QUEST_ID = new Map(QUEST_ENVIRONMENT_REQUIREMENTS.map((requirement) => [requirement.questId, requirement]));
export const WORLD_SPATIAL_BY_SITE_ID = new Map(SITE_SPATIAL_ENVELOPES.map((site) => [site.id, site]));
export const WORLD_SPATIAL_BY_FAMILY_ID = new Map(FAMILY_HABITAT_ENVELOPES.map((habitat) => [habitat.familyId, habitat]));
export const WORLD_SPATIAL_BY_EXPANSION_CREATURE_ID = new Map(EXPANSION_CREATURE_HABITAT_ENVELOPES.map((habitat) => [habitat.creatureId, habitat]));
