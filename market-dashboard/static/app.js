"use strict";
// Market overview page: renders /api/dashboard into cards; detail charts load on demand.

const TV_EMBED = "https://s3.tradingview.com/external-embedding/";
const TV_CHART = "https://www.tradingview.com/chart/?symbol=";
let DATA = null;
let WIDGETS = null;
const DETAIL_CACHE = new Map();

// Where the data comes from. The static snapshot replaces these three functions.
const API = {
  dashboard: async () => (await fetch("/api/dashboard")).json(),
  widgets: async () => (await fetch("/api/widgets")).json(),
  detail: async (kind, key) => (await fetch(`/api/detail/${kind}/${encodeURIComponent(key)}`)).json(),
};
async function detail(kind, key) {
  const id = `${kind}:${key}`;
  if (!DETAIL_CACHE.has(id)) DETAIL_CACHE.set(id, API.detail(kind, key));
  try { return await DETAIL_CACHE.get(id); } catch (err) { DETAIL_CACHE.delete(id); throw err; }
}

// ---------- helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined && text !== null) e.textContent = text;
  return e;
}
const isNum = (x) => typeof x === "number" && Number.isFinite(x);
function fmtNum(x, nd = null) {
  if (!isNum(x)) return "–";
  const a = Math.abs(x);
  const d = nd ?? (a >= 1000 ? 2 : a >= 100 ? 2 : a >= 1 ? 2 : 4);
  return x.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtBig(x) {
  if (!isNum(x)) return "–";
  const a = Math.abs(x);
  if (a >= 1e12) return `$${(x / 1e12).toFixed(1)}T`;
  if (a >= 1e9) return `$${(x / 1e9).toFixed(0)}B`;
  if (a >= 1e6) return `$${(x / 1e6).toFixed(0)}M`;
  if (a >= 1e3) return `$${(x / 1e3).toFixed(0)}K`;
  return `$${x.toFixed(0)}`;
}
function fmtVol(x) {
  if (!isNum(x)) return "–";
  if (x >= 1e9) return `${(x / 1e9).toFixed(2)}B`;
  if (x >= 1e6) return `${(x / 1e6).toFixed(1)}M`;
  if (x >= 1e3) return `${(x / 1e3).toFixed(0)}K`;
  return x.toFixed(0);
}
function signed(x, nd = 2, suffix = "%") {
  if (!isNum(x)) return "–";
  const s = x > 0 ? "+" : x < 0 ? "−" : "";
  return `${s}${Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: nd, maximumFractionDigits: nd })}${suffix}`;
}
const tone = (x) => (isNum(x) ? (x > 0 ? "pos" : x < 0 ? "neg" : "") : "");
function chg(x, nd = 2, suffix = "%", colored = true) {
  return el("td", `num ${colored ? tone(x) : ""}`, signed(x, nd, suffix));
}
function ordinal(n) {
  n = Math.round(n);
  const s = (n % 100 >= 11 && n % 100 <= 13) ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th");
  return `${n}${s}`;
}
function tvLink(symbol, text = "↗") {
  const a = el("a", "tvlink", text);
  a.href = TV_CHART + encodeURIComponent(symbol);
  a.target = "_blank";
  a.rel = "noopener";
  a.title = `Open ${symbol} in TradingView`;
  return a;
}
function td(cls, text) { return el("td", cls, text); }
function explainBox(summary, text) {
  const d = el("details", "explain");
  d.append(el("summary", "", summary));
  if (typeof text === "string") d.append(el("p", "", text)); else d.append(text);
  return d;
}
function setMeta(id, block) {
  const root = document.getElementById(id);
  const upd = $(":scope > .section-head .updated", root);
  if (upd) upd.textContent = block?.updated_at ? `updated ${block.updated_at}` : "";
  if (block?.intro && $(":scope > .section-head", root)) {
    let intro = $(":scope > .intro", root);
    if (!intro) { intro = el("p", "intro"); $(":scope > .section-head", root).after(intro); }
    intro.textContent = block.intro;
  }
  const w = $(":scope > .warnings", root);
  if (w) {
    w.replaceChildren(...(block?.warnings || []).map((m) => el("div", "warn-msg", m)));
    if (block?.error) w.append(el("div", "warn-msg", `This section could not be built: ${block.error}`));
  }
  return block && !block.error;
}
const store = {
  get(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch (e) { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked */ } },
};
function segActive(seg, value) { $$("button", seg).forEach((b) => b.classList.toggle("active", b.dataset.v === String(value))); }
function onSeg(seg, fn) { $$("button", seg).forEach((b) => b.addEventListener("click", () => fn(b.dataset.v))); }
function fillSelect(sel, options, value) {
  sel.replaceChildren(...options.map(([v, label, group]) => {
    const o = el("option", "", label); o.value = v; if (group) o.dataset.group = group; return o;
  }));
  // optgroups when the options carry a group
  if (options.some((o) => o[2])) {
    const groups = new Map();
    for (const o of [...sel.options]) {
      const g = o.dataset.group;
      if (!groups.has(g)) { const og = document.createElement("optgroup"); og.label = g; groups.set(g, og); }
      groups.get(g).append(o);
    }
    sel.replaceChildren(...groups.values());
  }
  sel.value = value;
}

/** Sortable table. columns: [{key, label, num, cell(row), title, sort}] */
function buildTable(table, columns, rows, opts = {}) {
  let sortKey = opts.sortKey ?? null;
  let asc = opts.asc ?? false;
  let showAll = false;
  function draw() {
    const thead = el("thead");
    const tr = el("tr");
    for (const c of columns) {
      const th = el("th", `${c.num ? "num " : ""}${c.sort !== false ? "sortable" : ""}`, c.label);
      if (c.title) th.title = c.title;
      if (c.key === sortKey) th.classList.add("sorted", ...(asc ? ["asc"] : []));
      if (c.sort !== false) th.addEventListener("click", () => { asc = sortKey === c.key ? !asc : !!c.ascFirst; sortKey = c.key; draw(); });
      tr.append(th);
    }
    thead.append(tr);
    const sorted = sortKey ? [...rows].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (va == null) return 1;
      if (vb == null) return -1;
      return (typeof va === "string" ? va.localeCompare(vb) : va - vb) * (asc ? 1 : -1);
    }) : rows;
    const shown = opts.limit && !showAll ? sorted.slice(0, opts.limit) : sorted;
    const tbody = el("tbody");
    for (const r of shown) {
      const row = el("tr");
      if (opts.onRow) opts.onRow(row, r);
      for (const c of columns) row.append(c.cell(r));
      tbody.append(row);
    }
    if (!rows.length) {
      const er = el("tr", "empty-row");
      const cell = td("", opts.empty || "Nothing to show.");
      cell.colSpan = columns.length;
      er.append(cell);
      tbody.append(er);
    }
    table.replaceChildren(thead, tbody);
    if (opts.heat) shade(table, columns, shown);
    const wrap = table.closest(".table-wrap");
    let more = wrap?.nextElementSibling?.matches?.(".show-all") ? wrap.nextElementSibling : null;
    if (opts.limit && rows.length > opts.limit) {
      if (!more) { more = el("button", "show-all"); more.type = "button"; wrap.after(more); }
      more.textContent = showAll ? "Show fewer" : `Show all ${rows.length}`;
      more.onclick = () => { showAll = !showAll; draw(); };
    } else if (more) more.remove();
  }
  draw();
}
/** Green/red background scaled to the size of the move within each column. */
function shade(table, columns, rows) {
  columns.forEach((c, ci) => {
    if (!c.heat) return;
    const vals = rows.map((r) => r[c.key]).filter(isNum);
    const max = Math.max(1e-9, ...vals.map(Math.abs));
    $$("tbody tr", table).forEach((tr, ri) => {
      const v = rows[ri]?.[c.key];
      if (!isNum(v)) return;
      const a = 0.06 + 0.30 * Math.min(1, Math.abs(v) / max);
      tr.children[ci].style.background = `rgba(${cssVar(v >= 0 ? "--pos-bg" : "--neg-bg")}, ${a.toFixed(3)})`;
    });
  });
}

// ---------- theme ----------
function currentTheme() {
  return document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}
function markThemeButtons() { $$("[data-theme-set]").forEach((b) => b.classList.toggle("active", b.dataset.themeSet === currentTheme())); }
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  store.set("theme-v", theme);
  try { localStorage.setItem("theme", theme); } catch (e) { /* ignore */ }
  markThemeButtons();
  renderAll();
  initWidgets();
}
$$("[data-theme-set]").forEach((b) => b.addEventListener("click", () => setTheme(b.dataset.themeSet)));
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (!document.documentElement.dataset.theme) { markThemeButtons(); renderAll(); initWidgets(); }
});

// ---------- TradingView widgets ----------
let heatmapMarket = store.get("heatmap", "us");
function embed(target, script, config) {
  const box = document.getElementById(target);
  if (!box) return;
  const container = el("div", "tradingview-widget-container");
  container.style.height = "100%";
  const inner = el("div", "tradingview-widget-container__widget");
  inner.style.height = "100%";
  const s = document.createElement("script");
  s.src = TV_EMBED + script;
  s.async = true;
  s.textContent = JSON.stringify(config);
  container.append(inner, s);
  box.replaceChildren(container);
}
function renderHeatmap() {
  if (!WIDGETS) return;
  embed("heatmap", "embed-widget-stock-heatmap.js", {
    dataSource: WIDGETS.heatmap[heatmapMarket], exchanges: [], grouping: "sector", blockSize: "market_cap_basic",
    blockColor: "change", locale: "en", colorTheme: currentTheme(), hasTopBar: false, isDataSetEnabled: false,
    isZoomEnabled: true, hasSymbolTooltip: true, isMonoSize: false, width: "100%", height: "100%",
  });
  $$("[data-heatmap]").forEach((b) => b.classList.toggle("active", b.dataset.heatmap === heatmapMarket));
}
function initWidgets() {
  if (!WIDGETS) return;
  embed("ticker-tape", "embed-widget-ticker-tape.js", {
    symbols: WIDGETS.ticker_tape, showSymbolLogo: false, isTransparent: true, displayMode: "adaptive",
    colorTheme: currentTheme(), locale: "en",
  });
  embed("calendar", "embed-widget-events.js", {
    colorTheme: currentTheme(), isTransparent: true, width: "100%", height: "100%", locale: "en",
    importanceFilter: WIDGETS.calendar.importance, countryFilter: WIDGETS.calendar.countries,
  });
  renderHeatmap();
}
$$("[data-heatmap]").forEach((b) => b.addEventListener("click", () => {
  heatmapMarket = b.dataset.heatmap; store.set("heatmap", heatmapMarket); renderHeatmap();
}));

// ---------- status line ----------
function renderStatus() {
  const last = DATA.overview?.markets?.rows?.find((r) => r.label === "SPX")?.date;
  const line = $(".status-line");
  line.replaceChildren();
  line.append(el("b", "", `Data as of ${DATA.generated_at}`), document.createTextNode(" (Amsterdam time)"));
  if (last) line.append(document.createTextNode(` · US daily data as of ${niceDate(last)}`));
  line.append(document.createTextNode(" · daily refresh 18:00 and 22:30, activity lists every 30 minutes during the US session"));
}

// =============================================================================================
// Overview cards
// =============================================================================================
function renderMarkets(m) {
  const card = $("#card-markets");
  $(".card-sub", card).textContent = m.about;
  const table = $("table", card);
  const head = el("thead");
  const htr = el("tr");
  for (const [t, num] of [["Symbol"], ["Last", 1], ["Day", 1], ["Week", 1], ["YTD", 1]]) htr.append(el("th", num ? "num" : "", t));
  head.append(htr);
  const body = el("tbody");
  for (const r of m.rows) {
    const tr = el("tr");
    const name = td("");
    name.append(document.createTextNode(r.label), tvLink(r.tv));
    tr.append(name);
    if (!r.available) { tr.append(td("num", "–"), td("num", "–"), td("num", "–"), td("num", "–")); body.append(tr); continue; }
    const bp = r.unit === "bp";
    tr.append(td("num", bp ? `${r.last.toFixed(2)}%` : fmtNum(r.last)),
              chg(r.d1, bp ? 1 : 2, bp ? " bp" : "%", !bp), chg(r.w1, bp ? 1 : 2, bp ? " bp" : "%", !bp),
              chg(r.ytd, bp ? 0 : 2, bp ? " bp" : "%", !bp));
    tr.title = `as of ${r.date}`;
    body.append(tr);
  }
  table.replaceChildren(head, body);
}

function renderFearGreed(fg) {
  const card = $("#card-fg");
  $(".card-sub", card).textContent = "0 = extreme fear, 100 = extreme greed · average of five market signals, each scored against the past year";
  const body = $(".body", card);
  if (!fg.available) { body.replaceChildren(el("div", "na", "Not enough data yet.")); return; }
  const top = el("div", "big-row");
  top.append(el("span", "big", fg.score.toFixed(0)), el("span", "fg-label", fg.label));
  const bar = el("div", "fg-bar");
  const fill = el("div", "fill");
  fill.style.width = `${fg.score}%`;
  bar.append(fill);
  const scale = el("div", "fg-scale");
  scale.append(el("span", "", "Extreme fear"), el("span", "", "Neutral"), el("span", "", "Extreme greed"));
  const parts = el("div", "fg-parts");
  for (const p of fg.parts) {
    const name = el("span", "", p.name);
    name.title = p.about;
    const track = el("div", "track");
    const f = el("div");
    f.style.width = `${p.score ?? 0}%`;
    track.append(f);
    parts.append(name, track, el("span", "v", isNum(p.score) ? p.score.toFixed(0) : "–"));
  }
  const chartBox = el("div", "chart h160");
  body.replaceChildren(top, bar, scale, parts, chartBox,
    explainBox("How is this made?", fg.about + " " + fg.parts.map((p) => `${p.name}: ${p.about}`).join(" ")));
  const chart = makeChart(chartBox, { interactive: false, rightOffset: 1 });
  const s = addLine(chart, pts(fg.history.dates, fg.history.values), { title: "Score", fmt: "int" });
  s.priceScale().applyOptions({ autoScale: false });
  s.applyOptions({ autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }) });
  hline(s, 75); hline(s, 25);
  chart.timeScale().fitContent();
}

let breadthRegion = store.get("breadth-region", "US");
function renderBreadth(b) {
  const card = $("#card-breadth");
  const regions = Object.keys(b.regions);
  const body = $(".body", card);
  if (!regions.length) { body.replaceChildren(el("div", "na", "Breadth not calculated yet.")); return; }
  if (!b.regions[breadthRegion]) breadthRegion = regions[0];
  const sel = $("select", card);
  fillSelect(sel, regions.map((r) => [r, r === "US" ? "S&P 500" : "Europe"]), breadthRegion);
  sel.onchange = () => { breadthRegion = sel.value; store.set("breadth-region", breadthRegion); renderBreadth(b); };
  const r = b.regions[breadthRegion];
  $(".card-sub", card).textContent = `Share of ${r.label} members above their moving averages · last 12 months`;
  const stats = el("div", "stats three");
  for (const d of ["20", "50", "200"]) {
    const s = el("div", "stat");
    s.append(el("div", "label", `Above ${d}-day`), el("div", "big", `${r.latest[d].toFixed(1)}%`));
    stats.append(s);
  }
  const chartBox = el("div", "chart h200");
  body.replaceChildren(stats, chartBox, explainBox("What does this show?", b.about));
  const chart = makeChart(chartBox);
  const colors = { 20: cssVar("--blue"), 50: cssVar("--orange"), 200: cssVar("--green") };
  let first = null;
  for (const d of ["20", "200", "50"]) {
    const s = addLine(chart, pts(r.dates, r.series[d]), { color: colors[d], width: d === "20" ? 1.5 : 2, title: `${d}d`, fmt: "pct0" });
    s.applyOptions({ autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }) });
    if (!first) { first = s; hline(s, 80); hline(s, 20); }
  }
  chart.timeScale().fitContent();
}

function renderVix(v) {
  const card = $("#card-vix");
  $(".card-sub", card).textContent = "CBOE volatility index · last 12 months, with 20 and 30 marked";
  const body = $(".body", card);
  if (!v.available) { body.replaceChildren(el("div", "na", "No VIX data yet.")); return; }
  const top = el("div", "big-row");
  top.append(el("span", "big", v.last.toFixed(2)), el("span", "muted", `latest daily close · ${ordinal(v.pct1y)} percentile of the year`));
  const chartBox = el("div", "chart h240");
  body.replaceChildren(top, chartBox, explainBox("What does this show?", v.about));
  const chart = makeChart(chartBox);
  const s = addLine(chart, pts(v.dates, v.values), { title: "VIX", fmt: "num", width: 1.5 });
  for (const l of v.lines) hline(s, l);
  chart.timeScale().fitContent();
}

let hygFreq = store.get("hyg-freq", "daily");
function candleChart(box, c, freq, o = {}) {
  const chart = makeChart(box, { reset: () => o.reset?.(chart) });
  const data = c[freq];
  const candles = addCandles(chart, ohlcPts(data), {
    upColor: o.blueRed ? cssVar("--blue") : undefined, upLine: o.blueRed ? cssVar("--blue") : undefined,
    downColor: o.blueRed ? cssVar("--neg") : undefined, title: o.title || "", fmt: "num" });
  const maColors = [cssVar("--orange"), cssVar("--green")];
  Object.entries(data.ma).forEach(([label, values], i) => addLine(chart, pts(data.dates, values), {
    color: maColors[i], width: 1.5, title: label, marker: false }));
  const n = o.visible?.[freq] ?? (freq === "daily" ? 180 : 156);
  const reset = () => showLast(chart, n);
  box._reset = reset;
  reset();
  tooltip(chart, box, (param, iso) => {
    const bar = param.seriesData.get(candles);
    if (!bar) return null;
    return `<div class="t-date">${freq === "weekly" ? "Week of " : ""}${niceDate(iso)}</div>` +
      `O ${fmtNum(bar.open)} H ${fmtNum(bar.high)} L ${fmtNum(bar.low)} <b>C ${fmtNum(bar.close)}</b>`;
  });
  return { chart, candles };
}
function renderHyg(h) {
  const card = $("#card-hyg");
  $(".card-sub", card).textContent = "iShares High Yield Corporate Bond ETF, US-listed · candles with 50- and 200-day (10- and 40-week) moving averages";
  const body = $(".body", card);
  segActive($("[data-hyg]", card), hygFreq);
  onSeg($("[data-hyg]", card), (v) => { hygFreq = v; store.set("hyg-freq", v); renderHyg(h); });
  if (!h.available) { body.replaceChildren(el("div", "na", "No HYG data yet.")); return; }
  const top = el("div", "big-row");
  top.append(el("span", "big", fmtNum(h.last)), el("span", "muted", `latest daily close · ${niceDate(h.date)}`));
  const chartBox = el("div", "chart h240");
  body.replaceChildren(top, chartBox, explainBox("What does this show?", h.about));
  candleChart(chartBox, h, hygFreq, { visible: { daily: 120, weekly: 104 } });
}

let sectorPeriod = store.get("sector-period", "w1");
function renderSectors(s) {
  const card = $("#card-sectors");
  const names = { d1: "today", w1: "over the past week", m1: "over the past month", ytd: "this year" };
  $(".card-sub", card).textContent = `S&P 500 sector ETFs (SPDR) · change ${names[sectorPeriod]}`;
  segActive($("[data-sector]", card), sectorPeriod);
  onSeg($("[data-sector]", card), (v) => { sectorPeriod = v; store.set("sector-period", v); renderSectors(s); });
  const rows = [...s.rows].filter((r) => isNum(r[sectorPeriod])).sort((a, b) => b[sectorPeriod] - a[sectorPeriod]);
  // 0 sits where the largest loss and the largest gain both fit, with room for the labels.
  const negMax = Math.max(0, ...rows.map((r) => -r[sectorPeriod])), posMax = Math.max(0, ...rows.map((r) => r[sectorPeriod]));
  const room = 20, usable = 100 - (negMax > 0 ? room : 0) - (posMax > 0 ? room : 0);
  const total = Math.max(0.01, negMax + posMax);
  const zero = (negMax > 0 ? room : 0) + usable * negMax / total;
  const box = $(".bars", card);
  box.replaceChildren(...rows.flatMap((r) => {
    const v = r[sectorPeriod];
    const lbl = el("div", "lbl");
    lbl.append(el("b", "", r.ticker), document.createTextNode(r.name));
    const track = el("div", "track");
    const z = el("div", "zero"); z.style.left = `${zero}%`;
    const bar = el("div", `bar ${v >= 0 ? "up" : "down"}`);
    const w = usable * Math.abs(v) / total;
    bar.style.left = `${v >= 0 ? zero : zero - w}%`;
    bar.style.width = `${Math.max(w, 0.5)}%`;
    const val = el("div", "val", signed(v, 2));
    if (v >= 0) val.style.left = `calc(${zero + w}% + 4px)`; else val.style.right = `calc(${100 - zero + w}% + 4px)`;
    track.append(z, bar, val);
    return [lbl, track];
  }));
  if (!$(":scope > details", card)) card.append(explainBox("What does this show?", s.about));
}

const STATE_WORD = { green: "healthy", orange: "neutral", red: "stress", nodata: "no data" };
const THEME_ORDER = ["Trend", "Breadth", "Volatility", "Sentiment", "Credit", "Rates"];
function renderRegime(b) {
  const card = $("#card-regime");
  $(".updated", card).textContent = b?.updated_at ? `updated ${b.updated_at}` : "";
  const body = $(".body", card);
  if (!b || b.error) { body.replaceChildren(el("div", "warn-msg", b?.error || "No data")); return; }
  const v = b.verdict;
  const pct = isNum(v.pct) ? v.pct : 0;
  const head = el("div", "verdict");
  head.append(el("span", `big ${v.label.toLowerCase().replace(/\s+/g, "-")}`, v.label),
    el("span", "muted", v.label === "Risk-on" ? "Most signals are healthy: conditions favour taking risk."
      : v.label === "Risk-off" ? "Most signals show stress: conditions favour caution."
      : v.label === "Neutral" ? "A mixed picture: no clear tilt towards risk-on or risk-off." : "Not enough data yet."));
  const onAt = b.verdict_thresholds?.on ?? 33, offAt = b.verdict_thresholds?.off ?? -33;
  const gw = el("div", "gauge-wrap");
  const gauge = el("div", "gauge");
  gauge.style.gridTemplateColumns = `${(offAt + 100) / 2}fr ${(onAt - offAt) / 2}fr ${(100 - onAt) / 2}fr`;
  gauge.append(el("div", "z off"), el("div", "z mid"), el("div", "z on"));
  const marker = el("div", "marker");
  marker.style.left = `${(pct + 100) / 2}%`;
  marker.title = `score ${signed(pct, 0)}`;
  const scale = el("div", "gauge-scale");
  scale.append(el("span", "", "risk-off"), el("span", "", `score ${signed(pct, 0)}`), el("span", "", "risk-on"));
  gw.append(gauge, marker, scale);
  const counts = el("div", "counts");
  counts.append(el("span", "g", `${v.counts.green} healthy`), el("span", "o", `${v.counts.orange} neutral`), el("span", "r", `${v.counts.red} stress`));
  const grid = el("div", "ind-grid");
  const inds = [...b.indicators].sort((a, c) => THEME_ORDER.indexOf(a.group) - THEME_ORDER.indexOf(c.group));
  for (const ind of inds) {
    const row = el("button", `irow ${ind.color}`);
    row.type = "button";
    row.append(el("span", "dot"), el("span", "", ind.label), el("span", "iv", ind.value));
    const why = el("span", "why");
    if (ind.meaning) why.append(el("span", "meaning", ind.meaning));
    why.append(el("span", "", `${STATE_WORD[ind.color]}: ${ind.reason}`));
    row.append(why);
    row.addEventListener("click", () => row.classList.toggle("open"));
    grid.append(row);
  }
  body.replaceChildren(head, gw, counts, grid,
    explainBox("How is this verdict made?",
      `Each of the ${v.counted} indicators is healthy (+1), neutral (0) or stress (−1) against fixed thresholds in ` +
      `config.yaml. Score = sum ÷ number of indicators = ${signed(pct, 0)}. Risk-on from ${signed(onAt, 0)}, ` +
      `risk-off from ${signed(offAt, 0)}. Click an indicator for its reading. ${v.explanation}`));
  const list = $("#card-signals .signals");
  list.replaceChildren(...(b.signals.length ? b.signals.map((sg) => {
    const li = el("li", `lvl-${sg.level}`);
    li.append(el("span", "area", sg.area), el("span", "", sg.text));
    return li;
  }) : [el("li", "empty", "No extremes right now.")]));
}

function renderToday(b) {
  const box = $("#card-today .expected");
  if (!b || b.error) { box.replaceChildren(); return; }
  box.replaceChildren(...(b.expected_moves.length ? b.expected_moves.map((m) => {
    const d = el("div", "em");
    const top = el("div", "big-row");
    top.append(el("span", "big", `± ${fmtNum(m.points, 0)} pts`), el("span", "muted", `${m.name} expected move today (± ${m.pct.toFixed(2)}%)`));
    d.append(top, el("p", "chart-note", `Range ${fmtNum(m.low, 0)} – ${fmtNum(m.high, 0)}: close ${fmtNum(m.price)} (${m.price_date}) × ` +
      `${m.vol_name} ${m.vol.toFixed(2)} ÷ 100 ÷ √252. About two out of three days end inside it.`));
    return d;
  }) : [el("div", "na", "No data yet.")]));
}

function renderOverview(o) {
  setMeta("overview", o);
  if (!o || o.error) return;
  renderMarkets(o.markets);
  renderFearGreed(o.fear_greed);
  renderBreadth(o.breadth);
  renderVix(o.vix);
  renderHyg(o.hyg);
  renderSectors(o.sectors);
}

// =============================================================================================
// Positioning (COT)
// =============================================================================================
const COT = Object.assign({ key: null, group: null, years: 3, show: { price: true } }, store.get("cot-v2", {}));
const GROUP_COLORS = { am: "--green", lf: "--blue", dealer: "--gold", other: "--purple", mm: "--blue", pm: "--green", swap: "--gold" };
function saveCot() { store.set("cot-v2", COT); }

/** Percentile of each value within the trailing `win` values (all values up to it when win = 0). */
function rollingPct(values, win, minPeriods) {
  const out = new Array(values.length).fill(null);
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v == null) continue;
    const start = win ? Math.max(0, i - win + 1) : 0;
    let n = 0, le = 0;
    for (let j = start; j <= i; j++) { const w = values[j]; if (w == null) continue; n++; if (w <= v) le++; }
    if (n >= minPeriods) out[i] = 100 * le / n;
  }
  return out;
}

function renderPositioning(b) {
  if (!setMeta("positioning", b)) return;
  $("#cot-date").textContent = b.report_date ? `positions as of Tuesday ${niceDate(b.report_date)}` : "";
  if (!COT.key || !b.rows.some((r) => r.key === COT.key)) COT.key = "spx";
  const sel = $("#cot-asset");
  fillSelect(sel, b.rows.map((r) => [r.key, r.label, r.group]), COT.key);
  sel.onchange = () => { COT.key = sel.value; COT.group = null; saveCot(); drawCot(); };
  onSeg($("#cot-window"), (v) => { COT.years = +v; saveCot(); drawCot(); });
  $("#cot-howto").textContent = DATA.positioning?.howto || "";
  renderCotTable(b);
  drawCot();
}

function renderCotTable(b) {
  const table = $("#positioning .cot-table");
  const head = el("thead");
  const htr = el("tr");
  for (const [t, num, title] of [["Market"], ["Group"], ["Net/OI", 1, "Net position as % of open interest"],
    ["All", 1, "Percentile since the start of the data"], ["5Y", 1], ["1Y", 1]]) {
    const th = el("th", num ? "num" : "", t); if (title) th.title = title; htr.append(th);
  }
  head.append(htr);
  const body = el("tbody");
  let group = null;
  const pill = (p) => { const c = td("num"); if (!isNum(p)) { c.textContent = "–"; return c; }
    c.append(el("span", `pill ${p <= 10 ? "low" : p >= 90 ? "high" : ""}`, p.toFixed(0))); return c; };
  for (const r of b.rows) {
    if (r.group !== group) {
      group = r.group;
      const g = el("tr", "group"); const c = td("", group); c.colSpan = 6; g.append(c); body.append(g);
    }
    const tr = el("tr", `clickable ${r.key === COT.key ? "selected" : ""}`);
    tr.dataset.key = r.key;
    tr.tabIndex = 0;
    tr.append(td("", r.label), td("muted", r.cohort_short));
    if (!r.available) tr.append(td("num", "–"), td("num", "–"), td("num", "–"), td("num", "–"));
    else tr.append(td("num", `${r.net_oi_pct.toFixed(1)}%`), pill(r.pct_all), pill(r.pct_5y), pill(r.pct_1y));
    const pick = () => { COT.key = r.key; COT.group = null; saveCot(); $("#cot-asset").value = r.key; drawCot();
      $("#cot-card").scrollIntoView({ block: "nearest", behavior: "smooth" }); };
    tr.addEventListener("click", pick);
    tr.addEventListener("keydown", (e) => { if (e.key === "Enter") pick(); });
    body.append(tr);
  }
  table.replaceChildren(head, body);
}

async function drawCot() {
  const key = COT.key;
  $$("#positioning .cot-table tr[data-key]").forEach((r) => r.classList.toggle("selected", r.dataset.key === key));
  segActive($("#cot-window"), COT.years);
  const box = $("#cot-chart");
  let d;
  try { d = await detail("cot", key); } catch (err) { box.replaceChildren(el("div", "warn-msg", `Could not load ${key}: ${err}`)); return; }
  if (key !== COT.key) return;
  if (!d.available) { box.replaceChildren(el("div", "na", "No COT data yet.")); return; }
  const g = d.groups[COT.group] ? COT.group : d.default_group in d.groups ? d.default_group : d.order[0];
  const gsel = $("#cot-group");
  fillSelect(gsel, d.order.map((k) => [k, d.groups[k].name]), g);
  gsel.onchange = () => { COT.group = gsel.value; saveCot(); drawCot(); };
  const G = d.groups[g];
  const row = DATA.positioning.rows.find((r) => r.key === key);
  const tvSym = DATA.positioning.tv?.[key];
  const tv = $("#cot-tv");
  tv.style.visibility = tvSym ? "visible" : "hidden";
  if (tvSym) tv.href = TV_CHART + encodeURIComponent(tvSym);

  const winWeeks = COT.years ? COT.years * 52 : 0;
  const pct = rollingPct(G.net, winWeeks, winWeeks ? Math.min(52, winWeeks / 2) : 52);
  const n = d.dates.length;
  const fromIdx = winWeeks ? Math.max(0, n - winWeeks) : 0;
  const inWin = G.net.slice(fromIdx).filter(isNum);
  const maxLong = Math.max(...inWin), maxShort = Math.min(...inWin);
  const last = G.net[n - 1], lastPct = pct[n - 1];
  const winText = COT.years ? `${COT.years} year${COT.years > 1 ? "s" : ""}` : `since ${d.dates[0].slice(0, 4)}`;

  // stats
  const stats = $("#cot-stats");
  const stat = (label, value, extra) => { const s = el("div", "stat"); s.append(el("div", "label", label), el("div", "big", value)); if (extra) s.append(extra); return s; };
  const meter = el("div", "pct-meter"); const mk = el("span"); mk.style.left = `${lastPct ?? 50}%`; meter.append(mk);
  const pctStat = stat(`Percentile (${winText})`, isNum(lastPct) ? lastPct.toFixed(0) : "–", meter);
  if (isNum(lastPct)) $(".big", pctStat).classList.add(lastPct <= 10 ? "pos" : lastPct >= 90 ? "neg" : "x");
  stats.replaceChildren(pctStat, stat(`${G.name} net now`, signed(last, 1)),
    stat("Max net long in window", signed(maxLong, 1)), stat("Max net short in window", signed(maxShort, 1)));

  // legend toggles
  const color = (k) => cssVar(GROUP_COLORS[k] || "--blue");
  const items = [[`long`, `${G.name} longs`, color(g)], [`short`, `${G.name} shorts`, cssVar("--neg")],
    ...d.order.filter((k) => k !== g).map((k) => [`net:${k}`, `${d.groups[k].name} net`, color(k)]),
    ...(d.price ? [["price", "Price", cssVar("--price")]] : [])];
  const legend = $("#cot-legend");
  legend.replaceChildren(...items.map(([id, label, c]) => {
    const btn = el("button", "", label);
    btn.type = "button";
    btn.style.setProperty("--c", c);
    btn.setAttribute("aria-pressed", String(!!COT.show[id]));
    btn.addEventListener("click", () => { COT.show[id] = !COT.show[id]; saveCot(); drawCot(); });
    return btn;
  }));

  // chart: pane 0 = net bars (+ optional lines and candles), pane 1 = percentile
  const chart = makeChart(box);
  const bars = addBars(chart, d.dates.map((t, i) => isNum(G.net[i]) ? { time: t, value: G.net[i],
    color: G.net[i] < 0 ? cssVar("--pink") : cssVar("--sky") } : { time: t }), { title: `${G.name} net`, fmt: "pct1" });
  hline(bars, maxLong, { style: LINE.dotted, color: cssVar("--ink-2") });
  hline(bars, maxShort, { style: LINE.dotted, color: cssVar("--ink-2") });
  const extra = [];
  if (COT.show.long) extra.push([addLine(chart, pts(d.dates, G.long), { color: color(g), width: 1.5, title: "longs", fmt: "pct1", lastValue: false }), `${G.name} longs`]);
  if (COT.show.short) extra.push([addLine(chart, pts(d.dates, G.short.map((v) => isNum(v) ? -v : null)), { color: cssVar("--neg"), width: 1.5, title: "shorts", fmt: "pct1", lastValue: false }), `${G.name} shorts (as negative)`]);
  for (const k of d.order) if (k !== g && COT.show[`net:${k}`]) {
    extra.push([addLine(chart, pts(d.dates, d.groups[k].net), { color: color(k), width: 1.5, fmt: "pct1", lastValue: false }), `${d.groups[k].name} net`]);
  }
  let candles = null;
  if (d.price && COT.show.price) {
    candles = addCandles(chart, ohlcPts(d.price), { scale: "px", lastValue: false, fmt: "num" });
    chart.priceScale("px").applyOptions({ scaleMargins: { top: 0.06, bottom: 0.06 } });
    const lp = d.price.close[d.price.close.length - 1];
    candles.attachPrimitive(new Labels([{ time: d.price.dates[d.price.dates.length - 1], value: lp,
      text: `Price ${fmtNum(lp, lp > 100 ? 0 : 2)}`, color: cssVar("--ink"), align: "right", dy: -8 }], { bold: true }));
  }
  const pctSeries = addLine(chart, pts(d.dates, pct), { pane: 1, color: cssVar("--blue"), width: 1.5, title: "Pctl", fmt: "int" });
  pctSeries.applyOptions({ autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }) });
  pctSeries.attachPrimitive(new Bands([{ from: 90, to: 100, color: cssVar("--band-high") }, { from: 0, to: 10, color: cssVar("--band-low") }]));
  hline(pctSeries, 50, { style: LINE.dotted });
  paneHeights(chart, [3.2, 1]);
  const reset = () => showYears(chart, d.dates[n - 1], COT.years || 0);
  box._reset = reset;
  reset();
  tooltip(chart, box, (param, iso) => {
    const i = d.dates.indexOf(iso);
    if (i < 0) return null;
    let html = `<div class="t-date">Week of ${niceDate(iso)}</div>`;
    html += `${sw(G.net[i] < 0 ? cssVar("--pink") : cssVar("--sky"))}${esc(G.name)} net <b>${signed(G.net[i], 1)}</b><br>`;
    html += `Percentile (${winText}) <b>${isNum(pct[i]) ? pct[i].toFixed(0) : "–"}</b><br>`;
    for (const [s, label] of extra) { const v = param.seriesData.get(s); if (v) html += `${sw(s.options().color)}${esc(label)} ${signed(v.value, 1)}<br>`; }
    const c = candles && param.seriesData.get(candles);
    if (c) html += `${sw(cssVar("--price"))}Price (week) O ${fmtNum(c.open, 0)} H ${fmtNum(c.high, 0)} L ${fmtNum(c.low, 0)} C ${fmtNum(c.close, 0)}`;
    html += `<div class="muted">Open interest ${fmtVol(d.oi[i])} contracts</div>`;
    return html;
  });
  $("#cot-note").textContent = `Top: ${G.name.toLowerCase()} net position as % of open interest (bars; pink = net short), the market's weekly ` +
    `price (candles, own scale) and dotted lines at the window's biggest net long and net short. Bottom: the percentile through time, ` +
    `judged only against the ${COT.years ? `previous ${winText}` : "weeks up to then"}; above 90 = crowded long, below 10 = crowded short. ` +
    `Scroll or pinch to zoom, drag to move, double-click to reset. % of open interest swings around quarterly contract rolls, ` +
    `when open interest briefly doubles.${row ? ` Report of ${niceDate(row.date)}.` : ""}`;
  $("#cot-groups-help").replaceChildren(...d.order.map((k) => {
    const li = el("li"); li.append(el("b", "", `${d.groups[k].name}: `), document.createTextNode(d.groups[k].about)); return li;
  }));
}

// =============================================================================================
// Earnings
// =============================================================================================
let erRange = store.get("earnings-range", "week");
function renderEarnings(b) {
  if (!setMeta("earnings", b)) return;
  const root = $("#earnings");
  segActive($("[data-er]", root), erRange);
  onSeg($("[data-er]", root), (v) => { erRange = v; store.set("earnings-range", v); renderEarnings(b); });
  const maxDays = { today: 0, week: 6, all: Infinity }[erRange];
  const rows = b.rows.filter((r) => r.days_until <= maxDays);
  $(".er-count", root).textContent = `${rows.length} of ${b.rows.length} companies`;
  const table = $(".earnings-table", root);
  const head = el("thead");
  const htr = el("tr");
  for (const [t, num] of [["Release (Amsterdam)"], ["Company"], ["EU peers"], ["Corr", 1], ["Last time", 1], ["EU can trade"], ["US stock"], ["EPS est.", 1]]) {
    htr.append(el("th", num ? "num" : "", t));
  }
  head.append(htr);
  const body = el("tbody");
  let day = null;
  for (const r of rows) {
    if (r.date !== day) {
      day = r.date;
      const g = el("tr", "group");
      const when = r.days_until === 0 ? "today" : r.days_until === 1 ? "tomorrow" : `in ${r.days_until} days`;
      const c = td("", `${r.day} · ${when}`); c.colSpan = 8; g.append(c); body.append(g);
    }
    const n = Math.max(1, r.peers.length);
    if (r.peers.length) r.peers.forEach((p, i) => body.append(earningsRow(r, p, i, n)));
    else body.append(earningsRow(r, null, 0, 1));
  }
  if (!rows.length) {
    const tr = el("tr", "empty-row");
    const c = td("", erRange === "today" ? "None of our companies report today." : erRange === "week"
      ? "None of our companies report in the next 7 days." : "No upcoming reports for the companies in eu_peers.yaml.");
    c.colSpan = 8; tr.append(c); body.append(tr);
  }
  table.replaceChildren(head, body);
}
function earningsRow(r, p, i, n) {
  const tr = el("tr", i === n - 1 ? "" : "sub");
  const span = (c) => { c.rowSpan = n; return c; };
  if (i === 0) {
    const rel = td("rel");
    const exact = r.basis.startsWith("time from") || r.basis.includes("to the minute");
    rel.append(el("b", "", r.release_ams ? `${exact ? "" : "≈ "}${r.release_ams}` : "time n/a"),
               el("span", "timing", r.session === "AMC" ? "after US close" : r.session === "BMO" ? "before US open" : "during session"));
    rel.title = `${r.basis}${r.release_ny ? `; ${r.release_ny} New York time` : ""}`;
    const co = td("co");
    co.append(el("b", "", r.symbol), tvLink(r.tv), el("span", "nm", r.market_cap ? `$${fmtNum(r.market_cap / 1e9, 0)} bn` : ""));
    tr.append(span(rel), span(co));
  }
  if (p) {
    const pn = td("pn");
    pn.append(el("span", "", p.name), el("small", "muted", ` ${p.ticker}`), tvLink(p.tv));
    const corr = td(`num corr ${isNum(p.corr) && p.corr >= 0.5 ? "hi" : ""}`, isNum(p.corr) ? p.corr.toFixed(2) : "–");
    const last = chg(p.last_move, 1);
    if (r.last) last.title = `Previous report ${r.last.date}: ${r.symbol} ${signed(r.last.us_move, 1)}, ${p.name} ${signed(p.last_move, 1)}`;
    tr.append(pn, corr, last);
  } else {
    tr.append(td("muted", "no EU peer in our list"), td("num", "–"), td("num", "–"));
  }
  if (i === 0) {
    const us = td("");
    us.append(el("span", "", r.us_reacts));
    if (r.last && isNum(r.last.us_move)) us.append(el("small", "muted", ` · last time ${signed(r.last.us_move, 1)}`));
    tr.append(span(td("eu", r.eu_reacts.text)), span(us), span(td("num", isNum(r.eps_estimate) ? r.eps_estimate.toFixed(2) : "–")));
  }
  return tr;
}

// =============================================================================================
// Activity
// =============================================================================================
const KIND_LABEL = { stock: "Stock", etf: "ETF", Stock: "Stock", ETF: "ETF", Futures: "Futures" };
function whenText(doc) {
  if (!doc?.available) return "";
  const upd = doc.updated ? new Date(doc.updated) : null;
  const t = upd ? upd.toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }) : "";
  return `session ${niceDate(doc.session)}${t ? ` · updated ${t}` : ""}`;
}
function logBlock(card, log, columns, opts = {}) {
  const det = $("details.log", card);
  if (!log || !log.rows.length) {
    $("summary .muted", det).textContent = "· nothing logged yet";
    $("table", det).replaceChildren();
    return;
  }
  $("summary .muted", det).textContent = `· ${log.rows.length} names over ${log.sessions.length} session${log.sessions.length === 1 ? "" : "s"}`;
  const cols = [...columns, { key: "seen", label: "Sessions", num: true, cell: (r) => td("num", String(r.sessions.length)) },
    { key: "lastSeen", label: "Last seen", cell: (r) => td("", niceDate(r.sessions[r.sessions.length - 1], false)) }];
  const rows = log.rows.map((r) => ({ ...r, seen: r.sessions.length, lastSeen: r.sessions[r.sessions.length - 1] }));
  buildTable($("table", det), cols, rows, { sortKey: "lastSeen", ...opts });
}
const symCol = { key: "symbol", label: "Ticker", cell: (r) => { const c = td("sym"); c.append(document.createTextNode(r.ticker || r.symbol.replace("^", "")), tvLink(r.tv || r.symbol.replace("^", "").replace("=F", "1!"))); return c; } };
const nameCol = { key: "name", label: "Name", cell: (r) => { const c = td("name", r.name); c.title = r.name; return c; } };

function renderActivity(b) {
  if (!setMeta("activity", b)) return;
  const a = b.about;
  // unusual volume
  const u = $("#act-unusual");
  $(".card-sub", u).textContent = a.unusual;
  $(".act-when", u).textContent = whenText(b.unusual);
  const uCols = (kind) => [symCol, nameCol,
    { key: "rel", label: "Rel vol", num: true, title: "Volume today ÷ 10-day average volume", cell: (r) => td("num", `${r.rel.toFixed(1)}x`) },
    { key: "day", label: "Day", num: true, cell: (r) => chg(r.day) },
    { key: "last", label: "Last", num: true, cell: (r) => td("num", fmtNum(r.last)) },
    { key: "size", label: kind === "stock" ? "Mkt cap" : "Assets", num: true, cell: (r) => td("num", fmtBig(r.size)) }];
  for (const kind of ["stock", "etf"]) {
    const rows = b.unusual.available ? b.unusual[kind === "stock" ? "stocks" : "etfs"] : [];
    buildTable($(`table[data-kind="${kind}"]`, u), uCols(kind), rows, { sortKey: "rel",
      empty: b.unusual.available ? "No names at 2x their usual volume yet." : "Not fetched yet." });
  }
  logBlock(u, b.unusual.log, [symCol, nameCol, { key: "kind", label: "Type", cell: (r) => td("", KIND_LABEL[r.kind] || r.kind) },
    { key: "best", label: "Best rel vol", num: true, cell: (r) => td("num", isNum(r.best) ? `${r.best.toFixed(1)}x` : "–") }]);

  // 200-day taps
  const tapCols = [symCol, nameCol, { key: "kind", label: "Type", cell: (r) => td("", r.kind) },
    { key: "taps10", label: "Taps (10d)", num: true, title: "Sessions in the last ten whose range touched the 200-day average", cell: (r) => td("num", String(r.taps10)) },
    { key: "last", label: "Last", num: true, cell: (r) => td("num", fmtNum(r.last)) },
    { key: "vs200", label: "vs 200-day", num: true, cell: (r) => chg(r.vs200) }];
  filteredActivity("#act-taps", b.taps, a.taps, tapCols, "taps-filter", { sortKey: null, empty: "No 200-day taps this session." },
    [symCol, nameCol, { key: "kind", label: "Type", cell: (r) => td("", r.kind) }, { key: "vs200", label: "vs 200-day (last)", num: true, cell: (r) => chg(r.vs200) }]);

  // record volume
  const recCols = [symCol, nameCol, { key: "kind", label: "Type", cell: (r) => td("", r.kind) },
    { key: "pct", label: "% of record", num: true, cell: (r) => td("num", `${r.pct.toFixed(0)}%`) },
    { key: "volume", label: "Volume", num: true, cell: (r) => td("num", fmtVol(r.volume)) },
    { key: "record_date", label: "Record day", cell: (r) => td("", r.record_date ? niceDate(r.record_date) : "–") },
    { key: "last", label: "Last", num: true, cell: (r) => td("num", fmtNum(r.last)) }];
  filteredActivity("#act-records", b.record_volume, a.record_volume, recCols, "rec-filter", { sortKey: "pct", empty: "No record-volume names this session." },
    [symCol, nameCol, { key: "kind", label: "Type", cell: (r) => td("", r.kind) }, { key: "best", label: "Best % of record", num: true, cell: (r) => td("num", isNum(r.best) ? `${r.best.toFixed(0)}%` : "–") }]);

  // European small caps
  const sc = $("#act-smallcaps");
  $(".card-sub", sc).textContent = a.eu_smallcaps;
  $(".act-when", sc).textContent = whenText(b.eu_smallcaps);
  const scCols = [{ key: "ticker", label: "Ticker", cell: (r) => { const c = td("sym"); c.append(document.createTextNode(r.ticker), tvLink(r.symbol)); return c; } },
    nameCol, { key: "country", label: "Country", cell: (r) => td("", r.country) },
    { key: "day", label: "Day", num: true, cell: (r) => chg(r.day, 1) },
    { key: "last", label: "Last", num: true, cell: (r) => td("num", `${fmtNum(r.last, r.last < 10 ? 3 : 2)} ${r.currency}`) },
    { key: "market_cap", label: "Mkt cap", num: true, cell: (r) => td("num", fmtBig(r.market_cap)) },
    { key: "traded", label: "Traded", num: true, cell: (r) => td("num", fmtBig(r.traded)) }];
  const scWarn = (b.warnings || []).find((w) => w.startsWith("TradingView"));
  buildTable($("table.main", sc), scCols, b.eu_smallcaps.available ? b.eu_smallcaps.rows : [], { sortKey: "day",
    empty: b.eu_smallcaps.available ? "No European small caps up 10% or more today." :
      "Not available yet: this list needs access to scanner.tradingview.com (TradingView's screener)." });
  logBlock(sc, b.eu_smallcaps.log, [scCols[0], nameCol, scCols[2], { key: "best", label: "Best day", num: true, cell: (r) => chg(r.best, 1) }]);
  void scWarn;
}
function filteredActivity(sel, doc, about, cols, key, opts, logCols) {
  const card = $(sel);
  $(".card-sub", card).textContent = about;
  $(".act-when", card).textContent = whenText(doc);
  let f = store.get(key, "all");
  const seg = $("[data-filter]", card);
  const draw = () => {
    segActive(seg, f);
    const rows = doc.available ? doc.rows.filter((r) => f === "all" || r.kind === f) : [];
    buildTable($("table.main", card), cols, rows, { ...opts, empty: doc.available ? opts.empty : "Not calculated yet." });
  };
  onSeg(seg, (v) => { f = v; store.set(key, v); draw(); });
  draw();
  logBlock(card, doc.log, logCols);
}

// =============================================================================================
// Performance tables
// =============================================================================================
function perfColumns(withTv = true) {
  const pc = (key, label) => ({ key, label, num: true, heat: true, cell: (r) => chg(r[key]) });
  return [
    { key: "ticker", label: "ETF", cell: (r) => { const c = td("sym"); c.append(document.createTextNode(r.ticker.replace("^", "")), ...(withTv ? [tvLink(r.tv)] : [])); return c; } },
    { key: "name", label: "Name", cell: (r) => td("name", r.name) },
    { key: "last", label: "Last", num: true, cell: (r) => td("num", fmtNum(r.last)) },
    pc("d1", "Day"), pc("w1", "Week"), pc("m1", "1M"), pc("m3", "3M"), pc("ytd", "YTD"), pc("y1", "1Y"),
    { key: "vs200", label: "vs 200d", num: true, title: "Distance from the 200-day average", cell: (r) => chg(r.vs200) },
  ];
}
function renderPerformance(b) {
  if (!setMeta("performance", b)) return;
  const sortKey = store.get("perf-sort", "w1");
  buildTable($("#perf-us table"), perfColumns(), b.us.filter((r) => r.available), { sortKey, heat: true, limit: 12 });
  buildTable($("#perf-country table"), perfColumns(), b.country.filter((r) => r.available), { sortKey, heat: true, limit: 12 });
  buildTable($("#perf-eu table"), perfColumns(), b.eu.filter((r) => r.available), { sortKey, heat: true, limit: 12 });
}

// =============================================================================================
// Options & flows
// =============================================================================================
const PC = Object.assign({ series: "spx", months: 6 }, store.get("putcall", {}));
function rollingMean(values, n) {
  const out = [];
  let sum = 0, count = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i] ?? 0; count += values[i] == null ? 0 : 1;
    if (i >= n) { sum -= values[i - n] ?? 0; count -= values[i - n] == null ? 0 : 1; }
    out.push(i >= n - 1 && count === n ? sum / n : null);
  }
  return out;
}
function drawPutCall(b) {
  const card = $("#card-pc");
  const list = b.put_call;
  const sel = $("[data-pc-series]", card);
  fillSelect(sel, list.map((p) => [p.key, p.label]), PC.series);
  sel.onchange = () => { PC.series = sel.value; store.set("putcall", PC); drawPutCall(b); };
  segActive($("[data-pc-range]", card), PC.months);
  onSeg($("[data-pc-range]", card), (v) => { PC.months = +v; store.set("putcall", PC); drawPutCall(b); });
  $(".pc-explain", card).textContent = b.put_call_explain || "";
  const p = list.find((x) => x.key === PC.series) || list[0];
  const box = $(".chart", card);
  const stats = $(".stats", card);
  if (!p.available) {
    $(".card-sub", card).textContent = `${p.label}: no data yet. Source: ${p.source}; the history starts with the first evening refresh.`;
    stats.replaceChildren(); box.replaceChildren(el("div", "na", "No data yet.")); return;
  }
  const ma5 = rollingMean(p.values, 5), ma10 = rollingMean(p.values, 10);
  const cut = new Date(); cut.setMonth(cut.getMonth() - PC.months);
  const from = cut.toISOString().slice(0, 10);
  const win = ma5.filter((v, i) => isNum(v) && p.dates[i] >= from);
  const last5 = ma5[ma5.length - 1];
  const pctile = isNum(last5) && win.length ? 100 * win.filter((x) => x <= last5).length / win.length : null;
  $(".card-sub", card).textContent = `${p.label} · source ${p.source}, data since ${niceDate(p.since)}` +
    (p.dates.length < 30 ? ` · only ${p.dates.length} trading day${p.dates.length === 1 ? "" : "s"} so far: Yahoo has no history for ETF option volume, so it builds up with every refresh` : "");
  const stat = (label, value) => { const s = el("div", "stat"); s.append(el("div", "label", label), el("div", "big", value)); return s; };
  stats.replaceChildren(stat(`Latest (${niceDate(p.dates[p.dates.length - 1], false)})`, p.values[p.values.length - 1].toFixed(2)),
    stat("5-day average", isNum(last5) ? last5.toFixed(2) : "–"),
    stat("Percentile in period", isNum(pctile) ? ordinal(pctile) : "–"),
    ...(isNum(p.oi_latest) ? [stat("Open-interest put/call", p.oi_latest.toFixed(2))] : []));
  const chart = makeChart(box);
  const few = p.dates.length <= 40;
  const raw = addLine(chart, pts(p.dates, p.values), { color: cssVar("--axis"), width: 1, title: "", fmt: "num2", points: few, lastValue: false });
  addLine(chart, pts(p.dates, ma5), { color: cssVar("--blue"), width: 2, title: "5d", fmt: "num2" });
  addLine(chart, pts(p.dates, ma10), { color: cssVar("--orange"), width: 1.5, title: "10d", fmt: "num2" });
  hline(raw, 1);
  const reset = () => { chart.timeScale().setVisibleRange({ from: from < p.dates[0] ? p.dates[0] : from, to: p.dates[p.dates.length - 1] }); };
  box._reset = reset;
  try { reset(); } catch (e) { chart.timeScale().fitContent(); }
  tooltip(chart, box, (param, iso) => {
    const i = p.dates.indexOf(iso);
    if (i < 0) return null;
    return `<div class="t-date">${niceDate(iso)}</div>Put/call <b>${fmtNum(p.values[i])}</b><br>` +
      `${sw(cssVar("--blue"))}5-day ${isNum(ma5[i]) ? ma5[i].toFixed(2) : "–"}<br>${sw(cssVar("--orange"))}10-day ${isNum(ma10[i]) ? ma10[i].toFixed(2) : "–"}`;
  });
}

let family = store.get("short-family", "SPY");
function drawShortShare(s) {
  const card = $("#card-short");
  const fams = Object.keys(s.families);
  const box = $(".chart", card);
  if (!fams.length) { box.replaceChildren(el("div", "na", "No data yet.")); return; }
  if (!s.families[family]) family = fams[0];
  const seg = $("[data-fam]", card);
  seg.replaceChildren(...fams.map((f) => { const b = el("button", "", f); b.type = "button"; b.dataset.v = f; return b; }));
  segActive(seg, family);
  onSeg(seg, (v) => { family = v; store.set("short-family", v); drawShortShare(s); });
  const f = s.families[family];
  $(".fam-name", card).textContent = family;
  $(".card-sub", card).textContent = `Inverse ETFs' share of the family's daily dollar volume (close × shares), since ${s.since.slice(0, 4)}. ` +
    `A rising share means more traders are buying downside protection or betting on a fall.`;
  const stat = (label, value) => { const x = el("div", "stat"); x.append(el("div", "label", label), el("div", "big", value)); return x; };
  $(".stats", card).replaceChildren(stat("10-day average", `${f.avg_latest.toFixed(1)}%`),
    stat(`Latest session (${niceDate(f.date, false)})`, `${f.latest.toFixed(1)}%`),
    stat(`Percentile since ${s.since.slice(0, 4)}`, isNum(f.pct) ? ordinal(f.pct) : "–"));
  $(".chart-note", card).textContent = `Family: ${f.long.join(", ")} (long) and ${f.short.join(", ")} (inverse). ` +
    `Top: ${family} price. Bottom: short-ETF share, grey daily, red 10-day average; dashed: high since ${s.since.slice(0, 4)} ` +
    `(${f.high.toFixed(1)}% on ${niceDate(f.high_date)}). High readings tend to come near lows.`;
  const chart = makeChart(box);
  const price = addLine(chart, pts(f.dates, f.price), { color: cssVar("--price"), width: 1.2, title: `${family}`, fmt: "num" });
  const daily = addBars(chart, pts(f.dates, f.share), { pane: 1, color: cssVar("--axis"), title: "", fmt: "pct1", lastValue: false });
  const avg = addLine(chart, pts(f.dates, f.avg10), { pane: 1, color: cssVar("--neg"), width: 1.5, title: "10d", fmt: "pct1" });
  hline(daily, f.high, { color: cssVar("--neg") });
  paneHeights(chart, [1.2, 1]);
  chart.timeScale().fitContent();
  tooltip(chart, box, (param, iso) => {
    const i = f.dates.indexOf(iso);
    if (i < 0) return null;
    return `<div class="t-date">${niceDate(iso)}</div>${family} ${fmtNum(f.price[i])}<br>Short share <b>${fmtNum(f.share[i], 1)}%</b><br>` +
      `${sw(cssVar("--neg"))}10-day ${isNum(f.avg10[i]) ? f.avg10[i].toFixed(1) + "%" : "–"}`;
  });
  void price; void avg;
}

function renderFlows(b) {
  if (!setMeta("flows", b)) return;
  drawPutCall(b);
  drawShortShare(b.short_share);
}

// =============================================================================================
// Charts: streaks and price charts
// =============================================================================================
const ST = Object.assign({ ticker: "^GSPC", dir: "decline", years: 0 }, store.get("streak", {}));
async function drawStreak() {
  const card = $("#card-streak");
  const sel = $("[data-st-index]", card);
  const keys = DATA.charts_meta?.streak || [];
  if (!keys.includes(ST.ticker)) ST.ticker = keys[0];
  fillSelect(sel, keys.map((k) => [k, DATA.charts_meta.names[k] || k]), ST.ticker);
  sel.onchange = () => { ST.ticker = sel.value; store.set("streak", ST); drawStreak(); };
  segActive($("[data-st-dir]", card), ST.dir);
  segActive($("[data-st-range]", card), ST.years);
  const box = $(".chart", card);
  let d;
  try { d = await detail("streak", ST.ticker); } catch (err) { box.replaceChildren(el("div", "warn-msg", String(err))); return; }
  if (!d.available) { box.replaceChildren(el("div", "na", "No data yet.")); return; }
  const s = d[ST.dir];
  const word = ST.dir === "decline" ? "decline" : "gain";
  $(".st-title", card).textContent = `${d.name} days without a 1% ${word}`;
  $(".st-current", card).textContent = String(s.current);
  $(".st-sub", card).textContent = `last 1% ${ST.dir === "decline" ? "drop" : "rise"} ${s.last_hit ? `${niceDate(s.last_hit)} (${signed(s.last_move, 2)})` : "–"} · ` +
    `${s.at_least} streaks at least as long since ${d.first} · record ${s.record} days (${niceDate(s.record_date)})`;
  const chart = makeChart(box, { left: true });
  const price = addLine(chart, pts(d.dates, d.close), { scale: "left", color: cssVar("--price"), width: 1.2, title: "", fmt: "num0", lastValue: true });
  chart.priceScale("left").applyOptions({ mode: 1, scaleMargins: { top: 0.06, bottom: 0.04 } });
  const area = addArea(chart, pts(d.dates, s.streak), { color: cssVar("--blue"), top: cssVar("--sky"), bottom: "rgba(0,0,0,0)", width: 1, fmt: "int", title: "days" });
  area.priceScale().applyOptions({ scaleMargins: { top: 0.08, bottom: 0 } });
  area.attachPrimitive(new Bands([{ from: 30, to: 50, color: cssVar("--band-mid") }]));
  const labels = new Labels([], { noOverlap: true });
  area.attachPrimitive(labels);
  const peaks = s.peaks.dates.map((t, i) => ({ time: t, value: s.peaks.values[i] }));
  const updateLabels = () => {
    const r = chart.timeScale().getVisibleRange();
    if (!r) return;
    const from = isoOf(r.from), to = isoOf(r.to);
    const vis = peaks.filter((p) => p.time >= from && p.time <= to).sort((a, b) => b.value - a.value).slice(0, 36);
    labels.labels = vis.map((p) => ({ ...p, text: String(p.value) })).sort((a, b) => (a.time < b.time ? -1 : 1));
    area.applyOptions({});
  };
  chart.timeScale().subscribeVisibleTimeRangeChange(updateLabels);
  const reset = () => showYears(chart, d.dates[d.dates.length - 1], ST.years, d.dates[0]);
  box._reset = reset;
  reset();
  updateLabels();
  tooltip(chart, box, (param, iso) => {
    const v = param.seriesData.get(area), c = param.seriesData.get(price);
    if (!v) return null;
    return `<div class="t-date">${niceDate(iso)}</div>${sw(cssVar("--blue"))}${v.value} days without a 1% ${word}<br>${d.name} ${c ? fmtNum(c.value) : "–"}`;
  });
}
onSeg($("#card-streak [data-st-dir]"), (v) => { ST.dir = v; store.set("streak", ST); drawStreak(); });
onSeg($("#card-streak [data-st-range]"), (v) => { ST.years = +v; store.set("streak", ST); drawStreak(); });

const PR = Object.assign({ ticker: "^GSPC", freq: "daily", breadth: "" }, store.get("price-chart", {}));
async function drawPrice() {
  const card = $("#card-price");
  const keys = DATA.charts_meta?.price || [];
  if (!keys.includes(PR.ticker)) PR.ticker = keys[0];
  const sel = $("[data-pr-ticker]", card);
  fillSelect(sel, keys.map((k) => [k, DATA.charts_meta.names[k] || k]), PR.ticker);
  sel.onchange = () => { PR.ticker = sel.value; store.set("price-chart", PR); drawPrice(); };
  segActive($("[data-pr-freq]", card), PR.freq);
  const bsel = $("[data-pr-breadth]", card);
  bsel.value = PR.breadth;
  bsel.onchange = () => { PR.breadth = bsel.value; store.set("price-chart", PR); drawPrice(); };
  const box = $(".chart", card);
  let c;
  try { c = await detail("price", PR.ticker); } catch (err) { box.replaceChildren(el("div", "warn-msg", String(err))); return; }
  if (!c.available) { box.replaceChildren(el("div", "na", "No data yet.")); return; }
  const tvSym = DATA.charts_meta.tv?.[PR.ticker];
  const tv = $(".pr-tv", card);
  tv.style.visibility = tvSym ? "visible" : "hidden";
  if (tvSym) tv.href = TV_CHART + encodeURIComponent(tvSym);
  $(".pr-sub", card).textContent = `${c.name} · ${PR.freq} candles with ${PR.freq === "daily" ? "50- and 200-day" : "10- and 40-week"} moving averages` +
    (PR.breadth && c.breadth[PR.breadth] ? ` · lower panel: ${c.breadth[PR.breadth].label} (${c.breadth_region})` : "");
  $(".pr-last", card).textContent = fmtNum(c.last);
  $(".pr-when", card).textContent = `latest daily close · ${niceDate(c.date)}`;
  const { chart } = candleChart(box, c, PR.freq, { blueRed: true, visible: { daily: 180, weekly: 156 } });
  const br = PR.breadth && c.breadth[PR.breadth];
  if (br) {
    const s = addLine(chart, pts(br.dates, br.values), { pane: 1, color: cssVar("--blue"), width: 1.5, title: br.label.replace("% ", "%").slice(0, 18), fmt: PR.breadth === "summation" ? "num0" : "pct0" });
    if (PR.breadth !== "summation") { hline(s, 50, { style: LINE.dotted }); s.applyOptions({ autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }) }); }
    else hline(s, 0, { style: LINE.dotted });
    paneHeights(chart, [3, 1]);
  }
}
onSeg($("#card-price [data-pr-freq]"), (v) => { PR.freq = v; store.set("price-chart", PR); drawPrice(); });

// =============================================================================================
// Seasonality
// =============================================================================================
const SE = Object.assign({ years: 15, stat: "avg" }, store.get("seasonality", {}));
function renderSeasonality(b) {
  if (!setMeta("seasonality", b)) return;
  const root = $("#seasonality");
  $(".card-sub", root).textContent = b.about;
  segActive($("[data-se-years]", root), SE.years);
  segActive($("[data-se-stat]", root), SE.stat);
  onSeg($("[data-se-years]", root), (v) => { SE.years = +v; store.set("seasonality", SE); renderSeasonality(b); });
  onSeg($("[data-se-stat]", root), (v) => { SE.stat = v; store.set("seasonality", SE); renderSeasonality(b); });
  const table = $("table.season", root);
  const head = el("thead");
  const htr = el("tr");
  htr.append(el("th", "", ""));
  MON.forEach((m, i) => htr.append(el("th", i + 1 === b.month ? "now" : "", m)));
  head.append(htr);
  const body = el("tbody");
  const all = b.rows.flatMap((r) => Object.values(r.windows[SE.years]).map((c) => c[SE.stat])).filter(isNum);
  // Colour scale: the 90th percentile of all cells, so one volatile market (bitcoin) does not wash out the rest.
  const absSorted = all.map(Math.abs).sort((x, y) => x - y);
  const scale = SE.stat === "up" ? 50 : Math.max(0.5, absSorted[Math.floor(absSorted.length * 0.9)] || 1);
  for (const r of b.rows) {
    const tr = el("tr");
    const name = td("", r.label);
    name.title = `monthly data since ${r.first}`;
    tr.append(name);
    for (let m = 1; m <= 12; m++) {
      const c = r.windows[SE.years][m];
      const v = c?.[SE.stat];
      const cell = td(`cell ${m === b.month ? "now" : ""}`, !isNum(v) ? "–" : SE.stat === "up" ? `${v.toFixed(0)}%` : signed(v, 1, ""));
      if (isNum(v)) {
        const x = SE.stat === "up" ? (v - 50) / 50 : v / scale;
        cell.style.background = `rgba(${cssVar(x >= 0 ? "--pos-bg" : "--neg-bg")}, ${(0.05 + 0.40 * Math.min(1, Math.abs(x))).toFixed(3)})`;
        cell.title = `${r.label}, ${MON[m - 1]} over ${c.n} years: average ${signed(c.avg, 2)}, median ${signed(c.median, 2)}, ` +
          `up in ${c.up.toFixed(0)}% of years, best ${signed(c.best, 1)}, worst ${signed(c.worst, 1)}`;
      }
      tr.append(cell);
    }
    body.append(tr);
  }
  table.replaceChildren(head, body);
}

// =============================================================================================
// More charts: generic multi-panel specs from the server
// =============================================================================================
function seriesColor(role, idx) {
  if (role === "price") return cssVar("--price");
  if (role === "ref") return cssVar("--muted");
  const pal = ["--blue", "--orange", "--green", "--purple", "--gold"];
  return cssVar(pal[idx % pal.length]);
}
function specCard(spec) {
  const card = el("article", "card");
  const head = el("div", "card-head");
  head.append(el("h3", "", spec.title));
  if (spec.tv) { const a = tvLink(spec.tv, "Open in TradingView ↗"); a.className = "tv"; a.style.marginLeft = "auto"; head.append(a); }
  card.append(head);
  if (spec.subtitle) card.append(el("p", "card-sub", spec.subtitle));
  if (!spec.available) { card.append(el("div", "na", "No data yet.")); return card; }
  const legend = el("div", "legend static");
  const colors = [];
  let ind = 0, ma = 0;
  spec.panels.forEach((p) => colors.push(p.series.map((s) => s.role === "ma" ? seriesColor("ind", 1 + (ma++)) : seriesColor(s.role, s.role === "ind" ? ind++ : 0))));
  spec.panels.forEach((p, pi) => p.series.forEach((s, si) => { const x = el("span", "", s.label); x.style.setProperty("--c", colors[pi][si]); legend.append(x); }));
  const box = el("div", `chart ${spec.panels.length > 2 ? "h440" : spec.panels.length > 1 ? "h360" : "h300"}`);
  card.append(legend, box);
  if (spec.explain) card.append(explainBox("What does this show?", spec.explain));
  queueMicrotask(() => {
    const chart = makeChart(box);
    const all = [];
    spec.panels.forEach((p, pi) => {
      let first = null;
      p.series.forEach((s, si) => {
        const data = pts(spec.dates, s.values);
        let series;
        if (s.kind === "bar") {
          const lim = p.hlines[0]?.[0];
          series = addBars(chart, data.map((x) => ({ ...x, color: isNum(lim) && lim < 0 && x.value <= lim ? cssVar("--neg") : colors[pi][si] })),
            { pane: pi, fmt: p.fmt, title: "" });
        } else {
          series = addLine(chart, data, { pane: pi, color: colors[pi][si], width: s.role === "ma" ? 1.2 : s.role === "price" ? 1.5 : 1.8,
            fmt: p.fmt, title: "", lastValue: s.role !== "ma" });
        }
        all.push([series, s.label, colors[pi][si], p.fmt]);
        if (!first) first = series;
      });
      for (const [v] of p.hlines || []) hline(first, v);
      if (p.bands?.length) first.attachPrimitive(new Bands(p.bands.map(([lo, hi, kind]) => ({ from: lo, to: hi, color: cssVar(kind === "low" ? "--band-low" : "--band-high") }))));
    });
    if (spec.panels.length > 1) paneHeights(chart, spec.panels.map((p) => p.height));
    chart.timeScale().fitContent();
    tooltip(chart, box, (param, iso) => {
      let html = `<div class="t-date">${niceDate(iso)}</div>`;
      let any = false;
      for (const [s, label, c, fmt] of all) {
        const v = param.seriesData.get(s);
        if (!v || !isNum(v.value)) continue;
        any = true;
        html += `${sw(c)}${esc(label)} <b>${(FMT[fmt] || FMT.num)(v.value)}</b><br>`;
      }
      return any ? html : null;
    });
  });
  return card;
}
function renderSpecs(container, specs) { container.replaceChildren(...(specs || []).filter(Boolean).map(specCard)); }

function sparkSvg(values) {
  const v = values.filter(isNum);
  if (v.length < 2) return el("span");
  const min = Math.min(...v), max = Math.max(...v), w = 110, h = 26;
  const pts2 = values.map((x, i) => isNum(x) ? `${(i / (values.length - 1) * w).toFixed(1)},${(h - 2 - (x - min) / (max - min || 1) * (h - 4)).toFixed(1)}` : null).filter(Boolean);
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", w); svg.setAttribute("height", h); svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  const pl = document.createElementNS(ns, "polyline");
  pl.setAttribute("points", pts2.join(" ")); pl.setAttribute("fill", "none"); pl.setAttribute("stroke", cssVar("--blue")); pl.setAttribute("stroke-width", "1.5");
  svg.append(pl);
  return svg;
}
function renderRates(b) {
  if (!setMeta("rates", b)) return;
  const cols = [
    { key: "name", label: "Series", cell: (r) => { const c = td(""); c.append(document.createTextNode(r.name)); if (r.tv) c.append(tvLink(r.tv)); return c; } },
    { key: "value", label: "Value", num: true, cell: (r) => td("num", isNum(r.value) ? `${r.value.toFixed(2)}${r.id === "T10Y2Y" ? " pp" : "%"}` : "–") },
    { key: "d1", label: "1D", num: true, cell: (r) => chg(r.d1, 0, " bp", false) },
    { key: "w1", label: "1W", num: true, cell: (r) => chg(r.w1, 0, " bp", false) },
    { key: "m1", label: "1M", num: true, cell: (r) => chg(r.m1, 0, " bp", false) },
    { key: "pct3y", label: "3Y %ile", num: true, cell: (r) => td("num", isNum(r.pct3y) ? ordinal(r.pct3y) : "–") },
    { key: "spark", label: "3 months", sort: false, cell: (r) => { const c = td(""); if (r.spark) c.append(sparkSvg(r.spark)); return c; } },
  ];
  buildTable($("#rates .rates-table"), cols, b.rows);
  renderSpecs($("#rates .charts"), b.charts);
}
function assetColumns(rows) {
  const pc = (key, label) => ({ key, label, num: true, cell: (r) => chg(r[key], 1) });
  const cols = [
    { key: "name", label: "Asset", cell: (r) => { const c = td(""); c.append(document.createTextNode(r.name), el("span", "muted", ` ${r.ticker.replace("^", "")}`)); if (r.tv) c.append(tvLink(r.tv)); return c; } },
    { key: "last", label: "Last", num: true, cell: (r) => td("num", fmtNum(r.last)) },
    pc("w1", "1W"), pc("m1", "1M"), pc("m3", "3M"), pc("vs50", "vs 50d"), pc("vs200", "vs 200d"),
    { key: "rsi", label: "RSI", num: true, cell: (r) => td("num", isNum(r.rsi) ? r.rsi.toFixed(0) : "–") },
  ];
  if (rows.some((r) => isNum(r.cot_pct))) cols.push({ key: "cot_pct", label: "COT %ile", num: true, cell: (r) => td("num", isNum(r.cot_pct) ? r.cot_pct.toFixed(0) : "–") });
  if (rows.some((r) => isNum(r.rv_pct))) cols.push({ key: "rv_pct", label: "Vol %ile", num: true, cell: (r) => td("num", isNum(r.rv_pct) ? r.rv_pct.toFixed(0) : "–") },
    { key: "compression", label: "Compression", sort: false, cell: (r) => td("", r.compression == null ? "–" : r.compression ? "yes" : "no") });
  return cols;
}
function renderAssets(id) {
  return (b) => {
    if (!setMeta(id, b)) return;
    buildTable($(`#${id} .asset-table`), assetColumns(b.rows), b.rows);
    renderSpecs($(`#${id} .charts`), b.charts);
  };
}
function renderChartsOnly(id) { return (b) => { if (setMeta(id, b)) renderSpecs($(`#${id} .charts`), b.charts); }; }

// folding of the detail sections
const FOLDABLE = $$("section.fold").map((s) => s.id);
const folded = new Set(store.get("folded-v2", FOLDABLE));
const rendered = new Set();
function setFolded(id, fold) {
  const sec = document.getElementById(id);
  sec.classList.toggle("collapsed", fold);
  const btn = $(".section-toggle", sec);
  btn.textContent = fold ? "Show" : "Hide";
  btn.setAttribute("aria-expanded", String(!fold));
  if (fold) folded.add(id); else folded.delete(id);
  store.set("folded-v2", [...folded]);
  if (!fold && DATA && !rendered.has(id)) renderSection(id);
}
for (const id of FOLDABLE) {
  const sec = document.getElementById(id);
  const btn = el("button", "section-toggle");
  btn.type = "button";
  btn.addEventListener("click", () => setFolded(id, !sec.classList.contains("collapsed")));
  $(".section-head h2", sec).after(btn);
  setFolded(id, folded.has(id));
}
$$(".nav a").forEach((a) => a.addEventListener("click", () => {
  const id = a.getAttribute("href").slice(1);
  if (FOLDABLE.includes(id)) setFolded(id, false);
}));

// =============================================================================================
const RENDERERS = {
  overview: renderOverview,
  summary: renderRegime,
  today: renderToday,
  positioning: renderPositioning,
  earnings: renderEarnings,
  activity: renderActivity,
  performance: renderPerformance,
  flows: renderFlows,
  charts: () => { drawStreak(); drawPrice(); },
  seasonality: renderSeasonality,
  stocks: renderChartsOnly("stocks"),
  appetite: renderChartsOnly("appetite"),
  volatility: renderChartsOnly("volatility"),
  rates: renderRates,
  dollar: renderAssets("dollar"), commodities: renderAssets("commodities"),
  crypto: renderAssets("crypto"), asia: renderAssets("asia"),
};
function renderSection(name) {
  if (FOLDABLE.includes(name) && folded.has(name)) return;   // drawn when opened
  rendered.add(name);
  try { RENDERERS[name](DATA[name]); } catch (err) { console.error(`render ${name} failed`, err); }
}
function renderAll() {
  if (!DATA) return;
  rendered.clear();
  renderStatus();
  for (const name of Object.keys(RENDERERS)) renderSection(name);
}

async function load() {
  try { DATA = await API.dashboard(); } catch (err) {
    $(".status-line").replaceChildren(el("span", "warn-msg", `Could not load the dashboard data: ${err}`));
    return;
  }
  DETAIL_CACHE.clear();
  renderAll();
}
async function start() {
  markThemeButtons();
  if (!window.LightweightCharts) {
    $(".status-line").replaceChildren(el("span", "warn-msg", "Charts need cdn.jsdelivr.net (TradingView Lightweight Charts)."));
  }
  try { WIDGETS = await API.widgets(); initWidgets(); } catch (err) { console.error(err); }
  await load();
  setInterval(load, 10 * 60 * 1000);
}
start();
