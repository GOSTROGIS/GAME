import React from "react";

export function AttributeRow({ abbr, name, description, children, style, ...rest }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "56px 150px 1fr auto",
        gap: 13,
        alignItems: "center",
        padding: "11px 0",
        borderBottom: "1px solid var(--line-soft)",
        ...style
      }}
      {...rest}
    >
      <b style={{ color: "var(--gold)", font: "500 11px var(--display)" }}>{abbr}</b>
      <strong style={{ font: "500 13px var(--display)", color: "var(--bone)" }}>{name}</strong>
      <span style={{ color: "#8f9692", font: "13px var(--serif)" }}>{description}</span>
      {children}
    </div>
  );
}
