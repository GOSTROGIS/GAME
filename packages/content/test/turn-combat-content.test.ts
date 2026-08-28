import assert from "node:assert/strict";
import test from "node:test";
import {
  validateCreatureMechanicContractV4,
  validateSkillEffectV2,
  type CanonicalTurnTechniqueAction,
  type TurnEffectQueryV1,
  type TurnTargetRelation,
} from "@hollow-march/shared";
import { BESTIARY, BESTIARY_BY_ID } from "../src/bestiary.js";
import { SABLE_REACH_ECOLOGY_PROOF_ENCOUNTERS } from "../src/showcases.js";
import {
  COMBAT_SKILL_EFFECT_BY_ID,
  COMBAT_SKILL_EFFECT_HANDLERS,
  COMBAT_SKILL_EFFECT_HANDLER_REGISTRY,
  COMBAT_SKILL_EFFECT_MIGRATIONS,
  ACTIVE_TECHNIQUES,
  ACTIVE_TECHNIQUE_BY_ID,
  ACTIVE_TECHNIQUE_EFFECT_HANDLER_BY_ID,
  CONTENT_TURN_EFFECT_RESOLVER_BY_ID,
  canonicalizeActiveTechnique,
  resolveCanonicalContentTurnEffect,
  CREATURE_MECHANIC_CONTRACTS_V4,
  CREATURE_MECHANIC_V4_BY_CREATURE_ID,
  CREATURE_MECHANIC_V4_BY_HANDLER_ID,
  CREATURE_TURN_EFFECT_HANDLER_BY_ID,
  CREATURE_TURN_EFFECT_HANDLERS,
  CREATURE_TURN_EFFECT_RESOLVER_BY_ID,
  TURN_COMBAT_SKILL_IDS,
  UNCHANGED_WORLD_TIMING_SKILL_IDS,
  TURN_QUEST_SETTLEMENT_DEFINITIONS,
  TURN_QUEST_SETTLEMENT_DEFINITION_BY_ID,
} from "../src/turnCombatContent.js";

const effectQuery = (effectHandlerId: string, relation: TurnTargetRelation, overrides: Partial<CanonicalTurnTechniqueAction> = {}): TurnEffectQueryV1 => {
  const actor = { actorId: "enemy.actor", team: "enemies" as const, positionMm: { x: 0, y: 0, z: 0 }, health: 100, maxHealth: 100, stamina: 100, focus: 20, statuses: {}, buffs: {} };
  const hostile = { actorId: "player.target", team: "players" as const, positionMm: { x: 1_000, y: 0, z: 0 }, health: 100, maxHealth: 100, stamina: 100, focus: 20, statuses: {}, buffs: {} };
  const ally = { actorId: "enemy.ally", team: "enemies" as const, positionMm: { x: 500, y: 0, z: 0 }, health: 50, maxHealth: 100, stamina: 50, focus: 10, statuses: {}, buffs: {} };
  const targetActorId = relation === "self" ? actor.actorId : relation === "ally" ? ally.actorId : hostile.actorId;
  const action: CanonicalTurnTechniqueAction = {
    actionId: "action.test.effect", definitionId: "definition.test.effect", kind: "technique", beat: 0, band: "standard", apCost: 1,
    staminaCost: 0, focusCost: 0, posthumous: false, reactionTrigger: relation === "hostile" ? "hostile_targeted" : "none", targetRelation: relation,
    effectHandlerId, targetActorId, rangeMm: 12_000, damage: 100, healing: 100, hitChancePermille: 1_000, interrupts: false,
    ...overrides,
  };
  return { encounterId: "encounter.content-test", leaseGeneration: 1, round: 1, beat: 0, band: action.band, rootActionId: "root.content-test", actor, action, actors: [actor, hostile, ally] };
};

test("all 178 creatures have one strict, unique, stable V4 contract", () => {
  assert.equal(CREATURE_MECHANIC_CONTRACTS_V4.length, 178);
  assert.equal(CREATURE_MECHANIC_V4_BY_CREATURE_ID.size, 178);
  assert.equal(CREATURE_MECHANIC_V4_BY_HANDLER_ID.size, 178);

  const semanticSignatures = new Set<string>();
  const authoredRanges = new Set<number>();
  const authoredHitChances = new Set<number>();
  const authoredPriorities = new Set<number>();
  const moveIds = new Set<string>();
  for (const record of CREATURE_MECHANIC_CONTRACTS_V4) {
    validateCreatureMechanicContractV4(record.contract);
    const v3 = BESTIARY_BY_ID.get(record.creatureId);
    assert.ok(v3, record.creatureId);
    assert.equal(record.familyId, v3.familyId, record.creatureId);
    assert.equal(record.contract.handlerId, v3.mechanicContract.handlerId, record.creatureId);
    assert.equal(record.contract.moveId, v3.mechanicContract.moveId, record.creatureId);
    assert.ok(!moveIds.has(record.contract.moveId), `duplicate V4 move ID ${record.contract.moveId}`);
    moveIds.add(record.contract.moveId);

    const signature = JSON.stringify({
      moveId: record.contract.moveId,
      sourceEffects: v3.mechanicContract.effects,
      targetRule: record.contract.turn.targetRule,
      targetRelation: record.contract.turn.targetRelation,
      statuses: record.contract.turn.statusIcons,
      sensoryCue: record.contract.turn.sensoryCue,
      interruptRule: record.contract.turn.interruptRule,
      counterplay: record.contract.turn.counterplay,
    });
    assert.ok(!semanticSignatures.has(signature), `duplicate semantic/provenance signature for ${record.creatureId}`);
    semanticSignatures.add(signature);
    authoredRanges.add(record.contract.turn.rangeMm);
    authoredHitChances.add(record.contract.turn.hitChancePermille);
    authoredPriorities.add(record.contract.turn.priority);
  }
  assert.equal(semanticSignatures.size, 178);
  assert.ok(authoredRanges.size < 20, "range must use semantic bands, not per-row sequence salt");
  assert.ok(authoredHitChances.size <= 8, "hit chance must use semantic bands, not per-row sequence salt");
  assert.ok(authoredPriorities.size <= 6, "priority must be band-authored, not per-row sequence salt");
});

test("V3 seconds survive exactly as presentation metadata alongside independent authored tactics", () => {
  const presentationsByBand = new Map<string, Set<string>>();
  const allPresentationSignatures = new Set<string>();
  for (const record of CREATURE_MECHANIC_CONTRACTS_V4) {
    const v3 = BESTIARY_BY_ID.get(record.creatureId)!;
    assert.deepEqual(record.contract.presentationV3, {
      startupSeconds: v3.mechanicContract.timing.startup,
      activeSeconds: v3.mechanicContract.timing.active,
      recoverySeconds: v3.mechanicContract.timing.recovery,
      telegraphSeconds: v3.mechanicContract.telegraphs.seconds,
    }, record.creatureId);
    assert.equal(record.contract.turn.sensoryCue, v3.mechanicContract.telegraphs.visual, record.creatureId);
    assert.equal(record.contract.turn.interruptRule, v3.mechanicContract.interruptions.join(" + "), record.creatureId);
    assert.equal(record.contract.turn.counterplay, v3.mechanicContract.counterplay, record.creatureId);

    const presentationKey = JSON.stringify(record.contract.presentationV3);
    allPresentationSignatures.add(presentationKey);
    const presentations = presentationsByBand.get(record.contract.turn.band) ?? new Set<string>();
    presentations.add(presentationKey);
    presentationsByBand.set(record.contract.turn.band, presentations);
  }
  assert.equal(presentationsByBand.size, 6);
  assert.ok(allPresentationSignatures.size >= 170, "presentation lineage must retain the independently authored V3 timing signatures");
});

test("summon-tagged expansion moves retain their authored physical meaning instead of a ritual template", () => {
  assert.equal(JSON.stringify(CREATURE_MECHANIC_CONTRACTS_V4).includes("self.ritual_anchor"), false);
  const expected = new Map<string, readonly [string, string]>([
    ["cairn_maggot", ["movement", "area.marker_roll_line"]],
    ["interval_thief", ["standard", "area.stolen_rest_gap"]],
    ["needle_pilgrim", ["movement", "area.eastward_fall_line"]],
    ["curtain_listener", ["standard", "hostile.audible_action_source"]],
    ["gutter_double", ["movement", "area.counterflow_drainage_line"]],
    ["route_surgeon", ["standard", "area.landmark_line_cut"]],
    ["hollow_smelter", ["movement", "area.pressure_relocation"]],
    ["meridian_widow", ["standard", "hostile.opposed_shadow"]],
    ["tide_sacristan", ["aftermath", "ally.procession_front"]],
    ["prism_larva", ["standard", "hostile.missing_resistance"]],
  ]);
  for (const [creatureId, [band, targetRule]] of expected) {
    const record = CREATURE_MECHANIC_V4_BY_CREATURE_ID.get(creatureId);
    assert.ok(record, creatureId);
    assert.equal(record.contract.turn.band, band, creatureId);
    assert.equal(record.contract.turn.targetRule, targetRule, creatureId);
    if (creatureId !== "tide_sacristan") assert.ok(record.contract.turn.damageBand[0] > 0, creatureId);
  }
});

test("every V4 effect handler resolves and only 21 ecology proofs claim prototype integration", () => {
  assert.equal(CREATURE_TURN_EFFECT_HANDLERS.length, 178);
  assert.equal(CREATURE_TURN_EFFECT_HANDLER_BY_ID.size, 178);
  assert.equal(CREATURE_TURN_EFFECT_RESOLVER_BY_ID.size, 178);
  const executedProofHandlers = new Set<string>();
  for (const record of CREATURE_MECHANIC_CONTRACTS_V4) {
    const handler = CREATURE_TURN_EFFECT_HANDLER_BY_ID.get(record.contract.turn.effectHandlerId);
    assert.ok(handler, record.creatureId);
    assert.equal(handler.creatureId, record.creatureId);
    assert.equal(handler.moveId, record.contract.moveId);
    assert.equal(handler.implementationStatus, record.prototypePlayable ? "prototype_integrated" : "specified");
    assert.equal(CREATURE_MECHANIC_V4_BY_HANDLER_ID.get(record.contract.handlerId), record);
    const query = effectQuery(handler.id, record.contract.turn.targetRelation, {
      band: record.contract.turn.band,
      apCost: record.contract.turn.apCost || 1,
      staminaCost: record.contract.turn.staminaCost,
      focusCost: record.contract.turn.focusCost,
      posthumous: record.contract.turn.posthumous,
      reactionTrigger: record.contract.turn.reactionTrigger,
      targetRelation: record.contract.turn.targetRelation,
      hitChancePermille: record.contract.turn.hitChancePermille,
      damage: Math.max(1, record.contract.turn.damageBand[1]),
      ...(record.contract.turn.band === "movement" ? { destinationMm: { x: 1_500, y: 0, z: 500 }, destinationYawTenThousandthRadians: 7_854 } : {}),
    });
    const direct = handler.resolve(query);
    const viaRegistry = CREATURE_TURN_EFFECT_RESOLVER_BY_ID.get(handler.id)!(query);
    assert.deepEqual(viaRegistry, direct, `${record.creatureId} resolver must be deterministic`);
    assert.equal(direct.resolved, true, record.creatureId);
    assert.ok(direct.operations.length > 0, `${record.creatureId} requires a meaningful operation`);
    if (record.prototypePlayable) executedProofHandlers.add(record.creatureId);
  }

  const expectedProofs = new Set(SABLE_REACH_ECOLOGY_PROOF_ENCOUNTERS.encounters.map(({ creatureId }) => creatureId));
  const actualProofs = new Set(CREATURE_MECHANIC_CONTRACTS_V4.filter(({ prototypePlayable }) => prototypePlayable).map(({ creatureId }) => creatureId));
  assert.equal(expectedProofs.size, 21);
  assert.deepEqual(actualProofs, expectedProofs);
  assert.deepEqual(executedProofHandlers, expectedProofs);
  assert.equal(CREATURE_MECHANIC_CONTRACTS_V4.filter(({ contract }) => contract.implementationStatus === "implemented").length, 21);
  assert.equal(CREATURE_MECHANIC_CONTRACTS_V4.filter(({ contract }) => contract.implementationStatus === "specified").length, 157);
  assert.equal(CREATURE_MECHANIC_CONTRACTS_V4.some(({ contract }) => contract.implementationStatus === "playtested"), false);
});

test("checked SkillEffectV2 migration covers every legacy combat technique and action exactly", async () => {
  assert.deepEqual([...TURN_COMBAT_SKILL_IDS], ["swordsmanship", "heavy_arms", "marksmanship", "guard", "vitality", "hexcraft"]);
  assert.equal(COMBAT_SKILL_EFFECT_MIGRATIONS.length, 120);
  assert.equal(COMBAT_SKILL_EFFECT_BY_ID.size, 120);
  assert.equal(COMBAT_SKILL_EFFECT_MIGRATIONS.filter(({ sourceKind }) => sourceKind === "technique").length, 72);
  assert.equal(COMBAT_SKILL_EFFECT_MIGRATIONS.filter(({ sourceKind }) => sourceKind === "action").length, 48);
  assert.equal(COMBAT_SKILL_EFFECT_HANDLERS.length, 120);
  assert.equal(COMBAT_SKILL_EFFECT_HANDLER_REGISTRY.size, 120);

  // Computed import keeps legacy JS outside the package build graph while this
  // test still guards the one-way compatibility table against source drift.
  const legacyModulePath = "../../../../src/data/skillTrees.js";
  const legacy = await import(legacyModulePath) as {
    SKILL_TREES: Record<string, { nodes: readonly { id: string; effects: readonly { hook: string }[] }[] }>;
    SKILL_ACTIONS: Record<string, readonly { id: string; hook: string }[]>;
  };
  const expected = new Map<string, { sourceKind: "technique" | "action"; handlerId: string }>();
  for (const skillId of TURN_COMBAT_SKILL_IDS) {
    for (const node of legacy.SKILL_TREES[skillId]!.nodes) expected.set(node.id, { sourceKind: "technique", handlerId: node.effects[0]!.hook });
    for (const action of legacy.SKILL_ACTIONS[skillId]!) expected.set(action.id, { sourceKind: "action", handlerId: action.hook });
  }
  assert.equal(expected.size, 120);

  for (const migration of COMBAT_SKILL_EFFECT_MIGRATIONS) {
    validateSkillEffectV2(migration.effect);
    const source = expected.get(migration.legacyId);
    assert.ok(source, migration.legacyId);
    assert.deepEqual({ sourceKind: migration.sourceKind, handlerId: migration.legacyHandlerId }, source, migration.legacyId);
    assert.equal(migration.effect.id, migration.legacyId);
    assert.equal(migration.effect.handlerId, migration.legacyHandlerId);
    assert.equal(migration.resolutionMode, migration.sourceKind === "technique" ? "passive_modifier" : "achievement_observer");
    const handlerId = `turn.skill.${migration.legacyId}`;
    const handler = COMBAT_SKILL_EFFECT_HANDLER_REGISTRY.get(handlerId);
    assert.ok(handler, migration.legacyId);
    assert.equal(handler.migrationId, migration.legacyId);
    if (migration.effect.scope !== "world") assert.equal(migration.effect.encounter.effectHandlerId, handlerId);
    const query = effectQuery(handlerId, "self");
    const first = handler.resolve(query);
    const second = handler.resolve(query);
    assert.deepEqual(first, second, migration.legacyId);
    assert.equal(first.resolved, false, migration.legacyId);
    assert.equal(first.operations.length, 0, migration.legacyId);
    assert.match(first.reason ?? "", migration.effect.scope === "world" ? /world_effect/ : migration.sourceKind === "technique" ? /passive/ : /achievement/);
  }
  assert.deepEqual(new Set(COMBAT_SKILL_EFFECT_BY_ID.keys()), new Set(expected.keys()));
});

test("six selectable active techniques canonicalize and resolve while passive and observer IDs cannot be submitted", () => {
  assert.equal(ACTIVE_TECHNIQUES.length, 6);
  assert.equal(ACTIVE_TECHNIQUE_BY_ID.size, 6);
  assert.equal(ACTIVE_TECHNIQUE_EFFECT_HANDLER_BY_ID.size, 6);
  assert.equal(CONTENT_TURN_EFFECT_RESOLVER_BY_ID.size, 304);
  assert.deepEqual(new Set(ACTIVE_TECHNIQUES.map(({ skillId }) => skillId)), new Set(TURN_COMBAT_SKILL_IDS));

  for (const technique of ACTIVE_TECHNIQUES) {
    validateSkillEffectV2(technique.effect);
    const relation = technique.effect.encounter.targetRelation;
    const targetActorId = relation === "hostile" ? "player.target" : relation === "ally" ? "enemy.ally" : undefined;
    const action = canonicalizeActiveTechnique({
      selectionId: `selection.${technique.skillId}`,
      actionDefinitionId: technique.id,
      beat: 0,
      ...(targetActorId ? { targetActorId } : {}),
    });
    assert.ok(action, technique.id);
    assert.equal(action.apCost, technique.effect.encounter.apCost);
    assert.equal(action.staminaCost, technique.effect.encounter.staminaCost);
    assert.equal(action.focusCost, technique.effect.encounter.focusCost);
    const resolver = ACTIVE_TECHNIQUE_EFFECT_HANDLER_BY_ID.get(action.effectHandlerId);
    assert.ok(resolver, technique.id);
    const query = effectQuery(action.effectHandlerId, relation, action);
    const first = resolver(query);
    const second = resolver(query);
    assert.deepEqual(first, second, technique.id);
    assert.deepEqual(resolveCanonicalContentTurnEffect(query), first, technique.id);
    assert.equal(first.resolved, true, technique.id);
    assert.ok(first.operations.length > 0, technique.id);
  }

  for (const migration of COMBAT_SKILL_EFFECT_MIGRATIONS) {
    assert.equal(canonicalizeActiveTechnique({ selectionId: `rejected.${migration.legacyId}`, actionDefinitionId: migration.legacyId, beat: 0 }), null, migration.legacyId);
  }
  const shelter = canonicalizeActiveTechnique({
    selectionId: "selection.shelter",
    actionDefinitionId: "technique.guard.shelter_step",
    beat: 0,
    targetActorId: "enemy.ally",
  })!;
  assert.equal(shelter.band, "preemptive");
  assert.deepEqual(resolveCanonicalContentTurnEffect(effectQuery(shelter.effectHandlerId, "ally", shelter)).operations, [
    { kind: "buff", targetActorId: "enemy.ally", buffId: "sheltered", magnitude: 2, durationRounds: 1 },
  ]);
});

test("turn quest settlement metadata matches the defeat-bearing main-chain objective and reward contracts", () => {
  assert.equal(TURN_QUEST_SETTLEMENT_DEFINITIONS.length, 3);
  assert.deepEqual(TURN_QUEST_SETTLEMENT_DEFINITION_BY_ID.get("main_bells_below")?.objectives, [
    { type: "defeat", target: "mirebound", required: 4 },
    { type: "discover", target: "sunken_vestry", required: 1 },
    { type: "interact", target: "drowned_bell_rope", required: 1 },
    { type: "talk", target: "ysra_pell", required: 1 },
  ]);
  assert.deepEqual(TURN_QUEST_SETTLEMENT_DEFINITION_BY_ID.get("main_the_cinder_seal")?.objectives, [
    { type: "talk", target: "orik_senn", required: 1 },
    { type: "defeat", target: "kiln_thrall", required: 3 },
    { type: "defeat", target: "kiln_knight_rusk", required: 1 },
    { type: "acquire", target: "cinder_seal", required: 1 },
  ]);
  assert.deepEqual(TURN_QUEST_SETTLEMENT_DEFINITION_BY_ID.get("main_a_litany_unspoken")?.objectives, [
    { type: "interact", target: "abbey_gate", required: 1 },
    { type: "defeat", target: "hush_monk", required: 5 },
    { type: "discover", target: "last_bell_crypt", required: 1 },
    { type: "defeat", target: "cantor_oss", required: 1 },
    { type: "interact", target: "memory_clapper", required: 1 },
  ]);
  assert.deepEqual(TURN_QUEST_SETTLEMENT_DEFINITION_BY_ID.get("main_bells_below")?.rewards, {
    inventory: { sable_marks: 220, reedward_charm: 1 },
    skillXp: { swordsmanship: 300, runecrafting: 180, wayfaring: 150 },
    unlocks: ["main_the_cinder_seal", "dunmire_shortcut"],
  });
});

test("gathering, crafting, runecrafting, and exploration timing registries remain untouched", () => {
  assert.deepEqual([...UNCHANGED_WORLD_TIMING_SKILL_IDS], [
    "mining", "woodcutting", "foraging", "fishing", "hunting", "smithing", "woodcraft", "leatherworking", "alchemy", "cooking", "runecrafting", "wayfaring",
  ]);
  const migratedSkills = new Set<string>(COMBAT_SKILL_EFFECT_MIGRATIONS.map(({ skillId }) => skillId));
  assert.deepEqual(migratedSkills, new Set<string>(TURN_COMBAT_SKILL_IDS));
  for (const skillId of UNCHANGED_WORLD_TIMING_SKILL_IDS) assert.equal(migratedSkills.has(skillId), false, skillId);
  assert.deepEqual(
    Object.fromEntries(["world", "encounter", "both"].map((scope) => [scope, COMBAT_SKILL_EFFECT_MIGRATIONS.filter(({ effect }) => effect.scope === scope).length])),
    { world: 3, encounter: 108, both: 9 },
  );
  assert.equal(BESTIARY.length, 178);
});
