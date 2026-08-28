import React from "react";

const base = {
  border: 0,
  minHeight: "var(--touch-min)",
  padding: "0 20px",
  cursor: "pointer",
  textTransform: "uppercase",
  letterSpacing: "var(--track-button)",
  font: "var(--type-button)",
  transition: "var(--ease-ui)"
};

const variants = {
  primary: {
    background: "var(--gold-btn-bg)",
    color: "var(--gold-btn-ink)",
    border: "1px solid var(--gold-btn-edge)",
    boxShadow: "var(--shadow-button)"
  },
  ghost: {
    background: "var(--ghost-bg)",
    border: "1px solid var(--line)",
    color: "var(--bone)"
  }
};

export function Button({
  variant = "primary",
  ornate = false,
  disabled = false,
  onClick,
  style,
  children,
  ...rest
}) {
  const [hot, setHot] = React.useState(false);
  const hover =
    !disabled && hot
      ? variant === "primary"
        ? { filter: "brightness(1.15)", transform: "translateY(-1px)" }
        : { borderColor: "var(--gold)", color: "var(--gold-bright)" }
      : null;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      style={{
        ...base,
        ...variants[variant],
        ...(ornate ? { clipPath: "var(--clip-ornate)", padding: "0 26px" } : null),
        ...(disabled ? { opacity: 0.5, cursor: "default" } : null),
        ...hover,
        ...style
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
