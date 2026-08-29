import React from "react";

export function AttributeRow({ abbr, name, description, children, style, ...rest }) {
  const nameId = React.useId();
  const descriptionId = React.useId();
  return (
    <div
      role="group"
      aria-labelledby={`${nameId} ${descriptionId}`}
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
      <b aria-hidden="true" style={{ color: "var(--gold)", font: "500 11px var(--display)" }}>{abbr}</b>
      <strong id={nameId} style={{ font: "500 13px var(--display)", color: "var(--bone)" }}>{name}</strong>
      <span id={descriptionId} style={{ color: "#8f9692", font: "13px var(--serif)" }}>{description}</span>
      {children}
    </div>
  );
}
