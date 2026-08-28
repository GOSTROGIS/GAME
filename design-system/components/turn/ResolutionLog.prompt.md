Monotonic, replayable encounter history.

```jsx
<ResolutionLog events={events} liveSummary="Fast band resolved. Two events." />
```

The newest cursor is visible and events remain in server order. Presentation
delays may be skipped, but entries may never be reordered or omitted.

## Accessibility

Events use an ordered list. Announce one concise band summary through the polite
live region rather than speaking every rapid event; the complete history stays
keyboard-readable.
