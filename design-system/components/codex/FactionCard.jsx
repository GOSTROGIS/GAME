import React from "react";

export function FactionCard({ label, name, description, note, style, ...rest }) {
  return (
    <article style={{ padding: 12, background: "rgba(0,0,0,.22)", border: "1px solid var(--line)", ...style }} {...rest}>
      <span style={{ display: "block", margin: "4px 0", color: "var(--gold)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      <h3 style={{ margin: "6px 0", font: "500 11px var(--display)", color: "var(--bone)" }}>{name}</h3>
      <p style={{ margin: "0 0 9px", color: "#9fa59f", font: "13px/1.4 var(--serif)" }}>{description}</p>
      {note ? <small style={{ color: "#b0a278", font: "11px var(--serif)" }}>{note}</small> : null}
    </article>
  );
}
