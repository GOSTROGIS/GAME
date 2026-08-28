import * as React from "react";

/** Single inset shadow that pulls the eye to centre and hides the viewport
 *  edge. Pairs with Grain; render it beneath the grain layer. */
export interface VignetteProps {
  style?: React.CSSProperties;
}

export function Vignette(props: VignetteProps): React.JSX.Element;
