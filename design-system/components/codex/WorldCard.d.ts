import * as React from "react";

/** A region tile in the world atlas. The image sits at 72% opacity behind an
 *  upward scrim so the type always wins; hover lifts it to 92%. Never show a
 *  keyframe at full opacity — it competes with the copy.
 *
 * @startingPoint section="Codex" subtitle="Region tile over a keyframe" viewport="700x260"
 */
export interface WorldCardProps {
  image?: string;
  alt?: string;
  /** Level band and role, e.g. "Levels 5&ndash;14 &middot; Gathering". */
  label?: React.ReactNode;
  name?: React.ReactNode;
  description?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function WorldCard(props: WorldCardProps): React.JSX.Element;
