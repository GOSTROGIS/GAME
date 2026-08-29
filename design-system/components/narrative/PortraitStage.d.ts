import * as React from "react";

/** The creator's left column — a lit alcove holding the origin render.
 *  When no render exists for an origin, pass no `image` and render a labelled
 *  placeholder as `children`. Never substitute another origin's art. */
export interface PortraitStageProps extends React.HTMLAttributes<HTMLElement> {
  image?: string;
  alt?: string;
  /** Caption, morph-profile badge, or an explicit "no keyframe" label. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function PortraitStage(props: PortraitStageProps): React.JSX.Element;
