import * as React from "react";

/** One of 42 named characters. `voice` is a short italic line in their own
 *  words — it does more than description to establish a person. Only six are
 *  physically placed in the current slice, so most cards should carry a
 *  StatusPill noting they are authored but unplaced. */
export interface CharacterCodexCardProps {
  role?: React.ReactNode;
  /** One of the seven factions. */
  faction?: React.ReactNode;
  name?: React.ReactNode;
  /** A short quoted line, italic. */
  voice?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function CharacterCodexCard(props: CharacterCodexCardProps): React.JSX.Element;
