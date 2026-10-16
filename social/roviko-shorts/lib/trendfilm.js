// Shared parts of the trend videos (src/tr-*.js): layers, Roviko at the bottom left, a white card, a flat world map,
// rows that pop and a number that counts up. Load after core.js and extras.js; the film sets TEMPO, DIL, END and TL first.
setupStage(C.cream);
const world = el(stage, { width: 1080, height: 1920, zIndex: 1 });
const uiL = el(stage, { width: 1080, height: 1920, zIndex: 20 });
const capL = el(stage, { width: 1080, height: 1920, zIndex: 50 });
Halo(world, 540, 860, 1700);
const MX = 220, MY = 1370, MR = 92;
const mBox = el(uiL, { left: MX - MR * 1.7, top: MY - MR * 1.7, width: MR * 3.4, height: MR * 3.4, zIndex: 30 });
const mascot = Mascot(mBox, MR * 3.4); S(mascot.svg, { left: 0, top: 0 });
const ARMS = {
  rest: [[-112, 66, 22, 10], [112, 66, 22, 10]], up: [[-92, -58, -30, 11], [92, -58, -30, 11]], cheer: [[-118, -92, -22, 11], [118, -92, -22, 11]],
  smug: [[-90, 40, 30, 10], [90, 40, -30, 10]], palm: [[-112, 66, 22, 10], [26, -14, -30, 12]], point: [[-112, 66, 22, 10], [150, -30, -10, 10]],
  think: [[-112, 66, 22, 10], [40, 30, -40, 10]],
};
const tcard = (x, y, w, h, z = 8) => el(uiL, { left: x, top: y, width: w, height: h, borderRadius: 40, background: C.white, zIndex: z, transformOrigin: '50% 50%', overflow: 'hidden',
  boxShadow: '0 2px 4px rgba(22,59,50,.06), 0 18px 44px rgba(22,59,50,.16)' });
const flagH = (code, h, extra = '') => code === 'gl'
  ? `<svg height="${h}" viewBox="0 0 18 12" style="display:block;border-radius:${Math.round(h * 0.08)}px;box-shadow:0 0 0 3px #fff, 0 4px 10px rgba(0,0,0,.15);${extra}"><rect width="18" height="6" fill="#fff"/><rect y="6" width="18" height="6" fill="#D00C33"/><path d="M3 6a4 4 0 0 1 8 0z" fill="#D00C33"/><path d="M3 6a4 4 0 0 0 8 0z" fill="#fff"/></svg>`
  : `<img src="${FLAG_DIR}${code}.svg" style="height:${h}px;border-radius:${Math.round(h * 0.08)}px;box-shadow:0 0 0 3px #fff, 0 4px 10px rgba(0,0,0,.15);display:block;${extra}">`;
// spring a block in at beat b and out at beat bo (scale), returns the in-progress
function popAt(e, t, b, bo = 1e9, f = 2.6, z = 0.55) {
  const p = spB(t, b, f, z) * (1 - segB(t, bo, bo + 0.3, E.inBack));
  // visibility, not display, so flex rows keep their layout
  S(e, { transform: `scale(${p})`, visibility: p > 0.001 ? 'visible' : 'hidden' }); return p;
}
// a number that rolls from 0 to v between beats b0 and b1
const rollN = (t, b0, b1, v, dec = 0) => (v * segB(t, b0, b1, E.outCubic)).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
// a plain lon/lat map (latitude lines stay straight) with every bit of land, in its own layer
function flatMap(box, bounds, { land = '#CFE9DA', sea = '#BFE4F8', z = 9 } = {}) {
  const [lo0, la0, lo1, la1] = bounds, k = Math.min(box.w / (lo1 - lo0), box.h / (la1 - la0));
  const ox = box.x + (box.w - k * (lo1 - lo0)) / 2, oy = box.y + (box.h - k * (la1 - la0)) / 2;
  const pt = (lo, la) => [ox + (lo - lo0) * k, oy + (la1 - la) * k];
  const wrap = el(uiL, { width: 1080, height: 1920, zIndex: z, transformOrigin: `${box.x + box.w / 2}px ${box.y + box.h / 2}px` });
  const svg = svgEl(wrap, 'svg', { width: 1080, height: 1920 }); svg.style.position = 'absolute';
  const id = 'fm' + Math.random().toString(36).slice(2, 7), defs = svgEl(svg, 'defs');
  svgEl(svgEl(defs, 'clipPath', { id }), 'rect', { x: box.x, y: box.y, width: box.w, height: box.h, rx: 28 });
  const g = svgEl(svg, 'g', { 'clip-path': `url(#${id})` });
  svgEl(g, 'rect', { x: box.x, y: box.y, width: box.w, height: box.h, fill: sea });
  const ringD = r => r.map(([lo, la], i) => { const [x, y] = pt(lo, la); return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }).join('') + 'Z';
  const rings = [...Object.values(GEO).flatMap(p => p.map(q => q[0])), ...(window.GEO_EXTRA || [])].filter(r => r.every((q, i) => !i || Math.abs(q[0] - r[i - 1][0]) < 180));
  svgEl(g, 'path', { d: rings.map(ringD).join(''), fill: land, stroke: '#fff', 'stroke-width': 1.2, 'stroke-linejoin': 'round' });
  const top = svgEl(svg, 'g', { 'clip-path': `url(#${id})` });
  return { wrap, svg, g: top, pt, k };
}
// a label pill that springs from a point
function pinLabel(html, { z = 14, size = 36 } = {}) {
  return el(uiL, { zIndex: z, padding: '8px 20px', borderRadius: 20, background: '#fff', boxShadow: '0 6px 18px rgba(22,59,50,.18)', whiteSpace: 'pre', transformOrigin: '50% 100%',
    fontFamily: 'Fredoka', fontWeight: 600, fontSize: size, color: C.forest }, html);
}
// Roviko's face and arms for a mood; hop on the beat when calm
function rovikoMood(t, b, mood, blinks = []) {
  const M = {
    calm: { mouth: 'smile', arms: ARMS.rest, hop: bop(b, 5) },
    smug: { mouth: 'smile', brow: 1, look: [0.6, -0.6], shades: { on: 1, drop: 0 }, arms: ARMS.smug, hop: bop(b, 8) },
    think: { mouth: 'flat', brow: 1, look: [-0.7, -0.8], arms: ARMS.think },
    shock: { mouth: 'o', eyesBig: 0.6, brows: 'up', arms: ARMS.up, sweat: 1 },
    palm: { mouth: 'flat', blink: 1, brows: 'worried', arms: ARMS.palm, sweat: 1 },
    laugh: { happy: 1, mouth: 'grin', cheeks: 0.8, arms: ARMS.cheer, hop: bop(b, 10) },
    cool: { mouth: 'smile', brow: 1, shades: { on: 1, drop: 0 }, arms: ARMS.smug, hop: bop(b, 10) },
    cheer: { happy: 1, mouth: 'grin', cheeks: 0.9, arms: ARMS.cheer, hop: bop(b, 14) },
    sad: { mouth: 'frown', brows: 'worried', sweat: 1, arms: ARMS.palm },
    point: { mouth: 'grin', cheeks: 0.5, arms: ARMS.point, hop: bop(b, 6), look: [0.8, -0.4] },
  }[mood];
  drawMascot(mascot, Object.assign({ legs: 1, blink: blinkAt(t, blinks) }, M));
}
