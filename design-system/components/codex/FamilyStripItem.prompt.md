A family header in the bestiary's filter strip.

```jsx
<FamilyStripItem name="Drowned" count="11 creatures"
  description="Parish dead that the water kept." />
```

There are exactly 21 families; don't invent a twenty-second.

## Accessibility

If interactive, render it as a button with `aria-pressed`; otherwise keep it a labelled article. Always expose the creature count in text.
