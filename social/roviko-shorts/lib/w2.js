// Content week 2 (26 Oct - 1 Nov 2026): the look of the post that went big ("Monaco, Indonesia or Poland? Name all 3", 10.3K
// views): the roviko logo and a series pill on one row, a big two-tone headline straight on the background, big white cards.
// The opening of every reel is laid out like that post, so the first frame is the cover. Load after trendfilm.js and ios.js.
const LY = { top: 250, head: 342, body: 590 };   // logo row, headline, first card (the 3:4 grid tile shows y 240..1680)
function brandRow(series, sub) {
  const logo = el(uiL, { left: 64, top: LY.top, height: 72, zIndex: 52, transformOrigin: '0 50%', whiteSpace: 'pre' },
    `<div style="display:flex;align-items:center;gap:14px;height:72px"><img src="${ASSETS}roviko-globe.svg" style="width:58px;height:58px"><span style="font-family:Fredoka;font-weight:600;font-size:46px;color:${C.forest}">roviko</span></div>`);
  const pill = el(uiL, { left: 'auto', right: 64, top: LY.top + 3, height: 66, zIndex: 52, transformOrigin: '100% 50%', borderRadius: 33, padding: '0 22px 0 8px',
    background: 'rgba(255,255,255,.9)', boxShadow: '0 6px 18px rgba(22,59,50,.10)', whiteSpace: 'pre' },
    `<div style="display:flex;align-items:center;gap:12px;height:66px">${iconTile(series[0], 50, series[2][0], series[2][1])}<span style="font-family:Manrope;font-weight:800;font-size:24px;letter-spacing:.1em;color:${C.forest}">${series[1]}</span>${sub ? `<span style="font-family:Manrope;font-weight:800;font-size:24px;color:${IOS.grey}">${sub}</span>` : ''}</div>`);
  return { set: p => [logo, pill].forEach(e => S(e, { transform: `scale(${p})`, visibility: p > 0.001 ? 'visible' : 'hidden' })) };
}
// The headline: line 1 dark, the lines after it green (<b> green, <i> red anywhere). It shrinks to fit 952 px.
function Head(lines, { top = LY.head, size = 86, lh = 1.1, z = 52 } = {}) {
  const box = el(uiL, { left: 64, top, width: 952, zIndex: z });
  const rows = lines.map((html, i) => {
    const m = el(box, { left: 0, top: i * size * lh, width: 1000, height: size * lh + 8, overflow: 'hidden' });
    const sp = el(m, { left: 0, top: 0, whiteSpace: 'pre', fontFamily: 'Fredoka', fontWeight: 600, fontSize: size, lineHeight: size * lh + 'px', color: i ? C.green : C.forest }, html, 'a', 'span');
    sp.querySelectorAll('b').forEach(e => S(e, { color: C.green, fontWeight: 600 }));
    sp.querySelectorAll('i').forEach(e => S(e, { color: IOS.red, fontStyle: 'normal' }));
    return { m, sp, html };
  });
  let L = size * lh;
  LAYOUT.push(() => {
    const cx = document.createElement('canvas').getContext('2d'); cx.font = `600 ${size}px Fredoka`;
    const w = Math.max(...rows.map(r => cx.measureText(r.html.replace(/<[^>]+>/g, '')).width));
    const s = Math.min(1, 952 / w), fs = size * s; L = fs * lh;
    rows.forEach((r, i) => { S(r.m, { top: i * L, height: L + 8 }); S(r.sp, { fontSize: fs, lineHeight: L + 'px' }); });
  });
  return { box, set(pIn, pOut = 0) {
    S(box, { visibility: pIn > 0.001 && pOut < 1 ? 'visible' : 'hidden', opacity: 1 - E.inCubic(clamp(pOut)) });
    rows.forEach((r, i) => { const q = clamp((pIn - i * 0.14) / 0.6); S(r.sp, { transform: `translateY(${(1 - E.outQuint(q)) * L * 1.05 - E.inCubic(clamp(pOut)) * 30}px)` }); });
  } };
}
// a big white card like the ones in that post
const wcard = (x, y, w, h, z = 10) => el(uiL, { left: x, top: y, width: w, height: h, borderRadius: 46, zIndex: z, transformOrigin: '50% 50%', background: 'rgba(255,255,255,.93)',
  border: '1px solid rgba(255,255,255,.95)', boxShadow: '0 1px 2px rgba(22,59,50,.06), 0 22px 50px rgba(22,59,50,.12)' });
const letter = (ch, d = 92) => `<span style="width:${d}px;height:${d}px;border-radius:${d / 2}px;background:${IOS.fill};display:grid;place-items:center;font-family:Fredoka;font-weight:600;font-size:${d * 0.56}px;color:${C.forest};flex:none">${ch}</span>`;
// a hint at the bottom right, like "Answers ->" on the post
const hintAt = (txt, y = 1300) => el(uiL, { left: 'auto', right: 64, top: y, zIndex: 16, transformOrigin: '100% 50%', whiteSpace: 'pre' },
  `<div style="display:flex;align-items:center;gap:10px;font-family:Manrope;font-weight:800;font-size:30px;color:${IOS.grey}">${txt}${glyph('arrow', 34, IOS.grey)}</div>`);
// a round magnifier on a flag: fx, fy = the spot (0..1 of the flag), zoom = how much bigger
function lensOn(code, h, fx, fy, zoom, lx, ly, r = 120, z = 22) {
  const w = h * FRATIO[code], fw = w * zoom, fh = h * zoom;
  return el(uiL, { left: lx - r, top: ly - r, width: 2 * r, height: 2 * r, borderRadius: r, overflow: 'hidden', zIndex: z, transformOrigin: '50% 50%', border: '8px solid #fff',
    boxShadow: '0 18px 40px rgba(22,59,50,.28)', background: `url(${FLAG_W}${code}.svg) ${(r - fx * fw).toFixed(1)}px ${(r - fy * fh).toFixed(1)}px / ${fw.toFixed(1)}px ${fh.toFixed(1)}px no-repeat` });
}
const W2DAYS = { 1: 'MON 26', 2: 'TUE 27', 3: 'WED 28', 4: 'THU 29', 5: 'FRI 30', 6: 'SAT 31', 7: 'SUN 1' };
