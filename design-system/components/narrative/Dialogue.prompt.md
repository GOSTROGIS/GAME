The conversation box.

```jsx
<Dialogue faction="Ember Ledger" speaker="Vessel-Keeper Ossaline" initial="O"
  line="Write your name in the ledger or do not."
  choices={["Sign the ledger", "Ask about the causeway"]} onChoose={pick} />
```

Choices are serif because the player is speaking. Full dialogue presentation is still open production work.

## Accessibility

The speaker heading labels the section, choice buttons are at least 44px high, focus enters the first choice, and the integration restores focus when dialogue closes.
