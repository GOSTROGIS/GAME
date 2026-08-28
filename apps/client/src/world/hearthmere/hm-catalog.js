/* Hearthmere Hold environment kit — catalogue.
 *
 * Order and metadata are transcribed from packages/content/manifests/
 * hearthmere.assets.json in Ostrowidzki1989/sable-reach@main. `declared` is
 * that file's own row; nothing in it is estimated here. Rows with
 * manifest:false are proposals and say so everywhere they appear.
 */
import {
  blackpineSapling, blackpineMature, steamMoss, ridgeHeather,
  coldReedClump, wallLichenGray,
} from './hm-flora.js';
import {
  emberLedgerDesk, clayNameRack, bankedBrazier, ropeBellSmall, rainBarrelIron,
  marketAwningPatch, travelerBench, herbDryingFrame, guardWeaponRest, springCupStone,
} from './hm-props.js';
import { clayNameTablet, bellClapperMace } from './hm-artifacts.js';
import {
  holdHouseSmall, holdHouseCorner, bellTowerTimber, palisadeRepaired,
  springChannelArch, vigilShrineOld, gatehousePatchwork,
} from './hm-structures.js';
import { SURFACES, DECALS, surfaceTexture, decalTexture } from './hm-textures.js';
import { THREE, part, seat, thin, jitter, rnd } from './hm-core.js';

/* Surfaces and decals are materials, not meshes — lodTriangles [0,0,0]. They
   are shown on a display slab so the generator output can actually be judged. */
function surfaceSlab(row) {
  const rand = rnd(row.id.length * 31);
  const g = new THREE.Group();
  g.name = row.id.split('.').pop();
  const maps = surfaceTexture(row);
  const m = new THREE.MeshStandardMaterial({
    map: maps.map, roughnessMap: maps.roughnessMap, roughness: 1, metalness: 0.02,
  });
  m.name = row.id.split('.').pop();
  g.add(part(jitter(new THREE.BoxGeometry(2, 0.14, 2, 6, 1, 6), 0.012, rand), m, 'surface-slab', { pos: [0, 0.07, 0] }));
  return seat(g);
}

function decalSlab(row) {
  const rand = rnd(row.id.length * 17);
  const g = new THREE.Group();
  g.name = row.id.split('.').pop();
  const base = surfaceTexture(SURFACES[0]);
  const stone = new THREE.MeshStandardMaterial({ map: base.map, roughnessMap: base.roughnessMap, roughness: 1, metalness: 0.02 });
  stone.name = 'slate-cobbles-wet';
  g.add(part(jitter(new THREE.BoxGeometry(2, 0.14, 2, 6, 1, 6), 0.012, rand), stone, 'host-surface', { pos: [0, 0.07, 0] }));
  const dm = new THREE.MeshStandardMaterial({
    map: decalTexture(row), transparent: true, opacity: row.opacity,
    roughness: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
  });
  dm.name = row.id.split('.').pop();
  g.add(thin(part(new THREE.PlaneGeometry(1.9, 1.9), dm, 'projected-decal', { pos: [0, 0.142, 0], rot: [-Math.PI / 2, 0, 0] })));
  return g;
}

export const GROUPS = [
  { key: 'foliage', label: 'Trees and foliage', note: 'Instanced. One material slot each, so a foliage asset never ships its own rock.' },
  { key: 'prop', label: 'Props', note: 'Ten manifest rows, built to their declared footprint and LOD0 ceiling.' },
  { key: 'structure', label: 'Structures', note: 'Whole buildings, budgeted against WORLD_ASSET_BUDGETS — hero 48k, standard 12k.' },
  { key: 'surface', label: 'Surfaces and decals', note: 'Materials, not meshes. Shown on a display slab so the generator can be judged.' },
  { key: 'artifact', label: 'Artifacts', note: 'Proposed. Inspect-scale objects the authored fiction already requires.' },
];

export const CATALOG = [
  /* ------------------------------------------------------------- foliage */
  {
    id: 'hm.foliage.blackpine-sapling', slug: 'blackpine-sapling', name: 'Blackpine sapling',
    group: 'foliage', budgetClass: 'minor', generator: 'foliage.instanced', manifest: true,
    declared: { lod: [2100, 840, 280], slots: 2, size: null, params: 'form conifer · heightRange 2.4–4.8 · wind 0.25' },
    fiction: 'Black pine sheds its lower limbs early. The naked bottom third is the species, and it reads across a whole valley.',
    spec: 'Built at 4.2 m, mid-range. Canopy is three gapped tiers of squashed low-poly clumps; the leader is snapped, as every pine in the Reach is.',
    build: blackpineSapling,
  },
  {
    id: 'gm.foliage.blackpine-mature', slug: 'blackpine-mature', name: 'Blackpine, mature',
    group: 'foliage', budgetClass: 'hero', generator: 'foliage.instanced', manifest: false,
    declared: null,
    proposed: { lod: [7000, 2600, 900], slots: 2, size: null, params: 'form conifer · heightRange 8.0–11.0 · wind 0.3' },
    why: 'In the graven_march kit as foliage "blackpine_mature", and GATHER_NODES declares node_blackpine_01 "Harvestable Black Pine" at woodcutting 3 — with no asset row in any manifest.',
    fiction: 'Black pines creak over cairns whose stones are warm to the touch.',
    spec: 'Carries the woodcutting face as geometry, in cut heartwood, so a gatherable tree is legible before the prompt appears. 9.4 m, six buttress roots, dead spire.',
    build: blackpineMature,
  },
  {
    id: 'hm.foliage.steam-moss', slug: 'steam-moss', name: 'Steam moss',
    group: 'foliage', budgetClass: 'minor', generator: 'foliage.instanced', manifest: true,
    declared: { lod: [640, 260, 90], slots: 1, size: null, params: 'form ground-clump · heightRange 0.08–0.22 · wind 0.05' },
    fiction: 'It only grows where the spring runs under the slate, which is how you know where the warm ground is.',
    spec: 'Thirteen cushions, no substrate. One slot means the asset is moss and nothing else — it instances onto spring limestone.',
    build: steamMoss,
  },
  {
    id: 'hm.foliage.ridge-heather', slug: 'ridge-heather', name: 'Ridge heather',
    group: 'foliage', budgetClass: 'minor', generator: 'foliage.instanced', manifest: true,
    declared: { lod: [980, 380, 120], slots: 1, size: null, params: 'form bush · heightRange 0.3–0.7 · wind 0.4' },
    fiction: 'Heather keeps its dead wood. A stand of it on the ridge is mostly the years it has already survived.',
    spec: 'Eleven woody stems leaning downwind at the declared 0.4, two bloom clusters per stem, eight dead spurs at the base.',
    build: ridgeHeather,
  },
  {
    id: 'hm.foliage.cold-reed-clump', slug: 'cold-reed-clump', name: 'Cold reed clump',
    group: 'foliage', budgetClass: 'minor', generator: 'foliage.instanced', manifest: true,
    declared: { lod: [760, 300, 100], slots: 1, size: null, params: 'form reed · heightRange 0.8–1.8 · wind 0.6' },
    fiction: 'Reeds at the channel mouth, where the warm water meets the cold and neither wins.',
    spec: 'Seventeen blades as tapered bowed boxes rather than crossed planes — a box catches the key light on one face, which is what sells a reed bed.',
    build: coldReedClump,
  },
  {
    id: 'hm.foliage.wall-lichen-gray', slug: 'wall-lichen-gray', name: 'Gray wall lichen',
    group: 'foliage', budgetClass: 'minor', generator: 'foliage.instanced', manifest: true,
    declared: { lod: [420, 160, 60], slots: 1, size: null, params: 'form wall-patch · heightRange 0.1–0.4 · wind 0' },
    fiction: 'Lichen takes the north face first. Hearthmere has no north face that is not lichen.',
    spec: 'Twenty domed plates on the XY plane for projection onto masonry. The declared 0.1–0.4 is patch spread, not thickness — relief is 8 mm.',
    build: wallLichenGray,
  },

  /* --------------------------------------------------------------- props */
  {
    id: 'hm.prop.ember-ledger-desk', slug: 'ember-ledger-desk', name: 'Ember Ledger desk',
    group: 'prop', budgetClass: 'hero', generator: 'prop.graybox', manifest: true,
    declared: { lod: [6200, 2300, 840], slots: 3, size: [2.2, 1.4, 1.1], params: 'shape slanted-desk' },
    fiction: 'Maela Voss keeps the Ember Ledger here, chained to the desk, because the names are the only thing the ash cannot take back.',
    spec: 'Clerk height — worked standing. Turned lathe legs carry the silhouette; the chained ledger, the branding iron and six stacked name tablets carry the story. Slots: dark oak, pitted iron, fired clay.',
    build: emberLedgerDesk,
  },
  {
    id: 'hm.prop.clay-name-rack', slug: 'clay-name-rack', name: 'Clay name rack',
    group: 'prop', budgetClass: 'standard', generator: 'prop.graybox', manifest: true,
    declared: { lod: [4800, 1900, 700], slots: 2, size: [2.8, 2.2, 0.7], params: 'shape tablet-rack' },
    fiction: 'Its people burn names into clay tablets so the dead cannot be forgotten by the ash.',
    spec: 'Around thirty tablets on four shelves, leaning at real angles, with gaps where names have been taken down and two on the floor. Two slots forces timber joinery — pegs, not straps.',
    build: clayNameRack,
  },
  {
    id: 'hm.prop.banked-brazier', slug: 'banked-brazier', name: 'Banked brazier',
    group: 'prop', budgetClass: 'standard', generator: 'prop.graybox', manifest: true,
    declared: { lod: [3200, 1300, 480], slots: 2, size: [1.3, 1.1, 1.3], params: 'shape iron-bowl' },
    amendment: 'Slots 2 → 3. The region kit names banked_braziers as its practical light source. Without an emissive slot the declared practical cannot emit, and the brazier is a cold bowl.',
    fiction: 'Coals raked over and covered at dusk so there is still fire at dawn.',
    spec: 'Lathed riveted bowl, splayed tripod with a tie ring, grate bars, banked ash, six live coals and the poker left standing in them.',
    build: bankedBrazier,
  },
  {
    id: 'hm.prop.rope-bell-small', slug: 'rope-bell-small', name: 'Small rope bell',
    group: 'prop', budgetClass: 'standard', generator: 'prop.graybox', manifest: true,
    declared: { lod: [5400, 2200, 760], slots: 3, size: [1.4, 3.2, 1.4], params: 'shape bell-and-frame' },
    fiction: 'Banked braziers, wet slate, and a bell that never rings twice alike.',
    spec: 'The whole settlement ritual hangs off this prop, so the bell gets the segment budget: a real profile — mouth, waist, shoulder, crown — at twenty segments, with the clapper hung off-centre. The second rope is the one that broke.',
    build: ropeBellSmall,
  },
  {
    id: 'hm.prop.rain-barrel-iron', slug: 'rain-barrel-iron', name: 'Iron-bound rain barrel',
    group: 'prop', budgetClass: 'minor', generator: 'prop.graybox', manifest: true,
    declared: { lod: [1800, 760, 280], slots: 2, size: [1.1, 1.5, 1.1], params: 'shape barrel' },
    amendment: 'Slots 2 → 3. The third is standing rainwater. An iron-bound rain barrel with a dry interior is a butt, and in a region held at wetness 0.82 it reads as a mistake.',
    fiction: 'Rain is the one thing the Reach is not short of.',
    spec: 'Fourteen separate bowed staves rather than a cylinder — the stave gaps are the entire reason a barrel looks like a barrel. Middle hoop has slipped; lid pushed aside.',
    build: rainBarrelIron,
  },
  {
    id: 'hm.prop.market-awning-patch', slug: 'market-awning-patch', name: 'Patched market awning',
    group: 'prop', budgetClass: 'standard', generator: 'prop.graybox', manifest: true,
    declared: { lod: [4400, 1800, 650], slots: 3, size: [4.5, 3, 2.6], params: 'shape awning' },
    fiction: 'The market runs whatever the weather, under whatever cloth is still holding.',
    spec: 'The canvas sags between its ties — eighty triangles of catenary, and the single cheapest thing that makes cloth read as cloth. The asset is named for its patches, so the patches get the third slot in the mantle red.',
    build: marketAwningPatch,
  },
  {
    id: 'hm.prop.traveler-bench', slug: 'traveler-bench', name: 'Traveler bench',
    group: 'prop', budgetClass: 'minor', generator: 'prop.graybox', manifest: true,
    declared: { lod: [1200, 520, 190], slots: 1, size: [2.5, 1, 0.7], params: 'shape bench' },
    fiction: 'Where people wait for the bell before they walk out onto the March.',
    spec: 'One material slot, so the whole story is told in timber: a split log seat worn hollow, three legs where two match, and a driven wedge holding the odd one true. Pegs instead of nails, because there is no iron slot.',
    build: travelerBench,
  },
  {
    id: 'hm.prop.herb-drying-frame', slug: 'herb-drying-frame', name: 'Herb drying frame',
    group: 'prop', budgetClass: 'standard', generator: 'prop.graybox', manifest: true,
    declared: { lod: [3900, 1500, 560], slots: 2, size: [2.4, 2.2, 0.8], params: 'shape hanging-frame' },
    fiction: 'Ysra Pell hangs what the mire gives her, and takes down rather less.',
    spec: 'Fourteen bundles on three rods. Dried herb is straw-coloured, so the bundles live in the hemp slot and the asset holds at two. Two hooks left empty — the frame should not look full.',
    build: herbDryingFrame,
  },
  {
    id: 'hm.prop.guard-weapon-rest', slug: 'guard-weapon-rest', name: 'Guard weapon rest',
    group: 'prop', budgetClass: 'standard', generator: 'prop.graybox', manifest: true,
    declared: { lod: [4200, 1700, 600], slots: 2, size: [2.1, 1.8, 0.8], params: 'shape weapon-rack' },
    fiction: 'Torren Vale keeps the hold\u2019s arms here. Two spears, a billhook, and a shield that has been repainted once too often.',
    spec: 'Hand-cut notches at uneven depths. Polearms, not swords — Hearthmere arms its watch with what a farm already owns.',
    build: guardWeaponRest,
  },
  {
    id: 'hm.prop.spring-cup-stone', slug: 'spring-cup-stone', name: 'Stone spring cup',
    group: 'prop', budgetClass: 'minor', generator: 'prop.graybox', manifest: true,
    declared: { lod: [2200, 800, 300], slots: 2, size: [0.5, 0.6, 0.5], params: 'shape cup-on-chain' },
    fiction: 'A refuge built around the final warm spring in the Reach. The cup is chained because it has been taken before.',
    spec: 'Lathed limestone, thick-walled and chipped at the rim, on six iron links. Mineral crust at the base is why the spring is called warm.',
    build: springCupStone,
  },

  /* ---------------------------------------------------------- structures */
  {
    id: 'hm.structure.hold-house-small', slug: 'hold-house-small', name: 'Small hold house',
    group: 'structure', budgetClass: 'standard', generator: 'structure.graybox', manifest: true,
    declared: { lod: [12000, 4400, 1500], slots: 5, size: [9, 7.5, 7], params: 'footprint [9,7] · height 7.5 · roof steep-slate · door-south, window-east' },
    amendment: 'LOD0 budgeted from WORLD_ASSET_BUDGETS.propTriangles.standard (12,000) rather than the row’s own lodTriangles, which were sized for a graybox.',
    fiction: 'Stone to the first floor, timber above it, and a slate roof steep enough that the rain never sits.',
    spec: 'Coursed rubble ground floor with the two declared openings cut through the courses, timber frame and daub infill above, and a roof of individually laid slates. Rain chain instead of a downpipe — cheaper than lead, and it is raining.',
    build: holdHouseSmall,
  },
  {
    id: 'hm.structure.hold-house-corner', slug: 'hold-house-corner', name: 'Corner hold house',
    group: 'structure', budgetClass: 'standard', generator: 'structure.graybox', manifest: true,
    declared: { lod: [12000, 4400, 1500], slots: 5, size: [11, 8, 8], params: 'footprint [11,8] · height 8 · roof broken-hip · door-west, arcade-south' },
    amendment: 'LOD0 budgeted from WORLD_ASSET_BUDGETS.propTriangles.standard (12,000).',
    fiction: 'The corner house lost half its roof in the ninth year of the Dimming. Nobody has been up to fix it.',
    spec: 'Three arcade arches on the south face, each a real voussoir ring. The broken-hip roof survives over the east half only — the west is open rafters with its slates on the floor below, which is what makes “broken” legible rather than merely stated.',
    build: holdHouseCorner,
  },
  {
    id: 'hm.structure.bell-tower-timber', slug: 'bell-tower-timber', name: 'Timber bell tower',
    group: 'structure', budgetClass: 'hero', generator: 'structure.graybox', manifest: true,
    declared: { lod: [48000, 17000, 5800], slots: 6, size: [8, 19, 8], params: 'footprint [8,8] · height 19 · roof needle · arch-four-sides' },
    amendment: 'LOD0 budgeted from WORLD_ASSET_BUDGETS.propTriangles.hero (48,000).',
    fiction: 'Each settlement survives by ringing a consecrated bell at dusk. This is Hearthmere’s.',
    spec: 'The tallest thing in the region, so the lattice gets the budget: four battered corner posts, six girt levels, cross-braces on every face at every level. Arched on all four sides as declared, louvred at the bell chamber, shingled needle spire. The great bell hangs on its headstock with the rope running down to the ringing floor.',
    build: bellTowerTimber,
  },
  {
    id: 'hm.structure.palisade-repaired', slug: 'palisade-repaired', name: 'Repaired palisade',
    group: 'structure', budgetClass: 'standard', generator: 'structure.graybox', manifest: true,
    declared: { lod: [12000, 4400, 1500], slots: 4, size: [16, 5.5, 1.2], params: 'footprint [16,1.2] · height 5.5 · roof none' },
    amendment: 'LOD0 budgeted from WORLD_ASSET_BUDGETS.propTriangles.standard (12,000).',
    fiction: 'The palisade held. Six stakes of it did not, and what went back is thinner than what came out.',
    spec: 'The asset is named for its repairs, so the repairs are the design: a run of six newer, thinner, lighter stakes in the middle, a lashed plank hurdle over the weak section, and two raking shores propping it from inside.',
    build: palisadeRepaired,
  },
  {
    id: 'hm.structure.spring-channel-arch', slug: 'spring-channel-arch', name: 'Spring channel arch',
    group: 'structure', budgetClass: 'hero', generator: 'structure.graybox', manifest: true,
    declared: { lod: [48000, 17000, 5800], slots: 6, size: [10, 6, 6], params: 'footprint [10,6] · height 6 · roof stone-vault · water-channel, walkway' },
    amendment: 'LOD0 budgeted from WORLD_ASSET_BUDGETS.propTriangles.hero (48,000).',
    fiction: 'A refuge built around the final warm spring in the Reach. This is what carries it under the road.',
    spec: 'Seven voussoir rings stepped through the depth so the arch reads as a tunnel, not a cutout, with a proud archivolt on each face. Cambered sett walkway above, cut stone trough below, mineral crust and steam moss only where the water actually runs.',
    build: springChannelArch,
  },
  {
    id: 'hm.structure.vigil-shrine-old', slug: 'vigil-shrine-old', name: 'Old Vigil Shrine',
    group: 'structure', budgetClass: 'hero', generator: 'structure.graybox', manifest: true,
    declared: { lod: [48000, 17000, 5800], slots: 6, size: [7, 8, 7], params: 'footprint [7,7] · height 8 · roof ruined-canopy · altar-east' },
    amendment: 'LOD0 budgeted from WORLD_ASSET_BUDGETS.propTriangles.hero (48,000).',
    fiction: 'A named landmark: world.js places old_vigil_shrine at (4, 7). People still leave tablets on it.',
    spec: 'Eight columns with entasis, three broken to stumps with sheared faces. The canopy survives over two thirds of the circle; the missing third is on the floor as rubble and one whole column drum that rolled. Altar east as declared, with vigil tablets and a coal bowl.',
    build: vigilShrineOld,
  },
  {
    id: 'hm.structure.gatehouse-patchwork', slug: 'gatehouse-patchwork', name: 'Patchwork gatehouse',
    group: 'structure', budgetClass: 'hero', generator: 'structure.graybox', manifest: true,
    declared: { lod: [48000, 17000, 5800], slots: 6, size: [14, 10, 6], params: 'footprint [14,6] · height 10 · roof asymmetric-slate · gate-center, guard-door' },
    amendment: 'LOD0 budgeted from WORLD_ASSET_BUDGETS.propTriangles.hero (48,000).',
    fiction: 'The west tower is older and taller. The east one is a rebuild, and the stone ran out halfway up.',
    spec: '“Patchwork” and “asymmetric” are the brief, so the towers are deliberately unequal: different widths, heights and roof pitches, with the east tower finished in timber and daub because the stone ran out. Crenellated parapet on the old tower, two merlons missing. Two-leaf studded gate, one leaf hanging open.',
    build: gatehousePatchwork,
  },

  /* -------------------------------------------------- surfaces and decals */
  ...SURFACES.map((row) => ({
    id: row.id, slug: row.id.split('.').pop(), name: row.name,
    group: 'surface', budgetClass: 'material', generator: 'surface.pbr-prototype', manifest: true,
    declared: { lod: [0, 0, 0], slots: 1, size: null, params: 'baseColor ' + row.base + ' · roughness ' + row.roughness + ' · wetness ' + row.wetness },
    fiction: 'Wet slate underfoot, everywhere, all the time.',
    spec: 'Procedural at ' + row.dim + '×' + row.dim + '. Colour and roughness are the manifest’s own values; the declared wetness has no PBR channel, so it is folded into a derived roughness map — which is why the surface reads wetter in its hollows than on its high points.',
    build: () => surfaceSlab(row),
  })),
  ...DECALS.map((row) => ({
    id: row.id, slug: row.id.split('.').pop(), name: row.name,
    group: 'surface', budgetClass: 'material', generator: 'decal.projected', manifest: true,
    declared: { lod: [0, 0, 0], slots: 1, size: null, params: 'mask ' + row.mask + ' · opacity ' + row.opacity },
    fiction: 'The hold keeps its marks. Nobody scrubs anything here.',
    spec: 'Projected decal at the manifest’s declared opacity of ' + row.opacity + ', shown over wet slate cobbles so the blend can be judged against a real host surface rather than against grey.',
    build: () => decalSlab(row),
  })),

  /* ----------------------------------------------------------- artifacts */
  {
    id: 'hm.artifact.clay-name-tablet', slug: 'clay-name-tablet', name: 'Clay name tablet',
    group: 'artifact', budgetClass: 'hero', generator: 'prop.inspect', manifest: false,
    declared: null,
    proposed: { lod: [2800, 1100, 380], slots: 3, size: [0.16, 0.24, 0.03], params: 'shape inspect-slab' },
    why: 'The manifest carries hm.surface.clay-tablets as a SURFACE. But the tablet is the region\u2019s central object, and quest and codex surfaces need one that can be picked up. A surface cannot be held.',
    fiction: 'Six names, and a family mark under five of them. The seventh line was started and not finished.',
    spec: 'Names are incised geometry in exposed pale clay, legible at inspect scale with no texture. Edge tally is one notch per bell rung. Kiln scorch and a broken corner, both asymmetric.',
    build: clayNameTablet,
  },
  {
    id: 'hm.artifact.bell-clapper-mace', slug: 'bell-clapper-mace', name: 'Bell-clapper mace',
    group: 'artifact', budgetClass: 'hero', generator: 'weapon.inspect', manifest: false,
    declared: null,
    proposed: { lod: [4200, 1600, 560], slots: 4, size: [0.17, 1.02, 0.17], params: 'shape hafted-mace' },
    why: 'world.js describes Torren Vale, Bell-Warden and Hearthmere\u2019s combat trainer, as "a broad veteran who carries the clapper of a ruined bell as a mace." He is a placed NPC with a named weapon and no weapon asset in any manifest.',
    fiction: 'A broad veteran who carries the clapper of a ruined bell as a mace.',
    spec: 'A genuine clapper — ball, shank and flight — collared onto an ash haft with iron langets. The strike face is worn flat, because a clapper wears where it hits the bell.',
    build: bellClapperMace,
  },
];
