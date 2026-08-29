Bottom-centre action rail.

```jsx
<ActionBar slots={[
  { id: "light", glyph: "\u2694", label: "Light", key: "1" },
  { id: "flask", glyph: "\u2697", label: "Flask", key: "4", count: 3 }
]} />
```

The shell is stable; the *bindings* are under revision for turn-based. Don't build new real-time timing affordances onto it.

## Accessibility

Every slot is a native 44px-or-larger button whose visible label supplies its name. Key labels are supplemental, and disabled commands use native `disabled`.
