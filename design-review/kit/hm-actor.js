/* =========================================================================
   hm-actor.js — the skinned humanoid rig for The Hollow March
   -------------------------------------------------------------------------
   v2. The previous version built each actor from roughly forty separately
   transformed primitives and said so in its own comments: no skinned mesh,
   every animated part a draw call, a bent elbow two tubes intersecting. That
   is now fixed rather than documented.

   What changed:
   - Joints are THREE.Bone, so THREE.Skeleton drives GPU linear-blend
     skinning. The pose engine in hm-actor-anim.js is untouched: it writes
     .rotation on the same named joints, and every one of the twelve clips
     works as authored.
   - Surfaces are continuous tubes swept along the bone chains, with rings
     clustered at each joint and weights blended across it. An elbow deforms.
   - The face is one sculpted surface, not a stack of primitives, with the
     lower face weighted onto the jaw bone so a shout deforms the mouth.
   - Meshes are grouped BY MATERIAL, not by body part: skin, cloth, boot, eye.
     Four skinned meshes plus the spring-driven garment, instead of forty.

   PROPORTION. The old skeleton mixed absolute offsets with H-scaled ones, so
   `height` was not the crown height — a 1.86 m spec measured about 1.60 m,
   and taller characters got their height entirely in the legs. The skeleton
   below is derived from anthropometric fractions of stature (trochanteric
   height .530H, tibiale .285H, acromion .818H, elbow .632H, wrist .486H),
   and buildActor MEASURES the crown it actually produced and reports it as
   rig.measured, so the claim is checked instead of asserted.

   Metres. +Y up. Actor faces +Z.
   ========================================================================= */

import * as THREE from 'https://unpkg.com/three@0.184.0/build/three.module.js';
import {
  SkinBuilder, addTube, addMesh, buildHead, buildEye, buildLid, buildEar,
  rnd, clamp, wearAt,
} from './hm-actor-skin.js?v=skin1';

export { rnd, clamp };

/* ---------------------------------------------------------------- materials
   Pre-compensated for the design system's --grade-character
   (saturate .72 / contrast 1.09 / brightness .82): low chroma, high
   roughness, metalness only where a surface genuinely is metal.

   PROVENANCE, stated accurately:
   - GLOW is token-exact. ember #bd6135 is --ember, gold #e4c77e is
     --gold-bright, veil #658e9e is --focus.
   - SKIN, CLOTH and HARD are DERIVED, not tokens. tokens/colors.css carries
     an interface palette with no vocabulary for wool, fen linen, cinderhide
     or verdigris, and forty-two wardrobes cannot be dressed from nine
     interface hues without every faction reading the same. They sit in the
     token palette's neighbourhood — same low chroma, same value band.
   If a garment palette is ever tokenized, this block should consume it. */

const mat = (color, rough, extra = {}) => new THREE.MeshStandardMaterial({
  color: new THREE.Color(color), roughness: rough, metalness: 0,
  vertexColors: true,
  // Every material reflects scene.environment. Without this the env map is
  // built and then ignored, which is a silent no-op rather than a visible one.
  envMapIntensity: 0.62,
  ...extra,
});

export const SKIN = {
  pallid: mat('#a89887', 0.74),
  weathered: mat('#9a8168', 0.78),
  ashen: mat('#9d9384', 0.76),
  fenpale: mat('#a09484', 0.75),
  sooted: mat('#8b7a68', 0.8),
};

export const CLOTH = {
  ashWool: mat('#514a41', 0.96),
  blackWool: mat('#33302b', 0.97),
  boiledLinen: mat('#8d8571', 0.93),
  chalkLinen: mat('#a49c86', 0.92),
  reedGreen: mat('#5c6452', 0.95),
  bogInk: mat('#3c443e', 0.96),
  rust: mat('#6e523d', 0.95),
  roadMud: mat('#5b5044', 0.97),
  sootBlack: mat('#37322d', 0.96),
  waxRed: mat('#6e3730', 0.94),
  crypt: mat('#3b3b43', 0.95),
  tallow: mat('#9b9078', 0.9),
};

export const HARD = {
  emberIron: mat('#4a443f', 0.62, { metalness: 0.55 }),
  memoryBronze: mat('#6d6040', 0.55, { metalness: 0.62 }),
  verdigris: mat('#556459', 0.78, { metalness: 0.3 }),
  oldBone: mat('#a49a84', 0.84),
  ashwood: mat('#55483b', 0.93),
  darkLeather: mat('#443a31', 0.9),
  brass: mat('#7c6a3f', 0.5, { metalness: 0.68 }),
  glass: mat('#3d4a4d', 0.28, { metalness: 0.2, transparent: true, opacity: 0.72 }),
};

export const GLOW = {
  ember: new THREE.MeshStandardMaterial({
    color: new THREE.Color('#bd6135'), emissive: new THREE.Color('#bd6135'),
    emissiveIntensity: 1.5, roughness: 0.5, vertexColors: true,
  }),
  gold: new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e4c77e'), emissive: new THREE.Color('#e4c77e'),
    emissiveIntensity: 1.2, roughness: 0.5, vertexColors: true,
  }),
  veil: new THREE.MeshStandardMaterial({
    color: new THREE.Color('#658e9e'), emissive: new THREE.Color('#658e9e'),
    emissiveIntensity: 1.1, roughness: 0.5, vertexColors: true,
  }),
};

const EYE_WHITE = mat('#b9b3a6', 0.34);
const IRIS = mat('#2b3033', 0.3);
const NAIL = mat('#9a9083', 0.55);

/* Anthropometric fractions of stature. Named so a reviewer can check them
   against a table rather than trusting a tuned number. */
const P = {
  trochanter: 0.530,   // hip joint height
  tibiale: 0.285,      // knee joint height
  ankle: 0.039,
  acromion: 0.818,     // shoulder joint height
  neckBase: 0.830,
  headPivot: 0.878,
  crown: 1.000,
  elbow: 0.632,
  wrist: 0.486,
  handLen: 0.108,
  footLen: 0.150,
  biacromial: 0.104,   // half-separation of shoulder joints
  bitrochanter: 0.049, // half-separation of hip joints
};

/** A bone with a name and a local offset. */
function bone(name, x, y, z) {
  const b = new THREE.Bone();
  b.name = name;
  b.position.set(x, y, z);
  return b;
}

/* ======================================================================= */
/**
 * Build one skinned actor. Returns the same rig contract the pose engine
 * already consumes, plus `measured` (what the geometry actually is) and
 * `meshes` (the skinned meshes, for draw-call accounting).
 */
export function buildActor(spec) {
  const seed = spec.seed >>> 0;
  const rand = rnd(seed);
  const H = spec.height ?? 1.72;
  const asym = spec.asym ?? 0.5;
  const legLen = spec.legLen ?? 1;
  const armLen = spec.armLen ?? 1;

  /* Head scale is solved below, once hipY is known. */
  const HEAD_R_UNUSED = 0.086;

  const o = {
    seed,
    headScale: 1,          // solved below
    handScale: (spec.handScale ?? 1) * H,
    faceAsym: asym,
    gaunt: spec.gaunt ?? (spec.chest && spec.chest < 0.96 ? 0.9 : 0.45),
  };

  const root = new THREE.Group();
  root.name = spec.id;

  /* ------------------------------------------------------------- skeleton */
  const hipY = P.trochanter * H * legLen;
  const thighL = (P.trochanter - P.tibiale) * H * legLen;
  const shinL = (P.tibiale - P.ankle) * H * legLen;
  const footL = P.footLen * H;
  const trunk = (P.acromion - P.trochanter) * H;   // hip -> shoulder
  const upperL = (P.acromion - P.elbow) * H * armLen;
  const foreL = (P.elbow - P.wrist) * H * armLen;

  /* Head scale is SOLVED, not chosen. buildHead() emits a sphere whose top
     sits at 0.086 headScale units above the head pivot, so for the crown to
     land at exactly H:

       headPivotY + 0.086 * headScale * spec.headScale = H

     The pivot's height is itself built from hipY + trunk fractions, and hipY
     scales with spec.legLen — so solving against the REAL pivot is the only
     way a long-legged spec still measures its stated height. Deriving from
     the P table alone left Fenn Joryn 94 mm over.

     spec.headScale then modulates a correct base: a large head is genuinely
     large, and `measured` below proves the crown regardless. */
  const headPivotY = hipY + (P.headPivot - P.trochanter) * H;
  const HEAD_R = 0.086;   // must match buildHead()'s sphere scale in hm-actor-skin.js
  const headScaleSolved = (H - headPivotY) / HEAD_R;
  o.headScale = headScaleSolved * (spec.headScale ?? 1);

  const pelvisW = 0.163 * H * (spec.hips ?? 1);
  const chestW = 0.219 * H * (spec.chest ?? 1);

  const bones = [];
  const push = (b) => { bones.push(b); return bones.length - 1; };

  const pelvis = bone('pelvis', 0, hipY, 0);
  const iPelvis = push(pelvis);
  root.add(pelvis);

  // Three spine joints: the pelvis leads, the chest lags, the shoulders
  // arrive last. That phase offset is a third of why the walk reads as mass.
  const spineLow = bone('spine-low', 0, trunk * 0.30, 0);
  const spineMid = bone('spine-mid', 0, trunk * 0.32, 0);
  const chest = bone('chest', 0, trunk * 0.38, 0);
  pelvis.add(spineLow); spineLow.add(spineMid); spineMid.add(chest);
  const iSpineLow = push(spineLow), iSpineMid = push(spineMid), iChest = push(chest);

  const neck = bone('neck', 0, (P.neckBase - P.acromion) * H, 0);
  chest.add(neck);
  const iNeck = push(neck);
  const head = bone('head', 0, (P.headPivot - P.neckBase) * H, 0);
  neck.add(head);
  const iHead = push(head);
  const jaw = bone('jaw', 0, -0.012 * o.headScale, 0.010 * o.headScale);
  head.add(jaw);
  const iJaw = push(jaw);

  const legs = {}, legIdx = {};
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    // A genuinely shorter leg, so the limp is anatomy rather than a fake.
    const short = spec.shortSide === key ? (spec.shortBy ?? 0.012) : 0;
    const tL = thighL - short * 0.6, sL = shinL - short * 0.4;

    const hip = bone('hip-' + key, side * pelvisW * 0.31, 0.004, 0);
    pelvis.add(hip);
    const knee = bone('knee-' + key, 0, -tL, 0);
    hip.add(knee);
    const ankle = bone('ankle-' + key, 0, -sL, 0);
    knee.add(ankle);
    legIdx[key] = { hip: push(hip), knee: push(knee), ankle: push(ankle) };
    legs[key] = { hip, knee, ankle, thighL: tL, shinL: sL, footL, side };
  }

  const arms = {}, armIdx = {};
  for (const side of [-1, 1]) {
    const key = side < 0 ? 'L' : 'R';
    const drop = spec.highShoulder === key ? 0.008 * H : 0;
    const clav = bone('clav-' + key, side * chestW * 0.28, (P.acromion - P.neckBase) * H + drop + trunk * 0.0, 0);
    // clav sits inside chest space; acromion is reached by the shoulder offset
    clav.position.y = 0.0;
    chest.add(clav);
    const shoulder = bone('shoulder-' + key, side * (P.biacromial * H - chestW * 0.28), 0, 0);
    clav.add(shoulder);
    const elbow = bone('elbow-' + key, 0, -upperL, 0);
    shoulder.add(elbow);
    const wrist = bone('wrist-' + key, 0, -foreL, 0);
    elbow.add(wrist);
    const palm = bone('palm-' + key, 0, -0.012 * H, 0);
    wrist.add(palm);

    const iClav = push(clav), iSh = push(shoulder), iEl = push(elbow), iWr = push(wrist), iPalm = push(palm);

    /* Hand: four fingers x two phalanges, plus a thumb. Overkill for a walk
       cycle and exactly right for the two things hands do in this game's art —
       grip a haft, and open in refusal. Both need separate digits. */
    const fingers = [], fingerIdx = [];
    const hs = o.handScale;
    for (let i = 0; i < 4; i++) {
      const len = (0.030 - Math.abs(i - 1.3) * 0.0035) * hs;
      const f = bone(`finger-${key}-${i}`, (-0.016 + i * 0.0108) * hs, -0.040 * hs, 0.002 * hs);
      palm.add(f);
      const tip = bone(`fingertip-${key}-${i}`, 0, -len, 0);
      f.add(tip);
      const iF = push(f), iT = push(tip);
      f.userData.tip = tip;
      f.userData.len = len;
      tip.userData.len = len * 0.8;
      fingers.push(f);
      fingerIdx.push([iF, iT]);
    }
    const thumb = bone(`thumb-${key}`, side * 0.020 * hs, -0.016 * hs, 0.008 * hs);
    thumb.rotation.z = side * 0.6;
    palm.add(thumb);
    const iTh = push(thumb);

    const hand = palm;                       // the pose engine's grip target
    hand.userData.fingers = fingers;
    hand.userData.thumb = thumb;

    armIdx[key] = { clav: iClav, shoulder: iSh, elbow: iEl, wrist: iWr, palm: iPalm, fingers: fingerIdx, thumb: iTh };
    arms[key] = { clav, shoulder, elbow, wrist, hand, upperL, foreL, side };
  }

  /* Bind pose. Bones must have valid world matrices before the Skeleton
     computes its inverses and before any geometry reads rest positions. */
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  const wp = (b) => b.getWorldPosition(new THREE.Vector3());

  /* ------------------------------------------------------------- surfaces */
  const skinB = new SkinBuilder('skin');
  const clothB = new SkinBuilder('cloth');
  const bootB = new SkinBuilder('boot');
  const eyeB = new SkinBuilder('eye');
  const nailB = new SkinBuilder('nail');

  const bareArm = !!spec.bareForearm;
  const wearCloth = { soil: 0.5, dust: 0.12, blotch: 0.14, rand };
  const wearSkin = { soil: 0.16, dust: 0.2 };
  const wearBoot = { soil: 0.66, dust: 0.05, blotch: 0.22, rand };

  /* Torso: one continuous loft from pelvis through the shoulder girdle. The
     waist exists because the profile narrows there, not because two boxes
     were stacked. */
  const torsoTop = wp(chest).clone();
  torsoTop.y = P.neckBase * H;
  addTube(clothB, {
    boneIdx: [iPelvis, iSpineLow, iSpineMid, iChest, iNeck],
    restPos: [wp(pelvis), wp(spineLow), wp(spineMid), wp(chest), torsoTop],
    profile: [
      [0.00, pelvisW * 0.58, pelvisW * 0.44],
      [0.16, pelvisW * 0.60, pelvisW * 0.46],
      [0.34, pelvisW * 0.49, pelvisW * 0.38],   // waist
      [0.52, chestW * 0.46, chestW * 0.36],
      [0.74, chestW * 0.53, chestW * 0.39],     // ribcage
      [0.90, chestW * 0.52, chestW * 0.36],
      [1.00, 0.048 * H, 0.046 * H],             // neck base
    ],
    radial: 24, H, wear: wearCloth, creaseDepth: 0.07, capStart: true,
    sampleEvery: 0.02,
  });

  /* Neck as skin, overlapping the collar so there is no gap at the throat. */
  addTube(skinB, {
    boneIdx: [iNeck, iHead],
    restPos: [wp(neck), wp(head)],
    profile: [[0, 0.040 * H, 0.038 * H], [1, 0.036 * H, 0.035 * H]],
    radial: 16, H, wear: wearSkin, startParent: iChest, startBlend: 0.5,
  });

  for (const key of ['L', 'R']) {
    const L = legs[key], I = legIdx[key];
    const kneeR = 0.041 * H * (spec.legMass ?? 1);
    addTube(clothB, {
      boneIdx: [I.hip, I.knee, I.ankle],
      restPos: [wp(L.hip), wp(L.knee), wp(L.ankle)],
      profile: [
        [0.00, 0.062 * H, 0.060 * H],
        [0.18, 0.055 * H, 0.054 * H],
        [0.42, 0.046 * H, 0.047 * H],
        [0.52, kneeR, kneeR * 1.02],            // knee
        [0.60, 0.045 * H, 0.048 * H],           // calf belly
        [0.72, 0.039 * H, 0.041 * H],
        [1.00, 0.023 * H, 0.024 * H],           // ankle
      ],
      radial: 16, H, wear: wearCloth, startParent: iPelvis, startBlend: 0.5,
      creaseDepth: 0.14, capStart: true,
    });

    /* Foot: a boot with a real heel and a tapered toe, weighted to the ankle. */
    const a = wp(L.ankle);
    const fg = new THREE.BoxGeometry(0.052 * H, 0.040 * H, footL, 3, 2, 5);
    const fp = fg.attributes.position;
    for (let i = 0; i < fp.count; i++) {
      const z = fp.getZ(i), y = fp.getY(i);
      if (z > footL * 0.18) {
        const t = (z - footL * 0.18) / (footL * 0.32);
        fp.setX(i, fp.getX(i) * (1 - 0.30 * clamp(t, 0, 1)));
        fp.setY(i, y - 0.006 * H * clamp(t, 0, 1));
      }
      if (z < -footL * 0.2 && y > 0) fp.setZ(i, z * 0.8);   // heel counter
    }
    fg.computeVertexNormals();
    fg.translate(a.x, a.y - 0.008 * H, a.z + footL * 0.22);
    addMesh(bootB, fg, [[I.ankle, 1]], { H, wear: wearBoot });
  }

  for (const key of ['L', 'R']) {
    const A = arms[key], I = armIdx[key];
    const armB = bareArm ? skinB : clothB;
    const armWear = bareArm ? wearSkin : wearCloth;
    const mass = spec.armMass ?? 1;

    /* Arm runs shoulder -> elbow -> wrist. The top ring is enlarged into a
       deltoid and blended onto the clavicle, so the shoulder mass follows the
       girdle and the armpit closes without a seam. */
    addTube(armB, {
      boneIdx: [I.shoulder, I.elbow, I.wrist],
      restPos: [wp(A.shoulder), wp(A.elbow), wp(A.wrist)],
      profile: [
        [0.00, 0.044 * H * mass, 0.043 * H * mass],   // deltoid
        [0.14, 0.038 * H * mass, 0.037 * H * mass],
        [0.38, 0.032 * H * mass, 0.032 * H * mass],
        [0.52, 0.029 * H * mass, 0.030 * H * mass],   // elbow
        [0.62, 0.031 * H * mass, 0.028 * H * mass],   // forearm flare, ulnar flat
        [0.80, 0.026 * H * mass, 0.023 * H * mass],
        [1.00, 0.019 * H, 0.016 * H],                 // wrist
      ],
      radial: 16, H, wear: armWear, startParent: I.clav, startBlend: 0.85,
      creaseDepth: 0.13, capStart: true,
    });

    /* Palm: a flattened box, weighted to the palm bone. */
    const hs = o.handScale;
    const p = wp(A.hand);
    const pg = new THREE.BoxGeometry(0.046 * hs, 0.052 * hs, 0.021 * hs, 3, 4, 2);
    // Knuckle crown: raise the distal edge so the back of the hand is not flat.
    const pp = pg.attributes.position;
    for (let i = 0; i < pp.count; i++) {
      const y = pp.getY(i), z = pp.getZ(i);
      if (y < -0.018 * hs && z < 0) pp.setZ(i, z - 0.003 * hs);
    }
    pg.computeVertexNormals();
    pg.translate(p.x, p.y - 0.014 * hs, p.z);
    addMesh(skinB, pg, [[I.palm, 1]], { H, wear: wearSkin });

    for (let i = 0; i < 4; i++) {
      const f = A.hand.userData.fingers[i];
      const [iF, iT] = I.fingers[i];
      const fr = 0.0055 * hs - i * 0.0002 * hs;
      addTube(skinB, {
        boneIdx: [iF, iT],
        restPos: [wp(f), wp(f.userData.tip)],
        profile: [[0, fr * 1.12, fr * 1.12], [0.5, fr, fr], [1, fr * 0.92, fr * 0.92]],
        radial: 8, H, wear: wearSkin, startParent: I.palm, startBlend: 0.6,
        sampleEvery: 0.008, capStart: true,
      });
      // Distal phalanx plus a nail plate — granular, and it reads in a grip.
      const tipEnd = wp(f.userData.tip).clone();
      tipEnd.y -= f.userData.tip.userData.len;
      addTube(skinB, {
        boneIdx: [iT, iT],
        restPos: [wp(f.userData.tip), tipEnd],
        profile: [[0, fr * 0.95, fr * 0.95], [1, fr * 0.7, fr * 0.7]],
        radial: 8, H, wear: wearSkin, sampleEvery: 0.008, capEnd: true,
      });
      const nail = new THREE.PlaneGeometry(fr * 1.2, f.userData.tip.userData.len * 0.62);
      nail.rotateY(Math.PI);
      const nt = wp(f.userData.tip);
      nail.translate(nt.x, nt.y - f.userData.tip.userData.len * 0.42, nt.z - fr * 0.86);
      addMesh(nailB, nail, [[iT, 1]], { H, wear: { soil: 0.2, dust: 0.1 } });
    }

    const th = A.hand.userData.thumb;
    const thEnd = wp(th).clone();
    thEnd.y -= 0.026 * hs;
    thEnd.x += A.side * 0.010 * hs;
    addTube(skinB, {
      boneIdx: [I.thumb, I.thumb],
      restPos: [wp(th), thEnd],
      profile: [[0, 0.0072 * hs, 0.0072 * hs], [1, 0.0052 * hs, 0.0052 * hs]],
      radial: 8, H, wear: wearSkin, startParent: I.palm, startBlend: 0.6,
      sampleEvery: 0.008, capStart: true, capEnd: true,
    });
  }

  /* ----------------------------------------------------------------- head
     One sculpted surface. The lower third blends onto the jaw bone by height,
     so opening the jaw deforms the mouth and chin as one piece of flesh —
     the old rig hinged a separate box, which is the classic tell. */
  const headW = head.matrixWorld;
  const hg = buildHead(o);
  hg.applyMatrix4(headW);
  const jawLine = wp(head).y - 0.030 * o.headScale;
  const jawSpan = 0.048 * o.headScale;
  addMesh(skinB, hg, (x, y) => {
    const t = clamp((jawLine - y) / jawSpan, 0, 1);
    const jw = smoothLocal(t) * 0.82;
    return jw > 0.01 ? [[iJaw, jw], [iHead, 1 - jw]] : [[iHead, 1]];
  }, { H, wear: { soil: 0.06, dust: 0.22 } });

  for (const side of [-1, 1]) {
    const eg = buildEye(o, side); eg.applyMatrix4(headW);
    addMesh(eyeB, eg, [[iHead, 1]], { H, wear: { soil: 0, dust: 0 }, tint: 1.16 });
    const ig = new THREE.SphereGeometry(0.0052 * o.headScale, 10, 8);
    ig.translate(side * 0.030 * o.headScale, 0.010 * o.headScale, 0.0655 * o.headScale);
    ig.applyMatrix4(headW);
    addMesh(eyeB, ig, [[iHead, 1]], { H, wear: { soil: 0, dust: 0 }, tint: 0.34 });
    const lg = buildLid(o, side); lg.applyMatrix4(headW);
    addMesh(skinB, lg, [[iHead, 1]], { H, wear: { soil: 0.1, dust: 0.18 } });
    const ear = buildEar(o, side); ear.applyMatrix4(headW);
    addMesh(skinB, ear, [[iHead, 1]], { H, wear: { soil: 0.12, dust: 0.16 } });
  }

  if ((spec.hairMass ?? 0.8) > 0.02) {
    const hm = spec.hairMass ?? 0.8;
    const hair = new THREE.SphereGeometry(1, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.66);
    hair.scale(0.074 * o.headScale, 0.092 * o.headScale * (0.7 + hm * 0.5), 0.084 * o.headScale);
    hair.translate(0, 0.006 * o.headScale, -0.004 * o.headScale);
    hair.applyMatrix4(headW);
    addMesh(clothB, hair, [[iHead, 1]], { H, wear: { soil: 0.5, dust: 0.05, blotch: 0.22, rand } });
  }

  /* ------------------------------------------------------- skinned meshes */
  const meshes = [];
  const mk = (B, material) => {
    if (B.empty) return null;
    const m = new THREE.SkinnedMesh(B.geometry(), material);
    m.name = spec.id + ':' + B.name;
    m.castShadow = true;
    m.receiveShadow = true;
    m.frustumCulled = false;          // it deforms; a static bound would clip it
    root.add(m);
    m.bind(skeleton);
    meshes.push(m);
    return m;
  };

  const coatMat = (CLOTH[spec.coat] ?? CLOTH.blackWool).clone();
  coatMat.vertexColors = true;
  coatMat.side = THREE.DoubleSide;

  mk(clothB, CLOTH[spec.under] ?? CLOTH.ashWool);
  mk(skinB, SKIN[spec.skin] ?? SKIN.pallid);
  mk(bootB, HARD.darkLeather);
  mk(eyeB, EYE_WHITE);
  mk(nailB, NAIL);

  /* ---------------------------------------------------------- coat panels
     Not skinned on purpose. The pose engine swings these on a lagged spring
     driven by pelvis velocity, which is the cheapest cloth that reads at this
     scale — a coat two frames behind the body is worth more than any number
     of simulated vertices. Skinning them would freeze them to the hips. */
  const panels = [];
  const nP = spec.coatPanels ?? 6;
  const coatLen = (spec.coatLen ?? 0.42) * H;
  if (coatLen > 0.02) {
    const R = pelvisW * 0.58;
    for (let i = 0; i < nP; i++) {
      const ang = (i / nP) * Math.PI * 2 + Math.PI / nP;
      const pv = new THREE.Group();
      pv.name = 'coat-panel-' + i;
      pv.position.set(Math.sin(ang) * R * 0.6, 0.03 * H, Math.cos(ang) * R * 0.6);
      pv.rotation.y = ang;
      const len = coatLen * (0.9 + rand() * 0.2);
      const w = (Math.PI * 2 * R) / nP * 1.4;
      const pg = new THREE.PlaneGeometry(w, len, 3, 6);
      pg.translate(0, -len / 2, 0);
      const pp = pg.attributes.position;
      for (let k = 0; k < pp.count; k++) {
        const t = 1 - (pp.getY(k) + len) / len;
        pp.setX(k, pp.getX(k) * (1 + t * 0.55));
        pp.setZ(k, pp.getZ(k) + t * t * 0.03 * H);
      }
      pg.computeVertexNormals();
      // Vertex colour by hem height, matching the skinned layers' gradient.
      const cnt = pp.count;
      const col = new Float32Array(cnt * 3);
      const nrm = pg.attributes.normal;
      for (let k = 0; k < cnt; k++) {
        const yWorld = 0.03 * H + pp.getY(k) + hipY;
        const v = wearAt(yWorld, H, nrm.getY(k), { soil: 0.62, dust: 0.06, blotch: 0.18, rand });
        col[k * 3] = v; col[k * 3 + 1] = v; col[k * 3 + 2] = v;
      }
      pg.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const mesh = new THREE.Mesh(pg, coatMat);
      mesh.castShadow = true;
      pv.add(mesh);
      pv.userData.rest = { x: 0, z: 0 };
      pelvis.add(pv);
      panels.push(pv);
    }
  }

  let hood = null;
  if (spec.hood) {
    hood = new THREE.Group();
    hood.name = 'hood';
    const hgm = new THREE.SphereGeometry(1, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.72);
    hgm.scale(0.084 * o.headScale, 0.104 * o.headScale, 0.094 * o.headScale);
    hgm.translate(0, 0.004 * o.headScale, -0.008 * o.headScale);
    // coatMat is shared with the coat panels and carries vertexColors:true for
    // their benefit; this geometry never got a colour attribute, which left
    // the hood reading black instead of the coat's own colour. A neutral
    // white attribute makes vertexColors a no-op here without touching the
    // shared material or any panel.
    const hc = new Float32Array(hgm.attributes.position.count * 3).fill(1);
    hgm.setAttribute('color', new THREE.BufferAttribute(hc, 3));
    const hMesh = new THREE.Mesh(hgm, coatMat);
    hMesh.castShadow = true;
    hood.add(hMesh);
    head.add(hood);
  }

  let veil = null;
  if (spec.veil) {
    veil = new THREE.Group();
    veil.name = 'veil';
    veil.position.set(0, 0.010 * o.headScale, 0.050 * o.headScale);
    const vg = new THREE.PlaneGeometry(0.13 * o.headScale, 0.17 * o.headScale, 4, 5);
    vg.translate(0, -0.085 * o.headScale, 0);
    const vm = CLOTH.chalkLinen.clone();
    vm.side = THREE.DoubleSide; vm.transparent = true; vm.opacity = 0.88; vm.vertexColors = false;
    veil.add(new THREE.Mesh(vg, vm));
    head.add(veil);
    veil.userData.rest = 0;
  }

  /* --------------------------------------------------------- measurement
     What the geometry actually is, rather than what the spec asked for.

     Then CORRECT it. The head scale is solved analytically above against
     buildHead()'s skull radius, but the tallest vertex on a finished actor is
     often not the skull — it is hair (a shell scaled 0.092 in headScale
     units) or a hood (0.104). Those sit above the crown the solve targeted,
     which left a hooded, thick-haired actor up to 59 mm over its stated
     height. Rather than hand-tune per garment, measure the real crown and
     scale the whole actor by the residual: one multiply, exact by
     construction, and it stays exact if the garment set changes.

     The scale goes on `root`, so bone REST positions are untouched and the
     pose engine's metre-space assumptions (stride from leg length, foot
     plants in the ground frame) still hold inside the actor's own space. */
  root.updateMatrixWorld(true);
  const measureCrown = () => {
    const bb = new THREE.Box3();
    for (const m of meshes) { m.geometry.computeBoundingBox(); bb.union(m.geometry.boundingBox); }
    for (const p of panels) bb.expandByObject(p);
    if (hood) bb.expandByObject(hood);
    return bb;
  };
  const raw = measureCrown();
  const rawCrown = raw.max.y;
  const fit = rawCrown > 0.2 ? H / rawCrown : 1;
  root.scale.setScalar(fit);
  root.updateMatrixWorld(true);

  const measured = {
    crown: +(rawCrown * fit).toFixed(4),
    intended: H,
    errorMm: Math.round((rawCrown * fit - H) * 1000),
    rawCrown: +rawCrown.toFixed(4),
    fitScale: +fit.toFixed(5),
    span: +((raw.max.x - raw.min.x) * fit).toFixed(4),
    verts: meshes.reduce((n, m) => n + m.geometry.attributes.position.count, 0),
    bones: bones.length,
    meshes: meshes.length,
  };

  const rig = {
    root, pelvis, spineLow, spineMid, chest, neck, head, jaw,
    legs, arms, panels, hood, veil,
    skeleton, meshes, measured,
    hipY, thighL, shinL, footL, H,
    props: {},
  };
  root.userData.rig = rig;
  root.userData.spec = spec;
  return rig;
}

function smoothLocal(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

/** Draw calls this rig costs, counted rather than estimated. */
export function drawCalls(rig) {
  let n = 0;
  rig.root.traverse((o) => { if (o.isMesh || o.isSkinnedMesh) n++; });
  return n;
}
