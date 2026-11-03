"""Static copy of the page for sharing: `python -m dashboard snapshot OUTDIR`.

Writes market-overview.html with the CSS and JavaScript inlined, plus the data as JSON files next
to it (dashboard.json, widgets.json, detail-cot.json, detail-price.json). The page reads those
files instead of the API. TradingView widgets become links to tradingview.com, because a shared
page cannot run them.
"""

from __future__ import annotations

import json
from pathlib import Path

from . import blocks, cards
from .config import ROOT
from .db import Store

STATIC = ROOT / "static"

SNAPSHOT_CSS = """
/* snapshot only */
.snapshot-note { background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; font-size: 12.5px; color: var(--ink-2); }
.widget-link { display: inline-block; justify-self: center; padding: 8px 14px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); color: var(--ink); font-size: 13px; font-weight: 600; text-decoration: none; }
.widget-link:hover { border-color: var(--ink-2); }
.widget.calendar, .widget.heatmap { height: auto; }
.ticker { min-height: 0; border-top: 0; }
.topbar-inner { padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
"""

# (text in static/app.js, replacement in the snapshot)
JS_SWAPS = (
    ('''const API = {
  dashboard: async () => (await fetch("/api/dashboard")).json(),
  widgets: async () => (await fetch("/api/widgets")).json(),
  detail: async (kind, key) => (await fetch(`/api/detail/${kind}/${encodeURIComponent(key)}`)).json(),
};''', '''const SNAP = {};
const API = {
  dashboard: async () => (await fetch("dashboard.json")).json(),
  widgets: async () => (await fetch("widgets.json")).json(),
  detail: async (kind, key) => {
    SNAP[kind] = SNAP[kind] || fetch(`detail-${kind}.json`).then((r) => r.json());
    return (await SNAP[kind])[key];
  },
};'''),
    ('''function embed(target, script, config) {
  const box = document.getElementById(target);
  if (!box) return;''', '''function embed(target, script, config) {
  const box = document.getElementById(target);
  if (!box) return;
  if (script.includes("ticker-tape")) { box.replaceChildren(); return; }
  const href = { "embed-widget-events.js": "https://www.tradingview.com/economic-calendar/",
                 "embed-widget-stock-heatmap.js": `https://www.tradingview.com/heatmap/stock/?color=change&dataset=${config.dataSource}&group=sector&size=market_cap_basic` }[script];
  const what = script.includes("events") ? "economic calendar" : `heatmap (${config.dataSource})`;
  const note = el("div", "widget-note");
  const a = el("a", "widget-link", `Open the ${what} on TradingView ↗`);
  a.href = href; a.target = "_blank"; a.rel = "noopener";
  note.append(a, el("div", "", "Live TradingView widgets only run in the app itself."));
  box.replaceChildren(note);
  return;'''),
    ("  setInterval(load, 10 * 60 * 1000);\n", ""),
)


def _dump(path: Path, data) -> None:
    path.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")


def build(store: Store, cfg: dict, outdir: str | Path) -> dict:
    """Write the snapshot into `outdir`; returns {file name: size in bytes}."""
    out = Path(outdir)
    out.mkdir(parents=True, exist_ok=True)
    data = blocks.dashboard(store, cfg)
    failed = [k for k, v in data.items() if isinstance(v, dict) and "error" in v]
    if failed:
        raise RuntimeError(f"sections failed to build: {', '.join(failed)}")
    _dump(out / "dashboard.json", data)
    _dump(out / "widgets.json", cfg["tradingview"])
    for kind, keys in cards.detail_keys(cfg).items():
        _dump(out / f"detail-{kind}.json", {k: cards.DETAILS[kind](store, cfg, k) for k in keys})

    html = (STATIC / "index.html").read_text(encoding="utf-8")
    body = html.split("<body>", 1)[1].split("</body>", 1)[0]
    for script in ('<script src="/static/charts.js"></script>', '<script src="/static/app.js"></script>'):
        body = body.replace(script, "")
    banner = (f'<div class="snapshot-note">Snapshot of the live dashboard, data as of {data["generated_at"]} '
              '(Europe/Amsterdam): not live, the figures stay as they were when the snapshot was taken. Charts, '
              'selectors and explanations work; TradingView widgets (ticker tape, calendar, heatmap) run in the '
              'app itself, here they open on tradingview.com.</div>')
    body = body.replace('<main class="page">', '<main class="page">\n' + banner, 1)
    js = (STATIC / "app.js").read_text(encoding="utf-8")
    for old, new in JS_SWAPS:
        if old not in js:
            raise RuntimeError(f"static/app.js changed; snapshot swap not found: {old[:40]!r}")
        js = js.replace(old, new)
    head = html.split("<head>", 1)[1].split("</head>", 1)[0]
    externals = "\n".join(line.strip() for line in head.splitlines()
                          if "fonts.googleapis.com/css2" in line or "lightweight-charts" in line)
    page = ('<meta charset="utf-8">\n<title>Market Overview</title>\n'
            '<meta name="claude:viewport-fit-sides" content="cover">\n'
            '<script>try { const t = localStorage.getItem("theme"); if (t) document.documentElement.dataset.theme = t; } catch (e) {}</script>\n'
            f'{externals}\n<style>\n{(STATIC / "style.css").read_text(encoding="utf-8")}{SNAPSHOT_CSS}</style>\n'
            f'{body}\n<script>\n{(STATIC / "charts.js").read_text(encoding="utf-8")}\n</script>\n'
            f'<script>\n{js}</script>\n')
    (out / "market-overview.html").write_text(page, encoding="utf-8")
    return {p.name: p.stat().st_size for p in sorted(out.iterdir()) if p.is_file()}
