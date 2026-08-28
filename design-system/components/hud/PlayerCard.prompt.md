The player's HUD anchor — top-left, 315px column.

```jsx
<PlayerCard name="Gloamfarer" level={14} rune="G"
  health={{ value: 72, max: 100 }}
  stamina={{ value: 48, max: 100 }}
  focus={{ value: 86, max: 100 }} />
```

Height is fixed at 78px. Pass `portrait` only with a graded render (`--grade-character`); an ungraded image will read as too bright against the HUD.
