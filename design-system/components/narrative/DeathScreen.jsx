import React from "react";

export function DeathScreen({ eyebrow = "The march continues", title = "You are unmade", note, children, style, ...rest }) {
  const headingId = React.useId();
  return (
    <section
      {...rest}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
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
    >
      <p style={{ margin: "0 0 8px", color: "var(--gold)", font: "var(--type-eyebrow)", letterSpacing: "var(--track-eyebrow)", textTransform: "uppercase" }}>{eyebrow}</p>
      <h2 id={headingId} style={{ margin: 0, color: "var(--death)", font: "var(--type-death)" }}>{title}</h2>
      {note ? <p style={{ margin: "12px 0 28px", color: "#9e9690", font: "italic 18px var(--serif)" }}>{note}</p> : null}
      {children}
    </section>
  );
}
