# Sable Reach — Quest Wave 03 v2 Candidate Packet

## Freeze and supersession

- **Maturity:** review candidate; not canonical content
- **Supersedes:** `design-review/SABLE-REACH-QUEST-WAVE-03.md` as the only Wave 03 candidate eligible for further review
- **Reason for supersession:** the v1 packet was independently rejected for machine-schema gaps and five semantic or artifact collisions. It remains immutable evidence and must not be edited or admitted.
- **Authorship:** Wave 03 v2 revision agent
- **Approval:** none. The author does not approve this packet.
- **Admission requirement:** two fresh non-author semantic reviews over the exact frozen v2 Markdown and machine annex, followed by coordinator admission.
- **Normative machine annex:** `design-review/SABLE-REACH-QUEST-WAVE-03-v2.machine.json`
- **Canonical dependency:** the 25 accepted schema-v2 quests and their exact outcome values in `packages/content/src/narrative.data.js`
- **Contents:** exactly 12 quests, 12 quest-exclusive support characters, 12 signature artifacts, nine authored creature forms, and two autonomous companion contracts.
- **Pipeline truth:** all 21 new visual subjects are `awaiting-art`; no cutout, static model, rig, animation, or 3D-readiness is claimed. Returning companions retain only their actually accepted concept-master paths.

The annex is normative for IDs, references, types, state contracts, objectives, dialogue theses, and production readiness. This prose explains dramatic work and reviewer-facing branch composition. If prose and annex disagree, the packet is rejected rather than silently repaired.

## Rejection closure map

| v1 hard failure | v2 closure |
|---|---|
| Q10 `settlement`, Q11 `profession`, and Q12 `relic` were outside the allowed quest-type union | All three use machine type `side` while retaining `settlement`, `profession_systemic`, and `relic_creature_ecology` portfolio IDs. |
| Quest cards omitted exact objective records and `dialogueThesis` | The annex contains complete schema-v2 records for all twelve quests, including ordered objective objects and a distinct dialogue thesis. |
| Support characters lacked full machine fields and pipeline families | Every support has `factionId`, role, desire, fear, contradiction, secret, structured voice, alignment options, visual brief, owned quest, and an explicit pipeline family/status object. |
| Artifacts lacked category and structured custody, activation, cost, and later-contest interfaces | Every artifact uses candidate schema version 2 with a compatibility `mechanic` string plus structured `custody`, `activation`, `cost`, and `laterContest` objects. |
| Creatures lacked required machine identity and pipeline fields | Every creature has `familyId`, faction affinities, rank, combat role, anatomy, locomotion, sound, ecology, origin, purpose, cue/mechanic/counterplay, narrative use, visual brief, and a complete pipeline. |
| Founding-only givers could not resolve in the expansion validator | Q09 and Q10 are given by `enoch_last_lamplighter`; Q12 is given by returning expansion character `pell_nacreyear_road_witness`. No founding-only ID is referenced as a giver. |
| Guest/follower autonomy was prose-only | The annex proposes `CompanionQuestContractV1` and supplies exact records for Vespera and the Prince, including entry, independent action, refusals, autonomous priority, trust state, transitions, availability, and exit. |
| Q06/Q07 trust was not machine-defined | Exact keys, enumerated values, upstream-derived initial values, event-driven transitions, forced-exit counters, and availability effects are encoded. |
| Q01 and Q08 both midwifed intangible resources through hosts | Q01 retains moving-jurisdiction birth. Q08 is replaced by an ecological hibernation performance: it creates winter through deliberately unused roads and black-pine occlusion; it moves no heat, body, organ, or custody through a host. |
| Q02 repeated bodily revocation/emergency override, and its failure repeated Q09 room relocation | Q02 is replaced by a public forecast-appeal system. No body is weather infrastructure, no door is routed, and no room moves. A failed appeal makes a forecast recur as a dated exterior climate precedent. |
| Q08 repeated the dead-polity/descendant refusal hearing | Q08 never adjudicates the dead, descendants, burial, title, or speaking authority. The accepted state only changes heat topology used to stage animal hibernation. |
| Q04 and Q05 both made harmed effects into voices inside bodies and institutional claimants | Q04 failure now vitrifies a lost adaptation into a silent exterior stained-glass obstruction; it never speaks, inhabits a body, or gains standing. Q05 alone retains an embodied claimant after feeding. |
| `sovereign_dripstone` duplicated `borrowed_eave` | Replaced by `barometer_of_unhappened_rain`, which suspends the coercive force of a forecast when contradicted by live observation. It cannot redirect, cancel, or name a recipient for environmental harm. |
| `probate_veil_unowned_source` duplicated historic-burden inspection | Replaced by `bifurcated_estate_key`, which requires two separate agents to perform an inherited duty and exercise its attached right. It does not inspect or reveal historic burden. |

## Machine-extension proposals

No accepted schema is changed by this packet. Admission would require the coordinator to make the following additive extensions before inserting records:

1. `ExpansionArtifactV2` retains `id`, `name`, `category`, `mechanic`, and `lore`, and adds structured `custody`, `activation`, `cost`, and `laterContest` objects. The validator should require every field for new records while continuing to read existing V1 items.
2. `CompanionQuestContractV1` is a separate collection keyed by `questId + companionId`. It does not pretend companion autonomy fits inside `ExpansionCharacter` or `ExpansionQuest`.
3. `ExpansionCreature` adds required `sound` and `purpose` strings. These are release-law requirements already present in prose but absent from the TypeScript interface.
4. Giver resolution remains expansion-character-only for this batch. No validator widening to founding rosters is required.

## Portfolio and sequel lock

| Slot | Machine type | Portfolio | Quest | Accepted upstream writer |
|---:|---|---|---|---|
| 01 | `world` | `world_state_reaction` | **The Orchard Casts a Legal Shadow** | `aftermath_census_of_absences` + `aftermath_purity_blooms_at_dusk` |
| 02 | `world` | `world_state_reaction` | **Rain Owes the Door an Answer** | `aftermath_every_door_mothers_voice` + `aftermath_roof_made_of_weather` |
| 03 | `world` | `world_state_reaction` | **The Machine's Widowed Minute** | `aftermath_three_hands_one_lever` + `aftermath_cost_that_learned_to_vote` |
| 04 | `faction` | `faction_schism` | **The Heresy of a Gentle Horizon** | `main_a_sun_small_enough` |
| 05 | `faction` | `faction_schism` | **The Hunger That Asked to Be Taxed** | `main_parliament_of_one_mouth` |
| 06 | `character` | `character_guest_follower` | **A Saint Cannot Inherit Her Own Body** | `main_the_saint_cast_two_shadows` |
| 07 | `character` | `character_guest_follower` | **Thirteen Pilgrims, One Pair of Feet** | `main_parliament_of_one_mouth` |
| 08 | `regional` | `regional` | **The Winter the Cairns Learned to Keep** | `side_the_dead_vote_no` |
| 09 | `regional` | `regional` | **The Flood That Learned a Last Name** | `main_the_bell_that_forgot_you` |
| 10 | `side` | `settlement` | **The Street That Must Burn Once** | new Cinderward state; no upstream read |
| 11 | `side` | `profession_systemic` | **A Bell Is Paid in Silence** | `main_the_bell_that_forgot_you` + `aftermath_maintenance_window_miracle` |
| 12 | `side` | `relic_creature_ecology` | **The Mirror That Gave Birth to Elsewhere** | new Salt-Waste ecology; no upstream read |

Every all-values read in the annex enumerates exactly the accepted writer's outcome set. The two empty reads explicitly begin new chains. Q01–Q09 and Q11 are true continuations: their premise and mechanics cannot exist without a concrete upstream value.

## Quest 01 — The Orchard Casts a Legal Shadow

The accepted double-census and luminous-graft rulings collide when a separated shadow buds a child from a Hearthmere wall. Tesse Amble must deliver anatomy while jurisdiction changes at every contraction. The citizenship value controls who may authorize an organ; the ecology value controls whether tissue comes from a liable host, licensed public threshold, or finite sterile graft. The player cannot revisit evidence after labor begins.

The unavoidable question is not who counts or who owns a seed—both are accepted history—but whether a new person can survive when its biology and legal guardian change at different speeds. A failed assignment grows one organ in Tesse's independent twin-shadow, costing Tesse the corresponding sense and creating an involuntary co-parent. Q08 no longer performs any analogous host transfer or birth.

## Quest 02 — Rain Owes the Door an Answer

Mother Nacre's roof has learned that an official forecast can be more useful than weather: it now makes the least-contested forecast come true. Exit-right outcomes determine who may contradict a prediction; weather-custody outcomes determine who may publish it. The player tests five future-weather claims against live exterior observations before the Weather-Edict Widow seals one as precedent.

No resident carries rain, no door becomes infrastructure, no pressure is redirected, and no emergency bodily override is replayed. The dilemma is whether predictability can remain public knowledge without becoming command over climate. A failed appeal does not relocate a room: the false forecast becomes a recurring dated weather event over an exterior landmark, visibly binding future agriculture and travel until contested.

## Quest 03 — The Machine's Widowed Minute

Every dawn-engine shutdown displaced the same mortal minute beneath Cinderward. A society has lived for generations between two ticks. Control identity determines what act may advance each second; inherited-cost law determines which component, institution, or witness ages when it advances. Nell Orrery must decide whether her children ever reach the same day.

The mechanic spends elapsed time as testimony rather than scheduling maintenance. Wrong proof still advances the second and ages its witness into memories of the hidden district. The quest may complete the minute, recognize and seal the enclave, or rotate temporal debt among beneficiaries.

## Quest 04 — The Heresy of a Gentle Horizon

After the campaign has selected a cosmic light regime, a Lucent chapter asks whether refusal itself may be canonized as a law of light. Six horizons demonstrate that they could restore memory, anatomy, shadow, agriculture, architecture, and time—and stop. Their unused restoration accumulates around Subcanon Liora, an unwilling vessel.

The campaign ending changes the material danger and witnesses at every demonstration. Failure restores the target and removes one adaptation; the lost adaptation vitrifies as a silent dark panel on the cathedral exterior, physically obstructing later horizons. It neither speaks, inhabits Liora, nor receives claimant status. This leaves Q05's embodied feeding claimant unique.

## Quest 05 — The Hunger That Asked to Be Taxed

The Prince's accepted diplomatic form determines who can verify restraint when the Charnel Night tries to govern feeding. The player prices only a fully begun but voluntarily interrupted act of consumption. Fear workers must have an executable exit, and a predator cannot buy its way out by being forcibly staggered.

If restraint fails, the Appetite Bailiff incorporates the consumed person's speaking claim into the predator's rib-ledger. This is the packet's only failure that makes a harmed party an embodied institutional claimant. The outcomes license feeding with bodily reparation, create a worker-owned fear commons, or leave each hunt personally answerable outside public appetite law.

## Quest 06 — A Saint Cannot Inherit Her Own Body

Saint Vespera enters the mortal source's estate as an autonomous guest. Her accepted shadow relation determines initial trust and which source-sense she will expose. At each room she chooses light-sense or source-shadow-sense; the player controls passage but cannot issue a follower command to choose perception. Cera Invi files evidence gathered under only one mode.

The proposed trust key `vespera_probate_trust` has exact values and transitions in the annex. Two prohibited eviction attempts trigger a non-failing early departure and narrow the outcome to protected legal distinction. The replacement `bifurcated_estate_key` does not inspect a predecessor record: it forces one agent to perform a duty and a different agent to exercise the attached right before either may discharge the estate.

## Quest 07 — Thirteen Pilgrims, One Pair of Feet

The Prince's stationary diplomatic status becomes locomotion. Every proposed step receives thirteen independently computed positions; dissent bends the road, abstention gives the Unsounded Host a temporary limb, and an exiting voice must reach safe jurisdiction before the remaining body may proceed.

The trust key `prince_route_trust` records whether the player honors costly dissent or engineers convenient ties. It controls the original throat's testimony and is not reducible to dialogue flavor. Two forced-replacement attempts cause a non-failing departure; Iro and the Host finish the route with only destination-appointed throats reachable.

## Quest 08 — The Winter the Cairns Learned to Keep

The Graven March's accepted dead-settlement outcome has changed the topology of grave heat, preventing Cairn Beasts from completing hibernation. The quest never revisits who may speak for the dead. Instead, the player teaches the landscape winter by creating five deliberately unused intervals: roads are closed in sequence, black-pine canopies occlude warm markers, and animal footfalls—not testimony—prove dormancy.

The three upstream values create diffuse, household-concentrated, or migrating heat patterns and therefore different occlusion geometries. A premature cadence makes one public road hibernate under a non-destructive stone torpor until the next seasonal window; trade reroutes and the ecology continues. No heat enters a host, no organ is implanted, no corpse is moved, and no descendant carries authority. Outcomes preserve a breeding corridor, make villages share seasonal hibernation, or disperse the herd by ending artificial grave warmth.

## Quest 09 — The Flood That Learned a Last Name

Enoch brings the player to Dunmire after an accepted calendar outcome causes a blackwater reflection to treat performed maintenance as kinship. Relationships open uphill channels; a denied relation floods the witness's oldest remembered room into the Sluice Son. Rescue becomes evidence without making resemblance proof.

Q02 no longer relocates any interior, so this fail-forward remains singular. `enoch_last_lamplighter` is a validator-visible returning giver; Moth Winn remains the quest-exclusive support and owns the decisive disclosure that his sold maintenance right created the creature's claim.

## Quest 10 — The Street That Must Burn Once

Cinderward's furnace reads public reputation and burns the legal address the settlement praises most. The player rotates address plates while testimony changes ignition pressure; buildings, social esteem, and civic functions move independently. A wrong transfer burns one room and permanently moves that room's civic function into the next address rather than resetting play.

This is machine type `side`, portfolio `settlement`, and is given by returning expansion principal Enoch Vale on behalf of the League. The quest starts `cinderward_sacrificial_address` without claiming a nonexistent upstream state.

## Quest 11 — A Bell Is Paid in Silence

Hollow Abbey restores names through a bell whose seven craft operations are paid with future social silences: sleep, secrecy, refusal, mourning, concentration, truce, and death. Calendar history determines which silence exists; maintenance law determines who can inspect or hold it during casting. A flawed operation immediately spends the nearest pledged silence and leaves a functional crack with a named creditor.

This is machine type `side`, portfolio `profession_systemic`. Ader Coil's signed and tool-based voice law prevents other characters from substituting speech for his decision. The product gives creditors a real veto over its restorative benefit.

## Quest 12 — The Mirror That Gave Birth to Elsewhere

An Elsewhere Calf grows directional organs from witnessed destinations. Every rescue conserves distance by making an abandoned route harder. The player cannot command or tame it; custody follows the conscious mirror-parent, the free migrating creature, or a seasonal pilgrim covenant.

This is machine type `side`, portfolio `relic_creature_ecology`. Returning expansion character `pell_nacreyear_road_witness` is the giver because the Calf's conserved distance has made Pell's previously witnessed road-age inconsistent. Elian Brine remains the exclusive support. The quest starts a new ecology with an honest empty state-read contract.

## Reviewer requirements

Two fresh reviewers must independently hash and inspect both files. Neither may rely on the v1 approvals because v2 changes dramatic work and schemas.

- Parse the annex as strict JSON.
- Confirm exactly 12 quests, 12 exclusive supports, 12 artifacts, nine creatures, and two companion contracts.
- Confirm machine quest types are limited to `main`, `side`, `faction`, `character`, `regional`, and `world`.
- Resolve every giver, support, creature, item, upstream state key, and upstream state value against the accepted corpus plus this annex.
- Confirm every support is owned by exactly one new quest and its `questArcIds` contains that quest.
- Confirm every objective array is ordered, non-generic, and has a shape distinct from all accepted quests and the other v2 records.
- Confirm every artifact has a unique rule after nouns and magnitudes are removed, plus custody, activation, cost, and later contest.
- Confirm Q02 performs forecast appeal rather than bodily revocation, weather allocation, burden redirection, or interior relocation.
- Confirm Q08 performs ecological hibernation rather than burial authority, descendant override, host transfer, heat routing, or corpse delivery.
- Confirm Q04's failure remains silent exterior architecture and Q05 alone creates an embodied claimant.
- Confirm the companion trust keys, values, initial conditions, transitions, availability, and exits are executable without improvisation.
- Confirm all new pipelines are honest and returning companions claim only existing concept masters.
- Run corpus collision and state-reachability reviews. Passing text similarity is insufficient.
- Do not mark either file canonical, accepted, illustrated, modeled, rigged, or animated during review.

The author records no pass/fail judgment.
