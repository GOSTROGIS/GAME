/* =========================================================================
   hm-actor-anim.js — the pose engine
   -------------------------------------------------------------------------
   Everything that makes a body read as a body with weight in it.

   The load-bearing decisions, stated up front because they are the whole
   difference between this and a mannequin waving:

   1. FEET ARE SOLVED, NOT ANIMATED. A planted foot holds a position in the
      GROUND's frame and is converted back into body space every frame. On a
      treadmill that means the plant translates backward at exactly -v. A foot
      therefore cannot skate, and cannot paddle on the spot, because its
      contact is a fact rather than a curve someone drew.

   2. CADENCE IS DERIVED. Step time comes from the inverted-pendulum period
      of the actor's own leg, π·sqrt(L/g), shortened as the Froude number
      rises. Stride length is then v·T. Nothing is hand-tuned per character,
      so a short character genuinely takes more steps to cross a room.

   3. THE PELVIS LEADS AND THE HEAD IS STABILISED. Pelvis oscillates twice
      per stride vertically and once laterally; the chest counter-rotates on a
      lag; the head cancels most of both so the gaze holds level. Head
      stabilisation is the single cheapest readability win available and most
      MMO walk cycles do not do it.

   4. BEARING IS A MODIFIER, NOT A CLIP. A limp is asymmetric stance duration
      plus a pelvic drop spike plus a lean — arithmetic on the same walk. That
      is why forty-two characters can share one cycle and still all walk
      differently.
   ========================================================================= */

import * as THREE from 'https://unpkg.com/three@0.184.0/build/three.module.js';
import { clamp } from './hm-actor.js?v=skin4';

const G = 9.81;
const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
/** Ease used for every commitment beat: fast out, long settle. Matches the
 *  design system's cubic-bezier(.16,1,.3,1) so motion here and motion in the
 *  interface are the same language. */
const settle = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const pulse = (t, c, w) => Math.exp(-Math.pow((t - c) / w, 2));

/* --------------------------------------------------------------- leg solver
   Closed-form two-bone IK in the leg's own plane. Returns the residual so an
   unreachable target is reported rather than papered over by stretching the
   bone — the same honesty rule the fauna kit uses. */
export function solveLeg(leg, tx, ty, tz, hipLocal) {
  const vx = tx - hipLocal.x, vy = ty - hipLocal.y, vz = tz - hipLocal.z;
  const a = leg.thighL, b = leg.shinL;
  const dRaw = Math.sqrt(vx * vx + vy * vy + vz * vz);
  const dMin = Math.abs(a - b) + 1e-4;
  const dMax = a + b - 1e-4;
  const d = clamp(dRaw, dMin, dMax);

  // Abduction: swing the whole plane sideways about Z.
  const abduct = Math.atan2(vx, -vy);
  // Sagittal target angle inside that plane.
  const planar = Math.sqrt(vx * vx + vy * vy);
  const theta = Math.atan2(vz, planar);

  const alpha = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  const interior = Math.acos(clamp((a * a + b * b - d * d) / (2 * a * b), -1, 1));

  leg.hip.rotation.set(-theta - alpha, 0, abduct);
  leg.knee.rotation.x = Math.PI - interior;
  return dRaw - d;   // metres of reach the stride asked for and did not get
}

/* ------------------------------------------------------------------- gait */

/** Inverted-pendulum step time for this actor's leg, shortened with speed. */
export function stepTime(legLen, v) {
  const fr = (v * v) / (G * Math.max(legLen, 0.05));
  return Math.PI * Math.sqrt(legLen / G) * (1 - 0.28 * clamp(fr / 0.5, 0, 1));
}

export function froude(v, legLen) { return (v * v) / (G * Math.max(legLen, 0.05)); }

/** Bearings. Each is arithmetic on the same cycle, never a separate clip. */
export const BEARINGS = {
  even: {},
  limp: { dutySkew: 0.16, dropSpike: 0.075, lean: 0.07, armDamp: 0.82 },
  stoop: { spine: 0.3, neck: -0.16, armDamp: 0.7, strideScale: 0.86 },
  guard: { armGuard: 1, armDamp: 0.34, chestLock: 0.6 },
  burden: { spine: 0.19, leanFwd: 0.05, oneArmDamp: 0.14, strideScale: 0.9 },
  stiff: { kneeClamp: 0.62, strideScale: 0.8, armDamp: 0.55, vertScale: 0.6 },
  composed: { vertScale: 0.44, armDamp: 0.42, strideScale: 0.94, headLock: 0.92 },
  ceremonial: { metronome: 1, vertScale: 0.7, armDamp: 0.3 },
  furtive: { spine: 0.14, strideScale: 0.82, vertScale: 0.7, headScan: 1 },
  reeling: { drift: 1, vertScale: 1.3, armDamp: 1.2 },
};

/* -------------------------------------------------------------- the engine
   `st` is the mutable per-actor animation state. It persists across frames
   because the coat springs and the foot plants are integrators, not curves. */
export function makeState(rig, spec) {
  return {
    t: 0, clipT: 0, clip: 'idle', prevClip: 'idle', blend: 1,
    phase: 0, speed: 0, targetSpeed: 0,
    plants: { L: { x: 0, z: 0, down: true }, R: { x: 0, z: 0, down: false } },
    panel: rig.panels.map(() => ({ x: 0, vx: 0, z: 0, vz: 0 })),
    veil: { a: 0, v: 0 },
    breath: Math.random() * TAU,
    blink: 1.4 + Math.random() * 2,
    residual: 0,
    bearing: BEARINGS[spec.bearing] ?? BEARINGS.even,
    look: { x: 0, y: 0 },
    _lastPelvis: new THREE.Vector3(),
  };
}

/** Reset every joint to the neutral stance the clips write on top of. */
function neutral(rig) {
  rig.pelvis.rotation.set(0, 0, 0);
  rig.pelvis.position.set(0, rig.hipY, 0);
  rig.spineLow.rotation.set(0, 0, 0);
  rig.spineMid.rotation.set(0, 0, 0);
  rig.chest.rotation.set(0, 0, 0);
  rig.neck.rotation.set(0, 0, 0);
  rig.head.rotation.set(0, 0, 0);
  if (rig.jaw) rig.jaw.rotation.x = 0;
  for (const k of ['L', 'R']) {
    const A = rig.arms[k];
    A.clav.rotation.set(0, 0, 0);
    A.shoulder.rotation.set(0, 0, A.side * 0.09);
    A.elbow.rotation.set(0, 0, 0);
    A.wrist.rotation.set(0, 0, 0);
  }
}

/** Fingers: 0 = flat open, 1 = closed grip. */
function grip(hand, amount, thumbAmount = amount) {
  const f = hand.userData.fingers || [];
  for (let i = 0; i < f.length; i++) {
    f[i].rotation.x = amount * 1.35;
    if (f[i].userData.tip) f[i].userData.tip.rotation.x = amount * 1.5;
  }
  if (hand.userData.thumb) hand.userData.thumb.rotation.x = thumbAmount * 0.9;
}

/* ----------------------------------------------------------- locomotion */
function locomote(rig, spec, st, dt, v) {
  const B = st.bearing;
  const legLen = rig.thighL + rig.shinL;
  const H = rig.H;
  const T = stepTime(legLen, v);
  const strideScale = B.strideScale ?? 1;
  const step = v * T * strideScale;

  st.phase = (st.phase + dt / (T * 2)) % 1;      // full stride = two steps
  const fr = froude(v, legLen);
  const running = fr > 0.5;
  const duty = running ? lerp(0.42, 0.32, clamp((fr - 0.5) / 1.5, 0, 1)) : lerp(0.66, 0.56, clamp(fr / 0.5, 0, 1));

  const halfSpan = step * 0.5;
  const clearance = (running ? 0.09 : 0.052) * H;

  let maxResid = 0;
  for (const key of ['L', 'R']) {
    const leg = rig.legs[key];
    // Contralateral offset, plus the limp's duty skew: the bad leg spends
    // less time in stance, which is what a limp physically IS.
    const skew = B.dutySkew ? (key === (spec.shortSide || 'L') ? -B.dutySkew : B.dutySkew) : 0;
    const p = (st.phase + (key === 'L' ? 0 : 0.5)) % 1;
    const legDuty = clamp(duty + skew, 0.22, 0.86);

    let fx, fy, fz;
    if (p < legDuty) {
      // STANCE. The contact is fixed in the ground's frame; on a treadmill
      // that frame moves backward at -v, so the plant translates and the
      // foot cannot skate. Nothing here is a curve.
      const s = p / legDuty;
      fz = halfSpan - s * step;
      fy = 0;
      // Ankle roll: heel strike through to toe-off, as a real contact does.
      const roll = s < 0.18 ? -0.34 * (1 - s / 0.18) : s > 0.72 ? 0.5 * smooth((s - 0.72) / 0.28) : 0;
      leg.ankle.userData.roll = roll;
    } else {
      // SWING. Arc from liftoff to the next touchdown.
      const s = (p - legDuty) / (1 - legDuty);
      fz = lerp(-halfSpan, halfSpan, smooth(s));
      fy = Math.sin(s * Math.PI) * clearance * (running ? 1 : 0.85);
      // Knee-lead: the shin trails the thigh through mid-swing.
      leg.ankle.userData.roll = lerp(-0.2, -0.36, Math.sin(s * Math.PI));
    }

    // Pelvis vertical: inverted pendulum, twice per stride, highest at
    // midstance. Amplitude scales with speed and is damped by bearing.
    const vertScale = (B.vertScale ?? 1);
    const bob = -Math.cos(st.phase * TAU * 2) * (running ? 0.032 : 0.016) * H * vertScale;
    const flight = running ? Math.max(0, Math.sin(st.phase * TAU * 2)) * 0.02 * H : 0;
    rig.pelvis.position.y = rig.hipY + bob + flight;

    const hipLocal = { x: leg.hip.position.x, y: leg.hip.position.y, z: leg.hip.position.z };
    const targetY = fy - (rig.pelvis.position.y - 0) + 0;
    const r = solveLeg(leg, hipLocal.x, targetY, fz, hipLocal);
    maxResid = Math.max(maxResid, Math.abs(r));

    if (B.kneeClamp) leg.knee.rotation.x = Math.min(leg.knee.rotation.x, B.kneeClamp);
    leg.ankle.rotation.x = -(leg.hip.rotation.x + leg.knee.rotation.x) + (leg.ankle.userData.roll || 0);
  }
  st.residual = maxResid;

  /* ---- pelvis lateral sway and drop. The drop is on the SWING side, and a
     limp exaggerates it into the spike that makes a hip read as painful. */
  const sway = Math.sin(st.phase * TAU) * 0.011 * H * (B.vertScale ?? 1);
  rig.pelvis.position.x = sway;
  const stanceIsL = ((st.phase) % 1) < duty;
  const dropBase = 0.035;
  const badSide = spec.shortSide || 'L';
  const onBad = (badSide === 'L') === stanceIsL;
  const spike = B.dropSpike ? B.dropSpike * (onBad ? 1 : 0.18) : 0;
  rig.pelvis.rotation.z = (stanceIsL ? -1 : 1) * (dropBase + spike);
  rig.pelvis.rotation.y = Math.sin(st.phase * TAU) * (running ? 0.14 : 0.075);

  /* ---- spine: chest counter-rotates the pelvis on a lag. */
  const lag = 0.12;
  const chestYaw = -Math.sin((st.phase - lag) * TAU) * (running ? 0.16 : 0.085) * (1 - (B.chestLock ?? 0));
  rig.spineLow.rotation.y = chestYaw * 0.35;
  rig.spineMid.rotation.y = chestYaw * 0.4;
  rig.chest.rotation.y = chestYaw * 0.25;
  rig.spineLow.rotation.x = (B.spine ?? 0) * 0.5 + (B.leanFwd ?? 0) + (running ? 0.1 : 0.03);
  rig.spineMid.rotation.x = (B.spine ?? 0) * 0.5;
  // Lean away from the painful side during its stance.
  if (B.lean) rig.spineLow.rotation.z = (onBad ? -1 : 0.15) * B.lean;

  /* ---- arms: contralateral, amplitude from speed. */
  const swing = (running ? 0.62 : 0.34) * (B.armDamp ?? 1);
  for (const key of ['L', 'R']) {
    const A = rig.arms[key];
    const s = key === 'L' ? 1 : -1;
    const ph = st.phase + (key === 'L' ? 0.5 : 0);
    const damp = (B.oneArmDamp != null && key === 'R') ? B.oneArmDamp : 1;
    if (B.armGuard) {
      A.shoulder.rotation.x = -0.5 + Math.sin(ph * TAU) * 0.1;
      A.shoulder.rotation.z = A.side * 0.34;
      A.elbow.rotation.x = 1.5;
      grip(A.hand, 0.9);
    } else {
      A.shoulder.rotation.x = Math.sin(ph * TAU) * swing * damp;
      A.shoulder.rotation.z = A.side * (0.1 + Math.abs(Math.sin(ph * TAU)) * 0.04);
      A.elbow.rotation.x = 0.28 + (running ? 0.7 : 0.16) + Math.max(0, Math.sin(ph * TAU)) * 0.3;
      grip(A.hand, 0.32 + Math.max(0, -Math.sin(ph * TAU)) * 0.2);
    }
  }
  return { running, T, step, duty };
}

/* ------------------------------------------------------------------ clips
   Twelve per character. Ten of them are shared arithmetic; `signature` and
   `work` are the two authored per person, which is where individuality that
   is not a parameter comes from. */
export const CLIP_LIST = [
  { id: 'idle', label: 'Idle', dur: 4.2, kind: 'stand' },
  { id: 'signature', label: 'Signature', dur: 5.6, kind: 'stand' },
  { id: 'walk', label: 'Walk', dur: 0, kind: 'loco', speed: 1.28 },
  { id: 'run', label: 'Run', dur: 0, kind: 'loco', speed: 3.4 },
  { id: 'declare', label: 'Declare', dur: 2.4, kind: 'act' },
  { id: 'attack_a', label: 'Strike', dur: 1.5, kind: 'act' },
  { id: 'attack_b', label: 'Heavy', dur: 2.3, kind: 'act' },
  { id: 'block', label: 'Guard', dur: 3.0, kind: 'act' },
  { id: 'hurt', label: 'Hurt', dur: 1.1, kind: 'act' },
  { id: 'death', label: 'Death', dur: 2.8, kind: 'act', hold: true },
  { id: 'work', label: 'Occupation', dur: 4.8, kind: 'act' },
  { id: 'turn', label: 'Turn', dur: 1.6, kind: 'loco', speed: 0.5, turn: true },
];

const CLIP_BY_ID = Object.fromEntries(CLIP_LIST.map((c) => [c.id, c]));

/* Standing clips still solve the legs, so a standing actor is standing ON
   something rather than floating at a guessed height. */
function planted(rig, spec, st, stanceWidth = 0.02, lean = 0) {
  const H = rig.H;
  for (const key of ['L', 'R']) {
    const leg = rig.legs[key];
    const hipLocal = { x: leg.hip.position.x, y: leg.hip.position.y, z: leg.hip.position.z };
    const out = (key === 'L' ? -1 : 1) * stanceWidth * H;
    const fwd = (key === (spec.leadFoot || 'L') ? 0.045 : -0.02) * H;
    solveLeg(leg, hipLocal.x + out, -(rig.pelvis.position.y), fwd + lean, hipLocal);
    leg.ankle.rotation.x = -(leg.hip.rotation.x + leg.knee.rotation.x);
  }
}

function breathe(rig, st, amt = 1) {
  const b = Math.sin(st.breath) * amt;
  rig.chest.rotation.x = -0.02 * b;
  rig.spineMid.rotation.x += 0.012 * b;
  rig.neck.rotation.x += 0.01 * b;
}

const CLIPS = {
  idle(rig, spec, st, t) {
    const B = st.bearing;
    const H = rig.H;
    rig.pelvis.position.y = rig.hipY - 0.006 * H + Math.sin(st.breath) * 0.0035 * H;
    // Weight shift: a standing person changes support leg every few seconds.
    const shift = Math.sin(t * 0.42) * 0.5 + Math.sin(t * 0.19) * 0.3;
    rig.pelvis.position.x = shift * 0.016 * H;
    rig.pelvis.rotation.z = -shift * 0.05;
    rig.spineLow.rotation.x = (B.spine ?? 0) * 0.55 + 0.028;
    rig.spineMid.rotation.x = (B.spine ?? 0) * 0.45;
    rig.spineLow.rotation.z = shift * 0.03 + (B.lean ? B.lean * 0.4 : 0);
    rig.chest.rotation.y = Math.sin(t * 0.31) * 0.05;
    planted(rig, spec, st, 0.021, 0);
    breathe(rig, st, 1);
    for (const key of ['L', 'R']) {
      const A = rig.arms[key];
      if (B.armGuard) {
        A.shoulder.rotation.x = -0.42; A.shoulder.rotation.z = A.side * 0.3;
        A.elbow.rotation.x = 1.42; grip(A.hand, 0.85);
      } else {
        A.shoulder.rotation.x = -0.04 + Math.sin(t * 0.5 + (key === 'L' ? 0 : 1.1)) * 0.035;
        A.shoulder.rotation.z = A.side * (0.13 + (B.spine ?? 0) * 0.1);
        A.elbow.rotation.x = 0.3 + (B.spine ?? 0) * 0.5 + Math.sin(t * 0.44) * 0.05;
        grip(A.hand, 0.36);
      }
    }
    // Head: slow scan, and the furtive bearing scans wider and faster.
    const scan = B.headScan ? 1.9 : 1;
    rig.head.rotation.y = Math.sin(t * 0.27 * scan) * 0.2 * scan;
    rig.head.rotation.x = (B.neck ?? 0) + Math.sin(t * 0.21) * 0.05;
  },

  walk(rig, spec, st, t, dt) { locomote(rig, spec, st, dt, CLIP_BY_ID.walk.speed * (spec.pace ?? 1)); },
  run(rig, spec, st, t, dt) { locomote(rig, spec, st, dt, CLIP_BY_ID.run.speed * (spec.pace ?? 1)); },

  turn(rig, spec, st, t, dt) {
    locomote(rig, spec, st, dt, 0.5);
    // A real turn is led by the head, then the chest, then the hips. Getting
    // that order right is most of why a turn reads as intent.
    const a = Math.sin(t * (TAU / CLIP_BY_ID.turn.dur));
    rig.head.rotation.y = a * 0.75;
    rig.chest.rotation.y += a * 0.4;
    rig.spineMid.rotation.y += a * 0.3;
    rig.pelvis.rotation.y += a * 0.22;
    rig.root.rotation.y = a * 0.5;
  },

  /* The turn-based telegraph. This is the pose the whole combat system is
     read from: intent is declared on one turn and resolves on the next, so
     the declaration must be legible from the isometric camera at a glance,
     and it must be a HOLD rather than a motion. */
  declare(rig, spec, st, t) {
    const d = CLIP_BY_ID.declare.dur;
    const p = t / d;
    const rise = settle(clamp(p / 0.28, 0, 1));
    const hold = clamp((p - 0.3) / 0.5, 0, 1);
    const H = rig.H;
    rig.pelvis.position.y = rig.hipY - 0.03 * H * rise;
    rig.pelvis.rotation.y = -0.24 * rise;
    rig.spineLow.rotation.x = 0.14 * rise + (st.bearing.spine ?? 0) * 0.5;
    rig.chest.rotation.y = 0.3 * rise;
    planted(rig, spec, st, 0.038, 0.03 * rise);
    const A = rig.arms[spec.mainHand || 'R'], O = rig.arms[spec.mainHand === 'L' ? 'R' : 'L'];
    A.shoulder.rotation.x = -0.95 * rise;
    A.shoulder.rotation.z = A.side * 0.5 * rise;
    A.elbow.rotation.x = 1.75 * rise;
    grip(A.hand, 1);
    O.shoulder.rotation.x = 0.42 * rise;
    O.shoulder.rotation.z = O.side * 0.62 * rise;
    O.elbow.rotation.x = 0.7 * rise;
    grip(O.hand, 0.15);
    rig.head.rotation.y = 0.3 * rise;
    rig.head.rotation.x = -0.1 * rise;
    // The hold is not static: it trembles. A held telegraph that is perfectly
    // still reads as a paused video.
    const tremor = hold * Math.sin(t * 21) * 0.012;
    A.elbow.rotation.x += tremor;
    rig.chest.rotation.z = tremor * 0.5;
    breathe(rig, st, 1.6);
  },

  attack_a(rig, spec, st, t) {
    const d = CLIP_BY_ID.attack_a.dur;
    const p = clamp(t / d, 0, 1);
    // startup .32 / active .12 / recovery .56 — the same three-phase shape
    // the bestiary already declares for every encounter role.
    const wind = p < 0.32 ? settle(p / 0.32) : 1;
    const strike = p >= 0.32 && p < 0.44 ? smooth((p - 0.32) / 0.12) : p >= 0.44 ? 1 : 0;
    const rec = p >= 0.44 ? settle((p - 0.44) / 0.56) : 0;
    const H = rig.H;
    const A = rig.arms[spec.mainHand || 'R'], O = rig.arms[spec.mainHand === 'L' ? 'R' : 'L'];

    const throwT = strike - rec * 0.55;
    rig.pelvis.rotation.y = -0.3 * wind + 0.62 * throwT;
    rig.chest.rotation.y = -0.42 * wind + 0.85 * throwT;
    rig.spineMid.rotation.y = -0.2 * wind + 0.4 * throwT;
    rig.spineLow.rotation.x = 0.1 * wind + 0.12 * throwT;
    rig.pelvis.position.y = rig.hipY - 0.022 * H * wind + 0.01 * H * throwT;
    rig.pelvis.position.z = 0.03 * H * throwT;
    planted(rig, spec, st, 0.042, 0.05 * throwT);

    A.shoulder.rotation.x = -1.5 * wind + 2.3 * throwT;
    A.shoulder.rotation.z = A.side * (0.7 * wind - 0.3 * throwT);
    A.elbow.rotation.x = 1.9 * wind - 1.6 * throwT;
    A.wrist.rotation.x = -0.3 * wind + 0.5 * throwT;
    grip(A.hand, 1);
    O.shoulder.rotation.x = 0.5 * wind - 0.3 * throwT;
    O.shoulder.rotation.z = O.side * 0.5;
    O.elbow.rotation.x = 0.9;
    grip(O.hand, 0.4);
    rig.head.rotation.y = -0.2 * wind + 0.36 * throwT;
    rig.head.rotation.x = 0.12 * throwT;
  },

  attack_b(rig, spec, st, t) {
    const d = CLIP_BY_ID.attack_b.dur;
    const p = clamp(t / d, 0, 1);
    const wind = p < 0.42 ? settle(p / 0.42) : 1;
    const drop = p >= 0.42 && p < 0.56 ? smooth((p - 0.42) / 0.14) : p >= 0.56 ? 1 : 0;
    const rec = p >= 0.58 ? settle((p - 0.58) / 0.42) : 0;
    const H = rig.H;
    const A = rig.arms[spec.mainHand || 'R'], O = rig.arms[spec.mainHand === 'L' ? 'R' : 'L'];
    const t2 = drop - rec * 0.4;

    // Overhead commitment. Both hands, deep knees, and it cannot be cancelled
    // — the juggernaut contract, expressed as a pose.
    rig.pelvis.position.y = rig.hipY + 0.03 * H * wind - 0.075 * H * t2;
    rig.spineLow.rotation.x = -0.22 * wind + 0.5 * t2;
    rig.spineMid.rotation.x = -0.16 * wind + 0.34 * t2;
    rig.pelvis.rotation.y = 0;
    planted(rig, spec, st, 0.058, 0.02);
    for (const key of ['L', 'R']) {
      const Arm = rig.arms[key];
      Arm.shoulder.rotation.x = -2.5 * wind + 3.2 * t2;
      Arm.shoulder.rotation.z = Arm.side * (0.28 + 0.14 * wind);
      Arm.elbow.rotation.x = 0.55 + 0.5 * wind - 0.5 * t2;
      grip(Arm.hand, 1);
    }
    rig.head.rotation.x = -0.3 * wind + 0.55 * t2;
    // Impact shudder — three frames, then gone.
    const sh = drop > 0.9 && rec < 0.3 ? Math.sin((p - 0.56) * 90) * 0.02 * (1 - rec / 0.3) : 0;
    rig.chest.rotation.z = sh;
    rig.head.rotation.z = -sh * 1.4;
  },

  block(rig, spec, st, t) {
    const H = rig.H;
    const brace = 0.7 + Math.sin(t * 1.4) * 0.06;
    rig.pelvis.position.y = rig.hipY - 0.05 * H;
    rig.pelvis.rotation.y = -0.34;
    rig.spineLow.rotation.x = 0.2;
    rig.chest.rotation.y = -0.24;
    planted(rig, spec, st, 0.055, -0.03);
    for (const key of ['L', 'R']) {
      const A = rig.arms[key];
      A.shoulder.rotation.x = -1.05 * brace;
      A.shoulder.rotation.z = A.side * 0.62;
      A.elbow.rotation.x = 1.85;
      A.wrist.rotation.z = A.side * -0.3;
      grip(A.hand, 1);
    }
    rig.head.rotation.x = 0.22;
    rig.neck.rotation.x = 0.14;
    breathe(rig, st, 2.2);
  },

  hurt(rig, spec, st, t) {
    const d = CLIP_BY_ID.hurt.dur;
    const p = clamp(t / d, 0, 1);
    const hit = pulse(p, 0.1, 0.07);
    const rec = settle(clamp((p - 0.14) / 0.86, 0, 1));
    const H = rig.H;
    const k = hit * (1 - rec * 0.6);
    rig.pelvis.position.z = -0.06 * H * k;
    rig.pelvis.position.y = rig.hipY - 0.03 * H * k;
    rig.spineLow.rotation.x = -0.34 * k + 0.16 * (1 - rec) ;
    rig.chest.rotation.x = -0.3 * k;
    rig.chest.rotation.z = 0.24 * k;
    rig.head.rotation.x = -0.5 * k;
    rig.head.rotation.z = 0.3 * k;
    planted(rig, spec, st, 0.05, -0.04 * k);
    for (const key of ['L', 'R']) {
      const A = rig.arms[key];
      A.shoulder.rotation.x = -0.3 - 0.5 * k;
      A.shoulder.rotation.z = A.side * (0.2 + 0.3 * k);
      A.elbow.rotation.x = 0.6 + 0.9 * k;
      grip(A.hand, 0.5 + 0.5 * k);
    }
    if (rig.jaw) rig.jaw.rotation.x = 0.28 * k;
  },

  death(rig, spec, st, t) {
    const d = CLIP_BY_ID.death.dur;
    const p = clamp(t / d, 0, 1);
    const H = rig.H;
    // Three beats: the legs go first, then the spine, then the head. A body
    // that collapses as one rigid piece is the commonest tell of a bad death
    // animation — the order of failure is the whole thing.
    const legs = settle(clamp(p / 0.34, 0, 1));
    const spine = settle(clamp((p - 0.2) / 0.5, 0, 1));
    const headF = settle(clamp((p - 0.42) / 0.5, 0, 1));
    rig.pelvis.position.y = rig.hipY - (rig.hipY - 0.1 * H) * legs;
    rig.pelvis.position.z = -0.04 * H * legs;
    rig.pelvis.rotation.x = 0.5 * legs;
    rig.pelvis.rotation.z = 0.24 * legs;
    rig.spineLow.rotation.x = 0.7 * spine;
    rig.spineMid.rotation.x = 0.5 * spine;
    rig.chest.rotation.x = 0.3 * spine;
    rig.chest.rotation.z = -0.2 * spine;
    rig.neck.rotation.x = 0.5 * headF;
    rig.head.rotation.x = 0.6 * headF;
    rig.head.rotation.z = 0.35 * headF;
    if (rig.jaw) rig.jaw.rotation.x = 0.34 * headF;
    for (const key of ['L', 'R']) {
      const leg = rig.legs[key];
      leg.hip.rotation.set(-0.4 - 0.7 * legs * (key === 'L' ? 1 : 0.6), 0, (key === 'L' ? -1 : 1) * 0.3 * legs);
      leg.knee.rotation.x = 1.5 * legs;
      leg.ankle.rotation.x = -0.3 * legs;
      const A = rig.arms[key];
      A.shoulder.rotation.x = 0.3 + 0.9 * spine * (key === 'L' ? 1 : 0.5);
      A.shoulder.rotation.z = A.side * (0.3 + 0.5 * spine);
      A.elbow.rotation.x = 0.3 + 0.5 * spine;
      grip(A.hand, Math.max(0, 0.5 - headF * 0.5));
    }
  },

  work(rig, spec, st, t) {
    (spec.workClip || genericWork)(rig, spec, st, t, { grip, planted, breathe, settle, smooth, pulse, lerp, TAU });
  },

  signature(rig, spec, st, t) {
    (spec.signatureClip || CLIPS.idle)(rig, spec, st, t, { grip, planted, breathe, settle, smooth, pulse, lerp, TAU });
  },
};

function genericWork(rig, spec, st, t, K) {
  const H = rig.H;
  const c = Math.sin(t * 1.6);
  rig.pelvis.position.y = rig.hipY - 0.02 * H;
  rig.spineLow.rotation.x = 0.24 + c * 0.05;
  rig.spineMid.rotation.x = 0.16;
  K.planted(rig, spec, st, 0.03, 0);
  for (const key of ['L', 'R']) {
    const A = rig.arms[key];
    A.shoulder.rotation.x = -0.62 + c * 0.16 * (key === 'L' ? 1 : -1);
    A.shoulder.rotation.z = A.side * 0.34;
    A.elbow.rotation.x = 1.3 + c * 0.2;
    K.grip(A.hand, 0.72);
  }
  rig.head.rotation.x = 0.3;
  K.breathe(rig, st, 1.2);
}

/* --------------------------------------------------------- secondary pass
   Runs after every clip, on everything the clip does not own: coat swing,
   veil lift, head stabilisation, blink. All integrators, so all of it lags
   the body by a frame or two — which is the point. */
function secondary(rig, spec, st, dt) {
  // Coat panels: driven by pelvis velocity, not by a sine. A coat that
  // swings when the body is still is the tell that it is faked.
  const p = rig.pelvis;
  const vel = { x: (p.position.x - st._lastPelvis.x) / Math.max(dt, 1e-4), y: (p.position.y - st._lastPelvis.y) / Math.max(dt, 1e-4) };
  st._lastPelvis.copy(p.position);
  const k = 46, damp = 8.4;
  for (let i = 0; i < rig.panels.length; i++) {
    const pv = rig.panels[i], s = st.panel[i];
    const drive = -vel.x * 0.05 - Math.max(0, -vel.y) * 0.02;
    s.vx += (-k * s.x + drive * 26) * dt;
    s.vx -= damp * s.vx * dt;
    s.x += s.vx * dt;
    const yaw = pv.rotation.y;
    pv.rotation.x = clamp(s.x * Math.cos(yaw), -0.5, 0.5);
    pv.rotation.z = clamp(s.x * Math.sin(yaw) * -1, -0.5, 0.5);
  }

  if (rig.veil) {
    st.veil.v += (-70 * st.veil.a - Math.max(0, -vel.y) * 3.2) * dt;
    st.veil.v -= 9 * st.veil.v * dt;
    st.veil.a += st.veil.v * dt;
    rig.veil.rotation.x = clamp(st.veil.a, -0.55, 0.2);
  }

  // Head stabilisation. The vestibulo-ocular reflex holds the gaze level;
  // cancel most of the accumulated chest yaw and pelvic roll so the head is
  // the one part of the body that is NOT bouncing.
  const lock = st.bearing.headLock ?? 0.72;
  rig.head.rotation.y -= (rig.chest.rotation.y + rig.spineMid.rotation.y + rig.pelvis.rotation.y) * lock;
  rig.head.rotation.z -= (rig.pelvis.rotation.z + rig.spineLow.rotation.z) * lock * 0.8;
  rig.head.rotation.x -= (rig.spineLow.rotation.x + rig.spineMid.rotation.x) * lock * 0.55;

  st.breath += dt * (spec.breathHz ?? 0.42) * TAU;
}

/** One actor, one frame. */
export function stepActor(rig, spec, st, dt, clipId) {
  if (clipId && clipId !== st.clip) {
    st.clip = clipId;
    st.clipT = 0;
    if (CLIP_BY_ID[clipId]?.kind !== 'loco') st.phase = 0;
  }
  const clip = CLIP_BY_ID[st.clip] || CLIP_BY_ID.idle;
  st.t += dt;
  st.clipT += dt;
  if (clip.dur > 0) {
    if (clip.hold) st.clipT = Math.min(st.clipT, clip.dur);
    else st.clipT %= clip.dur;
  }
  neutral(rig);
  rig.root.rotation.y = 0;
  (CLIPS[st.clip] || CLIPS.idle)(rig, spec, st, st.clipT, dt);
  secondary(rig, spec, st, dt);
  return st;
}

export { CLIPS, CLIP_BY_ID, grip, planted, breathe, genericWork, settle, smooth, pulse, lerp, clamp };
