#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const defaultRepositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const schemaPath = "assets/world/spatial/site-blockout-reference-v1.schema.json";
const indexPath = "assets/world/spatial/wave-03a/index.json";
const sitePath = "assets/world/spatial/wave-03a/warden-reed.site.json";
const provenancePath = "assets/world/spatial/wave-03a/provenance.json";
const atlasPath = "packages/content/manifests/sable-reach.atlas-runtime.json";
const worldSpatialPath = "packages/content/src/world-spatial.data.js";
const questAnnexPath = "design-review/quest-release-evidence/quest-wave-04-v11.machine-annex.json";

const falseClaimKeys = Object.freeze([
  "canonical",
  "runtimeIntegrated",
  "constructionReady",
  "productionGeometry",
  "atlasExportEligible",
  "releaseReady",
  "authorSelfApproval",
  "integrationAuthorized",
]);
const reviewedMaturity = "independently_reviewed_noncanonical_reference";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export const canonicalRecordSha256 = (value) => sha256(Buffer.from(canonicalJson(value), "utf8"));

const ids = (records, field = "id") => new Set(records.map((record) => record[field]));
const unique = (values) => new Set(values).size === values.length;
const sameArray = (left, right) => left.length === right.length && left.every((value, index) => value === right[index]);
const sameSet = (left, right) => left.size === right.size && [...left].every((value) => right.has(value));
const inBounds = (point, bounds) => point.every((value, index) => value >= bounds.minimum[index] && value <= bounds.maximum[index]);

function addUndirectedEdge(graph, from, to) {
  if (!graph.has(from)) graph.set(from, new Set());
  if (!graph.has(to)) graph.set(to, new Set());
  graph.get(from).add(to);
  graph.get(to).add(from);
}

function reachable(graph, origin, destination) {
  if (origin === destination) return true;
  const seen = new Set([origin]);
  const pending = [origin];
  while (pending.length > 0) {
    const current = pending.shift();
    for (const adjacent of graph.get(current) ?? []) {
      if (adjacent === destination) return true;
      if (!seen.has(adjacent)) {
        seen.add(adjacent);
        pending.push(adjacent);
      }
    }
  }
  return false;
}

function jsonValueType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  if (typeof value === "number") return "number";
  return typeof value;
}

function resolvesType(value, expectedType) {
  if (expectedType === "number") return typeof value === "number" && Number.isFinite(value);
  if (expectedType === "integer") return Number.isInteger(value);
  if (expectedType === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  return jsonValueType(value) === expectedType;
}

export function validateJsonSchema(rootSchema, value) {
  const failures = [];
  const resolveReference = (reference) => {
    if (!reference.startsWith("#/")) return null;
    return reference.slice(2).split("/").reduce(
      (current, token) => current?.[token.replaceAll("~1", "/").replaceAll("~0", "~")],
      rootSchema,
    );
  };

  const visit = (schemaNode, candidate, candidatePath, output) => {
    if (schemaNode === true) return;
    if (schemaNode === false) {
      output.push(`${candidatePath} is forbidden by the schema`);
      return;
    }
    if (!schemaNode || typeof schemaNode !== "object") {
      output.push(`${candidatePath} has an invalid schema node`);
      return;
    }

    if (schemaNode.$ref) {
      const resolved = resolveReference(schemaNode.$ref);
      if (!resolved) output.push(`${candidatePath} uses unresolved schema reference ${schemaNode.$ref}`);
      else visit(resolved, candidate, candidatePath, output);
    }
    if (Object.hasOwn(schemaNode, "const") && canonicalJson(candidate) !== canonicalJson(schemaNode.const)) {
      output.push(`${candidatePath} must equal ${canonicalJson(schemaNode.const)}`);
    }
    if (schemaNode.enum && !schemaNode.enum.some((allowed) => canonicalJson(allowed) === canonicalJson(candidate))) {
      output.push(`${candidatePath} is not one of the allowed enum values`);
    }
    if (schemaNode.oneOf) {
      const branchFailures = schemaNode.oneOf.map((branch) => {
        const branchOutput = [];
        visit(branch, candidate, candidatePath, branchOutput);
        return branchOutput;
      });
      if (branchFailures.filter((branch) => branch.length === 0).length !== 1) output.push(`${candidatePath} must match exactly one oneOf branch`);
    }

    if (schemaNode.type) {
      const allowedTypes = Array.isArray(schemaNode.type) ? schemaNode.type : [schemaNode.type];
      if (!allowedTypes.some((expectedType) => resolvesType(candidate, expectedType))) {
        output.push(`${candidatePath} must have type ${allowedTypes.join(" or ")}`);
        return;
      }
    }

    if (candidate !== null && typeof candidate === "object" && !Array.isArray(candidate)) {
      for (const key of schemaNode.required ?? []) {
        if (!Object.hasOwn(candidate, key)) output.push(`${candidatePath}.${key} is required`);
      }
      const propertySchemas = schemaNode.properties ?? {};
      for (const [key, child] of Object.entries(candidate)) {
        if (Object.hasOwn(propertySchemas, key)) visit(propertySchemas[key], child, `${candidatePath}.${key}`, output);
        else if (schemaNode.additionalProperties === false) output.push(`${candidatePath}.${key} is not allowed`);
        else if (schemaNode.additionalProperties && typeof schemaNode.additionalProperties === "object") visit(schemaNode.additionalProperties, child, `${candidatePath}.${key}`, output);
      }
    }

    if (Array.isArray(candidate)) {
      if (schemaNode.minItems !== undefined && candidate.length < schemaNode.minItems) output.push(`${candidatePath} must contain at least ${schemaNode.minItems} items`);
      if (schemaNode.maxItems !== undefined && candidate.length > schemaNode.maxItems) output.push(`${candidatePath} must contain at most ${schemaNode.maxItems} items`);
      if (schemaNode.items) candidate.forEach((item, index) => visit(schemaNode.items, item, `${candidatePath}[${index}]`, output));
    }

    if (typeof candidate === "string") {
      if (schemaNode.minLength !== undefined && candidate.length < schemaNode.minLength) output.push(`${candidatePath} must contain at least ${schemaNode.minLength} characters`);
      if (schemaNode.pattern && !new RegExp(schemaNode.pattern).test(candidate)) output.push(`${candidatePath} does not match ${schemaNode.pattern}`);
    }

    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      if (schemaNode.minimum !== undefined && candidate < schemaNode.minimum) output.push(`${candidatePath} must be at least ${schemaNode.minimum}`);
      if (schemaNode.maximum !== undefined && candidate > schemaNode.maximum) output.push(`${candidatePath} must be at most ${schemaNode.maximum}`);
      if (schemaNode.exclusiveMinimum !== undefined && candidate <= schemaNode.exclusiveMinimum) output.push(`${candidatePath} must exceed ${schemaNode.exclusiveMinimum}`);
    }
  };

  visit(rootSchema, value, "$", failures);
  return failures;
}

function safeRepositoryPath(repositoryRoot, repositoryRelativePath) {
  if (
    typeof repositoryRelativePath !== "string"
    || path.isAbsolute(repositoryRelativePath)
    || /^[A-Za-z]:/.test(repositoryRelativePath)
    || repositoryRelativePath.includes("\\")
    || repositoryRelativePath.split("/").includes("..")
  ) return null;
  const resolved = path.resolve(repositoryRoot, repositoryRelativePath);
  return resolved.startsWith(`${path.resolve(repositoryRoot)}${path.sep}`) ? resolved : null;
}

async function readJson(repositoryRoot, repositoryRelativePath) {
  const resolved = safeRepositoryPath(repositoryRoot, repositoryRelativePath);
  if (!resolved) throw new Error(`Unsafe repository-relative path: ${repositoryRelativePath}`);
  return JSON.parse(await readFile(resolved, "utf8"));
}

async function fileEvidence(repositoryRoot, repositoryRelativePath) {
  const resolved = safeRepositoryPath(repositoryRoot, repositoryRelativePath);
  if (!resolved) throw new Error(`Unsafe repository-relative path: ${repositoryRelativePath}`);
  const bytes = await readFile(resolved);
  return { bytes: bytes.length, sha256: sha256(bytes) };
}

function derivedCounts(site) {
  return {
    structures: site.structures.length,
    rooms: site.structures.reduce((total, structure) => total + structure.rooms.length, 0),
    thresholds: site.thresholds.length,
    egressPaths: site.egress.paths.length,
    utilities: site.utilities.length,
    hazards: site.hazards.length,
    habitats: site.habitats.length,
    routes: site.routes.length,
    activityPhases: site.activityPhases.length,
    questObjectives: site.questCrosswalk.objectives.length,
  };
}

export async function validateWorldSpatialWave03a({ repositoryRoot = defaultRepositoryRoot, siteOverride = null, provenanceOverride = null } = {}) {
  const errors = [];
  const check = (condition, message) => {
    if (!condition) errors.push(message);
  };

  let schema;
  let index;
  let site;
  let provenance;
  let atlas;
  let questAnnex;
  let worldSpatial;
  try {
    let publishedSite;
    let publishedProvenance;
    [schema, index, publishedSite, publishedProvenance, atlas, questAnnex, worldSpatial] = await Promise.all([
      readJson(repositoryRoot, schemaPath),
      readJson(repositoryRoot, indexPath),
      readJson(repositoryRoot, sitePath),
      readJson(repositoryRoot, provenancePath),
      readJson(repositoryRoot, atlasPath),
      readJson(repositoryRoot, questAnnexPath),
      import(pathToFileURL(path.join(repositoryRoot, worldSpatialPath)).href),
    ]);
    site = siteOverride ?? publishedSite;
    provenance = provenanceOverride ?? publishedProvenance;
  } catch (error) {
    return { valid: false, errors: [`Unable to load Wave 03A inputs: ${error.message}`], stats: null };
  }

  for (const failure of validateJsonSchema(schema, site)) errors.push(`Schema validation failed: ${failure}`);

  check(schema.$id === schemaPath, "Schema $id must remain repository-relative and exact");
  check(schema.properties?.claims?.properties && falseClaimKeys.every((key) => schema.properties.claims.properties[key]?.const === false), "Schema must pin every authority/readiness claim false");
  check(schema.properties?.structures?.minItems === 2 && schema.properties?.structures?.maxItems === 2, "Schema must require exactly two structures");
  check(schema.$defs?.structure?.properties?.rooms?.minItems === 6 && schema.$defs?.structure?.properties?.rooms?.maxItems === 6, "Schema must require six rooms per structure");
  check(schema.properties?.anchorPlacements?.minItems === 18 && schema.properties?.anchorPlacements?.maxItems === 18, "Schema must require exactly eighteen anchor placements");
  check(["sourceFromAnchorId", "sourceToAnchorId"].every((key) => schema.$defs?.directedEdgeBinding?.required?.includes(key)), "Schema must require exact directed-edge endpoint bindings");
  check(["fromPortId", "toPortId", "sourceDirectedEdgeBindings"].every((key) => schema.$defs?.threshold?.required?.includes(key)), "Schema must require explicit threshold ports and directed-edge bindings");
  check(schema.$defs?.route?.required?.includes("sourceSegments"), "Schema must require source-segment route networks");
  check(schema.$defs?.egressPath?.properties?.minimumClearWidthMeters?.const === 2.2, "Schema must pin every egress path to exactly 2.2 meters minimum clear width");
  check(schema.properties?.utilities?.minItems === 6 && schema.properties?.utilities?.maxItems === 6, "Schema must require exactly six utilities");
  check(schema.properties?.hazards?.minItems === 5 && schema.properties?.hazards?.maxItems === 5, "Schema must require exactly five hazards");

  check(index.schemaVersion === 1 && site.schemaVersion === 1 && provenance.schemaVersion === 1, "Wave 03A schema versions must equal one");
  check(index.schemaPath === schemaPath, "Index schema path drifted");
  check(index.provenancePath === provenancePath, "Index provenance path drifted");
  check(index.sites?.length === 1 && index.sites[0]?.path === sitePath, "Index must contain exactly the Warden Reed site record");
  check(site.id === "site-blockout.wave-03a.warden-reed" && site.siteId === "site.warden-reed", "Site identity drifted");
  for (const [scope, claims] of [["index", index.claims], ["site", site.claims]]) {
    check(claims && falseClaimKeys.every((key) => claims[key] === false), `${scope} contains an authority or readiness overclaim`);
  }
  check(site.authority?.classification === "noncanonical_site_local_reference", "Site authority classification must remain noncanonical");
  check(site.authority?.precedence?.length >= 4, "Site authority precedence must name atlas, world-spatial, quest, and local-reference layers");

  const counts = derivedCounts(site);
  const expectedCounts = {
    structures: 2,
    rooms: 12,
    thresholds: 15,
    egressPaths: 2,
    utilities: 6,
    hazards: 5,
    habitats: 4,
    routes: 8,
    activityPhases: 4,
    questObjectives: 4,
  };
  check(JSON.stringify(counts) === JSON.stringify(expectedCounts), `Site count contract drifted: ${JSON.stringify(counts)}`);
  check(JSON.stringify(index.sites[0]?.counts) === JSON.stringify(expectedCounts), "Index counts do not match the exact site-local contract");

  const roomRecords = site.structures.flatMap((structure) => structure.rooms);
  const roomIds = ids(roomRecords);
  const thresholdIds = ids(site.thresholds);
  const routeIds = ids(site.routes);
  check(roomIds.size === 12, "Room IDs must be unique across both structures");
  check(thresholdIds.size === site.thresholds.length, "Threshold IDs must be unique");
  check(routeIds.size === site.routes.length, "Route IDs must be unique");
  check(unique(site.egress.paths.map(({ id }) => id)), "Egress path record IDs must be unique");
  check(unique(site.egress.paths.map(({ sourcePathId }) => sourcePathId)), "Accepted egress source-path IDs must be unique");
  check(unique(site.egress.paths.map(({ routeId }) => routeId)), "Egress route IDs must be unique");
  check(unique(site.utilities.map(({ id }) => id)), "Utility IDs must be unique");
  check(unique(site.hazards.map(({ id }) => id)), "Hazard IDs must be unique");
  check(unique(site.habitats.map(({ id }) => id)), "Habitat IDs must be unique");

  const siteBounds = site.spatialReference.localBoundsMeters;
  const operationalPhaseIds = ["first_light", "day", "fog_fall", "night"];
  const operationalPhaseIdSet = new Set(operationalPhaseIds);
  for (const room of roomRecords) check(inBounds(room.localCentroidMeters, siteBounds), `${room.id} lies outside the site-local envelope`);
  for (const structure of site.structures) {
    check(inBounds(structure.boundsLocalMeters.minimum, siteBounds) && inBounds(structure.boundsLocalMeters.maximum, siteBounds), `${structure.id} bounds exceed the site-local envelope`);
  }
  for (const route of site.routes) {
    check(route.roomIds.every((id) => roomIds.has(id)), `${route.id} references an unknown room`);
    check(route.localRoomSegments.every(({ fromRoomId, toRoomId }) => roomIds.has(fromRoomId) && roomIds.has(toRoomId)), `${route.id} contains a local segment with an unknown room`);
    check(route.localRoomSegments.every(({ fromRoomId, toRoomId }) => route.roomIds.includes(fromRoomId) && route.roomIds.includes(toRoomId)), `${route.id} omits a local-segment endpoint from its room set`);
    check(unique(route.phaseAvailability) && route.phaseAvailability.every((id) => operationalPhaseIdSet.has(id)), `${route.id} has an invalid or duplicate phase-availability entry`);
  }

  const atlasSite = atlas.sites.find(({ id }) => id === "site.warden-reed");
  const atlasRoute = atlas.routes.find(({ id }) => id === "route.reedward-causeway");
  const atlasHabitat = atlas.habitats.find(({ id }) => id === "habitat.drowned-mire");
  const spatialSite = worldSpatial.SITE_SPATIAL_ENVELOPES.find(({ id }) => id === "site.warden-reed");
  const spatialActivity = worldSpatial.SITE_ACTIVITY_CYCLES.find(({ siteId }) => siteId === "site.warden-reed");
  const stiltTypology = worldSpatial.BUILDING_TYPOLOGIES.find(({ id }) => id === "dunmire_stilt_house");
  const quest = questAnnex.quests.find(({ id }) => id === "regional_the_fog_came_to_collect_our_outlines");
  const environment = questAnnex.environmentPrograms.find(({ locationId }) => locationId === "warden_reed_four_bank_visibility");
  check(Boolean(atlasSite && atlasRoute && atlasHabitat && spatialSite && spatialActivity && stiltTypology && quest && environment), "One or more authoritative Warden Reed source records are missing");

  if (atlasSite && spatialSite && environment) {
    check(sameArray(site.spatialReference.atlasSiteAnchor, atlasSite.coordinate), "Candidate blockout changed the canonical atlas site anchor");
    check(sameArray(site.spatialReference.localOriginAtlasCoordinate, environment.placement.provisionalDesignCoordinate), "Candidate local origin drifted from the accepted relocatable quest reservation");
    check(environment.placement.placementStatus === "candidate_blockout_reservation_not_canon", "Upstream environment placement no longer has candidate-only status");
    check(spatialSite.designEnvelope.boundaryStatus === "provisional_not_cadastral", "Host site design envelope no longer declares its provisional boundary status");
    const absoluteMinimum = siteBounds.minimum.map((value, index) => value + site.spatialReference.localOriginAtlasCoordinate[index]);
    const absoluteMaximum = siteBounds.maximum.map((value, index) => value + site.spatialReference.localOriginAtlasCoordinate[index]);
    const designBounds = spatialSite.designEnvelope.bounds;
    check(absoluteMinimum[0] >= designBounds.minimumEasting && absoluteMaximum[0] <= designBounds.maximumEasting, "Candidate x extent escapes the host influence bounds");
    check(absoluteMinimum[1] >= designBounds.minimumNorthing && absoluteMaximum[1] <= designBounds.maximumNorthing, "Candidate y extent escapes the host influence bounds");
    check(absoluteMinimum[2] >= spatialSite.designEnvelope.verticalRangeMeters[0] && absoluteMaximum[2] <= spatialSite.designEnvelope.verticalRangeMeters[1], "Candidate z extent escapes the host vertical design range");
  }

  const artifactEvidence = new Map();
  for (const binding of site.sourceBindings) {
    if (!artifactEvidence.has(binding.path)) artifactEvidence.set(binding.path, await fileEvidence(repositoryRoot, binding.path));
    const evidence = artifactEvidence.get(binding.path);
    check(binding.sha256 === evidence.sha256, `${binding.id} source artifact hash drifted`);
    check(binding.bytes === evidence.bytes, `${binding.id} source artifact byte count drifted`);
  }

  const sourceRecordsByBindingId = new Map([
    ["source.atlas.warden-reed", atlasSite],
    ["source.atlas.reedward-causeway", atlasRoute],
    ["source.atlas.drowned-mire", atlasHabitat],
    ["source.world-spatial.warden-reed-envelope", spatialSite],
    ["source.world-spatial.warden-reed-activity", spatialActivity],
    ["source.world-spatial.dunmire-stilt-house", stiltTypology],
    ["source.quest-wave-04.warden-reed-quest", quest],
    ["source.quest-wave-04.warden-reed-environment", environment],
  ]);
  check(site.sourceBindings.length === sourceRecordsByBindingId.size, "Source-binding set must contain only the eight reviewed records");
  for (const binding of site.sourceBindings) {
    const record = sourceRecordsByBindingId.get(binding.id);
    check(Boolean(record), `${binding.id} is not a reviewed source binding`);
    if (record) check(binding.recordSha256 === canonicalRecordSha256(record), `${binding.id} canonical record hash drifted`);
  }

  if (environment && quest) {
    check(site.questCrosswalk.questId === quest.id && site.questCrosswalk.locationId === environment.locationId, "Quest crosswalk identity drifted");
    check(site.questCrosswalk.questRecordSha256 === canonicalRecordSha256(quest), "Quest crosswalk quest hash drifted");
    check(site.questCrosswalk.environmentProgramSha256 === canonicalRecordSha256(environment), "Quest crosswalk environment hash drifted");
    check(site.questCrosswalk.bindingMode === "id_and_canonical_json_hash_no_contract_copy", "Quest crosswalk must bind by ID and hash");
    check(!("premise" in site.questCrosswalk) && !("objectives" in site.questCrosswalk && site.questCrosswalk.objectives.some((value) => "objectiveType" in value || "completionEvidence" in value)), "Quest prose or endpoint contracts were copied into the blockout instead of bound");

    const acceptedAnchorById = new Map(environment.semanticAnchors.map((anchor) => [anchor.id, anchor]));
    const requiredAnchorIds = new Set(environment.blockoutExecutionContract.requiredNodeIds);
    const placementByAnchorId = new Map(site.anchorPlacements.map((placement) => [placement.anchorId, placement]));
    const placementByPortId = new Map(site.anchorPlacements.map((placement) => [placement.portId, placement]));
    check(site.anchorPlacements.length === 18, "Site must expose exactly eighteen anchor placements");
    check(placementByAnchorId.size === site.anchorPlacements.length, "Anchor placement IDs must be unique");
    check(placementByPortId.size === site.anchorPlacements.length, "Anchor placement port IDs must be unique");
    check(sameSet(new Set(placementByAnchorId.keys()), requiredAnchorIds), "Anchor placements must exactly cover the accepted required nodes");
    for (const placement of site.anchorPlacements) {
      const acceptedAnchor = acceptedAnchorById.get(placement.anchorId);
      check(Boolean(acceptedAnchor), `${placement.anchorId} is not an accepted semantic anchor`);
      if (acceptedAnchor) check(sameArray(placement.localCoordinateMeters, acceptedAnchor.localCoordinateMeters), `${placement.anchorId} local coordinates drifted from the accepted anchor`);
      check(inBounds(placement.localCoordinateMeters, siteBounds), `${placement.anchorId} lies outside the site-local envelope`);
      check(placement.macroRoomId === null || roomIds.has(placement.macroRoomId), `${placement.anchorId} maps to an unknown macro room`);
    }

    const refugeId = "anchor.warden_reed_four_bank_visibility.refuge";
    const egressAId = "anchor.warden_reed_four_bank_visibility.egress_a";
    const egressBId = "anchor.warden_reed_four_bank_visibility.egress_b";
    const domainAId = "anchor.warden_reed_four_bank_visibility.egress_domain_a";
    const domainBId = "anchor.warden_reed_four_bank_visibility.egress_domain_b";
    const refugeRoomId = "room.warden-reed.exchange.raised-refuge";
    check(placementByAnchorId.get(refugeId)?.macroRoomId === refugeRoomId, "Raised refuge must bind only the accepted refuge anchor");
    for (const anchorId of [egressAId, egressBId]) {
      const placement = placementByAnchorId.get(anchorId);
      check(placement?.macroRoomId === null && placement?.placementKind === "external_destination", `${anchorId} must remain an external destination outside every macro room`);
    }
    for (const anchorId of [domainAId, domainBId]) {
      const placement = placementByAnchorId.get(anchorId);
      check(placement?.macroRoomId === null && placement?.placementKind === "interior_egress_vertex", `${anchorId} must remain a distinct interior egress vertex outside every macro room`);
    }
    check(site.anchorPlacements.filter(({ macroRoomId }) => macroRoomId === refugeRoomId).every(({ anchorId }) => anchorId === refugeId), "Raised refuge falsely absorbs another canonical anchor or egress domain");

    const acceptedEdgeIds = new Set(environment.blockoutExecutionContract.requiredEdgeIds);
    const acceptedEdgeById = new Map(environment.directedEnvironmentGraph.edges.map((edge) => [edge.id, edge]));
    check([...acceptedEdgeIds].every((id) => acceptedEdgeById.has(id)), "Accepted required edge set is missing from the directed environment graph");

    const routeById = new Map(site.routes.map((route) => [route.id, route]));
    const allSourceSegments = site.routes.flatMap((route) => route.sourceSegments.map((segment) => ({ ...segment, routeId: route.id })));
    const allSourceEdgeIds = allSourceSegments.map(({ edgeId }) => edgeId);
    const utilityConduitEdgeIds = new Set(environment.utilityGraph.endpoints.flatMap(({ conduitEdgeIds }) => conduitEdgeIds));
    const expectedRouteEdgeIds = new Set([...acceptedEdgeIds].filter((id) => !utilityConduitEdgeIds.has(id)));
    check(unique(allSourceEdgeIds), "Accepted directed edges must appear in exactly one local route network");
    check(sameSet(new Set(allSourceEdgeIds), expectedRouteEdgeIds), "Local route networks must exactly partition all forty-six non-utility accepted edges");
    for (const segment of allSourceSegments) {
      const acceptedEdge = acceptedEdgeById.get(segment.edgeId);
      const fromPlacement = placementByPortId.get(segment.fromPortId);
      const toPlacement = placementByPortId.get(segment.toPortId);
      check(Boolean(acceptedEdge), `${segment.routeId} references an unaccepted environment edge ${segment.edgeId}`);
      check(Boolean(fromPlacement && toPlacement), `${segment.routeId} references an unknown local route port`);
      if (acceptedEdge && fromPlacement && toPlacement) {
        check(
          fromPlacement.anchorId === acceptedEdge.fromAnchorId && toPlacement.anchorId === acceptedEdge.toAnchorId,
          `${segment.routeId} edge ${segment.edgeId} has incorrect endpoint orientation`,
        );
        const routeRooms = new Set(routeById.get(segment.routeId)?.roomIds ?? []);
        if (fromPlacement.macroRoomId) check(routeRooms.has(fromPlacement.macroRoomId), `${segment.routeId} omits the from-port macro room for ${segment.edgeId}`);
        if (toPlacement.macroRoomId) check(routeRooms.has(toPlacement.macroRoomId), `${segment.routeId} omits the to-port macro room for ${segment.edgeId}`);
      }
    }
    const bankSpine = routeById.get("route.warden-reed.bank-spine");
    check(bankSpine?.topology === "bank_a_and_bank_b_join_at_frame_ab_then_ledger_then_frame_cd_splits_to_bank_c_and_bank_d", "Bank route must retain its accepted join-ledger-split topology");
    check(bankSpine?.sourceSegments.length === 12, "Bank route must bind the exact twelve directed join/split edges");

    const typologyThresholdIds = ids(stiltTypology.thresholds);
    const houseThresholds = site.thresholds.filter(({ sourceBindingId }) => sourceBindingId !== null);
    const exchangeThresholds = site.thresholds.filter(({ sourceBindingId }) => sourceBindingId === null);
    check(houseThresholds.length === 5 && exchangeThresholds.length === 10, "Threshold set must contain five house thresholds and ten exchange spans");
    const localHouseSourceBindingIds = houseThresholds.map(({ sourceBindingId }) => sourceBindingId);
    check(unique(localHouseSourceBindingIds) && sameSet(new Set(localHouseSourceBindingIds), typologyThresholdIds), "House thresholds must uniquely and exactly bind the five accepted typology thresholds");
    for (const threshold of houseThresholds) {
      check(roomIds.has(threshold.fromRoomId) && roomIds.has(threshold.to), `${threshold.id} has an unknown house room endpoint`);
      check(threshold.fromPortId === null && threshold.toPortId === null, `${threshold.id} must not invent canonical ports for a typology-only threshold`);
      check(threshold.sourceDirectedEdgeBindings.length === 0, `${threshold.id} must not bind accepted environment edges`);
      check(typologyThresholdIds.has(threshold.sourceBindingId), `${threshold.id} references an unknown stilt-house threshold`);
    }
    const thresholdSourceEdgeIds = [];
    for (const threshold of exchangeThresholds) {
      const fromPlacement = placementByPortId.get(threshold.fromPortId);
      const toPlacement = placementByPortId.get(threshold.toPortId);
      check(Boolean(fromPlacement && toPlacement), `${threshold.id} references an unknown exchange port`);
      if (!(fromPlacement && toPlacement)) continue;
      check(threshold.fromRoomId === fromPlacement.macroRoomId, `${threshold.id} from-room is incompatible with its from-port`);
      check(threshold.to === toPlacement.macroRoomId, `${threshold.id} destination is incompatible with its to-port`);
      check(threshold.sourceDirectedEdgeBindings.length === 2, `${threshold.id} must bind one forward and one reverse accepted edge`);
      let hasForward = false;
      let hasReverse = false;
      for (const binding of threshold.sourceDirectedEdgeBindings) {
        thresholdSourceEdgeIds.push(binding.edgeId);
        const acceptedEdge = acceptedEdgeById.get(binding.edgeId);
        check(Boolean(acceptedEdge), `${threshold.id} references an unaccepted environment edge ${binding.edgeId}`);
        if (!acceptedEdge) continue;
        check(
          binding.sourceFromAnchorId === acceptedEdge.fromAnchorId && binding.sourceToAnchorId === acceptedEdge.toAnchorId,
          `${threshold.id} edge ${binding.edgeId} has incorrect endpoint orientation`,
        );
        const endpointsMatchPorts = (
          (binding.sourceFromAnchorId === fromPlacement.anchorId && binding.sourceToAnchorId === toPlacement.anchorId)
          || (binding.sourceFromAnchorId === toPlacement.anchorId && binding.sourceToAnchorId === fromPlacement.anchorId)
        );
        check(endpointsMatchPorts, `${threshold.id} edge ${binding.edgeId} is incompatible with its local ports`);
        hasForward ||= binding.sourceFromAnchorId === fromPlacement.anchorId && binding.sourceToAnchorId === toPlacement.anchorId;
        hasReverse ||= binding.sourceFromAnchorId === toPlacement.anchorId && binding.sourceToAnchorId === fromPlacement.anchorId;
      }
      check(hasForward && hasReverse, `${threshold.id} must bind both exact port orientations`);
    }
    const expectedThresholdEdgeIds = new Set([...expectedRouteEdgeIds].filter((id) => /\.(?:00[5-9]|01[0-6])\./.test(id) || /\.egress_[ab]_(?:0[12]|return_0[12])$/.test(id)));
    check(unique(thresholdSourceEdgeIds) && sameSet(new Set(thresholdSourceEdgeIds), expectedThresholdEdgeIds), "Exchange thresholds must exactly bind the twenty accepted paired-frame and detailed-egress edges");

    const endpointById = new Map(environment.objectivePhaseEndpoints.map((endpoint) => [endpoint.objectiveId, endpoint]));
    check(endpointById.size === 4, "Accepted Warden Reed environment must retain four objective endpoints");
    const localObjectiveBindingIds = site.questCrosswalk.objectives.map(({ objectiveId }) => objectiveId);
    check(unique(localObjectiveBindingIds) && sameSet(new Set(localObjectiveBindingIds), new Set(endpointById.keys())), "Quest crosswalk must uniquely and exactly bind all four accepted objective endpoints");
    for (const binding of site.questCrosswalk.objectives) {
      const endpoint = endpointById.get(binding.objectiveId);
      check(Boolean(endpoint), `${binding.objectiveId} is not an accepted Warden Reed objective endpoint`);
      if (endpoint) {
        check(binding.sourceEndpointSha256 === canonicalRecordSha256(endpoint), `${binding.objectiveId} endpoint hash drifted`);
        check(binding.phaseId === endpoint.canonicalPhaseId, `${binding.objectiveId} local phase no longer matches the accepted endpoint`);
        const localEvidenceEdges = new Set(binding.requiredLocalRouteIds.flatMap((id) => routeById.get(id)?.sourceSegments.map(({ edgeId }) => edgeId) ?? []));
        check(endpoint.completionEvidence.requiredRouteEdgeIds.every((id) => localEvidenceEdges.has(id)), `${binding.objectiveId} local route network does not cover every completion-evidence edge`);
      }
      check(binding.localEvidenceRoomIds.every((id) => roomIds.has(id)), `${binding.objectiveId} references an unknown local evidence room`);
      check(binding.requiredLocalRouteIds.every((id) => routeIds.has(id)), `${binding.objectiveId} references an unknown local route`);
      check(binding.requiredLocalRouteIds.every((id) => routeById.get(id)?.phaseAvailability.includes(binding.phaseId)), `${binding.objectiveId} requires a local route unavailable in its accepted objective phase`);
    }

    const buildMixedRouteGraph = (selectedRoutes) => {
      const graph = new Map();
      const selectedRoomIds = new Set(selectedRoutes.flatMap(({ roomIds: selectedRooms }) => selectedRooms));
      for (const placement of site.anchorPlacements) {
        if (placement.macroRoomId && selectedRoomIds.has(placement.macroRoomId)) addUndirectedEdge(graph, placement.anchorId, placement.macroRoomId);
      }
      for (const route of selectedRoutes) {
        for (const segment of route.localRoomSegments) addUndirectedEdge(graph, segment.fromRoomId, segment.toRoomId);
        for (const segment of route.sourceSegments) {
          const acceptedEdge = acceptedEdgeById.get(segment.edgeId);
          if (acceptedEdge) addUndirectedEdge(graph, acceptedEdge.fromAnchorId, acceptedEdge.toAnchorId);
        }
      }
      return graph;
    };

    const buildAnchorRouteGraph = (selectedRoutes) => {
      const graph = new Map();
      for (const segment of selectedRoutes.flatMap(({ sourceSegments }) => sourceSegments)) {
        const acceptedEdge = acceptedEdgeById.get(segment.edgeId);
        if (acceptedEdge) addUndirectedEdge(graph, acceptedEdge.fromAnchorId, acceptedEdge.toAnchorId);
      }
      return graph;
    };

    const acceptedUtilityById = new Map(environment.utilityGraph.endpoints.map((endpoint) => [endpoint.id, endpoint]));
    const locallyBoundUtilities = site.utilities.filter(({ sourceEndpointBinding }) => sourceEndpointBinding);
    check(locallyBoundUtilities.length === 5, "Exactly five utilities must hash-bind accepted Wave 04 endpoints; sealed waste remains a typology-derived local service");
    const localUtilityEndpointIds = locallyBoundUtilities.map(({ sourceEndpointBinding }) => sourceEndpointBinding.id);
    check(unique(localUtilityEndpointIds) && sameSet(new Set(localUtilityEndpointIds), new Set(acceptedUtilityById.keys())), "Utilities must uniquely and exactly bind all five accepted utility endpoints");
    for (const utility of site.utilities) {
      check(roomIds.has(utility.sourceRoomId) && utility.terminalRoomIds.every((id) => roomIds.has(id)), `${utility.id} references an unknown room`);
      check(utility.maintenanceRouteIds.length > 0 && unique(utility.maintenanceRouteIds) && utility.maintenanceRouteIds.every((id) => routeIds.has(id)), `${utility.id} references an unknown or duplicate maintenance route`);
      check(utility.phaseAvailability.length > 0 && unique(utility.phaseAvailability) && utility.phaseAvailability.every((id) => operationalPhaseIdSet.has(id)), `${utility.id} has an invalid or duplicate available phase`);
      const maintenanceRoutes = utility.maintenanceRouteIds.map((id) => routeById.get(id)).filter(Boolean);
      let endpoint = null;
      if (utility.sourceEndpointBinding) {
        endpoint = acceptedUtilityById.get(utility.sourceEndpointBinding.id);
        check(Boolean(endpoint), `${utility.id} references an unknown accepted utility endpoint`);
        if (endpoint) {
          check(utility.sourceEndpointBinding.recordSha256 === canonicalRecordSha256(endpoint), `${utility.id} accepted endpoint hash drifted`);
          check(placementByAnchorId.get(endpoint.fromAnchorId)?.macroRoomId === utility.sourceRoomId, `${utility.id} source room is incompatible with the accepted source anchor`);
          check(utility.terminalRoomIds.includes(placementByAnchorId.get(endpoint.toAnchorId)?.macroRoomId), `${utility.id} terminal room is incompatible with the accepted terminal anchor`);
          check(sameSet(new Set(utility.phaseAvailability), new Set(endpoint.phaseState.map(({ phaseId }) => phaseId))), `${utility.id} available phases drifted from its accepted endpoint phase states`);
        }
      }

      for (const phaseId of utility.phaseAvailability) {
        const phaseRoutes = maintenanceRoutes.filter(({ phaseAvailability }) => phaseAvailability.includes(phaseId));
        check(phaseRoutes.length > 0, `${utility.id} has no maintenance route available during ${phaseId}`);
        const phaseMaintenanceGraph = buildMixedRouteGraph(phaseRoutes);
        for (const terminalRoomId of utility.terminalRoomIds) {
          check(reachable(phaseMaintenanceGraph, utility.sourceRoomId, terminalRoomId), `${utility.id} maintenance routes do not connect its local source and terminal rooms during ${phaseId}`);
        }
        if (endpoint) {
          const phaseMaintenanceEdgeIds = new Set(phaseRoutes.flatMap(({ sourceSegments }) => sourceSegments.map(({ edgeId }) => edgeId)));
          check(endpoint.maintenance.routeEdgeIds.every((id) => phaseMaintenanceEdgeIds.has(id)), `${utility.id} omits an accepted maintenance edge during ${phaseId}`);
          const phaseAnchorGraph = buildAnchorRouteGraph(phaseRoutes);
          check(reachable(phaseAnchorGraph, endpoint.maintenance.originAnchorId, endpoint.fromAnchorId), `${utility.id} maintenance origin cannot reach its accepted source anchor during ${phaseId}`);
          check(reachable(phaseAnchorGraph, endpoint.maintenance.originAnchorId, endpoint.toAnchorId), `${utility.id} maintenance origin cannot reach its accepted terminal anchor during ${phaseId}`);
        }
      }
    }

    const localSourceHazardIds = new Set(site.hazards.map(({ sourceHazardId }) => sourceHazardId));
    check(localSourceHazardIds.size === 5, "The five local hazards must bind five distinct source hazards");
    check(sameSet(localSourceHazardIds, new Set(environment.foundationAndHazards.hazards)), "The local hazard set does not exactly cover the accepted environment hazards");
    for (const hazard of site.hazards) {
      check(hazard.affectedRoomIds.every((id) => roomIds.has(id)), `${hazard.id} references an unknown room`);
      check(unique(hazard.avoidanceRouteIds) && hazard.avoidanceRouteIds.every((id) => routeIds.has(id)), `${hazard.id} references an unknown or duplicate avoidance route`);
      check(unique(hazard.activePhaseIds) && hazard.activePhaseIds.every((id) => operationalPhaseIdSet.has(id)), `${hazard.id} has an invalid or duplicate active phase`);
      const avoidanceRooms = new Set(hazard.avoidanceRouteIds.flatMap((id) => routeById.get(id)?.roomIds ?? []));
      check(hazard.affectedRoomIds.every((id) => avoidanceRooms.has(id)), `${hazard.id} has an affected room absent from every avoidance route`);
      const unaffectedRoomIds = [...roomIds].filter((id) => !hazard.affectedRoomIds.includes(id));
      const safeEndpointIds = new Set([...unaffectedRoomIds, refugeRoomId, egressAId, egressBId]);
      const avoidanceRoutes = hazard.avoidanceRouteIds.map((id) => routeById.get(id)).filter(Boolean);
      for (const phaseId of hazard.activePhaseIds) {
        const phaseAvoidanceRoutes = avoidanceRoutes.filter(({ phaseAvailability }) => phaseAvailability.includes(phaseId));
        const phaseAvoidanceGraph = buildMixedRouteGraph(phaseAvoidanceRoutes);
        for (const affectedRoomId of hazard.affectedRoomIds) {
          check(
            [...safeEndpointIds].some((safeEndpointId) => reachable(phaseAvoidanceGraph, affectedRoomId, safeEndpointId)),
            `${hazard.id} affected room ${affectedRoomId} cannot reach an unaffected room, refuge, or egress during ${phaseId}`,
          );
        }
      }
    }

    const environmentHabitatIds = new Set([
      ...environment.habitatAnchors.map(({ habitatId }) => habitatId),
      ...environment.safeObservationCells.map(({ id }) => id),
      "habitat.drowned-mire",
    ]);
    for (const habitat of site.habitats) {
      check(environmentHabitatIds.has(habitat.sourceHabitatId), `${habitat.id} references an unknown source habitat`);
      check(habitat.roomIds.every((id) => roomIds.has(id)), `${habitat.id} references an unknown room`);
    }
    const escrowHabitat = site.habitats.find(({ sourceHabitatId }) => sourceHabitatId === "habitat.borrowed_silhouette_escrow.two_bank_pairs");
    check(escrowHabitat?.occupantIds.length === 1 && escrowHabitat.occupantIds[0] === "borrowed_silhouette_escrow", "Escrow habitat must retain one occupant identity");

    const acceptedEgressById = new Map(environment.independentEgress.paths.map((egressPath) => [egressPath.id, egressPath]));
    check(sameSet(new Set(site.egress.paths.map(({ sourcePathId }) => sourcePathId)), new Set(acceptedEgressById.keys())), "Local egress paths must exactly bind both accepted egress source paths");
    check(site.egress.originAnchorId === environment.independentEgress.originAnchorId, "Local egress origin drifted from the accepted refuge anchor");
    check(site.egress.paths[0]?.thresholdIds[0] !== site.egress.paths[1]?.thresholdIds[0], "Independent egress paths share their first threshold");
    check(site.egress.paths[0]?.failureDomainId !== site.egress.paths[1]?.failureDomainId, "Independent egress paths share a failure domain");
    check(site.egress.paths[0]?.destinationAnchorId !== site.egress.paths[1]?.destinationAnchorId, "Independent egress paths share a destination");
    const sharedEgressAnchors = site.egress.paths[0].anchorIds.filter((id) => site.egress.paths[1].anchorIds.includes(id));
    check(sameArray(sharedEgressAnchors, [site.egress.originAnchorId]), "Independent egress paths must share only the refuge anchor");
    for (const egressPath of site.egress.paths) {
      const accepted = acceptedEgressById.get(egressPath.sourcePathId);
      check(Boolean(accepted), `${egressPath.id} references an unknown accepted egress path`);
      check(egressPath.routeId && routeIds.has(egressPath.routeId), `${egressPath.id} references an unknown egress route`);
      if (!accepted) continue;
      check(egressPath.destinationAnchorId === accepted.destinationAnchorId, `${egressPath.id} destination anchor drifted from accepted egress`);
      check(sameArray(egressPath.anchorIds, accepted.nodeIds), `${egressPath.id} anchor trace drifted from accepted egress`);
      check(sameArray(egressPath.sourceForwardEdgeIds, accepted.edgeIds), `${egressPath.id} forward-edge binding drifted from accepted egress`);
      check(sameArray(egressPath.sourceReturnEdgeIds, accepted.returnEdgeIds), `${egressPath.id} return-edge binding drifted from accepted egress`);
      check(egressPath.failureDomainId === accepted.failureDomain.id, `${egressPath.id} failure domain drifted from accepted egress`);
      check(egressPath.minimumClearWidthMeters === 2.2, `${egressPath.id} must preserve the exact 2.2 meter local minimum clear width`);
      check(egressPath.stepFree === true && accepted.stepFree === true, `${egressPath.id} must retain the accepted step-free claim`);
      check(egressPath.thresholdIds.length === accepted.nodeIds.length - 1, `${egressPath.id} threshold count does not match its accepted anchor trace`);
      check(routeById.get(egressPath.routeId)?.widthMeters === 2.2, `${egressPath.id} local egress route width must equal exactly 2.2 meters`);

      const boundThresholdEdges = new Set();
      for (let index = 0; index < egressPath.thresholdIds.length; index += 1) {
        const thresholdId = egressPath.thresholdIds[index];
        const threshold = site.thresholds.find(({ id }) => id === thresholdId);
        check(Boolean(threshold), `${egressPath.id} references missing threshold ${thresholdId}`);
        if (!threshold) continue;
        check(threshold.clearWidthMeters === 2.2, `${egressPath.id} threshold ${thresholdId} clear width must equal exactly 2.2 meters`);
        const fromAnchorId = placementByPortId.get(threshold.fromPortId)?.anchorId;
        const toAnchorId = placementByPortId.get(threshold.toPortId)?.anchorId;
        check(
          fromAnchorId === accepted.nodeIds[index] && toAnchorId === accepted.nodeIds[index + 1],
          `${egressPath.id} threshold ${thresholdId} is incompatible with its accepted anchor trace`,
        );
        for (const binding of threshold.sourceDirectedEdgeBindings) boundThresholdEdges.add(binding.edgeId);
      }
      const expectedBoundEdges = new Set([...accepted.edgeIds, ...accepted.returnEdgeIds]);
      check(sameSet(boundThresholdEdges, expectedBoundEdges), `${egressPath.id} thresholds do not bind the exact forward and return edges`);

      const acceptedDetailedEdges = [...accepted.edgeIds, ...accepted.returnEdgeIds].map((id) => acceptedEdgeById.get(id)).filter(Boolean);
      check(acceptedDetailedEdges.every(({ clearWidthMeters }) => clearWidthMeters >= egressPath.minimumClearWidthMeters), `${egressPath.id} accepted detailed edge is narrower than 2.2 meters`);
      const routeEdgeIds = new Set(routeById.get(egressPath.routeId)?.sourceSegments.map(({ edgeId }) => edgeId) ?? []);
      check([...expectedBoundEdges].every((id) => routeEdgeIds.has(id)), `${egressPath.id} route omits a detailed forward or return edge`);
    }
  }

  check(sameArray(site.activityPhases.map(({ canonicalPhaseId }) => canonicalPhaseId), operationalPhaseIds), "Local activity phases must preserve canonical Warden Reed order");
  if (spatialActivity) {
    for (const phase of site.activityPhases) {
      const sourcePhase = spatialActivity.cycles.find(({ phase: id }) => id === phase.canonicalPhaseId);
      check(Boolean(sourcePhase), `${phase.id} lacks a canonical activity-cycle source`);
      if (sourcePhase) check(sourcePhase.activity.every((activity, index) => phase.activities[index] === activity), `${phase.id} changed canonical activity wording or order`);
      check(phase.activeRouteIds.every((id) => routeIds.has(id)), `${phase.id} references an unknown route`);
      check(phase.staffedRoomIds.every((id) => roomIds.has(id)), `${phase.id} references an unknown staffed room`);
    }
  }

  const indexSiteRecord = index.sites[0];
  const siteEvidence = await fileEvidence(repositoryRoot, sitePath);
  check(indexSiteRecord.sha256 === siteEvidence.sha256 && indexSiteRecord.bytes === siteEvidence.bytes, "Index does not hash-bind the published Warden Reed site payload");
  check(index.status === reviewedMaturity, "Index must declare the independently reviewed noncanonical maturity");
  check(provenance.maturity === reviewedMaturity, "Provenance must declare the independently reviewed noncanonical maturity");
  const expectedProvenanceRecords = new Map([
    [schemaPath, { role: "machine_contract", maturity: "reference_schema_v1" }],
    [indexPath, { role: "release_index", maturity: reviewedMaturity }],
    [sitePath, { role: "site_local_spatial_reference", maturity: reviewedMaturity }],
  ]);
  check(provenance.records?.length === expectedProvenanceRecords.size, "Provenance must contain exactly the schema, index, and site records");
  for (const [recordPath, expected] of expectedProvenanceRecords) {
    const matches = provenance.records?.filter(({ path: candidatePath }) => candidatePath === recordPath) ?? [];
    check(
      matches.length === 1 && matches[0].role === expected.role && matches[0].maturity === expected.maturity,
      `Provenance contract drifted for ${recordPath}: expected role ${expected.role} and maturity ${expected.maturity}`,
    );
  }
  check(provenance.publication?.privacy === "repository_relative_redacted", "Provenance privacy mode drifted");
  check(["externalProviderIdentifiers", "workstationPaths", "usernames", "emails", "signedUrls"].every((key) => provenance.publication?.[key] === false), "Provenance contains or claims a private locator category");
  check(!/\b(?:anthropic|chatgpt|claude|openai)\b/i.test(JSON.stringify({ index, site, provenance })), "Published Wave 03A surface contains an external provider identifier");
  check(provenance.tool?.name === "built_in_code_workflow" && provenance.tool?.mode === "site_local_reference_authoring", "Provenance must use generic tool and mode labels");
  check(provenance.direction?.sha256 === sha256(Buffer.from(provenance.direction?.text ?? "", "utf8")), "Provenance direction hash drifted");
  for (const record of provenance.records ?? []) {
    const evidence = await fileEvidence(repositoryRoot, record.path);
    check(record.sha256 === evidence.sha256 && record.bytes === evidence.bytes, `Provenance record drifted for ${record.path}`);
    check(Boolean(safeRepositoryPath(repositoryRoot, record.path)), `Provenance path is not repository-relative: ${record.path}`);
  }
  check(new Set(provenance.records?.map(({ path: recordPath }) => recordPath)).size === expectedProvenanceRecords.size, "Provenance must hash-bind schema, index, and site exactly once");

  return {
    valid: errors.length === 0,
    errors,
    stats: {
      sites: 1,
      ...counts,
      sourceBindings: site.sourceBindings.length,
      provenanceRecords: provenance.records?.length ?? 0,
      canonicalClaims: 0,
      runtimeClaims: 0,
      constructionClaims: 0,
    },
    evidence: {
      site: siteEvidence,
      questRecordSha256: quest ? canonicalRecordSha256(quest) : null,
      environmentProgramSha256: environment ? canonicalRecordSha256(environment) : null,
    },
  };
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const result = await validateWorldSpatialWave03a();
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exitCode = 1;
}
