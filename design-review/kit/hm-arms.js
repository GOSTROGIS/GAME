/* Arms and armour families — parametric.
 *
 * Built as WORLD PROPS: racked, dropped, wall-mounted, carried by a statue.
 * They deliberately do not solve the equipment problem — worn armour needs
 * attachment sockets and a paper-doll skeleton, and neither exists in this
 * kit. That gap is real and stays named in GAP-ANALYSIS-100K.md rather than
 * being papered over by shipping a helmet that cannot be worn.
 *
 * Grounded in the world's own arsenal. world.js arms Hearthmere's watch with
 * polearms and a repainted shield; Torren Vale fights with a bell clapper on
 * a haft; Cinderward is a foundry, so geared crossbows and respirators belong
 * to it. Nothing here is a generic fantasy sword rack.
 */
import { THREE, MAT, rnd, jitter, lean, part, lathe, limb, torus, cone, cyl, ico, seat } from './hm-core.js';
import { STEAM, axesOf } from './hm-steam.js';

const box = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);
const T = Math.PI * 2;

/* Steel is rough, not chrome. Metalness caps at 0.2 for the same reason it
   does in hm-steam.js: with no environment map, high metalness reads as wet
   plastic. Edge highlights come from a brighter base colour on the bevel. */
const M = (name, color, rough, metal = 0.16) => {
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: rough, metalness: metal });
  m.name = name;
  return m;
};
export const ARMS = {
  steel: M('forged-steel', '#6a7176', 0.52),
  steelWorn: M('steel-worn', '#565d61', 0.68),
  edge: M('honed-edge', '#8e979b', 0.36),
  blackened: M('blackened-steel', '#2c3134', 0.66),
  bronze: M('bell-bronze', '#8a6c3c', 0.5),
  brass: M('brass-fitting', '#a8813d', 0.48),
  leather: M('boiled-leather', '#3d2f26', 0.9, 0.01),
  leatherPale: M('rawhide', '#6b5b46', 0.92, 0.01),
  wood: M('ash-haft', '#4a3f30', 0.88, 0.01),
  woodDark: M('oak-stock', '#2f2721', 0.86, 0.01),
  cloth: M('wrapped-cloth', '#5b4a41', 0.95, 0),
  rust: M('rust-bloom', '#6b4227', 0.92, 0.02),
  glass: M('lens-glass', '#6f8f9b', 0.2, 0.02),
};

/* A blade: tapered, with a bevel inset so the edge catches light separately
   from the flat. Two boxes instead of one is the whole trick. */
function bladeBody(len, w, thick, taper, mat, edgeMat, rand, g, name, y0) {
  const b = box(w, len, thick, 1, 5, 1);
  const p = b.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = (p.getY(i) + len / 2) / len;
    p.setX(i, p.getX(i) * (1 - t * taper));
    p.setZ(i, p.getZ(i) * (1 - t * taper * 0.6));
  }
  p.needsUpdate = true;
  b.computeVertexNormals();
  g.add(part(b, mat, name + '-flat', { pos: [0, y0 + len / 2, 0] }));
  const e = box(w * 1.04, len * 0.98, thick * 0.42, 1, 5, 1);
  const ep = e.attributes.position;
  for (let i = 0; i < ep.count; i++) {
    const t = (ep.getY(i) + len * 0.49) / (len * 0.98);
    ep.setX(i, ep.getX(i) * (1 - t * taper));
  }
  ep.needsUpdate = true;
  e.computeVertexNormals();
  g.add(part(e, edgeMat, name + '-bevel', { pos: [0, y0 + len / 2, 0] }));
}

/* ------------------------------------------------------------------ BLADE */
export const BLADE_AXES = { form: 6, blade: 4, guard: 4, grip: 3, pommel: 3, wear: 3, length: 3 };
export function bladeWeapon(variant = 0) {
  const A = axesOf(variant, BLADE_AXES);
  const rand = rnd(0xb1a + variant * 7919);
  const g = new THREE.Group();
  const forms = ['sword', 'falchion', 'dagger', 'greatsword', 'spear', 'glaive'];
  const form = forms[A.form];
  g.name = 'blade-' + form;

  const baseLen = { sword: 0.82, falchion: 0.68, dagger: 0.26, greatsword: 1.25, spear: 0.32, glaive: 0.46 }[form];
  const L = baseLen * [0.85, 1, 1.18][A.length];
  const w = { sword: 0.05, falchion: 0.075, dagger: 0.035, greatsword: 0.062, spear: 0.045, glaive: 0.07 }[form];
  const steel = A.wear === 0 ? ARMS.steel : A.wear === 1 ? ARMS.steelWorn : ARMS.blackened;
  const edge = A.wear === 2 ? ARMS.steelWorn : ARMS.edge;
  const gripMat = [ARMS.leather, ARMS.cloth, ARMS.leatherPale][A.grip];
  const fitting = [ARMS.steel, ARMS.brass, ARMS.bronze, ARMS.blackened][A.guard];

  // Polearms are a head on a shaft; the rest are a blade on a hilt.
  const haftLen = form === 'spear' ? 2.0 : form === 'glaive' ? 1.9 : 0;
  if (haftLen) {
    g.add(part(jitter(limb(0.019, 0.025, haftLen, 8, 3), 0.004, rand), ARMS.wood, 'haft', { pos: [0, haftLen / 2, 0] }));
    for (let i = 0; i < 3; i++) g.add(part(torus(0.024, 0.005, 4, 10), fitting, 'haft-ring-' + i, { pos: [0, haftLen * (0.2 + i * 0.28), 0], rot: [Math.PI / 2, 0, 0] }));
    g.add(part(lathe([[0.026, 0], [0.03, 0.02], [0.022, 0.07], [0.024, 0.09]], 12), fitting, 'socket', { pos: [0, haftLen, 0] }));
    bladeBody(L, w, 0.014, form === 'spear' ? 0.9 : 0.55, steel, edge, rand, g, 'head', haftLen + 0.08);
    if (form === 'glaive') {
      // The back hook — what makes a glaive a glaive.
      g.add(part(torus(0.07, 0.011, 4, 9, Math.PI * 0.8), steel, 'back-hook', { pos: [-0.05, haftLen + L * 0.5, 0], rot: [Math.PI / 2, 0, 2.4] }));
    }
    [-1, 1].forEach((s, i) => g.add(part(box(0.01, 0.18, 0.022), fitting, 'langet-' + i, { pos: [s * 0.022, haftLen - 0.06, 0] })));
    g.add(part(lathe([[0.025, 0], [0.028, 0.012], [0.018, 0.03]], 10), fitting, 'butt-cap', { pos: [0, -0.015, 0] }));
    return seat(g);
  }

  const gripLen = form === 'greatsword' ? 0.34 : form === 'dagger' ? 0.1 : 0.15;
  // Grip, wrapped and bound.
  g.add(part(limb(0.019, 0.022, gripLen, 10, 1), gripMat, 'grip', { pos: [0, gripLen / 2 + 0.02, 0], scale: [1, 1, 0.8] }));
  const binds = form === 'greatsword' ? 6 : 3;
  for (let i = 0; i < binds; i++) g.add(part(torus(0.022, 0.0035, 4, 10), gripMat, 'bind-' + i, { pos: [0, 0.04 + (gripLen / binds) * i, 0], rot: [Math.PI / 2, 0, 0], scale: [1, 0.8, 1] }));

  // Guard: cross, disc, quillon-and-ring, or a knuckle bow.
  const gy = gripLen + 0.03;
  if (A.guard === 0) {
    g.add(part(jitter(box(w * 4.6, 0.024, 0.03), 0.002, rand), fitting, 'crossguard', { pos: [0, gy, 0] }));
  } else if (A.guard === 1) {
    g.add(part(lathe([[0, 0], [w * 2.4, 0.008], [w * 2.5, 0.02], [w * 1.2, 0.026], [0, 0.028]], 16), fitting, 'disc-guard', { pos: [0, gy - 0.012, 0] }));
  } else if (A.guard === 2) {
    g.add(part(jitter(box(w * 4.2, 0.022, 0.028), 0.002, rand), fitting, 'quillons', { pos: [0, gy, 0] }));
    g.add(part(torus(0.038, 0.008, 4, 12), fitting, 'side-ring', { pos: [0, gy + 0.03, 0.03], rot: [0.4, 0, 0] }));
  } else {
    g.add(part(jitter(box(w * 3.8, 0.022, 0.026), 0.002, rand), fitting, 'crossguard', { pos: [0, gy, 0] }));
    g.add(part(torus(0.055, 0.008, 4, 12, Math.PI * 1.1), fitting, 'knuckle-bow', { pos: [w * 1.6, gy - 0.05, 0], rot: [Math.PI / 2, 0, 1.2] }));
  }
  // Pommel.
  const pommels = [
    [[0.014, 0], [0.026, 0.012], [0.024, 0.03], [0.012, 0.038]],
    [[0.012, 0], [0.03, 0.018], [0.012, 0.036]],
    [[0.016, 0], [0.022, 0.008], [0.02, 0.028], [0.028, 0.034], [0.014, 0.042]],
  ];
  g.add(part(lathe(pommels[A.pommel], 12), fitting, 'pommel', { pos: [0, 0, 0], rot: [Math.PI, 0, 0] }));

  bladeBody(L, w, 0.012, form === 'falchion' ? 0.15 : 0.6, steel, edge, rand, g, 'blade', gy + 0.02);
  // Fuller or ricasso.
  if (A.blade >= 2) g.add(part(box(w * 0.42, L * 0.72, 0.016), steel, 'fuller', { pos: [0, gy + 0.02 + L * 0.4, 0] }));
  if (A.blade === 3 && form === 'greatsword') {
    [-1, 1].forEach((s, i) => g.add(part(box(0.012, 0.05, 0.03), fitting, 'parry-hook-' + i, { pos: [s * w * 1.3, gy + L * 0.22, 0] })));
  }
  // Wear: notches and rust bloom.
  if (A.wear === 2) {
    for (let i = 0; i < 4; i++) {
      const n = ico(0.008 + rand() * 0.006, 0);
      g.add(part(n, ARMS.rust, 'notch-' + i, { pos: [w * 0.5, gy + 0.05 + rand() * L * 0.85, 0] }));
    }
  }
  return seat(g);
}

/* ----------------------------------------------------------------- HAFTED */
export const HAFTED_AXES = { form: 5, head: 4, haft: 3, langet: 3, wear: 3, length: 3 };
export function haftedWeapon(variant = 0) {
  const A = axesOf(variant, HAFTED_AXES);
  const rand = rnd(0xba7 + variant * 6151);
  const g = new THREE.Group();
  const forms = ['mace', 'warhammer', 'axe', 'flail', 'clapper-mace'];
  const form = forms[A.form];
  g.name = 'hafted-' + form;
  const L = [0.7, 0.95, 1.4][A.length] * (form === 'axe' ? 1.15 : 1);
  const steel = A.wear === 0 ? ARMS.steel : A.wear === 1 ? ARMS.steelWorn : ARMS.blackened;
  const haftMat = [ARMS.wood, ARMS.woodDark, ARMS.leather][A.haft];
  const fitting = form === 'clapper-mace' ? ARMS.bronze : ARMS.steel;

  const haft = limb(0.017, 0.024, L, 9, 3);
  jitter(haft, 0.003, rand);
  g.add(part(haft, haftMat, 'haft', { pos: [0, L / 2, 0], scale: [1, 1, 0.86] }));
  g.add(part(limb(0.023, 0.025, L * 0.3, 9, 1), ARMS.leather, 'grip-wrap', { pos: [0, L * 0.16, 0], scale: [1, 1, 0.86] }));
  for (let i = 0; i < 3; i++) g.add(part(torus(0.025, 0.004, 4, 10), ARMS.leather, 'bind-' + i, { pos: [0, L * (0.05 + i * 0.1), 0], rot: [Math.PI / 2, 0, 0], scale: [1, 0.86, 1] }));

  const hy = L + 0.02;
  if (form === 'mace') {
    g.add(part(lathe([[0.02, 0], [0.05, 0.02], [0.056, 0.07], [0.04, 0.11], [0.018, 0.13]], 14), steel, 'mace-head', { pos: [0, hy, 0] }));
    const flanges = 4 + A.head;
    for (let i = 0; i < flanges; i++) {
      const a = (i / flanges) * T;
      g.add(part(box(0.018, 0.1, 0.05), steel, 'flange-' + i, { pos: [Math.cos(a) * 0.05, hy + 0.06, Math.sin(a) * 0.05], rot: [0, -a, 0] }));
    }
  } else if (form === 'warhammer') {
    g.add(part(jitter(box(0.075, 0.06, 0.06), 0.003, rand), steel, 'hammer-face', { pos: [0.035, hy + 0.04, 0] }));
    g.add(part(cone(0.026, 0.11, 4, 1), steel, 'hammer-spike', { pos: [-0.06, hy + 0.04, 0], rot: [0, 0, 1.57] }));
    g.add(part(box(0.04, 0.05, 0.05), fitting, 'hammer-collar', { pos: [0, hy + 0.04, 0] }));
  } else if (form === 'axe') {
    // Bearded axe head: a swept crescent, not a wedge.
    const bl = box(0.13, 0.2, 0.014, 2, 3, 1);
    const p = bl.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = (p.getY(i) + 0.1) / 0.2;
      p.setX(i, p.getX(i) + (p.getX(i) > 0 ? Math.sin(t * Math.PI) * 0.05 : 0));
    }
    p.needsUpdate = true;
    bl.computeVertexNormals();
    g.add(part(bl, steel, 'axe-blade', { pos: [0.08, hy + 0.06, 0] }));
    g.add(part(limb(0.028, 0.03, 0.12, 10, 1), fitting, 'axe-eye', { pos: [0, hy + 0.05, 0] }));
    if (A.head >= 2) g.add(part(cone(0.02, 0.08, 4, 1), steel, 'axe-spike', { pos: [-0.045, hy + 0.05, 0], rot: [0, 0, 1.57] }));
  } else if (form === 'flail') {
    const links = 4 + A.head;
    for (let i = 0; i < links; i++) g.add(part(torus(0.018, 0.005, 5, 10), steel, 'chain-' + i, { pos: [0, hy + i * 0.028, 0], rot: [Math.PI / 2, (i % 2) * (Math.PI / 2), 0] }));
    const ball = ico(0.055, 1);
    jitter(ball, 0.006, rand);
    g.add(part(ball, steel, 'flail-head', { pos: [0, hy + links * 0.028 + 0.06, 0] }));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * T;
      g.add(part(cone(0.011, 0.035, 4, 1), steel, 'flail-spike-' + i, { pos: [Math.cos(a) * 0.05, hy + links * 0.028 + 0.06, Math.sin(a) * 0.05], rot: [Math.sin(a) * 1.57, 0, -Math.cos(a) * 1.57] }));
    }
  } else {
    // Torren Vale's weapon: a bell clapper collared onto a haft.
    g.add(part(limb(0.02, 0.026, 0.14, 10, 1), ARMS.bronze, 'clapper-shank', { pos: [0, hy + 0.07, 0] }));
    const ball = ico(0.06, 2);
    const bp = ball.attributes.position;
    for (let i = 0; i < bp.count; i++) if (bp.getX(i) > 0.04) bp.setX(i, 0.04); // strike face wears flat
    bp.needsUpdate = true;
    ball.computeVertexNormals();
    g.add(part(ball, ARMS.bronze, 'clapper-ball', { pos: [0, hy + 0.2, 0] }));
    g.add(part(lathe([[0.022, 0], [0.03, 0.02], [0.026, 0.06], [0.014, 0.085], [0, 0.09]], 14), ARMS.bronze, 'clapper-flight', { pos: [0, hy + 0.26, 0] }));
  }
  // Langets and butt.
  if (A.langet > 0) {
    const n = A.langet === 1 ? 2 : 4;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * T;
      g.add(part(box(0.01, 0.16, 0.024), fitting, 'langet-' + i, { pos: [Math.cos(a) * 0.024, L - 0.08, Math.sin(a) * 0.024], rot: [0, -a, 0] }));
    }
  }
  g.add(part(lathe([[0.026, 0], [0.03, 0.012], [0.02, 0.03]], 12), fitting, 'butt-cap', { pos: [0, -0.012, 0] }));
  if (A.wear === 2) for (let i = 0; i < 5; i++) g.add(part(ico(0.009, 0), ARMS.rust, 'rust-' + i, { pos: [(rand() - 0.5) * 0.06, hy + rand() * 0.2, (rand() - 0.5) * 0.06] }));
  return seat(g);
}

/* ----------------------------------------------------------------- RANGED */
export const RANGED_AXES = { form: 4, limbs: 3, stock: 3, string: 2, sight: 3, wear: 3 };
export function rangedWeapon(variant = 0) {
  const A = axesOf(variant, RANGED_AXES);
  const rand = rnd(0x2a9 + variant * 4409);
  const g = new THREE.Group();
  const forms = ['bow', 'crossbow', 'geared-crossbow', 'sling-staff'];
  const form = forms[A.form];
  g.name = 'ranged-' + form;
  const wood = [ARMS.wood, ARMS.woodDark, ARMS.leatherPale][A.stock];
  const steel = A.wear === 2 ? ARMS.blackened : ARMS.steel;
  const cord = new THREE.MeshStandardMaterial({ color: new THREE.Color('#8d8674'), roughness: 0.94, metalness: 0 });
  cord.name = 'bow-string';

  if (form === 'bow') {
    const H = [1.2, 1.6, 2.0][A.limbs];
    // Recurved limbs: two arcs, mirrored, so the profile is not a plain bend.
    [-1, 1].forEach((s, i) => {
      const seg = 7;
      for (let k = 0; k < seg; k++) {
        const t = k / seg;
        const bend = Math.sin(t * Math.PI * 0.8) * H * 0.13;
        const recurve = t > 0.8 ? -(t - 0.8) * H * 0.3 : 0;
        g.add(part(limb(0.011, 0.016, (H / 2 / seg) * 1.2, 6, 1), wood, 'limb-' + i + '-' + k, {
          pos: [bend + recurve, H / 2 + s * (t * H * 0.5), 0], rot: [0, 0, s * (0.1 + t * 0.4)],
        }));
      }
    });
    g.add(part(limb(0.019, 0.022, H * 0.2, 8, 1), ARMS.leather, 'bow-grip', { pos: [0, H / 2, 0] }));
    g.add(part(limb(0.004, 0.004, H * 0.94, 4, 1), cord, 'string', { pos: [-H * 0.06, H / 2, 0] }));
    if (A.sight > 0) g.add(part(box(0.02, 0.05, 0.012), steel, 'arrow-rest', { pos: [0.02, H * 0.56, 0] }));
  } else if (form === 'sling-staff') {
    const H = [1.3, 1.7, 2.1][A.limbs];
    g.add(part(jitter(limb(0.018, 0.026, H, 8, 3), 0.004, rand), wood, 'staff', { pos: [0, H / 2, 0] }));
    g.add(part(limb(0.004, 0.004, 0.5, 4, 1), cord, 'sling-cord-a', { pos: [0.06, H - 0.2, 0], rot: [0, 0, 0.4] }));
    g.add(part(limb(0.004, 0.004, 0.5, 4, 1), cord, 'sling-cord-b', { pos: [0.14, H - 0.36, 0], rot: [0, 0, 0.9] }));
    const pouch = ico(0.035, 0);
    pouch.scale(1.5, 0.5, 1.1);
    g.add(part(pouch, ARMS.leather, 'sling-pouch', { pos: [0.22, H - 0.52, 0] }));
  } else {
    const stockLen = [0.6, 0.78, 0.95][A.limbs];
    const st = box(0.055, stockLen, 0.07, 1, 4, 1);
    jitter(st, 0.004, rand);
    g.add(part(st, wood, 'stock', { pos: [0, 0.1, stockLen / 2 - 0.1], rot: [1.57, 0, 0] }));
    g.add(part(box(0.05, 0.14, 0.09), wood, 'butt', { pos: [0, 0.1, -0.08], rot: [0.3, 0, 0] }));
    // Prod.
    [-1, 1].forEach((s, i) => {
      for (let k = 0; k < 5; k++) {
        const t = k / 5;
        g.add(part(limb(0.008, 0.013, 0.11, 5, 1), steel, 'prod-' + i + '-' + k, {
          pos: [s * (t * 0.3 + 0.05), 0.13 - t * t * 0.05, stockLen * 0.82], rot: [0, 0, s * (1.4 + t * 0.3)],
        }));
      }
    });
    g.add(part(limb(0.003, 0.003, 0.62, 4, 1), cord, 'string', { pos: [0, 0.11, stockLen * 0.78], rot: [0, 0, 1.57] }));
    g.add(part(box(0.03, 0.09, 0.02), steel, 'trigger', { pos: [0, 0.05, stockLen * 0.28], rot: [0.3, 0, 0] }));
    g.add(part(box(0.04, 0.03, 0.09), steel, 'nut-housing', { pos: [0, 0.15, stockLen * 0.4] }));
    if (form === 'geared-crossbow') {
      // A Cinderward windlass: gears, crank and pawl.
      g.add(part(lathe([[0.02, 0], [0.07, 0.006], [0.075, 0.016], [0.02, 0.022]], 16), ARMS.brass, 'cog-large', { pos: [0.05, 0.16, stockLen * 0.2], rot: [0, 0, 1.57] }));
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * T;
        g.add(part(box(0.014, 0.016, 0.016), ARMS.brass, 'cog-tooth-' + i, { pos: [0.05, 0.16 + Math.cos(a) * 0.078, stockLen * 0.2 + Math.sin(a) * 0.078] }));
      }
      g.add(part(lathe([[0.014, 0], [0.036, 0.005], [0.038, 0.014], [0.014, 0.019]], 14), ARMS.brass, 'cog-small', { pos: [-0.05, 0.13, stockLen * 0.3], rot: [0, 0, 1.57] }));
      g.add(part(limb(0.007, 0.007, 0.11, 5, 1), steel, 'crank-arm', { pos: [0.09, 0.22, stockLen * 0.2], rot: [0, 0, 0.7] }));
      g.add(part(ico(0.016, 0), ARMS.wood, 'crank-knob', { pos: [0.13, 0.28, stockLen * 0.2] }));
      g.add(part(box(0.01, 0.05, 0.012), steel, 'pawl', { pos: [0.03, 0.22, stockLen * 0.24], rot: [0, 0, 0.5] }));
    }
    if (A.sight === 2) g.add(part(box(0.012, 0.04, 0.012), steel, 'fore-sight', { pos: [0, 0.19, stockLen * 0.7] }));
  }
  return seat(g);
}

/* ----------------------------------------------------------------- SHIELD */
export const SHIELD_AXES = { form: 5, size: 3, boss: 3, facing: 4, damage: 3 };
export function shield(variant = 0) {
  const A = axesOf(variant, SHIELD_AXES);
  const rand = rnd(0x511 + variant * 3313);
  const g = new THREE.Group();
  const forms = ['round', 'kite', 'heater', 'buckler', 'door-plank'];
  const form = forms[A.form];
  g.name = 'shield-' + form;
  const R = [0.26, 0.38, 0.52][A.size] * (form === 'buckler' ? 0.6 : 1);
  const face = [MAT.weatheredTimber, ARMS.woodDark, ARMS.leather, STEAM.sootIron][A.facing];

  if (form === 'round' || form === 'buckler') {
    g.add(part(lathe([[0, 0], [R * 0.5, 0.014], [R * 0.86, 0.036], [R, 0.056], [R * 0.99, 0.07], [R * 0.8, 0.062], [R * 0.4, 0.05], [0, 0.044]], 20), face, 'face', { pos: [0, R, 0], rot: [1.5, 0, 0] }));
    g.add(part(torus(R, 0.018, 4, 20), ARMS.steel, 'rim', { pos: [0, R, 0.03], rot: [0.07, 0, 0] }));
  } else if (form === 'door-plank') {
    for (let i = 0; i < 5; i++) {
      const p = box(R * 0.42, R * 2.2, 0.05, 1, 4, 1);
      jitter(p, 0.006, rand);
      g.add(part(p, face, 'plank-' + i, { pos: [-R + (R * 2 / 5) * (i + 0.5), R * 1.1, 0] }));
    }
    [-1, 1].forEach((s, i) => g.add(part(box(R * 2, 0.07, 0.02), ARMS.steel, 'band-' + i, { pos: [0, R * (1.1 + s * 0.6), 0.035] })));
  } else {
    // Kite and heater: a tapered, curved plate.
    const h = form === 'kite' ? R * 2.6 : R * 2.0;
    const pl = box(R * 2, h, 0.05, 4, 6, 1);
    const p = pl.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = (p.getY(i) + h / 2) / h;
      const taper = form === 'kite' ? Math.pow(t, 1.6) : Math.pow(t, 2.6);
      p.setX(i, p.getX(i) * (1 - taper * 0.95));
      p.setZ(i, p.getZ(i) - Math.cos((p.getX(i) / R) * 1.3) * 0.05);
    }
    p.needsUpdate = true;
    pl.computeVertexNormals();
    g.add(part(pl, face, 'face', { pos: [0, h / 2, 0] }));
  }
  // Boss and grip.
  if (A.boss > 0) {
    g.add(part(lathe([[0, 0], [R * 0.22, 0.02], [R * 0.26, 0.05], [R * 0.14, 0.075], [0, 0.08]], 16), ARMS.steel, 'boss', { pos: [0, R * (form === 'round' || form === 'buckler' ? 1 : 1.1), 0.05] }));
    if (A.boss === 2) for (let i = 0; i < 6; i++) {
      const a = (i / 6) * T;
      g.add(part(ico(0.016, 0), ARMS.steel, 'boss-rivet-' + i, { pos: [Math.cos(a) * R * 0.45, R + Math.sin(a) * R * 0.45, 0.04] }));
    }
  }
  g.add(part(box(R * 0.9, 0.05, 0.03), ARMS.leather, 'grip-strap', { pos: [0, R, -0.06] }));
  // Damage: a split, or a repainted facing over an older one.
  if (A.damage === 1) {
    g.add(part(box(0.02, R * 1.4, 0.06), ARMS.woodDark, 'split', { pos: [R * 0.3, R, 0.02], rot: [0, 0, 0.2] }));
  } else if (A.damage === 2) {
    for (let i = 0; i < 4; i++) g.add(part(ico(R * 0.1, 0), ARMS.rust, 'gouge-' + i, { pos: [(rand() - 0.5) * R, R + (rand() - 0.5) * R, 0.045] }));
  }
  return seat(g);
}

/* ------------------------------------------------------------------- HELM */
export const HELM_AXES = { form: 6, visor: 3, crest: 4, material: 3, damage: 2 };
export function helm(variant = 0) {
  const A = axesOf(variant, HELM_AXES);
  const rand = rnd(0x4e1 + variant * 2711);
  const g = new THREE.Group();
  const forms = ['kettle', 'sallet', 'great-helm', 'coif', 'respirator-helm', 'bell-helm'];
  const form = forms[A.form];
  g.name = 'helm-' + form;
  const steel = [ARMS.steel, ARMS.steelWorn, ARMS.blackened][A.material];
  const R = 0.115;

  const skulls = {
    kettle: [[0, 0], [R, 0.02], [R * 0.98, 0.09], [R * 0.7, 0.16], [R * 0.3, 0.2], [0, 0.21]],
    sallet: [[0, 0], [R * 0.95, 0.03], [R * 0.9, 0.11], [R * 0.62, 0.18], [R * 0.24, 0.22], [0, 0.225]],
    'great-helm': [[0, 0], [R * 0.98, 0.02], [R, 0.14], [R * 0.86, 0.22], [R * 0.4, 0.26], [0, 0.265]],
    coif: [[0, 0], [R * 0.92, 0.04], [R * 0.86, 0.13], [R * 0.55, 0.19], [0, 0.2]],
    'respirator-helm': [[0, 0], [R * 0.96, 0.03], [R * 0.92, 0.12], [R * 0.6, 0.19], [R * 0.2, 0.22], [0, 0.225]],
    'bell-helm': [[0, 0], [R * 1.05, 0.04], [R * 0.95, 0.13], [R * 0.5, 0.22], [R * 0.18, 0.26], [0, 0.27]],
  };
  g.add(part(lathe(skulls[form], 20), form === 'coif' ? ARMS.leather : steel, 'skull', { pos: [0, 0, 0] }));
  if (form === 'kettle') g.add(part(lathe([[R * 0.9, 0], [R * 1.5, 0.03], [R * 1.55, 0.05], [R * 0.95, 0.04]], 20), steel, 'brim', { pos: [0, 0.03, 0] }));
  if (form === 'bell-helm') g.add(part(torus(R * 0.88, 0.012, 4, 20), ARMS.bronze, 'bell-rib', { pos: [0, 0.1, 0], rot: [Math.PI / 2, 0, 0] }));

  // Visor / face.
  if (A.visor > 0 && form !== 'coif') {
    if (A.visor === 1) {
      g.add(part(box(R * 1.5, 0.055, 0.02), steel, 'nasal-bar', { pos: [0, 0.09, R * 0.82], rot: [0.2, 0, 0] }));
      g.add(part(box(0.024, 0.1, 0.02), steel, 'nasal', { pos: [0, 0.05, R * 0.88] }));
    } else {
      const v = lathe([[R * 0.4, 0], [R * 0.95, 0.04], [R * 0.9, 0.12], [R * 0.5, 0.16]], 16);
      g.add(part(v, steel, 'visor', { pos: [0, 0.02, R * 0.2], rot: [0.25, 0, 0] }));
      for (let i = 0; i < 3; i++) g.add(part(box(R * 1.2, 0.008, 0.03), ARMS.blackened, 'sight-slit-' + i, { pos: [0, 0.1 + i * 0.03, R * 0.8] }));
    }
  }
  if (form === 'respirator-helm') {
    g.add(part(lathe([[R * 0.34, 0], [R * 0.4, 0.03], [R * 0.3, 0.07], [R * 0.18, 0.08]], 14), STEAM.brass, 'filter-can', { pos: [0, 0.02, R * 0.9], rot: [1.3, 0, 0] }));
    g.add(part(limb(0.014, 0.014, 0.18, 6, 1), ARMS.leather, 'hose', { pos: [0.05, -0.04, R * 0.8], rot: [0.6, 0, 0.5] }));
    [-1, 1].forEach((s, i) => g.add(part(lathe([[0.03, 0], [0.034, 0.006], [0.028, 0.014]], 12), ARMS.glass, 'lens-' + i, { pos: [s * 0.045, 0.12, R * 0.86], rot: [1.3, 0, 0] })));
  }
  // Crest.
  if (A.crest === 1) {
    for (let i = 0; i < 9; i++) g.add(part(box(0.014, 0.05 - Math.abs(i - 4) * 0.006, 0.02), steel, 'comb-' + i, { pos: [0, 0.2 + (0.05 - Math.abs(i - 4) * 0.006) / 2, -R * 0.7 + i * (R * 1.5 / 8)] }));
  } else if (A.crest === 2) {
    g.add(part(lathe([[0.022, 0], [0.03, 0.02], [0.014, 0.05]], 12), ARMS.brass, 'plume-socket', { pos: [0, 0.2, -R * 0.3] }));
    for (let i = 0; i < 5; i++) g.add(part(box(0.01, 0.13, 0.006), ARMS.leatherPale, 'plume-' + i, { pos: [(i - 2) * 0.012, 0.28, -R * 0.3], rot: [0.2, 0, (i - 2) * 0.14] }));
  } else if (A.crest === 3) {
    g.add(part(lathe([[0.05, 0], [0.055, 0.012], [0.038, 0.04], [0.02, 0.055]], 14), ARMS.bronze, 'crown-boss', { pos: [0, 0.2, 0] }));
  }
  // Aventail or cheek plates.
  if (form === 'coif' || A.material === 2) {
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * T;
      g.add(part(box(0.028, 0.075, 0.014), form === 'coif' ? ARMS.steelWorn : steel, 'aventail-' + i, { pos: [Math.cos(a) * R * 0.9, -0.03, Math.sin(a) * R * 0.9], rot: [0, -a, 0] }));
    }
  }
  if (A.damage) for (let i = 0; i < 4; i++) g.add(part(ico(0.012, 0), ARMS.rust, 'dent-' + i, { pos: [(rand() - 0.5) * R * 1.4, rand() * 0.2, (rand() - 0.5) * R * 1.4] }));
  return seat(g);
}

/* ---------------------------------------------------------------- CUIRASS */
export const CUIRASS_AXES = { form: 5, plates: 3, strap: 3, material: 3, damage: 2 };
export function cuirass(variant = 0) {
  const A = axesOf(variant, CUIRASS_AXES);
  const rand = rnd(0xc1a + variant * 1871);
  const g = new THREE.Group();
  const forms = ['breastplate', 'brigandine', 'scale', 'lamellar', 'foundry-apron'];
  const form = forms[A.form];
  g.name = 'cuirass-' + form;
  const steel = [ARMS.steel, ARMS.steelWorn, ARMS.blackened][A.material];
  const W = 0.34, H = 0.5;

  if (form === 'breastplate' || form === 'foundry-apron') {
    const mat = form === 'foundry-apron' ? ARMS.leather : steel;
    const pl = box(W, H, 0.16, 4, 5, 2);
    const p = pl.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = (p.getY(i) + H / 2) / H;
      // Chest swell above, waist taper below, and a central keel.
      const swell = Math.sin(t * Math.PI * 0.9) * 0.05;
      p.setZ(i, p.getZ(i) + (p.getZ(i) > 0 ? swell + (1 - Math.abs(p.getX(i)) / (W / 2)) * 0.035 : 0));
      p.setX(i, p.getX(i) * (0.8 + t * 0.3));
    }
    p.needsUpdate = true;
    pl.computeVertexNormals();
    g.add(part(pl, mat, 'plate', { pos: [0, H / 2 + 0.1, 0] }));
    if (form === 'breastplate') {
      for (let i = 0; i < A.plates + 1; i++) {
        g.add(part(lathe([[W * 0.5, 0], [W * 0.54, 0.02], [W * 0.46, 0.05]], 16), steel, 'fauld-' + i, { pos: [0, 0.1 - i * 0.045, 0.02], rot: [Math.PI, 0, 0] }));
      }
    } else {
      g.add(part(box(W * 1.05, 0.05, 0.14), ARMS.leather, 'apron-hem', { pos: [0, 0.08, 0.02] }));
      g.add(part(lathe([[0.05, 0], [0.06, 0.02], [0.04, 0.05]], 12), STEAM.brass, 'apron-badge', { pos: [0, H * 0.7, 0.11], rot: [1.4, 0, 0] }));
    }
  } else {
    // Brigandine, scale and lamellar: rows of small plates on a backing.
    const backing = box(W, H, 0.14, 3, 4, 2);
    g.add(part(backing, ARMS.leather, 'backing', { pos: [0, H / 2 + 0.1, 0] }));
    const rows = 5 + A.plates * 2;
    const cols = form === 'scale' ? 8 : 5;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = -W / 2 + (W / cols) * (c + 0.5) + (form === 'scale' && r % 2 ? W / cols / 2 : 0);
      if (Math.abs(x) > W / 2 - 0.01) continue;
      const y = 0.12 + (H / rows) * (r + 0.5);
      const bulge = (1 - Math.abs(x) / (W / 2)) * 0.045;
      if (form === 'scale') {
        g.add(part(lathe([[0, 0], [W / cols * 0.45, 0.006], [W / cols * 0.4, 0.02], [0, 0.024]], 8), steel, 'scale-' + r + '-' + c, { pos: [x, y, 0.075 + bulge], rot: [1.2, 0, 0] }));
      } else {
        g.add(part(box((W / cols) * 0.88, (H / rows) * 0.86, 0.018), steel, 'plate-' + r + '-' + c, { pos: [x, y, 0.075 + bulge], rot: [0.06, 0, 0] }));
        g.add(part(ico(0.007, 0), ARMS.brass, 'rivet-' + r + '-' + c, { pos: [x, y, 0.088 + bulge] }));
      }
    }
  }
  // Straps and buckles.
  const straps = A.strap + 1;
  for (let i = 0; i < straps; i++) {
    [-1, 1].forEach((s, j) => {
      g.add(part(box(0.05, 0.032, 0.2), ARMS.leather, 'shoulder-strap-' + i + '-' + j, { pos: [s * W * 0.34, H + 0.09 - i * 0.05, 0], rot: [0, 0, s * 0.2] }));
    });
    if (i === 0) g.add(part(torus(0.022, 0.006, 4, 10), ARMS.brass, 'buckle-' + i, { pos: [W * 0.36, H + 0.06, 0.09], rot: [0, 1.4, 0] }));
  }
  if (A.damage) {
    for (let i = 0; i < 5; i++) g.add(part(ico(0.014, 0), ARMS.rust, 'dent-' + i, { pos: [(rand() - 0.5) * W, 0.15 + rand() * H, 0.1] }));
  }
  return seat(g);
}

export const ARMS_GENERATORS = [
  { id: 'arms.blade', name: 'Blade weapon', axes: BLADE_AXES, build: bladeWeapon, domain: 'items', budgetClass: 'minor' },
  { id: 'arms.hafted', name: 'Hafted weapon', axes: HAFTED_AXES, build: haftedWeapon, domain: 'items', budgetClass: 'minor' },
  { id: 'arms.ranged', name: 'Ranged weapon', axes: RANGED_AXES, build: rangedWeapon, domain: 'items', budgetClass: 'standard' },
  { id: 'arms.shield', name: 'Shield', axes: SHIELD_AXES, build: shield, domain: 'items', budgetClass: 'minor' },
  { id: 'arms.helm', name: 'Helm', axes: HELM_AXES, build: helm, domain: 'equipment', budgetClass: 'minor' },
  { id: 'arms.cuirass', name: 'Cuirass', axes: CUIRASS_AXES, build: cuirass, domain: 'equipment', budgetClass: 'standard' },
];
