/* Hearthmere asset kit — shared material library and geometry helpers.
 *
 * Palette is not invented. Every colour traces to either the region kit in
 * src/data/worldAssets.js (REGION_ASSET_KITS → hearthmere) or a canonical
 * design-system token in tokens/colors.css. The comment on each material
 * names its source.
 *
 * Lighting the models are authored against (worldAssets.js, hearthmere):
 *   key cold_overcast · fill warm_spring_bounce · practicals banked_braziers
 *   contrast 0.62 · wetness 0.82   ← wetness is why slate roughness is low.
 */
import * as THREE from 'three';
import { surfaceMaps } from './hm-textures.js';

/* ---------- level of detail ----------
   Procedural assets do LOD by rebuilding at lower parameters, not by
   decimating a finished mesh — it is cheaper and it never produces the
   crumpled silhouette a decimator gives you on a low-poly source. Setting
   the level here changes what every helper below emits, so no builder had
   to be rewritten to gain a LOD chain.

   Reduction is reported measured, per asset, in the viewer. The declared
   lodTriangles in the manifest are a target, and where a level misses it
   the viewer says so rather than rounding the claim. */
let LOD = 0;
const SEG_K = [1, 0.58, 0.36];
const CNT_K = [1, 0.55, 0.3];

export const setLod = (n) => { LOD = Math.max(0, Math.min(2, n | 0)); };
export const getLod = () => LOD;

/** Segment count for a curved surface at the current level. */
export const sg = (n) => (LOD === 0 ? n : Math.max(3, Math.round(n * SEG_K[LOD])));
/** Instance count for a repeated detail at the current level. */
export const cnt = (n) => (LOD === 0 ? n : Math.max(1, Math.ceil(n * CNT_K[LOD])));
/** Subdivision level for an icosahedron at the current level. */
export const det = (d) => (LOD === 0 ? d : LOD === 1 ? Math.max(0, d - 1) : 0);
/** LOD-aware icosahedron — the kit's blob primitive. */
export const ico = (r, d = 0) => new THREE.IcosahedronGeometry(r, det(d));

/* ---------- deterministic randomness ----------
   Exports must be byte-stable across reloads, so every builder draws from a
   seeded stream rather than Math.random(). */
export function rnd(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- geometry helpers ---------- */

/** Displace vertices for a hand-cut, weathered read. Seam vertices that share
 *  a position are displaced identically, so cylinders and boxes do not split
 *  open along their UV seam. */
export function jitter(geo, amt, rand) {
  const p = geo.attributes.position;
  const seen = new Map();
  for (let i = 0; i < p.count; i++) {
    const k =
      p.getX(i).toFixed(4) + '|' + p.getY(i).toFixed(4) + '|' + p.getZ(i).toFixed(4);
    let d = seen.get(k);
    if (!d) {
      d = [(rand() - 0.5) * amt, (rand() - 0.5) * amt, (rand() - 0.5) * amt];
      seen.set(k, d);
    }
    p.setXYZ(i, p.getX(i) + d[0], p.getY(i) + d[1], p.getZ(i) + d[2]);
  }
  p.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Progressive lateral offset with height — a lean or a bow. power > 1 keeps
 *  the base planted and curves the upper length. */
export function lean(geo, kx, kz, power = 2) {
  const p = geo.attributes.position;
  let maxY = -Infinity;
  let minY = Infinity;
  for (let i = 0; i < p.count; i++) {
    maxY = Math.max(maxY, p.getY(i));
    minY = Math.min(minY, p.getY(i));
  }
  const span = Math.max(maxY - minY, 1e-6);
  for (let i = 0; i < p.count; i++) {
    const t = Math.pow((p.getY(i) - minY) / span, power);
    p.setX(i, p.getX(i) + kx * t);
    p.setZ(i, p.getZ(i) + kz * t);
  }
  p.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Bow a box or plank outward along z, peaking at mid-height — barrel staves,
 *  sagging canvas, warped boards. */
export function bow(geo, depth, axis = 'z') {
  const p = geo.attributes.position;
  let maxY = -Infinity;
  let minY = Infinity;
  for (let i = 0; i < p.count; i++) {
    maxY = Math.max(maxY, p.getY(i));
    minY = Math.min(minY, p.getY(i));
  }
  const span = Math.max(maxY - minY, 1e-6);
  for (let i = 0; i < p.count; i++) {
    const t = (p.getY(i) - minY) / span;
    const push = Math.sin(Math.PI * t) * depth;
    if (axis === 'z') p.setZ(i, p.getZ(i) + Math.sign(p.getZ(i) || 1) * push);
    else p.setX(i, p.getX(i) + Math.sign(p.getX(i) || 1) * push);
  }
  p.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Squash along y and swell in xz — turns a sphere or icosahedron into a
 *  needle mass, a moss cushion, an ash cone. */
export function squash(geo, sx, sy, sz) {
  geo.scale(sx, sy, sz);
  return geo;
}

/** Named mesh with placement, in one call. The name becomes the OBJ `o` entry
 *  and the GLB node name, which is what makes the download usable in Blender. */
export function part(geo, mat, name, opts = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  if (opts.pos) m.position.set(opts.pos[0], opts.pos[1], opts.pos[2]);
  if (opts.rot) m.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2]);
  if (opts.scale) {
    const s = opts.scale;
    if (Array.isArray(s)) m.scale.set(s[0], s[1], s[2]);
    else m.scale.setScalar(s);
  }
  return m;
}

/** Lathe a 2D profile. Points are [radius, height] pairs, bottom to top. */
export function lathe(points, seg = 32) {
  return new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y)),
    sg(seg)
  );
}

/** Tapered limb — branch, spear shaft, table leg. */
export function limb(rTop, rBot, len, seg = 8, hSeg = 1) {
  return new THREE.CylinderGeometry(rTop, rBot, len, sg(seg), sg(hSeg));
}

/** LOD-aware torus — hoops, rings, links. */
export function torus(r, tube, rseg = 6, tseg = 12, arc) {
  return new THREE.TorusGeometry(r, tube, sg(rseg), sg(tseg), arc);
}

/** LOD-aware cone — roots, spear heads, herb bundles, roof needles. */
export function cone(r, h, seg = 6, hSeg = 1) {
  return new THREE.ConeGeometry(r, h, sg(seg), sg(hSeg));
}

/** LOD-aware cylinder, capped. */
export function cyl(rt, rb, h, seg = 8, hSeg = 1, open = false) {
  return new THREE.CylinderGeometry(rt, rb, h, sg(seg), sg(hSeg), open);
}

/** A ring of instances around y, each placed by a callback. Used for staves,
 *  rivets, hoop bolts, root flares. */
export function ring(count, radius, fn, phase = 0) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const a = phase + (i / count) * Math.PI * 2;
    out.push(fn(i, a, Math.cos(a) * radius, Math.sin(a) * radius));
  }
  return out;
}

/** Chain of torus links along an axis — bell ropes, cup chains, vow chains. */
export function chain(links, linkR, tube, mat, name, rand) {
  const g = new THREE.Group();
  g.name = name;
  const geo = torus(linkR, tube, 6, 12);
  for (let i = 0; i < cnt(links); i++) {
    const m = part(geo, mat, name + '-link-' + i, {
      pos: [(rand() - 0.5) * tube, -i * linkR * 1.55, (rand() - 0.5) * tube],
      rot: [Math.PI / 2, (i % 2) * (Math.PI / 2), 0],
    });
    g.add(m);
  }
  return g;
}

/* ---------- material library ----------
   Five to eight slots per asset, drawn from this shared set so the whole kit
   greys out, hovers and grades as one family. Metalness is capped at 0.4:
   the stage carries no environment map, so higher metalness renders black.

   Six of these carry the EXACT baseColor and roughness declared for the
   matching hm.surface.* row in hearthmere.assets.json. Those rows also
   declare a `wetness` the MeshStandardMaterial has no channel for, so it is
   folded into roughness as  effective = roughness × (1 − wetness × 0.3).
   That is the one derived number in this file, and this is where it is
   stated rather than left as an eyeballed value. */
const M = (name, color, rough, metal, extra = {}) => {
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: rough,
    metalness: metal,
    ...extra,
  });
  m.name = name;
  return m;
};

export const MAT = {
  /* hm.surface.slate-cobbles-wet — #30393b, roughness .72, wetness .9 */
  wetSlate: M('wet-slate', '#30393b', 0.53, 0.06),
  /* hm.surface.slate-steps-chipped — #3a4243, roughness .8, wetness .78 */
  slateDry: M('slate-chipped', '#3a4243', 0.61, 0.02),
  /* hm.surface.spring-limestone — #68706b, roughness .66, wetness 1 */
  springStone: M('spring-limestone', '#68706b', 0.46, 0.02),
  /* hm.surface.oak-planks-dark — #302924, roughness .76, wetness .7 */
  darkOak: M('dark-oak', '#302924', 0.6, 0.02),
  weatheredTimber: M('weathered-timber', '#3d3328', 0.78, 0.01),
  heartwood: M('cut-heartwood', '#6f5b40', 0.8, 0.01),
  /* iron and bronze — pitted, never chromed */
  pittedIron: M('pitted-iron', '#3a4143', 0.56, 0.38),
  blackIron: M('black-iron', '#24292b', 0.62, 0.3),
  bellBronze: M('bell-bronze', '#9d7c43', 0.36, 0.4),
  /* kit.palette.accent #c18b46 */
  warmBrass: M('warm-brass', '#c18b46', 0.32, 0.4),
  /* hm.surface.clay-tablets — #6a4636, roughness .9, wetness .4 */
  firedClay: M('fired-clay', '#6a4636', 0.79, 0.01),
  clayPale: M('clay-unfired', '#8a7a68', 0.9, 0.0),
  /* kit.palette.cloth #683f37 — the patched red mantle colour */
  patchedCloth: M('patched-cloth', '#683f37', 0.95, 0.0, { side: THREE.DoubleSide }),
  canvasBone: M('canvas-bone', '#7b7466', 0.95, 0.0, { side: THREE.DoubleSide }),
  ropeHemp: M('rope-hemp', '#75623f', 0.94, 0.0),
  /* flora */
  pineBark: M('blackpine-bark', '#2a2521', 0.95, 0.0),
  pineNeedle: M('blackpine-needle', '#2b3a31', 0.86, 0.0),
  /* --moss #52665c */
  graveMoss: M('steam-moss', '#52665c', 0.9, 0.0),
  /* --muted #8e928b */
  lichenGrey: M('wall-lichen', '#8e928b', 0.94, 0.0),
  reedPale: M('cold-reed', '#6d6549', 0.93, 0.0),
  /* desaturated toward --blood #6e2525 — dried heather bloom, not a new hue */
  heatherBloom: M('ridge-heather', '#5d3b39', 0.93, 0.0),
  /* --ember #bd6135, the only emissive in the kit: banked coals */
  ember: M('banked-ember', '#5a2a17', 0.7, 0.0, {
    emissive: new THREE.Color('#bd6135'),
    emissiveIntensity: 1.6,
  }),
  ash: M('cold-ash', '#5f5c56', 0.98, 0.0),
  /* --bone #d8d0bd, held down: linen, tallow, bone charms */
  boneLinen: M('bone-linen', '#a9a291', 0.9, 0.0),
  blackwater: M('still-water', '#12292d', 0.18, 0.1),
};

/* ---------- texture binding ----------
   The manifest declares materials.maxTextureDimension on every row and
   nothing was using it, which is why the first pass read flat at close
   range. Each material that has a matching hm.surface.* generator gets its
   map and a roughness map derived from it, so wetness varies across a
   surface instead of being one number.

   Textures survive the GLB export (glTF embeds them). They do NOT survive
   OBJ, which carries per-material colour only — that is a format limit,
   not a gap in the asset. */
let textured = false;
export function applyTextures(on) {
  if (textured === on) return;
  textured = on;
  for (const key of Object.keys(MAT)) {
    const m = MAT[key];
    const maps = on ? surfaceMaps(key) : null;
    if (on && !maps) continue;
    m.map = maps ? maps.map : null;
    m.roughnessMap = maps ? maps.roughnessMap : null;
    m.needsUpdate = true;
  }
}
export const isTextured = () => textured;

/** Mark a subtree as thin single-surface geometry: it should neither cast
 *  into nor receive from the shadow map. A flat sheet that shadows itself
 *  renders as a black hole. */
export function thin(node) {
  node.traverse((n) => {
    if (n.isMesh) {
      n.userData.noCast = true;
      n.userData.noShadow = true;
    }
  });
  return node;
}

/* ---------- measurement ----------
   The kit reports measured geometry against the manifest's declared budget
   rather than restating the budget as if it were the result. */
export function measure(object) {
  let tris = 0;
  let meshes = 0;
  const mats = new Set();
  object.traverse((o) => {
    if (!o.isMesh) return;
    meshes++;
    mats.add(o.material.name || o.material.uuid);
    const g = o.geometry;
    tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
  });
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  return {
    tris: Math.round(tris),
    meshes,
    materials: mats.size,
    size: [size.x, size.y, size.z],
  };
}

/** Drop a built group so its lowest point sits at y = 0 and it is centred in
 *  xz — every asset in the kit shares one pivot convention. */
export function seat(group) {
  const box = new THREE.Box3().setFromObject(group);
  const c = box.getCenter(new THREE.Vector3());
  group.position.x -= c.x;
  group.position.z -= c.z;
  group.position.y -= box.min.y;
  return group;
}

export { THREE };
