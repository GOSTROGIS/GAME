import React from "react";

export function StepDots({ count = 6, active = 0, style, ...rest }) {
  const current = Math.min(Math.max(active, 0), Math.max(count - 1, 0));
  return (
    <ol
      aria-label="Creator stages"
      style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, padding: 0, listStyle: "none", ...style }}
      {...rest}
    >
      {Array.from({ length: count }, (_, i) => (
        <li
          key={i}
          aria-current={i === current ? "step" : undefined}
          aria-label={`Step ${i + 1} of ${count}${i === current ? ", current" : ""}`}
          style={{ width: 44, height: 3 }}
        >
          <i
            aria-hidden="true"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              background: i === current ? "var(--gold)" : "var(--step-dot)",
              boxShadow: i === current ? "var(--shadow-dot-active)" : "none",
              transition: "0.25s"
            }}
          />
        </li>
      ))}
    </ol>
  );
}
