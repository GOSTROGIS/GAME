import * as React from "react";

/** Caption pinned to the bottom of a PortraitStage. `note` is the honest
 *  provenance line — "keyframe, not final art", "live morph profile". */
export interface PortraitCaptionProps extends React.HTMLAttributes<HTMLElement> {
  name?: React.ReactNode;
  note?: React.ReactNode;
  style?: React.CSSProperties;
}

export function PortraitCaption(props: PortraitCaptionProps): React.JSX.Element;
