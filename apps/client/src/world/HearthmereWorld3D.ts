import * as THREE from "three";
import { buildHearthmereScene, RainField, type HearthmereSceneBuild, type SceneManifestLike } from "./HearthmereScene";
import { PilgrimRig, type PilgrimSilhouette } from "./PilgrimRig";
import type { SharedWorldClient } from "../network/SharedWorldClient";
import type { AppearanceV2, IntegerPositionMm } from "@hollow-march/shared";
import { characterSilhouette } from "../../../../src/data/character.js";

interface LegacySnapshot {
  active: boolean;
  hudVisible: boolean;
  character: any;
  silhouette: PilgrimSilhouette;
  player: any;
  regionId: string;
  npcs: any[];
  enemies: any[];
  playSeconds: number;
}

interface World3DOptions {
  snapshot(): LegacySnapshot;
  requestTravel(worldX: number, worldZ: number): boolean;
  loadScene(): Promise<SceneManifestLike>;
  network?: SharedWorldClient;
}

interface RendererDebug {
  mode: "initializing" | "webgl3d" | "canvas-fallback";
  qualityProfile: "discrete" | "integrated";
  ready: boolean;
  frameCount: number;
  sceneId: string | null;
  actorCount: number;
  visibleInstanceCount: number;
  loadErrors: string[];
  camera: { yaw: number; pitch: number; distance: number };
  performance: { p50: number; p95: number; longFrames: number; sampleCount: number };
  appearance: unknown;
  remoteAppearances: Record<string, unknown>;
  remoteActorStates: Record<string, { world: [number, number, number] }>;
  enemyStates: Record<string, { hp: number; maxHp: number; visible: boolean; locomotion: string }>;
  rendererInfo: Readonly<{ render: Readonly<{ calls: number; triangles: number; points: number; lines: number }>; memory: Readonly<{ geometries: number; textures: number }> }>;
  player: { tile: [number, number]; world: [number, number, number] } | null;
}

interface MaterialFadeState {
  transparent: boolean;
  opacity: number;
  depthWrite: boolean;
  depthTest: boolean;
}

declare global { interface Window { __HOLLOW_MARCH_3D__?: RendererDebug } }

const tileToWorld = (x: number, y: number) => new THREE.Vector3(x * 4, 0, y * 4);
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

function rigDataFromAppearanceV2(appearance: AppearanceV2) {
  const character = {
    origin: appearance.originId,
    appearance: {
      body: appearance.bodyId,
      face: appearance.faceId,
      skin: appearance.skinPaletteId,
      hair: appearance.hairId,
      hairColor: appearance.hairPaletteId,
      eye: appearance.eyePaletteId,
      marking: appearance.markingId,
      markingColor: appearance.markingPaletteId,
      morphs: appearance.morphs,
      plague: appearance.plague,
    },
  };
  return { character, silhouette: characterSilhouette(character) as PilgrimSilhouette };
}

function npcSilhouette(source: PilgrimSilhouette, id: string): PilgrimSilhouette {
  const result = clone(source);
  if (id === "maela_voss") { result.body.height *= .98; result.body.shoulderWidth *= .9; result.head.apparentAge = .72; result.palette.skin = "#806f67"; result.palette.hair = "#171617"; }
  if (id === "torren_vale") { result.body.shoulderWidth *= 1.13; result.body.limbWidth *= 1.08; result.head.jaw = .42; result.palette.skin = "#786b62"; result.palette.hair = "#312c28"; }
  if (id === "ysra_pell") { result.body.height *= 1.04; result.body.torsoWidth *= .88; result.head.cheek = -.5; result.palette.skin = "#8a806f"; result.palette.hair = "#25201d"; result.palette.eye = "#8aa583"; }
  return result;
}

function createEnemyRig(kind: string) {
  const group = new THREE.Group(); group.name = `enemy:${kind}`; group.userData.contentStatus = "prototype_rig";
  const ash = new THREE.MeshStandardMaterial({ color: kind.includes("crawler") ? "#4e493e" : "#3d3a38", roughness: 1 });
  const ember = new THREE.MeshStandardMaterial({ color: "#be633d", emissive: "#6d281b", emissiveIntensity: 1.6, roughness: .72 });
  if (kind.includes("crawler")) {
    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(.52, 1), ash); body.scale.set(1.4,.65,1); body.position.y=.46;group.add(body);
    for(let i=0;i<6;i++){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.035,.055,.74,6),ash);leg.position.set((i<3?-1:1)*(.34+Math.abs(i%3-1)*.14),.26,(i%3-1)*.32);leg.rotation.z=(i<3?-1:1)*.72;group.add(leg);}
    const tablet=new THREE.Mesh(new THREE.BoxGeometry(.55,.08,.36),ember);tablet.position.set(0,.82,.08);tablet.rotation.x=.3;group.add(tablet);
  } else {
    const torso=new THREE.Mesh(new THREE.CylinderGeometry(.18,.3,1.12,8),ash);torso.position.y=.92;group.add(torso);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.16,12,10),ash);head.scale.set(.72,1.1,.82);head.position.y=1.62;group.add(head);
    for(const sign of [-1,1]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.025,8,6),ember);eye.position.set(sign*.055,1.66,.135);group.add(eye);const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.045,.65,4,7),ash);arm.position.set(sign*.29,.92,0);arm.rotation.z=sign*.24;group.add(arm);}
    for(const sign of [-1,1]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.06,.55,4,7),ash);leg.position.set(sign*.11,.28,0);group.add(leg);}
    for(let i=0;i<4;i++){const tag=new THREE.Mesh(new THREE.BoxGeometry(.1,.22,.025),new THREE.MeshStandardMaterial({color:"#82684e",roughness:1}));tag.position.set((i-1.5)*.1,1.12-i%2*.12,.28);group.add(tag);}
  }
  group.traverse((child:any)=>{if(child.isMesh){child.castShadow=true;child.receiveShadow=true;}});return group;
}

export class HearthmereWorld3D {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, .1, 240);
  private renderer: THREE.WebGLRenderer | null = null;
  private sceneBuild: HearthmereSceneBuild | null = null;
  private rain: RainField | null = null;
  private playerRig: PilgrimRig | null = null;
  private readonly npcRigs = new Map<string, PilgrimRig>();
  private readonly enemyRigs = new Map<string, THREE.Group>();
  private readonly remotePlayerRigs = new Map<string, PilgrimRig>();
  private readonly target = new THREE.Vector3();
  private readonly previousPlayer = new THREE.Vector3();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly frameSamples: number[] = [];
  private readonly fadedMaterials = new Map<THREE.Material, MaterialFadeState>();
  private readonly fadedObjects = new Map<THREE.Mesh, number>();
  private frameHandle = 0;
  private lastFrame = performance.now();
  private elapsed = 0;
  private cameraYaw = Math.PI * .24;
  private cameraPitch = THREE.MathUtils.degToRad(49);
  private cameraDistance = 14;
  private drag: { x: number; y: number } | null = null;
  private disposed = false;
  private lastAppearanceSignature = "";
  private interactionEnabled = false;
  private readonly integratedProfile = new URLSearchParams(location.search).get("quality") === "integrated";
  private debug: RendererDebug = { mode:"initializing",qualityProfile:this.integratedProfile?"integrated":"discrete",ready:false,frameCount:0,sceneId:null,actorCount:0,visibleInstanceCount:0,loadErrors:[],camera:{yaw:0,pitch:0,distance:0},performance:{p50:0,p95:0,longFrames:0,sampleCount:0},appearance:null,remoteAppearances:{},remoteActorStates:{},enemyStates:{},rendererInfo:{render:{calls:0,triangles:0,points:0,lines:0},memory:{geometries:0,textures:0}},player:null };

  constructor(private readonly canvas: HTMLCanvasElement, private readonly options: World3DOptions) {
    window.__HOLLOW_MARCH_3D__ = this.debug;
  }

  async start() {
    try {
      this.initializeRenderer();
      const manifest = await this.options.loadScene();
      this.sceneBuild = buildHearthmereScene(manifest); this.scene.add(this.sceneBuild.root);
      this.debug.sceneId = manifest.id;
      this.debug.visibleInstanceCount = this.sceneBuild.visibleInstanceCount;
      this.buildAtmosphere(); this.bindInput(); this.resize();
      this.debug.mode="webgl3d"; this.frameHandle=requestAnimationFrame(this.frame);
    } catch (error) {
      const message=error instanceof Error?error.message:String(error);this.debug.loadErrors.push(message);this.debug.mode="canvas-fallback";this.debug.ready=false;this.canvas.hidden=true;document.querySelector("#game-shell")?.classList.remove("webgl-active");console.error("WebGL Hearthmere initialization failed; Canvas remains active",error);
      this.shutdown(false);
      dispatchEvent(new CustomEvent("world-renderer-failed",{detail:this.debug}));
    }
  }

  private initializeRenderer() {
    if(new URLSearchParams(location.search).get("forceWebglFailure")==="1")throw new Error("Forced WebGL initialization failure");
    const antialias=!this.integratedProfile;const powerPreference=this.integratedProfile?"low-power":"high-performance";
    const context=this.canvas.getContext("webgl2",{alpha:false,antialias,powerPreference});
    if(!context)throw new Error("WebGL2 is unavailable");
    this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,context,antialias,powerPreference});
    this.renderer.setPixelRatio(this.integratedProfile ? .65 : Math.min(devicePixelRatio,1.5));this.renderer.shadowMap.enabled=!this.integratedProfile;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.78;
    this.scene.background=new THREE.Color("#071012");this.scene.fog=new THREE.FogExp2("#26383a",.018);
    this.canvas.addEventListener("webglcontextlost",this.onContextLost,false);
  }

  private buildAtmosphere() {
    const hemisphere=new THREE.HemisphereLight("#8ba3a1","#111517",1.55);this.scene.add(hemisphere);
    const moon=new THREE.DirectionalLight("#b9c7c4",3.1);moon.position.set(16,62,14);moon.target.position.set(48,0,48);moon.castShadow=!this.integratedProfile;moon.shadow.mapSize.set(2048,2048);moon.shadow.camera.left=-48;moon.shadow.camera.right=48;moon.shadow.camera.top=48;moon.shadow.camera.bottom=-48;moon.shadow.bias=-.00025;this.scene.add(moon,moon.target);
    this.rain=new RainField(this.integratedProfile?240:1800);this.scene.add(this.rain);
  }

  private ensureActors(snapshot: LegacySnapshot) {
    if(!this.playerRig){this.playerRig=new PilgrimRig("player");this.scene.add(this.playerRig);}
    for(const npc of snapshot.npcs.filter((entry)=>entry.regionId==="hearthmere"))if(!this.npcRigs.has(npc.id)){const variant=npc.id==="maela_voss"?"maela":npc.id==="torren_vale"?"torren":"ysra";const rig=new PilgrimRig(variant);rig.name=`npc:${npc.id}`;this.npcRigs.set(npc.id,rig);this.scene.add(rig);}
    const authoritativeEnemies=this.options.network?.connected?this.options.network.serverEnemies:null;const enemies=authoritativeEnemies??snapshot.enemies.filter((entry)=>entry.definition?.regions?.includes("hearthmere")||entry.definition?.regionIds?.includes("hearthmere")||entry.homeX<12&&entry.homeY<12);for(const enemy of enemies){const enemyId=enemy.id??enemy.uid;if(!enemyId||this.enemyRigs.has(enemyId))continue;const rig=createEnemyRig(enemy.definitionId??enemy.defId);this.enemyRigs.set(enemyId,rig);this.scene.add(rig);}
  }

  private syncActors(snapshot: LegacySnapshot, delta: number) {
    this.ensureActors(snapshot);if(!this.playerRig)return;
    const networkLocal=this.options.network?.localActor;const playerPosition=networkLocal?new THREE.Vector3(networkLocal.transform.x,networkLocal.transform.y,networkLocal.transform.z):tileToWorld(snapshot.player.x,snapshot.player.y);const speed=playerPosition.distanceTo(this.previousPlayer)/Math.max(delta,.001);const heading=networkLocal?.transform.yaw??Math.atan2(playerPosition.x-this.previousPlayer.x,playerPosition.z-this.previousPlayer.z);
    this.playerRig.position.copy(playerPosition);this.playerRig.update(delta,speed,snapshot.player.attackCooldown,heading);this.previousPlayer.copy(playerPosition);
    this.debug.player={tile:[snapshot.player.x,snapshot.player.y],world:[playerPosition.x,playerPosition.y,playerPosition.z]};
    const localRigData=networkLocal?rigDataFromAppearanceV2(networkLocal.appearance):{character:snapshot.character,silhouette:snapshot.silhouette};const signature=networkLocal?`${networkLocal.appearanceSignature}|${networkLocal.appearanceJson}|${networkLocal.equipmentVisualIds.join("|")}`:JSON.stringify(snapshot.silhouette);if(signature!==this.lastAppearanceSignature){this.playerRig.applyAppearance(localRigData.character,localRigData.silhouette);if(networkLocal)this.playerRig.applyEquipment(networkLocal.equipmentVisualIds);this.lastAppearanceSignature=signature;this.debug.appearance=this.playerRig.debugAppearance();}
    for(const npc of snapshot.npcs.filter((entry)=>this.npcRigs.has(entry.id))){const rig=this.npcRigs.get(npc.id)!;rig.position.copy(tileToWorld(npc.position.x,npc.position.y));rig.applyAppearance(snapshot.character,npcSilhouette(snapshot.silhouette,npc.id));rig.update(delta,0,0,0);}
    const liveEnemyIds=new Set<string>();const enemyStates:Record<string,{hp:number;maxHp:number;visible:boolean;locomotion:string}>={};if(this.options.network?.connected){for(const enemy of this.options.network.serverEnemies){const rig=this.enemyRigs.get(enemy.id);if(!rig)continue;liveEnemyIds.add(enemy.id);rig.visible=enemy.hp>0&&enemy.locomotion!=="dead";const position=new THREE.Vector3(enemy.transform.x,enemy.transform.y,enemy.transform.z);const movement=position.distanceTo(rig.position);rig.position.lerp(position,Math.min(1,delta*12));if(movement>.01)rig.rotation.y=Math.atan2(position.x-rig.position.x,position.z-rig.position.z);rig.rotation.z=Math.sin(this.elapsed*4)*.025;enemyStates[enemy.id]={hp:enemy.hp,maxHp:enemy.maxHp,visible:rig.visible,locomotion:enemy.locomotion};}}else{for(const enemy of snapshot.enemies){const enemyId=enemy.id??enemy.uid;if(!enemyId)continue;const rig=this.enemyRigs.get(enemyId);if(!rig)continue;liveEnemyIds.add(enemyId);rig.visible=!enemy.dead;const position=tileToWorld(enemy.x,enemy.y);const movement=position.distanceTo(rig.position);rig.position.lerp(position,Math.min(1,delta*12));if(movement>.01)rig.rotation.y=Math.atan2(position.x-rig.position.x,position.z-rig.position.z);rig.rotation.z=Math.sin(this.elapsed*4+enemy.level)*.025;enemyStates[enemyId]={hp:enemy.hp,maxHp:enemy.maxHp,visible:rig.visible,locomotion:enemy.dead?"dead":"idle"};}}for(const [id,rig] of this.enemyRigs)if(!liveEnemyIds.has(id))rig.visible=false;this.debug.enemyStates=enemyStates;
    const remoteIds=new Set<string>();const remoteAppearances:Record<string,unknown>={};const remoteActorStates:Record<string,{world:[number,number,number]}>={};for(const actor of this.options.network?.remoteActors??[]){remoteIds.add(actor.sessionId);let rig=this.remotePlayerRigs.get(actor.sessionId);if(!rig){rig=new PilgrimRig("player");this.remotePlayerRigs.set(actor.sessionId,rig);this.scene.add(rig);}const visualSignature=`${actor.appearanceSignature}|${actor.appearanceJson}|${actor.equipmentVisualIds.join("|")}`;if(rig.userData.appearanceSignature!==visualSignature){const remoteRigData=rigDataFromAppearanceV2(actor.appearance);rig.applyAppearance(remoteRigData.character,remoteRigData.silhouette);rig.applyEquipment(actor.equipmentVisualIds);rig.userData.appearanceSignature=visualSignature;}remoteAppearances[actor.sessionId]=rig.debugAppearance();const position=new THREE.Vector3(actor.transform.x,actor.transform.y,actor.transform.z);const remoteSpeed=position.distanceTo(rig.position)/Math.max(delta,.001);rig.position.lerp(position,Math.min(1,delta*10));rig.update(delta,remoteSpeed,0,actor.transform.yaw);remoteActorStates[actor.sessionId]={world:[rig.position.x,rig.position.y,rig.position.z]};}for(const [id,rig] of this.remotePlayerRigs)if(!remoteIds.has(id)){this.scene.remove(rig);this.remotePlayerRigs.delete(id);}this.debug.remoteAppearances=remoteAppearances;this.debug.remoteActorStates=remoteActorStates;
    this.debug.actorCount=1+this.npcRigs.size+liveEnemyIds.size+remoteIds.size;this.target.lerp(playerPosition.clone().add(new THREE.Vector3(0,1.05,0)),1-Math.exp(-delta*8));
  }

  private updateCamera(delta:number) {
    const horizontal=Math.cos(this.cameraPitch)*this.cameraDistance;const desired=new THREE.Vector3(this.target.x+Math.sin(this.cameraYaw)*horizontal,this.target.y+Math.sin(this.cameraPitch)*this.cameraDistance,this.target.z+Math.cos(this.cameraYaw)*horizontal);this.camera.position.lerp(desired,1-Math.exp(-delta*10));this.camera.lookAt(this.target);
    if(this.sceneBuild){const direction=this.camera.position.clone().sub(this.target);this.raycaster.set(this.target,direction.clone().normalize());this.raycaster.far=direction.length();this.applyOccluderFades(this.raycaster.intersectObjects(this.sceneBuild.occluders,true).map((hit)=>hit.object));}
  }

  private applyOccluderFades(objects: THREE.Object3D[]) {
    const desiredObjects=new Set(objects.filter((object):object is THREE.Mesh=>object instanceof THREE.Mesh));
    const desiredMaterials=new Set<THREE.Material>();
    for(const object of desiredObjects)for(const material of Array.isArray(object.material)?object.material:[object.material])desiredMaterials.add(material);
    for(const [material,state] of this.fadedMaterials)if(!desiredMaterials.has(material)){material.transparent=state.transparent;material.opacity=state.opacity;material.depthWrite=state.depthWrite;material.depthTest=state.depthTest;material.needsUpdate=true;this.fadedMaterials.delete(material);}
    for(const material of desiredMaterials)if(!this.fadedMaterials.has(material)){this.fadedMaterials.set(material,{transparent:material.transparent,opacity:material.opacity,depthWrite:material.depthWrite,depthTest:material.depthTest});material.transparent=true;material.opacity=.24;material.depthWrite=false;material.depthTest=true;material.needsUpdate=true;}
    for(const [object,renderOrder] of this.fadedObjects)if(!desiredObjects.has(object)){object.renderOrder=renderOrder;this.fadedObjects.delete(object);}
    for(const object of desiredObjects)if(!this.fadedObjects.has(object)){this.fadedObjects.set(object,object.renderOrder);object.renderOrder=10;}
  }

  private restoreOccluderFades() {
    for(const [material,state] of this.fadedMaterials){material.transparent=state.transparent;material.opacity=state.opacity;material.depthWrite=state.depthWrite;material.depthTest=state.depthTest;material.needsUpdate=true;}
    this.fadedMaterials.clear();
    for(const [object,renderOrder] of this.fadedObjects)object.renderOrder=renderOrder;
    this.fadedObjects.clear();
  }

  private frame=(now:number)=>{
    if(this.disposed||!this.renderer)return;const frameTime=now-this.lastFrame;const delta=Math.min(.05,frameTime/1000);this.lastFrame=now;this.elapsed+=delta;this.frameSamples.push(frameTime);if(this.frameSamples.length>600)this.frameSamples.shift();const snapshot=this.options.snapshot();const shell=document.querySelector("#game-shell");
    // A connected HearthmereRoom owns the whole 96 m shard. Its metre-space
    // coordinates must not be reclassified through the overlapping legacy
    // tile regions or input can be disabled while authority remains connected.
    const sceneOwnedByAuthority=this.options.network?.connected===true;const hearthmereVisible=snapshot.hudVisible&&(sceneOwnedByAuthority||snapshot.regionId==="hearthmere")&&this.debug.mode==="webgl3d";this.interactionEnabled=hearthmereVisible&&snapshot.active&&document.visibilityState==="visible"&&document.hasFocus();this.options.network?.setInputEnabled(this.interactionEnabled);
    this.canvas.hidden=!hearthmereVisible;shell?.classList.toggle("webgl-active",hearthmereVisible);
    if(hearthmereVisible){this.syncActors(snapshot,delta);this.updateCamera(delta);this.rain?.update(delta,.18);for(const animate of this.sceneBuild?.animated??[])animate(delta,this.elapsed);this.renderer.render(this.scene,this.camera);const info=this.renderer.info;this.debug.rendererInfo=Object.freeze({render:Object.freeze({calls:info.render.calls,triangles:info.render.triangles,points:info.render.points,lines:info.render.lines}),memory:Object.freeze({geometries:info.memory.geometries,textures:info.memory.textures})});this.debug.frameCount++;if(!this.debug.ready&&this.debug.frameCount>1){this.debug.ready=true;dispatchEvent(new CustomEvent("world-renderer-ready",{detail:this.debug}));}}else this.restoreOccluderFades();
    if(this.debug.frameCount%60===0)this.updateMetrics();this.debug.camera={yaw:this.cameraYaw,pitch:this.cameraPitch,distance:this.cameraDistance};if(!this.disposed)this.frameHandle=requestAnimationFrame(this.frame);
  };

  private updateMetrics(){const sorted=[...this.frameSamples].sort((a,b)=>a-b);const at=(fraction:number)=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*fraction))]??0;this.debug.performance={p50:at(.5),p95:at(.95),longFrames:sorted.filter(value=>value>50).length,sampleCount:sorted.length};}

  private bindInput(){addEventListener("resize",this.resize);this.canvas.addEventListener("contextmenu",this.preventContextMenu);this.canvas.addEventListener("pointerdown",this.pointerDown);this.canvas.addEventListener("pointermove",this.pointerMove);this.canvas.addEventListener("pointerup",this.pointerUp);this.canvas.addEventListener("wheel",this.wheel,{passive:false});}
  private pointerDown=(event:PointerEvent)=>{if(!this.interactionEnabled)return;this.canvas.focus({preventScroll:true});if(event.button===2||event.button===1){this.drag={x:event.clientX,y:event.clientY};this.canvas.setPointerCapture(event.pointerId);return;}if(event.button===0&&this.renderer){const bounds=this.canvas.getBoundingClientRect();this.pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-((event.clientY-bounds.top)/bounds.height)*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);const point=new THREE.Vector3();if(this.raycaster.ray.intersectPlane(plane,point))this.options.requestTravel(point.x,point.z);}};
  private pointerMove=(event:PointerEvent)=>{if(!this.drag)return;const dx=event.clientX-this.drag.x,dy=event.clientY-this.drag.y;this.cameraYaw-=dx*.006;this.cameraPitch=THREE.MathUtils.clamp(this.cameraPitch+dy*.004,THREE.MathUtils.degToRad(38),THREE.MathUtils.degToRad(58));this.drag={x:event.clientX,y:event.clientY};};
  private pointerUp=(event:PointerEvent)=>{if(this.drag){this.drag=null;this.canvas.releasePointerCapture(event.pointerId);}};
  private wheel=(event:WheelEvent)=>{event.preventDefault();this.cameraDistance=THREE.MathUtils.clamp(this.cameraDistance+event.deltaY*.012,8,20);};
  private preventContextMenu=(event:Event)=>event.preventDefault();
  private resize=()=>{if(!this.renderer)return;const width=innerWidth,height=innerHeight;this.renderer.setPixelRatio(this.integratedProfile ? .65 : Math.min(devicePixelRatio,1.5));this.renderer.setSize(width,height,false);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();};
  private onContextLost=()=>{this.debug.loadErrors.push("webgl_context_lost");this.debug.mode="canvas-fallback";this.debug.ready=false;this.canvas.hidden=true;document.querySelector("#game-shell")?.classList.remove("webgl-active");this.shutdown(false);dispatchEvent(new CustomEvent("world-renderer-failed",{detail:this.debug}));};

  projectTurnPosition(positionMm: IntegerPositionMm) {
    const bounds=this.canvas.getBoundingClientRect();
    const point=new THREE.Vector3(positionMm.x/1000,positionMm.y/1000,positionMm.z/1000).project(this.camera);
    return {x:(point.x+1)*bounds.width/2,y:(1-point.y)*bounds.height/2,visible:point.z>=-1&&point.z<=1&&point.x>=-1.12&&point.x<=1.12&&point.y>=-1.12&&point.y<=1.12};
  }

  private shutdown(releaseRenderer:boolean){if(this.disposed)return;this.disposed=true;this.interactionEnabled=false;cancelAnimationFrame(this.frameHandle);removeEventListener("resize",this.resize);this.canvas.removeEventListener("contextmenu",this.preventContextMenu);this.canvas.removeEventListener("pointerdown",this.pointerDown);this.canvas.removeEventListener("pointermove",this.pointerMove);this.canvas.removeEventListener("pointerup",this.pointerUp);this.canvas.removeEventListener("wheel",this.wheel);this.canvas.removeEventListener("webglcontextlost",this.onContextLost);this.restoreOccluderFades();this.sceneBuild?.dispose();this.rain?.geometry.dispose();this.rain?.material.dispose();if(releaseRenderer)this.renderer?.dispose();this.options.network?.setInputEnabled(false);const networkShutdown=this.options.network?.dispose();if(networkShutdown)void networkShutdown.catch((error)=>console.warn("Shared-world shutdown failed",error));document.querySelector("#game-shell")?.classList.remove("webgl-active");}

  dispose(){this.shutdown(true);}
}

export const WORLD_COORDINATES = Object.freeze({ metersPerLegacyTile:4, legacyOrigin:{x:0,y:0}, tileToWorld });
