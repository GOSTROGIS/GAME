/** Pure world-progression rules shared by the browser runtime and deterministic tests. */

export function recordWorldObjective(worldEvents, type, target, amount = 1) {
  const bucket = worldEvents?.objectiveLedger?.[type];
  if (!bucket || !target || !Number.isFinite(amount) || amount <= 0) return 0;
  bucket[target] = (bucket[target] || 0) + amount;
  if (type === "defeat") worldEvents.enemyDefeats[target] = bucket[target];
  if (type === "gather") worldEvents.gathered[target] = bucket[target];
  if (type === "interact") worldEvents.interactions[target] = bucket[target];
  if (type === "talk") worldEvents.conversations[target] = bucket[target];
  return bucket[target];
}

export function hydrateQuestFromLedger(quest, state, worldEvents, inventory = {}, discovered = []) {
  if (!quest || !state) return state;
  quest.objectives.forEach((objective, index) => {
    const ledgerValue = worldEvents?.objectiveLedger?.[objective.type]?.[objective.target] || 0;
    const inferred = objective.type === "acquire"
      ? inventory[objective.target] || 0
      : objective.type === "discover" && discovered.includes(objective.target) ? 1 : 0;
    state.progress[index] = Math.min(objective.required, Math.max(state.progress[index] || 0, ledgerValue, inferred));
  });
  return state;
}

export function canOpenHollowAbbey(inventory = {}, uniqueDefeats = []) {
  return (inventory.cinder_seal || 0) > 0 || uniqueDefeats.includes("kiln_knight_rusk");
}

export function canResolveLastBell(quest, state, worldEvents = {}) {
  if (quest?.id !== "main_a_litany_unspoken" || !["active", "ready"].includes(state?.status)) return false;
  const choiceIndex = quest.objectives.findIndex((objective) => objective.type === "interact" && objective.target === "memory_clapper");
  if (choiceIndex < 1 || !quest.objectives.slice(0, choiceIndex).every((objective, index) => (state.progress?.[index] || 0) >= objective.required)) return false;
  return (worldEvents.objectiveLedger?.defeat?.cantor_oss || 0) >= 1 || worldEvents.uniqueDefeats?.includes("cantor_oss");
}

export function lastBellOutcome(choice) {
  if (choice === "remember") return Object.freeze({ stat: "focus", amount: 10, itemId: "clay_name_token", quantity: 3 });
  if (choice === "release") return Object.freeze({ stat: "stamina", amount: 8, itemId: "vow_thread", quantity: 3 });
  return null;
}
