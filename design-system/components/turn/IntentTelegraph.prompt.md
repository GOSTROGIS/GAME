One fully disclosed hostile intent.

```jsx
<IntentTelegraph actor="Ash Husk" action="Cinder Lunge" target="Maela"
  band="Fast" damage="Moderate damage"
  statusIcons={[{ id: "scorch", glyph: "△", label: "Scorch" }]}
  cue="Draws its shoulders beneath the ash-cloth"
  interrupt="Stagger before the fast band" onInspect={inspect} />
```

Exact damage may remain codex-gated, but target/area, band, damage band,
status icons with written labels, sensory cue, and interrupt rule are always
present. Pass an empty `statusIcons` array when the action applies no status.

## Accessibility

The component builds a complete nonvisual sentence. Every status glyph has an
adjacent written label. Selection uses `aria-pressed` when interactive and
remains textual as well as coloured.
