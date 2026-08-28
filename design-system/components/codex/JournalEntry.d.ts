import * as React from "react";

/** A quest row in the journal. The rotated 6px square is the system's only
 *  bullet form — a diamond drawn in CSS, matching the Icon set's geometry. */
export interface JournalEntryProps {
  title?: React.ReactNode;
  summary?: React.ReactNode;
  /** Active | Complete | Failed. */
  status?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function JournalEntry(props: JournalEntryProps): React.JSX.Element;
