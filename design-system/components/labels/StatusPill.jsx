import React from "react";

export function StatusPill({ children, tone = "default", style, ...rest }) {
  const tones = {
    default: { color: "#d3bc7c", background: "rgba(185,149,82,.12)", borderColor: "rgba(185,149,82,.3)" },
    prototype: { color: "#d4855f", background: "rgba(189,97,53,.14)", borderColor: "rgba(189,97,53,.4)" },
    valid: { color: "#8aa596", background: "rgba(82,102,92,.16)", borderColor: "rgba(82,102,92,.45)" }
  };
  return (
    <i
      style={{
        padding: "3px 5px",
        border: "1px solid",
        font: "var(--type-nano)",
        fontStyle: "normal",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        ...tones[tone],
        ...style
      }}
      {...rest}
    >
      {children}
    </i>
  );
}
