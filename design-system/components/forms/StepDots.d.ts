import * as React from "react";

/** Progress indicator for the six-stage creator. Bars, not dots — 44px wide
 *  and 3px tall. Only the active bar glows; completed and upcoming look the
 *  same, because the creator allows free movement between stages. */
export interface StepDotsProps {
  /** @default 6 */
  count?: number;
  /** Zero-based. */
  active?: number;
  style?: React.CSSProperties;
}

export function StepDots(props: StepDotsProps): React.JSX.Element;
