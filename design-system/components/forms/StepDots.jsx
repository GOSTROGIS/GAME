import React from "react";

export function StepDots({ count = 6, active = 0, style, ...rest }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, ...style }} {...rest}>
      {Array.from({ length: count }, (_, i) => (
        <i
          key={i}
          style={{
            width: 44,
            height: 3,
            background: i === active ? "var(--gold)" : "var(--step-dot)",
            boxShadow: i === active ? "var(--shadow-dot-active)" : "none",
            transition: "0.25s"
          }}
        />
      ))}
    </div>
  );
}
