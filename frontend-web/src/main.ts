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
  priority?: boolean;
};

const chennaiAreas: ChennaiArea[] = [
  { name: "Chennai Corporation Dump Yard, Kodungaiyur", neighborhood: "Kodungaiyur", coordinates: [13.1702, 80.2551], category: "legal", facilityType: "GCC municipal disposal site", extent: "342.91 acres", wasteArea: "252 acres legacy waste", status: "Biomining", detail: "Receives municipal waste from Zones 1–8; operating since the early 1980s", updated: "GCC 2025–26 climate budget", source: "Greater Chennai Corporation Solid Waste Management Department" },
  { name: "Perungudi Municipal Solid Waste Dumping Site", neighborhood: "Perungudi / Pallikaranai", coordinates: [12.9604, 80.2461], category: "legal", facilityType: "GCC municipal disposal site", extent: "250 acres", wasteArea: "225 acres historical dumping", status: "Biomining", detail: "Located near Pallikaranai Marshland; undergoing land reclamation", updated: "GCC 2025–26 climate budget", source: "Greater Chennai Corporation Solid Waste Management Department" },
  { name: "Nolambur", neighborhood: "Nolambur", coordinates: [13.0737, 80.1635], category: "illegal", facilityType: "Reported dumping area", extent: "Area to verify", status: "Reported", detail: "Household garbage, plastics and construction debris", updated: "India Today report", priority: true },
  { name: "Ambattur", neighborhood: "Ambattur", coordinates: [13.1143, 80.1548], category: "illegal", facilityType: "Reported dumping area", extent: "Area to verify", status: "Reported", detail: "Roadside and vacant-plot garbage accumulation", updated: "India Today report" },
  { name: "Korattur", neighborhood: "Korattur", coordinates: [13.1087, 80.1833], category: "illegal", facilityType: "Reported dumping area", extent: "Area to verify", status: "Reported", detail: "Unauthorised waste dumping", updated: "India Today report" },
  { name: "Mogappair", neighborhood: "Mogappair", coordinates: [13.0824, 80.1724], category: "illegal", facilityType: "Reported dumping area", extent: "Area to verify", status: "Reported", detail: "Household waste and building debris", updated: "India Today report", priority: true },
  { name: "Chitlapakkam", neighborhood: "Chitlapakkam", coordinates: [12.9381, 80.1465], category: "illegal", facilityType: "Reported dumping area", extent: "Area to verify", status: "Reported", detail: "Furniture, plastic and tree waste", updated: "India Today report", priority: true },
  { name: "Gerugambakkam", neighborhood: "Gerugambakkam", coordinates: [13.0086, 80.1328], category: "illegal", facilityType: "Reported riverbed area", extent: "Area to verify", status: "Reported", detail: "Riverbed dumping and open waste burning", updated: "India Today report", priority: true },
  { name: "Cowl Bazaar", neighborhood: "Cowl Bazaar", coordinates: [12.9787, 80.1494], category: "illegal", facilityType: "Reported riverbed area", extent: "Area to verify", status: "Reported", detail: "Waste dumping along the Adyar riverbed", updated: "India Today report" },
  { name: "Kolapakkam", neighborhood: "Kolapakkam", coordinates: [13.0117, 80.1518], category: "illegal", facilityType: "Reported river area", extent: "Area to verify", status: "Reported", detail: "Waste dumping and burning near river areas", updated: "India Today report" },
  { name: "Madhuravoyal", neighborhood: "Madhuravoyal", coordinates: [13.0615, 80.1675], category: "illegal", facilityType: "Reported river area", extent: "Area to verify", status: "Reported", detail: "Waste dumped near the Cooum river", updated: "India Today report" },
  { name: "Perumbakkam", neighborhood: "Perumbakkam", coordinates: [12.9025, 80.1958], category: "illegal", facilityType: "Reported lake-side area", extent: "Area to verify", status: "Reported", detail: "Unauthorised municipal waste dumping near the lake", updated: "India Today report", priority: true },
  { name: "Vyasarpadi", neighborhood: "Vyasarpadi", coordinates: [13.1121, 80.2644], category: "illegal", facilityType: "Reported canal-side area", extent: "Area to verify", status: "Reported", detail: "Waste dumping near canals", updated: "India Today report" },
  { name: "Tondiarpet", neighborhood: "Tondiarpet", coordinates: [13.1282, 80.2905], category: "illegal", facilityType: "Reported canal-side area", extent: "Area to verify", status: "Reported", detail: "Waste dumping near Elaya Street and canals", updated: "India Today report" },
];

const app = document.querySelector<HTMLDivElement>("#app")!;
const icon = (name: string) => `<span class="icon">${name}</span>`;

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

function renderChennaiAreas(category: "legal" | "illegal"): void {
  const isLegal = category === "legal";
  const areas = chennaiAreas.filter((area) => area.category === category);
  const accent = isLegal ? "legal" : "illegal";
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">${icon("✦")} WASTEWATCH</div>
        <div class="side-label">CHENNAI</div>
        <button id="overview-nav" class="nav">${icon("◈")} Overview</button>
        <button id="legal-nav" class="nav ${isLegal ? "active" : ""}">${icon("✓")} Official dumping sites</button>
        <button id="illegal-nav" class="nav ${!isLegal ? "active" : ""}">${icon("!")} Illegal dumping sites</button>
        <div class="side-bottom"><div class="avatar">AD</div><div><b>Admin</b><small>admin</small></div><button id="logout" class="logout">↪</button></div>
      </aside>
      <main class="dashboard">
        <header class="topbar"><div><div class="eyebrow">CHENNAI / ${isLegal ? "LEGAL DISPOSAL AREAS" : "ILLEGAL DUMPING AREAS"}</div><h2>${isLegal ? "Authorised waste areas" : "Illegal waste hotspots"}</h2><p class="muted">${isLegal ? "Verified GCC municipal disposal sites and their reported biomining status." : "AI-detected locations requiring inspection and remediation."}</p></div></header>
        <section class="metrics ${isLegal ? "" : "single-metric"}">${isLegal ? `${metric("Official disposal sites", "2", "GCC municipal sites", "good")}${metric("Total site extent", "592.91 acres", "Kodungaiyur + Perungudi", "good")}${metric("Waste-covered area", "477 acres", "Legacy and historical dumping", "bad")}${metric("Primary activity", "Biomining", "Disposal and land reclamation", "good")}` : metric("Reported areas", `${areas.length}`, "Locations in supplied reports", "bad")}</section>
        <section class="panel area-map-panel"><div class="panel-head"><div><h3>${isLegal ? "Legal disposal areas in Chennai" : "Reported dumping areas in Chennai"}</h3><p class="muted">${isLegal ? "Official GCC disposal sites shown on the Chennai map." : "Red dots show locations reported in supplied sources; they are not confirmed boundaries."}</p></div><div class="annotation-key ${accent}"><i></i>${isLegal ? "GCC · OFFICIAL" : "REPORTED · VERIFY"}</div></div><div id="chennai-map"></div></section>
        <section class="panel area-list"><div class="panel-head"><div><h3>${isLegal ? "Verified legal areas" : "Reported illegal dumping locations"}</h3><p class="muted">${areas.length} reported areas in Chennai · exact dumping patches require field verification</p></div></div>${isLegal ? '<div class="area-table-head"><span>AREA</span><span>STATUS</span><span>LAST UPDATE</span><span></span></div>' : ""}${chennaiAreaRows(chennaiAreas, category)}</section>
        <section class="panel area-note"><div class="note-icon">${isLegal ? "✓" : "!"}</div><div><b>${isLegal ? "About Chennai legal waste areas" : "Important verification note"}</b><p>${isLegal ? "These are the two major GCC municipal disposal sites: Kodungaiyur (342.91 acres; approximately 252 acres legacy waste) and Perungudi (250 acres; approximately 225 acres historically used). Areas are approximate and current active dumping footprints may differ." : "The locations below are reported areas, not confirmed boundaries. Do not label an entire neighbourhood as an illegal site. Confirm the exact dumping patch with field observations, official complaints, coordinates, and image date before enforcement."}</p><small class="source-note">${isLegal ? "Source: Greater Chennai Corporation Solid Waste Management Department and GCC 2025–26 Climate Budget." : "Sources supplied: India Today reports and Indian Kanoon reports."}</small></div></section>
        <footer></footer>
      </main>
    </div>`;
  document.querySelector<HTMLButtonElement>("#logout")!.onclick = renderLogin;
  document.querySelector<HTMLButtonElement>("#overview-nav")!.onclick = renderDashboard;
  document.querySelector<HTMLButtonElement>("#legal-nav")!.onclick = () => renderChennaiAreas("legal");
  document.querySelector<HTMLButtonElement>("#illegal-nav")!.onclick = () => renderChennaiAreas("illegal");
  document.querySelector<HTMLButtonElement>("#legal-switch")?.addEventListener("click", () => renderChennaiAreas("legal"));
  document.querySelector<HTMLButtonElement>("#illegal-switch")?.addEventListener("click", () => renderChennaiAreas("illegal"));
  chennaiMap(chennaiAreas, category);
}

function renderDashboard(): void {
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand sidebar-brand"><span class="brand-mark">◈</span><strong>Geo<span>WasteAI</span></strong></div>
        <div class="side-label">CHENNAI</div>
        <button id="overview-nav" class="nav active">${icon("⌂")} Overview</button>
        <button id="legal-nav" class="nav">${icon("♢")} Official Dumping Sites</button>
        <button id="illegal-nav" class="nav">${icon("△")} Illegal Dumping Sites</button>
        <div class="side-bottom"><div class="avatar">AD</div><div><b>Admin</b><small>admin</small></div><button id="logout" class="logout">↪</button></div>
      </aside>
      <main class="dashboard">
        <header class="topbar overview-header"><div><h2>Chennai Waste Dump Monitor</h2><p class="muted">GeoAI-based Detection of Waste Dumping Sites using Satellite Imagery</p></div><div class="header-actions">${icon("♧")}<div class="avatar">AD</div></div></header>
        <div class="overview-search"><div class="search-row"><div class="search-box">${icon("⌕")}<input id="search" placeholder="Search location (e.g., Kodungaiyur, Perungudi, Nolambur...)" /><button id="search-btn">Search</button></div></div></div>
        <div id="search-results"></div>
      </main>
    </div>`;
  wireDashboard();
  showOverview();
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
  const area = chennaiAreas[0];
  results.innerHTML = `
    <div class="overview-grid">
      <div id="overview-map" class="search-map overview-map"></div>
      <section class="site-details-card">
        <h3>${icon("●")} Site Details</h3>
        <div class="site-details-content"><div class="site-thumb"></div><div>
          <h4>${area.name}</h4><span class="site-pill">Official Site</span>
          <p><b>⌖ Location</b> Kodungaiyur, North Chennai</p>
          <p><b>▱ Total Area</b> ~342.91 acres</p>
          <p><b>♻ Waste Area</b> ~252 acres</p>
          <p><b>ⓘ Status</b> GCC authorised disposal site, under biomining</p>
        </div></div>
      </section>
    </div>
    <section class="yearly-overview">
      <div class="yearly-title"><h3>${icon("▥")} Yearly Calculation</h3><select><option>Year: 2024</option></select></div>
      <div class="yearly-cards">
        <div><span>Total Waste<br>Dumped</span><b>4,28,500 tons</b></div>
        <div><span>Legally Disposed<br>Waste</span><b>3,12,000 tons</b></div>
        <div><span>Illegally Dumped<br>Waste (Estimated)</span><b>1,16,500 tons</b></div>
        <div><span>Illegal Dumping<br>from Previous Year</span><b class="year-increase">↑ 18.4%</b></div>
        <div class="year-chart"><b>Waste Dumped (Tons) – Yearly Trend</b><div class="chart-bars"><i style="height:45%"></i><i style="height:58%"></i><i style="height:68%"></i><i style="height:82%"></i><i style="height:94%"></i></div><div class="chart-years"><span>2020</span><span>2021</span><span>2022</span><span>2023</span><span>2024</span></div></div>
      </div>
    </section>`;
  const overviewMap = L.map("overview-map", { zoomControl: true }).setView([13.0827, 80.2200], 11);
  map = overviewMap;
  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: "Tiles © Esri", maxZoom: 19 }).addTo(overviewMap);
  chennaiAreas.filter((item) => item.category === "legal" || item.priority).forEach((item) => {
    L.circleMarker(item.coordinates, { radius: 8, color: item.category === "legal" ? "#20c955" : "#ef332b", fillColor: item.category === "legal" ? "#20c955" : "#ef332b", fillOpacity: 1, weight: 2 }).bindTooltip(`${item.name}<br>${item.category === "legal" ? "Official" : "Illegal reported"}`).addTo(overviewMap);
  });
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
  document.querySelector<HTMLButtonElement>("#logout")!.onclick = renderLogin;
  document.querySelector<HTMLButtonElement>("#legal-nav")!.onclick = () => renderChennaiAreas("legal");
  document.querySelector<HTMLButtonElement>("#illegal-nav")!.onclick = () => renderChennaiAreas("illegal");
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

renderLogin();
