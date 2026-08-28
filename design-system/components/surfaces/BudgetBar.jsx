import React from "react";

export function BudgetBar({ children, style, ...rest }) {
  return (
    <div
      style={{
        position: "sticky",
        top: -34,
        zIndex: 2,
        padding: 12,
        margin: "-10px 0 10px",
        background: "#111719",
        borderBottom: "1px solid var(--line)",
        color: "var(--gold-bright)",
        font: "12px var(--display)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        ...style
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
