import React from "react";

export function OptionCard({ title, description, note, selected = false, onClick, style, ...rest }) {
  const [hot, setHot] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      aria-pressed={selected}
      style={{
        position: "relative",
        minHeight: "var(--option-card-min-h)",
        padding: 15,
        textAlign: "left",
        cursor: "pointer",
        transition: "var(--ease-ui)",
        background: selected ? "var(--selected-bg)" : hot ? "var(--option-bg-hover)" : "var(--option-bg)",
        border: "1px solid " + (selected ? "var(--gold)" : hot ? "rgba(185,149,82,.5)" : "var(--line)"),
        boxShadow: selected ? "var(--shadow-selected)" : "none",
        ...style
      }}
      {...rest}
    >
      <strong style={{ display: "block", marginBottom: 6, font: "var(--type-h3-card)", letterSpacing: "var(--track-card)", color: "var(--bone)" }}>{title}</strong>
      <span style={{ display: "block", color: "#949a96", font: "var(--type-body)" }}>{description}</span>
      {note ? <em style={{ display: "block", marginTop: 8, color: "var(--gold)", font: "10px var(--sans)", fontStyle: "normal", letterSpacing: "0.05em" }}>{note}</em> : null}
    </button>
  );
}
