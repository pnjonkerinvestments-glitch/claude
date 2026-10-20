"use strict";

const TV = "https://s3.tradingview.com/external-embedding/";
const CSS = getComputedStyle(document.documentElement);
const css = (name) => CSS.getPropertyValue(name).trim();
const SERIES = [css("--series-1"), css("--series-2"), css("--series-3")];
const STATE_TEXT = { green: "+ green", orange: "~ orange", red: "− red", nodata: "no data" };
const charts = {};
let widgetCfg = null;
let heatmapMarket = "europe";

// ---------- helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
const fmt = (x, nd = 2) => x == null ? "–" : x.toLocaleString("en-US", { minimumFractionDigits: nd, maximumFractionDigits: nd });
const sig = (x) => x == null ? "–" : Number(x.toPrecision(4)).toLocaleString("en-US", { maximumSignificantDigits: 4 });
const signed = (x, nd = 0) => x == null ? "–" : (x > 0 ? "+" : x < 0 ? "−" : "±") + fmt(Math.abs(x), nd);

function setMeta(id, block) {
  const root = document.getElementById(id);
  $(".updated", root).textContent = block.updated_at ? `updated at ${block.updated_at}` : "not updated yet";
  const w = $(".warnings", root);
  w.replaceChildren(...(block.warnings || []).map((m) => el("div", "warn-msg", m)));
  if (block.error) w.append(el("div", "warn-msg error", `This block could not be built: ${block.error}`));
  return !block.error;
}

// ---------- TradingView widgets ----------
function embed(target, script, config) {
  const box = document.getElementById(target);
  const container = el("div", "tradingview-widget-container");
  container.style.height = "100%";
  const inner = el("div", "tradingview-widget-container__widget");
  inner.style.height = "100%";
  const s = document.createElement("script");
  s.src = TV + script;
  s.async = true;
  s.textContent = JSON.stringify(config);
  container.append(inner, s);
  box.replaceChildren(container);
}

function renderHeatmap() {
  embed("heatmap", "embed-widget-stock-heatmap.js", {
    dataSource: widgetCfg.heatmap[heatmapMarket], exchanges: [], grouping: "sector",
    blockSize: "market_cap_basic", blockColor: "change", locale: "en", colorTheme: "dark",
    hasTopBar: false, isDataSetEnabled: false, isZoomEnabled: true, hasSymbolTooltip: true,
    isMonoSize: false, width: "100%", height: "100%",
  });
  document.querySelectorAll("[data-heatmap]").forEach((b) =>
    b.classList.toggle("active", b.dataset.heatmap === heatmapMarket));
}

async function initWidgets() {
  widgetCfg = await (await fetch("/api/widgets")).json();
  embed("ticker-tape", "embed-widget-ticker-tape.js", {
    symbols: widgetCfg.ticker_tape, showSymbolLogo: false, isTransparent: true,
    displayMode: "adaptive", colorTheme: "dark", locale: "en",
  });
  embed("calendar", "embed-widget-events.js", {
    colorTheme: "dark", isTransparent: true, width: "100%", height: "100%", locale: "en",
    importanceFilter: widgetCfg.calendar.importance, countryFilter: widgetCfg.calendar.countries,
  });
  renderHeatmap();
  document.querySelectorAll("[data-heatmap]").forEach((b) => b.addEventListener("click", () => {
    heatmapMarket = b.dataset.heatmap;
    renderHeatmap();
  }));
}

// ---------- charts ----------
if (window.Chart) {
  Chart.defaults.color = css("--muted");
  Chart.defaults.font.family = 'system-ui, -apple-system, "Segoe UI", sans-serif';
  Chart.defaults.font.size = 11;
}

function lineChart(canvasId, labels, datasets, opts = {}) {
  if (!window.Chart) return;  // CDN unreachable: tables and indicators still render
  const cfg = {
    type: "line",
    data: {
      labels,
      datasets: datasets.map((d, i) => ({
        label: d.label, data: d.data, borderColor: d.color || SERIES[i], backgroundColor: d.color || SERIES[i],
        borderWidth: d.width || 2, borderDash: d.dash || [], pointRadius: 0, pointHoverRadius: 4,
        spanGaps: true, tension: 0,
      })),
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: datasets.length > 1, position: "top", align: "end",
                  labels: { boxWidth: 10, boxHeight: 2, color: css("--ink-2") } },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${opts.sig ? sig(c.parsed.y) : fmt(c.parsed.y, 2)}` } },
      },
      scales: {
        x: { ticks: { maxTicksLimit: 6, maxRotation: 0 }, grid: { display: false }, border: { color: css("--axis") } },
        y: { ticks: { maxTicksLimit: 5 }, grid: { color: css("--grid") }, border: { display: false } },
      },
    },
  };
  if (opts.spark) {
    cfg.options.plugins.legend.display = false;
    cfg.options.scales.x.display = false;
    cfg.options.scales.y.display = false;
    cfg.options.layout = { padding: 2 };
  }
  if (charts[canvasId]) charts[canvasId].destroy();
  charts[canvasId] = new Chart(document.getElementById(canvasId), cfg);
}

// ---------- block 1: regime ----------
function renderRegime(b) {
  if (!setMeta("regime", b)) return;
  const box = $("#regime .indicators");
  box.replaceChildren(...b.indicators.map((ind) => {
    const card = el("button", `ind ${ind.color}`);
    card.type = "button";
    card.append(el("div", "name", ind.label), el("div", "val", ind.value),
                el("div", "state", STATE_TEXT[ind.color]), el("div", "why", ind.reason));
    card.addEventListener("click", () => card.classList.toggle("open"));
    return card;
  }));
  const v = b.verdict;
  const cls = v.label.toLowerCase().replace(/\s+/g, "-");
  $("#regime .verdict").replaceChildren(el("span", `label ${cls}`, v.label), el("span", "expl", v.explanation));
}

// ---------- block 2: today ----------
function renderToday(b) {
  if (!setMeta("today", b)) return;
  $("#today .expected").replaceChildren(...b.expected_moves.map((m) => {
    const box = el("div", "em");
    box.append(el("div", "sub", `Expected move today · ${m.name}`));
    if (!m.available) {
      box.append(el("div", "big", "n/a"), el("div", "sub", m.note));
      return box;
    }
    box.append(
      el("div", "big", `± ${fmt(m.points, 1)} pts (± ${fmt(m.pct, 2)}%)`),
      el("div", "sub", `Range ${fmt(m.low, 0)} – ${fmt(m.high, 0)} · close ${fmt(m.price, 2)} (${m.price_date}) × ` +
                       `${m.vol_name} ${fmt(m.vol, 2)} (${m.vol_date}) / 100 / √252`));
    return box;
  }));
}

// ---------- block 3: rates ----------
function renderRates(b) {
  if (!setMeta("rates", b)) return;
  const body = $("#rates tbody");
  body.replaceChildren();
  b.rows.forEach((r) => {
    const tr = el("tr");
    tr.append(el("td", "", r.name));
    if (!r.available) {
      tr.append(el("td", "num", "–"), el("td", "num", "–"), el("td", "muted", "no data"));
      body.append(tr);
      return;
    }
    const unit = r.id === "T10Y2Y" ? " pp" : "%";
    const val = el("td", "num", fmt(r.value) + unit);
    val.title = `as of ${r.date}`;
    const cell = el("td", "sparkcell");
    const wrap = el("div", "spark");
    const canvas = el("canvas");
    canvas.id = `spark-${r.id}`;
    wrap.append(canvas);
    cell.append(wrap);
    tr.append(val, el("td", "num", r.change_bp == null ? "–" : `${signed(r.change_bp, 0)} bp`), cell);
    body.append(tr);
    lineChart(canvas.id, r.spark_dates, [{ label: r.name, data: r.spark, width: 1.5 }], { spark: true });
  });
}

// ---------- block 4: positioning ----------
function cotCells(g) {
  if (!g) return [el("td", "num", "–"), el("td", "num", "–"), el("td", "num", "–")];
  return [el("td", "num", signed(g.net, 0)), el("td", "num", signed(g.change, 0)),
          el("td", "num", g.cot_index == null ? "–" : fmt(g.cot_index, 0))];
}

function renderPositioning(b) {
  if (!setMeta("positioning", b)) return;
  $("#positioning .cot-date").textContent = b.report_date
    ? `positions as of Tuesday ${new Date(b.report_date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
    : "";
  $("#positioning .cot-table tbody").replaceChildren(...b.contracts.map((c) => {
    const tr = el("tr");
    tr.append(el("td", "", c.name), ...cotCells(c.lev), ...cotCells(c.am));
    return tr;
  }));
  for (const kind of ["equity", "index"]) {
    const s = b.put_call[kind];
    lineChart(`pc-${kind}`, s.dates, [
      { label: "P/C", data: s.values, width: 1.5 },
      { label: "5-day avg", data: s.ma5 },
      { label: "10-day avg", data: s.ma10 },
    ]);
  }
  const t = b.vix_term;
  lineChart("vix-term", t.dates, [
    { label: "VIX9D", data: t.VIX9D }, { label: "VIX", data: t.VIX }, { label: "VIX3M", data: t.VIX3M },
  ]);
}

// ---------- block 5: risk-on/off ----------
function renderRiskOnOff(b) {
  if (!setMeta("riskonoff", b)) return;
  const box = $("#riskonoff .ratio-charts");
  box.replaceChildren(...b.charts.map((c) => {
    const fig = el("figure");
    if (!c.available) {
      fig.append(el("figcaption", "", `${c.name}, 6 months`), el("div", "muted", "no data"));
      return fig;
    }
    const last = c.values[c.values.length - 1];
    const ma = c.ma[c.ma.length - 1];
    const vsMa = ma == null ? "" : `, ${last >= ma ? "+ above" : "− below"} ${c.ma_days}-day avg`;
    const wrap = el("div", "chart");
    const canvas = el("canvas");
    canvas.id = `ratio-${c.key}`;
    wrap.append(canvas);
    fig.append(el("figcaption", "", `${c.name}, 6 months: ${sig(last)}${vsMa}`), wrap);
    return fig;
  }));
  b.charts.filter((c) => c.available).forEach((c) => lineChart(`ratio-${c.key}`, c.dates, [
    { label: c.name, data: c.values }, { label: `${c.ma_days}-day avg`, data: c.ma },
  ], { sig: true }));
}

// ---------- load loop ----------
async function load() {
  let data;
  try {
    data = await (await fetch("/api/dashboard")).json();
  } catch (err) {
    console.error("dashboard fetch failed", err);
    return;
  }
  const renderers = { regime: renderRegime, today: renderToday, rates: renderRates,
                      positioning: renderPositioning, riskonoff: renderRiskOnOff };
  for (const [name, render] of Object.entries(renderers)) {
    try { render(data[name]); } catch (err) { console.error(`render ${name} failed`, err); }
  }
}

initWidgets().catch((err) => console.error("widgets failed", err));
load();
setInterval(load, 5 * 60 * 1000);
