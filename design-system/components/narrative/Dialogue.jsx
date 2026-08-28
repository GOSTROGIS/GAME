import React from "react";
import { SpeakerMark } from "./SpeakerMark.jsx";

export function Dialogue({ faction, speaker, initial, line, choices = [], onChoose, style, ...rest }) {
  return (
    <div
      style={{
        width: "var(--dialogue-w)",
        minHeight: "var(--dialogue-min-h)",
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        gap: 25,
        padding: "24px 30px",
        background: "var(--dialogue-bg)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-dialogue)",
        ...style
      }}
      {...rest}
    >
      <SpeakerMark initial={initial} />
      <div>
        <span style={{ color: "var(--gold)", font: "9px var(--display)", letterSpacing: "var(--track-micro)" }}>{faction}</span>
        <h3 style={{ margin: "4px 0 10px", font: "500 20px var(--display)", color: "var(--bone)" }}>{speaker}</h3>
        <p style={{ margin: 0, color: "#bec0b8", font: "var(--type-dialogue)" }}>{line}</p>
        {choices.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            {choices.map((c, i) => (
              <DialogueChoice key={i} onClick={() => onChoose && onChoose(c.id ?? i)}>{c.label ?? c}</DialogueChoice>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DialogueChoice({ children, onClick }) {
  const [hot, setHot] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      style={{
        padding: "8px 12px",
        background: "#121719",
        border: "1px solid " + (hot ? "var(--gold)" : "var(--line)"),
        color: hot ? "var(--gold-bright)" : "var(--bone)",
        font: "12px var(--serif)",
        cursor: "pointer",
        transition: "var(--ease-ui)"
      }}
    >
      {children}
    </button>
  );
}
