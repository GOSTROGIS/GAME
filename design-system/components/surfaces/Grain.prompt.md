The always-present film-grain layer. One per scene.

```jsx
<div style={{ position: "relative" }}>
  <World />
  <Grain />
  <Vignette />
</div>
```

Never raise the opacity above .08 or the type starts to buzz. Requires a positioned parent.

## Accessibility

The layer is always `aria-hidden`, ignores pointer input, and reduced-motion tokens collapse its animation.
