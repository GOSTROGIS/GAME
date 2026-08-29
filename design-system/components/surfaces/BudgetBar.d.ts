import * as React from "react";

/** Sticky running-total strip for allocation screens (attribute points,
 *  technique points). Sticks to the top of a scrolling form body. */
export interface BudgetBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Assigned amount, rendered with `max` when children are omitted. */
  value?: number;
  /** Total allocation budget, rendered with `value` when children are omitted. */
  max?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function BudgetBar(props: BudgetBarProps): React.JSX.Element;
