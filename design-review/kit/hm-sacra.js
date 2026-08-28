/* Bells, graves and reliquaries — parametric.
 *
 * This is the most load-bearing module in the kit, because the bell is not
 * decoration in this world, it is the premise. WORLD.premise says every
 * settlement survives by ringing a consecrated bell at dusk; the region is
 * "The Veyl of the Last Bell"; Cinderward exists to alloy bell-metal;
 * Hollow Abbey's clergy tended the First Bell; Torren Vale carries a ruined
 * bell's clapper as a mace; the abbey's mechanic is resonant urns.
 *
 * So a bell here is not a generic prop with a swinging clapper. Every axis
 * is a fiction axis: whether it is cracked, whether it still has a tongue,
 * whether it was cast royal or parish. `hearthmere` ambience says the bell
 * "never rings twice alike" — the crack axis is why.
 *
 * Funerary follows from the same source. Hearthmere burns names into clay
 * tablets so the ash cannot forget the dead; the Graven March is cairns whose
 * stones are warm; Hollow Abbey is urns and a crypt. Those are four distinct
 * grave languages, not one.
 */
import {
  THREE, rnd, jitter, lean, squash, part, lathe, limb, torus, cone, cyl, ico,
  ring, chain, sg, cnt, thin, seat,
} from './hm-core.js';
import { axesOf } from './hm-steam.js';

const box = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);
const T = Math.PI * 2;

/* Metalness stays at or below 0.2 for the reason established in hm-steam.js:
   with no environment map in the scene, high metalness has nothing to
   reflect and reads as wet plastic rather than metal. Bell-bronze gets its
   read from colour separation between cast surface, worn lip and verdigris. */
const M = (name, color, rough, metal = 0.16) => {
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: rough, metalness: metal });
  m.name = name;
  return m;
};

export const SACRA = {
  /* Bell-metal is a real alloy — high-tin bronze, and it is pale and slightly
     pink next to brass rather than yellow. That is the colour separation the
     foundry fiction is built on. */
  bellMetal: M('bell-metal', '#9a7f52', 0.44),
  bellWorn: M('bell-metal-worn', '#7d6743', 0.62),
  bellLip: M('bell-lip-struck', '#b49765', 0.34),
  verdigris: M('verdigris', '#3e655f', 0.72, 0.06),
  iron: M('wrought-iron', '#3a3f42', 0.74),
  ironRust: M('iron-rust', '#5f3c26', 0.9, 0.03),
  oak: M('bell-yoke-oak', '#3b3128', 0.88, 0.01),
  rope: M('bell-rope', '#6b5c46', 0.95, 0),
  /* Grave stone reads warmer than architecture stone — the March's cairn
     stones are described as warm to the touch, and Hearthmere's spring
     limestone is the pale one. */
  cairnStone: M('cairn-stone-warm', '#4b4741', 0.9, 0.01),
  graveStone: M('grave-limestone', '#63625b', 0.88, 0.01),
  graveDark: M('crypt-stone-black', '#2b2f31', 0.86, 0.02),
  clay: M('name-tablet-clay', '#6d5544', 0.93, 0),
  clayFired: M('clay-fired-dark', '#4a382c', 0.9, 0),
  glaze: M('urn-glaze', '#42504b', 0.4, 0.04),
  moss: M('grave-moss', '#41533f', 0.95, 0),
  mossPale: M('crypt-mold-white', '#8d9184', 0.96, 0),
  wax: M('vigil-wax', '#c8bda1', 0.72, 0),
  flame: new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e8a252'), roughness: 0.5,
    emissive: new THREE.Color('#e07a2a'), emissiveIntensity: 1.5,
  }),
  gold: M('reliquary-gilt', '#a8813d', 0.42, 0.2),
  glass: M('reliquary-glass', '#7f9aa2', 0.16, 0.02),
  bone: M('relic-bone', '#a49a83', 0.85, 0),
};
SACRA.flame.name = 'vigil-flame';

/* ------------------------------------------------------------------ bell
   A bell is a lathe, and the profile IS the instrument. Four cast profiles
   because four institutions cast them: the royal foundry, parish founders,
   a hand bell, and the great cracked one under the abbey. */

const BELL_PROFILES = {
  /* [radius, height] bottom to top. A real bell flares at the lip, waists,
     then shoulders out before the crown — a straight cone reads as a hat. */
  royal: [[0, 0], [0.52, 0], [0.54, 0.06], [0.5, 0.2], [0.44, 0.4], [0.4, 0.62], [0.38, 0.8], [0.3, 0.94], [0.14, 1.0], [0.1, 1.06]],
  parish: [[0, 0], [0.48, 0], [0.5, 0.05], [0.47, 0.18], [0.43, 0.38], [0.41, 0.6], [0.4, 0.78], [0.34, 0.9], [0.16, 0.97], [0.11, 1.02]],
  hand: [[0, 0], [0.4, 0], [0.42, 0.06], [0.36, 0.24], [0.3, 0.5], [0.27, 0.72], [0.22, 0.88], [0.1, 0.96], [0.06, 1.04]],
  great: [[0, 0], [0.62, 0], [0.64, 0.07], [0.6, 0.22], [0.52, 0.44], [0.46, 0.66], [0.43, 0.82], [0.33, 0.94], [0.15, 1.0], [0.11, 1.05]],
};

export const BELL_AXES = { profile: 4, mount: 3, metal: 3, crack: 3, clapper: 2, scale: 4, wear: 3 };
export function bell(variant = 0) {
  const A = axesOf(variant, BELL_AXES);
  const rand = rnd(0xbe11 + variant * 7717);
  const g = new THREE.Group();
  g.name = 'bell';

  const key = ['royal', 'parish', 'hand', 'great'][A.profile];
  const s = [0.55, 0.85, 1.25, 1.9][A.scale] * (key === 'hand' ? 0.42 : 1);
  const body = [SACRA.bellMetal, SACRA.bellWorn, SACRA.verdigris][A.metal];
  const h = 1.06 * s;

  const prof = BELL_PROFILES[key].map(([r, y]) => [r * s, y * s]);
  const shell = lathe(prof, sg(40));
  /* Cast bronze is not a perfect surface of revolution. A small jitter reads
     as sand-cast rather than machined, and costs nothing. */
  jitter(shell, 0.006 * s, rand);
  g.add(part(shell, body, 'bell-shell'));

  /* The lip is struck thousands of times and polishes. A separate ring in a
     brighter material is the whole reason a bell reads as bronze rather than
     as a grey cone. */
  const lipR = prof[1][0];
  g.add(part(torus(lipR * 0.99, 0.026 * s, 6, sg(36)), SACRA.bellLip, 'bell-lip',
    { pos: [0, 0.022 * s, 0], rot: [Math.PI / 2, 0, 0] }));

  /* Crown: the loops a bell actually hangs by. */
  const crown = new THREE.Group();
  crown.name = 'bell-crown';
  for (let i = 0; i < cnt(3); i++) {
    const a = (i / 3) * Math.PI;
    crown.add(part(torus(0.07 * s, 0.017 * s, 5, sg(14)), SACRA.bellMetal, `crown-loop-${i}`,
      { pos: [0, h + 0.05 * s, 0], rot: [0, a, Math.PI / 2] }));
  }
  g.add(crown);

  /* The crack. This is a fiction axis, not a damage decal: Hearthmere's bell
     "never rings twice alike", which is only true of a cracked bell. It is
     modelled as a wedge of removed metal, so it changes the silhouette from
     the side and can be seen through. */
  if (A.crack > 0) {
    const deep = A.crack === 2;
    const cw = (deep ? 0.09 : 0.035) * s;
    const cl = (deep ? 0.62 : 0.3) * s;
    const cg = box(cw, cl, 0.2 * s, 1, 3, 1);
    lean(cg, deep ? 0.22 : 0.1, 0, 1.4);
    const ca = rand() * T;
    g.add(part(cg, SACRA.graveDark, 'bell-crack',
      { pos: [Math.cos(ca) * lipR * 0.88, cl / 2 - 0.01, Math.sin(ca) * lipR * 0.88], rot: [0, -ca, 0] }));
  }

  /* Clapper — the tongue. Its absence is the abbey's entire mythology
     (clergy who cut out their own tongues; a "Clapper of Names" landmark),
     so "no tongue" is a first-class variant rather than a missing part. */
  if (A.clapper === 1) {
    const cl = new THREE.Group();
    cl.name = 'clapper';
    cl.add(part(cyl(0.014 * s, 0.014 * s, h * 0.52, sg(8)), SACRA.iron, 'clapper-shaft',
      { pos: [0, h * 0.72, 0] }));
    cl.add(part(ico(0.1 * s, 1), SACRA.ironRust, 'clapper-ball', { pos: [0, h * 0.44, 0] }));
    g.add(cl);
  }

  /* Mount: yoke on a frame, a chain, or nothing (a bell on the ground, being
     cast or being salvaged — Cinderward has a giant bell mould in its kit). */
  if (A.mount === 0) {
    const yoke = box(0.16 * s, 0.13 * s, lipR * 2.5, 1, 1, 3);
    jitter(yoke, 0.01 * s, rand);
    g.add(part(yoke, SACRA.oak, 'yoke', { pos: [0, h + 0.14 * s, 0] }));
    const postH = h + 0.7 * s;
    for (const sx of [-1, 1]) {
      g.add(part(box(0.11 * s, postH, 0.11 * s), SACRA.oak, `frame-post-${sx > 0 ? 'r' : 'l'}`,
        { pos: [0, postH / 2, sx * lipR * 1.5] }));
    }
    g.add(part(box(0.09 * s, 0.09 * s, lipR * 3.2), SACRA.oak, 'frame-head',
      { pos: [0, postH, 0] }));
    g.add(part(cyl(0.03 * s, 0.03 * s, 0.34 * s, sg(10)), SACRA.iron, 'headstock-pin',
      { pos: [0, h + 0.14 * s, 0], rot: [Math.PI / 2, 0, 0] }));
  } else if (A.mount === 1) {
    const ch = chain(cnt(6), 0.045 * s, 0.011 * s, SACRA.iron, 'hang-chain', rand);
    ch.position.set(0, h + 0.1 * s, 0);
    g.add(ch);
  }

  /* A rung bell has a rope. Hearthmere's kit names `rope_bell_small`. */
  if (A.mount === 0 && A.wear < 2) {
    const rp = cyl(0.012 * s, 0.012 * s, h * 0.9, sg(6));
    lean(rp, 0.1, 0.04, 1.2);
    g.add(part(rp, SACRA.rope, 'bell-rope', { pos: [lipR * 0.6, h * 0.45, 0] }));
  }

  if (A.wear === 2) {
    for (let i = 0; i < cnt(4); i++) {
      const a = rand() * T;
      const r = lipR * (0.5 + rand() * 0.45);
      g.add(part(squash(ico(0.055 * s * (0.6 + rand()), 0), 1, 0.45, 1), SACRA.verdigris,
        `verdigris-bloom-${i}`, { pos: [Math.cos(a) * r, h * (0.2 + rand() * 0.5), Math.sin(a) * r] }));
    }
  }
  return seat(g);
}

/* ------------------------------------------------------------------- urn
   Hollow Abbey's core mechanic is resonant urns the player breaks to remove
   voices from a choir attack. So an urn needs a boss scale and a small
   scale, and the lid state has to be legible from across a nave. */

export const URN_AXES = { form: 4, lid: 3, band: 3, glaze: 3, crack: 3, scale: 3 };
export function urn(variant = 0) {
  const A = axesOf(variant, URN_AXES);
  const rand = rnd(0x0072 + variant * 6421);
  const g = new THREE.Group();
  g.name = 'urn';

  const s = [0.6, 1, 1.7][A.scale];
  const forms = [
    /* burial: squat and wide */
    [[0, 0], [0.2, 0], [0.3, 0.06], [0.38, 0.24], [0.36, 0.44], [0.26, 0.58], [0.24, 0.66]],
    /* resonant: tall neck, the shape that rings */
    [[0, 0], [0.16, 0], [0.26, 0.08], [0.32, 0.3], [0.28, 0.56], [0.15, 0.72], [0.17, 0.84], [0.15, 0.9]],
    /* ossuary: straight-sided box-jar */
    [[0, 0], [0.24, 0], [0.26, 0.04], [0.26, 0.6], [0.24, 0.68], [0.26, 0.74]],
    /* tall: amphora without handles */
    [[0, 0], [0.1, 0], [0.22, 0.14], [0.3, 0.44], [0.24, 0.8], [0.13, 1.0], [0.16, 1.08]],
  ];
  const prof = forms[A.form].map(([r, y]) => [r * s, y * s]);
  const top = prof[prof.length - 1];
  const mat = [SACRA.clay, SACRA.clayFired, SACRA.glaze][A.glaze];

  const bodyGeo = lathe(prof, sg(28));
  jitter(bodyGeo, 0.008 * s, rand);
  g.add(part(bodyGeo, mat, 'urn-body'));

  /* A bronze inlay band is how the abbey's resonant urns are tuned —
     `bronze_inlay_resonant` is a declared surface in its region kit. */
  if (A.band > 0) {
    const bandY = top[1] * (A.band === 1 ? 0.55 : 0.8);
    const bandR = prof.reduce((best, p) => (Math.abs(p[1] - bandY) < Math.abs(best[1] - bandY) ? p : best))[0];
    g.add(part(torus(bandR * 1.01, 0.018 * s, 5, sg(24)), SACRA.verdigris, 'resonant-band',
      { pos: [0, bandY, 0], rot: [Math.PI / 2, 0, 0] }));
  }

  if (A.lid === 0) {
    g.add(part(lathe([[0, 0], [top[0] * 1.1, 0], [top[0] * 0.95, 0.05 * s], [0.05 * s, 0.11 * s], [0.04 * s, 0.15 * s]], sg(22)),
      mat, 'urn-lid', { pos: [0, top[1], 0] }));
  } else if (A.lid === 1) {
    /* Slid aside — the urn has been opened, and that reads instantly. */
    const l = lathe([[0, 0], [top[0] * 1.1, 0], [top[0] * 0.9, 0.05 * s]], sg(22));
    g.add(part(l, mat, 'urn-lid-displaced',
      { pos: [top[0] * 0.7, top[1] - 0.01 * s, top[0] * 0.3], rot: [0.34, rand() * T, 0.12] }));
  }

  if (A.crack > 0) {
    const n = A.crack === 2 ? cnt(5) : cnt(2);
    for (let i = 0; i < n; i++) {
      const a = rand() * T;
      const y = top[1] * (0.2 + rand() * 0.6);
      const r = prof.reduce((best, p) => (Math.abs(p[1] - y) < Math.abs(best[1] - y) ? p : best))[0];
      const c = box(0.012 * s, (0.1 + rand() * 0.22) * s, 0.03 * s, 1, 2, 1);
      lean(c, 0.3, 0, 1.3);
      g.add(part(c, SACRA.graveDark, `urn-crack-${i}`,
        { pos: [Math.cos(a) * r, y, Math.sin(a) * r], rot: [0, -a, rand() * 0.4 - 0.2] }));
    }
  }
  return seat(g);
}

/* ----------------------------------------------------------------- cairn
   The Graven March's grave language: stacked stones, warm to the touch,
   with candles. `cairn_ring`, `cairn_bowl`, `cairn_candles` are all declared
   in its region kit. A cairn is a *stack*, so lean and count carry it. */

export const CAIRN_AXES = { stack: 4, count: 4, stone: 3, candle: 2, moss: 3, lean: 3 };
export function cairn(variant = 0) {
  const A = axesOf(variant, CAIRN_AXES);
  const rand = rnd(0xca17 + variant * 5443);
  const g = new THREE.Group();
  g.name = 'cairn';

  const n = cnt([4, 7, 11, 16][A.count]);
  const mat = [SACRA.cairnStone, SACRA.graveStone, SACRA.graveDark][A.stone];
  const tilt = [0, 0.06, 0.14][A.lean];
  let y = 0;

  if (A.stack === 3) {
    /* Ring rather than tower — `cairn_ring`. */
    const R = 0.55 + n * 0.03;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * T;
      const sz = 0.16 + rand() * 0.12;
      const st = squash(ico(sz, 1), 1.1, 0.75, 1);
      jitter(st, sz * 0.22, rand);
      g.add(part(st, mat, `ring-stone-${i}`,
        { pos: [Math.cos(a) * R, sz * 0.6, Math.sin(a) * R], rot: [rand() * 0.4, rand() * T, rand() * 0.4] }));
    }
    y = 0.3;
  } else {
    /* Tower: stones shrink as they rise, which is what makes a stack read as
       deliberate rather than as rubble. */
    const base = [0.3, 0.26, 0.36][A.stack % 3];
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const sz = base * (1 - t * 0.62) * (0.82 + rand() * 0.36);
      const st = squash(ico(sz, 1), 1.15, 0.6 + rand() * 0.3, 1.05);
      jitter(st, sz * 0.24, rand);
      const off = tilt * i * 0.11;
      g.add(part(st, mat, `cairn-stone-${i}`, {
        pos: [Math.cos(i * 2.1) * off, y + sz * 0.4, Math.sin(i * 2.1) * off],
        rot: [rand() * 0.3, rand() * T, rand() * 0.3],
      }));
      y += sz * 0.72;
    }
  }

  /* Candles. `cairn_candles` is the March's declared practical light. */
  if (A.candle === 1) {
    for (let i = 0; i < cnt(3); i++) {
      const a = rand() * T;
      const r = 0.3 + rand() * 0.3;
      const ch = 0.1 + rand() * 0.12;
      g.add(part(cyl(0.022, 0.026, ch, sg(8)), SACRA.wax, `candle-${i}`,
        { pos: [Math.cos(a) * r, ch / 2, Math.sin(a) * r] }));
      g.add(part(cone(0.016, 0.05, sg(6)), SACRA.flame, `candle-flame-${i}`,
        { pos: [Math.cos(a) * r, ch + 0.03, Math.sin(a) * r] }));
    }
  }

  if (A.moss > 0) {
    for (let i = 0; i < cnt(A.moss * 3); i++) {
      const a = rand() * T;
      const r = rand() * 0.4;
      g.add(part(squash(ico(0.06 + rand() * 0.05, 0), 1.3, 0.3, 1.3), SACRA.moss, `cairn-moss-${i}`,
        { pos: [Math.cos(a) * r, 0.02 + rand() * y * 0.5, Math.sin(a) * r] }));
    }
  }
  return seat(g);
}

/* ------------------------------------------------------------- headstone */

export const HEADSTONE_AXES = { shape: 5, stone: 3, carve: 3, lean: 4, base: 2, moss: 3 };
export function headstone(variant = 0) {
  const A = axesOf(variant, HEADSTONE_AXES);
  const rand = rnd(0x4ead + variant * 4831);
  const g = new THREE.Group();
  g.name = 'headstone';

  const mat = [SACRA.graveStone, SACRA.cairnStone, SACRA.graveDark][A.stone];
  const w = 0.5 + rand() * 0.12;
  const h = [0.85, 1.05, 0.6, 1.3, 0.7][A.shape];
  const th = 0.11;
  let slab;

  if (A.shape === 0) {
    /* Round-topped: a lathe half is wrong here — a box plus a half-cylinder
       cap keeps the flat face flat, which is what carries an inscription. */
    slab = box(w, h - w / 2, th);
    g.add(part(slab, mat, 'stone-slab', { pos: [0, (h - w / 2) / 2, 0] }));
    g.add(part(cyl(w / 2, w / 2, th, sg(18), 1, false), mat, 'stone-cap',
      { pos: [0, h - w / 2, 0], rot: [Math.PI / 2, 0, 0] }));
  } else if (A.shape === 1) {
    slab = box(w, h, th);
    jitter(slab, 0.012, rand);
    g.add(part(slab, mat, 'stone-slab', { pos: [0, h / 2, 0] }));
    g.add(part(cone(w * 0.72, w * 0.42, 4), mat, 'stone-peak', { pos: [0, h + w * 0.2, 0], rot: [0, Math.PI / 4, 0] }));
  } else if (A.shape === 2) {
    /* Flat tablet, laid nearly prone. */
    slab = box(w * 1.3, h, th * 1.4);
    jitter(slab, 0.014, rand);
    g.add(part(slab, mat, 'grave-tablet', { pos: [0, h * 0.18, 0], rot: [1.32, 0, 0] }));
  } else if (A.shape === 3) {
    g.add(part(box(w * 0.34, h, th), mat, 'cross-upright', { pos: [0, h / 2, 0] }));
    g.add(part(box(w * 1.25, w * 0.32, th), mat, 'cross-arm', { pos: [0, h * 0.72, 0] }));
  } else {
    /* Broken — snapped off above the base. The break plane is jittered so it
       does not read as a clean saw cut. */
    const bh = h * (0.4 + rand() * 0.25);
    slab = box(w, bh, th, 2, 3, 1);
    const p = slab.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) > bh / 2 - 0.001) p.setY(i, p.getY(i) - rand() * 0.09);
    p.needsUpdate = true;
    slab.computeVertexNormals();
    g.add(part(slab, mat, 'stone-broken', { pos: [0, bh / 2, 0] }));
    const frag = squash(ico(w * 0.34, 0), 1.2, 0.4, 1);
    jitter(frag, 0.03, rand);
    g.add(part(frag, mat, 'stone-fragment', { pos: [w * 0.8, 0.06, rand() * 0.3 - 0.15], rot: [0.3, rand() * T, 0.4] }));
  }

  /* Carving as recessed rows, not as texture — an inscription has to read in
     silhouette at a raking angle or it may as well not be there. */
  if (A.carve > 0 && A.shape !== 4) {
    const rows = cnt(A.carve === 1 ? 2 : 4);
    for (let i = 0; i < rows; i++) {
      const cw = w * (0.44 + rand() * 0.3);
      g.add(part(box(cw, 0.035, 0.012), SACRA.graveDark, `inscription-${i}`,
        { pos: [(rand() - 0.5) * 0.05, h * (0.62 - i * 0.13), th / 2 + 0.004] }));
    }
  }

  if (A.base === 1) g.add(part(box(w * 1.4, 0.11, th * 2.1), mat, 'stone-base', { pos: [0, 0.055, 0] }));

  const tilt = [0, 0.07, 0.15, -0.11][A.lean];
  g.rotation.z = tilt;
  g.rotation.x = tilt * 0.4;

  if (A.moss > 0) {
    for (let i = 0; i < cnt(A.moss * 2); i++) {
      g.add(part(squash(ico(0.05 + rand() * 0.04, 0), 1.4, 0.3, 1), SACRA.moss, `moss-${i}`,
        { pos: [(rand() - 0.5) * w, rand() * h * 0.4, th / 2 * (rand() > 0.5 ? 1 : -1)] }));
    }
  }
  return seat(g);
}

/* ---------------------------------------------------------- sarcophagus */

export const SARC_AXES = { lid: 4, stone: 3, relief: 3, feet: 2, scale: 3, wear: 3 };
export function sarcophagus(variant = 0) {
  const A = axesOf(variant, SARC_AXES);
  const rand = rnd(0x5a2c + variant * 4001);
  const g = new THREE.Group();
  g.name = 'sarcophagus';

  const s = [0.85, 1, 1.2][A.scale];
  const L = 2.15 * s, W = 0.86 * s, H = 0.62 * s;
  const mat = [SACRA.graveStone, SACRA.graveDark, SACRA.cairnStone][A.stone];

  const chest = box(W, H, L, 1, 2, 3);
  jitter(chest, 0.012 * s, rand);
  g.add(part(chest, mat, 'sarcophagus-chest', { pos: [0, H / 2, 0] }));

  /* Relief panels stand *proud* of the chest rather than being carved into
     it — additive geometry is the only way to get a readable relief without
     a normal map, and the kit ships no normal maps. */
  if (A.relief > 0) {
    const n = cnt(A.relief === 1 ? 3 : 5);
    for (let i = 0; i < n; i++) {
      const z = -L / 2 + L * ((i + 0.5) / n);
      for (const sx of [-1, 1]) {
        g.add(part(box(0.02 * s, H * 0.5, L / n * 0.62), mat, `relief-${i}-${sx > 0 ? 'r' : 'l'}`,
          { pos: [sx * (W / 2 + 0.008 * s), H * 0.52, z] }));
      }
    }
  }

  if (A.lid === 0) {
    g.add(part(box(W * 1.06, 0.13 * s, L * 1.03), mat, 'lid-flat', { pos: [0, H + 0.065 * s, 0] }));
  } else if (A.lid === 1) {
    /* Effigy: a recumbent figure blocked in. Deliberately coarse — a carved
       effigy at prop budget is a silhouette, and pretending otherwise costs
       triangles that buy nothing at this distance. */
    g.add(part(box(W * 1.06, 0.1 * s, L * 1.03), mat, 'lid-flat', { pos: [0, H + 0.05 * s, 0] }));
    const ef = new THREE.Group();
    ef.name = 'effigy';
    ef.add(part(box(W * 0.5, 0.17 * s, L * 0.56), mat, 'effigy-torso', { pos: [0, 0.085 * s, -L * 0.06] }));
    ef.add(part(squash(ico(0.13 * s, 1), 0.9, 1.1, 0.9), mat, 'effigy-head', { pos: [0, 0.12 * s, -L * 0.4] }));
    ef.add(part(box(W * 0.42, 0.1 * s, L * 0.3), mat, 'effigy-legs', { pos: [0, 0.05 * s, L * 0.3] }));
    for (const sx of [-1, 1]) {
      ef.add(part(box(0.1 * s, 0.09 * s, L * 0.3), mat, `effigy-arm-${sx > 0 ? 'r' : 'l'}`,
        { pos: [sx * W * 0.2, 0.11 * s, -L * 0.04], rot: [0, 0, sx * 0.1] }));
    }
    ef.position.y = H + 0.1 * s;
    g.add(ef);
  } else if (A.lid === 2) {
    g.add(part(box(W * 1.06, 0.1 * s, L * 1.03), mat, 'lid-base', { pos: [0, H + 0.05 * s, 0] }));
    g.add(part(cyl(0.001, W * 0.56, 0.24 * s, 4, 1), mat, 'lid-gable',
      { pos: [0, H + 0.22 * s, 0], rot: [0, Math.PI / 4, 0] }));
  } else {
    /* Slid open — the crypt has been entered, and that is a story beat. */
    g.add(part(box(W * 1.06, 0.13 * s, L * 1.03), mat, 'lid-displaced',
      { pos: [W * 0.34, H + 0.065 * s, L * 0.16], rot: [0.03, 0.08, 0.05] }));
    g.add(part(box(W * 0.9, 0.05 * s, L * 0.93), SACRA.graveDark, 'interior-void',
      { pos: [0, H - 0.02 * s, 0] }));
  }

  if (A.feet === 1) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      g.add(part(box(0.15 * s, 0.13 * s, 0.15 * s), mat, `foot-${sx}-${sz}`,
        { pos: [sx * W * 0.34, 0.065 * s, sz * L * 0.38] }));
    }
    g.position.y += 0.13 * s;
  }

  if (A.wear === 2) {
    for (let i = 0; i < cnt(5); i++) {
      g.add(part(squash(ico(0.06 * s + rand() * 0.05, 0), 1.4, 0.3, 1.2), SACRA.mossPale, `mold-${i}`,
        { pos: [(rand() - 0.5) * W, rand() * H, (rand() - 0.5) * L] }));
    }
  }
  return seat(g);
}

/* ------------------------------------------------------------ reliquary
   Cinderward alloys iron with *relic ash*, Hollow Abbey has an emptied
   tongue reliquary, and `relic_ash` is a gatherable from a cracked
   reliquary. So a reliquary is an economy object here, not treasure. */

export const RELIQ_AXES = { form: 4, metal: 3, glass: 2, stand: 3, content: 3, wear: 3 };
export function reliquary(variant = 0) {
  const A = axesOf(variant, RELIQ_AXES);
  const rand = rnd(0x4e11 + variant * 3527);
  const g = new THREE.Group();
  g.name = 'reliquary';

  const metal = [SACRA.gold, SACRA.verdigris, SACRA.iron][A.metal];
  const s = 0.9;
  let topY = 0;

  if (A.form === 0) {
    /* Casket: a gabled box on feet. */
    const w = 0.34 * s, h = 0.2 * s, d = 0.22 * s;
    g.add(part(box(w, h, d), metal, 'casket-body', { pos: [0, h / 2, 0] }));
    g.add(part(cyl(0.001, w * 0.58, 0.12 * s, 4, 1), metal, 'casket-roof',
      { pos: [0, h + 0.06 * s, 0], rot: [0, Math.PI / 4, 0] }));
    for (let i = 0; i < cnt(3); i++) {
      g.add(part(torus(0.018 * s, 0.006 * s, 4, sg(10)), metal, `casket-boss-${i}`,
        { pos: [-w / 2 + w * ((i + 0.5) / 3), h * 0.6, d / 2 + 0.004] }));
    }
    topY = h + 0.12 * s;
  } else if (A.form === 1) {
    /* Monstrance: a disc on a stem, the most legible silhouette. */
    g.add(part(cyl(0.06 * s, 0.09 * s, 0.04 * s, sg(16)), metal, 'monstrance-foot', { pos: [0, 0.02 * s, 0] }));
    g.add(part(cyl(0.017 * s, 0.02 * s, 0.2 * s, sg(10)), metal, 'monstrance-stem', { pos: [0, 0.14 * s, 0] }));
    g.add(part(torus(0.11 * s, 0.016 * s, 6, sg(28)), metal, 'monstrance-ring', { pos: [0, 0.34 * s, 0] }));
    if (A.glass === 1) {
      const disc = cyl(0.1 * s, 0.1 * s, 0.012 * s, sg(24));
      const m = part(disc, SACRA.glass, 'monstrance-glass', { pos: [0, 0.34 * s, 0], rot: [Math.PI / 2, 0, 0] });
      m.material = SACRA.glass;
      g.add(m);
    }
    for (let i = 0; i < cnt(10); i++) {
      const a = (i / 10) * T;
      g.add(part(cone(0.012 * s, 0.055 * s, 4), metal, `ray-${i}`,
        { pos: [Math.cos(a) * 0.145 * s, 0.34 * s + Math.sin(a) * 0.145 * s, 0], rot: [0, 0, a - Math.PI / 2] }));
    }
    topY = 0.48 * s;
  } else if (A.form === 2) {
    /* Arm reliquary — a forearm and hand raised in blessing. */
    g.add(part(box(0.13 * s, 0.05 * s, 0.13 * s), metal, 'arm-base', { pos: [0, 0.025 * s, 0] }));
    g.add(part(cyl(0.045 * s, 0.055 * s, 0.34 * s, sg(14)), metal, 'forearm', { pos: [0, 0.22 * s, 0] }));
    g.add(part(torus(0.05 * s, 0.012 * s, 5, sg(18)), SACRA.gold, 'arm-cuff', { pos: [0, 0.07 * s, 0], rot: [Math.PI / 2, 0, 0] }));
    g.add(part(squash(ico(0.05 * s, 1), 0.8, 1.2, 0.6), metal, 'hand', { pos: [0, 0.42 * s, 0] }));
    for (let i = 0; i < cnt(2); i++) {
      g.add(part(cyl(0.009 * s, 0.011 * s, 0.08 * s, sg(6)), metal, `finger-${i}`,
        { pos: [(i - 0.5) * 0.022 * s, 0.49 * s, 0] }));
    }
    topY = 0.54 * s;
  } else {
    /* Empty niche box — the abbey's `tongue_reliquary_empty`. Its emptiness
       is the point, so the interior is a distinct dark material. */
    const w = 0.24 * s, h = 0.3 * s, d = 0.16 * s;
    g.add(part(box(w, h, d), metal, 'niche-frame', { pos: [0, h / 2, 0] }));
    g.add(part(box(w * 0.72, h * 0.76, 0.01 * s), SACRA.graveDark, 'niche-void',
      { pos: [0, h * 0.52, d / 2 + 0.002] }));
    g.add(part(cyl(0.001, w * 0.5, 0.08 * s, 4, 1), metal, 'niche-crest',
      { pos: [0, h + 0.04 * s, 0], rot: [0, Math.PI / 4, 0] }));
    topY = h + 0.08 * s;
  }

  if (A.content > 0 && A.form !== 3) {
    const cm = A.content === 1 ? SACRA.bone : SACRA.clayFired;
    g.add(part(squash(ico(0.026 * s, 0), 1, 2.2, 1), cm, 'relic-contents',
      { pos: [0, topY * 0.55, 0], rot: [0.2, rand() * T, 0.3] }));
  }

  if (A.stand > 0) {
    const r = A.stand === 1 ? 0.17 * s : 0.21 * s;
    g.add(part(cyl(r, r * 1.12, 0.05 * s, sg(A.stand === 1 ? 6 : 16)), SACRA.graveStone, 'reliquary-plinth',
      { pos: [0, -0.025 * s, 0] }));
  }
  if (A.wear === 2) {
    for (let i = 0; i < cnt(3); i++) {
      g.add(part(squash(ico(0.02 * s + rand() * 0.02, 0), 1.3, 0.4, 1.3), SACRA.verdigris, `tarnish-${i}`,
        { pos: [(rand() - 0.5) * 0.2 * s, rand() * topY, (rand() - 0.5) * 0.14 * s] }));
    }
  }
  return seat(g);
}

/* --------------------------------------------------------- name tablet
   Hearthmere burns the dead's names into clay tablets "so the dead cannot be
   forgotten by the ash". The region kit declares `clay_name_rack` as a prop
   and `clay_tile_tablets` as a surface — but a surface cannot be carried,
   and this town's whole ritual is a person holding one. Hence a real object. */

export const TABLET_AXES = { form: 3, count: 4, clay: 3, script: 3, damage: 3, frame: 2 };
export function nameTablet(variant = 0) {
  const A = axesOf(variant, TABLET_AXES);
  const rand = rnd(0x7ab1 + variant * 3221);
  const g = new THREE.Group();
  g.name = 'name-tablet';

  const mat = [SACRA.clay, SACRA.clayFired, SACRA.graveStone][A.clay];
  const tw = 0.19, th = 0.26, tt = 0.022;

  /* One tablet, laid flat and readable. */
  const one = (gx, name, tiltX, tiltZ) => {
    const t = box(tw, th, tt, 2, 2, 1);
    jitter(t, 0.005, rand);
    const grp = new THREE.Group();
    grp.name = name;
    grp.add(part(t, mat, name + '-body'));
    /* Burned name: raised script rows. The count axis is how *full* the
       tablet is, which in this fiction is how many the town has lost. */
    const rows = cnt(A.script === 0 ? 2 : A.script === 1 ? 4 : 6);
    for (let i = 0; i < rows; i++) {
      g.name;
      grp.add(part(box(tw * (0.4 + rand() * 0.42), 0.014, 0.006), SACRA.graveDark, `${name}-script-${i}`,
        { pos: [(rand() - 0.5) * 0.02, th * 0.38 - i * (th * 0.72 / rows), tt / 2 + 0.003] }));
    }
    if (A.damage === 2) {
      const c = box(0.008, th * (0.3 + rand() * 0.4), tt * 1.4);
      lean(c, 0.4, 0, 1.2);
      grp.add(part(c, SACRA.graveDark, `${name}-crack`, { pos: [(rand() - 0.5) * tw * 0.5, 0, 0] }));
    }
    grp.rotation.set(tiltX, rand() * 0.2 - 0.1, tiltZ);
    grp.position.x = gx;
    return grp;
  };

  const n = [1, 3, 6, 10][A.count];
  if (A.form === 0) {
    /* Single, propped. */
    const t = one(0, 'tablet', 0.06, rand() * 0.1 - 0.05);
    t.position.y = th / 2;
    g.add(t);
  } else if (A.form === 1) {
    /* Rack — the `clay_name_rack` prop, leaning in rows. */
    if (A.frame === 1) {
      g.add(part(box(n * 0.055 + 0.1, 0.035, tt * 3.4), SACRA.oak, 'rack-shelf', { pos: [0, 0.017, 0] }));
      for (const sx of [-1, 1]) {
        g.add(part(box(0.03, th * 1.15, 0.03), SACRA.oak, `rack-post-${sx > 0 ? 'r' : 'l'}`,
          { pos: [sx * (n * 0.0275 + 0.045), th * 0.58, 0] }));
      }
    }
    for (let i = 0; i < cnt(n); i++) {
      const t = one(-n * 0.0275 + i * 0.055, `tablet-${i}`, 0.12 + rand() * 0.06, rand() * 0.16 - 0.08);
      t.position.y = th / 2 + 0.035;
      g.add(t);
    }
  } else {
    /* Stack — flat, piled. */
    for (let i = 0; i < cnt(n); i++) {
      const t = one((rand() - 0.5) * 0.02, `tablet-${i}`, Math.PI / 2 - 0.02, rand() * 0.5);
      t.position.y = tt * 1.15 * i + tt / 2;
      t.position.z = (rand() - 0.5) * 0.02;
      g.add(t);
    }
  }
  return seat(g);
}

/* ---------------------------------------------------------------- censer */

export const CENSER_AXES = { form: 3, chain: 3, pierce: 3, metal: 3, scale: 3, smoke: 2 };
export function censer(variant = 0) {
  const A = axesOf(variant, CENSER_AXES);
  const rand = rnd(0xce75 + variant * 2999);
  const g = new THREE.Group();
  g.name = 'censer';

  const s = [0.7, 1, 1.4][A.scale];
  const metal = [SACRA.verdigris, SACRA.gold, SACRA.iron][A.metal];
  const R = 0.11 * s;

  const bowl = lathe([[0, 0], [R * 0.4, 0], [R * 0.9, R * 0.5], [R, R * 0.95], [R * 0.96, R * 1.1]], sg(20));
  g.add(part(bowl, metal, 'censer-bowl', { pos: [0, 0, 0] }));

  const lidH = [R * 0.7, R * 1.15, R * 0.45][A.form];
  const lid = lathe([[R * 0.96, 0], [R * 0.8, lidH * 0.35], [R * 0.5, lidH * 0.75], [R * 0.14, lidH], [R * 0.1, lidH * 1.15]], sg(20));
  g.add(part(lid, metal, 'censer-lid', { pos: [0, R * 1.1, 0] }));

  /* Pierced lid — the holes are what make it a censer. Modelled as dark
     inserts rather than boolean holes: a subtractive cut on a lathe would
     need CSG the kit does not carry, and at this scale the read is identical. */
  if (A.pierce > 0) {
    const n = cnt(A.pierce === 1 ? 6 : 12);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * T;
      const t = 0.3 + (i % 2) * 0.3;
      const rr = R * (0.86 - t * 0.5);
      g.add(part(cyl(R * 0.055, R * 0.055, R * 0.1, sg(6)), SACRA.graveDark, `pierce-${i}`,
        { pos: [Math.cos(a) * rr, R * 1.1 + lidH * t, Math.sin(a) * rr], rot: [0.4, 0, 0] }));
    }
  }

  if (A.chain > 0) {
    const links = cnt(A.chain === 1 ? 5 : 9);
    for (let i = 0; i < cnt(3); i++) {
      const a = (i / 3) * T;
      const ch = chain(links, 0.02 * s, 0.005 * s, metal, `censer-chain-${i}`, rand);
      ch.position.set(Math.cos(a) * R * 0.85, R * 1.1 + lidH * 1.15, Math.sin(a) * R * 0.85);
      g.add(ch);
    }
  }

  if (A.smoke === 1) {
    for (let i = 0; i < cnt(3); i++) {
      const sm = squash(ico(R * (0.3 + i * 0.16), 0), 1, 1.5, 1);
      const m = part(sm, SACRA.mossPale, `smoke-${i}`,
        { pos: [(rand() - 0.5) * R * 0.4, R * 1.1 + lidH * 1.3 + i * R * 0.5, (rand() - 0.5) * R * 0.4] });
      m.material = SACRA.mossPale;
      thin(m);
      g.add(m);
    }
  }
  return seat(g);
}

export const SACRA_GENERATORS = [
  { id: 'sacra.bell', name: 'Bell', axes: BELL_AXES, build: bell, domain: 'world', budgetClass: 'hero' },
  { id: 'sacra.urn', name: 'Urn', axes: URN_AXES, build: urn, domain: 'world', budgetClass: 'standard' },
  { id: 'sacra.cairn', name: 'Cairn', axes: CAIRN_AXES, build: cairn, domain: 'world', budgetClass: 'standard' },
  { id: 'sacra.headstone', name: 'Headstone', axes: HEADSTONE_AXES, build: headstone, domain: 'world', budgetClass: 'minor' },
  { id: 'sacra.sarcophagus', name: 'Sarcophagus', axes: SARC_AXES, build: sarcophagus, domain: 'world', budgetClass: 'standard' },
  { id: 'sacra.reliquary', name: 'Reliquary', axes: RELIQ_AXES, build: reliquary, domain: 'items', budgetClass: 'minor' },
  { id: 'sacra.tablet', name: 'Clay name tablet', axes: TABLET_AXES, build: nameTablet, domain: 'items', budgetClass: 'minor' },
  { id: 'sacra.censer', name: 'Censer', axes: CENSER_AXES, build: censer, domain: 'items', budgetClass: 'minor' },
];
