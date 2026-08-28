import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, realpath, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { chromium } from "playwright";
import { canonicalJson, sanitizeId, sha256, within } from "./lib/canonical.mjs";
import { captureRuntimeSource, instrumentSource } from "./lib/instrument.mjs";
import { primitiveSceneToGlb } from "./lib/glb.mjs";
import { normalizeCapture, viewInvariantHash } from "./lib/normalize.mjs";
import { assertSafeGameOutputRoots } from "./lib/safe-paths.mjs";

const execFile = promisify(execFileCallback);
const TOOL_ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:([A-Za-z]):)/, "$1:"));
const GAME_ROOT = path.resolve(TOOL_ROOT, "../../..");
const CATALOG_ROOT = path.join(GAME_ROOT, "packages/content/manifests/slipcurve-seeds");
const SEED_ROOT = path.join(GAME_ROOT, "assets/3d/seeds/slipcurve");
const LOCK_PATH = path.join(TOOL_ROOT, "source-lock.json");
const VIEWS = ["iso", "top", "side"];
const SHARD_SIZE = 100;

function parseArgs(argv) {
  const result = { mode: null, sourceRoot: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--source-root") result.sourceRoot = argv[++index];
    else if (arg === "--write") result.mode = "write";
    else if (arg === "--check") result.mode = "check";
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!result.sourceRoot) throw new Error("--source-root is required; no implicit MONTE CARLO path is permitted");
  if (!result.mode) throw new Error("choose exactly one of --write or --check");
  return result;
}

async function git(root, args) {
  const { stdout } = await execFile("git", ["-c", `safe.directory=${root.replaceAll("\\", "/")}`, "-C", root, ...args], { encoding: "utf8", windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
  return stdout;
}

async function validateSourceRoot(requestedRoot, lock) {
  const absolute = path.resolve(requestedRoot);
  const root = await realpath(absolute);
  const rootStats = await lstat(absolute);
  if (rootStats.isSymbolicLink()) throw new Error("source root may not be a symbolic link");
  const head = (await git(root, ["rev-parse", "HEAD"])).trim();
  if (head !== lock.captureWorkspaceHead) throw new Error(`workspace head mismatch: expected ${lock.captureWorkspaceHead}, received ${head}`);
  await git(root, ["cat-file", "-e", `${lock.sourceContentCommit}^{commit}`]);

  const contents = new Map(), observed = {};
  for (const [relative, expectedHash] of Object.entries(lock.inputs)) {
    if (path.isAbsolute(relative) || relative.includes("..") || relative.includes(":")) throw new Error(`unsafe lock path: ${relative}`);
    const candidate = path.resolve(root, ...relative.split("/"));
    const resolved = await realpath(candidate);
    if (!within(root, candidate) || !within(root, resolved)) throw new Error(`path escape refused: ${relative}`);
    const info = await lstat(candidate);
    if (info.isSymbolicLink() || !info.isFile()) throw new Error(`allowlisted input must be a regular non-symlink file: ${relative}`);
    const data = await readFile(candidate);
    const digest = createHash("sha256").update(data).digest("hex");
    if (digest !== expectedHash) throw new Error(`allowlisted input changed: ${relative}; expected ${expectedHash}, received ${digest}`);
    contents.set(relative, data.toString("utf8"));
    observed[relative] = digest;
    if ((relative.startsWith("engine/sitelib/") || relative === "engine/mc-extents.js") && relative.endsWith(".js")) {
      const committed = await git(root, ["show", `${lock.sourceContentCommit}:${relative}`]);
      const committedDigest = createHash("sha256").update(committed).digest("hex");
      if (digest !== committedDigest) throw new Error(`source input no longer matches pinned source commit: ${relative}`);
    }
  }
  return { root, contents, observed, head };
}

const mergeAndCensusSource = String.raw`
(() => {
  const seen = {};
  for (let i = 0; i < CATALOG.length; i++) CATALOG[i]._w = CATALOG[i]._w || "site-core";
  if (globalThis.W3) for (const world of W3) for (const entry of world.list) { entry._w = world.key; CATALOG.push(entry); }
  if (globalThis.MF_CATALOG) for (const entry of MF_CATALOG) { entry._w = "masterformat"; CATALOG.push(entry); }
  for (const entry of CATALOG) {
    const id = entry.id;
    if (seen[id]) { entry.id = id + "~" + seen[id]; seen[id] += 1; }
    else seen[id] = 1;
  }
  rebuildCatIndex();
  globalThis.__SLIP_CENSUS__ = () => {
    const functions = [], records = [];
    for (let index = 0; index < CATALOG.length; index += 1) {
      const entry = CATALOG[index];
      if (typeof entry.gen !== "function") continue;
      let fnIndex = functions.indexOf(entry.gen);
      if (fnIndex < 0) {
        fnIndex = functions.length;
        functions.push(entry.gen);
        records.push({ representativeIndex: index, catalogueCount: 1, generator: entry.gen.name || ("anonymous-" + (fnIndex + 1)), catalogueId: entry.id, name: entry.name, category: entry.cat, world: entry._w, categories: [entry.cat], params: entry.p || {}, flip: !!entry.flip });
      } else {
        records[fnIndex].catalogueCount += 1;
        if (!records[fnIndex].categories.includes(entry.cat)) records[fnIndex].categories.push(entry.cat);
      }
    }
    return records;
  };
  globalThis.__SLIP_RENDER__ = (jobs) => jobs.map((job) => {
    const entry = CATALOG[job.representativeIndex];
    try {
      if (globalThis.MCEXT && MCEXT.fitOf) MCEXT.fitOf(entry.id);
      __SLIP_CAPTURE__.start(job.view);
      const svg = renderView(entry.id, entry.name, entry.cat, entry.gen, entry.p || {}, !!entry.flip, job.view);
      const capture = __SLIP_CAPTURE__.finish();
      return { ok: true, capture, shapeCount: (svg.match(/<(polygon|ellipse|rect|circle|path|line)\b/g) || []).length, annotation: !!(globalThis.MCEXT && MCEXT.isAnnotation && MCEXT.isAnnotation(entry.id)) };
    } catch (error) {
      try { __SLIP_CAPTURE__.finish(); } catch (_) {}
      return { ok: false, error: String(error && (error.stack || error.message) || error), capture: null, shapeCount: 0, annotation: false };
    }
  });
})();
`;

function historicalMaps(manifest) {
  const vocabulary = manifest.assets.filter((asset) => asset.group === "vocabulary");
  const references = manifest.assets.filter((asset) => asset.group !== "vocabulary");
  const accepted = new Map(vocabulary.map((asset) => [asset.file.replaceAll("\\", "/"), asset]));
  const rejected = new Map(manifest.dropped.filter((item) => item.file.startsWith("assets/")).map((item) => [item.file.replaceAll("\\", "/"), item]));
  return { accepted, rejected, references };
}

function inputDigestSnapshot(observed) {
  return sha256(Object.entries(observed).sort(([a], [b]) => a.localeCompare(b)));
}

function likelyHuman(record) {
  return /(?:person|worker|citizen|cyclist|astronaut|labourer|operator|visitor|marshal|scaffolder|groundworker|bricklayer|driver|surveyor|engineer|foreman)/i.test(`${record.generator} ${record.category} ${record.name}`);
}

async function captureCatalog(source, lock) {
  const browser = await chromium.launch({ headless: true });
  if (browser.version() !== lock.chromium.version) {
    await browser.close();
    throw new Error(`Chromium mismatch: expected ${lock.chromium.version}, received ${browser.version()}`);
  }
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.setContent("<!doctype html><meta charset=utf-8><title>Slipcurve model capture</title>");
  await page.addScriptTag({ content: captureRuntimeSource });
  for (const relative of lock.scriptLoadOrder) {
    const instrumented = instrumentSource(source.contents.get(relative), relative);
    await page.addScriptTag({ content: `${instrumented}\n//# sourceURL=slipcurve-bridge://${relative}` });
  }
  await page.addScriptTag({ content: mergeAndCensusSource });
  const census = await page.evaluate(() => globalThis.__SLIP_CENSUS__());
  const results = new Map();
  for (let offset = 0; offset < census.length; offset += 20) {
    const batch = census.slice(offset, offset + 20).flatMap((record) => VIEWS.map((view) => ({ representativeIndex: record.representativeIndex, view })));
    const rendered = await page.evaluate((jobs) => globalThis.__SLIP_RENDER__(jobs), batch);
    for (let index = 0; index < rendered.length; index += 1) {
      const job = batch[index];
      const key = `${job.representativeIndex}:${job.view}`;
      results.set(key, rendered[index]);
    }
  }
  await browser.close();
  if (errors.length) throw new Error(`capture page emitted errors: ${errors.slice(0, 5).join(" | ")}`);
  return { census, results, browserVersion: lock.chromium.version };
}

function makeRecords(capture, historical, source, lock) {
  const records = capture.census.map((item, ordinal) => {
    const rel = `assets/${item.world}/${sanitizeId(item.catalogueId)}.svg`;
    const historicalAccepted = historical.accepted.get(rel);
    const historicalRejected = historical.rejected.get(rel);
    if (!!historicalAccepted === !!historicalRejected) throw new Error(`historical vocabulary crosswalk is not exclusive for ${rel}`);
    const identity = `slipcurve-seed.${sanitizeId(item.world)}.${sanitizeId(item.catalogueId)}.${String(ordinal).padStart(4, "0")}`;
    const viewResults = {}, evidence = [];
    for (const view of VIEWS) {
      const raw = capture.results.get(`${item.representativeIndex}:${view}`);
      if (!raw?.ok) {
        evidence.push({ code: "render_failure", view, detail: raw?.error ?? "missing result" });
        viewResults[view] = null;
      } else {
        viewResults[view] = normalizeCapture(raw.capture, identity);
        if (raw.annotation) evidence.push({ code: "annotation_not_object", view });
      }
    }
    const iso = viewResults.iso;
    const hashes = VIEWS.map((view) => viewResults[view] && viewInvariantHash(viewResults[view]));
    if (hashes.some((hash) => !hash) || new Set(hashes).size !== 1) evidence.push({ code: "view_structural_mismatch", hashes: Object.fromEntries(VIEWS.map((view, index) => [view, hashes[index]])) });
    for (const view of VIEWS) for (const finding of viewResults[view]?.unsupportedOutputEvidence ?? []) evidence.push({ ...finding, view });
    if (item.world === "animals") evidence.push({ code: "animal_source_excluded" });
    if (likelyHuman(item)) evidence.push({ code: "human_source_excluded" });
    if (!iso?.events.length) evidence.push({ code: "no_supported_model_geometry" });

    let classification = "accepted_seed", reason = "model-space primitive capture is view-invariant and convertible";
    if (historicalRejected) {
      classification = "rejected";
      reason = historicalRejected.reason;
    } else if (evidence.length) {
      classification = "quarantined";
      reason = evidence[0].code;
    }
    return {
      schema: "CatalogAssetRecordV1",
      id: identity,
      generatorIdentity: `${item.world}:${item.generator}:${item.representativeIndex}`,
      generator: item.generator,
      representativeParameters: item.params,
      sourceCatalogueId: item.catalogueId,
      sourceName: item.name,
      sourceCategory: item.category,
      sourceWorld: item.world,
      sourceFlip: item.flip,
      catalogueEntriesUsingGenerator: item.catalogueCount,
      classification,
      reason,
      suitabilityTags: classification === "accepted_seed" ? ["prototype-seed", sanitizeId(item.world)] : [],
      lineage: {
        sourceIdentity: lock.sourceIdentity,
        sourceContentCommit: lock.sourceContentCommit,
        captureWorkspaceHead: lock.captureWorkspaceHead,
        historicalCrosswalk: historicalAccepted ? "accepted-vocabulary-export" : "rejected-vocabulary-candidate",
        historicalSourcePath: rel
      },
      maturity: "prototype_geometry",
      productionEligible: false,
      primitiveScene: iso,
      viewCaptureSummaries: Object.fromEntries(VIEWS.map((view) => [view, viewResults[view] ? { eventCount: viewResults[view].events.length, eventHash: viewResults[view].eventHash, topologySignature: viewResults[view].topologySignature, deterministicHash: viewResults[view].deterministicHash, bounds: viewResults[view].bounds, unsupportedEvidenceCount: viewResults[view].unsupportedOutputEvidence.length } : null])),
      evidence
    };
  });

  const byTopology = new Map();
  for (const record of records.filter((record) => record.classification === "accepted_seed")) {
    const list = byTopology.get(record.primitiveScene.topologySignature) ?? [];
    list.push(record);
    byTopology.set(record.primitiveScene.topologySignature, list);
  }
  for (const list of byTopology.values()) {
    list.sort((a, b) => a.id.localeCompare(b.id));
    const canonical = list[0].id;
    for (const record of list) record.topology = { signature: record.primitiveScene.topologySignature, canonicalId: canonical, aliasOf: record.id === canonical ? null : canonical, aliases: record.id === canonical ? list.slice(1).map((item) => item.id) : [] };
  }
  return records;
}

function buildOutputs(records, historical, source, lock) {
  const outputs = new Map();
  const shardRefs = [];
  for (let offset = 0; offset < records.length; offset += SHARD_SIZE) {
    const end = Math.min(records.length, offset + SHARD_SIZE);
    const name = `catalog-${String(offset).padStart(4, "0")}-${String(end - 1).padStart(4, "0")}.json`;
    const body = canonicalJson({ schema: "SlipcurveSeedCatalogShardV1", start: offset, endExclusive: end, records: records.slice(offset, end) }, 2);
    outputs.set(path.join(CATALOG_ROOT, name), Buffer.from(body));
    shardRefs.push({ path: name, start: offset, count: end - offset, sha256: sha256(body) });
  }

  const glbCandidates = records.filter((record) => record.classification === "accepted_seed" && record.topology?.aliasOf == null && record.primitiveScene.events.length <= 250).sort((a, b) => a.id.localeCompare(b.id)).slice(0, 24);
  const glbs = [];
  for (const record of glbCandidates) {
    const fileName = `${record.id}.glb`;
    const buffer = primitiveSceneToGlb(record.primitiveScene);
    outputs.set(path.join(SEED_ROOT, fileName), buffer);
    glbs.push({ recordId: record.id, path: fileName, sha256: sha256(buffer), bytes: buffer.length, maturity: "prototype_geometry", productionEligible: false });
  }
  const seedIndex = canonicalJson({ schema: "SlipcurveRepresentativeSeedIndexV1", sourceIdentity: lock.sourceIdentity, count: glbs.length, assets: glbs }, 2);
  outputs.set(path.join(SEED_ROOT, "index.json"), Buffer.from(seedIndex));

  const references = historical.references.map((asset) => ({
    group: asset.group,
    file: asset.file,
    catalogueId: asset.catalogue_id,
    generator: asset.generator,
    view: asset.view,
    sceneRotationDeg: asset.scene_rotation_deg ?? null,
    phase: asset.phase ?? null,
    sourceSha256: asset.sha256
  }));
  const classifications = Object.fromEntries(["accepted_seed", "quarantined", "rejected"].map((classification) => [classification, records.filter((record) => record.classification === classification).length]));
  const index = {
    schema: "SlipcurveSeedCatalogIndexV1",
    sourceIdentity: lock.sourceIdentity,
    authorization: lock.authorization,
    sourceContentCommit: lock.sourceContentCommit,
    captureWorkspaceHead: lock.captureWorkspaceHead,
    instrumentationVersion: lock.instrumentationVersion,
    chromium: lock.chromium,
    inputHashes: source.observed,
    inputSetHash: inputDigestSnapshot(source.observed),
    coordinateContract: { source: "Slipcurve metres, Z-up", runtime: "Sable Reach metres, Y-up", mapping: "(x,y,z)->(x,z,y)", quantizationMetres: 0.001 },
    maturity: "prototype_geometry",
    productionEligible: false,
    counts: { records: records.length, historicalAcceptedVocabulary: historical.accepted.size, historicalRejectedVocabulary: historical.rejected.size, historicalReferences: references.length, classifications, representativeGlbs: glbs.length },
    shards: shardRefs,
    referenceCrosswalkPath: "references.json",
    representativeSeedIndexPath: "../../../../assets/3d/seeds/slipcurve/index.json"
  };
  outputs.set(path.join(CATALOG_ROOT, "index.json"), Buffer.from(canonicalJson(index, 2)));
  outputs.set(path.join(CATALOG_ROOT, "references.json"), Buffer.from(canonicalJson({ schema: "SlipcurveHistoricalReferenceCrosswalkV1", count: references.length, references }, 2)));
  return { outputs, summary: index.counts };
}

async function compareOrWrite(outputs, mode) {
  const mismatches = [];
  for (const [file, expected] of [...outputs.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (mode === "write") {
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, expected);
    } else {
      let actual;
      try { actual = await readFile(file); } catch { mismatches.push(`${path.relative(GAME_ROOT, file)}: missing`); continue; }
      if (!actual.equals(expected)) mismatches.push(`${path.relative(GAME_ROOT, file)}: content differs`);
    }
  }
  if (mismatches.length) throw new Error(`deterministic output check failed:\n${mismatches.slice(0, 20).join("\n")}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const lock = JSON.parse(await readFile(LOCK_PATH, "utf8"));
  const source = await validateSourceRoot(args.sourceRoot, lock);
  await assertSafeGameOutputRoots(GAME_ROOT, [CATALOG_ROOT, SEED_ROOT], source.root);
  const manifest = JSON.parse(source.contents.get("export/isometric/manifest.json"));
  const historical = historicalMaps(manifest);
  if (manifest.distinct_generator_functions !== lock.historicalCrosswalk.distinctGeneratorRepresentatives) throw new Error("historical distinct-generator count drifted");
  if (historical.accepted.size !== lock.historicalCrosswalk.acceptedVocabularyExports) throw new Error("historical accepted vocabulary count drifted");
  if (historical.rejected.size !== lock.historicalCrosswalk.rejectedVocabularyCandidates) throw new Error("historical rejected vocabulary count drifted");
  if (historical.references.length !== lock.historicalCrosswalk.phaseRotationViewSceneReferences) throw new Error("historical reference count drifted");

  const capture = await captureCatalog(source, lock);
  if (capture.census.length !== lock.historicalCrosswalk.distinctGeneratorRepresentatives) throw new Error(`live census count drifted: ${capture.census.length}`);
  const records = makeRecords(capture, historical, source, lock);
  const built = buildOutputs(records, historical, source, lock);
  await assertSafeGameOutputRoots(GAME_ROOT, [CATALOG_ROOT, SEED_ROOT], source.root);
  await compareOrWrite(built.outputs, args.mode);
  const after = await validateSourceRoot(args.sourceRoot, lock);
  if (inputDigestSnapshot(source.observed) !== inputDigestSnapshot(after.observed)) throw new Error("source repository changed during capture");
  process.stdout.write(`${canonicalJson({ ok: true, mode: args.mode, ...built.summary }, 2)}`);
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
