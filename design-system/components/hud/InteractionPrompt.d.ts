import * as React from "react";

/** Contextual "press X to Y" prompt, centred above the action bar. Copy is
 *  IM Fell English — the world is offering, not the system instructing. */
export interface InteractionPromptProps {
  /** @default "E" */
  keyLabel?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function InteractionPrompt(props: InteractionPromptProps): React.JSX.Element;
