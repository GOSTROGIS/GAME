#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  DEFAULT_REPOSITORY_ROOT,
  FALSE_CLAIM_KEYS_V2,
  SITE_BLOCKOUT_V2_SCHEMA_PATH,
  canonicalRecordSha256,
  fileEvidence,
  readJson,
  sha256,
  validateSiteBlockoutReferenceV2,
} from "./validate-site-blockout-reference-v2.mjs";

export const WAVE_03B_INDEX_PATH = "assets/world/spatial/wave-03b/index.json";
export const WAVE_03B_SITE_PATH = "assets/world/spatial/wave-03b/hollow-abbey.site.json";
export const WAVE_03B_PROVENANCE_PATH = "assets/world/spatial/wave-03b/provenance.json";
export const WAVE_03B_REVIEW_A_PATH = "assets/world/spatial/wave-03b/review-a.manifest.json";
export const WAVE_03B_REVIEW_B_PATH = "assets/world/spatial/wave-03b/review-b.manifest.json";

const ATLAS_PATH = "packages/content/manifests/sable-reach.atlas-runtime.json";
const WORLD_SPATIAL_PATH = "packages/content/src/world-spatial.data.js";
const CHARACTERS_PATH = "src/data/characters.js";
const QUESTS_PATH = "src/data/quests.js";
const NARRATIVE_PATH = "packages/content/src/narrative.data.js";
const BESTIARY_PATH = "packages/content/src/bestiary.data.js";
const WAVE_04_NARRATIVE_PATH = "packages/content/manifests/quest-wave-04-v11.narrative.json";
const WAVE_04_WORLD_PATH = "packages/content/manifests/quest-wave-04-v11.world.json";

export const WAVE_03B_REVIEWED_MATURITY = "independently_reviewed_noncanonical_reference";
const WAVE_03B_SCHEMA_CANONICAL_RECORD_SHA256 = "b1d0d2187d90bf812734e4aff6bbe1dfeeab227d89dc50cece6798995cbb3a2f";

export const WAVE_03B_EXPECTED_STATS = Object.freeze({
  zones: 3,
  spaces: 45,
  nodes: 48,
  traversableNodes: 47,
  overlayProxyNodes: 1,
  links: 60,
  derivedDirectedArcs: 120,
  safeCells: 6,
  stateMachines: 6,
  activityPhases: 4,
  hydrologySystems: 5,
  habitats: 7,
  actorSlots: 13,
  encounterSlots: 3,
  routePrograms: 15,
  overlayBindings: 2,
  questBindings: 3,
  questObjectives: 15,
  sourceBindings: 15,
  canonicalClaims: 0,
  runtimeClaims: 0,
  constructionClaims: 0,
  modelClaims: 0,
});

const SPACE_CODES = Object.freeze([
  "P01", "P02", "P03", "P04", "P05", "P06", "P07", "G01", "C01", "C02",
  "N00", "N01", "N02", "N03", "N04", "N05", "N06", "U01", "U02", "U03",
  "V01", "E01", "I01", "R01", "Q01", "K01", "O01", "O02", "B01", "M01", "M02",
  "F01", "F02", "F03a", "F03b", "F03c", "F03d", "F03e", "F03f", "F03g",
  "F04", "F05", "F06", "F07", "F08",
]);

const EXPECTED_LINK_ENDPOINTS = Object.freeze([
  "route-inbound/p01", "p01/p02", "p01/p03", "p02/p04", "p03/p04", "p04/g01", "p04/p06", "g01/p05",
  "g01/c01", "c01/c02", "c01/n00", "c01/i01", "c01/f01", "p06/f07", "p06/route-outbound", "c01/p07",
  "n00/n01", "n00/n02", "n00/n03", "n01/n02", "n01/n03", "n02/n04", "n04/n01", "n04/n03",
  "n02/n05", "n05/q01", "n03/n06", "n06/q01", "n02/u01", "u01/u03", "u03/u02", "u02/n03",
  "n02/v01", "v01/e01", "e01/n01", "n03/i01", "n03/r01", "r01/n06", "n01/q01", "q01/k01",
  "k01/o01", "o01/o02", "o01/b01", "o01/m01", "b01/m01", "m01/m02", "m02/n06", "f01/f02",
  "f02/f03a", "f02/f03b", "f02/f03c", "f02/f03d", "f02/f03e", "f02/f03f", "f02/f03g", "f02/f04",
  "f04/f05", "f02/f06", "f06/f07", "f02/f08",
]);

const FOUNDING_ACTOR_IDS = Object.freeze([
  "gatewarden_nhal", "moira_quiet", "seln_clause", "brother_iven",
  "aven_tongueless", "elo_veer", "mott_vane", "netta_aster",
]);
const ACTOR_IDS = Object.freeze([
  ...FOUNDING_ACTOR_IDS,
  "deacon_halix_bell_of_noon", "ader_coil_deaf_bellwright",
  "pera_knell_architect_word_before", "parn_exit_law", "wound_scribe_keth",
]);
const PHASE_IDS = Object.freeze(["roof_rain", "eclipse_high", "quiet_shift", "absolute_silence"]);
const ART_REFERENCE_IDS = Object.freeze([
  "concept_hollow_abbey_nave",
  "concept_hollow_abbey_processional_west_arrival",
  "concept_hollow_abbey_mute_nave_route_read",
  "concept_hollow_abbey_rain_court_work_nexus",
]);
const SOURCE_BINDING_IDS = Object.freeze([
  "source.reference.hollow-abbey-dossier",
  "source.atlas.hollow-abbey",
  "source.atlas.processional-steps",
  "source.atlas.karst-crypt",
  "source.spatial.hollow-abbey-envelope",
  "source.spatial.hollow-abbey-activity",
  "source.spatial.hollow-abbey-nave",
  "source.spatial.hollow-abbey-foundry",
  "source.characters.hollow-abbey-founding-eight",
  "source.quest.main-litany",
  "source.quest.profession-bell-silence",
  "source.quest.wave04-echo",
  "source.wave04.environment-cause-frames",
  "source.wave04.habitat-foreword-cantor",
  "source.art.hollow-abbey-accepted",
]);

const SOURCE_BINDING_CONTRACT = Object.freeze({
  "source.reference.hollow-abbey-dossier": { path: "design-review/world-sites/HOLLOW-ABBEY-PRECINCT-BIBLE.md", selector: "$file", bindingKind: "whole_file", authority: "noncanonical_reference" },
  "source.atlas.hollow-abbey": { path: ATLAS_PATH, selector: "sites[id=site.hollow-abbey]", bindingKind: "selected_record", authority: "canon" },
  "source.atlas.processional-steps": { path: ATLAS_PATH, selector: "routes[id=route.processional-steps]", bindingKind: "selected_record", authority: "canon" },
  "source.atlas.karst-crypt": { path: ATLAS_PATH, selector: "habitats[id=habitat.karst-crypt]", bindingKind: "selected_record", authority: "canon" },
  "source.spatial.hollow-abbey-envelope": { path: WORLD_SPATIAL_PATH, selector: "SITE_SPATIAL_ENVELOPES[id=site.hollow-abbey]", bindingKind: "selected_record", authority: "authored_design_constraint" },
  "source.spatial.hollow-abbey-activity": { path: WORLD_SPATIAL_PATH, selector: "SITE_ACTIVITY_CYCLES[siteId=site.hollow-abbey]", bindingKind: "selected_record", authority: "authored_design_constraint" },
  "source.spatial.hollow-abbey-nave": { path: WORLD_SPATIAL_PATH, selector: "BUILDING_TYPOLOGIES[id=hollow_abbey_nave]", bindingKind: "selected_record", authority: "authored_design_constraint" },
  "source.spatial.hollow-abbey-foundry": { path: WORLD_SPATIAL_PATH, selector: "BUILDING_TYPOLOGIES[id=hollow_abbey_foundry]", bindingKind: "selected_record", authority: "authored_design_constraint" },
  "source.characters.hollow-abbey-founding-eight": { path: CHARACTERS_PATH, selector: "CHARACTERS[id in gatewarden_nhal,moira_quiet,seln_clause,brother_iven,aven_tongueless,elo_veer,mott_vane,netta_aster]", bindingKind: "selected_record_set", authority: "canon" },
  "source.quest.main-litany": { path: QUESTS_PATH, selector: "QUESTS[id=main_a_litany_unspoken]", bindingKind: "selected_record", authority: "canon" },
  "source.quest.profession-bell-silence": { path: NARRATIVE_PATH, selector: "EXPANSION_QUESTS[id=profession_bell_paid_in_silence]", bindingKind: "selected_record", authority: "authored_design_constraint" },
  "source.quest.wave04-echo": { path: WAVE_04_NARRATIVE_PATH, selector: "quests[id=regional_an_echo_arrived_first]", bindingKind: "selected_record", authority: "accepted_quest_contract" },
  "source.wave04.environment-cause-frames": { path: WAVE_04_WORLD_PATH, selector: "environmentPrograms[locationId=hollow_abbey_foreword_cause_frames]", bindingKind: "selected_record", authority: "accepted_quest_contract" },
  "source.wave04.habitat-foreword-cantor": { path: WAVE_04_WORLD_PATH, selector: "creatureHabitatEnvelopes[id=habitat.foreword_cantor.hollow_abbey_cause_frames]", bindingKind: "selected_record", authority: "accepted_quest_contract" },
  "source.art.hollow-abbey-accepted": { path: WORLD_SPATIAL_PATH, selector: "ENVIRONMENT_ART_DIRECTION.acceptedVisualReferences[id in concept_hollow_abbey_nave,concept_hollow_abbey_processional_west_arrival,concept_hollow_abbey_mute_nave_route_read,concept_hollow_abbey_rain_court_work_nexus]", bindingKind: "selected_record_set", authority: "accepted_art_direction" },
});

const ACTOR_ASSET_CONTRACT = Object.freeze({
  gatewarden_nhal: ["assets/characters/npcs/exact-word/nhal-without-shadow-v1.png", "assets/characters/npcs/exact-word/nhal-without-shadow-v1-cutout.png", "concept_pair_only"],
  moira_quiet: ["assets/characters/npcs/exact-word/moira-quiet-v1.png", "assets/characters/npcs/exact-word/moira-quiet-v1-cutout.png", "concept_pair_only"],
  seln_clause: ["assets/characters/npcs/exact-word/seln-clause-v1.png", "assets/characters/npcs/exact-word/seln-clause-v1-cutout.png", "concept_pair_only"],
  brother_iven: ["assets/characters/npcs/exact-word/brother-iven-v1.png", "assets/characters/npcs/exact-word/brother-iven-v1-cutout.png", "concept_pair_only"],
  aven_tongueless: ["assets/characters/npcs/exact-word/aven-tongueless-v1.png", "assets/characters/npcs/exact-word/aven-tongueless-v1-cutout.png", "concept_pair_only"],
  elo_veer: ["assets/characters/npcs/unwritten-roads/elo-veer-v1.png", "assets/characters/npcs/unwritten-roads/elo-veer-v1-cutout.png", "concept_pair_only"],
  mott_vane: ["assets/characters/npcs/grave-tithe/mott-vane-v1.png", "assets/characters/npcs/grave-tithe/mott-vane-v1-cutout.png", "concept_pair_only"],
  netta_aster: ["assets/characters/npcs/grave-tithe/netta-aster-v1.png", "assets/characters/npcs/grave-tithe/netta-aster-v1-cutout.png", "concept_pair_only"],
  deacon_halix_bell_of_noon: ["assets/characters/npcs/lucent-synod/deacon-halix-bell-of-noon-v2.png", null, "concept_master_only"],
  ader_coil_deaf_bellwright: [null, null, "awaiting_art"],
  pera_knell_architect_word_before: [null, null, "awaiting_art"],
  parn_exit_law: ["assets/characters/npcs/charnel-households/parn-exit-law-v1.png", null, "concept_master_only"],
  wound_scribe_keth: ["assets/characters/npcs/charnel-princes/wound-scribe-keth-v1.png", null, "concept_master_only"],
});

const ENCOUNTER_CONTRACT = Object.freeze({
  "encounter-slot.hollow-abbey.hush-monks": ["hush_monk", 5, "state.hollow-abbey.main-litany", null],
  "encounter-slot.hollow-abbey.cantor-oss": ["cantor_oss", 1, "state.hollow-abbey.main-litany", null],
  "encounter-slot.hollow-abbey.foreword-cantor": ["foreword_cantor", 1, "state.hollow-abbey.cause-frames", "overlay.hollow-abbey.foreword-cause-frames"],
});

const sameArray = (left, right) => Array.isArray(left) && left.length === right.length && left.every((value, index) => value === right[index]);
const sameObject = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const sameSet = (left, right) => left.size === right.size && [...left].every((value) => right.has(value));
const ids = (records, field = "id") => new Set(records.map((record) => record[field]));
const byId = (records, id, field = "id") => records.find((record) => record[field] === id);

function stringValues(value, output = []) {
  if (typeof value === "string") output.push(value);
  else if (Array.isArray(value)) value.forEach((child) => stringValues(child, output));
  else if (value && typeof value === "object") Object.values(value).forEach((child) => stringValues(child, output));
  return output;
}

function privateString(value) {
  return /https?:\/\//i.test(value)
    || /drive\.google\.com|usp=drive|signed[_ -]?url|session[_ -]?id|call[_ -]?id/i.test(value)
    || /\b(?:openai|anthropic|midjourney|stability\s*ai|dall[- ]?e|chatgpt|claude)\b/i.test(value)
    || /\b(?:execution|job|request|trace|run)[_ -]?id\s*[:=]?\s*[a-z0-9_-]{6,}\b/i.test(value)
    || /\b[A-Za-z]:[\\/]/.test(value)
    || /^\\\\[^\\/\s]+[\\/][^\\/\s]+/.test(value)
    || /(?:^|\s)\/mnt\/[a-z]\/(?:Users|home)\//i.test(value)
    || /(?:^|\s)\/(?:Users|home|tmp|var)\//.test(value)
    || /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value);
}

function unexpectedSchemaMaxItems(value, currentPath = "$") {
  if (!value || typeof value !== "object") return [];
  const failures = [];
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${currentPath}.${key}`;
    if (key === "maxItems" && !(currentPath === "$.$defs.vector3" && child === 3)) failures.push(childPath);
    failures.push(...unexpectedSchemaMaxItems(child, childPath));
  }
  return failures;
}

function reachableInState(site, machine, state, originId) {
  const traversalByLink = new Map(machine.rules
    .filter((rule) => rule.state === state && rule.linkTraversal !== null)
    .map((rule) => [rule.targetId, rule.linkTraversal]));
  const graph = new Map(site.nodes.filter(({ traversable }) => traversable).map(({ id }) => [id, new Set()]));
  for (const link of site.links) {
    if (traversalByLink.get(link.id) === "closed" || !graph.has(link.fromNodeId) || !graph.has(link.toNodeId)) continue;
    graph.get(link.fromNodeId).add(link.toNodeId);
    if (link.bidirectional) graph.get(link.toNodeId).add(link.fromNodeId);
  }
  const reached = new Set(graph.has(originId) ? [originId] : []);
  const pending = [...reached];
  while (pending.length > 0) {
    const current = pending.shift();
    for (const adjacent of graph.get(current) ?? []) {
      if (!reached.has(adjacent)) {
        reached.add(adjacent);
        pending.push(adjacent);
      }
    }
  }
  return reached;
}

async function importRepositoryModule(repositoryRoot, repositoryRelativePath) {
  return import(pathToFileURL(path.join(repositoryRoot, repositoryRelativePath)).href);
}

export async function validateWorldSpatialWave03b({
  repositoryRoot = DEFAULT_REPOSITORY_ROOT,
  schemaOverride = null,
  indexOverride = null,
  siteOverride = null,
  provenanceOverride = null,
  reviewAOverride = null,
  reviewBOverride = null,
} = {}) {
  const errors = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };

  let schema;
  let index;
  let site;
  let provenance;
  let reviewA;
  let reviewB;
  let atlas;
  let worldSpatial;
  let characters;
  let quests;
  let narrative;
  let bestiary;
  let wave04Narrative;
  let wave04World;
  try {
    const loaded = await Promise.all([
      readJson(repositoryRoot, SITE_BLOCKOUT_V2_SCHEMA_PATH),
      readJson(repositoryRoot, WAVE_03B_INDEX_PATH),
      readJson(repositoryRoot, WAVE_03B_SITE_PATH),
      readJson(repositoryRoot, WAVE_03B_PROVENANCE_PATH),
      readJson(repositoryRoot, WAVE_03B_REVIEW_A_PATH),
      readJson(repositoryRoot, WAVE_03B_REVIEW_B_PATH),
      readJson(repositoryRoot, ATLAS_PATH),
      importRepositoryModule(repositoryRoot, WORLD_SPATIAL_PATH),
      importRepositoryModule(repositoryRoot, CHARACTERS_PATH),
      importRepositoryModule(repositoryRoot, QUESTS_PATH),
      importRepositoryModule(repositoryRoot, NARRATIVE_PATH),
      importRepositoryModule(repositoryRoot, BESTIARY_PATH),
      readJson(repositoryRoot, WAVE_04_NARRATIVE_PATH),
      readJson(repositoryRoot, WAVE_04_WORLD_PATH),
    ]);
    [schema, index, site, provenance, reviewA, reviewB, atlas, worldSpatial, characters, quests, narrative, bestiary, wave04Narrative, wave04World] = loaded;
    schema = schemaOverride ?? schema;
    index = indexOverride ?? index;
    site = siteOverride ?? site;
    provenance = provenanceOverride ?? provenance;
    reviewA = reviewAOverride ?? reviewA;
    reviewB = reviewBOverride ?? reviewB;
  } catch (error) {
    return { valid: false, errors: [`Unable to load Wave 03B inputs: ${error.message}`], stats: null };
  }

  const generic = await validateSiteBlockoutReferenceV2({ repositoryRoot, schema, site });
  errors.push(...generic.errors);
  if (generic.stats === null) {
    return { valid: false, errors, stats: null, evidence: { sourceArtifacts: generic.evidence?.sourceArtifacts ?? {} } };
  }
  const validIndexShape = index && typeof index === "object" && !Array.isArray(index)
    && Array.isArray(index.sites) && index.sites.every((record) => record && typeof record === "object" && !Array.isArray(record));
  const validProvenanceShape = provenance && typeof provenance === "object" && !Array.isArray(provenance)
    && provenance.direction && typeof provenance.direction === "object" && !Array.isArray(provenance.direction)
    && provenance.publication && typeof provenance.publication === "object" && !Array.isArray(provenance.publication)
    && provenance.tool && typeof provenance.tool === "object" && !Array.isArray(provenance.tool)
    && provenance.reviewEvidence && typeof provenance.reviewEvidence === "object" && !Array.isArray(provenance.reviewEvidence)
    && Array.isArray(provenance.records) && provenance.records.every((record) => record && typeof record === "object" && !Array.isArray(record));
  const validReviewShape = (review) => review && typeof review === "object" && !Array.isArray(review)
    && review.subject && typeof review.subject === "object" && !Array.isArray(review.subject)
    && review.review && typeof review.review === "object" && !Array.isArray(review.review)
    && Array.isArray(review.review.verified) && Array.isArray(review.review.limitations);
  if (!validIndexShape || !validProvenanceShape || !validReviewShape(reviewA) || !validReviewShape(reviewB)) {
    if (!validIndexShape) errors.push("Wave 03B index has an invalid structural shape");
    if (!validProvenanceShape) errors.push("Wave 03B provenance has an invalid structural shape");
    if (!validReviewShape(reviewA)) errors.push("Wave 03B review A manifest has an invalid structural shape");
    if (!validReviewShape(reviewB)) errors.push("Wave 03B review B manifest has an invalid structural shape");
    return { valid: false, errors, stats: generic.stats, evidence: { sourceArtifacts: generic.evidence?.sourceArtifacts ?? {} } };
  }
  check(sameObject(generic.stats, WAVE_03B_EXPECTED_STATS), `Wave 03B count contract drifted: ${JSON.stringify(generic.stats)}`);

  check(schema.$id === SITE_BLOCKOUT_V2_SCHEMA_PATH && schema.additionalProperties === false, "V2 schema identity or strict top-level contract drifted");
  for (const key of ["sourceBindings", "zones", "spaces", "nodes", "links", "activityPhases", "routePrograms"]) {
    check(schema.properties?.[key]?.minItems === 1 && schema.properties[key].maxItems === undefined, `V2 schema ${key} must remain reusable and variable-count`);
  }
  check(unexpectedSchemaMaxItems(schema).length === 0, `Generic V2 schema contains packet-specific maxItems at ${unexpectedSchemaMaxItems(schema).join(", ")}`);
  check(canonicalRecordSha256(schema) === WAVE_03B_SCHEMA_CANONICAL_RECORD_SHA256, "Generic V2 schema semantic and nested cardinality contract drifted");
  check(!stringValues(schema).some((value) => /hollow[-_ ]abbey|45|48|60/i.test(value)), "Generic V2 schema contains Hollow Abbey or packet-count specialization");

  check(index.schemaVersion === 2 && site.schemaVersion === 2 && provenance.schemaVersion === 2, "Wave 03B schema versions must equal two");
  check(index.id === "world-spatial-wave-03b" && site.id === "site-blockout.wave-03b.hollow-abbey" && site.siteId === "site.hollow-abbey", "Wave 03B identity drifted");
  check(index.status === WAVE_03B_REVIEWED_MATURITY && provenance.maturity === WAVE_03B_REVIEWED_MATURITY, "Wave 03B review maturity drifted");
  check(index.schemaPath === SITE_BLOCKOUT_V2_SCHEMA_PATH && index.provenancePath === WAVE_03B_PROVENANCE_PATH, "Wave 03B index path binding drifted");
  for (const [scope, claims] of [["index", index.claims], ["site", site.claims]]) {
    check(claims && FALSE_CLAIM_KEYS_V2.every((key) => claims[key] === false), `${scope} contains an authority or readiness overclaim`);
  }
  check(index.sites?.length === 1 && index.sites[0]?.id === site.id && index.sites[0]?.siteId === site.siteId && index.sites[0]?.path === WAVE_03B_SITE_PATH, "Index must contain exactly the Hollow Abbey packet record");
  check(sameObject(index.sites?.[0]?.counts, WAVE_03B_EXPECTED_STATS), "Index counts differ from the exact packet contract");

  const [schemaEvidence, indexEvidence, siteEvidence, reviewAEvidence, reviewBEvidence] = await Promise.all([
    fileEvidence(repositoryRoot, SITE_BLOCKOUT_V2_SCHEMA_PATH),
    fileEvidence(repositoryRoot, WAVE_03B_INDEX_PATH),
    fileEvidence(repositoryRoot, WAVE_03B_SITE_PATH),
    fileEvidence(repositoryRoot, WAVE_03B_REVIEW_A_PATH),
    fileEvidence(repositoryRoot, WAVE_03B_REVIEW_B_PATH),
  ]);
  check(index.sites?.[0]?.sha256 === siteEvidence.sha256 && index.sites?.[0]?.bytes === siteEvidence.bytes, "Index site payload evidence drifted");

  const frozenReviewSubject = {
    schemaPath: SITE_BLOCKOUT_V2_SCHEMA_PATH,
    schemaSha256: schemaEvidence.sha256,
    indexPath: WAVE_03B_INDEX_PATH,
    indexSha256: indexEvidence.sha256,
    sitePath: WAVE_03B_SITE_PATH,
    siteSha256: siteEvidence.sha256,
  };
  check(reviewA.schema === "SableReachSpatialReviewManifestV1" && reviewA.id === "review.world-spatial-wave-03b.a", "Wave 03B review A identity drifted");
  check(reviewB.schema === "SableReachSpatialReviewManifestV1" && reviewB.id === "review.world-spatial-wave-03b.b", "Wave 03B review B identity drifted");
  check(sameObject(reviewA.subject, frozenReviewSubject) && sameObject(reviewB.subject, frozenReviewSubject), "Wave 03B reviews do not bind the frozen schema/index/site artifacts");
  check(reviewA.review?.role === "independent_canon_and_spatial_semantics_reviewer"
    && reviewB.review?.role === "independent_integration_and_evidence_reviewer", "Wave 03B independent review roles drifted");
  for (const [label, manifest] of [["A", reviewA], ["B", reviewB]]) {
    check(manifest.review.mode === "independent_read_only_frozen_artifact_review"
      && manifest.review.independent === true
      && manifest.review.mutationDuringReview === false
      && manifest.review.disposition === "accept_noncanonical_reference", `Wave 03B review ${label} disposition or independence drifted`);
    check(manifest.review.verified.length >= 6 && manifest.review.limitations.length >= 5, `Wave 03B review ${label} scope or limitation evidence is incomplete`);
  }
  check(reviewA.review.rejectedFixtureCount === 53, "Wave 03B review A adversarial-fixture evidence drifted");

  check(site.authority?.classification === "noncanonical_site_local_reference" && site.authority?.precedence?.length === 5, "Site-local authority or precedence drifted");
  check(sameArray(site.zones.map(({ id }) => id), ["zone.hollow-abbey.exterior-court", "zone.hollow-abbey.nave-deep", "zone.hollow-abbey.foundry"]), "Hollow Abbey zone identities or order drifted");
  check(sameArray(site.zones.map(({ spaceIds }) => spaceIds.length), [10, 21, 14]), "Hollow Abbey 10/21/14 zone partition drifted");
  check(sameArray(site.spaces.map(({ code }) => code), SPACE_CODES), "Exact 45-space code order drifted");
  check(!site.spaces.some(({ code }) => code === "X01"), "X01 must remain a stateful overlay, not base geometry");
  check(site.nodes.filter(({ kind }) => kind === "space_centroid").length === 45, "Exactly 45 centroid nodes are required");
  check(sameSet(ids(site.nodes.filter(({ kind }) => kind !== "space_centroid")), new Set([
    "node.hollow-abbey.route-inbound", "node.hollow-abbey.route-outbound", "node.hollow-abbey.overlay-cause-frames",
  ])), "The two route ports plus one non-traversable overlay proxy are the only non-centroid nodes");

  const endpointKeys = site.links.map(({ fromNodeId, toNodeId }) => `${fromNodeId.replace("node.hollow-abbey.", "")}/${toNodeId.replace("node.hollow-abbey.", "")}`);
  check(sameArray(endpointKeys, EXPECTED_LINK_ENDPOINTS), "Exact 60-link Hollow Abbey topology or link order drifted");
  check(site.links.every(({ bidirectional }) => bidirectional === true), "All 60 stored links must remain explicitly bidirectional");
  check(Boolean(byId(site.links, "link.hollow-abbey.021.n01-n03")), "Required N01-N03 link is missing");
  check(Boolean(byId(site.links, "link.hollow-abbey.044.o01-m01")), "Required O01-M01 link is missing");
  check(!site.links.some(({ fromNodeId, toNodeId }) => [fromNodeId, toNodeId].includes("node.hollow-abbey.overlay-cause-frames")), "Overlay proxy must never become base traversal");

  const atlasSite = byId(atlas.sites, "site.hollow-abbey");
  const atlasRoute = byId(atlas.routes, "route.processional-steps");
  const atlasHabitat = byId(atlas.habitats, "habitat.karst-crypt");
  const spatialEnvelope = byId(worldSpatial.SITE_SPATIAL_ENVELOPES, "site.hollow-abbey");
  const spatialActivity = byId(worldSpatial.SITE_ACTIVITY_CYCLES, "site.hollow-abbey", "siteId");
  const naveTypology = byId(worldSpatial.BUILDING_TYPOLOGIES, "hollow_abbey_nave");
  const foundryTypology = byId(worldSpatial.BUILDING_TYPOLOGIES, "hollow_abbey_foundry");
  const mainQuest = byId(quests.QUESTS, "main_a_litany_unspoken");
  const professionQuest = byId(narrative.EXPANSION_QUESTS, "profession_bell_paid_in_silence");
  const wave04Quest = byId(wave04Narrative.quests, "regional_an_echo_arrived_first");
  const wave04Environment = byId(wave04World.environmentPrograms, "hollow_abbey_foreword_cause_frames", "locationId");
  const forewordHabitat = byId(wave04World.creatureHabitatEnvelopes, "habitat.foreword_cantor.hollow_abbey_cause_frames");
  const foundingCharacters = FOUNDING_ACTOR_IDS.map((id) => byId(characters.CHARACTERS, id));
  const artReferences = ART_REFERENCE_IDS.map((id) => byId(worldSpatial.ENVIRONMENT_ART_DIRECTION.acceptedVisualReferences, id));
  check([atlasSite, atlasRoute, atlasHabitat, spatialEnvelope, spatialActivity, naveTypology, foundryTypology, mainQuest, professionQuest, wave04Quest, wave04Environment, forewordHabitat, ...foundingCharacters, ...artReferences].every(Boolean), "One or more bound Hollow Abbey source records are missing");

  const selectedRecords = new Map([
    ["source.atlas.hollow-abbey", atlasSite],
    ["source.atlas.processional-steps", atlasRoute],
    ["source.atlas.karst-crypt", atlasHabitat],
    ["source.spatial.hollow-abbey-envelope", spatialEnvelope],
    ["source.spatial.hollow-abbey-activity", spatialActivity],
    ["source.spatial.hollow-abbey-nave", naveTypology],
    ["source.spatial.hollow-abbey-foundry", foundryTypology],
    ["source.characters.hollow-abbey-founding-eight", foundingCharacters],
    ["source.quest.main-litany", mainQuest],
    ["source.quest.profession-bell-silence", professionQuest],
    ["source.quest.wave04-echo", wave04Quest],
    ["source.wave04.environment-cause-frames", wave04Environment],
    ["source.wave04.habitat-foreword-cantor", forewordHabitat],
    ["source.art.hollow-abbey-accepted", artReferences],
  ]);
  check(sameSet(ids(site.sourceBindings), new Set(SOURCE_BINDING_IDS)), "Exact source-binding set drifted");
  for (const binding of site.sourceBindings) {
    const expected = SOURCE_BINDING_CONTRACT[binding.id];
    check(Boolean(expected), `${binding.id} has no declared source-binding contract`);
    if (expected) {
      check(
        binding.path === expected.path
          && binding.selector === expected.selector
          && binding.bindingKind === expected.bindingKind
          && binding.authority === expected.authority,
        `${binding.id} path, selector, binding kind, or authority drifted`,
      );
    }
  }
  for (const binding of site.sourceBindings.filter(({ bindingKind }) => bindingKind !== "whole_file")) {
    const record = selectedRecords.get(binding.id);
    check(Boolean(record), `${binding.id} has no resolvable selected source record`);
    if (record) check(binding.recordSha256 === canonicalRecordSha256(record), `${binding.id} selected-record hash drifted`);
  }

  if (atlasSite && atlasRoute && spatialEnvelope) {
    const spatial = site.spatialReference;
    check(spatial.coordinateSpaceId === atlas.coordinateReferenceSystem.id && spatial.coordinateSpaceId === "veyl_local_grid_v1", "Hollow Abbey must use the canonical Veyl CRS v1 identity");
    check(sameArray(spatial.atlasSiteAnchor, atlasSite.coordinate), "Atlas site anchor drifted from the canonical site record");
    check(sameArray(spatial.atlasAnchorToLocalOriginOffsetMeters, [0, 0, 12]), "Gate-centered atlas-anchor offset drifted");
    check(sameArray(spatial.localOriginAtlasCoordinate, [11776, 2048, 108]), "Gate-centered local origin atlas coordinate drifted");
    check(sameObject(spatial.axes, {
      x: "inward from the Gate of Exact Words toward the Last Bell crypt",
      y: "toward the north aisle and high processional loop",
      z: "local up",
    }), "Gate-centered local axes drifted");
    check(sameArray(byId(site.spaces, "space.hollow-abbey.g01")?.localCentroidMeters, [0, 0, 0])
      && sameArray(byId(site.nodes, "node.hollow-abbey.g01")?.localCoordinateMeters, [0, 0, 0]), "G01 space and node must remain the site-local origin datum");
    check(sameArray(atlasRoute.nodes, ["site.warden-reed", "site.hollow-abbey", "site.salt-watch"]), "Canonical Processional Steps host order drifted");
    check(atlasRoute.sections?.length === 2 && atlasRoute.sections.every(({ fromSiteId, toSiteId }) => fromSiteId === "site.hollow-abbey" || toSiteId === "site.hollow-abbey"), "Canonical Processional Steps sections no longer meet Hollow Abbey");
    check(spatialEnvelope.designEnvelope.boundaryStatus === "provisional_not_cadastral", "Host design envelope lost provisional boundary status");
    const local = spatial.localBoundsMeters;
    const origin = spatial.localOriginAtlasCoordinate;
    const minimum = local.minimum.map((value, index) => value + origin[index]);
    const maximum = local.maximum.map((value, index) => value + origin[index]);
    const host = spatialEnvelope.designEnvelope;
    check(minimum[0] >= host.bounds.minimumEasting && maximum[0] <= host.bounds.maximumEasting && minimum[1] >= host.bounds.minimumNorthing && maximum[1] <= host.bounds.maximumNorthing, "Candidate horizontal bounds escape the host influence envelope");
    check(minimum[2] >= host.verticalRangeMeters[0] && maximum[2] <= host.verticalRangeMeters[1], "Candidate vertical bounds escape the host design band");
    check(minimum[2] === 67 && maximum[2] === 184, "Gate datum normalization must preserve the candidate absolute vertical envelope");
  }

  check(sameArray(site.activityPhases.map(({ canonicalPhaseId }) => canonicalPhaseId), PHASE_IDS), "Canonical four-phase order drifted");
  check(spatialActivity && sameArray(spatialActivity.cycles.map(({ phase }) => phase), PHASE_IDS), "Bound four-phase source order drifted");
  if (mainQuest) {
    check(mainQuest.objectives?.length === 5 && mainQuest.objectives[1]?.target === "hush_monk" && mainQuest.objectives[1]?.required === 5, "Main Litany five-objective/five-Hush-Monk contract drifted");
    check(sameArray(site.questCrosswalk[0]?.objectives.map(({ target }) => target), mainQuest.objectives.map(({ target }) => target)), "Main Litany objective order drifted in spatial crosswalk");
  }
  for (const quest of [mainQuest, professionQuest, wave04Quest].filter(Boolean)) {
    const crosswalk = site.questCrosswalk.find(({ questId }) => questId === quest.id);
    check(Boolean(crosswalk) && sameArray(crosswalk.objectives.map(({ target }) => target), quest.objectives.map(({ target }) => target)), `${quest.id} objective target order drifted in spatial crosswalk`);
    check(crosswalk?.questRecordSha256 === canonicalRecordSha256(quest), `${quest.id} crosswalk canonical-record hash drifted`);
  }

  const mainState = byId(site.stateMachines, "state.hollow-abbey.main-litany");
  const memoryRoute = byId(site.routePrograms, "route-program.hollow-abbey.memory-return");
  check(mainState?.initialState === "gate_sealed" && mainState.states.at(-1) === "memory_return_released", "Main Litany state order drifted");
  check(sameArray(memoryRoute?.nodeIds, ["node.hollow-abbey.m01", "node.hollow-abbey.m02", "node.hollow-abbey.n06"]), "M02 Memory Return trace drifted");
  const preReleaseStates = mainState?.states.slice(0, -1) ?? [];
  const preReleaseRules = mainState?.rules.filter(({ targetId, state }) => targetId === "link.hollow-abbey.046.m01-m02" && preReleaseStates.includes(state)) ?? [];
  const releasedRules = mainState?.rules.filter(({ targetId, state }) => ["link.hollow-abbey.046.m01-m02", "link.hollow-abbey.047.m02-n06"].includes(targetId) && state === "memory_return_released") ?? [];
  check(preReleaseRules.length === 5 && new Set(preReleaseRules.map(({ state }) => state)).size === 5 && preReleaseRules.every(({ behavior }) => /sealed and non-traversable/i.test(behavior)), "M02 must be explicitly sealed and non-traversable in every pre-release state");
  check(releasedRules.length === 2 && releasedRules.some(({ behavior }) => /permanent|remains open/i.test(behavior)) && memoryRoute.phaseIds.includes("absolute_silence"), "M02 must remain permanently usable after release, including absolute silence");
  check(mainState?.ruleSemantics === "state_local_nonpersistent_override" && mainState?.unruledTargetBehavior === "base_record_behavior", "Main Litany state-rule evaluation semantics drifted");
  const mainTraversalMatrix = {
    "link.hollow-abbey.009.g01-c01": ["closed", "open", "open", "open", "open", "open"],
    "link.hollow-abbey.044.o01-m01": ["closed", "closed", "closed", "open", "open", "open"],
    "link.hollow-abbey.045.b01-m01": ["closed", "closed", "closed", "open", "open", "open"],
    "link.hollow-abbey.046.m01-m02": ["closed", "closed", "closed", "closed", "closed", "open"],
    "link.hollow-abbey.047.m02-n06": ["closed", "closed", "closed", "closed", "closed", "open"],
  };
  for (const [targetId, expectedTraversals] of Object.entries(mainTraversalMatrix)) {
    const actualTraversals = mainState?.states.map((state) => {
      const rules = mainState.rules.filter((rule) => rule.targetId === targetId && rule.state === state);
      return rules.length === 1 ? rules[0].linkTraversal : "missing_or_duplicate";
    }) ?? [];
    check(sameArray(actualTraversals, expectedTraversals), `${targetId} exact Main Litany traversal matrix drifted`);
  }
  const preCantorStates = new Set(["gate_sealed", "gate_open_hush_objective", "crypt_discovered"]);
  for (const state of mainState?.states ?? []) {
    for (const targetId of ["link.hollow-abbey.044.o01-m01", "link.hollow-abbey.045.b01-m01"]) {
      const rules = mainState.rules.filter((rule) => rule.state === state && rule.targetId === targetId);
      const expectedTraversal = preCantorStates.has(state) ? "closed" : "open";
      check(rules.length === 1 && rules[0].linkTraversal === expectedTraversal, `${targetId} must be explicitly ${expectedTraversal} in ${state}`);
    }
    const reachedFromOssuary = reachableInState(site, mainState, state, "node.hollow-abbey.o01");
    check(reachedFromOssuary.has("node.hollow-abbey.m01") === !preCantorStates.has(state), `M01 reachability violates the Cantor gate in ${state}`);
  }
  for (const state of preReleaseStates) {
    check(!reachableInState(site, mainState, state, "node.hollow-abbey.m01").has("node.hollow-abbey.m02"), `M02 is reachable before the Clapper release in ${state}`);
  }
  check(reachableInState(site, mainState, "memory_return_released", "node.hollow-abbey.m01").has("node.hollow-abbey.m02"), "M02 is not reachable after the Clapper release");

  const outboundState = byId(site.stateMachines, "state.hollow-abbey.outbound-relation");
  check(outboundState?.initialState === "unresolved_open_question" && outboundState.rules.some(({ behavior }) => /no source establishes whether G01 locks, unlocks, or bypasses/i.test(behavior)), "P06/G01 relation must remain an explicit unresolved open question");
  check(sameArray(outboundState?.states, ["unresolved_open_question", "blockout_test_independent", "blockout_test_gate_related"])
    && sameObject(outboundState?.transitions.map(({ from, to, trigger }) => ({ from, to, trigger })), [
      { from: "unresolved_open_question", to: "blockout_test_independent", trigger: "reviewer requests an independent-route blockout hypothesis" },
      { from: "unresolved_open_question", to: "blockout_test_gate_related", trigger: "reviewer requests a gate-related blockout hypothesis" },
      { from: "blockout_test_independent", to: "unresolved_open_question", trigger: "reviewer discards the independent-route hypothesis" },
      { from: "blockout_test_gate_related", to: "unresolved_open_question", trigger: "reviewer discards the gate-related hypothesis" },
    ]), "P06/G01 review-only state transitions drifted");
  const outboundTraversal = Object.fromEntries(outboundState?.rules.map((rule) => [`${rule.state}/${rule.targetId}`, rule.linkTraversal]) ?? []);
  check(sameObject(outboundTraversal, {
    "unresolved_open_question/link.hollow-abbey.007.p04-p06": null,
    "unresolved_open_question/link.hollow-abbey.015.p06-outbound": null,
    "blockout_test_independent/link.hollow-abbey.007.p04-p06": "open",
    "blockout_test_independent/link.hollow-abbey.015.p06-outbound": "open",
    "blockout_test_gate_related/link.hollow-abbey.007.p04-p06": "closed",
    "blockout_test_gate_related/link.hollow-abbey.015.p06-outbound": "open",
  }) && outboundState.rules.filter(({ state }) => state !== "unresolved_open_question").every(({ behavior }) => /temporary review hypothesis only/i.test(behavior)), "P06/G01 test states must remain explicit, reversible, and noncanonical");

  const silenceRooms = site.spaces.filter(({ code }) => /^F03[a-g]$/.test(code));
  check(sameArray(silenceRooms.map(({ code }) => code), ["F03a", "F03b", "F03c", "F03d", "F03e", "F03f", "F03g"]), "Foundry must retain seven distinct F03a-F03g rooms");
  check(new Set(silenceRooms.map(({ kind }) => kind)).size === 7 && silenceRooms.every(({ boundsLocalMeters }) => boundsLocalMeters.maximum[0] > boundsLocalMeters.minimum[0]), "Seven silence rooms must remain geometrically and functionally distinct");
  const funeralRoute = byId(site.routePrograms, "route-program.hollow-abbey.foundry-funeral");
  check(sameArray(funeralRoute?.nodeIds, ["node.hollow-abbey.f06", "node.hollow-abbey.f07", "node.hollow-abbey.p06", "node.hollow-abbey.route-outbound"]), "Foundry funeral route must remain F06-F07-P06-outbound");
  check(!funeralRoute?.nodeIds.includes("node.hollow-abbey.f02"), "Foundry funeral route must never cross F02");

  const hydrology = new Map(site.hydrologySystems.map((record) => [record.id, record]));
  const roofRain = hydrology.get("hydrology.hollow-abbey.roof-rain");
  const bellWells = hydrology.get("hydrology.hollow-abbey.bell-wells");
  const blackwater = hydrology.get("hydrology.hollow-abbey.foundry-blackwater");
  const receptor = hydrology.get("hydrology.hollow-abbey.p07-receptor");
  const abbeySink = hydrology.get("hydrology.hollow-abbey.abbey-sink");
  check(blackwater?.scope === "local_closed_loop" && sameSet(new Set(blackwater.spaceIds), new Set(["space.hollow-abbey.f02", "space.hollow-abbey.f04", "space.hollow-abbey.f06"])) && blackwater.scopedConnectionHydrologyIds.length === 0, "Foundry blackwater must remain a closed F02/F04/F06 loop");
  check(roofRain?.scopedConnectionHydrologyIds.length === 1 && roofRain.scopedConnectionHydrologyIds[0] === receptor?.id && receptor.scopedConnectionHydrologyIds[0] === roofRain.id, "Roof rain may connect only to the bounded P07 quest receptor");
  check(bellWells?.scopedConnectionHydrologyIds.length === 0 && abbeySink?.scope === "off_precinct_excluded" && abbeySink.spaceIds.length === 0, "Bell wells must stay carried-supply only and Abbey Sink must remain off-precinct");
  const hydrologyContract = Object.fromEntries(site.hydrologySystems.map((system) => [system.id, {
    scope: system.scope,
    spaceIds: system.spaceIds,
    scopedConnectionHydrologyIds: system.scopedConnectionHydrologyIds,
    prohibitedHydrologyIds: system.prohibitedHydrologyIds,
  }]));
  check(sameObject(hydrologyContract, {
    "hydrology.hollow-abbey.roof-rain": {
      scope: "local_open_surface",
      spaceIds: ["space.hollow-abbey.p04", "space.hollow-abbey.g01", "space.hollow-abbey.c01", "space.hollow-abbey.n00", "space.hollow-abbey.n01", "space.hollow-abbey.n02", "space.hollow-abbey.n03", "space.hollow-abbey.u03", "space.hollow-abbey.q01"],
      scopedConnectionHydrologyIds: ["hydrology.hollow-abbey.p07-receptor"],
      prohibitedHydrologyIds: ["hydrology.hollow-abbey.bell-wells", "hydrology.hollow-abbey.foundry-blackwater", "hydrology.hollow-abbey.abbey-sink"],
    },
    "hydrology.hollow-abbey.bell-wells": {
      scope: "local_carried_supply",
      spaceIds: ["space.hollow-abbey.c02"],
      scopedConnectionHydrologyIds: [],
      prohibitedHydrologyIds: ["hydrology.hollow-abbey.roof-rain", "hydrology.hollow-abbey.foundry-blackwater", "hydrology.hollow-abbey.p07-receptor", "hydrology.hollow-abbey.abbey-sink"],
    },
    "hydrology.hollow-abbey.foundry-blackwater": {
      scope: "local_closed_loop",
      spaceIds: ["space.hollow-abbey.f02", "space.hollow-abbey.f04", "space.hollow-abbey.f06"],
      scopedConnectionHydrologyIds: [],
      prohibitedHydrologyIds: ["hydrology.hollow-abbey.roof-rain", "hydrology.hollow-abbey.bell-wells", "hydrology.hollow-abbey.p07-receptor", "hydrology.hollow-abbey.abbey-sink"],
    },
    "hydrology.hollow-abbey.p07-receptor": {
      scope: "quest_bounded_receptor",
      spaceIds: ["space.hollow-abbey.p07"],
      scopedConnectionHydrologyIds: ["hydrology.hollow-abbey.roof-rain"],
      prohibitedHydrologyIds: ["hydrology.hollow-abbey.bell-wells", "hydrology.hollow-abbey.foundry-blackwater", "hydrology.hollow-abbey.abbey-sink"],
    },
    "hydrology.hollow-abbey.abbey-sink": {
      scope: "off_precinct_excluded",
      spaceIds: [],
      scopedConnectionHydrologyIds: [],
      prohibitedHydrologyIds: ["hydrology.hollow-abbey.roof-rain", "hydrology.hollow-abbey.bell-wells", "hydrology.hollow-abbey.foundry-blackwater", "hydrology.hollow-abbey.p07-receptor"],
    },
  }), "Exact Hollow Abbey hydrology separation contract drifted");

  check(sameArray(site.actorSlots.map(({ actorId }) => actorId), ACTOR_IDS), "Exact 13-actor Hollow Abbey slot set drifted");
  check(sameArray(site.actorSlots.slice(0, 8).map(({ actorId }) => actorId), FOUNDING_ACTOR_IDS), "Founding-eight actor slot order drifted");
  const keth = byId(site.actorSlots, "wound_scribe_keth", "actorId");
  check(keth?.slotKind === "off_site_marker" && keth.homeSpaceId === null && keth.spawnAuthorized === false && keth.schedule.length === 0, "Wound-Scribe Keth must remain off-site and non-spawnable");
  for (const actor of site.actorSlots) {
    const expectedAsset = ACTOR_ASSET_CONTRACT[actor.actorId];
    check(Boolean(expectedAsset) && sameArray([
      actor.assetMaturity.conceptMasterPath,
      actor.assetMaturity.transparentCutoutPath,
      actor.assetMaturity.status,
    ], expectedAsset), `${actor.actorId} concept-art maturity tuple drifted`);
    for (const assetPath of [actor.assetMaturity.conceptMasterPath, actor.assetMaturity.transparentCutoutPath].filter(Boolean)) {
      try { await fileEvidence(repositoryRoot, assetPath); } catch { errors.push(`${actor.actorId} concept reference is not discoverable at ${assetPath}`); }
    }
  }

  check(sameSet(ids(site.encounterSlots), new Set(Object.keys(ENCOUNTER_CONTRACT))), "Exact Hollow Abbey encounter-slot set drifted");
  for (const encounter of site.encounterSlots) {
    check(sameArray([
      encounter.actorOrCreatureId,
      encounter.requiredCount,
      encounter.stateMachineId,
      encounter.overlayBindingId,
    ], ENCOUNTER_CONTRACT[encounter.id]), `${encounter.id} actor, count, state, or overlay binding drifted`);
  }

  const foreword = byId(site.habitats, "habitat.hollow-abbey.foreword-cantor");
  check(foreword?.population.minimum === 1 && foreword.population.maximum === 4 && sameArray(foreword.phaseIds, ["roof_rain"]), "Foreword Cantor habitat must remain 1-4 and roof-rain-only");
  check(forewordHabitat?.population.minimum === 1 && forewordHabitat.population.maximum === 4 && sameArray(forewordHabitat.canonicalPhaseIds, ["roof_rain"]), "Accepted Foreword Cantor source habitat drifted");
  const familyHabitats = site.habitats.filter(({ familyId }) => familyId !== null);
  for (const habitat of familyHabitats) {
    const canonicalFormIds = bestiary.BESTIARY.filter(({ familyId }) => familyId === habitat.familyId).map(({ id }) => id);
    check(canonicalFormIds.length > 0 && sameArray(habitat.creatureIds, canonicalFormIds), `${habitat.id} creature set drifted from canonical family ${habitat.familyId}`);
    check(habitat.sourceHabitatId === "habitat.karst-crypt", `${habitat.id} source habitat must remain the canonical karst crypt`);
  }
  check(foreword?.sourceHabitatId === "habitat.foreword_cantor.hollow_abbey_cause_frames"
    && foreword.familyId === null
    && sameArray(foreword.creatureIds, ["foreword_cantor"])
    && narrative.EXPANSION_CREATURES.some(({ id }) => id === "foreword_cantor"), "Foreword Cantor habitat identity or accepted creature projection drifted");

  const overlay = byId(site.overlayBindings, "overlay.hollow-abbey.foreword-cause-frames");
  const causeFrameRoute = byId(site.routePrograms, "route-program.hollow-abbey.cause-frame-overlay");
  const graph = wave04Environment?.directedEnvironmentGraph;
  check(overlay?.sourceGraphId === "environment_graph.v6.hollow_abbey_foreword_cause_frames" && overlay.sourceGraphId === graph?.id, "Cause-frame graph identity drifted");
  check(graph?.nodes.length === 19 && graph.edges.length === 53 && overlay.sourceGraphRecordSha256 === canonicalRecordSha256(graph), "Cause-frame 19-node/53-edge hash binding drifted");
  check(sameObject(overlay?.expectedCounts, { nodes: 19, directedEdges: 53, safeCells: 1, utilityEndpoints: 5, egressPaths: 2, objectiveEndpoints: 5, habitats: 1 }), "Cause-frame projected counts drifted");
  check(wave04Environment?.utilityGraph.endpoints.length === 5 && wave04Environment.safeObservationCells.length === 1 && wave04Environment.objectivePhaseEndpoints.length === 5, "Accepted cause-frame utility/safe-cell/objective counts drifted");
  check(wave04Environment?.independentEgress.paths.length === 2 && wave04Environment.independentEgress.internallyNodeDisjoint === true && wave04Environment.independentEgress.independentFailureDomains === true, "Accepted cause-frame egresses are no longer internally node-disjoint independent failure domains");
  check(causeFrameRoute?.topologyMode === "external_overlay_reference"
    && sameArray(causeFrameRoute.nodeIds, ["node.hollow-abbey.overlay-cause-frames"])
    && causeFrameRoute.linkIds.length === 0
    && causeFrameRoute.stateMachineId === "state.hollow-abbey.cause-frames", "Cause-frame route must remain an isolated external-overlay proxy with no copied links");
  const expectedInterfaces = [
    { sourceAnchorId: "anchor.hollow_abbey_foreword_cause_frames.entry", localNodeId: "node.hollow-abbey.p07", role: "cause-yard entry after Pera confession" },
    { sourceAnchorId: "anchor.hollow_abbey_foreword_cause_frames.egress_a", localNodeId: "node.hollow-abbey.c01", role: "independent Rain Court egress" },
    { sourceAnchorId: "anchor.hollow_abbey_foreword_cause_frames.egress_b", localNodeId: "node.hollow-abbey.u03", role: "independent upper-service egress" },
    { sourceAnchorId: "anchor.hollow_abbey_foreword_cause_frames.return_a", localNodeId: "node.hollow-abbey.u03", role: "upper branch return" },
    { sourceAnchorId: "anchor.hollow_abbey_foreword_cause_frames.return_b", localNodeId: "node.hollow-abbey.k01", role: "crypt branch return" },
    { sourceAnchorId: "anchor.hollow_abbey_foreword_cause_frames.roof", localNodeId: "node.hollow-abbey.u03", role: "roof monitoring access" },
    { sourceAnchorId: "anchor.hollow_abbey_foreword_cause_frames.crypt", localNodeId: "node.hollow-abbey.k01", role: "crypt interface" },
    { sourceAnchorId: "anchor.hollow_abbey_foreword_cause_frames.service", localNodeId: "node.hollow-abbey.r01", role: "ossuary service interface" },
    { sourceAnchorId: "anchor.hollow_abbey_foreword_cause_frames.drain", localNodeId: "node.hollow-abbey.p07", role: "bounded quest receptor monitoring" },
    { sourceAnchorId: "anchor.hollow_abbey_foreword_cause_frames.refuge", localNodeId: "node.hollow-abbey.p07", role: "accepted safe-clearance domain remains internal to overlay" },
  ];
  check(sameObject(overlay?.interfaceBindings, expectedInterfaces), "Complete cause-frame entry, egress, return, roof, crypt, service, drain, and refuge interface contract drifted");
  const interfaces = new Map(overlay?.interfaceBindings.map((record) => [record.sourceAnchorId, record.localNodeId]));
  check(interfaces.get("anchor.hollow_abbey_foreword_cause_frames.entry") === "node.hollow-abbey.p07"
    && interfaces.get("anchor.hollow_abbey_foreword_cause_frames.egress_a") === "node.hollow-abbey.c01"
    && interfaces.get("anchor.hollow_abbey_foreword_cause_frames.egress_b") === "node.hollow-abbey.u03"
    && interfaces.get("anchor.hollow_abbey_foreword_cause_frames.crypt") === "node.hollow-abbey.k01"
    && interfaces.get("anchor.hollow_abbey_foreword_cause_frames.service") === "node.hollow-abbey.r01"
    && interfaces.get("anchor.hollow_abbey_foreword_cause_frames.drain") === "node.hollow-abbey.p07"
    && interfaces.get("anchor.hollow_abbey_foreword_cause_frames.refuge") === "node.hollow-abbey.p07", "Cause-frame entry, egress, crypt, service, drain, or refuge interface drifted");
  check(interfaces.get("anchor.hollow_abbey_foreword_cause_frames.egress_a") !== interfaces.get("anchor.hollow_abbey_foreword_cause_frames.egress_b"), "Cause-frame egress interfaces must remain distinct base failure domains");

  check(sameArray(site.artDirection.acceptedReferenceIds, ART_REFERENCE_IDS), "Accepted Hollow Abbey art-reference set or order drifted");
  check(site.artDirection.referenceBoundary.startsWith("Direction only:"), "Art references must remain direction-only");
  for (const reference of artReferences.filter(Boolean)) {
    try {
      const evidence = await fileEvidence(repositoryRoot, reference.path);
      check(evidence.sha256 === reference.sha256, `${reference.id} accepted visual payload hash drifted`);
    } catch (error) {
      errors.push(`${reference.id} accepted visual payload evidence failed: ${error.message}`);
    }
  }

  const expectedProvenance = new Map([
    [SITE_BLOCKOUT_V2_SCHEMA_PATH, { ...schemaEvidence, role: "machine_contract", maturity: "reference_schema_v2" }],
    [WAVE_03B_INDEX_PATH, { ...indexEvidence, role: "release_index", maturity: WAVE_03B_REVIEWED_MATURITY }],
    [WAVE_03B_SITE_PATH, { ...siteEvidence, role: "site_local_spatial_reference", maturity: WAVE_03B_REVIEWED_MATURITY }],
    [WAVE_03B_REVIEW_A_PATH, { ...reviewAEvidence, role: "independent_review_manifest", maturity: "evidence_for_independently_reviewed_noncanonical_reference" }],
    [WAVE_03B_REVIEW_B_PATH, { ...reviewBEvidence, role: "independent_review_manifest", maturity: "evidence_for_independently_reviewed_noncanonical_reference" }],
  ]);
  check(provenance.id === "provenance.world-spatial-wave-03b" && provenance.records?.length === 5, "Wave 03B provenance identity or record count drifted");
  check(provenance.tool?.name === "built_in_code_workflow" && provenance.tool?.mode === "site_local_reference_authoring", "Wave 03B provenance tool/mode drifted");
  check(provenance.publication?.privacy === "repository_relative_redacted"
    && ["externalProviderIdentifiers", "workstationPaths", "usernames", "emails", "signedUrls"].every((key) => provenance.publication[key] === false), "Wave 03B provenance privacy flags drifted");
  check(provenance.direction?.sha256 === sha256(Buffer.from(provenance.direction?.text ?? "", "utf8")), "Wave 03B direction hash drifted");
  check(sameObject(provenance.reviewEvidence, {
    reviewMode: "two_independent_read_only_frozen_artifact_reviews",
    schemaSha256: schemaEvidence.sha256,
    indexSha256: indexEvidence.sha256,
    siteSha256: siteEvidence.sha256,
    reviewAManifestPath: WAVE_03B_REVIEW_A_PATH,
    reviewAManifestSha256: reviewAEvidence.sha256,
    reviewBManifestPath: WAVE_03B_REVIEW_B_PATH,
    reviewBManifestSha256: reviewBEvidence.sha256,
  }), "Wave 03B provenance review-evidence chain drifted");
  check(sameSet(ids(provenance.records, "path"), new Set(expectedProvenance.keys())), "Wave 03B provenance path set drifted");
  for (const record of provenance.records ?? []) {
    const expected = expectedProvenance.get(record.path);
    check(expected && record.sha256 === expected.sha256 && record.bytes === expected.bytes && record.role === expected.role && record.maturity === expected.maturity, `Wave 03B provenance evidence drifted for ${record.path}`);
  }
  check(!stringValues({ index, site, provenance, reviewA, reviewB }).some(privateString), "Wave 03B publication contains external provenance or workstation-identifying text");

  return {
    valid: errors.length === 0,
    errors,
    stats: generic.stats,
    evidence: {
      schema: schemaEvidence,
      index: indexEvidence,
      site: siteEvidence,
      reviews: { a: reviewAEvidence, b: reviewBEvidence },
      sourceArtifacts: generic.evidence?.sourceArtifacts ?? {},
    },
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = await validateWorldSpatialWave03b();
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exitCode = 1;
}
