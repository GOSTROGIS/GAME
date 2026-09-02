import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { BESTIARY, ENEMY_FAMILIES } from '../packages/content/src/bestiary.data.js';
import { EXPANSION_CREATURES, EXPANSION_QUESTS } from '../packages/content/src/narrative.data.js';
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
const ids = (records, field = 'id') => new Set(records.map((record) => record[field]));
const equalSets = (left, right) => left.size === right.size && [...left].every((value) => right.has(value));

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
assert.equal(visualReferences.length, 6);
for (const reference of visualReferences) {
  const bytes = readFileSync(`${repositoryRoot}${reference.path}`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), reference.sha256, `${reference.id} hash changed`);
  assert.equal(reference.status, 'approved_direction');
}
const gravenReference = visualReferences.find(({ id }) => id === 'concept_graven_march_black_pine_occlusion_basin');
const cathedralReference = visualReferences.find(({ id }) => id === 'concept_cathedral_six_rehearsed_dawns');
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
