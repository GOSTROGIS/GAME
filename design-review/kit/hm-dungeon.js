/* Dungeon generation and CHUNK STREAMING.
 *
 * A dungeon is its own streaming scope. It shares no clock, no lighting rig
 * and no residency budget with the surface, and it never renders all at once
 * — which is exactly why a dungeon can afford geometry density the outside
 * world cannot.
 *
 * The layout is a deterministic function of a seed, so a dungeon is addressed
 * by (seed, floor) and rebuilt rather than stored — the same principle as the
 * asset catalogue. Chunks build on entry and are disposed on exit, so
 * resident cost is bounded by the streaming radius, not by dungeon size.
 */
import { THREE, MAT, rnd, jitter, part, limb, torus, cone, ico, seat } from './hm-core.js';
import { STEAM, aetherLamp, pressureGauge, pipeRun, chainLiftBlock, valveWheel, ventStack, governorFlyball } from './hm-steam.js';
import { applyFinish } from './hm-biome.js';
import { mergeByMaterial, geoTris } from './hm-world.js';

const box = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);
export const CELL = 4;          // metres per dungeon cell
export const CHUNK = 5;         // cells per chunk edge
const WALL_H = 4.4;

/* ------------------------------------------------------------------ layout */
export function generateLayout(seed, gw = 40, gh = 40) {
  const rand = rnd(seed);
  const cells = new Map();
  const rooms = [];
  const key = (x, z) => x + ',' + z;

  // Rooms first: rejection-sampled rects, so corridors have somewhere to go.
  for (let attempt = 0; attempt < 220 && rooms.length < 26; attempt++) {
    const w = 3 + Math.floor(rand() * 5);
    const h = 3 + Math.floor(rand() * 5);
    const x = 1 + Math.floor(rand() * (gw - w - 2));
    const z = 1 + Math.floor(rand() * (gh - h - 2));
    const pad = 1;
    const clash = rooms.some((r) => x - pad < r.x + r.w && x + w + pad > r.x && z - pad < r.z + r.h && z + h + pad > r.z);
    if (clash) continue;
    const room = { id: rooms.length, x, z, w, h, cx: x + w / 2, cz: z + h / 2 };
    // Room roles drive what gets dressed into them.
    const roll = rand();
    room.role = roll < 0.14 ? 'arena' : roll < 0.3 ? 'machine' : roll < 0.42 ? 'cistern' : roll < 0.56 ? 'shaft' : 'gallery';
    rooms.push(room);
    for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) cells.set(key(x + i, z + j), { t: 'room', room: room.id });
  }

  // Connect each room to the previous one with an L corridor. Simple, and it
  // guarantees the whole floor is reachable — a dungeon with an orphaned wing
  // is a bug, not a feature.
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1], b = rooms[i];
    let x = Math.floor(a.cx), z = Math.floor(a.cz);
    const tx = Math.floor(b.cx), tz = Math.floor(b.cz);
    const xFirst = rand() > 0.5;
    const stepX = () => { while (x !== tx) { x += Math.sign(tx - x); if (!cells.has(key(x, z))) cells.set(key(x, z), { t: 'corridor' }); } };
    const stepZ = () => { while (z !== tz) { z += Math.sign(tz - z); if (!cells.has(key(x, z))) cells.set(key(x, z), { t: 'corridor' }); } };
    if (xFirst) { stepX(); stepZ(); } else { stepZ(); stepX(); }
  }

  const chunksX = Math.ceil(gw / CHUNK), chunksZ = Math.ceil(gh / CHUNK);
  return { cells, rooms, gw, gh, chunksX, chunksZ, seed, key };
}

export const cellAt = (layout, x, z) => layout.cells.get(x + ',' + z);
export const worldX = (layout, x) => (x - layout.gw / 2 + 0.5) * CELL;
export const worldZ = (layout, z) => (z - layout.gh / 2 + 0.5) * CELL;

/* ------------------------------------------------------------ chunk build */

/** Build one chunk: floor slabs, wall panels where a neighbour is missing,
 *  and dressed props for any room whose centre falls inside. Everything is
 *  merged per material before it leaves this function, so a chunk costs a
 *  handful of draw calls rather than hundreds. */
export function buildChunk(layout, cx, cz, biome, wear) {
  const rand = rnd(layout.seed + cx * 7919 + cz * 104729);
  const raw = new THREE.Group();
  raw.name = 'chunk-' + cx + '-' + cz;
  let cellCount = 0;

  const x0 = cx * CHUNK, z0 = cz * CHUNK;
  for (let i = 0; i < CHUNK; i++) {
    for (let j = 0; j < CHUNK; j++) {
      const gx = x0 + i, gz = z0 + j;
      const c = cellAt(layout, gx, gz);
      if (!c) continue;
      cellCount++;
      const wx = worldX(layout, gx), wz = worldZ(layout, gz);

      // Floor: a slab per cell, jittered, so the ground reads as laid.
      const f = box(CELL, 0.24, CELL, 2, 1, 2);
      jitter(f, 0.05, rand);
      raw.add(part(f, c.t === 'room' ? STEAM.firebrick : MAT.wetSlate, 'floor-' + gx + '-' + gz, { pos: [wx, -0.12, wz] }));

      // Walls only where there is no neighbour — the single biggest saving in
      // any dungeon build, and the reason interiors are cheap.
      const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      sides.forEach(([dx, dz], si) => {
        if (cellAt(layout, gx + dx, gz + dz)) return;
        const w = box(dx ? 0.4 : CELL, WALL_H, dz ? 0.4 : CELL, 1, 3, 2);
        jitter(w, 0.06, rand);
        raw.add(part(w, MAT.wetSlate, 'wall-' + gx + '-' + gz + '-' + si, {
          pos: [wx + dx * CELL * 0.5, WALL_H / 2 - 0.1, wz + dz * CELL * 0.5],
        }));
        // A pilaster every few panels so the wall has rhythm.
        if ((gx + gz) % 3 === 0) {
          raw.add(part(box(0.55, WALL_H, 0.55), STEAM.firebrick, 'pilaster-' + gx + '-' + gz + '-' + si, {
            pos: [wx + dx * CELL * 0.42, WALL_H / 2 - 0.1, wz + dz * CELL * 0.42],
          }));
        }
      });
    }
  }
  if (!cellCount) return null;

  // Dress rooms whose centre lands in this chunk, by role.
  layout.rooms.forEach((r) => {
    if (Math.floor(r.cx / CHUNK) !== cx || Math.floor(r.cz / CHUNK) !== cz) return;
    const wx = worldX(layout, r.cx - 0.5), wz = worldZ(layout, r.cz - 0.5);
    const v = (n) => Math.floor(rand() * n);
    const place = (o, ox, oz, ry) => {
      o.position.set(wx + ox, 0, wz + oz);
      o.rotation.y = ry;
      raw.add(o);
    };
    // Lamps in every room — a dungeon you cannot read is not a level.
    for (let i = 0; i < 2 + v(2); i++) {
      place(aetherLamp(v(1152)), (rand() - 0.5) * r.w * CELL * 0.7, (rand() - 0.5) * r.h * CELL * 0.7, rand() * 6.28);
    }
    if (r.role === 'machine') {
      place(governorFlyball(v(243)), 0, 0, rand() * 6.28);
      place(pressureGauge(v(432)), r.w * CELL * 0.3, -r.h * CELL * 0.32, Math.PI);
      place(valveWheel(v(216)), -r.w * CELL * 0.3, r.h * CELL * 0.3, rand() * 6.28);
      place(pipeRun(v(1152)), 0, -r.h * CELL * 0.36, 0);
    } else if (r.role === 'cistern') {
      place(pipeRun(v(1152)), 0, r.h * CELL * 0.3, 0);
      place(pipeRun(v(1152)), 0, -r.h * CELL * 0.3, 0);
      place(valveWheel(v(216)), r.w * CELL * 0.28, 0, 1.57);
      // Standing water in the low half.
      raw.add(part(box(r.w * CELL * 0.8, 0.06, r.h * CELL * 0.5), MAT.blackwater, 'cistern-water-' + r.id, { pos: [wx, 0.06, wz + r.h * CELL * 0.18] }));
    } else if (r.role === 'shaft') {
      place(chainLiftBlock(v(432)), 0, 0, rand() * 6.28);
      place(ventStack(v(288)), r.w * CELL * 0.3, r.h * CELL * 0.3, 0);
    } else if (r.role === 'arena') {
      // Turn-based combat furniture: cover, hazard, elevation. These exist
      // only for an encounter and are the reason arena rooms are flagged.
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * 6.28 + 0.4;
        raw.add(part(jitter(box(1.5, 1.1, 0.6, 2, 1, 1), 0.05, rand), MAT.slateDry, 'cover-' + r.id + '-' + i, {
          pos: [wx + Math.cos(a) * r.w * CELL * 0.28, 0.55, wz + Math.sin(a) * r.h * CELL * 0.28], rot: [0, -a, 0],
        }));
      }
      raw.add(part(box(r.w * CELL * 0.34, 0.4, r.h * CELL * 0.34, 2, 1, 2), STEAM.firebrick, 'elevation-' + r.id, { pos: [wx, 0.2, wz] }));
      raw.add(part(limb(0.9, 1.0, 0.12, 14, 1), STEAM.hotSlag, 'hazard-vent-' + r.id, { pos: [wx + r.w * CELL * 0.3, 0.06, wz - r.h * CELL * 0.28] }));
      place(ventStack(v(288)), -r.w * CELL * 0.34, -r.h * CELL * 0.3, 0);
    } else {
      place(pipeRun(v(1152)), 0, -r.h * CELL * 0.34, 0);
      if (rand() > 0.5) place(pressureGauge(v(432)), r.w * CELL * 0.3, 0, -1.57);
    }
  });

  // One finish for the whole chunk, then merge. Finish before merge, because
  // the overlay needs the real bounding boxes.
  applyFinish(raw, biome, wear, cx * 31 + cz);

  const merged = new THREE.Group();
  merged.name = raw.name;
  let tris = 0;
  mergeByMaterial(raw).forEach((p, i) => {
    const m = new THREE.Mesh(p.geometry, p.material);
    m.name = raw.name + '-' + (p.material.name || i);
    m.castShadow = true;
    m.receiveShadow = true;
    merged.add(m);
    tris += geoTris(p.geometry);
  });
  merged.userData = { tris, cells: cellCount, draws: merged.children.length };
  return merged;
}

/* --------------------------------------------------------------- streaming */

/** Keeps only the chunks within `radius` of a world position resident.
 *  Everything else is disposed — geometry included, because a streamed
 *  dungeon that never frees its buffers is just a slow memory leak. */
export class ChunkStreamer {
  constructor(layout, scene, biome, wear, radius = 2) {
    this.layout = layout;
    this.scene = scene;
    this.biome = biome;
    this.wear = wear;
    this.radius = radius;
    this.resident = new Map();
    this.stats = { built: 0, disposed: 0, tris: 0, draws: 0, cells: 0 };
  }

  chunkOf(x, z) {
    return [
      Math.floor((x / CELL + this.layout.gw / 2) / CHUNK),
      Math.floor((z / CELL + this.layout.gh / 2) / CHUNK),
    ];
  }

  update(pos) {
    const [pcx, pcz] = this.chunkOf(pos.x, pos.z);
    const want = new Set();
    for (let dx = -this.radius; dx <= this.radius; dx++) {
      for (let dz = -this.radius; dz <= this.radius; dz++) {
        const cx = pcx + dx, cz = pcz + dz;
        if (cx < 0 || cz < 0 || cx >= this.layout.chunksX || cz >= this.layout.chunksZ) continue;
        // Round the radius so the loaded set is a disc, not a square.
        if (dx * dx + dz * dz > this.radius * this.radius + this.radius) continue;
        want.add(cx + ',' + cz);
      }
    }
    // Evict first, so peak memory is bounded during a move.
    for (const [k, node] of this.resident) {
      if (want.has(k)) continue;
      this.scene.remove(node);
      node.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
      this.resident.delete(k);
      this.stats.disposed++;
    }
    for (const k of want) {
      if (this.resident.has(k)) continue;
      const [cx, cz] = k.split(',').map(Number);
      const node = buildChunk(this.layout, cx, cz, this.biome, this.wear);
      if (!node) { this.resident.set(k, new THREE.Group()); continue; }
      this.scene.add(node);
      this.resident.set(k, node);
      this.stats.built++;
    }
    let tris = 0, draws = 0, cells = 0;
    for (const node of this.resident.values()) {
      tris += node.userData.tris || 0;
      draws += node.userData.draws || 0;
      cells += node.userData.cells || 0;
    }
    this.stats.tris = tris;
    this.stats.draws = draws;
    this.stats.cells = cells;
    return this.stats;
  }

  clear() {
    for (const [, node] of this.resident) {
      this.scene.remove(node);
      node.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
    }
    this.resident.clear();
  }
}
