# The Hollow March

An original dark-fantasy shared-world action-RPG under active production. The repository contains the retained Canvas vertical slice, the first WebGL2 Hearthmere implementation, a canon-authored 178-creature bestiary, and a deterministic GIS-valid 16,384×12,288-meter Sable Reach atlas. The browser runtime uses a TypeScript/Three.js client, authoritative Colyseus server, shared protocol/save contracts, and manifest-driven world pipelines.

## Play

Install workspace dependencies with `pnpm install`. On Windows, use `start-game-3d.ps1` for the Vite/WebGL slice or `start-game.ps1` for the retained Canvas baseline.

Alternatively:

```powershell
pnpm dev:client
```

Open `http://127.0.0.1:4173/?renderer=webgl`. Add `&network=1` to connect to a local authoritative server at port 2567. Opening `index.html` directly is not supported.

For server-backed development, copy `infra/.env.example` to an appropriate local environment file and run `pnpm dev:server`. PostgreSQL, Redis, Mailpit, and the server are also described by `docker-compose.yml`; development defaults permit guest joins and in-memory persistence when the external services are absent.

## 3D and shared-world foundation

- Three.js WebGL2 renderer with a 42° orbit camera, WASD/click travel bridge, occluder fading, fog, rain, lighting, named NPCs, enemies, and explicit Canvas fallback diagnostics.
- One original procedural neutral humanoid rig used to prove all 16 creator morph channels in live geometry/material state, with modular hair, markings, clothing, weapon, age, scar, and plague-related appearance inputs. It is a prototype contract rig, not final character art.
- Nine 32×32-meter Hearthmere chunks driven from a shared scene manifest, including navigation cells/links, colliders, occluders, lights, VFX/audio zones, interactions, spawns, and exact four-meter legacy coordinate migration.
- Authoritative 30 Hz `HearthmereRoom`, 50-client limit, sequenced movement/travel/action messages, server-side range/cooldown/impact validation, reconnect leases, personal phase masks, and Redis-backed multi-process presence/room discovery when configured.
- PostgreSQL migrations and repositories for accounts, characters, appearances, skills, inventory, quests, event ledgers, and guarded one-time v3 save import. Passwordless links are hashed, expiring, and single-use.
- Asset validation fails undeclared assets, missing provenance, scale/pivot/socket/morph/clip faults, broken navigation, duplicate IDs, and budget violations. The strict-production gate currently fails by design because the first 59 runtime assets remain labeled prototypes pending original Blender/GLB/KTX2 production work.
- The fictional `veyl_local_grid_v1` engineering CRS drives a 2048×1536-cell, eight-meter DTM, separately conditioned hydrology, D8/MFD derivatives, six exclusive territories, 768 hashed macro cells, Dijkstra routes, modeled bridges, habitats, placements, and the nested 96-meter Hearthmere site. It deliberately has no EPSG code or surveyed-accuracy claim.
- Seven distinct ecology-proof location arenas expose one server-authoritative representative encounter from every one of the 21 families. Their 21 creature and seven location assets are hashed project-original procedural prototypes, not production models or finished seamless world spaces.
- Protocol-v2 simultaneous-plan combat contracts, a pure deterministic two-beat kernel, server-save v6 migration, and PostgreSQL idempotency/outcome ledgers are present as a tested foundation. The shared room and clients still use their retained real-time combat path until the next integration gate; active turn encounters are deliberately room-resident and are not crash-recoverable in this slice.
- The normalized Claude reference library contains 59 JSX reference primitives in 11 groups, with matching type and accessibility specifications. It is development reference material only: React and the fallback shim are not imported by the production client.

## Controls

| Input | Action |
| --- | --- |
| `WASD` / arrows | Move |
| Click | WebGL: request a travel destination. Canvas: pathfind, approach, target, or interact |
| `E` | Use the nearest NPC, resource, or landmark |
| `1` / `F` | Light attack |
| `2` / `R` | Heavy attack |
| `Space` | Dodge; network mode validates the action/timing server-side, while the Canvas slice retains its local invulnerability rule |
| `4` / `Q` | Drink from the vigil flask in the Canvas compatibility slice; authoritative flask transactions remain open |
| `I`, `K`, `J`, `M`, `B`, `L`, `C` | Pack, skills, journal, world atlas, bestiary, lore, character |
| `Esc` | Close the active overlay |

## Included systems

- Six-stage creator: identity, 8 origins, body/face/hair palettes, 16 morphs, 8 attributes, 8 vows, validation, four high-polish gaunt origin keyframes, and a labelled deterministic live-morph profile.
- 18 independent level-1–99 disciplines using a RuneScape-shaped cumulative XP curve (13,034,431 XP at level 99), with 216 authored technique nodes exposed through purchasable trees, 144 action specifications, 20 cross-skill synergies, 72 milestone challenges, and 18 mastery trials. Threshold points, prerequisites, exclusions, level gates, mastery gates, persistence, a canonical anti-grind action-XP reducer, and six representative technique effects are live; the broader hooks remain design specifications.
- 71 economy items, 24 resource definitions, 38 general recipes, and 2 integrated story recipes.
- A retained 32×24 isometric compatibility map plus the continuous Sable Reach atlas: six exclusive territories, nested sites, 14 stable landmarks, 42 explicitly atlas-placed characters, seven quests, seven gathering nodes, 24 legacy encounter spawns, and 21 routed ecology showcases.
- A canonical bestiary of 178 enemies in 21 ecological families: 68 regulars, 37 specialists, 31 elites, 21 minibosses, and 21 bosses. Every entry has a complete V3 anatomy, pathology, locomotion, senses, horror language, lifecycle, behavior/mechanic contract, production brief, codex reveals, habitat profile, and GIS-reachable placement.
- 42 named characters, seven factions, and 48 relationship hooks, exposed through the in-game lore codex; the current vertical slice physically places six of them.
- Seven structured quests: a four-part main chain and three side stories.
- Click-to-move pathfinding, keyboard movement, stamina/focus/health, light and heavy attacks, dodging, healing, role-aware enemy ranges, move-specific telegraphs, health phases, status buildup, damage affinities, structured drops, death/respawn, and wayshrines.
- Named-coordinate-space save schema v6 on the server, byte-exact v4/v5 Hearthmere transform migration, guarded one-time v3 import/replay protection, retained local-v4 compatibility saves, recursive transient-combat removal, and a world-event ledger that prevents retroactive quest softlocks.
- Four original environment keyframes plus production manifests for five regional material, structure, prop, VFX, audio, lighting, and performance kits. The playable canvas layers those keyframes beneath upgraded terrain materials, roofs, trees, light pools, fog, and rain.
- Responsive full-screen title, creator, HUD, technique trees, inventory/crafting, journal, world atlas, bestiary, lore codex, character sheet, dialogue, quest tracker, notifications, and accessibility focus states.

## Project map

```text
GAME/
├── assets/concept/            Original generated title art
├── apps/client/               Vite/Three.js WebGL client and network adapter
├── apps/server/               Colyseus room, auth, persistence and telemetry
├── packages/shared/           Protocol, appearance, authority and save contracts
├── packages/content/          Canonical bestiary, atlas, habitat, placement and scene data
├── design-system/             59 reference-only JSX/type/accessibility component triplets
├── tools/worldgen/            Pinned deterministic GIS generation and committed derivatives
├── tools/assets/              Asset validation and production summaries
├── infra/                     PostgreSQL migration and server container
├── assets/characters/         Original gaunt origin renders and provenance
├── assets/world/              Four final world keyframes and source manifest
├── scripts/repair_checker_alpha.py Conservative alpha export repair
├── src/core/combat.js         Enemy phases, move runtime and affinities
├── src/core/loot.js           Structured chance/quantity loot resolution
├── src/core/saveMigrations.js Versioned save migration and persistent state
├── src/core/skillActions.js   Anti-grind action XP and mastery accounting
├── src/core/techniqueProgression.js Shared purchase eligibility and mutation
├── src/core/worldProgression.js Quest ledger, gates and ending outcomes
├── src/data/bestiary.js       Thin compatibility adapter for 178 canonical creatures
├── src/data/characters.js     42 characters, factions and relationships
├── src/data/character.js      Creator choices, origins, vows, attributes
├── src/data/contentGraph.js   Whole-project cross-reference validator
├── src/data/encounters.js     Authored runtime spawn placements
├── src/data/registries.js     Canonical enemy, NPC, item and region adapters
├── src/data/skillTrees.js     Techniques, actions, synergies and trials
├── src/data/skills.js         Skills, items, resources, recipes, XP curve
├── src/data/world.js          Map, regions, landmarks, NPCs, enemies, nodes
├── src/data/worldAssets.js    Regional production asset kits and provenance
├── src/data/quests.js         Quest graphs, objectives, rewards, dialogue
├── src/main.js                Runtime, renderer, UI, combat, persistence
├── tests/smoke.mjs            Real-browser integration smoke test
├── GAP_ANALYSIS.md            Closed risks and next production priorities
├── index.html                 App shell
├── styles.css                 Complete visual system
└── serve.mjs                  Dependency-free local server
```

## Design boundary

The mechanical inspirations are broad genre patterns: use-based leveling, gathering/crafting loops, readable stamina commitments, dodge timing, dangerous exploration, and environmental storytelling. All setting names, lore, map data, quests, characters, interface work, code, and generated art in this project are original; the project contains no RuneScape or Dark Souls assets, characters, locations, text, or trademarks.

## Verification

Create the pinned project-local GIS authoring environment once with `pnpm worldgen:setup`. It installs the exact versions in `tools/worldgen/requirements-gis.txt` beneath `tools/worldgen/.venv`; set `SABLE_REACH_BOOTSTRAP_PYTHON` when Python 3.12+ is not discoverable on `PATH`.

Run `pnpm test:all`. It covers type checks, deterministic GIS regeneration, asset/provenance validation, bestiary/atlas/placement/showcase content, shared save contracts, server authority, two-client networking, real-browser networking, legacy regression, and WebGL visual smoke. The WebGL gate requires explicit `webgl3d` readiness, verifies live frames and all 16 morph observables, rotates the camera, inspects the framebuffer, and separately proves forced Canvas fallback.

The capability matrix intentionally distinguishes authored, validated, habitat-valid, integrated, prototype, production, and playtested states. All 178 creatures are canon-authored and habitat-valid; 21 family encounters are prototype-playable; the full atlas is GIS-valid. Production creature models, seamless 3D traversal of the Reach, performance approval, and playtesting remain explicitly outside this slice.

## GitHub integration

The repository uses Git LFS for large GIS and 3D authoring/runtime binaries. `.github/workflows/acceptance.yml` reproduces the pinned GIS environment and complete Windows browser/WebGL acceptance suite on pushes and pull requests to `main`. Dependabot covers pnpm, Python GIS requirements, and GitHub Actions; the pull-request template requires stable-ID, provenance, GIS, authority, navigation, and maturity evidence.
