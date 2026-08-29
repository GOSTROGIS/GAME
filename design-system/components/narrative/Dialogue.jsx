import React from "react";
import { SpeakerMark } from "./SpeakerMark.jsx";

export function Dialogue({ faction, speaker, initial, line, choices = [], onChoose, style, ...rest }) {
  const headingId = React.useId();
  const firstChoiceRef = React.useRef(null);
  const firstChoiceId = choices.length ? (typeof choices[0] === "string" ? "0" : choices[0].id) : null;
  React.useEffect(() => {
    if (firstChoiceId != null) firstChoiceRef.current?.focus();
  }, [firstChoiceId]);
  return (
    <section
      aria-labelledby={headingId}
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
        <h3 id={headingId} style={{ margin: "4px 0 10px", font: "500 20px var(--display)", color: "var(--bone)" }}>{speaker}</h3>
        <p style={{ margin: 0, color: "#bec0b8", font: "var(--type-dialogue)" }}>{line}</p>
        {choices.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            {choices.map((c, i) => (
              <DialogueChoice ref={i === 0 ? firstChoiceRef : undefined} key={i} onClick={() => onChoose && onChoose(c.id ?? i)}>{c.label ?? c}</DialogueChoice>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

const DialogueChoice = React.forwardRef(function DialogueChoice({ children, onClick }, ref) {
  const [hot, setHot] = React.useState(false);
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      style={{
        minHeight: 44,
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
});
