import React from "react";

export function QuestTracker({ chapter, title, summary, objectives = [], progress, style, ...rest }) {
  return (
    <aside
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
      <h3 style={{ margin: "4px 0", font: "500 11px var(--display)", color: "var(--bone)" }}>{title}</h3>
      {progress != null ? <progress value={progress} max={1} style={{ width: "100%", height: 3, accentColor: "var(--gold)" }} /> : null}
      {summary ? <p style={{ margin: "10px 0 0", color: "#a2a7a1", font: "13px/1.4 var(--serif)" }}>{summary}</p> : null}
      {objectives.map((o, i) => (
        <div
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
          {o.label}
        </div>
      ))}
    </aside>
  );
}
