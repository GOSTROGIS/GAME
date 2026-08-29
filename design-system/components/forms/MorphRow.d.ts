import * as React from "react";

/** One of the sixteen appearance morph channels. Label is serif — it names a
 *  feature of a person, not a setting. Laid out in a two-column morph grid. */
export interface MorphRowProps {
  id?: string;
  label: React.ReactNode;
  /** 0–1. */
  value?: number;
  onChange?: (value: number) => void;
  style?: React.CSSProperties;
}

export function MorphRow(props: MorphRowProps): React.JSX.Element;
