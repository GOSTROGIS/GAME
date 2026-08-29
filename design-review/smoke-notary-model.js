/* =========================================================================
   smoke-notary-model.js — enemy.smoke-notary, Ashbound family
   -------------------------------------------------------------------------
   Same method as cinder-mourner-model.js. Crown row 24, sole row 1535 of a
   1024x1536 canvas \u2014 1511 px for a declared 1.90 m, so 1 px = 1.258 mm.

   HONEST CAVEAT, stated up front rather than left for the panel to surprise
   anyone with: this individual is the hardest of the three to scan. Its
   plate carries real drifting smoke off the shoulders and a dramatic
   arms-spread pose, and both defeat a flat luminance threshold \u2014 a wisp of
   smoke crosses the same brightness cutoff as a garment edge. The upper and
   middle silhouette bands are graded 'haze' below and excluded from the
   fidelity score for exactly that reason; only the crown/sole calibration and
   the lower legs, clear of both smoke and arms, are graded 'hard' or 'soft'.
   That is a measurement limit, not a modelling shortcut, and it is reported
   rather than quietly rounded away.
   ========================================================================= */
import * as THREE from 'three';
import { loadPlate, plateMaps, smokeTexture } from './kit/hm-plate-materials.js';
import {
  buildBoneTree, seg, bindGeometry, bindRigid, SpringSim, rescale, reseat, measurePosed,
} from './kit/hm-husk-rig.js';
import { clothLoft, tornHem, tris } from './kit/hm-husk-cloth.js';
import { silhouetteReport, clippingReport } from './kit/hm-model-measure.js';

export { loadPlate };

export const SUBJECT = {
  id: 'enemy.smoke-notary', name: 'Smoke Notary', family: 'Ashbound', rank: null,
  plate: '../assets/enemies/smoke-notary-v1.png',
  promptCall: null,
  targetHeightMeters: 1.90,
};

export const REVIEW = [
  { fault: 'No prior model to correct', was: 'This subject has never been built.',
    now: 'Built at the same lighter depth as cinder-mourner and wicket-eater, with one further honest limit: most of the torso/arm silhouette bands are excluded from scoring because the plate\u2019s own smoke defeats the scan (see the file header).' },
];

export const PLATE = {
  file: SUBJECT.plate,
  scale: { crownPx: 24, solePx: 1535, centrePx: 512, mmPerPx: 1.258, height: SUBJECT.targetHeightMeters },
  silhouette: [
    [1.804, 0.749, 'haze'], [1.521, 1.135, 'haze'], [1.235, 1.151, 'haze'], [0.950, 1.249, 'haze'],
    [0.666, 1.233, 'haze'], [0.380, 1.015, 'haze'], [0.286, 0.902, 'soft'], [0.190, 0.542, 'hard'],
    [0.096, 0.567, 'hard'], [0.0, 0.396, 'soft'],
  ],
};

const LIFT = 1.35;
const CROPS = {
  coat: { x: 360, y: 775, w: 140, h: 140, repeat: [8, 10], mean: 0.121 },
  vest: { x: 411, y: 544, w: 140, h: 140, repeat: [7, 8], mean: 0.227 },
  hood: { x: 493, y: 84, w: 140, h: 140, repeat: [5, 6], mean: 0.444 },
};
const FLAT = { coat: 0x2a251f, vest: 0x453e34, hood: 0x7a7268, boot: 0x140f0c, brass: 0x8a6a3a, skin: 0x0d0b09 };

function buildMaterials(plateImg) {
  const BASE = 0xf6f4f0;
  const maps = { coat: plateMaps(plateImg, CROPS.coat, LIFT), vest: plateMaps(plateImg, CROPS.vest, LIFT), hood: plateMaps(plateImg, CROPS.hood, LIFT) };
  const cloth = (name, key, rough) => new THREE.MeshStandardMaterial({
    name, color: maps[key].map ? BASE : FLAT[key], roughness: rough, metalness: 0.02,
    side: THREE.DoubleSide, vertexColors: true, ...maps[key],
  });
  return {
    coat: cloth('notary-coat', 'coat', 0.9), vest: cloth('notary-waistcoat', 'vest', 0.85), hood: cloth('notary-hood', 'hood', 0.88),
    brass: new THREE.MeshStandardMaterial({ name: 'aged-brass-fitting', color: FLAT.brass, roughness: 0.42, metalness: 0.62 }),
    boot: new THREE.MeshStandardMaterial({ name: 'notary-boot', color: FLAT.boot, roughness: 0.55, metalness: 0.05 }),
    skin: new THREE.MeshStandardMaterial({ name: 'shadowed-skin', color: FLAT.skin, roughness: 0.9, metalness: 0 }),
    smoke: new THREE.MeshStandardMaterial({
      name: 'notary-smoke', color: 0xb9b4a8, transparent: true, opacity: 0.16, depthWrite: false,
      roughness: 1, metalness: 0, side: THREE.DoubleSide, map: smokeTexture(), alphaMap: smokeTexture(),
    }),
  };
}

export function buildSmokeNotary({ plate = null } = {}) {
  const mats = buildMaterials(plate);
  const root = new THREE.Group();
  root.name = 'smoke-notary';

  const PARENT = {
    pelvis: null, spine: 'pelvis', chest: 'spine', neck: 'chest', head: 'neck',
    shoulderL: 'chest', shoulderR: 'chest', elbowL: 'shoulderL', elbowR: 'shoulderR', wristL: 'elbowL', wristR: 'elbowR',
    hipL: 'pelvis', hipR: 'pelvis', kneeL: 'hipL', kneeR: 'hipR', ankleL: 'kneeL', ankleR: 'kneeR',
  };
  const order = ['pelvis', 'spine', 'chest', 'neck', 'head', 'shoulderL', 'shoulderR', 'elbowL', 'elbowR',
    'wristL', 'wristR', 'hipL', 'hipR', 'kneeL', 'kneeR', 'ankleL', 'ankleR'];
  /* Rest pose carries the plate's own arms-spread stance directly in the
     skeleton, not as an animation layered on top of a hanging arm \u2014 this IS
     the creature's stance, the way ash-husk's foot yaw is baked rather than
     posed. */
  const rest = {
    pelvis: [0, 0.96, 0], spine: [0, 1.12, 0], chest: [0, 1.34, 0.005], neck: [0, 1.52, 0.01], head: [0, 1.66, 0],
    shoulderL: [0.175, 1.58, 0], shoulderR: [-0.175, 1.58, 0],
    elbowL: [0.42, 1.42, 0.05], elbowR: [-0.42, 1.42, 0.05],
    wristL: [0.62, 1.12, 0.10], wristR: [-0.62, 1.12, 0.10],
    hipL: [0.10, 0.96, 0], hipR: [-0.10, 0.96, 0],
    kneeL: [0.105, 0.53, 0.01], kneeR: [-0.105, 0.53, 0.01],
    ankleL: [0.105, 0.075, 0.02], ankleR: [-0.105, 0.075, 0.02],
  };
  const clothChains = [];
  const HEM_N = 6;
  for (let i = 0; i < HEM_N; i++) {
    const th = (i / HEM_N) * Math.PI * 2;
    const s = Math.sin(th), c = Math.cos(th);
    const A = `hem${i}`;
    rest[A] = [0.30 * s, 0.34, 0.30 * 0.75 * c];
    PARENT[A] = 'pelvis'; order.push(A);
    clothChains.push({ bones: [A], tip: [0.34 * s, 0.11, 0.34 * 0.75 * c], group: 'hem' });
  }
  const tree = buildBoneTree(rest, PARENT, order);
  const J = tree.byName, abs = tree.abs, boneIndex = tree.index;
  root.add(J.pelvis);
  const P = (n) => [abs[n].x, abs[n].y, abs[n].z];

  const field = [
    seg('pelvis', P('pelvis'), [0, 1.06, 0], 0.21),
    seg('spine', [0, 1.06, 0], [0, 1.26, 0], 0.22),
    seg('chest', [0, 1.26, 0], P('neck'), 0.27),
    seg('neck', P('neck'), [0, 1.60, 0], 0.115),
    seg('shoulderL', P('shoulderL'), P('elbowL'), 0.15, 1.0),
    seg('shoulderR', P('shoulderR'), P('elbowR'), 0.15, 1.0),
    seg('elbowL', P('elbowL'), P('wristL'), 0.115, 1.2),
    seg('elbowR', P('elbowR'), P('wristR'), 0.115, 1.2),
    seg('wristL', P('wristL'), [abs.wristL.x + 0.10, abs.wristL.y - 0.10, abs.wristL.z], 0.10, 1.2),
    seg('wristR', P('wristR'), [abs.wristR.x - 0.10, abs.wristR.y - 0.10, abs.wristR.z], 0.10, 1.2),
    seg('hipL', P('hipL'), P('kneeL'), 0.15),
    seg('hipR', P('hipR'), P('kneeR'), 0.15),
    seg('kneeL', P('kneeL'), P('ankleL'), 0.125),
    seg('kneeR', P('kneeR'), P('ankleR'), 0.125),
    seg('ankleL', P('ankleL'), [abs.ankleL.x, 0, abs.ankleL.z], 0.11),
    seg('ankleR', P('ankleR'), [abs.ankleR.x, 0, abs.ankleR.z], 0.11),
  ];
  for (const ch of clothChains) field.push(seg(ch.bones[0], P(ch.bones[0]), ch.tip, 0.18, 1.6, 1.4));

  const allGeos = [], bodyMeshes = [], smokeMeshes = [];
  const sectionMeshes = {}, sectionReport = [];
  function addSection(id, name, reads, method, parts) {
    const meshes = [];
    let t = 0;
    for (const part of parts) {
      if (part.billboard) {
        const mesh = new THREE.Mesh(part.geo, mats.smoke);
        mesh.name = part.meshName || id;
        mesh.userData.seed = part.seed ?? 0;
        mesh.userData.anchor = part.anchor.slice();
        mesh.position.set(...mesh.userData.anchor);
        root.add(mesh); smokeMeshes.push(mesh); meshes.push(mesh);
        continue;
      }
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
      { y: 1.50, rx: 0.165, rz: 0.125 }, { y: 1.30, rx: 0.235, rz: 0.178 },
      { y: 1.10, rx: 0.250, rz: 0.190 }, { y: 0.90, rx: 0.245, rz: 0.186 },
      { y: 0.62, rx: 0.230, rz: 0.174 }, { y: 0.35, rx: 0.195, rz: 0.148 },
    ],
    columns: 40, ringsPer: 3, capTop: true,
    hem: tornHem({ count: 8, depth: 0.24, vary: 0.48, seed: 91 }), hemRings: 6, hemPull: 0.08,
    fold: { count: 6, amp: 0.035, phase: 0.5 },
    crease: { amp: 0.006, freq: 16 }, crack: { amp: 0.0026, cell: 26 },
    wear: { top: 0.94, hem: 0.58 }, seed: 91,
  });
  addSection('coat', 'Tailcoat', 'Reads \u2014 a long dark coat, torn into asymmetric ragged tails below the waist.',
    'clothLoft, six stations; the lower legs are the only part of this plate\u2019s silhouette the scan trusts (see file header).',
    [{ geo: coatGeo, material: mats.coat, joint: 'chest', allow: ['pelvis', 'spine', 'chest', 'neck', 'hem*'] }]);

  const vestGeo = new THREE.PlaneGeometry(0.20, 0.42, 4, 8);
  {
    const p = vestGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      p.setZ(i, 0.05 + (y + 0.21) * 0.02);
    }
    vestGeo.computeVertexNormals();
    vestGeo.translate(0, 1.16, 0.155);
  }
  addSection('waistcoat', 'Waistcoat', 'Reads \u2014 a buttoned waistcoat visible where the coat parts at the chest.', 'A single bowed panel in front of the coat, plate-sampled to a lighter, warmer crop than the coat itself.',
    [{ geo: vestGeo, material: mats.vest, joint: 'chest', rigid: true }]);

  const hoodGeo = clothLoft({
    stations: [
      { y: 1.90, rx: 0.030, rz: 0.030 }, { y: 1.80, rx: 0.075, rz: 0.068 }, { y: 1.70, rx: 0.090, rz: 0.082 },
      { y: 1.63, rx: 0.085, rz: 0.078, cz: 0.01 }, { y: 1.575, rx: 0.145, rz: 0.130, cz: 0.02 },
      { y: 1.53, rx: 0.170, rz: 0.150, cz: 0.03 },
    ],
    columns: 26, ringsPer: 4, capTop: true,
    crease: { amp: 0.005, freq: 18 }, wear: { top: 1.0, hem: 0.82 }, seed: 92,
  });
  const headGeo = new THREE.SphereGeometry(0.085, 18, 14);
  headGeo.scale(1, 0.85, 0.9);
  headGeo.translate(abs.head.x, abs.head.y - 0.06, abs.head.z);
  addSection('hood', 'Stovepipe hood', 'Reads \u2014 the tallest point on the plate: a stiff pointed hood rather than soft drooping cloth.',
    'clothLoft with a narrow tip and a short flared brim, rigid to the neck.',
    [{ geo: hoodGeo, material: mats.hood, joint: 'neck', rigid: true }, { geo: headGeo, material: mats.skin, joint: 'head', rigid: true, meshName: 'head-void' }]);

  const sleeveParts = [];
  for (const side of ['L', 'R']) {
    const sh = abs['shoulder' + side], el = abs['elbow' + side], wr = abs['wrist' + side];
    const geo = clothLoft({
      stations: [
        { y: sh.y, rx: 0.095, rz: 0.08, cx: sh.x, cz: sh.z }, { y: el.y, rx: 0.078, rz: 0.065, cx: el.x, cz: el.z },
        { y: wr.y, rx: 0.062, rz: 0.052, cx: wr.x, cz: wr.z },
      ],
      columns: 16, ringsPer: 5, capTop: true,
      crease: { amp: 0.005, freq: 15 }, wear: { top: 0.92, hem: 0.7 }, seed: side === 'L' ? 101 : 102,
    });
    sleeveParts.push({ geo, material: mats.coat, joint: 'elbow' + side, meshName: 'sleeve-' + side, allow: ['shoulder' + side, 'elbow' + side, 'wrist' + side] });
  }
  addSection('sleeves', 'Sleeves', 'Reads \u2014 coat cloth continues down both outstretched arms.', 'clothLoft per arm, following the rest pose\u2019s own spread.', sleeveParts);

  const fittingParts = [];
  for (const side of ['L', 'R']) {
    const w = abs['wrist' + side];
    for (let i = 0; i < 3; i++) {
      const g = new THREE.TorusGeometry(0.052 - i * 0.006, 0.014, 8, 16);
      g.rotateY(Math.PI / 2 + (side === 'L' ? 0.3 : -0.3));
      g.translate(w.x + (side === 'L' ? 0.03 : -0.03) * i, w.y - 0.02 * i, w.z + 0.04);
      fittingParts.push({ geo: g, material: mats.brass, joint: 'wrist' + side, rigid: true, meshName: 'fitting-' + side + i });
    }
    const hand = new THREE.BoxGeometry(0.045, 0.09, 0.024);
    hand.translate(w.x + (side === 'L' ? 0.02 : -0.02), w.y - 0.10, w.z + 0.01);
    fittingParts.push({ geo: hand, material: mats.skin, joint: 'wrist' + side, rigid: true, meshName: 'hand-' + side });
  }
  addSection('fittings', 'Brass wrist fittings, and the hands', 'Reads \u2014 stacked brass dial fittings ringing each wrist, open hands hanging clear of them.',
    'Rigid tori of decreasing radius, threaded on the wrist; paddle hands, not articulated fingers.', fittingParts);

  const bootParts = [];
  for (const side of ['L', 'R']) {
    const a = abs['ankle' + side];
    const g = new THREE.BoxGeometry(0.085, 0.06, 0.165, 2, 1, 2);
    g.translate(a.x, a.y - 0.02, a.z + 0.03);
    bootParts.push({ geo: g, material: mats.boot, joint: 'ankle' + side, rigid: true, meshName: 'boot-' + side });
  }
  addSection('boots', 'Boots', 'Reads \u2014 slim leather boots, the one part of this plate\u2019s silhouette the scan grades \u2018hard\u2019.', 'Rigid blocks.', bootParts);

  const smokeParts = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.PlaneGeometry(0.30, 0.55);
    smokeParts.push({ billboard: true, geo: g, seed: i * 1.7, anchor: [(i % 2 ? 1 : -1) * (0.20 + i * 0.02), 1.55 + i * 0.03, -0.05 + i * 0.02], meshName: 'smoke-' + i });
  }
  addSection('smoke', 'Drifting smoke', 'Reads \u2014 faint wisps off the shoulders, the reason this plate\u2019s upper silhouette cannot be scored (see file header).',
    'Six alpha-mapped billboards, unskinned, rising and fading. Excluded from every height measurement, because they are not the figure.', smokeParts);

  const HEAD_BOW = 0.08;
  const applyStance = () => { J.head.rotation.x = HEAD_BOW; J.chest.rotation.x = 0.02; };
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
  for (const m of smokeMeshes) {
    const a = m.userData.anchor;
    m.userData.baseScale = scaleApplied;
    m.userData.baseY = a[1] * scaleApplied + totalDy;
    m.position.set(a[0] * scaleApplied, m.userData.baseY, a[2] * scaleApplied);
  }

  const FEEL = { hem: { stiff: 0.05, damp: 0.085, limit: 0.44 } };
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
    stiff: 0.07, damp: 0.10, gravity: -2.5, limit: 0.44, inertia: 0.98,
    colliders: [
      { boneA: J.pelvis, boneB: J.chest, r: 0.20 * scaleApplied },
      { boneA: J.pelvis, boneB: J.hipL, r: 0.16 * scaleApplied },
      { boneA: J.pelvis, boneB: J.hipR, r: 0.16 * scaleApplied },
      { boneA: J.hipL, boneB: J.kneeL, r: 0.12 * scaleApplied },
      { boneA: J.hipR, boneB: J.kneeR, r: 0.12 * scaleApplied },
    ],
  });

  const restPose = new Map();
  for (const name of order) restPose.set(J[name], { p: J[name].position.clone(), r: J[name].rotation.clone() });
  const reset = () => restPose.forEach((v, g) => { g.position.copy(v.p); g.rotation.copy(v.r); });

  const clips = {
    idle: (t) => {
      const b = Math.sin(t * 0.85);
      J.chest.rotation.x = 0.02 + b * 0.01;
      J.spine.rotation.y = Math.sin(t * 0.3) * 0.03;
      J.head.rotation.x = HEAD_BOW + Math.sin(t * 0.6) * 0.02;
      J.head.rotation.y = Math.sin(t * 0.22) * 0.1;
      J.shoulderL.rotation.z = Math.sin(t * 0.5) * 0.03;
      J.shoulderR.rotation.z = -Math.sin(t * 0.5) * 0.03;
      J.pelvis.position.y += b * 0.003;
    },
    move: (t) => {
      const s = t * 1.9, sw = Math.sin(s), co = Math.cos(s);
      J.pelvis.position.y += -0.01 + Math.abs(sw) * 0.012;
      J.pelvis.rotation.y = sw * 0.04;
      J.hipL.rotation.x = sw * 0.26; J.hipR.rotation.x = -sw * 0.26;
      J.kneeL.rotation.x = Math.max(0, -co) * 0.35; J.kneeR.rotation.x = Math.max(0, co) * 0.35;
      J.ankleL.rotation.x = -J.hipL.rotation.x * 0.25; J.ankleR.rotation.x = -J.hipR.rotation.x * 0.25;
      J.head.rotation.x = HEAD_BOW + 0.02;
    },
    telegraph: (t) => {
      const c = (t % 2.6) / 2.6;
      const open = Math.min(1, c / 0.34);
      J.shoulderL.rotation.z = open * 0.35; J.shoulderR.rotation.z = -open * 0.35;
      J.shoulderL.rotation.x = J.shoulderR.rotation.x = -open * 0.4;
      J.elbowL.rotation.z = open * 0.3; J.elbowR.rotation.z = -open * 0.3;
      J.head.rotation.x = HEAD_BOW - open * 0.18;
      J.chest.rotation.x = 0.02 - open * 0.05;
      J.pelvis.position.y += open * 0.01;
    },
    resolve: (t) => {
      const c = (t % 2.0) / 2.0;
      const wind = c < 0.24 ? c / 0.24 : 1;
      const strike = c >= 0.24 && c < 0.4 ? (c - 0.24) / 0.16 : c >= 0.4 ? 1 : 0;
      const recover = c >= 0.4 ? (c - 0.4) / 0.6 : 0;
      const f = strike * (1 - recover);
      J.shoulderL.rotation.x = J.shoulderR.rotation.x = -0.4 * wind + f * 0.9;
      J.shoulderL.rotation.z = 0.35 * wind - f * 0.55; J.shoulderR.rotation.z = -0.35 * wind + f * 0.55;
      J.elbowL.rotation.x = f * 0.5; J.elbowR.rotation.x = f * 0.5;
      J.chest.rotation.x = 0.02 - wind * 0.06 + f * 0.18;
      J.head.rotation.x = HEAD_BOW - wind * 0.14 + f * 0.28;
      J.pelvis.position.y -= f * 0.02;
    },
    death: (t) => {
      const c = Math.min(1, t / 2.4), e = c * c * (3 - 2 * c);
      J.pelvis.position.y -= e * 0.55; J.pelvis.rotation.x = e * 0.4;
      J.hipL.rotation.x = -e * 1.05; J.hipR.rotation.x = -e * 0.95;
      J.kneeL.rotation.x = e * 1.6; J.kneeR.rotation.x = e * 1.5;
      J.chest.rotation.x = 0.02 + e * 0.46; J.head.rotation.x = HEAD_BOW + e * 0.4;
      J.shoulderL.rotation.x = J.shoulderR.rotation.x = -0.4 + e * 0.9;
    },
  };

  let current = 'idle', clock = 0;
  const update = (dt) => {
    clock += dt;
    reset();
    (clips[current] || clips.idle)(clock);
    root.updateMatrixWorld(true);
    springs.step(root, dt);
    for (let i = 0; i < smokeMeshes.length; i++) {
      const m = smokeMeshes[i];
      const s = clock * 0.36 + m.userData.seed;
      const k = s % 1;
      m.position.y = m.userData.baseY + k * 0.30 * m.userData.baseScale;
      m.rotation.y = Math.sin(s * 0.5) * 0.5;
      m.scale.setScalar((0.75 + k * 0.55) * m.userData.baseScale);
      m.material.opacity = 0.16 * (1 - k) * (0.6 + 0.4 * Math.sin(s * 2.0));
    }
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
export const build = buildSmokeNotary;

export const LAYER_PAIRS = [
  { inner: 'waistcoat', outer: 'coat', label: 'Waistcoat proud of the coat', tol: 40 },
];

export const CONFORMANCE = [
  { feature: 'Tall pointed leather hood, stiff rather than draping', state: 'built', detail: 'The tallest point on the plate; built as a narrow-tipped cone rather than the soft cowl on cinder-mourner and wicket-eater, because that is what this individual\u2019s plate draws.' },
  { feature: 'Buttoned waistcoat under a torn tailcoat', state: 'built', detail: 'A separate plate-sampled panel at the chest, lighter and warmer than the coat crop, standing in for the buttoned front.' },
  { feature: 'Arms held out from the body, not hanging', state: 'built', detail: 'Baked into the rest skeleton rather than posed on top of it \u2014 this is the plate\u2019s own stance, the same reasoning ash-husk uses for its foot yaw.' },
  { feature: 'Stacked brass dial fittings at both wrists', state: 'built', detail: 'Three rigid tori of decreasing radius per wrist. The plate\u2019s own colour sample here landed on the leather beside the fittings, not the brass, so the metal colour is a design read rather than a measured one \u2014 said plainly rather than presented as scanned.' },
  { feature: 'Smoke drifting from the shoulders', state: 'built', detail: 'Six alpha billboards, rising and fading, excluded from every height measurement because they are not the figure.' },
  { feature: 'Silhouette measured against the plate', state: 'deviation', detail: 'Only 4 of 10 scanned bands are scored \u2014 crown/sole plus the two lower-leg rows. The rest are printed as \u2018haze\u2019 and excluded: this plate\u2019s own smoke and arm spread defeat a luminance-threshold scan there. Stated in the file header rather than discovered in the panel.' },
  { feature: 'Torso as an archive of cracked clay drawers', state: 'refused', detail: 'Same standing conflict as every Ashbound individual built so far.' },
];
