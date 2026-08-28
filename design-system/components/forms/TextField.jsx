import React from "react";

export function TextField({ value, onChange, placeholder, id, style, ...rest }) {
  return (
    <input
      id={id}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange && onChange(e.target.value)}
      style={{
        width: "min(500px, 100%)",
        height: 52,
        padding: "0 14px",
        color: "var(--bone)",
        background: "#090d0f",
        border: "1px solid var(--line)",
        font: "var(--type-field)",
        ...style
      }}
      {...rest}
    />
  );
}
