"use strict";

const TV_EMBED = "https://s3.tradingview.com/external-embedding/";
const TV_CHART = "https://www.tradingview.com/chart/?symbol=";
const STATE_TEXT = { green: "+ green", orange: "~ orange", red: "− red", nodata: "no data" };
let DATA = null;
let WIDGETS = null;
let heatmapMarket = "us";
let perfMarket = "us";
const charts = new Map();          // canvas id -> Chart instance
const groups = new Map();          // chart card id -> [Chart, ...] for synced hover

// ---------- helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined && text !== null) e.textContent = text;
  return e;
}
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const isNum = (x) => typeof x === "number" && Number.isFinite(x);

function fmtNum(x) {
  if (!isNum(x)) return "–";
  if (x === 0) return "0";
  const a = Math.abs(x);
  const nd = a >= 1000 ? 0 : a >= 100 ? 1 : a >= 1 ? 2 : 4;
  return x.toLocaleString("en-US", { minimumFractionDigits: nd, maximumFractionDigits: nd });
}
const FORMATS = {
  num: fmtNum,
  num0: (x) => isNum(x) ? x.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "–",
  num2: (x) => isNum(x) ? x.toFixed(2) : "–",
  pct0: (x) => isNum(x) ? `${x.toFixed(0)}%` : "–",
  pct1: (x) => isNum(x) ? `${x.toFixed(1)}%` : "–",
  pct2: (x) => isNum(x) ? `${x.toFixed(2)}%` : "–",
  sig: (x) => isNum(x) ? Number(x.toPrecision(4)).toString() : "–",
};
function signed(x, nd = 1, suffix = "") {
  if (!isNum(x)) return "–";
  const s = x > 0 ? "+" : x < 0 ? "−" : "±";
  return `${s}${Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: nd, maximumFractionDigits: nd })}${suffix}`;
}
function changeCell(x, nd = 1, suffix = "%", colored = true) {
  const tone = colored && isNum(x) ? (x > 0 ? "pos" : x < 0 ? "neg" : "") : "";
  return el("td", `num ${tone}`, signed(x, nd, suffix));
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
function setMeta(id, block) {
  const root = document.getElementById(id);
  $(".updated", root).textContent = block?.updated_at ? `updated ${block.updated_at}` : "not updated yet";
  if (block?.intro) {
    let intro = $(":scope > .intro", root);
    if (!intro) {
      intro = el("p", "intro");
      $(".section-head", root).after(intro);
    }
    intro.textContent = block.intro;
  }
  const w = $(".warnings", root);
  w.replaceChildren(...(block?.warnings || []).map((m) => el("div", "warn-msg", m)));
  if (block?.error) w.append(el("div", "warn-msg", `This section could not be built: ${block.error}`));
  return block && !block.error;
}

// ---------- theme ----------
function currentTheme() {
  const set = document.documentElement.dataset.theme;
  if (set) return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function markThemeButtons() {
  $$("[data-theme-set]").forEach((b) => b.classList.toggle("active", b.dataset.themeSet === currentTheme()));
}
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem("theme", theme); } catch (e) { /* storage blocked: keep for this visit */ }
  markThemeButtons();
  renderAll();
  initWidgets();
}
$$("[data-theme-set]").forEach((b) => b.addEventListener("click", () => setTheme(b.dataset.themeSet)));
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (!document.documentElement.dataset.theme) { markThemeButtons(); renderAll(); initWidgets(); }
});

// ---------- TradingView widgets ----------
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
  embed("heatmap", "embed-widget-stock-heatmap.js", {
    dataSource: WIDGETS.heatmap[heatmapMarket], exchanges: [], grouping: "sector",
    blockSize: "market_cap_basic", blockColor: "change", locale: "en", colorTheme: currentTheme(),
    hasTopBar: false, isDataSetEnabled: false, isZoomEnabled: true, hasSymbolTooltip: true,
    isMonoSize: false, width: "100%", height: "100%",
  });
  $$("[data-heatmap]").forEach((b) => b.classList.toggle("active", b.dataset.heatmap === heatmapMarket));
}
function initWidgets() {
  if (!WIDGETS) return;
  embed("ticker-tape", "embed-widget-ticker-tape.js", {
    symbols: WIDGETS.ticker_tape, showSymbolLogo: false, isTransparent: true,
    displayMode: "adaptive", colorTheme: currentTheme(), locale: "en",
  });
  embed("calendar", "embed-widget-events.js", {
    colorTheme: currentTheme(), isTransparent: true, width: "100%", height: "100%", locale: "en",
    importanceFilter: WIDGETS.calendar.importance, countryFilter: WIDGETS.calendar.countries,
  });
  renderHeatmap();
}
$$("[data-heatmap]").forEach((b) => b.addEventListener("click", () => {
  heatmapMarket = b.dataset.heatmap;
  renderHeatmap();
}));

// ---------- charts ----------
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function dateTick(iso, spanDays) {
  const [y, m, d] = iso.split("-");
  return spanDays > 400 ? `${MONTHS[+m - 1]} ${y.slice(2)}` : `${+d} ${MONTHS[+m - 1]}`;
}
function withAlpha(color, alpha) {
  if (color.startsWith("#") && color.length === 7) {
    const n = parseInt(color.slice(1), 16);
    return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  return color;
}

// Draws shaded bands and reference lines behind the data.
const guidesPlugin = {
  id: "guides",
  beforeDatasetsDraw(chart, args, opts) {
    const { ctx, chartArea: a, scales: { y } } = chart;
    if (!a || !y) return;
    ctx.save();
    for (const [lo, hi, kind] of opts.bands || []) {
      const top = y.getPixelForValue(Math.min(hi, y.max));
      const bottom = y.getPixelForValue(Math.max(lo, y.min));
      if (bottom <= top) continue;
      ctx.fillStyle = kind === "low" ? css("--good-bg") : css("--bad-bg");
      ctx.fillRect(a.left, top, a.right - a.left, bottom - top);
    }
    ctx.strokeStyle = css("--axis");
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    for (const [v] of opts.hlines || []) {
      if (v < y.min || v > y.max) continue;
      const py = y.getPixelForValue(v);
      ctx.beginPath(); ctx.moveTo(a.left, py); ctx.lineTo(a.right, py); ctx.stroke();
    }
    ctx.restore();
  },
};
// Vertical crosshair at the hovered date.
const crosshairPlugin = {
  id: "crosshair",
  afterDatasetsDraw(chart) {
    const idx = chart.$hoverIndex;
    if (idx == null || !chart.chartArea) return;
    const x = chart.scales.x.getPixelForValue(idx);
    const { ctx, chartArea: a } = chart;
    ctx.save();
    ctx.strokeStyle = css("--muted");
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, a.top); ctx.lineTo(x, a.bottom); ctx.stroke();
    ctx.restore();
  },
};
if (window.Chart) {
  Chart.register(guidesPlugin, crosshairPlugin);
  Chart.defaults.font.family = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  Chart.defaults.font.size = 11;
}

function seriesColors(spec) {
  const slots = [css("--series-1"), css("--series-2"), css("--series-3"), css("--series-4")];
  let ind = 0;
  let ma = 0;
  const maSlots = [css("--series-1"), css("--series-2"), css("--series-3"), css("--series-4")];
  return spec.panels.map((p) => p.series.map((s) => {
    if (s.role === "price") return css("--price");
    if (s.role === "ref") return css("--muted");
    if (s.role === "ma") return withAlpha(maSlots[(ma++) % maSlots.length], 0.75);
    return slots[(ind++) % slots.length];
  }));
}

function syncHover(groupId, index) {
  for (const c of groups.get(groupId) || []) {
    c.$hoverIndex = index;
    if (index == null) {
      c.setActiveElements([]);
      c.tooltip.setActiveElements([], { x: 0, y: 0 });
    } else {
      const active = c.data.datasets.map((d, i) => ({ datasetIndex: i, index }))
        .filter((a) => c.data.datasets[a.datasetIndex].data[index] != null);
      c.setActiveElements(active);
      c.tooltip.setActiveElements(active, { x: c.scales.x.getPixelForValue(index), y: c.chartArea.top });
    }
    c.draw();
  }
}

function explainBox(summary, text) {
  const d = el("details", "explain");
  d.append(el("summary", "", summary));
  if (typeof text === "string") d.append(el("p", "", text));
  else d.append(text);
  return d;
}

// Column titles get a tooltip, and a "Columns explained" box goes under the table.
function explainColumns(table) {
  const cols = DATA?.columns || {};
  const seen = [];
  $$("thead th", table).forEach((th) => {
    const key = th.textContent.replace(/[▾▴]/g, "").trim();
    const text = cols[key] || Object.entries(cols).find(([k]) => k.toLowerCase() === key.toLowerCase())?.[1];
    if (text) { th.title = text; seen.push([key, text]); }
  });
  const wrap = table.closest(".table-wrap") || table;
  let box = wrap.nextElementSibling;
  if (!box || !box.matches("details.explain.columns")) {
    box = el("details", "explain columns");
    box.append(el("summary", "", "Columns explained"));
    wrap.after(box);
  }
  const dl = el("dl");
  for (const [k, t] of seen) dl.append(el("dt", "", k), el("dd", "", t));
  box.querySelector("dl")?.remove();
  box.append(dl);
}

function chartCard(spec, opts = {}) {
  const card = el("article", "chart-card");
  card.id = `card-${spec.id}`;
  const head = el("div", "chart-head");
  head.append(el("h4", "", spec.title));
  if (spec.tv) {
    const a = tvLink(spec.tv, "Open in TradingView ↗");
    a.className = "tv";
    head.append(a);
  }
  card.append(head);
  if (spec.subtitle) card.append(el("p", "chart-sub", spec.subtitle));
  const help = spec.explain ? explainBox("What does this show?", spec.explain) : null;
  if (!spec.available || !window.Chart) {
    card.append(el("div", "na", !window.Chart ? "Charts need cdn.jsdelivr.net (Chart.js)." : "No data yet."));
    if (help) card.append(help);
    return card;
  }
  const colors = seriesColors(spec);
  const legend = el("div", "legend-row");
  spec.panels.forEach((p, pi) => p.series.forEach((s, si) => {
    const item = el("span", "", s.label);
    item.style.setProperty("--c", colors[pi][si]);
    legend.append(item);
  }));
  card.append(legend);

  const base = opts.height || 300;
  const n = spec.dates.length;
  const span = n > 1 ? (new Date(spec.dates[n - 1]) - new Date(spec.dates[0])) / 864e5 : 0;
  const groupId = card.id;
  groups.set(groupId, []);
  spec.panels.forEach((p, pi) => {
    const last = pi === spec.panels.length - 1;
    const wrap = el("div", "panel");
    wrap.style.height = `${Math.max(70, Math.round(base * p.height)) + (last ? 22 : 0)}px`;
    const canvas = el("canvas");
    canvas.id = `${spec.id}-p${pi}`;
    wrap.append(canvas);
    card.append(wrap);
    const fmt = FORMATS[p.fmt] || FORMATS.num;
    const datasets = p.series.map((s, si) => ({
      label: s.label,
      data: s.values,
      type: s.kind === "bar" ? "bar" : "line",
      borderColor: colors[pi][si],
      // Bars beyond a negative reference line (e.g. weeks down 5%+) are drawn in red.
      backgroundColor: s.kind === "bar" && (p.hlines[0]?.[0] ?? 0) < 0
        ? s.values.map((v) => (v != null && v <= p.hlines[0][0] ? css("--bad") : colors[pi][si]))
        : colors[pi][si],
      borderWidth: s.role === "price" ? 1.5 : s.role === "ma" ? 1.2 : s.role === "ref" ? 1 : 1.8,
      pointRadius: 0,
      pointHoverRadius: s.kind === "bar" ? 0 : 3,
      spanGaps: true,
      tension: 0,
      barPercentage: 1,
      categoryPercentage: 1,
    }));
    queueMicrotask(() => {
      const chart = new Chart(canvas, {
        type: "line",
        data: { labels: spec.dates, datasets },
        options: {
          responsive: true, maintainAspectRatio: false, animation: false, normalized: true,
          interaction: { mode: "index", intersect: false },
          layout: { padding: { left: 0, right: 4 } },
          plugins: {
            legend: { display: false },
            guides: { bands: p.bands, hlines: p.hlines },
            tooltip: {
              enabled: last,
              backgroundColor: css("--surface"), titleColor: css("--ink"), bodyColor: css("--ink-2"),
              borderColor: css("--border"), borderWidth: 1, padding: 8, boxPadding: 4,
              callbacks: {
                label: (c) => `${c.dataset.label}: ${fmt(c.parsed.y)}`,
                beforeBody: (items) => {
                  // Values from the other panels of this card, so one tooltip covers all.
                  const idx = items[0]?.dataIndex;
                  return spec.panels.flatMap((op, opi) => opi === pi ? [] : op.series.map((s) =>
                    `${s.label}: ${(FORMATS[op.fmt] || FORMATS.num)(s.values[idx])}`));
                },
              },
            },
          },
          scales: {
            x: {
              display: last,
              grid: { display: false },
              border: { color: css("--axis") },
              ticks: { color: css("--muted"), maxRotation: 0, autoSkip: true, maxTicksLimit: 7,
                       callback: (v) => dateTick(spec.dates[v], span) },
            },
            y: {
              position: "right",
              grid: { color: css("--grid") },
              border: { display: false },
              ticks: { color: css("--muted"), maxTicksLimit: p.height < 0.5 ? 4 : 6, callback: (v) => fmt(v) },
            },
          },
          onHover: (evt, active, c) => {
            const idx = c.scales.x.getValueForPixel(evt.x);
            syncHover(groupId, idx >= 0 && idx < n ? idx : null);
          },
        },
      });
      chart.canvas.addEventListener("mouseleave", () => syncHover(groupId, null));
      charts.get(canvas.id)?.destroy();
      charts.set(canvas.id, chart);
      groups.get(groupId).push(chart);
    });
  });
  if (help) card.append(help);
  return card;
}

function renderCharts(container, specs) {
  for (const [id, c] of charts) {
    if (!document.getElementById(id) || container.contains(c.canvas)) { c.destroy(); charts.delete(id); }
  }
  container.replaceChildren(...(specs || []).filter(Boolean).map((s) => chartCard(s)));
}

function sparkline(canvas, values) {
  if (!window.Chart) return;
  charts.get(canvas.id)?.destroy();
  charts.set(canvas.id, new Chart(canvas, {
    type: "line",
    data: { labels: values.map((_, i) => i), datasets: [{ data: values, borderColor: css("--series-1"),
            borderWidth: 1.5, pointRadius: 0, spanGaps: true, tension: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, animation: false, events: [],
               plugins: { legend: { display: false }, tooltip: { enabled: false } },
               scales: { x: { display: false }, y: { display: false } } },
  }));
}

// ---------- sortable tables ----------
function buildTable(table, columns, rows, opts = {}) {
  let sortKey = opts.sortKey || null;
  let asc = opts.asc || false;
  function draw() {
    const thead = el("thead");
    const tr = el("tr");
    for (const c of columns) {
      const th = el("th", `${c.num ? "num " : ""}${c.sort !== false ? "sortable" : ""}`, c.label);
      if (c.title) th.title = c.title;
      if (c.key === sortKey) th.classList.add("sorted", ...(asc ? ["asc"] : []));
      if (c.sort !== false) th.addEventListener("click", () => {
        asc = sortKey === c.key ? !asc : false;
        sortKey = c.key;
        draw();
      });
      tr.append(th);
    }
    thead.append(tr);
    const sorted = sortKey ? [...rows].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (va == null) return 1;
      if (vb == null) return -1;
      return (typeof va === "string" ? va.localeCompare(vb) : va - vb) * (asc ? 1 : -1);
    }) : rows;
    const tbody = el("tbody");
    for (const r of sorted) {
      const row = el("tr");
      for (const c of columns) row.append(c.cell(r));
      tbody.append(row);
    }
    table.replaceChildren(thead, tbody);
    explainColumns(table);
  }
  draw();
}

const nameCell = (r) => {
  const td = el("td");
  td.append(el("span", "", r.name));
  td.append(el("span", "muted", ` ${r.ticker.replace("^", "")}`));
  if (r.tv) td.append(tvLink(r.tv));
  return td;
};
const pctCol = (key, label, title) => ({ key, label, num: true, title, cell: (r) => changeCell(r[key]) });
const rsiCell = (r) => {
  const td = el("td", "num", isNum(r.rsi) ? r.rsi.toFixed(0) : "–");
  if (isNum(r.rsi) && r.rsi <= 30) td.append(el("span", "pill low", "OS"));
  if (isNum(r.rsi) && r.rsi >= 70) td.append(el("span", "pill high", "OB"));
  return td;
};
function percentilePill(p) {
  const td = el("td", "num");
  if (!isNum(p)) { td.textContent = "–"; return td; }
  const s = el("span", `pill ${p <= 10 ? "low" : p >= 90 ? "high" : ""}`, p.toFixed(0));
  td.append(s);
  return td;
}

function assetColumns(rows, benchName) {
  const cols = [
    { key: "name", label: "Asset", cell: nameCell },
    { key: "last", label: "Last", num: true, cell: (r) => el("td", "num", fmtNum(r.last)) },
    pctCol("w1", "1W"), pctCol("m1", "1M"), pctCol("m3", "3M"),
  ];
  if (rows.some((r) => isNum(r.rel_m1))) {
    cols.push(pctCol("rel_m1", `Rel 1M`, `1-month return minus ${benchName}`),
              pctCol("rel_m3", `Rel 3M`, `3-month return minus ${benchName}`));
  }
  cols.push(pctCol("vs50", "vs 50d", "Distance from the 50-day average"),
            pctCol("vs200", "vs 200d", "Distance from the 200-day average"),
            { key: "rsi", label: "RSI", num: true, cell: rsiCell });
  if (rows.some((r) => isNum(r.cot_pct))) {
    cols.push({ key: "cot_pct", label: "COT %ile", num: true, title: "Net/OI percentile since 2006",
                cell: (r) => percentilePill(r.cot_pct) });
  }
  if (rows.some((r) => isNum(r.rv_pct))) {
    cols.push({ key: "rv_pct", label: "Vol %ile", num: true, title: "90-day realized volatility percentile",
                cell: (r) => el("td", "num", isNum(r.rv_pct) ? r.rv_pct.toFixed(0) : "–") },
              { key: "compression", label: "Compression", sort: false,
                cell: (r) => el("td", "", r.compression == null ? "–" : r.compression ? "yes" : "no") });
  }
  return cols;
}

// ---------- sections ----------
function renderSummary(b) {
  if (!setMeta("summary", b)) return;
  const v = b.verdict;
  $("#summary .verdict").replaceChildren(
    el("span", `label ${v.label.toLowerCase().replace(/\s+/g, "-")}`, v.label),
    el("span", "expl", v.explanation));
  $("#summary .indicators").replaceChildren(...b.indicators.map((ind) => {
    const card = el("button", `ind ${ind.color}`);
    card.type = "button";
    card.append(el("div", "name", ind.label), el("div", "val", ind.value),
                el("div", "state", STATE_TEXT[ind.color]), el("div", "why"));
    const why = $(".why", card);
    if (ind.meaning) why.append(el("span", "meaning", ind.meaning));
    why.append(el("span", "", ind.reason));
    card.addEventListener("click", () => card.classList.toggle("open"));
    return card;
  }));
  $("#summary .tiles").replaceChildren(...b.tiles.map((t) => {
    const tile = el(t.tv ? "a" : "div", "tile");
    if (t.tv) { tile.href = TV_CHART + encodeURIComponent(t.tv); tile.target = "_blank"; tile.rel = "noopener"; }
    tile.append(el("div", "t-label", t.label), el("div", "t-value", t.value));
    if (t.about) tile.title = t.about;
    if (t.change_label) {
      const suffix = t.change_label.includes("%") ? "%" : t.change_label.includes("bp") ? " bp" : "";
      const nd = t.change_label.includes("bp") ? 0 : 1;
      const tone = t.colored ? (t.change > 0 ? "pos" : t.change < 0 ? "neg" : "") : "";
      tile.append(el("div", `t-change ${tone}`,
                     `${signed(t.change, nd, suffix)} ${t.change_label.replace(/ ?(%|bp|pts)/, "")}`));
    }
    return tile;
  }));
  const tilesBox = $("#summary .tiles");
  const dl = el("dl");
  for (const t of b.tiles) if (t.about) dl.append(el("dt", "", t.label), el("dd", "", t.about));
  const tilesHelp = explainBox("What are these numbers?", dl);
  tilesHelp.style.gridColumn = "1 / -1";
  tilesBox.append(tilesHelp);
  const verdictBox = $("#summary .verdict");
  verdictBox.append(explainBox("How is this verdict made?",
    "Each tile below is green (+1), orange (0) or red (−1) against fixed thresholds in config.yaml. " +
    "The score is the sum divided by the number of tiles with data. Risk-on means most signals are healthy, " +
    "risk-off means most point to stress. Hover or tap a tile to see what it measures and why it has its colour."));
  const list = $("#summary .signals");
  list.replaceChildren(...(b.signals.length ? b.signals.map((s) => {
    const li = el("li", `lvl-${s.level}`);
    li.append(el("span", "area", s.area), el("span", "", s.text));
    return li;
  }) : [el("li", "empty", "No extremes right now.")]));
}

function renderToday(b) {
  if (!setMeta("today", b)) return;
  $("#today .expected").replaceChildren(...(b.expected_moves.length ? b.expected_moves.map((m) => {
    const box = el("div", "em");
    box.append(
      el("div", "big", `${m.name}: ± ${fmtNum(m.points)} pts (± ${m.pct.toFixed(2)}%)`),
      el("div", "sub", `Range ${fmtNum(m.low)} – ${fmtNum(m.high)}. Close ${fmtNum(m.price)} (${m.price_date}) × ` +
                       `${m.vol_name} ${m.vol.toFixed(2)} (${m.vol_date}) / 100 / √252`));
    return box;
  }) : [el("div", "muted", "No data yet.")]));
}

function renderLeaders(rows) {
  const box = $("#stocks .leaders");
  const max = Math.max(1, ...rows.flatMap((r) => [Math.abs(r.rel_m1 || 0), Math.abs(r.rel_m3 || 0)]));
  box.replaceChildren(...rows.map((r) => {
    const row = el("div", "lead-row");
    row.append(el("span", "", r.name));
    const track = el("div", "bar-track");
    track.append(el("div", "zero"));
    const bar = el("div", `bar ${r.rel_m1 >= 0 ? "pos-bar" : "neg-bar"}`);
    const w = 50 * Math.abs(r.rel_m1) / max;
    bar.style.left = r.rel_m1 >= 0 ? "50%" : `${50 - w}%`;
    bar.style.width = `${w}%`;
    track.append(bar);
    if (isNum(r.rel_m3)) {
      const dot = el("div", "dot");
      dot.style.left = `${50 + 50 * r.rel_m3 / max}%`;
      dot.title = `3M relative: ${signed(r.rel_m3, 1, "%")}`;
      track.append(dot);
    }
    row.title = `${r.name}: 1M ${signed(r.rel_m1, 1, "%")}, 3M ${signed(r.rel_m3, 1, "%")} vs SPY`;
    row.append(track, el("span", `v ${r.rel_m1 >= 0 ? "pos" : "neg"}`, signed(r.rel_m1, 1, "%")));
    return row;
  }));
}

function renderPerfTable() {
  const b = DATA?.stocks;
  if (!b || b.error) return;
  const rows = b.tables[perfMarket];
  buildTable($("#stocks .perf-table"), assetColumns(rows, perfMarket === "us" ? "SPY" : "STOXX 600"), rows,
             { sortKey: "w1" });
  $$("[data-perf]").forEach((x) => x.classList.toggle("active", x.dataset.perf === perfMarket));
}
$$("[data-perf]").forEach((b) => b.addEventListener("click", () => { perfMarket = b.dataset.perf; renderPerfTable(); }));

function renderStocks(b) {
  if (!setMeta("stocks", b)) return;
  renderCharts($("#stocks .charts"), b.charts);
  renderLeaders(b.leaders);
  renderPerfTable();
}

function renderChartsOnly(id) {
  return (b) => { if (setMeta(id, b)) renderCharts($(`#${id} .charts`), b.charts); };
}

let selectedCot = null;
async function showCot(key) {
  selectedCot = key;
  $$("#positioning .cot-table tr[data-key]").forEach((r) => r.classList.toggle("selected", r.dataset.key === key));
  const box = $("#positioning .cot-chart");
  try {
    const spec = await (await fetch(`/api/cot/${key}`)).json();
    renderCharts(box, [spec]);
  } catch (err) {
    box.replaceChildren(el("div", "warn-msg", `Could not load the chart: ${err}`));
  }
}

function renderPositioning(b) {
  if (!setMeta("positioning", b)) return;
  $("#positioning .cot-date").textContent = b.report_date
    ? `positions as of Tuesday ${new Date(b.report_date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
    : "";
  const table = $("#positioning .cot-table");
  const head = el("thead");
  const htr = el("tr");
  [["Asset"], ["Cohort"], ["Net", true], ["1W chg", true], ["Net/OI", true], ["All-time", true, "Percentile since the start of the data"],
   ["5Y", true], ["1Y", true], ["Nominal", true, "Percentile of net contracts, all-time"]]
    .forEach(([t, num, title]) => { const th = el("th", num ? "num" : "", t); if (title) th.title = title; htr.append(th); });
  head.append(htr);
  const body = el("tbody");
  let group = null;
  for (const r of b.rows) {
    if (r.group !== group) {
      group = r.group;
      const g = el("tr", "group");
      const td = el("td", "", group);
      td.colSpan = 9;
      g.append(td);
      body.append(g);
    }
    const tr = el("tr");
    tr.dataset.key = r.key;
    tr.tabIndex = 0;
    tr.append(el("td", "", r.label), el("td", "muted", r.cohort_short));
    if (!r.available) {
      for (let i = 0; i < 7; i++) tr.append(el("td", "num", "–"));
    } else {
      tr.append(el("td", "num", FORMATS.num0(r.net)), changeCell(r.change, 0, ""),
                el("td", "num", `${r.net_oi_pct.toFixed(1)}%`),
                percentilePill(r.pct_all), percentilePill(r.pct_5y), percentilePill(r.pct_1y),
                percentilePill(r.pct_nominal));
      tr.title = `${r.cohort}, data since ${r.since}`;
    }
    tr.addEventListener("click", () => showCot(r.key));
    tr.addEventListener("keydown", (e) => { if (e.key === "Enter") showCot(r.key); });
    body.append(tr);
  }
  table.replaceChildren(head, body);
  explainColumns(table);
  const key = selectedCot || b.default_key;
  if (key === b.default_key && b.chart) {
    selectedCot = key;
    $$("#positioning .cot-table tr[data-key]").forEach((r) => r.classList.toggle("selected", r.dataset.key === key));
    renderCharts($("#positioning .cot-chart"), [b.chart]);
  } else if (key) {
    showCot(key);
  }
}

function renderRates(b) {
  if (!setMeta("rates", b)) return;
  const table = $("#rates .rates-table");
  const head = el("thead");
  const htr = el("tr");
  [["Series"], ["Value", true], ["1D", true], ["1W", true], ["1M", true], ["3Y %ile", true], ["3 months"]]
    .forEach(([t, num]) => htr.append(el("th", num ? "num" : "", t)));
  head.append(htr);
  const body = el("tbody");
  for (const r of b.rows) {
    const tr = el("tr");
    const name = el("td", "", r.name);
    if (r.tv) name.append(tvLink(r.tv));
    tr.append(name);
    if (!r.available) {
      tr.append(el("td", "num", "–"), el("td", "num", "–"), el("td", "num", "–"), el("td", "num", "–"),
                el("td", "num", "–"), el("td", "muted", "no data"));
    } else {
      const unit = r.id === "T10Y2Y" ? " pp" : "%";
      const val = el("td", "num", `${r.value.toFixed(2)}${unit}`);
      val.title = `as of ${r.date}`;
      const sparkTd = el("td");
      const wrap = el("div", "spark");
      const canvas = el("canvas");
      canvas.id = `spark-${r.id}`;
      wrap.append(canvas);
      sparkTd.append(wrap);
      tr.append(val, changeCell(r.d1, 0, " bp", false), changeCell(r.w1, 0, " bp", false),
                changeCell(r.m1, 0, " bp", false),
                el("td", "num", isNum(r.pct3y) ? ordinal(r.pct3y) : "–"), sparkTd);
      queueMicrotask(() => sparkline(canvas, r.spark));
    }
    body.append(tr);
  }
  table.replaceChildren(head, body);
  explainColumns(table);
  renderCharts($("#rates .charts"), b.charts);
}

function renderAssets(id, benchName) {
  return (b) => {
    if (!setMeta(id, b)) return;
    buildTable($(`#${id} .asset-table`), assetColumns(b.rows, benchName), b.rows);
    renderCharts($(`#${id} .charts`), b.charts);
  };
}


// ---------- index positioning (COT) ----------
const IC_COLORS = { am: "--series-1", lf: "--series-2", dealer: "--series-3" };
const IC_WINDOW_TEXT = { pct_all: "of all history", pct_5y: "of the last 5 years", pct_1y: "of the last year" };
const IC = Object.assign({ idx: "spx", range: 5, group: null, window: "pct_all", ma: true, log: false },
  (() => { try { return JSON.parse(localStorage.getItem("indexcot") || "{}"); } catch (e) { return {}; } })());
function saveIC() { try { localStorage.setItem("indexcot", JSON.stringify(IC)); } catch (e) { /* ignore */ } }
const toTs = (iso) => Date.parse(iso + "T00:00:00Z");
function labelClass(p) {
  if (!isNum(p)) return "";
  return p >= 90 ? "xl" : p >= 70 ? "l" : p <= 10 ? "xs" : p <= 30 ? "s" : "";
}
function labelText(p) {
  if (!isNum(p)) return "No data";
  return p >= 90 ? "Extremely long" : p >= 70 ? "Longer than usual" : p > 30 ? "Normal"
    : p > 10 ? "Shorter than usual" : "Extremely short";
}
function nearestIndex(xs, x) {
  let lo = 0, hi = xs.length - 1;
  if (hi < 0) return -1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (xs[mid] < x) lo = mid + 1; else hi = mid; }
  if (lo > 0 && Math.abs(xs[lo - 1] - x) <= Math.abs(xs[lo] - x)) lo -= 1;
  return lo;
}
let icHoverX = null;
const icCrosshair = {
  id: "icCrosshair",
  afterDatasetsDraw(chart) {
    if (icHoverX == null || !chart.chartArea) return;
    const x = chart.scales.x.getPixelForValue(icHoverX);
    if (x < chart.chartArea.left || x > chart.chartArea.right) return;
    const { ctx, chartArea: a } = chart;
    ctx.save(); ctx.strokeStyle = css("--muted"); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, a.top); ctx.lineTo(x, a.bottom); ctx.stroke(); ctx.restore();
  },
};

function renderIndexCot(b) {
  if (!setMeta("indexcot", b)) return;
  const root = $("#indexcot");
  const idxBox = $('[data-ic="idx"]', root);
  idxBox.replaceChildren(...b.indices.map((ix) => {
    const btn = el("button", "", ix.label);
    btn.type = "button";
    btn.dataset.v = ix.key;
    btn.addEventListener("click", () => { IC.idx = ix.key; IC.group = null; saveIC(); drawIndexCot(); });
    return btn;
  }));
  $(".ic-howto", root).textContent = b.howto;
  const any = b.indices.find((ix) => ix.cot);
  $(".ic-groups-help", root).replaceChildren(...Object.values(any?.cot.groups || {}).map((g) => {
    const li = el("li");
    li.append(el("strong", "", `${g.name}: `), document.createTextNode(g.about));
    return li;
  }));
  drawIndexCot();
}

function drawIndexCot() {
  const b = DATA?.indexcot;
  if (!b || b.error) return;
  const root = $("#indexcot");
  const ix = b.indices.find((i) => i.key === IC.idx) || b.indices[0];
  IC.idx = ix.key;
  const groups = ix.cot?.groups || {};
  const gkey = groups[IC.group] ? IC.group : ix.default_group;
  const win = IC.window;
  $$('[data-ic="idx"] button', root).forEach((x) => x.classList.toggle("active", x.dataset.v === ix.key));
  $$('[data-ic="range"] button', root).forEach((x) => x.classList.toggle("active", +x.dataset.v === IC.range));
  $$('[data-ic="window"] button', root).forEach((x) => x.classList.toggle("active", x.dataset.v === win));
  $("#ic-ma").checked = IC.ma;
  $("#ic-log").checked = IC.log;
  const tv = $(".ic-tv", root);
  tv.href = TV_CHART + encodeURIComponent(ix.tv);
  $(".ic-title", root).textContent = `${ix.label} and who is positioned how`;

  // Headline and one card per trader group.
  const head = $(".ic-headline", root);
  if (!ix.cot) {
    head.textContent = `${ix.label}: no COT data yet.`;
    $(".ic-groups", root).replaceChildren();
  } else {
    const main = groups[gkey];
    const p = main.stats[win];
    head.replaceChildren();
    head.append(el("strong", "", `${ix.label}: `), document.createTextNode(`${main.name.toLowerCase()} are `),
                el("span", `lbl ${labelClass(p)}`, labelText(p).toLowerCase()),
                document.createTextNode(isNum(p) ? ` (${ordinal(p)} percentile ${IC_WINDOW_TEXT[win]}). ` : ". "));
    const others = Object.entries(groups).filter(([k]) => k !== gkey)
      .map(([, g]) => `${g.name}: ${labelText(g.stats[win]).toLowerCase()}${isNum(g.stats[win]) ? ` (${ordinal(g.stats[win])})` : ""}`);
    head.append(el("span", "muted", `${others.join(" · ")}. Positions as of Tuesday ${main.stats.date}.`));
    $(".ic-groups", root).replaceChildren(...Object.entries(groups).map(([k, g]) => {
      const st = g.stats;
      const card = el("button", `gcard ${k === gkey ? "active" : ""}`);
      card.type = "button";
      card.style.setProperty("--c", css(IC_COLORS[k]));
      const top = el("div", "g-top");
      top.append(el("span", "g-name", g.name), el("span", `lbl ${labelClass(st[win])}`, labelText(st[win])));
      const stats = el("div", "g-stats");
      const cell = (label, value) => { const d = el("div"); d.append(el("b", "", value), el("span", "", label)); return d; };
      stats.append(cell("net contracts", FORMATS.num0(st.net)), cell("change 1 week", signed(st.change, 0)),
                   cell("change 4 weeks", signed(st.change_4w, 0)), cell("% of open interest", `${st.net_oi_pct.toFixed(1)}%`),
                   cell("percentile, all", isNum(st.pct_all) ? ordinal(st.pct_all) : "–"),
                   cell("5Y / 1Y", `${isNum(st.pct_5y) ? ordinal(st.pct_5y) : "–"} / ${isNum(st.pct_1y) ? ordinal(st.pct_1y) : "–"}`));
      card.append(top, stats, el("div", "g-about", g.about));
      card.title = "Show this group's percentile in the chart";
      card.addEventListener("click", () => { IC.group = k; saveIC(); drawIndexCot(); });
      return card;
    }));
  }
  drawIndexCotCharts(ix, gkey, win);
}

function drawIndexCotCharts(ix, gkey, win) {
  if (!window.Chart) return;
  const root = $("#indexcot");
  const px = ix.price;
  const pxX = px.dates.map(toTs);
  const end = pxX[pxX.length - 1];
  const start = IC.range >= 99 ? Math.min(pxX[0], ix.cot ? toTs(ix.cot.dates[0]) : Infinity)
    : end - IC.range * 365.25 * 864e5;
  const pts = (xs, ys) => xs.map((x, i) => ({ x, y: ys[i] })).filter((p) => p.x >= start && p.y != null);
  // Weekly COT series: break the line where reports are missing for more than 8 weeks.
  const gaps = [];
  const cotPts = (xs, ys) => {
    const out = [];
    for (const p of pts(xs, ys)) {
      const prev = out[out.length - 1];
      if (prev && p.x - prev.x > 56 * 864e5) {
        out.push({ x: prev.x + 864e5, y: null });
        gaps.push([prev.x, p.x]);
      }
      out.push(p);
    }
    return out;
  };
  const ink = css("--price");
  const datasetsPrice = [{ label: ix.label, data: pts(pxX, px.close), borderColor: ink, borderWidth: 1.5 }];
  if (IC.ma) {
    datasetsPrice.push({ label: "50-day avg", data: pts(pxX, px.ma50), borderColor: css("--muted"), borderWidth: 1.2, borderDash: [4, 3] },
                       { label: "200-day avg", data: pts(pxX, px.ma200), borderColor: css("--series-4"), borderWidth: 1.4 });
  }
  const cot = ix.cot;
  const cotX = cot ? cot.dates.map(toTs) : [];
  const groups = cot?.groups || {};
  const datasetsNet = Object.entries(groups).map(([k, g]) => ({
    label: g.name, data: cotPts(cotX, g.net), borderColor: css(IC_COLORS[k]), spanGaps: false,
    borderWidth: k === gkey ? 2.2 : 1.2, borderDash: k === gkey ? [] : [4, 3],
  }));
  const sel = groups[gkey];
  const datasetsPct = sel ? [{ label: `${sel.name} percentile`, data: cotPts(cotX, sel[win]), spanGaps: false,
                               borderColor: css(IC_COLORS[gkey]), borderWidth: 1.8 }] : [];
  $(".ic-pct-label", root).textContent = sel
    ? `${sel.name}: positioning percentile ${IC_WINDOW_TEXT[win]} (0 = most short, 100 = most long; shaded = extreme)`
    : "";

  const legend = $(".ic-legend", root);
  legend.replaceChildren(...[...datasetsPrice, ...datasetsNet].map((d) => {
    const item = el("span", "", d.label);
    item.style.setProperty("--c", d.borderColor);
    return item;
  }));
  const gap = gaps.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]))[0];
  if (gap) {
    const y = (t) => new Date(t).getUTCFullYear();
    legend.append(el("em", "muted", `No COT data ${y(gap[0])}–${y(gap[1])} (the contract traded on another exchange).`));
  }

  const span = (end - start) / 864e5;
  // Ticks on round dates: years for long ranges, quarters or months for short ones.
  const dateTicks = () => {
    const out = [];
    const d0 = new Date(start);
    if (span > 730) {
      const step = span > 3650 ? 2 : 1;
      for (let y = d0.getUTCFullYear() + 1; ; y += step) {
        const t = Date.UTC(y, 0, 1);
        if (t > end) break;
        out.push({ value: t });
      }
    } else {
      const step = span > 400 ? 3 : 1;
      let y = d0.getUTCFullYear(), m = d0.getUTCMonth() + 1;
      for (;;) {
        if (m > 11) { y += Math.floor(m / 12); m %= 12; }
        const t = Date.UTC(y, m, 1);
        if (t > end) break;
        if (m % step === 0) out.push({ value: t });
        m += 1;
      }
    }
    return out;
  };
  const fmtDate = (v) => { const d = new Date(v); return span > 730 ? `${d.getUTCFullYear()}` : `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`; };
  const readout = $(".ic-readout", root);
  const describe = (x) => {
    const pi = nearestIndex(pxX, x);
    const ci = nearestIndex(cotX, x);
    const parts = [`${new Date(pxX[pi]).toISOString().slice(0, 10)}: ${ix.label} ${fmtNum(px.close[pi])}`];
    if (ci >= 0) {
      for (const [k, g] of Object.entries(groups)) parts.push(`${g.name} ${signed(g.net[ci], 0)}`);
      if (sel && isNum(sel[win][ci])) parts.push(`${sel.name} percentile ${Math.round(sel[win][ci])}`);
      parts.push(`(COT week of ${cot.dates[ci]})`);
    }
    return parts.join(" · ");
  };
  readout.textContent = describe(end);

  const make = (id, datasets, extra) => {
    charts.get(id)?.destroy();
    const last = id === "ic-pct";
    const chart = new Chart(document.getElementById(id), {
      type: "line",
      data: { datasets: datasets.map((d) => ({ pointRadius: 0, tension: 0, spanGaps: true, ...d })) },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false, parsing: true,
        interaction: { mode: "nearest", axis: "x", intersect: false },
        plugins: { legend: { display: false }, tooltip: { enabled: false }, ...extra.plugins },
        scales: {
          x: { type: "linear", min: start, max: end, display: last, grid: { display: false },
               afterBuildTicks: (axis) => { axis.ticks = dateTicks(); },
               border: { color: css("--axis") },
               ticks: { color: css("--muted"), maxTicksLimit: 8, maxRotation: 0, callback: fmtDate } },
          y: { position: "right", grid: { color: css("--grid") }, border: { display: false },
               ticks: { color: css("--muted"), maxTicksLimit: 5, callback: extra.yfmt || ((v) => fmtNum(v)) },
               afterFit: (scale) => { scale.width = 78; },   // same width in every panel keeps dates aligned
               ...extra.y },
        },
        onHover: (evt, active, c) => {
          const x = c.scales.x.getValueForPixel(evt.x);
          icHoverX = x >= start && x <= end ? x : null;
          readout.textContent = describe(icHoverX ?? end);
          for (const cid of ["ic-price", "ic-net", "ic-pct"]) charts.get(cid)?.draw();
        },
      },
      plugins: [icCrosshair],
    });
    chart.canvas.onmouseleave = () => {
      icHoverX = null;
      readout.textContent = describe(end);
      for (const cid of ["ic-price", "ic-net", "ic-pct"]) charts.get(cid)?.draw();
    };
    charts.set(id, chart);
  };
  make("ic-price", datasetsPrice, { y: IC.log ? { type: "logarithmic" } : {} });
  make("ic-net", datasetsNet, { plugins: { guides: { hlines: [[0]] } }, yfmt: (v) => FORMATS.num0(v) });
  make("ic-pct", datasetsPct, { y: { min: 0, max: 100 }, yfmt: (v) => `${v}`,
                                plugins: { guides: { bands: [[0, 10, "low"], [90, 100, "high"]], hlines: [[50]] } } });
}

$$('#indexcot [data-ic="range"] button').forEach((btn) => btn.addEventListener("click", () => {
  IC.range = +btn.dataset.v; saveIC(); drawIndexCot();
}));
$$('#indexcot [data-ic="window"] button').forEach((btn) => btn.addEventListener("click", () => {
  IC.window = btn.dataset.v; saveIC(); drawIndexCot();
}));
$("#ic-ma").addEventListener("change", (e) => { IC.ma = e.target.checked; saveIC(); drawIndexCot(); });
$("#ic-log").addEventListener("change", (e) => { IC.log = e.target.checked; saveIC(); drawIndexCot(); });

// ---------- foldable sections ----------
const FOLDABLE = ["stocks", "appetite", "volatility", "positioning", "rates", "dollar", "commodities", "crypto", "asia"];
const folded = (() => {
  try { const v = JSON.parse(localStorage.getItem("folded")); if (Array.isArray(v)) return new Set(v); } catch (e) { /* default */ }
  return new Set(FOLDABLE);
})();
function setFolded(id, fold) {
  const sec = document.getElementById(id);
  sec.classList.toggle("collapsed", fold);
  const btn = $(".section-toggle", sec);
  btn.textContent = fold ? "Show" : "Hide";
  btn.setAttribute("aria-expanded", String(!fold));
  if (fold) folded.add(id); else folded.delete(id);
  try { localStorage.setItem("folded", JSON.stringify([...folded])); } catch (e) { /* ignore */ }
  if (!fold) for (const c of charts.values()) if (sec.contains(c.canvas)) c.resize();
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

// ---------- earnings & European peers ----------
const ER = Object.assign({ range: 7, peersOnly: true, cap: 1.5, q: "" },
  (() => { try { return JSON.parse(localStorage.getItem("earnings") || "{}"); } catch (e) { return {}; } })());
function saveER() { try { localStorage.setItem("earnings", JSON.stringify({ ...ER, q: "" })); } catch (e) { /* ignore */ } }
function isoDay(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function renderEarnings(b) {
  if (!setMeta("earnings", b)) return;
  const root = $("#earnings");
  if (!$(".er-hint", root)) {
    $(".card", root).prepend(el("p", "hint er-hint",
      "Each European peer shows its 1-week return and Corr: the correlation of weekly returns with the US company " +
      "over the last year (−1 to +1; above ~0.5 = they usually move together). Peers come from " +
      "dashboard/universe/eu_peers.yaml; add your own pairs there."));
  }
  drawEarnings();
}

function drawEarnings() {
  const b = DATA?.earnings;
  if (!b || b.error) return;
  const root = $("#earnings");
  $$('[data-er="range"] button', root).forEach((x) => x.classList.toggle("active", +x.dataset.v === ER.range));
  $("#er-peers").checked = ER.peersOnly;
  $("#er-cap").value = String(ER.cap);
  const from = ER.range === 1 ? isoDay(1) : isoDay(0);
  const to = ER.range <= 1 ? from : isoDay(ER.range);
  const q = ER.q.trim().toLowerCase();
  const rows = b.rows.filter((r) => r.date >= from && r.date <= to
    && (!ER.peersOnly || r.peers.length)
    && r.market_cap >= ER.cap * 1e9
    && (!q || r.symbol.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)
        || r.peers.some((p) => p.name.toLowerCase().includes(q) || p.ticker.toLowerCase().includes(q))));
  $(".er-count", root).textContent = `${rows.length} of ${b.rows.length} reports`;

  const table = $(".earnings-table", root);
  const head = el("thead");
  const htr = el("tr");
  [["When"], ["Company"], ["Market cap", true], ["EPS est.", true], ["1W", true], ["EU peers"], ["EU reacts"]]
    .forEach(([t, num]) => htr.append(el("th", num ? "num" : "", t)));
  head.append(htr);
  const body = el("tbody");
  let day = null;
  for (const r of rows) {
    if (r.day !== day) {
      day = r.day;
      const g = el("tr", "group");
      const td = el("td", "", day);
      td.colSpan = 7;
      g.append(td);
      body.append(g);
    }
    const tr = el("tr");
    const when = el("td");
    when.append(el("span", "timing", r.timing), el("div", "muted", r.timing_text));
    const co = el("td", "co");
    co.append(el("b", "", r.symbol), tvLink(r.tv), el("span", "nm", r.name));
    const eps = el("td", "num eps", isNum(r.eps_estimate) ? r.eps_estimate.toFixed(2) : "–");
    if (isNum(r.eps_reported)) {
      const sur = isNum(r.surprise_pct) ? ` (${signed(r.surprise_pct, 1, "%")})` : "";
      eps.append(el("small", isNum(r.surprise_pct) ? (r.surprise_pct >= 0 ? "pos" : "neg") : "", `reported ${r.eps_reported.toFixed(2)}${sur}`));
    }
    const peers = el("td");
    if (!r.peers.length) peers.append(el("span", "muted", "–"));
    for (const p of r.peers) {
      const line = el("div", "peer");
      const pn = el("span", "pn", p.name);
      pn.append(el("small", "", p.ticker), tvLink(p.tv));
      const corr = el("span", `corr ${isNum(p.corr) && p.corr >= 0.5 ? "hi" : ""}`,
                      isNum(p.corr) ? `corr ${p.corr.toFixed(2)}` : "corr –");
      corr.title = "Correlation of weekly returns over the last year";
      line.append(pn, el("span", `${isNum(p.w1) ? (p.w1 >= 0 ? "pos" : "neg") : "muted"}`, `1W ${signed(p.w1, 1, "%")}`), corr);
      peers.append(line);
    }
    tr.append(when, co, el("td", "num", `$${fmtNum(r.market_cap / 1e9)} bn`), eps, changeCell(r.w1), peers,
              el("td", "", r.reaction.text));
    body.append(tr);
  }
  if (!rows.length) {
    const tr = el("tr");
    const td = el("td", "muted", "No reports match these filters.");
    td.colSpan = 7;
    tr.append(td);
    body.append(tr);
  }
  table.replaceChildren(head, body);
  explainColumns(table);
}

$$('#earnings [data-er="range"] button').forEach((btn) => btn.addEventListener("click", () => {
  ER.range = +btn.dataset.v; saveER(); drawEarnings();
}));
$("#er-peers").addEventListener("change", (e) => { ER.peersOnly = e.target.checked; saveER(); drawEarnings(); });
$("#er-cap").addEventListener("change", (e) => { ER.cap = +e.target.value; saveER(); drawEarnings(); });
$("#er-search").addEventListener("input", (e) => { ER.q = e.target.value; drawEarnings(); });

const RENDERERS = {
  summary: renderSummary, indexcot: renderIndexCot, earnings: renderEarnings, today: renderToday, stocks: renderStocks,
  appetite: renderChartsOnly("appetite"), volatility: renderChartsOnly("volatility"),
  positioning: renderPositioning, rates: renderRates,
  dollar: renderAssets("dollar", "SPY"), commodities: renderAssets("commodities", "SPY"),
  crypto: renderAssets("crypto", "SPY"), asia: renderAssets("asia", "SPY"),
};

function renderAll() {
  if (!DATA) return;
  for (const [name, render] of Object.entries(RENDERERS)) {
    try { render(DATA[name]); } catch (err) { console.error(`render ${name} failed`, err); }
  }
  $(".generated").textContent = DATA.generated_at ? `data ${DATA.generated_at}` : "";
}

async function load() {
  try {
    DATA = await (await fetch("/api/dashboard")).json();
  } catch (err) {
    console.error("dashboard fetch failed", err);
    return;
  }
  renderAll();
}

async function start() {
  markThemeButtons();
  try { WIDGETS = await (await fetch("/api/widgets")).json(); initWidgets(); } catch (err) { console.error(err); }
  await load();
  setInterval(load, 10 * 60 * 1000);
}
start();
