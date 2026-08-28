import * as React from "react";

/** Transient notification. Lives 3.1s total (in .3s, out at 2.7s). Stack
 *  them in a 330px column at 18% from the top — never bottom-right.
 *  Wrap emphasis in <b> to pick up --gold-bright. */
export interface ToastProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Toast(props: ToastProps): React.JSX.Element;
