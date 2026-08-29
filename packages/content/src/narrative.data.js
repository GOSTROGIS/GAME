const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
};

export const NARRATIVE_TARGETS = deepFreeze({
  foundingBestiaryForms: 178,
  foundingNamedCharacters: 42,
  foundingOrigins: 8,
  authoredQuestTarget: 5000,
  expansionCharacterLimit: null,
  expansionCreatureLimit: null,
  uniqueSupportingCharacterPerQuest: true,
  uniqueSignatureItemPerQuest: true,
  genericEnemiesAllowed: false,
  policy: "The founding catalogue is an audited floor, never a ceiling. Expansion records are admitted only through uniqueness and cross-reference validation.",
});

export const QUEST_AUTHORING_LAW = deepFreeze({
  batchSize: 12,
  independentReviewers: 2,
  authorMayApproveOwnQuest: false,
  immutableAfterAcceptance: true,
  requiredProofFields: ["setpiece", "failureTransformation", "dialogueConstraint", "persistentWorldChange", "forbiddenSubstitution"],
  collisionAxes: ["primaryMechanicId", "dilemmaId", "locationId", "consequenceId", "supportingCharacterIds", "signatureReward", "objectiveShape", "authorshipProof"],
  rejectionRule: "A quest is rejected when its dramatic work could be performed by changing nouns in an accepted quest. Shared locations and factions are allowed; shared narrative function is not.",
  productionRule: "Every accepted quest owns a support character, signature reward, mechanical verb, irreversible world-state delta, dialogue constraint, and visual setpiece. Reuse requires a sequel relationship and new dramatic work on every collision axis.",
  stateDomains: ["authority", "admission", "memory", "ecology", "infrastructure", "obligation"],
  stateReadModes: ["all-values", "value-precondition"],
  portfolioIds: ["main_cosmic", "faction_schism", "character_guest_follower", "regional", "settlement", "profession_systemic", "world_state_reaction", "relic_creature_ecology"],
});

export const WORLD_PREMISE = deepFreeze({
  id: "the_late_world",
  title: "The Late World",
  publicTruth: "The Sable Reach is not recovering from an ending. It is living through an ending that has learned to proceed slowly.",
  hiddenTruth: "The vanished sun was divided into laws of light. Reassembling those laws can restore daylight, but a complete sun would erase every life-form, memory, road, and mercy that adapted to the long dimming.",
  centralQuestion: "How much of a changed world may be destroyed in order to call the result restored?",
  moralLaw: "No faction is assigned good or evil. Every major power preserves something indispensable and commits something unforgivable.",
  playerPosition: "The player is a necessary witness rather than a chosen savior. Their alliances determine what the next age is permitted to remember.",
});

export const COSMIC_FACTIONS = deepFreeze([
  {
    id: "lucent_synod",
    name: "The Lucent Synod",
    alignment: "restoration",
    iconography: "Tall reliquary bodies, incomplete halos, veiled faces, white-gold cathedral metal, and light confined behind black glass.",
    publicDoctrine: "Return the First Light, end the long decay, and make the dead world habitable again.",
    indispensableTruth: "Without renewed light, harvests, births, maps, and ordinary time will eventually fail.",
    unforgivableMethod: "Its restoration liturgy burns away adaptive shadows, inherited memories, and dissent until the surviving world agrees with the Synod's definition of purity.",
    internalSchism: "One wing seeks a smaller mortal sun; another insists that an imperfect dawn is merely darkness wearing gold.",
    playerRelations: ["ally", "instrument", "heresy", "successor"],
  },
  {
    id: "charnel_night",
    name: "The Charnel Night",
    alignment: "opposition",
    iconography: "Impossible wet anatomy, door-like ribs, misplaced mouths, backward joints, black nacre, and halos made from negative space.",
    publicDoctrine: "Break every vessel of returning light before the restored sun makes the Late World extinct.",
    indispensableTruth: "Much of the Reach is alive only because darkness allowed it to become something daylight would reject.",
    unforgivableMethod: "Its princes cultivate terror, hunger, mutation, and grief because suffering creates the dense shadows in which their kind can endure.",
    internalSchism: "Some demons want permanent night; others want a negotiated dusk in which mortal life and altered life can both persist.",
    playerRelations: ["ally", "meal", "advocate", "jailer"],
  },
  {
    id: "league_of_remaining_hands",
    name: "The League of Remaining Hands",
    alignment: "mortal_continuity",
    iconography: "Repaired civic tools, many-faction cords, portable bells, ash ledgers, and lanterns with shutters on both sides.",
    publicDoctrine: "No god, angel, demon, crown, or prophecy may spend a living settlement without its informed consent.",
    indispensableTruth: "People who must survive the consequences understand costs that cosmic powers treat as abstractions.",
    unforgivableMethod: "The League bargains away isolated villages, dangerous minorities, and inconvenient truths when it believes the arithmetic protects a greater number.",
    internalSchism: "Local delegates disagree over whether survival without hope is governance or merely a slower form of surrender.",
    playerRelations: ["citizen", "mediator", "smuggler", "tyrant"],
  },
]);

const artPipeline = (family, overrides = {}) => ({
  family,
  conceptMaster: null,
  transparentCutout: null,
  staticModel: null,
  animatedModel: null,
  artStatus: "awaiting-art",
  staticModelStatus: "unassessed",
  animatedModelStatus: "unassessed",
  ...overrides,
});

export const EXPANSION_PRINCIPALS = deepFreeze([
  {
    id: "arch_lumen_seraphel_orr",
    name: "Arch-Lumen Seraphel Orr",
    epithet: "The Noon That Kneels",
    factionId: "lucent_synod",
    role: "Restoration commander and possible final ally",
    desire: "Rebuild a sun small enough to warm the Reach without judging it.",
    fear: "That mercy is only cowardice measured on a divine scale.",
    contradiction: "He protects altered villages from his own crusade, then quietly marks their children for purification if the full dawn succeeds.",
    secret: "The face behind his radiant funerary veil belongs to the first mortal he incinerated by accident.",
    voice: { cadence: "Grave, patient questions", imagery: "Architecture, heat, and legal witness", signature: "Asks permission immediately after making refusal impossible" },
    alignmentOptions: ["lucent_synod", "charnel_night", "league_of_remaining_hands"],
    visualBrief: "An eight-foot reliquary knight whose incomplete halo resembles a cathedral rose window missing one fatal pane; white-gold armor is beautiful at distance and scorched on every inward-facing surface.",
    questArcIds: ["main_noon_came_bleeding", "main_a_sun_small_enough"],
    pipeline: artPipeline("lucent_procession", {
      conceptMaster: "assets/characters/npcs/lucent-synod/arch-lumen-seraphel-orr-v1.png",
      artStatus: "accepted",
    }),
  },
  {
    id: "canoness_vael_kindly_knife",
    name: "Canoness Vael",
    epithet: "The Kindly Knife",
    factionId: "lucent_synod",
    role: "Healer, inquisitor, and designer of painless erasure",
    desire: "End every form of suffering she can identify.",
    fear: "Pain that carries meaning she has no right to remove.",
    contradiction: "She performs impossible cures, but considers grief, rebellion, and inconvenient identity to be diseases when they obstruct restoration.",
    secret: "She preserves each removed memory inside the surgical wings on her back and hears them plead whenever she sleeps.",
    voice: { cadence: "Tender bedside clarity", imagery: "Surgery, weather, and clean linen", signature: "Calls every threat a symptom" },
    alignmentOptions: ["lucent_synod", "charnel_night", "league_of_remaining_hands"],
    visualBrief: "Angelic surgeon in ivory cathedral plate with six narrow scalpel-wings folded like a devotional screen; serene porcelain veil, black seams, restrained dawn beneath the joints.",
    questArcIds: ["side_the_disease_called_grief", "faction_mercy_without_memory"],
    pipeline: artPipeline("lucent_procession", {
      conceptMaster: "assets/characters/npcs/lucent-synod/canoness-vael-kindly-knife-v2.png",
      artStatus: "accepted",
    }),
  },
  {
    id: "deacon_halix_bell_of_noon",
    name: "Deacon Halix",
    epithet: "Bell of Noon",
    factionId: "lucent_synod",
    role: "Herald whose voice temporarily restores natural law",
    desire: "Hear one true birdsong under an honest noon.",
    fear: "Silence, because it reveals that his proclamations are not answered by a god.",
    contradiction: "His miracles repair stone and flesh while stripping local names from everyone who hears the final note.",
    secret: "He was once a Bell Revenant and the Synod's light did not cure him; it only taught the memory inside him to preach.",
    voice: { cadence: "Liturgical proclamations interrupted by frightened whispers", imagery: "Bells, noon-lines, and nests", signature: "Repeats the listener's name until he forgets it" },
    alignmentOptions: ["lucent_synod", "charnel_night", "league_of_remaining_hands"],
    visualBrief: "A hovering bronze deacon with a vertical noon-slit through the torso, a mouthless bell helm, and two pale wings built from tuning forks rather than feathers.",
    questArcIds: ["main_the_bell_that_forgot_you"],
    pipeline: artPipeline("lucent_procession", {
      conceptMaster: "assets/characters/npcs/lucent-synod/deacon-halix-bell-of-noon-v2.png",
      artStatus: "accepted",
    }),
  },
  {
    id: "saint_vespera_second_shadow",
    name: "Saint Vespera",
    epithet: "Keeper of the Second Shadow",
    factionId: "lucent_synod",
    role: "Synod saint secretly maintaining a channel to the enemy",
    desire: "Prove that light and shadow can share one body without one becoming a prison.",
    fear: "That compromise is simply possession with better manners.",
    contradiction: "She shelters demons from extermination, but binds each refugee into her own shadow where none can leave without her consent.",
    secret: "Her ominous second shadow is not a demon; it is the mortal woman whose body the Synod used to construct the saint.",
    voice: { cadence: "Two interleaved sentences with different emotional temperatures", imagery: "Thresholds, silhouettes, and borrowed rooms", signature: "Answers moral questions once in light and once in shadow" },
    alignmentOptions: ["lucent_synod", "charnel_night", "league_of_remaining_hands"],
    visualBrief: "A tranquil veiled saint with an asymmetrical black-gold halo and a second articulated shadow standing half a gesture ahead; angelic silhouette made uneasy by too many locked shadow-doors.",
    questArcIds: ["main_the_saint_cast_two_shadows", "side_room_inside_a_shadow"],
    pipeline: artPipeline("lucent_procession", {
      conceptMaster: "assets/characters/npcs/lucent-synod/saint-vespera-second-shadow-v3.png",
      artStatus: "accepted",
    }),
  },
  {
    id: "mother_nacre_open_rib",
    name: "Mother Nacre",
    epithet: "The Open Rib",
    factionId: "charnel_night",
    role: "Demon matriarch and keeper of altered refugees",
    desire: "Preserve every life-form the returning sun would classify as an error.",
    fear: "That protection and possession have become the same instinct inside her.",
    contradiction: "She gives sanctuary to the hunted, but grafts a door from her own ribs into each guest so she can summon them home by force.",
    secret: "The sanctuary inside her is a real village whose residents have never been told that centuries passed outside.",
    voice: { cadence: "Maternal endearments followed by anatomical imperatives", imagery: "Rooms, milk, hinges, and weather under skin", signature: "Refers to captivity as coming indoors" },
    alignmentOptions: ["charnel_night", "lucent_synod", "league_of_remaining_hands"],
    visualBrief: "A colossal black-nacre maternal horror with an open rib cage shaped as a lit village doorway; too many sheltering arms fold backward into load-bearing arches.",
    questArcIds: ["main_the_door_in_mothers_rib", "faction_sanctuary_has_teeth"],
    pipeline: artPipeline("charnel_princes", {
      conceptMaster: "assets/characters/npcs/charnel-princes/mother-nacre-open-rib-v1.png",
      artStatus: "accepted",
    }),
  },
  {
    id: "prince_thirteen_throats",
    name: "The Prince of Thirteen Throats",
    epithet: "Choir of the Unswallowed",
    factionId: "charnel_night",
    role: "Demonic diplomat and collector of surrendered voices",
    desire: "Create a treaty no single voice can dominate.",
    fear: "Speaking in his original voice and discovering it still commands the others.",
    contradiction: "He represents silenced peoples faithfully because he removed and consumed their voices to do it.",
    secret: "Only twelve throats are stolen; the thirteenth belongs to the vanished sun and knows the Synod's true name.",
    voice: { cadence: "Thirteen alternating registers with one deliberate rest", imagery: "Appetite, parliament, and resonance", signature: "Votes on his own sentences before finishing them" },
    alignmentOptions: ["charnel_night", "lucent_synod", "league_of_remaining_hands"],
    visualBrief: "A tall, almost regal absence ringed by exactly thirteen wet throat apertures, each carried on a separate jointed collar; no ordinary head, one restrained black halo shaped like a voting circle.",
    questArcIds: ["main_parliament_of_one_mouth", "side_the_thirteenth_vote"],
    pipeline: artPipeline("charnel_princes", {
      conceptMaster: "assets/characters/npcs/charnel-princes/prince-thirteen-throats-v1.png",
      artStatus: "accepted",
    }),
  },
  {
    id: "wound_scribe_keth",
    name: "Wound-Scribe Keth",
    epithet: "Historian of What Hurt",
    factionId: "charnel_night",
    role: "Archivist who records history as reversible injuries",
    desire: "Prevent victors from making pain disappear from the record.",
    fear: "A history remembered only for wounds becoming unable to imagine healing.",
    contradiction: "Keth can return stolen memories, but only by reopening their original harm in another willing body.",
    secret: "The oldest wound in the archive proves mortals helped dismantle the sun voluntarily.",
    voice: { cadence: "Exact archival clauses", imagery: "Margins, scars, witnesses, and dates without numbers", signature: "Asks where a fact should hurt before stating it" },
    alignmentOptions: ["charnel_night", "lucent_synod", "league_of_remaining_hands"],
    visualBrief: "A low many-jointed demon made from folded scar tissue and black quills, with no blood; injuries open as clean page-like layers containing moving relief instead of text.",
    questArcIds: ["main_archive_of_open_wounds"],
    pipeline: artPipeline("charnel_princes", {
      conceptMaster: "assets/characters/npcs/charnel-princes/wound-scribe-keth-v1.png",
      artStatus: "accepted",
    }),
  },
  {
    id: "maw_behind_mercy",
    name: "The Maw Behind Mercy",
    epithet: "Last Hunger of the Unmade",
    factionId: "charnel_night",
    role: "Ancient enemy weapon that has learned restraint",
    desire: "Be trusted with something fragile without eventually eating it.",
    fear: "That hunger is the only honest law left in the world.",
    contradiction: "It has spared entire settlements and devoured every person who later tried to turn that mercy into worship.",
    secret: "Its limitless interior contains the missing dark half of the First Light, making it both the Synod's enemy and the only vessel capable of completing the sun.",
    voice: { cadence: "One quiet sentence from many distant depths", imagery: "Hunger, trust, vessels, and promises", signature: "Offers the listener a safe place inside itself" },
    alignmentOptions: ["charnel_night", "lucent_synod", "league_of_remaining_hands"],
    visualBrief: "An enormous restrained silhouette whose body is the edge around a single impossible mouth; cathedral-scale teeth remain sheathed behind layers of mourning cloth and closed hand-like ribs.",
    questArcIds: ["main_mercy_has_a_mouth", "main_a_sun_small_enough"],
    pipeline: artPipeline("charnel_princes", {
      conceptMaster: "assets/characters/npcs/charnel-princes/maw-behind-mercy-v1.png",
      artStatus: "accepted",
    }),
  },
  {
    id: "enoch_last_lamplighter",
    name: "Enoch Vale",
    epithet: "The Last Lamplighter",
    factionId: "league_of_remaining_hands",
    role: "Mortal organizer of roads between cosmic front lines",
    desire: "Keep one ordinary evening routine alive long enough to outlast prophecy.",
    fear: "Becoming important enough that strangers die for his decisions.",
    contradiction: "He refuses cosmic sacrifice in public while maintaining a private list of settlements he would abandon first.",
    secret: "His plain oil lamp contains a captive Synod intelligence that advises him with perfect, merciless forecasts.",
    voice: { cadence: "Dry practical instructions", imagery: "Wicks, ladders, rain, and municipal budgets", signature: "Interrupts apocalyptic speeches to discuss maintenance" },
    alignmentOptions: ["league_of_remaining_hands", "lucent_synod", "charnel_night"],
    visualBrief: "Weathered civic lamplighter carrying a ladder-staff and shuttered black lantern; entirely mortal silhouette, except six thin angelic fingers occasionally press against the lamp glass from within.",
    questArcIds: ["side_seven_lamps_for_six_streets", "faction_the_abandonment_list"],
    pipeline: artPipeline("remaining_hands", {
      conceptMaster: "assets/characters/npcs/remaining-hands/enoch-last-lamplighter-v1.png",
      artStatus: "accepted",
    }),
  },
  {
    id: "sister_calve_unlit_hospice",
    name: "Sister Calve",
    epithet: "Mistress of the Unlit Hospice",
    factionId: "league_of_remaining_hands",
    role: "Physician treating angelic purification and demonic adaptation alike",
    desire: "Make care independent from innocence.",
    fear: "That triage will train her to mistake efficiency for justice.",
    contradiction: "She treats any wounded being, but sells tomorrow's patient order to whichever faction supplies medicine today.",
    secret: "Her hospice is slowly becoming a new neutral organism assembled from discarded angel and demon tissue.",
    voice: { cadence: "Tired clinical brevity warmed by unexpected jokes", imagery: "Beds, queues, broth, and borrowed organs", signature: "Diagnoses ideologies as if they were fevers" },
    alignmentOptions: ["league_of_remaining_hands", "lucent_synod", "charnel_night"],
    visualBrief: "Mortal field surgeon in layered gray hospice cloth, bearing one sealed gold wing splint and one black-nacre rib brace as tools rather than trophies.",
    questArcIds: ["side_the_hospice_grows_a_heart"],
    pipeline: artPipeline("remaining_hands", {
      conceptMaster: "assets/characters/npcs/remaining-hands/sister-calve-unlit-hospice-v1.png",
      artStatus: "accepted",
    }),
  },
  {
    id: "tor_vannic_defector_of_dawn",
    name: "Tor Vannic",
    epithet: "Defector of Dawn",
    factionId: "league_of_remaining_hands",
    role: "Former Synod engineer who knows how to wound laws of light",
    desire: "Build a sunrise with an off switch.",
    fear: "That every safeguard is simply a better weapon waiting for an owner.",
    contradiction: "He deserted to prevent divine authoritarianism, yet compulsively designs systems only he can control.",
    secret: "He sabotaged the first restoration and the resulting dusk killed an entire migration he meant to save.",
    voice: { cadence: "Technical fragments and unfinished apologies", imagery: "Valves, shutters, proofs, and burn patterns", signature: "Labels moral choices as failure modes" },
    alignmentOptions: ["league_of_remaining_hands", "lucent_synod", "charnel_night"],
    visualBrief: "Mortal engineer in scorched ceremonial under-armor with a dismantled halo worn as a tool harness; one eye reflects dawn, the other retains natural darkness.",
    questArcIds: ["main_the_engine_with_an_off_switch"],
    pipeline: artPipeline("remaining_hands", {
      conceptMaster: "assets/characters/npcs/remaining-hands/tor-vannic-defector-of-dawn-v1.png",
      artStatus: "accepted",
    }),
  },
  {
    id: "king_ash_without_country",
    name: "The King of Ash Without a Country",
    epithet: "Custodian of Unchosen Endings",
    factionId: "league_of_remaining_hands",
    role: "Neutral claimant who carries legal endings for destroyed places",
    desire: "Give every vanished settlement the right to refuse posthumous use by either cosmic faction.",
    fear: "That the dead have become a convenient electorate only he can interpret.",
    contradiction: "He protects extinct communities from exploitation while ruling in their names without any living consent.",
    secret: "His ash crown contains one surviving citizen from each lost place, awake and unable to agree on his legitimacy.",
    voice: { cadence: "Ceremonial petitions answered by muttering plural asides", imagery: "Borders, ashes, seals, and empty chairs", signature: "Uses 'we' and then disputes himself" },
    alignmentOptions: ["league_of_remaining_hands", "lucent_synod", "charnel_night"],
    visualBrief: "A narrow mortal regent under an oversized floating ash crown composed of many broken civic seals; his plain dark coat is surrounded by empty chair-shaped negative spaces.",
    questArcIds: ["side_the_dead_vote_no"],
    pipeline: artPipeline("remaining_hands", {
      conceptMaster: "assets/characters/npcs/remaining-hands/king-ash-without-country-v1.png",
      artStatus: "accepted",
    }),
  },
]);

// Every admitted quest owns at least one supporting character who appears in
// no other quest. Recurring principals may carry long arcs, but the people who
// make a local dilemma concrete cannot be renamed scenery or recycled quest
// furniture. These records use the same art/model pipeline as the principals.
export const QUEST_SUPPORT_CHARACTERS = deepFreeze([
  {
    id: "nima_sorn_keeper_of_one_shadow",
    name: "Nima Sorn",
    epithet: "Keeper of One Shadow",
    factionId: "league_of_remaining_hands",
    role: "Hearthmere shade-cart engineer and elected witness for the shadowless",
    desire: "Keep the bleeding noon open long enough to rebuild the homes it is repairing.",
    fear: "That closing the miracle will prove ruined houses mattered more to her than displaced people.",
    contradiction: "She protects neighbors from daylight while secretly feeding the wound measurements that could make it permanent.",
    secret: "The single shadow pinned beneath her cart belongs to her missing daughter, and it points toward the Synod procession each noon.",
    voice: { cadence: "Fast practical clauses that stop before personal admissions", imagery: "Canvas, axle heat, property lines, and shade", signature: "Measures miracles in minutes of safe exposure" },
    alignmentOptions: ["league_of_remaining_hands", "lucent_synod", "charnel_night"],
    visualBrief: "A soot-marked mortal engineer under an articulated black shade canopy, with one carefully pinned child-sized shadow and brass daylight gauges built into the cart harness.",
    questArcIds: ["main_noon_came_bleeding"],
    pipeline: artPipeline("remaining_hands", {
      conceptMaster: "assets/characters/npcs/remaining-hands/nima-sorn-keeper-of-one-shadow-v1.png",
      artStatus: "accepted",
    }),
  },
  {
    id: "ilar_rook_unhoused_shadow",
    name: "Ilar Rook",
    epithet: "The Unhoused Shadow",
    factionId: "charnel_night",
    role: "Refugee living inside Vespera's second shadow and witness to its crimes",
    desire: "Open Vespera's shadow sanctuary without exposing its inhabitants to Synod judgment.",
    fear: "That freedom will dissolve the borrowed darkness holding his altered body together.",
    contradiction: "He demands an exit from captivity while sabotaging every door that other refugees might choose first.",
    secret: "He ordered one of the executions attributed to Vespera's shadow and allowed the saint to carry the blame.",
    voice: { cadence: "Whispered legal testimony interrupted by spatial directions", imagery: "Leases, door seams, silhouettes, and borrowed rooms", signature: "States where he is standing before stating what he believes" },
    alignmentOptions: ["charnel_night", "lucent_synod", "league_of_remaining_hands"],
    visualBrief: "A nearly two-dimensional black-nacre refugee unfolded from a doorway-shaped shadow, with a mortal brass tenancy seal embedded where a sternum would be.",
    questArcIds: ["main_the_saint_cast_two_shadows"],
    pipeline: artPipeline("charnel_households", {
      conceptMaster: "assets/characters/npcs/charnel-households/ilar-rook-unhoused-shadow-v1.png",
      artStatus: "accepted",
    }),
  },
  {
    id: "oren_lusk_last_calendarer",
    name: "Oren Lusk",
    epithet: "The Last Calendarer",
    factionId: "league_of_remaining_hands",
    role: "Keeper of three stopped village calendars and Halix's last remembered friend",
    desire: "Restore seasons before the villages lose the ability to plant children, crops, or funerals in time.",
    fear: "Being selected as the relationship whose erasure pays for the final toll.",
    contradiction: "He asks the player to spend a bond for thousands of lives, then falsifies the ledger so his own bond appears indispensable.",
    secret: "Halix once loved him; the Deacon repeats Oren's name because it is the only one the noon-bell has not yet consumed.",
    voice: { cadence: "Exact dates followed by evasive personal tense", imagery: "Seed moons, birthdays, frost debt, and blank squares", signature: "Corrects when an event happened even while denying that it happened" },
    alignmentOptions: ["league_of_remaining_hands", "lucent_synod", "charnel_night"],
    visualBrief: "An elderly calendar keeper in layered seed-paper robes carrying three unsynchronized wheel calendars, one of which has his own face carefully scraped from every date.",
    questArcIds: ["main_the_bell_that_forgot_you"],
    pipeline: artPipeline("remaining_hands", {
      conceptMaster: "assets/characters/npcs/remaining-hands/oren-lusk-last-calendarer-v1.png",
      artStatus: "accepted",
    }),
  },
  {
    id: "ilyen_doorborn_outer_age",
    name: "Ilyen Doorborn",
    epithet: "Speaker for the Outer Age",
    factionId: "charnel_night",
    role: "Elected speaker of the village inside Mother Nacre",
    desire: "Let every resident decide whether to enter a world centuries older than the one they remember.",
    fear: "Learning that the outside no longer contains anyone capable of remembering them.",
    contradiction: "She demands informed consent while rationing the most frightening facts until after the village vote.",
    secret: "She was born from Nacre's own tissue and may be the sanctuary's organ rather than its prisoner.",
    voice: { cadence: "Civic minutes spoken with intimate maternal warmth", imagery: "Door weather, generations, hinges, and inherited rooms", signature: "Calls every uncertainty a fact not yet given a chair" },
    alignmentOptions: ["charnel_night", "league_of_remaining_hands", "lucent_synod"],
    visualBrief: "A composed dark-skinned village delegate with a small rib-door growing through her formal coat, its inner lintel marked by generations of hand-height scratches.",
    questArcIds: ["main_the_door_in_mothers_rib"],
    pipeline: artPipeline("charnel_households", {
      conceptMaster: "assets/characters/npcs/charnel-households/ilyen-doorborn-outer-age-v1.png",
      artStatus: "accepted",
    }),
  },
  {
    id: "sava_quiet_thirteenth_auditor",
    name: "Sava Quiet",
    epithet: "Auditor of the Thirteenth Rest",
    factionId: "league_of_remaining_hands",
    role: "Mute treaty auditor who can distinguish consent from perfect imitation",
    desire: "Prove which of the Prince's voices can still refuse the mouth that represents them.",
    fear: "That fluent speech will always be believed over her deliberate silence.",
    contradiction: "She defends stolen voices while keeping their private ballots in a cipher only she controls.",
    secret: "Her missing voice is not inside the Prince; she surrendered it to the vanished sun in exchange for hearing unspoken votes.",
    voice: { cadence: "Signed clauses followed by one written dissent", imagery: "Quorums, breath, empty beats, and sealed envelopes", signature: "Leaves the decisive sentence physically unfinished for another person to complete" },
    alignmentOptions: ["league_of_remaining_hands", "charnel_night", "lucent_synod"],
    visualBrief: "A mute mortal auditor with thirteen jointed ballot sleeves around one arm and a blank porcelain throat seal; her hands remain completely visible for signing.",
    questArcIds: ["main_parliament_of_one_mouth"],
    pipeline: artPipeline("remaining_hands"),
  },
  {
    id: "mira_drel_bearer_of_margin_four",
    name: "Mira Drel",
    epithet: "Bearer of Margin Four",
    factionId: "league_of_remaining_hands",
    role: "Volunteer witness carrying the most disputed wound in Keth's archive",
    desire: "Publish proof that her ancestors chose the dimming rather than merely suffering it.",
    fear: "That the pain will make a false memory feel morally undeniable.",
    contradiction: "She insists history must hurt somebody, but recruits poorer witnesses to carry every wound except her own.",
    secret: "Margin Four records no vote at all; Keth filled the absence with an injury shaped like consent.",
    voice: { cadence: "Scholarly qualifications collapsing into physical sensation", imagery: "Margins, scar color, witnesses, and missing verbs", signature: "Distinguishes what the record says from what the wound makes her believe" },
    alignmentOptions: ["league_of_remaining_hands", "charnel_night", "lucent_synod"],
    visualBrief: "A young archive scholar in ink-gray wraps with one reversible luminous scar margin held open by four small black-nacre braces, never gory or exposed.",
    questArcIds: ["main_archive_of_open_wounds"],
    pipeline: artPipeline("remaining_hands"),
  },
  {
    id: "fenn_vargo_counter_of_teeth",
    name: "Fenn Vargo",
    epithet: "Counter of Teeth",
    factionId: "league_of_remaining_hands",
    role: "Expedition provisioner who measures the Maw's restraint",
    desire: "Bring the entire party through the Maw without offering it a living memory.",
    fear: "That hunger is the only honest promise any creature makes.",
    contradiction: "He rejects sacrificial feeding while carrying one condemned prisoner's memory as an emergency ration.",
    secret: "The ration contains his own childhood under another name; he sentenced that former self so the adult could claim innocence.",
    voice: { cadence: "Dry inventory counts punctured by superstitious jokes", imagery: "Portions, teeth, knots, and empty bowls", signature: "Counts everyone again whenever mercy is mentioned" },
    alignmentOptions: ["league_of_remaining_hands", "charnel_night", "lucent_synod"],
    visualBrief: "A lean route provisioner wearing a nonfunctional ring of individually numbered tooth-shaped measuring tags and one sealed black ration reliquary at the hip.",
    questArcIds: ["main_mercy_has_a_mouth"],
    pipeline: artPipeline("remaining_hands"),
  },
  {
    id: "pella_vein_keeper_of_last_failure",
    name: "Pella Vein",
    epithet: "Keeper of the Last Failure",
    factionId: "league_of_remaining_hands",
    role: "Dawn-engine stress tester and survivor of Tor's first sabotage",
    desire: "Make every shutdown design fail safely in the hands of somebody malicious.",
    fear: "That safety tests teach the next tyrant exactly how to bypass them.",
    contradiction: "She demands distributed control while hiding a private physical override in her prosthetic hand.",
    secret: "Tor's failed dusk did not take her hand; she removed it later so somebody would always carry visible evidence against him.",
    voice: { cadence: "Adversarial questions followed by blunt failure reports", imagery: "Fuses, vetoes, burn paths, and hands on levers", signature: "Asks who profits when a safeguard works as designed" },
    alignmentOptions: ["league_of_remaining_hands", "lucent_synod", "charnel_night"],
    visualBrief: "A compact mortal test engineer in heat-blackened apron armor, with one transparent ceramic hand displaying a mechanical override path and three deliberately mismatched safety keys.",
    questArcIds: ["main_the_engine_with_an_off_switch"],
    pipeline: artPipeline("remaining_hands"),
  },
  {
    id: "solenne_marrow_child_of_both_skies",
    name: "Solenne Marrow",
    epithet: "Child of Both Skies",
    factionId: "league_of_remaining_hands",
    role: "Adapted adolescent whose body models mutually incompatible daylight laws",
    desire: "Reach one adulthood that neither light nor darkness has already defined for her.",
    fear: "Becoming the sympathetic example every faction uses to spend less visible lives.",
    contradiction: "She refuses to represent altered children while negotiating privileges that only her public symbolism can win.",
    secret: "Her bones cast daylight and her skin casts darkness; separating them would create two viable people with the same memories.",
    voice: { cadence: "Impatient concrete questions that expose ceremonial euphemism", imagery: "Schoolwork, growing pains, weather, and two shadows", signature: "Asks whether a cosmic law would still sound noble if assigned as homework" },
    alignmentOptions: ["league_of_remaining_hands", "lucent_synod", "charnel_night"],
    visualBrief: "A plainly dressed adolescent with a restrained pale skeletal shadow falling one way and a soft dark skin shadow falling another; no chosen-one regalia or cute proportions.",
    questArcIds: ["main_a_sun_small_enough"],
    pipeline: artPipeline("remaining_hands"),
  },
  {
    id: "davren_holt_widower_of_unrecorded_wife",
    name: "Davren Holt",
    epithet: "Widower of the Unrecorded Wife",
    factionId: "league_of_remaining_hands",
    role: "Hospice patient whose grief is the last evidence of an erased marriage",
    desire: "Work, sleep, and speak without losing the pain that proves his wife existed.",
    fear: "That refusing treatment makes her memory responsible for destroying him.",
    contradiction: "He calls grief sacred while begging Vael to remove only the parts that inconvenience other people.",
    secret: "His wife asked to be forgotten before she died, and the grief he protects may violate her final consent.",
    voice: { cadence: "Careful domestic detail followed by sudden missing nouns", imagery: "Two cups, folded sleeves, bread crusts, and an empty side of bed", signature: "Describes his wife through effects because her name no longer survives" },
    alignmentOptions: ["league_of_remaining_hands", "lucent_synod", "charnel_night"],
    visualBrief: "A tired middle-aged hospice patient in repaired work clothes, carrying one empty sleeve-shaped memory impression stitched to his chest with ordinary red thread.",
    questArcIds: ["side_the_disease_called_grief"],
    pipeline: artPipeline("remaining_hands"),
  },
  {
    id: "roa_nullstreet_seventh_tenant",
    name: "Roa Nullstreet",
    epithet: "The Seventh Tenant",
    factionId: "league_of_remaining_hands",
    role: "Delegate for households omitted from Hearthmere's maps and rations",
    desire: "Make the hidden street count without making its residents easy to tax, conscript, or purge.",
    fear: "That official recognition is simply a better-addressed form of capture.",
    contradiction: "She demands civic representation while forging departures for residents who vote against remaining hidden.",
    secret: "The street is absent because Roa feeds its address to an Unwritten Road each census night.",
    voice: { cadence: "Neighborly gossip arranged like a legal brief", imagery: "Door numbers, soup shares, lamp oil, and erased chalk", signature: "Names every household except her own" },
    alignmentOptions: ["league_of_remaining_hands", "charnel_night", "lucent_synod"],
    visualBrief: "A street delegate in patched municipal blue with seven mismatched lamp keys and a coat hem whose stitched address becomes blank when viewed directly.",
    questArcIds: ["side_seven_lamps_for_six_streets"],
    pipeline: artPipeline("remaining_hands"),
  },
  {
    id: "bek_tallow_patient_zero_of_policy",
    name: "Bek Tallow",
    epithet: "Patient Zero of Policy",
    factionId: "league_of_remaining_hands",
    role: "Hospice bed clerk repeatedly deprioritized by the living heart",
    desire: "Make the hospice state its values aloud so patients can challenge them.",
    fear: "That a transparent bias will still place him last and merely feel more legitimate.",
    contradiction: "He opposes predictive triage while secretly altering patient records to protect people he personally likes.",
    secret: "The hospice heart grew from tissue he donated, so its prejudices may be his own unspoken rankings amplified into architecture.",
    voice: { cadence: "Queue numbers delivered as mordant comedy", imagery: "Beds, broth temperature, ledgers, and heartbeats", signature: "Introduces himself by his current place in line" },
    alignmentOptions: ["league_of_remaining_hands", "lucent_synod", "charnel_night"],
    visualBrief: "A gaunt bed clerk with a reversible numbered apron, a small healed donation seam over the sternum, and a portable board of patient tokens that subtly reorder themselves.",
    questArcIds: ["side_the_hospice_grows_a_heart"],
    pipeline: artPipeline("remaining_hands"),
  },
  {
    id: "eri_cinderglass_descendant_in_dispute",
    name: "Eri Cinderglass",
    epithet: "Descendant in Dispute",
    factionId: "league_of_remaining_hands",
    role: "Living claimant contesting the King's authority to speak for extinct settlements",
    desire: "Use ancestral land to shelter living refugees even if the dead explicitly refused future occupation.",
    fear: "That honoring the dead can become a refined excuse for abandoning the living.",
    contradiction: "She attacks posthumous rule while grounding her own claim entirely in blood descent.",
    secret: "Her lineage seal was purchased from a Grave Tithe runner; she belongs to the lost country by commitment, not ancestry.",
    voice: { cadence: "Unsparing civic argument softened around individual names", imagery: "Keys, vacant fields, inheritance, and warm roofs", signature: "Asks every dead principle where a living child should sleep tonight" },
    alignmentOptions: ["league_of_remaining_hands", "charnel_night", "lucent_synod"],
    visualBrief: "A practical refugee organizer in ash-proof traveling layers, carrying one cracked glass lineage seal and a ring of newly cut shelter keys that do not match any surviving door.",
    questArcIds: ["side_the_dead_vote_no"],
    pipeline: artPipeline("remaining_hands"),
  },
  {
    id: "mara_quoin_counter_deed",
    name: "Mara Quoin",
    epithet: "Counter-Deed Locksmith",
    factionId: "league_of_remaining_hands",
    role: "Municipal locksmith and unrecognized heir to a noon-restored house",
    desire: "Protect the present tenants without turning her inheritance into their eviction notice.",
    fear: "That accepting her own history will give the dead deed more authority than the family now living there.",
    contradiction: "She treats daily use as the only honest title while hiding the forged deed that once made the tenants' use legally possible.",
    secret: "Mara falsified the deed that saved the current family and is the previous household's unrecognized daughter.",
    voice: { cadence: "Patient clauses tested like loaded beams", imagery: "Hinges, repairs, lintels, and rooms under weight", signature: "Never says own; names who repaired, slept, fled, inherited, and was admitted" },
    alignmentOptions: ["league_of_remaining_hands", "lucent_synod", "charnel_night"],
    visualBrief: "Locksmith in layered tenant coats; a different obsolete door hinge replaces each knuckle, with no heraldic title or weapon.",
    questArcIds: ["aftermath_house_outlived_tenants"],
    pipeline: artPipeline("remaining_hands"),
  },
  {
    id: "kessa_pale_absence_clerk",
    name: "Kessa Pale",
    epithet: "Clerk of the Absent Queue",
    factionId: "league_of_remaining_hands",
    role: "Census clerk whose separated shadow has different standing than her body",
    desire: "Give absences representation without pretending each belongs to the nearest visible person.",
    fear: "Discovering that her erased shadow held politics and loyalties she would now oppose.",
    contradiction: "She demands auditable population totals while having counted erased shadows as dependants to divert food into an unregistered street.",
    secret: "Kessa used the historic-erasure ledger to feed Nullstreet and cannot prove which recorded dependant was once her own shadow.",
    voice: { cadence: "Pointed arithmetic with no unsupported pronouns", imagery: "Queues, lamp angles, ration shares, and missing totals", signature: "Answers identity questions only by adding or subtracting someone she can physically point to" },
    alignmentOptions: ["league_of_remaining_hands", "charnel_night", "lucent_synod"],
    visualBrief: "Ink-stained census clerk whose body casts no shadow; carries a blank roll that darkens around exclusions.",
    questArcIds: ["aftermath_census_of_absences"],
    pipeline: artPipeline("remaining_hands"),
  },
  {
    id: "roen_fitch_dusk_gardener",
    name: "Roen Fitch",
    epithet: "The Dusk Gardener",
    factionId: "lucent_synod",
    role: "Former Synod gardener cultivating a civic purity mark on his child",
    desire: "Make the restoration bloom controllable without destroying the adaptation protecting his child's lungs.",
    fear: "That removal will kill her and cultivation will make her the legal source of an invasive divine law.",
    contradiction: "He condemns purity as colonial husbandry while secretly domesticating it to prove a family can own what was imposed on them.",
    secret: "Roen planted the ward's first bloom and let the Synod believe it propagated spontaneously.",
    voice: { cadence: "Horticultural diagnoses sharpened into property questions", imagery: "Grafts, seed corridors, breath, and inherited soil", signature: "Never asks whether a bloom is healthy; asks who may reproduce it and who answers for it" },
    alignmentOptions: ["lucent_synod", "league_of_remaining_hands", "charnel_night"],
    visualBrief: "Former cathedral gardener with one controlled purity bloom grafted behind a smoked-glass respirator.",
    questArcIds: ["aftermath_purity_blooms_at_dusk"],
    pipeline: artPipeline("lucent_procession"),
  },
  {
    id: "hobb_marr_shade_driver",
    name: "Hobb Marr",
    epithet: "Driver of the Stationary Office",
    factionId: "league_of_remaining_hands",
    role: "Shade-cart driver elected by neighborhoods his route never served",
    desire: "Have shade recognized as a public service without becoming its sole human veto.",
    fear: "That every precedent will turn one driver's private guilt into permanent civic law.",
    contradiction: "He demands that policy name who waits longer, but schedules his estranged son's street only while the boy sleeps.",
    secret: "Hobb has preserved an unofficial stop for his son while denying that personal routes belong on the public docket.",
    voice: { cadence: "Road-practical timings and hard stops", imagery: "Turn radii, axle weight, waiting lines, and missed hours", signature: "Rejects abstract fairness until the speaker names the person made to wait longer" },
    alignmentOptions: ["league_of_remaining_hands", "lucent_synod", "charnel_night"],
    visualBrief: "Municipal driver in patched road leathers, permanently leaning into a wheel that is no longer attached.",
    questArcIds: ["aftermath_cart_accepts_office"],
    pipeline: artPipeline("remaining_hands"),
  },
  {
    id: "tima_vale_twice_born",
    name: "Tima Vale Twice-Born",
    epithet: "The Sixteen-Year Ancestor",
    factionId: "charnel_night",
    role: "Sanctuary resident who is a child by body and ancestor to Hearthmere's oldest family",
    desire: "Build kinship with descendants without accepting command over them or becoming their sacred child.",
    fear: "That age and lineage will let either side convert affection into custody.",
    contradiction: "She refuses ancestral rule while concealing that she once ordered Mother Nacre's door closed on the line she now disclaims.",
    secret: "Tima remembers giving the closure order that suspended her village and made later descendants decide in her absence.",
    voice: { cadence: "Domestic comparisons between incompatible centuries", imagery: "Meals, graves, hand-me-downs, and unfinished childhoods", signature: "Separates older than me, born after me, and responsible for me; never uses elder as a shortcut" },
    alignmentOptions: ["charnel_night", "league_of_remaining_hands", "lucent_synod"],
    visualBrief: "Sixteen-year-old ancestor wearing domestic objects from three centuries as unresolved inheritance, without royal or child-savior styling.",
    questArcIds: ["aftermath_village_arrives_before_dead"],
    pipeline: artPipeline("charnel_households"),
  },
  {
    id: "parn_exit_law",
    name: "Parn Exit-Law",
    epithet: "Prosecutor of Revocable Doors",
    factionId: "charnel_night",
    role: "Sanctuary jurist born with a rib door that opens only outward",
    desire: "Test revocation in real danger so consent cannot remain a decorative promise.",
    fear: "That the right to leave disappears exactly when protection becomes necessary.",
    contradiction: "He prosecutes Mother's summons on behalf of people who hear them, while secretly being unable to hear the summons himself.",
    secret: "Parn's bodily door is exempt from Mother's call, so he has never personally borne the compulsion whose rules he authors.",
    voice: { cadence: "Affection restated as permissions and procedures", imagery: "Latches, weather, hinges, and named exit costs", signature: "Accepts no promise unless its revocation procedure is spoken in the same breath" },
    alignmentOptions: ["charnel_night", "league_of_remaining_hands", "lucent_synod"],
    visualBrief: "Young jurist with one small outward-opening rib door and garments fastened entirely by revocable latches.",
    questArcIds: ["aftermath_every_door_mothers_voice"],
    pipeline: artPipeline("charnel_households"),
  },
  {
    id: "orra_rain_in_ribs",
    name: "Orra Rain-in-Ribs",
    epithet: "Roofer of the Borrowed Sky",
    factionId: "charnel_night",
    role: "Sanctuary roofer whose lungs forecast weather inside Mother Nacre",
    desire: "Keep the village safe outside without replacing Mother's body with another unaccountable shelter.",
    fear: "Ordinary sky, because no one can open it from within and repair the leak.",
    contradiction: "She insists weather must name who paid for it while secretly causing storms whenever residents discuss permanent departure.",
    secret: "Orra's forecast lungs are also pressure valves she has used to make departure seem more dangerous than it was.",
    voice: { cadence: "Compressed diagnoses following the path of a leak", imagery: "Pressure, rafters, drought, and ribs that bear weather", signature: "Never calls weather natural; names who stands under it and who paid for it" },
    alignmentOptions: ["charnel_night", "league_of_remaining_hands", "lucent_synod"],
    visualBrief: "Roofer with two translucent forecast lungs and folding eave tools grown from shoulder ribs.",
    questArcIds: ["aftermath_roof_made_of_weather"],
    pipeline: artPipeline("charnel_households"),
  },
  {
    id: "pell_nacreyear_road_witness",
    name: "Pell Nacreyear",
    epithet: "The Road's Older Child",
    factionId: "league_of_remaining_hands",
    role: "Last child born before the sanctuary closed and sole witness to its forgotten road",
    desire: "Have the vanished road recognized as a person rather than be forced to replace its testimony.",
    fear: "That remembering the route will give Mother Nacre a path to everyone who escaped.",
    contradiction: "Pell demands that roads retain moral agency while having taught this road to deny the village for its own protection.",
    secret: "Pell deliberately taught the road to forget the sanctuary so Mother could not follow the first escapees.",
    voice: { cadence: "Directions spoken as reciprocal obligations", imagery: "Turns, birthdays, promises, and inherited distance", signature: "Never uses compass directions; navigates by promises kept, broken, and inherited" },
    alignmentOptions: ["league_of_remaining_hands", "charnel_night", "lucent_synod"],
    visualBrief: "Child-sized elder whose limbs bend into remembered turns; no map, compass, travel pack, or cute adventurer silhouette.",
    questArcIds: ["aftermath_child_older_than_road"],
    pipeline: artPipeline("remaining_hands"),
  },
  {
    id: "gannet_triune_veto_clerk",
    name: "Gannet Triune",
    epithet: "Clerk of Three Continuities",
    factionId: "league_of_remaining_hands",
    role: "Survivor of a town whose three councils must agree before opening a well",
    desire: "Preserve distributed veto without letting disagreement become fatal paralysis.",
    fear: "That an authority will manufacture emergencies merely to bypass consent.",
    contradiction: "He requires every continuity claim to survive three councils, but forged unanimity during a famine and saved his town.",
    secret: "Gannet authored all three famine votes in different hands and still does not know whether the act was legitimate.",
    voice: { cadence: "Three council clauses followed by one private conclusion", imagery: "Wells, gloves, levers, and institutions surviving their names", signature: "Refuses continuity as a noun; makes every claimant state what persists, changed, and carries harm" },
    alignmentOptions: ["league_of_remaining_hands", "lucent_synod", "charnel_night"],
    visualBrief: "Civic clerk with three mismatched lever gloves and three council cords knotted at different tensions.",
    questArcIds: ["aftermath_three_hands_one_lever"],
    pipeline: artPipeline("remaining_hands"),
  },
  {
    id: "meret_spall_night_engineer",
    name: "Meret Spall",
    epithet: "Engineer of the Service Dark",
    factionId: "league_of_remaining_hands",
    role: "Night-shift dawn engineer whose skin calcifies under daylight",
    desire: "Make maintenance ordinary enough that a pause in a miracle is not prosecuted as sabotage.",
    fear: "That known harm will be renamed an emergency until altered workers are permanently excluded.",
    contradiction: "She demands public service intervals while secretly extending one shutdown to give workers like her private access.",
    secret: "Meret falsified the last restart time so altered technicians could inspect the engine without daylight exposure.",
    voice: { cadence: "Service intervals and acceptable degradation stated without ceremony", imagery: "Shutters, minutes, dependencies, and calcified seams", signature: "Will not call any consequence an emergency if it was known before the schedule was approved" },
    alignmentOptions: ["league_of_remaining_hands", "charnel_night", "lucent_synod"],
    visualBrief: "Calcified night engineer with seven shuttered service lamps embedded along a protective work coat.",
    questArcIds: ["aftermath_maintenance_window_miracle"],
    pipeline: artPipeline("remaining_hands"),
  },
  {
    id: "jorem_mortality_bearer",
    name: "Jorem Mortality-Bearer",
    epithet: "The Person Allowed to Resign",
    factionId: "league_of_remaining_hands",
    role: "Fallible person selected to carry a mortal shutdown office",
    desire: "Create succession before anyone turns his vulnerability into heroism.",
    fear: "That keeping the dawn engine stoppable will make his continued life compulsory.",
    contradiction: "He volunteered to make divine control mortal, then withheld that the engine cannot distinguish his death from a free resignation.",
    secret: "Jorem can vacate the office by resigning, but every faction has described that freedom as a catastrophic fault.",
    voice: { cadence: "Wills, refusal clauses, and replacement procedures", imagery: "Pulse, shadow, sworn names, and vacant offices", signature: "Rejects every appeal to duty that omits a lawful way for him to quit" },
    alignmentOptions: ["league_of_remaining_hands", "lucent_synod", "charnel_night"],
    visualBrief: "Plain mortal carrying three detachable office signs: pulse cuff, sworn-name collar, and independent shadow clasp.",
    questArcIds: ["aftermath_person_engine_must_outlive"],
    pipeline: artPipeline("remaining_hands"),
  },
  {
    id: "della_quorum_unseated_cost",
    name: "Della Quorum",
    epithet: "Recorder of the Unseated Cost",
    factionId: "league_of_remaining_hands",
    role: "Recorder of the maintenance ratification and author of its standing rules",
    desire: "Keep durable operating benefits appealable without making every future entrant able to dissolve all law.",
    fear: "That correcting inherited exclusion will make long-lived public systems impossible to govern.",
    contradiction: "She demands every omitted constituency be identified while hiding the clause that classified unborn and unrecognized lives as inputs rather than constituents.",
    secret: "Della drafted the standing rule that enabled the new claimant's exclusion and later disguised it as an engineering definition.",
    voice: { cadence: "Motions paired with explicit expiration dates", imagery: "Ballot seals, service debt, fractures, and unoccupied seats", signature: "Refuses to call a law ratified until present, hidden, and future constituencies denied standing are named" },
    alignmentOptions: ["league_of_remaining_hands", "lucent_synod", "charnel_night"],
    visualBrief: "Ash-suited maintenance recorder with three conductive service-debt lines crossing ratification seals that expire along her sleeves.",
    questArcIds: ["aftermath_cost_that_learned_to_vote"],
    pipeline: artPipeline("remaining_hands"),
  },
]);

export const EXPANSION_CHARACTERS = deepFreeze([
  ...EXPANSION_PRINCIPALS,
  ...QUEST_SUPPORT_CHARACTERS,
]);

const creature = (record) => ({
  schemaVersion: 1,
  genericTemplateAllowed: false,
  pipeline: artPipeline(record.familyId),
  ...record,
});

// These are the first admissions beyond the founding 178-form bestiary. They
// are not rank-and-file variants: each owns an origin, ecology, readable cue,
// counterplay verb, and narrative use that no other admitted form may reuse.
export const EXPANSION_CREATURES = deepFreeze([
  creature({
    id: "apse_seraph", name: "Apse Seraph", familyId: "lucent_procession", factionAffinityIds: ["lucent_synod"], rank: "elite", combatRole: "controller",
    anatomy: "A walking cathedral arch of white-gold vertebrae with a serene veiled face suspended where its missing keystone should be.",
    locomotion: "Its two load-bearing arch feet advance in measured nave-length steps while the suspended veil remains perfectly level.",
    ecology: "It measures ruined settlements for inclusion in the restored world's approved geometry.",
    origin: "The Synod taught a collapsed apse to remember the congregation it once enclosed, then removed every worshipper the memory could not classify.",
    mechanic: { id: "missing_keystone_judgment", cue: "Every arch segment locks except one visibly vacant socket above the veil.", counterplay: "Occupy the missing-keystone line to make the judgment classify the Seraph as its own structural fault." },
    narrativeUse: "Can preserve a town's buildings while declaring its current inhabitants geometrically inadmissible.",
    visualBrief: "Angelic mobile apse, incomplete halo-arch, white-gold cathedral bone, tranquil black veil, one conspicuous missing upper stone; beautiful, measurable, and faintly predatory.",
    pipeline: artPipeline("lucent_procession", {
      conceptMaster: "assets/bestiary/forms/lucent-procession/apse-seraph-v2.png",
      artStatus: "accepted",
    }),
  }),
  creature({
    id: "misericord_of_borrowed_pain", name: "Misericord of Borrowed Pain", familyId: "lucent_procession", factionAffinityIds: ["lucent_synod", "league_of_remaining_hands"], rank: "specialist", combatRole: "support",
    anatomy: "Six narrow wings fold into mercy seats around a hollow torso containing no patient, only restrained dawn.",
    locomotion: "It hovers by opening one paired seat at a time, drifting toward pain without wingbeats or contact with the ground.",
    ecology: "It follows hospitals and battlefields, removing pain faster than consent can be recorded.",
    origin: "Canoness Vael built the first from six cathedral seats polished smooth by generations of grieving families.",
    mechanic: { id: "painless_transfer", cue: "One empty wing-seat unfolds toward the nearest unwounded body.", counterplay: "Accept a deliberate minor wound before the transfer, giving the stored agony no uninjured vessel to enter." },
    narrativeUse: "Offers miraculous triage whose hidden cost migrates suffering into bystanders and future patients.",
    visualBrief: "Ivory-gold angelic medical reliquary, exactly six seat-wings, hollow center, black seams, no gore and no patient depicted.",
    pipeline: artPipeline("lucent_procession", {
      conceptMaster: "assets/bestiary/forms/lucent-procession/misericord-of-borrowed-pain-v1.png",
      artStatus: "accepted",
    }),
  }),
  creature({
    id: "noon_bailiff", name: "Noon Bailiff", familyId: "lucent_procession", factionAffinityIds: ["lucent_synod"], rank: "regular", combatRole: "hunter",
    anatomy: "A faceless bronze officer balanced on one vertical gavel-limb, with a second body made only from its confiscated shadow.",
    locomotion: "The solid body vaults on the gavel-limb only after its attached shadow has performed the predicted step ahead of it.",
    ecology: "It serves warrants against actions the restored law predicts a person will eventually commit.",
    origin: "A mortal court asked daylight to reveal perfect evidence; the answer arrived after the courthouse had no defendants left.",
    mechanic: { id: "prospective_arrest", cue: "The flat shadow completes the player's next animation before the solid Bailiff moves.", counterplay: "Begin one action and cancel into a different facing during the silent verdict gap." },
    narrativeUse: "Forces settlements to decide whether preventing certain harm justifies punishment before choice.",
    visualBrief: "Narrow bronze-white herald, one gavel leg, one attached prophetic shadow, mouthless judicial veil, no weapon or written warrant.",
    pipeline: artPipeline("lucent_procession", {
      conceptMaster: "assets/bestiary/forms/lucent-procession/noon-bailiff-v2.png",
      artStatus: "accepted",
    }),
  }),
  creature({
    id: "unbroken_note_engine", name: "Engine of the Unbroken Note", familyId: "lucent_procession", factionAffinityIds: ["lucent_synod", "charnel_night"], rank: "miniboss", combatRole: "artillery",
    anatomy: "A hovering organ of thirteen pale pipes arranged around one black silent pipe that is physically unable to sound.",
    locomotion: "It translates on sustained pressure pulses, turning by shortening one sounding pipe while the black pipe stays inert.",
    ecology: "It stabilizes failing natural law by holding one note until local change becomes impossible.",
    origin: "Deacon Halix commissioned a choir that could never forget its pitch; the first performance also prevented its listeners from aging, healing, or leaving.",
    mechanic: { id: "fixed_state_amen", cue: "Twelve sounding pipes frost while the single black pipe remains warm and silent.", counterplay: "Route an environmental sound through the black pipe to introduce a lawful rest into the note." },
    narrativeUse: "May freeze a dying village safely forever or release it into accumulated centuries at once.",
    visualBrief: "Angelic organ-engine, exactly thirteen countable pipes with one black silent exception, restrained light, no floating notation or choir scene.",
    pipeline: artPipeline("lucent_procession", {
      conceptMaster: "assets/bestiary/forms/lucent-procession/unbroken-note-engine-v3.png",
      artStatus: "accepted",
    }),
  }),
  creature({
    id: "reliquary_of_the_last_breath", name: "Reliquary of the Last Breath", familyId: "lucent_procession", factionAffinityIds: ["lucent_synod"], rank: "elite", combatRole: "summoner",
    anatomy: "A wingless floating chest whose ribs are rows of sealed glass breath-vials surrounding one intentionally empty cradle.",
    locomotion: "Captured exhalations lift it in slow buoyant surges; it descends only when an occupied vial briefly clears.",
    ecology: "It collects final breaths and rebuilds useful dead as idealized versions stripped of inconvenient loyalties.",
    origin: "A plague hospice donated its last exhalations to the promised dawn and discovered the contract did not define who would breathe them next.",
    mechanic: { id: "idealized_return", cue: "One empty cradle-vial clouds while all occupied vials clear.", counterplay: "Break only the empty vial, causing the attempted resurrection to return the target's refused memory instead of its body." },
    narrativeUse: "Provides resurrection that can save a beloved character while editing why they mattered.",
    visualBrief: "Beautiful white-gold reliquary chest, many sealed vials, one conspicuous empty cradle, no corpse, spirit, labels, or readable scripture.",
    pipeline: artPipeline("lucent_procession", {
      conceptMaster: "assets/bestiary/forms/lucent-procession/reliquary-of-the-last-breath-v1.png",
      artStatus: "accepted",
    }),
  }),
  creature({
    id: "gold_shutter_penitent", name: "Gold-Shutter Penitent", familyId: "lucent_procession", factionAffinityIds: ["lucent_synod", "league_of_remaining_hands"], rank: "regular", combatRole: "bruiser",
    anatomy: "A kneeling armored body whose torso is a stack of counterweighted shutters around a dangerous slice of real sunrise.",
    locomotion: "It advances through consecutive kneeling lunges, planting both knees before its counterweights reset for the next exposure.",
    ecology: "It walks ahead of processions, testing which local adaptations survive measured exposure.",
    origin: "Volunteers once wore the shutters to ration holy light; the devices continued their pilgrimage after the volunteers were purified away.",
    mechanic: { id: "absolution_exposure", cue: "The lowest counterweight rises while exactly one torso shutter begins to open.", counterplay: "Strike the rising weight from the dark side to close the shutter without touching the dawn slice." },
    narrativeUse: "Can cure shadow mutations or erase the people whose lives depend on them.",
    visualBrief: "Ominous kneeling angelic armor with stacked mechanical shutters, one narrow sunrise seam, readable weights, no occupant or blazing aura.",
    pipeline: artPipeline("lucent_procession", {
      conceptMaster: "assets/bestiary/forms/lucent-procession/gold-shutter-penitent-v2.png",
      artStatus: "accepted",
    }),
  }),
  creature({
    id: "door_lung_courser", name: "Door-Lung Courser", familyId: "charnel_households", factionAffinityIds: ["charnel_night"], rank: "regular", combatRole: "skirmisher",
    anatomy: "A wet black-nacre quadruped whose ribs hinge as paired doors and whose lungs inflate with stolen roads rather than air.",
    locomotion: "It gallops along the route stored in its lungs, cutting corners through its own open rib doors instead of turning normally.",
    ecology: "It grazes on routes leading to Charnel sanctuaries, leaving travelers alive but unable to arrive.",
    origin: "The first was a rescue horse that carried refugees until the road itself begged to hide inside its chest.",
    mechanic: { id: "route_inhalation", cue: "The final open rib-door frames the last usable segment of path.", counterplay: "Cross through that rib doorway before it closes, forcing the Courser to exhale the stolen route behind you." },
    narrativeUse: "Protects refugees by making their sanctuary unreachable, including to families trying to reunite.",
    visualBrief: "Horrifying but non-gory nacre quadruped, hinged door-ribs, inflated mapless lungs, exactly one last open doorway cue, no scenery.",
    pipeline: artPipeline("charnel_households", {
      conceptMaster: "assets/bestiary/forms/charnel-households/door-lung-courser-v1.png",
      artStatus: "accepted",
    }),
  }),
  creature({
    id: "reverse_rib_bride", name: "Reverse-Rib Bride", familyId: "charnel_households", factionAffinityIds: ["charnel_night", "lucent_synod"], rank: "elite", combatRole: "duelist",
    anatomy: "A tall ceremonial horror whose outward ribs clasp like many hands around a completely absent spouse-shaped space.",
    locomotion: "It glides by exchanging its promised positions with the empty spouse-space, never stepping into an unvowed location.",
    ecology: "It binds enemies and allies into temporary vows that make betrayal anatomically painful.",
    origin: "A peace marriage ended two wars and erased both partners; the vow survived as an organism furious that peace had no body.",
    mechanic: { id: "vow_position", cue: "Exactly two rib-hands release and point to separate promised positions.", counterplay: "Exchange the two marked positions without either participant attacking, satisfying the vow while denying its victim." },
    narrativeUse: "Can enforce truces that save thousands while removing every participant's ability to withdraw consent.",
    visualBrief: "Regal black-nacre figure, outward clasping ribs, empty partner silhouette, two readable released pointer-ribs, no bridal realism or gore.",
    pipeline: artPipeline("charnel_households", {
      conceptMaster: "assets/bestiary/forms/charnel-households/reverse-rib-bride-v1.png",
      artStatus: "accepted",
    }),
  }),
  creature({
    id: "throat_orchard", name: "Throat Orchard", familyId: "charnel_households", factionAffinityIds: ["charnel_night"], rank: "miniboss", combatRole: "controller",
    anatomy: "A low rooted body grows eleven closed throat-fruits around one open, breathless twelfth fruit with no mouth behind it.",
    locomotion: "The root mat advances by planting each commanded breath ahead and retracting only after the warning has been obeyed.",
    ecology: "It preserves final warnings that nobody obeyed and replays them as compulsory battlefield commands.",
    origin: "The Prince of Thirteen Throats planted voices he refused to consume; their warnings rooted before their owners could reclaim them.",
    mechanic: { id: "false_command_harvest", cue: "Eleven throats inhale in sequence while the open twelfth remains motionless.", counterplay: "Obey only the breathless throat's silent facing, not the audible commands." },
    narrativeUse: "Can return testimony to silenced communities only in the form of orders no listener is free to ignore.",
    visualBrief: "Rooted anatomical orchard, exactly twelve non-gory throat-fruits with eleven closed and one open breathless exception, no text, fruit tree, or human heads.",
    pipeline: artPipeline("charnel_households", {
      conceptMaster: "assets/bestiary/forms/charnel-households/throat-orchard-v1.png",
      artStatus: "accepted",
    }),
  }),
  creature({
    id: "jointless_advocate", name: "Jointless Advocate", familyId: "charnel_households", factionAffinityIds: ["charnel_night", "league_of_remaining_hands"], rank: "specialist", combatRole: "controller",
    anatomy: "A smooth legal effigy with four boneless limbs that bend only where an opponent previously proved a rule could be broken.",
    locomotion: "Its ribbon limbs replay accepted exceptions as folds, so every new path is physically copied from a prior evasive act.",
    ecology: "It appears wherever a treaty relies on precedent and turns yesterday's exception into today's compulsory procedure.",
    origin: "A desperate village won one impossible appeal; the exception learned to represent itself and has never lost a case.",
    mechanic: { id: "precedent_predation", cue: "One limb creases into the exact silhouette of the player's last successful dodge.", counterplay: "Deliberately let the next harmless telegraph complete, replacing the lethal precedent with a survivable one." },
    narrativeUse: "Protects marginalized exceptions while making every emergency accommodation permanently exploitable.",
    visualBrief: "Seamless black legal effigy, four boneless ribbon limbs, one copied dodge crease, severe empty face, no scrolls, scales, or courtroom.",
    pipeline: artPipeline("charnel_households", {
      conceptMaster: "assets/bestiary/forms/charnel-households/jointless-advocate-v1.png",
      artStatus: "accepted",
    }),
  }),
  creature({
    id: "mercy_eater", name: "Mercy-Eater", familyId: "charnel_households", factionAffinityIds: ["charnel_night"], rank: "regular", combatRole: "support",
    anatomy: "A compact many-footed body carries one enormous sheathed mouth on its back, leaving the apparent front harmless and blank.",
    locomotion: "Its many feet move in silent recovery-length increments while the dorsal mouth remains oriented away from travel.",
    ecology: "It consumes acts of healing so predators cannot track refugee groups by sudden reductions in suffering.",
    origin: "Mother Nacre bred it to hide convalescents from angels that smell miraculous recovery.",
    mechanic: { id: "consume_recovery", cue: "The backward mouth's outer hand-ribs unclasp before a healing effect is stolen.", counterplay: "Use prevention or shielding during the opening, then heal only after the hand-ribs close." },
    narrativeUse: "Its protection makes hidden clinics possible while leaving untreated pain as the safest disguise.",
    visualBrief: "Small disturbing nacre carrier, single large restrained dorsal mouth with hand-like sheath, many clear feet, no gore, cuteness, or second mouth.",
    pipeline: artPipeline("charnel_households", {
      conceptMaster: "assets/bestiary/forms/charnel-households/mercy-eater-v1.png",
      artStatus: "accepted",
    }),
  }),
  creature({
    id: "corridor_maw", name: "Corridor Maw", familyId: "charnel_households", factionAffinityIds: ["charnel_night"], rank: "boss", combatRole: "juggernaut",
    anatomy: "A cathedral-length predator folded into a standing doorframe, its interior corridor visible without exposing organs.",
    locomotion: "The entrance stays planted while the distant exit walks; the corridor advances only when both frames exchange exterior sides.",
    ecology: "It carries entire front lines through itself, making attacker and defender exchange territory without crossing the ground between.",
    origin: "A fortress evacuation tunnel kept extending after the fortress fell, eventually growing teeth only at the concept of an exit.",
    mechanic: { id: "interior_front_exchange", cue: "The entrance frame and distant exit frame display opposite attached shadow angles.", counterplay: "Mark the exterior side of the entrance, traverse the body, then strike the exit from the matching exterior angle." },
    narrativeUse: "Can end a siege without casualties by exchanging populations, while also turning refuge into involuntary exile.",
    visualBrief: "Impossible black-nacre doorframe predator with one deep corridor and paired shadow-angle cues, immense yet isolated, no environment or entrails.",
    pipeline: artPipeline("charnel_households", {
      conceptMaster: "assets/bestiary/forms/charnel-households/corridor-maw-v1.png",
      artStatus: "accepted",
    }),
  }),
  creature({
    id: "shutter_stag", name: "Shutter Stag", familyId: "remaining_ecologies", factionAffinityIds: ["league_of_remaining_hands", "lucent_synod"], rank: "regular", combatRole: "support",
    anatomy: "A lean dusk animal whose branching antlers are functional lantern shutters rather than bone.",
    locomotion: "It bounds only through the twilight strip cast between its asymmetrical shutters, halting when both sides match.",
    ecology: "Herds maintain strips of survivable twilight between Synod roads and altered forests.",
    origin: "Lamplighters left a generation of shutters open during migration; the migrating dark grew legs to carry them back.",
    mechanic: { id: "borrowed_twilight", cue: "One antler shutter closes while its opposite remains fully open.", counterplay: "Rotate through the open side before matching the closed side, returning the borrowed light without startling the herd." },
    narrativeUse: "Creates neutral corridors but gradually drains every settlement whose lamps it passes.",
    visualBrief: "Mature non-naturalistic dusk stag, mechanical shutter antlers, asymmetric open/closed cue, no ordinary antler rack or forest scene.",
  }),
  creature({
    id: "rain_notary", name: "Rain Notary", familyId: "remaining_ecologies", factionAffinityIds: ["league_of_remaining_hands", "charnel_night"], rank: "specialist", combatRole: "artillery",
    anatomy: "A tall civic coat hangs from an umbrella-like spine while exactly seven heavy droplets orbit as unwritten contracts.",
    locomotion: "It strides on columns of falling rain, relocating a supporting droplet only after the previous splash has witnessed the step.",
    ecology: "It records promises made during bad weather, when witnesses are scarce and shelter has leverage.",
    origin: "A bridge clerk drowned before filing a truce; the rain retained the promises more accurately than either army did.",
    mechanic: { id: "weather_contract", cue: "Six droplets continue orbiting while one stops above the action it forbids.", counterplay: "Perform the mirrored action under the moving six, leaving the stationary clause technically unbroken." },
    narrativeUse: "Enforces lifesaving promises that their signatories insist were coerced by the storm.",
    visualBrief: "Empty municipal coat on umbrella spine, exactly seven large suspended droplets with one stationary cue, no writing, rain scene, or human occupant.",
  }),
  creature({
    id: "witness_crab", name: "Witness Crab", familyId: "remaining_ecologies", factionAffinityIds: ["league_of_remaining_hands"], rank: "regular", combatRole: "controller",
    anatomy: "A broad six-legged scavenger carries three hinged shell-faces, each showing a different flat angle of the same past event.",
    locomotion: "Six legs sidestep in three opposed pairs, each pair following the account displayed by the shell-face above it.",
    ecology: "It feeds on contradictions left after disasters and becomes aggressive when forced to choose one official account.",
    origin: "Three surviving witnesses buried incompatible testimony in one tidal grave; a scavenger incorporated all of it without resolving them.",
    mechanic: { id: "cross_examine_shells", cue: "Two shell-faces blink in agreement while the rear shell remains lidless.", counterplay: "Flank to the lidless rear account and answer its telegraph rather than the majority view." },
    narrativeUse: "Can expose a faction's lie without proving which rival version is true.",
    visualBrief: "Exactly six-legged slate crab, three hinged optical shell-faces, one lidless rear exception, no beach, realistic human faces, or extra crab.",
  }),
  creature({
    id: "acre_that_walks", name: "The Acre That Walks", familyId: "remaining_ecologies", factionAffinityIds: ["league_of_remaining_hands"], rank: "miniboss", combatRole: "juggernaut",
    anatomy: "A rectangular plot of exhausted soil is carried by four fence-post legs, with roots hanging upward into an absent sky.",
    locomotion: "Three posts bear the legal boundary while the fourth uproots, advances, and redraws one corner before the others follow.",
    ecology: "It migrates between starving settlements and recognizes ownership boundaries more strongly than hunger.",
    origin: "A disputed famine field outlived every claimant and eventually left to find people willing to share its harvest.",
    mechanic: { id: "moving_property_line", cue: "Exactly one corner stake uproots while the other three remain load-bearing.", counterplay: "Move a seed marker beyond the lifted corner before it lands, expanding the legal harvest boundary away from combatants." },
    narrativeUse: "Can feed a district only by importing somebody else's contested land claim.",
    visualBrief: "One walking rectangular acre, four fence-post legs with one lifted, inverted roots, no landscape extension, farmer, or ordinary golem body.",
  }),
  creature({
    id: "funeral_kite", name: "Funeral Kite", familyId: "remaining_ecologies", factionAffinityIds: ["league_of_remaining_hands", "charnel_night"], rank: "regular", combatRole: "ambusher",
    anatomy: "A black memorial cloth flies without wind around a rigid frame, carrying one blank name-tab for every unclaimed death nearby.",
    locomotion: "It tacks through still air by folding one unclaimed tab inward, with no dependence on wind or wing anatomy.",
    ecology: "It keeps forgotten names from predatory archives by removing the names from everyone, including families.",
    origin: "A paupers' funeral banner tore free before the clerk could write on it and learned that blankness was the only record no victor could revise.",
    mechanic: { id: "unclaimed_name_dive", cue: "One blank tab folds inward while every other tab streams outward.", counterplay: "Present an item tied to the targeted dead, making the inward tab claimed and too heavy for the dive." },
    narrativeUse: "Protects the anonymous dead from exploitation at the cost of making reunion and mourning impossible.",
    visualBrief: "Windless black memorial kite with many plain blank tabs and exactly one folded inward, no readable names, sky, corpse, or bird anatomy.",
  }),
  creature({
    id: "ember_midwife", name: "Ember Midwife", familyId: "remaining_ecologies", factionAffinityIds: ["league_of_remaining_hands", "lucent_synod", "charnel_night"], rank: "elite", combatRole: "summoner",
    anatomy: "A three-legged kiln cradle incubates one sealed ash cocoon assembled from the last damage types discarded nearby.",
    locomotion: "The tripod vaults by rotating the sealed cradle over one planted kiln leg, never rolling or exposing the cocoon.",
    ecology: "It helps endangered altered species adapt to new threats, regardless of whether the threat is predator, medicine, or player.",
    origin: "Cinderward healers built a portable incubator for premature livestock; battlefield ash taught it a broader definition of offspring.",
    mechanic: { id: "adaptive_second_birth", cue: "Three material bands on the cocoon darken in the exact order of the last three damage sources.", counterplay: "Finish the cocoon with a fourth, unused damage category so the newborn cannot inherit a complete resistance cycle." },
    narrativeUse: "Can rescue a species from extinction or deliberately breed an answer to every weapon a settlement owns.",
    visualBrief: "Three-legged kiln-midwife construct, one sealed non-gory ash cocoon, three readable material bands, no infant, battlefield, or extra spawn.",
  }),
  creature({
    id: "deed_eater_wren", name: "Deed-Eater Wren", familyId: "noon_wound_ecologies", factionAffinityIds: ["league_of_remaining_hands", "lucent_synod"], rank: "specialist", combatRole: "controller",
    anatomy: "A lintel-nesting legal scavenger assembled from chewed hinge pins, compact lock plates, and a breast cavity that holds one remembered domestic routine.",
    locomotion: "It makes short angular flights between recognized thresholds, landing only where a hinge can chime without opening.",
    ecology: "It nests in restored buildings where obsolete title and present occupancy disagree, feeding on the weaker history until architecture treats the survivor as law.",
    origin: "When the Synod rebuilt legal houses from remembered purpose, discarded occupancy claims gathered around locksmith filings and learned to peck.",
    mechanic: { id: "occupancy_history_peck", cue: "A hinge chimes without moving while the wren's breast cavity replays one household routine.", counterplay: "Deliberately misfile a genuine lived routine in the only room the wren cannot enter, forcing the building to preserve that testimony outside its beak." },
    narrativeUse: "Turns architectural title disputes into ecological change: removing it may save a deed while destroying the only record of who actually lived there.",
    visualBrief: "Small severe threshold bird made from distinct chewed hinge components and one warm routine-cavity, uncanny rather than cute, with no paper deed, writing, nest scene, or ordinary feathers.",
  }),
  creature({
    id: "shadow_census_moth", name: "Shadow-Census Moth", familyId: "noon_wound_ecologies", factionAffinityIds: ["league_of_remaining_hands", "charnel_night"], rank: "specialist", combatRole: "summoner",
    anatomy: "A broad-bodied moth whose individual scales each cast a different borrowed silhouette, with no single shadow matching its physical body.",
    locomotion: "It flies in slow census loops while one borrowed shadow folds its wings a full beat before the material moth changes direction.",
    ecology: "It gathers where separated shadows queue for representation and inflates local population counts until every borrowed silhouette receives a named source or refusal.",
    origin: "Kessa Pale's diverted absence rolls shed black counting dust; the first moth pupated inside a total that referred to nobody officials could admit.",
    mechanic: { id: "borrowed_silhouette_inflation", cue: "One unowned shadow folds its wings before the moth does while the remaining scale-shadows stay extended.", counterplay: "Name and separate the early-folding scale's witness rather than striking the moth's body, removing that silhouette from the count without erasing it." },
    narrativeUse: "Makes statistical exclusion visible but can grant accidental seats and ration debts to identities that never consented to civic recognition.",
    visualBrief: "One broad ominous moth with hundreds of discrete shadow-casting scales and one readable early-folding silhouette; no swarm, moon, scenery, text, or decorative eye spots.",
  }),
  creature({
    id: "lumen_tithe_burr", name: "Lumen Tithe-Burr", familyId: "lucent_propagules", factionAffinityIds: ["lucent_synod", "league_of_remaining_hands"], rank: "elite", combatRole: "support",
    anatomy: "An ambulatory knot of white-gold hooked seed vessels whose every tip can pivot toward the person legally liable for its next host.",
    locomotion: "It ratchets through connected breath, gutter, and masonry corridors by hooking one warranted surface before releasing the previous custodian.",
    ecology: "It repairs damaged structures and lungs while reproducing restoration law and propagation debt as one inseparable colonial organism.",
    origin: "Synod gardeners engineered purity marks to collect tithes without soldiers; Roen Fitch's domestic graft taught the crop to recognize household custody.",
    mechanic: { id: "propagation_warrant_transfer", cue: "Every hook aligns toward one named cultivator before a seed crosses breath or masonry.", counterplay: "Place the prior and next custodians inside the live seed corridor and transfer its warrant before redirecting the organism." },
    narrativeUse: "Offers lifesaving repair whose route simultaneously determines ownership, liability, and who may refuse the next generation.",
    visualBrief: "One low ambulatory white-gold burr organism with numerous countable hooked seed vessels all indicating one custodian; luminous yet invasive, no flower bouquet, field, text, or human victim.",
  }),
  creature({
    id: "threshold_lamb", name: "Threshold Lamb", familyId: "charnel_households", factionAffinityIds: ["charnel_night", "league_of_remaining_hands"], rank: "regular", combatRole: "skirmisher",
    anatomy: "A woolless non-ovine sanctuary organism built from soft door hinges and backward ribs around a small unoccupied passage.",
    locomotion: "It crosses one resident's outward-opening body door and returns through a different resident, never traversing the space between them.",
    ecology: "It stress-tests rib-door exits under protective summons, exposing where one resident's consent silently authorizes passage through another body.",
    origin: "Mother Nacre made gentle test creatures for children learning their doors; centuries of closed sanctuary turned rehearsal into jurisdiction.",
    mechanic: { id: "misaddressed_return", cue: "Every nearby latch inhales at once before one backward rib selects the destination resident.", counterplay: "Revoke the destination door before inviting the creature across the origin threshold, forcing it to return through its own passage." },
    narrativeUse: "Can prove that a sanctuary exit is operational while violating a different resident's bodily consent in the same act.",
    visualBrief: "Small unsettling hinge-and-backward-rib organism with one empty passage, explicitly non-ovine and woolless; no cute lamb face, pasture, gore, or extra creature.",
  }),
  creature({
    id: "eave_lung", name: "Eave Lung", familyId: "charnel_weather", factionAffinityIds: ["charnel_night", "league_of_remaining_hands"], rank: "elite", combatRole: "artillery",
    anatomy: "A free-floating respiratory roof organ with folding rafter bronchi and one named leak-valve, born without a surrounding body.",
    locomotion: "It migrates on the rain current it owns, inhaling rafters beneath itself and exhaling them as temporary eaves behind.",
    ecology: "It shelters communities that acknowledge the downstream drought created by its diverted pressure and abandons roofs whose beneficiaries deny the recipient.",
    origin: "A pressure error in Mother Nacre's living climate detached one forecast lung and made the stolen rain's custody anatomically independent.",
    mechanic: { id: "accountable_rain_current", cue: "Rafters breathe before clouds change direction and the single leak-valve turns away from an unnamed drought.", counterplay: "Give the lung a named leak with an accountable recipient, allowing pressure to leave without transferring the whole storm." },
    narrativeUse: "Makes weather debt a negotiable being: destroying it returns rain abruptly, while housing it requires an enduring downstream obligation.",
    visualBrief: "One translucent floating lung-roof organ with branching rafter bronchi and a single deliberate leak, uncanny civic anatomy without gore, clouds, village scenery, or second lung.",
  }),
  creature({
    id: "veto_gasket_choir", name: "Veto-Gasket Choir", familyId: "dawn_engine_symbionts", factionAffinityIds: ["league_of_remaining_hands", "lucent_synod", "charnel_night"], rank: "miniboss", combatRole: "controller",
    anatomy: "Exactly seven semi-living engine seals arranged as a broken mechanical choir, each with one throat-like pressure slit but no humanoid body.",
    locomotion: "The seven seals roll around an engine ring in quorum order, and a dissenting gasket reverses alone to open a local service dark.",
    ecology: "They harmonize only while shutdown authority is illegitimate, rerouting light toward dependencies excluded from the current maintenance quorum.",
    origin: "Mortal maintenance liturgies were removed when the Synod declared miracles eternal; seven discarded service seals retained the voices of technicians denied the restart vote.",
    mechanic: { id: "missing_dependency_chord", cue: "One gasket sings in an absent voter's voice while the other six hold a mechanically perfect but incomplete chord.", counterplay: "Split the operating quorum and seat the missing dependency before resealing, turning the dissenting voice into an authorized interval." },
    narrativeUse: "Can keep a dawn engine answerable by forcing dark intervals, but each intervention transfers light into another living system that did not vote.",
    visualBrief: "Exactly seven distinct semi-living circular engine gaskets in one readable choir, one reversed dissenting seal, pale mechanism with ominous dark pressure slits; no text, workers, engine room, or extra seal.",
  }),
]);

export const ALIGNMENT_HOOKS = deepFreeze([
  { characterId: "maela_voss", affinities: ["league_of_remaining_hands", "lucent_synod"], fracture: "The Synod can restore every erased Ledger name, but only by making the Ledger its census of the purified." },
  { characterId: "ysra_pell", affinities: ["league_of_remaining_hands", "charnel_night"], fracture: "The Charnel Night can preserve Dunmire's altered dead, but asks Ysra to stop calling their changes an illness." },
  { characterId: "orik_senn", affinities: ["league_of_remaining_hands", "lucent_synod", "charnel_night"], fracture: "Both cosmic sides need the Cinderward furnaces; Orik can build either a dawn-vessel or a shadow refuge from the same metal." },
  { characterId: "vellin_the_unwritten", affinities: ["league_of_remaining_hands", "charnel_night"], fracture: "Vellin's master map can hide roads from the Synod forever, but every hidden road becomes accessible to demons that travel through omission." },
  { characterId: "gatewarden_nhal", affinities: ["lucent_synod", "league_of_remaining_hands"], fracture: "Nhal recognizes the Synod's authority and also knows exactly how many gates obedience has opened to disaster." },
]);

export const EXPANSION_ITEMS = deepFreeze([
  { id: "obedient_noon_splinter", name: "Splinter of Obedient Noon", category: "law_relic", mechanic: "Pins one local rule of daylight in place while causing a different nearby rule to fail.", lore: "The Synod calls it a ray. Engineers call it a command that happens to be bright." },
  { id: "black_halo_nail", name: "Black Halo Nail", category: "shadow_relic", mechanic: "Fastens a shadow to its owner or deliberately releases it as an independent witness.", lore: "Its head reflects the person you might have been if no one had watched." },
  { id: "memory_suture", name: "Memory Suture", category: "surgical_relic", mechanic: "Transfers one chosen memory between willing characters, including its emotional consequence.", lore: "Canoness Vael insists the thread is painless. The thread remembers otherwise." },
  { id: "widowers_witness_thread", name: "Widower's Witness Thread", category: "testimony_relic", mechanic: "Makes one erased person's effects visible without reconstructing or idealizing the person who caused them.", lore: "It proves somebody was loved without pretending proof is the same as return." },
  { id: "thirteenth_ballot", name: "The Thirteenth Ballot", category: "voice_relic", mechanic: "Forces a collective speaker to reveal which voice did not consent.", lore: "It is blank until swallowed, and then records a vote in the eater's least familiar voice." },
  { id: "rib_door_key", name: "Key to the Open Rib", category: "living_key", mechanic: "Opens one sanctuary-body entrance while temporarily making the user summonable by Mother Nacre.", lore: "Warm, toothless, and ashamed of every lock it has served." },
  { id: "wound_margin_quill", name: "Quill of the Wound Margin", category: "archive_tool", mechanic: "Makes a hidden historical injury inspectable without deciding who must feel it yet.", lore: "Keth cut it from a fact that refused to stay buried." },
  { id: "lamplighters_seventh_wick", name: "Lamplighter's Seventh Wick", category: "civic_tool", mechanic: "Keeps one route visible through any world-state transition but permanently reveals who was excluded from that route.", lore: "Six streets were funded. Enoch lit seven and never explained the extra smoke." },
  { id: "portable_off_switch", name: "Portable Off-Switch", category: "dawn_engine", mechanic: "Interrupts one restoration effect after its benefit but before its ideological cost resolves.", lore: "Tor built it to prove gods should expect maintenance windows." },
  { id: "countryless_ash_seal", name: "Countryless Ash Seal", category: "civic_relic", mechanic: "Lets a destroyed place refuse one factional claim through the player's action.", lore: "Pressed into wax, it leaves the shape of an empty chair." },
  { id: "mercy_maw_token", name: "Token of the Restrained Maw", category: "pact_relic", mechanic: "Allows safe passage through one consuming space while increasing the Maw's trust and appetite together.", lore: "A tooth voluntarily shed. It trembles when thanked." },
  { id: "small_sun_crucible", name: "Crucible for a Small Sun", category: "campaign_relic", mechanic: "Accumulates mutually incompatible light laws chosen across the campaign and determines the final dawn's limits.", lore: "Large enough for a sunrise. Too small for certainty." },
  { id: "hospice_heart_seed", name: "Hospice Heart-Seed", category: "living_structure", mechanic: "Grows a neutral healing room whose treatment priorities inherit the donor's unresolved bias.", lore: "It beats faster near anyone its maker would have left outside." },
  { id: "counter_deed_hinge", name: "Counter-Deed Hinge", category: "civic_threshold", mechanic: "Lets one player-owned threshold recognize current use over written title while permanently recording the displaced claimant.", lore: "It swings toward whoever slept behind it last, but its pin still carries the previous family's weight." },
  { id: "negative_roll", name: "Negative Roll", category: "absence_register", mechanic: "Reveals who a civic count excludes rather than listing the people it successfully contains.", lore: "Blank under direct noon, it darkens wherever a total has made somebody administratively impossible." },
  { id: "dusk_graft_shears", name: "Dusk-Graft Shears", category: "living_law_tool", mechanic: "Transfers legal custody of one propagating living effect when its prior and next custodians are physically present together.", lore: "The blades cut no stem; they sever the sentence that says who must answer for its seed." },
  { id: "wheel_of_refusal", name: "Wheel of Refusal", category: "civic_tool", mechanic: "Allows one public tool to reject a command and converts that refusal into appealable precedent instead of mechanical failure.", lore: "Its axle remembers the first officeholder who was buried for saying no." },
  { id: "untimely_heirloom", name: "Untimely Heirloom", category: "kinship_relic", mechanic: "Moves custody backward through one lineage transfer while the resulting obligation continues forward.", lore: "It grows younger in an ancestor's hand and heavier in a descendant's." },
  { id: "revocation_latch", name: "Revocation Latch", category: "consent_tool", mechanic: "Ends one consensual enchantment only after both parties state the material cost of exit.", lore: "A door that cannot shame its wall is merely an opening." },
  { id: "borrowed_eave", name: "Borrowed Eave", category: "weather_structure", mechanic: "Redirects one environmental hazard while identifying the named place or person that receives it.", lore: "The dry side bears a rain mark shaped like somebody else's roof." },
  { id: "roadless_birthday", name: "Roadless Birthday", category: "relationship_route", mechanic: "Marks elapsed relationship instead of distance and can lead once to a place that maps have deliberately forgotten.", lore: "Pell counted this year by the promise that failed to arrive." },
  { id: "divided_handle", name: "Divided Handle", category: "control_witness", mechanic: "Makes the person, continuing office, and exposed claimant behind one control act separately visible without granting any new authority.", lore: "Three hands can hold it; none can pretend the others were only gloves." },
  { id: "service_dark", name: "Service Dark", category: "maintenance_relic", mechanic: "Pauses one beneficial effect for a sealed minute so its hidden upkeep and dependencies can be inspected.", lore: "A miracle called it sabotage. The night shift called it Tuesday." },
  { id: "succession_fuse", name: "Succession Fuse", category: "office_relic", mechanic: "Transfers one power only when its previous bearer retains the practical ability to refuse the successor.", lore: "It will not conduct through a heroic death because the dead cannot resign." },
  { id: "appealable_crack", name: "Appealable Crack", category: "constitutional_fault", mechanic: "Embeds one explicit revision procedure in a pact or mechanism otherwise treated as permanent.", lore: "The fracture is strongest at the place where an excluded claimant can put one finger." },
]);

const allStateValues = (key, values) => ({ key, mode: "all-values", values });
const stateValuePrecondition = (key, value) => ({ key, mode: "value-precondition", values: [value] });

const QUEST_PORTFOLIO_BY_ID = deepFreeze({
  main_noon_came_bleeding: "main_cosmic",
  main_the_saint_cast_two_shadows: "main_cosmic",
  main_the_bell_that_forgot_you: "main_cosmic",
  main_the_door_in_mothers_rib: "main_cosmic",
  main_parliament_of_one_mouth: "main_cosmic",
  main_archive_of_open_wounds: "main_cosmic",
  main_mercy_has_a_mouth: "main_cosmic",
  main_the_engine_with_an_off_switch: "main_cosmic",
  main_a_sun_small_enough: "main_cosmic",
  side_the_disease_called_grief: "character_guest_follower",
  side_seven_lamps_for_six_streets: "settlement",
  side_the_hospice_grows_a_heart: "profession_systemic",
  side_the_dead_vote_no: "settlement",
  aftermath_house_outlived_tenants: "world_state_reaction",
  aftermath_census_of_absences: "settlement",
  aftermath_purity_blooms_at_dusk: "relic_creature_ecology",
  aftermath_cart_accepts_office: "settlement",
  aftermath_village_arrives_before_dead: "world_state_reaction",
  aftermath_every_door_mothers_voice: "faction_schism",
  aftermath_roof_made_of_weather: "regional",
  aftermath_child_older_than_road: "character_guest_follower",
  aftermath_three_hands_one_lever: "profession_systemic",
  aftermath_maintenance_window_miracle: "profession_systemic",
  aftermath_person_engine_must_outlive: "character_guest_follower",
  aftermath_cost_that_learned_to_vote: "world_state_reaction",
});

const quest = (record) => ({
  schemaVersion: 2,
  portfolioId: QUEST_PORTFOLIO_BY_ID[record.id],
  creatureIds: record.creatureIds ?? [],
  stateReads: record.stateReads ?? [],
  stateWrites: [{ domain: record.stateDomain, key: record.consequenceId, values: record.outcomes }],
  ...record,
});

export const EXPANSION_QUESTS = deepFreeze([
  quest({
    id: "main_noon_came_bleeding", chainId: "the_returning_light", order: 1, type: "main", title: "When Noon Came Bleeding", giverId: "enoch_last_lamplighter", supportingCharacterIds: ["nima_sorn_keeper_of_one_shadow"], stateDomain: "admission", stateReads: [],
    premise: "A vertical wound of daylight appears above Hearthmere and begins repairing buildings while erasing the shadows of their residents.",
    primaryMechanicId: "escort_light_by_moving_cover", dilemmaId: "save_repaired_homes_or_shadowless_people", locationId: "hearthmere_dusk_circuit", consequenceId: "first_synod_welcome",
    objectives: [{ type: "diagnose", target: "bleeding_noon_wound" }, { type: "escort_rule", target: "moving_shade_cart", rule: "Keep the daylight wound covered without letting the cart enter complete darkness." }, { type: "choice", target: "close_or_stabilize_wound" }],
    outcomes: ["homes_restored_residents_marked", "wound_closed_homes_remain_ruined", "noon_shared_with_dunmire"], rewardItemIds: ["obedient_noon_splinter"],
    loreReveal: "The returning light restores structures according to remembered purpose, not according to the wishes of current occupants.",
    dialogueThesis: "A miracle can be accurate and still be wrong.",
    authorshipProof: { setpiece: "A mobile shade cart circles a vertical noon wound while repaired houses shed their occupants' shadows.", failureTransformation: "Losing cover does not reset the escort; it permanently assigns the exposed resident a Synod purity mark.", dialogueConstraint: "Nima refuses every sentence containing the word restored until the player names what restoration removed.", persistentWorldChange: "Hearthmere keeps either rebuilt facades, a shadow-refuge district, or a shared Dunmire noon route.", forbiddenSubstitution: "Cannot be reskinned as a cargo escort because cover position rewrites named residents and buildings." },
  }),
  quest({
    id: "main_the_saint_cast_two_shadows", chainId: "the_returning_light", order: 2, type: "main", title: "The Saint Cast Two Shadows", giverId: "saint_vespera_second_shadow", supportingCharacterIds: ["ilar_rook_unhoused_shadow"], stateDomain: "authority", stateReads: [allStateValues("first_synod_welcome", ["homes_restored_residents_marked", "wound_closed_homes_remain_ruined", "noon_shared_with_dunmire"])],
    premise: "Vespera's second shadow commits acts of rescue she publicly condemns and executions she swears she never ordered.",
    primaryMechanicId: "interrogate_actions_from_two_timelines", dilemmaId: "free_shadow_or_preserve_sanctuary", locationId: "vespera_processional_ruin", consequenceId: "vespera_shadow_relation",
    objectives: [{ type: "witness_replay", target: "three_shadow_crimes", required: 3 }, { type: "dialogue_trial", target: "light_vespera_and_shadow_vespera", rule: "Every question may be asked to only one version." }, { type: "ritual_choice", target: "black_halo_nail" }],
    outcomes: ["second_shadow_freed", "shadow_refuge_preserved", "vespera_reintegrated"], rewardItemIds: ["black_halo_nail"],
    loreReveal: "A Synod saint is a mortal continuity edited into a law of light, not a heavenly visitor.",
    dialogueThesis: "A divided self may be more honest than a unified saint.",
    authorshipProof: { setpiece: "The player reconstructs one gesture from two incompatible shadow angles while each half rescues a different witness.", failureTransformation: "A misattributed act becomes binding testimony for the wrong Vespera rather than restarting the interrogation.", dialogueConstraint: "Ilar speaks only about deeds seen in shadow and physically turns away from claims made in direct light.", persistentWorldChange: "The saint remains unified, separates into two legal persons, or grants the shadow supervised asylum.", forbiddenSubstitution: "Cannot become an ordinary impostor mystery; both actors are authentic continuations of one coerced sainthood." },
  }),
  quest({
    id: "main_the_bell_that_forgot_you", chainId: "the_returning_light", order: 3, type: "main", title: "The Bell That Forgot You", giverId: "deacon_halix_bell_of_noon", supportingCharacterIds: ["oren_lusk_last_calendarer"], stateDomain: "memory", stateReads: [
      allStateValues("first_synod_welcome", ["homes_restored_residents_marked", "wound_closed_homes_remain_ruined", "noon_shared_with_dunmire"]),
      allStateValues("vespera_shadow_relation", ["second_shadow_freed", "shadow_refuge_preserved", "vespera_reintegrated"]),
    ],
    premise: "Halix restores natural time to three villages, but each toll deletes one relationship from the player's social history.",
    primaryMechanicId: "trade_relationships_for_time", dilemmaId: "restore_seasons_or_keep_bonds", locationId: "three_stopped_villages", consequenceId: "calendar_and_relationship_rewrite",
    objectives: [{ type: "synchronize", target: "three_noon_marks", required: 3 }, { type: "sacrifice_selection", target: "relationship_memory", rule: "Choose which bond the next toll may consume." }, { type: "counter_toll", target: "halix_missing_name" }],
    outcomes: ["seasons_restored_bond_lost", "halix_silenced_time_stays_broken", "debt_transferred_to_synod"], rewardItemIds: ["memory_suture"],
    loreReveal: "Halix's noon is powered by remembered social order; time returns by consuming relationships that prove change occurred.",
    dialogueThesis: "A calendar without anyone who remembers you is another kind of death.",
    authorshipProof: { setpiece: "A repaired bell note moves through town as visible noon geometry while names disappear from doors in its wake.", failureTransformation: "Every mistimed bell strike restores one civic routine but severs the relationship that taught it.", dialogueConstraint: "Oren can answer only with dates until another character supplies the name attached to each date.", persistentWorldChange: "The district receives natural time, relational memory, or an unstable alternating calendar.", forbiddenSubstitution: "Cannot be reduced to a rhythm puzzle because each beat trades a documented relationship for physical repair." },
  }),
  quest({
    id: "main_the_door_in_mothers_rib", chainId: "the_returning_light", order: 4, type: "main", title: "The Door in Mother's Rib", giverId: "mother_nacre_open_rib", supportingCharacterIds: ["ilyen_doorborn_outer_age"], stateDomain: "admission", stateReads: [allStateValues("calendar_and_relationship_rewrite", ["seasons_restored_bond_lost", "halix_silenced_time_stays_broken", "debt_transferred_to_synod"])],
    premise: "A refugee village hidden inside Mother Nacre has remained safe for centuries and now wants the door opened despite the lethal passage of time outside.",
    primaryMechanicId: "phase_village_between_body_and_world", dilemmaId: "freedom_now_or_safety_without_consent", locationId: "nacre_internal_village", consequenceId: "refugee_time_release",
    objectives: [{ type: "enter_living_space", target: "rib_door" }, { type: "civic_vote", target: "internal_village", rule: "Residents receive different evidence depending on which organs are repaired." }, { type: "body_route", target: "safe_exit_artery" }, { type: "choice", target: "open_seal_or_move_sanctuary" }],
    outcomes: ["village_released_into_late_world", "sanctuary_made_consensual", "nacre_keeps_closed_village"], rewardItemIds: ["rib_door_key"],
    loreReveal: "The Charnel Night began as shelters built from bodies when ordinary architecture stopped surviving the dark.",
    dialogueThesis: "Protection without an exit is a kinder prison, not a home.",
    authorshipProof: { setpiece: "A centuries-old village votes inside a rib cage while the player's route through living arteries changes which evidence reaches each ward.", failureTransformation: "A blocked artery does not end the vote; it isolates a neighborhood and makes its uninformed ballot legally decisive.", dialogueConstraint: "Ilyen alternates a child's present tense with an elder's outside chronology and never reconciles them for the player.", persistentWorldChange: "The sanctuary opens, becomes consensual and mobile, or remains closed under an explicit act of captivity.", forbiddenSubstitution: "Cannot become a prison-break template because the prison is also a protective body and a self-governing settlement." },
  }),
  quest({
    id: "main_parliament_of_one_mouth", chainId: "the_returning_light", order: 5, type: "main", title: "Parliament of One Mouth", giverId: "prince_thirteen_throats", supportingCharacterIds: ["sava_quiet_thirteenth_auditor"], stateDomain: "authority", stateReads: [allStateValues("refugee_time_release", ["village_released_into_late_world", "sanctuary_made_consensual", "nacre_keeps_closed_village"])],
    premise: "Thirteen voices negotiate one treaty, but one has never consented to being part of the Prince.",
    primaryMechanicId: "conduct_multi_voice_treaty", dilemmaId: "valid_treaty_or_free_stolen_voice", locationId: "mute_amphitheatre", consequenceId: "charnel_diplomatic_status",
    objectives: [{ type: "voice_mapping", target: "thirteen_throats", required: 13 }, { type: "silence_timing", target: "deliberate_rest" }, { type: "consent_audit", target: "thirteenth_ballot" }, { type: "choice", target: "ratify_or_disassemble_prince" }],
    outcomes: ["treaty_ratified_with_dissent", "stolen_voices_released", "sun_voice_given_casting_vote"], rewardItemIds: ["thirteenth_ballot"],
    loreReveal: "One voice inside the Prince predates the dimming and can name the law that separated light from darkness.",
    dialogueThesis: "Perfect representation is still violence if the represented cannot leave.",
    authorshipProof: { setpiece: "Thirteen anatomical throats conduct a treaty in a circular cadence whose single silence carries a fourteenth political position.", failureTransformation: "Misidentifying a voice transfers its treaty obligation to another throat instead of cancelling negotiation.", dialogueConstraint: "Sava records consent without paraphrase and challenges any answer that collapses two voices into a group noun.", persistentWorldChange: "The Prince becomes a ratified polity, releases the stolen speakers, or gives the sun-voice a casting vote.", forbiddenSubstitution: "Cannot be reskinned as a council dialogue because representation and captivity share the same thirteen bodies." },
  }),
  quest({
    id: "main_archive_of_open_wounds", chainId: "the_returning_light", order: 6, type: "main", title: "The Archive of Open Wounds", giverId: "wound_scribe_keth", supportingCharacterIds: ["mira_drel_bearer_of_margin_four"], stateDomain: "memory", stateReads: [allStateValues("charnel_diplomatic_status", ["treaty_ratified_with_dissent", "stolen_voices_released", "sun_voice_given_casting_vote"])],
    premise: "Keth offers proof that mortals consented to dismantling the sun, but the record can be read only by assigning its original pain to living witnesses.",
    primaryMechanicId: "allocate_historical_pain", dilemmaId: "truth_with_harm_or_merciful_uncertainty", locationId: "scar_margin_archive", consequenceId: "public_origin_truth",
    objectives: [{ type: "archive_reconstruction", target: "four_wound_margins", required: 4 }, { type: "burden_assignment", target: "willing_witnesses", rule: "No witness can carry two injuries and every unassigned wound redacts part of the truth." }, { type: "publish_choice", target: "sun_dismantling_record" }],
    outcomes: ["full_truth_published", "partial_truth_withheld", "pain_taken_by_player"], rewardItemIds: ["wound_margin_quill"],
    loreReveal: "The old world dismantled its sun to stop a divine empire from using daylight as compulsory truth.",
    dialogueThesis: "A painless history is usually the victor's preferred injury.",
    authorshipProof: { setpiece: "Four hinged wound margins replay mutually incomplete bas-relief histories only while four different witnesses carry their pain.", failureTransformation: "An unassigned margin redacts one causal link and produces a coherent but politically dangerous false history.", dialogueConstraint: "Mira states where each fact hurts before describing what it proves, and will not call suffering evidence without a bearer.", persistentWorldChange: "The dismantling record becomes public, partial, or privately embodied by the player.", forbiddenSubstitution: "Cannot become a collectible-lore quest because reading is an allocation of present harm with named consent." },
  }),
  quest({
    id: "main_mercy_has_a_mouth", chainId: "the_returning_light", order: 7, type: "main", title: "Mercy Has a Mouth", giverId: "maw_behind_mercy", supportingCharacterIds: ["fenn_vargo_counter_of_teeth"], stateDomain: "obligation", stateReads: [allStateValues("public_origin_truth", ["full_truth_published", "partial_truth_withheld", "pain_taken_by_player"])],
    premise: "The only safe route to the Synod's dawn engine passes through the restrained Maw, which asks the party to trust that it can carry them without feeding.",
    primaryMechanicId: "navigate_trust_inside_predator", dilemmaId: "feed_maw_or_risk_companions", locationId: "interior_of_restrained_maw", consequenceId: "maw_trust_appetite_balance",
    objectives: [{ type: "pact", target: "mercy_maw_token" }, { type: "interior_navigation", target: "unconsumed_path", rule: "Each light used for navigation increases hunger; each extinguished light hides one companion." }, { type: "temptation_refusal", target: "three_edible_memories", required: 3 }],
    outcomes: ["maw_proves_restraint", "maw_fed_chosen_memory", "party_cuts_emergency_exit"], rewardItemIds: ["mercy_maw_token"],
    loreReveal: "The Maw holds the dark half of the First Light and may be a necessary organ of any survivable sun.",
    dialogueThesis: "Trust is not certainty that hunger vanished; it is a negotiated risk with teeth.",
    authorshipProof: { setpiece: "Party members navigate one unconsumed path inside a sentient predator while every lamp simultaneously reveals a route and increases hunger.", failureTransformation: "A hidden companion is not teleported back; the Maw must choose whether to surrender a tempting memory to return them.", dialogueConstraint: "Fenn counts teeth only after acts of mercy and refuses to treat a promise as evidence before the count changes.", persistentWorldChange: "The Maw proves restraint, is fed a chosen memory, or carries a permanent emergency wound cut by the party.", forbiddenSubstitution: "Cannot become a dungeon traversal because the dungeon is a negotiating ally whose appetite is altered by navigation." },
  }),
  quest({
    id: "main_the_engine_with_an_off_switch", chainId: "the_returning_light", order: 8, type: "main", title: "The Engine With an Off-Switch", giverId: "tor_vannic_defector_of_dawn", supportingCharacterIds: ["pella_vein_keeper_of_last_failure"], stateDomain: "authority", stateReads: [allStateValues("maw_trust_appetite_balance", ["maw_proves_restraint", "maw_fed_chosen_memory", "party_cuts_emergency_exit"])],
    premise: "Tor can add mortality to the dawn engine, but only by making its shutdown depend on one fallible person's continued life.",
    primaryMechanicId: "design_failure_modes_as_moral_choices", dilemmaId: "central_off_switch_or_distributed_unreliable_veto", locationId: "cinderward_law_forge", consequenceId: "dawn_shutdown_architecture",
    objectives: [{ type: "prototype", target: "three_shutdown_designs", required: 3 }, { type: "stress_test", target: "simulated_restoration_crises", required: 3 }, { type: "governance_choice", target: "off_switch_owner" }],
    outcomes: ["player_holds_off_switch", "settlements_share_veto", "engine_has_no_shutdown"], rewardItemIds: ["portable_off_switch"],
    loreReveal: "Restoration is an engineered process with owners and failure modes, not an inevitable prophecy.",
    dialogueThesis: "A god with an off-switch is a machine; a machine without one is a god by negligence.",
    authorshipProof: { setpiece: "Three miniature dawn disasters run concurrently while the player physically rewires who can halt each beneficial catastrophe.", failureTransformation: "A failed stress test survives as a permanent known fault that one settlement must knowingly inherit.", dialogueConstraint: "Pella describes only prior failures; every proposal must be phrased as the specific death it is willing to risk repeating.", persistentWorldChange: "Shutdown authority belongs to the player, a distributed settlement veto, or no mortal actor.", forbiddenSubstitution: "Cannot be a crafting recipe because governance ownership, not component quality, is the mechanical output." },
  }),
  quest({
    id: "main_a_sun_small_enough", chainId: "the_returning_light", order: 9, type: "main", title: "A Sun Small Enough", giverId: "arch_lumen_seraphel_orr", supportingCharacterIds: ["solenne_marrow_child_of_both_skies"], stateDomain: "admission", stateReads: [
      allStateValues("first_synod_welcome", ["homes_restored_residents_marked", "wound_closed_homes_remain_ruined", "noon_shared_with_dunmire"]),
      allStateValues("vespera_shadow_relation", ["second_shadow_freed", "shadow_refuge_preserved", "vespera_reintegrated"]),
      allStateValues("calendar_and_relationship_rewrite", ["seasons_restored_bond_lost", "halix_silenced_time_stays_broken", "debt_transferred_to_synod"]),
      allStateValues("refugee_time_release", ["village_released_into_late_world", "sanctuary_made_consensual", "nacre_keeps_closed_village"]),
      allStateValues("charnel_diplomatic_status", ["treaty_ratified_with_dissent", "stolen_voices_released", "sun_voice_given_casting_vote"]),
      allStateValues("public_origin_truth", ["full_truth_published", "partial_truth_withheld", "pain_taken_by_player"]),
      allStateValues("maw_trust_appetite_balance", ["maw_proves_restraint", "maw_fed_chosen_memory", "party_cuts_emergency_exit"]),
      allStateValues("dawn_shutdown_architecture", ["player_holds_off_switch", "settlements_share_veto", "engine_has_no_shutdown"]),
    ],
    premise: "All factions converge on the final crucible, where the player must define which laws the next sun possesses and which beings it is allowed to judge.",
    primaryMechanicId: "assemble_limited_cosmology", dilemmaId: "warmth_truth_growth_or_universal_admission", locationId: "crucible_at_worlds_late_edge", consequenceId: "campaign_cosmology_ending",
    objectives: [{ type: "law_selection", target: "small_sun_crucible", rule: "Choose a limited set of incompatible light laws earned by prior outcomes." }, { type: "faction_witness", target: "three_power_testimonies", required: 3 }, { type: "final_constitution", target: "admission_to_daylight" }],
    outcomes: ["mortal_dawn", "synod_full_restoration", "negotiated_dusk", "sun_refused_world_continues_dying"], rewardItemIds: ["small_sun_crucible"],
    loreReveal: "The next age is not selected by morality points; it is constituted from every cost the player previously made someone else carry.",
    dialogueThesis: "Salvation becomes tyranny at the exact boundary where it stops asking who survives it.",
    authorshipProof: { setpiece: "Incompatible laws of warmth, truth, growth, and admission orbit a hand-sized crucible while prior quest consequences speak as witnesses.", failureTransformation: "An unstable law is not rejected; it enters the new cosmology with a named exception inherited from the campaign ledger.", dialogueConstraint: "Solenne answers each faction in the vocabulary of the sky that would reject her and never endorses a universal solution.", persistentWorldChange: "The campaign constitutes a mortal dawn, full restoration, negotiated dusk, or deliberate continuation of the Late World.", forbiddenSubstitution: "Cannot become a colored-ending choice because every available law and exception is earned from persistent prior state." },
  }),
  quest({
    id: "side_the_disease_called_grief", chainId: "vaels_casebook", order: 1, type: "side", title: "The Disease Called Grief", giverId: "canoness_vael_kindly_knife", supportingCharacterIds: ["davren_holt_widower_of_unrecorded_wife"], stateDomain: "memory", stateReads: [allStateValues("first_synod_welcome", ["homes_restored_residents_marked", "wound_closed_homes_remain_ruined", "noon_shared_with_dunmire"])],
    premise: "Vael can cure a widower's disabling grief, but the grief is the last surviving evidence that his spouse existed.",
    primaryMechanicId: "separate_symptom_from_witness", dilemmaId: "relieve_grief_or_preserve_erased_person", locationId: "unlit_hospice_memory_ward", consequenceId: "vael_definition_of_care",
    objectives: [{ type: "memory_diagnosis", target: "widowers_grief_layers", required: 4 }, { type: "consent_dialogue", target: "widower_at_four_states" }, { type: "surgical_choice", target: "memory_suture" }],
    outcomes: ["grief_retained_function_restored", "grief_removed_spouse_erased", "memory_shared_with_vael"], rewardItemIds: ["widowers_witness_thread"],
    loreReveal: "The Synod's cleanest miracles often destroy the evidence needed to judge whether the cure was merciful.",
    dialogueThesis: "Pain is not sacred, but neither is relief innocent.",
    authorshipProof: { setpiece: "Four layers of one widower's grief appear as surgical threads linking bodily function to evidence of an erased spouse.", failureTransformation: "Cutting a thread early cures one symptom while making its attached memory permanently unverifiable.", dialogueConstraint: "Davren never supplies his wife's name; the player must discuss her through effects that survive without inventing an idealized portrait.", persistentWorldChange: "Grief remains with restored function, grief and evidence vanish, or Vael becomes a co-bearer of the memory.", forbiddenSubstitution: "Cannot be a cure-or-no-cure dialogue because diagnosis physically separates function, pain, testimony, and identity." },
  }),
  quest({
    id: "side_seven_lamps_for_six_streets", chainId: "remaining_hands", order: 1, type: "side", title: "Seven Lamps for Six Streets", giverId: "enoch_last_lamplighter", supportingCharacterIds: ["roa_nullstreet_seventh_tenant"], stateDomain: "infrastructure", stateReads: [],
    premise: "A seventh municipal lamp illuminates a street absent from every map and populated by people omitted from Hearthmere's ration count.",
    primaryMechanicId: "maintain_route_that_officially_does_not_exist", dilemmaId: "register_hidden_street_or_keep_it_safe", locationId: "hearthmere_unbudgeted_street", consequenceId: "hidden_households_status",
    objectives: [{ type: "maintenance", target: "seven_distinct_lamps", required: 7 }, { type: "map_contradiction", target: "unbudgeted_street" }, { type: "civic_choice", target: "ledger_registration" }],
    outcomes: ["street_registered_and_taxed", "street_hidden_and_underfed", "street_joins_unwritten_roads"], rewardItemIds: ["lamplighters_seventh_wick"],
    loreReveal: "The League's founding arithmetic already excludes people it claims to protect.",
    dialogueThesis: "A place can be saved from danger by the same omission that starves it.",
    authorshipProof: { setpiece: "Seven different lamps reveal six budgeted streets and one moving address that exists only between maintenance rounds.", failureTransformation: "An extinguished lamp relocates Nullstreet and strands a specific household in another jurisdiction rather than resetting the route.", dialogueConstraint: "Roa uses addresses as names and will not describe a person without stating where the ledger refuses to place them.", persistentWorldChange: "Nullstreet becomes registered and taxable, remains hidden and ration-poor, or joins the Unwritten Roads.", forbiddenSubstitution: "Cannot be a lamp-lighting checklist because each lamp changes civic visibility, ration entitlement, and physical geography." },
  }),
  quest({
    id: "side_the_hospice_grows_a_heart", chainId: "remaining_hands", order: 2, type: "side", title: "The Hospice Grows a Heart", giverId: "sister_calve_unlit_hospice", supportingCharacterIds: ["bek_tallow_patient_zero_of_policy"], stateDomain: "authority", stateReads: [allStateValues("vael_definition_of_care", ["grief_retained_function_restored", "grief_removed_spouse_erased", "memory_shared_with_vael"])],
    premise: "The neutral hospice develops a living heart and begins rearranging beds according to Calve's unconscious judgments of whose life is most useful.",
    primaryMechanicId: "debug_living_triage_bias", dilemmaId: "remove_bias_or_remove_predictive_care", locationId: "unlit_hospice_living_ward", consequenceId: "neutral_medicine_governance",
    objectives: [{ type: "observe_triage", target: "six_patient_reorders", required: 6 }, { type: "bias_trace", target: "calves_unspoken_priority" }, { type: "living_structure_edit", target: "hospice_heart_seed" }],
    outcomes: ["heart_made_random", "bias_declared_and_appealable", "heart_destroyed_hospice_manual"], rewardItemIds: ["hospice_heart_seed"],
    loreReveal: "Neutral systems inherit moral choices even when no one writes those choices down.",
    dialogueThesis: "Triage is a story about worth disguised as a queue.",
    authorshipProof: { setpiece: "A newly grown hospice heart rolls six occupied beds through living corridors according to an unspoken hierarchy of usefulness.", failureTransformation: "A patient displaced from care changes the heart's learned bias and later becomes the test case for the next edit.", dialogueConstraint: "Bek discusses policy only through the bed currently denied to someone else and refuses abstract statistics.", persistentWorldChange: "Triage becomes random, biased but appealable, or manual after the living heart is destroyed.", forbiddenSubstitution: "Cannot become a healer fetch quest because the antagonist is an adaptive priority rule inherited from a trusted caregiver." },
  }),
  quest({
    id: "side_the_dead_vote_no", chainId: "remaining_hands", order: 3, type: "side", title: "The Dead Vote No", giverId: "king_ash_without_country", supportingCharacterIds: ["eri_cinderglass_descendant_in_dispute"], stateDomain: "authority", stateReads: [allStateValues("public_origin_truth", ["full_truth_published", "partial_truth_withheld", "pain_taken_by_player"])],
    premise: "Three destroyed settlements refuse both Synod restoration and demonic preservation, but their ash testimonies contradict the King who speaks for them.",
    primaryMechanicId: "verify_posthumous_civic_consent", dilemmaId: "honor_dead_refusal_or_help_living_descendants", locationId: "countryless_assize", consequenceId: "dead_settlement_claims",
    objectives: [{ type: "ash_testimony", target: "three_extinct_councils", required: 3 }, { type: "cross_examination", target: "king_plural_voice" }, { type: "seal_choice", target: "countryless_ash_seal" }],
    outcomes: ["cosmic_claims_refused", "descendants_override_dead", "king_loses_speaking_authority"], rewardItemIds: ["countryless_ash_seal"],
    loreReveal: "Even extinction does not resolve who may consent for a place, and remembrance can become another form of occupation.",
    dialogueThesis: "The dead deserve protection from being useful to us.",
    authorshipProof: { setpiece: "Three extinct councils speak through incompatible ash deposits while living descendants physically contest the chair left for each settlement.", failureTransformation: "Disturbing an ash testimony erases one dead vote but strengthens the descendant claim that replaces it.", dialogueConstraint: "Eri distinguishes inheritance, custody, and consent in every reply and never permits the word ancestor to settle all three.", persistentWorldChange: "Cosmic claims are refused, descendants override the dead, or King Ash loses authority to speak for destroyed places.", forbiddenSubstitution: "Cannot be a ghost-vote mystery because the central conflict is jurisdiction between extinct polities and living claimants." },
  }),
  quest({
    id: "aftermath_house_outlived_tenants", chainId: "noon_wound_ward", order: 1, type: "regional", title: "The House That Outlived Its Tenants", giverId: "enoch_last_lamplighter", supportingCharacterIds: ["mara_quoin_counter_deed"], creatureIds: ["deed_eater_wren"], stateDomain: "authority", stateReads: [
      allStateValues("first_synod_welcome", ["homes_restored_residents_marked", "wound_closed_homes_remain_ruined", "noon_shared_with_dunmire"]),
    ],
    premise: "A noon-touched house remembers its obsolete legal purpose as shelter for a vanished bloodline and moves the present family one room closer to the street every midnight.",
    primaryMechanicId: "renegotiate_architecture_by_occupancy", dilemmaId: "inherited_title_present_use_or_building_personhood", locationId: "hearthmere_folded_townhouse", consequenceId: "hearthmere_restored_tenancy",
    objectives: [{ type: "domestic_evidence_placement", target: "genuinely_used_household_objects", rule: "Decorative placement strengthens the dead deed; lived routines strengthen present tenancy." }, { type: "hinge_testimony_sequence", target: "incompatible_doorframes", required: 5 }, { type: "architectural_personhood_ruling", target: "household_and_house_claims" }],
    outcomes: ["present_use_appealable_deed", "inherited_title_with_tenant_terms", "house_public_shelter_person"], rewardItemIds: ["counter_deed_hinge"],
    loreReveal: "Synod restoration reconstructs obsolete law because architecture once served as both civic record and institutional actor.",
    dialogueThesis: "Shelter becomes property only after somebody decides which use of a room counts as testimony.",
    authorshipProof: { setpiece: "A complete townhouse folds room by room around a family eating dinner, exposing centuries of incompatible doorframes without becoming a combat dungeon.", failureTransformation: "A misplaced object permanently assigns its room to a prior generation, leaving the present occupant to negotiate from outside the wall.", dialogueConstraint: "Mara never says own; she distinguishes who repaired, slept in, fled, inherited, and was admitted.", persistentWorldChange: "Present tenants gain an appealable deed, Mara inherits with enforceable tenant terms, or the house becomes a public shelter-person able to refuse both families.", forbiddenSubstitution: "Cannot become a haunted-house eviction story because domestic routine is admissible evidence and the building itself exercises civic authority." },
  }),
  quest({
    id: "aftermath_census_of_absences", chainId: "noon_wound_ward", order: 2, type: "regional", title: "A Census of Absences", giverId: "enoch_last_lamplighter", supportingCharacterIds: ["kessa_pale_absence_clerk"], creatureIds: ["shadow_census_moth"], stateDomain: "admission", stateReads: [
      allStateValues("first_synod_welcome", ["homes_restored_residents_marked", "wound_closed_homes_remain_ruined", "noon_shared_with_dunmire"]),
      allStateValues("hidden_households_status", ["street_registered_and_taxed", "street_hidden_and_underfed", "street_joins_unwritten_roads"]),
    ],
    premise: "Missing shadows gather into a second census queue whose representation, ration obligation, and address depend jointly on the noon wound and Nullstreet's prior civic status.",
    primaryMechanicId: "enumerate_people_and_separated_absences", dilemmaId: "shadow_citizen_injury_dependant_or_property", locationId: "hearthmere_double_census", consequenceId: "hearthmere_absence_citizenship",
    objectives: [{ type: "silhouette_source_attribution", target: "mobile_unowned_shadows", required: 7 }, { type: "dual_queue_reconciliation", target: "bodies_and_absences", rule: "A match grants representation and creates a ration obligation without presuming ownership." }, { type: "absence_status_enactment", target: "negative_roll" }],
    outcomes: ["shadows_gain_separate_seats", "shadows_are_protected_dependants", "mobile_absence_district_created"], rewardItemIds: ["negative_roll"],
    loreReveal: "The League's founding population count assumed fixed noon and cannot represent a separated part of a person without turning it into a budget claim.",
    dialogueThesis: "Counting an absence can rescue it from erasure and still make it administratively captive.",
    authorshipProof: { setpiece: "Two census lines circle one shuttered lamp, bodies on one side and unowned silhouettes on the other, while the visible totals change with every movement of light.", failureTransformation: "A false match fuses the shadow to the named resident until an appeal quest, while an uncounted shadow joins a permanent extra-civic swarm.", dialogueConstraint: "Kessa answers identity questions only by adding or subtracting someone from the total she can physically point to.", persistentWorldChange: "Separated shadows gain civic seats, become protected dependants, or constitute a mobile absence district outside the census.", forbiddenSubstitution: "Cannot be a collect-the-ghosts activity because each attribution changes representation, food allocation, and the legal status of both body and shadow." },
  }),
  quest({
    id: "aftermath_purity_blooms_at_dusk", chainId: "noon_wound_ward", order: 3, type: "regional", title: "Purity Blooms at Dusk", giverId: "canoness_vael_kindly_knife", supportingCharacterIds: ["roen_fitch_dusk_gardener"], creatureIds: ["lumen_tithe_burr"], stateDomain: "ecology", stateReads: [
      allStateValues("first_synod_welcome", ["homes_restored_residents_marked", "wound_closed_homes_remain_ruined", "noon_shared_with_dunmire"]),
      allStateValues("vael_definition_of_care", ["grief_retained_function_restored", "grief_removed_spouse_erased", "memory_shared_with_vael"]),
    ],
    premise: "Noon-touched tissue becomes a beneficial white-gold civic crop whose seed repairs each new host while making its named cultivator liable for every place the strain reaches.",
    primaryMechanicId: "constitute_liability_for_propagating_restoration", dilemmaId: "resident_ownership_public_license_or_sterile_repair", locationId: "hearthmere_breath_and_gutter_seedfront", consequenceId: "hearthmere_purity_ecology",
    objectives: [{ type: "cultivation_warrant_authorship", target: "breaths_gutters_and_shared_walls", required: 6 }, { type: "seed_corridor_custody_transfer", target: "lumen_tithe_burr", rule: "The prior and next custodians must share the live propagation corridor." }, { type: "reproductive_liability_constitution", target: "ward_strain" }],
    outcomes: ["resident_cultivator_liability", "public_seed_licensing", "sterile_last_generation"], rewardItemIds: ["dusk_graft_shears"],
    loreReveal: "Purity marks were colonial seeds engineered to make restored environments reproduce Synod law, and the first Synod gardeners were also debt collectors.",
    dialogueThesis: "A cure that reproduces is also a polity deciding who inherits its costs.",
    authorshipProof: { setpiece: "One white-gold seed front passes through a ward's connected breaths and masonry while every hooked burr turns toward the person who would become liable for its next host.", failureTransformation: "An unwarranted seed roots in a named threshold, makes that household the legal originator of the strain, and gives it standing to refuse later pruning.", dialogueConstraint: "Roen never asks whether the bloom is healthy; he asks who may reproduce it, who answers for it, and who was denied a warrant.", persistentWorldChange: "Marked cultivators own and answer for the strain, a public court licenses every seed corridor, or the beneficial crop becomes sterile after its current generation.", forbiddenSubstitution: "Cannot become a cure-or-pruning quest because its mechanical output is a reproductive property-and-liability constitution for an invasive law." },
  }),
  quest({
    id: "aftermath_cart_accepts_office", chainId: "noon_wound_ward", order: 4, type: "regional", title: "The Cart Accepts Office", giverId: "enoch_last_lamplighter", supportingCharacterIds: ["hobb_marr_shade_driver"], stateDomain: "authority", stateReads: [
      allStateValues("first_synod_welcome", ["homes_restored_residents_marked", "wound_closed_homes_remain_ruined", "noon_shared_with_dunmire"]),
      allStateValues("hidden_households_status", ["street_registered_and_taxed", "street_hidden_and_underfed", "street_joins_unwritten_roads"]),
      allStateValues("hearthmere_absence_citizenship", ["shadows_gain_separate_seats", "shadows_are_protected_dependants", "mobile_absence_district_created"]),
    ],
    premise: "Hearthmere elects its retired shade cart as a nonhuman civic office, and the silent tool must rank conflicting petitions by accepting physical evidence onto one turning axle.",
    primaryMechanicId: "author_precedent_on_a_rotating_docket", dilemmaId: "exposure_history_minority_claim_or_emergency_discretion", locationId: "stationary_cart_assize", consequenceId: "hearthmere_tool_precedent",
    objectives: [{ type: "weighted_exhibit_attachment", target: "numbered_cart_spokes", required: 8 }, { type: "single_rotation_precedent", target: "shade_cart_axle", rule: "Removing an exhibit after rotation counts as destruction of testimony." }, { type: "nonhuman_office_charter", target: "wheel_of_refusal" }],
    outcomes: ["exposure_controls_standing", "least_represented_controls_precedent", "appealable_cart_discretion"], rewardItemIds: ["wheel_of_refusal"],
    loreReveal: "The first League offices were tools granted authority after human officeholders died, and some tools' lawful refusals were later hidden.",
    dialogueThesis: "A public tool becomes an office when its refusal creates obligations rather than inconvenience.",
    authorshipProof: { setpiece: "The cart hangs motionless above the assize while doors, shadows, tax seals, and ruined bricks orbit as weighted evidence around its single axle.", failureTransformation: "An unbalanced wheel makes the heaviest exhibit a permanent presumption that all later claimants must disprove.", dialogueConstraint: "Hobb accepts no abstract fairness claim; every proposal must name the person who waits longer.", persistentWorldChange: "Exposure history controls standing, the least represented class authors first precedent, or the cart becomes an appealable emergency judge required to publish refusals.", forbiddenSubstitution: "Cannot be a route-planning or escort activity because the stationary wheel physically authors evidentiary law." },
  }),
  quest({
    id: "aftermath_village_arrives_before_dead", chainId: "village_outside_mother", order: 1, type: "character", title: "The Village Arrives Before Its Dead", giverId: "mother_nacre_open_rib", supportingCharacterIds: ["tima_vale_twice_born"], stateDomain: "authority", stateReads: [
      allStateValues("refugee_time_release", ["village_released_into_late_world", "sanctuary_made_consensual", "nacre_keeps_closed_village"]),
    ],
    premise: "Sanctuary villagers and their outside descendants enter one kinship hearing while grave markers move backward toward living claimants under the village's established release, consensual, or captive status.",
    primaryMechanicId: "reconcile_nonsequential_kinship", dilemmaId: "ancestral_authority_child_custody_or_neither", locationId: "three_age_family_hearing", consequenceId: "nacre_nonsequential_kinship",
    objectives: [{ type: "age_reversing_heirloom_transfer", target: "ancestor_descendant_table", required: 4 }, { type: "kinship_authority_separation", target: "custody_affection_and_command", rule: "Each relationship must travel by a different transfer path." }, { type: "premature_grave_appeal", target: "living_claimants" }],
    outcomes: ["kinship_separated_from_authority", "released_claim_ancestral_leadership", "village_treated_as_foreign_polity"], rewardItemIds: ["untimely_heirloom"],
    loreReveal: "Nacre's sanctuary suspended biological time but not legal inheritance, enabling centuries of decisions made in absent people's names.",
    dialogueThesis: "Descent can make a child older than a government without making that child its ruler.",
    authorshipProof: { setpiece: "A family meal spans three incompatible ages while graves arrive at the table before the living people named on them have died.", failureTransformation: "A mistaken heirloom transfer prematurely completes one grave and removes its living claimant from that family line without killing them.", dialogueConstraint: "Tima distinguishes older than me, born after me, and responsible for me; she never uses elder as a shortcut.", persistentWorldChange: "Kinship is separated from authority, released ancestors claim leadership, or descendants recognize the sanctuary village as a foreign polity.", forbiddenSubstitution: "Cannot become a time-travel reunion because no timeline changes; age, descent, custody, and responsibility conflict entirely in the present." },
  }),
  quest({
    id: "aftermath_every_door_mothers_voice", chainId: "village_outside_mother", order: 2, type: "character", title: "Every Door Has Mother's Voice", giverId: "mother_nacre_open_rib", supportingCharacterIds: ["parn_exit_law"], creatureIds: ["threshold_lamb"], stateDomain: "admission", stateReads: [
      allStateValues("refugee_time_release", ["village_released_into_late_world", "sanctuary_made_consensual", "nacre_keeps_closed_village"]),
      allStateValues("nacre_nonsequential_kinship", ["kinship_separated_from_authority", "released_claim_ancestral_leadership", "village_treated_as_foreign_polity"]),
    ],
    premise: "The village's settled political status does not decide whether Mother's summons inside each bodily door can be revoked when lethal outside weather makes coercive protection genuinely useful.",
    primaryMechanicId: "stress_test_consent_under_summons", dilemmaId: "revocable_exit_under_protector_controlled_risk", locationId: "hundred_rib_door_passage", consequenceId: "nacre_exit_rights",
    objectives: [{ type: "escalating_exit_reason_staging", target: "resident_body_doors", required: 5 }, { type: "revocation_clause_embodiment", target: "outward_hinges", rule: "Every promise must retain an executable withdrawal procedure during danger." }, { type: "maternal_override_judgment", target: "one_real_emergency_passage" }],
    outcomes: ["summons_individually_revocable", "civic_override_of_mother", "unconditional_protection_named_captivity"], rewardItemIds: ["revocation_latch"],
    loreReveal: "Charnel sanctuary contracts arose after bodies became architecture; their oldest word for consent means a door able to shame its wall.",
    dialogueThesis: "Consent is decorative if the protector controls the danger, timing, and body through which refusal must pass.",
    authorshipProof: { setpiece: "Hundreds of body-doors open outward at once while one maternal voice travels through their hinges and the outside weather becomes genuinely lethal.", failureTransformation: "A recalled resident returns with one revocation clause physically removed from their door, narrowing every later stress test.", dialogueConstraint: "Parn accepts no promise stated without its revocation procedure.", persistentWorldChange: "Summons become individually revocable, a civic board can override Mother, or residents choose unconditional protection and explicitly name it captivity.", forbiddenSubstitution: "Cannot be a jailbreak because the exit exists, the danger is real, and the captor actively wants a consent rule she does not know how to obey." },
  }),
  quest({
    id: "aftermath_roof_made_of_weather", chainId: "village_outside_mother", order: 3, type: "regional", title: "A Roof Made of Weather", giverId: "mother_nacre_open_rib", supportingCharacterIds: ["orra_rain_in_ribs"], creatureIds: ["eave_lung"], stateDomain: "infrastructure", stateReads: [
      allStateValues("refugee_time_release", ["village_released_into_late_world", "sanctuary_made_consensual", "nacre_keeps_closed_village"]),
      allStateValues("nacre_exit_rights", ["summons_individually_revocable", "civic_override_of_mother", "unconditional_protection_named_captivity"]),
    ],
    premise: "The sanctuary's protected climate becomes load-bearing anatomy and steals rain from named farms, whether it now shelters an outside settlement, scheduled excursions, or a still-captive interior.",
    primaryMechanicId: "redistribute_weather_as_structure", dilemmaId: "private_climate_public_rain_or_watershed_rule", locationId: "migrating_storm_roof", consequenceId: "nacre_weather_custody",
    objectives: [{ type: "pressure_path_reallocation", target: "living_eaves_fields_and_streets", required: 6 }, { type: "named_drought_accounting", target: "every_sealed_leak", rule: "No leak may close until the farm losing its cloud is named." }, { type: "emergent_lung_bargain", target: "misallocated_rain_current" }],
    outcomes: ["village_private_storm_rationed", "farms_hold_weather_priority", "watershed_council_governs_roof"], rewardItemIds: ["borrowed_eave"],
    loreReveal: "Some Charnel bodies enclosed pieces of climate when the long dark broke ordinary weather, making shelter and watershed one anatomy.",
    dialogueThesis: "A safe roof is not private when its dry interior is built from somebody else's drought.",
    authorshipProof: { setpiece: "A roofless village hangs beneath one migrating storm whose ribs become rafters only where somebody accepts the drought below.", failureTransformation: "A pressure mistake births an Eave Lung that permanently owns one rain current and must be bargained with in later play.", dialogueConstraint: "Orra never describes weather as natural; she names who is under it and who paid for it.", persistentWorldChange: "The village keeps a rationed private storm, farms gain priority over shelter, or a watershed council governs the living roof.", forbiddenSubstitution: "Cannot become ordinary water allocation because weather is load-bearing anatomy and mechanical failure creates a sovereign negotiable organism." },
  }),
  quest({
    id: "aftermath_child_older_than_road", chainId: "village_outside_mother", order: 4, type: "regional", title: "The Child Older Than the Road", giverId: "enoch_last_lamplighter", supportingCharacterIds: ["pell_nacreyear_road_witness"], stateDomain: "obligation", stateReads: [
      allStateValues("refugee_time_release", ["village_released_into_late_world", "sanctuary_made_consensual", "nacre_keeps_closed_village"]),
      allStateValues("nacre_exit_rights", ["summons_individually_revocable", "civic_override_of_mother", "unconditional_protection_named_captivity"]),
      allStateValues("nacre_weather_custody", ["village_private_storm_rationed", "farms_hold_weather_priority", "watershed_council_governs_roof"]),
    ],
    premise: "The Unwritten Roads deny that the sanctuary ever had an outside route, but Pell's body carries social turns older than the landscape that could reconnect freedom, formalize passage, or breach captivity.",
    primaryMechanicId: "walk_a_route_stored_in_social_memory", dilemmaId: "restore_ancestral_reach_preserve_forgetting_or_new_obligation", locationId: "pell_unfolded_black_heath", consequenceId: "nacre_external_route",
    objectives: [{ type: "relationship_direction_recitation", target: "historical_turns", required: 7 }, { type: "obligation_gated_traversal", target: "approaching_unwritten_roads", rule: "Each segment appears only when two travelers accurately state what they owed at that turn." }, { type: "road_personhood_constitution", target: "forgotten_sanctuary_route" }],
    outcomes: ["ancestral_road_restored", "road_forgetting_upheld", "present_obligation_route_constituted"], rewardItemIds: ["roadless_birthday"],
    loreReveal: "Unwritten Roads forget locations deliberately when accurate memory would make escape impossible.",
    dialogueThesis: "A road may owe fugitives its forgetting more than descendants its return.",
    authorshipProof: { setpiece: "Pell unfolds into a human-scale sequence of bends across empty black heath while roads approach, recognize one turn, and recoil from the next.", failureTransformation: "A false obligation creates a permanent valid spur claimed by someone excluded from the original village.", dialogueConstraint: "Pell never uses compass directions; he navigates by promises kept, broken, and inherited.", persistentWorldChange: "The ancestral road returns, its chosen forgetting is upheld, or a new route is constituted entirely from present obligations.", forbiddenSubstitution: "Cannot be a map-fragment hunt because the road is a moral witness and traversal depends on relationship truth rather than recovered geometry." },
  }),
  quest({
    id: "aftermath_three_hands_one_lever", chainId: "mortality_in_dawn_engine", order: 1, type: "faction", title: "Three Hands on One Lever", giverId: "tor_vannic_defector_of_dawn", supportingCharacterIds: ["gannet_triune_veto_clerk"], stateDomain: "authority", stateReads: [
      allStateValues("dawn_shutdown_architecture", ["player_holds_off_switch", "settlements_share_veto", "engine_has_no_shutdown"]),
    ],
    premise: "The ratified shutdown architecture works exactly as designed but cannot determine whether its authority follows a named operator, a continuing institution, or the people now carrying the greatest risk.",
    primaryMechanicId: "adjudicate_control_identity_after_change", dilemmaId: "named_operator_continuing_office_or_exposed_population", locationId: "triune_dawn_control_chambers", consequenceId: "dawn_control_identity",
    objectives: [{ type: "continuity_claim_authentication", target: "person_office_and_exposed_claimant", required: 3 }, { type: "real_emergency_control_trial", target: "existing_shutdown_architecture", rule: "Every pull preserves the selected architecture while changing what evidence it recognizes next time." }, { type: "coauthored_error_adjudication", target: "mistaken_claimant_record" }],
    outcomes: ["authority_tracks_named_operator", "authority_tracks_continuing_institution", "authority_tracks_exposure_to_harm"], rewardItemIds: ["divided_handle"],
    loreReveal: "Divine machinery never solved political identity; it fossilized whichever proof of continuity its last operators supplied.",
    dialogueThesis: "Control can remain unchanged while the identity authorized to exercise it becomes a new political choice.",
    authorshipProof: { setpiece: "One impossible handle passes through three civic chambers while a mortal hand, an office glove, and a heat-scarred communal prosthesis pull from mutually valid positions.", failureTransformation: "A wrongly authenticated pull records the mistaken claimant as co-author of the next control act, forcing later emergencies to include or publicly overrule them.", dialogueConstraint: "Gannet refuses continuity as a noun; every claimant must name what persists, what changed, and who bears harm while records catch up.", persistentWorldChange: "Control identity follows named operators, continuing institutions, or present exposure to harm without redesigning the existing shutdown architecture.", forbiddenSubstitution: "Cannot reselect centralized, distributed, or absent shutdown because those architectures are immutable input; only the authorized actor's continuity is adjudicated." },
  }),
  quest({
    id: "aftermath_maintenance_window_miracle", chainId: "mortality_in_dawn_engine", order: 2, type: "faction", title: "Maintenance Window for a Miracle", giverId: "tor_vannic_defector_of_dawn", supportingCharacterIds: ["meret_spall_night_engineer"], creatureIds: ["veto_gasket_choir"], stateDomain: "infrastructure", stateReads: [
      allStateValues("dawn_shutdown_architecture", ["player_holds_off_switch", "settlements_share_veto", "engine_has_no_shutdown"]),
      allStateValues("dawn_control_identity", ["authority_tracks_named_operator", "authority_tracks_continuing_institution", "authority_tracks_exposure_to_harm"]),
    ],
    premise: "A cracked light law needs seven one-minute intervals of local absence, with authorization and bypass form composed from the selected shutdown architecture and recognized control identity.",
    primaryMechanicId: "schedule_darkness_across_dependencies", dilemmaId: "maintenance_priority_and_stoppable_miracle", locationId: "seven_ring_dawn_service_array", consequenceId: "dawn_maintenance_constitution",
    objectives: [{ type: "seven_interval_dependency_schedule", target: "crops_workers_wards_and_ceasefire", required: 7 }, { type: "darkness_authority_escrow", target: "each_off_and_on_act", rule: "No dependency survives all seven intervals and none may remain continuously powered." }, { type: "service_promise_reconciliation", target: "shifted_tolerance_windows" }],
    outcomes: ["public_rotating_maintenance", "permanent_noon_hidden_worker_deaths", "charnel_maintained_dark_interval"], rewardItemIds: ["service_dark"],
    loreReveal: "Synod miracles were engineered with maintenance liturgies and declared eternal only after mortal technicians used stoppages to bargain.",
    dialogueThesis: "A benefit that cannot pause for inspection is an authority claim disguised as reliability.",
    authorshipProof: { setpiece: "Seven rings of artificial noon extinguish one by one while crops, altered workers, defensive wards, and a Charnel ceasefire unfold only in their assigned darkness.", failureTransformation: "Overexposure changes which later minute a dependency can tolerate and forces a new public promise instead of killing it or resetting the schedule.", dialogueConstraint: "Meret will not use emergency for any consequence known before the schedule was approved.", persistentWorldChange: "The engine adopts public rotating maintenance, permanent noon concealing worker deaths, or a Charnel-maintained dark interval.", forbiddenSubstitution: "Cannot become a timed-defense encounter because darkness is a scheduled public resource whose known dependencies renegotiate after every minute." },
  }),
  quest({
    id: "aftermath_person_engine_must_outlive", chainId: "mortality_in_dawn_engine", order: 3, type: "character", title: "The Person the Engine Must Outlive", giverId: "tor_vannic_defector_of_dawn", supportingCharacterIds: ["jorem_mortality_bearer"], stateDomain: "obligation", stateReads: [
      stateValuePrecondition("dawn_shutdown_architecture", "player_holds_off_switch"),
      allStateValues("dawn_maintenance_constitution", ["public_rotating_maintenance", "permanent_noon_hidden_worker_deaths", "charnel_maintained_dark_interval"]),
    ],
    premise: "Only when the player holds the mortal off-switch, Jorem is asked to bear that office and every faction targets or protects his continued life while he insists on the enforceable right to resign.",
    primaryMechanicId: "transfer_mortal_dependency_without_ownership", dilemmaId: "human_key_distributed_identity_or_vacant_mortal_office", locationId: "three_succession_chambers", consequenceId: "dawn_mortal_succession",
    objectives: [{ type: "identity_fragment_allocation", target: "pulse_name_and_shadow", required: 3 }, { type: "successor_refusal_demonstration", target: "candidate_chambers", rule: "No candidate may receive biometric, legal, and remembered identity together." }, { type: "resignation_path_execution", target: "jorem_mortal_office" }],
    outcomes: ["three_person_succession", "jorem_has_enforceable_resignation", "mortal_office_left_vacant"], rewardItemIds: ["succession_fuse"],
    loreReveal: "Mortality was added to divine machinery not as weakness, but as an officeholder's right to end, resign, and be replaced.",
    dialogueThesis: "A person kept alive as infrastructure is already imprisoned even when everyone calls the prison protection.",
    authorshipProof: { setpiece: "Jorem's shadow, pulse, and sworn name occupy three succession chambers while his living body walks freely between them.", failureTransformation: "A rejected candidate retains the identity fragment already carried and becomes a partial unauthorized shutdown path.", dialogueConstraint: "Jorem rejects every appeal to duty that does not include a lawful way for him to quit.", persistentWorldChange: "The mortal office gains a three-person succession, remains with Jorem under enforceable resignation, or is left vacant and the engine becomes harder to stop.", forbiddenSubstitution: "Cannot become an escort-the-key-person quest because bodily safety without resignation is the failure and identity itself is divided among successors." },
  }),
  quest({
    id: "aftermath_cost_that_learned_to_vote", chainId: "mortality_in_dawn_engine", order: 4, type: "world", title: "The Cost That Learned to Vote", giverId: "tor_vannic_defector_of_dawn", supportingCharacterIds: ["della_quorum_unseated_cost"], stateDomain: "obligation", stateReads: [
      allStateValues("dawn_control_identity", ["authority_tracks_named_operator", "authority_tracks_continuing_institution", "authority_tracks_exposure_to_harm"]),
      allStateValues("dawn_maintenance_constitution", ["public_rotating_maintenance", "permanent_noon_hidden_worker_deaths", "charnel_maintained_dark_interval"]),
    ],
    premise: "The ratified maintenance regime produces a living claimant that did not exist, was hidden, or lacked recognized species standing when its continuing operating cost was assigned.",
    primaryMechanicId: "appeal_an_inherited_operating_cost", dilemmaId: "durable_law_nonconsenting_claimant_or_returned_benefit", locationId: "maintenance_fracture_ratification_floor", consequenceId: "dawn_inherited_maintenance_cost",
    objectives: [{ type: "historic_standing_reconstruction", target: "maintenance_ratification" }, { type: "benefit_cost_path_transfer", target: "infrastructure_office_claimant_and_engine", required: 4 }, { type: "future_constituency_seating", target: "living_operating_input", rule: "Each transfer preserves the purchased benefit while changing who may appeal its next cycle." }],
    outcomes: ["maintenance_cost_individually_appealable", "institutional_cost_expires_and_revotes", "benefit_and_cost_return_to_engine"], rewardItemIds: ["appealable_crack"],
    loreReveal: "The League's strongest consent law binds institutions rather than descendants or future species, and later councils inverted it to finance unnamed claimants' operating costs.",
    dialogueThesis: "A future person may owe their existence to a law without owing that law obedience.",
    authorshipProof: { setpiece: "A visible maintenance fracture travels from one lit engine ring through expired ballot seals into a new claimant's body while the benefit fades everywhere the crack leaves.", failureTransformation: "Invalidating a signer transfers that signer's next-cycle cost to the office that excluded the claimant, creating public debt with a living creditor.", dialogueConstraint: "Della will not say the maintenance law was ratified until every present, hidden, and future constituency denied standing is identified.", persistentWorldChange: "The operating cost becomes individually appealable, institutional responsibility expires into a new vote, or both benefit and cost return to the engine.", forbiddenSubstitution: "Cannot become a corrupt-election investigation because the benefit remains active, the new political claimant owes its existence to the cost, and standing determines who keeps the system alive." },
  }),
]);

const duplicateValues = (records, selector) => {
  const seen = new Map();
  const duplicates = [];
  records.forEach((record, index) => {
    const value = selector(record);
    if (seen.has(value)) duplicates.push({ value, first: seen.get(value), second: index });
    else seen.set(value, index);
  });
  return duplicates;
};

const words = (text) => String(text).toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 2);
const shingles = (text, size = 3) => {
  const tokens = words(text);
  const output = new Set();
  for (let index = 0; index <= tokens.length - size; index += 1) output.add(tokens.slice(index, index + size).join(" "));
  return output;
};

export const questSimilarity = (left, right) => {
  const corpus = (entry) => [
    entry.premise,
    entry.loreReveal,
    entry.dialogueThesis,
    ...Object.values(entry.authorshipProof ?? {}),
    ...(entry.objectives ?? []).map(({ type, target, rule }) => `${type} ${target} ${rule ?? ""}`),
    ...(entry.outcomes ?? []),
  ].join(" ");
  const a = shingles(corpus(left));
  const b = shingles(corpus(right));
  if (!a.size && !b.size) return 1;
  let intersection = 0;
  a.forEach((value) => { if (b.has(value)) intersection += 1; });
  return intersection / (a.size + b.size - intersection);
};

export function validateNarrativeExpansion({ factions = COSMIC_FACTIONS, characters = EXPANSION_CHARACTERS, creatures = EXPANSION_CREATURES, items = EXPANSION_ITEMS, quests = EXPANSION_QUESTS } = {}) {
  const errors = [];
  const add = (path, code, message) => errors.push({ path, code, message });
  const factionIds = new Set(factions.map(({ id }) => id));
  const characterIds = new Set(characters.map(({ id }) => id));
  const characterById = new Map(characters.map((character) => [character.id, character]));
  const creatureIds = new Set(creatures.map(({ id }) => id));
  const itemIds = new Set(items.map(({ id }) => id));

  [["factions", factions], ["characters", characters], ["creatures", creatures], ["items", items], ["quests", quests]].forEach(([label, records]) => {
    duplicateValues(records, ({ id }) => id).forEach(({ value }) => add(label, "duplicate_id", `Duplicate ${label} id: ${value}`));
  });

  characters.forEach((character, index) => {
    if (!factionIds.has(character.factionId)) add(`characters.${index}.factionId`, "unknown_reference", character.factionId);
    if (!character.contradiction || !character.secret || !character.voice?.signature) add(`characters.${index}`, "shallow_character", "Every expansion character needs a contradiction, secret, and unique voice signature.");
    if (!character.pipeline || !Object.hasOwn(character.pipeline, "conceptMaster") || !Object.hasOwn(character.pipeline, "animatedModel")) add(`characters.${index}.pipeline`, "missing_pipeline", "Art, static-model, and animated-model readiness must be explicit.");
  });
  duplicateValues(characters, ({ voice }) => voice.signature).forEach(({ value }) => add("characters", "duplicate_voice", value));

  creatures.forEach((entry, index) => {
    entry.factionAffinityIds?.forEach((factionId) => {
      if (!factionIds.has(factionId)) add(`creatures.${index}.factionAffinityIds`, "unknown_reference", factionId);
    });
    if (entry.genericTemplateAllowed !== false) add(`creatures.${index}.genericTemplateAllowed`, "generic_enemy", "Expansion enemies must be explicitly authored, never admitted as generic templates.");
    if (!entry.anatomy || !entry.locomotion || !entry.ecology || !entry.origin || !entry.narrativeUse || !entry.visualBrief) add(`creatures.${index}`, "shallow_creature", "Each creature needs anatomy, locomotion, ecology, origin, narrative use, and visual brief.");
    if (!entry.mechanic?.id || !entry.mechanic?.cue || !entry.mechanic?.counterplay) add(`creatures.${index}.mechanic`, "missing_counterplay", "Each creature needs one readable unique mechanic, cue, and counterplay verb.");
    if (!entry.pipeline || !Object.hasOwn(entry.pipeline, "conceptMaster") || !Object.hasOwn(entry.pipeline, "animatedModel")) add(`creatures.${index}.pipeline`, "missing_pipeline", "Art, static-model, and animated-model readiness must be explicit.");
  });
  duplicateValues(creatures, ({ mechanic }) => mechanic.id).forEach(({ value }) => add("creatures", "duplicate_creature_mechanic", value));
  duplicateValues(creatures, ({ mechanic }) => mechanic.cue.toLowerCase()).forEach(({ value }) => add("creatures", "duplicate_creature_cue", value));

  const questGenome = (entry) => [entry.primaryMechanicId, entry.dilemmaId, entry.locationId, entry.consequenceId].join("|");
  const objectiveShape = (entry) => entry.objectives?.map(({ type, required, rule }) => `${type}:${required ?? ""}:${rule ? "rule" : ""}`).join(">") ?? "";
  duplicateValues(quests, questGenome).forEach(({ value }) => add("quests", "duplicate_story_genome", value));
  duplicateValues(quests, ({ primaryMechanicId }) => primaryMechanicId).forEach(({ value }) => add("quests", "duplicate_primary_mechanic", value));
  duplicateValues(quests, ({ title }) => title.toLowerCase()).forEach(({ value }) => add("quests", "duplicate_title", value));
  duplicateValues(quests, ({ rewardItemIds }) => rewardItemIds?.[0]).forEach(({ value }) => add("quests", "duplicate_signature_reward", value));
  duplicateValues(quests, ({ consequenceId }) => consequenceId).forEach(({ value }) => add("quests", "duplicate_state_key", value));
  duplicateValues(quests, objectiveShape).forEach(({ value }) => add("quests", "duplicate_objective_shape", value));
  QUEST_AUTHORING_LAW.requiredProofFields.forEach((field) => {
    duplicateValues(quests, ({ authorshipProof }) => authorshipProof?.[field]?.toLowerCase()).forEach(({ value }) => add("quests", `duplicate_${field}`, value));
  });

  const supportOwners = new Map();
  const stateOwnerByKey = new Map(quests.map((entry, index) => [entry.consequenceId, { index, entry }]));
  quests.forEach((entry, index) => {
    if (entry.schemaVersion !== 2) add(`quests.${index}.schemaVersion`, "unsupported_quest_schema", "Accepted quests must use schema version 2 state-read contracts.");
    if (!QUEST_AUTHORING_LAW.portfolioIds.includes(entry.portfolioId)) add(`quests.${index}.portfolioId`, "unknown_portfolio", entry.portfolioId);
    if (!characterIds.has(entry.giverId)) add(`quests.${index}.giverId`, "unknown_reference", entry.giverId);
    if (!Array.isArray(entry.supportingCharacterIds) || entry.supportingCharacterIds.length < 1) {
      add(`quests.${index}.supportingCharacterIds`, "missing_unique_support_character", "Every quest needs at least one quest-exclusive supporting character.");
    }
    entry.supportingCharacterIds?.forEach((characterId) => {
      if (!characterIds.has(characterId)) add(`quests.${index}.supportingCharacterIds`, "unknown_reference", characterId);
      if (characterId === entry.giverId) add(`quests.${index}.supportingCharacterIds`, "giver_reused_as_support", characterId);
      if (supportOwners.has(characterId)) add(`quests.${index}.supportingCharacterIds`, "duplicate_quest_support", `${characterId} is already owned by ${supportOwners.get(characterId)}.`);
      else supportOwners.set(characterId, entry.id);
      const support = characterById.get(characterId);
      if (support && !support.questArcIds?.includes(entry.id)) add(`quests.${index}.supportingCharacterIds`, "support_arc_mismatch", `${characterId} does not declare ${entry.id}.`);
    });
    if (!Array.isArray(entry.outcomes) || entry.outcomes.length < 3) add(`quests.${index}.outcomes`, "insufficient_branching", "Each expansion quest needs at least three materially distinct outcomes.");
    if (!entry.rewardItemIds?.length) add(`quests.${index}.rewardItemIds`, "missing_signature_reward", "Every quest needs a unique signature reward item.");
    if (!entry.objectives?.some(({ type }) => !["talk", "gather", "defeat", "acquire", "interact"].includes(type))) add(`quests.${index}.objectives`, "generic_objective_only", "A quest cannot consist only of generic MMO verbs.");
    entry.rewardItemIds?.forEach((itemId) => { if (!itemIds.has(itemId)) add(`quests.${index}.rewardItemIds`, "unknown_reference", itemId); });
    duplicateValues((entry.creatureIds ?? []).map((id) => ({ id })), ({ id }) => id).forEach(({ value }) => add(`quests.${index}.creatureIds`, "duplicate_creature_reference", value));
    entry.creatureIds?.forEach((creatureId) => { if (!creatureIds.has(creatureId)) add(`quests.${index}.creatureIds`, "unknown_reference", creatureId); });
    if (!entry.loreReveal || !entry.dialogueThesis) add(`quests.${index}`, "missing_depth", "Every quest needs a unique lore reveal and dramatic thesis.");
    QUEST_AUTHORING_LAW.requiredProofFields.forEach((field) => {
      if (!entry.authorshipProof?.[field]) add(`quests.${index}.authorshipProof.${field}`, "missing_authorship_proof", `Every quest must prove its unique ${field}.`);
    });
    if (!QUEST_AUTHORING_LAW.stateDomains.includes(entry.stateDomain)) add(`quests.${index}.stateDomain`, "unknown_state_domain", entry.stateDomain);
    if (!Array.isArray(entry.stateWrites) || entry.stateWrites.length !== 1) {
      add(`quests.${index}.stateWrites`, "invalid_state_write", "Every quest writes exactly one typed consequence state.");
    } else {
      const [write] = entry.stateWrites;
      if (write.domain !== entry.stateDomain || write.key !== entry.consequenceId || JSON.stringify(write.values) !== JSON.stringify(entry.outcomes)) {
        add(`quests.${index}.stateWrites`, "state_write_mismatch", "State write must preserve the quest domain, consequence key, and outcome values.");
      }
    }
    if (!Array.isArray(entry.stateReads)) {
      add(`quests.${index}.stateReads`, "invalid_state_read_contract", "Schema-v2 stateReads must be an array of typed contracts.");
    } else {
      duplicateValues(entry.stateReads, ({ key }) => key).forEach(({ value }) => add(`quests.${index}.stateReads`, "duplicate_state_read", value));
      entry.stateReads.forEach((read, readIndex) => {
        const path = `quests.${index}.stateReads.${readIndex}`;
        if (!read || typeof read !== "object" || Array.isArray(read) || typeof read.key !== "string") {
          add(path, "invalid_state_read_contract", "Each state read must name a key, mode, and enumerated values.");
          return;
        }
        if (!QUEST_AUTHORING_LAW.stateReadModes.includes(read.mode)) add(`${path}.mode`, "unknown_state_read_mode", String(read.mode));
        if (!Array.isArray(read.values) || read.values.length < 1 || read.values.some((value) => typeof value !== "string" || !value)) {
          add(`${path}.values`, "missing_state_values", "Every state read must enumerate at least one reachable upstream value.");
          return;
        }
        duplicateValues(read.values.map((value) => ({ value })), ({ value }) => value).forEach(({ value }) => add(`${path}.values`, "duplicate_state_value", value));
        const owner = stateOwnerByKey.get(read.key);
        if (!owner) {
          add(path, "unknown_state_read", read.key);
          return;
        }
        if (owner.index >= index) add(path, "future_state_read", `${read.key} is not written before ${entry.id}.`);
        const upstreamValues = new Set(owner.entry.outcomes ?? []);
        const impossibleValues = read.values.filter((value) => !upstreamValues.has(value));
        impossibleValues.forEach((value) => add(`${path}.values`, "impossible_state_value", `${read.key} never writes ${value}.`));
        if (read.mode === "all-values") {
          const missingValues = [...upstreamValues].filter((value) => !read.values.includes(value));
          missingValues.forEach((value) => add(`${path}.values`, "omitted_upstream_state_value", `${read.key} omits reachable value ${value}.`));
          if (read.values.length !== upstreamValues.size) add(`${path}.values`, "state_value_set_mismatch", `${read.key} must enumerate every and only upstream value.`);
        }
        if (read.mode === "value-precondition") {
          if (read.values.length !== 1) add(`${path}.values`, "invalid_value_precondition", "A value-precondition contract must name exactly one upstream value.");
          if (read.values.length === upstreamValues.size) add(`${path}.mode`, "unnecessary_value_precondition", "Use all-values when the quest is offered for every upstream outcome.");
        }
      });
    }
  });

  for (let left = 0; left < quests.length; left += 1) {
    for (let right = left + 1; right < quests.length; right += 1) {
      const similarity = questSimilarity(quests[left], quests[right]);
      if (similarity > 0.42) add(`quests.${left},${right}`, "near_duplicate_text", `${quests[left].id} and ${quests[right].id}: ${similarity.toFixed(3)}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    stats: { factions: factions.length, characters: characters.length, creatures: creatures.length, items: items.length, quests: quests.length, capacityTarget: NARRATIVE_TARGETS.authoredQuestTarget },
  };
}
