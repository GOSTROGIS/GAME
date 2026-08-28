import React from "react";

export function LocationCard({ region, name, note, style, ...rest }) {
  return (
    <div style={{ padding: "8px 0", textAlign: "right", textShadow: "0 2px 10px #000", ...style }} {...rest}>
      <span style={{ display: "block", color: "var(--gold)", font: "var(--type-micro)", letterSpacing: "var(--track-eyebrow)" }}>{region}</span>
      <strong style={{ display: "block", margin: "3px 0", font: "var(--type-h3-location)", color: "var(--bone)" }}>{name}</strong>
      <em style={{ color: "#929b96", font: "italic 12px var(--serif)" }}>{note}</em>
    </div>
  );
}
