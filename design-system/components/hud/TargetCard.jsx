import React from "react";
import { Meter } from "../meters/Meter.jsx";

export function TargetCard({ role, name, health = { value: 1, max: 1 }, style, ...rest }) {
  return (
    <div
      style={{
        width: "var(--hud-col-target)",
        padding: "12px 16px",
        textAlign: "center",
        background: "var(--glass-bg)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-panel)",
        backdropFilter: "blur(var(--blur-glass))",
        ...style
      }}
      {...rest}
    >
      <span style={{ display: "block", color: "var(--target-label)", font: "var(--type-micro)", letterSpacing: "var(--track-micro)" }}>{role}</span>
      <strong style={{ font: "500 12px var(--display)", color: "var(--bone)" }}>{name}</strong>
      <Meter kind="enemy" value={health.value} max={health.max} />
    </div>
  );
}
