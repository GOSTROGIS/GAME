/* =========================================================================
   hm-model-registry.js — canonical MODEL MAKER subject registry
   -------------------------------------------------------------------------
   Bestiary and named-cast identity comes from the game data modules. Art
   comes only from assets/art-index.json through hm-concept-art.js. The old
   compatibility arrays remain available, but `bestiary` is the complete
   178-form collection and is the selector's primary source.
   ========================================================================= */

import { BESTIARY, ENEMY_FAMILIES } from '../../packages/content/src/bestiary.data.js';
import {
  COMPANION_AGENCY_CONTRACTS,
  COMPANION_QUEST_CONTRACTS,
  COSMIC_FACTIONS,
  EXPANSION_CHARACTERS,
  EXPANSION_CREATURES,
  EXPANSION_ITEMS,
  EXPANSION_QUESTS,
  NARRATIVE_TARGETS,
  QUEST_ACTOR_CONTRACTS,
} from '../../packages/content/src/narrative.data.js';
import { CHARACTERS, FACTIONS } from '../../src/data/characters.js';
import { WORLD_CONCEPT_ASSETS, WORLD_SPATIAL_BLOCKOUT_ASSETS } from '../../src/data/worldAssets.js';
import { artFor, url } from './hm-concept-art.js';
import { FAMILY_LAW, CHASSIS_STATUS } from './hm-art-law.js';

export const SCULPTED = Object.freeze([
  { id: 'enemy.ash-husk', name: 'Ash Husk', family: 'Ashbound', module: './ash-husk-model.js', buildFn: 'buildAshHusk', depth: 'Full depth: eleven section generators, 22 spring bones, a 96×72 sculpted face, ten audited layer pairs.' },
  { id: 'enemy.cinder-mourner', name: 'Cinder Mourner', family: 'Ashbound', module: './cinder-mourner-model.js', buildFn: 'build', depth: 'Lighter depth: one outer garment, paddle hands, void head — see the file header for what that omits and why.' },
  { id: 'enemy.wicket-eater', name: 'Wicket Eater', family: 'Ashbound', module: './wicket-eater-model.js', buildFn: 'build', depth: 'Lighter depth, same tier as cinder-mourner, plus a cape-over-coat layer audit.' },
  { id: 'enemy.smoke-notary', name: 'Smoke Notary', family: 'Ashbound', module: './smoke-notary-model.js', buildFn: 'build', depth: 'Lighter depth; its own plate defeats most of the silhouette scan (smoke, arm spread) — stated in file, not hidden.' },
]);

const sculptedById = new Map(SCULPTED.map((row) => [row.id, row]));
const familyById = new Map(ENEMY_FAMILIES.map((row) => [row.id, row]));
const factionById = new Map(FACTIONS.map((row) => [row.id, row]));
const cosmicFactionById = new Map(COSMIC_FACTIONS.map((row) => [row.id, row]));
const worldConceptById = new Map(WORLD_CONCEPT_ASSETS.map((row) => [row.id, row]));
const spatialBlockoutById = new Map(WORLD_SPATIAL_BLOCKOUT_ASSETS.map((row) => [row.id, row]));

const ENVIRONMENT_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: 'environment.warden-reed-four-bank-visibility',
    contentId: 'warden_reed_four_bank_visibility',
    name: 'Warden Reed Four-Bank Visibility',
    regionId: 'dunmire',
    siteId: 'site.warden-reed',
    locationId: 'warden_reed_four_bank_visibility',
    questId: 'regional_the_fog_came_to_collect_our_outlines',
    conceptIds: Object.freeze([
      'concept_warden_reed_four_bank_visibility_exterior',
      'concept_warden_reed_stilt_service_house_interior',
    ]),
    blockoutReferenceIds: Object.freeze(['spatial_blockout.wave-03a.warden-reed']),
    motionSystems: Object.freeze([
      'fog_density_bands',
      'ferry_positions',
      'guide_lanterns',
      'high_rope_return',
      'water_surface',
    ]),
  }),
  Object.freeze({
    id: 'environment.hollow-abbey-processional-and-mute-nave',
    contentId: 'hollow_abbey_processional_and_mute_nave',
    name: 'Hollow Abbey Processional and Mute Nave',
    regionId: 'hollow_abbey',
    siteId: 'site.hollow-abbey',
    routeId: 'route.processional-steps',
    locationId: 'hollow_abbey_processional_and_mute_nave',
    questId: 'main_a_litany_unspoken',
    landmarkIds: Object.freeze(['abbey_gate', 'mute_nave', 'last_bell_crypt']),
    conceptIds: Object.freeze([
      'concept_hollow_abbey_processional_west_arrival',
      'concept_hollow_abbey_mute_nave_route_read',
      'concept_hollow_abbey_rain_court_work_nexus',
      'concept_hollow_abbey_foundry_operational_chain',
    ]),
    blockoutReferenceIds: Object.freeze(['spatial_blockout.wave-03b.hollow-abbey']),
    motionSystems: Object.freeze([
      'roof_rain_now',
      'delayed_rain_returns',
      'eclipse_light_shafts',
      'urn_resonance_fields',
      'silence_pressure_zones',
      'upper_cloister_route_state',
    ]),
  }),
]);

// The canonical content id is `glasswood`; the older prompt-law key includes
// the family-name suffix. Keep that translation isolated and explicit.
const lawIdForFamily = (familyId) => familyId === 'glasswood' ? 'glasswood_brood' : familyId;
const viewId = (prefix, id) => `${prefix}.${String(id).replaceAll('_', '-')}`;

function artForForm(form) {
  const art = artFor(viewId('enemy', form.id));
  const familyArt = artFor(viewId('family', form.familyId));
  return {
    ...art,
    src: art.src || familyArt.src,
    plateSrc: art.plateSrc || familyArt.plateSrc || familyArt.src,
    hasIndividualArt: Boolean(art.masterPath || art.cutoutPath),
  };
}

function readiness(form, art) {
  if (sculptedById.has(viewId('enemy', form.id))) {
    return {
      tier: 'sculpted',
      reason: 'A subject-specific 3D module exists and is reviewable against its concept reference.',
    };
  }

  if (!art.hasIndividualArt) {
    return {
      tier: 'awaiting-art',
      reason: 'The family plate is available, but this individual form still lacks an indexed concept master or cutout.',
    };
  }

  const law = FAMILY_LAW[lawIdForFamily(form.familyId)];
  if (!law) {
    return {
      tier: 'unassessed',
      reason: 'Individual art exists, but no family prompt-law row assesses a compatible 3D chassis. Readiness is intentionally unclaimed.',
    };
  }

  // Four independently authored Ashbound modules establish that this family
  // can enter the modelling queue even though the generic chassis table does
  // not claim to satisfy its anatomy.
  if (form.familyId === 'ashbound') {
    return {
      tier: 'queued',
      promptAuthority: `hm-art-law:${lawIdForFamily(form.familyId)}`,
      reason: 'Individual art and prompt authority exist, and the Ashbound modelling approach is proven by subject-specific modules.',
    };
  }

  const chassis = CHASSIS_STATUS[law.chassis];
  if (chassis?.exists) {
    return {
      tier: 'queued',
      promptAuthority: `hm-art-law:${lawIdForFamily(form.familyId)}`,
      reason: `Individual art and prompt authority exist; the ${law.chassis} chassis is available.`,
    };
  }

  return {
    tier: 'refused',
    promptAuthority: `hm-art-law:${lawIdForFamily(form.familyId)}`,
    reason: `The approved prompt requires a ${law.chassis} chassis. ${chassis?.blocker || 'No compatible chassis has been assessed.'}`,
  };
}

function bestiaryList() {
  return BESTIARY.map((form) => {
    const id = viewId('enemy', form.id);
    const family = familyById.get(form.familyId);
    const art = artForForm(form);
    const status = readiness(form, art);
    const sculpted = sculptedById.get(id);
    return Object.freeze({
      id,
      contentId: form.id,
      kind: 'creature',
      name: form.name,
      family: family?.name || form.familyId,
      familyId: form.familyId,
      rank: form.rank,
      combatRole: form.combatRole,
      tier: status.tier,
      plate: art.src,
      masterSrc: art.masterSrc,
      cutoutSrc: art.cutoutSrc,
      plateSrc: art.plateSrc,
      hasIndividualArt: art.hasIndividualArt,
      reason: status.reason,
      promptAuthority: status.promptAuthority,
      ...(sculpted || {}),
    });
  });
}

function namedCastList() {
  return CHARACTERS.map((character) => {
    const id = viewId('npc', character.id);
    const art = artFor(id);
    return Object.freeze({
      id,
      contentId: character.id,
      kind: 'character',
      name: character.name,
      role: character.role,
      faction: factionById.get(character.factionId)?.name || character.factionId,
      factionId: character.factionId,
      tier: 'generic-rig',
      plate: art.src,
      masterSrc: art.masterSrc,
      cutoutSrc: art.cutoutSrc,
    });
  });
}

const ORIGIN_IDS = Object.freeze([
  'gloamfarer',
  'bell_warden',
  'mire_physicker',
  'oathless_scion',
  'grave_tithe_runner',
  'cinder_mason',
  'starved_seer',
  'thorn_poacher',
]);

function originsList() {
  return ORIGIN_IDS.map((contentId) => {
    const id = viewId('origin', contentId);
    const art = artFor(id);
    return Object.freeze({
      id,
      contentId,
      kind: 'origin',
      name: contentId.split('_').map((word) => word[0].toUpperCase() + word.slice(1)).join(' '),
      tier: 'reference',
      plate: art.src,
      masterSrc: art.masterSrc,
      cutoutSrc: art.cutoutSrc,
      reason: art.has
        ? 'Playable-origin art is indexed. No subject-specific 3D appearance contract has been approved, so this remains reference-only.'
        : 'No indexed origin art is available; 3D readiness is not assessed.',
    });
  });
}

function expansionCharacterList() {
  return EXPANSION_CHARACTERS.map((character) => {
    const pipeline = character.pipeline;
    const visualBrief = character.visualBrief ?? null;
    const visualBriefStatus = visualBrief ? 'authored' : 'not-authored';
    const conceptGenerationBlocked = visualBrief === null;
    const conceptGenerationBlocker = conceptGenerationBlocked
      ? 'No canonical visual brief is authored for this character. Concept generation is blocked until an independently reviewed brief is added; appearance must not be inferred from role, faction, or dialogue.'
      : null;
    const masterSrc = pipeline.conceptMaster ? url(pipeline.conceptMaster) : null;
    const cutoutSrc = pipeline.transparentCutout ? url(pipeline.transparentCutout) : null;
    const hasArt = Boolean(masterSrc || cutoutSrc);
    const hasStaticModel = ['ready', 'sculpted'].includes(pipeline.staticModelStatus) && Boolean(pipeline.staticModel);
    const hasAnimatedModel = ['ready', 'animated'].includes(pipeline.animatedModelStatus) && Boolean(pipeline.animatedModel);
    const tier = hasAnimatedModel ? 'animated-model'
      : hasStaticModel ? 'static-model'
        : hasArt ? 'queued'
          : 'awaiting-art';

    return Object.freeze({
      id: viewId('expansion', character.id),
      contentId: character.id,
      kind: 'expansion-character',
      name: character.name,
      epithet: character.epithet,
      role: character.role,
      faction: cosmicFactionById.get(character.factionId)?.name || character.factionId,
      factionId: character.factionId,
      family: pipeline.family,
      tier,
      plate: cutoutSrc || masterSrc,
      masterSrc,
      cutoutSrc,
      staticModel: pipeline.staticModel,
      animatedModel: pipeline.animatedModel,
      artStatus: pipeline.artStatus,
      staticModelStatus: pipeline.staticModelStatus,
      animatedModelStatus: pipeline.animatedModelStatus,
      hasIndividualArt: hasArt,
      contradiction: character.contradiction,
      visualBrief,
      visualBriefStatus,
      conceptGenerationBlocked,
      conceptGenerationBlocker,
      reason: conceptGenerationBlocked
        ? 'The canonical lore and pipeline record exists, but no visual brief is authored. Concept generation is blocked; appearance must not be inferred from role, faction, or dialogue.'
        : hasArt
          ? 'Canonical expansion concept art is linked. Static and animated readiness remain independently assessed.'
          : 'The lore record and visual brief are canonical, but no accepted concept master is linked yet.',
    });
  });
}

function expansionCreatureList() {
  return EXPANSION_CREATURES.map((entry) => {
    const pipeline = entry.pipeline;
    const masterSrc = pipeline.conceptMaster ? url(pipeline.conceptMaster) : null;
    const cutoutSrc = pipeline.transparentCutout ? url(pipeline.transparentCutout) : null;
    const hasArt = Boolean(masterSrc || cutoutSrc);
    const hasStaticModel = ['ready', 'sculpted'].includes(pipeline.staticModelStatus) && Boolean(pipeline.staticModel);
    const hasAnimatedModel = ['ready', 'animated'].includes(pipeline.animatedModelStatus) && Boolean(pipeline.animatedModel);
    const tier = hasAnimatedModel ? 'animated-model'
      : hasStaticModel ? 'static-model'
        : hasArt ? 'queued'
          : 'awaiting-art';

    return Object.freeze({
      id: viewId('expansion-creature', entry.id),
      contentId: entry.id,
      kind: 'expansion-creature',
      name: entry.name,
      family: entry.familyId,
      familyId: entry.familyId,
      faction: entry.factionAffinityIds.map((id) => cosmicFactionById.get(id)?.name || id).join(' / '),
      factionAffinityIds: entry.factionAffinityIds,
      rank: entry.rank,
      combatRole: entry.combatRole,
      tier,
      plate: cutoutSrc || masterSrc,
      masterSrc,
      cutoutSrc,
      staticModel: pipeline.staticModel,
      animatedModel: pipeline.animatedModel,
      artStatus: pipeline.artStatus,
      staticModelStatus: pipeline.staticModelStatus,
      animatedModelStatus: pipeline.animatedModelStatus,
      hasIndividualArt: hasArt,
      mechanic: entry.mechanic,
      narrativeUse: entry.narrativeUse,
      visualBrief: entry.visualBrief,
      reason: hasArt
        ? 'Canonical expansion concept art is linked. Static and animated readiness remain independently assessed.'
        : 'This creature has unique anatomy, ecology, mechanic, cue, counterplay, and visual law, but no accepted concept master is linked yet.',
    });
  });
}

function environmentConcept(id, expectedEnvironmentId) {
  const asset = worldConceptById.get(id);
  if (!asset || asset.environmentId !== expectedEnvironmentId) {
    throw new Error(`Environment concept ${id} is missing or bound to the wrong environment`);
  }
  return Object.freeze({
    id: asset.id,
    path: asset.path.replace(/^\.\//, ''),
    src: url(asset.path),
    sha256: asset.sha256,
    bytes: asset.bytes,
    dimensions: asset.dimensions,
    colorSpace: asset.colorSpace,
    alphaPolicy: asset.alphaPolicy,
    referenceScope: asset.referenceScope,
    approvalStatus: asset.approvalStatus,
    maturity: asset.maturity,
    runtimeBackdrop: asset.runtimeBackdrop,
    runtimeIntegrated: asset.runtimeIntegrated,
    productionAsset: asset.productionAsset,
  });
}

function environmentBlockout(id, expectedEnvironmentId) {
  const asset = spatialBlockoutById.get(id);
  if (!asset || !asset.environmentIds.includes(expectedEnvironmentId)) {
    throw new Error(`Spatial blockout ${id} is missing or bound to the wrong environment`);
  }
  return Object.freeze({
    id: asset.id,
    waveId: asset.waveId,
    name: asset.name,
    payloadPath: asset.payloadPath,
    payloadSrc: url(asset.payloadPath),
    indexPath: asset.indexPath,
    indexSrc: url(asset.indexPath),
    provenancePath: asset.provenancePath,
    provenanceSrc: url(asset.provenancePath),
    schemaPath: asset.schemaPath,
    schemaSrc: url(asset.schemaPath),
    schemaVersion: asset.schemaVersion,
    sha256: asset.sha256,
    bytes: asset.bytes,
    counts: asset.counts,
    authority: asset.authority,
    coordinateSemantics: asset.coordinateSemantics,
    limitations: asset.limitations,
    runtimeIntegrated: asset.runtimeIntegrated,
    constructionReady: asset.constructionReady,
    productionGeometry: asset.productionGeometry,
    staticScene: asset.staticScene,
    animatedScene: asset.animatedScene,
    releaseReady: asset.releaseReady,
  });
}

function environmentList() {
  return ENVIRONMENT_DEFINITIONS.map((definition) => {
    const concepts = Object.freeze(definition.conceptIds.map((id) => environmentConcept(id, definition.id)));
    const blockoutReferences = Object.freeze(definition.blockoutReferenceIds.map((id) => environmentBlockout(id, definition.id)));
    const [exteriorConcept, interiorConcept] = concepts;
    return Object.freeze({
      id: definition.id,
      contentId: definition.contentId,
      kind: 'environment',
      name: definition.name,
      regionId: definition.regionId,
      siteId: definition.siteId,
      routeId: definition.routeId ?? null,
      locationId: definition.locationId,
      questId: definition.questId,
      landmarkIds: definition.landmarkIds ?? Object.freeze([]),
      tier: 'reference',
      directionStatus: 'approved_direction',
      concepts,
      blockoutReferences,
      exteriorConcept,
      interiorConcept,
      exteriorSrc: exteriorConcept.src,
      interiorSrc: interiorConcept.src,
      staticScene: null,
      staticSceneStatus: 'awaiting-model',
      animatedScene: null,
      animatedSceneStatus: 'unassessed',
      motionSystems: definition.motionSystems,
      runtimeBackdrop: false,
      runtimeIntegrated: false,
      productionAsset: false,
      limitations: Object.freeze([
        'Concept direction only; not a runtime backdrop or integrated game asset.',
        'No static or animated 3D scene has been accepted.',
        'Not GIS, construction, structural, collision, navigation, or production-geometry authority.',
      ]),
      reason: 'Accepted concept direction and independently reviewed noncanonical blockout data are linked for scene authoring. Static and animated environment readiness remain independently unclaimed.',
    });
  });
}

export function buildRegistry() {
  const bestiary = bestiaryList();
  const sculpted = bestiary.filter((row) => row.tier === 'sculpted');
  const queuedBestiary = bestiary.filter((row) => row.tier !== 'sculpted');
  return Object.freeze({
    bestiary: Object.freeze(bestiary),
    sculpted: Object.freeze(sculpted),
    queuedBestiary: Object.freeze(queuedBestiary),
    namedCast: Object.freeze(namedCastList()),
    origins: Object.freeze(originsList()),
    expansionCharacters: Object.freeze(expansionCharacterList()),
    expansionCreatures: Object.freeze(expansionCreatureList()),
    environments: Object.freeze(environmentList()),
    companionContracts: Object.freeze([...COMPANION_QUEST_CONTRACTS]),
    agencyContracts: Object.freeze([...COMPANION_AGENCY_CONTRACTS]),
    actorContracts: Object.freeze([...QUEST_ACTOR_CONTRACTS]),
  });
}

export function tally(registry) {
  const countTier = (tier) => registry.bestiary.filter((row) => row.tier === tier).length;
  const foundingTotal = registry.bestiary.length + registry.namedCast.length + registry.origins.length;
  const expansionCharacters = registry.expansionCharacters.length;
  const expansionCreatures = registry.expansionCreatures.length;
  const expansionRows = [...registry.expansionCharacters, ...registry.expansionCreatures];
  const spatialBlockouts = new Set(registry.environments.flatMap((row) => row.blockoutReferences.map(({ id }) => id))).size;
  return {
    sculpted: countTier('sculpted'),
    awaitingArt: countTier('awaiting-art'),
    queued: countTier('queued'),
    refused: countTier('refused'),
    unassessed: countTier('unassessed'),
    namedCast: registry.namedCast.length,
    genericRig: registry.namedCast.filter((row) => row.tier === 'generic-rig').length,
    origins: registry.origins.length,
    expansionCharacters,
    expansionCreatures,
    expansionTotal: expansionCharacters + expansionCreatures,
    expansionItems: EXPANSION_ITEMS.length,
    expansionQuests: EXPANSION_QUESTS.length,
    companionContracts: registry.companionContracts.length,
    agencyContracts: registry.agencyContracts.length,
    actorContracts: registry.actorContracts.length,
    environments: registry.environments.length,
    spatialBlockouts,
    expansionAwaitingArt: expansionRows.filter((row) => row.tier === 'awaiting-art').length,
    expansionStaticModels: expansionRows.filter((row) => row.tier === 'static-model').length,
    expansionAnimatedModels: expansionRows.filter((row) => row.tier === 'animated-model').length,
    foundingTotal,
    // Compatibility: callers that audited the founding registry continue to
    // receive 228 here. New surfaces should use `grandTotal`.
    total: foundingTotal,
    grandTotal: foundingTotal + expansionCharacters + expansionCreatures,
    authoredQuestTarget: NARRATIVE_TARGETS.authoredQuestTarget,
  };
}
