Right-hand quest panel.

```jsx
<QuestTracker chapter="Chapter II" title="The Unquenched Blade" progress={0.5}
  objectives={[{ label: "Recover the blade", done: true }, { label: "Lay it at the Warm Cairn" }]} />
```

Strike completed objectives through; don't remove them.

## Accessibility

Completion is written and marked in addition to strike-through. Use a labelled region and avoid live announcements for routine progress ticks.
