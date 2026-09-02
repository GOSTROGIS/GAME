import assert from 'node:assert/strict';

import { BESTIARY } from '../packages/content/src/bestiary.data.js';
import { CHARACTERS } from '../src/data/characters.js';
import { COMPANION_AGENCY_CONTRACTS, COMPANION_QUEST_CONTRACTS, EXPANSION_CHARACTERS, EXPANSION_CREATURES, EXPANSION_ITEMS, EXPANSION_QUESTS, NARRATIVE_TARGETS, QUEST_ACTOR_CONTRACTS } from '../packages/content/src/narrative.data.js';
import {
  ART_INDEX,
  CONCEPT_ART,
  artFor,
  coverage,
  url,
} from '../design-review/kit/hm-concept-art.js';
import { buildRegistry, tally } from '../design-review/kit/hm-model-registry.js';
import { WORLD_SPATIAL_BLOCKOUT_ASSETS } from '../src/data/worldAssets.js';

const toViewId = (prefix, id) => `${prefix}.${id.replaceAll('_', '-')}`;

assert.equal(ART_INDEX.schema, 'SableReachArtIndexV1');
assert.equal(url('assets/characters/example.png'), '../assets/characters/example.png');
assert.equal(url('https://example.test/art.png'), null);
assert.equal(url('//example.test/art.png'), null);
assert.equal(url('../assets/characters/example.png'), null);

const firstOrigin = ART_INDEX.playableOrigins[0];
const originArt = artFor(toViewId('origin', firstOrigin.id), 320, 2);
assert.equal(originArt.has, true);
assert.equal(originArt.kind, 'concept cutout');
assert.equal(originArt.src, originArt.cutoutSrc);
assert.ok(originArt.masterPath.startsWith('assets/'));
assert.ok(originArt.cutoutPath.startsWith('assets/'));
assert.equal('driveId' in originArt, false);

const namedIds = CHARACTERS.map(({ id }) => toViewId('npc', id));
const namedCoverage = coverage(namedIds);
const indexedNamedMasters = ART_INDEX.namedCharacters.filter(({ conceptMaster }) => conceptMaster).length;
const indexedNamedCutouts = ART_INDEX.namedCharacters.filter(({ transparentCutout }) => transparentCutout).length;
assert.equal(namedCoverage.total, 42);
assert.equal(namedCoverage.master, indexedNamedMasters);
assert.equal(namedCoverage.cutout, indexedNamedCutouts);
assert.equal(namedCoverage.unregistered, 42 - ART_INDEX.namedCharacters.length);

for (const [id, row] of Object.entries(CONCEPT_ART)) {
  assert.equal(JSON.stringify(row).includes('google'), false, `${id} contains provider behavior`);
  for (const src of [row.masterSrc, row.cutoutSrc, row.plateSrc].filter(Boolean)) {
    assert.ok(src.startsWith('../assets/'), `${id} resolves outside repository assets: ${src}`);
  }
}

const registry = buildRegistry();
const counts = tally(registry);
const acceptedExpansionMasters = new Map([
  ['mother_nacre_open_rib', '../assets/characters/npcs/charnel-princes/mother-nacre-open-rib-v1.png'],
  ['prince_thirteen_throats', '../assets/characters/npcs/charnel-princes/prince-thirteen-throats-v1.png'],
  ['wound_scribe_keth', '../assets/characters/npcs/charnel-princes/wound-scribe-keth-v1.png'],
  ['maw_behind_mercy', '../assets/characters/npcs/charnel-princes/maw-behind-mercy-v1.png'],
  ['door_lung_courser', '../assets/bestiary/forms/charnel-households/door-lung-courser-v1.png'],
  ['reverse_rib_bride', '../assets/bestiary/forms/charnel-households/reverse-rib-bride-v1.png'],
  ['arch_lumen_seraphel_orr', '../assets/characters/npcs/lucent-synod/arch-lumen-seraphel-orr-v1.png'],
  ['canoness_vael_kindly_knife', '../assets/characters/npcs/lucent-synod/canoness-vael-kindly-knife-v2.png'],
  ['deacon_halix_bell_of_noon', '../assets/characters/npcs/lucent-synod/deacon-halix-bell-of-noon-v2.png'],
  ['saint_vespera_second_shadow', '../assets/characters/npcs/lucent-synod/saint-vespera-second-shadow-v3.png'],
  ['apse_seraph', '../assets/bestiary/forms/lucent-procession/apse-seraph-v2.png'],
  ['misericord_of_borrowed_pain', '../assets/bestiary/forms/lucent-procession/misericord-of-borrowed-pain-v1.png'],
  ['noon_bailiff', '../assets/bestiary/forms/lucent-procession/noon-bailiff-v2.png'],
  ['unbroken_note_engine', '../assets/bestiary/forms/lucent-procession/unbroken-note-engine-v3.png'],
  ['reliquary_of_the_last_breath', '../assets/bestiary/forms/lucent-procession/reliquary-of-the-last-breath-v1.png'],
  ['gold_shutter_penitent', '../assets/bestiary/forms/lucent-procession/gold-shutter-penitent-v2.png'],
  ['enoch_last_lamplighter', '../assets/characters/npcs/remaining-hands/enoch-last-lamplighter-v1.png'],
  ['sister_calve_unlit_hospice', '../assets/characters/npcs/remaining-hands/sister-calve-unlit-hospice-v1.png'],
  ['tor_vannic_defector_of_dawn', '../assets/characters/npcs/remaining-hands/tor-vannic-defector-of-dawn-v1.png'],
  ['king_ash_without_country', '../assets/characters/npcs/remaining-hands/king-ash-without-country-v1.png'],
  ['nima_sorn_keeper_of_one_shadow', '../assets/characters/npcs/remaining-hands/nima-sorn-keeper-of-one-shadow-v1.png'],
  ['oren_lusk_last_calendarer', '../assets/characters/npcs/remaining-hands/oren-lusk-last-calendarer-v1.png'],
  ['mara_quoin_counter_deed', '../assets/characters/npcs/remaining-hands/mara-quoin-counter-deed-v1.png'],
  ['kessa_pale_absence_clerk', '../assets/characters/npcs/remaining-hands/kessa-pale-absence-clerk-v1.png'],
  ['hobb_marr_shade_driver', '../assets/characters/npcs/remaining-hands/hobb-marr-shade-driver-v1.png'],
  ['gannet_triune_veto_clerk', '../assets/characters/npcs/remaining-hands/gannet-triune-veto-clerk-v1.png'],
  ['jorem_mortality_bearer', '../assets/characters/npcs/remaining-hands/jorem-mortality-bearer-v1.png'],
  ['della_quorum_unseated_cost', '../assets/characters/npcs/remaining-hands/della-quorum-unseated-cost-v1.png'],
  ['ilar_rook_unhoused_shadow', '../assets/characters/npcs/charnel-households/ilar-rook-unhoused-shadow-v1.png'],
  ['ilyen_doorborn_outer_age', '../assets/characters/npcs/charnel-households/ilyen-doorborn-outer-age-v1.png'],
  ['throat_orchard', '../assets/bestiary/forms/charnel-households/throat-orchard-v1.png'],
  ['jointless_advocate', '../assets/bestiary/forms/charnel-households/jointless-advocate-v1.png'],
  ['mercy_eater', '../assets/bestiary/forms/charnel-households/mercy-eater-v1.png'],
  ['corridor_maw', '../assets/bestiary/forms/charnel-households/corridor-maw-v1.png'],
  ['tima_vale_twice_born', '../assets/characters/npcs/charnel-households/tima-vale-twice-born-v1.png'],
  ['parn_exit_law', '../assets/characters/npcs/charnel-households/parn-exit-law-v1.png'],
  ['orra_rain_in_ribs', '../assets/characters/npcs/charnel-households/orra-rain-in-ribs-v1.png'],
  ['pell_nacreyear_road_witness', '../assets/characters/npcs/remaining-hands/pell-nacreyear-road-witness-v1.png'],
  ['threshold_lamb', '../assets/bestiary/forms/charnel-households/threshold-lamb-v1.png'],
  ['eave_lung', '../assets/bestiary/forms/charnel-weather/eave-lung-v1.png'],
]);
assert.equal(registry.bestiary.length, 178);
assert.equal(registry.namedCast.length, 42);
assert.equal(registry.origins.length, 8);
assert.equal(registry.expansionCharacters.length, EXPANSION_CHARACTERS.length);
assert.equal(registry.expansionCreatures.length, EXPANSION_CREATURES.length);
assert.equal(registry.expansionCharacters.length, 70);
assert.equal(registry.expansionCreatures.length, 39);
assert.equal(registry.environments.length, 2);
assert.deepEqual(registry.companionContracts, COMPANION_QUEST_CONTRACTS);
assert.deepEqual(registry.agencyContracts, COMPANION_AGENCY_CONTRACTS);
assert.deepEqual(registry.actorContracts, QUEST_ACTOR_CONTRACTS);
assert.equal(counts.total, 228);
assert.equal(counts.foundingTotal, 228);
assert.equal(counts.grandTotal, 337);
assert.equal(counts.environments, 2);
assert.equal(counts.spatialBlockouts, 2);
assert.equal(counts.expansionItems, 67);
assert.equal(counts.expansionQuests, 49);
assert.equal(counts.companionContracts, 4);
assert.equal(counts.agencyContracts, 2);
assert.equal(counts.actorContracts, 6);
assert.equal(counts.expansionItems, EXPANSION_ITEMS.length);
assert.equal(counts.expansionQuests, EXPANSION_QUESTS.length);
assert.equal(counts.authoredQuestTarget, NARRATIVE_TARGETS.authoredQuestTarget);
assert.equal(registry.sculpted.length, 4);
assert.equal(registry.queuedBestiary.length, 174);

const subjectRows = [...registry.bestiary, ...registry.namedCast, ...registry.origins, ...registry.expansionCharacters, ...registry.expansionCreatures];
assert.equal(subjectRows.length, counts.grandTotal, 'Environment references must not alter the 337-subject total');
const wardenEnvironment = registry.environments.find(({ id }) => id === 'environment.warden-reed-four-bank-visibility');
assert.ok(wardenEnvironment);
assert.equal(wardenEnvironment.id, 'environment.warden-reed-four-bank-visibility');
assert.equal(wardenEnvironment.contentId, 'warden_reed_four_bank_visibility');
assert.equal(wardenEnvironment.siteId, 'site.warden-reed');
assert.equal(wardenEnvironment.locationId, 'warden_reed_four_bank_visibility');
assert.equal(wardenEnvironment.questId, 'regional_the_fog_came_to_collect_our_outlines');
assert.equal(wardenEnvironment.routeId, null);
assert.deepEqual(wardenEnvironment.landmarkIds, []);
assert.equal(wardenEnvironment.staticScene, null);
assert.equal(wardenEnvironment.staticSceneStatus, 'awaiting-model');
assert.equal(wardenEnvironment.animatedScene, null);
assert.equal(wardenEnvironment.animatedSceneStatus, 'unassessed');
assert.deepEqual(wardenEnvironment.motionSystems, [
  'fog_density_bands',
  'ferry_positions',
  'guide_lanterns',
  'high_rope_return',
  'water_surface',
]);
assert.equal(wardenEnvironment.runtimeBackdrop, false);
assert.equal(wardenEnvironment.runtimeIntegrated, false);
assert.equal(wardenEnvironment.productionAsset, false);
assert.ok(wardenEnvironment.limitations.some((line) => /Not GIS, construction, structural, collision, navigation, or production-geometry authority/.test(line)));
assert.deepEqual(wardenEnvironment.exteriorConcept, {
  id: 'concept_warden_reed_four_bank_visibility_exterior',
  path: 'assets/world/warden-reed-four-bank-visibility-exterior-v1.png',
  src: '../assets/world/warden-reed-four-bank-visibility-exterior-v1.png',
  sha256: '52d94e5252c7f4935772daaa970b58668ea82746491a969d0cad616403eaf17e',
  bytes: 2709612,
  dimensions: { width: 1536, height: 1024 },
  colorSpace: 'sRGB',
  alphaPolicy: 'opaque',
  referenceScope: 'quest_location_exterior',
  approvalStatus: 'approved_direction',
  maturity: 'approved_environment_direction_not_runtime_or_production',
  runtimeBackdrop: false,
  runtimeIntegrated: false,
  productionAsset: false,
});
assert.deepEqual(wardenEnvironment.interiorConcept, {
  id: 'concept_warden_reed_stilt_service_house_interior',
  path: 'assets/world/warden-reed-stilt-service-house-interior-v1.png',
  src: '../assets/world/warden-reed-stilt-service-house-interior-v1.png',
  sha256: '5494c36be429b7a76b2f2857059cce8a28a495fa23bc27a2e405adf950037089',
  bytes: 2729693,
  dimensions: { width: 1536, height: 1024 },
  colorSpace: 'sRGB',
  alphaPolicy: 'opaque',
  referenceScope: 'quest_location_interior',
  approvalStatus: 'approved_direction',
  maturity: 'approved_environment_direction_not_runtime_or_production',
  runtimeBackdrop: false,
  runtimeIntegrated: false,
  productionAsset: false,
});
assert.equal(wardenEnvironment.exteriorSrc, wardenEnvironment.exteriorConcept.src);
assert.equal(wardenEnvironment.interiorSrc, wardenEnvironment.interiorConcept.src);
assert.equal(Object.isFrozen(wardenEnvironment.concepts), true);
assert.equal(wardenEnvironment.concepts.length, 2);
assert.equal(wardenEnvironment.concepts[0], wardenEnvironment.exteriorConcept);
assert.equal(wardenEnvironment.concepts[1], wardenEnvironment.interiorConcept);
assert.equal(/^https?:/i.test(wardenEnvironment.exteriorSrc), false);
assert.equal(/^https?:/i.test(wardenEnvironment.interiorSrc), false);
assert.equal(Object.isFrozen(wardenEnvironment.blockoutReferences), true);
assert.equal(wardenEnvironment.blockoutReferences.length, 1);
assert.equal(wardenEnvironment.blockoutReferences[0].id, 'spatial_blockout.wave-03a.warden-reed');
assert.equal(wardenEnvironment.blockoutReferences[0].schemaVersion, 1);
assert.equal(wardenEnvironment.blockoutReferences[0].payloadSrc, '../assets/world/spatial/wave-03a/warden-reed.site.json');
assert.equal(wardenEnvironment.blockoutReferences[0].runtimeIntegrated, false);
assert.equal(wardenEnvironment.blockoutReferences[0].staticScene, false);
assert.equal(wardenEnvironment.blockoutReferences[0].animatedScene, false);

const hollowEnvironment = registry.environments.find(({ id }) => id === 'environment.hollow-abbey-processional-and-mute-nave');
assert.ok(hollowEnvironment);
assert.equal(hollowEnvironment.contentId, 'hollow_abbey_processional_and_mute_nave');
assert.equal(hollowEnvironment.siteId, 'site.hollow-abbey');
assert.equal(hollowEnvironment.routeId, 'route.processional-steps');
assert.equal(hollowEnvironment.locationId, 'hollow_abbey_processional_and_mute_nave');
assert.equal(hollowEnvironment.questId, 'main_a_litany_unspoken');
assert.deepEqual(hollowEnvironment.landmarkIds, ['abbey_gate', 'mute_nave', 'last_bell_crypt']);
assert.equal(hollowEnvironment.staticScene, null);
assert.equal(hollowEnvironment.staticSceneStatus, 'awaiting-model');
assert.equal(hollowEnvironment.animatedScene, null);
assert.equal(hollowEnvironment.animatedSceneStatus, 'unassessed');
assert.deepEqual(hollowEnvironment.motionSystems, [
  'roof_rain_now',
  'delayed_rain_returns',
  'eclipse_light_shafts',
  'urn_resonance_fields',
  'silence_pressure_zones',
  'upper_cloister_route_state',
]);
assert.equal(hollowEnvironment.runtimeBackdrop, false);
assert.equal(hollowEnvironment.runtimeIntegrated, false);
assert.equal(hollowEnvironment.productionAsset, false);
assert.ok(hollowEnvironment.limitations.some((line) => /Not GIS, construction, structural, collision, navigation, or production-geometry authority/.test(line)));
assert.deepEqual(hollowEnvironment.exteriorConcept, {
  id: 'concept_hollow_abbey_processional_west_arrival',
  path: 'assets/world/hollow-abbey-processional-west-arrival-v1.png',
  src: '../assets/world/hollow-abbey-processional-west-arrival-v1.png',
  sha256: 'e10cf6c4e1469d23f49f0fc38ebb49d0dad51f490b1f8bf23c1c2e82ced72e29',
  bytes: 2762634,
  dimensions: { width: 1536, height: 1024 },
  colorSpace: 'sRGB',
  alphaPolicy: 'opaque',
  referenceScope: 'site_arrival_exterior',
  approvalStatus: 'approved_direction',
  maturity: 'approved_environment_direction_not_runtime_or_production',
  runtimeBackdrop: false,
  runtimeIntegrated: false,
  productionAsset: false,
});
assert.deepEqual(hollowEnvironment.interiorConcept, {
  id: 'concept_hollow_abbey_mute_nave_route_read',
  path: 'assets/world/hollow-abbey-mute-nave-route-read-v1.png',
  src: '../assets/world/hollow-abbey-mute-nave-route-read-v1.png',
  sha256: '2e5582779702fed33fef3ee092f109a0c39403431752f11c22bbad95b7288826',
  bytes: 2715661,
  dimensions: { width: 1536, height: 1024 },
  colorSpace: 'sRGB',
  alphaPolicy: 'opaque',
  referenceScope: 'site_interior_route_read',
  approvalStatus: 'approved_direction',
  maturity: 'approved_environment_direction_not_runtime_or_production',
  runtimeBackdrop: false,
  runtimeIntegrated: false,
  productionAsset: false,
});
assert.equal(hollowEnvironment.exteriorSrc, hollowEnvironment.exteriorConcept.src);
assert.equal(hollowEnvironment.interiorSrc, hollowEnvironment.interiorConcept.src);
assert.equal(Object.isFrozen(hollowEnvironment.concepts), true);
assert.equal(hollowEnvironment.concepts.length, 4);
assert.equal(hollowEnvironment.concepts[0], hollowEnvironment.exteriorConcept);
assert.equal(hollowEnvironment.concepts[1], hollowEnvironment.interiorConcept);
assert.deepEqual(hollowEnvironment.concepts[2], {
  id: 'concept_hollow_abbey_rain_court_work_nexus',
  path: 'assets/world/hollow-abbey-rain-court-work-nexus-v1.png',
  src: '../assets/world/hollow-abbey-rain-court-work-nexus-v1.png',
  sha256: 'a5e5ae1dfe2ec15a7f17f649356404f4f276ba8db89bcdd07bc2273cd555b074',
  bytes: 3200004,
  dimensions: { width: 1536, height: 1024 },
  colorSpace: 'sRGB',
  alphaPolicy: 'opaque',
  referenceScope: 'site_court_work_nexus',
  approvalStatus: 'approved_direction',
  maturity: 'approved_environment_direction_not_runtime_or_production',
  runtimeBackdrop: false,
  runtimeIntegrated: false,
  productionAsset: false,
});
assert.deepEqual(hollowEnvironment.concepts[3], {
  id: 'concept_hollow_abbey_foundry_operational_chain',
  path: 'assets/world/hollow-abbey-foundry-operational-chain-v1.png',
  src: '../assets/world/hollow-abbey-foundry-operational-chain-v1.png',
  sha256: 'a4b6c7ee808befc1ac6b1adfefa1a801c4e5d5fe48e71e42e1820c789a48b1bc',
  bytes: 2656904,
  dimensions: { width: 1536, height: 1024 },
  colorSpace: 'sRGB',
  alphaPolicy: 'opaque',
  referenceScope: 'site_foundry_operational_interior',
  approvalStatus: 'approved_direction',
  maturity: 'approved_environment_direction_not_runtime_or_production',
  runtimeBackdrop: false,
  runtimeIntegrated: false,
  productionAsset: false,
});
assert.equal(/^https?:/i.test(hollowEnvironment.exteriorSrc), false);
assert.equal(/^https?:/i.test(hollowEnvironment.interiorSrc), false);
assert.equal(/^https?:/i.test(hollowEnvironment.concepts[2].src), false);
assert.equal(/^https?:/i.test(hollowEnvironment.concepts[3].src), false);
assert.equal(hollowEnvironment.staticScene, null);
assert.equal(hollowEnvironment.staticSceneStatus, 'awaiting-model');
assert.equal(hollowEnvironment.animatedScene, null);
assert.equal(hollowEnvironment.animatedSceneStatus, 'unassessed');
assert.equal(Object.isFrozen(hollowEnvironment.blockoutReferences), true);
assert.equal(hollowEnvironment.blockoutReferences.length, 1);
assert.equal(hollowEnvironment.blockoutReferences[0].id, 'spatial_blockout.wave-03b.hollow-abbey');
assert.equal(hollowEnvironment.blockoutReferences[0].schemaVersion, 2);
assert.equal(hollowEnvironment.blockoutReferences[0].payloadSrc, '../assets/world/spatial/wave-03b/hollow-abbey.site.json');
assert.equal(hollowEnvironment.blockoutReferences[0].runtimeIntegrated, false);
assert.equal(hollowEnvironment.blockoutReferences[0].constructionReady, false);
assert.equal(hollowEnvironment.blockoutReferences[0].productionGeometry, false);

const environmentBoundSpatialIds = WORLD_SPATIAL_BLOCKOUT_ASSETS
  .filter(({ environmentIds }) => environmentIds.length)
  .map(({ id }) => id)
  .sort();
assert.deepEqual(registry.environments.flatMap(({ blockoutReferences }) => blockoutReferences.map(({ id }) => id)).sort(), environmentBoundSpatialIds);

const expansionRows = [...registry.expansionCharacters, ...registry.expansionCreatures];
for (const [contentId, masterSrc] of acceptedExpansionMasters) {
  const row = expansionRows.find((candidate) => candidate.contentId === contentId);
  assert.ok(row, `${contentId} is missing from the MODEL MAKER registry`);
  assert.equal(row.masterSrc, masterSrc);
  assert.equal(row.plate, masterSrc);
  assert.equal(row.cutoutSrc, null);
  assert.equal(row.staticModel, null);
  assert.equal(row.animatedModel, null);
  assert.equal(row.artStatus, 'accepted');
  assert.equal(row.staticModelStatus, 'unassessed');
  assert.equal(row.animatedModelStatus, 'unassessed');
  assert.equal(row.tier, 'queued');
}

const bestiaryIds = new Set(registry.bestiary.map(({ contentId }) => contentId));
assert.deepEqual(bestiaryIds, new Set(BESTIARY.map(({ id }) => id)));
assert.equal(new Set(registry.bestiary.map(({ id }) => id)).size, 178);
assert.equal(new Set(registry.namedCast.map(({ id }) => id)).size, 42);
assert.equal(new Set(registry.origins.map(({ id }) => id)).size, 8);
assert.equal(new Set(registry.expansionCharacters.map(({ id }) => id)).size, EXPANSION_CHARACTERS.length);

for (const row of registry.expansionCharacters) {
  assert.ok(row.contradiction);
  assert.ok(['awaiting-art', 'queued', 'static-model', 'animated-model'].includes(row.tier));
  assert.equal(/^https?:/i.test(row.plate || ''), false);
  assert.ok(Object.hasOwn(row, 'staticModel'));
  assert.ok(Object.hasOwn(row, 'animatedModel'));
}

const missingVisualBriefIds = new Set([
  'leto_fain_custodian_unclaimed_symptoms',
  'senn_avir_residue_orderly',
]);
const missingVisualBriefRows = registry.expansionCharacters.filter(({ contentId }) => missingVisualBriefIds.has(contentId));
assert.equal(missingVisualBriefRows.length, 2);
for (const row of registry.expansionCharacters) {
  if (missingVisualBriefIds.has(row.contentId)) {
    assert.equal(row.visualBrief, null);
    assert.equal(row.visualBriefStatus, 'not-authored');
    assert.equal(row.conceptGenerationBlocked, true);
    assert.match(row.conceptGenerationBlocker, /No canonical visual brief is authored/);
    assert.match(row.reason, /Concept generation is blocked/);
  } else {
    assert.ok(row.visualBrief);
    assert.equal(row.visualBriefStatus, 'authored');
    assert.equal(row.conceptGenerationBlocked, false);
    assert.equal(row.conceptGenerationBlocker, null);
  }
}

assert.ok(registry.companionContracts.every(({ schemaVersion, mode }) => schemaVersion === 1 && ['autonomous_guest', 'autonomous_follower'].includes(mode)));
assert.ok(registry.agencyContracts.every(({ schemaVersion, mode }) => schemaVersion === 4 && mode === undefined));
assert.equal(new Set(registry.actorContracts.map(({ questId, companionId }) => `${questId}|${companionId}`)).size, 6);

for (const row of registry.expansionCreatures) {
  assert.ok(row.mechanic?.cue);
  assert.ok(row.mechanic?.counterplay);
  assert.ok(row.narrativeUse);
  assert.ok(row.visualBrief);
  assert.ok(['awaiting-art', 'queued', 'static-model', 'animated-model'].includes(row.tier));
  assert.equal(/^https?:/i.test(row.plate || ''), false);
}

const bestiaryTiers = new Set(['sculpted', 'awaiting-art', 'queued', 'refused', 'unassessed']);
for (const row of registry.bestiary) {
  assert.ok(bestiaryTiers.has(row.tier), `${row.id} has unexpected tier ${row.tier}`);
  assert.ok(row.familyId);
  assert.ok(row.rank);
  assert.equal(/^https?:/i.test(row.plate || ''), false);
}

assert.equal(
  counts.sculpted + counts.awaitingArt + counts.queued + counts.refused + counts.unassessed,
  178,
);

console.log(JSON.stringify({ valid: true, counts, indexedRows: Object.keys(CONCEPT_ART).length }, null, 2));
