import React from "react";
import { Kbd } from "../labels/Kbd.jsx";

export function InteractionPrompt({ keyLabel = "E", children, style, ...rest }) {
  return (
    <div
      {...rest}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        padding: "9px 14px",
        background: "rgba(5,8,9,.9)",
        border: "1px solid var(--line)",
        font: "12px var(--serif)",
        color: "var(--bone)",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        ...style
      }}
    >
      <Kbd style={{ minWidth: 0, padding: "2px 6px" }}>{keyLabel}</Kbd>
      {children}
    </div>
  );
}
