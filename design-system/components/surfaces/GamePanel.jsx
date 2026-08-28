import React from "react";

export function GamePanel({ title, onClose, children, style, ...rest }) {
  return (
    <section
      style={{
        overflow: "hidden",
        background: "var(--glass-bg)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-panel)",
        backdropFilter: "blur(var(--blur-glass))",
        ...style
      }}
      {...rest}
    >
      <header
        style={{
          height: "var(--panel-header-h)",
          padding: "15px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--line)"
        }}
      >
        <h2 style={{ margin: 0, font: "var(--type-h2-panel)", color: "var(--bone)" }}>{title}</h2>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 34,
              height: 34,
              border: "1px solid var(--line)",
              background: "transparent",
              color: "#999",
              fontSize: 24,
              lineHeight: 1,
              cursor: "pointer"
            }}
          >
            &times;
          </button>
        ) : null}
      </header>
      <div
        style={{
          height: "calc(100% - var(--panel-header-h))",
          padding: 20,
          overflow: "auto",
          scrollbarColor: "#594a31 transparent"
        }}
      >
        {children}
      </div>
    </section>
  );
}
