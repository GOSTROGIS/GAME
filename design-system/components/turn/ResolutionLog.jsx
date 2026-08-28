import React from "react";

export function ResolutionLog({ events = [], heading = "Resolution log", liveSummary, onSelect, selectedCursor, style, ...rest }) {
  const headingId = React.useId();
  return (
    <section aria-labelledby={headingId} style={{ padding: 12, background: "var(--glass-bg)", border: "1px solid var(--line)", boxShadow: "var(--shadow-panel)", backdropFilter: "blur(var(--blur-glass))", ...style }} {...rest}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}><h3 id={headingId} style={{ margin: 0, font: "500 11px var(--display)", textTransform: "uppercase" }}>{heading}</h3><span style={{ color: "var(--gold)", font: "var(--type-meta-sm)" }}>{events.length ? "Cursor " + events[events.length - 1].cursor : "No events"}</span></div>
      <p role="status" aria-live="polite" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>{liveSummary}</p>
      {events.length ? <ol style={{ display: "grid", gap: 4, maxHeight: 190, margin: 0, padding: 0, overflow: "auto", listStyle: "none" }}>{events.map((event) => { const selected = event.cursor === selectedCursor; const content = <><span style={{ color: "var(--gold)", font: "var(--type-meta-sm)" }}>{event.cursor} · {event.band}</span><span style={{ color: "#b7b8b0", font: "var(--type-body-xs)" }}>{event.text}</span></>; return <li key={event.cursor}>{onSelect ? <button type="button" aria-pressed={selected} onClick={() => onSelect(event.cursor)} style={{ width: "100%", minHeight: 44, padding: "7px 9px", display: "grid", gridTemplateColumns: "105px 1fr", gap: 10, textAlign: "left", color: "var(--bone)", background: selected ? "var(--selected-bg)" : "rgba(0,0,0,.2)", border: "1px solid " + (selected ? "var(--gold)" : "var(--line-soft)") }}>{content}</button> : <div style={{ minHeight: 34, padding: "7px 9px", display: "grid", gridTemplateColumns: "105px 1fr", gap: 10, border: "1px solid var(--line-soft)" }}>{content}</div>}</li>; })}</ol> : <p style={{ margin: 0, color: "var(--muted)", font: "var(--type-body-sm)" }}>Resolution has not begun.</p>}
    </section>
  );
}
