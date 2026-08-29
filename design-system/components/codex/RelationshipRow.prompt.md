A relationship hook between two named characters.

```jsx
<RelationshipRow from="Ossaline" kind="owes" to="Orik"
  description="A debt entered in the ledger before the flood." />
```

Make the `kind` a verb so the row reads as a sentence.

## Accessibility

Preserve `from → verb → to` DOM order and include the relationship description. The connector glyph is decorative.
