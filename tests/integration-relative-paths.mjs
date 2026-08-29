import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const reviewRoot = resolve(root, "design-review");

async function walk(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) found.push(...await walk(path));
    else found.push(path);
  }
  return found;
}

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

function cleanReference(reference) {
  return decodeURIComponent(reference).split(/[?#]/, 1)[0];
}

function isLocalReference(reference) {
  const decoded = decodeURIComponent(reference);
  return Boolean(decoded)
    && !decoded.startsWith("#")
    && !decoded.startsWith("/")
    && !/^(?:[a-z]+:|\/\/)/i.test(decoded)
    && !/[<>{}${}]/.test(decoded);
}

const failures = [];
let moduleReferences = 0;
let webReferences = 0;
let assetDataReferences = 0;

async function requireRelativeFile(owner, reference, base = dirname(owner)) {
  if (!reference.startsWith(".")) return;
  const target = resolve(base, cleanReference(reference));
  if (!await isFile(target)) failures.push(`${owner}: unresolved ${reference} -> ${target}`);
}

const appModuleDirectories = [
  resolve(root, "apps/client/src/world/hearthmere"),
  resolve(root, "apps/client/src/three/vfx"),
];
const moduleFiles = [
  ...await Promise.all(appModuleDirectories.map(walk)).then((groups) => groups.flat()),
  ...await walk(reviewRoot),
].filter((path) => extname(path) === ".js");

const modulePatterns = [
  /\bfrom\s*["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  /\bimport\s*["']([^"']+)["']/g,
];

for (const file of moduleFiles) {
  const source = await readFile(file, "utf8");
  for (const pattern of modulePatterns) {
    for (const match of source.matchAll(pattern)) {
      moduleReferences += 1;
      await requireRelativeFile(file, match[1]);
    }
  }
}

const reviewHtml = (await walk(reviewRoot)).filter((path) => extname(path) === ".html");
const htmlFiles = [...reviewHtml, resolve(root, "tools/assets/kit-viewer/hearthmere.html")];
const webPatterns = [
  /\b(?:src|href)\s*=\s*["']([^"']+)["']/g,
  /\burl\(\s*["']?([^"')]+)["']?\s*\)/g,
  ...modulePatterns,
];

for (const file of htmlFiles) {
  const source = await readFile(file, "utf8");
  for (const pattern of webPatterns) {
    for (const match of source.matchAll(pattern)) {
      const reference = match[1];
      const clean = cleanReference(reference);
      // Bare specifiers are resolved by each page's import map. This guard is
      // deliberately limited to relative filesystem references.
      if (!isLocalReference(reference) || !clean.startsWith(".")) continue;
      webReferences += 1;
      const target = resolve(dirname(file), clean);
      if (!await isFile(target)) failures.push(`${file}: unresolved ${reference} -> ${target}`);
    }
  }
}

const reviewCode = (await walk(reviewRoot)).filter((path) => [".html", ".js", ".jsx", ".css"].includes(extname(path)));
for (const file of reviewCode) {
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(/["'](\.\.?\/assets\/[^"']+)["']/g)) {
    assetDataReferences += 1;
    await requireRelativeFile(file, match[1], reviewRoot);
  }
}

const requiredCopies = [
  "apps/client/src/world/hearthmere/hm-textures.js",
  "apps/client/src/world/hearthmere/hm-structures.js",
  "design-review/Hearthmere Environment Kit.html",
  ...[
    "hm-artifacts.js", "hm-catalog.js", "hm-core.js", "hm-flora.js", "hm-props.js",
    "hm-vfx.js", "hm-vfx-fire.js", "hm-vfx-water.js", "hm-vfx-weather.js",
    "hm-vfx-veil.js", "hm-vfx-climate.js", "hm-vfx-index.js",
  ].map((name) => `design-review/kit/${name}`),
];
for (const path of requiredCopies) {
  if (!await isFile(resolve(root, path))) failures.push(`missing required integration file ${path}`);
}

assert.deepEqual(failures, [], failures.join("\n"));
console.log(JSON.stringify({
  valid: true,
  moduleFiles: moduleFiles.length,
  moduleReferences,
  htmlFiles: htmlFiles.length,
  webReferences,
  assetDataReferences,
  requiredCopies: requiredCopies.length,
}, null, 2));
