import { resolveTurnRound, type TurnKernelInputV1, type TurnKernelResultV1 } from "@hollow-march/shared";

/**
 * Canvas-only local proof result. The shared deterministic kernel is reused for
 * presentation parity, but this type deliberately exposes no persistence or
 * reward callback and can never be promoted to a shared-world settlement.
 */
export interface OfflineCanvasTurnResult {
  readonly authority: "local_prototype";
  readonly renderer: "canvas";
  readonly sharedRewardsEnabled: false;
  readonly durableSettlementEnabled: false;
  readonly result: TurnKernelResultV1;
}

export function resolveOfflineCanvasTurn(input: TurnKernelInputV1): OfflineCanvasTurnResult {
  return Object.freeze({
    authority: "local_prototype",
    renderer: "canvas",
    sharedRewardsEnabled: false,
    durableSettlementEnabled: false,
    result: resolveTurnRound(input),
  });
}

export function assertOfflineCanvasCannotSettleSharedRewards(result: OfflineCanvasTurnResult): void {
  if (result.authority !== "local_prototype" || result.sharedRewardsEnabled !== false || result.durableSettlementEnabled !== false) {
    throw new Error("Offline Canvas turn results cannot settle shared-world rewards.");
  }
}
