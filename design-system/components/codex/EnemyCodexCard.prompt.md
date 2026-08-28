A bestiary entry. Two-column grid.

```jsx
<EnemyCodexCard rank="Elite &middot; Controller" region="Dunmire Causeway"
  name="Parish Drowner"
  description="Waterlogged tissue, collapsed sinuses, a gait that favours the flooded side."
  facts={[{ term: "Family", value: "Drowned" }]}>
  <div style={{ display: "flex", gap: 5, margin: "7px 0" }}>
    <StatusPill>Authored</StatusPill><StatusPill tone="prototype">Prototype</StatusPill>
  </div>
  <LockedLore>Codex reveal 2 of 4 locked</LockedLore>
</EnemyCodexCard>
```

Description is horror language about the body — never a stat block. The maturity strip is mandatory.
