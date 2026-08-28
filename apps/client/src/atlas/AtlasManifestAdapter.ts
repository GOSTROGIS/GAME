import type {
  AtlasEvidenceStatus,
  AtlasLineFeature,
  AtlasPoint,
  AtlasSiteFeature,
  AtlasSiteKind,
  ReferenceAtlasData,
} from "./ReferenceAtlas.js";

type Coordinate2 = readonly [number, number];
type Coordinate3 = readonly [number, number, number];

export interface SableReachAtlasRuntimeManifestLike {
  schemaVersion: number;
  id: string;
  name: string;
  classification: string;
  maturity: {
    atlas: string;
    seamlessTraversal: boolean;
    productionTerrainAssets: boolean;
  };
  coordinateReferenceSystem: { id: string };
  extent: {
    minimumEasting: number;
    minimumNorthing: number;
    maximumEasting: number;
    maximumNorthing: number;
  };
  hydrology: {
    streams: readonly {
      id: string;
      name: string;
      coordinates: readonly Coordinate2[];
      profileStatus: string;
    }[];
  };
  territories: readonly {
    id: string;
    name: string;
    substrate: string;
    polygon: readonly Coordinate2[];
  }[];
  sites: readonly {
    id: string;
    name: string;
    kind: string;
    territoryId: string;
    coordinate: Coordinate3;
    waterSource?: string;
    access?: string;
    subsistence?: string;
    industry?: string;
    burialPractice?: string;
    governance?: string;
    productionStatus: string;
  }[];
  routes: readonly {
    id: string;
    name: string;
    historicalReason: string;
    sections: readonly {
      id: string;
      coordinates: readonly Coordinate2[];
      walkingSeconds: number;
    }[];
  }[];
  familyShowcases: readonly {
    familyId: string;
    proofLocationId: string;
    encounterStatus: string;
  }[];
  contentSha256: string;
}

export interface AtlasManifestAdapterOptions {
  hillshadeUrl?: string;
  staticMapUrl?: string;
  discoveredSiteIds?: ReadonlySet<string>;
}

const point = (coordinate: readonly [number, number, ...number[]]): AtlasPoint => ({ easting: coordinate[0], northing: coordinate[1] });
const validKind = (kind: string): AtlasSiteKind => kind === "settlement" || kind === "ruin" || kind === "landmark" || kind === "encounter" ? kind : "site";

function siteSummary(site: SableReachAtlasRuntimeManifestLike["sites"][number]): string {
  const facts = [
    site.waterSource ? `Water: ${site.waterSource}.` : "",
    site.access ? `Access: ${site.access}.` : "",
    site.industry ? `Industry: ${site.industry}.` : "",
    site.burialPractice ? `Burial practice: ${site.burialPractice}.` : "",
    site.governance ? `Governance: ${site.governance}.` : "",
  ].filter(Boolean);
  return facts.length ? facts.join(" ") : `${site.name} is atlas-placed world data; its seamless production terrain is not complete.`;
}

/** Converts the committed GIS runtime artifact into the renderer's narrow UI model. */
export function adaptSableReachAtlasManifest(
  manifest: SableReachAtlasRuntimeManifestLike,
  options: AtlasManifestAdapterOptions = {},
): ReferenceAtlasData {
  if (manifest.schemaVersion !== 1) throw new Error(`Unsupported Sable Reach atlas schema ${manifest.schemaVersion}`);
  if (manifest.coordinateReferenceSystem.id !== "veyl_local_grid_v1") throw new Error(`Unsupported atlas coordinate space ${manifest.coordinateReferenceSystem.id}`);
  if (manifest.classification !== "fictional_modeled_not_measured") throw new Error(`Atlas classification must disclose fictional modelled geography`);
  if (manifest.maturity.atlas !== "gis_valid") throw new Error(`Atlas runtime artifact has not passed the GIS-valid gate`);
  const showcaseFamilies = new Set(manifest.familyShowcases.map(({ familyId }) => familyId));
  if (manifest.familyShowcases.length !== 21 || showcaseFamilies.size !== 21) throw new Error(`Atlas must place exactly one showcase for each of 21 creature families`);

  const routes: AtlasLineFeature[] = manifest.routes.flatMap((route) => route.sections.map((section) => ({
    id: section.id,
    name: `${route.name}: ${route.historicalReason}`,
    points: section.coordinates.map(point),
    evidence: "modelled" as AtlasEvidenceStatus,
    travelMinutes: Math.max(1, Math.round(section.walkingSeconds / 60)),
  })));
  const discovered = options.discoveredSiteIds ?? new Set(["site.hearthmere"]);
  const sites: AtlasSiteFeature[] = manifest.sites.map((site) => ({
    id: site.id,
    name: site.name,
    kind: validKind(site.kind),
    coordinate: point(site.coordinate),
    territoryId: site.territoryId,
    discovered: discovered.has(site.id),
    evidence: "authored",
    summary: siteSummary(site),
    ...(site.id === "site.hearthmere" ? { travelMinutesFromHearthmere: 0 } : {}),
  }));
  const generationVersion = manifest.contentSha256 ? manifest.contentSha256.slice(0, 12) : "unhashed";

  return {
    id: manifest.id.replaceAll(".", "_"),
    title: "Sable Reach",
    coordinateSpaceId: "veyl_local_grid_v1",
    generationVersion,
    extent: {
      minEasting: manifest.extent.minimumEasting,
      minNorthing: manifest.extent.minimumNorthing,
      maxEasting: manifest.extent.maximumEasting,
      maxNorthing: manifest.extent.maximumNorthing,
    },
    terrainContours: [],
    territories: manifest.territories.map((territory) => ({
      id: territory.id,
      name: territory.name,
      polygon: territory.polygon.map(point),
      evidence: "authored",
      description: `${territory.name} territory polygon; dominant substrate ${territory.substrate.replaceAll("_", " ")}.`,
    })),
    waterways: manifest.hydrology.streams.map((stream) => ({
      id: stream.id,
      name: stream.name,
      points: stream.coordinates.map(point),
      evidence: "modelled",
    })),
    routes,
    sites,
    disclosure: `Fictional modelled geography in ${manifest.coordinateReferenceSystem.id}. Hydrology and travel times are derived; territories and sites are authored. Atlas gate: ${manifest.maturity.atlas.replaceAll("_", " ")}. Seamless traversal: ${manifest.maturity.seamlessTraversal ? "available" : "not complete"}. Production terrain: ${manifest.maturity.productionTerrainAssets ? "available" : "not complete"}.`,
    ...(options.hillshadeUrl ? { hillshadeUrl: options.hillshadeUrl } : {}),
    ...(options.staticMapUrl ? { staticMapUrl: options.staticMapUrl } : {}),
  };
}
