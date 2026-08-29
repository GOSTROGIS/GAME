import React from "react";

export function GlassPanel({ as: Element = "div", children, style, ...rest }) {
  return (
    <Element
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
    </Element>
  );
}
