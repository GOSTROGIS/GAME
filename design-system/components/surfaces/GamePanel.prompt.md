The in-world content panel for skills, inventory, journal, bestiary and atlas.

```jsx
<GamePanel title="Disciplines" onClose={close}>
  <SkillTile name="Smithing" level={41} icon="&#128296;" />
</GamePanel>
```

Reuse the committed anchor (left 98 / top 120 / bottom 115) rather than positioning it yourself. Header height is fixed — don't grow it to fit a longer title; shorten the title.

## Accessibility

The title labels the section. When `onClose` is present the 44px control has the accessible name “Close panel”.
