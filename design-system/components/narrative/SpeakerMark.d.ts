import * as React from "react";

/** Circular speaker sigil in the dialogue box. A letter, not a portrait —
 *  the project has renders for four origins only, and a missing portrait
 *  would read worse than a consistent mark. */
export interface SpeakerMarkProps extends React.HTMLAttributes<HTMLDivElement> {
  initial?: string;
  /** @default "var(--speaker-mark)" (100px) */
  size?: string | number;
  /** Hide the sigil when adjacent text already names the speaker. @default true */
  decorative?: boolean;
  /** Accessible name required when `decorative` is false. */
  label?: string;
  style?: React.CSSProperties;
}

export function SpeakerMark(props: SpeakerMarkProps): React.JSX.Element;
