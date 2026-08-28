/**
 * Character-creation data for the browser client.
 *
 * All public choices use stable string IDs. Saves should persist the IDs rather
 * than array positions so that presentation order can change safely.
 */

const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const paletteEntry = (id, label, color, extra = {}) => ({
  id,
  label,
  color,
  ...extra,
});

export const APPEARANCE_PALETTES = deepFreeze({
  skin: [
    paletteEntry("alabaster_01", "Alabaster I", "#f5d8c7", { undertone: "rose" }),
    paletteEntry("alabaster_02", "Alabaster II", "#eac5b1", { undertone: "neutral" }),
    paletteEntry("sand_01", "Sand I", "#ddb49b", { undertone: "gold" }),
    paletteEntry("sand_02", "Sand II", "#c99a7c", { undertone: "olive" }),
    paletteEntry("ochre_01", "Ochre I", "#b9825f", { undertone: "gold" }),
    paletteEntry("ochre_02", "Ochre II", "#a56c4f", { undertone: "copper" }),
    paletteEntry("umber_01", "Umber I", "#8f5945", { undertone: "neutral" }),
    paletteEntry("umber_02", "Umber II", "#764536", { undertone: "rose" }),
    paletteEntry("umber_03", "Umber III", "#60382f", { undertone: "cool" }),
    paletteEntry("umber_04", "Umber IV", "#4b2b26", { undertone: "neutral" }),
    paletteEntry("ebon_01", "Ebon I", "#3a2522", { undertone: "warm" }),
    paletteEntry("ebon_02", "Ebon II", "#291b1a", { undertone: "cool" }),
    paletteEntry("ashen_01", "Ash-Pale", "#c8c1b9", { undertone: "ashen" }),
    paletteEntry("ashen_02", "Deep Ash", "#665f5b", { undertone: "ashen" }),
  ],
  hair: [
    paletteEntry("pitch", "Pitch", "#141315"),
    paletteEntry("charcoal", "Charcoal", "#2b292b"),
    paletteEntry("ash_brown", "Ash Brown", "#544840"),
    paletteEntry("earth_brown", "Earth Brown", "#674534"),
    paletteEntry("chestnut", "Chestnut", "#85472f"),
    paletteEntry("copper", "Copper", "#a95335"),
    paletteEntry("rust", "Rust", "#793729"),
    paletteEntry("flax", "Flax", "#c6aa72"),
    paletteEntry("bone", "Bone", "#d4cfbd"),
    paletteEntry("silver", "Silver", "#a9aaae"),
    paletteEntry("grave_blue", "Grave Blue", "#3e4a59"),
    paletteEntry("dyed_wine", "Dyed Wine", "#5e2638"),
  ],
  eye: [
    paletteEntry("peat", "Peat", "#49372a", { glow: 0 }),
    paletteEntry("hazel", "Hazel", "#7d6939", { glow: 0 }),
    paletteEntry("amber", "Amber", "#b97825", { glow: 0.08 }),
    paletteEntry("moss", "Moss", "#556440", { glow: 0 }),
    paletteEntry("pine", "Pine", "#304d3e", { glow: 0 }),
    paletteEntry("slate", "Slate", "#607282", { glow: 0 }),
    paletteEntry("winter", "Winter", "#8da8b3", { glow: 0.04 }),
    paletteEntry("violet", "Dusk Violet", "#655071", { glow: 0.04 }),
    paletteEntry("cinder", "Cinder Red", "#8f352c", { glow: 0.12 }),
    paletteEntry("gilt", "Gilt", "#c69a37", { glow: 0.16 }),
    paletteEntry("milk", "Milk-Clouded", "#c9c9bd", { glow: 0 }),
    paletteEntry("void", "Void", "#17151f", { glow: 0.1 }),
  ],
  marking: [
    paletteEntry("soot", "Soot", "#262326"),
    paletteEntry("ash", "Ash", "#b8b0a4"),
    paletteEntry("clay", "Red Clay", "#8f4738"),
    paletteEntry("woad", "Woad", "#3d566b"),
    paletteEntry("verdigris", "Verdigris", "#4f776c"),
    paletteEntry("old_gold", "Old Gold", "#9a7a3b"),
    paletteEntry("bruise", "Bruise", "#514052"),
    paletteEntry("scar", "Scar Tissue", "#b77a70"),
  ],
});

const morph = (id, label, category, description) => ({
  id,
  label,
  category,
  min: -1,
  max: 1,
  default: 0,
  step: 0.05,
  description,
});

export const BODY_OPTIONS = deepFreeze({
  pronouns: [
    { id: "they", label: "They / Them", subject: "they", object: "them", possessive: "their", reflexive: "themself" },
    { id: "she", label: "She / Her", subject: "she", object: "her", possessive: "her", reflexive: "herself" },
    { id: "he", label: "He / Him", subject: "he", object: "him", possessive: "his", reflexive: "himself" },
    { id: "xe", label: "Xe / Xem", subject: "xe", object: "xem", possessive: "xyr", reflexive: "xemself" },
  ],
  bodies: [
    { id: "reed", label: "Reed", description: "Long-limbed and narrow-framed.", height: 1.06, torsoWidth: 0.84, shoulderWidth: 0.86, hipWidth: 0.9, limbWeight: 0.82 },
    { id: "wayfarer", label: "Wayfarer", description: "A balanced, road-worn frame.", height: 1, torsoWidth: 1, shoulderWidth: 1, hipWidth: 1, limbWeight: 1 },
    { id: "anvil", label: "Anvil", description: "Compact, broad, and powerfully set.", height: 0.94, torsoWidth: 1.18, shoulderWidth: 1.2, hipWidth: 1.08, limbWeight: 1.18 },
    { id: "tower", label: "Tower", description: "Tall with a heavy, imposing silhouette.", height: 1.1, torsoWidth: 1.12, shoulderWidth: 1.16, hipWidth: 1.04, limbWeight: 1.12 },
    { id: "willow", label: "Willow", description: "Soft-contoured with a subtle taper.", height: 1.01, torsoWidth: 0.94, shoulderWidth: 0.91, hipWidth: 1.1, limbWeight: 0.96 },
    { id: "burdened", label: "Burdened", description: "Thick-bodied, sturdy, and grounded.", height: 0.98, torsoWidth: 1.15, shoulderWidth: 1.08, hipWidth: 1.14, limbWeight: 1.1 },
  ],
  faces: [
    { id: "pilgrim", label: "Pilgrim", description: "Even features shaped by long roads.", jaw: 0, cheek: 0, brow: 0, nose: 0, eye: 0 },
    { id: "aquiline", label: "Aquiline", description: "A high bridge, narrow cheeks, and keen eyes.", jaw: -0.2, cheek: 0.25, brow: 0.15, nose: 0.55, eye: -0.15 },
    { id: "hearthborn", label: "Hearthborn", description: "Broad cheeks and a gently rounded jaw.", jaw: 0.18, cheek: 0.42, brow: -0.2, nose: -0.12, eye: 0.16 },
    { id: "weathered", label: "Weathered", description: "Strong lines and a deep-set gaze.", jaw: 0.25, cheek: -0.08, brow: 0.38, nose: 0.14, eye: -0.28 },
    { id: "knife", label: "Knife", description: "Sharp cheekbones and a tapered chin.", jaw: -0.35, cheek: 0.55, brow: 0.1, nose: 0.18, eye: -0.05 },
    { id: "moon", label: "Moon", description: "A short chin and open, rounded features.", jaw: -0.12, cheek: 0.32, brow: -0.3, nose: -0.25, eye: 0.42 },
    { id: "bastion", label: "Bastion", description: "A square jaw beneath a heavy brow.", jaw: 0.62, cheek: -0.22, brow: 0.58, nose: 0.08, eye: -0.32 },
    { id: "hollowed", label: "Hollowed", description: "Gaunt planes and an austere, haunted gaze.", jaw: -0.28, cheek: -0.58, brow: 0.3, nose: 0.34, eye: -0.42 },
  ],
  skin: APPEARANCE_PALETTES.skin,
  hair: [
    { id: "shorn", label: "Shorn", description: "Close cut with no loose silhouette.", shape: "cap", length: 0.02, volume: 0.05, asymmetry: 0 },
    { id: "pilgrim_knot", label: "Pilgrim Knot", description: "Pulled high and bound for travel.", shape: "knot", length: 0.5, volume: 0.34, asymmetry: 0 },
    { id: "grave_braid", label: "Grave Braid", description: "A long, weighty braid down the back.", shape: "braid", length: 0.9, volume: 0.3, asymmetry: 0 },
    { id: "cinder_crop", label: "Cinder Crop", description: "Jagged, short layers like banked flame.", shape: "jagged", length: 0.16, volume: 0.4, asymmetry: 0.15 },
    { id: "mourners_veil", label: "Mourner's Veil", description: "Long curtains that frame the face.", shape: "curtain", length: 0.82, volume: 0.38, asymmetry: 0 },
    { id: "tidefall", label: "Tidefall", description: "A loose fall swept over one shoulder.", shape: "swept", length: 0.74, volume: 0.44, asymmetry: 0.62 },
    { id: "thorn_crown", label: "Thorn Crown", description: "Dense coils gathered around the crown.", shape: "coils", length: 0.32, volume: 0.72, asymmetry: 0 },
    { id: "loose_coils", label: "Loose Coils", description: "Springing coils worn to the shoulders.", shape: "coils", length: 0.58, volume: 0.62, asymmetry: 0.08 },
    { id: "war_hawk", label: "War Hawk", description: "Shaved sides beneath a rigid crest.", shape: "crest", length: 0.3, volume: 0.48, asymmetry: 0 },
    { id: "hermits_mane", label: "Hermit's Mane", description: "Unbound, rough, and voluminous.", shape: "mane", length: 0.72, volume: 0.8, asymmetry: 0.18 },
    { id: "bell_bob", label: "Bell Bob", description: "A blunt, jaw-length ceremonial cut.", shape: "bell", length: 0.3, volume: 0.36, asymmetry: 0 },
    { id: "bald", label: "Bare", description: "No scalp hair.", shape: "none", length: 0, volume: 0, asymmetry: 0 },
  ],
  hairColors: APPEARANCE_PALETTES.hair,
  eye: APPEARANCE_PALETTES.eye,
  markings: [
    { id: "none", label: "Unmarked", description: "No visible marking.", pattern: "none", placement: "none", opacity: 0 },
    { id: "ember_scar", label: "Ember Scar", description: "A branching burn across one cheek.", pattern: "branch", placement: "cheek_right", opacity: 0.72 },
    { id: "tithe_notches", label: "Tithe Notches", description: "Five short tally cuts over the brow.", pattern: "tallies", placement: "brow_left", opacity: 0.66 },
    { id: "weeping_eye", label: "Weeping Eye", description: "Pigment trails beneath one eye.", pattern: "tears", placement: "eye_left", opacity: 0.82 },
    { id: "saintless_rune", label: "Saintless Rune", description: "An outlawed ward centered on the forehead.", pattern: "rune", placement: "forehead", opacity: 0.78 },
    { id: "mire_bloom", label: "Mire Bloom", description: "Spore-like freckles across nose and cheeks.", pattern: "speckle", placement: "midface", opacity: 0.54 },
    { id: "oath_ring", label: "Oath Ring", description: "A broken circle encircling the throat.", pattern: "broken_ring", placement: "neck", opacity: 0.8 },
    { id: "gloam_half", label: "Gloam Half", description: "One half of the face darkened in ritual soot.", pattern: "field", placement: "face_left", opacity: 0.6 },
    { id: "thorn_script", label: "Thorn Script", description: "Fine thorned lines climbing from collar to jaw.", pattern: "vine", placement: "neck_right", opacity: 0.74 },
    { id: "duelists_seam", label: "Duelist's Seam", description: "A clean scar from temple to jaw.", pattern: "seam", placement: "face_right", opacity: 0.58 },
  ],
  markingColors: APPEARANCE_PALETTES.marking,
  morphs: [
    morph("stature", "Stature", "body", "Shorter or taller within the chosen frame."),
    morph("musculature", "Musculature", "body", "Changes limb and shoulder definition."),
    morph("bodyMass", "Body Mass", "body", "Changes overall breadth and softness."),
    morph("shoulderWidth", "Shoulder Width", "body", "Narrows or widens the shoulders."),
    morph("hipWidth", "Hip Width", "body", "Narrows or widens the hips."),
    morph("torsoLength", "Torso Length", "body", "Changes torso-to-leg proportion."),
    morph("headScale", "Head Scale", "head", "Changes head size without changing the body."),
    morph("jawWidth", "Jaw Width", "face", "Tapers or squares the lower face."),
    morph("cheekDepth", "Cheek Depth", "face", "Softens or hollows the cheeks."),
    morph("browDepth", "Brow Depth", "face", "Softens or deepens the brow ridge."),
    morph("noseLength", "Nose Length", "face", "Shortens or lengthens the nose."),
    morph("eyeSpacing", "Eye Spacing", "face", "Moves the eyes closer or farther apart."),
    morph("eyeSize", "Eye Size", "face", "Changes visible eye size."),
    morph("earSize", "Ear Size", "face", "Changes ear scale."),
    morph("age", "Apparent Age", "detail", "Adds mature planes and fine creases."),
    morph("scarDepth", "Marking Depth", "detail", "Makes scar-type markings subtle or severe."),
  ],
});

export const ATTRIBUTES = deepFreeze([
  { id: "vigor", label: "Vigor", abbreviation: "VIG", description: "Life, recovery, and resistance to wounds.", base: 5, min: 5, creationMax: 12, hardCap: 60, derived: ["maxHealth", "woundResistance"] },
  { id: "endurance", label: "Endurance", abbreviation: "END", description: "Stamina, burden tolerance, and sustained exertion.", base: 5, min: 5, creationMax: 12, hardCap: 60, derived: ["maxStamina", "equipLoad"] },
  { id: "might", label: "Might", abbreviation: "MIG", description: "Force behind heavy arms, guard breaks, and labor.", base: 5, min: 5, creationMax: 12, hardCap: 60, derived: ["heavyDamage", "impact"] },
  { id: "finesse", label: "Finesse", abbreviation: "FIN", description: "Precision, balance, nimble arms, and deft work.", base: 5, min: 5, creationMax: 12, hardCap: 60, derived: ["lightDamage", "handling"] },
  { id: "insight", label: "Insight", abbreviation: "INS", description: "Perception, learning, craft reasoning, and hidden paths.", base: 5, min: 5, creationMax: 12, hardCap: 60, derived: ["discovery", "craftQuality"] },
  { id: "will", label: "Will", abbreviation: "WIL", description: "Composure against terror, pain, and hostile influence.", base: 5, min: 5, creationMax: 12, hardCap: 60, derived: ["resolve", "afflictionResistance"] },
  { id: "attunement", label: "Attunement", abbreviation: "ATT", description: "Capacity to shape rites, relics, and the unseen current.", base: 5, min: 5, creationMax: 12, hardCap: 60, derived: ["ritePower", "focus"] },
  { id: "presence", label: "Presence", abbreviation: "PRE", description: "Authority, empathy, deception, and the weight of reputation.", base: 5, min: 5, creationMax: 12, hardCap: 60, derived: ["influence", "vendorTerms"] },
]);

export const ORIGINS = deepFreeze([
  {
    id: "gloamfarer",
    label: "Gloamfarer",
    epithet: "One road farther than the maps",
    lore: "You carried letters between settlements after the old roads learned to move. You know which milestones lie and which fires welcome no guest.",
    attributeBonuses: { endurance: 1, insight: 1, will: 1 },
    skillBonuses: { wayfinding: 3, foraging: 2, campcraft: 2 },
    equipment: { weapon: ["ashwood_spear"], armor: ["patched_road_cloak", "hide_shoes"], tools: ["brass_compass", "bedroll"], consumables: ["bitterroot_ration", "bitterroot_ration"] },
  },
  {
    id: "bell_warden",
    label: "Bell Warden",
    epithet: "Keeper of the final peal",
    lore: "You kept a plague bell ringing until there was nobody left to count its tolls. Its rope burned your palms, but its rhythm still steadies your heart.",
    attributeBonuses: { vigor: 1, might: 1, will: 1 },
    skillBonuses: { maces: 3, warding: 2, firstAid: 2 },
    equipment: { weapon: ["wardens_maul"], armor: ["bellkeepers_coat", "iron_cowl"], tools: ["handbell_ward"], consumables: ["clotting_salt"] },
  },
  {
    id: "grave_tithe_runner",
    label: "Grave-Tithe Runner",
    epithet: "Faster than the collectors",
    lore: "You smuggled names off the burial rolls so poor families could keep their dead. The Tithe remembers your face even if the law does not.",
    attributeBonuses: { finesse: 2, presence: 1 },
    skillBonuses: { lightBlades: 3, skulduggery: 2, bargaining: 2 },
    equipment: { weapon: ["tithe_hook", "boot_knife"], armor: ["runners_leathers"], tools: ["false_seals", "lock_wires"], consumables: ["smoke_egg", "smoke_egg"] },
  },
  {
    id: "mire_physicker",
    label: "Mire Physicker",
    epithet: "A cure with teeth",
    lore: "The black fen taught you that poison and medicine differ mostly in patience. Your remedies work, though sensible folk dislike watching them work.",
    attributeBonuses: { insight: 2, attunement: 1 },
    skillBonuses: { alchemy: 3, herbalism: 3, firstAid: 1 },
    equipment: { weapon: ["bone_sickle"], armor: ["waxed_mire_apron"], tools: ["field_alembic", "herb_case"], consumables: ["leech_tonic", "mire_antidote"] },
  },
  {
    id: "oathless_scion",
    label: "Oathless Scion",
    epithet: "An inheritance refused",
    lore: "Your house purchased loyalty with beautiful promises and uglier collateral. You left the signet behind, but courtly habits cling more tightly than rings.",
    attributeBonuses: { finesse: 1, insight: 1, presence: 1 },
    skillBonuses: { dueling: 3, rhetoric: 3, lore: 1 },
    equipment: { weapon: ["notched_court_sword"], armor: ["travel_stained_doublet"], tools: ["blank_signet", "court_ledger_page"], consumables: ["silverleaf_cordial"] },
  },
  {
    id: "cinder_mason",
    label: "Cinder Mason",
    epithet: "Builder beneath the furnace",
    lore: "You repaired the foundations of a city that was burning from below. Stone speaks under a hammer; you heard it beg and kept working.",
    attributeBonuses: { endurance: 1, might: 2 },
    skillBonuses: { heavyArms: 3, smithing: 2, masonry: 2 },
    equipment: { weapon: ["mason_hammer"], armor: ["cinderhide_jerkin", "stone_knee_wraps"], tools: ["rune_chisel"], consumables: ["coalheart_draught"] },
  },
  {
    id: "starved_seer",
    label: "Starved Seer",
    epithet: "Witness to an empty heaven",
    lore: "You fasted for a revelation and something answered from the space where a god should have been. Hunger keeps the memory sharp.",
    attributeBonuses: { will: 1, attunement: 2 },
    skillBonuses: { divination: 3, rites: 3, lore: 1 },
    equipment: { weapon: ["seer_rod"], armor: ["threadbare_oracle_wraps"], tools: ["black_glass_lens"], consumables: ["focus_incense", "focus_incense"] },
  },
  {
    id: "thorn_poacher",
    label: "Thorn Poacher",
    epithet: "Hunter of the kingless wood",
    lore: "When winter law forbade hunting, you fed a village from a forest that hunted back. Some nights you still hear antlers scraping at the shutters.",
    attributeBonuses: { vigor: 1, finesse: 1, insight: 1 },
    skillBonuses: { archery: 3, trapping: 2, tracking: 2 },
    equipment: { weapon: ["thornwood_bow", "skin_dagger"], armor: ["mossmantle"], tools: ["snare_bundle"], consumables: ["barbed_arrow_bundle", "dried_venison"] },
  },
]);

export const VOWS = deepFreeze([
  {
    id: "unbound",
    label: "Remain Unbound",
    description: "Take no binding vow. Your path is flexible, but no oath lends it strength.",
    modifiers: [],
    ruleFlags: [],
  },
  {
    id: "iron_pilgrimage",
    label: "Vow of the Iron Pilgrimage",
    description: "Never shed a chosen burden merely because the road is cruel.",
    modifiers: [
      { stat: "poise", operation: "addPercent", value: 15 },
      { stat: "staminaRegen", operation: "addPercent", value: -8 },
      { stat: "heavyArmorSkillXp", operation: "addPercent", value: 10 },
    ],
    ruleFlags: ["cannot_fast_travel_while_overburdened", "rest_repairs_armor"],
  },
  {
    id: "last_ember",
    label: "Vow of the Last Ember",
    description: "Guard the final heat in your blood; let danger kindle it.",
    modifiers: [
      { stat: "damage", operation: "addPercent", value: 18, when: "health_below_30_percent" },
      { stat: "ritePower", operation: "addPercent", value: 12, when: "health_below_30_percent" },
      { stat: "healingReceived", operation: "addPercent", value: -20 },
    ],
    ruleFlags: ["low_health_emits_ember_light"],
  },
  {
    id: "open_hand",
    label: "Vow of the Open Hand",
    description: "Keep no clenched fist when mercy, trade, or honest labor may suffice.",
    modifiers: [
      { stat: "vendorBuyPrice", operation: "addPercent", value: -8 },
      { stat: "influenceXp", operation: "addPercent", value: 15 },
      { stat: "damage", operation: "addPercent", value: -10, when: "enemy_has_not_damaged_you" },
    ],
    ruleFlags: ["mercy_actions_restore_resolve", "cannot_execute_surrendered_foes"],
  },
  {
    id: "hollow_lantern",
    label: "Vow of the Hollow Lantern",
    description: "Carry light into every forgotten place, though every hungry thing may see it.",
    modifiers: [
      { stat: "discoveryRadius", operation: "addPercent", value: 25 },
      { stat: "secretDetection", operation: "add", value: 2 },
      { stat: "stealth", operation: "addPercent", value: -15 },
    ],
    ruleFlags: ["lantern_cannot_be_extinguished", "reveals_echo_trails"],
  },
  {
    id: "bloodless_edge",
    label: "Vow of the Bloodless Edge",
    description: "Refuse victory purchased by bleeding, your own or another's.",
    modifiers: [
      { stat: "bleedResistance", operation: "addPercent", value: 100 },
      { stat: "bluntDamage", operation: "addPercent", value: 12 },
      { stat: "slashDamage", operation: "addPercent", value: -12 },
    ],
    ruleFlags: ["bleed_status_cannot_be_inflicted", "nonlethal_finishers_available"],
  },
  {
    id: "grave_mercy",
    label: "Vow of Grave Mercy",
    description: "Return the restless dead to silence without plundering what they carried there.",
    modifiers: [
      { stat: "damageVersusRestless", operation: "addPercent", value: 15 },
      { stat: "resolveOnRestlessKill", operation: "add", value: 2 },
      { stat: "currencyFromRestless", operation: "addPercent", value: -100 },
    ],
    ruleFlags: ["restless_corpses_cannot_be_looted", "restless_finishers_consecrate"],
  },
  {
    id: "silent_bell",
    label: "Vow of the Silent Bell",
    description: "Speak only when words outweigh the danger of being heard.",
    modifiers: [
      { stat: "ritePower", operation: "addPercent", value: 10 },
      { stat: "enemyHearingRange", operation: "addPercent", value: -15 },
      { stat: "vendorBuyPrice", operation: "addPercent", value: 8 },
    ],
    ruleFlags: ["spoken_dialogue_options_are_limited", "silent_dialogue_options_gain_force"],
  },
]);

const DEFAULT_MORPHS = Object.fromEntries(BODY_OPTIONS.morphs.map(({ id, default: defaultValue }) => [id, defaultValue]));

export const DEFAULT_CHARACTER = deepFreeze({
  schemaVersion: 1,
  name: "The Unnamed",
  pronoun: "they",
  origin: "gloamfarer",
  vow: "unbound",
  appearance: {
    body: "wayfarer",
    face: "weathered",
    skin: "umber_04",
    hair: "pilgrim_knot",
    hairColor: "charcoal",
    eye: "amber",
    marking: "none",
    markingColor: "ash",
    morphs: DEFAULT_MORPHS,
  },
  attributes: {
    vigor: 7,
    endurance: 7,
    might: 6,
    finesse: 7,
    insight: 6,
    will: 7,
    attunement: 6,
    presence: 6,
  },
});

const OPTION_PATHS = {
  pronoun: BODY_OPTIONS.pronouns,
  origin: ORIGINS,
  vow: VOWS,
  "appearance.body": BODY_OPTIONS.bodies,
  "appearance.face": BODY_OPTIONS.faces,
  "appearance.skin": BODY_OPTIONS.skin,
  "appearance.hair": BODY_OPTIONS.hair,
  "appearance.hairColor": BODY_OPTIONS.hairColors,
  "appearance.eye": BODY_OPTIONS.eye,
  "appearance.marking": BODY_OPTIONS.markings,
  "appearance.markingColor": BODY_OPTIONS.markingColors,
};

const valueAt = (object, path) => path.split(".").reduce((value, key) => value?.[key], object);

/**
 * Validate a character-creator save without mutating it.
 *
 * @returns {{valid: boolean, errors: Array<{path: string, code: string, message: string}>}}
 */
export function validateCharacter(character) {
  const errors = [];
  const addError = (path, code, message) => errors.push({ path, code, message });

  if (!character || typeof character !== "object" || Array.isArray(character)) {
    addError("character", "invalid_type", "Character must be an object.");
    return { valid: false, errors };
  }

  if (character.schemaVersion !== DEFAULT_CHARACTER.schemaVersion) {
    addError("schemaVersion", "unsupported_version", `Expected character schema version ${DEFAULT_CHARACTER.schemaVersion}.`);
  }

  if (typeof character.name !== "string") {
    addError("name", "invalid_type", "Name must be text.");
  } else {
    const trimmedName = character.name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 24) {
      addError("name", "invalid_length", "Name must contain 2 to 24 characters after trimming.");
    }
    if (/[^\p{L}\p{M}' -]/u.test(trimmedName)) {
      addError("name", "invalid_characters", "Name may contain letters, spaces, apostrophes, and hyphens.");
    }
    if (/\s{2,}|--|''/.test(trimmedName)) {
      addError("name", "invalid_spacing", "Name cannot contain repeated spaces or punctuation.");
    }
  }

  Object.entries(OPTION_PATHS).forEach(([path, options]) => {
    const selectedId = valueAt(character, path);
    if (typeof selectedId !== "string" || !options.some(({ id }) => id === selectedId)) {
      addError(path, "unknown_option", `Unknown character option for ${path}.`);
    }
  });

  if (!character.appearance || typeof character.appearance !== "object" || Array.isArray(character.appearance)) {
    addError("appearance", "invalid_type", "Appearance must be an object.");
  }

  const morphValues = character.appearance?.morphs;
  if (!morphValues || typeof morphValues !== "object" || Array.isArray(morphValues)) {
    addError("appearance.morphs", "invalid_type", "Appearance morphs must be an object.");
  } else {
    BODY_OPTIONS.morphs.forEach(({ id, min, max }) => {
      const value = morphValues[id];
      if (typeof value !== "number" || !Number.isFinite(value)) {
        addError(`appearance.morphs.${id}`, "invalid_type", `${id} must be a finite number.`);
      } else if (value < min || value > max) {
        addError(`appearance.morphs.${id}`, "out_of_range", `${id} must be between ${min} and ${max}.`);
      }
    });
  }

  if (!character.attributes || typeof character.attributes !== "object" || Array.isArray(character.attributes)) {
    addError("attributes", "invalid_type", "Attributes must be an object.");
  } else {
    let spent = 0;
    ATTRIBUTES.forEach(({ id, min, creationMax }) => {
      const value = character.attributes[id];
      if (!Number.isInteger(value)) {
        addError(`attributes.${id}`, "invalid_type", `${id} must be a whole number.`);
      } else if (value < min || value > creationMax) {
        addError(`attributes.${id}`, "out_of_range", `${id} must be between ${min} and ${creationMax} during creation.`);
      } else {
        spent += value;
      }
    });

    const creationBudget = ATTRIBUTES.reduce((total, attribute) => total + attribute.base, 0) + 12;
    if (spent !== creationBudget) {
      addError("attributes", "invalid_budget", `Creation attributes must total ${creationBudget}; received ${spent}.`);
    }
  }

  return { valid: errors.length === 0, errors };
}
const findById = (options, id, fallbackId) =>
  options.find((option) => option.id === id) ?? options.find((option) => option.id === fallbackId) ?? options[0];

const hashString = (text) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

const colorFor = (palette, id, fallbackId) => findById(palette, id, fallbackId).color;

/**
 * Convert creator choices into renderer-agnostic, deterministic proportions.
 * Values are suitable for a canvas renderer whose unscaled figure is 100 units
 * tall and centered on x=0. Invalid/missing choices fall back safely.
 */
export function characterSilhouette(character = DEFAULT_CHARACTER) {
  const appearance = character?.appearance ?? {};
  const body = findById(BODY_OPTIONS.bodies, appearance.body, DEFAULT_CHARACTER.appearance.body);
  const face = findById(BODY_OPTIONS.faces, appearance.face, DEFAULT_CHARACTER.appearance.face);
  const hair = findById(BODY_OPTIONS.hair, appearance.hair, DEFAULT_CHARACTER.appearance.hair);
  const marking = findById(BODY_OPTIONS.markings, appearance.marking, DEFAULT_CHARACTER.appearance.marking);
  const eyeChoice = findById(BODY_OPTIONS.eye, appearance.eye, DEFAULT_CHARACTER.appearance.eye);
  const suppliedMorphs = appearance.morphs ?? {};
  const morphs = Object.fromEntries(
    BODY_OPTIONS.morphs.map(({ id, min, max, default: defaultValue }) => {
      const candidate = suppliedMorphs[id];
      return [id, clamp(Number.isFinite(candidate) ? candidate : defaultValue, min, max)];
    }),
  );

  const seedSource = [
    body.id,
    face.id,
    hair.id,
    appearance.skin,
    appearance.hairColor,
    appearance.eye,
    marking.id,
    appearance.markingColor,
    ...Object.keys(morphs).sort().map((id) => `${id}:${morphs[id].toFixed(2)}`),
  ].join("|");
  const seed = hashString(seedSource);
  const seededAsymmetry = (((seed >>> 8) & 0xff) / 255 - 0.5) * 0.025;

  const heightScale = clamp(body.height + morphs.stature * 0.08, 0.82, 1.2);
  const torsoWidth = clamp(body.torsoWidth * (1 + morphs.bodyMass * 0.12), 0.7, 1.38);
  const shoulderWidth = clamp(body.shoulderWidth * (1 + morphs.shoulderWidth * 0.14 + morphs.musculature * 0.06), 0.68, 1.42);
  const hipWidth = clamp(body.hipWidth * (1 + morphs.hipWidth * 0.14 + morphs.bodyMass * 0.05), 0.72, 1.38);
  const limbWeight = clamp(body.limbWeight * (1 + morphs.musculature * 0.12 + morphs.bodyMass * 0.08), 0.68, 1.4);

  return {
    version: 1,
    seed,
    units: "figure-percent",
    anchor: { x: 0, y: 100 },
    body: {
      height: Number((100 * heightScale).toFixed(3)),
      torsoWidth: Number((22 * torsoWidth).toFixed(3)),
      shoulderWidth: Number((28 * shoulderWidth).toFixed(3)),
      hipWidth: Number((22 * hipWidth).toFixed(3)),
      limbWidth: Number((7 * limbWeight).toFixed(3)),
      torsoRatio: Number(clamp(0.48 + morphs.torsoLength * 0.045, 0.42, 0.54).toFixed(4)),
      muscleDefinition: Number(clamp(0.5 + morphs.musculature * 0.5, 0, 1).toFixed(3)),
    },
    head: {
      scale: Number(clamp(1 + morphs.headScale * 0.12, 0.84, 1.16).toFixed(3)),
      jaw: Number(clamp(face.jaw + morphs.jawWidth * 0.65, -1, 1).toFixed(3)),
      cheek: Number(clamp(face.cheek + morphs.cheekDepth * 0.55, -1, 1).toFixed(3)),
      brow: Number(clamp(face.brow + morphs.browDepth * 0.55, -1, 1).toFixed(3)),
      nose: Number(clamp(face.nose + morphs.noseLength * 0.55, -1, 1).toFixed(3)),
      eyeSpacing: Number(clamp(face.eye * 0.15 + morphs.eyeSpacing * 0.18, -0.24, 0.24).toFixed(3)),
      eyeScale: Number(clamp(1 + morphs.eyeSize * 0.18, 0.8, 1.2).toFixed(3)),
      earScale: Number(clamp(1 + morphs.earSize * 0.2, 0.76, 1.24).toFixed(3)),
      apparentAge: Number(clamp((morphs.age + 1) / 2, 0, 1).toFixed(3)),
    },
    hair: {
      style: hair.shape,
      length: hair.length,
      volume: hair.volume,
      asymmetry: Number(clamp(hair.asymmetry + seededAsymmetry, -1, 1).toFixed(4)),
    },
    palette: {
      skin: colorFor(BODY_OPTIONS.skin, appearance.skin, DEFAULT_CHARACTER.appearance.skin),
      hair: colorFor(BODY_OPTIONS.hairColors, appearance.hairColor, DEFAULT_CHARACTER.appearance.hairColor),
      eye: eyeChoice.color,
      eyeGlow: eyeChoice.glow ?? 0,
      marking: colorFor(BODY_OPTIONS.markingColors, appearance.markingColor, DEFAULT_CHARACTER.appearance.markingColor),
    },
    marking: {
      pattern: marking.pattern,
      placement: marking.placement,
      opacity: Number(clamp(marking.opacity * (1 + morphs.scarDepth * 0.25), 0, 1).toFixed(3)),
    },
  };
}
