import * as React from "react";

/** Form field label. Slightly tighter tracking than Eyebrow and carries its
 *  own 28px top margin — it is the spacing rhythm of the creator form. */
export interface FieldLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor: string;
  children?: React.ReactNode;
}

export function FieldLabel(props: FieldLabelProps): React.JSX.Element;
