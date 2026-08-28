/* Built environment and occult families — parametric.
 *
 * Doors, gates, windows, columns, walls, stairs, bridges, archways, statues,
 * sigils and altars. All absent before this file; the gap analysis rated
 * architecture second only to flora because doors and walls are what stop a
 * dungeon looking like one room repeated.
 *
 * The occult set is grounded, not decorative. world.js gives the Reach a
 * clergy that cut out their own tongues, a Gate of Exact Words, bells rung to
 * keep names rather than hours, and chalk wards someone scuffed through. The
 * symbology is bells, tongues, names and exact wording — never pentagrams.
 */
import { THREE, MAT, rnd, jitter, lean, part, lathe, limb, torus, cone, cyl, ico, seat, thin } from './hm-core.js';
import { STEAM } from './hm-steam.js';
import { axesOf } from './hm-steam.js';

const box = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);
const T = Math.PI * 2;

/* Planks with a bow and a jitter — the base unit of every timber leaf here. */
function plankSet(w, h, thick, n, mat, rand, name, g, ox = 0, oy = 0, oz = 0) {
  for (let i = 0; i < n; i++) {
    const p = box((w / n) * 0.94, h, thick, 1, 3, 1);
    jitter(p, thick * 0.14, rand);
    g.add(part(p, mat, name + '-plank-' + i, { pos: [ox - w / 2 + (w / n) * (i + 0.5), oy, oz] }));
  }
}

/* Voussoir ring — reused by arch, gate and bridge. */
function arch(r, n, depth, thick, mat, rand, name) {
  const g = new THREE.Group();
  g.name = name;
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * (i + 0.5)) / n;
    const w = ((Math.PI * r) / n) * 1.06;
    const v = box(w, thick, depth);
    jitter(v, thick * 0.08, rand);
    g.add(part(v, mat, name + '-v-' + i, { pos: [Math.cos(a) * (r + thick / 2), Math.sin(a) * (r + thick / 2), 0], rot: [0, 0, a - Math.PI / 2] }));
  }
  const ks = box(((Math.PI * r) / n) * 1.3, thick * 1.35, depth * 1.05);
  jitter(ks, thick * 0.06, rand);
  g.add(part(ks, mat, name + '-keystone', { pos: [0, r + thick * 0.68, 0] }));
  return g;
}

/* ------------------------------------------------------------------- DOOR */
export const DOOR_AXES = { form: 6, leaf: 3, frame: 4, furniture: 4, state: 3, material: 3 };
export function door(variant = 0) {
  const A = axesOf(variant, DOOR_AXES);
  const rand = rnd(0xd00 + variant * 7919);
  const g = new THREE.Group();
  const forms = ['plank', 'ledged', 'panelled', 'studded', 'grille', 'pressure'];
  const form = forms[A.form];
  g.name = 'door-' + form;
  const W = [0.95, 1.25, 1.6][A.leaf];
  const H = 2.1 + A.leaf * 0.22;
  const leaves = A.leaf === 2 ? 2 : 1;
  const wood = [MAT.darkOak, MAT.weatheredTimber, STEAM.firebrick][A.material];
  const iron = A.material === 2 ? STEAM.sootIron : MAT.pittedIron;
  const open = [0, 0.5, 1.35][A.state];

  // Frame: jambs, head, and optionally an arch or a pediment.
  const fw = W * leaves;
  [-1, 1].forEach((s, i) => {
    g.add(part(jitter(box(0.2, H + 0.2, 0.34, 1, 3, 1), 0.012, rand), MAT.slateDry, 'jamb-' + i, { pos: [s * (fw / 2 + 0.1), (H + 0.2) / 2, 0] }));
  });
  if (A.frame === 0) {
    g.add(part(jitter(box(fw + 0.6, 0.26, 0.4, 3, 1, 1), 0.014, rand), MAT.slateDry, 'lintel', { pos: [0, H + 0.23, 0] }));
  } else if (A.frame === 1) {
    const ar = arch(fw / 2, 11, 0.4, 0.26, MAT.slateDry, rand, 'door-arch');
    ar.position.y = H;
    g.add(ar);
  } else if (A.frame === 2) {
    g.add(part(jitter(box(fw + 0.7, 0.22, 0.44, 3, 1, 1), 0.012, rand), MAT.slateDry, 'lintel', { pos: [0, H + 0.21, 0] }));
    g.add(part(cone(fw * 0.62, 0.42, 4, 1), MAT.slateDry, 'pediment', { pos: [0, H + 0.53, 0], rot: [0, Math.PI / 4, 0] }));
  } else {
    g.add(part(jitter(box(fw + 0.5, 0.2, 0.36, 3, 1, 1), 0.012, rand), STEAM.sootIron, 'steel-head', { pos: [0, H + 0.2, 0] }));
    for (let i = 0; i < 6; i++) g.add(part(ico(0.026, 0), iron, 'head-bolt-' + i, { pos: [-fw / 2 + i * (fw / 5), H + 0.2, 0.19] }));
  }

  for (let L = 0; L < leaves; L++) {
    const dir = leaves === 2 ? (L ? 1 : -1) : 1;
    const hinge = new THREE.Group();
    hinge.name = 'leaf-' + L;
    hinge.position.set(dir * (fw / 2), 0, 0);
    hinge.rotation.y = -dir * open;
    const lw = W;

    if (form === 'grille') {
      for (let i = 0; i < 7; i++) g.add(part(limb(0.028, 0.028, H, 6, 1), iron, 'grille-bar-' + L + '-' + i, { pos: [dir * (fw / 2 - lw / 2) - lw / 2 + (lw / 6) * i, H / 2, 0] }));
      for (let i = 0; i < 3; i++) g.add(part(box(lw, 0.05, 0.05), iron, 'grille-rail-' + L + '-' + i, { pos: [dir * (fw / 2 - lw / 2), 0.3 + i * (H / 2.4), 0] }));
      continue;
    }
    if (form === 'pressure') {
      // A dungeon pressure door: dished plate, dogs around the rim, a wheel.
      hinge.add(part(lathe([[0, 0], [lw * 0.42, 0.05], [lw * 0.48, 0.12], [lw * 0.46, 0.16]], 18), STEAM.sootIron, 'dish', { pos: [-dir * lw / 2, H / 2, 0], rot: [Math.PI / 2, 0, 0] }));
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * T;
        hinge.add(part(box(0.12, 0.07, 0.07), iron, 'dog-' + i, { pos: [-dir * lw / 2 + Math.cos(a) * lw * 0.44, H / 2 + Math.sin(a) * lw * 0.44, 0.1], rot: [0, 0, a] }));
      }
      hinge.add(part(torus(lw * 0.2, 0.028, 5, 18), STEAM.brass, 'wheel', { pos: [-dir * lw / 2, H / 2, 0.16] }));
      for (let i = 0; i < 4; i++) hinge.add(part(box(lw * 0.4, 0.03, 0.03), STEAM.brass, 'wheel-spoke-' + i, { pos: [-dir * lw / 2, H / 2, 0.16], rot: [0, 0, (i / 4) * Math.PI] }));
      g.add(hinge);
      continue;
    }

    plankSet(lw, H, 0.075, form === 'plank' ? 4 : 5, wood, rand, 'leaf' + L, hinge, -dir * lw / 2, H / 2, 0);
    if (form === 'ledged') {
      [H * 0.24, H * 0.5, H * 0.76].forEach((y, i) => hinge.add(part(box(lw * 0.94, 0.11, 0.03), wood, 'ledge-' + L + '-' + i, { pos: [-dir * lw / 2, y, 0.05] })));
      hinge.add(part(box(lw * 0.9, 0.09, 0.025), wood, 'brace-' + L, { pos: [-dir * lw / 2, H / 2, 0.05], rot: [0, 0, 0.42] }));
    } else if (form === 'panelled') {
      for (let p = 0; p < 4; p++) {
        hinge.add(part(box(lw * 0.36, H * 0.2, 0.03), wood, 'panel-' + L + '-' + p, { pos: [-dir * lw / 2 + (p % 2 ? lw * 0.2 : -lw * 0.2), H * (0.28 + Math.floor(p / 2) * 0.36), 0.05] }));
      }
    } else if (form === 'studded') {
      for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
        hinge.add(part(ico(0.028, 0), iron, 'stud-' + L + '-' + r + '-' + c, { pos: [-dir * lw / 2 - lw * 0.32 + c * lw * 0.21, H * (0.16 + r * 0.17), 0.055] }));
      }
    }
    // Furniture: hinges always, then a ring, a lock plate, or a bar.
    [H * 0.24, H * 0.76].forEach((y, i) => {
      hinge.add(part(box(lw * 0.8, 0.085, 0.02), iron, 'strap-' + L + '-' + i, { pos: [-dir * lw * 0.42, y, 0.05] }));
    });
    if (A.furniture >= 1) hinge.add(part(torus(0.06, 0.014, 5, 12), iron, 'ring-pull-' + L, { pos: [-dir * lw * 0.86, H * 0.48, 0.07], rot: [0.4, 0, 0] }));
    if (A.furniture >= 2) hinge.add(part(box(0.15, 0.2, 0.03), iron, 'lock-plate-' + L, { pos: [-dir * lw * 0.84, H * 0.44, 0.055] }));
    if (A.furniture === 3) hinge.add(part(limb(0.045, 0.045, fw * 0.9, 8, 1), wood, 'draw-bar-' + L, { pos: [-dir * lw / 2, H * 0.4, 0.12], rot: [0, 0, Math.PI / 2] }));
    g.add(hinge);
  }
  return seat(g);
}

/* ------------------------------------------------------------------- GATE */
export const GATE_AXES = { form: 4, span: 3, tower: 4, portcullis: 3, state: 3, wear: 2 };
export function gate(variant = 0) {
  const A = axesOf(variant, GATE_AXES);
  const rand = rnd(0x9a7 + variant * 6151);
  const g = new THREE.Group();
  const forms = ['arched', 'lintelled', 'barbican', 'slag-gate'];
  g.name = 'gate-' + forms[A.form];
  const S = [3.2, 4.4, 6.0][A.span];
  const H = S * 1.15;
  const stone = forms[A.form] === 'slag-gate' ? STEAM.firebrick : MAT.wetSlate;

  [-1, 1].forEach((s, i) => {
    const pw = 1.4 + A.tower * 0.32;
    g.add(part(jitter(box(pw, H, 2.4, 2, 4, 2), 0.09, rand), stone, 'pier-' + i, { pos: [s * (S / 2 + pw / 2), H / 2, 0] }));
    if (A.tower >= 2) {
      g.add(part(jitter(box(pw + 0.4, 0.3, 2.8, 2, 1, 2), 0.05, rand), MAT.slateDry, 'pier-cornice-' + i, { pos: [s * (S / 2 + pw / 2), H + 0.15, 0] }));
      for (let m = 0; m < 3; m++) {
        if (A.wear && m === 1) continue;
        g.add(part(jitter(box(0.5, 0.7, 0.5), 0.04, rand), MAT.slateDry, 'merlon-' + i + '-' + m, { pos: [s * (S / 2 + pw / 2) + (m - 1) * 0.62, H + 0.65, 0.9] }));
      }
    }
  });
  if (forms[A.form] === 'arched' || forms[A.form] === 'barbican') {
    const ar = arch(S / 2, 13, 2.4, 0.55, MAT.slateDry, rand, 'gate-arch');
    ar.position.y = H * 0.5;
    g.add(ar);
  } else {
    g.add(part(jitter(box(S + 2.6, 0.6, 2.6, 4, 1, 2), 0.05, rand), MAT.slateDry, 'lintel', { pos: [0, H * 0.62, 0] }));
  }
  if (forms[A.form] === 'barbican') {
    g.add(part(jitter(box(S + 3, 0.4, 3.4, 4, 1, 2), 0.03, rand), MAT.weatheredTimber, 'hoarding-floor', { pos: [0, H * 0.78, 1.5] }));
    for (let i = 0; i < 8; i++) g.add(part(box(0.4, 1.7, 0.08), MAT.weatheredTimber, 'hoarding-plank-' + i, { pos: [-S / 2 + i * (S / 7), H * 0.78 + 0.85, 3.1] }));
  }
  // Portcullis: none, raised, or dropped.
  if (A.portcullis > 0) {
    const drop = A.portcullis === 1 ? H * 0.42 : 0;
    for (let i = 0; i < 7; i++) g.add(part(limb(0.05, 0.05, H * 0.5, 6, 1), STEAM.sootIron, 'pc-bar-' + i, { pos: [-S / 2 + 0.3 + i * ((S - 0.6) / 6), H * 0.25 + drop, -0.7] }));
    for (let i = 0; i < 3; i++) g.add(part(box(S - 0.4, 0.07, 0.07), STEAM.sootIron, 'pc-rail-' + i, { pos: [0, H * 0.08 + drop + i * H * 0.2, -0.7] }));
    for (let i = 0; i < 7; i++) g.add(part(cone(0.05, 0.18, 4, 1), STEAM.sootIron, 'pc-spike-' + i, { pos: [-S / 2 + 0.3 + i * ((S - 0.6) / 6), drop - 0.09, -0.7], rot: [Math.PI, 0, 0] }));
  }
  // Leaves.
  const open = [0, 0.55, 1.3][A.state];
  [-1, 1].forEach((s, i) => {
    const leaf = new THREE.Group();
    leaf.position.set(s * S / 2, 0, 0.6);
    leaf.rotation.y = -s * open;
    plankSet(S / 2 - 0.08, H * 0.5, 0.11, 5, MAT.darkOak, rand, 'gate-leaf-' + i, leaf, -s * (S / 4), H * 0.25, 0);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
      leaf.add(part(ico(0.038, 0), MAT.pittedIron, 'gate-stud-' + i + '-' + r + '-' + c, { pos: [-s * (S / 4) - S * 0.14 + c * S * 0.14, H * (0.08 + r * 0.11), 0.07] }));
    }
    g.add(leaf);
  });
  return seat(g);
}

/* ----------------------------------------------------------------- WINDOW */
export const WINDOW_AXES = { form: 5, size: 3, glazing: 4, shutter: 3, sill: 3 };
export function windowUnit(variant = 0) {
  const A = axesOf(variant, WINDOW_AXES);
  const rand = rnd(0x77d + variant * 4409);
  const g = new THREE.Group();
  const forms = ['square', 'lancet', 'round', 'mullioned', 'loop'];
  const form = forms[A.form];
  g.name = 'window-' + form;
  const W = [0.7, 1.1, 1.6][A.size];
  const H = form === 'loop' ? W * 2.4 : form === 'lancet' ? W * 2 : W * 1.3;

  // Reveal: four stones round the opening.
  [[0, H / 2 + 0.14, W + 0.28, 0.28], [0, -0.14, W + 0.28, 0.28]].forEach(([x, y, w, h], i) => {
    g.add(part(jitter(box(w, h, 0.42, 3, 1, 1), 0.02, rand), MAT.slateDry, 'reveal-h-' + i, { pos: [x, y + H / 2, 0] }));
  });
  [-1, 1].forEach((s, i) => {
    g.add(part(jitter(box(0.26, H, 0.42, 1, 2, 1), 0.02, rand), MAT.slateDry, 'reveal-v-' + i, { pos: [s * (W / 2 + 0.13), H / 2 + H / 2 - H / 2 + H / 2, 0] }));
  });
  if (form === 'lancet' || form === 'round') {
    const ar = arch(W / 2, 9, 0.42, 0.22, MAT.slateDry, rand, 'window-arch');
    ar.position.y = H;
    g.add(ar);
  }
  // Glazing: open, shutter-only, leaded quarries, or oiled cloth.
  if (A.glazing === 2) {
    const glass = new THREE.MeshStandardMaterial({ color: new THREE.Color('#6f8f9b'), roughness: 0.32, metalness: 0.02, transparent: true, opacity: 0.4 });
    glass.name = 'leaded-glass';
    const cols = form === 'mullioned' ? 4 : 3, rows = Math.round(H / (W / cols));
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      g.add(thin(part(new THREE.PlaneGeometry((W / cols) * 0.84, (H / rows) * 0.84), glass, 'quarry-' + c + '-' + r, { pos: [-W / 2 + (W / cols) * (c + 0.5), (H / rows) * (r + 0.5), 0.02] })));
    }
    for (let c = 1; c < cols; c++) g.add(part(box(0.02, H, 0.05), MAT.pittedIron, 'came-v-' + c, { pos: [-W / 2 + (W / cols) * c, H / 2, 0.02] }));
  } else if (A.glazing === 3) {
    const cloth = new THREE.MeshStandardMaterial({ color: new THREE.Color('#8d8674'), roughness: 0.95, metalness: 0, transparent: true, opacity: 0.72, side: THREE.DoubleSide });
    cloth.name = 'oiled-cloth';
    g.add(thin(part(new THREE.PlaneGeometry(W * 0.92, H * 0.94), cloth, 'oiled-pane', { pos: [0, H / 2, 0.02] })));
  }
  if (form === 'mullioned') {
    g.add(part(box(0.08, H, 0.3), MAT.slateDry, 'mullion', { pos: [0, H / 2, 0] }));
    g.add(part(box(W, 0.08, 0.3), MAT.slateDry, 'transom', { pos: [0, H * 0.62, 0] }));
  }
  // Shutters.
  if (A.shutter > 0) {
    const ang = A.shutter === 1 ? 0.1 : 1.3;
    [-1, 1].forEach((s, i) => {
      const sh = new THREE.Group();
      sh.position.set(s * (W / 2 + 0.14), H / 2, 0.22);
      sh.rotation.y = s * ang;
      plankSet(W / 2, H * 0.96, 0.05, 3, MAT.weatheredTimber, rand, 'shutter-' + i, sh, -s * W / 4, 0, 0);
      sh.add(part(box(W * 0.45, 0.07, 0.02), MAT.pittedIron, 'shutter-strap-' + i, { pos: [-s * W / 4, H * 0.28, 0.035] }));
      g.add(sh);
    });
  }
  if (A.sill > 0) g.add(part(jitter(box(W + 0.5, 0.16, 0.7, 3, 1, 2), 0.02, rand), MAT.slateDry, 'sill', { pos: [0, -0.08, 0.16] }));
  if (A.sill === 2) for (let i = 0; i < 4; i++) g.add(part(ico(0.05, 0), MAT.graveMoss, 'sill-moss-' + i, { pos: [-W / 2 + rand() * W, -0.02, 0.3] }));
  return seat(g);
}

/* ----------------------------------------------------------------- COLUMN */
export const COLUMN_AXES = { form: 5, height: 4, base: 3, capital: 3, damage: 3 };
export function column(variant = 0) {
  const A = axesOf(variant, COLUMN_AXES);
  const rand = rnd(0xc01 + variant * 3313);
  const g = new THREE.Group();
  const forms = ['plain', 'fluted', 'banded', 'clustered', 'twisted'];
  const form = forms[A.form];
  g.name = 'column-' + form;
  const H = [2.2, 3.4, 4.8, 6.4][A.height];
  const R = H * 0.075;
  const broken = A.damage === 2;
  const useH = broken ? H * (0.35 + rand() * 0.3) : H;

  const bases = [
    [[R * 1.5, 0], [R * 1.55, 0.1], [R * 1.15, 0.2], [R, 0.26]],
    [[R * 1.8, 0], [R * 1.85, 0.08], [R * 1.4, 0.16], [R * 1.5, 0.24], [R, 0.32]],
    [[R * 1.3, 0], [R * 1.35, 0.14], [R, 0.2]],
  ];
  g.add(part(lathe(bases[A.base], 16), MAT.slateDry, 'base', { pos: [0, 0, 0] }));
  const bh = bases[A.base][bases[A.base].length - 1][1];

  if (form === 'clustered') {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * T + 0.4;
      g.add(part(limb(R * 0.5, R * 0.56, useH, 12, 3), MAT.springStone, 'shaft-' + i, { pos: [Math.cos(a) * R * 0.6, bh + useH / 2, Math.sin(a) * R * 0.6] }));
    }
  } else {
    const seg = form === 'twisted' ? 20 : 16;
    const sh = limb(R * 0.86, R, useH, seg, form === 'twisted' ? 10 : 4);
    if (form === 'twisted') {
      const p = sh.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i), ang = (y / useH) * 2.2;
        const x = p.getX(i), z = p.getZ(i);
        p.setX(i, x * Math.cos(ang) - z * Math.sin(ang));
        p.setZ(i, x * Math.sin(ang) + z * Math.cos(ang));
      }
      p.needsUpdate = true;
      sh.computeVertexNormals();
    }
    jitter(sh, R * 0.03, rand);
    g.add(part(sh, MAT.springStone, 'shaft', { pos: [0, bh + useH / 2, 0] }));
    if (form === 'fluted') {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * T;
        g.add(part(limb(R * 0.13, R * 0.13, useH * 0.98, 5, 1), MAT.springStone, 'flute-' + i, { pos: [Math.cos(a) * R * 0.94, bh + useH / 2, Math.sin(a) * R * 0.94] }));
      }
    } else if (form === 'banded') {
      for (let i = 0; i < 4; i++) g.add(part(torus(R * 1.06, R * 0.09, 5, 18), MAT.slateDry, 'band-' + i, { pos: [0, bh + useH * (0.2 + i * 0.22), 0], rot: [Math.PI / 2, 0, 0] }));
    }
  }
  if (!broken) {
    const caps = [
      [[R, 0], [R * 1.3, 0.12], [R * 1.45, 0.24], [R * 1.5, 0.3]],
      [[R, 0], [R * 1.2, 0.1], [R * 1.15, 0.2], [R * 1.6, 0.26], [R * 1.6, 0.34]],
      [[R, 0], [R * 1.55, 0.2], [R * 1.5, 0.28]],
    ];
    g.add(part(lathe(caps[A.capital], 16), MAT.slateDry, 'capital', { pos: [0, bh + useH, 0] }));
  } else {
    const sf = ico(R * 0.95, 1);
    sf.scale(1, 0.2, 1);
    jitter(sf, R * 0.24, rand);
    g.add(part(sf, MAT.springStone, 'shear-face', { pos: [0, bh + useH, 0], rot: [(rand() - 0.5) * 0.3, 0, (rand() - 0.5) * 0.3] }));
    for (let i = 0; i < 5; i++) {
      const dm = box(R * (0.7 + rand() * 0.6), R * 0.5, R * (0.6 + rand() * 0.5));
      jitter(dm, R * 0.14, rand);
      g.add(part(dm, MAT.springStone, 'rubble-' + i, { pos: [(rand() - 0.5) * R * 5, R * 0.25, (rand() - 0.5) * R * 5], rot: [rand() * T, rand() * T, rand() * T] }));
    }
  }
  if (A.damage === 1) for (let i = 0; i < 5; i++) g.add(part(ico(R * 0.2, 0), MAT.lichenGrey, 'lichen-' + i, { pos: [Math.cos(rand() * T) * R, bh + rand() * useH, Math.sin(rand() * T) * R] }));
  return seat(g);
}

/* ------------------------------------------------------------------ STAIR */
export const STAIR_AXES = { form: 4, run: 3, width: 3, rail: 3, wear: 2 };
export function stair(variant = 0) {
  const A = axesOf(variant, STAIR_AXES);
  const rand = rnd(0x57a + variant * 2711);
  const g = new THREE.Group();
  const forms = ['straight', 'spiral', 'ruined', 'timber'];
  const form = forms[A.form];
  g.name = 'stair-' + form;
  const steps = [6, 11, 17][A.run];
  const W = [1.1, 1.7, 2.6][A.width];
  const rise = 0.19, tread = 0.3;
  const mat = form === 'timber' ? MAT.weatheredTimber : MAT.slateDry;

  for (let i = 0; i < steps; i++) {
    if (form === 'ruined' && (i === Math.floor(steps * 0.4) || i === Math.floor(steps * 0.7))) continue;
    if (form === 'spiral') {
      const a = (i / steps) * T * 1.4;
      const t = box(W, rise, W * 0.42, 2, 1, 1);
      jitter(t, 0.012, rand);
      g.add(part(t, mat, 'tread-' + i, { pos: [Math.cos(a) * W * 0.5, rise * (i + 0.5), Math.sin(a) * W * 0.5], rot: [0, -a, 0] }));
    } else {
      const t = box(W, rise, tread * (form === 'timber' ? 1 : 1.6), 2, 1, 1);
      jitter(t, form === 'ruined' ? 0.03 : 0.012, rand);
      g.add(part(t, mat, 'tread-' + i, { pos: [0, rise * (i + 0.5), -tread * i], rot: form === 'ruined' ? [(rand() - 0.5) * 0.1, 0, (rand() - 0.5) * 0.08] : [0, 0, 0] }));
    }
  }
  if (form === 'spiral') g.add(part(limb(0.16, 0.18, rise * steps, 12, 2), mat, 'newel', { pos: [0, (rise * steps) / 2, 0] }));
  if (form === 'timber') {
    [-1, 1].forEach((s, i) => g.add(part(box(0.1, 0.34, tread * steps * 1.05), mat, 'stringer-' + i, { pos: [s * W / 2, rise * steps * 0.5, -tread * steps * 0.5], rot: [Math.atan2(rise, tread), 0, 0] })));
  }
  if (A.rail > 0 && form !== 'spiral') {
    [-1, 1].forEach((s, i) => {
      if (A.rail === 1 && i === 0) return;
      const posts = Math.max(2, Math.round(steps / 4));
      for (let p = 0; p < posts; p++) {
        const k = p / (posts - 1);
        g.add(part(box(0.09, 0.9, 0.09), mat, 'post-' + i + '-' + p, { pos: [s * W / 2, rise * steps * k + 0.45, -tread * steps * k] }));
      }
      g.add(part(box(0.09, 0.1, tread * steps * 1.02), A.rail === 2 ? MAT.pittedIron : mat, 'handrail-' + i, { pos: [s * W / 2, rise * steps * 0.5 + 0.9, -tread * steps * 0.5], rot: [Math.atan2(rise, tread), 0, 0] }));
    });
  }
  if (A.wear) for (let i = 0; i < 6; i++) g.add(part(ico(0.06, 0), MAT.graveMoss, 'moss-' + i, { pos: [(rand() - 0.5) * W, rise * steps * rand(), -tread * steps * rand()] }));
  return seat(g);
}

/* ----------------------------------------------------------------- BRIDGE */
export const BRIDGE_AXES = { form: 4, span: 4, deck: 3, rail: 3, damage: 3 };
export function bridge(variant = 0) {
  const A = axesOf(variant, BRIDGE_AXES);
  const rand = rnd(0xb71 + variant * 1871);
  const g = new THREE.Group();
  const forms = ['arch', 'rope', 'plank-trestle', 'causeway'];
  const form = forms[A.form];
  g.name = 'bridge-' + form;
  const L = [4, 7, 11, 16][A.span];
  const W = [1.2, 1.9, 2.8][A.deck];
  const gone = A.damage === 2;

  if (form === 'arch') {
    const ar = arch(L * 0.4, 15, W, 0.5, MAT.wetSlate, rand, 'span-arch');
    ar.position.y = 0.4;
    g.add(ar);
    for (let i = 0; i < Math.round(L * 1.6); i++) {
      const x = -L / 2 + (L / Math.round(L * 1.6)) * (i + 0.5);
      if (gone && Math.abs(x) < L * 0.13) continue;
      const camber = Math.cos((x / L) * Math.PI) * 0.3;
      g.add(part(jitter(box(L / Math.round(L * 1.6) * 0.94, 0.14, W, 1, 1, 2), 0.02, rand), MAT.slateDry, 'sett-' + i, { pos: [x, L * 0.4 + 0.45 + camber, 0] }));
    }
  } else if (form === 'rope') {
    [-1, 1].forEach((s, i) => {
      const c = limb(0.035, 0.035, L * 1.06, 6, 1);
      const p = c.attributes.position;
      for (let v = 0; v < p.count; v++) { const t = p.getY(v) / L; p.setX(v, p.getX(v) - Math.cos(t * Math.PI) * 0 + 0); }
      g.add(part(c, MAT.ropeHemp, 'main-cable-' + i, { pos: [0, 1.1, s * W / 2], rot: [0, 0, Math.PI / 2] }));
      g.add(part(limb(0.025, 0.025, L * 1.02, 5, 1), MAT.ropeHemp, 'hand-line-' + i, { pos: [0, 1.75, s * W / 2], rot: [0, 0, Math.PI / 2] }));
    });
    const n = Math.round(L * 2.2);
    for (let i = 0; i < n; i++) {
      const x = -L / 2 + (L / n) * (i + 0.5);
      if (gone && Math.abs(x) < L * 0.14) continue;
      const sag = Math.cos((x / L) * Math.PI) * 0.45;
      g.add(part(jitter(box(W, 0.06, (L / n) * 0.7, 2, 1, 1), 0.012, rand), MAT.weatheredTimber, 'slat-' + i, { pos: [x, 1.1 - 0.35 + sag * 0.0 + sag, 0], rot: [0, 0, 0] }));
      if (i % 3 === 0) [-1, 1].forEach((s, j) => g.add(part(limb(0.012, 0.012, 0.62, 4, 1), MAT.ropeHemp, 'hanger-' + i + '-' + j, { pos: [x, 1.45 + sag * 0.5, s * W / 2] })));
    }
  } else if (form === 'plank-trestle') {
    const bays = Math.max(2, Math.round(L / 3));
    for (let b = 0; b <= bays; b++) {
      const x = -L / 2 + (L / bays) * b;
      [-1, 1].forEach((s, j) => {
        g.add(part(jitter(limb(0.1, 0.14, 2.0, 7, 2), 0.02, rand), MAT.darkOak, 'trestle-leg-' + b + '-' + j, { pos: [x, 1.0, s * W * 0.42], rot: [s * 0.14, 0, 0] }));
      });
      g.add(part(box(W * 1.1, 0.12, 0.12), MAT.darkOak, 'trestle-cap-' + b, { pos: [x, 1.95, 0] }));
    }
    const n = Math.round(L * 1.6);
    for (let i = 0; i < n; i++) {
      const x = -L / 2 + (L / n) * (i + 0.5);
      if (gone && Math.abs(x) < L * 0.12) continue;
      g.add(part(jitter(box((L / n) * 0.94, 0.08, W, 1, 1, 2), 0.014, rand), MAT.weatheredTimber, 'deck-' + i, { pos: [x, 2.05, 0] }));
    }
  } else {
    for (let i = 0; i < Math.round(L * 1.4); i++) {
      const x = -L / 2 + (L / Math.round(L * 1.4)) * (i + 0.5);
      if (gone && Math.abs(x) < L * 0.15) continue;
      g.add(part(jitter(box(L / Math.round(L * 1.4) * 0.96, 0.5, W + 0.4, 1, 1, 2), 0.05, rand), MAT.wetSlate, 'causeway-block-' + i, { pos: [x, 0.25, 0] }));
    }
  }
  if (A.rail > 0 && form !== 'rope') {
    const posts = Math.max(3, Math.round(L / 1.6));
    [-1, 1].forEach((s, j) => {
      if (A.rail === 1 && j === 0) return;
      for (let p = 0; p < posts; p++) {
        const x = -L / 2 + (L / (posts - 1)) * p;
        if (gone && Math.abs(x) < L * 0.14) continue;
        g.add(part(box(0.09, 0.85, 0.09), MAT.weatheredTimber, 'rail-post-' + j + '-' + p, { pos: [x, (form === 'arch' ? L * 0.4 + 0.9 : form === 'plank-trestle' ? 2.5 : 0.9), s * (W / 2)] }));
      }
    });
  }
  return seat(g);
}

/* ---------------------------------------------------------------- ARCHWAY */
export const ARCHWAY_AXES = { form: 4, span: 4, depth: 3, ornament: 3, ruin: 3 };
export function archway(variant = 0) {
  const A = axesOf(variant, ARCHWAY_AXES);
  const rand = rnd(0xa2c + variant * 1439);
  const g = new THREE.Group();
  const forms = ['round', 'pointed', 'segmental', 'corbelled'];
  g.name = 'archway-' + forms[A.form];
  const S = [1.4, 2.2, 3.2, 4.4][A.span];
  const D = [0.5, 1.1, 2.0][A.depth];
  const rings = Math.max(1, Math.round(D / 0.4));

  [-1, 1].forEach((s, i) => {
    g.add(part(jitter(box(0.7, S * 1.1, D, 1, 3, 2), 0.05, rand), MAT.wetSlate, 'pier-' + i, { pos: [s * (S / 2 + 0.35), (S * 1.1) / 2, 0] }));
    g.add(part(jitter(box(0.95, 0.2, D + 0.3, 2, 1, 2), 0.03, rand), MAT.slateDry, 'impost-' + i, { pos: [s * (S / 2 + 0.35), S * 1.1, 0] }));
  });
  for (let r = 0; r < rings; r++) {
    const z = -D / 2 + (D / rings) * (r + 0.5);
    if (A.ruin === 2 && r === rings - 1) continue;
    const n = forms[A.form] === 'corbelled' ? 7 : 13;
    const ar = arch(S / 2, n, (D / rings) * 1.04, 0.42, MAT.slateDry, rand, 'ring-' + r);
    ar.position.set(0, S * 1.1, z);
    if (forms[A.form] === 'pointed') ar.scale.y = 1.3;
    if (forms[A.form] === 'segmental') ar.scale.y = 0.66;
    g.add(ar);
  }
  if (A.ornament > 0) {
    // Bell-motif bosses: the Reach's own ornament, not generic acanthus.
    for (let i = 0; i < A.ornament * 2 + 1; i++) {
      const a = 0.5 + (i / (A.ornament * 2 + 1)) * (Math.PI - 1);
      g.add(part(lathe([[0.1, 0], [0.11, 0.03], [0.08, 0.1], [0.04, 0.14], [0, 0.15]], 10), MAT.slateDry, 'bell-boss-' + i, {
        pos: [Math.cos(a) * (S / 2 + 0.5), S * 1.1 + Math.sin(a) * (S / 2 + 0.5), D / 2 + 0.04], rot: [Math.PI / 2, 0, 0],
      }));
    }
  }
  if (A.ruin > 0) {
    for (let i = 0; i < 6; i++) {
      const b = box(0.4 + rand() * 0.4, 0.3, 0.35 + rand() * 0.3);
      jitter(b, 0.07, rand);
      g.add(part(b, MAT.slateDry, 'rubble-' + i, { pos: [(rand() - 0.5) * S * 2, 0.16, (rand() - 0.5) * D * 2] }));
    }
  }
  return seat(g);
}

/* ---------------------------------------------------------------- STATUE */
export const STATUE_AXES = { subject: 6, pose: 4, plinth: 4, scale: 3, damage: 3, material: 2 };
export function statue(variant = 0) {
  const A = axesOf(variant, STATUE_AXES);
  const rand = rnd(0x57a7 + variant * 1181);
  const g = new THREE.Group();
  const subjects = ['bell-warden', 'tongueless-saint', 'kneeling-penitent', 'hooded-cantor', 'beast-effigy', 'nameless-figure'];
  const subject = subjects[A.subject];
  g.name = 'statue-' + subject;
  const S = [0.9, 1.5, 2.6][A.scale];
  const stone = A.material ? MAT.springStone : MAT.slateDry;
  const headless = A.damage === 2;

  // Plinth.
  const ph = S * [0.18, 0.32, 0.5, 0.12][A.plinth];
  const pw = S * 0.62;
  g.add(part(jitter(box(pw, ph, pw, 2, 1, 2), S * 0.02, rand), MAT.slateDry, 'plinth', { pos: [0, ph / 2, 0] }));
  if (A.plinth === 2) g.add(part(jitter(box(pw * 1.25, ph * 0.2, pw * 1.25, 2, 1, 2), S * 0.015, rand), MAT.slateDry, 'plinth-cornice', { pos: [0, ph, 0] }));

  const y0 = ph;
  const lean_ = A.pose === 1 ? 0.1 : 0;
  // Body: a tapered lathe, which reads as draped stone far better than a box.
  const bodyH = S * (subject === 'kneeling-penitent' ? 0.5 : 0.72);
  g.add(part(lathe([[S * 0.11, 0], [S * 0.2, bodyH * 0.12], [S * 0.185, bodyH * 0.5], [S * 0.15, bodyH * 0.82], [S * 0.12, bodyH], [S * 0.1, bodyH * 1.02]], 16), stone, 'body', { pos: [0, y0, 0], rot: [lean_, 0, 0] }));
  if (subject === 'kneeling-penitent') {
    g.add(part(jitter(box(S * 0.34, S * 0.14, S * 0.4, 2, 1, 2), S * 0.02, rand), stone, 'knees', { pos: [0, y0 + S * 0.07, S * 0.12] }));
  }
  // Head.
  if (!headless) {
    g.add(part(ico(S * 0.1, 1), stone, 'head', { pos: [0, y0 + bodyH + S * 0.1, 0] }));
    if (subject === 'hooded-cantor' || subject === 'tongueless-saint') {
      g.add(part(cone(S * 0.15, S * 0.24, 8, 2), stone, 'hood', { pos: [0, y0 + bodyH + S * 0.13, -S * 0.02] }));
    }
    if (subject === 'beast-effigy') {
      g.add(part(cone(S * 0.07, S * 0.2, 6, 1), stone, 'muzzle', { pos: [0, y0 + bodyH + S * 0.08, S * 0.13], rot: [1.3, 0, 0] }));
      [-1, 1].forEach((s, i) => g.add(part(cone(S * 0.035, S * 0.13, 5, 1), stone, 'horn-' + i, { pos: [s * S * 0.07, y0 + bodyH + S * 0.19, 0], rot: [0, 0, s * 0.5] })));
    }
  } else {
    const nk = ico(S * 0.075, 0);
    nk.scale(1, 0.4, 1);
    jitter(nk, S * 0.02, rand);
    g.add(part(nk, stone, 'broken-neck', { pos: [0, y0 + bodyH + S * 0.02, 0] }));
    // The head, on the ground where it fell.
    g.add(part(jitter(ico(S * 0.1, 1), S * 0.02, rand), stone, 'fallen-head', { pos: [S * 0.5, S * 0.09, S * 0.34], rot: [rand() * T, rand() * T, rand() * T] }));
  }
  // Arms and attribute by pose.
  [-1, 1].forEach((s, i) => {
    const raise = A.pose === 2 ? -0.9 : A.pose === 3 ? 0.35 : 0.18;
    g.add(part(limb(S * 0.035, S * 0.05, bodyH * 0.62, 7, 2), stone, 'arm-' + i, {
      pos: [s * S * 0.17, y0 + bodyH * 0.62, S * 0.03], rot: [raise, 0, s * 0.16],
    }));
  });
  if (subject === 'bell-warden') {
    g.add(part(lathe([[S * 0.11, 0], [S * 0.112, S * 0.02], [S * 0.08, S * 0.09], [S * 0.03, S * 0.13], [0, S * 0.14]], 14), MAT.bellBronze, 'held-bell', { pos: [0, y0 + bodyH * 0.42, S * 0.22] }));
  } else if (subject === 'tongueless-saint') {
    g.add(part(box(S * 0.05, S * 0.02, S * 0.09), stone, 'severed-tongue', { pos: [0, y0 + bodyH * 0.5, S * 0.2] }));
  } else if (subject === 'hooded-cantor') {
    g.add(part(box(S * 0.14, S * 0.19, S * 0.03), stone, 'held-tablet', { pos: [0, y0 + bodyH * 0.48, S * 0.2], rot: [0.3, 0, 0] }));
  }
  if (A.damage === 1) for (let i = 0; i < 5; i++) g.add(part(ico(S * 0.045, 0), MAT.lichenGrey, 'lichen-' + i, { pos: [(rand() - 0.5) * S * 0.4, y0 + rand() * bodyH, (rand() - 0.5) * S * 0.4] }));
  return seat(g);
}

/* --------------------------------------------------------- OCCULT SIGIL
 * Bells, tongues, names and exact wording — the Reach's own iconography.
 * Never a pentagram: nothing in the source fiction supports one. */
export const SIGIL_AXES = { form: 6, size: 4, medium: 4, completeness: 3, offering: 2 };
export function occultSigil(variant = 0) {
  const A = axesOf(variant, SIGIL_AXES);
  const rand = rnd(0x516 + variant * 1013);
  const g = new THREE.Group();
  const forms = ['ward-ring', 'name-spiral', 'bell-cross', 'tally-grid', 'tongue-mark', 'exact-words'];
  const form = forms[A.form];
  g.name = 'sigil-' + form;
  const R = [0.5, 0.9, 1.5, 2.4][A.size];
  const chalk = new THREE.MeshStandardMaterial({ color: new THREE.Color('#a9a291'), roughness: 0.96, metalness: 0 });
  chalk.name = 'chalk-line';
  const media = [chalk, MAT.firedClay, MAT.bellBronze, STEAM.sootIron][A.medium];
  const arcFrac = [1, 0.72, 0.42][A.completeness];
  const seg = (n) => Math.max(3, Math.round(n * arcFrac));

  const mark = (x, z, w, d, rot, nm) => g.add(part(box(w, 0.02, d), media, nm, { pos: [x, 0.012, z], rot: [0, rot, 0] }));

  if (form === 'ward-ring' || form === 'bell-cross') {
    const n = seg(40);
    for (let i = 0; i < n; i++) {
      const a = (i / 40) * T;
      mark(Math.cos(a) * R, Math.sin(a) * R, R * 0.16, 0.04, a + Math.PI / 2, 'ring-' + i);
    }
    const n2 = seg(28);
    for (let i = 0; i < n2; i++) {
      const a = (i / 28) * T;
      mark(Math.cos(a) * R * 0.66, Math.sin(a) * R * 0.66, R * 0.15, 0.035, a + Math.PI / 2, 'inner-' + i);
    }
    if (form === 'bell-cross') {
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * T + 0.78;
        mark(Math.cos(a) * R * 0.4, Math.sin(a) * R * 0.4, R * 0.8, 0.05, a, 'arm-' + i);
        g.add(part(lathe([[R * 0.07, 0], [R * 0.072, R * 0.015], [R * 0.05, R * 0.06], [0, R * 0.08]], 10), media, 'bell-' + i, { pos: [Math.cos(a) * R * 0.78, 0.01, Math.sin(a) * R * 0.78] }));
      }
    }
  } else if (form === 'name-spiral') {
    const n = seg(60);
    for (let i = 0; i < n; i++) {
      const t = i / 60;
      const a = t * T * 2.6;
      const r = R * (0.15 + t * 0.85);
      mark(Math.cos(a) * r, Math.sin(a) * r, R * 0.12, 0.03, a + Math.PI / 2, 'spiral-' + i);
    }
  } else if (form === 'tally-grid') {
    const cols = 7, rows = 5;
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      if (rand() > arcFrac) continue;
      mark(-R + (c / (cols - 1)) * R * 2, -R * 0.6 + (r / (rows - 1)) * R * 1.2, 0.03, R * 0.16, 0.22, 'tally-' + c + '-' + r);
    }
  } else if (form === 'tongue-mark') {
    // A tongue shape, struck through — the abbey's mark.
    const n = seg(24);
    for (let i = 0; i < n; i++) {
      const t = i / 24;
      const a = t * Math.PI;
      mark(Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.9 - R * 0.2, R * 0.14, 0.035, a, 'outline-' + i);
    }
    mark(0, 0, R * 1.5, 0.06, 0.4, 'strike-through');
  } else {
    // Exact words: incised text lines, the Gate of Exact Words' own grammar.
    for (let i = 0; i < seg(7); i++) {
      const w = R * (0.9 + rand() * 0.9);
      mark((rand() - 0.5) * R * 0.3, -R * 0.6 + i * (R * 0.24), w, R * 0.05, 0, 'line-' + i);
    }
  }
  // Offering: a coal, a tablet, a coin left in the middle.
  if (A.offering) {
    g.add(part(ico(R * 0.06, 0), MAT.ember, 'offering-coal', { pos: [0, R * 0.04, 0] }));
    g.add(part(box(R * 0.12, 0.02, R * 0.16), MAT.firedClay, 'offering-tablet', { pos: [R * 0.2, 0.014, R * 0.16], rot: [0, 0.4, 0] }));
  }
  return thin(seat(g));
}

/* ------------------------------------------------------------------ ALTAR */
export const ALTAR_AXES = { form: 4, size: 4, offering: 3, canopy: 3, wear: 3 };
export function altar(variant = 0) {
  const A = axesOf(variant, ALTAR_AXES);
  const rand = rnd(0xa17 + variant * 977);
  const g = new THREE.Group();
  const forms = ['block', 'table', 'cairn', 'furnace-shrine'];
  const form = forms[A.form];
  g.name = 'altar-' + form;
  const S = [0.9, 1.3, 1.8, 2.4][A.size];
  const stone = form === 'furnace-shrine' ? STEAM.firebrick : MAT.springStone;

  if (form === 'block') {
    g.add(part(jitter(box(S, S * 0.62, S * 0.6, 3, 2, 2), S * 0.025, rand), stone, 'block', { pos: [0, S * 0.31, 0] }));
    g.add(part(jitter(box(S * 1.16, S * 0.1, S * 0.76, 3, 1, 2), S * 0.015, rand), MAT.slateDry, 'mensa', { pos: [0, S * 0.67, 0] }));
  } else if (form === 'table') {
    g.add(part(jitter(box(S * 1.2, S * 0.1, S * 0.7, 3, 1, 2), S * 0.015, rand), MAT.slateDry, 'mensa', { pos: [0, S * 0.66, 0] }));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => {
      g.add(part(lathe([[S * 0.09, 0], [S * 0.1, S * 0.05], [S * 0.07, S * 0.3], [S * 0.09, S * 0.58], [S * 0.08, S * 0.62]], 12), stone, 'leg-' + i, { pos: [sx * S * 0.46, 0, sz * S * 0.24] }));
    });
  } else if (form === 'cairn') {
    let y = 0;
    for (let i = 0; i < 9; i++) {
      const r = S * (0.42 - i * 0.035);
      const b = box(r * 2, S * 0.11, r * 1.7);
      jitter(b, S * 0.035, rand);
      g.add(part(b, stone, 'cairn-stone-' + i, { pos: [(rand() - 0.5) * S * 0.08, y + S * 0.055, (rand() - 0.5) * S * 0.08], rot: [0, rand() * T, 0] }));
      y += S * 0.105;
    }
  } else {
    g.add(part(jitter(box(S, S * 0.8, S * 0.7, 3, 2, 2), S * 0.03, rand), stone, 'shrine-body', { pos: [0, S * 0.4, 0] }));
    g.add(part(lathe([[S * 0.3, 0], [S * 0.32, S * 0.06], [S * 0.2, S * 0.16], [S * 0.18, S * 0.2]], 14), STEAM.sootIron, 'flue', { pos: [0, S * 0.8, 0] }));
    g.add(part(box(S * 0.5, S * 0.3, 0.06), STEAM.hotSlag, 'fire-mouth', { pos: [0, S * 0.26, S * 0.36] }));
  }
  // Offerings.
  const top = form === 'cairn' ? S * 0.95 : form === 'furnace-shrine' ? S * 0.8 : S * 0.72;
  if (A.offering > 0) {
    for (let i = 0; i < A.offering * 3; i++) {
      g.add(part(box(S * 0.1, S * 0.14, 0.018), MAT.firedClay, 'name-tablet-' + i, {
        pos: [(rand() - 0.5) * S * 0.7, top + S * 0.02, (rand() - 0.5) * S * 0.35],
        rot: [Math.PI / 2 - 0.15, (rand() - 0.5) * 0.5, (rand() - 0.5) * 0.3],
      }));
    }
    g.add(part(lathe([[S * 0.04, 0], [S * 0.11, S * 0.03], [S * 0.13, S * 0.1], [S * 0.11, S * 0.11], [S * 0.07, S * 0.04], [0, S * 0.03]], 14), MAT.pittedIron, 'coal-bowl', { pos: [S * 0.3, top, -S * 0.14] }));
    for (let i = 0; i < 3; i++) g.add(part(ico(S * 0.022, 0), MAT.ember, 'coal-' + i, { pos: [S * 0.3 + (rand() - 0.5) * S * 0.1, top + S * 0.08, -S * 0.14 + (rand() - 0.5) * S * 0.1] }));
  }
  // Canopy.
  if (A.canopy > 0) {
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => {
      g.add(part(limb(S * 0.05, S * 0.06, S * 1.5, 8, 2), A.canopy === 2 ? STEAM.sootIron : MAT.darkOak, 'canopy-post-' + i, { pos: [sx * S * 0.62, S * 0.75, sz * S * 0.46] }));
    });
    if (A.canopy === 1) {
      g.add(part(cone(S * 1.0, S * 0.4, 4, 1), MAT.wetSlate, 'canopy-roof', { pos: [0, S * 1.68, 0], rot: [0, Math.PI / 4, 0] }));
    } else {
      g.add(part(jitter(box(S * 1.4, 0.08, S * 1.1, 3, 1, 2), 0.02, rand), STEAM.sootIron, 'canopy-plate', { pos: [0, S * 1.52, 0] }));
    }
  }
  if (A.wear > 0) for (let i = 0; i < A.wear * 3; i++) g.add(part(ico(S * 0.05, 0), i % 2 ? MAT.graveMoss : MAT.lichenGrey, 'growth-' + i, { pos: [(rand() - 0.5) * S, rand() * S * 0.5, (rand() - 0.5) * S * 0.7] }));
  return seat(g);
}

export const ARCH_GENERATORS = [
  { id: 'arch.door', name: 'Door', axes: DOOR_AXES, build: door, domain: 'dungeon', budgetClass: 'standard' },
  { id: 'arch.gate', name: 'Gate', axes: GATE_AXES, build: gate, domain: 'world', budgetClass: 'hero' },
  { id: 'arch.window', name: 'Window', axes: WINDOW_AXES, build: windowUnit, domain: 'world', budgetClass: 'standard' },
  { id: 'arch.column', name: 'Column', axes: COLUMN_AXES, build: column, domain: 'dungeon', budgetClass: 'standard' },
  { id: 'arch.stair', name: 'Stair', axes: STAIR_AXES, build: stair, domain: 'dungeon', budgetClass: 'standard' },
  { id: 'arch.bridge', name: 'Bridge', axes: BRIDGE_AXES, build: bridge, domain: 'world', budgetClass: 'hero' },
  { id: 'arch.archway', name: 'Archway', axes: ARCHWAY_AXES, build: archway, domain: 'dungeon', budgetClass: 'standard' },
  { id: 'occult.statue', name: 'Statue', axes: STATUE_AXES, build: statue, domain: 'world', budgetClass: 'standard' },
  { id: 'occult.sigil', name: 'Occult sigil', axes: SIGIL_AXES, build: occultSigil, domain: 'dungeon', budgetClass: 'minor' },
  { id: 'occult.altar', name: 'Altar', axes: ALTAR_AXES, build: altar, domain: 'dungeon', budgetClass: 'standard' },
];
