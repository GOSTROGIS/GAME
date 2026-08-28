/**
 * Named characters and faction relationships for The Hollow March.
 * Existing vertical-slice NPC IDs are preserved for quest compatibility.
 */

const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
};

export const FACTIONS = deepFreeze([
  {
    id: "ember_ledger",
    name: "The Ember Ledger",
    homeRegion: "hearthmere",
    ethos: "A community survives only while every name and debt is remembered.",
    publicGoal: "Keep Hearthmere supplied, recorded, and protected through the Ninth Dimming.",
    hiddenConflict: "The Ledger has begun quietly removing names it cannot afford to feed.",
    standingAxis: ["unentered", "recorded", "entrusted"],
  },
  {
    id: "bell_wardens",
    name: "Bell-Wardens",
    homeRegion: "hearthmere",
    ethos: "A bell rung on time is a wall no darkness can cross.",
    publicGoal: "Defend settlement bells and train enough ringers to keep the dusk circuit alive.",
    hiddenConflict: "Their oldest defensive cadence is also a summons to something below the Abbey.",
    standingAxis: ["untested", "watchmate", "warden_sworn"],
  },
  {
    id: "reed_sisters",
    name: "The Reed Sisters",
    homeRegion: "dunmire",
    ethos: "Nothing drowned is wholly lost; nothing returned is wholly safe.",
    publicGoal: "Treat marsh sickness, guide causeway travelers, and negotiate with Dunmire's dead.",
    hiddenConflict: "A faction within the sisters wants to restore the drowned parish at Hearthmere's expense.",
    standingAxis: ["dry_foot", "reed_friend", "mire_kin"],
  },
  {
    id: "cinder_compact",
    name: "The Cinder Compact",
    homeRegion: "cinderward",
    ethos: "Every useful thing is a promise between hand, material, and heat.",
    publicGoal: "Reclaim Cinderward craft without reopening the royal furnace.",
    hiddenConflict: "Several smiths are secretly feeding the furnace to keep loved ones alive inside it.",
    standingAxis: ["cold_hand", "journeyman", "compact_sealbearer"],
  },
  {
    id: "exact_word",
    name: "Custodians of the Exact Word",
    homeRegion: "hollow_abbey",
    ethos: "Careless language made the Last Bell hungry; precise language may bind it again.",
    publicGoal: "Contain Hollow Abbey and prevent its liturgies from reaching inhabited bells.",
    hiddenConflict: "Their binding sentence requires one living settlement to be deliberately forgotten.",
    standingAxis: ["inexact", "witness", "clause_bearer"],
  },
  {
    id: "unwritten_roads",
    name: "The Unwritten Roads",
    homeRegion: "graven_march",
    ethos: "A road exists because someone returns to describe it.",
    publicGoal: "Map shifting routes, escort travelers, and preserve places the Reach erases.",
    hiddenConflict: "Their master map is not recording the land; it is deciding which land remains.",
    standingAxis: ["unmapped", "waymark", "roadkeeper"],
  },
  {
    id: "grave_tithe",
    name: "The Grave Tithe",
    homeRegion: "graven_march",
    ethos: "The dead owe nothing; the living owe the dead privacy, proof, and a proper road home.",
    publicGoal: "Recover bodies, expose false casualty rolls, and return keepsakes without official sanction.",
    hiddenConflict: "Their smuggling network is financed by selling selected memories to bell revenants.",
    standingAxis: ["collector", "name_runner", "tithe_forgiven"],
  },
]);

const voice = (cadence, vocabulary, verbalTic, sampleLine) => ({ cadence, vocabulary, verbalTic, sampleLine });
const link = (characterId, type, summary, stateFlag) => ({ characterId, type, summary, stateFlag });

const person = ({
  id,
  name,
  factionId,
  regionId,
  role,
  baseline,
  motivations,
  secret,
  quest,
  outcomes,
  dialogue,
  links,
  extraFlags = {},
}) => ({
  id,
  name,
  factionId,
  role,
  region: regionId,
  motivations,
  secrets: [secret],
  relationshipHooks: links,
  questArcs: [
    {
      id: `${id}_arc`,
      title: quest,
      stateFlag: `arc_${id}`,
      stages: ["unstarted", "offered", "active", "resolved"],
      outcomes,
    },
  ],
  dialogueVoice: dialogue,
  disposition: {
    baseline,
    trust: 0,
    fear: 0,
    aggression: baseline === "hostile" ? 60 : baseline === "wary" ? 15 : 0,
  },
  stateFlags: {
    met: false,
    alive: true,
    hostile: baseline === "hostile",
    secretRevealed: false,
    arcState: "unstarted",
    [`arc_${id}`]: "unstarted",
    ...extraFlags,
  },
});

const P = person;
const V = voice;
const L = link;

const CHARACTER_SPECS = [
  // The Ember Ledger
  P({
    id: "maela_voss", name: "Maela Voss", factionId: "ember_ledger", regionId: "hearthmere", role: "Keeper of the Ember Ledger", baseline: "measured",
    motivations: ["Keep Hearthmere alive without teaching it cruelty.", "Recover every missing villager's true fate."],
    secret: "She has kept six officially erased names tattooed beneath her gloves, including her own brother's.",
    quest: "Hands Full of Names", outcomes: ["restore_erased_households", "protect_the_ledger_lie", "name_maela_successor"],
    dialogue: V("Short, deliberate clauses", "Civic and tactile", "Counts choices on her tattooed fingers", "A small light is still ours. That is reason enough to tend it."),
    links: [L("torren_vale", "old_trust", "Torren is the only person who can challenge her publicly without being expelled.", "maela_torren_reconciled"), L("iva_pell", "political_debt", "Iva knows which names Maela removed during the lean winter.", "iva_holds_ledger_proof")],
  }),
  P({
    id: "avren_doss", name: "Avren Doss", factionId: "ember_ledger", regionId: "hearthmere", role: "Assistant Keeper and ration auditor", baseline: "formal",
    motivations: ["Make the Ledger mathematically fair.", "Prove that scarcity can be governed without favoritism."],
    secret: "He alters ration fractions so children in two unregistered households receive food.",
    quest: "The Honest Fraction", outcomes: ["expose_avrens_mercy", "formalize_hidden_rations", "end_the_unentered_ration"],
    dialogue: V("Precise and over-explained", "Arithmetic and domestic", "Corrects his own estimates aloud", "Four measures become five if everyone agrees to be a little less exact."),
    links: [L("ilse_crow", "covert_supplier", "Ilse delivers food to Avren's unregistered households.", "avren_ilse_route_known")],
  }),
  P({
    id: "bera_claymother", name: "Bera Claymother", factionId: "ember_ledger", regionId: "hearthmere", role: "Maker of memorial tablets", baseline: "warm",
    motivations: ["Give every dead person a durable name.", "Teach an apprentice before her hands fail."],
    secret: "Some tablets speak to her while the clay is wet, and one voice claims to be the Last Bell itself.",
    quest: "Clay That Answers", outcomes: ["silence_answering_clay", "record_bells_voice", "let_bera_become_claymother"],
    dialogue: V("Patient, story-shaped sentences", "Clay, kitchens, and weather", "Presses a thumb into nearby soft surfaces", "A name must dry slowly, same as grief, or both will crack."),
    links: [L("maela_voss", "maternal_concern", "Bera taught Maela to write names and fears the office is consuming her.", "bera_confronted_maela")],
  }),
  P({
    id: "fenn_joryn", name: "Fenn Joryn", factionId: "ember_ledger", regionId: "hearthmere", role: "Warm-spring keeper", baseline: "friendly",
    motivations: ["Keep the warm spring public.", "Find why its temperature drops whenever the Abbey tolls."],
    secret: "He has hidden a drowned child beneath the spring house because its presence keeps the water warm.",
    quest: "The Warmth Beneath", outcomes: ["return_drowned_child", "bind_child_to_spring", "share_spring_truth"],
    dialogue: V("Quick, hospitable bursts", "Water, pipes, and gossip", "Offers a towel during tense conversations", "Warm your hands first. Bad news waits; cold fingers do not."),
    links: [L("ysra_pell", "desperate_confidante", "Ysra knows the source of the spring's warmth and refuses to bless it.", "ysra_judged_spring")],
  }),
  P({
    id: "dessa_mirel", name: "Dessa Mirel", factionId: "ember_ledger", regionId: "hearthmere", role: "Market reeve", baseline: "shrewd",
    motivations: ["Prevent hoarding before dusk shortages.", "Turn Hearthmere's market into neutral ground for every faction."],
    secret: "She owns a royal foundry bond that may legally transfer Cinderward to her family.",
    quest: "A Market in Ash", outcomes: ["found_neutral_market", "claim_cinderward_bond", "burn_the_bond"],
    dialogue: V("Fast bargaining cadence", "Weights, promises, and appetite", "Names the hidden price in every favor", "Free is simply expensive with the numbers concealed."),
    links: [L("orik_senn", "legal_rivalry", "Orik considers her foundry bond an insult written by dead royalty.", "dessa_orik_bond_settled")],
  }),
  P({
    id: "kett_sable", name: "Kett Sable", factionId: "ember_ledger", regionId: "hearthmere", role: "Dusk courier", baseline: "restless",
    motivations: ["Deliver every clay name before the bell.", "Map a route that remains safe after dark."],
    secret: "He is slowly vanishing from maps and suspects Vellin traded away his road by accident.",
    quest: "Courier Without a Road", outcomes: ["restore_ketts_route", "anchor_kett_to_hearthmere", "let_kett_follow_the_erasure"],
    dialogue: V("Breathless, forward-driving", "Distances and deadlines", "Checks the western light mid-sentence", "Tell me while we walk. Dusk does not pause for complete explanations."),
    links: [L("vellin_the_unwritten", "injured_friendship", "Kett once saved Vellin, who may now be erasing him.", "kett_vellin_truth_known")],
  }),

  // Bell-Wardens
  P({
    id: "torren_vale", name: "Torren Vale", factionId: "bell_wardens", regionId: "hearthmere", role: "Senior Bell-Warden and combat trainer", baseline: "blunt",
    motivations: ["Train a successor before his old wound fails.", "Learn why the bells now answer one another."],
    secret: "He abandoned a border bell during the March retreat, leaving an entire camp outside its protection.",
    quest: "The Bell He Left", outcomes: ["ring_abandoned_bell", "bury_the_clapper", "confess_torrens_retreat"],
    dialogue: V("Clipped commands softened after a pause", "Guard craft and weather", "Taps his clapper-mace twice", "Again. The dark does not care that your first attempt was sincere."),
    links: [L("maela_voss", "old_trust", "Maela knows the retreat was ordered, not cowardice.", "maela_torren_reconciled"), L("bram_caul", "mentor_conflict", "Bram worships Torren's legend and would despise the truth.", "bram_knows_retreat")],
  }),
  P({
    id: "alda_rime", name: "Alda Rime", factionId: "bell_wardens", regionId: "hearthmere", role: "Cadence keeper", baseline: "vigilant",
    motivations: ["Preserve defensive bell cadences.", "Separate protective tones from the Abbey's summons."],
    secret: "The cadence written in her late mother's hand contains an extra beat audible only underground.",
    quest: "The Beat Beneath", outcomes: ["rewrite_the_cadence", "complete_the_summons", "entrust_pattern_to_nhal"],
    dialogue: V("Rhythmic phrases with measured rests", "Music, timing, and architecture", "Knocks patterns on her breastplate", "Hear the space after the toll. That is where the answer hides."),
    links: [L("gatewarden_nhal", "scholarly_correspondent", "Nhal answers her questions by arranging rain drops into notation.", "alda_nhal_cadence_shared")],
  }),
  P({
    id: "neris_thorn", name: "Neris Thorn", factionId: "bell_wardens", regionId: "dunmire", role: "Causeway watch captain", baseline: "wary",
    motivations: ["Keep the Reedward Bridge open.", "Stop wardens from treating all mirebound as identical monsters."],
    secret: "She allows one lucid drowned parishioner to cross the watch line each new moon.",
    quest: "The New-Moon Crossing", outcomes: ["protect_the_crossing", "arrest_the_parishioner", "establish_drowned_passage"],
    dialogue: V("Low practical statements", "Sightlines, reeds, and risk", "Looks at reflections instead of faces", "The water lies less than people do, but it chooses stranger truths."),
    links: [L("roan_drel", "forbidden_cooperation", "Roan identifies the lucid drowned for her patrol.", "neris_roan_compact")],
  }),
  P({
    id: "edda_quill", name: "Edda Quill", factionId: "bell_wardens", regionId: "cinderward", role: "Armorer of the dusk circuit", baseline: "practical",
    motivations: ["Make heat-safe armor for bell crews.", "Recover the alloy recipe royal smiths suppressed."],
    secret: "Her best armor uses flakes taken from dormant kiln thralls that may still feel every cut.",
    quest: "Armor That Remembers Pain", outcomes: ["end_thrall_harvest", "perfect_warden_alloy", "awaken_armor_witnesses"],
    dialogue: V("Compact workshop shorthand", "Fit, stress, and failure", "Tests buckles while speaking", "If it pinches here, it kills you there. Hold still."),
    links: [L("sava_quench", "craft_rivalry", "Sava calls Edda's material source both unethical and brilliant.", "edda_sava_alloy_debate")],
  }),
  P({
    id: "bram_caul", name: "Bram Caul", factionId: "bell_wardens", regionId: "graven_march", role: "Young patrol leader", baseline: "earnest",
    motivations: ["Become the hero he believes Torren was.", "Clear deserters from the old dusk route."],
    secret: "He has been taking Grave Tithe payments to misreport bodies found on patrol.",
    quest: "A Hero's False Roll", outcomes: ["expose_brams_payments", "legitimize_tithe_recovery", "turn_bram_informant"],
    dialogue: V("Confident starts, uncertain endings", "Heroic ballads and patrol slang", "Quotes Torren inaccurately", "A warden stands where others—well, where others would prefer not to."),
    links: [L("garran_low", "coerced_partner", "Garran pays Bram for access to unreported dead.", "bram_garran_arrangement")],
  }),
  P({
    id: "olan_vey", name: "Olan Vey", factionId: "bell_wardens", regionId: "graven_march", role: "Ruined-bell surveyor", baseline: "curious",
    motivations: ["Catalog bells destroyed during the denied war.", "Prove one ruin moves with the March roads."],
    secret: "He can hear bells before they existed and has begun recording tomorrow's tolls.",
    quest: "Tomorrow's Toll", outcomes: ["prevent_foreheard_disaster", "ring_future_bell", "erase_olans_hearing"],
    dialogue: V("Distracted, then suddenly exact", "Acoustics and future tense", "Answers questions a few seconds early", "No, it will have rung twice. Sorry—you have not heard the first yet."),
    links: [L("vellin_the_unwritten", "research_partnership", "Vellin maps where Olan's future sounds seem to originate.", "olan_vellin_future_map")],
  }),

  // Reed Sisters
  P({
    id: "ysra_pell", name: "Ysra Pell", factionId: "reed_sisters", regionId: "dunmire", role: "Reed-Sister and marsh healer", baseline: "warm",
    motivations: ["Give her drowned brother one lucid moment.", "Keep healing honest even when the mire offers miracles."],
    secret: "Her brother's childhood knock also answers from beneath Hollow Abbey.",
    quest: "Mercy in the Reeds", outcomes: ["return_brothers_name", "release_brother", "follow_knock_to_abbey"],
    dialogue: V("Gentle statements without euphemism", "Medicine, family, and wetland life", "Names the cost before the cure", "I will not lie about the pain. I will stay while it passes."),
    links: [L("fenn_joryn", "moral_dispute", "Ysra refuses to bless the drowned warmth beneath Fenn's spring.", "ysra_judged_spring"), L("iva_pell", "family_distance", "Iva is her aunt and believes Ysra's mercy endangers the living.", "pell_family_reconciled")],
  }),
  P({
    id: "nima_reed", name: "Nima Reed", factionId: "reed_sisters", regionId: "dunmire", role: "Charm weaver", baseline: "playful",
    motivations: ["Replace predatory coven charms with harmless wards.", "Make people laugh in places that expect fear."],
    secret: "One of her joking charms trapped a child's voice, and she has not found the courage to open it.",
    quest: "A Laugh in a Jar", outcomes: ["free_the_voice", "return_voice_to_child", "turn_voice_into_ward"],
    dialogue: V("Teasing questions and sudden sincerity", "Knots, birds, and jokes", "Makes charms while waiting for answers", "If a knot cannot laugh, it has no business telling feet where to go."),
    links: [L("tess_fen", "sisterly_rivalry", "Tess wants Nima to stop disguising dangerous charms as toys.", "nima_tess_charm_resolved")],
  }),
  P({
    id: "cal_harrow", name: "Cal Harrow", factionId: "reed_sisters", regionId: "dunmire", role: "Pale-salt collector", baseline: "reserved",
    motivations: ["Harvest enough pale salt for antidotes.", "Find a way to collect salt without preserving grief."],
    secret: "The salt crystals repeat the final thoughts of those whose tears formed them.",
    quest: "Salt of Last Thoughts", outcomes: ["quiet_the_salt", "catalog_last_thoughts", "forge_memory_alloy"],
    dialogue: V("Sparse observations", "Minerals, taste, and silence", "Touches salt to his tongue before deciding", "Bitter means recent. Sweet means the grief learned patience."),
    links: [L("orik_senn", "material_exchange", "Orik believes pale salt can quench memory out of bell-metal.", "cal_orik_quench_test")],
  }),
  P({
    id: "iva_pell", name: "Iva Pell", factionId: "reed_sisters", regionId: "hearthmere", role: "Settlement midwife and faction envoy", baseline: "stern",
    motivations: ["Prevent mire bargains from entering Hearthmere births.", "Force the Ledger to acknowledge unregistered families."],
    secret: "She kept copies of the six names Maela erased and uses them as political leverage.",
    quest: "Six Names at the Table", outcomes: ["restore_six_names", "destroy_ivas_copies", "reform_ledger_council"],
    dialogue: V("Direct imperatives", "Birth, ancestry, and obligation", "Asks who benefits from every proposal", "A secret kept for protection still belongs to the protected."),
    links: [L("maela_voss", "political_leverage", "Iva can expose the Ledger's erased households.", "iva_holds_ledger_proof"), L("ysra_pell", "family_distance", "She loves Ysra and distrusts her hope.", "pell_family_reconciled")],
  }),
  P({
    id: "tess_fen", name: "Tess Fen", factionId: "reed_sisters", regionId: "dunmire", role: "Causeway undertaker", baseline: "dry_humored",
    motivations: ["Keep recovered dead from returning a second time.", "Learn why some bodies reject their own names."],
    secret: "She buried a living Reed Witch who now speaks through every grave Tess digs.",
    quest: "The Grave That Interrupts", outcomes: ["free_buried_witch", "seal_speaking_graves", "accept_tess_into_coven"],
    dialogue: V("Dry, perfectly timed remarks", "Burial work and household chores", "Apologizes to the dead before jokes", "You may complain about the grave after I finish measuring you for it."),
    links: [L("nima_reed", "sisterly_rivalry", "Nima thinks Tess mistakes caution for wisdom.", "nima_tess_charm_resolved")],
  }),
  P({
    id: "roan_drel", name: "Roan Drel", factionId: "reed_sisters", regionId: "dunmire", role: "Drowned-name listener", baseline: "uncanny",
    motivations: ["Identify lucid dead before wardens destroy them.", "Hear his own name spoken by someone living."],
    secret: "Roan drowned years ago; the person walking now is the mire's accurate memory of him.",
    quest: "A Man Remembered by Water", outcomes: ["name_roan_living", "return_roan_to_mire", "prove_memory_personhood"],
    dialogue: V("Echoed phrases with one altered word", "Names, currents, and recollection", "Waits for water to finish rippling", "You remember me clearly. That may be enough to call me here."),
    links: [L("neris_thorn", "forbidden_cooperation", "Neris protects the lucid drowned Roan identifies.", "neris_roan_compact")],
  }),

  // Cinder Compact
  P({
    id: "orik_senn", name: "Orik Senn", factionId: "cinder_compact", regionId: "cinderward", role: "Last Smith of Cinderward", baseline: "proud",
    motivations: ["Finish every commission the dead foundry accepted.", "Keep the royal furnace sealed from all crowns."],
    secret: "His anvil-chain anchors the furnace shut; leaving Cinderward would open it.",
    quest: "The Smith's Last Link", outcomes: ["free_orik_and_open_furnace", "transfer_chain_to_player", "forge_new_anchor"],
    dialogue: V("Blunt transactional sentences", "Metal, debt, and superstition", "Strikes the anvil instead of swearing", "Ore first. Sentiment after. Both improve under a hammer."),
    links: [L("dessa_mirel", "legal_rivalry", "He refuses to recognize Dessa's royal bond.", "dessa_orik_bond_settled"), L("cal_harrow", "material_exchange", "Cal's pale salt may release the memories trapped in his chain.", "cal_orik_quench_test")],
  }),
  P({
    id: "sava_quench", name: "Sava Quench", factionId: "cinder_compact", regionId: "cinderward", role: "Quench-master", baseline: "intense",
    motivations: ["Recover humane tempering methods.", "Prove memory can be removed from metal without destroying it."],
    secret: "She can hear every death caused by a weapon when she quenches it.",
    quest: "The Blade's Testimony", outcomes: ["silence_weapon_memories", "make_weapons_testify", "quench_savas_gift"],
    dialogue: V("Rapid technical diagnoses", "Temperature, sound, and culpability", "Flinches when weapons are drawn", "That edge remembers three throats. Do not ask me whose."),
    links: [L("edda_quill", "craft_rivalry", "She admires Edda's craft and condemns her thrall harvesting.", "edda_sava_alloy_debate")],
  }),
  P({
    id: "tarn_widow", name: "Tarn Widow", factionId: "cinder_compact", regionId: "cinderward", role: "Keeper of Widow Forge", baseline: "mournful",
    motivations: ["Maintain the forge named for her.", "Separate her late spouse from the kiln system."],
    secret: "Her spouse willingly became the forge's regulating intelligence and does not want rescue.",
    quest: "A Marriage of Iron", outcomes: ["free_spouse_from_forge", "renew_forge_marriage", "let_forge_choose"],
    dialogue: V("Soft domestic language around industrial horror", "Marriage, meals, and furnace parts", "Addresses the forge as if it were present", "We argued about heat even before the walls learned his voice."),
    links: [L("orik_senn", "shared_burden", "Orik forged the chain that bound her spouse to the furnace.", "tarn_orik_chain_truth")],
  }),
  P({
    id: "mera_bolt", name: "Mera Bolt", factionId: "cinder_compact", regionId: "cinderward", role: "Salvage engineer", baseline: "cheerful",
    motivations: ["Turn dead royal machinery into public tools.", "Build a cart that can cross moving roads."],
    secret: "Her prototype is powered by a trapped bell revenant that believes it is the cart driver.",
    quest: "The Cart That Knows the Way", outcomes: ["free_revenant_driver", "complete_memory_cart", "give_cart_to_roadkeepers"],
    dialogue: V("Enthusiastic run-on explanations", "Mechanisms and improbable transport", "Imitates machine noises accurately", "It only screams on left turns, which is nearly a steering indicator."),
    links: [L("kora_path", "field_tester", "Kora tests Mera's impossible vehicles on unstable roads.", "mera_kora_cart_trial")],
  }),
  P({
    id: "dain_coal", name: "Dain Coal", factionId: "cinder_compact", regionId: "cinderward", role: "Furnace penitent", baseline: "wary",
    motivations: ["Atone for sealing workers inside the foundry.", "Prevent the Kilnforged from reaching Hearthmere."],
    secret: "He obeyed the sealing order because his family alone had already escaped.",
    quest: "The Outside Lock", outcomes: ["confess_dains_choice", "release_trapped_workers", "seal_furnace_forever"],
    dialogue: V("Slow statements that avoid the first person", "Locks, orders, and consequence", "Checks every door twice", "The lock was outside. That detail has survived every excuse."),
    links: [L("teth_varo", "witness", "Teth copied the order Dain used to seal the foundry.", "dain_teth_order_revealed")],
  }),
  P({
    id: "pritch_glass", name: "Pritch Glass", factionId: "cinder_compact", regionId: "cinderward", role: "Glasswood harvester", baseline: "reckless",
    motivations: ["Harvest living glass without killing its host trees.", "Find the reflected spider that took his sister."],
    secret: "His sister still appears in his glass tools, begging him to stop searching.",
    quest: "The Sister in Every Blade", outcomes: ["free_glass_sister", "hunt_widow_reflection", "break_pritchs_tools"],
    dialogue: V("Bright bravado with quiet endings", "Reflections, edges, and wagers", "Avoids looking at polished surfaces", "Perfectly safe, provided the forest has forgotten what I look like."),
    links: [L("iri_north", "expedition_partner", "Iri mapped the reflection where Pritch's sister remains.", "pritch_iri_reflection_route")],
  }),

  // Exact Word
  P({
    id: "gatewarden_nhal", name: "Nhal Without Shadow", factionId: "exact_word", regionId: "hollow_abbey", role: "Gate-Warden of Hollow Abbey", baseline: "formal",
    motivations: ["Obey the Abbey seal exactly.", "Find wording that permits mercy without breaking duty."],
    secret: "Nhal is not inside the armor; the rain speaking through it is the last living part of the original warden.",
    quest: "Rain in an Empty Helm", outcomes: ["free_nhal_as_rain", "renew_gate_oath", "give_nhal_a_shadow"],
    dialogue: V("Ceremonial and condition-bound", "Law, weather, and exact terms", "Repeats ambiguous words as questions", "The seal commands me to open. Mercy remains grammatically persuasive."),
    links: [L("alda_rime", "scholarly_correspondent", "Alda is translating Nhal's rain patterns into bell notation.", "alda_nhal_cadence_shared")],
  }),
  P({
    id: "moira_quiet", name: "Moira Quiet", factionId: "exact_word", regionId: "hollow_abbey", role: "Vow archivist", baseline: "calm",
    motivations: ["Record every vow broken within the Abbey.", "Find one promise that does no harm when kept perfectly."],
    secret: "She invented three historical vows to conceal that the founders made no sacrifice at all.",
    quest: "Promises Without Makers", outcomes: ["expose_founder_fraud", "preserve_useful_vows", "write_a_new_vow"],
    dialogue: V("Balanced clauses and careful qualifications", "Promises, evidence, and exceptions", "Defines ordinary words before using them", "A harmless promise is usually one too small to need making."),
    links: [L("mott_vane", "document_trade", "Mott supplies original documents that contradict her archive.", "moira_mott_archive_proof")],
  }),
  P({
    id: "seln_clause", name: "Seln Clause", factionId: "exact_word", regionId: "hollow_abbey", role: "Binding advocate", baseline: "cold",
    motivations: ["Complete the sentence that binds the Last Bell.", "Convince a settlement to accept erasure voluntarily."],
    secret: "Seln has chosen Hearthmere because he was born there under a name the Ledger later erased.",
    quest: "The Voluntary Erasure", outcomes: ["reject_selns_clause", "offer_another_memory", "restore_selns_name"],
    dialogue: V("Legal syllogisms", "Consent, definitions, and sacrifice", "Asks for verbal confirmation twice", "Consent given without understanding is only a better-dressed command."),
    links: [L("maela_voss", "ideological_threat", "Seln wants Maela to sign Hearthmere into his binding sentence.", "seln_hearthmere_clause")],
  }),
  P({
    id: "brother_iven", name: "Brother Iven", factionId: "exact_word", regionId: "hollow_abbey", role: "Silent infirmarian", baseline: "gentle",
    motivations: ["Treat Hush Order injuries without spoken rites.", "Restore sensation to monks who cut away too much of themselves."],
    secret: "He secretly returned his own tongue and can now hear thoughts spoken near bells.",
    quest: "A Tongue Regrown", outcomes: ["let_iven_speak", "remove_listening_tongue", "use_gift_against_choir"],
    dialogue: V("Written notes with tiny illustrations", "Anatomy and kindness", "Draws a small door beside difficult answers", "[written] Pain is information, not a verdict."),
    links: [L("ysra_pell", "healing_correspondent", "Ysra taught him the mire rite that regrew his tongue.", "iven_ysra_rite_shared")],
  }),
  P({
    id: "aven_tongueless", name: "Aven Tongueless", factionId: "exact_word", regionId: "hollow_abbey", role: "Hush Order defector", baseline: "wary",
    motivations: ["Stop the Order from recruiting children.", "Communicate what he witnessed beneath the Last Bell."],
    secret: "His severed tongue became an independent echo that now informs on him.",
    quest: "The Informing Tongue", outcomes: ["destroy_echo_tongue", "reunite_aven_with_voice", "feed_false_words_to_order"],
    dialogue: V("Gesture-first, scratched single words", "Concrete images and routes", "Touches his throat before lies", "[scratched] VOICE BELOW. NOT OSS. OLDER."),
    links: [L("netta_aster", "smuggling_debt", "Netta carried Aven out of the Abbey in a reliquary crate.", "aven_netta_debt")],
  }),
  P({
    id: "teth_varo", name: "Teth Varo", factionId: "exact_word", regionId: "cinderward", role: "Keeper of royal prohibitions", baseline: "stern",
    motivations: ["Recover dangerous royal orders.", "Determine whether obedience can expire."],
    secret: "Teth authored the command to seal Cinderward, then removed his own name from it.",
    quest: "The Author of the Order", outcomes: ["name_teth_author", "destroy_sealing_order", "make_teth_unseal_foundry"],
    dialogue: V("Passive constructions that conceal agency", "Authority, procedure, and expiry", "Never uses the word 'I'", "An order was written. A door was sealed. Agency remains under review."),
    links: [L("dain_coal", "guilty_witness", "Dain carried out the order Teth refuses to own.", "dain_teth_order_revealed")],
  }),

  // Unwritten Roads
  P({
    id: "vellin_the_unwritten", name: "Vellin the Unwritten", factionId: "unwritten_roads", regionId: "graven_march", role: "Itinerant map-maker", baseline: "curious",
    motivations: ["Anchor every vanishing landmark.", "Learn why his maps erase places after he leaves."],
    secret: "Vellin removed his birth village from the master map to save the rest of the Reach.",
    quest: "The Map That Forgets", outcomes: ["restore_birth_village", "accept_map_sacrifice", "destroy_master_map"],
    dialogue: V("Wry digressions ending in precise directions", "Maps, memory, and professional embarrassment", "Draws routes in the air", "Roads, stones, mistakes—the comforting furniture of a real world."),
    links: [L("kett_sable", "injured_friendship", "His map may be erasing Kett as collateral.", "kett_vellin_truth_known"), L("olan_vey", "research_partnership", "Olan's future bells appear on Vellin's maps.", "olan_vellin_future_map")],
  }),
  P({
    id: "kora_path", name: "Kora Path", factionId: "unwritten_roads", regionId: "graven_march", role: "Route breaker", baseline: "bold",
    motivations: ["Walk every road before putting it on a map.", "Prove moving roads can be trained like animals."],
    secret: "A road has followed her since childhood and removes places where she sleeps too long.",
    quest: "The Road at Her Heels", outcomes: ["tame_following_road", "cut_kora_from_road", "lead_road_to_frontier"],
    dialogue: V("Direct, kinetic challenges", "Animal handling and terrain", "Never sits facing a door", "Paths are shy until they know you are more stubborn than they are."),
    links: [L("mera_bolt", "field_tester", "Kora happily tests Mera's least reasonable vehicles.", "mera_kora_cart_trial")],
  }),
  P({
    id: "marn_upland", name: "Marn Upland", factionId: "unwritten_roads", regionId: "graven_march", role: "Cairn reader", baseline: "patient",
    motivations: ["Translate the warmth patterns of March cairns.", "Return stolen memorial stones to their proper graves."],
    secret: "He rearranges cairns to divert beasts toward deserter camps.",
    quest: "Warm Stones, Cold Choice", outcomes: ["restore_cairn_routes", "defend_marns_diversion", "redirect_beasts_to_frontier"],
    dialogue: V("Long pauses followed by exact observations", "Stone, heat, and migration", "Warms a pebble in his palm", "This one misses its hill. Stone is slower than grief, not emptier."),
    links: [L("bram_caul", "territorial_conflict", "Bram believes Marn's cairn routes endanger patrols.", "marn_bram_route_settled")],
  }),
  P({
    id: "iri_north", name: "Iri North", factionId: "unwritten_roads", regionId: "cinderward", role: "Reflection cartographer", baseline: "focused",
    motivations: ["Map routes visible only in glasswood reflections.", "Find a reflection leading beyond the Sable Reach."],
    secret: "The reflected frontier shows Iri already living there, decades older and unwilling to return.",
    quest: "The Older Cartographer", outcomes: ["meet_future_iri", "close_reflection_route", "exchange_places_with_reflection"],
    dialogue: V("Visual, spatial explanations", "Angles, light, and alternate routes", "Positions a hand mirror before answering", "We are not lost. We are merely correct in the wrong reflection."),
    links: [L("pritch_glass", "expedition_partner", "Pritch wants her route to the spider holding his sister.", "pritch_iri_reflection_route")],
  }),
  P({
    id: "rin_waymark", name: "Rin Waymark", factionId: "unwritten_roads", regionId: "dunmire", role: "Causeway marker", baseline: "methodical",
    motivations: ["Keep route markers above rising blackwater.", "Discover who moves markers during moonless nights."],
    secret: "Rin moves them herself while asleep, guided by a drowned version of the causeway.",
    quest: "Markers in Two Worlds", outcomes: ["align_both_causeways", "wake_rin_from_route", "open_drowned_shortcut"],
    dialogue: V("Numbered steps and checklists", "Posts, water levels, and verification", "Measures distance with her forearm", "Third marker first. If you see the fourth, you have already gone wrong."),
    links: [L("roan_drel", "unseen_guide", "Roan recognizes the drowned causeway Rin follows in sleep.", "rin_roan_drowned_map")],
  }),
  P({
    id: "elo_veer", name: "Elo Veer", factionId: "unwritten_roads", regionId: "hollow_abbey", role: "Abbey exit finder", baseline: "nervous",
    motivations: ["Find routes out of rooms whose doors forget destinations.", "Rescue an expedition missing inside one corridor."],
    secret: "The missing expedition returned months ago; Elo is the one still trapped, projecting outward.",
    quest: "The Cartographer Outside Himself", outcomes: ["retrieve_real_elo", "stabilize_projection", "trade_elo_for_expedition"],
    dialogue: V("Loops back to earlier phrases", "Doors, recursion, and orientation", "Checks whether his shadow arrived", "If we pass this door again, do not greet me. It encourages the corridor."),
    links: [L("gatewarden_nhal", "containment_case", "Nhal knows Elo's body remains inside the sealed gate.", "elo_nhal_body_location")],
  }),

  // Grave Tithe
  P({
    id: "sera_dusk", name: "Sera Dusk", factionId: "grave_tithe", regionId: "graven_march", role: "Tithe route-master", baseline: "guarded",
    motivations: ["Return war dead omitted from the rolls.", "Keep the Tithe independent of every settlement council."],
    secret: "She sells selected memories to a bell revenant in exchange for safe routes.",
    quest: "The Price of a Safe Road", outcomes: ["end_memory_trade", "choose_memories_to_sell", "destroy_revenant_broker"],
    dialogue: V("Careful understatements", "Routes, debts, and burial privacy", "Never says where she came from", "The road is safe. The price is a separate question."),
    links: [L("maela_voss", "mutual_suspicion", "Maela suspects Sera knows where Hearthmere's erased dead were taken.", "sera_maela_dead_rolls")],
  }),
  P({
    id: "mott_vane", name: "Mott Vane", factionId: "grave_tithe", regionId: "hollow_abbey", role: "Reliquary forger", baseline: "amiable",
    motivations: ["Return mislabeled relics to actual families.", "Embarrass institutions that value labels over remains."],
    secret: "He has forged so many labels that one invented saint has begun performing miracles.",
    quest: "Saint Nobody's Bones", outcomes: ["unmake_false_saint", "legitimize_invented_saint", "return_mixed_relics"],
    dialogue: V("Charming confessions", "Provenance, forgery, and family gossip", "Compliments locks before opening them", "Authenticity is a story told by whoever owns the better ink."),
    links: [L("moira_quiet", "document_trade", "Moira buys his originals while publicly condemning his forgeries.", "moira_mott_archive_proof")],
  }),
  P({
    id: "ilse_crow", name: "Ilse Crow", factionId: "grave_tithe", regionId: "hearthmere", role: "Night ration runner", baseline: "wary",
    motivations: ["Feed households removed from the Ledger.", "Keep children out of the Tithe network."],
    secret: "Ilse is the legal heir to Hearthmere's office but destroyed the proof to avoid becoming Keeper.",
    quest: "The Heir Who Burned Proof", outcomes: ["restore_ilse_heir", "keep_maela_keeper", "abolish_hereditary_office"],
    dialogue: V("Quiet questions that expose assumptions", "Food, rooftops, and escape routes", "Leaves half of every meal untouched", "Before we discuss law, count who goes hungry under it."),
    links: [L("avren_doss", "covert_supplier", "Avren falsifies fractions for the families Ilse supplies.", "avren_ilse_route_known")],
  }),
  P({
    id: "garran_low", name: "Garran Low", factionId: "grave_tithe", regionId: "graven_march", role: "Body-path scout", baseline: "grim",
    motivations: ["Locate unreported battle pits.", "Give the Ninth Blank regiment evidence of its own existence."],
    secret: "He wakes deserters deliberately because their testimony leads him to more graves.",
    quest: "Witnesses with Rusted Spears", outcomes: ["record_deserter_testimony", "end_garrans_wakings", "march_dead_to_capital"],
    dialogue: V("Grim facts with no decoration", "Evidence, remains, and military ground", "Faces downwind as if smelling graves", "Dead soldiers point better than signposts if you ask the right wound."),
    links: [L("bram_caul", "coerced_partner", "He pays Bram to misreport recovered bodies.", "bram_garran_arrangement")],
  }),
  P({
    id: "netta_aster", name: "Netta Aster", factionId: "grave_tithe", regionId: "hollow_abbey", role: "Living-relic smuggler", baseline: "bold",
    motivations: ["Extract people the Abbey labels as objects.", "Learn who first classified her as a reliquary."],
    secret: "Her bones contain small bells, making her legally sacred property under old Abbey law.",
    quest: "A Reliquary That Walks", outcomes: ["free_netta_legally", "remove_bone_bells", "claim_reliquary_status"],
    dialogue: V("Irreverent legal mockery", "Containers, loopholes, and ownership", "Rattles softly when amused", "If I am holy property, kindly address all complaints to my left femur."),
    links: [L("aven_tongueless", "smuggling_debt", "She carried Aven out in a crate while guards cataloged him as bone dust.", "aven_netta_debt")],
  }),
  P({
    id: "orris_pale", name: "Orris Pale", factionId: "grave_tithe", regionId: "cinderward", role: "Ash examiner", baseline: "detached",
    motivations: ["Identify bodies burned into foundry slag.", "Separate criminal evidence from sacred remains."],
    secret: "Orris cannot distinguish his own memories from those inhaled while examining ash.",
    quest: "Whose Memory Burns", outcomes: ["restore_orris_identity", "catalog_shared_memories", "let_orris_join_furnace_dead"],
    dialogue: V("Clinical statements slipping into first-person memories", "Ash layers, anatomy, and borrowed recollection", "Wears a scented cloth over his mouth", "This ash recalls a blue door. I recall painting it. One of us is mistaken."),
    links: [L("sava_quench", "forensic_partner", "Sava can draw weapon memories out of slag Orris identifies.", "orris_sava_memory_case")],
  }),
];

export const CHARACTERS = deepFreeze(CHARACTER_SPECS);

export const CHARACTER_RELATIONSHIPS = deepFreeze(
  CHARACTERS.flatMap((character) =>
    character.relationshipHooks.map((relationship) => ({
      id: `${character.id}__${relationship.characterId}__${relationship.type}__${relationship.stateFlag}`,
      sourceId: character.id,
      targetId: relationship.characterId,
      type: relationship.type,
      summary: relationship.summary,
      stateFlag: relationship.stateFlag,
      directed: true,
    })),
  ),
);

export const STORY_STATE_DEFAULTS = deepFreeze(Object.fromEntries([
  ...CHARACTERS.flatMap((character) => character.questArcs.map((arc) => [arc.stateFlag, "unstarted"])),
  ...CHARACTER_RELATIONSHIPS.map((relationship) => [relationship.stateFlag, false]),
]));

const VALID_REGIONS = new Set(["hearthmere", "graven_march", "dunmire", "cinderward", "hollow_abbey"]);

/** Validate character, faction, and relationship references without mutation. */
export function validateCharacters(characters = CHARACTERS, factions = FACTIONS, relationships = CHARACTER_RELATIONSHIPS) {
  const errors = [];
  const add = (path, code, message) => errors.push({ path, code, message });
  if (!Array.isArray(characters)) return { valid: false, errors: [{ path: "CHARACTERS", code: "invalid_type", message: "Characters must be an array." }] };
  if (!Array.isArray(factions)) return { valid: false, errors: [{ path: "FACTIONS", code: "invalid_type", message: "Factions must be an array." }] };
  if (characters.length < 36) add("CHARACTERS", "roster_too_small", "At least 36 named characters are required.");

  const factionIds = new Set();
  factions.forEach((faction, index) => {
    if (!faction?.id || factionIds.has(faction.id)) add(`FACTIONS.${index}.id`, "duplicate_or_missing", "Faction IDs must be present and unique.");
    factionIds.add(faction?.id);
    if (!faction?.name || !faction?.ethos || !faction?.publicGoal || !faction?.hiddenConflict) add(`FACTIONS.${index}`, "missing_data", "Faction requires name, ethos, public goal, and hidden conflict.");
  });

  const characterIds = new Set();
  const names = new Set();
  characters.forEach((character, index) => {
    const path = `CHARACTERS.${index}`;
    if (!character?.id || characterIds.has(character.id)) add(`${path}.id`, "duplicate_or_missing", "Character IDs must be present and unique.");
    characterIds.add(character?.id);
    if (!character?.name || names.has(character.name)) add(`${path}.name`, "duplicate_or_missing", "Character names must be present and unique.");
    names.add(character?.name);
    if (!factionIds.has(character?.factionId)) add(`${path}.factionId`, "unknown_faction", "Character references an unknown faction.");
    if (!VALID_REGIONS.has(character?.region)) add(`${path}.region`, "unknown_region", "Character references an unknown current region.");
    if (!character?.role) add(`${path}.role`, "missing_role", "Character requires a role.");
    ["motivations", "secrets", "relationshipHooks", "questArcs"].forEach((field) => {
      if (!Array.isArray(character?.[field]) || character[field].length === 0) add(`${path}.${field}`, "missing_data", `${field} must be a non-empty array.`);
    });
    if (!character?.dialogueVoice?.cadence || !character.dialogueVoice.sampleLine) add(`${path}.dialogueVoice`, "missing_voice", "Character requires structured dialogue voice data.");
    if (!character?.disposition?.baseline || !Number.isFinite(character.disposition.trust)) add(`${path}.disposition`, "missing_disposition", "Character requires structured disposition data.");
    if (!character?.stateFlags || typeof character.stateFlags !== "object") add(`${path}.stateFlags`, "missing_flags", "Character requires default state flags.");
    for (const arc of character.questArcs || []) if (!(arc.stateFlag in STORY_STATE_DEFAULTS)) add(`${path}.questArcs`, "undeclared_flag", `Arc flag ${arc.stateFlag} has no declared default.`);
  });

  if (!Array.isArray(relationships)) {
    add("CHARACTER_RELATIONSHIPS", "invalid_type", "Relationships must be an array.");
  } else {
    const relationshipIds = new Set();
    relationships.forEach((relationship, index) => {
      const path = `CHARACTER_RELATIONSHIPS.${index}`;
      if (!relationship?.id || relationshipIds.has(relationship.id)) add(`${path}.id`, "duplicate_or_missing", "Relationship IDs must be present and unique.");
      relationshipIds.add(relationship?.id);
      if (!characterIds.has(relationship?.sourceId) || !characterIds.has(relationship?.targetId)) add(path, "unknown_character", "Relationship source and target must reference known characters.");
      if (!relationship?.type || !relationship?.summary || !relationship?.stateFlag) add(path, "missing_data", "Relationship requires type, summary, and state flag.");
      if (relationship?.stateFlag && !(relationship.stateFlag in STORY_STATE_DEFAULTS)) add(path, "undeclared_flag", `Relationship flag ${relationship.stateFlag} has no declared default.`);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    stats: { characters: characters.length, factions: factions.length, relationships: Array.isArray(relationships) ? relationships.length : 0 },
  };
}
