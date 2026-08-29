/* Hearthmere flora — five foliage assets from packages/content/manifests/
 * hearthmere.assets.json, plus one proposed cross-region tree.
 *
 * Every builder is authored against its manifest row: the declared
 * lodTriangles[0] ceiling, the declared material slot count, and the declared
 * heightRange. Segment counts are chosen to sit UNDER budget, not to fill it.
 *
 *   hm.foliage.blackpine-sapling  2100 tris · conifer     · 2.4–4.8 m
 *   hm.foliage.steam-moss          640 tris · ground-clump · 0.08–0.22 m
 *   hm.foliage.ridge-heather       980 tris · bush         · 0.3–0.7 m
 *   hm.foliage.cold-reed-clump     760 tris · reed         · 0.8–1.8 m
 *   hm.foliage.wall-lichen-gray    420 tris · wall-patch   · 0.1–0.4 m
 */
import { THREE, MAT, rnd, jitter, lean, part, limb, seat, thin, cnt, ico, cone, torus, cyl } from './hm-core.js';

const T = Math.PI * 2;

/* A squashed low-poly blob is the whole trick behind stylised needle mass:
   read as foliage at silhouette scale, costs 20 or 80 tris. `flat` controls
   how plate-like the mass is — outer boughs are flatter than inner ones. */
function needleClump(r, detail, rand, flat = 0.42) {
  const g = ico(r, detail);
  g.scale(1.15 + rand() * 0.3, flat, 1.15 + rand() * 0.3);
  jitter(g, r * 0.36, rand);
  return g;
}
/* Place a needle mass so its outer edge droops — conifer boughs hang, and a
   ring of level discs is the single thing that makes a procedural tree look
   procedural. */
function bough(g, name, geo, mat, a, rad, y, droop, off) {
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  m.position.set(Math.cos(a) * rad + off[0], y, Math.sin(a) * rad + off[1]);
  m.rotation.set(Math.sin(a) * droop, a, -Math.cos(a) * droop);
  g.add(m);
}

/* ---------------------------------------------------------------- sapling */
export function blackpineSapling() {
  const rand = rnd(0x51ab1e);
  const g = new THREE.Group();
  g.name = 'blackpine-sapling';
  const H = 4.2; // mid of the declared 2.4–4.8 range

  // Trunk: open-ended (caps never seen), leaning downwind at the declared
  // wind 0.25, and jittered so no silhouette edge is a straight line.
  const trunk = limb(0.042, 0.125, H * 0.95, 9, 6);
  lean(trunk, 0.26, 0.09, 2.1);
  jitter(trunk, 0.018, rand);
  g.add(part(trunk, MAT.pineBark, 'trunk', { pos: [0, (H * 0.95) / 2, 0] }));

  // Root flare — four cones half-buried, the cheapest way to stop a tree
  // looking like a pole pushed into the ground.
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * T + 0.4;
    const root = cone(0.075, 0.32, 6, 1);
    jitter(root, 0.02, rand);
    g.add(
      part(root, MAT.pineBark, 'root-flare-' + i, {
        pos: [Math.cos(a) * 0.11, 0.1, Math.sin(a) * 0.11],
        rot: [Math.cos(a) * 0.55, 0, -Math.sin(a) * 0.55],
      })
    );
  }

  // Bare lower branches. Black pine sheds its lower limbs — the naked
  // bottom third is the species' silhouette and it reads at 40 m.
  const bare = [
    [1.05, 0.5, 0.62, -0.34],
    [1.34, 2.6, 0.5, -0.2],
    [1.62, 4.1, 0.7, -0.44],
    [1.95, 1.6, 0.44, -0.16],
    [2.24, 3.4, 0.66, -0.38],
    [2.5, 5.4, 0.4, -0.12],
    [2.72, 0.9, 0.58, -0.5],
  ];
  bare.slice(0, cnt(bare.length)).forEach(([y, a, len, droop], i) => {
    const br = limb(0.007, 0.026, len, 5, 2);
    lean(br, 0, 0, 1);
    jitter(br, 0.012, rand);
    const m = part(br, MAT.pineBark, 'bare-branch-' + i, {
      pos: [Math.cos(a) * len * 0.42, y, Math.sin(a) * len * 0.42],
      rot: [Math.PI / 2 + droop, 0, -a],
    });
    m.rotation.set(0, -a, Math.PI / 2 + droop);
    m.position.set(Math.cos(a) * len * 0.44, y, Math.sin(a) * len * 0.44);
    g.add(m);
  });

  // Canopy: four tiers, widest low, gapped so sky shows through, and every
  // mass drooping at its outer edge.
  const tiers = [
    { y: 2.42, r: 0.95, n: 7, big: 4, flat: 0.3, droop: 0.5 },
    { y: 2.92, r: 0.78, n: 6, big: 3, flat: 0.34, droop: 0.42 },
    { y: 3.36, r: 0.56, n: 5, big: 2, flat: 0.38, droop: 0.32 },
    { y: 3.78, r: 0.32, n: 3, big: 2, flat: 0.44, droop: 0.2 },
  ];
  let ci = 0;
  tiers.forEach((t, ti) => {
    const N = cnt(t.n);
    for (let i = 0; i < N; i++) {
      const a = (i / N) * T + ti * 0.74 + rand() * 0.34;
      const rad = t.r * (0.6 + rand() * 0.4);
      const big = i < t.big;
      const size = big ? 0.28 + rand() * 0.09 : 0.16 + rand() * 0.07;
      bough(g, 'needle-mass-' + ci++, needleClump(size, big ? 1 : 0, rand, t.flat),
        MAT.pineNeedle, a, rad, t.y + (rand() - 0.5) * 0.18, t.droop * (0.7 + rand() * 0.6), [0.2, 0.07]);
    }
  });

  // Sprigs bridge trunk and canopy so the masses do not float.
  for (let i = 0; i < cnt(10); i++) {
    const a = rand() * T;
    const y = 2.4 + rand() * 1.45;
    const sp = cone(0.055, 0.26, 5, 1);
    jitter(sp, 0.02, rand);
    g.add(
      part(sp, MAT.pineNeedle, 'sprig-' + i, {
        pos: [Math.cos(a) * 0.3 + 0.18, y, Math.sin(a) * 0.3 + 0.06],
        rot: [Math.PI / 2 - 0.5 + rand() * 0.5, -a, 0],
      })
    );
  }

  // Snapped leader — every black pine in the Reach has lost its top.
  const spire = limb(0.006, 0.026, 0.34, 6, 1);
  lean(spire, 0.1, 0.03, 1.4);
  g.add(part(spire, MAT.pineBark, 'snapped-leader', { pos: [0.27, 4.13, 0.1] }));

  return seat(g);
}

/* ----------------------------------------------- proposed: mature blackpine
 * Not in hearthmere.assets.json. It belongs to the graven_march kit
 * (worldAssets.js → foliage "blackpine_mature") and GATHER_NODES declares
 * node_blackpine_01 "Harvestable Black Pine" with no asset record anywhere.
 * Sized as a hero-class tree; budget proposed at 7,000 / 2,600 / 900.        */
export function blackpineMature() {
  const rand = rnd(0x7bade3);
  const g = new THREE.Group();
  g.name = 'blackpine-mature';
  const H = 9.4;

  const trunk = limb(0.14, 0.46, H * 0.86, 14, 10);
  lean(trunk, 0.62, -0.24, 2.2);
  jitter(trunk, 0.045, rand);
  g.add(part(trunk, MAT.pineBark, 'trunk', { pos: [0, (H * 0.86) / 2, 0] }));

  // Buttress roots gripping cairn stone.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * T + 0.3;
    const root = cone(0.2, 0.95, 7, 2);
    jitter(root, 0.07, rand);
    g.add(
      part(root, MAT.pineBark, 'buttress-root-' + i, {
        pos: [Math.cos(a) * 0.34, 0.3, Math.sin(a) * 0.34],
        rot: [Math.cos(a) * 0.72, 0, -Math.sin(a) * 0.72],
      })
    );
  }

  // Woodcutting face — the flat cut that tells the player this is a node.
  const cut = new THREE.BoxGeometry(0.5, 0.3, 0.24, 2, 1, 1);
  jitter(cut, 0.02, rand);
  g.add(part(cut, MAT.heartwood, 'woodcut-face', { pos: [0.19, 0.62, 0.3], rot: [0, 0.28, 0.1] }));

  const bare = [
    [2.3, 0.4, 1.6], [2.75, 2.5, 1.2], [3.2, 4.3, 1.85], [3.6, 1.4, 1.35],
    [4.05, 3.3, 1.7], [4.5, 5.5, 1.25], [4.95, 0.8, 1.55], [5.35, 2.2, 1.1],
    [5.75, 4.8, 1.45], [6.15, 1.1, 1.15], [6.5, 3.7, 1.3], [6.9, 5.9, 0.95],
  ];
  bare.slice(0, cnt(bare.length)).forEach(([y, a, len], i) => {
    const br = limb(0.022, 0.08, len, 6, 3);
    lean(br, 0, 0.2, 1.6);
    jitter(br, 0.03, rand);
    const m = new THREE.Mesh(br, MAT.pineBark);
    m.name = 'limb-' + i;
    m.rotation.set(0, -a, Math.PI / 2 + (i % 3 === 0 ? -0.5 : -0.28));
    m.position.set(Math.cos(a) * len * 0.42, y, Math.sin(a) * len * 0.42);
    g.add(m);
  });

  // Canopy: five tiers reaching down over the upper limbs, so needle mass and
  // bare wood interlock instead of sitting in two separate bands.
  const tiers = [
    { y: 5.25, r: 2.55, n: 11, big: 7, flat: 0.26, droop: 0.58 },
    { y: 6.15, r: 2.25, n: 10, big: 6, flat: 0.29, droop: 0.5 },
    { y: 6.95, r: 1.85, n: 8, big: 5, flat: 0.33, droop: 0.42 },
    { y: 7.7, r: 1.35, n: 6, big: 4, flat: 0.38, droop: 0.32 },
    { y: 8.3, r: 0.85, n: 4, big: 3, flat: 0.44, droop: 0.22 },
  ];
  let ci = 0;
  tiers.forEach((t, ti) => {
    const N = cnt(t.n);
    for (let i = 0; i < N; i++) {
      const a = (i / N) * T + ti * 0.61 + rand() * 0.32;
      const rad = t.r * (0.58 + rand() * 0.42);
      const big = i < t.big;
      const size = big ? 0.52 + rand() * 0.22 : 0.3 + rand() * 0.12;
      bough(g, 'needle-mass-' + ci++, needleClump(size, big ? 1 : 0, rand, t.flat),
        MAT.pineNeedle, a, rad, t.y + (rand() - 0.5) * 0.34, t.droop * (0.7 + rand() * 0.6), [0.5, -0.2]);
    }
  });

  // Infill clumps break the tier banding and fill the gaps light finds.
  for (let i = 0; i < cnt(18); i++) {
    const a = rand() * T;
    const rad = 0.4 + rand() * 1.9;
    bough(g, 'infill-mass-' + i, needleClump(0.18 + rand() * 0.12, 0, rand, 0.34),
      MAT.pineNeedle, a, rad, 5.1 + rand() * 3.4, 0.4 + rand() * 0.5, [0.5, -0.2]);
  }

  // Sprigs on the bare limbs — new growth on old wood.
  for (let i = 0; i < cnt(14); i++) {
    const a = rand() * T;
    const sp = cone(0.1, 0.42, 6, 1);
    jitter(sp, 0.035, rand);
    g.add(part(sp, MAT.pineNeedle, 'limb-sprig-' + i, {
      pos: [Math.cos(a) * (0.7 + rand() * 0.7) + 0.3, 3.2 + rand() * 2.4, Math.sin(a) * (0.7 + rand() * 0.7)],
      rot: [Math.PI / 2 - 0.6 + rand() * 0.5, -a, 0],
    }));
  }

  const spire = limb(0.02, 0.09, 1.0, 7, 2);
  lean(spire, 0.2, -0.1, 1.5);
  jitter(spire, 0.03, rand);
  g.add(part(spire, MAT.pineBark, 'dead-spire', { pos: [0.55, 8.6, -0.2] }));

  return seat(g);
}

/* ------------------------------------------------------------- steam moss
 * One material slot, so the asset is moss and nothing else — it instances
 * onto the spring limestone rather than shipping its own rock.            */
export function steamMoss() {
  const rand = rnd(0x9033aa);
  const g = new THREE.Group();
  g.name = 'steam-moss';
  const cushions = [
    [0, 0, 0.2, 1],
    [0.23, 0.14, 0.15, 1],
    [-0.19, 0.09, 0.13, 1],
    [0.09, -0.22, 0.14, 1],
    [-0.14, -0.17, 0.11, 1],
    [0.31, -0.08, 0.075, 0],
    [-0.3, -0.02, 0.07, 0],
    [0.16, 0.28, 0.065, 0],
    [-0.07, 0.26, 0.06, 0],
    [0.03, -0.33, 0.055, 0],
    [-0.26, 0.2, 0.05, 0],
    [0.26, -0.26, 0.05, 0],
    [-0.34, -0.14, 0.045, 0],
  ];
  cushions.slice(0, cnt(cushions.length)).forEach(([x, z, r, detail], i) => {
    const c = ico(r, detail);
    c.scale(1.3, 0.5, 1.2);
    jitter(c, r * 0.3, rand);
    g.add(
      part(c, MAT.graveMoss, 'moss-cushion-' + i, {
        pos: [x, r * 0.24, z],
        rot: [0, rand() * T, 0],
      })
    );
  });
  return seat(g);
}

/* ---------------------------------------------------------- ridge heather */
export function ridgeHeather() {
  const rand = rnd(0x4e17e2);
  const g = new THREE.Group();
  g.name = 'ridge-heather';

  const crown = ico(0.085, 0);
  crown.scale(1.4, 0.55, 1.3);
  jitter(crown, 0.03, rand);
  g.add(part(crown, MAT.heatherBloom, 'woody-crown', { pos: [0, 0.03, 0] }));

  // Woody stems fan outward and up — the heather habit, wind 0.4 downwind.
  const STEMS = cnt(11);
  for (let i = 0; i < STEMS; i++) {
    const a = (i / STEMS) * T + rand() * 0.5;
    const len = 0.3 + rand() * 0.24;
    const st = limb(0.004, 0.013, len, 4, 2);
    lean(st, 0.09, 0.03, 1.5);
    jitter(st, 0.008, rand);
    const m = new THREE.Mesh(st, MAT.heatherBloom);
    m.name = 'stem-' + i;
    const tilt = 0.3 + rand() * 0.3;
    m.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt);
    m.position.set(Math.cos(a) * 0.05, len * 0.46, Math.sin(a) * 0.05);
    g.add(m);

    // Bloom spike at the stem tip, plus a mid-stem cluster.
    for (let b = 0; b < 2; b++) {
      const t = b ? 0.62 : 0.98;
      const bl = ico(b ? 0.026 : 0.034, 0);
      bl.scale(0.8, 1.5, 0.8);
      jitter(bl, 0.01, rand);
      g.add(
        part(bl, MAT.heatherBloom, 'bloom-' + i + '-' + b, {
          pos: [
            Math.cos(a) * (0.05 + len * tilt * t) ,
            len * t + 0.02,
            Math.sin(a) * (0.05 + len * tilt * t),
          ],
          rot: [0, rand() * T, (rand() - 0.5) * 0.4],
        })
      );
    }
  }

  // Dead lower spurs — heather keeps its dead wood.
  for (let i = 0; i < cnt(8); i++) {
    const a = rand() * T;
    const sp = cone(0.011, 0.07, 4, 1);
    g.add(
      part(sp, MAT.heatherBloom, 'dead-spur-' + i, {
        pos: [Math.cos(a) * 0.1, 0.05, Math.sin(a) * 0.1],
        rot: [Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1],
      })
    );
  }
  return seat(g);
}

/* -------------------------------------------------------- cold reed clump */
export function coldReedClump() {
  const rand = rnd(0x0cee4d);
  const g = new THREE.Group();
  g.name = 'cold-reed-clump';

  for (let i = 0; i < cnt(17); i++) {
    const a = rand() * T;
    const rad = rand() * 0.16;
    const len = 0.82 + rand() * 0.86; // declared 0.8–1.8 m
    // A blade is a tapered, bowed box — cheaper than a plane pair and it
    // catches the key light on one face, which is what sells reeds.
    const bl = new THREE.BoxGeometry(0.019, len, 0.005, 1, 4, 1);
    const p = bl.attributes.position;
    for (let v = 0; v < p.count; v++) {
      const t = (p.getY(v) + len / 2) / len;
      p.setX(v, p.getX(v) * (1 - t * 0.75)); // taper to a point
      p.setZ(v, p.getZ(v) + t * t * (0.1 + rand() * 0.22)); // wind bow, 0.6
    }
    p.needsUpdate = true;
    bl.computeVertexNormals();
    g.add(
      part(bl, MAT.reedPale, 'blade-' + i, {
        pos: [Math.cos(a) * rad, len / 2, Math.sin(a) * rad],
        rot: [0, a, (rand() - 0.5) * 0.22],
      })
    );
  }

  // Four seed heads, the only silhouette break in a reed clump.
  for (let i = 0; i < cnt(4); i++) {
    const a = rand() * T;
    const h = 1.05 + rand() * 0.5;
    const sh = ico(0.022, 0);
    sh.scale(0.7, 2.6, 0.7);
    jitter(sh, 0.008, rand);
    g.add(
      part(sh, MAT.reedPale, 'seed-head-' + i, {
        pos: [Math.cos(a) * 0.1 + 0.12, h, Math.sin(a) * 0.1 + 0.1],
        rot: [0.3, rand() * T, 0.2],
      })
    );
  }
  return seat(g);
}

/* -------------------------------------------------------- wall lichen
 * A wall-patch asset: flat plates on the XY plane, meant to be projected
 * onto masonry. Height range 0.1–0.4 is the patch spread, not a thickness. */
export function wallLichenGray() {
  const rand = rnd(0x11c4e0);
  const g = new THREE.Group();
  g.name = 'wall-lichen-gray';

  const plates = [
    [0, 0, 0.085, 6],
    [0.13, 0.07, 0.062, 6],
    [-0.11, 0.05, 0.055, 6],
    [0.05, -0.12, 0.058, 6],
    [-0.09, -0.1, 0.048, 6],
    [0.18, -0.05, 0.04, 6],
    [-0.18, 0.11, 0.036, 6],
    [0.09, 0.16, 0.033, 6],
    [-0.05, 0.18, 0.03, 6],
    [0.2, 0.1, 0.026, 5],
    [-0.2, -0.06, 0.024, 5],
    [0.02, -0.2, 0.022, 5],
    [0.15, -0.16, 0.018, 4],
    [-0.15, -0.17, 0.016, 4],
    [0.24, 0.0, 0.015, 4],
    [-0.23, 0.03, 0.014, 4],
    [0.11, 0.23, 0.013, 4],
    [-0.02, 0.25, 0.012, 4],
    [0.26, -0.11, 0.011, 4],
    [-0.26, -0.13, 0.01, 4],
  ];
  plates.slice(0, cnt(plates.length)).forEach(([x, y, r, seg], i) => {
    // Crusty, slightly domed plates — 0.008 m of relief is all lichen has.
    const pl = cyl(r, r * 0.86, 0.008, seg, 1);
    jitter(pl, r * 0.22, rand);
    g.add(
      part(pl, MAT.lichenGrey, 'lichen-plate-' + i, {
        pos: [x, y, 0.004 + i * 0.0004],
        rot: [Math.PI / 2, rand() * T, 0],
      })
    );
  });
  return thin(g);
}
