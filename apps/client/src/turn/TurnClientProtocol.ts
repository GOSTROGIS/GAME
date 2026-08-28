import {
  NETWORK_PROTOCOL_VERSION,
  codeUnitCompare,
  validateTurnEncounterJoinRequest,
  validateTurnEncounterStartRequest,
  validateTurnEncounterWithdrawRequest,
  type EncounterClientStateV1,
  type TurnEncounterJoinRequest,
  type TurnEncounterStartRequest,
  type TurnEncounterWithdrawRequest,
} from "@hollow-march/shared";

export function buildTurnEncounterStartRequest(characterId: string, enemyActorIds: readonly string[], commandId: string): TurnEncounterStartRequest {
  const request: TurnEncounterStartRequest = { protocolVersion: NETWORK_PROTOCOL_VERSION, commandId, characterId, enemyActorIds: Object.freeze([...enemyActorIds].sort(codeUnitCompare)) };
  validateTurnEncounterStartRequest(request);
  return Object.freeze(request);
}

export function buildTurnEncounterJoinRequest(characterId: string, encounterId: string, commandId: string): TurnEncounterJoinRequest {
  const request: TurnEncounterJoinRequest = { protocolVersion: NETWORK_PROTOCOL_VERSION, commandId, characterId, encounterId };
  validateTurnEncounterJoinRequest(request);
  return Object.freeze(request);
}

export function buildTurnEncounterWithdrawRequest(characterId: string, encounterId: string, commandId: string): TurnEncounterWithdrawRequest {
  const request: TurnEncounterWithdrawRequest = { protocolVersion: NETWORK_PROTOCOL_VERSION, commandId, characterId, encounterId };
  validateTurnEncounterWithdrawRequest(request);
  return Object.freeze(request);
}

export function turnClientConsumesWorldInput(state: EncounterClientStateV1 | null): boolean {
  return state !== null && state.viewerState.mode !== "spectator" && !["victory", "defeat", "aborted"].includes(state.publicState.phase);
}

export function turnClientInputEnabled(requested: boolean, state: EncounterClientStateV1 | null, visible: boolean, focused: boolean): boolean {
  return requested && visible && focused && !turnClientConsumesWorldInput(state);
}
