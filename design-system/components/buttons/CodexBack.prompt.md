Return control for a drilled-in codex, bestiary or technique view.

```jsx
<CodexBack label="All disciplines" onClick={() => setView("list")} />
```

Prefer naming the destination over a bare "Back". Sits above the panel content, never inside the panel header.

## Accessibility

The destination label supplies the accessible name. Restore focus to the card or control that opened the drilled-in view.
