import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer as createViteServer } from "vite";
import { chromium } from "playwright";

const root = resolve(new URL("../../..", import.meta.url).pathname.replace(/^\/(\w:)/, "$1"));
const installedChrome = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const evidenceRoot = resolve(root, "test-results/turn-ui-browser");
const GLOBAL_TIMEOUT_MS = 60_000;
const SCENARIO_TIMEOUT_MS = 52_000;
let vite;
let browser;
let context;
let page;
let stage = "fixture-start";
let failure;
let cleanupFailure;
let browserShutdownFailed = false;
let scenarioTimer;
const browserEvents = [];
const hardStop = setTimeout(() => {
  console.error(`[turn-ui-browser] hard ${GLOBAL_TIMEOUT_MS}ms deadline exceeded at ${stage}`);
  process.exit(1);
}, GLOBAL_TIMEOUT_MS);

try {
  await rm(evidenceRoot, { recursive: true, force: true });
  const scenario = (async () => {
  stage = "vite-create";
  vite = await createViteServer({
    configFile: resolve(root, "apps/client/vite.config.ts"),
    configLoader: "runner",
    logLevel: "error",
    server: { host: "127.0.0.1", port: 0, strictPort: false },
  });
  stage = "vite-listen";
  await vite.listen();
  const address = vite.httpServer?.address();
  if (!address || typeof address === "string") throw new Error("Turn UI test Vite server has no TCP address");
  stage = "browser-launch";
  browser = await chromium.launch({
    headless: true,
    args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
    ...(existsSync(installedChrome) ? { executablePath: installedChrome } : {}),
  });
  context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
  page = await context.newPage();
  page.setDefaultTimeout(8_000);
  page.setDefaultNavigationTimeout(20_000);
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.stack ?? error.message));
  page.on("requestfailed", (request) => browserEvents.push({ type: "requestfailed", url: request.url(), error: request.failure()?.errorText ?? "unknown" }));
  page.on("response", (response) => { if (response.status() >= 400) browserEvents.push({ type: "http", url: response.url(), status: response.status() }); });
  await page.route("**/src/main.js", (route) => route.fulfill({ status: 200, contentType: "application/javascript", body: "// intentionally suppressed by the isolated turn UI fixture\n" }));
  stage = "document-navigation";
  const navigationSession = await context.newCDPSession(page);
  await withTimeout(navigationSession.send("Page.navigate", { url: `http://127.0.0.1:${address.port}/?renderer=canvas` }), 10_000, "fixture document navigation");
  await page.bringToFront();
  await page.waitForFunction(() => document.readyState === "interactive" || document.readyState === "complete", null, { polling: 100, timeout: 10_000 });

  stage = "ui-mount";
  await page.evaluate(async () => {
    const { mountTurnCombatUI } = await import("/apps/client/src/turn/TurnCombatUI.ts");
    const { TurnWorldProjectionCanvas } = await import("/apps/client/src/turn/TurnWorldProjection.ts");
    const host = document.querySelector("#turn-encounter");
    if (!(host instanceof HTMLElement)) throw new Error("missing turn encounter host");
    const hud = document.querySelector("#hud");
    if (!(hud instanceof HTMLElement)) throw new Error("missing production HUD ancestor");
    hud.hidden = false;
    const titleScreen = document.querySelector("#title-screen");
    if (titleScreen instanceof HTMLElement) titleScreen.hidden = true;
    const projectionCanvas = document.querySelector("#turn-world-projection");
    if (!(projectionCanvas instanceof HTMLCanvasElement)) throw new Error("missing turn projection canvas");
    const player = { actorId: "character.player", characterId: "player", team: "players", joinOrder: 0, initiative: 10, connected: true, reconnectDeadlineTick: null, ready: false, withdrawn: false, positionMm: { x: 0, y: 0, z: 0 }, health: 100, maxHealth: 100 };
    const ally = { ...player, actorId: "character.ally", characterId: "ally", joinOrder: 1, positionMm: { x: 500, y: 0, z: 0 } };
    const enemy = { actorId: "enemy.ash", characterId: null, team: "enemies", joinOrder: 2, initiative: 8, connected: true, reconnectDeadlineTick: null, ready: true, withdrawn: false, positionMm: { x: 2_000, y: 0, z: 0 }, health: 60, maxHealth: 60 };
    const enemySecond = { ...enemy, actorId: "enemy.second", joinOrder: 3, positionMm: { x: 2_500, y: 0, z: 500 } };
    const participant = { ...player, stamina: 100, maxStamina: 100, focus: 50, maxFocus: 50, activeTechniqueId: "technique.guard.shelter_step", quickItemId: "mending_draught", itemCharges: { mending_draught: 1 }, plan: null, reaction: null, lastAcknowledgedCommandId: null, eventCursor: 0 };
    const makeProjection = ({ mode = "participant", phase = "planning", round = 1, ready = false, events = [] } = {}) => {
      const local = mode === "spectator" ? null : { ...participant, ready };
      return {
        state: {
          version: 1,
          protocolVersion: 2,
          publicState: {
            encounterId: "encounter.browser",
            phase,
            round,
            revision: round + 1,
            leaderActorId: "character.player",
            leadershipRule: "join_order_then_character_id",
            participantLimit: 4,
            participants: [{ ...player, ready }, ally, enemy, enemySecond],
            spectatorActorIds: mode === "spectator" ? ["spectator.viewer"] : [],
            enemyIntents: [{ version: 1, actorId: "enemy.ash", actionId: "enemy.intent", target: { kind: "actor", actorIds: ["character.ally"] }, band: "standard", damageBand: [12, 16], statusIcons: ["ash_mark"], sensoryCue: "cloth draws inward", interruptRule: "stagger before standard", exactDamageKnown: false }],
            latestEventSequence: events.at(-1)?.sequence ?? 0,
          },
          viewerState: mode === "spectator"
            ? { mode, actorId: "spectator.viewer", characterId: "viewer", canPlan: false, canWithdraw: false, reconnectDeadlineTick: null }
            : { mode, actorId: "character.player", characterId: "player", canPlan: mode === "participant" && phase === "planning" && !ready, canWithdraw: mode === "participant" && phase === "planning", reconnectDeadlineTick: mode === "reconnecting" ? 1_800 : null },
          participantState: local,
        },
        events,
      };
    };
    const harness = {
      submissions: [],
      joins: [],
      withdrawals: 0,
      worldKeyEvents: 0,
      acknowledgement: null,
      makeProjection,
      controller: null,
      overlay: new TurnWorldProjectionCanvas(projectionCanvas),
    };
    harness.overlay.setProjector((position) => ({ x: 420 + position.x / 40, y: 280 + position.z / 40, visible: true }));
    harness.controller = mountTurnCombatUI(host, {
      submitPlan(request) { harness.submissions.push(structuredClone(request)); return true; },
      join(encounterId) { harness.joins.push(encounterId); return true; },
      withdraw() { harness.withdrawals += 1; return true; },
      getPlanAcknowledgement() { return harness.acknowledgement; },
      onProjectionChanged(projection, draft) { harness.overlay.update(projection, draft); },
    });
    addEventListener("keydown", (event) => { if (event.key.toLowerCase() === "w") harness.worldKeyEvents += 1; });
    harness.controller.update(makeProjection());
    window.__TURN_UI_BROWSER_TEST__ = harness;
  });

  const host = page.locator("#turn-encounter");
  await host.waitFor({ state: "visible" });
  const tokenParity = await page.evaluate(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    const firstAction = getComputedStyle(document.querySelector("#turn-action-choices button"));
    return {
      ink: rootStyle.getPropertyValue("--ink").trim(),
      display: rootStyle.getPropertyValue("--display").trim(),
      space1: rootStyle.getPropertyValue("--space-1").trim(),
      grainStep: rootStyle.getPropertyValue("--grain-step").trim(),
      actionMinHeight: firstAction.minHeight,
    };
  });
  assert.deepEqual(tokenParity, { ink: "#080b0d", display: "Cinzel, Georgia, serif", space1: "4px", grainStep: "0.28s", actionMinHeight: "78px" }, "production computed styles must match all four token-sheet contracts");
  stage = "equipped-action-loadout";
  const techniqueButton = page.getByRole("button", { name: /Shelter Step/ });
  await techniqueButton.click();
  assert.equal(await page.locator("#turn-targets [data-turn-target]").count(), 1, "allied technique targeting must exclude hostile actors");
  assert.match(await page.locator("#turn-targets [data-turn-target]").first().textContent(), /ally/i);
  const quickItem = page.getByRole("button", { name: /Mending Draught/ });
  assert.notEqual(await quickItem.getAttribute("aria-disabled"), "true", "authenticated charged quick item must be available");
  await quickItem.click();
  assert.match(await page.locator("#turn-targets").textContent(), /self/i, "self item must not request an actor target");
  stage = "keyboard-planning";
  await page.getByRole("button", { name: /Move/ }).focus();
  await page.keyboard.press("w");
  assert.equal(await page.evaluate(() => window.__TURN_UI_BROWSER_TEST__.worldKeyEvents), 0, "active encounter must suppress world keys even while a planner button is focused");
  await page.locator("#turn-encounter-title").focus();
  await page.keyboard.press("1");
  await page.keyboard.press("v");
  await page.locator('#turn-targets [data-turn-direction="east"]').focus();
  await page.keyboard.press("Enter");
  await page.locator('#turn-reactions [data-turn-direction="west"]').focus();
  await page.keyboard.press("Enter");
  const destinations = await page.evaluate(() => { const draft = window.__TURN_UI_BROWSER_TEST__.controller.draft(); return { move: draft.beats[0].destinationMm, dodge: draft.reactionDestinationMm }; });
  assert.deepEqual(destinations, { move: { x: 4_000, y: 0, z: 0 }, dodge: { x: -3_000, y: 0, z: 0 } }, "move and dodge destination controls must remain independent");
  await page.locator("#turn-encounter-title").focus();
  await page.keyboard.press("2");
  await page.keyboard.press("]");
  await page.keyboard.press("7");
  await page.keyboard.press("g");
  const secondTarget = page.getByRole("button", { name: /enemy · second/ });
  await page.keyboard.press("[");
  await secondTarget.focus();
  await page.keyboard.press("Enter");
  await page.locator("#turn-encounter-title").focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");

  const submitted = await page.evaluate(() => window.__TURN_UI_BROWSER_TEST__.submissions);
  assert.equal(submitted.length, 1, "a pending plan cannot be submitted twice");
  assert.deepEqual(submitted[0].actions.map(({ actionDefinitionId, beat, targetActorId }) => ({ actionDefinitionId, beat, targetActorId })), [
    { actionDefinitionId: "action.light_attack", beat: 0, targetActorId: "enemy.second" },
    { actionDefinitionId: "action.hold", beat: 1, targetActorId: undefined },
  ]);
  assert.equal(submitted[0].reaction.reactionDefinitionId, "reaction.guard");
  assert.equal(await page.locator("#turn-confirm").textContent(), "Awaiting server");
  await page.waitForFunction(() => {
    const canvas = document.querySelector("#turn-world-projection");
    const context = canvas?.getContext("2d");
    return Boolean(context && context.getImageData(0, 0, canvas.width, canvas.height).data.some((channel, index) => index % 4 === 3 && channel > 0));
  });

  stage = "plan-acknowledgement";
  await page.evaluate(() => {
    const harness = window.__TURN_UI_BROWSER_TEST__;
    const request = harness.submissions[0];
    harness.acknowledgement = { protocolVersion: 2, encounterId: request.encounterId, characterId: request.characterId, commandId: request.commandId, round: request.round, revision: request.revision, accepted: true, planHash: "a".repeat(64) };
    harness.controller.update(harness.makeProjection());
  });
  assert.equal(await page.locator("#turn-confirm").textContent(), "Plan committed");
  assert.equal(await page.locator("#turn-confirm").isDisabled(), true);

  stage = "ready-state";
  await page.evaluate(() => {
    const harness = window.__TURN_UI_BROWSER_TEST__;
    harness.controller.update(harness.makeProjection({ round: 2, ready: true }));
  });
  await page.waitForFunction(() => document.querySelector("#turn-encounter")?.getAttribute("data-turn-state") === "ready");

  stage = "withdrawal";
  await page.evaluate(() => {
    const harness = window.__TURN_UI_BROWSER_TEST__;
    harness.acknowledgement = null;
    harness.controller.update(harness.makeProjection({ round: 3 }));
  });
  assert.equal(await page.getByRole("button", { name: /Mending Draught/ }).isEnabled(), true, "equipped item remains available on a fresh planning round");
  const withdraw = page.locator("#turn-withdraw");
  await withdraw.focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => window.__TURN_UI_BROWSER_TEST__.withdrawals), 1, "withdraw must be keyboard operable");

  stage = "resolution-log";
  await page.evaluate(() => {
    const harness = window.__TURN_UI_BROWSER_TEST__;
    const events = [
      { version: 1, sequence: 1, encounterId: "encounter.browser", round: 3, beat: 0, band: "movement", type: "movement", actorId: "character.player", targetActorId: null, rootActionId: "root.move", data: {} },
      { version: 1, sequence: 2, encounterId: "encounter.browser", round: 3, beat: 0, band: "standard", type: "damage_applied", actorId: "character.player", targetActorId: "enemy.ash", rootActionId: "root.hit", data: { amount: 9 } },
    ];
    harness.controller.update(harness.makeProjection({ round: 3, phase: "resolving", events }));
  });
  await page.locator("#turn-encounter-title").focus();
  await page.keyboard.press("l");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "turn-resolution-log");
  assert.deepEqual(await page.locator("#turn-resolution-log li").evaluateAll((items) => items.map((item) => item.dataset.eventSequence)), ["1", "2"]);
  assert.match(await page.locator("#turn-live-summary").textContent(), /standard band.*damage/i);

  stage = "reduced-motion";
  await page.emulateMedia({ reducedMotion: "reduce" });
  const motion = await page.locator(".grain").evaluate((element) => ({ animation: getComputedStyle(element).animationDuration, transition: getComputedStyle(document.querySelector("#turn-confirm")).transitionDuration }));
  assert.ok(parseFloat(motion.animation) <= 0.00001 && parseFloat(motion.transition) <= 0.00001, `reduced motion must collapse cinematic timing: ${JSON.stringify(motion)}`);
  assert.deepEqual(await page.locator("#turn-resolution-log li").evaluateAll((items) => items.map((item) => item.dataset.eventSequence)), ["1", "2"], "reduced motion cannot reorder authoritative events");

  stage = "viewer-and-terminal-states";
  for (const [mode, phase, expected] of [["reconnecting", "planning", "reconnecting"], ["participant", "victory", "victory"], ["participant", "defeat", "defeat"]]) {
    await page.evaluate(({ mode, phase }) => { const harness = window.__TURN_UI_BROWSER_TEST__; harness.controller.update(harness.makeProjection({ mode, phase, round: 4 })); }, { mode, phase });
    assert.equal(await host.getAttribute("data-turn-state"), expected);
  }
  await page.evaluate(() => { const harness = window.__TURN_UI_BROWSER_TEST__; harness.controller.update(harness.makeProjection({ mode: "spectator", phase: "planning", round: 1 })); });
  assert.equal(await host.getAttribute("data-turn-state"), "spectator");
  assert.equal(await page.locator(".side-nav").evaluate((element) => element.inert), false, "spectators must retain realtime world controls");
  const join = page.locator("#turn-join");
  assert.equal(await join.isEnabled(), true, "a spectator may join during the first planning round while the party has capacity");
  await join.focus();
  await page.keyboard.press("Enter");
  assert.deepEqual(await page.evaluate(() => window.__TURN_UI_BROWSER_TEST__.joins), ["encounter.browser"], "join must be keyboard operable and use the projected authoritative encounter ID");
  assert.match(await join.textContent(), /joining/i);
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => window.__TURN_UI_BROWSER_TEST__.joins.length), 1, "a pending join cannot be submitted twice before server projection");
  await page.evaluate(() => { const harness = window.__TURN_UI_BROWSER_TEST__; harness.controller.update(harness.makeProjection({ mode: "spectator", phase: "planning", round: 2 })); });
  assert.equal(await join.isDisabled(), true, "joining closes after the first round locks");
  assert.match(await join.textContent(), /joining closed/i);
  const beforeSpectatorSubmit = await page.evaluate(() => window.__TURN_UI_BROWSER_TEST__.submissions.length);
  await page.locator("#turn-encounter-title").focus();
  await page.keyboard.press("w");
  assert.equal(await page.evaluate(() => window.__TURN_UI_BROWSER_TEST__.worldKeyEvents), 1, "spectator world key must reach the realtime input layer");
  await page.keyboard.press("2");
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => window.__TURN_UI_BROWSER_TEST__.submissions.length), beforeSpectatorSubmit, "spectator keyboard input cannot submit a plan");
  assert.deepEqual(pageErrors, []);
  await page.evaluate(() => { const harness = window.__TURN_UI_BROWSER_TEST__; harness.controller.destroy(); harness.overlay.destroy(); });
  stage = "scenario-complete";
  })();
  const deadline = new Promise((_, reject) => {
    scenarioTimer = setTimeout(() => reject(new Error(`Turn UI browser scenario exceeded ${SCENARIO_TIMEOUT_MS}ms at ${stage}`)), SCENARIO_TIMEOUT_MS);
  });
  await Promise.race([scenario, deadline]);
} catch (error) {
  failure = error instanceof Error ? error : new Error(String(error));
  console.error(`[turn-ui-browser] failed at ${stage}: ${failure.stack ?? failure.message}`);
  await mkdir(evidenceRoot, { recursive: true });
  await Promise.allSettled([
    page ? withTimeout(page.screenshot({ path: resolve(evidenceRoot, "failure.png"), fullPage: true }), 5_000, "failure screenshot") : Promise.resolve(),
    withTimeout(writeFile(resolve(evidenceRoot, "state.json"), `${JSON.stringify({ stage, error: failure.stack ?? failure.message, url: page?.url() ?? null, browserEvents }, null, 2)}\n`, "utf8"), 5_000, "state evidence"),
  ]);
} finally {
  clearTimeout(scenarioTimer);
  stage = "trace-stop";
  if (context) {
    try { await withTimeout(context.tracing.stop(failure ? { path: resolve(evidenceRoot, "trace.zip") } : undefined), 5_000, "trace stop"); }
    catch (error) { cleanupFailure ??= error instanceof Error ? error : new Error(String(error)); }
  }
  stage = "fixture-shutdown";
  const [browserResult, viteResult] = await Promise.allSettled([
    browser ? withTimeout(browser.close(), 5_000, "browser shutdown") : Promise.resolve(),
    vite ? withTimeout(vite.close(), 5_000, "Vite shutdown") : Promise.resolve(),
  ]);
  if (browserResult.status === "rejected") {
    browserShutdownFailed = true;
    console.warn(`[turn-ui-browser] assertions completed; host Chrome ignored graceful shutdown: ${browserResult.reason instanceof Error ? browserResult.reason.message : String(browserResult.reason)}`);
  }
  if (viteResult.status === "rejected") cleanupFailure ??= viteResult.reason instanceof Error ? viteResult.reason : new Error(String(viteResult.reason));
  clearTimeout(hardStop);
}

if (failure) throw failure;
if (cleanupFailure) throw cleanupFailure;
if (browserShutdownFailed) process.exit(0);

function withTimeout(promise, timeoutMs, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} exceeded ${timeoutMs}ms`)), timeoutMs); }),
  ]).finally(() => clearTimeout(timer));
}
