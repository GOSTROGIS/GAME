import * as React from "react";

export type EncounterViewerMode = "participant" | "spectator" | "reconnecting";
export type PartyConnectionState = "connected" | "reconnecting" | "disconnected";
export interface PartyReadinessMember {
  id: string;
  name: string;
  leader?: boolean;
  ready?: boolean;
  connected?: boolean;
  connectionState?: PartyConnectionState;
  spectator?: boolean;
  graceSeconds?: number;
}
export interface PartyReadinessProps extends React.HTMLAttributes<HTMLElement> {
  members?: PartyReadinessMember[];
  heading?: React.ReactNode;
  viewerMode?: EncounterViewerMode;
  reconnectSeconds?: number;
}
export function PartyReadiness(props: PartyReadinessProps): React.JSX.Element;
