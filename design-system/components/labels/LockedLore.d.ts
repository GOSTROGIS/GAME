import * as React from "react";

/** Footer strip on a codex card showing undiscovered reveals. Communicates
 *  that more exists without hinting at what — never put real lore here. */
export interface LockedLoreProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function LockedLore(props: LockedLoreProps): React.JSX.Element;
