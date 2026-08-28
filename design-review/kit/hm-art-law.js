/* =========================================================================
   hm-art-law.js — THE MANIFEST LAW
   -------------------------------------------------------------------------
   AUTHORITY ORDER. Declared once, binding on every render in this project:

     1. THE CONCEPT-ART PROMPT is law.  The exact prompt string submitted to
        generate a canonical master is the highest authority. It is the only
        artefact that states intent in words, and it is the only one a
        non-visual process can read in full.
     2. THE CONCEPT ART is law after that.  Where the art and a written
        description disagree, the art wins over the description; where the
        art and the PROMPT disagree, the prompt wins, because the prompt is
        what was approved.
     3. Everything else — this project's prose, my own material choices, any
        procedural rig — is subordinate. It may fill gaps. It may not
        contradict, and it may not guess.

   NO GUESSING. A render that is not traceable to a prompt line or a visible
   art feature is a CRITICAL FAILURE, not a stylistic difference. The correct
   response to missing authority is to REFUSE TO RENDER and say why, never to
   invent something plausible and let it pass as canon.

   Source of the prompts below: Drive `prompts/family-plates-batch-01.md`
   ("Family Plates Batch 01 — Exact Image Prompts"), read 2026-08-26. Ten
   approved canonical concept masters. Fields are transcribed from those
   prompt strings, condensed for machine use, never paraphrased into new
   intent. `promptCall` is the generation call id recorded in that file, so
   any line here can be traced back to the exact submitted prompt.

   WHAT THIS FILE IS NOT: it is not a description of the named cast. The
   batch-01 prompts cover BESTIARY FAMILIES only. No prompt exists in Drive
   for any of the forty-two named characters, which has a hard consequence
   recorded in `NAMED_CAST_STATUS` at the bottom of this file.
   ========================================================================= */

export const AUTHORITY = [
  { rank: 1, name: 'Concept-art prompt', binding: true,
    note: 'The exact approved prompt string. Highest authority. Readable in full without seeing the image.' },
  { rank: 2, name: 'Concept art', binding: true,
    note: 'The rendered canonical master. Beats prose. Loses to its own prompt.' },
  { rank: 3, name: 'Project prose and rigs', binding: false,
    note: 'May fill gaps. May never contradict ranks 1 or 2, and may never guess.' },
];

/* Rules that appear in EVERY batch-01 prompt. Common law: they bind every
   family plate, so a render that breaks one breaks the law even if it
   matches its own subject line. */
export const COMMON_LAW = {
  backdrop: 'Flat near-black neutral background. No environment scene. No ground plane.',
  lighting: 'Cold raking studio light from one side.',
  grading: 'UNGRADED neutral presentation.',
  framing: 'Single full-body subject, all extremities visible, three-quarter view, centered, generous silhouette clearance, no crop.',
  medium: 'Highly polished stylized 3D dark-fantasy MMORPG presentation. Original IP. Detailed production concept render.',
  anatomy: 'Mature narrow anatomy. Restrained material density. Grounded tactile materials.',
  horror: 'Impossible articulation, environmental absence and ritual repetition carry the horror. Gore secondary.',
  forbidden: [
    'No real-world disease taxonomy',
    'No disability-as-hostility shorthand',
    'No extra figures or creatures',
    'No text, readable symbols, runes or real religious marks',
    'No logos, no watermark',
    'No franchise resemblance',
    'Avoid glossy plastic',
    'Avoid cute or chibi proportions, bright saturation, exposed entrails',
  ],
};

/* A note the design system and this law disagree about, recorded rather than
   silently resolved: tokens/effects.css grades character art with
   --grade-character (saturate .72 / contrast 1.09 / brightness .82), while
   every batch-01 prompt specifies UNGRADED neutral presentation. Both are
   correct in their own place — the masters are authored ungraded, the game
   surface grades them on display. So the grade is a PRESENTATION layer and
   must never be baked into an asset. */
export const GRADING_RULE = {
  authored: 'ungraded neutral',
  presented: 'var(--grade-character)',
  bakeIntoAsset: false,
  note: 'Grade at display time only. A graded master is a corrupted master.',
};

/* ======================================================================= */
/* THE TEN. `chassis` is what a 3D rig would need in order to obey the
   prompt — not what any current rig happens to be. `violation` is the one
   anatomical impossibility the prompt makes load-bearing; it is the thing a
   render is judged on first, because it is the family's identity. */

export const FAMILY_LAW = {
  ashbound: {
    name: 'Ashbound',
    promptCall: 'call_nIgtNVLVAaxYFQ2Pt3fXba2w',
    useCase: 'stylized-concept',
    chassis: 'humanoid-collapsed',
    subject: 'A hideous undead occult-ecology creature animated by names incompletely burned from clay ledgers. Human-derived body in a collapsed posture whose anatomy has already surrendered while its address remains standing.',
    violation: 'Ribcage and abdomen have fired into a narrow vertical archive of cracked clay address drawers, with black smoke issuing through seams between flesh and ceramic. Several blank clay name tags are fused through the throat like vertebrae.',
    alsoRequired: [
      'Head hangs at an impossible angle but is not gory',
      'Limbs ash-dried, MISMATCHED IN LENGTH, pulled taut by soot-black script threads',
    ],
    palette: ['ash gray', 'old blackened cloth', 'fired umber clay', 'dull ember', 'smoke black'],
    materials: ['cracked fired clay', 'powdery cinder skin', 'frayed rain-dark cloth', 'carbonized tags', 'matte soot'],
    light: 'Cold raking studio light from one side with a VERY FAINT dull-ember glow inside the clay seams.',
    fx: { kind: 'ember-seam', restraint: 'very faint, inside the seams only — not an aura' },
    avoid: ['zombies with generic wounds', 'clean heroic armor', 'glamorous face', 'photobashed real people'],
  },

  cairn_beasts: {
    name: 'Cairn Beasts',
    promptCall: 'call_3DCkzchVv1431C8jGd8UjVSp',
    useCase: 'stylized-concept',
    chassis: 'quadruped-low',
    subject: 'A terrifying low quadrupedal grave-heat scavenger that nests in warm cairns and carries grave lichen through black-pine uplands.',
    violation: 'Its ribcage is replaced by a ROTATING dry-stone cairn, each fitted stone slowly orbiting a red-black hollow where organs should be.',
    alsoRequired: [
      'Four rangy mammalian limbs attach at DIFFERENT ELEVATIONS in the cairn and bend with asymmetrical joints',
      'Charcoal fur survives only in ragged islands between stone growths',
      'Blunt EYELESS head split by a vertical flint seam',
      'Breath visibly heats the stones without flame',
    ],
    palette: ['charcoal fur', 'grave lichen green', 'warm weathered stone', 'flint black', 'muted ember red'],
    materials: ['damp coarse fur', 'lichen-crusted stacked stone', 'chipped flint', 'mineral dust', 'condensed heat breath'],
    light: 'Cold raking studio light from one side, faint warm grave heat exhaling between the stones.',
    fx: { kind: 'heat-breath', restraint: 'heat without flame, between stones' },
    avoid: ['familiar fantasy wolf', 'oversized heroic musculature', 'generic zombie animal'],
  },

  march_deserters: {
    name: 'March Deserters',
    promptCall: 'call_tsmk6ScuQHgGgAMN4G0FHUMj',
    useCase: 'precise-object-edit',
    chassis: 'humanoid-segmented-suspended',
    subject: 'An impossible undead MILITARY ecology, not an ordinary armored humanoid. Sealed featureless helm, blank split standard.',
    violation: 'Chest and abdomen replaced by a deep vertical trench-like cavity containing tiny synchronized marching silhouettes in fog, with no flesh or organs.',
    alsoRequired: [
      'A SINGLE CONTINUOUS blank ration receipt visibly stitched through every shoulder, elbow, wrist, hip, knee and ankle as the ONLY tendons',
      'Widely separated segmented armor pieces hang in an impossible guarded formation',
      'The blank standard passes physically THROUGH the trench cavity and emerges from pelvis and spine',
      'One leg lengthened and the other shortened so both boots touch the same invisible marching line',
      'Short battered polearm and shield, scrubbed of all heraldry, visually subordinate',
    ],
    palette: ['rust', 'black wool', 'wax red'],
    materials: ['corroded iron', 'rain-black wool', 'blank paper receipt', 'cracked sealing wax', 'fog'],
    light: 'Cold raking studio light. Muted wax-red thread highlights.',
    fx: { kind: 'trench-fog', restraint: 'fog inside the cavity, containing the marching silhouettes' },
    avoid: ['generic black knight', 'heroic soldier', 'normal plate-armored anatomy', 'Bell Warden silhouette', 'skeleton soldier'],
  },

  drowned_parish: {
    name: 'Drowned Parish',
    promptCall: 'call_L3NcHEm8i3Dd9D43p0MrGFli',
    useCase: 'stylized-concept',
    chassis: 'humanoid-processional',
    subject: 'A member of a drowned congregation still repeating fragments of its final service. Human-derived but waterlogged, with a bowed processional posture.',
    violation: 'The chest is an open flooded nave whose ribs have lengthened into two parallel rows of tiny warped pew boards, with black water visibly flowing UPWARD between them and disappearing into the throat.',
    alsoRequired: [
      'Head enclosed by a circular halo woven from DRIPPING LIVING REEDS',
      'Face smooth and eyeless beneath a thin MOVING film of water',
      'Long robes stream HORIZONTALLY as if submerged though the figure stands in empty air',
      'Fingers branch into cold candle-wick tips, UNLIT',
    ],
    palette: ['reed green', 'estuary silt brown', 'corpse pale', 'rain black', 'muted cold blue'],
    materials: ['saturated heavy robes', 'slimy reeds', 'warped drowned wood', 'mineral water film', 'silt deposits'],
    light: 'Cold raking studio light from one side; dim blue-gray reflection from the impossible chest water.',
    fx: { kind: 'inverted-water', restraint: 'water must visibly DISOBEY GRAVITY' },
    avoid: ['ordinary drowned zombie', 'sea pirate', 'mermaid', 'generic ghost', 'clean vestments'],
  },

  reed_coven: {
    name: 'Reed Coven',
    promptCall: 'call_nT0Nqp15J7zMJmskI6oGcD9Y',
    useCase: 'stylized-concept',
    chassis: 'humanoid-stilted-caged',
    subject: 'A mire-worker who bargained with the drowned parish and is becoming part of its wetland rites. Crooked humanoid silhouette, clearly a supernatural ritual ecology rather than a generic witch.',
    violation: 'The torso is a suspended woven reed cage containing several BORROWED HUMAN SILHOUETTES MADE ONLY FROM FOG; each silhouette faces a different direction and pulls one joint out of alignment.',
    alsoRequired: [
      'Head is an oversized EYELESS REED MASK WITH NO SKULL BEHIND IT, cantilevered forward on braided wet stalks',
      'Both arms branch into uneven charm-rack spars carrying dozens of small wax, shell, knot and seed charms',
      'THE HANDS ARE ABSENT',
      'Bundled stilt legs touch the ground at only TWO narrow reed knots',
    ],
    palette: ['pale dead reed', 'bog ink black', 'muted marshlight green', 'tarnished shell gray', 'old wax brown'],
    materials: ['split waterlogged reed', 'knotted cord', 'cracked wax', 'dull shell', 'wet seed pods', 'thin volumetric fog'],
    light: 'Cold raking studio light from one side; faint restrained marshlight green inside the chest cage.',
    fx: { kind: 'cage-fog', restraint: 'fog silhouettes inside the cage; marshlight faint' },
    avoid: ['pointed witch hat', 'broom', 'familiar fantasy shaman', 'plague-doctor mask', 'bright magic'],
  },

  kilnforged: {
    name: 'Kilnforged',
    promptCall: 'call_8pJvOCIcTUx0WkyNX6yvJl8X',
    useCase: 'stylized-concept',
    chassis: 'humanoid-bottom-heavy-industrial',
    subject: 'A foundry worker fused into the furnace system they were ordered to seal. Weighted armored silhouette, MUCH BROADER AT THE LOWER TORSO THAN THE SHOULDERS.',
    violation: 'Three separate furnace chambers occupy the torso and pelvis with OPEN AIR GAPS between them, while visible CHAIN TENDONS span those gaps and pull the limbs from inside the glowing chambers.',
    alsoRequired: [
      'The rib area is a bank of soot-clogged vent grilles that opens like gills',
      'Head is a small warped firebrick kiln mouth with NO FACE; a hinged iron damper behaves like a jaw but contains only banked mineral heat',
      'Forearms end in ASYMMETRICAL foundry tools grown through slag-crusted gauntlets — one blunt clinker rake, one gripping tong',
      'Each step braced by heavy cracked refractory-stone feet',
    ],
    palette: ['soot iron', 'furnace orange', 'black heat scale', 'dull brick gray', 'muted oxide red'],
    materials: ['pitted forged iron', 'cracked firebrick', 'vitrified slag', 'greasy chain', 'heat-blued scale', 'powdery soot'],
    light: 'Cold raking studio light from one side OPPOSED BY restrained furnace-orange heat inside the chambers.',
    fx: { kind: 'chamber-heat', restraint: 'restrained; inside the chambers, opposing the key' },
    avoid: ['heroic power armor', 'steampunk boiler person', 'clean medieval knight', 'generic lava elemental', 'oversized fantasy shoulders'],
  },

  glasswood_brood: {
    name: 'Glasswood Brood',
    promptCall: 'call_I01tyal8BNLwWNgLRdLDYnxP',
    useCase: 'stylized-concept',
    chassis: 'hexapod-angular',
    subject: 'Fauna cut and remade by iron trees whose sap cools into razor glass. A tall angular SIX-LEGGED browsing beast, neither deer nor insect, with a narrow counterbalanced torso and BROKEN BACKWARD KNEES.',
    violation: 'Translucent organs hang OUTSIDE both open flanks in separate amber sap-glass vessels, connected across the empty body cavity by hair-thin black root filaments.',
    alsoRequired: [
      'Skull is a hollow obsidian wedge with NO JAW',
      'Two asymmetrical antler fans of razor glass grow BACKWARD through the neck and emerge again along the spine as locomotion hinges',
      'Six legs terminate in split ironwood points that CANNOT STAND FLAT, giving a precise stilted gait',
      'No fur except sparse glass-fiber bristles at the joints',
    ],
    palette: ['obsidian black', 'oil-slick muted rainbow', 'sap gold', 'ironwood brown', 'bruised translucent violet'],
    materials: ['chipped volcanic glass', 'oily iridescence', 'fibrous black wood', 'viscous amber sap', 'taut root filament'],
    light: 'Cold raking studio light from one side refracting MINIMALLY through the glass; restrained sap-gold internal glow.',
    fx: { kind: 'sap-glow', restraint: 'internal, sap-gold, restrained' },
    avoid: ['normal deer, elk or wolf', 'generic crystal animal', 'insectoid monster', 'bright rainbow crystal', 'heroic mount'],
  },

  hush_order: {
    name: 'Hush Order',
    promptCall: 'call_ZMLgkyB03Utfk32EMmXyU5V9',
    useCase: 'precise-object-edit',
    chassis: 'humanoid-cord-skeleton',
    subject: 'A creature whose skeleton is ONE — and only one — uninterrupted CLOSED-LOOP PRAYER CORD. Composed opposing-foot stance, quiet ritual mood.',
    violation: 'Linen removed from chest, abdomen, shoulders and the inside of both arms, leaving broad BLACK NEGATIVE-SPACE GAPS around the cord. The same thick braided cord must be visually traceable WITHOUT OCCLUSION: hollow head shell → down the throat as a spine → out through the left shoulder and left arm → through the left wrist and a low front loop → through the right wrist and right arm → back through the right shoulder → into a clearly visible RETURN KNOT at the upper spine.',
    alsoRequired: [
      'NO separate rope segments, NO hidden waist connection, NO ordinary bones or flesh inside the gaps',
      'Linen skirt and small shoulder panels suspended from sparse cord knots without covering the route',
      'Head is an unmistakably EMPTY stitched linen shell, lower half opened widely into black negative space, cord passing freely through it',
      'No face-like volume behind the closed lid seams. The shell must NOT read as a mask worn over a head',
    ],
    palette: ['chalk linen', 'verdigris'],
    materials: ['grounded frayed linen', 'salt-stiff cord', 'worn verdigris strips', 'dry wax stitching'],
    light: 'Cold raking studio light. NO MAGICAL GLOW. Absolute quiet and restrained dread.',
    fx: { kind: 'none', restraint: 'explicitly none — the prompt forbids magical glow' },
    avoid: ['separate decorative ropes', 'hidden cord joins', 'normal body under linen', 'wearable mask', 'generic evil monk', 'mummy', 'bright magic'],
  },

  echo_choir: {
    name: 'Echo Choir',
    promptCall: 'call_c9WTemM5npiP7DUboc9h3ZDJ',
    useCase: 'precise-object-edit',
    chassis: 'bodyless-acoustic',
    subject: 'A BODYLESS open mouth. It must not read as a portal, tunnel, coiled disc or solid shell.',
    violation: 'The mouth is detached completely and floats alone in black negative space with NO skull, throat, tunnel or solid surface behind it. Twelve to sixteen WIDELY SEPARATED translucent pressure fronts are arranged around and behind it at different depths and eccentric angles.',
    alsoRequired: [
      'Each pressure front is a THIN INCOMPLETE crescent or broken oval of resonant dust and barely visible compressed air, with LARGE BLACK GAPS between every arc',
      'Arcs propagate OUTWARD LATERALLY like captured sound waves — they must not recede inward toward a vanishing point',
      'One small cracked urn or memory-bronze fragment suspended on each arc, sparse enough never to merge into walls',
      'Three longest lower arcs taper into resonance tails',
      'Inside the mouth: a shallow violet-black negative-space chamber with two or three smaller mouth-shaped absences. No deep perspective',
    ],
    palette: ['bronze', 'crypt black', 'muted violet'],
    materials: ['compressed air', 'resonant dust', 'cracked ceramic', 'tarnished bronze', 'negative-space anatomy'],
    light: 'Cold raking studio light catches isolated dust and urn edges; restrained violet echo. A silent image implying unbearable sound.',
    fx: { kind: 'pressure-fronts', restraint: 'the arcs ARE the creature, not an effect on it' },
    avoid: ['eldritch portal', 'wormhole', 'vortex', 'coiled disc', 'screaming head', 'floating skull', 'ghost woman', 'angel', 'speaker machine'],
  },

  ossuary_vermin: {
    name: 'Ossuary Vermin',
    promptCall: 'call_4fTql3rHjFCV17dMm01wOkYp',
    useCase: 'stylized-concept',
    chassis: 'composite-wheel',
    subject: 'Small scavengers that assemble borrowed skeletons into an ambitious communal body. A low scrambling composite organism with NO CENTRAL TORSO.',
    violation: 'NINE mismatched borrowed skulls face INWARD to form a load-bearing hollow wheel, each skull serving as a joint socket for two incompatible limbs. EIGHTEEN limbs radiate from the skull wheel at unequal angles, but only SIX touch the ground at once.',
    alsoRequired: [
      'Every limb is assembled from ALTERNATING FINGER BONES AND LOWER JAWS, never normal long bones',
      'The entire wheel is tightened by living mold-green ligament threads',
      'Within the central hollow, many tiny pale tooth-like vermin move in SYNCHRONIZED CIRCLES, visibly maintaining the structure',
      'The outside skull faces remain empty and expressionless',
    ],
    palette: ['old bone', 'mold green', 'tooth white', 'crypt black', 'muted ligament brown'],
    materials: ['porous age-darkened bone', 'cracked enamel', 'dusty mold', 'fibrous dry ligament', 'matte chitin'],
    light: 'Cold raking studio light from one side. NO magical glow. Intelligent communal motion implied through repetition.',
    fx: { kind: 'vermin-circulation', restraint: 'motion, not light' },
    avoid: ['generic skeleton spider', 'skull pile', 'centipede', 'fantasy necromancer summon', 'cute swarm'],
  },
};

/* ---------------------------------------------------------------- chassis
   What each family would need in order to obey its prompt, against what the
   humanoid rig in hm-actor.js can actually build. This table is the reason
   the bestiary section renders nothing: five of the ten need a chassis that
   does not exist, and the five nominally humanoid ones each require a
   torso that is NOT a torso — a clay drawer archive, a trench cavity, a
   flooded nave, a reed cage, three furnace chambers. The humanoid rig
   cannot express any of those, so using it would be a critical failure
   under the law rather than an approximation of it. */
export const CHASSIS_STATUS = {
  'humanoid-collapsed': { exists: false, nearest: 'hm-actor humanoid', blocker: 'Torso must be an archive of cracked clay drawers, not a ribcage. Limbs mismatched in length.' },
  'humanoid-segmented-suspended': { exists: false, nearest: 'hm-actor humanoid', blocker: 'Armor segments hang separated on a single receipt tendon; torso is a fog trench.' },
  'humanoid-processional': { exists: false, nearest: 'hm-actor humanoid', blocker: 'Chest is an open flooded nave with upward-flowing water; robes stream horizontally.' },
  'humanoid-stilted-caged': { exists: false, nearest: 'hm-actor humanoid', blocker: 'Torso is a reed cage of fog silhouettes; hands absent; two-point stilt contact.' },
  'humanoid-bottom-heavy-industrial': { exists: false, nearest: 'hm-actor humanoid', blocker: 'Three furnace chambers with open air gaps and chain tendons crossing them.' },
  'humanoid-cord-skeleton': { exists: false, nearest: 'hm-actor humanoid', blocker: 'Skeleton is one traceable closed-loop cord through broad negative-space gaps.' },
  'quadruped-low': { exists: false, nearest: 'none', blocker: 'No quadruped chassis. Ribcage is a rotating dry-stone cairn.' },
  'hexapod-angular': { exists: false, nearest: 'none', blocker: 'No hexapod chassis. Backward knees, external organ vessels, antler-spine hinges.' },
  'bodyless-acoustic': { exists: false, nearest: 'none', blocker: 'No body at all. Detached mouth plus 12-16 separated pressure arcs.' },
  'composite-wheel': { exists: false, nearest: 'none', blocker: 'Nine-skull load-bearing wheel, eighteen limbs of alternating jaws and finger bones.' },
};

/* ------------------------------------------------------- conformance gate
   The law's teeth. Call this before showing ANY render. It returns a verdict
   the surface is obliged to print — including, and especially, when the
   verdict is a refusal. */
export function conformance(subjectId) {
  const fam = FAMILY_LAW[subjectId];
  if (fam) {
    const ch = CHASSIS_STATUS[fam.chassis] || { exists: false, blocker: 'Unknown chassis.' };
    if (!ch.exists) {
      return {
        verdict: 'REFUSED',
        authority: 'prompt',
        promptCall: fam.promptCall,
        reason: `The prompt requires a ${fam.chassis} chassis. ${ch.blocker}`,
        law: 'Rendering this with the humanoid rig would contradict rank-1 authority. Refusing is the compliant outcome.',
      };
    }
    return { verdict: 'ELIGIBLE', authority: 'prompt', promptCall: fam.promptCall };
  }
  return {
    verdict: 'NO AUTHORITY',
    authority: 'none',
    reason: 'No prompt exists for this subject in prompts/family-plates-batch-01.md, and the concept art is not readable by this process.',
    law: 'Rank 1 is absent and rank 2 is unreadable. Under NO GUESSING, no render of this subject can be presented as canon.',
  };
}

/* ------------------------------------------------- the named cast problem
   Recorded here because it is the single largest consequence of the law.

   The forty-two named characters have NO prompt in batch 01 — that file
   covers bestiary families only. Eighteen of them have concept art in Drive.
   But the art is served cross-origin from Google's CDN, which taints a
   canvas and blocks the capture path, so this process cannot read a single
   pixel of it and cannot verify a render against it.

   Under the law that means: rank 1 absent, rank 2 present but unreadable BY
   ME. The renders in the sprite hall were therefore authored from prose —
   rank 3 — which the law forbids from contradicting art it cannot see.
   They are consequently UNVERIFIED against authority, and must be labelled
   as such rather than presented as conforming.

   Two things clear it, both of which need a human:
     A. Write character prompts into prompts/ the way batch 01 was written.
        That restores rank 1 and is fully readable by this process.
     B. Vendor the eighteen plates into assets/characters/ as project files.
        Same-origin files are readable, which restores rank 2 verification
        and also fixes the offline-fragility already flagged in
        kit/hm-concept-art.js. */
export const NAMED_CAST_STATUS = {
  promptsExist: false,
  promptsPath: 'prompts/ (batch 01 covers bestiary families only)',
  artExists: 18,
  artTotal: 42,
  artReadableByProcess: false,
  artBlocker: 'Cross-origin CDN: canvas taint on read, and the capture path cannot embed the image either.',
  renderStatus: 'UNVERIFIED — authored from prose (rank 3) with no readable authority to check against.',
  clears: [
    'Write character prompts into prompts/, matching batch 01 in form. Restores rank 1.',
    'Vendor the 18 plates into assets/characters/. Restores rank 2 verification and removes the Drive dependency.',
  ],
};

export const LAW_SOURCE = {
  file: 'prompts/family-plates-batch-01.md',
  title: 'Family Plates Batch 01 — Exact Image Prompts',
  driveId: '1xCRXop9F0ZeR120x42x179e_2UTv1_xi',
  readOn: '2026-08-26',
  families: Object.keys(FAMILY_LAW).length,
  recovery: { file: 'family-plates-batch-01-recovery.md', driveId: '12ZDiXdCl2rKd73Sdl60btNAauQ6TMbXy', read: false },
};

export function familyList() {
  return Object.entries(FAMILY_LAW).map(([id, f]) => ({ id, ...f, conformance: conformance(id) }));
}
