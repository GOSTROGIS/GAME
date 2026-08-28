import React from "react";

export function RelationshipRow({ from, kind, to, description, children, style, ...rest }) {
  return (
    <article
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        gap: 8,
        alignItems: "center",
        padding: "9px 11px",
        border: "1px solid rgba(216,208,189,.11)",
        background: "rgba(0,0,0,.18)",
        ...style
      }}
      {...rest}
    >
      <b style={{ font: "9px var(--display)", color: "var(--bone)" }}>{from}</b>
      <span style={{ color: "var(--gold)", fontSize: 8, textTransform: "uppercase" }}>{kind}</span>
      <b style={{ font: "9px var(--display)", color: "var(--bone)", textAlign: "right" }}>{to}</b>
      {description ? <p style={{ gridColumn: "1/-1", margin: 0, color: "#858c86", font: "11px var(--serif)" }}>{description}</p> : null}
      {children}
    </article>
  );
}
