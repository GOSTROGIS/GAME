import * as React from "react";

export type TurnPhase = "forming" | "planning" | "locked" | "resolving" | "settling" | "victory" | "defeat" | "aborted";
export type EncounterViewerMode = "participant" | "spectator" | "reconnecting";
export interface TurnPhaseBarProps extends React.HTMLAttributes<HTMLElement> {
  phase?: TurnPhase;
  round?: number;
  phases?: TurnPhase[];
  detail?: React.ReactNode;
  viewerMode?: EncounterViewerMode;
  reconnectSeconds?: number;
}
export function TurnPhaseBar(props: TurnPhaseBarProps): React.JSX.Element;
