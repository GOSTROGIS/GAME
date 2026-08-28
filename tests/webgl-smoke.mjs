import { resolve } from "node:path";
import { createServer as createViteServer } from "vite";
import { chromium } from "playwright";

const root = resolve(new URL("../", import.meta.url).pathname.replace(/^\/(\w:)/, "$1"));
const server = await createViteServer({ configFile: resolve(root, "apps/client/vite.config.ts"), configLoader: "runner", logLevel: "error", server: { host: "127.0.0.1", port: 0, strictPort: false } });
await server.listen();
const serverAddress = server.httpServer?.address();
if (!serverAddress || typeof serverAddress === "string") throw new Error("Vite smoke server did not expose a TCP port");
const baseUrl = `http://127.0.0.1:${serverAddress.port}`;

const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--use-angle=swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.setDefaultNavigationTimeout(90_000);
page.setDefaultTimeout(90_000);
const errors = [];
const bridgeRequests = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error" && !message.text().includes("fonts.googleapis")) errors.push(message.text()); });
page.on("request", (request) => { if (request.url().includes("/assets/3d/runtime/bridge/")) bridgeRequests.push(request.url()); });

await page.goto(`${baseUrl}/?renderer=webgl`, { waitUntil: "domcontentloaded" });
await page.locator("[data-action='new-game']").evaluate((element) => element.click());
await page.locator("#creator").waitFor({ state: "visible" });
for (let step = 0; step < 6; step += 1) await page.locator("[data-action='creator-next']").evaluate((element) => element.click());
await page.locator("#hud").waitFor({ state: "visible" });
try {
  // Cold TypeScript/Vite module evaluation plus the first SwiftShader scene build can
  // block the browser main thread long enough that a 20-second waiter expires even
  // though the renderer becomes ready before the page can service the timeout.
  await page.waitForFunction(() => window.__HOLLOW_MARCH_3D__?.ready === true, null, { timeout: 60_000 });
} catch (error) {
  console.error(JSON.stringify({ stage: "initial-webgl-ready", debug: await page.evaluate(() => window.__HOLLOW_MARCH_3D__ ?? null), errors }, null, 2));
  throw error;
}

const before = await page.evaluate(() => structuredClone(window.__HOLLOW_MARCH_3D__));
const baselineSave = await page.evaluate(() => localStorage.getItem("hollow-march-save-v1"));
const canvas = page.locator("#world-3d");
const bounds = await canvas.boundingBox();
if (!bounds) throw new Error("WebGL canvas has no visible bounds");
await page.mouse.move(bounds.x + bounds.width * .62, bounds.y + bounds.height * .55);
await page.mouse.down({ button: "right" });
await page.mouse.move(bounds.x + bounds.width * .72, bounds.y + bounds.height * .49, { steps: 5 });
await page.mouse.up({ button: "right" });
await page.waitForFunction((yaw) => Math.abs((window.__HOLLOW_MARCH_3D__?.camera.yaw ?? yaw) - yaw) > .05, before.camera.yaw);
await page.screenshot({ path: resolve(root, "tests/webgl-hearthmere.png") });
const after = await page.evaluate(() => structuredClone(window.__HOLLOW_MARCH_3D__));
const framebuffer = await page.evaluate(async () => {
  await new Promise((resolveFrame) => requestAnimationFrame(() => resolveFrame()));
  const canvas = document.querySelector("#world-3d");
  const gl = canvas?.getContext("webgl2");
  if (!canvas || !gl) return { available: false, uniqueColors: 0, litSamples: 0, samples: 0 };
  gl.finish();
  const pixels = new Uint8Array(canvas.width * canvas.height * 4);
  gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  const colors = new Set();
  let litSamples = 0;
  let samples = 0;
  const stepX = Math.max(1, Math.floor(canvas.width / 24));
  const stepY = Math.max(1, Math.floor(canvas.height / 16));
  for (let y = Math.floor(stepY / 2); y < canvas.height; y += stepY) {
    for (let x = Math.floor(stepX / 2); x < canvas.width; x += stepX) {
      const offset = (y * canvas.width + x) * 4;
      const red = pixels[offset] ?? 0, green = pixels[offset + 1] ?? 0, blue = pixels[offset + 2] ?? 0;
      colors.add(`${red},${green},${blue}`);
      if (red + green + blue > 18) litSamples += 1;
      samples += 1;
    }
  }
  return { available: true, uniqueColors: colors.size, litSamples, samples };
});
const canvasSnapshot = await canvas.evaluate((element) => ({ width: element.width, height: element.height, css: element.getBoundingClientRect().toJSON(), hidden: element.hidden }));
const startupBridgeRequestCount = bridgeRequests.length;
await page.locator("[data-panel='world']").click();
await page.locator("#reference-atlas-host").waitFor({ state: "visible" });
await page.waitForFunction(() => document.querySelector("#ecology-proof-host small")?.textContent?.includes("Active pack bridge.pack.hearthmere"), null, { timeout: 30_000 });
const activeBridgeEvidence = await page.locator("#ecology-proof-host small").textContent();
const proofSites = [
  ["Gloamharbor", "gloamharbor"], ["Warden Reed", "warden-reed"], ["Cairnmarket", "cairnmarket"],
  ["Hollow Abbey", "hollow-abbey"], ["Salt Watch", "salt-watch"], ["Ember Gate", "ember-gate"],
];
for (const [siteName, siteSlug] of proofSites) {
  await page.locator("#reference-atlas-host button").filter({ hasText: siteName }).click();
  await page.waitForFunction((slug) => document.querySelector("#ecology-proof-host small")?.textContent?.includes(`Active pack bridge.pack.${slug}`), siteSlug, { timeout: 30_000 });
  const stats = await page.evaluate(() => window.__SABLE_REACH_BRIDGE__);
  if (stats?.activeLeaseCount !== 1 || stats?.maximumObservedConcurrentLoads > 4) throw new Error(`Invalid active-site residency for ${siteName}: ${JSON.stringify(stats)}`);
}
const activeBridgeRequestCount = bridgeRequests.length;
for (const [siteName, siteSlug] of [["Hearthmere", "hearthmere"], ...proofSites]) {
  await page.locator("#reference-atlas-host button").filter({ hasText: siteName }).click();
  await page.waitForFunction((slug) => document.querySelector("#ecology-proof-host small")?.textContent?.includes(`Active pack bridge.pack.${slug}`), siteSlug, { timeout: 30_000 });
}
const cycledBridgeRequestCount = bridgeRequests.length;
await page.locator("[data-panel='world']").click();
await page.waitForFunction(() => window.__SABLE_REACH_BRIDGE__?.activeLeaseCount === 0);
const bridgeResidencyAfterClose = await page.evaluate(() => structuredClone(window.__SABLE_REACH_BRIDGE__));
await page.close();

const morphPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
morphPage.setDefaultNavigationTimeout(90_000);
morphPage.setDefaultTimeout(90_000);
morphPage.on("pageerror", (error) => errors.push(`morph:${error.message}`));
await morphPage.goto(`${baseUrl}/?renderer=webgl`, { waitUntil: "domcontentloaded" });
await morphPage.locator("[data-action='new-game']").evaluate((element) => element.click());
await morphPage.locator("[data-action='creator-next']").evaluate((element) => element.click());
await morphPage.locator("[data-action='creator-next']").evaluate((element) => element.click());
const morphSliderCount = await morphPage.locator("[data-morph]").count();
await morphPage.locator("[data-morph]").evaluateAll((inputs) => inputs.forEach((input) => { input.value = "1"; input.dispatchEvent(new Event("input", { bubbles: true })); }));
for (let step = 2; step < 6; step += 1) await morphPage.locator("[data-action='creator-next']").evaluate((element) => element.click());
await morphPage.waitForFunction(() => window.__HOLLOW_MARCH_3D__?.ready === true, null, { timeout: 45_000 });
const extremeAppearance = await morphPage.evaluate(() => structuredClone(window.__HOLLOW_MARCH_3D__?.appearance));
await morphPage.close();

const defaultMorphs = after.appearance?.morphObservables ?? {};
const extremeMorphs = extremeAppearance?.morphObservables ?? {};
const changedMorphs = Object.keys(defaultMorphs).filter((key) => Math.abs(defaultMorphs[key] - extremeMorphs[key]) > 0.00001);

const individualPage = await browser.newPage({ viewport: { width: 960, height: 600 } });
individualPage.setDefaultNavigationTimeout(90_000);
individualPage.setDefaultTimeout(90_000);
individualPage.on("pageerror", (error) => errors.push(`individual-morph:${error.message}`));
const individualMorphEffects = {};
let scarVisibleAtExtreme = false;
for (const morphKey of Object.keys(defaultMorphs)) {
  await individualPage.goto(`${baseUrl}/?renderer=webgl`, { waitUntil: "domcontentloaded" });
  await individualPage.evaluate(({ saveJson, key }) => {
    const save = JSON.parse(saveJson);
    save.character.appearance.morphs[key] = 1;
    localStorage.setItem("hollow-march-save-v1", JSON.stringify(save));
    document.querySelector("[data-action='continue']").hidden = false;
  }, { saveJson: baselineSave, key: morphKey });
  await individualPage.locator("[data-action='continue']").evaluate((element) => element.click());
  await individualPage.waitForFunction(() => window.__HOLLOW_MARCH_3D__?.ready === true, null, { timeout: 45_000 });
  const appearance = await individualPage.evaluate(() => structuredClone(window.__HOLLOW_MARCH_3D__?.appearance));
  individualMorphEffects[morphKey] = Math.abs((appearance?.morphObservables?.[morphKey] ?? 0) - defaultMorphs[morphKey]) > 0.00001;
  if (morphKey === "scarDepth") scarVisibleAtExtreme = appearance?.visibleScar === true && (appearance?.materials?.scarOpacity ?? 0) > 0;
}
await individualPage.close();

const regionPage = await browser.newPage({ viewport: { width: 960, height: 600 } });
regionPage.setDefaultNavigationTimeout(90_000);
regionPage.setDefaultTimeout(90_000);
regionPage.on("pageerror", (error) => errors.push(`region-handoff:${error.message}`));
await regionPage.goto(`${baseUrl}/?renderer=webgl`, { waitUntil: "domcontentloaded" });
await regionPage.evaluate((saveJson) => {
  const save = JSON.parse(saveJson);
  save.player.x = 4;
  save.player.y = 18;
  localStorage.setItem("hollow-march-save-v1", JSON.stringify(save));
  document.querySelector("[data-action='continue']").hidden = false;
}, baselineSave);
await regionPage.locator("[data-action='continue']").evaluate((element) => element.click());
await regionPage.locator("#hud").waitFor({ state: "visible" });
await regionPage.waitForTimeout(250);
const regionHandoff = await regionPage.evaluate(() => {
  const shell = document.querySelector("#game-shell");
  const webgl = document.querySelector("#world-3d");
  const legacy = document.querySelector("#world");
  const legacyStyle = getComputedStyle(legacy);
  return {
    webglHidden: webgl.hidden,
    shellWebglActive: shell.classList.contains("webgl-active"),
    legacyVisible: legacyStyle.display !== "none" && legacyStyle.visibility !== "hidden",
  };
});
await regionPage.close();

const fallbackPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
fallbackPage.setDefaultNavigationTimeout(90_000);
fallbackPage.setDefaultTimeout(90_000);
await fallbackPage.goto(`${baseUrl}/?renderer=webgl&forceWebglFailure=1`, { waitUntil: "domcontentloaded" });
await fallbackPage.evaluate((saveJson) => {
  localStorage.setItem("hollow-march-save-v1", saveJson);
  document.querySelector("[data-action='continue']").hidden = false;
}, baselineSave);
await fallbackPage.locator("[data-action='continue']").evaluate((element) => element.click());
await fallbackPage.waitForFunction(() => window.__HOLLOW_MARCH_3D__?.mode === "canvas-fallback");
const fallback = await fallbackPage.evaluate(() => ({ debug: structuredClone(window.__HOLLOW_MARCH_3D__), legacyVisible: getComputedStyle(document.querySelector("#world")).visibility !== "hidden", webglHidden: document.querySelector("#world-3d").hidden }));
await fallbackPage.close();

const morphKeys = Object.keys(after.appearance?.morphObservables ?? {});
const result = {
  mode: after.mode,
  ready: after.ready,
  frameCountAdvanced: after.frameCount > before.frameCount,
  sceneId: after.sceneId,
  actorCount: after.actorCount,
  visibleInstanceCount: after.visibleInstanceCount,
  morphObservableCount: morphKeys.length,
  morphObservablesFinite: Object.values(after.appearance?.morphObservables ?? {}).every(Number.isFinite),
  morphSliderCount,
  changedMorphCount: changedMorphs.length,
  individuallyMappedMorphCount: Object.values(individualMorphEffects).filter(Boolean).length,
  scarVisibleAtExtreme,
  cameraMoved: Math.abs(after.camera.yaw - before.camera.yaw) > .05,
  canvas: canvasSnapshot,
  loadErrors: after.loadErrors,
  fallbackWorked: fallback.debug.mode === "canvas-fallback" && fallback.legacyVisible && fallback.webglHidden && fallback.debug.loadErrors.length === 1,
  errors,
  framebuffer,
  regionHandoff,
  bridgeAssets: { startupBridgeRequestCount, activeBridgeRequestCount, cycledBridgeRequestCount, activeBridgeEvidence, residencyAfterClose: bridgeResidencyAfterClose },
};
const webglFailed = result.mode !== "webgl3d" || !result.ready || !result.frameCountAdvanced || result.sceneId !== "hearthmere.shard.96m.v1" || result.actorCount < 4 || result.visibleInstanceCount < 20 || result.morphObservableCount !== 16 || !result.morphObservablesFinite || result.morphSliderCount !== 16 || result.changedMorphCount !== 16 || result.individuallyMappedMorphCount !== 16 || !result.scarVisibleAtExtreme || !result.cameraMoved || result.canvas.hidden || result.loadErrors.length || !result.fallbackWorked || !framebuffer.available || framebuffer.uniqueColors < 8 || framebuffer.litSamples < 16 || !regionHandoff.webglHidden || regionHandoff.shellWebglActive || !regionHandoff.legacyVisible || startupBridgeRequestCount !== 0 || activeBridgeRequestCount !== 96 || cycledBridgeRequestCount !== 96 || !activeBridgeEvidence?.includes("Active pack bridge.pack.hearthmere") || bridgeResidencyAfterClose.activeLeaseCount !== 0 || bridgeResidencyAfterClose.gpuBytes > bridgeResidencyAfterClose.cacheLimitBytes || bridgeResidencyAfterClose.maximumObservedConcurrentLoads > 4 || errors.length;
console.log(JSON.stringify(result, null, 2));

await Promise.allSettled(browser.contexts().flatMap((context) => context.pages()).map((page) => page.evaluate(() => dispatchEvent(new Event("beforeunload")))));
const shutdownSession = await browser.newBrowserCDPSession();
void shutdownSession.send("Browser.close").catch(() => {});
void server.close();
process.exit(webglFailed ? 1 : 0);
