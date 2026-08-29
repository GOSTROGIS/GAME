/* Two proposed artifacts. Neither has a row in hearthmere.assets.json, and
 * both are flagged "proposed" in the kit UI rather than presented as
 * manifest content. Each exists because the authored fiction already
 * requires it:
 *
 *   hm.artifact.clay-name-tablet
 *     hearthmere.assets.json carries hm.surface.clay-tablets as a SURFACE.
 *     But README/world.js make the tablet the region's central object —
 *     "its people burn names into clay tablets so the dead cannot be
 *     forgotten by the ash" — and quest and codex surfaces need a single
 *     inspectable one. A surface cannot be picked up.
 *
 *   hm.artifact.bell-clapper-mace
 *     world.js describes Torren Vale, Bell-Warden and Hearthmere's combat
 *     trainer, as "a broad veteran who carries the clapper of a ruined bell
 *     as a mace." He is a placed NPC with a named weapon and no weapon
 *     asset anywhere in the manifests.
 */
import { THREE, MAT, rnd, jitter, part, lathe, limb, seat, cnt, ico, cone, torus, cyl } from './hm-core.js';

const box = (w, h, d, ws = 1, hs = 1, ds = 1) => new THREE.BoxGeometry(w, h, d, ws, hs, ds);

/* --------------------------------------------------- clay name tablet
 * Inspect-scale hero prop, 0.16 × 0.24 × 0.03 m. Proposed budget
 * 2,800 / 1,100 / 380 triangles, 3 material slots.                       */
export function clayNameTablet() {
  const rand = rnd(0xc1a7b1);
  const g = new THREE.Group();
  g.name = 'clay-name-tablet';
  const W = 0.155, H = 0.235, T = 0.026;

  // Slab with a chamfered edge: two stacked boxes, the upper inset, so the
  // profile reads as pressed clay rather than a cut card.
  const slab = box(W, H, T, 3, 4, 1);
  jitter(slab, 0.0025, rand);
  g.add(part(slab, MAT.firedClay, 'tablet-slab', { pos: [0, H / 2, 0] }));
  const face = box(W - 0.016, H - 0.016, T + 0.004, 3, 4, 1);
  jitter(face, 0.0018, rand);
  g.add(part(face, MAT.firedClay, 'tablet-face', { pos: [0, H / 2, 0] }));

  // The names. Six incised lines, in the pale unfired clay exposed by the
  // stylus — legible as writing at silhouette scale without a texture.
  for (let i = 0; i < 6; i++) {
    const w = 0.088 + rand() * 0.036;
    g.add(part(box(w, 0.0075, 0.006), MAT.clayPale, 'incised-line-' + i, {
      pos: [-0.012 + (rand() - 0.5) * 0.012, H - 0.05 - i * 0.028, T / 2 + 0.001],
      rot: [0, 0, (rand() - 0.5) * 0.02],
    }));
    // A short second mark: the family name, set under each given name.
    if (i < 5) {
      g.add(part(box(0.032 + rand() * 0.02, 0.0055, 0.005), MAT.clayPale, 'incised-mark-' + i, {
        pos: [0.038, H - 0.062 - i * 0.028, T / 2 + 0.001],
        rot: [0, 0, (rand() - 0.5) * 0.03],
      }));
    }
  }

  // The warden's tally along the left edge — one notch per bell rung.
  for (let i = 0; i < 7; i++) {
    g.add(part(box(0.006, 0.014, 0.005), MAT.clayPale, 'tally-notch-' + i, {
      pos: [-W / 2 + 0.011, 0.035 + i * 0.019, T / 2 + 0.001],
      rot: [0, 0, 0.22],
    }));
  }

  // Cord hole through the head, and the hemp loop it hangs by.
  g.add(part(limb(0.0075, 0.0075, T + 0.01, 10, 1), MAT.clayPale, 'cord-hole', { pos: [0, H - 0.019, 0], rot: [Math.PI / 2, 0, 0] }));
  g.add(part(torus(0.026, 0.0055, 6, 16), MAT.ropeHemp, 'hemp-loop', { pos: [0, H - 0.005, 0], rot: [0, Math.PI / 2, 0] }));

  // Fire damage: the scorch that names it as Hearthmere work, and a chipped
  // lower corner. Both in the pale slip, both asymmetric.
  const scorch = ico(0.034, 1);
  scorch.scale(1.5, 1.1, 0.12);
  jitter(scorch, 0.006, rand);
  g.add(part(scorch, MAT.clayPale, 'kiln-scorch', { pos: [0.036, 0.055, T / 2 + 0.002], rot: [0, 0, 0.4] }));
  const chip = ico(0.019, 0);
  jitter(chip, 0.006, rand);
  g.add(part(chip, MAT.clayPale, 'broken-corner', { pos: [-W / 2 + 0.008, 0.008, 0] }));

  return seat(g);
}
/* ----------------------------------------------- bell-clapper mace
 * Torren Vale's weapon, 0.17 × 1.02 × 0.17 m. The head is a genuine bell
 * clapper — ball, shank and flight — cut from a bell that no longer rings,
 * collared onto an ash haft. Proposed budget 4,200 / 1,600 / 560, 4 slots. */
export function bellClapperMace() {
  const rand = rnd(0xbe11c1);
  const g = new THREE.Group();
  g.name = 'bell-clapper-mace';
  const L = 1.0;

  // Haft: ash, oval in section, thickening toward the head.
  const haft = limb(0.019, 0.028, L * 0.72, 10, 3);
  jitter(haft, 0.003, rand);
  haft.scale(1, 1, 0.82);
  g.add(part(haft, MAT.darkOak, 'ash-haft', { pos: [0, L * 0.36, 0] }));

  // Leather-and-hemp grip over the lower third, bound in three bands.
  g.add(part(limb(0.024, 0.026, 0.26, 10, 1), MAT.ropeHemp, 'grip-wrap', { pos: [0, 0.17, 0], scale: [1, 1, 0.84] }));
  for (let i = 0; i < 3; i++) {
    g.add(part(torus(0.026, 0.0045, 5, 14), MAT.ropeHemp, 'grip-band-' + i, { pos: [0, 0.06 + i * 0.1, 0], rot: [Math.PI / 2, 0, 0], scale: [1, 0.86, 1] }));
  }

  // Iron collar and langets: the joint that stops the head shearing off.
  g.add(part(lathe([[0.03, 0], [0.042, 0.012], [0.045, 0.05], [0.038, 0.07], [0.032, 0.075], [0, 0.076]], 14), MAT.pittedIron, 'iron-collar', { pos: [0, L * 0.7, 0] }));
  [0, Math.PI].forEach((a, i) => {
    g.add(part(box(0.012, 0.17, 0.032), MAT.pittedIron, 'langet-' + i, { pos: [Math.cos(a) * 0.026, L * 0.63, Math.sin(a) * 0.026], rot: [0, a, 0] }));
  });
  for (let i = 0; i < 4; i++) {
    g.add(part(ico(0.006, 0), MAT.pittedIron, 'langet-rivet-' + i, { pos: [0.03, L * 0.58 + i * 0.045, 0] }));
  }

  // The clapper itself: shank, ball and flight, in bell bronze.
  g.add(part(limb(0.021, 0.026, 0.16, 10, 1), MAT.bellBronze, 'clapper-shank', { pos: [0, L * 0.82, 0] }));
  const ball = ico(0.062, 2);
  // Flatten the strike face — a clapper wears flat where it hits the bell.
  const p = ball.attributes.position;
  for (let i = 0; i < p.count; i++) {
    if (p.getX(i) > 0.042) p.setX(i, 0.042);
  }
  p.needsUpdate = true;
  ball.computeVertexNormals();
  g.add(part(ball, MAT.bellBronze, 'clapper-ball', { pos: [0, L * 0.9, 0] }));
  g.add(part(lathe([[0.022, 0], [0.03, 0.02], [0.026, 0.06], [0.014, 0.085], [0, 0.09]], 14), MAT.bellBronze, 'clapper-flight', { pos: [0, L * 0.955, 0] }));
  // Cast crown ring, still bearing the bell's own suspension eye.
  g.add(part(torus(0.026, 0.008, 6, 14), MAT.bellBronze, 'suspension-eye', { pos: [0, L * 1.05, 0], rot: [Math.PI / 2, 0, 0] }));

  // Wrist cord, knotted through the butt.
  g.add(part(limb(0.0065, 0.0065, 0.2, 5, 1), MAT.ropeHemp, 'wrist-cord', { pos: [0.03, 0.02, 0.01], rot: [0.2, 0, 1.25] }));
  g.add(part(ico(0.014, 0), MAT.ropeHemp, 'cord-knot', { pos: [0.13, -0.005, 0.02] }));
  g.add(part(lathe([[0.028, 0], [0.03, 0.01], [0.026, 0.026], [0.016, 0.032], [0, 0.033]], 12), MAT.pittedIron, 'butt-cap', { pos: [0, -0.02, 0] }));

  return seat(g);
}
