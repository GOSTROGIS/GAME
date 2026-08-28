import * as React from "react";

/** Maturity marker. The project distinguishes authored, validated,
 *  habitat-valid, integrated, prototype, production and playtested —
 *  any surface claiming a capability must show which it is. */
export interface StatusPillProps {
  /** `prototype` reads ember as a warning; `valid` reads moss. @default "default" */
  tone?: "default" | "prototype" | "valid";
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function StatusPill(props: StatusPillProps): React.JSX.Element;
