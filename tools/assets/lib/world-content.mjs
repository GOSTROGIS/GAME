import { access, readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

const MANIFEST_PATHS = Object.freeze({
  assets: "packages/content/manifests/hearthmere.assets.json",
  licenses: "packages/content/manifests/hearthmere.licenses.json",
  scene: "packages/content/manifests/hearthmere.scene.json",
});

const IDENTIFIER = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const SHA256 = /^[a-f0-9]{64}$/;
const finiteVector = (value, length) => Array.isArray(value) && value.length === length && value.every(Number.isFinite);
const clone = (value) => structuredClone(value);

function issue(errors, code, path, message) {
  errors.push({ code, path, message });
}

function checkId(errors, id, path, label = "ID") {
  if (typeof id !== "string" || !IDENTIFIER.test(id)) issue(errors, "invalid_id", path, `${label} must be a stable lowercase identifier`);
}

function uniqueIndex(errors, entries, path, label) {
  const index = new Map();
  for (let position = 0; position < (entries || []).length; position += 1) {
    const entry = entries[position];
    checkId(errors, entry?.id, `${path}[${position}].id`, label);
    if (index.has(entry?.id)) issue(errors, "duplicate_id", `${path}[${position}].id`, `Duplicate ${label} ${entry?.id}`);
    else index.set(entry?.id, entry);
  }
  return index;
}

function validatePhases(errors, value, path, phaseIds, exclusiveGroups) {
  if (!Array.isArray(value?.phaseIds) || value.phaseIds.length === 0) {
    issue(errors, "missing_phase", `${path}.phaseIds`, "Every scene record must declare at least one phase");
    return;
  }
  for (const phaseId of value.phaseIds) if (!phaseIds.has(phaseId)) issue(errors, "unknown_phase", `${path}.phaseIds`, `Unknown phase ${phaseId}`);
  for (const group of exclusiveGroups) {
    const simultaneous = value.phaseIds.filter((phaseId) => group.includes(phaseId));
    if (simultaneous.length > 1) issue(errors, "exclusive_phase_conflict", `${path}.phaseIds`, `Mutually exclusive phases appear together: ${simultaneous.join(", ")}`);
  }
}

function validateTransform(errors, transform, path) {
  if (!finiteVector(transform?.position, 3)) issue(errors, "invalid_transform", `${path}.position`, "Position must contain three finite numbers");
  if (!finiteVector(transform?.rotation, 3)) issue(errors, "invalid_transform", `${path}.rotation`, "Rotation must contain three finite Euler radians");
  if (!finiteVector(transform?.scale, 3) || transform?.scale?.some((axis) => axis <= 0)) issue(errors, "invalid_transform", `${path}.scale`, "Scale must contain three positive finite numbers");
}

function inChunk(position, bounds) {
  return position[0] >= bounds.min[0] && position[0] < bounds.max[0]
    && position[1] >= bounds.min[1] && position[1] < bounds.max[1]
    && position[2] >= bounds.min[2] && position[2] < bounds.max[2];
}

function safeWorkspacePath(rootDir, relativePath) {
  if (typeof relativePath !== "string" || !relativePath || relativePath.includes("\\") || relativePath.startsWith("/") || /^[a-z]:/i.test(relativePath)) return null;
  const resolved = resolve(rootDir, relativePath);
  const root = resolve(rootDir);
  return resolved === root || resolved.startsWith(`${root}${sep}`) ? resolved : null;
}

export function productionPaths(assetManifest, asset) {
  const rule = assetManifest.productionPathRules?.[asset.category];
  if (!rule || !asset.targetSlug) return null;
  return {
    sourcePath: `${rule.authoringDirectory}/${asset.targetSlug}${rule.sourceExtension}`,
    runtimePath: `${rule.runtimeDirectory}/${asset.targetSlug}${rule.runtimeExtension}`,
  };
}

export async function loadWorldContent(rootDir, overrides = {}) {
  async function load(name) {
    const relativePath = overrides[name] || MANIFEST_PATHS[name];
    const absolutePath = resolve(rootDir, relativePath);
    try {
      return JSON.parse(await readFile(absolutePath, "utf8"));
    } catch (error) {
      throw new Error(`Unable to load ${name} manifest at ${absolutePath}: ${error.message}`);
    }
  }
  const [assets, licenses, scene] = await Promise.all([load("assets"), load("licenses"), load("scene")]);
  return { assets, licenses, scene };
}

export async function validateWorldContent(manifests, options = {}) {
  const { assets, licenses, scene } = manifests;
  const { rootDir = process.cwd(), strictProduction = false, checkFiles = true } = options;
  const errors = [];
  const warnings = [];

  if (assets?.schemaVersion !== 1) issue(errors, "schema_version", "assets.schemaVersion", "Unsupported asset schema version");
  if (licenses?.schemaVersion !== 1) issue(errors, "schema_version", "licenses.schemaVersion", "Unsupported license schema version");
  if (scene?.schemaVersion !== 1) issue(errors, "schema_version", "scene.schemaVersion", "Unsupported scene schema version");

  const licenseById = uniqueIndex(errors, licenses?.licenses, "licenses.licenses", "license");
  const sourceById = uniqueIndex(errors, licenses?.sources, "licenses.sources", "source");
  const generatorById = uniqueIndex(errors, assets?.generators, "assets.generators", "generator");
  const assetById = uniqueIndex(errors, assets?.assets, "assets.assets", "asset");

  for (const [sourceId, source] of sourceById) {
    const path = `licenses.sources.${sourceId}`;
    for (const field of ["title", "creator", "sourceUri", "createdAt", "licenseId", "modifications"]) {
      if (typeof source[field] !== "string" || !source[field].trim()) issue(errors, "incomplete_provenance", `${path}.${field}`, `Source ${sourceId} requires ${field}`);
    }
    if (!licenseById.has(source.licenseId)) issue(errors, "missing_license", `${path}.licenseId`, `Source ${sourceId} references missing license ${source.licenseId}`);
    if (source.originType !== "project_original") {
      if (!source.retrievedAt) issue(errors, "incomplete_external_provenance", `${path}.retrievedAt`, "External sources require a retrieval date");
      if (!SHA256.test(source.contentHash || "")) issue(errors, "incomplete_external_provenance", `${path}.contentHash`, "External sources require a SHA-256 hash");
      if (!/^https?:\/\//.test(source.sourceUri || "")) issue(errors, "incomplete_external_provenance", `${path}.sourceUri`, "External source URI must be HTTP(S)");
    } else if (!source.sourceUri.startsWith("project://")) {
      issue(errors, "invalid_original_source", `${path}.sourceUri`, "Project-original sources must use project:// URIs");
    }
  }

  const targetPaths = new Map();
  for (const [assetId, asset] of assetById) {
    const path = `assets.assets.${assetId}`;
    if (!assets.allowedPipelineStatuses?.includes(asset.pipelineStatus)) issue(errors, "invalid_pipeline_status", `${path}.pipelineStatus`, `Unsupported pipeline status ${asset.pipelineStatus}`);
    const source = sourceById.get(asset.provenance?.sourceId);
    if (!source) issue(errors, "missing_provenance", `${path}.provenance.sourceId`, `Missing source ${asset.provenance?.sourceId}`);
    if (!licenseById.has(asset.provenance?.licenseId)) issue(errors, "missing_license", `${path}.provenance.licenseId`, `Missing license ${asset.provenance?.licenseId}`);
    if (source && source.licenseId !== asset.provenance?.licenseId) issue(errors, "license_mismatch", `${path}.provenance`, "Asset and source license IDs differ");

    const rule = assets.productionPathRules?.[asset.category];
    if (!rule) issue(errors, "missing_path_rule", `${path}.category`, `No production path rule for category ${asset.category}`);
    const target = productionPaths(assets, asset);
    if (!target) issue(errors, "missing_production_target", `${path}.targetSlug`, "Asset cannot resolve deterministic production paths");
    else {
      for (const [kind, relativePath] of Object.entries(target)) {
        const safe = safeWorkspacePath(rootDir, relativePath);
        if (!safe) issue(errors, "unsafe_path", `${path}.${kind}`, `Production target escapes the workspace: ${relativePath}`);
        if (targetPaths.has(relativePath)) issue(errors, "duplicate_target_path", `${path}.${kind}`, `${relativePath} is also owned by ${targetPaths.get(relativePath)}`);
        targetPaths.set(relativePath, assetId);
      }
    }

    const budget = assets.budgets?.[asset.budgetClass];
    if (!budget) issue(errors, "missing_budget", `${path}.budgetClass`, `Unknown budget class ${asset.budgetClass}`);
    if (!finiteVector(asset.geometry?.lodTriangles, 3)) issue(errors, "invalid_lods", `${path}.geometry.lodTriangles`, "Exactly three finite LOD triangle counts are required");
    else if (budget) {
      asset.geometry.lodTriangles.forEach((triangles, lod) => {
        if (triangles < 0 || triangles > budget.lodTriangles[lod]) issue(errors, "triangle_budget", `${path}.geometry.lodTriangles[${lod}]`, `${triangles} exceeds ${asset.budgetClass} LOD${lod} budget ${budget.lodTriangles[lod]}`);
        if (lod > 0 && triangles > asset.geometry.lodTriangles[lod - 1]) issue(errors, "lod_order", `${path}.geometry.lodTriangles[${lod}]`, "Lower-detail LOD cannot have more triangles than the previous LOD");
      });
    }
    if (!Number.isInteger(asset.materials?.slots) || asset.materials.slots < 0 || (budget && asset.materials.slots > budget.maxMaterialSlots)) issue(errors, "material_budget", `${path}.materials.slots`, "Material slot count is invalid or over budget");
    if (!Number.isInteger(asset.materials?.maxTextureDimension) || asset.materials.maxTextureDimension < 0 || (budget && asset.materials.maxTextureDimension > budget.maxTextureDimension)) issue(errors, "texture_budget", `${path}.materials.maxTextureDimension`, "Texture dimension is invalid or over budget");
    if (asset.materials?.compressed !== true) issue(errors, "uncompressed_material", `${path}.materials.compressed`, "Runtime material must declare compression");

    if (asset.pipelineStatus === "prototype_geometry") {
      if (asset.runtime?.delivery !== "procedural") issue(errors, "prototype_delivery", `${path}.runtime.delivery`, "Prototype geometry must declare procedural delivery");
      if (!generatorById.has(asset.runtime?.generatorId)) issue(errors, "missing_generator", `${path}.runtime.generatorId`, `Missing generator ${asset.runtime?.generatorId}`);
      if (strictProduction) issue(errors, "production_gate", `${path}.pipelineStatus`, `${assetId} remains prototype_geometry`);
    } else if (asset.pipelineStatus === "production_ready") {
      if (asset.runtime?.delivery !== "file") issue(errors, "production_delivery", `${path}.runtime.delivery`, "Production asset must use file delivery");
      if (!asset.runtime?.path || !SHA256.test(asset.runtime?.sha256 || "")) issue(errors, "production_integrity", `${path}.runtime`, "Production file delivery requires path and SHA-256");
      const safe = safeWorkspacePath(rootDir, asset.runtime?.path);
      if (!safe) issue(errors, "unsafe_path", `${path}.runtime.path`, "Runtime path must remain within the workspace");
      else if (checkFiles) {
        try { await access(safe); } catch { issue(errors, "missing_runtime_file", `${path}.runtime.path`, `Missing production file ${asset.runtime.path}`); }
      }
    }

    if (assetId === "hm.character.gloamfarer") {
      const currentMorphs = new Set(asset.runtime?.capabilities?.morphTargets || []);
      for (const morph of assets.requiredCharacterMorphs || []) if (!currentMorphs.has(morph)) issue(errors, "missing_live_morph", `${path}.runtime.capabilities.morphTargets`, `Gloamfarer runtime lacks ${morph}`);
    }
    if (asset.category === "character") {
      const targetClips = new Set(asset.targetCapabilities?.clips || []);
      const required = assetId === "hm.character.gloamfarer" ? assets.requiredCharacterClips || [] : [];
      for (const clip of required) if (!targetClips.has(clip)) issue(errors, "missing_target_clip", `${path}.targetCapabilities.clips`, `${assetId} production target lacks ${clip}`);
      if (targetClips.size === 0) issue(errors, "missing_target_clip", `${path}.targetCapabilities.clips`, `${assetId} needs an authored clip target`);
    }
    if (asset.category === "enemy") {
      const targetClips = new Set(asset.targetCapabilities?.clips || []);
      for (const clip of assets.requiredEnemyClips || []) if (!targetClips.has(clip)) issue(errors, "missing_target_clip", `${path}.targetCapabilities.clips`, `${assetId} production target lacks ${clip}`);
    }
  }

  if (scene?.units !== "meters" || scene?.coordinateSystem?.up !== "+Y") issue(errors, "coordinate_contract", "scene.coordinateSystem", "Scene must use metre units and Y-up coordinates");
  if (scene?.legacyMapping?.metersPerTile !== 4) issue(errors, "legacy_scale", "scene.legacyMapping.metersPerTile", "Legacy coordinates must map at four metres per tile");
  if (!finiteVector(scene?.bounds?.min, 3) || !finiteVector(scene?.bounds?.max, 3) || scene?.bounds?.playableSize?.[0] !== 96 || scene?.bounds?.playableSize?.[1] !== 96) issue(errors, "scene_bounds", "scene.bounds", "Hearthmere must have a 96 x 96 metre playable extent");

  const phaseById = uniqueIndex(errors, scene?.phaseDefinitions, "scene.phaseDefinitions", "phase");
  const exclusiveGroups = scene?.phasePolicy?.exclusiveGroups || [];
  for (const group of exclusiveGroups) {
    if (!Array.isArray(group) || group.length < 2) issue(errors, "invalid_phase_group", "scene.phasePolicy.exclusiveGroups", "Exclusive groups require at least two phases");
    for (const phaseId of group || []) if (!phaseById.has(phaseId)) issue(errors, "unknown_phase", "scene.phasePolicy.exclusiveGroups", `Unknown phase ${phaseId}`);
  }
  for (const phaseId of [...(scene?.phasePolicy?.alwaysActive || []), ...(scene?.phasePolicy?.defaultCharacterPhases || [])]) if (!phaseById.has(phaseId)) issue(errors, "unknown_phase", "scene.phasePolicy", `Unknown phase ${phaseId}`);

  const chunks = scene?.chunks || [];
  const chunkById = uniqueIndex(errors, chunks, "scene.chunks", "chunk");
  const expectedChunks = scene?.acceptanceProfile?.requiredChunkCount;
  if (chunks.length !== expectedChunks) issue(errors, "chunk_count", "scene.chunks", `Expected ${expectedChunks} chunks, found ${chunks.length}`);
  const gridKeys = new Set();
  const globalIds = new Map();
  const instanceById = new Map();
  const colliderById = new Map();
  const navCellById = new Map();
  const navLinks = [];
  const semanticAnchors = new Map();
  const referencedAssetIds = new Set(scene?.terrain?.surfacePaletteAssetIds || []);
  const shadowPriorities = new Set();
  let shadowCastingPracticals = 0;

  function registerSceneId(entry, path) {
    checkId(errors, entry?.id, `${path}.id`, "scene record");
    if (globalIds.has(entry?.id)) issue(errors, "duplicate_scene_id", `${path}.id`, `${entry?.id} is already used at ${globalIds.get(entry?.id)}`);
    else globalIds.set(entry?.id, path);
  }
  function referenceAsset(assetId, expectedCategory, path) {
    const asset = assetById.get(assetId);
    referencedAssetIds.add(assetId);
    if (!asset) issue(errors, "missing_asset", path, `Unknown asset ${assetId}`);
    else if (expectedCategory && asset.category !== expectedCategory) issue(errors, "asset_category", path, `${assetId} is ${asset.category}, expected ${expectedCategory}`);
  }

  for (let chunkPosition = 0; chunkPosition < chunks.length; chunkPosition += 1) {
    const chunk = chunks[chunkPosition];
    const path = `scene.chunks.${chunk.id || chunkPosition}`;
    if (!finiteVector(chunk.grid, 2) || chunk.grid.some((axis) => !Number.isInteger(axis) || axis < 0 || axis > 2)) issue(errors, "chunk_grid", `${path}.grid`, "Chunk grid must contain integer coordinates from 0 through 2");
    const gridKey = chunk.grid?.join(",");
    if (gridKeys.has(gridKey)) issue(errors, "duplicate_chunk_grid", `${path}.grid`, `Grid ${gridKey} is occupied twice`);
    gridKeys.add(gridKey);
    const size = scene?.acceptanceProfile?.requiredChunkSizeMeters;
    const expectedMin = [chunk.grid?.[0] * size, -8, chunk.grid?.[1] * size];
    const expectedMax = [expectedMin[0] + size, 32, expectedMin[2] + size];
    if (!finiteVector(chunk.bounds?.min, 3) || !finiteVector(chunk.bounds?.max, 3) || JSON.stringify(chunk.bounds.min) !== JSON.stringify(expectedMin) || JSON.stringify(chunk.bounds.max) !== JSON.stringify(expectedMax)) issue(errors, "chunk_bounds", `${path}.bounds`, `Chunk bounds must be ${JSON.stringify({ min: expectedMin, max: expectedMax })}`);
    if (!Array.isArray(chunk.surfaceLayers) || chunk.surfaceLayers.length === 0) issue(errors, "missing_surfaces", `${path}.surfaceLayers`, "Chunk has no surface layers");
    const surfaceWeight = (chunk.surfaceLayers || []).reduce((sum, layer) => sum + (Number.isFinite(layer.weight) ? layer.weight : 0), 0);
    if (Math.abs(surfaceWeight - 1) > 0.001) issue(errors, "surface_weights", `${path}.surfaceLayers`, `Surface weights must sum to 1, found ${surfaceWeight}`);
    (chunk.surfaceLayers || []).forEach((layer, index) => { validatePhases(errors, layer, `${path}.surfaceLayers[${index}]`, phaseById, exclusiveGroups); referenceAsset(layer.assetId, "surface", `${path}.surfaceLayers[${index}].assetId`); });

    for (let index = 0; index < (chunk.instances || []).length; index += 1) {
      const instance = chunk.instances[index];
      const recordPath = `${path}.instances[${index}]`;
      registerSceneId(instance, recordPath);
      instanceById.set(instance.id, instance);
      validatePhases(errors, instance, recordPath, phaseById, exclusiveGroups);
      validateTransform(errors, instance.transform, `${recordPath}.transform`);
      if (finiteVector(instance.transform?.position, 3) && !inChunk(instance.transform.position, chunk.bounds)) issue(errors, "instance_outside_chunk", `${recordPath}.transform.position`, `${instance.id} is outside ${chunk.id}`);
      referenceAsset(instance.assetId, instance.type, `${recordPath}.assetId`);
      if (assetById.get(instance.assetId)?.pipelineStatus !== instance.status) issue(errors, "status_mismatch", `${recordPath}.status`, "Instance status must match its asset status");
    }

    for (let index = 0; index < (chunk.colliders || []).length; index += 1) {
      const collider = chunk.colliders[index];
      const recordPath = `${path}.colliders[${index}]`;
      registerSceneId(collider, recordPath); colliderById.set(collider.id, collider);
      validatePhases(errors, collider, recordPath, phaseById, exclusiveGroups);
      if (!instanceById.has(collider.instanceId)) issue(errors, "missing_instance", `${recordPath}.instanceId`, `Collider references missing instance ${collider.instanceId}`);
      if (!finiteVector(collider.center, 3)) issue(errors, "invalid_bounds", `${recordPath}.center`, "Collider center must contain three finite numbers");
      if (collider.shape === "box" && (!finiteVector(collider.size, 3) || collider.size.some((axis) => axis <= 0))) issue(errors, "invalid_bounds", `${recordPath}.size`, "Box collider requires positive size");
      if (collider.shape === "cylinder" && (!(collider.radius > 0) || !(collider.height > 0))) issue(errors, "invalid_bounds", recordPath, "Cylinder collider requires positive radius and height");
    }
    for (let index = 0; index < (chunk.occluders || []).length; index += 1) {
      const occluder = chunk.occluders[index];
      const recordPath = `${path}.occluders[${index}]`;
      registerSceneId(occluder, recordPath); validatePhases(errors, occluder, recordPath, phaseById, exclusiveGroups);
      if (!instanceById.has(occluder.instanceId)) issue(errors, "missing_instance", `${recordPath}.instanceId`, `Occluder references missing instance ${occluder.instanceId}`);
      if (!finiteVector(occluder.center, 3)) issue(errors, "invalid_bounds", `${recordPath}.center`, "Occluder center must contain three finite numbers");
    }

    for (let index = 0; index < (chunk.navigation?.cells || []).length; index += 1) {
      const cell = chunk.navigation.cells[index];
      const recordPath = `${path}.navigation.cells[${index}]`;
      registerSceneId(cell, recordPath); navCellById.set(cell.id, cell); validatePhases(errors, cell, recordPath, phaseById, exclusiveGroups);
      if (!Array.isArray(cell.polygon) || cell.polygon.length < 3 || cell.polygon.some((point) => !finiteVector(point, 3))) issue(errors, "invalid_nav_polygon", `${recordPath}.polygon`, "Navigation cell needs at least three 3D points");
      if (!(cell.cost > 0)) issue(errors, "invalid_nav_cost", `${recordPath}.cost`, "Navigation cost must be positive");
    }
    for (let index = 0; index < (chunk.navigation?.links || []).length; index += 1) {
      const link = chunk.navigation.links[index];
      const recordPath = `${path}.navigation.links[${index}]`;
      registerSceneId(link, recordPath); navLinks.push({ link, path: recordPath }); validatePhases(errors, link, recordPath, phaseById, exclusiveGroups);
      if (!(link.cost > 0)) issue(errors, "invalid_nav_cost", `${recordPath}.cost`, "Navigation link cost must be positive");
      if (!Array.isArray(link.portal) || link.portal.length !== 2 || link.portal.some((point) => !finiteVector(point, 3))) issue(errors, "invalid_nav_portal", `${recordPath}.portal`, "Navigation portal needs two 3D endpoints");
    }

    const phaseCollections = ["lights", "volumes", "vfxZones", "audioZones", "interactionAnchors", "spawnAnchors"];
    for (const collection of phaseCollections) {
      if (!Array.isArray(chunk[collection])) issue(errors, "missing_chunk_collection", `${path}.${collection}`, `Chunk must declare ${collection}`);
      for (let index = 0; index < (chunk[collection] || []).length; index += 1) {
        const record = chunk[collection][index];
        const recordPath = `${path}.${collection}[${index}]`;
        registerSceneId(record, recordPath); validatePhases(errors, record, recordPath, phaseById, exclusiveGroups);
        if (record.assetId) referenceAsset(record.assetId, collection === "vfxZones" ? "vfx" : collection === "audioZones" ? "audio" : null, `${recordPath}.assetId`);
        if (record.transform) validateTransform(errors, record.transform, `${recordPath}.transform`);
        if (record.legacySource) {
          if (!finiteVector(record.legacySource.position, 2)) issue(errors, "legacy_position", `${recordPath}.legacySource.position`, "Legacy position must contain two finite coordinates");
          else if (record.transform && (record.transform.position[0] !== record.legacySource.position[0] * 4 || record.transform.position[2] !== record.legacySource.position[1] * 4)) issue(errors, "legacy_mapping", `${recordPath}.transform.position`, `${record.id} does not preserve its 4m legacy mapping`);
        }
        if (["interactionAnchors", "spawnAnchors"].includes(collection)) semanticAnchors.set(record.id, record);
        if (collection === "lights" && record.castShadow) {
          shadowCastingPracticals += 1;
          if (!Number.isInteger(record.shadowPriority) || record.shadowPriority < 1 || record.shadowPriority > 4) issue(errors, "shadow_priority", `${recordPath}.shadowPriority`, "Shadow-casting practical requires priority 1 through 4");
          if (shadowPriorities.has(record.shadowPriority)) issue(errors, "shadow_priority", `${recordPath}.shadowPriority`, `Duplicate shadow priority ${record.shadowPriority}`);
          shadowPriorities.add(record.shadowPriority);
        }
      }
    }
  }

  for (const [colliderId] of colliderById) {
    const owners = chunks.filter((chunk) => chunk.navigation?.cells?.some((cell) => cell.blockedByColliderIds?.includes(colliderId)));
    if (owners.length === 0) warnings.push({ code: "collider_not_in_nav", path: `scene.collider.${colliderId}`, message: "Collider is not declared in any navigation cell's blockedByColliderIds" });
  }
  for (const [cellId, cell] of navCellById) for (const colliderId of cell.blockedByColliderIds || []) if (!colliderById.has(colliderId)) issue(errors, "missing_collider", `scene.navigation.${cellId}.blockedByColliderIds`, `Unknown collider ${colliderId}`);
  for (const { link, path } of navLinks) {
    if (!navCellById.has(link.from)) issue(errors, "missing_nav_cell", `${path}.from`, `Unknown navigation cell ${link.from}`);
    if (!navCellById.has(link.to)) issue(errors, "missing_nav_cell", `${path}.to`, `Unknown navigation cell ${link.to}`);
    if (link.from === link.to) issue(errors, "self_nav_link", path, "Navigation link cannot connect a cell to itself");
  }
  if (navCellById.size) {
    const adjacency = new Map([...navCellById.keys()].map((id) => [id, new Set()]));
    for (const { link } of navLinks) if (adjacency.has(link.from) && adjacency.has(link.to)) { adjacency.get(link.from).add(link.to); if (link.bidirectional) adjacency.get(link.to).add(link.from); }
    const visited = new Set(); const pending = [[...navCellById.keys()][0]];
    while (pending.length) { const id = pending.pop(); if (visited.has(id)) continue; visited.add(id); for (const next of adjacency.get(id) || []) pending.push(next); }
    if (visited.size !== navCellById.size) issue(errors, "disconnected_navigation", "scene.chunks.navigation", `Only ${visited.size}/${navCellById.size} navigation cells are reachable`);
  }

  for (const requiredId of scene?.acceptanceProfile?.requiredSemanticAnchors || []) if (!semanticAnchors.has(requiredId)) issue(errors, "missing_semantic_anchor", "scene.acceptanceProfile.requiredSemanticAnchors", `Required anchor ${requiredId} is missing`);
  const referenceCounts = {};
  for (const assetId of referencedAssetIds) {
    const category = assetById.get(assetId)?.category;
    if (category) referenceCounts[category] = (referenceCounts[category] || 0) + 1;
  }
  for (const [category, minimum] of Object.entries(scene?.acceptanceProfile?.minimumReferencedAssets || {})) if ((referenceCounts[category] || 0) < minimum) issue(errors, "asset_coverage", `scene.acceptanceProfile.minimumReferencedAssets.${category}`, `Referenced ${referenceCounts[category] || 0}/${minimum} required ${category} assets`);
  if (shadowCastingPracticals > scene?.qualityTargets?.high?.shadowCastingPracticals) issue(errors, "shadow_budget", "scene.chunks.lights", `${shadowCastingPracticals} shadow-casting practicals exceed the scene budget`);
  if (shadowCastingPracticals !== 4) warnings.push({ code: "shadow_allocation", path: "scene.chunks.lights", message: `Expected four authored shadow-priority practicals; found ${shadowCastingPracticals}` });

  for (const globalLight of scene?.environment?.globalLights || []) validatePhases(errors, globalLight, `scene.environment.globalLights.${globalLight.id}`, phaseById, exclusiveGroups);

  const prototypeCount = [...assetById.values()].filter((asset) => asset.pipelineStatus === "prototype_geometry").length;
  if (prototypeCount && !strictProduction) warnings.push({ code: "prototype_assets", path: "assets.assets", message: `${prototypeCount} assets remain honest procedural prototypes; run --strict-production for the final art gate` });

  return {
    valid: errors.length === 0,
    strictProduction,
    errors,
    warnings,
    summary: summarizeWorldContent(manifests, { referencedAssetIds }),
  };
}

export function summarizeWorldContent(manifests, context = {}) {
  const { assets, licenses, scene } = manifests;
  const assetsByCategory = {};
  const assetsByStatus = {};
  for (const asset of assets?.assets || []) {
    assetsByCategory[asset.category] = (assetsByCategory[asset.category] || 0) + 1;
    assetsByStatus[asset.pipelineStatus] = (assetsByStatus[asset.pipelineStatus] || 0) + 1;
  }
  const chunks = scene?.chunks || [];
  const flatten = (field) => chunks.flatMap((chunk) => chunk[field] || []);
  return {
    catalogId: assets?.catalogId,
    sceneId: scene?.id,
    playableMeters: scene?.bounds?.playableSize,
    legacyMetersPerTile: scene?.legacyMapping?.metersPerTile,
    chunks: chunks.length,
    assets: assets?.assets?.length || 0,
    assetsByCategory,
    assetsByStatus,
    referencedAssets: context.referencedAssetIds?.size,
    instances: flatten("instances").length,
    colliders: flatten("colliders").length,
    occluders: flatten("occluders").length,
    navCells: chunks.flatMap((chunk) => chunk.navigation?.cells || []).length,
    navLinks: chunks.flatMap((chunk) => chunk.navigation?.links || []).length,
    lights: (scene?.environment?.globalLights?.length || 0) + flatten("lights").length,
    vfxZones: flatten("vfxZones").length,
    audioZones: flatten("audioZones").length,
    interactionAnchors: flatten("interactionAnchors").length,
    spawnAnchors: flatten("spawnAnchors").length,
    licenses: licenses?.licenses?.length || 0,
    provenanceSources: licenses?.sources?.length || 0,
  };
}

export function mutatedFixture(manifests, mutate) {
  const fixture = clone(manifests);
  mutate(fixture);
  return fixture;
}
