export interface DeveloperCatalogRecordLike {
  readonly id: string;
  readonly classification: "accepted_seed" | "quarantined" | "rejected";
  readonly maturity: "prototype_geometry";
  readonly reason: string;
  readonly suitabilityTags?: readonly string[];
}

export interface DeveloperCatalogModuleLike {
  readonly records?: readonly DeveloperCatalogRecordLike[];
  readonly default?: readonly DeveloperCatalogRecordLike[] | { readonly records?: readonly DeveloperCatalogRecordLike[] };
}

export interface DeveloperAssetLabOptions {
  /** This must itself be a dynamic import; the lab calls it only after explicit user action. */
  readonly catalogImporter: () => Promise<DeveloperCatalogModuleLike>;
}

export interface DeveloperAssetLabController { destroy(): void }

function resolveRecords(module: DeveloperCatalogModuleLike): readonly DeveloperCatalogRecordLike[] {
  if (Array.isArray(module.records)) return module.records;
  if (Array.isArray(module.default)) return module.default;
  const nested = module.default as { readonly records?: readonly DeveloperCatalogRecordLike[] } | undefined;
  if (nested && Array.isArray(nested.records)) return nested.records;
  throw new Error("Developer catalog module does not export records");
}

function validateRecords(records: readonly DeveloperCatalogRecordLike[]): void {
  if (records.length !== 1087) throw new Error(`Developer bridge catalog must contain 1,087 representatives, received ${records.length}`);
  if (new Set(records.map(({ id }) => id)).size !== records.length) throw new Error("Developer bridge catalog contains duplicate IDs");
  if (records.some(({ maturity }) => maturity !== "prototype_geometry")) throw new Error("Developer bridge catalog contains an overstated maturity claim");
}

export function mountDeveloperAssetLab(host: HTMLElement, options: DeveloperAssetLabOptions): DeveloperAssetLabController {
  host.replaceChildren();
  const section = document.createElement("section");
  section.setAttribute("aria-label", "Prototype bridge asset catalog");
  const heading = document.createElement("h2");
  heading.textContent = "Prototype bridge asset catalog";
  const disclosure = document.createElement("p");
  disclosure.textContent = "Catalog data is not in the startup bundle. Records are prototype seed geometry, not production assets.";
  const load = document.createElement("button");
  load.type = "button";
  load.textContent = "Load 1,087-record developer catalog";
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.textContent = "Catalog not loaded.";
  section.append(heading, disclosure, load, status);
  host.append(section);
  let destroyed = false;

  const onLoad = async (): Promise<void> => {
    load.disabled = true;
    status.textContent = "Loading catalog on demand…";
    try {
      const records = resolveRecords(await options.catalogImporter());
      if (destroyed) return;
      validateRecords(records);
      const counts = { accepted_seed: 0, quarantined: 0, rejected: 0 };
      for (const record of records) counts[record.classification] += 1;
      status.textContent = `${records.length.toLocaleString()} prototype records loaded: ${counts.accepted_seed} accepted seeds, ${counts.quarantined} quarantined, ${counts.rejected} rejected.`;
    } catch (error) {
      if (destroyed) return;
      status.textContent = `Catalog unavailable: ${error instanceof Error ? error.message : "unknown error"}`;
      load.disabled = false;
    }
  };
  load.addEventListener("click", onLoad);
  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      load.removeEventListener("click", onLoad);
      host.replaceChildren();
    },
  };
}
