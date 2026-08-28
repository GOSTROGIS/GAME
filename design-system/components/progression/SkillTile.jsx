import React from "react";

import { Icon } from "../icons/Icon.jsx";

export function SkillTile({ name, level, icon, xpPct = 0, onClick, style, ...rest }) {
  const [hot, setHot] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      style={{
        width: "100%",
        padding: 12,
        textAlign: "left",
        background: "rgba(0,0,0,.25)",
        border: "1px solid " + (hot ? "var(--gold)" : "var(--line)"),
        cursor: "pointer",
        transition: "var(--ease-ui)",
        ...style
      }}
      {...rest}
    >
      <span
        style={{
          float: "left",
          display: "grid",
          placeItems: "center",
          width: 34,
          height: 34,
          marginRight: 10,
          borderRadius: "var(--radius-round)",
          background: "#20282a"
        }}
      >
        <Icon name={icon} size={18} />
      </span>
      <strong style={{ display: "block", font: "500 11px var(--display)", color: "var(--bone)" }}>{name}</strong>
      <b style={{ color: "var(--gold-bright)", font: "18px var(--display)" }}>{level}</b>
      <small style={{ display: "block", color: "#7f8581", fontSize: 8 }}>of 99</small>
      <span style={{ display: "block", height: 2, marginTop: 8, background: "#252b2c" }}>
        <i style={{ display: "block", height: "100%", width: Math.max(0, Math.min(100, xpPct)) + "%", background: "var(--gold)" }} />
      </span>
    </button>
  );
}
