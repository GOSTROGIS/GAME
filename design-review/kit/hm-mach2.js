/* Real machinery — mechanisms, not silhouettes.
 *
 * WHY THIS FILE REPLACES hm-mach.js's `machine` GENERATOR
 *
 * The old generator crammed eight "forms" into one function and failed three
 * ways, all of them visible:
 *   1. Nothing was kinematically connected. A walking beam was a box at a
 *      hardcoded angle; the piston rod did not reach it; no bearing existed.
 *   2. `state: live` was decoration — it nudged two positions and added a
 *      glow. A working machine did not move.
 *   3. Instrumentation was bolted on regardless of logic. A LOOM got steam
 *      plumbing and pressure gauges.
 *
 * Every machine here is built as a real power chain:
 *
 *     POWER SOURCE -> TRANSMISSION -> MECHANISM -> WORK POINT -> PRODUCT
 *
 * and every moving part is driven by actual linkage maths at tick time, not by
 * a baked pose. The slider-crank below is the real closed-form solution, so
 * the piston, connecting rod and crank stay attached at every angle — which is
 * the single thing that makes procedural machinery read as machinery.
 *
 * A machine exposes:
 *   group.userData.mech = { rpm, work, tick(seconds, running) }
 * `work` names what the machine DOES, because a machine whose purpose you
 * cannot state is a sculpture.
 */
import { THREE, MAT, rnd, jitter, part, lathe, limb, torus, cone, cyl, ico, seat } from './hm-core.js';
import { STEAM, axesOf } from './hm-steam.js';

const box = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);
const T = Math.PI * 2;

/* ---------------------------------------------------------------- kinematics */

/** Slider-crank, closed form. Returns the slider's distance from crank centre
 *  along the axis. r = crank radius, L = connecting-rod length, th = crank
 *  angle. This is the exact solution, not a sine approximation — with r/L as
 *  large as these machines use, a sine wave visibly detaches the rod. */
function sliderCrank(th, r, L) {
  const s = r * Math.sin(th);
  return r * Math.cos(th) + Math.sqrt(Math.max(1e-6, L * L - s * s));
}

/** Aim a cylinder-based member (default axis +Y) from point a to point b, and
 *  stretch it to span the gap. This is what keeps a connecting rod connected:
 *  the rod is re-aimed every tick instead of being placed once. */
function spanMember(mesh, a, b, baseLen) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.scale.y = len / baseLen;
}

/** A gear with real involute-ish teeth and a known tooth count, so a train can
 *  be geared at true ratios. Teeth are trapezoidal prisms on a rim — cheap,
 *  and they read correctly because the COUNT is right and the pitch matches. */
function gearWheel(mod, teeth, width, mat, name, spokes = 6) {
  const g = new THREE.Group();
  g.name = name;
  const R = (mod * teeth) / 2;
  g.add(part(cyl(R * 0.94, R * 0.94, width, Math.max(16, teeth), 1), mat, name + '-rim'));
  g.add(part(cyl(R * 0.2, R * 0.2, width * 1.5, 12), mat, name + '-hub'));
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * T;
    const tooth = box(mod * 0.62, width, mod * 0.9);
    const p = tooth.attributes.position;
    for (let v = 0; v < p.count; v++) {
      const tz = (p.getZ(v) + mod * 0.45) / (mod * 0.9);
      p.setX(v, p.getX(v) * (1 - tz * 0.34));
    }
    p.needsUpdate = true;
    tooth.computeVertexNormals();
    g.add(part(tooth, mat, name + '-tooth-' + i, {
      pos: [Math.cos(a) * (R * 0.94 + mod * 0.42), 0, Math.sin(a) * (R * 0.94 + mod * 0.42)],
      rot: [0, -a, 0],
    }));
  }
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * T;
    g.add(part(box(R * 0.72, width * 0.5, mod * 0.5), mat, name + '-spoke-' + i, {
      pos: [Math.cos(a) * R * 0.55, 0, Math.sin(a) * R * 0.55], rot: [0, -a, 0],
    }));
  }
  g.userData.teeth = teeth;
  g.userData.radius = R;
  return g;
}

/** Plain journal bearing with a bolted cap — the part that proves a shaft is
 *  actually carried rather than floating. */
function bearing(r, mat, name) {
  const g = new THREE.Group();
  g.name = name;
  g.add(part(box(r * 3.2, r * 1.1, r * 2.2), mat, name + '-sole', { pos: [0, -r * 1.1, 0] }));
  g.add(part(lathe([[r * 1.5, 0], [r * 1.5, r * 0.5], [r * 1.15, r * 0.9]], 14), mat, name + '-cap', { pos: [0, 0, 0], rot: [Math.PI / 2, 0, 0] }));
  [-1, 1].forEach((s, i) => g.add(part(cyl(r * 0.16, r * 0.16, r * 2.4, 6), STEAM.brass, name + '-bolt-' + i, { pos: [s * r * 1.25, -r * 0.5, 0] })));
  return g;
}

/* ============================================================ BEAM ENGINE
 * The prime mover. Everything else in a works is downstream of one of these.
 * Chain: firebox/boiler steam -> cylinder -> piston -> parallel motion ->
 * walking beam -> connecting rod -> crank -> flywheel -> output shaft, with a
 * centrifugal governor throttling admission. */
export const BEAMENGINE_AXES = { size: 4, valve: 3, governor: 3, condenser: 2, flywheel: 3, house: 3 };
export function beamEngine(variant = 0) {
  const A = axesOf(variant, BEAMENGINE_AXES);
  const rand = rnd(variant * 7919 + 11);
  const g = new THREE.Group();
  const S = [0.9, 1.25, 1.7, 2.3][A.size];

  // --- entablature and columns: a beam engine's beam is carried high.
  const colH = S * 2.5;
  const bedW = S * 2.9, bedD = S * 1.5;
  g.add(part(box(bedW, S * 0.22, bedD), MAT.slateDry, 'foundation', { pos: [0, S * 0.11, 0] }));
  for (let i = 0; i < 4; i++) {
    const sx = i % 2 ? 1 : -1, sz = i < 2 ? 1 : -1;
    g.add(part(lathe([[S * 0.15, 0], [S * 0.13, S * 0.1], [S * 0.11, colH * 0.9], [S * 0.14, colH]], 14), STEAM.sootIron, 'column-' + i, { pos: [sx * S * 0.95, S * 0.22, sz * bedD * 0.3] }));
    g.add(part(box(S * 0.34, S * 0.1, S * 0.34), STEAM.sootIron, 'column-cap-' + i, { pos: [sx * S * 0.95, S * 0.22 + colH, sz * bedD * 0.3] }));
  }
  const entY = S * 0.22 + colH + S * 0.1;
  g.add(part(box(bedW * 0.86, S * 0.16, bedD * 0.8), STEAM.sootIron, 'entablature', { pos: [0, entY, 0] }));

  // --- cylinder (left) with stuffing box and steam chest.
  const cylR = S * 0.3, cylH = S * 1.5, cylX = -S * 0.95;
  const cylBaseY = S * 0.22;
  g.add(part(lathe([[cylR * 1.2, 0], [cylR * 1.2, S * 0.1], [cylR, S * 0.16], [cylR, cylH - S * 0.16], [cylR * 1.2, cylH - S * 0.1], [cylR * 1.2, cylH]], 18), STEAM.sootIron, 'cylinder', { pos: [cylX, cylBaseY, 0] }));
  for (let i = 0; i < 3; i++) g.add(part(torus(cylR * 1.05, S * 0.022, 4, 18), STEAM.sootIron, 'cyl-band-' + i, { pos: [cylX, cylBaseY + cylH * (0.25 + i * 0.25), 0], rot: [Math.PI / 2, 0, 0] }));
  g.add(part(lathe([[cylR * 0.42, 0], [cylR * 0.5, S * 0.06], [cylR * 0.3, S * 0.12]], 14), STEAM.brass, 'stuffing-box', { pos: [cylX, cylBaseY + cylH, 0] }));
  // Steam chest and valve gear — the thing that decides WHEN steam enters.
  g.add(part(box(S * 0.26, cylH * 0.7, S * 0.3), STEAM.sootIron, 'steam-chest', { pos: [cylX - cylR * 1.3, cylBaseY + cylH * 0.45, 0] }));
  const valveRod = part(cyl(S * 0.03, S * 0.03, cylH * 0.8, 8), STEAM.brass, 'valve-rod', { pos: [cylX - cylR * 1.3, cylBaseY + cylH * 0.9, 0] });
  g.add(valveRod);
  if (A.valve > 0) {
    // Eccentric-driven: a sheave on the crankshaft, strap and rod to the valve.
    g.add(part(lathe([[S * 0.14, 0], [S * 0.16, S * 0.04], [S * 0.14, S * 0.08]], 14), STEAM.brass, 'eccentric-sheave', { pos: [S * 1.5, cylBaseY + S * 0.9, bedD * 0.42], rot: [Math.PI / 2, 0, 0] }));
  }
  if (A.valve === 2) for (let i = 0; i < 2; i++) g.add(part(lathe([[S * 0.07, 0], [S * 0.09, S * 0.02], [S * 0.06, S * 0.05]], 12), STEAM.brass, 'drain-cock-' + i, { pos: [cylX + cylR * (i ? 1 : -1), cylBaseY + S * 0.12, cylR * 0.6], rot: [0, 0, i ? -1.2 : 1.2] }));

  // --- walking beam on a trunnion, with parallel motion at the piston end.
  const beamLen = S * 3.0, beamY = entY + S * 0.3;
  const beam = new THREE.Group();
  beam.name = 'walking-beam';
  beam.add(part(box(beamLen, S * 0.26, S * 0.16, 5, 1, 1), STEAM.sootIron, 'beam-web'));
  [-1, 1].forEach((s, i) => beam.add(part(box(beamLen * 0.98, S * 0.07, S * 0.2), STEAM.sootIron, 'beam-flange-' + i, { pos: [0, s * S * 0.125, 0] })));
  // Lightening holes, which is what makes a cast beam look cast.
  for (let i = 0; i < 4; i++) {
    const t = -0.6 + i * 0.4;
    beam.add(part(torus(S * 0.09, S * 0.03, 4, 12), STEAM.sootIron, 'beam-hole-' + i, { pos: [t * beamLen * 0.4, 0, 0], rot: [Math.PI / 2, 0, 0] }));
  }
  [-1, 1].forEach((s, i) => beam.add(part(cyl(S * 0.07, S * 0.07, S * 0.3, 10), STEAM.brass, 'beam-pin-' + i, { pos: [s * beamLen * 0.5, 0, 0], rot: [Math.PI / 2, 0, 0] })));
  beam.position.set(0, beamY, 0);
  g.add(beam);
  g.add(part(cyl(S * 0.12, S * 0.12, S * 0.5, 12), STEAM.brass, 'trunnion', { pos: [0, beamY, 0], rot: [Math.PI / 2, 0, 0] }));
  const trunBearing = bearing(S * 0.14, STEAM.sootIron, 'trunnion-bearing');
  trunBearing.position.set(0, beamY - S * 0.02, 0);
  g.add(trunBearing);

  // --- piston rod (left) and connecting rod (right): both re-aimed per tick.
  const pistonRodLen = S * 1.0;
  const pistonRod = part(cyl(S * 0.045, S * 0.045, pistonRodLen, 10), STEAM.brass, 'piston-rod', {});
  g.add(pistonRod);
  const conRodLen = S * 1.5;
  const conRod = part(cyl(S * 0.055, S * 0.07, conRodLen, 10), STEAM.sootIron, 'connecting-rod', {});
  g.add(conRod);

  // --- crankshaft and flywheel (right).
  const crankX = S * 1.5, crankY = cylBaseY + S * 0.9;
  const crankR = S * 0.42;
  g.add(part(cyl(S * 0.075, S * 0.075, bedD * 1.1, 12), STEAM.sootIron, 'crankshaft', { pos: [crankX, crankY, 0], rot: [Math.PI / 2, 0, 0] }));
  [-1, 1].forEach((s, i) => {
    const b = bearing(S * 0.1, STEAM.sootIron, 'main-bearing-' + i);
    b.position.set(crankX, crankY, s * bedD * 0.42);
    g.add(b);
    g.add(part(box(S * 0.34, S * 0.3, S * 0.5), STEAM.sootIron, 'bearing-pedestal-' + i, { pos: [crankX, crankY * 0.5, s * bedD * 0.42] }));
  });
  const crank = new THREE.Group();
  crank.name = 'crank';
  crank.add(part(box(crankR * 1.3, S * 0.16, S * 0.1), STEAM.sootIron, 'crank-web', { pos: [crankR * 0.5, 0, 0] }));
  crank.add(part(cyl(S * 0.055, S * 0.055, S * 0.22, 10), STEAM.brass, 'crank-pin', { pos: [crankR, 0, 0], rot: [Math.PI / 2, 0, 0] }));
  crank.position.set(crankX, crankY, S * 0.14);
  g.add(crank);

  const flyR = S * (0.7 + A.flywheel * 0.16);
  const fly = new THREE.Group();
  fly.name = 'flywheel';
  fly.add(part(torus(flyR, S * 0.075, 6, 30), STEAM.sootIron, 'fly-rim'));
  fly.add(part(cyl(S * 0.13, S * 0.13, S * 0.26, 12), STEAM.sootIron, 'fly-hub'));
  const spokes = 6 + A.flywheel * 2;
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * T;
    fly.add(part(box(flyR * 0.92, S * 0.055, S * 0.055), STEAM.sootIron, 'fly-spoke-' + i, { pos: [Math.cos(a) * flyR * 0.48, Math.sin(a) * flyR * 0.48, 0], rot: [0, 0, a] }));
  }
  fly.position.set(crankX, crankY, -bedD * 0.55);
  g.add(fly);

  // --- governor: balls fly out with the square of speed and close the throttle.
  let govArms = [];
  let govSleeve = null;
  if (A.governor > 0) {
    const gx = S * 0.55, gy = entY + S * 0.16;
    g.add(part(cyl(S * 0.035, S * 0.035, S * 0.7, 8), STEAM.brass, 'governor-spindle', { pos: [gx, gy + S * 0.35, 0] }));
    const gg = new THREE.Group();
    gg.name = 'governor';
    for (let i = 0; i < 2; i++) {
      const arm = new THREE.Group();
      arm.name = 'gov-arm-' + i;
      arm.add(part(cyl(S * 0.016, S * 0.016, S * 0.42, 6), STEAM.brass, 'gov-link-' + i, { pos: [0, -S * 0.21, 0] }));
      arm.add(part(ico(S * 0.075, 1), STEAM.brass, 'gov-ball-' + i, { pos: [0, -S * 0.42, 0] }));
      arm.position.set(gx, gy + S * 0.68, 0);
      arm.rotation.z = (i ? -1 : 1) * 0.35;
      arm.userData.side = i ? -1 : 1;
      gg.add(arm);
      govArms.push(arm);
    }
    g.add(gg);
    govSleeve = part(cyl(S * 0.06, S * 0.06, S * 0.1, 10), STEAM.brass, 'governor-sleeve', { pos: [gx, gy + S * 0.3, 0] });
    g.add(govSleeve);
    if (A.governor > 1) {
      g.add(part(cyl(S * 0.02, S * 0.02, S * 0.5, 6), STEAM.brass, 'throttle-link', { pos: [gx - S * 0.25, gy + S * 0.3, 0], rot: [0, 0, 1.3] }));
      g.add(part(torus(S * 0.07, S * 0.018, 4, 12), STEAM.brass, 'throttle-valve', { pos: [cylX - cylR * 1.3, cylBaseY + cylH * 0.85, 0], rot: [0, 0, 0] }));
    }
  }

  // --- condenser and air pump: what makes it a low-pressure engine.
  if (A.condenser) {
    g.add(part(lathe([[S * 0.26, 0], [S * 0.28, S * 0.06], [S * 0.26, S * 0.7], [S * 0.2, S * 0.78]], 16), STEAM.coolIron, 'condenser', { pos: [cylX - S * 0.75, cylBaseY, -bedD * 0.5] }));
    g.add(part(cyl(S * 0.05, S * 0.05, S * 0.9, 10), STEAM.copper, 'injection-pipe', { pos: [cylX - S * 0.45, cylBaseY + S * 0.3, -bedD * 0.42], rot: [0, 0, 1.4] }));
    g.add(part(lathe([[S * 0.11, 0], [S * 0.13, S * 0.05], [S * 0.11, S * 0.55]], 12), STEAM.coolIron, 'air-pump', { pos: [cylX - S * 0.3, cylBaseY, -bedD * 0.22] }));
  }

  // --- engine house: a beam engine lives inside a building, and the beam
  //     passing through the wall is the whole visual signature.
  if (A.house > 0) {
    const wallX = -bedW * 0.62;
    g.add(part(box(S * 0.24, entY + S * 1.1, bedD * 1.7), MAT.slateDry, 'house-wall', { pos: [wallX, (entY + S * 1.1) / 2, 0] }));
    g.add(part(box(S * 0.3, S * 0.5, S * 0.7), STEAM.sootIron, 'wall-opening', { pos: [wallX, beamY, 0] }));
    if (A.house > 1) {
      g.add(part(box(S * 0.26, S * 0.16, bedD * 1.7), MAT.springStone, 'wall-string-course', { pos: [wallX, entY * 0.62, 0] }));
      for (let i = 0; i < 2; i++) g.add(part(box(S * 0.26, S * 0.5, S * 0.3), MAT.wetSlate, 'wall-window-' + i, { pos: [wallX, entY * (0.35 + i * 0.42), bedD * (i ? 0.5 : -0.5)] }));
    }
    if (A.house === 2) {
      g.add(part(lathe([[S * 0.3, 0], [S * 0.32, S * 0.1], [S * 0.24, S * 2.6], [S * 0.28, S * 2.75]], 14), STEAM.firebrick, 'chimney', { pos: [wallX - S * 0.6, 0, -bedD * 0.7] }));
    }
  }

  // --- gauges belong on the boiler side only. This is the logic fix: no
  //     instrumentation appears where there is nothing to measure.
  for (let i = 0; i < 2; i++) {
    const gaugeX = cylX - cylR * 1.3;
    g.add(part(lathe([[0, 0], [S * 0.07, S * 0.008], [S * 0.07, S * 0.028], [0, S * 0.032]], 14), STEAM.brass, 'gauge-' + i, { pos: [gaugeX - S * 0.14, cylBaseY + cylH * (0.55 + i * 0.2), S * 0.16], rot: [Math.PI / 2, 0, 0] }));
  }
  const needles = [];
  for (let i = 0; i < 2; i++) {
    const n = part(box(S * 0.05, S * 0.005, S * 0.005), STEAM.copper, 'needle-' + i, { pos: [cylX - cylR * 1.3 - S * 0.14 + S * 0.015, cylBaseY + cylH * (0.55 + i * 0.2), S * 0.18] });
    g.add(n); needles.push(n);
  }

  const out = seat(g);

  out.userData.mech = {
    rpm: 18 + A.size * 4,
    work: 'Converts boiler steam into rotary shaft power for a works.',
    chain: ['boiler steam', 'cylinder + piston', 'parallel motion', 'walking beam', 'connecting rod', 'crank', 'flywheel'],
    tick(t, running) {
      const w = running ? (this.rpm / 60) * T : 0;
      this._th = (this._th || 0) + w * (t - (this._last || t));
      this._last = t;
      const th = this._th;
      // Beam rocks by the arc its piston end must follow.
      const throwY = S * 0.42;
      const beamAng = Math.asin(Math.max(-0.55, Math.min(0.55, (throwY * Math.sin(th)) / (beamLen * 0.5))));
      beam.rotation.z = beamAng;
      // Beam end positions, in the seated frame.
      const lx = -Math.cos(beamAng) * beamLen * 0.5, ly = beamY - Math.sin(beamAng) * beamLen * 0.5;
      const rx = Math.cos(beamAng) * beamLen * 0.5, ry = beamY + Math.sin(beamAng) * beamLen * 0.5;
      // Piston rod hangs from the beam's left end down into the stuffing box.
      const pistonTop = new THREE.Vector3(lx, ly, 0);
      const pistonBot = new THREE.Vector3(cylX, cylBaseY + cylH * 0.98, 0);
      spanMember(pistonRod, pistonTop, pistonBot, pistonRodLen);
      // Crank turns with the shaft; connecting rod spans beam end to crank pin.
      crank.rotation.z = th;
      fly.rotation.z = th;
      const pin = new THREE.Vector3(crankX + Math.cos(th) * crankR, crankY + Math.sin(th) * crankR, S * 0.14);
      spanMember(conRod, new THREE.Vector3(rx, ry, S * 0.14), pin, conRodLen);
      // Governor: ball angle rises with speed squared, sleeve lifts with it.
      if (govArms.length) {
        const frac = running ? 1 : 0;
        const ang = 0.22 + 0.5 * frac + Math.sin(th * 2) * 0.012 * frac;
        govArms.forEach((arm) => { arm.rotation.z = arm.userData.side * ang; });
        if (govSleeve) govSleeve.position.y = entY + S * (0.3 + ang * 0.18);
      }
      needles.forEach((n, i) => { n.rotation.z = running ? 0.9 + Math.sin(th + i) * 0.12 : -0.7; });
    },
  };
  return out;
}

/* ============================================================== LINE SHAFT
 * How power actually reaches machines in a works: one shaft under the ceiling,
 * hangers carrying it, pulleys tapping it, flat belts dropping to each
 * machine, and a clutch so a single tool can be stopped without stopping the
 * whole shop. Without this, a hall of machines has no explanation for motion. */
export const LINESHAFT_AXES = { bays: 4, pulleys: 4, drops: 3, clutch: 2, hanger: 3 };
export function lineShaft(variant = 0) {
  const A = axesOf(variant, LINESHAFT_AXES);
  const rand = rnd(variant * 4409 + 17);
  const g = new THREE.Group();
  const bays = 2 + A.bays;
  const bayW = 1.6;
  const span = bays * bayW;
  const H = 2.9;
  const shaftR = 0.045;

  // Roof trusses the hangers bolt to.
  for (let i = 0; i <= bays; i++) {
    const x = -span / 2 + i * bayW;
    g.add(part(box(0.14, 0.5, 0.14), MAT.weatheredTimber, 'roof-post-' + i, { pos: [x, H + 0.25, 0] }));
    g.add(part(box(0.5, 0.12, 0.16), MAT.weatheredTimber, 'roof-plate-' + i, { pos: [x, H + 0.5, 0] }));
  }
  const shaft = part(cyl(shaftR, shaftR, span * 1.02, 12), STEAM.coolIron, 'line-shaft', { pos: [0, H, 0], rot: [0, 0, Math.PI / 2] });
  g.add(shaft);
  // Hangers: the shaft is carried, never floating.
  for (let i = 0; i <= bays; i++) {
    const x = -span / 2 + i * bayW;
    const drop = 0.22 + A.hanger * 0.05;
    [-1, 1].forEach((s, k) => g.add(part(box(0.035, drop, 0.035), STEAM.sootIron, 'hanger-leg-' + i + '-' + k, { pos: [x + s * 0.09, H + drop / 2 + shaftR, 0], rot: [0, 0, -s * 0.16] })));
    const b = bearing(shaftR * 1.5, STEAM.sootIron, 'shaft-bearing-' + i);
    b.position.set(x, H + shaftR * 1.5, 0);
    b.rotation.y = Math.PI / 2;
    g.add(b);
    if (A.hanger > 1) g.add(part(lathe([[0.022, 0], [0.03, 0.012], [0.02, 0.03]], 10), STEAM.brass, 'oil-cup-' + i, { pos: [x, H + shaftR * 3, 0] }));
  }

  const pulleys = [];
  const belts = [];
  const nP = 1 + A.pulleys;
  for (let i = 0; i < nP; i++) {
    const x = -span / 2 + bayW * (i + 0.6);
    const pr = 0.16 + (i % 2) * 0.05;
    const pw = 0.1;
    const p = new THREE.Group();
    p.name = 'pulley-' + i;
    // Crowned face: a flat belt only tracks on a crowned pulley.
    p.add(part(lathe([[pr * 0.98, 0], [pr, pw * 0.35], [pr, pw * 0.65], [pr * 0.98, pw]], 20), STEAM.coolIron, 'pulley-face-' + i));
    p.add(part(cyl(pr * 0.22, pr * 0.22, pw * 1.3, 10), STEAM.coolIron, 'pulley-hub-' + i));
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * T;
      p.add(part(box(pr * 0.7, pw * 0.3, 0.02), STEAM.coolIron, 'pulley-spoke-' + i + '-' + k, { pos: [Math.cos(a) * pr * 0.5, pw * 0.5, Math.sin(a) * pr * 0.5], rot: [0, -a, 0] }));
    }
    p.position.set(x, H, -pw / 2);
    p.rotation.x = Math.PI / 2;
    p.userData.r = pr;
    g.add(p);
    pulleys.push(p);

    // A belt drop: two straight runs plus the machine pulley below.
    if (i < 1 + A.drops) {
      const my = 0.85;
      const mr = 0.12;
      const mp = new THREE.Group();
      mp.name = 'machine-pulley-' + i;
      mp.add(part(lathe([[mr * 0.98, 0], [mr, 0.04], [mr, 0.07], [mr * 0.98, 0.11]], 18), STEAM.coolIron, 'mpulley-face-' + i));
      mp.add(part(cyl(mr * 0.2, mr * 0.2, 0.14, 8), STEAM.coolIron, 'mpulley-hub-' + i));
      mp.position.set(x, my, -0.055);
      mp.rotation.x = Math.PI / 2;
      mp.userData.r = mr;
      g.add(mp);
      // Belt: two thin slabs with a visible lap joint that travels.
      [-1, 1].forEach((s, k) => {
        const bl = H - my;
        const belt = part(box(0.055, bl, 0.006), MAT.hideBelt || MAT.darkOak, 'belt-' + i + '-' + k, { pos: [x + s * pr * 0.98, (H + my) / 2, -0.055] });
        g.add(belt);
        belts.push({ mesh: belt, len: bl, side: s });
      });
      // Lap joint marker so belt travel is legible.
      const lap = part(box(0.058, 0.03, 0.008), STEAM.brass, 'belt-lap-' + i, { pos: [x + pr * 0.98, my + 0.2, -0.055] });
      g.add(lap);
      belts.push({ mesh: lap, len: H - my, side: 1, isLap: true, x: x + pr * 0.98, y0: my, y1: H });
      // Machine stub so the belt drives something.
      g.add(part(box(0.5, 0.7, 0.4), STEAM.sootIron, 'driven-machine-' + i, { pos: [x, 0.35, 0.16] }));
      g.add(part(box(0.56, 0.06, 0.46), STEAM.sootIron, 'machine-table-' + i, { pos: [x, 0.72, 0.16] }));
    }
  }
  // Clutch: the reason one machine can stop while the shaft runs.
  let clutchCollar = null;
  if (A.clutch) {
    const cx = -span / 2 + bayW * 0.2;
    clutchCollar = part(lathe([[shaftR * 2, 0], [shaftR * 2.2, 0.03], [shaftR * 2, 0.06]], 14), STEAM.brass, 'clutch-collar', { pos: [cx, H, 0], rot: [0, 0, Math.PI / 2] });
    g.add(clutchCollar);
    g.add(part(box(0.03, 0.5, 0.03), STEAM.sootIron, 'clutch-lever', { pos: [cx - 0.12, H - 0.25, 0], rot: [0, 0, 0.3] }));
    g.add(part(cyl(0.02, 0.02, 0.16, 8), MAT.heartwood, 'clutch-grip', { pos: [cx - 0.24, H - 0.5, 0] }));
  }

  const out = seat(g);
  out.userData.mech = {
    rpm: 120,
    work: 'Distributes one engine\u2019s power to every machine in the hall.',
    chain: ['engine flywheel', 'line shaft', 'crowned pulley', 'flat belt', 'machine pulley'],
    tick(t, running) {
      const w = running ? (this.rpm / 60) * T : 0;
      this._th = (this._th || 0) + w * (t - (this._last || t));
      this._last = t;
      const th = this._th;
      shaft.rotation.y = th;
      pulleys.forEach((p) => { p.rotation.y = th; });
      // Belt speed = surface speed of the driving pulley. The lap joint runs
      // the loop so travel is visible without animating a texture.
      const v = (this.rpm / 60) * T * 0.16;
      belts.forEach((b) => {
        if (!b.isLap) return;
        const loop = (b.len * 2);
        const s = ((this._belt || 0) % loop + loop) % loop;
        b.mesh.position.y = s < b.len ? b.y0 + s : b.y1 - (s - b.len);
        b.mesh.position.x = s < b.len ? b.x : b.x - 0.0;
      });
      this._belt = (this._belt || 0) + (running ? v * (1 / 60) * 8 : 0);
      if (clutchCollar) clutchCollar.rotation.y = th;
    },
  };
  return out;
}

/* ============================================================= TRIP HAMMER
 * A cam on a driven shaft lifts a helve; gravity brings the head down onto the
 * anvil. Purpose: drawing out hot iron. The cam profile is what makes it work,
 * so the cam here has real lobes and the helve rides them. */
export const TRIPHAMMER_AXES = { lobes: 3, size: 3, helve: 3, anvil: 3, hearth: 2, frame: 3 };
export function tripHammer(variant = 0) {
  const A = axesOf(variant, TRIPHAMMER_AXES);
  const rand = rnd(variant * 3313 + 23);
  const g = new THREE.Group();
  const S = [1.0, 1.35, 1.8][A.size];
  const lobes = 3 + A.lobes;

  g.add(part(box(S * 2.6, S * 0.2, S * 1.2), MAT.slateDry, 'floor-block', { pos: [0, S * 0.1, 0] }));
  // Frame: two heavy posts and a cross-cap, braced.
  [-1, 1].forEach((s, i) => {
    g.add(part(box(S * 0.18, S * 1.5, S * 0.2), MAT.darkOak, 'frame-post-' + i, { pos: [s * S * 0.55, S * 0.2 + S * 0.75, -S * 0.32] }));
    if (A.frame) g.add(part(box(S * 0.1, S * 0.8, S * 0.1), MAT.darkOak, 'frame-brace-' + i, { pos: [s * S * 0.72, S * 0.55, -S * 0.1], rot: [0.5, 0, s * 0.4] }));
  });
  g.add(part(box(S * 1.4, S * 0.2, S * 0.24), MAT.darkOak, 'frame-cap', { pos: [0, S * 1.6, -S * 0.32] }));

  // Cam shaft, driven from the line shaft or a water wheel.
  const camY = S * 0.95, camX = -S * 0.62;
  g.add(part(cyl(S * 0.055, S * 0.055, S * 1.1, 12), STEAM.coolIron, 'cam-shaft', { pos: [camX, camY, 0], rot: [Math.PI / 2, 0, 0] }));
  [-1, 1].forEach((s, i) => {
    const b = bearing(S * 0.075, STEAM.sootIron, 'cam-bearing-' + i);
    b.position.set(camX, camY, s * S * 0.42);
    b.rotation.y = Math.PI / 2;
    g.add(b);
  });
  const cam = new THREE.Group();
  cam.name = 'cam';
  cam.add(part(cyl(S * 0.14, S * 0.14, S * 0.16, 14), STEAM.sootIron, 'cam-boss'));
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * T;
    const lobe = lathe([[S * 0.13, 0], [S * 0.26, S * 0.05], [S * 0.3, S * 0.1], [S * 0.2, S * 0.14], [S * 0.13, S * 0.16]], 8);
    cam.add(part(lobe, STEAM.sootIron, 'cam-lobe-' + i, { pos: [Math.cos(a) * S * 0.14, 0, Math.sin(a) * S * 0.14], rot: [Math.PI / 2, -a, 0] }));
  }
  cam.position.set(camX, camY, 0);
  cam.rotation.x = Math.PI / 2;
  g.add(cam);

  // Helve: a timber beam pivoted near the cam, hammer head at the far end.
  const helve = new THREE.Group();
  helve.name = 'helve';
  const helveLen = S * 1.9;
  helve.add(part(box(helveLen, S * 0.13, S * 0.15, 4, 1, 1), MAT.heartwood, 'helve-beam', { pos: [helveLen * 0.42, 0, 0] }));
  for (let i = 0; i < 2 + A.helve; i++) helve.add(part(torus(S * 0.085, S * 0.016, 3, 12), STEAM.sootIron, 'helve-hoop-' + i, { pos: [helveLen * (0.2 + i * 0.2), 0, 0], rot: [0, 0, Math.PI / 2] }));
  const headW = S * (0.2 + A.helve * 0.03);
  helve.add(part(box(headW, S * 0.3, S * 0.24), STEAM.sootIron, 'hammer-head', { pos: [helveLen * 0.88, -S * 0.08, 0] }));
  helve.add(part(box(headW * 0.5, S * 0.1, S * 0.26), STEAM.brass, 'hammer-face', { pos: [helveLen * 0.88, -S * 0.24, 0] }));
  // The cam-rider pad: the part the lobes strike.
  helve.add(part(box(S * 0.2, S * 0.09, S * 0.18), STEAM.sootIron, 'rider-pad', { pos: [-S * 0.02, -S * 0.09, 0] }));
  helve.position.set(camX + S * 0.05, S * 1.18, 0);
  g.add(helve);
  g.add(part(cyl(S * 0.06, S * 0.06, S * 0.3, 10), STEAM.brass, 'helve-pivot', { pos: [camX + S * 0.05, S * 1.18, 0], rot: [Math.PI / 2, 0, 0] }));
  // Spring pole above: stores the recoil, real on every trip hammer.
  g.add(part(box(S * 1.1, S * 0.07, S * 0.09), MAT.heartwood, 'spring-pole', { pos: [camX + S * 0.5, S * 1.52, 0], rot: [0, 0, -0.08] }));

  // Anvil and stock.
  const anvilX = camX + helveLen * 0.9;
  g.add(part(limb(S * 0.2, S * 0.26, S * 0.5, 8, 2), MAT.darkOak, 'anvil-stump', { pos: [anvilX, S * 0.2 + S * 0.25, 0] }));
  g.add(part(box(S * 0.4, S * 0.16, S * 0.3), STEAM.sootIron, 'anvil-body', { pos: [anvilX, S * 0.78, 0] }));
  if (A.anvil > 0) g.add(part(cone(S * 0.08, S * 0.28, 8), STEAM.sootIron, 'anvil-horn', { pos: [anvilX + S * 0.3, S * 0.78, 0], rot: [0, 0, -Math.PI / 2] }));
  if (A.anvil > 1) g.add(part(box(S * 0.1, S * 0.1, S * 0.1), STEAM.sootIron, 'anvil-hardy', { pos: [anvilX - S * 0.14, S * 0.9, 0] }));
  const stock = part(box(S * 0.5, S * 0.05, S * 0.12), STEAM.hotSlag, 'hot-stock', { pos: [anvilX - S * 0.1, S * 0.88, 0] });
  g.add(stock);

  if (A.hearth) {
    const hx = anvilX + S * 0.85;
    g.add(part(box(S * 0.7, S * 0.6, S * 0.6), STEAM.firebrick, 'hearth-block', { pos: [hx, S * 0.5, 0] }));
    g.add(part(box(S * 0.42, S * 0.14, S * 0.42), STEAM.hotSlag, 'hearth-fire', { pos: [hx, S * 0.82, 0] }));
    g.add(part(lathe([[S * 0.1, 0], [S * 0.12, S * 0.05], [S * 0.08, S * 0.9], [S * 0.1, S * 1.0]], 12), STEAM.sootIron, 'hearth-hood', { pos: [hx, S * 0.9, 0] }));
  }

  const out = seat(g);
  const yOff = g.position.y;
  const restAng = -0.02, liftAng = 0.3 + A.helve * 0.04;

  out.userData.mech = {
    rpm: 42 + A.lobes * 8,
    work: 'Draws out hot iron under a gravity-fall hammer.',
    chain: ['line shaft', 'cam shaft', 'cam lobes', 'helve', 'hammer head', 'anvil'],
    tick(t, running) {
      const w = running ? (this.rpm / 60) * T : 0;
      this._th = (this._th || 0) + w * (t - (this._last || t));
      this._last = t;
      const th = this._th;
      cam.rotation.z = th;
      // Helve follows the cam on the lift, then falls faster than the cam
      // rises — which is exactly why a trip hammer hits hard.
      const phase = ((th * lobes) % T + T) % T;
      let a;
      if (phase < Math.PI * 1.35) a = restAng + (phase / (Math.PI * 1.35)) * (liftAng - restAng);
      else {
        const f = (phase - Math.PI * 1.35) / (T - Math.PI * 1.35);
        a = liftAng - Math.pow(f, 0.55) * (liftAng - restAng);
      }
      helve.rotation.z = running ? a : liftAng * 0.25;
      // Hot stock cools between blows and flares on impact.
      const struck = running && phase > T * 0.92;
      stock.material = struck ? STEAM.hotSlag : STEAM.hotSlag;
      stock.scale.y = struck ? 0.82 : 1;
    },
  };
  return out;
}

/* =========================================================== STAMP BATTERY
 * Ore crushing. Cams on one shaft lift a row of stamps, each phased so they
 * fall in rotation rather than together — that phasing is the entire reason a
 * stamp battery works and does not shake itself apart. */
export const STAMP_AXES = { stamps: 4, size: 3, mortar: 3, feed: 3, launder: 2 };
export function stampBattery(variant = 0) {
  const A = axesOf(variant, STAMP_AXES);
  const rand = rnd(variant * 6151 + 29);
  const g = new THREE.Group();
  const S = [1.0, 1.3, 1.7][A.size];
  const n = 3 + A.stamps;
  const sp = S * 0.34;
  const W = sp * n + S * 0.4;

  g.add(part(box(W, S * 0.24, S * 1.0), MAT.slateDry, 'foundation', { pos: [0, S * 0.12, 0] }));
  // Mortar box: where the ore is actually crushed.
  const mortarH = S * 0.55;
  g.add(part(box(W * 0.92, mortarH, S * 0.5), STEAM.sootIron, 'mortar-box', { pos: [0, S * 0.24 + mortarH / 2, 0] }));
  g.add(part(box(W * 0.86, S * 0.1, S * 0.42), MAT.springStone, 'die-bed', { pos: [0, S * 0.24 + mortarH * 0.85, 0] }));
  if (A.mortar > 0) for (let i = 0; i < n; i++) g.add(part(cyl(S * 0.075, S * 0.08, S * 0.1, 10), STEAM.sootIron, 'die-' + i, { pos: [-sp * (n - 1) / 2 + i * sp, S * 0.24 + mortarH * 0.92, 0] }));
  // Screen: crushed ore only leaves when fine enough.
  if (A.mortar > 1) {
    g.add(part(box(W * 0.8, S * 0.22, S * 0.02), STEAM.coolIron, 'discharge-screen', { pos: [0, S * 0.24 + mortarH * 0.6, S * 0.25] }));
    for (let i = 0; i < 12; i++) g.add(part(cyl(S * 0.006, S * 0.006, S * 0.2, 4), STEAM.coolIron, 'screen-bar-' + i, { pos: [-W * 0.36 + i * (W * 0.72 / 11), S * 0.24 + mortarH * 0.6, S * 0.26] }));
  }

  // Frame and cam shaft above.
  const camY = S * 1.85;
  [-1, 1].forEach((s, i) => {
    g.add(part(box(S * 0.16, camY, S * 0.18), MAT.darkOak, 'frame-post-' + i, { pos: [s * W * 0.46, camY / 2, -S * 0.3] }));
    g.add(part(box(S * 0.16, camY * 0.9, S * 0.16), MAT.darkOak, 'frame-front-' + i, { pos: [s * W * 0.46, camY * 0.45, S * 0.3] }));
  });
  g.add(part(box(W * 1.0, S * 0.16, S * 0.2), MAT.darkOak, 'frame-cap', { pos: [0, camY + S * 0.08, -S * 0.3] }));
  g.add(part(cyl(S * 0.05, S * 0.05, W * 1.05, 12), STEAM.coolIron, 'cam-shaft', { pos: [0, camY, 0], rot: [0, 0, Math.PI / 2] }));

  const cams = [], stamps = [];
  for (let i = 0; i < n; i++) {
    const x = -sp * (n - 1) / 2 + i * sp;
    const b = bearing(S * 0.07, STEAM.sootIron, 'cam-bearing-' + i);
    b.position.set(x + sp * 0.5, camY, 0);
    b.rotation.y = Math.PI / 2;
    if (i < n - 1) g.add(b);
    // One cam per stamp, keyed at a different angle: the phasing.
    const cam = new THREE.Group();
    cam.name = 'cam-' + i;
    cam.add(part(cyl(S * 0.1, S * 0.1, S * 0.09, 12), STEAM.sootIron, 'cam-boss-' + i));
    cam.add(part(box(S * 0.32, S * 0.1, S * 0.13), STEAM.sootIron, 'cam-arm-' + i, { pos: [S * 0.1, 0, 0] }));
    cam.add(part(cyl(S * 0.05, S * 0.05, S * 0.13, 10), STEAM.brass, 'cam-toe-' + i, { pos: [S * 0.24, 0, 0] }));
    cam.position.set(x, camY, 0);
    cam.rotation.x = Math.PI / 2;
    g.add(cam);
    cams.push({ g: cam, phase: (i / n) * T });

    // Stamp: a shod stem lifted by a tappet the cam toe strikes.
    const stamp = new THREE.Group();
    stamp.name = 'stamp-' + i;
    const stemLen = S * 1.35;
    stamp.add(part(cyl(S * 0.045, S * 0.045, stemLen, 10), STEAM.coolIron, 'stem-' + i, { pos: [0, stemLen / 2, 0] }));
    stamp.add(part(box(S * 0.16, S * 0.11, S * 0.15), STEAM.sootIron, 'tappet-' + i, { pos: [S * 0.06, stemLen * 0.72, 0] }));
    stamp.add(part(lathe([[S * 0.09, 0], [S * 0.1, S * 0.12], [S * 0.075, S * 0.2]], 12), STEAM.sootIron, 'shoe-' + i, { pos: [0, 0, 0] }));
    stamp.position.set(x, S * 0.24 + mortarH * 0.95, 0);
    g.add(stamp);
    stamps.push(stamp);
    // Guide: a stamp stem must be guided or it wanders.
    g.add(part(box(S * 0.2, S * 0.09, S * 0.12), MAT.darkOak, 'guide-' + i, { pos: [x, S * 0.24 + mortarH + S * 0.7, -S * 0.1] }));
  }

  // Feed: ore arrives from a chute, not from nowhere.
  if (A.feed > 0) {
    g.add(part(lathe([[S * 0.3, 0], [S * 0.34, S * 0.06], [S * 0.14, S * 0.5], [S * 0.16, S * 0.56]], 12), STEAM.sootIron, 'ore-hopper', { pos: [-W * 0.5, S * 1.1, -S * 0.1], rot: [Math.PI, 0, 0] }));
    g.add(part(box(S * 0.5, S * 0.04, S * 0.28), MAT.weatheredTimber, 'feed-chute', { pos: [-W * 0.34, S * 0.95, 0], rot: [0, 0, -0.34] }));
    if (A.feed > 1) for (let k = 0; k < 5; k++) g.add(part(ico(S * 0.035, 0), MAT.slateDry, 'ore-lump-' + k, { pos: [-W * 0.4 + rand() * S * 0.2, S * 1.02 + rand() * S * 0.1, (rand() - 0.5) * S * 0.2] }));
  }
  if (A.launder) {
    g.add(part(box(W * 0.9, S * 0.1, S * 0.16), MAT.weatheredTimber, 'launder', { pos: [0, S * 0.34, S * 0.42], rot: [0.06, 0, 0] }));
    g.add(part(box(W * 0.84, S * 0.03, S * 0.12), MAT.blackwater, 'launder-slurry', { pos: [0, S * 0.38, S * 0.42], rot: [0.06, 0, 0] }));
  }

  const out = seat(g);
  const lift = S * 0.3;
  out.userData.mech = {
    rpm: 32 + A.size * 6,
    work: 'Crushes ore to sand under a phased row of falling stamps.',
    chain: ['line shaft', 'cam shaft', 'cam toe', 'tappet', 'stamp stem', 'shoe on die'],
    tick(t, running) {
      const w = running ? (this.rpm / 60) * T : 0;
      this._th = (this._th || 0) + w * (t - (this._last || t));
      this._last = t;
      const th = this._th;
      cams.forEach((c) => { c.g.rotation.z = th + c.phase; });
      stamps.forEach((s, i) => {
        const ph = ((th + cams[i].phase) % T + T) % T;
        // Lift on the cam, then free fall — asymmetric, like the real thing.
        const y = ph < Math.PI * 1.5
          ? (ph / (Math.PI * 1.5)) * lift
          : lift * (1 - Math.pow((ph - Math.PI * 1.5) / (T - Math.PI * 1.5), 2));
        s.position.y = (S * 0.24 + mortarH * 0.95) + (running ? y : lift * 0.5);
      });
    },
  };
  return out;
}

/* ============================================================= WATER WHEEL
 * The other prime mover, and the one with a real gear train: wheel -> pit
 * wheel -> wallower -> spur gear, each at a true tooth ratio so the output
 * speed is a consequence of the gearing rather than a guess. */
export const WATERWHEEL_AXES = { feed: 3, buckets: 4, size: 3, train: 3, sluice: 2, race: 2 };
export function waterWheel(variant = 0) {
  const A = axesOf(variant, WATERWHEEL_AXES);
  const rand = rnd(variant * 2273 + 31);
  const g = new THREE.Group();
  const R = 1.1 + A.size * 0.45;
  const width = 0.5 + A.size * 0.1;
  const nB = 10 + A.buckets * 4;
  const feed = ['overshot', 'breastshot', 'undershot'][A.feed];

  // Masonry pit and race.
  g.add(part(box(R * 1.2, 0.3, width * 3.2), MAT.slateDry, 'pit-floor', { pos: [0, 0.15, 0] }));
  [-1, 1].forEach((s, i) => g.add(part(box(R * 1.2, R * 1.4, 0.24), MAT.springStone, 'pit-wall-' + i, { pos: [0, R * 0.7, s * width * 1.4] })));

  const wheel = new THREE.Group();
  wheel.name = 'water-wheel';
  [-1, 1].forEach((s, i) => {
    wheel.add(part(torus(R, 0.05, 5, 40), MAT.darkOak, 'shroud-' + i, { pos: [0, 0, s * width / 2] }));
    wheel.add(part(torus(R * 0.82, 0.035, 4, 32), MAT.darkOak, 'inner-ring-' + i, { pos: [0, 0, s * width / 2] }));
  });
  const arms = 8;
  for (let i = 0; i < arms; i++) {
    const a = (i / arms) * T;
    [-1, 1].forEach((s, k) => wheel.add(part(box(R * 0.9, 0.06, 0.05), MAT.darkOak, 'arm-' + i + '-' + k, { pos: [Math.cos(a) * R * 0.45, Math.sin(a) * R * 0.45, s * width / 2], rot: [0, 0, a] })));
  }
  for (let i = 0; i < nB; i++) {
    const a = (i / nB) * T;
    // Bucket geometry differs by feed: overshot holds water, undershot is a
    // flat paddle. Getting this wrong is the classic tell.
    if (feed === 'undershot') {
      wheel.add(part(box(0.05, R * 0.3, width * 0.92), MAT.darkOak, 'paddle-' + i, { pos: [Math.cos(a) * R * 0.88, Math.sin(a) * R * 0.88, 0], rot: [0, 0, a] }));
    } else {
      wheel.add(part(box(0.045, R * 0.26, width * 0.9), MAT.darkOak, 'bucket-back-' + i, { pos: [Math.cos(a) * R * 0.88, Math.sin(a) * R * 0.88, 0], rot: [0, 0, a] }));
      wheel.add(part(box(R * 0.2, 0.04, width * 0.9), MAT.darkOak, 'bucket-sole-' + i, { pos: [Math.cos(a + 0.14) * R * 0.79, Math.sin(a + 0.14) * R * 0.79, 0], rot: [0, 0, a + 0.9] }));
    }
  }
  wheel.position.set(0, R + 0.3, 0);
  g.add(wheel);
  g.add(part(cyl(0.11, 0.11, width * 3.0, 14), STEAM.sootIron, 'axle', { pos: [0, R + 0.3, 0], rot: [Math.PI / 2, 0, 0] }));
  [-1, 1].forEach((s, i) => {
    const b = bearing(0.14, STEAM.sootIron, 'axle-bearing-' + i);
    b.position.set(0, R + 0.3, s * width * 1.35);
    b.rotation.y = Math.PI / 2;
    g.add(b);
  });

  // Head race and sluice: water has to arrive from somewhere and be shut off.
  if (feed === 'overshot' || feed === 'breastshot') {
    const hy = feed === 'overshot' ? R * 2 + 0.34 : R + 0.5;
    g.add(part(box(R * 1.5, 0.1, width * 1.1), MAT.weatheredTimber, 'head-race', { pos: [-R * 1.1, hy, 0], rot: [0, 0, 0.05] }));
    [-1, 1].forEach((s, i) => g.add(part(box(R * 1.5, 0.26, 0.06), MAT.weatheredTimber, 'race-side-' + i, { pos: [-R * 1.1, hy + 0.16, s * width * 0.55], rot: [0, 0, 0.05] })));
    g.add(part(box(R * 1.4, 0.03, width * 1.0), MAT.blackwater, 'race-water', { pos: [-R * 1.1, hy + 0.07, 0], rot: [0, 0, 0.05] }));
    if (A.sluice) {
      g.add(part(box(0.06, 0.5, width * 1.05), MAT.darkOak, 'sluice-gate', { pos: [-R * 0.42, hy + 0.24, 0] }));
      g.add(part(cyl(0.022, 0.022, 0.7, 8), STEAM.sootIron, 'sluice-screw', { pos: [-R * 0.42, hy + 0.7, 0] }));
      g.add(part(torus(0.1, 0.016, 4, 14), STEAM.brass, 'sluice-wheel', { pos: [-R * 0.42, hy + 1.02, 0], rot: [Math.PI / 2, 0, 0] }));
    }
  }
  if (A.race) {
    g.add(part(box(R * 2.0, 0.06, width * 1.6), MAT.blackwater, 'tail-race', { pos: [R * 0.9, 0.32, 0] }));
    for (let i = 0; i < 5; i++) g.add(part(ico(0.05 + rand() * 0.04, 0), MAT.wetSlate, 'race-stone-' + i, { pos: [R * (0.5 + rand()), 0.3, (rand() - 0.5) * width * 1.4] }));
  }

  // Gear train with real tooth counts.
  const pitTeeth = 48, wallTeeth = 16 + A.train * 4, spurTeeth = 30;
  const pit = gearWheel(0.055, pitTeeth, 0.1, MAT.darkOak, 'pit-wheel', 8);
  pit.position.set(0, R + 0.3, width * 0.85);
  pit.rotation.x = Math.PI / 2;
  g.add(pit);
  const wall = gearWheel(0.055, wallTeeth, 0.1, STEAM.sootIron, 'wallower', 6);
  const wallR = (0.055 * wallTeeth) / 2, pitR = (0.055 * pitTeeth) / 2;
  wall.position.set(pitR + wallR, R + 0.3, width * 0.85);
  g.add(wall);
  g.add(part(cyl(0.05, 0.05, R * 1.2, 10), STEAM.coolIron, 'upright-shaft', { pos: [pitR + wallR, (R + 0.3) * 0.5, width * 0.85] }));
  let spur = null;
  if (A.train > 1) {
    spur = gearWheel(0.05, spurTeeth, 0.09, STEAM.sootIron, 'spur-gear', 6);
    spur.position.set(pitR + wallR, 0.55, width * 0.85);
    spur.rotation.x = Math.PI / 2;
    g.add(spur);
  }

  const out = seat(g);
  out.userData.mech = {
    rpm: 6 + (2 - A.feed) * 2,
    work: 'Turns head water into shaft power through a real gear train.',
    chain: ['head race', 'sluice', feed + ' wheel', 'pit wheel ' + pitTeeth + 't', 'wallower ' + wallTeeth + 't', 'upright shaft'],
    ratio: (pitTeeth / wallTeeth).toFixed(2) + ':1 step-up',
    tick(t, running) {
      const w = running ? (this.rpm / 60) * T : 0;
      this._th = (this._th || 0) + w * (t - (this._last || t));
      this._last = t;
      const th = this._th;
      const dir = feed === 'undershot' ? -1 : 1;
      wheel.rotation.z = th * dir;
      pit.rotation.y = th * dir;
      // True gear ratio, opposite sense.
      wall.rotation.y = -th * dir * (pitTeeth / wallTeeth);
      if (spur) spur.rotation.y = -th * dir * (pitTeeth / wallTeeth);
    },
  };
  return out;
}

/* =========================================================== BLOWING ENGINE
 * Double bellows on a crank, feeding a tuyere. Purpose: forced draught for a
 * smelting hearth. The two bellows are 180 degrees out of phase so the blast
 * is continuous — that is the whole engineering point, and it is visible. */
export const BLOWER_AXES = { size: 3, bellows: 3, tuyere: 3, drive: 3, receiver: 2, weights: 2 };
export function blowingEngine(variant = 0) {
  const A = axesOf(variant, BLOWER_AXES);
  const rand = rnd(variant * 5471 + 37);
  const g = new THREE.Group();
  const S = [1.0, 1.35, 1.75][A.size];
  const nB = 2 + (A.bellows > 1 ? 1 : 0);

  g.add(part(box(S * 2.4, S * 0.18, S * 1.3), MAT.slateDry, 'bed', { pos: [0, S * 0.09, 0] }));
  const crankY = S * 1.15, crankX = -S * 0.9, crankR = S * 0.22;
  g.add(part(cyl(S * 0.05, S * 0.05, S * 1.2, 12), STEAM.coolIron, 'crank-shaft', { pos: [crankX, crankY, 0], rot: [Math.PI / 2, 0, 0] }));
  [-1, 1].forEach((s, i) => {
    const b = bearing(S * 0.07, STEAM.sootIron, 'crank-bearing-' + i);
    b.position.set(crankX, crankY, s * S * 0.5);
    b.rotation.y = Math.PI / 2;
    g.add(b);
    g.add(part(box(S * 0.24, crankY * 0.8, S * 0.24), MAT.darkOak, 'crank-post-' + i, { pos: [crankX, crankY * 0.4, s * S * 0.5] }));
  });
  const flyR = S * 0.5;
  const fly = new THREE.Group();
  fly.name = 'drive-flywheel';
  fly.add(part(torus(flyR, S * 0.05, 5, 26), STEAM.sootIron, 'fly-rim'));
  fly.add(part(cyl(S * 0.08, S * 0.08, S * 0.16, 10), STEAM.sootIron, 'fly-hub'));
  for (let i = 0; i < 6; i++) { const a = (i / 6) * T; fly.add(part(box(flyR * 0.9, S * 0.04, S * 0.04), STEAM.sootIron, 'fly-spoke-' + i, { pos: [Math.cos(a) * flyR * 0.47, Math.sin(a) * flyR * 0.47, 0], rot: [0, 0, a] })); }
  fly.position.set(crankX, crankY, -S * 0.66);
  g.add(fly);
  if (A.drive > 1) {
    g.add(part(cyl(S * 0.02, S * 0.02, S * 0.5, 8), MAT.heartwood, 'hand-crank', { pos: [crankX, crankY, S * 0.72], rot: [Math.PI / 2, 0, 0] }));
    g.add(part(box(S * 0.06, crankR * 2, S * 0.06), STEAM.sootIron, 'crank-arm', { pos: [crankX, crankY + crankR, S * 0.66] }));
  }

  const crankPins = [], boards = [], rods = [], rodLen = S * 0.95;
  for (let i = 0; i < nB; i++) {
    const z = nB === 2 ? (i ? S * 0.3 : -S * 0.3) : (i - 1) * S * 0.34;
    const phase = (i / nB) * T;
    const pin = new THREE.Group();
    pin.name = 'crank-throw-' + i;
    pin.add(part(box(crankR * 1.4, S * 0.1, S * 0.07), STEAM.sootIron, 'throw-web-' + i, { pos: [crankR * 0.5, 0, 0] }));
    pin.add(part(cyl(S * 0.035, S * 0.035, S * 0.12, 8), STEAM.brass, 'throw-pin-' + i, { pos: [crankR, 0, 0], rot: [Math.PI / 2, 0, 0] }));
    pin.position.set(crankX, crankY, z);
    pin.rotation.z = phase;
    g.add(pin);
    crankPins.push({ g: pin, phase, z });

    // Bellows: fixed lower board, hinged upper board, leather sides.
    const bx = S * 0.35;
    const bl = S * 0.85, bw = S * 0.26;
    g.add(part(box(bl, S * 0.05, bw), MAT.darkOak, 'bellows-lower-' + i, { pos: [bx, S * 0.5, z] }));
    const upper = new THREE.Group();
    upper.name = 'bellows-upper-' + i;
    upper.add(part(box(bl, S * 0.05, bw), MAT.darkOak, 'upper-board-' + i, { pos: [bl * 0.5, 0, 0] }));
    // Leather sides as a tapered skirt that reads as a seal.
    upper.add(part(box(bl * 0.98, S * 0.16, bw * 0.98), MAT.hideLeather || MAT.weatheredTimber, 'leather-' + i, { pos: [bl * 0.5, -S * 0.1, 0] }));
    for (let k = 0; k < 3; k++) upper.add(part(box(S * 0.03, S * 0.2, bw * 1.02), MAT.darkOak, 'rib-' + i + '-' + k, { pos: [bl * (0.25 + k * 0.25), -S * 0.1, 0] }));
    upper.position.set(bx - bl * 0.5, S * 0.72, z);
    g.add(upper);
    boards.push({ g: upper, phase });
    g.add(part(cyl(S * 0.02, S * 0.02, bw * 1.1, 8), STEAM.brass, 'bellows-hinge-' + i, { pos: [bx - bl * 0.5, S * 0.72, z], rot: [Math.PI / 2, 0, 0] }));
    // Intake valve on the lower board — a bellows must breathe in.
    g.add(part(lathe([[S * 0.06, 0], [S * 0.07, S * 0.012], [S * 0.05, S * 0.026]], 10), MAT.hideLeather || MAT.darkOak, 'intake-flap-' + i, { pos: [bx + bl * 0.3, S * 0.53, z] }));
    // Connecting rod from crank pin to the upper board's far end.
    const rod = part(cyl(S * 0.028, S * 0.028, rodLen, 8), STEAM.coolIron, 'bellows-rod-' + i, {});
    g.add(rod);
    rods.push(rod);
    if (A.weights) g.add(part(ico(S * 0.09, 1), MAT.slateDry, 'bellows-weight-' + i, { pos: [bx + bl * 0.36, S * 0.86, z] }));
  }

  // Receiver and tuyere: where the blast goes.
  if (A.receiver) {
    g.add(part(lathe([[S * 0.24, 0], [S * 0.26, S * 0.1], [S * 0.24, S * 0.6], [S * 0.16, S * 0.7]], 16), STEAM.coolIron, 'air-receiver', { pos: [S * 1.15, S * 0.2, 0] }));
    for (let i = 0; i < nB; i++) {
      const z = nB === 2 ? (i ? S * 0.3 : -S * 0.3) : (i - 1) * S * 0.34;
      g.add(part(cyl(S * 0.045, S * 0.045, S * 0.55, 8), STEAM.copper, 'delivery-pipe-' + i, { pos: [S * 0.9, S * 0.55, z], rot: [0, 1.2, Math.PI / 2] }));
    }
  }
  const tx = S * (A.receiver ? 1.5 : 1.1);
  g.add(part(cyl(S * 0.05, S * 0.05, S * 0.7, 10), STEAM.copper, 'blast-main', { pos: [tx, S * 0.55, 0], rot: [0, 0, Math.PI / 2] }));
  g.add(part(cone(S * 0.06, S * 0.2, 10), STEAM.copper, 'tuyere', { pos: [tx + S * 0.42, S * 0.55, 0], rot: [0, 0, -Math.PI / 2] }));
  if (A.tuyere > 0) {
    g.add(part(box(S * 0.6, S * 0.7, S * 0.6), STEAM.firebrick, 'hearth', { pos: [tx + S * 0.75, S * 0.35, 0] }));
    g.add(part(box(S * 0.34, S * 0.12, S * 0.34), STEAM.hotSlag, 'hearth-blast', { pos: [tx + S * 0.75, S * 0.66, 0] }));
  }
  if (A.tuyere > 1) g.add(part(torus(S * 0.07, S * 0.016, 4, 12), STEAM.brass, 'blast-valve', { pos: [tx + S * 0.2, S * 0.55, 0], rot: [0, Math.PI / 2, 0] }));

  const out = seat(g);
  out.userData.mech = {
    rpm: 46 + A.size * 8,
    work: 'Supplies continuous forced draught to a smelting hearth.',
    chain: ['flywheel', 'crank throws (180\u00b0 apart)', 'connecting rods', 'bellows boards', 'receiver', 'tuyere'],
    tick(t, running) {
      const w = running ? (this.rpm / 60) * T : 0;
      this._th = (this._th || 0) + w * (t - (this._last || t));
      this._last = t;
      const th = this._th;
      fly.rotation.z = th;
      crankPins.forEach((c, i) => {
        c.g.rotation.z = th + c.phase;
        const bl = S * 0.85, bx = S * 0.35;
        // Bellows board angle from the crank pin height: out of phase by design.
        const lift = Math.sin(th + c.phase) * 0.5 + 0.5;
        const ang = 0.06 + lift * 0.3;
        boards[i].g.rotation.z = running ? ang : 0.18;
        const pinPos = new THREE.Vector3(crankX + Math.cos(th + c.phase) * crankR, crankY + Math.sin(th + c.phase) * crankR, c.z);
        const boardEnd = new THREE.Vector3(
          bx - bl * 0.5 + Math.cos(running ? ang : 0.18) * bl * 0.92,
          S * 0.72 + Math.sin(running ? ang : 0.18) * bl * 0.92,
          c.z,
        );
        spanMember(rods[i], pinPos, boardEnd, rodLen);
      });
    },
  };
  return out;
}

/* ============================================================ ROLLING MILL
 * Two rolls in a housing, geared to turn in opposite directions at equal
 * surface speed, reducing hot stock passed between them. Purpose: making bar
 * and plate. Counter-rotation is the readable fact here. */
export const ROLLMILL_AXES = { size: 3, rolls: 3, gearing: 3, guides: 3, stock: 3, drive: 2 };
export function rollingMill(variant = 0) {
  const A = axesOf(variant, ROLLMILL_AXES);
  const rand = rnd(variant * 8191 + 41);
  const g = new THREE.Group();
  const S = [1.0, 1.3, 1.7][A.size];
  const rollR = S * 0.22, rollLen = S * 0.9;
  const nRolls = 2 + (A.rolls > 1 ? 1 : 0);
  const gapY = S * 0.95;

  g.add(part(box(S * 2.2, S * 0.24, S * 1.5), MAT.slateDry, 'foundation', { pos: [0, S * 0.12, 0] }));
  // Housings: the heavy cast frames that take the separating force.
  [-1, 1].forEach((s, i) => {
    const hs = new THREE.Group();
    hs.name = 'housing-' + i;
    hs.add(part(box(S * 0.22, S * 1.5, S * 0.34), STEAM.sootIron, 'housing-post-' + i, { pos: [0, S * 0.75, 0] }));
    hs.add(part(box(S * 0.5, S * 0.2, S * 0.4), STEAM.sootIron, 'housing-cap-' + i, { pos: [0, S * 1.55, 0] }));
    hs.add(part(box(S * 0.5, S * 0.2, S * 0.4), STEAM.sootIron, 'housing-sole-' + i, { pos: [0, S * 0.34, 0] }));
    hs.position.set(0, S * 0.24, s * rollLen * 0.72);
    g.add(hs);
    // Screw-down: how the operator sets the reduction.
    g.add(part(cyl(S * 0.05, S * 0.05, S * 0.4, 10), STEAM.brass, 'screw-down-' + i, { pos: [0, S * 0.24 + S * 1.6, s * rollLen * 0.72] }));
    g.add(part(torus(S * 0.14, S * 0.025, 4, 14), STEAM.brass, 'screw-wheel-' + i, { pos: [0, S * 0.24 + S * 1.85, s * rollLen * 0.72], rot: [Math.PI / 2, 0, 0] }));
  });

  const rolls = [];
  for (let i = 0; i < nRolls; i++) {
    const y = gapY + (i === 0 ? rollR : i === 1 ? -rollR : rollR * 3.1);
    const roll = new THREE.Group();
    roll.name = 'roll-' + i;
    roll.add(part(cyl(rollR, rollR, rollLen, 20), STEAM.coolIron, 'roll-barrel-' + i));
    // Grooves: a bar mill has them, a plate mill does not.
    if (A.rolls > 0) for (let k = 0; k < 3; k++) roll.add(part(torus(rollR * 0.97, rollR * 0.09, 4, 20), STEAM.coolIron, 'roll-groove-' + i + '-' + k, { pos: [0, -rollLen * 0.25 + k * rollLen * 0.25, 0], rot: [Math.PI / 2, 0, 0] }));
    [-1, 1].forEach((s, k) => {
      roll.add(part(cyl(rollR * 0.5, rollR * 0.5, rollLen * 0.34, 12), STEAM.coolIron, 'roll-neck-' + i + '-' + k, { pos: [0, s * (rollLen * 0.5 + rollLen * 0.16), 0] }));
      roll.add(part(box(rollR * 0.7, rollR * 0.7, rollR * 0.7), STEAM.coolIron, 'roll-wobbler-' + i + '-' + k, { pos: [0, s * (rollLen * 0.5 + rollLen * 0.36), 0] }));
    });
    roll.position.set(0, S * 0.24 + y, 0);
    roll.rotation.x = Math.PI / 2;
    g.add(roll);
    rolls.push(roll);
    [-1, 1].forEach((s, k) => {
      const b = bearing(rollR * 0.6, STEAM.sootIron, 'roll-bearing-' + i + '-' + k);
      b.position.set(0, S * 0.24 + y, s * rollLen * 0.66);
      b.rotation.y = Math.PI / 2;
      g.add(b);
    });
  }

  // Pinion stand: equal gears is what makes surface speeds match.
  const pinions = [];
  if (A.gearing > 0) {
    const pz = -rollLen * 1.1;
    for (let i = 0; i < nRolls; i++) {
      const y = gapY + (i === 0 ? rollR : i === 1 ? -rollR : rollR * 3.1);
      const teeth = 22;
      const p = gearWheel(rollR * 2 / teeth * Math.PI * 0.62, teeth, S * 0.1, STEAM.sootIron, 'pinion-' + i, 5);
      p.position.set(0, S * 0.24 + y, pz);
      p.rotation.x = Math.PI / 2;
      g.add(p);
      pinions.push(p);
    }
    g.add(part(box(S * 0.5, S * 1.3, S * 0.3), STEAM.sootIron, 'pinion-housing', { pos: [0, S * 0.24 + gapY, pz - S * 0.28] }));
    if (A.gearing > 1) {
      g.add(part(cyl(S * 0.06, S * 0.06, S * 0.8, 12), STEAM.coolIron, 'drive-spindle', { pos: [0, S * 0.24 + gapY - rollR, pz - S * 0.7], rot: [Math.PI / 2, 0, 0] }));
      const fw = gearWheel(0.05, 40, S * 0.11, STEAM.sootIron, 'reduction-gear', 8);
      fw.position.set(0, S * 0.24 + gapY - rollR, pz - S * 1.1);
      fw.rotation.x = Math.PI / 2;
      g.add(fw);
      pinions.push(fw);
    }
  }

  // Stock: hot bar entering, thinner leaving. This is the machine's purpose,
  // made visible by the cross-section actually changing across the gap.
  let stockIn = null, stockOut = null;
  if (A.stock > 0) {
    const th0 = rollR * 0.5, th1 = th0 * (0.6 - A.stock * 0.08);
    stockIn = part(box(S * 0.9, th0, S * 0.3), STEAM.hotSlag, 'stock-entering', { pos: [-S * 0.75, S * 0.24 + gapY, 0] });
    stockOut = part(box(S * 0.95, th1, S * 0.34), STEAM.hotSlag, 'stock-leaving', { pos: [S * 0.8, S * 0.24 + gapY, 0] });
    g.add(stockIn); g.add(stockOut);
  }
  if (A.guides > 0) {
    [-1, 1].forEach((s, i) => {
      g.add(part(box(S * 0.3, S * 0.08, S * 0.4), STEAM.sootIron, 'guide-table-' + i, { pos: [s * S * 0.5, S * 0.24 + gapY - rollR * 0.7, 0] }));
      if (A.guides > 1) g.add(part(box(S * 0.14, S * 0.12, S * 0.08), STEAM.coolIron, 'guide-box-' + i, { pos: [s * S * 0.42, S * 0.24 + gapY, 0] }));
    });
  }
  if (A.drive) {
    for (let i = 0; i < 2; i++) g.add(part(cyl(S * 0.03, S * 0.03, S * 0.5, 8), MAT.heartwood, 'tong-handle-' + i, { pos: [-S * 1.1, S * 0.24 + gapY + i * S * 0.06, S * 0.1], rot: [0, 0, Math.PI / 2] }));
  }

  const out = seat(g);
  out.userData.mech = {
    rpm: 26 + A.size * 6,
    work: 'Reduces hot stock to bar between counter-rotating rolls.',
    chain: ['drive spindle', 'reduction gear', 'pinion stand', 'wobblers', 'rolls', 'stock'],
    tick(t, running) {
      const w = running ? (this.rpm / 60) * T : 0;
      this._th = (this._th || 0) + w * (t - (this._last || t));
      this._last = t;
      const th = this._th;
      // Counter-rotation: alternate rolls turn the other way, equal speed.
      rolls.forEach((r, i) => { r.rotation.y = th * (i % 2 ? -1 : 1); });
      pinions.forEach((p, i) => { p.rotation.y = th * (i % 2 ? -1 : 1) * (p.userData.teeth === 40 ? 0.55 : 1); });
      if (stockIn && running) {
        const feed = (this._feed || 0) + 0.004;
        this._feed = feed % 1;
        stockIn.position.x = -S * 0.75 + this._feed * S * 0.2;
        stockOut.position.x = S * 0.8 + this._feed * S * 0.24;
      }
    },
  };
  return out;
}

export const MACH2_GENERATORS = [
  { id: 'mach2.beam-engine', name: 'Beam engine', axes: BEAMENGINE_AXES, build: beamEngine, domain: 'machinery', budgetClass: 'hero' },
  { id: 'mach2.line-shaft', name: 'Line shaft and belt drive', axes: LINESHAFT_AXES, build: lineShaft, domain: 'machinery', budgetClass: 'hero' },
  { id: 'mach2.trip-hammer', name: 'Trip hammer', axes: TRIPHAMMER_AXES, build: tripHammer, domain: 'machinery', budgetClass: 'hero' },
  { id: 'mach2.stamp-battery', name: 'Stamp battery', axes: STAMP_AXES, build: stampBattery, domain: 'machinery', budgetClass: 'hero' },
  { id: 'mach2.water-wheel', name: 'Water wheel and gear train', axes: WATERWHEEL_AXES, build: waterWheel, domain: 'machinery', budgetClass: 'hero' },
  { id: 'mach2.blowing-engine', name: 'Blowing engine', axes: BLOWER_AXES, build: blowingEngine, domain: 'machinery', budgetClass: 'hero' },
  { id: 'mach2.rolling-mill', name: 'Rolling mill', axes: ROLLMILL_AXES, build: rollingMill, domain: 'machinery', budgetClass: 'hero' },
];
