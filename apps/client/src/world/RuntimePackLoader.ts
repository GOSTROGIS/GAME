import type { RuntimeAssetPackV1 } from "@hollow-march/shared";

export const BRIDGE_RUNTIME_ASSET_ROOT = "/assets/3d/runtime/bridge/";

export interface RuntimePackModuleLike {
  readonly default?: unknown;
  readonly packs?: readonly unknown[];
  readonly runtimeAssetPacks?: readonly unknown[];
}

export type RuntimePackImporter = () => Promise<RuntimePackModuleLike>;

export function bridgeRuntimeAssetUrl(siteSlug: string, assetSlug: string): string {
  const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slug.test(siteSlug) || !slug.test(assetSlug)) throw new Error("Bridge runtime paths require canonical lower-kebab slugs");
  return `${BRIDGE_RUNTIME_ASSET_ROOT}${siteSlug}/${assetSlug}.glb`;
}

function isPack(value: unknown): value is RuntimeAssetPackV1 {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<RuntimeAssetPackV1>;
  return candidate.schemaVersion === 1
    && typeof candidate.id === "string"
    && candidate.id.startsWith("bridge.pack.")
    && typeof candidate.siteId === "string"
    && candidate.maturity === "prototype_geometry"
    && Array.isArray(candidate.dependencies)
    && Array.isArray(candidate.dependencyIds);
}

/**
 * The caller supplies a dynamic import. Keeping the importer outside this
 * module prevents the content catalog or seven site packs entering startup.
 */
export async function loadRuntimePackForSite(importer: RuntimePackImporter, siteId: string): Promise<RuntimeAssetPackV1> {
  const module = await importer();
  const candidates = Array.isArray(module.runtimeAssetPacks)
    ? module.runtimeAssetPacks
    : Array.isArray(module.packs)
      ? module.packs
      : Array.isArray(module.default)
        ? module.default
        : [module.default];
  const packs = candidates.filter(isPack);
  const pack = packs.find((candidate) => candidate.siteId === siteId);
  if (!pack) throw new Error(`No prototype runtime pack resolves site ${siteId}`);
  return pack;
}
