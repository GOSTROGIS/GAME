#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const annexPath = path.join(repositoryRoot, "assets/world/spatial/world-spatial-wave-02-v9.annex.json");
const provenancePath = path.join(repositoryRoot, "assets/world/spatial/world-spatial-wave-02-v9.provenance.json");
const sourceSha256 = "e3b27d70df0acd90f9a40dd4fa4494fdedd3d6740f4b79c3578aadb919dd24db";
const sourceBytes = 49_420_776;

export const redactedJsonPointers = Object.freeze([
  "/boundAuthority/checkout",
  "/lineage/independentReviewAAuditExact/path",
  "/lineage/independentReviewAFreezeExact/path",
  "/lineage/independentReviewAFrozenArtifactsExact/0/path",
  "/lineage/independentReviewAFrozenArtifactsExact/1/path",
  "/lineage/independentReviewAFrozenArtifactsExact/2/path",
  "/lineage/independentReviewAFrozenArtifactsExact/3/path",
  "/lineage/independentReviewAVerdictExact/path",
  "/lineage/predecessorExact/path",
  "/lineage/predecessorFreezeExact/path",
  "/lineage/predecessorFreezeManifest/path",
  "/lineage/predecessorFrozenArtifactsExact/0/path",
  "/lineage/predecessorFrozenArtifactsExact/1/path",
  "/lineage/predecessorFrozenArtifactsExact/2/path",
  "/lineage/predecessorFrozenArtifactsExact/3/path",
  "/lineage/predecessorFrozenArtifactsExact/4/path",
  "/lineage/predecessorFrozenArtifactsExact/5/path",
  "/lineage/predecessorFrozenArtifactsExact/6/path",
  "/lineage/predecessorFrozenArtifactsExact/7/path",
  "/lineage/predecessorFrozenArtifactsExact/8/path",
  "/lineage/predecessorFrozenArtifactsExact/9/path",
  "/lineage/predecessorFrozenArtifactsExact/10/path",
  "/lineage/sourceBindings/0/path",
  "/lineage/sourceBindings/1/path",
  "/lineage/sourceBindings/2/path",
  "/lineage/sourceBindings/3/path",
  "/lineage/sourceBindings/4/path",
  "/lineage/sourceBindings/5/path",
  "/lineage/sourceBindings/6/path",
  "/lineage/sourceBindings/7/path",
  "/lineage/sourceBindings/8/path",
  "/lineage/sourceBindings/9/path",
  "/lineage/sourceV5Annex/path",
  "/lineage/sourceV6Annex/path",
  "/lineage/sourceV6Freeze/path",
  "/lineage/sourceV6IndependentReviewA/path",
  "/lineage/v5/annex/path",
  "/lineage/v5/freeze/path",
  "/lineage/v5/independentReviewAFreeze/path",
]);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const escapePointerSegment = (value) => String(value).replaceAll("~", "~0").replaceAll("/", "~1");
const pointerSetSha256 = (pointers) => sha256(Buffer.from([...pointers].sort().join("\n"), "utf8"));

function collectPrivateLocators(value, segments = [], hits = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectPrivateLocators(item, [...segments, index], hits));
    return hits;
  }
  if (!value || typeof value !== "object") return hits;
  for (const [key, item] of Object.entries(value)) {
    const nextSegments = [...segments, key];
    if (typeof item === "string" && /^work[\\/]/i.test(item)) {
      hits.push({
        parent: value,
        key,
        pointer: `/${nextSegments.map(escapePointerSegment).join("/")}`,
      });
    } else {
      collectPrivateLocators(item, nextSegments, hits);
    }
  }
  return hits;
}

function valueAtPointer(value, pointer) {
  return pointer.slice(1).split("/").reduce((current, segment) => {
    const key = segment.replaceAll("~1", "/").replaceAll("~0", "~");
    return current?.[key];
  }, value);
}

async function writeRedactedDerivative() {
  const source = await readFile(annexPath);
  assert.equal(source.length, sourceBytes, "Refusing to redact an unexpected source byte count");
  assert.equal(sha256(source), sourceSha256, "Refusing to redact an unexpected source payload");

  const annex = JSON.parse(source.toString("utf8"));
  const hits = collectPrivateLocators(annex);
  const observedPointers = hits.map(({ pointer }) => pointer).sort();
  assert.deepEqual(observedPointers, [...redactedJsonPointers].sort(), "Private-locator delta escaped the reviewed allowlist");
  assert.ok(hits.every(({ key }) => key === "path" || key === "checkout"), "Only locator fields may be redacted");
  for (const { parent, key } of hits) delete parent[key];

  const published = Buffer.from(`${JSON.stringify(annex, null, 2)}\n`, "utf8");
  await writeFile(annexPath, published);
  console.log(JSON.stringify({
    source: { bytes: source.length, sha256: sha256(source) },
    published: { bytes: published.length, sha256: sha256(published) },
    removedLocatorFields: observedPointers.length,
    removedJsonPointersSha256: pointerSetSha256(observedPointers),
  }, null, 2));
}

async function checkPublishedDerivative() {
  const published = await readFile(annexPath);
  const annex = JSON.parse(published.toString("utf8"));
  const provenance = JSON.parse(await readFile(provenancePath, "utf8"));
  const record = provenance.records?.[0];

  assert.equal(collectPrivateLocators(annex).length, 0, "Published annex retains a private work locator");
  for (const pointer of redactedJsonPointers) assert.equal(valueAtPointer(annex, pointer), undefined, `${pointer} was not redacted`);
  assert.equal(record?.bytes, published.length, "Published byte count is not provenance-bound");
  assert.equal(record?.sha256, sha256(published), "Published SHA-256 is not provenance-bound");
  assert.equal(record?.publicRedaction?.sourceBytes, sourceBytes);
  assert.equal(record?.publicRedaction?.sourceSha256, sourceSha256);
  assert.equal(record?.publicRedaction?.removedLocatorFields, redactedJsonPointers.length);
  assert.equal(record?.publicRedaction?.removedJsonPointersSha256, pointerSetSha256(redactedJsonPointers));
  assert.equal(record?.publicRedaction?.publishedBytes, published.length);
  assert.equal(record?.publicRedaction?.publishedSha256, sha256(published));

  console.log(JSON.stringify({
    valid: true,
    published: { bytes: published.length, sha256: sha256(published) },
    removedLocatorFields: redactedJsonPointers.length,
    removedJsonPointersSha256: pointerSetSha256(redactedJsonPointers),
  }, null, 2));
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const mode = process.argv[2] ?? "--check";
  if (mode === "--write") await writeRedactedDerivative();
  else if (mode === "--check") await checkPublishedDerivative();
  else throw new Error(`Unknown mode ${mode}`);
}
