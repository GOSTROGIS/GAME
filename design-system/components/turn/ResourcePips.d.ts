import * as React from "react";

export interface ResourcePipsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "role"> {
  label: string;
  value?: number;
  max?: number;
  reserved?: number;
  unit?: string;
}
export function ResourcePips(props: ResourcePipsProps): React.JSX.Element;
