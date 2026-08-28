import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { createServer as reserveSocket } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { preview as createVitePreviewServer } from "vite";
import { chromium } from "playwright";

const root = resolve(new URL("../../..", import.meta.url).pathname.replace(/^\/(\w:)/, "$1"));
const collectEvidence = process.env.BROWSER_NETWORK_EVIDENCE === "1" || process.env.CI === "true";
const COLD_START_TIMEOUT_MS = collectEvidence ? 180_000 : 90_000;
const SCREENSHOT_TIMEOUT_MS = 45_000;
const TRACE_TIMEOUT_MS = 60_000;
const EVIDENCE_WRITE_TIMEOUT_MS = 20_000;
const hostedRenderAssertionTimeoutMs = collectEvidence ? 60_000 : null;
const movementAssertionTimeoutMs = hostedRenderAssertionTimeoutMs ?? 10_000;
const combatAssertionTimeoutMs = hostedRenderAssertionTimeoutMs ?? 8_000;
// SwiftShader is functional evidence, not a performance target. Hosted Windows
// can spend more than a minute constructing the first scene even after both
// network clients are admitted, so keep this cold renderer allowance separate
// from the 60-second network and action assertions. The exact frame/readiness
// condition remains unchanged and physical GPU approval remains false.
const renderReadinessTimeoutMs = collectEvidence ? 180_000 : 60_000;
const networkReadinessTimeoutMs = hostedRenderAssertionTimeoutMs ?? 25_000;
const browserViewport = collectEvidence ? { width: 920, height: 620 } : { width: 1280, height: 720 };
const evidenceRoot = collectEvidence
  ? resolve(root, "test-results/browser-network")
  : await mkdtemp(resolve(tmpdir(), "sable-reach-browser-network-"));
if (collectEvidence) {
  assert.equal(evidenceRoot, resolve(root, "test-results/browser-network"), "browser evidence cleanup must remain inside the fixed test-results directory");
  await rm(evidenceRoot, { recursive: true, force: true });
  await mkdir(evidenceRoot, { recursive: true });
}

const roomPort = await reservePort();
const roomUrl = `http://127.0.0.1:${roomPort}`;
const vite = await createVitePreviewServer({
  configFile: resolve(root, "apps/client/vite.config.ts"),
  configLoader: "runner",
  logLevel: "error",
  preview: {
    host: "127.0.0.1",
    port: 0,
    strictPort: false,
    proxy: {
      "/matchmake": {
        target: roomUrl,
        changeOrigin: false,
        ws: true,
      },
      "^/(?!assets/)[^/]+/[^/]+": {
        target: roomUrl,
        changeOrigin: false,
        ws: true,
      },
    },
  },
});
const viteAddress = vite.httpServer?.address();
if (!viteAddress || typeof viteAddress === "string") throw new Error("Browser network smoke Vite server has no TCP address");
const baseUrl = `http://127.0.0.1:${viteAddress.port}`;
const serverOutput = [];
const roomServer = spawn(process.execPath, ["apps/server/dist/index.js"], {
  cwd: root,
  env: {
    ...process.env,
    NODE_ENV: "development",
    PORT: String(roomPort),
    PUBLIC_ORIGIN: baseUrl,
    ALLOWED_ORIGINS: baseUrl,
    ALLOW_GUESTS: "true",
    ALLOW_ORIGINLESS_WEBSOCKETS: "false",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
roomServer.stdout.on("data", (chunk) => serverOutput.push(String(chunk)));
roomServer.stderr.on("data", (chunk) => serverOutput.push(String(chunk)));

let browser;
let first;
let second;
let failure;
const browserContexts = [];
const pages = [];
const errors = [];
const browserEvents = [];
const stateSnapshots = [];
const evidenceErrors = [];

try {
  await waitForHealth(`${roomUrl}/health/ready`, roomServer);
  browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    args: [
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows",
      "--disable-features=CalculateNativeWinOcclusion",
    ],
  });
  const firstContext = await createInstrumentedContext(browser, "first");
  first = await createInstrumentedPage(firstContext, "first", "webgl");
  const firstLaunchUrl = `${baseUrl}/?renderer=webgl&quality=integrated&network=1&acceptanceWebglStart=manual&server=${encodeURIComponent(baseUrl)}`;
  // Cold hosted Windows runners can starve a Vite module graph while a second
  // renderer context and trace are being created. Prove the first client booted
  // before allocating the Canvas peer; room admission remains a later barrier.
  await first.goto(firstLaunchUrl, { waitUntil: "commit", timeout: COLD_START_TIMEOUT_MS });
  await waitForDocumentReady(first);
  await waitForClientRuntimeReady(first);
  await recordStateSnapshot("first-client-runtime-ready");

  const secondContext = await createInstrumentedContext(browser, "second");
  second = await createInstrumentedPage(secondContext, "second", "canvas");
  const secondLaunchUrl = `${baseUrl}/?renderer=canvas&network=1&server=${encodeURIComponent(baseUrl)}`;
  await second.goto(secondLaunchUrl, { waitUntil: "commit", timeout: COLD_START_TIMEOUT_MS });
  await waitForDocumentReady(second);
  await waitForClientRuntimeReady(second);
  await recordStateSnapshot("both-client-runtimes-ready");

  // Admit one browser at a time. Concurrent creator completion starts two
  // SwiftShader renderers while both Colyseus seat reservations are pending,
  // which can starve the second handshake on a cold Windows runner.
  await first.bringToFront();
  await completeCreator(first, 1);
  await waitForNetworkConnected(first);
  await recordStateSnapshot("first-client-admitted");

  await second.bringToFront();
  await completeCreator(second, -1);
  await waitForNetworkConnected(second);
  await recordStateSnapshot("second-client-admitted");

  // Room membership remains an independent barrier after both seat handshakes.
  await recordStateSnapshot("network-connected");
  const connected = await joinedState();
  assert.ok(connected.first.network.roomId, "first client must expose a room ID");
  assert.equal(connected.second.network.roomId, connected.first.network.roomId, "both browser clients must join the same Hearthmere room");
  assert.notEqual(connected.second.network.sessionId, connected.first.network.sessionId, "browser clients must have distinct sessions");

  await Promise.all([
    waitForRoomPeer(first, connected.second.network.sessionId),
    waitForRoomPeer(second, connected.first.network.sessionId),
  ]);
  await recordStateSnapshot("shared-room-ready");

  // The acceptance gate deliberately keeps SwiftShader dormant until both
  // real browsers have consumed their seats and observed one another. This
  // makes shared-room admission independent from renderer readiness.
  const [admittedBeforeWebgl, rendererBeforeActivation] = await Promise.all([
    joinedState(),
    first.evaluate(() => ({
      hasWorldDebug: Object.hasOwn(window, "__HOLLOW_MARCH_3D__"),
      frameCount: window.__HOLLOW_MARCH_3D__?.frameCount ?? 0,
    })),
  ]);
  assert.equal(admittedBeforeWebgl.first.network.connected, true);
  assert.equal(admittedBeforeWebgl.second.network.connected, true);
  assert.equal(admittedBeforeWebgl.first.network.roomId, admittedBeforeWebgl.second.network.roomId);
  assert.equal(admittedBeforeWebgl.first.world, undefined, "manual acceptance gate must not start WebGL before shared-room admission");
  assert.equal(rendererBeforeActivation.hasWorldDebug, false, "manual acceptance gate must leave the renderer debug surface absent before activation");
  assert.equal(rendererBeforeActivation.frameCount, 0, "manual acceptance gate must render zero frames before activation");
  await first.bringToFront();
  await first.evaluate(() => dispatchEvent(new CustomEvent("world-renderer-start-requested")));
  await recordStateSnapshot("webgl-start-requested");

  // This acceptance path proves one functional WebGL client plus one real
  // Canvas browser peer. Only the WebGL client owns a 3D readiness barrier.
  await waitForWebGlReady(first);
  await recordStateSnapshot("webgl-client-ready");

  // The first 3D client must project the Canvas peer's network appearance.
  await waitForRemoteRig(first, connected.second.network.sessionId, -1);
  await recordStateSnapshot("webgl-remote-rig-ready");
  await captureScreenshots("shared-renderers-ready");

  const firstJoined = await first.evaluate(() => ({ network: structuredClone(window.__HOLLOW_MARCH_NETWORK__), world: structuredClone(window.__HOLLOW_MARCH_3D__) }));
  const secondJoined = await second.evaluate(() => ({ network: structuredClone(window.__HOLLOW_MARCH_NETWORK__) }));
  assert.equal(firstJoined.network.roomId, secondJoined.network.roomId);
  assert.equal(firstJoined.network.localActor.appearance.morphs.stature, 1);
  assert.equal(secondJoined.network.localActor.appearance.morphs.stature, -1);
  assert.equal(firstJoined.network.remoteActors[0].appearance.morphs.stature, -1);
  assert.equal(secondJoined.network.remoteActors[0].appearance.morphs.stature, 1);
  assert.equal(firstJoined.world.qualityProfile, "integrated", "hosted functional evidence must use the declared integrated quality profile");
  assert.ok(firstJoined.world.appearance.morphObservables.stature > 1, "positive stature must enlarge the live local rig");
  assert.ok(firstJoined.world.remoteAppearances[secondJoined.network.sessionId].morphObservables.stature < 1, "negative stature must shrink the live remote rig");

  // Keep WebGL alive as the rendering observer, but drive authority through
  // the lightweight Canvas peer so SwiftShader frame time cannot delay input.
  await waitForCanvasInputReady(second);
  await pulseMoveToAxis(second, "z", 25.5, 0.35, "cross legacy overlap boundary");
  const crossed = await second.evaluate(() => ({
    z: window.__HOLLOW_MARCH_NETWORK__.localActor.transform.z,
    inputSuppressed: window.__HOLLOW_MARCH_NETWORK__.inputsSuppressed,
    location: document.querySelector("#location-label")?.textContent,
    canvasHidden: document.querySelector("#world")?.hidden,
  }));
  assert.ok(crossed.z > 24.5, `cross-boundary pulse target must finish beyond z=24.5 (received ${crossed.z})`);
  assert.equal(crossed.location, "Hearthmere Hold");
  assert.equal(crossed.canvasHidden, false);
  assert.equal(crossed.inputSuppressed, false);
  const returned = await pulseMoveToAxis(second, "z", 18.5, 0.35, "return across legacy overlap boundary");
  assert.ok(returned.z < 20, `return pulse target must finish below z=20 (received ${returned.z})`);

  await pulseMoveToAxis(second, "z", 32, 0.35, "approach Ash Husk on z");
  const approached = await pulseMoveToAxis(second, "x", 24, 0.35, "approach Ash Husk on x");
  assert.ok(Math.hypot(approached.x - 24, approached.z - 32) < 2.5, "WASD pulses must finish inside the Ash Husk light-attack range");
  await waitForRemoteTransform(first, connected.second.network.sessionId, approached, 0.35);
  await recordStateSnapshot("webgl-observed-canvas-movement");

  await waitForCanvasInputReady(second);
  const healthBefore = await second.evaluate(() => Object.fromEntries(window.__HOLLOW_MARCH_NETWORK__.serverEnemies.map((enemy) => [enemy.id, enemy.hp])));
  const actionAckBefore = await second.evaluate(() => structuredClone(window.__HOLLOW_MARCH_NETWORK__.lastActionAck));
  const guestIdentity = await second.evaluate(() => window.__HOLLOW_MARCH_NETWORK__.authenticatedCharacterId);
  assert.equal(guestIdentity, null, "browser renderer peer intentionally remains an unauthenticated shared-world guest");
  await second.keyboard.press("f");
  try {
    await second.waitForTimeout(500);
    const guestCombatState = await second.evaluate(() => ({
      actionAck: structuredClone(window.__HOLLOW_MARCH_NETWORK__.lastActionAck),
      turnEncounterId: window.__HOLLOW_MARCH_NETWORK__.turnEncounterId,
      enemyHealth: Object.fromEntries(window.__HOLLOW_MARCH_NETWORK__.serverEnemies.map((enemy) => [enemy.id, enemy.hp])),
    }));
    assert.deepEqual(guestCombatState.actionAck, actionAckBefore, "guest combat input must not emit a legacy realtime command");
    assert.equal(guestCombatState.turnEncounterId, null, "guest combat input must not create an authenticated turn encounter");
    assert.deepEqual(guestCombatState.enemyHealth, healthBefore, "guest combat input must not mutate authoritative enemy health");
    await first.bringToFront();
    await first.waitForFunction((before) => Object.entries(before).every(([enemyId, hp]) => {
      const networkEnemy = window.__HOLLOW_MARCH_NETWORK__?.serverEnemies.find((entry) => entry.id === enemyId);
      const renderedEnemy = window.__HOLLOW_MARCH_3D__?.enemyStates?.[enemyId];
      return networkEnemy?.hp === hp && renderedEnemy?.hp === hp;
    }), healthBefore, { polling: 100, timeout: combatAssertionTimeoutMs });
  } catch (error) {
    await recordStateSnapshot("browser-turn-authority-rejection-failure");
    throw error;
  }
  const projectedHealth = await first.evaluate(() => Object.fromEntries(Object.entries(window.__HOLLOW_MARCH_3D__.enemyStates).map(([enemyId, enemy]) => [enemyId, enemy.hp])));
  assert.deepEqual(projectedHealth, healthBefore, "WebGL projection must preserve the authoritative no-damage result");
  assert.deepEqual(errors, []);
  await recordStateSnapshot("complete");
  await captureScreenshots("complete");

  console.log(JSON.stringify({
    rendererRoles: { first: "webgl", second: "canvas" },
    qualityProfile: firstJoined.world.qualityProfile,
    physicalGpuPerformanceApproved: false,
    roomId: firstJoined.network.roomId,
    connectedPlayers: firstJoined.network.remoteCount + 1,
    creatorMorphs: [firstJoined.network.localActor.appearance.morphs.stature, secondJoined.network.localActor.appearance.morphs.stature],
    remoteRigParity: true,
    crossedLegacyOverlapAtZ: crossed.z,
    canonicalRegionStayedVisible: crossed.location === "Hearthmere Hold" && !crossed.canvasHidden,
    returnedAcrossBoundary: true,
    guestCombatSuppressed: true,
    enemyHealthUnchanged: healthBefore,
    webglEnemyHealthParity: projectedHealth,
    errors,
  }, null, 2));
} catch (error) {
  failure = serializeError(error);
  try { await recordStateSnapshot("failure"); } catch (evidenceError) { reportEvidenceError("failure-state-snapshot", evidenceError); }
  try { await captureScreenshots("failure"); } catch (evidenceError) { reportEvidenceError("failure-screenshot", evidenceError); }
  console.error(JSON.stringify({
    failure,
    lastStateSnapshot: summarizeStateSnapshot(stateSnapshots.at(-1)),
    browserErrors: errors.slice(-20),
    recentBrowserEvents: browserEvents.slice(-20),
    evidenceErrors,
    serverOutputTail: serverOutput.join("").slice(-4_000),
  }, null, 2));
  throw error;
} finally {
  const evidenceTeardownFailures = [];
  if (browser) {
    const pageCloseResults = await Promise.allSettled(pages.map(({ page }) => closePageThroughDiagnosticSession(page)));
    pageCloseResults.forEach((result, index) => {
      if (result.status === "rejected") evidenceTeardownFailures.push(reportEvidenceError(`${pages[index].label}-diagnostic-page-close`, result.reason));
    });
    const diagnosticSessionResults = await Promise.allSettled(pages.map(({ page }) => detachDiagnosticSessionForPage(page)));
    diagnosticSessionResults.forEach((result, index) => {
      if (result.status === "rejected") evidenceTeardownFailures.push(reportEvidenceError(`${pages[index].label}-diagnostic-session-detach`, result.reason));
    });
    const traceResults = await Promise.allSettled(browserContexts.map(async ({ context, label, tracing }) => {
      if (!tracing) return;
      const tracePath = resolve(evidenceRoot, `${label}-trace.zip`);
      await withTimeout(context.tracing.stop({ path: tracePath }), TRACE_TIMEOUT_MS, `${label} trace finalization`);
      const traceStats = await withTimeout(stat(tracePath), EVIDENCE_WRITE_TIMEOUT_MS, `${label} trace validation`);
      assert.ok(traceStats.size > 0, `${label} trace must be nonempty`);
    }));
    traceResults.forEach((result, index) => {
      if (result.status === "rejected") evidenceTeardownFailures.push(reportEvidenceError(`${browserContexts[index].label}-trace`, result.reason));
    });
    const shutdownSession = await withTimeout(browser.newBrowserCDPSession(), 10_000, "browser shutdown session").catch(() => null);
    if (shutdownSession) await withTimeout(shutdownSession.send("Browser.close"), 15_000, "browser shutdown").catch((error) => console.error(`[browser-network cleanup] ${serializeError(error).message}`));
    else await withTimeout(browser.close(), 15_000, "browser shutdown").catch((error) => console.error(`[browser-network cleanup] ${serializeError(error).message}`));
  }
  await withTimeout(vite.close(), 15_000, "Vite shutdown").catch((error) => console.error(`[browser-network cleanup] ${serializeError(error).message}`));
  if (roomServer.exitCode === null) {
    roomServer.kill();
    await Promise.race([new Promise((resolveExit) => roomServer.once("exit", resolveExit)), new Promise((resolveTimeout) => setTimeout(resolveTimeout, 2_000))]);
  }
  try { await withTimeout(persistEvidence(), EVIDENCE_WRITE_TIMEOUT_MS, "evidence persistence"); } catch (error) { evidenceTeardownFailures.push(reportEvidenceError("persist-evidence", error)); }
  if (!failure && evidenceTeardownFailures.length) throw new AggregateError(evidenceTeardownFailures, "Browser acceptance passed but mandatory evidence collection failed");
}

async function createInstrumentedContext(browserHandle, label) {
  const context = await browserHandle.newContext({ viewport: browserViewport });
  // The production document deliberately owns its Google Fonts links, but this
  // acceptance test must remain deterministic on restricted runners. Stub only
  // the optional external stylesheet before navigation; all application,
  // Colyseus, Vite, and asset requests remain live and fully instrumented.
  await context.route("https://fonts.googleapis.com/**", async (route) => {
    browserEvents.push({
      at: new Date().toISOString(),
      page: label,
      type: "external-font-stub",
      method: route.request().method(),
      url: route.request().url(),
    });
    await route.fulfill({ status: 200, contentType: "text/css; charset=utf-8", body: "" });
  });
  const contextRecord = { context, label, tracing: false };
  browserContexts.push(contextRecord);
  if (collectEvidence) {
    await withTimeout(context.tracing.start({ screenshots: false, snapshots: false, sources: false }), TRACE_TIMEOUT_MS, `${label} trace startup`);
    contextRecord.tracing = true;
  }
  return context;
}

async function createInstrumentedPage(context, label, renderer) {
  const page = await context.newPage();
  const diagnosticSession = collectEvidence
    ? await withTimeout(context.newCDPSession(page), 10_000, `${label} diagnostic session startup`)
    : null;
  page.setDefaultNavigationTimeout(90_000);
  page.setDefaultTimeout(90_000);
  pages.push({ page, label, renderer, diagnosticSession });
  browserEvents.push({ at: new Date().toISOString(), page: label, type: "renderer-role", renderer });
  page.on("pageerror", (error) => {
    const entry = `${label}: ${error.message}`;
    errors.push(entry);
    browserEvents.push({ at: new Date().toISOString(), page: label, type: "pageerror", message: error.message, stack: error.stack ?? null });
  });
  page.on("console", (message) => {
    browserEvents.push({ at: new Date().toISOString(), page: label, type: `console.${message.type()}`, message: message.text() });
    if (message.type() === "error" && !message.text().includes("fonts.googleapis")) errors.push(`${label}: ${message.text()}`);
  });
  page.on("requestfailed", (request) => {
    const url = request.url();
    browserEvents.push({ at: new Date().toISOString(), page: label, type: "requestfailed", method: request.method(), url, error: request.failure()?.errorText ?? "unknown" });
    if (url.startsWith(baseUrl) || url.startsWith(roomUrl)) errors.push(`${label}: request failed ${request.method()} ${url}: ${request.failure()?.errorText ?? "unknown"}`);
  });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    browserEvents.push({ at: new Date().toISOString(), page: label, type: "http-error", method: response.request().method(), url: response.url(), status: response.status() });
  });
  return page;
}

async function waitForDocumentReady(page) {
  await page.bringToFront();
  await page.waitForFunction(() => document.readyState !== "loading", null, { polling: 100, timeout: COLD_START_TIMEOUT_MS });
}

async function waitForClientRuntimeReady(page) {
  await page.bringToFront();
  await page.waitForFunction(() => window.__HOLLOW_MARCH_NETWORK__ !== undefined, null, { polling: 100, timeout: COLD_START_TIMEOUT_MS });
  await page.locator("[data-action='new-game']").waitFor({ state: "visible", timeout: COLD_START_TIMEOUT_MS });
}

async function completeCreator(page, stature) {
  await page.locator("[data-action='new-game']").evaluate((element) => element.click());
  await page.locator("#creator").waitFor({ state: "visible" });
  await page.locator("[data-action='creator-next']").evaluate((element) => element.click());
  await page.locator("[data-action='creator-next']").evaluate((element) => element.click());
  await page.locator("[data-morph='stature']").evaluate((input, value) => { input.value = String(value); input.dispatchEvent(new Event("input", { bubbles: true })); }, stature);
  for (let step = 2; step < 6; step += 1) await page.locator("[data-action='creator-next']").evaluate((element) => element.click());
  await page.locator("#hud").waitFor({ state: "visible" });
}

async function waitForNetworkConnected(page) {
  await page.waitForFunction(() => {
    const network = window.__HOLLOW_MARCH_NETWORK__;
    return network?.phase === "failed" || (network?.connected === true
      && typeof network.roomId === "string"
      && typeof network.sessionId === "string"
      && network.localActor?.sessionId === network.sessionId);
  }, null, { polling: 100, timeout: networkReadinessTimeoutMs });
  const network = await page.evaluate(() => structuredClone(window.__HOLLOW_MARCH_NETWORK__));
  assert.notEqual(network.phase, "failed", `shared-world admission failed: ${network.lastConnectionError ?? "unknown error"}`);
  assert.equal(network.phase, "connected", "shared-world admission must reach the connected phase");
}

async function waitForRoomPeer(page, expectedSessionId) {
  await page.waitForFunction((peerSessionId) => {
    const network = window.__HOLLOW_MARCH_NETWORK__;
    return network?.remoteCount === 1 && network.remoteActors.some((actor) => actor.sessionId === peerSessionId);
  }, expectedSessionId, { polling: 100, timeout: networkReadinessTimeoutMs });
}

async function waitForCanvasInputReady(page) {
  await page.bringToFront();
  await page.waitForFunction(() => window.__HOLLOW_MARCH_NETWORK__?.connected === true && window.__HOLLOW_MARCH_NETWORK__.inputsSuppressed === false, null, { polling: 100, timeout: 25_000 });
}

async function waitForWebGlReady(page) {
  await page.bringToFront();
  await page.waitForFunction(() => {
    const world = window.__HOLLOW_MARCH_3D__;
    return world?.mode === "webgl3d" && world.ready === true && world.frameCount >= 2;
  }, null, { polling: 100, timeout: renderReadinessTimeoutMs });
}

async function waitForRemoteRig(page, expectedSessionId, expectedStature) {
  await page.bringToFront();
  await page.waitForFunction(({ peerSessionId, stature }) => {
    const remote = window.__HOLLOW_MARCH_3D__?.remoteAppearances?.[peerSessionId];
    const observable = remote?.morphObservables?.stature;
    if (!Number.isFinite(observable)) return false;
    return stature < 0 ? observable < 1 : observable > 1;
  }, { peerSessionId: expectedSessionId, stature: expectedStature }, { polling: 100, timeout: renderReadinessTimeoutMs });
}

async function waitForRemoteTransform(page, expectedSessionId, expectedTransform, tolerance) {
  await page.bringToFront();
  await page.waitForFunction(({ peerSessionId, transform, allowedError }) => {
    const remote = window.__HOLLOW_MARCH_3D__?.remoteActorStates?.[peerSessionId]?.world;
    return remote
      && Math.abs(remote[0] - transform.x) <= allowedError
      && Math.abs(remote[2] - transform.z) <= allowedError;
  }, { peerSessionId: expectedSessionId, transform: expectedTransform, allowedError: tolerance }, { polling: 100, timeout: renderReadinessTimeoutMs });
}

async function joinedState() {
  const [firstState, secondState] = await Promise.all([
    first.evaluate(() => ({ network: structuredClone(window.__HOLLOW_MARCH_NETWORK__), world: structuredClone(window.__HOLLOW_MARCH_3D__) })),
    second.evaluate(() => ({ network: structuredClone(window.__HOLLOW_MARCH_NETWORK__), world: structuredClone(window.__HOLLOW_MARCH_3D__) })),
  ]);
  return { first: firstState, second: secondState };
}

async function recordStateSnapshot(stage) {
  const captured = await Promise.all(pages.map(async ({ page, label, renderer }) => {
    if (page.isClosed()) return { page: label, renderer, closed: true };
    try {
      return await withTimeout(page.evaluate(({ pageLabel, rendererRole }) => ({
        page: pageLabel,
        renderer: rendererRole,
        closed: false,
        url: location.href,
        documentReadyState: document.readyState,
        visibilityState: document.visibilityState,
        hasFocus: document.hasFocus(),
        hudHidden: document.querySelector("#hud")?.hidden ?? null,
        webglHidden: document.querySelector("#world-3d")?.hidden ?? null,
        network: window.__HOLLOW_MARCH_NETWORK__ ? structuredClone(window.__HOLLOW_MARCH_NETWORK__) : null,
        world: window.__HOLLOW_MARCH_3D__ ? structuredClone(window.__HOLLOW_MARCH_3D__) : null,
      }), { pageLabel: label, rendererRole: renderer }), 45_000, `${label} state snapshot`);
    } catch (error) {
      return { page: label, renderer, closed: false, captureError: error instanceof Error ? error.message : String(error) };
    }
  }));
  stateSnapshots.push({ at: new Date().toISOString(), stage, pages: captured });
}

async function captureScreenshots(stage) {
  if (!collectEvidence) return;
  for (const { page, label, diagnosticSession } of pages) {
    if (page.isClosed()) continue;
    assert.ok(diagnosticSession, `${label} must retain its pre-navigation diagnostic session`);
    await withTimeout(page.bringToFront(), 10_000, `${label} screenshot foreground`);
    const result = await withTimeout(diagnosticSession.send("Page.captureScreenshot", { format: "png", fromSurface: false, captureBeyondViewport: false }), SCREENSHOT_TIMEOUT_MS, `${label} screenshot capture`);
    const bytes = Buffer.from(result.data, "base64");
    assert.ok(bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${label} screenshot must be a nonempty PNG`);
    await withTimeout(writeFile(resolve(evidenceRoot, `${label}-${stage}.png`), bytes), EVIDENCE_WRITE_TIMEOUT_MS, `${label} screenshot write`);
  }
}

async function detachDiagnosticSessionForPage(page) {
  const pageRecord = pages.find((entry) => entry.page === page);
  if (!pageRecord?.diagnosticSession) return;
  const session = pageRecord.diagnosticSession;
  await withTimeout(session.detach(), 10_000, `${pageRecord.label} diagnostic session detach`);
  pageRecord.diagnosticSession = null;
}

async function closePageThroughDiagnosticSession(page) {
  const pageRecord = pages.find((entry) => entry.page === page);
  if (!pageRecord || page.isClosed()) return;
  if (!collectEvidence) {
    await withTimeout(page.close(), 15_000, `${pageRecord.label} page close`);
    return;
  }
  assert.ok(pageRecord.diagnosticSession, `${pageRecord.label} active page must retain its diagnostic session for bounded target closure`);
  const session = pageRecord.diagnosticSession;
  await withTimeout(Promise.all([
    page.waitForEvent("close"),
    session.send("Page.close"),
  ]), 15_000, `${pageRecord.label} diagnostic page close`);
  pageRecord.diagnosticSession = null;
}

async function persistEvidence() {
  if (!collectEvidence) return;
  await Promise.all([
    writeFile(resolve(evidenceRoot, "state-snapshots.json"), `${JSON.stringify({ failure: failure ?? null, snapshots: stateSnapshots }, null, 2)}\n`, "utf8"),
    writeFile(resolve(evidenceRoot, "browser-events.json"), `${JSON.stringify({ errors, evidenceErrors, events: browserEvents }, null, 2)}\n`, "utf8"),
    writeFile(resolve(evidenceRoot, "server.log"), serverOutput.join(""), "utf8"),
  ]);
}

function reportEvidenceError(stage, error) {
  const normalized = error instanceof Error ? error : new Error(String(error));
  const entry = { at: new Date().toISOString(), stage, error: serializeError(normalized) };
  evidenceErrors.push(entry);
  console.error(`[browser-network evidence] ${stage}: ${normalized.stack ?? normalized.message}`);
  return normalized;
}

function serializeError(error) {
  return error instanceof Error ? { name: error.name, message: error.message, stack: error.stack ?? null } : { name: "UnknownError", message: String(error), stack: null };
}

function summarizeStateSnapshot(snapshot) {
  if (!snapshot) return null;
  return {
    at: snapshot.at,
    stage: snapshot.stage,
    pages: snapshot.pages.map((page) => ({
      page: page.page,
      renderer: page.renderer,
      closed: page.closed,
      documentReadyState: page.documentReadyState ?? null,
      connected: page.network?.connected ?? null,
      roomId: page.network?.roomId ?? null,
      remoteCount: page.network?.remoteCount ?? null,
      worldMode: page.world?.mode ?? null,
      worldReady: page.world?.ready ?? null,
      worldFrameCount: page.world?.frameCount ?? null,
      worldPerformance: page.world?.performance ?? null,
      captureError: page.captureError ?? null,
    })),
  };
}

async function withTimeout(promise, timeoutMs, label) {
  let timeoutHandle;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => { timeoutHandle = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs); }),
    ]);
  } finally {
    clearTimeout(timeoutHandle);
  }
}

async function pulseMoveToAxis(page, axis, target, tolerance, label) {
  const positiveKey = axis === "x" ? "d" : "s";
  const negativeKey = axis === "x" ? "a" : "w";
  const deadline = Date.now() + movementAssertionTimeoutMs;
  let pulse = 0;
  let lastObservedTransform = null;
  while (Date.now() < deadline) {
    const transformReadBudget = Math.min(10_000, Math.max(1, deadline - Date.now()));
    let transform;
    try {
      transform = await withTimeout(
        page.evaluate(() => structuredClone(window.__HOLLOW_MARCH_NETWORK__.localActor.transform)),
        transformReadBudget,
        `${label} replicated transform read`,
      );
    } catch (error) {
      const lastPosition = lastObservedTransform ? `${axis}=${lastObservedTransform[axis]}` : "no replicated transform observed";
      throw new Error(`Timed out trying to ${label}: ${lastPosition}; transform read failed: ${error instanceof Error ? error.message : error}`, { cause: error });
    }
    lastObservedTransform = transform;
    const delta = target - transform[axis];
    if (Math.abs(delta) <= tolerance) return transform;
    const key = delta > 0 ? positiveKey : negativeKey;
    const pulseDurationMs = Math.max(60, Math.min(300, Math.round((Math.abs(delta) - tolerance / 2) / 4.2 * 1_000)));
    const before = transform[axis];
    const token = `${axis}-${pulse += 1}-${Date.now()}`;
    try {
      await withTimeout(page.keyboard.down(key), Math.min(10_000, Math.max(1, deadline - Date.now())), `${label} pulse ${pulse} keydown`);
      await new Promise((resolvePulse) => setTimeout(resolvePulse, pulseDurationMs));
    } finally {
      await withTimeout(page.keyboard.up(key), Math.min(10_000, Math.max(1, deadline - Date.now())), `${label} pulse ${pulse} keyup`);
    }
    const observationBudget = Math.min(collectEvidence ? 15_000 : 3_000, Math.max(1, deadline - Date.now()));
    try {
      await page.waitForFunction(({ trackedAxis, prior, trackerToken }) => {
        const current = window.__HOLLOW_MARCH_NETWORK__?.localActor?.transform?.[trackedAxis];
        if (!Number.isFinite(current)) return false;
        const now = performance.now();
        const existing = window.__HOLLOW_MARCH_PULSE_TRACKER__;
        if (!existing || existing.token !== trackerToken) {
          window.__HOLLOW_MARCH_PULSE_TRACKER__ = { token: trackerToken, value: current, changedAt: now };
          return false;
        }
        if (Math.abs(current - existing.value) > 0.005) {
          existing.value = current;
          existing.changedAt = now;
        }
        return Math.abs(current - prior) > 0.01 && now - existing.changedAt >= 100;
      }, { trackedAxis: axis, prior: before, trackerToken: token }, { polling: 50, timeout: observationBudget });
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("Timeout")) throw error;
      if (Date.now() >= deadline) throw new Error(`Timed out trying to ${label}: ${error instanceof Error ? error.message : error}`);
    }
  }
  let finalTransform = lastObservedTransform;
  try {
    finalTransform = await withTimeout(
      page.evaluate(() => structuredClone(window.__HOLLOW_MARCH_NETWORK__.localActor.transform)),
      5_000,
      `${label} final replicated transform read`,
    );
  } catch (error) {
    const lastPosition = finalTransform ? `${axis}=${finalTransform[axis]}` : "no replicated transform observed";
    throw new Error(`Timed out trying to ${label}: ${lastPosition}; final transform read failed: ${error instanceof Error ? error.message : error}`, { cause: error });
  }
  throw new Error(`Timed out trying to ${label}: ${axis}=${finalTransform[axis]}, target=${target}±${tolerance}`);
}

async function reservePort() {
  const probe = reserveSocket();
  await new Promise((resolveListen, rejectListen) => probe.once("error", rejectListen).listen(0, "127.0.0.1", resolveListen));
  const address = probe.address();
  const selected = typeof address === "object" && address ? address.port : 0;
  await new Promise((resolveClose) => probe.close(resolveClose));
  return selected;
}

async function waitForHealth(url, processHandle) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null) throw new Error(`server exited with ${processHandle.exitCode}`);
    try { if ((await fetch(url)).ok) return; } catch { /* retry until deadline */ }
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }
  throw new Error("Timed out waiting for browser-network server readiness");
}
