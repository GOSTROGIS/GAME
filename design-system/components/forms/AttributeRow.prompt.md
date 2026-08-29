A row in the attribute allocation list.

```jsx
<AttributeRow abbr="VIG" name="Vigor" description="Raises health and resistance to bleed.">
  <StatStepper label="Vigor" value={v} onChange={setV} />
</AttributeRow>
```

Describe the *effect*, not the stat. The eight attributes are Vigor, Endurance, Might, Finesse, Insight, Will, Attunement, Presence.

## Accessibility

Associate the attribute name and effect with its stepper using a fieldset, labelled group, or `aria-describedby`. Never expose only the abbreviation.
