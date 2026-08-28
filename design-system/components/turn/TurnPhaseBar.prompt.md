Encounter state and round indicator for the centered HUD anchor.

```jsx
<TurnPhaseBar phase="planning" round={3} detail="2 of 4 ready" />
```

The canonical path is forming → planning → locked → resolving → settling,
followed by victory, defeat, or aborted outcome state.
Use `viewerMode="spectator"` for a non-participant and
`viewerMode="reconnecting"` with `reconnectSeconds` while restoring a lease.

## Accessibility

The current phase—including every terminal outcome—is written in the live
status and marked with `aria-current`. Spectator and reconnecting modes are
written in full; icons and colour are redundant. Reduced motion never changes
phase order.
