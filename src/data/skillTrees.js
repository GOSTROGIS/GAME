import { SKILLS } from "./skills.js";

const TIER_NAMES = Object.freeze(["novice", "adept", "expert", "master"]);
const TIER_COSTS = Object.freeze([
  [1, 1, 2],
  [2, 2, 2],
  [3, 3, 3],
  [4, 4, 5],
]);
const TIER_POTENCY = Object.freeze([0.04, 0.08, 0.13, 0.2]);
const TECHNIQUE_LEVELS = Object.freeze([1, 15, 40, 70]);
const ACTION_LEVELS = Object.freeze([1, 5, 14, 24, 38, 52, 68, 82]);
const ACTION_TIERS = Object.freeze([1, 1, 2, 2, 3, 3, 4, 4]);
const ACTION_TIER_MULTIPLIERS = Object.freeze([0, 1, 2.15, 4.9, 10.8]);
const PREREQUISITE_INDEXES = Object.freeze([
  [],
  [0],
  [0],
  [1],
  [2],
  [2],
  [3],
  [4],
  [5],
  [6],
  [9],
  [10],
]);

// A compact authoring format is expanded into complete node records below.
// Tuple: [slug, display name, mechanical effect, runtime hook].
const TECHNIQUE_BLUEPRINTS = Object.freeze({
  swordsmanship: [
    ["quiet_edge", "Quiet Edge", "Light attacks cost 4% less stamina.", "combat.stamina.light_attack"],
    ["pulse_step", "Pulse Step", "The first step after lock-on has a longer evade window.", "combat.dodge.entry"],
    ["low_guard", "Low Guard", "Gain poise while holding a blade below half stamina.", "combat.poise.low_stamina"],
    ["measured_three", "Measured Three", "The third unique strike in a chain gains critical force.", "combat.combo.sequence"],
    ["duelist_vow", "Duelist's Vow", "Deal more damage to a lone locked target; cleave is reduced.", "combat.stance.duelist"],
    ["reaver_vow", "Reaver's Vow", "Sweeps gain reach against groups; single-target precision is reduced.", "combat.stance.reaver"],
    ["borrowed_momentum", "Borrowed Momentum", "A near-miss dodge hastens the next heavy attack.", "combat.dodge.near_miss"],
    ["silver_thread", "Silver Thread", "Perfect thrusts partially ignore spectral armor.", "combat.hit.thrust_precision"],
    ["red_harvest", "Red Harvest", "Wide finishers extend active bleed but build less critical meter.", "combat.hit.sweep_finisher"],
    ["sever_the_intent", "Sever the Intent", "Interrupting a wind-up refunds stamina and focus.", "combat.interrupt.weapon"],
    ["death_between_beats", "Death Between Beats", "Perfect ripostes briefly slow nearby hostile wind-ups.", "combat.riposte.perfect"],
    ["unanswered_cut", "The Unanswered Cut", "Once per encounter, a flawless seven-input chain ends in an unblockable cut.", "combat.capstone.swordsmanship"],
  ],
  heavy_arms: [
    ["centered_heft", "Centered Heft", "Reduce the stamina penalty from weapon weight.", "combat.weight.heavy_weapon"],
    ["heel_turn", "Heel Turn", "Pivot faster during the recovery of a heavy swing.", "combat.recovery.turn_rate"],
    ["stone_shoulders", "Stone Shoulders", "Gain poise during the opening frames of charged attacks.", "combat.poise.charge_start"],
    ["falling_bell", "Falling Bell", "Overhead blows deal extra poise damage from higher ground.", "combat.hit.overhead"],
    ["breaker_path", "Path of the Breaker", "Crush shields faster, but charged attacks recover more slowly.", "combat.stance.breaker"],
    ["storm_path", "Path of the Storm", "Spinning attacks move farther, but direct impact damage falls.", "combat.stance.storm"],
    ["aftershock", "Aftershock", "Fully charged impacts produce a short ground stagger.", "combat.hit.full_charge"],
    ["kiln_splitter", "Kiln Splitter", "Repeated hits against one guard increase break pressure.", "combat.guard_pressure"],
    ["wheel_of_iron", "Wheel of Iron", "A moving heavy chain resists flanking stagger.", "combat.movement.heavy_chain"],
    ["burden_becomes_power", "Burden Becomes Power", "Equip burden above medium adds controlled impact force.", "combat.weight.to_power"],
    ["grave_nail", "Grave Nail", "Aerial plunges pin lesser enemies and expose elites.", "combat.plunge.heavy"],
    ["world_ending_stroke", "World-Ending Stroke", "A perfectly released maximum charge shatters armor in a narrow line.", "combat.capstone.heavy_arms"],
  ],
  marksmanship: [
    ["resting_breath", "Resting Breath", "Aim sway settles sooner after movement.", "combat.aim.settle"],
    ["soft_release", "Soft Release", "Perfect releases make less noise and preserve projectile speed.", "combat.ranged.release"],
    ["range_memory", "Range Memory", "Recent distance corrections persist between targets.", "combat.ranged.distance_memory"],
    ["needle_window", "Needle Window", "Shots through narrow cover gaps gain critical accuracy.", "combat.ranged.cover_gap"],
    ["falcon_method", "Falcon Method", "Long-range headshots gain power; close shots lose stagger.", "combat.stance.falcon"],
    ["viper_method", "Viper Method", "Close shots apply status faster; distant accuracy falls.", "combat.stance.viper"],
    ["moving_mark", "Moving Mark", "Loose accurate shots during the final frames of a sidestep.", "combat.ranged.evade_shot"],
    ["high_arc", "High Arc", "Falcon shots can arc over low obstruction.", "combat.ranged.ballistics"],
    ["barbed_answer", "Barbed Answer", "Viper criticals punish enemies already using an action.", "combat.ranged.counter_shot"],
    ["split_attention", "Split Attention", "Rapidly changing targets reduces draw time.", "combat.ranged.target_swap"],
    ["empty_quiver_oath", "Empty-Quiver Oath", "The final projectile of each type gains recovery and damage.", "combat.ranged.last_ammo"],
    ["star_through_needle", "Star Through the Needle", "One fully focused shot can pierce every aligned weak point.", "combat.capstone.marksmanship"],
  ],
  guard: [
    ["planted_heel", "Planted Heel", "Guard stability rises while movement input is neutral.", "combat.guard.stationary"],
    ["read_the_shoulder", "Read the Shoulder", "Enemy heavy attacks telegraph slightly earlier at close range.", "combat.telegraph.heavy"],
    ["soft_catch", "Soft Catch", "Partial parries take less stamina damage.", "combat.parry.partial"],
    ["turn_the_point", "Turn the Point", "Perfect guards redirect thrusts and small projectiles.", "combat.guard.redirect"],
    ["tower_doctrine", "Tower Doctrine", "Blocking is stronger and slower; dodge distance is reduced.", "combat.stance.tower"],
    ["mirror_doctrine", "Mirror Doctrine", "Parry windows widen slightly; failed parries take more damage.", "combat.stance.mirror"],
    ["wall_walk", "Wall Walk", "Advance under guard without the usual stability loss.", "combat.guard.advance"],
    ["siege_patience", "Siege Patience", "Sustained blocks build a retaliatory shield charge.", "combat.guard.sustained"],
    ["answer_in_kind", "Answer in Kind", "Successful parries copy a portion of the stopped damage.", "combat.parry.retaliation"],
    ["circle_unbroken", "Circle Unbroken", "Guarding allies shares a fraction of your stability.", "combat.guard.ally_aura"],
    ["refuse_the_fall", "Refuse the Fall", "A guard break can be canceled into a costly backward roll.", "combat.guard.break_escape"],
    ["gate_without_key", "The Gate Without a Key", "A perfect guard against a lethal blow creates an invulnerable counter beat.", "combat.capstone.guard"],
  ],
  vitality: [
    ["deep_lung", "Deep Lung", "Maximum stamina increases modestly.", "actor.stats.max_stamina"],
    ["scar_ledger", "Scar Ledger", "Repeated exposure slowly improves affliction tolerance.", "actor.affliction.adaptation"],
    ["warm_blood", "Warm Blood", "Cold and marsh fatigue accumulate more slowly.", "actor.hazard.fatigue"],
    ["second_breath", "Second Breath", "Dropping below half health immediately restores some stamina.", "actor.health.threshold"],
    ["iron_humor", "Iron Humor", "Physical resistance rises while afflicted; magical resistance falls.", "actor.stance.iron_humor"],
    ["pale_humor", "Pale Humor", "Magical resistance rises while afflicted; physical resistance falls.", "actor.stance.pale_humor"],
    ["knit_in_motion", "Knit in Motion", "Slow health regeneration begins after a long flawless movement chain.", "actor.recovery.no_hit"],
    ["bone_memory", "Bone Memory", "Iron Humor reduces poise damage after taking a heavy hit.", "actor.damage.heavy_received"],
    ["clear_veins", "Clear Veins", "Pale Humor turns a resisted curse into focus.", "actor.affliction.resisted"],
    ["reserve_heart", "Reserve Heart", "Resting above full nourishment grants temporary maximum health.", "actor.rest.nourishment"],
    ["mortal_interval", "Mortal Interval", "A precise recovery input shortens knockdown once per encounter.", "actor.knockdown.recovery"],
    ["life_kept_in_secret", "Life Kept in Secret", "Survive one lethal hit and convert remaining afflictions into a healing pulse.", "actor.capstone.vitality"],
  ],
  hexcraft: [
    ["first_syllable", "First Syllable", "Minor hexes consume less focus when begun at full stamina.", "magic.cast.open"],
    ["finger_of_smoke", "Finger of Smoke", "Movement during a cast obscures the caster briefly.", "magic.cast.mobile"],
    ["borrowed_name", "Borrowed Name", "Defeated enemies leave short-lived resonance for matching hexes.", "magic.resonance.kill"],
    ["double_utterance", "Double Utterance", "Alternating two hex schools accelerates the second cast.", "magic.combo.alternate"],
    ["cinder_covenant", "Cinder Covenant", "Fire hexes consume health for power and can scorch the caster.", "magic.stance.cinder"],
    ["hollow_covenant", "Hollow Covenant", "Void hexes consume stamina for control and weaken healing.", "magic.stance.hollow"],
    ["echo_without_mouth", "Echo Without Mouth", "Perfectly timed casts repeat a weaker phantom pulse.", "magic.cast.perfect"],
    ["red_grammar", "Red Grammar", "Cinder spells spread when they kill a burning enemy.", "magic.fire.kill_spread"],
    ["empty_grammar", "Empty Grammar", "Hollow spells linger longer on isolated enemies.", "magic.void.isolation"],
    ["counter_name", "Counter-Name", "Casting into an enemy spell can unravel both and refund focus.", "magic.cast.counterspell"],
    ["choir_of_one", "Choir of One", "Maintaining one school builds escalating resonance without repetition XP.", "magic.resonance.single_school"],
    ["word_the_world_refused", "The Word the World Refused", "A perfect seven-syllable rite suspends lesser enemies and ruptures elite wards.", "magic.capstone.hexcraft"],
  ],
  mining: [
    ["listen_to_stone", "Listen to Stone", "Vein signals remain visible longer between strikes.", "gather.mining.signal_decay"],
    ["square_stance", "Square Stance", "Off-center strikes destabilize the vein less.", "gather.mining.stability"],
    ["bright_splinter", "Bright Splinter", "Perfect strikes can reveal a secondary seam.", "gather.mining.perfect_strike"],
    ["fault_reader", "Fault Reader", "Predict one step farther in the fracture pattern.", "gather.mining.pattern_preview"],
    ["patient_delver", "Patient Delver", "Slow strikes improve purity but reduce yield speed.", "gather.mining.stance.purity"],
    ["ruthless_delver", "Ruthless Delver", "Fast strikes improve yield but increase collapse risk.", "gather.mining.stance.yield"],
    ["stone_echo", "Stone Echo", "Matching a three-note seam signal guarantees a clean break.", "gather.mining.echo_sequence"],
    ["unblemished_core", "Unblemished Core", "Patient extraction can produce high-purity cores.", "gather.mining.purity_reward"],
    ["splinter_storm", "Splinter Storm", "Ruthless extraction may double ore and damage the tool.", "gather.mining.overdraw"],
    ["deep_pressure", "Deep Pressure", "Dangerous cave depth adds quality instead of only XP.", "gather.mining.depth_bonus"],
    ["mountain_memory", "Mountain Memory", "Previously solved vein patterns begin partially revealed.", "gather.mining.pattern_memory"],
    ["heart_of_the_lode", "Heart of the Lode", "Perfectly solve a pristine vein to extract it without depletion once per region.", "gather.capstone.mining"],
  ],
  woodcutting: [
    ["grain_sight", "Grain Sight", "Show the safest portion of each swing arc.", "gather.woodcutting.grain_arc"],
    ["returning_swing", "Returning Swing", "Alternating swing directions builds rhythm faster.", "gather.woodcutting.alternation"],
    ["resin_nose", "Resin Nose", "Recognize trees likely to yield useful resin.", "gather.woodcutting.resin_preview"],
    ["living_fulcrum", "Living Fulcrum", "Timed footwork preserves both tool edge and tree health.", "gather.woodcutting.footwork"],
    ["forester_oath", "Forester's Oath", "Sustainable cuts improve regrowth and quality but reduce immediate logs.", "gather.woodcutting.stance.sustain"],
    ["charcoal_oath", "Charcoal Oath", "Aggressive cuts produce more logs but can exhaust a stand.", "gather.woodcutting.stance.harvest"],
    ["four_beat_felling", "Four-Beat Felling", "Complete a full rhythm loop for a precision bonus.", "gather.woodcutting.rhythm_loop"],
    ["seed_in_hand", "Seed in Hand", "Forester cuts can recover viable seeds and rare sap.", "gather.woodcutting.regrowth_reward"],
    ["falling_crown", "Falling Crown", "Charcoal cuts turn the final fall into an area harvest.", "gather.woodcutting.fall_direction"],
    ["weathered_ring", "Weathered Ring", "Storm and drought modifiers can improve special timber.", "gather.woodcutting.weather"],
    ["axe_knows_home", "The Axe Knows Home", "Perfect rhythm automatically aligns the next opening swing.", "gather.woodcutting.combo_carry"],
    ["forest_leaves_one_name", "The Forest Leaves One Name", "A flawless ancient-tree cut yields heartwood without killing the tree.", "gather.capstone.woodcutting"],
  ],
  foraging: [
    ["three_lobed_rule", "Three-Lobed Rule", "Reveal one additional visual clue during identification.", "gather.foraging.clue"],
    ["unbruised_thumb", "Unbruised Thumb", "Harvest timing is more forgiving on fragile plants.", "gather.foraging.harvest_window"],
    ["bitter_catalogue", "Bitter Catalogue", "Known poisonous traits are marked before tasting.", "gather.foraging.trait_preview"],
    ["field_comparison", "Field Comparison", "Comparing two specimens raises identification certainty.", "gather.foraging.compare"],
    ["herbalist_eye", "Herbalist's Eye", "Favor medicinal traits while reducing volatile reagent finds.", "gather.foraging.stance.medicine"],
    ["poisoner_eye", "Poisoner's Eye", "Favor volatile traits while reducing food-grade finds.", "gather.foraging.stance.volatile"],
    ["whole_root", "Whole Root", "A perfect extraction preserves every usable plant part.", "gather.foraging.full_harvest"],
    ["healing_pair", "Healing Pair", "Medicinal samples can inherit a second restorative trait.", "gather.foraging.medicine_bonus"],
    ["beautiful_warning", "Beautiful Warning", "Volatile samples reveal a potent hidden trait.", "gather.foraging.volatile_bonus"],
    ["season_turner", "Season Turner", "Remember seasonal habitats across region resets.", "gather.foraging.season_memory"],
    ["handful_of_weather", "Handful of Weather", "Gather during storms without damaging delicate reagents.", "gather.foraging.weather"],
    ["impossible_herbarium", "The Impossible Herbarium", "Correctly identify an unknown mythic bloom to propagate one sample at camp.", "gather.capstone.foraging"],
  ],
  fishing: [
    ["quiet_cast", "Quiet Cast", "Poor casts disturb the fishing spot less.", "gather.fishing.spot_stability"],
    ["thumb_on_line", "Thumb on the Line", "Tension warning begins before the line reaches danger.", "gather.fishing.tension_warning"],
    ["water_reader", "Water Reader", "Current direction is visible during the cast.", "gather.fishing.current"],
    ["give_and_take", "Give and Take", "Alternating reel and slack builds control.", "gather.fishing.control_loop"],
    ["patient_angler", "Patient Angler", "Long fights improve catch quality but consume more bait time.", "gather.fishing.stance.quality"],
    ["iron_angler", "Iron Angler", "Hard reels shorten fights but increase line-break risk.", "gather.fishing.stance.speed"],
    ["silver_tension", "Silver Tension", "Hold the line in the ideal band to tire a fish rapidly.", "gather.fishing.ideal_tension"],
    ["unscarred_scale", "Unscarred Scale", "Patient catches arrive pristine and sell for more.", "gather.fishing.pristine"],
    ["hooked_storm", "Hooked Storm", "Iron catches can immediately hook a second small fish.", "gather.fishing.chain_catch"],
    ["blackwater_lung", "Blackwater Lung", "Corrupted water no longer drains focus during fishing.", "gather.fishing.corruption"],
    ["relic_in_belly", "Relic in the Belly", "Treasure catches are easier to identify before landing.", "gather.fishing.treasure"],
    ["line_beneath_world", "The Line Beneath the World", "Land one legendary catch through a perfect tension cycle without consuming the spot.", "gather.capstone.fishing"],
  ],
  hunting: [
    ["bent_grass", "Bent Grass", "Tracks decay more slowly after inspection.", "gather.hunting.track_decay"],
    ["downwind_step", "Downwind Step", "Wind shifts warn before scent reaches prey.", "gather.hunting.scent"],
    ["clean_knife", "Clean Knife", "Field dressing loses less meat on an imperfect cut.", "gather.hunting.dressing"],
    ["three_signs", "Three Signs", "Triangulating tracks reveals likely prey behavior.", "gather.hunting.triangulate"],
    ["warden_method", "Warden Method", "Nonlethal traps preserve hides but take longer to set.", "gather.hunting.stance.warden"],
    ["predator_method", "Predator Method", "Ambush damage rises, but damaged hides lose quality.", "gather.hunting.stance.predator"],
    ["false_trail", "False Trail", "Place a scent decoy to redirect territorial beasts.", "gather.hunting.decoy"],
    ["mercy_of_cord", "Mercy of Cord", "Warden captures can be released for regional favor.", "gather.hunting.release"],
    ["first_blood", "First Blood", "Predator ambushes expose an anatomical weak point.", "gather.hunting.ambush"],
    ["pack_geometry", "Pack Geometry", "Read group movement and isolate one target.", "gather.hunting.pack"],
    ["trophy_without_waste", "Trophy Without Waste", "Perfect dressing yields hide, meat, bone, and a trophy roll.", "gather.hunting.full_dress"],
    ["beast_that_hunts_back", "The Beast That Hunts Back", "Turn a legendary predator's ambush into a flawless counter-hunt.", "gather.capstone.hunting"],
  ],
  smithing: [
    ["even_heat", "Even Heat", "The ideal forge-temperature band is wider.", "craft.smithing.heat_band"],
    ["square_blow", "Square Blow", "Off-angle hammer strikes cost less quality.", "craft.smithing.hammer_accuracy"],
    ["slag_eye", "Slag Eye", "Impurity pockets become visible before folding.", "craft.smithing.impurity"],
    ["fold_memory", "Fold Memory", "Repeated correct strike patterns raise structural quality.", "craft.smithing.pattern"],
    ["razor_temper", "Razor Temper", "Favor damage and lightness at the cost of durability.", "craft.smithing.stance.razor"],
    ["bastion_temper", "Bastion Temper", "Favor durability and guard at the cost of weight.", "craft.smithing.stance.bastion"],
    ["singing_anvil", "Singing Anvil", "Match hammer rhythm to metal resonance for bonus purity.", "craft.smithing.resonance"],
    ["hungry_edge", "Hungry Edge", "Razor-tempered criticals regain a trace of durability.", "craft.smithing.razor_bonus"],
    ["deep_quench", "Deep Quench", "Bastion-tempered gear gains poise after repair.", "craft.smithing.bastion_bonus"],
    ["masterwork_margin", "Masterwork Margin", "Near-perfect pieces may roll one masterwork trait.", "craft.smithing.quality_roll"],
    ["metal_remembers", "Metal Remembers", "Reforging preserves one selected legacy property.", "craft.smithing.reforge"],
    ["weapon_with_a_name", "A Weapon With a Name", "A flawless mythic forge creates a named item with a unique trait pair.", "craft.capstone.smithing"],
  ],
  woodcraft: [
    ["true_grain", "True Grain", "Grain-alignment guides remain visible while cutting.", "craft.woodcraft.grain"],
    ["thin_kerf", "Thin Kerf", "Accurate cuts waste less material.", "craft.woodcraft.waste"],
    ["patient_plane", "Patient Plane", "Surface finish decays more slowly between inputs.", "craft.woodcraft.finish"],
    ["hidden_join", "Hidden Join", "Perfect joint timing improves durability without adding weight.", "craft.woodcraft.joint"],
    ["bowyer_line", "Bowyer's Line", "Favor tension and range; shields and tools lose quality.", "craft.woodcraft.stance.bowyer"],
    ["wright_line", "Wright's Line", "Favor stability and utility; bows lose draw speed.", "craft.woodcraft.stance.wright"],
    ["grain_song", "Grain Song", "A continuous clean cut builds a quality multiplier.", "craft.woodcraft.clean_chain"],
    ["double_curve", "Double Curve", "Bowyer pieces can carry a second draw profile.", "craft.woodcraft.bowyer_bonus"],
    ["load_bearing_secret", "Load-Bearing Secret", "Wright pieces gain strength when used near capacity.", "craft.woodcraft.wright_bonus"],
    ["wood_without_waste", "Wood Without Waste", "Excellent crafts return useful offcuts.", "craft.woodcraft.material_refund"],
    ["living_laminate", "Living Laminate", "Combine two timber species while preserving both traits.", "craft.woodcraft.laminate"],
    ["bow_that_bends_moonlight", "The Bow That Bends Moonlight", "A flawless ancient-timber craft creates a self-tuning masterwork.", "craft.capstone.woodcraft"],
  ],
  leatherworking: [
    ["waxed_thread", "Waxed Thread", "Stitch tension remains stable for longer chains.", "craft.leather.thread_tension"],
    ["clean_scrape", "Clean Scrape", "Imperfect tanning removes less material.", "craft.leather.tanning_loss"],
    ["pattern_memory", "Pattern Memory", "Previously mastered patterns begin partially traced.", "craft.leather.pattern"],
    ["cross_stitch_ward", "Cross-Stitch Ward", "Perfect crossings add a small elemental ward.", "craft.leather.cross_stitch"],
    ["scout_cut", "Scout Cut", "Favor stealth and mobility at the cost of armor.", "craft.leather.stance.scout"],
    ["brute_cut", "Brute Cut", "Favor armor and poise at the cost of noise.", "craft.leather.stance.brute"],
    ["needle_rhythm", "Needle Rhythm", "Alternating stitch directions raises finish quality.", "craft.leather.rhythm"],
    ["silent_seam", "Silent Seam", "Scout pieces suppress sound after a perfect dodge.", "craft.leather.scout_bonus"],
    ["scarred_layer", "Scarred Layer", "Brute pieces harden temporarily after taking damage.", "craft.leather.brute_bonus"],
    ["measured_pocket", "Measured Pocket", "Excellent body pieces gain a utility pocket.", "craft.leather.utility_slot"],
    ["hide_keeps_shape", "Hide Keeps Shape", "Repairing masterwork leather cannot lower maximum durability.", "craft.leather.repair"],
    ["second_skin_mastery", "Second-Skin Mastery", "A flawless mythic pattern creates armor with no movement penalty.", "craft.capstone.leatherworking"],
  ],
  alchemy: [
    ["clean_decant", "Clean Decant", "Pour timing has a wider purity window.", "craft.alchemy.decant"],
    ["low_blue_flame", "Low Blue Flame", "Temperature drifts more slowly during infusion.", "craft.alchemy.temperature"],
    ["reagent_memory", "Reagent Memory", "Known ingredient conflicts are flagged before mixing.", "craft.alchemy.compatibility"],
    ["three_stage_distill", "Three-Stage Distill", "Correct reagent order raises potency and shelf life.", "craft.alchemy.order"],
    ["physicker_school", "Physicker School", "Restoratives strengthen; poisons and bombs weaken.", "craft.alchemy.stance.physicker"],
    ["fulminant_school", "Fulminant School", "Volatile mixtures strengthen; restorative yield falls.", "craft.alchemy.stance.fulminant"],
    ["color_of_purity", "Color of Purity", "Exact heat transitions reveal the ideal decant moment.", "craft.alchemy.heat_transition"],
    ["kindly_aftertaste", "Kindly Aftertaste", "Physicker tonics add a small delayed heal.", "craft.alchemy.physicker_bonus"],
    ["bottle_thunder", "Bottle Thunder", "Fulminant compounds gain area from excess potency.", "craft.alchemy.fulminant_bonus"],
    ["catalyst_cycle", "Catalyst Cycle", "Excellent brews may preserve their catalyst.", "craft.alchemy.catalyst"],
    ["impossible_solvent", "Impossible Solvent", "Extract one normally incompatible trait from a reagent.", "craft.alchemy.extract_trait"],
    ["draught_against_death", "The Draught Against Death", "A flawless mythic brew creates a single dose that reverses mortal collapse.", "craft.capstone.alchemy"],
  ],
  cooking: [
    ["low_flame", "Low Flame", "The ideal doneness window is wider.", "craft.cooking.doneness"],
    ["clean_board", "Clean Board", "Ingredient quality degrades more slowly during preparation.", "craft.cooking.prep"],
    ["pinch_by_memory", "Pinch by Memory", "Known seasoning pairings show expected effects.", "craft.cooking.seasoning"],
    ["layered_broth", "Layered Broth", "Correct ingredient order improves buff duration.", "craft.cooking.order"],
    ["hearthkeeper_style", "Hearthkeeper Style", "Favor healing and group portions; combat buffs weaken.", "craft.cooking.stance.hearthkeeper"],
    ["warcook_style", "Warcook Style", "Favor combat buffs; healing and portions shrink.", "craft.cooking.stance.warcook"],
    ["pan_rhythm", "Pan Rhythm", "Perfect heat changes build flavor quality.", "craft.cooking.heat_chain"],
    ["second_helping", "Second Helping", "Hearthkeeper meals occasionally produce an extra serving.", "craft.cooking.hearthkeeper_bonus"],
    ["battle_spice", "Battle Spice", "Warcook meals activate faster during combat.", "craft.cooking.warcook_bonus"],
    ["nothing_wasted", "Nothing Wasted", "Excellent preparation returns bones or usable scraps.", "craft.cooking.refund"],
    ["table_of_many_roads", "Table of Many Roads", "Meals using three regions gain a unique rested effect.", "craft.cooking.regional_pairing"],
    ["feast_remembers_guests", "The Feast Remembers Its Guests", "A flawless mythic feast grants a boon that persists through one defeat.", "craft.capstone.cooking"],
  ],
  runecrafting: [
    ["legible_hand", "Legible Hand", "Stroke guides fade more slowly during inscription.", "craft.runes.stroke_guide"],
    ["clean_dust", "Clean Dust", "Minor stroke errors add less contamination.", "craft.runes.contamination"],
    ["listening_stone", "Listening Stone", "Resonance pitch is shown before committing a line.", "craft.runes.resonance"],
    ["paired_stroke", "Paired Stroke", "Mirrored stroke sequences improve charge efficiency.", "craft.runes.mirror_sequence"],
    ["ward_scribe", "Ward-Scribe", "Protective sigils strengthen; destructive marks weaken.", "craft.runes.stance.ward"],
    ["rift_scribe", "Rift-Scribe", "Destructive marks strengthen; protective sigils become brittle.", "craft.runes.stance.rift"],
    ["breath_between_lines", "Breath Between Lines", "Pausing on exact beats clears contamination.", "craft.runes.pause_timing"],
    ["sheltering_clause", "Sheltering Clause", "Ward sigils share a fraction of protection with allies.", "craft.runes.ward_bonus"],
    ["hungry_clause", "Hungry Clause", "Rift sigils feed on enemy focus to extend duration.", "craft.runes.rift_bonus"],
    ["compound_name", "Compound Name", "Join two compatible single-use effects.", "craft.runes.compound"],
    ["stone_accepts_ink", "Stone Accepts Ink", "Excellent inscriptions can be fitted into reusable relics.", "craft.runes.relic_socket"],
    ["mark_that_outlives_language", "The Mark That Outlives Language", "A flawless mythic inscription creates one permanent personal sigil.", "craft.capstone.runecrafting"],
  ],
  wayfaring: [
    ["road_memory", "Road Memory", "Mapped paths remain clear longer through fog.", "explore.map.memory"],
    ["safe_descent", "Safe Descent", "The landing-balance window is wider on short drops.", "explore.traverse.landing"],
    ["weather_eye", "Weather Eye", "Hazard transitions appear earlier on the route forecast.", "explore.weather.forecast"],
    ["three_landmarks", "Three Landmarks", "Triangulating visible landmarks improves map accuracy.", "explore.map.triangulate"],
    ["pilgrim_route", "Pilgrim Route", "Favor shrines and safe paths; rare caches are harder to locate.", "explore.stance.pilgrim"],
    ["delver_route", "Delver Route", "Favor secrets and hazards; resting restores less travel fatigue.", "explore.stance.delver"],
    ["rope_and_nerve", "Rope and Nerve", "Perfect traversal inputs preserve climbing equipment.", "explore.traverse.perfect"],
    ["kindled_shortcut", "Kindled Shortcut", "Pilgrim discoveries can open one-way sanctuary paths.", "explore.pilgrim.shortcut"],
    ["wall_has_teeth", "The Wall Has Teeth", "Delver routes reveal dangerous breakable passages.", "explore.delver.secret"],
    ["map_beneath_map", "Map Beneath the Map", "Overlapping clues reveal buried route layers.", "explore.map.layers"],
    ["storm_as_compass", "Storm as Compass", "Severe weather can point toward rare sites.", "explore.weather.secret"],
    ["no_road_ends", "No Road Ends", "Complete a perfect mythic traverse to permanently connect two distant shrines.", "explore.capstone.wayfaring"],
  ],
});

// Tuple: [slug, display name, event hook]. Eight per skill, each paying XP only
// when its hook reports meaningful difficulty, contribution, or quality.
const ACTION_BLUEPRINTS = Object.freeze({
  swordsmanship: [
    ["mixed_chain", "Complete a mixed blade chain", "combat.combo.complete"],
    ["timed_guard_cut", "Land a guard-cut in its timing window", "combat.guard_cut.perfect"],
    ["weak_point_thrust", "Strike a moving weak point", "combat.weak_point.thrust"],
    ["riposte_elite", "Riposte an elite attack", "combat.riposte.elite"],
    ["stance_sequence", "Complete a stance-specific sequence", "combat.stance.sequence"],
    ["no_hit_duel", "Win a pressured duel without taking damage", "combat.encounter.no_hit"],
    ["sever_boss_cast", "Interrupt a boss action with a blade", "combat.interrupt.boss"],
    ["seven_cut_cadence", "Complete the seven-cut cadence", "combat.mastery.cadence"],
  ],
  heavy_arms: [
    ["charged_impact", "Land a fully charged impact", "combat.charge.full_hit"],
    ["break_guard", "Break a guarded enemy's stance", "combat.guard.break"],
    ["multi_stagger", "Stagger multiple enemies with one swing", "combat.stagger.multi"],
    ["plunge_elite", "Land an elite plunge attack", "combat.plunge.elite"],
    ["stance_sequence", "Complete a heavy stance sequence", "combat.stance.sequence"],
    ["armor_break", "Destroy an armored weak point", "combat.armor.break"],
    ["counter_colossus", "Counter a colossal attack", "combat.counter.colossus"],
    ["perfect_max_charge", "Release a perfect maximum charge", "combat.mastery.heavy_release"],
  ],
  marksmanship: [
    ["distance_hit", "Land a scored distance hit", "combat.ranged.distance_hit"],
    ["moving_weak_point", "Hit a moving weak point", "combat.ranged.moving_weak_point"],
    ["cover_thread", "Thread a shot through cover", "combat.ranged.cover_gap"],
    ["evade_release", "Release accurately from an evade", "combat.ranged.evade_release"],
    ["stance_sequence", "Complete a marksman stance sequence", "combat.stance.sequence"],
    ["three_target_chain", "Chain criticals across three targets", "combat.ranged.target_chain"],
    ["boss_interrupt", "Interrupt a boss at long range", "combat.ranged.boss_interrupt"],
    ["aligned_pierce", "Pierce aligned mythic weak points", "combat.mastery.aligned_pierce"],
  ],
  guard: [
    ["stable_block", "Absorb a combo without guard break", "combat.guard.combo"],
    ["perfect_guard", "Perform a perfect guard", "combat.guard.perfect"],
    ["redirect_projectile", "Redirect a projectile", "combat.guard.redirect"],
    ["protect_ally", "Intercept a lethal ally hit", "combat.guard.ally_save"],
    ["stance_sequence", "Complete a guard doctrine sequence", "combat.stance.sequence"],
    ["parry_elite", "Parry an elite finisher", "combat.parry.elite"],
    ["hold_boss_combo", "Hold through a boss combo", "combat.guard.boss_combo"],
    ["lethal_perfect_guard", "Perfect-guard a mythic lethal blow", "combat.mastery.guard"],
  ],
  vitality: [
    ["survive_affliction", "Survive and cleanse an affliction", "actor.affliction.survived"],
    ["recover_knockdown", "Nail a knockdown recovery", "actor.knockdown.perfect_recovery"],
    ["low_health_win", "Win an encounter at low health", "combat.encounter.low_health"],
    ["hazard_crossing", "Cross a severe hazard unaided", "actor.hazard.crossed"],
    ["adapt_resistance", "Develop a new adaptation", "actor.affliction.adapted"],
    ["flawless_endurance", "Sustain a long flawless combat interval", "combat.encounter.flawless_interval"],
    ["mortal_recovery", "Recover from mortal collapse", "actor.health.mortal_recovery"],
    ["carry_three_afflictions", "Defeat a mythic foe under three afflictions", "actor.mastery.afflicted_victory"],
  ],
  hexcraft: [
    ["timed_hex", "Release a hex on its resonance beat", "magic.cast.perfect"],
    ["alternate_schools", "Complete an alternating-school chain", "magic.combo.alternate"],
    ["exploit_resonance", "Exploit a defeated foe's resonance", "magic.resonance.consume"],
    ["counterspell", "Unravel a hostile spell", "magic.counterspell.success"],
    ["covenant_sequence", "Complete a covenant sequence", "magic.stance.sequence"],
    ["multi_hex_control", "Control multiple enemies with one rite", "magic.control.multi"],
    ["break_boss_ward", "Break a boss ward with its counter-name", "magic.ward.boss_break"],
    ["seven_syllable_rite", "Complete a flawless seven-syllable rite", "magic.mastery.rite"],
  ],
  mining: [
    ["read_signal", "Read a vein signal correctly", "gather.mining.signal_read"],
    ["clean_strike", "Land a clean fracture strike", "gather.mining.clean_strike"],
    ["preserve_stability", "Extract ore above safe stability", "gather.mining.stable_extract"],
    ["secondary_seam", "Reveal a secondary seam", "gather.mining.secondary_seam"],
    ["rare_core", "Extract a high-purity core", "gather.mining.rare_core"],
    ["deep_vein", "Solve a deep dangerous vein", "gather.mining.deep_vein"],
    ["perfect_pattern", "Complete a vein pattern flawlessly", "gather.mining.perfect_pattern"],
    ["mythic_lode", "Extract a mythic lode without depletion", "gather.mining.mythic_lode"],
  ],
  woodcutting: [
    ["read_grain", "Read a tree's grain", "gather.woodcutting.grain_read"],
    ["rhythm_pair", "Complete an alternating swing pair", "gather.woodcutting.rhythm_pair"],
    ["direct_fall", "Direct a safe tree fall", "gather.woodcutting.direct_fall"],
    ["tap_resin", "Tap a rare resin pocket", "gather.woodcutting.resin"],
    ["preserve_tree", "Harvest without exhausting the tree", "gather.woodcutting.preserved"],
    ["storm_felling", "Fell timber in severe weather", "gather.woodcutting.storm"],
    ["perfect_rhythm", "Complete a flawless felling rhythm", "gather.woodcutting.perfect_rhythm"],
    ["ancient_heartwood", "Take ancient heartwood without killing its tree", "gather.woodcutting.ancient_heartwood"],
  ],
  foraging: [
    ["identify_trait", "Identify a specimen trait", "gather.foraging.identify_trait"],
    ["clean_harvest", "Harvest a fragile plant cleanly", "gather.foraging.clean_harvest"],
    ["compare_samples", "Resolve a trait by comparison", "gather.foraging.compare"],
    ["discover_habitat", "Discover a new reagent habitat", "gather.foraging.habitat"],
    ["rare_trait", "Reveal a rare hidden trait", "gather.foraging.rare_trait"],
    ["weather_bloom", "Gather a weather-bound bloom", "gather.foraging.weather_bloom"],
    ["full_specimen", "Recover a complete pristine specimen", "gather.foraging.pristine"],
    ["mythic_propagation", "Propagate an unknown mythic bloom", "gather.foraging.mythic_propagation"],
  ],
  fishing: [
    ["accurate_cast", "Cast into a moving sweet spot", "gather.fishing.accurate_cast"],
    ["tension_cycle", "Complete an ideal tension cycle", "gather.fishing.tension_cycle"],
    ["counter_current", "Land a fish against a strong current", "gather.fishing.current"],
    ["pristine_catch", "Land a pristine catch", "gather.fishing.pristine"],
    ["chain_catch", "Chain a second catch", "gather.fishing.chain"],
    ["blackwater_catch", "Land a corrupted-water fish", "gather.fishing.blackwater"],
    ["relic_catch", "Recover a relic catch", "gather.fishing.relic"],
    ["legendary_tension", "Land a legend with perfect tension", "gather.fishing.legendary"],
  ],
  hunting: [
    ["read_track", "Interpret a fresh track", "gather.hunting.track"],
    ["set_clean_trap", "Set a clean trap", "gather.hunting.trap"],
    ["stay_downwind", "Complete a downwind approach", "gather.hunting.downwind"],
    ["triangulate_prey", "Triangulate hidden prey", "gather.hunting.triangulate"],
    ["clean_ambush", "Execute a clean ambush", "gather.hunting.ambush"],
    ["perfect_dressing", "Dress a carcass without waste", "gather.hunting.dress"],
    ["isolate_pack", "Isolate an elite pack target", "gather.hunting.pack"],
    ["counter_hunt", "Reverse a legendary predator's hunt", "gather.hunting.legendary"],
  ],
  smithing: [
    ["hold_heat", "Hold metal in its heat band", "craft.smithing.heat"],
    ["square_pattern", "Complete an accurate hammer pattern", "craft.smithing.pattern"],
    ["clean_fold", "Fold out an impurity", "craft.smithing.fold"],
    ["perfect_quench", "Time a perfect quench", "craft.smithing.quench"],
    ["quality_upgrade", "Forge an excellent item", "craft.quality.excellent"],
    ["trait_pair", "Forge a compatible trait pair", "craft.smithing.trait_pair"],
    ["legacy_reforge", "Preserve a legacy property while reforging", "craft.smithing.reforge"],
    ["named_masterwork", "Forge a named mythic masterwork", "craft.smithing.named"],
  ],
  woodcraft: [
    ["align_grain", "Align a difficult grain", "craft.woodcraft.grain"],
    ["clean_cut", "Complete a low-waste cut", "craft.woodcraft.cut"],
    ["perfect_joint", "Fit a perfect joint", "craft.woodcraft.joint"],
    ["balance_tension", "Balance bow or shield tension", "craft.woodcraft.tension"],
    ["quality_upgrade", "Craft an excellent wood item", "craft.quality.excellent"],
    ["hybrid_laminate", "Laminate two timber traits", "craft.woodcraft.laminate"],
    ["zero_waste", "Complete a zero-waste master craft", "craft.woodcraft.zero_waste"],
    ["self_tuning_bow", "Craft a mythic self-tuning bow", "craft.woodcraft.named"],
  ],
  leatherworking: [
    ["clean_tan", "Complete a clean tanning pass", "craft.leather.tan"],
    ["hold_tension", "Hold ideal stitch tension", "craft.leather.tension"],
    ["trace_pattern", "Trace a difficult pattern", "craft.leather.pattern"],
    ["cross_stitch", "Complete a warded cross-stitch", "craft.leather.cross_stitch"],
    ["quality_upgrade", "Craft an excellent leather item", "craft.quality.excellent"],
    ["utility_pocket", "Add a stable utility pocket", "craft.leather.pocket"],
    ["perfect_repair", "Repair without durability loss", "craft.leather.repair"],
    ["second_skin", "Craft mythic second-skin armor", "craft.leather.named"],
  ],
  alchemy: [
    ["clean_decant", "Complete a clean decant", "craft.alchemy.decant"],
    ["hold_temperature", "Hold an exact infusion temperature", "craft.alchemy.heat"],
    ["correct_order", "Resolve a reagent-order sequence", "craft.alchemy.order"],
    ["neutralize_conflict", "Neutralize an ingredient conflict", "craft.alchemy.conflict"],
    ["quality_upgrade", "Brew an excellent compound", "craft.quality.excellent"],
    ["preserve_catalyst", "Preserve a rare catalyst", "craft.alchemy.catalyst"],
    ["extract_impossible_trait", "Extract an incompatible trait", "craft.alchemy.extract"],
    ["death_reversal", "Brew a mythic death-reversal dose", "craft.alchemy.named"],
  ],
  cooking: [
    ["perfect_prep", "Prepare an ingredient perfectly", "craft.cooking.prep"],
    ["hold_doneness", "Hit the ideal doneness window", "craft.cooking.doneness"],
    ["season_pair", "Discover a seasoning pair", "craft.cooking.season"],
    ["layer_broth", "Complete a layered cooking sequence", "craft.cooking.order"],
    ["quality_upgrade", "Cook an excellent meal", "craft.quality.excellent"],
    ["regional_meal", "Combine three regional ingredients", "craft.cooking.regional"],
    ["full_feast", "Serve a flawless group feast", "craft.cooking.feast"],
    ["remembering_feast", "Cook a mythic remembering feast", "craft.cooking.named"],
  ],
  runecrafting: [
    ["clean_stroke", "Complete a clean rune stroke", "craft.runes.stroke"],
    ["match_resonance", "Match a stone's resonance", "craft.runes.resonance"],
    ["clear_contamination", "Clear inscription contamination", "craft.runes.cleanse"],
    ["paired_sequence", "Complete a mirrored stroke sequence", "craft.runes.mirror"],
    ["quality_upgrade", "Inscribe an excellent sigil", "craft.quality.excellent"],
    ["compound_sigil", "Join two compatible clauses", "craft.runes.compound"],
    ["reusable_relic", "Inscribe a reusable relic", "craft.runes.relic"],
    ["permanent_mark", "Create a mythic permanent mark", "craft.runes.named"],
  ],
  wayfaring: [
    ["map_landmark", "Map a new landmark", "explore.map.landmark"],
    ["perfect_landing", "Complete a perfect landing", "explore.traverse.landing"],
    ["read_weather", "Predict a hazard transition", "explore.weather.read"],
    ["triangulate_route", "Triangulate a hidden route", "explore.map.triangulate"],
    ["open_shortcut", "Open a meaningful shortcut", "explore.shortcut"],
    ["solve_route_layer", "Resolve an overlapping map layer", "explore.map.layer"],
    ["storm_secret", "Find a secret through severe weather", "explore.weather.secret"],
    ["connect_shrines", "Permanently connect distant shrines", "explore.mastery.connection"],
  ],
});

const GATHERING_MINIGAMES = Object.freeze({
  mining: { id: "fracture_echo", phases: ["listen", "aim", "strike", "stabilize"], scoringInputs: ["signalMatch", "strikeAccuracy", "veinStability"], perfectThreshold: 0.92 },
  woodcutting: { id: "grain_rhythm", phases: ["readGrain", "setFooting", "swing", "directFall"], scoringInputs: ["arcAccuracy", "alternation", "treeHealth"], perfectThreshold: 0.9 },
  foraging: { id: "specimen_logic", phases: ["observe", "compare", "identify", "extract"], scoringInputs: ["traitCertainty", "toolPressure", "specimenIntegrity"], perfectThreshold: 0.94 },
  fishing: { id: "line_tension", phases: ["cast", "hook", "yield", "reel"], scoringInputs: ["castAccuracy", "tensionControl", "fishFatigue"], perfectThreshold: 0.9 },
  hunting: { id: "trail_inference", phases: ["inspect", "triangulate", "approach", "resolve"], scoringInputs: ["trackCertainty", "scentControl", "harvestIntegrity"], perfectThreshold: 0.92 },
  wayfaring: { id: "route_reading", phases: ["observe", "triangulate", "traverse", "record"], scoringInputs: ["mapAccuracy", "balance", "hazardRead"], perfectThreshold: 0.93 },
});

const ARTISAN_QUALITY_MODELS = Object.freeze({
  smithing: { variables: ["metalPurity", "heatControl", "hammerAccuracy", "quenchTiming"], weights: [0.2, 0.25, 0.3, 0.25] },
  woodcraft: { variables: ["grainAlignment", "cutWaste", "jointFit", "tensionBalance"], weights: [0.3, 0.2, 0.25, 0.25] },
  leatherworking: { variables: ["hideIntegrity", "tanBalance", "patternAccuracy", "stitchTension"], weights: [0.25, 0.2, 0.25, 0.3] },
  alchemy: { variables: ["reagentPurity", "temperature", "ingredientOrder", "decantTiming"], weights: [0.25, 0.25, 0.3, 0.2] },
  cooking: { variables: ["ingredientQuality", "preparation", "heatControl", "seasoningBalance"], weights: [0.25, 0.2, 0.3, 0.25] },
  runecrafting: { variables: ["dustPurity", "strokeAccuracy", "resonance", "contamination"], weights: [0.2, 0.3, 0.3, 0.2] },
});

const COMBAT_TIMING_HOOKS = Object.freeze({
  swordsmanship: { event: "combat.blade.input", perfectWindowMs: 105, grades: ["late", "good", "perfect"] },
  heavy_arms: { event: "combat.heavy.release", perfectWindowMs: 145, grades: ["early", "set", "perfect"] },
  marksmanship: { event: "combat.ranged.release", perfectWindowMs: 115, grades: ["loose", "steady", "perfect"] },
  guard: { event: "combat.guard.contact", perfectWindowMs: 90, grades: ["block", "deflect", "perfect"] },
  vitality: { event: "actor.recovery.input", perfectWindowMs: 155, grades: ["strained", "clean", "perfect"] },
  hexcraft: { event: "magic.syllable.input", perfectWindowMs: 125, grades: ["frayed", "clear", "perfect"] },
});

const PROGRESSION_RULES = Object.freeze({
  formula: "floor(baseXp * tierMultiplier * difficulty * timing * quality * rested * diversity * repetition)",
  rested: {
    accrual: "Gain one rested charge per 8 minutes spent at a sanctuary or offline.",
    chargeIntervalMinutes: 8,
    offlineCapHours: 12,
    multiplier: 1.5,
    chargesSpentPerEligibleAction: 1,
  },
  diversity: {
    rollingWindowMinutes: 20,
    distinctActionBonuses: [0, 0, 0.08, 0.14, 0.2],
    rule: "The first four distinct action IDs used in the window build a diversity bonus.",
  },
  antiGrind: {
    graceRepeats: 5,
    decayPerRepeat: 0.04,
    minimumMultiplier: 0.45,
    recovery: "Completing two other action IDs restores one repetition step.",
    exemptions: ["firstDiscovery", "boss", "masteryTrial", "rareResource", "newRecipeQuality"],
  },
  contributionGate: {
    minimumDifficultyRatio: 0.55,
    minimumEncounterContribution: 0.08,
    rule: "Trivial targets, abandoned crafts, and zero-risk inputs do not award skill XP.",
  },
});

function makeTechniqueNodes(skillId, blueprints) {
  return Object.freeze(blueprints.map((entry, index) => {
    const tierIndex = Math.floor(index / 3);
    const id = `${skillId}.${entry[0]}`;
    const exclusivePeerIndex = index === 4 ? 5 : index === 5 ? 4 : -1;

    return Object.freeze({
      id,
      skillId,
      name: entry[1],
      tier: TIER_NAMES[tierIndex],
      tierIndex: tierIndex + 1,
      levelRequired: index === 11 ? 90 : TECHNIQUE_LEVELS[tierIndex],
      cost: TIER_COSTS[tierIndex][index % 3],
      prerequisites: PREREQUISITE_INDEXES[index].map((requiredIndex) => `${skillId}.${blueprints[requiredIndex][0]}`),
      exclusiveGroup: exclusivePeerIndex >= 0 ? `${skillId}.adept_path` : null,
      excludes: exclusivePeerIndex >= 0 ? [`${skillId}.${blueprints[exclusivePeerIndex][0]}`] : [],
      effects: [{
        hook: entry[3],
        description: entry[2],
        potency: TIER_POTENCY[tierIndex],
      }],
      capstone: index === 11,
    });
  }));
}

function makeMilestones(skill) {
  const categoryObjectives = {
    combat: ["Win using three distinct timing hooks", "Defeat an elite using both offense and defense actions", "Clear a dangerous encounter with no repeated finisher", "Complete an expert encounter under a build constraint"],
    gathering: ["Complete three clean minigame resolutions", "Gather from three different region tags", "Recover an expert resource above 90% integrity", "Complete a rare node without repeating an input pattern"],
    artisan: ["Craft three useful items above standard quality", "Use materials from three regions in distinct recipes", "Create an expert item above 90% quality", "Finish a complex craft without an invalid input"],
    mystic: ["Complete three clean resonance sequences", "Use three distinct clauses or spell schools", "Create or cast an expert effect above 90% timing", "Resolve a dangerous rite without contamination"],
    exploration: ["Map three connected landmarks", "Open routes in three different hazard types", "Complete an expert traverse above 90% accuracy", "Reveal a layered route without a failed input"],
  };
  const objectives = categoryObjectives[skill.category] ?? categoryObjectives.exploration;

  return Object.freeze([10, 25, 50, 75].map((level, index) => Object.freeze({
    id: `${skill.id}.milestone_${level}`,
    levelRequired: level,
    name: `${skill.name} Proving ${index + 1}`,
    objective: objectives[index],
    reward: { techniquePoints: index + 1, restedCharges: 2 + index },
  })));
}

function makeAction(skill, entry, index) {
  const tier = ACTION_TIERS[index];
  const qualityModel = ARTISAN_QUALITY_MODELS[skill.id];
  const minigame = GATHERING_MINIGAMES[skill.id];
  const timing = COMBAT_TIMING_HOOKS[skill.id];

  return Object.freeze({
    id: `${skill.id}.${entry[0]}`,
    skillId: skill.id,
    name: entry[1],
    hook: entry[2],
    tier,
    requirements: {
      skillLevel: ACTION_LEVELS[index],
      minimumDifficultyRatio: PROGRESSION_RULES.contributionGate.minimumDifficultyRatio,
      validResolution: true,
    },
    xpFormula: PROGRESSION_RULES.formula,
    formulaVariables: {
      baseXp: skill.baseXp,
      tierMultiplier: ACTION_TIER_MULTIPLIERS[tier],
      difficultyRange: [0.75, 1.6],
      timingRange: timing ? [0.8, 1.25] : [1, 1],
      qualityRange: qualityModel || minigame ? [0.7, 1.3] : [1, 1],
      restedMultiplier: PROGRESSION_RULES.rested.multiplier,
      diversityMaximum: 1.2,
      repetitionMinimum: PROGRESSION_RULES.antiGrind.minimumMultiplier,
    },
    timing: timing ? { ...timing } : null,
    minigame: minigame ? { modelId: minigame.id, scoringInputs: [...minigame.scoringInputs], perfectThreshold: minigame.perfectThreshold } : null,
    qualityVariables: qualityModel ? [...qualityModel.variables] : [],
    antiGrindTags: [skill.id, entry[0], entry[2]],
  });
}

const trees = {};
const actions = {};

for (const skill of SKILLS) {
  const blueprints = TECHNIQUE_BLUEPRINTS[skill.id] ?? [];
  const actionBlueprints = ACTION_BLUEPRINTS[skill.id] ?? [];
  const nodes = makeTechniqueNodes(skill.id, blueprints);

  actions[skill.id] = Object.freeze(actionBlueprints.map((entry, index) => makeAction(skill, entry, index)));
  trees[skill.id] = Object.freeze({
    skillId: skill.id,
    name: skill.name,
    category: skill.category,
    techniquePointRules: {
      earnedAtLevels: [5, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 99],
      milestonePoints: true,
      respec: "Mutually exclusive paths can be unbound at a sanctuary for marks and one rested charge.",
    },
    progressionRules: PROGRESSION_RULES,
    systemHooks: {
      combatTiming: COMBAT_TIMING_HOOKS[skill.id] ?? null,
      gatheringMinigame: GATHERING_MINIGAMES[skill.id] ?? null,
      artisanQuality: ARTISAN_QUALITY_MODELS[skill.id] ?? null,
    },
    nodes,
    milestoneChallenges: makeMilestones(skill),
    capstone: {
      nodeId: nodes[11]?.id ?? null,
      masteryTrialId: `${skill.id}.mastery_trial`,
      unlockRule: "Reach level 90, complete all four milestone challenges, then pass the mastery trial.",
    },
  });
}

export const SKILL_TREES = Object.freeze(trees);
export const SKILL_ACTIONS = Object.freeze(actions);

function makeSynergy(id, name, skillIds, description, tradeoff, hook, levels = []) {
  return Object.freeze({
    id,
    name,
    skills: skillIds,
    requirements: skillIds.map((skillId, index) => ({ skillId, level: levels[index] ?? 35 })),
    effect: description,
    tradeoff,
    hook,
  });
}

export const CROSS_SKILL_SYNERGIES = Object.freeze([
  makeSynergy("silver_riposte", "Silver Riposte", ["swordsmanship", "guard", "smithing"], "Perfect parries with a self-forged blade prime a spirit-piercing riposte.", "The blade loses durability when the riposte misses.", "synergy.combat.silver_riposte", [30, 35, 40]),
  makeSynergy("walking_bell", "Walking Bell", ["heavy_arms", "vitality"], "High equip burden adds controlled poise and impact after a perfect recovery input.", "Stamina regeneration pauses briefly after the empowered blow.", "synergy.combat.walking_bell", [38, 32]),
  makeSynergy("moon_stalker", "Moon Stalker", ["marksmanship", "hunting", "leatherworking"], "Pristine self-crafted leathers preserve ranged focus while stalking marked prey.", "Taking a direct hit cancels the focus stack.", "synergy.ranged.moon_stalker", [36, 42, 32]),
  makeSynergy("warded_bastion", "Warded Bastion", ["guard", "runecrafting", "smithing"], "A self-inscribed shield stores one perfectly guarded spell and releases its element on bash.", "Stored magic slowly damages the shield.", "synergy.guard.warded_bastion", [40, 45, 40]),
  makeSynergy("red_physicker", "Red Physicker", ["vitality", "alchemy"], "Using a restorative below one-third health grants affliction resistance and faster recovery.", "The next restorative within a minute is less effective.", "synergy.survival.red_physicker", [35, 35]),
  makeSynergy("spoken_steel", "Spoken Steel", ["hexcraft", "smithing", "runecrafting"], "Named weapons accept one temporary hex clause without consuming a weapon coating slot.", "Each clause raises focus costs until resting.", "synergy.magic.spoken_steel", [45, 50, 45]),
  makeSynergy("ore_whisperer", "Ore Whisperer", ["mining", "hexcraft"], "Resonance reveals the next fracture note and may expose occult ore.", "A failed note releases a hostile echo.", "synergy.gather.ore_whisperer", [32, 28]),
  makeSynergy("living_bow", "Living Bow", ["woodcutting", "woodcraft", "marksmanship"], "Sustainably harvested bows gain accuracy as their wielder completes varied shots.", "Repeating the same shot strips the bonus quickly.", "synergy.ranged.living_bow", [40, 45, 40]),
  makeSynergy("field_apothecary", "Field Apothecary", ["foraging", "alchemy", "wayfaring"], "First-time regional specimens can be brewed at camp with a discovery potency bonus.", "The improvised brew has a short shelf life.", "synergy.craft.field_apothecary", [35, 40, 30]),
  makeSynergy("blackwater_table", "Blackwater Table", ["fishing", "cooking", "vitality"], "Pristine corrupted fish create meals that convert a portion of curse buildup into stamina.", "The eater becomes more vulnerable to fire.", "synergy.food.blackwater_table", [42, 42, 35]),
  makeSynergy("nothing_wasted", "Nothing Wasted", ["hunting", "cooking", "leatherworking"], "Perfectly dressed prey contributes a quality bonus to both its meal and armor recipes.", "Mixing in purchased animal materials removes the bonus.", "synergy.craft.nothing_wasted", [38, 32, 38]),
  makeSynergy("siege_wright", "Siege-Wright", ["heavy_arms", "woodcraft", "smithing"], "Self-built hafts and heads unlock a braced charged attack with extreme structure damage.", "The braced attack cannot change direction after release.", "synergy.combat.siege_wright", [45, 45, 45]),
  makeSynergy("pilgrims_pan", "Pilgrim's Pan", ["cooking", "wayfaring"], "Meals containing ingredients from newly mapped regions extend rested XP charges.", "The extension applies only once per region cycle.", "synergy.explore.pilgrims_pan", [30, 35]),
  makeSynergy("silent_clause", "Silent Clause", ["runecrafting", "leatherworking", "hunting"], "A stealth sigil stitched into pristine leather suppresses sound after a clean trap or kill.", "Rolling repeatedly breaks the silence.", "synergy.stealth.silent_clause", [42, 38, 36]),
  makeSynergy("ember_line", "Ember Line", ["woodcutting", "woodcraft", "hexcraft"], "Ember-yew implements channel fire hexes and retain one cinder charge.", "Water exposure discharges the stored cinder.", "synergy.magic.ember_line", [55, 58, 45]),
  makeSynergy("gravesilver_cartographer", "Gravesilver Cartographer", ["mining", "smithing", "wayfaring"], "Gravesilver tools reveal spectral route marks near buried passages.", "The tool glows and makes stealth harder near spirits.", "synergy.explore.gravesilver_map", [42, 46, 38]),
  makeSynergy("venom_fletching", "Venom Fletching", ["foraging", "alchemy", "marksmanship"], "Identified volatile traits can be bound to crafted ammunition with predictable status buildup.", "Coated ammunition decays when resting.", "synergy.ranged.venom_fletching", [38, 42, 38]),
  makeSynergy("shoreline_trapper", "Shoreline Trapper", ["fishing", "hunting", "woodcraft"], "Fish offcuts bait durable self-built traps and improve rare-prey lure strength.", "The lure also attracts scavengers.", "synergy.gather.shoreline_trapper", [30, 34, 28]),
  makeSynergy("supper_of_names", "Supper of Names", ["cooking", "hexcraft", "runecrafting"], "A ritual meal can bind one known enemy resonance to the party until defeat.", "All diners share a matching elemental weakness.", "synergy.magic.supper_of_names", [48, 50, 50]),
  makeSynergy("road_without_wounds", "Road Without Wounds", ["wayfaring", "vitality", "guard"], "Perfect traversal followed by a perfect guard grants brief immunity to environmental stagger.", "Fast travel removes the prepared state.", "synergy.explore.road_without_wounds", [50, 42, 42]),
]);

const MASTERY_TRIAL_BLUEPRINTS = Object.freeze({
  swordsmanship: ["The Seven Red Beats", "Defeat the Nameless Fencer using seven different blade actions in order."],
  heavy_arms: ["The Bell Below", "Break three armored echoes before the floor collapses, without repeating a finisher."],
  marksmanship: ["A Star Through Fog", "Strike seven moving lights through shifting cover without missing twice in succession."],
  guard: ["The Door That Strikes", "Survive and answer a lethal guard sequence using blocks, redirects, and parries."],
  vitality: ["Trial of the Last Pulse", "Cross three affliction chambers and defeat their keeper without resting."],
  hexcraft: ["The Unspoken Choir", "Complete a seven-syllable rite while hostile echoes disrupt its cadence."],
  mining: ["Heart Beneath Hammer", "Solve a mythic fracture pattern while preserving at least 95% vein stability."],
  woodcutting: ["The Tree That Refuses", "Fell no tree: recover heartwood from the walking elder through perfect sustainable cuts."],
  foraging: ["Garden of False Names", "Identify and propagate the only true bloom among a field of dangerous mimics."],
  fishing: ["Line Into Night", "Land the Bell-Mouthed Ancient through a complete perfect-tension fight."],
  hunting: ["The Hunter Behind You", "Track a predator that erases tracks and turn all three of its ambushes."],
  smithing: ["The Cold Anvil", "Forge a named blade while heat, purity, hammering, and quench are independently tested."],
  woodcraft: ["The Moon-Bent Bow", "Shape two opposing grains into a flawless self-tuning weapon."],
  leatherworking: ["Pattern Without Shadow", "Trace and stitch a moving mythic pattern without breaking tension."],
  alchemy: ["The Empty Crucible", "Infer an unknown reagent order and preserve the catalyst in a flawless brew."],
  cooking: ["Table for the Departed", "Prepare a seven-course remembrance feast before its spectral guests fade."],
  runecrafting: ["The Last Legible Stone", "Inscribe a permanent mark while resonance and contamination invert each phase."],
  wayfaring: ["The Road That Moves", "Map and traverse a shifting route to connect two sealed shrines in one journey."],
});

export const MASTERY_TRIALS = Object.freeze(SKILLS.map((skill) => {
  const blueprint = MASTERY_TRIAL_BLUEPRINTS[skill.id];
  const skillActions = SKILL_ACTIONS[skill.id];
  const capstoneNodeId = SKILL_TREES[skill.id].capstone.nodeId;

  return Object.freeze({
    id: `${skill.id}.mastery_trial`,
    skillId: skill.id,
    name: blueprint[0],
    levelRequired: 90,
    premise: blueprint[1],
    entryRequirements: {
      completedMilestones: SKILL_TREES[skill.id].milestoneChallenges.map((milestone) => milestone.id),
      distinctActionsMastered: 6,
      techniquePointsSpent: 18,
    },
    objectives: [
      { id: "variety", text: `Complete six distinct ${skill.name} actions.`, actionIds: skillActions.slice(0, 6).map((action) => action.id) },
      { id: "precision", text: "Earn three perfect timing or quality grades during the trial.", minimumGrade: 0.92, count: 3 },
      { id: "finale", text: `Resolve ${skillActions[7].name.toLowerCase()} without triggering repetition decay.`, actionId: skillActions[7].id },
    ],
    modifiers: { restedXpDisabled: true, repetitionFailureThreshold: 0.8, defeatResetsTrial: true },
    reward: { techniquePoints: 3, unlockNodeId: capstoneNodeId, title: `Master of ${skill.name}` },
  });
}));

/**
 * Validate exact skill coverage and every cross-reference in this module.
 * Returns diagnostics instead of throwing so development UI can display faults.
 */
export function validateSkillTrees() {
  const errors = [];
  const skillIds = new Set(SKILLS.map((skill) => skill.id));
  const treeIds = Object.keys(SKILL_TREES);
  let nodeCount = 0;
  let actionCount = 0;

  for (const skillId of skillIds) {
    const tree = SKILL_TREES[skillId];
    const skillActions = SKILL_ACTIONS[skillId];

    if (!tree) {
      errors.push(`Missing skill tree: ${skillId}`);
      continue;
    }
    if (!Array.isArray(tree.nodes) || tree.nodes.length < 12) errors.push(`${skillId} has fewer than 12 technique nodes.`);
    if (!Array.isArray(skillActions) || skillActions.length < 8) errors.push(`${skillId} has fewer than 8 XP actions.`);

    const nodeIds = new Set((tree.nodes ?? []).map((node) => node.id));
    nodeCount += tree.nodes?.length ?? 0;
    actionCount += skillActions?.length ?? 0;

    if (nodeIds.size !== (tree.nodes?.length ?? 0)) errors.push(`${skillId} has duplicate node IDs.`);
    for (const node of tree.nodes ?? []) {
      if (!TIER_NAMES.includes(node.tier)) errors.push(`${node.id} has an invalid tier.`);
      if (!(node.cost > 0)) errors.push(`${node.id} has an invalid cost.`);
      if (!Number.isInteger(node.levelRequired) || node.levelRequired < 1 || node.levelRequired > 99) errors.push(`${node.id} has an invalid level gate.`);
      if (node.capstone && node.levelRequired !== 90) errors.push(`${node.id} capstone must require level 90.`);
      if (!Array.isArray(node.effects) || node.effects.length === 0) errors.push(`${node.id} has no effects.`);
      for (const prerequisite of node.prerequisites ?? []) {
        if (!nodeIds.has(prerequisite)) errors.push(`${node.id} has missing prerequisite ${prerequisite}.`);
      }
      for (const excluded of node.excludes ?? []) {
        if (!nodeIds.has(excluded)) errors.push(`${node.id} excludes missing node ${excluded}.`);
      }
    }

    const exclusiveNodes = (tree.nodes ?? []).filter((node) => node.exclusiveGroup);
    if (exclusiveNodes.length < 2) errors.push(`${skillId} has no mutually exclusive choice.`);
    if (!tree.capstone?.nodeId || !nodeIds.has(tree.capstone.nodeId)) errors.push(`${skillId} has an invalid capstone.`);
    if (!Array.isArray(tree.milestoneChallenges) || tree.milestoneChallenges.length < 4) errors.push(`${skillId} lacks milestone challenges.`);

    for (const action of skillActions ?? []) {
      if (!action.xpFormula || !action.requirements || !(action.tier >= 1)) errors.push(`${action.id} lacks XP formula, tier, or requirements.`);
    }
  }

  for (const treeId of treeIds) {
    if (!skillIds.has(treeId)) errors.push(`Unknown tree skill ID: ${treeId}`);
  }
  for (const actionSkillId of Object.keys(SKILL_ACTIONS)) {
    if (!skillIds.has(actionSkillId)) errors.push(`Unknown action skill ID: ${actionSkillId}`);
  }
  for (const synergy of CROSS_SKILL_SYNERGIES) {
    for (const skillId of synergy.skills) {
      if (!skillIds.has(skillId)) errors.push(`${synergy.id} references unknown skill ${skillId}.`);
    }
  }
  for (const skillId of skillIds) {
    const trials = MASTERY_TRIALS.filter((trial) => trial.skillId === skillId);
    if (trials.length !== 1) errors.push(`${skillId} must have exactly one mastery trial.`);
  }
  if (nodeCount < 216) errors.push(`Expected at least 216 technique nodes, found ${nodeCount}.`);
  if (actionCount < 144) errors.push(`Expected at least 144 skill actions, found ${actionCount}.`);

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
    summary: Object.freeze({
      skills: skillIds.size,
      trees: treeIds.length,
      techniqueNodes: nodeCount,
      actions: actionCount,
      synergies: CROSS_SKILL_SYNERGIES.length,
      masteryTrials: MASTERY_TRIALS.length,
    }),
  });
}
