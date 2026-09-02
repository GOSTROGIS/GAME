# Hearthmere Hold Precinct Bible

[D] This dossier is a build contract for Claude Design. It translates tracked Hearthmere canon and authored spatial constraints into implementable environment, population, ecology, quest, and concept-art requirements while preserving every unresolved placement as a gap or proposal.

[D] Authority is carried on every substantive statement: `[C]` is canonical fiction or canonical identity; `[D]` is a tracked authored design constraint or prototype contract; `[P]` is a reversible implementation proposal; `[G]` is an unresolved gap, ambiguity, or required decision.

## 1. Authority, scope, and source ledger

### Authority legend

| Tag | Meaning | Claude Design treatment |
| --- | --- | --- |
| [C] | Canonical fiction, identity, relationship, outcome, or atlas fact in tracked game data. | Preserve meaning; do not revise through geometry or visual inference. |
| [D] | Authored design constraint, manifest contract, or spatial program in tracked game data. | Implement as a constraint, but do not mistake prototype dimensions or placement for final canon. |
| [P] | Reversible proposal supplied by this dossier to make the design buildable. | Prototype, review, and replace without changing canon. |
| [G] | Unresolved, unverified, or deliberately unspecified information. | Keep parameterized; escalate before fixing it into a final asset. |

### Source precedence

- [C] `src/data/world.js` governs the world premise, Hearthmere's narrative identity, level band, ambience, and named legacy landmarks.
- [C] `src/data/characters.js` governs the ten Hearthmere residents, Ysra Pell's Dunmire residence, their roles, factions, motivations, secrets, and relationships.
- [C] `packages/content/src/narrative.data.js` and `packages/content/manifests/quest-wave-04-v11.narrative.json` govern expansion characters, quest premises, objectives, moral dilemmas, outcome values, and named rewards.
- [C] `packages/content/manifests/sable-reach.atlas-runtime.json` governs Hearthmere's atlas identity, coordinate, territory membership, and named regional route membership.
- [D] `packages/content/src/world-spatial.data.js` governs the radial spatial envelope, regional physical profile, building typologies, activity cycles, environmental storytelling law, art law, and quest location programs.
- [D] `packages/content/manifests/hearthmere.scene.json` and `packages/content/manifests/hearthmere.assets.json` govern the current 96 m prototype shard and its minimum semantic anchors; they do not establish final settlement geometry or production readiness.
- [D] `packages/content/manifests/quest-wave-04-v11.world.json` governs the two Wave04 Hearthmere spatial graphs and their utility, egress, safe-cell, schedule, and ontology contracts.
- [G] No concept image, blockout, procedural mesh, current chunk coordinate, or prototype screenshot is authority for final parcel shape, final street alignment, final façade, exact actor spawn, or final model readiness.

### Exact coverage matrix

| Domain | Required set | Covered here | Authority split | Unresolved |
| --- | ---: | ---: | --- | --- |
| [C] Hearthmere atlas site | 1 | 1 | Canonical identity and coordinate | [G] Final cadastral boundary |
| [C] Named regional route memberships | 3 | 3 | Bellwater Road, Reedward Causeway, Iron Spine Road | [G] Local gates and exact ingress splines |
| [D] Nested spatial scales | 4 | 4 | 640 m influence, 192 m core, preserved 96 m shard, nested interiors | [G] Final parcel subdivision outside the shard |
| [D] Building typologies | 3 | 3 | Tenant house, Unlit Hospice, bell-and-ledger civic house | [G] Building count and exact siting |
| [C] Founding Hearthmere residents | 10 | 10 | Six Ember Ledger, two Bell-Wardens, one Reed Sister, one Grave Tithe | [G] Final schedules and homes |
| [C] Visiting named actor | 1 | 1 | Ysra Pell, canonically resident in Dunmire | [G] Visit cadence beyond the current scene |
| [C] Expansion quest actors | 15 | 15 | Three recurring principals and twelve support actors | [G] Final non-quest routines and residences |
| [D] Hearthmere-capable founding creature families | 5 | 5 | Ashbound, March Deserters, Bell Revenants, Shuttered Ward, Last Pest Cart | [G] Exact encounter allocation beyond two current prototypes |
| [D] Forms in those families | 42 | 42 | Ten, ten, ten, six, and six forms respectively | [G] Population budgets and final spawn points |
| [C] Hearthmere quest environments | 10 | 10 | Four initial programs, four consequence programs, two Wave04 programs | [G] Final embedding for the first eight graphs |
| [D] Wave04 spatial graphs | 2 | 2 | Cistern and aftercare | [G] Final meshes and art are explicitly absent |
| [C] Persistent consequence keys | 10 | 10 | Thirty-one exact outcome values | [G] Visual priority when several outcomes coexist |
| [D] Concept-art shot contracts | 13 | 13 | Establishing, systems, interiors, quests, and Wave04 spaces | [G] Production acceptance for each new shot |

## 2. Atlas, CRS, and regional routes

### Atlas identity

- [C] Hearthmere is `site.hearthmere`, a settlement inside `territory.graven-march`, positioned at `[6400, 8320, 184]` in `veyl_local_grid_v1`.
- [C] Its canonical subsistence is terrace gardening and spring fish; its canonical industry is bell bronze and hospice craft; its dead receive clay names before cremation; its canonical government is a three-vigil council.
- [C] Hearthmere is the level 1–6 starter region and a refuge formed around the last warm spring under the permanent ash veil.
- [C] Its canonical sensory identity includes banked braziers, wet slate, and a bell that rings unequally.
- [G] The atlas coordinate is not a surveyed doorway, spawn point, civic-house centroid, or proof of the settlement's exact footprint.

### Coordinate reference and local authoring frame

- [D] All regional placement must retain `veyl_local_grid_v1`; exports must record any temporary local origin and the reversible transform back to the atlas coordinate.
- [P] Use a host-relative local frame centered on the atlas site coordinate for the 192 m core and 640 m influence envelope, while preserving the current shard's own north-west origin and axes inside its scene package.
- [D] The current shard uses north-west origin, `+X` east, `+Z` south, and `+Y` up; its legacy conversion is 4 m per tile.
- [G] Do not rotate or translate the current shard into a new final placement until a signed transform and route-ingress decision exist.

### Route memberships and measured legs

| Route | Canonical sequence touching Hearthmere | Tracked leg touching Hearthmere | Runtime distance | Runtime travel time | Local implication |
| --- | --- | --- | ---: | ---: | --- |
| [C] Bellwater Road | Gloamharbor → Hearthmere → Cairnmarket | Gloamharbor–Hearthmere | [D] 5,522.2 m | [D] 1,315 s | [P] Reserve a readable through-route continuation; do not assign its gate yet. |
| [C] Bellwater Road | Gloamharbor → Hearthmere → Cairnmarket | Hearthmere–Cairnmarket | [D] 2,843.3 m | [D] 677 s | [P] Keep onward traffic separable from civic queues. |
| [C] Reedward Causeway | Gloamharbor → Warden Reed → Hearthmere | Warden Reed–Hearthmere | [D] 4,785.3 m | [D] 1,495 s | [P] Provide an approach capable of wet arrivals, healer traffic, and refugees without declaring a final direction. |
| [C] Iron Spine Road | Hearthmere → Ember Gate → Salt Watch | Hearthmere–Ember Gate | [D] 7,570.2 m | [D] 1,802 s | [P] Provide a durable freight departure compatible with bronze, handcarts, and winter closure hardware. |

- [G] Which named route enters through which edge, gate, lane, or foreground branch is unresolved; concept art must not fix this by visual convenience.
- [P] Every exterior composition should show route hierarchy through width, wear, drainage, traffic, and repair rather than through signs or written labels.

## 3. Nested spatial extent contract

### Scale stack

| Scale | Extent | Authority | Required content | Forbidden inference |
| --- | --- | --- | --- | --- |
| Influence envelope | [D] 640 m radial design influence; bounds E5760, N7680, E7040, N8960; vertical range 168–232 m | [D] Provisional design envelope, not cadastral boundary | [P] Route approaches, terrace agriculture, spring catchment, cremation/name-firing support, refugee staging, ecology transitions, and distant service landmarks | [G] Do not call its circle a wall, legal boundary, or final playable map. |
| Settlement core | [D] 192 m radial core | [D] Authored core envelope | [P] The inhabited density needed for a settlement population range of 780–1,160, with repeated typologies and civic/service loops | [G] Do not force the population, all quests, or all actors into one 96 m scene. |
| Preserved shard | [D] 96 × 96 m with bounds `[0,-8,0]` to `[96,32,96]` | [D] Current prototype contract | [D] Square, old shrine, belfry, spring arch/channel, east gatehouse/palisade, west encounter verge, player start, Maela, Torren, visiting Ysra, Ash Husk, and Ledger Crawler | [G] Do not promote chunk placement or procedural meshes into final settlement canon. |
| Nested interiors | [D] Typology-specific room graphs | [D] Authored design constraints | [P] Streamed interiors with independent occlusion, acoustic, utility, actor, and state layers | [G] Do not infer exterior location from an interior quest envelope. |

### Preservation and expansion rules

- [D] Preserve the 96 m shard as an addressable nested scene while adjacent streamed cells extend the settlement core; replacement requires an explicit migration rather than silent re-layout.
- [D] The shard has nine 32 m chunks and a perspective camera with free yaw, collision, occluder fade, pitch 28–62 degrees with default 42, and zoom 8–20 with default 14.
- [D] The current terrain macrofeatures are a hold rise centered near `[32,0,20]`, a spring channel running from the core toward the south, an outer approach, and a west encounter lane; these are prototype constraints within the shard.
- [P] Treat the 192 m core as a streaming ring around the preserved shard, not as a single monolithic mesh; route, hydrology, state, and population systems must cross the seam without discontinuity.
- [P] Treat the 640 m influence envelope as a low-density systems field whose content can be represented by streamed route segments, view-dependent silhouettes, distant utilities, and quest-specific subscenes.
- [D] Interiors must be their own nested graphs whenever a room topology, visibility threshold, safe cell, utility isolation, or persistent state cannot be preserved in the exterior shell.
- [G] Building counts, parcel ownership, named quarters, exact street count beyond quest-specific statements, and settlement-wall completeness remain undecided.

## 4. Terrain, hydrology, climate, light, and senses

### Regional physical law

| Layer | Tracked constraint | Build consequence |
| --- | --- | --- |
| [D] Elevation | Graven March spans 70–420 m; Hearthmere atlas elevation is 184 m. | [P] Use local relief and sightline breaks without implying Hearthmere occupies the whole regional range. |
| [D] Landform | Slate upland, black-pine occlusion basin, cairn ridge, and ash-road terrace. | [P] Compose distant landforms as layered systems; final adjacency to the core is unresolved. |
| [D] Ground | Slate and grave loam; fast ridge drainage, perched water at cairns, reliable bearing except in ash pockets. | [P] Make footings credible, soften ash pockets, and expose repaired gullying where traffic concentrates. |
| [D] Failure | Frost-shattered edges and trail gullying. | [P] Align cracks, splints, drains, and resurfacing with water and load rather than applying uniform ruin noise. |
| [D] Water | Bellwater stream/outlet, deep water table except at spring cuts, and brief snowmelt pulses. | [P] Keep the warm spring, clean supply, surface runoff, contaminated wash, and storm overflow visibly distinguishable. |
| [D] Weather | Ash-filtered drizzle, winter sleet, ridge gusts, dead calm under black pine, and -8 to 12 °C. | [P] Weather exposure must affect thresholds, work routes, drying, shelter, and occupancy. |
| [D] Season | Long hibernation winter and unreliable thaw. | [P] Author explicit wet, frozen, and thaw-failure variants rather than a cosmetic snow toggle. |
| [D] Visibility | Approximately 30–1,200 m depending on ash, trees, ridge, and weather. | [P] Support close occlusion, mid-route landmarks, and rare long views without constant vista clarity. |

### Hydrology hierarchy

- [C] The warm spring is Hearthmere's founding refuge and must read as a scarce public service, not a decorative fountain.
- [D] The shard's spring channel is separate from rainfall runoff, and Wave04 spaces separately route clean water, fuel contamination, clinical wash, sump overflow, and storm failure.
- [P] Use distinct section, material, sound, and maintenance vocabulary for: warm potable spring supply; open public rill; roof rain; road runoff; clean overflow; contaminated wash; sealed waste; and emergency sump discharge.
- [P] Every water crossing must show an upstream source class, a downstream destination class, an access or isolation point, and a plausible failure path.
- [G] Spring yield, mineral composition, exact temperature, legal allocation volume, and connection to the drowned child in Fenn's secret are not spatially quantified.

### Light and sensory law

- [D] Ambient light is ash-filtered moon and iron cloud; black pine, cairns, walls, and shutters create occlusion; cairn candles and road lamps create accountable local warmth.
- [D] The regional palette contrasts warm grave cracks and service light with blue slate; warmth must remain scarce, local, and attached to a service or danger.
- [D] Acoustic signatures are pine strain, stone click, delayed footfall, and absent birds; Hearthmere adds an unequal bell, spring water, handcart service, and subdued civic labor.
- [D] Scent signatures are cold resin, grave loam, wet slate, and old ash.
- [P] Author a sensory budget per streamed cell with at least one substrate cue, one living-service cue, and one state-dependent cue; suppress layers where deliberate absence is the story.
- [P] Use warm-light ownership to show who maintains a service: a lit lamp without a reachable maintenance route is a defect, not atmosphere.

## 5. Functional zones and streaming cells

### Existing 96 m shard

| Chunk | Current function | Required semantic content | Maturity warning |
| --- | --- | --- | --- |
| [D] `00` | Hub | Square, old shrine, visiting Ysra, player start, evidence props | [G] Prototype placement only. |
| [D] `10` | Hub | Belfry, spring arch, Maela, Torren | [G] Prototype placement only. |
| [D] `20` | Near | East gatehouse and palisade | [G] Does not prove final route name or wall extent. |
| [D] `01` | Near | West introduction encounter with one Ash Husk and one Ledger Crawler | [G] Does not authorize additional enemies in civic or safe cells. |
| [D] `11` | Hub | Spring channel continuation | [G] Final hydraulic section is unresolved. |
| [D] `12` | Near | Southward and outer spring continuation | [G] Final outfall and route relation are unresolved. |
| [D] `21` | Near | Sparse eastern continuation | [G] Final use is unresolved. |
| [D] `02` | Far | Sparse distant support | [G] Final use is unresolved. |
| [D] `22` | Far | Sparse distant support | [G] Final use is unresolved. |

### Expansion cells

- [P] Add a core service cell that can host repeated tenant-house exteriors, public-private turns, rear handcart lanes, and outcome variants without inventing a named district.
- [P] Add a civic service cell that can host the bell-and-ledger house, ration and appeal queues, lamp maintenance, name-tablet custody, and council hearings without prescribing its exact bearing from the shard.
- [P] Add a hospice cell that can host the Unlit Hospice exterior, appeal court, clinical deliveries, screened mortuary exit, and controlled water routes without placing it on a final parcel.
- [P] Add one or more route-approach cells capable of distinguishing through traffic, refugee arrival, wet-causeway travel, bronze freight, and winter closures.
- [P] Add an influence-envelope service cell or vista layer for terrace gardens, spring fish work, fuel and peat handling, clay preparation, cremation support, and burial evidence.
- [P] Quest envelopes larger than the core must stream as temporary overlays or adjacent subscenes, retaining atlas transforms and return routes.

### Streaming contract

- [D] Public, `ember-ledger-unrestored`, and `ember-ledger-restored` phases already exist in the shard; mutually exclusive state layers must not duplicate colliders, evidence, or actors.
- [D] Every streamed state must update navigation, collision, audio, scent, light, population, and semantic anchors together.
- [D] Exits and critical evidence must stay pinned through phase changes; a consequence may change access but may not strand the player without an authored alternate route.
- [P] Each cell manifest should declare atlas transform, bounds, neighbor portals, water connections, utility connections, actor capacity, safe-cell class, ecology permissions, state deltas, occlusion groups, and art maturity.
- [G] No tracked source proves current streaming performance, final memory budget, final runtime scene count, or production mesh readiness.

## 6. Slate tenant-house typology

### Shell, materials, and weathering

- [D] `hearthmere_slate_tenant_house` has a 6 × 12 m authored footprint, one to two storeys, and a black-pine cruck frame inside repaired slate load walls.
- [D] Its material set is wet split slate, dark oak, clay name tablets, and patched lime; its steep slate roof carries a spring-rill gutter.
- [D] Required weathering is mismatched repair courses, rain-dark lower slate, a soot fan above the shared hearth, and doorframes preserving prior tenant heights.
- [G] Footprint and storey range constrain the typology; they do not establish the number, ownership, orientation, or exact façade of any individual house.

### Exact room graph

| From | To | Threshold | Law |
| --- | --- | --- | --- |
| [D] `street_threshold` | `work_kitchen` | `door.street` | [D] Opens inward behind a rain break. |
| [D] `work_kitchen` | `shared_hearth` | `arch.hearth` | [D] The hearth is the common heat center. |
| [D] `shared_hearth` | `sleep_loft` | `ladder.loft` | [D] The upper floor never blocks the only egress. |
| [D] `shared_hearth` | `name_alcove` | `shutter.names` | [D] This is a private evidence threshold, never decoration. |
| [D] `work_kitchen` | `rear_service_yard` | `door.service` | [D] The opening is wide enough for handcart repair. |

### Utilities, props, and traversal

- [D] Water comes from a shared spring rill and rain barrel; heat comes from a banked common hearth; waste uses a sealed ash crock; light comes from an oil shutter and hearth bounce.
- [D] Required prop families are clay name rack, banked brazier, iron rain barrel, traveller splint bench, and peat drying rack.
- [D] The route must make one public-to-private turn, retain one rear maintenance exit, and prevent the upper floor from becoming the sole egress obstruction.
- [P] Keep kitchen labor, water collection, name custody, sleeping privacy, and rear repair visible as different occupancy states, not as interchangeable set dressing.
- [P] A state change should alter a doorframe, threshold claim, domestic route, object use, or repair seam before it alters color grading.

## 7. Unlit Hospice typology

### Shell, materials, and weathering

- [D] `hearthmere_unlit_hospice` has an 18 × 30 m authored footprint, one to two storeys, and a slate plinth with black-pine frame and adaptable living-wall grafts.
- [D] Its materials are washed slate, dark timber, unbleached linen, and copper drain; its broad slate roof controls rain into a court.
- [D] Required wear is hand-height polish at bed turns, materially dated repair seams, and an explicit absence of sacred-white cleanliness.
- [G] The typology does not establish final exterior placement, ward capacity outside quest-specific states, or a production-ready living-wall design.

### Exact room graph

| From | To | Threshold | Law |
| --- | --- | --- | --- |
| [D] `receiving` | `consent_room` | `door.consent` | [D] Conversation occurs before clinical visibility. |
| [D] `consent_room` | `six_bed_ward` | `threshold.ward` | [D] Entry follows the consent threshold. |
| [D] `six_bed_ward` | `living_heart_gallery` | `track.beds` | [D] Six bed routes remain independently readable. |
| [D] `six_bed_ward` | `memory_ward` | `door.memory` | [D] Memory care remains a distinct branch. |
| [D] `six_bed_ward` | `wash_room` | `door.wash` | [D] Clinical wash remains directly serviceable. |
| [D] `wash_room` | `herb_store` | `hatch.herb` | [D] Herb transfer has a controlled service threshold. |
| [D] `six_bed_ward` | `appeal_courtyard` | `door.appeal` | [D] The exterior exit is patient-controlled. |
| [D] `memory_ward` | `mortuary_exit` | `door.mortuary` | [D] Mortuary movement does not cross the public receiving route. |

### Utilities, props, and traversal

- [D] Water uses a spring header with visible isolation valves; heat uses zoned flue and warming stones; waste separates ash from contaminated wash; lighting is low and reflected, without compulsory glare.
- [D] Required props are rolling bed, memory-thread frame, herb-drying frame, covered instrument tray, and patient-property box.
- [D] Bed routes are at least 1.8 m wide; staff shortcuts never bypass the consent room; the appeal courtyard is visible from every ward route.
- [P] Separate clean delivery, contaminated wash, ordinary visitor, patient appeal, quiet transfer, and mortuary movements through time and thresholds even where they share structure.
- [P] Living grafts must show access, isolation, repair, custody, and failure; they must not become anonymous horror growth.

## 8. Bell-and-ledger civic-house typology

### Shell, materials, and weathering

- [D] `hearthmere_bell_civic` has a 12 × 22 m authored footprint, two to four storeys, and a slate civic base with a splinted timber bell frame.
- [D] Its materials are wet slate, bell bronze, black pine, and clay docket tile; an open bell yoke rises above a steep civic roof.
- [D] Required wear includes bell-vibration hairline cracks in lime, uneven public-step wear toward service desks, and repairs that never erase old names.
- [G] The typology does not establish one mandatory tower silhouette, final floor count, exact square edge, or production-ready bell mechanism.

### Exact room graph

| From | To | Threshold | Law |
| --- | --- | --- | --- |
| [D] `public_steps` | `ledger_hall` | `door.public` | [D] Public entry reaches the accountable civic hall. |
| [D] `ledger_hall` | `lamp_store` | `gate.issue` | [D] Lamp issue remains linked to public record. |
| [D] `ledger_hall` | `bell_stair` | `door.stair` | [D] The stair provides a legible vertical landmark. |
| [D] `bell_stair` | `bell_floor` | `hatch.bell` | [D] Bell access remains a controlled vertical threshold. |
| [D] `ledger_hall` | `council_gallery` | `rail.hearing` | [D] The rail separates speakers without hiding them. |
| [D] `ledger_hall` | `archive_vault` | `door.archive` | [D] The archive uses a two-witness latch and two accountable approaches. |
| [D] `lamp_store` | `rear_maintenance_lane` | `door.maintenance` | [D] The route is wide enough to service seven lamps. |

### Utilities, props, and traversal

- [D] Water uses a spring cistern at the ground court; heat uses a public brazier court; waste uses a clay-sealed civic drain; light uses a bell-floor lantern cage.
- [D] Required props are clay name rack, lamp-service bench, small bell rope, ration scale, and blank address plate.
- [D] Public and service loops intersect exactly once, the bell stair anchors vertical orientation, and the archive has two accountable approaches.
- [P] Queue, hearing, archive, lamp issue, bell maintenance, and rear delivery states must remain readable simultaneously without turning the hall into an oversized throne room.
- [P] Civic authority should read through who can approach, witness, maintain, appeal, or leave, not through banners or monumental excess.

## 9. Maintenance, deliveries, waste, heat, and light

### Settlement service loops

| Service | Canon/design inputs | Proposed physical loop | Required failure evidence |
| --- | --- | --- | --- |
| Spring water | [C] Public warm spring; [D] rills, headers, cisterns, rain barrels | [P] Intake/inspection → public draw → household or hospice branch → visible isolation → clean overflow | [P] Silt, valve closure, queue relocation, frozen branch, or leakage must identify the affected user. |
| Food | [C] Terrace gardens and spring fish; [C] ration governance | [P] Influence production → covered handcart approach → weighing/record threshold → household/hospice distribution | [P] Queue length, scale state, hidden-household detour, and spoilage route carry story state. |
| Clay names | [C] Names fired into clay before cremation; [D] racks and alcoves | [P] Clay preparation → firing support → witnessed civic custody → private name alcove or funerary route | [P] Blank, cracked, repaired, hidden, or displaced tablets encode status without baked text. |
| Lamps | [D] Seven-lamp civic route and wide maintenance threshold | [P] Fuel delivery → lamp store → issue gate → service circuit → repair return → sealed waste | [P] Missing light must correspond to a broken route, absent budget, unsafe access, or deliberate refusal. |
| Bell bronze | [C] Hearthmere industry; [D] bell civic frame | [P] Freight approach → covered store/work threshold → lift or stair exclusion → bell-floor service → crack inspection | [P] Vibration cracks, splints, worn routes, and cooled scrap reveal maintenance history. |
| Hospice supply | [C] Hospice craft; [D] clean/dirty separation | [P] Clean herb/linen intake → receiving/consent separation → ward service → contaminated wash and screened waste | [P] Isolation state, bed-route obstruction, and appeal access reveal clinical pressure. |
| Fuel and heat | [D] peat rack, banked hearths, brazier court, warming stones, flues | [P] Covered fuel receipt → dry store → controlled issue → appliance → ash crock or sealed civic route | [P] Soot, condensation, cold zones, ration marks, and blocked flues show actual use. |

### Non-negotiable utility rules

- [D] Clean supply, roof runoff, street runoff, clinical wash, ash, fuel contamination, and mortal remains must never share an unexplained route.
- [D] Every maintained lamp, brazier, bell, bed, spring branch, and living graft requires an accessible service path and an accountable operator state.
- [D] Repairs are additive and materially dated; new work does not erase prior harm or prior tenant scale.
- [P] Schedule deliveries outside the relevant public peak where possible, but retain one visible conflict point so maintenance remains civic rather than invisible backstage labor.
- [P] Waste leaves by rear or separated routes, yet its route must remain inspectable; concealment cannot substitute for sanitation logic.
- [P] Night warmth should contract toward occupied service nodes, leaving defensible cold gaps rather than bathing the whole settlement in decorative amber.

## 10. Daily, seasonal, and state routines

### Five tracked daily phases

| Phase | Tracked activity | Density | Required spatial response |
| --- | --- | --- | --- |
| [D] `pre_dawn` | Spring channels cleared; hospice night appeals; braziers banked | `sparse_service` | [P] Prioritize utility access, quiet voices, low reflected light, and guarded but usable appeal routes. |
| [D] `dawn` | Water and bread distribution; name tablets fired; road arrivals counted | `hub_peak` | [P] Separate water, food, name custody, and arrivals into intersecting but non-blocking queues. |
| [D] `late_day` | Market repair; bell-bronze work; ward visiting | `distributed_busy` | [P] Spread work sounds and handcarts across core cells while keeping beds and consent thresholds protected. |
| [D] `dusk` | Seven-lamp maintenance; vigil assembly; gate ration audit | `route_peak` | [P] Make the lamp circuit, civic hearing, gate, and shade routes legible under increasing risk. |
| [D] `deep_night` | Shadow-refuge patrol; quiet hospice transfer; spring-watch | `sparse_guarded` | [P] Contract population to guarded services, retain patient-controlled egress, and exclude ordinary hostile ecology from safe cells. |

- [D] These cycles are a simulation contract, not a final spawn schedule.
- [D] Persistent activity signals are ration-queue length, which façades retain shadows, the count and route of civic lamps, and the number or availability of hospice appeal beds.

### Seasonal deltas

| Condition | Ground and water | Population and work | Quest/ecology response |
| --- | --- | --- | --- |
| [P] Cold stable winter | Frozen margins, reduced open runoff, reliable load on some ground, hazardous ice at rills | Fuel, hospice warming, spring watch, and road closure labor intensify | Keep hibernation intervals and closed routes legible; do not populate deliberate absences as empty filler. |
| [P] Sleet and ridge gust | Wind-driven wetting, drain loading, exposed-route discomfort | Shift queues behind rain breaks; suspend unsafe bell or roof work | Increase sound masking and route hazard without moving safe-cell exits. |
| [P] Unreliable thaw | Frost-break, ash-pocket softness, gullying, brief snowmelt pulse | Handcart detours, splint repair, channel clearing, delayed freight | Activate washouts and habitat edges only where drainage and service access remain explainable. |
| [P] Ash-calm under pine | Very low air movement and close visibility | Quiet work and patrol become acoustically exposed | Emphasize delayed footfall and absent birds; do not add ambient wildlife merely to fill silence. |
| [P] Dry pressure interval | Lower runoff, greater fire risk, concentrated spring demand | Ration queues and lamp/fuel scrutiny increase | Use queue and maintenance state rather than universal color grading to show scarcity. |

### Persistent-state deltas

- [D] A state delta may change route, maintenance state, admission boundary, ecology, evidence placement, population, sound, scent, light, or material repair.
- [D] A state delta must update navigation and collision with the same state key that changes visual and audio evidence.
- [P] At most one primary and two secondary consequence signals should dominate a cell at once; remaining outcomes persist through smaller evidence anchors to avoid unreadable state stacking.
- [G] The precedence rule for simultaneous outcomes is not yet canonical and requires a state-composition decision before final dressing.

## 11. Founding residents and visiting Ysra

### Exact resident matrix

| Actor | Canonical role/faction | Proposed primary host | Proposed phase emphasis | Conversation and safe-cell rule |
| --- | --- | --- | --- | --- |
| [C] Maela Voss, `maela_voss` | Keeper, Ember Ledger | [P] Ledger hall, archive witness approach, or public hearing edge | [P] Dawn ration governance; dusk vigil/hearing | [P] Dialogue cell must expose a public route and one accountable archive approach; never spawn hostiles inside it. |
| [C] Avren Doss, `avren_doss` | Assistant Keeper and ration auditor, Ember Ledger | [P] Ration scale, issue gate, or rear hidden-ration handoff | [P] Dawn peak; pre-dawn covert service | [P] Give a non-blocking queue edge and a discreet service exit; safety does not erase observation risk. |
| [C] Bera Claymother, `bera_claymother` | Memorial-tablet maker, Ember Ledger | [P] Firing support, clay rack, or tenant name alcove threshold | [P] Dawn firing; late-day teaching/repair | [P] Conversation requires dry clay handling space and no combat overlap with fragile evidence. |
| [C] Fenn Joryn, `fenn_joryn` | Warm-spring keeper, Ember Ledger | [P] Spring header, public draw, or isolation-valve route | [P] Pre-dawn clearing; deep-night spring watch | [P] Keep the player off the clean-service route during dialogue and provide a dry bypass around the water edge. |
| [C] Dessa Mirel, `dessa_mirel` | Market reeve, Ember Ledger | [P] Market repair edge, public steps, or council hearing | [P] Late-day market; dusk audit | [P] Conversation must not block trade circulation and should expose weights, access, and beneficiaries spatially. |
| [C] Kett Sable, `kett_sable` | Dusk courier, Ember Ledger | [P] Gate threshold, lamp circuit, or route departure | [P] Dusk route peak | [P] Use a walk-and-talk route with two bail-out pockets; do not fix which atlas route he uses. |
| [C] Torren Vale, `torren_vale` | Senior Bell-Warden and combat trainer | [P] Guard edge, bell service threshold, or west training verge | [P] Late-day training; dusk guard; deep-night response | [P] Training may be controlled combat space, but the adjacent conversation pocket remains non-hostile and independently reachable. |
| [C] Alda Rime, `alda_rime` | Cadence keeper, Bell-Wardens | [P] Bell stair, bell floor, or acoustic listening threshold | [P] Dusk vigil; deep-night cadence study | [P] Preserve audible silence after the toll and a safe stair landing; no random encounter can overwrite cadence timing. |
| [C] Iva Pell, `iva_pell` | Midwife and faction envoy, Reed Sisters | [P] Hospice consent room, appeal court, or protected household threshold | [P] Dawn care; late-day visits; pre-dawn births/appeals | [P] Dialogue is private until the player crosses a consent threshold; patient egress remains under patient control. |
| [C] Ilse Crow, `ilse_crow` | Night ration runner, Grave Tithe | [P] Rear maintenance lane, rooftop/service threshold, or hidden-household handoff | [P] Pre-dawn and deep night | [P] Give two non-hostile escape choices and keep food handoff separate from formal ration queues. |
| [C] Ysra Pell, `ysra_pell` | Reed-Sister and marsh healer; resident of Dunmire, visitor in the current Hearthmere scene | [P] Hospice herb/consent route, spring edge, or old-shrine conversation pocket | [P] Visit window tied to healing or Fenn's spring dispute | [P] Mark her as visiting, never as a permanent Hearthmere resident; keep medical conversation outside an encounter volume. |

- [C] The ten residents are exactly Maela, Avren, Bera, Fenn, Dessa, Kett, Torren, Alda, Iva, and Ilse.
- [C] Ysra is not an eleventh Hearthmere resident; her canonical region is Dunmire, while the current scene places her as a visitor.
- [P] A conversation cell is a reachable, nav-stable, non-hostile pocket with controlled background crossings, a visible exit, and no service-path blockage; it is not necessarily an invulnerability volume.
- [G] Exact homes, bed assignments, family cohabitation, route directions, and full-week schedules are unassigned.

## 12. Expansion quest actors

### Exact fifteen-actor matrix

| Actor | Canonical quest function | Proposed environment host | Proposed routine outside the quest | Conversation/safety requirement |
| --- | --- | --- | --- | --- |
| [C] Enoch Vale, `enoch_last_lamplighter` | Recurring giver; Last Lamplighter | [P] Lamp store, dusk circuit, Nullstreet threshold, folded house, double census, or cistern | [P] Inspects lamps and omitted routes at dusk | [P] Always provide a maintained-light edge and a public withdrawal route. |
| [C] Canoness Vael, `canoness_vael_kindly_knife` | Recurring giver; Kindly Knife | [P] Hospice memory ward, seedfront, orchard, or aftercare | [P] Appears only where care, admission, or Lucent consequence is contested | [P] Her beauty and authority never replace patient consent or staff operation. |
| [C] Sister Calve, `sister_calve_unlit_hospice` | Recurring giver; mistress of the Unlit Hospice | [P] Living-heart ward and staff service circuit | [P] Moves between receiving, wards, and appeal visibility | [P] Staff shortcut cannot bypass consent; appeal exit remains patient-controlled. |
| [C] Nima Sorn, `nima_sorn_keeper_of_one_shadow` | Support for When Noon Came Bleeding | [P] Mobile-shade cart circuit | [P] Maintains shade hardware and one protected shadow | [P] Dialogue pocket travels with cover but never enters complete darkness or direct noon. |
| [C] Davren Holt, `davren_holt_widower_of_unrecorded_wife` | Support for The Disease Called Grief | [P] Memory ward and consent room | [P] Quiet patient/visitor state only | [P] Four memory layers remain inspectable; no crowd crosses the consent exchange. |
| [C] Roa Nullstreet, `roa_nullstreet_seventh_tenant` | Support for Seven Lamps for Six Streets | [P] Moving unbudgeted-street threshold | [P] Appears only while a maintained route makes the address reachable | [P] Conversation cannot block the only return path from a moving address. |
| [C] Bek Tallow, `bek_tallow_patient_zero_of_policy` | Support for The Hospice Grows a Heart | [P] Six-bed ward and living-heart gallery | [P] Patient routine follows care, not utility ranking | [P] One independently readable bed route and appeal access remain available. |
| [C] Mara Quoin, `mara_quoin_counter_deed` | Support for The House That Outlived Its Tenants | [P] Folded townhouse thresholds | [P] Inspects hinges, repairs, and occupancy evidence | [P] Dialogue must tolerate room-state changes and retain an exterior fallback. |
| [C] Kessa Pale, `kessa_pale_absence_clerk` | Support for A Census of Absences | [P] Dual-queue reconciliation edge | [P] Performs civic counting only while both queues remain visible | [P] Bodies and shadows get separate waiting footprints and a shared appeal sightline. |
| [C] Roen Fitch, `roen_fitch_dusk_gardener` | Support for Purity Blooms at Dusk | [P] Breath-and-gutter seedfront | [P] Maintains warranted cultivation corridors | [P] Keep living seed transfer out of safe cells unless the cell's custodian explicitly authorizes it. |
| [C] Tesse Amble, `tesse_amble_shadow_midwife` | Support for The Orchard Casts a Legal Shadow | [P] Orchard threshold and witnessed birth route | [P] Midwifery and shadow guardianship only in staffed states | [P] No automated geometry may imply consent to an irreversible graft. |
| [C] Latch Vey, `latch_vey_counterfactual_lamplighter` | Support for The Lantern Named Us Last | [P] Cistern appeal map and public threshold | [P] Rehearsal witness and route custodian | [P] Public appeal route remains open during dialogue and alarm. |
| [C] Minn Ash, `minn_ash_public_route_witness` | Support for The Lantern Named Us Last | [P] Fuel court, shutter route, or refuge | [P] Household-side rehearsal participant | [P] Keep fuel movement outside the refuge and public appeal path. |
| [C] Leto Fain, `leto_fain_custodian_unclaimed_symptoms` | Support for Living Appeal: Aftercare | [P] Receiving, staff handoff, or appeal threshold | [P] Living review and patient advocacy | [P] Receiving remains the safe cell; record racks cannot answer in place of people. |
| [C] Senn Avir, `senn_avir_residue_orderly` | Support for Living Appeal: Aftercare | [P] Staff station, sensory wing, or clean/dirty service threshold | [P] Staff-operated aftercare and equipment quarantine | [P] Staff authority remains explicit; Vael cannot authorize operations. |

- [C] These fifteen actors are three recurring principals—Enoch Vale, Canoness Vael, Sister Calve—and twelve named support actors.
- [P] Quest actors may reuse the three authored typologies or quest-specific envelopes, but reuse must preserve the quest's unique mechanic rather than reskinning one generic room.
- [G] The tracked data does not establish permanent Hearthmere residence for these fifteen, final body models, animation coverage, crowd roles, or runtime readiness.

## 13. Creature ecology and safe-cell exclusions

### Five-family, forty-two-form matrix

| Family | Exact forms | Hearthmere-capable microhabitats | Exclusion law | Safe-cell law |
| --- | --- | --- | --- | --- |
| [D] Ashbound, 10 | `ash_husk`, `ledger_crawler`, `cinder_mourner`, `tagless_stalker`, `pyre_bailiff`, `the_unentered`, `ash_tenant`, `wicket_eater`, `smoke_notary`, `redaction_warden` | [D] Burned tenancy threshold, name-rack ash, warm ruin lee | [D] Exclude continuous deep water | [D] Exclude every form from settled safe cells. |
| [D] March Deserters, 10 | `orderless_pikeman`, `wax_seal_archer`, `bannerless_scout`, `sealed_sapper`, `captain_ninth_blank`, `marshal_vesk_unreported`, `receipt_soldier`, `trench_waif`, `command_leech`, `armistice_giant` | [D] Blank order post, bannerless road cut, collapsed trench | [D] Exclude trackless deep mire | [D] Exclude every form from settled safe cells. |
| [D] Bell Revenants, 10 | `ropewalker`, `clapper_squire`, `verdigris_ringer`, `memory_carillonneur`, `dusk_toll_collector`, `bell_without_tower`, `rope_larva`, `cracked_acolyte`, `echo_sutler`, `vesper_engine` | [D] Bell road, abandoned belfry, memory-clapper route | [D] Exclude acoustically isolated void | [D] Exclude every form from settled safe cells. |
| [D] Shuttered Ward, 6 | `sheet_orderly`, `wax_nurse`, `curtain_listener`, `night_physician`, `matron_empty_beds`, `house_that_cares` | [D] Abandoned ward, wet-plaster corridor, bed threshold | [D] Exclude open unroofed salt pan | [D] Exclude every form from settled safe cells. |
| [D] Last Pest Cart, 6 | `wheel_porter`, `wax_driver`, `route_surgeon`, `last_outrider`, `empty_caravan`, `destination_erased` | [D] Quarantine road, causeway lay-by, erased destination | [D] Exclude roadless crypt chamber | [D] Exclude every form from settled safe cells. |

### Placement and ecology rules

- [D] Broad family site compatibility is not permission to place every compatible form in Hearthmere.
- [D] Only one Ash Husk and one Ledger Crawler are currently placed in the west prototype introduction encounter.
- [G] The other forty forms have no exact Hearthmere spawn, population, encounter graph, or runtime placement in the current tracked shard.
- [P] Place a form only where its family microhabitat, service/evidence function, approach telegraph, counterplay space, and non-combat ecology can all be authored.
- [P] Keep the square, ordinary residence conversation pockets, hospice receiving and appeal cells, civic hearing pockets, and Wave04 declared safe cells free of ordinary hostile spawns.
- [P] Use threshold proximity rather than interior invasion to pressure safe civic spaces; the player should be able to see or hear risk without invalidating the cell.
- [D] Lucent processions require a witnessed restoration target and a high-contrast approach; coercion reads through admission geometry, classification, symmetry, and light that cannot stop.
- [D] Remaining Hands ecology requires a named service or exchange and a non-faction escape route.
- [D] A Noon-wound space requires conflicting occupancy and an access change.
- [D] Lucent propagules must be organism, building, and accountable custodian together; anonymous decorative vines are forbidden.
- [C] Hearthmere quest-bound forms are `deed_eater_wren`, `shadow_census_moth`, `lumen_tithe_burr`, `tenancy_aureole`, and `contrition_oculus`; the cistern also contains one captive Sixth Shutter Forecast alias even though its narrative quest record has no ordinary creature list.
- [G] Quest-bound forms are not counted among the forty-two founding-family forms unless their canonical family data explicitly establishes that relation.

## 14. Ten quest-environment programs

| Quest | Canonical mechanic and dilemma | Authored envelope and typologies | Required unique spatial work | Actor/form load | Graph status |
| --- | --- | --- | --- | --- | --- |
| [C] When Noon Came Bleeding | Escort light by moving cover; save repaired homes or shadowless people | [D] `hearthmere_dusk_circuit`, 220 × 180 × 46 m; tenant + civic | [D] Exterior loop where shade cart covers a vertical noon wound without entering full dark; repaired façades and erased shadows must conflict | [C] Enoch, Nima; no listed creature | [G] No tracked final graph or safe cell. |
| [C] The Disease Called Grief | Separate symptom from witness; relief versus evidence | [D] `unlit_hospice_memory_ward`, 28 × 20 × 14 m; hospice | [D] Four inspectable grief layers, consent before clinical visibility, memory-suture choice | [C] Vael, Davren; no listed creature | [G] No tracked final graph or safe cell. |
| [C] Seven Lamps for Six Streets | Maintain a route that officially does not exist; registration versus safety | [D] `hearthmere_unbudgeted_street`, 150 × 40 × 28 m; tenant + civic | [D] Seven distinct lamps reveal six budgeted streets and one moving address; extinguishing a lamp relocates a specific household | [C] Enoch, Roa; no listed creature | [G] No tracked final graph or safe cell. |
| [C] The Hospice Grows a Heart | Debug living triage bias; remove bias versus predictive care | [D] `unlit_hospice_living_ward`, 46 × 30 × 18 m; hospice | [D] Six independently readable patient reorder routes and a living-heart edit that cannot bypass consent | [C] Calve, Bek; no listed creature | [G] No tracked final graph or safe cell. |
| [C] The House That Outlived Its Tenants | Renegotiate architecture by occupancy; title, present use, or building personhood | [D] `hearthmere_folded_townhouse`, 24 × 18 × 22 m; tenant | [D] A dinner continues while rooms fold around five incompatible doorframe testimonies and genuinely used objects | [C] Enoch, Mara, Deed-Eater Wren | [G] No tracked final graph or safe cell. |
| [C] A Census of Absences | Enumerate people and separated absences; status of shadow claimants | [D] `hearthmere_double_census`, 64 × 42 × 20 m; civic | [D] Two queues circle one shuttered lamp; seven mobile shadows must be attributed without making either claimant property | [C] Enoch, Kessa, Shadow Census Moth | [G] No tracked final graph or safe cell. |
| [C] Purity Blooms at Dusk | Constitute liability for propagating restoration; ownership, license, or sterility | [D] `hearthmere_breath_and_gutter_seedfront`, 160 × 96 × 42 m; tenant + hospice | [D] One live seed corridor crosses six breaths, gutters, and shared walls while custodians share the propagation path | [C] Vael, Roen, Lumen Tithe Burr | [G] No tracked final graph or safe cell. |
| [C] The Orchard Casts a Legal Shadow | Alternating guardianship and birthright without property | [D] `hearthmere_orchard_of_second_births`, 118 × 92 × 46 m; tenant + Lucent cathedral | [D] Body and shadow cross witnessed thresholds in opposite directions; moving jurisdiction changes service access | [C] Vael, Tesse, Tenancy Aureole | [G] No tracked final graph or safe cell. |
| [C] The Lantern Named Us Last | Rehearse abandonment authority through shutters, households, and public appeal | [D] `hearthmere_counterfactual_cistern`, 118 × 92 × 18 m; civic | [D] Seven household route sets, seven serialized shutters, fuel/water separation, public appeal, flood refuge, and alarm-state burden transfer | [C] Enoch, Latch, Minn, one captive Sixth Shutter Forecast | [D] Wave04 exact graph; see Section 15. |
| [C] Living Appeal: Aftercare | Living authority over adverse evidence and quarantined equipment | [D] `hearthmere_six_wing_aftercare`, 74 × 58 × 20 m; hospice | [D] Six sensory wings, staff operation, fixed inert records, clean/dirty separation, appeal egress, and one living Contrition | [C] Vael, Leto, Senn, one Contrition Oculus | [D] Wave04 exact graph; see Section 15. |

### Anti-copy requirements

- [D] Each quest above owns a different spatial verb: cover, separate, maintain, debug, renegotiate, enumerate, constitute, alternate, rehearse, or review.
- [D] Reusing a typology never permits reusing its objective topology without the unique verb, failure transformation, evidence type, and persistent consequence.
- [P] Before blockout approval, reviewers must be able to identify the quest from an unlabelled route/evidence diagram; failure means the environment is too generic.
- [G] Exact atlas embedding, local door selection, safe-cell allocation, and streaming transition for the first eight programs remain unassigned.

## 15. Wave04 graph contracts and Aftercare ontology

### The Lantern Named Us Last: exact cistern contract

| Measure | Exact tracked value |
| --- | --- |
| [D] Semantic nodes | 14 |
| [D] Directed edges | 54 |
| [D] Connectivity | Strongly connected |
| [D] Utility systems | 5 |
| [D] Safe cells | 1: `safe_cell.v6.hearthmere_counterfactual_cistern.refuge` |
| [D] Objective endpoints | 4 |
| [D] Node-disjoint egress routes | 2 |
| [D] Household route sets | 7 distinct sets |
| [D] Serialized burden steps | 7-step redistribution |

- [D] The public appeal ramp, fuel court, north and south fail-open exits, public threshold, fuel crawl, trained pump, dry refuge, relief route, seven serialized shutters, staff route, drainage sump, and appeal gutter are all functional graph components.
- [D] The public threshold remains open during rehearsal and appeal; the fuel crawl has a double lock with manual release; the dry refuge sits above flood; the relief route remains walkable below warning.
- [D] Clean roof and spring overflow goes to the north runnel; fuel is curbed and uses a sealed drum; the sump holds 42 m³; rehearsal flood includes a 30% margin; delivery and waste avoid the public route; the sealed stair drains to the appeal gutter.
- [D] `open_trial` schedules 28 residents, 8 workers, 20 visitors, and 1 creature at dusk.
- [D] `rehearsal_spiral` schedules 36 residents, 12 workers, 34 visitors, and 1 creature at dusk.
- [D] `real_alarm` schedules 36 residents, 10 workers, 0 visitors, and 1 creature at deep night.
- [D] `aftercare` schedules 28 residents, 8 workers, 16 visitors, and 1 creature at deep night.
- [D] In player absence, a low-risk shutter test runs nightly; wet-season operation begins with the sump at 35%, while dry operation increases fire risk and lowers bypass pressure.
- [G] The Wave04 record supplies no final meshes or art; graph completeness is not visual, model, animation, streaming, or runtime-readiness proof.

### Living Appeal: Aftercare exact graph

| Measure | Exact tracked value |
| --- | --- |
| [D] Semantic nodes | 18 |
| [D] Directed edges | 47 |
| [D] Connectivity | Strongly connected |
| [D] Utility systems | 5 |
| [D] Safe cells | 1: `safe_cell.v6.hearthmere_six_wing_aftercare.receiving` |
| [D] Objective endpoints | 5 |
| [D] Node-disjoint egress routes | 2 |

- [D] The graph includes six fixed record racks, 18 living patients, 14 living staff, six nonliving equipment records, and exactly one living Contrition Oculus; residue population is zero.
- [D] The six records are not people, actors, patients, population, witnesses, authorities, or creatures; they are inert equipment records fixed to racks.
- [D] Canoness Vael authorizes nothing in this facility state; living staff operate, isolate, review, and release equipment.
- [D] Receiving is the declared safe cell; the appeal exit fails open; north and south fire exits remain available; the mortuary route is screened; plant access is restricted; the staff station can summon living staff.
- [D] Clean and dirty wash move one way; waste is sealed; six sensory habitats have dual latches; plant and wash maintenance share a quarantine loop without collapsing clean/dirty separation.
- [D] Clean roof water goes to the herb cistern; contaminated wash passes traps into a sealed drain; the sump holds 9 m³; the storm case includes a blocked downpipe.
- [D] `consent_entry` schedules 12 residents, 10 workers, 2 visitors, and 1 creature at pre-dawn.
- [D] `adjacency_and_shift` schedules 18 residents, 14 workers, 8 visitors, and a `creatures` field with value 6 at dawn.
- [D] `false_continuity` schedules 18 residents, 12 workers, 12 visitors, and a `creatures` field with value 6 at late day.
- [D] `handoff` schedules 14 residents, 8 workers, 2 visitors, and a `creatures` field with value 6 at deep night.
- [G] The schedule field carrying value 6 conflicts in name with the explicit ontology: implementation must interpret the six as inert equipment stations or records, never six sentient creatures or residues, until the source field is renamed or validated.
- [G] The Wave04 record supplies no final meshes or art; graph completeness is not visual, model, animation, streaming, or runtime-readiness proof.

## 16. Environmental storytelling artifacts and evidence layers

### Five-layer evidence stack

| Order | Tracked layer | Hearthmere evidence vocabulary | Placement rule |
| ---: | --- | --- | --- |
| [D] 1 | Substrate and deep history | [P] Slate bedding, spring cut, buried rill, old footing, cairn material | [D] Terrain, foundations, and buried routes carry this layer. |
| [D] 2 | Failed institution | [P] Unequal bell wear, blank order hardware, sealed docket drain, damaged archive latch, abandoned ward fitting | [D] Civic geometry, ritual hardware, and abandoned utilities carry this layer. |
| [D] 3 | Ordinary survival | [P] Splints, patched lime, peat rack, fish work, rain barrel, bed-turn polish, handcart scars | [D] Repairs, food, water, beds, tools, and informal paths carry this layer. |
| [D] 4 | Current dispute | [P] Moved queue, revocable appeal door, hidden ration detour, lamp omission, seed-custody threshold | [D] Revocable thresholds, queues, moved functions, and ecology boundaries carry this layer. |
| [D] 5 | Player consequence | [P] Restored or refused route, changed admission, altered lamp circuit, visible repair, new ecology boundary | [D] Persistent route, access, population, material, and maintenance changes carry this layer. |

### Stable semantic artifacts

- [D] Any prop that owns testimony, custody, access, debt, or consent receives a stable semantic anchor and cannot be treated as anonymous clutter.
- [D] Every set carries at least three readable time layers: old-world intention, survival repair, and current faction or civic pressure.
- [D] No baked text, labels, arrows, logos, UI, or heraldic shorthand may substitute for spatial state.
- [D] Environmental horror must retain a service, ecology, household, or political function outside combat.
- [P] Minimum Hearthmere anchor set includes spring isolation hardware, a clay-name custody point, ration scale, lamp issue/repair point, appeal-controlled exit, public hearing separation, clean/dirty split, one dated repair seam, and one consequence anchor.
- [P] Clay tablets communicate identity status through placement, count, breakage, repair, custody, firing state, and privacy; they must not rely on legible written names in concept art.
- [P] Lamp state communicates funding, route recognition, civic duty, and danger through fuel, shutter, height, reach, repair, and maintenance access.
- [P] Bed and chair placement communicates admission, consent, care priority, and appeal through route independence and who can reach or leave them.

## 17. Persistent world-state matrix

| State key | Exact canonical values | Primary environment carriers |
| --- | --- | --- |
| [C] `first_synod_welcome` | `homes_restored_residents_marked`; `wound_closed_homes_remain_ruined`; `noon_shared_with_dunmire` | [P] Façade repair, shadow retention, noon-control route, cross-region service evidence |
| [C] `vael_definition_of_care` | `grief_retained_function_restored`; `grief_removed_spouse_erased`; `memory_shared_with_vael` | [P] Memory-thread state, Davren's access, Vael's custody distance |
| [C] `hidden_households_status` | `street_registered_and_taxed`; `street_hidden_and_underfed`; `street_joins_unwritten_roads` | [P] Lamp route, ration queue, address threshold, moving exit |
| [C] `neutral_medicine_governance` | `heart_made_random`; `bias_declared_and_appealable`; `heart_destroyed_hospice_manual` | [P] Bed-routing logic, appeal visibility, living-heart access or manual care equipment |
| [C] `hearthmere_restored_tenancy` | `present_use_appealable_deed`; `inherited_title_with_tenant_terms`; `house_public_shelter_person` | [P] Doorframe authority, occupancy evidence, public shelter threshold |
| [C] `hearthmere_absence_citizenship` | `shadows_gain_separate_seats`; `shadows_are_protected_dependants`; `mobile_absence_district_created` | [P] Dual queue, seat allocation, ration burden, mobile lamp boundary |
| [C] `hearthmere_purity_ecology` | `resident_cultivator_liability`; `public_seed_licensing`; `sterile_last_generation` | [P] Custody markers, public corridor, pruned or sterile propagation fronts |
| [C] `hearthmere_shadow_seed_descent` | `shadow_children_are_separate_lineage`; `embodied_guardians_hold_appealable_parenthood`; `future_shadow_births_prohibited_child_survives` | [P] Orchard access, service entitlement, guardian crossings, surviving-child refuge |
| [C] `league_abandonment_authority` | `appeal_map_public_and_staffed`; `enoch_holds_private_map_and_personal_liability`; `forecast_alias_confined_to_rehearsal_only`; `nullstreet_route_rotates_with_other_omissions` | [P] Cistern map access, staff occupancy, captive boundary, shutter-route rotation |
| [C] `discharged_memory_aftercare` | `living_authority_aftercare_with_all_six_wings_staffed`; `bounded_adverse_evidence_use_with_two_wings_paused`; `all_clinical_residue_equipment_quarantined_pending_living_review` | [P] Wing operation, paused thresholds, rack seals, living-staff review route |

- [D] Player consequences alter topology, maintenance, admission, ecology, evidence, or occupancy rather than only banners or color grade.
- [P] Every state carrier must declare default, changed, and coexistence behavior; every removed route must name an alternate egress and the actor class allowed to operate it.
- [G] No tracked source defines a single precedence order across these ten state keys; state-composition review is mandatory before final world dressing.

## 18. Thirteen-shot environment concept-art program

| Shot | Purpose and required content | Dependencies | Acceptance gates |
| ---: | --- | --- | --- |
| [D] 1 | Civic Spring Spine within the preserved 96 m shard: one square, one belfry/tower, one spring arch, and a visible foreground route reconnection | [D] Shard scale, regional material law, and accepted `concept_hearthmere_hold` regional reference | [D] Exactly eight visible residents; exactly three distinct routes; spring water separated from runoff; working systems and artifacts; resident scale; wet slate, dark timber, restrained bronze, and accountable warm light; no enemies, text, coast, monolith, or unsupported geometry claim. |
| [D] 2 | Nested-scale cutaway: 640 m influence → 192 m core → preserved 96 m shard → one nested interior | [D] Section 3 envelopes and atlas transform discipline | [D] Radial envelopes read as design influence, not walls or legal borders; unresolved cells remain diagrammatic. |
| [D] 3 | Slate tenant-house cutaway during ordinary use | [D] Exact Section 6 room graph and utilities | [D] All five edges, three controlled thresholds, rear service route, prior tenant heights, and one public-private turn are visible. |
| [D] 4 | Bell-and-ledger civic house during dawn distribution and archive witnessing | [D] Exact Section 8 graph, ration and lamp loops | [D] Public/service loops intersect once; archive has two accountable approaches; seven-lamp service width reads; no throne-room inflation. |
| [D] 5 | Unlit Hospice across a shift change | [D] Exact Section 7 graph, clean/dirty and consent laws | [D] Six bed routes, consent-before-visibility, appeal-controlled exterior exit, clean/dirty separation, and living-staff operation read without text. |
| [D] 6 | Noon-wound mobile-shade circuit | [D] 220 × 180 × 46 m program, Enoch/Nima roles | [D] Moving cover, vertical wound, repaired façades, threatened shadows, and non-dark traversal are mechanically legible. |
| [D] 7 | Nullstreet seven-lamp route | [D] 150 × 40 × 28 m program and lamp maintenance law | [D] Seven materially distinct lamps reveal six fixed routes and one moving address; no checklist-style repetition. |
| [D] 8 | Folded townhouse during dinner | [D] 24 × 18 × 22 m program and tenant typology | [D] Five doorframe testimonies, lived object evidence, family continuity, and moving civic authority read without generic haunted-house staging. |
| [D] 9 | Double census under one shuttered lamp | [D] 64 × 42 × 20 m program | [D] Body and absence queues remain distinct, seven shadows are attributable, and neither side reads as owned inventory. |
| [D] 10 | Breath-and-gutter seedfront | [D] 160 × 96 × 42 m program, Lucent propagule law | [D] Six linked hosts, gutters and walls, shared custody, warranted growth, and beneficial danger are all visible. |
| [D] 11 | Orchard of second births | [D] 118 × 92 × 46 m program, Tesse and Tenancy Aureole | [D] Opposed threshold crossings, moving jurisdiction, birth without ownership, and service-access consequences remain readable. |
| [D] 12 | Counterfactual cistern during real alarm | [D] Exact 14-node/54-edge Wave04 graph and utility contract | [D] Two disjoint egresses, dry safe refuge, seven shutters, public appeal, separated fuel/water, sump, and one captive are functionally plausible. |
| [D] 13 | Living Appeal aftercare during staff handoff | [D] Exact 18-node/47-edge Wave04 graph and inert-record ontology | [D] Receiving safe cell, living staff, one living Contrition, six inert rack records, dual-latched wings, appeal exit, and clean/dirty flow are unambiguous. |

### Art-direction and dependency law

- [D] The accepted `concept_hearthmere_hold` image is direction for hub layout, wet slate, warm-spring contrast, and layered routes only; it is not exact geometry or a readiness claim.
- [D] Global style is grounded stylized dark fantasy with plausible load, drainage, access, repair, and use; the world is dying but inhabited and maintained.
- [D] Lucent imagery is angelic, pale, precise, narrowly gold, beautiful, and coercive through spatial admission; it must not collapse into generic holy architecture.
- [D] Charnel imagery is black-nacre horror with visible protection, household use, exits, repairs, and civic function; it must not collapse into scenery-only gore.
- [D] Remaining Hands imagery foregrounds work, repair, rationing, weather, and contested care.
- [D] Forbidden imagery includes floating debris, gratuitous spikes, impossible stairs, decorative machinery, generic castle shorthand, unexplained scale, baked text, UI, logos, and water without drainage logic.
- [P] Produce shots in dependency order 1→2→3–5→6–11→12–13 so regional law and typology graphs are approved before quest variants.
- [G] A private or local candidate is not an accepted repository asset until its published path, review record, privacy-safe provenance, and required independent approvals exist.

## 19. Claude Design build checklist, open questions, prohibitions, and nonclaims

### Build checklist

- [D] Record the `veyl_local_grid_v1` atlas coordinate and every local-to-atlas transform in the scene package.
- [D] Preserve the 96 m shard as a nested prototype scene; mark every inherited coordinate and mesh as prototype evidence rather than final canon.
- [D] Author the 192 m core and 640 m influence envelope as streamed systems, not one decorative panorama.
- [D] Implement all three typology room graphs, threshold rules, utility routes, props, weathering, and traversal constraints before façade polish.
- [D] Keep warm spring supply, roof runoff, street runoff, clinical wash, fuel contamination, ash, and waste as separable systems.
- [D] Provide a service route and accountable operator state for every lamp, bell, brazier, bed, valve, living graft, and evidence anchor.
- [D] Instantiate the five daily activity phases as density and service-state changes, not fixed actor spawn claims.
- [D] Keep the ten residents, visiting Ysra, and fifteen expansion actors identity-correct; treat all proposed hosts and schedules as revisable.
- [D] Enforce every family habitat and exclusion rule; only Ash Husk and Ledger Crawler have current prototype encounter placement.
- [D] Preserve each quest's unique spatial verb, evidence, failure transformation, and persistent state carrier.
- [D] Match both Wave04 graphs exactly in node, edge, connectivity, utility, safe-cell, objective, and egress counts before visual elaboration.
- [D] Enforce the Aftercare ontology: six fixed records are inert equipment; living staff hold authority; one Contrition is alive; residues equal zero.
- [D] Build every persistent state as coordinated navigation, collision, occupancy, utility, evidence, audio, scent, light, and material deltas.
- [D] Review each concept shot for canon fidelity, systems plausibility, resident scale, art law, forbidden content, and explicit maturity before acceptance.

### Open questions requiring an authored decision

- [G] Which regional route maps to each local approach, gate, or foreground branch?
- [G] What final parcel and street topology surrounds the preserved shard inside the 192 m core?
- [G] How many instances of each tenant, hospice, and civic typology exist, and which functions share structures?
- [G] Where are terrace gardens, spring-fish work, clay firing, cremation support, fuel storage, refugee staging, and burial evidence placed inside the 640 m influence envelope?
- [G] What are the exact non-quest homes, work rotations, visit cadence, and nighttime beds for named actors?
- [G] Which of the forty unplaced founding-family forms, if any, receive Hearthmere encounters, and what are their population budgets?
- [G] What exact graphs, safe cells, and atlas embeddings implement the first eight quest environments?
- [G] How is the Aftercare schedule field labeled with value 6 renamed so it cannot be mistaken for six creatures?
- [G] What precedence and compositing rules apply when multiple persistent outcomes affect the same façade, route, utility, actor, or ecology boundary?
- [G] Which concept-art candidates have completed repository publication, privacy review, independent acceptance, and index integration?

### Prohibited assumptions

- [D] Do not invent named districts, streets, gates, buildings, councils, wards, families, or exact placements to fill unresolved space.
- [D] Do not treat the 640 m radial influence envelope as a legal border, settlement wall, parcel, or final playable boundary.
- [D] Do not treat the atlas coordinate as a doorway, spawn, square center, or final scene origin.
- [D] Do not treat the 96 m shard, its chunks, procedural meshes, or legacy tiles as final geometry.
- [D] Do not infer final architecture from a concept-art perspective, occlusion, or decorative silhouette.
- [D] Do not place ordinary enemies in settled safe cells or convert quest-specific creatures into generic ambient mobs.
- [D] Do not turn Lucent coercion into simple goodness, Charnel horror into simple evil, or mortal civic actors into neutral exposition furniture.
- [D] Do not turn persistent consequence into recolor, banner swap, or text label when route, service, admission, ecology, evidence, or occupancy can carry it.
- [D] Do not use written signage, baked UI, or legible labels as the primary carrier of civic or quest state.
- [D] Do not interpret six Aftercare records as persons, voices, residues, patients, creatures, authorities, or autonomous agents.

### Explicit nonclaims

- [G] This dossier does not claim final world geometry, final GIS survey accuracy, cadastral truth, final route ingress, final building count, or final actor placement.
- [G] This dossier does not claim that any prototype asset is a production mesh, final material, final rig, final animation, optimized runtime object, or approved 3D measurement source.
- [G] This dossier does not claim that the current shard, the two Wave04 graphs, or the thirteen art shots are implemented, loaded, performant, or production-ready.
- [G] This dossier does not claim concept art defines unseen geometry, mechanical correctness, or canonical detail beyond its tracked acceptance scope.
- [G] This dossier does not authorize new canon; all proposals remain reversible until promoted through the project's canonical data process.
