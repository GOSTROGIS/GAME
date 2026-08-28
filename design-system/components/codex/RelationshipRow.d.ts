import * as React from "react";

/** One of the 48 relationship hooks: two named characters and the tie between
 *  them. Reads left-to-right as a sentence. */
export interface RelationshipRowProps {
  from?: React.ReactNode;
  /** The tie — "owes", "buried", "will not name". */
  kind?: React.ReactNode;
  to?: React.ReactNode;
  description?: React.ReactNode;
  /** Optionally a LockedLore strip. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function RelationshipRow(props: RelationshipRowProps): React.JSX.Element;
