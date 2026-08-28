import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import type { RuntimeAssetDependencyV1, RuntimeAssetPackV1 } from "@hollow-march/shared";

export type RuntimeQualityProfile = "discrete" | "integrated";
export type RuntimeAssetDependencyLike = RuntimeAssetDependencyV1;
export type RuntimeAssetPackLike = RuntimeAssetPackV1;

export interface RuntimeAssetLodLike {
  readonly level: number;
  readonly dependencyId: string;
  readonly minDistanceMeters: number;
}

export interface RuntimeAssetDefinitionLike {
  readonly id: string;
  readonly lods: readonly RuntimeAssetLodLike[];
}

export interface LoadedAssetResource {
  /** GLB scene. Texture-only dependencies may intentionally omit it. */
  readonly scene?: THREE.Object3D;
  readonly animations?: GLTF["animations"];
  /** Optional decoded floor for formats whose texture blocks are not inspectable by Three.js. */
  readonly gpuByteFloor?: number;
}

export type RuntimeDependencyLoader = (
  dependency: RuntimeAssetDependencyLike,
  signal: AbortSignal,
) => Promise<LoadedAssetResource>;

export interface AssetResidencyManagerOptions {
  readonly profile: RuntimeQualityProfile;
  readonly maxConcurrentLoads?: number;
  readonly dependencyLoader?: RuntimeDependencyLoader;
  readonly fetchImpl?: typeof fetch;
}

export interface AssetResidencyStats {
  readonly profile: RuntimeQualityProfile;
  readonly cacheLimitBytes: number;
  readonly gpuBytes: number;
  readonly activeGpuBytes: number;
  readonly loadedDependencyCount: number;
  readonly loadingDependencyCount: number;
  readonly activeLeaseCount: number;
  readonly siteLeaseCounts: Readonly<Record<string, number>>;
  readonly concurrentLoads: number;
  readonly maximumObservedConcurrentLoads: number;
}

export interface ResolvedRuntimeAsset {
  readonly asset: RuntimeAssetDefinitionLike;
  readonly lod: RuntimeAssetLodLike;
  readonly scene: THREE.Object3D;
  /** True when a prototype GLB has not yet authored a node for the selected LOD. */
  readonly lodFallback: boolean;
}

export interface SiteAssetLease {
  readonly packId: string;
  readonly siteId: string;
  readonly released: boolean;
  resolveAsset(assetId: string, distanceMeters: number): ResolvedRuntimeAsset;
  release(): void;
}

export const RUNTIME_CACHE_LIMIT_BYTES = Object.freeze({
  discrete: 256 * 1024 * 1024,
  integrated: 96 * 1024 * 1024,
} satisfies Record<RuntimeQualityProfile, number>);

/** Canonical manifests store deploy-root-relative paths without a leading slash. */
export function runtimeDependencyUrl(path: string): string {
  const exactBridgePath = /^assets\/3d\/runtime\/bridge\/(?:[a-z0-9][a-z0-9._-]*\/)*[a-z0-9][a-z0-9._-]*\.(?:glb|ktx2)$/;
  if (!exactBridgePath.test(path) || /[%?#\\]/.test(path) || path.split("/").some((part) => part === "" || part === "." || part === "..")) throw new Error(`Unsafe runtime dependency path ${path}`);
  return `/${path}`;
}

const HASH_PATTERN = /^(?:sha256:)?([a-f\d]{64})$/i;
const ID_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

function abortError(message = "Asset load was cancelled"): Error {
  return new DOMException(message, "AbortError");
}

function normalizedHash(hash: string): string {
  const match = HASH_PATTERN.exec(hash);
  if (!match?.[1]) throw new Error(`Asset hash must be a SHA-256 digest, received ${hash}`);
  return match[1].toLowerCase();
}

async function digestSha256(buffer: ArrayBuffer): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error("WebCrypto SHA-256 is required for runtime asset verification");
  const digest = await globalThis.crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Rejects every external reference before GLTFLoader can resolve a URL. */
export function assertSelfContainedGlb(buffer: ArrayBuffer): void {
  if (buffer.byteLength < 20) throw new Error("Runtime GLB is truncated");
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== buffer.byteLength) throw new Error("Runtime asset is not a canonical GLB 2.0 container");
  const jsonLength = view.getUint32(12, true);
  if (view.getUint32(16, true) !== 0x4e4f534a || jsonLength <= 0 || 20 + jsonLength > buffer.byteLength) throw new Error("Runtime GLB has an invalid JSON chunk");
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, jsonLength)).trim()) as unknown;
  const visit = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) { for (const item of value) visit(item); return; }
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (key === "uri" && typeof nested === "string") throw new Error(`Runtime GLB declares forbidden external URI ${nested}`);
      visit(nested);
    }
  };
  visit(json);
}

/**
 * Real browser loader. Model data is fetched with an AbortSignal and verified
 * before GLTFLoader sees it, so a cancelled or corrupt request cannot publish.
 */
export function createGltfDependencyLoader(fetchImpl: typeof fetch = fetch): RuntimeDependencyLoader {
  const gltf = new GLTFLoader();
  gltf.setMeshoptDecoder(MeshoptDecoder);
  return async (dependency, signal) => {
    const uri = runtimeDependencyUrl(dependency.path);
    const requestUrl = new URL(uri, globalThis.location?.href ?? "http://localhost/");
    const response = await fetchImpl(uri, { signal, credentials: "same-origin", redirect: "error" });
    if (!response.ok) throw new Error(`Asset request ${dependency.id} failed with HTTP ${response.status}`);
    if (response.redirected || !response.url) throw new Error(`Asset request ${dependency.id} returned an unverifiable or redirected response`);
    const responseUrl = new URL(response.url, requestUrl);
    if (responseUrl.origin !== requestUrl.origin || responseUrl.pathname !== requestUrl.pathname || responseUrl.search || responseUrl.hash) throw new Error(`Asset request ${dependency.id} escaped its declared same-origin URL`);
    const buffer = await response.arrayBuffer();
    if (signal.aborted) throw abortError();
    if (buffer.byteLength !== dependency.encodedBytes) {
      throw new Error(`Asset ${dependency.id} byte count mismatch: expected ${dependency.encodedBytes}, received ${buffer.byteLength}`);
    }
    const actualHash = await digestSha256(buffer);
    if (actualHash !== normalizedHash(dependency.sha256)) throw new Error(`Asset ${dependency.id} failed SHA-256 verification`);
    if (dependency.kind !== "glb") {
      // Direct KTX2 publication needs a renderer-bound KTX2Loader. Packs may
      // account for KTX2 dependencies here, but model LODs must resolve GLBs.
      return Object.freeze({ gpuByteFloor: dependency.gpuBytes.total });
    }
    assertSelfContainedGlb(buffer);
    const base = new URL(".", new URL(uri, globalThis.location?.href ?? "http://localhost/")).href;
    const parsed = await gltf.parseAsync(buffer, base);
    if (signal.aborted) {
      disposeDetachedGraph(parsed.scene);
      throw abortError();
    }
    return Object.freeze({ scene: parsed.scene, animations: parsed.animations });
  };
}

interface GraphResources {
  readonly geometries: Set<THREE.BufferGeometry>;
  readonly materials: Set<THREE.Material>;
  readonly textures: Set<THREE.Texture>;
}

function collectMaterialTextures(material: THREE.Material, textures: Set<THREE.Texture>): void {
  const seen = new Set<object>();
  const visit = (value: unknown): void => {
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    if (value instanceof THREE.Texture) {
      textures.add(value);
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    for (const nested of Object.values(value as Record<string, unknown>)) visit(nested);
  };
  visit(material);
}

function collectGraphResources(root: THREE.Object3D): GraphResources {
  const resources: GraphResources = { geometries: new Set(), materials: new Set(), textures: new Set() };
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points)) return;
    resources.geometries.add(object.geometry);
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      resources.materials.add(material);
      collectMaterialTextures(material, resources.textures);
    }
  });
  return resources;
}

function disposeDetachedGraph(root: THREE.Object3D): void {
  const resources = collectGraphResources(root);
  for (const texture of resources.textures) texture.dispose();
  for (const material of resources.materials) material.dispose();
  for (const geometry of resources.geometries) geometry.dispose();
}

function geometryBytes(geometry: THREE.BufferGeometry): number {
  const arrays = new Set<object>();
  let total = 0;
  const add = (attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | null): void => {
    if (!attribute) return;
    const array = attribute instanceof THREE.InterleavedBufferAttribute ? attribute.data.array : attribute.array;
    if (arrays.has(array)) return;
    arrays.add(array);
    total += array.byteLength;
  };
  add(geometry.index);
  for (const attribute of Object.values(geometry.attributes)) add(attribute);
  for (const targets of Object.values(geometry.morphAttributes)) if (targets) for (const attribute of targets) add(attribute);
  return total;
}

function textureBytes(texture: THREE.Texture): number {
  const mipmaps = texture.mipmaps as readonly { data?: ArrayBufferView; width?: number; height?: number }[];
  const blockBytes = mipmaps.reduce((sum, mip) => sum + (mip.data?.byteLength ?? 0), 0);
  if (blockBytes > 0) return blockBytes;
  const image = texture.image as { width?: number; height?: number; data?: ArrayBufferView } | undefined;
  if (image?.data) return image.data.byteLength;
  const width = Math.max(1, Number(image?.width ?? 1));
  const height = Math.max(1, Number(image?.height ?? 1));
  const base = width * height * 4;
  return texture.generateMipmaps ? Math.ceil(base * 4 / 3) : base;
}

/** Counts decoded geometry plus texture mip/block storage once by object identity. */
export function calculateGpuResidencyBytes(roots: readonly THREE.Object3D[]): number {
  const geometries = new Set<THREE.BufferGeometry>();
  const textures = new Set<THREE.Texture>();
  for (const root of roots) {
    const resources = collectGraphResources(root);
    for (const geometry of resources.geometries) geometries.add(geometry);
    for (const texture of resources.textures) textures.add(texture);
  }
  let total = 0;
  for (const geometry of geometries) total += geometryBytes(geometry);
  for (const texture of textures) total += textureBytes(texture);
  return total;
}

/** Profile bias and millimetre quantization keep LOD selection reproducible. */
export function selectDeterministicLod(
  lods: readonly RuntimeAssetLodLike[],
  distanceMeters: number,
  profile: RuntimeQualityProfile,
): RuntimeAssetLodLike {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) throw new Error("LOD distance must be a finite non-negative number");
  if (lods.length === 0) throw new Error("Runtime asset has no declared LODs");
  const keys = new Set<string>();
  for (const lod of lods) {
    if (!Number.isInteger(lod.level) || lod.level < 0 || !Number.isFinite(lod.minDistanceMeters) || lod.minDistanceMeters < 0 || !ID_PATTERN.test(lod.dependencyId)) {
      throw new Error("Runtime asset contains an invalid LOD rule");
    }
    const key = `${lod.level}:${lod.minDistanceMeters}`;
    if (keys.has(key)) throw new Error(`Runtime asset contains duplicate LOD rule ${key}`);
    keys.add(key);
  }
  const biasedDistance = Math.round(distanceMeters * (profile === "integrated" ? 1.35 : 1) * 1000) / 1000;
  const ordered = [...lods].sort((left, right) =>
    left.minDistanceMeters - right.minDistanceMeters || left.level - right.level || left.dependencyId.localeCompare(right.dependencyId),
  );
  return ordered.filter((lod) => lod.minDistanceMeters <= biasedDistance).at(-1) ?? ordered[0]!;
}

interface QueueEntry<T> {
  readonly task: () => Promise<T>;
  readonly signal: AbortSignal;
  readonly resolve: (value: T) => void;
  readonly reject: (reason: unknown) => void;
  abortListener?: () => void;
}

class BoundedLoadQueue {
  private readonly pending: QueueEntry<unknown>[] = [];
  private running = 0;
  maximumObserved = 0;

  constructor(private readonly maximum: number, private readonly activity: (running: number) => void) {}

  enqueue<T>(task: () => Promise<T>, signal: AbortSignal): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (signal.aborted) { reject(abortError()); return; }
      const entry: QueueEntry<T> = { task, signal, resolve, reject };
      const abortListener = (): void => {
        const index = this.pending.indexOf(entry as QueueEntry<unknown>);
        if (index >= 0) this.pending.splice(index, 1);
        reject(abortError());
      };
      entry.abortListener = abortListener;
      signal.addEventListener("abort", abortListener, { once: true });
      this.pending.push(entry as QueueEntry<unknown>);
      this.pump();
    });
  }

  private pump(): void {
    while (this.running < this.maximum && this.pending.length > 0) {
      const entry = this.pending.shift()!;
      entry.signal.removeEventListener("abort", entry.abortListener!);
      if (entry.signal.aborted) { entry.reject(abortError()); continue; }
      this.running += 1;
      this.maximumObserved = Math.max(this.maximumObserved, this.running);
      this.activity(this.running);
      void entry.task().then(entry.resolve, entry.reject).finally(() => {
        this.running -= 1;
        this.activity(this.running);
        this.pump();
      });
    }
  }
}

interface DependencyRecord {
  readonly definition: RuntimeAssetDependencyLike;
  readonly controller: AbortController;
  promise: Promise<LoadedAssetResource>;
  refs: number;
  lastUsed: number;
  state: "loading" | "loaded";
  resource?: LoadedAssetResource;
}

function validatePack(pack: RuntimeAssetPackLike): void {
  if (pack.schemaVersion !== 1 || !ID_PATTERN.test(pack.id) || !ID_PATTERN.test(pack.siteId)) throw new Error("Runtime pack identity is invalid");
  if (pack.maturity !== "prototype_geometry") throw new Error(`Bridge pack ${pack.id} must remain honest prototype_geometry`);
  if (new Set(pack.dependencies.map(({ id }) => id)).size !== pack.dependencies.length) throw new Error(`Runtime pack ${pack.id} duplicates dependencies`);
  const dependencies = new Set(pack.dependencies.map(({ id }) => id));
  for (const dependency of pack.dependencies) {
    normalizedHash(dependency.sha256);
    runtimeDependencyUrl(dependency.path);
    if ((dependency.kind === "glb") !== dependency.path.endsWith(".glb") || (dependency.kind === "ktx2") !== dependency.path.endsWith(".ktx2")) throw new Error(`Runtime pack ${pack.id} dependency kind/path mismatch for ${dependency.id}`);
    if (!ID_PATTERN.test(dependency.id) || !Number.isSafeInteger(dependency.encodedBytes) || dependency.encodedBytes < 0 || !Number.isSafeInteger(dependency.gpuBytes.total) || dependency.gpuBytes.total < 0 || dependency.gpuBytes.total !== dependency.gpuBytes.vertex + dependency.gpuBytes.index + dependency.gpuBytes.textureMipChain || dependency.externalUris.length !== 0) throw new Error(`Runtime pack ${pack.id} has invalid dependency ${dependency.id}`);
  }
  if (new Set(pack.dependencyIds).size !== pack.dependencyIds.length || pack.dependencyIds.some((id) => !dependencies.has(id))) throw new Error(`Runtime pack ${pack.id} dependency closure is inconsistent`);
  if (pack.decodedGpuBytes !== pack.dependencies.reduce((sum, dependency) => sum + dependency.gpuBytes.total, 0) || pack.encodedBytes !== pack.dependencies.reduce((sum, dependency) => sum + dependency.encodedBytes, 0)) throw new Error(`Runtime pack ${pack.id} totals do not match its dependency closure`);
  if (pack.limits.discreteGpuBytes !== RUNTIME_CACHE_LIMIT_BYTES.discrete || pack.limits.integratedGpuBytes !== RUNTIME_CACHE_LIMIT_BYTES.integrated) throw new Error(`Runtime pack ${pack.id} declares noncanonical residency limits`);
  const lodLevels = new Set<number>();
  for (const lod of pack.lods) {
    if (lodLevels.has(lod.level) || !Number.isFinite(lod.maximumDistanceMeters) || lod.maximumDistanceMeters <= 0 || !Number.isSafeInteger(lod.triangleBudget) || lod.triangleBudget <= 0) throw new Error(`Runtime pack ${pack.id} has invalid LOD policy`);
    lodLevels.add(lod.level);
  }
}

function assetLods(pack: RuntimeAssetPackLike, dependencyId: string): readonly RuntimeAssetLodLike[] {
  const ordered = [...pack.lods].sort((left, right) => left.level - right.level);
  return Object.freeze(ordered.map((lod, index) => Object.freeze({
    level: lod.level,
    dependencyId,
    minDistanceMeters: index === 0 ? 0 : ordered[index - 1]!.maximumDistanceMeters + 0.001,
  })));
}

function resolveLodObject(root: THREE.Object3D, level: number): { scene: THREE.Object3D; fallback: boolean } {
  root.updateMatrixWorld(true);
  if (root instanceof THREE.LOD) {
    const entry = root.levels[Math.min(level, root.levels.length - 1)];
    if (entry) return { scene: entry.object, fallback: entry.object !== root };
  }
  let lodContainer: THREE.LOD | undefined;
  let named: THREE.Object3D | undefined;
  const pattern = new RegExp(`^lod[_-]?${level}$`, "i");
  root.traverse((object) => {
    if (!lodContainer && object instanceof THREE.LOD) lodContainer = object;
    if (!named && pattern.test(object.name)) named = object;
  });
  if (lodContainer) {
    const entry = lodContainer.levels[Math.min(level, lodContainer.levels.length - 1)];
    if (entry) return { scene: entry.object, fallback: false };
  }
  if (named) return { scene: named, fallback: false };
  return { scene: root, fallback: level !== 0 };
}

function awaitWithAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise<T>((resolve, reject) => {
    const cancel = (): void => reject(abortError());
    signal.addEventListener("abort", cancel, { once: true });
    void promise.then(
      (value) => { signal.removeEventListener("abort", cancel); resolve(value); },
      (error) => { signal.removeEventListener("abort", cancel); reject(error); },
    );
  });
}

export class AssetResidencyManager {
  readonly profile: RuntimeQualityProfile;
  readonly cacheLimitBytes: number;
  private readonly loader: RuntimeDependencyLoader;
  private readonly queue: BoundedLoadQueue;
  private readonly records = new Map<string, DependencyRecord>();
  private readonly definitions = new Map<string, RuntimeAssetDependencyLike>();
  private readonly packs = new Map<string, RuntimeAssetPackLike>();
  private readonly siteLeaseCounts = new Map<string, number>();
  private clock = 0;
  private runningLoads = 0;
  private leaseCount = 0;

  constructor(options: AssetResidencyManagerOptions) {
    this.profile = options.profile;
    this.cacheLimitBytes = RUNTIME_CACHE_LIMIT_BYTES[options.profile];
    const maximum = options.maxConcurrentLoads ?? 4;
    if (!Number.isInteger(maximum) || maximum < 1 || maximum > 4) throw new Error("Runtime asset concurrency must be between one and four");
    this.loader = options.dependencyLoader ?? createGltfDependencyLoader(options.fetchImpl);
    this.queue = new BoundedLoadQueue(maximum, (running) => { this.runningLoads = running; });
  }

  async acquireSite(pack: RuntimeAssetPackLike, options: { signal?: AbortSignal } = {}): Promise<SiteAssetLease> {
    validatePack(pack);
    const existingPack = this.packs.get(pack.id);
    if (existingPack && existingPack.siteId !== pack.siteId) throw new Error(`Pack ${pack.id} changed site identity`);
    this.packs.set(pack.id, pack);
    for (const dependency of pack.dependencies) {
      const existing = this.definitions.get(dependency.id);
      if (existing && (existing.sha256 !== dependency.sha256 || existing.path !== dependency.path || existing.gpuBytes.total !== dependency.gpuBytes.total)) throw new Error(`Dependency ${dependency.id} has conflicting definitions`);
      this.definitions.set(dependency.id, dependency);
    }

    const dependencyIds = [...new Set(pack.dependencyIds)];
    const projected = new Set(dependencyIds);
    for (const [id, record] of this.records) if (record.refs > 0) projected.add(id);
    const projectedBytes = [...projected].reduce((sum, id) => sum + (this.definitions.get(id)?.gpuBytes.total ?? 0), 0);
    if (projectedBytes > this.cacheLimitBytes) throw new Error(`Active dependency closure would exceed ${this.profile} GPU budget`);
    if (options.signal?.aborted) throw abortError();

    const preexisting = new Set(this.records.keys());
    const records = dependencyIds.map((id) => this.retainDependency(this.definitions.get(id)!));
    let committed = false;
    try {
      await awaitWithAbort(Promise.all(records.map(({ promise }) => promise)), options.signal);
      if (this.activeGpuBytes() > this.cacheLimitBytes) throw new Error(`Decoded active dependency closure exceeds ${this.profile} GPU budget`);
      committed = true;
      this.leaseCount += 1;
      this.siteLeaseCounts.set(pack.siteId, (this.siteLeaseCounts.get(pack.siteId) ?? 0) + 1);
      let released = false;
      return {
        packId: pack.id,
        siteId: pack.siteId,
        get released() { return released; },
        resolveAsset: (assetId, distanceMeters) => {
          if (released) throw new Error(`Site lease ${pack.id} is released`);
          const dependency = pack.dependencies.find(({ id }) => id === assetId);
          if (!dependency || dependency.kind !== "glb") throw new Error(`Pack ${pack.id} does not declare GLB asset ${assetId}`);
          const asset: RuntimeAssetDefinitionLike = Object.freeze({ id: assetId, lods: assetLods(pack, assetId) });
          const lod = selectDeterministicLod(asset.lods, distanceMeters, this.profile);
          const resource = this.records.get(lod.dependencyId)?.resource;
          if (!resource?.scene) throw new Error(`Asset ${asset.id} LOD ${lod.level} has no loaded GLB scene`);
          const resolved = resolveLodObject(resource.scene, lod.level);
          this.records.get(lod.dependencyId)!.lastUsed = ++this.clock;
          return Object.freeze({ asset, lod, scene: resolved.scene, lodFallback: resolved.fallback });
        },
        release: () => {
          if (released) return;
          released = true;
          this.leaseCount -= 1;
          const remaining = (this.siteLeaseCounts.get(pack.siteId) ?? 1) - 1;
          if (remaining > 0) this.siteLeaseCounts.set(pack.siteId, remaining); else this.siteLeaseCounts.delete(pack.siteId);
          this.releaseDependencies(dependencyIds);
        },
      };
    } finally {
      if (!committed) {
        this.releaseDependencies(dependencyIds);
        for (const id of dependencyIds) {
          const record = this.records.get(id);
          if (!preexisting.has(id) && record?.refs === 0) this.removeRecord(id, record);
        }
      }
    }
  }

  getStats(): AssetResidencyStats {
    return Object.freeze({
      profile: this.profile,
      cacheLimitBytes: this.cacheLimitBytes,
      gpuBytes: this.gpuBytes(),
      activeGpuBytes: this.activeGpuBytes(),
      loadedDependencyCount: [...this.records.values()].filter(({ state }) => state === "loaded").length,
      loadingDependencyCount: [...this.records.values()].filter(({ state }) => state === "loading").length,
      activeLeaseCount: this.leaseCount,
      siteLeaseCounts: Object.freeze(Object.fromEntries([...this.siteLeaseCounts].sort(([left], [right]) => left.localeCompare(right)))),
      concurrentLoads: this.runningLoads,
      maximumObservedConcurrentLoads: this.queue.maximumObserved,
    });
  }

  /** Explicitly removes all inactive cache entries; active site closures survive. */
  clearInactive(): void {
    for (const [id, record] of [...this.records]) if (record.refs === 0) this.removeRecord(id, record);
  }

  private retainDependency(definition: RuntimeAssetDependencyLike): DependencyRecord {
    let record = this.records.get(definition.id);
    if (!record) {
      const controller = new AbortController();
      const mutable = { definition, controller, refs: 0, lastUsed: ++this.clock, state: "loading" as const } as DependencyRecord;
      mutable.promise = this.queue.enqueue(() => this.loader(definition, controller.signal), controller.signal).then((resource) => {
        if (controller.signal.aborted && mutable.refs === 0) {
          if (resource.scene) disposeDetachedGraph(resource.scene);
          throw abortError();
        }
        mutable.resource = resource;
        mutable.state = "loaded";
        mutable.lastUsed = ++this.clock;
        this.trimToBudget();
        return resource;
      }, (error) => {
        if (this.records.get(definition.id) === mutable) this.records.delete(definition.id);
        throw error;
      });
      // Avoid unhandled rejection when every waiter cancels a queued load.
      void mutable.promise.catch(() => undefined);
      record = mutable;
      this.records.set(definition.id, record);
    }
    record.refs += 1;
    record.lastUsed = ++this.clock;
    return record;
  }

  private releaseDependencies(ids: readonly string[]): void {
    for (const id of ids) {
      const record = this.records.get(id);
      if (!record) continue;
      record.refs = Math.max(0, record.refs - 1);
      record.lastUsed = ++this.clock;
      if (record.refs === 0 && record.state === "loading") {
        this.records.delete(id);
        record.controller.abort();
      }
    }
    this.trimToBudget();
  }

  private gpuBytes(): number {
    const loaded = [...this.records.values()].filter((record): record is DependencyRecord & { resource: LoadedAssetResource } => record.state === "loaded" && !!record.resource);
    const roots = loaded.flatMap(({ resource }) => resource.scene ? [resource.scene] : []);
    const inspected = calculateGpuResidencyBytes(roots);
    const floors = loaded.reduce((sum, { definition, resource }) => sum + Math.max(0, resource.gpuByteFloor ?? (resource.scene ? 0 : definition.gpuBytes.total)), 0);
    return inspected + floors;
  }

  private activeGpuBytes(): number {
    const active = [...this.records.values()].filter((record): record is DependencyRecord & { resource: LoadedAssetResource } => record.refs > 0 && record.state === "loaded" && !!record.resource);
    const roots = active.flatMap(({ resource }) => resource.scene ? [resource.scene] : []);
    const inspected = calculateGpuResidencyBytes(roots);
    const floors = active.reduce((sum, { definition, resource }) => sum + Math.max(0, resource.gpuByteFloor ?? (resource.scene ? 0 : definition.gpuBytes.total)), 0);
    return inspected + floors;
  }

  private trimToBudget(): void {
    const candidates = [...this.records.entries()]
      .filter(([, record]) => record.refs === 0 && record.state === "loaded")
      .sort(([, left], [, right]) => left.lastUsed - right.lastUsed || left.definition.id.localeCompare(right.definition.id));
    while (this.gpuBytes() > this.cacheLimitBytes && candidates.length > 0) {
      const [id, record] = candidates.shift()!;
      this.removeRecord(id, record);
    }
  }

  private removeRecord(id: string, record: DependencyRecord): void {
    if (this.records.get(id) !== record) return;
    this.records.delete(id);
    if (record.state === "loading") { record.controller.abort(); return; }
    if (!record.resource?.scene) return;
    const resources = collectGraphResources(record.resource.scene);
    const retained = [...this.records.values()].flatMap(({ resource }) => resource?.scene ? [collectGraphResources(resource.scene)] : []);
    for (const texture of resources.textures) if (!retained.some(({ textures }) => textures.has(texture))) texture.dispose();
    for (const material of resources.materials) if (!retained.some(({ materials }) => materials.has(material))) material.dispose();
    for (const geometry of resources.geometries) if (!retained.some(({ geometries }) => geometries.has(geometry))) geometry.dispose();
  }
}
