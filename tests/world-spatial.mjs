import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { BESTIARY, ENEMY_FAMILIES } from '../packages/content/src/bestiary.data.js';
import { EXPANSION_CREATURES, EXPANSION_QUESTS } from '../packages/content/src/narrative.data.js';
import { redactedJsonPointers } from '../tools/worldgen/redact-world-spatial-wave-02-v9.mjs';
import {
  BUILDING_TYPOLOGIES,
  ENVIRONMENT_ART_DIRECTION,
  EXPANSION_CREATURE_HABITAT_ENVELOPES,
  FAMILY_HABITAT_ENVELOPES,
  QUEST_WAVE_04_SPATIAL_INDEX,
  QUEST_ENVIRONMENT_REQUIREMENTS,
  QUEST_LOCATION_SPATIAL_PROGRAMS,
  REGION_SPATIAL_PROFILES,
  SITE_ACTIVITY_CYCLES,
  SITE_SPATIAL_ENVELOPES,
  SPATIAL_AUTHORITY_LEVELS,
  TRAVERSAL_NETWORK,
  VEYL_PROJECTED_CRS,
  WORLD_SPATIAL_BY_EXPANSION_CREATURE_ID,
  WORLD_SPATIAL_BY_FAMILY_ID,
  WORLD_SPATIAL_BY_QUEST_ID,
  WORLD_SPATIAL_BY_SITE_ID,
  WORLD_SPATIAL_FOUNDATION,
  WORLD_SPATIAL_SOURCE_LEDGER,
  WORLD_SPATIAL_TARGETS,
  validateWorldSpatialFoundation,
} from '../packages/content/src/world-spatial.data.js';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const atlas = JSON.parse(readFileSync(new URL('../packages/content/manifests/sable-reach.atlas-runtime.json', import.meta.url), 'utf8'));
const worldSpatialModuleSource = readFileSync(new URL('../packages/content/src/world-spatial.data.js', import.meta.url), 'utf8');
const worldReadmeSource = readFileSync(new URL('../assets/world/README.md', import.meta.url), 'utf8');
const artBibleSource = readFileSync(new URL('../design-review/Hollow March Art Bible.dc.html', import.meta.url), 'utf8');
const ids = (records, field = 'id') => new Set(records.map((record) => record[field]));
const equalSets = (left, right) => left.size === right.size && [...left].every((value) => right.has(value));
const valueAtPointer = (value, pointer) => pointer.slice(1).split('/').reduce((current, segment) => current?.[segment.replaceAll('~1', '/').replaceAll('~0', '~')], value);
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const pngDimensions = (bytes) => ({ width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) });
const stringLeaves = (value) => typeof value === 'string'
  ? [value]
  : Array.isArray(value)
    ? value.flatMap(stringLeaves)
    : value && typeof value === 'object'
      ? Object.values(value).flatMap(stringLeaves)
      : [];

const validation = validateWorldSpatialFoundation();
assert.equal(validation.valid, true, JSON.stringify(validation.errors, null, 2));
assert.deepEqual(validation.stats, {
  regions: 6,
  sites: 12,
  routeSections: 10,
  buildingTypologies: 15,
  familyHabitats: 21,
  foundingFormsCovered: 178,
  expansionCreatureHabitats: 39,
  questEnvironments: 49,
  authoredQuestCapacity: 5000,
});

assert.equal(WORLD_SPATIAL_TARGETS.authoredQuestCapacity, 5_000);
assert.equal(WORLD_SPATIAL_TARGETS.currentAcceptedQuestCount, EXPANSION_QUESTS.length);
assert.equal(VEYL_PROJECTED_CRS.id, 'veyl_local_grid_v1');
assert.equal(VEYL_PROJECTED_CRS.authorityCode, null);
assert.equal(VEYL_PROJECTED_CRS.horizontalUnit, 'meters');
assert.equal(VEYL_PROJECTED_CRS.verticalUnit, 'meters');
assert.equal(VEYL_PROJECTED_CRS.classification, 'fictional_modeled_not_measured');
assert.match(VEYL_PROJECTED_CRS.precisionNotice, /fictional modeled world/i);

assert.ok(equalSets(ids(REGION_SPATIAL_PROFILES), ids(atlas.territories)));
assert.ok(equalSets(ids(SITE_SPATIAL_ENVELOPES), ids(atlas.sites)));
assert.ok(equalSets(ids(TRAVERSAL_NETWORK), ids(atlas.routes.flatMap(({ sections }) => sections))));
assert.ok(REGION_SPATIAL_PROFILES.every(({ authority, maturity }) => authority.envelope === 'canon' && authority.environment === 'authored_design_constraint' && maturity.atlas === 'gis_valid'));
assert.ok(SITE_SPATIAL_ENVELOPES.every(({ designEnvelope }) => designEnvelope.boundaryStatus === 'provisional_not_cadastral' && designEnvelope.authority === 'authored_design_constraint'));

assert.ok(equalSets(ids(FAMILY_HABITAT_ENVELOPES, 'familyId'), ids(ENEMY_FAMILIES)));
const coveredFoundingForms = FAMILY_HABITAT_ENVELOPES.flatMap(({ formIds }) => formIds);
assert.equal(coveredFoundingForms.length, BESTIARY.length);
assert.ok(equalSets(new Set(coveredFoundingForms), ids(BESTIARY)));
assert.ok(FAMILY_HABITAT_ENVELOPES.every(({ authority }) => authority.identityAndCanonicalRange === 'canon' && authority.productionEnvelope === 'authored_design_constraint'));
assert.ok(FAMILY_HABITAT_ENVELOPES.every(({ microhabitats, sensorySignature }) => microhabitats.length >= 3 && sensorySignature.visibilityCue && sensorySignature.acoustic && sensorySignature.scent));

assert.equal(EXPANSION_CREATURE_HABITAT_ENVELOPES.length, EXPANSION_CREATURES.length);
assert.ok(equalSets(ids(EXPANSION_CREATURE_HABITAT_ENVELOPES, 'creatureId'), ids(EXPANSION_CREATURES)));
const wave04CreatureIds = ids(QUEST_WAVE_04_SPATIAL_INDEX.creatureHabitatEnvelopes, 'creatureId');
for (const envelope of EXPANSION_CREATURE_HABITAT_ENVELOPES) {
  assert.equal(envelope.placement.status, 'provisional_placement');
  assert.equal(envelope.placement.exactCoordinate, null);
  if (wave04CreatureIds.has(envelope.creatureId)) {
    assert.ok(envelope.microhabitats.length >= 1);
    assert.ok(envelope.sourceHabitatId);
    assert.equal(envelope.fullWorldContractPath, 'packages/content/manifests/quest-wave-04-v11.world.json');
  } else {
    assert.ok(envelope.microhabitats.length >= 4);
  }
  assert.ok(envelope.locomotionConstraint && envelope.sensorySignature.visualCue && envelope.sensorySignature.acoustic && envelope.sensorySignature.scent);
}

assert.equal(Object.keys(QUEST_LOCATION_SPATIAL_PROGRAMS).length, new Set(EXPANSION_QUESTS.map(({ locationId }) => locationId)).size);
assert.ok(equalSets(new Set(Object.keys(QUEST_LOCATION_SPATIAL_PROGRAMS)), new Set(EXPANSION_QUESTS.map(({ locationId }) => locationId))));
assert.equal(QUEST_ENVIRONMENT_REQUIREMENTS.length, EXPANSION_QUESTS.length);
assert.ok(equalSets(ids(QUEST_ENVIRONMENT_REQUIREMENTS, 'questId'), ids(EXPANSION_QUESTS)));
for (const requirement of QUEST_ENVIRONMENT_REQUIREMENTS) {
  const quest = EXPANSION_QUESTS.find(({ id }) => id === requirement.questId);
  assert.ok(quest);
  assert.equal(requirement.locationId, quest.locationId);
  assert.equal(requirement.primaryMechanicId, quest.primaryMechanicId);
  assert.equal(requirement.canonicalSetpiece, quest.authorshipProof.setpiece);
  assert.equal(requirement.failForwardEnvironmentMutation, quest.authorshipProof.failureTransformation);
  assert.equal(requirement.forbiddenSubstitution, quest.authorshipProof.forbiddenSubstitution);
  assert.equal(requirement.placementStatus, 'provisional_placement');
  assert.equal(requirement.exactAtlasCoordinate, null);
  assert.equal(requirement.designEnvelopeMeters.length, 3);
  assert.ok(requirement.spatialBeats.length >= 4);
  assert.ok(requirement.mutableLayers.length >= 4);
  assert.ok(requirement.productionChecklist.length >= 5);
  assert.ok(requirement.sensory.visibility && requirement.sensory.acoustic && requirement.sensory.scent);
}

const typologyIds = ids(BUILDING_TYPOLOGIES);
for (const typology of BUILDING_TYPOLOGIES) {
  const roomIds = new Set(typology.roomGraph.rooms);
  const thresholdIds = new Set(typology.thresholds.map(({ id }) => id));
  assert.equal(roomIds.size, typology.roomGraph.rooms.length);
  assert.equal(thresholdIds.size, typology.thresholds.length);
  assert.ok(typology.exteriorMaterials.length >= 4);
  assert.ok(typology.weathering.length >= 3);
  assert.ok(typology.propFamilies.length >= 5);
  assert.ok(typology.utilities.water && typology.utilities.heat && typology.utilities.waste && typology.utilities.light);
  assert.ok(typology.roomGraph.edges.every(({ from, to, thresholdId }) => roomIds.has(from) && roomIds.has(to) && thresholdIds.has(thresholdId)));
}
assert.ok(SITE_SPATIAL_ENVELOPES.every(({ typologyIds: siteTypologies }) => siteTypologies.every((id) => typologyIds.has(id))));
assert.ok(QUEST_ENVIRONMENT_REQUIREMENTS.every(({ typologyIds: questTypologies }) => questTypologies.every((id) => typologyIds.has(id))));

assert.ok(equalSets(ids(SITE_ACTIVITY_CYCLES, 'siteId'), ids(atlas.sites)));
assert.ok(SITE_ACTIVITY_CYCLES.every(({ populationKinds, cycles, persistentStorySignals }) => populationKinds.length && cycles.length >= 2 && persistentStorySignals.length >= 3));

assert.equal(WORLD_SPATIAL_BY_QUEST_ID.size, QUEST_ENVIRONMENT_REQUIREMENTS.length);
assert.equal(WORLD_SPATIAL_BY_SITE_ID.size, SITE_SPATIAL_ENVELOPES.length);
assert.equal(WORLD_SPATIAL_BY_FAMILY_ID.size, FAMILY_HABITAT_ENVELOPES.length);
assert.equal(WORLD_SPATIAL_BY_EXPANSION_CREATURE_ID.size, EXPANSION_CREATURE_HABITAT_ENVELOPES.length);
assert.equal(WORLD_SPATIAL_BY_QUEST_ID.get('main_noon_came_bleeding')?.locationId, 'hearthmere_dusk_circuit');
assert.equal(WORLD_SPATIAL_BY_FAMILY_ID.get('cairn_beasts')?.formIds.length, 10);
assert.equal(WORLD_SPATIAL_BY_EXPANSION_CREATURE_ID.get('elsewhere_calf')?.placement.exactCoordinate, null);

const spatialAuthorityIds = ids(SPATIAL_AUTHORITY_LEVELS);
for (const source of WORLD_SPATIAL_SOURCE_LEDGER) {
  assert.equal(source.path.startsWith('/'), false);
  assert.equal(source.path.includes('\\'), false);
  assert.equal(existsSync(`${repositoryRoot}${source.path}`), true, `Missing redacted source-ledger path ${source.path}`);
  assert.equal(spatialAuthorityIds.has(source.authority), true, `Unknown source-ledger authority ${source.authority}`);
}

const visualReferences = ENVIRONMENT_ART_DIRECTION.acceptedVisualReferences;
assert.equal(visualReferences.length, 8);
for (const reference of visualReferences) {
  const bytes = readFileSync(`${repositoryRoot}${reference.path}`);
  assert.equal(sha256(bytes), reference.sha256, `${reference.id} hash changed`);
  assert.equal(reference.status, 'approved_direction');
  assert.match(artBibleSource, new RegExp(reference.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${reference.id} is missing from the Art Bible`);
}
const gravenReference = visualReferences.find(({ id }) => id === 'concept_graven_march_black_pine_occlusion_basin');
const cathedralReference = visualReferences.find(({ id }) => id === 'concept_cathedral_six_rehearsed_dawns');
const wardenExteriorReference = visualReferences.find(({ id }) => id === 'concept_warden_reed_four_bank_visibility_exterior');
const wardenInteriorReference = visualReferences.find(({ id }) => id === 'concept_warden_reed_stilt_service_house_interior');
assert.equal(gravenReference?.referenceScope, 'regional_quest_location');
assert.equal(gravenReference?.locationId, 'graven_march_black_pine_occlusion_basin');
assert.equal(gravenReference?.exactCoordinate, null);
assert.equal(gravenReference?.runtimeBackdrop, true);
assert.equal(gravenReference?.productionAsset, false);
assert.equal(cathedralReference?.referenceScope, 'quest_location');
assert.equal(cathedralReference?.locationId, 'cathedral_of_six_rehearsed_dawns');
assert.equal(cathedralReference?.exactCoordinate, null);
assert.equal(cathedralReference?.runtimeBackdrop, false);
assert.equal(cathedralReference?.productionAsset, false);
for (const reference of [wardenExteriorReference, wardenInteriorReference]) {
  assert.equal(reference?.siteId, 'site.warden-reed');
  assert.equal(reference?.locationId, 'warden_reed_four_bank_visibility');
  assert.equal(reference?.questId, 'regional_the_fog_came_to_collect_our_outlines');
  assert.equal(reference?.exactCoordinate, null);
  assert.equal(reference?.runtimeBackdrop, false);
  assert.equal(reference?.runtimeIntegrated, false);
  assert.equal(reference?.productionAsset, false);
  assert.match(reference?.visualReviewBoundary ?? '', /visual review/i);
}
assert.equal(wardenExteriorReference?.referenceScope, 'site_quest_location_exterior');
assert.equal(wardenInteriorReference?.referenceScope, 'site_service_house_interior');
assert.doesNotMatch(artBibleSource, /No provenance sidecars|Vendored, and still without provenance/);
assert.match(artBibleSource, /hint-placeholder-count="8"/);

const worldPromptPacketPath = 'assets/world/prompts/world-environments.current.batch-02.prompt-packets.json';
const worldProvenancePath = 'assets/world/world-environments.current.batch-02.provenance.json';
const worldPromptPacket = JSON.parse(readFileSync(`${repositoryRoot}${worldPromptPacketPath}`, 'utf8'));
const worldProvenance = JSON.parse(readFileSync(`${repositoryRoot}${worldProvenancePath}`, 'utf8'));
assert.equal(worldPromptPacket.schema, 'SableReachPublicPromptPacketV1');
assert.equal(worldPromptPacket.records.length, 6);
assert.equal(worldProvenance.schema, 'SableReachPublishedArtProvenanceV1');
assert.equal(worldProvenance.records.length, 6);
assert.equal(worldProvenance.promptSource, worldPromptPacketPath);
const promptById = new Map(worldPromptPacket.records.map((record) => [record.id, record]));
for (const prompt of worldPromptPacket.records) {
  assert.equal(sha256(prompt.canonicalPublicDirection), prompt.promptSha256, `${prompt.id} direction hash changed`);
  assert.equal(prompt.assetPath.startsWith('/'), false);
  assert.equal(prompt.assetPath.includes('\\'), false);
  for (const source of prompt.sourceReferences) {
    assert.equal(source.path.startsWith('/'), false);
    assert.equal(source.path.includes('\\'), false);
    const sourceBytes = readFileSync(`${repositoryRoot}${source.path}`);
    if (source.sha256) assert.equal(sha256(sourceBytes), source.sha256, `${prompt.id} source hash changed`);
  }
  if (prompt.bodyStatus === 'canonical_public_direction_from_world_manifest_not_execution_prompt') {
    assert.equal(worldReadmeSource.includes(prompt.canonicalPublicDirection), true, `${prompt.id} no longer matches its manifest evidence`);
  }
}
const exactWardenPrompts = worldPromptPacket.records.filter(({ bodyStatus }) => bodyStatus === 'exact_generation_prompt_body');
assert.deepEqual(exactWardenPrompts.map(({ id }) => id).sort(), [
  'prompt.environment.warden_reed_four_bank_visibility_exterior',
  'prompt.environment.warden_reed_stilt_service_house_interior',
]);
assert.match(promptById.get('prompt.environment.warden_reed_four_bank_visibility_exterior')?.canonicalPublicDirection ?? '', /^Create one new original environment concept image/);
assert.match(promptById.get('prompt.environment.warden_reed_stilt_service_house_interior')?.canonicalPublicDirection ?? '', /^Create one new original environment interior concept image/);
assert.equal(promptById.get('prompt.environment.warden_reed_four_bank_visibility_exterior')?.canonicalPublicDirection.length, 2764);
assert.equal(promptById.get('prompt.environment.warden_reed_stilt_service_house_interior')?.canonicalPublicDirection.length, 3553);
const expectedLegacyWorldPaths = new Set([
  'assets/world/hearthmere-hold.png',
  'assets/world/dunmire-causeway.png',
  'assets/world/cinderward-foundry.png',
  'assets/world/hollow-abbey-nave.png',
]);
const provenanceByPath = new Map(worldProvenance.records.map((record) => [record.path, record]));
assert.equal(provenanceByPath.size, worldProvenance.records.length);
assert.ok([...expectedLegacyWorldPaths].every((path) => provenanceByPath.has(path)));
assert.equal(provenanceByPath.has('assets/world/graven-march-black-pine-occlusion-basin-v5.png'), false);
assert.equal(provenanceByPath.has('assets/world/cathedral-six-rehearsed-dawns-v2.png'), false);
for (const record of worldProvenance.records) {
  const bytes = readFileSync(`${repositoryRoot}${record.path}`);
  const prompt = promptById.get(record.promptRecordId);
  assert.ok(prompt, `${record.id} has no public direction record`);
  assert.equal(prompt.assetPath, record.path);
  assert.equal(prompt.promptSha256, record.promptSha256);
  assert.equal(bytes.length, record.bytes);
  assert.equal(sha256(bytes), record.sha256);
  assert.deepEqual(pngDimensions(bytes), record.dimensions);
  assert.equal(record.colorSpace, 'sRGB');
  assert.equal(record.alphaPolicy, 'opaque');
  assert.equal(record.maturity.productionAsset, false);
  for (const source of record.sourceReferences) {
    assert.equal(source.path.startsWith('/'), false);
    assert.equal(source.path.includes('\\'), false);
    assert.equal(sha256(readFileSync(`${repositoryRoot}${source.path}`)), source.sha256, `${record.id} source hash changed`);
  }
}
for (const path of [wardenExteriorReference.path, wardenInteriorReference.path]) {
  const record = provenanceByPath.get(path);
  assert.equal(record.siteId, 'site.warden-reed');
  assert.equal(record.locationId, 'warden_reed_four_bank_visibility');
  assert.equal(record.questId, 'regional_the_fog_came_to_collect_our_outlines');
  assert.equal(record.maturity.runtimeBackdrop, false);
  assert.equal(record.maturity.runtimeIntegrated, false);
  assert.equal(record.reviewEvidence.accepted, true);
  assert.match(record.reviewEvidence.boundary, /not /i);
}
for (const publishedValue of stringLeaves({ worldPromptPacket, worldProvenance })) {
  assert.doesNotMatch(publishedValue, /(?:[A-Za-z]:\\|https?:\/\/|drive\/folders|call[_-]?id|session[_-]?id|username|e-?mail|@(?:gmail|outlook))/i);
}

const technicalReferences = ENVIRONMENT_ART_DIRECTION.acceptedTechnicalReferences;
assert.equal(technicalReferences.length, 1);
const veilTechnicalReference = technicalReferences[0];
assert.equal(veilTechnicalReference.id, 'technical_veil_coast_gloamharbor_tide_refuge');
assert.equal(veilTechnicalReference.territoryId, 'territory.veil-coast');
assert.equal(veilTechnicalReference.siteId, 'site.gloamharbor');
assert.equal(veilTechnicalReference.subjectId, 'gloamharbor_tide_refuge_precinct');
assert.equal(REGION_SPATIAL_PROFILES.some(({ id }) => id === veilTechnicalReference.territoryId), true);
assert.equal(SITE_SPATIAL_ENVELOPES.some(({ id, territoryId }) => id === veilTechnicalReference.siteId && territoryId === veilTechnicalReference.territoryId), true);
assert.equal(createHash('sha256').update(readFileSync(`${repositoryRoot}${veilTechnicalReference.imagePath}`)).digest('hex'), veilTechnicalReference.imageSha256);
assert.equal(createHash('sha256').update(readFileSync(`${repositoryRoot}${veilTechnicalReference.topologyPath}`)).digest('hex'), veilTechnicalReference.topologySha256);
assert.equal(veilTechnicalReference.status, 'approved_2d_topology_reference');
assert.equal(veilTechnicalReference.referenceScope, 'site_interior_circulation');
assert.equal(veilTechnicalReference.exactCoordinate, null);
assert.equal(veilTechnicalReference.coordinateSemantics, 'diagram_pixels_not_meters');
assert.equal(veilTechnicalReference.environmentKeyframe, false);
assert.equal(veilTechnicalReference.runtimeBackdrop, false);
assert.equal(veilTechnicalReference.runtimeIntegrated, false);
assert.equal(veilTechnicalReference.productionAsset, false);
assert.equal(veilTechnicalReference.technicalReadiness, false);
assert.ok(veilTechnicalReference.limitations.some((value) => value.includes('not GIS')));
assert.ok(veilTechnicalReference.limitations.some((value) => value.includes('gameplay')));
assert.ok(veilTechnicalReference.limitations.some((value) => value.includes('accessibility-code')));

const spatialBlockoutReferences = ENVIRONMENT_ART_DIRECTION.acceptedSpatialBlockoutReferences;
assert.equal(spatialBlockoutReferences.length, 1);
const wave02SpatialReference = spatialBlockoutReferences[0];
assert.equal(wave02SpatialReference.id, 'technical_world_spatial_wave_02_v9');
assert.equal(wave02SpatialReference.status, 'approved_noncanonical_blockout_reference');
assert.equal(wave02SpatialReference.referenceScope, 'six_site_executable_spatial_contract');
assert.equal(wave02SpatialReference.coordinateSemantics, 'site_local_fictional_meters_not_atlas_coordinates');
assert.equal(wave02SpatialReference.canonical, false);
assert.equal(wave02SpatialReference.atlasExportEligible, false);
assert.equal(wave02SpatialReference.exactPlacementClaim, false);
assert.equal(wave02SpatialReference.runtimeIntegrated, false);
assert.equal(wave02SpatialReference.productionGeometry, false);
assert.equal(wave02SpatialReference.productionAsset, false);
assert.equal(wave02SpatialReference.releaseReady, false);
assert.equal(wave02SpatialReference.constructionReady, false);
assert.deepEqual(wave02SpatialReference.reviewedRepairEvidence, {
  sourceStationContacts: '132/144',
  acceptedStationContacts: '144/144',
  repairedSystems: 10,
  repairedTransitions: 12,
  changedPolygonRoots: 24,
  changedPrimitiveLeaves: 80,
  outsideAllowlistChanges: 0,
});
assert.ok(wave02SpatialReference.limitations.some((value) => value.includes('not canonical atlas placement')));
assert.ok(wave02SpatialReference.limitations.some((value) => value.includes('runtime navigation')));
assert.ok(wave02SpatialReference.limitations.some((value) => value.includes('structural')));
assert.doesNotMatch(worldSpatialModuleSource, /^import .*world-spatial-wave-02-v9\.annex\.json/m, 'The 49 MB annex must remain an on-demand asset rather than a default runtime import');

const wave02AnnexBytes = readFileSync(`${repositoryRoot}${wave02SpatialReference.path}`);
assert.equal(wave02AnnexBytes.length, 49_416_945);
assert.equal(createHash('sha256').update(wave02AnnexBytes).digest('hex'), wave02SpatialReference.sha256);
assert.doesNotMatch(wave02AnnexBytes.toString('utf8'), /["']work[\\/]/i, 'Published annex must not expose an unpublished workspace locator');
const wave02Annex = JSON.parse(wave02AnnexBytes.toString('utf8'));
assert.equal(wave02Annex.schema, 'SableReachWorldSpatialWave02V8Annex', 'v9 is a surgical successor and must not relabel the frozen v8 schema');
assert.equal(wave02Annex.authorSelfApproval, false);
assert.equal(wave02Annex.integrationAuthorized, false);
assert.equal(wave02Annex.releaseReady, false);
assert.equal(wave02Annex.constructionReady, false);
assert.match(wave02Annex.candidateStatus, /PENDING_TWO_NEW_INDEPENDENT_REVIEWS/, 'Source-authored predecessor status must remain intact in the locator-redacted derivative; later review disposition belongs to the sidecar');
assert.equal(redactedJsonPointers.length, 39);
for (const pointer of redactedJsonPointers) assert.equal(valueAtPointer(wave02Annex, pointer), undefined, `${pointer} must be absent from the published derivative`);

const expectedWave02SiteIds = ['site.anchor-field', 'site.gloamharbor', 'site.pale-measure', 'site.sluice-chapel', 'site.smothered-kiln', 'site.white-meridian'];
assert.deepEqual(wave02Annex.sitePrograms.map(({ siteId }) => siteId).sort(), expectedWave02SiteIds);
assert.deepEqual([...wave02SpatialReference.siteIds].sort(), expectedWave02SiteIds);
const sumWave02 = (select) => wave02Annex.sitePrograms.reduce((total, site) => total + select(site), 0);
const wave02Stairs = wave02Annex.sitePrograms.flatMap(({ accessibilitySystems }) => accessibilitySystems.emergencyStairRegistry);
const wave02Frames = wave02Annex.sitePrograms.flatMap(({ frames }) => frames);
const wave02Counts = {
  frames: sumWave02(({ frames }) => frames.length),
  structures: sumWave02(({ structures }) => structures.length),
  rooms: sumWave02(({ structures }) => structures.reduce((total, structure) => total + structure.rooms.length, 0)),
  habitats: sumWave02(({ habitats }) => habitats.length),
  hazards: sumWave02(({ hazards }) => hazards.length),
  utilityNetworks: sumWave02(({ utilityNetworks }) => utilityNetworks.length),
  utilityNodes: sumWave02(({ utilityNetworks }) => utilityNetworks.reduce((total, network) => total + network.nodes.length, 0)),
  utilityEdges: sumWave02(({ utilityNetworks }) => utilityNetworks.reduce((total, network) => total + network.edges.length, 0)),
  serviceProfiles: sumWave02(({ serviceProfiles }) => serviceProfiles.length),
  roles: sumWave02(({ operations }) => operations.roles.length),
  operatingTasks: sumWave02(({ operations }) => operations.tasks.length),
  spatialDomains: sumWave02(({ geometry }) => geometry.domains.length),
  spatialNodes: sumWave02(({ geometry }) => geometry.nodes.length),
  spatialRoutes: sumWave02(({ geometry }) => geometry.routes.length),
  safeCells: sumWave02(({ geometry }) => geometry.safeCells.length),
  stateGates: sumWave02(({ geometry }) => geometry.stateGates.length),
  thresholds: sumWave02(({ geometry }) => geometry.thresholds.length),
  verticalAccessSystems: sumWave02(({ accessibilitySystems }) => accessibilitySystems.verticalAccessSystems.length),
  emergencyStairs: wave02Stairs.length,
  emergencyStairFlights: wave02Stairs.reduce((total, stair) => total + stair.flights.length, 0),
  emergencyStairTreads: wave02Stairs.reduce((total, stair) => total + stair.flights.reduce((flightTotal, flight) => flightTotal + flight.treads.length, 0), 0),
  emergencyStairSupports: sumWave02(({ accessibilitySystems }) => accessibilitySystems.emergencyStairSupportRegistry.length),
  landingPlatforms: sumWave02(({ accessibilitySystems }) => accessibilitySystems.landingPlatformRegistry.length),
  questCrosswalks: wave02Annex.sitePrograms.filter(({ questAuthority }) => questAuthority && Object.keys(questAuthority).length).length,
};
assert.deepEqual(wave02Counts, wave02SpatialReference.counts);
assert.equal(wave02Stairs.reduce((total, stair) => total + stair.stationLandings.length, 0), 144);
assert.ok(wave02Stairs.every(({ reachesEveryStation }) => reachesEveryStation === true));
assert.ok(wave02Frames.every(({ atlasExportEligible, originGlobalCoordinate }) => atlasExportEligible === false && originGlobalCoordinate === null));

const wave02Provenance = JSON.parse(readFileSync(`${repositoryRoot}${wave02SpatialReference.provenancePath}`, 'utf8'));
assert.equal(wave02Provenance.schema, 'SableReachPublishedSpatialProvenanceV1');
assert.equal(wave02Provenance.records.length, 1);
const wave02ProvenanceRecord = wave02Provenance.records[0];
assert.equal(wave02ProvenanceRecord.path, wave02SpatialReference.path);
assert.equal(wave02ProvenanceRecord.bytes, wave02AnnexBytes.length);
assert.equal(wave02ProvenanceRecord.sha256, wave02SpatialReference.sha256);
assert.deepEqual(wave02ProvenanceRecord.reviewEvidence, {
  scope: 'source payload before locator-only public redaction',
  authorFreezeSha256: 'af0c6479b8f4d8b187c77425d41a79cafd0d95652fe5d285693511a6344c74f8',
  repairDeltaSha256: 'b5e99a1b29912d690c2e6cb3cd0b6a5cac08818ec7b2acc9eff429515852b71a',
  reviewAManifestSha256: '37006d37fbda1947f4f102086fed908c41476a1e6f72cd4c4926cae26b4b3b44',
  reviewBManifestSha256: 'df6dd053f50e75946022c76fdc9d69374b113a3ab36b0f443fe05f992bbf3504',
  reviewMode: 'two independent read-only source reviews',
});
assert.deepEqual(wave02ProvenanceRecord.publicRedaction, {
  mode: 'remove unpublished workspace locator fields only',
  sourceSha256: 'e3b27d70df0acd90f9a40dd4fa4494fdedd3d6740f4b79c3578aadb919dd24db',
  sourceBytes: 49_420_776,
  publishedSha256: '4ddba07f2e7c74700d021421cbc20dd0ee27e9ccef730e9258fb6cfaebb3ffe4',
  publishedBytes: 49_416_945,
  removedLocatorFields: 39,
  removedJsonPointersSha256: '724355523426819b630231dbc8e00e987ae0e8bf90484f0dffce9023e3516d30',
  spatialContentChanged: false,
  reviewMode: 'independent read-only locator-delta audit',
});
assert.equal(createHash('sha256').update([...redactedJsonPointers].sort().join('\n')).digest('hex'), wave02ProvenanceRecord.publicRedaction.removedJsonPointersSha256);
assert.equal(wave02ProvenanceRecord.maturity.canonical, false);
assert.equal(wave02ProvenanceRecord.maturity.runtimeIntegrated, false);
assert.equal(wave02ProvenanceRecord.maturity.productionGeometry, false);
assert.equal(wave02ProvenanceRecord.maturity.constructionReady, false);

const publishedSurface = JSON.stringify(WORLD_SPATIAL_FOUNDATION);
assert.doesNotMatch(publishedSurface, /(?:[A-Za-z]:\\|https?:\/\/|drive\/folders|call[_-]?id|session[_-]?id|username|e-?mail|@(?:gmail|outlook))/i);
assert.match(publishedSurface, /provisional_placement/);
assert.match(publishedSurface, /fictional_modeled_not_measured/);

const missingQuestResult = validateWorldSpatialFoundation({ questEnvironments: QUEST_ENVIRONMENT_REQUIREMENTS.slice(1) });
assert.equal(missingQuestResult.valid, false);
assert.ok(missingQuestResult.errors.some(({ code }) => code === 'quest_set_mismatch'));

const preciseQuestResult = validateWorldSpatialFoundation({
  questEnvironments: QUEST_ENVIRONMENT_REQUIREMENTS.map((requirement, index) => index === 0
    ? { ...requirement, exactAtlasCoordinate: [6400, 8320, 184] }
    : requirement),
});
assert.equal(preciseQuestResult.valid, false);
assert.ok(preciseQuestResult.errors.some(({ code }) => code === 'false_precision'));

const brokenTypologyResult = validateWorldSpatialFoundation({
  buildingTypologies: BUILDING_TYPOLOGIES.map((typology, index) => index === 0
    ? { ...typology, roomGraph: { ...typology.roomGraph, edges: [{ ...typology.roomGraph.edges[0], to: 'missing_room' }, ...typology.roomGraph.edges.slice(1)] } }
    : typology),
});
assert.equal(brokenTypologyResult.valid, false);
assert.ok(brokenTypologyResult.errors.some(({ code }) => code === 'dangling_room_edge'));

const missingCreatureHabitatResult = validateWorldSpatialFoundation({ expansionHabitats: EXPANSION_CREATURE_HABITAT_ENVELOPES.slice(1) });
assert.equal(missingCreatureHabitatResult.valid, false);
assert.ok(missingCreatureHabitatResult.errors.some(({ code }) => code === 'expansion_creature_set_mismatch'));

console.log(JSON.stringify({ valid: true, stats: validation.stats }, null, 2));
