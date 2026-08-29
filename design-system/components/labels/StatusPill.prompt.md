Maturity marker — mandatory on any card that shows content which is not production-complete.

```jsx
<StatusPill>Authored</StatusPill>
<StatusPill tone="valid">Habitat valid</StatusPill>
<StatusPill tone="prototype">Prototype</StatusPill>
```

Use the project's seven words exactly. A card without a pill implies a finished asset and will mislead the next author.

## Accessibility

Write the full state in text. Use `role="status"` only when the state changes live.
