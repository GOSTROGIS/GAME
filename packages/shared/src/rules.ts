import type { ActionCommand, InputFrame, WorldTransform } from "./contracts.js";
import { WORLD_MAX_COORDINATE_METERS } from "./contracts.js";

export const SIMULATION_HZ = 30;
export const PATCH_HZ = 20;
export const WALK_SPEED_METERS_PER_SECOND = 4.2;
export const SPRINT_SPEED_METERS_PER_SECOND = 6.5;
export const MAX_INPUTS_PER_SECOND = 45;
export const MAX_ACTIONS_PER_SECOND = 12;

export const ACTION_TIMINGS = {
  light_attack: { windupTicks: 7, impactTicks: 8, recoveryTicks: 12, range: 2.5 },
  heavy_attack: { windupTicks: 15, impactTicks: 16, recoveryTicks: 27, range: 2.8 },
  dodge: { windupTicks: 0, impactTicks: 0, recoveryTicks: 16, range: 0 },
  interact: { windupTicks: 0, impactTicks: 1, recoveryTicks: 5, range: 3.2 },
  gather: { windupTicks: 12, impactTicks: 13, recoveryTicks: 35, range: 3 },
  craft: { windupTicks: 20, impactTicks: 21, recoveryTicks: 60, range: 0 },
} as const;

export function simulateMovement(transform: WorldTransform, input: InputFrame, deltaSeconds: number): WorldTransform {
  const length = Math.hypot(input.moveX, input.moveZ);
  const divisor = Math.max(1, length);
  const speed = input.sprint ? SPRINT_SPEED_METERS_PER_SECOND : WALK_SPEED_METERS_PER_SECOND;
  const safeDelta = Math.max(0, Math.min(0.1, deltaSeconds));
  return {
    x: Math.max(0, Math.min(WORLD_MAX_COORDINATE_METERS, transform.x + input.moveX / divisor * speed * safeDelta)),
    y: transform.y,
    z: Math.max(0, Math.min(WORLD_MAX_COORDINATE_METERS, transform.z + input.moveZ / divisor * speed * safeDelta)),
    yaw: input.yaw,
  };
}

export function distanceSquared(a: WorldTransform, b: WorldTransform): number {
  const x = a.x - b.x; const y = a.y - b.y; const z = a.z - b.z;
  return x * x + y * y + z * z;
}

export function actionTiming(command: ActionCommand, serverTick: number) {
  const timing = ACTION_TIMINGS[command.kind];
  return { impactTick: serverTick + timing.impactTicks, recoveryEndsTick: serverTick + timing.recoveryTicks, range: timing.range };
}

export class SequenceGate {
  #last = -1;
  accept(sequence: number): boolean {
    if (!Number.isSafeInteger(sequence) || sequence <= this.#last) return false;
    this.#last = sequence;
    return true;
  }
  get last(): number { return this.#last; }
}
