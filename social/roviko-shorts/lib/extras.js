// Roviko shorts: extra building blocks for the second batch (load after core.js).
'use strict';
const rad = d => d * Math.PI / 180;
const bop = (b, amp = 8, off = 0) => -Math.max(0, Math.sin((((b + off) % 1) + 1) % 1 * Math.PI)) * amp;   // a hop on every beat

// ------------------------------------------------------------------ geo (needs ../roviko-carousels/data/geo.js)
// Lambert azimuthal equal-area around (lon0, lat0), in units of the sphere radius
function laea(lon0, lat0) {
  const l0 = rad(lon0), sp0 = Math.sin(rad(lat0)), cp0 = Math.cos(rad(lat0));
  return (lon, lat) => {
    const l = rad(lon) - l0, p = rad(lat), cp = Math.cos(p), sp = Math.sin(p), cl = Math.cos(l);
    const cosc = sp0 * sp + cp0 * cp * cl, k = Math.sqrt(2 / Math.max(1e-9, 1 + cosc));
    return [k * cp * Math.sin(l), -k * (cp0 * sp - sp0 * cp * cl), cosc];
  };
}
function bboxOf(pts) { let a = [1e9, 1e9, -1e9, -1e9]; for (const [x, y] of pts) a = [Math.min(a[0], x), Math.min(a[1], y), Math.max(a[2], x), Math.max(a[3], y)]; return a; }
// a country's own centre: its largest polygon and everything within 14 degrees of it (no far islands)
function geoCentre(id) {
  const polys = GEO[id];
  const area = poly => { const r = poly[0]; let a = 0; for (let i = 0; i < r.length; i++) { const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % r.length]; a += x1 * y2 - x2 * y1; } return Math.abs(a); };
  const main = polys.reduce((m, p) => area(p) > area(m) ? p : m, polys[0]);
  const mb = bboxOf(main[0]), c0 = [(mb[0] + mb[2]) / 2, (mb[1] + mb[3]) / 2];
  const near = polys.filter(p => { const b = bboxOf(p[0]); return Math.abs((b[0] + b[2]) / 2 - c0[0]) < 14 && Math.abs((b[1] + b[3]) / 2 - c0[1]) < 14; });
  const b = bboxOf(near.flatMap(p => p[0]));
  return { lon: (b[0] + b[2]) / 2, lat: (b[1] + b[3]) / 2, near };
}
// an SVG path of the country, fitted into a box {cx, cy, w, h}
function fitShape(id, box) {
  const ctr = geoCentre(id), P = laea(ctr.lon, ctr.lat);
  const rings = ctr.near.flatMap(poly => poly.map(r => r.map(([lo, la]) => P(lo, la))));
  const b = bboxOf(rings.flat());
  const s = Math.min(box.w / (b[2] - b[0]), box.h / (b[3] - b[1]));
  const ox = box.cx - s * (b[0] + b[2]) / 2, oy = box.cy - s * (b[1] + b[3]) / 2;
  const d = rings.map(r => r.map(([x, y], i) => (i ? 'L' : 'M') + (ox + s * x).toFixed(1) + ' ' + (oy + s * y).toFixed(1)).join('') + 'Z').join('');
  return { d, x: ox + s * b[0], y: oy + s * b[1], w: s * (b[2] - b[0]), h: s * (b[3] - b[1]), s, pt: (lo, la) => { const [x, y] = P(lo, la); return [ox + s * x, oy + s * y]; } };
}

// ------------------------------------------------------------------ talk
// speech bubble with a tail. tail: 'left' | 'right' | 'down'. set(pIn, pOut): springs up from the tail
function Bubble(parent, html, { x, y, w, size = 40, tail = 'down', tx = null, bg = C.white, color = C.forest, z = 40, lh = 1.25, pad = 26 } = {}) {
  const box = el(parent, { left: x, top: y, width: w, zIndex: z, transformOrigin: tail === 'left' ? '0% 100%' : tail === 'right' ? '100% 100%' : `${tx ?? w / 2}px 100%` });
  const body = el(box, { position: 'relative', left: 0, top: 0, width: w, padding: `${pad * 0.7}px ${pad}px`, borderRadius: 30, background: bg, color,
    fontFamily: 'Fredoka', fontWeight: 600, fontSize: size, lineHeight: size * lh + 'px', textAlign: 'center',
    boxShadow: '0 2px 4px rgba(22,59,50,.06), 0 16px 36px rgba(22,59,50,.16)' }, html, '');
  body.querySelectorAll('b').forEach(e => S(e, { color: C.green, fontWeight: 600 }));
  body.querySelectorAll('i').forEach(e => S(e, { color: C.red, fontStyle: 'normal' }));
  const tl = tx ?? (tail === 'left' ? 46 : tail === 'right' ? w - 46 : w / 2);
  const tailEl = el(box, { left: tl - 18, top: 0, width: 36, height: 30, zIndex: -1 },
    `<svg width="36" height="30" viewBox="0 0 36 30"><path d="M0 0H36L${tail === 'left' ? 4 : tail === 'right' ? 32 : 18} 30Z" fill="${bg}"/></svg>`);
  LAYOUT.push(() => S(tailEl, { top: body.getBoundingClientRect().height - 4 }));
  return { box, body, set(pIn, pOut = 0) {
    const s = lerp(0.2, 1, clamp(pIn, 0, 1.2)) * (1 - E.inBack(clamp(pOut)));
    S(box, { transform: `scale(${s})` }); show(box, pIn > 0.001 && pOut < 1);
  } };
}
// a TikTok-style comment: avatar, name, text
function Comment(parent, person, text, { x = 70, y, w = 800, size = 38, z = 40, wrong = false } = {}) {
  const box = el(parent, { left: x, top: y, width: w, height: 132, borderRadius: 34, background: C.white, zIndex: z, transformOrigin: '10% 50%',
    boxShadow: '0 2px 4px rgba(22,59,50,.06), 0 16px 36px rgba(22,59,50,.16)' });
  S(avatar(box, person, 84, 0), { left: 24, top: 24 });
  el(box, { left: 128, top: 18, fontFamily: 'Manrope', fontWeight: 800, fontSize: 26, color: 'rgba(22,59,50,.55)', whiteSpace: 'pre' }, '@' + person.name.toLowerCase());
  el(box, { left: 128, top: 52, width: w - 220, fontFamily: 'Manrope', fontWeight: 700, fontSize: size, lineHeight: size * 1.25 + 'px', color: C.forest, whiteSpace: 'pre' }, text);
  const mark = el(box, { left: w - 86, top: 34, width: 64, height: 64, borderRadius: 32, background: wrong ? C.red : C.green, display: 'grid', placeItems: 'center' },
    wrong ? icon('close', 38, C.white, 4) : icon('check', 38, C.white, 4));
  return { box, mark, set(pIn, pOut = 0, markP = 0) {
    const s = lerp(0.2, 1, clamp(pIn, 0, 1.2)) * (1 - E.inBack(clamp(pOut)));
    S(box, { transform: `scale(${s})` }); show(box, pIn > 0.001 && pOut < 1);
    S(mark, { transform: `scale(${markP}) rotate(${(1 - clamp(markP)) * -40}deg)` }); show(mark, markP > 0.001);
  } };
}
// a pill label
function Tag(parent, text, { bg = C.white, fg = C.forest, size = 30, h = 64, font = 'Manrope', weight = 800, ls = '0.06em', z = 40 } = {}) {
  return el(parent, { height: h, borderRadius: h / 2, background: bg, color: fg, fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: h + 'px',
    padding: `0 ${h * 0.45}px`, letterSpacing: ls, whiteSpace: 'pre', zIndex: z, transformOrigin: '50% 50%', boxShadow: '0 10px 24px rgba(22,59,50,.14)' }, text);
}
const centreX = (e, y) => LAYOUT.push(() => S(e, { left: 540 - e.getBoundingClientRect().width / 2, top: y }));
const popIn = (e, t, b, f = 2.6, z = 0.55) => { const p = spB(t, b, f, z); S(e, { transform: `scale(${p})` }); show(e, p > 0.001); return p; };

// a standard short page: body + stage at 1080x1920
function setupStage(bg = C.cream) {
  S(document.body, { width: 1080, height: 1920, background: bg });
  S(stage, { width: 1080, height: 1920, background: bg });
}
