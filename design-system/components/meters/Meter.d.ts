import * as React from "react";

/** Resource bar. Health is 10px and gradient-filled; stamina and focus are
 *  7px; enemy is flat --enemy with no gradient so it reads as other.
 *
 *  NOTE: `stamina` is under revision for the turn-based direction — a
 *  continuously draining resource presumes real-time commitment.
 *
 * @startingPoint section="HUD" subtitle="Health, stamina, focus and enemy bars" viewport="700x150"
 */
export interface MeterProps {
  /** @default "health" */
  kind?: "health" | "stamina" | "focus" | "enemy";
  value?: number;
  /** @default 1 */
  max?: number;
  /** Optional centred overlay text, 7px. Omit on the compact HUD. */
  label?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Meter(props: MeterProps): React.JSX.Element;
