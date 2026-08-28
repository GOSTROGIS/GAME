import React from "react";

export function Eyebrow({ children, style, ...rest }) {
  return (
    <p
      style={{
        margin: "0 0 8px",
        color: "var(--gold)",
        font: "var(--type-eyebrow)",
        letterSpacing: "var(--track-eyebrow)",
        textTransform: "uppercase",
        ...style
      }}
      {...rest}
    >
      {children}
    </p>
  );
}
