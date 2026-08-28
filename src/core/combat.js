const STATUS_TAGS = new Set(["fire", "frost", "poison", "bleed", "fear", "curse", "silence", "radiance", "hex", "water"]);
const DIRECT_DAMAGE_TAGS = new Set(["physical", "strike", "slash", "pierce", "fire", "frost", "poison", "bleed", "radiance", "lightning", "sonic", "water", "earth", "ash"]);

export function damageAffinityMultiplier(enemyDefinition, damageTag) {
  if (enemyDefinition.weaknessTags?.includes(damageTag)) return 1.25;
  if (enemyDefinition.resistanceTags?.includes(damageTag)) return 0.75;
  return 1;
}

export function behaviorPhaseAt(enemyDefinition, hp, maxHp) {
  const ratio = maxHp > 0 ? hp / maxHp : 0;
  const direct = enemyDefinition.behaviorPhases.find((phase) => ratio <= phase.healthRange[0] && ratio >= phase.healthRange[1]);
  if (direct) return direct;
  return enemyDefinition.behaviorPhases.reduce((closest, phase) => {
    const distance = ratio > phase.healthRange[0] ? ratio - phase.healthRange[0] : phase.healthRange[1] - ratio;
    return !closest || distance < closest.distance ? { phase, distance } : closest;
  }, null).phase;
}

export function enemyMoveRuntime(enemyDefinition, moveId, hp, maxHp) {
  const move = enemyDefinition.moves.find((entry) => entry.id === moveId) || enemyDefinition.moves[0];
  const phase = behaviorPhaseAt(enemyDefinition, hp, maxHp);
  const tags = move.damageTags || [];
  const hasDirectDamage = tags.some((tag) => DIRECT_DAMAGE_TAGS.has(tag));
  const effectKind = tags.includes("summon") ? "summon"
    : tags.includes("movement") && !hasDirectDamage ? "movement"
      : tags.some((tag) => ["guard", "buff", "reflect", "healing"].includes(tag)) && !hasDirectDamage ? "support"
        : tags.includes("area") ? "area"
          : tags.includes("projectile") || (enemyDefinition.combatRole === "artillery" && hasDirectDamage) ? "projectile"
            : !hasDirectDamage && tags.some((tag) => STATUS_TAGS.has(tag)) ? "status"
              : "direct";
  const shape = tags.includes("area") ? "area" : enemyDefinition.combatRole === "artillery" ? "line" : tags.includes("grapple") ? "grapple" : "arc";
  const rangeBonus = shape === "area" ? 0.8 : shape === "line" ? 0.45 : 0;
  const status = tags.find((tag) => STATUS_TAGS.has(tag)) || null;
  return {
    move,
    phase,
    effectKind,
    shape,
    status,
    range: enemyDefinition.runtime.attackRange + rangeBonus,
    damage: ["direct", "area", "projectile"].includes(effectKind) ? Math.max(1, Math.round(enemyDefinition.runtime.damage * (1 + Math.max(0, tags.length - 1) * 0.06) * (phase.modifiers.aggression || 1))) : 0,
    poiseDamage: Math.round(enemyDefinition.runtime.poise * (tags.includes("strike") ? 0.22 : 0.12)),
    interruptible: move.telegraph.seconds >= 0.5,
  };
}
