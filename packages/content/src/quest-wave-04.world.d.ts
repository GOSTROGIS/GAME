export interface QuestWave04SourceBinding {
  readonly path: "design-review/quest-release-evidence/quest-wave-04-v11.machine-annex.json";
  readonly bytes: 4245855;
  readonly sha256: "12183ae9cbded83a65503c42b32c75f4824fad80c0da5f6c5340abd6dce11962";
}

export interface QuestWave04WorldContract {
  readonly schemaVersion: 1;
  readonly kind: "quest-wave-world-blockout-contract";
  readonly waveId: "quest-wave-04-v11";
  readonly sourceBinding: QuestWave04SourceBinding;
  readonly authority: Readonly<{
    content: "accepted_authored_blockout_contract";
    atlasPlacement: "provisional_placement";
    runtimeIntegrated: false;
    productionGeometry: false;
    constructionReady: false;
  }>;
  readonly provisionalFamilyLaws: readonly Readonly<Record<string, unknown>>[];
  readonly existingCreatureEcologyDeepenings: readonly Readonly<Record<string, unknown>>[];
  readonly creatureHabitatEnvelopes: readonly Readonly<Record<string, unknown>>[];
  readonly environmentPrograms: readonly Readonly<Record<string, unknown>>[];
}

export const QUEST_WAVE_04_WORLD_CONTRACT: QuestWave04WorldContract;
export default QUEST_WAVE_04_WORLD_CONTRACT;
