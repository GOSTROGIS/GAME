A discipline tile for the skills grid.

```jsx
<SkillTile name="Smithing" level={41} icon="smithing" xpPct={62} onClick={open} />
```

Grid is three columns, dropping to two below 1100px. The XP rule shows progress to the *next* level, not lifetime XP.

## Accessibility

The accessible name includes discipline, level, and progress; the glyph and visual XP bar are decorative.
