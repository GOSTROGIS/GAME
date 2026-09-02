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
  document.querySelector('#roster').textContent = counts.expansionAwaitingArt + ' expansion awaiting art · ' + counts.awaitingArt + ' founding bestiary awaiting art';
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
    const images = await Promise.all([
      loadArt('npc.sera-dusk'),
      loadArt('enemy.ash-husk'),
      ...acceptedCharnel.map(loadSubjectArt),
      ...acceptedRemaining.map(loadSubjectArt),
    ]);
    const environmentImages = await Promise.all(environments.flatMap((environment) => environment.concepts.map((concept) =>
      loadRepositoryImage(concept.id, concept.src)
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
      },
      acceptedCharnel: acceptedCharnel.map(({ contentId, artStatus, tier, masterSrc, cutoutSrc, staticModel, animatedModel }) => ({ contentId, artStatus, tier, masterSrc, cutoutSrc, staticModel, animatedModel })),
      acceptedRemaining: acceptedRemaining.map(({ contentId, artStatus, tier, masterSrc, cutoutSrc, staticModel, animatedModel }) => ({ contentId, artStatus, tier, masterSrc, cutoutSrc, staticModel, animatedModel })),
      missingVisualBriefs: registry.expansionCharacters
        .filter(({ visualBriefStatus }) => visualBriefStatus === 'not-authored')
        .map(({ contentId, visualBrief, visualBriefStatus, conceptGenerationBlocked, conceptGenerationBlocker, reason }) => ({ contentId, visualBrief, visualBriefStatus, conceptGenerationBlocked, conceptGenerationBlocker, reason })),
      images,
      environmentImages,
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
const spatialAnnexRequests = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('request', (request) => {
  if (/googleusercontent|drive\.google|\/thumbnail\?id=/i.test(request.url())) {
    providerRequests.push(request.url());
  }
  if (/world-spatial-wave-02-v9\.annex\.json/i.test(request.url())) {
    spatialAnnexRequests.push(request.url());
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
  assert.equal(result.counts.environments, 2);
  assert.equal(result.environmentCount, 2);
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
  });
  assert.deepEqual(result.environmentImages.map(({ id, width, height }) => ({ id, width, height })), [
    { id: 'concept_warden_reed_four_bank_visibility_exterior', width: 1536, height: 1024 },
    { id: 'concept_warden_reed_stilt_service_house_interior', width: 1536, height: 1024 },
    { id: 'concept_hollow_abbey_processional_west_arrival', width: 1536, height: 1024 },
    { id: 'concept_hollow_abbey_mute_nave_route_read', width: 1536, height: 1024 },
    { id: 'concept_hollow_abbey_rain_court_work_nexus', width: 1536, height: 1024 },
  ]);
  for (const image of result.environmentImages) {
    assert.ok(image.src.startsWith(`${baseUrl}/assets/world/`), `${image.id} did not load from repository world assets`);
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
  assert.match(surfaces[1].text, /world-spatial-wave-02-v9\.annex\.json/);
  assert.match(surfaces[1].text, /Reviewed noncanonical blockout data only/);
  assert.match(surfaces[1].text, /Not accepted art, production geometry, runtime navigation\/collision\/streaming evidence/);
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

  const integratedSpatialReference = await page.evaluate(() => {
    const link = [...document.links].find(({ href }) => href.endsWith('/assets/world/spatial/world-spatial-wave-02-v9.annex.json'));
    const article = link?.closest('article');
    return {
      href: link?.href ?? null,
      text: article?.textContent ?? '',
      imageCount: article?.querySelectorAll('img').length ?? -1,
    };
  });
  assert.equal(integratedSpatialReference.href, `${baseUrl}/assets/world/spatial/world-spatial-wave-02-v9.annex.json`);
  assert.match(integratedSpatialReference.text, /Six-Site Deep Blockout/);
  assert.match(integratedSpatialReference.text, /site-local fictional meters are not atlas coordinates/i);
  assert.match(integratedSpatialReference.text, /Not accepted art/);
  assert.equal(integratedSpatialReference.imageCount, 0);

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
  assert.deepEqual(spatialAnnexRequests, [], 'The 49 MB spatial annex must remain on demand and must not be fetched during Art Bible hydration');
  assert.deepEqual(pageErrors, []);
  console.log(JSON.stringify({ valid: true, ...result, providerRequests, spatialAnnexRequests, pageErrors }, null, 2));
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
