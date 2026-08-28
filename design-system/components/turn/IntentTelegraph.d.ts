import * as React from "react";

export interface IntentStatusIcon {
  id: string;
  /** Unicode glyph; the adjacent label is always visible and announced. */
  glyph: string;
  label: string;
}
export interface IntentTelegraphProps extends React.HTMLAttributes<HTMLElement> {
  id?: string;
  actor: string;
  action: string;
  target: string;
  band: string;
  damage: string;
  statusIcons: IntentStatusIcon[];
  cue: string;
  interrupt: string;
  selected?: boolean;
  onInspect?: () => void;
}
export function IntentTelegraph(props: IntentTelegraphProps): React.JSX.Element;
