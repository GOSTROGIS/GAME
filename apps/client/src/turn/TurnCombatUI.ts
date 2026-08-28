import type { CombatEventV1, EnemyIntentV1, IntegerPositionMm, TurnPlanAck, TurnPlanRequest } from "@hollow-march/shared";
import {
  EMPTY_TURN_PLAN_DRAFT,
  buildTurnPlanRequest,
  formatCombatEvent,
  localTurnParticipant,
  moveDestination,
  turnActionChoice,
  turnActionChoices,
  turnPhaseLabel,
  turnPlanBudget,
  type TurnActionChoiceId,
  type TurnDraftAction,
  type TurnEncounterProjection,
  type TurnPlanDraft,
  type TurnReactionChoiceId,
} from "./TurnCombatModel.js";
import { turnClientConsumesWorldInput } from "./TurnClientProtocol.js";

export interface TurnCombatUIOptions {
  readonly submitPlan: (request: TurnPlanRequest) => boolean;
  readonly join: (encounterId: string) => boolean;
  readonly withdraw: () => boolean;
  readonly onProjectionChanged?: (projection: TurnEncounterProjection | null, draft: TurnPlanDraft) => void;
  readonly getProtocolError?: () => string | null;
  readonly getPlanAcknowledgement?: () => Readonly<TurnPlanAck> | null;
}

export interface TurnCombatUIController {
  readonly update: (projection: TurnEncounterProjection | null) => void;
  readonly destroy: () => void;
  readonly draft: () => TurnPlanDraft;
}

const isInteractiveTarget = (target: EventTarget | null) => target instanceof HTMLElement && Boolean(target.closest("button, input, select, textarea, a"));
const formatId = (value: string) => value.replaceAll("_", " ").replaceAll(".", " · ");

export function mountTurnCombatUI(host: HTMLElement, options: TurnCombatUIOptions): TurnCombatUIController {
  const title = required<HTMLElement>(host, "#turn-encounter-title");
  const guidance = required<HTMLElement>(host, "#turn-encounter-guidance");
  const phaseState = required<HTMLElement>(host, "#turn-phase-state");
  const choicesHost = required<HTMLElement>(host, "#turn-action-choices");
  const beatsHost = required<HTMLElement>(host, "#turn-beats");
  const targetsHost = required<HTMLElement>(host, "#turn-targets");
  const reactionsHost = required<HTMLElement>(host, "#turn-reactions");
  const intentsHost = required<HTMLElement>(host, "#turn-intents");
  const partyHost = required<HTMLElement>(host, "#turn-party");
  const log = required<HTMLOListElement>(host, "#turn-resolution-log");
  const cursor = required<HTMLElement>(host, "#turn-log-cursor");
  const live = required<HTMLElement>(host, "#turn-live-summary");
  const budgetSummary = required<HTMLElement>(host, "#turn-budget-summary");
  const errors = required<HTMLElement>(host, "#turn-plan-errors");
  const confirm = required<HTMLButtonElement>(host, "#turn-confirm");
  const join = required<HTMLButtonElement>(host, "#turn-join");
  const withdraw = required<HTMLButtonElement>(host, "#turn-withdraw");
  const worldChrome = [...document.querySelectorAll<HTMLElement>(".side-nav, #action-bar, #quest-tracker")];
  const previousInert = new Map<HTMLElement, boolean>();
  let projection: TurnEncounterProjection | null = null;
  let draft: TurnPlanDraft = EMPTY_TURN_PLAN_DRAFT;
  let selectedBeat: 0 | 1 = 0;
  let previousEncounterRound = "";
  let previousLatestSequence = -1;
  let wasVisible = false;
  let submittedPlan: { commandId: string; state: "pending" | "accepted" } | null = null;
  let joinRequestPending = false;

  const setWorldChromeInert = (inert: boolean) => {
    for (const element of worldChrome) {
      if (inert && !previousInert.has(element)) previousInert.set(element, element.inert);
      element.inert = inert ? true : previousInert.get(element) ?? false;
      element.classList.toggle("turn-suppressed", inert);
    }
    if (!inert) previousInert.clear();
  };

  const render = () => {
    if (!projection) {
      host.hidden = true;
      host.removeAttribute("data-turn-state");
      setWorldChromeInert(false);
      options.onProjectionChanged?.(null, draft);
      wasVisible = false;
      return;
    }
    const { publicState: encounter, viewerState: viewer } = projection.state;
    const participant = localTurnParticipant(projection);
    const canEdit = viewer.mode === "participant" && viewer.canPlan && !participant?.ready && (encounter.phase === "forming" || encounter.phase === "planning");
    host.hidden = false;
    host.dataset.turnState = viewer.mode === "participant" ? participant?.ready ? "ready" : encounter.phase : viewer.mode;
    setWorldChromeInert(turnClientConsumesWorldInput(projection.state));
    title.textContent = turnPhaseLabel(projection);
    phaseState.replaceChildren(phasePill(encounter.phase, encounter.round, viewer.mode));
    guidance.textContent = guidanceFor(projection);
    renderChoices(choicesHost, draft, selectedBeat, canEdit, participant);
    renderBeats(beatsHost, draft, selectedBeat, canEdit, participant);
    renderTargeting(targetsHost, projection, draft, selectedBeat, canEdit);
    renderReactions(reactionsHost, projection, draft, canEdit);
    renderIntents(intentsHost, encounter.enemyIntents, encounter.participants);
    renderParty(partyHost, projection);
    renderEvents(log, projection.events);
    cursor.textContent = projection.events.length ? `Cursor ${projection.events.at(-1)!.sequence}` : "No events yet";
    const budget = turnPlanBudget(draft, participant);
    budgetSummary.textContent = `AP ${Math.max(0, 2 - budget.apSpent)}/2 · stamina ${budget.staminaCommitted}+${budget.reactionStamina} reserved · focus ${budget.focusCommitted}`;
    const acknowledgement = options.getPlanAcknowledgement?.() ?? null;
    if (submittedPlan && acknowledgement?.commandId === submittedPlan.commandId) {
      submittedPlan = acknowledgement.accepted ? { ...submittedPlan, state: "accepted" } : null;
    }
    const protocolError = options.getProtocolError?.() ?? null;
    if (protocolError) joinRequestPending = false;
    const issue = protocolError ?? budget.issues[0] ?? null;
    errors.hidden = !issue;
    errors.textContent = issue ?? "";
    confirm.disabled = !canEdit || !budget.valid || draft.beats.every((beat) => beat === null) || submittedPlan !== null;
    confirm.textContent = participant?.ready || submittedPlan?.state === "accepted" ? "Plan committed" : submittedPlan?.state === "pending" ? "Awaiting server" : viewer.mode === "spectator" ? "Spectating" : viewer.mode === "reconnecting" ? "Reconnecting" : encounter.phase === "resolving" ? "Resolving" : "Commit plan";
    const activePlayerCount = encounter.participants.filter(({ team, withdrawn }) => team === "players" && !withdrawn).length;
    if (viewer.mode !== "spectator") joinRequestPending = false;
    const canJoin = viewer.mode === "spectator" && viewer.characterId !== null && !joinRequestPending && (encounter.phase === "forming" || encounter.phase === "planning") && encounter.round === 1 && activePlayerCount < encounter.participantLimit;
    join.hidden = viewer.mode !== "spectator";
    join.disabled = !canJoin;
    join.textContent = joinRequestPending ? "Joining…" : canJoin ? "Join encounter" : "Joining closed";
    join.setAttribute("aria-label", joinRequestPending ? "Waiting for the server to join this encounter" : canJoin ? "Join this encounter as a participant" : "Joining closed for this encounter");
    withdraw.hidden = !viewer.canWithdraw;
    withdraw.disabled = !viewer.canWithdraw;
    const latest = projection.events.at(-1);
    if (latest && latest.sequence > previousLatestSequence) {
      previousLatestSequence = latest.sequence;
      live.textContent = `${latest.band ? `${latest.band} band. ` : ""}${formatCombatEvent(latest)}`;
    } else if (!wasVisible) live.textContent = `${turnPhaseLabel(projection)}. Round ${encounter.round}.`;
    options.onProjectionChanged?.(projection, draft);
    if (!wasVisible) requestAnimationFrame(() => title.focus({ preventScroll: true }));
    wasVisible = true;
  };

  const update = (next: TurnEncounterProjection | null) => {
    projection = next;
    const encounterRound = next ? `${next.state.publicState.encounterId}:${next.state.publicState.round}` : "";
    if (encounterRound !== previousEncounterRound) {
      draft = EMPTY_TURN_PLAN_DRAFT;
      selectedBeat = 0;
      submittedPlan = null;
      joinRequestPending = false;
      previousEncounterRound = encounterRound;
    }
    render();
  };

  const click = (event: Event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>("button");
    if (!button || !projection) return;
    if (button.dataset.turnBeat) {
      selectedBeat = Number(button.dataset.turnBeat) === 1 ? 1 : 0;
      render(); return;
    }
    if (button.dataset.turnAction) {
      chooseAction(button.dataset.turnAction as TurnActionChoiceId);
      return;
    }
    if (button.dataset.turnTarget) {
      setTarget(button.dataset.turnTarget);
      return;
    }
    if (button.dataset.turnDirection) {
      setDirection(button.dataset.turnDirection as "north" | "east" | "south" | "west", button.dataset.turnDirectionContext === "reaction" ? "reaction" : "action");
      return;
    }
    if (button.dataset.turnReaction) {
      setReaction(button.dataset.turnReaction as TurnReactionChoiceId);
      return;
    }
    if (button === confirm) commitPlan();
    if (button === join) {
      if (!options.join(projection.state.publicState.encounterId)) showLocalError("The server did not accept the join command.");
      else { joinRequestPending = true; render(); }
    }
    if (button === withdraw) {
      if (!options.withdraw()) showLocalError("The server did not accept the withdrawal command.");
    }
  };

  const chooseAction = (choiceId: TurnActionChoiceId) => {
    if (!projection?.state.viewerState.canPlan) return;
    const participant = localTurnParticipant(projection);
    if (!participant) return;
    const choice = turnActionChoice(choiceId, participant);
    if (!choice.definitionId) {
      showLocalError(choice.unavailableReason ?? `${choice.label} is not available in the authenticated loadout.`);
      return;
    }
    const hostile = projection.state.publicState.participants.find(({ team, health }) => team === "enemies" && health > 0)?.actorId;
    const threatenedActorIds = new Set(projection.state.publicState.enemyIntents.flatMap((intent) => intent.target.kind === "actor" ? intent.target.actorIds : []));
    const ally = projection.state.publicState.participants.find(({ actorId, team, health }) => team === participant.team && actorId !== participant.actorId && health > 0
      && (participant.activeTechniqueId !== "technique.guard.shelter_step" || threatenedActorIds.has(actorId)))?.actorId;
    const action: TurnDraftAction = {
      choiceId,
      ...(choice.target === "hostile" && hostile ? { targetActorId: hostile } : {}),
      ...(choice.target === "ally" && ally ? { targetActorId: ally } : {}),
      ...(choice.target === "destination" ? { destinationMm: moveDestination(participant.positionMm, "north"), destinationYawTenThousandthRadians: 0 } : {}),
    };
    draft = choice.apCost === 2
      ? Object.freeze({ beats: Object.freeze([action, null] as const), reaction: draft.reaction, ...(draft.reactionDestinationMm ? { reactionDestinationMm: draft.reactionDestinationMm, reactionDestinationYawTenThousandthRadians: draft.reactionDestinationYawTenThousandthRadians ?? 0 } : {}) })
      : replaceBeat(draft, selectedBeat, action, participant);
    render();
  };

  const setTarget = (actorId: string) => {
    const action = draft.beats[selectedBeat];
    const participant = projection ? localTurnParticipant(projection) : null;
    if (!action || !participant) return;
    draft = replaceBeat(draft, selectedBeat, Object.freeze({ ...action, targetActorId: actorId }), participant);
    render();
  };

  const setDirection = (direction: "north" | "east" | "south" | "west", destinationKind: "action" | "reaction") => {
    if (!projection) return;
    const participant = localTurnParticipant(projection);
    if (!participant) return;
    if (destinationKind === "reaction" && draft.reaction === "dodge") {
      draft = Object.freeze({ ...draft, reactionDestinationMm: moveDestination(participant.positionMm, direction, 3_000), reactionDestinationYawTenThousandthRadians: yawForDirection(direction) });
    } else {
      const action = draft.beats[selectedBeat];
      if (!action || action.choiceId !== "move") return;
      draft = replaceBeat(draft, selectedBeat, Object.freeze({ ...action, destinationMm: moveDestination(participant.positionMm, direction), destinationYawTenThousandthRadians: yawForDirection(direction) }), participant);
    }
    render();
  };

  const setReaction = (reaction: TurnReactionChoiceId) => {
    if (!projection?.state.viewerState.canPlan) return;
    const participant = localTurnParticipant(projection);
    if (!participant) return;
    draft = reaction === "dodge"
      ? Object.freeze({ ...draft, reaction, reactionDestinationMm: moveDestination(participant.positionMm, "south", 3_000), reactionDestinationYawTenThousandthRadians: yawForDirection("south") })
      : Object.freeze({ beats: draft.beats, reaction });
    render();
  };

  const commitPlan = () => {
    if (!projection || submittedPlan) return;
    try {
      const request = buildTurnPlanRequest(projection, draft, crypto.randomUUID());
      if (!options.submitPlan(request)) showLocalError("The plan could not be sent to the authoritative room.");
      else {
        submittedPlan = { commandId: request.commandId, state: "pending" };
        confirm.disabled = true;
        confirm.textContent = "Awaiting server";
        live.textContent = "Plan sent. Waiting for authoritative acknowledgement.";
      }
    } catch (error) { showLocalError(error instanceof Error ? error.message : String(error)); }
  };

  const showLocalError = (message: string) => { errors.textContent = message; errors.hidden = false; live.textContent = message; };

  const keydown = (event: KeyboardEvent) => {
    if (!projection || host.hidden || !turnClientConsumesWorldInput(projection.state)) return;
    const key = event.key.toLowerCase();
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " ", "f", "r", "q", "e", "i", "k", "j", "m", "b", "c", "escape"].includes(key)) {
      event.preventDefault(); event.stopImmediatePropagation();
      return;
    }
    if (isInteractiveTarget(event.target)) return;
    const number = Number(key);
    const choices = turnActionChoices(localTurnParticipant(projection));
    if (Number.isInteger(number) && number >= 1 && number <= choices.length) {
      event.preventDefault(); event.stopImmediatePropagation(); chooseAction(choices[number - 1]!.id); return;
    }
    if (key === "[") { event.preventDefault(); selectedBeat = 0; render(); }
    if (key === "]") { event.preventDefault(); selectedBeat = 1; render(); }
    if (key === "g") { event.preventDefault(); setReaction("guard"); }
    if (key === "v") { event.preventDefault(); setReaction("dodge"); }
    if (key === "x" && projection.state.viewerState.canWithdraw) { event.preventDefault(); options.withdraw(); }
    if (key === "enter") { event.preventDefault(); commitPlan(); }
    if (key === "l") { event.preventDefault(); log.focus({ preventScroll: true }); }
  };

  host.addEventListener("click", click);
  addEventListener("keydown", keydown, { capture: true });
  return {
    update,
    draft: () => draft,
    destroy: () => {
      host.removeEventListener("click", click);
      removeEventListener("keydown", keydown, { capture: true });
      projection = null;
      render();
    },
  };
}

function replaceBeat(draft: TurnPlanDraft, beat: 0 | 1, action: TurnDraftAction | null, participant: TurnEncounterProjection["state"]["participantState"]): TurnPlanDraft {
  const beats: [TurnDraftAction | null, TurnDraftAction | null] = [draft.beats[0], draft.beats[1]];
  beats[beat] = action;
  if (beat === 1 && beats[0] && turnActionChoice(beats[0].choiceId, participant).apCost === 2) beats[0] = null;
  return Object.freeze({ ...draft, beats: Object.freeze(beats) });
}

function required<T extends Element>(host: HTMLElement, selector: string): T {
  const element = host.querySelector<T>(selector);
  if (!element) throw new Error(`Turn combat UI requires ${selector}`);
  return element;
}

function phasePill(phase: string, round: number, viewerMode: string) {
  const element = document.createElement("p");
  element.className = "turn-phase-pill";
  element.dataset.phase = phase;
  element.textContent = `${viewerMode === "spectator" ? "Spectator · " : viewerMode === "reconnecting" ? "Reconnecting · " : ""}Round ${round} · ${formatId(phase)}`;
  return element;
}

function guidanceFor({ state: { publicState: encounter, viewerState: viewer } }: TurnEncounterProjection) {
  if (viewer.mode === "spectator") {
    const activePlayers = encounter.participants.filter(({ team, withdrawn }) => team === "players" && !withdrawn).length;
    const canJoin = viewer.characterId !== null && (encounter.phase === "forming" || encounter.phase === "planning") && encounter.round === 1 && activePlayers < encounter.participantLimit;
    return canJoin
      ? "Spectating in real time. You may join before the first round locks; until then you cannot target, collide with, or modify leased enemies."
      : "Read-only view. Participants remain visible, but spectators cannot target, collide with, or modify leased enemies.";
  }
  if (viewer.mode === "reconnecting") return "Restoring your authenticated participant, accepted plan, acknowledgements, and event cursor.";
  if (encounter.phase === "forming") return "Up to four authenticated characters may join before the first round locks.";
  if (encounter.phase === "planning") return "Choose two beats and one optional reaction. Ready cannot be reversed this round.";
  if (encounter.phase === "locked") return "All plans are locked. The server is preparing deterministic resolution.";
  if (encounter.phase === "resolving") return "Authoritative events are resolving in band order. Inputs cannot change their order.";
  if (encounter.phase === "settling") return "Victory remains unsettled until rewards and ledgers commit transactionally.";
  if (encounter.phase === "victory") return "Victory is recorded. The authoritative reward result is final.";
  if (encounter.phase === "defeat") return "The encounter ended in defeat. No shared-world rewards are granted.";
  return "The encounter was aborted and the original enemy lease snapshot is restored.";
}

function renderChoices(host: HTMLElement, draft: TurnPlanDraft, selectedBeat: 0 | 1, enabled: boolean, participant: TurnEncounterProjection["state"]["participantState"]) {
  host.replaceChildren(...turnActionChoices(participant).map((choice, index) => {
    const button = document.createElement("button");
    button.type = "button"; button.dataset.turnAction = choice.id; button.disabled = !enabled;
    button.className = draft.beats[selectedBeat]?.choiceId === choice.id ? "selected" : "";
    button.setAttribute("aria-pressed", String(draft.beats[selectedBeat]?.choiceId === choice.id));
    const key = document.createElement("kbd"); key.textContent = String(index + 1);
    const label = document.createElement("strong"); label.textContent = choice.label;
    const cost = document.createElement("span"); cost.textContent = `${choice.apCost} AP · ${choice.staminaCost} stamina${choice.focusCost ? ` · ${choice.focusCost} focus` : ""}`;
    const description = document.createElement("small"); description.textContent = choice.unavailableReason ?? choice.description;
    if (!choice.definitionId) { button.setAttribute("aria-disabled", "true"); button.setAttribute("aria-label", `${choice.label}. Unavailable. ${description.textContent}`); }
    button.append(key, label, cost, description); return button;
  }));
}

function renderBeats(host: HTMLElement, draft: TurnPlanDraft, selectedBeat: 0 | 1, enabled: boolean, participant: TurnEncounterProjection["state"]["participantState"]) {
  host.replaceChildren(...([0, 1] as const).map((beat) => {
    const button = document.createElement("button"); button.type = "button"; button.dataset.turnBeat = String(beat); button.disabled = !enabled;
    button.className = selectedBeat === beat ? "selected" : ""; button.setAttribute("aria-pressed", String(selectedBeat === beat));
    const label = document.createElement("span"); label.textContent = `Beat ${beat + 1}`;
    const action = document.createElement("strong"); action.textContent = draft.beats[beat] ? turnActionChoice(draft.beats[beat]!.choiceId, participant).label : "Unassigned";
    button.append(label, action); return button;
  }));
}

function renderTargeting(host: HTMLElement, projection: TurnEncounterProjection, draft: TurnPlanDraft, selectedBeat: 0 | 1, enabled: boolean) {
  const action = draft.beats[selectedBeat];
  if (!action) { host.replaceChildren(); return; }
  const choice = turnActionChoice(action.choiceId, localTurnParticipant(projection));
  const heading = document.createElement("p"); heading.className = "turn-target-label"; heading.textContent = choice.target === "destination" ? "Projected path destination" : "Action target";
  if (choice.target === "destination") {
    host.replaceChildren(heading, directionControls(enabled, action.destinationMm, "action")); return;
  }
  if (choice.target === "hostile" || choice.target === "ally") {
    const participant = localTurnParticipant(projection);
    const desiredTeam = choice.target === "hostile" ? participant?.team === "players" ? "enemies" : "players" : participant?.team;
    const threatenedActorIds = new Set(projection.state.publicState.enemyIntents.flatMap((intent) => intent.target.kind === "actor" ? intent.target.actorIds : []));
    const controls = document.createElement("div"); controls.className = "turn-target-list";
    const targets = projection.state.publicState.participants.filter(({ actorId, team, health }) => team === desiredTeam && health > 0
      && (choice.target !== "ally" || actorId !== participant?.actorId)
      && (choice.id !== "technique" || participant?.activeTechniqueId !== "technique.guard.shelter_step" || threatenedActorIds.has(actorId)));
    for (const target of targets) {
      const button = document.createElement("button"); button.type = "button"; button.dataset.turnTarget = target.actorId; button.disabled = !enabled;
      button.className = action.targetActorId === target.actorId ? "selected" : ""; button.setAttribute("aria-pressed", String(action.targetActorId === target.actorId));
      button.textContent = `${formatId(target.characterId ?? target.actorId)} · ${target.health}/${target.maxHealth} health`; controls.append(button);
    }
    if (targets.length === 0) { const empty = document.createElement("p"); empty.textContent = choice.target === "ally" ? "No eligible threatened ally is disclosed." : "No eligible target."; controls.append(empty); }
    host.replaceChildren(heading, controls); return;
  }
  const target = document.createElement("p"); target.textContent = choice.target === "self" ? "Self" : "No target"; host.replaceChildren(heading, target);
}

function directionControls(enabled: boolean, selected: IntegerPositionMm | undefined, destinationKind: "action" | "reaction") {
  const controls = document.createElement("div"); controls.className = "turn-direction-grid"; controls.setAttribute("aria-label", "Destination direction");
  for (const [direction, glyph] of [["north", "North ↑"], ["west", "West ←"], ["east", "East →"], ["south", "South ↓"]] as const) {
    const button = document.createElement("button"); button.type = "button"; button.dataset.turnDirection = direction; button.dataset.turnDirectionContext = destinationKind; button.disabled = !enabled; button.textContent = glyph; controls.append(button);
  }
  if (selected) { const coordinates = document.createElement("output"); coordinates.textContent = `${(selected.x / 1_000).toFixed(1)}E · ${(selected.z / 1_000).toFixed(1)}S`; controls.append(coordinates); }
  return controls;
}

function renderReactions(host: HTMLElement, projection: TurnEncounterProjection, draft: TurnPlanDraft, enabled: boolean) {
  const controls = document.createElement("div"); controls.className = "turn-reaction-list";
  const choices: readonly [TurnReactionChoiceId, string, string][] = [["none", "None", "No stamina reserved"], ["dodge", "Dodge", "24 stamina · up to 3 m"], ["guard", "Guard", "8 stamina · up to 50% mitigation"]];
  for (const [id, label, detail] of choices) {
    const button = document.createElement("button"); button.type = "button"; button.dataset.turnReaction = id; button.disabled = !enabled;
    button.className = draft.reaction === id ? "selected" : ""; button.setAttribute("aria-pressed", String(draft.reaction === id));
    const strong = document.createElement("strong"); strong.textContent = label; const small = document.createElement("small"); small.textContent = detail; button.append(strong, small); controls.append(button);
  }
  const children: Node[] = [controls];
  if (draft.reaction === "dodge") children.push(directionControls(enabled, draft.reactionDestinationMm, "reaction"));
  const note = document.createElement("p"); note.textContent = "An untriggered reservation is refunded by the authoritative resolver."; children.push(note);
  host.replaceChildren(...children);
}

function renderIntents(host: HTMLElement, intents: readonly EnemyIntentV1[], participants: TurnEncounterProjection["state"]["publicState"]["participants"]) {
  if (!intents.length) { const empty = document.createElement("p"); empty.className = "turn-empty"; empty.textContent = "No hostile intent is currently disclosed."; host.replaceChildren(empty); return; }
  host.replaceChildren(...intents.map((intent) => {
    const article = document.createElement("article"); article.className = "turn-intent";
    const actor = participants.find(({ actorId }) => actorId === intent.actorId);
    const heading = document.createElement("h4"); heading.textContent = formatId(actor?.characterId ?? intent.actorId);
    const band = document.createElement("span"); band.textContent = `${formatId(intent.band)} band`;
    const target = document.createElement("p"); target.textContent = intent.target.kind === "actor" ? `Target: ${intent.target.actorIds.map(formatId).join(", ")}` : `Area: ${(intent.target.radiusMm / 1_000).toFixed(1)} m radius at ${(intent.target.centerMm.x / 1_000).toFixed(1)}E, ${(intent.target.centerMm.z / 1_000).toFixed(1)}S`;
    const damage = document.createElement("p"); damage.textContent = intent.exactDamageKnown && intent.damageBand[0] === intent.damageBand[1] ? `Damage: ${intent.damageBand[0]}` : `Damage band: ${intent.damageBand[0]}–${intent.damageBand[1]}`;
    const status = document.createElement("p"); status.textContent = `Statuses: ${intent.statusIcons.length ? intent.statusIcons.map(formatId).join(", ") : "none"}`;
    const cue = document.createElement("p"); cue.textContent = `Cue: ${intent.sensoryCue}`;
    const interrupt = document.createElement("p"); interrupt.textContent = `Interrupt: ${intent.interruptRule}`;
    article.append(heading, band, target, damage, status, cue, interrupt); return article;
  }));
}

function renderParty(host: HTMLElement, projection: TurnEncounterProjection) {
  const { publicState, viewerState } = projection.state;
  const list = document.createElement("ul");
  for (const member of publicState.participants.filter(({ team }) => team === "players")) {
    const item = document.createElement("li");
    const label = document.createElement("strong"); label.textContent = formatId(member.characterId ?? member.actorId);
    const states = [member.actorId === publicState.leaderActorId ? "leader" : null, member.withdrawn ? "withdrawn" : member.ready ? "ready" : "planning", member.connected ? "connected" : "reconnecting"].filter(Boolean);
    const detail = document.createElement("span"); detail.textContent = states.join(" · "); item.append(label, detail); list.append(item);
  }
  if (viewerState.mode === "spectator") { const note = document.createElement("p"); note.textContent = "Spectator · read only"; host.replaceChildren(note, list); }
  else if (viewerState.mode === "reconnecting") { const note = document.createElement("p"); note.textContent = "Reconnecting · plan input suspended"; host.replaceChildren(note, list); }
  else host.replaceChildren(list);
}

function renderEvents(host: HTMLOListElement, events: readonly CombatEventV1[]) {
  const nearBottom = host.scrollHeight - host.scrollTop - host.clientHeight < 32;
  host.replaceChildren(...events.map((event) => {
    const item = document.createElement("li"); item.dataset.eventSequence = String(event.sequence);
    const meta = document.createElement("span"); meta.textContent = `#${event.sequence}${event.band ? ` · ${formatId(event.band)}` : ""}`;
    const text = document.createElement("p"); text.textContent = formatCombatEvent(event); item.append(meta, text); return item;
  }));
  if (nearBottom) host.scrollTop = host.scrollHeight;
}

const yawForDirection = (direction: "north" | "east" | "south" | "west") => ({ north: 31_416, east: 15_708, south: 0, west: -15_708 }[direction]);
