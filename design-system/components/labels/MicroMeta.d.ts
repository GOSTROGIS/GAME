import * as React from "react";

/** 8px tracked Cinzel used for card headers, region names and tier markers.
 *  The smallest type in the system — legible only because it is short,
 *  uppercase and high-contrast. Never for content a player must read. */
export interface MicroMetaProps {
  align?: "left" | "right" | "center";
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function MicroMeta(props: MicroMetaProps): React.JSX.Element;
