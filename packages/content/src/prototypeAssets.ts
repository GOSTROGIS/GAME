import prototypeAssetsJson from "../manifests/sable-reach.prototype-assets.json" with { type: "json" };

export interface PrototypeCreatureAssetDefinition {
  id: string;
  familyId: string;
}

export interface PrototypeLocationAssetDefinition {
  id: string;
  siteId: string;
}

export interface PrototypeCreatureAssetManifest {
  schemaVersion: 1;
  id: string;
  classification: "procedural_prototype_assets";
  generator: { id: string; sourcePath: string; sourceSha256: string; licenseId: "project-original"; creator: string; delivery: string };
  locationGenerator: { id: string; sourcePath: string; sourceSha256: string; licenseId: "project-original"; creator: string; delivery: string };
  budgets: { maximumTrianglesPerPrototype: number; maximumMeshesPerPrototype: number; maximumMaterialSlotsPerPrototype: number; productionAssetEquivalent: false };
  assets: readonly PrototypeCreatureAssetDefinition[];
  locationAssets: readonly PrototypeLocationAssetDefinition[];
  maturity: { prototypeAsset: true; productionAsset: false; playtested: false };
}

export const SABLE_REACH_PROTOTYPE_ASSETS = prototypeAssetsJson as PrototypeCreatureAssetManifest;

export function validatePrototypeCreatureAssets(): readonly string[] {
  const errors: string[] = [];
  if (SABLE_REACH_PROTOTYPE_ASSETS.assets.length !== 21) errors.push("Exactly 21 prototype creature assets are required");
  const ids = new Set<string>(); const families = new Set<string>();
  for (const asset of SABLE_REACH_PROTOTYPE_ASSETS.assets) {
    if (ids.has(asset.id) || families.has(asset.familyId) || asset.id !== `prototype_creature.${asset.familyId}`) errors.push(`Invalid or duplicate prototype asset ${asset.id}`);
    ids.add(asset.id); families.add(asset.familyId);
  }
  if (SABLE_REACH_PROTOTYPE_ASSETS.locationAssets.length !== 7) errors.push("Exactly seven prototype location assets are required");
  const locationIds = new Set<string>(); const locationSites = new Set<string>();
  for (const asset of SABLE_REACH_PROTOTYPE_ASSETS.locationAssets) {
    if (locationIds.has(asset.id) || locationSites.has(asset.siteId) || asset.id !== `prototype_location.${asset.siteId.slice("site.".length)}`) errors.push(`Invalid or duplicate prototype location ${asset.id}`);
    locationIds.add(asset.id); locationSites.add(asset.siteId);
  }
  if (!/^[a-f0-9]{64}$/.test(SABLE_REACH_PROTOTYPE_ASSETS.generator.sourceSha256)) errors.push("Prototype generator source hash is invalid");
  if (!/^[a-f0-9]{64}$/.test(SABLE_REACH_PROTOTYPE_ASSETS.locationGenerator.sourceSha256)) errors.push("Prototype location generator source hash is invalid");
  if (SABLE_REACH_PROTOTYPE_ASSETS.maturity.productionAsset || SABLE_REACH_PROTOTYPE_ASSETS.maturity.playtested) errors.push("Prototype asset manifest overstates maturity");
  return Object.freeze(errors);
}
