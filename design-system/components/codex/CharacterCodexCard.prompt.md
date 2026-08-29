A named-character entry in the lore codex.

```jsx
<CharacterCodexCard role="Vessel-Keeper" faction="Ember Ledger"
  name="Ossaline" voice="&ldquo;The bells will keep it either way.&rdquo;"
  description="Keeps the Hold's ledger of debts and names." />
```

Give every character a `voice` line. Note placement status precisely: all 42
are authored with canonical atlas-site anchors; only Maela, Torren, and Ysra
currently have within-site runtime placements.

## Accessibility

Keep name, role, faction, and voice in DOM text. When the integration adds placement through the card content, keep that textual too. Portraits supplement identity and require useful alt text when added.
