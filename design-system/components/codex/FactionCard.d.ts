import * as React from "react";

/** One of the seven factions. `note` carries current standing or a
 *  consequence hook in warm gold-grey. */
export interface FactionCardProps {
  /** Territory or domain. */
  label?: React.ReactNode;
  name?: React.ReactNode;
  description?: React.ReactNode;
  /** Standing or consequence, e.g. "Wary of you since the causeway." */
  note?: React.ReactNode;
  style?: React.CSSProperties;
}

export function FactionCard(props: FactionCardProps): React.JSX.Element;
