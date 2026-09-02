#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const SITE_BLOCKOUT_V2_SCHEMA_PATH = "assets/world/spatial/site-blockout-reference-v2.schema.json";

export const FALSE_CLAIM_KEYS_V2 = Object.freeze([
  "canonical",
  "exactPlacement",
  "surveyedGeometry",
  "atlasExportEligible",
  "runtimeIntegrated",
  "runtimeNavigation",
  "runtimeCollision",
  "constructionReady",
  "productionGeometry",
  "productionAsset",
  "staticModels",
  "animatedModels",
  "releaseReady",
  "authorSelfApproval",
  "integrationAuthorized",
]);

export const sha256 = (value) => createHash("sha256").update(value).digest("hex");

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export const canonicalRecordSha256 = (value) => sha256(Buffer.from(canonicalJson(value), "utf8"));

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
      if (branchFailures.filter((branch) => branch.length === 0).length !== 1) {
        output.push(`${candidatePath} must match exactly one oneOf branch`);
      }
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
        else if (schemaNode.additionalProperties && typeof schemaNode.additionalProperties === "object") {
          visit(schemaNode.additionalProperties, child, `${candidatePath}.${key}`, output);
        }
      }
    }

    if (Array.isArray(candidate)) {
      if (schemaNode.minItems !== undefined && candidate.length < schemaNode.minItems) {
        output.push(`${candidatePath} must contain at least ${schemaNode.minItems} items`);
      }
      if (schemaNode.maxItems !== undefined && candidate.length > schemaNode.maxItems) {
        output.push(`${candidatePath} must contain at most ${schemaNode.maxItems} items`);
      }
      if (schemaNode.items) candidate.forEach((item, index) => visit(schemaNode.items, item, `${candidatePath}[${index}]`, output));
    }

    if (typeof candidate === "string") {
      if (schemaNode.minLength !== undefined && candidate.length < schemaNode.minLength) {
        output.push(`${candidatePath} must contain at least ${schemaNode.minLength} characters`);
      }
      if (schemaNode.pattern && !new RegExp(schemaNode.pattern).test(candidate)) {
        output.push(`${candidatePath} does not match ${schemaNode.pattern}`);
      }
    }

    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      if (schemaNode.minimum !== undefined && candidate < schemaNode.minimum) {
        output.push(`${candidatePath} must be at least ${schemaNode.minimum}`);
      }
      if (schemaNode.maximum !== undefined && candidate > schemaNode.maximum) {
        output.push(`${candidatePath} must be at most ${schemaNode.maximum}`);
      }
      if (schemaNode.exclusiveMinimum !== undefined && candidate <= schemaNode.exclusiveMinimum) {
        output.push(`${candidatePath} must exceed ${schemaNode.exclusiveMinimum}`);
      }
    }
  };

  visit(rootSchema, value, "$", failures);
  return failures;
}

export function safeRepositoryPath(repositoryRoot, repositoryRelativePath) {
  if (
    typeof repositoryRelativePath !== "string"
    || path.isAbsolute(repositoryRelativePath)
    || /^[A-Za-z]:/.test(repositoryRelativePath)
    || repositoryRelativePath.includes("\\")
    || repositoryRelativePath.split("/").includes("..")
  ) return null;
  const root = path.resolve(repositoryRoot);
  const resolved = path.resolve(root, repositoryRelativePath);
  return resolved.startsWith(`${root}${path.sep}`) ? resolved : null;
}

export async function readJson(repositoryRoot, repositoryRelativePath) {
  const resolved = safeRepositoryPath(repositoryRoot, repositoryRelativePath);
  if (!resolved) throw new Error(`Unsafe repository-relative path: ${repositoryRelativePath}`);
  return JSON.parse(await readFile(resolved, "utf8"));
}

export async function fileEvidence(repositoryRoot, repositoryRelativePath) {
  const resolved = safeRepositoryPath(repositoryRoot, repositoryRelativePath);
  if (!resolved) throw new Error(`Unsafe repository-relative path: ${repositoryRelativePath}`);
  const bytes = await readFile(resolved);
  return { bytes: bytes.length, sha256: sha256(bytes) };
}

const unique = (values) => new Set(values).size === values.length;
const ids = (records) => new Set(records.map(({ id }) => id));
const sameVector = (left, right) => left.length === right.length && left.every((value, index) => value === right[index]);
const sameMembers = (left, right) => left.size === right.size && [...left].every((value) => right.has(value));
const inBounds = (point, bounds) => point.every((value, index) => value >= bounds.minimum[index] && value <= bounds.maximum[index]);
const validBounds = (bounds) => bounds.minimum.every((value, index) => value <= bounds.maximum[index]);
const unorderedPairKey = (left, right) => [left, right].sort().join("\u0000");

function buildGraph(nodeIds, links) {
  const graph = new Map([...nodeIds].map((id) => [id, new Set()]));
  for (const link of links) {
    if (!graph.has(link.fromNodeId) || !graph.has(link.toNodeId)) continue;
    graph.get(link.fromNodeId).add(link.toNodeId);
    if (link.bidirectional) graph.get(link.toNodeId).add(link.fromNodeId);
  }
  return graph;
}

function reachableIds(graph, origin) {
  if (!origin || !graph.has(origin)) return new Set();
  const seen = new Set([origin]);
  const pending = [origin];
  while (pending.length > 0) {
    const current = pending.shift();
    for (const adjacent of graph.get(current) ?? []) {
      if (!seen.has(adjacent)) {
        seen.add(adjacent);
        pending.push(adjacent);
      }
    }
  }
  return seen;
}

function allZeroCounts(counts) {
  return Object.values(counts).every((value) => value === 0);
}

export async function validateSiteBlockoutReferenceV2({
  repositoryRoot = DEFAULT_REPOSITORY_ROOT,
  schema = null,
  site = null,
  schemaPath = SITE_BLOCKOUT_V2_SCHEMA_PATH,
} = {}) {
  const errors = [];
  const check = (condition, message) => {
    if (!condition) errors.push(message);
  };

  let resolvedSchema = schema;
  let resolvedSite = site;
  try {
    if (!resolvedSchema) resolvedSchema = await readJson(repositoryRoot, schemaPath);
    if (!resolvedSite) throw new Error("A site payload is required");
  } catch (error) {
    return { valid: false, errors: [`Unable to load generic V2 inputs: ${error.message}`], stats: null };
  }

  const schemaFailures = validateJsonSchema(resolvedSchema, resolvedSite);
  for (const failure of schemaFailures) {
    errors.push(`Schema validation failed: ${failure}`);
  }
  check(resolvedSchema.$id === schemaPath, "Schema $id must remain repository-relative and exact");
  check(
    resolvedSchema.properties?.claims?.$ref === "#/$defs/claims"
      && FALSE_CLAIM_KEYS_V2.every((key) => resolvedSchema.$defs?.claims?.properties?.[key]?.const === false),
    "V2 schema must pin every authority and readiness claim false",
  );
  check(resolvedSite.schemaVersion === 2, "Site schemaVersion must equal two");
  check(
    resolvedSite.claims && FALSE_CLAIM_KEYS_V2.every((key) => resolvedSite.claims[key] === false),
    "Site contains an authority or readiness overclaim",
  );
  if (schemaFailures.length > 0) {
    return { valid: false, errors, stats: null, evidence: { sourceArtifacts: {} } };
  }

  const collections = {
    sourceBindings: resolvedSite.sourceBindings,
    zones: resolvedSite.zones,
    spaces: resolvedSite.spaces,
    nodes: resolvedSite.nodes,
    links: resolvedSite.links,
    safeCells: resolvedSite.safeCells,
    stateMachines: resolvedSite.stateMachines,
    hydrologySystems: resolvedSite.hydrologySystems,
    habitats: resolvedSite.habitats,
    actorSlots: resolvedSite.actorSlots,
    encounterSlots: resolvedSite.encounterSlots,
    routePrograms: resolvedSite.routePrograms,
    overlayBindings: resolvedSite.overlayBindings,
  };
  for (const [name, records] of Object.entries(collections)) {
    check(unique(records.map(({ id }) => id)), `${name} IDs must be unique`);
  }

  const sourceIds = ids(resolvedSite.sourceBindings);
  const zoneIds = ids(resolvedSite.zones);
  const spaceIds = ids(resolvedSite.spaces);
  const nodeIds = ids(resolvedSite.nodes);
  const linkIds = ids(resolvedSite.links);
  const safeCellIds = ids(resolvedSite.safeCells);
  const stateMachineIds = ids(resolvedSite.stateMachines);
  const hydrologyIds = ids(resolvedSite.hydrologySystems);
  const actorSlotIds = ids(resolvedSite.actorSlots);
  const encounterSlotIds = ids(resolvedSite.encounterSlots);
  const routeProgramIds = ids(resolvedSite.routePrograms);
  const overlayIds = ids(resolvedSite.overlayBindings);
  const phaseIds = new Set(resolvedSite.activityPhases.map(({ canonicalPhaseId }) => canonicalPhaseId));
  check(unique([...phaseIds]) && phaseIds.size === resolvedSite.activityPhases.length, "Canonical activity phase IDs must be unique");
  check(unique(resolvedSite.activityPhases.map(({ id }) => id)), "Activity phase record IDs must be unique");

  const knownTargetIds = new Set([
    resolvedSite.siteId,
    ...zoneIds,
    ...spaceIds,
    ...nodeIds,
    ...linkIds,
    ...safeCellIds,
    ...stateMachineIds,
    ...hydrologyIds,
    ...actorSlotIds,
    ...encounterSlotIds,
    ...routeProgramIds,
    ...overlayIds,
  ]);
  const checkReferences = (values, accepted, context) => {
    check(unique(values), `${context} contains duplicate references`);
    for (const value of values) check(accepted.has(value), `${context} references unknown ID ${value}`);
  };
  const checkSources = (record, context) => checkReferences(record.sourceBindingIds ?? [], sourceIds, `${context} source bindings`);

  const artifactEvidence = new Map();
  for (const binding of resolvedSite.sourceBindings) {
    try {
      if (!artifactEvidence.has(binding.path)) artifactEvidence.set(binding.path, await fileEvidence(repositoryRoot, binding.path));
      const evidence = artifactEvidence.get(binding.path);
      check(binding.sha256 === evidence.sha256, `${binding.id} source artifact hash drifted`);
      check(binding.bytes === evidence.bytes, `${binding.id} source artifact byte count drifted`);
      if (binding.bindingKind === "whole_file") {
        check(binding.selector === "$file", `${binding.id} whole-file binding selector must be $file`);
        check(binding.recordSha256 === evidence.sha256, `${binding.id} whole-file record hash must equal its raw file hash`);
      }
    } catch (error) {
      errors.push(`${binding.id} source evidence failed: ${error.message}`);
    }
  }

  const bounds = resolvedSite.spatialReference.localBoundsMeters;
  check(validBounds(bounds), "Site-local bounds minimum must not exceed maximum");
  const expectedLocalOrigin = resolvedSite.spatialReference.atlasSiteAnchor.map(
    (value, index) => value + resolvedSite.spatialReference.atlasAnchorToLocalOriginOffsetMeters[index],
  );
  check(
    sameVector(resolvedSite.spatialReference.localOriginAtlasCoordinate, expectedLocalOrigin),
    "Local origin must equal the atlas site anchor plus atlasAnchorToLocalOriginOffsetMeters",
  );
  const zoneSpaceMembership = [];
  for (const zone of resolvedSite.zones) {
    check(validBounds(zone.boundsLocalMeters), `${zone.id} has inverted bounds`);
    check(inBounds(zone.boundsLocalMeters.minimum, bounds) && inBounds(zone.boundsLocalMeters.maximum, bounds), `${zone.id} bounds exceed site-local bounds`);
    checkReferences(zone.spaceIds, spaceIds, `${zone.id} spaces`);
    checkSources(zone, zone.id);
    zoneSpaceMembership.push(...zone.spaceIds);
  }
  check(unique(zoneSpaceMembership), "Zones must not claim the same space twice");
  check(zoneSpaceMembership.length === resolvedSite.spaces.length && spaceIds.size === new Set(zoneSpaceMembership).size, "Zones must partition every base space exactly once");

  check(unique(resolvedSite.spaces.map(({ code }) => code)), "Space codes must be unique");
  const spaceById = new Map(resolvedSite.spaces.map((record) => [record.id, record]));
  for (const space of resolvedSite.spaces) {
    check(zoneIds.has(space.zoneId), `${space.id} references unknown zone ${space.zoneId}`);
    check(resolvedSite.zones.find(({ id }) => id === space.zoneId)?.spaceIds.includes(space.id), `${space.id} is absent from its zone partition`);
    check(validBounds(space.boundsLocalMeters), `${space.id} has inverted bounds`);
    check(inBounds(space.localCentroidMeters, bounds), `${space.id} centroid lies outside site-local bounds`);
    check(inBounds(space.boundsLocalMeters.minimum, bounds) && inBounds(space.boundsLocalMeters.maximum, bounds), `${space.id} bounds exceed site-local bounds`);
    check(inBounds(space.localCentroidMeters, space.boundsLocalMeters), `${space.id} centroid lies outside its own bounds`);
    checkSources(space, space.id);
  }

  const nodeById = new Map(resolvedSite.nodes.map((record) => [record.id, record]));
  const spaceNodeIds = [];
  for (const node of resolvedSite.nodes) {
    check(inBounds(node.localCoordinateMeters, bounds), `${node.id} lies outside site-local bounds`);
    checkSources(node, node.id);
    if (node.kind === "space_centroid") {
      check(spaceIds.has(node.spaceId), `${node.id} centroid node references unknown space ${node.spaceId}`);
      if (spaceIds.has(node.spaceId)) {
        spaceNodeIds.push(node.spaceId);
        check(sameVector(node.localCoordinateMeters, spaceById.get(node.spaceId).localCentroidMeters), `${node.id} coordinate differs from its space centroid`);
      }
      check(node.traversable === true, `${node.id} space centroid must be traversable`);
    } else {
      check(node.spaceId === null, `${node.id} non-space node must have null spaceId`);
      if (node.kind === "external_route_port") check(node.traversable === true, `${node.id} route port must be traversable`);
      if (node.kind === "overlay_proxy") check(node.traversable === false, `${node.id} overlay proxy must be non-traversable`);
    }
  }
  check(unique(spaceNodeIds), "A base space is mapped by more than one centroid node");
  check(spaceNodeIds.length === resolvedSite.spaces.length && spaceIds.size === new Set(spaceNodeIds).size, "Every base space must map to exactly one centroid node");

  const pairKeys = [];
  const linkById = new Map(resolvedSite.links.map((record) => [record.id, record]));
  for (const link of resolvedSite.links) {
    check(nodeIds.has(link.fromNodeId) && nodeIds.has(link.toNodeId), `${link.id} references an unknown endpoint`);
    check(link.fromNodeId !== link.toNodeId, `${link.id} is a self-link`);
    check(nodeById.get(link.fromNodeId)?.kind !== "overlay_proxy" && nodeById.get(link.toNodeId)?.kind !== "overlay_proxy", `${link.id} illegally turns an overlay proxy into base traversal`);
    pairKeys.push(unorderedPairKey(link.fromNodeId, link.toNodeId));
    checkReferences(link.phaseIds, phaseIds, `${link.id} phases`);
    if (link.stateMachineId !== null) check(stateMachineIds.has(link.stateMachineId), `${link.id} references unknown state machine ${link.stateMachineId}`);
    checkSources(link, link.id);
  }
  check(unique(pairKeys), "Base links contain a duplicate or reverse-duplicate endpoint pair");

  const traversableNodeIds = new Set(resolvedSite.nodes.filter(({ traversable }) => traversable).map(({ id }) => id));
  const baseGraph = buildGraph(traversableNodeIds, resolvedSite.links);
  const reached = reachableIds(baseGraph, traversableNodeIds.values().next().value);
  check([...traversableNodeIds].every((id) => reached.has(id)), "All traversable base nodes must belong to one connected component");

  for (const cell of resolvedSite.safeCells) {
    check(spaceIds.has(cell.spaceId), `${cell.id} references unknown space ${cell.spaceId}`);
    checkReferences(cell.phaseIds, phaseIds, `${cell.id} phases`);
  }

  for (const machine of resolvedSite.stateMachines) {
    check(unique(machine.states), `${machine.id} states must be unique`);
    check(machine.states.includes(machine.initialState), `${machine.id} initial state is not declared`);
    check(
      unique(machine.transitions.map(({ from, trigger }) => `${from}\u0000${trigger}`)),
      `${machine.id} transitions must be deterministic for each from-state and trigger`,
    );
    const transitionGraph = new Map(machine.states.map((state) => [state, new Set()]));
    for (const transition of machine.transitions) {
      check(machine.states.includes(transition.from) && machine.states.includes(transition.to), `${machine.id} transition references unknown state`);
      transitionGraph.get(transition.from)?.add(transition.to);
    }
    const reachableStates = reachableIds(transitionGraph, machine.initialState);
    check(machine.states.every((state) => reachableStates.has(state)), `${machine.id} contains a state unreachable from its initial state`);
    check(
      unique(machine.rules.map(({ state, targetId }) => `${state}\u0000${targetId}`)),
      `${machine.id} rules must be unique for each state and target`,
    );
    for (const rule of machine.rules) {
      check(machine.states.includes(rule.state), `${machine.id} rule references unknown state ${rule.state}`);
      check(knownTargetIds.has(rule.targetId), `${machine.id} rule references unknown target ${rule.targetId}`);
      if (linkIds.has(rule.targetId)) {
        check(machine.affectedLinkIds.includes(rule.targetId), `${machine.id} rule targets link outside its affected-link set`);
      } else {
        check(rule.linkTraversal === null, `${machine.id} non-link rule must use null linkTraversal`);
      }
    }
    checkReferences(machine.affectedSpaceIds, spaceIds, `${machine.id} affected spaces`);
    checkReferences(machine.affectedLinkIds, linkIds, `${machine.id} affected links`);
    checkReferences(machine.affectedActorSlotIds, actorSlotIds, `${machine.id} affected actor slots`);
    const linkedToMachine = new Set(resolvedSite.links.filter(({ stateMachineId }) => stateMachineId === machine.id).map(({ id }) => id));
    check(
      sameMembers(new Set(machine.affectedLinkIds), linkedToMachine),
      `${machine.id} affected links must exactly match links controlled by that state machine`,
    );
    checkSources(machine, machine.id);
  }

  const routeById = new Map(resolvedSite.routePrograms.map((record) => [record.id, record]));
  for (const route of resolvedSite.routePrograms) {
    checkReferences(route.nodeIds, nodeIds, `${route.id} nodes`);
    checkReferences(route.linkIds, linkIds, `${route.id} links`);
    checkReferences(route.phaseIds, phaseIds, `${route.id} phases`);
    if (route.stateMachineId !== null) check(stateMachineIds.has(route.stateMachineId), `${route.id} references unknown state machine ${route.stateMachineId}`);
    checkSources(route, route.id);
    if (route.topologyMode === "ordered_local_trace") {
      check(route.linkIds.length === route.nodeIds.length - 1, `${route.id} ordered trace must have exactly one link per node transition`);
      for (let index = 0; index < route.linkIds.length; index += 1) {
        const link = linkById.get(route.linkIds[index]);
        const from = route.nodeIds[index];
        const to = route.nodeIds[index + 1];
        check(
          link && ((link.fromNodeId === from && link.toNodeId === to) || (link.bidirectional && link.fromNodeId === to && link.toNodeId === from)),
          `${route.id} link ${route.linkIds[index]} does not join ordered nodes ${from} and ${to}`,
        );
      }
    } else if (route.topologyMode === "local_network") {
      const routeNodeSet = new Set(route.nodeIds);
      const routeLinks = route.linkIds.map((id) => linkById.get(id)).filter(Boolean);
      check(routeLinks.every(({ fromNodeId, toNodeId }) => routeNodeSet.has(fromNodeId) && routeNodeSet.has(toNodeId)), `${route.id} includes a link outside its node set`);
      const routeGraph = buildGraph(routeNodeSet, routeLinks);
      const routeReached = reachableIds(routeGraph, route.nodeIds[0]);
      check(route.nodeIds.every((id) => routeReached.has(id)), `${route.id} local network is disconnected`);
    } else {
      check(route.linkIds.length === 0, `${route.id} external overlay route must not copy base or source links`);
      check(route.nodeIds.every((id) => nodeById.get(id)?.kind === "overlay_proxy"), `${route.id} external overlay route must reference only a non-traversable proxy`);
    }
  }

  for (const phase of resolvedSite.activityPhases) {
    checkReferences(phase.activeRouteProgramIds, routeProgramIds, `${phase.id} active routes`);
    checkReferences(phase.staffedSpaceIds, spaceIds, `${phase.id} staffed spaces`);
  }

  const hydrologyById = new Map(resolvedSite.hydrologySystems.map((record) => [record.id, record]));
  for (const system of resolvedSite.hydrologySystems) {
    checkReferences(system.spaceIds, spaceIds, `${system.id} spaces`);
    checkReferences(system.sourceNodeIds, nodeIds, `${system.id} source nodes`);
    checkReferences(system.terminalNodeIds, nodeIds, `${system.id} terminal nodes`);
    checkReferences(system.maintenanceRouteProgramIds, routeProgramIds, `${system.id} maintenance routes`);
    checkReferences(system.scopedConnectionHydrologyIds, hydrologyIds, `${system.id} scoped connections`);
    checkReferences(system.prohibitedHydrologyIds, hydrologyIds, `${system.id} prohibited connections`);
    check(system.scopedConnectionHydrologyIds.every((id) => !system.prohibitedHydrologyIds.includes(id)), `${system.id} marks the same hydrology relation scoped and prohibited`);
    for (const id of system.scopedConnectionHydrologyIds) {
      check(hydrologyById.get(id)?.scopedConnectionHydrologyIds.includes(system.id), `${system.id} scoped connection to ${id} is not symmetric`);
    }
    for (const id of system.prohibitedHydrologyIds) {
      check(hydrologyById.get(id)?.prohibitedHydrologyIds.includes(system.id), `${system.id} prohibition against ${id} is not symmetric`);
      const otherSpaces = new Set(hydrologyById.get(id)?.spaceIds ?? []);
      check(system.spaceIds.every((spaceId) => !otherSpaces.has(spaceId)), `${system.id} shares local space ${system.spaceIds.find((spaceId) => otherSpaces.has(spaceId))} with prohibited system ${id}`);
    }
    if (system.stateMachineId !== null) check(stateMachineIds.has(system.stateMachineId), `${system.id} references unknown state machine ${system.stateMachineId}`);
    if (system.scope === "off_precinct_excluded") {
      check(system.spaceIds.length === 0 && system.sourceNodeIds.length === 0 && system.terminalNodeIds.length === 0, `${system.id} off-precinct exclusion must have no local geometry`);
    }
    checkSources(system, system.id);
  }

  for (const habitat of resolvedSite.habitats) {
    checkReferences(habitat.spaceIds, spaceIds, `${habitat.id} spaces`);
    checkReferences(habitat.phaseIds, phaseIds, `${habitat.id} phases`);
    checkReferences(habitat.safeCellExclusionIds, safeCellIds, `${habitat.id} safe-cell exclusions`);
    check(habitat.population.minimum <= habitat.population.maximum, `${habitat.id} population minimum exceeds maximum`);
    if (habitat.overlayBindingId !== null) check(overlayIds.has(habitat.overlayBindingId), `${habitat.id} references unknown overlay ${habitat.overlayBindingId}`);
    checkSources(habitat, habitat.id);
  }

  for (const actor of resolvedSite.actorSlots) {
    if (actor.homeSpaceId !== null) check(spaceIds.has(actor.homeSpaceId), `${actor.id} references unknown home space ${actor.homeSpaceId}`);
    checkReferences(actor.conversationSpaceIds, spaceIds, `${actor.id} conversation spaces`);
    for (const schedule of actor.schedule) {
      check(phaseIds.has(schedule.phaseId), `${actor.id} schedule references unknown phase ${schedule.phaseId}`);
      if (schedule.primarySpaceId !== null) check(spaceIds.has(schedule.primarySpaceId), `${actor.id} schedule references unknown primary space ${schedule.primarySpaceId}`);
      checkReferences(schedule.routeProgramIds, routeProgramIds, `${actor.id} schedule routes`);
    }
    if (actor.slotKind === "off_site_marker") {
      check(actor.homeSpaceId === null && actor.conversationSpaceIds.length === 0 && actor.schedule.length === 0 && actor.spawnAuthorized === false, `${actor.id} off-site marker must have no local placement or spawn authority`);
    } else {
      check(actor.homeSpaceId !== null && actor.spawnAuthorized === true, `${actor.id} local slot must have a home space and explicit spawn authority`);
    }
    for (const assetPath of [actor.assetMaturity.conceptMasterPath, actor.assetMaturity.transparentCutoutPath]) {
      if (assetPath !== null) check(Boolean(safeRepositoryPath(repositoryRoot, assetPath)), `${actor.id} contains unsafe asset path ${assetPath}`);
    }
    const hasMaster = typeof actor.assetMaturity.conceptMasterPath === "string";
    const hasCutout = typeof actor.assetMaturity.transparentCutoutPath === "string";
    if (actor.assetMaturity.status === "concept_pair_only") {
      check(hasMaster && hasCutout, `${actor.id} concept_pair_only status requires both concept master and transparent cutout paths`);
    } else if (actor.assetMaturity.status === "concept_master_only") {
      check(hasMaster && !hasCutout, `${actor.id} concept_master_only status requires only a concept master path`);
    } else if (actor.assetMaturity.status === "awaiting_art") {
      check(!hasMaster && !hasCutout, `${actor.id} awaiting_art status forbids concept asset paths`);
    }
    check(actor.assetMaturity.staticModelPath === null && actor.assetMaturity.animatedModelPath === null, `${actor.id} makes an unsupported model claim`);
    checkSources(actor, actor.id);
  }

  for (const encounter of resolvedSite.encounterSlots) {
    checkReferences(encounter.spaceIds, spaceIds, `${encounter.id} spaces`);
    checkReferences(encounter.safeCellExclusionIds, safeCellIds, `${encounter.id} safe-cell exclusions`);
    if (encounter.stateMachineId !== null) check(stateMachineIds.has(encounter.stateMachineId), `${encounter.id} references unknown state machine ${encounter.stateMachineId}`);
    if (encounter.overlayBindingId !== null) check(overlayIds.has(encounter.overlayBindingId), `${encounter.id} references unknown overlay ${encounter.overlayBindingId}`);
    checkSources(encounter, encounter.id);
  }

  for (const overlay of resolvedSite.overlayBindings) {
    if (overlay.localProxyNodeId !== null) {
      check(nodeById.get(overlay.localProxyNodeId)?.kind === "overlay_proxy", `${overlay.id} proxy is not an overlay_proxy node`);
      check(!resolvedSite.links.some(({ fromNodeId, toNodeId }) => fromNodeId === overlay.localProxyNodeId || toNodeId === overlay.localProxyNodeId), `${overlay.id} proxy must not be a base traversal endpoint`);
    }
    check(stateMachineIds.has(overlay.stateMachineId), `${overlay.id} references unknown state machine ${overlay.stateMachineId}`);
    check(unique(overlay.interfaceBindings.map(({ sourceAnchorId }) => sourceAnchorId)), `${overlay.id} source interface anchors must be unique`);
    for (const binding of overlay.interfaceBindings) check(nodeIds.has(binding.localNodeId), `${overlay.id} interface references unknown local node ${binding.localNodeId}`);
    if (overlay.kind === "local_stateful_cell") {
      check(overlay.localProxyNodeId === null && overlay.sourceGraphId === null && overlay.sourceGraphRecordSha256 === null, `${overlay.id} local overlay must not claim an accepted source graph`);
      check(allZeroCounts(overlay.expectedCounts), `${overlay.id} local overlay must not claim copied graph counts`);
    } else {
      check(overlay.bindingMode === "id_and_canonical_json_hash_no_contract_copy", `${overlay.id} accepted graph must use ID-and-hash binding`);
      check(Boolean(overlay.localProxyNodeId && overlay.sourceGraphId && overlay.sourceGraphRecordSha256), `${overlay.id} accepted graph binding is incomplete`);
      check(overlay.expectedCounts.nodes > 0 && overlay.expectedCounts.directedEdges > 0, `${overlay.id} accepted graph counts must be positive`);
    }
    checkSources(overlay, overlay.id);
  }

  check(unique(resolvedSite.questCrosswalk.map(({ questId }) => questId)), "Quest crosswalk quest IDs must be unique");
  const sourceById = new Map(resolvedSite.sourceBindings.map((record) => [record.id, record]));
  for (const quest of resolvedSite.questCrosswalk) {
    check(sourceIds.has(quest.sourceBindingId), `${quest.questId} references unknown source binding ${quest.sourceBindingId}`);
    check(sourceById.get(quest.sourceBindingId)?.recordSha256 === quest.questRecordSha256, `${quest.questId} crosswalk hash differs from its source binding`);
    if (quest.overlayBindingId !== null) check(overlayIds.has(quest.overlayBindingId), `${quest.questId} references unknown overlay ${quest.overlayBindingId}`);
    check(unique(quest.objectives.map(({ objectiveIndex }) => objectiveIndex)), `${quest.questId} objective indices must be unique`);
    check(quest.objectives.every(({ objectiveIndex }, index) => objectiveIndex === index), `${quest.questId} objective indices must be contiguous and source ordered`);
    for (const objective of quest.objectives) {
      checkReferences(objective.spaceIds, spaceIds, `${quest.questId} objective ${objective.objectiveIndex} spaces`);
      checkReferences(objective.routeProgramIds, routeProgramIds, `${quest.questId} objective ${objective.objectiveIndex} routes`);
      checkReferences(objective.encounterSlotIds, encounterSlotIds, `${quest.questId} objective ${objective.objectiveIndex} encounters`);
    }
  }

  check(unique(resolvedSite.artDirection.acceptedReferenceIds), "Accepted art-direction IDs must be unique");

  return {
    valid: errors.length === 0,
    errors,
    stats: {
      zones: resolvedSite.zones.length,
      spaces: resolvedSite.spaces.length,
      nodes: resolvedSite.nodes.length,
      traversableNodes: traversableNodeIds.size,
      overlayProxyNodes: resolvedSite.nodes.filter(({ kind }) => kind === "overlay_proxy").length,
      links: resolvedSite.links.length,
      derivedDirectedArcs: resolvedSite.links.reduce((total, { bidirectional }) => total + (bidirectional ? 2 : 1), 0),
      safeCells: resolvedSite.safeCells.length,
      stateMachines: resolvedSite.stateMachines.length,
      activityPhases: resolvedSite.activityPhases.length,
      hydrologySystems: resolvedSite.hydrologySystems.length,
      habitats: resolvedSite.habitats.length,
      actorSlots: resolvedSite.actorSlots.length,
      encounterSlots: resolvedSite.encounterSlots.length,
      routePrograms: resolvedSite.routePrograms.length,
      overlayBindings: resolvedSite.overlayBindings.length,
      questBindings: resolvedSite.questCrosswalk.length,
      questObjectives: resolvedSite.questCrosswalk.reduce((total, quest) => total + quest.objectives.length, 0),
      sourceBindings: resolvedSite.sourceBindings.length,
      canonicalClaims: 0,
      runtimeClaims: 0,
      constructionClaims: 0,
      modelClaims: 0,
    },
    evidence: { sourceArtifacts: Object.fromEntries(artifactEvidence) },
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const sitePath = process.argv[2];
  if (!sitePath) {
    console.error("Usage: node tools/worldgen/validate-site-blockout-reference-v2.mjs <repository-relative-site.json>");
    process.exitCode = 1;
  } else {
    try {
      const site = await readJson(DEFAULT_REPOSITORY_ROOT, sitePath);
      const result = await validateSiteBlockoutReferenceV2({ site });
      console.log(JSON.stringify(result, null, 2));
      if (!result.valid) process.exitCode = 1;
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
