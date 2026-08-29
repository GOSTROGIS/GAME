import * as React from "react";

/** The conversation box: bottom-centre, min(920px, 80vw), min-height 190px.
 *  Player choices are set in IM Fell English, not Cinzel — the player is
 *  speaking, so it is the world's voice rather than the system's.
 *
 * @startingPoint section="Narrative" subtitle="Speaker, line and player choices" viewport="700x240"
 */
export interface DialogueProps extends React.HTMLAttributes<HTMLElement> {
  /** The speaker's faction, shown as a gold micro label. */
  faction?: React.ReactNode;
  speaker?: React.ReactNode;
  initial?: string;
  line?: React.ReactNode;
  choices?: Array<string | { id?: string; label: React.ReactNode }>;
  onChoose?: (id: string | number) => void;
  style?: React.CSSProperties;
}

export function Dialogue(props: DialogueProps): React.JSX.Element;
