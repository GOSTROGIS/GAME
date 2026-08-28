#!/usr/bin/env node

import { createHash } from "node:crypto";
import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { inflateSync } from "node:zlib";

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const DEFAULT_MIN_SHORT_SIDE = 768;
const DEFAULT_MAX_LONG_SIDE = 4096;
const DEFAULT_MAX_BYTES = 8 * 1024 * 1024;

const add = (items, code, filePath, message) => items.push({ code, path: filePath, message });

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
  let sawEnd = false;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > buffer.length) throw new Error(`truncated ${type} chunk`);
    if (type === "IHDR") {
      width = buffer.readUInt32BE(dataStart);
      height = buffer.readUInt32BE(dataStart + 4);
      bitDepth = buffer[dataStart + 8];
      colorType = buffer[dataStart + 9];
      interlace = buffer[dataStart + 12];
    } else if (type === "tRNS") paletteTransparency = buffer.subarray(dataStart, dataEnd);
    else if (type === "IDAT") idat.push(buffer.subarray(dataStart, dataEnd));
    else if (type === "IEND") {
      sawEnd = true;
      break;
    }
    offset = dataEnd + 4;
  }
  if (!width || !height || bitDepth === undefined || !sawEnd) throw new Error("missing required PNG chunks");
  const result = {
    width,
    height,
    bitDepth,
    colorType,
    interlace,
    hasAlphaChannel: colorType === 4 || colorType === 6 || (colorType === 3 && Boolean(paletteTransparency?.length)),
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
  ])).flat().filter((item) => item.endsWith(".provenance.json"));
  const byPath = new Map();
  for (const file of files) {
    const relativeFile = path.relative(rootDir, file).replaceAll(path.sep, "/");
    try {
      const document = JSON.parse(await readFile(file, "utf8"));
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
  const seenPaths = new Set();
  const seenKeys = new Set();
  let totalBytes = 0;
  let masters = 0;
  let cutouts = 0;
  let familyPlates = 0;

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

    let buffer;
    let fileStat;
    try {
      [buffer, fileStat] = await Promise.all([readFile(resolved.absolute), stat(resolved.absolute)]);
    } catch (error) {
      add(errors, "missing_art", record.path, error.message);
      continue;
    }
    totalBytes += fileStat.size;
    if (fileStat.size > maxBytes) add(errors, "raster_file_budget", record.path, `${fileStat.size} bytes exceeds ${maxBytes}`);
    let png;
    try {
      png = inspectPng(buffer, { inspectAlpha: record.kind === "transparent_cutout" });
    } catch (error) {
      add(errors, "invalid_png", record.path, error.message);
      continue;
    }
    if (Math.min(png.width, png.height) < minShortSide || Math.max(png.width, png.height) > maxLongSide) {
      add(errors, "raster_dimensions", record.path, `${png.width}x${png.height} is outside the ${minShortSide}-${maxLongSide} side limits`);
    }
    if (record.kind === "transparent_cutout") {
      cutouts += 1;
      if (!png.hasAlphaChannel || png.transparentRatio < 0.03 || png.visibleRatio < 0.03) add(errors, "invalid_cutout_alpha", record.path, "cutout needs substantial transparent background and visible subject pixels");
      if (png.cornerAlpha.some((alpha) => alpha > 4)) add(errors, "opaque_cutout_corner", record.path, `corner alpha values are ${png.cornerAlpha.join(",")}`);
    } else if (record.kind === "family_plate") familyPlates += 1;
    else masters += 1;

    const source = provenance.get(resolved.relative);
    if (!source) {
      add(errors, "missing_raster_provenance", record.path, "no provenance record declares this indexed file");
      continue;
    }
    const digest = createHash("sha256").update(buffer).digest("hex");
    if (!/^[a-f0-9]{64}$/i.test(source.sha256 ?? "")) provenanceIssue("missing_raster_hash", source.provenanceFile, `${record.path} lacks sha256`);
    else if (source.sha256.toLowerCase() !== digest) add(errors, "raster_hash_mismatch", record.path, `expected ${source.sha256}, received ${digest}`);
    if (!Number.isInteger(source.bytes)) provenanceIssue("missing_raster_bytes", source.provenanceFile, `${record.path} lacks byte size`);
    else if (source.bytes !== fileStat.size) add(errors, "raster_byte_mismatch", record.path, `expected ${source.bytes}, received ${fileStat.size}`);
    if (!source.dimensions) provenanceIssue("missing_raster_dimensions", source.provenanceFile, `${record.path} lacks dimensions`);
    else if (source.dimensions.width !== png.width || source.dimensions.height !== png.height) add(errors, "raster_dimension_mismatch", record.path, "PNG dimensions disagree with provenance");
    const expectedAlpha = record.kind === "transparent_cutout" ? "transparent" : "opaque";
    const acceptedAlphaPolicies = record.kind === "transparent_cutout"
      ? new Set(["transparent", "transparent_cutout"])
      : new Set(["opaque"]);
    if (!source.alphaPolicy) provenanceIssue("missing_raster_alpha_policy", source.provenanceFile, `${record.path} lacks alpha policy`);
    else if (!acceptedAlphaPolicies.has(source.alphaPolicy)) add(errors, "raster_alpha_policy", record.path, `expected ${expectedAlpha} provenance`);
    if (!source.colorSpace) provenanceIssue("missing_raster_color_space", source.provenanceFile, `${record.path} lacks color space`);
    else if (source.colorSpace !== "sRGB") add(errors, "raster_color_space", record.path, "provenance must declare sRGB");
    if (!source.rightsDeclaration) provenanceIssue("missing_raster_rights", source.provenanceFile, `${record.path} lacks a rights declaration`);
    if (!source.generation?.sourceImageId && !source.sourceImageId && !source.source) provenanceIssue("missing_raster_lineage", source.provenanceFile, `${record.path} lacks generation lineage`);
    if (!source.prompt && !source.promptSource && !source.promptAvailability) provenanceIssue("missing_raster_direction", source.provenanceFile, `${record.path} lacks prompt or recovery-direction evidence`);
    if (!source.maturity) provenanceIssue("missing_raster_maturity", source.provenanceFile, `${record.path} lacks maturity flags`);
  }

  const rasterFiles = (await Promise.all([
    walkFiles(path.join(workspace, "assets/characters")),
    walkFiles(path.join(workspace, "assets/bestiary")),
  ])).flat().filter((item) => item.endsWith(".png")).map((item) => path.relative(workspace, item).replaceAll(path.sep, "/"));
  for (const file of rasterFiles) {
    if (!seenPaths.has(file) && !provenance.has(file)) add(errors, "orphan_raster_art", file, "PNG is neither indexed nor declared as a provenance-tracked alternate");
  }
  for (const sourcePath of provenance.keys()) {
    try {
      await access(path.resolve(workspace, sourcePath));
    } catch {
      add(errors, "stale_raster_provenance", sourcePath, "provenance points to a missing file");
    }
  }

  const summary = { indexedFiles: records.length, conceptMasters: masters, transparentCutouts: cutouts, familyPlates, totalBytes, provenanceRecords: provenance.size };
  return { valid: errors.length === 0, errors, warnings, summary };
}

function parseArgs(argv) {
  const options = { json: false, strictProvenance: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--json") options.json = true;
    else if (argument === "--strict-provenance") options.strictProvenance = true;
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
    console.log(`  ${result.summary.provenanceRecords} provenance records · ${result.summary.totalBytes} indexed bytes`);
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
