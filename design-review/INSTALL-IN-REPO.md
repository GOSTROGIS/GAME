# Inserting this design system into `sable-reach`

Everything here is path-relative, so the whole tree drops into one folder with
no edits. Target: **`design-system/` at the repo root.**

Repo access from this side is read-only — no commit was made. Two ways in:

**A. Browser upload.** Unzip the download, then drag the files onto
<https://github.com/Ostrowidzki1989/sable-reach/upload/main/design-system>

**B. Claude Code.** Point it at this project and have it commit; it has write
access.

## What to copy

Copy these into `design-system/`:

```
styles.css              <- entry point (import lines only)
readme.md               <- the design guide
SKILL.md                <- Agent Skills wrapper
tokens/                 <- colors, typography, spacing, effects
components/             <- 44 primitives in 10 groups
guidelines/             <- 20 foundation specimen cards
ui_kits/game-client/    <- click-through recreation
assets/                 <- 9 renders (already originals from this repo)
_ds_fallback.js         <- OPTIONAL dev shim; safe to omit (see below)
```

**Do not copy** `Hollow March Theme Reference.dc.html`, `github.md`, or
`support.js` — those belong to the design-review workspace, not the repo.

`assets/` here is a copy of the repo's own `assets/concept`, `assets/world` and
`assets/characters`. If you would rather not duplicate the binaries, delete
`design-system/assets/` and repoint the references:

| In | Change |
| --- | --- |
| `guidelines/*.card.html` | `../assets/` &rarr; `../../assets/` |
| `components/codex/codex.card.html` | `../../assets/` &rarr; `../../../assets/` |
| `components/inventory/inventory.card.html` | `../../assets/` &rarr; `../../../assets/` |
| `components/narrative/narrative.card.html` | `../../assets/` &rarr; `../../../assets/` |
| `ui_kits/game-client/*.jsx` | `../../assets/` &rarr; `../../../assets/` |

## Wiring the game to the tokens

The thirteen canonical tokens in `tokens/colors.css` are byte-identical to the
`:root` block in the repo's `styles.css`. That makes the following a **no-op
visual change** and the point of the whole exercise:

```css
/* styles.css, at the top */
@import "./design-system/tokens/colors.css";
@import "./design-system/tokens/typography.css";
@import "./design-system/tokens/spacing.css";
@import "./design-system/tokens/effects.css";

/* then delete the :root block and the @keyframes that moved */
```

Do it in that order and verify before deleting: import first, confirm nothing
moves, then remove the duplicate declarations. The design system also promotes
about twenty previously-inline hex literals into tokens, so after the import
those can be replaced one at a time — `#682a2b` becomes `var(--health-from)`
and so on.

## The dev shim

`_ds_fallback.js` builds the component namespace from source at page load so the
card and UI-kit HTML files render standalone. It is not part of the design
system and it no-ops whenever the generated `_ds_bundle.js` is present. Omit it
from the repo unless you want the kit to open directly from a file path.

## Asset validation

`tools/assets/` fails undeclared assets and missing provenance. This folder
references existing declared art only and adds no new binaries, so it should
pass unchanged — but run the validator before opening a PR, and note that the
strict-production gate already fails by design while the 59 runtime assets are
labelled prototypes.
