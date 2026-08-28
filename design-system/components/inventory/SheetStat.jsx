import React from "react";

export function SheetStat({ label, value, style, ...rest }) {
  return (
    <div style={{ padding: 9, background: "rgba(0,0,0,.23)", border: "1px solid var(--line-soft)", ...style }} {...rest}>
      <b style={{ color: "var(--gold)", font: "10px var(--display)" }}>{label}</b>
      <strong style={{ float: "right", font: "16px var(--display)", color: "var(--bone)" }}>{value}</strong>
    </div>
  );
}
