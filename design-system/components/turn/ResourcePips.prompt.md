Discrete AP or reaction-reservation display.

```jsx
<ResourcePips label="Action points" value={2} max={2} reserved={1} unit="AP" />
```

Use `Meter` for persistent stamina/focus and this component for small discrete
budgets. Maximum is intentionally capped at twelve visual pips.

## Accessibility

The semantic meter exposes the resource name, value, maximum, unit, and
reservation through `aria-valuetext`. Filled and hatched pips are decorative
and never the sole resource readout.
