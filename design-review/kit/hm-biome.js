/* Biome finish system — the honest multiplier.
 *
 * A finish is a GEOMETRY OVERLAY plus a material retint applied to any built
 * asset. It is what makes a 1,000,000-asset catalogue arithmetically real
 * without inflating axis counts into a lie: the same pipe run rimed with ice,
 * crusted with cooled slag, or strangled by vines is genuinely a different
 * asset in play, because the silhouette actually changes.
 *
 *   catalogue total = Σ generators ( axis space ) × biomes × wear tiers
 *
 * The rule from hm-steam.js still holds and is the reason this file exists:
 * an axis only counts if it changes silhouette or material. A recolour is not
 * a variant. Icicles hanging off every upward edge are.
 *
 * Overlays are placed against the asset's own bounding box, so a finish works
 * on anything — a lamp, a tree, a bell tower — without the generator knowing
 * biomes exist. That decoupling is the whole point: 5 biomes × 4 wear tiers
 * is a ×20 multiplier applied once, to everything, forever.
 *
 * Biome names are grounded in the world's own geography. src/data/registries.js
 * REGION_DEFINITIONS already declares two planned frontier regions —
 * salt_waste_frontier ("The Mirror-Salt Waste", white storms) and
 * veil_coast_frontier ("The Veil Coast", moonless tides, black coral) — so
 * rime and drowned are not inventions. Forge is Cinderward. Ash is the
 * baseline: the sun has dimmed behind a permanent veil of ash.
 */
import { THREE, rnd, jitter, part, limb, torus, cone, ico, thin } from './hm-core.js';

const box = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);

/* ---------------------------------------------------------------- biomes */
export const BIOMES = [
  {
    id: 'ash', name: 'Ash', blurb: 'The baseline. The sun has dimmed behind a permanent veil of ash, and everything in the Reach wears it.',
    tint: '#8f8b80', tintAmount: 0.14, roughShift: 0.06, region: 'all',
  },
  {
    id: 'forge', name: 'Forge', blurb: 'Cinderward. Cooled slag crusts the base, and the cracks still carry heat.',
    tint: '#a8552a', tintAmount: 0.2, roughShift: -0.1, region: 'cinderward',
  },
  {
    id: 'rime', name: 'Rime', blurb: 'The Mirror-Salt Waste, where white storms erase direction. Ice loads every upward face.',
    tint: '#b8c6cb', tintAmount: 0.3, roughShift: 0.12, region: 'salt_waste_frontier',
  },
  {
    id: 'verdant', name: 'Verdant', blurb: 'Overgrowth. What the Reach looks like where nothing has cut it back in nine years.',
    tint: '#5b7350', tintAmount: 0.24, roughShift: 0.1, region: 'dunmire',
  },
  {
    id: 'drowned', name: 'Drowned', blurb: 'The Veil Coast and the flooded parish. Salt bloom to the waterline, weed below it.',
    tint: '#4e6b6d', tintAmount: 0.26, roughShift: -0.06, region: 'veil_coast_frontier',
  },
];

export const WEAR_TIERS = [
  { id: 'kept', name: 'Kept', density: 0.35, desat: 0.0, rough: 0.0 },
  { id: 'worked', name: 'Worked', density: 0.75, desat: 0.08, rough: 0.05 },
  { id: 'neglected', name: 'Neglected', density: 1.25, desat: 0.18, rough: 0.12 },
  { id: 'ruined', name: 'Ruined', density: 2.0, desat: 0.3, rough: 0.2 },
];

/* Retinted materials are cached by (materialName, biome, wear) so a thousand
   finished assets share a handful of materials and the draw-call count does
   not explode. */
const tintCache = new Map();
function finishedMaterial(src, biome, wear) {
  const key = src.name + '|' + biome.id + '|' + wear.id;
  if (tintCache.has(key)) return tintCache.get(key);
  const m = src.clone();
  m.name = src.name + '-' + biome.id + (wear.id === 'kept' ? '' : '-' + wear.id);
  const t = new THREE.Color(biome.tint);
  m.color.lerp(t, biome.tintAmount * (0.7 + wear.density * 0.3));
  // Wear desaturates toward the biome's own grey rather than toward white —
  // nothing in this world gets brighter as it ages.
  if (wear.desat > 0) {
    const l = m.color.r * 0.3 + m.color.g * 0.59 + m.color.b * 0.11;
    m.color.lerp(new THREE.Color(l * 0.9, l * 0.9, l * 0.88), wear.desat);
  }
  // Roughness is capped below 1.0 so two wear tiers can never both clamp to
  // exactly 1.00 and become materially identical — that was a real bug. Most
  // of this kit's materials are already matte, so roughness is a weak channel
  // for wear: the structural expression lives in hm-wear.js instead.
  const base = m.roughness ?? 0.8;
  m.roughness = Math.max(0.05, Math.min(0.97, base + biome.roughShift + wear.rough * 0.5));
  tintCache.set(key, m);
  return m;
}

/* -------------------------------------------------------------- overlays
 * Each returns a Group placed in the asset's own local space, using the
 * asset's bounding box so no generator needs biome awareness. */

/** Snow load and icicles. Snow sits on upward faces; icicles hang from the
 *  edges of whatever the snow is sitting on. */
function rimeOverlay(bb, size, rand, density) {
  const g = new THREE.Group();
  g.name = 'rime-finish';
  const caps = Math.round(6 * density) + 2;
  const snow = new THREE.MeshStandardMaterial({ color: new THREE.Color('#c8d2d4'), roughness: 0.92, metalness: 0 });
  snow.name = 'snow-load';
  const ice = new THREE.MeshStandardMaterial({ color: new THREE.Color('#8fa8b0'), roughness: 0.18, metalness: 0.04, transparent: true, opacity: 0.72 });
  ice.name = 'rime-ice';

  for (let i = 0; i < caps; i++) {
    const r = (0.06 + rand() * 0.12) * Math.max(size.x, size.z);
    const c = ico(Math.min(r, size.x * 0.4), 0);
    c.scale(1.5, 0.34, 1.4);
    jitter(c, r * 0.3, rand);
    g.add(part(c, snow, 'snow-cap-' + i, {
      pos: [bb.min.x + rand() * size.x, bb.max.y - rand() * size.y * 0.12, bb.min.z + rand() * size.z],
    }));
  }
  const spikes = Math.round(7 * density) + 2;
  for (let i = 0; i < spikes; i++) {
    const len = (0.08 + rand() * 0.22) * size.y;
    const edgeX = rand() > 0.5 ? bb.min.x : bb.max.x;
    const useX = rand() > 0.5;
    g.add(part(cone(0.012 + rand() * 0.016, len, 5, 1), ice, 'icicle-' + i, {
      pos: [
        useX ? edgeX : bb.min.x + rand() * size.x,
        bb.max.y - rand() * size.y * 0.35 - len / 2,
        useX ? bb.min.z + rand() * size.z : (rand() > 0.5 ? bb.min.z : bb.max.z),
      ],
      rot: [Math.PI, 0, (rand() - 0.5) * 0.2],
    }));
  }
  return g;
}

/** Cooled slag crust with live cracks. Slag pools low and climbs a little. */
function forgeOverlay(bb, size, rand, density) {
  const g = new THREE.Group();
  g.name = 'forge-finish';
  const slag = new THREE.MeshStandardMaterial({ color: new THREE.Color('#1c1615'), roughness: 0.38, metalness: 0.14 });
  slag.name = 'slag-crust';
  const hot = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#3a1a0e'), roughness: 0.6, metalness: 0,
    emissive: new THREE.Color('#df6e32'), emissiveIntensity: 1.7,
  });
  hot.name = 'live-crack';

  const lumps = Math.round(8 * density) + 3;
  for (let i = 0; i < lumps; i++) {
    const r = (0.07 + rand() * 0.14) * Math.max(size.x, size.z);
    const c = ico(Math.min(r, size.x * 0.45), 0);
    c.scale(1.6, 0.5, 1.5);
    jitter(c, r * 0.36, rand);
    g.add(part(c, slag, 'slag-lump-' + i, {
      pos: [bb.min.x + rand() * size.x, bb.min.y + rand() * size.y * 0.28, bb.min.z + rand() * size.z],
    }));
  }
  // Live cracks: thin emissive slivers, always in the lower third.
  const cracks = Math.round(4 * density) + 1;
  for (let i = 0; i < cracks; i++) {
    g.add(part(box(0.02 + rand() * 0.02, 0.008, (0.1 + rand() * 0.2) * size.z), hot, 'live-crack-' + i, {
      pos: [bb.min.x + rand() * size.x, bb.min.y + rand() * size.y * 0.2, bb.min.z + rand() * size.z],
      rot: [0, rand() * Math.PI, 0],
    }));
  }
  // Heat drips off the lowest edge.
  for (let i = 0; i < Math.round(3 * density); i++) {
    g.add(part(cone(0.014, 0.06 + rand() * 0.1, 5, 1), slag, 'slag-drip-' + i, {
      pos: [bb.min.x + rand() * size.x, bb.min.y + 0.02, bb.min.z + rand() * size.z], rot: [Math.PI, 0, 0],
    }));
  }
  return g;
}

/** Vines, leaf pads and root creep. Vines climb the tallest axis. */
function verdantOverlay(bb, size, rand, density) {
  const g = new THREE.Group();
  g.name = 'verdant-finish';
  const vine = new THREE.MeshStandardMaterial({ color: new THREE.Color('#3d4a34'), roughness: 0.92, metalness: 0 });
  vine.name = 'vine-stem';
  const leaf = new THREE.MeshStandardMaterial({ color: new THREE.Color('#5b7350'), roughness: 0.86, metalness: 0 });
  leaf.name = 'leaf-pad';

  const runs = Math.round(3 * density) + 1;
  for (let r = 0; r < runs; r++) {
    // A vine is a stack of short segments spiralling up one face — cheap, and
    // it reads as growth rather than as a drawn line.
    const segs = Math.round(5 + rand() * 5);
    const faceX = bb.min.x + rand() * size.x;
    const faceZ = rand() > 0.5 ? bb.min.z : bb.max.z;
    const phase = rand() * Math.PI * 2;
    for (let i = 0; i < segs; i++) {
      const t = i / segs;
      g.add(part(limb(0.012, 0.016, (size.y / segs) * 1.2, 5, 1), vine, 'vine-' + r + '-' + i, {
        pos: [faceX + Math.sin(phase + t * 5) * size.x * 0.18, bb.min.y + t * size.y * 0.95, faceZ + Math.cos(phase + t * 5) * size.z * 0.08],
        rot: [(rand() - 0.5) * 0.5, 0, Math.sin(phase + t * 5) * 0.5],
      }));
      if (i % 2 === 0) {
        const l = ico(0.035 + rand() * 0.03, 0);
        l.scale(1.6, 0.25, 1.2);
        g.add(part(l, leaf, 'leaf-' + r + '-' + i, {
          pos: [faceX + Math.sin(phase + t * 5) * size.x * 0.22, bb.min.y + t * size.y * 0.95, faceZ + Math.cos(phase + t * 5) * size.z * 0.14],
          rot: [(rand() - 0.5) * 0.8, rand() * Math.PI * 2, (rand() - 0.5) * 0.8],
        }));
      }
    }
  }
  // Root creep and moss pads at the foot.
  for (let i = 0; i < Math.round(6 * density) + 2; i++) {
    const p = ico((0.05 + rand() * 0.08) * Math.max(size.x, size.z), 0);
    p.scale(1.7, 0.28, 1.5);
    jitter(p, 0.02, rand);
    g.add(part(p, leaf, 'moss-pad-' + i, {
      pos: [bb.min.x + rand() * size.x, bb.min.y + 0.02, bb.min.z + rand() * size.z], rot: [0, rand() * Math.PI, 0],
    }));
  }
  return g;
}

/** Salt bloom above a waterline, weed and barnacle below it. */
function drownedOverlay(bb, size, rand, density) {
  const g = new THREE.Group();
  g.name = 'drowned-finish';
  const salt = new THREE.MeshStandardMaterial({ color: new THREE.Color('#a9a89a'), roughness: 0.95, metalness: 0 });
  salt.name = 'salt-bloom';
  const weed = new THREE.MeshStandardMaterial({ color: new THREE.Color('#3a4a42'), roughness: 0.9, metalness: 0 });
  weed.name = 'blackwater-weed';

  // The waterline is the single most legible thing about a drowned object.
  const line = bb.min.y + size.y * (0.2 + rand() * 0.16);
  for (let i = 0; i < Math.round(9 * density) + 3; i++) {
    const c = ico((0.03 + rand() * 0.06) * Math.max(size.x, size.z), 0);
    c.scale(1.5, 0.4, 1.4);
    jitter(c, 0.015, rand);
    g.add(part(c, salt, 'salt-' + i, {
      pos: [bb.min.x + rand() * size.x, line + rand() * size.y * 0.1, bb.min.z + rand() * size.z],
    }));
  }
  for (let i = 0; i < Math.round(7 * density) + 2; i++) {
    const len = 0.08 + rand() * 0.18;
    g.add(part(limb(0.006, 0.012, len, 4, 1), weed, 'weed-' + i, {
      pos: [bb.min.x + rand() * size.x, bb.min.y + rand() * (line - bb.min.y), bb.min.z + rand() * size.z],
      rot: [(rand() - 0.5) * 1.4, rand() * Math.PI, (rand() - 0.5) * 1.4],
    }));
  }
  for (let i = 0; i < Math.round(5 * density); i++) {
    g.add(part(cone(0.018 + rand() * 0.014, 0.026, 6, 1), salt, 'barnacle-' + i, {
      pos: [bb.min.x + rand() * size.x, bb.min.y + rand() * (line - bb.min.y), bb.min.z + rand() * size.z],
      rot: [(rand() - 0.5) * 1.2, 0, (rand() - 0.5) * 1.2],
    }));
  }
  return g;
}

/** Ash drift. The baseline finish, so it stays quiet on purpose. */
function ashOverlay(bb, size, rand, density) {
  const g = new THREE.Group();
  g.name = 'ash-finish';
  const ash = new THREE.MeshStandardMaterial({ color: new THREE.Color('#5f5c56'), roughness: 0.98, metalness: 0 });
  ash.name = 'ash-drift';
  for (let i = 0; i < Math.round(5 * density) + 1; i++) {
    const d = ico((0.07 + rand() * 0.1) * Math.max(size.x, size.z), 0);
    d.scale(1.8, 0.22, 1.6);
    jitter(d, 0.02, rand);
    g.add(part(d, ash, 'drift-' + i, {
      pos: [bb.min.x + rand() * size.x, bb.min.y + 0.015, bb.min.z + rand() * size.z], rot: [0, rand() * Math.PI, 0],
    }));
  }
  return g;
}

const OVERLAYS = { ash: ashOverlay, forge: forgeOverlay, rime: rimeOverlay, verdant: verdantOverlay, drowned: drownedOverlay };

/**
 * Apply a biome finish to a freshly built asset, in place.
 * @param group  a Group straight out of a generator
 * @param biomeId  one of BIOMES
 * @param wearId   one of WEAR_TIERS
 * @param seed     stable per (asset, biome, wear) so the finish is reproducible
 */
export function applyFinish(group, biomeId, wearId, seed = 0) {
  const biome = BIOMES.find((b) => b.id === biomeId) || BIOMES[0];
  const wear = WEAR_TIERS.find((w) => w.id === wearId) || WEAR_TIERS[0];
  const rand = rnd(0xf1 + seed * 2657 + biome.id.length * 131 + wear.id.length * 17);

  // Measure BEFORE adding overlays, or the overlay places against itself.
  const bb = new THREE.Box3().setFromObject(group);
  const size = bb.getSize(new THREE.Vector3());

  group.traverse((o) => {
    if (o.isMesh && o.material && o.material.name) o.material = finishedMaterial(o.material, biome, wear);
  });
  if (size.x > 0) group.add(OVERLAYS[biome.id](bb, size, rand, wear.density));
  group.userData.finish = { biome: biome.id, wear: wear.id };
  return group;
}

export const FINISH_MULTIPLIER = BIOMES.length * WEAR_TIERS.length;
