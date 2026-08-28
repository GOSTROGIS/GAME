import * as React from "react";

/** The creator's primary choice control — origins, vows, disciplines.
 *  Selection is marked three ways at once (gold border, tinted fill, 3px
 *  inset bar) because it must survive being read over a bright keyframe.
 *
 * @startingPoint section="Controls" subtitle="Selectable choice card with note" viewport="700x160"
 */
export interface OptionCardProps {
  title?: React.ReactNode;
  /** One or two sentences of IM Fell English. */
  description?: React.ReactNode;
  /** Small gold Inter note — mechanical consequence, e.g. "+2 WAYFARING". */
  note?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function OptionCard(props: OptionCardProps): React.JSX.Element;
