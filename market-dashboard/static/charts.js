"use strict";
// Thin layer over TradingView Lightweight Charts: theme colours, series from the dashboard's
// {dates, values} lists, shaded bands, text labels, tooltips and double-click to reset.

const LC = window.LightweightCharts;
const LINE = { solid: 0, dotted: 1, dashed: 2, largeDashed: 3, sparse: 4 };
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function rgbaVar(name, alpha) {
  const v = cssVar(name);
  return v.includes(",") && !v.startsWith("rgba") ? `rgba(${v}, ${alpha})` : v;
}

function isoOf(t) {
  if (typeof t === "string") return t;
  if (typeof t === "number") return new Date(t * 1000).toISOString().slice(0, 10);
  if (t && typeof t === "object") return `${t.year}-${String(t.month).padStart(2, "0")}-${String(t.day).padStart(2, "0")}`;
  return "";
}
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function niceDate(iso, withYear = true) {
  const [y, m, d] = iso.split("-");
  return withYear ? `${+d} ${MON[+m - 1]} ${y}` : `${+d} ${MON[+m - 1]}`;
}

/** [{time, value}] from parallel lists, skipping gaps. */
function pts(dates, values, from = null) {
  const out = [];
  for (let i = 0; i < dates.length; i++) {
    const v = values[i];
    if (v == null || !Number.isFinite(v) || (from && dates[i] < from)) continue;
    out.push({ time: dates[i], value: v });
  }
  return out;
}
function ohlcPts(o, from = null) {
  const out = [];
  for (let i = 0; i < o.dates.length; i++) {
    if (o.close[i] == null || (from && o.dates[i] < from)) continue;
    const c = o.close[i];
    out.push({ time: o.dates[i], open: o.open[i] ?? c, high: o.high[i] ?? c, low: o.low[i] ?? c, close: c });
  }
  return out;
}

function fmtAxis(x) {
  if (!Number.isFinite(x)) return "";
  const a = Math.abs(x);
  if (a >= 1e9) return `${(x / 1e9).toFixed(a >= 1e10 ? 0 : 1)}B`;
  if (a >= 1e6) return `${(x / 1e6).toFixed(a >= 1e7 ? 0 : 1)}M`;
  if (a >= 1e4) return x.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (a >= 100) return x.toLocaleString("en-US", { maximumFractionDigits: 1 });
  if (a >= 1) return x.toFixed(2);
  return x.toPrecision(3);
}
const FMT = {
  num: fmtAxis,
  pct0: (x) => `${x.toFixed(0)}%`,
  pct1: (x) => `${x.toFixed(1)}%`,
  pct2: (x) => `${x.toFixed(2)}%`,
  num0: (x) => x.toLocaleString("en-US", { maximumFractionDigits: 0 }),
  num2: (x) => x.toFixed(2),
  sig: (x) => Number(x.toPrecision(4)).toString(),
  int: (x) => x.toFixed(0),
};
const priceFormat = (fmt) => ({ type: "custom", formatter: FMT[fmt] || FMT.num, minMove: 0.0001 });

/** A fresh chart in `box` (any earlier chart there is removed). */
function makeChart(box, opts = {}) {
  if (box._chart) { box._chart.remove(); box._chart = null; }
  box.replaceChildren();
  const chart = LC.createChart(box, {
    autoSize: true,
    layout: {
      background: { type: "solid", color: "transparent" }, textColor: cssVar("--muted"),
      fontFamily: cssVar("--font-ui") || "system-ui", fontSize: 11, attributionLogo: false,
      panes: { separatorColor: cssVar("--border"), separatorHoverColor: cssVar("--surface-3"), enableResize: false },
    },
    grid: { vertLines: { visible: false }, horzLines: { color: cssVar("--grid") } },
    rightPriceScale: { borderVisible: false, visible: opts.right !== false, scaleMargins: { top: 0.08, bottom: 0.06 } },
    leftPriceScale: { borderVisible: false, visible: !!opts.left, scaleMargins: { top: 0.08, bottom: 0.06 } },
    timeScale: { borderVisible: false, rightOffset: opts.rightOffset ?? 2, fixLeftEdge: true, fixRightEdge: false,
                 lockVisibleTimeRangeOnResize: true, minBarSpacing: 0.05 },
    crosshair: { mode: 0, vertLine: { color: cssVar("--axis"), labelBackgroundColor: cssVar("--ink-2") },
                 horzLine: { color: cssVar("--axis"), labelBackgroundColor: cssVar("--ink-2") } },
    localization: { dateFormat: "dd MMM yyyy" },
    handleScroll: opts.interactive === false ? false : { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
    handleScale: opts.interactive === false ? false : { mouseWheel: true, pinch: true, axisPressedMouseMove: { time: true, price: false } },
  });
  box._chart = chart;
  box._reset = opts.reset || (() => chart.timeScale().fitContent());
  if (!box._dbl) {
    box._dbl = true;
    box.addEventListener("dblclick", () => box._reset && box._reset());
  }
  return chart;
}

function addLine(chart, data, o = {}) {
  const s = chart.addSeries(LC.LineSeries, {
    color: o.color || cssVar("--blue"), lineWidth: o.width ?? 2, lineStyle: o.style ?? LINE.solid,
    priceScaleId: o.scale || "right", title: o.title || "", lastValueVisible: o.lastValue ?? true,
    priceLineVisible: false, crosshairMarkerVisible: o.marker ?? true, crosshairMarkerRadius: 3,
    priceFormat: priceFormat(o.fmt || "num"), lineType: o.step ? 1 : 0, pointMarkersVisible: !!o.points,
  }, o.pane || 0);
  s.setData(data);
  return s;
}
function addCandles(chart, data, o = {}) {
  const up = o.upColor || cssVar("--candle-up"), upLine = o.upLine || cssVar("--candle-up-line");
  const down = o.downColor || cssVar("--candle-down");
  const s = chart.addSeries(LC.CandlestickSeries, {
    upColor: up, borderUpColor: upLine, wickUpColor: upLine, downColor: down, borderDownColor: down, wickDownColor: down,
    priceScaleId: o.scale || "right", title: o.title || "", lastValueVisible: o.lastValue ?? true, priceLineVisible: false,
    priceFormat: priceFormat(o.fmt || "num"),
  }, o.pane || 0);
  s.setData(data);
  return s;
}
function addBars(chart, data, o = {}) {
  const s = chart.addSeries(LC.HistogramSeries, {
    color: o.color || cssVar("--sky"), priceScaleId: o.scale || "right", title: o.title || "",
    lastValueVisible: o.lastValue ?? true, priceLineVisible: false, base: o.base ?? 0,
    priceFormat: priceFormat(o.fmt || "num"),
  }, o.pane || 0);
  s.setData(data);
  return s;
}
function addArea(chart, data, o = {}) {
  const s = chart.addSeries(LC.AreaSeries, {
    lineColor: o.color || cssVar("--blue"), topColor: o.top || rgbaVar("--sky", 1), bottomColor: o.bottom || "rgba(0,0,0,0)",
    lineWidth: o.width ?? 1, priceScaleId: o.scale || "right", title: o.title || "", lastValueVisible: o.lastValue ?? true,
    priceLineVisible: false, priceFormat: priceFormat(o.fmt || "num"), crosshairMarkerVisible: false,
  }, o.pane || 0);
  s.setData(data);
  return s;
}
function hline(series, price, o = {}) {
  return series.createPriceLine({ price, color: o.color || cssVar("--muted"), lineWidth: 1, lineStyle: o.style ?? LINE.dashed,
                                  axisLabelVisible: o.label ?? false, title: o.title || "" });
}
/** Relative pane heights, e.g. [3, 1]. */
function paneHeights(chart, weights) {
  const panes = chart.panes();
  weights.forEach((w, i) => panes[i] && panes[i].setStretchFactor(w));
}

// ---- primitives -------------------------------------------------------------------------

/** Shaded horizontal bands behind a series: [{from, to, color}] in the series' price units. */
class Bands {
  constructor(bands) { this.bands = bands; const self = this;
    this._view = { zOrder: () => "bottom", renderer: () => ({ draw() {}, drawBackground(target) { self._draw(target); } }) }; }
  attached({ series, requestUpdate }) { this.series = series; this.request = requestUpdate; }
  detached() { this.series = null; }
  paneViews() { return [this._view]; }
  updateAllViews() {}
  _draw(target) {
    if (!this.series) return;
    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      for (const b of this.bands) {
        const y1 = this.series.priceToCoordinate(b.to), y2 = this.series.priceToCoordinate(b.from);
        if (y1 == null || y2 == null) continue;
        const top = Math.min(y1, y2) * scope.verticalPixelRatio, h = Math.abs(y2 - y1) * scope.verticalPixelRatio;
        ctx.fillStyle = b.color;
        ctx.fillRect(0, top, scope.bitmapSize.width, h);
        if (b.label) {
          ctx.fillStyle = cssVar("--ink-2");
          ctx.font = `${11 * scope.verticalPixelRatio}px ${cssVar("--font-ui") || "sans-serif"}`;
          ctx.fillText(b.label, 6 * scope.horizontalPixelRatio, top + 13 * scope.verticalPixelRatio);
        }
      }
    });
  }
}

/** Small text labels at (time, value) points of a series: [{time, value, text, color}]. */
class Labels {
  constructor(labels, o = {}) { this.labels = labels; this.o = o; const self = this;
    this._view = { zOrder: () => "top", renderer: () => ({ draw(target) { self._draw(target); } }) }; }
  attached({ series, chart }) { this.series = series; this.chart = chart; }
  detached() { this.series = null; }
  paneViews() { return [this._view]; }
  updateAllViews() {}
  _draw(target) {
    if (!this.series) return;
    target.useMediaCoordinateSpace(({ context: ctx, mediaSize }) => {
      ctx.font = `${this.o.bold ? "600 " : ""}${this.o.size || 11}px ${cssVar("--font-ui") || "sans-serif"}`;
      ctx.textBaseline = "bottom";
      const ts = this.chart.timeScale();
      let lastX = -1e9;
      for (const l of this.labels) {
        const x = ts.timeToCoordinate(l.time), y = this.series.priceToCoordinate(l.value);
        if (x == null || y == null || x < 0 || x > mediaSize.width) continue;
        const w = ctx.measureText(l.text).width;
        if (this.o.noOverlap && x - w / 2 < lastX + 2) continue;
        lastX = x + w / 2;
        ctx.fillStyle = l.color || cssVar("--neg");
        ctx.textAlign = l.align || "center";
        ctx.fillText(l.text, Math.min(Math.max(x + (l.dx || 0), w / 2), mediaSize.width - (l.align === "left" ? w : w / 2) - 2), y + (l.dy ?? -3));
      }
    });
  }
}

// ---- tooltip ------------------------------------------------------------------------------

/** Floating box that follows the crosshair. `render(param, iso)` returns HTML or null. */
function tooltip(chart, box, render) {
  let tip = box.querySelector(":scope > .tooltip");
  if (!tip) { tip = document.createElement("div"); tip.className = "tooltip"; box.append(tip); }
  chart.subscribeCrosshairMove((param) => {
    if (!param.time || !param.point || param.point.x < 0 || param.point.y < 0) { tip.style.display = "none"; return; }
    const html = render(param, isoOf(param.time));
    if (!html) { tip.style.display = "none"; return; }
    tip.innerHTML = html;
    tip.style.display = "block";
    const w = tip.offsetWidth, h = tip.offsetHeight, W = box.clientWidth;
    let x = param.point.x + 14;
    if (x + w > W - 4) x = param.point.x - w - 14;
    tip.style.left = `${Math.max(4, x)}px`;
    tip.style.top = `${Math.max(4, Math.min(param.point.y - h / 2, box.clientHeight - h - 4))}px`;
  });
  return tip;
}
const sw = (color) => `<span class="sw" style="background:${color}"></span>`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** Shows `years` of history ending at the last point (0 = everything). */
function showYears(chart, lastIso, years, firstIso) {
  if (!years) { chart.timeScale().fitContent(); return; }
  const d = new Date(lastIso + "T00:00:00Z");
  d.setUTCFullYear(d.getUTCFullYear() - years);
  const from = d.toISOString().slice(0, 10);
  chart.timeScale().setVisibleRange({ from: firstIso && from < firstIso ? firstIso : from, to: lastIso });
}
function showLast(chart, n) {
  const ts = chart.timeScale();
  const len = ts.getVisibleLogicalRange();
  chart.timeScale().fitContent();
  const full = ts.getVisibleLogicalRange();
  if (full && full.to - full.from > n) ts.setVisibleLogicalRange({ from: full.to - n, to: full.to });
  return len;
}
