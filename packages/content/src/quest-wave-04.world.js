import worldContractJson from "../manifests/quest-wave-04-v11.world.json" with { type: "json" };

const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
};

export const QUEST_WAVE_04_WORLD_CONTRACT = deepFreeze(worldContractJson);
export default QUEST_WAVE_04_WORLD_CONTRACT;
