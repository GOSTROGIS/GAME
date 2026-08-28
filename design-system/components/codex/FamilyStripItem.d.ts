import * as React from "react";

/** One of the 21 ecological families, used as a filter strip above the
 *  bestiary grid. `count` shows how many creatures the family holds. */
export interface FamilyStripItemProps {
  name?: React.ReactNode;
  /** e.g. "11 creatures". */
  count?: React.ReactNode;
  description?: React.ReactNode;
  style?: React.CSSProperties;
}

export function FamilyStripItem(props: FamilyStripItemProps): React.JSX.Element;
