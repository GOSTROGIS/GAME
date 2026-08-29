import * as React from "react";

/** One of the eighteen disciplines in the skills grid (3 columns). Shows the
 *  level large in gold-bright, "of 99" small, and progress to next level as
 *  a 2px rule. The icon is an Icon name — one per discipline, never a glyph.
 *
 * @startingPoint section="Progression" subtitle="Discipline tile with level and XP" viewport="700x150"
 */
export interface SkillTileProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "name"> {
  name?: React.ReactNode;
  level?: number;
  /** Canonical Icon name for the discipline. */
  icon?: string;
  /** Progress to next level, 0–100. */
  xpPct?: number;
}

export function SkillTile(props: SkillTileProps): React.JSX.Element;
