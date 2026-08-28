import * as React from "react";

/** Breadcrumb-style return control used at the top of a drilled-in codex or
 *  technique-tree view. Always the first child of the panel content. */
export interface CodexBackProps {
  /** Destination name, not "Back" alone where a name is known. @default "Back" */
  label?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function CodexBack(props: CodexBackProps): React.JSX.Element;
