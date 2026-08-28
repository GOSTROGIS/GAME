/* =========================================================================
   hm-husk-rig.js — skeleton, automatic skin binding, and cloth dynamics
   -------------------------------------------------------------------------
   WHY. The husk was rigid meshes parented to Groups. Two consequences, both
   of which read immediately as wrong:

     ARMS. The sleeve hung off the shoulder and the hand off the wrist, with
     nothing between them. Rotating the elbow moved the hand THROUGH the
     sleeve, because the sleeve had no idea the elbow existed. No amount of
     tuning the sleeve's shape fixes that; the surface has to be bound to the
     chain it covers.

     CLOTH. A robe rigidly parented to the chest is a robe made of steel. It
     cannot lag when the body starts, cannot swing through a turn, cannot
     settle after a stop. Every clip looked like a mannequin being carried.

   This module supplies the three things that were missing:

     1. A real THREE.Bone hierarchy + Skeleton, so deformation is GPU linear
        blend skinning rather than parenting.
     2. An automatic binder. The section generators emit free-form surfaces
        (lofts, swept tubes, torn panels), not the profile-swept tubes that
        hm-actor-skin's addTube can weight on its own. So weights are solved
        from a declared FIELD of capsule segments: every vertex takes the four
        strongest segments by capsule distance, smoothstep falloff, normalised.
        Sections stay exactly as they are and get skinned for free.
     3. Spring bones. Cloth that should swing (robe hem, sleeve drape, cowl
        fold, sash tail) hangs on chains of dynamic bones integrated with
        Verlet + gravity + inertia from the parent's own motion, then length
        constrained and angle limited. Standard spring-bone; cheap for the
        ~30 bones here, and bones export to GLB where a vertex cache does not.

   BIND ORDER MATTERS. Skeleton.boneInverses and SkinnedMesh.bindMatrix are
   snapshots. Scaling the root after binding double-applies the scale (once
   through the bone matrices, once through matrixWorld). So the height fit is
   BAKED into geometry and bone rest positions before the Skeleton is built,
   and `rescale()` below re-bakes in place when the posed measurement differs.
   ========================================================================= */

import * as THREE from 'three';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

/* ------------------------------------------------------------ bone tree */

/**
 * @param {Record<string, number[]>} rest  joint name -> figure-space position
 * @param {Record<string, string|null>} parent
 * @param {string[]} order  parents before children
 */
export function buildBoneTree(rest, parent, order) {
  const bones = [];
  const byName = {};
  const abs = {};
  for (const name of order) {
    const b = new THREE.Bone();
    b.name = name;
    const p = rest[name];
    abs[name] = new THREE.Vector3(p[0], p[1], p[2]);
    const par = parent[name];
    if (par) {
      b.position.copy(abs[name]).sub(abs[par]);
      byName[par].add(b);
    } else {
      b.position.copy(abs[name]);
    }
    byName[name] = b;
    bones.push(b);
  }
  return { bones, byName, abs, index: Object.fromEntries(bones.map((b, i) => [b.name, i])) };
}

/* --------------------------------------------------------------- binding */

/**
 * A capsule of influence. `a`/`b` are figure-space endpoints; a vertex within
 * `r` of the segment picks up weight, smoothstep to zero at r.
 *
 * `w` scales the whole segment so a broad body capsule does not out-vote a
 * narrow one it overlaps — this is what keeps the sleeve's own drape bones
 * winning over the chest near the cuff.
 */
export function seg(bone, a, b, r, w = 1, pow = 1) {
  return {
    bone,
    a: new THREE.Vector3(...a),
    b: new THREE.Vector3(...b),
    r, w, pow,
  };
}

const _ab = new THREE.Vector3(), _ap = new THREE.Vector3(), _q = new THREE.Vector3();
function capsuleDist(s, x, y, z) {
  _ab.subVectors(s.b, s.a);
  _ap.set(x - s.a.x, y - s.a.y, z - s.a.z);
  const len2 = _ab.lengthSq();
  const t = len2 > 1e-9 ? clamp(_ap.dot(_ab) / len2, 0, 1) : 0;
  _q.copy(s.a).addScaledVector(_ab, t);
  return Math.hypot(x - _q.x, y - _q.y, z - _q.z);
}

/**
 * Solve and attach skinIndex / skinWeight for arbitrary geometry.
 * Vertices that no segment reaches fall back to `fallback` at full weight, so
 * a stray hem tongue can never end up with zero influence and collapse to the
 * origin — the classic symptom of a hand-rolled binder.
 */
export function bindGeometry(geo, field, boneIndex, fallback, allow = null) {
  const pos = geo.attributes.position;
  const n = pos.count;
  const si = new Uint16Array(n * 4);
  const sw = new Float32Array(n * 4);
  const fb = boneIndex[fallback] ?? 0;
  /* A restricted bone set is not an optimisation, it is correctness. The
     robe's skirt ring and the sleeve drape occupy the same volume around the
     hip, so a purely distance-based solve gave the bell sleeve 27 % of its
     weight to three SKIRT bones and only 6 % of its vertices moved when the
     elbow did. Geometry declares which bones may claim it. */
  const use = allow ? field.filter((s) => allow.some((a) => (a.endsWith('*') ? s.bone.startsWith(a.slice(0, -1)) : s.bone === a))) : field;
  const hits = [];
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    hits.length = 0;
    for (const s of use) {
      const d = capsuleDist(s, x, y, z);
      if (d >= s.r) continue;
      const w = Math.pow(smooth(1 - d / s.r), s.pow) * s.w;
      if (w > 1e-4) hits.push({ i: boneIndex[s.bone] ?? fb, w });
    }
    if (!hits.length) { si[i * 4] = fb; sw[i * 4] = 1; continue; }
    // Collapse duplicates (a bone may contribute through several segments).
    const merged = new Map();
    for (const h of hits) merged.set(h.i, Math.max(merged.get(h.i) ?? 0, h.w));
    const top = [...merged.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    let sum = 0;
    for (const [, w] of top) sum += w;
    for (let k = 0; k < top.length; k++) {
      si[i * 4 + k] = top[k][0];
      sw[i * 4 + k] = top[k][1] / sum;
    }
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  return geo;
}

/** Every vertex to one bone — boots, hands, the tablet. Rigid is correct for
 *  a fired clay plaque; pretending otherwise would wobble it. */
export function bindRigid(geo, boneIndex, bone) {
  const n = geo.attributes.position.count;
  const si = new Uint16Array(n * 4);
  const sw = new Float32Array(n * 4);
  const b = boneIndex[bone] ?? 0;
  for (let i = 0; i < n; i++) { si[i * 4] = b; sw[i * 4] = 1; }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  return geo;
}

/* ------------------------------------------------------------- dynamics */

/**
 * Spring bones. One chain per hanging thing; each bone points at a simulated
 * particle that trails its rest position.
 *
 * Verlet rather than explicit Euler because it stays stable at the frame
 * spikes a browser tab actually produces, and the whole point of this is that
 * cloth must not explode when the user drags the orbit control and the tab
 * stalls for 200 ms. dt is clamped for the same reason.
 */
export class SpringSim {
  /**
   * @param {{bone:THREE.Bone, len:number, axis:THREE.Vector3}[]} chain
   */
  constructor(chains, opts = {}) {
    this.chains = chains;
    this.stiff = opts.stiff ?? 0.14;
    this.damp = opts.damp ?? 0.16;
    this.gravity = opts.gravity ?? -1.5;
    this.limit = opts.limit ?? 0.55;       // radians from rest
    this.inertia = opts.inertia ?? 1.0;
    /* Colliders keep dynamic cloth OUT of the body. Without them the hem
       swings straight through the legs on any clip that moves them, which is
       the one kind of clipping a layer stack cannot fix: the layer stack
       governs the rest pose, and this governs every pose after it. */
    this.colliders = opts.colliders ?? [];
    this._ready = false;
    this._tmp = {
      head: new THREE.Vector3(), rest: new THREE.Vector3(), dir: new THREE.Vector3(),
      want: new THREE.Vector3(), q: new THREE.Quaternion(), qi: new THREE.Quaternion(),
      q2: new THREE.Vector3(), m: new THREE.Matrix4(),
      pw: new THREE.Vector3(), rd: new THREE.Vector3(),
      ca: new THREE.Vector3(), cb: new THREE.Vector3(), cq: new THREE.Vector3(),
      cn: new THREE.Vector3(),
    };
  }

  /** Resolve collider endpoints from their bones for this frame. */
  _updateColliders() {
    const T = this._tmp;
    for (const c of this.colliders) {
      c.boneA.getWorldPosition(T.ca);
      c.boneB.getWorldPosition(T.cb);
      c.pa = c.pa || new THREE.Vector3();
      c.pb = c.pb || new THREE.Vector3();
      c.pa.copy(T.ca);
      c.pb.copy(T.cb);
    }
  }

  /** Push a point out of every capsule it has entered. */
  _resolve(p) {
    const T = this._tmp;
    for (const c of this.colliders) {
      T.ca.subVectors(c.pb, c.pa);
      const len2 = T.ca.lengthSq();
      T.cb.subVectors(p, c.pa);
      const t = len2 > 1e-9 ? clamp(T.cb.dot(T.ca) / len2, 0, 1) : 0;
      T.cq.copy(c.pa).addScaledVector(T.ca, t);
      T.cn.subVectors(p, T.cq);
      const d = T.cn.length();
      if (d >= c.r) continue;
      if (d < 1e-5) { T.cn.set(p.x - T.cq.x || 1, 0, p.z - T.cq.z || 0).normalize(); }
      else T.cn.multiplyScalar(1 / d);
      p.copy(T.cq).addScaledVector(T.cn, c.r);
    }
  }

  /** Snap every particle onto its rest tip. Called on the first frame and on
   *  any clip change, so a pose switch does not fling the hem across the room. */
  reset(root) {
    root.updateMatrixWorld(true);
    const T = this._tmp;
    for (const chain of this.chains) {
      for (const b of chain) {
        b.bone.parent.updateWorldMatrix(true, false);
        T.rest.copy(b.axis).multiplyScalar(b.len).add(b.bone.position).applyMatrix4(b.bone.parent.matrixWorld);
        b.p = T.rest.clone();
        b.p0 = T.rest.clone();
      }
    }
    this._ready = true;
  }

  step(root, dt) {
    if (!this._ready) { this.reset(root); return; }
    const h = clamp(dt, 0, 1 / 30);
    const T = this._tmp;
    const g = this.gravity * h * h;
    this._updateColliders();
    for (const chain of this.chains) {
      for (const b of chain) {
        const parent = b.bone.parent;
        parent.updateWorldMatrix(true, false);
        const pw = parent.matrixWorld;
        /* Per-chain feel. A robe hem and a cowl fold are not the same cloth:
           one is a metre of heavy sacking, the other a hand's width of it. */
        const stiff = b.stiff ?? this.stiff;
        const damp = b.damp ?? this.damp;
        const limit = b.limit ?? this.limit;

        /* Head and REST TIP are both derived from the PARENT's world matrix
           with this bone's own rotation treated as identity. Reading the rest
           tip through bone.localToWorld instead — as this did — feeds the
           bone's current rotation back into its own target, so the spring
           converges on wherever it already is and the restoring force
           silently vanishes. The hem moved by a tenth of a degree. */
        T.head.copy(b.bone.position).applyMatrix4(pw);
        T.rest.copy(b.axis).multiplyScalar(b.len).add(b.bone.position).applyMatrix4(pw);

        // Verlet: carry momentum, bleed it, pull toward rest, add gravity.
        T.want.subVectors(b.p, b.p0).multiplyScalar((1 - damp) * this.inertia);
        T.pw.copy(b.p).add(T.want);
        T.pw.y += g;
        T.pw.lerp(T.rest, stiff);

        // Length constraint — the bone cannot stretch.
        T.dir.subVectors(T.pw, T.head);
        const d = T.dir.length();
        if (d > 1e-6) T.dir.multiplyScalar(b.len / d); else T.dir.subVectors(T.rest, T.head);

        // Angle limit, so a fast turn cannot fold cloth back through the body.
        T.rd.subVectors(T.rest, T.head).normalize();
        T.q2.copy(T.dir).normalize();
        const ang = Math.acos(clamp(T.q2.dot(T.rd), -1, 1));
        if (ang > limit) {
          T.q.setFromUnitVectors(T.q2, T.rd);
          T.qi.identity().slerp(T.q, 1 - limit / ang);
          T.dir.applyQuaternion(T.qi);
        }

        b.p0.copy(b.p);
        b.p.copy(T.head).add(T.dir);
        /* Collide AFTER the length constraint, then let the aim absorb the
           correction. Colliding first would just be overwritten by it. */
        this._resolve(b.p);

        // Aim the bone down its own axis at the particle, in PARENT space.
        T.want.copy(b.p).sub(T.head).normalize();
        T.m.copy(pw).invert();
        T.want.transformDirection(T.m).normalize();
        b.bone.quaternion.setFromUnitVectors(b.axis, T.want);
        b.bone.updateWorldMatrix(false, false);
      }
    }
  }
}

/* ------------------------------------------------------------- utilities */

/** Bake a uniform scale into geometry buffers and bone rest offsets, so the
 *  height fit never has to live in a transform above a bound skeleton. */
export function rescale(geometries, bones, k) {
  if (Math.abs(k - 1) < 1e-6) return;
  for (const g of geometries) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k);
    p.needsUpdate = true;
    g.computeBoundingSphere();
  }
  for (const b of bones) b.position.multiplyScalar(k);
}

/** Translate geometry buffers and the root bone, same reasoning as rescale. */
export function reseat(geometries, rootBone, dy) {
  if (Math.abs(dy) < 1e-9) return;
  for (const g of geometries) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + dy);
    p.needsUpdate = true;
    g.computeBoundingSphere();
  }
  rootBone.position.y += dy;
}

/** Exact vertex-space bounds of a posed skinned set. Box3.expandByObject
 *  reports rotated bounding BOXES, which inflated the crown by 26 mm and made
 *  the height correction shrink every width by 1.5 %. */
export function measurePosed(meshes, skip = () => false, stride = 1) {
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  for (const m of meshes) {
    if (skip(m)) continue;
    const g = m.geometry;
    const p = g.attributes.position;
    const si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
    for (let i = 0; i < p.count; i += stride) {
      v.set(p.getX(i), p.getY(i), p.getZ(i));
      if (si && sw) skinPoint(v, m, si, sw, i);
      box.expandByPoint(v);
    }
  }
  return box;
}

const _sk = new THREE.Matrix4(), _acc = new THREE.Matrix4(), _tv = new THREE.Vector3();
/** CPU mirror of the skinning shader, for measurement only. */
export function skinPoint(v, mesh, si, sw, i) {
  const sk = mesh.skeleton;
  _acc.elements.fill(0);
  let any = false;
  for (let k = 0; k < 4; k++) {
    const w = sw.getComponent(i, k);
    if (w < 1e-6) continue;
    const bi = si.getComponent(i, k);
    _sk.multiplyMatrices(sk.bones[bi].matrixWorld, sk.boneInverses[bi]);
    for (let e = 0; e < 16; e++) _acc.elements[e] += _sk.elements[e] * w;
    any = true;
  }
  if (!any) return v;
  _tv.copy(v).applyMatrix4(mesh.bindMatrix).applyMatrix4(_acc).applyMatrix4(mesh.bindMatrixInverse);
  return v.copy(_tv);
}
