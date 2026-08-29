#!/usr/bin/env node

import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { PROHIBITED_PNG_CHUNKS } from './png-metadata-policy.mjs';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const PROHIBITED = new Set(PROHIBITED_PNG_CHUNKS);

const usage = () => {
  console.error('usage: node tools/assets/strip-prohibited-png-chunks.mjs --in-place <png> [<png> ...]');
  process.exitCode = 2;
};

const args = process.argv.slice(2);
if (args.shift() !== '--in-place' || args.length === 0) {
  usage();
} else {
  let failed = false;
  for (const input of args) {
    try {
      const original = await readFile(input);
      if (original.length < PNG_SIGNATURE.length || !original.subarray(0, 8).equals(PNG_SIGNATURE)) {
        throw new Error('not a PNG file');
      }

      const kept = [original.subarray(0, 8)];
      const removed = [];
      let offset = 8;
      let sawIend = false;

      while (offset < original.length) {
        if (offset + 12 > original.length) throw new Error(`truncated chunk header at byte ${offset}`);
        const length = original.readUInt32BE(offset);
        const end = offset + 12 + length;
        if (end > original.length) throw new Error(`truncated chunk payload at byte ${offset}`);

        const type = original.toString('ascii', offset + 4, offset + 8);
        const chunk = original.subarray(offset, end);
        if (PROHIBITED.has(type)) removed.push({ type, bytes: chunk.length });
        else kept.push(chunk);

        offset = end;
        if (type === 'IEND') {
          sawIend = true;
          if (offset !== original.length) throw new Error(`trailing bytes after IEND: ${original.length - offset}`);
          break;
        }
      }

      if (!sawIend) throw new Error('missing IEND');
      if (removed.length === 0) {
        console.log(JSON.stringify({ file: input, changed: false, removed: [] }));
        continue;
      }

      const sanitized = Buffer.concat(kept);
      const temp = path.join(path.dirname(input), `.${path.basename(input)}.redacting-${process.pid}`);
      await writeFile(temp, sanitized, { flag: 'wx' });
      await rename(temp, input);
      console.log(JSON.stringify({ file: input, changed: true, before: original.length, after: sanitized.length, removed }));
    } catch (error) {
      failed = true;
      console.error(`${input}: ${error.message}`);
    }
  }
  if (failed) process.exitCode = 1;
}
