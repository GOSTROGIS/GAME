/* =========================================================================
   hm-concept-art.js — repository-backed concept-art adapter
   -------------------------------------------------------------------------
   assets/art-index.json is the only coverage authority. This adapter turns
   its repository paths into the legacy subject-keyed shape used by the Art
   Bible and MODEL MAKER. It deliberately has no network fallback: a path is
   either a same-origin project asset or it is unavailable.
   ========================================================================= */

import index from '../../assets/art-index.json' with { type: 'json' };

export const ART_INDEX = index;

const asPath = (value) => {
  if (typeof value !== 'string') return null;
  const path = value.trim().replaceAll('\\', '/').replace(/^\.\//, '');
  return path.startsWith('assets/') && !path.split('/').includes('..') ? path : null;
};

/** Resolve an indexed repository path for pages served from design-review/.
 *  Width and attempt remain accepted for API compatibility; local assets do
 *  not need URL rewriting or retry endpoints. */
export function url(repositoryPath, _w = 480, _attempt = 0) {
  const path = asPath(repositoryPath);
  return path ? `../${path}` : null;
}

const subjectId = (prefix, id) => `${prefix}.${String(id).replaceAll('_', '-')}`;
const familyRows = new Map((ART_INDEX.bestiaryFamilies || []).map((row) => [row.id, row]));

function makeRow({ conceptMaster, transparentCutout, conceptPlate, set, familyId = null }) {
  const masterPath = asPath(conceptMaster);
  const cutoutPath = asPath(transparentCutout);
  const platePath = asPath(conceptPlate);
  const masterSrc = url(masterPath);
  const cutoutSrc = url(cutoutPath);
  const plateSrc = url(platePath);
  return Object.freeze({
    // Legacy field names are retained, but now contain repository paths.
    master: masterPath,
    cutout: cutoutPath,
    plate: platePath,
    local: cutoutSrc || masterSrc || plateSrc,
    vendored: Boolean(masterPath || cutoutPath || platePath),
    set,
    familyId,
    masterPath,
    cutoutPath,
    platePath,
    masterSrc,
    cutoutSrc,
    plateSrc,
    repositoryPaths: Object.freeze({ master: masterPath, cutout: cutoutPath, plate: platePath }),
  });
}

const rows = {};

for (const row of ART_INDEX.playableOrigins || []) {
  rows[subjectId('origin', row.id)] = makeRow({
    ...row,
    set: 'playable_origins',
  });
}

for (const row of ART_INDEX.namedCharacters || []) {
  rows[subjectId('npc', row.id)] = makeRow({
    ...row,
    set: row.factionId,
  });
}

for (const row of ART_INDEX.bestiaryFamilies || []) {
  rows[subjectId('family', row.id)] = makeRow({
    conceptPlate: row.conceptPlate,
    set: row.id,
    familyId: row.id,
  });
}

for (const row of ART_INDEX.individualBestiaryForms || []) {
  const family = familyRows.get(row.familyId);
  rows[subjectId('enemy', row.id)] = makeRow({
    ...row,
    conceptPlate: family?.conceptPlate,
    set: row.familyId,
    familyId: row.familyId,
  });
}

export const CONCEPT_ART = Object.freeze(rows);

const emptyPaths = Object.freeze({ master: null, cutout: null, plate: null });

const emptyResult = (kind, note) => Object.freeze({
  has: false,
  kind,
  src: null,
  vendored: false,
  set: null,
  note,
  masterSrc: null,
  cutoutSrc: null,
  plateSrc: null,
  masterPath: null,
  cutoutPath: null,
  platePath: null,
  repositoryPaths: emptyPaths,
});

/** Resolve one subject. Preference is cutout, master, then family plate. */
export function artFor(id, _w = 480, _attempt = 0) {
  const row = CONCEPT_ART[id];
  if (!row) return emptyResult('unregistered', 'No row in assets/art-index.json.');

  const src = row.cutoutSrc || row.masterSrc || row.plateSrc;
  const kind = row.cutoutSrc
    ? 'concept cutout'
    : row.masterSrc
      ? 'concept master'
      : row.plateSrc
        ? 'family concept plate'
        : 'none';

  return Object.freeze({
    has: Boolean(src),
    kind,
    src,
    vendored: Boolean(src),
    set: row.set,
    note: src
      ? 'Indexed repository asset — same-origin and available offline.'
      : 'Registered with no art. This is an explicit production gap.',
    masterSrc: row.masterSrc,
    cutoutSrc: row.cutoutSrc,
    plateSrc: row.plateSrc,
    masterPath: row.masterPath,
    cutoutPath: row.cutoutPath,
    platePath: row.platePath,
    repositoryPaths: row.repositoryPaths,
  });
}

/** Measure independent master, cutout, and family-plate coverage. */
export function coverage(ids) {
  let master = 0;
  let cutout = 0;
  let plate = 0;
  let vendored = 0;
  let none = 0;
  let unregistered = 0;
  let withArt = 0;

  for (const id of ids) {
    const row = CONCEPT_ART[id];
    if (!row) {
      unregistered += 1;
      continue;
    }
    if (row.masterPath) master += 1;
    if (row.cutoutPath) cutout += 1;
    if (row.platePath) plate += 1;
    if (row.local) {
      vendored += 1;
      withArt += 1;
    } else {
      none += 1;
    }
  }

  return {
    total: ids.length,
    master,
    cutout,
    plate,
    vendored,
    none,
    unregistered,
    withArt,
    ratio: +((withArt / Math.max(ids.length, 1)) * 100).toFixed(1),
  };
}
