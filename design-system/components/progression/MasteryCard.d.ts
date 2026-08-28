import * as React from "react";

/** The level-90 mastery trial for a discipline. Warmer border and fill than a
 *  TechniqueNode because it is a capstone, not a purchase. One per tree. */
export interface MasteryCardProps {
  /** e.g. "Mastery trial &middot; Level 90". */
  label?: React.ReactNode;
  name?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function MasteryCard(props: MasteryCardProps): React.JSX.Element;
