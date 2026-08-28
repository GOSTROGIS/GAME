import * as React from "react";

/** Full-screen overlay for the creator, codex and character sheet. Inset
 *  4vh/5vw, capped at 1500px, centred. Its border is slightly stronger than
 *  --line (.22) because it must hold against the world behind it. */
export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Modal(props: ModalProps): React.JSX.Element;
