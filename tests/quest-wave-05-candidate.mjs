import assert from "node:assert/strict";
import {
  COSMIC_FACTIONS,
  EXPANSION_CHARACTERS,
  EXPANSION_CREATURES,
  EXPANSION_ITEMS,
  EXPANSION_QUESTS,
  QUEST_AUTHORING_LAW,
} from "../packages/content/src/narrative.data.js";
import {
  BUILDING_TYPOLOGIES,
  EXPANSION_CREATURE_HABITAT_ENVELOPES,
  SITE_SPATIAL_ENVELOPES,
} from "../packages/content/src/world-spatial.data.js";
import candidatePackage, {
  QUEST_WAVE_05_ACCEPTED_COLLISION_SCOPE,
  QUEST_WAVE_05_ART_AND_REGISTRY_IMPLICATIONS,
  QUEST_WAVE_05_CANDIDATE_META,
  QUEST_WAVE_05_ENVIRONMENT_BRIEFS,
  QUEST_WAVE_05_HIGH_RISK_ANALOGUES,
  QUEST_WAVE_05_QUESTS,
  QUEST_WAVE_05_SIGNATURE_ITEMS,
  QUEST_WAVE_05_SUPPORTING_CHARACTERS,
} from "../packages/content/src/quest-wave-05.candidate.js";

const EXPECTED_UNUSED_CREATURE_IDS = [
  "acre_that_walks",
  "apse_seraph",
  "corridor_maw",
  "door_lung_courser",
  "ember_midwife",
  "funeral_kite",
  "gold_shutter_penitent",
  "jointless_advocate",
  "mercy_eater",
  "misericord_of_borrowed_pain",
  "noon_bailiff",
  "rain_notary",
  "reliquary_of_the_last_breath",
  "reverse_rib_bride",
  "shutter_stag",
  "throat_orchard",
  "unbroken_note_engine",
  "witness_crab",
];

const EXPECTED_SITES = ["site.salt-watch", "site.cairnmarket", "site.ember-gate"];
const EXPECTED_PORTFOLIO_COUNTS = {
  settlement: 3,
  regional: 3,
  character_guest_follower: 2,
  faction_schism: 2,
  profession_systemic: 1,
  relic_creature_ecology: 1,
};
const REQUIRED_PROOF_FIELDS = ["setpiece", "failureTransformation", "dialogueConstraint", "persistentWorldChange", "forbiddenSubstitution"];
const FALSE_CLAIM_KEYS = ["canonical", "accepted", "independentlyReviewed", "releaseAttested", "runtimeIntegrated", "productionGeometry", "constructionReady", "artAccepted", "staticModelReady", "animatedModelReady"];

const ids = (records) => records.map(({ id }) => id);
const sorted = (values) => [...values].sort();
const countBy = (records, key) => records.reduce((counts, record) => ({ ...counts, [record[key]]: (counts[record[key]] ?? 0) + 1 }), {});
const duplicateValues = (values) => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
const words = (value) => String(value).toLowerCase().match(/[a-z0-9]+/g) ?? [];
const wordSet = (value) => new Set(words(value).filter((token) => token.length > 3));
const jaccard = (left, right) => {
  const a = wordSet(left);
  const b = wordSet(right);
  const overlap = [...a].filter((token) => b.has(token)).length;
  return overlap / Math.max(1, a.size + b.size - overlap);
};
const shingles = (value, width = 3) => {
  const tokens = words(value);
  return new Set(tokens.slice(0, Math.max(0, tokens.length - width + 1)).map((_, index) => tokens.slice(index, index + width).join(" ")));
};
const shingleJaccard = (left, right) => {
  const a = shingles(left);
  const b = shingles(right);
  const overlap = [...a].filter((entry) => b.has(entry)).length;
  return overlap / Math.max(1, a.size + b.size - overlap);
};
const questProse = (quest) => [
  quest.title,
  quest.premise,
  quest.loreReveal,
  quest.dialogueThesis,
  quest.primaryMechanic.description,
  quest.primaryMechanic.pressure,
  quest.dilemma.irreducibleCost,
  quest.decisiveBeat,
  quest.failurePersistence,
  quest.characterVoiceConstraint,
  ...Object.values(quest.authorshipProof),
].join(" ");
const acceptedQuestProse = (quest) => [
  quest.title,
  quest.premise,
  quest.loreReveal,
  quest.dialogueThesis,
  ...Object.values(quest.authorshipProof ?? {}),
].join(" ");

const collectStringEntries = (value, path = "candidate", entries = []) => {
  if (typeof value === "string") entries.push({ path, value });
  else if (Array.isArray(value)) value.forEach((child, index) => collectStringEntries(child, `${path}[${index}]`, entries));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, child]) => collectStringEntries(child, `${path}.${key}`, entries));
  return entries;
};

const validateCandidate = (pkg) => {
  const errors = [];
  const add = (path, code) => errors.push(`${path}:${code}`);
  const quests = pkg.quests ?? [];
  const characters = pkg.supportingCharacters ?? [];
  const items = pkg.signatureItems ?? [];
  const environments = pkg.environmentBriefs ?? [];

  if (quests.length !== 12) add("quests", "count");
  if (characters.length !== 12) add("supportingCharacters", "count");
  if (items.length !== 12) add("signatureItems", "count");
  if (environments.length !== 12) add("environmentBriefs", "count");
  for (const [label, records] of Object.entries({ quests, characters, items, environments })) {
    if (duplicateValues(ids(records)).length) add(label, "duplicate_id");
  }

  const characterById = new Map(characters.map((record) => [record.id, record]));
  const itemById = new Map(items.map((record) => [record.id, record]));
  const environmentById = new Map(environments.map((record) => [record.id, record]));
  const giverById = new Map(EXPANSION_CHARACTERS.map((record) => [record.id, record]));
  const siteById = new Map(SITE_SPATIAL_ENVELOPES.map((record) => [record.id, record]));
  const factionIds = new Set(COSMIC_FACTIONS.map(({ id }) => id));
  const creatureIds = new Set(EXPANSION_CREATURES.map(({ id }) => id));
  const portfolioIds = new Set(QUEST_AUTHORING_LAW.portfolioIds);

  quests.forEach((quest, index) => {
    const path = `quests[${index}]`;
    if (!siteById.has(quest.siteId)) add(`${path}.siteId`, "unknown");
    if (siteById.get(quest.siteId)?.territoryId !== quest.territoryId) add(`${path}.territoryId`, "site_mismatch");
    if (!factionIds.has(quest.leadFactionId)) add(`${path}.leadFactionId`, "unknown");
    if (!portfolioIds.has(quest.portfolioId)) add(`${path}.portfolioId`, "unknown");
    if (giverById.get(quest.giverId)?.factionId !== quest.leadFactionId) add(`${path}.giverId`, "lead_faction_mismatch");
    if (quest.supportingCharacterIds?.length !== 1 || !characterById.has(quest.supportingCharacterIds[0])) add(`${path}.supportingCharacterIds`, "exclusive_reference");
    if (!itemById.has(quest.signatureItemId)) add(`${path}.signatureItemId`, "missing");
    if (!environmentById.has(quest.environmentId)) add(`${path}.environmentId`, "missing");
    if (!quest.creatureIds?.length || quest.creatureIds.some((id) => !creatureIds.has(id))) add(`${path}.creatureIds`, "unknown");
    if (quest.stateWrites?.length !== 1 || quest.stateWrites[0].values?.length !== 3) add(`${path}.stateWrites`, "shape");
    if (sorted(quest.outcomes?.map(({ id }) => id) ?? []).join("|") !== sorted(quest.stateWrites?.[0]?.values ?? []).join("|")) add(`${path}.outcomes`, "state_value_mismatch");
    if ((quest.objectives?.length ?? 0) < 5) add(`${path}.objectives`, "insufficient_depth");
    if (quest.objectives?.some(({ id, type, nodeIds, success, failureCarry }) => !id || !type || !nodeIds?.length || success.length < 24 || failureCarry.length < 24)) add(`${path}.objectives`, "incomplete");
    if (REQUIRED_PROOF_FIELDS.some((field) => (quest.authorshipProof?.[field]?.length ?? 0) < 48)) add(`${path}.authorshipProof`, "incomplete");
    if ((quest.primaryMechanic?.description?.length ?? 0) < 80 || (quest.dilemma?.irreducibleCost?.length ?? 0) < 60) add(path, "shallow_mechanic_or_dilemma");
    if ((quest.decisiveBeat?.length ?? 0) < 80 || (quest.failurePersistence?.length ?? 0) < 80 || (quest.spatialMutation?.length ?? 0) < 60) add(path, "shallow_consequence");
    if (sorted(quest.collisionAnalysis?.comparedAcceptedQuestIds ?? []).join("|") !== sorted(EXPANSION_QUESTS.map(({ id }) => id)).join("|")) add(`${path}.collisionAnalysis`, "not_full_accepted_scope");
    if (sorted(quest.collisionAnalysis?.highRiskAnalogueIdsChecked ?? []).join("|") !== sorted(QUEST_WAVE_05_HIGH_RISK_ANALOGUES.map(({ questId }) => questId)).join("|")) add(`${path}.collisionAnalysis`, "not_high_risk_scope");
    if ((quest.collisionAnalysis?.nearestAcceptedQuestIds?.length ?? 0) < 2 || (quest.collisionAnalysis?.distinction?.length ?? 0) < 100 || (quest.collisionAnalysis?.uniqueGenome?.length ?? 0) < 40) add(`${path}.collisionAnalysis`, "not_substantive");
    if (FALSE_CLAIM_KEYS.some((key) => quest.claims?.[key] !== false)) add(`${path}.claims`, "promotion");
  });

  characters.forEach((character, index) => {
    const path = `supportingCharacters[${index}]`;
    const owner = quests.find((quest) => quest.id === character.questId);
    if (!owner || owner.supportingCharacterIds[0] !== character.id) add(path, "ownership");
    for (const field of ["desire", "fear", "contradiction", "secret", "ownedDecision", "visualBrief"]) if ((character[field]?.length ?? 0) < 55) add(`${path}.${field}`, "shallow");
    if (!character.voice?.cadence || !character.voice?.imagery || !character.voice?.signature) add(`${path}.voice`, "incomplete");
    if (character.pipeline?.conceptMaster !== null || character.pipeline?.transparentCutout !== null || character.pipeline?.staticModel !== null || character.pipeline?.animatedModel !== null) add(`${path}.pipeline`, "unsupported_asset_claim");
  });

  items.forEach((item, index) => {
    const path = `signatureItems[${index}]`;
    const owner = quests.find((quest) => quest.id === item.questId);
    if (!owner || owner.signatureItemId !== item.id) add(path, "ownership");
    if (item.laterContest?.triggerStateKey !== owner?.stateWrites?.[0]?.key) add(`${path}.laterContest`, "state_key_mismatch");
    if ((item.activation?.evidence?.length ?? 0) < 3 || (item.activation?.procedure?.length ?? 0) < 60) add(`${path}.activation`, "incomplete");
    if ((item.cost?.limitation?.length ?? 0) < 45 || (item.cost?.worldDebt?.length ?? 0) < 45) add(`${path}.cost`, "incomplete");
  });

  environments.forEach((environment, index) => {
    const path = `environmentBriefs[${index}]`;
    const owner = quests.find((quest) => quest.id === environment.questId);
    const site = siteById.get(environment.siteId);
    if (!owner || owner.environmentId !== environment.id || owner.locationId !== environment.locationId || owner.siteId !== environment.siteId) add(path, "ownership");
    if (environment.coordinate !== null || environment.geometryStatus !== "proposed_topology_not_measured_geometry" || environment.runtimeStatus !== "not_integrated") add(path, "readiness_promotion");
    if (environment.typologyIds?.some((id) => !site?.typologyIds.includes(id))) add(`${path}.typologyIds`, "site_mismatch");
    if ((environment.topology?.nodes?.length ?? 0) < 5 || (environment.topology?.edges?.length ?? 0) < 3) add(`${path}.topology`, "incomplete");
    if ((environment.environmentNeeds?.length ?? 0) < 4 || (environment.utilitiesAndActivity?.length ?? 0) < 4) add(path, "shallow_world_brief");
    if (environment.siteId === "site.cairnmarket" && environment.habitatPlacement !== "proposed_site_local_charnel_presence_requires_independent_review") add(`${path}.habitatPlacement`, "overclaim");
  });

  for (const [field, values] of Object.entries({
    supportingCharacterIds: quests.flatMap(({ supportingCharacterIds = [] }) => supportingCharacterIds),
    signatureItemOwnership: quests.map(({ signatureItemId }) => signatureItemId),
    environmentOwnership: quests.map(({ environmentId }) => environmentId),
    questMechanicIds: quests.map(({ primaryMechanic }) => primaryMechanic.id),
    dilemmaIds: quests.map(({ dilemma }) => dilemma.id),
    locationIds: quests.map(({ locationId }) => locationId),
    stateKeys: quests.flatMap(({ stateWrites }) => stateWrites.map(({ key }) => key)),
    objectiveTopologies: quests.map(({ objectiveTopology }) => objectiveTopology),
    topologyIds: environments.map(({ topology }) => topology.id),
    signatureSerializations: quests.map(({ structuralSignature }) => JSON.stringify(structuralSignature)),
  })) if (duplicateValues(values).length) add(field, "duplicate");

  return errors;
};

assert.equal(QUEST_WAVE_05_CANDIDATE_META.status, "noncanonical_candidate");
assert.equal(QUEST_WAVE_05_CANDIDATE_META.authority, "authored_proposal");
assert.deepEqual(QUEST_WAVE_05_CANDIDATE_META.authorship.reviewerRoles, []);
assert.deepEqual(QUEST_WAVE_05_CANDIDATE_META.authorship.approvalRecords, []);
for (const key of FALSE_CLAIM_KEYS) assert.equal(QUEST_WAVE_05_CANDIDATE_META.claims[key], false, `candidate meta promoted ${key}`);

assert.equal(QUEST_WAVE_05_QUESTS.length, 12);
assert.equal(QUEST_WAVE_05_SUPPORTING_CHARACTERS.length, 12);
assert.equal(QUEST_WAVE_05_SIGNATURE_ITEMS.length, 12);
assert.equal(QUEST_WAVE_05_ENVIRONMENT_BRIEFS.length, 12);
assert.equal(duplicateValues(ids(QUEST_WAVE_05_QUESTS)).length, 0);
assert.equal(duplicateValues(ids(QUEST_WAVE_05_SUPPORTING_CHARACTERS)).length, 0);
assert.equal(duplicateValues(ids(QUEST_WAVE_05_SIGNATURE_ITEMS)).length, 0);
assert.equal(duplicateValues(ids(QUEST_WAVE_05_ENVIRONMENT_BRIEFS)).length, 0);

assert.deepEqual(sorted(QUEST_WAVE_05_ACCEPTED_COLLISION_SCOPE), sorted(EXPANSION_QUESTS.map(({ id }) => id)));
assert.equal(QUEST_WAVE_05_ACCEPTED_COLLISION_SCOPE.length, 49);
assert.deepEqual(sorted(QUEST_WAVE_05_HIGH_RISK_ANALOGUES.map(({ questId }) => questId)), sorted([
  "main_noon_came_bleeding",
  "relic_the_acre_crossed_a_border",
  "faction_the_lantern_named_us_last",
  "main_mercy_has_a_mouth",
  "side_the_disease_called_grief",
  "aftermath_maintenance_window_miracle",
]));

const existingQuestIds = new Set(ids(EXPANSION_QUESTS));
const existingCharacterIds = new Set(ids(EXPANSION_CHARACTERS));
const existingItemIds = new Set(ids(EXPANSION_ITEMS));
assert.ok(QUEST_WAVE_05_QUESTS.every(({ id }) => !existingQuestIds.has(id)));
assert.ok(QUEST_WAVE_05_SUPPORTING_CHARACTERS.every(({ id }) => !existingCharacterIds.has(id)));
assert.ok(QUEST_WAVE_05_SIGNATURE_ITEMS.every(({ id }) => !existingItemIds.has(id)));

const siteCounts = countBy(QUEST_WAVE_05_QUESTS, "siteId");
assert.deepEqual(siteCounts, { "site.salt-watch": 4, "site.cairnmarket": 4, "site.ember-gate": 4 });
for (const siteId of EXPECTED_SITES) {
  const atSite = QUEST_WAVE_05_QUESTS.filter((quest) => quest.siteId === siteId);
  assert.equal(atSite.filter(({ leadFactionId }) => leadFactionId === "lucent_synod").length, 2, `${siteId} Lucent mix`);
  assert.equal(atSite.filter(({ leadFactionId }) => leadFactionId === "charnel_night").length, 2, `${siteId} Charnel mix`);
}
assert.deepEqual(countBy(QUEST_WAVE_05_QUESTS, "portfolioId"), EXPECTED_PORTFOLIO_COUNTS);

const acceptedUsedCreatureIds = new Set(EXPANSION_QUESTS.flatMap(({ creatureIds = [] }) => creatureIds));
const canonicallyUnusedCreatureIds = EXPANSION_CREATURES.filter(({ id }) => !acceptedUsedCreatureIds.has(id)).map(({ id }) => id);
const candidateCreatureIds = QUEST_WAVE_05_QUESTS.flatMap(({ creatureIds }) => creatureIds);
assert.deepEqual(sorted(canonicallyUnusedCreatureIds), EXPECTED_UNUSED_CREATURE_IDS);
assert.deepEqual(sorted(candidateCreatureIds), EXPECTED_UNUSED_CREATURE_IDS);
assert.equal(duplicateValues(candidateCreatureIds).length, 0, "each unused expansion creature must receive exactly one candidate quest use");

const habitatByCreatureId = new Map(EXPANSION_CREATURE_HABITAT_ENVELOPES.map((entry) => [entry.creatureId, entry]));
for (const quest of QUEST_WAVE_05_QUESTS) {
  for (const creatureId of quest.creatureIds) {
    const habitat = habitatByCreatureId.get(creatureId);
    assert.ok(habitat, `${creatureId} habitat exists`);
    if (quest.siteId === "site.cairnmarket" && habitat.siteIds.length === 0) {
      const environment = QUEST_WAVE_05_ENVIRONMENT_BRIEFS.find(({ id }) => id === quest.environmentId);
      assert.equal(environment.habitatPlacement, "proposed_site_local_charnel_presence_requires_independent_review");
      assert.ok(habitat.territoryIds.includes("territory.graven-march"));
    } else {
      assert.ok(habitat.siteIds.includes(quest.siteId), `${creatureId} must have accepted site affinity at ${quest.siteId}`);
    }
  }
}

const acceptedMechanicIds = new Set(EXPANSION_QUESTS.map(({ primaryMechanicId }) => primaryMechanicId));
const acceptedDilemmaIds = new Set(EXPANSION_QUESTS.map(({ dilemmaId }) => dilemmaId));
const acceptedLocationIds = new Set(EXPANSION_QUESTS.map(({ locationId }) => locationId));
assert.ok(QUEST_WAVE_05_QUESTS.every(({ primaryMechanic }) => !acceptedMechanicIds.has(primaryMechanic.id)));
assert.ok(QUEST_WAVE_05_QUESTS.every(({ dilemma }) => !acceptedDilemmaIds.has(dilemma.id)));
assert.ok(QUEST_WAVE_05_QUESTS.every(({ locationId }) => !acceptedLocationIds.has(locationId)));

const validationErrors = validateCandidate(candidatePackage);
assert.deepEqual(validationErrors, [], validationErrors.join("\n"));

const candidatePairs = [];
for (let left = 0; left < QUEST_WAVE_05_QUESTS.length; left += 1) {
  for (let right = left + 1; right < QUEST_WAVE_05_QUESTS.length; right += 1) {
    const leftQuest = QUEST_WAVE_05_QUESTS[left];
    const rightQuest = QUEST_WAVE_05_QUESTS[right];
    candidatePairs.push({
      left: leftQuest.id,
      right: rightQuest.id,
      token: jaccard(questProse(leftQuest), questProse(rightQuest)),
      shingle: shingleJaccard(questProse(leftQuest), questProse(rightQuest)),
    });
  }
}
const maxCandidateToken = candidatePairs.reduce((best, entry) => entry.token > best.token ? entry : best, candidatePairs[0]);
const maxCandidateShingle = candidatePairs.reduce((best, entry) => entry.shingle > best.shingle ? entry : best, candidatePairs[0]);
assert.ok(maxCandidateToken.token < 0.31, `candidate prose token collision ${JSON.stringify(maxCandidateToken)}`);
assert.ok(maxCandidateShingle.shingle < 0.08, `candidate prose shingle collision ${JSON.stringify(maxCandidateShingle)}`);

const acceptedPairs = QUEST_WAVE_05_QUESTS.flatMap((candidate) => EXPANSION_QUESTS.map((accepted) => ({
  candidate: candidate.id,
  accepted: accepted.id,
  token: jaccard(questProse(candidate), acceptedQuestProse(accepted)),
  shingle: shingleJaccard(questProse(candidate), acceptedQuestProse(accepted)),
})));
const maxAcceptedToken = acceptedPairs.reduce((best, entry) => entry.token > best.token ? entry : best, acceptedPairs[0]);
const maxAcceptedShingle = acceptedPairs.reduce((best, entry) => entry.shingle > best.shingle ? entry : best, acceptedPairs[0]);
assert.ok(maxAcceptedToken.token < 0.27, `accepted-corpus token collision ${JSON.stringify(maxAcceptedToken)}`);
assert.ok(maxAcceptedShingle.shingle < 0.045, `accepted-corpus shingle collision ${JSON.stringify(maxAcceptedShingle)}`);

const publicStrings = collectStringEntries(candidatePackage);
const privacyPatterns = [
  { code: "url", regex: /https?:\/\//i },
  { code: "email", regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
  { code: "uuid", regex: /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i },
  { code: "windows_path", regex: /(?:^|[\s"'])\b[A-Za-z]:[\\/]/ },
  { code: "unc_path", regex: /\\\\[^\s\\]+\\[^\s\\]+/ },
  { code: "workstation_path", regex: /\/(?:home|users|workspace|workspaces|mnt|tmp)\//i },
  { code: "external_provider", regex: /\b(?:openai|chatgpt|anthropic|midjourney|google\s+drive)\b/i },
  { code: "signed_query", regex: /\b(?:x-amz-signature|sig|token|session|call_id)=/i },
];
for (const entry of publicStrings) {
  for (const { code, regex } of privacyPatterns) assert.doesNotMatch(entry.value, regex, `${entry.path}:${code}`);
}

assert.equal(QUEST_WAVE_05_ART_AND_REGISTRY_IMPLICATIONS.totalPlannedPngs, 51);
assert.equal(QUEST_WAVE_05_ART_AND_REGISTRY_IMPLICATIONS.creatureArtBaseline.totalPngs, 24);
assert.equal(QUEST_WAVE_05_ART_AND_REGISTRY_IMPLICATIONS.supportingCharacterArtBaseline.totalPngs, 24);
assert.equal(QUEST_WAVE_05_ART_AND_REGISTRY_IMPLICATIONS.environmentArtBaseline.totalPngs, 3);
assert.match(QUEST_WAVE_05_ART_AND_REGISTRY_IMPLICATIONS.sennAvirGate, /reviewed visual brief/i);
for (const key of FALSE_CLAIM_KEYS) assert.equal(QUEST_WAVE_05_ART_AND_REGISTRY_IMPLICATIONS.claims[key], false, `art plan promoted ${key}`);

const fixtureDuplicateQuest = JSON.parse(JSON.stringify(candidatePackage));
fixtureDuplicateQuest.quests[1].id = fixtureDuplicateQuest.quests[0].id;
assert.ok(validateCandidate(fixtureDuplicateQuest).includes("quests:duplicate_id"));

const fixtureReusedSupport = JSON.parse(JSON.stringify(candidatePackage));
fixtureReusedSupport.quests[1].supportingCharacterIds = fixtureReusedSupport.quests[0].supportingCharacterIds;
assert.ok(validateCandidate(fixtureReusedSupport).some((error) => error.includes("supportingCharacterIds:duplicate")));

const fixtureFactionDrift = JSON.parse(JSON.stringify(candidatePackage));
fixtureFactionDrift.quests[0].leadFactionId = "charnel_night";
assert.ok(validateCandidate(fixtureFactionDrift).some((error) => error.includes("giverId:lead_faction_mismatch")));

const fixtureReadinessPromotion = JSON.parse(JSON.stringify(candidatePackage));
fixtureReadinessPromotion.environmentBriefs[0].runtimeStatus = "integrated";
assert.ok(validateCandidate(fixtureReadinessPromotion).some((error) => error.includes("readiness_promotion")));

const fixtureHabitatPromotion = JSON.parse(JSON.stringify(candidatePackage));
fixtureHabitatPromotion.environmentBriefs.find(({ siteId }) => siteId === "site.cairnmarket").habitatPlacement = "supported_by_existing_site_affinity";
assert.ok(validateCandidate(fixtureHabitatPromotion).some((error) => error.includes("habitatPlacement:overclaim")));

const fixtureCollisionScopeLoss = JSON.parse(JSON.stringify(candidatePackage));
fixtureCollisionScopeLoss.quests[0].collisionAnalysis.comparedAcceptedQuestIds.pop();
assert.ok(validateCandidate(fixtureCollisionScopeLoss).some((error) => error.includes("not_full_accepted_scope")));

console.log(JSON.stringify({
  status: "PASS",
  counts: { quests: 12, supportingCharacters: 12, signatureItems: 12, environmentBriefs: 12, creaturesCovered: 18 },
  acceptedCollisionScope: QUEST_WAVE_05_ACCEPTED_COLLISION_SCOPE.length,
  candidatePairComparisons: candidatePairs.length,
  acceptedCorpusComparisons: acceptedPairs.length,
  maximumCandidateTokenJaccard: Number(maxCandidateToken.token.toFixed(4)),
  maximumCandidateTrigramJaccard: Number(maxCandidateShingle.shingle.toFixed(4)),
  maximumAcceptedTokenJaccard: Number(maxAcceptedToken.token.toFixed(4)),
  maximumAcceptedTrigramJaccard: Number(maxAcceptedShingle.shingle.toFixed(4)),
  adversarialFixtures: 6,
}, null, 2));
