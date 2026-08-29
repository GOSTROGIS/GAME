import * as React from "react";

export interface ActionSlot {
  id?: string;
  /** An Icon name. */
  icon: string;
  label: string;
  /** Binding shown top-left. */
  key?: string;
  /** Charge or stack count shown top-right in gold. */
  count?: number;
  /** Unavailable commands remain visible but are removed from keyboard use. */
  disabled?: boolean;
}

/** Bottom-centre action rail, 76x61 per slot.
 *
 *  UNDER REVISION: the committed bindings (1/2 light-heavy, Space dodge)
 *  encode real-time timing. Turn-based will need action-economy semantics
 *  instead — treat slot meaning as unsettled, though the shell is reusable.
 */
export interface ActionBarProps {
  slots?: ActionSlot[];
  onUse?: (id?: string) => void;
  style?: React.CSSProperties;
}

export function ActionBar(props: ActionBarProps): React.JSX.Element;
