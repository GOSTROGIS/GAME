import React from "react";

import { Icon } from "../icons/Icon.jsx";

export function ItemSlot({ icon, count, name, detail, accessibleName, onClick, style, ...rest }) {
  const [hot, setHot] = React.useState(false);
  const tooltipId = React.useId();
  const empty = name == null && icon == null;
  const itemName = accessibleName || (typeof name === "string" || typeof name === "number" ? String(name) : "Inventory item");
  const label = empty ? "Empty inventory slot" : itemName + (count != null ? `, quantity ${count}` : "");
  return (
    <button
      {...rest}
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      aria-label={label}
      aria-describedby={hot && detail ? tooltipId : undefined}
      disabled={empty}
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
    >
      <Icon name={icon} size={26} style={{ filter: "drop-shadow(0 3px 5px #000)" }} />
      {count != null ? <b style={{ position: "absolute", right: 5, bottom: 3, fontSize: 9, color: "var(--bone)" }}>{count}</b> : null}
      {hot && name ? (
        <small
          id={tooltipId}
          role="tooltip"
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
