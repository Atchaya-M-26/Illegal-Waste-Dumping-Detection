import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";

type Location = {
  name: string;
  city: string;
  coordinates: [number, number];
  risk: "High" | "Medium" | "Low";
  sites: number;
  area: string;
  trend: number[];
  reports: Array<{ title: string; risk: string; age: string; volume: string }>;
};

const locations: Location[] = [
  {
    name: "Chennai, India", city: "Chennai", coordinates: [13.0827, 80.2707],
    risk: "Medium", sites: 16, area: "35.7 km²",
    trend: [13, 12, 14, 14, 13, 15, 17, 16, 18, 17, 16, 16],
    reports: [
      { title: "Perungudi marsh boundary", risk: "High", age: "4 days ago", volume: "9.4 t" },
      { title: "Manali logistics corridor", risk: "Medium", age: "12 days ago", volume: "4.1 t" },
    ],
  },
];

const demoEmail = "admin";
const demoPassword = "admin123";
let selected = locations[0];
let map: L.Map | undefined;
let searchedArea: ChennaiArea | undefined;
let comparisonMaps: L.Map[] = [];
type ChennaiArea = {
  name: string;
  neighborhood: string;
  coordinates: [number, number];
  category: "legal" | "illegal";
  facilityType: string;
  extent: string;
  wasteArea?: string;
  status: string;
  detail: string;
  updated: string;
  source?: string;
  sourceUrl?: string;
  wasteTypes?: string[];
  priority?: boolean;
};

const chennaiAreas: ChennaiArea[] = [
  { name: "Chennai Corporation Dump Yard, Kodungaiyur", neighborhood: "Kodungaiyur", coordinates: [13.1702, 80.2551], category: "legal", facilityType: "GCC municipal disposal site", extent: "342.91 acres", wasteArea: "252 acres legacy waste", status: "Biomining", detail: "Receives municipal waste from Zones 1–8; operating since the early 1980s", updated: "GCC 2025–26 climate budget", source: "Greater Chennai Corporation Solid Waste Management Department" },
  { name: "Perungudi Municipal Solid Waste Dumping Site", neighborhood: "Perungudi / Pallikaranai", coordinates: [12.9547, 80.2315], category: "legal", facilityType: "GCC municipal disposal site", extent: "250 acres", wasteArea: "225 acres historical dumping", status: "Biomining", detail: "Located near Pallikaranai Marshland; undergoing land reclamation", updated: "GCC 2025–26 climate budget", source: "GCC site record · Scientific Reports study coordinates", sourceUrl: "https://www.nature.com/articles/s41598-024-59032-4" },
  { name: "Nolambur", neighborhood: "Nolambur", coordinates: [13.0730, 80.1690], category: "illegal", facilityType: "Reported dumping area", extent: "To be measured in GIS", status: "Requires verification", detail: "Open dumping near riverside roads and vacant plots.", updated: "India Today · 22 Jul 2025", source: "India Today", sourceUrl: "https://www.indiatoday.in/cities/chennai/story/chennai-ranks-38th-in-swachh-survekshan-2025-as-garbage-piles-up-in-nolambur-nungambakkam-mayor-urges-public-to-help-keep-city-clean-2759632-2025-07-22", wasteTypes: ["Household garbage", "Food waste", "Plastic", "Construction debris"], priority: true },
  { name: "Mogappair West", neighborhood: "Mogappair West", coordinates: [13.0830, 80.1740], category: "illegal", facilityType: "Reported dumping area", extent: "To be measured in GIS", status: "Requires verification", detail: "Large waste bags and bulky waste dumped near roadsides.", updated: "India Today · 22 Jul 2025", source: "India Today", sourceUrl: "https://www.indiatoday.in/cities/chennai/story/chennai-ranks-38th-in-swachh-survekshan-2025-as-garbage-piles-up-in-nolambur-nungambakkam-mayor-urges-public-to-help-keep-city-clean-2759632-2025-07-22", wasteTypes: ["Bulk waste", "Furniture", "Construction debris"], priority: true },
  { name: "Gerugambakkam", neighborhood: "Gerugambakkam", coordinates: [13.0120, 80.1390], category: "illegal", facilityType: "Reported riverbed area", extent: "To be measured in GIS", status: "Requires verification", detail: "Waste dumped and burned along the Adyar riverbed.", updated: "Times of India · 16 May 2025", source: "Times of India", sourceUrl: "https://timesofindia.indiatimes.com/city/chennai/adyar-riverbed-turns-dumpyard-despite-ngt-orders/articleshow/121253760.cms", wasteTypes: ["Plastic", "Vegetables", "Furniture", "Mixed municipal waste"], priority: true },
  { name: "Cowl Bazaar", neighborhood: "Cowl Bazaar", coordinates: [12.9820, 80.1640], category: "illegal", facilityType: "Reported riverbed area", extent: "To be measured in GIS", status: "Requires verification", detail: "Dumping along the Adyar River stretch near the airport.", updated: "Times of India · 16 May 2025", source: "Times of India", sourceUrl: "https://timesofindia.indiatimes.com/city/chennai/adyar-riverbed-turns-dumpyard-despite-ngt-orders/articleshow/121253760.cms", wasteTypes: ["Plastic", "Food waste", "Furniture", "Mixed garbage"], priority: true },
  { name: "Kolapakkam", neighborhood: "Kolapakkam", coordinates: [13.0110, 80.1450], category: "illegal", facilityType: "Reported river area", extent: "To be measured in GIS", status: "Requires verification", detail: "Waste accumulation and open burning near the river.", updated: "Times of India · 16 May 2025", source: "Times of India", sourceUrl: "https://timesofindia.indiatimes.com/city/chennai/adyar-riverbed-turns-dumpyard-despite-ngt-orders/articleshow/121253760.cms", wasteTypes: ["Plastic", "Organic waste", "Furniture"], priority: true },
  { name: "Perumbakkam Lake", neighborhood: "Perumbakkam Lake", coordinates: [12.9140, 80.2070], category: "illegal", facilityType: "Reported lake-side area", extent: "To be measured in GIS", status: "Requires verification", detail: "Waste reported near the lake boundary; biomedical waste is mentioned in the supporting report and needs independent confirmation.", updated: "Times of India · 25 Nov 2024", source: "Times of India", sourceUrl: "https://timesofindia.indiatimes.com/city/chennai/health-hazard-as-perumbakkam-lake-becomes-a-dumping-ground/articleshow/115707701.cms", wasteTypes: ["Mixed municipal waste", "Biomedical waste (reported)", "Plastic"], priority: true },
  { name: "Otteri Nullah", neighborhood: "Otteri Nullah", coordinates: [13.0950, 80.2520], category: "illegal", facilityType: "Reported canal-side area", extent: "To be measured in GIS", status: "Requires verification", detail: "Repeated construction debris dumping along the canal.", updated: "Times of India · 12 Jul 2024", source: "Times of India", sourceUrl: "https://timesofindia.indiatimes.com/city/chennai/chennais-public-places-turn-into-waste-dumping-grounds/articleshow/111738975.cms", wasteTypes: ["Construction and demolition debris"] },
  { name: "Mambalam Canal", neighborhood: "Mambalam Canal", coordinates: [13.0340, 80.2320], category: "illegal", facilityType: "Reported canal-side area", extent: "To be measured in GIS", status: "Requires verification", detail: "Construction debris and building materials dumped along canal banks.", updated: "Times of India · 12 Jul 2024", source: "Times of India", sourceUrl: "https://timesofindia.indiatimes.com/city/chennai/chennais-public-places-turn-into-waste-dumping-grounds/articleshow/111738975.cms", wasteTypes: ["Construction debris", "Building materials"] },
  { name: "Buckingham Canal, Kotturpuram", neighborhood: "Buckingham Canal · Kotturpuram", coordinates: [13.0110, 80.2430], category: "illegal", facilityType: "Reported canal-side area", extent: "To be measured in GIS", status: "Requires verification", detail: "Dumping reported near Patrician College, Kotturpuram.", updated: "Times of India · 12 Jul 2024", source: "Times of India", sourceUrl: "https://timesofindia.indiatimes.com/city/chennai/chennais-public-places-turn-into-waste-dumping-grounds/articleshow/111738975.cms", wasteTypes: ["Construction debris", "Furniture"] },
  { name: "Cooum River, Anna Nagar stretch", neighborhood: "Cooum River · Anna Nagar", coordinates: [13.0870, 80.2240], category: "illegal", facilityType: "Reported river area", extent: "To be measured in GIS", status: "Requires verification", detail: "Construction and furniture waste reported along the river stretch.", updated: "Indian Kanoon · NGT-related report", source: "Indian Kanoon", sourceUrl: "https://indiankanoon.org/doc/59023035/", wasteTypes: ["Construction debris", "Furniture"] },
  { name: "Mylapore Railway Station surroundings", neighborhood: "Mylapore Railway Station", coordinates: [13.0330, 80.2690], category: "illegal", facilityType: "Reported public-space area", extent: "To be measured in GIS", status: "Requires verification", detail: "Construction debris accumulation reported around public spaces.", updated: "Times of India · 12 Jul 2024", source: "Times of India", sourceUrl: "https://timesofindia.indiatimes.com/city/chennai/chennais-public-places-turn-into-waste-dumping-grounds/articleshow/111738975.cms", wasteTypes: ["Construction debris"] },
  { name: "Tondiarpet, Elaya Street", neighborhood: "Tondiarpet · Elaya Street", coordinates: [13.1280, 80.2910], category: "illegal", facilityType: "Reported roadside area", extent: "To be measured in GIS", status: "Requires verification", detail: "Recurring roadside dumping reported at Elaya Street.", updated: "Times of India · 12 Jul 2024", source: "Times of India", sourceUrl: "https://timesofindia.indiatimes.com/city/chennai/chennais-public-places-turn-into-waste-dumping-grounds/articleshow/111738975.cms", wasteTypes: ["Construction debris", "Furniture"] },
];

// OpenStreetMap's mapped landuse=landfill perimeter for the Pallikaranai
// Dumpyard (way 84106307). This is the mapped dumpyard boundary, not AI pixel
// segmentation of individual current waste piles.
const perungudiDumpyardBoundary: L.LatLngExpression[] = [
  [12.9510677, 80.2270021], [12.9500433, 80.2281861], [12.9501888, 80.229512],
  [12.9511932, 80.2302171], [12.9517573, 80.2307794], [12.9528591, 80.2309468],
  [12.9532534, 80.2312919], [12.9534878, 80.2318812], [12.9532137, 80.232384],
  [12.9538277, 80.232723], [12.9539566, 80.2328913], [12.9546931, 80.2328103],
  [12.955139, 80.2343214], [12.9553481, 80.2342409], [12.955437, 80.2334202],
  [12.9555624, 80.2325565], [12.9554474, 80.2318162], [12.9564999, 80.2314414],
  [12.9572207, 80.2306097], [12.9574134, 80.2298916], [12.9570056, 80.2296448],
  [12.9575545, 80.2290654], [12.9577375, 80.2288187], [12.9578421, 80.2278048],
  [12.9579675, 80.2275419], [12.9583126, 80.2264047], [12.9588981, 80.2246505],
  [12.9585269, 80.223524], [12.9589817, 80.2231109], [12.9587726, 80.2218288],
  [12.9574239, 80.2211349], [12.9564859, 80.2196913], [12.9553684, 80.219597],
  [12.9541937, 80.219413], [12.9533102, 80.2201694], [12.9527717, 80.2203947],
  [12.952411, 80.2202874], [12.9520398, 80.2204859], [12.9515588, 80.2215588],
  [12.9515431, 80.2218377], [12.9509043, 80.2221182], [12.9500148, 80.2236831],
  [12.9502445, 80.2246375], [12.9512737, 80.2250283], [12.9504814, 80.2252408],
  [12.950293, 80.2257374], [12.950459, 80.2263], [12.9507419, 80.2266895],
  [12.9510677, 80.2270021],
];
const kodungaiyurDumpyardBoundary: L.LatLngExpression[] = [
  [13.1339852, 80.2624741], [13.1306695, 80.2667918], [13.1304098, 80.2668703],
  [13.1282232, 80.2697722], [13.1309201, 80.2715236], [13.1310385, 80.2741444],
  [13.1308271, 80.2748208], [13.1360118, 80.2763301], [13.137199, 80.2736818],
  [13.1413744, 80.2684483], [13.1415149, 80.2649962], [13.1413607, 80.2649671],
  [13.135646, 80.2640183], [13.1358201, 80.2633226], [13.1339852, 80.2624741],
];

const sourceReferences = [
  { label: "India Today · Chennai garbage accumulation (2025)", url: "https://www.indiatoday.in/cities/chennai/story/chennai-ranks-38th-in-swachh-survekshan-2025-as-garbage-piles-up-in-nolambur-nungambakkam-mayor-urges-public-to-help-keep-city-clean-2759632-2025-07-22" },
  { label: "Times of India · Adyar riverbed dumping", url: "https://timesofindia.indiatimes.com/city/chennai/adyar-riverbed-turns-dumpyard-despite-ngt-orders/articleshow/121253760.cms" },
  { label: "Times of India · Perumbakkam Lake dumping", url: "https://timesofindia.indiatimes.com/city/chennai/health-hazard-as-perumbakkam-lake-becomes-a-dumping-ground/articleshow/115707701.cms" },
  { label: "Times of India · Public-space dumping hotspots", url: "https://timesofindia.indiatimes.com/city/chennai/chennais-public-places-turn-into-waste-dumping-grounds/articleshow/111738975.cms" },
  { label: "Indian Kanoon · NGT-related debris report", url: "https://indiankanoon.org/doc/59023035/" },
];

function sourceLinksMarkup(): string {
  return `<section class="source-links"><h3>Supporting reports</h3><div>${sourceReferences.map((source) => `<a href="${source.url}" target="_blank" rel="noreferrer">${source.label} ↗</a>`).join("")}</div></section>`;
}

const app = document.querySelector<HTMLDivElement>("#app")!;
const icon = (name: string) => `<span class="icon">${name}</span>`;

type Page = "overview" | "map" | "sites" | "analytics" | "reports";

function dashboardSidebar(active: Page): string {
  return `
    <header class="site-header">
      <div class="brand sidebar-brand"><span class="brand-mark">🌿</span><strong>GeoWasteAI</strong></div>
      <nav class="main-nav">
        <button id="overview-nav" class="nav ${active === "overview" ? "active" : ""}">Dashboard</button>
        <button id="map-nav" class="nav ${active === "map" ? "active" : ""}">Map</button>
        <button id="sites-nav" class="nav ${active === "sites" ? "active" : ""}">Sites</button>
        <button id="analytics-nav" class="nav ${active === "analytics" ? "active" : ""}">Analytics</button>
        <button id="reports-nav" class="nav ${active === "reports" ? "active" : ""}">Reports</button>
      </nav>
      <div class="header-actions"><span aria-label="Notifications">♧</span><button id="logout" class="avatar" aria-label="Sign out">AD</button></div>
    </header>`;
}

function renderLogin(): void {
  app.innerHTML = `
    <main class="auth-shell">
      <section class="auth-copy">
        <div class="eyebrow">SATELLITE INTELLIGENCE PLATFORM</div>
        <h1>See the waste.<br><em>Change the future.</em></h1>
        <p>WasteWatch helps cities find, track, and act on illegal dumping with AI-powered satellite monitoring.</p>
        <div class="visual-card"><div class="scan-line"></div><span>AI CHANGE DETECTION • DEMO VIEW</span><strong>WASTE<br>HOTSPOT</strong></div>
      </section>
      <section class="login-card">
        <div class="brand">${icon("✦")} WASTEWATCH</div>
        <h2>Welcome back</h2><p class="muted">Sign in to your monitoring workspace</p>
        <form id="login-form">
          <label>Admin ID<input id="email" type="text" placeholder="admin" required /></label>
          <label>Password<input id="password" type="password" placeholder="••••••••••" required /></label>
          <button class="primary wide">Enter dashboard <span>→</span></button>
          <div id="login-error" class="error"></div>
        </form>
        <div class="demo-box"><b>Demo access</b><br><span>ID</span> ${demoEmail}<br><span>Password</span> ${demoPassword}</div>
      </section>
    </main>`;
  document.querySelector<HTMLFormElement>("#login-form")!.onsubmit = (event) => {
    event.preventDefault();
    const email = document.querySelector<HTMLInputElement>("#email")!.value;
    const password = document.querySelector<HTMLInputElement>("#password")!.value;
    if (email === demoEmail && password === demoPassword) renderDashboard();
    else document.querySelector<HTMLDivElement>("#login-error")!.textContent = "Invalid demo credentials.";
  };
}

function trendSvg(values: number[]): string {
  const max = Math.max(...values);
  const points = values.map((value, index) => `${(index / 11) * 100},${94 - (value / max) * 78}`).join(" ");
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" class="trend-svg"><polyline points="${points}" /></svg>`;
}

function chennaiMap(areas: ChennaiArea[], category: "legal" | "illegal"): void {
  if (map) map.remove();
  const center: [number, number] = [13.0827, 80.2707];
  map = L.map("chennai-map", { zoomControl: false }).setView(center, 11);
  L.control.zoom({ position: "bottomright" }).addTo(map);
  const streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);
  const satelliteLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Tiles © Esri", maxZoom: 19 },
  );
  L.control.layers(
    { "Street map": streetLayer, "Satellite imagery": satelliteLayer },
    undefined,
    { position: "topright", collapsed: false },
  ).addTo(map);
  if (category === "illegal") {
    areas.filter((area) => area.category === "illegal").forEach((area) => {
      L.circleMarker(area.coordinates, {
        radius: 7,
        color: "#d94747",
        fillColor: "#e45757",
        fillOpacity: 0.95,
        weight: 2,
      }).bindTooltip(
        `<strong>${area.name}</strong><br>${area.detail}<br><small>Reported location · exact patch requires field verification</small>`,
        { direction: "top" },
      ).addTo(map!);
    });
  }
  map.fitBounds([[12.90, 80.15], [13.25, 80.38]], { padding: [12, 12] });
}

function chennaiAreaRows(areas: ChennaiArea[], category: "legal" | "illegal"): string {
  return areas.filter((area) => area.category === category).map((area, index) => `
    <div class="area-row ${category}">
      <div class="area-number ${category}">${String(index + 1).padStart(2, "0")}</div>
      <div class="area-title"><b>${area.name}${area.priority ? ' <span class="priority-tag">PRIORITY</span>' : ""}</b><small>${area.neighborhood} · ${area.facilityType} · ${area.detail}</small></div>
      ${category === "legal" ? `<div class="area-status ${category}">✓ ${area.status}</div><div class="area-updated"><b>${area.extent}</b><br>${area.wasteArea ?? area.updated}</div>` : ""}
    </div>`).join("");
}

function bindAppNav(): void {
  document.querySelector<HTMLButtonElement>("#logout")!.onclick = renderLogin;
  document.querySelector<HTMLButtonElement>("#overview-nav")!.onclick = renderDashboard;
  document.querySelector<HTMLButtonElement>("#map-nav")!.onclick = renderMapPage;
  document.querySelector<HTMLButtonElement>("#sites-nav")!.onclick = () => renderSitesPage("all");
  document.querySelector<HTMLButtonElement>("#analytics-nav")!.onclick = renderAnalyticsPage;
  document.querySelector<HTMLButtonElement>("#reports-nav")!.onclick = renderReportsPage;
}

function renderChennaiAreas(category: "legal" | "illegal"): void {
  renderSitesPage(category === "legal" ? "official" : "illegal");
}

function renderSitesPage(filter: "all" | "official" | "illegal" = "all"): void {
  const shown = chennaiAreas.filter((area) => filter === "all" || area.category === (filter === "official" ? "legal" : "illegal"));
  app.innerHTML = `<div class="app-shell">${dashboardSidebar("sites")}<main class="dashboard page-dashboard">
    <div class="page-title-row"><div><p class="eyebrow">CHENNAI / SITE DIRECTORY</p><h1>Waste Sites</h1><p class="muted">Official disposal locations and reported dumping areas.</p></div><button class="soft-button" id="sites-map-button">⌖ View map</button></div>
    <section class="panel sites-panel"><div class="site-tabs"><button data-filter="official" class="${filter === "official" ? "selected" : ""}">Official Sites <b>2</b></button><button data-filter="illegal" class="${filter === "illegal" ? "selected" : ""}">Reported Locations <b>12</b></button><button data-filter="all" class="${filter === "all" ? "selected" : ""}">All Sites <b>14</b></button><label class="table-search">⌕ <input id="site-search" placeholder="Search sites..." /></label></div>
    <div class="responsive-table"><table><thead><tr><th>#</th><th>Location</th><th>Approx. latitude</th><th>Approx. longitude</th><th>Reported waste types</th><th>Status</th><th>Action</th></tr></thead><tbody id="site-table-body">${siteTableRows(shown)}</tbody></table></div>
    <div class="pagination"><button disabled>‹</button><button class="current">1</button><button>2</button><button>3</button><button>›</button></div></section>
    <p class="source-note page-note">Coordinates are approximate report locations. Site area has not been measured in GIS; all illegal dumping candidates require field verification.</p>
    ${sourceLinksMarkup()}
  </main></div>`;
  bindAppNav();
  document.querySelector<HTMLButtonElement>("#sites-map-button")!.onclick = renderMapPage;
  document.querySelectorAll<HTMLButtonElement>("[data-filter]").forEach((button) => button.onclick = () => renderSitesPage(button.dataset.filter as "all" | "official" | "illegal"));
  document.querySelector<HTMLInputElement>("#site-search")!.oninput = (event) => {
    const query = (event.currentTarget as HTMLInputElement).value.toLowerCase();
    const filtered = shown.filter((area) => `${area.name} ${area.neighborhood} ${area.facilityType}`.toLowerCase().includes(query));
    document.querySelector<HTMLTableSectionElement>("#site-table-body")!.innerHTML = siteTableRows(filtered);
    wireSiteDetailButtons();
  };
  wireSiteDetailButtons();
}

function siteTableRows(areas: ChennaiArea[]): string {
  return areas.map((area, index) => `<tr><td>${index + 1}</td><td><b>${area.neighborhood}</b><small>${area.category === "legal" ? area.extent : area.facilityType}</small></td><td>${area.coordinates[0].toFixed(4)}</td><td>${area.coordinates[1].toFixed(4)}</td><td class="waste-type-cell">${area.wasteTypes?.join(", ") ?? "Municipal waste"}</td><td><span class="status-chip ${area.category}">${area.category === "legal" ? "Official" : "Requires verification"}</span></td><td><button class="row-view" data-site="${chennaiAreas.indexOf(area)}" aria-label="View ${area.neighborhood}">◉</button></td></tr>`).join("");
}

function wireSiteDetailButtons(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-site]").forEach((button) => button.onclick = () => renderSiteDetail(chennaiAreas[Number(button.dataset.site)]));
}

const illustrativePatchPlans: Record<string, { count: number; scale: number }> = {
  Nolambur: { count: 1, scale: 2.3 },
  "Mogappair West": { count: 3, scale: 0.82 },
  Gerugambakkam: { count: 2, scale: 1.08 },
  "Cowl Bazaar": { count: 1, scale: 2.1 },
  Kolapakkam: { count: 3, scale: 0.88 },
  "Perumbakkam Lake": { count: 2, scale: 1.12 },
  "Otteri Nullah": { count: 1, scale: 2.25 },
  "Mambalam Canal": { count: 2, scale: 1.05 },
  "Buckingham Canal · Kotturpuram": { count: 3, scale: 0.78 },
  "Cooum River · Anna Nagar": { count: 1, scale: 2.2 },
  "Mylapore Railway Station": { count: 2, scale: 1.1 },
  "Tondiarpet · Elaya Street": { count: 3, scale: 0.84 },
};

function illustrativeWastePatches(center: [number, number], seed: number, plan: { count: number; scale: number }): L.LatLngExpression[][] {
  const rotation = seed * 2.399;
  const offsets = plan.count === 1 ? [[18, -7]] : plan.count === 2 ? [[28, 5], [-42, 30]] : [[34, -4], [-40, 31], [14, -78]];
  const shapes: [number, number][][] = [
    [[-9, -5], [-2, -8], [8, -6], [10, 1], [5, 7], [-6, 6]],
    [[-8, -6], [3, -8], [9, -3], [8, 5], [-1, 8], [-9, 3]],
    [[-10, -4], [-4, -8], [7, -7], [11, -1], [7, 5], [-3, 8], [-10, 3]],
  ];
  return offsets.map(([east, north], patchIndex) => {
    const angle = rotation + patchIndex * 0.83;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const scale = plan.scale * (0.9 + ((seed + patchIndex) % 3) * 0.12);
    return shapes[patchIndex].map(([x, y]) => {
      const rotatedEast = east + (x * cos - y * sin) * scale;
      const rotatedNorth = north + (x * sin + y * cos) * scale;
      return [center[0] + rotatedNorth / 111320, center[1] + rotatedEast / (111320 * Math.cos(center[0] * Math.PI / 180))] as L.LatLngExpression;
    });
  });
}

function renderSiteDetail(area: ChennaiArea): void {
  const patchPlan = area.category === "illegal" ? illustrativePatchPlans[area.neighborhood] : undefined;
  app.innerHTML = `<div class="app-shell">${dashboardSidebar("sites")}<main class="dashboard page-dashboard">
    <button class="back-link" id="back-sites">← &nbsp;Back to Sites</button><div class="detail-heading"><div><h1>${area.category === "legal" ? `${area.neighborhood} Disposal Site` : `Reported location · ${area.neighborhood}`}</h1><span class="status-chip ${area.category}">${area.category === "legal" ? "Official Site" : "Requires verification"}</span></div></div>
    <div class="detail-layout"><section class="panel detail-gallery"><div id="detail-map" class="detail-map"></div><div class="site-area-legend">${area.category === "illegal" ? `<span class="waste-area-key"></span><b>Waste patches detected · ${patchPlan?.count ?? 2} illustrative ${patchPlan?.count === 1 ? "outline" : "outlines"}</b><small>These sample overlays are placed around the reported coordinate; exact waste boundaries are not verified.</small>` : area.neighborhood === "Perungudi / Pallikaranai" ? `<span class="waste-area-key"></span><b>Red outline: mapped Pallikaranai Dumpyard</b><small>Boundary: <a href="https://www.openstreetmap.org/way/84106307" target="_blank" rel="noreferrer">OpenStreetMap landfill feature</a>. It shows the mapped dumpyard perimeter, not individual current waste piles.</small>` : area.neighborhood === "Kodungaiyur" ? `<span class="waste-area-key"></span><b>Red outline: mapped Kodungaiyur landfill</b><small>Boundary: <a href="https://www.openstreetmap.org/way/29199633" target="_blank" rel="noreferrer">OpenStreetMap landfill feature</a>. It shows the mapped dumpyard perimeter, not individual current waste piles.</small>` : `<b class="site-area-unavailable">No verified waste boundary is available for this location.</b><small>This site has a registered facility coordinate but no mapped waste-patch geometry.</small>`}</div><div class="thumb-row"><button class="thumb selected">Satellite</button><button class="thumb">Street map</button><button class="thumb">Location</button></div></section>
      <section class="panel detail-facts"><div class="fact-row"><b>⌖ &nbsp;Location</b><span>${area.neighborhood}, Chennai</span></div><div class="fact-row"><b>⌖ &nbsp;Approx. coordinates</b><span>${area.coordinates[0].toFixed(4)}, ${area.coordinates[1].toFixed(4)}</span></div><div class="fact-row"><b>♧ &nbsp;${area.category === "legal" ? "Official site area" : "Waste area"}</b><span>${area.category === "legal" ? area.extent : "Not measured in GIS"}</span></div><div class="fact-row"><b>♻ &nbsp;Reported waste types</b><span>${area.wasteTypes?.join(", ") ?? "Municipal waste"}</span></div><div class="fact-row"><b>▣ &nbsp;Site status</b><span>${area.status}</span></div><div class="fact-row"><b>▦ &nbsp;Image date</b><span>Not provided · add acquisition date</span></div></section></div>
    <section class="panel detail-description"><h3>Report description</h3><p>${area.detail}</p><small class="source-note">${area.sourceUrl ? `Supporting report: <a href="${area.sourceUrl}" target="_blank" rel="noreferrer">${area.source}</a> · ${area.updated}` : `Source: ${area.source ?? area.updated}`}. Reported location only; exact dumping boundary and waste classification need field verification.</small><div class="detail-classification"><b>Suggested model label</b><span>Illegal dumping candidate</span><small>Do not infer individual materials from satellite imagery alone.</small></div></section>
  </main></div>`;
  bindAppNav();
  document.querySelector<HTMLButtonElement>("#back-sites")!.onclick = () => renderSitesPage("all");
  const detailMap = L.map("detail-map", { zoomControl: false }).setView(area.coordinates, 14); map = detailMap;
  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: "Tiles © Esri", maxZoom: 19 }).addTo(detailMap);
  const mappedWasteBoundary = area.neighborhood === "Perungudi / Pallikaranai"
    ? perungudiDumpyardBoundary
    : area.neighborhood === "Kodungaiyur"
      ? kodungaiyurDumpyardBoundary
      : undefined;
  if (area.category === "illegal") {
    const demoLayer = L.featureGroup().addTo(detailMap);
    const siteSeed = chennaiAreas.indexOf(area) + 1;
    illustrativeWastePatches(area.coordinates, siteSeed, patchPlan ?? { count: 2, scale: 1 }).forEach((patch) => {
      L.polygon(patch, {
        color: "#ff392f", fillColor: "#ed493a", fillOpacity: 0.58, weight: 3, opacity: 1,
      }).bindTooltip("Waste patch detected").addTo(demoLayer);
    });
    detailMap.fitBounds(demoLayer.getBounds(), { padding: [36, 36], maxZoom: 17 });
  } else if (mappedWasteBoundary) {
    const boundary = L.polygon(mappedWasteBoundary, {
      color: "#e53935", fillColor: "#f04438", fillOpacity: 0.2, weight: 3, opacity: 0.96,
    }).bindTooltip(`${area.neighborhood} · mapped landfill perimeter`).addTo(detailMap);
    detailMap.fitBounds(boundary.getBounds(), { padding: [18, 18] });
  }
}

function renderDashboard(): void {
  const categoryMentions = [
    { name: "Construction & demolition", match: /construction|building materials/i, color: "green" },
    { name: "Furniture", match: /furniture/i, color: "lime" },
    { name: "Plastic", match: /plastic/i, color: "mint" },
    { name: "Mixed municipal", match: /mixed municipal|mixed garbage/i, color: "green" },
    { name: "Organic / food", match: /food waste|vegetables|organic waste/i, color: "lime" },
    { name: "Biomedical (reported)", match: /biomedical/i, color: "amber" },
  ].map((category) => ({ ...category, count: chennaiAreas.filter((area) => area.category === "illegal" && area.wasteTypes?.some((type) => category.match.test(type))).length }));
  app.innerHTML = `
    <div class="app-shell">
      ${dashboardSidebar("overview")}
      <main class="dashboard page-dashboard">
        <section class="welcome-row"><div><p class="eyebrow">GEO WASTE INTELLIGENCE · CHENNAI</p><h1>Welcome back, Chennai</h1><p class="muted">Here’s your city waste monitoring overview.</p></div><div class="welcome-mark"><span>🌿</span><div><b>GeoWasteAI</b><small>Satellite monitoring active</small></div></div></section>
        <section class="stat-strip dashboard-stats">${statCard("⌖", "14", "Locations in registry", "green")}${statCard("◉", "2", "Official disposal sites", "olive")}${statCard("△", "12", "Reported candidates", "red")}${statCard("✦", "5", "Priority study areas", "lime")}</section>
        <section class="dashboard-main-grid">
          <article class="panel dashboard-card waste-trend-card"><div class="card-heading"><div><h2>Recommended study areas</h2><p>Initial locations suggested for model development</p></div><span class="model-badge">Priority 5</span></div><div class="focus-area-list">${["Gerugambakkam", "Perumbakkam Lake", "Nolambur", "Mogappair West", "Cowl Bazaar"].map((name, index) => { const area = chennaiAreas.find((item) => item.neighborhood === name)!; return `<div class="focus-area-row"><span>${String(index + 1).padStart(2, "0")}</span><div><b>${name}</b><small>${area.wasteTypes?.slice(0, 2).join(" · ")}</small></div><i class="focus-arrow">↗</i></div>`; }).join("")}</div><div class="chart-footnote"><span><i></i>Study priority from project research notes</span><button class="text-link" id="model-guide-link">Model guide →</button></div></article>
          <article class="panel dashboard-card distribution-card"><div class="card-heading"><div><h2>Site distribution</h2><p>Chennai monitoring registry</p></div><span class="card-more">•••</span></div><div class="site-donut"><div><b>14</b><small>Locations listed</small></div></div><div class="distribution-legend"><span><i class="legend-dot legal"></i>Official disposal sites <b>2</b></span><span><i class="legend-dot illegal"></i>Reported candidates <b>12</b></span></div><div class="distribution-note">All reported candidate areas require field verification.</div></article>
          <article class="panel dashboard-card waste-category-card"><div class="card-heading"><div><h2>Reported waste types</h2><p>Mentions across supplied location reports</p></div><span class="model-badge">6 categories</span></div><div class="reported-type-list">${categoryMentions.map((category) => `<div class="reported-type-row"><span class="type-color ${category.color}"></span><b>${category.name}</b><span class="type-count">${category.count} ${category.count === 1 ? "location" : "locations"}</span><div class="type-meter"><i class="${category.color}" style="width:${Math.max(8, (category.count / 12) * 100)}%"></i></div></div>`).join("")}</div><p class="category-footnote">Categories may overlap. These are report mentions, not AI-confirmed material classifications.</p></article>
          <article class="panel dashboard-card detection-guidance-card"><div class="card-heading"><div><h2>Satellite detection potential</h2><p>Initial model guidance from project research</p></div><button class="text-link" id="dashboard-guide-link">Full guide <span>→</span></button></div><div class="potential-summary"><div class="potential-summary-row"><span class="potential high">High</span><b>Construction waste</b><small>Concrete, bricks, tiles, rubble</small></div><div class="potential-summary-row"><span class="potential medium">Medium</span><b>Plastic · mixed · furniture</b><small>Visible accumulation and surface patterns</small></div><div class="potential-summary-row"><span class="potential low">Low–Medium</span><b>Organic · biomedical</b><small>Material identity needs field confirmation</small></div></div><div class="model-warning"><b>Model focus</b><span>Detect accumulation zones first. Satellite imagery cannot reliably identify every individual waste material.</span></div></article>
        </section>
      </main>
    </div>`;
  bindAppNav();
  document.querySelector<HTMLButtonElement>("#model-guide-link")!.onclick = renderAnalyticsPage;
  document.querySelector<HTMLButtonElement>("#dashboard-guide-link")!.onclick = renderAnalyticsPage;
}

function statCard(symbol: string, value: string, label: string, color: string, suffix = ""): string {
  return `<article class="stat-card ${color}"><span class="stat-icon">${symbol}</span><div><strong>${value}<small>${suffix}</small></strong><p>${label}</p></div></article>`;
}

function renderMapPage(): void {
  app.innerHTML = `<div class="app-shell">${dashboardSidebar("map")}<main class="dashboard page-dashboard map-page">
    <div class="page-title-row map-page-heading"><div><p class="eyebrow">CHENNAI / SATELLITE EXPLORER</p><h1>Explore an area over time</h1><p class="muted">Search a Chennai place, inspect its boundary and browse archived satellite imagery.</p></div></div>
    <section class="map-explorer-controls"><form id="place-search-form" class="map-place-search"><span>⌕</span><input id="map-search" autocomplete="off" placeholder="Search a neighbourhood or place in Chennai" aria-label="Search a place in Chennai"><button>Search</button></form>
      <label class="map-year-select">Imagery release<select id="map-year"><option value="current">Latest imagery</option><option value="2015">2015</option><option value="2018">2018</option><option value="2020">2020</option><option value="2024">2024</option></select></label>
      <label class="map-compare-toggle"><input id="map-compare" type="checkbox"> Compare two years</label>
      <div class="map-year-select compare-year-select" hidden><label>Compare with<select id="compare-year"><option value="2015">2015</option><option value="2018">2018</option><option value="2020" selected>2020</option><option value="2024">2024</option></select></label></div>
    </section><div id="place-search-status" class="map-status" aria-live="polite">Showing Chennai. Search a place to outline its mapped boundary.</div>
    <div class="map-filter-row"><b>Site markers</b><div class="map-filters"><button class="selected" data-map-filter="all">All</button><button data-map-filter="legal">Official</button><button data-map-filter="illegal">Reported candidates</button></div><span>Markers show registry locations; they do not represent verified detections for the selected year.</span></div>
    <div id="map-stage" class="map-stage explorer-stage"><div id="full-map"></div><div id="map-tile-warning" class="map-tile-warning" hidden></div><div class="map-legend-card"><b>Map legend</b><span><i class="legend-dot legal"></i>Official facility location</span><span><i class="legend-dot illegal"></i>Reported candidate coordinate</span><span class="boundary-legend"><i></i>Selected place boundary</span><small>Markers show registered locations only. No waste patch is outlined without a verified polygon.</small></div></div>
    <div class="imagery-note"><b>About historical imagery</b><span>Years refer to Esri Wayback basemap release dates, not necessarily the capture date of every image tile. Historical waste markers are not inferred without dated, validated detections.</span><a href="https://livingatlas.arcgis.com/wayback/" target="_blank" rel="noreferrer">Esri Wayback details ↗</a></div>
  </main></div>`;
  bindAppNav();

  type WaybackRelease = { year: number; date: string; id: string };
  type PlaceResult = { display_name: string; lat: string; lon: string; boundingbox: string[]; geojson?: GeoJSON.GeoJsonObject };
  const stage = document.querySelector<HTMLDivElement>("#map-stage")!;
  const status = document.querySelector<HTMLDivElement>("#place-search-status")!;
  const search = document.querySelector<HTMLInputElement>("#map-search")!;
  const currentYear = document.querySelector<HTMLSelectElement>("#map-year")!;
  const compareToggle = document.querySelector<HTMLInputElement>("#map-compare")!;
  const compareWrap = document.querySelector<HTMLDivElement>(".compare-year-select")!;
  const compareYear = document.querySelector<HTMLSelectElement>("#compare-year")!;
  let filter: "all" | "legal" | "illegal" = "all";
  let placeCenter: [number, number] = [13.0827, 80.245];
  let placeBounds: [[number, number], [number, number]] = [[12.85, 80.10], [13.22, 80.33]];
  let boundary: GeoJSON.GeoJsonObject | undefined;
  let placeLabel = "Chennai";
  let releases: WaybackRelease[] = [];
  let compareMaps: L.Map[] = [];
  let mainMap: L.Map | undefined;
  const markerLayer = () => {
    const group = L.layerGroup();
    const selectedBounds = L.latLngBounds(placeBounds[0], placeBounds[1]);
    chennaiAreas.filter((area) => selectedBounds.contains(area.coordinates) && (filter === "all" || area.category === filter)).forEach((area) => {
      const legal = area.category === "legal";
      L.circleMarker(area.coordinates, { radius: legal ? 9 : 7, color: "#fff", fillColor: legal ? "#26833b" : "#e83e35", fillOpacity: .98, weight: 2 })
        .bindTooltip(`<b>${area.neighborhood}</b><br>${legal ? "Official facility location · no current waste footprint mapped" : `Reported candidate coordinate · ${area.coordinates[0].toFixed(4)}, ${area.coordinates[1].toFixed(4)} · verify`}`)
        .addTo(group);
    });
    return group;
  };
  const boundaryLayer = () => boundary ? L.geoJSON(boundary, { style: { color: "#f8fff1", weight: 4, opacity: 1, fillColor: "#93d347", fillOpacity: .06, dashArray: "8 5" } }) : L.layerGroup();
  const releaseForYear = (year: number): WaybackRelease | undefined => releases.filter((release) => release.year === year).sort((a, b) => b.date.localeCompare(a.date))[0];
  const imageryLayer = (year: number | "current"): L.TileLayer => {
    if (year === "current") return L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: "Tiles © Esri", maxZoom: 19 });
    const release = releaseForYear(year);
    if (!release) {
      status.textContent = `No Esri Wayback release found for ${year} in the archive catalogue. Showing latest imagery.`;
      return imageryLayer("current");
    }
    return L.tileLayer(`https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/${release.id}/{z}/{y}/{x}`, { attribution: `Imagery © Esri · Wayback release ${release.date}`, maxZoom: 19 });
  };
  const setMap = (element: string, year: number | "current"): L.Map => {
    const next = L.map(element, { zoomControl: false }).fitBounds(placeBounds, { padding: [18, 18] });
    L.control.zoom({ position: "topleft" }).addTo(next);
    const satellite = imageryLayer(year);
    let tileErrors = 0;
    let fallbackAdded = false;
    let tileLoaded = false;
    const warnTiles = (message: string) => {
      const warning = document.querySelector<HTMLDivElement>("#map-tile-warning");
      if (warning) { warning.hidden = false; warning.textContent = message; }
    };
    const showOSMFallback = () => {
      const street = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors · satellite imagery unavailable",
        maxZoom: 19,
      });
      let streetErrors = 0;
      street.on("tileload", () => {
        const warning = document.querySelector<HTMLDivElement>("#map-tile-warning");
        if (warning) warning.hidden = true;
      });
      street.on("tileerror", () => {
        streetErrors += 1;
        if (streetErrors >= 2) warnTiles("Map imagery is blocked or offline. Registry markers remain available; reconnect to load map tiles.");
      });
      street.addTo(next);
      status.textContent = "Satellite tiles could not be loaded. Trying the street map fallback.";
    };
    const showStreetFallback = () => {
      if (fallbackAdded || tileLoaded || !next.hasLayer(satellite)) return;
      fallbackAdded = true;
      satellite.remove();
      if (year === "current") { showOSMFallback(); return; }
      const latestSatellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles © Esri · latest imagery shown because the selected archive release is unavailable",
        maxZoom: 19,
      });
      let latestErrors = 0;
      latestSatellite.on("tileload", () => {
        const warning = document.querySelector<HTMLDivElement>("#map-tile-warning");
        if (warning) warning.hidden = true;
        status.textContent = `The ${year} archive tiles are unavailable here. Showing the latest satellite imagery instead.`;
      });
      latestSatellite.on("tileerror", () => {
        latestErrors += 1;
        if (latestErrors >= 3 && next.hasLayer(latestSatellite)) {
          latestSatellite.remove();
          showOSMFallback();
        }
      });
      latestSatellite.addTo(next);
      status.textContent = `The ${year} archive tiles could not be loaded. Trying the latest satellite imagery…`;
    };
    satellite.on("tileload", () => { tileLoaded = true; tileErrors = 0; });
    satellite.on("tileerror", () => {
      tileErrors += 1;
      if (tileErrors >= 3) showStreetFallback();
    });
    satellite.addTo(next);
    window.setTimeout(showStreetFallback, 8000);
    boundaryLayer().addTo(next);
    markerLayer().addTo(next);
    return next;
  };
  const renderMaps = () => {
    const oldMaps = new Set<L.Map>([...(mainMap ? [mainMap] : []), ...compareMaps]);
    oldMaps.forEach((oldMap) => oldMap.remove());
    if (map && !oldMaps.has(map)) map.remove();
    mainMap = undefined;
    compareMaps = [];
    map = undefined;
    if (compareToggle.checked) {
      const firstYear = currentYear.value === "current" ? 2024 : Number(currentYear.value);
      stage.innerHTML = `<div class="comparison-map-grid"><section><header>${placeLabel} · ${firstYear}</header><div id="compare-map-a"></div></section><section><header>${placeLabel} · ${compareYear.value}</header><div id="compare-map-b"></div></section></div><div id="map-tile-warning" class="map-tile-warning" hidden></div><div class="map-legend-card"><b>Map legend</b><span><i class="legend-dot legal"></i>Official facility location</span><span><i class="legend-dot illegal"></i>Reported candidate coordinate</span><span class="boundary-legend"><i></i>Selected place boundary</span><small>Markers show registered locations only. No waste patch is outlined without a verified polygon.</small></div>`;
      compareMaps = [setMap("compare-map-a", firstYear), setMap("compare-map-b", Number(compareYear.value))];
      map = compareMaps[0];
    } else {
      stage.innerHTML = `<div id="full-map"></div><div id="map-tile-warning" class="map-tile-warning" hidden></div><div class="map-legend-card"><b>Map legend</b><span><i class="legend-dot legal"></i>Official facility location</span><span><i class="legend-dot illegal"></i>Reported candidate coordinate</span><span class="boundary-legend"><i></i>Selected place boundary</span><small>Markers show registered locations only. No waste patch is outlined without a verified polygon.</small></div>`;
      mainMap = setMap("full-map", currentYear.value === "current" ? "current" : Number(currentYear.value)); map = mainMap;
    }
    if (boundary) status.textContent = `${placeLabel} · boundary loaded from OpenStreetMap place data. Registry locations are contextual markers, not year-specific AI detections.`;
    else status.textContent = `${placeLabel} · no boundary polygon was provided by place search; showing the selected location and registry markers.`;
  };
  const loadReleases = async () => {
    try {
      const response = await fetch("https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/WMTS/1.0.0/WMTSCapabilities.xml");
      if (!response.ok) throw new Error("Archive catalogue unavailable");
      const xml = new DOMParser().parseFromString(await response.text(), "application/xml");
      releases = Array.from(xml.getElementsByTagNameNS("*", "Layer")).flatMap((layer) => {
        const title = layer.getElementsByTagNameNS("*", "Title")[0]?.textContent ?? "";
        const id = layer.getElementsByTagNameNS("*", "Identifier")[0]?.textContent ?? "";
        const date = title.match(/(20\d{2})[-–](\d{2})[-–](\d{2})/);
        return date && id ? [{ year: Number(date[1]), date: date[0].replace("–", "-"), id }] : [];
      });
      if (!releases.length) throw new Error("No dated archive releases found");
      status.textContent = "Historical imagery archive connected. Choose a year to load its nearest published release.";
      if (currentYear.value !== "current") renderMaps();
    } catch {
      status.textContent = "Historical imagery catalogue could not be reached. Check the connection or use latest imagery.";
    }
  };
  const geocode = async (query: string) => {
    const local = chennaiAreas.find((area) => `${area.name} ${area.neighborhood}`.toLowerCase().includes(query.toLowerCase()));
    if (local) {
      placeCenter = local.coordinates;
      placeBounds = [[local.coordinates[0] - .012, local.coordinates[1] - .012], [local.coordinates[0] + .012, local.coordinates[1] + .012]];
      boundary = undefined;
      placeLabel = local.neighborhood;
      search.value = local.neighborhood;
      renderMaps();
      status.textContent = `Showing ${placeLabel} from the project registry. Looking up the mapped neighborhood boundary…`;
    }
    status.textContent = "Searching Chennai place boundaries…";
    try {
      const params = new URLSearchParams({ q: `${query}, Chennai, Tamil Nadu, India`, format: "jsonv2", limit: "1", addressdetails: "1", polygon_geojson: "1", viewbox: "80.00,13.35,80.45,12.80", bounded: "1" });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error("Place search failed");
      const matches = await response.json() as PlaceResult[];
      if (!matches[0]) {
        if (local) {
          status.textContent = `${placeLabel} shown using its approximate registry coordinates. No mapped boundary was returned.`; return;
        }
        status.textContent = "No matching Chennai place found. Try a neighbourhood name such as Adyar, Velachery or T. Nagar."; return;
      }
      const result = matches[0]; placeCenter = [Number(result.lat), Number(result.lon)]; placeLabel = result.display_name.split(",").slice(0, 2).join(",");
      placeBounds = [[Number(result.boundingbox[0]), Number(result.boundingbox[2])], [Number(result.boundingbox[1]), Number(result.boundingbox[3])]];
      boundary = result.geojson; renderMaps(); search.value = placeLabel;
    } catch {
      if (local) {
        status.textContent = `${placeLabel} shown using its approximate registry coordinates. Neighborhood boundary lookup timed out.`; return;
      }
      status.textContent = "Place search is temporarily unavailable. Use the known Chennai registry locations or try again later.";
    }
  };
  document.querySelector<HTMLFormElement>("#place-search-form")!.onsubmit = (event) => { event.preventDefault(); const query = search.value.trim(); if (query) void geocode(query); };
  document.querySelectorAll<HTMLButtonElement>("[data-map-filter]").forEach((button) => button.onclick = () => {
    filter = button.dataset.mapFilter as "all" | "legal" | "illegal";
    document.querySelectorAll("[data-map-filter]").forEach((item) => item.classList.toggle("selected", item === button)); renderMaps();
  });
  currentYear.onchange = renderMaps;
  compareYear.onchange = renderMaps;
  compareToggle.onchange = () => { compareWrap.hidden = !compareToggle.checked; renderMaps(); };
  renderMaps(); void loadReleases();
}

function renderAnalyticsPage(): void {
  app.innerHTML = `<div class="app-shell">${dashboardSidebar("analytics")}<main class="dashboard page-dashboard">
    <div class="page-title-row"><div><p class="eyebrow">CHENNAI / INSIGHTS</p><h1>Waste Analysis</h1><p class="muted">Source-backed location data and AI planning guidance.</p></div></div>
    <div class="analytics-grid"><section class="panel chart-panel priority-analytics"><h3>Recommended initial study areas</h3><p>Research priorities supplied for the first model study.</p><div class="focus-area-list">${["Gerugambakkam", "Perumbakkam Lake", "Nolambur", "Mogappair West", "Cowl Bazaar"].map((name, index) => { const area = chennaiAreas.find((item) => item.neighborhood === name)!; return `<div class="focus-area-row"><span>${String(index + 1).padStart(2, "0")}</span><div><b>${name}</b><small>${area.wasteTypes?.join(" · ")}</small></div><i class="priority-tag">PRIORITY</i></div>`; }).join("")}</div></section>
      <section class="panel distribution-panel"><h3>Registry distribution</h3><div class="donut"><div><b>14</b><span>Locations</span></div></div><div class="donut-legend"><span><i class="legend-dot legal"></i>Official disposal sites (2)<b>14%</b></span><span><i class="legend-dot illegal"></i>Reported candidates (12)<b>86%</b></span></div></section></div>
    <section class="analytics-metrics">${statCard("△", "12", "Reported candidates · verify", "red")}${statCard("◉", "2", "Official GCC sites", "green")}${statCard("✦", "5", "Priority study areas", "lime")}${statCard("⌖", "12", "Approx. coordinates supplied", "olive")}</section>
    <section class="panel model-guide"><div class="model-guide-head"><div><p class="eyebrow">AI TRAINING GUIDE</p><h2>Waste categories &amp; satellite detection</h2><p>Start by locating waste accumulation and visible surface changes. Satellite imagery cannot reliably identify every individual material.</p></div><span class="model-badge">Candidate labels</span></div>
      <div class="category-grid"><article><span class="category-symbol">▧</span><div><b>Plastic waste</b><small>Bags, bottles, packaging</small></div><em class="potential medium">Medium</em></article><article><span class="category-symbol">▤</span><div><b>Construction waste</b><small>Concrete, bricks, tiles, rubble</small></div><em class="potential high">High</em></article><article><span class="category-symbol">♧</span><div><b>Organic waste</b><small>Vegetables, food, garden waste</small></div><em class="potential low">Low–Medium</em></article><article><span class="category-symbol">◉</span><div><b>Mixed municipal waste</b><small>Household garbage, mixed refuse</small></div><em class="potential medium">Medium</em></article><article><span class="category-symbol">⌂</span><div><b>Furniture waste</b><small>Sofas, wood, mattresses</small></div><em class="potential medium">Medium</em></article><article><span class="category-symbol">＋</span><div><b>Biomedical waste</b><small>Medical waste, discarded materials</small></div><em class="potential low">Low–Medium</em></article></div>
      <div class="model-caveat"><b>Imagery limitation</b><span>Use AI to flag possible accumulation areas and surface characteristics. Confirm waste type and site boundaries with field inspection.</span></div>
      <div class="priority-study"><b>Recommended initial study areas</b><div>${["Gerugambakkam", "Perumbakkam Lake", "Nolambur", "Mogappair West", "Cowl Bazaar"].map((name, i) => `<span><i>${i + 1}</i>${name}</span>`).join("")}</div></div>
      <div class="dataset-schema"><b>Suggested dataset fields</b><div><span>Site ID <code>ILG001</code></span><span>Location</span><span>Latitude / longitude</span><span>Waste type</span><span>Site status</span><span>Image date</span><span>GIS area</span><span>Classification <code>Illegal dumping candidate</code></span></div><small>Keep image acquisition date and measured area blank until known; do not fabricate satellite dates or GIS measurements.</small></div>
    </section>
    <p class="source-note page-note">No waste tonnage or GIS area measurements were supplied for these reported locations. Coordinates are approximate and status is “Requires verification.”</p>${sourceLinksMarkup()}
  </main></div>`;
  bindAppNav();
}

function renderReportsPage(): void {
  app.innerHTML = `<div class="app-shell">${dashboardSidebar("reports")}<main class="dashboard page-dashboard">
    <div class="page-title-row"><div><p class="eyebrow">CHENNAI / EXPORTS</p><h1>Generate Report</h1><p class="muted">Export the source-backed location register and research fields.</p></div></div>
    <section class="panel report-generator"><div class="report-art"><div class="report-leaf">🌿</div><svg viewBox="0 0 180 190" role="img" aria-label="Report illustration"><rect x="32" y="20" width="116" height="150" rx="12" fill="#fff" stroke="#246b32" stroke-width="8"/><rect x="72" y="8" width="36" height="20" rx="8" fill="#246b32"/><path d="M55 133h70M55 148h46" stroke="#8cbd83" stroke-width="7" stroke-linecap="round"/><path d="M57 115v-28h18v28m10 0V69h18v46m10 0V55h18v60" fill="#83c957"/></svg></div>
      <form id="report-form" class="report-form"><label>Report Type<select id="report-type"><option>Waste Dumping Summary</option><option>Official Site Overview</option><option>Reported Location Register</option></select></label><label>Year<select id="report-year"><option>2025</option><option>2024</option><option>2023</option><option>2022</option></select></label><label>Location<select id="report-area"><option>All Chennai</option>${chennaiAreas.map((item) => `<option>${item.neighborhood}</option>`).join("")}</select></label><button class="generate-button">⇩ &nbsp;Generate Report</button><p id="report-feedback" class="report-feedback" aria-live="polite"></p></form></section>
    <section class="recent-reports"><h2>Recent Reports</h2><div id="recent-report-list"><article class="empty-report"><span class="empty-report-icon">▤</span><div><b>No reports generated yet</b><small>Generated CSV reports will appear here after download.</small></div></article></div></section>
  </main></div>`;
  bindAppNav();
  document.querySelector<HTMLFormElement>("#report-form")!.onsubmit = (event) => {
    event.preventDefault();
    const type = document.querySelector<HTMLSelectElement>("#report-type")!.value;
    const year = document.querySelector<HTMLSelectElement>("#report-year")!.value;
    const area = document.querySelector<HTMLSelectElement>("#report-area")!.value;
    const selectedAreas = chennaiAreas.filter((item) => area === "All Chennai" || item.neighborhood === area);
    const rows: string[][] = type === "Reported Location Register"
      ? [["Site ID", "Location", "Approx. latitude", "Approx. longitude", "Reported waste types", "Site status", "Image date", "Area", "Classification", "Supporting source"], ...selectedAreas.filter((item) => item.category === "illegal").map((item) => [`ILG${String(chennaiAreas.filter((candidate) => candidate.category === "illegal").indexOf(item) + 1).padStart(3, "0")}`, item.neighborhood, item.coordinates[0].toFixed(4), item.coordinates[1].toFixed(4), item.wasteTypes?.join("; ") ?? "Not specified", "Requires verification", "", "To be measured in GIS", "Illegal dumping candidate", item.updated])]
      : type === "Official Site Overview"
        ? [["Site ID", "Location", "Latitude", "Longitude", "Area", "Waste area", "Status", "Source"], ...selectedAreas.filter((item) => item.category === "legal").map((item) => [`OFF${String(chennaiAreas.filter((candidate) => candidate.category === "legal").indexOf(item) + 1).padStart(3, "0")}`, item.neighborhood, item.coordinates[0].toFixed(4), item.coordinates[1].toFixed(4), item.extent, item.wasteArea ?? "", item.status, item.source ?? item.updated])]
        : [["GeoWasteAI Chennai Waste Monitoring Report"], ["Report type", type], ["Year", year], ["Location", area], [], ["Site ID", "Location", "Latitude", "Longitude", "Reported waste types / site type", "Site status", "Image date", "Area", "Classification", "Source"], ...selectedAreas.map((item, index) => [
          `${item.category === "legal" ? "OFF" : "ILG"}${String(chennaiAreas.filter((candidate) => candidate.category === item.category).indexOf(item) + 1).padStart(3, "0")}`,
          item.neighborhood,
          item.coordinates[0].toFixed(4),
          item.coordinates[1].toFixed(4),
          item.wasteTypes?.join("; ") ?? item.facilityType,
          item.category === "legal" ? item.status : "Requires verification",
          "",
          item.category === "legal" ? item.extent : "To be measured in GIS",
          item.category === "legal" ? "Official disposal site" : "Illegal dumping candidate",
          item.updated,
        ])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const fileLabel = type.replaceAll(" ", "_");
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `Chennai_${fileLabel}_${year}.csv`; anchor.click(); URL.revokeObjectURL(url);
    document.querySelector<HTMLParagraphElement>("#report-feedback")!.textContent = "Report downloaded as CSV.";
    document.querySelector<HTMLDivElement>("#recent-report-list")!.insertAdjacentHTML("afterbegin", `<article class="recent-report"><span class="pdf-icon">CSV</span><div><b>Chennai_${fileLabel}_${year}.csv</b><small>${type} · ${area} · Just generated</small></div><span class="recent-download">✓</span></article>`);
  };
}

function metric(label: string, value: string, note: string, type: string): string {
  return `<div class="metric"><span>${label}</span><strong>${value}</strong><small class="${type}">${note}</small></div>`;
}
function coverageBar(label: string, value: string, width: number, color: string): string {
  return `<div class="coverage-row"><div><span>${label}</span><b>${value}</b></div><div class="bar"><i class="${color}" style="width:${width}%"></i></div></div>`;
}
function reportRows(): string {
  return selected.reports.map((report) => `<div class="report-row"><div class="report-icon">⌁</div><div class="report-title"><b>${report.title}</b><small>Detected ${report.age} · Estimated waste volume ${report.volume}</small></div><span class="risk ${report.risk.toLowerCase()}">${report.risk} risk</span><button class="view-btn">View report</button></div>`).join("");
}

function renderMap(): void {
  if (map) map.remove();
  map = L.map("map", { zoomControl: false }).setView(selected.coordinates, 12);
  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors" }).addTo(map);
}

function showOverview(): void {
  const results = document.querySelector<HTMLDivElement>("#search-results")!;
  results.innerHTML = `<div class="recent-locations"><div><h2>Reported locations</h2><p class="muted">Explore reported areas and official sites across Chennai.</p></div><div class="location-chips">${chennaiAreas.slice(0, 4).map((area) => `<button data-location="${chennaiAreas.indexOf(area)}"><span class="${area.category}">●</span>${area.neighborhood}<small>${area.category === "legal" ? "Official site" : "Reported · verify"}</small></button>`).join("")}<button class="all-locations" id="all-locations">Browse all sites →</button></div></div>`;
  document.querySelectorAll<HTMLButtonElement>("[data-location]").forEach((button) => button.onclick = () => showSearchResult(chennaiAreas[Number(button.dataset.location)]));
  document.querySelector<HTMLButtonElement>("#all-locations")!.onclick = () => renderSitesPage("all");
}

function showSearchResult(area: ChennaiArea): void {
  searchedArea = area;
  const results = document.querySelector<HTMLDivElement>("#search-results")!;
  results.innerHTML = `
    <div class="search-result location-result">
      <div class="result-columns">
        <div id="map" class="search-map"></div>
        <div class="result-details-panel">
          <div class="result-heading"><b>${area.name}</b><span class="priority-tag">REPORTED DUMPING</span></div>
          <p>${area.detail}</p>
          <div class="result-details"><span><b>Coordinates</b><br>${area.coordinates[0].toFixed(5)}, ${area.coordinates[1].toFixed(5)}</span><span><b>Evidence status</b><br>Reported location</span></div>
          <small>Satellite view is centred on this reported area. Exact waste boundaries require field verification.</small>
        </div>
      </div>
      <div class="yearly-action">
        <button id="yearly-button" class="yearly-button">Yearly calculation <span>→</span></button>
        <div id="yearly-controls"></div>
      </div>
    </div>`;
  if (map) map.remove();
  const satelliteMap = L.map("map", { zoomControl: false }).setView(area.coordinates, 15);
  map = satelliteMap;
  L.control.zoom({ position: "bottomright" }).addTo(satelliteMap);
  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Tiles © Esri", maxZoom: 19 },
  ).addTo(satelliteMap);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    opacity: 0.25,
    maxZoom: 19,
  }).addTo(satelliteMap);
  L.circleMarker(area.coordinates, {
    radius: 10,
    color: "#d94747",
    fillColor: "#e45757",
    fillOpacity: 0.95,
    weight: 3,
  }).bindTooltip(`${area.name}<br>${area.detail}`).addTo(satelliteMap);
  L.rectangle(
    [[area.coordinates[0] - 0.004, area.coordinates[1] - 0.004], [area.coordinates[0] + 0.004, area.coordinates[1] + 0.004]],
    { color: "#ff3b30", weight: 3, fillOpacity: 0.08, dashArray: "8 6" },
  ).bindTooltip("Reported waste area — boundary to verify").addTo(satelliteMap);
  document.querySelector<HTMLButtonElement>("#yearly-button")!.onclick = () => showYearControls(area);
}

function showYearControls(area: ChennaiArea): void {
  const controls = document.querySelector<HTMLDivElement>("#yearly-controls")!;
  const yearOptions = Array.from({ length: 26 }, (_, index) => 2000 + index)
    .map((year) => `<option value="${year}">${year}</option>`).join("");
  controls.innerHTML = `
    <div class="year-controls">
      <b>Select two or three comparison years</b>
      <label>Year 1<select class="comparison-year">${yearOptions}</select></label>
      <label>Year 2<select class="comparison-year">${yearOptions}</select></label>
      <label>Year 3 <span class="optional-year">(optional)</span><select class="comparison-year"><option value="">None</option>${yearOptions}</select></label>
      <button id="compare-years" class="compare-button">Compare years</button>
    </div>`;
  document.querySelector<HTMLButtonElement>("#compare-years")!.onclick = () => {
    const years = Array.from(document.querySelectorAll<HTMLSelectElement>(".comparison-year"))
      .map((select) => Number(select.value))
      .filter((year) => year > 0);
    const uniqueYears = [...new Set(years)];
    if (uniqueYears.length < 2 || uniqueYears.length > 3) {
      controls.insertAdjacentHTML("beforeend", '<small class="year-error">Choose two or three different years.</small>');
      return;
    }
    renderYearlyComparison(area, uniqueYears.sort((a, b) => a - b));
  };
}

function renderYearlyComparison(area: ChennaiArea, years: number[]): void {
  const controls = document.querySelector<HTMLDivElement>("#yearly-controls")!;
  const baseWaste = area.category === "illegal" ? 18 + area.name.length % 8 : 0;
  const values = years.map((year, index) => ({
    year,
    waste: Math.round(baseWaste * (0.62 + index * 0.21)),
  }));
  const increased = values[values.length - 1].waste > values[0].waste;
  controls.innerHTML = `
    <div class="comparison-header"><div><b>Yearly waste comparison</b><small>${area.name} · reported dumping area</small></div><span class="${increased ? "increase" : "decrease"}">${increased ? "↑ Increased" : "↓ Decreased"}</span></div>
    <div class="yearly-grid">${values.map((item) => `
      <div class="year-card">
        <div class="year-card-head"><b>${item.year}</b><span>Satellite view</span></div>
        <div id="year-map-${item.year}" class="year-satellite-map"></div>
        <div class="waste-estimate"><strong>${item.waste} units</strong><small>Estimated waste footprint</small></div>
        <div class="year-card-detail"><span>Waste type</span><b>${area.detail}</b></div>
        <div class="year-card-detail"><span>Coordinates</span><b>${area.coordinates[0].toFixed(5)}, ${area.coordinates[1].toFixed(5)}</b></div>
      </div>`).join("")}</div>
    <div class="comparison-summary"><b>${increased ? "Waste dumping increased across the selected years." : "Waste dumping did not increase across the selected years."}</b><small>These are comparison estimates for the prototype. Confirm with dated imagery and field evidence before enforcement.</small>${increased ? '<button id="report-increase" class="report-increase">Report increased dumping</button>' : ""}</div>`;
  document.querySelector<HTMLButtonElement>("#report-increase")?.addEventListener("click", () => {
    const summary = document.querySelector<HTMLDivElement>(".comparison-summary")!;
    summary.insertAdjacentHTML("beforeend", '<span class="report-sent">Report prepared for review.</span>');
  });
  comparisonMaps.forEach((comparisonMap) => comparisonMap.remove());
  comparisonMaps = years.map((year) => {
    const comparisonMap = L.map(`year-map-${year}`, { zoomControl: false }).setView(area.coordinates, 15);
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles © Esri", maxZoom: 19 },
    ).addTo(comparisonMap);
    L.circleMarker(area.coordinates, {
      radius: 7,
      color: "#d94747",
      fillColor: "#e45757",
      fillOpacity: 0.95,
      weight: 2,
    }).bindTooltip(`${area.name} · ${year} comparison`).addTo(comparisonMap);
    L.rectangle(
      [[area.coordinates[0] - 0.003, area.coordinates[1] - 0.003], [area.coordinates[0] + 0.003, area.coordinates[1] + 0.003]],
      { color: "#ff3b30", weight: 2, fillOpacity: 0.1, dashArray: "6 4" },
    ).addTo(comparisonMap);
    return comparisonMap;
  });
}

function wireDashboard(): void {
  bindAppNav();
  const search = () => {
    const query = document.querySelector<HTMLInputElement>("#search")!.value.toLowerCase();
    const match = chennaiAreas.find((area) => area.name.toLowerCase().includes(query) || area.neighborhood.toLowerCase().includes(query) || area.detail.toLowerCase().includes(query));
    const results = document.querySelector<HTMLDivElement>("#search-results")!;
    if (!query) {
      results.innerHTML = "";
    } else if (match) {
      showSearchResult(match);
    } else {
      results.innerHTML = `<div class="search-result no-result">No Chennai waste report found for “${query}”. Try a neighbourhood such as Nolambur, Mogappair, Perumbakkam, Kodungaiyur, or Perungudi.</div>`;
    }
  };
  document.querySelector<HTMLButtonElement>("#search-btn")!.onclick = search;
  document.querySelector<HTMLInputElement>("#search")!.onkeydown = (event) => { if (event.key === "Enter") search(); };
}

renderDashboard();
