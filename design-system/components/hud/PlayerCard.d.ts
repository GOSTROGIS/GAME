import * as React from "react";

export interface Resource { value: number; max: number; }

/** The HUD's left anchor: rune or portrait, name, level and three meters.
 *  Fixed 78px tall, 315px wide in the HUD grid. If `portrait` is given the
 *  rune letter is hidden and the render is used as a background at 245%.
 *
 * @startingPoint section="HUD" subtitle="Rune, name and three resource meters" viewport="700x150"
 */
export interface PlayerCardProps {
  name?: React.ReactNode;
  level?: number;
  /** Single-letter fallback when no portrait exists. */
  rune?: string;
  /** URL of a graded origin render. */
  portrait?: string;
  health?: Resource;
  stamina?: Resource;
  focus?: Resource;
  style?: React.CSSProperties;
}

export function PlayerCard(props: PlayerCardProps): React.JSX.Element;
