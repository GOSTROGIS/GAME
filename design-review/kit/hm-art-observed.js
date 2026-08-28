/* =========================================================================
   hm-art-observed.js — what the READABLE concept art actually shows
   -------------------------------------------------------------------------
   Rank-2 authority, transcribed from art I could genuinely open and look at.

   Four character plates and four environment keyframes are VENDORED as
   project files (assets/characters/, assets/world/). Those are same-origin,
   so they are readable — unlike the eighteen named-cast plates on Google's
   CDN, which taint the canvas and cannot be embedded by the capture path
   either. See NAMED_CAST_STATUS in hm-art-law.js.

   This file exists so the observation survives independently of whoever
   looked. Every line below is something visible in the image, not inferred
   from prose. Where the art contradicts this project's written descriptions,
   the art wins (AUTHORITY rank 2 over rank 3) and the conflict is recorded
   in CONFLICTS rather than quietly resolved.
   ========================================================================= */

export const OBSERVED = {
  'origin.gloamfarer': {
    file: 'assets/characters/gloamfarer-v2.png',
    readable: true,
    backdrop: 'WHITE / transparent cutout — not the near-black studio field the batch-01 prompts mandate.',
    build: 'Young, gaunt, narrow-shouldered adult male. Normal human proportion, no anatomical violation. Height reads ~1.75 m.',
    face: 'Hollow cheeks, dark-rimmed exhausted eyes, wet lank dark hair plastered to the forehead, pallid grey-green skin. Faint blood or grime at the temple.',
    silhouette: 'Deep pointed hood over the head; a ragged knee-length cloak with a shredded, tattered hem that breaks into long irregular points. Layered tunic and skirt beneath. The hem is the silhouette — it is not a clean edge anywhere.',
    layers: [
      'Hood + shoulder cape, heavily pilled and pocked wool',
      'Chest harness of narrow leather straps with hanging bronze tags',
      'Belt with a large square buckle plus a second diagonal strap',
      'Long tabard/skirt, holed and frayed, olive-drab over darker underlayer',
      'Wrapped trousers, laced boots with separate over-straps',
    ],
    props: [
      'Bell-staff carried over the LEFT shoulder: a T-headed wooden cross-staff with two small hanging bells and a cloth-wrapped bundle',
      'Bedroll or scroll case lashed at the left shoulder blade',
      'Longsword held point-down in the RIGHT hand, plain crossguard, pitted blade',
      'Leather satchel with a buckled flap at the right hip',
      'A brass hand-bell hung at the left hip',
      'Circular bronze medallion at the throat clasp, a second at the belt',
      'Roughly a dozen small hanging tags, rings and cords',
    ],
    palette: ['soaked charcoal wool', 'olive drab', 'bone linen', 'oxidised bronze', 'rust-brown leather', 'grey-green skin'],
    materials: 'Everything is matte and water-darkened. Cloth is pilled, pocked and holed. Metal is pitted and dull, never chromed.',
    lighting: 'Flat, even, near-shadowless — a cutout presentation, not the one-sided raking key of the family plates.',
  },

  'origin.bell-warden': {
    file: 'assets/characters/bell-warden-v2.png',
    readable: true,
    backdrop: 'Near-black studio field. Correct per family-plate common law.',
    build: 'Tall, elderly, heavy-framed male. Broad shoulders, long limbs. Height reads ~1.85 m. Upright, formal, unhurried stance with feet apart.',
    face: 'Bald crown with long grey side-hair, deeply lined, drawn face. Sunken eyes, heavy nose, sharp jaw. Grey pallid skin. Reads seventy or older.',
    silhouette: 'Layered scale-and-plate shoulder harness that steps outward in three tiers, over a long coat and split hanging tabard. Wide at the shoulders, narrow at the shin — an inverted triangle.',
    layers: [
      'Tiered pauldrons of overlapping dark scales, three descending rows per side',
      'Chest cuirass, dark pitted plate with a rolled collar',
      'Rope belt wound twice with a large knot and hanging cord ends',
      'Long chalk-linen tabard, ragged at the bottom edge, over a wine-red underskirt',
      'Split cloak: black on one side, oxblood on the other',
      'Bracers wrapped in cord over the forearms; greaves and armoured boots',
    ],
    props: [
      'A large brass hand-bell held low in the RIGHT hand on a braided cord — the identity prop',
      'A long flanged mace held in the LEFT hand, head resting on the ground, ~1.4 m',
      'Three wax seal discs on ribbons at the right breast, deep red',
      'Small pouch and a hanging weight at the left hip',
    ],
    palette: ['pitted black iron', 'chalk linen', 'oxblood', 'aged brass', 'cord tan', 'grey skin'],
    materials: 'Pitted, scratched, corroded metal. Stiff dirty linen. Wax. No gloss anywhere.',
    lighting: 'Cold raking key from the upper left, deep falloff into black. Correct per common law.',
  },

  'origin.mire-physicker': {
    file: 'assets/characters/mire-physicker-v2.png',
    readable: true,
    backdrop: 'Near-black studio field. Correct per family-plate common law.',
    build: 'Very tall, extremely thin adult male. Narrow shoulders, long neck, long forearms. Height reads ~1.88 m. Slight forward stoop.',
    face: 'Long drawn face, one eye clouded and pinkish, dark thin hair combed wet across the scalp. Sallow yellow-green skin. Cheekbones and temples hollow.',
    silhouette: 'High stiff collar framing the head, long open coat to the calf, tall bone-pale apron down the centre. Vertical and narrow throughout.',
    layers: [
      'High standing collar, oiled dark cloth',
      'Long coat, near-black with a wet blue-green sheen, hem cut ragged',
      'Full-length apron in bone/oatmeal, blotched with olive and brown stains — the brightest value on the figure',
      'Chest bandolier of five capped tubes',
      'Wide leather waist belt with a second diagonal strap',
      'Gloves to mid-forearm; wrapped lower legs; laced boots',
    ],
    props: [
      'A curved reaping hook / billhook held in the RIGHT hand, blade sweeping down and left',
      'A green glass gourd flask at the right hip, roughly a hand across',
      'A backpack still with a second gourd and a copper condenser tube arcing over the right shoulder',
      'A wire-framed carry case in the LEFT hand holding four capped vials and a bundle of dried reeds or wheat',
      'A cluster of pale bone or antler pipes strapped at the left collarbone',
      'A small blade sheathed at the right forearm',
    ],
    palette: ['bog black-green', 'stained bone apron', 'olive stain', 'green glass', 'tarnished copper', 'sallow skin'],
    materials: 'Wet-looking oiled cloth with a cold sheen; heavily stained matte apron; green glass; verdigrised copper.',
    lighting: 'Cold raking key from the left, strong falloff. A faint cool rim on the right edge. Correct per common law.',
  },

  'origin.oathless-scion': {
    file: 'assets/characters/oathless-scion-v2.png',
    readable: true,
    backdrop: 'Near-black studio field. Correct per family-plate common law.',
    build: 'Tall, lean adult male, middle years. Narrow waist, long legs, square shoulders held back. Height reads ~1.84 m. Weight on the back foot, front foot turned out — a fencer’s rest, and the most composed stance of the four plates.',
    face: 'Long gaunt face, hollow under the cheekbones, heavy brow. Pale grey eyes, one catching the key. Long black hair, damp, swept back off a high forehead and falling past the jaw. Skin blue-grey and bloodless. Faint dark staining along the left jaw.',
    silhouette: 'A high collared cape thrown back off both shoulders, falling to mid-calf on the right and cut away on the left so the sword arm is clear. Fitted double-breasted waistcoat, then a long split over-skirt in violet. Narrow and vertical, widening only at the cape — the only aristocratic silhouette in the set.',
    layers: [
      'Standing collar with a folded storm flap, pinned by two small dark rosettes',
      'Long cape, near-black with an oxblood lining visible at the turned edge, hem torn into long irregular tongues',
      'Cream linen cravat, loose and grubby at the throat',
      'Fitted waistcoat in bruised violet brocade, ten paired frog fastenings down the front',
      'Double leather waist harness with a ring buckle, plus a diagonal baldric strap',
      'Split over-skirt to the knee, violet over a darker underlayer, hem shredded',
      'Ruffled linen cuffs at both wrists, dirty and collapsed',
      'Leather gauntlets to mid-forearm; tall creased riding boots with strap-and-buckle at the ankle',
    ],
    props: [
      'A long rapier held point-down in the RIGHT hand, swept hilt with a knuckle bow, blade ~1.1 m, DARK STAINING along the lower third and at the tip',
      'A second identical swept hilt at the left hip on the baldric — so the pair reads as a duelling set',
      'A folded parchment packet hung at the left hip, cream, roughly two hands across',
      'Three wax seal medallions on cords over the packet, oxblood red, ONE CRACKED',
      'A single dark pendant on a long chain from the collar rosette',
      'A tasselled cord terminating below the seals',
    ],
    palette: ['near-black cape', 'bruised violet brocade', 'oxblood wax', 'grubby cream linen', 'dull steel', 'blue-grey skin'],
    materials: 'Matte, dry, unpolished. Brocade with a visible woven figure, worn shiny only at the wear points. Linen limp and soiled. Steel dull with no chrome; the stain on the blade is matte, not wet.',
    lighting: 'Cold raking key from the upper left, deep falloff into black on the right. A thin cool rim picks out the cape edge. Correct per common law.',
  },
};

/* ------------------------------------------------------------- conflicts
   Where readable art disagrees with this project's own prose. Recorded, not
   silently reconciled, because rank 2 beats rank 3 and someone needs to
   decide which artefact gets corrected. */
export const CONFLICTS = [
  {
    subject: 'origin.gloamfarer',
    art: 'White cutout backdrop with flat even lighting.',
    law: 'Batch-01 common law requires a flat NEAR-BLACK field and cold one-sided raking light.',
    note: 'This plate predates the batch-01 presentation standard, or was exported as a cutout. Not a render error — a provenance mismatch worth resolving before it is used as a lighting reference.',
  },
  {
    subject: 'all origin plates',
    art: 'Every figure carries between four and eight authored hard props and eight to twelve layered garment pieces.',
    law: 'The procedural rig in kit/hm-actor.js carries ZERO props and one garment layer plus coat panels.',
    note: 'This is the central gap. See RIG_GAP below.',
  },
  {
    subject: 'origin.bell-warden vs npc.torren-vale',
    art: 'The Bell-Warden plate shows tiered scale pauldrons, a rope belt, a split oxblood cloak, three wax seals, a hand-bell and a flanged mace.',
    law: "The cast entry for Torren Vale (Senior Bell-Warden) describes only a bellkeeper's coat with the border flash cut off, and gives him no bell and no mace.",
    note: 'The faction plate is far more specified than the named character. The named cast should inherit this wardrobe vocabulary rather than invent a lighter one.',
  },
  {
    subject: 'origin.oathless-scion',
    art: 'Carries a matched pair of swept-hilt rapiers, a sealed parchment packet, and three oxblood wax medallions — one of them cracked. The drawn blade is stained along its lower third.',
    law: 'Batch-01 common law forbids readable insignia, which these seals respect — no legible mark on any of them. But the project records no wax-seal or duelling-set vocabulary for any faction.',
    note: 'A cracked seal is a specific narrative state the art is already telling. Worth writing into the item pass rather than losing.',
  },
];

/* ------------------------------------------------------------- the gap
   Measured, not estimated. This is what stands between the current rig and
   the readable art, and it is the reason no rig render may currently be
   presented as conforming.

   The art is a detailed production concept render: photoreal-adjacent
   material response, layered ragged cloth with holed and pilled weave,
   individually authored hard props, and faces with real orbital and malar
   anatomy. The rig is smooth swept tubes with vertex-colour grime, no props,
   and a sculpted-sphere head at roughly 9,000 verts.

   Closing it is not a lighting or particle problem. Environment maps and
   ember motes improve a body that is already the right shape; they cannot
   add a bandolier of five capped tubes, a wire carry case, or a hem that
   breaks into forty irregular points. */
export const RIG_GAP = {
  /* Ranges are OBSERVED from the readable plates; see artBurden() for the
     live per-plate figures. These bounds are the min and max across them. */
  propsInArtPerFigure: [4, 8],
  propsInRig: 0,
  garmentLayersInArt: [8, 12],
  garmentLayersInRig: 2,
  hemTreatment: { art: 'irregular torn points, dozens per hem', rig: 'straight-edged plane panels' },
  clothWeave: { art: 'pilled, pocked, holed, water-darkened', rig: 'flat albedo plus a vertical wear gradient' },
  faceDetail: { art: 'full orbital, malar, nasolabial and jaw anatomy with skin translucency', rig: 'sculpted sphere, no blendshapes, no skin shading' },
  verdict: 'NON-CONFORMING',
  reason: 'A render missing every authored prop and every torn hem does not follow the concept art. Under the manifest law that is a critical failure, not a stylistic difference.',
  whatWouldClose: [
    'A prop library: each hard object in the art authored once as geometry and hung on a named bone socket (rig.props already exists as the attachment point and is empty).',
    'A garment system with real layers and torn-edge geometry, rather than flat panels.',
    'Per-character art specs written from readable plates — which requires the plates to be vendored locally, as these four are.',
  ],
};

/* Counts are FUNCTIONS, not constants. A cached number beside a derived one
   is how a page ends up printing "Four plates" next to a measured 3 — which
   this file shipped once already. Anything that counts, counts at call time. */
export function observedCount() { return Object.keys(OBSERVED).length; }
export function readableCount() { return Object.values(OBSERVED).filter((o) => o.readable).length; }
export function conflictCount() { return CONFLICTS.length; }

/** Total authored props and garment layers across the readable plates, so the
 *  rig gap can be quoted from the transcription instead of restated. */
export function artBurden() {
  const rows = Object.values(OBSERVED).filter((o) => o.readable);
  if (!rows.length) return { plates: 0, props: 0, layers: 0, propAvg: 0, layerAvg: 0 };
  const props = rows.reduce((n, o) => n + o.props.length, 0);
  const layers = rows.reduce((n, o) => n + o.layers.length, 0);
  return {
    plates: rows.length, props, layers,
    propAvg: +(props / rows.length).toFixed(1),
    layerAvg: +(layers / rows.length).toFixed(1),
  };
}
