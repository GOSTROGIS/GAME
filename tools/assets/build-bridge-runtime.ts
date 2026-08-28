import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SABLE_REACH_BRIDGE_ASSETS,
  buildBridgeRuntimeAssetPacks,
  type BridgeAssetDefinition,
  type GeneratedBridgeDependency,
} from "../../packages/content/src/bridgeAssets.ts";
import { primitiveLodSceneToGlb } from "./slipcurve-bridge/lib/glb.mjs";
import { assertSafeGameOutputRoots } from "./slipcurve-bridge/lib/safe-paths.mjs";

type Point = [number, number, number];
type PrimitiveEvent = Record<string, unknown> & { kind: string };
type SeedRecord = {
  id: string;
  classification: string;
  topology: { aliasOf: string | null; signature: string };
  primitiveScene: { bounds: { min: Point; max: Point }; events: PrimitiveEvent[] };
};

const GAME_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MANIFEST_ROOT = path.join(GAME_ROOT, "packages/content/manifests");
const CATALOG_ROOT = path.join(MANIFEST_ROOT, "slipcurve-seeds");
const RUNTIME_ROOT = path.join(GAME_ROOT, "assets/3d/runtime/bridge");
const RUNTIME_MANIFEST = path.join(GAME_ROOT, "packages/content/manifests/sable-reach.bridge-runtime.json");
const LINEAGE_MANIFEST = path.join(GAME_ROOT, "packages/content/manifests/sable-reach.bridge-lineage.json");
const ASSIGNMENTS_MANIFEST = path.join(GAME_ROOT, "packages/content/manifests/sable-reach.bridge-seed-assignments.json");
const GENERATOR_VERSION = "sable-reach-dark-rebuild-v2.0.0";
const sha256 = (value: Uint8Array | string): string => createHash("sha256").update(value).digest("hex");
const round = (value: number): number => Math.round(value * 1000) / 1000;
const point = (value: unknown): Point => (value as number[]).map(round) as Point;

function numberSeed(value: string): number {
  return Number.parseInt(sha256(value).slice(0, 8), 16) >>> 0;
}

async function loadSeeds(): Promise<{ index: Record<string, unknown>; seeds: SeedRecord[] }> {
  const index = JSON.parse(await readFile(path.join(CATALOG_ROOT, "index.json"), "utf8"));
  const names = (await readdir(CATALOG_ROOT)).filter((name) => /^catalog-\d{4}-\d{4}\.json$/.test(name)).sort();
  const records = (await Promise.all(names.map(async (name) => JSON.parse(await readFile(path.join(CATALOG_ROOT, name), "utf8")).records as SeedRecord[]))).flat();
  const seen = new Set<string>();
  const seeds = records.filter((record) => record.classification === "accepted_seed" && record.topology.aliasOf === null && !seen.has(record.topology.signature) && !!seen.add(record.topology.signature));
  if (records.length !== 1087 || seeds.length < SABLE_REACH_BRIDGE_ASSETS.length) throw new Error(`Seed snapshot cannot resolve 96 unique accepted topologies (${records.length}/${seeds.length})`);
  return { index, seeds };
}

function sourceAspect(bounds: SeedRecord["primitiveScene"]["bounds"]): Point {
  const extents = bounds.max.map((maximum, axis) => Math.max(0.01, maximum - bounds.min[axis])) as Point;
  const mean = (extents[0] + extents[1] + extents[2]) / 3;
  return extents.map((extent) => round(Math.min(1.22, Math.max(0.78, extent / mean)))) as Point;
}

function targetSize(asset: BridgeAssetDefinition, record: SeedRecord, seed: number): Point {
  const variation = 0.86 + (seed % 23) / 100;
  const aspect = sourceAspect(record.primitiveScene.bounds);
  const base: Point = asset.role === "structure" ? [6.4, 4.6, 3.5]
    : asset.role === "landmark_traversal" ? [8.2, 4.1, 4.8]
      : asset.role === "foliage" ? [1.6, 3.1, 1.5]
        : [2.1, 1.8, 1.8];
  return base.map((value, axis) => round(value * variation * (0.9 + aspect[axis] * 0.1))) as Point;
}

const event = (kind: string, materialSlot: 0 | 1 | 2, values: Record<string, unknown>): PrimitiveEvent => ({ kind, materialSlot, ...values });
const box = (min: Point, max: Point, materialSlot: 0 | 1 | 2 = 0): PrimitiveEvent => event("cuboid", materialSlot, { min: point(min), max: point(max) });
const tube = (from: Point, to: Point, radius: number, materialSlot: 0 | 1 | 2 = 1): PrimitiveEvent => event("tube", materialSlot, { from: point(from), to: point(to), radius: round(radius) });
const mound = (centerBase: Point, radius: number, height: number, materialSlot: 0 | 1 | 2 = 0): PrimitiveEvent => event("mound", materialSlot, { centerBase: point(centerBase), radius: round(radius), height: round(height) });
const ring = (center: Point, axis: Point, radius: number, width: number, materialSlot: 0 | 1 | 2 = 2): PrimitiveEvent => event("ring", materialSlot, { center: point(center), axis: point(axis), radius: round(radius), width: round(width) });
const dome = (centerBase: Point, radius: number, height: number, materialSlot: 0 | 1 | 2 = 0): PrimitiveEvent => event("dome", materialSlot, { centerBase: point(centerBase), radius: round(radius), height: round(height) });
const cylinder = (centerBase: Point, radius: number, height: number, materialSlot: 0 | 1 | 2 = 1): PrimitiveEvent => event("cylinder", materialSlot, { centerBase: point(centerBase), axis: [0, 1, 0], radius: round(radius), height: round(height) });

function patternFor(asset: BridgeAssetDefinition, seed: number): string {
  const slug = asset.slug;
  const family = /(arch|gate|lintel)/.test(slug) ? `broken-arch-${seed % 3}`
    : /(bridge|walk|pier|crossing|switchback|stair|descent|conveyor|causeway)/.test(slug) ? `processional-span-${seed % 4}`
      : /(kiln|furnace|smelter|retort)/.test(slug) ? `mineral-kiln-${seed % 3}`
        : /(anchor|davit|crane)/.test(slug) ? `inward-anchor-${seed % 3}`
          : /(column|post|stake|perch|obelisk)/.test(slug) ? `witness-spire-${seed % 4}`
            : /(wall|palisade|fence|barricade)/.test(slug) ? `scarred-wall-${seed % 4}`
              : /(well|basin|trough|cup|cistern)/.test(slug) ? `sealed-basin-${seed % 3}`
                : asset.role === "foliage" ? `uncanny-growth-${seed % 6}`
                  : asset.role === "structure" ? `crooked-shell-${seed % 5}`
                    : asset.role === "landmark_traversal" ? `ritual-route-${seed % 5}`
                      : `ritual-prop-${seed % 8}`;
  return family;
}

function authoredPattern(asset: BridgeAssetDefinition, target: Point, seed: number, level: 0 | 1 | 2): PrimitiveEvent[] {
  const [width, height, depth] = target;
  const pattern = patternFor(asset, seed);
  const side = seed % 2 === 0 ? 1 : -1;
  const detail = level === 0;
  const medium = level < 2;
  const events: PrimitiveEvent[] = [];
  if (pattern.startsWith("broken-arch")) {
    events.push(box([-width * .5, 0, -depth * .32], [-width * .3, height * .86, depth * .34], 0));
    events.push(box([width * .27, 0, -depth * .38], [width * .5, height * (.68 + (seed % 3) * .06), depth * .3], 0));
    events.push(tube([-width * .4, height * .82, 0], [width * .34, height * .68, side * depth * .07], width * .045, 1));
    events.push(ring([side * width * .08, height * .66, 0], [0, 0, 1], width * .16, width * .055, 2));
    if (detail) events.push(...Array.from({ length: 2 + seed % 3 }, (_, index) => tube([side * width * .28, height * (.22 + index * .14), -depth * .34], [side * width * (.18 - index * .03), height * (.31 + index * .13), depth * .32], width * .018, 2)));
  } else if (pattern.startsWith("processional-span") || pattern.startsWith("ritual-route")) {
    const segments = level === 0 ? 5 + seed % 3 : level === 1 ? 4 : 2 + seed % 2;
    for (let index = 0; index < segments; index += 1) {
      const x0 = -width * .5 + index * width / segments;
      const rise = (index / Math.max(1, segments - 1)) * height * .38 + (index % 2) * height * .035;
      events.push(box([x0, rise, -depth * (.28 + (index % 2) * .04)], [x0 + width / segments * .9, rise + height * .09, depth * .29], index % 3 === 2 ? 2 : 0));
    }
    events.push(tube([-width * .48, height * .17, -depth * .35], [width * .46, height * .56, -depth * .31], width * .025, 1));
    events.push(tube([-width * .46, height * .19, depth * .35], [width * .43, height * .53, depth * .31], width * .025, 1));
    if (detail) events.push(ring([side * width * .18, height * .48, 0], [1, 0, 0], depth * .2, depth * .05, 2));
  } else if (pattern.startsWith("mineral-kiln")) {
    events.push(dome([0, 0, 0], width * .38, height * .7, 0));
    events.push(cylinder([side * width * .22, height * .54, 0], width * .09, height * .42, 1));
    events.push(ring([0, height * .25, depth * .36], [0, 0, 1], width * .2, width * .06, 2));
    if (medium) events.push(box([-width * .46, 0, -depth * .42], [-width * .28, height * .3, depth * .34], 0));
    if (detail) events.push(tube([-width * .35, height * .18, depth * .3], [width * .32, height * .51, depth * .38], width * .025, 2));
  } else if (pattern.startsWith("inward-anchor")) {
    events.push(tube([0, 0, 0], [side * width * .08, height * .82, 0], width * .055, 1));
    events.push(tube([-width * .4, height * .18, 0], [width * .39, height * .21, 0], width * .06, 1));
    events.push(tube([-width * .38, height * .18, 0], [-width * .21, 0, side * depth * .27], width * .045, 0));
    events.push(tube([width * .38, height * .18, 0], [width * .2, 0, -side * depth * .3], width * .045, 0));
    events.push(ring([side * width * .08, height * .72, 0], [0, 0, 1], width * .13, width * .045, 2));
    if (detail) events.push(tube([0, height * .46, 0], [side * width * .34, height * .32, depth * .2], width * .018, 2));
  } else if (pattern.startsWith("witness-spire")) {
    events.push(mound([0, 0, 0], width * .42, height * .12, 0));
    events.push(tube([0, height * .08, 0], [side * width * .1, height * .9, -side * depth * .08], width * (.1 + (seed % 3) * .012), 0));
    events.push(ring([side * width * .08, height * .66, 0], [0, 1, 0], width * .23, width * .055, 1));
    events.push(tube([-width * .26, height * .53, 0], [width * .29, height * .48, side * depth * .08], width * .035, 2));
    if (detail) events.push(...Array.from({ length: 1 + seed % 3 }, (_, index) => ring([0, height * (.28 + index * .12), 0], [0, 1, 0], width * (.14 + index * .025), width * .02, 2)));
  } else if (pattern.startsWith("scarred-wall") || pattern.startsWith("crooked-shell")) {
    const bays = level === 0 ? 4 + seed % 3 : level === 1 ? 3 : 2;
    for (let index = 0; index < bays; index += 1) {
      const x0 = -width * .5 + index * width / bays;
      const top = height * (.52 + ((index + seed) % 4) * .1);
      events.push(box([x0, 0, -depth * (.24 + index % 2 * .08)], [x0 + width / bays * .82, top, depth * (.26 + (index + 1) % 2 * .06)], index === bays - 1 ? 2 : 0));
    }
    events.push(tube([-width * .47, height * .62, -depth * .28], [width * .43, height * .48, depth * .26], width * .035, 1));
    events.push(tube([side * width * .31, height * .08, depth * .3], [side * width * .2, height * .78, -depth * .28], width * .025, 2));
    if (detail) events.push(ring([side * width * .18, height * .42, depth * .31], [0, 0, 1], width * .1, width * .025, 1));
  } else if (pattern.startsWith("sealed-basin")) {
    events.push(cylinder([0, 0, 0], width * .42, height * .34, 0));
    events.push(ring([0, height * .34, 0], [0, 1, 0], width * .39, width * .065, 1));
    events.push(tube([side * width * .3, height * .24, 0], [side * width * .48, height * .72, depth * .12], width * .045, 2));
    if (medium) events.push(dome([side * width * .18, height * .32, 0], width * .11, height * .18, 2));
    if (detail) events.push(tube([-width * .3, height * .2, -depth * .24], [width * .25, height * .29, depth * .3], width * .018, 1));
  } else if (pattern.startsWith("uncanny-growth")) {
    events.push(mound([0, 0, 0], width * .43, height * .15, 0));
    const stems = level === 0 ? 4 + seed % 4 : level === 1 ? 3 : 2 + seed % 2;
    for (let index = 0; index < stems; index += 1) events.push(tube([(index - stems / 2) * width * .08, height * .08, 0], [(index - stems / 2) * width * .18, height * (.48 + index / stems * .42), ((index + seed) % 3 - 1) * depth * .24], width * (.022 + index * .004), index === stems - 1 ? 2 : 1));
    events.push(ring([side * width * .08, height * .38, 0], [0, 1, 0], width * (.16 + seed % 3 * .025), width * .025, 2));
    if (detail) events.push(dome([-side * width * .2, height * .12, depth * .16], width * .14, height * .12, 0));
  } else {
    const tiers = level === 0 ? 3 + seed % 3 : level === 1 ? 2 : 1;
    for (let index = 0; index < tiers; index += 1) {
      const inset = index * width * .07;
      events.push(box([-width * .44 + inset + side * index * .025, index * height * .18, -depth * .36 + inset * .3], [width * .4 - inset, (index + 1) * height * .21, depth * .34 - inset * .25], index % 2 === 0 ? 0 : 2));
    }
    events.push(tube([-width * .34, height * .15, -depth * .35], [width * .31, height * .7, depth * .3], width * .035, 1));
    events.push(ring([side * width * .12, height * .62, 0], [0, 0, 1], width * .18, width * .045, 2));
    if (detail) events.push(cylinder([-side * width * .3, height * .14, 0], width * .07, height * .58, 1));
  }
  // Each intermediate level retains one authored binding silhouette that the
  // crowd level omits; LOD0 additionally retains a damage ring. This guarantees
  // strict geometric reduction without collapsing every asset to one cuboid.
  if (level < 2) events.push(tube([-width * .17, height * .23, -depth * .16], [width * .2, height * .31, depth * .18], Math.max(.018, width * .012), 1));
  if (level === 0) events.push(ring([-side * width * .21, height * .36, depth * .08], [0, 1, 0], Math.max(.07, width * .075), Math.max(.018, width * .016), 2));
  return events;
}

function semanticMaterials(asset: BridgeAssetDefinition): readonly Record<string, unknown>[] {
  const palettes: Record<string, readonly [readonly [number, number, number, number], readonly [number, number, number, number], readonly [number, number, number, number]]> = {
    "site.hearthmere": [[.14,.11,.08,1],[.22,.2,.17,1],[.12,.16,.14,1]],
    "site.gloamharbor": [[.045,.075,.08,1],[.12,.15,.14,1],[.1,.17,.18,1]],
    "site.warden-reed": [[.055,.095,.06,1],[.13,.12,.085,1],[.19,.18,.1,1]],
    "site.cairnmarket": [[.14,.13,.11,1],[.23,.2,.16,1],[.17,.12,.1,1]],
    "site.hollow-abbey": [[.2,.2,.17,1],[.12,.095,.075,1],[.27,.23,.15,1]],
    "site.salt-watch": [[.31,.3,.24,1],[.2,.21,.2,1],[.16,.18,.2,1]],
    "site.ember-gate": [[.15,.055,.03,1],[.25,.12,.055,1],[.18,.16,.12,1]],
  };
  const palette = palettes[asset.siteId]!;
  const names = Object.values(asset.semanticMaterialMapping);
  return palette.map((baseColorFactor, index) => ({ name: names[index] ?? `${asset.id}.semantic-${index}`, baseColorFactor, metallicFactor: index === 1 && asset.siteId === "site.ember-gate" ? .38 : index === 2 ? .18 : .04, roughnessFactor: index === 2 ? .68 : .9 - index * .06 }));
}

function lodScene(asset: BridgeAssetDefinition, record: SeedRecord) {
  const seed = numberSeed(asset.id);
  const target = targetSize(asset, record, seed);
  const lods = ([0, 1, 2] as const).map((level) => ({ events: authoredPattern(asset, target, seed, level) }));
  return {
    lods,
    materials: semanticMaterials(asset),
    evidence: {
      sourceEventRetention: 0,
      sourceBoundsAspect: sourceAspect(record.primitiveScene.bounds),
      originalPatternId: patternFor(asset, seed),
      authoredTopologySignature: sha256(JSON.stringify(lods)),
    },
  };
}

function inspectGlb(buffer: Buffer): { vertex: number; index: number; triangles: number[]; materialCount: number; materialUsage: number[] } {
  const jsonLength = buffer.readUInt32LE(12);
  const json = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString("utf8").trim());
  const vertex = json.bufferViews.filter((view: { target: number }) => view.target === 34962).reduce((sum: number, view: { byteLength: number }) => sum + view.byteLength, 0);
  const index = json.bufferViews.filter((view: { target: number }) => view.target === 34963).reduce((sum: number, view: { byteLength: number }) => sum + view.byteLength, 0);
  const triangles = json.meshes.map((mesh: { primitives: { indices: number }[] }) => mesh.primitives.reduce((total, primitive) => total + json.accessors[primitive.indices].count / 3, 0));
  if (json.nodes.map(({ name }: { name: string }) => name).join(",") !== "LOD0,LOD1,LOD2") throw new Error("Generated bridge GLB lacks three named LOD nodes");
  const materialUsage = [...new Set(json.meshes.flatMap((mesh: { primitives: { material: number }[] }) => mesh.primitives.map(({ material }) => material)))].sort();
  return { vertex, index, triangles, materialCount: json.materials.length, materialUsage };
}

async function compareOrWrite(file: string, value: Buffer | string, mode: "write" | "check"): Promise<void> {
  const expected = typeof value === "string" ? Buffer.from(value) : value;
  if (mode === "write") { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, expected); return; }
  const actual = await readFile(file);
  if (!actual.equals(expected)) throw new Error(`Generated bridge output drifted: ${path.relative(GAME_ROOT, file)}`);
}

async function main(): Promise<void> {
  const argument = process.argv[2] ?? "--check";
  const mode = argument === "--write" ? "write" : argument === "--check" ? "check" : null;
  if (!mode) throw new Error("Usage: tsx tools/assets/build-bridge-runtime.ts [--write|--check]");
  await assertSafeGameOutputRoots(GAME_ROOT, [CATALOG_ROOT, RUNTIME_ROOT, MANIFEST_ROOT]);
  const { index, seeds } = await loadSeeds();
  const dependencies: GeneratedBridgeDependency[] = [];
  const assignments: Record<string, string> = {};
  const lineage = [];
  for (const [assetIndex, asset] of SABLE_REACH_BRIDGE_ASSETS.entries()) {
    const record = seeds[(assetIndex * 67 + 19) % seeds.length]!;
    assignments[asset.id] = record.id;
    const scene = lodScene(asset, record);
    const buffer = primitiveLodSceneToGlb(scene);
    const storage = inspectGlb(buffer);
    const output = path.join(GAME_ROOT, asset.runtimePath);
    await compareOrWrite(output, buffer, mode);
    dependencies.push({ id: asset.id, kind: "glb", path: asset.runtimePath, sha256: sha256(buffer), encodedBytes: buffer.length, gpuBytes: { vertex: storage.vertex, index: storage.index, textureMipChain: 0, total: storage.vertex + storage.index }, externalUris: [] });
    lineage.push({
      derivativeId: asset.id,
      sourceSeedId: record.id,
      sourceTopologySignature: record.topology.signature,
      outputSha256: sha256(buffer),
      lodTriangles: storage.triangles,
      materialCount: storage.materialCount,
      materialUsage: storage.materialUsage,
      sourceEventRetention: 0,
      sourceBoundsAspect: scene.evidence.sourceBoundsAspect,
      originalPatternId: scene.evidence.originalPatternId,
      authoredTopologySignature: scene.evidence.authoredTopologySignature,
      pivot: asset.pivot,
      colliderProfile: asset.colliderProfile,
      originalityMethod: "Source geometry is not transformed or retained. Only normalized source bounds inform a clamped proportion hint; all runtime topology, silhouettes, damage, and semantic material partitions are authored by Sable Reach patterns.",
      topologyChanges: asset.topologyChanges,
      damageAndAsymmetryRules: asset.damageAndAsymmetryRules,
      maturity: "prototype_geometry",
      productionEligible: false,
    });
  }
  const runtimeAssetPacks = buildBridgeRuntimeAssetPacks(dependencies);
  const generatorHash = sha256(await readFile(fileURLToPath(import.meta.url)));
  const lineageDocument = { schemaVersion: 1, id: "sable-reach.bridge.lineage-v1", generatorVersion: GENERATOR_VERSION, generatorSha256: generatorHash, sourceCatalogInputSetHash: (index as { inputSetHash: string }).inputSetHash, assignments, records: lineage };
  const assignmentsDocument = { schemaVersion: 1, id: "sable-reach.bridge.seed-assignments-v1", sourceCatalogInputSetHash: (index as { inputSetHash: string }).inputSetHash, assignments };
  const runtimeDocument = { schemaVersion: 1, id: "sable-reach.bridge.runtime-v1", maturity: "prototype_geometry", productionEligible: false, generatorVersion: GENERATOR_VERSION, generatorSha256: generatorHash, runtimeAssetPacks };
  await compareOrWrite(LINEAGE_MANIFEST, `${JSON.stringify(lineageDocument, null, 2)}\n`, mode);
  await compareOrWrite(ASSIGNMENTS_MANIFEST, `${JSON.stringify(assignmentsDocument, null, 2)}\n`, mode);
  await compareOrWrite(RUNTIME_MANIFEST, `${JSON.stringify(runtimeDocument, null, 2)}\n`, mode);
  console.log(`bridge runtime ${mode}: ${dependencies.length} derivatives, ${runtimeAssetPacks.length} active-site packs, three authored LODs each`);
}

await main();
