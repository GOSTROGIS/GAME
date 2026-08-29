import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { ORIGINS } from "../src/data/character.js";
import { CHARACTERS } from "../src/data/characters.js";
import { ENEMY_FAMILIES } from "../packages/content/src/bestiary.data.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const index = JSON.parse(await readFile(path.join(root, "assets/art-index.json"), "utf8"));

const sorted = (values) => [...values].sort();
const assertUnique = (records, label) => {
  const ids = records.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length, `${label} IDs must be unique`);
};

assert.equal(index.schema, "SableReachArtIndexV1");
assert.equal(index.playableOrigins.length, 8);
assert.equal(index.namedCharacters.length, 24);
assert.equal(index.bestiaryFamilies.length, 21);
assertUnique(index.playableOrigins, "origin");
assertUnique(index.namedCharacters, "named character");
assertUnique(index.bestiaryFamilies, "family");

assert.deepEqual(sorted(index.playableOrigins.map(({ id }) => id)), sorted(ORIGINS.map(({ id }) => id)));
assert.deepEqual(sorted(index.bestiaryFamilies.map(({ id }) => id)), sorted(ENEMY_FAMILIES.map(({ id }) => id)));

const canonicalCharacters = new Map(CHARACTERS.map((character) => [character.id, character]));
for (const character of index.namedCharacters) {
  const canonical = canonicalCharacters.get(character.id);
  assert.ok(canonical, `named character ${character.id} must exist in CHARACTERS`);
  assert.equal(character.factionId, canonical.factionId, `${character.id} faction must match CHARACTERS`);
  assert.equal(character.regionId, canonical.region, `${character.id} region must match CHARACTERS`);
}

for (const origin of index.playableOrigins) {
  await access(path.join(root, origin.conceptMaster));
  await access(path.join(root, origin.transparentCutout));
}
for (const character of index.namedCharacters) {
  await access(path.join(root, character.conceptMaster));
  await access(path.join(root, character.transparentCutout));
}
for (const family of index.bestiaryFamilies) await access(path.join(root, family.conceptPlate));

assert.equal(index.coverage.namedCharacters.subjects, 42);
assert.equal(index.coverage.namedCharacters.conceptMasters, index.namedCharacters.length);
assert.equal(index.coverage.namedCharacters.transparentCutouts, index.namedCharacters.length);
assert.equal(index.coverage.individualBestiaryForms.subjects, 178);
assert.equal(index.maturity.runtimeIntegrated, false);
assert.equal(index.maturity.productionAssets, false);

console.log("art-index: 8 origins, 24 named characters, and 21 bestiary families verified");
