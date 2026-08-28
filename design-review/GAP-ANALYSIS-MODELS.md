# Gap analysis — 3D models for named characters and bestiary creatures

Companion to `GAP-ANALYSIS-100K.md` (procedural world assets) and
`GAP-ANALYSIS-CONTENT.md` (writing depth). This one tracks the thing both of
those name and neither closes: **3D models of the 42 named characters and the
178 bestiary creatures.** Before this pass, that count was one — `enemy.ash-husk`
— against a project with 68 vendored concept plates.

**Status: 76 subjects are now selectable in `MODEL MAKER.html`.** Every number
below is read off `kit/hm-model-registry.js`, which derives the list from the
same files the rest of the project treats as canonical rather than a hand-kept
count that can drift from them.

| Tier | Count | What it means |
| --- | ---: | --- |
| **Sculpted** | 4 | Section geometry authored against a measured concept plate. |
| **Generic-rig** | 42 | Built live from the shared parametric actor rig — real skinned body, not sculpted to its own plate. |
| **Queued** | 6 | Concept art exists, chassis is proven, section geometry is not written yet. |
| **Refused** | 16 | Concept art exists; no eligible chassis, or no rank-1 prompt at all. |
| **Reference only** | 8 | Playable-origin renders; no character spec exists to build a body from. |

---

## What shipped this pass

### Selector, in `MODEL MAKER.html`

The page was a single hard-coded Ash Husk viewer. It is now a subject switcher:
a searchable, grouped panel (`Change subject`) lists all 76 rows with a
thumbnail, status pill and one-line reason, and picking one tears down the
current model and mounts the next — sculpted creature, generic-rig character,
or a plate-only placeholder for anything not built. Nothing in the list is
hidden to make the count look better; a refused subject shows its plate and
the exact sentence that blocks it.

### Three more Ashbound individuals, sculpted

`cinder-mourner-model.js`, `wicket-eater-model.js`, `smoke-notary-model.js`,
each built the way `ash-husk-model.js` was: a measured plate, a real skinned
skeleton (`kit/hm-husk-rig.js`), plate-sampled PBR materials
(new: `kit/hm-plate-materials.js`, generalised out of ash-husk's own pipeline),
spring-bone hem cloth, and a silhouette scan checked against the finished mesh
(new: `kit/hm-model-measure.js`).

**Depth is stated as lighter than ash-husk, not padded to match it.** Ash Husk
has eleven section generators, 22 spring bones, a 96×72 sculpted face and ten
audited layer pairs. The three new builds have five to seven sections, six
hem-only spring bones, a plain void head (none of the three plates lights a
face under its hood), and paddle hands instead of articulated fingers. Every
one of those omissions is written into the model file's own header and into
its `CONFORMANCE` table — the same honesty rule `GAP-ANALYSIS-CONTENT.md`
already applies to writing now applies to geometry.

**Measurement method, and its limit.** A script scanned each plate
(1024×1536, near-black field) for the first pixel past a luminance threshold
per row, giving a real crown/sole span and a real width curve — not eyeballed.
`enemy.smoke-notary` is the honest exception: its plate has real drifting
smoke and a dramatic arms-out pose, both of which defeat a flat luminance
threshold, so six of its ten scanned bands are graded `'haze'` and excluded
from the fidelity score. That is a measurement limit stated in the file, not
a modelling shortcut.

### All 42 named characters, generic-rig

`kit/hm-actor.js` (skinned humanoid rig) and `kit/hm-actor-cast.js` (all 42
specs, including the seven authored signature/work clips) already existed
and had never been rendered anywhere in the project. `MODEL MAKER.html` now
calls `buildActor()` on any of the 42 on selection — no per-character file
needed, because the rig is already generic. This is the highest-leverage
single change in this pass: 42 subjects for the cost of wiring, not authoring.

**Stated plainly, not left for the panel to imply otherwise:** this is a
*body double*, not a verified likeness. The rig's proportions and wardrobe are
authored against each character's brief in `hm-actor-cast.js` — bearing, mark,
garment, signature — not sculpted against that character's own concept plate
the way the bestiary models are. 20 of the 42 have a vendored plate (shown
beside the model); none of the 42 have been measured against it. The panel
says this on every character, not just once here.

---

## Queued — six Ashbound individuals

Section geometry not yet authored. The chassis is not in question: four
individuals now prove `humanoid-collapsed` (`kit/hm-art-law.js`'s
`CHASSIS_STATUS` still says that chassis `exists: false`, which this pass's
own output contradicts — worth fixing in that file next).

| id | Note from a first look at the plate |
| --- | --- |
| `enemy.ash-tenant` | Humanoid, a hinged reliquary-door cavity in the chest, dog-tags on cords across both shoulders. |
| `enemy.ledger-crawler` | Not upright — a low four-legged lectern/book form. Closer to the `cairn_beasts` quadruped problem than to the other nine Ashbound individuals; may need the same chassis work as that family rather than the humanoid kit. |
| `enemy.pyre-bailiff` | Humanoid, bulbous leather-and-brass mask head, heavy layered pauldrons, a two-handed ember-headed warhammer as a hard prop. |
| `enemy.tagless-stalker` | Humanoid, mostly bare skin under wrapped bandage bands, smooth featureless head, a large diagonal smoke plume off one shoulder — viewed and scoped this pass but not built, to keep the batch to three. |
| `enemy.redaction-warden` | Humanoid, banded segmented armour with open gaps down the front torso (a redaction-bar motif), a polearm with a caged lantern head. |
| `enemy.the-unentered` | Humanoid, a halo of seven floating blank tablets around the head — rigid props on an orbit, not cloth. |

## Refused — sixteen individuals across three families

Not a backlog item; a standing block recorded by `kit/hm-art-law.js` before
this pass and unchanged by it.

| Family | Count | Chassis required | Status |
| --- | ---: | --- | --- |
| Cairn Beasts | 10 | `quadruped-low` (a rotating dry-stone-cairn ribcage) | `CHASSIS_STATUS`: does not exist. |
| March Deserters | 4 | `humanoid-segmented-suspended` (armour hung on one tendon, a fog-filled trench cavity) | `CHASSIS_STATUS`: does not exist. |
| Anchored Quarantine | 2 | — | No `FAMILY_LAW` row, no rank-1 prompt. `kit/hm-concept-art.js` already flags this art as found, not approved. |

Building any of these on the humanoid rig would be exactly the invention the
manifest law forbids — a quadruped forced onto a bipedal skeleton is not an
approximation of the prompt, it is a contradiction of it. The panel refuses
each one explicitly rather than rendering a wrong body with a caveat buried
in a tooltip.

## Reference only — eight playable origins

Four (`gloamfarer`, `bell_warden`, `mire_physicker`, `oathless_scion`) have a
vendored render and no character spec. Four
(`grave_tithe_runner`, `cinder_mason`, `starved_seer`, `thorn_poacher`) have
neither — the same four `GAP-ANALYSIS-CONTENT.md` already flags as missing
art. None of the eight are in `hm-actor-cast.js`, so there is no body to build
from either way; the panel shows what exists and says so.

---

## Ordering, and why

1. **`enemy.ledger-crawler` needs a decision, not a build.** It reads as a
   quadruped-adjacent lectern form despite being filed under Ashbound. Worth
   confirming against the plate again before deciding whether it uses the
   humanoid kit (with a non-torso torso) or waits on the same chassis work
   blocking Cairn Beasts.
2. **The other five queued Ashbound individuals next.** Same kit, same
   pattern, three-to-five sections each at the depth this pass shipped.
3. **`humanoid-segmented-suspended` (March Deserters, 4 individuals) is the
   next chassis worth building.** It is a humanoid skeleton with unusual
   attachment (armour hung on a single tendon, not worn), closer to what
   `kit/hm-husk-rig.js` already does than a true quadruped is.
4. **`quadruped-low` (Cairn Beasts, 10 individuals) is a real new chassis:**
   a four-legged gait engine and a body plan the current spring/capsule
   binder was not built for. Biggest single unlock in this document, and the
   most expensive.
5. **Named-cast plate verification is a standing offer, not scheduled work:**
   measuring any of the 20 art-backed characters' generic-rig render against
   its own plate the way the bestiary already does, one at a time.

## Corrections owed to other files

- `kit/hm-art-law.js` → `CHASSIS_STATUS['humanoid-collapsed'].exists` should
  be `true`. Four built individuals now contradict the `false` it still
  states. Left unchanged in this pass — editing another file's law is exactly
  the kind of silent resolution `CLAUDE-CODE-drive-operations.md` reserves for
  design authority, not a drive-by fix.
- `readme.md` still says "no production creature models exist for any of the
  178 creatures." After this pass that is four, not zero.
