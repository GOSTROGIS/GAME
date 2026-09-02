# Sable Reach World Spatial Bible

Status: first independently mergeable world-definition tranche
Machine contract: `packages/content/src/world-spatial.data.js`
Type contract: `packages/content/src/world-spatial.data.d.ts`
Validation: `tests/world-spatial.mjs`

## Mandate

This bible turns accepted GAME canon into an actionable world, environment, architecture, ecology, and setpiece contract for Claude Design. It does not replace the canonical GIS atlas, narrative module, bestiary, or existing Hearthmere scene. It makes their relationships explicit and gives unplaced content an honest production envelope.

The system is sized for the release target of 5,000 independently authored quests. It currently enumerates every accepted expansion quest rather than manufacturing generic location templates. A future quest is admitted only with its own location program, mutable environment layers, fail-forward spatial mutation, sensory law, semantic anchors, and cross-reference proof.

The world remains fictional. Exact atlas values are modeled design coordinates, not real-world observations. Where canon has not fixed a boundary or point, this bible deliberately records a range, a host region or site, and a provisional status instead of inventing survey precision.

## Authority and maturity

Every spatial fact carries one of four authority levels.

| Level | Meaning | Coordinate rule |
|---|---|---|
| `canon` | Accepted GAME canon or an accepted modeled atlas fact | Exact modeled coordinates may be preserved, but they remain `fictional_modeled_not_measured` |
| `authored_design_constraint` | A production constraint derived from canon | Ranges, capacities, relationships, room graphs, and envelopes are allowed; they are not surveyed facts |
| `provisional_placement` | A reserved location or boundary not yet fixed by the atlas coordinator | No invented exact atlas point; only host region/site, dimensions, topology, and design intent |
| `reference` | Independently reviewed supporting material that explains an accepted constraint without becoming canon geometry | May visualize relationships or use declared local/diagram coordinates, but cannot establish surveyed placement, atlas meters, or runtime geometry |

Maturity is independent of authority. A canonical site may be `world_data_only`; a provisional quest location may still be `authored_blockout_contract`; a beautiful keyframe does not make terrain or architecture production-ready.

## Coordinate and scale law

The only atlas coordinate reference system is `veyl_local_grid_v1`, an engineering grid in meters with axes easting, northing, and elevation. It has no external authority code. Its modeled extent is 16,384 by 12,288 meters.

Spatial layers nest without implying equal maturity:

1. The 512-meter atlas macro cell addresses terrain, ecology, route, and distant state.
2. The 32-meter site chunk addresses local geometry, collision, navigation, phase state, audio, and interaction. This is already proven by Hearthmere's 3×3 prototype scene.
3. The 16-meter interior cell is an authored design constraint for room graphs and mobile living interiors.
4. Semantic anchors identify testimony, custody, access, consent, service, and fail-forward evidence. They survive mesh replacement.

Hearthmere's existing local Y-up coordinates remain preserved by its accepted atlas transform. No legacy tile grid is promoted into global truth.

## Atlas overview

The six territory polygons are canonical and exhaustive. Environment values below are production envelopes derived from the accepted atlas and world kit; they are broad by design.

| Territory | Elevation envelope | Landform and substrate | Hydrology | Weather and light | Traversal identity |
|---|---:|---|---|---|---|
| Veil Coast | -12–80 m | Marine alluvium, tidal shelf, black-coral shoal | Reedward estuary, storm surge, surface-coupled water table | Salt rain, hard onshore squalls, cold cyan overcast | Tide causeways, rope ferries, suction silt, false inland tide |
| Dunmire | -4–90 m | Peat basin, drowned parish shelves, reed channels | Reedward and preserved ponds, water at or above grade | Still rain, ground fog, moonless teal-gray | Raised causeway, mire boat, hidden doors, uphill flood |
| Graven March | 70–420 m | Slate upland, black-pine basin, cairn ridges | Bellwater and short snowmelt pulses | Ash drizzle, sleet, ridge gusts, dead calm under pine | High roads, slate switchbacks, warm cairns, seasonal road closure |
| Hollow Abbey | 20–360 m | Karst shelf, sink valley, ossuary cave | Abbey Sink, roof rain, discontinuous karst water | Cold rain, cave condensation, eclipse shafts | Processional steps, upper cloister, crypt descents, resonance hazards |
| Mirror-Salt Waste | 30–260 m | Closed playa, gypsum ribs, salt-clay crust | White Run into a closed basin and brine lens | Abrasive wind, pearl-gray glare, false horizons | Compass-post arcs, crust failure, borrowed distance, one-way refuge |
| Cinderward | 100–700 m | Ironstone ridge, slag ravine, foundry terraces | Deep water, condensate capture, quench surges | Dry ash, stack drafts, cold blue night and local furnace heat | Iron Spine Road, gantry loops, chain lifts, heat wash, glasswood |

### Hydrology law

- Streams, terminals, crossings, and route polylines remain owned by the canonical atlas.
- Water must explain where it arrives, where it collects, and how an inhabited place obtains safe water.
- Supernatural hydrology is stateful, not decorative. Dunmire water moves uphill only where a named maintenance, kinship, or reflection law authorizes it.
- Flood marks, drain paths, algae, salt shelves, scoured plaster, and displaced household routes are evidence layers.
- A bridge is not production geometry merely because a modeled crossing exists. Its load, width, parapet, flood clearance, repair history, and route role require blockout review.

### Soil and bearing law

- Veil Coast marine alluvium and Dunmire peat demand piles, broad foundations, tied walkways, and visible settlement.
- Graven slate and Cinderward ironstone support mass but fail through frost or heat fracture.
- Hollow Abbey karst can be strong at the surface and hollow beneath. Roof fall, sound propagation, and water loss must agree.
- Mirror-Salt crust is a surface over weak brine. A flawless white floor without crust breaks, load spreading, or route testing is wrong.

### Weather and light law

There is no generic “dark fantasy fog.” Each region has a transport mechanism, masking effect, and gameplay job.

- Veil Coast fog and spray move with tide and onshore wind.
- Dunmire fog stays low, absorbs ordinary sound, and reveals blackwater reflection errors.
- Graven March occlusion comes from black pine, ash, cairns, and intentional winter absence.
- Hollow Abbey depth is shown by rain-now, rain-later, resonant returns, and eclipse columns.
- Mirror-Salt distance is readable but unreliable; hard silhouettes and post arcs replace compass UI.
- Cinderward uses cold ambient blue and tightly controlled orange heat. Orange everywhere destroys the service and hazard hierarchy.

Warm light always has an owner, fuel, service route, and cost. Lucent light is cold, beautiful, exact, and stoppable only when the current state has earned a refusal or maintenance path.

## Canonical sites and design envelopes

Atlas anchors are canonical. Core and influence radii below are provisional production envelopes, not cadastral boundaries.

| Site | Kind/status | Core / influence | Population design range | Primary typologies |
|---|---|---:|---:|---|
| Hearthmere | Settlement / prototype playable | 192 / 640 m | 780–1,160 | Slate tenant house, Unlit Hospice, bell civic house |
| Gloamharbor | Settlement / prototype playable | 176 / 720 m | 410–690 | Harbor-bell house |
| Warden Reed | Settlement / prototype playable | 160 / 680 m | 330–560 | Stilt house, submerged vestry |
| Cairnmarket | Settlement / prototype playable | 176 / 760 m | 460–740 | Cairn hall, road assize |
| Hollow Abbey | Ruin / prototype playable | 256 / 960 m | 0–48 | Mute nave, Foundry of Borrowed Quiet |
| Salt Watch | Settlement / prototype playable | 144 / 720 m | 180–330 | Caravan and brine-still house |
| Ember Gate | Settlement / prototype playable | 208 / 800 m | 620–980 | Furnace dwelling, law forge |
| Sluice Chapel | Ruin / world data | 112 / 320 m | 0–12 | Submerged vestry |
| Pale Measure | Ruin / world data | 96 / 280 m | 0–8 | Karst civic/measure shell |
| Anchor Field | Ruin / world data | 128 / 460 m | 0–18 | Tide and quarantine salvage structures |
| Smothered Kiln | Ruin / world data | 128 / 400 m | 0–22 | Law-forge service shell |
| White Meridian | Ruin / world data | 112 / 520 m | 0–20 | Caravan refuge and mirror nursery |

Population ranges guide density, utilities, path capacity, and daily activity. They are not spawn counts and do not assert that every resident is visible at once.

## Traversal network and cost

The atlas owns five named routes and ten modeled sections. Modeled walking time is canonical design data; local geometry and final playtime are not.

| Route | Nodes | Surface | Traversal reading |
|---|---|---|---|
| Bellwater Road | Gloamharbor → Hearthmere → Cairnmarket | Slate road | Reliable high winter line; wet hard footfall; carts remain plausible |
| Reedward Causeway | Gloamharbor → Warden Reed → Hearthmere | Oak and reed causeway | All-season quarantine route; wet cost rises sharply; hollow sound gives advance warning |
| Processional Steps | Warden Reed → Hollow Abbey → Salt Watch | Limestone trail | Dry karst shelves; steep, wet, non-cart route; sound travels farther than sight |
| Iron Spine Road | Hearthmere → Ember Gate → Salt Watch | Ironstone road | Ore-train grades and industrial access; strong bearing, exposed heat and glasswood |
| False Horizon Track | Salt Watch → White Meridian → Ember Gate | Salt-clay trail | Wide visual clearance, weak crust after water, directional error and route debt |

Every quest blockout has three route classes:

1. Primary route: communicates current objective and landmark.
2. Risk or service route: exposes cost, counterplay, maintenance, or alternate witness.
3. Return or shortcut route: proves spatial change and supports persistent aftermath.

An authored route change must update navigation, collision, population use, acoustics, scent transport, and service access under the same phase identifier.

## Visibility, acoustics, and scent

These are gameplay layers, not decoration.

### Visibility

- Every mechanic cue must survive regional weather at its intended encounter distance.
- Occlusion is authored through terrain, architecture, moving cover, weather, light, and population—not a uniform fog volume.
- Lucent geometry reads through exact pale mass, narrow gold seams, admission lanes, shutters, and interrupted symmetry.
- Charnel geometry reads through black-nacre load paths, domestic repairs, entries, exits, and living service channels.
- Neutral spaces show work before allegiance: water, food, beds, maintenance, queues, roads, and appeal routes.

### Acoustics

- Veil Coast: rigging, undertow, quarantine bell.
- Dunmire: absorbed footfall punctured by waterborne knock and submerged bell.
- Graven March: pine strain, stone clicks, delayed footsteps, and meaningful lack of birds.
- Hollow Abbey: one-beat-late returns, urn pitch, missing voices, and pressure silence.
- Mirror-Salt: salt hiss, mirror tick, distant route chime.
- Cinderward: furnace inhale, chain groan, coolant hiss, glasswood chime.

Sound sources receive a location and propagation rule. A cue cannot be a global non-diegetic warning if the counterplay depends on direction, silence, delay, or line of sight.

### Scent

Scent fields provide creature ecology, stealth, and environmental continuity. They travel by tide, ground water, wind, thermal plume, or living circulation. Each region has a small stable vocabulary; quest-specific scents are layered over it. Scent must never become a floating colored trail unless an authored sense or tool makes it visible.

## Architecture and building law

Fifteen blockout-ready typologies live in the machine module. They are not final meshes. Each record provides footprint and story envelopes, load system, exterior materials, weathering, roof, water, heat, waste, light, room graph, thresholds, prop families, and traversal rules.

### Hearthmere

Slate tenant houses are additive records of tenancy: black-pine frames, repaired slate courses, old door heights, clay name alcoves, spring-rill gutters, and rear maintenance exits. The Unlit Hospice separates receiving, consent, wards, living-heart circulation, wash, appeal, and mortuary routes. The bell civic house separates public, archive, lamp-service, bell, council, and rear maintenance loops.

### Veil Coast and Dunmire

Harbor houses rise above surge with tide stairs, storm cellars, tied roofs, and hooded lamps. Dunmire houses have both causeway and boat exits; no inhabited room below flood line is a dead end. Drowned vestries maintain surface, submerged, and roof routes with visible air and return contracts.

### Graven March

Cairn halls combine market, oath, family-cairn, winter store, and animal-den boundaries. Seasonal ecology can close a public route without trapping residents. Road assizes keep testimony positions separate while the road continues to function around the hearing.

### Cinderward

Furnace dwellings distinguish physical doorway, civic address, and civic function. Shared heat has an occupant-owned cutoff and two heat-separated exits. The law forge has three independent test loops, seven independently serviceable noon rings, quench and dependency routes, and manual egress that survives total power loss.

### Hollow Abbey

The Mute Nave supports central, side-aisle, upper-cloister, urn-field, exact-word, and crypt loops. Rain and delayed echo reveal depth. The Foundry of Borrowed Quiet organizes seven social silence rooms around cooling physics; it is not a rhythm puzzle or musical diagram.

### Mirror-Salt

Caravan houses use wind locks, low tied roofs, gypsum walls, brine stills, and covered mirrors. Mirror nurseries have two accountable claimant approaches. A false destination may become one-way only under explicit quest state.

### Lucent and Charnel exceptional architecture

Lucent cathedrals are precise and breathtaking, but coercion remains spatial: admission gates, witness rails, pressure crypts, and service darks. Refusal thresholds retain a materially possible benefit. Charnel living interiors are horrifying but inhabited: resident patches, kitchens, cisterns, vote chambers, service arteries, and revocable exits. Domestic scale interrupts anatomical monumentality.

## Utilities, thresholds, and props

### Utilities

Every inhabited typology answers four questions:

- Water: source, storage, distribution, isolation, contamination, and flood return.
- Heat: fuel or body source, zoning, cutoff owner, exhaust, and failure state.
- Waste: ordinary, medical, industrial, burial, or living-host channels kept accountable.
- Light: source, fuel, shutters, service path, and what darkness enables rather than merely hides.

### Thresholds

A threshold is any reversible boundary governing movement, consent, evidence, custody, weather, maintenance, or jurisdiction. It receives an ID and rule. Decorative doors without a room relation are discouraged; quest-critical doors receive a semantic anchor and authored open, closed, refused, failed, and aftermath states.

### Props

Props fall into five production roles:

1. Utility evidence: cistern, drain, brazier, quench wheel, bed track.
2. Labor evidence: tools, repair splints, wage hardware, carts, route markers.
3. Social evidence: chairs, meal tables, patient property, household names, appeal stations.
4. State evidence: blank seals, address plates, shutters, moved functions, cracked thresholds.
5. Ecology evidence: dens, root seams, tide lines, scent deposits, hibernation closures.

Quest-critical props are never replaced by generic clutter and never carry baked readable text.

## Population and activity cycles

Activity is keyed to local environmental time, not one global day/night script.

| Site | Dominant cycles | Spatial consequence |
|---|---|---|
| Hearthmere | Pre-dawn service, dawn distribution, late-day work, dusk lamp route, deep-night refuge | Queues, ward access, lamp circuit, and shadow patrol change |
| Gloamharbor | Ebb, slack water, flood tide, night watch | Shore work moves vertically; ferries and tide stairs open or close |
| Warden Reed | First light, work day, fog fall, sluice night | Causeway, boat, lantern, and flood-room routes trade priority |
| Cairnmarket | Cold morning, market day, dusk cairn, winter night | Public road can become deliberate ecological absence |
| Hollow Abbey | Roof rain, eclipse high, quiet shift, absolute silence | Nave, foundry, crypt, and echo ecology change occupancy |
| Salt Watch | Cold glare, wind peak, long shadow, white night | Perimeter work contracts into wind locks; route departures move to long shadow |
| Ember Gate | Cold shift, furnace inhale, hot shift, quench, ash night | Gantry density, service darkness, shutdown access, and fire watch change |

Ruin sites use explicit work windows and deliberate absence. They do not silently spawn a town-sized population.

## Creature habitat interface

### Founding families

All 21 founding families and all 178 forms are partitioned exactly once in `FAMILY_HABITAT_ENVELOPES`. Each record exposes a split authority object: `identityAndCanonicalRange: canon` covers the accepted family/form identity and habitat-profile ranges, while `productionEnvelope: authored_design_constraint` covers the added microhabitat, exclusion, visibility, acoustic, and scent direction. Those production layers must never be promoted to canon merely because they share a record with canonical data.

| Family | Primary territory or route | Microhabitat signature | Readable sensory law |
|---|---|---|---|
| Ashbound | Graven March / Hearthmere | Burned tenancy thresholds, name-rack ash | Paper and soot interrupt warm fog; cold soot and fired clay |
| Cairn Beasts | Graven March | Warm cairn, black-pine den, closed winter road | Stone mass and grave heat; pebble clicks and lichen |
| March Deserters | Graven roads | Blank order posts, trenches | Military spacing without heraldry; wax and wet iron |
| Drowned Parish | Dunmire | Submerged nave, roof islands | Architecture and body share a waterline; hymn below water |
| Reed Coven | Dunmire | Reed walls, charm islands | Knotted reed moves against wind; peat smoke and whisper |
| Kilnforged | Cinderward | Furnace throat, slag gate | Heat-bearing silhouette; plate strain and hot iron |
| Glasswood | Cinderward | Slag-root seam, reflection grove | Black growth splits orange light; glass chime and ozone sap |
| Hush Order | Hollow Abbey | Mute aisle, exact-word gate | Deliberate empty sound; dust and grave wax |
| Echo Choir | Hollow Abbey | Urn field, choir vault | Architecture answers one beat late; wet bronze |
| Ossuary Vermin | Abbey / March | Bone drawer, crypt spoil | Accountable remains assemble; tooth click and bone dust |
| Bell Revenants | Bell routes | Belfry, memory-clapper route | Rope and bronze without a tower; displaced toll |
| Salt-Waste | Mirror-Salt | False horizon, compass arc | Directional organs break pale horizon; gypsum and mirror tick |
| Veil-Coast | Coast / lower mire | Reef shelf, tide causeway | Gill, rope, coral through surf; iodine and rigging |
| Shuttered Ward | Hearthmere / Dunmire | Ward corridor, bed threshold | Care architecture moves first; linen, wax, plaster |
| Charnel Measures | March / Abbey | Grave survey, body registry | Anatomy shares load with measure tools; lime and plumb line |
| Black Sluice | Dunmire / coast | Culvert, ceiling-flood room | Reflection leads upstream; silt and reverse drain |
| Last Pest Cart | Quarantine roads | Lay-by, erased destination | Vehicle anatomy without generic vehicle; plague wax |
| Breath Tithe | Cinderward | Smelter exhaust, vent court | Visible metered pressure; hot slag and assessed exhale |
| White Ague | Mirror-Salt | Meridian, gypsum hollow | Orientation fails around hard pale mass; compass scrape |
| Pallid Root Communion | March / Abbey | Grave-root seam, orchard below | Root negotiates bone and soil; grave loam and fungus |
| Anchored Quarantine | Coast / estuary | Anchor field, fleet shadow | Nautical mass shares impossible anchor; tar and hawser strain |

### Expansion creatures

All 39 expansion creatures have individual general habitat envelopes. Their identities, ecology, locomotion, and cues are canon. Territory/site envelopes, population ranges, and atlas placement remain authored constraints or provisional.

| Creature family | Forms covered | Spatial law |
|---|---:|---|
| Lucent Procession | 9 | Restoration sites and processional routes require a witnessed rule, a target, and a readable approach lane |
| Charnel Households | 11 | Mobile living interiors require legible entry/exit, household use, and a protective function; Boundary Gnasher colonies remain tied to obsolete invited lines |
| Remaining Ecologies | 6 | Civic edges and adapted ecologies persist through a named service or exchange outside combat |
| Noon-Wound Ecologies | 2 | Restored buildings contain conflicting occupancy evidence and changed access |
| Lucent Propagules | 1 | Breath, masonry, organism, and accountable custodian share one propagation corridor |
| Charnel Weather | 1 | Benefit and downstream drought are visible in one accountable weather body |
| Dawn-Engine Symbionts | 1 | Maintenance access and the excluded dependency remain spatially distinct |
| Cairn Beasts expansion | 1 | Hibernation needs a complete no-footfall interval, not transferred grave heat |
| Dunmire Reflections | 1 | Real and reflected doors open together; uphill water is an authored state |
| Salt-Waste Brood | 1 | Every horizon is a desired, feared, abandoned, or refused destination embodied as anatomy |
| Echo Choir extension | 1 | Foreword Cantors occupy measurable stress, warning, and sufficient-cause overlaps rather than generic ruins |
| Breath Tithe extension | 1 | Union of Last Breaths remains one accountable collective around paid intake, refusal, and safe venting |
| White Ague extension | 1 | Return Drinker binds reversible route debt to witnessed utility loops without inventing a destination |
| Anchored Quarantine extension | 1 | Dry Anchor Delegates remain bounded appendages of one fleet and one separable petition, never independent ships |
| Dunmire Visibility Instruments | 1 | Borrowed Silhouette Escrow is one body with four serialized bank feet and cannot treat reflections as borrowers |

The machine record names each creature's microhabitats, local population range, canonical quest links, visual cue, acoustic layer, scent, and provisional placement status. This allows Claude Design to place an ecology without pretending a final spawn point exists.

## Accepted quest environment programmes

Every authored expansion quest has its own environment record. The canonical setpiece sentence is preserved in the machine module. The table below is a blockout index, not a substitute for the full record. It indexes 49 programmes: 48 release-attested quests and the single in-review quest `relic_mirror_gave_birth_elsewhere`; table presence alone does not confer release status.

| Quest ID | Location | Host / mode | Minimum spatial programme |
|---|---|---|---|
| `main_noon_came_bleeding` | Hearthmere dusk circuit | Hearthmere exterior loop | Continuous shade-cart circuit, vertical noon wound, resident thresholds, shadow-refuge return |
| `main_the_saint_cast_two_shadows` | Vespera processional ruin | Hollow Abbey ruin court | Two incompatible shadow lanes, three witness rescues, halo-nail focus, asylum exit |
| `main_the_bell_that_forgot_you` | Three stopped villages | Multi-site route | Three noon marks, visible bell-note corridor, name doors, counter-toll outside civic centers |
| `main_the_door_in_mothers_rib` | Nacre internal village | Mobile living settlement | Rib door, ward voting routes, organ evidence junctions, safe exit artery |
| `main_parliament_of_one_mouth` | Mute amphitheatre | Hollow Abbey civic exterior | Thirteen voice positions, deliberate-rest center, thirteenth ballot exit, auditor ring |
| `main_archive_of_open_wounds` | Scar Margin Archive | March/Abbey margin | Four wound margins, four bearer stations, public/private publication threshold |
| `main_mercy_has_a_mouth` | Interior of restrained Maw | Sentient predator interior | Negotiated mouth, one unconsumed path, companion hides, three memory temptations |
| `main_the_engine_with_an_off_switch` | Cinderward law forge | Ember Gate industry | Three disaster bays, rewiring floor, veto gallery, manual shutdown, inherited-fault exit |
| `main_a_sun_small_enough` | Crucible at world's late edge | Remote Mirror-Salt finale | Hand-sized crucible, four law orbits, faction witnesses, consequence gallery, open horizon |
| `side_the_disease_called_grief` | Hospice memory ward | Hearthmere clinical interior | Four grief layers, function test, consent seat, memory suture, appeal sightline |
| `side_seven_lamps_for_six_streets` | Unbudgeted street | Hearthmere moving street | Six joins, one moving address, seven distinct lamps, ration threshold, road egress |
| `side_the_hospice_grows_a_heart` | Hospice living ward | Hearthmere adaptive clinic | Six bed routes, heart gallery, denied-care threshold, bias edit, manual fallback |
| `side_the_dead_vote_no` | Countryless assize | Cairnmarket road court | Three ash chairs, descendant ring, evidence bay, appeal exit, functioning road bypass |
| `aftermath_house_outlived_tenants` | Folded townhouse | Hearthmere domestic interior | Family dinner anchor, folding rooms, historic doorframes, exclusion pocket, safe exit |
| `aftermath_census_of_absences` | Double census | Hearthmere civic light queue | Body and silhouette queues, one lamp pivot, separated absence areas, appeal station |
| `aftermath_purity_blooms_at_dusk` | Breath-and-gutter seedfront | Hearthmere roof network | Connected gutter, breath corridor, custody thresholds, visible repair, quarantine return |
| `aftermath_cart_accepts_office` | Stationary cart assize | Cairnmarket vehicle hearing | Motionless cart, axle focus, four evidence orbits, witness ring, road-office threshold |
| `aftermath_village_arrives_before_dead` | Three-age family hearing | Charnel household time interior | One meal across three ages, grave threshold, outside chronology aperture, consent exit |
| `aftermath_every_door_mothers_voice` | Hundred rib-door passage | Mobile threshold array | Hundreds of individual doors, one voice route, resident revocations, lethal weather corridor |
| `aftermath_roof_made_of_weather` | Migrating storm roof | Weather body over village | Roofless beneficiary, storm body, rafter zones, downstream drought, named leak |
| `aftermath_child_older_than_road` | Pell's unfolded black heath | Graven open heath | Seven human-scale turns, road approaches, recognition/recoil, witness ridge |
| `aftermath_three_hands_one_lever` | Triune control chambers | Cinderward linked interior | Three chambers, one handle, three pull vectors, appeal routes, machine consequence |
| `aftermath_maintenance_window_miracle` | Seven-ring service array | Cinderward artificial noon | Seven rings, assigned darkness, dependencies, unseated quorum, manual dark egress |
| `aftermath_person_engine_must_outlive` | Three succession chambers | Cinderward governance interior | Shadow, pulse, and name chambers plus a freely walking living body route |
| `aftermath_cost_that_learned_to_vote` | Fracture ratification floor | Cinderward service floor | Continuous fracture, blank seals, claimant threshold, fading benefit, appeal route |
| `reaction_orchard_casts_legal_shadow` | Orchard of second births | Hearthmere civic orchard | Newborn silhouette tree, five thresholds, organ route, claimant station, custody exit |
| `reaction_rain_owes_door_answer` | Nacre open-sky appeal field | Weather hearing | Five exposure towers, forecast stitch, drought witness, archive shelter, contradiction route |
| `reaction_machine_widowed_minute` | Unelapsed minute beneath Cinderward | Smothered Kiln temporal site | Surface rust, stopped interval, backward seraph, lived terraces, institutional exit |
| `faction_heresy_gentle_horizon` | Cathedral of six rehearsed dawns | Hollow Abbey Lucent cathedral | Six refusal bays, Liora vessel, Oculus approach, community witnesses, service dark |
| `faction_hunger_asked_taxed` | Fear exchange beneath thirteen tables | Charnel market interior | Thirteen tables, restraint lot, worker exits, bailiff station, rib-ledger reparation |
| `character_saint_cannot_inherit_body` | Mortal estate inside Vespera's veil | Magnified probate interior | Four rooms, autonomous entry, four sense routes, evidence filing, restitution exit |
| `character_thirteen_pilgrims_one_feet` | Road that moves only by vote | Multi-border road | Thirteen positions, four ballot modes, three border laws, midstep exit, destination admission |
| `regional_cairns_keep_winter` | Black-pine occlusion basin | Cairnmarket regional ecology | Three failed dens, five shadow gates, choir basin, road closures, trade overlook |
| `regional_flood_learned_last_name` | Uphill drowning genealogy | Sluice Chapel route | Three households, four confluences, stair genealogy, heirloom room, paired doors |
| `settlement_street_must_burn_once` | Cinderward readdressing district | Ember Gate district | Six transfer traces, four address plates, legal fire route, testimony, evacuation loops |
| `profession_bell_paid_in_silence` | Foundry of Borrowed Quiet | Hollow Abbey foundry | Seven social silence rooms, molten floor, ripple sightline, wage archive, funeral route |
| `relic_mirror_gave_birth_elsewhere` | Nursery of false horizons | White Meridian ecology | Mirror womb, four landscapes, three feedings, route-debt rescue, creature-first choice |
| `faction_the_lantern_named_us_last` | Hearthmere counterfactual cistern | Provisional Hearthmere civic insert | District cistern, seven-shutter relief, isolated fuel path, flood sump, exterior appeal return |
| `faction_living_appeal_aftercare` | Hearthmere six-wing aftercare | Provisional Hearthmere clinical addition | Six sensory habitats, living authorization stations, physical interruption access, patient-controlled exits |
| `character_the_face_noon_borrowed` | Pale Measure executor court | Provisional Hollow Abbey ruin insert | Four witness bays, halo-alignment track, bounded load stations, pressure crypt, mortal fallback patrol |
| `character_a_hunger_needs_an_address` | Pale Measure influx perimeter | Provisional refugee-camp landscape | Household decks, potable and waste services, firebreaks, invitation boundaries, deliberate public gap |
| `regional_the_tide_refused_harbor` | Anchor Field two-tide clinic | Provisional Veil Coast intertidal landscape | Mooring petitions, wet clinic, tethered delegate lanes, two-tide operation, dry appeal return |
| `regional_the_fog_came_to_collect_our_outlines` | Warden Reed four-bank visibility network | Provisional Dunmire causeway edge | Four banks, paired sight routes, living borrower ledger, safe cells, silhouette-debt return |
| `regional_the_graves_grew_upward` | Cairnmarket grave-root orchard | Provisional Graven subterranean orchard | Seasonal grave-root chambers, harvest and funeral thresholds, thaw witness, food-service return |
| `regional_an_echo_arrived_first` | Hollow Abbey foreword cause frames | Provisional nave/crypt/roof system | Four sufficient-cause frames, timed clearances, stress and warning paths, branch-specific return |
| `profession_the_furnace_inhaled_our_names` | Ember Gate paid-breath furnace | Provisional Cinderward industrial compound | Twelve intake sleeves, six seal pairs, cold human center, shift exchange, safe manual venting |
| `settlement_the_harbor_rang_below_tide` | Gloamharbor three-waterline bell block | Provisional Veil Coast harbor block | Four harbor houses, three account ledges, submerged bell chamber, dry refuge, boat-accessible return |
| `relic_the_acre_crossed_a_border` | Bellwater mobile service corridor | Provisional Graven road landscape | Four moving corner cells, five service nodes, former/receiving tie-ins, bypass, streaming handoff |
| `profession_the_well_drank_the_way_home` | Salt Watch return-water utility | Provisional Mirror-Salt utility landscape | Brine intake, treatment train, potable storage, four reversible loop posts, six-leg condenser, waste marsh |

### Wave 04 full-detail handoff

Claude Design must open `packages/content/manifests/quest-wave-04-v11.world.json` directly for the full Wave 04 environment and habitat contract. It contains the detailed foundations and hazards, typology bindings, semantic anchors, drainage and waste, back-of-house, schedules, habitat anchors, encounter contracts, mutable layers, state serialization, directed graphs, utilities, safe observation cells, objective endpoints, independent egress, and blockout execution contracts. `packages/content/manifests/quest-wave-04-v11.spatial-index.json` is deliberately compact and must never be used as the full design source.

All twelve Wave 04 programmes use host-relative provisional reservations and retain `exactAtlasCoordinate: null`. Their provisional design coordinates may support local blockout reasoning but are not canonical atlas points. The two manifest files are authored handoff references only: they do not prove GIS acceptance, runtime integration, navigation or collision, production geometry, construction readiness, or environment-art acceptance.

### Quest environment admission gate

Before blockout is accepted, verify:

1. Primary, service/risk, and return routes exist.
2. The setpiece, mechanic cue, moral cost, and affected population read together.
3. Failure changes geometry, access, evidence, population, utility, or ecology and play continues.
4. Critical thresholds, witnesses, creature cues, and state deltas have semantic anchors.
5. Ordinary human scale survives cosmic, temporal, or anatomical spectacle.
6. Every state read has a materially different environmental input or an explicit precondition.
7. No accepted setpiece can be recreated by a noun swap into another location programme.

## Environmental storytelling law

Every set carries five evidence layers in order:

1. Substrate and deep history in terrain, foundations, and buried routes.
2. Failed institution in civic geometry, ritual hardware, and abandoned utilities.
3. Ordinary survival in repairs, food, water, beds, work, and informal paths.
4. Current dispute in queues, thresholds, moved functions, and ecology boundaries.
5. Player consequence in persistent access, route, material, service, and population changes.

Repairs are additive. New work never erases the silhouette of the harm it addresses. Horror retains a social or ecological function outside combat. A prop that owns testimony, custody, access, debt, or consent is never anonymous clutter.

## Environment art-direction law

- Grounded stylized dark-fantasy production design with plausible load, drainage, repair, access, and use.
- The world is decayed and dying but still inhabited and maintained.
- Cold desaturated atmosphere dominates; warm accents are scarce, local, and accountable.
- Lucent beauty is pale, exact, angelic, and ominous. Restrained gold is structural. Coercion appears in light, admission, symmetry, and classification.
- Charnel horror is black-nacre, living, and profoundly unsettling. Household use, protection, civic space, repairs, and exits remain real.
- Remaining Hands spaces show work, rationing, compromise, weather, and contested access without heroic banners.
- One to three landmarks; primary, service, and return routes; human doors, stairs, beds, rails, and workers as scale evidence.
- No purposeless spikes, floating debris, impossible stairs, decorative machinery, generic castle language, unexplained monumentality, readable text, labels, arrows, UI, logos, watermarks, frames, or presentation boards.

Accepted visual direction is indexed by repository-relative paths and content hashes in the machine module. Six accepted keyframes cover Hearthmere, Dunmire, Cinderward, Hollow Abbey, and the Graven March, plus the Cathedral of Six Rehearsed Dawns as quest-location direction. The Cathedral does not replace Hollow Abbey's regional keyframe or claim production geometry. Veil Coast and Mirror-Salt still need independently reviewed standalone keyframes; their data and art laws exist, but no image is claimed as accepted here.

### Accepted technical blockout reference

Gloamharbor's tide-refuge precinct has one independently reviewed two-dimensional topology reference at `assets/world/technical/veil-coast-gloamharbor-tide-refuge-blueprint-v14.png`, paired with the exact machine-readable topology at `assets/world/technical/veil-coast-gloamharbor-tide-refuge-topology-v14.json`. It is a Claude Design blockout aid for the following reviewed relationships:

- five adjacent refuge cells joined by four literal internal openings;
- one front exterior door at Cell 1 and one right exterior door at Cell 5;
- a 13-node, 12-edge continuous step-free route from the wheelchair landing to the bell;
- an independent five-node right boardwalk that does not rejoin the frontage or touch the Cell 1 approach canopy;
- a main roof, Cell 1 approach canopy, and separate right-boardwalk canopy covering their assigned circulation;
- one pale gutter/cistern chain and one bronze source/refill/lamp chain kept visibly distinct.

Build the first graybox from the JSON graph and use the PNG to audit adjacency and route continuity. Treat every JSON x/y value as a diagram pixel, never a world meter. Do not infer surveyed/GIS placement, CAD or structural detail, final construction dimensions, accessibility compliance, room dressing, mood, façade design, collision, navigation, runtime behavior, gameplay behavior, 3D readiness, or production readiness from it. It is not the missing Veil Coast environment keyframe. Generated Veil atmosphere and Mirror-Salt candidates remain unaccepted.

### Reviewed six-site executable blockout reference

Claude Design can open `assets/world/spatial/world-spatial-wave-02-v9.annex.json` on demand for the independently reviewed, noncanonical deep blockout of Gloamharbor, Sluice Chapel, Pale Measure, Anchor Field, Smothered Kiln, and White Meridian. The exact published 49,416,945-byte privacy-redacted derivative is bound by SHA-256 `4ddba07f2e7c74700d021421cbc20dd0ee27e9ccef730e9258fb6cfaebb3ffe4`; `assets/world/spatial/world-spatial-wave-02-v9.provenance.json` binds it to the reviewed source hash, proves that only 39 unpublished workspace locator fields were removed, and records the maturity boundaries.

The reference contains nine local frames, 12 structures, 67 authored rooms, 28 exact local habitat placements, 24 localized hazards, 64 utility networks with 1,529 nodes and 1,247 edges, 69 service profiles, 30 operating roles, 67 tasks, 378 spatial domains, 1,783 nodes, 1,465 routes, 62 safe cells, 51 state gates, 389 thresholds, 36 vertical-access systems, and 36 separate emergency stairs. The stair systems serialize 402 flights, 3,360 treads, 72 supports, and 144 landing platforms. Its three older quest crosswalks address Sluice Chapel, Smothered Kiln, and White Meridian.

Source precedence is strict:

1. The canonical atlas and accepted GAME site records own world placement.
2. `packages/content/manifests/quest-wave-04-v11.world.json` owns its twelve provisional Wave 04 quest-environment contracts.
3. The world-v9 annex deepens six existing sites and three earlier quest crosswalks as reviewed noncanonical blockout evidence.
4. The Veil topology remains a five-cell diagram-pixel reference and must never be scaled or aligned onto the annex's site-local meter frame.

The v9 repair closes 12 formerly disconnected station arrivals across ten access systems, yielding 144/144 station contacts while changing only 24 allowlisted polygon roots. This improves the blockout evidence; it does not make the annex canonical atlas geometry, exact placement, runtime-integrated geometry, a production asset, release-ready, or construction-ready. Final structural, accessibility, fire, geotechnical, code, construction, navigation, collision, streaming, traversal, and performance validation remain unresolved.

## Streaming and LOD

| Ring | Distance | Required state |
|---|---:|---|
| LOD0 gameplay | 0–42 m | Full collision, mechanic cues, interactive thresholds, hero materials, full rigs |
| LOD1 site | 42–128 m | Silhouette-preserving mesh, major route state, large light/VFX, simplified rigs |
| LOD2 landmark | 128–384 m | Roof/skyline mass, landmark state, environmental phase, crowd impostor or none |
| LOD3 atlas | 384 m+ | Terrain envelope, hydrology, route thread, and regional weather only |

Quest outcomes stream as compact deltas over a stable base set. Do not duplicate whole settlements per outcome. Navigation, collision, audio, scent, light, utilities, and population use the same phase ID. Critical actors, exits, and fail-forward evidence are pinned before their approach sightline opens.

Current inherited ceilings include 700 visible draw calls at high quality, 18 visible dynamic lights, 2,400 active particles, 14 simultaneous ambient voices, and texture density of 1,024/512/256 texels per meter for hero/standard/background classes. These are budgets, not evidence that an unbuilt set meets them.

## Claude Design handoff

For any region, site, creature, building, or quest:

1. Resolve the machine record by canonical ID. For Wave 04 full-detail work, open `packages/content/manifests/quest-wave-04-v11.world.json` explicitly rather than relying on its compact spatial index. For one of the six reviewed deep-blockout sites, open `assets/world/spatial/world-spatial-wave-02-v9.annex.json` on demand and retain its noncanonical local-frame boundary.
2. Read authority and maturity before using coordinates or claiming readiness.
3. Build graybox from route, room graph, threshold, utility, and design-envelope records.
4. Place semantic anchors before detailed props.
5. Apply regional terrain, weather, light, acoustic, scent, material, and weathering layers.
6. Add population cycle and ecology; confirm the place functions without the player.
7. Add quest state deltas and fail-forward mutation.
8. Compare against accepted visual references and global art law.
9. Validate cross-references and budgets.
10. Promote only after independent environment, narrative, gameplay, and technical reviews agree.

## Deliberately unresolved decisions

- No exact atlas coordinates exist yet for the 49 expansion quest locations; all twelve Wave 04 additions explicitly retain `exactAtlasCoordinate: null`.
- Site influence radii are production envelopes, not final settlement boundaries.
- Veil Coast and Mirror-Salt lack accepted standalone environment keyframes; Veil Coast has only the separately scoped Gloamharbor topology blockout reference described above.
- Local terrain, bridge geometry, navmesh, crowd schedules, scent simulation, and room meshes outside existing prototypes are not production-ready.
- The six-site world-v9 packet is reviewed noncanonical blockout evidence only; it does not establish atlas placement, production geometry, runtime behavior, or engineering compliance.
- Mobile Charnel interiors require a runtime ingress/egress transform contract before seamless streaming can be claimed.
- Population ranges require simulation and performance validation before becoming spawn schedules.
- Thermal bands, visibility ranges, LOD rings, and building dimensions are authored constraints subject to blockout tests, not climatic or surveyed measurements.

These unknowns are visible work. They must not be silently converted into precise facts by an art, layout, or generation tool.
