import type { WorldTransform } from "./contracts.js";

export const VEYL_LOCAL_GRID_V1 = "veyl_local_grid_v1" as const;
export const HEARTHMERE_LOCAL_METERS = "hearthmere_local_meters" as const;
export const SITE_LOCAL_METERS_V1 = "site_local_meters_v1" as const;
export const HEARTHMERE_SITE_ID = "site.hearthmere" as const;
export const HEARTHMERE_TERRITORY_ID = "territory.graven-march" as const;

export type CoordinateSpaceId = typeof VEYL_LOCAL_GRID_V1 | typeof HEARTHMERE_LOCAL_METERS | typeof SITE_LOCAL_METERS_V1 | (string & {});

export interface AtlasCoordinate {
  easting: number;
  northing: number;
  elevation: number;
}

export interface SpatialAddress {
  coordinateSpaceId: CoordinateSpaceId;
  territoryId: string;
  siteId: string | null;
  macroCellId: string | null;
}

export interface SiteTransform {
  siteId: string;
  atlasCoordinateSpaceId: CoordinateSpaceId;
  localCoordinateSpaceId: CoordinateSpaceId;
  atlasOrigin: AtlasCoordinate;
  localAxes: Readonly<{
    x: "east";
    y: "up";
    z: "south";
  }>;
}

/** Identifies how the save's top-level transform should be interpreted. */
export interface SpatialContext {
  address: SpatialAddress;
  siteTransform: SiteTransform | null;
}

export const HEARTHMERE_SITE_TRANSFORM: Readonly<SiteTransform> = Object.freeze({
  siteId: HEARTHMERE_SITE_ID,
  atlasCoordinateSpaceId: VEYL_LOCAL_GRID_V1,
  localCoordinateSpaceId: HEARTHMERE_LOCAL_METERS,
  atlasOrigin: Object.freeze({ easting: 6400, northing: 8320, elevation: 184 }),
  localAxes: Object.freeze({ x: "east", y: "up", z: "south" }),
});

export const HEARTHMERE_SPATIAL_CONTEXT: Readonly<SpatialContext> = Object.freeze({
  address: Object.freeze({
    coordinateSpaceId: HEARTHMERE_LOCAL_METERS,
    territoryId: HEARTHMERE_TERRITORY_ID,
    siteId: HEARTHMERE_SITE_ID,
    macroCellId: "atlas.cell.r16.c12",
  }),
  siteTransform: HEARTHMERE_SITE_TRANSFORM,
});

/** Converts Hearthmere's Y-up, +Z-south transform to the atlas engineering grid. */
export function siteToAtlasCoordinate(transform: WorldTransform, site: SiteTransform): AtlasCoordinate {
  return {
    easting: site.atlasOrigin.easting + transform.x,
    northing: site.atlasOrigin.northing - transform.z,
    elevation: site.atlasOrigin.elevation + transform.y,
  };
}

/** Converts an atlas coordinate back to Hearthmere's Y-up, +Z-south space. */
export function atlasToSiteTransform(coordinate: AtlasCoordinate, yaw: number, site: SiteTransform): WorldTransform {
  return {
    x: coordinate.easting - site.atlasOrigin.easting,
    y: coordinate.elevation - site.atlasOrigin.elevation,
    z: site.atlasOrigin.northing - coordinate.northing,
    yaw,
  };
}
