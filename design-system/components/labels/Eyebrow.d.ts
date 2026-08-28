import * as React from "react";

/** The system's signature label: gold, uppercase Cinzel at .28em tracking.
 *  Sits directly above a heading. Three words maximum — the tracking makes
 *  anything longer unreadable. */
export interface EyebrowProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Eyebrow(props: EyebrowProps): React.JSX.Element;
