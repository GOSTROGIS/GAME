Increment control for attribute points.

```jsx
<StatStepper label="Vigor" value={vigor} min={8} max={20} onChange={setVigor} />
```

Always accompanied by a BudgetBar. Disable at the bounds rather than clamping silently.

## Accessibility

Both buttons need value-specific accessible names, the output must announce the current value, and native disabled states mark each bound.
