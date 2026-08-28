/* Structural wear — the fix for "ruined, neglected and worked look identical".
 *
 * THE BUG THIS REPLACES
 *
 * hm-biome.js applied wear as (a) a slightly greyer tint and (b) a higher
 * count of scattered overlay lumps. Measured on a real asset, kept -> ruined
 * moved 364 -> 524 triangles and the base colour moved #3b3d3c -> #454644.
 * Worse, roughness was ADDED to a value already near 1.0, so `neglected` and
 * `ruined` both clamped to exactly 1.00 and became materially identical. Wear
 * added litter; it never broke anything.
 *
 * WHAT RUIN ACTUALLY LOOKS LIKE
 *
 * A ruined machine is not a clean machine under more dust. It is missing
 * fittings, it has members hanging out of line, it leans, and the mass that
 * left it is lying on the floor beside it. So this module operates on the
 * asset's OWN parts:
 *
 *   remove  - delete non-structural parts outright
 *   detach  - drop a part to the ground and leave it lying there
 *   splay   - rotate members out of true
 *   lean    - tilt the whole asset off plumb
 *   corrode - swap a SUBSET of materials to rust, not a global retint
 *   rubble  - re-add the removed volume as debris at the base
 *
 * That last one matters: material is conserved. Parts that vanish reappear as
 * rubble, so a ruined asset has the same rough mass as a kept one and the
 * silhouette change is legible instead of just "smaller".
 *
 * Structural protection: the largest parts by volume are never removed, so a
 * ruined building still stands and a ruined engine still has its bed. Ruin
 * without that rule just deletes assets.
 */
import { THREE, rnd, part, ico, seat } from './hm-core.js';

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

export const WEAR = [
  {
    id: 'kept', name: 'Kept',
    blurb: 'Maintained. Oiled, painted, swept. Nothing missing.',
    remove: 0, detach: 0, splay: 0, lean: 0, corrode: 0, rubble: 0, roughTarget: 0.42,
  },
  {
    id: 'worked', name: 'Worked',
    blurb: 'In daily use. Polished at the contact faces, grubby everywhere else.',
    remove: 0.03, detach: 0.02, splay: 0.05, lean: 0.008, corrode: 0.14, rubble: 0.12, roughTarget: 0.6,
  },
  {
    id: 'neglected', name: 'Neglected',
    blurb: 'Nobody has maintained this in years. Fittings gone, members out of true.',
    remove: 0.14, detach: 0.09, splay: 0.18, lean: 0.03, corrode: 0.45, rubble: 0.5, roughTarget: 0.82,
  },
  {
    id: 'ruined', name: 'Ruined',
    blurb: 'Structurally failed. A third of it is on the floor.',
    remove: 0.34, detach: 0.2, splay: 0.42, lean: 0.085, corrode: 0.72, rubble: 1.0, roughTarget: 0.95,
  },
];

/* Corrosion materials, cached. Rust is applied per-part, so a corroded asset
   shows a MIX of sound and rotten material rather than one flat retint —
   which is what makes it read as decay rather than as a colour change. */
const corrodeCache = new Map();
function corrodedMaterial(src, tier) {
  const key = src.name + '|corrode|' + tier.id;
  if (corrodeCache.has(key)) return corrodeCache.get(key);
  const m = src.clone();
  m.name = src.name + '-corroded-' + tier.id;
  // Rust is a hue shift toward oxide, not a desaturation to grey.
  const oxide = new THREE.Color('#6b4227');
  m.color.lerp(oxide, 0.3 + tier.corrode * 0.45);
  // Roughness moves TOWARD a target instead of being added to. This is the
  // saturation fix: two tiers can no longer both clamp to 1.00.
  m.roughness = (m.roughness ?? 0.8) + (tier.roughTarget - (m.roughness ?? 0.8)) * 0.75;
  if (m.metalness !== undefined) m.metalness = Math.max(0, m.metalness * (1 - tier.corrode * 0.8));
  corrodeCache.set(key, m);
  return m;
}

/* Roughness-only pass for parts that are worn but not corroded — a polished
   bearing on a neglected machine gets SMOOTHER, not rougher, because use
   polishes contact faces. Named parts opt in via these substrings. */
const POLISHED = ['bearing', 'pin', 'journal', 'rail', 'way', 'roll-barrel', 'face', 'shoe', 'die'];
const polishCache = new Map();
function polishedMaterial(src, tier) {
  const key = src.name + '|polish|' + tier.id;
  if (polishCache.has(key)) return polishCache.get(key);
  const m = src.clone();
  m.name = src.name + '-polished';
  m.roughness = Math.max(0.12, (m.roughness ?? 0.8) * (1 - 0.45));
  polishCache.set(key, m);
  return m;
}

function volumeOf(mesh) {
  if (!mesh.geometry) return 0;
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  const b = mesh.geometry.boundingBox;
  const s = new THREE.Vector3().subVectors(b.max, b.min);
  const sc = mesh.scale;
  return Math.max(1e-9, Math.abs(s.x * sc.x) * Math.abs(s.y * sc.y) * Math.abs(s.z * sc.z));
}

/**
 * Apply structural wear to a freshly built asset, in place.
 * @param group    a Group from any generator
 * @param tierId   'kept' | 'worked' | 'neglected' | 'ruined'
 * @param seed     deterministic per (asset, tier)
 * @param opts     { protectFrac } share of largest parts that can never be removed
 */
export function applyWear(group, tierId, seed = 0, opts = {}) {
  const tier = WEAR.find((w) => w.id === tierId) || WEAR[0];
  group.userData.wear = tier.id;
  if (tier.id === 'kept') {
    // Kept still gets a material pass, or "kept" reads as "untreated".
    group.traverse((o) => { if (o.isMesh && o.material && o.material.name && POLISHED.some((k) => o.name.includes(k))) o.material = polishedMaterial(o.material, tier); });
    return group;
  }
  const rand = rnd(0x5ea1 + seed * 6473 + tier.id.length * 97);
  const bb0 = new THREE.Box3().setFromObject(group);
  const groundY = bb0.min.y;

  // Collect candidate meshes with their volumes.
  const meshes = [];
  group.traverse((o) => { if (o.isMesh && o.geometry) meshes.push(o); });
  if (meshes.length < 3) return group;
  const vols = meshes.map((m) => ({ m, v: volumeOf(m) }));
  vols.sort((a, b) => b.v - a.v);
  // Protect the structural core: the biggest parts stay, always.
  const protectFrac = opts.protectFrac ?? 0.22;
  const protectN = Math.max(1, Math.round(vols.length * protectFrac));
  const protectedSet = new Set(vols.slice(0, protectN).map((x) => x.m));

  // Deterministic order over the unprotected remainder.
  const pool = vols.slice(protectN).map((x) => x.m);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }

  const nRemove = Math.floor(pool.length * tier.remove);
  const nDetach = Math.floor(pool.length * tier.detach);
  const nSplay = Math.floor(pool.length * tier.splay);
  let removedVolume = 0;
  const removedMats = [];

  // --- remove
  for (let i = 0; i < nRemove; i++) {
    const m = pool[i];
    removedVolume += volumeOf(m);
    if (m.material) removedMats.push(m.material);
    if (m.parent) m.parent.remove(m);
  }
  // --- detach: drop to the floor and lie there
  for (let i = nRemove; i < nRemove + nDetach; i++) {
    const m = pool[i];
    if (!m || !m.parent) continue;
    const wp = m.getWorldPosition(new THREE.Vector3());
    const local = group.worldToLocal(wp.clone());
    const a = rand() * Math.PI * 2;
    const dist = 0.15 + rand() * 0.5;
    m.position.set(local.x + Math.cos(a) * dist, groundY + 0.02 + rand() * 0.03, local.z + Math.sin(a) * dist);
    // Reparent to the root so the drop is not undone by an animated ancestor.
    group.attach ? group.attach(m) : group.add(m);
    m.position.set(local.x + Math.cos(a) * dist, groundY + 0.02 + rand() * 0.03, local.z + Math.sin(a) * dist);
    m.rotation.set(rand() * Math.PI, rand() * Math.PI * 2, Math.PI * 0.5 + (rand() - 0.5) * 0.5);
    m.name = m.name + '-fallen';
  }
  // --- splay: rotate members out of true without moving them
  for (let i = nRemove + nDetach; i < nRemove + nDetach + nSplay; i++) {
    const m = pool[i];
    if (!m) continue;
    const k = tier.splay;
    m.rotation.x += (rand() - 0.5) * k * 0.7;
    m.rotation.z += (rand() - 0.5) * k * 0.7;
    m.position.y -= rand() * k * 0.06;
  }
  // --- corrode a subset, polish the contact faces
  group.traverse((o) => {
    if (!o.isMesh || !o.material || !o.material.name) return;
    if (POLISHED.some((kk) => o.name.includes(kk)) && rand() > tier.corrode) {
      o.material = polishedMaterial(o.material, tier);
    } else if (rand() < tier.corrode) {
      o.material = corrodedMaterial(o.material, tier);
    }
  });

  // --- rubble: the removed mass reappears at the base. Material conserved.
  if (tier.rubble > 0 && removedVolume > 0) {
    const size = new THREE.Vector3().subVectors(bb0.max, bb0.min);
    const spread = Math.max(size.x, size.z) * 0.5;
    const chunkV = removedVolume * tier.rubble;
    const n = Math.min(26, Math.max(3, Math.round(6 + chunkV * 900)));
    const rubbleMat = removedMats[0] || null;
    for (let i = 0; i < n; i++) {
      const r = Math.cbrt(chunkV / n) * (0.5 + rand() * 1.1);
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * spread;
      const geo = rand() > 0.45 ? ico(Math.max(0.012, r), 0) : box(r * 1.6, r * 0.7, r * 1.3);
      const mat = removedMats.length ? removedMats[Math.floor(rand() * removedMats.length)] : rubbleMat;
      if (!mat) break;
      group.add(part(geo, corrodedMaterial(mat, tier), 'rubble-' + i, {
        pos: [bb0.min.x + size.x * 0.5 + Math.cos(a) * d, groundY + r * 0.4, bb0.min.z + size.z * 0.5 + Math.sin(a) * d],
        rot: [rand() * 1.2, rand() * Math.PI * 2, rand() * 1.2],
      }));
    }
  }

  // --- lean: the whole asset off plumb. Applied last so it carries rubble too.
  if (tier.lean > 0) {
    const wrap = new THREE.Group();
    wrap.name = 'wear-lean';
    while (group.children.length) wrap.add(group.children[0]);
    wrap.rotation.x = (rand() - 0.5) * tier.lean * 2;
    wrap.rotation.z = (rand() - 0.5) * tier.lean * 2;
    group.add(wrap);
  }
  return group;
}

/** Measurable signature, for proving tiers actually differ. */
export function wearSignature(group) {
  let tris = 0, nodes = 0, fallen = 0, rubble = 0;
  const mats = new Set();
  const bb = new THREE.Box3().setFromObject(group);
  group.traverse((o) => {
    nodes++;
    if (o.name && o.name.includes('-fallen')) fallen++;
    if (o.name && o.name.startsWith('rubble-')) rubble++;
    if (o.geometry) {
      const i = o.geometry.index, p = o.geometry.attributes.position;
      tris += i ? i.count / 3 : (p ? p.count / 3 : 0);
    }
    if (o.material && o.material.name) mats.add(o.material.name);
  });
  const size = new THREE.Vector3().subVectors(bb.max, bb.min);
  return {
    tris: Math.round(tris), nodes, fallen, rubble, materials: mats.size,
    footprint: +(size.x * size.z).toFixed(3),
    height: +size.y.toFixed(3),
  };
}
