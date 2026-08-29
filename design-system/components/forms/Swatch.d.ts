import * as React from "react";

/** Circular colour choice for skin, hair and marking palettes. One of only
 *  three round things in the system. Always pass `label` — a colour alone
 *  is not an accessible name. */
export interface SwatchProps {
  color?: string;
  selected?: boolean;
  onClick?: () => void;
  /** Accessible name, e.g. "Ash grey". */
  label: string;
  style?: React.CSSProperties;
}

export function Swatch(props: SwatchProps): React.JSX.Element;
