import * as React from "react";

/** Right-aligned place readout. Deliberately has no panel — it sits directly
 *  on the world with a text shadow, so the world stays visible behind it. */
export interface LocationCardProps {
  /** Territory, e.g. "Dunmire Causeway". */
  region?: React.ReactNode;
  /** The specific site or landmark. */
  name?: React.ReactNode;
  /** One short italic line of atmosphere. */
  note?: React.ReactNode;
  style?: React.CSSProperties;
}

export function LocationCard(props: LocationCardProps): React.JSX.Element;
