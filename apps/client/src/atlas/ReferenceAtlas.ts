export const ATLAS_LAYER_IDS = [
  "terrain",
  "territories",
  "hydrography",
  "routes",
  "settlements",
  "ruins",
  "discovered_sites",
] as const;

export type AtlasLayerId = (typeof ATLAS_LAYER_IDS)[number];
export type AtlasEvidenceStatus = "authored" | "modelled" | "derived" | "surveyed";
export type AtlasSiteKind = "settlement" | "ruin" | "landmark" | "encounter" | "site";
export type AtlasPoint = Readonly<{ easting: number; northing: number }>;

export interface AtlasExtent {
  minEasting: number;
  minNorthing: number;
  maxEasting: number;
  maxNorthing: number;
}

export interface AtlasTerritoryFeature {
  id: string;
  name: string;
  polygon: readonly AtlasPoint[];
  evidence: AtlasEvidenceStatus;
  description: string;
}

export interface AtlasLineFeature {
  id: string;
  name: string;
  points: readonly AtlasPoint[];
  evidence: AtlasEvidenceStatus;
  travelMinutes?: number;
}

export interface AtlasSiteFeature {
  id: string;
  name: string;
  kind: AtlasSiteKind;
  coordinate: AtlasPoint;
  territoryId: string;
  discovered: boolean;
  evidence: AtlasEvidenceStatus;
  summary: string;
  travelMinutesFromHearthmere?: number;
}

export interface ReferenceAtlasData {
  id: string;
  title: string;
  coordinateSpaceId: "veyl_local_grid_v1" | string;
  generationVersion: string;
  extent: AtlasExtent;
  terrainContours: readonly AtlasLineFeature[];
  territories: readonly AtlasTerritoryFeature[];
  waterways: readonly AtlasLineFeature[];
  routes: readonly AtlasLineFeature[];
  sites: readonly AtlasSiteFeature[];
  disclosure: string;
  hillshadeUrl?: string;
  staticMapUrl?: string;
}

export interface AtlasScreenPoint {
  x: number;
  y: number;
}

export interface AtlasSiteView extends AtlasSiteFeature {
  screen: AtlasScreenPoint;
}

export interface ReferenceAtlasViewModel {
  title: string;
  subtitle: string;
  disclosure: string;
  extent: AtlasExtent;
  terrainContours: readonly (AtlasLineFeature & { screenPoints: readonly AtlasScreenPoint[] })[];
  territories: readonly (AtlasTerritoryFeature & { screenPoints: readonly AtlasScreenPoint[] })[];
  waterways: readonly (AtlasLineFeature & { screenPoints: readonly AtlasScreenPoint[] })[];
  routes: readonly (AtlasLineFeature & { screenPoints: readonly AtlasScreenPoint[] })[];
  sites: readonly AtlasSiteView[];
}

export interface ReferenceAtlasOptions {
  forceStatic?: boolean;
  initialSiteId?: string;
  visibleLayers?: readonly AtlasLayerId[];
  onSiteSelected?: (site: AtlasSiteFeature) => void;
}

export interface ReferenceAtlasController {
  readonly selectedSiteId: string | null;
  selectSite(siteId: string): void;
  setLayerVisible(layerId: AtlasLayerId, visible: boolean): void;
  destroy(): void;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const VIEW_WIDTH = 1024;
const VIEW_HEIGHT = 768;
const ID_PATTERN = /^[a-z0-9][a-z0-9_.-]{0,127}$/;

const LABELS: Readonly<Record<AtlasLayerId, string>> = {
  terrain: "Terrain contours",
  territories: "Territories",
  hydrography: "Rivers and wetlands",
  routes: "Roads and travel routes",
  settlements: "Settlements",
  ruins: "Ruins",
  discovered_sites: "Discovered sites",
};

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
}

function validatePoint(point: AtlasPoint, extent: AtlasExtent, label: string): void {
  assertFinite(point.easting, `${label}.easting`);
  assertFinite(point.northing, `${label}.northing`);
  if (point.easting < extent.minEasting || point.easting > extent.maxEasting || point.northing < extent.minNorthing || point.northing > extent.maxNorthing) {
    throw new Error(`${label} falls outside the atlas extent`);
  }
}

export function buildReferenceAtlasViewModel(data: ReferenceAtlasData): ReferenceAtlasViewModel {
  const { extent } = data;
  [extent.minEasting, extent.minNorthing, extent.maxEasting, extent.maxNorthing].forEach((value, index) => assertFinite(value, `extent[${index}]`));
  if (extent.maxEasting <= extent.minEasting || extent.maxNorthing <= extent.minNorthing) throw new Error("Atlas extent must have positive area");
  if (!data.id || !ID_PATTERN.test(data.id)) throw new Error(`Invalid atlas id ${data.id}`);

  const width = extent.maxEasting - extent.minEasting;
  const height = extent.maxNorthing - extent.minNorthing;
  const project = (point: AtlasPoint): AtlasScreenPoint => ({
    x: ((point.easting - extent.minEasting) / width) * VIEW_WIDTH,
    y: ((extent.maxNorthing - point.northing) / height) * VIEW_HEIGHT,
  });
  const seen = new Set<string>();
  const unique = (id: string, label: string) => {
    if (!ID_PATTERN.test(id) || seen.has(id)) throw new Error(`${label} has an invalid or duplicate id: ${id}`);
    seen.add(id);
  };
  const lines = (entries: readonly AtlasLineFeature[], label: string) => entries.map((entry) => {
    unique(entry.id, label);
    if (entry.points.length < 2) throw new Error(`${label} ${entry.id} needs at least two points`);
    entry.points.forEach((point, index) => validatePoint(point, extent, `${label}.${entry.id}[${index}]`));
    return { ...entry, screenPoints: entry.points.map(project) };
  });
  const territories = data.territories.map((territory) => {
    unique(territory.id, "Territory");
    if (territory.polygon.length < 3) throw new Error(`Territory ${territory.id} needs at least three points`);
    territory.polygon.forEach((point, index) => validatePoint(point, extent, `territory.${territory.id}[${index}]`));
    return { ...territory, screenPoints: territory.polygon.map(project) };
  });
  const territoryIds = new Set(territories.map(({ id }) => id));
  const sites = data.sites.map((site) => {
    unique(site.id, "Site");
    validatePoint(site.coordinate, extent, `site.${site.id}`);
    if (!territoryIds.has(site.territoryId)) throw new Error(`Site ${site.id} references unknown territory ${site.territoryId}`);
    return { ...site, screen: project(site.coordinate) };
  }).sort((a, b) => a.name.localeCompare(b.name));

  return {
    title: data.title,
    subtitle: `${data.coordinateSpaceId} · generation ${data.generationVersion}`,
    disclosure: data.disclosure,
    extent,
    terrainContours: lines(data.terrainContours, "Terrain contour"),
    territories,
    waterways: lines(data.waterways, "Waterway"),
    routes: lines(data.routes, "Route"),
    sites,
  };
}

export function findDirectionalSite(sites: readonly AtlasSiteView[], currentId: string, key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"): AtlasSiteView | null {
  const current = sites.find(({ id }) => id === currentId);
  if (!current) return null;
  const desired = key === "ArrowRight" ? { x: 1, y: 0 } : key === "ArrowLeft" ? { x: -1, y: 0 } : key === "ArrowDown" ? { x: 0, y: 1 } : { x: 0, y: -1 };
  return sites
    .filter(({ id }) => id !== currentId)
    .map((site) => {
      const dx = site.screen.x - current.screen.x;
      const dy = site.screen.y - current.screen.y;
      const distance = Math.hypot(dx, dy);
      const alignment = distance ? (dx * desired.x + dy * desired.y) / distance : -1;
      return { site, distance, alignment };
    })
    .filter(({ alignment }) => alignment > 0.28)
    .sort((a, b) => (b.alignment - a.alignment) * 400 + a.distance - b.distance)[0]?.site ?? null;
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function svgElement<K extends keyof SVGElementTagNameMap>(tag: K, attributes: Readonly<Record<string, string>> = {}): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

function screenPath(points: readonly AtlasScreenPoint[], close = false): string {
  return `${points.map(({ x, y }, index) => `${index ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ")}${close ? " Z" : ""}`;
}

function statusText(status: AtlasEvidenceStatus): string {
  return status === "modelled" ? "Modelled" : status === "derived" ? "Derived" : status === "surveyed" ? "Surveyed" : "Authored";
}

const STYLES = `
  :host{display:block;color:#d8d0bd;font:14px/1.45 Georgia,serif;color-scheme:dark}
  *{box-sizing:border-box}.atlas{--ink:#d8d0bd;--muted:#93988f;--gold:#b99552;--line:rgba(216,208,189,.18);display:grid;grid-template-columns:minmax(0,1fr) 16.5rem;grid-template-rows:auto auto minmax(22rem,1fr);gap:.8rem;height:100%;min-height:34rem;padding:.8rem;background:linear-gradient(145deg,#101719,#070a0b)}
  header{grid-column:1/-1;display:flex;justify-content:space-between;gap:1rem;border-bottom:1px solid var(--line);padding:.3rem .25rem .8rem}h2,p{margin:0}h2{font:500 1.45rem/1.2 Georgia,serif}.eyebrow,.status{color:var(--gold);font:600 .66rem/1.4 system-ui,sans-serif;letter-spacing:.13em;text-transform:uppercase}.subtitle{margin-top:.2rem;color:var(--muted);font:.72rem system-ui,sans-serif}.status{align-self:start;padding:.28rem .48rem;border:1px solid rgba(185,149,82,.38)}
  fieldset{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:.35rem 1rem;margin:0;padding:.6rem .75rem;border:1px solid var(--line)}legend{padding:0 .35rem;color:var(--muted);font:.68rem system-ui,sans-serif;text-transform:uppercase;letter-spacing:.1em}label{display:flex;align-items:center;gap:.35rem;font:.75rem system-ui,sans-serif;cursor:pointer}input{accent-color:var(--gold)}
  .map-frame{position:relative;overflow:hidden;min-height:22rem;border:1px solid var(--line);background:radial-gradient(circle at 38% 35%,#25302d,#121817 55%,#090c0d)}svg{display:block;width:100%;height:100%}.territory{fill:#313731;stroke:#777662;stroke-width:1.2}.territory:nth-child(2n){fill:#3a342e}.contour{fill:none;stroke:#8a816b;stroke-width:.65;opacity:.38}.water{fill:none;stroke:#6f9294;stroke-width:3}.route{fill:none;stroke:#c1a66c;stroke-width:2;stroke-dasharray:7 4}.route[aria-label*='minute']{stroke-width:2.5}.site{cursor:pointer;outline:none}.site circle{fill:#c8ae72;stroke:#111719;stroke-width:3}.site.ruin circle{fill:#8e8a7c}.site.encounter circle{fill:#9c5e55}.site:focus circle,.site:hover circle{stroke:#f2d58c;stroke-width:6}.site text{fill:#e6dcc4;font:17px Georgia,serif;paint-order:stroke;stroke:#090c0d;stroke-width:4;stroke-linejoin:round}
  [data-hidden='true']{display:none}.side{display:flex;min-width:0;flex-direction:column;gap:.7rem;overflow:auto}.details,.index,.disclosure{padding:.8rem;border:1px solid var(--line);background:rgba(0,0,0,.24)}.details{min-height:10rem}.details h3{margin:.25rem 0 .45rem;font:500 1rem Georgia,serif}.details p,.disclosure{color:#afb2aa}.meta{color:var(--gold);font:.62rem system-ui,sans-serif;text-transform:uppercase;letter-spacing:.1em}.index h3{margin:0 0 .5rem;font:.68rem system-ui,sans-serif;color:var(--muted);text-transform:uppercase;letter-spacing:.1em}.site-index{display:grid;gap:.25rem}.site-index button{width:100%;padding:.45rem .55rem;text-align:left;color:var(--ink);background:transparent;border:1px solid transparent;font:inherit;cursor:pointer}.site-index button:hover,.site-index button:focus,.site-index button[aria-current='location']{outline:none;border-color:var(--gold);background:rgba(185,149,82,.1)}.site-index small{display:block;color:var(--muted);font:.65rem system-ui,sans-serif}.static-map{grid-column:1/-1}.static-map img{display:block;max-width:100%;height:auto;border:1px solid var(--line)}.static-map table{width:100%;border-collapse:collapse}.static-map th,.static-map td{padding:.55rem;text-align:left;border-bottom:1px solid var(--line)}.static-map th{font:.65rem system-ui,sans-serif;text-transform:uppercase;color:var(--muted)}
  @media(max-width:760px){.atlas{grid-template-columns:1fr;grid-template-rows:auto auto minmax(20rem,55vh) auto}.side{max-height:none}}
  @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
`;

function buildStaticFallback(model: ReferenceAtlasViewModel, staticMapUrl?: string): HTMLElement {
  const wrapper = element("section", "static-map");
  wrapper.setAttribute("aria-label", `${model.title} static reference`);
  if (staticMapUrl) {
    const image = element("img");
    image.src = staticMapUrl;
    image.alt = `${model.title} static map showing territories, waterways, routes, and named sites`;
    wrapper.append(image);
  }
  const table = element("table");
  const caption = element("caption");
  caption.textContent = "Atlas site index";
  const head = element("thead");
  const row = element("tr");
  for (const label of ["Site", "Kind", "Territory", "Evidence", "Location"]) { const cell = element("th"); cell.scope = "col"; cell.textContent = label; row.append(cell); }
  head.append(row);
  const body = element("tbody");
  for (const site of model.sites) {
    const siteRow = element("tr");
    const values = [site.name, site.kind, site.territoryId.replaceAll("_", " "), statusText(site.evidence), `${site.coordinate.easting.toFixed(0)}E, ${site.coordinate.northing.toFixed(0)}N`];
    values.forEach((value) => { const cell = element("td"); cell.textContent = value; siteRow.append(cell); });
    body.append(siteRow);
  }
  table.append(caption, head, body);
  wrapper.append(table);
  return wrapper;
}

export function mountReferenceAtlas(host: HTMLElement, data: ReferenceAtlasData, options: ReferenceAtlasOptions = {}): ReferenceAtlasController {
  const model = buildReferenceAtlasViewModel(data);
  const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
  shadow.replaceChildren();
  const style = element("style"); style.textContent = STYLES; shadow.append(style);
  const root = element("section", "atlas"); root.setAttribute("aria-label", `${data.title} reference atlas`); shadow.append(root);

  const header = element("header");
  const heading = element("div");
  const eyebrow = element("p", "eyebrow"); eyebrow.textContent = "Sable Reach reference atlas";
  const title = element("h2"); title.textContent = model.title;
  const subtitle = element("p", "subtitle"); subtitle.textContent = model.subtitle;
  const status = element("span", "status"); status.textContent = "Modelled geography";
  heading.append(eyebrow, title, subtitle); header.append(heading, status); root.append(header);

  if (options.forceStatic || typeof SVGElement === "undefined") {
    root.append(buildStaticFallback(model, data.staticMapUrl));
    return { selectedSiteId: null, selectSite: () => {}, setLayerVisible: () => {}, destroy: () => shadow.replaceChildren() };
  }

  const visibleLayers = new Set<AtlasLayerId>(options.visibleLayers ?? ATLAS_LAYER_IDS);
  const controls = element("fieldset");
  const legend = element("legend"); legend.textContent = "Visible map layers"; controls.append(legend);
  const layerGroups = new Map<AtlasLayerId, SVGGElement>();
  for (const layerId of ATLAS_LAYER_IDS) {
    const label = element("label");
    const input = element("input"); input.type = "checkbox"; input.checked = visibleLayers.has(layerId); input.dataset.layerToggle = layerId; input.setAttribute("aria-controls", `${data.id}-layer-${layerId}`);
    const text = document.createTextNode(LABELS[layerId]); label.append(input, text); controls.append(label);
  }
  root.append(controls);

  const mapFrame = element("div", "map-frame");
  const svg = svgElement("svg", { viewBox: `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`, role: "group", "aria-roledescription": "interactive map", "aria-labelledby": `${data.id}-title ${data.id}-desc` });
  const svgTitle = svgElement("title", { id: `${data.id}-title` }); svgTitle.textContent = model.title;
  const svgDescription = svgElement("desc", { id: `${data.id}-desc` }); svgDescription.textContent = `${model.disclosure} Use Tab or arrow keys to inspect named sites.`;
  svg.append(svgTitle, svgDescription);
  mapFrame.append(svg); root.append(mapFrame);

  const makeLayer = (layerId: AtlasLayerId) => { const group = svgElement("g", { id: `${data.id}-layer-${layerId}`, "data-atlas-layer": layerId }); group.dataset.hidden = String(!visibleLayers.has(layerId)); layerGroups.set(layerId, group); svg.append(group); return group; };
  const territoriesLayer = makeLayer("territories");
  model.territories.forEach((territory) => territoriesLayer.append(svgElement("path", { class: "territory", d: screenPath(territory.screenPoints, true), "aria-label": `${territory.name}, ${statusText(territory.evidence)}` })));
  const terrainLayer = makeLayer("terrain");
  if (data.hillshadeUrl) terrainLayer.append(svgElement("image", { href: data.hillshadeUrl, x: "0", y: "0", width: String(VIEW_WIDTH), height: String(VIEW_HEIGHT), preserveAspectRatio: "none", opacity: "0.48", "aria-hidden": "true" }));
  model.terrainContours.forEach((contour) => terrainLayer.append(svgElement("path", { class: "contour", d: screenPath(contour.screenPoints), "aria-label": `${contour.name}, ${statusText(contour.evidence)}` })));
  const hydroLayer = makeLayer("hydrography");
  model.waterways.forEach((waterway) => hydroLayer.append(svgElement("path", { class: "water", d: screenPath(waterway.screenPoints), "aria-label": `${waterway.name}, ${statusText(waterway.evidence)}` })));
  const routesLayer = makeLayer("routes");
  model.routes.forEach((route) => routesLayer.append(svgElement("path", { class: "route", d: screenPath(route.screenPoints), "aria-label": `${route.name}${route.travelMinutes ? `, ${route.travelMinutes} minute route` : ""}, ${statusText(route.evidence)}` })));
  const siteLayers = {
    settlement: makeLayer("settlements"),
    ruin: makeLayer("ruins"),
    landmark: makeLayer("discovered_sites"),
    encounter: layerGroups.get("discovered_sites")!,
    site: layerGroups.get("discovered_sites")!,
  };

  const side = element("aside", "side"); side.setAttribute("aria-label", "Atlas details and site index");
  const details = element("section", "details"); details.setAttribute("aria-live", "polite"); details.setAttribute("aria-atomic", "true");
  const index = element("nav", "index"); index.setAttribute("aria-label", "Atlas site index");
  const indexTitle = element("h3"); indexTitle.textContent = "Named sites";
  const indexList = element("div", "site-index"); index.append(indexTitle, indexList);
  const disclosure = element("p", "disclosure"); disclosure.textContent = model.disclosure;
  side.append(details, index, disclosure); root.append(side);

  const siteNodes = new Map<string, SVGGElement>();
  const indexButtons = new Map<string, HTMLButtonElement>();
  let selectedSiteId: string | null = null;

  const selectSite = (siteId: string, focus = false) => {
    const site = model.sites.find(({ id }) => id === siteId);
    if (!site) throw new Error(`Unknown atlas site ${siteId}`);
    selectedSiteId = site.id;
    details.replaceChildren();
    const meta = element("p", "meta"); meta.textContent = `${site.kind} · ${statusText(site.evidence)} · ${site.territoryId.replaceAll("_", " ")}`;
    const name = element("h3"); name.textContent = site.name;
    const summary = element("p"); summary.textContent = site.summary;
    const coordinate = element("p", "subtitle"); coordinate.textContent = `${site.coordinate.easting.toFixed(0)}E, ${site.coordinate.northing.toFixed(0)}N${site.travelMinutesFromHearthmere !== undefined ? ` · ${site.travelMinutesFromHearthmere} min from Hearthmere` : ""}`;
    details.append(meta, name, summary, coordinate);
    for (const [id, node] of siteNodes) node.setAttribute("aria-pressed", String(id === site.id));
    for (const [id, button] of indexButtons) button.setAttribute("aria-current", id === site.id ? "location" : "false");
    if (focus) siteNodes.get(site.id)?.focus();
    options.onSiteSelected?.(site);
  };

  model.sites.forEach((site) => {
    const group = svgElement("g", { class: `site ${site.kind}`, role: "button", tabindex: "0", "aria-label": `${site.name}, ${site.kind}, ${statusText(site.evidence)}`, "aria-pressed": "false" });
    group.append(svgElement("circle", { cx: site.screen.x.toFixed(2), cy: site.screen.y.toFixed(2), r: site.kind === "settlement" ? "9" : "7" }));
    const label = svgElement("text", { x: (site.screen.x + 12).toFixed(2), y: (site.screen.y - 10).toFixed(2) }); label.textContent = site.name; group.append(label);
    group.addEventListener("click", () => selectSite(site.id));
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectSite(site.id); return; }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        const destination = findDirectionalSite(model.sites, site.id, event.key as "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight");
        if (destination) selectSite(destination.id, true);
      }
    });
    siteLayers[site.kind].append(group); siteNodes.set(site.id, group);

    const button = element("button"); button.type = "button"; button.textContent = site.name;
    const secondary = element("small"); secondary.textContent = `${site.kind} · ${site.territoryId.replaceAll("_", " ")}`; button.append(secondary);
    button.addEventListener("click", () => selectSite(site.id, true)); indexList.append(button); indexButtons.set(site.id, button);
  });

  controls.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.dataset.layerToggle) return;
    const layerId = input.dataset.layerToggle as AtlasLayerId;
    visibleLayers[input.checked ? "add" : "delete"](layerId);
    const layer = layerGroups.get(layerId); if (layer) layer.dataset.hidden = String(!input.checked);
  });

  if (model.sites.length) selectSite(options.initialSiteId && model.sites.some(({ id }) => id === options.initialSiteId) ? options.initialSiteId : model.sites[0]!.id);

  return {
    get selectedSiteId() { return selectedSiteId; },
    selectSite: (siteId) => selectSite(siteId),
    setLayerVisible(layerId, visible) {
      visibleLayers[visible ? "add" : "delete"](layerId);
      const input = shadow.querySelector<HTMLInputElement>(`[data-layer-toggle="${layerId}"]`);
      if (input) input.checked = visible;
      const layer = layerGroups.get(layerId); if (layer) layer.dataset.hidden = String(!visible);
    },
    destroy: () => shadow.replaceChildren(),
  };
}
