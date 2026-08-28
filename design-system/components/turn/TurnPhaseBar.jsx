import React from "react";

const DEFAULT_PHASES = ["forming", "planning", "locked", "resolving", "settling"];
const TERMINAL_PHASES = new Set(["victory", "defeat", "aborted"]);

export function TurnPhaseBar({ phase = "forming", round = 1, phases, detail, viewerMode = "participant", reconnectSeconds, style, ...rest }) {
  const requestedPhases = phases || (TERMINAL_PHASES.has(phase) ? [...DEFAULT_PHASES, phase] : DEFAULT_PHASES);
  const visiblePhases = requestedPhases.includes(phase) ? requestedPhases : [...requestedPhases, phase];
  const active = visiblePhases.indexOf(phase);
  const viewerLabel = viewerMode === "spectator" ? "Spectating" : viewerMode === "reconnecting" ? "Reconnecting" + (reconnectSeconds != null ? ` · ${reconnectSeconds}s` : "") : null;
  return (
    <section aria-label={"Encounter phase, round " + round + (viewerLabel ? ", " + viewerLabel : "")} style={{ padding: "9px 12px", background: "var(--glass-bg)", border: "1px solid var(--line)", boxShadow: "var(--shadow-panel)", backdropFilter: "blur(var(--blur-glass))", ...style }} {...rest}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 7 }}>
        <strong style={{ color: "var(--gold-bright)", font: "500 10px var(--display)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Round {round}</strong>
        <span role="status" style={{ color: "var(--bone)", font: "var(--type-meta)", textTransform: "uppercase" }}>{viewerLabel ? <>{viewerLabel} · </> : null}{phase}{detail ? <> · {detail}</> : null}</span>
      </div>
      <ol style={{ display: "grid", gridTemplateColumns: "repeat(" + visiblePhases.length + ", minmax(0,1fr))", gap: 4, margin: 0, padding: 0, listStyle: "none" }}>
        {visiblePhases.map((item, index) => {
          const state = index < active ? "complete" : index === active ? "current" : "upcoming";
          return (
            <li key={item} aria-label={item + ", " + state} aria-current={state === "current" ? "step" : undefined} style={{ padding: "5px 4px", color: state === "current" ? "var(--gold-bright)" : state === "complete" ? "#9eb5a3" : "var(--muted)", background: state === "current" ? "rgba(185,149,82,.12)" : "rgba(0,0,0,.2)", border: "1px solid " + (state === "current" ? "var(--gold)" : "var(--line)"), textAlign: "center", font: "var(--type-nano)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
              <span aria-hidden="true">{state === "complete" ? "✓ " : state === "current" ? "◆ " : "◇ "}</span>{item}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
