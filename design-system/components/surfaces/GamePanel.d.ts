import * as React from "react";

/** The in-world content panel — skills, inventory, journal, bestiary, atlas.
 *  Anchored left 98px / top 120px / bottom 115px so it clears the side nav
 *  and action bar. Header is a fixed 74px; only the body scrolls.
 *
 * @startingPoint section="Surfaces" subtitle="In-world content panel with header" viewport="700x300"
 */
export interface GamePanelProps extends React.HTMLAttributes<HTMLElement> {
  title?: React.ReactNode;
  /** Omit to render a panel with no close affordance. */
  onClose?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function GamePanel(props: GamePanelProps): React.JSX.Element;
