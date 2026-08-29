import React from "react";

export function Grain({ style, ...rest }) {
  return (
    <div
      {...rest}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: "var(--grain-inset)",
        zIndex: 3,
        pointerEvents: "none",
        opacity: "var(--grain-opacity)",
        backgroundImage: "var(--grain-url)",
        animation: "grain var(--grain-step) steps(2) infinite",
        ...style
      }}
    />
  );
}
