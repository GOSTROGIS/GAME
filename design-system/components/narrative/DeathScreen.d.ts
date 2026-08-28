import * as React from "react";

/** Defeat overlay. The only place --death (#a65c51) is used. Fades in over
 *  1.4s — slow on purpose. Copy should state the consequence plainly:
 *  return to the last wayshrine, flask charges restored, 10% Sable Mark loss. */
export interface DeathScreenProps {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  /** Italic serif consequence line. */
  note?: React.ReactNode;
  /** Normally a single ghost Button back to the wayshrine. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function DeathScreen(props: DeathScreenProps): React.JSX.Element;
