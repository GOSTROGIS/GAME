import * as React from "react";

/** A single derived stat on the character sheet, label left and value right.
 *  Laid out in a two-column grid. */
export interface SheetStatProps {
  label?: React.ReactNode;
  value?: React.ReactNode;
  style?: React.CSSProperties;
}

export function SheetStat(props: SheetStatProps): React.JSX.Element;
