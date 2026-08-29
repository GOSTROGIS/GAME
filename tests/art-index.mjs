import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { ORIGINS } from '../src/data/character.js';
import { CHARACTERS } from '../src/data/characters.js';
import { BESTIARY, ENEMY_FAMILIES } from '../packages/content/src/bestiary.data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const index = JSON.parse(await readFile(path.join(root, 'assets/art-index.json'), 'utf8'));
const requireComplete = process.env.ART_INDEX_REQUIRE_COMPLETE === '1';

const sorted = (values) => [...values].sort();
const assertUnique = (records, label) => {
  const ids = records.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length, `${label} IDs must be unique`);
};
const present = (row, key) => typeof row[key] === 'string' && row[key].length > 0;
const count = (records, key) => records.filter((row) => present(row, key)).length;
const assertPath = async (repositoryPath) => {
  assert.ok(repositoryPath.startsWith('assets/'), `art path must stay under assets/: ${repositoryPath}`);
  assert.equal(repositoryPath.includes('..'), false, `art path may not traverse: ${repositoryPath}`);
  await access(path.join(root, ...repositoryPath.split('/')));
};

assert.equal(index.schema, 'SableReachArtIndexV1');
assert.equal(index.playableOrigins.length, 8);
assert.equal(index.namedCharacters.length, 42);
assert.equal(index.bestiaryFamilies.length, 21);
assert.equal(index.individualBestiaryForms.length, 178);
assertUnique(index.playableOrigins, 'origin');
assertUnique(index.namedCharacters, 'named character');
assertUnique(index.bestiaryFamilies, 'family');
assertUnique(index.individualBestiaryForms, 'individual bestiary form');

assert.deepEqual(sorted(index.playableOrigins.map(({ id }) => id)), sorted(ORIGINS.map(({ id }) => id)));
assert.deepEqual(sorted(index.namedCharacters.map(({ id }) => id)), sorted(CHARACTERS.map(({ id }) => id)));
assert.deepEqual(sorted(index.bestiaryFamilies.map(({ id }) => id)), sorted(ENEMY_FAMILIES.map(({ id }) => id)));
assert.deepEqual(sorted(index.individualBestiaryForms.map(({ id }) => id)), sorted(BESTIARY.map(({ id }) => id)));

const canonicalCharacters = new Map(CHARACTERS.map((character) => [character.id, character]));
for (const character of index.namedCharacters) {
  const canonical = canonicalCharacters.get(character.id);
  assert.ok(canonical, `named character ${character.id} must exist in CHARACTERS`);
  assert.equal(character.factionId, canonical.factionId, `${character.id} faction must match CHARACTERS`);
  assert.equal(character.regionId, canonical.region, `${character.id} region must match CHARACTERS`);
}

const canonicalForms = new Map(BESTIARY.map((form) => [form.id, form]));
for (const form of index.individualBestiaryForms) {
  const canonical = canonicalForms.get(form.id);
  assert.ok(canonical, `bestiary form ${form.id} must exist in BESTIARY`);
  assert.equal(form.familyId, canonical.familyId, `${form.id} family must match BESTIARY`);
  assert.equal(form.rank, canonical.rank, `${form.id} rank must match BESTIARY`);
  assert.ok(Object.hasOwn(form, 'conceptMaster'), `${form.id} must declare conceptMaster`);
  assert.ok(Object.hasOwn(form, 'transparentCutout'), `${form.id} must declare transparentCutout`);
}

const indexedPaths = [];
for (const collection of [index.playableOrigins, index.namedCharacters, index.individualBestiaryForms]) {
  for (const row of collection) {
    for (const key of ['conceptMaster', 'transparentCutout']) {
      if (!present(row, key)) continue;
      indexedPaths.push(row[key]);
      await assertPath(row[key]);
    }
  }
}
for (const family of index.bestiaryFamilies) {
  indexedPaths.push(family.conceptPlate);
  await assertPath(family.conceptPlate);
}
assert.equal(new Set(indexedPaths).size, indexedPaths.length, 'indexed art paths must be unique');

assert.deepEqual(index.coverage.namedCharacters, {
  subjects: 42,
  conceptMasters: count(index.namedCharacters, 'conceptMaster'),
  transparentCutouts: count(index.namedCharacters, 'transparentCutout'),
});
assert.deepEqual(index.coverage.individualBestiaryForms, {
  subjects: 178,
  conceptMasters: count(index.individualBestiaryForms, 'conceptMaster'),
  transparentCutouts: count(index.individualBestiaryForms, 'transparentCutout'),
});

if (requireComplete) {
  assert.equal(index.coverage.namedCharacters.conceptMasters, 42);
  assert.equal(index.coverage.namedCharacters.transparentCutouts, 42);
  assert.equal(index.coverage.individualBestiaryForms.conceptMasters, 178);
  assert.equal(index.coverage.individualBestiaryForms.transparentCutouts, 178);
  assert.equal(indexedPaths.length, 456 + 21, 'complete index must contain 456 subject PNGs and 21 plates');
}

assert.equal(index.maturity.runtimeIntegrated, true);
assert.equal(index.maturity.productionAssets, false);

console.log(JSON.stringify({
  valid: true,
  requireComplete,
  origins: index.playableOrigins.length,
  named: index.coverage.namedCharacters,
  bestiary: index.coverage.individualBestiaryForms,
  plates: index.bestiaryFamilies.length,
}, null, 2));
