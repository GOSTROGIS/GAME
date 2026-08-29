#!/usr/bin/env node

import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BESTIARY } from '../../packages/content/src/bestiary.data.js';
import { CHARACTERS } from '../../src/data/characters.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const indexPath = path.join(root, 'assets/art-index.json');
const existing = JSON.parse(await readFile(indexPath, 'utf8'));

const factionDirectories = Object.freeze({
  ember_ledger: 'ember-ledger',
  bell_wardens: 'bell-wardens',
  reed_sisters: 'reed-sisters',
  cinder_compact: 'cinder-compact',
  exact_word: 'exact-word',
  unwritten_roads: 'unwritten-roads',
  grave_tithe: 'grave-tithe',
});

const slug = (id) => id.replaceAll('_', '-');
const characterFileSlugs = Object.freeze({
  gatewarden_nhal: 'nhal-without-shadow',
});
const present = async (repositoryPath) => {
  try {
    await access(path.join(root, ...repositoryPath.split('/')));
    return repositoryPath;
  } catch {
    return null;
  }
};

const highestVersionAsset = async (directory, fileSlug, cutout = false) => {
  const suffix = cutout ? '-cutout.png' : '.png';
  const pattern = new RegExp(`^${fileSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-v(\\d+)${cutout ? '-cutout' : ''}\\.png$`);
  let names;
  try {
    names = await readdir(path.join(root, ...directory.split('/')));
  } catch {
    return null;
  }
  const candidates = names
    .map((name) => ({ name, match: name.match(pattern) }))
    .filter(({ match }) => match)
    .sort((a, b) => Number(b.match[1]) - Number(a.match[1]));
  return candidates.length ? `${directory}/${candidates[0].name}` : null;
};

const playableOrigins = await Promise.all(existing.playableOrigins.map(async (row) => {
  const conceptMaster = row.id === 'gloamfarer'
    ? 'assets/characters/gloamfarer-v3.png'
    : row.conceptMaster;
  return {
    id: row.id,
    conceptMaster: await present(conceptMaster),
    transparentCutout: await present(row.transparentCutout),
  };
}));

const namedCharacters = await Promise.all(CHARACTERS.map(async (character) => {
  const directory = factionDirectories[character.factionId];
  if (!directory) throw new Error(`No art directory mapping for faction ${character.factionId}`);
  const fileSlug = characterFileSlugs[character.id] || slug(character.id);
  const repositoryDirectory = `assets/characters/npcs/${directory}`;
  return {
    id: character.id,
    factionId: character.factionId,
    regionId: character.region,
    conceptMaster: await highestVersionAsset(repositoryDirectory, fileSlug),
    transparentCutout: await highestVersionAsset(repositoryDirectory, fileSlug, true),
  };
}));

const individualBestiaryForms = await Promise.all(BESTIARY.map(async (form) => {
  const directory = `assets/bestiary/forms/${slug(form.familyId)}`;
  const fileSlug = slug(form.id);
  return {
    id: form.id,
    familyId: form.familyId,
    rank: form.rank,
    conceptMaster: await highestVersionAsset(directory, fileSlug),
    transparentCutout: await highestVersionAsset(directory, fileSlug, true),
  };
}));

const count = (rows, key) => rows.filter((row) => typeof row[key] === 'string').length;

const rebuilt = {
  schema: 'SableReachArtIndexV1',
  auditedOn: '2026-08-29',
  playableOrigins,
  namedCharacters,
  bestiaryFamilies: existing.bestiaryFamilies,
  individualBestiaryForms,
  coverage: {
    namedCharacters: {
      subjects: namedCharacters.length,
      conceptMasters: count(namedCharacters, 'conceptMaster'),
      transparentCutouts: count(namedCharacters, 'transparentCutout'),
    },
    individualBestiaryForms: {
      subjects: individualBestiaryForms.length,
      conceptMasters: count(individualBestiaryForms, 'conceptMaster'),
      transparentCutouts: count(individualBestiaryForms, 'transparentCutout'),
    },
  },
  maturity: {
    conceptMasters: 'authored',
    transparentCutouts: 'prototype_billboards',
    runtimeIntegrated: true,
    productionAssets: false,
  },
};

await writeFile(indexPath, `${JSON.stringify(rebuilt, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(rebuilt.coverage));
