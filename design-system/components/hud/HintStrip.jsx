import React from "react";
import { Kbd } from "../labels/Kbd.jsx";

export function HintStrip({ hints = [], style, ...rest }) {
  return (
    <div
      style={{ display: "flex", gap: 18, color: "#858b87", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.06em", ...style }}
      {...rest}
    >
      {hints.map((h, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Kbd style={{ minWidth: 0, padding: "2px 4px", fontSize: 7 }}>{h.key}</Kbd>
          {h.label}
        </span>
      ))}
    </div>
  );
}
