import * as React from "react";

/** Row of keybinding hints beneath the action bar. Hidden entirely below
 *  1100px — it is a convenience, never the only way to learn a control. */
export interface HintStripProps {
  hints?: Array<{ key: string; label: string }>;
  style?: React.CSSProperties;
}

export function HintStrip(props: HintStripProps): React.JSX.Element;
