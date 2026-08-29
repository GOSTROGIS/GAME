The 62px menu rail on the left edge of the HUD.

```jsx
<SideNav active="skills" onSelect={setPanel} items={[
  { id: "pack", glyph: "\u25A6", label: "Pack", key: "I" },
  { id: "skills", glyph: "\u25C8", label: "Skills", key: "K" }
]} />
```

Icons are `Icon` names — never characters or emoji. Keep labels to one word.

## Accessibility

The nav has a visible or accessible label, each 56px button includes text, and the active panel uses `aria-current` or `aria-pressed`.
