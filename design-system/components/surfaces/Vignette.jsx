import React from "react";

export function Vignette({ style, ...rest }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 2,
        pointerEvents: "none",
        boxShadow: "var(--vignette)",
        ...style
      }}
      {...rest}
    />
  );
}
