import * as React from "react";

/**
 * The system's only button. Primary is the single gold-filled control on a
 * screen; ghost is everything else. `ornate` adds the 8px chamfer for
 * ceremonial moments (title screen, oath confirmation) — not for routine UI.
 *
 * @startingPoint section="Controls" subtitle="Primary, ghost and ornate variants" viewport="700x150"
 */
export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  /** Gold fill or hairline outline. @default "primary" */
  variant?: "primary" | "ghost";
  /** Apply the chamfered silhouette. @default false */
  ornate?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function Button(props: ButtonProps): React.JSX.Element;
