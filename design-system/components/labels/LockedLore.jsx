import React from "react";

export function LockedLore({ children = "Locked", style, ...rest }) {
  return (
    <div
      style={{
        marginTop: 9,
        paddingTop: 7,
        color: "#676e69",
        borderTop: "1px solid var(--line-faint)",
        font: "var(--type-nano)",
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        ...style
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
