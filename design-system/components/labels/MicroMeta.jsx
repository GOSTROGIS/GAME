import React from "react";

export function MicroMeta({ children, align = "left", style, ...rest }) {
  return (
    <span
      style={{
        display: "block",
        color: "var(--gold)",
        font: "var(--type-micro)",
        letterSpacing: "var(--track-micro)",
        textTransform: "uppercase",
        textAlign: align,
        ...style
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
