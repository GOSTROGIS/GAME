import { getWorldClientSnapshot, projectWorldMillimetersToCanvas, requestWorldTravel, setWorldAuthorityBridge } from "../../../src/main.js";
import type { SharedWorldClient } from "./network/SharedWorldClient";
import { normalizeAppearanceV2 } from "@hollow-march/shared";
import type { ReferenceAtlasController } from "./atlas/ReferenceAtlas";
import type { EcologyProofArenaController } from "./showcase/EcologyProofArena";

const canvas = document.querySelector<HTMLCanvasElement>("#world-3d");
const shell = document.querySelector<HTMLElement>("#game-shell");
const flags = new URLSearchParams(location.search);
const webglEnabled = flags.get("renderer") === "webgl";

if (!shell || (webglEnabled && !canvas)) throw new Error("Shared-world client requires #game-shell and WebGL mode requires #world-3d");

if (flags.get("assetLab") === "1") {
  const host = document.createElement("aside");
  host.id = "developer-asset-lab";
  shell.append(host);
  const { loadDeveloperAssetLab } = await import("./asset-lab/index.js");
  await loadDeveloperAssetLab(host, { catalogImporter: () => import("@hearthmere/content/bridge-catalog") });
}
const atlasHillshadeUrl = new URL("../../../tools/worldgen/generated/runtime/hillshade.webp", import.meta.url).href;
const loadAtlasRuntime = async () => {
  const [atlasContent, showcaseContent, atlasAdapter, atlasView, proofRuntime, proofArena] = await Promise.all([
    import("@hearthmere/content/atlas"),
    import("@hearthmere/content/showcases"),
    import("./atlas/AtlasManifestAdapter"),
    import("./atlas/ReferenceAtlas"),
    import("./showcase/EcologyProof"),
    import("./showcase/EcologyProofArena"),
  ]);
  return {
    atlas: atlasContent.SABLE_REACH_ATLAS,
    dropTables: showcaseContent.SHOWCASE_DROP_TABLES,
    ecologyProofPlan: proofRuntime.buildEcologyProofRuntimePlan(showcaseContent.SABLE_REACH_ECOLOGY_PROOF_ENCOUNTERS),
    adaptAtlas: atlasAdapter.adaptSableReachAtlasManifest,
    mountAtlas: atlasView.mountReferenceAtlas,
    mountArena: proofArena.mountEcologyProofArena,
  };
};
type AtlasRuntime = Awaited<ReturnType<typeof loadAtlasRuntime>>;
let atlasRuntimePromise: ReturnType<typeof loadAtlasRuntime> | null = null;
let atlasController: ReferenceAtlasController | null = null;
let ecologyArena: EcologyProofArenaController | null = null;
let atlasEpoch = 0;
const releaseAtlas = () => { atlasEpoch += 1; ecologyArena?.destroy(); ecologyArena = null; atlasController?.destroy(); atlasController = null; };
const renderEcologyProofSite = (runtime: AtlasRuntime, siteName: string, encounters: AtlasRuntime["ecologyProofPlan"]["entries"]) => {
  ecologyArena?.destroy(); ecologyArena = null;
  const host = document.querySelector<HTMLElement>("#ecology-proof-host");
  if (!host) return;
  host.replaceChildren();
  const title = document.createElement("h3"); title.textContent = `${siteName} ecology proofs`; host.append(title);
  if (!encounters.length) { const empty = document.createElement("p"); empty.textContent = "This atlas site has no family showcase encounter."; host.append(empty); return; }
  const buttons = document.createElement("div"); buttons.style.cssText = "display:flex;flex-wrap:wrap;gap:.45rem"; host.append(buttons);
  const arenaHost = document.createElement("div"); host.append(arenaHost);
  for (const entry of encounters) {
    const button = document.createElement("button"); button.type = "button"; button.className = "ghost"; button.textContent = entry.familyId.replaceAll("_", " ");
    button.addEventListener("click", () => {
      ecologyArena?.destroy();
      const drops = runtime.dropTables.find(({ creatureId }) => creatureId === entry.creatureId)?.entries.map(({ itemId }) => itemId.replaceAll("_", " ")) ?? entry.prototypeAssetId;
      ecologyArena = runtime.mountArena(arenaHost, entry, Array.isArray(drops) ? drops : [drops]);
    });
    buttons.append(button);
  }
  buttons.querySelector<HTMLButtonElement>("button")?.click();
};
const openAtlas = async () => {
  releaseAtlas();
  const epoch = atlasEpoch;
  const host = document.querySelector<HTMLElement>("#reference-atlas-host");
  if (!host) return;
  host.replaceChildren(Object.assign(document.createElement("p"), { textContent: "Loading atlas…" }));
  atlasRuntimePromise ??= loadAtlasRuntime();
  let runtime: AtlasRuntime;
  try { runtime = await atlasRuntimePromise; }
  catch (error) {
    atlasRuntimePromise = null;
    if (epoch === atlasEpoch && host.isConnected) host.replaceChildren(Object.assign(document.createElement("p"), { textContent: `Atlas unavailable: ${error instanceof Error ? error.message : "unknown error"}` }));
    return;
  }
  if (epoch !== atlasEpoch || !host.isConnected) return;
  atlasController = runtime.mountAtlas(host, runtime.adaptAtlas(runtime.atlas, {
    hillshadeUrl: atlasHillshadeUrl,
    staticMapUrl: atlasHillshadeUrl,
  }), {
    initialSiteId: "site.hearthmere",
    onSiteSelected: (site) => {
      const encounters = runtime.ecologyProofPlan.entries.filter((entry) => entry.siteId === site.id);
      renderEcologyProofSite(runtime, site.name, encounters);
      dispatchEvent(new CustomEvent("ecology-proof-site-selected", { detail: { site, encounters } }));
    },
  });
};
addEventListener("world-atlas-open", openAtlas);
addEventListener("world-panel-change", releaseAtlas);
let network: SharedWorldClient | undefined;
let removeDisconnectListener = () => {};
let disposeTurnInterface = () => {};
let setTurnProjector: (projector: import("./turn/TurnWorldProjection.js").TurnWorldProjector | null) => void = () => {};
let networkConnection: Promise<void> | null = null;
let networkAdmissionSettled = true;
const syncCanvasNetworkInput = () => {
  if (!webglEnabled && network?.connected) network.setInputEnabled(getWorldClientSnapshot().active);
};
if (flags.get("network") === "1") {
  try {
    const { resolveSharedWorldEndpoint, SharedWorldClient } = await import("./network/SharedWorldClient");
    network = new SharedWorldClient(resolveSharedWorldEndpoint(flags.get("server")));
    networkAdmissionSettled = false;
    setWorldAuthorityBridge({
      isConnected: () => network?.connected ?? false,
      getLocalActor: () => network?.localActor ?? null,
      getRegionId: () => "hearthmere",
      nearestTargetId: (kind: "light_attack" | "heavy_attack" | "dodge" | "interact") => network?.nearestTargetId(kind),
      requestAction: (kind: "light_attack" | "heavy_attack" | "dodge" | "interact", targetId?: string) => {
        if ((kind === "light_attack" || kind === "heavy_attack") && targetId && !network?.turnConsumesWorldInput) {
          const projection = network?.turnProjection;
          const projectedLeasedEnemy = projection?.state.viewerState.mode === "spectator"
            && projection.state.publicState.participants.some((participant) => participant.team === "enemies" && participant.actorId === targetId);
          if (projectedLeasedEnemy) return network?.joinTurnEncounter(projection.state.publicState.encounterId) ?? false;
          return network?.startTurnEncounter([targetId]) ?? false;
        }
        return network?.requestAction(kind, targetId) ?? false;
      },
    });
    removeDisconnectListener = network.onDisconnect(() => setWorldAuthorityBridge(null));
  } catch (error) {
    console.warn("Shared-world endpoint rejected; networking remains disabled", error);
  }
}

if (network) {
  const turnHost = document.querySelector<HTMLElement>("#turn-encounter");
  const projectionCanvas = document.querySelector<HTMLCanvasElement>("#turn-world-projection");
  if (!turnHost || !projectionCanvas) throw new Error("Turn runtime requires #turn-encounter and #turn-world-projection");
  const [{ mountTurnCombatUI }, { TurnWorldProjectionCanvas }] = await Promise.all([
    import("./turn/TurnCombatUI.js"),
    import("./turn/TurnWorldProjection.js"),
  ]);
  const worldProjection = new TurnWorldProjectionCanvas(projectionCanvas);
  worldProjection.setProjector(projectWorldMillimetersToCanvas);
  setTurnProjector = (projector) => worldProjection.setProjector(projector ?? projectWorldMillimetersToCanvas);
  const turnInterface = mountTurnCombatUI(turnHost, {
    submitPlan: (request) => network?.submitTurnPlan(request) ?? false,
    join: (encounterId) => network?.joinTurnEncounter(encounterId) ?? false,
    withdraw: () => network?.withdrawFromTurnEncounter() ?? false,
    getProtocolError: () => network?.lastTurnError ?? null,
    getPlanAcknowledgement: () => network?.lastTurnPlanAcknowledgement ?? null,
    onProjectionChanged: (projection, draft) => worldProjection.update(projection, draft),
  });
  const removeTurnListener = network.onTurnEncounter(turnInterface.update);
  disposeTurnInterface = () => { removeTurnListener(); turnInterface.destroy(); worldProjection.destroy(); };
}

// The explicit query only defers renderer construction; it grants no debug or
// authority capability. Keeping it build-mode agnostic lets the acceptance
// suite validate the deployable bundle instead of relying on a dev module graph.
const manualWebglStart = webglEnabled && flags.get("acceptanceWebglStart") === "manual";
let webglStartAllowed = !manualWebglStart;
let webglCharacterReady = !document.querySelector<HTMLElement>("#hud")?.hidden;
let worldStartupCancelled = false;
let worldStartup: Promise<void> | null = null;
let disposeWorld = () => {};

const maybeStartWebglWorld = () => {
  if (!webglEnabled || !canvas || !webglStartAllowed || !webglCharacterReady || !networkAdmissionSettled || worldStartupCancelled || worldStartup) return;
  worldStartup = (async () => {
    const { HearthmereWorld3D } = await import("./world/HearthmereWorld3D");
    if (worldStartupCancelled) return;
    const world = new HearthmereWorld3D(canvas, {
      snapshot: getWorldClientSnapshot,
      requestTravel: (x, z) => network?.connected ? network.requestTravel(x, z) : requestWorldTravel(x, z),
      loadScene: async () => {
        const { HEARTHMERE_SCENE } = await import("@hearthmere/content");
        return HEARTHMERE_SCENE;
      },
      ...(network ? { network } : {}),
    });
    shell.classList.add("webgl-capable");
    setTurnProjector((positionMm) => world.projectTurnPosition(positionMm));
    world.start();
    disposeWorld = () => world.dispose();
  })().catch((error) => {
    console.error("WebGL world failed to start", error);
    dispatchEvent(new CustomEvent("world-renderer-start-failed", { detail: { message: error instanceof Error ? error.message : String(error) } }));
  });
};

const markWebglCharacterReady = () => {
  webglCharacterReady = true;
  maybeStartWebglWorld();
};

const allowAcceptanceWebglStart = () => {
  if (!manualWebglStart) return;
  webglStartAllowed = true;
  maybeStartWebglWorld();
};

const connectSelectedCharacter = () => {
  if (!network || network.connected || networkConnection) return;
  const character = getWorldClientSnapshot().character;
  const appearance = normalizeAppearanceV2({ ...character?.appearance, originId: character?.origin });
  networkConnection = network.connect({ appearance })
    .then(() => {
      networkAdmissionSettled = true;
      syncCanvasNetworkInput();
      maybeStartWebglWorld();
    })
    .catch((error) => {
      networkAdmissionSettled = true;
      setWorldAuthorityBridge(null);
      console.warn("Shared-world server unavailable; using local compatibility authority", error);
      maybeStartWebglWorld();
    })
    .finally(() => {
      networkConnection = null;
    });
};
addEventListener("world-character-ready", connectSelectedCharacter);
addEventListener("world-character-ready", markWebglCharacterReady);
addEventListener("world-renderer-start-requested", allowAcceptanceWebglStart);
addEventListener("world-character-ready", syncCanvasNetworkInput);
addEventListener("world-panel-change", syncCanvasNetworkInput);
addEventListener("focus", syncCanvasNetworkInput);
document.addEventListener("visibilitychange", syncCanvasNetworkInput);
const canvasInputVisibilityObserver = !webglEnabled && network ? new MutationObserver(syncCanvasNetworkInput) : null;
for (const selector of ["#hud", "#dialogue", "#death-screen", "#panel"]) {
  const element = document.querySelector<HTMLElement>(selector);
  if (element && canvasInputVisibilityObserver) canvasInputVisibilityObserver.observe(element, { attributes: true, attributeFilter: ["hidden"] });
}
if (webglCharacterReady) {
  connectSelectedCharacter();
  maybeStartWebglWorld();
}

addEventListener("beforeunload", () => {
  worldStartupCancelled = true;
  removeEventListener("world-atlas-open", openAtlas);
  removeEventListener("world-panel-change", releaseAtlas);
  releaseAtlas();
  disposeTurnInterface();
  removeEventListener("world-character-ready", connectSelectedCharacter);
  removeEventListener("world-character-ready", markWebglCharacterReady);
  removeEventListener("world-renderer-start-requested", allowAcceptanceWebglStart);
  removeEventListener("world-character-ready", syncCanvasNetworkInput);
  removeEventListener("world-panel-change", syncCanvasNetworkInput);
  removeEventListener("focus", syncCanvasNetworkInput);
  document.removeEventListener("visibilitychange", syncCanvasNetworkInput);
  canvasInputVisibilityObserver?.disconnect();
  setWorldAuthorityBridge(null);
  removeDisconnectListener();
  disposeWorld();
  void network?.dispose();
}, { once: true });
