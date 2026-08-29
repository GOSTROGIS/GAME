import * as React from "react";

/** Native select, 44px — exactly the touch floor. Used in pairs inside a
 *  two-column .select-row for appearance choices. Accepts plain strings or
 *  {value,label} objects. */
export interface SelectBoxProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  options?: Array<string | { value: string; label: string }>;
  style?: React.CSSProperties;
}

export function SelectBox(props: SelectBoxProps): React.JSX.Element;
