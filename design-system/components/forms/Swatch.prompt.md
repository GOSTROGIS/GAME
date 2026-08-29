Circular palette choice for appearance.

```jsx
<Swatch color="#6b5847" label="Ash grey" selected onClick={pick} />
```

34px is below the 44px touch floor, so only use it in a dense desktop palette row — never as the sole control on a touch surface.

## Accessibility

Every swatch needs a colour name and `aria-pressed` selection state. Provide a larger equivalent control for touch layouts.
