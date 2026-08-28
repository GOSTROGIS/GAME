/* Hearthmere structures — the seven structure rows in
 * packages/content/manifests/hearthmere.assets.json, built as whole
 * buildings rather than modular kit pieces.
 *
 * Footprint, height, roof type and openings below are the manifest's own
 * `runtime.parameters`, unchanged:
 *
 *   hold-house-small     [9,7]    h 7.5  steep-slate      door-south, window-east
 *   hold-house-corner    [11,8]   h 8    broken-hip       door-west, arcade-south
 *   bell-tower-timber    [8,8]    h 19   needle           arch-four-sides
 *   palisade-repaired    [16,1.2] h 5.5  none             —
 *   spring-channel-arch  [10,6]   h 6    stone-vault      water-channel, walkway
 *   vigil-shrine-old     [7,7]    h 8    ruined-canopy    altar-east
 *   gatehouse-patchwork  [14,6]   h 10   asymmetric-slate gate-center, guard-door
 *
 * Triangles are budgeted against WORLD_ASSET_BUDGETS.propTriangles in
 * src/data/worldAssets.js — hero 48,000 and standard 12,000 — because the
 * structure rows' own lodTriangles were authored for a graybox. That is a
 * deliberate reading of "build to the ceiling", and it is the one place this
 * pass uses the global budget instead of a per-row number.
 */
import {
  THREE, MAT, rnd, jitter, lean, bow, part, lathe, limb, torus, cone, cyl, ico,
  cnt, seat, thin,
} from './hm-core.js';

const T = Math.PI * 2;
const box = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);

/* ---------------------------------------------------------------- helpers */

/** Coursed rubble wall in the XY plane, thickness t along Z. Every block is
 *  an individually jittered box, which is the entire reason the wall reads as
 *  laid stone instead of a textured slab. `holes` are [x, y, w, h] rects the
 *  courses skip — doors, windows, arrow loops. */
function rubbleWall(w, h, t, blockW, mat, rand, name, holes = []) {
  const g = new THREE.Group();
  g.name = name;
  const courseH = blockW * 0.62;
  const rows = Math.max(2, Math.round(h / courseH));
  const ch = h / rows;
  let n = 0;
  for (let r = 0; r < rows; r++) {
    const y = -h / 2 + ch * (r + 0.5);
    // Every other course offsets by half a block, and each course picks its
    // own block width — a rubble wall has no repeating unit.
    const bw = blockW * (0.82 + rand() * 0.4);
    const cols = Math.max(2, Math.round(w / bw));
    const cw = w / cols;
    for (let c = 0; c < cols; c++) {
      const x = -w / 2 + cw * (c + 0.5) + (r % 2 ? cw * 0.22 : -cw * 0.14);
      if (Math.abs(x) > w / 2 - cw * 0.2) continue;
      const hit = holes.some(
        ([hx, hy, hw, hh]) =>
          Math.abs(x - hx) < hw / 2 + cw * 0.34 && Math.abs(y - hy) < hh / 2 + ch * 0.34
      );
      if (hit) continue;
      const b = box(cw * 0.94, ch * 0.9, t * (0.88 + rand() * 0.22));
      jitter(b, Math.min(cw, ch) * 0.14, rand);
      g.add(part(b, mat, name + '-block-' + n++, {
        pos: [x, y, (rand() - 0.5) * t * 0.08],
        rot: [0, (rand() - 0.5) * 0.1, (rand() - 0.5) * 0.05],
      }));
    }
  }
  return g;
}

/** A field of slate tiles covering w × d, laid in overlapping courses running
 *  up the d axis. Built flat on XZ so the caller pitches it. */
function slateField(w, d, tileW, mat, rand, name) {
  const g = new THREE.Group();
  g.name = name;
  const courses = Math.max(3, Math.round(d / (tileW * 0.72)));
  const cd = d / courses;
  let n = 0;
  for (let r = 0; r < courses; r++) {
    const z = -d / 2 + cd * (r + 0.5);
    const cols = Math.max(2, Math.round(w / tileW));
    const cw = w / cols;
    for (let c = 0; c < cols; c++) {
      const x = -w / 2 + cw * (c + 0.5) + (r % 2 ? cw * 0.5 : 0);
      if (x > w / 2 - cw * 0.2) continue;
      // Overlap by 40% up-slope, and let a few tiles sit proud or slip.
      const slip = rand() > 0.9 ? (rand() - 0.5) * 0.1 : 0;
      const tl = box(cw * 0.96, 0.035, cd * 1.42);
      g.add(part(tl, mat, name + '-slate-' + n++, {
        pos: [x, (rand() - 0.5) * 0.014 + Math.abs(slip) * 0.4, z + slip],
        rot: [(rand() - 0.5) * 0.05, (rand() - 0.5) * 0.06, (rand() - 0.5) * 0.04],
      }));
    }
  }
  return g;
}

/** Voussoir arch — n wedge stones around a half-circle. The single most
 *  valuable stone detail in the kit: it reads as built, not cut out. */
function voussoirArch(r, n, depth, thick, mat, rand, name) {
  const g = new THREE.Group();
  g.name = name;
  const count = cnt(n);
  for (let i = 0; i < count; i++) {
    const a = Math.PI * (i + 0.5) / count;
    const w = (Math.PI * r) / count * 1.06;
    const v = box(w, thick, depth);
    jitter(v, thick * 0.09, rand);
    g.add(part(v, mat, name + '-voussoir-' + i, {
      pos: [Math.cos(a) * (r + thick / 2), Math.sin(a) * (r + thick / 2), 0],
      rot: [0, 0, a - Math.PI / 2],
    }));
  }
  // Keystone, proud of the ring.
  const ks = box((Math.PI * r) / count * 1.3, thick * 1.35, depth * 1.06);
  jitter(ks, thick * 0.06, rand);
  g.add(part(ks, mat, name + '-keystone', { pos: [0, r + thick * 0.68, 0] }));
  return g;
}

/** Shingled cone for a spire — courses of tapering plates up an n-sided cone. */
function shingleCone(rBase, h, sides, courses, mat, rand, name) {
  const g = new THREE.Group();
  g.name = name;
  const C = cnt(courses);
  let n = 0;
  for (let c = 0; c < C; c++) {
    const t0 = c / C, t1 = (c + 1) / C;
    const r0 = rBase * (1 - t0), r1 = rBase * (1 - t1);
    const y = h * t0;
    const seg = Math.max(4, Math.round(sides * (1 - t0 * 0.45)));
    for (let s = 0; s < seg; s++) {
      const a = (s / seg) * T + (c % 2 ? Math.PI / seg : 0);
      const w = ((r0 + r1) / 2) * (T / seg) * 1.12;
      const sh = box(w, (h / C) * 1.3, 0.05);
      g.add(part(sh, mat, name + '-shingle-' + n++, {
        pos: [Math.cos(a) * (r0 + r1) / 2, y + h / C / 2, Math.sin(a) * (r0 + r1) / 2],
        rot: [Math.atan2(rBase / C, h / C) - 0.1, -a + Math.PI / 2, 0],
      }));
    }
  }
  return g;
}

/** Louvre stack — angled slats in an opening. Cheap boxes, strong read, and
 *  the only honest way to let a bell be heard and not rained on. */
function louvres(w, h, n, mat, name) {
  const g = new THREE.Group();
  g.name = name;
  const N = cnt(n);
  for (let i = 0; i < N; i++) {
    g.add(part(box(w, h / N * 0.72, 0.11), mat, name + '-slat-' + i, {
      pos: [0, -h / 2 + (h / N) * (i + 0.5), 0],
      rot: [-0.5, 0, 0],
    }));
  }
  return g;
}

/** Planked door with iron strap hinges and studs. */
function plankDoor(w, h, mat, ironMat, rand, name) {
  const g = new THREE.Group();
  g.name = name;
  const planks = Math.max(3, Math.round(w / 0.24));
  for (let i = 0; i < planks; i++) {
    const p = box((w / planks) * 0.94, h, 0.07, 1, 3, 1);
    bow(p, 0.008, 'z');
    jitter(p, 0.006, rand);
    g.add(part(p, mat, name + '-plank-' + i, { pos: [-w / 2 + (w / planks) * (i + 0.5), 0, 0] }));
  }
  // Two strap hinges and a ledge brace.
  [-h * 0.3, h * 0.3].forEach((y, i) => {
    g.add(part(box(w * 0.82, 0.09, 0.025), ironMat, name + '-strap-' + i, { pos: [-w * 0.04, y, 0.048] }));
    for (let s = 0; s < 4; s++) {
      g.add(part(ico(0.022, 0), ironMat, name + '-stud-' + i + '-' + s, {
        pos: [-w * 0.36 + s * (w * 0.22), y, 0.062],
      }));
    }
  });
  g.add(part(box(w * 0.9, 0.075, 0.02), ironMat, name + '-brace', { pos: [0, 0, 0.046], rot: [0, 0, 0.42] }));
  g.add(part(torus(0.055, 0.014, 5, 10), ironMat, name + '-ring-pull', { pos: [w * 0.34, -0.05, 0.07], rot: [0.4, 0, 0] }));
  return g;
}

/* --------------------------------------------- 01 · Small hold house
 * [9, 7] footprint, 7.5 m, steep-slate roof, door-south + window-east.
 * Standard class — 12,000 triangles.                                      */
export function holdHouseSmall() {
  const rand = rnd(0x40d5e1);
  const g = new THREE.Group();
  g.name = 'hold-house-small';
  const W = 9, D = 7, H = 7.5;
  const STONE = 2.5, EAVE = 4.6;

  // Ground floor in coursed rubble, with the two declared openings.
  const faces = [
    ['south', W, 0, D / 2, 0, [[0, -STONE / 2 + 1.1, 1.35, 2.2]]],
    ['north', W, 0, -D / 2, 0, []],
    ['east', D, W / 2, 0, Math.PI / 2, [[0.6, 0.35, 1.15, 1.15]]],
    ['west', D, -W / 2, 0, Math.PI / 2, []],
  ];
  faces.forEach(([n, w, x, z, ry, holes]) => {
    const wall = rubbleWall(w, STONE, 0.55, 0.72, MAT.wetSlate, rand, 'stone-' + n, holes);
    wall.position.set(x, STONE / 2, z);
    wall.rotation.y = ry;
    g.add(wall);
  });
  // Plinth course, proud of the wall, and a stone sill band.
  g.add(part(jitter(box(W + 0.4, 0.34, D + 0.4, 8, 1, 6), 0.05, rand), MAT.slateDry, 'plinth', { pos: [0, 0.17, 0] }));
  g.add(part(jitter(box(W + 0.16, 0.16, D + 0.16, 8, 1, 6), 0.03, rand), MAT.slateDry, 'sill-band', { pos: [0, STONE, 0] }));

  // Timber frame above: posts, top plate, and braces on the long faces.
  const postX = [-W / 2 + 0.3, -W / 6, W / 6, W / 2 - 0.3];
  postX.forEach((x, i) => {
    [-1, 1].forEach((s, j) => {
      g.add(part(jitter(box(0.3, EAVE - STONE, 0.3, 1, 2, 1), 0.02, rand), MAT.darkOak, 'post-' + i + '-' + j, {
        pos: [x, (STONE + EAVE) / 2, s * (D / 2 - 0.18)],
      }));
    });
  });
  [-1, 1].forEach((s, j) => {
    g.add(part(jitter(box(W, 0.34, 0.34, 8, 1, 1), 0.02, rand), MAT.darkOak, 'top-plate-' + j, { pos: [0, EAVE, s * (D / 2 - 0.18)] }));
    // Infill panels between the posts — daub over wattle, one slot.
    for (let i = 0; i < 3; i++) {
      g.add(part(jitter(box(W / 3.4, EAVE - STONE - 0.4, 0.16, 3, 2, 1), 0.03, rand), MAT.clayPale, 'infill-' + i + '-' + j, {
        pos: [-W / 3 + i * (W / 3), (STONE + EAVE) / 2, s * (D / 2 - 0.18)],
      }));
    }
    // Braces, angled opposite on each face.
    for (let i = 0; i < 4; i++) {
      g.add(part(box(0.2, 1.5, 0.2), MAT.darkOak, 'brace-' + i + '-' + j, {
        pos: [-W / 2 + 0.9 + i * (W / 4), STONE + 0.75, s * (D / 2 - 0.14)],
        rot: [0, 0, (i % 2 ? 1 : -1) * 0.62],
      }));
    }
  });
  [-1, 1].forEach((s, j) => {
    g.add(part(jitter(box(0.32, 0.32, D, 1, 1, 6), 0.02, rand), MAT.darkOak, 'end-plate-' + j, { pos: [s * (W / 2 - 0.16), EAVE, 0] }));
  });

  // Gable walls up to the ridge, in stone so the roof has something to sit on.
  [-1, 1].forEach((s, j) => {
    for (let r = 0; r < 5; r++) {
      const t = r / 5;
      g.add(part(jitter(box(D * (1 - t) * 0.94, (H - EAVE) / 5 * 0.92, 0.42, 4, 1, 1), 0.05, rand), MAT.wetSlate, 'gable-' + j + '-' + r, {
        pos: [s * (W / 2 - 0.22), EAVE + ((H - EAVE) / 5) * (r + 0.5), 0],
        rot: [0, Math.PI / 2, 0],
      }));
    }
  });

  // Steep slate roof — the region's signature and the biggest spend here.
  const rise = H - EAVE, run = D / 2;
  const pitch = Math.atan2(rise, run);
  const slope = Math.hypot(rise, run);
  [-1, 1].forEach((s, j) => {
    const field = slateField(W + 0.5, slope, 0.44, MAT.wetSlate, rand, 'roof-' + (j ? 'south' : 'north'));
    field.position.set(0, (EAVE + H) / 2 - 0.1, (s * run) / 2);
    field.rotation.x = -s * (Math.PI / 2 - pitch) + s * Math.PI / 2 - s * pitch;
    field.rotation.set(s * (pitch - Math.PI / 2) + s * Math.PI / 2, 0, 0);
    field.rotation.x = -s * pitch;
    g.add(field);
    // Eaves board.
    g.add(part(jitter(box(W + 0.6, 0.2, 0.09, 8, 1, 1), 0.015, rand), MAT.darkOak, 'eaves-' + j, { pos: [0, EAVE - 0.12, s * (run + 0.24)] }));
  });
  // Ridge capping.
  for (let i = 0; i < cnt(16); i++) {
    g.add(part(jitter(box((W + 0.4) / 16, 0.16, 0.5), 0.02, rand), MAT.slateDry, 'ridge-cap-' + i, {
      pos: [-(W + 0.4) / 2 + ((W + 0.4) / 16) * (i + 0.5), H + 0.06, (rand() - 0.5) * 0.04],
      rot: [(rand() - 0.5) * 0.06, 0, 0],
    }));
  }

  // Door (south) in its stone reveal, and the east window with a shutter.
  const door = plankDoor(1.3, 2.15, MAT.darkOak, MAT.pittedIron, rand, 'door-south');
  door.position.set(0, 1.1, D / 2 + 0.02);
  g.add(door);
  g.add(part(jitter(box(1.75, 0.28, 0.66, 3, 1, 1), 0.03, rand), MAT.slateDry, 'door-lintel', { pos: [0, 2.34, D / 2 - 0.02] }));
  g.add(part(jitter(box(1.9, 0.12, 1.0, 3, 1, 2), 0.02, rand), MAT.slateDry, 'door-step', { pos: [0, 0.06, D / 2 + 0.4] }));
  g.add(part(box(1.12, 1.12, 0.06), MAT.darkOak, 'window-shutter', { pos: [W / 2 + 0.24, 0.85, 0.6], rot: [0, 0.5, 0] }));
  g.add(part(box(0.07, 1.12, 0.07), MAT.darkOak, 'window-mullion', { pos: [W / 2 + 0.02, 0.85, 0.6] }));
  g.add(part(jitter(box(0.6, 0.14, 1.4, 1, 1, 2), 0.02, rand), MAT.slateDry, 'window-sill', { pos: [W / 2 - 0.02, 0.22, 0.6] }));

  // Flue: Hearthmere burns names, so every house has a stack.
  const flue = rubbleWall(1.1, 2.6, 1.1, 0.4, MAT.slateDry, rand, 'flue');
  flue.position.set(-W / 2 + 1.3, H - 0.9, 0);
  g.add(flue);
  g.add(part(jitter(box(1.5, 0.2, 1.5, 2, 1, 2), 0.03, rand), MAT.slateDry, 'flue-cap', { pos: [-W / 2 + 1.3, H + 0.5, 0] }));

  // Rain chain instead of a downpipe — cheaper than lead, and it is raining.
  for (let i = 0; i < cnt(9); i++) {
    g.add(part(torus(0.05, 0.012, 4, 8), MAT.pittedIron, 'rain-chain-' + i, {
      pos: [W / 2 - 0.5, EAVE - 0.3 - i * 0.42, D / 2 + 0.1],
      rot: [Math.PI / 2, (i % 2) * (Math.PI / 2), 0],
    }));
  }
  return seat(g);
}

/* ------------------------------------------ 02 · Corner hold house
 * [11, 8] footprint, 8 m, broken-hip roof, door-west + arcade-south.
 * Standard class — 12,000 triangles.                                      */
export function holdHouseCorner() {
  const rand = rnd(0xc02e11);
  const g = new THREE.Group();
  g.name = 'hold-house-corner';
  const W = 11, D = 8, H = 8;
  const STONE = 3.1, EAVE = 5.4;

  // Three sides walled; the south face is an arcade.
  [['north', W, 0, -D / 2, 0, []],
   ['east', D, W / 2, 0, Math.PI / 2, []],
   ['west', D, -W / 2, 0, Math.PI / 2, [[0, -STONE / 2 + 1.15, 1.4, 2.3]]],
  ].forEach(([n, w, x, z, ry, holes]) => {
    const wall = rubbleWall(w, STONE, 0.6, 0.78, MAT.wetSlate, rand, 'stone-' + n, holes);
    wall.position.set(x, STONE / 2, z);
    wall.rotation.y = ry;
    g.add(wall);
  });
  g.add(part(jitter(box(W + 0.5, 0.38, D + 0.5, 9, 1, 7), 0.05, rand), MAT.slateDry, 'plinth', { pos: [0, 0.19, 0] }));

  // The arcade: four piers, three arches, a continuous impost band.
  const piers = [-W / 2 + 0.55, -W / 6, W / 6, W / 2 - 0.55];
  piers.forEach((x, i) => {
    const p = rubbleWall(1.0, STONE, 0.85, 0.42, MAT.wetSlate, rand, 'pier-' + i);
    p.position.set(x, STONE / 2, D / 2 - 0.4);
    g.add(p);
    g.add(part(jitter(box(1.25, 0.2, 1.05, 2, 1, 2), 0.02, rand), MAT.slateDry, 'impost-' + i, { pos: [x, STONE - 0.6, D / 2 - 0.4] }));
  });
  for (let i = 0; i < 3; i++) {
    const x0 = piers[i], x1 = piers[i + 1];
    const span = (x1 - x0) / 2 - 0.5;
    const arch = voussoirArch(span, 11, 0.85, 0.34, MAT.slateDry, rand, 'arcade-arch-' + i);
    arch.position.set((x0 + x1) / 2, STONE - 0.5, D / 2 - 0.4);
    g.add(arch);
  }
  // Spandrel wall above the arcade, carrying the frame.
  const spandrel = rubbleWall(W, EAVE - STONE - 0.6, 0.6, 0.7, MAT.wetSlate, rand, 'spandrel');
  spandrel.position.set(0, (STONE + 0.6 + EAVE) / 2, D / 2 - 0.4);
  g.add(spandrel);

  // Timber frame on the north and ends.
  for (let i = 0; i < 5; i++) {
    g.add(part(jitter(box(0.32, EAVE - STONE, 0.32, 1, 2, 1), 0.02, rand), MAT.darkOak, 'post-n-' + i, {
      pos: [-W / 2 + 0.4 + i * ((W - 0.8) / 4), (STONE + EAVE) / 2, -(D / 2 - 0.2)],
    }));
    if (i < 4) {
      g.add(part(jitter(box((W - 0.8) / 4.3, EAVE - STONE - 0.4, 0.17, 3, 2, 1), 0.03, rand), MAT.clayPale, 'infill-n-' + i, {
        pos: [-W / 2 + 0.4 + (i + 0.5) * ((W - 0.8) / 4), (STONE + EAVE) / 2, -(D / 2 - 0.2)],
      }));
      g.add(part(box(0.2, 1.7, 0.2), MAT.darkOak, 'brace-n-' + i, {
        pos: [-W / 2 + 0.4 + (i + 0.5) * ((W - 0.8) / 4), STONE + 0.85, -(D / 2 - 0.16)],
        rot: [0, 0, (i % 2 ? 1 : -1) * 0.6],
      }));
    }
  }
  g.add(part(jitter(box(W, 0.36, 0.36, 9, 1, 1), 0.02, rand), MAT.darkOak, 'top-plate-n', { pos: [0, EAVE, -(D / 2 - 0.2)] }));
  g.add(part(jitter(box(W, 0.36, 0.36, 9, 1, 1), 0.02, rand), MAT.darkOak, 'top-plate-s', { pos: [0, EAVE, D / 2 - 0.4] }));

  // Broken hip roof: three sound planes, and the fourth collapsed to rafters.
  const rise = H - EAVE, run = D / 2, pitch = Math.atan2(rise, run);
  const slope = Math.hypot(rise, run);
  const north = slateField(W * 0.92, slope, 0.46, MAT.wetSlate, rand, 'roof-north');
  north.position.set(0, (EAVE + H) / 2 - 0.1, -run / 2);
  north.rotation.x = pitch;
  g.add(north);
  // South plane survives only over the east half — the west half is open.
  const south = slateField(W * 0.44, slope, 0.46, MAT.wetSlate, rand, 'roof-south-remnant');
  south.position.set(W * 0.26, (EAVE + H) / 2 - 0.1, run / 2);
  south.rotation.x = -pitch;
  g.add(south);
  // Hip end, east.
  const hip = slateField(D * 0.8, Math.hypot(rise, W / 2 - W * 0.3), 0.44, MAT.wetSlate, rand, 'roof-hip-east');
  hip.position.set(W / 2 - 0.7, (EAVE + H) / 2 - 0.1, 0);
  hip.rotation.set(0, Math.PI / 2, pitch * 0.9);
  g.add(hip);

  // Exposed rafters where the slate is gone — the detail that says "broken".
  for (let i = 0; i < cnt(8); i++) {
    const x = -W / 2 + 0.6 + i * 0.62;
    g.add(part(jitter(box(0.14, slope * 0.98, 0.2, 1, 3, 1), 0.02, rand), MAT.darkOak, 'rafter-' + i, {
      pos: [x, (EAVE + H) / 2 - 0.15, run / 2],
      rot: [Math.PI / 2 - pitch + 0.02, 0, 0],
    }));
  }
  g.add(part(jitter(box(W * 0.5, 0.26, 0.26, 5, 1, 1), 0.02, rand), MAT.darkOak, 'ridge-beam-exposed', { pos: [-W * 0.24, H - 0.1, 0] }));
  // Slates that came down, lying on the arcade floor.
  for (let i = 0; i < cnt(11); i++) {
    g.add(part(jitter(box(0.42, 0.035, 0.55), 0.02, rand), MAT.wetSlate, 'fallen-slate-' + i, {
      pos: [-W / 2 + 0.8 + rand() * (W * 0.45), 0.42 + rand() * 0.06, D / 2 - 0.2 + (rand() - 0.5) * 1.4],
      rot: [(rand() - 0.5) * 0.5, rand() * T, (rand() - 0.5) * 0.5],
    }));
  }
  for (let i = 0; i < cnt(14); i++) {
    g.add(part(jitter(box(0.16, 0.16, 0.5), 0.03, rand), MAT.slateDry, 'ridge-cap-' + i, {
      pos: [W / 2 - 0.6 - i * 0.4, H + 0.06, 0], rot: [0, 0, (rand() - 0.5) * 0.05],
    }));
  }

  const door = plankDoor(1.35, 2.25, MAT.darkOak, MAT.pittedIron, rand, 'door-west');
  door.position.set(-W / 2 - 0.02, 1.15, 0);
  door.rotation.y = Math.PI / 2;
  g.add(door);
  g.add(part(jitter(box(0.7, 0.3, 1.8, 1, 1, 3), 0.03, rand), MAT.slateDry, 'door-lintel', { pos: [-W / 2 + 0.02, 2.44, 0] }));
  return seat(g);
}

/* --------------------------------------------- 03 · Timber bell tower
 * [8, 8] footprint, 19 m, needle roof, arch-four-sides. Hero class —
 * 48,000 triangles. The tallest thing in the region and the object the
 * whole settlement ritual runs on, so it gets the budget.                 */
export function bellTowerTimber() {
  const rand = rnd(0xbe11f0);
  const g = new THREE.Group();
  g.name = 'bell-tower-timber';
  const W = 7.6, H = 19;
  const BASE = 5.2, CHAMBER = 12.4, CHAMBER_TOP = 15.4;

  // Stone base, arched on all four sides as the manifest declares.
  const dirs = [[0, 1, 0], [0, -1, Math.PI], [1, 0, Math.PI / 2], [-1, 0, -Math.PI / 2]];
  dirs.forEach(([dx, dz, ry], i) => {
    const wall = rubbleWall(W, BASE, 0.75, 0.8, MAT.wetSlate, rand, 'base-wall-' + i, [[0, -BASE / 2 + 1.6, 2.5, 3.2]]);
    wall.position.set(dx * (W / 2 - 0.2), BASE / 2, dz * (W / 2 - 0.2));
    wall.rotation.y = ry;
    g.add(wall);
    const arch = voussoirArch(1.25, 13, 0.8, 0.4, MAT.slateDry, rand, 'base-arch-' + i);
    arch.position.set(dx * (W / 2 - 0.2), 2.0, dz * (W / 2 - 0.2));
    arch.rotation.y = ry;
    g.add(arch);
  });
  g.add(part(jitter(box(W + 0.9, 0.5, W + 0.9, 8, 1, 8), 0.06, rand), MAT.slateDry, 'base-plinth', { pos: [0, 0.25, 0] }));
  g.add(part(jitter(box(W + 0.4, 0.3, W + 0.4, 8, 1, 8), 0.04, rand), MAT.slateDry, 'base-cornice', { pos: [0, BASE, 0] }));

  // Four corner posts running the full timber height, with five girt levels
  // and cross-braces on every face at every level. This lattice IS the asset.
  const CP = W / 2 - 0.7;
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  corners.forEach(([sx, sz], i) => {
    const post = jitter(box(0.52, CHAMBER_TOP - BASE, 0.52, 1, 6, 1), 0.03, rand);
    lean(post, -sx * 0.28, -sz * 0.28, 1.05); // battered inward as it rises
    g.add(part(post, MAT.darkOak, 'corner-post-' + i, { pos: [sx * CP, (BASE + CHAMBER_TOP) / 2, sz * CP] }));
  });
  const levels = [BASE + 1.5, BASE + 3.4, BASE + 5.3, CHAMBER, CHAMBER + 1.6, CHAMBER_TOP];
  levels.forEach((y, li) => {
    const t = (y - BASE) / (CHAMBER_TOP - BASE);
    const half = CP * (1 - 0.28 * t * 1.05);
    dirs.forEach(([dx, dz, ry], fi) => {
      g.add(part(jitter(box(half * 2 + 0.5, 0.34, 0.34, 6, 1, 1), 0.02, rand), MAT.darkOak, 'girt-' + li + '-' + fi, {
        pos: [dx * half, y, dz * half], rot: [0, ry, 0],
      }));
      if (li < levels.length - 1) {
        const rise = levels[li + 1] - y;
        const len = Math.hypot(half * 1.7, rise);
        [-1, 1].forEach((s, bi) => {
          g.add(part(box(0.22, len, 0.22), MAT.darkOak, 'brace-' + li + '-' + fi + '-' + bi, {
            pos: [dx * (half + 0.05), y + rise / 2, dz * (half + 0.05)],
            rot: [0, ry, s * Math.atan2(half * 1.7, rise)],
          }));
        });
      }
    });
  });

  // Bell chamber: louvred on all four faces so the bell is heard, not soaked.
  dirs.forEach(([dx, dz, ry], i) => {
    const t = (CHAMBER + 1.6 - BASE) / (CHAMBER_TOP - BASE);
    const half = CP * (1 - 0.28 * t * 1.05);
    const lv = louvres(half * 1.85, 3.0, 9, MAT.darkOak, 'louvre-' + i);
    lv.position.set(dx * (half + 0.06), CHAMBER + 1.5, dz * (half + 0.06));
    lv.rotation.y = ry;
    g.add(lv);
  });

  // The great bell, hung on its headstock in the chamber.
  const bell = lathe([
    [0.92, 0], [0.935, 0.08], [0.9, 0.16], [0.82, 0.36], [0.75, 0.6],
    [0.69, 0.9], [0.6, 1.14], [0.48, 1.35], [0.33, 1.5],
    [0.22, 1.6], [0.24, 1.68], [0.16, 1.75], [0.09, 1.8], [0, 1.82],
  ], 24);
  g.add(part(bell, MAT.bellBronze, 'great-bell', { pos: [0, CHAMBER + 0.5, 0] }));
  g.add(part(torus(0.76, 0.04, 5, 24), MAT.bellBronze, 'bell-rib', { pos: [0, CHAMBER + 1.1, 0], rot: [Math.PI / 2, 0, 0] }));
  g.add(part(jitter(box(2.4, 0.42, 0.5, 4, 1, 1), 0.02, rand), MAT.darkOak, 'headstock', { pos: [0, CHAMBER + 2.5, 0] }));
  [-1, 1].forEach((s, i) => {
    g.add(part(limb(0.09, 0.09, 0.4, 10, 1), MAT.pittedIron, 'gudgeon-' + i, { pos: [s * 1.3, CHAMBER + 2.5, 0], rot: [0, 0, Math.PI / 2] }));
  });
  g.add(part(limb(0.05, 0.07, 1.3, 8, 1), MAT.bellBronze, 'clapper-shank', { pos: [0.1, CHAMBER + 1.5, 0] }));
  g.add(part(ico(0.19, 1), MAT.bellBronze, 'clapper-ball', { pos: [0.14, CHAMBER + 0.85, 0] }));
  // The rope, down the middle of the tower to the ringing floor.
  g.add(part(limb(0.035, 0.035, 8.4, 6, 1), MAT.ropeHemp, 'bell-rope', { pos: [0.5, CHAMBER - 4.0, 0] }));
  g.add(part(ico(0.1, 0), MAT.ropeHemp, 'rope-sally', { pos: [0.5, BASE + 1.4, 0] }));

  // Ringing floor and the ladder up to it.
  g.add(part(jitter(box(W - 1.6, 0.2, W - 1.6, 6, 1, 6), 0.02, rand), MAT.darkOak, 'ringing-floor', { pos: [0, CHAMBER - 0.1, 0] }));
  [-1, 1].forEach((s, i) => {
    g.add(part(jitter(box(0.16, CHAMBER - BASE, 0.16, 1, 4, 1), 0.02, rand), MAT.darkOak, 'ladder-stile-' + i, {
      pos: [-CP + 0.5 + s * 0.42, (BASE + CHAMBER) / 2, -CP + 0.9], rot: [-0.14, 0, 0],
    }));
  });
  for (let i = 0; i < cnt(16); i++) {
    g.add(part(limb(0.045, 0.045, 0.88, 6, 1), MAT.darkOak, 'ladder-rung-' + i, {
      pos: [-CP + 0.5, BASE + 0.4 + i * 0.44, -CP + 0.9 + i * 0.06], rot: [0, 0, Math.PI / 2],
    }));
  }

  // Skirt roof where the spire meets the frame, then the needle itself.
  dirs.forEach(([dx, dz, ry], i) => {
    const sk = slateField(W * 0.78, 1.3, 0.4, MAT.wetSlate, rand, 'skirt-' + i);
    sk.position.set(dx * (CP * 0.78), CHAMBER_TOP + 0.24, dz * (CP * 0.78));
    sk.rotation.set(0, ry, 0);
    sk.rotateX(-0.62);
    g.add(sk);
  });
  const spire = shingleCone(2.35, H - CHAMBER_TOP - 0.6, 10, 13, MAT.wetSlate, rand, 'needle-spire');
  spire.position.set(0, CHAMBER_TOP + 0.5, 0);
  g.add(spire);
  // Hip rolls down the spire edges, and the finial.
  for (let i = 0; i < cnt(10); i++) {
    const a = (i / 10) * T;
    g.add(part(box(0.11, H - CHAMBER_TOP - 0.7, 0.11), MAT.slateDry, 'spire-hip-' + i, {
      pos: [Math.cos(a) * 1.15, CHAMBER_TOP + (H - CHAMBER_TOP) / 2, Math.sin(a) * 1.15],
      rot: [Math.sin(a) * 0.42, 0, -Math.cos(a) * 0.42],
    }));
  }
  g.add(part(lathe([[0.16, 0], [0.2, 0.14], [0.1, 0.3], [0.13, 0.4], [0.05, 0.56], [0, 0.6]], 12), MAT.pittedIron, 'finial', { pos: [0, H - 0.1, 0] }));
  g.add(part(limb(0.02, 0.02, 1.05, 6, 1), MAT.pittedIron, 'finial-spike', { pos: [0, H + 0.9, 0] }));
  return seat(g);
}

/* ---------------------------------------------- 04 · Repaired palisade
 * [16, 1.2] footprint, 5.5 m, no roof. Standard class — 12,000 triangles.
 * The asset is named for its repairs, so the repairs are the design.      */
export function palisadeRepaired() {
  const rand = rnd(0x9a1152);
  const g = new THREE.Group();
  g.name = 'palisade-repaired';
  const W = 16, H = 5.5;

  const N = cnt(34);
  const step = W / N;
  for (let i = 0; i < N; i++) {
    const x = -W / 2 + step * (i + 0.5);
    // A run of six near the middle is newer, thinner and lighter — the
    // section that was breached and put back in a hurry.
    const repaired = i > 13 && i < 20;
    const h = (repaired ? H * 0.84 : H) * (0.94 + rand() * 0.12);
    const r = repaired ? 0.13 : 0.17;
    const post = limb(r * 0.86, r, h, 7, 3);
    lean(post, (rand() - 0.5) * 0.16, (rand() - 0.5) * 0.1, 1.4);
    jitter(post, 0.022, rand);
    g.add(part(post, repaired ? MAT.weatheredTimber : MAT.darkOak, 'stake-' + i, {
      pos: [x, h / 2, (rand() - 0.5) * 0.1], rot: [0, rand() * T, 0],
    }));
    // Sharpened top, cut on a slant.
    g.add(part(cone(r, r * 2.6, 7, 1), repaired ? MAT.weatheredTimber : MAT.darkOak, 'stake-point-' + i, {
      pos: [x, h + r * 1.2, 0], rot: [(rand() - 0.5) * 0.16, rand() * T, (rand() - 0.5) * 0.16],
    }));
  }

  // Three horizontal rails on the inner face, lashed not nailed.
  [1.2, 2.9, 4.3].forEach((y, ri) => {
    for (let s = 0; s < 3; s++) {
      const seglen = W / 3;
      g.add(part(jitter(limb(0.11, 0.13, seglen * 0.97, 7, 2), 0.02, rand), MAT.darkOak, 'rail-' + ri + '-' + s, {
        pos: [-W / 2 + seglen * (s + 0.5), y, -0.32], rot: [0, 0, Math.PI / 2 + (rand() - 0.5) * 0.02],
      }));
    }
    // Lashings at the crossings.
    for (let i = 0; i < cnt(9); i++) {
      g.add(part(torus(0.19, 0.026, 4, 9), MAT.ropeHemp, 'lashing-' + ri + '-' + i, {
        pos: [-W / 2 + 0.9 + i * 1.75, y, -0.16], rot: [0, Math.PI / 2, 0],
      }));
    }
  });

  // The patch: a hurdle of split planks lashed over the weak run.
  for (let i = 0; i < cnt(7); i++) {
    const p = box(0.34, 3.4, 0.07, 1, 4, 1);
    bow(p, 0.02, 'z');
    jitter(p, 0.012, rand);
    g.add(part(p, MAT.weatheredTimber, 'patch-plank-' + i, {
      pos: [-W / 2 + 6.6 + i * 0.44, 2.3, -0.48], rot: [0, 0, (rand() - 0.5) * 0.06],
    }));
  }
  g.add(part(jitter(box(3.4, 0.16, 0.16, 4, 1, 1), 0.02, rand), MAT.weatheredTimber, 'patch-ledger', { pos: [-W / 2 + 8.0, 3.6, -0.56] }));

  // Raking shores propping the repaired run from inside.
  [7.0, 9.2].forEach((x, i) => {
    g.add(part(jitter(limb(0.09, 0.13, 4.4, 7, 2), 0.02, rand), MAT.weatheredTimber, 'shore-' + i, {
      pos: [-W / 2 + x, 1.9, -1.25], rot: [0.72, 0, 0],
    }));
    g.add(part(jitter(box(0.5, 0.2, 0.7, 1, 1, 1), 0.03, rand), MAT.slateDry, 'shore-pad-' + i, { pos: [-W / 2 + x, 0.1, -2.5] }));
  });

  // Earth berm and a stone kerb along the outer foot.
  g.add(part(jitter(box(W, 0.42, 1.05, 14, 1, 2), 0.07, rand), MAT.clayPale, 'earth-berm', { pos: [0, 0.2, 0.5] }));
  for (let i = 0; i < cnt(20); i++) {
    g.add(part(jitter(box(W / 20 * 0.9, 0.3, 0.4), 0.05, rand), MAT.wetSlate, 'kerb-' + i, {
      pos: [-W / 2 + (W / 20) * (i + 0.5), 0.14, 1.0], rot: [0, (rand() - 0.5) * 0.2, 0],
    }));
  }
  return seat(g);
}

/* --------------------------------------- 05 · Spring channel arch
 * [10, 6] footprint, 6 m, stone-vault, water-channel + walkway. Hero
 * class — 48,000. The warm spring is why Hearthmere exists; this is the
 * structure that carries it under the road.                              */
export function springChannelArch() {
  const rand = rnd(0x5b12a4);
  const g = new THREE.Group();
  g.name = 'spring-channel-arch';
  const W = 10, D = 6, H = 6;
  const SPAN = 2.6, SPRING = 2.2;

  // Two abutments in coursed rubble, battered.
  [-1, 1].forEach((s, i) => {
    const ab = rubbleWall(3.3, SPRING + 0.6, D - 0.6, 0.7, MAT.springStone, rand, 'abutment-' + i);
    ab.position.set(s * (SPAN + 1.65), (SPRING + 0.6) / 2, 0);
    g.add(ab);
  });
  g.add(part(jitter(box(W, 0.5, D, 10, 1, 6), 0.07, rand), MAT.springStone, 'foundation', { pos: [0, 0.25, 0] }));

  // Barrel vault: rings of voussoirs stepped back through the depth, so the
  // arch reads as a tunnel and not a cutout.
  const rings = cnt(7);
  for (let r = 0; r < rings; r++) {
    const z = -D / 2 + 0.5 + (r + 0.5) * ((D - 1.0) / rings);
    const arch = voussoirArch(SPAN, 15, (D - 1.0) / rings * 1.04, 0.52, MAT.springStone, rand, 'vault-ring-' + r);
    arch.position.set(0, SPRING, z);
    g.add(arch);
  }
  // Archivolt: a proud ring on each face.
  [-1, 1].forEach((s, i) => {
    const av = voussoirArch(SPAN + 0.02, 17, 0.34, 0.7, MAT.slateDry, rand, 'archivolt-' + i);
    av.position.set(0, SPRING, s * (D / 2 - 0.08));
    g.add(av);
  });

  // Spandrel walls up to the walkway, and the parapet above.
  [-1, 1].forEach((s, i) => {
    const sp = rubbleWall(W, H - 1.1 - SPRING - SPAN, 0.55, 0.62, MAT.springStone, rand, 'spandrel-' + i, [
      [0, 0, SPAN * 1.9, 2.2],
    ]);
    sp.position.set(0, SPRING + SPAN + (H - 1.1 - SPRING - SPAN) / 2, s * (D / 2 - 0.28));
    g.add(sp);
    const par = rubbleWall(W, 0.95, 0.45, 0.42, MAT.slateDry, rand, 'parapet-' + i);
    par.position.set(0, H - 0.45, s * (D / 2 - 0.22));
    g.add(par);
    g.add(part(jitter(box(W + 0.3, 0.18, 0.62, 10, 1, 1), 0.03, rand), MAT.slateDry, 'coping-' + i, { pos: [0, H + 0.09, s * (D / 2 - 0.22)] }));
  });

  // Walkway deck, cambered, in wet slate setts.
  for (let i = 0; i < cnt(22); i++) {
    for (let j = 0; j < cnt(9); j++) {
      const x = -W / 2 + (W / 22) * (i + 0.5);
      const z = -(D / 2 - 0.7) + ((D - 1.4) / 9) * (j + 0.5);
      const camber = -Math.pow(z / (D / 2), 2) * 0.1;
      g.add(part(jitter(box((W / 22) * 0.9, 0.16, ((D - 1.4) / 9) * 0.9), 0.025, rand), MAT.wetSlate, 'sett-' + i + '-' + j, {
        pos: [x, H - 1.02 + camber, z], rot: [0, (rand() - 0.5) * 0.14, 0],
      }));
    }
  }

  // The channel itself: a cut stone trough under the arch, running water,
  // and the mineral crust that only forms where the spring runs warm.
  g.add(part(jitter(box(W * 0.55, 0.4, 1.5, 6, 1, 2), 0.04, rand), MAT.springStone, 'channel-bed', { pos: [0, 0.55, 0] }));
  [-1, 1].forEach((s, i) => {
    g.add(part(jitter(box(W * 0.55, 0.7, 0.3, 6, 1, 1), 0.03, rand), MAT.springStone, 'channel-kerb-' + i, { pos: [0, 0.85, s * 0.9] }));
  });
  g.add(part(box(W * 0.53, 0.03, 1.4, 6, 1, 2), MAT.blackwater, 'spring-water', { pos: [0, 0.78, 0] }));
  for (let i = 0; i < cnt(16); i++) {
    const c = ico(0.1 + rand() * 0.13, 1);
    c.scale(1.5, 0.5, 1.2);
    jitter(c, 0.04, rand);
    g.add(part(c, MAT.springStone, 'mineral-crust-' + i, {
      pos: [-W * 0.26 + rand() * W * 0.52, 0.72 + rand() * 0.24, (rand() - 0.5) * 2.0],
    }));
  }
  // Steam moss where the warm ground is.
  for (let i = 0; i < cnt(14); i++) {
    const m = ico(0.11 + rand() * 0.1, 0);
    m.scale(1.4, 0.42, 1.3);
    jitter(m, 0.035, rand);
    g.add(part(m, MAT.graveMoss, 'steam-moss-' + i, {
      pos: [(rand() - 0.5) * W * 0.8, 0.62 + rand() * 0.5, (rand() - 0.5) * (D - 1.2)],
    }));
  }
  // Iron grille across the upstream mouth, to keep the dead out of the water.
  for (let i = 0; i < cnt(9); i++) {
    g.add(part(limb(0.035, 0.035, SPAN * 1.7, 6, 1), MAT.pittedIron, 'grille-bar-' + i, {
      pos: [-SPAN + 0.32 + i * (SPAN * 2 / 9), SPRING * 0.62, -(D / 2 - 0.42)],
    }));
  }
  g.add(part(jitter(box(SPAN * 2.1, 0.14, 0.18, 5, 1, 1), 0.02, rand), MAT.pittedIron, 'grille-rail', { pos: [0, SPRING * 1.3, -(D / 2 - 0.42)] }));
  return seat(g);
}

/* ----------------------------------------------- 06 · Old Vigil Shrine
 * [7, 7] footprint, 8 m, ruined-canopy, altar-east. Hero class — 48,000.
 * A named landmark: world.js places old_vigil_shrine at (4, 7).           */
export function vigilShrineOld() {
  const rand = rnd(0x71a5e0);
  const g = new THREE.Group();
  g.name = 'vigil-shrine-old';
  const R = 3.0, H = 8;

  // Three-step stylobate, worn hollow on the east approach.
  for (let s = 0; s < 3; s++) {
    const side = R * 2 + 1.5 - s * 0.55;
    const n = cnt(Math.round(side / 0.62));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x = -side / 2 + (side / n) * (i + 0.5);
        const z = -side / 2 + (side / n) * (j + 0.5);
        if (Math.max(Math.abs(x), Math.abs(z)) < side / 2 - side / n && s < 2) continue;
        g.add(part(jitter(box((side / n) * 0.94, 0.3, (side / n) * 0.94), 0.035, rand), MAT.slateDry, 'step-' + s + '-' + i + '-' + j, {
          pos: [x, 0.15 + s * 0.3, z], rot: [0, (rand() - 0.5) * 0.12, 0],
        }));
      }
    }
  }
  g.add(part(jitter(box(R * 2 - 0.2, 0.26, R * 2 - 0.2, 8, 1, 8), 0.03, rand), MAT.slateDry, 'shrine-floor', { pos: [0, 1.03, 0] }));

  // Six columns with entasis. Two are broken — the canopy is ruined, and
  // this is why.
  const cols = [
    [0, 1, 1], [1, 1, 1], [1, 0, 1], [1, -1, 0.42], [0, -1, 1], [-1, -1, 0.66], [-1, 0, 1], [-1, 1, 1],
  ];
  const shaft = (t) => lathe([
    [0.34, 0], [0.36, 0.1], [0.33, 0.25],
    [0.32, 0.9 * t], [0.3, 1.9 * t], [0.27, 2.9 * t], [0.25, 3.5 * t],
    [0.29, 3.62 * t], [0.24, 3.74 * t], [0, 3.76 * t],
  ], 16);
  cols.forEach(([cx, cz, t], i) => {
    const a = Math.atan2(cz, cx);
    const rad = R * 0.86;
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
    g.add(part(jitter(box(0.9, 0.2, 0.9, 2, 1, 2), 0.02, rand), MAT.slateDry, 'col-base-' + i, { pos: [x, 1.24, z] }));
    g.add(part(shaft(t), MAT.springStone, 'col-shaft-' + i, { pos: [x, 1.34, z] }));
    if (t > 0.9) {
      g.add(part(jitter(box(0.86, 0.24, 0.86, 2, 1, 2), 0.02, rand), MAT.slateDry, 'col-cap-' + i, { pos: [x, 1.34 + 3.76 * t + 0.12, z] }));
    } else {
      // Broken shear face on the stump.
      g.add(part(jitter(box(0.62, 0.16, 0.62, 2, 1, 2), 0.07, rand), MAT.springStone, 'col-shear-' + i, {
        pos: [x, 1.34 + 3.76 * t + 0.06, z], rot: [(rand() - 0.5) * 0.3, 0, (rand() - 0.5) * 0.3],
      }));
    }
  });

  // Ruined canopy: an architrave ring that survives over two thirds of the
  // circle, four rib stubs, and the rest on the floor.
  const ARCH_Y = 5.4;
  for (let i = 0; i < cnt(13); i++) {
    const a = 0.5 + (i / 13) * Math.PI * 1.35;
    g.add(part(jitter(box(R * 0.52, 0.42, 0.62, 2, 1, 1), 0.03, rand), MAT.slateDry, 'architrave-' + i, {
      pos: [Math.cos(a) * R * 0.86, ARCH_Y, Math.sin(a) * R * 0.86], rot: [0, -a, (rand() - 0.5) * 0.05],
    }));
  }
  for (let i = 0; i < cnt(5); i++) {
    const a = 0.7 + i * 0.62;
    g.add(part(jitter(box(0.3, 2.4, 0.3, 1, 3, 1), 0.03, rand), MAT.springStone, 'canopy-rib-' + i, {
      pos: [Math.cos(a) * R * 0.55, ARCH_Y + 1.1, Math.sin(a) * R * 0.55],
      rot: [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5],
    }));
  }
  // Boss where the ribs would have met, still hanging.
  g.add(part(ico(0.44, 1), MAT.springStone, 'canopy-boss', { pos: [0.3, H - 0.5, 0.2] }));

  // Rubble: the collapsed third, on the steps and floor.
  for (let i = 0; i < cnt(24); i++) {
    const b = box(0.3 + rand() * 0.5, 0.24 + rand() * 0.36, 0.28 + rand() * 0.44);
    jitter(b, 0.07, rand);
    const a = -1.2 + rand() * 2.0;
    const rad = R * (0.3 + rand() * 1.05);
    g.add(part(b, rand() > 0.5 ? MAT.springStone : MAT.slateDry, 'rubble-' + i, {
      pos: [Math.cos(a) * rad, 1.2 + rand() * 0.3, Math.sin(a) * rad],
      rot: [rand() * T, rand() * T, rand() * T],
    }));
  }
  // A whole drum from a fallen column, lying where it rolled.
  g.add(part(limb(0.31, 0.33, 1.5, 14, 2), MAT.springStone, 'fallen-drum', { pos: [1.9, 1.45, -2.2], rot: [0, 0.4, Math.PI / 2] }));

  // Altar, east, as declared. Clay tablets left on it, and a vigil bowl.
  g.add(part(jitter(box(1.9, 0.95, 1.0, 3, 2, 2), 0.035, rand), MAT.springStone, 'altar-block', { pos: [R * 0.62, 1.62, 0] }));
  g.add(part(jitter(box(2.2, 0.16, 1.25, 3, 1, 2), 0.02, rand), MAT.slateDry, 'altar-mensa', { pos: [R * 0.62, 2.17, 0] }));
  for (let i = 0; i < cnt(7); i++) {
    g.add(part(jitter(box(0.15, 0.21, 0.024, 1, 2, 1), 0.005, rand), MAT.firedClay, 'vigil-tablet-' + i, {
      pos: [R * 0.62 + (rand() - 0.5) * 0.5, 2.36, -0.42 + i * 0.14],
      rot: [Math.PI / 2 - 0.1, (rand() - 0.5) * 0.4, (rand() - 0.5) * 0.2],
    }));
  }
  g.add(part(lathe([[0.05, 0], [0.16, 0.03], [0.2, 0.12], [0.21, 0.18], [0.18, 0.19], [0.16, 0.13], [0.11, 0.05], [0, 0.04]], 16), MAT.pittedIron, 'vigil-bowl', { pos: [R * 0.62 - 0.6, 2.26, 0.3] }));
  for (let i = 0; i < cnt(4); i++) {
    g.add(part(ico(0.035 + rand() * 0.02, 0), MAT.ember, 'vigil-coal-' + i, { pos: [R * 0.62 - 0.6 + (rand() - 0.5) * 0.18, 2.38, 0.3 + (rand() - 0.5) * 0.18] }));
  }
  // Wall lichen and moss creeping the north side.
  for (let i = 0; i < cnt(12); i++) {
    const m = ico(0.09 + rand() * 0.08, 0);
    m.scale(1.5, 0.35, 1.3);
    jitter(m, 0.03, rand);
    g.add(part(m, i % 3 ? MAT.graveMoss : MAT.lichenGrey, 'creep-' + i, {
      pos: [(rand() - 0.5) * R * 1.6, 1.12 + rand() * 1.1, -R * (0.5 + rand() * 0.6)],
    }));
  }
  return seat(g);
}

/* ------------------------------------------ 07 · Patchwork gatehouse
 * [14, 6] footprint, 10 m, asymmetric-slate, gate-center + guard-door.
 * Hero class — 48,000. "Patchwork" and "asymmetric" are the brief: the two
 * towers are deliberately unequal and the roofs do not match.             */
export function gatehousePatchwork() {
  const rand = rnd(0x9a7e05);
  const g = new THREE.Group();
  g.name = 'gatehouse-patchwork';
  const W = 14, D = 6, H = 10;
  const GATE_W = 3.6, PASSAGE = 4.6;

  // Two towers, unequal: west is older, taller, stone; east is a rebuild,
  // shorter, and half timber because the stone ran out.
  const towers = [
    { s: -1, w: 4.4, h: 8.6, stone: 8.6 },
    { s: 1, w: 4.0, h: 7.2, stone: 4.4 },
  ];
  towers.forEach(({ s, w, h, stone }, ti) => {
    const cx = s * (W / 2 - w / 2);
    [[0, 1, 0], [0, -1, Math.PI], [1, 0, Math.PI / 2], [-1, 0, -Math.PI / 2]].forEach(([dx, dz, ry], fi) => {
      const face = fi < 2 ? w : D;
      const holes = fi === 0 && ti === 1 ? [[0, -stone / 2 + 1.2, 1.25, 2.3]] : [];
      const wall = rubbleWall(face, stone, 0.6, 0.74, MAT.wetSlate, rand, 'tower-' + ti + '-wall-' + fi, holes);
      wall.position.set(cx + dx * (w / 2 - 0.2), stone / 2, dz * (D / 2 - 0.2));
      wall.rotation.y = ry;
      g.add(wall);
    });
    g.add(part(jitter(box(w + 0.5, 0.4, D + 0.5, 5, 1, 5), 0.06, rand), MAT.slateDry, 'tower-' + ti + '-plinth', { pos: [cx, 0.2, 0] }));
    // The east tower is finished in timber above its short stone.
    if (stone < h) {
      for (let i = 0; i < 4; i++) {
        g.add(part(jitter(box(0.3, h - stone, 0.3, 1, 2, 1), 0.02, rand), MAT.weatheredTimber, 'tower-' + ti + '-post-' + i, {
          pos: [cx - w / 2 + 0.3 + (i % 2) * (w - 0.6), (stone + h) / 2, (i < 2 ? -1 : 1) * (D / 2 - 0.25)],
        }));
      }
      [-1, 1].forEach((z, i) => {
        g.add(part(jitter(box(w - 0.5, h - stone - 0.3, 0.14, 4, 3, 1), 0.03, rand), MAT.clayPale, 'tower-' + ti + '-infill-' + i, {
          pos: [cx, (stone + h) / 2, z * (D / 2 - 0.25)],
        }));
        g.add(part(box(0.2, 1.9, 0.2), MAT.weatheredTimber, 'tower-' + ti + '-brace-' + i, {
          pos: [cx, stone + 0.95, z * (D / 2 - 0.2)], rot: [0, 0, i ? 0.6 : -0.6],
        }));
      });
      g.add(part(jitter(box(w, 0.3, D, 4, 1, 4), 0.02, rand), MAT.weatheredTimber, 'tower-' + ti + '-plate', { pos: [cx, h, 0] }));
    } else {
      // Crenellated parapet on the old west tower, two merlons missing.
      const merlons = cnt(10);
      for (let i = 0; i < merlons; i++) {
        if (i === 3 || i === 7) continue;
        const a = (i / merlons) * T;
        g.add(part(jitter(box(0.62, 0.85, 0.5, 1, 1, 1), 0.04, rand), MAT.slateDry, 'merlon-' + i, {
          pos: [cx + Math.cos(a) * (w / 2 - 0.3), h + 0.42, Math.sin(a) * (D / 2 - 0.3)], rot: [0, -a, 0],
        }));
      }
      g.add(part(jitter(box(w + 0.35, 0.24, D + 0.35, 5, 1, 5), 0.03, rand), MAT.slateDry, 'string-course', { pos: [cx, h - 0.12, 0] }));
    }
    // Arrow loops, one per tower per face.
    g.add(part(box(0.16, 0.95, 0.7), MAT.blackIron, 'arrow-loop-' + ti, { pos: [cx + s * (w / 2 - 0.05), stone * 0.6, 0] }));
    // Asymmetric roof: unequal pitch, unequal ridge height.
    const rise = ti ? 1.5 : 2.1;
    const pitch = Math.atan2(rise, D / 2);
    const slope = Math.hypot(rise, D / 2);
    [-1, 1].forEach((z, j) => {
      const f = slateField(w + 0.4, slope, ti ? 0.5 : 0.42, MAT.wetSlate, rand, 'tower-' + ti + '-roof-' + j);
      f.position.set(cx, h + rise / 2, (z * D) / 4);
      f.rotation.x = -z * pitch;
      g.add(f);
    });
    for (let i = 0; i < cnt(9); i++) {
      g.add(part(jitter(box((w + 0.3) / 9, 0.15, 0.46), 0.02, rand), MAT.slateDry, 'tower-' + ti + '-ridge-' + i, {
        pos: [cx - (w + 0.3) / 2 + ((w + 0.3) / 9) * (i + 0.5), h + rise + 0.05, 0],
      }));
    }
  });

  // The gate passage: barrel-vaulted, with a drawbar slot and a real gate.
  const rings = cnt(6);
  for (let r = 0; r < rings; r++) {
    const z = -D / 2 + 0.5 + (r + 0.5) * ((D - 1.0) / rings);
    const arch = voussoirArch(GATE_W / 2, 13, ((D - 1.0) / rings) * 1.04, 0.5, MAT.slateDry, rand, 'gate-ring-' + r);
    arch.position.set(0, PASSAGE - GATE_W / 2, z);
    g.add(arch);
  }
  [-1, 1].forEach((s, i) => {
    const jamb = rubbleWall(1.1, PASSAGE - GATE_W / 2, D - 0.6, 0.6, MAT.wetSlate, rand, 'gate-jamb-' + i);
    jamb.position.set(s * (GATE_W / 2 + 0.55), (PASSAGE - GATE_W / 2) / 2, 0);
    g.add(jamb);
  });
  // Curtain over the gate, up to the walkway.
  const curtain = rubbleWall(W - 8.4 + 2.2, H - 2.4 - PASSAGE - GATE_W / 2, 0.6, 0.66, MAT.wetSlate, rand, 'gate-curtain');
  curtain.position.set(0, PASSAGE + GATE_W / 2 + (H - 2.4 - PASSAGE - GATE_W / 2) / 2, -(D / 2 - 0.3));
  g.add(curtain);

  // Two-leaf gate, iron-studded, one leaf hanging open.
  [-1, 1].forEach((s, i) => {
    const leaf = plankDoor(GATE_W / 2 - 0.06, PASSAGE - 0.2, MAT.darkOak, MAT.pittedIron, rand, 'gate-leaf-' + i);
    leaf.position.set(s * (GATE_W / 4) * (i ? 0.62 : 1), (PASSAGE - 0.2) / 2, D / 2 - 0.9);
    leaf.rotation.y = i ? -0.85 : 0;
    g.add(leaf);
  });
  g.add(part(jitter(box(GATE_W + 1.5, 0.42, 0.8, 4, 1, 1), 0.03, rand), MAT.slateDry, 'gate-lintel', { pos: [0, PASSAGE + 0.1, D / 2 - 0.35] }));
  g.add(part(limb(0.09, 0.09, GATE_W + 0.9, 8, 1), MAT.darkOak, 'draw-bar', { pos: [0, PASSAGE - 1.3, D / 2 - 1.45], rot: [0, 0, Math.PI / 2] }));

  // Timber hoarding over the gate — patched, which is the asset's name.
  g.add(part(jitter(box(GATE_W + 2.4, 0.3, 1.5, 4, 1, 2), 0.02, rand), MAT.weatheredTimber, 'hoarding-floor', { pos: [0, H - 2.5, D / 2 + 0.4] }));
  for (let i = 0; i < cnt(11); i++) {
    const p = box(0.42, 2.0, 0.08, 1, 3, 1);
    bow(p, 0.014, 'z');
    jitter(p, 0.01, rand);
    g.add(part(p, i % 3 ? MAT.weatheredTimber : MAT.darkOak, 'hoarding-plank-' + i, {
      pos: [-(GATE_W + 2.2) / 2 + i * ((GATE_W + 2.2) / 11) + 0.2, H - 1.4, D / 2 + 1.1],
      rot: [0, 0, (rand() - 0.5) * 0.05],
    }));
  }
  for (let i = 0; i < cnt(4); i++) {
    g.add(part(jitter(limb(0.08, 0.11, 2.1, 6, 1), 0.02, rand), MAT.weatheredTimber, 'hoarding-strut-' + i, {
      pos: [-1.8 + i * 1.2, H - 3.2, D / 2 + 0.7], rot: [0.85, 0, 0],
    }));
  }
  // Walkway between the towers, with a plank deck and a rail.
  for (let i = 0; i < cnt(12); i++) {
    g.add(part(jitter(box((W - 8.4 + 2.4) / 12 * 0.92, 0.12, D - 1.4, 1, 1, 3), 0.015, rand), MAT.weatheredTimber, 'walk-plank-' + i, {
      pos: [-(W - 8.4 + 2.4) / 2 + ((W - 8.4 + 2.4) / 12) * (i + 0.5), H - 2.34, -0.2],
    }));
  }
  g.add(part(jitter(box(W - 8.4 + 2.4, 0.12, 0.12, 6, 1, 1), 0.015, rand), MAT.weatheredTimber, 'walk-rail', { pos: [0, H - 1.4, D / 2 - 0.6] }));
  return seat(g);
}
