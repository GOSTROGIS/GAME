import * as THREE from "three";

type MorphMap = Record<string, number>;

export interface PilgrimAppearance {
  appearance?: {
    body?: string;
    face?: string;
    hair?: string;
    marking?: string;
    morphs?: MorphMap;
    plague?: { pallor?: number; lesions?: number; veinDarkening?: number; eyeClouding?: number };
  };
  origin?: string;
}

export interface PilgrimSilhouette {
  body: {
    height: number;
    torsoWidth: number;
    shoulderWidth: number;
    hipWidth: number;
    limbWidth: number;
    torsoRatio: number;
    muscleDefinition: number;
  };
  head: {
    scale: number;
    jaw: number;
    cheek: number;
    brow: number;
    nose: number;
    eyeSpacing: number;
    eyeScale: number;
    earScale: number;
    apparentAge: number;
  };
  hair: { style: string; length: number; volume: number; asymmetry: number };
  palette: { skin: string; hair: string; eye: string; eyeGlow?: number; marking: string };
  marking: { pattern: string; placement: string; opacity: number };
}

type RigPart = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;

const material = (color: THREE.ColorRepresentation, roughness = 0.82, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

const mesh = (geometry: THREE.BufferGeometry, surface: THREE.MeshStandardMaterial, shadows = true): RigPart => {
  const result = new THREE.Mesh(geometry, surface);
  result.castShadow = shadows;
  result.receiveShadow = shadows;
  return result;
};

export class PilgrimRig extends THREE.Group {
  readonly bones = {
    root: new THREE.Bone(), hips: new THREE.Bone(), spine: new THREE.Bone(), chest: new THREE.Bone(), neck: new THREE.Bone(), head: new THREE.Bone(),
    leftUpperArm: new THREE.Bone(), leftForearm: new THREE.Bone(), rightUpperArm: new THREE.Bone(), rightForearm: new THREE.Bone(),
    leftThigh: new THREE.Bone(), leftShin: new THREE.Bone(), rightThigh: new THREE.Bone(), rightShin: new THREE.Bone(),
  };

  private readonly surfaces = {
    skin: material("#88786c", 0.96), skinShadow: material("#493d3a", 1), eye: material("#82918a", 0.42),
    hair: material("#1b1918", 1), cloth: material("#252728", 1), clothEdge: material("#4a443b", 1),
    leather: material("#3b2d27", 0.92), metal: material("#504d47", 0.54, 0.42), marking: material("#4d2522", 1),
    scar: material("#5d3c38", 1),
  };

  private readonly parts: Record<string, RigPart | THREE.Group> = {};
  private elapsed = 0;
  private appearanceSignature = "";
  private equipmentVisualIds: string[] = [];

  constructor(private readonly variant: "player" | "maela" | "torren" | "ysra" = "player") {
    super();
    this.name = `rig:${variant}`;
    this.buildSkeleton();
    this.buildBody();
  }

  private part(name: string): RigPart | THREE.Group {
    const part = this.parts[name];
    if (!part) throw new Error(`Pilgrim rig is missing required part: ${name}`);
    return part;
  }

  private buildSkeleton() {
    const b = this.bones;
    this.add(b.root); b.root.add(b.hips); b.hips.add(b.spine); b.spine.add(b.chest); b.chest.add(b.neck); b.neck.add(b.head);
    b.chest.add(b.leftUpperArm, b.rightUpperArm); b.leftUpperArm.add(b.leftForearm); b.rightUpperArm.add(b.rightForearm);
    b.hips.add(b.leftThigh, b.rightThigh); b.leftThigh.add(b.leftShin); b.rightThigh.add(b.rightShin);
    b.hips.position.y = 0.92; b.spine.position.y = 0.18; b.chest.position.y = 0.33; b.neck.position.y = 0.32; b.head.position.y = 0.15;
    b.leftUpperArm.position.set(-0.23, 0.24, 0); b.rightUpperArm.position.set(0.23, 0.24, 0);
    b.leftForearm.position.y = -0.31; b.rightForearm.position.y = -0.31;
    b.leftThigh.position.set(-0.105, -0.04, 0); b.rightThigh.position.set(0.105, -0.04, 0);
    b.leftShin.position.y = -0.43; b.rightShin.position.y = -0.43;
  }

  private buildBody() {
    const b = this.bones;
    const capsule = (radius: number, length: number, surface: THREE.MeshStandardMaterial) => mesh(new THREE.CapsuleGeometry(radius, length, 4, 8), surface);
    const torso = mesh(new THREE.CylinderGeometry(0.19, 0.15, 0.5, 8), this.surfaces.cloth); torso.position.y = 0.12; b.spine.add(torso); this.parts.torso = torso;
    const mantle = mesh(new THREE.CylinderGeometry(0.25, 0.42, 0.95, 10, 1, true), this.surfaces.clothEdge); mantle.position.set(0, -0.16, 0.045); mantle.scale.z = 0.46; b.chest.add(mantle); this.parts.mantle = mantle;
    const belt = mesh(new THREE.TorusGeometry(0.18, 0.022, 6, 16), this.surfaces.leather); belt.rotation.x = Math.PI / 2; belt.position.y = -0.12; b.spine.add(belt); this.parts.belt = belt;

    for (const side of ["left", "right"] as const) {
      const armSign = side === "left" ? -1 : 1;
      const upper = capsule(0.055, 0.24, this.surfaces.cloth); upper.position.y = -0.15; this.bones[`${side}UpperArm`].add(upper); this.parts[`${side}UpperArm`] = upper;
      const fore = capsule(0.047, 0.24, this.surfaces.leather); fore.position.y = -0.15; this.bones[`${side}Forearm`].add(fore); this.parts[`${side}Forearm`] = fore;
      const hand = mesh(new THREE.SphereGeometry(0.063, 10, 8), this.surfaces.skin); hand.scale.set(0.78, 1.2, 0.65); hand.position.y = -0.31; this.bones[`${side}Forearm`].add(hand); this.parts[`${side}Hand`] = hand;
      const thigh = capsule(0.073, 0.32, this.surfaces.cloth); thigh.position.y = -0.22; this.bones[`${side}Thigh`].add(thigh); this.parts[`${side}Thigh`] = thigh;
      const shin = capsule(0.062, 0.34, this.surfaces.leather); shin.position.y = -0.23; this.bones[`${side}Shin`].add(shin); this.parts[`${side}Shin`] = shin;
      const boot = mesh(new THREE.BoxGeometry(0.13, 0.1, 0.28), this.surfaces.leather); boot.position.set(0, -0.45, 0.07); this.bones[`${side}Shin`].add(boot); this.parts[`${side}Boot`] = boot;
      this.bones[`${side}UpperArm`].rotation.z = armSign * 0.08;
    }

    const head = mesh(new THREE.SphereGeometry(0.13, 18, 14), this.surfaces.skin); head.scale.set(0.76, 1.12, 0.82); b.head.add(head); this.parts.head = head;
    const jaw = mesh(new THREE.SphereGeometry(0.1, 14, 10), this.surfaces.skin); jaw.scale.set(0.72, 0.58, 0.78); jaw.position.y = -0.085; b.head.add(jaw); this.parts.jaw = jaw;
    const nose = mesh(new THREE.ConeGeometry(0.025, 0.11, 6), this.surfaces.skin); nose.rotation.x = Math.PI / 2; nose.position.set(0, 0.005, 0.135); b.head.add(nose); this.parts.nose = nose;
    const brow = mesh(new THREE.BoxGeometry(0.15, 0.022, 0.025), this.surfaces.skinShadow); brow.position.set(0, 0.055, 0.115); b.head.add(brow); this.parts.brow = brow;
    const cheeks = new THREE.Group(); b.head.add(cheeks); this.parts.cheeks = cheeks;
    for (const sign of [-1, 1]) { const cheek = mesh(new THREE.SphereGeometry(0.035, 8, 6), this.surfaces.skinShadow); cheek.scale.set(1.4, .72, .28); cheek.position.set(sign * .072, -.035, .118); cheeks.add(cheek); }
    const eyes = new THREE.Group(); b.head.add(eyes); this.parts.eyes = eyes;
    for (const sign of [-1, 1]) { const eye = mesh(new THREE.SphereGeometry(0.018, 10, 8), this.surfaces.eye, false); eye.scale.y = .62; eye.position.set(sign * .05, .032, .129); eyes.add(eye); }
    const ears = new THREE.Group(); b.head.add(ears); this.parts.ears = ears;
    for (const sign of [-1, 1]) { const ear = mesh(new THREE.SphereGeometry(.026, 8, 6), this.surfaces.skin); ear.scale.set(.45, 1, .35); ear.position.set(sign * .112, 0, 0); ears.add(ear); }
    const hair = mesh(new THREE.SphereGeometry(.139, 14, 10, 0, Math.PI * 2, 0, Math.PI * .58), this.surfaces.hair); hair.scale.set(.8, 1.02, .86); hair.position.y = .035; b.head.add(hair); this.parts.hair = hair;
    const marking = mesh(new THREE.BoxGeometry(.012, .1, .006), this.surfaces.marking, false); marking.position.set(.055, -.015, .139); marking.rotation.z = -.28; b.head.add(marking); this.parts.marking = marking;
    const scar = mesh(new THREE.BoxGeometry(.009, .085, .005), this.surfaces.scar, false); scar.position.set(-.058, -.025, .139); scar.rotation.z = .34; scar.visible = false; b.head.add(scar); this.parts.scar = scar;

    const sword = new THREE.Group(); const blade = mesh(new THREE.BoxGeometry(.035, .78, .018), this.surfaces.metal); blade.position.y = -.56; sword.add(blade); const guard = mesh(new THREE.BoxGeometry(.2,.025,.035),this.surfaces.metal); guard.position.y=-.15;sword.add(guard); sword.position.set(.06,-.28,.04); sword.rotation.z=-.18;b.rightForearm.add(sword);this.parts.weapon=sword;
    this.applyVariant();
  }

  private applyVariant() {
    if (this.variant === "maela") { this.surfaces.cloth.color.set("#4c2428"); this.part("mantle").scale.x *= 1.08; }
    if (this.variant === "torren") { this.surfaces.metal.color.set("#6c6254"); this.surfaces.cloth.color.set("#282727"); this.part("torso").scale.x *= 1.12; }
    if (this.variant === "ysra") { this.surfaces.cloth.color.set("#38473d"); this.surfaces.clothEdge.color.set("#656347"); this.part("mantle").scale.z *= 1.2; }
  }

  applyAppearance(character: PilgrimAppearance, silhouette: PilgrimSilhouette) {
    const morphs = character.appearance?.morphs ?? {};
    const value = (id: string) => THREE.MathUtils.clamp(morphs[id] ?? 0, -1, 1);
    const bodyHeight = silhouette.body.height / 100;
    this.scale.y = bodyHeight;
    const torso = this.part("torso");
    const mantle = this.part("mantle");
    const belt = this.part("belt");
    const head = this.part("head");
    const jaw = this.part("jaw");
    const cheeks = this.part("cheeks");
    const brow = this.part("brow");
    const nose = this.part("nose");
    const eyes = this.part("eyes");
    const ears = this.part("ears");
    const hair = this.part("hair");
    const marking = this.part("marking");
    const scar = this.part("scar");
    torso.scale.set(silhouette.body.torsoWidth / 22, .88 + value("torsoLength") * .1, .78 + value("bodyMass") * .08);
    mantle.scale.x = (this.variant === "maela" ? 1.08 : 1) * silhouette.body.shoulderWidth / 28;
    belt.scale.set(silhouette.body.hipWidth / 22, silhouette.body.hipWidth / 22, silhouette.body.hipWidth / 22);
    const limbScale = silhouette.body.limbWidth / 7;
    for (const side of ["left", "right"] as const) {
      for (const segment of ["UpperArm", "Forearm", "Thigh", "Shin"] as const) {
        const limb = this.part(`${side}${segment}`); limb.scale.x = limbScale; limb.scale.z = limbScale;
      }
    }
    this.bones.leftUpperArm.position.x = -.23 * silhouette.body.shoulderWidth / 28;
    this.bones.rightUpperArm.position.x = .23 * silhouette.body.shoulderWidth / 28;
    this.bones.leftThigh.position.x = -.105 * silhouette.body.hipWidth / 22;
    this.bones.rightThigh.position.x = .105 * silhouette.body.hipWidth / 22;
    this.bones.head.scale.setScalar(silhouette.head.scale);
    head.scale.set(.76, 1.12, .82);
    jaw.scale.x = .72 * (1 + silhouette.head.jaw * .18);
    cheeks.scale.set(1 + silhouette.head.cheek * .25, 1 - silhouette.head.cheek * .08, 1);
    brow.scale.z = 1 + silhouette.head.brow * .55;
    brow.position.z = .115 + silhouette.head.brow * .012;
    nose.scale.y = 1 + silhouette.head.nose * .25;
    eyes.scale.set(silhouette.head.eyeScale, silhouette.head.eyeScale, silhouette.head.eyeScale);
    for (const [index, eye] of eyes.children.entries()) eye.position.x = (index ? 1 : -1) * (.05 + silhouette.head.eyeSpacing * .08);
    ears.scale.setScalar(silhouette.head.earScale);
    hair.scale.set(.8 * (1 + silhouette.hair.volume * .16), 1.02 + silhouette.hair.length * .36, .86 * (1 + silhouette.hair.volume * .12));
    hair.position.x = silhouette.hair.asymmetry * .025;
    marking.visible = silhouette.marking.pattern !== "none" && silhouette.marking.opacity > 0;
    const scarDepth = Math.max(0, value("scarDepth"));
    scar.visible = scarDepth > .01;
    scar.scale.set(1 + scarDepth * .16, .72 + scarDepth * .42, .72 + scarDepth * .5);
    scar.position.z = .139 + scarDepth * .006;
    this.surfaces.skin.color.set(silhouette.palette.skin).offsetHSL(-.02, -.08, -silhouette.head.apparentAge * .055);
    const plague = character.appearance?.plague;
    const pallor = THREE.MathUtils.clamp(plague?.pallor ?? 0, 0, 1);
    const lesions = THREE.MathUtils.clamp(plague?.lesions ?? 0, 0, 1);
    const eyeClouding = THREE.MathUtils.clamp(plague?.eyeClouding ?? 0, 0, 1);
    this.surfaces.skin.color.offsetHSL(0, -pallor * .22, pallor * .07);
    this.surfaces.skin.roughness = .86 + silhouette.head.apparentAge * .12 + lesions * .04;
    this.surfaces.hair.color.set(silhouette.palette.hair);
    this.surfaces.eye.color.set(silhouette.palette.eye);
    this.surfaces.eye.emissive.set(silhouette.palette.eye);
    this.surfaces.eye.emissiveIntensity = silhouette.palette.eyeGlow ?? 0;
    this.surfaces.eye.color.lerp(new THREE.Color("#b7b8ae"), eyeClouding * .65);
    this.surfaces.marking.color.set(silhouette.palette.marking);
    this.surfaces.marking.opacity = silhouette.marking.opacity;
    this.surfaces.marking.transparent = silhouette.marking.opacity < 1;
    this.surfaces.scar.color.copy(this.surfaces.skin.color).offsetHSL(0, .08, -.18);
    this.surfaces.scar.opacity = .28 + scarDepth * .5;
    this.surfaces.scar.transparent = true;
    this.surfaces.scar.depthWrite = false;
    this.appearanceSignature = JSON.stringify({ body: silhouette.body, head: silhouette.head, hair: silhouette.hair, palette: silhouette.palette, marking: silhouette.marking, morphs, origin: character.origin });
  }

  applyEquipment(ids: readonly string[]) {
    this.equipmentVisualIds = [...new Set(ids.filter((id) => /^[a-z0-9][a-z0-9_-]{0,63}$/.test(id)))].sort();
    const signature = this.equipmentVisualIds.join("|");
    let hash = 2166136261;
    for (const character of signature) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    const variation = (hash >>> 0) / 0xffffffff;
    const weapon = this.part("weapon");
    weapon.visible = this.equipmentVisualIds.some((id) => /spear|sword|blade|axe|mace|staff|bow/.test(id));
    weapon.scale.set(.9 + variation * .18, .84 + variation * .28, .9 + variation * .18);
    const mantle = this.part("mantle");
    mantle.visible = this.equipmentVisualIds.some((id) => /cloak|coat|mantle|robe|bedroll|back/.test(id));
    for (const side of ["left", "right"] as const) {
      const boot = this.part(`${side}Boot`);
      boot.scale.z = .88 + variation * .24;
    }
  }

  update(delta: number, speed: number, attackCooldown = 0, heading = 0) {
    this.elapsed += delta * (speed > .05 ? 7.5 : 1.5);
    const stride = Math.sin(this.elapsed) * Math.min(.7, speed * .24);
    const breathe = Math.sin(this.elapsed * .31) * .012;
    this.bones.leftThigh.rotation.x = stride; this.bones.rightThigh.rotation.x = -stride;
    this.bones.leftShin.rotation.x = Math.max(0, -stride) * .55; this.bones.rightShin.rotation.x = Math.max(0, stride) * .55;
    this.bones.leftUpperArm.rotation.x = -stride * .62; this.bones.rightUpperArm.rotation.x = stride * .62;
    this.bones.spine.rotation.z = breathe;
    if (attackCooldown > 0) { const phase = Math.sin(Math.min(1, attackCooldown) * Math.PI); this.bones.rightUpperArm.rotation.x = -1.3 * phase; this.bones.chest.rotation.y = -.42 * phase; }
    else this.bones.chest.rotation.y *= .82;
    if (speed > .03) this.rotation.y = heading;
  }

  debugAppearance() {
    const leftUpperArm = this.part("leftUpperArm");
    const torso = this.part("torso");
    const jaw = this.part("jaw");
    const cheeks = this.part("cheeks");
    const brow = this.part("brow");
    const nose = this.part("nose");
    const eyes = this.part("eyes");
    const ears = this.part("ears");
    const marking = this.part("marking");
    const scar = this.part("scar");
    return {
      signature: this.appearanceSignature,
      morphObservables: {
        stature: this.scale.y,
        musculature: leftUpperArm.scale.x,
        bodyMass: torso.scale.z,
        shoulderWidth: Math.abs(this.bones.leftUpperArm.position.x),
        hipWidth: Math.abs(this.bones.leftThigh.position.x),
        torsoLength: torso.scale.y,
        headScale: this.bones.head.scale.y,
        jawWidth: jaw.scale.x,
        cheekDepth: cheeks.scale.x,
        browDepth: brow.position.z,
        noseLength: nose.scale.y,
        eyeSpacing: Math.abs(eyes.children[0]?.position.x ?? 0),
        eyeSize: eyes.scale.x,
        earSize: ears.scale.x,
        age: this.surfaces.skin.roughness,
        scarDepth: scar.visible ? scar.scale.z : 0,
      },
      materials: {
        skin: `#${this.surfaces.skin.color.getHexString()}`,
        hair: `#${this.surfaces.hair.color.getHexString()}`,
        eye: `#${this.surfaces.eye.color.getHexString()}`,
        marking: `#${this.surfaces.marking.color.getHexString()}`,
        markingOpacity: this.surfaces.marking.opacity,
        scarOpacity: this.surfaces.scar.opacity,
      },
      visibleMarking: marking.visible,
      visibleScar: scar.visible,
      equipmentVisualIds: [...this.equipmentVisualIds],
    };
  }
}
