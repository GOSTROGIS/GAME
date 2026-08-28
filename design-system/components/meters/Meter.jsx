import React from "react";

const fills = {
  health: "var(--meter-health)",
  stamina: "var(--meter-stamina)",
  focus: "var(--meter-focus)",
  enemy: "var(--meter-enemy)"
};

export function Meter({ kind = "health", value = 1, max = 1, label, style, ...rest }) {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0)) * 100;
  const tall = kind === "health";
  return (
    <div
      role="meter"
      aria-valuenow={value}
      aria-valuemax={max}
      aria-label={typeof label === "string" ? label : kind}
      style={{
        position: "relative",
        height: tall ? "var(--meter-h-health)" : "var(--meter-h)",
        marginTop: tall ? 0 : "var(--space-1)",
        overflow: "hidden",
        background: "var(--meter-track)",
        border: "1px solid var(--meter-track-edge)",
        ...style
      }}
      {...rest}
    >
      <i style={{ display: "block", width: pct + "%", height: "100%", background: fills[kind], transition: "var(--ease-meter)" }} />
      {label ? (
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "rgba(255,255,255,.75)",
            fontSize: 7,
            letterSpacing: "0.04em"
          }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
