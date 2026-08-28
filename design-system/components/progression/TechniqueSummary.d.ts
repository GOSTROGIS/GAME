import * as React from "react";

/** Header block at the top of a drilled-in discipline tree: glyph, current
 *  level, tier name, and what the discipline is for. */
export interface TechniqueSummaryProps {
  /** An Icon name. */
  icon?: string;
  level?: number;
  /** Novice, Adept, Expert or Master. */
  tier?: React.ReactNode;
  description?: React.ReactNode;
  style?: React.CSSProperties;
}

export function TechniqueSummary(props: TechniqueSummaryProps): React.JSX.Element;
