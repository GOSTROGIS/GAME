/* =========================================================================
   hm-model-measure.js — silhouette and layer-clipping audits, for any subject
   -------------------------------------------------------------------------
   Generalised out of ash-husk-model.js's two audits so a second sculpted
   subject can measure itself against its own plate instead of asserting
   fidelity in a comment. ash-husk-model.js is untouched; it keeps its own
   copies inline. A new subject should call these instead of re-deriving them.

   silhouetteReport intersects TRIANGLES with a height plane (not a vertex
   scan — a vertex scan reports whatever ring happens to sit near that
   height, which disagrees with its neighbour by hundreds of millimetres on a
   surface that is obviously smooth). Vertices are posed on the CPU first —
   skinned exactly as the shader does it — so a bind-pose measurement can
   never quietly stand in for what the viewer actually shows.

   clippingReport is a thin wrapper over hm-husk-layers.js's own
   radialProfile / layerAudit, which are already generic: bin by height AND
   angle, and compare only where both named meshes have geometry there.
   ========================================================================= */
import * as THREE from 'three';
import { radialProfile, layerAudit } from './hm-husk-layers.js';

export { radialProfile, layerAudit };

const DEFAULT_TOL = { hard: 55, soft: 90, tongue: 250, haze: 250 };

/**
 * @param {THREE.SkinnedMesh[]} meshes
 * @param {[number, number, string][]} table  [heightMetres, plateWidthMetres, grade]
 * @param {Record<string, number>} tol  millimetre tolerance per grade
 */
export function silhouetteReport(meshes, table, tol = DEFAULT_TOL) {
  const heights = table.map((r) => r[0]);
  const lo = new Float64Array(heights.length).fill(Infinity);
  const hi = new Float64Array(heights.length).fill(-Infinity);
  const hit = new Uint32Array(heights.length);
  const v = new THREE.Vector3();

  for (const o of meshes) {
    if (!o.visible) continue;
    o.updateWorldMatrix(true, false);
    const g = o.geometry;
    const p = g.attributes.position;
    const si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
    const idx = g.index;
    const count = idx ? idx.count : p.count;
    const xs = new Float32Array(p.count), ys = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) {
      v.set(p.getX(i), p.getY(i), p.getZ(i));
      if (si && sw && o.skeleton) skinPointLocal(v, o, si, sw, i);
      v.applyMatrix4(o.matrixWorld);
      xs[i] = v.x; ys[i] = v.y;
    }
    const tri = [0, 0, 0];
    for (let i = 0; i < count; i += 3) {
      tri[0] = idx ? idx.getX(i) : i;
      tri[1] = idx ? idx.getX(i + 1) : i + 1;
      tri[2] = idx ? idx.getX(i + 2) : i + 2;
      const y0 = ys[tri[0]], y1 = ys[tri[1]], y2 = ys[tri[2]];
      const ymin = Math.min(y0, y1, y2), ymax = Math.max(y0, y1, y2);
      for (let k = 0; k < heights.length; k++) {
        const h = heights[k];
        if (h < ymin || h > ymax) continue;
        for (let e = 0; e < 3; e++) {
          const i0 = tri[e], i1 = tri[(e + 1) % 3];
          const ya = ys[i0], yb = ys[i1];
          if ((ya - h) * (yb - h) > 0 || ya === yb) continue;
          const x = xs[i0] + ((h - ya) / (yb - ya)) * (xs[i1] - xs[i0]);
          if (x < lo[k]) lo[k] = x;
          if (x > hi[k]) hi[k] = x;
          hit[k]++;
        }
      }
    }
  }

  const rows = [];
  table.forEach(([h, plateW, grade], k) => {
    const modelW = hit[k] ? hi[k] - lo[k] : 0;
    const dev = Math.round((modelW - plateW) * 1000);
    const counted = grade === 'hard' || grade === 'soft';
    rows.push({
      h, plateW, modelW: +modelW.toFixed(3), dev, tol: tol[grade] ?? 90, grade,
      counted, ok: Math.abs(dev) <= (tol[grade] ?? 90), samples: hit[k],
    });
  });
  const counted = rows.filter((r) => r.counted);
  return { rows, within: counted.filter((r) => r.ok).length, total: counted.length };
}

const _sk = new THREE.Matrix4(), _acc = new THREE.Matrix4(), _tv = new THREE.Vector3();
function skinPointLocal(v, mesh, si, sw, i) {
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

/** @param {{inner:string,outer:string,label:string,tol?:number}[]} pairs */
export function clippingReport(meshes, pairs) {
  const wanted = new Set();
  for (const p of pairs) { wanted.add(p.inner); wanted.add(p.outer); }
  const profiles = {};
  for (const m of meshes) {
    if (!wanted.has(m.name) || profiles[m.name]) continue;
    profiles[m.name] = radialProfile(m);
  }
  const rows = layerAudit(profiles, pairs);
  const live = rows.filter((r) => !r.missing);
  return { rows, clean: live.filter((r) => r.ok).length, total: live.length };
}
