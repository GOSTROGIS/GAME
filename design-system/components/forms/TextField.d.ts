import * as React from "react";

/** Single-line text input, 52px tall, capped at 500px. Set in IM Fell
 *  English at 19px because the player is writing into the world — a name,
 *  an oath — not filling a form. */
export interface TextFieldProps {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export function TextField(props: TextFieldProps): React.JSX.Element;
