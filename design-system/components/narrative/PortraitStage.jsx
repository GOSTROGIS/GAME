import React from "react";

export function PortraitStage({ image, alt, children, style, ...rest }) {
  return (
    <div
      style={{
        position: "relative",
        minHeight: 0,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        borderRight: "1px solid var(--line)",
        background: "var(--portrait-stage)",
        ...style
      }}
      {...rest}
    >
      {image ? (
        <img
          src={image}
          alt={alt || ""}
          style={{
            position: "absolute",
            inset: "12px 0 48px",
            width: "100%",
            height: "calc(100% - 60px)",
            objectFit: "contain",
            objectPosition: "center bottom",
            filter: "var(--grade-character)"
          }}
        />
      ) : null}
      {children}
    </div>
  );
}
