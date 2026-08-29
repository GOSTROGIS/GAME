Choice card for origins, vows and disciplines. Lay out in a 2-column grid.

```jsx
<OptionCard selected title="Gloamfarer"
  description="You walked the dark roads before they had names."
  note="+2 WAYFARING" onClick={pick} />
```

Keep all three selection signals — they exist so the state survives a bright background. Put mechanical effect in `note`, never in `description`.

## Accessibility

Selection uses `aria-pressed`; title, fiction, and mechanical note remain in the button's accessible content. Do not create nested controls.
