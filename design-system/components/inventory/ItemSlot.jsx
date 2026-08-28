import React from "react";

import { Icon } from "../icons/Icon.jsx";

export function ItemSlot({ icon, count, name, detail, onClick, style, ...rest }) {
  const [hot, setHot] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      style={{
        aspectRatio: "1",
        padding: 6,
        position: "relative",
        display: "grid",
        placeItems: "center",
        background: "#0a0e0f",
        border: "1px solid " + (hot ? "var(--gold)" : "var(--line)"),
        cursor: "pointer",
        ...style
      }}
      {...rest}
    >
      <Icon name={icon} size={26} style={{ filter: "drop-shadow(0 3px 5px #000)" }} />
      {count != null ? <b style={{ position: "absolute", right: 5, bottom: 3, fontSize: 9, color: "var(--bone)" }}>{count}</b> : null}
      {hot && name ? (
        <small
          style={{
            position: "absolute",
            left: "50%",
            bottom: "calc(100% + 8px)",
            zIndex: 4,
            width: 130,
            padding: 8,
            transform: "translateX(-50%)",
            background: "#090c0d",
            border: "1px solid var(--line)",
            color: "var(--bone)",
            font: "11px var(--serif)",
            textAlign: "left"
          }}
        >
          <b style={{ display: "block", font: "10px var(--display)" }}>{name}</b>
          {detail}
        </small>
      ) : null}
    </button>
  );
}
