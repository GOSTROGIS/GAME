/* =========================================================================
   cinder-mourner-model.js — enemy.cinder-mourner, Ashbound family
   -------------------------------------------------------------------------
   First pass on this subject — there is no earlier build to correct, so this
   header records METHOD rather than a review of faults.

   MEASUREMENT. assets/enemies/cinder-mourner-v1.png is 1023x1537. A script
   scanned every row for the first pixel brighter than the plate's own
   near-black field (threshold = measured corner luminance + 0.028) and
   recorded the first/last row with any foreground pixel (crown row 70, sole
   row 1486 — 1416 px for the declared 1.76 m, so 1 px = 1.243 mm) and the
   full-width extent at twenty evenly spaced rows between them. PLATE.silhouette
   below is that scan, thinned to ten rows and given a grade: 'hard' where the
   band reads as a clean robe cross-section, 'soft' at the hood transition and
   at the ragged hem, where the tongue a row happens to cross decides the
   number the same way ash-husk's own hem rows do.

   Reused wholesale from the Ash Husk build: the skeleton/binder/spring-bone
   machinery in kit/hm-husk-rig.js, the garment-surface primitives in
   kit/hm-husk-cloth.js, and the plate-sampled material pipeline generalised
   into kit/hm-plate-materials.js. ash-husk-model.js itself is untouched.

   DEPTH, stated honestly against that reference build: this pass has one
   outer garment rather than a four-layer stack, paddle hands rather than
   articulated fingers, and a void head rather than a sculpted face — because
   the plate never shows a second garment, individual fingers or a lit face.
   Building any of those anyway would be inventing detail the art does not
   carry, which the manifest law (kit/hm-art-law.js) treats as the same
   failure as contradicting it.
   ========================================================================= */
import * as THREE from 'three';
import { loadPlate, plateMaps } from './kit/hm-plate-materials.js';
import {
  buildBoneTree, seg, bindGeometry, bindRigid, SpringSim, rescale, reseat, measurePosed,
} from './kit/hm-husk-rig.js';
import { clothLoft, tornHem, tris } from './kit/hm-husk-cloth.js';
import { silhouetteReport, clippingReport } from './kit/hm-model-measure.js';

export { loadPlate };

export const SUBJECT = {
  id: 'enemy.cinder-mourner', name: 'Cinder Mourner', family: 'Ashbound', rank: null,
  plate: '../assets/enemies/cinder-mourner-v1.png',
  promptCall: 'call_nIgtNVLVAaxYFQ2Pt3fXba2w',
  targetHeightMeters: 1.76,
};

export const REVIEW = [
  { fault: 'No prior model to correct', was: 'This subject has never been built.',
    now: 'Built directly from the plate, at a lighter depth than enemy.ash-husk and saying so rather than padding toward it (see the file header).' },
];

export const PLATE = {
  file: SUBJECT.plate,
  scale: { crownPx: 70, solePx: 1486, centrePx: 512, mmPerPx: 1.243, height: SUBJECT.targetHeightMeters },
  silhouette: [
    [1.672, 0.178, 'soft'], [1.497, 0.288, 'hard'], [1.320, 0.448, 'hard'], [1.144, 0.506, 'hard'],
    [0.968, 0.574, 'hard'], [0.792, 0.568, 'hard'], [0.617, 0.549, 'hard'], [0.440, 0.588, 'hard'],
    [0.263, 0.523, 'hard'], [0.088, 0.663, 'soft'],
  ],
};

const LIFT = 1.35;
const CROPS = {
  robe: { x: 442, y: 852, w: 140, h: 140, repeat: [9, 11], mean: 0.127 },
  hood: { x: 442, y: 84, w: 140, h: 140, repeat: [6, 6], mean: 0.186 },
  tablet: { x: 380, y: 586, w: 120, h: 120, repeat: [1, 1], single: true, mean: 0.149 },
};
const FLAT = { robe: 0x201d1a, hood: 0x2c2b2b, tablet: 0x847461, skin: 0x100e0c, boot: 0x14110f };

function buildMaterials(plateImg) {
  const BASE = 0xf6f4f0;
  const maps = { robe: plateMaps(plateImg, CROPS.robe, LIFT), hood: plateMaps(plateImg, CROPS.hood, LIFT), tablet: plateMaps(plateImg, CROPS.tablet, LIFT) };
  const cloth = (name, key, rough) => new THREE.MeshStandardMaterial({
    name, color: maps[key].map ? BASE : FLAT[key], roughness: rough, metalness: 0.02,
    side: THREE.DoubleSide, vertexColors: true, ...maps[key],
  });
  return {
    robe: cloth('mourner-robe', 'robe', 0.95),
    hood: cloth('mourner-hood', 'hood', 0.94),
    clay: cloth('blank-tablet-clay', 'tablet', 0.82),
    skin: new THREE.MeshStandardMaterial({ name: 'shadowed-skin', color: FLAT.skin, roughness: 0.9, metalness: 0 }),
    boot: new THREE.MeshStandardMaterial({ name: 'soft-boot', color: FLAT.boot, roughness: 0.9, metalness: 0 }),
    cord: new THREE.MeshStandardMaterial({ name: 'cord', color: 0x241f1a, roughness: 0.85, metalness: 0 }),
  };
}

function tubeBetween(a, b, radius, radial = 6) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = Math.max(1e-4, dir.length());
  const geo = new THREE.CylinderGeometry(radius, radius, len, radial, 1);
  geo.translate(0, len / 2, 0);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()));
  geo.translate(a.x, a.y, a.z);
  return geo;
}

export function buildCinderMourner({ plate = null } = {}) {
  const mats = buildMaterials(plate);
  const root = new THREE.Group();
  root.name = 'cinder-mourner';

  const PARENT = {
    pelvis: null, spine: 'pelvis', chest: 'spine', neck: 'chest', head: 'neck',
    shoulderL: 'chest', shoulderR: 'chest', elbowL: 'shoulderL', elbowR: 'shoulderR', wristL: 'elbowL', wristR: 'elbowR',
    hipL: 'pelvis', hipR: 'pelvis', kneeL: 'hipL', kneeR: 'hipR', ankleL: 'kneeL', ankleR: 'kneeR',
  };
  const order = ['pelvis', 'spine', 'chest', 'neck', 'head', 'shoulderL', 'shoulderR', 'elbowL', 'elbowR',
    'wristL', 'wristR', 'hipL', 'hipR', 'kneeL', 'kneeR', 'ankleL', 'ankleR'];
  const rest = {
    pelvis: [0, 0.90, 0], spine: [0, 1.03, 0], chest: [0, 1.22, 0], neck: [0, 1.38, 0.005], head: [0, 1.50, -0.006],
    shoulderL: [0.155, 1.40, 0], shoulderR: [-0.155, 1.40, 0],
    elbowL: [0.195, 1.14, 0.01], elbowR: [-0.195, 1.14, 0.01],
    wristL: [0.205, 0.865, 0.02], wristR: [-0.205, 0.865, 0.02],
    hipL: [0.095, 0.90, 0], hipR: [-0.095, 0.90, 0],
    kneeL: [0.10, 0.49, 0.01], kneeR: [-0.10, 0.49, 0.01],
    ankleL: [0.10, 0.07, 0.02], ankleR: [-0.10, 0.07, 0.02],
  };

  const clothChains = [];
  const HEM_N = 6;
  for (let i = 0; i < HEM_N; i++) {
    const th = (i / HEM_N) * Math.PI * 2;
    const s = Math.sin(th), c = Math.cos(th);
    const A = `hem${i}`;
    rest[A] = [0.27 * s, 0.30, 0.27 * 0.72 * c];
    PARENT[A] = 'pelvis'; order.push(A);
    clothChains.push({ bones: [A], tip: [0.30 * s, 0.09, 0.30 * 0.72 * c], group: 'hem' });
  }

  const tree = buildBoneTree(rest, PARENT, order);
  const J = tree.byName, abs = tree.abs, boneIndex = tree.index;
  root.add(J.pelvis);
  const P = (n) => [abs[n].x, abs[n].y, abs[n].z];

  const field = [
    seg('pelvis', P('pelvis'), [0, 1.00, 0], 0.19),
    seg('spine', [0, 1.00, 0], [0, 1.16, 0], 0.20),
    seg('chest', [0, 1.16, 0], P('neck'), 0.24),
    seg('neck', P('neck'), [0, 1.45, 0], 0.11),
    seg('shoulderL', P('shoulderL'), P('elbowL'), 0.14, 1.0),
    seg('shoulderR', P('shoulderR'), P('elbowR'), 0.14, 1.0),
    seg('elbowL', P('elbowL'), P('wristL'), 0.11, 1.2),
    seg('elbowR', P('elbowR'), P('wristR'), 0.11, 1.2),
    seg('wristL', P('wristL'), [abs.wristL.x, 0.70, abs.wristL.z], 0.09, 1.2),
    seg('wristR', P('wristR'), [abs.wristR.x, 0.70, abs.wristR.z], 0.09, 1.2),
    seg('hipL', P('hipL'), P('kneeL'), 0.13),
    seg('hipR', P('hipR'), P('kneeR'), 0.13),
    seg('kneeL', P('kneeL'), P('ankleL'), 0.11),
    seg('kneeR', P('kneeR'), P('ankleR'), 0.11),
    seg('ankleL', P('ankleL'), [abs.ankleL.x, 0, abs.ankleL.z], 0.10),
    seg('ankleR', P('ankleR'), [abs.ankleR.x, 0, abs.ankleR.z], 0.10),
  ];
  for (const ch of clothChains) {
    const a = P(ch.bones[0]);
    field.push(seg(ch.bones[0], a, ch.tip, 0.15, 1.6, 1.4));
  }

  const allGeos = [], bodyMeshes = [];
  const sectionMeshes = {}, sectionReport = [];
  function addSection(id, name, reads, method, parts) {
    const meshes = [];
    let t = 0;
    for (const part of parts) {
      if (part.rigid) bindRigid(part.geo, boneIndex, part.joint);
      else bindGeometry(part.geo, field, boneIndex, part.joint, part.allow || null);
      const mesh = new THREE.SkinnedMesh(part.geo, part.material);
      mesh.name = part.meshName || id;
      mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
      root.add(mesh);
      allGeos.push(part.geo); bodyMeshes.push(mesh); meshes.push(mesh);
      t += tris(part.geo);
    }
    sectionMeshes[id] = meshes;
    sectionReport.push({ id, name, triangles: t, meshes: meshes.length, reads, method });
  }

  const robeGeo = clothLoft({
    stations: [
      { y: 1.430, rx: 0.150, rz: 0.108 }, { y: 1.320, rx: 0.224, rz: 0.161 },
      { y: 1.144, rx: 0.253, rz: 0.182 }, { y: 0.968, rx: 0.287, rz: 0.207 },
      { y: 0.792, rx: 0.284, rz: 0.204 }, { y: 0.617, rx: 0.2745, rz: 0.198 },
      { y: 0.440, rx: 0.294, rz: 0.212 }, { y: 0.263, rx: 0.2615, rz: 0.188 },
    ],
    columns: 40, ringsPer: 3, capTop: true,
    hem: tornHem({ count: 6, depth: 0.17, vary: 0.42, seed: 41 }), hemRings: 6, hemPull: 0.06,
    fold: { count: 5, amp: 0.045, phase: 0.4 },
    crease: { amp: 0.006, freq: 18, drape: 0.015 }, crack: { amp: 0.0032, cell: 30 },
    wear: { top: 0.96, hem: 0.62 }, seed: 41,
  });
  addSection('robe', 'Mourning robe', 'Reads \u2014 one ragged hooded robe, closed front, torn pendant hem \u2014 the plate shows no second garment.',
    'clothLoft, eight stations sampled off the plate\u2019s own scanned silhouette, tornHem for the hem tongues.',
    [{ geo: robeGeo, material: mats.robe, joint: 'chest', allow: ['pelvis', 'spine', 'chest', 'neck', 'hem*'] }]);

  const sleeveParts = [];
  for (const side of ['L', 'R']) {
    const sh = abs['shoulder' + side], el = abs['elbow' + side], wr = abs['wrist' + side];
    const geo = clothLoft({
      stations: [
        { y: sh.y, rx: 0.082, rz: 0.070, cx: sh.x, cz: sh.z },
        { y: el.y, rx: 0.066, rz: 0.056, cx: el.x, cz: el.z },
        { y: wr.y, rx: 0.050, rz: 0.043, cx: wr.x, cz: wr.z },
      ],
      columns: 16, ringsPer: 4, capTop: true,
      crease: { amp: 0.005, freq: 16 }, wear: { top: 0.92, hem: 0.72 }, seed: side === 'L' ? 51 : 52,
    });
    sleeveParts.push({ geo, material: mats.robe, joint: 'elbow' + side, meshName: 'sleeve-' + side, allow: ['shoulder' + side, 'elbow' + side, 'wrist' + side] });
  }
  addSection('sleeves', 'Sleeves', 'Reads \u2014 the robe\u2019s own cloth continues down each arm; no separate cuff or trim on the plate.',
    'clothLoft per arm, three stations following the shoulder\u2013elbow\u2013wrist chain.', sleeveParts);

  const hoodGeo = clothLoft({
    stations: [
      { y: 1.62, rx: 0.006, rz: 0.006 }, { y: 1.555, rx: 0.075, rz: 0.066, cz: 0.010 },
      { y: 1.475, rx: 0.130, rz: 0.113, cz: 0.025 }, { y: 1.400, rx: 0.163, rz: 0.141, cz: 0.035 },
    ],
    columns: 28, ringsPer: 4, capTop: true,
    crease: { amp: 0.005, freq: 20 }, crack: { amp: 0.0028, cell: 34 },
    wear: { top: 1.0, hem: 0.86 }, seed: 61,
  });
  const headGeo = new THREE.SphereGeometry(0.082, 20, 16);
  headGeo.scale(1, 1.12, 0.94);
  headGeo.translate(abs.head.x, abs.head.y, abs.head.z);
  addSection('hood', 'Hood, and the head it hides', 'Reads \u2014 the cowl shadows the face completely; nothing under it catches the key light on the plate.',
    'clothLoft cone for the cowl (rigid to the neck); a plain dark void sphere stands in for a face the art never lights.',
    [{ geo: hoodGeo, material: mats.hood, joint: 'neck', rigid: true },
      { geo: headGeo, material: mats.skin, joint: 'head', rigid: true, meshName: 'head-void' }]);

  const tabletGeo = new THREE.BoxGeometry(0.095, 0.118, 0.014);
  tabletGeo.translate(-0.025, 1.02, 0.215);
  const cordGeo = tubeBetween(new THREE.Vector3(0, 1.37, 0.03), new THREE.Vector3(-0.025, 1.075, 0.20), 0.0028, 6);
  addSection('tablet', 'Blank tablet, worn as a mourning token', 'Reads \u2014 one small rectangular tablet on a cord at the chest; unlike enemy.ash-husk there is no harness and no ember behind it.',
    'Rigid box and a swept cord, both bound to chest/neck \u2014 correct for fired clay that does not flex.',
    [{ geo: tabletGeo, material: mats.clay, joint: 'chest', rigid: true, meshName: 'tablet-clay' },
      { geo: cordGeo, material: mats.cord, joint: 'chest', rigid: true, meshName: 'tablet-cord' }]);

  const handParts = [];
  for (const side of ['L', 'R']) {
    const w = abs['wrist' + side];
    const g = new THREE.BoxGeometry(0.045, 0.10, 0.025, 2, 3, 1);
    g.translate(w.x, w.y - 0.06, w.z + 0.01);
    handParts.push({ geo: g, material: mats.skin, joint: 'wrist' + side, rigid: true, meshName: 'hand-' + side });
  }
  addSection('hands', 'Hands', 'Reads \u2014 bare hands hanging clear of the sleeves.',
    'Simplified paddle geometry, not articulated fingers \u2014 below what this pass\u2019s viewing distance needs, stated rather than hidden.', handParts);

  const bootParts = [];
  for (const side of ['L', 'R']) {
    const a = abs['ankle' + side];
    const g = new THREE.BoxGeometry(0.075, 0.05, 0.145, 2, 1, 2);
    g.translate(a.x, a.y - 0.02, a.z + 0.03);
    bootParts.push({ geo: g, material: mats.boot, joint: 'ankle' + side, rigid: true, meshName: 'boot-' + side });
  }
  addSection('boots', 'Boots', 'Reads \u2014 soft flat boots, mostly hidden under the hem.', 'Rigid blocks; the hem covers all but the toe on the plate.', bootParts);

  const HEAD_BOW = 0.22;
  const applyStance = () => { J.head.rotation.x = HEAD_BOW; J.neck.rotation.x = 0.06; J.chest.rotation.x = 0.02; };
  const clearStance = () => { for (const n of order) J[n].rotation.set(0, 0, 0); };

  let skeleton = null;
  const rebind = () => {
    clearStance(); root.updateMatrixWorld(true);
    skeleton = new THREE.Skeleton(tree.bones);
    for (const m of bodyMeshes) m.bind(skeleton, new THREE.Matrix4());
    applyStance(); root.updateMatrixWorld(true);
  };
  rebind();

  let scaleApplied = 1, totalDy = 0;
  for (let pass = 0; pass < 2; pass++) {
    const b = measurePosed(bodyMeshes, undefined, 4);
    const h = Math.max(0.2, b.max.y - b.min.y);
    const k = SUBJECT.targetHeightMeters / h;
    clearStance(); root.updateMatrixWorld(true);
    rescale(allGeos, tree.bones, k);
    scaleApplied *= k; totalDy *= k;
    rebind();
    const after = measurePosed(bodyMeshes, undefined, 4);
    clearStance(); root.updateMatrixWorld(true);
    reseat(allGeos, J.pelvis, -after.min.y);
    totalDy += -after.min.y;
    rebind();
  }
  scaleApplied = +scaleApplied.toFixed(5);

  const FEEL = { hem: { stiff: 0.06, damp: 0.09, limit: 0.42 } };
  clearStance(); root.updateMatrixWorld(true);
  const springChains = clothChains.map((ch) => ch.bones.map((name) => {
    const bone = J[name];
    const tip = new THREE.Vector3(ch.tip[0], ch.tip[1], ch.tip[2]).multiplyScalar(scaleApplied);
    tip.y += totalDy;
    bone.updateWorldMatrix(true, false);
    const local = bone.worldToLocal(tip);
    const len = Math.max(1e-4, local.length());
    return { bone, len, axis: local.clone().normalize(), group: ch.group, ...FEEL[ch.group] };
  }));
  applyStance(); root.updateMatrixWorld(true);

  const springs = new SpringSim(springChains, {
    stiff: 0.08, damp: 0.11, gravity: -2.4, limit: 0.42, inertia: 0.98,
    colliders: [
      { boneA: J.pelvis, boneB: J.chest, r: 0.18 * scaleApplied },
      { boneA: J.pelvis, boneB: J.hipL, r: 0.14 * scaleApplied },
      { boneA: J.pelvis, boneB: J.hipR, r: 0.14 * scaleApplied },
      { boneA: J.hipL, boneB: J.kneeL, r: 0.10 * scaleApplied },
      { boneA: J.hipR, boneB: J.kneeR, r: 0.10 * scaleApplied },
    ],
  });

  const restPose = new Map();
  for (const name of order) restPose.set(J[name], { p: J[name].position.clone(), r: J[name].rotation.clone() });
  const reset = () => restPose.forEach((v, g) => { g.position.copy(v.p); g.rotation.copy(v.r); });

  const clips = {
    idle: (t) => {
      const b = Math.sin(t * 0.9);
      J.chest.rotation.x = 0.02 + b * 0.012;
      J.spine.rotation.y = Math.sin(t * 0.3) * 0.03;
      J.head.rotation.x = HEAD_BOW + Math.sin(t * 0.6 + 1) * 0.02;
      J.pelvis.position.y += b * 0.003;
    },
    move: (t) => {
      const s = t * 2.0, sw = Math.sin(s), co = Math.cos(s);
      J.pelvis.position.y += -0.012 + Math.abs(sw) * 0.014;
      J.pelvis.rotation.y = sw * 0.05;
      J.chest.rotation.x = 0.08;
      J.hipL.rotation.x = sw * 0.30; J.hipR.rotation.x = -sw * 0.30;
      J.kneeL.rotation.x = Math.max(0, -co) * 0.4; J.kneeR.rotation.x = Math.max(0, co) * 0.4;
      J.ankleL.rotation.x = -J.hipL.rotation.x * 0.25; J.ankleR.rotation.x = -J.hipR.rotation.x * 0.25;
      J.shoulderL.rotation.x = -sw * 0.10; J.shoulderR.rotation.x = sw * 0.10;
      J.head.rotation.x = HEAD_BOW + 0.03;
    },
    telegraph: (t) => {
      const c = (t % 2.6) / 2.6;
      const open = Math.min(1, c / 0.35);
      J.shoulderL.rotation.z = -(open * 0.9); J.shoulderR.rotation.z = open * 0.9;
      J.shoulderL.rotation.x = J.shoulderR.rotation.x = -open * 0.75;
      J.elbowL.rotation.x = -open * 0.3; J.elbowR.rotation.x = -open * 0.3;
      J.head.rotation.x = HEAD_BOW - open * 0.30;
      J.chest.rotation.x = 0.02 - open * 0.08;
      J.pelvis.position.y += open * 0.012;
    },
    resolve: (t) => {
      const c = (t % 2.0) / 2.0;
      const wind = c < 0.24 ? c / 0.24 : 1;
      const strike = c >= 0.24 && c < 0.42 ? (c - 0.24) / 0.18 : c >= 0.42 ? 1 : 0;
      const recover = c >= 0.42 ? (c - 0.42) / 0.58 : 0;
      const f = strike * (1 - recover);
      J.shoulderL.rotation.z = -(wind * 0.85) + f * 0.55; J.shoulderR.rotation.z = wind * 0.85 - f * 0.55;
      J.shoulderL.rotation.x = J.shoulderR.rotation.x = -wind * 0.7 + f * 0.9;
      J.elbowL.rotation.x = -wind * 0.25 + f * 0.5; J.elbowR.rotation.x = -wind * 0.25 + f * 0.5;
      J.chest.rotation.x = 0.02 - wind * 0.1 + f * 0.22;
      J.head.rotation.x = HEAD_BOW - wind * 0.25 + f * 0.40;
      J.pelvis.position.y -= f * 0.03;
    },
    death: (t) => {
      const c = Math.min(1, t / 2.4), e = c * c * (3 - 2 * c);
      J.pelvis.position.y -= e * 0.55; J.pelvis.rotation.x = e * 0.4;
      J.hipL.rotation.x = -e * 1.1; J.hipR.rotation.x = -e * 1.0;
      J.kneeL.rotation.x = e * 1.7; J.kneeR.rotation.x = e * 1.6;
      J.chest.rotation.x = 0.02 + e * 0.5; J.head.rotation.x = HEAD_BOW + e * 0.45;
      J.shoulderL.rotation.x = J.shoulderR.rotation.x = e * 0.5;
    },
  };

  let current = 'idle', clock = 0;
  const update = (dt) => {
    clock += dt;
    reset();
    (clips[current] || clips.idle)(clock);
    root.updateMatrixWorld(true);
    springs.step(root, dt);
  };
  const setClip = (name) => {
    if (!clips[name]) return;
    current = name; clock = 0;
    reset(); clips[name](0);
    root.updateMatrixWorld(true);
    springs.reset(root);
  };
  const setSection = (id, on) => { (sectionMeshes[id] || []).forEach((m) => { m.visible = on; }); };
  const soloSection = (id) => { for (const key of Object.keys(sectionMeshes)) setSection(key, !id || key === id); };

  const body = measurePosed(bodyMeshes);
  const metrics = {
    figureHeight: +(body.max.y - body.min.y).toFixed(3),
    width: +(body.max.x - body.min.x).toFixed(3),
    depth: +(body.max.z - body.min.z).toFixed(3),
    scaleApplied,
    errorMm: Math.round((body.max.y - body.min.y - SUBJECT.targetHeightMeters) * 1000),
  };
  let triangles = 0;
  root.traverse((o) => { if (o.isMesh) triangles += tris(o.geometry); });

  return {
    group: root, joints: J, materials: mats,
    update, setClip, clipNames: Object.keys(clips),
    setSection, soloSection, sectionMeshes, sectionReport,
    triangles: Math.round(triangles), metrics, plateLoaded: !!plate,
    skeleton, bones: tree.bones, springs,
    silhouette: () => silhouetteReport(bodyMeshes, PLATE.silhouette),
    clipping: () => clippingReport(bodyMeshes, LAYER_PAIRS),
  };
}
export const build = buildCinderMourner;

export const LAYER_PAIRS = [];

export const CONFORMANCE = [
  { feature: 'Hooded mourning robe, single layer, torn pendant hem', state: 'built',
    detail: 'Eight stations sampled off the plate\u2019s own scanned silhouette (crown row 70, sole row 1486 of the 1023\u00d71537 canvas); the plate shows no second garment, so none is built.' },
  { feature: 'Face fully hidden by the cowl', state: 'built', detail: 'A plain dark void stands in for a face the plate never lights \u2014 there is nothing to sculpt from.' },
  { feature: 'Blank clay tablet worn as a token, on a cord', state: 'built',
    detail: '0.095\u00d70.118 m, hanging proud of the robe at chest height. Unlike enemy.ash-husk this individual carries no harness and no ember glow \u2014 the plate shows neither.' },
  { feature: 'Crazed, aged cloth surface (family motif)', state: 'built', detail: 'Light crease and crack-ridge relief on the robe and hood, at about half the amplitude used on enemy.ash-husk\u2019s heavier crust.' },
  { feature: 'Cloth that lags and settles', state: 'built', detail: 'Six single-segment spring bones on the hem, Verlet-integrated with body colliders \u2014 the same machinery ash-husk uses, fewer chains.' },
  { feature: 'Articulated fingers', state: 'absent', detail: 'Simplified paddle hands. Below what this pass\u2019s viewing distance needs; stated here rather than left for the viewer to discover.' },
  { feature: 'Ember glow', state: 'absent', detail: 'The plate carries none for this individual, unlike enemy.ash-husk\u2019s tablet. Not built, on the same rule that kept the family\u2019s torso-as-archive out of ash-husk: the individual plate governs.' },
  { feature: 'Torso as an archive of cracked clay drawers', state: 'refused',
    detail: 'Required by the family prompt (rank 1, call_nIgtNVLVAaxYFQ2Pt3fXba2w). Absent from this individual\u2019s own plate (rank 2), same standing conflict recorded on enemy.ash-husk. Not resolved here either.' },
  { feature: 'Nested garment layers', state: 'absent', detail: 'One outer robe; nothing on the plate to nest inside it, so there is no layer-clipping audit to run \u2014 an empty pair list rather than an invented one.' },
];
