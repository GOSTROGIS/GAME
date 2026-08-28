import React from "react";

export function StatStepper({ value = 0, min = 0, max = 99, onChange, style, ...rest }) {
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
    <div style={{ display: "flex", alignItems: "center", gap: 12, ...style }} {...rest}>
      <button type="button" aria-label="Decrease" disabled={value <= min} onClick={() => onChange && onChange(value - 1)} style={btn}>&minus;</button>
      <output style={{ minWidth: 20, textAlign: "center", fontFamily: "var(--display)", color: "var(--bone)" }}>{value}</output>
      <button type="button" aria-label="Increase" disabled={value >= max} onClick={() => onChange && onChange(value + 1)} style={btn}>+</button>
    </div>
  );
}
