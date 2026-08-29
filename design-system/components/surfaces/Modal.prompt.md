Full-screen overlay container. Pair with a 90px header / 1fr body / 78px footer grid.

```jsx
<Modal label="Character creator" style={{ display: "grid", gridTemplateRows: "90px 1fr 78px" }}>
  <header />
  <div />
  <footer />
</Modal>
```

Only the middle row scrolls. Never nest a Modal inside a Modal.

## Accessibility

Supply `label` or `labelledBy`, trap focus in the integration layer, restore focus on close, and use `modal={false}` for non-blocking dialogs.
