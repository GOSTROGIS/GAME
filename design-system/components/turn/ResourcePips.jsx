import React from "react";

export function ResourcePips({ label, value = 0, max = 2, reserved = 0, unit, style, ...rest }) {
  const safeMax = Math.max(0, Math.min(12, Math.floor(Number(max) || 0)));
  const safeValue = Math.max(0, Math.min(safeMax, Math.floor(Number(value) || 0)));
  const safeReserved = Math.max(0, Math.min(safeValue, Math.floor(Number(reserved) || 0)));
  const summary = label + ": " + safeValue + " of " + safeMax + (unit ? " " + unit : "") + (safeReserved ? ", " + safeReserved + " reserved" : "");
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuenow={safeValue}
      aria-valuemax={safeMax}
      aria-valuetext={summary}
      style={{ display: "grid", gap: 5, ...style }}
      {...rest}
    >
      <span aria-hidden="true" style={{ color: "var(--gold)", font: "var(--type-micro)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label} · {safeValue}/{safeMax}{safeReserved ? " · " + safeReserved + " reserved" : ""}</span>
      <span aria-hidden="true" style={{ display: "flex", gap: 5 }}>
        {Array.from({ length: safeMax }, (_, index) => { const filled = index < safeValue; const isReserved = index >= safeValue - safeReserved && filled; return <i key={index} style={{ width: 18, height: 8, background: isReserved ? "repeating-linear-gradient(135deg,var(--gold) 0 2px,transparent 2px 4px)" : filled ? "var(--gold)" : "transparent", border: "1px solid " + (filled ? "var(--gold)" : "var(--line)"), boxShadow: isReserved ? "inset 0 0 0 1px var(--ink)" : "none" }} />; })}
      </span>
    </div>
  );
}
