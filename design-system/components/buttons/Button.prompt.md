The system's only button — gold `primary` for the one committing action on a screen, `ghost` for everything else.

```jsx
<Button variant="primary" onClick={begin}>Begin the March</Button>
<Button variant="ghost">Continue</Button>
<Button variant="primary" ornate>Swear the Vow</Button>
```

Variants: `primary` | `ghost`, plus `ornate` for the chamfered silhouette and `disabled`. Never place two primaries in one view. Minimum height is locked to `--touch-min` (44px); don't override it.
