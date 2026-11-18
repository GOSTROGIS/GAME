import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
  QUEST_WAVE_05_ACCEPTED_CORPUS_BINDING,
  QUEST_WAVE_05_ACCEPTED_COLLISION_SCOPE,
  QUEST_WAVE_05_ART_AND_REGISTRY_IMPLICATIONS,
  QUEST_WAVE_05_CANDIDATE_META,
  QUEST_WAVE_05_CREATURE_REFERENCE_AUDIT,
  QUEST_WAVE_05_ENVIRONMENT_BRIEFS,
  QUEST_WAVE_05_HIGH_RISK_ANALOGUES,
  QUEST_WAVE_05_RETURNING_CREATURE_ANALOGUES,
  QUEST_WAVE_05_QUESTS,
  QUEST_WAVE_05_SIGNATURE_ITEMS,
  QUEST_WAVE_05_SUPPORTING_CHARACTERS,
  QUEST_WAVE_05_CHARACTER_BY_ID,
  QUEST_WAVE_05_ITEM_BY_ID,
  QUEST_WAVE_05_ENVIRONMENT_BY_ID,
  QUEST_WAVE_05_QUEST_BY_ID,
  questWave05Character,
  questWave05Item,
  questWave05Environment,
  questWave05Quest,
} from "../packages/content/src/quest-wave-05.candidate.js";

const EXPECTED_UNUSED_CREATURE_IDS = [
  "apse_seraph",
  "corridor_maw",
  "door_lung_courser",
  "ember_midwife",
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
];

const EXPECTED_RETURNING_CREATURE_OVERLAY_IDS = ["acre_that_walks", "funeral_kite", "witness_crab"];
const ACCEPTED_CREATURE_REFERENCE_FIELDS = ["creatureIds", "foundingCreatureOverlayIds", "creatureAliasIds"];
const EXPECTED_CAIRNMARKET_PRECINCT_CROSSWALKS = {
  "env.wave05.cairnmarket.exhaled_road_assize": {
    spaces: [["arrival_fan_temporary_safe_stage", "S01"], ["oath_circle", "S10"]],
    nodes: [["arrival_fan_temporary_safe_stage", "N01"], ["oath_circle", "N10"]],
    links: [["L06", "hall apron toward oath circle"], ["L12", "arrival fan toward hall apron"]],
    safeCells: [],
  },
  "env.wave05.cairnmarket.reversible_vow_assize": {
    spaces: [["demonstration_pad", "S03"], ["three_separate_testimony_chairs", "S04"], ["living_gallery_temporary_safe_stage", "S05"], ["appeal_exit", "S07"]],
    nodes: [["demonstration_pad", "N03"], ["three_separate_testimony_chairs", "N04"], ["living_gallery_temporary_safe_stage", "N05"], ["appeal_exit", "N07"]],
    links: [["L02", "witness ring to three ash chairs"], ["L03", "witness ring to living gallery"], ["L05", "witness ring to appeal exit"]],
    safeCells: [["living_gallery_temporary_safe_stage", "SC01"]],
  },
  "env.wave05.cairnmarket.breathless_winter_warning": {
    spaces: [["oath_circle", "S10"], ["market_bay", "S11"], ["family_cairn_gate", "S12"], ["winter_store_temporary_safe_stage", "S13"], ["rear_den_boundary", "S14"]],
    nodes: [["oath_circle", "N10"], ["market_bay", "N11"], ["family_cairn_gate", "N12"], ["winter_store_temporary_safe_stage", "N13"], ["rear_den_boundary", "N14"]],
    links: [["L07", "oath circle to market bay"], ["L08", "oath circle to family cairn"], ["L09", "market bay to winter store"], ["L10", "family cairn to rear den gate"]],
    safeCells: [["winter_store_temporary_safe_stage", "SC03"]],
  },
  "env.wave05.cairnmarket.exterior_front_exchange": {
    spaces: [["living_witness_temporary_safe_stage", "S05"], ["market_exterior_pad", "S11"]],
    nodes: [["living_witness_temporary_safe_stage", "N05"], ["market_exterior_pad", "N11"]],
    links: [],
    safeCells: [["living_witness_temporary_safe_stage", "SC01"]],
  },
};
const REQUIRED_EXACT_ACCEPTED_ANALOGUES = {
  wave05_cairn_exception_wore_wedding_ribs: ["aftermath_cart_accepts_office"],
};
const EXPECTED_TOPOLOGY_EXCLUSIONS = {
  "env.wave05.cairnmarket.exhaled_road_assize": [["sanctuary_fork_interior_exclusion", "X-W05-CM01-01", "sanctuary_fork_boundary", "No public-spine edge, objective, encounter volume, or camera path enters or resolves the protected sanctuary fork."]],
  "env.wave05.cairnmarket.breathless_winter_warning": [["rear_den_protected_route_exclusion", "X-W05-CM03-01", "rear_den_boundary", "No warning test, creature pressure, healing suppression, or final choice may enter or close the protected wildlife route."]],
  "env.wave05.cairnmarket.exterior_front_exchange": [["sealed_maw_interior_exclusion", "X-W05-CM04-01", "sealed_maw_exterior_boundary", "No edge, objective, camera, actor, item, light, or encounter volume crosses the exterior boundary into the Corridor Maw."]],
};

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
const tupleKeys = (records, fields) => sorted(records.map((record) => fields.map((field) => record[field]).join("|")));
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
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]))
    : value;
const acceptedCorpusCanonicalJson = JSON.stringify(canonicalize([...EXPANSION_QUESTS].sort((left, right) => left.id.localeCompare(right.id))));
const acceptedCorpusSha256 = createHash("sha256").update(acceptedCorpusCanonicalJson).digest("hex");
const reachableNodeIds = (topology, startNodeId) => {
  const adjacency = new Map(topology.nodes.map(({ id }) => [id, []]));
  for (const edge of topology.edges) {
    adjacency.get(edge.fromNodeId)?.push(edge.toNodeId);
    adjacency.get(edge.toNodeId)?.push(edge.fromNodeId);
  }
  const reached = new Set(startNodeId ? [startNodeId] : []);
  const pending = startNodeId ? [startNodeId] : [];
  while (pending.length) {
    for (const next of adjacency.get(pending.shift()) ?? []) {
      if (!reached.has(next)) {
        reached.add(next);
        pending.push(next);
      }
    }
  }
  return reached;
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
  const acceptedQuestIds = new Set(ids(EXPANSION_QUESTS));
  const candidateQuestIds = new Set(ids(quests));
  const knownQuestIds = new Set([...acceptedQuestIds, ...candidateQuestIds]);
  const existingCharacterIds = new Set(ids(EXPANSION_CHARACTERS));
  const candidateCharacterIds = new Set(ids(characters));
  const knownCharacterIds = new Set([...existingCharacterIds, ...candidateCharacterIds]);
  const territoryIds = new Set(SITE_SPATIAL_ENVELOPES.map(({ territoryId }) => territoryId));
  const factionIds = new Set(COSMIC_FACTIONS.map(({ id }) => id));
  const creatureIds = new Set(EXPANSION_CREATURES.map(({ id }) => id));
  const portfolioIds = new Set(QUEST_AUTHORING_LAW.portfolioIds);

  quests.forEach((quest, index) => {
    const path = `quests[${index}]`;
    if (!siteById.has(quest.siteId)) add(`${path}.siteId`, "unknown");
    if (!territoryIds.has(quest.territoryId)) add(`${path}.territoryId`, "unknown");
    if (siteById.get(quest.siteId)?.territoryId !== quest.territoryId) add(`${path}.territoryId`, "site_mismatch");
    if (!factionIds.has(quest.leadFactionId)) add(`${path}.leadFactionId`, "unknown");
    if (!portfolioIds.has(quest.portfolioId)) add(`${path}.portfolioId`, "unknown");
    if (giverById.get(quest.giverId)?.factionId !== quest.leadFactionId) add(`${path}.giverId`, "lead_faction_mismatch");
    if (quest.supportingCharacterIds?.length !== 1 || !characterById.has(quest.supportingCharacterIds[0])) add(`${path}.supportingCharacterIds`, "exclusive_reference");
    if (!itemById.has(quest.signatureItemId)) add(`${path}.signatureItemId`, "missing");
    if (!environmentById.has(quest.environmentId)) add(`${path}.environmentId`, "missing");
    for (const field of ACCEPTED_CREATURE_REFERENCE_FIELDS) {
      if (!Array.isArray(quest[field]) || quest[field].some((id) => !creatureIds.has(id))) add(`${path}.${field}`, "unknown_or_missing");
    }
    const structuredCreatureIds = ACCEPTED_CREATURE_REFERENCE_FIELDS.flatMap((field) => quest[field] ?? []);
    if (duplicateValues(structuredCreatureIds).length) add(`${path}.structuredCreatureReferences`, "duplicate_across_fields");
    if (!Array.isArray(quest.prerequisiteQuestIds) || quest.prerequisiteQuestIds.some((id) => !knownQuestIds.has(id) || id === quest.id)) add(`${path}.prerequisiteQuestIds`, "unknown_or_self_reference");
    if (!Array.isArray(quest.returningCharacterIds) || quest.returningCharacterIds.some((id) => !existingCharacterIds.has(id) || candidateCharacterIds.has(id))) add(`${path}.returningCharacterIds`, "unknown_or_candidate_character");
    if (quest.stateWrites?.length !== 1 || quest.stateWrites[0].values?.length !== 3) add(`${path}.stateWrites`, "shape");
    if (sorted(quest.outcomes?.map(({ id }) => id) ?? []).join("|") !== sorted(quest.stateWrites?.[0]?.values ?? []).join("|")) add(`${path}.outcomes`, "state_value_mismatch");
    if ((quest.objectives?.length ?? 0) < 5) add(`${path}.objectives`, "insufficient_depth");
    if (quest.objectives?.some(({ id, type, nodeIds, success, failureCarry }) => !id || !type || !nodeIds?.length || success.length < 24 || failureCarry.length < 24)) add(`${path}.objectives`, "incomplete");
    if (REQUIRED_PROOF_FIELDS.some((field) => (quest.authorshipProof?.[field]?.length ?? 0) < 48)) add(`${path}.authorshipProof`, "incomplete");
    if ((quest.primaryMechanic?.description?.length ?? 0) < 80 || (quest.dilemma?.irreducibleCost?.length ?? 0) < 60) add(path, "shallow_mechanic_or_dilemma");
    if ((quest.decisiveBeat?.length ?? 0) < 80 || (quest.failurePersistence?.length ?? 0) < 80 || (quest.spatialMutation?.length ?? 0) < 60) add(path, "shallow_consequence");
    if (quest.collisionAnalysis?.acceptedCorpusBindingId !== QUEST_WAVE_05_ACCEPTED_CORPUS_BINDING.id || quest.collisionAnalysis?.acceptedCorpusDigestVersion !== QUEST_WAVE_05_ACCEPTED_CORPUS_BINDING.digestVersion || quest.collisionAnalysis?.acceptedCorpusSha256 !== QUEST_WAVE_05_ACCEPTED_CORPUS_BINDING.sha256) add(`${path}.collisionAnalysis`, "corpus_binding_mismatch");
    if (sorted(quest.collisionAnalysis?.comparedAcceptedQuestIds ?? []).join("|") !== sorted(QUEST_WAVE_05_ACCEPTED_CORPUS_BINDING.questIds).join("|")) add(`${path}.collisionAnalysis`, "not_full_accepted_scope");
    if (sorted(quest.collisionAnalysis?.highRiskAnalogueIdsChecked ?? []).join("|") !== sorted(QUEST_WAVE_05_HIGH_RISK_ANALOGUES.map(({ questId }) => questId)).join("|")) add(`${path}.collisionAnalysis`, "not_high_risk_scope");
    if (sorted(quest.collisionAnalysis?.returningCreatureAnalogueIdsChecked ?? []).join("|") !== sorted(QUEST_WAVE_05_RETURNING_CREATURE_ANALOGUES.map(({ id }) => id)).join("|")) add(`${path}.collisionAnalysis`, "not_returning_creature_analogue_scope");
    if ((quest.collisionAnalysis?.nearestAcceptedQuestIds?.length ?? 0) < 2 || (quest.collisionAnalysis?.distinction?.length ?? 0) < 100 || (quest.collisionAnalysis?.uniqueGenome?.length ?? 0) < 40) add(`${path}.collisionAnalysis`, "not_substantive");
    if ((REQUIRED_EXACT_ACCEPTED_ANALOGUES[quest.id] ?? []).some((id) => !quest.collisionAnalysis?.nearestAcceptedQuestIds?.includes(id))) add(`${path}.collisionAnalysis`, "missing_required_exact_analogue");
    if (FALSE_CLAIM_KEYS.some((key) => quest.claims?.[key] !== false)) add(`${path}.claims`, "promotion");
  });

  characters.forEach((character, index) => {
    const path = `supportingCharacters[${index}]`;
    const owner = quests.find((quest) => quest.id === character.questId);
    if (!owner || owner.supportingCharacterIds[0] !== character.id) add(path, "ownership");
    for (const field of ["desire", "fear", "contradiction", "secret", "ownedDecision", "visualBrief"]) if ((character[field]?.length ?? 0) < 55) add(`${path}.${field}`, "shallow");
    if (!character.voice?.cadence || !character.voice?.imagery || !character.voice?.signature) add(`${path}.voice`, "incomplete");
    if (character.pipeline?.conceptMaster !== null || character.pipeline?.transparentCutout !== null || character.pipeline?.staticModel !== null || character.pipeline?.animatedModel !== null) add(`${path}.pipeline`, "unsupported_asset_claim");
    if (FALSE_CLAIM_KEYS.some((key) => character.claims?.[key] !== false)) add(`${path}.claims`, "promotion");
  });

  items.forEach((item, index) => {
    const path = `signatureItems[${index}]`;
    const owner = quests.find((quest) => quest.id === item.questId);
    if (!owner || owner.signatureItemId !== item.id) add(path, "ownership");
    if (!knownCharacterIds.has(item.custody?.defaultHolderId)) add(`${path}.custody.defaultHolderId`, "unknown_holder");
    if (item.laterContest?.triggerStateKey !== owner?.stateWrites?.[0]?.key) add(`${path}.laterContest`, "state_key_mismatch");
    if ((item.activation?.evidence?.length ?? 0) < 3 || (item.activation?.procedure?.length ?? 0) < 60) add(`${path}.activation`, "incomplete");
    if ((item.cost?.limitation?.length ?? 0) < 45 || (item.cost?.worldDebt?.length ?? 0) < 45) add(`${path}.cost`, "incomplete");
    if (FALSE_CLAIM_KEYS.some((key) => item.claims?.[key] !== false)) add(`${path}.claims`, "promotion");
  });

  environments.forEach((environment, index) => {
    const path = `environmentBriefs[${index}]`;
    const owner = quests.find((quest) => quest.id === environment.questId);
    const site = siteById.get(environment.siteId);
    if (!owner || owner.environmentId !== environment.id || owner.locationId !== environment.locationId || owner.siteId !== environment.siteId) add(path, "ownership");
    if (!territoryIds.has(environment.territoryId) || site?.territoryId !== environment.territoryId) add(`${path}.territoryId`, "unknown_or_site_mismatch");
    if (environment.coordinate !== null || environment.geometryStatus !== "proposed_topology_not_measured_geometry" || environment.runtimeStatus !== "not_integrated") add(path, "readiness_promotion");
    if (environment.typologyIds?.some((id) => !site?.typologyIds.includes(id))) add(`${path}.typologyIds`, "site_mismatch");
    const topology = environment.topology;
    if (topology?.schemaVersion !== 2 || (topology?.nodes?.length ?? 0) < 5 || (topology?.edges?.length ?? 0) < 3 || !Array.isArray(topology?.exclusions)) add(`${path}.topology`, "incomplete");
    const nodeIds = topology?.nodes?.map(({ id }) => id) ?? [];
    const nodeIdSet = new Set(nodeIds);
    const edgeIds = topology?.edges?.map(({ id }) => id) ?? [];
    const edgeIdSet = new Set(edgeIds);
    if (duplicateValues(nodeIds).length || duplicateValues(topology?.nodes?.map(({ graphNodeId }) => graphNodeId) ?? []).length || duplicateValues(topology?.nodes?.map(({ stationId }) => stationId) ?? []).length) add(`${path}.topology.nodes`, "duplicate");
    if (duplicateValues(edgeIds).length || duplicateValues(topology?.edges?.map(({ graphLinkId }) => graphLinkId) ?? []).length) add(`${path}.topology.edges`, "duplicate");
    if (topology?.nodes?.some(({ graphNodeId, stationId }) => !/^N-W05-[A-Z0-9]+-\d{2}$/.test(graphNodeId) || !/^S-W05-[A-Z0-9]+-\d{2}$/.test(stationId))) add(`${path}.topology.nodes`, "invalid_crosswalk_id");
    if (topology?.edges?.some(({ graphLinkId, fromNodeId, toNodeId }) => !/^L-W05-[A-Z0-9]+-\d{2}$/.test(graphLinkId) || fromNodeId === toNodeId || !nodeIdSet.has(fromNodeId) || !nodeIdSet.has(toNodeId))) add(`${path}.topology.edges`, "invalid_endpoint");
    const exclusions = topology?.exclusions ?? [];
    const exclusionIds = exclusions.map(({ id }) => id);
    const exclusionRegistryIds = exclusions.map(({ exclusionId }) => exclusionId);
    if (duplicateValues(exclusionIds).length || duplicateValues(exclusionRegistryIds).length) add(`${path}.topology.exclusions`, "duplicate");
    if (exclusions.some(({ id, exclusionId, anchorNodeId, rule, status }) => !id || !/^X-W05-[A-Z0-9]+-\d{2}$/.test(exclusionId) || !nodeIdSet.has(anchorNodeId) || id === anchorNodeId || nodeIdSet.has(id) || edgeIdSet.has(id) || id === exclusionId || !rule?.trim() || status !== "proposal_guardrail_not_runtime_volume")) add(`${path}.topology.exclusions`, "invalid_or_not_disjoint");
    const expectedExclusions = EXPECTED_TOPOLOGY_EXCLUSIONS[environment.id] ?? [];
    if (tupleKeys(exclusions, ["id", "exclusionId", "anchorNodeId", "rule"]).join("|") !== sorted(expectedExclusions.map((entry) => entry.join("|"))).join("|")) add(`${path}.topology.exclusions`, "not_exact");
    const crosswalk = topology?.crosswalk;
    const stationCrosswalk = crosswalk?.stations ?? [];
    const nodeCrosswalk = crosswalk?.nodes ?? [];
    const linkCrosswalk = crosswalk?.links ?? [];
    const expectedStationPairs = tupleKeys(topology?.nodes ?? [], ["id", "stationId"]);
    const expectedNodePairs = tupleKeys(topology?.nodes ?? [], ["id", "graphNodeId"]);
    const expectedLinkPairs = tupleKeys(topology?.edges ?? [], ["id", "graphLinkId"]);
    if (crosswalk?.namespace !== "wave05_candidate_local_nonregistered"
      || tupleKeys(stationCrosswalk, ["semanticNodeId", "id"]).join("|") !== expectedStationPairs.join("|")
      || tupleKeys(nodeCrosswalk, ["semanticNodeId", "id"]).join("|") !== expectedNodePairs.join("|")
      || tupleKeys(linkCrosswalk, ["topologyEdgeId", "id"]).join("|") !== expectedLinkPairs.join("|")) add(`${path}.topology.crosswalk`, "not_exact");
    const safeStages = crosswalk?.safeStages ?? [];
    const safeStage = safeStages[0];
    if (safeStages.length !== 1 || !/^SC-W05-[A-Z0-9]+-01$/.test(safeStage?.id ?? "") || safeStage?.registeredSafeCellId !== null || safeStage?.registryStatus !== "nonregistered_temporary_quest_safe_stage" || !nodeIdSet.has(safeStage?.semanticNodeId) || !topology.nodes.some(({ id, graphNodeId, role }) => id === safeStage.semanticNodeId && graphNodeId === safeStage.graphNodeId && role === "temporary_quest_safe_stage")) add(`${path}.topology.crosswalk.safeStages`, "false_or_invalid_safe_cell_claim");
    if ((topology?.registeredSafeCellClaims?.length ?? -1) !== 0) add(`${path}.topology.registeredSafeCellClaims`, "unsupported_claim");
    const reached = reachableNodeIds(topology, safeStage?.semanticNodeId);
    if (reached.size !== nodeIds.length) add(`${path}.topology`, "disconnected_from_temporary_safe_stage");
    const objectiveNodeIds = owner?.objectives?.flatMap(({ nodeIds: refs = [] }) => refs) ?? [];
    if (objectiveNodeIds.some((id) => !nodeIdSet.has(id))) add(`${path}.topology`, "unknown_objective_node_reference");
    if (objectiveNodeIds.some((id) => !reached.has(id))) add(`${path}.topology`, "objective_unreachable_from_temporary_safe_stage");
    if ((environment.environmentNeeds?.length ?? 0) < 4 || (environment.utilitiesAndActivity?.length ?? 0) < 4) add(path, "shallow_world_brief");
    if (environment.siteId === "site.cairnmarket" && environment.habitatPlacement !== "proposed_site_local_charnel_presence_requires_independent_review") add(`${path}.habitatPlacement`, "overclaim");
    if (FALSE_CLAIM_KEYS.some((key) => environment.claims?.[key] !== false)) add(`${path}.claims`, "promotion");
    if (environment.siteId === "site.cairnmarket" && !environment.topology.crosswalk.acceptedPrecinct) add(`${path}.topology.crosswalk.acceptedPrecinct`, "missing");
    if (environment.id === "env.wave05.cairnmarket.exhaled_road_assize") {
      const boundary = topology.routeIdentityBoundary;
      if (boundary?.acceptedModeledApproach !== "Bellwater Road" || boundary?.canonicalAccessSemantic !== "Crown Road access" || boundary?.candidateConnector !== "Cairnmarket arrival fan" || boundary?.relationship !== "unresolved_do_not_alias" || boundary?.geometryClaim !== false) add(`${path}.topology.routeIdentityBoundary`, "road_identity_promotion");
    }
    const expectedPrecinct = EXPECTED_CAIRNMARKET_PRECINCT_CROSSWALKS[environment.id];
    const acceptedPrecinct = crosswalk?.acceptedPrecinct;
    if (expectedPrecinct) {
      if (acceptedPrecinct?.status !== "precinct_proposal_ids_only_not_registration_or_geometry"
        || tupleKeys(acceptedPrecinct?.spaces ?? [], ["semanticNodeId", "precinctSpaceId"]).join("|") !== sorted(expectedPrecinct.spaces.map((entry) => entry.join("|"))).join("|")
        || tupleKeys(acceptedPrecinct?.nodes ?? [], ["semanticNodeId", "precinctNodeId"]).join("|") !== sorted(expectedPrecinct.nodes.map((entry) => entry.join("|"))).join("|")
        || tupleKeys(acceptedPrecinct?.links ?? [], ["precinctLinkId", "purpose"]).join("|") !== sorted(expectedPrecinct.links.map((entry) => entry.join("|"))).join("|")
        || tupleKeys(acceptedPrecinct?.safeCellCandidates ?? [], ["semanticNodeId", "id"]).join("|") !== sorted(expectedPrecinct.safeCells.map((entry) => entry.join("|"))).join("|")) add(`${path}.topology.crosswalk.acceptedPrecinct`, "not_exact");
    } else if (acceptedPrecinct !== null) add(`${path}.topology.crosswalk.acceptedPrecinct`, "unexpected");
  });

  const batchLocalIds = {
    stationIds: environments.flatMap(({ topology }) => topology?.nodes?.map(({ stationId }) => stationId) ?? []),
    graphNodeIds: environments.flatMap(({ topology }) => topology?.nodes?.map(({ graphNodeId }) => graphNodeId) ?? []),
    graphLinkIds: environments.flatMap(({ topology }) => topology?.edges?.map(({ graphLinkId }) => graphLinkId) ?? []),
    safeStageIds: environments.flatMap(({ topology }) => topology?.crosswalk?.safeStages?.map(({ id }) => id) ?? []),
    exclusionRegistryIds: environments.flatMap(({ topology }) => topology?.exclusions?.map(({ exclusionId }) => exclusionId) ?? []),
  };
  for (const [field, values] of Object.entries(batchLocalIds)) if (duplicateValues(values).length) add(`environmentBriefs.${field}`, "batch_duplicate");
  const allBatchLocalIds = Object.values(batchLocalIds).flat();
  if (duplicateValues(allBatchLocalIds).length) add("environmentBriefs.topologyIdentifiers", "batch_cross_namespace_collision");
  const allSemanticExclusionIds = environments.flatMap(({ topology }) => topology?.exclusions?.map(({ id }) => id) ?? []);
  const allSemanticTopologyIds = environments.flatMap(({ topology }) => [...(topology?.nodes?.map(({ id }) => id) ?? []), ...(topology?.edges?.map(({ id }) => id) ?? [])]);
  if (duplicateValues(allSemanticExclusionIds).length || allSemanticExclusionIds.some((id) => allSemanticTopologyIds.includes(id))) add("environmentBriefs.exclusionIds", "batch_duplicate_or_not_disjoint");

  for (const sitePlan of pkg.meta?.sitePlan ?? []) {
    if (siteById.get(sitePlan.siteId)?.territoryId !== sitePlan.territoryId) add(`meta.sitePlan.${sitePlan.siteId}`, "territory_mismatch");
  }

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
    structuredCreatureReferences: quests.flatMap((quest) => ACCEPTED_CREATURE_REFERENCE_FIELDS.flatMap((field) => quest[field] ?? [])),
    signatureSerializations: quests.map(({ structuralSignature }) => JSON.stringify(structuralSignature)),
  })) if (duplicateValues(values).length) add(field, "duplicate");

  const artPlan = pkg.artAndRegistryImplications ?? {};
  const creatureArt = artPlan.creatureArtBaseline ?? {};
  const creatureWorkOrders = creatureArt.workOrders ?? [];
  const orderedCreatureIds = creatureWorkOrders.flatMap(({ creatureIds: workOrderCreatureIds = [] }) => workOrderCreatureIds);
  const returningOverlayReuse = creatureArt.returningOverlayReuse ?? [];
  const allowedAssetKinds = new Set(["concept_master", "transparent_cutout"]);
  const creatureById = new Map(EXPANSION_CREATURES.map((creature) => [creature.id, creature]));
  const derivedCreaturePngs = creatureWorkOrders.reduce((total, { creatureIds: workOrderCreatureIds = [], requestedAfterAcceptance = [] }) => total + workOrderCreatureIds.length * requestedAfterAcceptance.length, 0);
  if (creatureWorkOrders.some(({ creatureIds: workOrderCreatureIds = [], requestedAfterAcceptance = [] }) => workOrderCreatureIds.length > 6 || !workOrderCreatureIds.length || !requestedAfterAcceptance.length || duplicateValues(requestedAfterAcceptance).length || requestedAfterAcceptance.some((kind) => !allowedAssetKinds.has(kind)))) add("artAndRegistryImplications.creatureArtBaseline.workOrders", "invalid");
  if (creatureWorkOrders.some(({ familyId, creatureIds: workOrderCreatureIds = [], requestedAfterAcceptance = [] }) => workOrderCreatureIds.some((id) => {
    const creature = creatureById.get(id);
    const expectedKinds = creature?.pipeline?.conceptMaster ? ["transparent_cutout"] : ["concept_master", "transparent_cutout"];
    return creature?.familyId !== familyId || sorted(requestedAfterAcceptance).join("|") !== sorted(expectedKinds).join("|");
  }))) add("artAndRegistryImplications.creatureArtBaseline.workOrders", "family_or_asset_kind_mismatch");
  if (duplicateValues(orderedCreatureIds).length || sorted(orderedCreatureIds).join("|") !== sorted(EXPECTED_UNUSED_CREATURE_IDS).join("|")) add("artAndRegistryImplications.creatureArtBaseline.workOrders", "not_exact_unused_partition");
  if (orderedCreatureIds.some((id) => returningOverlayReuse.includes(id)) || sorted(returningOverlayReuse).join("|") !== sorted(EXPECTED_RETURNING_CREATURE_OVERLAY_IDS).join("|")) add("artAndRegistryImplications.creatureArtBaseline.returningOverlayReuse", "duplicate_order_or_not_exact");
  if (creatureArt.totalPngs !== derivedCreaturePngs) add("artAndRegistryImplications.creatureArtBaseline.totalPngs", "not_derived");
  const supportingArt = artPlan.supportingCharacterArtBaseline ?? {};
  const supportingWorkOrders = supportingArt.workOrders ?? [];
  const orderedSupportingCharacterIds = supportingWorkOrders.flatMap(({ characterIds = [] }) => characterIds);
  const characterPipelineById = new Map(characters.map((character) => [character.id, character.pipeline]));
  const derivedSupportingCharacterPngs = supportingWorkOrders.reduce((total, { characterIds = [], requestedAfterAcceptance = [] }) => total + characterIds.length * requestedAfterAcceptance.length, 0);
  if (duplicateValues(supportingWorkOrders.map(({ id }) => id)).length || supportingWorkOrders.some(({ id, family, maximumSubjects, characterIds = [], requestedAfterAcceptance = [] }) => !id || maximumSubjects !== 6 || !characterIds.length || characterIds.length > maximumSubjects || sorted(requestedAfterAcceptance).join("|") !== "concept_master|transparent_cutout" || characterIds.some((characterId) => characterPipelineById.get(characterId)?.family !== family))) add("artAndRegistryImplications.supportingCharacterArtBaseline.workOrders", "invalid");
  if (duplicateValues(orderedSupportingCharacterIds).length || sorted(orderedSupportingCharacterIds).join("|") !== sorted(ids(characters)).join("|")) add("artAndRegistryImplications.supportingCharacterArtBaseline.workOrders", "not_exact_character_partition");
  const supportingFamilyCounts = countBy(characters.map(({ pipeline }) => ({ family: pipeline.family })), "family");
  for (const [family, count] of Object.entries(supportingFamilyCounts)) if (supportingWorkOrders.filter((workOrder) => workOrder.family === family).length !== Math.ceil(count / 6)) add(`artAndRegistryImplications.supportingCharacterArtBaseline.workOrders.${family}`, "wrong_split_count");
  if (supportingArt.totalPngs !== derivedSupportingCharacterPngs) add("artAndRegistryImplications.supportingCharacterArtBaseline.totalPngs", "not_derived");
  const environmentSiteIds = sorted([...new Set(environments.map(({ siteId }) => siteId))]);
  const expectedEnvironmentReferences = environmentSiteIds.map((siteId) => `${siteId} keyframe`);
  const environmentReferences = artPlan.environmentArtBaseline?.references ?? [];
  const derivedEnvironmentPngs = environmentSiteIds.length;
  if (duplicateValues(environmentReferences).length || sorted(environmentReferences).join("|") !== expectedEnvironmentReferences.join("|") || artPlan.environmentArtBaseline?.totalPngs !== derivedEnvironmentPngs) add("artAndRegistryImplications.environmentArtBaseline", "not_derived_or_not_exact");
  if (artPlan.totalPlannedPngs !== derivedCreaturePngs + derivedSupportingCharacterPngs + derivedEnvironmentPngs) add("artAndRegistryImplications.totalPlannedPngs", "not_derived");

  return errors;
};

assert.equal(QUEST_WAVE_05_CANDIDATE_META.status, "noncanonical_candidate");
assert.equal(QUEST_WAVE_05_CANDIDATE_META.authority, "authored_proposal");
assert.equal(QUEST_WAVE_05_CANDIDATE_META.counts.genuinelyUnusedExpansionCreatures, 15);
assert.equal(QUEST_WAVE_05_CANDIDATE_META.counts.returningCreatureOverlays, 3);
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

assert.equal(QUEST_WAVE_05_ACCEPTED_CORPUS_BINDING.id, "accepted-expansion-quest-corpus-49-wave05-v1");
assert.equal(QUEST_WAVE_05_ACCEPTED_CORPUS_BINDING.digestVersion, "recursive-key-sorted-canonical-json-v1");
assert.equal(QUEST_WAVE_05_ACCEPTED_CORPUS_BINDING.digestAlgorithm, "sha256");
assert.equal(QUEST_WAVE_05_ACCEPTED_CORPUS_BINDING.canonicalJsonBytes, Buffer.byteLength(acceptedCorpusCanonicalJson));
assert.equal(QUEST_WAVE_05_ACCEPTED_CORPUS_BINDING.sha256, acceptedCorpusSha256);
assert.deepEqual(QUEST_WAVE_05_ACCEPTED_CORPUS_BINDING.structuredCreatureReferenceFields, ACCEPTED_CREATURE_REFERENCE_FIELDS);
assert.deepEqual(QUEST_WAVE_05_ACCEPTED_CORPUS_BINDING.questIds, sorted(EXPANSION_QUESTS.map(({ id }) => id)));
assert.deepEqual(sorted(QUEST_WAVE_05_ACCEPTED_COLLISION_SCOPE), sorted(EXPANSION_QUESTS.map(({ id }) => id)));
assert.deepEqual(QUEST_WAVE_05_ACCEPTED_COLLISION_SCOPE, QUEST_WAVE_05_ACCEPTED_CORPUS_BINDING.questIds);
assert.equal(QUEST_WAVE_05_ACCEPTED_COLLISION_SCOPE.length, 49);
assert.deepEqual(sorted(QUEST_WAVE_05_HIGH_RISK_ANALOGUES.map(({ questId }) => questId)), sorted([
  "main_noon_came_bleeding",
  "relic_the_acre_crossed_a_border",
  "faction_the_lantern_named_us_last",
  "main_mercy_has_a_mouth",
  "side_the_disease_called_grief",
  "aftermath_maintenance_window_miracle",
  "aftermath_cart_accepts_office",
]));
const weddingRibsQuest = QUEST_WAVE_05_QUESTS.find(({ id }) => id === "wave05_cairn_exception_wore_wedding_ribs");
assert.ok(weddingRibsQuest?.collisionAnalysis.nearestAcceptedQuestIds.includes("aftermath_cart_accepts_office"), "wedding-ribs quest must name the Cart assize precedent");
assert.equal(QUEST_WAVE_05_RETURNING_CREATURE_ANALOGUES.length, 3);
assert.deepEqual(sorted(QUEST_WAVE_05_RETURNING_CREATURE_ANALOGUES.map(({ creatureId }) => creatureId)), sorted(EXPECTED_RETURNING_CREATURE_OVERLAY_IDS));
for (const analogue of QUEST_WAVE_05_RETURNING_CREATURE_ANALOGUES) {
  const accepted = EXPANSION_QUESTS.find(({ id }) => id === analogue.acceptedQuestId);
  const candidate = QUEST_WAVE_05_QUESTS.find(({ id }) => id === analogue.candidateQuestId);
  assert.ok(accepted?.[analogue.acceptedReferenceField]?.includes(analogue.creatureId), `${analogue.id} accepted structured reference`);
  assert.ok(candidate?.[analogue.candidateReferenceField]?.includes(analogue.creatureId), `${analogue.id} candidate structured reference`);
  assert.ok(candidate?.collisionAnalysis.nearestAcceptedQuestIds.includes(analogue.acceptedQuestId), `${analogue.id} exact analogue named`);
  assert.equal(candidate?.collisionAnalysis.returningCreatureAnalogueId, analogue.id);
  assert.ok(analogue.authoredDistinction.length > 220, `${analogue.id} authored distinction`);
}

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

for (const environment of QUEST_WAVE_05_ENVIRONMENT_BRIEFS) {
  const acceptedPrecinct = environment.topology.crosswalk.acceptedPrecinct;
  const expected = EXPECTED_CAIRNMARKET_PRECINCT_CROSSWALKS[environment.id];
  if (!expected) {
    assert.equal(acceptedPrecinct, null, `${environment.id} must not claim a Cairnmarket precinct crosswalk`);
    continue;
  }
  assert.equal(acceptedPrecinct.status, "precinct_proposal_ids_only_not_registration_or_geometry");
  assert.deepEqual(tupleKeys(acceptedPrecinct.spaces, ["semanticNodeId", "precinctSpaceId"]), sorted(expected.spaces.map((entry) => entry.join("|"))));
  assert.deepEqual(tupleKeys(acceptedPrecinct.nodes, ["semanticNodeId", "precinctNodeId"]), sorted(expected.nodes.map((entry) => entry.join("|"))));
  assert.deepEqual(tupleKeys(acceptedPrecinct.links, ["precinctLinkId", "purpose"]), sorted(expected.links.map((entry) => entry.join("|"))));
  assert.deepEqual(tupleKeys(acceptedPrecinct.safeCellCandidates, ["semanticNodeId", "id"]), sorted(expected.safeCells.map((entry) => entry.join("|"))));
  assert.ok(acceptedPrecinct.safeCellCandidates.every(({ status }) => status === "precinct_proposal_not_registered"));
}

const acceptedUsedCreatureIds = new Set(EXPANSION_QUESTS.flatMap((quest) => ACCEPTED_CREATURE_REFERENCE_FIELDS.flatMap((field) => quest[field] ?? [])));
const canonicallyUnusedCreatureIds = EXPANSION_CREATURES.filter(({ id }) => !acceptedUsedCreatureIds.has(id)).map(({ id }) => id);
const candidateCreatureIds = QUEST_WAVE_05_QUESTS.flatMap(({ creatureIds }) => creatureIds);
const candidateReturningOverlayIds = QUEST_WAVE_05_QUESTS.flatMap(({ foundingCreatureOverlayIds }) => foundingCreatureOverlayIds);
const candidateAliasIds = QUEST_WAVE_05_QUESTS.flatMap(({ creatureAliasIds }) => creatureAliasIds);
const allCandidateStructuredCreatureIds = QUEST_WAVE_05_QUESTS.flatMap((quest) => ACCEPTED_CREATURE_REFERENCE_FIELDS.flatMap((field) => quest[field]));
assert.deepEqual(sorted(canonicallyUnusedCreatureIds), EXPECTED_UNUSED_CREATURE_IDS);
assert.deepEqual(sorted(candidateCreatureIds), EXPECTED_UNUSED_CREATURE_IDS);
assert.equal(QUEST_WAVE_05_CREATURE_REFERENCE_AUDIT.acceptedCorpusBindingId, QUEST_WAVE_05_ACCEPTED_CORPUS_BINDING.id);
assert.deepEqual(QUEST_WAVE_05_CREATURE_REFERENCE_AUDIT.inspectedAcceptedFields, ACCEPTED_CREATURE_REFERENCE_FIELDS);
assert.deepEqual(QUEST_WAVE_05_CREATURE_REFERENCE_AUDIT.genuinelyUnusedCreatureIds, EXPECTED_UNUSED_CREATURE_IDS);
assert.deepEqual(sorted(QUEST_WAVE_05_CREATURE_REFERENCE_AUDIT.returningOverlayCreatureIds), sorted(EXPECTED_RETURNING_CREATURE_OVERLAY_IDS));
assert.deepEqual(sorted(candidateReturningOverlayIds), sorted(EXPECTED_RETURNING_CREATURE_OVERLAY_IDS));
assert.deepEqual(candidateAliasIds, [], "Wave 05 does not spend creature coverage through aliases");
assert.ok(candidateReturningOverlayIds.every((id) => acceptedUsedCreatureIds.has(id)), "returning overlays must already be used through accepted structured fields");
assert.equal(duplicateValues(candidateCreatureIds).length, 0, "each unused expansion creature must receive exactly one candidate quest use");
assert.equal(duplicateValues(candidateReturningOverlayIds).length, 0, "each returning overlay must receive exactly one exact-analogue candidate use");
assert.equal(duplicateValues(allCandidateStructuredCreatureIds).length, 0, "structured creature references must be unique across direct, overlay, and alias fields");

const habitatByCreatureId = new Map(EXPANSION_CREATURE_HABITAT_ENVELOPES.map((entry) => [entry.creatureId, entry]));
for (const quest of QUEST_WAVE_05_QUESTS) {
  const structuredCreatureIds = ACCEPTED_CREATURE_REFERENCE_FIELDS.flatMap((field) => quest[field]);
  for (const creatureId of structuredCreatureIds) {
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

for (const [records, lookup, get] of [
  [QUEST_WAVE_05_SUPPORTING_CHARACTERS, QUEST_WAVE_05_CHARACTER_BY_ID, questWave05Character],
  [QUEST_WAVE_05_SIGNATURE_ITEMS, QUEST_WAVE_05_ITEM_BY_ID, questWave05Item],
  [QUEST_WAVE_05_ENVIRONMENT_BRIEFS, QUEST_WAVE_05_ENVIRONMENT_BY_ID, questWave05Environment],
  [QUEST_WAVE_05_QUESTS, QUEST_WAVE_05_QUEST_BY_ID, questWave05Quest],
]) {
  assert.equal(lookup instanceof Map, false, "lookup must not expose mutable Map methods");
  assert.ok(Object.isFrozen(lookup), "lookup object must be frozen");
  assert.deepEqual(sorted(Object.keys(lookup)), sorted(ids(records)));
  assert.equal(get(records[0].id), records[0]);
  assert.equal(get("wave05_missing_lookup_id"), null);
  assert.equal(get("__proto__"), null);
  assert.equal(get("toString"), null);
  assert.throws(() => { lookup.wave05_mutation_probe = records[0]; }, TypeError);
}

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

const creatureWorkOrders = QUEST_WAVE_05_ART_AND_REGISTRY_IMPLICATIONS.creatureArtBaseline.workOrders;
const workOrderCreatureIds = creatureWorkOrders.flatMap(({ creatureIds }) => creatureIds);
const derivedCreaturePngs = creatureWorkOrders.reduce((total, { creatureIds, requestedAfterAcceptance }) => total + creatureIds.length * requestedAfterAcceptance.length, 0);
const supportingCharacterWorkOrders = QUEST_WAVE_05_ART_AND_REGISTRY_IMPLICATIONS.supportingCharacterArtBaseline.workOrders;
const workOrderSupportingCharacterIds = supportingCharacterWorkOrders.flatMap(({ characterIds }) => characterIds);
const derivedSupportingCharacterPngs = supportingCharacterWorkOrders.reduce((total, { characterIds, requestedAfterAcceptance }) => total + characterIds.length * requestedAfterAcceptance.length, 0);
const derivedEnvironmentPngs = new Set(QUEST_WAVE_05_ENVIRONMENT_BRIEFS.map(({ siteId }) => siteId)).size;
assert.equal(QUEST_WAVE_05_ART_AND_REGISTRY_IMPLICATIONS.totalPlannedPngs, derivedCreaturePngs + derivedSupportingCharacterPngs + derivedEnvironmentPngs);
assert.equal(QUEST_WAVE_05_ART_AND_REGISTRY_IMPLICATIONS.creatureArtBaseline.totalPngs, derivedCreaturePngs);
assert.equal(derivedCreaturePngs, 18);
assert.deepEqual(sorted(workOrderCreatureIds), EXPECTED_UNUSED_CREATURE_IDS);
assert.equal(duplicateValues(workOrderCreatureIds).length, 0);
assert.ok(workOrderCreatureIds.every((id) => !EXPECTED_RETURNING_CREATURE_OVERLAY_IDS.includes(id)));
assert.deepEqual(sorted(QUEST_WAVE_05_ART_AND_REGISTRY_IMPLICATIONS.creatureArtBaseline.returningOverlayReuse), sorted(EXPECTED_RETURNING_CREATURE_OVERLAY_IDS));
assert.equal(QUEST_WAVE_05_ART_AND_REGISTRY_IMPLICATIONS.supportingCharacterArtBaseline.totalPngs, derivedSupportingCharacterPngs);
assert.equal(derivedSupportingCharacterPngs, 24);
assert.deepEqual(sorted(workOrderSupportingCharacterIds), sorted(ids(QUEST_WAVE_05_SUPPORTING_CHARACTERS)));
assert.equal(duplicateValues(workOrderSupportingCharacterIds).length, 0);
assert.ok(supportingCharacterWorkOrders.every(({ maximumSubjects, characterIds, requestedAfterAcceptance }) => maximumSubjects === 6 && characterIds.length <= maximumSubjects && sorted(requestedAfterAcceptance).join("|") === "concept_master|transparent_cutout"));
assert.equal(QUEST_WAVE_05_ART_AND_REGISTRY_IMPLICATIONS.environmentArtBaseline.totalPngs, derivedEnvironmentPngs);
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

const fixtureCorpusDigestDrift = JSON.parse(JSON.stringify(candidatePackage));
fixtureCorpusDigestDrift.quests[0].collisionAnalysis.acceptedCorpusSha256 = "0".repeat(64);
assert.ok(validateCandidate(fixtureCorpusDigestDrift).some((error) => error.includes("corpus_binding_mismatch")));

const fixtureUnknownHolder = JSON.parse(JSON.stringify(candidatePackage));
fixtureUnknownHolder.signatureItems[0].custody.defaultHolderId = "unknown_holder";
assert.ok(validateCandidate(fixtureUnknownHolder).some((error) => error.includes("unknown_holder")));

const fixtureTerritoryDrift = JSON.parse(JSON.stringify(candidatePackage));
fixtureTerritoryDrift.quests[0].territoryId = "territory.graven-march";
assert.ok(validateCandidate(fixtureTerritoryDrift).some((error) => error.includes("territoryId:site_mismatch")));

const fixtureUnknownPrerequisite = JSON.parse(JSON.stringify(candidatePackage));
fixtureUnknownPrerequisite.quests[0].prerequisiteQuestIds = ["unknown_quest"];
assert.ok(validateCandidate(fixtureUnknownPrerequisite).some((error) => error.includes("prerequisiteQuestIds:unknown_or_self_reference")));

const fixtureUnknownReturningCharacter = JSON.parse(JSON.stringify(candidatePackage));
fixtureUnknownReturningCharacter.quests[0].returningCharacterIds = ["unknown_character"];
assert.ok(validateCandidate(fixtureUnknownReturningCharacter).some((error) => error.includes("returningCharacterIds:unknown_or_candidate_character")));

const fixtureBrokenEdgeEndpoint = JSON.parse(JSON.stringify(candidatePackage));
fixtureBrokenEdgeEndpoint.environmentBriefs[0].topology.edges[0].toNodeId = "missing_node";
assert.ok(validateCandidate(fixtureBrokenEdgeEndpoint).some((error) => error.includes("topology.edges:invalid_endpoint")));

const fixtureDisconnectedSafeStage = JSON.parse(JSON.stringify(candidatePackage));
fixtureDisconnectedSafeStage.environmentBriefs[0].topology.edges = fixtureDisconnectedSafeStage.environmentBriefs[0].topology.edges.filter(({ fromNodeId, toNodeId }) => !fromNodeId.includes("wind_lock_temporary_safe_stage") && !toNodeId.includes("wind_lock_temporary_safe_stage"));
fixtureDisconnectedSafeStage.environmentBriefs[0].topology.crosswalk.links = fixtureDisconnectedSafeStage.environmentBriefs[0].topology.crosswalk.links.filter(({ topologyEdgeId }) => fixtureDisconnectedSafeStage.environmentBriefs[0].topology.edges.some(({ id }) => id === topologyEdgeId));
assert.ok(validateCandidate(fixtureDisconnectedSafeStage).some((error) => error.includes("disconnected_from_temporary_safe_stage")));

const fixtureFalseRegisteredSafeCell = JSON.parse(JSON.stringify(candidatePackage));
fixtureFalseRegisteredSafeCell.environmentBriefs[0].topology.crosswalk.safeStages[0].registeredSafeCellId = "safe_cell.fabricated";
assert.ok(validateCandidate(fixtureFalseRegisteredSafeCell).some((error) => error.includes("false_or_invalid_safe_cell_claim")));

const fixtureUnknownObjectiveNode = JSON.parse(JSON.stringify(candidatePackage));
fixtureUnknownObjectiveNode.quests[0].objectives[0].nodeIds = ["missing_node"];
assert.ok(validateCandidate(fixtureUnknownObjectiveNode).some((error) => error.includes("unknown_objective_node_reference")));

const fixtureRoadIdentityAlias = JSON.parse(JSON.stringify(candidatePackage));
fixtureRoadIdentityAlias.environmentBriefs.find(({ id }) => id === "env.wave05.cairnmarket.exhaled_road_assize").topology.routeIdentityBoundary.relationship = "same_road";
assert.ok(validateCandidate(fixtureRoadIdentityAlias).some((error) => error.includes("road_identity_promotion")));

const fixtureWeddingCartAnalogueLoss = JSON.parse(JSON.stringify(candidatePackage));
fixtureWeddingCartAnalogueLoss.quests.find(({ id }) => id === "wave05_cairn_exception_wore_wedding_ribs").collisionAnalysis.nearestAcceptedQuestIds = ["main_the_saint_cast_two_shadows", "side_the_dead_vote_no"];
assert.ok(validateCandidate(fixtureWeddingCartAnalogueLoss).some((error) => error.includes("missing_required_exact_analogue")));

const fixtureAliasFieldDuplicate = JSON.parse(JSON.stringify(candidatePackage));
const aliasDuplicateQuest = fixtureAliasFieldDuplicate.quests.find(({ creatureIds }) => creatureIds.length);
aliasDuplicateQuest.creatureAliasIds = [aliasDuplicateQuest.creatureIds[0]];
assert.ok(validateCandidate(fixtureAliasFieldDuplicate).some((error) => error.includes("structuredCreatureReferences:duplicate")));

const fixtureCrosswalkStationMismatch = JSON.parse(JSON.stringify(candidatePackage));
fixtureCrosswalkStationMismatch.environmentBriefs[0].topology.crosswalk.stations[0].id = "S-W05-FABRICATED-99";
assert.ok(validateCandidate(fixtureCrosswalkStationMismatch).some((error) => error.includes("topology.crosswalk:not_exact")));

const fixtureDuplicateBatchStationId = JSON.parse(JSON.stringify(candidatePackage));
const duplicatedStationId = fixtureDuplicateBatchStationId.environmentBriefs[0].topology.nodes[0].stationId;
fixtureDuplicateBatchStationId.environmentBriefs[1].topology.nodes[0].stationId = duplicatedStationId;
fixtureDuplicateBatchStationId.environmentBriefs[1].topology.crosswalk.stations[0].id = duplicatedStationId;
assert.ok(validateCandidate(fixtureDuplicateBatchStationId).some((error) => error.includes("stationIds:batch_duplicate")));

const fixturePrecinctPairSwap = JSON.parse(JSON.stringify(candidatePackage));
const precinctSpaces = fixturePrecinctPairSwap.environmentBriefs.find(({ id }) => id === "env.wave05.cairnmarket.exhaled_road_assize").topology.crosswalk.acceptedPrecinct.spaces;
[precinctSpaces[0].precinctSpaceId, precinctSpaces[1].precinctSpaceId] = [precinctSpaces[1].precinctSpaceId, precinctSpaces[0].precinctSpaceId];
assert.ok(validateCandidate(fixturePrecinctPairSwap).some((error) => error.includes("acceptedPrecinct:not_exact")));

const fixtureExclusionCollision = JSON.parse(JSON.stringify(candidatePackage));
const exclusionTopology = fixtureExclusionCollision.environmentBriefs.find(({ topology }) => topology.exclusions.length).topology;
exclusionTopology.exclusions[0].id = exclusionTopology.exclusions[0].anchorNodeId;
assert.ok(validateCandidate(fixtureExclusionCollision).some((error) => error.includes("exclusions:invalid_or_not_disjoint")));

const fixtureWrongExclusionAnchor = JSON.parse(JSON.stringify(candidatePackage));
fixtureWrongExclusionAnchor.environmentBriefs.find(({ id }) => id === "env.wave05.cairnmarket.exhaled_road_assize").topology.exclusions[0].anchorNodeId = "arrival_fan_temporary_safe_stage";
assert.ok(validateCandidate(fixtureWrongExclusionAnchor).some((error) => error.includes("exclusions:not_exact")));

const fixtureBlankPrecinctLinkPurpose = JSON.parse(JSON.stringify(candidatePackage));
fixtureBlankPrecinctLinkPurpose.environmentBriefs.find(({ id }) => id === "env.wave05.cairnmarket.exhaled_road_assize").topology.crosswalk.acceptedPrecinct.links[0].purpose = "";
assert.ok(validateCandidate(fixtureBlankPrecinctLinkPurpose).some((error) => error.includes("acceptedPrecinct:not_exact")));

const fixtureReturningCreatureWorkOrder = JSON.parse(JSON.stringify(candidatePackage));
fixtureReturningCreatureWorkOrder.artAndRegistryImplications.creatureArtBaseline.workOrders[2].creatureIds.push("witness_crab");
assert.ok(validateCandidate(fixtureReturningCreatureWorkOrder).some((error) => error.includes("creatureArtBaseline.workOrders:not_exact_unused_partition")));

const fixtureCreatureAssetKindSwap = JSON.parse(JSON.stringify(candidatePackage));
fixtureCreatureAssetKindSwap.artAndRegistryImplications.creatureArtBaseline.workOrders[0].requestedAfterAcceptance = ["concept_master"];
assert.ok(validateCandidate(fixtureCreatureAssetKindSwap).some((error) => error.includes("family_or_asset_kind_mismatch")));

const fixtureMissingSupportingWorkOrders = JSON.parse(JSON.stringify(candidatePackage));
fixtureMissingSupportingWorkOrders.artAndRegistryImplications.supportingCharacterArtBaseline.workOrders = [];
assert.ok(validateCandidate(fixtureMissingSupportingWorkOrders).some((error) => error.includes("not_exact_character_partition")));

const fixtureInvalidSupportingCapacity = JSON.parse(JSON.stringify(candidatePackage));
fixtureInvalidSupportingCapacity.artAndRegistryImplications.supportingCharacterArtBaseline.workOrders[0].maximumSubjects = 0;
assert.ok(validateCandidate(fixtureInvalidSupportingCapacity).some((error) => error.includes("supportingCharacterArtBaseline.workOrders:invalid")));

console.log(JSON.stringify({
  status: "PASS",
  counts: { quests: 12, supportingCharacters: 12, signatureItems: 12, environmentBriefs: 12, genuinelyUnusedCreaturesCovered: 15, returningCreatureOverlays: 3 },
  acceptedCorpusSha256,
  acceptedCollisionScope: QUEST_WAVE_05_ACCEPTED_COLLISION_SCOPE.length,
  candidatePairComparisons: candidatePairs.length,
  acceptedCorpusComparisons: acceptedPairs.length,
  maximumCandidateTokenJaccard: Number(maxCandidateToken.token.toFixed(4)),
  maximumCandidateTrigramJaccard: Number(maxCandidateShingle.shingle.toFixed(4)),
  maximumAcceptedTokenJaccard: Number(maxAcceptedToken.token.toFixed(4)),
  maximumAcceptedTrigramJaccard: Number(maxAcceptedShingle.shingle.toFixed(4)),
  adversarialFixtures: 28,
}, null, 2));
