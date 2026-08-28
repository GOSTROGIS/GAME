import {
  NETWORK_PROTOCOL_VERSION,
  type CombatEventV1,
  type EncounterClientStateV1,
  type EncounterParticipantState,
  type IntegerPositionMm,
  type TurnActionSelectionV1,
  type TurnBeat,
  type TurnPlanRequest,
  type TurnReactionSelectionV1,
} from "@hollow-march/shared";

export type TurnActionChoiceId = "move" | "light_attack" | "heavy_attack" | "technique" | "item" | "recover" | "hold";
export type TurnReactionChoiceId = "none" | "dodge" | "guard";

export interface TurnActionChoice {
  readonly id: TurnActionChoiceId;
  readonly definitionId: string | null;
  readonly label: string;
  readonly description: string;
  readonly apCost: 0 | 1 | 2;
  readonly staminaCost: number;
  readonly focusCost: number;
  readonly target: "destination" | "hostile" | "ally" | "self" | "none";
  readonly unavailableReason?: string;
}

type EquippedTechniqueChoice = Omit<TurnActionChoice, "id" | "definitionId">;

/** Checked client presentation metadata for the six canonical server techniques. */
export const EQUIPPED_TECHNIQUE_CHOICES: Readonly<Record<string, EquippedTechniqueChoice>> = Object.freeze({
  "technique.swordsmanship.severing_riposte": { label: "Severing Riposte", description: "Preempt the hostile intent source with an interrupting sword cut.", apCost: 1, staminaCost: 16, focusCost: 0, target: "hostile" },
  "technique.heavy_arms.bellfall": { label: "Bellfall", description: "Commit both beats to a staggering heavy-arms impact.", apCost: 2, staminaCost: 32, focusCost: 0, target: "hostile" },
  "technique.marksmanship.threaded_volley": { label: "Threaded Volley", description: "Mark a hostile in line of sight with a measured volley.", apCost: 1, staminaCost: 18, focusCost: 0, target: "hostile" },
  "technique.guard.shelter_step": { label: "Shelter Step", description: "Give a threatened ally 25% damage ward for the remaining bands of this round.", apCost: 1, staminaCost: 12, focusCost: 0, target: "ally" },
  "technique.vitality.second_wind": { label: "Second Wind", description: "Restore your own vitality during aftermath.", apCost: 1, staminaCost: 0, focusCost: 0, target: "self" },
  "technique.hexcraft.counter_name": { label: "Counter-Name", description: "Spend focus to silence and interrupt a hostile casting intent.", apCost: 2, staminaCost: 8, focusCost: 18, target: "hostile" },
});

export const TURN_ACTION_CHOICES: readonly TurnActionChoice[] = Object.freeze([
  { id: "move", definitionId: "action.move", label: "Move", description: "Travel up to four meters through the authoritative encounter navigation.", apCost: 1, staminaCost: 8, focusCost: 0, target: "destination" },
  { id: "light_attack", definitionId: "action.light_attack", label: "Light attack", description: "A committed weapon strike against one hostile actor.", apCost: 1, staminaCost: 14, focusCost: 0, target: "hostile" },
  { id: "heavy_attack", definitionId: "action.heavy_attack", label: "Heavy attack", description: "Occupies both beats and resolves once in its authored band.", apCost: 2, staminaCost: 28, focusCost: 0, target: "hostile" },
  { id: "technique", definitionId: null, label: "Technique", description: "Use the active technique in the authenticated primary slot.", apCost: 1, staminaCost: 0, focusCost: 0, target: "none", unavailableReason: "No authenticated active technique is equipped." },
  { id: "item", definitionId: null, label: "Item", description: "Use an authenticated quick-slot item; it is consumed only if its effect resolves.", apCost: 1, staminaCost: 0, focusCost: 0, target: "self", unavailableReason: "Unavailable until the server provides an authenticated quick-slot item and charge count." },
  { id: "recover", definitionId: "action.recover", label: "Recover", description: "Restore thirty percent maximum stamina; once per round.", apCost: 1, staminaCost: 0, focusCost: 0, target: "self" },
  { id: "hold", definitionId: "action.hold", label: "Hold", description: "Take no action during this beat.", apCost: 0, staminaCost: 0, focusCost: 0, target: "none" },
]);

export interface TurnDraftAction {
  readonly choiceId: TurnActionChoiceId;
  readonly targetActorId?: string;
  readonly destinationMm?: IntegerPositionMm;
  readonly destinationYawTenThousandthRadians?: number;
}

export interface TurnPlanDraft {
  readonly beats: Readonly<[TurnDraftAction | null, TurnDraftAction | null]>;
  readonly reaction: TurnReactionChoiceId;
  readonly reactionDestinationMm?: IntegerPositionMm;
  readonly reactionDestinationYawTenThousandthRadians?: number;
}

export const EMPTY_TURN_PLAN_DRAFT: TurnPlanDraft = Object.freeze({
  beats: Object.freeze([null, null] as const),
  reaction: "none",
});

export interface TurnPlanBudget {
  readonly apSpent: number;
  readonly staminaCommitted: number;
  readonly focusCommitted: number;
  readonly reactionStamina: number;
  readonly valid: boolean;
  readonly issues: readonly string[];
}

export interface TurnEncounterProjection {
  readonly state: EncounterClientStateV1;
  readonly events: readonly CombatEventV1[];
}

const actionChoiceById = new Map(TURN_ACTION_CHOICES.map((choice) => [choice.id, choice]));

export function turnActionChoices(participant: EncounterParticipantState | null): readonly TurnActionChoice[] {
  const technique = participant?.activeTechniqueId ? EQUIPPED_TECHNIQUE_CHOICES[participant.activeTechniqueId] : undefined;
  const quickItemAvailable = participant?.quickItemId === "mending_draught" && (participant.itemCharges.mending_draught ?? 0) > 0;
  return Object.freeze(TURN_ACTION_CHOICES.map((choice) => {
    if (choice.id === "technique") return technique
      ? Object.freeze({ id: "technique" as const, definitionId: "technique.equipped.primary", ...technique })
      : choice;
    if (choice.id === "item") return quickItemAvailable
      ? Object.freeze({ id: "item" as const, definitionId: "item.equipped.quick", label: "Mending Draught", description: `Use the equipped draught; ${participant!.itemCharges.mending_draught} charge${participant!.itemCharges.mending_draught === 1 ? "" : "s"} remain.`, apCost: 1 as const, staminaCost: 0, focusCost: 0, target: "self" as const })
      : choice;
    return choice;
  }));
}

export const turnActionChoice = (choiceId: TurnActionChoiceId, participant: EncounterParticipantState | null = null): TurnActionChoice => (
  turnActionChoices(participant).find(({ id }) => id === choiceId) ?? actionChoiceById.get(choiceId)!
);

export function localTurnParticipant(projection: TurnEncounterProjection): EncounterParticipantState | null {
  return projection.state.participantState;
}

export function turnPlanBudget(draft: TurnPlanDraft, participant: EncounterParticipantState | null): TurnPlanBudget {
  const issues: string[] = [];
  let apSpent = 0;
  let staminaCommitted = 0;
  let focusCommitted = 0;
  let recoverCount = 0;
  const heavy = draft.beats.some((action) => action?.choiceId === "heavy_attack");
  for (const action of draft.beats) {
    if (!action) continue;
    const choice = turnActionChoice(action.choiceId, participant);
    if (!choice.definitionId) issues.push(`${choice.label} is unavailable: ${choice.unavailableReason ?? "no authoritative definition was provided"}`);
    apSpent += choice.apCost;
    staminaCommitted += choice.staminaCost;
    focusCommitted += choice.focusCost;
    if (choice.id === "recover") recoverCount += 1;
    if ((choice.target === "hostile" || choice.target === "ally") && !action.targetActorId) issues.push(`${choice.label} requires ${choice.target === "hostile" ? "a hostile" : "an allied"} target.`);
    if (choice.target === "destination" && !action.destinationMm) issues.push("Move requires a destination.");
  }
  if (heavy && draft.beats.filter(Boolean).length !== 1) issues.push("Heavy attack occupies both beats.");
  if (apSpent > 2) issues.push("A plan cannot spend more than two action points.");
  if (recoverCount > 1) issues.push("Recover may be used only once per round.");
  const reactionStamina = draft.reaction === "dodge" ? 24 : draft.reaction === "guard" ? 8 : 0;
  if (draft.reaction === "dodge" && !draft.reactionDestinationMm) issues.push("Dodge requires a reserved destination.");
  if (participant) {
    if (staminaCommitted + reactionStamina > participant.stamina) issues.push("The plan and reaction reserve exceed current stamina.");
    if (focusCommitted > participant.focus) issues.push("The plan exceeds current focus.");
  }
  return Object.freeze({ apSpent, staminaCommitted, focusCommitted, reactionStamina, valid: issues.length === 0, issues: Object.freeze(issues) });
}

const selectionId = (commandId: string, beat: TurnBeat, choiceId: TurnActionChoiceId) => `selection.${commandId}.${beat}.${choiceId}`;

export function buildTurnPlanRequest(
  projection: TurnEncounterProjection,
  draft: TurnPlanDraft,
  commandId: string,
): TurnPlanRequest {
  const participant = localTurnParticipant(projection);
  if (!participant || participant.team !== "players" || !participant.characterId) throw new Error("Only an authenticated encounter participant may submit a plan.");
  if (!projection.state.viewerState.canPlan || projection.state.viewerState.mode !== "participant") throw new Error("The current encounter view cannot submit a plan.");
  if (projection.state.publicState.phase !== "planning" && projection.state.publicState.phase !== "forming") throw new Error("Plans may be submitted only while the encounter is planning.");
  const budget = turnPlanBudget(draft, participant);
  if (!budget.valid) throw new Error(budget.issues[0]);
  const actions: TurnActionSelectionV1[] = [];
  for (let beat = 0 as TurnBeat; beat <= 1; beat = (beat + 1) as TurnBeat) {
    const draftAction = draft.beats[beat];
    if (!draftAction) continue;
    const choice = turnActionChoice(draftAction.choiceId, participant);
    if (!choice.definitionId) throw new Error(`${choice.label} cannot be submitted without an authoritative definition.`);
    const action: TurnActionSelectionV1 = {
      selectionId: selectionId(commandId, beat, draftAction.choiceId),
      actionDefinitionId: choice.definitionId,
      beat,
      ...((choice.target === "hostile" || choice.target === "ally") && draftAction.targetActorId ? { targetActorId: draftAction.targetActorId } : {}),
      ...(draftAction.destinationMm ? {
        destinationMm: draftAction.destinationMm,
        destinationYawTenThousandthRadians: draftAction.destinationYawTenThousandthRadians ?? 0,
      } : {}),
    };
    actions.push(action);
    if (choice.apCost === 2) break;
  }
  const reaction: TurnReactionSelectionV1 | null = draft.reaction === "none" ? null : {
    selectionId: `reaction.${commandId}.${draft.reaction}`,
    reactionDefinitionId: `reaction.${draft.reaction}`,
    ...(draft.reactionDestinationMm ? {
      destinationMm: draft.reactionDestinationMm,
      destinationYawTenThousandthRadians: draft.reactionDestinationYawTenThousandthRadians ?? 0,
    } : {}),
  };
  return {
    protocolVersion: NETWORK_PROTOCOL_VERSION,
    encounterId: projection.state.publicState.encounterId,
    characterId: participant.characterId,
    commandId,
    round: projection.state.publicState.round,
    revision: projection.state.publicState.revision,
    actions,
    reaction,
    ready: true,
  };
}

export function moveDestination(origin: IntegerPositionMm, direction: "north" | "east" | "south" | "west", distanceMm = 4_000): IntegerPositionMm {
  const offsets = { north: [0, -distanceMm], east: [distanceMm, 0], south: [0, distanceMm], west: [-distanceMm, 0] } as const;
  const [x, z] = offsets[direction];
  return Object.freeze({ x: origin.x + x, y: origin.y, z: origin.z + z });
}

export function mergeCombatEvents(existing: readonly CombatEventV1[], incoming: readonly CombatEventV1[], encounterId: string, maximum = 256): readonly CombatEventV1[] {
  const bySequence = new Map<number, CombatEventV1>();
  for (const event of [...existing, ...incoming]) {
    if (event.encounterId !== encounterId) continue;
    const previous = bySequence.get(event.sequence);
    if (previous && JSON.stringify(previous) !== JSON.stringify(event)) throw new Error(`Combat event sequence ${event.sequence} changed during replay.`);
    bySequence.set(event.sequence, event);
  }
  return Object.freeze([...bySequence.values()].sort((left, right) => left.sequence - right.sequence).slice(-maximum));
}

const titleCase = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export function formatCombatEvent(event: CombatEventV1): string {
  const actor = event.actorId ?? "The encounter";
  const target = event.targetActorId ? ` → ${event.targetActorId}` : "";
  const amount = typeof event.data.amount === "number" ? ` for ${event.data.amount}` : "";
  const reason = typeof event.data.reason === "string" ? `: ${event.data.reason.replaceAll("_", " ")}` : "";
  switch (event.type) {
    case "damage_applied": return `${actor}${target} took damage${amount}.`;
    case "healing_applied": return `${actor}${target} restored health${amount}.`;
    case "movement": return `${actor} moved during ${event.band ?? "the turn"}.`;
    case "movement_conflict": return `${actor}'s movement failed${reason}.`;
    case "attack_missed": return `${actor}'s action missed${reason}.`;
    case "actor_interrupted": return `${actor} was interrupted.`;
    case "actor_defeated": return `${actor} was defeated.`;
    case "reaction_triggered": return `${actor} triggered ${String(event.data.kind ?? "a reaction")}.`;
    case "reaction_refunded": return `${actor}'s reserved reaction was refunded.`;
    case "round_started": return `Round ${event.round} began.`;
    case "round_completed": return `Round ${event.round} completed.`;
    case "encounter_outcome": return `Encounter outcome: ${String(event.data.outcome ?? "resolved").replaceAll("_", " ")}.`;
    default: return `${actor}${target}: ${titleCase(event.type)}.`;
  }
}

export function turnPhaseLabel(projection: TurnEncounterProjection): string {
  if (projection.state.viewerState.mode === "spectator") return "Spectating encounter";
  if (projection.state.viewerState.mode === "reconnecting") return "Restoring encounter connection";
  const participant = localTurnParticipant(projection);
  if ((projection.state.publicState.phase === "forming" || projection.state.publicState.phase === "planning") && participant?.ready) return "Ready — plan committed";
  return titleCase(projection.state.publicState.phase);
}
