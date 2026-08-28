import React from "react";

export function FieldLabel({ children, htmlFor, style, ...rest }) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: "block",
        margin: "28px 0 10px",
        color: "var(--gold)",
        font: "var(--type-field-label)",
        textTransform: "uppercase",
        letterSpacing: "var(--track-label)",
        ...style
      }}
      {...rest}
    >
      {children}
    </label>
  );
}
