// Roviko still frame (the "Day 1 of 7" look): logo + badge, eyebrow, two-line title, white card, Roviko, a CTA pill.
// 1080x1920. With ?ig=1 the CTA moves up so a 1080x1350 crop from y = IG_TOP is a 4:5 Instagram slide. Load after core.js and extras.js.
const IG = Q.get('ig') === '1', IG_TOP = 300;
setupStage(C.cream);
S(stage, { background: `radial-gradient(900px 700px at 85% 8%, rgba(31,128,107,.08), transparent 70%), radial-gradient(1000px 900px at 20% 70%, rgba(31,128,107,.07), transparent 70%), ${C.cream}` });
const X0 = 120, CW = 840, CX = X0, CY = 860;            // content column and the card's default top
const FR = n => `<span style="font-family:Fredoka;font-weight:600">${n}</span>`;

// ------------------------------------------------------------------ frame
function header(badge) {
  el(stage, { left: X0, top: 360, height: 60, display: 'flex', alignItems: 'center', gap: '16px', zIndex: 10 },
    `<img src="${ASSETS}roviko-globe.svg" style="width:52px;height:52px;display:block"><span style="font-family:Fredoka;font-weight:600;font-size:44px;color:${C.forest}">roviko</span>`);
  const b = el(stage, { top: 366, height: 50, padding: '0 22px', borderRadius: 25, background: C.white, boxShadow: '0 2px 8px rgba(22,59,50,.08)', zIndex: 10,
    lineHeight: '50px', fontWeight: 700, fontSize: 24, color: C.forest, whiteSpace: 'pre' }, typeof badge === 'number' ? `Day ${badge}` : badge);
  LAYOUT.push(() => S(b, { left: 1080 - X0 - b.getBoundingClientRect().width }));
}
function title(eyebrow, l1, l2) {
  el(stage, { left: X0, top: 486, fontWeight: 800, fontSize: 27, letterSpacing: '0.14em', color: C.green, zIndex: 10, whiteSpace: 'pre' }, eyebrow.toUpperCase());
  const t = el(stage, { left: X0, top: 528, zIndex: 10, fontFamily: 'Fredoka', fontWeight: 600, fontSize: 84, lineHeight: '94px', letterSpacing: '-0.01em', whiteSpace: 'pre', transformOrigin: '0 0' },
    `<div style="color:${C.forest}">${l1}</div><div style="color:${C.green}">${l2}</div>`);
  LAYOUT.push(() => { const w = t.getBoundingClientRect().width; if (w > 1080 - 2 * X0) S(t, { transform: `scale(${(1080 - 2 * X0) / w})` }); });
}
function cta(text = 'Play today’s trip  →') {
  const p = el(stage, { top: IG ? 1520 : 1736, height: 104, padding: '0 58px', borderRadius: 52, background: C.forest, color: C.white, zIndex: 40, lineHeight: '104px',
    fontFamily: 'Fredoka', fontWeight: 600, fontSize: 42, whiteSpace: 'pre', boxShadow: '0 10px 30px rgba(22,59,50,.22)' }, text);
  LAYOUT.push(() => S(p, { left: 540 - p.getBoundingClientRect().width / 2 }));
}
const wcard = (x, y, w, h, z = 5, css = {}) => el(stage, Object.assign({ left: x, top: y, width: w, height: h, borderRadius: 32, background: C.white, zIndex: z,
  boxShadow: '0 2px 6px rgba(22,59,50,.05), 0 18px 50px rgba(22,59,50,.10)', overflow: 'hidden' }, css));
// Roviko with his globe centred at (x, y), globe diameter d
const POSES = {
  wave: { mouth: 'smile', cheeks: 0.5, legs: 1, arms: [[-112, 66, 22, 10], [118, -86, -18, 10]] },
  cheer: { happy: 1, mouth: 'grin', cheeks: 0.9, legs: 1, arms: [[-118, -92, -22, 11], [118, -92, -22, 11]] },
  wink: { wink: 1, mouth: 'grin', cheeks: 0.8, legs: 1, arms: [[-112, 66, 22, 10], [100, -40, -20, 10]] },
  shock: { mouth: 'o', eyesBig: 0.6, brows: 'up', legs: 1, arms: [[-70, -96, -30, 11], [70, -96, -30, 11]] },
  nervous: { look: [0.6, -0.6], mouth: 'wobble', brows: 'worried', sweat: 1, eyesBig: 0.3, legs: 1, arms: [[-108, 58, 24, 10], [104, 62, 22, 10]] },
  cool: { mouth: 'smile', brow: 1, shades: { on: 1, drop: 0 }, legs: 1, arms: [[-90, 40, 30, 10], [90, 40, -30, 10]] },
  think: { look: [-0.7, -0.7], mouth: 'flat', brow: 1, legs: 1, arms: [[-112, 66, 22, 10], [40, 30, -40, 10]] },
  palm: { look: [0, 0.4], blink: 1, mouth: 'flat', brows: 'worried', legs: 1, arms: [[-112, 66, 22, 10], [26, -14, -30, 12]] },
  tired: { blink: 0.55, mouth: 'wobble', brows: 'worried', sweat: 1, legs: 1, arms: [[-104, 64, 22, 10], [104, 64, -22, 10]] },
};
function roviko(x, y, d, pose, z = 30) {
  const px = d * 340 / 200, box = el(stage, { left: x - px / 2, top: y - px / 2, width: px, height: px, zIndex: z });
  const m = Mascot(box, px); S(m.svg, { left: 0, top: 0 }); drawMascot(m, POSES[pose]);
}
const flagImg = (code, h, extra = '') => `<img src="${FLAG_DIR}${code}.svg" style="height:${h}px;border-radius:${Math.round(h * 0.07)}px;box-shadow:0 0 0 1px rgba(22,59,50,.08), 0 6px 16px rgba(22,59,50,.12);display:block;${extra}">`;
const chip = (text, bg, fg, size = 26) => `<span style="display:inline-block;padding:8px 20px;border-radius:999px;background:${bg};color:${fg};font-weight:800;font-size:${size}px;letter-spacing:.06em">${text}</span>`;
function bubble(x, y, html, { size = 38, tail = 'left', w = null, z = 35 } = {}) {
  const b = el(stage, { left: x, top: y, padding: '18px 28px', borderRadius: 30, background: C.white, zIndex: z, fontFamily: 'Fredoka', fontWeight: 500, fontSize: size, color: C.forest,
    whiteSpace: w ? 'normal' : 'pre', width: w, boxShadow: '0 12px 34px rgba(22,59,50,.14)' }, html);
  const tl = { left: 'left:-12px;top:50%;margin-top:-14px', right: 'right:-12px;top:50%;margin-top:-14px', down: 'left:50%;bottom:-12px;margin-left:-14px' }[tail];
  el(b, {}, '', 'x').outerHTML = `<div style="position:absolute;${tl};width:28px;height:28px;background:#fff;transform:rotate(45deg);border-radius:4px"></div>`;
  return b;
}
// three answer rows (A, B, C), like the quiz cards
function options(x, y, w, opts) {
  opts.forEach((o, i) => el(stage, { left: x, top: y + i * 150, width: w, height: 122, borderRadius: 26, background: C.white, zIndex: 8, display: 'flex', alignItems: 'center', gap: '26px', padding: '0 30px',
    boxShadow: '0 2px 6px rgba(22,59,50,.05), 0 14px 36px rgba(22,59,50,.09)' },
    `<span style="width:60px;height:60px;border-radius:30px;background:${C.chip};display:grid;place-items:center;font-weight:800;font-size:26px;color:${C.green};flex:none">${'ABC'[i]}</span><span style="font-family:Fredoka;font-weight:500;font-size:46px;color:${C.forest};white-space:nowrap">${o}</span>`));
}
// a country at true scale: its shape in laea around its own centre, s px per sphere radius, centred on (cx, cy)
function shapeAt(svg, code, cx, cy, s, fill) {
  const ctr = geoCentre(code), P = laea(ctr.lon, ctr.lat);
  const rings = ctr.near.flatMap(poly => poly.map(r => r.map(([lo, la]) => P(lo, la))));
  const b = bboxOf(rings.flat()), ox = cx - s * (b[0] + b[2]) / 2, oy = cy - s * (b[1] + b[3]) / 2;
  svgEl(svg, 'path', { d: rings.map(r => r.map(([x, y], i) => (i ? 'L' : 'M') + (ox + s * x).toFixed(1) + ' ' + (oy + s * y).toFixed(1)).join('') + 'Z').join(''), fill, stroke: C.forest, 'stroke-width': 3, 'stroke-linejoin': 'round' });
  return { w: s * (b[2] - b[0]), h: s * (b[3] - b[1]) };
}
const pageSvg = (z = 9) => { const s = svgEl(stage, 'svg', { width: 1080, height: 1920 }); S(s, { position: 'absolute', left: 0, top: 0, zIndex: z }); return s; };
