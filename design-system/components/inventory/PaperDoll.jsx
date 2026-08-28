import React from "react";

export function PaperDoll({ image, alt, style, ...rest }) {
  return (
    <div
      style={{
        minHeight: 390,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        background: "var(--paper-doll-bg)",
        border: "1px solid var(--line)",
        ...style
      }}
      {...rest}
    >
      <img
        src={image}
        alt={alt || ""}
        style={{
          width: "100%",
          height: 390,
          objectFit: "contain",
          objectPosition: "center bottom",
          filter: "var(--grade-character)"
        }}
      />
    </div>
  );
}
