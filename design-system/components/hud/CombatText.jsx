import React from "react";

export function CombatText({ children, style, ...rest }) {
  return (
    <span
      {...rest}
      aria-hidden="true"
      style={{ font: "600 22px var(--display)", color: "#d7c49c", textShadow: "0 2px 4px #000", ...style }}
    >
      {children}
    </span>
  );
}
