/**
 * Authoring-only bridge records. This module is deliberately excluded from the
 * eager content barrel so the 96-record catalog cannot enter the startup graph.
 */
import assignmentsJson from "../manifests/sable-reach.bridge-seed-assignments.json" with { type: "json" };
import type { ReskinRecipeV1, RuntimeAssetDependencyV1, RuntimeAssetPackV1 } from "@hollow-march/shared";

export type BridgeAssetRole = "structure" | "prop" | "foliage" | "landmark_traversal";

export interface BridgeAssetDefinition {
  schemaVersion: 1;
  id: string;
  slug: string;
  name: string;
  siteId: string;
  territoryId: string;
  role: BridgeAssetRole;
  sourceSeedIds: readonly string[];
  runtimePath: string;
  semanticMaterialMapping: Readonly<Record<string, string>>;
  topologyChanges: readonly string[];
  damageAndAsymmetryRules: readonly string[];
  pivot: Readonly<{ mode: "ground_center"; offset: readonly [0, 0, 0] }>;
  colliderProfile: Readonly<{
    shape: "box" | "cylinder";
    size: readonly [number, number, number] | null;
    radius: number | null;
    height: number;
    collisionLayer: "static-world" | "traversal";
    walkable: boolean;
  }>;
  territoryTags: readonly string[];
  lineage: string;
  originalityReview: Readonly<{
    status: "prototype_reviewed";
    recognizableBorrowing: false;
    simpleRecolor: false;
    notes: string;
  }>;
  maturity: "prototype_geometry";
  strictProductionEligible: false;
  budgets: Readonly<{ lod0Triangles: number; lod1Triangles: number; lod2Triangles: number; materialSlots: number }>;
}

export interface BridgePackPlan {
  schemaVersion: 1;
  id: string;
  siteId: string;
  assetIds: readonly string[];
  outputPaths: readonly string[];
  materialIds: readonly string[];
  maturity: "prototype_geometry";
  strictProductionEligible: false;
  residencyLimits: Readonly<{ discreteGpuBytes: 268435456; integratedGpuBytes: 100663296 }>;
}

export type GeneratedBridgeDependency = RuntimeAssetDependencyV1;
export type BridgeRuntimeAssetPack = RuntimeAssetPackV1;

const SOURCE_SEED_BY_ASSET_ID = assignmentsJson.assignments as Readonly<Record<string, string>>;

interface AssetSeed {
  slug: string;
  name: string;
  role: BridgeAssetRole;
}

interface SiteSeed {
  slug: string;
  siteId: string;
  territoryId: string;
  materials: readonly [string, string, string];
  assets: readonly AssetSeed[];
}

const HEARTHMERE_ASSETS: readonly AssetSeed[] = [
  { slug: "crooked-hold-frame", name: "Crooked Hold Frame", role: "structure" },
  { slug: "springcut-lintel", name: "Springcut Lintel", role: "structure" },
  { slug: "cinder-wattle-corner", name: "Cinder Wattle Corner", role: "structure" },
  { slug: "weathered-slate-bay", name: "Weathered Slate Bay", role: "structure" },
  { slug: "patched-palisade-run", name: "Patched Palisade Run", role: "structure" },
  { slug: "leaning-gate-bent", name: "Leaning Gate Bent", role: "structure" },
  { slug: "oathless-well", name: "Oathless Well", role: "prop" },
  { slug: "rainwood-stack", name: "Rainwood Stack", role: "prop" },
  { slug: "split-slate-tally", name: "Split Slate Tally", role: "prop" },
  { slug: "chainless-lantern-perch", name: "Chainless Lantern Perch", role: "prop" },
  { slug: "peat-drying-rack", name: "Peat Drying Rack", role: "prop" },
  { slug: "hush-bell-yoke", name: "Hush Bell Yoke", role: "prop" },
  { slug: "spring-cup-plinth", name: "Spring Cup Plinth", role: "prop" },
  { slug: "travellers-splint-bench", name: "Traveller's Splint Bench", role: "prop" },
  { slug: "blackpine-hook-clump", name: "Blackpine Hook Clump", role: "foliage" },
  { slug: "ashmoss-braid", name: "Ashmoss Braid", role: "foliage" },
  { slug: "cold-reed-knot", name: "Cold Reed Knot", role: "foliage" },
  { slug: "ridge-heather-fan", name: "Ridge Heather Fan", role: "foliage" },
  { slug: "wall-lichen-shroud", name: "Wall Lichen Shroud", role: "foliage" },
  { slug: "spring-rill-crossing", name: "Spring Rill Crossing", role: "landmark_traversal" },
  { slug: "slate-switchback", name: "Slate Switchback", role: "landmark_traversal" },
  { slug: "watchers-timber-step", name: "Watcher's Timber Step", role: "landmark_traversal" },
  { slug: "banked-ember-court", name: "Banked Ember Court", role: "landmark_traversal" },
  { slug: "broken-name-arch", name: "Broken Name Arch", role: "landmark_traversal" },
] as const;

function proofSiteAssets(prefix: string, structure: readonly string[], props: readonly string[], foliage: readonly string[], landmark: string): readonly AssetSeed[] {
  return [
    ...structure.map((name) => ({ slug: `${prefix}-${name}`, name: title(name), role: "structure" as const })),
    ...props.map((name) => ({ slug: `${prefix}-${name}`, name: title(name), role: "prop" as const })),
    ...foliage.map((name) => ({ slug: `${prefix}-${name}`, name: title(name), role: "foliage" as const })),
    { slug: `${prefix}-${landmark}`, name: title(landmark), role: "landmark_traversal" as const },
  ];
}

function title(slug: string): string {
  return slug.split("-").map((word) => `${word[0]!.toUpperCase()}${word.slice(1)}`).join(" ");
}

const SITE_SEEDS: readonly SiteSeed[] = [
  { slug: "hearthmere", siteId: "site.hearthmere", territoryId: "territory.graven-march", materials: ["charred-oak", "rain-dark-slate", "verdigris-iron"], assets: HEARTHMERE_ASSETS },
  {
    slug: "gloamharbor", siteId: "site.gloamharbor", territoryId: "territory.veil-coast", materials: ["tarred-driftwood", "salt-black-stone", "tarnished-anchor-iron"],
    assets: proofSiteAssets("gloam", ["quarantine-pier", "tidewall-breach", "shuttered-store-bay"], ["anchor-shadow-post", "sealed-cargo-cradle", "bell-rope-davit", "brine-censer", "tide-ledger-stone"], ["saltgrass-whorl", "kelp-rope-tangle", "windthorn-clump"], "inward-anchor-walk"),
  },
  {
    slug: "warden-reed", siteId: "site.warden-reed", territoryId: "territory.dunmire", materials: ["bog-cured-timber", "drowned-limestone", "reed-cordage"],
    assets: proofSiteAssets("reed", ["sunk-walkway", "sluice-house-shell", "reedward-platform"], ["drainage-clapper", "pond-depth-stake", "mire-lantern-cradle", "sealed-physic-chest", "flood-mark-table"], ["sedge-crown", "ghost-reed-sheaf", "black-fern-fan"], "drowned-bridge-turn"),
  },
  {
    slug: "cairnmarket", siteId: "site.cairnmarket", territoryId: "territory.graven-march", materials: ["gravefield-stone", "smoke-aged-oak", "wool-ash-cloth"],
    assets: proofSiteAssets("cairn", ["market-cairn-wall", "ridge-road-shelter", "burial-timber-bay"], ["stone-weight-stall", "ashcloth-awning", "unread-tally-post", "bonewhite-rope-coil", "mourners-water-trough"], ["grave-thyme-clump", "wind-heather-crown", "crooked-pine-spray"], "procession-switchback"),
  },
  {
    slug: "hollow-abbey", siteId: "site.hollow-abbey", territoryId: "territory.hollow-abbey", materials: ["pale-karst-stone", "root-stained-mortar", "gravewax-bronze"],
    assets: proofSiteAssets("hollow", ["rootbound-arch", "ossuary-column", "sunken-stair-vault"], ["gravewax-stand", "silent-reliquary-box", "root-signal-basin", "bone-dust-sieve", "sealed-name-shelf"], ["pallid-root-mat", "cave-fern-wheel", "fungal-thread-cluster"], "echo-vault-descent"),
  },
  {
    slug: "salt-watch", siteId: "site.salt-watch", territoryId: "territory.mirror-salt-waste", materials: ["mirror-salt-crust", "wind-flayed-stone", "clouded-brass"],
    assets: proofSiteAssets("salt", ["false-horizon-wall", "crusted-watch-shelf", "wind-hollow-buttress"], ["ague-direction-vane", "brine-dry-basin", "veiled-signal-frame", "saltbound-pack-cradle", "horizon-measure-stone"], ["glasswort-spine", "white-thorn-cage", "dry-lichen-scroll"], "vanishing-causeway"),
  },
  {
    slug: "ember-gate", siteId: "site.ember-gate", territoryId: "territory.cinderward", materials: ["slag-black-basalt", "heat-checked-iron", "sulfur-clay"],
    assets: proofSiteAssets("ember", ["breath-kiln-shell", "mineral-hoist-frame", "slag-channel-bay"], ["soot-tithe-rack", "mute-bellows-cradle", "cinder-measure-bin", "sealed-ore-casket", "ash-mask-stand"], ["ember-thistle-knot", "smoke-lichen-fan", "slag-reed-clump"], "breathless-conveyor-rise"),
  },
] as const;

const ROLE_TOPOLOGY: Readonly<Record<BridgeAssetRole, readonly string[]>> = Object.freeze({
  structure: ["rebuild the load-bearing silhouette from modular game-space masses", "remove industrial regularity and introduce hand-set nonparallel joints", "add a navigable opening and dedicated simplified collision shell"],
  prop: ["replace the seed profile with an original ritual-use silhouette", "break radial and bilateral symmetry with functional Sable Reach attachments", "separate grip, contact, and occlusion forms for game interaction"],
  foliage: ["replace hard-surface repetition with territory-specific organic branching", "vary stem lengths and normals for wind-readable clusters", "author crossed low-LOD silhouette planes without source colour retention"],
  landmark_traversal: ["rebuild the route silhouette around player clearance and camera readability", "add an original Sable Reach landmark motif visible from all approach angles", "author walkable surface, obstruction shell, and distant LOD as separate topology"],
});

function makeAsset(site: SiteSeed, seed: AssetSeed, index: number): BridgeAssetDefinition {
  const id = `bridge.asset.${site.slug}.${seed.slug}`;
  const sourceSeedId = SOURCE_SEED_BY_ASSET_ID[id];
  if (!sourceSeedId?.startsWith("slipcurve-seed.")) throw new Error(`Missing accepted Slipcurve seed lineage for ${id}`);
  const materialMap = Object.freeze({ primary: site.materials[0], secondary: site.materials[1], binding: site.materials[2] });
  const colliderProfile = seed.role === "foliage"
    ? Object.freeze({ shape: "cylinder" as const, size: null, radius: 0.52, height: 2.8, collisionLayer: "traversal" as const, walkable: true })
    : seed.role === "prop"
      ? Object.freeze({ shape: "box" as const, size: Object.freeze([1.7, 1.6, 1.6] as const), radius: null, height: 1.6, collisionLayer: "static-world" as const, walkable: false })
      : seed.role === "landmark_traversal"
        ? Object.freeze({ shape: "box" as const, size: Object.freeze([7.2, 1, 6.4] as const), radius: null, height: 1, collisionLayer: "traversal" as const, walkable: true })
        : Object.freeze({ shape: "box" as const, size: Object.freeze([5.8, 4.8, 4.2] as const), radius: null, height: 4.8, collisionLayer: "static-world" as const, walkable: false });
  return Object.freeze({
    schemaVersion: 1 as const,
    id,
    slug: seed.slug,
    name: seed.name,
    siteId: site.siteId,
    territoryId: site.territoryId,
    role: seed.role,
    sourceSeedIds: Object.freeze([sourceSeedId]),
    runtimePath: `assets/3d/runtime/bridge/${site.slug}/${seed.slug}.glb`,
    semanticMaterialMapping: materialMap,
    topologyChanges: Object.freeze([...ROLE_TOPOLOGY[seed.role], `key the damage silhouette uniquely to ${seed.name}`]),
    damageAndAsymmetryRules: Object.freeze([`offset one major ${seed.role.replace("_", " ")} mass from its seed axis`, `remove or fracture one repeated element on the ${index % 2 ? "east" : "west"} side`, "retain a readable intact route or interaction face"]),
    pivot: Object.freeze({ mode: "ground_center" as const, offset: Object.freeze([0, 0, 0] as const) }),
    colliderProfile,
    territoryTags: Object.freeze([site.territoryId, site.slug, seed.role]),
    lineage: `${seed.name} uses one classified model-space seed only as proportion evidence; its topology, material language, damage rhythm, pivot, collider, and three LOD silhouettes are rebuilt for ${site.siteId}.`,
    originalityReview: Object.freeze({ status: "prototype_reviewed" as const, recognizableBorrowing: false as const, simpleRecolor: false as const, notes: `Original dark-fantasy reinterpretation for ${site.siteId}; source palette, annotations, construction taxonomy, and screen-space output are excluded.` }),
    maturity: "prototype_geometry" as const,
    strictProductionEligible: false as const,
    budgets: Object.freeze({ lod0Triangles: seed.role === "structure" || seed.role === "landmark_traversal" ? 12_000 : seed.role === "prop" ? 2_800 : 1_400, lod1Triangles: seed.role === "structure" || seed.role === "landmark_traversal" ? 4_000 : seed.role === "prop" ? 1_000 : 520, lod2Triangles: seed.role === "structure" || seed.role === "landmark_traversal" ? 1_200 : seed.role === "prop" ? 320 : 120, materialSlots: 3 }),
  });
}

export const SABLE_REACH_BRIDGE_ASSETS: readonly BridgeAssetDefinition[] = Object.freeze(SITE_SEEDS.flatMap((site) => site.assets.map((asset, index) => makeAsset(site, asset, index))));

export const SABLE_REACH_BRIDGE_ASSET_BY_ID: ReadonlyMap<string, BridgeAssetDefinition> = new Map(SABLE_REACH_BRIDGE_ASSETS.map((asset) => [asset.id, asset]));

export const SABLE_REACH_BRIDGE_RESKIN_RECIPES: readonly ReskinRecipeV1[] = Object.freeze(SABLE_REACH_BRIDGE_ASSETS.map((asset) => Object.freeze({
  schemaVersion: 1 as const,
  id: `bridge.recipe.${asset.siteId.slice("site.".length)}.${asset.slug}`,
  sableAssetId: asset.id,
  siteId: asset.siteId,
  sourceSeedIds: asset.sourceSeedIds,
  semanticMaterialMapping: asset.semanticMaterialMapping,
  topologyChanges: asset.topologyChanges,
  damageAndAsymmetryRules: asset.damageAndAsymmetryRules,
  pivot: asset.pivot,
  colliderProfile: asset.colliderProfile,
  territoryTags: asset.territoryTags,
  lineage: asset.lineage,
  originalityReview: asset.originalityReview,
  maturity: "prototype_geometry" as const,
})));

export const SABLE_REACH_BRIDGE_PACK_PLANS: readonly BridgePackPlan[] = Object.freeze(SITE_SEEDS.map((site) => {
  const assets = SABLE_REACH_BRIDGE_ASSETS.filter((asset) => asset.siteId === site.siteId);
  return Object.freeze({
    schemaVersion: 1 as const,
    id: `bridge.pack.${site.slug}`,
    siteId: site.siteId,
    assetIds: Object.freeze(assets.map(({ id }) => id)),
    outputPaths: Object.freeze(assets.map(({ runtimePath }) => runtimePath)),
    materialIds: Object.freeze([...new Set(assets.flatMap((asset) => Object.values(asset.semanticMaterialMapping)))]),
    maturity: "prototype_geometry" as const,
    strictProductionEligible: false as const,
    residencyLimits: Object.freeze({ discreteGpuBytes: 268_435_456 as const, integratedGpuBytes: 100_663_296 as const }),
  });
}));

/**
 * Materializes hashed runtime packs only after the generator supplies measured
 * binary and decoded GPU sizes. Authored plans never invent asset hashes.
 */
export function buildBridgeRuntimeAssetPacks(generated: readonly GeneratedBridgeDependency[]): readonly BridgeRuntimeAssetPack[] {
  const byAssetId = new Map<string, GeneratedBridgeDependency>();
  for (const dependency of generated) {
    if (byAssetId.has(dependency.id)) throw new Error(`Duplicate generated bridge dependency ${dependency.id}`);
    if (!/^[a-f0-9]{64}$/.test(dependency.sha256)) throw new Error(`Invalid generated SHA-256 for ${dependency.id}`);
    if (dependency.gpuBytes.total !== dependency.gpuBytes.vertex + dependency.gpuBytes.index + dependency.gpuBytes.textureMipChain) throw new Error(`GPU accounting mismatch for ${dependency.id}`);
    if (dependency.externalUris.length !== 0) throw new Error(`External URI declared by ${dependency.id}`);
    byAssetId.set(dependency.id, dependency);
  }
  const expectedIds = new Set(SABLE_REACH_BRIDGE_ASSETS.map(({ id }) => id));
  if (byAssetId.size !== expectedIds.size || [...expectedIds].some((id) => !byAssetId.has(id))) throw new Error("Generated bridge closure must resolve all 96 derivative assets exactly once");
  return Object.freeze(SABLE_REACH_BRIDGE_PACK_PLANS.map((plan) => {
    const dependencies = Object.freeze(plan.assetIds.map((assetId) => {
      const dependency = byAssetId.get(assetId)!;
      const expectedPath = SABLE_REACH_BRIDGE_ASSET_BY_ID.get(assetId)!.runtimePath;
      if (dependency.path !== expectedPath) throw new Error(`Runtime path mismatch for ${assetId}`);
      return Object.freeze({ ...dependency, gpuBytes: Object.freeze({ ...dependency.gpuBytes }), externalUris: Object.freeze([]) as readonly [] });
    }));
    const decodedGpuBytes = dependencies.reduce((total, dependency) => total + dependency.gpuBytes.total, 0);
    const encodedBytes = dependencies.reduce((total, dependency) => total + dependency.encodedBytes, 0);
    if (decodedGpuBytes > plan.residencyLimits.integratedGpuBytes) throw new Error(`${plan.id} exceeds the integrated active-closure GPU limit`);
    return Object.freeze({
      schemaVersion: 1 as const,
      id: plan.id,
      siteId: plan.siteId,
      maturity: "prototype_geometry" as const,
      dependencyIds: Object.freeze(dependencies.map(({ id }) => id)),
      dependencies,
      decodedGpuBytes,
      encodedBytes,
      limits: plan.residencyLimits,
      lods: Object.freeze([
        Object.freeze({ level: 0 as const, maximumDistanceMeters: 28, triangleBudget: 12_000 }),
        Object.freeze({ level: 1 as const, maximumDistanceMeters: 64, triangleBudget: 4_000 }),
        Object.freeze({ level: 2 as const, maximumDistanceMeters: 160, triangleBudget: 1_200 }),
      ]),
      materialIds: plan.materialIds,
      provenance: Object.freeze({
        sourceId: "slipcurve-sitelib" as const,
        authorizationId: "owner-authorized-cross-project-sitelib" as const,
        recipeIds: Object.freeze(plan.assetIds.map((assetId) => {
          const recipe = SABLE_REACH_BRIDGE_RESKIN_RECIPES.find(({ sableAssetId }) => sableAssetId === assetId);
          if (!recipe) throw new Error(`Runtime pack ${plan.id} cannot resolve recipe for ${assetId}`);
          return recipe.id;
        })),
      }),
    });
  }));
}

export function validateBridgeAssetDefinitions(assets: readonly BridgeAssetDefinition[] = SABLE_REACH_BRIDGE_ASSETS): readonly string[] {
  const errors: string[] = [];
  if (assets.length !== 96) errors.push(`Expected 96 derivatives, received ${assets.length}`);
  if (new Set(assets.map(({ id }) => id)).size !== assets.length) errors.push("Bridge derivative IDs are not unique");
  const expectedCounts = new Map(SITE_SEEDS.map((site) => [site.siteId, site.siteId === "site.hearthmere" ? 24 : 12]));
  for (const [siteId, count] of expectedCounts) if (assets.filter((asset) => asset.siteId === siteId).length !== count) errors.push(`${siteId} must define ${count} derivatives`);
  for (const site of SITE_SEEDS.filter(({ siteId }) => siteId !== "site.hearthmere")) {
    const siteAssets = assets.filter((asset) => asset.siteId === site.siteId);
    const roleCount = (role: BridgeAssetRole): number => siteAssets.filter((asset) => asset.role === role).length;
    if (roleCount("structure") !== 3 || roleCount("prop") !== 5 || roleCount("foliage") !== 3 || roleCount("landmark_traversal") !== 1) errors.push(`${site.siteId} must have a 3/5/3/1 role split`);
  }
  const forbidden = /slipcurve|masterformat|division[-_ ]?\d|autodesk|revit|trimble/i;
  for (const asset of assets) {
    if (asset.maturity !== "prototype_geometry" || asset.strictProductionEligible !== false) errors.push(`${asset.id} overstates maturity`);
    if (asset.topologyChanges.length < 4 || asset.damageAndAsymmetryRules.length < 3 || asset.originalityReview.simpleRecolor) errors.push(`${asset.id} is not a substantial reskin`);
    if (asset.sourceSeedIds.length !== 1 || !asset.sourceSeedIds[0]?.startsWith("slipcurve-seed.")) errors.push(`${asset.id} has unresolved source seed lineage`);
    if (asset.pivot.mode !== "ground_center" || asset.pivot.offset.some((axis) => axis !== 0) || asset.colliderProfile.height <= 0 || (asset.colliderProfile.shape === "box" ? !asset.colliderProfile.size?.every((axis) => axis > 0) : !(asset.colliderProfile.radius && asset.colliderProfile.radius > 0))) errors.push(`${asset.id} lacks a corrected pivot or usable collider profile`);
    if (forbidden.test(`${asset.id} ${asset.name} ${asset.runtimePath}`)) errors.push(`${asset.id} leaks forbidden source vocabulary into runtime identity`);
  }
  return Object.freeze(errors);
}
