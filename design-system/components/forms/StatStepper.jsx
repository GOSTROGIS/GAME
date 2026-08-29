import React from "react";

export function StatStepper({ label, value = 0, min = 0, max = 99, onChange, style, ...rest }) {
  const btn = {
    width: 28,
    height: 28,
    padding: 0,
    border: "1px solid var(--line)",
    background: "#101517",
    color: "var(--bone)",
    cursor: "pointer"
  };
  return (
    <div role="group" aria-label={`${label}: ${value}`} style={{ display: "flex", alignItems: "center", gap: 12, ...style }} {...rest}>
      <button type="button" aria-label={`Decrease ${label}; current value ${value}`} disabled={value <= min} onClick={() => onChange && onChange(value - 1)} style={btn}>&minus;</button>
      <output aria-live="polite" aria-atomic="true" aria-label={`${label}: ${value}`} style={{ minWidth: 20, textAlign: "center", fontFamily: "var(--display)", color: "var(--bone)" }}>{value}</output>
      <button type="button" aria-label={`Increase ${label}; current value ${value}`} disabled={value >= max} onClick={() => onChange && onChange(value + 1)} style={btn}>+</button>
    </div>
  );
}
