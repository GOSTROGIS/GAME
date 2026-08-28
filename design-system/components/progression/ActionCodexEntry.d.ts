import * as React from "react";

/** One of the 144 action specifications — the XP-granting behaviours inside a
 *  discipline. Rendered in a dense two-column grid. */
export interface ActionCodexEntryProps {
  name?: React.ReactNode;
  /** Category, e.g. "Gather" or "Craft". */
  kind?: React.ReactNode;
  detail?: React.ReactNode;
  style?: React.CSSProperties;
}

export function ActionCodexEntry(props: ActionCodexEntryProps): React.JSX.Element;
