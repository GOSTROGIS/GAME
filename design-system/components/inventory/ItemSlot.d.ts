import * as React from "react";

/** A pack slot in the six-column inventory grid. Square by aspect-ratio.
 *  The tooltip appears above on hover — 130px, hairline bordered.
 *  Icons come from the Icon set — `ore`, `herb`, `blade`, `currency`,
 *  `ingot`, `timber`, `relic`, `tonic`. Never a character or emoji. */
export interface ItemSlotProps {
  /** An Icon name. */
  icon?: string;
  /** Stack size. Omit for unstackable items. */
  count?: number;
  /** Item name, shown in the tooltip. */
  name?: React.ReactNode;
  detail?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function ItemSlot(props: ItemSlotProps): React.JSX.Element;
