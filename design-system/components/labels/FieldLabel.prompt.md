Label above any form control. Carries the form's vertical rhythm in its own margin.

```jsx
<FieldLabel htmlFor="origin">Chosen Origin</FieldLabel>
<OptionGrid id="origin" />
```

Don't add extra margin above it — the 28px is deliberate and consistent down the whole form.

## Accessibility

Always bind `htmlFor` to the owned input; do not use this component as decorative text.
