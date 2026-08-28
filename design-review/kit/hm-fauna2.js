/* Ambient fauna, part two — arthropods, fliers, water, and the lit families.
 *
 * Same contract as hm-fauna.js: builders return geometry plus a rig
 * description, and the engine there walks it. Three families need locomotion
 * the engine does not have a mode for — a hanging bat, a firefly swarm, a
 * drifting marsh light — so they supply a `tickOverride`, which is the engine's
 * one declared extension point rather than a fork of it.
 *
 * WHERE THE LIT FAMILIES COME FROM. Neither is invented:
 *
 *   dunmire   vfx  marsh_light_drifter     -> fauna.wisp
 *             props  reed_sister_marker    -> the reed-sister form
 *   hearthmere vfx  lantern_moth_sparse    -> fauna.moth, and its light pull
 *              vfx  bell_dust_pulse        -> the bell-mote form
 *   cinderward vfx  ember_iron_spark       -> the spark-gnat form
 *
 * The brief asked for faeries. This world does not do winged sprites, so the
 * faerie here is what the repo already calls a marsh light: a drifting, cold,
 * roughly hand-sized light with something suggested inside it, which the Reed
 * Coven bestiary family treats as kin. It is hopeful because it is warm-adjacent
 * and harmless in a place where nothing else is — not because it is cute.
 */
import { THREE, rnd, jitter, part, limb, cone, cyl, ico, torus, sg, cnt } from './hm-core.js';
import { axesOf, spaceOf } from './hm-steam.js';
import { FAUNA, legRig, solveLeg, assemble, headRig, tailRig, torso, box, clamp, T, headingTo, glowSprite, glowTexture, wingbeatHz } from './hm-fauna.js';

const _v = new THREE.Vector3();

/* Wing membranes. The first pass gave every small flier the same pale dusty
 * membrane, which is why a moth, a mayfly, a lacewing and a gnat all read as
 * one sparkly thing at any distance. These are four different wings: a moth's
 * is opaque and scaled, a mayfly's is glassy and nearly colourless, a
 * lacewing's is a long green-tinted net, a gnat's is small and dark. Colours
 * are still the palette's — needle green, ash, bark, bone. */
const WM = (name, color, opacity, rough = 0.9) => {
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color), roughness: rough, metalness: 0,
    side: THREE.DoubleSide, transparent: opacity < 1, opacity,
  });
  m.name = name;
  return m;
};
const WING = {
  mothDust: [
    WM('wing-moth-ash', '#5a5348', 0.94),
    WM('wing-moth-bone', '#8a8272', 0.9),
    WM('wing-moth-bark', '#3d3328', 0.95),
    WM('wing-moth-heather', '#5d3b39', 0.92),
  ],
  mothBand: WM('wing-moth-band', '#241f1b', 0.96),
  mayfly: WM('wing-mayfly-glass', '#b7b6ad', 0.3, 0.35),
  lacewing: WM('wing-lacewing', '#2b3a31', 0.34, 0.5),
  gnat: WM('wing-gnat', '#24292b', 0.42, 0.6),
};

/* =========================================================================
   FAMILY 7 — beetles and roaches. Hexapod, alternating tripod.
   Forms: stag beetle (mandibles), ground beetle (long, fast), roach (flat,
   wide, antennae), cricket (jumping hind legs, raised abdomen).
   ======================================================================= */
export const BEETLE_AXES = { form: 4, carapace: 3, size: 3, horn: 3, legs: 2, sheen: 2 };
export function beetle(variant = 0) {
  const A = axesOf(variant, BEETLE_AXES);
  const rand = rnd(0x6b12 + variant * 7919);
  const forms = ['stag', 'ground', 'roach', 'cricket'];
  const form = forms[A.form];
  const g = new THREE.Group();

  const S = [0.6, 1, 1.6][A.size];
  const len = (form === 'roach' ? 0.045 : form === 'cricket' ? 0.04 : 0.05) * S;
  const r = len * (form === 'roach' ? 0.62 : 0.44);
  const shell = [FAUNA.chitinBlack, FAUNA.chitinBronze, FAUNA.chitinGlass][A.carapace];
  if (A.sheen === 1) {
    // The one place metalness is allowed above the kit's usual cap: an elytron
    // genuinely is a specular shell. Held to 0.2 because the stage has no
    // environment map, and metalness with nothing to reflect renders black.
    const m = shell.clone();
    m.name = shell.name + '-sheen';
    m.metalness = 0.2;
    m.roughness = 0.28;
    g.userData.sheenMat = m;
  }
  const mat = g.userData.sheenMat || shell;

  // Head, thorax, abdomen — three tagmata, and the split is what makes it read
  // as an insect rather than a lump with legs.
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(len * 0.62, r * 0.2, 0);
  g.add(head);
  const hg = ico(r * 0.52, 1);
  hg.scale(1.1, 0.72, 1);
  jitter(hg, r * 0.08, rand);
  head.add(part(hg, mat, 'head-capsule'));

  const thg = ico(r * 0.72, 1);
  thg.scale(1.25, 0.62, 1.05);
  jitter(thg, r * 0.08, rand);
  g.add(part(thg, mat, 'pronotum', { pos: [len * 0.26, r * 0.24, 0] }));

  const abg = ico(r, 1);
  abg.scale(form === 'cricket' ? 1.9 : 1.55, 0.68, 1);
  jitter(abg, r * 0.09, rand);
  const abdomen = part(abg, mat, 'abdomen', { pos: [-len * 0.28, r * 0.26, 0] });
  if (form === 'cricket') abdomen.rotation.z = -0.24;
  g.add(abdomen);

  // Elytra: two hard wing cases with a seam down the middle.
  if (form !== 'roach') {
    for (const s of [1, -1]) {
      const el = ico(r * 0.9, 1);
      el.scale(1.5, 0.5, 0.6);
      jitter(el, r * 0.06, rand);
      g.add(part(el, mat, 'elytron-' + (s > 0 ? 'l' : 'r'),
        { pos: [-len * 0.26, r * 0.4, s * r * 0.34], rot: [s * 0.1, 0, -0.05] }));
    }
  }

  // Horn / mandibles. The axis that changes the silhouette most.
  const horn = ['none', 'mandible', 'clypeal', 'thoracic'][A.horn];
  if (horn === 'mandible') {
    for (const s of [1, -1]) {
      for (let i = 0; i < 2; i++) {
        const md = limb(r * 0.05, r * 0.09, r * (0.7 - i * 0.25), 5);
        head.add(part(md, mat, 'mandible-' + (s > 0 ? 'l' : 'r') + i, {
          pos: [r * (0.55 + i * 0.3), r * 0.02, s * r * (0.2 + i * 0.12)],
          rot: [0, s * (0.5 - i * 0.7), Math.PI / 2 - 0.3],
        }));
      }
    }
  } else if (horn === 'clypeal') {
    const hn = cone(r * 0.13, r * 1.1, 6);
    head.add(part(hn, mat, 'clypeal-horn', { pos: [r * 0.5, r * 0.35, 0], rot: [0, 0, -0.9] }));
  } else if (horn === 'thoracic') {
    const hn = cone(r * 0.17, r * 1.25, 6);
    g.add(part(hn, mat, 'thoracic-horn', { pos: [len * 0.34, r * 0.6, 0], rot: [0, 0, -1.15] }));
  }

  // Antennae. Long and jointed on a roach, clubbed on a beetle.
  const antennae = [];
  for (const s of [1, -1]) {
    const ag = new THREE.Group();
    ag.position.set(r * 0.5, r * 0.2, s * r * 0.28);
    const aLen = form === 'roach' ? len * 1.5 : len * 0.55;
    const an = limb(r * 0.02, r * 0.04, aLen, 4);
    an.rotateZ(-1.15);
    ag.add(part(an, FAUNA.chitinBlack, 'antenna', { pos: [aLen * 0.42, aLen * 0.18, 0] }));
    ag.userData.base = 0;
    head.add(ag);
    antennae.push(ag);
  }

  const hip = r * (form === 'roach' ? 0.7 : 0.95);
  const legs = [];
  const rows = [len * 0.34, len * 0.02, -len * 0.3];
  for (let row = 0; row < 3; row++) {
    for (const s of [1, -1]) {
      const key = (s > 0 ? 'L' : 'R') + (row + 1);
      const hind = row === 2 && form === 'cricket';
      legs.push(legRig(g, {
        key, hip: [rows[row], r * 0.1, s * r * 0.62],
        L1: hip * (hind ? 1.3 : 0.75) * [1, 1.35][A.legs],
        L2: hip * (hind ? 1.5 : 0.95) * [1, 1.35][A.legs],
        r1: r * 0.07, r2: r * 0.05, bend: row === 0 ? -1 : 1,
        foot: 'none', mat: FAUNA.chitinBlack,
        reach: hip * (form === 'ground' ? 1.15 : 0.9),
      }));
      // Tarsus: a short angled tip so the leg does not end in a stump.
      const tip = limb(r * 0.02, r * 0.04, hip * 0.4, 4);
      tip.rotateZ(1.2);
      legs[legs.length - 1].ankle.add(part(tip, FAUNA.chitinBlack, 'tarsus-' + key, { pos: [hip * 0.16, -hip * 0.08, 0] }));
    }
  }

  const spec = {
    species: form, family: 'fauna.beetle', form,
    label: { stag: 'Stag beetle', ground: 'Cairn beetle', roach: 'Kiln roach', cricket: 'Reed cricket' }[form],
    locomotion: 'quadruped', hipHeight: hip, bodyLen: len,
    gaits: ['tripod'],
    speeds: { walk: 0.1 * S, run: (form === 'ground' ? 0.55 : 0.34) * S },
    turnRate: 3.2, accel: 4, flushRadius: 0.9,
    legs, headG: head, ears: antennae, forageDip: 0.1,
    budgetClass: 'minor', glowParts: [abdomen],
    regions: form === 'roach' ? ['cinderward', 'hollow_abbey'] : ['hearthmere', 'graven_march', 'dunmire'],
  };
  return assemble(g, spec);
}

/* =========================================================================
   FAMILY 8 — spiders and harvestmen. Octopod, metachronal wave.
   The web axis is a silhouette change, not a decoration: an orb weaver sitting
   in its web is a different object from one walking.
   ======================================================================= */
export const SPIDER_AXES = { form: 3, legspan: 3, abdomen: 3, size: 2, marking: 2, web: 2 };
export function spider(variant = 0) {
  const A = axesOf(variant, SPIDER_AXES);
  const rand = rnd(0x8c55 + variant * 7919);
  const forms = ['orb', 'harvestman', 'wolf'];
  const form = forms[A.form];
  const g = new THREE.Group();

  const S = [0.7, 1.15][A.size];
  const bodyR = (form === 'harvestman' ? 0.008 : 0.013) * S;
  const chit = A.marking === 0 ? FAUNA.chitinBlack : FAUNA.chitinBronze;

  const ceph = ico(bodyR, 1);
  ceph.scale(1.35, 0.7, 1.1);
  jitter(ceph, bodyR * 0.12, rand);
  g.add(part(ceph, chit, 'cephalothorax', { pos: [bodyR * 0.9, 0, 0] }));

  const abR = bodyR * [1.15, 1.6, 2.2][A.abdomen] * (form === 'harvestman' ? 0.65 : 1);
  const ab = ico(abR, 1);
  ab.scale(1.2, 0.92, 1);
  jitter(ab, abR * 0.12, rand);
  const abdomen = part(ab, chit, 'abdomen', { pos: [-abR * 0.75, abR * 0.1, 0] });
  g.add(abdomen);
  if (A.marking === 1) {
    for (let i = 0; i < cnt(3); i++) {
      const mk = box(abR * 0.5, abR * 0.1, abR * 0.35);
      g.add(part(mk, FAUNA.furPale, 'mark-' + i, { pos: [-abR * (0.4 + i * 0.42), abR * 0.85, 0] }));
    }
  }

  for (const s of [1, -1]) {
    const ch = cone(bodyR * 0.16, bodyR * 0.5, 4);
    ch.rotateZ(-Math.PI / 2);
    g.add(part(ch, chit, 'chelicera-' + (s > 0 ? 'l' : 'r'), { pos: [bodyR * 1.9, -bodyR * 0.2, s * bodyR * 0.22] }));
    g.add(part(ico(bodyR * 0.14, 0), FAUNA.eye, 'eye-' + (s > 0 ? 'l' : 'r'), { pos: [bodyR * 1.55, bodyR * 0.4, s * bodyR * 0.25] }));
  }

  const span = bodyR * [4.5, 7, 11][A.legspan] * (form === 'harvestman' ? 2.1 : 1);
  const hip = span * 0.34;
  const legs = [];
  for (let row = 0; row < 4; row++) {
    for (const s of [1, -1]) {
      const key = (s > 0 ? 'L' : 'R') + (row + 1);
      const fwd = bodyR * (1.3 - row * 0.7);
      legs.push(legRig(g, {
        key, hip: [fwd, 0, s * bodyR * 0.6],
        L1: span * 0.5, L2: span * 0.56,
        r1: bodyR * 0.09, r2: bodyR * 0.06,
        // Spider legs fold UP into a tent: the femur rises, the tibia drops.
        bend: -1, foot: 'none', mat: FAUNA.chitinBlack, reach: hip * 0.75,
      }));
    }
  }

  // The web: a radial frame with three spiral rings. Thin sheet geometry, so
  // it is marked as such — a flat web that self-shadows renders as a black disc.
  if (A.web === 1 && form === 'orb') {
    const web = new THREE.Group();
    web.name = 'web';
    const R = span * 2.6;
    const wm = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#a9a291'), roughness: 0.95, transparent: true,
      opacity: 0.24, side: THREE.DoubleSide,
    });
    wm.name = 'web-silk';
    for (let i = 0; i < cnt(8); i++) {
      const a2 = (i / 8) * T;
      const rad = box(R * 2, R * 0.006, R * 0.006);
      web.add(part(rad, wm, 'radius-' + i, { rot: [a2, 0, 0] }));
    }
    for (let i = 1; i <= cnt(3); i++) {
      const ring = torus(R * (i / 3.2), R * 0.004, 3, sg(16));
      web.add(part(ring, wm, 'spiral-' + i, { rot: [0, Math.PI / 2, 0] }));
    }
    web.rotation.z = Math.PI / 2;
    web.position.y = span * 1.2;
    g.add(web);
    web.traverse((n) => { if (n.isMesh) { n.userData.noCast = true; n.userData.noShadow = true; } });
  }

  const spec = {
    species: form, family: 'fauna.spider', form,
    label: { orb: 'Reed orb-weaver', harvestman: 'Harvestman', wolf: 'Cellar wolf-spider' }[form],
    locomotion: 'quadruped', hipHeight: hip, bodyLen: bodyR * 3,
    gaits: ['wave8'],
    speeds: { walk: 0.06 * S, run: (form === 'wolf' ? 0.5 : 0.3) * S },
    turnRate: 4.5, accel: 6, flushRadius: 0.7,
    legs, headG: null, ears: [], forageDip: 0,
    budgetClass: 'minor', glowParts: [abdomen],
    regions: ['hearthmere', 'dunmire', 'hollow_abbey', 'cinderward'],
  };
  return assemble(g, spec);
}

/* =========================================================================
   FAMILY 9 — crustaceans. Mire crab, crayfish, slater.
   Crabs walk sideways. The body is built rotated a quarter turn so the
   engine's forward axis is the animal's lateral one — the gait engine does not
   need to know, which is the point of keeping locomotion generic.
   ======================================================================= */
export const CRAB_AXES = { form: 3, claw: 3, carapace: 3, size: 2, legs: 2, encrust: 2 };
export function crab(variant = 0) {
  const A = axesOf(variant, CRAB_AXES);
  const rand = rnd(0xa2d4 + variant * 7919);
  const forms = ['crab', 'crayfish', 'slater'];
  const form = forms[A.form];
  const g = new THREE.Group();
  const inner = new THREE.Group();
  inner.name = 'chassis';
  if (form === 'crab') inner.rotation.y = Math.PI / 2; // sideways walker
  g.add(inner);

  const S = [0.75, 1.2][A.size];
  const w = (form === 'crayfish' ? 0.05 : 0.07) * S;
  const shell = [FAUNA.chitinBlack, FAUNA.chitinBronze, FAUNA.scaleSilver][A.carapace];

  const car = ico(w * 0.7, 1);
  car.scale(form === 'crayfish' ? 1.9 : 1.5, 0.55, form === 'crayfish' ? 0.8 : 1.15);
  jitter(car, w * 0.07, rand);
  inner.add(part(car, shell, 'carapace'));
  if (form !== 'crab') {
    for (let i = 0; i < cnt(4); i++) {
      const seg = ico(w * (0.42 - i * 0.06), 1);
      seg.scale(0.9, 0.6, 1);
      inner.add(part(seg, shell, 'pleon-' + i, { pos: [-w * (0.7 + i * 0.34), -w * 0.05, 0] }));
    }
    const fan = cone(w * 0.4, w * 0.5, 5);
    fan.rotateZ(Math.PI / 2);
    inner.add(part(fan, shell, 'telson', { pos: [-w * 2.1, -w * 0.05, 0] }));
  }
  for (const s of [1, -1]) {
    const st = new THREE.Group();
    st.position.set(w * 0.85, w * 0.25, s * w * 0.28);
    const stalk = limb(w * 0.035, w * 0.045, w * 0.3, 4);
    st.add(part(stalk, shell, 'eyestalk', { pos: [0, w * 0.15, 0] }));
    st.add(part(ico(w * 0.07, 0), FAUNA.eye, 'eye', { pos: [0, w * 0.32, 0] }));
    st.userData.base = 0;
    inner.add(st);
  }

  // Chelae. The claw axis is asymmetric on purpose at the top setting: one
  // oversized claw is what a real fiddler has, and it changes the silhouette.
  const claws = [];
  const clawScale = [0.55, 0.9, 1.35][A.claw];
  for (const s of [1, -1]) {
    const cg = new THREE.Group();
    cg.position.set(w * 0.9, -w * 0.05, s * w * 0.5);
    const sc = s > 0 || A.claw < 2 ? clawScale : clawScale * 0.55;
    const arm = limb(w * 0.09 * sc, w * 0.11 * sc, w * 0.55 * sc, 6);
    arm.rotateZ(-Math.PI / 2 + 0.5);
    cg.add(part(arm, shell, 'claw-arm', { pos: [w * 0.25 * sc, 0, 0] }));
    const palm = ico(w * 0.22 * sc, 1);
    palm.scale(1.4, 0.8, 0.7);
    cg.add(part(palm, shell, 'claw-palm', { pos: [w * 0.6 * sc, w * 0.12 * sc, 0] }));
    for (const f of [1, -1]) {
      const fin = cone(w * 0.07 * sc, w * 0.4 * sc, 5);
      fin.rotateZ(-Math.PI / 2);
      cg.add(part(fin, shell, 'dactyl', { pos: [w * 0.95 * sc, w * (0.12 + f * 0.1) * sc, 0], rot: [0, 0, f * 0.2] }));
    }
    cg.userData.base = 0;
    inner.add(cg);
    claws.push(cg);
  }

  /* Encrusted. Anything that lives in the Dunmire long enough grows a second
     population on its back: barnacle cases and weed. Geometry and a second
     material, so it counts as an axis — and it is the difference between a
     crab and a crab that has been in the water for two seasons. */
  if (A.encrust === 1) {
    for (let i = 0; i < cnt(7); i++) {
      const b = cyl(w * 0.055, w * 0.075, w * 0.05, 5);
      inner.add(part(b, FAUNA.scaleSilver, 'barnacle-' + i, {
        pos: [(rand() - 0.5) * w * 1.2, w * 0.3 + rand() * w * 0.05, (rand() - 0.5) * w * 0.9],
      }));
    }
    for (let i = 0; i < cnt(5); i++) {
      const wd = box(w * 0.02, w * (0.3 + rand() * 0.4), w * 0.06);
      inner.add(part(wd, FAUNA.scaleDark, 'weed-' + i, {
        pos: [(rand() - 0.5) * w, w * 0.4, (rand() - 0.5) * w * 0.8],
        rot: [(rand() - 0.5) * 0.9, rand() * 3, (rand() - 0.5) * 0.9],
      }));
    }
  }

  const hip = w * 0.55;
  const legs = [];
  for (let row = 0; row < 4; row++) {
    for (const s of [1, -1]) {
      const key = (s > 0 ? 'L' : 'R') + (row + 1);
      legs.push(legRig(g, {
        key, hip: [w * (0.4 - row * 0.32), -w * 0.1, s * w * 0.5],
        L1: hip * 0.85 * [1, 1.3][A.legs], L2: hip * 0.95 * [1, 1.3][A.legs],
        r1: w * 0.055, r2: w * 0.04, bend: -1, foot: 'none',
        mat: shell, reach: hip * 0.8,
      }));
    }
  }

  const spec = {
    species: form + (A.encrust === 1 ? '-encrusted' : ''), family: 'fauna.crab', form,
    label: { crab: 'Mire crab', crayfish: 'Sluice crayfish', slater: 'Cellar slater' }[form],
    locomotion: 'quadruped', hipHeight: hip, bodyLen: w * 2,
    gaits: ['wave8'],
    speeds: { walk: 0.12 * S, run: 0.42 * S },
    turnRate: 2.6, accel: 5, flushRadius: 1.1,
    legs, headG: null, ears: claws, forageDip: 0,
    budgetClass: 'minor', glowParts: [],
    regions: ['dunmire', 'cinderward'],
  };
  return assemble(g, spec);
}

/* =========================================================================
   FAMILY 10 — moths and small fliers. Lantern moth, mayfly, lacewing, gnat.
   `lantern_moth_sparse` is a declared Hearthmere vfx row with no asset. The
   light attraction in the engine's flutter mode is that row's actual content:
   these things are only interesting because they gather at the braziers.
   ======================================================================= */
export const MOTH_AXES = { form: 4, wing: 4, size: 3, antenna: 2, tatter: 2, settled: 2 };
export function moth(variant = 0) {
  const A = axesOf(variant, MOTH_AXES);
  const rand = rnd(0xd10c + variant * 7919);
  const forms = ['lantern-moth', 'mayfly', 'lacewing', 'gnat'];
  const form = forms[A.form];
  const g = new THREE.Group();

  const S = [0.55, 1, 1.7][A.size];
  const bodyLen = (form === 'gnat' ? 0.008 : form === 'mayfly' ? 0.016 : 0.02) * S;
  const r = bodyLen * 0.3;
  const fur = A.form === 0 ? FAUNA.furPale : FAUNA.chitinBlack;

  const th = ico(r * 1.25, 1);
  th.scale(1.2, 1, 1);
  jitter(th, r * 0.14, rand);
  g.add(part(th, fur, 'thorax'));
  const ab = ico(r, 1);
  ab.scale(form === 'mayfly' ? 3.2 : 2.1, 0.85, 0.85);
  jitter(ab, r * 0.1, rand);
  const abdomen = part(ab, fur, 'abdomen', { pos: [-bodyLen * 0.55, 0, 0] });
  g.add(abdomen);
  const head = new THREE.Group();
  head.position.set(bodyLen * 0.42, r * 0.1, 0);
  g.add(head);
  head.add(part(ico(r * 0.62, 1), fur, 'head'));
  for (const s of [1, -1]) {
    head.add(part(ico(r * 0.3, 0), FAUNA.eye, 'eye-' + (s > 0 ? 'l' : 'r'), { pos: [r * 0.3, r * 0.1, s * r * 0.4] }));
  }

  // Antennae: plumose on a moth, filamentous otherwise. Real difference.
  for (const s of [1, -1]) {
    if (A.antenna === 1 && form === 'lantern-moth') {
      for (let i = 0; i < cnt(5); i++) {
        const b = limb(r * 0.02, r * 0.03, r * 0.5, 3);
        head.add(part(b, fur, 'plume-' + (s > 0 ? 'l' : 'r') + i, {
          pos: [r * (0.5 + i * 0.22), r * 0.4, s * r * (0.2 + i * 0.06)], rot: [s * 0.9, 0, -0.5],
        }));
      }
    } else {
      const an = limb(r * 0.015, r * 0.03, bodyLen * 0.7, 3);
      an.rotateZ(-1.2);
      head.add(part(an, fur, 'antenna-' + (s > 0 ? 'l' : 'r'), { pos: [bodyLen * 0.3, bodyLen * 0.22, s * r * 0.25] }));
    }
  }

  /* Wings. Fore and hind pairs on separate groups so the flap can phase them,
     which is what stops a four-winged insect looking like a two-winged one.
     A tattered wing is a bitten arc removed from the outline — geometry, not
     a texture, because there is no texture budget on a 40-triangle animal.

     Profile is per form, not per parameter: a mayfly's wing is a narrow blade
     held vertically, a lacewing's is twice as long as its body, a moth's is
     broad and overlapping, a gnat's is a stub. That is the difference between
     four species and one species in four tints. */
  const isMoth = form === 'lantern-moth';
  const wingMat = isMoth ? WING.mothDust[A.wing]
    : form === 'mayfly' ? WING.mayfly
      : form === 'lacewing' ? WING.lacewing : WING.gnat;
  const wings = [];
  const span = bodyLen * (isMoth ? 1.8 : form === 'lacewing' ? 2.3 : form === 'mayfly' ? 1.5 : 0.85);
  const chord = isMoth ? 0.66 : form === 'lacewing' ? 0.3 : form === 'mayfly' ? 0.26 : 0.42;
  for (const s of [1, -1]) {
    const wg = new THREE.Group();
    wg.position.set(bodyLen * 0.1, r * 0.5, s * r * 0.35);
    const arc = A.tatter === 1 ? Math.PI * 0.78 : Math.PI;
    const fore = new THREE.CircleGeometry(span, sg(isMoth ? 10 : 7), 0, arc);
    fore.rotateX(-Math.PI / 2);
    fore.scale(1, 1, chord);
    fore.translate(0, 0, s * span * 0.1);
    const fm = part(fore, wingMat, 'forewing-' + (s > 0 ? 'l' : 'r'));
    fm.rotation.y = s > 0 ? -0.2 : Math.PI + 0.2;
    wg.add(fm);
    // A moth's forewing carries a dark cross-band. It is the single cheapest
    // thing that makes the silhouette legible against a lit ground.
    if (isMoth) {
      const band = box(span * 0.14, span * 0.004, span * chord * 1.5);
      wg.add(part(band, WING.mothBand, 'band-' + (s > 0 ? 'l' : 'r'), {
        pos: [span * 0.12, r * 0.02, s * span * chord * 0.55], rot: [0, s * 0.2, 0],
      }));
    }
    if (form !== 'gnat') {
      const hind = new THREE.CircleGeometry(span * (isMoth ? 0.62 : 0.78), sg(isMoth ? 8 : 6), 0, arc);
      hind.rotateX(-Math.PI / 2);
      hind.scale(1, 1, chord * 1.1);
      const hm = part(hind, wingMat, 'hindwing-' + (s > 0 ? 'l' : 'r'), { pos: [-span * 0.42, -r * 0.12, 0] });
      hm.rotation.y = s > 0 ? -0.3 : Math.PI + 0.3;
      wg.add(hm);
    }
    wg.traverse((n) => { if (n.isMesh) { n.userData.noCast = true; n.userData.noShadow = true; } });
    g.add(wg);
    wings.push(wg);
  }
  if (form === 'mayfly') {
    for (const s of [1, -1, 0]) {
      const f = limb(r * 0.012, r * 0.02, bodyLen * 2.2, 3);
      f.rotateZ(Math.PI / 2);
      g.add(part(f, fur, 'cercus-' + s, { pos: [-bodyLen * 2, 0, s * r * 0.2], rot: [0, s * 0.12, 0] }));
    }
  }

  const settled = A.settled === 1;
  const spec = {
    species: form + (settled ? '-settled' : ''), family: 'fauna.moth', form,
    label: (settled ? 'Settled ' : '') + { 'lantern-moth': 'lantern moth', mayfly: 'spring mayfly', lacewing: 'lacewing', gnat: 'ash gnat' }[form],
    locomotion: settled ? 'perch' : 'flutter', hipHeight: settled ? 0.004 : 0.02, bodyLen,
    // Wingbeat is derived from wing length rather than authored; the physical
    // and rendered frequencies differ and both are carried. See wingbeatHz().
    flapHz: wingbeatHz(span).rendered,
    flapPhysicalHz: wingbeatHz(span).physical,
    wingAliased: wingbeatHz(span).aliased,
    flapAmp: 1.05 * wingbeatHz(span).ampScale, wingBase: 0.52, cruiseY: form === 'gnat' ? 1.1 : 1.7,
    lightPull: form === 'lantern-moth' ? 9 : 3.5,
    speeds: { walk: form === 'gnat' ? 0.7 : 1.15, run: 1.6 },
    turnRate: 7, accel: 12, flushRadius: 0.8,
    legs: [], wings, headG: head, ears: [],
    budgetClass: 'minor', glowParts: [abdomen],
    regions: ['hearthmere', 'dunmire', 'cinderward', 'hollow_abbey'],
    settled, tickOverride: settled ? tickSettled : null,
  };
  const root = assemble(g, spec);
  if (settled) {
    // Wings folded flat over the abdomen: the delta silhouette you actually
    // see on a wall beside a lamp, which is a different object from the one in
    // the air and is why this is an axis.
    wings.forEach((w, i) => {
      w.rotation.z = (i === 0 ? 1 : -1) * 0.06;
      w.rotation.x = (i === 0 ? 1 : -1) * 0.42;
      w.position.y = r * 0.28;
    });
  }
  return root;
}

/** Settled: it sits, it shivers, and every so often it resettles a hand's
 *  width away. A moth at a lamp is mostly stationary, and animating it as a
 *  permanent flier is the commonest way this kind of ambient life reads wrong. */
function tickSettled(group, c, a, dt, ctx) {
  a.t = (a.t || 0) + dt;
  a.stateT -= dt;
  if (a.stateT <= 0) {
    a.shiver = 0.5 + a.rand() * 0.8;
    a.stateT = 1.5 + a.rand() * 5;
    if (a.rand() < 0.35) {
      // A short resettle rather than a flight: a few centimetres, no gait.
      a.pos.x += (a.rand() - 0.5) * 0.25;
      a.pos.z += (a.rand() - 0.5) * 0.25;
      a.heading += (a.rand() - 0.5) * 2.2;
    }
  }
  a.shiver = Math.max(0, (a.shiver || 0) - dt);
  const ground = ctx.groundAt || (() => 0);
  c.root.position.set(a.pos.x, ground(a.pos.x, a.pos.z) + c.hipHeight, a.pos.z);
  c.root.rotation.y = a.heading;
  const sh = a.shiver > 0 ? Math.sin(a.t * 46) * 0.13 * a.shiver : 0;
  c.wings.forEach((w, i) => { w.rotation.z = (i === 0 ? 1 : -1) * (0.06 + sh); });
  if (c.headG) c.headG.rotation.y = Math.sin(a.t * 0.7) * 0.2;
  c.gait = 'settled';
  c.froude = 0; c.residual = 0; c.skate = 0;
}

/* =========================================================================
   FAMILY 11 — bats. Pipistrelle, long-ear, abbey bat.
   The roost axis is two different objects: flying, or hanging inverted from a
   beam. A hanging bat has no gait, so it supplies a tickOverride.
   ======================================================================= */
export const BAT_AXES = { form: 3, wing: 3, ear: 3, size: 2, pelt: 2, roost: 2 };
export function bat(variant = 0) {
  const A = axesOf(variant, BAT_AXES);
  const rand = rnd(0xbe70 + variant * 7919);
  const forms = ['pipistrelle', 'long-ear', 'abbey'];
  const form = forms[A.form];
  const roosting = A.roost === 1;
  const g = new THREE.Group();

  const S = [0.8, 1.25][A.size] * (form === 'abbey' ? 1.4 : 1);
  const bodyLen = 0.055 * S;
  const r = bodyLen * 0.36;
  const pelt = [FAUNA.furDark, FAUNA.furRust][A.pelt];

  const body = ico(r, 1);
  body.scale(1.7, 0.95, 0.85);
  jitter(body, r * 0.12, rand);
  g.add(part(body, pelt, 'body'));

  const H = headRig(g, {
    at: [bodyLen * 0.42, r * 0.22, 0], r: r * 0.62, mat: pelt, muzzle: 1.1,
    ear: [1.8, 2.8, 4.2][A.ear] * (form === 'long-ear' ? 1.5 : 1), earW: 0.42,
    earMat: FAUNA.membrane, eye: 0.16, skull: 1.2,
  }, rand);

  /* Wing: a membrane spanning four finger struts. Building the struts is the
     difference between a bat and a bird with dark wings — the fingers are the
     leading edge and the membrane sags between them. */
  const span = bodyLen * [1.9, 2.4, 3.1][A.wing];
  const wings = [];
  for (const s of [1, -1]) {
    const wg = new THREE.Group();
    wg.position.set(bodyLen * 0.1, r * 0.35, s * r * 0.55);
    const arm = limb(r * 0.07, r * 0.09, span * 0.42, 5);
    arm.rotateX(Math.PI / 2);
    wg.add(part(arm, pelt, 'humerus', { pos: [0, 0, s * span * 0.2] }));
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(span * 0.34, 0.0);
    shape.quadraticCurveTo(span * 0.5, -span * 0.42, span * 0.06, -span * 0.5);
    shape.quadraticCurveTo(-span * 0.3, -span * 0.42, -span * 0.42, -span * 0.05);
    shape.lineTo(0, 0);
    const mem = new THREE.ShapeGeometry(shape, sg(8));
    mem.rotateX(Math.PI / 2);
    mem.rotateY(-Math.PI / 2);
    const mm = part(mem, FAUNA.membrane, 'membrane-' + (s > 0 ? 'l' : 'r'), { pos: [0, 0, s * span * 0.42] });
    mm.scale.z = s;
    wg.add(mm);
    for (let i = 0; i < cnt(4); i++) {
      const f = limb(r * 0.025, r * 0.04, span * (0.62 - i * 0.08), 4);
      f.rotateX(Math.PI / 2);
      wg.add(part(f, pelt, 'digit-' + (s > 0 ? 'l' : 'r') + i, {
        pos: [span * (0.18 - i * 0.16), 0, s * span * 0.5], rot: [0, 0, -0.2 + i * 0.22],
      }));
    }
    wg.traverse((n) => { if (n.isMesh) { n.userData.noCast = true; n.userData.noShadow = true; } });
    g.add(wg);
    wings.push(wg);
  }
  const feet = [];
  for (const s of [1, -1]) {
    const fg = new THREE.Group();
    fg.position.set(-bodyLen * 0.5, -r * 0.3, s * r * 0.4);
    const leg = limb(r * 0.05, r * 0.06, bodyLen * 0.4, 4);
    fg.add(part(leg, pelt, 'shank', { pos: [0, -bodyLen * 0.2, 0] }));
    const claw = cone(r * 0.06, r * 0.2, 4);
    fg.add(part(claw, FAUNA.boneBeak, 'claw', { pos: [0, -bodyLen * 0.44, 0], rot: [0, 0, Math.PI] }));
    g.add(fg);
    feet.push(fg);
  }

  const spec = {
    species: form + (roosting ? '-roosting' : ''), family: 'fauna.bat', form,
    label: (roosting ? 'Roosting ' : '') + { pipistrelle: 'pipistrelle', 'long-ear': 'long-eared bat', abbey: 'abbey bat' }[form],
    locomotion: roosting ? 'perch' : 'flyer',
    hipHeight: roosting ? 0 : 0.05, bodyLen,
    flapHz: wingbeatHz(span).rendered,
    flapPhysicalHz: wingbeatHz(span).physical,
    wingAliased: wingbeatHz(span).aliased,
    flapAmp: 1.25 * wingbeatHz(span).ampScale, wingBase: -0.1,
    cruiseY: form === 'abbey' ? 4.2 : 2.8,
    speeds: { walk: 4.2, run: 6 },
    turnRate: 9, accel: 14, flushRadius: 1.2,
    legs: [], wings, headG: H.head, ears: H.ears, feet,
    roosting, budgetClass: 'minor', glowParts: [...H.eyes],
    regions: ['hollow_abbey', 'cinderward', 'hearthmere'],
    tickOverride: roosting ? tickRoost : null,
  };
  const root = assemble(g, spec);
  if (roosting) {
    // Hanging: inverted, wings furled against the body.
    root.userData.creature.bodyG.rotation.x = Math.PI;
    wings.forEach((w, i) => { w.rotation.z = (i === 0 ? 1 : -1) * 1.35; });
  }
  return root;
}

/** A roosting animal: no gait, only sway and the occasional shuffle. Kept as
 *  an override rather than an engine mode because "does not locomote" is not
 *  a kind of locomotion. */
function tickRoost(group, c, a, dt, ctx) {
  a.t = (a.t || 0) + dt;
  const sway = Math.sin(a.t * 0.8) * 0.05 + Math.sin(a.t * 1.9) * 0.015;
  c.bodyG.rotation.z = sway;
  c.root.position.set(a.pos.x, (ctx.roostY ?? 2.6), a.pos.z);
  c.root.rotation.y = a.heading;
  if (a.t % 7 < dt) a.shuffle = 0.5;
  a.shuffle = Math.max(0, (a.shuffle || 0) - dt);
  c.wings.forEach((w, i) => {
    const s = i === 0 ? 1 : -1;
    w.rotation.z = s * (1.35 - a.shuffle * 0.55);
  });
  if (c.headG) c.headG.rotation.x = Math.sin(a.t * 0.6) * 0.12;
  c.gait = 'roost';
  c.froude = 0; c.residual = 0; c.skate = 0;
}

/* =========================================================================
   FAMILY 12 — flying birds. Corvid, gull, raptor, swift.
   Masked out of the Graven March: `no_bird_silence` is authored atmosphere.
   ======================================================================= */
export const FLYER_AXES = { form: 4, wing: 3, tail: 3, plumage: 3, bill: 3, size: 2 };
export function flyer(variant = 0) {
  const A = axesOf(variant, FLYER_AXES);
  const rand = rnd(0x4fc1 + variant * 7919);
  const forms = ['corvid', 'gull', 'raptor', 'swift'];
  const form = forms[A.form];
  const g = new THREE.Group();

  const S = [0.85, 1.3][A.size] * (form === 'swift' ? 0.6 : form === 'raptor' ? 1.35 : 1);
  const bodyLen = 0.3 * S;
  const r = bodyLen * 0.26;
  const plume = [FAUNA.featherBlack, FAUNA.featherAsh, FAUNA.featherPale][A.plumage];

  const body = ico(r, 1);
  body.scale(2.1, 0.95, 0.9);
  jitter(body, r * 0.1, rand);
  g.add(part(body, plume, 'body'));

  const H = headRig(g, {
    at: [bodyLen * 0.5, r * 0.3, 0], r: r * 0.5, mat: plume,
    neck: r * 0.7, neckR: 0.7, neckLean: 0.3,
    beak: [1.2, 1.9, 2.8][A.bill], eye: 0.17, skull: 1.2,
  }, rand);
  if (form === 'raptor') {
    const hook = cone(r * 0.16, r * 0.4, 5);
    H.head.add(part(hook, FAUNA.boneBeak, 'hook', { pos: [r * 1.1, -r * 0.2, 0], rot: [0, 0, -2.4] }));
  }

  /* Wing: an arm group plus primaries as separate feathers. Slotted feathers
     are the whole silhouette of a flying bird — a solid wing plate reads as a
     paper plane. Primaries are single quads and cost 2 triangles each. */
  const span = bodyLen * [1.5, 2.0, 2.6][A.wing] * (form === 'swift' ? 1.3 : 1);
  const wings = [];
  for (const s of [1, -1]) {
    const wg = new THREE.Group();
    wg.position.set(bodyLen * 0.06, r * 0.42, s * r * 0.5);
    const armGeo = box(r * 0.9, r * 0.2, span * 0.42);
    jitter(armGeo, r * 0.05, rand);
    wg.add(part(armGeo, plume, 'coverts-' + (s > 0 ? 'l' : 'r'), { pos: [0, 0, s * span * 0.22] }));
    const nP = cnt(form === 'swift' ? 5 : 7);
    for (let i = 0; i < nP; i++) {
      const t = i / (nP - 1);
      const fl = span * (0.52 - t * 0.16);
      const feather = box(r * (0.7 - t * 0.3), r * 0.05, fl);
      wg.add(part(feather, plume, 'primary-' + (s > 0 ? 'l' : 'r') + i, {
        pos: [-r * (0.1 + t * 0.55), 0, s * (span * 0.42 + fl * 0.45)],
        rot: [0, 0, s * (0.05 + t * 0.12)],
      }));
    }
    wg.traverse((n) => { if (n.isMesh) { n.userData.noCast = true; n.userData.noShadow = true; } });
    g.add(wg);
    wings.push(wg);
  }

  const tailG = new THREE.Group();
  tailG.name = 'tail';
  tailG.position.set(-bodyLen * 0.52, r * 0.1, 0);
  g.add(tailG);
  const tailLen = bodyLen * [0.5, 0.8, 1.15][A.tail];
  const nT = cnt(5);
  for (let i = 0; i < nT; i++) {
    const a2 = (i - (nT - 1) / 2) * (form === 'swift' ? 0.42 : 0.18);
    const f = box(tailLen, r * 0.05, r * 0.2);
    tailG.add(part(f, plume, 'rectrix-' + i, { pos: [-tailLen * 0.5, 0, Math.sin(a2) * tailLen * 0.4], rot: [0, a2, 0] }));
  }

  // Tucked legs: a flying bird's feet are up against the belly, not dangling.
  for (const s of [1, -1]) {
    const l = limb(r * 0.06, r * 0.08, r * 0.7, 4);
    l.rotateZ(Math.PI / 2.4);
    g.add(part(l, FAUNA.boneBeak, 'tucked-leg-' + (s > 0 ? 'l' : 'r'), { pos: [-bodyLen * 0.16, -r * 0.5, s * r * 0.3] }));
  }

  const spec = {
    species: form, family: 'fauna.flyer', form,
    label: { corvid: 'Rookery corvid', gull: 'Mire gull', raptor: 'March harrier', swift: 'Bell swift' }[form],
    locomotion: 'flyer', hipHeight: 0.1, bodyLen,
    // A corvid's single wing is close to its body length; that is the length the
    // 1/L_wing law wants, not the full span.
    flapHz: wingbeatHz(bodyLen * 1.05).rendered,
    flapPhysicalHz: wingbeatHz(bodyLen * 1.05).physical,
    wingAliased: false,
    flapAmp: form === 'raptor' ? 0.62 : 0.95, wingBase: 0.06,
    cruiseY: form === 'raptor' ? 9 : form === 'swift' ? 5 : 6.5,
    speeds: { walk: form === 'swift' ? 11 : 7.5, run: 14 },
    turnRate: form === 'swift' ? 5 : 2.2, accel: 6, flushRadius: 0,
    legs: [], wings, headG: H.head, ears: [], tailG, tailBase: 0,
    budgetClass: 'minor', glowParts: [...H.eyes],
    regions: ['hearthmere', 'dunmire', 'cinderward', 'hollow_abbey'],
    noRegions: ['graven_march'],
  };
  return assemble(g, spec);
}

/* =========================================================================
   FAMILY 13 — fish. Roach, pike, carp, silverling.
   Carangiform undulation: amplitude concentrated in the rear third, unlike
   the eel's whole-body wave. Same engine mode, different envelope.
   ======================================================================= */
export const FISH_AXES = { form: 4, size: 3, fin: 3, scale: 3, condition: 2 };
export function fish(variant = 0) {
  const A = axesOf(variant, FISH_AXES);
  const rand = rnd(0x1f5a + variant * 7919);
  const forms = ['roach', 'pike', 'carp', 'silverling'];
  const form = forms[A.form];
  const g = new THREE.Group();

  const S = [0.6, 1, 1.5][A.size] * (form === 'pike' ? 1.6 : form === 'silverling' ? 0.45 : 1);
  const len = 0.3 * S;
  const r = len * (form === 'pike' ? 0.1 : form === 'carp' ? 0.2 : 0.15);
  const hide = [FAUNA.scaleSilver, FAUNA.scaleDark, FAUNA.scaleWet][A.scale];
  const finMat = FAUNA.wingDust;

  const nSeg = cnt(9);
  const spine = [];
  for (let i = 0; i < nSeg; i++) {
    const s = i / (nSeg - 1);
    const taper = form === 'pike'
      ? 1 - Math.pow(s, 1.6) * 0.8
      : Math.sin((0.12 + s * 0.85) * Math.PI) * 1.05;
    const rr = Math.max(r * taper, r * 0.1);
    const seg = new THREE.Group();
    seg.name = 'segment-' + i;
    const geo = new THREE.CapsuleGeometry(rr, (len / nSeg) * 1.15, sg(3), sg(7));
    geo.rotateZ(Math.PI / 2);
    geo.scale(1, 1.35, 0.62);
    seg.add(part(geo, hide, 'body-' + i));
    if (A.condition === 1 && i % 3 === 0) {
      const sore = ico(rr * 0.3, 0);
      seg.add(part(sore, FAUNA.furPale, 'sore-' + i, { pos: [0, rr * 0.6, rr * 0.4] }));
    }
    g.add(seg);
    spine.push(seg);
  }

  // Fins. Dorsal, pectorals, caudal — the fin axis changes how many and how big.
  const finK = [0.7, 1, 1.45][A.fin];
  const dorsal = new THREE.Shape();
  dorsal.moveTo(0, 0);
  dorsal.lineTo(len * 0.22, r * 1.5 * finK);
  dorsal.lineTo(len * 0.3, 0);
  const dg = new THREE.ShapeGeometry(dorsal, sg(4));
  dg.rotateY(Math.PI / 2);
  spine[Math.floor(nSeg * 0.4)].add(part(dg, finMat, 'dorsal', { pos: [0, r * 0.9, 0] }));
  for (const s of [1, -1]) {
    const pec = new THREE.Shape();
    pec.moveTo(0, 0);
    pec.lineTo(-len * 0.1, -r * 0.9 * finK);
    pec.lineTo(len * 0.06, -r * 0.2);
    const pg = new THREE.ShapeGeometry(pec, sg(3));
    const pm = part(pg, finMat, 'pectoral-' + (s > 0 ? 'l' : 'r'), { pos: [0, 0, s * r * 0.5], rot: [s * 0.6, 0, 0] });
    spine[Math.floor(nSeg * 0.22)].add(pm);
  }
  const caud = new THREE.Shape();
  caud.moveTo(0, 0);
  caud.lineTo(-len * 0.12, r * 1.8 * finK);
  caud.lineTo(-len * 0.16, 0);
  caud.lineTo(-len * 0.12, -r * 1.8 * finK);
  const cg = new THREE.ShapeGeometry(caud, sg(4));
  cg.rotateY(Math.PI / 2);
  spine[nSeg - 1].add(part(cg, finMat, 'caudal', { pos: [-len / nSeg * 0.5, 0, 0] }));

  const H = headRig(spine[0], {
    at: [len / nSeg * 0.6, 0, 0], r: r * 0.85, mat: hide,
    muzzle: form === 'pike' ? 1.9 : 0.7, eye: 0.22, skull: form === 'pike' ? 1.9 : 1.2,
  }, rand);
  g.traverse((n) => { if (n.isMesh && /dorsal|pectoral|caudal/.test(n.name)) { n.userData.noCast = true; n.userData.noShadow = true; } });

  /* Amplitude, Strouhal number and both speeds are taken from the literature in
     BODY-LENGTH units, so no per-species number is authored here.

       A  = 0.18–0.22 L peak-to-peak. Rohr & Fish (2004) put normalised
            peak-to-peak amplitude predominantly in 0.15–0.25 across swimmers.
       St = 0.28–0.42. Efficient cruising sits in 0.25–0.35 (Triantafyllou et
            al. 1993) and the optimum RISES for the smallest swimmers (Eloy
            2012), which is why the silverling carries the highest value and the
            carp the lowest. Not a tuning pass — a size trend.
       U  = 0.9 L/s cruise, 5–8 L/s burst. Videler & Wardle (1991) give mean
            maximum burst at 10 L/s; the ambush pike gets closest to it.

     Stride length then falls out as A/St ≈ 0.6–0.7 L, which is where measured
     stride lengths actually sit — a check on the arithmetic rather than an
     input to it. */
  const tailAmp = len * (form === 'carp' ? 0.22 : form === 'pike' ? 0.18 : 0.2);
  const St = { silverling: 0.42, roach: 0.34, pike: 0.3, carp: 0.28 }[form];
  const burstBL = form === 'pike' ? 8 : form === 'silverling' ? 6 : 5;

  const spec = {
    species: form, family: 'fauna.fish', form,
    label: { roach: 'Blackwater roach', pike: 'Sluice pike', carp: 'Temple carp', silverling: 'Silverling' }[form],
    locomotion: 'undulate', hipHeight: r * 1.6, bodyLen: len, bodyR: r,
    anguilliform: false, swim: true, waterClass: 'aquatic',
    tailAmp, strouhal: St,
    // waveAmp/waveLen are the non-swimmer fallback and are unused for fish:
    // stepUndulate takes amplitude from tailAmp and wavelength from tailAmp/St.
    waveAmp: r * (form === 'pike' ? 2.2 : 3.4), waveLen: len * 0.85,
    speeds: { walk: 0.9 * len, run: burstBL * len },
    turnRate: 2.4, accel: 8, flushRadius: 2.4,
    spine, legs: [], headG: H.head, ears: [], forageDip: 0.15,
    budgetClass: 'minor', glowParts: [...H.eyes],
    regions: ['dunmire', 'hearthmere'],
  };
  return assemble(g, spec);
}

/* =========================================================================
   FAMILY 14 — firefly swarms. Firefly, spark-gnat, ember-mote.
   A swarm is ONE object with N motes, not N creatures: 2,400 active particles
   is the whole region's budget (WORLD_ASSET_BUDGETS.activeParticles), so a
   swarm declares its own draw and the viewer can hold the total against it.
   Each mote gets a flash rhythm — real fireflies flash on species-specific
   periods, and giving each form its own period and duty is what stops a swarm
   reading as a fog of uniform dots.
   ======================================================================= */
export const GLOWFLY_AXES = { form: 3, count: 3, radius: 3, pulse: 3, hue: 3, height: 2 };
export function glowfly(variant = 0) {
  const A = axesOf(variant, GLOWFLY_AXES);
  const rand = rnd(0x9e21 + variant * 7919);
  const forms = ['firefly', 'spark-gnat', 'ember-mote'];
  const form = forms[A.form];
  const g = new THREE.Group();

  const n = cnt([14, 30, 56][A.count]);
  const R = [0.9, 1.8, 3.2][A.radius];
  const period = [0.7, 1.4, 2.6][A.pulse];
  const hue = [
    { c: '#e4c77e', name: 'gold' },
    { c: '#bd6135', name: 'ember' },
    { c: '#658e9e', name: 'veil' },
  ][A.hue];
  const H = [0.35, 1.1][A.height];

  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const seeds = new Float32Array(n * 3);
  const base = new THREE.Color(hue.c);
  for (let i = 0; i < n; i++) {
    const a = rand() * T, rr = Math.sqrt(rand()) * R;
    pos[i * 3] = Math.cos(a) * rr;
    pos[i * 3 + 1] = H + rand() * H * 1.4;
    pos[i * 3 + 2] = Math.sin(a) * rr;
    col[i * 3] = base.r; col[i * 3 + 1] = base.g; col[i * 3 + 2] = base.b;
    seeds[i * 3] = rand() * period;      // flash offset
    seeds[i * 3 + 1] = 0.4 + rand() * 1.4; // drift rate
    seeds[i * 3 + 2] = rand() * T;         // drift phase
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: form === 'ember-mote' ? 0.062 : 0.042, vertexColors: true, transparent: true,
    map: glowTexture(), opacity: 0.95, blending: THREE.AdditiveBlending,
    depthWrite: false, sizeAttenuation: true,
  });
  mat.name = 'glowfly-' + hue.name;
  const pts = new THREE.Points(geo, mat);
  pts.name = 'swarm';
  g.add(pts);

  const spec = {
    species: form, family: 'fauna.glowfly', form,
    label: { firefly: 'Firefly drift', 'spark-gnat': 'Spark-gnat cloud', 'ember-mote': 'Ember motes' }[form],
    locomotion: 'swarm', hipHeight: H, bodyLen: R * 2,
    speeds: { walk: 0.12, run: 0.3 }, turnRate: 0.8, accel: 1, flushRadius: 0,
    legs: [], moteCount: n, radius: R, period, hue: hue.c, glowSelf: true,
    pts, seeds, basePos: pos.slice(),
    budgetClass: 'minor', glowParts: [],
    particles: n,
    regions: ['dunmire', 'hearthmere', 'graven_march'],
    tickOverride: tickSwarm,
  };
  return assemble(g, spec);
}

function tickSwarm(group, c, a, dt, ctx) {
  a.t = (a.t || 0) + dt;
  // Slow bodily drift of the whole swarm, plus per-mote wander and flash.
  a.pos.x += Math.sin(a.t * 0.21 + a.heading) * dt * 0.22;
  a.pos.z += Math.cos(a.t * 0.17 + a.heading) * dt * 0.22;
  const dHome = Math.hypot(a.pos.x - a.home.x, a.pos.z - a.home.z);
  if (dHome > a.radius) {
    a.pos.x += (a.home.x - a.pos.x) * dt * 0.6;
    a.pos.z += (a.home.z - a.pos.z) * dt * 0.6;
  }
  const ground = ctx.groundAt || (() => 0);
  c.root.position.set(a.pos.x, ground(a.pos.x, a.pos.z), a.pos.z);

  const p = c.pts.geometry.attributes.position;
  const col = c.pts.geometry.attributes.color;
  const s = c.seeds, b = c.basePos;
  const base = new THREE.Color(c.hue);
  for (let i = 0; i < p.count; i++) {
    const off = s[i * 3], rate = s[i * 3 + 1], ph = s[i * 3 + 2];
    p.setX(i, b[i * 3] + Math.sin(a.t * rate + ph) * 0.28);
    p.setY(i, b[i * 3 + 1] + Math.sin(a.t * rate * 0.7 + ph * 1.7) * 0.16);
    p.setZ(i, b[i * 3 + 2] + Math.cos(a.t * rate * 0.85 + ph) * 0.28);
    // Flash: a short bright pulse on the species period, dark between.
    const u = ((a.t + off) % c.period) / c.period;
    const k = u < 0.22 ? Math.sin((u / 0.22) * Math.PI) : 0.12;
    col.setXYZ(i, base.r * k, base.g * k, base.b * k);
  }
  p.needsUpdate = true;
  col.needsUpdate = true;
  c.gait = 'drift';
  c.froude = 0; c.residual = 0; c.skate = 0;
}

/* =========================================================================
   FAMILY 15 — marsh lights. The faerie of this world.
   `marsh_light_drifter` is a declared Dunmire vfx row. `reed_sister_marker` is
   a declared prop, and the Reed Coven bestiary family is described as
   mire-workers who became part of the wetland's rites — so a reed-sister light
   is the world's own idea, not a borrowed fairy.
   ======================================================================= */
export const WISP_AXES = { form: 3, core: 3, veil: 3, trail: 3, halo: 2, drift: 2 };
export function wisp(variant = 0) {
  const A = axesOf(variant, WISP_AXES);
  const rand = rnd(0xcf03 + variant * 7919);
  const forms = ['marsh-light', 'reed-sister', 'bell-mote'];
  const form = forms[A.form];
  const g = new THREE.Group();

  const hue = form === 'marsh-light' ? '#658e9e' : form === 'reed-sister' ? '#e1dbca' : '#e4c77e';
  const coreR = [0.035, 0.055, 0.085][A.core];
  const col = new THREE.Color(hue);

  const coreMat = new THREE.MeshStandardMaterial({
    color: col.clone().lerp(new THREE.Color('#ffffff'), 0.35),
    roughness: 0.4, metalness: 0,
    emissive: col.clone(), emissiveIntensity: 2.4,
  });
  coreMat.name = 'wisp-core-' + form;
  const core = part(ico(coreR, 2), coreMat, 'core', { pos: [0, 0, 0] });
  g.add(core);

  /* The veil: additive halo sprites at two or three scales. This used to be
     nested icosahedral shells, which rendered as a grey faceted crystal with a
     white dot in it — the opposite of the intended read. Light has a soft edge.
     `reed-sister` gets a suggested figure inside — a stooped silhouette at the
     scale of a hand, because the fiction is a person, not a spark. */
  const veilN = [1, 2, 3][A.veil];
  for (let i = 0; i < veilN; i++) {
    g.add(glowSprite(hue, coreR * (7.5 + i * 5.5), 0.42 / (i * 0.7 + 1), 'wisp-veil-' + i));
  }
  if (form === 'reed-sister') {
    const figMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#2a2f30'), roughness: 0.9, metalness: 0,
      emissive: col.clone(), emissiveIntensity: 0.5, transparent: true, opacity: 0.75,
    });
    figMat.name = 'wisp-figure';
    const fig = new THREE.Group();
    fig.name = 'figure';
    const body = ico(coreR * 0.5, 1);
    body.scale(0.6, 1.5, 0.5);
    fig.add(part(body, figMat, 'figure-body', { pos: [0, coreR * 0.1, 0] }));
    fig.add(part(ico(coreR * 0.22, 1), figMat, 'figure-head', { pos: [coreR * 0.1, coreR * 0.85, 0] }));
    const shawl = cone(coreR * 0.6, coreR * 0.9, 6);
    fig.add(part(shawl, figMat, 'figure-shawl', { pos: [0, coreR * 0.15, 0] }));
    g.add(fig);
  }
  if (A.halo === 1) {
    const hm = new THREE.MeshBasicMaterial({
      color: col, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.DoubleSide,
    });
    hm.name = 'wisp-halo';
    const ring = torus(coreR * 3.4, coreR * 0.16, 3, sg(20));
    const r2 = part(ring, hm, 'halo', { rot: [Math.PI / 2.4, 0, 0.2] });
    r2.userData.noCast = true;
    r2.userData.noShadow = true;
    g.add(r2);
  }

  // Trail: motes that fall behind the light and fade. Length is the axis.
  const trailN = cnt([6, 12, 20][A.trail]);
  const tp = new Float32Array(trailN * 3);
  const tc = new Float32Array(trailN * 3);
  for (let i = 0; i < trailN; i++) {
    tc[i * 3] = col.r; tc[i * 3 + 1] = col.g; tc[i * 3 + 2] = col.b;
  }
  const tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.BufferAttribute(tp, 3));
  tg.setAttribute('color', new THREE.BufferAttribute(tc, 3));
  const tmat = new THREE.PointsMaterial({
    size: coreR * 1.6, vertexColors: true, transparent: true, opacity: 0.7,
    map: glowTexture(), blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  tmat.name = 'wisp-trail';
  const trail = new THREE.Points(tg, tmat);
  trail.name = 'trail';
  g.add(trail);

  const spec = {
    species: form, family: 'fauna.wisp', form,
    label: { 'marsh-light': 'Marsh light', 'reed-sister': 'Reed-sister light', 'bell-mote': 'Bell mote' }[form],
    locomotion: 'wisp', hipHeight: [0.5, 1.15][A.drift], bodyLen: coreR * 4,
    speeds: { walk: [0.28, 0.6][A.drift], run: 1.1 },
    turnRate: 1.1, accel: 1.4, flushRadius: 0,
    legs: [], core, coreMat, trail, trailN, hue, coreR, glowSelf: true,
    wantsLight: true, lightIntensity: form === 'reed-sister' ? 1.15 : 0.85,
    particles: trailN,
    budgetClass: 'minor', glowParts: [],
    regions: form === 'bell-mote' ? ['hearthmere', 'hollow_abbey'] : ['dunmire'],
    tickOverride: tickWisp,
  };
  return assemble(g, spec);
}

function tickWisp(group, c, a, dt, ctx) {
  a.t = (a.t || 0) + dt;
  // Drifts, pauses, then drifts again — the pause is what makes it feel like
  // something deciding rather than something falling.
  a.stateT -= dt;
  if (a.stateT <= 0) {
    a.moving = !a.moving;
    a.stateT = a.moving ? 2 + a.rand() * 4 : 1 + a.rand() * 3;
    a.desired = a.heading + (a.rand() - 0.5) * 2.4;
  }
  const tgt = a.moving ? c.speeds.walk : 0.02;
  a.speed += (tgt - a.speed) * Math.min(1, dt * 1.1);
  const dh = Math.atan2(Math.sin(a.desired - a.heading), Math.cos(a.desired - a.heading));
  a.heading += clamp(dh, -c.turnRate * dt, c.turnRate * dt);
  a.pos.x += Math.cos(a.heading) * a.speed * dt;
  a.pos.z += -Math.sin(a.heading) * a.speed * dt;
  const dHome = Math.hypot(a.pos.x - a.home.x, a.pos.z - a.home.z);
  if (dHome > a.radius) {
    a.desired = headingTo(a.home.x - a.pos.x, a.home.z - a.pos.z);
  }
  const ground = ctx.groundAt || (() => 0);
  const y = ground(a.pos.x, a.pos.z) + c.hipHeight + Math.sin(a.t * 0.7) * 0.12 + Math.sin(a.t * 1.9) * 0.04;
  c.root.position.set(a.pos.x, y, a.pos.z);
  c.root.rotation.y = a.heading;

  // Breath: the emissive swells and fades. Never fully off — a marsh light
  // that blinks reads as a bug, not as a light.
  const breath = 0.72 + Math.sin(a.t * 1.15) * 0.22 + Math.sin(a.t * 2.7) * 0.06;
  c.coreMat.emissiveIntensity = 2.4 * breath;
  c.breath = breath;

  // Trail: shift the buffer down one and write the current position at the head.
  const p = c.trail.geometry.attributes.position;
  const col = c.trail.geometry.attributes.color;
  a.trailT = (a.trailT || 0) + dt;
  if (a.trailT > 0.05) {
    a.trailT = 0;
    for (let i = p.count - 1; i > 0; i--) {
      p.setXYZ(i, p.getX(i - 1), p.getY(i - 1), p.getZ(i - 1));
    }
    // Local space: the head sits at the origin and older motes lag behind
    // along the body's own backward axis, which is local -X.
    p.setXYZ(0, 0, 0, 0);
    for (let i = 1; i < p.count; i++) {
      p.setXYZ(i, p.getX(i) - a.speed * 0.05, p.getY(i) - 0.004, p.getZ(i));
    }
    const base = new THREE.Color(c.hue);
    for (let i = 0; i < col.count; i++) {
      const k = (1 - i / col.count) * 0.8 * breath;
      col.setXYZ(i, base.r * k, base.g * k, base.b * k);
    }
    p.needsUpdate = true;
    col.needsUpdate = true;
  }
  c.gait = a.moving ? 'drift' : 'hover';
  c.froude = 0; c.residual = 0; c.skate = 0;
}

/* --------------------------------------------------------------- registry */
export const FAUNA2_GENERATORS = [
  { id: 'fauna.beetle', name: 'Beetle and roach', axes: BEETLE_AXES, build: beetle, domain: 'fauna-small', budgetClass: 'minor' },
  { id: 'fauna.spider', name: 'Spider and harvestman', axes: SPIDER_AXES, build: spider, domain: 'fauna-small', budgetClass: 'minor' },
  { id: 'fauna.crab', name: 'Crustacean', axes: CRAB_AXES, build: crab, domain: 'fauna-water', budgetClass: 'minor' },
  { id: 'fauna.moth', name: 'Moth and small flier', axes: MOTH_AXES, build: moth, domain: 'fauna-air', budgetClass: 'minor' },
  { id: 'fauna.bat', name: 'Bat', axes: BAT_AXES, build: bat, domain: 'fauna-air', budgetClass: 'minor' },
  { id: 'fauna.flyer', name: 'Flying bird', axes: FLYER_AXES, build: flyer, domain: 'fauna-air', budgetClass: 'minor' },
  { id: 'fauna.fish', name: 'Fish', axes: FISH_AXES, build: fish, domain: 'fauna-water', budgetClass: 'minor' },
  { id: 'fauna.glowfly', name: 'Firefly swarm', axes: GLOWFLY_AXES, build: glowfly, domain: 'fauna-lit', budgetClass: 'minor' },
  { id: 'fauna.wisp', name: 'Marsh light', axes: WISP_AXES, build: wisp, domain: 'fauna-lit', budgetClass: 'minor' },
];
