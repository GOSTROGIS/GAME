import * as React from "react";

/** Attribute allocation stepper. Pair with BudgetBar so the player always
 *  sees the pool. 28px controls — dense desktop only. */
export interface StatStepperProps {
  /** Attribute or resource name included in every accessible control name. */
  label: string;
  value?: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
  style?: React.CSSProperties;
}

export function StatStepper(props: StatStepperProps): React.JSX.Element;
