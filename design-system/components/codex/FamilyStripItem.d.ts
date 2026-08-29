import * as React from "react";

/** One of the 21 ecological families, used as a filter strip above the
 *  bestiary grid. `count` shows how many creatures the family holds. */
export interface FamilyStripItemProps extends Omit<React.HTMLAttributes<HTMLElement>, "onClick"> {
  name?: React.ReactNode;
  /** e.g. "11 creatures". */
  count?: React.ReactNode;
  description?: React.ReactNode;
  /** Selection state when the item is an interactive filter. */
  selected?: boolean;
  /** When supplied, renders a native toggle button instead of an article. */
  onClick?: () => void;
}

export function FamilyStripItem(props: FamilyStripItemProps): React.JSX.Element;
