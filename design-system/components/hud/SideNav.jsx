import React from "react";

import { Icon } from "../icons/Icon.jsx";

export function SideNav({ items = [], active, onSelect, style, ...rest }) {
  return (
    <nav
      aria-label="Game menus"
      style={{
        width: "var(--nav-w)",
        display: "grid",
        padding: 4,
        background: "var(--glass-bg)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-panel)",
        backdropFilter: "blur(var(--blur-glass))",
        ...style
      }}
      {...rest}
    >
      {items.map((it) => {
        const on = it.id === active;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onSelect && onSelect(it.id)}
            title={it.label + (it.key ? " (" + it.key + ")" : "")}
            style={{
              display: "grid",
              placeItems: "center",
              height: "var(--nav-item-h)",
              padding: 4,
              border: 0,
              borderBottom: "1px solid var(--line)",
              background: on ? "rgba(185,149,82,.11)" : "transparent",
              color: on ? "var(--gold-bright)" : "var(--bone)",
              cursor: "pointer"
            }}
          >
            <Icon name={it.icon} size={19} />
            <small style={{ color: "#8f958f", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{it.label}</small>
          </button>
        );
      })}
    </nav>
  );
}
