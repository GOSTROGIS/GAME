import React from "react";

export function JournalEntry({ title, summary, status, onClick, style, ...rest }) {
  const [hot, setHot] = React.useState(false);
  const Element = onClick ? "button" : "article";
  return (
    <Element
      {...(onClick ? { type: "button", onClick } : {})}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "12px 1fr auto",
        gap: 10,
        padding: "14px 6px",
        borderBottom: "1px solid var(--line)",
        cursor: onClick ? "pointer" : "default",
        background: hot && onClick ? "rgba(185,149,82,.07)" : "transparent",
        textAlign: "left",
        ...style
      }}
      {...rest}
    >
      <i style={{ width: 6, height: 6, marginTop: 7, transform: "rotate(45deg)", border: "1px solid var(--gold)" }} />
      <div>
        <strong style={{ display: "block", font: "500 12px var(--display)", color: "var(--bone)" }}>{title}</strong>
        <p style={{ margin: "5px 0", color: "#8f9691", font: "13px var(--serif)" }}>{summary}</p>
      </div>
      <span style={{ color: "var(--gold)", fontSize: 9, textTransform: "uppercase" }}>{status}</span>
    </Element>
  );
}
