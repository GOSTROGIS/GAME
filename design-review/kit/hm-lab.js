/* Natural philosophy, laboratory and biological work.
 *
 * HOW REAL THIS IS, STATED HONESTLY
 *
 * The connectors available here (PubMed, bioRxiv) are literature indexes. They
 * confirm that a vocabulary and a workflow exist — "microtome sectioning"
 * returns 748 indexed papers — but they cannot supply an instrument's
 * proportions or a bench layout, and no citation is claimed for any dimension
 * below. What grounds this module instead is documented apparatus FUNCTION:
 * each instrument is built from the parts its operating principle requires,
 * and its parts are placed where that principle puts them.
 *
 * So: a Liebig condenser has a counter-current water jacket with the inlet at
 * the LOW end, because that is what makes it condense. A knife-edge balance
 * has three agate bearings, not two, and a rider on the beam. A compound
 * microscope's objectives sit on a revolving nosepiece under the tube, and its
 * mirror sits below the stage because the light has to come from somewhere.
 * Get those wrong and an instrument reads as a prop; get them right and it
 * reads as equipment, which is the whole point of the exercise.
 *
 * Period: this is pre-electric bench science, matching a world lit by ash-veil
 * daylight and fed by a foundry. Spirit lamps and water jackets, not mains
 * power and PCR. Call it semi-real: correct in principle, undimensioned.
 *
 * WORKFLOW ORDER matters as much as the objects. Real specimen work runs
 * fixation -> embedding -> sectioning -> staining -> mounting -> examination
 * -> accession, and the families below are built so a bench laid out in that
 * order actually makes sense left to right.
 */
import { THREE, MAT, rnd, jitter, part, lathe, limb, torus, cone, cyl, ico, seat } from './hm-core.js';
import { axesOf } from './hm-steam.js';

const box = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);
const T = Math.PI * 2;
const tube = (pts, r, rad = 6) =>
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), Math.max(6, pts.length * 3), r, rad, false);

const M = (name, color, rough, metal = 0, extra) => {
  const m = new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(color), roughness: rough, metalness: metal }, extra || {}));
  m.name = name;
  return m;
};
export const LAB = {
  slate: M('lab-slate-top', '#2b3234', 0.62, 0.03),
  enamel: M('white-enamel', '#9d9c92', 0.42, 0.04),
  mahogany: M('instrument-mahogany', '#3a2620', 0.66, 0.02),
  brass: M('lacquered-brass', '#a8813d', 0.36, 0.34),
  brassDull: M('brass-tarnished', '#7d6538', 0.62, 0.22),
  blackJapan: M('black-japanned', '#191b1c', 0.44, 0.18),
  steel: M('bright-steel', '#8e979b', 0.3, 0.42),
  glass: M('apparatus-glass', '#7d949a', 0.08, 0.02, { transparent: true, opacity: 0.34 }),
  glassThick: M('jar-glass', '#6f8890', 0.1, 0.02, { transparent: true, opacity: 0.46 }),
  spirit: M('preserving-spirit', '#8d8a5e', 0.16, 0.0, { transparent: true, opacity: 0.7 }),
  spiritDark: M('spirit-clouded', '#5d5c46', 0.22, 0.0, { transparent: true, opacity: 0.78 }),
  specimen: M('wet-specimen', '#9a8f7d', 0.72, 0.0),
  stain: M('stain-carmine', '#6e2525', 0.5, 0.0),
  stainBlue: M('stain-methylene', '#2f4653', 0.5, 0.0),
  paraffin: M('paraffin-wax', '#b4ab93', 0.6, 0.0),
  cork: M('cork', '#7d6242', 0.9, 0.0),
  label: M('gummed-label', '#a9a291', 0.9, 0.0),
  rubber: M('rubber-tubing', '#2a2725', 0.78, 0.0),
  flame: M('spirit-flame', '#3d5a6b', 0.4, 0.0, { emissive: new THREE.Color('#6f9fb5'), emissiveIntensity: 1.5 }),
  culture: M('culture-medium', '#8a8352', 0.42, 0.0),
};

/* Standard laboratory glassware profiles, by principle rather than by look.
   A round-bottom flask has no base because it sits in a ring; a conical flask
   has one because it stands on a bench. */
function flaskProfile(kind, R, H) {
  if (kind === 0) return [[R * 0.1, 0], [R * 0.85, H * 0.28], [R, H * 0.5], [R * 0.7, H * 0.74], [R * 0.22, H * 0.9], [R * 0.24, H]];
  if (kind === 1) return [[R * 0.92, 0], [R * 0.95, H * 0.06], [R * 0.5, H * 0.66], [R * 0.2, H * 0.86], [R * 0.22, H]];
  if (kind === 2) return [[R * 0.78, 0], [R * 0.82, H * 0.1], [R * 0.8, H * 0.76], [R * 0.6, H * 0.9], [R * 0.64, H]];
  return [[R * 0.06, 0], [R * 0.7, H * 0.2], [R * 0.95, H * 0.46], [R * 0.55, H * 0.72], [R * 0.16, H * 0.94], [R * 0.18, H]];
}

/* -------------------------------------------------------------- LAB BENCH */
export const LABBENCH_AXES = { length: 4, top: 3, shelf: 3, sink: 3, taps: 2, stools: 2 };
export function labBench(variant = 0) {
  const A = axesOf(variant, LABBENCH_AXES);
  const rand = rnd(variant * 1093 + 3);
  const g = new THREE.Group();
  const W = 1.5 + A.length * 0.55;
  const D = 0.72;
  const H = 0.9;
  const topMat = [LAB.slate, MAT.darkOak, LAB.enamel][A.top];

  g.add(part(box(W, 0.05, D), topMat, 'bench-top', { pos: [0, H, 0] }));
  g.add(part(box(W, 0.02, 0.03), topMat, 'drip-edge', { pos: [0, H - 0.032, D / 2] }));
  // Carcase: cupboards below, because reagents live under the bench.
  const bays = Math.max(2, Math.round(W / 0.7));
  for (let i = 0; i < bays; i++) {
    const bw = W / bays;
    const x = -W / 2 + bw * (i + 0.5);
    g.add(part(box(bw * 0.96, H - 0.14, D * 0.9), MAT.darkOak, 'carcase-' + i, { pos: [x, (H - 0.14) / 2 + 0.1, -0.02] }));
    if (i % 2 === 0) {
      g.add(part(box(bw * 0.86, (H - 0.24) * 0.94, 0.02), MAT.weatheredTimber, 'door-' + i, { pos: [x, (H - 0.14) / 2 + 0.1, D * 0.43] }));
      g.add(part(cyl(0.008, 0.008, 0.05, 6), LAB.brass, 'door-knob-' + i, { pos: [x + bw * 0.3, (H - 0.14) / 2 + 0.1, D * 0.46], rot: [Math.PI / 2, 0, 0] }));
    } else {
      for (let d = 0; d < 3; d++) {
        g.add(part(box(bw * 0.86, (H - 0.3) / 3.4, 0.02), MAT.weatheredTimber, 'drawer-' + i + '-' + d, { pos: [x, 0.22 + d * (H - 0.3) / 3, D * 0.43] }));
        g.add(part(box(bw * 0.3, 0.012, 0.03), LAB.brass, 'drawer-pull-' + i + '-' + d, { pos: [x, 0.22 + d * (H - 0.3) / 3, D * 0.45] }));
      }
    }
  }
  g.add(part(box(W, 0.1, 0.08), MAT.darkOak, 'plinth', { pos: [0, 0.05, -0.02] }));

  // Reagent shelf above: bottles must be above the working surface, not on it.
  if (A.shelf > 0) {
    const sy = H + 0.42;
    [-1, 1].forEach((s, i) => g.add(part(box(0.05, 0.5, 0.05), MAT.darkOak, 'shelf-post-' + i, { pos: [s * W * 0.45, H + 0.25, -D * 0.36] })));
    for (let t = 0; t < A.shelf; t++) {
      g.add(part(box(W * 0.94, 0.026, 0.2), MAT.darkOak, 'reagent-shelf-' + t, { pos: [0, sy + t * 0.26, -D * 0.36] }));
      const n = 4 + Math.round(W);
      for (let i = 0; i < n; i++) {
        const bx = -W * 0.42 + (W * 0.84 / (n - 1)) * i;
        const bh = 0.09 + rand() * 0.06;
        const br = bh * 0.3;
        g.add(part(lathe([[br * 0.9, 0], [br, bh * 0.12], [br * 0.95, bh * 0.7], [br * 0.42, bh * 0.9], [br * 0.44, bh]], 12), i % 3 === 0 ? LAB.glassThick : LAB.glass, 'reagent-bottle-' + t + '-' + i, { pos: [bx, sy + t * 0.26 + 0.013, -D * 0.36] }));
        g.add(part(lathe([[br * 0.35, 0], [br * 0.5, 0.006], [br * 0.4, 0.014]], 9), LAB.cork, 'stopper-' + t + '-' + i, { pos: [bx, sy + t * 0.26 + 0.013 + bh, -D * 0.36] }));
        g.add(part(box(br * 1.3, bh * 0.3, 0.001), LAB.label, 'bottle-label-' + t + '-' + i, { pos: [bx, sy + t * 0.26 + 0.013 + bh * 0.45, -D * 0.36 + br * 1.02] }));
      }
    }
  }
  // Sink and waste: a bench without a drain is not a wet bench.
  if (A.sink > 0) {
    const sx = W * 0.32;
    const sw = 0.34, sd = 0.3;
    g.add(part(box(sw, 0.02, sd), LAB.enamel, 'sink-floor', { pos: [sx, H - 0.14, 0] }));
    [-1, 1].forEach((s, i) => {
      g.add(part(box(sw, 0.15, 0.02), LAB.enamel, 'sink-side-' + i, { pos: [sx, H - 0.07, s * sd / 2] }));
      g.add(part(box(0.02, 0.15, sd), LAB.enamel, 'sink-end-' + i, { pos: [sx + s * sw / 2, H - 0.07, 0] }));
    });
    g.add(part(cyl(0.03, 0.03, 0.16, 10), LAB.blackJapan, 'waste-pipe', { pos: [sx, H - 0.24, 0] }));
    if (A.sink > 1) {
      // Trap: the U-bend is what stops sewer gas, and it is always visible.
      g.add(part(torus(0.05, 0.028, 6, 14, Math.PI), LAB.blackJapan, 'trap-bend', { pos: [sx, H - 0.34, 0], rot: [Math.PI / 2, 0, 0] }));
      g.add(part(cyl(0.03, 0.03, 0.2, 10), LAB.blackJapan, 'trap-riser', { pos: [sx + 0.1, H - 0.44, 0] }));
    }
    // Swan-neck tap over the sink.
    g.add(part(tube([[sx - sw * 0.4, H + 0.03, -sd * 0.4], [sx - sw * 0.4, H + 0.24, -sd * 0.4], [sx - sw * 0.1, H + 0.3, -sd * 0.1], [sx, H + 0.22, 0]], 0.011, 7), LAB.brass, 'swan-neck-tap', {}));
    g.add(part(torus(0.026, 0.007, 4, 10), LAB.brass, 'tap-handle', { pos: [sx - sw * 0.4, H + 0.26, -sd * 0.4], rot: [Math.PI / 2, 0, 0] }));
  }
  // Spirit/gas taps along the back: the bench's power supply.
  if (A.taps) {
    const n = 2 + A.length;
    for (let i = 0; i < n; i++) {
      const tx = -W * 0.4 + (W * 0.6 / Math.max(1, n - 1)) * i;
      g.add(part(cyl(0.014, 0.016, 0.09, 8), LAB.brass, 'bench-tap-' + i, { pos: [tx, H + 0.045, -D * 0.4] }));
      g.add(part(cone(0.012, 0.03, 6), LAB.brass, 'tap-nozzle-' + i, { pos: [tx, H + 0.1, -D * 0.36], rot: [1.2, 0, 0] }));
      g.add(part(box(0.03, 0.006, 0.012), LAB.brass, 'tap-lever-' + i, { pos: [tx + 0.02, H + 0.06, -D * 0.4] }));
    }
  }
  if (A.stools) {
    for (let s = 0; s < 1 + A.length % 2; s++) {
      const stx = -W * 0.25 + s * W * 0.5;
      g.add(part(lathe([[0.14, 0], [0.15, 0.02], [0.13, 0.035]], 14), MAT.heartwood, 'stool-seat-' + s, { pos: [stx, 0.66, D * 0.75] }));
      for (let l = 0; l < 3; l++) {
        const a = (l / 3) * T;
        g.add(part(limb(0.014, 0.02, 0.66, 6, 2), MAT.darkOak, 'stool-leg-' + s + '-' + l, { pos: [stx + Math.cos(a) * 0.1, 0.33, D * 0.75 + Math.sin(a) * 0.1], rot: [Math.sin(a) * 0.14, 0, -Math.cos(a) * 0.14] }));
      }
      g.add(part(torus(0.1, 0.008, 4, 12), MAT.darkOak, 'stool-stretcher-' + s, { pos: [stx, 0.2, D * 0.75], rot: [Math.PI / 2, 0, 0] }));
    }
  }
  return seat(g);
}

/* ------------------------------------------------------------- FUME HOOD */
export const FUMEHOOD_AXES = { form: 3, sash: 3, duct: 3, taps: 3, tray: 2, contents: 2 };
export function fumeHood(variant = 0) {
  const A = axesOf(variant, FUMEHOOD_AXES);
  const rand = rnd(variant * 727 + 9);
  const g = new THREE.Group();
  const W = 0.95 + A.form * 0.3;
  const D = 0.62;
  const benchH = 0.9;
  const chamberH = 0.85;

  g.add(part(box(W, benchH, D), MAT.darkOak, 'base-cabinet', { pos: [0, benchH / 2, 0] }));
  g.add(part(box(W * 1.02, 0.04, D * 1.02), LAB.slate, 'work-surface', { pos: [0, benchH, 0] }));
  // Spill tray with a raised lip: a fume cupboard must contain a spill.
  if (A.tray) {
    g.add(part(box(W * 0.9, 0.02, D * 0.8), LAB.enamel, 'spill-tray', { pos: [0, benchH + 0.03, 0] }));
    [-1, 1].forEach((s, i) => {
      g.add(part(box(W * 0.9, 0.035, 0.014), LAB.enamel, 'tray-lip-' + i, { pos: [0, benchH + 0.045, s * D * 0.4] }));
      g.add(part(box(0.014, 0.035, D * 0.8), LAB.enamel, 'tray-end-' + i, { pos: [s * W * 0.45, benchH + 0.045, 0] }));
    });
  }
  // Chamber: three solid sides, glazed front, sloped baffle at the back.
  const cy = benchH + chamberH / 2;
  [-1, 1].forEach((s, i) => g.add(part(box(0.03, chamberH, D), LAB.blackJapan, 'chamber-side-' + i, { pos: [s * W / 2, cy, 0] })));
  g.add(part(box(W, chamberH, 0.03), LAB.blackJapan, 'chamber-back', { pos: [0, cy, -D / 2] }));
  g.add(part(box(W, 0.03, D), LAB.blackJapan, 'chamber-roof', { pos: [0, benchH + chamberH, 0] }));
  // Baffle: splits the extract between a high and low slot. This is the part
  // that makes a hood work and the part procedural props always omit.
  g.add(part(box(W * 0.94, chamberH * 0.72, 0.02), LAB.enamel, 'rear-baffle', { pos: [0, cy + chamberH * 0.06, -D * 0.4], rot: [0.12, 0, 0] }));
  g.add(part(box(W * 0.94, 0.04, 0.06), LAB.blackJapan, 'low-extract-slot', { pos: [0, benchH + 0.08, -D * 0.42] }));

  // Sash: counterweighted, and its position is the operator's protection.
  const sashDrop = [0.2, 0.5, 0.86][A.sash];
  g.add(part(box(W * 0.96, chamberH * sashDrop, 0.012), LAB.glass, 'sash-glass', { pos: [0, benchH + chamberH - (chamberH * sashDrop) / 2, D / 2] }));
  g.add(part(box(W * 0.98, 0.035, 0.03), LAB.blackJapan, 'sash-rail', { pos: [0, benchH + chamberH - chamberH * sashDrop, D / 2] }));
  g.add(part(box(W * 0.2, 0.02, 0.04), LAB.brass, 'sash-handle', { pos: [0, benchH + chamberH - chamberH * sashDrop - 0.02, D / 2 + 0.02] }));
  [-1, 1].forEach((s, i) => {
    g.add(part(box(0.02, chamberH, 0.05), LAB.blackJapan, 'sash-track-' + i, { pos: [s * W * 0.49, cy, D / 2] }));
    g.add(part(tube([[s * W * 0.49, benchH + chamberH, D / 2], [s * W * 0.49, benchH + chamberH + 0.05, D * 0.3], [s * W * 0.49, cy, -D * 0.1]], 0.004, 4), MAT.ropeHemp, 'sash-cord-' + i, {}));
    g.add(part(cyl(0.02, 0.02, 0.12, 8), LAB.steel, 'counterweight-' + i, { pos: [s * W * 0.49, cy - 0.1, -D * 0.1] }));
  });

  // Duct and stack: the extract has to go somewhere above the roof.
  const ductH = 0.5 + A.duct * 0.3;
  g.add(part(lathe([[W * 0.2, 0], [W * 0.16, 0.18], [0.075, 0.34], [0.075, 0.36]], 12), LAB.blackJapan, 'duct-transition', { pos: [0, benchH + chamberH, -D * 0.16] }));
  g.add(part(cyl(0.075, 0.075, ductH, 12), LAB.blackJapan, 'duct-riser', { pos: [0, benchH + chamberH + 0.36 + ductH / 2, -D * 0.16] }));
  for (let i = 0; i < 2 + A.duct; i++) g.add(part(torus(0.08, 0.008, 4, 14), LAB.blackJapan, 'duct-band-' + i, { pos: [0, benchH + chamberH + 0.44 + i * ductH * 0.3, -D * 0.16], rot: [Math.PI / 2, 0, 0] }));
  if (A.duct > 1) {
    g.add(part(lathe([[0.075, 0], [0.11, 0.05], [0.1, 0.08], [0.075, 0.1]], 12), LAB.blackJapan, 'duct-damper-housing', { pos: [0, benchH + chamberH + 0.36 + ductH * 0.5, -D * 0.16] }));
    g.add(part(box(0.06, 0.008, 0.03), LAB.brass, 'damper-lever', { pos: [0.08, benchH + chamberH + 0.36 + ductH * 0.5, -D * 0.16] }));
  }
  if (A.taps > 0) for (let i = 0; i < A.taps; i++) {
    g.add(part(cyl(0.013, 0.015, 0.08, 8), LAB.brass, 'service-tap-' + i, { pos: [-W * 0.36 + i * 0.1, benchH + 0.09, -D * 0.36] }));
    g.add(part(box(0.026, 0.005, 0.01), LAB.brass, 'service-lever-' + i, { pos: [-W * 0.36 + i * 0.1 + 0.018, benchH + 0.11, -D * 0.36] }));
  }
  if (A.contents) {
    // Something is actually being done in here.
    g.add(part(lathe(flaskProfile(1, 0.07, 0.14), 14), LAB.glass, 'working-flask', { pos: [W * 0.16, benchH + 0.05, 0] }));
    g.add(part(lathe([[0.055, 0], [0.03, 0.006], [0, 0.008]], 12), LAB.stain, 'flask-contents', { pos: [W * 0.16, benchH + 0.06, 0] }));
    g.add(part(cyl(0.015, 0.02, 0.05, 10), LAB.brass, 'ring-stand-boss', { pos: [W * 0.16 + 0.14, benchH + 0.07, 0] }));
    g.add(part(cyl(0.008, 0.008, 0.4, 8), LAB.steel, 'ring-stand-rod', { pos: [W * 0.16 + 0.14, benchH + 0.24, 0] }));
    g.add(part(torus(0.05, 0.005, 4, 14, Math.PI * 1.6), LAB.steel, 'support-ring', { pos: [W * 0.16 + 0.06, benchH + 0.12, 0], rot: [Math.PI / 2, 0, 0] }));
  }
  return seat(g);
}

/* ------------------------------------------------------------ MICROSCOPE */
export const MICROSCOPE_AXES = { form: 4, objectives: 3, stage: 3, mirror: 3, slides: 3 };
export function microscope(variant = 0) {
  const A = axesOf(variant, MICROSCOPE_AXES);
  const rand = rnd(variant * 1289 + 15);
  const g = new THREE.Group();
  const S = 0.9 + A.form * 0.08;
  // Horseshoe foot: a compound microscope is bottom-heavy or it topples.
  g.add(part(lathe([[0.075 * S, 0], [0.08 * S, 0.008 * S], [0.05 * S, 0.022 * S], [0.045 * S, 0.03 * S]], 16), LAB.blackJapan, 'foot'));
  g.add(part(box(0.11 * S, 0.022 * S, 0.05 * S), LAB.blackJapan, 'foot-spur', { pos: [0, 0.011 * S, -0.05 * S] }));
  // Limb (the curved back): the classic silhouette.
  const limbH = 0.17 * S;
  g.add(part(tube([[0, 0.03 * S, -0.03 * S], [0, limbH * 0.5, -0.055 * S], [0, limbH, -0.03 * S]], 0.014 * S, 8), LAB.blackJapan, 'limb', {}));
  // Stage, with the light path open through it.
  const stageY = limbH * 0.62;
  const stR = 0.055 * S;
  g.add(part(box(stR * 2.2, 0.008 * S, stR * 2.0), LAB.blackJapan, 'stage', { pos: [0, stageY, 0] }));
  g.add(part(torus(0.012 * S, 0.004 * S, 4, 14), LAB.blackJapan, 'stage-aperture', { pos: [0, stageY, 0], rot: [Math.PI / 2, 0, 0] }));
  if (A.stage > 0) {
    // Spring clips hold the slide. Two of them, opposed.
    [-1, 1].forEach((s, i) => g.add(part(box(0.03 * S, 0.003 * S, 0.008 * S), LAB.steel, 'stage-clip-' + i, { pos: [s * stR * 0.6, stageY + 0.006 * S, stR * 0.5], rot: [0, 0, s * 0.05] })));
  }
  if (A.stage > 1) {
    // Mechanical stage: two screws at right angles, which is the whole idea.
    g.add(part(box(stR * 1.8, 0.012 * S, 0.014 * S), LAB.brass, 'stage-x-carriage', { pos: [0, stageY + 0.012 * S, -stR * 0.7] }));
    g.add(part(cyl(0.008 * S, 0.008 * S, 0.03 * S, 8), LAB.brass, 'stage-x-knob', { pos: [stR * 1.0, stageY + 0.012 * S, -stR * 0.7], rot: [0, 0, Math.PI / 2] }));
    g.add(part(cyl(0.008 * S, 0.008 * S, 0.03 * S, 8), LAB.brass, 'stage-y-knob', { pos: [-stR * 0.9, stageY + 0.012 * S, -stR * 0.2], rot: [Math.PI / 2, 0, 0] }));
  }
  // Substage mirror: the illumination. Below the stage, tilting.
  if (A.mirror > 0) {
    const my = stageY - 0.055 * S;
    g.add(part(cyl(0.006 * S, 0.006 * S, 0.05 * S, 6), LAB.blackJapan, 'mirror-arm', { pos: [0, my, -0.02 * S], rot: [0.4, 0, 0] }));
    g.add(part(lathe([[0.024 * S, 0], [0.026 * S, 0.004 * S], [0.024 * S, 0.008 * S]], 14), LAB.blackJapan, 'mirror-frame', { pos: [0, my - 0.01 * S, 0.006 * S], rot: [0.9, 0, 0] }));
    g.add(part(cyl(0.021 * S, 0.021 * S, 0.002 * S, 14), LAB.steel, 'mirror-face', { pos: [0, my - 0.008 * S, 0.008 * S], rot: [0.9, 0, 0] }));
    if (A.mirror > 1) {
      // Abbe condenser with an iris: focuses light into the specimen.
      g.add(part(lathe([[0.018 * S, 0], [0.022 * S, 0.012 * S], [0.012 * S, 0.024 * S]], 14), LAB.brass, 'condenser', { pos: [0, stageY - 0.03 * S, 0] }));
      g.add(part(torus(0.02 * S, 0.004 * S, 4, 14), LAB.brass, 'iris-diaphragm', { pos: [0, stageY - 0.036 * S, 0], rot: [Math.PI / 2, 0, 0] }));
      g.add(part(box(0.022 * S, 0.003 * S, 0.005 * S), LAB.brass, 'iris-lever', { pos: [0.028 * S, stageY - 0.036 * S, 0] }));
    }
  }
  // Body tube on a rack-and-pinion focus.
  const tubeY = stageY + 0.075 * S;
  const tubeLen = 0.11 * S + A.form * 0.012 * S;
  g.add(part(cyl(0.019 * S, 0.019 * S, tubeLen, 14), LAB.blackJapan, 'body-tube', { pos: [0, tubeY + tubeLen / 2, 0] }));
  g.add(part(cyl(0.021 * S, 0.023 * S, 0.02 * S, 14), LAB.brass, 'draw-tube', { pos: [0, tubeY + tubeLen + 0.008 * S, 0] }));
  g.add(part(lathe([[0.019 * S, 0], [0.024 * S, 0.008 * S], [0.02 * S, 0.02 * S]], 14), LAB.blackJapan, 'eyepiece', { pos: [0, tubeY + tubeLen + 0.018 * S, 0] }));
  g.add(part(box(0.01 * S, tubeLen * 0.7, 0.014 * S), LAB.steel, 'focus-rack', { pos: [0, tubeY + tubeLen * 0.45, -0.024 * S] }));
  [-1, 1].forEach((s, i) => g.add(part(lathe([[0.014 * S, 0], [0.017 * S, 0.006 * S], [0.014 * S, 0.012 * S]], 12), LAB.brass, 'coarse-focus-' + i, { pos: [s * 0.03 * S, tubeY + tubeLen * 0.3, -0.024 * S], rot: [0, 0, Math.PI / 2] })));
  if (A.form > 1) g.add(part(cyl(0.009 * S, 0.009 * S, 0.02 * S, 10), LAB.brass, 'fine-focus', { pos: [0, tubeY + tubeLen * 0.72, -0.03 * S], rot: [0, 0, Math.PI / 2] }));
  // Revolving nosepiece with objectives of DIFFERENT lengths — a high-power
  // objective is longer, which is why the turret has to clear the stage.
  const nose = new THREE.Group();
  nose.name = 'nosepiece';
  nose.add(part(lathe([[0.024 * S, 0], [0.026 * S, 0.006 * S], [0.022 * S, 0.012 * S]], 14), LAB.brass, 'nosepiece-turret'));
  const nObj = 1 + A.objectives;
  for (let i = 0; i < nObj; i++) {
    const a = (i / Math.max(1, nObj)) * T;
    const oL = (0.018 + i * 0.008) * S;
    const ox = nObj === 1 ? 0 : Math.cos(a) * 0.014 * S;
    const oz = nObj === 1 ? 0 : Math.sin(a) * 0.014 * S;
    nose.add(part(lathe([[0.008 * S, 0], [0.009 * S, oL * 0.7], [0.005 * S, oL]], 12), LAB.brass, 'objective-' + i, { pos: [ox, -oL, oz] }));
    nose.add(part(torus(0.0085 * S, 0.0015 * S, 3, 10), LAB.blackJapan, 'objective-band-' + i, { pos: [ox, -oL * 0.5, oz], rot: [Math.PI / 2, 0, 0] }));
  }
  nose.position.set(0, tubeY, 0);
  g.add(nose);
  // Slide box and prepared slides: the specimen has to come from somewhere.
  if (A.slides > 0) {
    const bx = 0.13 * S;
    g.add(part(box(0.09 * S, 0.03 * S, 0.06 * S), LAB.mahogany, 'slide-box', { pos: [bx, 0.015 * S, 0.04 * S] }));
    g.add(part(box(0.088 * S, 0.004 * S, 0.058 * S), LAB.mahogany, 'slide-box-lid', { pos: [bx, 0.032 * S, 0.04 * S], rot: [0, 0, 0] }));
    for (let i = 0; i < A.slides * 2; i++) {
      const sx = bx - 0.03 * S + i * 0.012 * S;
      g.add(part(box(0.012 * S, 0.0015 * S, 0.04 * S), LAB.glass, 'slide-' + i, { pos: [sx, 0.036 * S, 0.04 * S], rot: [0, 0, 0.04] }));
      g.add(part(box(0.005 * S, 0.0008 * S, 0.005 * S), i % 2 ? LAB.stain : LAB.stainBlue, 'section-' + i, { pos: [sx, 0.038 * S, 0.04 * S] }));
      g.add(part(box(0.011 * S, 0.0006 * S, 0.008 * S), LAB.label, 'slide-label-' + i, { pos: [sx, 0.038 * S, 0.055 * S] }));
    }
    // One slide on the stage, under the objective, where work happens.
    g.add(part(box(0.016 * S, 0.0015 * S, 0.05 * S), LAB.glass, 'slide-in-use', { pos: [0, stageY + 0.005 * S, 0] }));
    g.add(part(box(0.006 * S, 0.0008 * S, 0.006 * S), LAB.stain, 'section-in-use', { pos: [0, stageY + 0.007 * S, 0] }));
  }
  return seat(g);
}

/* ---------------------------------------------------------- DISTILLATION */
export const DISTIL_AXES = { vessel: 4, condenser: 3, heat: 3, receiver: 3, clamps: 3 };
export function distillationTrain(variant = 0) {
  const A = axesOf(variant, DISTIL_AXES);
  const rand = rnd(variant * 883 + 21);
  const g = new THREE.Group();
  // Retort stand: cast base, upright rod, bosses.
  g.add(part(box(0.26, 0.02, 0.17), LAB.blackJapan, 'stand-base', { pos: [-0.1, 0.01, 0] }));
  g.add(part(cyl(0.009, 0.009, 0.62, 10), LAB.steel, 'stand-rod', { pos: [-0.18, 0.32, 0] }));
  // Boiling vessel over its heat source.
  const R = 0.075, H = 0.14;
  const vy = 0.2;
  g.add(part(lathe(flaskProfile(A.vessel % 4, R, H), 16), LAB.glass, 'boiling-flask', { pos: [-0.1, vy, 0] }));
  g.add(part(lathe([[R * 0.72, 0], [R * 0.4, 0.008], [0, 0.011]], 14), LAB.stain, 'charge-liquid', { pos: [-0.1, vy + 0.012, 0] }));
  // Thermometer in the neck: you distil to a temperature, not to a time.
  g.add(part(cyl(0.004, 0.004, 0.13, 8), LAB.glass, 'thermometer', { pos: [-0.1, vy + H + 0.05, 0] }));
  g.add(part(cyl(0.005, 0.005, 0.02, 8), LAB.stain, 'thermometer-bulb', { pos: [-0.1, vy + H - 0.005, 0] }));
  g.add(part(lathe([[R * 0.28, 0], [R * 0.34, 0.012], [R * 0.26, 0.026]], 12), LAB.cork, 'flask-bung', { pos: [-0.1, vy + H, 0] }));
  // Still head elbow to the condenser.
  const condY = vy + H * 0.72;
  g.add(part(tube([[-0.1 + R * 0.2, vy + H + 0.005, 0], [-0.03, vy + H + 0.01, 0], [0.03, condY + 0.03, 0]], 0.008, 7), LAB.glass, 'still-head', {}));
  // Liebig condenser: inner tube inside a water jacket, counter-current, and
  // the inlet is at the LOW end so the jacket stays full.
  const cL = 0.2 + A.condenser * 0.06;
  const angle = -0.34;
  const cx = 0.16, cy2 = condY;
  const inner = part(cyl(0.009, 0.009, cL * 1.12, 12), LAB.glass, 'condenser-inner-tube', { pos: [cx, cy2 - cL * 0.16, 0], rot: [0, 0, Math.PI / 2 + angle] });
  g.add(inner);
  g.add(part(cyl(0.021, 0.021, cL, 14), LAB.glass, 'condenser-jacket', { pos: [cx, cy2 - cL * 0.16, 0], rot: [0, 0, Math.PI / 2 + angle] }));
  [-1, 1].forEach((s, i) => g.add(part(lathe([[0.021, 0], [0.026, 0.008], [0.021, 0.014]], 12), LAB.glass, 'jacket-seal-' + i, { pos: [cx + s * Math.cos(angle) * cL * 0.5, cy2 - cL * 0.16 - s * Math.sin(-angle) * cL * 0.5, 0], rot: [0, 0, Math.PI / 2 + angle] })));
  // Water inlet low, outlet high — labelled by position, which is the point.
  const loX = cx + Math.cos(angle) * cL * 0.42, loY = cy2 - cL * 0.16 + Math.sin(angle) * cL * 0.42;
  const hiX = cx - Math.cos(angle) * cL * 0.42, hiY = cy2 - cL * 0.16 - Math.sin(angle) * cL * 0.42;
  g.add(part(cyl(0.006, 0.006, 0.035, 8), LAB.glass, 'water-inlet-low', { pos: [loX, loY - 0.02, 0], rot: [0.6, 0, 0] }));
  g.add(part(cyl(0.006, 0.006, 0.035, 8), LAB.glass, 'water-outlet-high', { pos: [hiX, hiY + 0.02, 0], rot: [-0.6, 0, 0] }));
  g.add(part(tube([[loX, loY - 0.04, 0.01], [loX + 0.06, loY - 0.12, 0.06], [loX + 0.02, 0.02, 0.1]], 0.006, 6), LAB.rubber, 'inlet-tubing', {}));
  g.add(part(tube([[hiX, hiY + 0.04, 0.01], [hiX - 0.08, hiY + 0.02, 0.07], [hiX - 0.1, 0.03, 0.1]], 0.006, 6), LAB.rubber, 'outlet-tubing', {}));
  // Receiver: adapter into a flask, and it must be BELOW the condenser exit.
  const rx = cx + Math.cos(angle) * cL * 0.62;
  const ry = cy2 - cL * 0.16 + Math.sin(angle) * cL * 0.62;
  g.add(part(tube([[rx, ry, 0], [rx + 0.03, ry - 0.03, 0], [rx + 0.035, ry - 0.06, 0]], 0.007, 6), LAB.glass, 'receiver-adapter', {}));
  const rR = 0.05 + A.receiver * 0.008;
  g.add(part(lathe(flaskProfile(1, rR, rR * 1.7), 14), LAB.glass, 'receiver-flask', { pos: [rx + 0.035, Math.max(0.005, ry - 0.06 - rR * 1.7), 0] }));
  if (A.receiver > 1) g.add(part(lathe([[rR * 0.7, 0], [rR * 0.42, 0.006], [0, 0.008]], 12), LAB.spirit, 'distillate', { pos: [rx + 0.035, Math.max(0.006, ry - 0.06 - rR * 1.7) + 0.008, 0] }));
  // Heat source.
  if (A.heat === 0) {
    g.add(part(lathe([[0.035, 0], [0.04, 0.02], [0.03, 0.05], [0.016, 0.06]], 12), LAB.brass, 'spirit-lamp', { pos: [-0.1, 0.02, 0] }));
    g.add(part(cone(0.012, 0.05, 6), LAB.flame, 'lamp-flame', { pos: [-0.1, 0.105, 0] }));
  } else if (A.heat === 1) {
    g.add(part(lathe([[0.05, 0], [0.055, 0.012], [0.05, 0.03]], 14), LAB.enamel, 'sand-bath', { pos: [-0.1, 0.02, 0] }));
    g.add(part(lathe([[0.046, 0], [0.03, 0.008], [0, 0.01]], 12), MAT.boneLinen, 'bath-sand', { pos: [-0.1, 0.048, 0] }));
    g.add(part(cyl(0.014, 0.016, 0.055, 8), LAB.brass, 'burner-stem', { pos: [-0.1, 0.0, 0] }));
  } else {
    g.add(part(cyl(0.016, 0.02, 0.07, 10), LAB.blackJapan, 'burner-barrel', { pos: [-0.1, 0.035, 0] }));
    g.add(part(lathe([[0.03, 0], [0.032, 0.008], [0.028, 0.014]], 12), LAB.blackJapan, 'burner-base', { pos: [-0.1, 0, 0] }));
    g.add(part(cone(0.011, 0.045, 6), LAB.flame, 'burner-flame', { pos: [-0.1, 0.095, 0] }));
    g.add(part(torus(0.038, 0.004, 4, 14, Math.PI * 1.5), LAB.steel, 'tripod-ring', { pos: [-0.1, 0.13, 0], rot: [Math.PI / 2, 0, 0] }));
  }
  // Clamps: every joint is held, or the train falls apart.
  for (let i = 0; i < A.clamps; i++) {
    const yy = 0.16 + i * 0.14;
    g.add(part(box(0.03, 0.018, 0.022), LAB.brass, 'boss-head-' + i, { pos: [-0.18, yy, 0] }));
    g.add(part(cyl(0.005, 0.005, 0.09, 8), LAB.steel, 'clamp-arm-' + i, { pos: [-0.14, yy, 0], rot: [0, 0, Math.PI / 2] }));
    g.add(part(torus(0.016, 0.004, 4, 12, Math.PI * 1.3), LAB.brass, 'clamp-jaw-' + i, { pos: [-0.098, yy, 0], rot: [Math.PI / 2, 0, 0] }));
    g.add(part(cyl(0.004, 0.004, 0.016, 6), LAB.brass, 'clamp-screw-' + i, { pos: [-0.18, yy - 0.014, 0] }));
  }
  return seat(g);
}

/* -------------------------------------------------------------- CENTRIFUGE */
export const CENTRIFUGE_AXES = { drive: 3, buckets: 4, guard: 3, frame: 3, tubes: 2 };
export function centrifuge(variant = 0) {
  const A = axesOf(variant, CENTRIFUGE_AXES);
  const rand = rnd(variant * 641 + 27);
  const g = new THREE.Group();
  const H = 0.42 + A.frame * 0.06;
  const R = 0.13;
  // Column and base: a spinning rotor needs mass under it.
  g.add(part(lathe([[0.13, 0], [0.14, 0.015], [0.06, 0.05], [0.055, 0.07]], 16), LAB.blackJapan, 'base-column'));
  g.add(part(cyl(0.045, 0.05, H * 0.62, 12), LAB.blackJapan, 'column', { pos: [0, H * 0.31 + 0.05, 0] }));
  // Guard bowl: a bucket that flies off must be contained. Non-optional.
  if (A.guard > 0) {
    g.add(part(lathe([[R * 1.25, 0], [R * 1.3, 0.03], [R * 1.28, 0.1], [R * 1.16, 0.12]], 20), LAB.enamel, 'guard-bowl', { pos: [0, H * 0.86, 0] }));
    if (A.guard > 1) g.add(part(torus(R * 1.3, 0.008, 4, 22), LAB.steel, 'guard-rim', { pos: [0, H * 0.98, 0], rot: [Math.PI / 2, 0, 0] }));
    if (A.guard === 2) g.add(part(lathe([[R * 1.2, 0], [R * 0.7, 0.05], [0, 0.07]], 18), LAB.glass, 'guard-lid', { pos: [0, H * 1.0, 0] }));
  }
  // Swinging-bucket rotor: buckets hang at rest and swing out under spin.
  const rotor = new THREE.Group();
  rotor.name = 'rotor';
  rotor.add(part(lathe([[0.055, 0], [0.07, 0.012], [0.05, 0.026]], 14), LAB.steel, 'rotor-hub'));
  const nB = 2 + A.buckets;
  for (let i = 0; i < nB; i++) {
    const a = (i / nB) * T;
    const arm = new THREE.Group();
    arm.name = 'bucket-arm-' + i;
    arm.add(part(box(R * 0.9, 0.008, 0.014), LAB.steel, 'rotor-arm-' + i, { pos: [R * 0.45, 0, 0] }));
    const bucket = new THREE.Group();
    bucket.name = 'bucket-' + i;
    bucket.add(part(lathe([[0.016, 0], [0.019, 0.012], [0.018, 0.06], [0.02, 0.065]], 12), LAB.steel, 'bucket-cup-' + i, { pos: [0, -0.065, 0] }));
    bucket.add(part(torus(0.019, 0.003, 3, 10), LAB.steel, 'bucket-trunnion-' + i, { pos: [0, 0, 0], rot: [0, 0, Math.PI / 2] }));
    if (A.tubes) {
      bucket.add(part(cyl(0.011, 0.008, 0.05, 10), LAB.glass, 'tube-' + i, { pos: [0, -0.058, 0] }));
      bucket.add(part(cyl(0.0095, 0.006, 0.022, 10), i % 2 ? LAB.stain : LAB.culture, 'tube-charge-' + i, { pos: [0, -0.072, 0] }));
    }
    bucket.position.set(R * 0.9, 0, 0);
    arm.add(bucket);
    arm.rotation.y = a;
    rotor.add(arm);
  }
  rotor.position.set(0, H * 0.9, 0);
  g.add(rotor);
  // Drive.
  if (A.drive === 0) {
    // Hand crank through a step-up gear pair: the ratio is the point.
    g.add(part(cyl(0.008, 0.008, 0.16, 8), LAB.steel, 'crank-shaft', { pos: [R * 1.5, H * 0.5, 0], rot: [0, 0, Math.PI / 2] }));
    g.add(part(torus(0.055, 0.008, 4, 16), LAB.blackJapan, 'crank-wheel', { pos: [R * 1.45, H * 0.5, 0], rot: [0, Math.PI / 2, 0] }));
    g.add(part(cyl(0.007, 0.007, 0.05, 6), MAT.heartwood, 'crank-handle', { pos: [R * 1.45, H * 0.5 + 0.05, 0.03], rot: [Math.PI / 2, 0, 0] }));
    g.add(part(cyl(0.03, 0.03, 0.012, 14), LAB.steel, 'pinion', { pos: [0.05, H * 0.62, 0], rot: [0, 0, Math.PI / 2] }));
  } else if (A.drive === 1) {
    // Belt from a line shaft — consistent with the rest of this kit.
    g.add(part(lathe([[0.05, 0], [0.052, 0.01], [0.052, 0.026], [0.05, 0.036]], 16), LAB.blackJapan, 'drive-pulley', { pos: [0, H * 0.32, 0] }));
    g.add(part(box(0.014, H * 0.9, 0.004), MAT.darkOak, 'drive-belt', { pos: [0.05, H * 0.5, 0], rot: [0, 0, 0.04] }));
  } else {
    g.add(part(box(0.1, 0.09, 0.09), LAB.blackJapan, 'turbine-housing', { pos: [0, H * 0.28, -0.06] }));
    g.add(part(cyl(0.012, 0.012, 0.14, 10), LAB.brass, 'steam-feed', { pos: [0, H * 0.28, -0.14], rot: [Math.PI / 2, 0, 0] }));
    g.add(part(torus(0.02, 0.006, 4, 12), LAB.brass, 'feed-valve', { pos: [0, H * 0.28, -0.19], rot: [Math.PI / 2, 0, 0] }));
  }
  if (A.frame > 1) {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * T;
      g.add(part(cyl(0.008, 0.012, 0.05, 8), LAB.brass, 'levelling-foot-' + i, { pos: [Math.cos(a) * 0.1, 0.01, Math.sin(a) * 0.1] }));
    }
  }
  const out = seat(g);
  const restSwing = 0.0;
  out.userData.mech = {
    rpm: 900,
    work: 'Separates a suspension by spinning it; buckets swing out under load.',
    chain: ['drive', 'rotor hub', 'bucket arms', 'swinging buckets'],
    tick(t, running) {
      const w = running ? (this.rpm / 60) * T : 0;
      this._th = (this._th || 0) + w * (t - (this._last || t));
      this._last = t;
      rotor.rotation.y = this._th;
      // Buckets swing from hanging to horizontal as speed rises. This is the
      // readable physics of a centrifuge.
      const swing = running ? Math.PI / 2 * 0.92 : restSwing;
      rotor.children.forEach((arm) => {
        const b = arm.children && arm.children.find((c) => c.name && c.name.startsWith('bucket-'));
        if (b) b.rotation.z = -Math.PI / 2 + swing;
      });
    },
  };
  return out;
}

/* ------------------------------------------------------------------ BALANCE */
export const BALANCE_AXES = { form: 3, glassCase: 3, pans: 3, weights: 4, level: 2 };
export function analyticalBalance(variant = 0) {
  const A = axesOf(variant, BALANCE_AXES);
  const rand = rnd(variant * 1471 + 33);
  const g = new THREE.Group();
  const W = 0.34, D = 0.2, baseH = 0.035;
  g.add(part(box(W, baseH, D), LAB.mahogany, 'base-plinth', { pos: [0, baseH / 2, 0] }));
  if (A.level) {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * T;
      g.add(part(cyl(0.009, 0.013, 0.022, 10), LAB.brass, 'levelling-screw-' + i, { pos: [Math.cos(a) * W * 0.36, 0.011, Math.sin(a) * D * 0.32] }));
    }
    // Plumb bob or spirit level: an analytical balance must be level.
    g.add(part(lathe([[0.012, 0], [0.014, 0.004], [0.012, 0.008]], 12), LAB.brass, 'level-vial-mount', { pos: [-W * 0.32, baseH + 0.005, D * 0.28] }));
    g.add(part(cyl(0.008, 0.008, 0.024, 10), LAB.glass, 'spirit-level', { pos: [-W * 0.32, baseH + 0.012, D * 0.28], rot: [0, 0, Math.PI / 2] }));
  }
  // Pillar and beam. THREE agate knife edges: one central, two at the ends.
  const pillarH = 0.2;
  g.add(part(lathe([[0.03, 0], [0.024, 0.02], [0.018, pillarH * 0.9], [0.022, pillarH]], 14), LAB.brass, 'pillar', { pos: [0, baseH, 0] }));
  const beamY = baseH + pillarH;
  const beamL = W * 0.78;
  const beam = new THREE.Group();
  beam.name = 'beam';
  // Trussed beam: pierced triangles, which is how a real balance beam is stiff and light.
  beam.add(part(box(beamL, 0.012, 0.008), LAB.brass, 'beam-spine'));
  for (let i = 0; i < 6; i++) {
    const x = -beamL * 0.42 + i * beamL * 0.168;
    beam.add(part(box(0.006, 0.03, 0.006), LAB.brass, 'beam-strut-' + i, { pos: [x, -0.016, 0], rot: [0, 0, i % 2 ? 0.5 : -0.5] }));
  }
  beam.add(part(box(beamL * 0.9, 0.006, 0.006), LAB.brass, 'beam-lower-chord', { pos: [0, -0.03, 0] }));
  [-1, 1].forEach((s, i) => {
    beam.add(part(cone(0.006, 0.012, 4), LAB.steel, 'end-knife-edge-' + i, { pos: [s * beamL * 0.5, -0.008, 0], rot: [Math.PI, 0, 0] }));
    beam.add(part(torus(0.008, 0.002, 3, 10), LAB.brass, 'stirrup-hook-' + i, { pos: [s * beamL * 0.5, -0.018, 0], rot: [Math.PI / 2, 0, 0] }));
  });
  beam.add(part(cone(0.007, 0.014, 4), LAB.steel, 'centre-knife-edge', { pos: [0, -0.01, 0], rot: [Math.PI, 0, 0] }));
  // Pointer down to a scale — how the reading is actually taken.
  beam.add(part(box(0.004, pillarH * 0.62, 0.003), LAB.brass, 'pointer', { pos: [0, -pillarH * 0.34, 0] }));
  // Rider on the beam for fine adjustment.
  beam.add(part(box(0.008, 0.006, 0.005), LAB.brass, 'rider', { pos: [beamL * 0.2, 0.008, 0] }));
  beam.position.set(0, beamY, 0);
  g.add(beam);
  g.add(part(box(0.05, 0.012, 0.02), LAB.enamel, 'pointer-scale', { pos: [0, baseH + pillarH * 0.34, 0.012] }));
  for (let i = 0; i < 9; i++) g.add(part(box(0.0008, 0.006, 0.002), LAB.blackJapan, 'scale-tick-' + i, { pos: [-0.02 + i * 0.005, baseH + pillarH * 0.34, 0.022] }));
  // Pans on stirrups.
  const pans = [];
  [-1, 1].forEach((s, i) => {
    const px = s * beamL * 0.5;
    const pan = new THREE.Group();
    pan.name = 'pan-' + i;
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * T;
      pan.add(part(cyl(0.0012, 0.0012, 0.06, 4), LAB.brass, 'pan-suspension-' + i + '-' + k, { pos: [Math.cos(a) * 0.022, -0.03, Math.sin(a) * 0.022], rot: [Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35] }));
    }
    pan.add(part(lathe([[0.032, 0], [0.034, 0.004], [0.03, 0.008]], 16), LAB.brass, 'pan-dish-' + i, { pos: [0, -0.062, 0] }));
    pan.position.set(px, beamY - 0.018, 0);
    g.add(pan);
    pans.push(pan);
  });
  // Weight set in a fitted case — where the mass actually comes from.
  if (A.weights > 0) {
    const cx = W * 0.72;
    g.add(part(box(0.12, 0.03, 0.075), LAB.mahogany, 'weight-case', { pos: [cx, 0.015, 0] }));
    g.add(part(box(0.118, 0.005, 0.073), LAB.mahogany, 'case-lid', { pos: [cx, 0.033, 0] }));
    const n = 2 + A.weights;
    for (let i = 0; i < n; i++) {
      const r = 0.004 + i * 0.0022;
      g.add(part(lathe([[r, 0], [r, r * 1.6], [r * 0.55, r * 1.9], [r * 0.6, r * 2.1]], 10), LAB.brass, 'weight-' + i, { pos: [cx - 0.045 + i * 0.018, 0.034, -0.018] }));
    }
    // Fractional weights are foil, handled with forceps.
    for (let i = 0; i < 3; i++) g.add(part(box(0.005, 0.0004, 0.005), LAB.steel, 'foil-weight-' + i, { pos: [cx - 0.03 + i * 0.012, 0.036, 0.018], rot: [0, i * 0.4, 0] }));
    g.add(part(box(0.055, 0.002, 0.004), LAB.steel, 'forceps', { pos: [cx + 0.02, 0.037, 0.024], rot: [0, 0.3, 0] }));
  }
  // Glazed case: draughts ruin a weighing, so the balance lives in a box.
  if (A.glassCase > 0) {
    const cH = beamY + 0.08;
    const cW = W * 1.06, cD = D * 1.1;
    [-1, 1].forEach((s, i) => {
      g.add(part(box(cW, cH, 0.004), LAB.glass, 'case-front-' + i, { pos: [0, cH / 2, s * cD / 2] }));
      g.add(part(box(0.004, cH, cD), LAB.glass, 'case-side-' + i, { pos: [s * cW / 2, cH / 2, 0] }));
    });
    g.add(part(box(cW, 0.004, cD), LAB.glass, 'case-top', { pos: [0, cH, 0] }));
    for (let i = 0; i < 4; i++) {
      const sx = i % 2 ? 1 : -1, sz = i < 2 ? 1 : -1;
      g.add(part(box(0.008, cH, 0.008), LAB.mahogany, 'case-mullion-' + i, { pos: [sx * cW / 2, cH / 2, sz * cD / 2] }));
    }
    if (A.glassCase > 1) {
      g.add(part(box(cW * 0.4, 0.012, 0.01), LAB.mahogany, 'sash-lift', { pos: [0, cH * 0.52, cD / 2 + 0.006] }));
      g.add(part(cyl(0.006, 0.006, 0.03, 8), LAB.brass, 'arrestment-knob', { pos: [0, 0.02, cD / 2 + 0.02], rot: [Math.PI / 2, 0, 0] }));
    }
  }
  const out = seat(g);
  out.userData.mech = {
    rpm: 6,
    work: 'Weighs to a fraction of a grain on three agate knife edges.',
    chain: ['weight in pan', 'end knife edge', 'trussed beam', 'centre knife edge', 'pointer', 'scale'],
    tick(t, running) {
      // A balance does not spin; it swings and settles. Damped oscillation is
      // the honest animation for it.
      const el = t - (this._t0 || (this._t0 = t));
      const amp = running ? 0.055 * Math.exp(-el * 0.35) : 0;
      const a = amp * Math.sin(el * 3.1);
      beam.rotation.z = a;
      pans.forEach((p, i) => { p.position.y = (beamY - 0.018) + (i ? 1 : -1) * a * beamL * 0.5; });
    },
  };
  return out;
}

/* -------------------------------------------------------- SPECIMEN SHELVING */
export const SPECIMEN_AXES = { tiers: 4, jars: 4, size: 3, labels: 3, fluid: 2 };
export function specimenShelf(variant = 0) {
  const A = axesOf(variant, SPECIMEN_AXES);
  const rand = rnd(variant * 1699 + 39);
  const g = new THREE.Group();
  const tiers = 2 + A.tiers;
  const W = 1.15;
  const D = 0.34;
  const tierH = 0.34;
  const H = tiers * tierH + 0.1;
  [-1, 1].forEach((s, i) => {
    g.add(part(box(0.04, H, D), LAB.mahogany, 'case-side-' + i, { pos: [s * W / 2, H / 2, 0] }));
  });
  g.add(part(box(W, 0.04, D), LAB.mahogany, 'case-top', { pos: [0, H, 0] }));
  g.add(part(box(W, 0.06, D), LAB.mahogany, 'case-plinth', { pos: [0, 0.03, 0] }));
  g.add(part(box(W, H, 0.02), LAB.mahogany, 'case-back', { pos: [0, H / 2, -D / 2] }));
  for (let t = 0; t < tiers; t++) {
    const sy = 0.06 + t * tierH;
    g.add(part(box(W * 0.98, 0.022, D * 0.94), LAB.mahogany, 'shelf-' + t, { pos: [0, sy, 0] }));
    const n = 2 + A.jars;
    for (let i = 0; i < n; i++) {
      // Jars vary in size because specimens do. A shelf of identical jars is
      // the giveaway that nothing real is inside them.
      const jr = (0.045 + rand() * 0.035) * (0.8 + A.size * 0.14);
      const jh = jr * (1.7 + rand() * 1.1);
      const x = -W * 0.42 + (W * 0.84 / Math.max(1, n - 1)) * i + (rand() - 0.5) * 0.01;
      const z = (rand() - 0.5) * D * 0.15;
      const cyl0 = rand() > 0.4;
      const prof = cyl0
        ? [[jr, 0], [jr, jh * 0.9], [jr * 0.92, jh * 0.96], [jr * 0.95, jh]]
        : [[jr * 0.86, 0], [jr, jh * 0.2], [jr * 0.98, jh * 0.78], [jr * 0.7, jh * 0.95], [jr * 0.74, jh]];
      g.add(part(lathe(prof, 16), LAB.glassThick, 'jar-' + t + '-' + i, { pos: [x, sy + 0.011, z] }));
      // Fluid level below the shoulder, with a visible meniscus.
      const fl = jh * (0.62 + rand() * 0.22);
      g.add(part(lathe(prof.filter((p) => p[1] <= fl).concat([[jr * 0.94, fl]]), 16), rand() > 0.55 ? LAB.spirit : LAB.spiritDark, 'fluid-' + t + '-' + i, { pos: [x, sy + 0.012, z] }));
      // Specimen: a suspended irregular mass, not a neat shape.
      const sp = ico(jr * (0.4 + rand() * 0.24), 1);
      jitter(sp, jr * 0.16, rand);
      sp.scale(1, 0.7 + rand() * 0.7, 0.86);
      g.add(part(sp, LAB.specimen, 'specimen-' + t + '-' + i, { pos: [x, sy + 0.012 + fl * (0.3 + rand() * 0.35), z], rot: [rand(), rand() * T, rand() * 0.5] }));
      if (A.fluid) {
        // Thread and glass rod mount: how a wet specimen is actually held.
        g.add(part(cyl(jr * 0.05, jr * 0.05, fl * 0.9, 5), LAB.glass, 'mount-rod-' + t + '-' + i, { pos: [x, sy + 0.012 + fl * 0.5, z] }));
        for (let k = 0; k < 2; k++) g.add(part(torus(jr * 0.2, jr * 0.02, 3, 8), MAT.boneLinen, 'mount-thread-' + t + '-' + i + '-' + k, { pos: [x, sy + 0.012 + fl * (0.36 + k * 0.24), z], rot: [Math.PI / 2, 0, 0] }));
      }
      // Lid: ground stopper or a sealed cover with a tie.
      if (rand() > 0.5) {
        g.add(part(lathe([[jr * 0.96, 0], [jr, 0.008], [jr * 0.5, 0.018], [jr * 0.52, 0.024]], 14), LAB.glassThick, 'ground-lid-' + t + '-' + i, { pos: [x, sy + 0.012 + jh, z] }));
      } else {
        g.add(part(cyl(jr * 1.02, jr * 1.02, 0.006, 14), MAT.boneLinen, 'sealed-cover-' + t + '-' + i, { pos: [x, sy + 0.014 + jh, z] }));
        g.add(part(torus(jr * 1.0, 0.003, 3, 12), MAT.ropeHemp, 'cover-tie-' + t + '-' + i, { pos: [x, sy + 0.01 + jh, z], rot: [Math.PI / 2, 0, 0] }));
        g.add(part(lathe([[jr * 0.3, 0], [jr * 0.34, 0.004], [0, 0.006]], 10), LAB.stain, 'wax-seal-' + t + '-' + i, { pos: [x, sy + 0.02 + jh, z] }));
      }
      // Accession label: a specimen without a number is not a specimen.
      if (A.labels > 0) {
        g.add(part(box(jr * 1.3, jh * 0.26, 0.001), LAB.label, 'label-' + t + '-' + i, { pos: [x, sy + 0.012 + jh * 0.34, z + jr * 1.01] }));
        for (let l = 0; l < A.labels; l++) g.add(part(box(jr * 0.9, 0.0016, 0.0006), LAB.blackJapan, 'label-line-' + t + '-' + i + '-' + l, { pos: [x, sy + 0.012 + jh * (0.4 - l * 0.06), z + jr * 1.015] }));
      }
    }
  }
  return seat(g);
}

/* --------------------------------------------------------- DISSECTION TABLE */
export const DISSECT_AXES = { form: 3, drain: 3, tray: 4, lamp: 3, gutter: 2 };
export function dissectionTable(variant = 0) {
  const A = axesOf(variant, DISSECT_AXES);
  const rand = rnd(variant * 811 + 45);
  const g = new THREE.Group();
  const W = 1.85, D = 0.72, H = 0.88;
  const topMat = [LAB.slate, LAB.enamel, MAT.springStone][A.form];
  // Top with a fall toward the drain: fluid has to run somewhere.
  const top = box(W, 0.06, D, 6, 1, 3);
  const p = top.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const tx = (p.getX(i) + W / 2) / W;
    if (p.getY(i) > 0) p.setY(i, p.getY(i) - tx * 0.022);
  }
  p.needsUpdate = true; top.computeVertexNormals();
  g.add(part(top, topMat, 'table-top', { pos: [0, H, 0] }));
  // Gutter around the perimeter.
  if (A.gutter) {
    [-1, 1].forEach((s, i) => g.add(part(box(W, 0.02, 0.03), topMat, 'gutter-rail-' + i, { pos: [0, H + 0.035, s * D * 0.47] })));
    g.add(part(box(0.03, 0.02, D), topMat, 'gutter-head', { pos: [-W * 0.48, H + 0.035, 0] }));
  }
  // Legs: tubular, so it can be hosed down.
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((c, i) => {
    g.add(part(cyl(0.026, 0.03, H, 12), LAB.steel, 'leg-' + i, { pos: [c[0] * W * 0.44, H / 2, c[1] * D * 0.38] }));
    g.add(part(lathe([[0.035, 0], [0.03, 0.012], [0.026, 0.02]], 10), LAB.steel, 'leg-foot-' + i, { pos: [c[0] * W * 0.44, 0, c[1] * D * 0.38] }));
  });
  [-1, 1].forEach((s, i) => g.add(part(cyl(0.016, 0.016, W * 0.88, 8), LAB.steel, 'leg-rail-' + i, { pos: [0, H * 0.28, s * D * 0.38], rot: [0, 0, Math.PI / 2] })));
  // Drain, trap and pail.
  const dx = W * 0.42;
  g.add(part(lathe([[0.05, 0], [0.052, 0.006], [0.028, 0.018], [0.026, 0.024]], 14), LAB.steel, 'drain-boss', { pos: [dx, H - 0.03, 0], rot: [Math.PI, 0, 0] }));
  if (A.drain > 0) {
    g.add(part(cyl(0.022, 0.022, 0.24, 10), LAB.blackJapan, 'drain-pipe', { pos: [dx, H - 0.16, 0] }));
    g.add(part(torus(0.04, 0.021, 6, 14, Math.PI), LAB.blackJapan, 'drain-trap', { pos: [dx, H - 0.3, 0], rot: [Math.PI / 2, 0, 0] }));
  }
  if (A.drain > 1) {
    g.add(part(lathe([[0.1, 0], [0.12, 0.16], [0.125, 0.2]], 16), LAB.steel, 'collection-pail', { pos: [dx + 0.05, 0.01, 0] }));
    g.add(part(torus(0.115, 0.006, 4, 16), LAB.steel, 'pail-rim', { pos: [dx + 0.05, 0.21, 0], rot: [Math.PI / 2, 0, 0] }));
    g.add(part(torus(0.09, 0.004, 3, 14, Math.PI), LAB.steel, 'pail-bail', { pos: [dx + 0.05, 0.23, 0], rot: [0, Math.PI / 2, 0] }));
  }
  // Instrument tray: the actual tools, laid out in working order.
  if (A.tray > 0) {
    const tx = -W * 0.3;
    g.add(part(box(0.4, 0.018, 0.2), LAB.steel, 'instrument-tray', { pos: [tx, H + 0.03, -D * 0.24] }));
    [-1, 1].forEach((s, i) => g.add(part(box(0.4, 0.026, 0.008), LAB.steel, 'tray-lip-' + i, { pos: [tx, H + 0.045, -D * 0.24 + s * 0.1] })));
    const tools = 2 + A.tray;
    for (let i = 0; i < tools; i++) {
      const ix = tx - 0.16 + i * (0.32 / Math.max(1, tools - 1));
      const kind = i % 4;
      if (kind === 0) {
        g.add(part(box(0.075, 0.003, 0.006), LAB.steel, 'scalpel-blade-' + i, { pos: [ix, H + 0.042, -D * 0.24] }));
        g.add(part(box(0.05, 0.006, 0.008), LAB.blackJapan, 'scalpel-handle-' + i, { pos: [ix - 0.058, H + 0.043, -D * 0.24] }));
      } else if (kind === 1) {
        [-1, 1].forEach((s, k) => g.add(part(box(0.07, 0.0025, 0.004), LAB.steel, 'forceps-arm-' + i + '-' + k, { pos: [ix, H + 0.042, -D * 0.24 + s * 0.003], rot: [0, s * 0.04, 0] })));
      } else if (kind === 2) {
        g.add(part(box(0.06, 0.003, 0.005), LAB.steel, 'probe-' + i, { pos: [ix, H + 0.042, -D * 0.24] }));
        g.add(part(ico(0.004, 0), LAB.steel, 'probe-ball-' + i, { pos: [ix + 0.032, H + 0.043, -D * 0.24] }));
      } else {
        [-1, 1].forEach((s, k) => g.add(part(box(0.045, 0.003, 0.004), LAB.steel, 'scissor-blade-' + i + '-' + k, { pos: [ix + 0.014, H + 0.042, -D * 0.24 + s * 0.003], rot: [0, s * 0.09, 0] })));
        [-1, 1].forEach((s, k) => g.add(part(torus(0.008, 0.002, 3, 10), LAB.steel, 'scissor-bow-' + i + '-' + k, { pos: [ix - 0.026, H + 0.042, -D * 0.24 + s * 0.008], rot: [Math.PI / 2, 0, 0] })));
      }
    }
  }
  if (A.tray > 2) {
    // Dissecting board with pinned specimen: the work in progress.
    g.add(part(box(0.34, 0.022, 0.24), MAT.heartwood, 'dissecting-board', { pos: [-W * 0.02, H + 0.032, D * 0.06] }));
    g.add(part(lathe([[0.05, 0], [0.075, 0.02], [0.06, 0.05], [0.03, 0.062]], 12), LAB.specimen, 'specimen-open', { pos: [-W * 0.02, H + 0.043, D * 0.06] }));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * T;
      g.add(part(cyl(0.0016, 0.0016, 0.03, 4), LAB.steel, 'pin-' + i, { pos: [-W * 0.02 + Math.cos(a) * 0.09, H + 0.05, D * 0.06 + Math.sin(a) * 0.07], rot: [0.3, 0, 0] }));
    }
  }
  // Lamp: dissection needs light exactly where the hands are.
  if (A.lamp > 0) {
    const lx = W * 0.28;
    g.add(part(cyl(0.014, 0.018, 0.5, 10), LAB.blackJapan, 'lamp-post', { pos: [lx, H + 0.25, -D * 0.36] }));
    g.add(part(cyl(0.01, 0.01, 0.26, 8), LAB.blackJapan, 'lamp-arm', { pos: [lx - 0.12, H + 0.48, -D * 0.24], rot: [0.5, 0, 1.1] }));
    g.add(part(lathe([[0.055, 0], [0.06, 0.02], [0.02, 0.05], [0.018, 0.056]], 14), LAB.enamel, 'lamp-shade', { pos: [lx - 0.24, H + 0.42, -D * 0.1], rot: [Math.PI, 0, 0.2] }));
    g.add(part(ico(0.016, 1), LAB.flame, 'lamp-source', { pos: [lx - 0.24, H + 0.4, -D * 0.1] }));
    if (A.lamp > 1) g.add(part(lathe([[0.03, 0], [0.034, 0.03], [0.026, 0.06]], 12), LAB.brass, 'lamp-reservoir', { pos: [lx, H + 0.02, -D * 0.36] }));
  }
  return seat(g);
}

/* ---------------------------------------------------------------- INCUBATOR */
export const INCUBATOR_AXES = { form: 3, shelves: 3, control: 3, cultures: 4, door: 2 };
export function cultureIncubator(variant = 0) {
  const A = axesOf(variant, INCUBATOR_AXES);
  const rand = rnd(variant * 967 + 51);
  const g = new THREE.Group();
  const W = 0.5 + A.form * 0.1, D = 0.42, H = 0.62 + A.form * 0.12;
  const standH = 0.5;
  // Stand.
  for (let i = 0; i < 4; i++) {
    const sx = i % 2 ? 1 : -1, sz = i < 2 ? 1 : -1;
    g.add(part(cyl(0.014, 0.018, standH, 8), LAB.steel, 'stand-leg-' + i, { pos: [sx * W * 0.4, standH / 2, sz * D * 0.36] }));
  }
  g.add(part(box(W * 0.9, 0.016, D * 0.8), LAB.steel, 'stand-shelf', { pos: [0, standH * 0.3, 0] }));
  // Double-walled cabinet: the water jacket IS the thermostat. Copper outer,
  // and the jacket is why the walls are thick.
  const by = standH;
  g.add(part(box(W, H, D), LAB.blackJapan, 'outer-case', { pos: [0, by + H / 2, 0] }));
  g.add(part(box(W * 0.86, H * 0.88, D * 0.84), LAB.brassDull, 'water-jacket', { pos: [0, by + H / 2, 0] }));
  g.add(part(box(W * 0.76, H * 0.8, D * 0.74), LAB.enamel, 'chamber', { pos: [0, by + H / 2, 0.01] }));
  // Filling funnel and gauge glass for the jacket.
  g.add(part(lathe([[0.03, 0], [0.034, 0.014], [0.012, 0.04], [0.013, 0.05]], 12), LAB.brass, 'jacket-funnel', { pos: [-W * 0.3, by + H, 0], rot: [Math.PI, 0, 0] }));
  g.add(part(cyl(0.006, 0.006, H * 0.6, 8), LAB.glass, 'gauge-glass', { pos: [-W * 0.52, by + H * 0.5, D * 0.3] }));
  [-1, 1].forEach((s, i) => g.add(part(lathe([[0.011, 0], [0.013, 0.006], [0.011, 0.012]], 10), LAB.brass, 'gauge-fitting-' + i, { pos: [-W * 0.52, by + H * 0.5 + s * H * 0.3, D * 0.3] })));
  // Thermometer through the roof into the chamber.
  g.add(part(cyl(0.005, 0.005, H * 0.5, 8), LAB.glass, 'thermometer', { pos: [W * 0.16, by + H * 0.9, 0] }));
  g.add(part(lathe([[0.014, 0], [0.016, 0.008], [0.012, 0.016]], 10), LAB.brass, 'thermometer-collar', { pos: [W * 0.16, by + H, 0] }));
  // Thermostat: a capsule or gas regulator, which is the control element.
  if (A.control > 0) {
    g.add(part(lathe([[0.026, 0], [0.03, 0.03], [0.022, 0.055]], 12), LAB.brass, 'thermostat-capsule', { pos: [W * 0.42, by + H * 0.2, D * 0.3] }));
    g.add(part(cyl(0.005, 0.005, 0.1, 8), LAB.brass, 'thermostat-linkage', { pos: [W * 0.42, by + H * 0.32, D * 0.3] }));
    if (A.control > 1) {
      g.add(part(torus(0.018, 0.005, 4, 12), LAB.brass, 'gas-regulator', { pos: [W * 0.42, by - 0.04, D * 0.3], rot: [Math.PI / 2, 0, 0] }));
      g.add(part(tube([[W * 0.42, by - 0.06, D * 0.3], [W * 0.3, by - 0.2, D * 0.2], [0, by - 0.3, 0]], 0.006, 6), LAB.rubber, 'gas-tubing', {}));
    }
  }
  // Heat source under the jacket.
  g.add(part(cyl(0.016, 0.02, 0.06, 10), LAB.blackJapan, 'burner', { pos: [0, by - 0.06, 0] }));
  g.add(part(cone(0.01, 0.04, 6), LAB.flame, 'burner-flame', { pos: [0, by - 0.01, 0] }));
  // Door with a small observation pane.
  const doorAng = A.door ? 0.9 : 0.06;
  const door = new THREE.Group();
  door.name = 'door';
  door.add(part(box(W * 0.96, H * 0.9, 0.02), LAB.blackJapan, 'door-panel', { pos: [W * 0.48, 0, 0] }));
  door.add(part(box(W * 0.34, H * 0.3, 0.006), LAB.glass, 'observation-pane', { pos: [W * 0.48, H * 0.16, 0.012] }));
  door.add(part(cyl(0.008, 0.008, 0.05, 8), LAB.brass, 'door-handle', { pos: [W * 0.9, 0, 0.03], rot: [Math.PI / 2, 0, 0] }));
  door.position.set(-W * 0.48, by + H / 2, D / 2 + 0.012);
  door.rotation.y = doorAng;
  g.add(door);
  // Cultures on shelves: plates and slopes, stacked as they really are.
  const tiers = 1 + A.shelves;
  for (let t = 0; t < tiers; t++) {
    const sy = by + H * (0.2 + t * (0.62 / tiers));
    g.add(part(box(W * 0.72, 0.008, D * 0.68), LAB.steel, 'wire-shelf-' + t, { pos: [0, sy, 0.01] }));
    for (let k = 0; k < 4; k++) g.add(part(cyl(0.0016, 0.0016, D * 0.66, 4), LAB.steel, 'shelf-wire-' + t + '-' + k, { pos: [-W * 0.28 + k * W * 0.19, sy + 0.005, 0.01], rot: [Math.PI / 2, 0, 0] }));
    const n = 1 + A.cultures;
    for (let i = 0; i < n; i++) {
      const kind = (i + t) % 3;
      const cx = -W * 0.26 + (W * 0.52 / Math.max(1, n - 1)) * i;
      if (kind === 0) {
        // Petri dish: base plus a slightly larger lid, with medium inside.
        const stack = 1 + (i % 2);
        for (let s = 0; s < stack; s++) {
          const py = sy + 0.008 + s * 0.016;
          g.add(part(cyl(0.036, 0.036, 0.008, 16), LAB.glass, 'dish-base-' + t + '-' + i + '-' + s, { pos: [cx, py, 0.01] }));
          g.add(part(lathe([[0.03, 0], [0.02, 0.001], [0, 0.0015]], 14), LAB.culture, 'medium-' + t + '-' + i + '-' + s, { pos: [cx, py + 0.002, 0.01] }));
          g.add(part(cyl(0.038, 0.038, 0.007, 16), LAB.glass, 'dish-lid-' + t + '-' + i + '-' + s, { pos: [cx, py + 0.008, 0.01] }));
          for (let c = 0; c < 3; c++) g.add(part(ico(0.0035, 0), LAB.specimen, 'colony-' + t + '-' + i + '-' + s + '-' + c, { pos: [cx + (rand() - 0.5) * 0.04, py + 0.004, 0.01 + (rand() - 0.5) * 0.04] }));
        }
      } else if (kind === 1) {
        // Agar slope in a stoppered tube, held at an angle in a rack.
        g.add(part(cyl(0.011, 0.011, 0.09, 10), LAB.glass, 'slope-tube-' + t + '-' + i, { pos: [cx, sy + 0.05, 0.01], rot: [0, 0, 0.22] }));
        g.add(part(box(0.016, 0.03, 0.014), LAB.culture, 'agar-slope-' + t + '-' + i, { pos: [cx - 0.006, sy + 0.026, 0.01], rot: [0, 0, 0.22] }));
        g.add(part(cyl(0.009, 0.009, 0.012, 8), MAT.boneLinen, 'cotton-plug-' + t + '-' + i, { pos: [cx + 0.011, sy + 0.096, 0.01], rot: [0, 0, 0.22] }));
      } else {
        g.add(part(lathe(flaskProfile(2, 0.03, 0.06), 14), LAB.glass, 'culture-flask-' + t + '-' + i, { pos: [cx, sy + 0.008, 0.01] }));
        g.add(part(lathe([[0.024, 0], [0.014, 0.004], [0, 0.006]], 12), LAB.culture, 'broth-' + t + '-' + i, { pos: [cx, sy + 0.012, 0.01] }));
        g.add(part(cyl(0.014, 0.014, 0.014, 8), MAT.boneLinen, 'flask-plug-' + t + '-' + i, { pos: [cx, sy + 0.07, 0.01] }));
      }
    }
  }
  return seat(g);
}

/* --------------------------------------------------------------- HERBARIUM */
export const HERBARIUM_AXES = { form: 3, press: 3, sheets: 4, cabinet: 3, labels: 2 };
export function herbariumStation(variant = 0) {
  const A = axesOf(variant, HERBARIUM_AXES);
  const rand = rnd(variant * 1213 + 57);
  const g = new THREE.Group();
  const W = 0.62, D = 0.46;
  // Cabinet of shallow drawers: mounted sheets are stored flat, always.
  const drawers = 4 + A.cabinet;
  const dh = 0.06;
  const cH = drawers * dh + 0.08;
  g.add(part(box(W, cH, D), LAB.mahogany, 'cabinet-carcase', { pos: [0, cH / 2, 0] }));
  for (let i = 0; i < drawers; i++) {
    const y = 0.05 + i * dh;
    const open = i === Math.floor(drawers / 2) && A.cabinet > 1;
    g.add(part(box(W * 0.94, dh * 0.86, 0.018), LAB.mahogany, 'drawer-front-' + i, { pos: [0, y, D / 2 + (open ? 0.14 : 0.001)] }));
    g.add(part(box(W * 0.2, 0.01, 0.024), LAB.brass, 'drawer-pull-' + i, { pos: [0, y, D / 2 + (open ? 0.152 : 0.012)] }));
    if (A.labels) g.add(part(box(W * 0.26, dh * 0.3, 0.001), LAB.label, 'drawer-label-' + i, { pos: [0, y + dh * 0.24, D / 2 + (open ? 0.15 : 0.011)] }));
    if (open) {
      g.add(part(box(W * 0.9, 0.012, D * 0.8), LAB.mahogany, 'drawer-tray', { pos: [0, y - dh * 0.3, D / 2 + 0.14 - D * 0.4] }));
      for (let s = 0; s < 3; s++) {
        g.add(part(box(W * 0.8, 0.002, D * 0.66), MAT.boneLinen, 'stored-sheet-' + s, { pos: [0, y - dh * 0.28 + s * 0.003, D / 2 + 0.14 - D * 0.4], rot: [0, (rand() - 0.5) * 0.03, 0] }));
      }
    }
  }
  // The press: two boards, webbing straps, and a screw if it is a screw press.
  const px = W * 0.9;
  const pw = 0.32, pd = 0.24;
  const stack = 2 + A.sheets;
  let py = 0;
  g.add(part(box(pw, 0.022, pd), MAT.heartwood, 'press-lower-board', { pos: [px, 0.011, 0] }));
  py = 0.022;
  for (let i = 0; i < stack; i++) {
    // Alternating blotting paper and mounted specimens — a press is a sandwich.
    g.add(part(box(pw * 0.94, 0.006, pd * 0.94), MAT.boneLinen, 'blotter-' + i, { pos: [px, py + 0.003, 0] }));
    py += 0.006;
    if (i % 2 === 0) {
      g.add(part(box(pw * 0.9, 0.0015, pd * 0.9), LAB.label, 'specimen-sheet-' + i, { pos: [px, py + 0.001, 0] }));
      // A pressed plant: flattened stem with a few leaf pads.
      g.add(part(box(pw * 0.5, 0.0018, 0.004), MAT.reedPale, 'pressed-stem-' + i, { pos: [px, py + 0.003, 0], rot: [0, (rand() - 0.5) * 0.3, 0] }));
      for (let l = 0; l < 4; l++) {
        const lp = ico(0.016 + rand() * 0.01, 0);
        lp.scale(1.5, 0.06, 1.1);
        g.add(part(lp, MAT.graveMoss, 'pressed-leaf-' + i + '-' + l, { pos: [px - pw * 0.18 + l * pw * 0.12, py + 0.004, (rand() - 0.5) * 0.05], rot: [0, rand() * T, 0] }));
      }
      py += 0.004;
    }
  }
  g.add(part(box(pw, 0.022, pd), MAT.heartwood, 'press-upper-board', { pos: [px, py + 0.011, 0] }));
  const topY = py + 0.022;
  if (A.press === 0) {
    // Webbing straps with buckles.
    [-1, 1].forEach((s, i) => {
      g.add(part(box(0.03, topY + 0.01, 0.006), MAT.ropeHemp, 'press-strap-' + i, { pos: [px + s * pw * 0.3, topY / 2, pd * 0.5] }));
      g.add(part(box(0.03, 0.006, pd * 1.02), MAT.ropeHemp, 'press-strap-top-' + i, { pos: [px + s * pw * 0.3, topY + 0.004, 0] }));
      g.add(part(box(0.024, 0.016, 0.01), LAB.brass, 'strap-buckle-' + i, { pos: [px + s * pw * 0.3, topY * 0.6, pd * 0.52] }));
    });
  } else {
    // Screw press: two uprights and a cross-head with a wooden handle.
    [-1, 1].forEach((s, i) => g.add(part(cyl(0.012, 0.012, topY + 0.24, 8), LAB.steel, 'press-upright-' + i, { pos: [px + s * pw * 0.42, (topY + 0.24) / 2, 0] })));
    g.add(part(box(pw * 0.95, 0.03, 0.04), LAB.steel, 'press-crosshead', { pos: [px, topY + 0.2, 0] }));
    g.add(part(cyl(0.014, 0.014, 0.16, 10), LAB.steel, 'press-screw', { pos: [px, topY + 0.14, 0] }));
    for (let i = 0; i < 8; i++) g.add(part(torus(0.016, 0.003, 3, 10), LAB.steel, 'screw-thread-' + i, { pos: [px, topY + 0.075 + i * 0.017, 0], rot: [Math.PI / 2, 0, 0] }));
    g.add(part(cyl(0.008, 0.008, 0.16, 8), MAT.heartwood, 'press-handle', { pos: [px, topY + 0.23, 0], rot: [Math.PI / 2, 0, 0] }));
  }
  // Mounting bench items: gum, brush, forceps, and the sheet being worked.
  if (A.form > 0) {
    const mx = -W * 0.85;
    g.add(part(box(0.4, 0.02, 0.32), MAT.darkOak, 'mounting-board', { pos: [mx, 0.01, 0] }));
    g.add(part(box(0.34, 0.0018, 0.26), LAB.label, 'sheet-in-work', { pos: [mx, 0.021, 0] }));
    g.add(part(lathe([[0.022, 0], [0.026, 0.012], [0.02, 0.04], [0.012, 0.046]], 12), LAB.glass, 'gum-pot', { pos: [mx + 0.14, 0.02, -0.1] }));
    g.add(part(cyl(0.0035, 0.0035, 0.09, 6), MAT.heartwood, 'gum-brush', { pos: [mx + 0.14, 0.06, -0.1], rot: [0.3, 0, 0.3] }));
    g.add(part(cone(0.005, 0.02, 5), MAT.boneLinen, 'brush-bristles', { pos: [mx + 0.155, 0.106, -0.092], rot: [0.3, 0, 0.3] }));
    if (A.labels) {
      g.add(part(box(0.08, 0.0012, 0.05), LAB.label, 'determination-label', { pos: [mx + 0.1, 0.023, 0.09], rot: [0, 0.06, 0] }));
      for (let l = 0; l < 3; l++) g.add(part(box(0.06, 0.0008, 0.0016), LAB.blackJapan, 'label-line-' + l, { pos: [mx + 0.1, 0.024, 0.078 + l * 0.011] }));
    }
  }
  return seat(g);
}

/* ------------------------------------------------------- ELECTROSTATIC SET */
export const ELECTRO_AXES = { form: 3, plates: 3, jars: 4, rods: 3, frame: 2 };
export function electrostaticSet(variant = 0) {
  const A = axesOf(variant, ELECTRO_AXES);
  const rand = rnd(variant * 1579 + 63);
  const g = new THREE.Group();
  const baseW = 0.52, baseD = 0.3;
  g.add(part(box(baseW, 0.03, baseD), LAB.mahogany, 'base-board', { pos: [0, 0.015, 0] }));
  if (A.frame) for (let i = 0; i < 4; i++) {
    const sx = i % 2 ? 1 : -1, sz = i < 2 ? 1 : -1;
    g.add(part(lathe([[0.016, 0], [0.014, 0.01], [0.012, 0.02]], 10), LAB.mahogany, 'base-foot-' + i, { pos: [sx * baseW * 0.42, 0, sz * baseD * 0.36] }));
  }
  // Counter-rotating glass discs with foil sectors: the Wimshurst principle.
  const R = 0.11 + A.plates * 0.016;
  const discs = [];
  [-1, 1].forEach((s, i) => {
    const d = new THREE.Group();
    d.name = 'disc-' + i;
    d.add(part(cyl(R, R, 0.003, 30), LAB.glass, 'glass-disc-' + i));
    const sectors = 8 + A.plates * 4;
    for (let k = 0; k < sectors; k++) {
      const a = (k / sectors) * T;
      d.add(part(box(R * 0.3, 0.0012, R * 0.12), LAB.brass, 'foil-sector-' + i + '-' + k, {
        pos: [Math.cos(a) * R * 0.7, s * 0.003, Math.sin(a) * R * 0.7], rot: [0, -a, 0],
      }));
    }
    d.position.set(0, R + 0.06, s * 0.02);
    d.rotation.x = Math.PI / 2;
    g.add(d);
    discs.push({ g: d, dir: s });
  });
  g.add(part(cyl(0.008, 0.008, 0.1, 10), LAB.brass, 'disc-spindle', { pos: [0, R + 0.06, 0], rot: [Math.PI / 2, 0, 0] }));
  // Uprights carrying the spindle.
  [-1, 1].forEach((s, i) => g.add(part(box(0.02, R + 0.06, 0.02), LAB.mahogany, 'upright-' + i, { pos: [s * (R + 0.04), (R + 0.06) / 2, 0] })));
  // Neutralising bars, crossed at an angle — the part that makes it self-exciting.
  [-1, 1].forEach((s, i) => {
    g.add(part(cyl(0.004, 0.004, R * 1.9, 8), LAB.brass, 'neutralising-bar-' + i, { pos: [0, R + 0.06, s * 0.03], rot: [0, 0, s * 0.6] }));
    [-1, 1].forEach((s2, k) => g.add(part(cone(0.004, 0.012, 5), LAB.brass, 'brush-' + i + '-' + k, { pos: [s2 * Math.cos(s * 0.6) * R * 0.9, R + 0.06 + s2 * Math.sin(s * 0.6) * R * 0.9, s * 0.03] })));
  });
  // Collecting combs and discharge rods with adjustable spark gap.
  const gap = 0.02 + A.rods * 0.012;
  [-1, 1].forEach((s, i) => {
    g.add(part(cyl(0.005, 0.005, 0.14, 8), LAB.brass, 'collector-arm-' + i, { pos: [s * (R + 0.03), R + 0.16, 0], rot: [0, 0, s * 0.3] }));
    g.add(part(ico(0.016, 1), LAB.brass, 'discharge-ball-' + i, { pos: [s * gap, R + 0.22, 0] }));
    g.add(part(cyl(0.004, 0.004, 0.06, 6), LAB.brass, 'discharge-stem-' + i, { pos: [s * (gap + 0.03), R + 0.2, 0], rot: [0, 0, s * 0.9] }));
    // The comb: a bar of points that collects charge without touching.
    for (let k = 0; k < 5; k++) g.add(part(cone(0.002, 0.008, 4), LAB.brass, 'comb-point-' + i + '-' + k, { pos: [s * R * 0.95, R + 0.06 - 0.04 + k * 0.02, 0], rot: [0, 0, s * -Math.PI / 2] }));
  });
  // Leyden jars: the storage. Foil inside and out, chain to the knob.
  const nJ = 1 + A.jars;
  for (let i = 0; i < nJ; i++) {
    const jx = -baseW * 0.32 + (baseW * 0.64 / Math.max(1, nJ - 1)) * i;
    const jz = -baseD * 0.3;
    const jr = 0.032, jh = 0.09;
    g.add(part(lathe([[jr, 0], [jr, jh * 0.92], [jr * 0.9, jh]], 14), LAB.glassThick, 'leyden-jar-' + i, { pos: [jx, 0.03, jz] }));
    g.add(part(cyl(jr * 0.97, jr * 0.97, jh * 0.6, 14), LAB.brass, 'outer-foil-' + i, { pos: [jx, 0.03 + jh * 0.3, jz] }));
    g.add(part(cyl(jr * 0.82, jr * 0.82, jh * 0.58, 12), LAB.brass, 'inner-foil-' + i, { pos: [jx, 0.03 + jh * 0.3, jz] }));
    g.add(part(cyl(0.004, 0.004, jh * 0.6, 6), LAB.brass, 'jar-rod-' + i, { pos: [jx, 0.03 + jh * 0.9, jz] }));
    g.add(part(ico(0.009, 1), LAB.brass, 'jar-knob-' + i, { pos: [jx, 0.03 + jh * 1.2, jz] }));
    g.add(part(lathe([[jr * 0.9, 0], [jr * 0.5, 0.006], [0, 0.008]], 12), LAB.cork, 'jar-stopper-' + i, { pos: [jx, 0.03 + jh, jz] }));
  }
  // Drive: crank and two crossed belts, which is how the discs counter-rotate.
  const cw = 0.045;
  g.add(part(torus(cw, 0.006, 4, 14), LAB.mahogany, 'crank-wheel', { pos: [-(R + 0.07), cw + 0.04, 0.05], rot: [0, Math.PI / 2, 0] }));
  g.add(part(cyl(0.005, 0.005, 0.04, 6), MAT.heartwood, 'crank-handle', { pos: [-(R + 0.07), cw * 2 + 0.04, 0.075], rot: [Math.PI / 2, 0, 0] }));
  [-1, 1].forEach((s, i) => g.add(part(box(0.006, R * 0.9, 0.003), MAT.darkOak, 'drive-belt-' + i, { pos: [-(R + 0.05), (R + 0.06) * 0.55, s * 0.02], rot: [0, 0, s * 0.12] })));

  const out = seat(g);
  out.userData.mech = {
    rpm: 240,
    work: 'Generates high-potential charge on counter-rotating discs and stores it in Leyden jars.',
    chain: ['crank', 'crossed belts', 'counter-rotating discs', 'neutralising bars', 'collecting combs', 'Leyden jars', 'spark gap'],
    tick(t, running) {
      const w = running ? (this.rpm / 60) * T : 0;
      this._th = (this._th || 0) + w * (t - (this._last || t));
      this._last = t;
      discs.forEach((d) => { d.g.rotation.y = this._th * d.dir; });
    },
  };
  return out;
}

export const LAB_GENERATORS = [
  { id: 'lab.bench', name: 'Laboratory bench', axes: LABBENCH_AXES, build: labBench, domain: 'laboratory', budgetClass: 'hero' },
  { id: 'lab.fume-hood', name: 'Fume cupboard', axes: FUMEHOOD_AXES, build: fumeHood, domain: 'laboratory', budgetClass: 'hero' },
  { id: 'lab.microscope', name: 'Compound microscope', axes: MICROSCOPE_AXES, build: microscope, domain: 'laboratory', budgetClass: 'standard' },
  { id: 'lab.distillation', name: 'Distillation train', axes: DISTIL_AXES, build: distillationTrain, domain: 'laboratory', budgetClass: 'standard' },
  { id: 'lab.centrifuge', name: 'Centrifuge', axes: CENTRIFUGE_AXES, build: centrifuge, domain: 'laboratory', budgetClass: 'standard' },
  { id: 'lab.balance', name: 'Analytical balance', axes: BALANCE_AXES, build: analyticalBalance, domain: 'laboratory', budgetClass: 'standard' },
  { id: 'bio.specimen-shelf', name: 'Wet specimen shelving', axes: SPECIMEN_AXES, build: specimenShelf, domain: 'biology', budgetClass: 'hero' },
  { id: 'bio.dissection', name: 'Dissection table', axes: DISSECT_AXES, build: dissectionTable, domain: 'biology', budgetClass: 'hero' },
  { id: 'bio.incubator', name: 'Culture incubator', axes: INCUBATOR_AXES, build: cultureIncubator, domain: 'biology', budgetClass: 'hero' },
  { id: 'bio.herbarium', name: 'Herbarium station', axes: HERBARIUM_AXES, build: herbariumStation, domain: 'biology', budgetClass: 'standard' },
  { id: 'lab.electrostatic', name: 'Electrostatic apparatus', axes: ELECTRO_AXES, build: electrostaticSet, domain: 'laboratory', budgetClass: 'standard' },
];
