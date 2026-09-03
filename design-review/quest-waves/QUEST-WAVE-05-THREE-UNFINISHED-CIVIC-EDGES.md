# Quest Wave 05 Candidate — Three Unfinished Civic Edges

Status: **noncanonical authored candidate**
Candidate ID: `quest-wave-05-three-unfinished-civic-edges-candidate-v1`
Scope: 12 quests, 12 exclusive supporting characters, 12 signature items, 12 environment briefs, 15 genuinely quest-unused expansion creatures, and 3 explicitly returning creature overlays
Acceptance: **not reviewed, not accepted, not release-attested, and not integrated**

## 1. Authority and nonclaim legend

- **[C] Canon input:** an identity, fact, rule, or accepted record read from the current canonical content modules.
- **[D] Authored design constraint:** an existing production-direction constraint that may guide a blockout but is not surveyed or construction geometry.
- **[P] Wave 05 proposal:** new writing in this candidate. It is not canon unless it passes the established independent-review and release process.
- **[G] Guardrail:** an explicit prohibition or readiness boundary.

[G] Nothing in this packet claims canonical admission, independent review, release attestation, runtime integration, final placement, production geometry, construction readiness, accepted art, or static/animated model readiness.

[C] Canonical narrative and spatial inputs are read from `packages/content/src/narrative.data.js` and `packages/content/src/world-spatial.data.js`. [P] The complete machine-readable proposal is `packages/content/src/quest-wave-05.candidate.js`. [G] This file explains that proposal; it is not a substitute acceptance manifest.

## 2. Why this bounded batch exists

[C] The accepted expansion currently contains 49 quests. All 49 have distinct primary mechanics, dilemmas, locations, consequences, exclusive support ownership, signature rewards, and objective shapes under the existing narrative validator.

[C] Accepted quests expose three structured creature-reference fields: `creatureIds`, `foundingCreatureOverlayIds`, and `creatureAliasIds`. Reading all three—not only `creatureIds`—leaves exactly 15 expansion creatures without an accepted quest reference:

- [C] Lucent Procession: Apse Seraph, Misericord of Borrowed Pain, Noon Bailiff, Engine of the Unbroken Note, Reliquary of the Last Breath, and Gold-Shutter Penitent.
- [C] Charnel Households: Door-Lung Courser, Reverse-Rib Bride, Throat Orchard, Jointless Advocate, Mercy-Eater, and Corridor Maw.
- [C] Remaining Ecologies: Shutter Stag, Rain Notary, and Ember Midwife.

[C] Witness Crab, The Acre That Walks, and Funeral Kite are already used through `foundingCreatureOverlayIds`, respectively by `settlement_the_harbor_rang_below_tide`, `relic_the_acre_crossed_a_border`, and `regional_the_graves_grew_upward`. [P] Wave 05 may reuse them only as declared returning overlays with exact analogue analysis; it never counts them among the 15 unused forms.

[C] Salt Watch, Cairnmarket, and Ember Gate are the only three atlas sites without a registered spatial blockout reference. Their existing accepted quests are all led by the League of Remaining Hands.

[P] Wave 05 therefore authors four quests per site, exactly two Lucent-led and two Charnel-led at each site. It introduces faction ambiguity without increasing the already dominant League-led giver count, gives all 15 genuinely unused expansion creatures a non-generic dramatic function, and places the three returning overlays only where an explicit authored distinction prevents semantic duplication.

## 3. Exact production matrix

| # | Site | Lead | Giver | Exclusive support | Creatures | Portfolio | State domain |
|---:|---|---|---|---|---|---|---|
| 1 | Salt Watch | Lucent | Roen Fitch | Cera Voss | Shutter Stag | settlement | ecology |
| 2 | Salt Watch | Charnel | Orra Rain-in-Ribs | Dren Saal | Rain Notary **[new]**; Witness Crab **[returning overlay]** | faction schism | memory |
| 3 | Salt Watch | Lucent | Subcanon Liora | Oma Threll | The Acre That Walks **[returning overlay]** | profession systemic | infrastructure |
| 4 | Salt Watch | Charnel | Vekh Tallowmouth | Kevrin Tab | Funeral Kite **[returning overlay]**; Ember Midwife **[new]** | relic/creature ecology | admission |
| 5 | Cairnmarket | Lucent | Deacon Halix | Bessa Orrn | Door-Lung Courser | settlement | infrastructure |
| 6 | Cairnmarket | Charnel | Ilar Rook | Tarn Vey | Reverse-Rib Bride; Jointless Advocate | character/guest/follower | authority |
| 7 | Cairnmarket | Lucent | Saint Vespera | Elka Morn | Throat Orchard; Mercy-Eater | regional | memory |
| 8 | Cairnmarket | Charnel | Ilyen Doorborn | Sivren Latch | Corridor Maw | faction schism | admission |
| 9 | Ember Gate | Lucent | Senn Avir | Jorra Kelm | Apse Seraph | settlement | admission |
| 10 | Ember Gate | Charnel | Tima Vale Twice-Born | Maud Renn | Misericord; Last-Breath Reliquary | character/guest/follower | obligation |
| 11 | Ember Gate | Lucent | Arch-Lumen Seraphel Orr | Cael Ors | Noon Bailiff; Gold-Shutter Penitent | regional | authority |
| 12 | Ember Gate | Charnel | Parn Exit-Law | Enver Rowse | Engine of the Unbroken Note | regional | infrastructure |

Portfolio totals are exactly three settlement, three regional, two character, two faction, one profession, and one relic/ecology quest. State-domain totals are three infrastructure, three admission, two memory, two authority, one ecology, and one obligation.

## 4. Site foundations and placement boundary

### 4.1 Salt Watch / Mirror-Salt Waste

[C] Salt Watch is atlas-placed at `[13824, 5120, 74]` in the fictional Veyl local grid. [D] Its current influence envelope is 720 metres around a 144-metre core, with a 65–102 metre vertical design range and population direction of 180–330.

[C] Its water source is covered brine stills; access is the False Horizon Track; subsistence is lichen cakes and caravan stores; industries are mirror salt and gypsum; burial uses east-facing salt sheaths; governance rotates through a compass keeper.

[D] The Salt Watch caravan house uses gypsum-block wind walls around flexible cloth-and-timber rooms. Its room graph includes track entry, two-stage wind lock, caravan common, brine still, gestational mirror nursery, sleep cells, and route-debt exit. Horizon sightlines, two accountable nursery approaches, and state-dependent false-destination egress remain design constraints, not finished geometry.

[C] All six Remaining Ecology forms already have Salt Watch site affinity. [P] Their four quest environments use that affinity without assigning exact coordinates or spawn schedules.

### 4.2 Cairnmarket / Graven March

[C] Cairnmarket is atlas-placed at `[8192, 10240, 212]`. [D] Its current influence envelope is 760 metres around a 176-metre core, with a 198–254 metre vertical design range and population direction of 460–740.

[C] Its water comes from crown snowmelt tanks; access is Crown Road; subsistence is goats and black rye; industries are slate, grave lichen, and pack animals; family cairns open once each winter; governance occurs through a market oath circle.

[C] The accepted atlas route terminating at Cairnmarket is Bellwater Road. [C] Crown Road is the site's access semantic, while the current atlas supplies no separately modeled Crown Road polyline into the settlement. [G] They are unresolved identities and must never be silently aliased. [P] Wave 05 uses the proposed Cairnmarket arrival fan as a semantic interface only: Bellwater Road remains the accepted modeled approach; Crown Road access remains the canonical access obligation; neither receives new geometry here.

[D] The cairn hall provides a road apron, oath circle, market bay, family cairn gallery, winter store, and rear den gate. The road assize provides a witness ring, three materially separate ash chairs, living gallery, evidence bay, and an appeal exit that stays unlocked during verdict.

[C] The six Charnel Household forms have Graven March territory affinity but no canonical site affinity. [P] Their presence at Cairnmarket is a site-local quest proposal. [G] Reviewers must not convert territory affinity into accepted Cairnmarket habitat, placement, population, or spawn evidence.

### 4.3 Ember Gate / Cinderward

[C] Ember Gate is atlas-placed at `[13312, 9472, 286]`. [D] Its current influence envelope is 800 metres around a 208-metre core, with a 262–358 metre vertical design range and population direction of 620–980.

[C] Its water comes from condensate galleries; access is Iron Spine Road; subsistence is fungus vaults and imported grain; industries are ironstone and kiln glass; the dead occupy sealed slag niches; governance is a furnace allotment court.

[D] Furnace dwellings separate physical doors from civic addresses, use occupant-owned visible heat cutoffs, and require two heat-separated exits. The law forge provides three shutdown bays, seven service rings, dependency and quench chambers, a veto floor, and manual egress that survives total power loss.

[C] All six Lucent Procession forms already have Ember Gate site affinity. [P] Their four candidate environments use artificial-noon, convalescent, warrant, processional, and service-ring microhabitat language without asserting exact placement.

## 5. Quest architecture: Salt Watch

### 5.1 Twilight Has Two Owners

[P] A Shutter Stag herd creates two simultaneous twilight intervals. One protects brine yield; the other maintains migration around a grave sheath Cera moved. The player pairs fixed observations at two still lips and keeps the herd's refusal lane empty. The player never escorts, steers, or shelters behind the creature.

Objective graph: two simultaneous fixed readings → protect negative-space exit → calibrate separate salinity loads → Cera's owned grave disclosure → three-way custody ruling.

Decisive beat: Cera places her family compass on the displaced sheath while both apertures exist. Outcomes reserve both halves for migration, meter one to potable production, or divide the interval around a public grave gap.

Persistent failure: missed windows crystallize one still and rotate the exposed grave face. They remove final options rather than restarting herd movement.

### 5.2 The Rain Signed Under a Roof

[P] A Charnel refuge grant was promised while lethal wind made departure impossible. A Rain Notary preserves the clause and a Witness Crab preserves conflicting accounts. The player performs the same material act inside and outside the shelter only after the exit is genuinely usable.

Objective graph: establish a coercion boundary → concurrent sheltered and exposed acts → flank to the Crab's minority account → let Dren freely repeat or refuse → spin only the surviving clause.

Decisive beat: Dren reaches safe weather and owns the repetition decision. Outcomes enforce refuge with an exit clause, void storm-made promises, or preserve only duties freely repeated afterward.

Persistent failure: wet and dry threads retain failed acts and contradictory shell casts. The quest does not run forecast hypotheses.

### 5.3 The Field That Left Without Moving

[P] The Acre has already departed. Former beds still grow food while delayed brine damage emerges. The player consumes four irreplaceable soil cores in a parallel germination assay and observes the distant lifted-corner cue only as a timestamp.

Objective graph: collect four historical cores → observe one remote ecological cue → germinate a shared unclaimed seed → receive Oma's founder-bed disclosure → attach aftercare to future visits, growers, or unowned fallow.

Decisive beat: the most fertile core proves the strongest contamination and supports Oma's family title. She alone may disclose and surrender it.

Persistent failure: destroyed strata, false root directions, and lost yield remain evidence uncertainty. No Acre corner, civic service, or former-site outage is moved.

### 5.4 A Name Too Heavy to Fly

[P] Funeral Kites erase the names of Ember Midwife cocoons to prevent lineage hunting. The same anonymity hides potentially dangerous resistance. The player catches inward-folding tabs with claimant objects and reverse-reads sealed material bands without hatching a creature.

Objective graph: triage three sealed band orders → intercept moving relationship tabs → prevent a fourth complete resistance cycle → give Kevrin a voluntary personal-name stake → write separate risk and lineage disclosure rules.

Decisive beat: Kevrin may spend his former mortal name as ballast for one accountable audit, losing the claims that name carried among the dead.

Persistent failure: escaped tabs erase relationships and delayed readings create disclosed resistances. The failure does not produce a combat spawn or diagnostic retry.

## 6. Quest architecture: Cairnmarket

### 6.1 The Road Exhaled in Shares

[P] A Door-Lung Courser has swallowed route evidence attached to Cairnmarket's unresolved Crown Road access obligation and an adjacent sanctuary fork. The player crosses the final open rib threshold, catches proposed route segments exhaled behind the creature, matches them against animal-memory turns, and fixes only public shares. [G] This neither maps Crown Road nor identifies it with the accepted Bellwater Road approach.

Objective graph: read pack behavior without a map → execute creature counterplay once → catch three successive terrain shares → protect a cartographic omission → constitute complete, incomplete, or seasonal public-access evidence without locating Crown Road.

Decisive beat: one exhaled strip contains both market ruts and sanctuary handprints. Bessa owns the disclosure that her animals preserve the hidden overlap.

Persistent failure: missed breaths rewrite pack memory; every slate tack fixes a segment and constrains future winter routing.

### 6.2 The Exception Wore Wedding Ribs

[P] A Reverse-Rib Bride marks two promised positions while a Jointless Advocate turns the last successful dodge into compulsory precedent. The player deliberately accepts a bounded harmless telegraph, teaching the Advocate a survivable shape before the marked partners exchange positions without attack.

Objective graph: choose a bounded impact → intentionally complete it → wait for exactly two vow marks → exchange positions nonviolently → unfold personal, general, or void scope at the unlocked appeal exit.

Decisive beat: Tarn reveals that he is not merely the paid demonstrator but the absent spouse. His professional demonstration and intimate consent cannot be presumed identical.

Persistent failure: the first completed impact becomes embodied law and every coerced position stays marked.

### 6.3 The Warning That Could Not Be Obeyed

[P] Eleven Throat Orchard voices issue compulsory ancestral warnings; the true twelfth warning has no breath. A Mercy-Eater suppresses healing to conceal refuge and den movement. The player uses prevention—not recovery—to survive disobedience and tests only the silent throat's facing.

Objective graph: establish a nonhealing shield route → classify eleven audible pressures → align a blank token to silent orientation → open Elka's family evidence → demonstrate safe disobedience → assign binding, overridden, or advisory status.

Decisive beat: the silent facing points toward the market, but its lost meaning could have been evacuation, confession, or preserved access. Review may not invent its words.

Persistent failure: obeyed commands move road chains and den gates; attempted healing removes named stations from later play.

### 6.4 The War Changed Sides Without Crossing

[P] A Corridor Maw exchanges market ground with a distant inhabited front without moving civilians through the intervening world. Two teams mark opposite exterior faces simultaneously through a third ridge sightline. The Maw interior has no traversal edge.

Objective graph: establish two exterior witness teams → align attached-shadow angles remotely → document domestic continuity → enforce total interior exclusion → decide reversal, local admission, or two-exterior commons.

Decisive beat: Sivren reveals an aggressor-side mark proving that Cairnmarket received an inhabited camp, not empty land.

Persistent failure: mismatched chalk rotates legal presumption; lost domestic evidence remains lost; any entry attempt seals reversal. There is no feeding, lighting, companion recovery, or predator negotiation.

## 7. Quest architecture: Ember Gate

### 7.1 The House That Failed as a Keystone

[P] An Apse Seraph rejects three patched dwellings whose doors, addresses, occupants, and civic functions no longer align. The player demonstrates two real exits, empties a civic function materially, and holds its blank plate in the Seraph's missing line.

Objective graph: trace four identity layers per dwelling → exercise heat-separated egress → make one function genuinely vacant → counterclassify the missing keystone → constitute private, public, or rejected-judgment housing.

Decisive beat: Jorra reveals that the blank plate came from a fire escape still used by six residents. Saving three homes first requires making those six visible to the classifier.

Persistent failure: misplaced plates move rations, votes, and repair priority; failed exit proofs remain unsafe.

[G] Senn Avir's candidate giver role does not authorize character art. Her canonical record still requires a reviewed visual brief before an art work order.

### 7.2 The Dead Returned Without Refusal

[P] A Misericord moves pain from injured staff into unwounded bodies while a Last-Breath Reliquary rebuilds the dead as ideal workers stripped of inconvenient refusal. The player uses deliberate minor wounds to close transfer seats and breaks only the empty vial so refusal returns before reconstruction completes.

Objective graph: map named station injury → close transfer seats without coercion → separate empty from occupied records → return one posthumous refusal → choose emergency labor command.

Decisive beat: Maud's spouse refuses the promotion that created Maud's rescue authority while trapped workers remain below.

Persistent failure: pain disables named stations, occupied-vial loss erases an account, and completed idealization permanently loses a loyalty. The quest does not diagnose grief or distribute succession identity.

### 7.3 Arrested Before the Hammer Fell

[P] A Noon Bailiff arrests Cael for an action its flat shadow completes before him. A Gold-Shutter Penitent can expose whether the intended target is unsafe. The player initiates and cancels motions across the verdict gap, then meters a dawn slice onto material faults.

Objective graph: read a future animation → create three abandoned-motion forks → operate the Penitent from the dark flank → publish intent and fault as separate evidence → return the real blow to Cael.

Decisive beat: the exposure proves the lens will fail, and Cael admits he genuinely intended to break it. True evidence does not retroactively legitimate predictive arrest.

Persistent failure: completed motions become charges, overexposure anneals away faults, and worker lanes remain closed.

### 7.4 The Note That Needed an Accident

[P] The Engine of the Unbroken Note has fixed heat, workers, and pressure into a safe but unchangeable state. A quench knock, slag fracture, and manual egress bell must be caused independently and routed through the warm black pipe. Their difference—not silence—opens one rest.

Objective graph: separate ownership of three sound causes → route echoes without synchronizing → recognize unequal overlap → evacuate before benefit → change one pressure state without recording the cadence → constitute a right to unscheduled change.

Decisive beat: Enver destroys the fatal cadence that first taught him the rest. The next opening must be trusted to three people who cannot receive a countdown.

Persistent failure: every synchronized attempt is learned and permanently refused by the Engine; blocked echoes freeze named stations.

## 8. Supporting-character ownership

[P] Every quest owns exactly one new supporting character and no support appears in another Wave 05 quest.

| Character | Dramatic contradiction | Decision they alone own | Art family direction |
|---|---|---|---|
| Cera Voss | Calls the herd unowned while selling its shade | Disclose the moved grave and surrender family profit | Remaining Hands |
| Dren Saal | Rejects shelter leverage while retaining a favor ledger | Invalidate his own founding storm account | Remaining Hands |
| Oma Threll | Rejects living-land ownership while labeling every tray | Reveal the contaminated founder bed and lose title | Remaining Hands |
| Kevrin Tab | Erases names publicly but gives cocoons private names | Spend his mortal name as audit ballast | Charnel Households |
| Bessa Orrn | Opposes forced route-bearing while breeding mnemonic animals | Reveal the sanctuary overlap in pack memory | Remaining Hands |
| Tarn Vey | Sells his body as evidence while opposing bodily precedent | Identify himself as the missing spouse | Remaining Hands |
| Elka Morn | Defends voluntary warning while controlling refusal shields | Open the family course behind the silent throat | Remaining Hands |
| Sivren Latch | Prohibits Maw entry while living on its exterior fold | Spend the aggressor-side mark on reversal or standing | Charnel Households |
| Jorra Kelm | Defends private thresholds while moving official addresses | Reveal the blank plate's occupied fire-escape history | Remaining Hands |
| Maud Renn | Protects refusal while signing absent people onto shifts | Let a returned refusal remove her own command | Remaining Hands |
| Cael Ors | Rejects precrime while rehearsing coworkers' future errors | Complete, redirect, or abandon the real blow | Remaining Hands |
| Enver Rowse | Rejects scheduled change while secretly timing slag drops | Destroy the fatal cadence and trust unplanned causes | Remaining Hands |

[G] All twelve pipelines begin with no master, cutout, static model, or animated model. `awaiting-art-after-narrative-review` is a queue boundary, not an art acceptance claim.

## 9. Signature-item ownership

[P] Each quest has one unique item whose activation, custody, limitation, world debt, later contest, and state key are fully specified in the candidate module.

| Item | Changes | Cannot do | Later contest |
|---|---|---|---|
| Paired-Twilight Reed | Makes two simultaneous ecological intervals indivisible | Redirect or own the herd | Whether drought can dissolve nonhuman custody |
| Unsheltered-Clause Spindle | Separates coerced shelter acts from free repetition | Guarantee repayment | When weather has ended enough for a promise |
| Germination Afterimage Frame | Reveals delayed duties in departed soil | Name an owner or move the Acre | Whether living terrain owes aftercare |
| Blank-Name Cocoon Weight | Links risk and one temporary accountable name | Expose body or location automatically | When inheritable danger may remain anonymous |
| Exhaled-Road Tack | Fixes one proposed public-access evidence share | Reveal adjacent swallowed routes | When refuge need may lift fixed public ground |
| Reversible Exception Crease | Caps precedent at demonstrated harm | Generalize beyond its recorded impact | Whether repeated demonstration becomes labor coercion |
| Breathless Warning Token | Preserves direction without command | Recover missing words | Whether silent direction may close a road |
| Exterior-Side Chalk | Proves territory exchange from outside | Establish consent or permit Maw entry | Governance of ground moved without travel |
| Vacant-Keystone Address | Makes a classifier encounter a missing category | Prove structural validity | Services for a home that refuses office identity |
| Refusal-Vial Brace | Lets posthumous refusal interrupt idealization | Restore a whole person | Binding force of refusal on later crews |
| Uncommitted-Motion Warrant | Separates initiated act, cancelled facing, and fault | Prove absent intent | Whether useful evidence saves unjust prediction |
| Black-Pipe Rest Key | Opens change through unscheduled sound difference | Repeat a successful cadence | Safety that management may not coordinate |

## 10. Environment implementation contracts

[P] Each quest has an independent environment brief with a unique schema-v2 topology, at least five structured functional nodes, explicit endpoint-bearing edges, separately typed exclusions, an activity/utility dependency, one nonregistered temporary quest-safe stage, failure carry, persistent mutation, and art direction.

[G] Common rules:

- Coordinates are `null`. Canonical site identity is inherited; exact placement is not.
- Geometry is proposed topology, never surveyed, final, collision-ready, navigation-ready, accessible, structural, or construction geometry.
- [P] Every environment owns an exact candidate-local `S-W05-*` station, `N-W05-*` graph-node, `L-W05-*` graph-link, and `SC-W05-*` temporary-stage crosswalk. These identifiers are proposal-local and do not enter any accepted spatial registry.
- [G] Every `SC-W05-*` record sets `registeredSafeCellId: null` and `registryStatus: nonregistered_temporary_quest_safe_stage`. It proves only connectivity in the authored candidate graph—not canonical safety, invulnerability, capacity, AI exclusion, collision, navigation, accessibility, or a route to built geometry.
- [G] Exclusions are separate `X-W05-*` records anchored at a traversable boundary node. An exclusion is never smuggled into the node or edge list as if it were a route.
- [G] Machine checks require unique S/N/L/SC identifiers, valid edge endpoints, full graph connectivity from the temporary stage, exact objective-to-node references, exclusion anchors that resolve, and an empty `registeredSafeCellClaims` array.
- Creature counters must remain readable without converting lore cues into generic enemy arenas.
- Utilities continue operating as civic systems. Brine, snowmelt, heat, quench, condensate, waste, egress, and road access are never decorative set dressing.
- Every environment visualizes earlier failure and the chosen state without text labels.

| Environment | Topology identity | Nonregistered temporary stage | Permanent evidence |
|---|---|---|---|
| Paired Twilight Stills | opposed stationary aperture triangle | wind lock | salinity and grave bearing |
| Unsheltered Clause | concurrent sheltered/exposed lanes | caravan common | wet/dry contract strands |
| Departed Soil | radial history assay, no creature relocation | route-debt exit | root chronology and fallow markers |
| Blank-Name Nursery | aerial tab arc over sealed triage spokes | mirror nursery | separated risk/lineage record |
| Exhaled Road | successive terrain catchments to public spine | road apron | tacked segments and intentional gap |
| Reversible Vow | bounded failure before nonviolent position exchange | living-gallery stage beside unlocked appeal | copied impact and vow marks |
| Breathless Warning | eleven pressures plus one silent sightline | winter-store stage | chain positions and refusal route |
| Exterior Front | two disjoint exteriors through third sightline | living-witness stage | chalk standing and camp evidence |
| Vacant Keystone | three dwelling audits to one self-judgment | resident two-exit stage | address/service reassignment |
| Refusal Quench | injury-transfer matrix crossing reconstruction clock | manual-shutdown stage | inactive stations and vial history |
| Prospective Warrant | cancelled motion forks into material targets | rehearsal stage | charges separated from fault samples |
| Black-Pipe Rest | three unclocked sound causes converge once | maintenance-exit stage | learned failed cadences and ring state |

### 10.1 Cairnmarket precinct crosswalk and route boundary

[D] `design-review/world-sites/CAIRNMARKET-PRECINCT-BIBLE.md` defines proposal-local spaces `S01`–`S16`, nodes `N01`–`N18`, links `L01`–`L20`, and safe-cell candidates `SC01`–`SC03`. [G] These remain precinct proposals, not registered runtime cells or final geometry. The candidate records only the following exact semantic interfaces:

| Wave 05 environment | Candidate semantic nodes | Precinct S/N crosswalk | Precinct link obligations | Precinct SC reference |
|---|---|---|---|---|
| Exhaled Road | arrival fan; oath circle | `S01/N01`; `S10/N10` | `L12` toward hall apron; `L06` toward oath circle | none |
| Reversible Vow | witness/demonstration; ash chairs; appeal; living gallery | `S03/N03`; `S04/N04`; `S07/N07`; `S05/N05` | `L02`, `L03`, `L05` | `SC01`, explicitly `precinct_proposal_not_registered` |
| Breathless Warning | oath; market bay; winter store; family cairn; rear den boundary | `S10/N10`; `S11/N11`; `S13/N13`; `S12/N12`; `S14/N14` | `L07`, `L08`, `L09`, `L10` | `SC03`, explicitly `precinct_proposal_not_registered` |
| Exterior Front | market exterior; living witness stage | `S11/N11`; `S05/N05` | none claimed; external routes remain proposals | `SC01`, explicitly `precinct_proposal_not_registered` |

[G] The Exhaled Road graph additionally freezes `Bellwater Road` as the accepted modeled approach, `Crown Road access` as the canonical access semantic, and `Cairnmarket arrival fan` as the proposed connector, with relationship `unresolved_do_not_alias` and `geometryClaim: false`.

## 11. Full-corpus collision contract

[P] The candidate freezes the 49 accepted quest IDs as a literal corpus binding rather than deriving its proof scope from whatever happens to be loaded at runtime. Binding ID: `accepted-expansion-quest-corpus-49-wave05-v1`; digest version: `recursive-key-sorted-canonical-json-v1`; canonical JSON byte count: `187488`; SHA-256: `ad3d218bb952f8868e0f2c01e79784dcb84bc18581970c124345619e635fa9d0`. [G] The digest covers complete accepted `EXPANSION_QUESTS` records, recursively key-sorted and ordered by quest ID. The standalone test independently recomputes bytes and digest, confirms exact ID equality, and performs 588 candidate-to-accepted prose comparisons. Any accepted-corpus edit invalidates this evidence until a new binding version and new semantic review are authored.

Accepted comparison IDs:

1. `main_noon_came_bleeding`
2. `main_the_saint_cast_two_shadows`
3. `main_the_bell_that_forgot_you`
4. `main_the_door_in_mothers_rib`
5. `main_parliament_of_one_mouth`
6. `main_archive_of_open_wounds`
7. `main_mercy_has_a_mouth`
8. `main_the_engine_with_an_off_switch`
9. `main_a_sun_small_enough`
10. `side_the_disease_called_grief`
11. `side_seven_lamps_for_six_streets`
12. `side_the_hospice_grows_a_heart`
13. `side_the_dead_vote_no`
14. `aftermath_house_outlived_tenants`
15. `aftermath_census_of_absences`
16. `aftermath_purity_blooms_at_dusk`
17. `aftermath_cart_accepts_office`
18. `aftermath_village_arrives_before_dead`
19. `aftermath_every_door_mothers_voice`
20. `aftermath_roof_made_of_weather`
21. `aftermath_child_older_than_road`
22. `aftermath_three_hands_one_lever`
23. `aftermath_maintenance_window_miracle`
24. `aftermath_person_engine_must_outlive`
25. `aftermath_cost_that_learned_to_vote`
26. `reaction_orchard_casts_legal_shadow`
27. `reaction_rain_owes_door_answer`
28. `reaction_machine_widowed_minute`
29. `faction_heresy_gentle_horizon`
30. `faction_hunger_asked_taxed`
31. `character_saint_cannot_inherit_body`
32. `character_thirteen_pilgrims_one_feet`
33. `regional_cairns_keep_winter`
34. `regional_flood_learned_last_name`
35. `settlement_street_must_burn_once`
36. `profession_bell_paid_in_silence`
37. `relic_mirror_gave_birth_elsewhere`
38. `faction_the_lantern_named_us_last`
39. `faction_living_appeal_aftercare`
40. `character_the_face_noon_borrowed`
41. `character_a_hunger_needs_an_address`
42. `regional_the_tide_refused_harbor`
43. `regional_the_fog_came_to_collect_our_outlines`
44. `regional_the_graves_grew_upward`
45. `regional_an_echo_arrived_first`
46. `profession_the_furnace_inhaled_our_names`
47. `settlement_the_harbor_rang_below_tide`
48. `relic_the_acre_crossed_a_border`
49. `profession_the_well_drank_the_way_home`

[G] String distance is an early-warning gate only. Semantic review remains mandatory.

## 12. Seven high-risk analogue prohibitions

| Accepted analogue | Collision risk | Wave 05 prohibition |
|---|---|---|
| `main_noon_came_bleeding` | moving-cover escort | No candidate moves protective cover beside a subject or rewrites people through escort exposure. |
| `relic_the_acre_crossed_a_border` | four-corner, five-service Acre movement | The Acre stays outside the playable assay; no corner or service moves. |
| `faction_the_lantern_named_us_last` | adaptive counterfactual evacuation | No prediction spiral, alarm hypothesis, or conserved appeal capacity appears. |
| `main_mercy_has_a_mouth` | negotiating-predator interior | The Corridor Maw is never entered, fed, illuminated, or negotiated with. |
| `side_the_disease_called_grief` | diagnostic separation of grief and witness | No pain, refusal, memory, or grief is treated as a symptom. |
| `aftermath_maintenance_window_miracle` | scheduled darkness across dependencies | No clock or dark interval coordinates the black-pipe quest; repeatability causes failure. |
| `aftermath_cart_accepts_office` | physical evidence authors precedent through a nonhuman office at assize | No rotating exhibit docket, weighted standing, axle-authored evidence, or tool-office is recreated. The wedding-ribs hearing narrows copied motion through a live bounded demonstration and voluntary position exchange. |

Nearest-neighbor distinctions are written per quest in the candidate data. Reviewers must evaluate dramatic function, not merely IDs or wording.

### 12.1 Three returning-creature exact analogues

[C] These forms are not unused. Each already appears in an accepted quest's `foundingCreatureOverlayIds`. [P] Their Wave 05 reuse carries a named exact analogue and an authored mechanical distinction:

| Returning form | Accepted analogue | Wave 05 candidate | Required distinction |
|---|---|---|---|
| Witness Crab | `settlement_the_harbor_rang_below_tide` | `wave05_salt_rain_signed_under_roof` | Accepted play is a three-waterline, forty-notch, four-boat flood manifest. Candidate play is six performed shelter clauses plus one exterior shell account; no tide graph, boat capacity, manifest, or flood-return operation. |
| The Acre That Walks | `relic_the_acre_crossed_a_border` | `wave05_salt_field_left_without_moving` | Accepted play moves four corners and five civic services along Bellwater Road. Candidate play consumes four cores from soil already departed; the distant Acre never moves, carries a service, or repairs an outage. |
| Funeral Kite | `regional_the_graves_grew_upward` | `wave05_salt_name_too_heavy_to_fly` | Accepted play runs a grave-root growing year, halts one reclaimed-name pollination line, and recalculates winter yield. Candidate play intercepts tabs over sealed cocoons to separate adaptation risk from lineage; no orchard, route-hours, harvest, ration forecast, or grave reclamation. |

[G] Each candidate quest names the accepted analogue in `nearestAcceptedQuestIds`, records its exact analogue ID, and also acknowledges all three exact analogues in `returningCreatureAnalogueIdsChecked`. ID presence does not substitute for independent semantic review.

## 13. Structural uniqueness inventory

The twelve core verbs are deliberately non-interchangeable:

1. Pair simultaneous ecological apertures.
2. Separate a coerced promise from a freely repeated act.
3. Germinate delayed ecological obligation.
4. Weight anonymous risk without exposing a body.
5. Pin only the public share of an exhaled road.
6. Narrow embodied precedent through safe failure.
7. Disobey a warning safely without healing.
8. Correspond two exterior faces without interior travel.
9. Misfit a vacant civic function into divine omission.
10. Brace an empty vessel for posthumous refusal.
11. Cancel predicted motion into material evidence.
12. Misalign independently caused sounds into lawful change.

Their failure carriers are likewise unique: salinity/sheath exposure; wet/dry contract strands; lost soil chronology; erased relationships/resistance; animal-memory substitution; copied impact; moved gates/unavailable healing; rotated legal standing; misassigned services; station incapacity/lost loyalty; binding charges/destroyed faults; and learned cadences/frozen stations.

## 14. Art and MODEL MAKER implications

[P] If—and only if—the narrative batch is later accepted, the observed authoring-time baseline is 45 PNGs:

- 12 cutouts for the six Lucent Procession and six Charnel Household forms whose concept masters are currently accepted.
- 3 master/cutout pairs for the genuinely unused Remaining Ecology forms—Shutter Stag, Rain Notary, and Ember Midwife: 6 PNGs.
- 12 master/cutout pairs for the proposed support cast: 24 PNGs.
- One reviewed site-direction keyframe for each of Salt Watch, Cairnmarket, and Ember Gate: 3 PNGs.

[P] The support pairs are partitioned into three machine-readable, maximum-six-subject work orders: Remaining Hands `6 + 4`, and Charnel Households `2`. Every order names its exact character membership and requests one concept master plus one transparent cutout per subject.

[P] Witness Crab, The Acre That Walks, and Funeral Kite are returning overlays. They require a fresh read of their canonical art/registry state and reuse of accepted records; this candidate does not issue duplicate concept-art work orders for them.

[G] Actual pipeline records must be reread before creating any work order; the baseline may become stale. Art generation follows narrative acceptance, reviewed visual briefs, family ownership, independent art review, and existing maximum-six-subject work orders.

[G] New characters and creatures would appear in MODEL MAKER only after canonical integration through its current derived inputs. Three environment registry records and local reference links require a separate implementation. The current item interface does not prove per-item art visibility. No asset implies static or animated model readiness.

## 15. Review and admission checklist

A reviewer should reject or return the candidate unless all of the following remain true:

- Exactly 12 quests, 12 exclusive support characters, 12 items, and 12 environments exist.
- Exactly four quests occur at each target site, with two Lucent and two Charnel leads.
- All 15 genuinely unused expansion creatures appear exactly once through `creatureIds`; the three returning overlays appear exactly once through `foundingCreatureOverlayIds`; `creatureAliasIds` is still checked even when empty.
- Every giver, creature, item holder, territory, prerequisite, and returning-character ID resolves to the current accepted data or the candidate-owned namespace permitted for that field.
- Every environment resolves its site, territory, and building typology without inventing an atlas coordinate.
- Every Cairnmarket Charnel placement remains labeled proposal pending habitat review.
- Each support, item, environment, mechanic, dilemma, location, state key, topology, and structural signature is unique within the batch.
- Every quest owns at least five substantive objectives, a decisive beat, persistent failure, three state values, a spatial mutation, a dialogue constraint, and all five authorship-proof fields.
- Every quest binds its collision evidence to the frozen 49-quest corpus ID, version, byte count, and SHA-256; it checks all seven high-risk analogues and all three returning-creature exact analogues.
- Every topology has valid edge endpoints, one connected component reachable from its nonregistered temporary stage, exact objective-node references, separate anchored exclusions, exact candidate-local S/N/L/SC crosswalks, and no registered-safe-cell claim.
- Cairnmarket crosswalks use exact precinct proposal IDs without importing their geometry or promoting `SC01`–`SC03`; Bellwater Road and Crown Road remain explicitly unresolved and unaliased.
- Exported lookup tables are frozen plain records with pure nullable lookup functions, not mutable `Map` instances.
- No support master, cutout, model, environment runtime, production geometry, construction, review, acceptance, or release claim is promoted.
- Published strings contain no private path, account, URL, session, provider, or external-call provenance.
- Two reviewers who did not author the quest complete semantic and state/referential review before any acceptance proposal.

## 16. Open questions intentionally left open

- [P] Whether any Charnel Household form may receive a reviewed Cairnmarket site habitat.
- [P] Exact scale, coordinates, registered safe-cell dimensions or behavior, encounter pressure volumes, actor schedules, collision, navigation, and streaming implementation. Candidate topology proves only authored graph consistency.
- [P] Whether Senn Avir receives an accepted visual brief and remains the giver of the ninth quest.
- [P] Whether each proposed state write is admitted, renamed, sequenced, or refused during canonical state-ledger review.
- [P] Whether the 12 item mechanics remain balanced and contestable in later quests.
- [P] Whether each visual brief passes family art direction and forbidden-content review.
- [P] Whether any candidate should read an accepted prior state; no prerequisite or state-read relationship is claimed here. Empty arrays are deliberate and their foreign-key gates already reject unknown future additions.

[G] These unknowns are not omissions to fill implicitly. They are decision gates for the next independent review and integration wave.
