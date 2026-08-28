import { SABLE_REACH_ATLAS, findAtlasRoute, type AtlasCoordinate, type SiteLocalCoordinate } from "./atlas.js";

export type PlacementKind = "character" | "quest" | "landmark" | "gather_node";

export interface CanonicalPlacement {
  id: string;
  kind: PlacementKind;
  siteId: string;
  territoryId: string;
  atlasCoordinate: AtlasCoordinate;
  localCoordinate: SiteLocalCoordinate | null;
  placementStatus: "site_anchor" | "runtime_placed";
  legacyRegionId: string;
  note: string;
}

const sites = new Map(SABLE_REACH_ATLAS.sites.map((site) => [site.id, site]));
const SITE_FOR_REGION = Object.freeze({
  hearthmere: "site.hearthmere",
  graven_march: "site.cairnmarket",
  dunmire: "site.warden-reed",
  cinderward: "site.ember-gate",
  hollow_abbey: "site.hollow-abbey",
} as const);

type LegacyRegionId = keyof typeof SITE_FOR_REGION;
type PlacementSeed = readonly [id: string, legacyRegionId: LegacyRegionId];

const CHARACTER_SEEDS: readonly PlacementSeed[] = [
  ["maela_voss", "hearthmere"], ["avren_doss", "hearthmere"], ["bera_claymother", "hearthmere"], ["fenn_joryn", "hearthmere"], ["dessa_mirel", "hearthmere"], ["kett_sable", "hearthmere"], ["torren_vale", "hearthmere"], ["alda_rime", "hearthmere"], ["iva_pell", "hearthmere"], ["ilse_crow", "hearthmere"],
  ["neris_thorn", "dunmire"], ["ysra_pell", "hearthmere"], ["nima_reed", "dunmire"], ["cal_harrow", "dunmire"], ["tess_fen", "dunmire"], ["roan_drel", "dunmire"], ["rin_waymark", "dunmire"],
  ["edda_quill", "cinderward"], ["orik_senn", "cinderward"], ["sava_quench", "cinderward"], ["tarn_widow", "cinderward"], ["mera_bolt", "cinderward"], ["dain_coal", "cinderward"], ["pritch_glass", "cinderward"], ["teth_varo", "cinderward"], ["iri_north", "cinderward"], ["orris_pale", "cinderward"],
  ["bram_caul", "graven_march"], ["olan_vey", "graven_march"], ["vellin_the_unwritten", "graven_march"], ["kora_path", "graven_march"], ["marn_upland", "graven_march"], ["sera_dusk", "graven_march"], ["garran_low", "graven_march"],
  ["gatewarden_nhal", "hollow_abbey"], ["moira_quiet", "hollow_abbey"], ["seln_clause", "hollow_abbey"], ["brother_iven", "hollow_abbey"], ["aven_tongueless", "hollow_abbey"], ["elo_veer", "hollow_abbey"], ["mott_vane", "hollow_abbey"], ["netta_aster", "hollow_abbey"],
];

const QUEST_SEEDS: readonly PlacementSeed[] = [
  ["main_embers_at_dusk", "hearthmere"], ["main_bells_below", "hearthmere"], ["main_the_cinder_seal", "cinderward"], ["main_a_litany_unspoken", "hollow_abbey"], ["side_a_smiths_debt", "hearthmere"], ["side_the_map_that_forgets", "graven_march"], ["side_mercy_in_the_reeds", "dunmire"],
];

const LANDMARK_SEEDS: readonly PlacementSeed[] = [
  ["hearthmere_square", "hearthmere"], ["old_vigil_shrine", "hearthmere"], ["warm_cairn", "graven_march"], ["pilgrim_cut", "graven_march"], ["reedward_bridge", "dunmire"], ["sunken_vestry", "dunmire"], ["drowned_bell_rope", "dunmire"], ["nameless_mirebound", "dunmire"], ["widow_forge", "cinderward"], ["glasswood_rise", "cinderward"], ["abbey_gate", "hollow_abbey"], ["mute_nave", "hollow_abbey"], ["last_bell_crypt", "hollow_abbey"], ["memory_clapper", "hollow_abbey"],
];

const NODE_SEEDS: readonly PlacementSeed[] = [
  ["node_grave_moss_01", "dunmire"], ["node_grave_moss_02", "dunmire"], ["node_witch_reed_01", "dunmire"], ["node_ember_iron_01", "cinderward"], ["node_ember_iron_02", "cinderward"], ["node_blackpine_01", "graven_march"], ["node_reliquary_01", "hollow_abbey"],
];

const HEARTHMERE_LOCAL: Readonly<Record<string, SiteLocalCoordinate>> = Object.freeze({
  maela_voss: [32, 0, 16],
  torren_vale: [36, 0, 20],
  ysra_pell: [20, 0, 28],
  hearthmere_square: [28, 0, 20],
  old_vigil_shrine: [16, 0, 28],
});

function placement([id, legacyRegionId]: PlacementSeed, kind: PlacementKind): CanonicalPlacement {
  const siteId = SITE_FOR_REGION[legacyRegionId];
  const site = sites.get(siteId);
  if (!site) throw new Error(`Placement ${id} references missing site ${siteId}`);
  const localCoordinate = HEARTHMERE_LOCAL[id] ?? null;
  const atlasCoordinate: AtlasCoordinate = localCoordinate
    ? [site.coordinate[0] + localCoordinate[0], site.coordinate[1] - localCoordinate[2], site.coordinate[2] + localCoordinate[1]]
    : site.coordinate;
  return Object.freeze({
    id,
    kind,
    siteId,
    territoryId: site.territoryId,
    atlasCoordinate,
    localCoordinate,
    placementStatus: localCoordinate ? "runtime_placed" : "site_anchor",
    legacyRegionId,
    note: localCoordinate
      ? "Existing Hearthmere local coordinate preserved explicitly; no global legacy-grid transform applied."
      : "Legacy stable ID assigned explicitly to an atlas site; final within-site production placement remains separate.",
  });
}

export const SABLE_REACH_PLACEMENTS: readonly CanonicalPlacement[] = Object.freeze([
  ...CHARACTER_SEEDS.map((seed) => placement(seed, "character")),
  ...QUEST_SEEDS.map((seed) => placement(seed, "quest")),
  ...LANDMARK_SEEDS.map((seed) => placement(seed, "landmark")),
  ...NODE_SEEDS.map((seed) => placement(seed, "gather_node")),
]);

export const SABLE_REACH_PLACEMENT_BY_ID: ReadonlyMap<string, CanonicalPlacement> = new Map(SABLE_REACH_PLACEMENTS.map((item) => [item.id, item]));

export function validateSableReachPlacements(): readonly string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const item of SABLE_REACH_PLACEMENTS) {
    if (ids.has(item.id)) errors.push(`Duplicate placement ${item.id}`);
    ids.add(item.id);
    const site = sites.get(item.siteId);
    if (!site || site.territoryId !== item.territoryId) errors.push(`${item.id} has an invalid site/territory address`);
    if (!findAtlasRoute("site.hearthmere", item.siteId).valid) errors.push(`${item.id} belongs to an unreachable site`);
  }
  for (const id of ["maela_voss", "torren_vale", "ysra_pell"]) {
    if (!SABLE_REACH_PLACEMENT_BY_ID.get(id)?.localCoordinate) errors.push(`${id} lost the existing Hearthmere local coordinate`);
  }
  return Object.freeze(errors);
}
