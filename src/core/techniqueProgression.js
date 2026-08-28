import { levelFromXp } from "../data/skills.js";
import { SKILL_TREES } from "../data/skillTrees.js";

export function evaluateTechniquePurchase(progression, skillsXp, nodeId) {
  const skillId = nodeId?.split(".")[0];
  const tree = SKILL_TREES[skillId];
  const node = tree?.nodes.find((entry) => entry.id === nodeId);
  if (!node) return { allowed: false, code: "unknown_node", message: "Unknown technique" };
  const owned = Array.isArray(progression?.purchasedNodes?.[skillId]) ? progression.purchasedNodes[skillId] : [];
  if (owned.includes(nodeId)) return { allowed: false, code: "already_owned", message: "Already learned", node, skillId };
  const missing = node.prerequisites.find((id) => !owned.includes(id));
  if (missing) return { allowed: false, code: "missing_prerequisite", message: `Requires ${tree.nodes.find((entry) => entry.id === missing)?.name || missing}`, node, skillId, relatedId: missing };
  const excluded = node.excludes.find((id) => owned.includes(id));
  if (excluded) return { allowed: false, code: "excluded_path", message: `Bound against ${tree.nodes.find((entry) => entry.id === excluded)?.name || excluded}`, node, skillId, relatedId: excluded };
  const level = levelFromXp(skillsXp?.[skillId] || 0);
  if (level < node.levelRequired) return { allowed: false, code: "level_gate", message: `Requires ${tree.name} ${node.levelRequired}`, node, skillId };
  if (node.capstone && !progression?.masteryStates?.[skillId]?.completed) return { allowed: false, code: "mastery_gate", message: `Complete ${tree.name}'s mastery trial`, node, skillId };
  const points = Number(progression?.techniquePoints?.[skillId] || 0);
  if (points < node.cost) return { allowed: false, code: "insufficient_points", message: `Requires ${node.cost} technique points`, node, skillId };
  return { allowed: true, code: "allowed", message: `${node.cost} point${node.cost === 1 ? "" : "s"}`, node, skillId };
}

export function purchaseTechniqueInState(progression, skillsXp, nodeId) {
  const eligibility = evaluateTechniquePurchase(progression, skillsXp, nodeId);
  if (!eligibility.allowed) return eligibility;
  progression.purchasedNodes[eligibility.skillId].push(nodeId);
  progression.techniquePoints[eligibility.skillId] -= eligibility.node.cost;
  return { ...eligibility, purchased: true };
}
