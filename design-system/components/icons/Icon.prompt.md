The only icon primitive in the system. Stroked SVG, never emoji, never an icon font.

```jsx
<Icon name="smithing" size={22} />
<Icon name="bestiary" size={18} title="Bestiary" />
```

Inherits `currentColor`, so it picks up hover and disabled states from its parent — don't hard-code a stroke unless the icon must differ from its label. Decorative icons are `aria-hidden` automatically; pass `title` only when the icon is the sole label.

Names cover the eighteen disciplines (`swordsmanship`, `heavy_arms`, `marksmanship`, `guard`, `vitality`, `hexcraft`, `mining`, `woodcutting`, `foraging`, `fishing`, `hunting`, `smithing`, `woodcraft`, `leatherworking`, `alchemy`, `cooking`, `runecrafting`, `wayfaring`), the item classes (`ore`, `herb`, `blade`, `currency`, `ingot`, `timber`, `relic`, `tonic`) and the HUD set (`pack`, `skills`, `journal`, `bestiary`, `atlas`, `close`, `back`, `flask`, `vow`). Missing mark? Add a path to `ICON_PATHS` — never substitute a character.

## Accessibility

Treat the icon as decorative by default with `aria-hidden="true"`. When it conveys meaning, pair it with an adjacent written label or give its containing control an accessible name; never rely on the glyph alone.
