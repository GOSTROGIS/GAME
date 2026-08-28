import React from "react";

export function WorldCard({ image, alt, label, name, description, onClick, style, ...rest }) {
  const [hot, setHot] = React.useState(false);
  return (
    <div
      role={onClick ? "button" : undefined}
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      style={{
        position: "relative",
        minHeight: "var(--world-card-h)",
        overflow: "hidden",
        border: "1px solid var(--line)",
        background: "var(--ink)",
        cursor: onClick ? "pointer" : "default",
        ...style
      }}
      {...rest}
    >
      <img
        src={image}
        alt={alt || ""}
        style={{
          display: "block",
          width: "100%",
          height: "var(--world-card-h)",
          objectFit: "cover",
          opacity: hot ? "var(--world-card-opacity-hover)" : "var(--world-card-opacity)",
          transform: hot ? "scale(1.015)" : "none",
          transition: "var(--ease-slow)"
        }}
      />
      <div style={{ position: "absolute", inset: "auto 0 0", padding: "38px 18px 16px", background: "var(--scrim-up)" }}>
        <span style={{ color: "var(--gold)", font: "var(--type-micro)", letterSpacing: "var(--track-micro)" }}>{label}</span>
        <h3 style={{ margin: "4px 0", font: "var(--type-h3-world)", color: "var(--bone)" }}>{name}</h3>
        <p style={{ margin: 0, color: "#a8ada7", font: "13px/1.35 var(--serif)" }}>{description}</p>
      </div>
    </div>
  );
}
