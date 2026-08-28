import * as React from "react";
import type { Resource } from "./PlayerCard";

/** Current target readout, centred at the top of the HUD. The role label uses
 *  --target-label (a desaturated ember) and the meter is flat --enemy: the
 *  target is deliberately rendered in a different colour language. */
export interface TargetCardProps {
  /** One of the ten encounter roles — bruiser, skirmisher, controller, etc. */
  role?: React.ReactNode;
  name?: React.ReactNode;
  health?: Resource;
  style?: React.CSSProperties;
}

export function TargetCard(props: TargetCardProps): React.JSX.Element;
