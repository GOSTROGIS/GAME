import * as React from "react";
import { IntentTelegraphProps } from "./IntentTelegraph";

export interface IntentQueueProps extends React.HTMLAttributes<HTMLElement> {
  intents?: Array<IntentTelegraphProps & { id: string }>;
  selectedId?: string;
  onInspect?: (id: string) => void;
  heading?: React.ReactNode;
}
export function IntentQueue(props: IntentQueueProps): React.JSX.Element;
