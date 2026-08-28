import * as React from "react";

/** Keycap. One of only three places radius appears in the system (2px).
 *  Always Inter — a key is machine voice, not interface voice. */
export interface KbdProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Kbd(props: KbdProps): React.JSX.Element;
