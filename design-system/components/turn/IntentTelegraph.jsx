import React from "react";

export function IntentTelegraph({ actor, action, target, band, damage, statusIcons = [], cue, interrupt, selected = false, onInspect, style, ...rest }) {
  const statusNames = statusIcons.map((status) => status.label);
  const summary = actor + " intends " + action + " against " + target + " in the " + band + " band. Damage: " + damage + "." + (statusNames.length ? " Statuses: " + statusNames.join(", ") + "." : " No status effect.") + " Cue: " + cue + ". Interrupt: " + interrupt + ".";
  const Element = onInspect ? "button" : "article";
  return (
    <Element
      {...(onInspect ? { type: "button", onClick: onInspect, "aria-pressed": selected } : {})}
      aria-label={summary}
      style={{ width: "100%", padding: 11, textAlign: "left", color: "var(--bone)", background: selected ? "var(--selected-bg)" : "rgba(0,0,0,.25)", border: "1px solid " + (selected ? "var(--gold)" : "var(--line)"), boxShadow: selected ? "var(--shadow-selected)" : "none", cursor: onInspect ? "pointer" : "default", ...style }}
      {...rest}
    >
      <header aria-hidden="true" style={{ display: "flex", justifyContent: "space-between", gap: 10, color: "var(--gold)", font: "var(--type-micro)", letterSpacing: "0.08em", textTransform: "uppercase" }}><span>{actor}</span><span>{band}</span></header>
      <strong aria-hidden="true" style={{ display: "block", margin: "6px 0 3px", font: "var(--type-h3-node)" }}>{action} → {target}</strong>
      <p aria-hidden="true" style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "0 0 7px", color: "#a7aca6", font: "var(--type-body-xs)" }}><span>{damage}</span>{statusIcons.map((status) => <span key={status.id}><span aria-hidden="true">{status.glyph} </span>{status.label}</span>)}</p>
      <dl aria-hidden="true" style={{ display: "grid", gridTemplateColumns: "58px 1fr", gap: 4, margin: 0, paddingTop: 7, borderTop: "1px solid var(--line-soft)", font: "var(--type-meta-sm)" }}><dt style={{ color: "var(--muted)", textTransform: "uppercase" }}>Cue</dt><dd style={{ margin: 0 }}>{cue}</dd><dt style={{ color: "var(--muted)", textTransform: "uppercase" }}>Interrupt</dt><dd style={{ margin: 0 }}>{interrupt}</dd></dl>
    </Element>
  );
}
