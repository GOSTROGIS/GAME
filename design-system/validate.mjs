import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const designRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(designRoot, "..");
const componentsRoot = join(designRoot, "components");

const expected = Object.freeze({
  buttons: ["Button", "CodexBack"],
  labels: ["Eyebrow", "FieldLabel", "Kbd", "StatusPill", "LockedLore", "MicroMeta"],
  surfaces: ["GlassPanel", "Modal", "GamePanel", "BudgetBar", "Grain", "Vignette"],
  meters: ["Meter"],
  hud: ["PlayerCard", "TargetCard", "LocationCard", "SideNav", "ActionBar", "HintStrip", "QuestTracker", "InteractionPrompt", "Toast", "CombatText"],
  forms: ["TextField", "SelectBox", "OptionCard", "Swatch", "StatStepper", "MorphRow", "StepDots", "AttributeRow"],
  progression: ["SkillTile", "TechniqueSummary", "TechniqueNode", "MasteryCard", "ActionCodexEntry"],
  codex: ["EnemyCodexCard", "CharacterCodexCard", "FactionCard", "FamilyStripItem", "RelationshipRow", "JournalEntry", "WorldCard"],
  inventory: ["ItemSlot", "PaperDoll", "SheetStat"],
  narrative: ["Dialogue", "SpeakerMark", "PortraitStage", "PortraitCaption", "DeathScreen"],
  turn: ["TurnPhaseBar", "ResourcePips", "IntentQueue", "IntentTelegraph", "PartyReadiness", "ResolutionLog"],
});

const expectedNames = Object.values(expected).flat();
assert.equal(Object.keys(expected).length, 11, "design system must have exactly 11 component groups");
assert.equal(expectedNames.length, 59, "design system must declare exactly 59 components");
assert.equal(new Set(expectedNames).size, 59, "component names must be globally unique");

const actualGroups = readdirSync(componentsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
assert.deepEqual(actualGroups, Object.keys(expected).sort(), "component group directories must match the canonical inventory");

for (const [group, names] of Object.entries(expected)) {
  const directory = join(componentsRoot, group);
  const actualByExtension = { jsx: [], type: [], prompt: [] };
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (entry.name.endsWith(".prompt.md")) actualByExtension.prompt.push(entry.name.slice(0, -10));
    else if (entry.name.endsWith(".d.ts")) actualByExtension.type.push(entry.name.slice(0, -5));
    else if (entry.name.endsWith(".jsx")) actualByExtension.jsx.push(entry.name.slice(0, -4));
  }
  for (const [kind, actual] of Object.entries(actualByExtension)) {
    assert.deepEqual(actual.sort(), [...names].sort(), `${group} ${kind} inventory must match`);
  }

  for (const name of names) {
    const jsx = readFileSync(join(directory, `${name}.jsx`), "utf8");
    const types = readFileSync(join(directory, `${name}.d.ts`), "utf8");
    const prompt = readFileSync(join(directory, `${name}.prompt.md`), "utf8");
    assert.match(jsx, new RegExp(`export\\s+function\\s+${name}\\b`), `${name}.jsx must export its canonical function`);
    assert.match(types, new RegExp(`export\\s+function\\s+${name}\\b`), `${name}.d.ts must declare its canonical function`);
    assert.equal((prompt.match(/^## Accessibility$/gm) || []).length, 1, `${name}.prompt.md must contain one explicit Accessibility section`);
  }
}

const fallback = readFileSync(join(designRoot, "_ds_fallback.js"), "utf8");
const fallbackEntries = [...fallback.matchAll(/"(components\/[^"]+\.jsx)"/g)].map((match) => match[1]);
const expectedFallbackEntries = Object.entries(expected).flatMap(([group, names]) => names.map((name) => `components/${group}/${name}.jsx`));
assert.equal(fallbackEntries.length, 59, "dev shim must list exactly 59 component sources");
assert.equal(new Set(fallbackEntries).size, 59, "dev shim source paths must be unique");
assert.deepEqual([...fallbackEntries].sort(), expectedFallbackEntries.sort(), "dev shim sources must match the canonical inventory");

const rootEntries = readdirSync(designRoot);
const designFiles = walk(designRoot).filter((path) => statSync(path).isFile());
const excludedReviewFiles = [
  "Hollow March Theme Reference.dc.html",
  "github.md",
  "support.js",
];
for (const excluded of excludedReviewFiles) {
  assert.equal(designFiles.some((path) => basename(path) === excluded), false, `${excluded} must be excluded recursively`);
}
assert.ok(rootEntries.includes("README.md"), "README.md must use case-stable naming");
assert.equal(rootEntries.includes("readme.md"), false, "lowercase readme.md must be absent");

const allowedDesignExtensions = new Set([".css", ".html", ".js", ".jsx", ".md", ".mjs", ".ts"]);
const unsupportedDesignFiles = designFiles.filter((path) => !allowedDesignExtensions.has(extname(path).toLowerCase()));
assert.deepEqual(unsupportedDesignFiles.map((path) => relative(designRoot, path)), [], "design system must remain text-only and contain no copied binaries");

const copiedAssets = existsSync(join(designRoot, "assets")) ? walk(join(designRoot, "assets")).filter((path) => statSync(path).isFile()) : [];
assert.deepEqual(copiedAssets, [], "design-system/assets must contain no copied binaries");

const loadingRoots = [join(designRoot, "guidelines"), join(designRoot, "components"), join(designRoot, "ui_kits")];
const loadingFiles = loadingRoots.flatMap(walk).filter((path) => [".html", ".jsx"].includes(extname(path)));
const loadingRefs = [];
for (const file of loadingFiles) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/(?:\.\.\/)+assets\/[A-Za-z0-9._\/-]+/g)) {
    const ref = match[0];
    const target = resolve(dirname(file), ref);
    const canonicalRoot = resolve(repoRoot, "assets") + sep;
    assert.ok(target.startsWith(canonicalRoot), `${relative(designRoot, file)} must resolve assets inside the canonical root`);
    assert.ok(existsSync(target), `${relative(designRoot, file)} has a missing canonical asset: ${ref}`);
    loadingRefs.push({ file: relative(designRoot, file).replaceAll("\\", "/"), ref });
  }
}
assert.equal(loadingRefs.length, 16, "reference cards and UI kit must contain exactly 16 loading asset references");
assert.equal(loadingRefs.filter(({ ref }) => ref.startsWith("../../assets/")).length, 6, "guideline references must use six ../../assets paths");
assert.equal(loadingRefs.filter(({ ref }) => ref.startsWith("../../../assets/")).length, 10, "component/UI-kit references must use ten ../../../assets paths");

for (const [file, snippet] of [
  ["components/codex/WorldCard.prompt.md", "../../../assets/world/dunmire-causeway.png"],
  ["components/inventory/PaperDoll.prompt.md", "../../../assets/characters/gloamfarer-v2.png"],
]) {
  assert.ok(readFileSync(join(designRoot, file), "utf8").includes(snippet), `${file} must use the canonical prompt example path`);
}

const promptAssetReferences = [];
for (const [group, names] of Object.entries(expected)) {
  for (const name of names) {
    const file = join(componentsRoot, group, `${name}.prompt.md`);
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/(?:\.\.\/)+assets\/[A-Za-z0-9._\/-]+/g)) {
      const target = resolve(dirname(file), match[0]);
      const canonicalRoot = resolve(repoRoot, "assets") + sep;
      assert.ok(target.startsWith(canonicalRoot), `${relative(designRoot, file)} prompt asset must stay inside the canonical root`);
      assert.ok(existsSync(target), `${relative(designRoot, file)} has a missing prompt asset: ${match[0]}`);
      promptAssetReferences.push(match[0]);
    }
  }
}

const accessibilityContracts = [
  ["components/forms/StepDots.jsx", /aria-current=.*step/, "StepDots must expose the current creator stage"],
  ["components/forms/StatStepper.jsx", /Decrease \$\{label\}; current value/, "StatStepper controls must include their value context"],
  ["components/forms/StatStepper.jsx", /aria-live="polite"/, "StatStepper must announce its output"],
  ["components/forms/AttributeRow.jsx", /role="group"/, "AttributeRow must group its label, description, and control"],
  ["components/forms/AttributeRow.jsx", /aria-labelledby=/, "AttributeRow must associate its full name and effect"],
  ["components/hud/SideNav.jsx", /aria-current=\{on \? "page"/, "SideNav must expose its active destination"],
  ["components/hud/QuestTracker.jsx", /Complete: /, "QuestTracker must write objective completion nonvisually"],
  ["components/hud/QuestTracker.jsx", /aria-label="Quest progress"/, "QuestTracker progress must be named"],
  ["components/inventory/ItemSlot.jsx", /aria-label=\{label\}/, "ItemSlot must name item and quantity"],
  ["components/inventory/ItemSlot.jsx", /onFocus=\{\(\) => setHot\(true\)\}/, "ItemSlot details must appear for keyboard focus"],
  ["components/inventory/ItemSlot.jsx", /disabled=\{empty\}/, "empty ItemSlots must not be focusable"],
  ["components/codex/JournalEntry.jsx", /const Element = onClick \? "button" : "article"/, "interactive JournalEntry rows must be native buttons"],
  ["components/codex/WorldCard.jsx", /const Element = onClick \? "button" : "article"/, "interactive WorldCards must be native buttons"],
  ["components/hud/CombatText.jsx", /aria-hidden="true"/, "CombatText must remain decorative"],
  ["components/hud/InteractionPrompt.jsx", /aria-live="polite"/, "InteractionPrompt changes must be announced politely"],
  ["components/turn/ResourcePips.jsx", /role="meter"/, "ResourcePips must expose a semantic meter"],
  ["components/turn/ResourcePips.jsx", /aria-valuetext=\{summary\}/, "ResourcePips must announce reservation context"],
  ["components/hud/ActionBar.jsx", /disabled=\{s\.disabled\}/, "ActionBar must use native disabled semantics"],
  ["components/narrative/Dialogue.jsx", /firstChoiceRef\.current\?\.focus\(\)/, "Dialogue must move focus to its first choice"],
];
for (const [file, pattern, message] of accessibilityContracts) {
  assert.match(readFileSync(join(designRoot, file), "utf8"), pattern, message);
}
const worldCardTypes = readFileSync(join(designRoot, "components/codex/WorldCard.d.ts"), "utf8");
assert.match(worldCardTypes, /^\s*image: string;$/m, "WorldCard image must be required");
assert.match(worldCardTypes, /^\s*alt: string;$/m, "WorldCard descriptive alt text must be required");

for (const file of ["components/surfaces/GamePanel.d.ts", "components/narrative/DeathScreen.d.ts"]) {
  const types = readFileSync(join(designRoot, file), "utf8");
  assert.match(types, /extends Omit<React\.HTMLAttributes<HTMLElement>, "title">/, `${file} must omit the native title before declaring a ReactNode heading`);
}

for (const file of ["components/turn/ResolutionLog.d.ts", "components/progression/TechniqueNode.d.ts"]) {
  const types = readFileSync(join(designRoot, file), "utf8");
  assert.match(types, /extends Omit<React\.HTMLAttributes<HTMLElement>, "onSelect">/, `${file} must omit the native selection event before declaring its callback`);
}

const statStepperTypes = readFileSync(join(designRoot, "components/forms/StatStepper.d.ts"), "utf8");
assert.match(statStepperTypes, /^\s*label: string;$/m, "StatStepper must require an accessible label");
assert.match(readFileSync(join(designRoot, "components/forms/AttributeRow.prompt.md"), "utf8"), /<StatStepper label="Vigor"/, "AttributeRow example must supply the required StatStepper label");

const actionBarTypes = readFileSync(join(designRoot, "components/hud/ActionBar.d.ts"), "utf8");
assert.match(actionBarTypes, /^\s*disabled\?: boolean;$/m, "ActionBar slots must contract disabled state");

const turnPhaseSource = readFileSync(join(designRoot, "components/turn/TurnPhaseBar.jsx"), "utf8");
const turnPhaseTypes = readFileSync(join(designRoot, "components/turn/TurnPhaseBar.d.ts"), "utf8");
assert.match(turnPhaseSource, /TERMINAL_PHASES/, "TurnPhaseBar must append the selected terminal outcome");
assert.match(turnPhaseSource, /requestedPhases\.includes\(phase\)/, "TurnPhaseBar must always render its current phase");
assert.match(turnPhaseSource, /aria-current=\{state === "current" \? "step"/, "TurnPhaseBar must mark every current phase");
assert.match(turnPhaseTypes, /"spectator" \| "reconnecting"/, "TurnPhaseBar must contract spectator and reconnecting modes");
assert.match(turnPhaseTypes, /reconnectSeconds\?: number/, "TurnPhaseBar must expose reconnect lease time");

const intentTypes = readFileSync(join(designRoot, "components/turn/IntentTelegraph.d.ts"), "utf8");
const intentSource = readFileSync(join(designRoot, "components/turn/IntentTelegraph.jsx"), "utf8");
assert.match(intentTypes, /^\s*statusIcons: IntentStatusIcon\[\];$/m, "IntentTelegraph must require status icons, including an explicit empty array");
assert.match(intentSource, /status\.glyph/, "IntentTelegraph must render each status glyph");
assert.match(intentSource, /status\.label/, "IntentTelegraph must pair each status glyph with text");

const partyTypes = readFileSync(join(designRoot, "components/turn/PartyReadiness.d.ts"), "utf8");
assert.match(partyTypes, /viewerMode\?: EncounterViewerMode/, "PartyReadiness must expose the viewer mode");
assert.match(partyTypes, /connectionState\?: PartyConnectionState/, "PartyReadiness must expose reconnecting roster state");
assert.match(partyTypes, /spectator\?: boolean/, "PartyReadiness must expose spectator roster state");
const partySource = readFileSync(join(designRoot, "components/turn/PartyReadiness.jsx"), "utf8");
assert.match(partySource, /members\.filter\(\(member\) => !member\.spectator\)/, "PartyReadiness must exclude spectators from its participant denominator");
assert.match(partySource, /readyCount\}\/\{participants\.length\}/, "PartyReadiness must report ready participants against participants only");

const creatorSource = readFileSync(join(designRoot, "ui_kits/game-client/CreatorScreen.jsx"), "utf8");
const originBlock = creatorSource.match(/const origins = \[([\s\S]*?)\n\s*\];/);
assert.ok(originBlock, "CreatorScreen must declare its origin reference list");
const creatorOriginIds = [...originBlock[1].matchAll(/\bid:\s*"([^"]+)"/g)].map((match) => match[1]);
const { ORIGINS: canonicalOrigins } = await import(pathToFileURL(join(repoRoot, "src/data/character.js")).href);
assert.equal(canonicalOrigins.length, 8, "canonical character data must expose eight origins");
assert.deepEqual(creatorOriginIds, canonicalOrigins.map((origin) => origin.id), "CreatorScreen must use the canonical stable origin IDs in canonical order");
for (const origin of canonicalOrigins) {
  assert.ok(originBlock[1].includes(`id: "${origin.id}", title: "${origin.label}"`), `CreatorScreen must use the canonical label for ${origin.id}`);
  assert.ok(originBlock[1].includes(`description: ${JSON.stringify(origin.lore)}`), `CreatorScreen must use the canonical lore for ${origin.id}`);
  const skillNote = Object.entries(origin.skillBonuses).map(([skill, value]) => `+${value} ${skill.replace(/([a-z])([A-Z])/g, "$1 $2").toUpperCase()}`).join(" · ");
  assert.ok(originBlock[1].includes(`note: "${skillNote}"`), `CreatorScreen must use the canonical skill bonuses for ${origin.id}`);
}
assert.equal((originBlock[1].match(/art:\s*null/g) || []).length, 4, "CreatorScreen must leave exactly four missing origin keyframes explicit");

const packageManifestFiles = [
  join(repoRoot, "package.json"),
  ...walk(join(repoRoot, "apps")).filter((path) => basename(path) === "package.json"),
  ...walk(join(repoRoot, "packages")).filter((path) => basename(path) === "package.json"),
];
for (const file of packageManifestFiles) {
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  for (const field of ["dependencies", "optionalDependencies", "peerDependencies"]) {
    const dependencies = manifest[field] || {};
    for (const forbidden of ["react", "react-dom", "@babel/standalone"]) {
      assert.equal(Object.hasOwn(dependencies, forbidden), false, `${relative(repoRoot, file)} must not ship ${forbidden} in ${field}`);
    }
  }
}

const productionEntries = [join(repoRoot, "src/main.js"), join(repoRoot, "apps/client/src/main.ts")];
const productionGraph = collectLocalModuleGraph(productionEntries);
const productionSourceFiles = [join(repoRoot, "src"), join(repoRoot, "apps"), join(repoRoot, "packages")]
  .flatMap(walk)
  .filter((path) => [".js", ".jsx", ".mjs", ".ts", ".tsx"].includes(extname(path)) && (path.startsWith(join(repoRoot, "src") + sep) || path.includes(`${sep}src${sep}`)));
for (const file of new Set([...productionGraph, ...productionSourceFiles])) {
  const source = readFileSync(file, "utf8");
  assert.doesNotMatch(source, /(?:from\s*|import\s*\(|import\s*)["'](?:react|react-dom|@babel\/standalone)(?:[\/"'])/, `${relative(repoRoot, file)} must not import React or browser Babel`);
  assert.doesNotMatch(source, /design-system[\\/](?:components|ui_kits)|_ds_fallback/, `${relative(repoRoot, file)} must not import reference-only design-system code`);
}
const productionDocument = readFileSync(join(repoRoot, "index.html"), "utf8");
assert.doesNotMatch(productionDocument, /react(?:-dom)?(?:\.production)?(?:\.min)?\.js|@babel\/standalone|unpkg\.com|design-system[\\/](?:components|ui_kits)|_ds_fallback/i, "production index.html must not load the reference React runtime, Babel, cards, UI kit, or fallback shim");
const productionStyles = readFileSync(join(repoRoot, "styles.css"), "utf8");
const productionTokenImports = [...productionStyles.matchAll(/@import\s+["']\.\/design-system\/tokens\/([^"']+\.css)["'];/g)].map((match) => match[1]);
assert.deepEqual(productionTokenImports, ["colors.css", "typography.css", "spacing.css", "effects.css"], "production must import the four canonical token sheets once and in dependency order");

const docs = ["README.md", "INSTALL-IN-REPO.md", "ui_kits/game-client/README.md"].map((file) => readFileSync(join(designRoot, file), "utf8")).join("\n");
assert.match(docs, /59 reference primitives in 11 groups/, "documentation must state the canonical 59/11 inventory");
assert.doesNotMatch(docs, /under revision|44 primitives in 10 groups/i, "obsolete component-count and revision language must be absent");
assert.doesNotMatch(docs, /59 runtime assets/i, "the reference primitive count must not be presented as runtime-asset maturity");
const installGuide = readFileSync(join(designRoot, "INSTALL-IN-REPO.md"), "utf8");
assert.doesNotMatch(installGuide, /\breadme\.md\b/, "installation docs must use case-stable README.md naming");
assert.doesNotMatch(installGuide, /Repo access from this side is read-only|upload\/main\/design-system/i, "installation docs must not retain stale handoff or direct-main upload language");
assert.match(installGuide, /Production token wiring was completed with the vanilla-DOM combat interface/, "installation docs must report the completed token integration");
assert.match(installGuide, /The production `color-scheme: dark` declaration remains outside the imported\s+tokens/, "token instructions must preserve the production colour-scheme contract");
const readme = readFileSync(join(designRoot, "README.md"), "utf8");
assert.match(readme, /Production imports these four sheets from the root `styles\.css`/, "README must report production token integration honestly");
const characterPlacementDocs = ["components/codex/CharacterCodexCard.d.ts", "components/codex/CharacterCodexCard.prompt.md"].map((file) => readFileSync(join(designRoot, file), "utf8")).join("\n");
assert.doesNotMatch(characterPlacementDocs, /\b6 placed\b|Only six/i, "character cards must not retain the unsupported six-placement claim");
assert.match(characterPlacementDocs, /Maela, Torren, and Ysra/, "character placement guidance must name the three within-site runtime placements");

const turnCardPath = join(componentsRoot, "turn", "turn.card.html");
assert.ok(existsSync(turnCardPath), "turn.card.html must exercise the six turn primitives");
const turnCard = readFileSync(turnCardPath, "utf8");
for (const primitive of expected.turn) {
  assert.match(turnCard, new RegExp(`<${primitive}\\b`), `turn.card.html must render ${primitive}`);
}
for (const state of ["planning", "ready", "resolving", "terminal", "reconnecting", "spectator"]) {
  assert.match(turnCard, new RegExp(`data-demo-state=["']${state}["']`), `turn.card.html must render the ${state} reference state`);
}
for (const outcome of ["victory", "defeat", "aborted"]) {
  assert.match(turnCard, new RegExp(`phase=["']${outcome}["']`), `turn.card.html terminal state must render ${outcome}`);
}
assert.match(turnCard, /Plan invalid:/, "turn.card.html must show a written invalid-plan state");
assert.match(turnCard, /interrupted/i, "turn.card.html must show a written interrupted-action state");

console.log(JSON.stringify({
  groups: Object.keys(expected).length,
  components: expectedNames.length,
  tripletFiles: expectedNames.length * 3,
  accessiblePrompts: expectedNames.length,
  fallbackEntries: fallbackEntries.length,
  loadingAssetReferences: loadingRefs.length,
  promptAssetReferences: promptAssetReferences.length,
  designContractAssertions: accessibilityContracts.length + 49,
  copiedAssets: copiedAssets.length,
  productionGraphModules: productionGraph.length,
  status: "ok",
}, null, 2));

function walk(root) {
  if (!existsSync(root)) return [];
  const result = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) result.push(...walk(path));
    else result.push(path);
  }
  return result.sort();
}

function collectLocalModuleGraph(entries) {
  const result = [];
  const pending = [...entries];
  const visited = new Set();
  while (pending.length) {
    const file = resolve(pending.pop());
    if (visited.has(file)) continue;
    assert.ok(existsSync(file), `production graph entry must exist: ${relative(repoRoot, file)}`);
    visited.add(file);
    result.push(file);
    const source = readFileSync(file, "utf8");
    const specifiers = [...source.matchAll(/(?:from\s*|import\s*\(\s*|import\s*)["']([^"']+)["']/g)].map((match) => match[1]);
    for (const specifier of specifiers) {
      if (!specifier.startsWith(".")) continue;
      const cleanSpecifier = specifier.split(/[?#]/, 1)[0];
      const unresolved = resolve(dirname(file), cleanSpecifier);
      const declaredExtension = extname(unresolved);
      const candidates = declaredExtension
        ? [unresolved, ...([".js", ".mjs"].includes(declaredExtension) ? [".ts", ".tsx", ".jsx"].map((extension) => unresolved.slice(0, -declaredExtension.length) + extension) : [])]
        : [unresolved, ...[".js", ".mjs", ".ts", ".tsx", ".jsx"].map((extension) => unresolved + extension), ...[".js", ".mjs", ".ts", ".tsx", ".jsx"].map((extension) => join(unresolved, "index" + extension))];
      const target = candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
      assert.ok(target, `${relative(repoRoot, file)} has an unresolved local import: ${specifier}`);
      assert.ok(!resolve(target).startsWith(resolve(designRoot) + sep), `${relative(repoRoot, file)} must not import the reference design system`);
      if ([".js", ".mjs", ".ts", ".tsx", ".jsx"].includes(extname(target))) pending.push(target);
    }
  }
  return result.sort();
}
