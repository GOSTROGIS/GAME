import React from "react";

export function EnemyCodexCard({ rank, region, name, description, facts = [], children, style, ...rest }) {
  return (
    <article
      style={{ padding: 13, background: "var(--codex-bg)", border: "1px solid var(--line)", ...style }}
      {...rest}
    >
      <header style={{ display: "flex", justifyContent: "space-between", gap: 10, color: "var(--gold)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        <span>{rank}</span>
        <span>{region}</span>
      </header>
      <h3 style={{ margin: "7px 0 5px", font: "var(--type-h3-card)", color: "var(--bone)" }}>{name}</h3>
      <p style={{ margin: "0 0 9px", color: "#9fa59f", font: "13px/1.4 var(--serif)" }}>{description}</p>
      {children}
      {facts.length ? (
        <dl style={{ display: "grid", gridTemplateColumns: "55px 1fr", gap: 4, margin: 0, paddingTop: 8, borderTop: "1px solid var(--line-soft)", fontSize: 10 }}>
          {facts.map((ft, i) => [
            <dt key={"t" + i} style={{ color: "#797f7a", textTransform: "uppercase" }}>{ft.term}</dt>,
            <dd key={"d" + i} style={{ margin: 0, color: "#b7b8b0" }}>{ft.value}</dd>
          ])}
        </dl>
      ) : null}
    </article>
  );
}
