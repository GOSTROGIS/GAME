# The Hollow March — Design System

The visual system for **The Hollow March**, an original dark-fantasy
shared-world action-RPG in active production. This system is a *transcription*
of the game's own stylesheet, not a new design: every colour, size, tracking
value and shadow here was lifted from `styles.css` in the source repository.

## Why this exists

The project is worked by several agents and people in rotation — Claude Code,
Claude Design, ChatGPT Codex — and the failure mode is not ugliness, it is
**drift**: four authors independently eyeballing the same dark palette and
landing on four slightly different greys. This system is the shared reference
that stops that.

It is designed to be a **drop-in superset** of the game's stylesheet. The
thirteen canonical tokens use the game's own names (`--ink`, `--gold`,
`--line`), so `styles.css` in the repo could eventually delete its `:root`
block and import `tokens/colors.css` instead, with no visual change.

## Sources

| Source | What was taken |
| --- | --- |
| `github.com/Ostrowidzki1989/sable-reach` &rarr; `styles.css` | The entire visual system — every token, component, anchor and grade |
| `&rarr; DESIGN.md` | Player promise, three loops, visual direction, production priorities |
| `&rarr; README.md` | Content counts, capability matrix, maturity vocabulary, controls |
| `&rarr; src/data/skills.js`, `registries.js` | The icon glyph set |
| `&rarr; assets/world/`, `assets/characters/`, `assets/concept/` | Nine original renders, copied into `assets/` |

Read access only — nothing in this system was written back to the repository.

---

## CONTENT FUNDAMENTALS

**Register.** Grave, plain, and specific. The world is materially unpleasant and
the copy does not soften it: *"waterlogged tissue, collapsed sinuses, and a gait
that favours the flooded side."* No whimsy, no winking, no epic-fantasy
grandiosity.

**Person.** Second person for the player's situation ("You walked the dark roads
before they had names"). Third person for the world. Never first person from the
system — the interface does not have a personality.

**Two voices, held apart.**

- *World voice* (IM Fell English): sensory, concrete, slightly archaic syntax.
  Describes bodies, weather, debts. "The bells are rung to keep the names, not
  the hours."
- *System voice* (Cinzel uppercase, and Inter for numbers): terse and factual.
  "HABITAT VALID". "13,034,431 XP at level 99". Never atmospheric.

**Naming.** Compound and occupational — Bell-Warden, Mire-Physicker, Gloamfarer,
Vessel-Keeper, Ash-Reckoner. Places are compound-descriptive: Hearthmere Hold,
Dunmire Causeway, Cinderward, Hollow Abbey, Graven March. Hyphenate freely.
Never apostrophe-heavy fantasy names (no *Zar'thul*).

**Mechanics are stated separately from fiction.** An OptionCard's
`description` is fiction; its `note` is the mechanical consequence
(`+2 WAYFARING`). They never blend into one sentence.

**Honesty is a copy rule, not just a process rule.** The project's own README
distinguishes authored, validated, habitat-valid, integrated, prototype,
production and playtested — and says so in user-facing surfaces. Copy admits
what is unfinished: "keyframe, not final art", "LIVE MORPH PROFILE". Never
imply a capability that isn't wired.

**Casing.** Sentence case for prose. UPPERCASE only for Cinzel labels under
about three words. Title Case for proper nouns. Never ALL CAPS for emphasis in
a sentence.

**Emoji: no.** Not in copy, not in UI. (Eleven skill records in the repo do use
emoji as icons — see ICONOGRAPHY; that is flagged as an inconsistency, not a
precedent.)

---

## VISUAL FOUNDATIONS

**The one-sentence version.** Near-black grounds, warm bone type, a single gold
accent, hairlines instead of corners, and a film grain over everything.

**Colour.** Thirteen canonical tokens: three darks, two neutrals, six signals,
two translucent membranes. Signals carry fixed meaning — gold is accent and
state, ember is hazard and forge, blood is harm, moss is growth and completion,
focus is the only cool hue. **Gold never sets body text.** Nothing is pure white
(`--bone` is `#d8d0bd`) and nothing is pure black in the UI layer
(`--ink` is `#080b0d`). Maximum two background colours in any one view.

**Type.** Three families with no crossover. Cinzel is the interface voice —
uppercase and tracked from .12em to .28em as it gets smaller. IM Fell English is
the world's voice, an irregular seventeenth-century face used for all
description and dialogue, frequently italic. Inter is machine voice: keys,
counts, telemetry. There is deliberately **no monospace token**.

**Backgrounds.** Full-bleed region keyframes under heavy gradient scrims, or a
radial `--world-canvas` gradient. Never a flat colour behind a hero. Never a
photographic texture. Panels are translucent so the scene stays faintly present.

**Texture.** Two layers, always on, never optional: an animated fractal-noise
grain at 8% opacity stepping in two frames every .28s, and a single inset
vignette (`0 0 180px 35px` at 85% black). Together they are most of why the
interface reads as filmic rather than flat.

**Borders.** One pixel of `--line` — bone at 18% opacity, so it reads as light
catching an edge rather than a drawn rule. Interior dividers drop to 10%.
Coloured borders appear only for state: gold for selection, ember for a warning.

**Corner radius.** The system is square. Radius appears in exactly three places:
50% on the player rune and colour swatches, and 2px on `kbd`. A rounded card
is not this system. Where a silhouette needs ceremony it gets the **chamfer** —
an 8px clip-path bevel on each vertical edge (`--clip-ornate`), reserved for
the title screen and oath moments.

**Cards.** Hairline border, translucent gradient fill, no radius, and — for
cards in a grid — **no shadow at all**. Shadow is reserved for surfaces that
genuinely float: panels, modals, the dialogue box. Every one of those pairs a
soft outer shadow with a 1px inner highlight (`inset 0 1px rgba(255,255,255,.035)`)
so the top edge catches light.

**Selection.** Marked three ways simultaneously — gold border, tinted gradient
fill, and a 3px inset bar on the left. Redundant on purpose: selection must
survive being read over a bright keyframe.

**Hover.** Gold-ward, never brighter-white. Ghost controls shift their border
and text to gold; the primary button uses `brightness(1.15)` and lifts 1px;
images go from 72% to 92% opacity with a 1.015 scale. Transitions are `.2s ease`
for controls, `.35s ease` for imagery.

**Press and disabled.** No shrink, no colour inversion. Disabled drops to 50%
opacity and switches the cursor; locked content drops to 55% and stays visible
so the player can see the ceiling they are working toward.

**Focus.** A 2px `--gold-bright` outline at 3px offset. Never removed.

**Motion.** Restrained and slow. Title content rises 18px over 1.1s on
`cubic-bezier(.16,1,.3,1)`. Toasts live 3.1s total. The death overlay fades in
over 1.4s. Meters transition width over .3s. No bounce, no spring, no parallax.
`prefers-reduced-motion` is honoured in the token stylesheet.

**Transparency and blur.** `backdrop-filter: blur(12px)` on floating panels
only. Fills sit between 55% and 98.5% opacity depending on how much the surface
must dominate: HUD cards ~90%, modals ~98.5%.

**Imagery.** Cool, desaturated, grainy. Every render is graded before use and
**never shipped raw** — characters get
`saturate(.72) contrast(1.09) brightness(.82)` plus a heavy drop shadow; atlas
stills get `sepia(.18) saturate(.7) contrast(1.18)`; region cards sit at 72%
opacity under a scrim. Character art is mature, narrow anatomy with plague-worn
faces. Cute proportions, heroic torsos, pristine armour and comedy silhouettes
are outside the language.

**Layout.** Anchored, not flowed. Fixed gutters (24px sides, 22px top), fixed
measures (315px HUD columns, 288px tracker, 62px nav rail, 76&times;61 action
slots), and a shell minimum of 920&times;620. A new overlay reuses an existing
anchor rather than inventing a position. One breakpoint at 1100px, where columns
narrow and the hint strip is hidden entirely.

**Accessibility floor.** 44px minimum on interactive controls. Two components
sit deliberately below it — the 34px swatch and 28px stepper — and are dense
desktop only. The 8px tracked labels are the system's signature and its main
legibility risk: they work because they are short, uppercase and
high-contrast, and are never used for content a player must read to proceed.

---

## ICONOGRAPHY

**Stroked SVG only. Emoji are prohibited, and so is every alternative to a
path:** no icon font, no raster icon, and no bare Unicode character pressed
into service as an icon.

One primitive does all of it — `<Icon name="…" />` renders a 24×24 path with
`fill: none`, `stroke: currentColor` and `stroke-width: 1.4`. Because the
stroke inherits, an icon picks up its parent's hover and disabled colour for
free and can never introduce a value outside the palette.

Thirty-five names, in three groups:

| Group | Names |
| --- | --- |
| The eighteen disciplines | `swordsmanship` `heavy_arms` `marksmanship` `guard` `vitality` `hexcraft` `mining` `woodcutting` `foraging` `fishing` `hunting` `smithing` `woodcraft` `leatherworking` `alchemy` `cooking` `runecrafting` `wayfaring` |
| Item classes | `ore` `herb` `blade` `currency` `ingot` `timber` `relic` `tonic` |
| Navigation and HUD | `pack` `skills` `journal` `bestiary` `atlas` `close` `back` `flask` `vow` |

Decorative icons are `aria-hidden` automatically; pass `title` only when the
icon carries meaning no adjacent text does. Missing a mark? Add a path to
`ICON_PATHS` — never substitute a character.

The one drawn shape that is not an `Icon` is the journal bullet: a 6px square
rotated 45°, built in CSS because it is a list marker rather than an icon.

**The defect this replaces.** Eleven of the eighteen skill records in
`src/data/skills.js` still carry full-colour emoji, and the item registries use
bare Unicode geometry. Both ignore the palette and render as platform-specific
artwork. This system does not reproduce either; the data is a fix waiting to
happen, not a precedent.

No logo or brand mark exists in the source repository, so none was created. The
title treatment is type: "The Hollow" in `--bone-bright` with "March" in
`--gold-bright`, Cinzel 500 at `-.05em`. Where a mark would go, set the name.

---

## Index

| Path | What |
| --- | --- |
| `styles.css` | Entry point. Import lines only — link this one file. |
| `tokens/colors.css` | 13 canonical + 20 promoted + semantic aliases |
| `tokens/typography.css` | Three families, composite scale, tracking |
| `tokens/spacing.css` | Space scale, HUD/modal/dialogue anchors, touch floor |
| `tokens/effects.css` | Fills, shadows, texture, grading, motion, keyframes |
| `components/` | 45 primitives in 11 groups |
| `guidelines/` | 20 foundation specimen cards |
| `ui_kits/game-client/` | Click-through recreation of the five real surfaces |
| `assets/` | 9 original renders — 4 world keyframes, 4 origins, 1 title |
| `SKILL.md` | Agent Skills wrapper for use in Claude Code |

### Components

| Group | Components |
| --- | --- |
| `icons/` | Icon — the only icon primitive, 35 stroked paths |
| `buttons/` | Button, CodexBack |
| `labels/` | Eyebrow, FieldLabel, Kbd, StatusPill, LockedLore, MicroMeta |
| `surfaces/` | GlassPanel, Modal, GamePanel, BudgetBar, Grain, Vignette |
| `meters/` | Meter |
| `hud/` | PlayerCard, TargetCard, LocationCard, SideNav, ActionBar, HintStrip, QuestTracker, InteractionPrompt, Toast, CombatText |
| `forms/` | TextField, SelectBox, OptionCard, Swatch, StatStepper, MorphRow, StepDots, AttributeRow |
| `progression/` | SkillTile, TechniqueSummary, TechniqueNode, MasteryCard, ActionCodexEntry |
| `codex/` | EnemyCodexCard, CharacterCodexCard, FactionCard, FamilyStripItem, RelationshipRow, JournalEntry, WorldCard |
| `inventory/` | ItemSlot, PaperDoll, SheetStat |
| `narrative/` | Dialogue, SpeakerMark, PortraitStage, PortraitCaption, DeathScreen |

Runtime namespace: `window.HollowMarch`.

### Intentional additions

Everything above maps to a class in `styles.css`. Four items are additions:

- **StatusPill** generalises `.status-row i` into a named maturity marker,
  because the maturity vocabulary is a project-wide rule rather than one card's
  detail.
- **MicroMeta** names the 8px tracked label that appears inline across a dozen
  unrelated selectors.
- **Grain** / **Vignette** promote two always-on texture layers into components
  so they cannot be forgotten when a new full-bleed scene is built.
- **Icon** replaces the repository's mixed Unicode-and-emoji icon practice with a
  single stroked-SVG primitive. This is the one place the design system
  deliberately *diverges* from the source rather than transcribing it — the
  mixed practice is a defect, and reproducing it faithfully would propagate it.

No component was invented for a pattern the stylesheet does not define.

---

## Direction change in flight

The stylesheet was authored for a **real-time** action game. The project is
moving to **turn-based**. Three components encode real-time assumptions and are
marked *under revision* in their `.d.ts`:

- **Meter** `kind="stamina"` — a continuously draining resource presumes
  real-time commitment.
- **ActionBar** — the `1`/`2`/`Space` bindings are light/heavy/dodge, i.e.
  timing windows.
- **CombatText** — floating numbers assume continuous resolution.

Turn-based will need vocabulary that does not exist yet: a turn-order or
initiative rail, per-turn action economy, committed-intent preview, and a
resolution log. When those are designed they belong here first, then in the
game.

Everything else — palette, type, surfaces, panels, all cards, all forms, the ten
encounter roles — is mechanic-neutral and survives the change.

---

## Caveats

- **Fonts are CDN-linked, not vendored.** Cinzel, IM Fell English and Inter are
  loaded from Google Fonts by `styles.css`. The binaries are not committed
  here, so this system needs network access on first paint. If you want them
  vendored, supply the `.woff2` files and I will write real `@font-face` rules.
- **Runtime namespace assumed.** Card files mount from `window.HollowMarch`.
  If the compiler assigns a different namespace, that string is the only thing
  needing a find-and-replace.
- **Cards transform JSX with the classic runtime.** `_ds_fallback.js` and the
  card runners pass `[["react", { runtime: "classic" }]]` to Babel. The default
  automatic runtime emits `import { jsx } from "react/jsx-runtime"`, which
  cannot run outside a module — if you add a card, keep the classic preset.
  Two further gotchas found the hard way: `type="text/babel"` scripts do not
  auto-execute in every host (hence the explicit runners), and unicode escapes
  in a JSX *attribute string* are not processed, so glyphs must be written
  `glyph={"\u2694"}` rather than `glyph="\u2694"`.
- **Nothing was written to the repository.** Repo access here is read-only.
- **Four of eight origins have no art**, and no production creature models
  exist for any of the 178 creatures. Components reflect this rather than
  papering over it.
