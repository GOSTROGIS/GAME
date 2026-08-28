import * as React from "react";

/** Right-hand objective panel, 288px, anchored top 120. Completed objectives
 *  are struck through and desaturated rather than removed — the ledger
 *  records actions before their quest activates, so history stays visible. */
export interface QuestTrackerProps {
  /** e.g. "Chapter II". */
  chapter?: React.ReactNode;
  title?: React.ReactNode;
  summary?: React.ReactNode;
  objectives?: Array<{ label: React.ReactNode; done?: boolean }>;
  /** 0–1. Omit to hide the bar. */
  progress?: number;
  style?: React.CSSProperties;
}

export function QuestTracker(props: QuestTrackerProps): React.JSX.Element;
