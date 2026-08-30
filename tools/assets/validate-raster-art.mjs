#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { inflateSync } from "node:zlib";

import { PROHIBITED_PNG_CHUNKS } from "./png-metadata-policy.mjs";

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const DEFAULT_MIN_SHORT_SIDE = 768;
const DEFAULT_MAX_LONG_SIDE = 4096;
const DEFAULT_MAX_BYTES = 8 * 1024 * 1024;
const SHA256 = /^[a-f0-9]{64}$/i;
const PROHIBITED_PNG_METADATA = new Set(PROHIBITED_PNG_CHUNKS);
const FORBIDDEN_PROVENANCE_KEYS = /^(?:accountId|callId|driveId|externalId|folderId|providerAccountId|sessionId|signedUrl|sourceImageId|supersedesSourceImageId|supersedesRejectedSource|userName)$/i;
const FORBIDDEN_PROVENANCE_VALUES = [
  { code: "provider_execution_id", pattern: /(?:^|[^a-z0-9])(?:exec-[0-9a-f-]{20,}|call_[a-z0-9]{12,})(?:\.[a-z0-9]+)?(?:$|[^a-z0-9])/i },
  { code: "external_url", pattern: /https?:\/\//i },
  { code: "email_address", pattern: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i },
  { code: "absolute_path", pattern: /(?:^|\s)(?:[a-z]:[\\/]|\\\\)/i },
];
const execFileAsync = promisify(execFile);

const add = (items, code, filePath, message) => items.push({ code, path: filePath, message });

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

function paeth(left, above, upperLeft) {
  const prediction = left + above - upperLeft;
  const leftDistance = Math.abs(prediction - left);
  const aboveDistance = Math.abs(prediction - above);
  const upperLeftDistance = Math.abs(prediction - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  if (aboveDistance <= upperLeftDistance) return above;
  return upperLeft;
}

function decodeRows(compressed, width, height, bytesPerPixel) {
  const stride = width * bytesPerPixel;
  const encoded = inflateSync(compressed);
  const expected = height * (stride + 1);
  if (encoded.length !== expected) throw new Error(`decoded byte length ${encoded.length} does not match ${expected}`);
  const rows = Buffer.alloc(height * stride);
  let sourceOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = encoded[sourceOffset++];
    const rowOffset = y * stride;
    for (let x = 0; x < stride; x += 1) {
      const raw = encoded[sourceOffset++];
      const left = x >= bytesPerPixel ? rows[rowOffset + x - bytesPerPixel] : 0;
      const above = y > 0 ? rows[rowOffset - stride + x] : 0;
      const upperLeft = y > 0 && x >= bytesPerPixel ? rows[rowOffset - stride + x - bytesPerPixel] : 0;
      let value;
      if (filter === 0) value = raw;
      else if (filter === 1) value = raw + left;
      else if (filter === 2) value = raw + above;
      else if (filter === 3) value = raw + Math.floor((left + above) / 2);
      else if (filter === 4) value = raw + paeth(left, above, upperLeft);
      else throw new Error(`unsupported PNG row filter ${filter}`);
      rows[rowOffset + x] = value & 255;
    }
  }
  return { rows, stride };
}

export function inspectPng(buffer, { inspectAlpha = false } = {}) {
  if (buffer.length < 33 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error("invalid PNG signature");
  let offset = 8;
  let width;
  let height;
  let bitDepth;
  let colorType;
  let interlace;
  let paletteTransparency;
  const idat = [];
  const chunkTypes = [];
  const prohibitedMetadataChunks = [];
  let sawEnd = false;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > buffer.length) throw new Error(`truncated ${type} chunk`);
    const expectedCrc = buffer.readUInt32BE(dataEnd);
    const receivedCrc = crc32(buffer.subarray(offset + 4, dataEnd));
    if (receivedCrc !== expectedCrc) throw new Error(`${type} chunk CRC mismatch`);
    chunkTypes.push(type);
    if (PROHIBITED_PNG_METADATA.has(type)) prohibitedMetadataChunks.push(type);
    if (type === "IHDR") {
      if (chunkTypes.length !== 1 || length !== 13) throw new Error("IHDR must be the first chunk and contain 13 bytes");
      width = buffer.readUInt32BE(dataStart);
      height = buffer.readUInt32BE(dataStart + 4);
      bitDepth = buffer[dataStart + 8];
      colorType = buffer[dataStart + 9];
      const compression = buffer[dataStart + 10];
      const filter = buffer[dataStart + 11];
      interlace = buffer[dataStart + 12];
      if (compression !== 0 || filter !== 0 || ![0, 1].includes(interlace)) throw new Error("unsupported PNG encoding methods");
    } else if (type === "tRNS") paletteTransparency = buffer.subarray(dataStart, dataEnd);
    else if (type === "IDAT") idat.push(buffer.subarray(dataStart, dataEnd));
    else if (type === "IEND") {
      if (length !== 0) throw new Error("IEND chunk must be empty");
      sawEnd = true;
      offset = dataEnd + 4;
      break;
    }
    offset = dataEnd + 4;
  }
  if (!width || !height || bitDepth === undefined || !sawEnd || idat.length === 0) throw new Error("missing required PNG chunks");
  if (offset !== buffer.length) throw new Error("PNG contains trailing bytes after IEND");
  if (prohibitedMetadataChunks.length) throw new Error(`prohibited PNG metadata chunks: ${[...new Set(prohibitedMetadataChunks)].join(", ")}`);
  const result = {
    width,
    height,
    bitDepth,
    colorType,
    interlace,
    hasAlphaChannel: colorType === 4 || colorType === 6 || (colorType === 3 && Boolean(paletteTransparency?.length)),
    chunkTypes,
    hasSrgbChunk: chunkTypes.includes("sRGB"),
    hasIccProfile: chunkTypes.includes("iCCP"),
  };
  if (!inspectAlpha) return result;
  if (bitDepth !== 8 || interlace !== 0 || ![3, 4, 6].includes(colorType)) {
    throw new Error("cutout validation requires a non-interlaced 8-bit indexed-alpha, grayscale-alpha, or RGBA PNG");
  }
  if (colorType === 3 && !paletteTransparency?.length) throw new Error("indexed cutout PNG lacks a tRNS alpha table");
  const bytesPerPixel = colorType === 6 ? 4 : colorType === 4 ? 2 : 1;
  const alphaOffset = bytesPerPixel - 1;
  const { rows, stride } = decodeRows(Buffer.concat(idat), width, height, bytesPerPixel);
  let transparent = 0;
  let opaque = 0;
  let partial = 0;
  const alphaAt = colorType === 3
    ? (x, y) => paletteTransparency[rows[y * stride + x]] ?? 255
    : (x, y) => rows[y * stride + x * bytesPerPixel + alphaOffset];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = alphaAt(x, y);
      if (alpha === 0) transparent += 1;
      else if (alpha === 255) opaque += 1;
      else partial += 1;
    }
  }
  const pixels = width * height;
  return {
    ...result,
    transparentPixels: transparent,
    opaquePixels: opaque,
    partialAlphaPixels: partial,
    transparentRatio: transparent / pixels,
    opaqueRatio: opaque / pixels,
    visibleRatio: (opaque + partial) / pixels,
    cornerAlpha: [alphaAt(0, 0), alphaAt(width - 1, 0), alphaAt(0, height - 1), alphaAt(width - 1, height - 1)],
  };
}

async function walkFiles(directory) {
  const found = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const item = path.join(directory, entry.name);
      if (entry.isDirectory()) found.push(...await walkFiles(item));
      else if (entry.isFile()) found.push(item);
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return found;
}

function normalizedRelative(rootDir, candidate) {
  const absolute = path.resolve(rootDir, candidate);
  const relative = path.relative(rootDir, absolute).replaceAll(path.sep, "/");
  if (!relative || relative.startsWith("../") || path.isAbsolute(relative)) throw new Error("path escapes workspace root");
  return { absolute, relative };
}

function validatePublishedProvenance(value, relativeFile, errors, pointer = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => validatePublishedProvenance(item, relativeFile, errors, `${pointer}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      const itemPointer = `${pointer}.${key}`;
      if (FORBIDDEN_PROVENANCE_KEYS.test(key)) add(errors, "private_provenance_key", relativeFile, `${itemPointer} is not allowed in published provenance`);
      validatePublishedProvenance(item, relativeFile, errors, itemPointer);
    }
    return;
  }
  if (typeof value !== "string") return;
  for (const { code, pattern } of FORBIDDEN_PROVENANCE_VALUES) {
    if (pattern.test(value)) add(errors, `private_provenance_${code}`, relativeFile, `${pointer} contains ${code.replaceAll("_", " ")}`);
  }
}

async function changedRasterPaths(rootDir, baseRef) {
  const configuredRef = baseRef || process.env.RASTER_ART_BASE_SHA;
  const ref = configuredRef && !/^0+$/.test(configuredRef) ? configuredRef : "HEAD^";
  const { stdout } = await execFileAsync("git", [
    "diff",
    "--name-only",
    "--diff-filter=ACMR",
    `${ref}...HEAD`,
    "--",
    "assets/characters",
    "assets/bestiary",
    "assets/world",
  ], { cwd: rootDir, windowsHide: true });
  return stdout.split(/\r?\n/).map((item) => item.trim().replaceAll("\\", "/")).filter((item) => item.endsWith(".png"));
}

function indexedAssets(index) {
  const records = [];
  const append = (group, items, fields) => {
    for (const item of items ?? []) {
      for (const [field, kind] of fields) {
        if (item?.[field]) records.push({ group, id: item.id, kind, path: item[field] });
      }
    }
  };
  append("playableOrigins", index.playableOrigins, [["conceptMaster", "concept_master"], ["transparentCutout", "transparent_cutout"]]);
  append("namedCharacters", index.namedCharacters, [["conceptMaster", "concept_master"], ["transparentCutout", "transparent_cutout"]]);
  append("bestiaryFamilies", index.bestiaryFamilies, [["conceptPlate", "family_plate"]]);
  append("individualBestiaryForms", index.individualBestiaryForms, [["conceptMaster", "concept_master"], ["transparentCutout", "transparent_cutout"]]);
  return records;
}

async function loadProvenance(rootDir, errors) {
  const files = (await Promise.all([
    walkFiles(path.join(rootDir, "assets/characters")),
    walkFiles(path.join(rootDir, "assets/bestiary")),
    walkFiles(path.join(rootDir, "assets/world")),
  ])).flat().filter((item) => item.endsWith(".provenance.json"));
  const byPath = new Map();
  for (const file of files) {
    const relativeFile = path.relative(rootDir, file).replaceAll(path.sep, "/");
    try {
      const document = JSON.parse(await readFile(file, "utf8"));
      validatePublishedProvenance(document, relativeFile, errors);
      for (const record of document.records ?? []) {
        if (!record?.path) continue;
        if (byPath.has(record.path)) add(errors, "duplicate_provenance", record.path, `also declared by ${relativeFile}`);
        byPath.set(record.path, {
          ...record,
          rightsDeclaration: record.rightsDeclaration ?? document.rightsDeclaration,
          maturity: record.maturity ?? document.maturity,
          promptSource: record.promptSource ?? document.promptSource,
          promptAvailability: record.promptAvailability ?? document.promptAvailability,
          provenanceFile: relativeFile,
        });
      }
    } catch (error) {
      add(errors, "invalid_provenance", relativeFile, error.message);
    }
  }
  return byPath;
}

export async function validateRasterArt({
  rootDir,
  indexPath = "assets/art-index.json",
  minShortSide = DEFAULT_MIN_SHORT_SIDE,
  maxLongSide = DEFAULT_MAX_LONG_SIDE,
  maxBytes = DEFAULT_MAX_BYTES,
  strictProvenance = false,
  metadataOnly = false,
  changedPaths = [],
  changedSince,
} = {}) {
  const errors = [];
  const warnings = [];
  const workspace = path.resolve(rootDir ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."));
  let index;
  try {
    index = JSON.parse(await readFile(path.resolve(workspace, indexPath), "utf8"));
  } catch (error) {
    return { valid: false, errors: [{ code: "invalid_art_index", path: indexPath, message: error.message }], warnings, summary: {} };
  }
  const provenance = await loadProvenance(workspace, errors);
  const provenanceIssue = (code, filePath, message) => add(strictProvenance ? errors : warnings, code, filePath, message);
  const records = indexedAssets(index);
  const selectedPaths = new Set();
  for (const candidate of changedPaths ?? []) {
    try {
      selectedPaths.add(normalizedRelative(workspace, candidate).relative);
    } catch (error) {
      add(errors, "unsafe_changed_art_path", candidate, error.message);
    }
  }
  if (changedSince !== undefined) {
    try {
      for (const candidate of await changedRasterPaths(workspace, changedSince)) selectedPaths.add(candidate);
    } catch (error) {
      add(errors, "changed_art_discovery", changedSince || "RASTER_ART_BASE_SHA", error.message);
    }
  }
  const selectedPayloadMode = changedSince !== undefined || selectedPaths.size > 0;
  const seenPaths = new Set();
  const seenKeys = new Set();
  let totalBytes = 0;
  let masters = 0;
  let cutouts = 0;
  let familyPlates = 0;
  let inspectedFiles = 0;

  const validateSourceMetadata = (record, source) => {
    if (!SHA256.test(source.sha256 ?? "")) provenanceIssue("missing_raster_hash", source.provenanceFile, `${record.path} lacks sha256`);
    if (!Number.isInteger(source.bytes) || source.bytes < 1) provenanceIssue("missing_raster_bytes", source.provenanceFile, `${record.path} lacks a positive byte size`);
    else totalBytes += source.bytes;
    if (!Number.isInteger(source.dimensions?.width) || !Number.isInteger(source.dimensions?.height)) provenanceIssue("missing_raster_dimensions", source.provenanceFile, `${record.path} lacks integer dimensions`);
    const expectedAlpha = record.kind === "transparent_cutout" ? "transparent" : "opaque";
    const acceptedAlphaPolicies = record.kind === "transparent_cutout"
      ? new Set(["transparent", "transparent_cutout"])
      : new Set(["opaque"]);
    if (!source.alphaPolicy) provenanceIssue("missing_raster_alpha_policy", source.provenanceFile, `${record.path} lacks alpha policy`);
    else if (!acceptedAlphaPolicies.has(source.alphaPolicy)) add(errors, "raster_alpha_policy", record.path, `expected ${expectedAlpha} provenance`);
    if (!source.colorSpace) provenanceIssue("missing_raster_color_space", source.provenanceFile, `${record.path} lacks color space`);
    else if (source.colorSpace !== "sRGB") add(errors, "raster_color_space", record.path, "provenance must declare sRGB");
    if (!source.rightsDeclaration) provenanceIssue("missing_raster_rights", source.provenanceFile, `${record.path} lacks a rights declaration`);
    const lineageHash = source.generation?.outputSha256 ?? source.lineage?.contentSha256 ?? source.contentSha256;
    if (!SHA256.test(lineageHash ?? "")) provenanceIssue("missing_raster_lineage", source.provenanceFile, `${record.path} lacks content-hash lineage`);
    else if (SHA256.test(source.sha256 ?? "") && lineageHash.toLowerCase() !== source.sha256.toLowerCase()) add(errors, "raster_lineage_mismatch", record.path, "lineage content hash disagrees with the declared PNG hash");
    if (!source.prompt && !source.promptSource && !source.promptAvailability) provenanceIssue("missing_raster_direction", source.provenanceFile, `${record.path} lacks prompt or recovery-direction evidence`);
    if (!source.maturity) provenanceIssue("missing_raster_maturity", source.provenanceFile, `${record.path} lacks maturity flags`);
  };

  const validatePayload = async (record, resolved, source) => {
    let buffer;
    let fileStat;
    try {
      [buffer, fileStat] = await Promise.all([readFile(resolved.absolute), stat(resolved.absolute)]);
    } catch (error) {
      add(errors, "missing_art", record.path, error.message);
      return;
    }
    inspectedFiles += 1;
    if (fileStat.size > maxBytes) add(errors, "raster_file_budget", record.path, `${fileStat.size} bytes exceeds ${maxBytes}`);
    let png;
    try {
      png = inspectPng(buffer, { inspectAlpha: record.kind === "transparent_cutout" });
      if (record.kind !== "transparent_cutout" && png.hasAlphaChannel) png = inspectPng(buffer, { inspectAlpha: true });
    } catch (error) {
      add(errors, "invalid_png", record.path, error.message);
      return;
    }
    if (png.hasSrgbChunk && png.hasIccProfile) add(errors, "conflicting_png_color_profiles", record.path, "PNG may declare either sRGB or an ICC profile, not both");
    if (Math.min(png.width, png.height) < minShortSide || Math.max(png.width, png.height) > maxLongSide) {
      add(errors, "raster_dimensions", record.path, `${png.width}x${png.height} is outside the ${minShortSide}-${maxLongSide} side limits`);
    }
    if (record.kind === "transparent_cutout") {
      if (!png.hasAlphaChannel || png.transparentRatio < 0.03 || png.visibleRatio < 0.03) add(errors, "invalid_cutout_alpha", record.path, "cutout needs substantial transparent background and visible subject pixels");
      if (png.cornerAlpha.some((alpha) => alpha > 4)) add(errors, "opaque_cutout_corner", record.path, `corner alpha values are ${png.cornerAlpha.join(",")}`);
    } else if (png.hasAlphaChannel && png.transparentRatio > 0) {
      add(errors, "nonopaque_master", record.path, "concept masters and family plates must contain no transparent pixels");
    }
    const digest = createHash("sha256").update(buffer).digest("hex");
    if (SHA256.test(source.sha256 ?? "") && source.sha256.toLowerCase() !== digest) add(errors, "raster_hash_mismatch", record.path, `expected ${source.sha256}, received ${digest}`);
    if (Number.isInteger(source.bytes) && source.bytes !== fileStat.size) add(errors, "raster_byte_mismatch", record.path, `expected ${source.bytes}, received ${fileStat.size}`);
    if (source.dimensions && (source.dimensions.width !== png.width || source.dimensions.height !== png.height)) add(errors, "raster_dimension_mismatch", record.path, "PNG dimensions disagree with provenance");
  };

  for (const record of records) {
    const key = `${record.group}:${record.id}:${record.kind}`;
    if (seenKeys.has(key)) add(errors, "duplicate_index_record", record.path, key);
    seenKeys.add(key);
    let resolved;
    try {
      resolved = normalizedRelative(workspace, record.path);
    } catch (error) {
      add(errors, "unsafe_art_path", record.path, error.message);
      continue;
    }
    if (!resolved.relative.startsWith("assets/characters/") && !resolved.relative.startsWith("assets/bestiary/")) {
      add(errors, "invalid_art_directory", record.path, "indexed character and bestiary raster art must stay in its canonical asset directory");
    }
    if (!resolved.relative.endsWith(".png")) add(errors, "invalid_art_extension", record.path, "indexed raster art must be PNG");
    if (record.kind === "transparent_cutout" && !resolved.relative.endsWith("-cutout.png")) add(errors, "invalid_cutout_name", record.path, "cutout path must end in -cutout.png");
    if (seenPaths.has(resolved.relative)) add(errors, "duplicate_art_path", record.path, "the same file is indexed more than once");
    seenPaths.add(resolved.relative);
    if (record.kind === "transparent_cutout") cutouts += 1;
    else if (record.kind === "family_plate") familyPlates += 1;
    else masters += 1;

    const source = provenance.get(resolved.relative);
    if (!source) {
      add(errors, "missing_raster_provenance", record.path, "no provenance record declares this indexed file");
      continue;
    }
    validateSourceMetadata(record, source);
    try {
      await access(resolved.absolute);
    } catch (error) {
      add(errors, "missing_art", record.path, error.message);
      continue;
    }
    if (!metadataOnly && (!selectedPayloadMode || selectedPaths.has(resolved.relative))) await validatePayload(record, resolved, source);
  }

  const rasterFiles = (await Promise.all([
    walkFiles(path.join(workspace, "assets/characters")),
    walkFiles(path.join(workspace, "assets/bestiary")),
  ])).flat().filter((item) => item.endsWith(".png")).map((item) => path.relative(workspace, item).replaceAll(path.sep, "/"));
  for (const file of rasterFiles) {
    if (!seenPaths.has(file) && !provenance.has(file)) add(errors, "orphan_raster_art", file, "PNG is neither indexed nor declared as a provenance-tracked alternate");
  }
  if (!metadataOnly && selectedPayloadMode) {
    for (const file of selectedPaths) {
      if (seenPaths.has(file)) continue;
      const source = provenance.get(file);
      if (!source) {
        add(errors, "untracked_changed_raster", file, "changed PNG is not indexed or provenance-tracked");
        continue;
      }
      const kind = source.role === "transparent_cutout" || file.endsWith("-cutout.png") ? "transparent_cutout" : source.role === "family_plate" ? "family_plate" : "concept_master";
      const record = { group: "provenanceAlternates", id: source.id ?? file, kind, path: file };
      validateSourceMetadata(record, source);
      await validatePayload(record, normalizedRelative(workspace, file), source);
    }
  }
  for (const sourcePath of provenance.keys()) {
    try {
      await access(path.resolve(workspace, sourcePath));
    } catch {
      add(errors, "stale_raster_provenance", sourcePath, "provenance points to a missing file");
    }
  }

  const summary = { indexedFiles: records.length, conceptMasters: masters, transparentCutouts: cutouts, familyPlates, totalBytes, provenanceRecords: provenance.size, inspectedFiles, metadataOnly };
  return { valid: errors.length === 0, errors, warnings, summary };
}

function parseArgs(argv) {
  const options = { json: false, strictProvenance: false, metadataOnly: false, changedPaths: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--json") options.json = true;
    else if (argument === "--strict-provenance") options.strictProvenance = true;
    else if (argument === "--metadata-only") options.metadataOnly = true;
    else if (argument === "--changed-path") options.changedPaths.push(argv[++index]);
    else if (argument === "--changed-since") {
      const candidate = argv[index + 1];
      options.changedSince = candidate && !candidate.startsWith("--") ? argv[++index] : "";
    }
    else if (argument === "--root") options.rootDir = path.resolve(argv[++index]);
    else if (argument === "--index") options.indexPath = argv[++index];
    else throw new Error(`Unknown argument ${argument}`);
  }
  return options;
}

function printHuman(result) {
  console.log(`${result.valid ? "PASS" : "FAIL"} Sable Reach raster-art validation`);
  if (result.summary.indexedFiles !== undefined) {
    console.log(`  ${result.summary.indexedFiles} indexed PNGs · ${result.summary.conceptMasters} subject masters · ${result.summary.transparentCutouts} cutouts · ${result.summary.familyPlates} family plates`);
    console.log(`  ${result.summary.provenanceRecords} provenance records · ${result.summary.totalBytes} indexed bytes · ${result.summary.inspectedFiles} payloads inspected${result.summary.metadataOnly ? " (metadata-only)" : ""}`);
  }
  for (const warning of result.warnings) console.log(`WARN [${warning.code}] ${warning.path}: ${warning.message}`);
  for (const error of result.errors) console.error(`ERROR [${error.code}] ${error.path}: ${error.message}`);
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = await validateRasterArt(options);
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else printHuman(result);
    if (!result.valid) process.exitCode = 1;
  } catch (error) {
    console.error(`Sable Reach raster-art validation could not run: ${error.message}`);
    process.exitCode = 1;
  }
}
