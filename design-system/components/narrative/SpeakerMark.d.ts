import * as React from "react";

/** Circular speaker sigil in the dialogue box. A letter, not a portrait —
 *  the project has renders for four origins only, and a missing portrait
 *  would read worse than a consistent mark. */
export interface SpeakerMarkProps {
  initial?: string;
  /** @default "var(--speaker-mark)" (100px) */
  size?: string | number;
  style?: React.CSSProperties;
}

export function SpeakerMark(props: SpeakerMarkProps): React.JSX.Element;
