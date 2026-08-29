Stage indicator for the creator header.

```jsx
<StepDots count={6} active={2} />
```

Don't mark completed stages differently — movement between stages is free, so a "done" state would misinform.

## Accessibility

Expose “Step N of M” as the accessible label and mark the active bar with `aria-current="step"`; decorative bars stay hidden.
