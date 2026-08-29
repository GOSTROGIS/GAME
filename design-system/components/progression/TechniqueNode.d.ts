import * as React from "react";

/** One of the 216 technique nodes. Three states: `learned` (gold border and
 *  tinted fill), `available`, and `locked` (55% opacity — dimmed, never
 *  removed, so the player can see the ceiling they are working toward).
 *
 *  Two mutually exclusive adept nodes per tree make specialisation real; when
 *  one is taken, render its sibling as `locked`.
 *
 * @startingPoint section="Progression" subtitle="Learned, available and locked states" viewport="700x220"
 */
export interface TechniqueNodeProps extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  /** Novice | Adept | Expert | Master, optionally with a state suffix. */
  tier?: React.ReactNode;
  name?: React.ReactNode;
  description?: React.ReactNode;
  /** @default "available" */
  state?: "learned" | "available" | "locked";
  /** Technique point cost, shown on the button. */
  cost?: number | string;
  onPurchase?: () => void;
  style?: React.CSSProperties;
}

export function TechniqueNode(props: TechniqueNodeProps): React.JSX.Element;
