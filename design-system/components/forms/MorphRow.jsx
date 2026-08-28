import React from "react";

export function MorphRow({ label, value = 0.5, onChange, id, style, ...rest }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 85px", gap: 12, alignItems: "center", ...style }} {...rest}>
      <label htmlFor={id} style={{ font: "13px var(--serif)", color: "var(--bone)" }}>{label}</label>
      <input
        id={id}
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange && onChange(parseFloat(e.target.value))}
        style={{ accentColor: "var(--gold)", width: "100%" }}
      />
    </div>
  );
}
