import * as React from "react";

/** One of the eight attributes in the allocation list: abbreviation, name,
 *  what it does, and a control slot. Children is normally a StatStepper. */
export interface AttributeRowProps {
  /** Three-letter form, e.g. "VIG". */
  abbr?: React.ReactNode;
  name?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function AttributeRow(props: AttributeRowProps): React.JSX.Element;
