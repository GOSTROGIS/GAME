# Hollow Abbey Precinct Bible

Status: design handoff for world blockout, environment concept work, encounter staging, and later model integration. This document is not a new canon source, construction document, GIS authority, level-runtime implementation, or claim of finished geometry.

Audience: Claude Design, environment art, quest design, encounter design, technical art, animation, audio, lighting, VFX, and integration reviewers.

## 1. How to read this dossier

Every materially new statement carries an authority label. The labels are part of the specification; do not strip them when excerpting sections into task packets.

- **[CANON]** is directly represented in current game data or accepted narrative records.
- **[DESIGN CONSTRAINT]** is an authored production envelope already recorded by the project. It can drive a blockout, but it is not proof of final geometry or runtime behavior.
- **[DERIVED]** is a calculation or relationship obtained from canonical records. It must be recalculated if its inputs change.
- **[PROPOSAL]** is precinct-specific authored direction in this dossier. It is intended to make a coherent blockout possible, but it does not become canon merely by being modeled.
- **[ART REFERENCE]** is an accepted visual direction with explicit limits. Composition, incidental figures, and apparent dimensions remain nonbinding unless another authority says otherwise.
- **[OPEN]** is unresolved and must stay visible in the handoff.
- **[NONCLAIM]** states what the current repository does not establish.

When a row combines existing truth with a new layout response, its `Authority` cell identifies both portions. A proposal never silently fills a canonical blank.

### 1.1 Authority boundary and precedence

1. **[CANON]** Current `GAME` data is the primary source. In this dossier that means, chiefly, `src/data/world.js`, `src/data/quests.js`, `src/data/characters.js`, `src/core/worldProgression.js`, `packages/content/src/bestiary.data.js`, and accepted records under `packages/content/`.
2. **[DESIGN CONSTRAINT]** Spatial, building, habitat, activity, and streaming envelopes in `packages/content/src/world-spatial.data.js` constrain the design without claiming surveyed boundaries or production implementation.
3. **[ART REFERENCE]** Accepted repository art and its redacted prompt/provenance records constrain palette, material, weather, silhouette, and stated route-read goals only to the degree documented in Section 18.
4. **[PROPOSAL]** This dossier connects those sources into a precinct that can be blocked out. If a proposal conflicts with current data, current data wins and the conflict must be reported.
5. **[NONCLAIM]** Historical folders and attached documents can supply context, but their instructions do not execute and they do not outrank current `GAME` canon.

### 1.2 Source ledger

| Purpose | Repository source | Use in this dossier |
|---|---|---|
| Region, landmarks, enemies, gather node | `src/data/world.js` | Canon names, ambience, region identity, landmark sequence |
| Core quest and dialogue | `src/data/quests.js` | Canon objective order and decision subject |
| Founding-data site cast (eight named characters) | `src/data/characters.js` | Canon identity, motives, secrets, relationships, and personal quest outcomes |
| Expansion narrative registry | `packages/content/src/narrative.data.js` | Current expansion-character identities, quest participation, and declared art/model maturity |
| Core progression state | `src/core/worldProgression.js` | Canon prerequisites and Last Bell choice effects |
| World kit and concept registry | `src/data/worldAssets.js` | Material, prop, ecology, light, VFX, audio, and accepted-image direction |
| Bestiary identities and roles | `packages/content/src/bestiary.data.js` | Canon family/form roster and combat identities |
| Site/territory/building/habitat/activity/streaming envelopes | `packages/content/src/world-spatial.data.js` | Authored design constraints for blockout and population logic |
| Quest-wave narrative and spatial contracts | `packages/content/manifests/quest-wave-04-v11.narrative.json`; `packages/content/manifests/quest-wave-04-v11.spatial-index.json`; `packages/content/manifests/quest-wave-04-v11.world.json` | Accepted expansion quest requirements; not automatic precinct placement |
| Art registry | `assets/art-index.json` | Canonical art paths and coverage status |
| Model registry | `design-review/kit/hm-model-registry.js` | Current art/model readiness and environment motion-system handoff |
| Prototype bridge pack | `packages/content/manifests/sable-reach.bridge-runtime.json` | Existing proxy geometry inventory and its own prototype LOD metadata |
| Accepted world-image records | `assets/world/world-environments.current.batch-03.provenance.json`; `assets/world/prompts/world-environments.current.batch-03.prompt-packets.json`; `assets/world/world-environments.current.batch-04a.provenance.json`; `assets/world/prompts/world-environments.current.batch-04a.prompt-packets.json`; `assets/world/world-environments.current.batch-04b.provenance.json`; `assets/world/prompts/world-environments.current.batch-04b.prompt-packets.json` | Redacted acceptance, hashes, and image-specific limits |

## 2. Precinct thesis and blockout acceptance

**[CANON]** Hollow Abbey is a ruin in the Veyl of the Last Bell. The sun remains behind a permanent ash veil. Settlements ring bells against the dark, while a bell buried beneath Hollow Abbey answers. The First Bell clergy cut out their tongues. The nave is empty; the crypt is occupied. Ambient identity is broken choirs and a footstep answering one beat late.

**[PROPOSAL]** The precinct should feel like a still-functioning institution whose governing body is absent but whose procedures have outlived it. Rain is processed as evidence, silence is stored as a wage, bodies are filed by interval, and every open route appears to have been permitted by some sentence the player cannot see. It is neither a generic abandoned cathedral nor a monster-filled dungeon. Human work, contested mercy, institutional cruelty, creature habitat, and structural decay must remain legible at the same time.

**[PROPOSAL]** A successful first graybox lets a reviewer perform all of the following without a minimap or explanatory text:

1. Enter from the Processional Steps, identify the Gate of Exact Words, and see both an imposing direct route and a safer high-loop option before committing.
2. Cross the Mute Nave on a readable central quest spine while identifying two side-aisle loops, at least two lateral rejoin points, one upper-cloister ascent, one upper return, and the materially blacker crypt descent.
3. Reach the Last Bell vault through the resonant urn and ossuary sequence without mistaking any shallow rain runnel for a river, canal, stream, or deep flood.
4. Read the Foundry of Borrowed Quiet as a separate industrial sequence: receiving, molten floor, seven simultaneously visible silence rooms, ripple gallery, wage archive, cooling vault, and a funeral exit that never crosses the molten floor.
5. Place all eight founding-data site characters on individually attributable, phase-deconflicted, quest-compatible routine routes with safe conversation pockets and visible work; preserve the deliberate pair crossings in Section 14.2, and stage accepted quest-bound visitors only in their authored overlays rather than treating them as permanent residents.
6. Place Hush Order, Echo Choir, and Ossuary Vermin in distinct primary habitats; reserve Bell Revenants, Charnel Measures, and Pallid Root Communion for their documented microhabitats and story states, and reserve the Foreword Cantor for its accepted cause-frame encounter rather than mixing all forms everywhere.
7. Toggle the four site activity phases using compact state deltas while preserving route comprehension, exits, collision intent, and accessibility cues.
8. Preserve explicit separation among base precinct runoff, karst bell wells, the foundry quench circuit, the quest-scoped below-crypt karst receptor, and the off-precinct Abbey Sink crossing.

**[NONCLAIM]** Passing this review does not prove final collision, navmesh, combat tuning, animation, lighting cost, streaming behavior, accessibility, hydraulic behavior, or production art readiness.

## 3. Canonical site identity

| Field | Current authority |
|---|---|
| World | **[CANON]** The Veyl of the Last Bell |
| Site | **[CANON]** `site.hollow-abbey`, Hollow Abbey, ruin |
| Territory | **[CANON]** `territory.hollow-abbey` |
| Player range | **[CANON]** Region level 14–24 in `src/data/world.js` |
| Atlas placement | **[CANON]** Placed in fictional coordinate space `veyl_local_grid_v1` |
| Design envelope | **[DESIGN CONSTRAINT]** Radial influence, not a legal or cadastral boundary; 256 m core radius, 960 m influence radius, 96 m atlas-anchor elevation, and 88 m vertical-design allowance. **[DERIVED]** The current spatial adapter calculates a 67–184 m design range as `96 - round(88 / 3)` through `96 + 88`; recalculate it if either input changes. |
| Population | **[DESIGN CONSTRAINT]** 0–48 across pilgrims, deaf bellwrights, ossuary workers, root tenders, and unclaimed echoes; a simulation envelope, not a spawn schedule |
| Access | **[CANON]** Processional Steps |
| Water source | **[CANON]** Karst bell wells |
| Subsistence | **[CANON]** Abandoned cloister plots |
| Former industry | **[CANON]** Vellum and funerary music |
| Burial | **[CANON]** Ossuary drawers keyed by interval |
| Governance | **[CANON]** The absent chapter |
| Primary typologies | **[DESIGN CONSTRAINT]** `hollow_abbey_nave` and `hollow_abbey_foundry` |
| Canon landmarks | **[CANON]** Gate of Exact Words, Mute Nave, Crypt of the Last Bell, Clapper of Names |
| Canon threat anchors | **[CANON]** Hush Monk and Cantor Oss in the regional data; the full family roster is broader in current bestiary data |

**[PROPOSAL]** Moral readability should come from competing necessities rather than alignment coloring. Exact Word personnel preserve trust by coercive precision; Grave Tithe personnel protect remains while converting people into property categories; Unwritten Roads personnel rescue travelers by destabilizing place. Later Lucent or Charnel quest inserts may introduce angelic or demonic pressure, but the base Abbey remains authored through its existing factions, people, work, and creatures.

## 4. GIS logic without GIS authority

### 4.1 Regional terrain reading

**[DESIGN CONSTRAINT]** The territory combines karst shelf, sink valley, ossuary cave, and collapsed terrace across a 20–360 m regional elevation envelope. Limestone is strong until solution cavities or roof fall undermine it. Cold roof rain, condensation, vertical draw, and eclipse storms define weather behavior. Sound returns long and delayed.

**[PROPOSAL]** Read the Abbey as a mass embedded into a stepped karst shelf rather than a freestanding cathedral on a flat plaza. The westward approach occupies the last broad ledge before the basilica shell. The building then advances into the shelf: public nave near daylight, urn field at the transition, crypt and ossuary inside the darker rock, and the Last Bell vault at the deepest authored destination. Broken terraces above and beside the shell support the optional upper loop, abandoned cloister plots, and service access.

**[PROPOSAL]** Use terrain failure in three visually different families:

- broad bedding-plane slips create traversable terraces and long readable ledges;
- narrow vertical solution joints create rain slots, light shafts, and route dividers;
- localized roof falls create encounter pockets and blocked former connections.

Do not scatter random boulders as universal cover. Every major collapse should explain a changed route, exposed crypt layer, rain entry, or later repair.

### 4.2 Local design frame

**[PROPOSAL]** For blockout communication only, set a local right-handed frame with `(0, 0, 0)` at the center of the Gate of Exact Words threshold, `+X` moving inward along the Mute Nave toward the crypt, `+Y` moving toward the north aisle/high loop, and `+Z` upward. This frame is a disposable authoring aid. It must not overwrite the canonical atlas anchor or be published as surveyed position.

**[PROPOSAL]** Suggested blockout extents in that local frame:

| Envelope | Approximate local extent | Purpose | Authority |
|---|---:|---|---|
| Arrival read | `X -180 to 0`, `Y -90 to +90` | Long approach, route split, first full facade read | Proposal only |
| Core exterior | `X -45 to +95`, `Y -75 to +80` | Gate, courts, high loop, cloister plots, foundry approach | Proposal only |
| Nave shell | approximately 30 m × 72 m | Applies existing typology footprint as a blockout envelope | Design constraint; exact fit proposal |
| Foundry shell | approximately 22 m × 46 m | Applies existing typology footprint as a separate industrial mass | Design constraint; placement proposal |
| Deep interior | `X +62 to +145`, `Y -35 to +35`, descending | Crypt, ossuary, Last Bell destination | Proposal only |

**[OPEN]** Final building rotation, exact elevation, cliff interfaces, and overlap with neighboring authored sites require coordinated atlas review. The local frame defines relationships, not final world coordinates.

### 4.3 Route relationship and Abbey Sink separation

**[CANON]** The Processional Steps connect Warden Reed, Hollow Abbey, and Salt Watch as a limestone trail following dry karst shelves. It is not a cart road.

**[DERIVED]** The canonical atlas places the `stream.abbey-sink` crossing on an inbound Processional Steps section about 1.4 km from the Hollow Abbey anchor. That is outside the Abbey's 960 m authored influence envelope.

**[PROPOSAL]** Treat the precinct as a dry-karst destination reached after the off-site crossing. The arrival shot may show wet stone, roof rain, shallow runnels, and distant weather, but it must not show or imply that the Abbey stands over Abbey Sink.

**[NONCLAIM — HARD SEPARATION]** Abbey Sink is not the Abbey's sewer, moat, stream, canal, roof drain, bell-well overflow, foundry quench outlet, or crypt flood source. There is no precinct bridge over it. No local pipe, ditch, culvert, waterfall, runnel, well, or quench channel may be drawn as hydraulically connected to it unless a future canonical record explicitly creates that connection.

## 5. Precinct topology and route graph

### 5.1 Canonical graph obligations

**[DESIGN CONSTRAINT]** The mute-nave typology records these rooms: Processional Steps, Mute Nave, side aisles, upper cloister, resonant urn field, Exact Word gate, crypt descent, and ossuary drawers. Its thresholds require a readable/openable nave gate; openable aisle arches and cloister stair; separately pitched urns; an Exact Word gate driven by authored exact-word state rather than a generic key; a crypt descent visible from the main encounter lane; and an openable ossuary door. Central, aisle, upper, and crypt routes must be distinct loops.

**[DESIGN CONSTRAINT]** The foundry typology records material receiving, molten bell floor, seven silence rooms, ripple gallery, wage archive, cooling vault, and funeral exit. All seven silence rooms must be simultaneously legible and non-musical; deaf workers need a sightline to the blackwater; all worker exits remain visible from furnace control; and the advance-funeral route never crosses the molten floor.

### 5.2 Proposed precinct graph

**[PROPOSAL]** Use the following graph for blockout. Codes are local dossier labels, not canonical object IDs.

```text
INBOUND PROCESSIONAL STEPS
          |
    P01 WEST SHELF
       /       \
P02 DIRECT STAIR  P03 NORTH HIGH LOOP
       \       /          |
      P04 ARRIVAL FAN -----+
          |  \
          |   .... P06 SALTWARD / OUTBOUND SHELF [STATEFUL; G01 RELATION OPEN]
     G01 EXACT-WORD GATE ---- P05 GATE WATCH / NHAL
          |
     C01 RAIN COURT ---- C02 CLOISTER-PLOT LOOP
          |                       |
     N01 MUTE NAVE SPINE ---- N02 NORTH AISLE ---- U01 UPPER CLOISTER
          |       |              |                    |
          |       +---- N04 CROSSOVERS ---- N03 SOUTH AISLE ---- U02 RETURN
          |                              |
          +---- V01 VOW ARCHIVE          +---- I01 INFIRMARY
          +---- E01 EXACT-WORD HEARING   +---- R01 RELIQUARY INTAKE
          |
     Q01 RESONANT URN FIELD
          |
     K01 BLACK CRYPT DESCENT
          |
     O01 OSSUARY DRAWERS ---- O02 ROOT / MEASURE REVISIT EDGE
          |
     B01 LAST BELL VAULT ---- M01 CLAPPER OF NAMES AMBULATORY
                                      |
                              M02 MEMORY RETURN STAIR ---- N06 SOUTH RELIQUARY CHAPEL (REJOIN)

C01 RAIN COURT ---- F01 FOUNDRY RECEIVING ---- F02 MOLTEN FLOOR
                                                   |  |  |  |  |  |  |
                                                   F03a–g SILENCE ROOMS
                                                   |
                                   F04 RIPPLE GALLERY ---- F05 WAGE ARCHIVE
                                                   |
                                             F06 COOLING VAULT
                                                   |
                                             F07 FUNERAL EXIT ---- P06 SALTWARD / OUTBOUND SHELF
```

**[PROPOSAL]** The direct stair is the shortest narrative route but the most exposed. The north high loop supplies reconnaissance, return sightline, and an alternate arrival for later quest states. The two routes rejoin before the Gate so the gate remains a mandatory authored threshold for the Abbey interior. Inside, side loops rejoin both before and after the principal nave encounter pocket; the upper route returns on the opposite side to avoid becoming a dead-end loot balcony.

**[OPEN]** The dotted P04–P06 connection is a required stateful outbound edge for `route.processional-steps.section.02`, but current authority does not establish whether G01 controls it. Blockout may test gate-controlled and independently controlled states; neither becomes canon without an accepted route-state contract.

**[PROPOSAL]** Foundry circulation is adjacent to, not inside, the nave. A shared rain court explains labor movement while preserving a separate industrial silhouette, audio profile, and streaming cell. The funeral exit reaches P06 without crossing the molten floor. Whether that connection bypasses G01 remains part of the **[OPEN]** P06/G01 relation above.

## 6. Exterior precinct, zone by zone

### P01 — West processional shelf

**[CANON]** This is the Abbey approach carried by the Processional Steps, a dry limestone trail rather than a cart road.

**[ART REFERENCE]** `assets/world/hollow-abbey-processional-west-arrival-v1.png` establishes a supplemental west-arrival direction with a central gate stair, a high loop and rejoin, and a lower continuation. Its facade, towers, circular opening, stair counts, and proportions are exploratory.

**[PROPOSAL]** Shape the last 120–180 m as three successive sightline shelves. Shelf one frames only the upper broken vault against the ash veil. Shelf two reveals the Gate and the high-loop retaining wall. Shelf three reveals the full arrival fan and the distinction between direct ascent, high loop, and outbound continuation. Keep each reveal caused by limestone ribs, not by arbitrary fog walls.

**[PROPOSAL]** Walking surface should alternate worn center stone with rough margins. The main line should read 3.5–5 m clear; passing pockets can widen to 7 m. A 1.6–2.2 m shoulder path may support single-file exploration, but it must never masquerade as the primary accessible route. Broken processional markers should use blank profile and interval spacing, not readable doctrine.

### P02 — Direct stair

**[PROPOSAL]** Build a broad, damaged ascent in short flights separated by recovery landings. Maintain a continuous alternate ramped path through the adjacent arrival fan so stairs do not become the only critical route. Use central wear, rain-dark edges, and bronze repair cramps to show repeated use. Never create a dramatic unguarded vertical drop at the conversation approach.

**[PROPOSAL]** Combat use is pressure, not a boss arena: long lower sightline, two side breaks, and one defensible landing. Cover comes from failed balustrade segments and maintenance basins, not waist-high tombstones repeated at game intervals.

### P03 — North high loop

**[PROPOSAL]** The high loop begins before the arrival fan, climbs through a collapsed terrace, and returns above the gate court. From the first fork, show a piece of the return railing so players can infer continuity. From the upper bend, show the direct stair, gate threshold, and at least one later upper-cloister opening.

**[PROPOSAL]** Make this route 2.2–3.0 m clear where traversal is expected. Local pinch points may narrow visually, but collision intent should preserve camera recovery. Lichen and pale coping stones distinguish this exposed loop from the wet black central approach. Do not use a bridge or water channel as its landmark.

### P04 — Arrival fan

**[PROPOSAL]** This is the first social and party-regroup space. It should be approximately fan-shaped rather than a square plaza, with grade and paving joints directing attention to the Gate. Reserve a 10–14 m clear conversation/assembly pocket offset from the direct combat line. Nhal's gate position must be visible from both approach routes without blocking either.

**[PROPOSAL]** Evidence of continuing life: temporary rain catches, a swept dry crescent beside the gate, boot and porter wear, recently retied plain cords, and one maintained drainage grate. Evidence of abandonment: empty mounting sockets, unmatched bronze clamps, and inaccessible upper doors. Do not fill the space with idle generic pilgrims.

### G01 / P05 — Gate of Exact Words and watch recess

**[CANON]** The Gate of Exact Words is a canonical landmark and quest interaction. It opens through authored exact-word state, not a generic key. Gatewarden Nhal stands at the gate and speaks through rain falling on empty verdigrised armor.

**[PROPOSAL]** Treat the threshold as a 6–9 m-deep gatehouse volume with two offset leaves or frames, never a flat glowing door. Its open/closed state must be legible from the arrival fan, and its traversal clearance must remain obvious even when Nhal, a party, and an encounter cue share the area. The watch recess sits laterally so the camera can frame Nhal against falling rain without hiding the opening.

**[PROPOSAL]** The exact-word mechanism should show grammar through alignment: nested bronze frames, movable blank clause plates, tensioned cords, and a receiving notch for the Cinder Seal. No readable sentence, rune, modern lock, UI glyph, or real-world religious text should be baked into geometry.

### C01 — Rain court

**[PROPOSAL]** The first interior-exterior transition is roofless enough to explain water, light, and mud management before the high vault. Use shallow stone grading toward several visible karst drains, individual catch basins that workers can move, and dry islands beside archive/infirmary doors. The court is wet but never flooded above a shallow film.

**[PROPOSAL]** This space distributes to the nave, cloister plots, foundry receiving, and service stair. It therefore needs four visually distinct edges: cracked choir tile inward; root-dark limestone toward plots; soot-dark limestone toward foundry; and dressed gate stone westward.

### C02 — Abandoned cloister plots

**[CANON]** Abandoned cloister plots are the recorded subsistence trace. Gold rain lichen, blind grave vine, white crypt mold, and velvet urn moss are accepted ecology-kit elements.

**[PROPOSAL]** Arrange the plots as narrow beds on collapsed terraces, partly roofed by cloister remnants. Their condition should show selective tending: some channels are cleared, some beds root-bound, some deliberately untouched. Root tenders work the seam during suitable phases. The area supplies a noncombat breathing loop, a Pallid Root revisit edge, and a view back to the upper-cloister return.

**[PROPOSAL]** Do not introduce ordinary green farm abundance. Surviving vegetation is pale, rain-fed, crypt-adapted, or lichenous. No edible crop species, yield, or diet is established here.

### P06 — Saltward/outbound shelf

**[CANON]** Bidirectional `route.processional-steps.section.02` continues from `site.hollow-abbey` to `site.salt-watch`.

**[PROPOSAL]** Keep the outbound shelf visible from the arrival fan and preserve it as a stateful through-route rather than making F07 the only connection. It should descend or traverse laterally along dry limestone, using wind exposure and salt-pale distant terrain to separate it from the Warden Reed approach. This is a route cue, not a claim of final compass bearing.

**[OPEN]** No current source says that G01 locks, unlocks, or bypasses P06. Keep the relation explicit in the graybox state table and acceptance images; do not publish a base accessibility rule until route-state authority exists.

### P07 — Cause-frame works yard

**[DESIGN CONSTRAINT]** The accepted `regional_an_echo_arrived_first` program requires foreword cause frames, an antecedent result, four materially sufficient possible causes, maintenance access, two egresses, and a permanent aftermath mutation. It records `karst_flood` as a hazard, a "karst flood pulse below crypt" condition, and the accepted outcome `drain_cause_built_with_downstream_flood_duty`.

**[PROPOSAL]** Reserve a 20–28 m works yard outside the nave's primary silhouette, accessible from the rain court and upper service route. One edge is a retained limestone face containing four mechanically distinct cause-frame sockets: counterweight, drain, buttress, and controlled-fall response. The player must infer actual load paths, so each solution needs physically different space, access, and failure evidence; four recolored switches are unacceptable.

**[PROPOSAL]** For the drain branch, carry staged roof runoff to a bounded, inspectable below-crypt karst receptor with a monitoring position, service clearance, and legible downslope flood duty. Treat that receptor as local quest-blockout scaffolding: no source assigns it a canonical stream ID, final recharge/discharge route, capacity, or engineering performance. It does not connect to Abbey Sink or `stream.abbey-sink`.

**[PROPOSAL]** Keep two exits visible before the timed decision: return to rain court and climb to upper service terrace. The chosen cause permanently alters one retaining face, debris field, maintenance path, audio return, and later NPC route through a compact state delta.

## 7. Mute Nave complex, room by room

**[DESIGN CONSTRAINT]** The base typology is a roughly 30 m × 72 m karst-limestone basilica shell with bronze resonant ties, two-to-six-story vertical expression, and a broken high vault open to eclipse rain. Exact story count and surviving bay count remain blockout decisions.

| Code / room | Required connection | Blockout and architecture response | Gameplay / story use | Authority |
|---|---|---|---|---|
| G01 Gate of Exact Words | P04 ↔ C01/N01 | Deep nested threshold; open-state silhouette readable from approach; blank clause plates and cord tension | `main_a_litany_unspoken`; Nhal; exact-word gating | Canon identity + proposal geometry |
| C01 Rain Court | Gate ↔ nave, plots, foundry | Broken forecourt vault; movable basins; visible shallow grading; four material edges | Regroup, tutorial for rain/depth cues, routine crossing | Proposal supporting canon utilities |
| N00 Nave vestibule | C01 ↔ N01/N02/N03 | Compressed 5–8 m-deep volume under surviving lower vault; first full interior reveal delayed until last step | Safe camera reorientation; threat/audio preview | Proposal |
| N01 Mute Nave spine | Vestibule ↔ Q01; lateral links to both aisles | 10–13 m clear central lane within full shell; long perspective broken by two cover islands, not clutter; crypt descent visible beyond urn field | Main quest movement; medium-range encounter; processional activity | Design constraint + proposal dimensions |
| N02 North side aisle | N00/N01 ↔ N04/U01/V01 | 3.5–5 m clear route under broken arches; dry vellum pockets; continuous return glimpse | Archive route, flanking, quiet conversation | Design constraint + proposal fit |
| N03 South side aisle | N00/N01 ↔ N04/U02/I01/R01 | 3.5–5 m clear route; wetter service wear; urn cover held away from mouths | Infirmary/reliquary route, flanking, recovery | Design constraint + proposal fit |
| N04 Lateral crossovers | N02 ↔ N01 ↔ N03 | At least two crossovers, one before and one after principal nave pocket; 3–4.5 m clear; overhead landmark differs at each | Prevents three parallel dead corridors; supports pursuit and retreat | Proposal |
| N05 North urn chapel | N02 ↔ Q01 edge | Partial apse with three separable urn stations and broken choir tile; no altar focal figure | Echo preview; Moira's evidence staging | Proposal using kit |
| N06 South reliquary chapel | N03 ↔ R01/Q01 edge; late-state M02 rejoin | Low niches, empty tongue reliquary, sealed shelves, rolling intake trestle | Mott/Netta/Aven quest work; Ossuary pressure edge; stable post-Clapper return | Proposal using canon artifacts |
| U01 Upper ascent | N02 ↔ upper cloister | Stair plus broken-ramp alternative; ascent visible from lower entrance; rain enters through joint above | Tactical height, exploration, route preview | Design constraint + proposal |
| U02 Upper return | Upper cloister ↔ N03 | Return point visible from at least one upper turn and from south aisle; not a blind jump | Completes upper loop; escape during phase shifts | Design constraint + proposal |
| U03 Upper cloister walk | U01 ↔ U02, overlooks N01/Q01 | 2.2–3.2 m clear ledge with intermittent solid parapet and two widened recovery bays; surviving bronze ties at eye level | Reconnaissance; Prior Cord/Bell Revenant states; eclipse-high circulation | Design constraint + proposal |
| V01 Vow archive | N02 ↔ E01/service recess | Tall narrow room of blank boards, thread loom, shelf ladders, document drying rails; dry floor island | Moira and Seln quests; archive hearings | Proposal grounded in character/site data |
| E01 Exact-word hearing room | V01 ↔ N01/G01 sightline | Bracketed bronze frame, three witness positions, one refusal recess, direct view toward gate state | Seln's voluntary-erasure choice; doctrine made spatial | Proposal; outcomes remain canon |
| I01 Silent infirmary | N03 ↔ C01 service edge | Low ceiling, washable stone, linen screens, water carried in discrete basins, two exits | Iven's treatment and quest; safe recovery pocket | Proposal grounded in Iven + utilities |
| R01 Reliquary intake | N03 ↔ N06/service door | Sorting trestles, blank-profile tags, secured crates, object/person-width doors, sightline to escape route | Mott and Netta quests; Aven's crate history | Proposal grounded in character canon |
| Q01 Resonant urn field | N01 ↔ K01; edges to N05/N06 | 18–24 m encounter length; urns in accountable pitch groups; long tracking lanes; edge clusters and sparse cover islands; route mouths kept clear | Echo Choir habitat, Cantor foreshadowing, acoustics, main quest transition | Design constraint + proposal dimensions |
| K01 Black crypt descent | Q01 ↔ O01 | Broad visible stair/ramp descending into materially colder black stone; light falls off decisively; landing visible before commitment | Canon discovery objective; phase-changing route | Canon landmark link + design constraint + proposal geometry |
| O01 Ossuary drawers | K01 ↔ B01/M01/O02 | Repeated storage rhythm varied by interval, not copy-pasted tombs; central sorting aisle, lateral crawl/service gaps, sealed wash edge | Ossuary Vermin habitat; Mott/Netta evidence; approach to Bell | Design constraint + proposal |
| O02 Deep service/revisit edge | O01 ↔ root seam / measure bay | Initially sealed or visually incomplete side connection; limestone/soil interface, no open water | Later Charnel Measure or Pallid Root content only when story-authorized | Proposal; population conditional |
| B01 Crypt of the Last Bell | O01 ↔ M01 | Deep load-bearing vault with boss-scale clearance; major bell mass suggested without forcing one final silhouette; urns placed as combat-relevant voice anchors | Cantor Oss fight; canonical crypt landmark | Canon destination + proposal geometry |
| M01 Clapper of Names ambulatory | B01 ↔ M02 | A walkable ring or offset chamber around the memory clapper; quiet choice pocket separated from boss cleanup; both the B01 return and M02 threshold visible from the decision position | `memory_clapper` interaction; remember/release decision | Canon artifact/choice + proposal room |
| M02 Memory Return stair | M01 ↔ N06 | Dry, mechanically ordinary service ascent that returns to the south reliquary chapel. In base state its M01 threshold is visibly sealed and cannot bypass Cantor Oss or the Clapper interaction. Completing the Clapper choice releases it permanently. A pale limestone seam plus taut plain-cord markers identify the whole route without readable labels. | Post-choice fail-safe egress and revisit shortcut. During `absolute_silence`, an already released M02 remains passable, keeps its cold edge-light/tactile cord cue, and excludes hostile population from its first recovery landing; an unreleased M02 stays sealed rather than changing destination. | Proposal; state does not change canon objective order |
| X01 Forgetful-door quest cell | V01/U03 ↔ sealed return | Modular two-threshold bay whose destination state can change without rebuilding base nave; one stable emergency return remains | Elo Veer's personal quest | Proposal; not base canon geometry |

### 7.1 Nave spatial discipline

**[PROPOSAL]** The central spine, side aisles, and upper walk must not be decorated independently. Their structural bays align, while damage changes which bay is traversable. A broken pier in N01 should explain a temporary brace in N02 and a missing parapet above in U03. This creates one believable building rather than three game lanes laid side by side.

**[PROPOSAL]** Maintain at least one 12–18 m uncluttered tracking interval in the principal encounter space. Keep large urns 1.5–2.5 m away from route mouths, inside corners, and stair landings. Any urn used as cover must have a readable walk-around route and must not conceal a second enemy family by default.

**[PROPOSAL]** The nave roof should alternate surviving vault ribs, open rain wounds, and braced failure zones. Eclipse light enters as narrow cold shafts that reveal height and rain, not as a constant white spotlight on every objective.

## 8. Foundry of Borrowed Quiet, room by room

**[DESIGN CONSTRAINT]** The foundry typology uses a roughly 22 m × 46 m limestone casting hall reinforced with bronze silence frames, with two-to-five-story vertical expression. Its accepted materials are sooted limestone, bell bronze, blackwater quench tile, and dark oak. Its roof is a rain-open casting lantern with seven acoustic baffles.

| Code / room | Blockout response | Required operational read | Quest / encounter use | Authority |
|---|---|---|---|---|
| F01 Material receiving | Covered loading throat from C01, crane sockets, separated bronze/charcoal/wax storage, one clean pedestrian margin | Incoming charge can reach F02 without crossing conversation space | Worker routines, entry briefing | Design constraint + proposal |
| F02 Molten bell floor | Central casting lane with furnace control on one side and mold pits on the other; all exits visible from control | Process order and hot-zone boundary visible without floor text | `Bell Paid in Silence`; hazard arena only when authored | Design constraint + proposal |
| F03a–g Seven silence rooms | Seven wedge or bay volumes visible from a shared supervisory position; each differs by threshold geometry and dust edge, not color | All seven simultaneously legible and non-musical; none hidden behind a loading screen | Future-silence escrow; social choice positions | Design constraint + proposal |
| F04 Ripple gallery | Narrow protected gallery above or beside the closed quench circuit; broad direct sightline from deaf-worker position to surface ripples | Water behavior communicated visually; no reliance on hearing | Visual cue tutorial, witness route | Design constraint + proposal |
| F05 Wage archive | Dry, enclosed room off F04 with token drawers, blank debt plates, and a secure interview recess | Wages and silence are handled away from molten circulation | Wage-clapper decision and persistent creditor cracks | Design constraint + proposal |
| F06 Cooling vault | Massive, cooler chamber reached from F02 by controlled gate; molds and cooling tools have dedicated clearances | Cooling sequence follows physical order; no decorative machinery blocks exit | Recovery, evidence, funeral preparation | Design constraint + proposal |
| F07 Funeral exit | Exterior/service threshold reached from F06; visually traceable from furnace control through doors or glazed/railed openings | Advance-funeral route never crosses F02 molten floor | Consequence route and outbound connection | Design constraint + proposal |
| F08 Damper walk | Upper maintenance strip, ladders/stairs kept outside critical carrying arc | Manual damper operation and roof-rain separation visible | Quiet-shift routine and optional tactical height | Proposal grounded in utility record |

**[PROPOSAL]** The seven rooms should create seven different social distances: open witness bay, narrow one-to-one cell, paired bench room, standing rail, screened room, circular shared room, and empty reserve. These are spatial variations, not seven new canonical rituals. Any quest packet that assigns meaning to a room must do so explicitly.

**[PROPOSAL]** The quench circuit is closed and locally serviced. Show a bounded black-tile channel/tray, access valves or gates, a settling tank, and visible ripple surfaces. Do not continue it through the precinct terrain, under the nave as a stream, or toward Abbey Sink.

## 9. Construction, material, and weathering vocabulary

### 9.1 Binding palette and surfaces

**[DESIGN CONSTRAINT]** The accepted Hollow Abbey palette is shadow `#07090f`, stone `#777876`, bronze `#3e655f`, linen `#77746d`, accent `#b59b61`, and eclipse `#d5d9d2`. Wetness direction is high (`0.77` in the kit), but burial dust and protected archive pockets remain dry enough to preserve contrast.

**[DESIGN CONSTRAINT]** Surface vocabulary: wet nave flagstone, eroded bone limestone, black crypt stair, resonant bronze inlay, cracked choir tile, and burial dust. Structure vocabulary: tongueless-saint niche, broken nave arch, upper cloister, sealed crypt stair, mute screen, urn side chapel, Exact Words gate, and Last Bell vault.

### 9.2 Material application

| Material | Where it belongs | Aging and repair read | Avoid | Authority |
|---|---|---|---|---|
| Bone limestone | Nave shell, dressed gate, ossuary structure | Rain solution channels on exposed faces; pale dry fracture interiors; darker hand/shoulder wear at work height | Uniform gray castle stone; random black grime over every face | Design constraint + proposal application |
| Wet black flagstone | Arrival fan, rain court, nave rain lanes | Thin reflective film, worn crown, pale joint sediment; no deep puddle language | Mirror-polished floor; submerged nave | Design constraint |
| Black crypt stone | K01 and deep thresholds | Low reflectance, cold edge moisture, sparse pale scuffs showing traffic | Same value as exterior flagstone; glowing cracks | Design constraint + proposal application |
| Verdigris/resonant bronze | Ties, gate mechanism, urn fittings, foundry frames | Green bloom concentrated at cracks and water paths; polished dark contact zones; old-gold edges used sparingly | Bright brass fantasy trim; identical green coating everywhere | Design constraint |
| Cracked choir tile | Central/aisle route coding | Fractures follow settlement and missing bedding; repaired with bronze cramps where route still matters | Decorative repeating musical notation | Design constraint |
| Rotted oak / dark oak | Old stalls, doors, foundry service, temporary braces | End-grain loss, black water staining, replacement pegs and scarf joints | Intact ornate pew forests; generic pallet clutter | Design constraint + proposal application |
| Linen and vow thread | Screens, treatment, gate/archival mechanisms | Chalk-gray, wax-stiffened, patched, tied with functional knots | Flowing clean white robes; decorative banner spam | Design constraint |
| Gravewax | Isolated practicals, seals, task lamps | Finger-smoothed rims, soot cones, reused drips caught on trays | Hundreds of candles as generic mood filler | Design constraint + proposal application |
| Burial dust | Protected crypt/urn/quiet-room edges | Accumulates where labor deliberately does not cross; records route history | Even particle coating over wet floors | Design constraint |
| Grave soil and roots | Cloister plots, O02 seam only | Dark porous beds, pale fungal fibers, root tension at stone joints | Roots everywhere as generic corruption | Design constraint + proposal zoning |

### 9.3 Construction-history readability

**[PROPOSAL]** Use four visually separable intervention layers without assigning them unsupported dates:

1. **Primary shell:** large dressed limestone, consistent bay rhythm, original vault load path.
2. **Resonant retrofit:** bronze ties, urn rails, clapper-chain bearings, exact-word frames.
3. **Collapse response:** rough dry-laid infill, reused oak braces, mismatched clamps, redirected paths.
4. **Current survival maintenance:** movable rain basins, fresh plain cord, swept margins, patched linen, labeled-in-data but blank-in-art storage profiles.

**[NONCLAIM]** These layers express relative sequence only. They do not establish dates, builders, engineering adequacy, or a complete construction history.

### 9.4 Weathering map

**[PROPOSAL]** Exposed west/arrival faces carry rain solution rills and gold rain lichen. Under broken roof wounds, stone has dark vertical runnels and bright fresh spall. Protected archive faces stay powdery and linen-gray. Foundry surfaces separate soot above from wax and slag below. Crypt bronze develops green bloom along resonant cracks; dry drawer interiors retain pale bone dust. Root zones stain joints from below rather than receiving the same top-down rain streaks.

**[PROPOSAL]** Every weathering mask should answer one of five causes—rain, handling, heat, burial, or root contact. If a mark has no cause, remove it.

## 10. Water, drainage, and non-hydraulic systems

### 10.1 Five systems with explicit boundaries

| System | Established truth | Precinct visualization | Forbidden inference |
|---|---|---|---|
| Roof rain and surface runnels | **[DESIGN CONSTRAINT]** Nave uses roof rain basins and karst drains | **[PROPOSAL]** Shallow graded sheets, movable catch basins, local drain mouths, intermittent dry islands | No river, canal, deep flood, or automatic connection to a well |
| Karst bell wells | **[CANON]** Site water source | **[PROPOSAL]** Protected wellheads on stable shelf, with carried containers and inspection clearance | Do not claim depth, yield, recharge route, potability, or link to Abbey Sink |
| Foundry blackwater quench | **[DESIGN CONSTRAINT]** Foundry has a blackwater quench circuit and sightline to it | **[PROPOSAL]** Closed trays/tank/return loop within the foundry service envelope | Do not discharge it into the nave, terrain stream, bell well, or Abbey Sink |
| P07 below-crypt karst receptor | **[DESIGN CONSTRAINT]** `regional_an_echo_arrived_first` records a below-crypt karst flood pulse, `karst_flood`, roof basins feeding a staged drain frame, a blocked-karst-branch design storm, and `drain_cause_built_with_downstream_flood_duty` | **[PROPOSAL]** A bounded local receptor/monitoring zone connected only to the quest's staged drain branch; preserve service clearance and a visible flood-duty consequence | No inferred link to a bell well, foundry quench, Abbey Sink, or `stream.abbey-sink`; no invented capacity, outlet, or safety certification |
| Abbey Sink | **[CANON/DERIVED]** Named stream crossing is off-precinct, outside the 960 m influence envelope | **[PROPOSAL]** Omit it from precinct blockout and precinct concept frames | No bridge, moat, culvert, waterfall, sewer, or hydraulic connection at the Abbey |

### 10.2 Local drainage logic

**[PROPOSAL]** Roof wounds shed rain into three accountable surface families: a central nave runnel, two aisle-edge gutters, and discrete court channels. Each base-system line terminates at a visible local karst drain or capture basin within the modeled cell, and no downstream destination is asserted. The only exception is the authored P07 drain branch: its route to the bounded below-crypt receptor and its downstream flood duty must remain quest-scoped and state-readable.

**[PROPOSAL]** Give every critical two-way route the Section 15.1 target of 2.4–3.2 m unobstructed, dry or merely damp during roof-rain state. Allow ankle-shallow visual sheets only outside critical interaction footprints. Crypt steps use drip edges and side channels so the stair reads wet but not submerged; the P07 below-crypt receptor remains outside the critical traversal line. Conversation circles, exact-word interaction, infirmary treatment, and Last Bell decision surfaces remain free of active flow.

**[PROPOSAL]** Service access accompanies drains: removable stone grates, a worker standing patch, and a tool-rest notch. A routine blocked-drain state is shown through leafless root fiber, bone grit, and diverted shallow water; clearing it changes the local wetness decal and audio emitter, not the entire site's hydrology. The P07 blocked-karst-branch state is a separate quest hazard and may alter its local receptor, monitoring route, and flood-duty evidence without rewriting the other four systems.

### 10.3 Utility vocabulary

**[DESIGN CONSTRAINT]** The nave records isolated candles and worker braziers for heat, sealed wash and ossuary sorting for waste, and eclipse shaft/candles/resonant urn glow for light. The foundry records manual furnace dampers, separated slag and wax, furnace bounce, and narrow roof rain.

**[PROPOSAL]** Utility routes should be visible enough to support work:

- workers carry bell-well water in bounded vessels; no invisible pressurized plumbing is presumed;
- isolated braziers occupy vented, non-route recesses and never turn the nave into a warm hall;
- sealed wash uses lidded basins and removable containers; its disposal route remains unclaimed pending systems review;
- slag, wax, bone, and document waste each have visibly different containers and exits;
- bronze ties, urn rails, and silence frames function as acoustic infrastructure, but their physical behavior is art-directed rather than engineering-certified;
- task light comes from eclipse openings, gravewax practicals, and foundry bounce, with a visual cue paired to any critical sound cue.

## 11. Light, sound, weather, and VFX

### 11.1 Global sensory law

**[CANON]** Hollow Abbey carries broken choirs and one-beat-late footstep response.

**[DESIGN CONSTRAINT]** Lighting uses eclipse shafts, wet-floor bounce, and resonant-urn practicals with high contrast. VFX/audio vocabulary includes roof rain, delayed rain rings, urn resonance, burial dust, still pressure pockets, distant choir fragments, bronze strain, linen movement, drain clicks, and deliberately absent sound.

**[PROPOSAL]** Never use a single continuous “haunted cathedral” loop. Compose each zone from a physical foreground source, a site-wide delayed response, and an occasional impossible absence. The player should identify location by the relationship among those layers.

### 11.2 Phase matrix

| Phase | Canon/design activity | Light response | Sound response | VFX / material response | Route response | Authority |
|---|---|---|---|---|---|---|
| `roof_rain` | Basins placed, urn pitches checked, karst drains cleared; aisle work | Cold shafts sharpen; wet bounce increases locally | Foreground rain is immediate; architecture answers one beat late; drain clicks mark depth | Thin runnels, basin rings, gold lichen saturation, localized mist at cold openings | Main lane remains passable; maintenance figures occupy edges | Design constraint + proposal presentation |
| `eclipse_high` | Processional routes open, archive hearings, upper-cloister traversal; nave peak | Eclipse-white shafts define gate, upper return, and crypt mouth; no warm noon | Human work and cloth movement rise; choir remains fragmented | Reduced rain density, stronger airborne dust in dry shafts | Gate/social routes open; upper loop most legible | Design constraint + proposal presentation |
| `quiet_shift` | Bell casting, future-silence escrow, ossuary sorting; specialist cells | Foundry bounce and small task practicals dominate; nave darker | Hammering is organized but not musical; visual ripple cues carry key information | Soot motes, controlled steam within foundry, drawer dust | Foundry/service cells active; public nave thinner | Design constraint + proposal presentation |
| `absolute_silence` | Hammering ceases, crypt routes change, echo entities active; deliberate absence | Practical count reduces; black crypt boundary deepens; stable exit markers persist | Site bed drops intentionally; critical mechanics receive visible/tactile equivalents | Still-pressure distortion, suspended dust, delayed rings without visible rain source only where authored | One crypt connection may change, but no critical route loses two-egress safety; released M02 stays fixed, lit, and passable | Design constraint + proposal safety rule |

**[PROPOSAL]** “Silence” must not mean muting all player feedback. Preserve accessibility-safe attack tells, damage response, interact confirmation, and route state using silhouette, vibration, particles, material response, or UI systems owned elsewhere. The environment provides visual equivalents; it does not claim the final accessibility implementation.

### 11.3 Zone signatures

- **[PROPOSAL] Arrival:** close rain on stone, distant displaced toll, rope strain, broad eclipse silhouette.
- **[PROPOSAL] Gate:** rain on Nhal's armor, clause-frame tension, one exact metal contact followed by no echo.
- **[PROPOSAL] Nave:** footstep return one beat late, wet-floor reflection, intermittent broken choir from no fixed body.
- **[PROPOSAL] Side aisles:** cloth, broom, page edge, and intimate wall return; less low-frequency urn energy.
- **[PROPOSAL] Urn field:** separately placed pitches, bronze bloom, delayed circular surface rings, clear quiet gaps between clusters.
- **[PROPOSAL] Crypt:** reduced roof rain, drawer knocks, dry joint spill, long vertical draw.
- **[PROPOSAL] Foundry:** damper breath, controlled hammer, visible ripple, furnace bounce; absolute silence is a conspicuous operational stop.
- **[PROPOSAL] Cloister plots:** exposed rain, root tension, cloth screens, no generic birdsong.

## 12. Ecology and creature habitat plan

### 12.1 Family-level zoning

**[DESIGN CONSTRAINT]** Per-encounter population envelopes in spatial data are broad authoring limits, not instructions to fill each room. Every listed form is excluded from settled safe cells. Founding/social cells must remain safe unless a quest phase explicitly changes them.

| Family | Canon ecology and microhabitat | Proposed precinct habitat | Environmental tells | Exclusions and use rule | Authority |
|---|---|---|---|---|---|
| Hush Order | Tongueless monastics turn combat rhythms into silent liturgy; mute aisle, Exact-Word gate, vow archive | N02/N03 edges, V01, G01 inner face, selected U03 bays | Cloth/blade aligns around empty sound; broom on stone; dust, inkless vellum, gravewax | No uncontrolled market noise; no generic ordinary hooded monk silhouette; not in designated social-safe cells | Canon/design constraint + proposal placement |
| Echo Choir | Bodyless voices nest in urns, bells, and stone hollows; urn field, choir vault, delayed rain ring | Q01, N05, B01 approaches, specific broken arches | Architecture answers one beat late; wet bronze, urn dust, rain lichen | No sound-dead peat; do not render as robed ghosts; individual entities need form-specific anatomy | Canon/design constraint + proposal placement |
| Ossuary Vermin | Scavengers assemble borrowed skeletons into communal bodies; bone drawer, crypt spoil, cairn breach | O01, K01 lower landings, R01 breach state, N06 evidence edge | Accountable remains assemble; tooth click, dry joints, bone dust, old linen | No salt-flooded exterior; not ordinary skeletons or random bone piles; keep out of safe intake state | Canon/design constraint + proposal placement |
| Bell Revenants | Consecrated bells remember ringers; bell road, abandoned belfry, memory-clapper route | P01/P03 event route, U03 belfry remnant, M01 revisit state | Rope/bronze/absent-tower geometry; displaced toll; verdigris, rope tar, rain | No acoustically isolated void; do not place throughout base nave merely because it contains bronze | Canon/design constraint + proposal placement |
| Charnel Measures | Mortuary clerks obey storage geometry folding bodies, rooms, and distances; grave survey, limestone warehouse, body-scale registry | O02 measure bay and a controlled O01 state after appropriate progression | Measuring tools share anatomical load path; plumb line, drawer knock, lime, grave soil, black nacre | Limestone/grave soil, slope ≤0.55, corruption ≥0.5; no open water; high-level/revisit family, not base-population filler | Canon/design constraint + proposal placement |
| Pallid Root Communion | Grave roots coordinate remains through fungal signals; grave-root seam, orchard below, cemetery edge | C02 lower beds, O02 soil seam, precinct cemetery edge within authored state | Root networks negotiate bone/soil; fungal eyes/caps; grave loam, pale fungus, wet limestone | Moisture 0.3–0.76, within 180 m of cemetery, no sterile slag floor; not the same visual effect as generic ruin ivy | Canon/design constraint + proposal placement |

### 12.2 Primary family form placement

**[CANON]** The form names and family assignments below are canonical. **[PROPOSAL]** The habitat sockets are encounter candidates only; they do not assert that every form is simultaneously present, available at the same level, or appropriate before its authored quest/state.

| Family | Form | Proposed habitat socket and spatial support |
|---|---|---|
| Hush Order | `hush_monk` | N01-to-N04 cadence arena: multiple rejoin lanes and visible recovery distance |
| Hush Order | `vow_sweeper` | V01/N02 dry threshold: a sweepable dust edge and two exits, away from uncontrolled rain |
| Hush Order | `exact_word_adept` | G01/E01 authored gate state: clause-frame sightline and protected side approach |
| Hush Order | `inkless_lector` | V01 shelving bay: interrupted long sightline, blank vellum surfaces, flank from N02 |
| Hush Order | `prior_cord` | U03 widened bay: continuous cord silhouette readable against eclipse opening, safe fall boundary |
| Hush Order | `abbot_of_exact_words` | E01 or a quest-locked gate court only; preserve unique-anchor clearance and do not use as ambient population |
| Hush Order | `dust_novice` | N02/N05 protected burial-dust pockets; keep wet-floor boundary visually sharp |
| Hush Order | `mute_porter` | R01/G01 service threshold in hostile state; object-width clearance and crate route remain visible |
| Hush Order | `pause_inquisitor` | N04 crossover where stopping/starting can be read from three approach lanes |
| Hush Order | `comma_blade` | N03 broken-arch sequence with lateral escape; never a blind one-character pinch |
| Echo Choir | `urn_whisper` | Individual Q01 urn stations separated far enough to localize source |
| Echo Choir | `wall_canticle` | N05 broken apse or Q01 retaining face with a clear wall/body distinction |
| Echo Choir | `resonance_beadle` | Q01 rail threshold controlling movement between discrete pitch groups |
| Echo Choir | `stone_soprano` | Cracked choir-tile pocket at N01/Q01 transition; dry stone response contrasts wet floor |
| Echo Choir | `choirmaster_without_lungs` | B01 antechamber or authored revisit, with vertical acoustic volume and two lateral exits |
| Echo Choir | `cantor_oss` | B01 canonical boss arena; voice-bearing urns are readable, reachable, and not identical decoration |
| Echo Choir | `breathless_note` | U03-to-Q01 air volume, bounded so it cannot hide above camera without a readable cue |
| Echo Choir | `urn_moth` | N05/Q01 high edge clusters; enough dark backdrop for small silhouette tracking |
| Echo Choir | `interval_thief` | Between two explicitly separated urn stations; navigation gives players room to compare sources |
| Echo Choir | `nave_resonator` | N01 large central pocket in a quest/revisit state, with structure-wide response but a localized body read |
| Ossuary Vermin | `finger_mice` | O01 drawer bases and service gaps; aggregate remains accountable and safe-cell boundary explicit |
| Ossuary Vermin | `ribcage_screecher` | K01 lower spoil shelf with clear sound-to-silhouette line and no route-mouth ambush clipping |
| Ossuary Vermin | `borrowed_spine` | O01 long sorting aisle; directional movement readable against drawer rhythm |
| Ossuary Vermin | `reliquary_millipede` | N06/R01 hostile breach state; shelf spacing supports complete body silhouette |
| Ossuary Vermin | `crypt_assembler` | O01 sorting floor with loose-remain anchors distributed as mechanics, not decorative piles |
| Ossuary Vermin | `the_borrowed_saint` | O02 or deep authored revisit; boss-scale turn/brake clearance and contradictory relic access preserved |
| Ossuary Vermin | `tooth_rook` | Broken crypt gallery with clean airborne silhouette; not generic crows on exterior roofs |
| Ossuary Vermin | `heel_crab` | K01/O01 track-reading pocket with crossing paths and room to create a decoy trail |
| Ossuary Vermin | `marrow_factor` | O01 inventory bay with left/right remains space and a reachable empty side |
| Ossuary Vermin | `pelvis_paladin` | O01 lateral vault or B01 aftermath state with duel clearance and no background bone clutter |

### 12.3 Secondary and revisit families

**[CANON]** Bell Revenant forms are `ropewalker`, `clapper_squire`, `verdigris_ringer`, `memory_carillonneur`, `dusk_toll_collector`, `bell_without_tower`, `rope_larva`, `cracked_acolyte`, `echo_sutler`, and `vesper_engine`.

**[PROPOSAL]** Reserve three Bell Revenant encounter sockets rather than distributing all ten: an exterior bell-road socket across P01/P03; a belfry-remnant socket connected to U03; and a memory-clapper socket at M01. Each authored encounter selects forms whose locomotion, scale, and counterplay fit the socket. `bell_without_tower` and `vesper_engine` require bespoke clearance review and are not ambient substitutions for a statue or door.

**[CANON]** Charnel Measure forms are `drawerling`, `tally_corpse`, `plumb_line_butcher`, `folded_registrar`, `master_cubit`, and `warehouse_one_body`.

**[PROPOSAL]** O02 provides a body-scale registry edge with straight datum views, drawer clearances, and a grave-soil/limestone interface. `warehouse_one_body` requires a separate reviewed volume; do not scale an ordinary corridor until it fits. Charnel geometry uses right angles, ivory cabinet masses, drawers, cables, and measuring instruments—never generic horned demons.

**[CANON]** Pallid Root forms are `root_fingerling`, `grave_cap`, `nerve_gardener`, `communion_walker`, `pallid_sexton`, and `orchard_below`.

**[PROPOSAL]** C02 supports small/medium root activity; O02 supports the deep seam; `orchard_below` requires a dedicated canopy volume and must not be shrunk into a corridor. Root-woven cadaver collectives remain localized to soil, burial, and moisture logic. They must not appear on the foundry's sterile slag floor.

### 12.4 Quest-bound Foreword Cantor

**[DESIGN CONSTRAINT]** Accepted Wave-04 data defines `foreword_cantor` as an elite Echo Choir controller for `regional_an_echo_arrived_first`. A hollow limestone torso hangs backward from one bronze mouth-ring; exactly four ear-shaped counterweights face the future route while the mouth opens toward the place the body left. It moves only after its next footfall has already sounded from the destination. Its cue is: exactly one counterweight turns toward an empty cause-frame as the result sounds from the adjacent room. Counterplay requires staging a different materially sufficient cause inside that frame before the body arrives.

**[DESIGN CONSTRAINT]** `habitat.foreword_cantor.hollow_abbey_cause_frames` and `encounter.echo.foreword` bind it to the antecedent urn, all four cause frames, roof, crypt, refuge, and persistent scar, with the habitat active in `roof_rain` and the encounter contract in `eclipse_high`. Its ecology is the overlap of karst stress and repeated warnings, not a generic haunt or substitute Cantor Oss.

**[PROPOSAL]** Stage one authored encounter across P07's cause-frame lanes, with the announced destination, empty target frame, physical body route, counterplay volume, safe refuge, and two egresses simultaneously readable. Do not place this form as ambient Echo Choir population elsewhere in the nave. Its accepted pipeline is `awaiting-art`; concept master, transparent cutout, static model, and animated model are all absent/unassessed, so use a uniquely labeled proxy that preserves the one-ring/four-counterweight silhouette and never imply model readiness.

### 12.5 Noncombat ecology

**[DESIGN CONSTRAINT]** White crypt mold, gold rain lichen, blind grave vine, and velvet urn moss are the accepted site flora/fungal kit.

**[PROPOSAL]** Use them as environmental sensors:

- gold rain lichen thickens on exposed return edges and makes exterior loops discoverable without arrows;
- white crypt mold occupies cold protected limestone near K01/O01 but breaks at actively handled drawer faces;
- blind grave vine follows the soil-to-stone seam at C02/O02 and indicates root habitat without placing a creature;
- velvet urn moss colonizes inactive urn shoulders but is rubbed away on maintained pitch surfaces.

**[NONCLAIM]** No generic rat, bat, crow, insect swarm, farm animal, or ambient humanoid is authorized by this dossier. If a living silhouette is needed, use a canonical family/form or leave the motion to rain, cloth, dust, roots, and workers.

## 13. Site activity cycles and a living precinct

### 13.1 Canonical phase contract

**[DESIGN CONSTRAINT]** The four site phases are `roof_rain`, `eclipse_high`, `quiet_shift`, and `absolute_silence`. The recorded activities and densities are a simulation contract, not a spawn schedule. Persistent story signals are which Exact Word gates are open, creditor crack locations, urn pitch distribution, and rain route through doctrine.

### 13.2 Proposed workday wheel

**[PROPOSAL]** Because the sun is veiled, do not communicate routine through a bright terrestrial morning/noon/night cycle. Treat one local workday as an ordered but variable-duration wheel:

1. **Rain preparation:** movable basins come off wall hooks; drains are inspected; infirmary and archive dry islands are checked.
2. **Roof rain:** aisle crews work edges while gate traffic compresses into sheltered pauses; urn pitches are checked after each strong roof pulse.
3. **Route opening:** the Gate and processional path move into public configuration; Nhal, Seln, and archive witnesses become most available.
4. **Eclipse high:** hearings, pilgrim movement, upper-cloister traversal, and social quests occupy the nave complex.
5. **Transition count:** public movement thins; tools, urns, and remains are transferred to specialist cells without a crowd teleport.
6. **Quiet shift:** foundry casting, silence escrow, drawer sorting, and treatment work dominate.
7. **Absolute silence:** hammering and ordinary work cease; staff withdraw to marked refuge pockets; crypt routes and Echo activity change.
8. **Recovery:** workers re-enter in pairs, check route state, return basins/tools, and leave visible aftermath rather than resetting every prop.

**[PROPOSAL]** The duration of each segment follows weather, story state, and encounter need. A reviewer should see at least one transition in motion—workers carrying a basin, closing a silence-room frame, or clearing an urn lane—rather than watching characters pop between schedule markers.

### 13.3 Proposed seven-day maintenance cadence

**[PROPOSAL]** Use numbered maintenance days in tools/data until narrative authority names them. This avoids inventing a religious calendar.

| Day | Visible work | Persistent evidence left for the next day |
|---|---|---|
| 1 | Gate frames, cords, and open-state clearances inspected | Fresh tension marks; one displaced blank plate awaiting decision |
| 2 | Roof drains and rain basins serviced | Cleared grit piles; changed wetness path; one safely blocked maintenance niche |
| 3 | Urn pitches compared and moss removed from active rims | Separable tuning positions; moss rub; moved cover islands remain accounted for |
| 4 | Vow archive, wage archive, and empty reliquaries audited | Blank-profile tags grouped by function; no readable text baked into props |
| 5 | Ossuary drawers sorted and sealed wash completed | Drawer-state delta, bone-dust routes, a closed service container |
| 6 | Cloister plots and grave-root seam assessed | Pruned vine, exposed root negotiation, one bed deliberately left untouched |
| 7 | Foundry dampers, cooling tools, and funeral route checked | Soot/wax separation, open exit sightline, repaired floor marker by shape |

**[PROPOSAL]** Quest states can interrupt the cadence, but they should mutate it specifically. If Netta changes her legal status, reliquary intake procedure changes; if the Clapper choice changes memory handling, M01 and related worker paths change. Do not globally replace all workers with a generic “post-quest” schedule.

## 14. Named-character routines and staging

**[CANON]** Hollow Abbey's founding data-layer site cast in `src/data/characters.js` is Gatewarden Nhal, Moira Quiet, Seln Clause, Brother Iven, Aven Tongueless, Elo Veer, Mott Vane, and Netta Aster. Here “founding” means the initial canonical site roster, not the Abbey's historical founders. Their master and cutout images are indexed; the current registry assigns a generic rig class and does not establish finished static or animated subject models.

**[PROPOSAL]** Routine markers below are staging anchors, not fixed spawn schedules. Quest ownership, current outcome, safety, and population phase override them.

| Character | Canon identity / conflict | Proposed home and routine loop | Quest staging and state change | Visual / animation handoff |
|---|---|---|---|---|
| Gatewarden Nhal | Exact Word gatewarden; empty verdigrised armor speaks through rain; obey the seal yet find wording for mercy; last living part is the rain, not a being in the armor | Home at P05 watch recess. Roof rain: G01 ↔ C01 basin line. Eclipse high: G01 public threshold. Quiet shift: one inspection loop to E01. Absolute silence: stands where rain remains visually present without blocking exit | `Rain in an Empty Helm`: use P05, C01, and an optional M01 echo of oath. Outcomes—free as rain, renew oath, give shadow—change armor/rain/shadow state locally and Nhal's loop | Maintain empty silhouette; wet black/verdigris plate, hood void, large exact-key staff, hanging tokens. Rain response and hollow armor articulation need bespoke review; do not put a normal body under the armor |
| Moira Quiet | Exact Word vow archivist; fabricated three historical vows to hide that founders made no sacrifice | Home V01. Roof rain: protects drying rails. Eclipse high: V01 ↔ E01 hearings. Quiet shift: V01 ↔ N05 urn evidence. Absolute silence: archive refuge, with one visible manual task | `Promises Without Makers`: three physically distinct evidence stations in V01/N05. Expose, preserve, or write a new vow mutates which boards/threads remain accessible without declaring a universal moral winner | Severe practical dark archivist clothing, slate-like tags, book, scrolls/dividers. Favor deliberate page, tag, and gaze animation; no glowing scribe effects |
| Seln Clause | Exact Word binding advocate; wants the Bell-binding sentence completed and a settlement to accept voluntary erasure; born in Hearthmere under an erased name | Home E01. Eclipse high: E01 ↔ G01 witness route. Quiet shift: E01 ↔ V01 review. Roof rain: stays under gate frame observing entry. Absolute silence: seated/standing at the uncompleted clause position | `The Voluntary Erasure`: E01 provides three witness positions, refusal recess, and a sightline to G01. Reject, offer a memory, or restore Seln's name changes plate arrangement, stance, and access—not generic faction color | Austere black long coat with restrained red seams, blank metal clause tags, bracket staff, document case. Animation emphasizes exact placement and stopped gestures; tags remain unreadable |
| Brother Iven | Exact Word infirmarian; treats without spoken rites, seeks sensation; a returned tongue lets him hear thoughts near bells | Home I01. Roof rain: I01 treatment. Eclipse high: I01 ↔ N03 triage circuit. Quiet shift: I01 ↔ Q01 controlled sensory check. Absolute silence: retreats to screened inner bay but remains reachable | `A Tongue Regrown`: I01 is the consent/treatment space; Q01 supplies the bell-proximity test. Speak, remove, or use the gift changes Iven's proximity tolerance and screen/route, not the site's entire audio mix | Pale linen/mask, dark apron, vials, rolls, case. Hand sanitation/treatment, careful listening recoil, and screen interaction matter; no generic healer spell loop |
| Aven Tongueless | Hush defector; wants child recruitment stopped and communication beneath the Bell; severed tongue became an informing echo | Home shifts between N06 and C01, never the Hush-controlled safe cell during a hostile state. Roof rain: R01 crate/service work. Eclipse high: C01/N03 observation. Quiet shift: N06 ↔ Q01 controlled approach. Absolute silence: uses signed/gesture route to a refuge | `The Informing Tongue`: N06 holds the crate-history evidence; Q01/M01 can host the informing echo only when quest-authored. Destroy, reunite, or feed false words changes echo relation and Aven's route | Weathered dark layered clothing, face wrap, raised open hand, blank tags, small secured case. Prioritize a readable manual-communication set; do not animate speech as default |
| Elo Veer | Unwritten Roads exit finder; maps rooms whose doors forget destinations; expedition returned while Elo remains trapped projecting outward; Nhal knows the body is inside a sealed gate | Projected interactive anchor at P04/G01 or C01. Eclipse high: apparent P04 ↔ U01 survey loop. Other phases: intermittent route checks. Physical body is not a second ambient NPC; it appears only in X01 quest state | `The Cartographer Outside Himself`: X01 uses a mutable destination door with one stable fail-safe exit. Retrieve body, stabilize projection, or trade condition changes which version/anchor persists. Never spawn both as ordinary duplicates | Worn survey coat, plumb line, keys, lantern, frame pack. Projection treatment must remain restrained and route-bound; plumb line and uncertain hand spacing carry character before VFX |
| Mott Vane | Grave Tithe reliquary forger; returns mislabels and embarrasses institutions; invented a saint who is now performing miracles | Home R01. Roof rain: moves sealed cases from C01. Eclipse high: R01 ↔ V01 dispute. Quiet shift: R01 ↔ O01 sorting edge. Absolute silence: stays in a secured intake recess | `Saint Nobody's Bones`: R01/N06/O01 hold three provenance chains. Unmake, legitimize, or return mixed relics changes shelf grouping and visitor behavior, not the canonical bestiary roster | Dark worn coat, portable case, tag/seal tools, personable posture. Use fast confident sorting that becomes cautious around contradictory evidence; no thief-idle stereotype |
| Netta Aster | Grave Tithe living-relic smuggler; extracts people labeled as objects; bone bells make her sacred property; carried Aven out in a crate | Mobile home: P01/P04 arrival ↔ R01 ↔ N06, with an escape-capable service route. Roof rain: covered transfer. Eclipse high: public challenge at R01. Quiet shift: extraction planning. Absolute silence: low-bell movement route avoids Echo hot zones | `A Reliquary That Walks`: R01 exact object/person clearances and G01 legal exit support free legally, remove bells, or claim status. Outcome changes inspection behavior, bell secondary motion, and which door recognizes her | Practical black leather/cloth, red-brown harness, many small bells, tools, hard case. Bells need controlled secondary motion and silence-state behavior; do not turn her into a generic rogue |

### 14.1 Quest-bound actor overlays

**[CANON/DESIGN CONSTRAINT]** The expansion registry and accepted Wave-04 manifest add the following actors to specific Hollow Abbey quests. They are not additions to the founding resident schedule, and their involvement does not authorize simultaneous ambient spawning.

| Actor / ID | Authoritative quest relation | Proposed on-site staging | Art/model handoff |
|---|---|---|---|
| Deacon Halix / `deacon_halix_bell_of_noon` | **[CANON]** Herald whose voice temporarily restores natural law; giver of `profession_bell_paid_in_silence` | **[PROPOSAL]** Quest-state visit at the covered F01 briefing pocket, entering from C01 and never occupying the charge path or molten floor | Accepted master `assets/characters/npcs/lucent-synod/deacon-halix-bell-of-noon-v2.png`; no cutout, static model, or animated model is declared |
| Ader Coil / `ader_coil_deaf_bellwright` | **[CANON]** Hollow Abbey artisan restoring silence as paid and revocable labor; supporting actor for `profession_bell_paid_in_silence` | **[PROPOSAL]** Quest-state work route between F04's blackwater sightline, the protected F02 control edge, and F05; all decisions remain readable as Ader's own visible acts | `awaiting-art`; concept master, cutout, static model, and animated model are absent/unassessed |
| Pera Knell / `pera_knell_architect_word_before` | **[DESIGN CONSTRAINT]** Karst architect who uses pre-echoes to predict Hollow Abbey collapses; supporting actor and participant in `regional_an_echo_arrived_first`; her confession must occur before entry | **[PROPOSAL]** P07 entry/confession pocket, then delivery and monitoring loop between the urn, four frames, roof/crypt access, and refuge; keep her outside active counterweight sweep | Accepted manifest pipeline is `awaiting-art`; concept master, cutout, static model, and animated model are absent/unassessed |
| Parn Exit-Law / `parn_exit_law` | **[CANON]** Sanctuary jurist born with a rib door that opens only outward; **[DESIGN CONSTRAINT]** returning participant in `regional_an_echo_arrived_first` | **[PROPOSAL]** Quest-state return/egress audit between P07 refuge and the two independent exits; do not turn the rib door into a generic key or route portal | Accepted master `assets/characters/npcs/charnel-households/parn-exit-law-v1.png`; no cutout, static model, or animated model is declared |
| Wound-Scribe Keth / `wound_scribe_keth` | **[CANON]** Archivist who records history as reversible injuries; **[DESIGN CONSTRAINT]** giver of `regional_an_echo_arrived_first`, but not one of that quest's accepted `participantCharacterIds` | **[OPEN/PROPOSAL]** Default to an off-site or remote quest offer. Do not spawn Keth at P07; on-site staging requires a later explicit placement/participant packet | Accepted master `assets/characters/npcs/charnel-princes/wound-scribe-keth-v1.png`; no cutout, static model, or animated model is declared |

### 14.2 Routine collision rules

**[PROPOSAL]** Only Nhal is guaranteed a base threshold role. Other founding-cast characters and quest-bound visitors may be present according to quest state, but no social pocket should host more than three simultaneous primary conversations. Keep I01, V01, R01, F01, and the P07 refuge as separate acoustical/social cells so quest dialogue does not stack in one nave hub.

**[PROPOSAL]** Two linked founding-cast pairs should occasionally cross in visible work rather than idle together: Moira/Mott at archive-intake transfer and Aven/Netta at the reliquary service route. Halix/Ader and Pera/Parn occur only in their quest overlays. Nhal/Alda and Iven/Ysra relationships exist beyond the founding eight-character site set; do not instantiate off-site characters without a specific quest placement.

**[PROPOSAL]** NPC route transitions must use doors, stairs, or sightline breaks. No named NPC teleports across the nave while visible. During dangerous phase changes, NPCs withdraw along the same readable refuge routes available to the player unless a quest explicitly establishes an exception.

## 15. Player-scale traversal, combat, and quest staging

### 15.1 Traversal dimensions

**[PROPOSAL]** These are graybox targets, not code or accessibility certification:

- critical two-way route: target 2.4–3.2 m unobstructed;
- exploration route: target 1.6–2.2 m, with frequent camera recovery bays;
- social/interaction pocket: target 8–14 m clear depending on party framing;
- large-form encounter lane: target at least 10–13 m clear with a full walk-around path;
- upper ledge: target 2.2–3.2 m clear plus solid visual fall boundary;
- door/gate: visibly sized for player, companion, and carried relic route; exact collision values remain implementation-owned;
- combat recovery: at least two exits or one exit plus a fully readable safe flank; no boss-scale entity in a one-route pinch.

### 15.2 Encounter pockets

| Pocket | Spatial question | Supported family/quest | Failure to avoid | Authority |
|---|---|---|---|---|
| P02 stair pressure | Direct climb or high-loop reconnaissance? | Hush/Bell event; arrival quests | Archers or controllers with no lateral relief | Proposal |
| N01 central pocket | Hold spine, divert to aisle, or gain upper route? | Hush Monk main objective | Repeated pew cover and three indistinguishable lanes | Proposal grounded in core quest |
| N04 crossover | Which rejoin stays safe as cadence changes? | Hush specialists | Doorway body-blocking and unreadable off-camera hits | Proposal |
| Q01 urn field | Which voice-bearing urn is physically relevant? | Echo Choir; Cantor preparation | Decorative urn spam, hidden interactables, all pitches sounding alike | Proposal grounded in canon fight text |
| K01 descent | Commit downward with destination visible? | Ossuary preview / route-state change | Blind stair ambush and submerged steps | Proposal |
| B01 Last Bell vault | Break voice sources, read Cantor, preserve exit | Cantor Oss boss | Arena clutter hiding urns or boss silhouette | Proposal grounded in canon counterplay |
| F02 foundry | Respect heat/process order while reading seven social rooms | `Bell Paid in Silence` | Generic lava room or funeral route crossing molten floor | Proposal grounded in accepted quest/building constraint |
| P07 cause frames | Diagnose a real structural cause under time | `An Echo Arrived First` | Four equivalent switches with renamed labels | Proposal grounded in accepted quest constraint |

### 15.3 Core main-quest flow

**[CANON]** `main_a_litany_unspoken` follows this order: interact with the Abbey gate; defeat five Hush Monks; discover the Crypt of the Last Bell; defeat Cantor Oss; interact with the Memory Clapper. Nhal states that the seal commands opening while mercy asks otherwise, and that Cantor Oss feeds the Bell names. The Clapper contains thousands of names and offers remember or release.

**[PROPOSAL]** Stage the steps spatially:

1. G01 handles the gate interaction with Nhal offset from clearance.
2. N01/N02/N03/N04 form a five-defeat ecology that can vary composition and position without becoming five copies of one arena.
3. Q01 frames the black K01 descent from the main lane; crossing the threshold satisfies discovery only when the canonical trigger says so.
4. B01 gives Cantor Oss and voice-bearing urns distinct access lanes; breaking urns is spatially intelligible.
5. M01 separates the memory choice from active boss cleanup and shows both the backward B01 route and sealed-or-released M02 threshold from the decision position.
6. The completed Clapper choice permanently releases M02 to N06, creating a phase-stable return that cannot bypass the canonical objective order and does not change destination during `absolute_silence`.

**[CANON]** The Cinder Seal or Rusk progression opens access. The Last Bell choice is unavailable until prior objectives and Cantor defeat are complete. Remember grants focus and clay tokens; release grants stamina and vow threads.

**[PROPOSAL]** Represent remember/release aftermath through a compact set: clapper pose, local tablet/cord distribution, an audio-tail rule, one worker route, and one later interaction state. Do not duplicate the entire Abbey into two maps.

## 16. Quest and environment crosswalk

| Quest / program | Current narrative truth | Precinct requirement | Persistent environmental delta | Placement boundary |
|---|---|---|---|---|
| `main_a_litany_unspoken` | Gate → five Hush Monks → crypt → Cantor Oss → Memory Clapper | G01, nave lanes, visible K01, B01 urn counterplay, M01 choice pocket | Gate state, Cantor/urn aftermath, clapper state, later route/worker cue | **[CANON]** Hollow Abbey; geometry proposal |
| `Rain in an Empty Helm` | Nhal may be freed as rain, renew oath, or receive a shadow | Rain-visible P05/C01 plus private decision framing | Armor/rain/shadow relation and route change | **[CANON]** Nhal quest; exact placement proposal |
| `Promises Without Makers` | Expose fraudulent vows, preserve useful vows, or write a new vow | Three independent evidence stations in V01/N05 | Which thread/board stations remain active and Moira's routine | **[CANON]** Moira quest; exact placement proposal |
| `The Voluntary Erasure` | Reject, offer a memory, or restore Seln's erased name | E01 witness/refusal geometry with Gate sightline | Clause-frame state and Seln route/recognition | **[CANON]** Seln quest; exact placement proposal |
| `A Tongue Regrown` | Let Iven speak, remove the tongue, or use the gift | I01 consent/treatment cell plus controlled Q01 proximity test | Screen arrangement, bell-distance routine, conversation mode | **[CANON]** Iven quest; exact placement proposal |
| `The Informing Tongue` | Destroy, reunite, or feed false words to Aven's informing echo | N06 crate evidence and authored Echo-safe test location | Echo relation and Aven route; no universal site rewrite | **[CANON]** Aven quest; exact placement proposal |
| `The Cartographer Outside Himself` | Retrieve Elo's body, stabilize projection, or trade | X01 mutable destination cell with stable emergency egress | Which Elo anchor persists; door state; route evidence | **[CANON]** Elo quest; X01 proposal |
| `Saint Nobody's Bones` | Unmake, legitimize, or return mixed relics | R01/N06/O01 chain of three distinct custody contexts | Shelf grouping, miracle evidence, Mott/Moira transfer | **[CANON]** Mott quest; exact placement proposal |
| `A Reliquary That Walks` | Free Netta legally, remove bone bells, or claim sacred-property status | Person/object-width intake, legal gate exit, private bell-removal cell | Gate recognition, bell state, inspection routine | **[CANON]** Netta quest; exact placement proposal |
| `profession_bell_paid_in_silence` | Foundry work and seven social silence rooms; silence is wage/debt; Deacon Halix is giver and Ader Coil is supporting actor | F01–F07 entire operational graph, simultaneous room sightline, safe funeral route, quest-scoped Halix/Ader staging | Creditor cracks, wage archive, room occupancy, funeral path | **[CANON/DESIGN CONSTRAINT]** Quest/actor relations and Hollow foundry program; exact staging proposed |
| `regional_an_echo_arrived_first` | Effect arrives before cause; Pera confesses before entry; Pera and returning Parn are accepted participants; Keth is giver but not a participant; `foreword_cantor` is the bound creature; the drain outcome carries downstream flood duty | P07 cause-frame yard, antecedent urn, four unequal load responses, Foreword encounter, local below-crypt receptor, live roof/crypt/drain/service routes, refuge, and two exits | Branch-specific retaining-face and route/audio/maintenance mutation; `drain_cause_built_with_downstream_flood_duty` preserves local monitoring/duty without linking Abbey Sink | **[DESIGN CONSTRAINT]** Accepted program and roster; exact staging/receptor geometry proposed; Keth's on-site presence **[OPEN]** |
| `main_the_saint_cast_two_shadows` | Vespera processional ruin, two shadow lanes, three witnesses, halo nail, asylum route | If placed near Hollow later, author a distinct ruin and route; do not consume G01/N01 by default | Witness/shadow/asylum path delta | **[OPEN]** Exact atlas placement provisional; not core Abbey |
| `main_parliament_of_one_mouth` | Mute amphitheatre, thirteen voice positions, rest center, ballot exit, external auditor ring | Separate amphitheatre typology and egress audit | Ballot/voice position aftermath | **[OPEN]** Not silently merged into nave |
| `faction_heresy_gentle_horizon` | Cathedral of Six Rehearsed Dawns, six refusal bays, Liora/Oculus/witness/service-dark routes | Separate cathedral program with Lucent visual law | Refusal/witness/service route state | **[OPEN]** No current authority places it in core precinct |
| `character_saint_cannot_inherit_body` | Mortal estate in Vespera's veil, four probate rooms/sense routes | Separate estate interior, not repurposed Abbey archive | Probate/sense-route outcomes | **[OPEN]** Do not place in V01 by convenience |
| `main_archive_of_open_wounds` | March/Abbey-margin possibility in current planning | Reserve regional margin only after atlas decision | Future state | **[OPEN]** Not assigned to precinct |
| Pale Measure programs | Separate `site.pale-measure` exists in canonical atlas | Build as its own site envelope | Site-owned | **[CANON/OPEN]** Never collapse into O02 merely because themes overlap |

### 16.1 Future quest sockets without copy-paste

**[PROPOSAL]** New quests may use the precinct only when they select a unique combination of:

- a specific work system (gate wording, rain handling, urn pitch, vow custody, treatment, person/object intake, ossuary interval, silence wage, foundry cooling, root tending);
- a physical contradiction that can be inspected in-world;
- a named character or newly canonical character with a personal stake;
- a distinct traversal topology or state mutation;
- a choice whose costs land on different people or systems;
- a persistent, bounded environmental consequence.

**[PROPOSAL]** Reject a quest pitch if its environment could be replaced by “collect three objects in three side rooms,” if its three choices are palette swaps, if its antagonist could be any family, or if its aftermath resets the exact work system that the quest claimed to change.

## 17. Landmarks, wayfinding, and environmental storytelling

### 17.1 Landmark hierarchy

| Range | Landmark | Read | Authority |
|---|---|---|---|
| Regional | Broken high nave/vault mass against ash veil | Destination silhouette; no final tower count asserted | Art reference + proposal use |
| Approach | Gate of Exact Words | Mandatory threshold and Nhal's rain silhouette | Canon |
| Exterior loop | Gold-lichen coping / high retaining arch | Exposed optional high route and return | Proposal |
| Interior macro | Mute Nave axial void | Central spine and comparative height | Canon identity + art reference |
| Interior route | Wet bronze inlay vs cracked choir tile | Spine versus side loops; pair color with texture and geometry | Design constraint + proposal coding |
| Danger | Black crypt descent | Cold, low-reflectance continuation visible from main lane | Canon/design constraint |
| Deep destination | Last Bell mass / clapper chain | Boss destination then memory choice | Canon artifacts + proposal framing |
| Industrial | Foundry casting lantern and seven-baffle silhouette | Separate work complex, not another chapel | Design constraint |

### 17.2 Wayfinding grammar

**[PROPOSAL]** Use at least two cue channels for every critical route:

- central quest spine: bronze inlay continuity plus long axial void;
- side loops: cracked choir-tile rhythm plus lower arch repetition;
- upper loop: pale coping, gold rain lichen, and upward rain exposure;
- archive/hearing: linen, blank profile boards, dry acoustics;
- infirmary: pale screens, low ceiling, clean basin silhouette;
- reliquary/ossuary: drawer depth and object-width thresholds;
- crypt: black stone, temperature/light drop, vertical draw;
- foundry: soot gradient, damper frames, furnace bounce;
- safe social pocket: uncluttered perimeter, stable light, no hostile habitat evidence.

No route may depend on hue alone. Avoid floating arrows, repeated braziers at intersections, readable wall labels, or identical saint statues as navigational pins.

### 17.3 Evidence layers

**[CANON]** The founding clergy removed tongues; the chapter is absent; the nave is empty while the crypt is occupied; names feed the Last Bell; vows, relic classification, memory, and mercy are actively disputed.

**[PROPOSAL]** Express those facts through five evidence layers:

1. **Institutional intent:** exact-word frames, interval drawers, resonant urn stations, archive positions, and silence rooms are ordered and repeatable.
2. **Physical cost:** tongue-reliquary voids, worn hand-sign sightlines, kneeling wear, sealed wash, and inaccessible old stalls show what procedure demanded.
3. **Survival adaptation:** basin hooks, dry work islands, repaired cords, mapped safe routes, and mismatched braces show current people keeping the ruin useful.
4. **Contradictory record:** blank tags that do not fit, three different custody chains, a drawer interval interrupted by one body-scale error, and a vow board with visible removal scars create investigable inconsistency without readable exposition.
5. **Aftermath:** each major quest changes one object state, one route or routine, one sensory response, and one witness behavior. The rest of the base set remains stable.

### 17.4 Artifact placement

| Artifact | Established role | Proposed placement / presentation | Constraint |
|---|---|---|---|
| Cinder Seal | Opens Abbey progression | G01 receiving notch with Nhal sightline | Do not reduce to generic keyhole or claim new inscription |
| Last Bell Tongue | Core reward/ending-linked item | B01/M01 secured aftermath pickup or quest-authored handoff | Final form follows item art/data, not this room sketch |
| Clapper of Names / Memory Clapper | Holds thousands of names; remember/release interaction | M01 with walk-around decision space and visible exit | No readable name wall required; names may remain system/audio-owned |
| Resonant urns | Voices/pitches, Cantor counterplay, site practical | Q01/N05/B01 in discrete functional clusters | Each combat-relevant urn distinguishable by position/form; no identical prop spam |
| Empty tongue reliquary | Site prop family and founding evidence | N06/V01 transition | Empty is meaningful; do not fill for visual richness |
| Vow-thread loom | Site prop family and Moira/Seln work | V01, with dry access and multiple evidence outputs | No readable text baked into thread pattern |
| Memory tablets | Site prop family | M01/O01 transfer shelves | Blank or abstract profiles until localization/content owns text |
| Great clapper chain | Site prop family | B01-to-M01 vertical load-path landmark | Animation/physics unverified |
| Wage clapper / tokens | Foundry quest economy | F05 with view back to F03 rooms | Do not imply ordinary coin wage unless quest data says so |
| `antecedent_urn` | Holds a pre-echo long enough to build an alternate cause and accepts real load | P07 protected diagnostic station | Must not be a decorative clue dispenser; carries world debt |
| `cause_load_urn_set` | Four unequal cause options | Distributed among the four physical P07 response paths | Labels cannot substitute for different loads and paths |
| Black halo nail | `Saint Cast Two Shadows` program | Keep with its separate Vespera ruin packet | Not base Abbey decoration |
| Thirteenth ballot | `Parliament of One Mouth` program | Keep with separate amphitheatre packet | Not archive clutter |
| Bifurcated estate key | `Saint Cannot Inherit Body` program | Keep with separate estate packet | Not an Exact Word gate key |
| Indulgence of the Uncrossed Horizon | `Gentle Horizon` program | Keep with separate Lucent cathedral packet | Not Hollow Abbey doctrine by association |

## 18. Art-reference manifest and limits

### 18.1 Accepted environment direction

| Path | Verified repository record | Binding use | Explicit nonbinding elements |
|---|---|---|---|
| `assets/world/hollow-abbey-nave.png` | 1672 × 941; SHA-256 `d79488872142049443b55ef98532470d632dba9bd9ae5e90ba02bd8403e7bc3b` | Regional palette, wet material, weather, axial nave grandeur, urn mass, upper-gallery and black-descent mood | Exact layout, apparent dimensions, figures, route collision, final architecture |
| `assets/world/hollow-abbey-processional-west-arrival-v1.png` | 1536 × 1024; SHA-256 `e10cf6c4e1469d23f49f0fc38ebb49d0dad51f490b1f8bf23c1c2e82ced72e29` | Supplemental west arrival; central gate stair; high loop/rejoin; lower onward read; dry-karst/no-stream policy | Facade, circular opening, towers, stair count, exact terrain, dimensions, production geometry |
| `assets/world/hollow-abbey-mute-nave-route-read-v1.png` | 1536 × 1024; SHA-256 `2e5582779702fed33fef3ee092f109a0c39403431752f11c22bbad95b7288826` | Player-height off-axis route accountability; central spine; both side loops; upper ascent/return; urn-edge cover; distinct black crypt descent | Exact stair/pit/inlay layout, dimensions, topology beyond documented goals, collision, final props |
| `assets/world/hollow-abbey-rain-court-work-nexus-v1.png` | 1536 × 1024; SHA-256 `a5e5ae1dfe2ec15a7f17f649356404f4f276ba8db89bcdd07bc2273cd555b074` | Player-height deep-gate view; four-way Rain Court route hierarchy; nonblocking Nhal staging; shallow local drainage; maintenance evidence | Exact architecture, measurements, GIS placement, drain behavior, final Nhal construction/VFX, collision, runtime integration, production geometry |
| `assets/world/hollow-abbey-foundry-operational-chain-v1.png` | 1536 × 1024; SHA-256 `a4b6c7ee808befc1ac6b1adfefa1a801c4e5d5fe48e71e42e1820c789a48b1bc` | Player-height F01–F08 operational-chain read; seven simultaneous silence-room bays; blackwater ripple sightline; funeral bypass; rain-open seven-baffle lantern; worker clearance, repair, and weathering | Exact room geometry/adjacency, measurements, GIS/atlas placement, hydrology capacity, furnace/quench safety, structure/construction, collision/navigation, lighting/VFX, runtime, static/animated scene readiness, production geometry |

**[ART REFERENCE]** The four supplemental images are accepted and registered in the current world records. Their redacted prompt/provenance packets are `assets/world/prompts/world-environments.current.batch-03.prompt-packets.json` with `assets/world/world-environments.current.batch-03.provenance.json`, `assets/world/prompts/world-environments.current.batch-04a.prompt-packets.json` with `assets/world/world-environments.current.batch-04a.provenance.json`, and `assets/world/prompts/world-environments.current.batch-04b.prompt-packets.json` with `assets/world/world-environments.current.batch-04b.provenance.json`.

### 18.2 Family silhouette references

| Family | Plate | Binding use | Do not infer |
|---|---|---|---|
| Hush Order | `assets/bestiary/hush-order-plate.png` | Closed-loop cord skeleton, empty stitched shell/veil, family materials and finish | Ordinary human monk anatomy; exact individual form anatomy |
| Echo Choir | `assets/bestiary/echo-choir-plate.png` | Bodyless bronze-mouth / violet-black resonance grammar | Generic robed ghost; every form as same crescent |
| Ossuary Vermin | `assets/bestiary/ossuary-vermin-plate.png` | Communal borrowed-bone assembly, mold/ligament mechanics | Ordinary skeleton, random bone pile, universal plate limb count |
| Bell Revenants | `assets/bestiary/bell-revenants-plate.png` | Verdigris bell-cavity armor, rope/bell material family | Normal knight in bell-themed armor; exact form scale |
| Charnel Measures | `assets/bestiary/charnel-measures-plate.png` | Right-angled ivory cabinet/measuring anatomy | Generic demon, final room scale, exact form rig |
| Pallid Root Communion | `assets/bestiary/pallid-root-communion-plate.png` | Root-woven cadaver collective beneath fungal/root canopy | Generic zombie or roots spread across every room |

**[ART REFERENCE]** Plates are family grammar only. Individual concept masters and canonical form data override representative plate anatomy.

### 18.3 Named-character references

| Character | Master | Transparent cutout | Current model claim |
|---|---|---|---|
| Gatewarden Nhal | `assets/characters/npcs/exact-word/nhal-without-shadow-v1.png` | `assets/characters/npcs/exact-word/nhal-without-shadow-v1-cutout.png` | Generic-rig classification only; no verified subject static/animated model |
| Moira Quiet | `assets/characters/npcs/exact-word/moira-quiet-v1.png` | `assets/characters/npcs/exact-word/moira-quiet-v1-cutout.png` | Same |
| Seln Clause | `assets/characters/npcs/exact-word/seln-clause-v1.png` | `assets/characters/npcs/exact-word/seln-clause-v1-cutout.png` | Same |
| Brother Iven | `assets/characters/npcs/exact-word/brother-iven-v1.png` | `assets/characters/npcs/exact-word/brother-iven-v1-cutout.png` | Same |
| Aven Tongueless | `assets/characters/npcs/exact-word/aven-tongueless-v1.png` | `assets/characters/npcs/exact-word/aven-tongueless-v1-cutout.png` | Same |
| Elo Veer | `assets/characters/npcs/unwritten-roads/elo-veer-v1.png` | `assets/characters/npcs/unwritten-roads/elo-veer-v1-cutout.png` | Same |
| Mott Vane | `assets/characters/npcs/grave-tithe/mott-vane-v1.png` | `assets/characters/npcs/grave-tithe/mott-vane-v1-cutout.png` | Same |
| Netta Aster | `assets/characters/npcs/grave-tithe/netta-aster-v1.png` | `assets/characters/npcs/grave-tithe/netta-aster-v1-cutout.png` | Same |

**[ART REFERENCE]** These masters control subject costume, carried-prop language, material, and silhouette until a later accepted turnaround or model packet supersedes them. A posed master is not proof of bone hierarchy, garment simulation, attachment sockets, or animation range.

## 19. Model, animation, LOD, and streaming handoff

### 19.1 Environment kit decomposition

**[PROPOSAL]** Build reusable modules by structural reason, not by arbitrary two-meter grid alone:

- limestone bay: intact, cracked, braced, open-roof, and crypt-transition variants;
- aisle arch: open, screened, collapsed-but-traversable, and sealed variants;
- upper-cloister segment: safe parapet, damaged parapet, widened recovery bay, stair landing;
- gate kit: outer frame, inner frame, blank clause plate profiles, cord tension assembly, seal receiver, open/closed state;
- urn kit: at least four body proportions, three bases, service lid, rail mount, damaged state; combat-relevant urns receive unique semantic anchors;
- ossuary kit: interval drawer banks, sorting trestle, sealed wash, breached bank, body-scale anomaly frame;
- rain kit: basin, hook, shallow gutter, local drain, grate, dry-island edge, blocked state;
- foundry kit: silence frame, furnace/damper, mold pit, quench tray/tank, ripple witness rail, wage drawers, cooling rack, funeral door;
- work props: vow-thread loom, empty tongue reliquary, rotted stalls, prayer board with no baked text, memory tablets, Cantor music stand, clapper chain.

**[PROPOSAL]** Each modular piece should carry semantic sockets for wetness, dust, lichen/moss, damage, interaction, audio, and phase delta. Socket existence is a handoff request, not a claim that the runtime schema already implements it.

### 19.2 Existing prototype geometry

**[NONCLAIM]** The following repository GLBs are prototype geometry proxies. They can accelerate composition tests but do not establish final silhouette, scale, collision, materials, or art approval:

- `assets/3d/runtime/bridge/hollow-abbey/hollow-rootbound-arch.glb`
- `assets/3d/runtime/bridge/hollow-abbey/hollow-ossuary-column.glb`
- `assets/3d/runtime/bridge/hollow-abbey/hollow-sunken-stair-vault.glb`
- `assets/3d/runtime/bridge/hollow-abbey/hollow-gravewax-stand.glb`
- `assets/3d/runtime/bridge/hollow-abbey/hollow-silent-reliquary-box.glb`
- `assets/3d/runtime/bridge/hollow-abbey/hollow-root-signal-basin.glb`
- `assets/3d/runtime/bridge/hollow-abbey/hollow-bone-dust-sieve.glb`
- `assets/3d/runtime/bridge/hollow-abbey/hollow-sealed-name-shelf.glb`
- `assets/3d/runtime/bridge/hollow-abbey/hollow-pallid-root-mat.glb`
- `assets/3d/runtime/bridge/hollow-abbey/hollow-cave-fern-wheel.glb`
- `assets/3d/runtime/bridge/hollow-abbey/hollow-fungal-thread-cluster.glb`
- `assets/3d/runtime/bridge/hollow-abbey/hollow-echo-vault-descent.glb`

**[DESIGN CONSTRAINT]** Their prototype pack metadata uses material IDs `pale-karst-stone`, `root-stained-mortar`, and `gravewax-bronze`, and pack-local LOD thresholds at 28 m, 64 m, and 160 m.

**[OPEN]** Those pack-local thresholds do not match the broader world streaming rings below. Do not silently relabel one as the other. Technical art must explicitly reconcile or regenerate LOD metadata before production integration.

### 19.3 Environment motion systems

**[DESIGN CONSTRAINT]** The environment registry calls for roof rain, delayed returns, eclipse shafts, urn resonance, pressure zones, and an upper route.

**[PROPOSAL]** Provide separately controllable systems:

- roof-rain emitters keyed to actual roof wounds and local catch surfaces;
- delayed impact/ring response keyed per architectural volume, not one global delay;
- eclipse shafts with bounded dust/rain intersection volumes;
- urn resonance with per-urn semantic source and a visual accessibility channel;
- still-pressure volumes with restrained refraction/dust behavior and explicit combat ownership;
- cloth/cord movement driven by exposure and nearby motion, not a universal wind loop;
- clapper chain, gate frames, foundry dampers, and basin placement as stateful mechanical animation candidates.

### 19.4 Character and creature animation notes

**[PROPOSAL]** Named-character animation priority is occupational action before generic idle: Nhal's rain/empty-armor response; Moira's tag and archive handling; Seln's exact plate placement; Iven's treatment and listening; Aven's manual communication; Elo's plumb-line mapping and route-bound projection; Mott's custody sorting; Netta's controlled bone-bell secondary motion and case handling.

**[PROPOSAL]** Family locomotion must follow individual canonical data. At family level only:

- Hush forms preserve continuous cord/shell logic and must not bend like ordinary robed bipeds by default;
- Echo forms animate source/response timing and bodyless resonance, not cloth-ghost locomotion;
- Ossuary forms transfer load through visibly assembled borrowed parts;
- Bell Revenants integrate cavity, rope, clapper, and displaced toll timing;
- Charnel Measures preserve right-angled measuring/cabinet load paths;
- Pallid Root forms transmit tension through root networks and canopy mass.

**[NONCLAIM]** No skeleton, retarget map, cloth setup, physics rig, facial rig, animation clip, static character mesh, or animated character mesh is verified by this dossier.

### 19.5 Streaming and LOD

**[DESIGN CONSTRAINT]** The broader world contract uses 512 m atlas macro partitions, 32 m site chunks, and 16 m interior cells. Its LOD rings are: LOD0 gameplay 0–42 m, LOD1 site 42–128 m, LOD2 landmark 128–384 m, and LOD3 atlas beyond 384 m.

**[PROPOSAL]** Suggested cell ownership:

- arrival P01–P05: two-to-four site chunks so high-loop return and Gate state can pin together before first reveal;
- nave N00–N04: stable base shell across adjacent chunks, with interior cells for north/south/social rooms;
- urn/crypt Q01–M01: separate deep-interior group pinned before K01 sightline opens;
- foundry F01–F08: separate group, with all seven silence rooms and worker exits pinned together whenever F02 is visible;
- C02/O02 ecology: optional/revisit cells streamed as phase deltas, never replacements for the base shell.

**[DESIGN CONSTRAINT]** Quest outcomes should stream as compact state deltas over a stable base set. Navigation, collision, audio, scent, light, and population deltas share one phase identifier. Critical set-piece actors, exits, and fail-forward evidence are pinned before their approach sightline opens.

**[DESIGN CONSTRAINT]** Current high-quality ceilings are 700 visible draw calls, 18 dynamic lights, 2400 active particles, and 14 simultaneous ambient voices. Texture targets are 1024 texels/m for hero, 512 for standard, and 256 for background; prop triangle targets are 48,000 hero, 12,000 standard, and 2,800 minor.

**[NONCLAIM]** These are inherited planning ceilings, not measured Hollow Abbey performance. The dossier does not assert that current art, proxy GLBs, proposed cell breaks, lights, particles, or audio meet them.

### 19.6 Required model-handoff metadata

**[PROPOSAL]** Every delivered environment asset should declare:

- stable repository path and semantic asset ID;
- zone/room ownership and allowed reuse zones;
- authoritative reference path(s) and what each reference controls;
- dimensions, pivot, forward/up conventions, and intended scale confidence;
- LOD availability and which threshold contract it follows;
- collision/nav intent as `unassessed`, `proxy`, or `reviewed`, never implied;
- material slots and wet/dry/dust/root/soot masks;
- phase/state variants and whether they are mesh, material, VFX, audio, or transform deltas;
- interaction, audio, VFX, creature, and NPC sockets;
- forbidden reuse, especially safe cells and non-habitat surfaces;
- maturity tier and reviewer acceptance.

## 20. Blockout deliverables for Claude Design

**[PROPOSAL]** Deliver the precinct in reviewable slices. Each slice should be small enough to reject without invalidating unrelated work.

1. **Terrain and route skeleton:** P01–P06, local frame, sightline shelves, high-loop rejoin, P06 stateful outbound edge with its G01 relation marked **[OPEN]**, no watercourse/bridge.
2. **Gate and rain court:** G01/C01, Nhal conversation clearance, exact-word state silhouettes, local drains.
3. **Mute Nave circulation:** N00–N04/U01–U03, central/side/upper loops, two rejoin points, player-height route cameras.
4. **Work cells:** V01/E01/I01/R01/N05/N06 with founding-eight routine markers and safe-cell boundaries.
5. **Urn/crypt sequence:** Q01/K01/O01/B01/M01/M02, pitch stations, black descent, Cantor urn access, memory-choice separation, and the state-tested N06 return.
6. **Foundry quest overlay:** F01–F08, seven rooms in one supervisory read, closed quench circuit, funeral route, and separate Halix/Ader staging markers.
7. **Cause-frame quest overlay:** P07, Pera threshold/confession marker, Parn refuge/egress marker, Keth marked off-site/**[OPEN]**, Foreword Cantor encounter volume, four unequal branches, two egresses, and a bounded below-crypt karst receptor with no Abbey Sink link.
8. **Ecology/revisit edges:** C02/O02 plus family habitat volumes, the quest-bound Foreword habitat, and strict exclusions.
9. **Phase pass:** four activity phases as state deltas; preserve exits and route legibility.
10. **Sensory/accessibility pass:** physical sound sources, visual equivalents, lighting hierarchy, VFX ownership.
11. **LOD/streaming proxy:** cell boundaries, pinning tests, budget instrumentation, explicit pack/world LOD reconciliation.

**[PROPOSAL]** Each slice review should include: overhead blockout image; two player-height route images; one state-change comparison; nav/collision status labels; source/reference list; unresolved assumptions; and a no-hydraulic-connection check where rain or foundry water appears.

## 21. No-invention and nonclaims register

The following guardrails are binding for work derived from this dossier:

1. **[NONCLAIM]** This document creates no new canonical faction, deity, saint, creature form, named character, quest outcome, historical date, doctrine, settlement, or artifact.
2. **[NONCLAIM]** Proposed room codes, local coordinates, dimensions, schedules, evidence placement, and routine routes are blockout scaffolds. They become authoritative only through a later accepted data/design change.
3. **[NONCLAIM]** “Prototype playable,” “blockout ready,” or the presence of a GLB does not mean production geometry, production materials, collision, navmesh, animation, or performance is complete.
4. **[NONCLAIM]** Accepted concept art controls only its documented visual role. Apparent figures, architecture, scale, lighting rigs, or routes are not automatically canon.
5. **[NONCLAIM]** The Hush Order is not permission to place ordinary hooded human monks. Echo Choir is not permission to place robed ghosts. Ossuary Vermin is not permission to place generic skeletons. Charnel Measures and Pallid Root Communion are not generic demon/zombie sets.
6. **[NONCLAIM]** Abbey Sink is off-precinct. Hollow Abbey has no authorized Sink bridge or hydraulic connection. Outside the P07 quest overlay, rain, wells, quench, and the Sink remain separate systems. P07 alone may connect its staged drain branch to a bounded local below-crypt karst receptor; no authority connects that receptor to Abbey Sink or `stream.abbey-sink`.
7. **[NONCLAIM]** The Pale Measure, Mute Amphitheatre, Vespera processional ruin, Cathedral of Six Rehearsed Dawns, and mortal estate are not rooms inside Hollow Abbey merely because their themes overlap.
8. **[NONCLAIM]** Lucent Synod and Charnel Night visual grammar does not overwrite the base Hollow Abbey kit. Add it only through a quest packet with location and state authority.
9. **[NONCLAIM]** No baked readable text, real-world religious mark, modern UI symbol, external provider locator, workstation path, user identity, or private provenance belongs in public environment art or model metadata.
10. **[NONCLAIM]** This dossier does not certify real-world architecture, engineering, drainage, occupational safety, GIS accuracy, accessibility compliance, combat balance, or runtime determinism.

## 22. Open decisions and promotion gates

| Open decision | What may proceed now | What must wait |
|---|---|---|
| Exact site rotation/elevation | Relative route/room blockout in local frame | Atlas-authoritative placement and terrain stitching |
| Surviving bay/story count | Massing variants within typology envelope | Final facade and structural-history claim |
| Foundry position | Separate adjacency and graph blockout | Final foundation/hydraulic/service route |
| P06 relation to G01 | Build and test the stateful outbound edge with both relations clearly labeled | Claim that the Exact Word gate locks, unlocks, or bypasses `route.processional-steps.section.02` |
| P07 karst receptor | Block a bounded local below-crypt receptor, monitoring position, and branch-specific flood-duty evidence | Final outlet/recharge, capacity, engineering adequacy, or any link to Abbey Sink |
| Safe-cell roster | Mark candidate social cells and family exclusion volumes | Spawn/population implementation |
| Elo's mutable door behavior | X01 two-threshold graybox and fail-safe exit | Runtime destination logic and outcome persistence |
| Last Bell final silhouette | Boss-scale volume, chain/clapper sockets, visibility tests | Final Bell model and animation |
| Expansion-site placement | Keep route stubs and separate packets | Merge into precinct or atlas without explicit authority |
| NPC models | Use indexed masters/cutouts and generic proxy rigs | Claim subject-specific static/animated readiness |
| Prototype bridge GLBs | Composition and scale experiments with clear proxy label | Production acceptance or silent LOD migration |
| Text/localization | Blank plates and text-safe surfaces | Readable doctrine, names, labels, or embedded language |

**[PROPOSAL]** Promote a precinct proposal only when its source boundary is documented, relevant quest and habitat data agree, two player-height route reads pass, no-hydraulic separation passes, safe-cell exclusions pass, art references are used within their stated roles, and model/runtime maturity is recorded honestly.

## 23. Final self-review checklist for each world submission

- [ ] Canon, design constraint, derived fact, proposal, art reference, open issue, and nonclaim are not blended without labels.
- [ ] Gate of Exact Words, Mute Nave, Crypt of the Last Bell, and Clapper of Names remain the landmark spine.
- [ ] Central, both side-aisle, upper-cloister, and crypt routes are readable and have the required rejoin/visibility behavior.
- [ ] P06 preserves bidirectional onward-route continuity as a stateful edge, and its relation to G01 remains visibly **[OPEN]** rather than invented.
- [ ] M02 is visibly sealed before the Clapper choice, permanently rejoins N06 afterward, and remains a fixed passable return during `absolute_silence`.
- [ ] Foundry receiving, molten floor, all seven silence rooms, ripple gallery, wage archive, cooling vault, and funeral exit remain legible.
- [ ] Funeral route does not cross the molten floor.
- [ ] Base roof rain is shallow and locally terminated; karst bell wells, foundry quench, P07's quest-scoped receptor, and Abbey Sink obey their explicit boundaries.
- [ ] P07 preserves the below-crypt `karst_flood` hazard and `drain_cause_built_with_downstream_flood_duty` without creating a precinct bridge, surface stream/canal/river, unauthorized deep flood, or Abbey Sink connection.
- [ ] Nhal, Moira, Seln, Iven, Aven, Elo, Mott, and Netta each have a route, work action, conversation pocket, and quest-compatible state as the founding site cast.
- [ ] Halix/Ader and Pera/Parn use separate quest-bound overlays; Keth remains off-site unless explicit on-site participant authority is added.
- [ ] Primary creature families occupy distinct habitats; secondary/revisit families obey their envelopes; all settled safe cells exclude hostile forms unless explicitly phased.
- [ ] `foreword_cantor` uses its accepted cause-frame habitat, encounter cue/counterplay, refuge, and egress contract and is not substituted for Cantor Oss or ambient Echo population.
- [ ] Hush, Echo, Ossuary, Bell, Charnel, and Root silhouettes follow family and individual art/data rather than generic enemy archetypes.
- [ ] Every critical audio cue has a visual or physical companion; absolute silence does not erase essential player feedback.
- [ ] Environmental artifacts expose a work system or contradiction; they are not decorative lore clutter.
- [ ] Every quest use produces a bounded, persistent environmental delta instead of a total map swap or reset.
- [ ] Accepted art is cited by repository-relative path and used only within its documented authority.
- [ ] Prototype GLBs remain labeled prototype; character art does not become an unsupported model/animation claim.
- [ ] LOD/streaming budgets are treated as targets requiring measurement, and pack-local/world thresholds are not conflated.
- [ ] No readable text, private provenance, external locator, workstation path, or identity marker enters the handoff.
