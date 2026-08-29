import React from "react";

export function Swatch({ color, selected = false, onClick, label, style, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
      style={{
        width: 34,
        height: 34,
        padding: 0,
        borderRadius: "var(--radius-round)",
        border: "2px solid transparent",
        background: color,
        cursor: "pointer",
        transition: "var(--ease-fast)",
        boxShadow: selected ? "0 0 0 2px var(--gold), 0 0 14px rgba(185,149,82,.35)" : "0 0 0 1px #4b4e4a",
        transform: selected ? "scale(1.08)" : "none",
        ...style
      }}
      {...rest}
    />
  );
}
