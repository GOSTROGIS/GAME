import * as THREE from "three";
import type { HearthmereSceneManifest, SceneLight, WorldTransform } from "@hearthmere/content";

export type SceneManifestLike = HearthmereSceneManifest;

export interface HearthmereSceneBuild {
  root: THREE.Group;
  occluders: THREE.Object3D[];
  navigationSurfaces: THREE.Object3D[];
  animated: Array<(delta: number, elapsed: number) => void>;
  visibleInstanceCount: number;
  dispose(): void;
}

const standard = (color: THREE.ColorRepresentation, roughness = .9, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const markPrototype = <T extends THREE.Object3D>(object: T, assetId: string): T => {
  object.userData.assetId = assetId;
  object.userData.contentStatus = "prototype_primitive";
  object.traverse((child) => { child.userData.assetId = assetId; child.userData.contentStatus = "prototype_primitive"; });
  return object;
};

const addMesh = (group: THREE.Group, geometry: THREE.BufferGeometry, surface: THREE.Material, position: THREE.Vector3, cast = true) => {
  const result = new THREE.Mesh(geometry, surface);
  result.position.copy(position); result.castShadow = cast; result.receiveShadow = true; group.add(result); return result;
};

function gableGeometry(width: number, depth: number, wallHeight: number, roofHeight: number) {
  const x = width / 2, z = depth / 2;
  const vertices = new Float32Array([
    -x,0,-z, x,0,-z, x,wallHeight,-z, -x,wallHeight,-z,
    -x,0,z, x,0,z, x,wallHeight,z, -x,wallHeight,z,
    0,wallHeight+roofHeight,-z, 0,wallHeight+roofHeight,z,
  ]);
  const indices = [0,1,2,0,2,3, 5,4,7,5,7,6, 4,0,3,4,3,7, 1,5,6,1,6,2, 3,2,8, 6,7,9, 7,3,8,7,8,9, 2,6,9,2,9,8, 0,4,5,0,5,1];
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.BufferAttribute(vertices,3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

function house(assetId: string) {
  const group = markPrototype(new THREE.Group(), assetId);
  const wall = standard("#393432", .97), timber = standard("#211a18", 1), roof = standard("#181b1d", .88, .05), window = standard("#d58b43", .48);
  const shell = addMesh(group, gableGeometry(7.2, 5.4, 3.8, 2.3), wall, new THREE.Vector3()); shell.userData.occluder = true;
  for (const x of [-3.65,0,3.65]) addMesh(group,new THREE.BoxGeometry(.22,4.1,.26),timber,new THREE.Vector3(x,2.05,-2.74));
  for (const y of [.45,2.05,3.62]) addMesh(group,new THREE.BoxGeometry(7.4,.2,.27),timber,new THREE.Vector3(0,y,-2.75));
  const leftRoof = addMesh(group,new THREE.BoxGeometry(5.05,.18,5.8),roof,new THREE.Vector3(-1.77,4.9,0));leftRoof.rotation.z=-.57;
  const rightRoof = addMesh(group,new THREE.BoxGeometry(5.05,.18,5.8),roof,new THREE.Vector3(1.77,4.9,0));rightRoof.rotation.z=.57;
  addMesh(group,new THREE.BoxGeometry(1.15,1.35,.08),window,new THREE.Vector3(1.65,2.1,-2.91),false);
  const warm = new THREE.PointLight("#d6803e",4.5,11,2);warm.position.set(1.65,2.15,-3.2);warm.castShadow=false;group.add(warm);
  group.userData.occluder = true; return group;
}

function blackPine(assetId: string) {
  const group=markPrototype(new THREE.Group(),assetId);const trunk=standard("#171514",1),needles=standard("#102522",.96);
  addMesh(group,new THREE.CylinderGeometry(.2,.34,5.8,7),trunk,new THREE.Vector3(0,2.9,0));
  for(const [y,r,h] of [[3.1,2.15,3.1],[4.35,1.65,2.65],[5.55,1.1,2.15]] as const){const crown=addMesh(group,new THREE.ConeGeometry(r,h,9),needles,new THREE.Vector3(0,y,0));crown.rotation.y=y;}
  group.userData.occluder=true;return group;
}

function shrine(assetId: string, animated: HearthmereSceneBuild["animated"]) {
  const group=markPrototype(new THREE.Group(),assetId);const stone=standard("#555755",.94),bronze=standard("#725b3b",.54,.42),ember=standard("#ca6934",.5);
  addMesh(group,new THREE.CylinderGeometry(1.35,1.6,.45,8),stone,new THREE.Vector3(0,.22,0));
  addMesh(group,new THREE.CylinderGeometry(.38,.5,2.9,7),stone,new THREE.Vector3(0,1.65,0));
  addMesh(group,new THREE.TorusGeometry(.62,.09,8,20),bronze,new THREE.Vector3(0,2.62,0)).rotation.x=Math.PI/2;
  const flame=addMesh(group,new THREE.ConeGeometry(.18,.65,8),ember,new THREE.Vector3(0,3.15,0));
  const light=new THREE.PointLight("#e79a4e",16,22,2);light.position.set(0,3.15,0);light.castShadow=true;light.shadow.mapSize.set(512,512);group.add(light);
  animated.push((_delta,time)=>{flame.scale.y=.82+Math.sin(time*8)*.16;light.intensity=14+Math.sin(time*7.3)*2.5;});return group;
}

function brazier(assetId: string, animated: HearthmereSceneBuild["animated"]) {
  const group=markPrototype(new THREE.Group(),assetId);const iron=standard("#453c32",.58,.52),fire=standard("#d96f31",.45);
  addMesh(group,new THREE.CylinderGeometry(.32,.18,.42,10),iron,new THREE.Vector3(0,.8,0));addMesh(group,new THREE.CylinderGeometry(.05,.07,.72,8),iron,new THREE.Vector3(0,.35,0));
  const flame=addMesh(group,new THREE.ConeGeometry(.12,.48,7),fire,new THREE.Vector3(0,1.16,0));const light=new THREE.PointLight("#dc7839",7,10,2);light.position.y=1.2;group.add(light);
  animated.push((_d,t)=>{flame.scale.setScalar(.9+Math.sin(t*9+group.position.x)*.11);});return group;
}

function palisade(assetId: string) {
  const group=markPrototype(new THREE.Group(),assetId);const wood=standard("#29211d",1);
  for(let index=-4;index<=4;index++){const post=addMesh(group,new THREE.CylinderGeometry(.2,.28,3.7,6),wood,new THREE.Vector3(index*.53,1.85,0));post.rotation.y=index*.17;}
  addMesh(group,new THREE.BoxGeometry(5.2,.18,.22),wood,new THREE.Vector3(0,1.15,0));addMesh(group,new THREE.BoxGeometry(5.2,.18,.22),wood,new THREE.Vector3(0,2.45,0));group.userData.occluder=true;return group;
}

function prop(assetId: string) {
  const group=markPrototype(new THREE.Group(),assetId);const wood=standard("#362b24",1),clay=standard("#695343",.96),iron=standard("#4b4c49",.65,.34);
  if(assetId.includes("clay")||assetId.includes("ledger")){for(let i=0;i<5;i++)addMesh(group,new THREE.BoxGeometry(.56,.08,.38),clay,new THREE.Vector3((i%2)*.3,i*.09,0));}
  else if(assetId.includes("barrel")){addMesh(group,new THREE.CylinderGeometry(.4,.44,.85,12),wood,new THREE.Vector3(0,.43,0));for(const y of [.12,.72])addMesh(group,new THREE.TorusGeometry(.42,.025,5,14),iron,new THREE.Vector3(0,y,0)).rotation.x=Math.PI/2;}
  else if(assetId.includes("bench")||assetId.includes("rest")){addMesh(group,new THREE.BoxGeometry(2,.16,.58),wood,new THREE.Vector3(0,.62,0));for(const x of [-.78,.78])addMesh(group,new THREE.BoxGeometry(.14,.62,.42),wood,new THREE.Vector3(x,.3,0));}
  else {addMesh(group,new THREE.BoxGeometry(.8,.7,.8),wood,new THREE.Vector3(0,.35,0));}
  return group;
}

function surface(assetId: string) {
  const color=assetId.includes("slate")?"#41494a":assetId.includes("mud")?"#292721":assetId.includes("limestone")?"#5b5b54":"#343a38";
  const result=markPrototype(new THREE.Mesh(new THREE.BoxGeometry(4,.1,4),standard(color,.94)),assetId);result.receiveShadow=true;result.position.y=.03;return result;
}

function createAsset(assetId: string, animated: HearthmereSceneBuild["animated"]): THREE.Object3D {
  if(assetId.includes("house")||assetId.includes("gatehouse")||assetId.includes("tower"))return house(assetId);
  if(assetId.includes("pine"))return blackPine(assetId);
  if(assetId.includes("shrine"))return shrine(assetId,animated);
  if(assetId.includes("brazier"))return brazier(assetId,animated);
  if(assetId.includes("palisade"))return palisade(assetId);
  if(assetId.includes("cobbles")||assetId.includes("steps")||assetId.includes("limestone")||assetId.includes("mud")||assetId.includes("planks"))return surface(assetId);
  return prop(assetId);
}

const positionOf=({position}:WorldTransform)=>new THREE.Vector3(...position);
const rotationOf=({rotation}:WorldTransform)=>new THREE.Euler(...rotation);
const scaleOf=({scale}:WorldTransform)=>new THREE.Vector3(...scale);

function addManifestLight(root: THREE.Group, lightData: SceneLight) {
  if (lightData.type !== "point") return;
  const light=new THREE.PointLight(lightData.color,lightData.intensity,lightData.rangeMeters??12,2);
  light.position.copy(positionOf(lightData.transform));
  light.castShadow=lightData.castShadow;
  root.add(light);
}

export function buildHearthmereScene(manifest: SceneManifestLike, requestedPhaseIds: Iterable<string> = manifest.phasePolicy.defaultCharacterPhases): HearthmereSceneBuild {
  const root=new THREE.Group();root.name=manifest.id;const occluders:THREE.Object3D[]=[];const navigationSurfaces:THREE.Object3D[]=[];const animated:HearthmereSceneBuild["animated"]=[];
  const activePhaseIds=new Set([...manifest.phasePolicy.alwaysActive,...requestedPhaseIds]);
  const terrain=addMesh(root,new THREE.BoxGeometry(96,.4,96),standard("#222c2d",.98),new THREE.Vector3(48,-.22,48),false);terrain.receiveShadow=true;terrain.userData.navigationSurface=true;terrain.userData.contentStatus="prototype_primitive";navigationSurfaces.push(terrain);
  let visibleInstanceCount=1;
  for(const chunk of manifest.chunks){
    const occluderInstanceIds=new Set(chunk.occluders.map((occluder)=>occluder.instanceId));
    for(const instance of chunk.instances){
      if(!instance.phaseIds.every((phaseId)=>activePhaseIds.has(phaseId)))continue;
      if(instance.type==="character"||instance.type==="enemy")continue;
      const object=createAsset(instance.assetId,animated);object.name=instance.id;object.position.copy(positionOf(instance.transform));object.rotation.copy(rotationOf(instance.transform));object.scale.multiply(scaleOf(instance.transform));object.userData.manifestInstanceId=instance.id;object.userData.phaseIds=instance.phaseIds;root.add(object);visibleInstanceCount++;
      if(occluderInstanceIds.has(instance.id)||object.userData.occluder){object.userData.occluder=true;occluders.push(object);}
    }
    for(const lightData of chunk.lights)if(lightData.phaseIds.every((phaseId)=>activePhaseIds.has(phaseId)))addManifestLight(root,lightData);
  }
  return {root,occluders,navigationSurfaces,animated,visibleInstanceCount,dispose(){root.traverse((object:any)=>{object.geometry?.dispose?.();if(Array.isArray(object.material))object.material.forEach((entry:THREE.Material)=>entry.dispose());else object.material?.dispose?.();});}};
}

export class RainField extends THREE.Points<THREE.BufferGeometry,THREE.PointsMaterial> {
  private readonly drops: Float32Array;
  constructor(count=1800){const geometry=new THREE.BufferGeometry();const drops=new Float32Array(count*3);for(let i=0;i<count;i++){drops[i*3]=(Math.random()-.5)*86;drops[i*3+1]=Math.random()*28;drops[i*3+2]=(Math.random()-.5)*86;}geometry.setAttribute("position",new THREE.BufferAttribute(drops,3));const material=new THREE.PointsMaterial({color:"#aabfbd",size:.035,transparent:true,opacity:.36,depthWrite:false});super(geometry,material);this.drops=drops;this.frustumCulled=false;}
  update(delta:number,wind:number){for(let i=0;i<this.drops.length;i+=3){this.drops[i]=(this.drops[i]??0)-delta*(1.1+wind);this.drops[i+1]=(this.drops[i+1]??0)-delta*18;if((this.drops[i+1]??0)<0){this.drops[i+1]=26;this.drops[i]=(Math.random()-.5)*86;}}this.geometry.getAttribute("position").needsUpdate=true;}
}
