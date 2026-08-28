import * as React from "react";

export interface SideNavItem {
  id: string;
  /** An Icon name. Never a character or an emoji. */
  icon: string;
  label: string;
  /** Keyboard shortcut shown in the tooltip, e.g. "K". */
  key?: string;
}

/** Vertical menu rail, 62px wide, anchored left 24 / top 124. Each item is
 *  56px tall — comfortably above the 44px floor. */
export interface SideNavProps {
  items?: SideNavItem[];
  active?: string;
  onSelect?: (id: string) => void;
  style?: React.CSSProperties;
}

export function SideNav(props: SideNavProps): React.JSX.Element;
