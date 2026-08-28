import * as React from "react";

/** A bestiary entry — one of 178 creatures across 21 ecological families.
 *  Header carries rank and region; `facts` is the anatomy/behaviour contract.
 *  Pass a StatusPill row as `children`: every card MUST show its maturity,
 *  because all 178 are authored and habitat-valid but none have production
 *  models, and a card without the strip implies a finished creature.
 *
 * @startingPoint section="Codex" subtitle="Bestiary entry with maturity strip" viewport="700x260"
 */
export interface EnemyCodexCardProps {
  /** Regular | Specialist | Elite | Miniboss | Boss, with encounter role. */
  rank?: React.ReactNode;
  region?: React.ReactNode;
  name?: React.ReactNode;
  /** Horror language — anatomy and pathology, not stats. */
  description?: React.ReactNode;
  facts?: Array<{ term: React.ReactNode; value: React.ReactNode }>;
  /** Status pill row and/or LockedLore. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function EnemyCodexCard(props: EnemyCodexCardProps): React.JSX.Element;
