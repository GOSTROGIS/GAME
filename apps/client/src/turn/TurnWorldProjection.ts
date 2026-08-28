import type { IntegerPositionMm } from "@hollow-march/shared";
import { localTurnParticipant, type TurnEncounterProjection, type TurnPlanDraft } from "./TurnCombatModel.js";

export interface ProjectedWorldPoint { readonly x: number; readonly y: number; readonly visible: boolean }
export type TurnWorldProjector = (positionMm: IntegerPositionMm) => ProjectedWorldPoint | null;

export type TurnProjectionPrimitive =
  | { readonly kind: "path"; readonly from: IntegerPositionMm; readonly to: IntegerPositionMm; readonly label: string }
  | { readonly kind: "area"; readonly center: IntegerPositionMm; readonly radiusMm: number; readonly label: string }
  | { readonly kind: "target"; readonly position: IntegerPositionMm; readonly label: string; readonly hostile: boolean }
  | { readonly kind: "event"; readonly position: IntegerPositionMm; readonly label: string };

export function buildTurnProjectionPrimitives(projection: TurnEncounterProjection | null, draft: TurnPlanDraft): readonly TurnProjectionPrimitive[] {
  if (!projection) return Object.freeze([]);
  const primitives: TurnProjectionPrimitive[] = [];
  const local = localTurnParticipant(projection);
  if (local) {
    for (const action of draft.beats) {
      if (action?.destinationMm) primitives.push({ kind: "path", from: local.positionMm, to: action.destinationMm, label: action.choiceId === "move" ? "Planned move" : "Planned destination" });
      if (action?.targetActorId) {
        const target = projection.state.publicState.participants.find(({ actorId }) => actorId === action.targetActorId);
        if (target) primitives.push({ kind: "target", position: target.positionMm, label: "Planned target", hostile: target.team !== local.team });
      }
    }
    if (draft.reaction === "dodge" && draft.reactionDestinationMm) primitives.push({ kind: "path", from: local.positionMm, to: draft.reactionDestinationMm, label: "Reserved dodge" });
  }
  for (const intent of projection.state.publicState.enemyIntents) {
    if (intent.target.kind === "area") primitives.push({ kind: "area", center: intent.target.centerMm, radiusMm: intent.target.radiusMm, label: `${intent.band} intent area` });
    else for (const actorId of intent.target.actorIds) {
      const target = projection.state.publicState.participants.find((participant) => participant.actorId === actorId);
      if (target) primitives.push({ kind: "target", position: target.positionMm, label: `${intent.band} intent target`, hostile: true });
    }
  }
  const latestEvent = projection.events.at(-1);
  if (latestEvent?.targetActorId) {
    const target = projection.state.publicState.participants.find(({ actorId }) => actorId === latestEvent.targetActorId);
    if (target) primitives.push({ kind: "event", position: target.positionMm, label: latestEvent.type.replaceAll("_", " ") });
  }
  return Object.freeze(primitives);
}

export class TurnWorldProjectionCanvas {
  private projection: TurnEncounterProjection | null = null;
  private draft: TurnPlanDraft = { beats: [null, null], reaction: "none" };
  private projector: TurnWorldProjector | null = null;
  private frame = 0;
  private disposed = false;

  constructor(private readonly canvas: HTMLCanvasElement) {}

  setProjector(projector: TurnWorldProjector | null) { this.projector = projector; }

  update(projection: TurnEncounterProjection | null, draft: TurnPlanDraft) {
    this.projection = projection;
    this.draft = draft;
    this.canvas.hidden = projection === null;
    if (projection && !this.frame) this.frame = requestAnimationFrame(this.draw);
    if (!projection) this.clear();
  }

  private draw = () => {
    this.frame = 0;
    if (this.disposed || !this.projection || !this.projector) return;
    const context = this.canvas.getContext("2d");
    if (!context) return;
    const bounds = this.canvas.getBoundingClientRect();
    const pixelRatio = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(bounds.width * pixelRatio));
    const height = Math.max(1, Math.round(bounds.height * pixelRatio));
    if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, bounds.width, bounds.height);
    context.lineWidth = 2;
    context.font = "600 10px Inter, system-ui, sans-serif";
    for (const primitive of buildTurnProjectionPrimitives(this.projection, this.draft)) this.drawPrimitive(context, primitive);
    this.frame = requestAnimationFrame(this.draw);
  };

  private drawPrimitive(context: CanvasRenderingContext2D, primitive: TurnProjectionPrimitive) {
    if (!this.projector) return;
    if (primitive.kind === "path") {
      const from = this.projector(primitive.from); const to = this.projector(primitive.to);
      if (!from?.visible || !to?.visible) return;
      context.save(); context.strokeStyle = "#e4c77e"; context.setLineDash([7, 5]); context.beginPath(); context.moveTo(from.x, from.y); context.lineTo(to.x, to.y); context.stroke(); context.setLineDash([]);
      context.fillStyle = "#e4c77e"; context.beginPath(); context.arc(to.x, to.y, 7, 0, Math.PI * 2); context.stroke(); context.fillText(primitive.label, to.x + 10, to.y - 8); context.restore(); return;
    }
    const position = primitive.kind === "area" ? primitive.center : primitive.position;
    const center = this.projector(position);
    if (!center?.visible) return;
    context.save();
    if (primitive.kind === "area") {
      const edge = this.projector({ x: position.x + primitive.radiusMm, y: position.y, z: position.z });
      const radius = edge ? Math.max(12, Math.hypot(edge.x - center.x, edge.y - center.y)) : 28;
      context.strokeStyle = "#bd6135"; context.fillStyle = "rgba(110,37,37,.16)"; context.setLineDash([5, 4]); context.beginPath(); context.arc(center.x, center.y, radius, 0, Math.PI * 2); context.fill(); context.stroke(); context.setLineDash([]); context.fillStyle = "#d8d0bd"; context.fillText(primitive.label, center.x + radius + 6, center.y); context.restore(); return;
    }
    context.strokeStyle = primitive.kind === "target" && primitive.hostile ? "#bd6135" : "#e4c77e";
    context.fillStyle = "rgba(8,11,13,.82)"; context.beginPath(); context.arc(center.x, center.y, primitive.kind === "event" ? 11 : 15, 0, Math.PI * 2); context.fill(); context.stroke();
    context.fillStyle = "#d8d0bd"; context.fillText(primitive.label, center.x + 18, center.y - 8); context.restore();
  }

  private clear() { const context = this.canvas.getContext("2d"); context?.clearRect(0, 0, this.canvas.width, this.canvas.height); if (this.frame) cancelAnimationFrame(this.frame); this.frame = 0; }
  destroy() { this.disposed = true; this.projection = null; this.clear(); }
}
