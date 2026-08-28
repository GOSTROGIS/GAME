import {
  validateCreatureMechanicContractV4,
  validateCanonicalTurnAction,
  validateSkillEffectV2,
  type CanonicalTurnTechniqueAction,
  type CreatureMechanicContractV4,
  type SkillEffectScope,
  type SkillEffectV2,
  type TurnReactionTrigger,
  type TurnResolutionBand,
  type TurnTargetRelation,
  type TurnEffectOperationV1,
  type TurnEffectQueryV1,
  type TurnEffectResolutionV1,
  type TurnKernelAuthorityV1,
  type TurnActionSelectionV1,
} from "@hollow-march/shared";
import { BESTIARY, BESTIARY_BY_ID, type CreatureDefinitionV3 } from "./bestiary.js";

export interface CreatureMechanicV4Record {
  readonly creatureId: string;
  readonly familyId: string;
  readonly prototypePlayable: boolean;
  readonly contract: CreatureMechanicContractV4;
}

export interface CreatureTurnEffectHandlerDeclaration {
  readonly id: string;
  readonly creatureId: string;
  readonly moveId: string;
  readonly effectTags: readonly string[];
  readonly implementationStatus: "specified" | "prototype_integrated";
  readonly resolve: TurnKernelAuthorityV1["resolveEffect"];
}

export interface TurnDefeatQuestObjective {
  readonly questId: string;
  readonly objectiveIndex: number;
  readonly required: number;
}

/** Stable defeat objectives mirrored from the canonical quest definitions. */
const TURN_DEFEAT_QUEST_OBJECTIVE_ROWS: readonly (readonly [string, readonly TurnDefeatQuestObjective[]])[] = [
  ["mirebound", [{ questId: "main_bells_below", objectiveIndex: 0, required: 4 }]],
  ["kiln_thrall", [{ questId: "main_the_cinder_seal", objectiveIndex: 1, required: 3 }]],
  ["kiln_knight_rusk", [{ questId: "main_the_cinder_seal", objectiveIndex: 2, required: 1 }]],
  ["hush_monk", [{ questId: "main_a_litany_unspoken", objectiveIndex: 1, required: 5 }]],
  ["cantor_oss", [{ questId: "main_a_litany_unspoken", objectiveIndex: 3, required: 1 }]],
];
export const TURN_DEFEAT_QUEST_OBJECTIVES_BY_CREATURE_ID: ReadonlyMap<string, readonly TurnDefeatQuestObjective[]> = new Map(
  TURN_DEFEAT_QUEST_OBJECTIVE_ROWS.map(([creatureId, objectives]) => [creatureId, Object.freeze(objectives.map((objective) => Object.freeze(objective)))]),
);

export interface TurnQuestSettlementDefinition {
  readonly questId: string;
  readonly chain: string;
  readonly order: number;
  readonly prerequisites: readonly string[];
  readonly objectives: readonly Readonly<{
    type: "defeat" | "discover" | "interact" | "talk" | "acquire";
    target: string;
    required: number;
  }>[];
  readonly rewards: {
    readonly inventory: Readonly<Record<string, number>>;
    readonly skillXp: Readonly<Record<string, number>>;
    readonly unlocks: readonly string[];
  };
}

/** Canonical server settlement subset for defeat-bearing main-chain quests. */
export const TURN_QUEST_SETTLEMENT_DEFINITIONS: readonly TurnQuestSettlementDefinition[] = Object.freeze([
  Object.freeze({
    questId: "main_bells_below", chain: "the_last_bell", order: 2,
    prerequisites: Object.freeze(["main_embers_at_dusk"]), objectives: Object.freeze([
      Object.freeze({ type: "defeat", target: "mirebound", required: 4 }),
      Object.freeze({ type: "discover", target: "sunken_vestry", required: 1 }),
      Object.freeze({ type: "interact", target: "drowned_bell_rope", required: 1 }),
      Object.freeze({ type: "talk", target: "ysra_pell", required: 1 }),
    ]),
    rewards: Object.freeze({ inventory: Object.freeze({ sable_marks: 220, reedward_charm: 1 }), skillXp: Object.freeze({ swordsmanship: 300, runecrafting: 180, wayfaring: 150 }), unlocks: Object.freeze(["main_the_cinder_seal", "dunmire_shortcut"]) }),
  }),
  Object.freeze({
    questId: "main_the_cinder_seal", chain: "the_last_bell", order: 3,
    prerequisites: Object.freeze(["main_bells_below"]), objectives: Object.freeze([
      Object.freeze({ type: "talk", target: "orik_senn", required: 1 }),
      Object.freeze({ type: "defeat", target: "kiln_thrall", required: 3 }),
      Object.freeze({ type: "defeat", target: "kiln_knight_rusk", required: 1 }),
      Object.freeze({ type: "acquire", target: "cinder_seal", required: 1 }),
    ]),
    rewards: Object.freeze({ inventory: Object.freeze({ sable_marks: 500, cinder_seal: 1, tempered_flask_shard: 1 }), skillXp: Object.freeze({ swordsmanship: 700, smithing: 260, vitality: 220 }), unlocks: Object.freeze(["main_a_litany_unspoken", "hollow_abbey_gate"]) }),
  }),
  Object.freeze({
    questId: "main_a_litany_unspoken", chain: "the_last_bell", order: 4,
    prerequisites: Object.freeze(["main_the_cinder_seal"]), objectives: Object.freeze([
      Object.freeze({ type: "interact", target: "abbey_gate", required: 1 }),
      Object.freeze({ type: "defeat", target: "hush_monk", required: 5 }),
      Object.freeze({ type: "discover", target: "last_bell_crypt", required: 1 }),
      Object.freeze({ type: "defeat", target: "cantor_oss", required: 1 }),
      Object.freeze({ type: "interact", target: "memory_clapper", required: 1 }),
    ]),
    rewards: Object.freeze({ inventory: Object.freeze({ sable_marks: 1_200, last_bell_tongue: 1 }), skillXp: Object.freeze({ swordsmanship: 1_400, hexcraft: 900, runecrafting: 500 }), unlocks: Object.freeze(["ending_choice_last_bell", "abbey_crypt_delves"]) }),
  }),
]);

export const TURN_QUEST_SETTLEMENT_DEFINITION_BY_ID: ReadonlyMap<string, TurnQuestSettlementDefinition> = new Map(
  TURN_QUEST_SETTLEMENT_DEFINITIONS.map((definition) => [definition.questId, definition]),
);

type AuthoredCreatureTactic = Readonly<{
  band: TurnResolutionBand;
  apCost: 0 | 1 | 2;
  staminaCost: number;
  focusCost: number;
  targetRule: string;
  targetRelation: TurnTargetRelation;
  reactionTrigger: TurnReactionTrigger;
  rangeMm: number;
  hitChancePermille: number;
  priority: number;
  actionInterrupts: boolean;
  damageBand: readonly [number, number];
  statusIcons: readonly string[];
  posthumous: boolean;
}>;

// Canonical turn authoring. Every row is a reviewed creature decision, not a
// conversion formula. V3 seconds deliberately do not occur in this table.
// Columns: creature | band | AP | stamina | focus | target | relation |
// reaction | range-mm | hit-permille | priority | damage-min | damage-max |
// status icons (+ separated) | posthumous (0/1)
const CREATURE_TURN_AUTHORING = `
ash_husk|heavy|1|20|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|10|24|bleed|0
ledger_crawler|movement|1|16|0|hostile.path_endpoint|hostile|hostile_targeted|4500|920|45|10|18|ashblind+displaced|0
cinder_mourner|standard|1|16|12|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|0|16|24|dread+hexed|0
tagless_stalker|fast|1|16|12|hostile.nearest_reachable|hostile|hostile_targeted|6500|920|25|16|24|hexed+slowed|0
pyre_bailiff|heavy|2|35|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|31|45|burning+drained|0
the_unentered|standard|1|34|22|area.control_anchor|hostile|hostile_targeted|7000|840|0|42|50|ashblind+cursed|0
cairn_hound|fast|1|12|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|25|10|18|punctured|0
lichen_back|fast|1|12|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|940|25|10|18|burning+poisoned|0
stonejaw_vixen|fast|1|16|12|hostile.nearest_reachable|hostile|hostile_targeted|4000|920|25|16|24|dread+wounded|0
warm_cairn_ram|heavy|2|29|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|23|37|staggered|0
graveheat_matron|heavy|2|35|18|area.reinforcement_front.cairn_beasts|hostile|hostile_targeted|5500|840|-25|35|49|reinforced+burning|0
antlered_cairn|heavy|2|42|0|area.authored_telegraph|hostile|hostile_targeted|7000|840|-25|40|54|staggered+threatened|0
orderless_pikeman|heavy|1|20|0|area.authored_telegraph|hostile|hostile_targeted|5500|840|-25|10|24|punctured+rooted|0
wax_seal_archer|standard|1|12|0|area.future_position|hostile|hostile_targeted|5500|780|0|10|22|punctured+marked|0
bannerless_scout|movement|1|20|0|hostile.rear_arc|hostile|hostile_targeted|4000|920|45|16|24|displaced+exposed|0
sealed_sapper|standard|1|16|0|area.authored_telegraph|hostile|hostile_targeted|5500|840|0|14|22|burning+threatened|0
captain_ninth_blank|preemptive|1|30|18|hostile.intent_source|hostile|hostile_targeted|3000|1000|70|31|39|countered+dread|0
marshal_vesk_unreported|heavy|2|42|22|area.reinforcement_front.march_deserters|hostile|hostile_targeted|7000|840|-25|46|60|wounded+reinforced+cursed|0
mirebound|heavy|1|20|0|hostile.front_arc|hostile|hostile_targeted|3000|900|-25|10|24|seized+soaked|0
vestry_drifter|fast|1|12|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|25|10|18|soaked+bleed|0
drowned_deacon|standard|1|16|12|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|0|16|24|soaked+mended|0
font_bearer|heavy|2|29|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|23|37|soaked+chilled|0
sexton_below|standard|1|27|0|area.authored_telegraph|hostile|hostile_targeted|5500|840|0|31|39|soaked+snared|0
parish_that_walks|heavy|2|42|22|area.reinforcement_front.drowned_parish|hostile|hostile_targeted|7000|840|-25|46|60|soaked+staggered+reinforced|0
reed_witch|standard|1|12|8|hostile.line_of_sight|hostile|hostile_targeted|10000|900|0|10|18|hexed+silenced|0
bog_charm_tender|standard|1|12|8|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|0|10|18|hexed+weakened|0
marshlight_midwife|heavy|1|24|12|area.reinforcement_front.reed_coven|hostile|hostile_targeted|5500|840|-25|20|34|reinforced+burning|0
pale_salt_diviner|standard|1|16|12|area.future_position|hostile|hostile_targeted|5500|780|0|16|28|hexed+marked|0
mother_of_reeds|standard|1|27|18|area.authored_telegraph|hostile|hostile_targeted|5500|840|0|31|39|rooted+hexed|0
veksa_nine_masks|standard|1|34|22|hostile.line_of_sight|hostile|hostile_targeted|12000|900|0|42|50|hexed+soaked+cursed|0
kiln_thrall|heavy|1|20|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|10|24|staggered+burning|0
chain_stoker|fast|1|12|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|25|10|18|bleed+burning|0
quenchless_smith|fast|1|16|12|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|25|16|24|burning|0
furnace_shield_guard|heavy|2|29|0|area.authored_telegraph|hostile|hostile_targeted|5500|840|-25|21|35|burning+threatened|0
slag_foreman|standard|1|27|0|area.authored_telegraph|hostile|hostile_targeted|5500|840|0|31|39|burning+snared|0
kiln_knight_rusk|heavy|2|42|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|50|64|staggered+burning+broken_guard|0
shard_tick|fast|1|12|0|area.authored_telegraph|hostile|hostile_targeted|5500|840|25|8|16|bleed+threatened|0
glasswood_hart|fast|1|12|8|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|25|10|18|revealed+bleed|0
razorwing_moth|standard|1|16|0|hostile.line_of_sight|hostile|hostile_targeted|10000|880|0|16|24|bleed+marked|0
sapmirror_lynx|standard|1|21|0|area.future_position|hostile|hostile_targeted|5500|780|0|23|35|bleed+marked|0
ironroot_auroch|heavy|2|35|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|31|45|staggered|0
widow_in_the_glass|movement|1|38|22|hostile.path_endpoint|hostile|hostile_targeted|4500|920|45|42|50|bleed+hexed+displaced|0
hush_monk|preemptive|1|15|0|hostile.intent_source|hostile|hostile_targeted|3000|1000|70|10|18|wounded+countered|0
vow_sweeper|standard|1|12|0|area.authored_telegraph|hostile|hostile_targeted|5500|840|0|8|16|blinded+threatened|0
exact_word_adept|standard|1|16|12|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|0|16|24|silenced+compelled|0
inkless_lector|fast|1|21|14|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|25|23|31|revealed+wounded|0
prior_cord|heavy|2|35|18|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|31|45|wounded+hexed|0
abbot_of_exact_words|fast|1|34|22|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|25|42|50|compelled+revealed+cursed|0
urn_whisper|standard|1|12|8|hostile.line_of_sight|hostile|hostile_targeted|10000|900|0|10|18|resonant+cursed|1
wall_canticle|fast|1|12|8|hostile.nearest_reachable|hostile|hostile_targeted|4000|920|25|10|18|resonant+dread|1
resonance_beadle|standard|1|16|12|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|0|16|24|resonant|0
stone_soprano|standard|1|21|0|hostile.line_of_sight|hostile|hostile_targeted|10000|900|0|23|31|resonant+punctured|0
choirmaster_without_lungs|standard|1|27|0|area.control_anchor|hostile|hostile_targeted|5500|840|0|31|39|resonant+winded|0
cantor_oss|heavy|2|42|22|area.reinforcement_front.echo_choir|hostile|hostile_targeted|7000|840|-25|46|60|resonant+reinforced+revealed|0
finger_mice|fast|1|12|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|940|25|10|18|staggered|0
ribcage_screecher|standard|1|12|8|hostile.line_of_sight|hostile|hostile_targeted|10000|900|0|10|18|resonant+dread|0
borrowed_spine|fast|1|18|0|hostile.cluster_member|hostile|hostile_targeted|3500|900|25|19|29|staggered+rattled|0
reliquary_millipede|heavy|2|29|14|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|23|37|revealed+wounded|0
crypt_assembler|aftermath|2|27|18|ally.lowest_vitality|ally|none|8000|1000|-50|0|0|reinforcement.ossuary_vermin+mended|0
the_borrowed_saint|heavy|2|42|22|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|42|56|revealed+staggered+cursed|0
ropewalker|movement|1|16|0|hostile.path_endpoint|hostile|hostile_targeted|4500|900|45|10|18|staggered+displaced|0
clapper_squire|heavy|1|20|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|10|24|staggered+resonant|0
verdigris_ringer|standard|1|16|0|area.control_anchor|hostile|hostile_targeted|5500|840|0|16|24|poisoned+resonant|0
memory_carillonneur|fast|1|21|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|25|23|31|wounded+guarded|0
dusk_toll_collector|fast|1|27|0|hostile.nearest_reachable|hostile|hostile_targeted|6500|920|25|31|39|resonant+drained|0
bell_without_tower|heavy|2|42|0|area.authored_telegraph|hostile|hostile_targeted|7000|840|-25|40|54|staggered+resonant+threatened|1
salt_veil_strider|heavy|1|20|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|10|24|chilled+blinded|0
mirror_beetle|movement|1|16|0|hostile.path_endpoint|hostile|hostile_targeted|4500|900|45|10|18|displaced+staggered|0
sealed_mirror_bearer|standard|1|16|12|hostile.line_of_sight|hostile|hostile_targeted|10000|900|0|16|24|revealed+cursed|0
brine_oracle|standard|1|21|0|area.authored_telegraph|hostile|hostile_targeted|5500|840|0|23|31|chilled+rooted|0
caravan_of_one|heavy|2|35|18|area.reinforcement_front.salt_waste|hostile|hostile_targeted|5500|840|-25|35|49|reinforced+staggered|0
saint_of_closed_mirrors|standard|1|34|22|area.authored_telegraph|hostile|hostile_targeted|7000|840|0|40|48|revealed+cursed+threatened|0
coral_knuckle|heavy|1|20|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|10|24|staggered+soaked|0
moonless_netling|fast|1|12|8|area.authored_telegraph|hostile|hostile_targeted|5500|840|25|10|18|rooted+hexed|0
lantern_gilled_raider|heavy|1|24|12|area.reinforcement_front.veil_coast|hostile|hostile_targeted|5500|840|-25|20|34|reinforced+soaked|0
undertow_harpooner|fast|1|21|0|hostile.front_arc|hostile|hostile_targeted|6500|920|25|23|31|punctured+pulled+soaked|0
reefwife_karra|standard|1|27|0|area.authored_telegraph|hostile|hostile_targeted|5500|840|0|31|39|staggered+soaked+snared|0
admiral_of_the_inland_tide|heavy|2|42|0|area.authored_telegraph|hostile|hostile_targeted|7000|840|-25|40|54|soaked+staggered+threatened|0
ash_tenant|standard|1|12|8|area.authored_telegraph|hostile|hostile_targeted|5500|840|0|8|16|hexed+threatened|0
wicket_eater|movement|1|16|0|hostile.path_endpoint|hostile|hostile_targeted|4500|900|45|10|18|wounded+displaced|0
smoke_notary|heavy|1|24|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|16|30|staggered+wounded|0
redaction_warden|standard|1|21|14|hostile.line_of_sight|hostile|hostile_targeted|10000|880|0|23|31|marked+cursed|0
cairn_maggot|movement|1|16|8|area.marker_roll_line|hostile|hostile_targeted|4500|900|45|10|18|hexed+marked|0
flint_pelt|heavy|1|20|0|area.authored_telegraph|hostile|hostile_targeted|5500|840|-25|8|22|staggered+threatened|0
barrow_listener|fast|1|16|12|hostile.nearest_reachable|hostile|hostile_targeted|4000|920|25|16|24|wounded+dread|0
oathstone_boar|fast|1|21|0|hostile.highest_mobility|hostile|hostile_targeted|7000|920|25|23|31|punctured+marked|0
receipt_soldier|fast|1|14|0|hostile.cluster_member|hostile|hostile_targeted|3500|940|25|13|23|wounded+rattled|0
trench_waif|preemptive|1|15|0|hostile.intent_source|hostile|hostile_targeted|3000|1000|70|10|18|wounded+countered|0
command_leech|standard|1|16|12|area.authored_telegraph|hostile|hostile_targeted|5500|840|0|14|22|hexed+threatened|0
armistice_giant|movement|1|25|0|hostile.path_endpoint|hostile|hostile_targeted|4500|900|45|23|31|wounded+displaced|0
aisle_floater|heavy|1|20|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|10|24|staggered+wounded|0
hymn_eel|standard|1|12|8|hostile.line_of_sight|hostile|hostile_targeted|10000|880|0|10|18|marked+cursed|0
tide_sacristan|aftermath|1|16|12|ally.procession_front|ally|none|8000|1000|-50|0|0|cold_vigil+warded|0
drowned_nave|heavy|2|29|0|area.authored_telegraph|hostile|hostile_targeted|5500|840|-25|21|35|staggered+threatened|0
charm_mite|fast|1|12|8|hostile.nearest_reachable|hostile|hostile_targeted|4000|920|25|10|18|wounded+dread|0
wicker_child|fast|1|12|0|hostile.highest_mobility|hostile|hostile_targeted|7000|920|25|10|18|punctured+marked|0
fog_loaner|fast|1|18|0|hostile.cluster_member|hostile|hostile_targeted|3500|940|25|19|29|wounded+rattled|0
knot_leg_magus|preemptive|1|24|0|hostile.intent_source|hostile|hostile_targeted|3000|1000|70|23|31|wounded+countered|0
furnace_louse|standard|1|12|8|area.authored_telegraph|hostile|hostile_targeted|5500|840|0|8|16|hexed+threatened|0
clinker_page|movement|1|16|0|hostile.path_endpoint|hostile|hostile_targeted|4500|900|45|10|18|wounded+displaced|0
draft_taster|heavy|1|24|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|16|30|staggered+wounded|0
crucible_centurion|standard|1|21|14|hostile.line_of_sight|hostile|hostile_targeted|10000|880|0|23|31|marked+cursed|0
prism_larva|standard|1|12|8|hostile.missing_resistance|hostile|hostile_targeted|7000|920|0|10|18|exposed+hexed|0
splinter_doe|heavy|1|20|0|area.authored_telegraph|hostile|hostile_targeted|5500|840|-25|8|22|staggered+threatened|0
reflection_finch|fast|1|16|12|hostile.nearest_reachable|hostile|hostile_targeted|4000|920|25|16|24|wounded+dread|0
cathedral_stag|fast|1|21|0|hostile.highest_mobility|hostile|hostile_targeted|7000|920|25|23|31|punctured+marked|0
dust_novice|fast|1|14|0|hostile.cluster_member|hostile|hostile_targeted|3500|940|25|13|23|wounded+rattled|0
mute_porter|preemptive|1|15|0|hostile.intent_source|hostile|hostile_targeted|3000|1000|70|10|18|wounded+countered|0
pause_inquisitor|standard|1|16|12|area.authored_telegraph|hostile|hostile_targeted|5500|840|0|14|22|hexed+threatened|0
comma_blade|movement|1|25|0|hostile.path_endpoint|hostile|hostile_targeted|4500|900|45|23|31|wounded+displaced|0
breathless_note|heavy|1|20|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|10|24|staggered+wounded|1
urn_moth|standard|1|12|8|hostile.line_of_sight|hostile|hostile_targeted|10000|880|0|10|18|marked+cursed|0
interval_thief|standard|1|18|12|area.stolen_rest_gap|hostile|hostile_targeted|5500|840|0|16|24|hexed+winded|0
nave_resonator|heavy|2|29|0|area.authored_telegraph|hostile|hostile_targeted|5500|840|-25|21|35|staggered+threatened|0
tooth_rook|fast|1|12|8|hostile.nearest_reachable|hostile|hostile_targeted|4000|920|25|10|18|wounded+dread|0
heel_crab|fast|1|12|0|hostile.highest_mobility|hostile|hostile_targeted|7000|920|25|10|18|punctured+marked|0
marrow_factor|fast|1|18|0|hostile.cluster_member|hostile|hostile_targeted|3500|940|25|19|29|wounded+rattled|0
pelvis_paladin|preemptive|1|24|0|hostile.intent_source|hostile|hostile_targeted|3000|1000|70|23|31|wounded+countered|0
rope_larva|standard|1|12|8|area.authored_telegraph|hostile|hostile_targeted|5500|840|0|8|16|hexed+threatened|0
cracked_acolyte|movement|1|16|0|hostile.path_endpoint|hostile|hostile_targeted|4500|900|45|10|18|wounded+displaced|0
echo_sutler|heavy|1|24|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|16|30|staggered+wounded|0
vesper_engine|standard|1|21|14|hostile.line_of_sight|hostile|hostile_targeted|10000|880|0|23|31|marked+cursed|0
needle_pilgrim|movement|1|16|8|area.eastward_fall_line|hostile|hostile_targeted|5500|880|45|10|18|hexed+displaced|0
compass_slug|heavy|1|20|0|area.authored_telegraph|hostile|hostile_targeted|5500|840|-25|8|22|staggered+threatened|0
eastward_witness|fast|1|16|12|hostile.nearest_reachable|hostile|hostile_targeted|4000|920|25|16|24|wounded+dread|0
latitude_abductor|fast|1|21|0|hostile.highest_mobility|hostile|hostile_targeted|7000|920|25|23|31|punctured+marked|0
pearl_lamprey|fast|1|14|0|hostile.cluster_member|hostile|hostile_targeted|3500|940|25|13|23|wounded+rattled|0
keel_crawler|preemptive|1|15|0|hostile.intent_source|hostile|hostile_targeted|3000|1000|70|10|18|wounded+countered|0
brackish_mimic|standard|1|16|12|area.authored_telegraph|hostile|hostile_targeted|5500|840|0|14|22|hexed+threatened|0
coral_reeve|movement|1|25|0|hostile.path_endpoint|hostile|hostile_targeted|4500|900|45|23|31|wounded+displaced|0
sheet_orderly|heavy|1|20|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|10|24|staggered+wounded|0
wax_nurse|standard|1|12|8|hostile.line_of_sight|hostile|hostile_targeted|10000|880|0|10|18|marked+cursed|0
curtain_listener|standard|1|18|12|hostile.audible_action_source|hostile|hostile_targeted|10000|920|0|16|24|silenced+hexed|0
night_physician|heavy|2|29|0|area.authored_telegraph|hostile|hostile_targeted|5500|840|-25|21|35|staggered+threatened|0
matron_empty_beds|fast|1|27|18|hostile.nearest_reachable|hostile|hostile_targeted|4000|920|25|31|39|wounded+dread|0
house_that_cares|fast|1|34|0|hostile.highest_mobility|hostile|hostile_targeted|7000|920|25|42|50|punctured+marked|0
drawerling|fast|1|14|0|hostile.cluster_member|hostile|hostile_targeted|3500|940|25|13|23|wounded+rattled|0
tally_corpse|preemptive|1|15|0|hostile.intent_source|hostile|hostile_targeted|3000|1000|70|10|18|wounded+countered|0
plumb_line_butcher|standard|1|16|12|area.authored_telegraph|hostile|hostile_targeted|5500|840|0|14|22|hexed+threatened|0
folded_registrar|movement|1|25|0|hostile.path_endpoint|hostile|hostile_targeted|4500|900|45|23|31|wounded+displaced|0
master_cubit|heavy|2|35|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|31|45|staggered+wounded|0
warehouse_one_body|standard|1|34|22|hostile.line_of_sight|hostile|hostile_targeted|12000|880|0|42|50|marked+cursed|0
gutter_double|movement|1|16|8|area.counterflow_drainage_line|hostile|hostile_targeted|5500|880|45|10|18|soaked+displaced|0
puddle_face|fast|1|12|8|hostile.nearest_reachable|hostile|hostile_targeted|4000|920|25|10|18|wounded+dread|0
upstream_widow|fast|1|16|0|hostile.highest_mobility|hostile|hostile_targeted|7000|920|25|16|24|punctured+marked|0
culvert_bishop|fast|1|23|0|hostile.cluster_member|hostile|hostile_targeted|3500|940|25|26|36|wounded+rattled|0
keeper_beneath_grate|preemptive|1|30|0|hostile.intent_source|hostile|hostile_targeted|3000|1000|70|31|39|wounded+countered|0
river_remembers_backward|movement|1|38|0|hostile.path_endpoint|hostile|hostile_targeted|4500|900|45|42|50|wounded+displaced|1
wheel_porter|heavy|1|20|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|10|24|staggered+wounded|0
wax_driver|standard|1|12|8|hostile.line_of_sight|hostile|hostile_targeted|10000|880|0|10|18|marked+cursed|0
route_surgeon|standard|1|18|12|area.landmark_line_cut|hostile|hostile_targeted|5500|880|0|16|26|severed_route+hexed|0
last_outrider|fast|1|21|14|hostile.nearest_reachable|hostile|hostile_targeted|4000|920|25|23|31|wounded+dread|0
empty_caravan|fast|1|27|0|hostile.highest_mobility|hostile|hostile_targeted|7000|920|25|31|39|punctured+marked|0
destination_erased|fast|1|36|0|hostile.cluster_member|hostile|hostile_targeted|3500|940|25|45|55|wounded+rattled|1
sleeve_crawler|movement|1|16|0|hostile.path_endpoint|hostile|hostile_targeted|4500|900|45|10|18|wounded+displaced|0
exhale_rag|heavy|1|20|0|hostile.nearest_reachable|hostile|hostile_targeted|3000|900|-25|10|24|staggered+wounded|0
voice_assessor|standard|1|16|12|hostile.line_of_sight|hostile|hostile_targeted|10000|880|0|16|24|marked+cursed|0
hollow_smelter|movement|1|25|14|area.pressure_relocation|hostile|hostile_targeted|5500|840|45|23|33|burning+displaced|0
ninth_breath_collector|fast|1|27|18|hostile.nearest_reachable|hostile|hostile_targeted|4000|920|25|31|39|wounded+dread|0
lung_tax_office|fast|1|34|0|hostile.highest_mobility|hostile|hostile_targeted|7000|920|25|42|50|punctured+marked|0
salt_compass|fast|1|14|0|hostile.cluster_member|hostile|hostile_targeted|3500|940|25|13|23|wounded+rattled|0
horizon_kneeler|movement|1|16|0|hostile.path_endpoint|hostile|hostile_targeted|4500|900|45|10|18|wounded+displaced|0
direction_eater|standard|1|16|12|hostile.line_of_sight|hostile|hostile_targeted|10000|880|0|16|24|marked+cursed|0
meridian_widow|standard|1|21|14|hostile.opposed_shadow|hostile|hostile_targeted|7000|920|0|23|33|blinded+marked|0
eastmost_penitent|fast|1|27|18|hostile.nearest_reachable|hostile|hostile_targeted|4000|920|25|31|39|wounded+dread|0
destination_without_land|fast|1|34|0|hostile.highest_mobility|hostile|hostile_targeted|7000|920|25|42|50|punctured+marked|0
root_fingerling|fast|1|14|0|hostile.cluster_member|hostile|hostile_targeted|3500|940|25|13|23|wounded+rattled|0
grave_cap|movement|1|16|0|hostile.path_endpoint|hostile|hostile_targeted|4500|900|45|10|18|wounded+displaced|0
nerve_gardener|fast|1|16|12|hostile.nearest_reachable|hostile|hostile_targeted|4000|920|25|16|24|wounded+dread|0
communion_walker|fast|1|21|0|hostile.highest_mobility|hostile|hostile_targeted|7000|920|25|23|31|punctured+marked|0
pallid_sexton|fast|1|29|0|hostile.cluster_member|hostile|hostile_targeted|3500|940|25|34|44|wounded+rattled|0
orchard_below|movement|1|38|0|hostile.path_endpoint|hostile|hostile_targeted|4500|900|45|42|50|wounded+displaced|0
hawser_hand|fast|1|12|8|hostile.nearest_reachable|hostile|hostile_targeted|4000|920|25|10|18|wounded+dread|0
buoy_corpse|fast|1|12|0|hostile.highest_mobility|hostile|hostile_targeted|7000|920|25|10|18|punctured+marked|0
signal_mate|fast|1|18|0|hostile.cluster_member|hostile|hostile_targeted|3500|940|25|19|29|wounded+rattled|0
quarantine_bosun|movement|1|25|0|hostile.path_endpoint|hostile|hostile_targeted|4500|900|45|23|31|wounded+displaced|0
captain_under_keel|fast|1|27|0|hostile.highest_mobility|hostile|hostile_targeted|7000|920|25|31|39|punctured+marked|0
fleet_one_shadow|fast|1|36|0|hostile.cluster_member|hostile|hostile_targeted|3500|940|25|45|55|wounded+rattled|1
`.trim();

const PROTOTYPE_PLAYABLE_CREATURE_IDS = new Set([
  "ash_husk", "cairn_hound", "orderless_pikeman", "mirebound", "reed_witch", "kiln_thrall", "shard_tick",
  "hush_monk", "urn_whisper", "finger_mice", "ropewalker", "salt_veil_strider", "coral_knuckle",
  "sheet_orderly", "drawerling", "gutter_double", "wheel_porter", "sleeve_crawler", "salt_compass",
  "root_fingerling", "hawser_hand",
]);

const parseInteger = (raw: string, label: string): number => {
  if (!/^-?\d+$/.test(raw)) throw new Error(`${label} must be an integer`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value)) throw new Error(`${label} is outside the safe integer range`);
  return value;
};

const parseCreatureTurnAuthoring = (): ReadonlyMap<string, AuthoredCreatureTactic> => {
  const rows = new Map<string, AuthoredCreatureTactic>();
  for (const [rowIndex, row] of CREATURE_TURN_AUTHORING.split("\n").entries()) {
    const fields = row.split("|");
    if (fields.length !== 15) throw new Error(`Creature turn authoring row ${rowIndex + 1} has ${fields.length} fields`);
    const [creatureId, bandRaw, apRaw, staminaRaw, focusRaw, targetRule, relationRaw, reactionRaw, rangeRaw, hitRaw, priorityRaw, minimumRaw, maximumRaw, statusesRaw, posthumousRaw] = fields as [string, string, string, string, string, string, string, string, string, string, string, string, string, string, string];
    if (rows.has(creatureId)) throw new Error(`Duplicate creature turn authoring row ${creatureId}`);
    const apCost = parseInteger(apRaw, `${creatureId}.apCost`);
    const statusIcons = statusesRaw.split("+").filter(Boolean);
    const tactic: AuthoredCreatureTactic = Object.freeze({
      band: bandRaw as TurnResolutionBand,
      apCost: apCost as 0 | 1 | 2,
      staminaCost: parseInteger(staminaRaw, `${creatureId}.staminaCost`),
      focusCost: parseInteger(focusRaw, `${creatureId}.focusCost`),
      targetRule,
      targetRelation: relationRaw as TurnTargetRelation,
      reactionTrigger: reactionRaw as TurnReactionTrigger,
      rangeMm: parseInteger(rangeRaw, `${creatureId}.rangeMm`),
      hitChancePermille: parseInteger(hitRaw, `${creatureId}.hitChancePermille`),
      priority: parseInteger(priorityRaw, `${creatureId}.priority`),
      // Interrupting the creature is counterplay metadata, not permission for
      // its action to interrupt a target. Explicit action authoring defaults off.
      actionInterrupts: false,
      damageBand: Object.freeze([parseInteger(minimumRaw, `${creatureId}.damageMinimum`), parseInteger(maximumRaw, `${creatureId}.damageMaximum`)] as [number, number]),
      statusIcons: Object.freeze(statusIcons),
      posthumous: posthumousRaw === "1",
    });
    if (posthumousRaw !== "0" && posthumousRaw !== "1") throw new Error(`${creatureId}.posthumous must be 0 or 1`);
    rows.set(creatureId, tactic);
  }
  return rows;
};

const authoredCreatureTactics = parseCreatureTurnAuthoring();

const makeCreatureV4Record = (creature: CreatureDefinitionV3): CreatureMechanicV4Record => {
  const authored = authoredCreatureTactics.get(creature.id);
  if (!authored) throw new Error(`Missing CreatureMechanicContractV4 authoring for ${creature.id}`);
  const prototypePlayable = PROTOTYPE_PLAYABLE_CREATURE_IDS.has(creature.id);
  const contract: CreatureMechanicContractV4 = Object.freeze({
    version: 4,
    handlerId: creature.mechanicContract.handlerId,
    moveId: creature.mechanicContract.moveId,
    presentationV3: Object.freeze({
      startupSeconds: creature.mechanicContract.timing.startup,
      activeSeconds: creature.mechanicContract.timing.active,
      recoverySeconds: creature.mechanicContract.timing.recovery,
      telegraphSeconds: creature.mechanicContract.telegraphs.seconds,
    }),
    turn: Object.freeze({
      ...authored,
      effectHandlerId: `turn.creature.${creature.id}.${creature.mechanicContract.moveId}`,
      sensoryCue: creature.mechanicContract.telegraphs.visual,
      interruptRule: creature.mechanicContract.interruptions.join(" + "),
      counterplay: creature.mechanicContract.counterplay,
    }),
    implementationStatus: prototypePlayable ? "implemented" : "specified",
  });
  validateCreatureMechanicContractV4(contract);
  return Object.freeze({ creatureId: creature.id, familyId: creature.familyId, prototypePlayable, contract });
};

export const CREATURE_MECHANIC_CONTRACTS_V4: readonly CreatureMechanicV4Record[] = Object.freeze(BESTIARY.map(makeCreatureV4Record));

if (authoredCreatureTactics.size !== BESTIARY.length) {
  const unknown = [...authoredCreatureTactics.keys()].filter((id) => !BESTIARY_BY_ID.has(id));
  throw new Error(`Creature turn authoring has ${authoredCreatureTactics.size} rows for ${BESTIARY.length} creatures; unknown: ${unknown.join(", ")}`);
}

export const CREATURE_MECHANIC_V4_BY_CREATURE_ID: ReadonlyMap<string, CreatureMechanicV4Record> = new Map(
  CREATURE_MECHANIC_CONTRACTS_V4.map((record) => [record.creatureId, record]),
);
export const CREATURE_MECHANIC_V4_BY_HANDLER_ID: ReadonlyMap<string, CreatureMechanicV4Record> = new Map(
  CREATURE_MECHANIC_CONTRACTS_V4.map((record) => [record.contract.handlerId, record]),
);

const unresolvedEffect = (reason: string): TurnEffectResolutionV1 => Object.freeze({ resolved: false, reason, operations: Object.freeze([]) });

const makeCreatureEffectResolver = (
  record: CreatureMechanicV4Record,
  creature: CreatureDefinitionV3,
): TurnKernelAuthorityV1["resolveEffect"] => (query: TurnEffectQueryV1): TurnEffectResolutionV1 => {
  if (query.action.effectHandlerId !== record.contract.turn.effectHandlerId) return unresolvedEffect("effect_handler_mismatch");
  const relation = record.contract.turn.targetRelation;
  const selectedTargetId = relation === "self" ? query.actor.actorId : query.action.targetActorId;
  if (!selectedTargetId) return unresolvedEffect("target_required");
  const selectedTarget = query.actors.find(({ actorId }) => actorId === selectedTargetId);
  if (!selectedTarget) return unresolvedEffect("target_missing");
  if (relation === "hostile" && selectedTarget.team === query.actor.team) return unresolvedEffect("hostile_target_required");
  if (relation === "ally" && selectedTarget.team !== query.actor.team) return unresolvedEffect("ally_target_required");
  if (relation === "self" && selectedTarget.actorId !== query.actor.actorId) return unresolvedEffect("self_target_required");

  const operations: TurnEffectOperationV1[] = [];
  if (record.contract.turn.band === "movement" && query.action.destinationMm && query.action.destinationYawTenThousandthRadians !== undefined) {
    operations.push({
      kind: "destination",
      actorId: query.actor.actorId,
      destinationMm: query.action.destinationMm,
      destinationYawTenThousandthRadians: query.action.destinationYawTenThousandthRadians,
    });
  }

  const isHealing = creature.mechanicContract.effects.some((tag) => tag === "heal" || tag === "healing");
  if (isHealing && relation !== "hostile" && (query.action.healing ?? 0) > 0) {
    operations.push({ kind: "heal", targetActorId: selectedTarget.actorId, amount: Math.min(query.action.healing!, Math.max(1, record.contract.turn.damageBand[1] || 24)) });
  } else if (relation === "hostile" && (query.action.damage ?? 0) > 0) {
    operations.push({ kind: "damage", targetActorId: selectedTarget.actorId, amount: Math.min(query.action.damage!, record.contract.turn.damageBand[1]) });
  }

  const primaryStatus = record.contract.turn.statusIcons[0];
  if (primaryStatus) {
    if (relation === "hostile") {
      operations.push({ kind: "status", targetActorId: selectedTarget.actorId, statusId: primaryStatus, stacks: 1, durationRounds: record.contract.turn.apCost === 2 ? 2 : 1 });
    } else {
      operations.push({ kind: "buff", targetActorId: selectedTarget.actorId, buffId: primaryStatus, magnitude: record.contract.turn.apCost === 2 ? 2 : 1, durationRounds: 1 });
    }
  }
  return operations.length > 0 ? Object.freeze({ resolved: true, operations: Object.freeze(operations) }) : unresolvedEffect("no_authored_operation");
};

export const CREATURE_TURN_EFFECT_HANDLERS: readonly CreatureTurnEffectHandlerDeclaration[] = Object.freeze(
  CREATURE_MECHANIC_CONTRACTS_V4.map((record) => {
    const creature = BESTIARY_BY_ID.get(record.creatureId)!;
    return Object.freeze({
      id: record.contract.turn.effectHandlerId,
      creatureId: record.creatureId,
      moveId: record.contract.moveId,
      effectTags: Object.freeze([...creature.mechanicContract.effects]),
      implementationStatus: record.prototypePlayable ? "prototype_integrated" as const : "specified" as const,
      resolve: makeCreatureEffectResolver(record, creature),
    });
  }),
);

export const CREATURE_TURN_EFFECT_HANDLER_BY_ID: ReadonlyMap<string, CreatureTurnEffectHandlerDeclaration> = new Map(
  CREATURE_TURN_EFFECT_HANDLERS.map((handler) => [handler.id, handler]),
);

export const CREATURE_TURN_EFFECT_RESOLVER_BY_ID: ReadonlyMap<string, TurnKernelAuthorityV1["resolveEffect"]> = new Map(
  CREATURE_TURN_EFFECT_HANDLERS.map((handler) => [handler.id, handler.resolve]),
);

export const resolveCreatureTurnEffect: TurnKernelAuthorityV1["resolveEffect"] = (query) => (
  CREATURE_TURN_EFFECT_RESOLVER_BY_ID.get(query.action.effectHandlerId)?.(query) ?? unresolvedEffect("unknown_creature_effect_handler")
);

export type CombatSkillSourceKind = "technique" | "action";
export type CombatSkillResolutionMode = "passive_modifier" | "achievement_observer";

export interface CombatSkillEffectMigration {
  readonly sourceKind: CombatSkillSourceKind;
  readonly resolutionMode: CombatSkillResolutionMode;
  readonly skillId: string;
  readonly legacyId: string;
  readonly legacyHandlerId: string;
  readonly effect: SkillEffectV2;
}

export interface CombatSkillEffectHandlerRegistration {
  readonly id: string;
  readonly migrationId: string;
  readonly legacyHandlerId: string;
  readonly resolutionMode: CombatSkillResolutionMode;
  readonly resolve: TurnKernelAuthorityV1["resolveEffect"];
}

// Filled below by the checked combat-only migration table. Gathering, artisan,
// runecrafting, and wayfaring timing contracts deliberately remain outside it.
const COMBAT_SKILL_EFFECT_AUTHORING = `
swordsmanship.quiet_edge|technique|combat.stamina.light_attack|encounter|passive_modifier|fast|passive.combat.stamina.light_attack|self|75
swordsmanship.pulse_step|technique|combat.dodge.entry|encounter|passive_modifier|preemptive|passive.combat.dodge.entry|self|95
swordsmanship.low_guard|technique|combat.poise.low_stamina|encounter|passive_modifier|fast|passive.combat.poise.low_stamina|self|75
swordsmanship.measured_three|technique|combat.combo.sequence|encounter|passive_modifier|standard|passive.combat.combo.sequence|self|65
swordsmanship.duelist_vow|technique|combat.stance.duelist|encounter|passive_modifier|standard|passive.combat.stance.duelist|self|65
swordsmanship.reaver_vow|technique|combat.stance.reaver|encounter|passive_modifier|standard|passive.combat.stance.reaver|self|65
swordsmanship.borrowed_momentum|technique|combat.dodge.near_miss|encounter|passive_modifier|preemptive|passive.combat.dodge.near_miss|self|95
swordsmanship.silver_thread|technique|combat.hit.thrust_precision|encounter|passive_modifier|standard|passive.combat.hit.thrust_precision|self|65
swordsmanship.red_harvest|technique|combat.hit.sweep_finisher|encounter|passive_modifier|standard|passive.combat.hit.sweep_finisher|self|65
swordsmanship.sever_the_intent|technique|combat.interrupt.weapon|encounter|passive_modifier|preemptive|passive.combat.interrupt.weapon|self|95
swordsmanship.death_between_beats|technique|combat.riposte.perfect|encounter|passive_modifier|preemptive|passive.combat.riposte.perfect|self|95
swordsmanship.unanswered_cut|technique|combat.capstone.swordsmanship|encounter|passive_modifier|aftermath|passive.combat.capstone.swordsmanship|self|45
swordsmanship.mixed_chain|action|combat.combo.complete|encounter|achievement_observer|standard|observer.combat.combo.complete|self|-65
swordsmanship.timed_guard_cut|action|combat.guard_cut.perfect|encounter|achievement_observer|preemptive|observer.combat.guard_cut.perfect|self|-35
swordsmanship.weak_point_thrust|action|combat.weak_point.thrust|encounter|achievement_observer|fast|observer.combat.weak_point.thrust|self|-55
swordsmanship.riposte_elite|action|combat.riposte.elite|encounter|achievement_observer|preemptive|observer.combat.riposte.elite|self|-35
swordsmanship.stance_sequence|action|combat.stance.sequence|encounter|achievement_observer|standard|observer.combat.stance.sequence|self|-65
swordsmanship.no_hit_duel|action|combat.encounter.no_hit|encounter|achievement_observer|preemptive|observer.combat.encounter.no_hit|self|-35
swordsmanship.sever_boss_cast|action|combat.interrupt.boss|encounter|achievement_observer|preemptive|observer.combat.interrupt.boss|self|-35
swordsmanship.seven_cut_cadence|action|combat.mastery.cadence|encounter|achievement_observer|aftermath|observer.combat.mastery.cadence|self|-85
heavy_arms.centered_heft|technique|combat.weight.heavy_weapon|encounter|passive_modifier|heavy|passive.combat.weight.heavy_weapon|self|55
heavy_arms.heel_turn|technique|combat.recovery.turn_rate|encounter|passive_modifier|aftermath|passive.combat.recovery.turn_rate|self|45
heavy_arms.stone_shoulders|technique|combat.poise.charge_start|encounter|passive_modifier|heavy|passive.combat.poise.charge_start|self|55
heavy_arms.falling_bell|technique|combat.hit.overhead|encounter|passive_modifier|standard|passive.combat.hit.overhead|self|65
heavy_arms.breaker_path|technique|combat.stance.breaker|encounter|passive_modifier|standard|passive.combat.stance.breaker|self|65
heavy_arms.storm_path|technique|combat.stance.storm|encounter|passive_modifier|standard|passive.combat.stance.storm|self|65
heavy_arms.aftershock|technique|combat.hit.full_charge|encounter|passive_modifier|heavy|passive.combat.hit.full_charge|self|55
heavy_arms.kiln_splitter|technique|combat.guard_pressure|encounter|passive_modifier|preemptive|passive.combat.guard_pressure|self|95
heavy_arms.wheel_of_iron|technique|combat.movement.heavy_chain|encounter|passive_modifier|movement|passive.combat.movement.heavy_chain|self|85
heavy_arms.burden_becomes_power|technique|combat.weight.to_power|encounter|passive_modifier|heavy|passive.combat.weight.to_power|self|55
heavy_arms.grave_nail|technique|combat.plunge.heavy|encounter|passive_modifier|movement|passive.combat.plunge.heavy|self|85
heavy_arms.world_ending_stroke|technique|combat.capstone.heavy_arms|encounter|passive_modifier|heavy|passive.combat.capstone.heavy_arms|self|55
heavy_arms.charged_impact|action|combat.charge.full_hit|encounter|achievement_observer|heavy|observer.combat.charge.full_hit|self|-75
heavy_arms.break_guard|action|combat.guard.break|encounter|achievement_observer|preemptive|observer.combat.guard.break|self|-35
heavy_arms.multi_stagger|action|combat.stagger.multi|encounter|achievement_observer|heavy|observer.combat.stagger.multi|self|-75
heavy_arms.plunge_elite|action|combat.plunge.elite|encounter|achievement_observer|movement|observer.combat.plunge.elite|self|-45
heavy_arms.stance_sequence|action|combat.stance.sequence|encounter|achievement_observer|standard|observer.combat.stance.sequence|self|-65
heavy_arms.armor_break|action|combat.armor.break|encounter|achievement_observer|heavy|observer.combat.armor.break|self|-75
heavy_arms.counter_colossus|action|combat.counter.colossus|encounter|achievement_observer|preemptive|observer.combat.counter.colossus|self|-35
heavy_arms.perfect_max_charge|action|combat.mastery.heavy_release|encounter|achievement_observer|heavy|observer.combat.mastery.heavy_release|self|-75
marksmanship.resting_breath|technique|combat.aim.settle|encounter|passive_modifier|fast|passive.combat.aim.settle|self|75
marksmanship.soft_release|technique|combat.ranged.release|encounter|passive_modifier|standard|passive.combat.ranged.release|self|65
marksmanship.range_memory|technique|combat.ranged.distance_memory|encounter|passive_modifier|standard|passive.combat.ranged.distance_memory|self|65
marksmanship.needle_window|technique|combat.ranged.cover_gap|encounter|passive_modifier|standard|passive.combat.ranged.cover_gap|self|65
marksmanship.falcon_method|technique|combat.stance.falcon|encounter|passive_modifier|standard|passive.combat.stance.falcon|self|65
marksmanship.viper_method|technique|combat.stance.viper|encounter|passive_modifier|standard|passive.combat.stance.viper|self|65
marksmanship.moving_mark|technique|combat.ranged.evade_shot|encounter|passive_modifier|movement|passive.combat.ranged.evade_shot|self|85
marksmanship.high_arc|technique|combat.ranged.ballistics|encounter|passive_modifier|standard|passive.combat.ranged.ballistics|self|65
marksmanship.barbed_answer|technique|combat.ranged.counter_shot|encounter|passive_modifier|preemptive|passive.combat.ranged.counter_shot|self|95
marksmanship.split_attention|technique|combat.ranged.target_swap|encounter|passive_modifier|standard|passive.combat.ranged.target_swap|self|65
marksmanship.empty_quiver_oath|technique|combat.ranged.last_ammo|encounter|passive_modifier|standard|passive.combat.ranged.last_ammo|self|65
marksmanship.star_through_needle|technique|combat.capstone.marksmanship|encounter|passive_modifier|aftermath|passive.combat.capstone.marksmanship|self|45
marksmanship.distance_hit|action|combat.ranged.distance_hit|encounter|achievement_observer|standard|observer.combat.ranged.distance_hit|self|-65
marksmanship.moving_weak_point|action|combat.ranged.moving_weak_point|encounter|achievement_observer|standard|observer.combat.ranged.moving_weak_point|self|-65
marksmanship.cover_thread|action|combat.ranged.cover_gap|encounter|achievement_observer|standard|observer.combat.ranged.cover_gap|self|-65
marksmanship.evade_release|action|combat.ranged.evade_release|encounter|achievement_observer|movement|observer.combat.ranged.evade_release|self|-45
marksmanship.stance_sequence|action|combat.stance.sequence|encounter|achievement_observer|standard|observer.combat.stance.sequence|self|-65
marksmanship.three_target_chain|action|combat.ranged.target_chain|encounter|achievement_observer|standard|observer.combat.ranged.target_chain|self|-65
marksmanship.boss_interrupt|action|combat.ranged.boss_interrupt|encounter|achievement_observer|preemptive|observer.combat.ranged.boss_interrupt|self|-35
marksmanship.aligned_pierce|action|combat.mastery.aligned_pierce|encounter|achievement_observer|aftermath|observer.combat.mastery.aligned_pierce|self|-85
guard.planted_heel|technique|combat.guard.stationary|encounter|passive_modifier|preemptive|passive.combat.guard.stationary|self|95
guard.read_the_shoulder|technique|combat.telegraph.heavy|encounter|passive_modifier|preemptive|passive.combat.telegraph.heavy|self|95
guard.soft_catch|technique|combat.parry.partial|encounter|passive_modifier|preemptive|passive.combat.parry.partial|self|95
guard.turn_the_point|technique|combat.guard.redirect|encounter|passive_modifier|preemptive|passive.combat.guard.redirect|self|95
guard.tower_doctrine|technique|combat.stance.tower|encounter|passive_modifier|standard|passive.combat.stance.tower|self|65
guard.mirror_doctrine|technique|combat.stance.mirror|encounter|passive_modifier|standard|passive.combat.stance.mirror|self|65
guard.wall_walk|technique|combat.guard.advance|encounter|passive_modifier|preemptive|passive.combat.guard.advance|self|95
guard.siege_patience|technique|combat.guard.sustained|encounter|passive_modifier|preemptive|passive.combat.guard.sustained|self|95
guard.answer_in_kind|technique|combat.parry.retaliation|encounter|passive_modifier|preemptive|passive.combat.parry.retaliation|self|95
guard.circle_unbroken|technique|combat.guard.ally_aura|encounter|passive_modifier|preemptive|passive.combat.guard.ally_aura|ally|95
guard.refuse_the_fall|technique|combat.guard.break_escape|encounter|passive_modifier|preemptive|passive.combat.guard.break_escape|self|95
guard.gate_without_key|technique|combat.capstone.guard|encounter|passive_modifier|preemptive|passive.combat.capstone.guard|self|95
guard.stable_block|action|combat.guard.combo|encounter|achievement_observer|preemptive|observer.combat.guard.combo|self|-35
guard.perfect_guard|action|combat.guard.perfect|encounter|achievement_observer|preemptive|observer.combat.guard.perfect|self|-35
guard.redirect_projectile|action|combat.guard.redirect|encounter|achievement_observer|preemptive|observer.combat.guard.redirect|self|-35
guard.protect_ally|action|combat.guard.ally_save|encounter|achievement_observer|preemptive|observer.combat.guard.ally_save|ally|-35
guard.stance_sequence|action|combat.stance.sequence|encounter|achievement_observer|standard|observer.combat.stance.sequence|self|-65
guard.parry_elite|action|combat.parry.elite|encounter|achievement_observer|preemptive|observer.combat.parry.elite|self|-35
guard.hold_boss_combo|action|combat.guard.boss_combo|encounter|achievement_observer|preemptive|observer.combat.guard.boss_combo|self|-35
guard.lethal_perfect_guard|action|combat.mastery.guard|encounter|achievement_observer|preemptive|observer.combat.mastery.guard|self|-35
vitality.deep_lung|technique|actor.stats.max_stamina|both|passive_modifier|fast|passive.actor.stats.max_stamina|self|75
vitality.scar_ledger|technique|actor.affliction.adaptation|both|passive_modifier|aftermath|passive.actor.affliction.adaptation|self|45
vitality.warm_blood|technique|actor.hazard.fatigue|world|passive_modifier|fast|passive.actor.hazard.fatigue|self|75
vitality.second_breath|technique|actor.health.threshold|both|passive_modifier|aftermath|passive.actor.health.threshold|self|45
vitality.iron_humor|technique|actor.stance.iron_humor|encounter|passive_modifier|standard|passive.actor.stance.iron_humor|self|65
vitality.pale_humor|technique|actor.stance.pale_humor|encounter|passive_modifier|standard|passive.actor.stance.pale_humor|self|65
vitality.knit_in_motion|technique|actor.recovery.no_hit|both|passive_modifier|aftermath|passive.actor.recovery.no_hit|self|45
vitality.bone_memory|technique|actor.damage.heavy_received|encounter|passive_modifier|heavy|passive.actor.damage.heavy_received|self|55
vitality.clear_veins|technique|actor.affliction.resisted|both|passive_modifier|aftermath|passive.actor.affliction.resisted|self|45
vitality.reserve_heart|technique|actor.rest.nourishment|world|passive_modifier|aftermath|passive.actor.rest.nourishment|self|45
vitality.mortal_interval|technique|actor.knockdown.recovery|encounter|passive_modifier|aftermath|passive.actor.knockdown.recovery|self|45
vitality.life_kept_in_secret|technique|actor.capstone.vitality|encounter|passive_modifier|aftermath|passive.actor.capstone.vitality|self|45
vitality.survive_affliction|action|actor.affliction.survived|both|achievement_observer|aftermath|observer.actor.affliction.survived|self|-85
vitality.recover_knockdown|action|actor.knockdown.perfect_recovery|encounter|achievement_observer|aftermath|observer.actor.knockdown.perfect_recovery|self|-85
vitality.low_health_win|action|combat.encounter.low_health|encounter|achievement_observer|preemptive|observer.combat.encounter.low_health|self|-35
vitality.hazard_crossing|action|actor.hazard.crossed|world|achievement_observer|fast|observer.actor.hazard.crossed|self|-55
vitality.adapt_resistance|action|actor.affliction.adapted|both|achievement_observer|aftermath|observer.actor.affliction.adapted|self|-85
vitality.flawless_endurance|action|combat.encounter.flawless_interval|encounter|achievement_observer|preemptive|observer.combat.encounter.flawless_interval|self|-35
vitality.mortal_recovery|action|actor.health.mortal_recovery|both|achievement_observer|aftermath|observer.actor.health.mortal_recovery|self|-85
vitality.carry_three_afflictions|action|actor.mastery.afflicted_victory|both|achievement_observer|aftermath|observer.actor.mastery.afflicted_victory|self|-85
hexcraft.first_syllable|technique|magic.cast.open|encounter|passive_modifier|standard|passive.magic.cast.open|self|65
hexcraft.finger_of_smoke|technique|magic.cast.mobile|encounter|passive_modifier|standard|passive.magic.cast.mobile|self|65
hexcraft.borrowed_name|technique|magic.resonance.kill|encounter|passive_modifier|aftermath|passive.magic.resonance.kill|self|45
hexcraft.double_utterance|technique|magic.combo.alternate|encounter|passive_modifier|standard|passive.magic.combo.alternate|self|65
hexcraft.cinder_covenant|technique|magic.stance.cinder|encounter|passive_modifier|standard|passive.magic.stance.cinder|self|65
hexcraft.hollow_covenant|technique|magic.stance.hollow|encounter|passive_modifier|standard|passive.magic.stance.hollow|self|65
hexcraft.echo_without_mouth|technique|magic.cast.perfect|encounter|passive_modifier|standard|passive.magic.cast.perfect|self|65
hexcraft.red_grammar|technique|magic.fire.kill_spread|encounter|passive_modifier|aftermath|passive.magic.fire.kill_spread|self|45
hexcraft.empty_grammar|technique|magic.void.isolation|encounter|passive_modifier|standard|passive.magic.void.isolation|self|65
hexcraft.counter_name|technique|magic.cast.counterspell|encounter|passive_modifier|preemptive|passive.magic.cast.counterspell|self|95
hexcraft.choir_of_one|technique|magic.resonance.single_school|encounter|passive_modifier|standard|passive.magic.resonance.single_school|self|65
hexcraft.word_the_world_refused|technique|magic.capstone.hexcraft|encounter|passive_modifier|aftermath|passive.magic.capstone.hexcraft|self|45
hexcraft.timed_hex|action|magic.cast.perfect|encounter|achievement_observer|standard|observer.magic.cast.perfect|self|-65
hexcraft.alternate_schools|action|magic.combo.alternate|encounter|achievement_observer|standard|observer.magic.combo.alternate|self|-65
hexcraft.exploit_resonance|action|magic.resonance.consume|encounter|achievement_observer|standard|observer.magic.resonance.consume|self|-65
hexcraft.counterspell|action|magic.counterspell.success|encounter|achievement_observer|preemptive|observer.magic.counterspell.success|self|-35
hexcraft.covenant_sequence|action|magic.stance.sequence|encounter|achievement_observer|standard|observer.magic.stance.sequence|self|-65
hexcraft.multi_hex_control|action|magic.control.multi|encounter|achievement_observer|standard|observer.magic.control.multi|self|-65
hexcraft.break_boss_ward|action|magic.ward.boss_break|encounter|achievement_observer|standard|observer.magic.ward.boss_break|self|-65
hexcraft.seven_syllable_rite|action|magic.mastery.rite|encounter|achievement_observer|aftermath|observer.magic.mastery.rite|self|-85
`.trim();

interface AuthoredSkillEncounterSemantics {
  readonly resolutionMode: CombatSkillResolutionMode;
  readonly band: TurnResolutionBand;
  readonly targetRule: string;
  readonly targetRelation: TurnTargetRelation;
  readonly priority: number;
}

const buildSkillEffect = (
  legacyId: string,
  legacyHandlerId: string,
  scope: SkillEffectScope,
  semantics: AuthoredSkillEncounterSemantics,
): SkillEffectV2 => {
  const world = Object.freeze({ presentationSeconds: 0, resourceCost: Object.freeze({}) });
  const encounter = Object.freeze({
    apCost: 0 as const,
    staminaCost: 0,
    focusCost: 0,
    band: semantics.band,
    targetRule: semantics.targetRule,
    priority: semantics.priority,
    posthumous: false,
    reactionTrigger: "none" as const,
    targetRelation: semantics.targetRelation,
    effectHandlerId: `turn.skill.${legacyId}`,
  });
  const base = { version: 2 as const, id: legacyId, handlerId: legacyHandlerId };
  const effect: SkillEffectV2 = scope === "world" ? Object.freeze({ ...base, scope, world })
    : scope === "both" ? Object.freeze({ ...base, scope, world, encounter })
      : Object.freeze({ ...base, scope, encounter });
  validateSkillEffectV2(effect);
  return effect;
};

export const COMBAT_SKILL_EFFECT_MIGRATIONS: readonly CombatSkillEffectMigration[] = Object.freeze(
  COMBAT_SKILL_EFFECT_AUTHORING.split("\n").map((row, rowIndex) => {
    const fields = row.split("|");
    if (fields.length !== 9) throw new Error(`Combat SkillEffectV2 row ${rowIndex + 1} has ${fields.length} fields`);
    const [legacyId, sourceKind, legacyHandlerId, scope, resolutionMode, band, targetRule, targetRelation, priorityRaw] = fields as [string, CombatSkillSourceKind, string, SkillEffectScope, CombatSkillResolutionMode, TurnResolutionBand, string, TurnTargetRelation, string];
    if (sourceKind !== "technique" && sourceKind !== "action") throw new Error(`${legacyId} has invalid combat skill source kind`);
    if (scope !== "world" && scope !== "encounter" && scope !== "both") throw new Error(`${legacyId} has invalid SkillEffectV2 scope`);
    if (resolutionMode !== "passive_modifier" && resolutionMode !== "achievement_observer") throw new Error(`${legacyId} has invalid resolution mode`);
    if ((sourceKind === "technique") !== (resolutionMode === "passive_modifier")) throw new Error(`${legacyId} source kind and resolution mode disagree`);
    const skillId = legacyId.split(".")[0]!;
    const semantics = Object.freeze({ resolutionMode, band, targetRule, targetRelation, priority: parseInteger(priorityRaw, `${legacyId}.priority`) });
    return Object.freeze({ sourceKind, resolutionMode, skillId, legacyId, legacyHandlerId, effect: buildSkillEffect(legacyId, legacyHandlerId, scope, semantics) });
  }),
);

export const COMBAT_SKILL_EFFECT_BY_ID: ReadonlyMap<string, CombatSkillEffectMigration> = new Map(
  COMBAT_SKILL_EFFECT_MIGRATIONS.map((migration) => [migration.legacyId, migration]),
);

export const COMBAT_SKILL_MIGRATIONS_BY_LEGACY_HANDLER_ID: ReadonlyMap<string, readonly CombatSkillEffectMigration[]> = (() => {
  const handlers = new Map<string, CombatSkillEffectMigration[]>();
  for (const migration of COMBAT_SKILL_EFFECT_MIGRATIONS) {
    const entries = handlers.get(migration.legacyHandlerId) ?? [];
    entries.push(migration);
    handlers.set(migration.legacyHandlerId, entries);
  }
  return new Map([...handlers].map(([handlerId, migrations]) => [handlerId, Object.freeze(migrations)]));
})();

const makeCombatSkillEffectResolver = (migration: CombatSkillEffectMigration): TurnKernelAuthorityV1["resolveEffect"] => (query) => {
  const expectedId = `turn.skill.${migration.legacyId}`;
  if (query.action.effectHandlerId !== expectedId) return unresolvedEffect("effect_handler_mismatch");
  if (migration.effect.scope === "world") return unresolvedEffect("world_effect_outside_turn_kernel");
  return unresolvedEffect(migration.resolutionMode === "passive_modifier" ? "passive_applied_during_canonicalization" : "achievement_observed_after_resolution");
};

export const COMBAT_SKILL_EFFECT_HANDLERS: readonly CombatSkillEffectHandlerRegistration[] = Object.freeze(
  COMBAT_SKILL_EFFECT_MIGRATIONS.map((migration) => Object.freeze({
    id: `turn.skill.${migration.legacyId}`,
    migrationId: migration.legacyId,
    legacyHandlerId: migration.legacyHandlerId,
    resolutionMode: migration.resolutionMode,
    resolve: makeCombatSkillEffectResolver(migration),
  })),
);

export const COMBAT_SKILL_EFFECT_HANDLER_REGISTRY: ReadonlyMap<string, CombatSkillEffectHandlerRegistration> = new Map(
  COMBAT_SKILL_EFFECT_HANDLERS.map((handler) => [handler.id, handler]),
);

export const resolveCombatSkillEffect: TurnKernelAuthorityV1["resolveEffect"] = (query) => (
  COMBAT_SKILL_EFFECT_HANDLER_REGISTRY.get(query.action.effectHandlerId)?.resolve(query) ?? unresolvedEffect("unknown_combat_skill_effect_handler")
);

export type ActiveTechniqueOperation = "damage_status" | "ally_buff" | "self_heal";

export interface ActiveTechniqueDefinition {
  readonly id: string;
  readonly skillId: typeof TURN_COMBAT_SKILL_IDS[number];
  readonly effect: Extract<SkillEffectV2, { readonly scope: "encounter" }>;
  readonly rangeMm: number;
  readonly damage: number;
  readonly healing: number;
  readonly hitChancePermille: number;
  readonly interrupts: boolean;
  readonly operation: ActiveTechniqueOperation;
  readonly operationId: string;
  readonly resolve: TurnKernelAuthorityV1["resolveEffect"];
}

interface ActiveTechniqueSpec {
  readonly id: string;
  readonly skillId: typeof TURN_COMBAT_SKILL_IDS[number];
  readonly apCost: 1 | 2;
  readonly staminaCost: number;
  readonly focusCost: number;
  readonly band: TurnResolutionBand;
  readonly targetRule: string;
  readonly targetRelation: TurnTargetRelation;
  readonly reactionTrigger: TurnReactionTrigger;
  readonly priority: number;
  readonly rangeMm: number;
  readonly damage: number;
  readonly healing: number;
  readonly hitChancePermille: number;
  readonly interrupts: boolean;
  readonly operation: ActiveTechniqueOperation;
  readonly operationId: string;
}

const ACTIVE_TECHNIQUE_SPECS: readonly ActiveTechniqueSpec[] = Object.freeze([
  { id: "technique.swordsmanship.severing_riposte", skillId: "swordsmanship", apCost: 1, staminaCost: 16, focusCost: 0, band: "preemptive", targetRule: "hostile.intent_source", targetRelation: "hostile", reactionTrigger: "hostile_targeted", priority: 105, rangeMm: 3_000, damage: 24, healing: 0, hitChancePermille: 960, interrupts: true, operation: "damage_status", operationId: "interrupted" },
  { id: "technique.heavy_arms.bellfall", skillId: "heavy_arms", apCost: 2, staminaCost: 32, focusCost: 0, band: "heavy", targetRule: "hostile.front_arc", targetRelation: "hostile", reactionTrigger: "hostile_targeted", priority: -30, rangeMm: 3_500, damage: 42, healing: 0, hitChancePermille: 860, interrupts: true, operation: "damage_status", operationId: "staggered" },
  { id: "technique.marksmanship.threaded_volley", skillId: "marksmanship", apCost: 1, staminaCost: 18, focusCost: 0, band: "standard", targetRule: "hostile.line_of_sight", targetRelation: "hostile", reactionTrigger: "hostile_targeted", priority: 10, rangeMm: 10_000, damage: 26, healing: 0, hitChancePermille: 900, interrupts: false, operation: "damage_status", operationId: "marked" },
  { id: "technique.guard.shelter_step", skillId: "guard", apCost: 1, staminaCost: 12, focusCost: 0, band: "preemptive", targetRule: "ally.currently_threatened", targetRelation: "ally", reactionTrigger: "none", priority: 100, rangeMm: 4_000, damage: 0, healing: 0, hitChancePermille: 1_000, interrupts: false, operation: "ally_buff", operationId: "sheltered" },
  { id: "technique.vitality.second_wind", skillId: "vitality", apCost: 1, staminaCost: 0, focusCost: 0, band: "aftermath", targetRule: "self", targetRelation: "self", reactionTrigger: "none", priority: -45, rangeMm: 0, damage: 0, healing: 30, hitChancePermille: 1_000, interrupts: false, operation: "self_heal", operationId: "second_wind" },
  { id: "technique.hexcraft.counter_name", skillId: "hexcraft", apCost: 2, staminaCost: 8, focusCost: 18, band: "preemptive", targetRule: "hostile.casting_intent", targetRelation: "hostile", reactionTrigger: "hostile_targeted", priority: 110, rangeMm: 7_000, damage: 20, healing: 0, hitChancePermille: 940, interrupts: true, operation: "damage_status", operationId: "silenced" },
]);

const makeActiveTechniqueResolver = (spec: ActiveTechniqueSpec): TurnKernelAuthorityV1["resolveEffect"] => (query) => {
  const handlerId = `turn.active.${spec.id}`;
  if (query.action.effectHandlerId !== handlerId) return unresolvedEffect("effect_handler_mismatch");
  const targetId = spec.targetRelation === "self" ? query.actor.actorId : query.action.targetActorId;
  const target = query.actors.find(({ actorId }) => actorId === targetId);
  if (!target) return unresolvedEffect("target_missing");
  if (spec.targetRelation === "hostile" && target.team === query.actor.team) return unresolvedEffect("hostile_target_required");
  if (spec.targetRelation === "ally" && (target.team !== query.actor.team || target.actorId === query.actor.actorId)) return unresolvedEffect("distinct_ally_target_required");
  let operations: readonly TurnEffectOperationV1[];
  if (spec.operation === "damage_status") {
    if ((query.action.damage ?? 0) < 1) return unresolvedEffect("damage_budget_required");
    operations = Object.freeze([
      { kind: "damage", targetActorId: target.actorId, amount: Math.min(spec.damage, query.action.damage!) },
      { kind: "status", targetActorId: target.actorId, statusId: spec.operationId, stacks: 1, durationRounds: spec.apCost },
    ]);
  } else if (spec.operation === "ally_buff") {
    operations = Object.freeze([{ kind: "buff", targetActorId: target.actorId, buffId: spec.operationId, magnitude: 2, durationRounds: 1 }]);
  } else {
    if ((query.action.healing ?? 0) < 1) return unresolvedEffect("healing_budget_required");
    operations = Object.freeze([{ kind: "heal", targetActorId: target.actorId, amount: Math.min(spec.healing, query.action.healing!) }]);
  }
  return Object.freeze({ resolved: true, operations });
};

export const ACTIVE_TECHNIQUES: readonly ActiveTechniqueDefinition[] = Object.freeze(ACTIVE_TECHNIQUE_SPECS.map((spec) => {
  const handlerId = `turn.active.${spec.id}`;
  const effect: Extract<SkillEffectV2, { readonly scope: "encounter" }> = Object.freeze({
    version: 2,
    id: spec.id,
    handlerId,
    scope: "encounter",
    encounter: Object.freeze({
      apCost: spec.apCost,
      staminaCost: spec.staminaCost,
      focusCost: spec.focusCost,
      band: spec.band,
      targetRule: spec.targetRule,
      priority: spec.priority,
      posthumous: false,
      reactionTrigger: spec.reactionTrigger,
      targetRelation: spec.targetRelation,
      effectHandlerId: handlerId,
    }),
  });
  validateSkillEffectV2(effect);
  return Object.freeze({
    id: spec.id,
    skillId: spec.skillId,
    effect,
    rangeMm: spec.rangeMm,
    damage: spec.damage,
    healing: spec.healing,
    hitChancePermille: spec.hitChancePermille,
    interrupts: spec.interrupts,
    operation: spec.operation,
    operationId: spec.operationId,
    resolve: makeActiveTechniqueResolver(spec),
  });
}));

export const ACTIVE_TECHNIQUE_BY_ID: ReadonlyMap<string, ActiveTechniqueDefinition> = new Map(ACTIVE_TECHNIQUES.map((technique) => [technique.id, technique]));
export const ACTIVE_TECHNIQUE_EFFECT_HANDLER_BY_ID: ReadonlyMap<string, TurnKernelAuthorityV1["resolveEffect"]> = new Map(ACTIVE_TECHNIQUES.map((technique) => [technique.effect.encounter.effectHandlerId, technique.resolve]));

export const canonicalizeActiveTechnique = (selection: TurnActionSelectionV1): CanonicalTurnTechniqueAction | null => {
  const technique = ACTIVE_TECHNIQUE_BY_ID.get(selection.actionDefinitionId);
  if (!technique) return null;
  const contract = technique.effect.encounter;
  if (selection.destinationMm !== undefined || selection.destinationYawTenThousandthRadians !== undefined) return null;
  if (contract.targetRelation !== "self" && !selection.targetActorId) return null;
  if (contract.targetRelation === "self" && selection.targetActorId) return null;
  const action: CanonicalTurnTechniqueAction = {
    actionId: selection.selectionId,
    definitionId: technique.id,
    kind: "technique",
    beat: selection.beat,
    band: contract.band,
    apCost: contract.apCost as 1 | 2,
    staminaCost: contract.staminaCost,
    focusCost: contract.focusCost,
    posthumous: contract.posthumous,
    reactionTrigger: contract.reactionTrigger,
    targetRelation: contract.targetRelation,
    effectHandlerId: contract.effectHandlerId,
    hitChancePermille: technique.hitChancePermille,
    interrupts: technique.interrupts,
    ...(contract.targetRelation !== "self" ? { targetActorId: selection.targetActorId!, rangeMm: technique.rangeMm } : {}),
    ...(technique.damage > 0 ? { damage: technique.damage } : {}),
    ...(technique.healing > 0 ? { healing: technique.healing } : {}),
    ...(contract.apCost === 2 ? { occupiesBothBeats: true as const } : {}),
  };
  validateCanonicalTurnAction(action, `active technique ${technique.id}`);
  return Object.freeze(action);
};

export const resolveActiveTechniqueEffect: TurnKernelAuthorityV1["resolveEffect"] = (query) => (
  ACTIVE_TECHNIQUE_EFFECT_HANDLER_BY_ID.get(query.action.effectHandlerId)?.(query) ?? unresolvedEffect("unknown_active_technique_handler")
);

export const CONTENT_TURN_EFFECT_RESOLVER_BY_ID: ReadonlyMap<string, TurnKernelAuthorityV1["resolveEffect"]> = new Map([
  ...CREATURE_TURN_EFFECT_RESOLVER_BY_ID,
  ...COMBAT_SKILL_EFFECT_HANDLERS.map((handler) => [handler.id, handler.resolve] as const),
  ...ACTIVE_TECHNIQUE_EFFECT_HANDLER_BY_ID,
]);

/** Directly consumable as TurnKernelAuthorityV1.resolveEffect. */
export const resolveCanonicalContentTurnEffect: TurnKernelAuthorityV1["resolveEffect"] = (query) => (
  CONTENT_TURN_EFFECT_RESOLVER_BY_ID.get(query.action.effectHandlerId)?.(query) ?? unresolvedEffect("unknown_content_effect_handler")
);

export const TURN_COMBAT_SKILL_IDS = Object.freeze(["swordsmanship", "heavy_arms", "marksmanship", "guard", "vitality", "hexcraft"] as const);
export const UNCHANGED_WORLD_TIMING_SKILL_IDS = Object.freeze([
  "mining", "woodcutting", "foraging", "fishing", "hunting", "smithing", "woodcraft", "leatherworking", "alchemy", "cooking", "runecrafting", "wayfaring",
] as const);
