import React from "react";
import { Meter } from "../meters/Meter.jsx";

export function PlayerCard({
  name,
  level,
  rune,
  portrait,
  health = { value: 1, max: 1 },
  stamina = { value: 1, max: 1 },
  focus = { value: 1, max: 1 },
  style,
  ...rest
}) {
  return (
    <div
      style={{
        height: "var(--player-card-h)",
        display: "grid",
        gridTemplateColumns: "58px 1fr",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px 10px 10px",
        background: "var(--glass-bg)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-panel)",
        backdropFilter: "blur(var(--blur-glass))",
        ...style
      }}
      {...rest}
    >
      <div
        style={{
          display: "grid",
          placeItems: "center",
          width: "var(--player-rune)",
          height: "var(--player-rune)",
          border: "1px solid var(--rune-edge)",
          borderRadius: "var(--radius-round)",
          color: "var(--gold-bright)",
          backgroundColor: "#101416",
          backgroundImage: portrait ? "url(" + portrait + ")" : undefined,
          backgroundRepeat: "no-repeat",
          backgroundSize: "245%",
          backgroundPosition: "50% 6%",
          font: "500 21px var(--display)",
          boxShadow: "var(--shadow-rune)"
        }}
      >
        {portrait ? null : rune}
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
          <strong style={{ font: "500 11px var(--display)", textTransform: "uppercase", letterSpacing: "var(--track-name)", color: "var(--bone)" }}>
            {name}
          </strong>
          <span style={{ color: "#929991", fontSize: 9 }}>{level != null ? "Lv " + level : null}</span>
        </div>
        <Meter kind="health" value={health.value} max={health.max} />
        <Meter kind="stamina" value={stamina.value} max={stamina.max} />
        <Meter kind="focus" value={focus.value} max={focus.max} />
      </div>
    </div>
  );
}
