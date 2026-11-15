/*
  Roviko content week 5 (16-22 Nov 2026), post 4 of every day: What flag is this? A 16-slide photo carousel, 1080x1350 (4:5).
  w5-gtf.html?d=1..7&n=1..16. 1 cover · 2..15 seven flags, each a passport page with the flag, then the Roviko passport stamp:
  the country's shape filled with its flag, the name and one fact · 16 your score, and the passport in the app.
  Rendered by build/w5-gtf.mjs. Facts: data/w5.js.
*/
// @scripts data/w5.js lib/ios.js lib/flagratio.js
const D = +(Q.get('d') || 1), N = +(Q.get('n') || 1), DAY = W5.gtf[D], W = 1080, H = 1350;
S(document.body, { width: W, height: H }); S(stage, { width: W, height: H, overflow: 'hidden' });
const FLAG_ONLY = new Set(['PRT', 'MLT', 'SMR', 'VAT', 'GRD', 'ECU', 'MHL', 'SLB', 'TON', 'KIR', 'VUT', 'PNG']);
const PAPER = '#F4EFE1', DARKC = C.forest, STAMP = C.green, GOLDD = '#E9C46A';
const uiL = el(stage, { width: W, height: H, zIndex: 20 });
const LVL = { EASY: IOS.green, MEDIUM: IOS.orange, HARD: IOS.red, LEGEND: '#5E2BB8' }[DAY.level];
const k = Math.floor((N - 2) / 2), F = DAY.flags[k], isQ = N >= 2 && N <= 15 && N % 2 === 0, isA = N >= 3 && N <= 15 && N % 2 === 1;

// a passport page: paper, fine wavy security lines, the roviko mark, the page number in a stamped box, a machine-readable line
function passportPage() {
  S(stage, { background: PAPER });
  const s = svgEl(el(stage, { width: W, height: H, zIndex: 1 }), 'svg', { width: W, height: H }); s.style.position = 'absolute';
  for (let i = 0; i < 46; i++) {
    const y = 40 + i * 30, a = 7 + (i % 3) * 2;
    let d = `M -20 ${y}`; for (let x = -20; x <= W + 40; x += 40) d += ` Q ${x + 10} ${y - a} ${x + 20} ${y} T ${x + 40} ${y}`;
    svgEl(s, 'path', { d, fill: 'none', stroke: 'rgba(31,128,107,.07)', 'stroke-width': 1.6 });
  }
  el(uiL, { left: 64, top: 60, display: 'flex', alignItems: 'center', gap: '14px' }, `<img src="${ASSETS}roviko-globe.svg" style="width:56px;height:56px"><span style="font-family:Fredoka;font-weight:600;font-size:44px;color:${DARKC}">roviko</span>`);
  if (N <= 15) el(uiL, { left: 'auto', right: 64, top: 52, padding: '8px 26px', border: `5px solid ${STAMP}`, borderRadius: 18, transform: 'rotate(-4deg)', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 52, color: STAMP, lineHeight: 1.05 },
    `${k + 1}<span style="color:${IOS.orange}">/</span>7`);
  const mrz = isA ? `P<${F[0]}<${F[2].toUpperCase().replace(/[^A-Z]/g, '<')}` : 'P<ROVIKO<WHAT<FLAG<IS<THIS';
  el(uiL, { left: 64, top: 1196, width: W - 128, fontFamily: '"DejaVu Sans Mono", monospace', fontSize: 34, letterSpacing: '.18em', color: 'rgba(22,59,50,.32)', lineHeight: 1.45, whiteSpace: 'pre', overflow: 'hidden' },
    `${(mrz + '<'.repeat(60)).slice(0, 38)}\n${'<'.repeat(38)}`.replace(/</g, '&lt;'));
}
// the stamp: two rings, the country name around the top, the date around the bottom, the shape filled with the flag
function stamp(cx, cy, R) {
  const s = svgEl(el(uiL, { width: W, height: H, zIndex: 5 }), 'svg', { width: W, height: H }); s.style.position = 'absolute';
  const g = svgEl(s, 'g', { transform: `rotate(-6 ${cx} ${cy})` });
  svgEl(g, 'circle', { cx, cy, r: R, fill: 'rgba(255,255,255,.35)', stroke: STAMP, 'stroke-width': 9 });
  svgEl(g, 'circle', { cx, cy, r: R - 78, fill: 'none', stroke: STAMP, 'stroke-width': 4 });
  const defs = svgEl(s, 'defs');
  svgEl(defs, 'path', { id: 'arcTop', d: `M ${cx - R + 40} ${cy} A ${R - 40} ${R - 40} 0 0 1 ${cx + R - 40} ${cy}` });
  svgEl(defs, 'path', { id: 'arcBot', d: `M ${cx - R + 66} ${cy} A ${R - 66} ${R - 66} 0 0 0 ${cx + R - 66} ${cy}` });
  const name = F[2].toUpperCase(), fs = name.length > 14 ? 40 : 52;
  const t1 = svgEl(g, 'text', { 'font-family': 'Fredoka', 'font-weight': 600, 'font-size': fs, 'letter-spacing': '6', fill: STAMP, 'text-anchor': 'middle' });
  svgEl(t1, 'textPath', { href: '#arcTop', startOffset: '50%' }).textContent = name;
  const t2 = svgEl(g, 'text', { 'font-family': 'Fredoka', 'font-weight': 600, 'font-size': 40, 'letter-spacing': '8', fill: STAMP, 'text-anchor': 'middle' });
  svgEl(t2, 'textPath', { href: '#arcBot', startOffset: '50%' }).textContent = `★  ${W5.dates[D]}  ★`;
  // countries whose outline doesn't read at this size (far-off islands, tiny or scattered): the flag itself, in the stamp
  if (FLAG_ONLY.has(F[0])) {
    const fh = Math.min(230, 380 / FRATIO[F[1]]);
    el(uiL, { left: cx - fh * FRATIO[F[1]] / 2, top: cy - fh / 2, zIndex: 6, transform: 'rotate(-6deg)' }, flagW(F[1], fh, 'border-radius:12px'));
    return;
  }
  // the shape, filled with the flag
  const box = { cx, cy, w: (R - 100) * 1.55, h: (R - 100) * 1.55 };
  const f = fitShape(F[0], box);
  const clip = svgEl(defs, 'clipPath', { id: 'shp' }); svgEl(clip, 'path', { d: f.d });
  // the whole flag is stretched over the shape's box, so every part of it shows inside the country
  svgEl(g, 'image', { href: `${FLAG_W}${F[1]}.svg`, x: f.x, y: f.y, width: f.w, height: f.h, preserveAspectRatio: 'none', 'clip-path': 'url(#shp)' });
  svgEl(g, 'path', { d: f.d, fill: 'none', stroke: DARKC, 'stroke-width': 3.2, 'stroke-linejoin': 'round' });
  // tiny countries: a small flag next to the shape so it still reads
  if (Math.max(f.w, f.h) < 60) el(uiL, { left: cx - 70, top: cy + 30, zIndex: 6 }, flagW(F[1], 80));
}

if (N === 1) {
  // ---- cover: dark forest card, gold title, the mascot in a ring
  S(stage, { background: 'radial-gradient(900px 700px at 50% 30%, #1F4A3E, #11231D)' });
  const s = svgEl(el(stage, { width: W, height: H, zIndex: 1 }), 'svg', { width: W, height: H }); s.style.position = 'absolute';
  for (let x = 24; x < W; x += 24) for (let y = 24; y < H; y += 24) svgEl(s, 'circle', { cx: x, cy: y, r: 1.4, fill: 'rgba(246,243,233,.06)' });
  el(uiL, { left: 48, top: 48, width: W - 96, height: H - 96, borderRadius: 34, border: `3px solid ${GOLDD}`, boxSizing: 'border-box' });
  el(uiL, { left: W / 2 - 150, top: 170, width: 300, height: 300, borderRadius: 150, border: `5px solid ${GOLDD}`, boxSizing: 'border-box', background: 'rgba(246,243,233,.05)' });
  const mb = el(uiL, { left: W / 2 - 150, top: 170, width: 300, height: 300, zIndex: 25 }); const m = Mascot(mb, 300); S(m.svg, { left: 0, top: 0 });
  drawMascot(m, { legs: 1, mouth: 'grin', cheeks: 0.6, brow: 1, arms: [[-100, 40, 30, 10], [96, -60, -24, 10]] });
  el(uiL, { left: 0, top: 520, width: W, textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 132, lineHeight: 1.0, color: GOLDD }, 'What flag<br>is this?');
  el(uiL, { left: 0, top: 820, width: W, textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 500, fontSize: 50, color: '#F6F3E9' }, 'Can you name all 7 flags?');
  el(uiL, { left: 0, top: 920, width: W, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '18px' },
    `<span style="font-family:Manrope;font-weight:800;font-size:40px;letter-spacing:.12em;color:#F6F3E9">LEVEL:</span><span style="padding:10px 34px;border-radius:999px;background:${LVL};color:#fff;font-family:Fredoka;font-weight:700;font-size:44px;letter-spacing:.04em">${DAY.level}</span>`);
  el(uiL, { left: 0, top: 1060, width: W, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', fontFamily: 'Manrope', fontWeight: 800, fontSize: 32, color: 'rgba(246,243,233,.7)' },
    `${glyph('bookmark', 40, GOLDD)}Swipe to start${glyph('arrow', 40, 'rgba(246,243,233,.7)')}`);
  el(uiL, { left: 0, top: 120, width: W, textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 40, color: '#F6F3E9' }, `<img src="${ASSETS}roviko-globe.svg" style="width:40px;height:40px;vertical-align:-8px;margin-right:10px">roviko`);
} else if (isQ) {
  // ---- the question: the flag, big, on the passport page
  passportPage();
  const fh = Math.min(560, 920 / FRATIO[F[1]]), fw = fh * FRATIO[F[1]];
  el(uiL, { left: W / 2 - fw / 2, top: 200 + (560 - fh) / 2, zIndex: 5 }, flagW(F[1], fh, 'box-shadow:0 0 0 2px rgba(0,0,0,.06), 0 24px 50px rgba(22,59,50,.22);border-radius:10px'));
  el(uiL, { left: 0, top: 860, width: W, textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 104, color: DARKC }, 'What flag is this?');
  el(uiL, { left: 0, top: 1010, width: W, textAlign: 'center', fontFamily: 'Manrope', fontWeight: 800, fontSize: 32, color: 'rgba(22,59,50,.55)', letterSpacing: '.06em' }, 'GUESS, THEN SWIPE FOR THE STAMP  →');
} else if (isA) {
  // ---- the answer: the passport stamp, the name, one fact
  passportPage();
  stamp(W / 2, 520, 330);
  el(uiL, { left: 0, top: 880, width: W, textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 700, fontSize: F[2].length > 14 ? 92 : 116, color: DARKC, lineHeight: 1.05 }, F[2]);
  el(uiL, { left: 110, top: 1020, width: W - 220, textAlign: 'center', fontFamily: 'Manrope', fontWeight: 700, fontSize: 36, lineHeight: 1.35, color: 'rgba(22,59,50,.85)' }, F[3]);
} else {
  // ---- your score, and the passport in the app
  passportPage();
  el(uiL, { left: 0, top: 190, width: W, textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 92, color: DARKC, lineHeight: 1.05 }, 'How many<br>did you get?');
  [['7/7', 'Flag legend', '#F6B84B'], ['5–6', 'Vexillologist', C.mint], ['3–4', 'Tourist', C.mint], ['0–2', 'Lost at customs', 'rgba(22,59,50,.08)']].forEach(([sc, t, bg], i) =>
    el(uiL, { left: 170, top: 430 + i * 104, width: W - 340, height: 88, borderRadius: 24, background: bg, display: 'flex', alignItems: 'center', gap: '26px', padding: '0 28px', boxSizing: 'border-box' },
      `<span style="font-family:Fredoka;font-weight:700;font-size:44px;color:${DARKC};min-width:110px">${sc}</span><span style="font-family:Fredoka;font-weight:600;font-size:42px;color:${DARKC}">${t}</span>`));
  el(uiL, { left: 140, top: 880, width: W - 280, borderRadius: 34, background: DARKC, padding: '30px 36px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: '26px' },
    `<span style="width:110px;height:110px;border-radius:28px;background:#fff;display:grid;place-items:center;flex:none"><img src="${ASSETS}roviko-globe.svg" style="width:86px;height:86px"></span><div><div style="font-family:Fredoka;font-weight:700;font-size:46px;color:#fff;line-height:1.1">Collect real stamps</div><div style="font-family:Manrope;font-weight:700;font-size:30px;color:rgba(255,255,255,.8);line-height:1.3;margin-top:6px">Play Roviko every day and fill your own passport. roviko.app</div></div>`);
  el(uiL, { left: 0, top: 1110, width: W, textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 40, color: DARKC }, 'Comment your score 👇'.replace(' 👇', ''));
}
window.filmReady = (async () => {
  await Promise.all(['500 20px Fredoka', '600 28px Fredoka', '700 28px Fredoka', '700 13px Manrope', '800 13px Manrope'].map(f => document.fonts.load(f)));
  await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  LAYOUT.forEach(f => f()); return true;
})();
