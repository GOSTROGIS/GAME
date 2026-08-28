import * as React from "react";

export interface ResolutionLogEvent { cursor: number; band: string; text: string }
export interface ResolutionLogProps extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  events?: ResolutionLogEvent[];
  heading?: React.ReactNode;
  liveSummary?: string;
  selectedCursor?: number;
  onSelect?: (cursor: number) => void;
}
export function ResolutionLog(props: ResolutionLogProps): React.JSX.Element;
