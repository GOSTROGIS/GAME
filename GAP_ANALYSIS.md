# Gap analysis: Hearthmere shared-world foundation

This ledger distinguishes implemented, executable foundation work from content that is only authored or represented by prototype geometry. Concepts, manifest counts, screenshots, and a configured 50-client limit do not count as production acceptance.

## Closed foundation risks

- **Workspace and contract boundary:** the repository is an npm-workspace TypeScript project with separate client, server, shared-contract, content, and asset-tool packages. Runtime code consumes public package exports instead of private source paths.
- **Canonical Hearthmere projection:** nine 32×32-metre chunks project one validated 96×96-metre scene into instances, colliders, occluders, navigation, lights, volumes, spawn anchors, phase IDs, and interaction anchors.
- **Renderer handoff:** WebGL2 is the Hearthmere renderer behind `?renderer=webgl`; the Canvas slice remains available for non-Hearthmere regions and explicit initialization failure. Browser tests verify both paths.
- **Creator-to-rig fidelity:** one procedural contract rig consumes `AppearanceV2`; all 16 creator morphs are individually observable in live world geometry/material state and survive the browser save path. Modular equipment, hair, markings, scars, age, and plague inputs share the same appearance source.
- **Authoritative room foundation:** `HearthmereRoom` runs a 30 Hz simulation, emits 20 Hz patches, limits rooms to 50 clients, and validates sequenced movement, navigation, action timing, range, cooldowns, impact resolution, and message rates.
- **Real browser networking:** two Playwright WebGL clients complete the creator, join the same room through the official Colyseus browser build, reproduce distinct local/remote rigs, move across and back through the old region overlap, and apply exact canonical enemy damage that appears in both synchronized and rendered enemy state.
- **Authority continuity:** connected room ownership, rather than overlapping legacy tile regions, controls Hearthmere scene residency and HUD identity. Continuous input expires server-side after eight simulation ticks, and key release sends an immediate refreshed frame, preventing runaway movement during a stalled or disconnected client.
- **Target integrity:** dotted manifest IDs such as `enemy.ash-husk` and `npc.maela-voss` pass a dedicated content-ID contract. The client resolves synchronized transforms; the server rejects wrong target types, out-of-range targets, dead targets, duplicate impacts, and stale commands.
- **Persistence boundary:** schema-v4 metre/Y-up transforms, deterministic appearance serialization, single-use v3 import fingerprints, and half-open world coordinates are validated. Stored invalid, edge, or collider-blocked positions reproject to the canonical walkable spawn before entering authority.
- **Privacy and transport:** durable account IDs are absent from replicated actor schema; authenticated ownership remains server-side. WebSocket origins are allowlisted, magic-link tokens are hashed/single-use/expiring, and cookies are Secure/HttpOnly/SameSite under production configuration.
- **Manifest honesty:** all 59 current runtime assets declare provenance and are explicitly marked `prototype_geometry`. Strict-production validation fails by design until original optimized delivery assets satisfy their manifests.
- **Legacy content integrity:** the existing seven quests, 18 skills, 216 techniques, 78-enemy bestiary, 42 characters, registries, saves, and Canvas smoke remain executable and cross-reference validated.

## Highest-leverage next production slices

1. **Produce the actual Gloamfarer character asset.** Author the neutral Blender source, shared skeleton, all 16 corrective morphs on every LOD, modular garments/equipment, hair cards, material masks, sockets, and the complete event-authored animation list; export and validate GLB/Meshopt/KTX2 derivatives.
2. **Replace Hearthmere prototype geometry.** Complete the seven environment passes with original structural modules, six PBR surface families, props, foliage, decals, named NPC assets, Ash Husk, Ledger Crawler, lighting, rain/VFX, and audio. Promote each asset individually only when the strict-production manifest passes.
3. **Finish gameplay authority.** Move inventory, gathering cooldowns, crafting, loot, quest rewards, skill XP, deaths/respawns, public enemy respawns, and event-ledger mutations into idempotent database transactions. The current room proves movement and representative combat/interact authority, not the entire legacy game loop.
4. **Implement per-client phase filtering.** Apply personal quest phase masks to synchronized NPC/prop/objective visibility and dialogue while preserving other players and public state. Add restored/unrestored two-client fixtures and reconnect coverage.
5. **Complete authenticated alpha UX.** Wire passwordless email delivery, character selection/creation/bootstrap UI, same-origin reverse proxying, session renewal, one-time local import UX, distributed HTTP rate limiting, and account recovery/audit operations.
6. **Exercise durable infrastructure.** Build and run the container stack, migrations, Redis presence, shard leases, reconnects, backups/restores, health probes, and multi-process deployment rather than relying only on in-memory development mode.
7. **Prove load and performance gates.** Run 50 clients for two hours and 250 across five shards; measure tick time, patch size, DB/Redis latency, and reconnects. Benchmark the actual production assets at 1080p against discrete- and integrated-GPU quality targets, including draw calls, GPU/main-thread time, texture retention, shadows, particles, and crowd LOD transitions.
8. **Expand acceptance coverage.** Add complete quest journeys, transactional failure/retry tests, all animation-event timings, phase-sensitive interaction, visual regression across quality tiers/camera quadrants, accessibility checks, and hostile network/load fixtures.

## Deliberately not claimed yet

- The current Hearthmere scene is a manifest-driven graybox with procedural prototype geometry, not approved production art.
- The procedural humanoid proves the creator contract but is not the final Blender-authored Gloamfarer rig or animation library.
- Maela, Torren, Ysra, Ash Husk, and Ledger Crawler have distinct prototype silhouettes; they do not yet have complete production meshes, textures, LODs, or required clips.
- `maxClients: 50` is configured and two real clients are tested; the 50/250-player endurance gates have not run.
- No claim is made that 1080p/60 or integrated-GPU 30 FPS has passed. SwiftShader smoke results are correctness tests, not hardware performance evidence.
- PostgreSQL, Redis, Docker, and Mailpit integration are implemented as code/configuration but the full container and recovery workflow has not been validated in this workspace.
- Production email delivery, distributed HTTP rate limiting, per-client live phase filtering, and complete transactional gameplay remain open.
- All 78 enemies, 216 techniques, and seven quests remain validated design/content data, while the shared-world runtime integrates only a representative playable subset.
