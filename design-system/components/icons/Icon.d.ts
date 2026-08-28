import * as React from "react";

export type IconName =
  | "swordsmanship"
  | "heavy_arms"
  | "marksmanship"
  | "guard"
  | "vitality"
  | "hexcraft"
  | "mining"
  | "woodcutting"
  | "foraging"
  | "fishing"
  | "hunting"
  | "smithing"
  | "woodcraft"
  | "leatherworking"
  | "alchemy"
  | "cooking"
  | "runecrafting"
  | "wayfaring"
  | "ore"
  | "herb"
  | "blade"
  | "currency"
  | "ingot"
  | "timber"
  | "relic"
  | "tonic"
  | "pack"
  | "skills"
  | "journal"
  | "bestiary"
  | "atlas"
  | "close"
  | "back"
  | "flask"
  | "vow";

/** The system's only icon primitive.
 *
 *  There is no icon font, no emoji, and no raster icon anywhere in this design
 *  system. Every mark is a stroked 24x24 path that inherits `currentColor`, so
 *  icons pick up hover and disabled states for free and can never introduce a
 *  colour that is not already in the palette.
 *
 *  Covers all eighteen disciplines, the eight item classes, and the navigation
 *  and HUD set. If a needed mark is missing, add it to ICON_PATHS — do not
 *  reach for a Unicode character or an emoji.
 *
 * @startingPoint section="Foundations" subtitle="The full stroked SVG icon set" viewport="700x300"
 */
export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, "style" | "name"> {
  name: IconName;
  /** Rendered square edge in px. @default 20 */
  size?: number;
  /** @default "currentColor" */
  stroke?: string;
  /** @default 1.4 */
  strokeWidth?: number;
  /** Accessible name. Omit for decorative icons — they are aria-hidden. */
  title?: string;
  style?: React.CSSProperties;
}

export function Icon(props: IconProps): React.JSX.Element | null;
export const ICON_PATHS: Record<IconName, string>;
export const ICON_NAMES: IconName[];
