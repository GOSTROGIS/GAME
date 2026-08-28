import {
  BESTIARY as bestiaryData,
  BESTIARY_TARGETS as targetData,
  ENCOUNTER_ROLES as encounterRoleData,
  ENEMY_FAMILIES as familyData,
  validateBestiary as validateData,
} from "./bestiary.data.js";

export type CreatureRank = "regular" | "specialist" | "elite" | "miniboss" | "boss";
export type EncounterRole = "controller" | "skirmisher" | "bruiser" | "artillery" | "support" | "juggernaut" | "ambusher" | "hunter" | "swarm" | "duelist";
export type MaturityFlag = "authored" | "validated" | "habitat_valid" | "encounter_placed" | "runtime_integrated" | "prototype_asset" | "production_asset" | "playtested";
export type NumericRange = readonly [number, number];

export interface CreatureMove {
  readonly id: string;
  readonly name: string;
  readonly damageTags: readonly string[];
  readonly telegraph: { readonly cue: string; readonly seconds: number };
  readonly timing: { readonly startup: number; readonly active: number; readonly recovery: number };
  readonly counterplay: string;
  readonly [property: string]: unknown;
}

export interface HabitatProfile {
  readonly territoryIds: readonly string[];
  readonly siteIds: readonly string[];
  readonly habitatIds: readonly string[];
  readonly elevationMeters: NumericRange;
  readonly slopeNormalized: NumericRange;
  readonly moistureNormalized: NumericRange;
  readonly corruptionNormalized: NumericRange;
  readonly substrates: readonly string[];
  readonly featureDistance: Readonly<Record<string, NumericRange>>;
  readonly activity: string;
  readonly population: { readonly minimum: number; readonly maximum: number; readonly clustering: string };
  readonly associations: readonly string[];
  readonly exclusions: readonly string[];
  readonly uniqueAnchorId: string | null;
  readonly suitabilitySignature: string;
}

export interface CreatureMechanicContract {
  readonly handlerId: string;
  readonly moveId: string;
  readonly timing: CreatureMove["timing"];
  readonly telegraphs: { readonly visual: string; readonly audio: string; readonly seconds: number };
  readonly counterplay: string;
  readonly effects: readonly string[];
  readonly interruptions: readonly string[];
  readonly implementationStatus: "specified" | "implemented" | "playtested";
}

export interface CreatureDefinitionV3 {
  readonly schemaVersion: 3;
  readonly id: string;
  readonly name: string;
  readonly familyId: string;
  readonly rank: CreatureRank;
  readonly boss: boolean;
  readonly regions: readonly string[];
  readonly levelRange: NumericRange;
  readonly lore: string;
  readonly combatRole: EncounterRole;
  readonly silhouette: {
    readonly shape: string;
    readonly posture: string;
    readonly features: readonly string[];
    readonly scale: number;
    readonly palette: readonly string[];
    readonly distinguishingFeature: string;
  };
  readonly damageTags: readonly string[];
  readonly resistanceTags: readonly string[];
  readonly weaknessTags: readonly string[];
  readonly moves: readonly CreatureMove[];
  readonly behaviorPhases: readonly {
    readonly id: string;
    readonly healthRange: NumericRange;
    readonly behavior: string;
    readonly modifiers: Readonly<Record<string, number>>;
  }[];
  readonly drops: readonly { readonly itemId: string; readonly chance: number; readonly quantity: NumericRange }[];
  readonly ecologyTags: readonly string[];
  readonly encounterTags: readonly string[];
  readonly taxonomy: {
    readonly domain: "veyl_thanatic_ecology";
    readonly familyId: string;
    readonly formId: string;
    readonly rank: CreatureRank;
    readonly fictionalAffliction: string;
  };
  readonly anatomy: { readonly anatomicalViolation: string; readonly bodyPlan: string; readonly posture: string; readonly distinguishingFeature: string };
  readonly fictionalPathology: { readonly id: string; readonly vector: "occult_ecology"; readonly manifestation: string; readonly realWorldAnalogue: null };
  readonly locomotion: { readonly rule: string; readonly combatCadence: EncounterRole; readonly recoveryTell: string };
  readonly senses: { readonly primary: string; readonly tell: string; readonly blindSpot: string };
  readonly horrorLanguage: { readonly visual: string; readonly audio: string; readonly ritual: string };
  readonly lifecycle: { readonly origin: string; readonly sustenance: string; readonly propagation: string; readonly cessation: string };
  readonly behaviorContract: { readonly role: EncounterRole; readonly loop: string; readonly groupBehavior: string };
  readonly productionBrief: {
    readonly targetScaleMeters: number;
    readonly assetClass: "standard_creature" | "elite_creature" | "hero_creature";
    readonly requiredClips: readonly string[];
    readonly materialLanguage: readonly string[];
    readonly vfxLanguage: readonly string[];
    readonly audioLanguage: readonly string[];
  };
  readonly codexReveals: readonly { readonly tier: "sighting" | "study" | "mastery"; readonly text: string }[];
  readonly habitatProfile: HabitatProfile;
  readonly mechanicContract: CreatureMechanicContract;
  readonly maturity: Readonly<Record<MaturityFlag, boolean>>;
  readonly designSignature: string;
}

export interface EnemyFamilyDefinition {
  readonly id: string;
  readonly name: string;
  readonly regions: readonly string[];
  readonly ecology: string;
  readonly material: string;
  readonly palette: readonly string[];
  readonly silhouette: { readonly shape: string; readonly posture: string; readonly features: readonly string[] };
  readonly resistanceTags: readonly string[];
  readonly weaknessTags: readonly string[];
  readonly habitat: Readonly<Record<string, unknown>>;
}

export interface BestiaryValidationResult {
  readonly valid: boolean;
  readonly errors: readonly { readonly path: string; readonly code: string; readonly message: string }[];
  readonly stats?: { readonly enemies: number; readonly families: number; readonly bosses: number };
}

export const BESTIARY = bestiaryData as readonly CreatureDefinitionV3[];
export const ENEMY_FAMILIES = familyData as readonly EnemyFamilyDefinition[];
export const ENCOUNTER_ROLES = encounterRoleData as readonly { readonly id: EncounterRole; readonly label: string; readonly purpose: string }[];
export const BESTIARY_TARGETS = targetData as Readonly<{
  enemies: 178;
  families: 21;
  ranks: Readonly<Record<CreatureRank, number>>;
  roles: Readonly<Record<EncounterRole, number>>;
}>;

export function validateBestiary(
  entries: readonly CreatureDefinitionV3[] = BESTIARY,
  families: readonly EnemyFamilyDefinition[] = ENEMY_FAMILIES,
): BestiaryValidationResult {
  return validateData(entries, families) as BestiaryValidationResult;
}

export const BESTIARY_BY_ID: ReadonlyMap<string, CreatureDefinitionV3> = new Map(BESTIARY.map((creature) => [creature.id, creature]));
export const ENEMY_FAMILY_BY_ID: ReadonlyMap<string, EnemyFamilyDefinition> = new Map(ENEMY_FAMILIES.map((family) => [family.id, family]));
