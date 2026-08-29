export type SpatialAuthority = "canon" | "authored_design_constraint" | "provisional_placement" | "reference";
export type SpatialMaturity =
  | "gis_valid"
  | "production_direction"
  | "habitat_valid"
  | "authored_blockout_contract"
  | "blockout_ready_not_production_geometry"
  | "simulation_contract_not_spawn_schedule"
  | "runtime_budget_direction_not_implementation_claim"
  | "gis_valid_not_production_geometry";

export type Range2 = readonly [minimum: number, maximum: number];
export type Vec2 = readonly [easting: number, northing: number];
export type Vec3 = readonly [easting: number, northing: number, elevation: number];

export interface WorldSpatialTargets {
  readonly schemaVersion: 1;
  readonly authoredQuestCapacity: number;
  readonly currentAcceptedQuestCount: number;
  readonly foundingCreatureFamilyCount: number;
  readonly foundingCreatureFormCount: number;
  readonly currentExpansionCreatureCount: number;
  readonly coordinatePolicy: string;
  readonly placementPolicy: string;
}

export interface SpatialAuthorityLevel {
  readonly id: SpatialAuthority;
  readonly meaning: string;
  readonly coordinateRule: string;
}

export interface VeylProjectedCrs {
  readonly id: "veyl_local_grid_v1";
  readonly name: string;
  readonly classification: "fictional_modeled_not_measured";
  readonly authorityCode: null;
  readonly type: "engineering";
  readonly axes: readonly ["easting", "northing", "elevation"];
  readonly horizontalUnit: "meters";
  readonly verticalUnit: "meters";
  readonly extent: Readonly<{
    minimumEasting: number;
    minimumNorthing: number;
    maximumEasting: number;
    maximumNorthing: number;
    widthMeters: number;
    heightMeters: number;
  }>;
  readonly wkt: string;
  readonly wktSha256: string;
  readonly precisionNotice: string;
  readonly authority: "canon";
  readonly maturity: "gis_valid";
}

export interface RegionSpatialProfile {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly regionId: string;
  readonly envelope: Readonly<{
    coordinateSpaceId: "veyl_local_grid_v1";
    polygon: readonly Vec2[];
    bounds: Readonly<{ minimumEasting: number; minimumNorthing: number; maximumEasting: number; maximumNorthing: number }>;
    boundaryStatus: "atlas_fixed";
  }>;
  readonly substrate: string;
  readonly elevationEnvelopeMeters: Range2;
  readonly landform: readonly string[];
  readonly soils: readonly Readonly<{ id: string; drainage: string; bearing: string; erosion: string }>[];
  readonly hydrology: Readonly<{ streamIds: readonly string[]; terminalIds: readonly string[]; waterTable: string; floodPattern: string }>;
  readonly weather: Readonly<{ precipitation: string; wind: string; thermalBandC: Range2; seasonality: string }>;
  readonly light: Readonly<{ baseline: string; occlusion: string; practicals: string; readableContrast: string }>;
  readonly senses: Readonly<{ visibilityMeters: Range2; acoustic: readonly string[]; scent: readonly string[] }>;
  readonly traversal: Readonly<{ favored: readonly string[]; hazards: readonly string[] }>;
  readonly materialLaw: readonly string[];
  readonly weatheringLaw: readonly string[];
  readonly authority: Readonly<{ envelope: "canon"; environment: "authored_design_constraint" }>;
  readonly maturity: Readonly<{ atlas: "gis_valid"; environment: "production_direction" }>;
}

export interface SiteSpatialEnvelope {
  readonly id: string;
  readonly name: string;
  readonly kind: "settlement" | "ruin";
  readonly territoryId: string;
  readonly atlasAnchor: Readonly<{
    coordinateSpaceId: "veyl_local_grid_v1";
    coordinate: Vec3;
    authority: "canon";
    placementStatus: "atlas_placed";
  }>;
  readonly designEnvelope: Readonly<{
    shape: "radial_influence_not_boundary";
    coreRadiusMeters: number;
    influenceRadiusMeters: number;
    verticalRangeMeters: Range2;
    bounds: Readonly<{ minimumEasting: number; minimumNorthing: number; maximumEasting: number; maximumNorthing: number }>;
    authority: "authored_design_constraint";
    boundaryStatus: "provisional_not_cadastral";
  }>;
  readonly productionStatus: "prototype_playable" | "world_data_only";
  readonly typologyIds: readonly string[];
  readonly populationRange: Range2;
  readonly waterSource: string | null;
  readonly access: string | null;
  readonly subsistence: string | null;
  readonly industry: string | null;
  readonly burialPractice: string | null;
  readonly governance: string | null;
}

export interface TraversalSurfaceProfile {
  readonly id: string;
  readonly tags: readonly string[];
  readonly baseCostMultiplier: number;
  readonly wetCostMultiplier: number;
  readonly cartMultiplier: number | null;
  readonly sound: string;
  readonly scent: string;
  readonly clearanceMeters: number;
}

export interface TraversalNetworkSection {
  readonly id: string;
  readonly routeId: string;
  readonly routeName: string;
  readonly class: "road" | "causeway" | "trail";
  readonly surfaceProfileId: string;
  readonly fromSiteId: string;
  readonly toSiteId: string;
  readonly modeledPolyline: readonly Vec2[];
  readonly modeledLengthMeters: number;
  readonly modeledWalkingSeconds: number;
  readonly crossingIds: readonly string[];
  readonly historicalReason: string;
  readonly authority: "canon";
  readonly maturity: "gis_valid_not_production_geometry";
}

export interface SensorFieldProfile {
  readonly id: string;
  readonly territoryId: string;
  readonly visibility: Readonly<{ baselineMeters: Range2; occluders: readonly string[]; contrastRule: string }>;
  readonly acoustic: Readonly<{ emitters: readonly string[]; propagation: string; masking: readonly string[] }>;
  readonly scent: Readonly<{ emitters: readonly string[]; transport: string }>;
  readonly authority: "authored_design_constraint";
}

export interface FamilyHabitatEnvelope {
  readonly familyId: string;
  readonly familyName: string;
  readonly formIds: readonly string[];
  readonly territoryIds: readonly string[];
  readonly siteIds: readonly string[];
  readonly habitatIds: readonly string[];
  readonly environmentalEnvelope: Readonly<{
    elevationMeters: Range2;
    slopeNormalized: Range2;
    moistureNormalized: Range2;
    corruptionNormalized: Range2;
    substrates: readonly string[];
    canonicalFamilyConstraint: Readonly<Record<string, unknown>>;
  }>;
  readonly activityModes: readonly string[];
  readonly populationEnvelope: Readonly<{ perEncounter: Range2; clustering: readonly string[] }>;
  readonly microhabitats: readonly string[];
  readonly exclusions: readonly string[];
  readonly sensorySignature: Readonly<{ visibilityCue: string; acoustic: string; scent: string }>;
  readonly authority: Readonly<{
    identityAndCanonicalRange: "canon";
    productionEnvelope: "authored_design_constraint";
  }>;
  readonly maturity: "habitat_valid";
}

export interface ExpansionCreatureHabitatEnvelope {
  readonly creatureId: string;
  readonly creatureName: string;
  readonly familyId: string;
  readonly territoryIds: readonly string[];
  readonly siteIds: readonly string[];
  readonly habitatIds: readonly string[];
  readonly spatialMode: string;
  readonly microhabitats: readonly string[];
  readonly environmentalLimits: readonly string[];
  readonly populationEnvelope: Readonly<{ localCount: Range2; clustering: string; authority: "authored_design_constraint" }>;
  readonly activity: string;
  readonly locomotionConstraint: string;
  readonly sensorySignature: Readonly<{ visualCue: string; acoustic: string; scent: string }>;
  readonly canonicalQuestIds: readonly string[];
  readonly placement: Readonly<{ status: "provisional_placement"; exactCoordinate: null }>;
  readonly authority: Readonly<{ identityAndEcology: "canon"; spatialEnvelope: "authored_design_constraint"; atlasPlacement: "provisional_placement" }>;
}

export interface BuildingRoomEdge {
  readonly from: string;
  readonly to: string;
  readonly thresholdId: string;
  readonly access: string;
}

export interface BuildingTypology {
  readonly id: string;
  readonly name: string;
  readonly territoryIds: readonly string[];
  readonly footprintMeters: Range2;
  readonly stories: Range2;
  readonly structure: string;
  readonly exteriorMaterials: readonly string[];
  readonly weathering: readonly string[];
  readonly roof: string;
  readonly utilities: Readonly<{ water: string; heat: string; waste: string; light: string }>;
  readonly roomGraph: Readonly<{ rooms: readonly string[]; edges: readonly BuildingRoomEdge[] }>;
  readonly thresholds: readonly Readonly<{ id: string; rule: string }>[];
  readonly propFamilies: readonly string[];
  readonly traversalRules: readonly string[];
  readonly authority: "authored_design_constraint";
  readonly maturity: "blockout_ready_not_production_geometry";
}

export interface SiteActivityCycle {
  readonly siteId: string;
  readonly residentPopulationRange: Range2;
  readonly populationKinds: readonly string[];
  readonly cycles: readonly Readonly<{ phase: string; activity: readonly string[]; density: string }>[];
  readonly persistentStorySignals: readonly string[];
  readonly authority: "authored_design_constraint";
  readonly maturity: "simulation_contract_not_spawn_schedule";
}

export interface QuestLocationSpatialProgram {
  readonly territoryIds: readonly string[];
  readonly hostSiteId: string | null;
  readonly placementMode: string;
  readonly placementStatus: "provisional_placement";
  readonly exactAtlasCoordinate: null;
  readonly designEnvelopeMeters: readonly [width: number, depth: number, height: number];
  readonly typologyIds: readonly string[];
  readonly materialTags: readonly string[];
  readonly spatialBeats: readonly string[];
  readonly sensory: Readonly<{ visibility: string; acoustic: string; scent: string }>;
  readonly mutableLayers: readonly string[];
  readonly streamingClass: string;
  readonly authority: Readonly<{ identity: "canon"; program: "authored_design_constraint"; atlasPlacement: "provisional_placement" }>;
}

export interface QuestEnvironmentRequirement extends QuestLocationSpatialProgram {
  readonly questId: string;
  readonly questTitle: string;
  readonly locationId: string;
  readonly primaryMechanicId: string;
  readonly canonicalSetpiece: string;
  readonly failForwardEnvironmentMutation: string;
  readonly forbiddenSubstitution: string;
  readonly giverId: string;
  readonly supportingCharacterIds: readonly string[];
  readonly creatureIds: readonly string[];
  readonly stateReads: readonly Readonly<Record<string, unknown>>[];
  readonly stateWrites: readonly Readonly<Record<string, unknown>>[];
  readonly outcomeIds: readonly string[];
  readonly productionChecklist: readonly string[];
  readonly maturity: "authored_blockout_contract";
}

export interface WorldSpatialValidationError {
  readonly path: string;
  readonly code: string;
  readonly message: string;
}

export interface WorldSpatialValidationResult {
  readonly valid: boolean;
  readonly errors: readonly WorldSpatialValidationError[];
  readonly stats: Readonly<{
    regions: number;
    sites: number;
    routeSections: number;
    buildingTypologies: number;
    familyHabitats: number;
    foundingFormsCovered: number;
    expansionCreatureHabitats: number;
    questEnvironments: number;
    authoredQuestCapacity: number;
  }>;
}

export const WORLD_SPATIAL_TARGETS: WorldSpatialTargets;
export const SPATIAL_AUTHORITY_LEVELS: readonly SpatialAuthorityLevel[];
export const VEYL_PROJECTED_CRS: VeylProjectedCrs;
export const REGION_SPATIAL_PROFILES: readonly RegionSpatialProfile[];
export const SITE_SPATIAL_ENVELOPES: readonly SiteSpatialEnvelope[];
export const TRAVERSAL_SURFACE_PROFILES: readonly TraversalSurfaceProfile[];
export const TRAVERSAL_NETWORK: readonly TraversalNetworkSection[];
export const SENSOR_FIELD_PROFILES: readonly SensorFieldProfile[];
export const FAMILY_HABITAT_ENVELOPES: readonly FamilyHabitatEnvelope[];
export const EXPANSION_CREATURE_HABITAT_ENVELOPES: readonly ExpansionCreatureHabitatEnvelope[];
export const BUILDING_TYPOLOGIES: readonly BuildingTypology[];
export const SITE_ACTIVITY_CYCLES: readonly SiteActivityCycle[];
export const ENVIRONMENTAL_STORYTELLING_LAWS: Readonly<Record<string, unknown>>;
export const ENVIRONMENT_ART_DIRECTION: Readonly<Record<string, unknown>>;
export const WORLD_STREAMING_AND_LOD: Readonly<Record<string, unknown>>;
export const QUEST_LOCATION_SPATIAL_PROGRAMS: Readonly<Record<string, QuestLocationSpatialProgram>>;
export const QUEST_ENVIRONMENT_REQUIREMENTS: readonly QuestEnvironmentRequirement[];
export const WORLD_SPATIAL_SOURCE_LEDGER: readonly Readonly<{ path: string; role: string; authority: SpatialAuthority }>[];
export const WORLD_SPATIAL_FOUNDATION: Readonly<{
  schema: "SableReachWorldSpatialFoundationV1";
  targets: WorldSpatialTargets;
  coordinateReferenceSystem: VeylProjectedCrs;
  authorityLevels: readonly SpatialAuthorityLevel[];
  regions: readonly RegionSpatialProfile[];
  sites: readonly SiteSpatialEnvelope[];
  traversalSurfaces: readonly TraversalSurfaceProfile[];
  traversalNetwork: readonly TraversalNetworkSection[];
  sensorFields: readonly SensorFieldProfile[];
  familyHabitats: readonly FamilyHabitatEnvelope[];
  expansionCreatureHabitats: readonly ExpansionCreatureHabitatEnvelope[];
  buildingTypologies: readonly BuildingTypology[];
  siteActivityCycles: readonly SiteActivityCycle[];
  environmentalStorytelling: Readonly<Record<string, unknown>>;
  artDirection: Readonly<Record<string, unknown>>;
  streamingAndLod: Readonly<Record<string, unknown>>;
  questLocationPrograms: Readonly<Record<string, QuestLocationSpatialProgram>>;
  questEnvironmentRequirements: readonly QuestEnvironmentRequirement[];
  sourceLedger: readonly Readonly<{ path: string; role: string; authority: SpatialAuthority }>[];
}>;

export const WORLD_SPATIAL_BY_QUEST_ID: ReadonlyMap<string, QuestEnvironmentRequirement>;
export const WORLD_SPATIAL_BY_SITE_ID: ReadonlyMap<string, SiteSpatialEnvelope>;
export const WORLD_SPATIAL_BY_FAMILY_ID: ReadonlyMap<string, FamilyHabitatEnvelope>;
export const WORLD_SPATIAL_BY_EXPANSION_CREATURE_ID: ReadonlyMap<string, ExpansionCreatureHabitatEnvelope>;

export function validateWorldSpatialFoundation(input?: Readonly<{
  regions?: readonly RegionSpatialProfile[];
  sites?: readonly SiteSpatialEnvelope[];
  routes?: readonly TraversalNetworkSection[];
  familyHabitats?: readonly FamilyHabitatEnvelope[];
  expansionHabitats?: readonly ExpansionCreatureHabitatEnvelope[];
  buildingTypologies?: readonly BuildingTypology[];
  activityCycles?: readonly SiteActivityCycle[];
  questLocations?: Readonly<Record<string, QuestLocationSpatialProgram>>;
  questEnvironments?: readonly QuestEnvironmentRequirement[];
}>): WorldSpatialValidationResult;
