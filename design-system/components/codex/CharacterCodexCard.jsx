import React from "react";

export function CharacterCodexCard({ role, faction, name, voice, description, children, style, ...rest }) {
  return (
    <article
      style={{ padding: 13, background: "var(--codex-bg)", border: "1px solid var(--line)", ...style }}
      {...rest}
    >
      <header style={{ display: "flex", justifyContent: "space-between", gap: 10, color: "var(--gold)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        <span>{role}</span>
        <span>{faction}</span>
      </header>
      <h3 style={{ margin: "7px 0 5px", font: "var(--type-h3-card)", color: "var(--bone)" }}>{name}</h3>
      {voice ? <em style={{ display: "block", marginBottom: 7, color: "#a7a096", font: "italic 12px var(--serif)" }}>{voice}</em> : null}
      <p style={{ margin: "0 0 9px", color: "#9fa59f", font: "13px/1.4 var(--serif)" }}>{description}</p>
      {children}
    </article>
  );
}
