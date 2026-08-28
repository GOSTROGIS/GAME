import * as React from "react";

/** Full-figure character display on the sheet. Applies --grade-character;
 *  never pass an already-graded image or it will double-darken.
 *  Only four of the eight origins have renders — show a labelled empty stage
 *  for the rest rather than substituting off-style art. */
export interface PaperDollProps {
  image?: string;
  alt?: string;
  style?: React.CSSProperties;
}

export function PaperDoll(props: PaperDollProps): React.JSX.Element;
