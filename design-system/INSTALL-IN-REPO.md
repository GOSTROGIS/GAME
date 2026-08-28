# Inserting this design system into `sable-reach`

Everything here is path-relative. The canonical target is
**`design-system/` at the repository root**. Apply changes through the normal
feature-branch and reviewed-PR workflow; never upload reference files directly
to `main`.

## What to copy

Copy these into `design-system/`:

```
styles.css              <- entry point (import lines only)
README.md               <- the design guide
SKILL.md                <- Agent Skills wrapper
tokens/                 <- colors, typography, spacing, effects
components/             <- 59 reference primitives in 11 groups
guidelines/             <- 20 foundation specimen cards
ui_kits/game-client/    <- click-through recreation
_ds_fallback.js         <- REQUIRED by standalone cards; dev/reference only
```

**Do not copy** `Hollow March Theme Reference.dc.html`, `github.md`, or
`support.js` — those belong to the design-review workspace, not the repo.

The copied `design-system/assets/` directory is intentionally excluded. Cards
and UI-kit references resolve directly to the repo's canonical root assets:

| In | Canonical reference |
| --- | --- |
| `guidelines/*.card.html` | `../../assets/` |
| `components/*/*.card.html` | `../../../assets/` |
| `ui_kits/game-client/*.jsx` | `../../../assets/` |

## Wiring the game to the tokens

Production token wiring was completed with the vanilla-DOM combat interface.
The root stylesheet imports the four reviewed token sheets and retains
`color-scheme: dark`; focused checks reject duplicate root variables,
keyframes, and reduced-motion declarations.

The production entry begins with:

```css
/* styles.css, at the top */
@import "./design-system/tokens/colors.css";
@import "./design-system/tokens/typography.css";
@import "./design-system/tokens/spacing.css";
@import "./design-system/tokens/effects.css";

/* duplicate declarations remain removed by the token-boundary test */
```

The production `color-scheme: dark` declaration remains outside the imported
tokens. Promoted inline colours can still be replaced one at a time after their
own visual checks.

## The dev shim

`_ds_fallback.js` builds the reference component namespace from source at page
load so the card and UI-kit HTML files render standalone. It no-ops whenever the
generated `_ds_bundle.js` is present. Keep it for development reference pages,
but exclude it, React, ReactDOM, Babel, cards, and UI-kit code from every
production entry and startup bundle.

## Asset validation

`tools/assets/` fails undeclared assets and missing provenance. This folder
references existing declared art only and adds no new binaries, so run the
validator before opening a PR. The number 59 describes reference UI primitives,
not runtime assets or asset maturity; prototype and production-asset gates remain
separate.
