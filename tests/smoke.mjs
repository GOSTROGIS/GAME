import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";

const root = normalize(new URL("../", import.meta.url).pathname.replace(/^\/(\w:)/, "$1"));
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webp": "image/webp", ".json": "application/json" };
const server = createServer(async (request, response) => {
  try {
    const requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    let file = normalize(join(root, requestPath === "/" ? "index.html" : requestPath));
    if (!file.startsWith(root)) throw new Error("Path outside root");
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    response.writeHead(200, { "content-type": mime[extname(file)] || "application/octet-stream" });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404); response.end("Not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const serverAddress = server.address();
if (!serverAddress || typeof serverAddress === "string") throw new Error("Legacy smoke server did not expose a TCP port");
const baseUrl = `http://127.0.0.1:${serverAddress.port}`;
const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error" && !message.text().includes("fonts.googleapis")) errors.push(message.text()); });
// Screenshots wait for document fonts. Keep this legacy smoke deterministic on
// hosted runners without depending on the public Google Fonts endpoint.
await page.route("https://fonts.googleapis.com/**", async (route) => {
  await route.fulfill({ status: 200, contentType: "text/css", body: "/* CI uses local font fallbacks. */" });
});

await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
await page.screenshot({ path: new URL("./title.png", import.meta.url).pathname.replace(/^\/(\w:)/, "$1") });
await page.locator("[data-action='new-game']").click();
await page.locator("#creator").waitFor({ state: "visible" });
await page.locator("[data-action='creator-next']").click();
await page.locator("[data-action='creator-next']").click();
await page.waitForTimeout(500);
await page.screenshot({ path: new URL("./creator.png", import.meta.url).pathname.replace(/^\/(\w:)/, "$1") });
for (let step = 2; step < 6; step += 1) await page.locator("[data-action='creator-next']").click();
await page.locator("#hud").waitFor({ state: "visible" });
await page.locator("#interaction-prompt").waitFor({ state: "visible" });
await page.waitForTimeout(500);
await page.screenshot({ path: new URL("./world-polish.png", import.meta.url).pathname.replace(/^\/(\w:)/, "$1") });
await page.keyboard.press("e");
await page.locator("#dialogue").waitFor({ state: "visible" });
await page.locator("[data-dialogue='leave']").click();
await page.keyboard.press("i");
await page.locator("[data-craft='unquenched_blade']").waitFor();
const storyRecipeVisible = await page.locator("[data-craft='unquenched_blade']").isVisible();
await page.keyboard.press("k");
await page.locator("#panel-title").filter({ hasText: "Skills" }).waitFor();
const skillTiles = await page.locator(".skill-tile").count();
await page.locator("[data-skill-detail='swordsmanship']").click();
await page.locator("[data-technique='swordsmanship.quiet_edge']").click();
const techniqueLearned = await page.locator("[data-technique-node='swordsmanship.quiet_edge']").evaluate((node) => node.classList.contains("learned"));
await page.keyboard.press("m");
await page.locator("#panel-title").filter({ hasText: "World atlas" }).waitFor();
const worldConcepts = await page.locator(".world-card img").count();
const atlasProofSites = await page.locator("[data-atlas-site]").count();
const atlasStaticVisible = await page.locator(".world-atlas-static img").isVisible();
await page.keyboard.press("b");
await page.locator("#panel-title").filter({ hasText: "Bestiary" }).waitFor();
const bestiaryEntries = await page.locator("[data-bestiary-entry]").count();
const placedBestiaryEntries = await page.locator("[data-bestiary-entry][data-content-status='placed']").count();
await page.keyboard.press("l");
await page.locator("#panel-title").filter({ hasText: "People & factions" }).waitFor();
const loreCharacters = await page.locator("[data-character-entry]").count();
const placedLoreCharacters = await page.locator("[data-character-entry][data-content-status='placed']").count();
const relationshipHooks = await page.locator(".relationship-codex article").count();
await page.screenshot({ path: new URL("./smoke.png", import.meta.url).pathname.replace(/^\/(\w:)/, "$1") });
const savedTechniqueState = await page.evaluate(() => JSON.parse(localStorage.getItem("hollow-march-save-v1"))?.progression?.purchasedNodes?.swordsmanship || []);
await page.reload({ waitUntil: "domcontentloaded" });
await page.locator("[data-action='continue']").click();
await page.locator("#hud").waitFor({ state: "visible" });
await page.keyboard.press("k");
await page.locator("[data-skill-detail='swordsmanship']").click();
const techniquePersistedAfterReload = await page.locator("[data-technique-node='swordsmanship.quiet_edge']").evaluate((node) => node.classList.contains("learned"));
await page.evaluate(() => localStorage.setItem("hollow-march-save-v1", JSON.stringify({ version: 1, character: { name: "Orphan" }, player: {}, skills: {}, inventory: {}, quests: {}, enemies: [] })));
await page.reload({ waitUntil: "domcontentloaded" });
await page.locator("[data-action='continue']").click();
await page.locator("#hud").waitFor({ state: "visible" });
await page.waitForTimeout(1200);
const legacyContinueWorked = await page.locator("#hud-name").textContent() === "Orphan" && await page.locator("#hud").isVisible();
const result = {
  title: await page.title(),
  layout: await page.evaluate(() => ({ innerWidth, innerHeight, shell: document.querySelector("#game-shell").getBoundingClientRect().toJSON(), canvas: document.querySelector("#world").getBoundingClientRect().toJSON() })),
  creatorCompleted: await page.locator("#creator").isHidden(),
  hudVisible: await page.locator("#hud").isVisible(),
  dialogueWorked: await page.locator("#dialogue").isHidden(),
  storyRecipeVisible,
  skillTiles,
  techniqueLearned,
  worldConcepts,
  atlasProofSites,
  atlasStaticVisible,
  bestiaryEntries,
  placedBestiaryEntries,
  loreCharacters,
  placedLoreCharacters,
  relationshipHooks,
  techniqueSaved: savedTechniqueState.includes("swordsmanship.quiet_edge"),
  techniquePersistedAfterReload,
  legacyContinueWorked,
  saved: await page.evaluate(() => Boolean(localStorage.getItem("hollow-march-save-v1"))),
  errors,
};
const smokeFailed = errors.length || !result.creatorCompleted || !result.hudVisible || !result.dialogueWorked || !result.storyRecipeVisible || result.skillTiles !== 18 || !result.techniqueLearned || result.worldConcepts !== 0 || result.atlasProofSites !== 7 || !result.atlasStaticVisible || result.bestiaryEntries !== 178 || result.placedBestiaryEntries !== 12 || result.loreCharacters !== 42 || result.placedLoreCharacters !== 6 || result.relationshipHooks !== 48 || !result.techniqueSaved || !result.techniquePersistedAfterReload || !result.legacyContinueWorked || !result.saved;
console.log(JSON.stringify(result, null, 2));
await page.evaluate(() => dispatchEvent(new Event("beforeunload"))).catch(() => {});
const shutdownSession = await browser.newBrowserCDPSession();
void shutdownSession.send("Browser.close").catch(() => {});
server.close();
server.closeAllConnections?.();
process.exit(smokeFailed ? 1 : 0);
