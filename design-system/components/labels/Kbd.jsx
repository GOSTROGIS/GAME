import React from "react";

export function Kbd({ children, style, ...rest }) {
  return (
    <kbd
      style={{
        minWidth: 32,
        padding: "4px 7px",
        textAlign: "center",
        color: "var(--gold-bright)",
        background: "var(--kbd-bg)",
        border: "1px solid var(--kbd-edge)",
        borderRadius: "var(--radius-kbd)",
        boxShadow: "var(--shadow-kbd)",
        font: "var(--type-kbd)",
        ...style
      }}
      {...rest}
    >
      {children}
    </kbd>
  );
}
