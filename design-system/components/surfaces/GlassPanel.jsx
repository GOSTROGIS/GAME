import React from "react";

export function GlassPanel({ children, style, ...rest }) {
  return (
    <div
      style={{
        background: "var(--glass-bg)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-panel)",
        backdropFilter: "blur(var(--blur-glass))",
        ...style
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
