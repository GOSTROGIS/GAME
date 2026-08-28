import React from "react";

export function DeathScreen({ eyebrow = "The march continues", title = "You are unmade", note, children, style, ...rest }) {
  return (
    <div
      style={{
        position: "absolute",
        zIndex: 40,
        inset: 0,
        display: "grid",
        placeContent: "center",
        justifyItems: "center",
        background: "var(--death-bg)",
        animation: "deathIn 1.4s ease both",
        ...style
      }}
      {...rest}
    >
      <p style={{ margin: "0 0 8px", color: "var(--gold)", font: "var(--type-eyebrow)", letterSpacing: "var(--track-eyebrow)", textTransform: "uppercase" }}>{eyebrow}</p>
      <h2 style={{ margin: 0, color: "var(--death)", font: "var(--type-death)" }}>{title}</h2>
      {note ? <p style={{ margin: "12px 0 28px", color: "#9e9690", font: "italic 18px var(--serif)" }}>{note}</p> : null}
      {children}
    </div>
  );
}
