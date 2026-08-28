import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { deflateSync } from "node:zlib";

import { inspectPng, validateRasterArt } from "../tools/assets/validate-raster-art.mjs";

const crcTable = Array.from({ length: 256 }, (_, value) => {
  let current = value;
  for (let bit = 0; bit < 8; bit += 1) current = (current & 1) ? (0xedb88320 ^ (current >>> 1)) : (current >>> 1);
  return current >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const output = Buffer.alloc(data.length + 12);
  output.writeUInt32BE(data.length, 0);
  typeBytes.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length);
  return output;
}

function png(width, height, colorType, pixelAt) {
  const channels = colorType === 6 ? 4 : 3;
  const rows = Buffer.alloc(height * (1 + width * channels));
  let offset = 0;
  for (let y = 0; y < height; y += 1) {
    rows[offset++] = 0;
    for (let x = 0; x < width; x += 1) {
      for (const value of pixelAt(x, y)) rows[offset++] = value;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = colorType;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function indexedPng(width, height, indexAt) {
  const rows = Buffer.alloc(height * (1 + width));
  let offset = 0;
  for (let y = 0; y < height; y += 1) {
    rows[offset++] = 0;
    for (let x = 0; x < width; x += 1) rows[offset++] = indexAt(x, y);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 3;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("PLTE", Buffer.from([0, 0, 0, 90, 75, 60])),
    chunk("tRNS", Buffer.from([0, 255])),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const root = await mkdtemp(path.join(os.tmpdir(), "sable-raster-test-"));
await mkdir(path.join(root, "assets/characters"), { recursive: true });
await mkdir(path.join(root, "assets/bestiary"), { recursive: true });

const master = png(16, 24, 2, () => [35, 29, 25]);
const cutout = png(16, 24, 6, (x, y) => {
  const subject = x >= 4 && x <= 11 && y >= 3 && y <= 21;
  return subject ? [90, 75, 60, 255] : [0, 0, 0, 0];
});
assert.deepEqual(inspectPng(master), { width: 16, height: 24, bitDepth: 8, colorType: 2, interlace: 0, hasAlphaChannel: false });
assert.equal(inspectPng(cutout, { inspectAlpha: true }).cornerAlpha.every((alpha) => alpha === 0), true);
const indexedCutout = indexedPng(16, 24, (x, y) => (x >= 4 && x <= 11 && y >= 3 && y <= 21 ? 1 : 0));
const indexedInspection = inspectPng(indexedCutout, { inspectAlpha: true });
assert.equal(indexedInspection.hasAlphaChannel, true);
assert.equal(indexedInspection.cornerAlpha.every((alpha) => alpha === 0), true);

const masterPath = "assets/characters/test-origin-v2.png";
const cutoutPath = "assets/characters/test-origin-v2-cutout.png";
await writeFile(path.join(root, masterPath), master);
await writeFile(path.join(root, cutoutPath), cutout);
await writeFile(path.join(root, "assets/art-index.json"), JSON.stringify({
  schema: "SableReachArtIndexV1",
  playableOrigins: [{ id: "test_origin", conceptMaster: masterPath, transparentCutout: cutoutPath }],
  bestiaryFamilies: [],
}));
const entry = (filePath, role, buffer, alphaPolicy) => ({
  id: `test.${role}`,
  role,
  path: filePath,
  sha256: createHash("sha256").update(buffer).digest("hex"),
  bytes: buffer.length,
  dimensions: { width: 16, height: 24 },
  colorSpace: "sRGB",
  alphaPolicy,
  generation: { sourceImageId: `fixture-${role}` },
  prompt: { file: "fixture", section: role },
  maturity: { concept_master: role === "concept_master", prototype_billboard: role === "transparent_cutout", runtime_integrated: false, production_asset: false },
});
await writeFile(path.join(root, "assets/characters/test.provenance.json"), JSON.stringify({
  rightsDeclaration: "test fixture only",
  records: [entry(masterPath, "concept_master", master, "opaque"), entry(cutoutPath, "transparent_cutout", cutout, "transparent")],
}));

const accepted = await validateRasterArt({ rootDir: root, minShortSide: 1, maxLongSide: 64, maxBytes: 100000 });
assert.equal(accepted.valid, true, JSON.stringify(accepted.errors));

const broken = Buffer.from(await readFile(path.join(root, cutoutPath)));
broken[0] = 0;
await writeFile(path.join(root, cutoutPath), broken);
const rejected = await validateRasterArt({ rootDir: root, minShortSide: 1, maxLongSide: 64, maxBytes: 100000 });
assert.equal(rejected.valid, false);
assert.equal(rejected.errors.some(({ code }) => code === "invalid_png"), true);

console.log("raster-art-validator: valid master/cutout pair accepted and corrupt PNG rejected");
