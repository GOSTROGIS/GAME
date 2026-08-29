Native dropdown, used in two-column pairs.

```jsx
<FieldLabel htmlFor="hair">Hair</FieldLabel>
<SelectBox id="hair" value={hair} onChange={setHair} options={["Cropped", "Shorn", "Bound"]} />
```

Stays native for accessibility. Don't build a custom popover version.

## Accessibility

Provide a bound visible label and preserve native keyboard operation. Placeholder choices must not hide the current value.
