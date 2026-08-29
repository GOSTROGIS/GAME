import React from "react";

const STATE_LABELS = { learned: "Learned", available: "Available", locked: "Locked" };

export function TechniqueNode({ tier, name, description, state = "available", cost, onPurchase, style, ...rest }) {
  const [hot, setHot] = React.useState(false);
  const learned = state === "learned";
  const locked = state === "locked";
  return (
    <article
      style={{
        minHeight: "var(--node-min-h)",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        background: learned ? "var(--learned-bg)" : "#0b1012",
        border: "1px solid " + (learned ? "var(--node-edge-learned)" : "var(--line)"),
        borderTop: "2px solid " + (learned ? "var(--node-edge-learned)" : "var(--node-edge)"),
        opacity: locked ? 0.55 : 1,
        ...style
      }}
      {...rest}
    >
      <span style={{ color: "var(--gold)", font: "var(--type-micro)", letterSpacing: "var(--track-nano)", textTransform: "uppercase" }}>{tier}{tier ? " · " : ""}{STATE_LABELS[state] || state}</span>
      <h3 style={{ margin: "7px 0 5px", font: "var(--type-h3-node)", color: "var(--bone)" }}>{name}</h3>
      <p style={{ margin: "0 0 11px", color: "#989e98", font: "13px/1.35 var(--serif)" }}>{description}</p>
      <button
        type="button"
        disabled={learned || locked}
        onClick={onPurchase}
        onMouseEnter={() => setHot(true)}
        onMouseLeave={() => setHot(false)}
        style={{
          marginTop: "auto",
          minHeight: 44,
          color: learned || locked ? "#777" : hot ? "var(--gold-bright)" : "#c2bba9",
          background: "#111719",
          border: "1px solid " + (!learned && !locked && hot ? "var(--gold)" : "var(--line)"),
          font: "var(--type-nano)",
          fontFamily: "var(--display)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: learned || locked ? "default" : "pointer"
        }}
      >
        {learned ? "Learned" : locked ? "Locked" : cost != null ? "Purchase · " + cost : "Purchase"}
      </button>
    </article>
  );
}
