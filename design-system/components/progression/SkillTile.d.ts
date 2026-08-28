import * as React from "react";

/** One of the eighteen disciplines in the skills grid (3 columns). Shows the
 *  level large in gold-bright, "of 99" small, and progress to next level as
 *  a 2px rule. The icon is an Icon name — one per discipline, never a glyph.
 *
 * @startingPoint section="Progression" subtitle="Discipline tile with level and XP" viewport="700x150"
 */
export interface SkillTileProps {
  name?: React.ReactNode;
  level?: number;
  /** Unicode glyph, e.g. "\u2694" for Swordsmanship. */
  glyph?: string;
  /** Progress to next level, 0–100. */
  xpPct?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function SkillTile(props: SkillTileProps): React.JSX.Element;
