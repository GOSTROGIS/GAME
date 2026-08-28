/* Crafting stations, tools and consumables — parametric.
 *
 * Grounded in the game's own eighteen disciplines. skills.js names Smithing,
 * Alchemy, Mining, Woodcraft, Leatherworking, Cooking and Runecrafting — each
 * of those needs a station a player can stand at, and none existed. Orik Senn
 * is "chained to his own anvil by a vow", which is a specific anvil, not a
 * generic one, so the chain is an axis. Cinderward's kit declares
 * `smith_quench_trough`, `ore_crusher_manual`, `anvil_vow_chain` and
 * `kiln_scale_heap`; Ysra Pell trades in alchemy and healing.
 *
 * The consumables here close a real gap: ITEM_REGISTRY carries ore, ingots,
 * tonics and relics as data with no geometry at all, which is why the
 * inventory has nothing to render.
 */
import {
  THREE, rnd, jitter, lean, bow, squash, part, lathe, limb, torus, cone, cyl,
  ico, ring, chain, sg, cnt, thin, seat,
} from './hm-core.js';
import { axesOf } from './hm-steam.js';

const box = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);
const T = Math.PI * 2;
const M = (name, color, rough, metal = 0.16) => {
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: rough, metalness: metal });
  m.name = name;
  return m;
};

export const CRAFT = {
  iron: M('wrought-iron', '#3d4245', 0.72),
  ironPolish: M('anvil-face-polished', '#767d81', 0.34),
  rust: M('rust-bloom', '#66401f', 0.92, 0.02),
  steel: M('tool-steel', '#697074', 0.5),
  brass: M('brass-fitting', '#a8813d', 0.48, 0.2),
  copper: M('alembic-copper', '#8c5a37', 0.46, 0.2),
  oak: M('oak-stump', '#3a2f26', 0.9, 0.01),
  ash: M('ash-haft', '#4d4132', 0.88, 0.01),
  plank: M('plank-worn', '#443a2e', 0.9, 0.01),
  stone: M('grindstone-grit', '#5c5a52', 0.95, 0.01),
  firebrick: M('firebrick', '#5b3a2c', 0.9, 0.01),
  soot: M('soot-black', '#1d1f20', 0.94, 0.02),
  glass: M('alembic-glass', '#7d99a0', 0.14, 0.02),
  leather: M('bellows-leather', '#3f3128', 0.9, 0.01),
  /* Emissive is the only place the kit spends light — a forge with no glow is
     not a forge. Intensity stays modest so it reads as banked, not as neon. */
  coals: new THREE.MeshStandardMaterial({
    color: new THREE.Color('#8a3512'), roughness: 0.85,
    emissive: new THREE.Color('#d4531a'), emissiveIntensity: 1.35,
  }),
  molten: new THREE.MeshStandardMaterial({
    color: new THREE.Color('#c2792c'), roughness: 0.6,
    emissive: new THREE.Color('#e8933a'), emissiveIntensity: 1.1,
  }),
  emberIron: M('ember-iron', '#7a4b2c', 0.78, 0.14),
  oreRock: M('ore-host-rock', '#4a4b46', 0.93, 0.01),
  tonicGreen: M('tonic-moss', '#4c6b4a', 0.3, 0.02),
  tonicRed: M('tonic-blood', '#6b2a2a', 0.3, 0.02),
  tonicPale: M('tonic-salt', '#9aa39a', 0.28, 0.02),
  cork: M('cork-stopper', '#6b5535', 0.92, 0),
  cloth: M('wrapped-cloth', '#5b4a41', 0.95, 0),
};
CRAFT.coals.name = 'forge-coals';
CRAFT.molten.name = 'molten-metal';

/* ----------------------------------------------------------------- anvil */

export const ANVIL_AXES = { horn: 3, body: 4, stump: 3, metal: 3, vowChain: 2, wear: 3 };
export function anvil(variant = 0) {
  const A = axesOf(variant, ANVIL_AXES);
  const rand = rnd(0xa2f1 + variant * 7013);
  const g = new THREE.Group();
  g.name = 'anvil';

  const mat = [CRAFT.iron, CRAFT.rust, CRAFT.steel][A.metal];
  const L = 0.72, W = 0.2;
  /* An anvil's waist is what makes it an anvil. Body, waist, foot — three
     boxes, because one box is a block and reads as furniture. */
  const bodyH = 0.13;
  let y = 0;

  const stumpH = [0, 0.46, 0.62][A.stump];
  if (A.stump > 0) {
    const st = cyl(0.24, 0.28, stumpH, sg(A.stump === 1 ? 9 : 14));
    jitter(st, 0.014, rand);
    g.add(part(st, CRAFT.oak, 'anvil-stump', { pos: [0, stumpH / 2, 0] }));
    y = stumpH;
    if (A.wear > 0) {
      for (let i = 0; i < cnt(3); i++) {
        const a = rand() * T;
        g.add(part(box(0.02, 0.05, 0.02), CRAFT.soot, `stump-scar-${i}`,
          { pos: [Math.cos(a) * 0.23, stumpH * (0.3 + rand() * 0.5), Math.sin(a) * 0.23] }));
      }
    }
  }

  g.add(part(box(L * 0.44, 0.07, W * 1.35), mat, 'anvil-foot', { pos: [0, y + 0.035, 0] }));
  g.add(part(box(L * 0.3, 0.09, W * 0.7), mat, 'anvil-waist', { pos: [0, y + 0.115, 0] }));
  const bodyGeo = box(L * [0.78, 0.9, 1, 0.84][A.body], bodyH, W);
  g.add(part(bodyGeo, mat, 'anvil-body', { pos: [0, y + 0.16 + bodyH / 2, 0] }));
  /* The face is struck daily and polishes to a mirror while the sides rust.
     That separation is the single most recognisable thing about an anvil. */
  g.add(part(box(L * [0.78, 0.9, 1, 0.84][A.body] * 0.99, 0.012, W * 0.99), CRAFT.ironPolish, 'anvil-face',
    { pos: [0, y + 0.16 + bodyH + 0.005, 0] }));

  const topY = y + 0.16 + bodyH;
  if (A.horn > 0) {
    const hl = A.horn === 1 ? 0.22 : 0.3;
    const hn = cone(W * 0.42, hl, sg(12));
    g.add(part(hn, mat, 'anvil-horn', { pos: [L * 0.52 + hl / 2 - 0.02, topY - bodyH * 0.42, 0], rot: [0, 0, -Math.PI / 2] }));
  }
  if (A.horn === 2) {
    g.add(part(box(0.1, bodyH * 0.86, W * 0.8), mat, 'anvil-heel', { pos: [-L * 0.52, topY - bodyH * 0.5, 0] }));
    g.add(part(box(0.03, 0.03, 0.03), CRAFT.soot, 'hardy-hole', { pos: [-L * 0.34, topY - 0.008, 0] }));
  }

  /* Orik Senn's vow chain. This is not decoration — characters.js has him
     literally chained to the anvil, and a smith you cannot lead away is the
     kind of detail a player remembers. */
  if (A.vowChain === 1) {
    const ch = chain(cnt(7), 0.038, 0.011, CRAFT.rust, 'vow-chain', rand);
    ch.position.set(L * 0.2, topY - 0.02, W * 0.5);
    ch.rotation.set(0.3, 0.4, 1.1);
    g.add(ch);
    g.add(part(torus(0.05, 0.014, 5, sg(16)), CRAFT.rust, 'vow-ring',
      { pos: [L * 0.2, topY - 0.03, W * 0.52], rot: [1.2, 0, 0] }));
  }
  return seat(g);
}

/* --------------------------------------------------------- forge station */

export const FORGE_AXES = { hood: 3, bellows: 2, fire: 3, trough: 2, chimney: 3, stock: 3 };
export function forgeStation(variant = 0) {
  const A = axesOf(variant, FORGE_AXES);
  const rand = rnd(0xf02e + variant * 6301);
  const g = new THREE.Group();
  g.name = 'forge-station';

  const W = 1.35, D = 0.9, H = 0.78;
  const hearth = box(W, H, D, 2, 2, 2);
  jitter(hearth, 0.014, rand);
  g.add(part(hearth, CRAFT.firebrick, 'hearth-body', { pos: [0, H / 2, 0] }));
  g.add(part(box(W * 0.72, 0.09, D * 0.66), CRAFT.soot, 'fire-bed', { pos: [0, H - 0.04, 0] }));

  /* Fire state as three grades: cold, banked, working. Hearthmere's whole
     lighting language is "banked braziers", so banked is the middle case and
     the default read, not an afterthought. */
  if (A.fire > 0) {
    const n = cnt(A.fire === 1 ? 5 : 11);
    for (let i = 0; i < n; i++) {
      const cx = (rand() - 0.5) * W * 0.6;
      const cz = (rand() - 0.5) * D * 0.5;
      const sz = 0.04 + rand() * 0.05;
      g.add(part(squash(ico(sz, 0), 1.2, 0.6, 1.2), A.fire === 2 ? CRAFT.molten : CRAFT.coals,
        `coal-${i}`, { pos: [cx, H + 0.01 + rand() * 0.02, cz] }));
    }
  }

  if (A.hood > 0) {
    const hh = A.hood === 1 ? 0.5 : 0.72;
    const hood = cyl(W * 0.22, W * 0.56, hh, sg(4), 1, true);
    g.add(part(hood, CRAFT.iron, 'forge-hood', { pos: [0, H + hh / 2 + 0.5, 0], rot: [0, Math.PI / 4, 0] }));
    for (const sx of [-1, 1]) {
      g.add(part(box(0.05, 0.5, 0.05), CRAFT.iron, `hood-post-${sx > 0 ? 'r' : 'l'}`,
        { pos: [sx * W * 0.42, H + 0.25, -D * 0.4] }));
    }
    if (A.chimney > 0) {
      const ch = A.chimney === 1 ? 0.6 : 1.1;
      g.add(part(cyl(W * 0.14, W * 0.19, ch, sg(12)), CRAFT.iron, 'chimney',
        { pos: [0, H + hh + 0.5 + ch / 2, 0] }));
      g.add(part(torus(W * 0.16, 0.02, 5, sg(14)), CRAFT.rust, 'chimney-band',
        { pos: [0, H + hh + 0.5 + ch * 0.6, 0], rot: [Math.PI / 2, 0, 0] }));
    }
  }

  if (A.bellows === 1) {
    /* Bellows: two boards and a leather bag, pinched at the nozzle. */
    const bl = 0.6;
    const bg = new THREE.Group();
    bg.name = 'bellows';
    for (const sy of [-1, 1]) {
      const bd = box(0.3, 0.03, bl);
      bow(bd, 0.03, 'z');
      bg.add(part(bd, CRAFT.plank, `bellows-board-${sy > 0 ? 'top' : 'bottom'}`, { pos: [0, sy * 0.11, 0] }));
    }
    const bag = squash(ico(0.2, 1), 0.72, 0.5, bl / 0.4);
    jitter(bag, 0.02, rand);
    bg.add(part(bag, CRAFT.leather, 'bellows-bag'));
    bg.add(part(cyl(0.03, 0.045, 0.26, sg(10)), CRAFT.iron, 'bellows-nozzle',
      { pos: [0, 0, -bl * 0.62], rot: [Math.PI / 2, 0, 0] }));
    bg.position.set(-W * 0.62, H * 0.62, D * 0.1);
    bg.rotation.y = Math.PI / 2;
    g.add(bg);
  }

  if (A.trough === 1) {
    /* `smith_quench_trough` — declared in Cinderward's kit. */
    const tw = 0.7, td = 0.34, th = 0.3;
    const tg = new THREE.Group();
    tg.name = 'quench-trough';
    for (const [w, d, x, z] of [[tw, 0.04, 0, td / 2], [tw, 0.04, 0, -td / 2], [0.04, td, tw / 2, 0], [0.04, td, -tw / 2, 0]]) {
      tg.add(part(box(w, th, d), CRAFT.plank, 'trough-side', { pos: [x, th / 2, z] }));
    }
    const water = part(box(tw * 0.94, 0.012, td * 0.9), CRAFT.glass, 'quench-water', { pos: [0, th * 0.78, 0] });
    thin(water);
    tg.add(water);
    for (let i = 0; i < cnt(3); i++) {
      tg.add(part(torus(0.02, 0.006, 4, sg(12)), CRAFT.rust, `trough-hoop-${i}`,
        { pos: [(i - 1) * tw * 0.3, th * 0.5, td / 2 + 0.01], rot: [Math.PI / 2, 0, 0] }));
    }
    tg.position.set(W * 0.85, 0, D * 0.2);
    g.add(tg);
  }

  /* Stock: bar iron leaning, ingots stacked. A forge with no material in it
     reads as a museum piece. */
  if (A.stock > 0) {
    for (let i = 0; i < cnt(A.stock * 2); i++) {
      const bl = 0.9 + rand() * 0.5;
      const b = box(0.035, bl, 0.035);
      lean(b, rand() * 0.2 - 0.1, 0.1, 1.1);
      g.add(part(b, i % 2 ? CRAFT.rust : CRAFT.iron, `bar-stock-${i}`, {
        pos: [-W * 0.4 + i * 0.06, bl / 2, -D * 0.55],
        rot: [0.18, rand() * 0.4, rand() * 0.16 - 0.08],
      }));
    }
  }
  return seat(g);
}

/* --------------------------------------------------------------- alembic
   Alchemy is one of the four disciplines that actually exists in skills.js,
   and Ysra Pell trades in it. A still is a lathe body plus a coil, and the
   coil is the whole silhouette. */

export const ALEMBIC_AXES = { vessel: 4, neck: 3, coil: 3, burner: 2, glassKind: 3, stand: 3 };
export function alembic(variant = 0) {
  const A = axesOf(variant, ALEMBIC_AXES);
  const rand = rnd(0xa1e3 + variant * 5527);
  const g = new THREE.Group();
  g.name = 'alembic';

  const bodyMat = [CRAFT.copper, CRAFT.glass, CRAFT.brass][A.glassKind];
  const R = 0.15;
  let y = 0;

  if (A.stand > 0) {
    const sh = A.stand === 1 ? 0.16 : 0.26;
    for (let i = 0; i < cnt(3); i++) {
      const a = (i / 3) * T;
      g.add(part(box(0.022, sh, 0.022), CRAFT.iron, `stand-leg-${i}`,
        { pos: [Math.cos(a) * R * 0.78, sh / 2, Math.sin(a) * R * 0.78], rot: [0, -a, 0] }));
    }
    g.add(part(torus(R * 0.8, 0.011, 4, sg(18)), CRAFT.iron, 'stand-ring', { pos: [0, sh * 0.86, 0], rot: [Math.PI / 2, 0, 0] }));
    y = sh;
  }

  const forms = [
    [[0, 0], [R * 0.5, 0], [R, R * 0.5], [R * 0.92, R * 1.0], [R * 0.4, R * 1.3], [R * 0.36, R * 1.4]],
    [[0, 0], [R * 0.7, 0], [R * 0.75, R * 0.3], [R * 0.7, R * 0.9], [R * 0.3, R * 1.15], [R * 0.28, R * 1.25]],
    [[0, 0], [R * 0.3, 0], [R * 0.85, R * 0.35], [R * 1.05, R * 0.8], [R * 0.5, R * 1.2], [R * 0.44, R * 1.32]],
    [[0, 0], [R * 0.6, 0], [R * 0.9, R * 0.25], [R * 0.86, R * 0.7], [R * 0.62, R * 1.0], [R * 0.24, R * 1.2], [R * 0.22, R * 1.3]],
  ];
  const prof = forms[A.vessel];
  const bodyGeo = lathe(prof, sg(26));
  g.add(part(bodyGeo, bodyMat, 'alembic-body', { pos: [0, y, 0] }));
  const topY = y + prof[prof.length - 1][1];
  const topR = prof[prof.length - 1][0];

  /* Neck and head — the condensing dome. */
  const neckH = [0.1, 0.2, 0.3][A.neck];
  g.add(part(cyl(topR * 0.8, topR, neckH, sg(14)), bodyMat, 'alembic-neck', { pos: [0, topY + neckH / 2, 0] }));
  g.add(part(lathe([[topR * 0.8, 0], [topR * 1.3, R * 0.2], [topR * 0.9, R * 0.42], [topR * 0.16, R * 0.5]], sg(18)),
    CRAFT.copper, 'alembic-head', { pos: [0, topY + neckH, 0] }));

  /* The coil. Torus arcs stepping downward — this is what says "still". */
  if (A.coil > 0) {
    const turns = cnt(A.coil === 1 ? 3 : 6);
    const cr = R * 0.62;
    for (let i = 0; i < turns; i++) {
      g.add(part(torus(cr, 0.014, 5, sg(18)), CRAFT.copper, `condenser-coil-${i}`, {
        pos: [R * 1.5, topY + neckH + R * 0.3 - i * 0.075, 0],
        rot: [Math.PI / 2 - 0.12, 0, 0],
      }));
    }
    g.add(part(cyl(0.014, 0.014, R * 1.5, sg(8)), CRAFT.copper, 'coil-inlet',
      { pos: [R * 0.75, topY + neckH + R * 0.45, 0], rot: [0, 0, Math.PI / 2] }));
    /* Receiving flask under the coil outlet. */
    g.add(part(lathe([[0, 0], [0.05, 0], [0.065, 0.05], [0.03, 0.1], [0.028, 0.12]], sg(14)),
      CRAFT.glass, 'receiver-flask', { pos: [R * 1.5, 0, 0] }));
  }

  if (A.burner === 1) {
    g.add(part(cyl(R * 0.55, R * 0.65, 0.07, sg(14)), CRAFT.iron, 'burner-pan', { pos: [0, 0.035, 0] }));
    for (let i = 0; i < cnt(4); i++) {
      g.add(part(squash(ico(0.028, 0), 1.2, 0.5, 1.2), CRAFT.coals, `burner-coal-${i}`,
        { pos: [(rand() - 0.5) * R * 0.6, 0.075, (rand() - 0.5) * R * 0.6] }));
    }
  }
  return seat(g);
}

/* ---------------------------------------------------------- grindstone */

export const GRIND_AXES = { wheel: 3, frame: 3, drive: 3, trough: 2, stone: 3, scale: 3 };
export function grindstone(variant = 0) {
  const A = axesOf(variant, GRIND_AXES);
  const rand = rnd(0x62d5 + variant * 4933);
  const g = new THREE.Group();
  g.name = 'grindstone';

  const s = [0.8, 1, 1.3][A.scale];
  const R = [0.26, 0.34, 0.44][A.wheel] * s;
  const thk = 0.07 * s + R * 0.06;
  const mat = [CRAFT.stone, CRAFT.firebrick, CRAFT.oreRock][A.stone];
  const axleY = R + 0.28 * s;

  const wheel = cyl(R, R, thk, sg(30));
  jitter(wheel, R * 0.015, rand);
  g.add(part(wheel, mat, 'grind-wheel', { pos: [0, axleY, 0], rot: [Math.PI / 2, 0, 0] }));
  /* A used wheel is dished — a worn band at the rim in a darker material. */
  g.add(part(torus(R * 0.99, thk * 0.3, 4, sg(28)), CRAFT.soot, 'wheel-wear-band',
    { pos: [0, axleY, 0], rot: [0, 0, 0] }));
  g.add(part(cyl(0.022 * s, 0.022 * s, thk * 3.4, sg(10)), CRAFT.iron, 'axle',
    { pos: [0, axleY, 0], rot: [Math.PI / 2, 0, 0] }));

  const legs = A.frame === 0 ? 2 : 4;
  for (let i = 0; i < legs; i++) {
    const sx = i % 2 ? 1 : -1;
    const sz = i < 2 ? 1 : -1;
    const lg = box(0.055 * s, axleY, 0.055 * s);
    if (A.frame === 2) lean(lg, sx * 0.1, sz * 0.08, 1);
    g.add(part(lg, CRAFT.plank, `frame-leg-${i}`,
      { pos: [sx * R * 0.7, axleY / 2, sz * thk * (legs === 2 ? 0.9 : 1.6)] }));
  }
  g.add(part(box(R * 1.7, 0.05 * s, thk * 3.6), CRAFT.plank, 'frame-head', { pos: [0, axleY + 0.04 * s, 0] }));

  if (A.drive === 0) {
    g.add(part(cyl(0.014 * s, 0.014 * s, 0.16 * s, sg(8)), CRAFT.iron, 'crank-arm',
      { pos: [0.08 * s, axleY, thk * 1.9], rot: [0, 0, Math.PI / 2] }));
    g.add(part(cyl(0.02 * s, 0.02 * s, 0.1 * s, sg(8)), CRAFT.ash, 'crank-handle',
      { pos: [0.16 * s, axleY, thk * 1.9], rot: [Math.PI / 2, 0, 0] }));
  } else if (A.drive === 1) {
    g.add(part(box(0.5 * s, 0.035 * s, 0.14 * s), CRAFT.plank, 'treadle', { pos: [0, 0.05 * s, thk * 1.7] }));
    g.add(part(cyl(0.012 * s, 0.012 * s, axleY - 0.06 * s, sg(6)), CRAFT.iron, 'treadle-rod',
      { pos: [R * 0.4, axleY / 2, thk * 1.7], rot: [0, 0, 0.06] }));
  } else {
    g.add(part(torus(R * 0.42, 0.016 * s, 4, sg(20)), CRAFT.leather, 'drive-belt',
      { pos: [0, axleY * 0.44, thk * 1.4], rot: [Math.PI / 2, 0, 0] }));
    g.add(part(cyl(R * 0.4, R * 0.4, 0.05 * s, sg(16)), CRAFT.oak, 'drive-pulley',
      { pos: [0, axleY * 0.44, thk * 1.4], rot: [Math.PI / 2, 0, 0] }));
  }

  if (A.trough === 1) {
    g.add(part(lathe([[0, 0], [R * 0.6, 0], [R * 0.66, 0.09 * s], [R * 0.62, 0.11 * s]], sg(14)),
      CRAFT.iron, 'water-trough', { pos: [0, axleY - R - 0.13 * s, 0] }));
  }
  return seat(g);
}

/* -------------------------------------------------------------- hand tool
   Six kinds, because the disciplines demand six: Mining wants a pick,
   Woodcutting an axe, Smithing a hammer and tongs, Woodcraft a saw,
   Runecrafting a chisel. */

export const TOOL_AXES = { kind: 6, head: 3, haft: 3, wear: 3, scale: 3, wrap: 2 };
export function handTool(variant = 0) {
  const A = axesOf(variant, TOOL_AXES);
  const rand = rnd(0x7001 + variant * 4421);
  const g = new THREE.Group();
  g.name = 'hand-tool';

  const s = [0.82, 1, 1.22][A.scale];
  const hm = [CRAFT.steel, CRAFT.iron, CRAFT.rust][A.head];
  const hl = [0.42, 0.62, 0.86][A.haft] * s;
  const hr = 0.016 * s + hl * 0.012;

  /* Tongs have no haft; every other tool does. */
  if (A.kind !== 5) {
    const h = cyl(hr * 0.88, hr, hl, sg(8), 2);
    if (A.wear === 2) lean(h, 0.04, 0.02, 1.4);
    g.add(part(h, [CRAFT.ash, CRAFT.plank, CRAFT.oak][A.haft], 'haft', { pos: [0, hl / 2, 0] }));
    if (A.wrap === 1) {
      for (let i = 0; i < cnt(4); i++) {
        g.add(part(torus(hr * 1.2, hr * 0.4, 4, sg(10)), CRAFT.cloth, `grip-wrap-${i}`,
          { pos: [0, hl * 0.14 + i * hr * 1.9, 0], rot: [Math.PI / 2, 0, 0] }));
      }
    }
  }

  const y = hl;
  if (A.kind === 0) {
    /* Hammer — cross-peen, the smith's tool. */
    g.add(part(box(0.055 * s, 0.055 * s, 0.19 * s), hm, 'hammer-head', { pos: [0, y, 0] }));
    g.add(part(cone(0.028 * s, 0.07 * s, 4), hm, 'hammer-peen', { pos: [0, y, -0.13 * s], rot: [Math.PI / 2, 0, 0] }));
    g.add(part(cyl(0.032 * s, 0.032 * s, 0.02 * s, sg(12)), CRAFT.ironPolish, 'hammer-face',
      { pos: [0, y, 0.1 * s], rot: [Math.PI / 2, 0, 0] }));
  } else if (A.kind === 1) {
    /* Pick — two opposed tapered spikes. */
    for (const sz of [-1, 1]) {
      const sp = cone(0.026 * s, 0.24 * s, sg(7));
      g.add(part(sp, hm, `pick-spike-${sz > 0 ? 'a' : 'b'}`,
        { pos: [0, y + 0.02 * s, sz * 0.13 * s], rot: [sz * (Math.PI / 2 - 0.22), 0, 0] }));
    }
    g.add(part(box(0.05 * s, 0.06 * s, 0.07 * s), hm, 'pick-eye', { pos: [0, y, 0] }));
  } else if (A.kind === 2) {
    /* Axe — a wedge blade with a flared bit. */
    const bl = box(0.035 * s, 0.15 * s, 0.2 * s, 1, 2, 3);
    const p = bl.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = (p.getZ(i) + 0.1 * s) / (0.2 * s);
      p.setX(i, p.getX(i) * (1 - t * 0.72));
      p.setY(i, p.getY(i) * (1 + t * 0.5));
    }
    p.needsUpdate = true;
    bl.computeVertexNormals();
    g.add(part(bl, hm, 'axe-blade', { pos: [0, y, 0.08 * s] }));
    g.add(part(box(0.05 * s, 0.08 * s, 0.05 * s), hm, 'axe-eye', { pos: [0, y, 0] }));
    g.add(part(box(0.012 * s, 0.14 * s, 0.03 * s), CRAFT.ironPolish, 'axe-edge', { pos: [0, y, 0.18 * s] }));
  } else if (A.kind === 3) {
    /* Saw — a plate with teeth as a strip, plus a real tote. */
    const plate = box(0.008 * s, 0.11 * s, 0.5 * s);
    g.add(part(plate, hm, 'saw-plate', { pos: [0, y * 0.86, 0.26 * s] }));
    for (let i = 0; i < cnt(14); i++) {
      g.add(part(cone(0.008 * s, 0.02 * s, 3), CRAFT.ironPolish, `saw-tooth-${i}`,
        { pos: [0, y * 0.86 - 0.055 * s, 0.04 * s + i * 0.033 * s], rot: [Math.PI, 0, 0] }));
    }
    g.add(part(box(0.03 * s, 0.16 * s, 0.06 * s), CRAFT.oak, 'saw-tote', { pos: [0, y * 0.84, -0.02 * s] }));
  } else if (A.kind === 4) {
    g.add(part(cyl(0.014 * s, 0.02 * s, 0.16 * s, sg(8)), hm, 'chisel-shank', { pos: [0, y + 0.08 * s, 0] }));
    const ed = box(0.032 * s, 0.03 * s, 0.012 * s);
    g.add(part(ed, CRAFT.ironPolish, 'chisel-edge', { pos: [0, y + 0.17 * s, 0] }));
  } else {
    /* Tongs — two legs on a pivot, and the jaw gap is the read. */
    for (const sx of [-1, 1]) {
      const leg = box(0.02 * s, 0.5 * s, 0.02 * s);
      lean(leg, sx * 0.16, 0, 1);
      g.add(part(leg, hm, `tong-leg-${sx > 0 ? 'r' : 'l'}`, { pos: [sx * 0.02 * s, 0.25 * s, 0] }));
      g.add(part(box(0.022 * s, 0.09 * s, 0.03 * s), hm, `tong-jaw-${sx > 0 ? 'r' : 'l'}`,
        { pos: [sx * 0.035 * s, 0.54 * s, 0], rot: [0, 0, sx * -0.3] }));
    }
    g.add(part(cyl(0.008 * s, 0.008 * s, 0.06 * s, sg(8)), CRAFT.ironPolish, 'tong-pivot',
      { pos: [0, 0.46 * s, 0], rot: [Math.PI / 2, 0, 0] }));
  }

  if (A.wear === 2) {
    for (let i = 0; i < cnt(2); i++) {
      g.add(part(squash(ico(0.014 * s, 0), 1.3, 0.4, 1.3), CRAFT.rust, `rust-patch-${i}`,
        { pos: [(rand() - 0.5) * 0.05 * s, y + (rand() - 0.5) * 0.1 * s, (rand() - 0.5) * 0.12 * s] }));
    }
  }
  /* Tools lie down. Standing a hammer on its haft is a Blender default, not
     how a prop is found in a world. */
  g.rotation.z = Math.PI / 2 - 0.06;
  return seat(g);
}

/* --------------------------------------------------------------- flask
   ITEM_REGISTRY carries tonics as data with no geometry. Ysra Pell's whole
   trade is this object. */

export const FLASK_AXES = { form: 5, stopper: 3, liquid: 4, wrap: 3, label: 2, scale: 3 };
export function flask(variant = 0) {
  const A = axesOf(variant, FLASK_AXES);
  const rand = rnd(0xf1a5 + variant * 3833);
  const g = new THREE.Group();
  g.name = 'flask';

  const s = [0.75, 1, 1.35][A.scale];
  const R = 0.05 * s;
  const forms = [
    /* round-bellied */ [[0, 0], [R * 0.7, 0], [R * 1.5, R * 1.1], [R * 1.35, R * 2.1], [R * 0.55, R * 2.7], [R * 0.5, R * 3.1]],
    /* flat sided */ [[0, 0], [R * 1.1, 0], [R * 1.2, R * 0.3], [R * 1.15, R * 2.2], [R * 0.5, R * 2.6], [R * 0.46, R * 3.0]],
    /* tall vial */ [[0, 0], [R * 0.6, 0], [R * 0.7, R * 0.3], [R * 0.66, R * 3.0], [R * 0.4, R * 3.4], [R * 0.38, R * 3.7]],
    /* squat jug */ [[0, 0], [R * 0.9, 0], [R * 1.6, R * 0.8], [R * 1.5, R * 1.5], [R * 0.7, R * 1.9], [R * 0.62, R * 2.2]],
    /* conical */ [[0, 0], [R * 1.6, 0], [R * 1.5, R * 0.3], [R * 0.5, R * 2.4], [R * 0.46, R * 2.9]],
  ];
  const prof = forms[A.form];
  const topY = prof[prof.length - 1][1];
  const topR = prof[prof.length - 1][0];

  g.add(part(lathe(prof, sg(20)), CRAFT.glass, 'flask-body'));

  /* The liquid is a separate inset lathe — that is why a filled flask reads
     as filled rather than as tinted glass. */
  if (A.liquid > 0) {
    const lm = [null, CRAFT.tonicGreen, CRAFT.tonicRed, CRAFT.tonicPale][A.liquid];
    const fill = 0.55 + rand() * 0.25;
    const lp = prof.filter(([, y]) => y <= topY * fill).map(([r, y]) => [r * 0.9, y]);
    if (lp.length > 1) {
      lp.push([lp[lp.length - 1][0] * 0.98, topY * fill]);
      g.add(part(lathe(lp, sg(18)), lm, 'flask-contents'));
    }
  }

  if (A.stopper === 0) {
    g.add(part(cyl(topR * 0.95, topR * 1.05, R * 0.5, sg(12)), CRAFT.cork, 'cork-stopper', { pos: [0, topY + R * 0.2, 0] }));
  } else if (A.stopper === 1) {
    g.add(part(cyl(topR * 1.1, topR * 1.1, R * 0.35, sg(12)), CRAFT.brass, 'brass-cap', { pos: [0, topY + R * 0.15, 0] }));
    g.add(part(torus(topR * 1.15, R * 0.08, 4, sg(12)), CRAFT.brass, 'cap-lip', { pos: [0, topY, 0], rot: [Math.PI / 2, 0, 0] }));
  } else {
    const w = squash(ico(topR * 1.3, 0), 1, 0.7, 1);
    g.add(part(w, CRAFT.cloth, 'cloth-bung', { pos: [0, topY + R * 0.15, 0] }));
  }

  if (A.wrap > 0) {
    const n = cnt(A.wrap === 1 ? 2 : 5);
    for (let i = 0; i < n; i++) {
      const y = topY * (0.2 + i * 0.55 / n);
      const r = prof.reduce((b, p) => (Math.abs(p[1] - y) < Math.abs(b[1] - y) ? p : b))[0];
      g.add(part(torus(r * 1.04, R * 0.09, 4, sg(14)), CRAFT.cloth, `wrap-${i}`, { pos: [0, y, 0], rot: [Math.PI / 2, 0, 0] }));
    }
  }
  if (A.label === 1) {
    const maxR = Math.max(...prof.map((p) => p[0]));
    g.add(part(box(R * 0.06, topY * 0.4, maxR * 1.1), CRAFT.tonicPale, 'paper-label',
      { pos: [maxR * 0.94, topY * 0.42, 0] }));
  }
  return seat(g);
}

/* --------------------------------------------------------- ingot stack */

export const INGOT_AXES = { stack: 4, count: 4, metal: 4, mark: 3, scale: 2, tilt: 2 };
export function ingotStack(variant = 0) {
  const A = axesOf(variant, INGOT_AXES);
  const rand = rnd(0x1490 + variant * 3299);
  const g = new THREE.Group();
  g.name = 'ingot-stack';

  const s = [0.85, 1.15][A.scale];
  const mat = [CRAFT.iron, CRAFT.emberIron, CRAFT.brass, CRAFT.rust][A.metal];
  const W = 0.19 * s, H = 0.05 * s, D = 0.085 * s;
  const n = cnt([1, 3, 6, 11][A.count]);

  /* An ingot is a truncated wedge — a plain box reads as a brick. */
  const ing = (nm) => {
    const b = box(W, H, D, 1, 1, 1);
    const p = b.attributes.position;
    for (let i = 0; i < p.count; i++) {
      if (p.getY(i) > 0) { p.setX(i, p.getX(i) * 0.88); p.setZ(i, p.getZ(i) * 0.82); }
    }
    p.needsUpdate = true;
    b.computeVertexNormals();
    return b;
  };

  if (A.stack === 3) {
    /* Scattered on the ground rather than stacked. */
    for (let i = 0; i < n; i++) {
      g.add(part(ing(), mat, `ingot-${i}`, {
        pos: [(rand() - 0.5) * 0.5 * s, H / 2, (rand() - 0.5) * 0.4 * s],
        rot: [0, rand() * T, 0],
      }));
    }
  } else {
    /* Course-laid: alternate rows rotate 90°, which is how metal is actually
       stacked so it does not topple. */
    const perRow = [1, 2, 3, 4][A.stack];
    let placed = 0, row = 0;
    while (placed < n) {
      const cross = row % 2 === 1;
      for (let i = 0; i < perRow && placed < n; i++, placed++) {
        const off = (i - (perRow - 1) / 2) * (cross ? D * 1.15 : W * 1.06);
        g.add(part(ing(), mat, `ingot-${placed}`, {
          pos: [cross ? 0 : off, H / 2 + row * H * 1.02, cross ? off : 0],
          rot: [0, cross ? Math.PI / 2 : 0, A.tilt === 1 ? (rand() - 0.5) * 0.05 : 0],
        }));
      }
      row++;
    }
  }

  if (A.mark > 0) {
    /* `royal_seal_press` is declared in Cinderward's kit — a stamped ingot is
       an economy fact, not decoration. */
    for (let i = 0; i < cnt(A.mark); i++) {
      g.add(part(cyl(W * 0.11, W * 0.11, 0.005 * s, sg(8)), CRAFT.soot, `royal-stamp-${i}`,
        { pos: [(rand() - 0.5) * W * 0.5, H * (n > 1 ? 1.02 : 1) * Math.max(1, Math.ceil(n / 3)) - 0.002, (rand() - 0.5) * D * 0.4] }));
    }
  }
  return seat(g);
}

/* ------------------------------------------------------------- ore chunk
   GATHER_NODES yields ember_iron, and ITEM_REGISTRY carries ore with no
   geometry. Five minerals because the regions demand different ones. */

export const ORE_AXES = { form: 4, count: 3, mineral: 5, vein: 3, scale: 3, moss: 2 };
export function oreChunk(variant = 0) {
  const A = axesOf(variant, ORE_AXES);
  const rand = rnd(0x02e0 + variant * 2861);
  const g = new THREE.Group();
  g.name = 'ore-chunk';

  const s = [0.7, 1, 1.5][A.scale];
  const veinMat = [CRAFT.emberIron, CRAFT.brass, CRAFT.tonicPale, CRAFT.copper, CRAFT.molten][A.mineral];
  const n = cnt([1, 2, 4][A.count]);

  for (let i = 0; i < n; i++) {
    const r = (0.1 + rand() * 0.07) * s / (n > 2 ? 1.5 : 1);
    const rock = ico(r, A.form === 0 ? 0 : 1);
    jitter(rock, r * (A.form === 3 ? 0.42 : 0.26), rand);
    if (A.form === 2) squash(rock, 1.3, 0.6, 1.1);
    const px = n === 1 ? 0 : (rand() - 0.5) * 0.34 * s;
    const pz = n === 1 ? 0 : (rand() - 0.5) * 0.3 * s;
    g.add(part(rock, CRAFT.oreRock, `host-rock-${i}`, { pos: [px, r * 0.82, pz], rot: [rand() * T, rand() * T, rand() * T] }));

    /* The vein is the whole point — an ore chunk without visible mineral is
       a rock. Nodules sit proud of the host so they catch a rim light. */
    if (A.vein > 0) {
      const vn = cnt(A.vein === 1 ? 2 : 5);
      for (let k = 0; k < vn; k++) {
        const a = rand() * T, e = rand() * Math.PI;
        const vr = r * (0.16 + rand() * 0.14);
        g.add(part(ico(vr, 0), veinMat, `vein-${i}-${k}`, {
          pos: [px + Math.sin(e) * Math.cos(a) * r * 0.86, r * 0.82 + Math.cos(e) * r * 0.8, pz + Math.sin(e) * Math.sin(a) * r * 0.86],
          rot: [rand() * T, rand() * T, 0],
        }));
      }
    }
    if (A.moss === 1) {
      g.add(part(squash(ico(r * 0.4, 0), 1.4, 0.3, 1.2), CRAFT.tonicGreen, `ore-moss-${i}`,
        { pos: [px + (rand() - 0.5) * r, r * 1.4, pz + (rand() - 0.5) * r] }));
    }
  }
  return seat(g);
}

export const CRAFT_GENERATORS = [
  { id: 'craft.anvil', name: 'Anvil', axes: ANVIL_AXES, build: anvil, domain: 'world', budgetClass: 'standard' },
  { id: 'craft.forge', name: 'Forge station', axes: FORGE_AXES, build: forgeStation, domain: 'world', budgetClass: 'hero' },
  { id: 'craft.alembic', name: 'Alembic still', axes: ALEMBIC_AXES, build: alembic, domain: 'world', budgetClass: 'standard' },
  { id: 'craft.grindstone', name: 'Grindstone', axes: GRIND_AXES, build: grindstone, domain: 'world', budgetClass: 'standard' },
  { id: 'craft.tool', name: 'Hand tool', axes: TOOL_AXES, build: handTool, domain: 'items', budgetClass: 'minor' },
  { id: 'craft.flask', name: 'Flask', axes: FLASK_AXES, build: flask, domain: 'items', budgetClass: 'minor' },
  { id: 'craft.ingot', name: 'Ingot stack', axes: INGOT_AXES, build: ingotStack, domain: 'items', budgetClass: 'minor' },
  { id: 'craft.ore', name: 'Ore chunk', axes: ORE_AXES, build: oreChunk, domain: 'items', budgetClass: 'minor' },
];
