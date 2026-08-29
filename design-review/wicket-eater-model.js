/* =========================================================================
   wicket-eater-model.js — enemy.wicket-eater, Ashbound family
   -------------------------------------------------------------------------
   Same method as cinder-mourner-model.js (read that file's header for the
   measurement methodology; not repeated here). Crown row 120, sole row 1476
   of a 1024x1536 canvas \u2014 1356 px for the declared 1.78 m, so 1 px = 1.313 mm.

   This individual's plate is noisier to read than cinder-mourner's: the
   book stack held against the chest bulges the silhouette across rows that
   would otherwise report coat width, so PLATE.silhouette grades most of the
   torso 'soft' rather than 'hard' \u2014 only the shoulder cape and the lower
   coat, both clear of the books, are graded 'hard'.
   ========================================================================= */
import * as THREE from 'three';
import { loadPlate, plateMaps } from './kit/hm-plate-materials.js';
import {
  buildBoneTree, seg, bindGeometry, bindRigid, SpringSim, rescale, reseat, measurePosed,
} from './kit/hm-husk-rig.js';
import { clothLoft, tornHem, wrapCoil, tris } from './kit/hm-husk-cloth.js';
import { silhouetteReport, clippingReport } from './kit/hm-model-measure.js';

export { loadPlate };

export const SUBJECT = {
  id: 'enemy.wicket-eater', name: 'Wicket Eater', family: 'Ashbound', rank: null,
  plate: '../assets/enemies/wicket-eater-v1.png',
  promptCall: null,
  targetHeightMeters: 1.78,
};

export const REVIEW = [
  { fault: 'No prior model to correct', was: 'This subject has never been built.',
    now: 'Built at the same lighter depth as cinder-mourner \u2014 see that file\u2019s header for what this tier omits and why.' },
];

export const PLATE = {
  file: SUBJECT.plate,
  scale: { crownPx: 120, solePx: 1476, centrePx: 512, mmPerPx: 1.313, height: SUBJECT.targetHeightMeters },
  silhouette: [
    [1.690, 0.288, 'soft'], [1.514, 0.381, 'soft'], [1.335, 0.600, 'hard'], [1.157, 0.684, 'soft'],
    [0.980, 0.706, 'soft'], [0.801, 0.779, 'soft'], [0.624, 0.687, 'hard'], [0.445, 0.464, 'hard'],
    [0.267, 0.607, 'soft'], [0.089, 0.431, 'soft'],
  ],
};

const LIFT = 1.35;
const CROPS = {
  coat: { x: 493, y: 775, w: 140, h: 140, repeat: [8, 10], mean: 0.101 },
  cape: { x: 544, y: 391, w: 140, h: 140, repeat: [6, 6], mean: 0.165 },
  hood: { x: 473, y: 130, w: 140, h: 140, repeat: [5, 5], mean: 0.314 },
};
const FLAT = { coat: 0x1d1916, cape: 0x2e2925, hood: 0x4a4844, books: 0x191a1e, sash: 0x12100e, boot: 0x100e0c, skin: 0x0e0c0a };

function buildMaterials(plateImg) {
  const BASE = 0xf6f4f0;
  const maps = { coat: plateMaps(plateImg, CROPS.coat, LIFT), cape: plateMaps(plateImg, CROPS.cape, LIFT), hood: plateMaps(plateImg, CROPS.hood, LIFT) };
  const cloth = (name, key, rough) => new THREE.MeshStandardMaterial({
    name, color: maps[key].map ? BASE : FLAT[key], roughness: rough, metalness: 0.02,
    side: THREE.DoubleSide, vertexColors: true, ...maps[key],
  });
  return {
    coat: cloth('wicket-coat', 'coat', 0.94), cape: cloth('wicket-cape', 'cape', 0.93), hood: cloth('wicket-hood', 'hood', 0.92),
    books: new THREE.MeshStandardMaterial({ name: 'blank-ledger-stack', color: FLAT.books, roughness: 0.55, metalness: 0.02 }),
    sash: new THREE.MeshStandardMaterial({ name: 'waist-sash', color: FLAT.sash, roughness: 0.85, metalness: 0 }),
    skin: new THREE.MeshStandardMaterial({ name: 'shadowed-skin', color: FLAT.skin, roughness: 0.9, metalness: 0 }),
    boot: new THREE.MeshStandardMaterial({ name: 'soft-boot', color: FLAT.boot, roughness: 0.9, metalness: 0 }),
  };
}

export function buildWicketEater({ plate = null } = {}) {
  const mats = buildMaterials(plate);
  const root = new THREE.Group();
  root.name = 'wicket-eater';

  const PARENT = {
    pelvis: null, spine: 'pelvis', chest: 'spine', neck: 'chest', head: 'neck',
    shoulderL: 'chest', shoulderR: 'chest', elbowL: 'shoulderL', elbowR: 'shoulderR', wristL: 'elbowL', wristR: 'elbowR',
    hipL: 'pelvis', hipR: 'pelvis', kneeL: 'hipL', kneeR: 'hipR', ankleL: 'kneeL', ankleR: 'kneeR',
  };
  const order = ['pelvis', 'spine', 'chest', 'neck', 'head', 'shoulderL', 'shoulderR', 'elbowL', 'elbowR',
    'wristL', 'wristR', 'hipL', 'hipR', 'kneeL', 'kneeR', 'ankleL', 'ankleR'];
  const rest = {
    pelvis: [0, 0.90, 0], spine: [0, 1.04, 0], chest: [0, 1.24, 0], neck: [0, 1.40, 0.005], head: [0, 1.52, -0.006],
    shoulderL: [0.16, 1.415, 0], shoulderR: [-0.16, 1.415, 0],
    elbowL: [0.20, 1.15, 0.04], elbowR: [-0.20, 1.15, 0.02],
    wristL: [0.19, 0.90, 0.10], wristR: [-0.21, 0.87, 0.02],
    hipL: [0.095, 0.90, 0], hipR: [-0.095, 0.90, 0],
    kneeL: [0.10, 0.495, 0.01], kneeR: [-0.10, 0.495, 0.01],
    ankleL: [0.10, 0.07, 0.02], ankleR: [-0.10, 0.07, 0.02],
  };
  const clothChains = [];
  const HEM_N = 6;
  for (let i = 0; i < HEM_N; i++) {
    const th = (i / HEM_N) * Math.PI * 2;
    const s = Math.sin(th), c = Math.cos(th);
    const A = `hem${i}`;
    rest[A] = [0.30 * s, 0.32, 0.30 * 0.75 * c];
    PARENT[A] = 'pelvis'; order.push(A);
    clothChains.push({ bones: [A], tip: [0.34 * s, 0.10, 0.34 * 0.75 * c], group: 'hem' });
  }

  const tree = buildBoneTree(rest, PARENT, order);
  const J = tree.byName, abs = tree.abs, boneIndex = tree.index;
  root.add(J.pelvis);
  const P = (n) => [abs[n].x, abs[n].y, abs[n].z];

  const field = [
    seg('pelvis', P('pelvis'), [0, 1.00, 0], 0.20),
    seg('spine', [0, 1.00, 0], [0, 1.18, 0], 0.21),
    seg('chest', [0, 1.18, 0], P('neck'), 0.26),
    seg('neck', P('neck'), [0, 1.47, 0], 0.11),
    seg('shoulderL', P('shoulderL'), P('elbowL'), 0.15, 1.0),
    seg('shoulderR', P('shoulderR'), P('elbowR'), 0.15, 1.0),
    seg('elbowL', P('elbowL'), P('wristL'), 0.12, 1.2),
    seg('elbowR', P('elbowR'), P('wristR'), 0.12, 1.2),
    seg('wristL', P('wristL'), [abs.wristL.x, 0.72, abs.wristL.z], 0.10, 1.2),
    seg('wristR', P('wristR'), [abs.wristR.x, 0.72, abs.wristR.z], 0.10, 1.2),
    seg('hipL', P('hipL'), P('kneeL'), 0.14),
    seg('hipR', P('hipR'), P('kneeR'), 0.14),
    seg('kneeL', P('kneeL'), P('ankleL'), 0.12),
    seg('kneeR', P('kneeR'), P('ankleR'), 0.12),
    seg('ankleL', P('ankleL'), [abs.ankleL.x, 0, abs.ankleL.z], 0.10),
    seg('ankleR', P('ankleR'), [abs.ankleR.x, 0, abs.ankleR.z], 0.10),
  ];
  for (const ch of clothChains) field.push(seg(ch.bones[0], P(ch.bones[0]), ch.tip, 0.17, 1.6, 1.4));

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

  const coatGeo = clothLoft({
    stations: [
      { y: 1.400, rx: 0.155, rz: 0.116 }, { y: 1.157, rx: 0.300, rz: 0.225 },
      { y: 0.980, rx: 0.320, rz: 0.240 }, { y: 0.801, rx: 0.345, rz: 0.259 },
      { y: 0.624, rx: 0.310, rz: 0.233 }, { y: 0.445, rx: 0.220, rz: 0.165 },
    ],
    columns: 40, ringsPer: 3, capTop: true,
    hem: tornHem({ count: 7, depth: 0.19, vary: 0.44, seed: 71 }), hemRings: 6, hemPull: 0.07,
    fold: { count: 6, amp: 0.04, phase: 0.2 },
    crease: { amp: 0.006, freq: 17 }, crack: { amp: 0.003, cell: 28 },
    wear: { top: 0.95, hem: 0.60 }, seed: 71,
  });
  addSection('coat', 'Long coat', 'Reads \u2014 a dark, dagged coat reaching past the knee, torn into pendant tongues at the hem.',
    'clothLoft, six stations off the scanned silhouette (the cape above absorbs the shoulder-height reading).',
    [{ geo: coatGeo, material: mats.coat, joint: 'chest', allow: ['pelvis', 'spine', 'chest', 'neck', 'hem*'] }]);

  const capeGeo = clothLoft({
    stations: [
      { y: 1.460, rx: 0.030, rz: 0.024 }, { y: 1.400, rx: 0.205, rz: 0.160 },
      { y: 1.300, rx: 0.300, rz: 0.230 }, { y: 1.150, rx: 0.235, rz: 0.180 },
    ],
    columns: 30, ringsPer: 4, capTop: true,
    hem: tornHem({ count: 5, depth: 0.09, vary: 0.4, seed: 72 }), hemRings: 3, hemPull: 0.04,
    crease: { amp: 0.005, freq: 16 }, wear: { top: 0.97, hem: 0.78 }, seed: 72,
  });
  addSection('cape', 'Shoulder cape', 'Reads \u2014 the widest point on the plate: a cape collar flaring past the shoulders, over the coat beneath it.',
    'A second, shorter clothLoft layered outside the coat\u2019s own shoulder station.',
    [{ geo: capeGeo, material: mats.cape, joint: 'neck', rigid: true }]);

  const sashGeo = wrapCoil({
    y0: 1.02, y1: 0.99, rx: 0.255, rz: 0.19, turns: 1.15, thick: 0.028, along: 70, radial: 8,
    wear: { top: 0.9, hem: 0.85 }, seed: 73,
  });
  addSection('sash', 'Waist sash', 'Reads \u2014 a wound band cinching the coat at the waist.', 'wrapCoil, just over one turn.',
    [{ geo: sashGeo, material: mats.sash, joint: 'spine', rigid: true }]);

  const hoodGeo = clothLoft({
    stations: [
      { y: 1.66, rx: 0.010, rz: 0.010 }, { y: 1.60, rx: 0.070, rz: 0.062, cz: 0.008 },
      { y: 1.52, rx: 0.125, rz: 0.108, cz: 0.02 }, { y: 1.44, rx: 0.150, rz: 0.130, cz: 0.03 },
    ],
    columns: 26, ringsPer: 4, capTop: true,
    crease: { amp: 0.005, freq: 18 }, wear: { top: 1.0, hem: 0.88 }, seed: 61,
  });
  const headGeo = new THREE.SphereGeometry(0.08, 20, 16);
  headGeo.scale(1, 1.1, 0.92);
  headGeo.translate(abs.head.x, abs.head.y, abs.head.z);
  addSection('hood', 'Hood, and the head it hides', 'Reads \u2014 the cowl is deep enough that the face is a dark gap, not a lit surface.',
    'clothLoft cone, rigid to the neck; a plain void sphere for the head.',
    [{ geo: hoodGeo, material: mats.hood, joint: 'neck', rigid: true }, { geo: headGeo, material: mats.skin, joint: 'head', rigid: true, meshName: 'head-void' }]);

  const sleeveParts = [];
  for (const side of ['L', 'R']) {
    const sh = abs['shoulder' + side], el = abs['elbow' + side], wr = abs['wrist' + side];
    const geo = clothLoft({
      stations: [
        { y: sh.y, rx: 0.09, rz: 0.075, cx: sh.x, cz: sh.z }, { y: el.y, rx: 0.072, rz: 0.06, cx: el.x, cz: el.z },
        { y: wr.y, rx: 0.056, rz: 0.048, cx: wr.x, cz: wr.z },
      ],
      columns: 16, ringsPer: 4, capTop: true,
      crease: { amp: 0.005, freq: 16 }, wear: { top: 0.92, hem: 0.72 }, seed: side === 'L' ? 81 : 82,
    });
    sleeveParts.push({ geo, material: mats.coat, joint: 'elbow' + side, meshName: 'sleeve-' + side, allow: ['shoulder' + side, 'elbow' + side, 'wrist' + side] });
  }
  addSection('sleeves', 'Sleeves', 'Reads \u2014 coat cloth continues down both arms.', 'clothLoft per arm, three stations.', sleeveParts);

  const bookParts = [];
  {
    const w = abs.wristL;
    for (let i = 0; i < 4; i++) {
      const g = new THREE.BoxGeometry(0.09, 0.012, 0.115);
      g.translate(w.x - 0.01 + i * 0.006, w.y + 0.04 + i * 0.014, w.z + 0.06 - i * 0.004);
      bookParts.push({ geo: g, material: mats.books, joint: 'wristL', rigid: true, meshName: 'book-' + i });
    }
    const gL = new THREE.BoxGeometry(0.05, 0.10, 0.03);
    gL.translate(w.x, w.y - 0.02, w.z + 0.02);
    bookParts.push({ geo: gL, material: mats.skin, joint: 'wristL', rigid: true, meshName: 'hand-L' });
    const wr = abs.wristR;
    const gR = new THREE.BoxGeometry(0.045, 0.10, 0.025);
    gR.translate(wr.x, wr.y - 0.05, wr.z + 0.01);
    bookParts.push({ geo: gR, material: mats.skin, joint: 'wristR', rigid: true, meshName: 'hand-R' });
  }
  addSection('books-and-hands', 'Ledger stack, and the hands', 'Reads \u2014 a stack of blank ledger boards held against the chest in one arm; the other hand hangs bare.',
    'Rigid stacked slabs, fanned slightly, bound to the carrying wrist. Paddle hands, not articulated fingers.', bookParts);

  const bootParts = [];
  for (const side of ['L', 'R']) {
    const a = abs['ankle' + side];
    const g = new THREE.BoxGeometry(0.08, 0.055, 0.155, 2, 1, 2);
    g.translate(a.x, a.y - 0.02, a.z + 0.03);
    bootParts.push({ geo: g, material: mats.boot, joint: 'ankle' + side, rigid: true, meshName: 'boot-' + side });
  }
  addSection('boots', 'Boots', 'Reads \u2014 soft flat boots, banded at the ankle.', 'Rigid blocks.', bootParts);

  const HEAD_BOW = 0.16;
  const applyStance = () => { J.head.rotation.x = HEAD_BOW; J.neck.rotation.x = 0.04; J.chest.rotation.x = 0.02; J.elbowL.rotation.x = 1.3; J.shoulderL.rotation.x = -0.5; J.shoulderL.rotation.z = 0.35; };
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

  const FEEL = { hem: { stiff: 0.055, damp: 0.09, limit: 0.42 } };
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
    stiff: 0.075, damp: 0.11, gravity: -2.5, limit: 0.42, inertia: 0.98,
    colliders: [
      { boneA: J.pelvis, boneB: J.chest, r: 0.19 * scaleApplied },
      { boneA: J.pelvis, boneB: J.hipL, r: 0.15 * scaleApplied },
      { boneA: J.pelvis, boneB: J.hipR, r: 0.15 * scaleApplied },
      { boneA: J.hipL, boneB: J.kneeL, r: 0.11 * scaleApplied },
      { boneA: J.hipR, boneB: J.kneeR, r: 0.11 * scaleApplied },
    ],
  });

  const restPose = new Map();
  for (const name of order) restPose.set(J[name], { p: J[name].position.clone(), r: J[name].rotation.clone() });
  const reset = () => restPose.forEach((v, g) => { g.position.copy(v.p); g.rotation.copy(v.r); });

  const clips = {
    idle: (t) => {
      const b = Math.sin(t * 1.0);
      J.chest.rotation.x = 0.02 + b * 0.01;
      J.spine.rotation.y = Math.sin(t * 0.35) * 0.025;
      J.head.rotation.x = HEAD_BOW + Math.sin(t * 0.7) * 0.02;
      J.head.rotation.y = Math.sin(t * 0.25) * 0.08;
      J.pelvis.position.y += b * 0.003;
    },
    move: (t) => {
      const s = t * 2.1, sw = Math.sin(s), co = Math.cos(s);
      J.pelvis.position.y += -0.011 + Math.abs(sw) * 0.013;
      J.pelvis.rotation.y = sw * 0.045;
      J.hipL.rotation.x = sw * 0.28; J.hipR.rotation.x = -sw * 0.28;
      J.kneeL.rotation.x = Math.max(0, -co) * 0.38; J.kneeR.rotation.x = Math.max(0, co) * 0.38;
      J.ankleL.rotation.x = -J.hipL.rotation.x * 0.25; J.ankleR.rotation.x = -J.hipR.rotation.x * 0.25;
      J.shoulderR.rotation.x = -sw * 0.10;
      J.head.rotation.x = HEAD_BOW + 0.02;
    },
    telegraph: (t) => {
      const c = (t % 2.4) / 2.4;
      const open = Math.min(1, c / 0.32);
      J.shoulderL.rotation.z = 0.35 + open * 0.15;
      J.elbowL.rotation.x = 1.3 - open * 0.2;
      J.shoulderR.rotation.x = -open * 1.1; J.shoulderR.rotation.z = -0.1;
      J.elbowR.rotation.x = open * 0.3;
      J.head.rotation.x = HEAD_BOW - open * 0.22;
      J.chest.rotation.x = 0.02 - open * 0.06;
    },
    resolve: (t) => {
      const c = (t % 1.9) / 1.9;
      const wind = c < 0.26 ? c / 0.26 : 1;
      const strike = c >= 0.26 && c < 0.42 ? (c - 0.26) / 0.16 : c >= 0.42 ? 1 : 0;
      const recover = c >= 0.42 ? (c - 0.42) / 0.58 : 0;
      const f = strike * (1 - recover);
      J.shoulderR.rotation.x = -wind * 1.1 + f * 1.6;
      J.shoulderR.rotation.z = -0.1 + f * 0.2;
      J.elbowR.rotation.x = wind * 0.3 - f * 0.5;
      J.chest.rotation.x = 0.02 - wind * 0.08 + f * 0.20;
      J.head.rotation.x = HEAD_BOW - wind * 0.2 + f * 0.32;
      J.pelvis.position.y -= f * 0.025;
    },
    death: (t) => {
      const c = Math.min(1, t / 2.3), e = c * c * (3 - 2 * c);
      J.pelvis.position.y -= e * 0.5; J.pelvis.rotation.x = e * 0.42;
      J.hipL.rotation.x = -e * 1.05; J.hipR.rotation.x = -e * 0.95;
      J.kneeL.rotation.x = e * 1.6; J.kneeR.rotation.x = e * 1.5;
      J.chest.rotation.x = 0.02 + e * 0.48; J.head.rotation.x = HEAD_BOW + e * 0.42;
      J.shoulderR.rotation.x = -1.1 + e * 1.6;
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
    figureHeight: +(body.max.y - body.min.y).toFixed(3), width: +(body.max.x - body.min.x).toFixed(3),
    depth: +(body.max.z - body.min.z).toFixed(3), scaleApplied,
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
export const build = buildWicketEater;

export const LAYER_PAIRS = [
  { inner: 'coat', outer: 'cape', label: 'Coat inside the shoulder cape', tol: 15 },
];

export const CONFORMANCE = [
  { feature: 'Dagged coat with a torn pendant hem', state: 'built', detail: 'Six stations off the scanned silhouette; coat reaches past the knee before tearing into tongues.' },
  { feature: 'Wide shoulder cape collar', state: 'built', detail: 'The plate\u2019s single widest band (0.60 m at 1.34 m) is this cape, layered outside the coat rather than folded into the coat\u2019s own stations.' },
  { feature: 'Waist sash', state: 'built', detail: 'One wrapCoil turn cinching the coat.' },
  { feature: 'Hood hiding the face', state: 'built', detail: 'Same void-head treatment as cinder-mourner: nothing on the plate is lit under the cowl, so nothing is sculpted there.' },
  { feature: 'Stack of blank ledger boards carried in one arm', state: 'built', detail: 'Four fanned slabs rigid to the carrying wrist \u2014 the plate shows no lettering, so none is added.' },
  { feature: 'Layers that stay in order', state: 'built', detail: 'One audited pair (coat inside the cape); measured per height and angle bin, printed in the panel rather than asserted.' },
  { feature: 'Articulated fingers', state: 'absent', detail: 'Paddle hands, as on cinder-mourner \u2014 stated once there and true here too.' },
  { feature: 'Torso as an archive of cracked clay drawers', state: 'refused', detail: 'Same standing conflict as every Ashbound individual built so far: the family prompt (rank 1) asks for it, this individual\u2019s own plate (rank 2) does not show it, and the plate governs.' },
];
