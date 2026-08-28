import React from "react";

export function SelectBox({ value, onChange, options = [], id, style, ...rest }) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      style={{
        width: "100%",
        height: 44,
        padding: "0 12px",
        color: "var(--bone)",
        background: "#0a0e10",
        border: "1px solid var(--line)",
        ...style
      }}
      {...rest}
    >
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  );
}
