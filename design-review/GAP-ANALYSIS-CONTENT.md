# Gap analysis: bestiary, named characters, playable origins

Companion to `GAP_ANALYSIS.md`, which tracks the runtime foundation. This one
tracks **authored content depth** — the bestiary, the 42 named characters, and
the 8 playable origins — and it exists because that content is not short of
schema. It is short of *writing*.

This is the brief for the generating agent (Codex). Every number below is
measured from the repository at this commit, not estimated. Reproduce any of
them with the commands in [Measuring](#measuring).

---

## The actual finding

The bestiary looks extremely detailed and is not. Each of the 178 entries
carries 33 fields including `taxonomy`, `anatomy`, `fictionalPathology`,
`locomotion`, `senses`, `horrorLanguage`, `lifecycle`, `behaviorContract`,
`productionBrief`, `codexReveals`, `habitatProfile`, `mechanicContract`,
`maturity` and `designSignature`. That is a genuinely good schema.

But the fields are **permutations of two authored sentences**, not 33
independent observations:

| Measured over all 178 entries | Result |
| --- | ---: |
| `anatomy.anatomicalViolation` == `fictionalPathology.manifestation` == `horrorLanguage.visual` | **178 / 178** |
| `senses.blindSpot` == `locomotion.recoveryTell` | **178 / 178** |
| `lifecycle.origin` == `lore` | **178 / 178** |
| Distinct prose strings (>40 chars) out of 6,433 total | **2,633 — 40.9%** |
| Distinct `lore` sentences | 178 / 178 |
| Distinct `senses.tell` sentences | 178 / 178 |

The last two rows matter: **the seeds are real.** Somebody authored 178 distinct
lore sentences and 178 distinct tells. What is templated is the *expansion* — a
generator took `lore` and `tell` and stamped them into a dozen fields with
connective tissue ("The violation closes into a usable limb when …", "This form
serves the niche expressed by …").

The three `codexReveals` tiers — `sighting`, `study`, `mastery` — are the
clearest case. A player who studies a creature to mastery is shown the same
sentence they were shown on first sighting, with less text. The reveal ladder
currently *removes* information as it deepens.

The named characters have the same signature, in their shape rather than their
prose. Across all 42:

| Field | min | max | avg |
| --- | ---: | ---: | ---: |
| `motivations` | 2 | 2 | 2.00 |
| `secrets` | 1 | 1 | 1.00 |
| `questArcs` | 1 | 1 | 1.00 |
| `relationshipHooks` | 1 | 2 | 1.14 |

Exactly two motivations and exactly one secret for forty-two different people is
a quota, not a cast. Their `dialogueVoice.sampleLine` values *are* all 42
distinct and several are good — Torren Vale's *"Again. The dark does not care
that your first attempt was sincere."* is the standard the rest should meet.

**So the job is not "write more fields."** The schema is already right. The job
is to make each field carry an independent observation, and to make the depth
proportional to how much of the player's attention the subject will hold.

---

## Register: non-negotiable

Every line Codex writes is checked against `design-system/README.md`. That
document is the contract; this is the working summary.

- **Grave, plain, specific.** Material conditions, weather, ritual, debt. No
  whimsy, no winking, no epic-fantasy grandiosity.
- **Second person for the player's situation. Third for the world.** The
  interface never speaks in first person; it has no personality.
- **Two voices, held apart.** World voice (IM Fell English) is sensory,
  concrete, slightly archaic — bodies, weather, debts. System voice (Cinzel /
  Inter) is terse and factual: `HABITAT VALID`, `13,034,431 XP at level 99`.
  Never blend them in one sentence.
- **Naming is compound and occupational.** Bell-Warden, Mire-Physicker,
  Gloamfarer, Ash-Reckoner. Places are compound-descriptive: Hearthmere Hold,
  Dunmire Causeway, Cinderward. Hyphenate freely. **Never** apostrophe-heavy
  fantasy names — no *Zar'thul*.
- **Mechanics stated separately from fiction.** A description is fiction; a
  note is the mechanical consequence. They never merge into one sentence.
- **Honesty is a copy rule.** `authored`, `validated`, `habitat-valid`,
  `integrated`, `prototype`, `production`, `playtested` are distinct claims.
  Copy admits what is unfinished.
- **Sentence case for prose.** UPPERCASE only for Cinzel labels under about
  three words. Never ALL CAPS for emphasis mid-sentence.
- **No emoji.** Not in copy, not in data, not in comments.

One more, specific to this brief: **no field may restate another field.** If
`lifecycle.origin` would repeat `lore`, the entry is not finished. That is the
single acceptance rule that closes the gap this document describes.

---

## Work item 1 — Bestiary de-templating (178 entries)

**Deposit to:** `packages/content/src/bestiary.data.js` (and keep
`src/data/bestiary.js` in step; both export 178 entries and both are validated).

**Gate:** `packages/content/test/bestiary-v3.test.ts` must still pass, and the
new distinctness assertions below must be added to it.

### Tiering — spend effort where it is seen

Do not write 178 entries at equal depth. Rank drives budget:

| Tier | Count | Depth per entry | Rationale |
| --- | ---: | --- | --- |
| **Boss / Miniboss** | see `rank` | Full 33 fields, every one independently authored. 3 distinct `codexReveals`. 2–4 sentence `anatomicalViolation`. Named individual, not a species. | The player will fight it deliberately, probably more than once, and read its codex entry. |
| **Elite / Specialist** | see `rank` | Full fields, independently authored, 1–2 sentences each. Distinct reveals. | Encountered as a set-piece within a region. |
| **Regular** | the bulk | Independently authored `lore`, `anatomicalViolation`, `senses` triple, `lifecycle` quartet, `horrorLanguage` triple. Reveal tiers may be shorter but must still *add* information. | Seen often; carries the region's texture. |

Query the actual per-rank counts before starting:

```bash
node --input-type=module -e "
import { BESTIARY } from './packages/content/dist/bestiary.data.js';
const by = {}; for (const e of BESTIARY) by[e.rank] = (by[e.rank] ?? 0) + 1;
console.log(by);
"
```

### Field-by-field: what each must independently answer

The rule is that a reader who has seen field A learns something *new* from
field B. Use `ash_husk` as the reference case — it currently fails on every row
marked ✗.

| Field | Must answer | Currently |
| --- | --- | --- |
| `lore` | What is it, in one sentence a survivor would say? | ✓ authored, keep |
| `anatomy.anatomicalViolation` | What is physically **wrong** with the body — the specific structural fact a physicker would note? | ✗ repeats `lore` + tell |
| `anatomy.bodyPlan` / `posture` | Skeleton and stance keywords. | ✓ |
| `fictionalPathology.manifestation` | How the affliction **presents** clinically — progression, not appearance. | ✗ repeats `lore` |
| `fictionalPathology.vector` | How it is contracted or transmitted. | partial |
| `locomotion.rule` | How it moves and what that costs it. | ✓ mostly |
| `locomotion.recoveryTell` | The animation window the player exploits. | ✓ |
| `senses.primary` | What it perceives and through what organ or proxy. | ✗ formulaic |
| `senses.tell` | The visible cue that precedes commitment. | ✓ authored, keep |
| `senses.blindSpot` | What it **cannot** perceive — a fact about perception, not a combat tip. | ✗ repeats `recoveryTell` |
| `horrorLanguage.visual` | The image that stays with the player. | ✗ repeats `lore` |
| `horrorLanguage.audio` | What it sounds like, in material terms. | ✓ mostly |
| `horrorLanguage.ritual` | The behaviour it performs that is not combat. | ✗ currently just a move name |
| `lifecycle.origin` | Where an individual comes from. | ✗ repeats `lore` |
| `lifecycle.sustenance` | What it consumes, and what that does to the region. | ✗ repeats family ecology |
| `lifecycle.propagation` | How the population grows. | ✗ formulaic |
| `lifecycle.cessation` | How an individual ends — including without the player. | ✗ combat tip |
| `codexReveals[sighting]` | What a player knows after seeing it once. | ✗ |
| `codexReveals[study]` | What is added by observing it repeatedly. **Must contain a fact absent from `sighting`.** | ✗ |
| `codexReveals[mastery]` | What is added by killing many. **Must contain a fact absent from both.** | ✗ currently shorter than sighting |

### Worked example — the standard to hit

Current `ash_husk`, three fields, one sentence:

> `anatomicalViolation` / `manifestation` / `horrorLanguage.visual`:
> "A body abandoned before its name tablet finished burning; the remaining
> syllable twitches behind its teeth. The violation closes into a usable limb
> when its arms lock wide, then tremble inward."

Rewritten so each field earns its place:

> **`lore`** — "A body abandoned before its name tablet finished burning; the
> remaining syllable twitches behind its teeth."
>
> **`anatomy.anatomicalViolation`** — "The jaw is unhinged and reset wrong, so
> the mandible tracks a half-beat behind the skull. Ash has packed the joint
> and cured there; breaking it does not free the jaw, it only cracks the seal."
>
> **`fictionalPathology.manifestation`** — "Onset is slow and begins at the
> hands. A clerk will notice the fingers stiffening across a season, blame the
> cold, and keep writing. The name goes last, which is why the Ledger records
> so many entries in a hand that had already stopped being a person's."
>
> **`senses.primary`** — "It does not see. It tracks the disturbance a moving
> body makes in settled ash, which is why it is most dangerous in a swept room
> and nearly harmless in a storm."
>
> **`senses.blindSpot`** — "Standing still in falling ash removes you from it
> entirely. Hearthmere's children are taught this before they are taught to
> run."
>
> **`horrorLanguage.ritual`** — "It returns to the ledger house. Not to enter —
> it stands at the threshold and waits to be named, and when it is not, it
> leaves and comes back the next dusk."
>
> **`lifecycle.cessation`** — "Burn the tablet properly and it stops mid-step.
> Left alone it does not die; it wears down, and what remains keeps walking the
> same route with less of a body each year."

Seven independent facts. Same creature, same register, no field restating
another. That is the bar.

### Machine-checkable acceptance

Add to `packages/content/test/bestiary-v3.test.ts`:

```js
for (const e of BESTIARY) {
  // No field may restate another.
  assert.notEqual(e.anatomy.anatomicalViolation, e.lore, `${e.id}: anatomy restates lore`);
  assert.notEqual(e.fictionalPathology.manifestation, e.anatomy.anatomicalViolation, `${e.id}: pathology restates anatomy`);
  assert.notEqual(e.horrorLanguage.visual, e.anatomy.anatomicalViolation, `${e.id}: horror restates anatomy`);
  assert.notEqual(e.senses.blindSpot, e.locomotion.recoveryTell, `${e.id}: blind spot restates recovery tell`);
  assert.notEqual(e.lifecycle.origin, e.lore, `${e.id}: lifecycle restates lore`);

  // The reveal ladder must add, never subtract.
  const [sighting, study, mastery] = e.codexReveals.map((r) => r.text);
  assert.ok(study.length > sighting.length * 0.9, `${e.id}: study reveal is not substantive`);
  assert.ok(mastery.length > sighting.length * 0.9, `${e.id}: mastery reveal is shorter than sighting`);
  assert.notEqual(study, sighting, `${e.id}: study reveal repeats sighting`);
  assert.notEqual(mastery, study, `${e.id}: mastery reveal repeats study`);

  // House style.
  assert.doesNotMatch(JSON.stringify(e), /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, `${e.id}: emoji in bestiary data`);
  assert.doesNotMatch(e.name, /'[a-z]/, `${e.id}: apostrophe-fantasy naming`);
}
// Corpus-level distinctness: the current figure is 40.9%.
assert.ok(distinctProseRatio(BESTIARY) > 0.9, "bestiary prose must be >90% distinct");
```

**Target: >90% distinct, from 40.9% today.**

---

## Work item 2 — Named characters (42)

**Deposit to:** `src/data/characters.js`. `validateCharacters` already runs;
extend it.

### What is missing

- **Quotas, not people.** Exactly 2 motivations / 1 secret / 1 quest arc for
  every one of 42. A tavern keeper and a faction head should not have the same
  narrative surface area.
- **36 of 42 are unplaced.** `PLACED_CHARACTERS` holds six: Maela Voss, Torren
  Vale, Ysra Pell, Orik Senn, Gatewarden Nhal, Vellin the Unwritten. The other
  36 exist as data with no location in the world.
- **No portraits.** `assets/characters/` holds four *origin* renders. Zero of
  the 42 named characters have a portrait, and `PortraitStage` /
  `PortraitCaption` / `CharacterCodexCard` all expect one.
- **`dialogueVoice` has four fields and needs more.** `cadence`, `vocabulary`,
  `verbalTic`, `sampleLine` cannot drive a conversation system.

### Required per character

Extend each record with:

```js
appearance: {
  build, age, bearing,          // for the portrait brief and the paper-doll
  garment,                      // named against the region kit's material language
  distinguishingMark,           // one thing you would describe them by
  gradingNote,                  // must reference the design system grading tokens
},
voice: {
  cadence, vocabulary, verbalTic,   // existing
  sampleLines: [...],               // 4+ distinct, covering: greeting, refusal,
                                    // grief, and the line they say under threat
  refusalStyle,                     // how they say no — the most character-revealing act
  whatTheyNeverSay,                 // the subject they deflect
},
history: {
  before,                       // who they were before the Dimming
  turningPoint,                 // the specific event
  cost,                         // what it took from them, materially
},
```

Depth tiering, same principle as the bestiary:

| Tier | Who | Depth |
| --- | --- | --- |
| **Placed** | the 6 in `PLACED_CHARACTERS` | Full record. 3+ motivations, 2+ secrets, 2+ quest arcs, 6+ sample lines, full appearance and history. The player will talk to them repeatedly. |
| **Faction leads** | one per faction (7) | Full record, 4+ sample lines. |
| **Remainder** | the rest | Extended record, 3+ sample lines, appearance sufficient for a portrait brief. |

### The relationship graph is the highest-value target

48 relationships across 42 characters, avg 1.14 hooks each. A world where
everybody knows one other person is a list. Target **3+ per character**, and
make the graph carry the region's politics: who owes whom, who was at the same
retreat, who is lying to whom about it. Torren Vale's existing arc — he
abandoned a border bell, Maela knows it was ordered, Bram would despise the
truth — is exactly right. There should be forty more of those.

### Acceptance

```js
assert.ok(CHARACTERS.every((c) => c.motivations.length >= 2));
assert.ok(CHARACTERS.filter((c) => c.motivations.length > 2).length >= 13); // placed + faction leads
assert.ok(CHARACTERS.every((c) => c.voice.sampleLines.length >= 3));
assert.ok(new Set(CHARACTERS.flatMap((c) => c.voice.sampleLines)).size ===
          CHARACTERS.reduce((n, c) => n + c.voice.sampleLines.length, 0),
          "every sample line must be distinct across the whole cast");
const hooks = CHARACTERS.reduce((n, c) => n + c.relationshipHooks.length, 0);
assert.ok(hooks / CHARACTERS.length >= 3, "relationship graph too sparse");
assert.ok(CHARACTERS.every((c) => c.appearance?.distinguishingMark));
```

---

## Work item 3 — Playable origins (8)

**Deposit to:** `src/data/character.js` (`ORIGINS`).

These are the highest-stakes writing in the project: the origin blurb is the
first prose a new player reads, on the creator screen, before they have any
investment. All eight currently carry 126–153 characters of lore — one or two
sentences — against a `OptionCard` component built to show a description *and*
a mechanical note.

| Origin | Lore | Art |
| --- | ---: | --- |
| `gloamfarer` | 140 chars | ✓ `assets/characters/gloamfarer-v2.png` |
| `bell_warden` | 148 | ✓ `bell-warden-v2.png` + cutout |
| `mire_physicker` | 145 | ✓ `mire-physicker-v2.png` + cutout |
| `oathless_scion` | 153 | ✓ `oathless-scion-v2.png` + cutout |
| `grave_tithe_runner` | 135 | **✗ missing** |
| `cinder_mason` | 131 | **✗ missing** |
| `starved_seer` | 126 | **✗ missing** |
| `thorn_poacher` | 143 | **✗ missing** |

**Four of eight origins have no art.** A creator screen where half the choices
are illustrated and half are not is the single most visible unfinished thing in
the game. Either all eight get a render in the established grading
(`saturate(.72) contrast(1.09) brightness(.82)` plus drop shadow, per the design
system), or the four existing ones are withheld until the set is complete.
Shipping four is worse than shipping none.

### Required per origin

```js
lore,                  // keep — the one-sentence hook, this is working
openingSituation,      // 2-3 sentences, second person: where you are when play begins
whatYouCarry,          // the fiction behind the starting equipment, not a list
whatYouOwe,            // every origin owes somebody; this drives early quests
howTheReachSeesYou,    // one line per faction that has an opinion — reputation seed
appearanceDefaults,    // AppearanceV2 morph seed so the origin reads before customisation
voiceSample,           // one line in the player-character's register
```

`whatYouOwe` is the load-bearing one. The world's premise is debt and names.
An origin that owes nothing has no reason to leave the starting room.

### Acceptance

```js
assert.equal(ORIGINS.length, 8);
assert.ok(ORIGINS.every((o) => o.openingSituation.length >= 180));
assert.ok(ORIGINS.every((o) => o.whatYouOwe));
assert.ok(ORIGINS.every((o) => o.appearanceDefaults));
// Art parity: all eight, or none.
const art = ORIGINS.filter((o) => existsSync(`assets/characters/${o.id.replace(/_/g, "-")}-v2.png`));
assert.ok(art.length === 0 || art.length === 8, "origin art must be complete or absent, never partial");
```

---

## Deposit format and provenance

Everything Codex produces lands in the repo as **data, not prose documents**.
The codex UI reads `bestiary.data.js`, `characters.js` and `character.js`; a
markdown file describing creatures helps nobody.

Rules that are already enforced and will reject a careless deposit:

- **IDs are frozen.** Never change an existing `id`, `familyId`, `stateFlag`,
  or `questArcs[].id`. Saves and quest state key off them. Adding fields is
  safe; renaming is not.
- **Content IDs are contract-checked.** Dotted forms like `enemy.ash-husk` and
  `npc.maela-voss` pass a dedicated ID contract. New entries must match it.
- **Provenance for every asset.** `tools/assets/validate.mjs` fails undeclared
  assets and missing provenance. Any portrait or origin render needs source,
  licence, hash, budget and maturity metadata in the manifest, and stays at
  `prototype` until the strict-production gate passes.
- **Maturity must stay honest.** Newly written prose is `authored`. It does not
  become `validated` because it is long, and never `production` without art.

Run before opening a PR:

```bash
pnpm test:content        # bestiary, characters, atlas, habitat contracts
pnpm test:assets         # provenance and manifest gates
node design-system/validate.mjs
pnpm test:legacy         # registries, saves, cross-reference validation
```

---

## Measuring

Every figure in this document is reproducible:

```bash
# Bestiary templating ratio and the three duplicate-field checks
node --input-type=module -e "
import { BESTIARY } from './packages/content/dist/bestiary.data.js';
let trip=0, sense=0, origin=0; const all=[], uniq=new Set();
const collect=(o)=>{ if(typeof o==='string'){ if(o.length>40){all.push(o); uniq.add(o);} }
  else if(o&&typeof o==='object') Object.values(o).forEach(collect); };
for (const e of BESTIARY) { collect(e);
  if (e.anatomy.anatomicalViolation===e.fictionalPathology.manifestation &&
      e.fictionalPathology.manifestation===e.horrorLanguage.visual) trip++;
  if (e.senses.blindSpot===e.locomotion.recoveryTell) sense++;
  if (e.lifecycle.origin===e.lore) origin++; }
console.log({ entries: BESTIARY.length, tripleDuplicate: trip, senseDuplicate: sense,
  originDuplicate: origin, distinctRatio: (uniq.size/all.length).toFixed(3) });
"

# Character field quotas
node --input-type=module -e "
const { CHARACTERS } = await import('./src/data/characters.js');
for (const k of ['motivations','secrets','questArcs','relationshipHooks']) {
  const l = CHARACTERS.map((c) => c[k].length);
  console.log(k, 'min', Math.min(...l), 'max', Math.max(...l));
}"

# Origin art parity
node --input-type=module -e "
const { ORIGINS } = await import('./src/data/character.js');
ORIGINS.forEach((o) => console.log(o.id.padEnd(20), o.lore.length, 'chars'));
" && ls assets/characters/
```

---

## What this document does not claim

- It does not claim the existing content is bad. The 178 lore sentences and 42
  sample lines are authored, distinct, and in the right register. The failure is
  in the expansion layer, and it is a mechanical failure with a mechanical fix.
- It does not claim any of this is art direction for the models. The
  `productionBrief` on each bestiary entry already declares `targetScaleMeters`,
  `assetClass`, `requiredClips`, `materialLanguage`, `vfxLanguage` and
  `audioLanguage`. Modelling is tracked in `GAP_ANALYSIS.md`, where the
  standing position remains: **178 authored creatures, zero production models.**
- It sets no schedule. The tiering exists so the work can stop at a defensible
  line — placed characters and boss-rank creatures first — rather than
  requiring all 228 subjects before any of it is worth shipping.
