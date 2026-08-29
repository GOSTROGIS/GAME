import React from "react";

export function QuestTracker({ chapter, title, summary, objectives = [], progress, style, ...rest }) {
  const headingId = React.useId();
  return (
    <aside
      aria-labelledby={title ? headingId : undefined}
      aria-label={title ? undefined : "Quest tracker"}
      style={{
        width: "var(--tracker-w)",
        padding: "16px 18px",
        background: "var(--glass-bg)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-panel)",
        backdropFilter: "blur(var(--blur-glass))",
        ...style
      }}
      {...rest}
    >
      <span style={{ color: "var(--gold)", font: "var(--type-micro)", letterSpacing: "0.18em", textTransform: "uppercase" }}>{chapter}</span>
      <h3 id={headingId} style={{ margin: "4px 0", font: "500 11px var(--display)", color: "var(--bone)" }}>{title}</h3>
      {progress != null ? <progress aria-label="Quest progress" value={progress} max={1} style={{ width: "100%", height: 3, accentColor: "var(--gold)" }} /> : null}
      {summary ? <p style={{ margin: "10px 0 0", color: "#a2a7a1", font: "13px/1.4 var(--serif)" }}>{summary}</p> : null}
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {objectives.map((o, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              gap: 8,
              marginTop: 10,
              fontSize: 11,
              color: o.done ? "#6f8377" : "#aeb0a9",
              textDecoration: o.done ? "line-through" : "none"
            }}
          >
            <span aria-hidden="true">&#9671;</span>
            <span><span style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>{o.done ? "Complete: " : "Incomplete: "}</span>{o.label}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
