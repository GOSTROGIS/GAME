import React from "react";

import { Icon } from "../icons/Icon.jsx";

export function ActionBar({ slots = [], onUse, style, ...rest }) {
  return (
    <div
      style={{
        display: "flex",
        padding: 5,
        background: "var(--glass-bg)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-panel)",
        backdropFilter: "blur(var(--blur-glass))",
        ...style
      }}
      {...rest}
    >
      {slots.map((s, i) => (
        <button
          key={s.id || i}
          type="button"
          onClick={() => onUse && onUse(s.id)}
          style={{
            position: "relative",
            width: "var(--action-slot-w)",
            height: "var(--action-slot-h)",
            padding: 4,
            border: 0,
            borderRight: "1px solid var(--line)",
            background: "transparent",
            color: "var(--bone)",
            cursor: "pointer"
          }}
        >
          {s.key ? <kbd style={{ position: "absolute", left: 6, top: 5, color: "#7e8580", fontSize: 8, background: "none", border: 0, boxShadow: "none" }}>{s.key}</kbd> : null}
          {s.count != null ? <b style={{ position: "absolute", right: 5, top: 4, color: "var(--gold)", fontSize: 9 }}>{s.count}</b> : null}
          <span style={{ display: "grid", placeItems: "center", height: 24 }}><Icon name={s.icon} size={22} /></span>
          <small style={{ display: "block", color: "#878e89", fontSize: 7, textTransform: "uppercase" }}>{s.label}</small>
        </button>
      ))}
    </div>
  );
}
