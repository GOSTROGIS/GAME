import * as React from "react";

/** Sticky running-total strip for allocation screens (attribute points,
 *  technique points). Sticks to the top of a scrolling form body. */
export interface BudgetBarProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function BudgetBar(props: BudgetBarProps): React.JSX.Element;
