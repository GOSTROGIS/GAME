/* =========================================================================
   hm-actor-cast.js — the forty-two named characters as buildable specs
   -------------------------------------------------------------------------
   Read against src/data/characters.js: seven factions, six members each,
   every name and role transcribed rather than invented. What is ADDED here
   is the body: proportion, garment, wear, bearing, and the clips.

   The honesty rule from GAP-ANALYSIS-CONTENT.md applies to bodies too —
   no field may restate another. So:
   - `bearing` is HOW they carry weight (arithmetic on the walk cycle).
   - `mark` is the one thing you would describe them by (geometry or wear).
   - `signature` is a clip nobody else has.
   - `work` is their occupation as a motion.
   Two characters may share a proportion. None share a bearing + mark + clip
   triple, and where a clip base IS shared it is declared, not hidden.

   Depth tiering, as the gap analysis requires: seven leads carry authored
   signature AND work clips. The remaining thirty-five carry an authored
   bearing, mark and garment, and draw their work clip from an occupational
   base — declared in `clipTier` so the surface can say so.
   ========================================================================= */

import { CLIPS, grip, planted, breathe, settle, smooth, pulse, lerp } from './hm-actor-anim.js?v=skin1';

const TAU = Math.PI * 2;
const K = { grip, planted, breathe, settle, smooth, pulse, lerp, TAU };

/* ------------------------------------------------------- faction wardrobe
   Material language per faction, keyed to the region kits' own vocabulary.
   A character inherits this and then overrides what makes them individual.

   `accent` is a TEXT colour — it labels the faction on a card sitting on
   --glass-bg. So it is not the faction's darkest identity hue: bell_wardens'
   deep verdigris and grave_tithe's blood read at roughly 1.6:1 against that
   panel, which is unreadable. Each accent here is the faction hue lifted into
   a legible band, using tints the page already carries. The garment colours
   below are the dark versions and stay dark, because cloth is lit, not read. */
export const WARDROBE = {
  ember_ledger: { under: 'ashWool', coat: 'tallow', hair: 'blackWool', skin: 'ashen', accent: 'var(--gold)', coatLen: 0.4, coatPanels: 6 },
  bell_wardens: { under: 'blackWool', coat: 'blackWool', hair: 'ashWool', skin: 'weathered', accent: '#7d9689', coatLen: 0.46, coatPanels: 7 },
  reed_sisters: { under: 'reedGreen', coat: 'bogInk', hair: 'bogInk', skin: 'fenpale', accent: '#8aa596', coatLen: 0.44, coatPanels: 6 },
  cinder_compact: { under: 'sootBlack', coat: 'rust', hair: 'sootBlack', skin: 'sooted', accent: 'var(--ember)', coatLen: 0.3, coatPanels: 5 },
  exact_word: { under: 'chalkLinen', coat: 'chalkLinen', hair: 'crypt', skin: 'pallid', accent: '#a49c86', coatLen: 0.52, coatPanels: 8 },
  unwritten_roads: { under: 'roadMud', coat: 'rust', hair: 'roadMud', skin: 'weathered', accent: '#a8845e', coatLen: 0.42, coatPanels: 6 },
  grave_tithe: { under: 'blackWool', coat: 'crypt', hair: 'blackWool', skin: 'pallid', accent: '#c98d78', coatLen: 0.34, coatPanels: 5 },
};

export const FACTION_META = {
  ember_ledger: { name: 'The Ember Ledger', seat: 'Hearthmere Hold' },
  bell_wardens: { name: 'The Bell Wardens', seat: 'Hearthmere · all regions' },
  reed_sisters: { name: 'The Reed Sisters', seat: 'Dunmire Causeway' },
  cinder_compact: { name: 'The Cinder Compact', seat: 'Cinderward Foundry' },
  exact_word: { name: 'Custodians of the Exact Word', seat: 'Hollow Abbey' },
  unwritten_roads: { name: 'The Unwritten Roads', seat: 'Graven March' },
  grave_tithe: { name: 'The Grave Tithe', seat: 'Graven March · covert' },
};

/* =======================================================================
   TIER ONE — seven leads. Signature and work clips authored individually.
   ======================================================================= */

/* Maela Voss keeps the Ember Ledger: she reads a name, finds it already
   struck, and puts her thumb on the line as though pressure could hold it.
   The clip is the hesitation, not the reading. */
function maelaSignature(rig, spec, st, t) {
  const p = (t % 5.6) / 5.6;
  const H = rig.H;
  const read = settle(clamp01(p / 0.3));
  const stop = pulse(p, 0.42, 0.06);
  const press = settle(clamp01((p - 0.44) / 0.26)) * (1 - settle(clamp01((p - 0.8) / 0.2)));
  rig.pelvis.position.y = rig.hipY - 0.014 * H;
  rig.spineLow.rotation.x = 0.2 + 0.14 * read + 0.1 * press;
  rig.spineMid.rotation.x = 0.1;
  planted(rig, spec, st, 0.024, 0);
  const L = rig.arms.L, R = rig.arms.R;
  L.shoulder.rotation.x = -0.82 - 0.1 * read;
  L.shoulder.rotation.z = L.side * 0.42;
  L.elbow.rotation.x = 1.62;
  grip(L.hand, 0.5);                                  // the ledger board
  R.shoulder.rotation.x = -0.62 - 0.34 * read - 0.12 * press;
  R.shoulder.rotation.z = R.side * 0.3;
  R.elbow.rotation.x = 1.35 + 0.2 * read;
  grip(R.hand, 0.14 - 0.14 * press, 0.1);             // thumb flat on the line
  R.wrist.rotation.x = 0.4 * press;
  rig.head.rotation.x = 0.34 + 0.12 * read;
  rig.head.rotation.y = -0.1 + 0.06 * read;
  rig.chest.rotation.z = -0.05 * stop;
  breathe(rig, st, 1 + stop * 2.4);
}
function maelaWork(rig, spec, st, t) {
  const c = Math.sin(t * 2.1);
  rig.spineLow.rotation.x = 0.26;
  planted(rig, spec, st, 0.022, 0);
  const L = rig.arms.L, R = rig.arms.R;
  L.shoulder.rotation.x = -0.88; L.shoulder.rotation.z = L.side * 0.44; L.elbow.rotation.x = 1.66; grip(L.hand, 0.55);
  R.shoulder.rotation.x = -0.7 + c * 0.09; R.shoulder.rotation.z = R.side * 0.26;
  R.elbow.rotation.x = 1.44 - c * 0.14; R.wrist.rotation.z = c * 0.22; grip(R.hand, 0.86);
  rig.head.rotation.x = 0.4;
  rig.head.rotation.y = c * 0.05;
  breathe(rig, st, 0.8);
}

/* Torren Vale trains with a bell rope he no longer has. The pull is complete
   and there is nothing at the end of it — he abandoned a border bell and the
   arms have not been told. */
function torrenSignature(rig, spec, st, t) {
  const p = (t % 5.6) / 5.6;
  const H = rig.H;
  const reach = settle(clamp01(p / 0.22));
  const pull = p > 0.24 && p < 0.44 ? smooth((p - 0.24) / 0.2) : p >= 0.44 ? 1 : 0;
  const rel = settle(clamp01((p - 0.5) / 0.34));
  const k = pull - rel;
  rig.pelvis.position.y = rig.hipY - 0.05 * H * k;
  rig.spineLow.rotation.x = -0.12 * reach + 0.3 * k;
  rig.spineMid.rotation.x = 0.14 * k;
  planted(rig, spec, st, 0.05, 0.02);
  for (const key of ['L', 'R']) {
    const A = rig.arms[key];
    A.shoulder.rotation.x = -2.2 * reach + 2.4 * k;
    A.shoulder.rotation.z = A.side * 0.2;
    A.elbow.rotation.x = 0.3 + 1.5 * k;
    grip(A.hand, 1);
  }
  rig.head.rotation.x = -0.34 * reach + 0.5 * k;
  // The look down at empty hands, at the end, every time.
  const check = settle(clamp01((p - 0.84) / 0.16));
  rig.head.rotation.x += 0.5 * check;
  for (const key of ['L', 'R']) grip(rig.arms[key].hand, 1 - check * 0.85);
  breathe(rig, st, 1 + k * 2);
}
function torrenWork(rig, spec, st, t) {
  const beat = (t % 1.6) / 1.6;
  const strike = pulse(beat, 0.2, 0.09);
  rig.pelvis.rotation.y = -0.2 + 0.34 * strike;
  rig.chest.rotation.y = -0.3 + 0.5 * strike;
  planted(rig, spec, st, 0.05, 0.03 * strike);
  const A = rig.arms.R, O = rig.arms.L;
  A.shoulder.rotation.x = -1.3 + 2.0 * strike;
  A.shoulder.rotation.z = A.side * 0.5;
  A.elbow.rotation.x = 1.7 - 1.2 * strike;
  grip(A.hand, 1);
  O.shoulder.rotation.x = -0.5; O.shoulder.rotation.z = O.side * 0.55; O.elbow.rotation.x = 1.5; grip(O.hand, 0.6);
  rig.head.rotation.y = 0.2 * strike;
  breathe(rig, st, 1.8);
}

/* Ysra Pell reads a fen patient by touch, in water, with one hand kept dry
   above her head because the other is already contaminated. */
function ysraSignature(rig, spec, st, t) {
  const p = (t % 5.6) / 5.6;
  const H = rig.H;
  const down = settle(clamp01(p / 0.34));
  const feel = Math.sin(p * TAU * 2.6) * down;
  rig.pelvis.position.y = rig.hipY - 0.1 * H * down;
  rig.spineLow.rotation.x = 0.3 * down;
  rig.spineLow.rotation.z = 0.1 * down;
  planted(rig, spec, st, 0.062, -0.02);
  const L = rig.arms.L, R = rig.arms.R;
  R.shoulder.rotation.x = 0.5 * down;                 // submerged, feeling
  R.shoulder.rotation.z = R.side * 0.3;
  R.elbow.rotation.x = 0.4 + 0.3 * down;
  R.wrist.rotation.x = feel * 0.4;
  grip(R.hand, 0.3 + feel * 0.3);
  L.shoulder.rotation.x = -2.5 * down;                // dry hand, held clear
  L.shoulder.rotation.z = L.side * 0.16;
  L.elbow.rotation.x = 0.34;
  grip(L.hand, 0.05);
  rig.head.rotation.x = 0.42 * down;
  rig.head.rotation.y = -0.16 * down + feel * 0.06;
  breathe(rig, st, 0.7);
}
function ysraWork(rig, spec, st, t) {
  const c = Math.sin(t * 1.15);
  rig.spineLow.rotation.x = 0.34;
  planted(rig, spec, st, 0.03, 0);
  const L = rig.arms.L, R = rig.arms.R;
  L.shoulder.rotation.x = -0.95; L.shoulder.rotation.z = L.side * 0.4; L.elbow.rotation.x = 1.72; grip(L.hand, 0.66);
  R.shoulder.rotation.x = -0.8 + c * 0.14; R.shoulder.rotation.z = R.side * 0.3;
  R.elbow.rotation.x = 1.55; R.wrist.rotation.z = c * 0.5; grip(R.hand, 0.8);
  rig.head.rotation.x = 0.46;
  breathe(rig, st, 0.9);
}

/* Orik Senn is the last smith and works a forge that has no apprentice to
   hold the work. He does both halves himself, which is why the clip is
   lopsided and why his back is the way it is. */
function orikSignature(rig, spec, st, t) {
  const p = (t % 5.6) / 5.6;
  const H = rig.H;
  const lift = settle(clamp01(p / 0.26));
  const hold = clamp01((p - 0.3) / 0.44);
  const set = settle(clamp01((p - 0.78) / 0.22));
  rig.pelvis.position.y = rig.hipY - 0.03 * H - 0.03 * H * lift;
  rig.spineLow.rotation.x = 0.16 + 0.24 * lift - 0.2 * set;
  rig.spineLow.rotation.z = -0.14 * lift;             // the load is on one side
  rig.spineMid.rotation.z = -0.08 * lift;
  planted(rig, spec, st, 0.06, 0.01);
  const L = rig.arms.L, R = rig.arms.R;
  L.shoulder.rotation.x = -1.5 * lift;
  L.shoulder.rotation.z = L.side * 0.24;
  L.elbow.rotation.x = 1.5 * lift;
  grip(L.hand, 1);                                    // tongs
  R.shoulder.rotation.x = -0.5 - 0.2 * lift;
  R.shoulder.rotation.z = R.side * 0.42;
  R.elbow.rotation.x = 1.2;
  grip(R.hand, 0.95);                                 // hammer, waiting
  rig.head.rotation.x = 0.24 + 0.16 * lift;
  rig.head.rotation.y = -0.28 * lift;                 // watching the colour
  const strain = hold * Math.sin(t * 17) * 0.008;
  L.elbow.rotation.x += strain;
  rig.chest.rotation.z += strain * 0.6;
  breathe(rig, st, 1.4 + hold);
}
function orikWork(rig, spec, st, t) {
  const beat = (t % 0.86) / 0.86;
  const hit = pulse(beat, 0.24, 0.07);
  const H = rig.H;
  rig.pelvis.position.y = rig.hipY - 0.04 * H;
  rig.spineLow.rotation.x = 0.3 - 0.06 * hit;
  rig.chest.rotation.y = -0.16 + 0.24 * hit;
  planted(rig, spec, st, 0.058, 0);
  const R = rig.arms.R, L = rig.arms.L;
  R.shoulder.rotation.x = -1.75 + 2.5 * hit;
  R.shoulder.rotation.z = R.side * 0.36;
  R.elbow.rotation.x = 1.85 - 1.5 * hit;
  grip(R.hand, 1);
  L.shoulder.rotation.x = -1.0; L.shoulder.rotation.z = L.side * 0.3; L.elbow.rotation.x = 1.5; grip(L.hand, 1);
  rig.head.rotation.x = 0.4;
  rig.head.rotation.z = -0.06 * hit;
  breathe(rig, st, 2.2);
}

/* Nhal Without Shadow is a gate. The signature is refusal: the hand comes up
   flat, palm out, and stays up longer than is comfortable to watch. */
function nhalSignature(rig, spec, st, t) {
  const p = (t % 5.6) / 5.6;
  const H = rig.H;
  const up = settle(clamp01(p / 0.16));
  const hold = clamp01((p - 0.2) / 0.6);
  const down = settle(clamp01((p - 0.86) / 0.14));
  const k = up * (1 - down);
  rig.pelvis.position.y = rig.hipY;
  rig.pelvis.rotation.y = 0;
  rig.spineLow.rotation.x = -0.04;                    // upright to the point of stiffness
  planted(rig, spec, st, 0.018, 0);
  const R = rig.arms.R, L = rig.arms.L;
  R.shoulder.rotation.x = -1.62 * k;
  R.shoulder.rotation.z = R.side * 0.14;
  R.elbow.rotation.x = 0.22 * k;
  R.wrist.rotation.x = -0.38 * k;
  grip(R.hand, 0.02);                                 // fingers straight, together
  L.shoulder.rotation.x = 0.06;
  L.shoulder.rotation.z = L.side * 0.1;
  L.elbow.rotation.x = 0.18;
  grip(L.hand, 0.2);
  rig.head.rotation.x = -0.06;
  rig.head.rotation.y = 0;
  // Absolutely still through the hold. The stillness IS the character, so
  // the breath is the only thing moving and it is shallow.
  breathe(rig, st, 0.42 - hold * 0.2);
}
function nhalWork(rig, spec, st, t) {
  const scan = Math.sin(t * 0.34);
  planted(rig, spec, st, 0.02, 0);
  rig.spineLow.rotation.x = -0.03;
  for (const key of ['L', 'R']) {
    const A = rig.arms[key];
    A.shoulder.rotation.x = 0.1; A.shoulder.rotation.z = A.side * 0.14;
    A.elbow.rotation.x = 1.5; A.wrist.rotation.z = A.side * -0.5;
    grip(A.hand, 0.35);                               // hands folded at the belt
  }
  rig.head.rotation.y = scan * 0.34;
  breathe(rig, st, 0.5);
}

/* Vellin the Unwritten draws a road that is not there yet, then looks up to
   check whether it has arrived. It has not. */
function vellinSignature(rig, spec, st, t) {
  const p = (t % 5.6) / 5.6;
  const H = rig.H;
  const draw = clamp01(p / 0.56);
  const look = settle(clamp01((p - 0.6) / 0.2)) * (1 - settle(clamp01((p - 0.86) / 0.14)));
  rig.pelvis.position.y = rig.hipY - 0.012 * H;
  rig.spineLow.rotation.x = 0.28 - 0.3 * look;
  planted(rig, spec, st, 0.026, 0);
  const L = rig.arms.L, R = rig.arms.R;
  L.shoulder.rotation.x = -0.98; L.shoulder.rotation.z = L.side * 0.5; L.elbow.rotation.x = 1.7; grip(L.hand, 0.6);
  const stroke = Math.sin(draw * TAU * 3.2);
  R.shoulder.rotation.x = -0.78 + stroke * 0.1;
  R.shoulder.rotation.z = R.side * (0.28 + stroke * 0.1);
  R.elbow.rotation.x = 1.5 - stroke * 0.12;
  R.wrist.rotation.z = stroke * 0.3;
  grip(R.hand, 0.9);
  rig.head.rotation.x = 0.44 - 0.66 * look;
  rig.head.rotation.y = -0.1 + 0.34 * look;
  breathe(rig, st, 0.9);
}
function vellinWork(rig, spec, st, t) {
  const c = Math.sin(t * 0.9);
  rig.spineLow.rotation.x = 0.1;
  planted(rig, spec, st, 0.03, 0);
  const L = rig.arms.L, R = rig.arms.R;
  L.shoulder.rotation.x = -1.35 + c * 0.06; L.shoulder.rotation.z = L.side * 0.34;
  L.elbow.rotation.x = 1.1; grip(L.hand, 0.7);        // the case held open
  R.shoulder.rotation.x = -1.2; R.shoulder.rotation.z = R.side * 0.3;
  R.elbow.rotation.x = 1.25; R.wrist.rotation.x = c * 0.2; grip(R.hand, 0.55);
  rig.head.rotation.x = 0.2 - c * 0.08;
  rig.head.rotation.y = c * 0.3;                      // reading the horizon against the sheet
  breathe(rig, st, 1);
}

/* Sera Dusk runs the Tithe's routes. She counts a corridor before she enters
   it, on her fingers, without looking at them. */
function seraSignature(rig, spec, st, t) {
  const p = (t % 5.6) / 5.6;
  const H = rig.H;
  const listen = settle(clamp01(p / 0.2));
  const n = Math.floor(clamp01((p - 0.22) / 0.5) * 4);
  const go = settle(clamp01((p - 0.8) / 0.2));
  rig.pelvis.position.y = rig.hipY - 0.024 * H;
  rig.spineLow.rotation.x = 0.14 + 0.06 * listen;
  rig.pelvis.rotation.y = -0.2 * listen + 0.3 * go;
  planted(rig, spec, st, 0.03, 0.02);
  const L = rig.arms.L, R = rig.arms.R;
  R.shoulder.rotation.x = -0.36; R.shoulder.rotation.z = R.side * 0.3;
  R.elbow.rotation.x = 1.3; grip(R.hand, 0.9);        // on the hook
  L.shoulder.rotation.x = -0.5 - 0.2 * listen;
  L.shoulder.rotation.z = L.side * 0.36;
  L.elbow.rotation.x = 1.45;
  // Counting: fingers release one at a time, and the thumb never moves.
  const f = L.hand.userData.fingers || [];
  for (let i = 0; i < f.length; i++) {
    const open = i < n ? 1 : 0;
    f[i].rotation.x = lerp(1.3, 0.05, open);
    if (f[i].userData.tip) f[i].userData.tip.rotation.x = lerp(1.45, 0.05, open);
  }
  if (L.hand.userData.thumb) L.hand.userData.thumb.rotation.x = 0.8;
  rig.head.rotation.y = -0.44 * listen + 0.4 * go;    // ear to the corridor, not eyes
  rig.head.rotation.z = -0.14 * listen;
  breathe(rig, st, 0.6);
}
function seraWork(rig, spec, st, t) {
  const c = Math.sin(t * 1.4);
  rig.spineLow.rotation.x = 0.2;
  rig.pelvis.rotation.y = c * 0.16;
  planted(rig, spec, st, 0.032, 0.01);
  const L = rig.arms.L, R = rig.arms.R;
  R.shoulder.rotation.x = -0.9 + c * 0.12; R.shoulder.rotation.z = R.side * 0.4;
  R.elbow.rotation.x = 1.6; grip(R.hand, 0.95);
  L.shoulder.rotation.x = -0.7; L.shoulder.rotation.z = L.side * 0.44; L.elbow.rotation.x = 1.5; grip(L.hand, 0.5);
  rig.head.rotation.x = 0.3; rig.head.rotation.y = c * 0.4;
  breathe(rig, st, 1.1);
}

/* =======================================================================
   OCCUPATIONAL BASES — for the thirty-five. Declared as shared, per the
   project's maturity vocabulary, rather than presented as bespoke.
   ======================================================================= */
const OCC = {
  clerk(rig, spec, st, t) {
    const c = Math.sin(t * 1.9);
    rig.spineLow.rotation.x = 0.28;
    planted(rig, spec, st, 0.022, 0);
    const L = rig.arms.L, R = rig.arms.R;
    L.shoulder.rotation.x = -0.86; L.shoulder.rotation.z = L.side * 0.42; L.elbow.rotation.x = 1.64; grip(L.hand, 0.52);
    R.shoulder.rotation.x = -0.72 + c * 0.08; R.elbow.rotation.x = 1.42; R.wrist.rotation.z = c * 0.2;
    R.shoulder.rotation.z = R.side * 0.26; grip(R.hand, 0.84);
    rig.head.rotation.x = 0.42; breathe(rig, st, 0.8);
  },
  hauler(rig, spec, st, t) {
    const c = Math.sin(t * 1.1);
    const H = rig.H;
    rig.pelvis.position.y = rig.hipY - 0.03 * H;
    rig.spineLow.rotation.x = 0.24 + c * 0.04;
    rig.spineLow.rotation.z = -0.1;
    planted(rig, spec, st, 0.05, 0);
    for (const key of ['L', 'R']) {
      const A = rig.arms[key];
      A.shoulder.rotation.x = -0.34; A.shoulder.rotation.z = A.side * 0.2;
      A.elbow.rotation.x = 0.5 + (key === 'L' ? 0.5 : 0); grip(A.hand, 1);
    }
    rig.head.rotation.x = 0.18; breathe(rig, st, 1.7);
  },
  watch(rig, spec, st, t) {
    const scan = Math.sin(t * 0.4);
    planted(rig, spec, st, 0.03, 0);
    rig.spineLow.rotation.x = 0.02;
    const R = rig.arms.R, L = rig.arms.L;
    R.shoulder.rotation.x = -0.2; R.shoulder.rotation.z = R.side * 0.3; R.elbow.rotation.x = 1.1; grip(R.hand, 0.95);
    L.shoulder.rotation.x = 0.05; L.shoulder.rotation.z = L.side * 0.16; L.elbow.rotation.x = 0.4; grip(L.hand, 0.3);
    rig.head.rotation.y = scan * 0.46; rig.chest.rotation.y = scan * 0.12;
    breathe(rig, st, 0.7);
  },
  gather(rig, spec, st, t) {
    const p = (t % 4.8) / 4.8;
    const H = rig.H;
    const stoop = settle(clamp01(p / 0.3)) * (1 - settle(clamp01((p - 0.62) / 0.3)));
    rig.pelvis.position.y = rig.hipY - 0.16 * H * stoop;
    rig.spineLow.rotation.x = 0.16 + 0.5 * stoop;
    planted(rig, spec, st, 0.05, -0.02 * stoop);
    const R = rig.arms.R, L = rig.arms.L;
    R.shoulder.rotation.x = 0.2 + 0.5 * stoop; R.shoulder.rotation.z = R.side * 0.24;
    R.elbow.rotation.x = 0.4; grip(R.hand, 0.2 + 0.7 * stoop);
    L.shoulder.rotation.x = -0.5; L.shoulder.rotation.z = L.side * 0.4; L.elbow.rotation.x = 1.5; grip(L.hand, 0.7);
    rig.head.rotation.x = 0.2 + 0.4 * stoop;
    breathe(rig, st, 1.2);
  },
  rite(rig, spec, st, t) {
    const c = Math.sin(t * 0.55);
    planted(rig, spec, st, 0.016, 0);
    rig.spineLow.rotation.x = -0.02;
    for (const key of ['L', 'R']) {
      const A = rig.arms[key];
      A.shoulder.rotation.x = -0.62 + c * 0.06; A.shoulder.rotation.z = A.side * 0.2;
      A.elbow.rotation.x = 1.55; A.wrist.rotation.z = A.side * -0.3; grip(A.hand, 0.12);
    }
    rig.head.rotation.x = 0.16 + c * 0.05;
    breathe(rig, st, 0.44);
  },
  courier(rig, spec, st, t) {
    const c = Math.sin(t * 1.7);
    rig.spineLow.rotation.x = 0.16;
    rig.pelvis.rotation.y = c * 0.2;
    planted(rig, spec, st, 0.03, 0.015);
    const R = rig.arms.R, L = rig.arms.L;
    R.shoulder.rotation.x = -0.7; R.shoulder.rotation.z = R.side * 0.4; R.elbow.rotation.x = 1.4; grip(R.hand, 0.8);
    L.shoulder.rotation.x = -0.3; L.shoulder.rotation.z = L.side * 0.5; L.elbow.rotation.x = 1.2; grip(L.hand, 0.9);
    rig.head.rotation.y = c * 0.44; rig.head.rotation.x = 0.1;
    breathe(rig, st, 1.4);
  },
  smith(rig, spec, st, t) {
    const beat = (t % 1.0) / 1.0;
    const hit = pulse(beat, 0.24, 0.08);
    const H = rig.H;
    rig.pelvis.position.y = rig.hipY - 0.036 * H;
    rig.spineLow.rotation.x = 0.26;
    rig.chest.rotation.y = -0.14 + 0.2 * hit;
    planted(rig, spec, st, 0.052, 0);
    const R = rig.arms.R, L = rig.arms.L;
    R.shoulder.rotation.x = -1.6 + 2.2 * hit; R.shoulder.rotation.z = R.side * 0.34;
    R.elbow.rotation.x = 1.8 - 1.4 * hit; grip(R.hand, 1);
    L.shoulder.rotation.x = -0.95; L.shoulder.rotation.z = L.side * 0.3; L.elbow.rotation.x = 1.45; grip(L.hand, 1);
    rig.head.rotation.x = 0.36; breathe(rig, st, 2);
  },
  listen(rig, spec, st, t) {
    const p = (t % 4.8) / 4.8;
    const turn = Math.sin(p * TAU) * 0.6;
    planted(rig, spec, st, 0.02, 0);
    rig.spineLow.rotation.x = 0.06;
    const L = rig.arms.L, R = rig.arms.R;
    L.shoulder.rotation.x = -1.4; L.shoulder.rotation.z = L.side * 0.1;
    L.elbow.rotation.x = 2.0; grip(L.hand, 0.1);       // hand cupped at the ear
    R.shoulder.rotation.x = 0.08; R.shoulder.rotation.z = R.side * 0.16; R.elbow.rotation.x = 0.3; grip(R.hand, 0.3);
    rig.head.rotation.y = turn; rig.head.rotation.z = -0.16;
    breathe(rig, st, 0.4);
  },
  scout(rig, spec, st, t) {
    const p = (t % 4.8) / 4.8;
    const crouch = settle(clamp01(p / 0.24)) * (1 - settle(clamp01((p - 0.7) / 0.3)));
    const H = rig.H;
    rig.pelvis.position.y = rig.hipY - 0.2 * H * crouch;
    rig.spineLow.rotation.x = 0.14 + 0.34 * crouch;
    planted(rig, spec, st, 0.055, 0.03 * crouch);
    const R = rig.arms.R, L = rig.arms.L;
    R.shoulder.rotation.x = 0.3 + 0.7 * crouch; R.shoulder.rotation.z = R.side * 0.2;
    R.elbow.rotation.x = 0.3; grip(R.hand, 0.1);       // fingertips on the ground
    L.shoulder.rotation.x = -0.4; L.shoulder.rotation.z = L.side * 0.34; L.elbow.rotation.x = 1.3; grip(L.hand, 0.85);
    rig.head.rotation.x = 0.16 + 0.3 * crouch; rig.head.rotation.y = Math.sin(t * 0.9) * 0.34;
    breathe(rig, st, 1.1);
  },
  tend(rig, spec, st, t) {
    const c = Math.sin(t * 1.25);
    rig.spineLow.rotation.x = 0.32;
    planted(rig, spec, st, 0.028, 0);
    const L = rig.arms.L, R = rig.arms.R;
    L.shoulder.rotation.x = -0.92; L.shoulder.rotation.z = L.side * 0.44; L.elbow.rotation.x = 1.7; grip(L.hand, 0.4);
    R.shoulder.rotation.x = -0.84 + c * 0.1; R.shoulder.rotation.z = R.side * 0.3;
    R.elbow.rotation.x = 1.6; R.wrist.rotation.x = c * 0.3; grip(R.hand, 0.3);
    rig.head.rotation.x = 0.46;
    breathe(rig, st, 0.75);
  },
};

/* Signature bases for the thirty-five. Fewer than the occupational set on
   purpose: a signature that is shared is worth less than one that is not,
   so these are deliberately generic and the surface says which characters
   are still waiting for an authored one. */
const SIG = {
  wait(rig, spec, st, t) { CLIPS.idle(rig, spec, st, t); },
  brace(rig, spec, st, t) {
    const p = (t % 5.6) / 5.6;
    const set = settle(clamp01(p / 0.3)) * (1 - settle(clamp01((p - 0.72) / 0.28)));
    const H = rig.H;
    rig.pelvis.position.y = rig.hipY - 0.04 * H * set;
    rig.pelvis.rotation.y = -0.24 * set;
    rig.spineLow.rotation.x = 0.1 * set;
    planted(rig, spec, st, 0.044, 0.02 * set);
    for (const key of ['L', 'R']) {
      const A = rig.arms[key];
      A.shoulder.rotation.x = -0.5 - 0.4 * set; A.shoulder.rotation.z = A.side * (0.2 + 0.3 * set);
      A.elbow.rotation.x = 0.7 + 0.8 * set; grip(A.hand, 0.4 + 0.6 * set);
    }
    rig.head.rotation.x = -0.06 - 0.08 * set;
    breathe(rig, st, 1 + set);
  },
  withhold(rig, spec, st, t) {
    const p = (t % 5.6) / 5.6;
    const close = settle(clamp01(p / 0.34)) * (1 - settle(clamp01((p - 0.7) / 0.3)));
    rig.spineLow.rotation.x = 0.1 + 0.1 * close;
    planted(rig, spec, st, 0.02, 0);
    for (const key of ['L', 'R']) {
      const A = rig.arms[key];
      A.shoulder.rotation.x = -0.3 - 0.5 * close; A.shoulder.rotation.z = A.side * (0.24 + 0.4 * close);
      A.elbow.rotation.x = 0.9 + 0.8 * close; grip(A.hand, 0.3 + 0.6 * close);
    }
    rig.head.rotation.y = -0.2 * close; rig.head.rotation.x = 0.12 * close;
    breathe(rig, st, 0.7);
  },
};

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/* =======================================================================
   THE CAST
   Column meanings: h = crown height in metres. bearing keys into BEARINGS.
   mark is the one thing you would describe them by. Everything not stated
   inherits the faction wardrobe.
   ======================================================================= */
function C(faction, o) {
  const w = WARDROBE[faction];
  return {
    ...w, ...o, faction,
    height: o.h, seed: o.seed,
    tier: o.tier || 'remainder',
    clipTier: o.authoredClip ? 'authored' : 'occupational base',
  };
}

export const CAST = [
  /* ---- The Ember Ledger ---- */
  C('ember_ledger', {
    id: 'npc.maela-voss', name: 'Maela Voss', role: 'Keeper of the Ember Ledger',
    h: 1.66, seed: 0x51a1, tier: 'placed', placed: true, age: 'late fifties', authoredClip: true,
    bearing: 'limp', shortSide: 'R', shortBy: 0.014, highShoulder: 'L', asym: 0.8,
    chest: 0.94, hips: 1.06, armLen: 0.98, hairMass: 0.5, headScale: 1.01,
    coatLen: 0.46, coatPanels: 7, hood: false, mainHand: 'R', leadFoot: 'L', pace: 0.8,
    mark: 'A right hip that failed in the second winter and was never set. She stands square to hide it and the standing is what shows.',
    garment: 'Tallow-linen over ash wool, ink to the elbow on the right sleeve only. The ledger board has worn a bright patch on her left forearm.',
    grading: 'saturate(.72) contrast(1.09) brightness(.82) — the standard character grade, no deviation.',
    signatureClip: maelaSignature, workClip: maelaWork,
    signature: 'Reads a name, finds it already struck through, and presses her thumb flat on the line as though pressure could hold it there.',
  }),
  C('ember_ledger', {
    id: 'npc.avren-doss', name: 'Avren Doss', role: 'Assistant Keeper and ration auditor',
    h: 1.74, seed: 0x51a2, age: 'thirties', bearing: 'stoop', highShoulder: 'R', asym: 0.4,
    chest: 0.9, armLen: 1.03, hairMass: 0.85, coatLen: 0.38,
    mark: 'Writes with the board held against his chest, so his collar is inked black where nobody else\u2019s is.',
    garment: 'Ledger coat two sizes too large, taken from a predecessor and never altered.',
    workClip: OCC.clerk, signatureClip: SIG.withhold,
    signature: 'Closes the audit against his ribs when anyone approaches. Occupational base \u2014 awaiting an authored signature.',
  }),
  C('ember_ledger', {
    id: 'npc.bera-claymother', name: 'Bera Claymother', role: 'Maker of memorial tablets',
    h: 1.61, seed: 0x51a3, age: 'sixties', bearing: 'stiff', asym: 0.6, highShoulder: 'L',
    chest: 1.06, hips: 1.1, armMass: 1.12, hairMass: 0.4, headScale: 1.02, coatLen: 0.3, coatPanels: 5,
    mark: 'Clay to the wrist, permanently. The creases of both hands are grey and will not wash.',
    garment: 'Apron over rolled sleeves; no coat, because a coat in the tablet shed is a hazard.',
    workClip: OCC.smith, signatureClip: SIG.wait,
    signature: 'Turns a finished tablet over twice before she sets it down. Occupational base.',
  }),
  C('ember_ledger', {
    id: 'npc.fenn-joryn', name: 'Fenn Joryn', role: 'Warm-spring keeper',
    h: 1.79, seed: 0x51a4, age: 'forties', bearing: 'even', asym: 0.3,
    chest: 1.08, legLen: 1.03, armMass: 1.1, hairMass: 0.9, coatLen: 0.24, coatPanels: 4,
    mark: 'Scalded forearms, healed shiny. He rolls his sleeves whatever the weather.',
    garment: 'Short oiled jerkin; everything longer rots in the spring house.',
    workClip: OCC.hauler, signatureClip: SIG.wait,
    signature: 'Tests the water with the back of his hand, never the palm. Occupational base.',
  }),
  C('ember_ledger', {
    id: 'npc.dessa-mirel', name: 'Dessa Mirel', role: 'Market reeve',
    h: 1.7, seed: 0x51a5, age: 'fifties', bearing: 'composed', asym: 0.45, highShoulder: 'R',
    chest: 1.0, hips: 1.04, hairMass: 0.6, coatLen: 0.5, coatPanels: 8,
    mark: 'Keeps a brass weight in her coat pocket and the pocket has stretched into a visible pear.',
    garment: 'Reeve\u2019s long coat, brushed. The only garment in the Hold that is deliberately clean.',
    workClip: OCC.watch, signatureClip: SIG.withhold,
    signature: 'Weighs a thing in her hand before she names a price. Occupational base.',
  }),
  C('ember_ledger', {
    id: 'npc.kett-sable', name: 'Kett Sable', role: 'Dusk courier',
    h: 1.68, seed: 0x51a6, age: 'twenties', bearing: 'furtive', asym: 0.5, pace: 1.22,
    chest: 0.88, legLen: 1.05, armLen: 1.02, hairMass: 0.7, coatLen: 0.28, coatPanels: 5, hood: true,
    mark: 'Runs the dusk circuit and sleeps in the day, so the skin under the eyes is a different colour from the rest.',
    garment: 'Hooded short cloak, hem cut ragged on purpose so it does not catch.',
    workClip: OCC.courier, signatureClip: SIG.wait,
    signature: 'Checks the seal on a letter with a thumbnail without breaking stride. Occupational base.',
  }),

  /* ---- The Bell Wardens ---- */
  C('bell_wardens', {
    id: 'npc.torren-vale', name: 'Torren Vale', role: 'Senior Bell-Warden and combat trainer',
    h: 1.82, seed: 0x52a1, tier: 'placed', placed: true, age: 'fifties', authoredClip: true,
    bearing: 'guard', asym: 0.7, highShoulder: 'R', shortSide: 'L',
    chest: 1.14, hips: 1.02, armMass: 1.16, legMass: 1.06, hairMass: 0.35, handScale: 1.08,
    coatLen: 0.44, coatPanels: 7, mainHand: 'R', pace: 0.94,
    mark: 'Rope scar across both palms, and he shakes hands anyway, which is how the story gets told.',
    garment: 'Bellkeeper\u2019s coat with the border-watch flash cut off. The stitch holes are still there.',
    grading: 'Standard character grade; the palms take the drop shadow hardest and should read almost black.',
    signatureClip: torrenSignature, workClip: torrenWork,
    signature: 'Pulls a bell rope that is not there. The arms complete the whole motion and then he looks down at his hands.',
  }),
  C('bell_wardens', {
    id: 'npc.alda-rime', name: 'Alda Rime', role: 'Cadence keeper',
    h: 1.64, seed: 0x52a2, age: 'thirties', bearing: 'ceremonial', asym: 0.35,
    chest: 0.96, hairMass: 0.75, coatLen: 0.48, coatPanels: 8,
    mark: 'Counts under her breath constantly. Her jaw moves even when she is silent.',
    garment: 'Warden black with a bronze cadence pin at the throat, green with verdigris.',
    workClip: OCC.rite, signatureClip: SIG.wait,
    signature: 'Taps the count on her own sternum with two fingers. Occupational base.',
  }),
  C('bell_wardens', {
    id: 'npc.neris-thorn', name: 'Neris Thorn', role: 'Causeway watch captain',
    h: 1.76, seed: 0x52a3, age: 'forties', bearing: 'guard', asym: 0.55, highShoulder: 'L',
    chest: 1.06, legMass: 1.05, hairMass: 0.5, coatLen: 0.42, hood: true,
    mark: 'Left ear gone to frost on the Dunmire circuit; she turns her head fully rather than glancing.',
    garment: 'Hooded warden coat, waxed against causeway spray, salt-bloomed at the hem.',
    workClip: OCC.watch, signatureClip: SIG.brace,
    signature: 'Sets her feet before she answers a question. Occupational base.',
  }),
  C('bell_wardens', {
    id: 'npc.edda-quill', name: 'Edda Quill', role: 'Armorer of the dusk circuit',
    h: 1.69, seed: 0x52a4, age: 'sixties', bearing: 'stiff', asym: 0.65,
    chest: 1.1, hips: 1.08, armMass: 1.14, hairMass: 0.3, handScale: 1.1, coatLen: 0.26, coatPanels: 4,
    mark: 'Both thumbnails are black and have been for years. She does not explain them.',
    garment: 'Leather apron over shirtsleeves; the warden coat hangs on a hook and stays there.',
    workClip: OCC.smith, signatureClip: SIG.wait,
    signature: 'Runs a thumb down an edge to test it, away from herself. Occupational base.',
  }),
  C('bell_wardens', {
    id: 'npc.bram-caul', name: 'Bram Caul', role: 'Young patrol leader',
    h: 1.8, seed: 0x52a5, age: 'twenty-two', bearing: 'even', asym: 0.25, pace: 1.1,
    chest: 1.02, legLen: 1.04, hairMass: 0.95, coatLen: 0.4,
    mark: 'Wears his coat buttoned to the throat in all weather because Vale does.',
    garment: 'New issue, and it looks new, which in Hearthmere is its own kind of conspicuous.',
    workClip: OCC.watch, signatureClip: SIG.brace,
    signature: 'Straightens when spoken to, then over-corrects. Occupational base.',
  }),
  C('bell_wardens', {
    id: 'npc.olan-vey', name: 'Olan Vey', role: 'Ruined-bell surveyor',
    h: 1.71, seed: 0x52a6, age: 'fifties', bearing: 'stoop', asym: 0.5, highShoulder: 'R',
    chest: 0.92, armLen: 1.04, hairMass: 0.45, coatLen: 0.44, coatPanels: 7,
    mark: 'Deaf on the right from standing too close to a bell that finally cracked.',
    garment: 'Warden coat with a surveyor\u2019s rule slung where a weapon should be.',
    workClip: OCC.listen, signatureClip: SIG.wait,
    signature: 'Puts his good ear to cold bronze and waits longer than seems useful. Occupational base.',
  }),

  /* ---- The Reed Sisters ---- */
  C('reed_sisters', {
    id: 'npc.ysra-pell', name: 'Ysra Pell', role: 'Reed-Sister and marsh healer',
    h: 1.63, seed: 0x53a1, tier: 'placed', placed: true, age: 'forties', authoredClip: true,
    bearing: 'composed', asym: 0.6, highShoulder: 'L',
    chest: 0.94, hips: 1.05, armLen: 1.04, hairMass: 0.55, coatLen: 0.5, coatPanels: 8, hood: true,
    mark: 'Keeps her left hand raised and dry when the right is in the water. Even out of the water the left rides higher.',
    garment: 'Waxed mire apron over reed-green wool, charms at the hem so they hang below the waterline and are heard before seen.',
    grading: 'Standard grade; the wet apron should be the only thing in frame with a specular highlight.',
    signatureClip: ysraSignature, workClip: ysraWork,
    signature: 'Reads a patient by touch under blackwater, with the clean hand held above her head.',
  }),
  C('reed_sisters', {
    id: 'npc.nima-reed', name: 'Nima Reed', role: 'Charm weaver',
    h: 1.58, seed: 0x53a2, age: 'twenties', bearing: 'even', asym: 0.4,
    chest: 0.9, hips: 1.0, hairMass: 0.9, coatLen: 0.46, coatPanels: 7,
    mark: 'Reed cuts across all eight fingers, in different stages of healing, always.',
    garment: 'Working robe hung with unfinished charms; they clatter and she has stopped hearing it.',
    workClip: OCC.tend, signatureClip: SIG.wait,
    signature: 'Splits a reed with her thumbnail without looking down. Occupational base.',
  }),
  C('reed_sisters', {
    id: 'npc.cal-harrow', name: 'Cal Harrow', role: 'Pale-salt collector',
    h: 1.77, seed: 0x53a3, age: 'thirties', bearing: 'burden', asym: 0.45, highShoulder: 'R',
    chest: 1.06, legMass: 1.08, hairMass: 0.7, coatLen: 0.32, coatPanels: 5,
    mark: 'Salt-burned to the knee, and the skin there is white where the rest is fen-pale.',
    garment: 'Cut-down waders and a yoke; the yoke has worn through the shoulder of every coat he owns.',
    workClip: OCC.hauler, signatureClip: SIG.brace,
    signature: 'Sets the yoke down in two stages, never one. Occupational base.',
  }),
  C('reed_sisters', {
    id: 'npc.iva-pell', name: 'Iva Pell', role: 'Settlement midwife and faction envoy',
    h: 1.67, seed: 0x53a4, age: 'thirties', bearing: 'composed', asym: 0.35,
    chest: 0.98, hips: 1.06, hairMass: 0.65, coatLen: 0.52, coatPanels: 8,
    mark: 'The only Reed Sister who owns a second, clean robe, kept for other factions\u2019 halls.',
    garment: 'Envoy robe with the charms deliberately removed \u2014 an absence the Sisters notice and nobody else does.',
    workClip: OCC.tend, signatureClip: SIG.withhold,
    signature: 'Folds her hands to stop them doing the work they want to do. Occupational base.',
  }),
  C('reed_sisters', {
    id: 'npc.tess-fen', name: 'Tess Fen', role: 'Causeway undertaker',
    h: 1.72, seed: 0x53a5, age: 'fifties', bearing: 'stiff', asym: 0.55, shortSide: 'L',
    chest: 1.04, armMass: 1.08, hairMass: 0.4, coatLen: 0.48, coatPanels: 7, hood: true,
    mark: 'Carries her own weight on a reed pole; the palm callus is a ring, not a pad.',
    garment: 'Bog-ink robe, hem permanently black to a hand\u2019s width above the water mark.',
    workClip: OCC.hauler, signatureClip: SIG.wait,
    signature: 'Counts the dead aloud, once, and then does not speak. Occupational base.',
  }),
  C('reed_sisters', {
    id: 'npc.roan-drel', name: 'Roan Drel', role: 'Drowned-name listener',
    h: 1.6, seed: 0x53a6, age: 'sixties', bearing: 'reeling', asym: 0.75, highShoulder: 'L',
    chest: 0.88, armLen: 0.96, hairMass: 0.25, headScale: 1.03, coatLen: 0.5, coatPanels: 8, hood: true,
    mark: 'Waterlogged ears that will not drain. He tilts his head to empty one and it is his whole posture now.',
    garment: 'Listening hood weighted at the crown so it stays on when he leans.',
    workClip: OCC.listen, signatureClip: SIG.wait,
    signature: 'Tilts until his ear is level with the water and stops moving entirely. Occupational base.',
  }),

  /* ---- The Cinder Compact ---- */
  C('cinder_compact', {
    id: 'npc.orik-senn', name: 'Orik Senn', role: 'Last Smith of Cinderward',
    h: 1.78, seed: 0x54a1, tier: 'placed', placed: true, age: 'sixties', authoredClip: true,
    bearing: 'burden', asym: 0.85, highShoulder: 'R', shortSide: 'L', shortBy: 0.009,
    chest: 1.18, hips: 1.06, armMass: 1.22, legMass: 1.1, hairMass: 0.3, handScale: 1.14,
    coatLen: 0.22, coatPanels: 4, mainHand: 'R', pace: 0.82,
    mark: 'The right shoulder sits a full inch higher than the left. Fifty years of one-handed work, and no apprentice to take the other side.',
    garment: 'Cinderhide apron scorched through in two places and patched with plate. Sleeves gone above the elbow.',
    grading: 'Standard grade, but the ember-lit variant is legitimate here \u2014 he is the one character who carries his own light source.',
    signatureClip: orikSignature, workClip: orikWork,
    signature: 'Lifts the work with the tongs and holds it, waiting for a second pair of hands that has not existed for years.',
  }),
  C('cinder_compact', {
    id: 'npc.sava-quench', name: 'Sava Quench', role: 'Quench-master',
    h: 1.65, seed: 0x54a2, age: 'forties', bearing: 'even', asym: 0.4, highShoulder: 'L',
    chest: 1.02, hips: 1.04, armMass: 1.06, hairMass: 0.5, coatLen: 0.26, coatPanels: 4,
    mark: 'Steam-scarred across the bridge of the nose, a clean horizontal line like a mark of office.',
    garment: 'Short soot coat, hem singed to a fringe. Goggles pushed up and never worn down.',
    workClip: OCC.smith, signatureClip: SIG.brace,
    signature: 'Listens to the quench rather than watching it. Occupational base.',
  }),
  C('cinder_compact', {
    id: 'npc.tarn-widow', name: 'Tarn Widow', role: 'Keeper of Widow Forge',
    h: 1.83, seed: 0x54a3, age: 'fifties', bearing: 'guard', asym: 0.6,
    chest: 1.2, legMass: 1.12, armMass: 1.18, hairMass: 0.2, handScale: 1.12, coatLen: 0.3, coatPanels: 5,
    mark: 'Keeps the forge of a dead partner lit and will not say whose name is on it.',
    garment: 'Two aprons, one over the other. The under one is not his size.',
    workClip: OCC.smith, signatureClip: SIG.withhold,
    signature: 'Banks the second forge before his own, every night. Occupational base.',
  }),
  C('cinder_compact', {
    id: 'npc.mera-bolt', name: 'Mera Bolt', role: 'Salvage engineer',
    h: 1.62, seed: 0x54a4, age: 'twenties', bearing: 'furtive', asym: 0.5, pace: 1.08,
    chest: 0.9, legLen: 1.02, armLen: 1.05, hairMass: 0.8, coatLen: 0.2, coatPanels: 4,
    mark: 'Goes into the Undercroft to get parts, so her knees and elbows are worn in a pattern nobody else\u2019s are.',
    garment: 'Stripped-down jerkin covered in tool loops, most of them empty.',
    workClip: OCC.gather, signatureClip: SIG.wait,
    signature: 'Taps a machine twice before she trusts it. Occupational base.',
  }),
  C('cinder_compact', {
    id: 'npc.dain-coal', name: 'Dain Coal', role: 'Furnace penitent',
    h: 1.75, seed: 0x54a5, age: 'thirties', bearing: 'stoop', asym: 0.7, highShoulder: 'R',
    chest: 0.94, armLen: 1.06, hairMass: 0.15, headScale: 0.99, coatLen: 0.44, coatPanels: 6, hood: true,
    mark: 'Shaved to the scalp and sooted into it, so the head reads as a dark shape with no features from behind.',
    garment: 'Penitent\u2019s long coat, ash-grey, worn open because closing it is part of the penance he has not earned.',
    workClip: OCC.hauler, signatureClip: SIG.withhold,
    signature: 'Feeds the furnace and does not step back from the heat. Occupational base.',
  }),
  C('cinder_compact', {
    id: 'npc.pritch-glass', name: 'Pritch Glass', role: 'Glasswood harvester',
    h: 1.7, seed: 0x54a6, age: 'forties', bearing: 'stiff', asym: 0.65, shortSide: 'R',
    chest: 1.0, armMass: 1.04, hairMass: 0.6, coatLen: 0.36, coatPanels: 5,
    mark: 'Glass cuts across the forearms in a fan pattern \u2014 the shape of a sap burst, recorded on him.',
    garment: 'Quilted sleeves to the knuckle, replaced constantly, never matching.',
    workClip: OCC.gather, signatureClip: SIG.brace,
    signature: 'Turns his face away before every cut. Occupational base.',
  }),

  /* ---- Custodians of the Exact Word ---- */
  C('exact_word', {
    id: 'npc.gatewarden-nhal', name: 'Nhal Without Shadow', role: 'Gate-Warden of Hollow Abbey',
    h: 1.86, seed: 0x55a1, tier: 'placed', placed: true, age: 'unstated', authoredClip: true,
    bearing: 'composed', asym: 0.15, headScale: 0.98,
    chest: 1.04, hips: 0.96, legLen: 1.06, armLen: 1.04, hairMass: 0, coatLen: 0.58, coatPanels: 9,
    hood: true, veil: true, mainHand: 'R', pace: 0.86,
    mark: 'The most symmetrical body in the cast, deliberately \u2014 he is the one character whose stillness is the point, so his asymmetry is set near zero and everyone else reads as human against him.',
    garment: 'Chalk-linen vestment to the ankle, hood and stitched veil. Nothing on it is worn, which in this world is uncanny rather than clean.',
    grading: 'Standard grade. The veil is the only translucent surface in the cast and should read as two values, not a gradient.',
    signatureClip: nhalSignature, workClip: nhalWork,
    signature: 'Raises one flat hand and holds it up past the point of comfort. He does not speak the refusal.',
  }),
  C('exact_word', {
    id: 'npc.moira-quiet', name: 'Moira Quiet', role: 'Vow archivist',
    h: 1.64, seed: 0x55a2, age: 'fifties', bearing: 'stoop', asym: 0.45,
    chest: 0.92, armLen: 1.02, hairMass: 0.4, coatLen: 0.54, coatPanels: 8, veil: true,
    mark: 'Reads by holding the page a hand\u2019s width from her veil, which means she reads with her whole body angled.',
    garment: 'Archivist\u2019s linen with vow-thread cuffs, one cuff unravelling and not repaired.',
    workClip: OCC.clerk, signatureClip: SIG.withhold,
    signature: 'Turns a page and covers the next one with her palm. Occupational base.',
  }),
  C('exact_word', {
    id: 'npc.seln-clause', name: 'Seln Clause', role: 'Binding advocate',
    h: 1.73, seed: 0x55a3, age: 'forties', bearing: 'composed', asym: 0.3,
    chest: 1.0, hairMass: 0.55, coatLen: 0.56, coatPanels: 9,
    mark: 'Speaks with the hands still, which in a faction of gesture is a stated position.',
    garment: 'Advocate\u2019s vestment, hem weighted so it does not move when he does.',
    workClip: OCC.rite, signatureClip: SIG.wait,
    signature: 'Recites with the eyes closed and the hands at rest. Occupational base.',
  }),
  C('exact_word', {
    id: 'npc.brother-iven', name: 'Brother Iven', role: 'Silent infirmarian',
    h: 1.68, seed: 0x55a4, age: 'thirties', bearing: 'composed', asym: 0.4, highShoulder: 'L',
    chest: 0.98, armLen: 1.03, hairMass: 0.35, coatLen: 0.5, coatPanels: 8, veil: true,
    mark: 'Works with his hands washed to the elbow and raw from it.',
    garment: 'Infirmary linen, sleeves tied back permanently with vow thread.',
    workClip: OCC.tend, signatureClip: SIG.wait,
    signature: 'Places a hand flat on a patient\u2019s sternum and counts without moving his lips. Occupational base.',
  }),
  C('exact_word', {
    id: 'npc.aven-tongueless', name: 'Aven Tongueless', role: 'Hush Order defector',
    h: 1.7, seed: 0x55a5, age: 'unstated', bearing: 'furtive', asym: 0.8, highShoulder: 'R',
    chest: 0.96, armLen: 1.05, hairMass: 0.5, coatLen: 0.42, coatPanels: 6, hood: true,
    mark: 'Kept the Hush veil and cut the mouth out of it, which is a sentence in itself.',
    garment: 'Hush stitched veil, altered. Custodian linen underneath, taken not issued.',
    workClip: OCC.listen, signatureClip: SIG.withhold,
    signature: 'Starts a gesture, stops it, and finishes it differently. Occupational base.',
  }),
  C('exact_word', {
    id: 'npc.teth-varo', name: 'Teth Varo', role: 'Keeper of royal prohibitions',
    h: 1.81, seed: 0x55a6, age: 'sixties', bearing: 'stiff', asym: 0.35,
    chest: 1.06, legMass: 1.02, hairMass: 0.2, coatLen: 0.58, coatPanels: 9,
    mark: 'Wears a stole listing prohibitions and it is long enough that he has to gather it to walk.',
    garment: 'Prohibition stole over full vestment; the stole is the only thing in the abbey allowed a colour.',
    workClip: OCC.rite, signatureClip: SIG.brace,
    signature: 'Gathers the stole before he crosses a threshold. Occupational base.',
  }),

  /* ---- The Unwritten Roads ---- */
  C('unwritten_roads', {
    id: 'npc.vellin-the-unwritten', name: 'Vellin the Unwritten', role: 'Itinerant map-maker',
    h: 1.69, seed: 0x56a1, tier: 'placed', placed: true, age: 'forties', authoredClip: true,
    bearing: 'furtive', asym: 0.55, highShoulder: 'L', shortSide: 'R',
    chest: 0.96, legLen: 1.02, armLen: 1.05, hairMass: 0.7, handScale: 1.04,
    coatLen: 0.44, coatPanels: 7, hood: true, mainHand: 'R', pace: 1.04,
    mark: 'A map case worn across the body so long that the strap has flattened the coat into a permanent diagonal.',
    garment: 'Road coat, rust-dyed, patched at both elbows with different cloth. Every pocket is a map pocket.',
    grading: 'Standard grade. The case strap should be the darkest line on the body \u2014 it is the silhouette.',
    signatureClip: vellinSignature, workClip: vellinWork,
    signature: 'Draws a road that does not exist yet, then looks up to see whether it has arrived. It has not.',
  }),
  C('unwritten_roads', {
    id: 'npc.kora-path', name: 'Kora Path', role: 'Route breaker',
    h: 1.75, seed: 0x56a2, age: 'thirties', bearing: 'even', asym: 0.4, pace: 1.14,
    chest: 1.02, legLen: 1.05, legMass: 1.06, hairMass: 0.75, coatLen: 0.34, coatPanels: 5,
    mark: 'Boots resoled so many times the uppers no longer match the soles in colour.',
    garment: 'Short road coat cut for climbing; a coil of line at the hip instead of a weapon.',
    workClip: OCC.scout, signatureClip: SIG.brace,
    signature: 'Tests a footing with weight before she commits. Occupational base.',
  }),
  C('unwritten_roads', {
    id: 'npc.marn-upland', name: 'Marn Upland', role: 'Cairn reader',
    h: 1.66, seed: 0x56a3, age: 'sixties', bearing: 'stoop', asym: 0.6, highShoulder: 'R',
    chest: 0.94, armLen: 1.0, hairMass: 0.3, coatLen: 0.46, coatPanels: 7,
    mark: 'Reads cairns by touch and has worn the whorls off both index fingers.',
    garment: 'Long road coat, grave-lichen stains at both knees that never come out.',
    workClip: OCC.gather, signatureClip: SIG.wait,
    signature: 'Kneels at a cairn and takes the top stone off before reading it. Occupational base.',
  }),
  C('unwritten_roads', {
    id: 'npc.iri-north', name: 'Iri North', role: 'Reflection cartographer',
    h: 1.71, seed: 0x56a4, age: 'twenties', bearing: 'composed', asym: 0.5, highShoulder: 'L',
    chest: 0.9, armLen: 1.06, hairMass: 0.85, coatLen: 0.48, coatPanels: 8,
    mark: 'Maps by looking at water instead of land, so she walks with her head tilted down and slightly aside.',
    garment: 'Road coat with a polished plate sewn at the cuff \u2014 a mirror she can raise without stopping.',
    workClip: OCC.clerk, signatureClip: SIG.wait,
    signature: 'Raises the cuff mirror to look behind without turning. Occupational base.',
  }),
  C('unwritten_roads', {
    id: 'npc.rin-waymark', name: 'Rin Waymark', role: 'Causeway marker',
    h: 1.79, seed: 0x56a5, age: 'forties', bearing: 'burden', asym: 0.45,
    chest: 1.08, legMass: 1.08, armMass: 1.1, hairMass: 0.6, coatLen: 0.3, coatPanels: 5,
    mark: 'Carries the marker stakes on the same shoulder every day and that shoulder is visibly bigger.',
    garment: 'Waders and a short coat, both mud to the thigh in a tide line.',
    workClip: OCC.hauler, signatureClip: SIG.brace,
    signature: 'Drives a stake in three strikes and never four. Occupational base.',
  }),
  C('unwritten_roads', {
    id: 'npc.elo-veer', name: 'Elo Veer', role: 'Abbey exit finder',
    h: 1.63, seed: 0x56a6, age: 'thirties', bearing: 'furtive', asym: 0.7, highShoulder: 'R',
    chest: 0.88, legLen: 1.03, hairMass: 0.8, coatLen: 0.38, coatPanels: 6, hood: true,
    mark: 'Walks with one hand always touching a wall, and the right sleeve is worn through at the outer edge.',
    garment: 'Dark road coat, hood up indoors, which the Custodians consider an insult and she knows it.',
    workClip: OCC.scout, signatureClip: SIG.withhold,
    signature: 'Finds the door before she looks at the room. Occupational base.',
  }),

  /* ---- The Grave Tithe ---- */
  C('grave_tithe', {
    id: 'npc.sera-dusk', name: 'Sera Dusk', role: 'Tithe route-master',
    h: 1.68, seed: 0x57a1, tier: 'lead', age: 'forties', authoredClip: true,
    bearing: 'furtive', asym: 0.6, highShoulder: 'L', shortSide: 'R',
    chest: 0.94, legLen: 1.03, armLen: 1.04, hairMass: 0.6, handScale: 1.02,
    coatLen: 0.36, coatPanels: 6, hood: true, mainHand: 'L', pace: 1.06,
    mark: 'Counts on the fingers of her off hand while the main hand stays on the hook. She does not look at either.',
    garment: 'Runner\u2019s leathers under a crypt-grey coat cut short at the front and long at the back \u2014 quiet when she walks, covered when she kneels.',
    grading: 'Standard grade. Nothing on her should catch light; she is the darkest silhouette in the cast by intent.',
    signatureClip: seraSignature, workClip: seraWork,
    signature: 'Counts a corridor on her fingers, with her ear turned to it rather than her eyes.',
  }),
  C('grave_tithe', {
    id: 'npc.mott-vane', name: 'Mott Vane', role: 'Reliquary forger',
    h: 1.72, seed: 0x57a2, age: 'fifties', bearing: 'stoop', asym: 0.5, highShoulder: 'R',
    chest: 0.98, armLen: 1.02, hairMass: 0.45, coatLen: 0.4, coatPanels: 6,
    mark: 'Wax under every fingernail, from seals he did not have the right to press.',
    garment: 'Respectable coat, deliberately. He is the only Tithe member who dresses to be seen.',
    workClip: OCC.clerk, signatureClip: SIG.withhold,
    signature: 'Presses a false seal and holds it a beat too long. Occupational base.',
  }),
  C('grave_tithe', {
    id: 'npc.ilse-crow', name: 'Ilse Crow', role: 'Night ration runner',
    h: 1.6, seed: 0x57a3, age: 'twenties', bearing: 'furtive', asym: 0.55, pace: 1.26,
    chest: 0.86, legLen: 1.06, armLen: 1.02, hairMass: 0.75, coatLen: 0.26, coatPanels: 4, hood: true,
    mark: 'Smallest frame in the cast and she uses it \u2014 she stands in doorways rather than rooms.',
    garment: 'Layered short cloaks, all black, none of them hers originally.',
    workClip: OCC.courier, signatureClip: SIG.wait,
    signature: 'Eats standing, facing the exit. Occupational base.',
  }),
  C('grave_tithe', {
    id: 'npc.garran-low', name: 'Garran Low', role: 'Body-path scout',
    h: 1.84, seed: 0x57a4, age: 'thirties', bearing: 'burden', asym: 0.65, highShoulder: 'R',
    chest: 1.12, legMass: 1.1, armMass: 1.14, hairMass: 0.5, coatLen: 0.32, coatPanels: 5,
    mark: 'Tallest in the Tithe, which is a liability in his work, so he walks bent and it has set.',
    garment: 'Grave-mud leathers; the knees are reinforced and the shoulders are not.',
    workClip: OCC.scout, signatureClip: SIG.brace,
    signature: 'Ducks doorways he does not need to duck. Occupational base.',
  }),
  C('grave_tithe', {
    id: 'npc.netta-aster', name: 'Netta Aster', role: 'Living-relic smuggler',
    h: 1.66, seed: 0x57a5, age: 'forties', bearing: 'composed', asym: 0.4,
    chest: 0.96, hips: 1.04, hairMass: 0.7, coatLen: 0.44, coatPanels: 7,
    mark: 'Carries things that are still alive, so she never sets her bag down and never lets it touch her body.',
    garment: 'Padded coat with an interior harness; from outside it reads as a wealthy silhouette, which is the point.',
    workClip: OCC.hauler, signatureClip: SIG.withhold,
    signature: 'Holds the bag away from herself at rest. Occupational base.',
  }),
  C('grave_tithe', {
    id: 'npc.orris-pale', name: 'Orris Pale', role: 'Ash examiner',
    h: 1.7, seed: 0x57a6, age: 'sixties', bearing: 'stiff', asym: 0.6, shortSide: 'L',
    chest: 0.92, armLen: 1.0, hairMass: 0.2, headScale: 1.02, coatLen: 0.42, coatPanels: 6,
    mark: 'Sifts ash for unburned name-tablets and breathes it; the cough is his tell and it is audible before he is visible.',
    garment: 'Grey coat gone greyer, with a cloth at the throat he raises to his face without thinking.',
    workClip: OCC.gather, signatureClip: SIG.wait,
    signature: 'Raises the throat cloth, coughs into it, lowers it. Occupational base.',
  }),
];

export const CAST_BY_ID = Object.fromEntries(CAST.map((c) => [c.id, c]));

/* -------------------------------------------------------------------- voice
   components/codex/CharacterCodexCard.prompt.md is explicit: "Give every
   character a `voice` line." All forty-two, one line each, spoken in the
   register the body already implies — a limp, a rope scar, a raised dry hand.
   Nobody explains themselves and nobody speaks for their faction. The line is
   what they would actually say to you standing there, which is the only test
   that keeps forty-two of these from collapsing into one voice.

   Held apart from CAST so the bodies stay readable as bodies, and so a writer
   can pass over the voices without scrolling through geometry. */
export const VOICES = {
  /* Ember Ledger — the language of record, debt and entitlement */
  'npc.maela-voss': '\u201cIt is written. That is not the same as it being true, and I only keep the writing.\u201d',
  'npc.avren-doss': '\u201cI audit what I am given. Ask her what she gives me.\u201d',
  'npc.bera-claymother': '\u201cI have made four hundred of these. I stopped reading them at sixty.\u201d',
  'npc.fenn-joryn': '\u201cThe spring does not care whose name is on the ration. Neither do I, past the gate.\u201d',
  'npc.dessa-mirel': '\u201cEverything weighs something. Bring it here and we will find out what.\u201d',
  'npc.kett-sable': '\u201cI run at dusk because nobody asks a runner questions in the dark.\u201d',

  /* Bell Wardens — cadence, watch, and what was abandoned */
  'npc.torren-vale': '\u201cI rang a bell for nineteen years and then I did not. Do not ask me the year.\u201d',
  'npc.alda-rime': '\u201cFour, and hold, and four. If you lose the count the bell tells everyone you lost it.\u201d',
  'npc.neris-thorn': '\u201cSay it to my left side. The right gave out on the causeway and it is not coming back.\u201d',
  'npc.edda-quill': '\u201cIt will hold. I did not say it would hold you.\u201d',
  'npc.bram-caul': '\u201cWarden Vale says the bell is the whole of it. I have not worked out yet what he means.\u201d',
  'npc.olan-vey': '\u201cA cracked bell still has an opinion. You have to put your ear on it to hear.\u201d',

  /* Reed Sisters — water, tending, and contamination */
  'npc.ysra-pell': '\u201cOne hand in, one hand clean. Break that and you are the next patient.\u201d',
  'npc.nima-reed': '\u201cThe charm is not the reed. The charm is that somebody sat and cut it.\u201d',
  'npc.cal-harrow': '\u201cSalt takes the legs first and the temper second. I am further along than I look.\u201d',
  'npc.iva-pell': '\u201cI keep a clean robe for your hall. Read into that whatever you like.\u201d',
  'npc.tess-fen': '\u201cEleven this season. I say the number once so it is said, and then I work.\u201d',
  'npc.roan-drel': '\u201cQuiet. Not for me \u2014 you are standing where the water is trying to speak.\u201d',

  /* Cinder Compact — heat, work, and what has no successor */
  'npc.orik-senn': '\u201cHold the other end. No \u2014 you cannot, and that is the whole trouble with this place.\u201d',
  'npc.sava-quench': '\u201cListen to it. If it sings the temper took. If it spits, we start again tomorrow.\u201d',
  'npc.tarn-widow': '\u201cTwo forges, one smith. Do not ask about the second and we will get on.\u201d',
  'npc.mera-bolt': '\u201cIt worked once, down there, in the dark. That is not the same as it working.\u201d',
  'npc.dain-coal': '\u201cThe heat is not punishment. Punishment would mean somebody was keeping count.\u201d',
  'npc.pritch-glass': '\u201cTurn your face. Every cut on my arms is one time I did not.\u201d',

  /* Custodians of the Exact Word — precision, prohibition, silence */
  'npc.gatewarden-nhal': '\u201c\u2014\u201d  (He raises one flat hand and holds it. He does not say the refusal.)',
  'npc.moira-quiet': '\u201cYou may read this page. I will tell you when you may read the next.\u201d',
  'npc.seln-clause': '\u201cThe binding does not need my hands to move. It needs the words to be exact.\u201d',
  'npc.brother-iven': '\u201c(He places a flat hand on your sternum and counts without moving his lips.)\u201d',
  'npc.aven-tongueless': '\u201c(A gesture begun, stopped, and finished as a different word entirely.)\u201d',
  'npc.teth-varo': '\u201cThe stole is long because the list is long. I gather it and I cross anyway.\u201d',

  /* Unwritten Roads — routes that do not exist yet */
  'npc.vellin-the-unwritten': '\u201cI have drawn the road. It has not arrived. Both of those are the work.\u201d',
  'npc.kora-path': '\u201cPut your weight on it before you believe it. That goes for the rock and the man.\u201d',
  'npc.marn-upland': '\u201cTake the top stone off first. A cairn that is read wrong is worse than one unread.\u201d',
  'npc.iri-north': '\u201cI map the water, not the ground. The water has less reason to lie.\u201d',
  'npc.rin-waymark': '\u201cThree strikes. A fourth means I set it wrong and the tide will teach you so.\u201d',
  'npc.elo-veer': '\u201cI found your door before I looked at your room. Do not take it personally.\u201d',

  /* Grave Tithe — counting corridors, moving what should not move */
  'npc.sera-dusk': '\u201cFour turns, two of them blind. I counted before you asked and I will count again.\u201d',
  'npc.mott-vane': '\u201cThe seal is real. Whether the thing under it is real was never my half of the job.\u201d',
  'npc.ilse-crow': '\u201cI eat standing and I stand where the door is. You would too.\u201d',
  'npc.garran-low': '\u201cI duck what I do not need to duck. Cheaper than learning which ones I do.\u201d',
  'npc.netta-aster': '\u201cDo not touch the bag. It is not the bag I am protecting.\u201d',
  'npc.orris-pale': '\u201cSome tablets do not burn. Somebody has to sift, and \u2014 (he raises the cloth and coughs) \u2014 it may as well be me.\u201d',
};

/** Voice coverage, measured. Forty-two authored means forty-two, or say so. */
export function voiceTally() {
  const ids = CAST.map((c) => c.id);
  const have = ids.filter((id) => !!VOICES[id]).length;
  const orphans = Object.keys(VOICES).filter((id) => !ids.includes(id));
  return { total: ids.length, have, missing: ids.length - have, orphans };
}
export const OCCUPATIONS = OCC;
export const SIGNATURES = SIG;

/** Tier counts, measured rather than asserted. */
export function castTally() {
  const t = { placed: 0, lead: 0, remainder: 0, authored: 0, occupational: 0 };
  for (const c of CAST) {
    t[c.tier] = (t[c.tier] || 0) + 1;
    if (c.clipTier === 'authored') t.authored++; else t.occupational++;
  }
  return t;
}
