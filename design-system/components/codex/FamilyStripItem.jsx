import React from "react";

export function FamilyStripItem({ name, count, description, style, ...rest }) {
  return (
    <article style={{ padding: 12, background: "rgba(0,0,0,.22)", border: "1px solid var(--line)", ...style }} {...rest}>
      <b style={{ display: "block", font: "500 11px var(--display)", color: "var(--bone)" }}>{name}</b>
      <span style={{ display: "block", margin: "4px 0", color: "var(--gold)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{count}</span>
      <small style={{ display: "block", color: "#878f89", font: "11px/1.3 var(--serif)" }}>{description}</small>
    </article>
  );
}
