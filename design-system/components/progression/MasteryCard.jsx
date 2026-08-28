import React from "react";

export function MasteryCard({ label, name, description, children, style, ...rest }) {
  return (
    <article
      style={{ padding: 15, border: "1px solid var(--mastery-edge)", background: "var(--mastery-bg)", ...style }}
      {...rest}
    >
      <span style={{ color: "var(--gold)", font: "var(--type-micro)", letterSpacing: "var(--track-nano)", textTransform: "uppercase" }}>{label}</span>
      <h3 style={{ margin: "7px 0 5px", font: "var(--type-h3-node)", color: "var(--bone)" }}>{name}</h3>
      <p style={{ margin: "0 0 11px", color: "#989e98", font: "13px/1.35 var(--serif)" }}>{description}</p>
      {children}
    </article>
  );
}
