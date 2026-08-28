Four-member encounter roster with leader, connection, and readiness state.

```jsx
<PartyReadiness members={[
  { id: "a", name: "Maela", leader: true, ready: true, connected: true },
  { id: "b", name: "Torren", ready: false, connected: false, graceSeconds: 42 }
]} />
```

Use `viewerMode="spectator"` for the read-only public view. Use
`viewerMode="reconnecting"` with `reconnectSeconds` while restoring the local
participant, and use a member `connectionState` for roster-level transitions.

## Accessibility

Every member and viewer state is written in text. The count is a status;
disconnection and reconnection include remaining grace when known. Spectator
mode is explicitly read-only, and no state relies only on colour or icon.
