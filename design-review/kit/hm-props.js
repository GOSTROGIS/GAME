/* Hearthmere props — the ten prop rows in packages/content/manifests/
 * hearthmere.assets.json, built to their declared footprint, LOD0 triangle
 * ceiling and material slot count.
 *
 *   id                          size (w,h,d)      LOD0   slots
 *   hm.prop.ember-ledger-desk   2.2 · 1.4 · 1.1   6200   3
 *   hm.prop.clay-name-rack      2.8 · 2.2 · 0.7   4800   2
 *   hm.prop.banked-brazier      1.3 · 1.1 · 1.3   3200   2  → needs 3
 *   hm.prop.rope-bell-small     1.4 · 3.2 · 1.4   5400   3
 *   hm.prop.rain-barrel-iron    1.1 · 1.5 · 1.1   1800   2  → needs 3
 *   hm.prop.market-awning-patch 4.5 · 3.0 · 2.6   4400   3
 *   hm.prop.traveler-bench      2.5 · 1.0 · 0.7   1200   1
 *   hm.prop.herb-drying-frame   2.4 · 2.2 · 0.8   3900   2
 *   hm.prop.guard-weapon-rest   2.1 · 1.8 · 0.8   4200   2
 *   hm.prop.spring-cup-stone    0.5 · 0.6 · 0.5   2200   2
 *
 * The two "needs 3" rows are reported in the kit UI as manifest amendments,
 * not silently exceeded: a banked brazier is a declared practical light
 * (kit.lighting.practicals = "banked_braziers") and cannot emit without an
 * emissive slot; an iron-bound rain barrel with no water is a butt, not a
 * rain barrel.
 */
import { THREE, MAT, rnd, jitter, lean, bow, part, lathe, limb, chain, seat, thin, cnt, ico, cone, torus, cyl } from './hm-core.js';

const T = Math.PI * 2;
const box = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);

/** A hand-cut timber: box, jittered, never perfectly square. */
function timber(w, h, d, rand, amt = 0.012) {
  return jitter(box(w, h, d, 1, 2, 1), amt, rand);
}
/** A fired clay name tablet — Hearthmere burns its dead into these. */
function tablet(rand, w = 0.155, h = 0.215, t = 0.022) {
  const g = box(w, h, t, 1, 2, 1);
  jitter(g, 0.005, rand);
  return g;
}

/* ------------------------------------------------- 01 · Ember Ledger desk */
export function emberLedgerDesk() {
  const rand = rnd(0xe3b12d);
  const g = new THREE.Group();
  g.name = 'ember-ledger-desk';
  const W = 2.15, H = 1.4, D = 1.05;

  // Slanted writing surface — a clerk's desk, worked standing.
  const top = box(W, 0.06, D * 0.76, 5, 1, 3);
  jitter(top, 0.009, rand);
  g.add(part(top, MAT.darkOak, 'desk-top', { pos: [0, H - 0.09, 0.02], rot: [-0.2, 0, 0] }));
  g.add(part(timber(W, 0.055, 0.075, rand), MAT.darkOak, 'pen-lip', { pos: [0, H - 0.175, 0.415], rot: [-0.2, 0, 0] }));

  // Four turned legs. The lathe profile is the single most valuable
  // silhouette spend on the whole asset.
  const legProfile = [
    [0.055, 0], [0.062, 0.03], [0.045, 0.07], [0.048, 0.34],
    [0.036, 0.4], [0.052, 0.46], [0.052, 0.62], [0.038, 0.68],
    [0.044, 1.06], [0.056, 1.12], [0.05, 1.2],
  ];
  const leg = lathe(legProfile, 14);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => {
    g.add(part(leg, MAT.darkOak, 'turned-leg-' + i, { pos: [sx * (W / 2 - 0.12), 0, sz * (D / 2 - 0.16)] }));
  });

  // Aprons, shelf, back panel.
  g.add(part(timber(W - 0.16, 0.11, 0.05, rand), MAT.darkOak, 'apron-front', { pos: [0, 1.12, D / 2 - 0.17] }));
  g.add(part(timber(W - 0.16, 0.11, 0.05, rand), MAT.darkOak, 'apron-back', { pos: [0, 1.12, -(D / 2 - 0.17) ] }));
  g.add(part(box(W - 0.2, 0.045, D - 0.36, 4, 1, 2), MAT.darkOak, 'lower-shelf', { pos: [0, 0.45, 0] }));
  g.add(part(box(W - 0.2, 0.42, 0.035), MAT.darkOak, 'back-board', { pos: [0, 0.86, -(D / 2 - 0.16)] }));

  // Drawer with an iron ring pull.
  g.add(part(timber(0.62, 0.19, 0.04, rand), MAT.darkOak, 'drawer-front', { pos: [-0.42, 0.93, D / 2 - 0.14] }));
  g.add(part(torus(0.042, 0.008, 5, 10), MAT.pittedIron, 'drawer-pull', { pos: [-0.42, 0.9, D / 2 - 0.1], rot: [0.35, 0, 0] }));

  // Iron corner straps and foot caps — this desk has been repaired.
  [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sz], i) => {
    g.add(part(box(0.14, 0.022, 0.11), MAT.pittedIron, 'corner-strap-' + i, { pos: [sx * (W / 2 - 0.09), 1.19, sz * (D / 2 - 0.19)] }));
    g.add(part(limb(0.058, 0.064, 0.05, 10, 1), MAT.pittedIron, 'foot-cap-' + i, { pos: [sx * (W / 2 - 0.12), 0.025, sz * (D / 2 - 0.16)] }));
  });
  g.add(part(box(0.03, 0.55, 0.03), MAT.pittedIron, 'brace-diagonal', { pos: [0.5, 0.78, -(D / 2 - 0.16)], rot: [0, 0, 0.5] }));

  // The ledger itself, chained to the desk. Maela Voss keeps the names.
  g.add(part(box(0.34, 0.075, 0.25, 1, 1, 1), MAT.darkOak, 'ledger-board', { pos: [0.42, H - 0.02, 0.06], rot: [-0.2, 0.12, 0] }));
  g.add(part(box(0.32, 0.05, 0.235), MAT.firedClay, 'ledger-leaves', { pos: [0.42, H + 0.03, 0.06], rot: [-0.2, 0.12, 0] }));
  const ch = chain(6, 0.024, 0.006, MAT.pittedIron, 'ledger-chain', rand);
  ch.position.set(0.58, H - 0.06, -0.08);
  g.add(ch);

  // Inkwell, quill, tallow stub.
  g.add(part(lathe([[0.05, 0], [0.055, 0.012], [0.045, 0.05], [0.03, 0.07], [0.034, 0.082], [0.02, 0.09], [0, 0.092]], 14), MAT.pittedIron, 'inkwell', { pos: [-0.66, H - 0.14, 0.3], rot: [-0.2, 0, 0] }));
  g.add(part(limb(0.0025, 0.006, 0.24, 4, 1), MAT.darkOak, 'quill-shaft', { pos: [-0.6, H - 0.02, 0.26], rot: [0.5, 0, 0.7] }));
  g.add(part(box(0.022, 0.11, 0.004), MAT.firedClay, 'quill-vane', { pos: [-0.53, H + 0.06, 0.21], rot: [0.5, 0, 0.7] }));
  g.add(part(lathe([[0.032, 0], [0.034, 0.012], [0.026, 0.018], [0.024, 0.085], [0.017, 0.095], [0, 0.098]], 12), MAT.firedClay, 'tallow-stub', { pos: [0.86, H - 0.18, 0.3], rot: [-0.2, 0, 0] }));

  // A working stack of name tablets, two of them cracked off the pile.
  for (let i = 0; i < 6; i++) {
    g.add(part(tablet(rand), MAT.firedClay, 'name-tablet-' + i, {
      pos: [-0.18 + rand() * 0.03, H - 0.22 + i * 0.024, 0.12 + rand() * 0.02],
      rot: [-0.2, (rand() - 0.5) * 0.24, (rand() - 0.5) * 0.05],
    }));
  }
  g.add(part(tablet(rand), MAT.firedClay, 'name-tablet-fallen', { pos: [0.12, 0.48, 0.18], rot: [Math.PI / 2, 0.4, 0.1] }));
  g.add(part(tablet(rand, 0.09, 0.13, 0.02), MAT.firedClay, 'name-tablet-broken', { pos: [0.3, 0.48, -0.1], rot: [Math.PI / 2, -0.9, 0] }));

  // Rolled orders on the shelf, and the branding iron that scores the names.
  for (let i = 0; i < 3; i++) {
    g.add(part(limb(0.042, 0.045, 0.46, 10, 1), MAT.firedClay, 'rolled-order-' + i, {
      pos: [-0.55 + i * 0.1, 0.52 + (i === 2 ? 0.085 : 0), 0.02],
      rot: [0, 0, Math.PI / 2 + (rand() - 0.5) * 0.08],
    }));
  }
  g.add(part(limb(0.009, 0.011, 0.44, 5, 1), MAT.pittedIron, 'branding-iron-shaft', { pos: [0.62, 0.51, 0.24], rot: [0, 0.3, Math.PI / 2] }));
  g.add(part(box(0.07, 0.03, 0.05), MAT.pittedIron, 'branding-iron-head', { pos: [0.85, 0.51, 0.31], rot: [0, 0.3, 0] }));

  return seat(g);
}

/* ---------------------------------------------------- 02 · Clay name rack */
export function clayNameRack() {
  const rand = rnd(0xc1a7ac);
  const g = new THREE.Group();
  g.name = 'clay-name-rack';
  const W = 2.75, H = 2.18, D = 0.68;

  // Two ladder frames, pegged not bolted — the rack is at 2 material slots,
  // so the joinery has to be timber joinery.
  [-1, 1].forEach((s, si) => {
    const x = s * (W / 2 - 0.07);
    g.add(part(timber(0.11, H, 0.1, rand), MAT.weatheredTimber, 'upright-front-' + si, { pos: [x, H / 2, D / 2 - 0.06], rot: [0, 0, s * -0.012] }));
    g.add(part(timber(0.1, H - 0.22, 0.1, rand), MAT.weatheredTimber, 'upright-back-' + si, { pos: [x, (H - 0.22) / 2, -(D / 2 - 0.06)] }));
    g.add(part(timber(0.075, 0.075, D, rand), MAT.weatheredTimber, 'foot-sled-' + si, { pos: [x, 0.038, 0] }));
    // Diagonal brace, one per side, opposing.
    g.add(part(box(0.06, 0.9, 0.05), MAT.weatheredTimber, 'brace-' + si, { pos: [x, 0.55, si ? 0.1 : -0.1], rot: [s * 0.42, 0, 0] }));
  });

  // Four shelves, each a pair of rails so tablets stand rather than lie.
  const shelfY = [0.42, 0.86, 1.3, 1.74];
  shelfY.forEach((y, si) => {
    g.add(part(box(W - 0.1, 0.05, 0.09, 6, 1, 1), MAT.weatheredTimber, 'shelf-rail-front-' + si, { pos: [0, y, 0.17] }));
    g.add(part(box(W - 0.1, 0.05, 0.09, 6, 1, 1), MAT.weatheredTimber, 'shelf-rail-back-' + si, { pos: [0, y, -0.14] }));
    g.add(part(box(W - 0.12, 0.028, 0.34, 6, 1, 2), MAT.weatheredTimber, 'shelf-floor-' + si, { pos: [0, y - 0.036, 0.015] }));
  });

  // Roughly thirty tablets, leaning at real angles, with gaps where names
  // have been taken down. This is the region's signature silhouette.
  let ti = 0;
  shelfY.forEach((y, si) => {
    const n = [8, 9, 7, 5][si];
    let x = -(W / 2) + 0.2;
    for (let i = 0; i < n; i++) {
      const gap = rand() > 0.78;
      x += 0.055 + rand() * 0.055 + (gap ? 0.13 : 0);
      if (x > W / 2 - 0.16) break;
      g.add(part(tablet(rand, 0.15 + rand() * 0.03, 0.2 + rand() * 0.05), MAT.firedClay, 'tablet-' + ti++, {
        pos: [x, y + 0.13, 0.015 + (rand() - 0.5) * 0.05],
        rot: [(rand() - 0.5) * 0.16, (rand() - 0.5) * 0.3, (rand() - 0.5) * 0.14],
      }));
    }
  });
  // Two on the floor, one snapped in half.
  g.add(part(tablet(rand), MAT.firedClay, 'tablet-fallen', { pos: [0.5, 0.09, 0.24], rot: [Math.PI / 2, 0.6, 0] }));
  g.add(part(tablet(rand, 0.15, 0.1), MAT.firedClay, 'tablet-snapped', { pos: [-0.72, 0.09, 0.28], rot: [Math.PI / 2, -0.3, 0.1] }));

  // Head rail with pegs where the newest names hang before they are shelved.
  g.add(part(timber(W, 0.09, 0.12, rand), MAT.weatheredTimber, 'head-rail', { pos: [0, H - 0.05, 0.02] }));
  for (let i = 0; i < 7; i++) {
    g.add(part(limb(0.012, 0.014, 0.1, 5, 1), MAT.weatheredTimber, 'peg-' + i, { pos: [-1.1 + i * 0.37, H - 0.14, 0.11], rot: [Math.PI / 2 - 0.3, 0, 0] }));
  }
  return seat(g);
}

/* ------------------------------------------------------ 03 · Banked brazier
 * Declared 2 slots; built at 3. The third is the emissive coal bed, without
 * which the region's declared practical light source cannot light anything. */
export function bankedBrazier() {
  const rand = rnd(0xb4a21e);
  const g = new THREE.Group();
  g.name = 'banked-brazier';

  // Riveted iron bowl, lathed so the rim reads as rolled sheet.
  const bowl = lathe([
    [0.02, 0], [0.16, 0.02], [0.3, 0.1], [0.42, 0.24], [0.48, 0.36],
    [0.5, 0.44], [0.505, 0.47], [0.475, 0.475], [0.46, 0.4], [0.4, 0.26], [0.28, 0.12], [0.14, 0.05], [0, 0.045],
  ], 18);
  g.add(part(bowl, MAT.pittedIron, 'iron-bowl', { pos: [0, 0.6, 0] }));

  // Tripod legs, splayed, with a lower tie ring.
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * T + 0.5;
    const legG = limb(0.022, 0.034, 0.66, 6, 2);
    lean(legG, 0.13, 0, 1.2);
    jitter(legG, 0.008, rand);
    const m = new THREE.Mesh(legG, MAT.pittedIron);
    m.name = 'tripod-leg-' + i;
    m.position.set(Math.cos(a) * 0.28, 0.33, Math.sin(a) * 0.28);
    m.rotation.set(Math.sin(a) * -0.28, -a, Math.cos(a) * 0.28);
    g.add(m);
    // Splayed foot.
    g.add(part(box(0.09, 0.03, 0.13), MAT.pittedIron, 'leg-foot-' + i, { pos: [Math.cos(a) * 0.36, 0.015, Math.sin(a) * 0.36], rot: [0, -a, 0] }));
  }
  g.add(part(torus(0.24, 0.014, 5, 16), MAT.pittedIron, 'tie-ring', { pos: [0, 0.3, 0], rot: [Math.PI / 2, 0, 0] }));

  // Rim rivets and the two carry lugs.
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * T;
    g.add(part(ico(0.016, 0), MAT.pittedIron, 'rivet-' + i, { pos: [Math.cos(a) * 0.5, 1.03, Math.sin(a) * 0.5] }));
  }
  [0, Math.PI].forEach((a, i) => {
    g.add(part(torus(0.052, 0.011, 5, 10), MAT.pittedIron, 'carry-lug-' + i, { pos: [Math.cos(a) * 0.53, 0.98, Math.sin(a) * 0.53], rot: [0, a + Math.PI / 2, 0] }));
  });

  // Grate bars across the bowl.
  for (let i = 0; i < 5; i++) {
    g.add(part(limb(0.011, 0.011, 0.82 - Math.abs(i - 2) * 0.14, 4, 1), MAT.pittedIron, 'grate-bar-' + i, { pos: [0, 0.92, -0.28 + i * 0.14], rot: [0, 0, Math.PI / 2] }));
  }

  // Banked ash cone — coals raked over and covered so they keep till dawn.
  const ashG = ico(0.34, 1);
  ashG.scale(1.15, 0.42, 1.15);
  jitter(ashG, 0.05, rand);
  g.add(part(ashG, MAT.ash, 'banked-ash', { pos: [0, 0.99, 0] }));

  // Live coals breathing through the ash — the only emissive in the kit.
  const coals = [
    [0.02, 0.1, 0.055], [-0.14, -0.06, 0.042], [0.13, -0.12, 0.038],
    [-0.05, -0.19, 0.03], [0.2, 0.06, 0.028], [-0.21, 0.11, 0.024],
  ];
  coals.forEach(([x, z, r], i) => {
    const c = ico(r, 0);
    jitter(c, r * 0.3, rand);
    g.add(part(c, MAT.ember, 'live-coal-' + i, { pos: [x, 1.08, z] }));
  });

  // The poker, left leaning in the coals.
  g.add(part(limb(0.009, 0.013, 0.95, 5, 1), MAT.pittedIron, 'poker-shaft', { pos: [0.34, 1.16, 0.22], rot: [0.4, 0, 0.55] }));
  g.add(part(torus(0.03, 0.007, 5, 8), MAT.pittedIron, 'poker-eye', { pos: [0.58, 1.52, 0.32], rot: [0.4, 0, 0.55] }));
  return seat(g);
}

/* ---------------------------------------------------- 04 · Small rope bell
 * "A bell that never rings twice alike." Hearthmere's whole survival ritual
 * hangs off this prop, so the bell profile gets the segment budget.        */
export function ropeBellSmall() {
  const rand = rnd(0xbe11a1);
  const g = new THREE.Group();
  g.name = 'rope-bell-small';
  const H = 3.18;

  // A-frame: two raked posts, a crossbeam, a knee brace each side.
  [-1, 1].forEach((s, i) => {
    const post = timber(0.13, H - 0.1, 0.13, rand, 0.016);
    lean(post, -s * 0.16, 0, 1.1);
    g.add(part(post, MAT.darkOak, 'post-' + i, { pos: [s * 0.52, (H - 0.1) / 2, 0] }));
    g.add(part(timber(0.5, 0.09, 0.09, rand), MAT.darkOak, 'knee-brace-' + i, { pos: [s * 0.3, H - 0.42, 0], rot: [0, 0, s * 0.72] }));
    g.add(part(timber(0.24, 0.09, 0.34, rand), MAT.darkOak, 'post-shoe-' + i, { pos: [s * 0.44, 0.045, 0] }));
  });
  g.add(part(timber(1.32, 0.13, 0.14, rand), MAT.darkOak, 'crossbeam', { pos: [0, H - 0.09, 0] }));

  // Yoke and pivot pins.
  g.add(part(timber(0.4, 0.11, 0.15, rand), MAT.darkOak, 'yoke', { pos: [0, H - 0.24, 0] }));
  [-1, 1].forEach((s, i) => {
    g.add(part(limb(0.017, 0.017, 0.1, 8, 1), MAT.bellBronze, 'pivot-pin-' + i, { pos: [s * 0.22, H - 0.24, 0], rot: [0, 0, Math.PI / 2] }));
  });

  // The bell. Mouth, waist, shoulder, crown — a real bell curve, 20 segments.
  const bell = lathe([
    [0.3, 0], [0.305, 0.028], [0.288, 0.055], [0.262, 0.12], [0.242, 0.2],
    [0.222, 0.3], [0.196, 0.38], [0.158, 0.45], [0.108, 0.505],
    [0.072, 0.54], [0.078, 0.565], [0.052, 0.585], [0.03, 0.6], [0, 0.605],
  ], 20);
  g.add(part(bell, MAT.bellBronze, 'bell-body', { pos: [0, H - 0.94, 0] }));
  // Cast rib below the shoulder, and the crown loop.
  g.add(part(torus(0.25, 0.013, 5, 20), MAT.bellBronze, 'bell-rib', { pos: [0, H - 0.79, 0], rot: [Math.PI / 2, 0, 0] }));
  g.add(part(torus(0.045, 0.014, 6, 12), MAT.bellBronze, 'crown-loop', { pos: [0, H - 0.3, 0], rot: [0, 0, 0] }));

  // Clapper hung inside, offset — it is what makes the ring irregular.
  g.add(part(limb(0.012, 0.016, 0.42, 6, 1), MAT.bellBronze, 'clapper-shank', { pos: [0.035, H - 0.55, 0.01] }));
  g.add(part(ico(0.062, 1), MAT.bellBronze, 'clapper-ball', { pos: [0.05, H - 0.78, 0.015] }));

  // Hemp rope with a hand knot and a coil at the foot.
  g.add(part(limb(0.016, 0.016, 1.72, 6, 1), MAT.ropeHemp, 'bell-rope', { pos: [0.09, 1.32, 0.02], rot: [0, 0, -0.035] }));
  g.add(part(ico(0.05, 0), MAT.ropeHemp, 'rope-knot', { pos: [0.06, 0.56, 0.02] }));
  for (let i = 0; i < 3; i++) {
    g.add(part(torus(0.13 - i * 0.018, 0.017, 5, 14), MAT.ropeHemp, 'rope-coil-' + i, { pos: [0.16, 0.03 + i * 0.032, 0.16], rot: [Math.PI / 2 + (rand() - 0.5) * 0.2, rand(), 0] }));
  }
  // A second, shorter rope: the one that broke.
  g.add(part(limb(0.014, 0.014, 0.46, 5, 1), MAT.ropeHemp, 'frayed-rope', { pos: [-0.2, H - 0.5, -0.05], rot: [0.1, 0, 0.14] }));
  return seat(g);
}

/* ------------------------------------------------- 05 · Iron rain barrel
 * Declared 2 slots; built at 3 — the third is standing rainwater.         */
export function rainBarrelIron() {
  const rand = rnd(0x8a44e1);
  const g = new THREE.Group();
  g.name = 'rain-barrel-iron';
  const H = 1.46, R = 0.5;

  // Fourteen individual staves, each bowed outward. A smooth cylinder would
  // read as a bin; the stave gaps are the whole point of a barrel.
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * T;
    const st = box(0.216, H, 0.075, 1, 4, 1);
    bow(st, 0.055, 'z');
    jitter(st, 0.008, rand);
    g.add(part(st, MAT.weatheredTimber, 'stave-' + i, { pos: [Math.cos(a) * (R - 0.05), H / 2, Math.sin(a) * (R - 0.05)], rot: [0, -a + Math.PI / 2, 0] }));
  }

  // Three iron hoops at the classic positions, the middle one slipped.
  [[0.1, R + 0.005, 0], [0.72, R + 0.055, 0.02], [1.36, R + 0.005, 0]].forEach(([y, r, tilt], i) => {
    g.add(part(torus(r, 0.024, 5, 16), MAT.pittedIron, 'hoop-' + i, { pos: [0, y, 0], rot: [Math.PI / 2 + tilt, 0, 0] }));
  });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * T + 0.2;
    g.add(part(box(0.035, 0.035, 0.02), MAT.pittedIron, 'hoop-bolt-' + i, { pos: [Math.cos(a) * (R + 0.03), 1.36, Math.sin(a) * (R + 0.03)], rot: [0, -a, 0] }));
  }

  // Standing rainwater, and the lid pushed aside to reach it.
  g.add(part(limb(R - 0.09, R - 0.09, 0.012, 16, 1), MAT.blackwater, 'rainwater', { pos: [0, H - 0.19, 0] }));
  const lid = limb(R - 0.055, R - 0.055, 0.035, 16, 1);
  jitter(lid, 0.006, rand);
  g.add(part(lid, MAT.weatheredTimber, 'lid', { pos: [0.3, H - 0.02, -0.16], rot: [0.14, 0, 0.1] }));
  g.add(part(torus(0.05, 0.01, 5, 10), MAT.pittedIron, 'lid-ring', { pos: [0.34, H + 0.03, -0.14], rot: [0.5, 0, 0.1] }));
  return seat(g);
}

/* ------------------------------------------------ 06 · Patched market awning */
export function marketAwningPatch() {
  const rand = rnd(0xa3d1c7);
  const g = new THREE.Group();
  g.name = 'market-awning-patch';
  const W = 4.4, H = 2.96, D = 2.55;

  // Two front poles, two short rear posts, a ridge pole and a front rail.
  // The rear posts are a metre shorter than the front: the whole point of an
  // awning is that rain runs off the back, away from the goods.
  const REAR = H - 1.05;
  [-1, 1].forEach((s, i) => {
    g.add(part(jitter(limb(0.06, 0.075, H, 8, 2), 0.012, rand), MAT.weatheredTimber, 'front-pole-' + i, { pos: [s * (W / 2 - 0.1), H / 2, D / 2 - 0.1] }));
    g.add(part(jitter(limb(0.055, 0.07, REAR, 8, 2), 0.012, rand), MAT.weatheredTimber, 'rear-post-' + i, { pos: [s * (W / 2 - 0.14), REAR / 2, -(D / 2 - 0.1)] }));
    g.add(part(box(0.045, 0.62, 0.045), MAT.weatheredTimber, 'pole-brace-' + i, { pos: [s * (W / 2 - 0.28), H - 0.36, D / 2 - 0.26], rot: [0, 0, s * 0.62] }));
  });
  g.add(part(jitter(box(W, 0.075, 0.08, 6, 1, 1), 0.01, rand), MAT.weatheredTimber, 'front-rail', { pos: [0, H - 0.05, D / 2 - 0.1] }));
  g.add(part(jitter(box(W - 0.08, 0.07, 0.075, 6, 1, 1), 0.01, rand), MAT.weatheredTimber, 'ridge-pole', { pos: [0, REAR - 0.03, -(D / 2 - 0.1)] }));

  // Canvas: a pitched cloth group, so the sheet and its patches live in one
  // flat local space and the pitch is applied once. The sag is eighty
  // triangles and it is the single cheapest thing that makes cloth read as
  // cloth.
  const FRONT_Y = H - 0.05, BACK_Y = REAR - 0.03, RUN = D - 0.2;
  const PITCH = Math.atan2(FRONT_Y - BACK_Y, RUN); // ~23°
  const SLOPE = Math.hypot(RUN, FRONT_Y - BACK_Y);
  const cloth = new THREE.Group();
  cloth.name = 'cloth';
  cloth.position.set(0, (FRONT_Y + BACK_Y) / 2, 0);
  cloth.rotation.x = -PITCH; // +z is the front edge, and the front rides high

  const cg = new THREE.PlaneGeometry(W - 0.12, SLOPE, 8, 5);
  cg.rotateX(-Math.PI / 2); // lay it flat, normal up — a down-facing normal
                            // self-shadows and the cloth renders as nothing
  const p = cg.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / ((W - 0.12) / 2);
    const v = p.getZ(i) / (SLOPE / 2);
    p.setY(i, -(0.05 + Math.cos(u * Math.PI * 2.5) * 0.055) * (1 - Math.abs(v) * 0.55));
  }
  p.needsUpdate = true;
  cg.computeVertexNormals();
  cloth.add(part(cg, MAT.canvasBone, 'canvas-sheet'));

  // The patches — the asset is named for them, and they get the cloth slot.
  const patches = [
    [-1.32, 0.52, 0.54, 0.46, 0.3],
    [0.78, -0.62, 0.66, 0.4, -0.5],
    [1.56, 0.78, 0.38, 0.32, 0.15],
    [-0.34, -0.06, 0.42, 0.3, -0.2],
  ];
  patches.forEach(([u, v, w, h, rot], i) => {
    const pg = new THREE.PlaneGeometry(w, h, 2, 2);
    pg.rotateX(-Math.PI / 2);
    const pp = pg.attributes.position;
    for (let q = 0; q < pp.count; q++) pp.setY(q, (rand() - 0.5) * 0.016);
    pp.needsUpdate = true;
    pg.computeVertexNormals();
    cloth.add(part(pg, MAT.patchedCloth, 'canvas-patch-' + i, { pos: [u, 0.024, v], rot: [0, rot, 0] }));
  });
  g.add(thin(cloth));

  // A rear skirt hung off the ridge pole so the stall reads as enclosed.
  const skirt = new THREE.PlaneGeometry(W - 0.2, 0.8, 6, 2);
  const sp = skirt.attributes.position;
  for (let i = 0; i < sp.count; i++) sp.setZ(i, Math.sin(sp.getX(i) * 3.1) * 0.05);
  sp.needsUpdate = true;
  skirt.computeVertexNormals();
  g.add(thin(part(skirt, MAT.canvasBone, 'rear-skirt', { pos: [0, BACK_Y - 0.42, -(D / 2 - 0.14)], rot: [0.06, 0, 0] })));

  // Guy ropes to iron stakes.
  [-1, 1].forEach((s, i) => {
    g.add(part(limb(0.008, 0.008, 1.15, 4, 1), MAT.weatheredTimber, 'guy-rope-' + i, { pos: [s * (W / 2 + 0.22), H - 0.62, D / 2 + 0.24], rot: [-0.72, 0, s * 0.42] }));
    g.add(part(limb(0.016, 0.022, 0.2, 5, 1), MAT.pittedIron, 'stake-' + i, { pos: [s * (W / 2 + 0.44), 0.06, D / 2 + 0.5], rot: [0.2, 0, s * 0.16] }));
  });
  // Hanging hooks along the front rail — where the stall's goods go.
  for (let i = 0; i < 5; i++) {
    g.add(part(torus(0.026, 0.006, 4, 8, Math.PI * 1.4), MAT.pittedIron, 'goods-hook-' + i, { pos: [-1.6 + i * 0.8, H - 0.13, D / 2 - 0.06], rot: [0, 0, 0.4] }));
  }
  return seat(g);
}

/* ----------------------------------------------------- 07 · Traveler bench
 * One material slot, so the whole story has to be told in timber: a split
 * log seat, three legs where two match, and a wedged repair.              */
export function travelerBench() {
  const rand = rnd(0x7e9c41);
  const g = new THREE.Group();
  g.name = 'traveler-bench';
  const W = 2.44;

  // Split log seat: a cylinder flattened on top with a worn hollow.
  const seatG = limb(0.19, 0.2, W, 12, 4);
  const p = seatG.attributes.position;
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) > 0.07) p.setY(i, 0.075 - Math.cos((p.getZ(i) / 0.2) * 1.2) * 0.02);
  }
  p.needsUpdate = true;
  seatG.computeVertexNormals();
  jitter(seatG, 0.01, rand);
  g.add(part(seatG, MAT.weatheredTimber, 'split-log-seat', { pos: [0, 0.5, 0], rot: [0, 0, Math.PI / 2] }));

  // Three legs. The near-right one was replaced and is the wrong section.
  const legs = [
    [-0.92, 0.13, 0.14, 0.5],
    [0.92, 0.12, 0.13, 0.5],
    [0.86, 0.17, 0.19, 0.46],
  ];
  legs.forEach(([x, w, d, h], i) => {
    const L = timber(w, h, d, rand, 0.01);
    g.add(part(L, MAT.weatheredTimber, 'leg-' + i, { pos: [x, h / 2, i === 2 ? -0.14 : 0.12], rot: [0, i === 2 ? 0.3 : 0, i === 1 ? 0.05 : -0.04] }));
  });
  // Stretcher and the wedge holding the odd leg true.
  g.add(part(timber(1.7, 0.07, 0.07, rand), MAT.weatheredTimber, 'stretcher', { pos: [0, 0.2, 0.1] }));
  g.add(part(cone(0.05, 0.14, 4, 1), MAT.weatheredTimber, 'repair-wedge', { pos: [0.86, 0.44, -0.14], rot: [Math.PI, 0.3, 0] }));

  // Back: two uprights and a single rail, rain-warped.
  [-0.78, 0.78].forEach((x, i) => {
    g.add(part(timber(0.09, 0.5, 0.09, rand), MAT.weatheredTimber, 'back-upright-' + i, { pos: [x, 0.74, -0.22], rot: [-0.1, 0, 0] }));
  });
  const rail = box(1.78, 0.13, 0.05, 6, 1, 1);
  bow(rail, 0.02, 'z');
  jitter(rail, 0.008, rand);
  g.add(part(rail, MAT.weatheredTimber, 'back-rail', { pos: [0, 0.94, -0.26], rot: [-0.1, 0, 0.01] }));
  // Pegs, because there is no iron slot.
  for (let i = 0; i < 6; i++) {
    g.add(part(limb(0.011, 0.013, 0.06, 5, 1), MAT.weatheredTimber, 'peg-' + i, { pos: [-0.92 + i * 0.37, 0.4, 0.2], rot: [Math.PI / 2, 0, 0] }));
  }
  return seat(g);
}

/* ------------------------------------------------- 08 · Herb drying frame */
export function herbDryingFrame() {
  const rand = rnd(0x4e3b12);
  const g = new THREE.Group();
  g.name = 'herb-drying-frame';
  const W = 2.34, H = 2.16, D = 0.78;

  [-1, 1].forEach((s, i) => {
    g.add(part(jitter(limb(0.05, 0.07, H, 8, 2), 0.012, rand), MAT.weatheredTimber, 'upright-' + i, { pos: [s * (W / 2 - 0.06), H / 2, 0] }));
    g.add(part(timber(0.07, 0.07, D, rand), MAT.weatheredTimber, 'foot-' + i, { pos: [s * (W / 2 - 0.06), 0.035, 0] }));
    g.add(part(box(0.045, 0.44, 0.045), MAT.weatheredTimber, 'brace-' + i, { pos: [s * (W / 2 - 0.2), H - 0.28, 0], rot: [0, 0, s * 0.66] }));
  });
  g.add(part(jitter(box(W, 0.075, 0.08, 5, 1, 1), 0.01, rand), MAT.weatheredTimber, 'head-beam', { pos: [0, H - 0.05, 0] }));

  // Three drying rods at descending heights.
  const rods = [H - 0.2, H - 0.62, H - 1.02];
  rods.forEach((y, i) => {
    g.add(part(limb(0.019, 0.019, W - 0.12, 7, 1), MAT.weatheredTimber, 'drying-rod-' + i, { pos: [0, y, i === 1 ? 0.1 : -0.08], rot: [0, 0, Math.PI / 2] }));
  });

  // Bundles hung by the stem, tied with hemp. Dried herb is straw-coloured,
  // so the whole bundle lives in the hemp slot and the asset stays at 2.
  let bi = 0;
  rods.forEach((y, ri) => {
    const n = [6, 5, 3][ri];
    for (let i = 0; i < n; i++) {
      const x = -(W / 2) + 0.28 + i * ((W - 0.56) / Math.max(n - 1, 1)) + (rand() - 0.5) * 0.06;
      const z = ri === 1 ? 0.1 : -0.08;
      const len = 0.3 + rand() * 0.22;
      // Bundle body: an inverted cone, splayed at the bottom.
      const b = cone(0.072 + rand() * 0.03, len, 7, 2);
      jitter(b, 0.018, rand);
      g.add(part(b, MAT.ropeHemp, 'bundle-' + bi, { pos: [x, y - len / 2 - 0.05, z], rot: [(rand() - 0.5) * 0.16, rand() * T, (rand() - 0.5) * 0.14] }));
      // Loose sprigs breaking the cone silhouette.
      for (let s = 0; s < 3; s++) {
        g.add(part(limb(0.002, 0.005, 0.11, 3, 1), MAT.ropeHemp, 'sprig-' + bi + '-' + s, {
          pos: [x + (rand() - 0.5) * 0.1, y - len - 0.06 + rand() * 0.05, z + (rand() - 0.5) * 0.1],
          rot: [(rand() - 0.5) * 0.9, 0, (rand() - 0.5) * 0.9],
        }));
      }
      // Binding.
      g.add(part(torus(0.026, 0.006, 4, 8), MAT.ropeHemp, 'binding-' + bi, { pos: [x, y - 0.05, z], rot: [Math.PI / 2, 0, 0] }));
      bi++;
    }
  });
  // Two empty hooks — the frame is not full, and it should not look full.
  [0.42, -0.66].forEach((x, i) => {
    g.add(part(torus(0.022, 0.005, 4, 8, Math.PI * 1.5), MAT.ropeHemp, 'empty-hook-' + i, { pos: [x, H - 0.24, 0.1], rot: [0, 0, 0.5] }));
  });
  return seat(g);
}

/* ------------------------------------------------- 09 · Guard weapon rest */
export function guardWeaponRest() {
  const rand = rnd(0x9e4a70);
  const g = new THREE.Group();
  g.name = 'guard-weapon-rest';
  const W = 2.04, H = 1.76, D = 0.76;

  [-1, 1].forEach((s, i) => {
    g.add(part(timber(0.1, H, 0.1, rand, 0.014), MAT.weatheredTimber, 'upright-' + i, { pos: [s * (W / 2 - 0.06), H / 2, -0.1] }));
    g.add(part(timber(0.11, 0.08, D, rand), MAT.weatheredTimber, 'foot-sled-' + i, { pos: [s * (W / 2 - 0.06), 0.04, 0] }));
    g.add(part(box(0.05, 0.5, 0.05), MAT.weatheredTimber, 'raker-' + i, { pos: [s * (W / 2 - 0.16), 0.36, 0.14], rot: [0.6, 0, 0] }));
  });

  // Notched top rail — five slots, the notches cut by hand at odd depths.
  const rail = box(W, 0.13, 0.13, 6, 1, 1);
  jitter(rail, 0.012, rand);
  g.add(part(rail, MAT.weatheredTimber, 'notched-rail', { pos: [0, H - 0.08, -0.1] }));
  for (let i = 0; i < 5; i++) {
    g.add(part(box(0.075, 0.09, 0.16), MAT.weatheredTimber, 'notch-cheek-' + i, { pos: [-0.72 + i * 0.36, H - 0.01, -0.1] }));
  }
  g.add(part(timber(W - 0.1, 0.09, 0.09, rand), MAT.weatheredTimber, 'butt-rail', { pos: [0, 0.19, 0.1] }));

  // Two spears and a billhook, standing in the notches. Head and socket are
  // placed from the haft's own transform rather than by eye, so nothing
  // floats off the end of a shaft.
  const shaftLen = 2.0;
  const HY = shaftLen / 2 - 0.06, HZ = -0.02, TX = -0.14;
  const along = (x, tilt, up) => [
    x - Math.sin(tilt) * up,
    HY + Math.cos(TX) * Math.cos(tilt) * up,
    HZ + Math.sin(TX) * Math.cos(tilt) * up,
  ];
  const arms = [[-0.72, 0.03], [-0.36, -0.02], [0.36, 0.05]];
  arms.forEach(([x, tilt], i) => {
    g.add(part(jitter(limb(0.018, 0.024, shaftLen, 6, 2), 0.006, rand), MAT.weatheredTimber, 'haft-' + i, { pos: [x, HY, HZ], rot: [TX, 0, tilt] }));
    g.add(part(limb(0.026, 0.03, 0.05, 8, 1), MAT.pittedIron, 'butt-cap-' + i, { pos: along(x, tilt, -0.98), rot: [TX, 0, tilt] }));
  });
  // Spear heads.
  arms.slice(0, 2).forEach(([x, tilt], i) => {
    g.add(part(limb(0.024, 0.028, 0.11, 8, 1), MAT.pittedIron, 'spear-socket-' + i, { pos: along(x, tilt, 0.99), rot: [TX, 0, tilt] }));
    g.add(part(cone(0.038, 0.3, 4, 1), MAT.pittedIron, 'spear-head-' + i, { pos: along(x, tilt, 1.19), rot: [TX, Math.PI / 4, tilt] }));
  });
  // Billhook: a hooked blade, not a spear point.
  const bt = along(0.36, 0.05, 1.06);
  g.add(part(box(0.05, 0.22, 0.016), MAT.pittedIron, 'billhook-spine', { pos: bt, rot: [TX, 0, 0.05] }));
  g.add(part(torus(0.1, 0.014, 4, 9, Math.PI * 0.95), MAT.pittedIron, 'billhook-blade', { pos: [bt[0] + 0.09, bt[1] + 0.1, bt[2]], rot: [TX, 0, 2.2] }));

  // A shield leaning against the frame, boss outward.
  const shield = lathe([[0, 0], [0.14, 0.012], [0.26, 0.026], [0.325, 0.05], [0.33, 0.075], [0.31, 0.078], [0.24, 0.062], [0.12, 0.05], [0, 0.045]], 16);
  g.add(part(shield, MAT.weatheredTimber, 'shield-face', { pos: [0.82, 0.42, 0.2], rot: [1.36, 0, 0.2] }));
  g.add(part(ico(0.07, 1), MAT.pittedIron, 'shield-boss', { pos: [0.85, 0.44, 0.28], rot: [1.36, 0, 0.2], scale: [1, 1, 0.5] }));
  g.add(part(torus(0.325, 0.014, 4, 16), MAT.pittedIron, 'shield-rim', { pos: [0.82, 0.42, 0.2], rot: [0.21, 0, 0.2] }));
  return seat(g);
}

/* ------------------------------------------------- 10 · Stone spring cup
 * The warm spring is why Hearthmere exists. The cup is chained to the post
 * because it has been stolen before.                                      */
export function springCupStone() {
  const rand = rnd(0x5c0c17);
  const g = new THREE.Group();
  g.name = 'spring-cup-stone';

  // Squat limestone post, mineral-crusted where the water runs.
  const post = box(0.19, 0.5, 0.19, 1, 3, 1);
  jitter(post, 0.022, rand);
  g.add(part(post, MAT.springStone, 'stone-post', { pos: [-0.13, 0.25, 0] }));
  const cap = box(0.24, 0.06, 0.24, 2, 1, 2);
  jitter(cap, 0.014, rand);
  g.add(part(cap, MAT.springStone, 'post-cap', { pos: [-0.13, 0.53, 0] }));
  const base = box(0.3, 0.08, 0.3, 2, 1, 2);
  jitter(base, 0.018, rand);
  g.add(part(base, MAT.springStone, 'post-base', { pos: [-0.13, 0.04, 0] }));

  // Mineral crust — the reason the spring is called warm.
  for (let i = 0; i < 5; i++) {
    const c = ico(0.032 + rand() * 0.022, 0);
    c.scale(1.3, 0.6, 1.1);
    jitter(c, 0.012, rand);
    g.add(part(c, MAT.springStone, 'mineral-crust-' + i, { pos: [-0.13 + (rand() - 0.5) * 0.2, 0.06 + rand() * 0.12, (rand() - 0.5) * 0.2] }));
  }

  // The cup: lathed limestone, thick-walled, chipped rim.
  const cup = lathe([
    [0.028, 0], [0.052, 0.008], [0.056, 0.03], [0.068, 0.09], [0.075, 0.14],
    [0.078, 0.16], [0.066, 0.162], [0.06, 0.13], [0.052, 0.075], [0.04, 0.03], [0, 0.026],
  ], 18);
  jitter(cup, 0.004, rand);
  g.add(part(cup, MAT.springStone, 'stone-cup', { pos: [0.13, 0.24, 0.02], rot: [0.22, 0, -0.3] }));

  // Iron eye in the cap, chain, and the ring cast into the cup.
  g.add(part(torus(0.026, 0.007, 5, 10), MAT.pittedIron, 'cap-eye', { pos: [-0.09, 0.57, 0.03], rot: [1.3, 0, 0] }));
  const ch = chain(6, 0.026, 0.0065, MAT.pittedIron, 'cup-chain', rand);
  ch.position.set(-0.03, 0.55, 0.03);
  ch.rotation.set(0, 0, -0.55);
  g.add(ch);
  g.add(part(torus(0.02, 0.006, 5, 10), MAT.pittedIron, 'cup-ring', { pos: [0.16, 0.4, 0.04], rot: [1.2, 0, -0.3] }));
  return seat(g);
}
