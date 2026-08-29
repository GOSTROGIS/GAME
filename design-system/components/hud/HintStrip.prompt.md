Keybinding hints under the action bar.

```jsx
<HintStrip hints={[{ key: "E", label: "Use" }, { key: "Esc", label: "Close" }]} />
```

It disappears under 1100px, so never make it the only place a control is taught.

## Accessibility

Bindings are supplemental to labelled controls and the help panel. Preserve readable DOM text and do not announce decorative separators.
