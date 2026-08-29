import React from "react";

export function SpeakerMark({ initial, size = "var(--speaker-mark)", decorative = true, label, style, ...rest }) {
  return (
    <div
      {...rest}
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : label}
      style={{
        display: "grid",
        placeItems: "center",
        alignSelf: "center",
        width: size,
        height: size,
        borderRadius: "var(--radius-round)",
        border: "1px solid var(--gold)",
        background: "radial-gradient(circle, #303a39, #111719)",
        color: "var(--gold-bright)",
        font: "32px var(--display)",
        ...style
      }}
    >
      {initial}
    </div>
  );
}
