import React from "react";

import { Icon } from "../icons/Icon.jsx";

export function TechniqueSummary({ icon, level, tier, description, style, ...rest }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "54px 100px 1fr",
        gap: 12,
        alignItems: "center",
        marginBottom: 16,
        padding: 14,
        border: "1px solid var(--line)",
        background: "rgba(0,0,0,.24)",
        ...style
      }}
      {...rest}
    >
      <span style={{ display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: "var(--radius-round)", background: "#20282a" }}>
        <Icon name={icon} size={25} />
      </span>
      <span>
        <b style={{ display: "block", color: "var(--gold-bright)", font: "26px var(--display)" }}>{level}</b>
        <small style={{ color: "#898f8b", fontSize: 9, textTransform: "uppercase" }}>{tier}</small>
      </span>
      <p style={{ margin: 0, color: "#a7aca6", font: "14px/1.4 var(--serif)" }}>{description}</p>
    </div>
  );
}
