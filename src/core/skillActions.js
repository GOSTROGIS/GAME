import { SKILL_ACTIONS, SKILL_TREES } from "../data/skillTrees.js";

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
const isRecord = (value) => Boolean(value && typeof value === "object" && !Array.isArray(value));

export function awardSkillAction(progression, { skillId, actionId, difficultyRatio = 1, timing = 1, quality = 1, restedEligible = true, now = Date.now() }) {
  const action = SKILL_ACTIONS[skillId]?.find((entry) => entry.id === actionId);
  if (!action) return { awarded: false, code: "unknown_action", xp: 0 };
  if (![difficultyRatio, timing, quality, now].every(Number.isFinite)) return { awarded: false, code: "invalid_context", xp: 0 };
  const rules = SKILL_TREES[skillId].progressionRules;
  if (difficultyRatio < rules.contributionGate.minimumDifficultyRatio) return { awarded: false, code: "trivial_contribution", xp: 0 };

  const windowStart = now - rules.diversity.rollingWindowMinutes * 60_000;
  const knownActionIds = new Set(SKILL_ACTIONS[skillId].map(({ id }) => id));
  progression.repetition ||= {};
  const history = (Array.isArray(progression.repetition[skillId]) ? progression.repetition[skillId] : []).filter((entry) => isRecord(entry) && knownActionIds.has(entry.actionId) && Number.isFinite(entry.at) && entry.at >= windowStart && entry.at <= now);
  const repeats = history.filter((entry) => entry.actionId === actionId).length;
  const repetitionSteps = Math.max(0, repeats - rules.antiGrind.graceRepeats + 1);
  const repetitionMultiplier = Math.max(rules.antiGrind.minimumMultiplier, 1 - repetitionSteps * rules.antiGrind.decayPerRepeat);
  const distinctActions = new Set([...history.map((entry) => entry.actionId), actionId]).size;
  const diversityBonus = rules.diversity.distinctActionBonuses[Math.min(distinctActions, rules.diversity.distinctActionBonuses.length - 1)] || 0;
  progression.restedCharges = Number.isFinite(progression.restedCharges) ? Math.max(0, progression.restedCharges) : 0;
  const useRested = restedEligible && progression.restedCharges > 0;
  const restedMultiplier = useRested ? rules.rested.multiplier : 1;
  const variables = action.formulaVariables;
  const xp = Math.max(1, Math.round(
    variables.baseXp * variables.tierMultiplier *
    clamp(difficultyRatio, ...variables.difficultyRange) *
    clamp(timing, ...variables.timingRange) *
    clamp(quality, ...variables.qualityRange) *
    restedMultiplier * (1 + diversityBonus) * repetitionMultiplier,
  ));

  progression.repetition[skillId] = [...history, { actionId, at: now }].slice(-64);
  if (useRested) progression.restedCharges -= rules.rested.chargesSpentPerEligibleAction;
  progression.actionMastery ||= {};
  if (!isRecord(progression.actionMastery[skillId])) progression.actionMastery[skillId] = {};
  const existingMastery = progression.actionMastery[skillId][actionId];
  const mastery = progression.actionMastery[skillId][actionId] = isRecord(existingMastery) ? {
    uses: Number.isFinite(existingMastery.uses) ? Math.max(0, Math.floor(existingMastery.uses)) : 0,
    totalXp: Number.isFinite(existingMastery.totalXp) ? Math.max(0, Math.floor(existingMastery.totalXp)) : 0,
    perfects: Number.isFinite(existingMastery.perfects) ? Math.max(0, Math.floor(existingMastery.perfects)) : 0,
    lastAt: Number.isFinite(existingMastery.lastAt) ? existingMastery.lastAt : null,
  } : { uses: 0, totalXp: 0, perfects: 0, lastAt: null };
  mastery.uses += 1; mastery.totalXp += xp; mastery.lastAt = now;
  if (timing >= 0.92 || quality >= 0.92) mastery.perfects += 1;
  return { awarded: true, code: "awarded", xp, multipliers: { difficulty: difficultyRatio, timing, quality, rested: restedMultiplier, diversity: 1 + diversityBonus, repetition: repetitionMultiplier } };
}
