// iPhone-style kit for the content week (src/wk-*.js): own filled glyphs in the spirit of SF Symbols (no emoji in picture:
// this machine draws emoji with Noto, which looks like Android), frosted cards, inset-grouped rows, chat bubbles, a
// notification banner and a ring timer. Load after core.js, extras.js and trendfilm.js.
const FLAG_W = '../roviko-week/assets/flags/';   // true-ratio flags (roviko.app 1.34)
const IOS = { blue: '#0A84FF', green: '#30C759', red: '#FF3B30', orange: '#FF9500', yellow: '#FFCC00', purple: '#AF52DE', grey: '#8E8E93', fill: 'rgba(118,118,128,.12)', sep: 'rgba(60,60,67,.12)' };
// 24-unit glyphs; fill = currentColor, details in white
const GLYPH = {
  check: '<circle cx="12" cy="12" r="11"/><path d="M7 12.4l3.3 3.3L17.2 8.8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  xmark: '<circle cx="12" cy="12" r="11"/><path d="M8.2 8.2l7.6 7.6M15.8 8.2l-7.6 7.6" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>',
  question: '<circle cx="12" cy="12" r="11"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.1v.4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17.6" r="1.45" fill="#fff"/>',
  globe: '<circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" stroke-width="2"/><ellipse cx="12" cy="12" rx="4.3" ry="10.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M1.8 12h20.4M3.6 6.8h16.8M3.6 17.2h16.8" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  flag: '<path d="M5 2.2a1.1 1.1 0 0 1 1.1 1.1V22a1.1 1.1 0 0 1-2.2 0V3.3A1.1 1.1 0 0 1 5 2.2z"/><path d="M7 3.6c2.2-1.4 4.3-1 6.2-.2 1.9.8 3.8 1.2 6-.1.6-.3 1.3.1 1.3.8v8.8c0 .4-.2.7-.5.9-2.4 1.5-4.6 1.2-6.6.4-1.8-.7-3.6-1.1-6.4.4z"/>',
  bulb: '<path d="M12 1.8a7.2 7.2 0 0 0-4.3 13c.8.6 1.3 1.4 1.3 2.3v.6h6v-.6c0-.9.5-1.7 1.3-2.3A7.2 7.2 0 0 0 12 1.8z"/><rect x="9" y="18.9" width="6" height="1.8" rx=".9"/><rect x="10" y="21.4" width="4" height="1.6" rx=".8"/>',
  timer: '<rect x="9.5" y="1" width="5" height="2.2" rx="1.1"/><circle cx="12" cy="13.5" r="9.2"/><path d="M12 13.5V8.6" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="13.5" r="1.6" fill="#fff"/>',
  flame: '<path d="M12.6 1.6c.6 3.3-1.2 5.3-2.8 7.1C8.3 10.4 6.6 12.2 6.6 15c0 3.6 2.5 6.9 5.8 6.9s5.6-2.8 5.6-6.5c0-2.4-1.1-4.1-2.2-5.3.1 1.5-.4 2.8-1.6 3.3 1-4.2-.8-8.6-1.6-11.8z"/>',
  trophy: '<path d="M6 2.5h12v5.5a6 6 0 0 1-12 0z"/><path d="M6 4H3.2a.7.7 0 0 0-.7.8C2.9 8 4.5 9.8 7 10.2M18 4h2.8a.7.7 0 0 1 .7.8c-.4 3.2-2 5-4.5 5.4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10.6 13.6h2.8v4.2h-2.8z"/><rect x="7" y="18.6" width="10" height="3" rx="1.2"/>',
  people: '<circle cx="8.6" cy="7.4" r="3.6"/><path d="M1.6 19.4c0-3.9 3.1-6.6 7-6.6s7 2.7 7 6.6c0 .6-.4 1-1 1h-12c-.6 0-1-.4-1-1z"/><circle cx="16.8" cy="8.4" r="3"/><path d="M17.2 12.9c3.1.2 5.3 2.5 5.3 5.6 0 .5-.4.9-.9.9h-4.1c.1-2.6-.9-4.9-3-6.2.8-.2 1.7-.3 2.7-.3z"/>',
  send: '<path d="M21.6 2.6c.5-.2 1 .3.8.8l-7.3 18.1c-.2.6-1 .6-1.3.1l-3.1-6.4-6.4-3.1c-.6-.3-.5-1.1.1-1.3z"/><path d="M10.7 13.3l4.6-4.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>',
  bubble: '<path d="M12 2.6c5.6 0 10 3.7 10 8.4s-4.4 8.4-10 8.4c-1 0-2-.1-2.9-.4L4.3 21c-.6.2-1.1-.4-.9-1l1.2-3.4C3.1 15.1 2 13.1 2 11c0-4.7 4.4-8.4 10-8.4z"/>',
  eye: '<path d="M12 4.8C6.6 4.8 2.8 9.4 1.6 11.4a1.1 1.1 0 0 0 0 1.2c1.2 2 5 6.6 10.4 6.6s9.2-4.6 10.4-6.6a1.1 1.1 0 0 0 0-1.2C21.2 9.4 17.4 4.8 12 4.8z"/><circle cx="12" cy="12" r="4.2" fill="#fff"/><circle cx="12" cy="12" r="2.3"/>',
  mountain: '<path d="M1.5 20.5l7-12.3c.4-.7 1.4-.7 1.8 0l2.4 4.2 2.2-3.6c.4-.7 1.4-.7 1.8 0l5.8 11.7z"/><path d="M8.5 8.2l-1.6 2.9 1.6-.9 1.4 1 1-1.3z" fill="#fff"/>',
  map: '<path d="M1.6 5.6c0-.4.2-.7.6-.9l5.2-2.3 9.2 3.1 4.8-2.1c.6-.3 1.3.2 1.3.9v13.9c0 .4-.2.7-.6.9l-5.5 2.4-9.2-3.1-4.5 2c-.6.3-1.3-.2-1.3-.9z"/><path d="M7.4 2.4v16.1M16.6 5.5v16.1" stroke="#fff" stroke-width="1.4" opacity=".7"/>',
  search: '<circle cx="10.2" cy="10.2" r="7" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M15.4 15.4l6 6" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  star: '<path d="M12 1.8l3.1 6.4 7 1-5.1 4.9 1.2 7L12 17.8l-6.2 3.3 1.2-7-5.1-4.9 7-1z" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>',
  crown: '<path d="M2.4 7.6l5.1 3.8L12 3.8l4.5 7.6 5.1-3.8-2 11.2H4.4z"/><rect x="4.4" y="19.6" width="15.2" height="2.4" rx="1.2"/>',
  bolt: '<path d="M13.6 1.6L4.3 13.4c-.4.5 0 1.2.6 1.2h6.1l-1.6 7.8 9.3-11.8c.4-.5 0-1.2-.6-1.2h-6.1z"/>',
  sparkles: '<path d="M10 2.5l1.9 5.6 5.6 1.9-5.6 1.9L10 17.5l-1.9-5.6L2.5 10l5.6-1.9z"/><path d="M18.5 13.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z"/>',
  pin: '<path d="M12 1.6a7.6 7.6 0 0 0-7.6 7.6c0 5.4 6.2 11.9 7 12.7.3.3.9.3 1.2 0 .8-.8 7-7.3 7-12.7A7.6 7.6 0 0 0 12 1.6z"/><circle cx="12" cy="9.2" r="2.9" fill="#fff"/>',
  columns: '<path d="M12 1.6l10 5.2v1.6H2V6.8z"/><rect x="4" y="9.6" width="2.4" height="8.6" rx=".6"/><rect x="8.8" y="9.6" width="2.4" height="8.6" rx=".6"/><rect x="13" y="9.6" width="2.4" height="8.6" rx=".6"/><rect x="17.6" y="9.6" width="2.4" height="8.6" rx=".6"/><rect x="2" y="19.4" width="20" height="2.6" rx="1"/>',
  ruler: '<rect x="1.5" y="7" width="21" height="10" rx="2"/><path d="M5.5 7v4M9 7v2.6M12.5 7v4M16 7v2.6M19.5 7v4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>',
  game: '<path d="M7.4 6.2h9.2a5.6 5.6 0 0 1 5.4 4.3l1.1 5c.5 2.4-1.9 4.1-3.9 2.8l-2.6-1.7a2.4 2.4 0 0 0-1.3-.4H8.7c-.5 0-.9.1-1.3.4l-2.6 1.7C2.8 19.6.4 17.9.9 15.5l1.1-5a5.6 5.6 0 0 1 5.4-4.3z"/><path d="M7.5 9.4v4M5.5 11.4h4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="16.4" cy="10.4" r="1.2" fill="#fff"/><circle cx="18.2" cy="12.6" r="1.2" fill="#fff"/>',
  ghost: '<path d="M12 1.8c-4.6 0-8.1 3.6-8.1 8.2v10.6c0 .8.9 1.2 1.5.7l1.6-1.3 1.6 1.4c.4.3.9.3 1.3 0l1.6-1.4 1.6 1.4c.4.3.9.3 1.3 0l1.6-1.4 1.6 1.3c.6.5 1.5.1 1.5-.7V10c0-4.6-3.5-8.2-8.1-8.2z"/><ellipse cx="9" cy="10.2" rx="1.5" ry="2" fill="#fff"/><ellipse cx="15" cy="10.2" rx="1.5" ry="2" fill="#fff"/>',
  pumpkin: '<path d="M12 6.4c-1.4-.9-3.6-1-5.4 0C3.7 7.8 2.2 11 2.6 14.4c.5 3.7 3.4 6.4 6.4 6.4 1.2 0 2.2-.4 3-.9.8.5 1.8.9 3 .9 3 0 5.9-2.7 6.4-6.4.4-3.4-1.1-6.6-4-8-1.8-1-4-.9-5.4 0z"/><path d="M12 6.6c0-1.8.4-3.4 1.8-4.6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M8 12.4l1.6-1.8 1.6 1.8zM12.8 12.4l1.6-1.8 1.6 1.8zM8.4 15.6c1.8 1.4 5.4 1.4 7.2 0l-1.2 1.6-1.2-.8-1.2.8-1.2-.8-1.2.8z" fill="#fff"/>',
  bookmark: '<path d="M5.6 2.2h12.8c.6 0 1.1.5 1.1 1.1v18c0 .8-.9 1.3-1.6.8L12 18.2l-5.9 3.9c-.7.5-1.6 0-1.6-.8v-18c0-.6.5-1.1 1.1-1.1z"/>',
  heart: '<path d="M12 21.2l-1.4-1.3C5.5 15.3 2.2 12.3 2.2 8.5 2.2 5.4 4.6 3 7.6 3c1.7 0 3.4.8 4.4 2.1C13 3.8 14.7 3 16.4 3c3 0 5.4 2.4 5.4 5.5 0 3.8-3.3 6.8-8.4 11.4z"/>',
  hand: '<path d="M9.4 3.4c0-.9.7-1.6 1.6-1.6s1.6.7 1.6 1.6v6.4l5.6 1.2c1.2.3 2 1.4 1.8 2.6l-.9 5.6a3.4 3.4 0 0 1-3.4 2.9h-4.1a3.4 3.4 0 0 1-2.8-1.5l-3.5-5.1a1.6 1.6 0 0 1 2.4-2.1l1.7 1.6z"/>',
  swap: '<path d="M7 4L2.5 8.5 7 13M2.5 8.5h15M17 11l4.5 4.5L17 20M21.5 15.5h-15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  dice: '<rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="8" cy="8" r="1.7" fill="#fff"/><circle cx="16" cy="16" r="1.7" fill="#fff"/><circle cx="12" cy="12" r="1.7" fill="#fff"/><circle cx="16" cy="8" r="1.7" fill="#fff"/><circle cx="8" cy="16" r="1.7" fill="#fff"/>',
  arrow: '<path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>',
};
const glyph = (name, size, color = 'currentColor', extra = '') => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" style="display:block;color:${color};${extra}">${GLYPH[name]}</svg>`;
// an app-icon tile (squircle, top-lit gradient) with a white glyph
function iconTile(name, size, from, to = null) {
  return `<span style="width:${size}px;height:${size}px;border-radius:${size * 0.27}px;background:linear-gradient(180deg, ${from}, ${to || from});display:grid;place-items:center;flex:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.35), 0 4px 12px rgba(22,59,50,.18)">${glyph(name, size * 0.58, '#fff')}</span>`;
}
const flagW = (code, h, extra = '') => `<img src="${FLAG_W}${code}.svg" style="height:${h}px;width:auto;display:block;border-radius:${Math.max(4, Math.round(h * 0.05))}px;box-shadow:0 0 0 1px rgba(0,0,0,.08), 0 10px 26px rgba(22,59,50,.18);${extra}">`;
// frosted card (iOS material)
const glass = (x, y, w, h, z = 8, css = {}) => el(uiL, Object.assign({ left: x, top: y, width: w, height: h, borderRadius: 46, zIndex: z, transformOrigin: '50% 50%',
  background: 'rgba(255,255,255,.82)', backdropFilter: 'blur(30px) saturate(1.6)', border: '1px solid rgba(255,255,255,.9)',
  boxShadow: '0 1px 2px rgba(22,59,50,.06), 0 22px 50px rgba(22,59,50,.14)' }, css));
// the series pill at the top of every reel: icon tile + series name + day
function seriesTag(icon, name, col, sub) {
  const e = el(uiL, { top: 120, height: 76, zIndex: 52, transformOrigin: '50% 50%', borderRadius: 38, padding: '0 26px 0 10px', background: 'rgba(255,255,255,.86)', backdropFilter: 'blur(24px)',
    boxShadow: '0 8px 24px rgba(22,59,50,.12)', whiteSpace: 'pre' },
    `<div style="display:flex;align-items:center;gap:16px;height:76px">${iconTile(icon, 56, col[0], col[1])}<span style="font-family:Manrope;font-weight:800;font-size:28px;letter-spacing:.08em;color:${C.forest}">${name}</span><span style="font-family:Manrope;font-weight:700;font-size:26px;color:${IOS.grey}">${sub}</span></div>`);
  centreX(e, 120); return e;
}
// one row of an inset-grouped list: letter badge, label, trailing mark (none | check | xmark)
function optionList(x, y, w, labels, { h = 120, size = 50, z = 11, flags = null } = {}) {
  const box = el(uiL, { left: x, top: y, width: w, height: h * labels.length, borderRadius: 38, background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(24px)', zIndex: z, overflow: 'hidden', transformOrigin: '50% 50%',
    boxShadow: '0 1px 2px rgba(22,59,50,.06), 0 22px 50px rgba(22,59,50,.14)' });
  const rows = labels.map((lab, i) => {
    const r = el(box, { left: 0, top: i * h, width: w, height: h, zIndex: 1 });
    const tint = el(r, { left: 0, top: 0, width: w, height: h, background: IOS.green, opacity: 0, zIndex: 0 });
    el(r, { left: 0, top: 0, width: w, height: h, zIndex: 1 }, `<div style="display:flex;align-items:center;gap:26px;height:${h}px;padding:0 34px">${flags ? flagW(flags[i], 52) : `<span style="width:58px;height:58px;border-radius:29px;background:${IOS.fill};display:grid;place-items:center;font-family:Manrope;font-weight:800;font-size:26px;color:${C.forest}">${'ABCD'[i]}</span>`}<span class="lab" style="flex:1;font-family:Fredoka;font-weight:600;font-size:${size}px;color:${C.forest};white-space:nowrap">${lab}</span><span class="mk"></span></div>`);
    if (i < labels.length - 1) el(r, { left: 118, top: h - 1, width: w - 118, height: 2, background: IOS.sep, zIndex: 2 });
    return { r, tint, lab: r.querySelector('.lab'), mk: r.querySelector('.mk') };
  });
  return { box, rows, mark(i, kind, p) {   // p 0..1
    const R = rows[i]; R.mk.innerHTML = p > 0.01 ? glyph(kind === 'check' ? 'check' : 'xmark', 54, kind === 'check' ? IOS.green : IOS.red, `transform:scale(${Math.min(1.15, p)})`) : '';
    R.tint.style.opacity = (kind === 'check' ? 0.16 : 0.1) * Math.min(1, p); R.tint.style.background = kind === 'check' ? IOS.green : IOS.red;
  } };
}
// chat bubbles in the iPhone messages look (no names or logos of any app)
function chatBubble(html, { x, y, me = false, w = null, size = 40, z = 30, parent = uiL }) {
  const e = el(parent, { left: x, top: y, zIndex: z, maxWidth: w || 700, padding: '20px 30px', borderRadius: 40, background: me ? IOS.blue : '#E9E9EB', color: me ? '#fff' : '#000',
    fontFamily: 'Manrope', fontWeight: 600, fontSize: size, lineHeight: 1.25, transformOrigin: me ? '100% 100%' : '0% 100%', whiteSpace: w ? 'normal' : 'pre' }, html);
  el(e, { [me ? 'right' : 'left']: -8, bottom: 0, width: 34, height: 34, zIndex: -1 },
    `<svg width="34" height="34" viewBox="0 0 34 34"><path d="${me ? 'M0 0C2 18 10 28 34 34C18 34 6 32 0 26Z' : 'M34 0C32 18 24 28 0 34C16 34 28 32 34 26Z'}" fill="${me ? IOS.blue : '#E9E9EB'}"/></svg>`);
  return e;
}
// a lock-screen style notification banner
function notifBanner(title, body, { y = 140, z = 55 } = {}) {
  return el(uiL, { left: 60, top: y, width: 960, zIndex: z, borderRadius: 46, padding: '26px 30px', background: 'rgba(250,250,250,.88)', backdropFilter: 'blur(30px) saturate(1.8)', transformOrigin: '50% 0%',
    boxShadow: '0 18px 44px rgba(0,0,0,.16)' },
    `<div style="display:flex;gap:24px;align-items:center"><span style="width:84px;height:84px;border-radius:22px;background:#fff;display:grid;place-items:center;box-shadow:0 0 0 1px rgba(0,0,0,.06)"><img src="${ASSETS}roviko-globe.svg" style="width:62px;height:62px"></span><div style="flex:1"><div style="display:flex;justify-content:space-between"><span style="font-family:Manrope;font-weight:800;font-size:32px;color:#000">${title}</span><span style="font-family:Manrope;font-weight:600;font-size:28px;color:${IOS.grey}">now</span></div><div style="font-family:Manrope;font-weight:600;font-size:32px;color:#1c1c1e;margin-top:4px">${body}</div></div></div>`);
}
// a ring timer (activity-ring look) with the seconds in the middle; set(progress 0..1, seconds left)
function ringTimer(cx, cy, r = 70, col = IOS.orange, z = 14) {
  const e = el(uiL, { left: cx - r - 14, top: cy - r - 14, width: 2 * r + 28, height: 2 * r + 28, zIndex: z, transformOrigin: '50% 50%' });
  const s = svgEl(e, 'svg', { width: 2 * r + 28, height: 2 * r + 28 });
  svgEl(s, 'circle', { cx: r + 14, cy: r + 14, r: r + 6, fill: 'rgba(255,255,255,.92)' });
  svgEl(s, 'circle', { cx: r + 14, cy: r + 14, r: r - 8, fill: 'none', stroke: 'rgba(255,149,0,.18)', 'stroke-width': 16 });
  const arc = svgEl(s, 'circle', { cx: r + 14, cy: r + 14, r: r - 8, fill: 'none', stroke: col, 'stroke-width': 16, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1', transform: `rotate(-90 ${r + 14} ${r + 14})` });
  const num = el(e, { left: 0, top: 0, width: 2 * r + 28, height: 2 * r + 28, display: 'grid', placeItems: 'center', fontFamily: 'Fredoka', fontWeight: 600, fontSize: r * 0.9, color: C.forest }, '');
  return { e, set(p, secs) { arc.setAttribute('stroke-dashoffset', (p).toFixed(4)); num.textContent = secs; } };
}
// a big answer stamp (pill), rotated a little
function stamp(html, bg = IOS.green, y = 1000, size = 84) {
  return el(uiL, { left: 0, top: y, width: 1080, textAlign: 'center', zIndex: 18, transformOrigin: '50% 50%' },
    `<span style="display:inline-flex;align-items:center;gap:18px;padding:18px 40px;border-radius:999px;background:${bg};color:#fff;font-family:Fredoka;font-weight:700;font-size:${size}px;line-height:1.1;box-shadow:0 18px 40px rgba(22,59,50,.25)">${html}</span>`);
}
// a fact card: icon tile, label, text
function factCard(icon, col, label, html, { x = 90, y = 1060, w = 900, z = 15 } = {}) {
  return el(uiL, { left: x, top: y, width: w, zIndex: z, borderRadius: 40, padding: '26px 32px', background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(24px)', transformOrigin: '50% 0%',
    boxShadow: '0 1px 2px rgba(22,59,50,.06), 0 22px 50px rgba(22,59,50,.14)' },
    `<div style="display:flex;gap:24px;align-items:flex-start">${iconTile(icon, 72, col[0], col[1])}<div><div style="font-family:Manrope;font-weight:800;font-size:24px;letter-spacing:.12em;color:${IOS.grey}">${label}</div><div style="font-family:Fredoka;font-weight:500;font-size:42px;line-height:1.25;color:${C.forest};margin-top:6px">${html}</div></div></div>`);
}
// colours of the series tags
const SERIES = {
  country: ['globe', 'GUESS THE COUNTRY', ['#34C759', '#1F806B']],
  flag: ['flag', 'GUESS THE FLAG', ['#FF6B5E', '#E5484D']],
  challenge: ['bolt', 'GEO CHALLENGE', ['#5AC8FA', '#0A84FF']],
  community: ['people', 'ROVIKO', ['#FFCC00', '#FF9500']],
};
const DAYS = { 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT', 7: 'SUN' };
