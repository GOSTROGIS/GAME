Resource bar for health, stamina, focus or an enemy.

```jsx
<Meter kind="health" value={72} max={100} />
<Meter kind="focus" value={9} max={12} label="FOCUS" />
```

Health is deliberately taller (10px) than the others (7px) — it is the only meter with weight. Enemy is flat, never gradient. `stamina` is under revision for turn-based.

## Accessibility

Provide an accessible label and numeric value/max wherever the meter carries information. The fill width and colour are redundant visuals.
