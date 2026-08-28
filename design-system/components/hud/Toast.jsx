import React from "react";

export function Toast({ children, style, ...rest }) {
  return (
    <div
      role="status"
      style={{
        padding: "11px 14px",
        textAlign: "center",
        background: "rgba(7,10,11,.88)",
        border: "1px solid var(--line)",
        font: "13px var(--serif)",
        color: "var(--bone)",
        animation: "toastIn .3s ease, toastOut .4s 2.7s forwards",
        ...style
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
