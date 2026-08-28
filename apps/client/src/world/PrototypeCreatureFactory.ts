import * as THREE from "three";

export const CREATURE_FAMILY_IDS = [
  "ashbound",
  "cairn_beasts",
  "march_deserters",
  "drowned_parish",
  "reed_coven",
  "kilnforged",
  "glasswood",
  "hush_order",
  "echo_choir",
  "ossuary_vermin",
  "bell_revenants",
  "salt_waste",
  "veil_coast",
  "shuttered_ward",
  "charnel_measures",
  "black_sluice",
  "last_pest_cart",
  "breath_tithe",
  "white_ague",
  "pallid_root_communion",
  "anchored_quarantine",
] as const;

export type CreatureFamilyId = (typeof CREATURE_FAMILY_IDS)[number];
export type PrototypeCoreShape = "humanoid" | "quadruped" | "armored" | "robed" | "spectral" | "composite" | "amphibious" | "carriage" | "rooted" | "empty_cloth";
export type PrototypeLocomotion = "lurch" | "bound" | "march" | "wade" | "sway" | "weighted" | "angular" | "cadence" | "float" | "scuttle" | "pendulum" | "wind_bent" | "undertow" | "care_round" | "measure" | "reflection" | "roll" | "billow" | "horizon" | "root_pulse" | "anchor_drag";

export interface PrototypeCreatureRecipe {
  familyId: CreatureFamilyId;
  label: string;
  coreShape: PrototypeCoreShape;
  locomotion: PrototypeLocomotion;
  bodyScale: readonly [number, number, number];
  postureRadians: number;
  anatomicalViolation: string;
  locomotionRule: string;
  soundGrammar: string;
  attachment: string;
  palette: Readonly<{ body: string; shadow: string; accent: string }>;
}

const recipe = (
  familyId: CreatureFamilyId,
  label: string,
  coreShape: PrototypeCoreShape,
  locomotion: PrototypeLocomotion,
  bodyScale: readonly [number, number, number],
  postureRadians: number,
  anatomicalViolation: string,
  locomotionRule: string,
  soundGrammar: string,
  attachment: string,
  palette: PrototypeCreatureRecipe["palette"],
): PrototypeCreatureRecipe => Object.freeze({ familyId, label, coreShape, locomotion, bodyScale, postureRadians, anatomicalViolation, locomotionRule, soundGrammar, attachment, palette });

export const PROTOTYPE_CREATURE_RECIPES: Readonly<Record<CreatureFamilyId, PrototypeCreatureRecipe>> = Object.freeze({
  ashbound: recipe("ashbound", "Ashbound", "humanoid", "lurch", [0.78, 1.18, 0.66], -0.2, "A fired-clay name tag occupies the throat while smoke exits through the joints.", "Advances only while its clay tag faces its target.", "Dry tag chatter followed by one reversed exhale.", "clay_tags", { body: "#5c5951", shadow: "#202326", accent: "#b56543" }),
  cairn_beasts: recipe("cairn_beasts", "Cairn Beasts", "quadruped", "bound", [1.34, 0.76, 0.7], 0.08, "Warm grave stones replace the shoulder girdle and grow a second antler line.", "Bounds between cold patches, pausing on warm stone to vent.", "Stone clicks accelerate into a canine breath.", "stone_antlers", { body: "#343b38", shadow: "#171b1b", accent: "#957856" }),
  march_deserters: recipe("march_deserters", "March Deserters", "armored", "march", [0.9, 1.13, 0.72], 0, "A sealed order passes through the helm and continues as a rigid spinal banner.", "Moves in four exact road bearings and pivots only at a halt.", "Wax cracks, then bootfalls answer in fours.", "blank_banner", { body: "#4b4944", shadow: "#1e2021", accent: "#8a4237" }),
  drowned_parish: recipe("drowned_parish", "Drowned Parish", "robed", "wade", [0.83, 1.24, 0.78], -0.12, "A reed halo grows through the jaw and keeps the flooded skull upright.", "Wades at one depth even when no water is present.", "A distant vesper heard beneath close dripping.", "reed_halo", { body: "#4d5a50", shadow: "#172323", accent: "#a6afa0" }),
  reed_coven: recipe("reed_coven", "Reed Coven", "robed", "sway", [0.74, 1.35, 0.68], 0.16, "The face has flattened into a woven mask whose reeds continue down the ribs.", "Feet remain planted while the torso changes reach with the wind.", "Single reed whispers alternate between left and right.", "reed_mask", { body: "#696952", shadow: "#242722", accent: "#b4b886" }),
  kilnforged: recipe("kilnforged", "Kilnforged", "armored", "weighted", [1.16, 1.12, 0.92], -0.04, "The furnace grille is a mouth and chain tendons leave the elbows open.", "Cannot turn during a vented charge and sinks after every third step.", "Iron load, chain recoil, furnace draw.", "vent_stack", { body: "#504942", shadow: "#1e1b1a", accent: "#dd7144" }),
  glasswood: recipe("glasswood", "Glasswood Brood", "quadruped", "angular", [1.12, 1.02, 0.54], 0.23, "Transparent organs hang between branching glass limbs without a torso.", "Every stride ends at a sharp angle before the next limb commits.", "A rising glass whine ends in one sap-heavy knock.", "glass_branches", { body: "#252b2a", shadow: "#0d1112", accent: "#bd9b56" }),
  hush_order: recipe("hush_order", "Hush Order", "humanoid", "cadence", [0.72, 1.26, 0.62], 0, "The stitched veil enters the mouth and emerges as prayer knots at each wrist.", "Repeats the player's last movement cadence one beat later.", "No voice; cloth tension and heel placement carry every cue.", "stitched_veil", { body: "#77756c", shadow: "#242727", accent: "#56736b" }),
  echo_choir: recipe("echo_choir", "Echo Choir", "spectral", "float", [0.96, 1.3, 0.48], 0, "Concentric mouths orbit an urn-sized absence where the chest should be.", "Drifts along the last sound's direction, never its source.", "Three inhalations occupy different distances at once.", "mouth_rings", { body: "#4f465a", shadow: "#18151d", accent: "#9f87bc" }),
  ossuary_vermin: recipe("ossuary_vermin", "Ossuary Vermin", "composite", "scuttle", [1.28, 0.64, 0.86], 0, "Borrowed skulls form load-bearing joints around a communal rib cage.", "Scuttles on whichever three limbs currently touch stable ground.", "Teeth count impacts while loose joints ratchet.", "bone_cluster", { body: "#858071", shadow: "#282820", accent: "#c9c2aa" }),
  bell_revenants: recipe("bell_revenants", "Bell Revenants", "armored", "pendulum", [1.02, 1.31, 0.92], -0.02, "The torso is a bell cavity and braided ropes replace both arms.", "Body motion follows a pendulum that attacks before its sound arrives.", "Rope strain precedes a delayed, directionless toll.", "bell_cavity", { body: "#625f50", shadow: "#242522", accent: "#9b8355" }),
  salt_waste: recipe("salt_waste", "Salt-Waste Pilgrims", "robed", "wind_bent", [0.68, 1.48, 0.5], 0.31, "A sealed mirror substitutes for the face and reflects an absent sun.", "Leans against a wind whose bearing never changes with the weather.", "Salt sheets shear after a cloth note too low to be wind.", "mirror_face", { body: "#b2ae9f", shadow: "#393a38", accent: "#879da2" }),
  veil_coast: recipe("veil_coast", "Veil-Coast Kin", "amphibious", "undertow", [1.04, 1.08, 0.8], -0.09, "A coral rib cage opens outward around one cold lantern organ.", "Sways inland while its feet trace retreating tide arcs.", "Wet coral ticks around one slowly dimming pulse.", "coral_cage", { body: "#354a50", shadow: "#121d20", accent: "#a45d53" }),
  shuttered_ward: recipe("shuttered_ward", "Shuttered Ward", "humanoid", "care_round", [0.76, 1.36, 0.59], -0.17, "An empty bed frame passes through the shoulders and holds absent patients upright.", "Completes a bedside circuit before recognizing any living target.", "Soft casters, folded linen, then a copied bedside instruction.", "empty_bedframe", { body: "#77736b", shadow: "#252827", accent: "#9d8c72" }),
  charnel_measures: recipe("charnel_measures", "Charnel Measures", "composite", "measure", [0.82, 1.58, 0.72], 0.04, "Nested measuring racks fold the corpse into several mutually impossible heights.", "Extends to match nearby architecture, then collapses through its own frame.", "Wooden rules tap dimensions that do not fit the room.", "measure_racks", { body: "#5c554a", shadow: "#201e1b", accent: "#a59778" }),
  black_sluice: recipe("black_sluice", "Black Sluice", "spectral", "reflection", [1.18, 1.04, 0.32], 0, "A vertical sheet of drainage water carries a body seen only as a reflection.", "Appears in the next wet surface rather than crossing dry ground.", "Drain resonance arrives before the reflected feet move.", "reflection_sheet", { body: "#273c40", shadow: "#071113", accent: "#6c9094" }),
  last_pest_cart: recipe("last_pest_cart", "Last Pest Cart", "carriage", "roll", [1.55, 0.95, 1.1], -0.03, "The convoy's bearers share one axle through all four pelvises.", "Follows quarantined roads and cannot leave a wheel rut except at a bell post.", "One loose wheel answers four synchronized coughs.", "cart_wheels", { body: "#514941", shadow: "#1d1a18", accent: "#846b4e" }),
  breath_tithe: recipe("breath_tithe", "Breath Tithe", "empty_cloth", "billow", [0.92, 1.42, 0.43], 0.08, "Soot-filled garments breathe without bodies through sail-like lungs.", "Inflates toward spoken sound and folds flat when silence is held.", "Stolen syllables leak between two long bellows breaths.", "lung_sails", { body: "#343333", shadow: "#111112", accent: "#8f6955" }),
  white_ague: recipe("white_ague", "White Ague", "robed", "horizon", [0.64, 1.52, 0.46], 0.28, "Salt spines align the skull toward a horizon that is never geographically present.", "Walks one impossible bearing until water breaks the line.", "Windless grains count down from seven behind the listener.", "horizon_spines", { body: "#c2bfae", shadow: "#454540", accent: "#809296" }),
  pallid_root_communion: recipe("pallid_root_communion", "Pallid Root Communion", "rooted", "root_pulse", [1.25, 1.2, 0.9], -0.06, "Pale roots replace every nerve and join separate bodies below the soil.", "One body advances only while another remains rooted and listening.", "Root knocks pass underground before several mouths answer together.", "root_crown", { body: "#8a816c", shadow: "#2a2b22", accent: "#b5ad83" }),
  anchored_quarantine: recipe("anchored_quarantine", "Anchored Quarantine", "amphibious", "anchor_drag", [1.09, 1.34, 0.88], -0.22, "An anchor-shaped shadow pierces the back without any corresponding iron.", "Advances inland only as far as its shadow can drag across connected moisture.", "Chain drag without metal, followed by a hull-deep groan.", "anchor_shadow", { body: "#34464a", shadow: "#0d1618", accent: "#677f78" }),
});

export interface PrototypeCreatureOptions {
  scale?: number;
  seed?: number;
  telegraphColor?: THREE.ColorRepresentation;
}

type RigMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;

function material(color: THREE.ColorRepresentation, roughness = 0.92, metalness = 0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

export function prototypeSilhouetteSignature(recipe: PrototypeCreatureRecipe): string {
  return [recipe.coreShape, recipe.bodyScale.join("/"), recipe.postureRadians.toFixed(3), recipe.attachment, recipe.locomotion, recipe.anatomicalViolation].join("|");
}

export class PrototypeCreatureRig extends THREE.Group {
  readonly prototypeAsset = true;
  readonly recipe: PrototypeCreatureRecipe;
  private readonly surfaces: THREE.MeshStandardMaterial[] = [];
  private readonly animatedParts: THREE.Object3D[] = [];
  private elapsed = 0;
  private telegraph = 0;

  constructor(recipeDefinition: PrototypeCreatureRecipe, options: PrototypeCreatureOptions = {}) {
    super();
    this.recipe = recipeDefinition;
    this.name = `prototype-creature:${recipeDefinition.familyId}`;
    this.userData = {
      contentStatus: "prototype_asset",
      familyId: recipeDefinition.familyId,
      anatomicalViolation: recipeDefinition.anatomicalViolation,
      locomotionRule: recipeDefinition.locomotionRule,
      soundGrammar: recipeDefinition.soundGrammar,
      silhouetteSignature: prototypeSilhouetteSignature(recipeDefinition),
    };
    this.build(options.seed ?? 0);
    this.scale.setScalar(Math.max(0.2, Math.min(4, options.scale ?? 1)));
    if (options.telegraphColor) this.userData.telegraphColor = new THREE.Color(options.telegraphColor).getHexString();
  }

  private surface(color: string, metalness = 0): THREE.MeshStandardMaterial {
    const result = material(color, metalness ? 0.58 : 0.94, metalness);
    this.surfaces.push(result);
    return result;
  }

  private mesh(name: string, geometry: THREE.BufferGeometry, surface: THREE.MeshStandardMaterial, parent: THREE.Object3D = this): RigMesh {
    const result = new THREE.Mesh(geometry, surface);
    result.name = name;
    result.castShadow = true;
    result.receiveShadow = true;
    parent.add(result);
    return result;
  }

  private build(seed: number): void {
    const { coreShape, bodyScale, postureRadians, palette } = this.recipe;
    const bodySurface = this.surface(palette.body);
    const shadowSurface = this.surface(palette.shadow);
    const accentSurface = this.surface(palette.accent, ["armored", "bell_revenants", "kilnforged"].some((value) => value === coreShape || value === this.recipe.familyId) ? 0.35 : 0);
    const core = new THREE.Group(); core.name = "core"; core.rotation.x = postureRadians; core.scale.set(...bodyScale); this.add(core); this.animatedParts.push(core);

    if (coreShape === "quadruped") this.buildQuadruped(core, bodySurface, shadowSurface);
    else if (coreShape === "spectral") this.buildSpectral(core, bodySurface, accentSurface);
    else if (coreShape === "composite") this.buildComposite(core, bodySurface, shadowSurface);
    else if (coreShape === "carriage") this.buildCarriage(core, bodySurface, shadowSurface);
    else if (coreShape === "rooted") this.buildRooted(core, bodySurface, accentSurface);
    else if (coreShape === "empty_cloth") this.buildEmptyCloth(core, bodySurface, shadowSurface);
    else this.buildHumanoid(core, bodySurface, shadowSurface, coreShape);
    this.buildAttachment(this.recipe.attachment, core, accentSurface, shadowSurface, seed);
  }

  private buildHumanoid(parent: THREE.Group, body: THREE.MeshStandardMaterial, shadow: THREE.MeshStandardMaterial, shape: PrototypeCoreShape): void {
    const torso = this.mesh("torso", shape === "robed" ? new THREE.ConeGeometry(0.29, 1.05, 8, 1, true) : new THREE.CapsuleGeometry(shape === "armored" ? 0.25 : 0.2, 0.58, 3, 8), body, parent); torso.position.y = 1.08;
    const head = this.mesh("head", new THREE.SphereGeometry(shape === "amphibious" ? 0.2 : 0.16, 10, 8), shadow, parent); head.position.y = 1.87; head.scale.set(shape === "amphibious" ? 1.3 : 0.8, 1.1, 0.78);
    for (const side of [-1, 1]) {
      const arm = this.mesh(`arm-${side}`, new THREE.CapsuleGeometry(0.055, shape === "amphibious" ? 0.72 : 0.54, 2, 6), body, parent); arm.position.set(side * 0.28, 1.04, 0); arm.rotation.z = side * (shape === "amphibious" ? 0.3 : 0.1); this.animatedParts.push(arm);
      const leg = this.mesh(`leg-${side}`, new THREE.CapsuleGeometry(0.07, 0.66, 2, 6), shadow, parent); leg.position.set(side * 0.12, 0.34, 0); this.animatedParts.push(leg);
    }
  }

  private buildQuadruped(parent: THREE.Group, body: THREE.MeshStandardMaterial, shadow: THREE.MeshStandardMaterial): void {
    const torso = this.mesh("torso", new THREE.CapsuleGeometry(0.25, 0.72, 3, 8), body, parent); torso.rotation.z = Math.PI / 2; torso.position.y = 0.76;
    const head = this.mesh("head", new THREE.ConeGeometry(0.18, 0.42, 7), shadow, parent); head.rotation.z = -Math.PI / 2; head.position.set(0.58, 0.82, 0);
    for (const x of [-0.38, 0.38]) for (const z of [-0.17, 0.17]) { const limb = this.mesh(`limb-${x}-${z}`, new THREE.CapsuleGeometry(0.045, 0.47, 2, 5), shadow, parent); limb.position.set(x, 0.34, z); this.animatedParts.push(limb); }
  }

  private buildSpectral(parent: THREE.Group, body: THREE.MeshStandardMaterial, accent: THREE.MeshStandardMaterial): void {
    const veil = this.mesh("spectral-veil", new THREE.ConeGeometry(0.42, 1.65, 10, 1, true), body, parent); veil.position.y = 0.93;
    const absence = this.mesh("chest-absence", new THREE.TorusGeometry(0.2, 0.045, 6, 18), accent, parent); absence.position.y = 1.25; absence.rotation.x = Math.PI / 2; this.animatedParts.push(absence);
  }

  private buildComposite(parent: THREE.Group, body: THREE.MeshStandardMaterial, shadow: THREE.MeshStandardMaterial): void {
    const core = this.mesh("communal-core", new THREE.DodecahedronGeometry(0.36, 0), body, parent); core.position.y = 0.85;
    for (let index = 0; index < 7; index += 1) { const limb = this.mesh(`borrowed-limb-${index}`, new THREE.CapsuleGeometry(0.04, 0.58 + index * 0.025, 2, 5), index % 2 ? body : shadow, parent); const angle = index / 7 * Math.PI * 2; limb.position.set(Math.cos(angle) * 0.3, 0.51, Math.sin(angle) * 0.3); limb.rotation.z = Math.cos(angle) * 0.65; limb.rotation.x = Math.sin(angle) * 0.65; this.animatedParts.push(limb); }
  }

  private buildCarriage(parent: THREE.Group, body: THREE.MeshStandardMaterial, shadow: THREE.MeshStandardMaterial): void {
    const bed = this.mesh("cart-bed", new THREE.BoxGeometry(1.25, 0.32, 0.72), body, parent); bed.position.y = 0.76;
    for (const x of [-0.46, 0.46]) for (const z of [-0.43, 0.43]) { const bearer = this.mesh(`bearer-${x}-${z}`, new THREE.CapsuleGeometry(0.09, 0.72, 2, 6), shadow, parent); bearer.position.set(x, 0.46, z); this.animatedParts.push(bearer); }
  }

  private buildRooted(parent: THREE.Group, body: THREE.MeshStandardMaterial, accent: THREE.MeshStandardMaterial): void {
    for (let index = 0; index < 3; index += 1) { const trunk = this.mesh(`communion-body-${index}`, new THREE.CapsuleGeometry(0.12, 0.85, 3, 7), body, parent); trunk.position.set((index - 1) * 0.34, 0.85 + Math.abs(index - 1) * 0.12, (index % 2) * 0.18); this.animatedParts.push(trunk); }
    const root = this.mesh("root-web", new THREE.TorusKnotGeometry(0.42, 0.035, 48, 5), accent, parent); root.scale.y = 0.18; root.position.y = 0.12;
  }

  private buildEmptyCloth(parent: THREE.Group, body: THREE.MeshStandardMaterial, shadow: THREE.MeshStandardMaterial): void {
    const outer = this.mesh("empty-garment", new THREE.ConeGeometry(0.42, 1.7, 10, 1, true), body, parent); outer.position.y = 0.93;
    const collar = this.mesh("empty-collar", new THREE.TorusGeometry(0.19, 0.035, 6, 14), shadow, parent); collar.position.y = 1.82; collar.rotation.x = Math.PI / 2; this.animatedParts.push(outer);
  }

  private buildAttachment(id: string, parent: THREE.Group, accent: THREE.MeshStandardMaterial, shadow: THREE.MeshStandardMaterial, seed: number): void {
    const jitter = ((Math.trunc(seed) >>> 0) % 17) / 200;
    const bar = (name: string, size: readonly [number, number, number], position: readonly [number, number, number], rotationZ = 0) => { const part = this.mesh(name, new THREE.BoxGeometry(...size), accent, parent); part.position.set(...position); part.rotation.z = rotationZ; return part; };
    const ring = (name: string, radius: number, position: readonly [number, number, number], axis: "x" | "y" = "x") => { const part = this.mesh(name, new THREE.TorusGeometry(radius, 0.035, 6, 18), accent, parent); part.position.set(...position); part.rotation[axis] = Math.PI / 2; return part; };
    if (id === "clay_tags") for (let i = 0; i < 4; i += 1) bar(`tag-${i}`, [0.09, 0.15, 0.018], [(i - 1.5) * 0.075, 1.58 - i * 0.08, 0.17]);
    if (id === "stone_antlers") for (const side of [-1, 1]) { const horn = bar(`antler-${side}`, [0.06, 0.62, 0.08], [0.45, 1.08, side * 0.18], side * 0.65); horn.material = accent; }
    if (id === "blank_banner") { const mast = bar("banner-spine", [0.055, 1.75, 0.055], [0, 1.6, -0.2]); const cloth = bar("blank-banner", [0.62, 0.72, 0.025], [0.28, 2.05, -0.2], -0.06); this.animatedParts.push(mast, cloth); }
    if (id === "reed_halo") ring("reed-halo", 0.34, [0, 1.88, 0], "y");
    if (id === "reed_mask") { bar("reed-mask", [0.34, 0.45, 0.04], [0, 1.84, 0.18]); for (let i = 0; i < 5; i += 1) bar(`face-reed-${i}`, [0.018, 0.75 + i * 0.08, 0.018], [(i - 2) * 0.07, 1.7, 0.2], (i - 2) * 0.06); }
    if (id === "vent_stack") for (let i = 0; i < 3; i += 1) { const vent = this.mesh(`vent-${i}`, new THREE.CylinderGeometry(0.06, 0.08, 0.48 + i * 0.12, 7), accent, parent); vent.position.set((i - 1) * 0.16, 1.56, -0.28); }
    if (id === "glass_branches") for (let i = 0; i < 6; i += 1) { const shard = this.mesh(`glass-limb-${i}`, new THREE.ConeGeometry(0.05, 0.92 - i * 0.06, 5), accent, parent); shard.position.set(0.12 + i * 0.11, 0.98 + i * 0.08, (i % 2 ? -1 : 1) * 0.16); shard.rotation.z = -1 + i * 0.23; }
    if (id === "stitched_veil") { bar("veil", [0.4, 0.53, 0.035], [0, 1.81, 0.18]); for (const side of [-1, 1]) ring(`prayer-knot-${side}`, 0.09, [side * 0.36, 0.8, 0]); }
    if (id === "mouth_rings") for (let i = 0; i < 4; i += 1) { const mouth = ring(`mouth-${i}`, 0.13 + i * 0.08, [0, 1.15 + i * 0.1, 0]); mouth.scale.y = 0.58; this.animatedParts.push(mouth); }
    if (id === "bone_cluster") for (let i = 0; i < 6; i += 1) { const skull = this.mesh(`skull-${i}`, new THREE.SphereGeometry(0.105, 7, 5), i % 2 ? accent : shadow, parent); skull.scale.set(0.8, 1, 0.8); skull.position.set(Math.cos(i) * 0.42, 0.78 + i * 0.12, Math.sin(i) * 0.3); }
    if (id === "bell_cavity") { const bell = this.mesh("bell-cavity", new THREE.ConeGeometry(0.35, 0.62, 12, 1, true), accent, parent); bell.position.y = 1.2; const rope = this.mesh("rope-arms", new THREE.TorusKnotGeometry(0.3, 0.035, 48, 5), shadow, parent); rope.position.y = 1.0; this.animatedParts.push(bell); }
    if (id === "mirror_face") { const mirror = this.mesh("sealed-mirror", new THREE.CircleGeometry(0.24, 6), accent, parent); mirror.position.set(0, 1.9, 0.19); }
    if (id === "coral_cage") for (let i = 0; i < 7; i += 1) { const coral = bar(`coral-${i}`, [0.04, 0.64, 0.04], [Math.cos(i) * 0.29, 1.18, Math.sin(i) * 0.29], Math.cos(i) * 0.55); coral.material = accent; }
    if (id === "empty_bedframe") { for (const side of [-1, 1]) bar(`bed-rail-${side}`, [0.05, 1.55, 0.05], [side * 0.42, 1.18, -0.05]); for (const y of [0.62, 1.72]) bar(`bed-cross-${y}`, [0.9, 0.05, 0.05], [0, y, -0.05]); }
    if (id === "measure_racks") for (let i = 0; i < 5; i += 1) { const rack = bar(`measure-${i}`, [0.045, 1.35 - i * 0.13, 0.045], [(i - 2) * 0.18, 1.25 + Math.abs(i - 2) * 0.1, 0], (i - 2) * 0.17); this.animatedParts.push(rack); }
    if (id === "reflection_sheet") { const sheet = this.mesh("reflection", new THREE.PlaneGeometry(0.88, 1.72), accent, parent); sheet.position.y = 1.0; sheet.material.transparent = true; sheet.material.opacity = 0.68; this.animatedParts.push(sheet); }
    if (id === "cart_wheels") for (const side of [-1, 1]) { const wheel = ring(`wheel-${side}`, 0.43, [side * 0.48, 0.58, 0], "y"); this.animatedParts.push(wheel); }
    if (id === "lung_sails") for (const side of [-1, 1]) { const lung = this.mesh(`lung-sail-${side}`, new THREE.SphereGeometry(0.3, 8, 6), accent, parent); lung.scale.set(0.48, 1.28, 0.18); lung.position.set(side * 0.23, 1.22, 0); this.animatedParts.push(lung); }
    if (id === "horizon_spines") for (let i = 0; i < 7; i += 1) { const spine = this.mesh(`horizon-spine-${i}`, new THREE.ConeGeometry(0.035, 0.52 + i * 0.04, 5), accent, parent); spine.position.set((i - 3) * 0.08, 1.9 + i * 0.045, -0.05); spine.rotation.z = -0.3 + i * 0.1; }
    if (id === "root_crown") { const crown = this.mesh("root-crown", new THREE.TorusKnotGeometry(0.36, 0.04, 64, 7, 2, 5), accent, parent); crown.position.y = 1.54; crown.scale.y = 0.7; this.animatedParts.push(crown); }
    if (id === "anchor_shadow") { const shaft = bar("shadow-anchor-shaft", [0.08, 1.8, 0.035], [0, 0.91, -0.36], 0.1 + jitter); const arms = bar("shadow-anchor-arms", [0.95, 0.08, 0.035], [0.09, 0.28, -0.36], -0.12); shaft.material = shadow; arms.material = shadow; }
  }

  setTelegraph(strength: number): void {
    this.telegraph = THREE.MathUtils.clamp(strength, 0, 1);
    const color = new THREE.Color(typeof this.userData.telegraphColor === "string" ? `#${this.userData.telegraphColor}` : this.recipe.palette.accent);
    for (const surface of this.surfaces) { surface.emissive.copy(color); surface.emissiveIntensity = this.telegraph * 0.52; }
  }

  update(deltaSeconds: number, movementSpeed = 0): void {
    const delta = Number.isFinite(deltaSeconds) ? Math.max(0, Math.min(0.1, deltaSeconds)) : 0;
    this.elapsed += delta * (1.2 + Math.max(0, movementSpeed) * 2.4);
    const wave = Math.sin(this.elapsed * Math.PI * 2);
    const pulse = (wave + 1) / 2;
    const core = this.getObjectByName("core");
    if (!core) return;
    if (["float", "reflection", "billow"].includes(this.recipe.locomotion)) core.position.y = 0.08 + wave * 0.07;
    else if (["weighted", "measure", "anchor_drag"].includes(this.recipe.locomotion)) core.position.y = Math.max(0, wave) * 0.025;
    else core.position.y = Math.abs(wave) * Math.min(0.06, movementSpeed * 0.035);
    core.rotation.y = ["sway", "pendulum", "undertow"].includes(this.recipe.locomotion) ? wave * 0.08 : 0;
    this.animatedParts.forEach((part, index) => {
      if (part === core) return;
      const offset = this.elapsed * Math.PI * 2 + index * 0.7;
      if (["scuttle", "bound", "angular"].includes(this.recipe.locomotion)) part.rotation.x = Math.sin(offset) * 0.22 * Math.min(1, movementSpeed);
      if (["cadence", "march", "care_round"].includes(this.recipe.locomotion)) part.rotation.z += (Math.sin(offset) * 0.08 - part.rotation.z) * 0.18;
      if (["root_pulse", "billow", "reflection"].includes(this.recipe.locomotion)) part.scale.setScalar(0.94 + pulse * 0.1);
      if (this.recipe.locomotion === "roll" && part.name.startsWith("wheel")) part.rotation.x -= delta * movementSpeed * 2.5;
    });
    if (this.telegraph > 0) this.setTelegraph(Math.max(0, this.telegraph - delta * 0.35));
  }

  debugPrototype(): Readonly<Record<string, unknown>> {
    return Object.freeze({
      familyId: this.recipe.familyId,
      contentStatus: this.userData.contentStatus,
      silhouetteSignature: this.userData.silhouetteSignature,
      anatomicalViolation: this.recipe.anatomicalViolation,
      locomotionRule: this.recipe.locomotionRule,
      soundGrammar: this.recipe.soundGrammar,
      meshCount: this.getObjectsByProperty("isMesh", true).length,
    });
  }

  dispose(): void {
    this.traverse((object) => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
    this.surfaces.forEach((surface) => surface.dispose());
    this.clear();
  }
}

export function isCreatureFamilyId(value: string): value is CreatureFamilyId {
  return (CREATURE_FAMILY_IDS as readonly string[]).includes(value);
}

export function createPrototypeCreatureRig(familyId: CreatureFamilyId, options: PrototypeCreatureOptions = {}): PrototypeCreatureRig {
  const definition = PROTOTYPE_CREATURE_RECIPES[familyId];
  if (!definition) throw new Error(`No prototype silhouette recipe for creature family ${familyId}`);
  return new PrototypeCreatureRig(definition, options);
}
