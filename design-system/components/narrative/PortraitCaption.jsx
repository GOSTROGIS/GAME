import React from "react";

export function PortraitCaption({ name, note, style, ...rest }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 28,
        right: 28,
        bottom: 20,
        paddingTop: 14,
        borderTop: "1px solid var(--line)",
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 10,
        ...style
      }}
      {...rest}
    >
      <strong style={{ font: "var(--type-h3-location)", color: "var(--bone)" }}>{name}</strong>
      <span style={{ color: "var(--muted)", font: "var(--type-caption)" }}>{note}</span>
    </div>
  );
}
