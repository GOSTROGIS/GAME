/**
 * Quest definitions for the Sable Reach vertical slice.
 * Objective targets are stable data IDs consumed by gameplay systems.
 */

export const QUESTS = [
  {
    id: "main_embers_at_dusk",
    chain: "the_last_bell",
    order: 1,
    type: "main",
    title: "Embers at Dusk",
    giverNpcId: "maela_voss",
    prerequisites: [],
    recommendedLevel: 1,
    summary: "Relight Hearthmere's neglected Vigil Shrine before the dusk bell is due.",
    objectives: [
      { type: "talk", target: "maela_voss", required: 1 },
      { type: "gather", target: "grave_moss", required: 3 },
      { type: "interact", target: "old_vigil_shrine", required: 1 },
    ],
    rewards: {
      skillXp: { foraging: 120, attunement: 100 },
      currency: { sableMarks: 80 },
      items: [
        { id: "vigil_flask", quantity: 1 },
        { id: "clay_name_token", quantity: 1 },
      ],
      unlocks: ["main_bells_below", "attunement_shrines"],
    },
    dialogueStages: [
      {
        stage: "offer",
        lines: [
          { speaker: "maela_voss", text: "The old shrine has gone cold, and dusk is counting its steps toward us." },
          { speaker: "maela_voss", text: "Bring me grave moss from the mire. It remembers flame better than dry wood does." },
        ],
      },
      {
        stage: "in_progress",
        lines: [
          { speaker: "maela_voss", text: "Three handfuls. No more. Too much remembrance draws the wrong dead." },
        ],
      },
      {
        stage: "complete",
        lines: [
          { speaker: "maela_voss", text: "There. A small light, but ours. Listen—the shrine is answering something beneath the marsh." },
        ],
      },
    ],
  },
  {
    id: "main_bells_below",
    chain: "the_last_bell",
    order: 2,
    type: "main",
    title: "Bells Below the Water",
    giverNpcId: "maela_voss",
    prerequisites: ["main_embers_at_dusk"],
    recommendedLevel: 6,
    summary: "Trace the answering toll across Dunmire and learn what woke beneath the drowned parish.",
    objectives: [
      { type: "defeat", target: "mirebound", required: 4 },
      { type: "discover", target: "sunken_vestry", required: 1 },
      { type: "interact", target: "drowned_bell_rope", required: 1 },
      { type: "talk", target: "ysra_pell", required: 1 },
    ],
    rewards: {
      skillXp: { combat: 300, warding: 180, exploration: 150 },
      currency: { sableMarks: 220 },
      items: [{ id: "reedward_charm", quantity: 1 }],
      unlocks: ["main_the_cinder_seal", "dunmire_shortcut"],
    },
    dialogueStages: [
      {
        stage: "offer",
        lines: [
          { speaker: "maela_voss", text: "That answering toll came from Dunmire. Our maps insist there is no bell there." },
          { speaker: "maela_voss", text: "Go prove the maps right, if you can." },
        ],
      },
      {
        stage: "discovery",
        lines: [
          { speaker: "narrator", text: "A rope descends through the chapel floor into water too dark to reflect you." },
        ],
      },
      {
        stage: "complete",
        lines: [
          { speaker: "ysra_pell", text: "You did not ring it. Good. The sound is traveling from Hollow Abbey through the roots of every older bell." },
          { speaker: "ysra_pell", text: "Only a Cinder Seal opens the abbey gate now. Ask the smith who chained himself to the forge." },
        ],
      },
    ],
  },
  {
    id: "main_the_cinder_seal",
    chain: "the_last_bell",
    order: 3,
    type: "main",
    title: "The Cinder Seal",
    giverNpcId: "orik_senn",
    prerequisites: ["main_bells_below"],
    recommendedLevel: 13,
    summary: "Claim the royal seal from the thing still guarding Cinderward's dead furnace.",
    objectives: [
      { type: "talk", target: "orik_senn", required: 1 },
      { type: "defeat", target: "kiln_thrall", required: 3 },
      { type: "defeat", target: "kiln_knight_rusk", required: 1 },
      { type: "acquire", target: "cinder_seal", required: 1 },
    ],
    rewards: {
      skillXp: { combat: 700, smithing: 260, endurance: 220 },
      currency: { sableMarks: 500 },
      items: [
        { id: "cinder_seal", quantity: 1 },
        { id: "tempered_flask_shard", quantity: 1 },
      ],
      unlocks: ["main_a_litany_unspoken", "hollow_abbey_gate"],
    },
    dialogueStages: [
      {
        stage: "offer",
        lines: [
          { speaker: "orik_senn", text: "Rusk wears the seal on the inside of his furnace-shield. The king trusted fear more than locks." },
          { speaker: "orik_senn", text: "Cool his vents, break his stance, and do not breathe when the armor opens." },
        ],
      },
      {
        stage: "in_progress",
        lines: [
          { speaker: "orik_senn", text: "The foundry breathes because Rusk does. One of them must stop." },
        ],
      },
      {
        stage: "complete",
        lines: [
          { speaker: "orik_senn", text: "Keep the seal. My oath ends at this anvil; yours seems to lead below an abbey." },
        ],
      },
    ],
  },
  {
    id: "main_a_litany_unspoken",
    chain: "the_last_bell",
    order: 4,
    type: "main",
    title: "A Litany Unspoken",
    giverNpcId: "gatewarden_nhal",
    prerequisites: ["main_the_cinder_seal"],
    recommendedLevel: 20,
    summary: "Enter Hollow Abbey, silence its buried cantor, and decide what Hearthmere's bell should remember.",
    objectives: [
      { type: "interact", target: "abbey_gate", required: 1 },
      { type: "defeat", target: "hush_monk", required: 5 },
      { type: "discover", target: "last_bell_crypt", required: 1 },
      { type: "defeat", target: "cantor_oss", required: 1 },
      { type: "interact", target: "memory_clapper", required: 1 },
    ],
    rewards: {
      skillXp: { combat: 1400, attunement: 900, warding: 500 },
      currency: { sableMarks: 1200 },
      items: [{ id: "last_bell_tongue", quantity: 1 }],
      unlocks: ["ending_choice_last_bell", "abbey_crypt_delves"],
    },
    dialogueStages: [
      {
        stage: "offer",
        lines: [
          { speaker: "gatewarden_nhal", text: "The seal commands me to open. Mercy begs me not to." },
          { speaker: "gatewarden_nhal", text: "Cantor Oss feeds the Bell every name it was built to preserve. Soon it will know only hunger." },
        ],
      },
      {
        stage: "boss_reveal",
        lines: [
          { speaker: "cantor_oss", text: "A name spoken is a wound reopened. Kneel, and I shall heal the world of memory." },
        ],
      },
      {
        stage: "complete",
        lines: [
          { speaker: "narrator", text: "The clapper holds thousands of names. You may return them to Hearthmere's bell, or let the Reach forget in peace." },
        ],
      },
    ],
  },
  {
    id: "side_a_smiths_debt",
    chain: "cinderward_vows",
    order: 1,
    type: "side",
    title: "A Smith's Debt",
    giverNpcId: "orik_senn",
    prerequisites: [],
    recommendedLevel: 8,
    summary: "Gather ember-iron so Orik can finish the blade he promised to a dead traveler.",
    objectives: [
      { type: "gather", target: "ember_iron", required: 5 },
      { type: "craft", target: "unquenched_blade", required: 1 },
      { type: "interact", target: "warm_cairn", required: 1 },
    ],
    rewards: {
      skillXp: { mining: 380, smithing: 450 },
      currency: { sableMarks: 300 },
      items: [{ id: "cairnward_blade", quantity: 1 }],
      unlocks: ["orik_advanced_smithing"],
    },
    dialogueStages: [
      {
        stage: "offer",
        lines: [
          { speaker: "orik_senn", text: "A traveler paid me for a sword, then had the discourtesy to die before I finished it." },
          { speaker: "orik_senn", text: "Five pieces of ember-iron. We'll give the blade to his cairn and call the account square." },
        ],
      },
      {
        stage: "in_progress",
        lines: [{ speaker: "orik_senn", text: "Ore first. Sentiment after." }],
      },
      {
        stage: "complete",
        lines: [{ speaker: "orik_senn", text: "The dead traveler has his sword. You have mine." }],
      },
    ],
  },
  {
    id: "side_the_map_that_forgets",
    chain: "unwritten_roads",
    order: 1,
    type: "side",
    title: "The Map That Forgets",
    giverNpcId: "vellin_the_unwritten",
    prerequisites: [],
    recommendedLevel: 5,
    summary: "Fix three vanishing landmarks in Vellin's map by witnessing them while carrying his memory ink.",
    objectives: [
      { type: "discover", target: "pilgrim_cut", required: 1 },
      { type: "discover", target: "reedward_bridge", required: 1 },
      { type: "discover", target: "glasswood_rise", required: 1 },
      { type: "talk", target: "vellin_the_unwritten", required: 1 },
    ],
    rewards: {
      skillXp: { exploration: 500, survival: 240 },
      currency: { sableMarks: 240 },
      items: [{ id: "unfading_map", quantity: 1 }],
      unlocks: ["regional_fast_travel", "vellins_hidden_marks"],
    },
    dialogueStages: [
      {
        stage: "offer",
        lines: [
          { speaker: "vellin_the_unwritten", text: "My map forgets the land behind me. A professional embarrassment; a personal terror." },
          { speaker: "vellin_the_unwritten", text: "Carry this ink. Look closely at three places the Reach would rather lose." },
        ],
      },
      {
        stage: "in_progress",
        lines: [{ speaker: "vellin_the_unwritten", text: "If the ink stings, a place has noticed you noticing it." }],
      },
      {
        stage: "complete",
        lines: [{ speaker: "vellin_the_unwritten", text: "There they are. Roads, stones, mistakes—all the comforting furniture of a real world." }],
      },
    ],
  },
  {
    id: "side_mercy_in_the_reeds",
    chain: "reed_sister",
    order: 1,
    type: "side",
    title: "Mercy in the Reeds",
    giverNpcId: "ysra_pell",
    prerequisites: ["main_embers_at_dusk"],
    recommendedLevel: 9,
    summary: "Brew a draught that lets one drowned parishioner remember their living name.",
    objectives: [
      { type: "gather", target: "witch_reed", required: 3 },
      { type: "acquire", target: "pale_salt", required: 1 },
      { type: "craft", target: "draught_of_returning", required: 1 },
      { type: "interact", target: "nameless_mirebound", required: 1 },
    ],
    rewards: {
      skillXp: { foraging: 320, alchemy: 520, empathy: 200 },
      currency: { sableMarks: 180 },
      items: [{ id: "pell_family_token", quantity: 1 }],
      unlocks: ["mirebound_non_hostile_window", "ysra_remedy_recipes"],
    },
    dialogueStages: [
      {
        stage: "offer",
        lines: [
          { speaker: "ysra_pell", text: "One of the drowned still taps our childhood knock against the bridge stones." },
          { speaker: "ysra_pell", text: "I cannot save my brother. I would still like to meet him once more." },
        ],
      },
      {
        stage: "in_progress",
        lines: [{ speaker: "ysra_pell", text: "Witch reed for memory, pale salt for tears. Neither ingredient is gentle." }],
      },
      {
        stage: "complete",
        lines: [
          { speaker: "ysra_pell", text: "He remembered the knock. That is not a life, but it is more than the mire gave back." },
        ],
      },
    ],
  },
];
