import React from "react";
import { IntentTelegraph } from "./IntentTelegraph.jsx";

export function IntentQueue({ intents = [], selectedId, onInspect, heading = "Enemy intents", style, ...rest }) {
  const headingId = React.useId();
  return (
    <section aria-labelledby={headingId} style={{ padding: 12, background: "var(--glass-bg)", border: "1px solid var(--line)", boxShadow: "var(--shadow-panel)", backdropFilter: "blur(var(--blur-glass))", ...style }} {...rest}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 9 }}><h3 id={headingId} style={{ margin: 0, font: "500 11px var(--display)", textTransform: "uppercase" }}>{heading}</h3><span style={{ color: "var(--gold)", font: "var(--type-meta-sm)", textTransform: "uppercase" }}>{intents.length} declared</span></div>
      {intents.length ? <ol style={{ display: "grid", gap: 7, margin: 0, padding: 0, listStyle: "none" }}>{intents.map((intent) => <li key={intent.id}><IntentTelegraph {...intent} selected={intent.id === selectedId} onInspect={onInspect ? () => onInspect(intent.id) : undefined} /></li>)}</ol> : <p style={{ margin: 0, color: "var(--muted)", font: "var(--type-body-sm)" }}>No hostile intent is currently declared.</p>}
    </section>
  );
}
