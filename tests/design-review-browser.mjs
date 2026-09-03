import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

import { chromium } from 'playwright';

const root = normalize(new URL('../', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const mime = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
};
const spatialPayloadSuffixes = Object.freeze([
  '/assets/world/spatial/world-spatial-wave-02-v9.annex.json',
  '/assets/world/spatial/wave-03a/warden-reed.site.json',
  '/assets/world/spatial/wave-03b/hollow-abbey.site.json',
  '/assets/world/spatial/wave-03c/hearthmere.site.json',
]);

const fixture = String.raw`<!doctype html>
<meta charset="utf-8">
<title>Design review registry browser test</title>
<p id="roster"></p>
<main id="subjects"></main>
<section id="environments"></section>
<script type="module">
  import { artFor } from './kit/hm-concept-art.js';
  import { buildRegistry, tally } from './kit/hm-model-registry.js';

  const registry = buildRegistry();
  const counts = tally(registry);
  const subjects = [...registry.bestiary, ...registry.namedCast, ...registry.origins, ...registry.expansionCharacters, ...registry.expansionCreatures];
  const environments = registry.environments;
  document.querySelector('#roster').textContent = counts.expansionAwaitingArt + ' expansion awaiting art · ' + counts.awaitingArt + ' founding bestiary awaiting art · ' + counts.spatialBlockouts + ' spatial blockouts';
  const host = document.querySelector('#subjects');
  for (const subject of subjects) {
    const row = document.createElement('button');
    row.dataset.subjectId = subject.id;
    row.textContent = subject.name;
    host.append(row);
  }
  const environmentHost = document.querySelector('#environments');
  for (const environment of environments) {
    const row = document.createElement('button');
    row.dataset.environmentId = environment.id;
    row.textContent = environment.name;
    environmentHost.append(row);
  }

  const loadArt = (id) => new Promise((resolve, reject) => {
    const art = artFor(id);
    if (!art.src) return reject(new Error(id + ' has no indexed art'));
    const image = new Image();
    image.onload = () => resolve({
      id,
      src: image.currentSrc || image.src,
      width: image.naturalWidth,
      height: image.naturalHeight,
    });
    image.onerror = () => reject(new Error(id + ' failed to load ' + art.src));
    image.src = art.src;
  });

  const loadSubjectArt = (subject) => new Promise((resolve, reject) => {
    if (!subject?.plate) return reject(new Error(subject?.id + ' has no registry art'));
    const image = new Image();
    image.onload = () => resolve({
      id: subject.id,
      src: image.currentSrc || image.src,
      width: image.naturalWidth,
      height: image.naturalHeight,
    });
    image.onerror = () => reject(new Error(subject.id + ' failed to load ' + subject.plate));
    image.src = subject.plate;
  });

  const loadRepositoryImage = (id, src) => new Promise((resolve, reject) => {
    if (!src) return reject(new Error(id + ' has no repository image'));
    const image = new Image();
    image.onload = () => resolve({ id, src: image.currentSrc || image.src, width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error(id + ' failed to load ' + src));
    image.src = src;
  });

  const loadRepositoryJson = async (id, src) => {
    if (!src) throw new Error(id + ' has no repository JSON');
    const response = await fetch(src);
    if (!response.ok) throw new Error(id + ' failed to load ' + src + ' (' + response.status + ')');
    const text = await response.text();
    const value = JSON.parse(text);
    return { id, src: response.url, bytes: new TextEncoder().encode(text).length, schemaVersion: value.schemaVersion ?? null, payloadId: value.id ?? value.batchId ?? null };
  };

  try {
    const acceptedCharnelIds = new Set([
      'mother_nacre_open_rib',
      'prince_thirteen_throats',
      'wound_scribe_keth',
      'maw_behind_mercy',
      'door_lung_courser',
      'reverse_rib_bride',
      'ilar_rook_unhoused_shadow',
      'ilyen_doorborn_outer_age',
      'throat_orchard',
      'jointless_advocate',
      'mercy_eater',
      'corridor_maw',
      'tima_vale_twice_born',
      'parn_exit_law',
      'orra_rain_in_ribs',
      'threshold_lamb',
      'eave_lung',
    ]);
    const acceptedCharnel = subjects.filter(({ contentId }) => acceptedCharnelIds.has(contentId));
    const acceptedRemainingIds = new Set([
      'enoch_last_lamplighter',
      'sister_calve_unlit_hospice',
      'tor_vannic_defector_of_dawn',
      'king_ash_without_country',
      'nima_sorn_keeper_of_one_shadow',
      'oren_lusk_last_calendarer',
      'mara_quoin_counter_deed',
      'kessa_pale_absence_clerk',
      'hobb_marr_shade_driver',
      'gannet_triune_veto_clerk',
      'jorem_mortality_bearer',
      'della_quorum_unseated_cost',
      'pell_nacreyear_road_witness',
    ]);
    const acceptedRemaining = subjects.filter(({ contentId }) => acceptedRemainingIds.has(contentId));
    const wardenEnvironment = environments.find(({ id }) => id === 'environment.warden-reed-four-bank-visibility');
    if (!wardenEnvironment) throw new Error('Warden Reed environment is missing from the registry');
    const hollowEnvironment = environments.find(({ id }) => id === 'environment.hollow-abbey-processional-and-mute-nave');
    if (!hollowEnvironment) throw new Error('Hollow Abbey environment is missing from the registry');
    const hearthmereEnvironment = environments.find(({ id }) => id === 'environment.hearthmere-hold-civic-spring-spine');
    if (!hearthmereEnvironment) throw new Error('Hearthmere Civic Spring environment is missing from the registry');
    const cairnmarketOrchardEnvironment = environments.find(({ id }) => id === 'environment.cairnmarket-grave-root-orchard-civic-system');
    if (!cairnmarketOrchardEnvironment) throw new Error('Cairnmarket Grave-Root Orchard environment is missing from the registry');
    const images = await Promise.all([
      loadArt('npc.sera-dusk'),
      loadArt('enemy.ash-husk'),
      ...acceptedCharnel.map(loadSubjectArt),
      ...acceptedRemaining.map(loadSubjectArt),
    ]);
    const environmentImages = await Promise.all(environments.flatMap((environment) => environment.concepts.map((concept) =>
      loadRepositoryImage(concept.id, concept.src)
    )));
    const blockoutPayloads = await Promise.all(environments.flatMap((environment) => environment.blockoutReferences.map((reference) =>
      loadRepositoryJson(reference.id, reference.payloadSrc)
    )));
    globalThis.__DESIGN_REVIEW_TEST__ = {
      ready: true,
      counts,
      subjectCount: subjects.length,
      uniqueSubjectCount: new Set(subjects.map(({ id }) => id)).size,
      environmentCount: environments.length,
      uniqueEnvironmentCount: new Set(environments.map(({ id }) => id)).size,
      wardenEnvironment: {
        id: wardenEnvironment.id,
        staticScene: wardenEnvironment.staticScene,
        staticSceneStatus: wardenEnvironment.staticSceneStatus,
        animatedScene: wardenEnvironment.animatedScene,
        animatedSceneStatus: wardenEnvironment.animatedSceneStatus,
        motionSystems: wardenEnvironment.motionSystems,
        runtimeBackdrop: wardenEnvironment.runtimeBackdrop,
        runtimeIntegrated: wardenEnvironment.runtimeIntegrated,
        productionAsset: wardenEnvironment.productionAsset,
        blockoutIds: wardenEnvironment.blockoutReferences.map(({ id }) => id),
      },
      hollowEnvironment: {
        id: hollowEnvironment.id,
        routeId: hollowEnvironment.routeId,
        landmarkIds: hollowEnvironment.landmarkIds,
        staticScene: hollowEnvironment.staticScene,
        staticSceneStatus: hollowEnvironment.staticSceneStatus,
        animatedScene: hollowEnvironment.animatedScene,
        animatedSceneStatus: hollowEnvironment.animatedSceneStatus,
        motionSystems: hollowEnvironment.motionSystems,
        runtimeBackdrop: hollowEnvironment.runtimeBackdrop,
        runtimeIntegrated: hollowEnvironment.runtimeIntegrated,
        productionAsset: hollowEnvironment.productionAsset,
        blockoutIds: hollowEnvironment.blockoutReferences.map(({ id }) => id),
      },
      hearthmereEnvironment: {
        id: hearthmereEnvironment.id,
        contentId: hearthmereEnvironment.contentId,
        siteId: hearthmereEnvironment.siteId,
        routeId: hearthmereEnvironment.routeId,
        locationId: hearthmereEnvironment.locationId,
        questId: hearthmereEnvironment.questId,
        conceptIds: hearthmereEnvironment.concepts.map(({ id }) => id),
        exteriorSrc: hearthmereEnvironment.exteriorSrc,
        interiorConcept: hearthmereEnvironment.interiorConcept,
        interiorSrc: hearthmereEnvironment.interiorSrc,
        staticScene: hearthmereEnvironment.staticScene,
        staticSceneStatus: hearthmereEnvironment.staticSceneStatus,
        animatedScene: hearthmereEnvironment.animatedScene,
        animatedSceneStatus: hearthmereEnvironment.animatedSceneStatus,
        motionSystems: hearthmereEnvironment.motionSystems,
        runtimeBackdrop: hearthmereEnvironment.runtimeBackdrop,
        runtimeIntegrated: hearthmereEnvironment.runtimeIntegrated,
        productionAsset: hearthmereEnvironment.productionAsset,
        blockoutIds: hearthmereEnvironment.blockoutReferences.map(({ id }) => id),
      },
      cairnmarketOrchardEnvironment: {
        id: cairnmarketOrchardEnvironment.id,
        contentId: cairnmarketOrchardEnvironment.contentId,
        siteId: cairnmarketOrchardEnvironment.siteId,
        routeId: cairnmarketOrchardEnvironment.routeId,
        locationId: cairnmarketOrchardEnvironment.locationId,
        questId: cairnmarketOrchardEnvironment.questId,
        conceptIds: cairnmarketOrchardEnvironment.concepts.map(({ id }) => id),
        exteriorConcept: cairnmarketOrchardEnvironment.exteriorConcept,
        exteriorSrc: cairnmarketOrchardEnvironment.exteriorSrc,
        interiorSrc: cairnmarketOrchardEnvironment.interiorSrc,
        staticScene: cairnmarketOrchardEnvironment.staticScene,
        staticSceneStatus: cairnmarketOrchardEnvironment.staticSceneStatus,
        animatedScene: cairnmarketOrchardEnvironment.animatedScene,
        animatedSceneStatus: cairnmarketOrchardEnvironment.animatedSceneStatus,
        motionSystems: cairnmarketOrchardEnvironment.motionSystems,
        runtimeBackdrop: cairnmarketOrchardEnvironment.runtimeBackdrop,
        runtimeIntegrated: cairnmarketOrchardEnvironment.runtimeIntegrated,
        productionAsset: cairnmarketOrchardEnvironment.productionAsset,
        blockoutIds: cairnmarketOrchardEnvironment.blockoutReferences.map(({ id }) => id),
      },
      acceptedCharnel: acceptedCharnel.map(({ contentId, artStatus, tier, masterSrc, cutoutSrc, staticModel, animatedModel }) => ({ contentId, artStatus, tier, masterSrc, cutoutSrc, staticModel, animatedModel })),
      acceptedRemaining: acceptedRemaining.map(({ contentId, artStatus, tier, masterSrc, cutoutSrc, staticModel, animatedModel }) => ({ contentId, artStatus, tier, masterSrc, cutoutSrc, staticModel, animatedModel })),
      missingVisualBriefs: registry.expansionCharacters
        .filter(({ visualBriefStatus }) => visualBriefStatus === 'not-authored')
        .map(({ contentId, visualBrief, visualBriefStatus, conceptGenerationBlocked, conceptGenerationBlocker, reason }) => ({ contentId, visualBrief, visualBriefStatus, conceptGenerationBlocked, conceptGenerationBlocker, reason })),
      images,
      environmentImages,
      blockoutPayloads,
    };
  } catch (error) {
    globalThis.__DESIGN_REVIEW_TEST__ = { ready: false, error: String(error) };
  }
</script>`;

const server = createServer(async (request, response) => {
  try {
    const requestPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (requestPath === '/design-review/__registry-browser-test__.html') {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end(fixture);
      return;
    }

    let file = normalize(join(root, requestPath === '/' ? 'index.html' : requestPath));
    if (!file.startsWith(root)) throw new Error('Path outside root');
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    response.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream' });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Design-review test server did not expose a TCP port');
const baseUrl = `http://127.0.0.1:${address.port}`;

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const pageErrors = [];
const providerRequests = [];
const eagerSpatialPayloadRequests = [];
let trackedRealSurface = null;
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('request', (request) => {
  if (/googleusercontent|drive\.google|\/thumbnail\?id=/i.test(request.url())) {
    providerRequests.push(request.url());
  }
  const requestPath = new URL(request.url()).pathname;
  if (trackedRealSurface && spatialPayloadSuffixes.includes(requestPath)) {
    eagerSpatialPayloadRequests.push({ surface: trackedRealSurface, url: request.url() });
  }
});

let testFailure = null;
try {
  await page.goto(`${baseUrl}/design-review/__registry-browser-test__.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => globalThis.__DESIGN_REVIEW_TEST__ !== undefined, null, { timeout: 30_000 });
  const result = await page.evaluate(() => globalThis.__DESIGN_REVIEW_TEST__);
  assert.equal(result.ready, true, result.error || 'Design-review browser fixture did not become ready');

  assert.equal(result.subjectCount, result.counts.grandTotal);
  assert.equal(result.uniqueSubjectCount, result.subjectCount);
  assert.equal(result.counts.total, 228);
  assert.equal(result.counts.foundingTotal, 228);
  assert.equal(result.counts.grandTotal, 337);
  assert.equal(result.counts.environments, 4);
  assert.equal(result.counts.spatialBlockouts, 3);
  assert.equal(result.environmentCount, 4);
  assert.equal(result.uniqueEnvironmentCount, result.environmentCount);
  assert.equal(result.counts.expansionCharacters, 70);
  assert.equal(result.counts.expansionCreatures, 39);
  assert.equal(result.counts.expansionItems, 67);
  assert.equal(result.counts.expansionQuests, 49);
  assert.equal(result.counts.companionContracts, 4);
  assert.equal(result.counts.agencyContracts, 2);
  assert.equal(result.counts.actorContracts, 6);
  const rosterText = await page.locator('#roster').textContent();
  assert.match(rosterText, /69 expansion awaiting art/);
  assert.match(rosterText, /0 founding bestiary awaiting art/);
  assert.match(rosterText, /3 spatial blockouts/);
  assert.equal(await page.locator('[data-subject-id]').count(), result.subjectCount);
  assert.equal(await page.locator('[data-environment-id]').count(), result.environmentCount);
  assert.equal(result.acceptedCharnel.length, 17);
  assert.equal(result.acceptedRemaining.length, 13);
  assert.equal(new Set(result.images.map(({ id }) => id)).size, 32);
  for (const subject of [...result.acceptedCharnel, ...result.acceptedRemaining]) {
    assert.equal(subject.artStatus, 'accepted');
    assert.equal(subject.tier, 'queued');
    assert.ok(subject.masterSrc?.startsWith('../assets/'));
    assert.equal(subject.cutoutSrc, null);
    assert.equal(subject.staticModel, null);
    assert.equal(subject.animatedModel, null);
  }
  for (const image of result.images) {
    assert.ok(image.width > 0 && image.height > 0, `${image.id} loaded with zero dimensions`);
    assert.ok(image.src.startsWith(`${baseUrl}/assets/`), `${image.id} did not load from repository assets`);
  }
  assert.deepEqual(result.wardenEnvironment, {
    id: 'environment.warden-reed-four-bank-visibility',
    staticScene: null,
    staticSceneStatus: 'awaiting-model',
    animatedScene: null,
    animatedSceneStatus: 'unassessed',
    motionSystems: ['fog_density_bands', 'ferry_positions', 'guide_lanterns', 'high_rope_return', 'water_surface'],
    runtimeBackdrop: false,
    runtimeIntegrated: false,
    productionAsset: false,
    blockoutIds: ['spatial_blockout.wave-03a.warden-reed'],
  });
  assert.deepEqual(result.hollowEnvironment, {
    id: 'environment.hollow-abbey-processional-and-mute-nave',
    routeId: 'route.processional-steps',
    landmarkIds: ['abbey_gate', 'mute_nave', 'last_bell_crypt'],
    staticScene: null,
    staticSceneStatus: 'awaiting-model',
    animatedScene: null,
    animatedSceneStatus: 'unassessed',
    motionSystems: ['roof_rain_now', 'delayed_rain_returns', 'eclipse_light_shafts', 'urn_resonance_fields', 'silence_pressure_zones', 'upper_cloister_route_state'],
    runtimeBackdrop: false,
    runtimeIntegrated: false,
    productionAsset: false,
    blockoutIds: ['spatial_blockout.wave-03b.hollow-abbey'],
  });
  assert.deepEqual(result.hearthmereEnvironment, {
    id: 'environment.hearthmere-hold-civic-spring-spine',
    contentId: 'hearthmere_civic_spring_spine',
    siteId: 'site.hearthmere',
    routeId: null,
    locationId: 'hearthmere_civic_spring_spine',
    questId: null,
    conceptIds: ['concept_hearthmere_civic_spring_spine'],
    exteriorSrc: '../assets/world/hearthmere-civic-spring-spine-v1.png',
    interiorConcept: null,
    interiorSrc: null,
    staticScene: null,
    staticSceneStatus: 'awaiting-model',
    animatedScene: null,
    animatedSceneStatus: 'unassessed',
    motionSystems: ['spring_channel_flow', 'roof_runoff_rain_chains', 'civic_service_handcarts', 'ration_and_ledger_queues', 'bell_yoke_service'],
    runtimeBackdrop: false,
    runtimeIntegrated: false,
    productionAsset: false,
    blockoutIds: ['spatial_blockout.wave-03c.hearthmere'],
  });
  assert.deepEqual(result.cairnmarketOrchardEnvironment, {
    id: 'environment.cairnmarket-grave-root-orchard-civic-system',
    contentId: 'cairnmarket_grave_root_orchard',
    siteId: 'site.cairnmarket',
    routeId: null,
    locationId: 'cairnmarket_grave_root_orchard',
    questId: 'regional_the_graves_grew_upward',
    conceptIds: ['concept_cairnmarket_grave_root_orchard_civic_system'],
    exteriorConcept: null,
    exteriorSrc: null,
    interiorSrc: '../assets/world/cairnmarket-grave-root-orchard-civic-system-v1.png',
    staticScene: null,
    staticSceneStatus: 'awaiting-model',
    animatedScene: null,
    animatedSceneStatus: 'unassessed',
    motionSystems: ['four_root_route_state', 'funeral_kite_pollination_lines', 'manual_root_tray_hoists', 'separate_food_mortuary_drainage', 'collapse_refuge_access'],
    runtimeBackdrop: false,
    runtimeIntegrated: false,
    productionAsset: false,
    blockoutIds: [],
  });
  assert.deepEqual(result.environmentImages.map(({ id, width, height }) => ({ id, width, height })), [
    { id: 'concept_warden_reed_four_bank_visibility_exterior', width: 1536, height: 1024 },
    { id: 'concept_warden_reed_stilt_service_house_interior', width: 1536, height: 1024 },
    { id: 'concept_hollow_abbey_processional_west_arrival', width: 1536, height: 1024 },
    { id: 'concept_hollow_abbey_mute_nave_route_read', width: 1536, height: 1024 },
    { id: 'concept_hollow_abbey_rain_court_work_nexus', width: 1536, height: 1024 },
    { id: 'concept_hollow_abbey_foundry_operational_chain', width: 1536, height: 1024 },
    { id: 'concept_hearthmere_civic_spring_spine', width: 1536, height: 1024 },
    { id: 'concept_cairnmarket_grave_root_orchard_civic_system', width: 1536, height: 1024 },
  ]);
  for (const image of result.environmentImages) {
    assert.ok(image.src.startsWith(`${baseUrl}/assets/world/`), `${image.id} did not load from repository world assets`);
  }
  assert.deepEqual(result.blockoutPayloads.map(({ id, schemaVersion, payloadId }) => ({ id, schemaVersion, payloadId })), [
    { id: 'spatial_blockout.wave-03a.warden-reed', schemaVersion: 1, payloadId: 'site-blockout.wave-03a.warden-reed' },
    { id: 'spatial_blockout.wave-03b.hollow-abbey', schemaVersion: 2, payloadId: 'site-blockout.wave-03b.hollow-abbey' },
    { id: 'spatial_blockout.wave-03c.hearthmere', schemaVersion: 2, payloadId: 'site-blockout.wave-03c.hearthmere' },
  ]);
  for (const payload of result.blockoutPayloads) {
    assert.ok(payload.bytes > 0, `${payload.id} loaded an empty JSON payload`);
    assert.ok(payload.src.startsWith(`${baseUrl}/assets/world/spatial/`), `${payload.id} did not load from repository spatial assets`);
  }

  assert.deepEqual(result.missingVisualBriefs.map(({ contentId }) => contentId).sort(), [
    'leto_fain_custodian_unclaimed_symptoms',
    'senn_avir_residue_orderly',
  ]);
  for (const row of result.missingVisualBriefs) {
    assert.equal(row.visualBrief, null);
    assert.equal(row.visualBriefStatus, 'not-authored');
    assert.equal(row.conceptGenerationBlocked, true);
    assert.match(row.conceptGenerationBlocker, /No canonical visual brief is authored/);
    assert.match(row.reason, /Concept generation is blocked/);
  }

  const surfaces = await page.evaluate(async () => {
    const paths = [
      '/design-review/MODEL%20MAKER.html',
      '/design-review/Hollow%20March%20Art%20Bible.dc.html',
    ];
    return Promise.all(paths.map(async (path) => ({ path, text: await (await fetch(path)).text() })));
  });
  assert.match(surfaces[0].text, /REG\.bestiary/);
  assert.match(surfaces[0].text, /bounded agency contracts/);
  assert.match(surfaces[0].text, /COUNTS\.expansionAwaitingArt/);
  assert.match(surfaces[0].text, /expansion awaiting art/);
  assert.match(surfaces[0].text, /founding bestiary awaiting art/);
  assert.match(surfaces[0].text, /REG\.environments/);
  assert.match(surfaces[0].text, /environment\.concepts\.map/);
  assert.match(surfaces[0].text, /environment\.concepts\.length/);
  assert.match(surfaces[0].text, /environment\.blockoutReferences/);
  assert.match(surfaces[0].text, /Spatial blockout data/);
  assert.match(surfaces[0].text, /loaded on demand/);
  assert.doesNotMatch(surfaces[0].text, /2 accepted concept references|exterior \+ interior/);
  assert.match(surfaces[0].text, /Motion systems to author/);
  assert.match(surfaces[0].text, /No static scene artifact is linked/);
  assert.match(surfaces[0].text, /Visual brief \\u2014 not authored/);
  assert.match(surfaces[0].text, /id="selectorBtn"[^>]+aria-expanded="false"[^>]+aria-controls="selPanel"/);
  assert.match(surfaces[0].text, /id="selPanel"[^>]+role="region"[^>]+aria-label="Subject selector"/);
  assert.match(surfaces[0].text, /<label[^>]+for="selSearch"[^>]*>Filter subjects<\/label>/);
  assert.match(surfaces[0].text, /closeSelector\(\{ restoreFocus: true \}\)/);
  assert.match(surfaces[1].text, /hm-concept-art\.js/);
  assert.match(surfaces[1].text, /technicalReferences/);
  assert.match(surfaces[1].text, /veil-coast-gloamharbor-tide-refuge-blueprint-v14\.png/);
  assert.match(surfaces[1].text, /spatialReferences/);
  assert.match(surfaces[1].text, /WORLD_SPATIAL_BLOCKOUT_ASSETS/);
  assert.match(surfaces[1].text, /Open spatial payload/);
  assert.match(surfaces[1].text, /<html lang="en">/);
  assert.match(surfaces[1].text, /<title>Hollow March Art Bible — Sable Reach<\/title>/);
  assert.match(surfaces[1].text, /<div role="main" style="position:relative;background:#080b0d;min-height:100vh">/);
  for (const surface of surfaces) {
    assert.doesNotMatch(surface.text, /googleusercontent|drive\.google|thumbnail\?id=/i);
  }

  const technicalReferenceImage = await page.evaluate(() => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight, src: image.currentSrc || image.src });
    image.onerror = () => reject(new Error('Veil technical reference failed to load'));
    image.src = '/assets/world/technical/veil-coast-gloamharbor-tide-refuge-blueprint-v14.png';
  }));
  assert.deepEqual({ width: technicalReferenceImage.width, height: technicalReferenceImage.height }, { width: 1536, height: 1024 });
  assert.ok(technicalReferenceImage.src.startsWith(`${baseUrl}/assets/world/technical/`));

  trackedRealSurface = 'MODEL MAKER';
  await page.goto(`${baseUrl}/design-review/MODEL%20MAKER.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#rvList', { timeout: 30_000 });
  const modelMakerBlockouts = [
    {
      environmentId: 'environment.warden-reed-four-bank-visibility',
      blockoutId: 'spatial_blockout.wave-03a.warden-reed',
      schemaVersion: 1,
      paths: [
        '/assets/world/spatial/wave-03a/warden-reed.site.json',
        '/assets/world/spatial/wave-03a/index.json',
        '/assets/world/spatial/wave-03a/provenance.json',
        '/assets/world/spatial/site-blockout-reference-v1.schema.json',
      ],
    },
    {
      environmentId: 'environment.hollow-abbey-processional-and-mute-nave',
      blockoutId: 'spatial_blockout.wave-03b.hollow-abbey',
      schemaVersion: 2,
      paths: [
        '/assets/world/spatial/wave-03b/hollow-abbey.site.json',
        '/assets/world/spatial/wave-03b/index.json',
        '/assets/world/spatial/wave-03b/provenance.json',
        '/assets/world/spatial/site-blockout-reference-v2.schema.json',
      ],
    },
    {
      environmentId: 'environment.hearthmere-hold-civic-spring-spine',
      blockoutId: 'spatial_blockout.wave-03c.hearthmere',
      schemaVersion: 2,
      paths: [
        '/assets/world/spatial/wave-03c/hearthmere.site.json',
        '/assets/world/spatial/wave-03c/index.json',
        '/assets/world/spatial/wave-03c/provenance.json',
        '/assets/world/spatial/site-blockout-reference-v2.schema.json',
      ],
    },
  ];
  for (const expected of modelMakerBlockouts) {
    await page.locator('#selectorBtn').click();
    await page.locator(`.selrow[data-id="${expected.environmentId}"]`).click();
    const article = page.locator(`[data-environment-blockout="${expected.blockoutId}"]`);
    await article.waitFor({ state: 'visible', timeout: 30_000 });
    const rendered = await article.evaluate((node) => ({
      text: node.textContent ?? '',
      hrefs: [...node.querySelectorAll('a')].map(({ href }) => href),
    }));
    assert.match(rendered.text, new RegExp(`schema v${expected.schemaVersion}`, 'i'));
    assert.deepEqual(rendered.hrefs, expected.paths.map((path) => `${baseUrl}${path}`));
    if (expected.environmentId === 'environment.hearthmere-hold-civic-spring-spine') {
      assert.doesNotMatch(await page.locator('#tierBody').textContent(), /quest\s+null/i);
    }
  }
  await page.locator('#selectorBtn').click();
  await page.locator('.selrow[data-id="environment.cairnmarket-grave-root-orchard-civic-system"]').click();
  const orchardConcept = page.locator('[data-environment-concept="site_quest_location_subterranean_civic_system"]');
  await orchardConcept.waitFor({ state: 'visible', timeout: 30_000 });
  const orchardUi = await page.evaluate(() => {
    const concept = document.querySelector('[data-environment-concept="site_quest_location_subterranean_civic_system"]');
    const image = concept?.querySelector('img');
    const placeholder = document.querySelector('#placeholderImg');
    return {
      conceptText: concept?.textContent ?? '',
      conceptSrc: image?.currentSrc || image?.src || '',
      width: image?.naturalWidth ?? 0,
      height: image?.naturalHeight ?? 0,
      placeholderSrc: placeholder?.currentSrc || placeholder?.src || '',
      placeholderAlt: placeholder?.alt ?? '',
      tierText: document.querySelector('#tierBody')?.textContent ?? '',
    };
  });
  assert.match(orchardUi.conceptText, /Interior · accepted direction/);
  assert.equal(orchardUi.conceptSrc, `${baseUrl}/assets/world/cairnmarket-grave-root-orchard-civic-system-v1.png`);
  assert.deepEqual({ width: orchardUi.width, height: orchardUi.height }, { width: 1536, height: 1024 });
  assert.equal(orchardUi.placeholderSrc, orchardUi.conceptSrc);
  assert.match(orchardUi.placeholderAlt, /interior concept direction/i);
  assert.match(orchardUi.tierText, /Static scene · awaiting-model/);
  assert.match(orchardUi.tierText, /Animated scene · unassessed/);
  assert.doesNotMatch(orchardUi.tierText, /quest\s+null/i);
  await page.waitForTimeout(250);
  trackedRealSurface = null;
  assert.deepEqual(
    eagerSpatialPayloadRequests.filter(({ surface }) => surface === 'MODEL MAKER'),
    [],
    'MODEL MAKER must expose local spatial links without eagerly fetching a Wave 02, 03A, 03B, or 03C payload',
  );

  trackedRealSurface = 'Hollow March Art Bible';
  await page.goto(`${baseUrl}/design-review/Hollow%20March%20Art%20Bible.dc.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const image = [...document.images].find(({ alt }) => alt === 'Gloamharbor tide-refuge five-cell topology blueprint');
    return image?.complete && image.naturalWidth === 1536 && image.naturalHeight === 1024;
  }, null, { timeout: 30_000 });
  const integratedTechnicalReference = await page.evaluate(() => {
    const image = [...document.images].find(({ alt }) => alt === 'Gloamharbor tide-refuge five-cell topology blueprint');
    return { width: image.naturalWidth, height: image.naturalHeight, src: image.currentSrc || image.src };
  });
  assert.deepEqual({ width: integratedTechnicalReference.width, height: integratedTechnicalReference.height }, { width: 1536, height: 1024 });
  assert.ok(integratedTechnicalReference.src.startsWith(`${baseUrl}/assets/world/technical/`));

  const orchardArtBibleLocator = page.locator('img[alt="Cairnmarket grave-root orchard civic system environment keyframe"]');
  await orchardArtBibleLocator.scrollIntoViewIfNeeded();
  await orchardArtBibleLocator.evaluate((image) => image.decode());
  const orchardArtBibleImage = await page.evaluate(() => {
    const image = [...document.images].find(({ alt }) => alt === 'Cairnmarket grave-root orchard civic system environment keyframe');
    return { width: image.naturalWidth, height: image.naturalHeight, src: image.currentSrc || image.src };
  });
  assert.deepEqual({ width: orchardArtBibleImage.width, height: orchardArtBibleImage.height }, { width: 1536, height: 1024 });
  assert.equal(orchardArtBibleImage.src, `${baseUrl}/assets/world/cairnmarket-grave-root-orchard-civic-system-v1.png`);

  await page.waitForFunction(() => [
    '/assets/world/spatial/world-spatial-wave-02-v9.annex.json',
    '/assets/world/spatial/wave-03a/warden-reed.site.json',
    '/assets/world/spatial/wave-03b/hollow-abbey.site.json',
    '/assets/world/spatial/wave-03c/hearthmere.site.json',
  ].every((suffix) => [...document.links].some(({ href }) => href.endsWith(suffix))), null, { timeout: 30_000 });

  const integratedSpatialReference = await page.evaluate(() => {
    const link = [...document.links].find(({ href }) => href.endsWith('/assets/world/spatial/world-spatial-wave-02-v9.annex.json'));
    const article = link?.closest('article');
    return {
      href: link?.href ?? null,
      text: article?.textContent ?? '',
      imageCount: article?.querySelectorAll('img').length ?? -1,
      hrefs: [...(article?.querySelectorAll('a') ?? [])].map(({ href }) => href),
    };
  });
  assert.equal(integratedSpatialReference.href, `${baseUrl}/assets/world/spatial/world-spatial-wave-02-v9.annex.json`);
  assert.deepEqual(integratedSpatialReference.hrefs, [
    `${baseUrl}/assets/world/spatial/world-spatial-wave-02-v9.annex.json`,
    `${baseUrl}/assets/world/spatial/world-spatial-wave-02-v9.provenance.json`,
  ]);
  assert.match(integratedSpatialReference.text, /Six-Site Deep Blockout/);
  assert.match(integratedSpatialReference.text, /site-local fictional meters are not atlas coordinates/i);
  assert.match(integratedSpatialReference.text, /not accepted art/i);
  assert.equal(integratedSpatialReference.imageCount, 0);

  const integratedSiteBlockouts = await page.evaluate(() => [
    '/assets/world/spatial/wave-03a/warden-reed.site.json',
    '/assets/world/spatial/wave-03b/hollow-abbey.site.json',
    '/assets/world/spatial/wave-03c/hearthmere.site.json',
  ].map((suffix) => {
    const link = [...document.links].find(({ href }) => href.endsWith(suffix));
    const article = link?.closest('article');
    return {
      suffix,
      href: link?.href ?? null,
      hrefs: [...(article?.querySelectorAll('a') ?? [])].map(({ href }) => href),
      text: article?.textContent ?? '',
    };
  }));
  assert.deepEqual(integratedSiteBlockouts.map(({ href }) => href), [
    `${baseUrl}/assets/world/spatial/wave-03a/warden-reed.site.json`,
    `${baseUrl}/assets/world/spatial/wave-03b/hollow-abbey.site.json`,
    `${baseUrl}/assets/world/spatial/wave-03c/hearthmere.site.json`,
  ]);
  assert.match(integratedSiteBlockouts[0].text, /Warden Reed/);
  assert.match(integratedSiteBlockouts[0].text, /schema v1/i);
  assert.match(integratedSiteBlockouts[1].text, /Hollow Abbey/);
  assert.match(integratedSiteBlockouts[1].text, /schema v2/i);
  assert.match(integratedSiteBlockouts[2].text, /Hearthmere/);
  assert.match(integratedSiteBlockouts[2].text, /schema v2/i);
  assert.deepEqual(integratedSiteBlockouts.map(({ hrefs }) => hrefs), [
    [
      `${baseUrl}/assets/world/spatial/wave-03a/warden-reed.site.json`,
      `${baseUrl}/assets/world/spatial/wave-03a/provenance.json`,
    ],
    [
      `${baseUrl}/assets/world/spatial/wave-03b/hollow-abbey.site.json`,
      `${baseUrl}/assets/world/spatial/wave-03b/provenance.json`,
    ],
    [
      `${baseUrl}/assets/world/spatial/wave-03c/hearthmere.site.json`,
      `${baseUrl}/assets/world/spatial/wave-03c/provenance.json`,
    ],
  ]);
  const spatialCardLayout = await page.evaluate(() => {
    const firstLink = [...document.links].find(({ href }) => href.endsWith('/assets/world/spatial/world-spatial-wave-02-v9.annex.json'));
    const container = firstLink?.closest('article')?.parentElement;
    const cards = container ? [...container.querySelectorAll(':scope > article')] : [];
    return {
      count: cards.length,
      rowGap: container ? Number.parseFloat(getComputedStyle(container).rowGap) : 0,
      separatedCards: cards.filter((card) => Number.parseFloat(getComputedStyle(card).borderTopWidth) > 0).length,
    };
  });
  assert.deepEqual(spatialCardLayout, { count: 4, rowGap: 10, separatedCards: 4 });
  await page.waitForTimeout(250);
  trackedRealSurface = null;
  assert.deepEqual(
    eagerSpatialPayloadRequests.filter(({ surface }) => surface === 'Hollow March Art Bible'),
    [],
    'The Art Bible must expose local spatial links without eagerly fetching a Wave 02, 03A, 03B, or 03C payload',
  );

  const responsivePage = await browser.newPage({ viewport: { width: 375, height: 812 } });
  try {
    await responsivePage.route(/^https?:\/\//, (route) => route.abort());
    const withoutScripts = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

    await responsivePage.setContent(withoutScripts(surfaces[0].text), { waitUntil: 'domcontentloaded' });
    const modelMakerNarrow = await responsivePage.evaluate(() => {
      const shell = document.querySelector('.model-maker-shell');
      const viewport = document.querySelector('#viewport');
      const rail = shell?.querySelector(':scope > aside');
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        columns: shell ? getComputedStyle(shell).gridTemplateColumns : null,
        viewportBottom: viewport?.getBoundingClientRect().bottom ?? null,
        railTop: rail?.getBoundingClientRect().top ?? null,
      };
    });
    assert.ok(modelMakerNarrow.overflow <= 1, `MODEL MAKER overflows 375px by ${modelMakerNarrow.overflow}px`);
    assert.match(modelMakerNarrow.columns ?? '', /^375px$/);
    assert.ok(modelMakerNarrow.railTop >= modelMakerNarrow.viewportBottom - 1, 'MODEL MAKER detail rail must stack below its viewport');

    await responsivePage.setContent(withoutScripts(surfaces[1].text), { waitUntil: 'domcontentloaded' });
    const artBibleNarrow = await responsivePage.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      fluidGrids: document.querySelectorAll('[style*="minmax(min(100%"]' ).length,
    }));
    assert.ok(artBibleNarrow.fluidGrids >= 12, 'Art Bible must keep every auto-fit card grid fluid');
    assert.ok(artBibleNarrow.overflow <= 1, `Art Bible overflows 375px by ${artBibleNarrow.overflow}px`);
  } finally {
    await responsivePage.close({ runBeforeUnload: false });
  }

  assert.deepEqual(providerRequests, []);
  assert.deepEqual(eagerSpatialPayloadRequests, []);
  assert.deepEqual(pageErrors, []);
  console.log(JSON.stringify({ valid: true, ...result, providerRequests, eagerSpatialPayloadRequests, pageErrors }, null, 2));
} catch (error) {
  testFailure = error;
  throw error;
} finally {
  await page.close({ runBeforeUnload: false }).catch(() => {});
  server.closeAllConnections?.();
  server.closeIdleConnections?.();
  await Promise.all(browser.contexts().map((context) => context.close().catch(() => {})));
  const browserClosed = await Promise.race([
    browser.close().then(() => true, () => false),
    new Promise((resolve) => setTimeout(() => resolve(false), 5_000)),
  ]);
  await Promise.race([
    new Promise((resolve) => server.close(resolve)),
    new Promise((resolve) => setTimeout(resolve, 2_000)),
  ]);
  if (!browserClosed) {
    console.warn('Browser assertions completed; the host Chrome process ignored graceful shutdown and was detached by ending the test process.');
    if (testFailure) console.error(testFailure);
    process.exit(testFailure ? 1 : 0);
  }
}
