import * as React from "react";

/** Animated fractal-noise layer at 8% opacity. Sits at inset:-50% so its
 *  drift never exposes an edge. One per scene, above the world and below
 *  the HUD. Honours prefers-reduced-motion via the token stylesheet. */
export interface GrainProps {
  style?: React.CSSProperties;
}

export function Grain(props: GrainProps): React.JSX.Element;
