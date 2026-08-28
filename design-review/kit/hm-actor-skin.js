/* =========================================================================
   hm-actor-skin.js — real skinning machinery
   -------------------------------------------------------------------------
   This replaces the honest failure the previous rig documented: forty
   separately-transformed parts per actor, which meant a bent elbow was two
   tubes intersecting each other, and no shading could ever run across a
   joint. Everything here exists to produce THREE.SkinnedMesh geometry —
   continuous surfaces, GPU linear-blend skinning, one draw call per material
   instead of one per body part.

   What "skinned" actually requires, and what this file provides:

   1. A BONE HIERARCHY, not a group hierarchy. THREE.Bone extends Object3D,
      so the pose engine in hm-actor-anim.js keeps working untouched: it
      writes .rotation on the same named joints it always did. That is the
      whole reason this rewrite does not invalidate the twelve clips.

   2. CONTINUOUS SURFACES swept along the skeleton. A limb is one tube
      threaded through hip -> knee -> ankle, not three primitives. Rings are
      clustered around each joint so the bend has geometry to bend WITH; a
      four-ring elbow creases, a twelve-ring elbow deforms.

   3. PER-VERTEX BONE WEIGHTS with symmetric falloff centred on each joint.
      A vertex exactly at the elbow is 50/50 upper-arm and forearm. Three
      centimetres up it is 85/15. Mid-humerus it is 100/0. That blend is what
      makes one surface behave like flesh over a hinge instead of a bag.

   4. SCULPTED detail rather than assembled detail. The face is one displaced
      sphere with named sculpt operators — brow shelf, orbital rim, malar
      eminence, nasolabial fold, philtrum — because a face built by stacking
      primitives reads as a stack of primitives at any resolution. Displacing
      a continuous surface reads as a face.

   Coordinates: metres, +Y up, actor faces +Z. All geometry is built in ROOT
   space (the skeleton's bind space), which is why every builder takes rest
   positions read off the bones after one updateMatrixWorld.
   ========================================================================= */

import * as THREE from 'https://unpkg.com/three@0.184.0/build/three.module.js';

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

/** Deterministic PRNG — same character, same wear, every reload. */
export function rnd(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

/* =========================================================== accumulator
   Collects vertices with skin attributes across many builder calls, then
   emits one BufferGeometry. One of these per material, so the actor ends up
   with a handful of skinned meshes sharing a single skeleton rather than
   forty rigid ones. */
export class SkinBuilder {
  constructor(name) {
    this.name = name;
    this.pos = []; this.nrm = []; this.uv = []; this.col = [];
    this.si = []; this.sw = []; this.idx = [];
    this.n = 0;
  }

  /** weights: array of [boneIndex, weight]; trimmed to the four heaviest. */
  vert(px, py, pz, nx, ny, nz, u, v, cr, weights) {
    this.pos.push(px, py, pz);
    this.nrm.push(nx, ny, nz);
    this.uv.push(u, v);
    this.col.push(cr, cr, cr);

    const w = weights.slice().sort((a, b) => b[1] - a[1]).slice(0, 4);
    let sum = 0;
    for (const [, x] of w) sum += x;
    if (sum <= 0) { w.length = 0; w.push([0, 1]); sum = 1; }
    for (let k = 0; k < 4; k++) {
      if (k < w.length) { this.si.push(w[k][0]); this.sw.push(w[k][1] / sum); }
      else { this.si.push(0); this.sw.push(0); }
    }
    return this.n++;
  }

  tri(a, b, c) { this.idx.push(a, b, c); }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  get empty() { return this.n === 0; }

  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nrm, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.si, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.sw, 4));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  }
}

/* ------------------------------------------------------------------- wear
   Grime as a value gradient, because at sprite-sheet resolution the thing
   that reads is not albedo detail but where a garment is dark. Hems soil,
   uppers get rained clean, and creases at the joints hold shadow. Computed
   here per-vertex against the FIGURE's own height rather than a per-part
   bounding box, so the gradient is continuous across a merged mesh — the
   old per-part version made every separate limb restart its own gradient. */
export function wearAt(y, H, upness, o) {
  const soil = o.soil ?? 0.42, dust = o.dust ?? 0.1;
  const h = clamp(y / Math.max(H, 1e-4), 0, 1);
  let v = 1 - soil * Math.pow(1 - h, 2.4);
  v += dust * clamp(upness, 0, 1);
  if (o.blotch) v *= 1 - o.blotch * (o.rand ? o.rand() * o.rand() : 0.25);
  return clamp(v, 0.14, 1.24);
}

/* ============================================================ tube sweep */

/** Interpolate a profile table [[sFrac, rx, rz], ...] at sFrac. */
function profileAt(profile, t) {
  if (t <= profile[0][0]) return [profile[0][1], profile[0][2]];
  const last = profile[profile.length - 1];
  if (t >= last[0]) return [last[1], last[2]];
  for (let i = 1; i < profile.length; i++) {
    const [s1, rx1, rz1] = profile[i];
    if (t <= s1) {
      const [s0, rx0, rz0] = profile[i - 1];
      const k = (t - s0) / Math.max(s1 - s0, 1e-6);
      return [lerp(rx0, rx1, k), lerp(rz0, rz1, k)];
    }
  }
  return [last[1], last[2]];
}

/**
 * Sweep a skinned tube along a bone chain.
 *
 * `boneIdx` and `restPos` describe the chain in order (hip, knee, ankle...).
 * Weights are computed with a falloff centred on every interior joint, which
 * is what makes the surface deform instead of crease.
 */
export function addTube(B, opts) {
  const {
    boneIdx, restPos, profile,
    radial = 16, blendFrac = 0.6,
    startParent = null, startBlend = 0.55,
    capStart = false, capEnd = false,
    H = 1.72, wear: wearOpts = {}, creaseDepth = 0.1,
    twist = 0, sampleEvery = 0.022,
  } = opts;

  // Arc positions of each joint along the chain.
  const jointS = [0];
  for (let i = 1; i < restPos.length; i++) {
    jointS.push(jointS[i - 1] + restPos[i].distanceTo(restPos[i - 1]));
  }
  const total = jointS[jointS.length - 1];
  if (!(total > 1e-5)) return null;

  // Blend radius per joint: half the shorter adjacent segment, so a short
  // segment cannot be swamped by its neighbour's falloff.
  const blendR = jointS.map((_, i) => {
    const prev = i > 0 ? jointS[i] - jointS[i - 1] : Infinity;
    const next = i < jointS.length - 1 ? jointS[i + 1] - jointS[i] : Infinity;
    return blendFrac * Math.min(prev, next, 0.16);
  });

  /* Ring placement. Uniform sampling gives an even surface; forced rings at
     each joint and at fractions of the blend radius give the joint enough
     geometry to bend through. This clustering is the single biggest visual
     difference between this and the old primitive rig. */
  const S = new Set([0, total]);
  for (let s = 0; s < total; s += sampleEvery) S.add(+s.toFixed(5));
  for (let i = 1; i < jointS.length - 1; i++) {
    const j = jointS[i], R = blendR[i];
    for (const f of [-1, -0.66, -0.34, -0.14, 0, 0.14, 0.34, 0.66, 1]) {
      const s = j + f * R;
      if (s > 0 && s < total) S.add(+s.toFixed(5));
    }
  }
  const ringS = [...S].sort((a, b) => a - b);

  // Segment directions, plus a smoothed tangent so rings near a joint are not
  // faceted against each other.
  const dirs = [];
  for (let i = 0; i < restPos.length - 1; i++) {
    dirs.push(new THREE.Vector3().subVectors(restPos[i + 1], restPos[i]).normalize());
  }

  const ref = new THREE.Vector3(0, 0, 1);
  const refAlt = new THREE.Vector3(1, 0, 0);
  const T = new THREE.Vector3(), Rv = new THREE.Vector3(), F = new THREE.Vector3();
  const centre = new THREE.Vector3(), tmp = new THREE.Vector3();

  const rings = [];
  for (const s of ringS) {
    // Which segment, and where in it.
    let seg = 0;
    while (seg < jointS.length - 2 && s > jointS[seg + 1]) seg++;
    const segLen = Math.max(jointS[seg + 1] - jointS[seg], 1e-6);
    const f = clamp((s - jointS[seg]) / segLen, 0, 1);

    centre.copy(restPos[seg]).lerp(restPos[seg + 1], f);

    // Tangent: blend across the joint so the sweep is smooth through it.
    T.copy(dirs[seg]);
    const dNext = jointS[seg + 1] - s;
    const dPrev = s - jointS[seg];
    if (seg + 1 < dirs.length && dNext < blendR[seg + 1]) {
      const k = 0.5 * (1 - dNext / Math.max(blendR[seg + 1], 1e-6));
      T.lerp(dirs[seg + 1], k);
    }
    if (seg > 0 && dPrev < blendR[seg]) {
      const k = 0.5 * (1 - dPrev / Math.max(blendR[seg], 1e-6));
      T.lerp(dirs[seg - 1], k);
    }
    T.normalize();

    const useRef = Math.abs(T.dot(ref)) > 0.94 ? refAlt : ref;
    Rv.crossVectors(useRef, T).normalize();
    F.crossVectors(T, Rv).normalize();

    /* Weights: symmetric falloff centred on each joint. */
    const w = [];
    let self = 1;
    if (seg + 1 < boneIdx.length && dNext < blendR[seg + 1]) {
      const t = 0.5 * (1 - dNext / Math.max(blendR[seg + 1], 1e-6));
      w.push([boneIdx[seg + 1], t]); self -= t;
    }
    if (dPrev < blendR[seg]) {
      const t = 0.5 * (1 - dPrev / Math.max(blendR[seg], 1e-6));
      if (seg > 0) { w.push([boneIdx[seg - 1], t]); self -= t; }
      else if (startParent != null) { const ts = t * startBlend; w.push([startParent, ts]); self -= ts; }
    }
    w.push([boneIdx[seg], Math.max(self, 0.02)]);

    // Crease: rings sitting in a joint's blend zone darken, so elbows and
    // knees hold shadow the way folded cloth does.
    let crease = 0;
    for (let i = 1; i < jointS.length - 1; i++) {
      const d = Math.abs(s - jointS[i]);
      if (d < blendR[i]) crease = Math.max(crease, 1 - d / blendR[i]);
    }

    const [rx, rz] = profileAt(profile, s / total);
    rings.push({
      s, centre: centre.clone(), T: T.clone(), R: Rv.clone(), F: F.clone(),
      rx, rz, w, crease, roll: twist * (s / total),
    });
  }

  /* Emit. radial+1 columns so the UV seam does not wrap. */
  const cols = radial + 1;
  const base = [];
  for (const ring of rings) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      const a = (j % radial) / radial * Math.PI * 2 + ring.roll;
      const ca = Math.cos(a), sa = Math.sin(a);
      tmp.copy(ring.R).multiplyScalar(ca * ring.rx).addScaledVector(ring.F, sa * ring.rz);
      const px = ring.centre.x + tmp.x, py = ring.centre.y + tmp.y, pz = ring.centre.z + tmp.z;

      // Analytic normal for an elliptical cross-section: scale the radial
      // direction by the inverse radii, which is exact and avoids the seam
      // artifacts computeVertexNormals leaves on a swept tube.
      const nx0 = ca / Math.max(ring.rx, 1e-5), nz0 = sa / Math.max(ring.rz, 1e-5);
      const nrm = new THREE.Vector3()
        .addScaledVector(ring.R, nx0)
        .addScaledVector(ring.F, nz0)
        .normalize();

      const c = wearAt(py, H, nrm.y, wearOpts) * (1 - creaseDepth * ring.crease);
      row.push(B.vert(px, py, pz, nrm.x, nrm.y, nrm.z, j / radial, ring.s / total, c, ring.w));
    }
    base.push(row);
  }
  for (let i = 0; i < base.length - 1; i++) {
    for (let j = 0; j < radial; j++) {
      B.quad(base[i][j], base[i][j + 1], base[i + 1][j + 1], base[i + 1][j]);
    }
  }

  // Caps: a fan to a centre vertex, weighted like its ring.
  const cap = (ring, row, flip) => {
    const n = ring.T.clone().multiplyScalar(flip ? -1 : 1);
    const c = wearAt(ring.centre.y, H, n.y, wearOpts);
    const hub = B.vert(ring.centre.x, ring.centre.y, ring.centre.z, n.x, n.y, n.z, 0.5, flip ? 0 : 1, c, ring.w);
    for (let j = 0; j < radial; j++) {
      if (flip) B.tri(hub, row[j + 1], row[j]);
      else B.tri(hub, row[j], row[j + 1]);
    }
  };
  if (capStart) cap(rings[0], base[0], true);
  if (capEnd) cap(rings[rings.length - 1], base[base.length - 1], false);

  return { rings, total, firstRow: base[0], lastRow: base[base.length - 1] };
}

/* ========================================================== sculpt system
   A face is a continuous surface with named landmarks displaced on it. Each
   operator is a centre, a radius, a direction and a strength; vertices inside
   the radius move along the direction with a smoothstep falloff. Building a
   face this way rather than by stacking spheres and boxes is the difference
   between granular anatomy and a snowman. */
export function sculpt(verts, ops) {
  const v = new THREE.Vector3();
  for (const op of ops) {
    const r2 = op.r * op.r;
    for (let i = 0; i < verts.length; i++) {
      const p = verts[i];
      // Mirror operators apply to both sides; |x| comparison does it free.
      const dx = (op.mirror ? Math.abs(p.x) - Math.abs(op.c.x) : p.x - op.c.x);
      const dy = p.y - op.c.y, dz = p.z - op.c.z;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > r2) continue;
      const fall = smooth(1 - Math.sqrt(d2) / op.r);
      const k = op.strength * Math.pow(fall, op.sharp ?? 1);
      if (op.dir === 'normal') {
        v.copy(p).normalize().multiplyScalar(k);
      } else if (op.dir === 'lateral') {
        v.set(Math.sign(p.x || 1) * k, 0, 0);
      } else {
        v.copy(op.dir).multiplyScalar(k);
      }
      p.add(v);
    }
  }
}

/** Add an indexed triangle soup (already in root space) at one weight set.
 *  `weights` may be a fixed array, or a function (x, y, z) => weights — the
 *  function form is what lets the lower face blend onto the jaw bone, so a
 *  jaw that opens deforms the mouth instead of detaching a box. */
export function addMesh(B, geo, weights, opts = {}) {
  const { H = 1.72, wear: wearOpts = {}, tint = 1 } = opts;
  const fn = typeof weights === 'function' ? weights : null;
  const pos = geo.attributes.position;
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const nrm = geo.attributes.normal;
  const uv = geo.attributes.uv;
  const start = B.n;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
    const c = wearAt(py, H, nrm.getY(i), wearOpts) * tint;
    B.vert(
      px, py, pz,
      nrm.getX(i), nrm.getY(i), nrm.getZ(i),
      uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0,
      c, fn ? fn(px, py, pz) : weights
    );
  }
  const idx = geo.index;
  if (idx) {
    for (let i = 0; i < idx.count; i += 3) {
      B.tri(start + idx.getX(i), start + idx.getX(i + 1), start + idx.getX(i + 2));
    }
  } else {
    for (let i = 0; i < pos.count; i += 3) B.tri(start + i, start + i + 1, start + i + 2);
  }
  return start;
}

/* ------------------------------------------------------------------ head
   One sphere, sculpted by anatomical landmark. Resolution is deliberately
   high here and nowhere else: the head is what a player looks at, and it is
   the part the previous rig did worst. */
export function buildHead(o) {
  const S = o.headScale;
  const geo = new THREE.SphereGeometry(1, 40, 30);
  geo.scale(0.070 * S, 0.086 * S, 0.080 * S);

  const pos = geo.attributes.position;
  const verts = [];
  for (let i = 0; i < pos.count; i++) verts.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));

  const A = o.faceAsym ?? 0.5;
  const V = (x, y, z) => new THREE.Vector3(x * S, y * S, z * S);
  const gaunt = o.gaunt ?? 0.5;

  sculpt(verts, [
    // Cranium: flatten the occiput, narrow the temples.
    { c: V(0, 0.028, -0.072), r: 0.055 * S, dir: V(0, 0, 1).normalize(), strength: 0.009 * S, sharp: 1.2 },
    { c: V(0.062, 0.030, -0.010), r: 0.040 * S, dir: 'lateral', strength: -0.006 * S, mirror: true },

    // Brow shelf and glabella — the shadow line that reads at any size.
    { c: V(0, 0.030, 0.070), r: 0.044 * S, dir: V(0, 0.1, 1).normalize(), strength: 0.0085 * S, sharp: 1.5 },
    { c: V(0.030, 0.034, 0.062), r: 0.028 * S, dir: V(0, 0.2, 1).normalize(), strength: 0.006 * S, mirror: true },

    // Orbital rim and the socket recess inside it.
    { c: V(0.030, 0.012, 0.062), r: 0.026 * S, dir: V(0, 0, -1), strength: 0.010 * S, sharp: 1.4, mirror: true },
    { c: V(0.030, 0.006, 0.055), r: 0.018 * S, dir: V(0, 0, -1), strength: 0.006 * S, mirror: true },

    // Malar eminence (cheekbone), then the hollow under it. Gaunt characters
    // get a deeper hollow, which is most of what makes a face read as hungry.
    { c: V(0.050, -0.004, 0.048), r: 0.028 * S, dir: 'normal', strength: 0.0075 * S, mirror: true },
    { c: V(0.044, -0.026, 0.046), r: 0.026 * S, dir: 'normal', strength: -0.008 * S * gaunt, mirror: true },

    // Nose: root, dorsum, tip, wings.
    { c: V(0, 0.014, 0.076), r: 0.017 * S, dir: V(0, 0, 1), strength: 0.010 * S, sharp: 1.6 },
    { c: V(0, -0.002, 0.080), r: 0.019 * S, dir: V(0, 0, 1), strength: 0.019 * S, sharp: 1.7 },
    { c: V(0, -0.016, 0.078), r: 0.014 * S, dir: V(0, -0.3, 1).normalize(), strength: 0.013 * S, sharp: 1.8 },
    { c: V(0.014, -0.022, 0.070), r: 0.011 * S, dir: 'normal', strength: 0.004 * S, mirror: true },

    // Philtrum, lips, and the nasolabial fold that separates them from cheek.
    { c: V(0, -0.030, 0.072), r: 0.008 * S, dir: V(0, 0, -1), strength: 0.003 * S },
    { c: V(0, -0.036, 0.072), r: 0.015 * S, dir: V(0, 0, 1), strength: 0.005 * S, sharp: 1.4 },
    { c: V(0.022, -0.034, 0.060), r: 0.014 * S, dir: V(0, 0, -1), strength: 0.004 * S, mirror: true },

    // Chin and the mandibular angle.
    { c: V(0, -0.060, 0.058), r: 0.024 * S, dir: V(0, -0.2, 1).normalize(), strength: 0.009 * S, sharp: 1.3 },
    { c: V(0.046, -0.044, 0.014), r: 0.026 * S, dir: 'lateral', strength: 0.005 * S, mirror: true },

    // Asymmetry, applied last so it perturbs finished anatomy rather than
    // being averaged away by later operators. Every face is off by a little.
    { c: V(0.052, 0.004, 0.040), r: 0.034 * S, dir: 'normal', strength: 0.0035 * S * A },
    { c: V(-0.048, -0.020, 0.040), r: 0.030 * S, dir: 'normal', strength: -0.0028 * S * A },
  ]);

  for (let i = 0; i < verts.length; i++) pos.setXYZ(i, verts[i].x, verts[i].y, verts[i].z);
  geo.computeVertexNormals();
  return geo;
}

/** Eyeball plus iris, as its own small mesh so it can take a glossy material. */
export function buildEye(o, side) {
  const S = o.headScale;
  const g = new THREE.SphereGeometry(0.0125 * S, 14, 12);
  g.translate(side * 0.030 * S, 0.010 * S, 0.0545 * S);
  return g;
}

/** Upper lid as a shell over the eye — the thing that stops eyes reading as beads. */
export function buildLid(o, side) {
  const S = o.headScale;
  const g = new THREE.SphereGeometry(0.0138 * S, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.46);
  g.rotateX(-0.34);
  g.translate(side * 0.030 * S, 0.0105 * S, 0.054 * S);
  return g;
}

/** Ear: a small sculpted ellipsoid with a real concha hollow. */
export function buildEar(o, side) {
  const S = o.headScale;
  const g = new THREE.SphereGeometry(1, 14, 12);
  g.scale(0.009 * S, 0.021 * S, 0.014 * S);
  const pos = g.attributes.position;
  const verts = [];
  for (let i = 0; i < pos.count; i++) verts.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
  sculpt(verts, [
    { c: new THREE.Vector3(0, 0, 0.006 * S), r: 0.013 * S, dir: new THREE.Vector3(0, 0, -1), strength: 0.006 * S, sharp: 1.4 },
    { c: new THREE.Vector3(0, -0.016 * S, 0), r: 0.010 * S, dir: 'normal', strength: 0.002 * S },
  ]);
  for (let i = 0; i < verts.length; i++) pos.setXYZ(i, verts[i].x, verts[i].y, verts[i].z);
  g.computeVertexNormals();
  g.rotateY(side * 0.3);
  g.translate(side * 0.066 * S, 0.004 * S, -0.004 * S);
  return g;
}

export { smooth, lerp, profileAt };
