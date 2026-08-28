import * as React from "react";

/** Floating damage or outcome number rendered over the world.
 *
 *  UNDER REVISION for turn-based: floating numbers assume continuous
 *  resolution. A turn-based build likely wants a resolution log instead. */
export interface CombatTextProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function CombatText(props: CombatTextProps): React.JSX.Element;
