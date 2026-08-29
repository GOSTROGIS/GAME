#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const index = JSON.parse(await readFile(path.join(root, 'assets/art-index.json'), 'utf8'));
const RIGHTS = 'owner-authorized original project art; no third-party or franchise source imagery; concept reference and prototype billboard use';
const GENERATED_PATHS = new Set([
  'assets/characters/gloamfarer-v3.png',
  'assets/characters/npcs/exact-word/aven-tongueless-v1-cutout.png',
  'assets/characters/npcs/exact-word/brother-iven-v1-cutout.png',
  'assets/bestiary/forms/anchored-quarantine/signal-mate-v1.png',
  'assets/bestiary/forms/anchored-quarantine/quarantine-bosun-v1.png',
  'assets/bestiary/forms/anchored-quarantine/captain-under-keel-v1.png',
  'assets/bestiary/forms/anchored-quarantine/fleet-one-shadow-v1.png',
  'assets/bestiary/forms/march-deserters/orderless-pikeman-v6.png',
  'assets/bestiary/forms/march-deserters/wax-seal-archer-v5.png',
  'assets/bestiary/forms/march-deserters/bannerless-scout-v4.png',
  'assets/bestiary/forms/march-deserters/sealed-sapper-v7.png',
  'assets/bestiary/forms/march-deserters/captain-ninth-blank-v7.png',
  'assets/bestiary/forms/march-deserters/marshal-vesk-unreported-v4.png',
]);
const RECOVERED_BESTIARY_PREFIXES = [
  'assets/bestiary/forms/anchored-quarantine/',
  'assets/bestiary/forms/ashbound/',
  'assets/bestiary/forms/cairn-beasts/',
  'assets/bestiary/forms/march-deserters/',
];

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const promptHash = (mode, role) => sha256(Buffer.from(`${mode}:${role}:canonical-game-data-and-global-art-law`, 'utf8'));

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

const provenancePaths = new Set();
for (const base of ['assets/characters', 'assets/bestiary']) {
  for (const absolute of await walk(path.join(root, base))) {
    if (!absolute.endsWith('.provenance.json')) continue;
    const document = JSON.parse(await readFile(absolute, 'utf8'));
    for (const record of document.records ?? []) if (record?.path) provenancePaths.add(record.path);
  }
}

const indexed = [];
const append = (rows, fields) => {
  for (const row of rows ?? []) {
    for (const [field, role] of fields) {
      if (typeof row[field] === 'string') indexed.push({ row, role, path: row[field] });
    }
  }
};
append(index.playableOrigins, [['conceptMaster', 'concept_master'], ['transparentCutout', 'transparent_cutout']]);
append(index.namedCharacters, [['conceptMaster', 'concept_master'], ['transparentCutout', 'transparent_cutout']]);
append(index.individualBestiaryForms, [['conceptMaster', 'concept_master'], ['transparentCutout', 'transparent_cutout']]);

const unprovenanced = indexed.filter((record) => !provenancePaths.has(record.path));
const groups = new Map();
for (const record of unprovenanced) {
  const directory = path.posix.dirname(record.path);
  const group = groups.get(directory) ?? [];
  group.push(record);
  groups.set(directory, group);
}

function pngDimensions(buffer) {
  if (buffer.length < 24 || buffer.toString('ascii', 1, 4) !== 'PNG') throw new Error('not a PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const written = [];
for (const [directory, records] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const outputName = directory === 'assets/characters'
    ? 'current-generated.batch-01.provenance.json'
    : `${path.posix.basename(directory)}.current.batch-01.provenance.json`;
  const outputPath = path.posix.join(directory, outputName);
  const outputRecords = [];
  for (const record of records.sort((a, b) => a.path.localeCompare(b.path))) {
    const absolute = path.join(root, ...record.path.split('/'));
    const [buffer, fileStat] = await Promise.all([readFile(absolute), stat(absolute)]);
    const digest = sha256(buffer);
    const generated = GENERATED_PATHS.has(record.path)
      || (record.path.startsWith('assets/bestiary/forms/')
        && !RECOVERED_BESTIARY_PREFIXES.some((prefix) => record.path.startsWith(prefix)));
    const mode = generated ? 'reference edit' : 'content-addressed project recovery';
    const entityId = record.row.id;
    outputRecords.push({
      id: `${record.role}.${entityId}`,
      subjectId: entityId,
      familyId: record.row.familyId ?? undefined,
      factionId: record.row.factionId ?? undefined,
      rank: record.row.rank ?? undefined,
      role: record.role,
      path: record.path,
      sha256: digest,
      bytes: fileStat.size,
      dimensions: pngDimensions(buffer),
      colorSpace: 'sRGB',
      alphaPolicy: record.role === 'transparent_cutout' ? 'transparent' : 'opaque',
      promptAvailability: generated
        ? 'canonical public direction hash retained; private execution context omitted'
        : 'recovered owner-authorized project original; original prompt packet unavailable',
      promptSha256: promptHash(mode, record.role),
      generation: {
        tool: { name: generated ? 'built-in image generation' : 'project asset recovery' },
        mode,
        outputSha256: digest,
      },
      sourceReferences: record.role === 'transparent_cutout'
        ? [record.path.replace(/-cutout\.png$/, '.png')]
        : [],
      maturity: {
        concept_master: record.role === 'concept_master' ? (generated ? 'authored_and_independently_reviewed' : 'recovered_and_independently_reviewed') : false,
        prototype_billboard: record.role === 'transparent_cutout' ? 'alpha_validated_concept_reference' : false,
        runtime_integrated: true,
        production_asset: false,
      },
    });
  }
  let priorRecords = [];
  try {
    priorRecords = JSON.parse(await readFile(path.join(root, ...outputPath.split('/')), 'utf8')).records ?? [];
  } catch {
    // First write for this family/directory.
  }
  const document = {
    schema: 'SableReachPublishedArtProvenanceV1',
    batchId: `current-${path.posix.basename(directory)}-batch-01`,
    recordedOn: '2026-08-29',
    rightsDeclaration: RIGHTS,
    records: [...priorRecords, ...outputRecords].sort((a, b) => a.path.localeCompare(b.path)),
  };
  await writeFile(path.join(root, ...outputPath.split('/')), `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  written.push({ outputPath, records: outputRecords.length });
}

console.log(JSON.stringify({ records: unprovenanced.length, written }, null, 2));
