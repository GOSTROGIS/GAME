import React from "react";

export const ICON_PATHS = {
  "swordsmanship": "M12 2 L12 17 M8 6 L16 6 M12 17 L9 21 M12 17 L15 21",
  "heavy_arms": "M6 4 L18 4 L18 10 L6 10 Z M12 10 L12 21 M9 21 L15 21",
  "marksmanship": "M4 20 C4 10 10 4 20 4 M4 20 L9 15 M13 7 L17 7 M8 12 L12 12",
  "guard": "M12 2 L20 6 V13 C20 18 12 22 12 22 C12 22 4 18 4 13 V6 Z",
  "vitality": "M12 21 C6 16 3 12 3 8.5 A4.5 4.5 0 0 1 12 7 A4.5 4.5 0 0 1 21 8.5 C21 12 18 16 12 21 Z",
  "hexcraft": "M12 2 L20 12 L12 22 L4 12 Z M12 8 L16 12 L12 16 L8 12 Z",
  "mining": "M4 18 L14 8 M10 4 C15 4 20 9 20 14 M6 16 L8 18 M3 20 L6 17",
  "woodcutting": "M5 19 L15 9 M13 3 L21 11 L17 15 L9 7 Z",
  "foraging": "M12 21 V11 M12 11 C7 11 5 7 5 4 C9 4 12 7 12 11 M12 11 C17 11 19 7 19 4 C15 4 12 7 12 11",
  "fishing": "M3 12 C7 7 15 7 19 12 C15 17 7 17 3 12 Z M19 12 L22 9 M19 12 L22 15 M8 11 L8 11.5",
  "hunting": "M12 21 V12 M12 12 L6 4 M12 12 L18 4 M8 7 L10 9 M16 7 L14 9",
  "smithing": "M3 20 L11 12 M9 4 H19 V9 H9 Z M11 12 L14 9",
  "woodcraft": "M4 20 H20 M6 20 V13 H18 V20 M9 13 V8 H15 V13 M12 8 V4",
  "leatherworking": "M6 3 C6 3 4 9 4 14 C4 19 12 21 12 21 C12 21 20 19 20 14 C20 9 18 3 18 3 Z M12 6 V18",
  "alchemy": "M10 3 V8 L5 19 C4 21 5 21 6 21 H18 C19 21 20 21 19 19 L14 8 V3 M9 3 H15 M8 14 H16",
  "cooking": "M4 10 H20 A8 8 0 0 1 4 10 Z M12 10 V4 M9 6 L12 4 L15 6",
  "runecrafting": "M12 2 V22 M12 8 L18 4 M12 14 L6 10 M12 8 L6 4",
  "wayfaring": "M12 2 L15 9 L22 12 L15 15 L12 22 L9 15 L2 12 L9 9 Z",
  "ore": "M12 3 L20 9 L17 20 H7 L4 9 Z M12 9 V15",
  "herb": "M12 21 V9 M12 9 C8 9 6 6 6 3 C10 3 12 6 12 9 M12 9 C16 9 18 6 18 3 C14 3 12 6 12 9",
  "blade": "M12 2 L12 16 M9 5 L15 5 M12 16 L12 21",
  "currency": "M12 12 A9 9 0 1 1 11.9 12 Z M12 12 A4 4 0 1 1 11.9 12 Z",
  "ingot": "M4 15 H20 L17 9 H7 Z M7 9 L9 6 H15 L17 9",
  "timber": "M4 8 H20 V16 H4 Z M8 8 V16 M12 8 V16 M16 8 V16",
  "relic": "M12 3 L18 7 V14 L12 21 L6 14 V7 Z M12 9 L15 11 V14 L12 16 L9 14 V11 Z",
  "tonic": "M9 3 H15 V7 L18 12 V19 C18 20 17 21 16 21 H8 C7 21 6 20 6 19 V12 L9 7 Z M6 15 H18",
  "pack": "M6 8 H18 V20 H6 Z M9 8 V5 C9 4 10 3 12 3 C14 3 15 4 15 5 V8 M6 13 H18",
  "skills": "M12 2 L20 12 L12 22 L4 12 Z",
  "journal": "M6 3 H18 V21 H6 Z M9 7 H15 M9 11 H15 M9 15 H13",
  "bestiary": "M12 4 A7 7 0 0 1 19 11 V15 H5 V11 A7 7 0 0 1 12 4 Z M9 11 V12 M15 11 V12 M9 18 H15",
  "atlas": "M3 6 L9 4 L15 6 L21 4 V18 L15 20 L9 18 L3 20 Z M9 4 V18 M15 6 V20",
  "close": "M6 6 L18 18 M18 6 L6 18",
  "back": "M15 5 L8 12 L15 19",
  "flask": "M9 3 H15 V7 L18 12 V19 C18 20 17 21 16 21 H8 C7 21 6 20 6 19 V12 L9 7 Z",
  "vow": "M12 4 A8 8 0 1 1 11.9 4 M9 12 L15 12"
};

export function Icon({ name, size = 20, stroke = "currentColor", strokeWidth = 1.4, title, style, ...rest }) {
  const d = ICON_PATHS[name];
  if (!d) {
    if (typeof console !== "undefined") console.warn("[Icon] unknown name: " + name);
    return null;
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : "true"}
      aria-label={title}
      style={{ display: "block", flex: "0 0 auto", ...style }}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path d={d}></path>
    </svg>
  );
}

export const ICON_NAMES = Object.keys(ICON_PATHS);
