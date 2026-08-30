import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { deflateSync } from "node:zlib";

import { inspectPng, validateRasterArt } from "../tools/assets/validate-raster-art.mjs";

const execFileAsync = promisify(execFile);

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

function png(width, height, colorType, pixelAt, metadataChunks = []) {
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
    ...metadataChunks.map(([type, data]) => chunk(type, data)),
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
await mkdir(path.join(root, "assets/world"), { recursive: true });

const master = png(16, 24, 2, () => [35, 29, 25]);
const cutout = png(16, 24, 6, (x, y) => {
  const subject = x >= 4 && x <= 11 && y >= 3 && y <= 21;
  return subject ? [90, 75, 60, 255] : [0, 0, 0, 0];
});
assert.deepEqual(inspectPng(master), {
  width: 16,
  height: 24,
  bitDepth: 8,
  colorType: 2,
  interlace: 0,
  hasAlphaChannel: false,
  chunkTypes: ["IHDR", "IDAT", "IEND"],
  hasSrgbChunk: false,
  hasIccProfile: false,
});
assert.equal(inspectPng(cutout, { inspectAlpha: true }).cornerAlpha.every((alpha) => alpha === 0), true);
const privateMetadata = png(16, 24, 2, () => [35, 29, 25], [["tEXt", Buffer.from("author\0private")]]);
assert.throws(() => inspectPng(privateMetadata), /prohibited PNG metadata/);
const contentCredentials = png(16, 24, 2, () => [35, 29, 25], [["caBX", Buffer.from("urn:c2pa:00000000-0000-0000-0000-000000000000")]]);
assert.throws(() => inspectPng(contentCredentials), /prohibited PNG metadata chunks: caBX/);
const credentialPath = path.join(root, "credential.png");
await writeFile(credentialPath, contentCredentials);
await execFileAsync(process.execPath, [fileURLToPath(new URL("../tools/assets/strip-prohibited-png-chunks.mjs", import.meta.url)), "--in-place", credentialPath]);
assert.deepEqual(await readFile(credentialPath), master, "metadata stripper must preserve every non-prohibited PNG byte");
const indexedCutout = indexedPng(16, 24, (x, y) => (x >= 4 && x <= 11 && y >= 3 && y <= 21 ? 1 : 0));
const indexedInspection = inspectPng(indexedCutout, { inspectAlpha: true });
assert.equal(indexedInspection.hasAlphaChannel, true);
assert.equal(indexedInspection.cornerAlpha.every((alpha) => alpha === 0), true);

const masterPath = "assets/characters/test-origin-v2.png";
const cutoutPath = "assets/characters/test-origin-v2-cutout.png";
const worldPath = "assets/world/test-environment.png";
await writeFile(path.join(root, masterPath), master);
await writeFile(path.join(root, cutoutPath), cutout);
await writeFile(path.join(root, worldPath), master);
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
  generation: { outputSha256: createHash("sha256").update(buffer).digest("hex"), tool: { name: "fixture generator" } },
  prompt: { file: "fixture", section: role },
  maturity: { concept_master: role === "concept_master", prototype_billboard: role === "transparent_cutout", runtime_integrated: false, production_asset: false },
});
await writeFile(path.join(root, "assets/characters/test.provenance.json"), JSON.stringify({
  rightsDeclaration: "test fixture only",
  records: [entry(masterPath, "concept_master", master, "opaque"), entry(cutoutPath, "transparent_cutout", cutout, "transparent")],
}));
await writeFile(path.join(root, "assets/world/test.provenance.json"), JSON.stringify({
  rightsDeclaration: "test fixture only",
  records: [entry(worldPath, "environment_keyframe", master, "opaque")],
}));

const accepted = await validateRasterArt({ rootDir: root, minShortSide: 1, maxLongSide: 64, maxBytes: 100000 });
assert.equal(accepted.valid, true, JSON.stringify(accepted.errors));
const metadataOnly = await validateRasterArt({ rootDir: root, minShortSide: 1, maxLongSide: 64, maxBytes: 100000, strictProvenance: true, metadataOnly: true });
assert.equal(metadataOnly.valid, true, JSON.stringify(metadataOnly.errors));
assert.equal(metadataOnly.summary.inspectedFiles, 0);
const changedOnly = await validateRasterArt({ rootDir: root, minShortSide: 1, maxLongSide: 64, maxBytes: 100000, strictProvenance: true, changedPaths: [cutoutPath] });
assert.equal(changedOnly.valid, true, JSON.stringify(changedOnly.errors));
assert.equal(changedOnly.summary.inspectedFiles, 1);
const changedWorld = await validateRasterArt({ rootDir: root, minShortSide: 1, maxLongSide: 64, maxBytes: 100000, strictProvenance: true, changedPaths: [worldPath] });
assert.equal(changedWorld.valid, true, JSON.stringify(changedWorld.errors));
assert.equal(changedWorld.summary.inspectedFiles, 1);

const provenancePath = path.join(root, "assets/characters/test.provenance.json");
const privateProvenance = JSON.parse(await readFile(provenancePath, "utf8"));
privateProvenance.records[0].generation.callId = "call_abcdefghijklmnop";
await writeFile(provenancePath, JSON.stringify(privateProvenance));
const privacyRejected = await validateRasterArt({ rootDir: root, minShortSide: 1, maxLongSide: 64, maxBytes: 100000, metadataOnly: true });
assert.equal(privacyRejected.valid, false);
assert.equal(privacyRejected.errors.some(({ code }) => code === "private_provenance_key"), true);
delete privateProvenance.records[0].generation.callId;
await writeFile(provenancePath, JSON.stringify(privateProvenance));

const broken = Buffer.from(await readFile(path.join(root, cutoutPath)));
broken[0] = 0;
await writeFile(path.join(root, cutoutPath), broken);
const rejected = await validateRasterArt({ rootDir: root, minShortSide: 1, maxLongSide: 64, maxBytes: 100000 });
assert.equal(rejected.valid, false);
assert.equal(rejected.errors.some(({ code }) => code === "invalid_png"), true);

console.log("raster-art-validator: character, bestiary, world, metadata-only, changed-path, privacy, and PNG metadata gates pass");
