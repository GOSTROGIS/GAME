/* =========================================================================
   hm-cast-prompts.js — rank-1 prompts for the named cast
   -------------------------------------------------------------------------
   The gap this closes: batch 01 covers bestiary FAMILIES only, so all
   forty-two named characters had no rank-1 authority at all. Eighteen have
   art on Drive that this process cannot read; twenty-four have nothing.

   Authoring a prompt is design-authority work and it is legitimate here.
   The law forbids using rank-3 prose to CLAIM CONFORMANCE with art I cannot
   see. It does not forbid writing new rank-1 prompts — that is what rank 1
   is. What follows is submitted to the generator (ChatGPT), and the returned
   master becomes rank 2.

   Form is transcribed from family-plates-batch-01.md: thirteen fields in a
   fixed order, the common-law presentation rules repeated verbatim in every
   prompt, and one load-bearing detail per subject that the render is judged
   on first.

   THE COMMON LAW, repeated in every prompt below because batch 01 repeats it:
     flat near-black neutral background, no environment, no ground plane
     cold raking studio light from one side
     UNGRADED neutral presentation
     single full-body subject, three-quarter view, all extremities visible,
       centered, generous silhouette clearance, no crop
     highly polished stylized 3D dark-fantasy MMORPG presentation, original IP
     mature narrow anatomy, restrained material density, grounded materials
     no text, no readable symbols or runes, no logos, no watermark,
       no franchise resemblance, no extra figures, avoid glossy plastic,
       avoid cute or chibi proportions, avoid bright saturation

   ONE DELIBERATE DEPARTURE from the family plates, stated so it is not
   mistaken for drift: these are living people, not undead ecology. So no
   anatomical impossibility is requested. The load-bearing detail is instead
   a piece of EVIDENCE OF A LIFE — a hip that failed and was never set, a
   rope scar on both palms, a shoulder an inch higher than the other. The
   four readable origin plates set this precedent: they are ordinary human
   anatomy carrying four to eight authored props and eight to twelve garment
   layers, and that is where their quality comes from.
   ========================================================================= */

export const FORM = [
  'Use case', 'Asset type', 'Primary request', 'Input images',
  'Scene / backdrop', 'Subject', 'Style / medium', 'Composition / framing',
  'Lighting / mood', 'Color palette', 'Materials / textures',
  'Constraints', 'Avoid',
];

const COMMON = {
  backdrop: 'Flat near-black neutral background. No environment scene. No ground plane. No cast shadow on any surface.',
  style: 'Highly polished stylized 3D dark-fantasy MMORPG presentation. Original IP. Detailed production concept render. Mature narrow anatomy. Restrained material density. Grounded tactile materials.',
  framing: 'Single full-body subject, three-quarter view, all extremities visible, centered, generous silhouette clearance, no crop. UNGRADED neutral presentation.',
  constraints: 'No text, no readable symbols, no runes, no real religious marks. No logos, no watermark. No extra figures or creatures. No franchise resemblance. Avoid glossy plastic. Avoid cute or chibi proportions, bright saturation, exposed entrails.',
};

/** Assemble one prompt into the exact submitted string. */
export function promptText(p) {
  return [
    `Use case: ${p.useCase}`,
    `Asset type: single-character full-body concept master`,
    `Primary request: ${p.request}`,
    `Input images: ${p.inputs}`,
    `Scene / backdrop: ${COMMON.backdrop}`,
    `Subject: ${p.subject}`,
    `Load-bearing detail: ${p.detail}`,
    `Also required: ${p.also.map((s) => `— ${s}`).join('\n  ')}`,
    `Style / medium: ${COMMON.style}`,
    `Composition / framing: ${p.stance} ${COMMON.framing}`,
    `Lighting / mood: ${p.light}`,
    `Color palette: ${p.palette.join(', ')}.`,
    `Materials / textures: ${p.materials}`,
    `Constraints: ${COMMON.constraints}`,
    `Avoid: ${p.avoid.join('; ')}.`,
  ].join('\n\n');
}

/* ======================================================================= */
/* The seven faction leads. Priority order: each already carries an authored
   signature clip, so each is the character their faction is read through. */

export const CAST_PROMPTS = {
  'npc.maela-voss': {
    name: 'Maela Voss',
    faction: 'The Ember Ledger',
    role: 'Keeper of the Ember Ledger',
    useCase: 'stylized-concept',
    request: 'A living human record-keeper in a settlement that burns its dead and keeps their names in clay. Not undead. Not a mage. A civil officer whose authority is entirely bureaucratic and entirely real.',
    inputs: 'None. First master for this subject.',
    subject: 'A woman in her late fifties, 1.66 m, square-shouldered and deliberately upright. She holds a hinged clay-and-timber ledger board against her left forearm and reads from it with her right hand. Her face is dry, closed and unimpressed — the expression of someone who has struck four hundred names through and stopped flinching at sixty.',
    detail: 'Her right hip failed one winter and was never set. She stands SQUARE to hide it, and the hiding is what shows: the right shoulder drops fractionally, the right foot turns out, and her weight is visibly carried on the left leg. Her stance must read as a correction, not as a limp in motion.',
    also: [
      'Ink staining the RIGHT sleeve only, from cuff to elbow, dried in layers of different ages',
      'A bright worn patch on the LEFT forearm where the ledger board has rubbed the wool bare over years',
      'Tallow-linen overcoat to mid-calf, hem torn into irregular points and grey with hearth ash',
      'Ash-wool underlayer, high collar, five bone toggles of which one is missing',
      'A ring of six blank clay name-tags on a wire at her belt, unmarked, hanging at different lengths',
      'A stub of soft graphite tied to the ledger board on a short cord',
      'Reading lenses on a chain, pushed up onto her forehead and forgotten there',
      'Laced boots, oiled and repaired at the toe with a mismatched patch',
    ],
    stance: 'Standing at rest, weight on the left leg, ledger board held closed against the body.',
    light: 'Cold raking studio light from the upper left with deep falloff into black. A single faint dull-ember warmth from below and behind at hem height, as though a hearth were out of frame — no glow on the figure itself.',
    palette: ['hearth-ash grey', 'tallow linen', 'dried ink black', 'fired umber clay', 'oxidised brass', 'pallid grey skin'],
    materials: 'Matte throughout. Pilled and pocked wool with visible weave. Fired clay, chipped at the tag edges. Dried layered ink with a dull sheen where it is thickest. Brass tarnished, never polished.',
    avoid: ['undead or decayed anatomy', 'robes or wizardry', 'ceremonial armour', 'a friendly or maternal expression', 'a clean unworn garment', 'visible writing on any tag'],
  },

  'npc.torren-vale': {
    name: 'Torren Vale',
    faction: 'The Bell Wardens',
    role: 'Senior Bell-Warden and combat trainer',
    useCase: 'stylized-concept',
    request: 'A living human warden who abandoned a border bell and has never said so. Physically capable, visibly older, and carrying the tools of an office he has partly disowned.',
    inputs: 'Bell-Warden origin plate, for wardrobe vocabulary only — tiered scale pauldrons, rope belt, split cloak, wax seals. Do not copy the figure.',
    subject: 'A man in his fifties, 1.82 m, heavy-framed and broad through the chest. Bald crown, grey at the sides, deeply lined face. He stands in a guarded rest with both hands open and slightly forward — a trainer\u2019s habit, not a threat.',
    detail: 'A rope scar crosses BOTH palms, healed pale and hard, running corner to corner. The hands must be fully visible and open enough that both scars read clearly. This is the single most important element in the image.',
    also: [
      'A bellkeeper\u2019s coat with the border-watch flash CUT OFF the left shoulder — the stitch holes remain as a visible rectangle of unfaded cloth',
      'Two tiers of overlapping dark scale at each shoulder, pitted and scratched',
      'A rope belt wound twice with a large knot and two hanging cord ends',
      'A short flanged mace at the left hip, head down, handle wrapped in worn cord',
      'An EMPTY bell-hook at the right hip: a heavy brass ring and a hanging clip with nothing on it',
      'Bracers wound in cord over both forearms, the right one newer than the left',
      'A split cloak, black outside and oxblood within, hanging to the knee and ragged along the bottom edge',
      'Armoured boots, cracked at the flex, one strap replaced with plain leather',
    ],
    stance: 'Guarded rest, feet apart and set, both hands open and forward, palms turned enough to read.',
    light: 'Cold raking studio light from the upper left. The palms must be the brightest values on the figure; everything else falls off hard into black.',
    palette: ['pitted black iron', 'rain-black wool', 'oxblood cloak lining', 'aged brass', 'cord tan', 'weathered grey skin'],
    materials: 'Corroded scale with real pitting. Rain-darkened heavy wool. Salt-stiff rope. Scar tissue matte and slightly paler than the surrounding skin. No gloss anywhere.',
    avoid: ['a heroic or triumphant pose', 'a bell in his hands', 'clean or new armour', 'a generic black knight silhouette', 'skeletal or undead features', 'gore in the scars'],
  },

  'npc.ysra-pell': {
    name: 'Ysra Pell',
    faction: 'The Reed Sisters',
    role: 'Reed-Sister and marsh healer',
    useCase: 'stylized-concept',
    request: 'A living human healer who works with one hand in contaminated water and one hand kept clean, and whose body has set into that discipline.',
    inputs: 'Mire-Physicker origin plate, for material vocabulary only — oiled cloth with a cold wet sheen, stained bone apron, green glass, verdigrised copper. Do not copy the figure.',
    subject: 'A woman in her forties, 1.63 m, composed and economical. She stands with the LEFT hand raised to shoulder height, palm inward, fingers relaxed — held clear rather than gesturing. The right hand is low, loose and visibly darker.',
    detail: 'The two hands do not match, and the mismatch is permanent. The RIGHT hand and forearm are stained to a tide line above the wrist, skin darkened and slightly swollen. The LEFT is pale, dry and clean. Even out of the water the left rides higher — the shoulder itself sits above the right.',
    also: [
      'A waxed mire apron, full length, blotched olive and brown, the brightest value on the figure',
      'Reed-green wool beneath, sleeves rolled unevenly — right higher than left',
      'Charms hung along the apron hem so they sit BELOW the waterline: wax discs, drilled shells, knotted cord, seed pods, at a dozen different lengths',
      'A hooded overcoat pushed back off the head and bunched at the shoulders',
      'A green glass gourd flask at the right hip, a hand across, half full',
      'Four capped bone tubes in a chest bandolier',
      'A curved reed knife sheathed at the left forearm, on the clean side',
      'Wrapped lower legs and laced boots, both dark to the knee with a visible tide mark',
    ],
    stance: 'Standing at rest, left hand raised and held clear at shoulder height, right hand low and open.',
    light: 'Cold raking studio light from the left with strong falloff. The wet apron carries the ONLY specular highlight in the image. A faint cool rim on the right edge.',
    palette: ['bog black-green', 'stained bone apron', 'reed green', 'olive stain', 'green glass', 'fen-pale skin'],
    materials: 'Oiled cloth with a cold wet sheen. Heavily stained matte apron canvas. Green glass, slightly clouded. Cracked wax. Dull drilled shell. Waterlogged reed.',
    avoid: ['a witch silhouette', 'pointed hat', 'a bright or magical glow', 'a mermaid or aquatic anatomy', 'clean vestments', 'undead features', 'a plague-doctor mask'],
  },

  'npc.orik-senn': {
    name: 'Orik Senn',
    faction: 'The Cinder Compact',
    role: 'Last Smith of Cinderward',
    useCase: 'stylized-concept',
    request: 'A living human smith, the last of his forge, whose body has been shaped by fifty years of doing two-handed work alone.',
    inputs: 'None. First master for this subject.',
    subject: 'A man in his sixties, 1.78 m, thick through the chest and forearms. Bald and sooted into the scalp. He holds long tongs in the left hand at chest height, gripping nothing, and a hammer low in the right. He is looking at the tongs, not at the viewer.',
    detail: 'The RIGHT shoulder sits a full inch higher than the left, and the whole torso is rotated slightly with it. Fifty years of one-handed striking with no second pair of hands to take the other side. The asymmetry must be unmistakable in silhouette.',
    also: [
      'Cinderhide apron, scorched THROUGH in two places and patched behind with riveted plate',
      'Both sleeves gone above the elbow — cut away, not torn, with a folded hem',
      'Forearms scarred in a dense fan of small old burns, denser on the left',
      'Long tongs held in the left hand, jaws closed on nothing, heat-blued along the last third',
      'A cross-peen hammer low in the right hand, face bright from use, handle black with grip',
      'A leather glove on the LEFT hand only; the right hand bare',
      'Heavy refractory-stone-soled boots, cracked across the ball of the foot',
      'A short iron rule and three punches in a hip pocket, tops worn round',
    ],
    stance: 'Standing at the anvil position, weight forward, tongs raised at chest height and held as though waiting.',
    light: 'Cold raking studio light from the upper left OPPOSED by a restrained furnace-orange from low right — the only character permitted an internal warm source. The orange must not become an aura; it lights the underside of the tongs and the apron edge and nothing else.',
    palette: ['soot black', 'cinderhide brown', 'furnace orange', 'heat-blued steel', 'dull brick grey', 'sooted skin'],
    materials: 'Powdery soot over everything. Scorched thick hide with hard curled edges. Pitted iron. Heat-blue scale on the tongs. Vitrified slag spatter at the apron hem.',
    avoid: ['heroic power armour', 'a steampunk boiler figure', 'a lava or fire elemental', 'oversized fantasy shoulders', 'a clean forge', 'a triumphant pose', 'glowing eyes'],
  },

  'npc.gatewarden-nhal': {
    name: 'Nhal Without Shadow',
    faction: 'Custodians of the Exact Word',
    role: 'Gate-Warden of Hollow Abbey',
    useCase: 'precise-object-edit',
    request: 'A living human gate-warden whose entire presence is refusal. The quietest and most symmetrical figure in the cast, deliberately — everyone else reads as human against him.',
    inputs: 'Existing Nhal Without Shadow master and cutout, for continuity of vestment and veil. Preserve the silhouette; correct the hand.',
    subject: 'A tall figure, 1.86 m, in a chalk-linen vestment to the ankle with a hood and a stitched veil. He raises ONE flat hand, palm outward, fingers straight and together, and holds it past the point of comfort. He does not speak the refusal.',
    detail: 'Near-perfect bilateral symmetry, held on purpose. Shoulders level, hips level, weight even on both feet, head square. Nothing on the vestment is worn, torn or stained — which in this world reads as uncanny rather than clean. The raised hand is the only asymmetry in the image.',
    also: [
      'Chalk-linen vestment to the ankle, hanging in straight untroubled folds with NO ragged hem — unique in the cast',
      'A hood, up, and a stitched linen veil across the face with no opening for the eyes',
      'The veil must read as TWO VALUES, not a soft gradient — the light side and the shadowed side, with a hard edge between them',
      'Verdigris strips at both cuffs and along the collar, the only colour permitted',
      'No visible hands other than the raised one; the left arm hangs inside the sleeve',
      'Bare feet, clean, flat to the ground',
      'No weapon, no pouch, no charm, nothing hanging anywhere on the figure',
    ],
    stance: 'Standing perfectly square and still, one hand raised flat at chest height with the palm to the viewer.',
    light: 'Cold raking studio light from one side. NO magical glow of any kind. Absolute quiet and restrained dread. The falloff should be gentler than the other plates — he is evenly lit because nothing about him is hiding.',
    palette: ['chalk linen', 'verdigris', 'crypt black'],
    materials: 'Dry unworn linen with a visible but undamaged weave. Worn verdigris strips. Dry wax stitching along the veil seam.',
    avoid: ['a wearable mask reading as a mask over a face', 'a generic evil monk', 'a mummy', 'bright magic', 'any glow', 'a menacing posture', 'a weapon', 'torn or stained cloth'],
  },

  'npc.vellin-the-unwritten': {
    name: 'Vellin the Unwritten',
    faction: 'The Unwritten Roads',
    role: 'Itinerant map-maker',
    useCase: 'stylized-concept',
    request: 'A living human cartographer who draws roads that do not exist yet, and whose body has been reshaped by the case he carries.',
    inputs: 'Existing Vellin the Unwritten master and cutout, for continuity of coat and case. Strengthen the strap deformation.',
    subject: 'A person in their forties, 1.69 m, lean and slightly stooped. A map case is worn across the body on a wide strap. They hold a folded sheet in the left hand and a graphite stub in the right, and they are looking UP and out of frame rather than at the sheet.',
    detail: 'The case strap has been worn so long that it has flattened the coat into a PERMANENT DIAGONAL — a compressed, shiny channel from right shoulder to left hip that stays there whether the case hangs in it or not. It should be the darkest single line on the figure and the thing that defines the silhouette.',
    also: [
      'A rust-dyed road coat to the knee, patched at BOTH elbows with cloth that does not match either the coat or each other',
      'A hood, down, bunched behind the neck',
      'Every pocket on the coat is a map pocket: eight to twelve of them, sewn on at different angles, several with rolled sheet ends protruding',
      'A hard map case, cracked leather, hanging at the left hip with the lid strap undone',
      'A folded sheet held open in the left hand, BLANK — no drawn lines, no marks',
      'A graphite stub in the right hand, held like a knife rather than a pen',
      'A brass compass on a cord, hanging free and unheld',
      'Boots resoled so many times the uppers no longer match the soles in colour',
    ],
    stance: 'Standing mid-stride and stopped, weight settling, head lifted to look out of frame past the viewer.',
    light: 'Cold raking studio light from the upper right, so the strap channel across the chest falls into shadow and reads as a hard dark diagonal.',
    palette: ['rust-dyed wool', 'road mud brown', 'cracked leather', 'graphite grey', 'oxidised brass', 'weathered skin'],
    materials: 'Coarse rust-dyed wool, felted and shiny along the strap line. Cracked dry leather. Soft graphite with visible dust on the fingers. Brass green in the crevices.',
    avoid: ['a wizard or scholar silhouette', 'a scroll-and-quill cliché', 'visible drawn lines or writing on any sheet', 'a clean coat', 'an adventurer\u2019s backpack', 'undead features'],
  },

  'npc.sera-dusk': {
    name: 'Sera Dusk',
    faction: 'The Grave Tithe',
    role: 'Tithe route-master',
    useCase: 'stylized-concept',
    request: 'A living human smuggler who counts corridors by ear before entering them. The darkest silhouette in the cast by intent.',
    inputs: 'Existing Sera Dusk master and cutout, for continuity of the cut-short-front coat. Preserve the silhouette.',
    subject: 'A woman in her forties, 1.68 m, small-framed and still. Her right hand rests on a hook at her belt. Her left hand is raised slightly and held with two fingers extended and two folded — mid-count. Her head is TURNED AWAY, ear forward, listening rather than looking.',
    detail: 'She is counting on the fingers of her off hand and she is not looking at them. The left hand must be clearly mid-count — some fingers open, some closed, unambiguous — while both her face and her eyes are turned to the side, away from the hand and away from the viewer.',
    also: [
      'A crypt-grey coat cut SHORT at the front and LONG at the back — quiet when she walks, covering when she kneels',
      'Runner\u2019s leathers beneath, close-fitted, matte, worn through at both knees',
      'A hood, up, shadowing the upper face but leaving the ear and jaw line clear',
      'A heavy iron hook at the right hip, wrapped in cord, hanging from a ring',
      'A coil of thin black line at the small of the back',
      'Wrapped hands with the fingertips CUT AWAY on the left hand only',
      'Soft-soled boots, seams doubled, no buckles or metal anywhere on the feet',
      'Nothing on her that could catch light: no brass, no glass, no polished surface',
    ],
    stance: 'Standing still and low, weight even and slightly sunk, head turned to present the ear, left hand raised mid-count.',
    light: 'Cold raking studio light from one side, and she should barely take it. She is the darkest figure in the set — the light finds the ear, the jaw, the counting fingers, and almost nothing else.',
    palette: ['crypt grey', 'matte black leather', 'grave mud brown', 'dull dark iron', 'pallid skin'],
    materials: 'Matte fulled wool that absorbs light. Soft blackened leather, dry not oiled. Cord-wrapped iron. Absolutely no specular anywhere on the figure.',
    avoid: ['a hooded assassin cliché', 'visible weapons in hand', 'a cape', 'any reflective metal', 'a menacing crouch', 'glowing eyes', 'undead features'],
  },
};

/** Which named-cast subjects have a prompt, measured against the cast list. */
export function promptCoverage(castIds) {
  const have = castIds.filter((id) => !!CAST_PROMPTS[id]);
  return {
    total: castIds.length,
    written: have.length,
    missing: castIds.length - have.length,
    ids: have,
  };
}

export function promptList() {
  return Object.entries(CAST_PROMPTS).map(([id, p]) => ({ id, ...p, text: promptText(p) }));
}
