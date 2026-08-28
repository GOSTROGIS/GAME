import React from "react";

export function CodexBack({ label = "Back", onClick, style, ...rest }) {
  const [hot, setHot] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      style={{
        marginBottom: 14,
        padding: "7px 10px",
        color: hot ? "var(--gold-bright)" : "#a9ada7",
        background: "transparent",
        border: "1px solid " + (hot ? "var(--gold)" : "var(--line)"),
        cursor: "pointer",
        font: "var(--type-kbd)",
        fontFamily: "var(--display)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        transition: "var(--ease-ui)",
        ...style
      }}
      {...rest}
    >
      &#8592; {label}
    </button>
  );
}
