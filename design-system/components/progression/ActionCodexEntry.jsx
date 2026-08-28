import React from "react";

export function ActionCodexEntry({ name, kind, detail, style, ...rest }) {
  return (
    <article
      style={{ padding: 10, border: "1px solid rgba(216,208,189,.12)", background: "rgba(0,0,0,.2)", ...style }}
      {...rest}
    >
      <b style={{ display: "block", font: "10px var(--display)", color: "var(--bone)" }}>{name}</b>
      <span style={{ display: "block", margin: "4px 0", color: "var(--gold)", fontSize: 8, textTransform: "uppercase" }}>{kind}</span>
      <small style={{ display: "block", color: "#7f8781", font: "11px var(--serif)" }}>{detail}</small>
    </article>
  );
}
