# Cairnmarket Precinct Bible

Status: deep, noncanonical design handoff for a future Cairnmarket site blockout, environment concept work, quest staging, ecology staging, audio/lighting planning, and later model integration. This document is not a canon source, accepted spatial payload, construction document, surveyed GIS product, runtime implementation, or claim of finished geometry.

Audience: environment production design, world and environment art, quest design, encounter design, technical art, audio, lighting, VFX, animation, model integration, and independent reviewers.

## 1. Reading law, authority boundary, and source ledger

Every material statement in this dossier carries an authority label. The labels must travel with excerpts copied into production tasks.

- **[CANON]** is directly represented in current `GAME` data or an accepted canonical record.
- **[DESIGN CONSTRAINT]** is an authored production envelope already present in `GAME`. It can constrain a blockout, but it does not establish final geometry or runtime behavior.
- **[DERIVED]** is a calculation from canonical or accepted design records. Recompute it when an input changes.
- **[PROPOSAL]** is connective design authored in this dossier. It is deliberately useful enough to block out, but it does not become canon merely because it is modeled.
- **[ART REFERENCE]** is accepted visual direction within the exact stated scope. Incidental composition, apparent dimensions, figures, and geometry remain nonbinding.
- **[OPEN]** is an unresolved decision that must remain visible in every handoff.
- **[NONCLAIM]** names something the current project evidence does not establish.

### 1.1 Precedence

1. **[CANON]** Current `GAME` records win over this dossier.
2. **[DESIGN CONSTRAINT]** The accepted atlas, world-spatial, activity, building, habitat, quest, streaming, and art-direction records constrain proposals.
3. **[PROPOSAL]** This dossier joins those records into one coherent precinct response. Any conflict must be reported rather than silently reconciled.
4. **[OPEN]** A canonical blank remains a blank. A plausible drawing is not evidence.
5. **[NONCLAIM]** No historical folder, external attachment, concept-art accident, or prose convenience may promote itself over current `GAME` authority.

### 1.2 Source ledger

| Purpose | Repository source | Binding use |
|---|---|---|
| Fictional CRS, territory, site anchor, route, habitat envelopes | `packages/content/manifests/sable-reach.atlas-runtime.json` | Exact atlas facts and modeled route evidence |
| Regional physical law, site envelope, activity cycle, typologies, habitat direction, art direction, streaming targets | `packages/content/src/world-spatial.data.js` | Design constraints and maturity boundaries |
| Wave04 quest identity, objective order, participants, outcomes, failure persistence | `packages/content/manifests/quest-wave-04-v11.narrative.json` | Exact quest semantics; not local geometry |
| Wave04 placement reservations, semantic anchors, hazards, utilities, encounters, graphs, safe cells, egress, streaming | `packages/content/manifests/quest-wave-04-v11.world.json` | External accepted program records; graph geometry remains external |
| Compact Wave04 site/program binding | `packages/content/manifests/quest-wave-04-v11.spatial-index.json` | Cross-check of host, reservation, graph ID, objectives, and maturity |
| Generic accepted spatial contract | `assets/world/spatial/site-blockout-reference-v2.schema.json` | Shape of a future machine-readable payload; this prose is not that payload |
| Accepted Graven March image record | `assets/world/world-environments.current.batch-01.provenance.json`; `assets/world/README.md` | Rights, hash, dimensions, maturity, and visual-use boundary |
| Accepted Cairnmarket orchard supplemental reference | `assets/world/cairnmarket-grave-root-orchard-civic-system-v1.png`; `assets/world/prompts/world-environments.current.batch-06.prompt-packets.json`; `assets/world/world-environments.current.batch-06.provenance.json`; `packages/content/src/world-spatial.data.js` | Exact asset, prompt hash, redacted provenance, independent-review state, and direction-only boundary; not Wave04 program-slot evidence |
| Accepted Bellwater corridor supplemental reference | `assets/world/bellwater-mobile-service-corridor-four-corner-transfer-v2.png`; `assets/world/prompts/world-environments.current.batch-07.prompt-packets.json`; `assets/world/world-environments.current.batch-07.provenance.json`; `packages/content/src/world-spatial.data.js` | Exact asset, prompt hash, redacted provenance, independent-review state, and direction-only boundary; not Wave04 program-slot evidence |
| Existing accepted site dossiers | `design-review/world-sites/HEARTHMERE-HOLD-PRECINCT-BIBLE.md`; `design-review/world-sites/HOLLOW-ABBEY-PRECINCT-BIBLE.md` | Handoff discipline only; they do not supply Cairnmarket facts |

### 1.3 Immutable selected-record ledger

These canonical-JSON hashes bind the exact records used by the dossier. They are not hashes of this Markdown file.

| Selected record | Canonical-record SHA-256 |
|---|---|
| Atlas `site.cairnmarket` | `e036d46f890601a639a8e1ee1b34edcf333a00231dd8df13895521ee00239de5` |
| Cairnmarket spatial envelope | `e74adb18b676d9c5cc7ae781340628da853496ac7d7a8bfb387722d02a8ccff2` |
| Cairnmarket activity cycle | `4eb2e1bb77ed09c0c5425ae6bcfed12b59c215437bd414f3269c888283f63bad` |
| `graven_cairn_hall` typology | `04330c55ca1bb7c325b03a8cf417737464330d5f2eecbe00fce5979b0a2c96bb` |
| `graven_road_assize` typology | `33906515d8c849dfe0b66c074f3010da7b6daf4c84e2583e8fd9583b6b40fed0` |

### 1.4 Deliverable boundary

**[PROPOSAL]** This dossier describes one local precinct backbone with exactly three zones, sixteen local spaces, eighteen nodes, and twenty stored bidirectional local links. Two of the nodes are non-traversable hash-only proxies for accepted external Wave04 graphs. The external graphs are summarized by identity, count, semantic interface, and canonical-record hash; their node coordinates and edge geometry are not copied into the precinct.

**[NONCLAIM]** The target count is an authoring contract, not evidence that a Wave03D payload, collision mesh, navmesh, streaming implementation, model, or playable build already exists.

## 2. Precinct thesis and graybox acceptance

**[CANON]** Cairnmarket is a settlement in the Graven March. Its water comes from crown snowmelt tanks; its access is recorded as Crown Road; it subsists on goats and black rye; it trades slate, grave lichen, and pack animals; family cairns open once each winter; governance occurs through the market oath circle.

**[DESIGN CONSTRAINT]** The Graven March is a slate upland of black-pine occlusion basins, cairn ridges, and ash-road terraces. Its world is cold, decayed, inhabited, repaired, and maintained. Warmth is scarce and accountable: a handled cairn stone, a grave-safe brazier, a working body, or a danger—not a general cozy color grade.

**[PROPOSAL]** Cairnmarket should read as a settlement that survives by negotiating the boundary between public passage and deliberate absence. Roads make the market possible; closing a road makes winter possible. Graves provide memory, shelter, warmth, habitat, and food infrastructure, yet no single institution is allowed to treat the dead as a generic resource. Every important threshold therefore asks a spatial question: who may cross, who must stop walking, what remains publicly reachable, which evidence stays separate, and who performs the maintenance after a verdict.

The settlement must not read as a cemetery with vendor stalls. It is a hard-working upland exchange where legal procedure, animal movement, snowmelt, food hygiene, grave custody, and winter ecology all occupy the same small piece of ground without collapsing into one system.

**[PROPOSAL]** A successful first graybox allows a reviewer to do all of the following without a minimap, floating marker, or readable sign:

1. Arrive on the modeled Bellwater Road approach, identify the road-assize court and cairn hall as different institutions, and choose the court entrance, market apron, or always-readable public bypass.
2. Follow all ten canonical typology edges while preserving every canonical threshold rule.
3. Traverse all sixteen local spaces on a connected graph with three meaningful loops; neither a hearing nor a seasonal wildlife closure seals residents inside the precinct.
4. Identify three protected local safe cells and understand that the two Wave04 safe-observation cells remain inside their external programs.
5. Read the four canonical activity phases through work, occupancy, light, sound, prop position, road frost, and animal movement rather than through a palette swap.
6. See exactly five ordinary population roles performing attributable work and understand their service dependencies.
7. Separate four habitat envelopes: settled civic edge, Cairn Beast winter interval, Funeral Kite orchard overlay, and Acre road-corridor overlay.
8. Stage the Funeral Kite and the Acre That Walks with their exact cues and counterplay while excluding both from local safe cells.
9. Connect the two Wave04 overlays through semantic anchors and hash-only proxies without reproducing their 41 nodes or 102 directed edges.
10. Preserve the ordered meaning of all seventeen Wave04 objectives and show fail-forward consequences as bounded, persistent changes rather than resets.

**[NONCLAIM]** Graybox acceptance does not certify real-world engineering, accessibility compliance, drainage capacity, occupational safety, collision, navigation, AI behavior, encounter balance, animation, lighting cost, streaming, save/load behavior, or production-art readiness.

## 3. Canonical identity and GIS logic

### 3.1 Site and regional facts

| Field | Current authority |
|---|---|
| Site | **[CANON]** `site.cairnmarket`, Cairnmarket, settlement |
| Territory | **[CANON]** `territory.graven-march`, Graven March |
| Fictional CRS | **[CANON]** `veyl_local_grid_v1`, easting/northing/elevation in metres; fictional modeled engineering grid, not measured earth geography |
| Atlas anchor | **[CANON]** `[8192, 10240, 212]`, `atlas_placed` |
| Territory polygon | **[CANON]** rectangle from `[3072, 5632]` to `[10240, 12288]` in the fictional grid |
| Site envelope | **[DESIGN CONSTRAINT]** 176 m core radius; 760 m radial influence; vertical range 198–254 m; radial influence is not a boundary |
| Envelope bounds | **[DERIVED FROM ACCEPTED RECORD]** easting 7432–8952; northing 9480–11000 |
| Population | **[DESIGN CONSTRAINT]** 460–740 across five population kinds; simulation envelope, not spawn schedule |
| Modeled route | **[CANON]** `route.bellwater-road.section.02`, Hearthmere to Cairnmarket, 2,843.3 m modeled length, 677 modeled walking seconds, no modeled crossing |
| Route surface | **[DESIGN CONSTRAINT]** `slate_road`, 3.5 m clearance; hard footfall; rain-on-slate scent; wet and cart costs are modeled planning values, not runtime proof |
| Regional habitat | **[CANON]** `habitat.graven-upland`, elevation 70–420 m, slope 0–38 degrees, moisture 0.12–0.75, corruption 0.12–1.0 |
| Road habitat | **[CANON]** `habitat.quarantine-road`, road/causeway substrates, elevation -4–420 m, slope 0–24 degrees |
| Production-status string | **[CANON FIELD]** `prototype_playable` |

**[NONCLAIM]** The atlas production-status string does not prove that a Cairnmarket mesh, scene, collision package, or current playable precinct is present in this branch.

### 3.2 Route approach and the Crown Road question

**[CANON]** The site record names Crown Road as Cairnmarket's access. The accepted atlas route that actually terminates at the site is Bellwater Road. The regional traversal list names both Bellwater Road and Crown Road, but the current atlas does not provide a separately modeled Crown Road polyline into Cairnmarket.

**[OPEN — DO NOT ALIAS]** Do not silently rename Bellwater Road as Crown Road or claim they are the same road. Until a coordinator resolves the relationship, use:

- `Bellwater Road` only for the accepted modeled inter-site route and its section record;
- `Crown Road access` only for the site's canonical access semantics;
- `Cairnmarket arrival fan` for the proposed local connective ground between them.

**[DERIVED]** The final modeled Bellwater segment runs from `[8256, 10176]` to the site anchor `[8192, 10240]`: 64 m west and 64 m north. It establishes an inbound northwest-running tangent at the anchor, but not the final road crown, gate rotation, curb, drainage, or building orientation.

### 3.3 Proposed local authoring frame and axis adapter

**[PROPOSAL]** For blockout communication, co-locate local origin `(0, 0, 0)` with the atlas site anchor. Let local `+X` follow the final inbound Bellwater tangent toward Cairnmarket, local `+Y` point road-left/southwest, and `+Z` point upward. This creates a right-handed frame:

```text
atlas E = 8192 - 0.70710678 * local X - 0.70710678 * local Y
atlas N = 10240 + 0.70710678 * local X - 0.70710678 * local Y
atlas H = 212 + local Z
```

The inverse adapter for a point `(E, N, H)` is:

```text
local X = -0.70710678 * (E - 8192) + 0.70710678 * (N - 10240)
local Y = -0.70710678 * (E - 8192) - 0.70710678 * (N - 10240)
local Z = H - 212
```

**[DERIVED]** The basis is orthonormal to rounding and preserves metres. **[PROPOSAL]** It exists to keep road-facing language consistent during graybox review. **[NONCLAIM]** It does not assert the site's final rotation or that any building occupies the atlas-anchor point.

### 3.4 Provisional Wave04 reservations

| External program | Accepted atlas-axis delta `Δ[E,N,H]` | Converted proposed local `(X,Y,Z)` | Provisional modeled atlas coordinate | Envelope | Boundary |
|---|---:|---:|---:|---:|---|
| `cairnmarket_grave_root_orchard` | **[DESIGN CONSTRAINT]** `[-104, 86, 5]` | **[DERIVED]** `[134.35, 12.73, 5]` | **[DESIGN CONSTRAINT]** `[8088, 10326, 217]` | 290 × 214 × 38 m; elevation 198–236 m | Candidate reservation, not canon; total radial test 315.16 m within 760 m influence |
| `bellwater_mobile_service_corridor` | **[DESIGN CONSTRAINT]** `[-176, -286, 2]` | **[DERIVED]** `[-77.78, 326.68, 2]` | **[DESIGN CONSTRAINT]** `[8016, 9954, 214]` | 520 × 120 × 24 m; elevation 202–226 m | Candidate reservation, not canon; total radial test 602.65 m within 760 m influence |

**[DESIGN CONSTRAINT]** The accepted deltas are easting, northing, and elevation offsets in the atlas `veyl_local_grid_v1` axes. They are not local `X/Y/Z` values and must never be applied directly in the rotated authoring frame. The converted local values above are derived through the inverse adapter in §3.3 and are rounded to two decimals for blockout communication. Either reservation may move under survey or coordinator placement. Semantic anchor IDs and relative program logic must survive a transform. **[NONCLAIM]** Neither `provisionalDesignCoordinate` is an exact atlas coordinate.

## 4. Landform, approach, occlusion, seasons, and weather

### 4.1 Regional physical law

**[DESIGN CONSTRAINT]** Graven March landform includes slate upland, black-pine occlusion basin, cairn ridge, and ash-road terrace. Slate-and-grave-loam drains quickly on ridges but perches water around cairns. Bearing is generally good except in ash pockets. Frost-shatter and trail gullying are the main erosion signatures. The water table is deep except at spring cuts; hydrologic events are brief snowmelt pulses.

**[PROPOSAL]** Shape the local precinct as a shallow saddle cut into a stepped slate shoulder:

- the Bellwater approach climbs onto a broad ash-road terrace rather than entering across a flat plaza;
- the road assize occupies the more wind-exposed, publicly visible shoulder;
- the cairn hall sits one half-level higher and farther under the black-pine edge, warm stone visible through colder foreground;
- the service yard occupies the seam between road drainage and cairn-ground custody;
- the orchard threshold drops away behind the family gallery, but the external orchard volume remains a transformable reservation rather than a local excavation claim;
- the rear den gate points toward an occluded ridge route whose absence of footprints matters more than scenic depth.

Use three families of terrain break:

1. long slate bedding planes for traversable shelves and road crowns;
2. frost-opened joints for shallow runoff, repair scars, and route dividers;
3. ash pockets for visibly shored soft ground, never for arbitrary bottomless pits.

### 4.2 Approach sequence

**[PROPOSAL]** Build the first approach read in six beats:

1. At 384–250 m, the player reads one low, dark roof mass, one open timber jurisdiction frame, and alternating black-pine shadow bands. No settlement skyline competes with the terrain.
2. At 250–128 m, the road splits visually around the hearing ground: straight public approach, left market apron, and a lower bypass that remains traceable beyond the court.
3. At 128–70 m, pack animals, road chains, snowmelt hardware, and handled cairn stones establish ordinary service before supernatural content becomes legible.
4. At 70–42 m, the separate ash chairs, living gallery, oath circle, and rear den route can be distinguished by silhouette and occupancy.
5. Inside 42 m, threshold state, evidence custody, prop wear, encounter cues, and hand-scale repair become readable.
6. On departure, the player can look back and identify whether the road is open, diverted, or deliberately unused from chain position, frost continuity, hoof traces, and staffed control points.

### 4.3 Occlusion as ecology and wayfinding

**[DESIGN CONSTRAINT]** Visibility in the Graven March varies from 30 to 1,200 m. Black-pine canopy and cairn shadow create occlusion; ridge gusts can give way to dead calm under pine.

**[PROPOSAL]** Occlusion is not fog volume decoration. Use it to meter information:

- pine trunks hide portions of the rear animal corridor while leaving its entry and return horizon readable;
- the road-assize canopy hides sky but never the road bypass;
- the hall roof and market awnings create warm, low occlusion; they must not hide the family-cairn custody gate from the oath circle;
- alternating shadow bands make a closed road appear colder because it remains undisturbed, not because it is tinted blue;
- each safe cell retains two readable exits even when weather reduces long visibility.

The accepted winter-basin image may guide black-pine density, five shadow-band rhythm, road closure, and deliberate ecological absence. It does not establish this precinct's layout.

### 4.4 Weather and seasonal response

**[DESIGN CONSTRAINT]** Regional weather is ash-filtered drizzle and winter sleet, with ridge gusts, dead calm under black pine, a -8 to 12 °C thermal band, long hibernation winter, and unreliable thaw.

**[PROPOSAL]** Author four reusable seasonal condition layers rather than four duplicated maps:

| Condition | Terrain and structure | Work response | Traversal response | Sensory response |
|---|---|---|---|---|
| Dry cold | Pale joint frost, firm ash pockets, low tank level | Slate sorting and harness repair move outdoors | All public routes available | Longest sightlines; sharp stone clicks |
| Sleet | Rain-dark slate, glazed north edges, weighted canvas | Evidence trays hooded; pack traffic slows | Bypass and handrail cues become primary | Hard roof hiss, wet-pine scent, reduced high-frequency detail |
| Unreliable thaw | Short rills, soft ash pockets, tank overflow stains | Tank measurement and rut repair peak | Yard routes narrow around shoring | Drip, hoof suction, grave-loam scent |
| Hibernation winter | Continuous frost on deliberately unused routes, snow caught in pine shadow | Market contracts; den and road keepers dominate | Wildlife closure and resident bypass must coexist | Footfall absence is authored; one warm-cairn pulse remains local |

**[NONCLAIM]** These condition layers do not establish a calendar, meteorological simulation, hydraulic capacity, or real temperature exposure requirement.

## 5. Exact proposed precinct topology

### 5.1 Frozen authoring target

**[PROPOSAL]** The initial Cairnmarket precinct backbone targets exactly:

- 3 zones;
- 16 local spaces;
- 18 nodes, of which 16 are traversable local nodes and 2 are non-traversable overlay proxies;
- 20 stored bidirectional local links, equivalent to 40 derived directed traversal arcs when every link is open;
- 3 local safe cells;
- 6 state machines;
- 4 activity phases;
- 3 schematic hydrology/sanitation systems;
- 4 habitat envelopes;
- 5 ordinary population-role schedules;
- 2 quest encounter envelopes;
- 8 local route programs;
- 2 hash-only external graph bindings;
- 2 executable Wave04 quest crosswalks containing 17 ordered objective bindings.

**[DERIVED]** The sixteen-node local traversal graph has cycle rank `20 - 16 + 1 = 5` if all links are open. The two overlay proxy nodes are intentionally outside that traversal calculation.

### 5.2 Three-zone register

| Zone | Name | Local design extent | Primary function | Authority |
|---|---|---:|---|---|
| Z01 | Road and Jurisdiction Terrace | X -96 to +8; Y -60 to +12; Z -3 to +12 m | Arrival, road assize, witness handling, public bypass, Bellwater overlay interface | **[PROPOSAL]** |
| Z02 | Cairn Hall and Market Shoulder | X -52 to +42; Y +4 to +54; Z -1 to +16 m | Oath, market, family cairn custody, winter storage | **[PROPOSAL]** applying canonical typology functions |
| Z03 | Seasonal Service Seam | X -40 to +45; Y +42 to +70; Z -4 to +18 m | Snowmelt and pack service, keeper bypass, orchard interface, rear ecology edge | **[PROPOSAL]** |

Zone extents are overlap-tolerant streaming and review envelopes, not property lines or final collision bounds.

### 5.3 Sixteen-space register

Dimensions and local centers below are blockout targets. Canonical room names and functions remain binding; exact sizes and placements remain proposals.

| Space | Zone | Name / canonical binding | Proposed center `(X,Y,Z)` m | Approximate clear envelope | Capacity target | Core read |
|---|---|---|---:|---:|---:|---|
| S01 | Z01 | Cairnmarket arrival fan | `(-78, -4, 0)` | 36 × 16 × 5 m exterior | 50 | Three route choices visible together |
| S02 | Z01 | `road_entry` | `(-49, -13, 1)` | 14 × 8 × 5 m | 24 | Jurisdiction begins but road remains visible |
| S03 | Z01 | `witness_ring` | `(-28, -13, 2)` | 18 m diameter × 6 m | 48 | Court center; every testimony lane separable |
| S04 | Z01 | `three_ash_chairs` | `(-27, -30, 2)` | 11 × 7 × 5 m | 12 | Three deposits never merge |
| S05 | Z01 | `living_gallery` | `(-27, +3, 2)` | 15 × 7 × 5 m | 36 | Protected living witness and conversation edge |
| S06 | Z01 | `evidence_bay` | `(-8, -13, 2)` | 9 × 8 × 5 m | 12 | Custody, separation, repair-visible storage |
| S07 | Z01 | `appeal_exit` | `(-8, -33, 1)` | 7 × 9 × 4 m | 18 | Unlocked verdict egress and rejoin |
| S08 | Z01 | Bellwater service verge | `(-52, -49, 0)` | 42 × 12 × 6 m exterior | 40 | Always-readable road bypass and Acre interface |
| S09 | Z02 | `road_apron` | `(-43, +24, 1)` | 18 × 9 × 5 m exterior | 30 | Hall threshold, pack turn, public spill-out |
| S10 | Z02 | `oath_circle` | `(-18, +25, 2)` | 10 m diameter × 5 m | 42 | Governance without a frontal throne |
| S11 | Z02 | `market_bay` | `(+2, +15, 2)` | 13 × 9 × 5 m | 34 | Slate, lichen, rye, and route-hour exchange |
| S12 | Z02 | `family_cairn_gallery` | `(+3, +37, 3)` | 13 × 6 × 5 m | 18 | Custody line; no generic tomb corridor |
| S13 | Z02 | `winter_store` | `(+24, +15, 3)` | 9 × 7 × 4 m | 12 | Food and emergency inventory, dry and separately accountable |
| S14 | Z02 | `rear_den_gate` | `(+28, +42, 4)` | 7 × 6 × 4 m | 6 | Seasonal wildlife interval overrides public access |
| S15 | Z03 | Grave-root orchard threshold | `(+20, +57, 4)` | 13 × 9 × 5 m | 20 | Local semantic handoff; external geometry begins after this point |
| S16 | Z03 | Snowmelt and pack service yard | `(-13, +52, 2)` | 22 × 15 × 6 m exterior | 28 | Tanks, stock, delivery, maintenance, keeper bypass |

### 5.4 Eighteen-node register

| Node | Space | Traversable | Function | Authority |
|---|---|---|---|---|
| N01 | S01 | Yes | Arrival-fan decision point | **[PROPOSAL]** |
| N02 | S02 | Yes | Road-entry threshold point | **[PROPOSAL]** |
| N03 | S03 | Yes | Witness-ring circulation center | **[PROPOSAL]** |
| N04 | S04 | Yes | Three-ash-chair testimony point | **[PROPOSAL]** |
| N05 | S05 | Yes | Living-gallery refuge/conversation point | **[PROPOSAL]** |
| N06 | S06 | Yes | Evidence-bay custody point | **[PROPOSAL]** |
| N07 | S07 | Yes | Appeal-exit decision point | **[PROPOSAL]** |
| N08 | S08 | Yes | Bellwater verge and bypass point | **[PROPOSAL]** |
| N09 | S09 | Yes | Cairn-hall road-apron point | **[PROPOSAL]** |
| N10 | S10 | Yes | Oath-circle circulation center | **[PROPOSAL]** |
| N11 | S11 | Yes | Market-bay exchange point | **[PROPOSAL]** |
| N12 | S12 | Yes | Family-cairn custody point | **[PROPOSAL]** |
| N13 | S13 | Yes | Winter-store threshold point | **[PROPOSAL]** |
| N14 | S14 | Yes | Rear den-gate keeper point | **[PROPOSAL]** |
| N15 | S15 | Yes | Grave-root orchard local handoff | **[PROPOSAL]** |
| N16 | S16 | Yes | Snowmelt/pack-yard service center | **[PROPOSAL]** |
| N17 | S15 | No | Hash-only proxy for `environment_graph.v6.cairnmarket_grave_root_orchard` | **[PROPOSAL]** interface to accepted external graph |
| N18 | S08 | No | Hash-only proxy for `environment_graph.v6.bellwater_mobile_service_corridor` | **[PROPOSAL]** interface to accepted external graph |

N17 and N18 own no copied external coordinates, traversal arcs, hazards, or utilities. They can expose graph availability and interface state only.

### 5.5 Twenty-link register

All twenty links are stored once as bidirectional local relationships. State machines may close a link, but the underlying relationship remains stable.

| Link | Endpoints | Threshold / surface | Minimum target | State and purpose | Authority |
|---|---|---|---:|---|---|
| L01 | N02–N03 | `gate.jurisdiction` | 3.5 m clear | Movable, visibly revocable court entry | **[DESIGN CONSTRAINT]** relation; dimensions **[PROPOSAL]** |
| L02 | N03–N04 | `rail.dead` | 1.5 m opening | Three testimony deposits remain separate | **[DESIGN CONSTRAINT]** |
| L03 | N03–N05 | `rail.living` | 2.2 m clear | Living-witness route; candidate safe-cell approach | **[DESIGN CONSTRAINT]** relation |
| L04 | N03–N06 | `gate.evidence` | 1.6 m clear | Controlled evidence custody | **[DESIGN CONSTRAINT]** relation |
| L05 | N03–N07 | `door.appeal` | 1.8 m clear | Must remain unlocked during verdict | **[DESIGN CONSTRAINT]** |
| L06 | N09–N10 | `door.oath` | 2.4 m clear | Public arrival into oath circle | **[DESIGN CONSTRAINT]** relation |
| L07 | N10–N11 | `arch.market` | 2.8 m clear | Governance-to-market flow | **[DESIGN CONSTRAINT]** relation |
| L08 | N10–N12 | `gate.cairn` | 1.8 m clear | Witnessed winter custody state | **[DESIGN CONSTRAINT]** |
| L09 | N11–N13 | `door.store` | 1.6 m clear | Dry stock transfer | **[DESIGN CONSTRAINT]** relation |
| L10 | N12–N14 | `gate.den` | 2.6 m clear | Wildlife interval overrides public access | **[DESIGN CONSTRAINT]** |
| L11 | N01–N02 | Slate-road continuation | 3.5 m clear | Principal court arrival | **[PROPOSAL]** |
| L12 | N01–N09 | Split-slate market lane | 3.5 m clear | Principal hall arrival | **[PROPOSAL]** |
| L13 | N07–N08 | Appeal return ramp | 2.4 m clear, ≤1:20 target | Appeal route rejoins public road | **[PROPOSAL]**; not accessibility certification |
| L14 | N08–N01 | Bellwater bypass | 3.5 m clear | Always readable; closes only under separately accepted traffic control | **[PROPOSAL]** |
| L15 | N09–N16 | Pack-service gate | 3.2 m clear | Handcart and pack-stock access | **[PROPOSAL]** |
| L16 | N16–N11 | Market delivery door | 2.8 m clear | Dirty arrival to inspected market threshold | **[PROPOSAL]** |
| L17 | N16–N13 | Winter-store service door | 2.4 m clear | Food-only transfer after inspection | **[PROPOSAL]** |
| L18 | N12–N15 | Orchard custody passage | 2.0 m clear | Ends at external-program handoff; no graph geometry implied | **[PROPOSAL]** |
| L19 | N14–N16 | Keeper and animal bypass | 2.8 m clear | Residents never need to cross an active hearth or blocked den interval | **[PROPOSAL]** applying traversal law |
| L20 | N05–N07 | Living-gallery appeal bypass | 2.2 m clear | Independent second exit from SC01; rejoins the public appeal route without crossing evidence custody | **[PROPOSAL]** |

**[PROPOSAL]** Use believable rise, landing depth, cart turning, and handrail proxies in graybox. **[NONCLAIM]** The numerical clearances are review targets, not code compliance or final collision dimensions.

### 5.6 Eight route programs

| Route | Ordered local intent | Operational law |
|---|---|---|
| R01 Bellwater arrival and bypass | N01→N02 or N09; N01↔N08; N08↔N07 | A hearing cannot erase the inter-site road read |
| R02 Public assize circuit | N02→N03→N05→N07 | Living witnesses can enter, speak, and leave by L20 without crossing evidence custody; L03 remains the independent return to N03 |
| R03 Evidence custody circuit | N03↔N04 and N03↔N06, returning through N07 | Ash deposits, exhibits, and living testimony never merge into one queue |
| R04 Market and oath circuit | N09→N10→N11→N16→N09 | Public market flow forms a loop and remains distinct from the store transfer |
| R05 Family cairn custody | N10→N12→N14→N16→N09 | Witnessed opening and wildlife closure never trap a visitor |
| R06 Pack, tank, and store service | N01→N09→N16→N11 or N13 | Stock, water, food, and waste each cross a visible inspection boundary |
| R07 Orchard semantic handoff | Local route ends at N15; N17 reports external graph state | No local edge enters or reproduces the external orchard graph |
| R08 Acre semantic handoff | Local route ends at N08; N18 reports external graph state | No local edge enters or reproduces the external corridor graph |

## 6. Zone-by-zone exterior design

### 6.1 Z01 — Road and Jurisdiction Terrace

**[PROPOSAL]** Z01 is the public face, exposed to ridge weather and visible before the warmer hall. Use a low slate road crown, a shallow downhill bypass, and an open assize canopy made from reversible black-pine frames. The court should appear assembled around a continuing road rather than built to terminate it.

The three largest silhouettes are:

- a horizontal road cut that continues past the settlement;
- a partial timber canopy whose missing wall makes jurisdiction visibly revocable;
- three low, unequal ash-chair stations held apart by floor joints and separate trays.

Keep the living gallery under the most reliable weather cover, but do not elevate it as a throne. Evidence bay doors face the witness ring, not the public road. The appeal exit is visible from the ring and physically nearer the bypass than the evidence bay, reinforcing that departure is a right rather than an award.

Ground dressing must explain work: repaired wheel ruts, covered witness jars, chain wear, swept ash-control margins, snow pushed away from the appeal route, and slate splints at frame feet. Avoid rows of identical stalls, heraldic banners, court-room benches, gallows silhouettes, or generic medieval square language.

### 6.2 Z02 — Cairn Hall and Market Shoulder

**[PROPOSAL]** Z02 sits one half-level higher, sheltered by terrain and pine. Its massing is low: dry-stacked slate around black-pine tie beams, a flint-shingle roof, and a smoke notch. The hall's warmth must read through handled stone, breath, and candle niches—not orange floodlight.

The road apron and oath circle form a civic threshold before the room graph divides toward commerce, family custody, and winter storage. No axis points to a ruler's chair. The oath circle should support a visible audience ring and several equal standing positions. Market goods occupy wall-depth bays so the circle remains legible at peak density.

Family cairn masonry is neither decorative cladding nor a generic crypt. Each opened course shows custody hardware, seasonal handling, and repair. The rear den gate remains legible from the gallery but does not reveal the entire animal corridor. The winter store is dry, cool, and inspectable from the market side without exposing its service door to the public queue.

### 6.3 Z03 — Seasonal Service Seam

**[PROPOSAL]** Z03 is where the settlement proves it is alive. Snowmelt tanks, pack harness repair, food inspection, road-keeper tools, and the orchard custody passage share a work yard without sharing waste streams.

Arrange tanks on the stable slate side, not over ash pockets. Pack turning occupies the broadest level patch. Harness frames and lichen racks sit downwind of food inspection. The keeper route reaches the rear den gate without passing through the market bay. The orchard threshold sits behind a custody turn so a public visitor sees the existence of the descent without looking directly into family or worker privacy.

The yard should contain additive repairs from at least three periods: original dry-stack tank plinths; later mismatched timber braces; current removable iron collars and frost gauges. None is ornamental. Every pipe, gutter, rack, chain, hatch, and retaining stone must connect to a named task in Sections 12 and 13.

## 7. Graven cairn hall: every room and threshold

The six canonical room names, five canonical edges, utilities, props, and traversal laws come from `graven_cairn_hall`. Geometry below is proposed.

### 7.1 S09 — Road apron

**[DESIGN CONSTRAINT]** The apron is the public edge of the hall. **[PROPOSAL]** Make it a slightly crowned split-slate surface large enough for one loaded pack string to turn without occupying the oath doorway. A dry curb catches harness drips and road grit before they enter. Two low stones indicate the audience queue through wear rather than a barrier.

Props: pack harness, removable hitch rail, blank map markers, boot scraper, cracked lichen basket, and a road-chain inspection hook. The apron must show L11, L12, and L15 at the same time; L20 belongs to the assize's living-gallery/appeal relation.

### 7.2 S10 — Oath circle

**[CANON/DESIGN CONSTRAINT]** Cairnmarket governance is the market oath circle; the typology requires a visible audience ring. **[PROPOSAL]** Set the circle into the floor as a band of repeatedly lifted and reset slate, not a magic glyph. Standing stones vary only by repair history, never by faction color. A low central void keeps speakers from occupying a throne position.

Light enters through the smoke notch and low candle niches. The circle reads three onward decisions: market, family cairn, and return to road. Conceal no exit behind a speaker. Props are cairn bowls, blank markers, witness lanterns on removable hooks, and one repair ledger represented physically by sorted tokens rather than readable writing.

### 7.3 S11 — Market bay

**[DESIGN CONSTRAINT]** Cairnmarket trades slate, grave lichen, pack animals, goats, and black rye. **[PROPOSAL]** Use deep wall bays rather than free-standing fantasy stalls. Wet slate remains near the service threshold; dried lichen hangs high and away from stock; black rye rests on raised stone feet; harness fittings occupy a hard-wearing bench.

The player must see `arch.market`, the service delivery door, and the winter-store door without weaving through clutter. Goods change quantity by phase and outcome, but shelving and route clearances remain stable. No generic potion bottles, glowing crystals, coin piles, or copied merchant booths.

### 7.4 S12 — Family cairn gallery

**[DESIGN CONSTRAINT]** Family cairns open once each winter under witnessed custody. **[PROPOSAL]** Build a short, broad gallery whose dry-stacked courses turn perpendicular to the public hall. Opened courses show clean handled stone; sheltered names attract lichen; windward joints hold old ash. Avoid readable inscriptions. Family distinction comes through stone fit, repair date, custody cord, and portable marker socket.

The gallery has two different onward reads: the seasonal den gate and the orchard custody passage. Do not make either a hidden dungeon door. A visitor can understand that both concern the dead and ecology while still seeing their different maintenance hardware.

### 7.5 S13 — Winter store

**[DESIGN CONSTRAINT]** The hall provides a winter store; the site survives on goats and black rye. **[PROPOSAL]** Keep the floor raised and ventilated. Food sacks sit on removable slate rails. A cold inspection niche opens toward the market; the wider service door opens toward the yard. Store lighting is low reflected candlelight, sufficient to reveal contamination and inventory gaps without a warm tavern glow.

Props: black-rye sacks, lidded salt-free bins, ration scoop sets, harness grease sealed away from food, frost gauge, mouse-resistant stone skirts, and a handcart brake. No treasure-chest shorthand.

### 7.6 S14 — Rear den gate

**[DESIGN CONSTRAINT]** The wildlife interval overrides public access; the animal route crosses no active hearth. **[PROPOSAL]** The gate is a broad, low timber-and-slate closure with visible seasonal latch states. Its floor continues as cold slate toward the keeper bypass; no hearth, brazier, or food stall crosses that line. Use accumulated frost, undisturbed dust, and inward-facing hoof or stone traces to communicate closure.

The gate can block public access while L19 keeps authorized keeper circulation possible. That bypass is not a secret shortcut and cannot become a combat flank during the protected interval without a later accepted state rule.

### 7.7 Canonical hall thresholds

| Threshold | Exact accepted rule | Proposed physical expression |
|---|---|---|
| `door.oath` | Openable circulation threshold; retain readable clearance and state | Double black-pine leaves behind a shallow rain break; latch angle readable from apron |
| `arch.market` | Openable circulation threshold; retain readable clearance and state | Broad slate arch with removable night shutters stored visibly nearby |
| `gate.cairn` | Opened once per winter under witnessed custody | Lifted slate course, custody cord, paired witness handles; never a generic locked crypt door |
| `door.store` | Openable circulation threshold; retain readable clearance and state | Insulated timber leaf with external inventory-slat rack and visible dry seal |
| `gate.den` | Seasonal wildlife interval overrides public access | Wide seasonal gate with frost continuity and two-state keeper latch |

## 8. Countryless road assize: every room and threshold

The six canonical rooms, five canonical edges, utilities, props, and traversal laws come from `graven_road_assize`. Geometry below is proposed.

### 8.1 S02 — Road entry

**[PROPOSAL]** Keep the slate road visibly continuous beneath a movable timber jurisdiction frame. The frame bears reversible latch scars and replaceable feet. It must feel capable of withdrawing without destroying the road. A person who declines the hearing can still read the bypass before entering.

Props: road-chain post, witness lantern, hooded jar rack, wheel chock, spare frame foot, and blank custody token tray. No written docket or heraldic gate.

### 8.2 S03 — Witness ring

**[DESIGN CONSTRAINT]** The ring must preserve three separate testimony positions, the living gallery, evidence bay, and appeal exit. **[PROPOSAL]** Use a shallow oval of split slate with five unmistakable apertures. The center remains open enough for a stationary cart or other accepted setpiece overlay, but no permanent dais assumes one quest is always active.

Canopy openings retain sight of sky and road. Perimeter braziers stay low and outside evidence airflow. Floor wear should show multiple historical seating configurations rather than one eternal courtroom plan.

### 8.3 S04 — Three ash chairs

**[DESIGN CONSTRAINT]** Three ash deposits never merge. **[PROPOSAL]** Treat each chair as a different material custody island: separate tray lip, separate runoff hood, separate approach seam, and separate witness position. Their silhouettes may be related, but damage, ash grain, and support hardware differ. No spectral figures are required to make the seats legible.

Leave a maintenance crawl gap behind each tray so ash can be stabilized without crossing another deposit. That gap is not player traversal and must not become an undocumented flank.

### 8.4 S05 — Living gallery

**[PROPOSAL]** This is a protected standing terrace, not spectator seating. It receives the best wind break, the clearest view of the appeal exit, and one of the precinct's three local safe-cell boundaries. Provide ordinary scale through backrests, crutch rests, pack shelves, and a low warming stone whose service route remains visible.

Living witnesses should never be forced to cross S04 or S06 to leave. Crowd silhouettes must remain individually separable; do not fill the gallery with undifferentiated hooded extras.

### 8.5 S06 — Evidence bay

**[DESIGN CONSTRAINT]** Ash is handled as evidence. **[PROPOSAL]** Use ventilated, closable slate bays with removable timber dividers. Every object has an arrival surface, examination surface, and return slot. Current custody state reads through hardware position and empty volume, not labels.

Keep wax, wet brick, old canvas, tools, and ash materially distinct for `aftermath_cart_accepts_office`. Permanent base dressing remains sparse so quest exhibits can orbit or relocate without clipping a universal prop pile.

### 8.6 S07 — Appeal exit

**[DESIGN CONSTRAINT]** This door remains unlocked during verdict. **[PROPOSAL]** It should be the simplest, least monumental opening in the court, visible from every testimony position. Its exterior landing divides toward the bypass and hall apron, allowing a person to leave the case without leaving the settlement.

Use a counterweighted leaf that fails open under loss of tension. The counterweight is a visual proposal, not a construction claim. Never obstruct the opening with a verdict prop, crowd rail, combat cover, or cinematic actor.

### 8.7 Canonical assize thresholds

| Threshold | Exact accepted rule | Proposed physical expression |
|---|---|---|
| `gate.jurisdiction` | Movable and visibly revocable | Freestanding black-pine frame with reversible foot clamps and an unbroken road beneath |
| `rail.dead` | Three deposits never merge | Three independently removable rails with separate floor joints and tray drainage hoods |
| `rail.living` | Openable circulation threshold; retain readable clearance and state | Wide pivot rail with hand-height polish and a clear open/closed silhouette |
| `gate.evidence` | Openable circulation threshold; retain readable clearance and state | Double custody gate whose two leaves expose different evidence bays |
| `door.appeal` | Remains unlocked during verdict | Fail-open counterweighted leaf, directly visible from witness ring |

## 9. Four interface spaces and connective thresholds

### 9.1 S01 — Cairnmarket arrival fan

**[PROPOSAL]** S01 joins the modeled inter-site approach to the site's unresolved Crown Road access semantics. Use a three-way change in surface wear, not three signposts: harder central slate toward court, pack-polished stones toward hall, and lower uninterrupted wheel ruts toward the bypass. The local origin may sit here for transform testing, but no canonical record says this exact point is a plaza.

### 9.2 S08 — Bellwater service verge

**[PROPOSAL]** S08 is a long, shallow verge that keeps ordinary traffic moving when the court is full and later provides the local handoff for the mobile-service corridor. It contains passing width, a marshal pocket, stock watering separation, and two sightline notches toward former and receiving directions. It does not contain the Acre graph.

### 9.3 S15 — Grave-root orchard threshold

**[PROPOSAL]** S15 is a custody vestibule between the family gallery and the external orchard reservation. It contains clean boots, burial-wash separation cues, lift-call hardware, and two independent egress-direction cues. A hard occluding turn prevents a market visitor from seeing into mortuary or food-handling work.

The threshold ends at N15. N17 holds only graph identity and state. Any modeled descent beyond the threshold belongs to a separately accepted overlay placement.

### 9.4 S16 — Snowmelt and pack service yard

**[PROPOSAL]** S16 separates four work bands: tank inspection on stable slate; pack turning on replaceable road stone; food inspection at the market door; keeper access along the cold rear wall. Waste and dirty harness wash stay downhill of clean draw points. The yard provides the practical loop that lets public-road closure coexist with resident life.

### 9.5 Proposed connective thresholds

| Link | Proposed threshold language | Required readable states |
|---|---|---|
| L11 | Open road crown into jurisdiction frame | approach / hearing-active / hearing-withdrawn |
| L12 | Split-slate lane into hall apron | market-open / market-contracted / emergency-clear |
| L13 | Appeal return ramp | clear / weather-guarded; never verdict-locked |
| L14 | Bellwater bypass | open / marshaled; closure requires later explicit authority |
| L15 | Pack-service gate | delivery / pedestrian-only / emergency-open |
| L16 | Market inspection door | receiving / inspection-hold / clean release |
| L17 | Winter-store service door | food transfer / sealed-dry / emergency ration issue |
| L18 | Orchard custody passage | unavailable / overlay pinned / fallow-return |
| L19 | Keeper and animal bypass | keeper-open / wildlife-protected / resident emergency |
| L20 | Living-gallery appeal bypass | open / crowd-metered / weather-guarded; never verdict-locked |

## 10. Materials, assembly, repair, and weathering

### 10.1 Binding material vocabulary

| Material | Accepted role | Proposed precinct use | Do not substitute |
|---|---|---|---|
| Split slate | Regional and typology material | Road crown, floors, retaining edges, assize paving, repair courses | Smooth palace marble, generic gray concrete |
| Warm cairn stone | Cairn-hall material and regional light contrast | Handled family courses, warming stones, custody thresholds | Universal glowing stone or magical ore |
| Black pine | Regional structure and occlusion | Tie beams, jurisdiction frames, gates, splints, canopy, rails | Decorative gothic timber or black metal spikes |
| Flint shingle | Cairn-hall roof | Low roof, drip edge, selected weather cap | Uniform ceramic tile or fantasy scales |
| Grave lichen | Industry, ecology, and weathering | Sheltered masonry, drying racks, custody edges | Neon fungus or indiscriminate wall carpet |
| Ash | Regional residue and assize evidence | Windward joints, separate testimony trays, swept control margins | Generic smoke VFX or mixed dirt decal |
| Unmarked iron | Assize material | Reversible clamps, latches, counterweights, tank collars, tally weights | Readable seals, heraldry, polished steel ornament |
| Blank clay markers | Regional material law | Route state, inventory grouping, portable grave sockets | Written signage, pictographic UI, faction badges |
| Black rye and rough cloth | Canon subsistence and survival evidence | Store, market, ration state, weather hoods | Abundant banquet dressing or bright merchant awnings |

**[PROPOSAL]** Maintain a strict value hierarchy: near-black pine mass; cold blue-gray slate midtones; pale frost, ash, and sleet; localized warm handled stone and small amber practicals. Warmth identifies a service, person, living body, grave condition, or hazard. It never washes the whole market in comfort.

### 10.2 Assembly logic

**[DESIGN CONSTRAINT]** The cairn hall is dry-stacked slate around black-pine tie beams. The road assize is an open slate court with movable timber jurisdiction frames. **[PROPOSAL]** Make those systems readable at player height:

- dry-stacked walls show through-joints, reset stones, wedges, and replaceable cap courses;
- timber ties visibly pass through or clamp masonry rather than floating against it;
- assize frame feet sit in reversible iron shoes, leaving old latch scars when moved;
- partial canopies shed water to known drip edges and do not hover without supports;
- later repairs add material rather than smoothing damage away;
- structural, custody, drainage, and decorative parts must not share an ambiguous silhouette.

### 10.3 Three time layers in every major space

| Layer | Evidence |
|---|---|
| Old intention | Original road crown, oldest dry-stack courses, first snowmelt plinths, assize socket pattern |
| Survival repair | Mismatched slate, black-pine splints, patched flint, reset gutters, hand-cut ramps |
| Current pressure | Chain position, evidence-tray separation, portable grave markers, food inspection barriers, overlay handoff hardware |

Add a fourth player-consequence layer only after an accepted quest state exists. Never pre-dress every possible outcome simultaneously.

### 10.4 Weathering map

- Windward slate edges frost-spall and hold old ash in joints.
- Leeward and sheltered custody faces support lichen; active hand paths remain cleaner and warmer.
- Assize chairs acquire different wear patterns according to admitted approach, not identical procedural polish.
- Road ruts polish the highest slate points; soft ash pockets show shoring and displaced fines.
- Flint shingles whiten at broken edges and darken where smoke leaves the notch.
- Black-pine end grain checks under sleet; iron collars leave narrow stains without turning the whole facade orange.
- Tank overflow leaves short mineral fans that terminate locally. Do not imply a permanent stream.
- Deliberately unused winter routes retain uninterrupted frost and snow; active bypasses break that surface with attributable feet, wheels, or hooves.

## 11. Prop and artifact plan

Every hero prop must own testimony, custody, access, debt, consent, maintenance, or survival. Background clutter may establish use, but it cannot obscure a route or imitate a semantic prop.

### 11.1 Canonical prop families

| Prop | Home space | Function and readable states | Placement law |
|---|---|---|---|
| `cairn_bowl` | S10, S12, limited S15 | Custody offering, measure, or burial-service distinction | Never scattered as generic pottery; one hand-reachable surface per use |
| `blank_map_marker` | S09, S10, S16 | Non-textual route closure, detour, or family relocation | Shape and socket position convey state; no symbols or writing |
| `black_rye_sack` | S11, S13 | Food inventory and ration consequence | Raised from wet floor; quantity may change, route never blocked |
| `lichen_drying_frame` | S11 edge, S16 downwind band | Industry and moisture management | Kept away from clean food wash and animal waste |
| `pack_harness` | S09, S11 bench, S16 | Trade, animal care, route wear | Hung at believable hand/animal height; never decorative wall armor |
| `ash_council_tray` | S04 | Independent ash custody | Exactly separate support, hood, and maintenance access for each testimony position |
| `blank_chair` | S04/S03 overlay sockets | Civic standing without baked identity | Chair wear differs; no throne hierarchy |
| `grave_tithe_box` | S06 | Custody/debt evidence | Lidded, portable, and physically segregated from ash trays |
| `road_chain_post` | S01, S02, S08, S09 | Access and winter closure | Chain position readable from approach; never the only route cue |
| `witness_lantern` | S02, S03, S05, S07 | Occupancy, hearing state, safe departure | Low, hooded, individually serviceable; no color-only coding |

### 11.2 Proposed service props

| Prop family | Required pieces | Purpose |
|---|---|---|
| Snowmelt tank set | Stone plinth, lidded tank, draw bar, overflow lip, isolation peg, frost gauge | Makes water source, inspection, and outage legible |
| Food inspection set | Raised wash table, clean basket rack, dirty-return cradle, drain cover, quarantine shelf | Separates arrival dirt from market/storage flow |
| Mortuary isolation set | Covered basin, sealed residue jar, removable mineral-bed cassette, dedicated hand tools | Prevents burial work reading as part of food production |
| Road-keeper set | Chain hook, rut gauge, slate wedges, pine splints, frost broom, hoof-trace screen | Makes closure and detour active maintenance, not mystical decree |
| Pack-service set | Hitch rail, hoof stand, harness vise, dung pan, separate stock trough | Shows animal care and waste route |
| Assize maintenance set | Frame jack, iron shoes, ash hood, separate brushes, witness-jar covers | Makes jurisdiction physically reversible and evidence care attributable |

### 11.3 Stable environmental artifacts

**[PROPOSAL]** Reserve stable semantic anchors for:

1. the Bellwater/Crown access ambiguity expressed as two differently maintained route surfaces meeting at S01;
2. the public access chain at S01/S09;
3. the three independent ash custody trays at S04;
4. the appeal counterweight at S07;
5. the oath-circle reset stones at S10;
6. the family-cairn witness handles at S12;
7. the winter ration gap at S13;
8. the den-gate frost line at S14;
9. the orchard clean/dirty custody turn at S15;
10. the tank isolation pegs and pack-route detour markers at S16.

Each anchor must persist across LOD and state changes sufficiently to retain its meaning. Exact asset names and runtime serialization remain open.

## 12. Water, sanitation, heat, light, waste, and service circulation

### 12.1 Three schematic water/sanitation systems

| System | Source and scope | Proposed path | Isolation law | Nonclaim |
|---|---|---|---|---|
| `hydrology.cairnmarket_crown_snowmelt` | Canonical snowmelt tanks; hall typology water | Roof/drip collection → lidded tanks in S16 → inspected potable and stock draw points | Stock draw below human draw; overflow terminates in a shallow local spreader | No claimed watershed, pipe capacity, potable certification, or Crown Road hydrologic link |
| `hydrology.cairnmarket_market_wash` | Proposed response to market/orchard hygiene | Clean draw → S16 inspection table → S11 market wash → removable silt/organic capture → proposed shallow stone soak field | Never crosses S12, mortuary tools, ash-evidence cleaning, or stock waste | No accepted outlet coordinate or engineering adequacy |
| `hydrology.cairnmarket_mortuary_isolation` | Hall ash trench plus accepted orchard burial-wash separation | S12/S15 covered wash and S04 evidence cleaning remain in separate sealed collection → removable mineral-bed/residue cassettes → controlled service removal | No connection to `hydrology.cairnmarket_crown_snowmelt` or `hydrology.cairnmarket_market_wash`; no discharge into orchard irrigation, public road, den habitat, or food store | No sewer, stream, deep aquifer, or treatment claim |

**[OPEN]** The current authority does not place a local spring, stream, culvert, sewer, or permanent outfall at Cairnmarket. Do not invent one. Brief thaw rills and tank overflow may terminate in local proposed spreaders only.

### 12.2 Heat and smoke

**[DESIGN CONSTRAINT]** The cairn hall uses a central grave-safe brazier and candle niches; the assize uses perimeter braziers. **[PROPOSAL]** Keep their service domains separate:

- the hall brazier warms the oath circle without crossing the animal winter route;
- store warmth is indirect and monitored; no open flame occupies S13;
- assize braziers stay outside ash-testimony airflow and never form a punitive fire ring;
- chimney/smoke behavior follows the hall smoke notch and open assize canopy;
- warm cairn cracks remain contextual local cues, not portable fuel nodes.

Ash from heat service uses marked physical containers distinct from testimony ash. Similar material does not imply shared custody.

### 12.3 Light hierarchy

1. Ash-filtered sky supplies cold ambient orientation.
2. Road and horizon gaps provide the strongest exterior wayfinding contrast.
3. Cairn candles identify custody and human tending at hand scale.
4. Witness lanterns identify occupied civic positions and the appeal route.
5. Braziers reveal service or hazard boundaries; they do not wash whole rooms.
6. Overlay light remains owned by the overlay and cannot recolor base navigation cues beyond a bounded state delta.

Every critical low-light cue requires a non-light companion: latch angle, chain position, frost continuity, open volume, sound cadence, or tactile silhouette.

### 12.4 Waste streams

- Pack waste leaves S16 on a downhill service route separate from tank draw and food inspection.
- Food compost is lidded, drained, and never stored in a family-cairn recess.
- Heat ash is cooled and contained separately from assize testimony ash.
- Evidence residue returns to custody or sealed removal; it never enters market sweeping.
- Mortuary wash remains sealed and separate from food wash.
- Broken slate is sorted into reusable wedges, fill, and contaminated discard; repair scars remain visible.
- Winter failure does not produce a generic garbage explosion. It produces specific shortages, sealed bins, altered pickup frequency, and attributable labor.

### 12.5 Service-route ownership

| Service | Primary route | Backup / fail-forward route | Collision to avoid |
|---|---|---|---|
| Pack delivery | R06 via N01–N09–N16 | Hold at S01, release through L15 when clear | Assize witness queue and living-gallery departure |
| Market food | N16–N11 after inspection | N16–N13 for sealed winter inventory | Mortuary wash and animal waste |
| Winter store | N16–N13 | Public issue N13–N11 only | General market browsing |
| Tank maintenance | S16 perimeter loop | S09 tool staging | Pack turn and food-clean threshold |
| Cairn custody | R05 | L19 to N16, then L15/L12 through the arrival fan | Active hearth and public market congestion |
| Den keeping | N16–N14 | Observe from S16 if gate closed | Public shortcut through protected wildlife interval |
| Assize evidence | N02–N03–N06 | Remove through N07 under witnessed state | Living gallery and market food route |
| Appeal / evacuation | N03–N07–N08 or N05–N07–N08 | Alternate public loop through S01 toward N09 | Evidence bay, ash chairs, and closed den route |

## 13. Activity phases and an inhabited settlement

### 13.1 Four canonical phase principles

| Phase | Canonical activity | Proposed spatial expression | Must remain true |
|---|---|---|---|
| `cold_morning` | Tanks measured; pack stock fed; cairn heat checked; yard peak | S16 busiest, S09 staging, S10 quiet inspection, S03 preparing | Service routes readable before crowds; no implied full-market opening |
| `market_day` | Slate/lichen exchange; road claims heard; winter closures posted without text; court peak | S03/S05 and S10/S11 occupied; S08 bypass actively marshaled | Road remains a route; non-textual closure evidence reads physically |
| `dusk` | Family cairns visited; road chains set; animal corridors cleared; ridge-route activity | Movement shifts to S12–S16 and S08; encounter overlays may become active | Safe cells and two departure directions remain readable |
| `winter_night` | Market closes; hibernation interval protected; warm stone watched; deliberate absence | S11 shutters; S14 closure dominates; only sparse keeper/witness light remains | Absence is authored, not empty-map neglect; resident emergency route survives |

**[DESIGN CONSTRAINT]** These phases are simulation contracts, not literal spawn schedules. **[PROPOSAL]** Implement them as compact occupancy, prop, audio, light, and route-state deltas over a stable base.

### 13.2 Five ordinary population roles

These are the five canonical population kinds expressed as production roles. They are not five named NPCs or fixed spawn counts.

| Role | Cold morning | Market day | Dusk | Winter night | Required visible evidence |
|---|---|---|---|---|---|
| A01 Goat and pack handlers | Feed, check hooves, measure stock draw at S16 | Deliver via R06; hold animals outside court | Clear animal corridor and set sheltered tethers | Emergency checks only; no public den crossing | Harness wear, separate trough, hoof stand, dung route, calm bypass behavior |
| A02 Slate cutters | Inspect frost-spall and sort repair stone | Exchange cut slate at S11; brace assize feet | Wedge road chains and shore soft shoulders | Withdraw from protected route | Different cut ages, splints, wedge bins, dust kept away from food |
| A03 Grave-lichen gatherers | Check drying humidity and sheltered growth | Trade measured dry frames at S11 | Withdraw frames from cairn-opening line | No gathering inside wildlife interval | Clean/dirty racks, clipped patches with recovery, no glowing-fungus shorthand |
| A04 Oath brokers | Prepare circle, witness jars, and separate custody hardware | Hear road claims across S03/S10 without merging institutions | Close records through token/prop state; keep appeal route open | Sparse emergency witness availability | Equal standing positions, blank physical tokens, no throne or readable docket |
| A05 Winter road keepers | Measure frost, tanks, and route shoulder | Marshal bypass and explain closure through hardware | Set chains, clear animal route, inspect detour | Watch warm stone and enforce deliberate no-footfall interval | Chain angle, frost continuity, detour wear, two-way emergency access |

### 13.3 Ambient-life density rules

**[PROPOSAL]** Population should be perceived through repeated service evidence rather than a literal 460–740 visible crowd. At LOD0, every ambient person must be attached to a task, destination, queue, conversation, animal, or maintenance object. At wider reads, smoke cadence, shutter state, pack calls, stacked goods, distant path use, and light ownership can carry population.

Do not use a uniform crowd pass. Market-day density belongs to court and market loops; cold-morning density belongs to the yard; dusk belongs to ridge routes; winter night is sparse by design. No phase may delete all signs of care.

### 13.4 Named quest actors and placement boundary

**[CANON]** Cairnmarket-hosted quest records involve King Ash Without Country, Enoch the Last Lamplighter, Eri Cinderglass, Hobb Marr, Dara Kest, Arden Pike, Iress Pike, Vela Shale, Pell Nacreyear, Iro Pennant, and Mara Quoin in various giver, supporting, returning, or participant roles.

**[PROPOSAL]** Provide conversation and staging sockets without asserting permanent residence:

- S10/S12 can host King Ash, Arden, Iress, or Dara only under the relevant quest state;
- S03/S04/S06 can host King Ash, Eri, Enoch, or Hobb for assize programs;
- S08 is the local handoff for Vela and corridor participants, while their exact external positions remain in the Wave04 program;
- no named actor blocks L05, L13, L14, either overlay's two independent egresses, or a safe-cell threshold;
- missing concept art or models must remain proxy-labeled; do not invent a named character's face, clothing, rig, or animation from prose alone.

**[NONCLAIM]** Quest participation does not prove that every named actor appears simultaneously or physically inside this precinct.

## 14. Four habitat envelopes

### 14.1 `habitat.cairnmarket_civic_edge` — Settled graven-upland civic edge

**[CANON]** Cairnmarket lies in `habitat.graven-upland`. **[PROPOSAL]** `habitat.cairnmarket_civic_edge` covers S01–S13 and S16 as an inhabited slate-upland edge. It supports people, goats, pack animals, lichen work, and transient non-hostile ecology. Hostile or quest-specific forms do not spawn inside its three safe cells merely because their broader habitat includes the territory.

Environmental cues: frost-spalled slate, handled warm stones, wet pine, short thaw rills, swept civic thresholds, pack traffic, and additive repairs. Counterplay is ordinary visibility and multiple public exits, not an invisible safe-zone aura.

### 14.2 `habitat.cairnmarket_cairn_beast_interval` — Cairn Beast winter-den interval

**[CANON/DESIGN CONSTRAINT]** Cairn Beasts occupy Graven March warm-cairn edges, black-pine dens, and closed winter roads; their family signature is stone mass carrying residual grave heat, pebble clicks, chest-stone sub-bass, lichen, warmed slate, and wet fur. The Winter Cairn Choir requires a complete no-footfall interval; grave heat is contextual and not portable.

**[PROPOSAL]** `habitat.cairnmarket_cairn_beast_interval` begins at S14 and extends into a transformable off-core ridge/basin reservation. Only entry state, first cue, keeper access, and safe-cell exclusion belong to the local precinct. Preserve one non-factional animal escape route. Do not distribute every Cairn Beast form around the market or convert the den gate into a generic monster door.

### 14.3 `habitat.cairnmarket_funeral_kite_orchard` — Funeral Kite grave-root orchard overlay

**[DESIGN CONSTRAINT]** `habitat.cairnmarket_funeral_kite_orchard` is the external `overlay.funeral_kite.cairnmarket_orchard`, anchored at the accepted roost semantic anchor. It supports four seasonal pollination lines. Its accepted encounter phase is dusk.

**[PROPOSAL]** The local precinct owns only S15, N17, the clean/dirty custody read, and overlay availability. Funeral Kites do not cross into S12, S13, or S16 as ambient decoration. The local habitat boundary must remain at least one readable threshold away from SC01–SC03.

### 14.4 `habitat.cairnmarket_acre_service_corridor` — Acre and quarantine-road service overlay

**[CANON/DESIGN CONSTRAINT]** The Acre That Walks uses maintained road margins, disputed fields, unclaimed burial routes, famine-field boundaries, and shared harvest corridors. Exactly one Acre occupies the accepted setpiece population envelope. It moves one legal corner at a time while the other three remain load-bearing.

**[PROPOSAL]** `habitat.cairnmarket_acre_service_corridor` attaches at S08/N18 and remains outside the local traversal graph. The public bypass, stock separation, former-return direction, receiving-handoff direction, and non-factional escape/retreat route must stay readable. The Acre is not a building, vehicle, mount, terrain tile, or generic boss arena.

### 14.5 Habitat exclusions

- No hostile form enters SC01–SC03 unless a later accepted state explicitly phases that cell out of safe use.
- `habitat.cairnmarket_cairn_beast_interval` never crosses an active hearth or uses S11 as an animal shortcut.
- `habitat.cairnmarket_funeral_kite_orchard` never treats names, bodies, or grave markers as collectible clutter.
- `habitat.cairnmarket_acre_service_corridor` never spreads continuous Acre soil across the whole road landscape.
- Funeral Kite and Acre encounters do not overlap each other in the local core.
- Regional creature eligibility is not permission to populate every eligible species. The first packet stages only the two accepted encounter overlays plus bounded Cairn Beast cues.
- Ordinary goats and pack animals remain visually distinct from Cairn Beasts; stone mass and grave heat are not costume pieces for livestock.

## 15. Three local safe cells and two external safe-observation cells

### 15.1 Local candidates

| Safe cell | Space | Capacity target | Active phases | Protection read | Exclusions |
|---|---|---:|---|---|---|
| SC01 Living Witness Shelter | S05 | 24 | All four | Wind-break; independent traversable exits through L03 to N03 and L20 to N07; direct sight to L05 | No ash testimony, evidence storage, Funeral Kite, Acre, or Cairn Beast spawn |
| SC02 Market Hearth Margin | S11 | 18 | Cold morning, market day, dusk; contracted winter footprint | Two exits, low warming stone, visible service door | No open flame in store path, no hostile ecology, no stock tether |
| SC03 Winter Store Vestibule | S13 | 12 | All four, highest priority winter night | Dry raised floor, N11 and N16 approaches, ration station | No contaminated goods, mortuary tools, combat cover, or cinematic lock-in |

**[PROPOSAL]** Safe cells are social/refuge candidates, not invulnerability volumes. Their boundaries must be physically readable through shelter, occupancy, sightlines, and route redundancy.

### 15.2 External accepted safe cells

- `safe_cell.v6.cairnmarket_grave_root_orchard.refuge_a` belongs to the orchard graph.
- `safe_cell.v6.bellwater_mobile_service_corridor.handoff` belongs to the corridor graph.

**[NONCLAIM]** N17/N18 do not import these cells into Cairnmarket. The precinct may display their availability or direction but cannot duplicate their geometry, capacity, barrier, or hazard proof.

## 16. Two encounter envelopes

### 16.1 E01 — Funeral Kite recognition and claim

**[CANON/DESIGN CONSTRAINT]** `encounter.graves.funeral_kite` is anchored to the orchard roost and four root lines during `dusk`. Exact cue: “One blank tab folds inward while every other tab streams outward.” Exact counterplay: present an item tied to the targeted dead, making the inward tab claimed and too heavy for the dive.

**[PROPOSAL]** Local staging requirements:

- S15 gives a pre-entry cue through one slack route line, stopped spore chime, and changed airflow; it does not stage the attack itself.
- The full threat and counterplay volumes remain external.
- The cue must be readable without color and before the player enters threat reach.
- One claimed tab halts its exact route; other routes continue.
- The retreat direction resolves toward external service and its safe cell, never by teleporting the creature or resetting the orchard.

Forbidden substitutions: bird anatomy, generic flying swarm, ghost, collectible-name hunt, four identical combat lanes, or a universal blight applied when one line fails.

### 16.2 E02 — Acre corner motion and service debt

**[CANON/DESIGN CONSTRAINT]** `encounter.acre.service_motion` activates at dusk. Exact cue: “Exactly one corner stake uproots while the other three remain load-bearing.” Exact counterplay: move a seed marker beyond the lifted corner before it lands, expanding the legal harvest boundary away from combatants.

**[PROPOSAL]** Local staging requirements:

- S08 provides a long oblique view of the one lifted corner, three load-bearing corners, public bypass, and both return directions.
- The Acre remains one rectangular plot; no second Acre, head, face, limbs beyond four posts, rider, house, or vehicle silhouette.
- Five service rigs remain outside the creature's anatomy and visually distinct from one another.
- The player can retreat into the corridor's external handoff safe cell or return toward Cairnmarket without crossing the lifted corner.
- A service failure changes a typed service state and visible obligation; it does not become a generic health-phase explosion.

### 16.3 Encounter separation

The two encounters may share regional slate, pine, weather, and dusk conditions. They may not share a copied arena, objective order, counterplay prop, failure effect, or creature locomotion grammar. E01 is recognition, weight, and ecological line cessation. E02 is corner translation, service continuity, and accountable outage.

## 17. Six state machines and persistent world deltas

| State machine | Proposed states | Inputs | Affected local elements | Fail-forward rule |
|---|---|---|---|---|
| SM01 Unused-road frost | disturbed / recovering / continuous-no-footfall | phase, traffic, winter-ecology state | S01, S08, S14 approach, route decals/audio | A broken interval reroutes traffic or delays ecology; it does not instantly repaint frost |
| SM02 Public access chain | open / marshaled / winter-detour / emergency-release | market phase, hearing, winter closure | L11, L12, L14, L15; chain props | Public closure never seals residents; at least one public and one resident route survive |
| SM03 Cairn custody and den disturbance | sealed / witnessed-cairn-open / den-protected / disturbance-recorded | season, custody, ecology | L08, L10, S12, S14 | Disturbance changes custody evidence and keeper labor, not a resettable lock puzzle |
| SM04 Pack-route detour | normal / market-metered / ecology-detour / emergency | crowds, road state, animal interval | L12, L15, L19, S16 wear/occupancy | Detour wear, deliveries, and shortage remain visible after failure |
| SM05 Orchard overlay adapter | unavailable / reserved / pinned / active / fallow-return | external graph availability and accepted outcome | N17, S15, L18 cue only | Local adapter persists accepted status; never synthesizes external graph state |
| SM06 Acre overlay adapter | absent / approach / corner-motion / handoff / split-service | external graph availability and accepted outcome | N18, S08, bypass marshaling | Local road reflects typed outage or handoff; never invents service completion |

**[PROPOSAL]** A state change must update route state, occupancy, service props, sound, light, and evidence together under one phase/state identity. Avoid state bundles that change only banners, tint, or exposition.

**[NONCLAIM]** This table does not define an engine state schema, event bus, persistence implementation, replication model, or save migration.

## 18. Three earlier quest reservations at the precinct

The initial machine-readable Wave03D proposal may crosswalk only the two fully bound Wave04 graphs, but the base architecture must not destroy three earlier accepted Cairnmarket programs.

### 18.1 `side_the_dead_vote_no` — The Dead Vote No

**[CANON/DESIGN CONSTRAINT]** The `countryless_assize` is a 72 × 54 × 24 m roadside civic-hearing envelope bound to `graven_road_assize`. Three extinct councils speak through incompatible ash deposits while living descendants contest each settlement's chair. The mechanic verifies posthumous civic consent. Disturbing one ash testimony erases that dead vote but strengthens the replacement descendant claim.

**[PROPOSAL]** Reserve S03–S07 and the open center of the witness ring for this program. S04 must accept three materially distinct ash deposits. S05 supplies the living-descendant contest edge. S06 supplies evidence custody. S07 keeps appeal and public-road return visible. Do not permanently install quest-specific supernatural effects in the base court.

Forbidden substitution: ghost-vote mystery, spectral courtroom, one merged ash electorate, or a boss fight whose defeat decides jurisdiction.

### 18.2 `aftermath_cart_accepts_office` — The Cart Accepts Office

**[CANON/DESIGN CONSTRAINT]** The `stationary_cart_assize` is an 82 × 64 × 42 m vehicle civic-hearing envelope bound to `graven_road_assize`. A cart remains motionless above the assize while doors, shadows, tax seals, and ruined bricks orbit as weighted evidence around one axle. The mechanic authors precedent on a rotating docket. An unbalanced wheel makes the heaviest exhibit a permanent presumption later claimants must disprove.

**[PROPOSAL]** Preserve a clear vertical volume over S03 and removable sockets around its perimeter. S06 stores exhibits without mixing them; S05 keeps public witnesses outside the orbit; S07 remains the appeal/return route. Any support, suspension, or VFX belongs to the quest overlay and cannot become permanent assize structure without acceptance.

Forbidden substitution: escort, route-planning activity, drivable cart, rotating courtroom building, or a generic physics puzzle.

### 18.3 `regional_cairns_keep_winter` — The Winter the Cairns Learned to Keep

**[CANON/DESIGN CONSTRAINT]** The `graven_march_black_pine_occlusion_basin` is a 620 × 480 × 130 m seasonal ecology basin bound to `graven_cairn_hall`. Five black-pine shadows eclipse a basin in sequence; dormant stones lift one note only when the last road falls still. A premature cadence places one public road into non-destructive stone torpor until the next seasonal window, rerouting trade while hibernation continues.

**[PROPOSAL]** The local precinct supplies S14, S16, SM01–SM04, road closure evidence, keeper staging, and a transformable outward route. The full basin remains outside the sixteen-space core. The accepted regional keyframe directs its visual language. A premature cadence should alter road wear, detour labor, inventory timing, and keeper presence in Cairnmarket rather than resetting the basin.

Forbidden substitution: burial drama, corpse transfer, heat-item collection, choir combat, blue magic fog, or an invisible quest boundary that simply forbids walking.

### 18.4 Reservation rule

**[NONCLAIM]** This dossier does not create executable objective crosswalks or local graph ownership for these three programs. It preserves compatible space, sightline, state, and service sockets only. Promotion requires exact quest-record hashes and whatever accepted graph evidence applies at that time.

## 19. Wave04 external overlay evidence chain

### 19.1 Hash-only graph contract

| Overlay | Quest | Canonical program-record SHA-256 | Canonical directed-graph-record SHA-256 | Graph evidence | Local proxy |
|---|---|---|---|---|---|
| O01 Grave-root orchard | `regional_the_graves_grew_upward` | `e56f75bec21bfb739b916fd7bf22d52858c0f7b5574c60348c5f6669425ad593` | `9b8244eb3af7ca934771e10ab2480204dbdd2a77b740db89992face8e86011c0` | 20 nodes, 51 directed edges, one strongly connected component | N17 at S15 |
| O02 Bellwater mobile service corridor | `relic_the_acre_crossed_a_border` | `6589dc6e2ab48073840ccc7eaa8f8810aae1311f2f6868aef910dcd94f6cc7c7` | `52d91fd4173d6e510c2939414bb408d3c23469e4bfc1af7272a5681695237cd2` | 21 nodes, 51 directed edges, one strongly connected component | N18 at S08 |

The corresponding canonical quest-record hashes are:

- `regional_the_graves_grew_upward`: `8f558a0cdb859a306c2b89dbca510dcee26946ac30e5b68a24bca5eb444ce8a6`;
- `relic_the_acre_crossed_a_border`: `ae91ce7b5aa41f99852debd0b82755644a642ae165e55445a5d925cc1f09d6ec`.

**[DERIVED]** Combined source evidence is 41 nodes, 102 directed edges, 17 objective endpoints, 10 utility endpoints, 2 safe-observation cells, 4 independent egress paths, 2 habitat anchors, and 2 encounter contracts.

**[NONCLAIM — HARD BOUNDARY]** Those numbers are external expected counts, not local counts. N17/N18 must not contain, regenerate, reorder, mirror, approximate, or relabel source nodes or edges. The future site payload should bind the exact source selector and canonical-record hash, then map only accepted semantic interfaces.

### 19.2 Minimum local interface contract

O01 may map only these local meanings:

- public/custody approach at S12–S15;
- clean delivery and store support through S16/S13;
- overlay availability and fallow-return status at N17;
- direction to two external egresses and one external safe cell, without copying them;
- named-actor staging outside the external graph until it is pinned.

O02 may map only these local meanings:

- Bellwater approach and traffic bypass at S01/S08;
- Cairnmarket-side service support and road-keeper activity at S16;
- overlay availability, corner-motion, handoff, or split-service status at N18;
- direction to former and receiving returns, without claiming which settlement geometry lies beyond;
- named-actor staging outside the external graph until it is pinned.

## 20. Grave-root orchard architecture and operations

### 20.1 Accepted external envelope

**[DESIGN CONSTRAINT]** The orchard is a specialized subterranean compound with a 290 × 214 × 38 m envelope and provisional elevation 198–236 m. It inherits oath entry, family-cairn gallery, and winter-store functions from the cairn hall while adding four pollination lines, root support, irrigation, food wash, mortuary separation, worker lifts, and collapse refuges.

Geology is bedded slate with mapped ash pockets and shallow stable voids—explicitly no invented karst. Root trays hang from slate ribs and independent grave piers. Roof ribs are monitored and root loads capped per bay. The interior is humid against a cold, dry exterior. Fire strategy uses four compartments, wet root breaks, and smoke exhaust. Food root, burial wash, worker wash, and waste remain separate.

**[NONCLAIM]** The 210 kPa bearing assumption, compartment strategy, and drainage language are design inputs in the accepted program, not structural, geotechnical, fire-code, or sanitation certification.

### 20.2 Twenty semantic-anchor obligations

This table explains function without copying coordinates or route geometry.

| Anchor key | Accepted kind / state | Production interpretation |
|---|---|---|
| `delivery` | Market delivery; pack-stock turn | A dirty arrival surface with turning clearance and lift choice |
| `entry` | Market-oath entry; public/worker split | Custody threshold where visitors and labor visibly diverge |
| `lift_a` | Worker lift; manual counterweight | Person/tool movement; manual, inspectable, never magical elevator |
| `lift_b` | Store lift; food only | Clean-food movement isolated from mortuary and worker waste |
| `wash` | Food wash; clean/dirty threshold | Raised clean surface, dirty-return path, isolated drain |
| `store` | Winter food store; clean food only | Dry accountable inventory with a protected distribution route |
| `mortuary` | Burial wash; separate drain | Screened work, distinct tools, sealed residue handling |
| `service` | Vent/irrigation gallery; maintenance only | Staff base, valve/airflow access, roof monitoring |
| `roost` | Funeral Kite roost; blank-tab protected | Four route starts, no public name display, no bird architecture |
| `root_a` | Pollination root line A | One physically distinct cultivation and airflow route |
| `root_b` | Pollination root line B | Distinct line; must not be a copied visual clone of A |
| `root_c` | Pollination root line C | Distinct line with separate load, yield, and failure evidence |
| `root_d` | Pollination root line D | Distinct line; one-line cessation remains locally readable |
| `fallow` | Memorial fallow line; failure mutation, no harvest | Non-harvestable, still drained, never reconnected to store/irrigation |
| `refuge_a` | Collapse refuge; fire/roof protected | Accepted safe-observation cell and emergency command station |
| `refuge_b` | Collapse refuge; fire/roof protected | Independent shelter supporting a different egress domain |
| `egress_domain_a` | Protected egress interior vertex | External route proof only; no local proxy geometry |
| `egress_domain_b` | Protected egress interior vertex | Independent failure-domain proof only |
| `egress_a` | West slate egress; fail-open | One external destination, step-free in accepted graph evidence |
| `egress_b` | East store egress; fail-open | A different external destination and failure domain |

### 20.3 Interior construction and room-read grammar

**[PROPOSAL]** Although the overlay graph owns exact placement, the following visual hierarchy should guide its later blockout:

1. The entry and delivery band is cold, hard, broad, and visibly connected to Cairnmarket labor.
2. Four root trays occupy separate terraced bays. Each hangs from readable slate ribs and lands on independent grave piers; they are not one continuous natural cave garden.
3. A higher vent/irrigation gallery overlooks load, spore, and route state without becoming a combat balcony.
4. Food wash and store share clean logistics but never share a drain or threshold with mortuary wash.
5. The roost is readable from more than one route, while blank tabs remain protected from public inventory.
6. Two refuge masses are structurally and visually independent. Each points toward a different fail-open egress.
7. The fallow line remains maintained, drained, and mourned even when it produces no food.

Use ordinary railings, manual hoists, sack dimensions, washable surfaces, root-prop wedges, roof gauges, and worker clearances to establish scale. Do not make roots or fungi glow to explain the system.

### 20.4 Five utility endpoints

The accepted external utility graph exposes irrigation, food wash, winter heat, lift power, and mortuary wash. Preserve each as an independently attributable system. `Lift power` may be manual/counterweighted mechanical service; it is not permission for electricity or powered elevators. The local precinct may show inputs or handoff cues but does not own these endpoints.

### 20.5 Hazards and fail-forward service

Accepted hazards are roof spall, root overload, spore density, burial contamination, lift failure, and famine. Each needs a pre-event cue, bounded effect, alternate route or work response, and persistent evidence:

- roof spall: dust, sound, gauges, propped bay, route exclusion;
- root overload: bent hanger, changed drainage, capped bay, redistributed labor;
- spore density: airflow tell, masks/veils, route timing, no generic poison fog;
- burial contamination: isolated tools, closed clean threshold, visible quarantined bed;
- lift failure: hand-braked platform and alternate carry route;
- famine: measurable store gap, changed ration labor, preserved dignity rather than decorative starving bodies.

After failure, ventilation, drainage, wash separation, store access, detours, and both egress paths continue. Black fallow drains but never reconnects to irrigation or food store.

### 20.6 Seasonal population and absent-player continuity

**[DESIGN CONSTRAINT]** The accepted overlay phases bind to Cairnmarket's four activity phases:

| Overlay phase | Canonical site phase | Workers | Visitors | Creatures | Read |
|---|---|---:|---:|---:|---|
| Winter bed | `winter_night` | 18 | 0 | 0 | Warm-stone refuge watched; routes quiet |
| Thaw routes | `cold_morning` | 28 | 8 | 8 | Seep, irrigation, and roost movement rise |
| Bloom forecast | `market_day` | 36 | 36 | 18 | Spore, labor, and market interface peak |
| Claim interrupt | `dusk` | 28 | 12 | 17 | One exact route may cease; recognition cue dominates |
| Harvest | `market_day` | 36 | 36 | 12 | Food hygiene, lift load, store accounting peak |

These are overlay population envelopes, not spawn guarantees. Root tending, mortuary work, distribution, roost protection, roof monitoring, and fallow continue while the player is absent; a claimed route stops immediately even offscreen.

## 21. Bellwater mobile service corridor architecture and operations

### 21.1 Accepted external envelope

**[DESIGN CONSTRAINT]** The corridor is a 520 × 120 × 24 m mobile regional-road reservation at provisional elevation 202–226 m. It uses packed slate road over frost-susceptible grave loam with mapped culverts. Its service structures use temporary outriggers and seed-marker pads, not permanent building footings.

The accepted structural rule is three load-bearing Acre posts plus one moving corner. Weather is cold crosswind, frost, and dusk snow. A moving fire cart and an 8 m road fire lane are part of the program. Potable service stays separate from convoy, livestock, and mortuary waste.

**[NONCLAIM]** The 140 kPa bearing assumption, mapped-culvert language, fire lane, and service capacities are authored program constraints, not real engineering or final terrain evidence.

### 21.2 Twenty-one semantic-anchor obligations

| Anchor key | Accepted kind / state | Production interpretation |
|---|---|---|
| `entry` | Corridor entry; traffic control | Clear marshal point before any corner moves |
| `bypass` | Traffic bypass; open except crossing marshal | Public/emergency route remains visible and usable |
| `former` | Former service tie-in; minimum services | Shows who still waits after the Acre moves |
| `handoff` | Receiving service yard; operators/capacity | Accepted safe-observation cell and final accountability point |
| `outage` | Former-site outage bay; typed response | Different physical evidence for each service loss |
| `split` | Split-service failure; typed mutation | Capped ends and explicit temporary restoration, not broken generic pipe |
| `maintenance` | Mobile service gantry; moving access | Manual, stabilized, tied to one corner operation |
| `stock` | Convoy livestock yard; separate water/waste | Keeps animals and waste out of potable/service lanes |
| `corner_nw` | Acre northwest corner; school transfer | Exactly one of four legal corners; school only |
| `corner_ne` | Acre northeast corner; water transfer | Water only; habitat anchor for the Acre overlay |
| `corner_se` | Acre southeast corner; fire transfer | Fire only; emergency bypass must remain open |
| `corner_sw` | Acre southwest corner; burial/tax separate | Shared corner, two independent obligations |
| `school` | School rig; NW only | Capacity 24 against demand 24 |
| `water` | Water rig; NE only | Capacity 5,200 against demand 4,300 in accepted program units |
| `fire` | Fire rig; SE only | Capacity 8 against demand 8 |
| `burial` | Mortuary rig; SW separate | Capacity 6 against demand 4 |
| `tax` | Tax-appeal rig; SW separate | Capacity 36 against demand 24 |
| `egress_domain_a` | Protected interior vertex | External proof for former-return failure domain |
| `egress_domain_b` | Protected interior vertex | External proof for receiving-return failure domain |
| `egress_a` | Former return; fail-open | One accepted step-free egress destination |
| `egress_b` | Receiving return; fail-open | Independent accepted step-free destination |

### 21.3 Five services remain five

**[DESIGN CONSTRAINT]** Transfer order is northwest school, northeast water, southeast fire, and southwest burial plus tax. Burial and tax share one moving corner but remain separately owned, routed, metered, and restorable.

**[PROPOSAL]** Give every service a distinct non-textual physical grammar:

| Service | Shape and material cue | Sound cue | Outage evidence | Forbidden merge |
|---|---|---|---|---|
| School | Low lesson bench, blank counting stones, broad weather hood | Human cadence, slate pieces, canvas strain | Empty lesson position and sheltered return stop | Never a church, barracks, or tax queue |
| Water | Lidded snowmelt tank, carrying bar, capped hose/pipe, clean stand | Tank knock, controlled pour, valve clack | Capped end, minimum draw station, timed queue | Never shares livestock or mortuary drain |
| Fire | Low grave-safe braziers, ash trays, bell/cart clearance | Bell, wheel brake, contained crackle | Missing response position and marked clear lane | Never becomes attack magic or furnace |
| Burial | Cairn bowl, blank portable markers, screened mortuary cart | Cloth, stone set, low wheel | Border lay-by and protected remains route | Never merged with tax because of shared corner |
| Tax appeal | Unmarked iron tally weights, equal standing shelf, blank token sockets | Weight set, latch, quiet witness cadence | Receiving-only appeal position and return obligation | Never readable coin booth or written ledger |

Color may reinforce these cues but cannot carry identity alone.

### 21.4 Acre silhouette and motion law

**[CANON/DESIGN CONSTRAINT]** Exactly one Acre is present. It is a rectangular field that advances one fence-post corner at a time. Three posts bear the boundary while the fourth uproots, advances, and redraws one corner. Exact cue: one corner stake uproots while the other three remain load-bearing.

**[PROPOSAL]** The creature must read as exhausted land, not a walking pavilion. Its four posts are boundary supports, not legs arranged into animal anatomy. Service rigs, people, carts, and shelters stand beside or around it; they are obligations, not organs. Inverted roots and field edge must remain bounded to the Acre's rectangle and not tile the landscape.

At every corner move:

1. three bearing points remain visibly planted;
2. one corner clears the ground;
3. its exact service transform becomes active;
4. seed-marker state is readable before landing;
5. bypass and two independent return directions remain comprehensible;
6. a typed outage can persist behind the movement.

### 21.5 Drainage, sanitation, and hazard response

Clean road runoff follows the road crown to accepted mapped-culvert logic away from the water rig. Livestock and mortuary waste use separate sealed carts. Stock yard and mortuary outbound movement use the bypass without contaminating potable service.

Accepted hazards are moving property corner, service outage, convoy collision, livestock panic, and frost heave. Stage each through specific physical cues:

- moving corner: lift clearance, seed-marker pocket, audible soil/root strain;
- service outage: typed capped end, empty capacity position, staffed response;
- convoy collision: brake space, marshal sightline, no arbitrary cart barricade;
- livestock panic: quiet holding pocket and alternate handler path;
- frost heave: road-edge wedges, changed cart line, visible shoulder repair.

If service splits, the bypass, returns, stock handling, five individual minimums, and capped split remain functional. The Acre may continue under the accepted state; the local precinct must not fabricate completion.

### 21.6 Overlay phases and absent-player continuity

| Overlay phase | Canonical site phase | Workers | Visitors | Acres | Read |
|---|---|---:|---:|---:|---|
| Corridor open | `cold_morning` | 26 | 38 | 1 | Road, bypass, stock, gantry, and service checks ready |
| First corners | `market_day` | 34 | 52 | 1 | School and water transfers raise crowd/traffic load |
| Outage response | `market_day` | 38 | 48 | 1 | Typed failure and former-site debt become visible |
| Final corners | `dusk` | 30 | 32 | 1 | Fire, burial, and tax separations dominate |
| Handoff | `winter_night` | 18 | 16 | 1 | Movement stops before deliberate-absence interval; responsibilities persist |

The bypass, stock care, culvert watch, former minimums, and service meters continue while the player is absent. If the player is absent during motion, the Acre pauses at a safe three-post state.

## 22. Seventeen-objective quest-environment crosswalk

Objective wording, order, and rules below are canonical. Local-support assignments are proposals and do not replace accepted external endpoint bindings.

### 22.1 `regional_the_graves_grew_upward` — eight objectives

| # | Canonical objective type | Canonical target and rule | Proposed Cairnmarket support | External ownership |
|---:|---|---|---|---|
| 1 | `winter_prepare_grave_root_beds` | Burial hygiene, ventilation, and fallow rows; no food root crosses active burial wash or named-grave threshold | S12/S15 custody read; `habitat.cairnmarket_funeral_kite_orchard` unavailable until separation reads | External wash, mortuary, service, and fallow anchors |
| 2 | `thaw_release_blank_tab_routes` | Roost to four lines; preserve item-claim counterplay at every tab | S15 airflow/slack-line preview | External roost and four root routes |
| 3 | `first_bloom_balance_spores_and_market_labor` | Root support, irrigation, and lifts; market continues while workers have two independent refuges | S11/S13/S16 market and store pressure | External supports, irrigation, lifts, refuges, egress |
| 4 | `forecast_winter_yield_from_live_routes` | Food store and funeral detours; yield uses route-hours, never exposed-name count | S11/S13 inventory gap and distribution queue | External live-route accounting and detours |
| 5 | `honor_midseason_name_claim` | One heavy tab and exact line; decisive beat, that line stops immediately | S12 portable-marker socket; SM05 records bounded interrupt | External exact tab, line, fallow, and counterplay volume |
| 6 | `replan_remaining_ecology` | Kite roosts, spore density, worker lanes; never copy another dead person's route | S15 work/visitor separation and changed shift arrival | External ecology replan and route graph |
| 7 | `harvest_with_food_mortuary_separation` | Stores, wash, lifts, market distribution; contaminated beds stay visible and outside ration count | S16 clean inspection, S13 dry store, S11 distribution | External wash, lift, bed, contamination evidence |
| 8 | `leave_winter_fallow_or_named_debt` | Orchard after population departure; end on ecology and ration consequence, not covenant vote | S13 ration state, S14 winter absence, S15 fallow-return cue | External terminal seasonal state and persistent evidence |

### 22.2 `relic_the_acre_crossed_a_border` — nine objectives

| # | Canonical objective type | Canonical target and rule | Proposed Cairnmarket support | External ownership |
|---:|---|---|---|---|
| 1 | `open_regional_moving_corridor` | Bellwater chainage, detour, convoy, livestock; traffic, emergency bypass, service access work before a post lifts | S01/S08 and R01/R08 expose approach and bypass | External corridor, convoy, stock, gantry graph |
| 2 | `move_northwest_corner_school` | School source, destination, seed marker; only school transfers on NW move | N18 reports phase; S08 keeps school traffic separate | External NW corner, school rig, transforms |
| 3 | `move_northeast_corner_water` | Cistern source, pipe dependency, seed marker; minimum potable service at both ends | S16 tank work supplies regional visual grammar only | External NE corner and water system; no local system substitution |
| 4 | `respond_to_former_site_outage` | Specific lost service; restore minimum or record outage, never redraw title | S08 former-direction cue; SM06 typed outage state | External outage bay, completion evidence, service graph |
| 5 | `move_southeast_corner_fire` | Watch bell, cart clearance, seed marker; emergency bypass stays open | R01 bypass remains unobstructed | External SE corner, fire rig, fire-lane proof |
| 6 | `move_southwest_corner_burial_and_tax` | Separate mortuary and levy dependencies; shared corner but separate ownership, routes, meters, restoration | S08 gives two distinct visual/service directions | External SW corner, burial rig, tax rig, separate utilities |
| 7 | `keep_mobile_public_ingress_and_egress` | Acre population one, convoy, stock; people enter/leave without crossing lifted post | R01 and S08 preserve local return direction | External moving ingress, two egresses, safe cell |
| 8 | `restore_former_settlement_minimums` | Five typed outage nodes; no service detached merely for affordability | S08 displays former-return state without claiming repair | External five endpoints and restoration proof |
| 9 | `complete_receiving_shift_handover` | New operators, capacities, return convoy; end with continuity measurements, not property ruling | N18 reports handoff; Cairnmarket traffic returns through S08 | External receiving yard, tax support, terminal evidence |

### 22.3 Anti-copy contract

The two quests must remain structurally different:

- Orchard: seasonal cycle, four ecological lines, a midseason recognition interrupt, resource rationing, and non-terminal operational outcome derivation.
- Acre: linear/branching five-service transfer, four corner moves, a former-site outage interrupt, population-service relocation, and an explicit terminal handoff choice.

Do not reuse one quest's lane count, cue prop, safe-cell silhouette, failure VFX, NPC choreography, or objective camera blocking for the other.

## 23. Fail-forward staging and persistent consequence

### 23.1 Orchard outcome states

**[CANON]** `regional_the_graves_grew_upward` writes `pallid_root_covenant` with four possible values. **[PROPOSAL]** Express each as a bounded delta over the same maintained architecture:

| Canonical outcome | Orchard evidence | Cairnmarket evidence | Continuing burden |
|---|---|---|---|
| `anonymous_pollination_with_tending_share` | Four protected blank-tab routes; tending-share stations occupied | S11/S13 show improved but accountable food flow | Anonymous routes remain protected; tending labor and debt stay visible |
| `named_plots_relocated_with_portable_markers` | Exact claimed routes stop; portable marker sockets occupy named tending stops | S12 gains two occupied portable-marker positions; S13 distribution changes | Relocation requires ongoing seasonal tending and custody |
| `root_routes_cessate_and_winter_rations_contract` | Ceased lines remain maintained and crossed out through physical route state | S13 stock gap and S11 smaller issue surface | Winter ration contracts; shortage is not hidden by fresh dressing |
| `orchard_fallow_with_household_aftercare` | Cultivation pauses; drainage, refuges, mortuary separation, and household access continue | S15 shows fallow-return; market receives care supplies rather than harvest | Aftercare labor continues without pretending the orchard succeeded |

**[CANON]** The failure-continuation evidence records `winter_ration_fraction = 0.72`; the world-readable proof includes two relocated family markers and ceased root routes. **[PROPOSAL]** Show `0.72` through a physical proportion—twelve equal ration sockets with roughly three left empty is not exact enough and would misstate the number. Use a purpose-built non-textual measure whose accepted art/interaction review confirms the ratio before promotion. Until then, show a clear but unquantified shortage and retain the exact value in metadata only.

### 23.2 Acre outcome states

**[CANON]** `relic_the_acre_crossed_a_border` writes `walking_acre_service_title` with three possible values:

| Canonical outcome | Corridor evidence | Cairnmarket edge evidence | Continuing burden |
|---|---|---|---|
| `five_services_cross_with_former_site_outages` | All five receiving rigs active; specific former outages capped and staffed | S08 shows traffic return plus former-direction service calls | Former settlement still receives explicit outage response and return stops |
| `acre_halts_and_services_split` | Acre rests on three posts before border; service rigs occupy visibly divided accountable positions | N18 reports split; S08 keeps bypass and both directions open | Capped ends, named outage classes, and temporary restoration routes persist |
| `soil_returns_while_school_and_fire_remain_mobile` | Soil returns; school and fire continue with mobile infrastructure; water, burial, tax remain at accountable stations | S08 separates mobile convoy from fixed return traffic | Neither mobility nor return cancels service duty |

**[CANON]** Failure persistence records `mobile_service_partition = school_fire_mobile_water_origin_burial_border_tax_receiving`. **[PROPOSAL]** The physical scene should let a reviewer distinguish each clause without text: two mobile rigs, one former-origin water minimum, one border mortuary lay-by, and one receiving tax-appeal station.

### 23.3 General fail-forward law

For every failure:

1. Preserve at least one primary route, one service/risk route, and one return route.
2. Keep ordinary life operating at reduced or redirected capacity.
3. Change the exact prop, threshold, service, habitat, or evidence surface that failed.
4. Preserve the consequence across departure and return in the next accepted state representation.
5. Do not punish failure by deleting all actors, sealing all doors, or converting the site into generic combat rubble.
6. Do not erase a successful outcome's cost with festive dressing.
7. Keep local and external state ownership separate: SM05/SM06 reflect accepted overlay results; they do not calculate them.

## 24. Environmental storytelling and ambient life

### 24.1 Five-layer evidence stack

| Layer | Cairnmarket placement | Reviewer question |
|---|---|---|
| Substrate and deep history | Slate bedding, ash pockets, oldest road crown, original tank plinths | What did the land allow before current institutions? |
| Failed institution | Moved assize sockets, distinct ash chairs, obsolete custody recesses, disused road surfaces | What system failed, and what physical rule survived? |
| Ordinary survival | Harness repair, tank measurement, food inspection, lichen drying, snow clearing, warming stones | Who keeps this place alive today? |
| Current dispute | Chain position, open/closed cairn course, portable markers, typed outage kit, roost protection | What is contested now, and who bears the work? |
| Player consequence | Changed detour wear, ration inventory, ceased route, service cap, staffed return point | What changed because of the player's decision? |

### 24.2 Zone sensory matrix

| Space group | Light | Sound | Smell | Weather/air | Silence that must remain meaningful |
|---|---|---|---|---|---|
| S01/S08 road edge | Cold open sky, hooded road lamps | Hard slate footfall, harness metal, wheel brake, distant pine strain | Rain on slate, wet tack, cold resin | Ridge gust and sleet | A closed lane lacks wheel and hoof rhythm |
| S02–S07 assize | Neutral sky slots, low perimeter practicals | Chair scrape, separate ash sift, jar lid, open-road wind | Cold ash, pine, damp canvas, restrained wax | Wind crosses canopy but not living shelter | Verdict pause never erases appeal-door cue |
| S09–S13 hall | Candle niches, smoke-notch shaft, handled-stone warmth | Low voices, sack set, stone click, brazier draw | Grave lichen, rye dust, warm slate, old ash | Sheltered, cooler near cairn line | Custody opening makes tools stop before stone moves |
| S14–S16 seasonal seam | Sparse keeper lamps, tank reflections | Tank knock, hoof, frost broom, distant chest-stone sub-bass | Snowmelt, grave loam, wet fur, resin | Dead calm can replace ridge gust | Hibernation interval removes footfall but retains safe feedback |
| O01 interface | Cold threshold against humid root breath | Vent cadence, line tension, spore chime state | Wet slate, root loam, clean wash vs sealed mortuary materials | Condensation at boundary, no cave mist | One ceased line loses its exact chime/airflow only |
| O02 interface | Dusk snow, low service lamps | Corner strain, separate service cadences, marshal calls | Frost grit, stock, clean water, sealed waste | Crosswind over road | A typed outage removes one cadence, not all sound |

### 24.3 Ambient interactions

**[PROPOSAL]** Use short, system-owned interactions that can occur without becoming quests:

- a handler pauses a pack string before the living-gallery departure path clears;
- a slate cutter replaces one jurisdiction-frame wedge, revealing an older socket beneath;
- a lichen gatherer moves a drying frame when tank overflow raises local humidity;
- an oath broker resets blank physical tokens after a hearing without reading a docket;
- a road keeper compares frost continuity on the closed lane with hoof wear on the detour;
- a witness warms hands at S05, then leaves through the appeal route without entering the market;
- a child or small resident carries a light object through the market loop, establishing scale without becoming a setpiece;
- pack animals refuse the cold den threshold before a keeper intervenes;
- market workers reduce exposed goods when sleet begins;
- a sealed mortuary container passes through its own route while food delivery waits at the clean threshold.

Each interaction must have an origin, destination, prop, and exit. Do not spawn pantomime loops in blocked doorways or safe-cell centers.

### 24.4 Maintenance cadence

This cadence is a proposal for visual variation, not a canonical seven-day calendar:

- before market: tank draw, road sounding, frame-foot inspection, ash hood placement;
- during market: continuous bypass marshaling, food inspection, evidence custody, animal-waste removal;
- after market: token reset, floor separation, lichen-frame relocation, store seal check;
- at dusk: chain setting, cairn visitation, animal-corridor clearance, lantern hooding;
- during winter absence: frost observation, warm-stone watch, emergency-route verification;
- after thaw pulse: gutter clearing, ash-pocket shoring, tank overflow inspection, road-wedge replacement;
- after quest failure: specific route, service, refuge, or evidence maintenance persists visibly until resolved or superseded.

### 24.5 Life outside combat

Environmental horror must retain a service or ecological role. Cairn Beasts are not stone loot piles; Funeral Kites are not flying enemies detached from pollination and name protection; the Acre is not a boss detached from food and civic services. Their habitats must look maintained, negotiated, avoided, or depended upon even when no encounter is active.

## 25. Environment art program

### 25.1 Accepted reference and strict boundary

**[ART REFERENCE]** `assets/world/graven-march-black-pine-occlusion-basin-v5.png` is 1536 × 1024, opaque sRGB, SHA-256 `8b756803451bbd6893c445a36303c9a7b0b4c0736b98c0d64e4204f777ab9b76`, and approved regional quest-location direction. It has two independent passes and is a runtime backdrop, but it is not a production asset.

It may direct:

- cold blue-black slate and pine;
- pale ash/snow ground;
- long black-pine shadow bands;
- dry-stone route edges;
- low shelter silhouettes;
- restrained practical warmth;
- ecological absence, road closure, and readable detour.

It may not establish:

- Cairnmarket's exact coordinate, rotation, site layout, or building dimensions;
- orchard or mobile-corridor geometry;
- an apparent figure as a canonical character or creature;
- a production mesh, material set, collision surface, navmesh, or lighting rig.

### 25.2 Accepted supplemental reference A — Grave-root orchard civic system

**[ART REFERENCE]** ID: `concept_cairnmarket_grave_root_orchard_civic_system`.

**[ART REFERENCE]** Path: `assets/world/cairnmarket-grave-root-orchard-civic-system-v1.png`.

Status: `approved_direction` as an accepted supplemental interior environment reference. The opaque sRGB PNG is 1536 × 1024, 3,061,458 bytes, and SHA-256 `6f73cc5e847b9b67be7ae7eea2407fed48b9192d81b87a786447497cf4d54667`. Its exact accepted revision prompt is bound through `assets/world/prompts/world-environments.current.batch-06.prompt-packets.json` with prompt SHA-256 `c67a7666a6f491e7efee890fa7b9d738a39b7c453aa0d346abd718a1543ce849`; redacted rights, raster, review, and maturity evidence is bound through `assets/world/world-environments.current.batch-06.provenance.json`. Two independent read-only visual reviews and coordinator verification accepted the direction.

**[NONCLAIM]** This acceptance supplies visual direction only. It does not establish exact GIS placement, copied external graph geometry, engineering adequacy, a runtime backdrop, collision, navmesh, blockout mesh, production mesh, static model, rig, or animation. It also does not populate the still-null `environmentKeyframe` field in the older accepted Wave04 program record; the current supplemental registry and that immutable historical program slot are separate evidence surfaces.

#### Composition

- Landscape 1536 × 1024.
- Slightly elevated third-person camera at the oath-entry threshold, looking obliquely from cold dry arrival into humid root interior.
- One continuous, physically inhabitable environment; no cutaway board, map, inset, diagram, exploded view, or presentation frame.
- Primary route: public/worker split toward the four cultivation lines.
- Service/risk route: vent and irrigation gallery, lifts, wash separation.
- Return route: two clearly different egress directions from two separate refuges.
- Human scale: anonymous workers, handrails, doors, rye sacks, pack harnesses, manual hoists, low civic structure.

#### Required visible facts

1. Terraced root trays hang from structural slate ribs and rest on independent grave piers.
2. Exactly four pollination/root lines read as separate operational bays without letters or colored route marks.
3. The Funeral Kite roost is distinct from food handling and mortuary work.
4. Food wash, clean store, mortuary wash, and waste routes are physically separable.
5. Exactly two principal manual lifts and two collapse-refuge structures are legible.
6. Exactly two exterior egress directions are visible.
7. One memorial-fallow line reads as maintained, drained, and non-producing.
8. Several Funeral Kites remain rigid, cloth-and-frame organisms without bird anatomy. Every depicted kite carries multiple blank tabs and one unmistakably inward-folded tab.
9. One claimed kite/tab state makes one exact line visibly slack, capped, stopped, or fallow while the other three lines continue.
10. Cold slate/pine mass and sparse amber work light remain consistent with the accepted Graven March reference.

#### Foundational brief

The text below is the foundational composition brief retained for human review. It is not the exact final revision prompt; use the content-addressed batch-06 prompt packet above for that evidence.

```text
Create one polished stylized-3D dark-fantasy production environment concept of the Cairnmarket grave-root orchard civic system, landscape 1536×1024. Use the accepted Graven March winter-basin reference only for cold slate-and-black-pine palette, ash-filtered winter atmosphere, long occlusion shadows, restrained practical warmth, weathering, and inhabited austerity; do not copy its geography or layout.

Show one continuous buildable space from a slightly elevated third-person viewpoint at the oath-entry threshold, looking through a cold dry arrival into a humid maintained root interior. Establish ordinary scale with anonymous workers, low doors, handrails, rye sacks, pack harnesses, manual hoists, and repaired Cairnmarket civic construction. Do not identify or design a named character.

Build four distinct terraced pollination bays as root trays hung from structural slate ribs and supported by independent grave piers. Show a protected Funeral Kite roost, memorial fallow, vent/irrigation service gallery, clean food wash, separate mortuary wash, winter store, exactly two principal manual lifts, two structurally independent collapse refuges, and two visibly different exits. Food, burial, worker, animal, and waste movement must remain separate.

Include a small canonical-range group of rigid black memorial-cloth Funeral Kites with no bird anatomy. Every visible kite carries several blank tabs and exactly one clearly inward-folded tab. One claimed tab is visibly heavy and its exact pollination line is slack, capped, stopped, or fallow; the other three routes remain active. No readable name appears.

Use frost-spalled slate, black-pine ties, flint details, grave lichen, blank clay markers, unmarked iron, low grave-safe braziers, sparse candle niches, cold raking ash light, and humid root breath. Make load, drainage, repair, access, refuge, and continuing labor physically plausible at concept-art level.

No karst cave, cathedral, royal crypt, giant sacred tree, conventional fruit orchard, corpse crop, bodies as fertilizer, bone architecture, glowing magic roots, steampunk machinery, powered lift, rail, modern plumbing, readable names, signs, runes, text, logos, watermark, UI, labels, map view, impossible circulation, extra root lines, generic birds, named-character portraits, catastrophic universal ruin, or geometry presented as survey or production truth.
```

### 25.3 Accepted supplemental reference B — Bellwater four-corner service transfer

**[ART REFERENCE]** ID: `concept_bellwater_mobile_service_corridor_four_corner_transfer`.

**[ART REFERENCE]** Path: `assets/world/bellwater-mobile-service-corridor-four-corner-transfer-v2.png`.

Status: `approved_direction` as an accepted supplemental exterior environment reference. The opaque sRGB PNG is 1536 × 1024, 2,846,754 bytes, and SHA-256 `2f2fa3d2248bf12f673d3929894b7f544792d8ff805cbf99909d189272838871`. Its exact accepted correction prompt is bound through `assets/world/prompts/world-environments.current.batch-07.prompt-packets.json` with prompt SHA-256 `567b100d8611e5aaeb9b7c5c17501dc20a4a2622fd5c147b6b4a53517fa5f010`; redacted rights, raster, review, and maturity evidence is bound through `assets/world/world-environments.current.batch-07.provenance.json`. Two independent read-only visual reviews and coordinator verification accepted the direction.

**[NONCLAIM]** This acceptance supplies visual direction only. It does not establish exact GIS placement, copied external graph geometry, engineering adequacy, a runtime backdrop, collision, navmesh, blockout mesh, production mesh, static model, rig, or animation. It also does not populate the still-null `environmentKeyframe` field in the older accepted Wave04 program record; the current supplemental reference and that immutable historical program slot are separate evidence surfaces.

#### Composition

- Landscape 1536 × 1024.
- Wide oblique camera looking along the live road so one mobile corner operation, the former direction, and receiving direction read in depth.
- Primary route: public road.
- Service/risk routes: five separate rigs and one manual mobile gantry.
- Return routes: former return, receiving return, and emergency bypass remain distinguishable.
- Human scale: anonymous workers, pack animals, carts, low assize/hall construction, hand-operated mechanisms.

#### Required visible facts

1. Exactly one Acre That Walks appears as one bounded rectangular exhausted field.
2. Exactly four fence-post supports are readable: three planted/load-bearing, one visibly lifted or moving.
3. Inverted roots belong only to the Acre and reach toward an absent sky; they do not become ordinary trees or roof thatch.
4. One seed-marker pad/action lies beyond the moving corner and reads without text or UI.
5. Five physical service systems remain separately legible: school northwest, water northeast, fire southeast, burial southwest, tax southwest but separate from burial.
6. At least one typed outage state is visible through a capped/slack connection and a correspondingly reduced service, without colored quest-routing cables.
7. Public road, convoy lane, pack-stock passage, emergency bypass, former return, receiving handoff, and two independent exits stay readable.
8. The mobile gantry is manual, stabilized, and serves only the active corner.
9. Service lines do not cross unprotected pedestrian or stock paths.
10. The Acre has no face, building, rider, animal body, vehicle language, or extra support.

#### Foundational brief

The text below is the foundational composition brief retained for human review. It is not the exact final revision prompt; use the content-addressed batch-07 prompt packet above for that evidence.

```text
Create one polished stylized-3D dark-fantasy production environment concept of the Bellwater mobile service corridor outside Cairnmarket, landscape 1536×1024. Use the accepted Graven March winter-basin image only for cold slate and black-pine material behavior, winter sleet, ash-filtered light, deep occlusion, visible repairs, and restrained practical warmth. Do not inherit its coordinates or basin layout.

Compose a wide oblique view along a working regional road. Preserve a public road lane, convoy lane, pack-stock passage, emergency bypass, manual mobile gantry, former-return direction, receiving handoff, and two separate egress directions. Use low dry-stacked slate courts, movable black-pine frames, partial flint-shingle canopies, snowmelt tanks, ash trays, unmarked iron, covered jars, low lamps, repair splints, blank markers, and pack harnesses. The road remains visibly operational.

Show exactly one Acre That Walks as one rectangular exhausted plot, not a character-shaped monster or building. It has exactly four fence-post supports: three visibly planted and load-bearing, the fourth clearly uprooted for the next corner move. Its bounded inverted roots reach toward an absent sky and do not read as normal trees or roof thatch. A non-textual seed-marker pad/action is visible beyond the moving corner. No face, head, arms, mouth, eyes, torso, armor, house, windows, rider, farmer, vehicle, or additional anatomy.

Make five civic services separately readable without labels or color-coded quest cables: northwest school through low lesson furniture and blank counting stones; northeast water through a lidded snowmelt tank and carrying bar; southeast fire through a clear response cart, bell, ash trays, and safe braziers; southwest burial through a cairn bowl and blank portable markers; southwest tax appeal through separate unmarked iron tally weights and equal-standing shelf. Burial and tax share a corner but never a station, route, prop pile, meter, or ownership silhouette. Show one typed outage as one safely capped or slack connection and a corresponding reduced service.

The manual gantry serves only the active corner. Keep all lines protected from pedestrian and animal routes. Distinguish former return from receiving handoff. Use anonymous workers and pack animals only; do not invent named-character appearances. The setting is cold, wet, wind-scoured, repaired, and actively used, with long black-pine shadows organizing the corridor without hiding the Acre silhouette or service separation.

No second Acre, continuous turf across the landscape, five or more supports, fewer than four supports, multiple lifted corners, humanoid or animal locomotion, golem, titan, turtle, walking house, farm vehicle, rider, weapons, magic service organs, merged services, sixth service, powered crane, rail system, modern road, automobile, electric fixture, exposed trip-hazard cables, readable deeds, signs, labels, runes, text, logos, watermark, UI, exact cadastral border, survey claim, named-character portrait, cathedral, or triumphant golden holy light.
```

### 25.4 Cross-image acceptance checklist

- Both images share cold slate, black pine, flint, lichen, blank clay, unmarked iron, ash-filtered sleet, restrained amber practicals, and additive repair.
- Both show human, door, handrail, pack-animal, and manual-mechanism scale.
- Both preserve a primary route, service/risk route, and return route.
- Orchard has exactly four total lines: three operational and one locally halted claimed line.
- Funeral Kites have rigid black-cloth frames, multiple blank tabs, one inward fold each, and no bird anatomy.
- Bellwater has exactly one bounded Acre, four supports, one moving corner, three bearing corners, one visible seed-marker action, and five separate services.
- Burial and tax remain separate despite sharing the southwest corner.
- No image contains readable text, label, logo, UI, private provenance, exact-coordinate claim, invented named-character design, or model/runtime claim.
- An accepted image remains direction-only and must continue to pass canon fidelity, spatial readability, route hierarchy, mechanics, anatomy, forbidden-content compliance, and reference-boundary checks whenever its bytes or binding metadata change.

## 26. Streaming, LOD, models, and technical handoff

### 26.1 Accepted world-level direction

**[DESIGN CONSTRAINT]** World partition direction uses:

| Partition / ring | Range or size | Required read |
|---|---:|---|
| Atlas macro | 512 × 512 m | Terrain, ecology, route, distant-state address |
| Site chunk | 32 × 32 m | Local geometry, navigation, interaction, audio, phase payload |
| Interior cell | 16 × 16 m | Room graph and mobile-interior streaming |
| LOD0 gameplay | 0–42 m | Full collision intent, mechanic cues, interactive thresholds, hero material |
| LOD1 site | 42–128 m | Silhouette mesh, large route state, major light/VFX |
| LOD2 landmark | 128–384 m | Landmark mass, roof/skyline, large environmental state |
| LOD3 atlas | 384 m onward | Terrain envelope, hydrology, route thread, regional weather |

These are runtime-budget directions, not proof of implementation. The source also carries planning targets of 1,024/512/256 texels per metre for hero/standard/background surfaces, 48,000/12,000/2,800 triangles for hero/standard/minor props, 18 visible dynamic lights, 2,400 active particles, 14 ambient voices, and 700 high-quality visible draw calls. Do not claim compliance before measurement in the target engine and camera.

### 26.2 Proposed local streaming cells

**[PROPOSAL]** Partition the base precinct by functional ownership rather than slicing rooms blindly:

1. C01 arrival/bypass: S01, S02, S08;
2. C02 assize center: S03–S07;
3. C03 cairn-hall public: S09–S11;
4. C04 cairn custody/store: S12–S14;
5. C05 service seam: S15–S16 and proxy state only.

Cell boundaries should overlap threshold sightlines enough to prevent an open doorway from revealing an unloaded void. N17/N18 contain no external graph payload; they request or reflect separately streamed overlay state.

### 26.3 Overlay pinning

**[DESIGN CONSTRAINT]** Orchard pinning keeps every route, roost, and root anchor resident through season transitions; the claimed tab and fallow line remain pinned permanently. Orchard LOD intent is:

- LOD0: full season state, Kites, roots, workers, lifts, spores;
- LOD1: four route states, store load, fallow line, market flow;
- LOD2: Cairnmarket undercroft breath and roost silhouette.

**[DESIGN CONSTRAINT]** Corridor pinning keeps 520 m ahead and behind the Acre plus all five service nodes resident; bypass, former/receiving tie-ins, and split service remain pinned after handoff. Corridor LOD intent is:

- LOD0: Acre, five rigs, convoy, livestock, services, moving navigation intent;
- LOD1: four corner states, service-capacity silhouettes, traffic detour;
- LOD2: walking rectangle, convoy ribbon, two settlement tie-ins.

**[NONCLAIM]** This dossier does not implement pinning, moving navigation, occlusion, streaming priority, memory residency, or save persistence.

### 26.4 Environment kit decomposition

**[PROPOSAL]** Keep kit pieces semantically named and small enough to review independently:

- slate road: crown, rut, edge, shallow drain joint, frost-heave wedge, soft-shoulder shoring;
- cairn wall: full course, opened course, handled cap, portable-marker socket, lichen shelter, ash-packed joint;
- black-pine structure: tie beam, jurisdiction upright, reversible foot, canopy truss, splint, gate frame;
- flint roof: standard field, smoke-notch edge, repaired patch, snow-break, drip edge;
- civic threshold: oath door, market arch, cairn gate, store door, den gate, jurisdiction gate, testimony rails, evidence gate, appeal door;
- service: tank, draw bar, wash table, sealed residue cassette, harness bench, hitch, trough, ash hood, frame jack;
- road state: chain post, blank marker socket, detour edge, marshal pocket, witness lamp;
- safe cell: wind-break, low warming stone, two-exit sightline frame, refuge light socket;
- overlay interface: proxy marker object that is editor-only and never appears as diegetic geometry.

### 26.5 Motion-system candidates

**[PROPOSAL]** Environment animation may later include door/gate leaves, jurisdiction-frame clamps, chain settling, tank draw bars, low brazier draft, canvas weather response, manual hoists, orchard line tension, Kite tab folds, Acre corner movement, seed-marker setting, service caps, and gantry repositioning.

Each mechanism needs a neutral state, state ownership, collision ownership, audio cue, failure pose, reload behavior, LOD behavior, and a non-animated fallback. None is an accepted animation simply because the dossier names it.

### 26.6 Current model and art maturity

- The existing Graven March image is accepted direction and a runtime backdrop, not a production environment mesh.
- The Cairnmarket grave-root orchard image is an accepted supplemental interior-direction reference with redacted batch-06 prompt/provenance and no runtime or model claim.
- The Bellwater four-corner service-transfer image is an accepted supplemental exterior-direction reference with redacted batch-07 prompt/provenance and no runtime or model claim.
- The Wave04 orchard and corridor records report `environmentKeyframe`, `blockoutMesh`, and `productionMesh` as null.
- Relevant new named characters and creatures may have null concept, cutout, static model, or animated model fields. Use generic, clearly labeled proxies where evidence is absent.
- A concept image embedded in a registry does not prove model, rig, animation, collision, or runtime readiness.

### 26.7 Required handoff metadata

Every blockout slice should carry:

- object/space/node/link IDs from this dossier and their authority labels;
- source selector and canonical-record hash for every external binding;
- local-to-atlas transform and placement status;
- units, axis order, pivot, and bounding box;
- threshold open/closed pose and owning state machine;
- route, safe-cell, habitat, encounter, and service ownership;
- collision/nav status as `absent`, `proxy`, `tested`, or `accepted`—never implied;
- material maturity and reference-image scope;
- LOD/streaming intent versus measured evidence;
- open questions and prohibited assumptions;
- repository-relative asset references only.

## 27. Environment-production blockout sequence

Deliver the site in small, reviewable slices. Rejection of one slice should not invalidate unrelated work.

1. **GIS and terrain frame:** fictional CRS, exact atlas anchor, route tangent, proposed axis adapter, 176/760 m envelopes, topographic shelves, no invented permanent watercourse.
2. **Local graph skeleton:** three zones, sixteen spaces, sixteen traversable nodes, twenty links, three loops or more, N17/N18 isolated as non-traversable proxies.
3. **Road approach and bypass:** S01/S02/S08, Bellwater route read, unresolved Crown Road relation labeled open, road never silently terminates at court.
4. **Road assize:** S03–S07, six canonical rooms total with S02, all five canonical edges and threshold rules, three ash positions, appeal route.
5. **Cairn hall:** S09–S14, six canonical rooms, all five canonical edges and threshold rules, audience ring, market/store separation, den route.
6. **Service seam:** S15/S16, tanks, pack turn, food inspection, mortuary isolation, keeper bypass, three schematic water/sanitation systems.
7. **Safe cells and routes:** SC01–SC03, R01–R08, player-height sightline and route-closure tests.
8. **Living-world pass:** four phases, five ordinary actor roles, ambient interactions, maintenance props, occupancy and audio deltas.
9. **Ecology pass:** the four `habitat.cairnmarket_*` envelopes, Cairn Beast first cues, safe-cell exclusions, and non-hostile escape routes.
10. **Earlier-quest sockets:** Dead Vote, stationary Cart, and Winter Choir envelopes as clearly labeled reservations, not executable integrations.
11. **Orchard interface:** N17 hash binding, S15 handoff, seventeen-objective ledger subset, accepted expected counts, no copied external geometry.
12. **Acre interface:** N18 hash binding, S08 handoff, five service silhouettes, accepted expected counts, no copied external geometry.
13. **Fail-forward pass:** outcome-specific route, stock, marker, outage, maintenance, sound, and occupancy deltas.
14. **Sensory and weather pass:** cold/dry, sleet, thaw, winter absence; redundant cue review; no color-only state.
15. **LOD/streaming proxy pass:** cell boundaries, landmark reads, pinning request points, instrumented—not claimed—budgets.
16. **Art handoff:** two accepted supplemental references, accepted regional reference, hard forbidden lists, and independent-review packets.

Each slice review should include one overhead image, at least two player-height route images, one before/after state comparison, count summary, collision/nav status labels, source ledger, unresolved assumptions, and a no-private-provenance check.

## 28. Open decisions and promotion gates

| Open decision | Work that may proceed | Claim that must wait |
|---|---|---|
| Bellwater Road versus Crown Road relationship | Preserve both names and build an arrival fan compatible with either relation | Alias, junction type, route renaming, or a new modeled Crown Road polyline |
| Exact site rotation and anchor-to-building relation | Use proposed local frame and relative graph | Atlas-authoritative rotation or building coordinate |
| Terrain elevations inside core | Block stepped slate shoulder within 198–254 m envelope | Survey-grade contours, grading, foundation, or drainage |
| Overlay reservation transforms | Preserve accepted provisional origins/envelopes and transformable interfaces | Exact orchard/corridor atlas placement |
| Sixteen-space dimensions | Test the proposed envelopes and route reads | Canonical room size or final collision |
| Local safe cells | Mark and test SC01–SC03 physically | Invulnerability, AI exclusion, capacity, or accessibility acceptance |
| Water destinations | Build isolated schematic tanks, wash paths, and sealed collection | Watershed, permanent outlet, potable safety, sewer, or treatment |
| Earlier quest graphs | Preserve sockets and height/clearance | Executable crosswalk or graph ownership |
| Orchard geometry | Use hash-only proxy plus the accepted supplemental reference within its batch-06 boundary | Copied graph, final undercroft placement, runtime backdrop, or production mesh |
| Corridor geometry | Use hash-only proxy plus the accepted supplemental reference within its batch-07 boundary | Copied graph, moving nav implementation, runtime backdrop, or final road works |
| Named actor staging | Place labeled generic proxies under relevant quest state | Permanent residency, appearance, rig, or animation |
| Creature models | Use exact cue volumes and silhouette placeholders | Accepted subject art, static model, rig, animation, or combat readiness |
| New keyframes | Use both independently accepted supplemental references within their separate evidence boundaries | Runtime backdrop, model, or production-asset status before separate evidence |
| Runtime budgets | Instrument proposed cells and LOD reads | Performance compliance before target-hardware measurement |

Promotion of a spatial proposal requires exact source bindings, schema validation, independent topology and semantic review, clear authority labels, safe-cell and egress checks, privacy review, and a release record that states limitations without inflating maturity.

## 29. Prohibitions and explicit nonclaims

1. **[NONCLAIM]** This dossier creates no new canon, faction, deity, settlement, named character, creature, quest, item, route, historical date, law, or outcome.
2. **[NONCLAIM]** Proposed local coordinates, sizes, zones, spaces, nodes, links, routes, safe cells, habitats, schedules, props, and state machines are noncanonical blockout scaffolds.
3. **[NONCLAIM]** `veyl_local_grid_v1` is fictional modeled geography. Nothing here is a real-world observation, survey, property line, legal boundary, or cadastral claim.
4. **[NONCLAIM]** The 176 m core and 760 m influence are radial design envelopes, not walls, ownership bounds, streaming proof, or encounter leashes.
5. **[NONCLAIM]** The provisional orchard and corridor coordinates are transformable reservations, not exact atlas positions.
6. **[NONCLAIM]** The Bellwater/Crown Road relationship remains unresolved. Neither name may be erased or aliased by convenience.
7. **[NONCLAIM]** No local spring, stream, river, canal, sewer, bridge, permanent culvert, aquifer, or outfall is established for Cairnmarket beyond the exact accepted route/program language.
8. **[NONCLAIM]** Hydrology, sanitation, structure, fire separation, clearances, capacities, slopes, and egress suggestions are design intent—not engineering, safety, code, or accessibility certification.
9. **[NONCLAIM]** `prototype_playable`, `blockout_ready_not_production_geometry`, or `blockout_executable_candidate_not_navmesh_or_production_geometry` does not mean production geometry, collision, navmesh, runtime logic, or performance is complete.
10. **[NONCLAIM]** N17/N18 and overlay summaries do not import or reproduce any external graph node, edge, coordinate, utility, safe cell, egress, encounter volume, or objective endpoint.
11. **[NONCLAIM]** The accepted winter-basin keyframe controls only documented regional and quest-location direction. Its composition is not Cairnmarket geometry.
12. **[NONCLAIM]** The orchard and Bellwater images are accepted only as the separate supplemental visual references bound in §§25.2–25.3; neither is copied graph evidence, a runtime backdrop, model sheet, or production approval.
13. **[NONCLAIM]** An environment keyframe containing a creature or person does not accept that subject's concept art, anatomy sheet, static model, rig, or animation.
14. **[NONCLAIM]** Five population roles are not five named characters or fixed spawns. The 460–740 population range is not a crowd-rendering requirement.
15. **[NONCLAIM]** Safe cells are candidate social/refuge spaces, not guaranteed invulnerability or AI exclusion volumes.
16. **[NONCLAIM]** Cairn Beast warmth is contextual; grave heat cannot become loot, fuel, spell ammunition, or a portable puzzle key.
17. **[NONCLAIM]** Funeral Kites are not birds, ghosts, angels, paper collectibles, or generic aerial enemies. The Acre is not a walking house, golem, titan, animal, vehicle, mount, or terrain brush.
18. **[NONCLAIM]** Burial and tax do not become one service merely because they share the Acre's southwest corner.
19. **[NONCLAIM]** No readable text, caption, route label, map, arrow, logo, watermark, UI, real-world religious mark, external locator, personal identity, workstation path, or private execution metadata belongs in published art or handoff data.
20. **[NONCLAIM]** This dossier does not claim final lighting, audio, VFX, animation, model integration, streaming, LOD, save/load determinism, quest logic, combat balance, or world-state persistence.

## 30. Final production-review checklist

### Authority and GIS

- [ ] Every material claim remains labeled canon, design constraint, derived, proposal, art reference, open, or nonclaim.
- [ ] Site ID, territory, fictional CRS, `[8192, 10240, 212]` atlas anchor, and 198–254 m vertical envelope remain exact.
- [ ] Axis order is easting, northing, elevation; any engine adapter is explicit and tested.
- [ ] The proposed local frame is not promoted to canonical rotation.
- [ ] Bellwater Road and Crown Road remain distinct until resolved.
- [ ] Overlay reservations remain provisional and transformable.

### Counts and topology

- [ ] Exactly 3 zones, 16 local spaces, 18 nodes, and 20 stored bidirectional local links are present.
- [ ] Exactly 16 nodes are traversable and connected; N17/N18 remain non-traversable proxy nodes outside local arc counts.
- [ ] The open local graph derives exactly 40 directed arcs from 20 stored links.
- [ ] All 10 canonical typology edges and all 10 proposed connective links are represented once.
- [ ] All 8 route programs have a readable purpose and return condition.
- [ ] A court or wildlife closure never seals residents or erases the public bypass.

### Rooms, thresholds, services, and life

- [ ] All six cairn-hall rooms and all six road-assize rooms retain their exact canonical names and functions.
- [ ] Every canonical threshold rule is physically readable.
- [ ] All four interface spaces have distinct custody/service roles.
- [ ] Three water/sanitation systems remain separated and explicitly schematic.
- [ ] Pack waste, food wash, mortuary wash, heat ash, and testimony ash never merge.
- [ ] All five ordinary population roles perform attributable work in all relevant phases.
- [ ] Cold morning, market day, dusk, and winter night alter activity without duplicating the site.
- [ ] Sound, smell, light, repair, and occupancy support every critical state; no color-only cues.

### Ecology, encounters, and safety

- [ ] Exactly four habitat envelopes are staged, each with an ecological/service role outside combat.
- [ ] SC01–SC03 remain physically readable, route-connected, and excluded from hostile encounter volumes.
- [ ] The two external safe-observation cells are referenced, not copied.
- [ ] Funeral Kite cue and counterplay remain exact; one claimed line stops locally while others continue.
- [ ] Acre cue and counterplay remain exact; one corner moves, three bear, and exactly one Acre exists.
- [ ] Five services remain separate; burial and tax remain separate at their shared corner.
- [ ] Both accepted external egress pairs remain hash-bound and unaltered.

### Quests and persistence

- [ ] Earlier Dead Vote, stationary Cart, and Winter Choir sockets remain compatible but are not falsely claimed executable.
- [ ] Exactly two Wave04 overlays are bound by canonical-record hash.
- [ ] Expected external totals remain 41 nodes, 102 directed edges, 17 objectives, 10 utilities, 2 safe cells, 4 egresses, 2 habitats, and 2 encounters.
- [ ] All 17 canonical objective meanings and orderings survive local handoff.
- [ ] Orchard and Acre retain different structure, counterplay, failure class, and outcome logic.
- [ ] Failure produces a bounded persistent service/ecology/evidence change, not reset or total-map ruin.

### Art, models, streaming, and privacy

- [ ] Existing Graven March art is used only within its approved scope.
- [ ] The orchard and Bellwater references stay within their independently accepted batch-06 and batch-07 supplemental-direction boundaries.
- [ ] No named-character appearance is invented to populate an environment image.
- [ ] No art inclusion becomes an unsupported static-model, rig, animation, collision, navmesh, runtime, or production claim.
- [ ] LOD and streaming values remain planning targets until measured.
- [ ] Every handoff uses repository-relative references and redacted, generic provenance only.
- [ ] No URL, external provider identifier, private execution locator, username, email, absolute workstation path, embedded metadata, readable text, logo, watermark, or UI enters the release.

Passing this checklist means the proposal is internally reviewable. It does not promote the dossier to canon or certify a shipped world asset.
