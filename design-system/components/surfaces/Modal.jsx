import React from "react";

export function Modal({ children, label, labelledBy, modal = true, style, ...rest }) {
  return (
    <section
      {...rest}
      role="dialog"
      aria-modal={modal ? "true" : undefined}
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      style={{
        position: "absolute",
        zIndex: 30,
        inset: "var(--modal-inset)",
        maxWidth: "var(--modal-max-w)",
        margin: "auto",
        background: "var(--modal-bg)",
        border: "1px solid rgba(216,208,189,.22)",
        boxShadow: "var(--shadow-modal)",
        ...style
      }}
    >
      {children}
    </section>
  );
}
