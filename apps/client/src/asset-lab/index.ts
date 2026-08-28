import type { DeveloperAssetLabController, DeveloperAssetLabOptions } from "./DeveloperAssetLab.js";

/** Vite keeps the lab implementation in a separate chunk even if this seam is imported at startup. */
export async function loadDeveloperAssetLab(host: HTMLElement, options: DeveloperAssetLabOptions): Promise<DeveloperAssetLabController> {
  const module = await import("./DeveloperAssetLab.js");
  return module.mountDeveloperAssetLab(host, options);
}

export type { DeveloperAssetLabController, DeveloperAssetLabOptions };
