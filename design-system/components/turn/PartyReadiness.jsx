import React from "react";

export function PartyReadiness({ members = [], heading = "Encounter party", viewerMode = "participant", reconnectSeconds, style, ...rest }) {
  const headingId = React.useId();
  const participants = members.filter((member) => !member.spectator);
  const readyCount = participants.filter((member) => member.ready).length;
  const viewerState = viewerMode === "spectator" ? "Spectator · Read-only encounter view" : viewerMode === "reconnecting" ? "Reconnecting to encounter" + (reconnectSeconds != null ? ` · ${reconnectSeconds}s remaining` : "") : null;
  return (
    <section aria-labelledby={headingId} style={{ padding: 12, background: "rgba(0,0,0,.24)", border: "1px solid var(--line)", ...style }} {...rest}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}><h3 id={headingId} style={{ margin: 0, font: "500 10px var(--display)", textTransform: "uppercase" }}>{heading}</h3><span role="status" style={{ color: "var(--gold)", font: "var(--type-meta-sm)", textTransform: "uppercase" }}>{readyCount}/{participants.length} ready</span></div>
      {viewerState ? <p role="status" style={{ margin: "0 0 8px", color: viewerMode === "reconnecting" ? "var(--gold-bright)" : "var(--muted)", font: "var(--type-meta-sm)" }}><span aria-hidden="true">{viewerMode === "reconnecting" ? "↻ " : "◉ "}</span>{viewerState}</p> : null}
      <ul style={{ display: "grid", gap: 5, margin: 0, padding: 0, listStyle: "none" }}>{members.map((member) => { const connectionState = member.connectionState || (member.connected === false ? "disconnected" : "connected"); const state = member.spectator ? "Spectator" : connectionState === "reconnecting" ? "Reconnecting" : connectionState === "disconnected" ? "Disconnected" : member.ready ? "Ready" : "Planning"; const unavailable = connectionState !== "connected"; return <li key={member.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, padding: "6px 7px", border: "1px solid var(--line-soft)", font: "var(--type-meta)" }}><span>{member.name}{member.leader ? " · Leader" : ""}</span><span style={{ color: unavailable ? "var(--death)" : member.ready ? "#9eb5a3" : "var(--gold)" }}><span aria-hidden="true">{connectionState === "reconnecting" ? "↻ " : unavailable ? "! " : member.spectator ? "◉ " : member.ready ? "✓ " : "◇ "}</span>{state}{member.graceSeconds != null && unavailable ? " · " + member.graceSeconds + "s" : ""}</span></li>; })}</ul>
    </section>
  );
}
