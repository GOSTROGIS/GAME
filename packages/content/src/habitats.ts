import { BESTIARY, type CreatureDefinitionV3 } from "./bestiary.js";
import { SABLE_REACH_ATLAS, SABLE_REACH_MACRO_CELLS, findAtlasRoute, type AtlasCoordinate } from "./atlas.js";

export interface CreatureHabitatPlacement {
  creatureId: string;
  familyId: string;
  habitatCellId: string;
  habitatIds: readonly string[];
  territoryId: string;
  representativeCoordinate: AtlasCoordinate;
  routeNodeId: string;
  reachable: true;
  uniqueAnchorId: string | null;
}

const proofSiteByTerritory = new Map<string, string>();
for (const proof of SABLE_REACH_ATLAS.proofLocations) {
  const site = SABLE_REACH_ATLAS.sites.find(({ id }) => id === proof.siteId);
  if (site) proofSiteByTerritory.set(site.territoryId, site.id);
}

const hashIndex = (id: string, modulo: number): number => {
  let hash = 2166136261;
  for (const code of new TextEncoder().encode(id)) { hash ^= code; hash = Math.imul(hash, 16777619); }
  return (hash >>> 0) % modulo;
};

function candidatesFor(creature: CreatureDefinitionV3) {
  return SABLE_REACH_MACRO_CELLS.filter((cell) => creature.habitatProfile.territoryIds.includes(cell.territoryId)
    && cell.habitatIds.some((id) => creature.habitatProfile.habitatIds.includes(id))
    && proofSiteByTerritory.has(cell.territoryId));
}

export const CREATURE_HABITAT_PLACEMENTS: readonly CreatureHabitatPlacement[] = Object.freeze(BESTIARY.map((creature) => {
  const candidates = candidatesFor(creature);
  if (!candidates.length) throw new Error(`${creature.id} has no viable atlas habitat cell`);
  const cell = candidates[hashIndex(creature.id, candidates.length)]!;
  const routeNodeId = proofSiteByTerritory.get(cell.territoryId)!;
  if (!findAtlasRoute("site.hearthmere", routeNodeId).valid) throw new Error(`${creature.id} habitat is not route reachable`);
  const match = /^atlas\.cell\.r(\d+)\.c(\d+)$/.exec(cell.id);
  if (!match) throw new Error(`Invalid macro cell ID ${cell.id}`);
  const row = Number(match[1]); const column = Number(match[2]); const size = SABLE_REACH_ATLAS.macroCells.cellSizeMeters;
  return Object.freeze({
    creatureId: creature.id,
    familyId: creature.familyId,
    habitatCellId: cell.id,
    habitatIds: Object.freeze(cell.habitatIds.filter((id) => creature.habitatProfile.habitatIds.includes(id))),
    territoryId: cell.territoryId,
    representativeCoordinate: Object.freeze([(column + 0.5) * size, (row + 0.5) * size, cell.meanElevationMeters]) as AtlasCoordinate,
    routeNodeId,
    reachable: true,
    uniqueAnchorId: creature.rank === "boss" || creature.rank === "miniboss" ? creature.habitatProfile.uniqueAnchorId : null,
  });
}));

export const CREATURE_HABITAT_PLACEMENT_BY_ID: ReadonlyMap<string, CreatureHabitatPlacement> = new Map(CREATURE_HABITAT_PLACEMENTS.map((item) => [item.creatureId, item]));

export function validateCreatureHabitatPlacements(): readonly string[] {
  const errors: string[] = [];
  const creatureIds = new Set<string>();
  const uniqueAnchors = new Set<string>();
  for (const placement of CREATURE_HABITAT_PLACEMENTS) {
    const creature = BESTIARY.find(({ id }) => id === placement.creatureId);
    if (!creature || creatureIds.has(placement.creatureId)) errors.push(`Missing or duplicate creature placement ${placement.creatureId}`);
    creatureIds.add(placement.creatureId);
    const cell = SABLE_REACH_MACRO_CELLS.find(({ id }) => id === placement.habitatCellId);
    if (!cell || cell.territoryId !== placement.territoryId || !placement.habitatIds.some((id) => cell.habitatIds.includes(id))) errors.push(`Invalid habitat resolution for ${placement.creatureId}`);
    if (!placement.reachable || !findAtlasRoute("site.hearthmere", placement.routeNodeId).valid) errors.push(`Unreachable habitat for ${placement.creatureId}`);
    if (creature && (creature.rank === "boss" || creature.rank === "miniboss")) {
      if (!placement.uniqueAnchorId || uniqueAnchors.has(placement.uniqueAnchorId)) errors.push(`Unique creature anchor is missing or duplicated for ${placement.creatureId}`);
      else uniqueAnchors.add(placement.uniqueAnchorId);
    } else if (placement.uniqueAnchorId !== null) errors.push(`Population creature ${placement.creatureId} has a unique anchor`);
  }
  if (creatureIds.size !== BESTIARY.length) errors.push(`Expected ${BESTIARY.length} creature habitat placements, received ${creatureIds.size}`);
  return Object.freeze(errors);
}
