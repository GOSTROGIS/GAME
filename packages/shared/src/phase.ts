export const PHASES = {
  PUBLIC: 1 << 0,
  HEARTHMERE_UNRESTORED: 1 << 1,
  HEARTHMERE_RESTORED: 1 << 2,
  LAST_BELL_REMEMBERED: 1 << 3,
  LAST_BELL_RELEASED: 1 << 4,
} as const;

export const MAX_PHASE_MASK = 0x7fff_ffff;

export function isPhaseMask(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= MAX_PHASE_MASK;
}

export function composePhaseMask(...phases: number[]): number {
  return phases.reduce((mask, phase) => mask | phase, 0) & MAX_PHASE_MASK;
}

export function phaseVisible(actorMask: number, contentMask: number): boolean {
  return contentMask === 0 || (actorMask & contentMask) !== 0;
}
