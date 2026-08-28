// Core progression and economy data for the vertical slice.
// Everything is deliberately data-driven so UI, combat, gathering, and save
// systems can share the same source of truth without importing game logic.

export const SKILLS = Object.freeze([
  {
    id: "swordsmanship",
    name: "Swordsmanship",
    icon: "⚔",
    category: "combat",
    color: "#c96d55",
    description: "Master quick blades, measured combos, ripostes, and execution attacks.",
    maxLevel: 99,
    baseXp: 12,
    milestones: [
      { level: 5, name: "Measured Cut", effect: "+3% light-attack stamina efficiency." },
      { level: 20, name: "Riposte", effect: "Perfect guards empower the next blade strike." },
      { level: 45, name: "Red Tempo", effect: "Third consecutive hit gains poise damage." },
      { level: 75, name: "Headsman's Calm", effect: "+10% damage against wounded enemies." },
    ],
  },
  {
    id: "heavy_arms",
    name: "Heavy Arms",
    icon: "🔨",
    category: "combat",
    color: "#b9815d",
    description: "Wield hammers, axes, and great weapons that break armor and enemy poise.",
    maxLevel: 99,
    baseXp: 14,
    milestones: [
      { level: 5, name: "Shoulder the Weight", effect: "Heavy weapons impose 5% less equip burden." },
      { level: 20, name: "Crushing Arc", effect: "Charged attacks cleave a wider area." },
      { level: 45, name: "Bell Ringer", effect: "+12% poise damage after a dodge." },
      { level: 75, name: "Mountain's Answer", effect: "Heavy finishers cannot be interrupted once per encounter." },
    ],
  },
  {
    id: "marksmanship",
    name: "Marksmanship",
    icon: "🏹",
    category: "combat",
    color: "#c39b4a",
    description: "Place arrows and bolts into exposed targets while managing aim, range, and ammunition.",
    maxLevel: 99,
    baseXp: 13,
    milestones: [
      { level: 5, name: "Steady Breath", effect: "Aim sway settles 15% faster." },
      { level: 20, name: "Barbed Flight", effect: "Critical shots inflict a short bleed." },
      { level: 45, name: "Thread the Dark", effect: "Lock-on range is increased at night." },
      { level: 75, name: "Last Feather", effect: "The final arrow in a stack deals bonus damage." },
    ],
  },
  {
    id: "guard",
    name: "Guard",
    icon: "🛡",
    category: "combat",
    color: "#6687a3",
    description: "Improve blocking, parrying, armor handling, and resistance to stagger.",
    maxLevel: 99,
    baseXp: 11,
    milestones: [
      { level: 5, name: "Braced", effect: "+4% guard stability." },
      { level: 20, name: "Catch the Blow", effect: "Perfect guards refund a little stamina." },
      { level: 45, name: "Iron Posture", effect: "Gain brief poise after drinking a tonic." },
      { level: 75, name: "Unbroken", effect: "Survive one lethal hit at 1 health per rest." },
    ],
  },
  {
    id: "vitality",
    name: "Vitality",
    icon: "♥",
    category: "combat",
    color: "#a9474f",
    description: "Harden body and nerve through peril, increasing health, recovery, and affliction tolerance.",
    maxLevel: 99,
    baseXp: 10,
    milestones: [
      { level: 5, name: "Deep Lung", effect: "+3% maximum stamina." },
      { level: 20, name: "Scar Tissue", effect: "+8% bleed resistance." },
      { level: 45, name: "Second Wind", effect: "Recover stamina faster while below half health." },
      { level: 75, name: "Mortal Defiance", effect: "Healing is stronger when no reserve flasks remain." },
    ],
  },
  {
    id: "hexcraft",
    name: "Hexcraft",
    icon: "◈",
    category: "mystic",
    color: "#8e6ac7",
    description: "Shape dangerous rites from memory, focus, and the lingering names of dead things.",
    maxLevel: 99,
    baseXp: 15,
    milestones: [
      { level: 5, name: "Kindled Word", effect: "Minor hexes cost 4% less focus." },
      { level: 20, name: "Echo Cast", effect: "Kills briefly accelerate the next cast." },
      { level: 45, name: "Black Communion", effect: "Spend health to cast when focus is empty." },
      { level: 75, name: "Name Unmade", effect: "Hex criticals temporarily reduce enemy resistance." },
    ],
  },
  {
    id: "mining",
    name: "Mining",
    icon: "⛏",
    category: "gathering",
    color: "#89909a",
    description: "Read old stone, expose buried veins, and recover metals from dangerous workings.",
    maxLevel: 99,
    baseXp: 10,
    milestones: [
      { level: 5, name: "Stone Ear", effect: "Nearby ore gives off a faint chime." },
      { level: 20, name: "Clean Break", effect: "+10% chance to gain a second ore." },
      { level: 45, name: "Deep Delver", effect: "Mining is faster in caves." },
      { level: 75, name: "Motherlode", effect: "Rare veins can yield an intact core." },
    ],
  },
  {
    id: "woodcutting",
    name: "Woodcutting",
    icon: "🪓",
    category: "gathering",
    color: "#617c50",
    description: "Harvest warped timber and resin without waking everything rooted nearby.",
    maxLevel: 99,
    baseXp: 10,
    milestones: [
      { level: 5, name: "Sure Swing", effect: "+5% chopping speed." },
      { level: 20, name: "Resin Tap", effect: "Trees can also yield alchemical resin." },
      { level: 45, name: "Heartwood", effect: "+12% chance to preserve a depleted tree." },
      { level: 75, name: "Old Growth", effect: "Ancient trees yield one guaranteed extra log." },
    ],
  },
  {
    id: "foraging",
    name: "Foraging",
    icon: "🌿",
    category: "gathering",
    color: "#779f61",
    description: "Recognize useful herbs, fungi, salts, and other fragile materials in the wild.",
    maxLevel: 99,
    baseXp: 9,
    milestones: [
      { level: 5, name: "Field Nose", effect: "Harvestable plants remain highlighted longer." },
      { level: 20, name: "Gentle Hand", effect: "+12% chance to leave a plant unspent." },
      { level: 45, name: "Bitter Knowledge", effect: "Eating raw herbs has reduced drawbacks." },
      { level: 75, name: "Impossible Bloom", effect: "Find rare reagents during hostile weather." },
    ],
  },
  {
    id: "fishing",
    name: "Fishing",
    icon: "🎣",
    category: "gathering",
    color: "#4d8d9b",
    description: "Draw food and stranger catches from rivers, flooded crypts, and lightless depths.",
    maxLevel: 99,
    baseXp: 9,
    milestones: [
      { level: 5, name: "Patient Line", effect: "The catch window is slightly wider." },
      { level: 20, name: "Bait Saver", effect: "25% chance not to consume bait." },
      { level: 45, name: "Blackwater Angler", effect: "Fish safely in corrupted water." },
      { level: 75, name: "Leviathan's Glint", effect: "Very rare catches can carry relics." },
    ],
  },
  {
    id: "hunting",
    name: "Hunting",
    icon: "🐾",
    category: "gathering",
    color: "#a27858",
    description: "Track wary prey, set traps, and dress carcasses for meat, hide, and bone.",
    maxLevel: 99,
    baseXp: 11,
    milestones: [
      { level: 5, name: "Bent Grass", effect: "Tracks persist 20% longer." },
      { level: 20, name: "Humane Snare", effect: "Traps are less likely to ruin hides." },
      { level: 45, name: "Predator's Route", effect: "Move faster while following a marked trail." },
      { level: 75, name: "Trophy Cut", effect: "Elite beasts yield a guaranteed rare component." },
    ],
  },
  {
    id: "smithing",
    name: "Smithing",
    icon: "🔥",
    category: "artisan",
    color: "#d27a42",
    description: "Smelt tainted ore and forge weapons, armor, and tools with deliberate strengths.",
    maxLevel: 99,
    baseXp: 13,
    milestones: [
      { level: 5, name: "Even Heat", effect: "Low-tier smelting occasionally saves fuel." },
      { level: 20, name: "Tempered Edge", effect: "Forged weapons begin with bonus durability." },
      { level: 45, name: "Socket Punch", effect: "Unlock a second upgrade socket on select gear." },
      { level: 75, name: "Masterwork", effect: "Small chance to forge an exceptional item." },
    ],
  },
  {
    id: "woodcraft",
    name: "Woodcraft",
    icon: "🪚",
    category: "artisan",
    color: "#9b754b",
    description: "Shape bows, hafts, shields, camp tools, and sturdy fittings from strange timber.",
    maxLevel: 99,
    baseXp: 11,
    milestones: [
      { level: 5, name: "True Grain", effect: "Plank recipes occasionally yield a spare." },
      { level: 20, name: "Laminated Limb", effect: "Crafted bows lose less durability." },
      { level: 45, name: "Hidden Joinery", effect: "Crafted shields weigh slightly less." },
      { level: 75, name: "Living Shape", effect: "Ancient timber grants a random minor property." },
    ],
  },
  {
    id: "leatherworking",
    name: "Leatherworking",
    icon: "🧵",
    category: "artisan",
    color: "#a96e52",
    description: "Cure hides and stitch flexible armor, packs, wraps, and warded linings.",
    maxLevel: 99,
    baseXp: 11,
    milestones: [
      { level: 5, name: "Waxed Thread", effect: "Leather gear degrades 8% slower." },
      { level: 20, name: "Deep Pockets", effect: "Unlock an extra quick-item pouch." },
      { level: 45, name: "Quiet Stitch", effect: "Crafted light armor reduces footstep noise." },
      { level: 75, name: "Second Skin", effect: "Masterwork leather has reduced equip burden." },
    ],
  },
  {
    id: "alchemy",
    name: "Alchemy",
    icon: "⚗",
    category: "artisan",
    color: "#6ca778",
    description: "Refine plants, organs, and minerals into tonics, oils, bombs, and antidotes.",
    maxLevel: 99,
    baseXp: 12,
    milestones: [
      { level: 5, name: "Clean Decant", effect: "Basic draughts last 5% longer." },
      { level: 20, name: "Double Distill", effect: "Chance to produce an extra tonic." },
      { level: 45, name: "Volatile Theory", effect: "Unlock powerful thrown compounds." },
      { level: 75, name: "Philosopher's Dregs", effect: "Rare brews retain a reusable catalyst." },
    ],
  },
  {
    id: "cooking",
    name: "Cooking",
    icon: "🍲",
    category: "artisan",
    color: "#d89a55",
    description: "Turn hard-won meat, fish, and herbs into restorative meals and camp provisions.",
    maxLevel: 99,
    baseXp: 9,
    milestones: [
      { level: 5, name: "Low Flame", effect: "Reduced chance to spoil simple food." },
      { level: 20, name: "Trail Ration", effect: "Cooked food restores a little stamina." },
      { level: 45, name: "Shared Table", effect: "Meals grant a stronger rested bonus in co-op." },
      { level: 75, name: "Funeral Feast", effect: "Complex meals persist through one defeat." },
    ],
  },
  {
    id: "runecrafting",
    name: "Runecrafting",
    icon: "ᚱ",
    category: "mystic",
    color: "#7770bd",
    description: "Inscribe single-use sigils that bend space, flame, protection, and memory.",
    maxLevel: 99,
    baseXp: 14,
    milestones: [
      { level: 5, name: "Legible Hand", effect: "Minor sigils have a small chance not to break." },
      { level: 20, name: "Paired Stroke", effect: "Craft two basic sigils per batch." },
      { level: 45, name: "Crossed Names", effect: "Unlock compound sigils." },
      { level: 75, name: "Permanent Mark", effect: "Inscribe a reusable high-tier relic." },
    ],
  },
  {
    id: "wayfaring",
    name: "Wayfaring",
    icon: "🧭",
    category: "exploration",
    color: "#d2b865",
    description: "Grow through discovery: map ruins, open forgotten routes, survive hazards, and reach hidden shrines.",
    maxLevel: 99,
    baseXp: 12,
    milestones: [
      { level: 5, name: "Road Memory", effect: "Recently visited paths remain visible through fog." },
      { level: 20, name: "Safe Descent", effect: "Take less damage from short falls." },
      { level: 45, name: "Pilgrim's Cache", effect: "Reveal one hidden cache in each mapped region." },
      { level: 75, name: "No Road Ends", effect: "Unlock sealed shortcuts between distant shrines." },
    ],
  },
]);

export const ITEMS = Object.freeze([
  { id: "sable_marks", name: "Sable Marks", icon: "◉", type: "currency", tier: 1, value: 1, stackable: true, description: "Stamped fragments accepted by the living and the nearly dead." },

  { id: "ember_iron", name: "Ember-Iron", icon: "◆", type: "ore", tier: 2, value: 24, stackable: true, description: "A warm cinderward ore that glows along a freshly broken edge." },
  { id: "unquenched_blade", name: "Unquenched Blade", icon: "†", type: "quest_weapon", tier: 2, value: 0, stackable: false, description: "Orik's unfinished debt, forged to be laid at the Warm Cairn." },
  { id: "witch_reed", name: "Witch Reed", icon: "❧", type: "herb", tier: 2, value: 20, stackable: true, description: "A whispering mire reed that holds the outline of a remembered voice." },
  { id: "pale_salt", name: "Pale Salt", icon: "⋰", type: "reagent", tier: 2, value: 32, stackable: true, description: "Tear-bright crystals left in the wake of a broken hex." },
  { id: "draught_of_returning", name: "Draught of Returning", icon: "⚗", type: "quest_tonic", tier: 2, value: 0, stackable: false, description: "A single-use remembrance prepared for one drowned parishioner." },

  { id: "rust_ore", name: "Rust Ore", icon: "◆", type: "ore", tier: 1, value: 5, stackable: true, description: "Soft ironstone webbed with red corrosion." },
  { id: "black_iron_ore", name: "Black-Iron Ore", icon: "◆", type: "ore", tier: 2, value: 18, stackable: true, description: "Dense ore that drinks the forge's light." },
  { id: "grave_silver_ore", name: "Gravesilver Ore", icon: "◇", type: "ore", tier: 3, value: 52, stackable: true, description: "Cold silver found beneath old burial roads." },
  { id: "starsteel_ore", name: "Starsteel Ore", icon: "✦", type: "ore", tier: 4, value: 140, stackable: true, description: "A blue-black metal scattered by a forgotten impact." },
  { id: "rust_ingot", name: "Rust-Iron Ingot", icon: "▰", type: "metal", tier: 1, value: 14, stackable: true, description: "Serviceable metal once its worst impurities are burned out." },
  { id: "black_iron_ingot", name: "Black-Iron Ingot", icon: "▰", type: "metal", tier: 2, value: 45, stackable: true, description: "Heavy, heat-holding metal for brutal arms." },
  { id: "grave_silver_ingot", name: "Gravesilver Ingot", icon: "▱", type: "metal", tier: 3, value: 128, stackable: true, description: "Consecrated alloy effective against spectral flesh." },
  { id: "starsteel_ingot", name: "Starsteel Ingot", icon: "▰", type: "metal", tier: 4, value: 330, stackable: true, description: "A flawless ingot that hums when held beneath the night sky." },

  { id: "deadwood_log", name: "Deadwood Log", icon: "▤", type: "log", tier: 1, value: 4, stackable: true, description: "Dry gray timber that catches flame easily." },
  { id: "witchwood_log", name: "Witchwood Log", icon: "▤", type: "log", tier: 2, value: 16, stackable: true, description: "Knotted timber whose grain twists toward spoken secrets." },
  { id: "ironbark_log", name: "Ironbark Log", icon: "▥", type: "log", tier: 3, value: 46, stackable: true, description: "Exceptionally rigid darkwood with metallic bark." },
  { id: "ember_yew_log", name: "Ember-Yew Log", icon: "▤", type: "log", tier: 4, value: 125, stackable: true, description: "Warm crimson wood cut from trees rooted in ash." },
  { id: "deadwood_plank", name: "Deadwood Plank", icon: "▬", type: "lumber", tier: 1, value: 11, stackable: true, description: "A rough plank suited to arrows and field repairs." },
  { id: "witchwood_plank", name: "Witchwood Plank", icon: "▬", type: "lumber", tier: 2, value: 38, stackable: true, description: "Flexible stock prized for bow limbs." },
  { id: "ironbark_plank", name: "Ironbark Plank", icon: "▬", type: "lumber", tier: 3, value: 108, stackable: true, description: "Shieldwood that can turn a glancing blade." },
  { id: "ember_yew_plank", name: "Ember-Yew Plank", icon: "▬", type: "lumber", tier: 4, value: 285, stackable: true, description: "Living-red timber that channels heat and intent." },

  { id: "ashleaf", name: "Ashleaf", icon: "❧", type: "herb", tier: 1, value: 4, stackable: true, description: "A bitter roadside herb used in basic restoratives." },
  { id: "bloodroot", name: "Bloodroot", icon: "❧", type: "herb", tier: 2, value: 15, stackable: true, description: "A warm root that clots blood when crushed." },
  { id: "nightcap", name: "Nightcap", icon: "♠", type: "fungus", tier: 3, value: 43, stackable: true, description: "A luminous cave fungus that sharpens sight and distorts sleep." },
  { id: "sunmoss", name: "Sunmoss", icon: "☘", type: "herb", tier: 4, value: 118, stackable: true, description: "Golden moss that stores a little daylight." },
  { id: "witch_resin", name: "Witch Resin", icon: "●", type: "reagent", tier: 2, value: 22, stackable: true, description: "Fragrant resin used to bind volatile mixtures." },
  { id: "void_salt", name: "Void Salt", icon: "⋰", type: "reagent", tier: 3, value: 64, stackable: true, description: "Violet crystals condensed where reality has thinned." },

  { id: "gloam_minnow", name: "Gloam Minnow", icon: "◁", type: "raw_food", tier: 1, value: 5, stackable: true, description: "A common dusk-feeding fish with translucent fins." },
  { id: "marrow_eel", name: "Marrow Eel", icon: "〰", type: "raw_food", tier: 2, value: 18, stackable: true, description: "A pale eel rich enough for a sustaining stew." },
  { id: "mirror_carp", name: "Mirror Carp", icon: "◁", type: "raw_food", tier: 3, value: 50, stackable: true, description: "Its silver scales reflect places that are not nearby." },
  { id: "abyssal_sturgeon", name: "Abyssal Sturgeon", icon: "◀", type: "raw_food", tier: 4, value: 135, stackable: true, description: "A massive blind fish hauled from lightless water." },
  { id: "hare_hide", name: "Hare Hide", icon: "▱", type: "hide", tier: 1, value: 5, stackable: true, description: "Thin hide suitable for wraps and simple linings." },
  { id: "duskstag_hide", name: "Duskstag Hide", icon: "▱", type: "hide", tier: 2, value: 19, stackable: true, description: "Supple gray hide that seems darker at the edges." },
  { id: "graveboar_hide", name: "Graveboar Hide", icon: "▰", type: "hide", tier: 3, value: 54, stackable: true, description: "Thick, scarred skin with excellent puncture resistance." },
  { id: "mooncat_pelt", name: "Mooncat Pelt", icon: "▱", type: "hide", tier: 4, value: 148, stackable: true, description: "Silken pelt that disappears against moonlit stone." },
  { id: "raw_game_meat", name: "Raw Game Meat", icon: "♨", type: "raw_food", tier: 1, value: 6, stackable: true, description: "Freshly dressed meat; nourishing once properly cooked." },
  { id: "bone_shard", name: "Bone Shard", icon: "⌁", type: "reagent", tier: 1, value: 3, stackable: true, description: "Clean bone used for needles, powder, and rough sigils." },
  { id: "cured_hide", name: "Cured Hide", icon: "▱", type: "leather", tier: 1, value: 14, stackable: true, description: "Oiled hide ready for stitching." },
  { id: "dusk_leather", name: "Dusk Leather", icon: "▱", type: "leather", tier: 2, value: 48, stackable: true, description: "Quiet, flexible leather that takes dark dyes well." },
  { id: "grave_leather", name: "Graveboar Leather", icon: "▰", type: "leather", tier: 3, value: 135, stackable: true, description: "Heavy protective leather with a pebbled surface." },
  { id: "moon_leather", name: "Moon Leather", icon: "▱", type: "leather", tier: 4, value: 360, stackable: true, description: "Nearly weightless leather favored by unseen hunters." },

  { id: "rune_dust", name: "Rune Dust", icon: "∴", type: "reagent", tier: 1, value: 8, stackable: true, description: "Powder scraped from weathered wardstones." },
  { id: "memory_ash", name: "Memory Ash", icon: "⁙", type: "reagent", tier: 2, value: 27, stackable: true, description: "Ash that carries impressions of a vanished hand." },
  { id: "ember_core", name: "Ember Core", icon: "✹", type: "reagent", tier: 4, value: 175, stackable: true, description: "A coal-hot knot harvested from an ancient burn site." },

  { id: "rust_sword", name: "Rust-Iron Arming Sword", icon: "†", type: "weapon", tier: 1, value: 72, stackable: false, equipSlot: "mainHand", skillId: "swordsmanship", stats: { physicalPower: 18, poiseDamage: 7, weight: 4 }, description: "A forgiving straight sword with a plain cord grip." },
  { id: "black_iron_maul", name: "Black-Iron Maul", icon: "⚒", type: "weapon", tier: 2, value: 260, stackable: false, equipSlot: "mainHand", skillId: "heavy_arms", stats: { physicalPower: 47, poiseDamage: 32, weight: 14 }, description: "A merciless block of black iron fitted to an ironbark haft." },
  { id: "gravesilver_blade", name: "Gravesilver Longblade", icon: "†", type: "weapon", tier: 3, value: 720, stackable: false, equipSlot: "mainHand", skillId: "swordsmanship", stats: { physicalPower: 71, spiritPower: 18, poiseDamage: 13, weight: 6 }, description: "A cold blade made to sever flesh from haunting." },
  { id: "starsteel_greatsword", name: "Starsteel Greatsword", icon: "‡", type: "weapon", tier: 4, value: 1840, stackable: false, equipSlot: "mainHand", skillId: "heavy_arms", stats: { physicalPower: 118, poiseDamage: 45, weight: 16 }, description: "A night-dark blade balanced around an impossible center." },
  { id: "witchwood_bow", name: "Witchwood Recurve", icon: "❯", type: "weapon", tier: 2, value: 230, stackable: false, equipSlot: "mainHand", skillId: "marksmanship", stats: { physicalPower: 36, range: 24, weight: 3 }, description: "A compact bow that creaks before danger draws near." },
  { id: "ember_yew_bow", name: "Ember-Yew Warbow", icon: "❯", type: "weapon", tier: 4, value: 1630, stackable: false, equipSlot: "mainHand", skillId: "marksmanship", stats: { physicalPower: 103, firePower: 16, range: 31, weight: 5 }, description: "Its string leaves a faint red line across the dark." },
  { id: "ironbark_shield", name: "Ironbark Kite Shield", icon: "⛨", type: "shield", tier: 3, value: 570, stackable: false, equipSlot: "offHand", skillId: "guard", stats: { guard: 68, stability: 57, weight: 7 }, description: "Layered timber and gravesilver nails offer reliable protection." },
  { id: "patched_hide_coat", name: "Patched Hide Coat", icon: "♙", type: "armor", tier: 1, value: 64, stackable: false, equipSlot: "body", stats: { armor: 10, ward: 4, weight: 3 }, description: "A practical coat assembled from whatever the road provided." },
  { id: "duskstalker_coat", name: "Duskstalker Coat", icon: "♙", type: "armor", tier: 2, value: 245, stackable: false, equipSlot: "body", stats: { armor: 23, ward: 12, stealth: 8, weight: 5 }, description: "Soft armor cut to move quietly through brush and ruin." },
  { id: "black_iron_cuirass", name: "Black-Iron Cuirass", icon: "♜", type: "armor", tier: 2, value: 320, stackable: false, equipSlot: "body", stats: { armor: 38, ward: 7, poise: 18, weight: 15 }, description: "An austere breastplate that turns cuts and punishes rolling." },
  { id: "moonveil_jerkin", name: "Moonveil Jerkin", icon: "♙", type: "armor", tier: 4, value: 1520, stackable: false, equipSlot: "body", stats: { armor: 52, ward: 46, stealth: 20, weight: 5 }, description: "Silver-black hunting leathers that blur at the edge of sight." },

  { id: "field_arrows", name: "Field Arrows", icon: "➶", type: "ammunition", tier: 1, value: 1, stackable: true, description: "Simple, reliable arrows bundled in tens." },
  { id: "field_torch", name: "Field Torch", icon: "♨", type: "tool", tier: 1, value: 12, stackable: true, description: "A resin-soaked torch that reveals false walls and wary eyes." },
  { id: "mending_draught", name: "Mending Draught", icon: "⚱", type: "consumable", tier: 1, value: 26, stackable: true, use: { heal: 42 }, description: "A sharp herbal drink that steadily restores health." },
  { id: "clotting_tonic", name: "Clotting Tonic", icon: "⚱", type: "consumable", tier: 2, value: 78, stackable: true, use: { cure: "bleed", resistance: 20, duration: 90 }, description: "A hot red tonic that halts bleeding and hardens the pulse." },
  { id: "night_eye_phial", name: "Night-Eye Phial", icon: "⚱", type: "consumable", tier: 3, value: 190, stackable: true, use: { darkvision: 1, duration: 180 }, description: "A violet suspension that reveals movement in deep darkness." },
  { id: "sunward_elixir", name: "Sunward Elixir", icon: "⚱", type: "consumable", tier: 4, value: 480, stackable: true, use: { curseResistance: 35, spiritWard: 20, duration: 150 }, description: "Liquid gold that repels curses at the cost of a feverish glow." },
  { id: "charred_minnow", name: "Charred Gloam Minnow", icon: "◁", type: "food", tier: 1, value: 13, stackable: true, use: { heal: 26 }, description: "Small, smoky, and far better than going hungry." },
  { id: "marrow_eel_stew", name: "Marrow-Eel Stew", icon: "♨", type: "food", tier: 2, value: 58, stackable: true, use: { heal: 62, staminaRecovery: 8, duration: 60 }, description: "A rich broth that warms cramped limbs." },
  { id: "mirror_carp_roast", name: "Mirror-Carp Roast", icon: "♨", type: "food", tier: 3, value: 152, stackable: true, use: { heal: 105, focusRecovery: 12, duration: 90 }, description: "Bright flakes of flesh restore both vigor and attention." },
  { id: "abyssal_feast", name: "Abyssal Feast", icon: "♨", type: "food", tier: 4, value: 390, stackable: true, use: { heal: 175, maxStamina: 15, duration: 180 }, description: "A blackwater delicacy substantial enough for several hard fights." },
  { id: "hunter_skewer", name: "Hunter's Skewer", icon: "♨", type: "food", tier: 1, value: 19, stackable: true, use: { heal: 34, stamina: 12 }, description: "Game meat and ashleaf roasted on a sharpened branch." },

  { id: "spark_sigil", name: "Spark Sigil", icon: "ᚲ", type: "sigil", tier: 1, value: 34, stackable: true, use: { effect: "fire_coating", duration: 45 }, description: "A brittle mark that wreathes a weapon in low flame." },
  { id: "ward_sigil", name: "Ward Sigil", icon: "ᛉ", type: "sigil", tier: 2, value: 96, stackable: true, use: { effect: "spirit_barrier", amount: 45 }, description: "Break to absorb a measured amount of occult harm." },
  { id: "return_sigil", name: "Return Sigil", icon: "ᛟ", type: "sigil", tier: 3, value: 260, stackable: true, use: { effect: "return_to_last_shrine" }, description: "Crush it to retreat to the last awakened shrine, leaving carried marks behind." },
  { id: "dawn_sigil", name: "Dawn Sigil", icon: "ᛞ", type: "sigil", tier: 4, value: 660, stackable: true, use: { effect: "cleanse_and_radiance", duration: 120 }, description: "A brilliant compound mark that cleanses corruption and wounds nearby shades." },
]);

export const RESOURCES = Object.freeze([
  { id: "crumbling_rust_vein", name: "Crumbling Rust Vein", icon: "◆", skillId: "mining", levelRequired: 1, tier: 1, itemId: "rust_ore", yield: [1, 2], xp: 10, respawnSeconds: 18, zoneTags: ["roadside", "shallow-cave"] },
  { id: "black_iron_seam", name: "Black-Iron Seam", icon: "◆", skillId: "mining", levelRequired: 18, tier: 2, itemId: "black_iron_ore", yield: [1, 2], xp: 24, respawnSeconds: 32, zoneTags: ["mine", "fortress"] },
  { id: "gravesilver_lode", name: "Gravesilver Lode", icon: "◇", skillId: "mining", levelRequired: 38, tier: 3, itemId: "grave_silver_ore", yield: [1, 2], xp: 55, respawnSeconds: 55, zoneTags: ["catacomb", "deep-cave"] },
  { id: "fallen_star_fragment", name: "Fallen Star Fragment", icon: "✦", skillId: "mining", levelRequired: 62, tier: 4, itemId: "starsteel_ore", yield: [1, 1], xp: 125, respawnSeconds: 110, zoneTags: ["crater", "highland"] },

  { id: "deadwood_stand", name: "Deadwood Stand", icon: "♣", skillId: "woodcutting", levelRequired: 1, tier: 1, itemId: "deadwood_log", yield: [1, 3], xp: 9, respawnSeconds: 16, zoneTags: ["roadside", "moor"] },
  { id: "whispering_witchwood", name: "Whispering Witchwood", icon: "♣", skillId: "woodcutting", levelRequired: 16, tier: 2, itemId: "witchwood_log", bonusItemId: "witch_resin", bonusChance: 0.18, yield: [1, 2], xp: 22, respawnSeconds: 30, zoneTags: ["haunted-wood", "ruin"] },
  { id: "ironbark_trunk", name: "Ironbark Trunk", icon: "♣", skillId: "woodcutting", levelRequired: 36, tier: 3, itemId: "ironbark_log", yield: [1, 2], xp: 51, respawnSeconds: 52, zoneTags: ["old-forest", "fortress"] },
  { id: "ember_yew", name: "Ember-Yew", icon: "♣", skillId: "woodcutting", levelRequired: 60, tier: 4, itemId: "ember_yew_log", yield: [1, 1], xp: 118, respawnSeconds: 105, zoneTags: ["ashland", "burned-sanctuary"] },

  { id: "ashleaf_patch", name: "Ashleaf Patch", icon: "❧", skillId: "foraging", levelRequired: 1, tier: 1, itemId: "ashleaf", yield: [1, 3], xp: 8, respawnSeconds: 14, zoneTags: ["roadside", "field"] },
  { id: "bloodroot_cluster", name: "Bloodroot Cluster", icon: "❧", skillId: "foraging", levelRequired: 14, tier: 2, itemId: "bloodroot", yield: [1, 2], xp: 20, respawnSeconds: 26, zoneTags: ["battlefield", "marsh"] },
  { id: "nightcap_ring", name: "Nightcap Ring", icon: "♠", skillId: "foraging", levelRequired: 34, tier: 3, itemId: "nightcap", yield: [1, 2], xp: 47, respawnSeconds: 46, zoneTags: ["cave", "crypt"] },
  { id: "sunmoss_shelf", name: "Sunmoss Shelf", icon: "☘", skillId: "foraging", levelRequired: 58, tier: 4, itemId: "sunmoss", yield: [1, 1], xp: 108, respawnSeconds: 90, zoneTags: ["clifftop", "sanctuary"] },
  { id: "void_salt_bloom", name: "Void-Salt Bloom", icon: "⋰", skillId: "foraging", levelRequired: 43, tier: 3, itemId: "void_salt", yield: [1, 1], xp: 68, respawnSeconds: 72, zoneTags: ["rift", "deep-cave"] },

  { id: "gloam_shoal", name: "Gloam-Minnow Shoal", icon: "≈", skillId: "fishing", levelRequired: 1, tier: 1, itemId: "gloam_minnow", yield: [1, 3], xp: 9, respawnSeconds: 15, zoneTags: ["river", "pond"] },
  { id: "marrow_eel_hole", name: "Marrow-Eel Hole", icon: "≈", skillId: "fishing", levelRequired: 17, tier: 2, itemId: "marrow_eel", yield: [1, 2], xp: 23, respawnSeconds: 29, zoneTags: ["marsh", "flooded-crypt"] },
  { id: "mirror_carp_ripple", name: "Mirror-Carp Ripple", icon: "≈", skillId: "fishing", levelRequired: 37, tier: 3, itemId: "mirror_carp", yield: [1, 2], xp: 53, respawnSeconds: 50, zoneTags: ["moon-lake", "reservoir"] },
  { id: "abyssal_wake", name: "Abyssal Wake", icon: "≈", skillId: "fishing", levelRequired: 61, tier: 4, itemId: "abyssal_sturgeon", yield: [1, 1], xp: 122, respawnSeconds: 100, zoneTags: ["underground-lake", "blackwater"] },

  { id: "hare_run", name: "Hare Run", icon: "⌇", skillId: "hunting", levelRequired: 1, tier: 1, itemId: "hare_hide", bonusItemId: "raw_game_meat", yield: [1, 1], xp: 11, respawnSeconds: 22, zoneTags: ["field", "moor"] },
  { id: "duskstag_trail", name: "Duskstag Trail", icon: "⌇", skillId: "hunting", levelRequired: 19, tier: 2, itemId: "duskstag_hide", bonusItemId: "raw_game_meat", yield: [1, 2], xp: 27, respawnSeconds: 40, zoneTags: ["haunted-wood", "highland"] },
  { id: "graveboar_wallows", name: "Graveboar Wallows", icon: "⌇", skillId: "hunting", levelRequired: 39, tier: 3, itemId: "graveboar_hide", bonusItemId: "bone_shard", yield: [1, 2], xp: 61, respawnSeconds: 65, zoneTags: ["battlefield", "old-forest"] },
  { id: "mooncat_scrape", name: "Mooncat Scrape", icon: "⌇", skillId: "hunting", levelRequired: 64, tier: 4, itemId: "mooncat_pelt", bonusItemId: "memory_ash", yield: [1, 1], xp: 138, respawnSeconds: 125, zoneTags: ["moon-ruin", "clifftop"] },

  { id: "weathered_wardstone", name: "Weathered Wardstone", icon: "ᚱ", skillId: "runecrafting", levelRequired: 1, tier: 1, itemId: "rune_dust", yield: [1, 2], xp: 13, respawnSeconds: 28, zoneTags: ["ruin", "shrine"] },
  { id: "memory_cairn", name: "Memory Cairn", icon: "ᛟ", skillId: "runecrafting", levelRequired: 24, tier: 2, itemId: "memory_ash", yield: [1, 2], xp: 35, respawnSeconds: 48, zoneTags: ["grave-road", "catacomb"] },
  { id: "sleeping_ember", name: "Sleeping Ember", icon: "✹", skillId: "wayfaring", levelRequired: 52, tier: 4, itemId: "ember_core", yield: [1, 1], xp: 105, respawnSeconds: 150, zoneTags: ["hidden", "ashland"] },
]);

export const RECIPES = Object.freeze([
  // Story recipes bridge the regional quest arcs into the general economy.
  { id: "unquenched_blade", name: "Forge the Unquenched Blade", icon: "†", skillId: "smithing", levelRequired: 1, tier: 1, xp: 90, station: "widow_forge", craftSeconds: 8, ingredients: [{ itemId: "ember_iron", quantity: 5 }], outputs: [{ itemId: "unquenched_blade", quantity: 1 }] },
  { id: "draught_of_returning", name: "Brew the Draught of Returning", icon: "⚗", skillId: "alchemy", levelRequired: 1, tier: 1, xp: 110, station: "field_alembic", craftSeconds: 6, ingredients: [{ itemId: "witch_reed", quantity: 3 }, { itemId: "pale_salt", quantity: 1 }], outputs: [{ itemId: "draught_of_returning", quantity: 1 }] },
  { id: "smelt_rust_iron", name: "Smelt Rust-Iron", icon: "▰", skillId: "smithing", levelRequired: 1, tier: 1, xp: 14, station: "forge", craftSeconds: 3, ingredients: [{ itemId: "rust_ore", quantity: 2 }], outputs: [{ itemId: "rust_ingot", quantity: 1 }] },
  { id: "forge_rust_sword", name: "Forge Rust-Iron Sword", icon: "†", skillId: "smithing", levelRequired: 6, tier: 1, xp: 38, station: "anvil", craftSeconds: 8, ingredients: [{ itemId: "rust_ingot", quantity: 3 }, { itemId: "deadwood_plank", quantity: 1 }], outputs: [{ itemId: "rust_sword", quantity: 1 }] },
  { id: "smelt_black_iron", name: "Smelt Black-Iron", icon: "▰", skillId: "smithing", levelRequired: 18, tier: 2, xp: 34, station: "forge", craftSeconds: 5, ingredients: [{ itemId: "black_iron_ore", quantity: 2 }, { itemId: "rust_ore", quantity: 1 }], outputs: [{ itemId: "black_iron_ingot", quantity: 1 }] },
  { id: "forge_black_iron_maul", name: "Forge Black-Iron Maul", icon: "⚒", skillId: "smithing", levelRequired: 25, tier: 2, xp: 105, station: "anvil", craftSeconds: 13, ingredients: [{ itemId: "black_iron_ingot", quantity: 4 }, { itemId: "ironbark_plank", quantity: 1 }], outputs: [{ itemId: "black_iron_maul", quantity: 1 }] },
  { id: "forge_black_iron_cuirass", name: "Forge Black-Iron Cuirass", icon: "♜", skillId: "smithing", levelRequired: 29, tier: 2, xp: 130, station: "anvil", craftSeconds: 15, ingredients: [{ itemId: "black_iron_ingot", quantity: 6 }, { itemId: "cured_hide", quantity: 2 }], outputs: [{ itemId: "black_iron_cuirass", quantity: 1 }] },
  { id: "smelt_gravesilver", name: "Smelt Gravesilver", icon: "▱", skillId: "smithing", levelRequired: 40, tier: 3, xp: 78, station: "consecrated_forge", craftSeconds: 8, ingredients: [{ itemId: "grave_silver_ore", quantity: 2 }, { itemId: "bone_shard", quantity: 1 }], outputs: [{ itemId: "grave_silver_ingot", quantity: 1 }] },
  { id: "forge_gravesilver_blade", name: "Forge Gravesilver Longblade", icon: "†", skillId: "smithing", levelRequired: 47, tier: 3, xp: 235, station: "consecrated_forge", craftSeconds: 18, ingredients: [{ itemId: "grave_silver_ingot", quantity: 4 }, { itemId: "witchwood_plank", quantity: 1 }, { itemId: "memory_ash", quantity: 1 }], outputs: [{ itemId: "gravesilver_blade", quantity: 1 }] },
  { id: "smelt_starsteel", name: "Smelt Starsteel", icon: "▰", skillId: "smithing", levelRequired: 64, tier: 4, xp: 180, station: "astral_forge", craftSeconds: 12, ingredients: [{ itemId: "starsteel_ore", quantity: 2 }, { itemId: "ember_core", quantity: 1 }], outputs: [{ itemId: "starsteel_ingot", quantity: 1 }] },
  { id: "forge_starsteel_greatsword", name: "Forge Starsteel Greatsword", icon: "‡", skillId: "smithing", levelRequired: 72, tier: 4, xp: 540, station: "astral_forge", craftSeconds: 25, ingredients: [{ itemId: "starsteel_ingot", quantity: 5 }, { itemId: "ember_yew_plank", quantity: 1 }, { itemId: "void_salt", quantity: 2 }], outputs: [{ itemId: "starsteel_greatsword", quantity: 1 }] },

  { id: "saw_deadwood", name: "Saw Deadwood Plank", icon: "▬", skillId: "woodcraft", levelRequired: 1, tier: 1, xp: 10, station: "workbench", craftSeconds: 2, ingredients: [{ itemId: "deadwood_log", quantity: 1 }], outputs: [{ itemId: "deadwood_plank", quantity: 1 }] },
  { id: "bundle_field_arrows", name: "Bundle Field Arrows", icon: "➶", skillId: "woodcraft", levelRequired: 3, tier: 1, xp: 13, station: "workbench", craftSeconds: 3, ingredients: [{ itemId: "deadwood_plank", quantity: 1 }, { itemId: "bone_shard", quantity: 1 }], outputs: [{ itemId: "field_arrows", quantity: 10 }] },
  { id: "make_field_torch", name: "Make Field Torch", icon: "♨", skillId: "woodcraft", levelRequired: 5, tier: 1, xp: 14, station: "camp", craftSeconds: 2, ingredients: [{ itemId: "deadwood_log", quantity: 1 }, { itemId: "witch_resin", quantity: 1 }], outputs: [{ itemId: "field_torch", quantity: 2 }] },
  { id: "saw_witchwood", name: "Saw Witchwood Plank", icon: "▬", skillId: "woodcraft", levelRequired: 16, tier: 2, xp: 26, station: "workbench", craftSeconds: 4, ingredients: [{ itemId: "witchwood_log", quantity: 1 }], outputs: [{ itemId: "witchwood_plank", quantity: 1 }] },
  { id: "carve_witchwood_bow", name: "Carve Witchwood Recurve", icon: "❯", skillId: "woodcraft", levelRequired: 23, tier: 2, xp: 92, station: "bowyer_bench", craftSeconds: 11, ingredients: [{ itemId: "witchwood_plank", quantity: 4 }, { itemId: "dusk_leather", quantity: 1 }], outputs: [{ itemId: "witchwood_bow", quantity: 1 }] },
  { id: "saw_ironbark", name: "Saw Ironbark Plank", icon: "▬", skillId: "woodcraft", levelRequired: 36, tier: 3, xp: 59, station: "workbench", craftSeconds: 7, ingredients: [{ itemId: "ironbark_log", quantity: 1 }], outputs: [{ itemId: "ironbark_plank", quantity: 1 }] },
  { id: "build_ironbark_shield", name: "Build Ironbark Shield", icon: "⛨", skillId: "woodcraft", levelRequired: 44, tier: 3, xp: 205, station: "workbench", craftSeconds: 16, ingredients: [{ itemId: "ironbark_plank", quantity: 4 }, { itemId: "grave_silver_ingot", quantity: 2 }, { itemId: "grave_leather", quantity: 1 }], outputs: [{ itemId: "ironbark_shield", quantity: 1 }] },
  { id: "saw_ember_yew", name: "Saw Ember-Yew Plank", icon: "▬", skillId: "woodcraft", levelRequired: 60, tier: 4, xp: 136, station: "bowyer_bench", craftSeconds: 10, ingredients: [{ itemId: "ember_yew_log", quantity: 1 }], outputs: [{ itemId: "ember_yew_plank", quantity: 1 }] },
  { id: "carve_ember_warbow", name: "Carve Ember-Yew Warbow", icon: "❯", skillId: "woodcraft", levelRequired: 70, tier: 4, xp: 485, station: "bowyer_bench", craftSeconds: 22, ingredients: [{ itemId: "ember_yew_plank", quantity: 5 }, { itemId: "moon_leather", quantity: 1 }, { itemId: "ember_core", quantity: 1 }], outputs: [{ itemId: "ember_yew_bow", quantity: 1 }] },

  { id: "cure_hare_hide", name: "Cure Hare Hide", icon: "▱", skillId: "leatherworking", levelRequired: 1, tier: 1, xp: 11, station: "tanning_rack", craftSeconds: 3, ingredients: [{ itemId: "hare_hide", quantity: 2 }], outputs: [{ itemId: "cured_hide", quantity: 1 }] },
  { id: "stitch_patched_coat", name: "Stitch Patched Hide Coat", icon: "♙", skillId: "leatherworking", levelRequired: 7, tier: 1, xp: 42, station: "tailor_table", craftSeconds: 8, ingredients: [{ itemId: "cured_hide", quantity: 4 }, { itemId: "bone_shard", quantity: 1 }], outputs: [{ itemId: "patched_hide_coat", quantity: 1 }] },
  { id: "tan_dusk_leather", name: "Tan Dusk Leather", icon: "▱", skillId: "leatherworking", levelRequired: 19, tier: 2, xp: 31, station: "tanning_rack", craftSeconds: 5, ingredients: [{ itemId: "duskstag_hide", quantity: 2 }, { itemId: "witch_resin", quantity: 1 }], outputs: [{ itemId: "dusk_leather", quantity: 1 }] },
  { id: "stitch_duskstalker_coat", name: "Stitch Duskstalker Coat", icon: "♙", skillId: "leatherworking", levelRequired: 27, tier: 2, xp: 112, station: "tailor_table", craftSeconds: 13, ingredients: [{ itemId: "dusk_leather", quantity: 5 }, { itemId: "nightcap", quantity: 1 }], outputs: [{ itemId: "duskstalker_coat", quantity: 1 }] },
  { id: "tan_grave_leather", name: "Tan Graveboar Leather", icon: "▰", skillId: "leatherworking", levelRequired: 39, tier: 3, xp: 72, station: "tanning_rack", craftSeconds: 8, ingredients: [{ itemId: "graveboar_hide", quantity: 2 }, { itemId: "void_salt", quantity: 1 }], outputs: [{ itemId: "grave_leather", quantity: 1 }] },
  { id: "tan_moon_leather", name: "Tan Moon Leather", icon: "▱", skillId: "leatherworking", levelRequired: 64, tier: 4, xp: 168, station: "moon_rack", craftSeconds: 12, ingredients: [{ itemId: "mooncat_pelt", quantity: 2 }, { itemId: "memory_ash", quantity: 2 }], outputs: [{ itemId: "moon_leather", quantity: 1 }] },
  { id: "stitch_moonveil_jerkin", name: "Stitch Moonveil Jerkin", icon: "♙", skillId: "leatherworking", levelRequired: 72, tier: 4, xp: 510, station: "moon_rack", craftSeconds: 24, ingredients: [{ itemId: "moon_leather", quantity: 5 }, { itemId: "starsteel_ingot", quantity: 1 }, { itemId: "void_salt", quantity: 2 }], outputs: [{ itemId: "moonveil_jerkin", quantity: 1 }] },

  { id: "brew_mending_draught", name: "Brew Mending Draught", icon: "⚱", skillId: "alchemy", levelRequired: 1, tier: 1, xp: 12, station: "alembic", craftSeconds: 3, ingredients: [{ itemId: "ashleaf", quantity: 2 }], outputs: [{ itemId: "mending_draught", quantity: 1 }] },
  { id: "brew_clotting_tonic", name: "Brew Clotting Tonic", icon: "⚱", skillId: "alchemy", levelRequired: 18, tier: 2, xp: 39, station: "alembic", craftSeconds: 6, ingredients: [{ itemId: "bloodroot", quantity: 2 }, { itemId: "witch_resin", quantity: 1 }], outputs: [{ itemId: "clotting_tonic", quantity: 1 }] },
  { id: "brew_night_eye", name: "Brew Night-Eye Phial", icon: "⚱", skillId: "alchemy", levelRequired: 38, tier: 3, xp: 88, station: "alembic", craftSeconds: 9, ingredients: [{ itemId: "nightcap", quantity: 2 }, { itemId: "void_salt", quantity: 1 }], outputs: [{ itemId: "night_eye_phial", quantity: 1 }] },
  { id: "brew_sunward_elixir", name: "Brew Sunward Elixir", icon: "⚱", skillId: "alchemy", levelRequired: 62, tier: 4, xp: 205, station: "grand_alembic", craftSeconds: 14, ingredients: [{ itemId: "sunmoss", quantity: 2 }, { itemId: "ember_core", quantity: 1 }, { itemId: "memory_ash", quantity: 1 }], outputs: [{ itemId: "sunward_elixir", quantity: 1 }] },

  { id: "cook_charred_minnow", name: "Char Gloam Minnow", icon: "◁", skillId: "cooking", levelRequired: 1, tier: 1, xp: 9, station: "campfire", craftSeconds: 2, ingredients: [{ itemId: "gloam_minnow", quantity: 1 }], outputs: [{ itemId: "charred_minnow", quantity: 1 }] },
  { id: "cook_hunter_skewer", name: "Roast Hunter's Skewer", icon: "♨", skillId: "cooking", levelRequired: 6, tier: 1, xp: 15, station: "campfire", craftSeconds: 3, ingredients: [{ itemId: "raw_game_meat", quantity: 1 }, { itemId: "ashleaf", quantity: 1 }], outputs: [{ itemId: "hunter_skewer", quantity: 1 }] },
  { id: "cook_marrow_stew", name: "Simmer Marrow-Eel Stew", icon: "♨", skillId: "cooking", levelRequired: 17, tier: 2, xp: 31, station: "cookpot", craftSeconds: 6, ingredients: [{ itemId: "marrow_eel", quantity: 1 }, { itemId: "bloodroot", quantity: 1 }], outputs: [{ itemId: "marrow_eel_stew", quantity: 1 }] },
  { id: "cook_mirror_roast", name: "Roast Mirror Carp", icon: "♨", skillId: "cooking", levelRequired: 37, tier: 3, xp: 70, station: "cookpot", craftSeconds: 9, ingredients: [{ itemId: "mirror_carp", quantity: 1 }, { itemId: "nightcap", quantity: 1 }], outputs: [{ itemId: "mirror_carp_roast", quantity: 1 }] },
  { id: "cook_abyssal_feast", name: "Prepare Abyssal Feast", icon: "♨", skillId: "cooking", levelRequired: 61, tier: 4, xp: 162, station: "great_hearth", craftSeconds: 14, ingredients: [{ itemId: "abyssal_sturgeon", quantity: 1 }, { itemId: "sunmoss", quantity: 1 }, { itemId: "ember_core", quantity: 1 }], outputs: [{ itemId: "abyssal_feast", quantity: 1 }] },

  { id: "inscribe_spark_sigil", name: "Inscribe Spark Sigil", icon: "ᚲ", skillId: "runecrafting", levelRequired: 1, tier: 1, xp: 16, station: "scribe_stone", craftSeconds: 4, ingredients: [{ itemId: "rune_dust", quantity: 2 }, { itemId: "ashleaf", quantity: 1 }], outputs: [{ itemId: "spark_sigil", quantity: 1 }] },
  { id: "inscribe_ward_sigil", name: "Inscribe Ward Sigil", icon: "ᛉ", skillId: "runecrafting", levelRequired: 22, tier: 2, xp: 52, station: "scribe_stone", craftSeconds: 7, ingredients: [{ itemId: "rune_dust", quantity: 2 }, { itemId: "memory_ash", quantity: 1 }, { itemId: "witch_resin", quantity: 1 }], outputs: [{ itemId: "ward_sigil", quantity: 1 }] },
  { id: "inscribe_return_sigil", name: "Inscribe Return Sigil", icon: "ᛟ", skillId: "runecrafting", levelRequired: 44, tier: 3, xp: 125, station: "memory_altar", craftSeconds: 11, ingredients: [{ itemId: "memory_ash", quantity: 3 }, { itemId: "void_salt", quantity: 1 }, { itemId: "grave_silver_ingot", quantity: 1 }], outputs: [{ itemId: "return_sigil", quantity: 1 }] },
  { id: "inscribe_dawn_sigil", name: "Inscribe Dawn Sigil", icon: "ᛞ", skillId: "runecrafting", levelRequired: 68, tier: 4, xp: 290, station: "sun_altar", craftSeconds: 17, ingredients: [{ itemId: "sunmoss", quantity: 2 }, { itemId: "starsteel_ingot", quantity: 1 }, { itemId: "ember_core", quantity: 1 }], outputs: [{ itemId: "dawn_sigil", quantity: 1 }] },
]);

const MAX_LEVEL = 99;
const TIER_MULTIPLIERS = Object.freeze([0, 1, 2.15, 4.9, 10.8, 22]);
const NAMED_TIERS = Object.freeze({
  common: 1,
  worn: 1,
  tempered: 2,
  rare: 3,
  relic: 4,
  mythic: 5,
});

/** Return the cumulative XP required to begin a level (level 1 starts at 0 XP). */
export function xpForLevel(level) {
  const targetLevel = Math.max(1, Math.min(MAX_LEVEL, Math.floor(Number(level) || 1)));
  let points = 0;

  for (let current = 1; current < targetLevel; current += 1) {
    points += Math.floor(current + 300 * 2 ** (current / 7));
  }

  return Math.floor(points / 4);
}

/** Convert cumulative XP into a clamped 1-99 level. */
export function levelFromXp(xp) {
  const totalXp = Math.max(0, Math.floor(Number(xp) || 0));
  let low = 1;
  let high = MAX_LEVEL;

  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (xpForLevel(middle) <= totalXp) low = middle;
    else high = middle - 1;
  }

  return low;
}

/**
 * Calculate a standard action reward for a skill and material/enemy tier.
 * Numeric tiers are clamped to 1-5; named tiers are accepted for UI callers.
 */
export function xpRewardForAction(skillId, tier = 1) {
  const skill = SKILLS.find((entry) => entry.id === skillId);
  if (!skill) return 0;

  const namedTier = typeof tier === "string" ? NAMED_TIERS[tier.toLowerCase()] : undefined;
  const numericTier = namedTier ?? Number(tier);
  const safeTier = Math.max(1, Math.min(5, Math.floor(Number.isFinite(numericTier) ? numericTier : 1)));

  return Math.round(skill.baseXp * TIER_MULTIPLIERS[safeTier]);
}
