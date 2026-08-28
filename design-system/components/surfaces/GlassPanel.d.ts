import * as React from "react";

/** The default raised surface. Every HUD card is one of these. A 140deg
 *  gradient between two near-blacks, one hairline, soft outer shadow and a
 *  1px inner highlight — never a radius, never a coloured border.
 *
 * @startingPoint section="Surfaces" subtitle="The default raised surface" viewport="700x200"
 */
export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function GlassPanel(props: GlassPanelProps): React.JSX.Element;
