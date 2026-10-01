// Roviko shorts: shared engine. Pure functions of time, same idioms as the launch film (social/roviko-launch-film).
// Each short sets TEMPO (the song's BPM) and draws its frame in seek(t). Design time runs on the film's 130 BPM grid,
// slowed by DIL = TEMPO / 130, so springs and holds feel the same as in the film.
'use strict';
const ASSETS = '../roviko-launch-film/assets/';
const BEAT = 60 / 130;                                   // design grid
const T = b => b * BEAT;                                 // beats -> design seconds
const C = {
  forest: '#163B32', green: '#1F806B', mint: '#DDEDE6', gold: '#F6B84B', cream: '#F6F3E9', white: '#FFFFFF',
  ocean: '#36B3F5', water: '#BFE4F8', ink: '#06224F', red: '#E5484D', chip: '#EEF5F1', globe: '#33B3FB', land: '#5ED34F',
};
// ------------------------------------------------------------------ math
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const E = {
  lin: t => t,
  inQuad: t => t * t, outQuad: t => 1 - (1 - t) * (1 - t),
  inCubic: t => t * t * t, outCubic: t => 1 - (1 - t) ** 3,
  inOutCubic: t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2,
  outQuart: t => 1 - (1 - t) ** 4, inOutQuart: t => t < .5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2,
  outQuint: t => 1 - (1 - t) ** 5, inOutQuint: t => t < .5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2,
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  inBack: t => 2.2 * t * t * t - 1.2 * t * t,
};
// progress of an eased segment between two beats
const segB = (t, b0, b1, e = E.inOutCubic) => e(inv(T(b0), T(b1), t));
// Closed-form step response of a damped spring (0 before start, settles at 1).
function spring(dt, f = 2.2, z = 0.62) {
  if (dt <= 0) return 0;
  const w = 2 * Math.PI * f;
  if (z >= 1) return 1 - Math.exp(-w * dt) * (1 + w * dt);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + (z * w / wd) * Math.sin(wd * dt));
}
const spB = (t, b0, f, z) => spring(t - T(b0), f, z);        // spring started at beat b0
function hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function mixc(a, b, t) { const x = hex(a), y = hex(b); t = clamp(t); return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], t))).join(',')})`; }
const fmt = n => Math.round(n).toLocaleString('en-US');
// seeded random for the typing rhythm
function rng(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

// ------------------------------------------------------------------ DOM helpers
const stage = document.getElementById('stage');
const UNITLESS = new Set(['opacity', 'zIndex', 'fontWeight', 'lineHeight', 'flex']);
function S(e, o) {
  for (const k in o) { const v = o[k]; e.style[k] = (typeof v === 'number' && !UNITLESS.has(k)) ? v + 'px' : v; }
  return e;
}
function el(parent, css = {}, html = '', cls = 'a', tag = 'div') {
  const e = document.createElement(tag);
  e.className = cls;
  if (html) e.innerHTML = html;
  S(e, css);
  parent.appendChild(e);
  return e;
}
const NS = 'http://www.w3.org/2000/svg';
function svgEl(parent, tag, attrs = {}) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent.appendChild(e);
  return e;
}
function tf({ x = 0, y = 0, s = 1, sx, sy, r = 0 } = {}) {
  return `translate(${x}px,${y}px) rotate(${r}deg) scale(${sx ?? s},${sy ?? s})`;
}
const show = (e, on) => { const d = on ? '' : 'none'; if (e.style.display !== d) e.style.display = d; };

// Text that rises out of a mask line. Returns {box, span}; set p in [0,1] (in) and q in [0,1] (out).
function maskText(parent, text, css, spanCss = {}) {
  const box = el(parent, Object.assign({ overflow: 'hidden' }, css), '', 'a');
  const span = el(box, Object.assign({ whiteSpace: 'pre' }, spanCss), '', 'a', 'span');
  span.textContent = text;
  const h = parseFloat(css.height);
  return { box, span, set(pIn, pOut = 0, dy = 1.15) {
    S(span, { transform: `translateY(${(1 - pIn) * h * dy - pOut * h * dy}px)` });
    show(box, pIn > 0 && pOut < 1);
  } };
}

// Number that rolls: old value slides up, new rises from below.
function roller(parent, css, spanCss) {
  const box = el(parent, Object.assign({ overflow: 'hidden' }, css));
  const a = el(box, spanCss, '', 'a', 'span'), b = el(box, spanCss, '', 'a', 'span');
  return { box, set(oldText, newText, p) {
    const h = parseFloat(css.height);
    a.textContent = oldText; b.textContent = newText;
    S(a, { transform: `translateY(${-p * h}px)` });
    S(b, { transform: `translateY(${(1 - p) * h}px)` });
    show(a, p < 1); show(b, p > 0);
  } };
}


// ------------------------------------------------------------------ icons (24 px line icons)
const ICON = {
  play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.6v6.8l5.6-3.4z" fill="currentColor" stroke-linejoin="round"/>',
  explore: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z" stroke-linejoin="round"/>',
  multi: '<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6"/><circle cx="16.5" cy="9.6" r="2.6"/><path d="M15.8 14.5c2.3.1 4.1 1.5 4.7 4.2"/>',
  passport: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><circle cx="12" cy="11" r="3.3"/><path d="M9 17h6"/>',
  close: '<path d="M7 7l10 10M17 7L7 17"/>',
  check: '<path d="M5.5 12.5l4.2 4.2L18.5 8"/>',
};
const icon = (name, size, color, sw = 2) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" style="color:${color};display:block">${ICON[name]}</svg>`;
const FLAME = '<svg viewBox="0 0 24 24" width="22" height="22" style="display:block"><path d="M12.6 2.2c.5 3.1-1.1 4.9-2.6 6.6C8.6 10.4 7 12 7 14.7 7 18 9.3 21 12.3 21S17.5 18.4 17.5 15c0-2.2-1-3.8-2-4.9.1 1.4-.4 2.6-1.5 3 .9-3.9-.7-7.9-1.4-10.9z" fill="#163B32"/><path d="M12.4 13.6c.2 1.4-.8 2.2-1.3 2.9-.4.5-.6 1-.6 1.6 0 1.1.8 2 1.9 2s1.9-.9 1.9-2.1c0-1.6-1.1-2.9-1.9-4.4z" fill="#F6B84B"/></svg>';


// ------------------------------------------------------------------ the mascot (globe with arms and legs)
// Local units: globe radius 100 at the origin. Face redrawn from the artwork's geometry.
const MK = 100 / 873.8;
function Mascot(parent, px) {
  const svg = svgEl(parent, 'svg', { width: px, height: px, viewBox: '-170 -170 340 340' });
  svg.style.position = 'absolute';
  const back = svgEl(svg, 'g');
  const body = svgEl(svg, 'g');
  const id = 'mg' + Math.random().toString(36).slice(2, 8);
  const defs = svgEl(body, 'defs');
  const cp = svgEl(defs, 'clipPath', { id });
  svgEl(cp, 'circle', { r: 100 });
  svgEl(body, 'circle', { r: 100, fill: C.globe });
  const lg = svgEl(body, 'g', { 'clip-path': `url(#${id})` });
  svgEl(lg, 'path', { d: window.MASCOT_LAND, fill: C.land, transform: `scale(${MK}) translate(-1023.2 -1031.3)` });
  const face = svgEl(body, 'g');
  const iris = svgEl(body, 'circle', { r: 0, fill: C.red });   // pin head that opens into the globe
  const front = svgEl(svg, 'g');
  return { svg, back, body, face, front, iris, px };
}
const INK = C.ink;
function limbPath(ax, ay, bx, by, bend) {
  const mx = (ax + bx) / 2, my = (ay + by) / 2, dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
  return `M${ax.toFixed(1)} ${ay.toFixed(1)}Q${(mx - dy / L * bend).toFixed(1)} ${(my + dx / L * bend).toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
}
// state: look [dx,dy], blink 0..1, happy 0..1 (^^ eyes), wink 0..1, eyesBig 0..1 (shock),
// mouth 'smile'|'open'|'o'|'flat'|'frown'|'grin'|'wobble'|'none', brow 0..1 (one raised: smug), brows 'worried'|'up',
// cheeks 0..1, flush 0..1 (red with anger), shades {on 0..1, drop 0..1}, sweat 0..1, arms [[hx,hy,bend,hand r]...] or null,
// legs 0..1, spread, tuck, feet [[dx,dy],[dx,dy]] (running), hop (y offset), sx/sy squash, tilt (deg)
function drawMascot(m, st) {
  const look = st.look || [0, 0];
  const ex = look[0] * 4, ey = look[1] * 3;
  const big = 1 + 0.35 * (st.eyesBig || 0);
  const eye = (cx, closed, happy) => {
    const x = cx + ex, y = -5.7 + ey;
    if (happy > 0.5) return `<path d="M${x - 11} ${y + 3}q11 -13 22 0" stroke="${INK}" stroke-width="5.4" stroke-linecap="round" fill="none"/>`;
    const ry = 11 * big * (1 - 0.9 * closed), rx = 11 * big;
    return `<ellipse cx="${x}" cy="${y}" rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}" fill="${INK}"/>` +
      (closed < 0.5 ? `<ellipse cx="${x - 3.5 * big}" cy="${y - 4.5 * (ry / 11)}" rx="${(3.6 * big).toFixed(2)}" ry="${(3.4 * ry / 11).toFixed(2)}" fill="#fff"/>` : '');
  };
  let f = st.flush ? `<circle r="100" fill="#E5484D" opacity="${(0.5 * st.flush).toFixed(2)}"/>` : '';
  f += eye(-30.4, st.blink || 0, st.happy || 0) + eye(30.9, st.blink || 0, Math.max(st.happy || 0, st.wink || 0));
  if (st.brow) f += `<path d="M${20 + ex} ${-24 + ey - 5 * st.brow}l19 ${-3 - 2 * st.brow}" stroke="${INK}" stroke-width="4.4" stroke-linecap="round"/>`;
  if (st.brows === 'worried') f += `<path d="M${-40 + ex} ${-27 + ey}l17 -6M${40 + ex} ${-27 + ey}l-17 -6" stroke="${INK}" stroke-width="4.4" stroke-linecap="round"/>`;
  if (st.brows === 'angry') f += `<path d="M${-42 + ex} ${-33 + ey}l20 7M${42 + ex} ${-33 + ey}l-20 7" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
  if (st.brows === 'up') f += `<path d="M${-41 + ex} ${-31 + ey}q10 -7 20 0M${21 + ex} ${-31 + ey}q10 -7 20 0" stroke="${INK}" stroke-width="4.4" stroke-linecap="round" fill="none"/>`;
  if (st.cheeks) f += `<g fill="#FF8FA3" opacity="${(0.55 * st.cheeks).toFixed(2)}"><ellipse cx="${-45 + ex}" cy="${10 + ey}" rx="9" ry="5"/><ellipse cx="${46 + ex}" cy="${10 + ey}" rx="9" ry="5"/></g>`;
  const mx = ex * 0.7, my = ey * 0.6;
  const M = st.mouth;
  if (M === 'open') f += `<path d="M${-12 + mx} ${7 + my}q12 17 24 0z" fill="${INK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M${-6 + mx} ${14.5 + my}q6 4 12 0" fill="#FF8FA3"/>`;
  else if (M === 'grin') f += `<path d="M${-17 + mx} ${6 + my}q17 24 34 0z" fill="${INK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M${-9 + mx} ${17 + my}q9 5 18 0" fill="#FF8FA3"/>`;
  else if (M === 'o') f += `<ellipse cx="${1 + mx}" cy="${13 + my}" rx="${5.2 * big}" ry="${6.5 * big}" fill="${INK}"/>`;
  else if (M === 'flat') f += `<path d="M${-9 + mx} ${12 + my}h18" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
  else if (M === 'frown') f += `<path d="M${-10 + mx} ${16 + my}Q${mx} ${8 + my} ${10 + mx} ${16 + my}" stroke="${INK}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  else if (M === 'wobble') f += `<path d="M${-13 + mx} ${13 + my}l6.5 -4 6.5 4 6.5 -4 6.5 4" stroke="${INK}" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  else if (M !== 'none') f += `<path d="M${-11.3 + mx} ${7.7 + my}Q${mx} ${18.4 + my} ${11.3 + mx} ${7.7 + my}" stroke="${INK}" stroke-width="5.2" stroke-linecap="round" fill="none"/>`;
  if (st.shades && st.shades.on > 0) {
    const on = st.shades.on, dy = -5.7 + ey + (st.shades.drop || 0) * 16 - (1 - on) * 70;
    f += `<g transform="translate(${ex} ${dy.toFixed(1)}) rotate(${((st.shades.drop || 0) * -7).toFixed(1)})"><path d="M-47 -12h36a4 4 0 0 1 4 4v6c0 9 -7 15 -16 15h-12c-9 0 -16 -6 -16 -15v-6a4 4 0 0 1 4 -4zM11 -12h36a4 4 0 0 1 4 4v6c0 9 -7 15 -16 15h-12c-9 0 -16 -6 -16 -15v-6a4 4 0 0 1 4 -4z" fill="${INK}"/><path d="M-7 -8q7 -5 18 0" stroke="${INK}" stroke-width="4" fill="none"/><path d="M-40 -6l9 0M18 -6l9 0" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/></g>`;
  }
  if (st.sweat > 0) {
    const s = st.sweat;
    f += `<path transform="translate(${58 + ex} ${-30 + ey + 6 * s}) scale(${s})" d="M0 -12C4 -5 8 0 8 5a8 8 0 0 1 -16 0c0 -5 4 -10 8 -17z" fill="#BFE4F8" stroke="#fff" stroke-width="2"/>`;
  }
  m.face.innerHTML = f;
  // limbs
  let b = '', fr = '';
  const hop = st.hop || 0;
  if (st.legs > 0) {
    const L = st.legs, spread = st.spread ?? 1, feet = st.feet || [[0, 0], [0, 0]];
    [-1, 1].forEach((s, k) => {
      const hx = 30 * s, hy = 90 + hop, fx = (36 + 6 * spread) * s + feet[k][0], fy = hy + 58 * L - (st.tuck || 0) * 20 + feet[k][1];
      b += `<path d="${limbPath(hx, hy, fx, fy, -6 * s)}" stroke="${INK}" stroke-width="8.5" stroke-linecap="round" fill="none"/>`;
      b += `<ellipse cx="${fx + 7 * s}" cy="${fy + 3}" rx="${14 * L}" ry="${8 * L}" fill="${INK}"/>`;
    });
  }
  if (st.arms) {
    st.arms.forEach(([hx, hy, bend, hr = 9], i) => {
      const s = i ? 1 : -1, sx = 86 * s, sy = 26 + hop;
      b += `<path d="${limbPath(sx, sy, hx, hy + hop, bend * s)}" stroke="${INK}" stroke-width="8.5" stroke-linecap="round" fill="none"/>`;
      fr += `<circle cx="${hx}" cy="${hy + hop}" r="${hr}" fill="${INK}"/>`;
    });
  }
  m.back.innerHTML = b;
  m.front.innerHTML = fr;
  m.body.setAttribute('transform', `translate(0 ${hop}) rotate(${st.tilt || 0}) scale(${st.sx ?? 1} ${st.sy ?? 1})`);
  m.iris.setAttribute('r', (st.iris || 0).toFixed(2));
}

// answer pills: circle -> pill on a spring
function Pill(parent, label, x, y, w, h, fontSize = 20) {
  const box = el(parent, { left: x, top: y, width: w, height: h, borderRadius: h / 2, background: C.chip, overflow: 'hidden' });
  const fill = el(box, { borderRadius: '50%', background: C.green });
  const txt = el(box, { left: 0, top: 0, width: w, height: h, lineHeight: h + 'px', textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 500, fontSize, color: C.forest, whiteSpace: 'pre' }, label);
  const cs = w < 200 ? 22 : 30;
  const chk = el(box, { left: w - h + 6, top: (h - cs) / 2, width: cs, height: cs }, icon('check', cs, C.white, 3.2));
  return { box, fill, txt, chk, x, y, w, h, label, cs };
}
// pill geometry for a state: grow p (circle->pill), shrink out q
function pillShape(P, p, q = 0, press = 0) {
  const cx = P.x + P.w / 2, cy = P.y + P.h / 2;
  const d = P.h * E.outCubic(clamp(p / 0.3));                  // a dot grows into a circle...
  const wide = lerp(d, P.w, Math.max(0, (p - 0.15) / 0.85));     // ...then stretches into the pill
  const ww = Math.max(0, q > 0 ? lerp(wide, 0, q) : wide);
  const hgt = q > 0 ? d * (1 - q) : d;
  const s = 1 - 0.045 * press;
  S(P.box, { left: cx - ww / 2, top: cy - hgt / 2, width: ww, height: hgt, borderRadius: hgt / 2, transform: `scale(${s})` });
  S(P.txt, { left: (ww - P.w) / 2, top: (hgt - P.h) / 2 });
  S(P.chk, { left: P.cs < 30 ? ww - P.cs - 14 : ww - P.h + 10, top: (hgt - P.cs) / 2 });
}
// green ripple inside a pill, from point (px, py) in pill-local coordinates
function pillFill(P, p, px = P.w / 2, py = P.h / 2, drain = 0) {
  const r = p * Math.hypot(Math.max(px, P.w - px), P.h) * 1.05;
  S(P.fill, { left: px - r, top: py - r, width: 2 * r, height: 2 * r, background: mixc(C.green, C.chip, drain) });
  P.txt.style.color = mixc(C.forest, C.white, inv(0.25, 0.6, p) * (1 - drain));
}


// ------------------------------------------------------------------ player avatars
// Illustrated globes from the Roviko brand kit (friends-row), or a coloured initial; "You" is gold.
function avatar(parent, p, size, ring = 3) {
  const e = el(parent, { width: size, height: size, borderRadius: '50%', overflow: 'hidden', background: p.you ? C.gold : (p.bg || C.white),
    boxShadow: `0 0 0 ${ring}px #fff, 0 4px 10px rgba(22,59,50,.14)`, textAlign: 'center', lineHeight: size + 'px',
    fontFamily: 'Fredoka', fontWeight: 600, fontSize: size * 0.44, color: C.forest });
  if (p.img) e.innerHTML = `<img src="${ASSETS}avatars/globe-${p.img}.png" style="width:118%;height:118%;margin:-9%;display:block">`;
  else e.textContent = p.you ? 'Y' : p.name[0];
  return e;
}


// blink helper: quick close/open around given beats
function blinkAt(t, beats) {
  let v = 0;
  for (const bb of beats) { const d = t - T(bb); if (d > 0 && d < 0.18) v = Math.max(v, Math.sin(d / 0.18 * Math.PI)); }
  return v;
}

const quad = (a, c, b, t) => [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
const quadD = (a, c, b, t) => [2 * (1 - t) * (c[0] - a[0]) + 2 * t * (b[0] - c[0]), 2 * (1 - t) * (c[1] - a[1]) + 2 * t * (b[1] - c[1])];
// ------------------------------------------------------------------ stage pieces shared by the shorts
const Q = new URLSearchParams(location.search);
const LAYOUT = [];                                       // run once fonts and images are ready
// TikTok / Reels overlay-free area on 1080x1920: 130 px top, 484 px bottom, 44 px left, 140 px right
const SAFE = { top: 130, bottom: 1920 - 484, left: 44, right: 1080 - 140 };

// sunrise halo: a conic gradient blurred once into an image at boot, then only rotated per frame
const HALOS = [];
function Halo(parent, cx, cy, size = 1520, opacity = 0.34) {
  const img = el(parent, { left: cx - size / 2, top: cy - size / 2, width: size, height: size, opacity, zIndex: 0 }, '', 'a', 'img');
  HALOS.push({ img, size });
  return img;
}
function paintHalos() {
  return Promise.all(HALOS.map(({ img, size }) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    const g = cv.getContext('2d');
    const grad = g.createConicGradient(0, size / 2, size / 2);
    [C.mint, C.gold, C.ocean, C.green, C.mint].forEach((c, i) => grad.addColorStop(i / 4, c));
    g.filter = `blur(${size * 0.072}px)`;
    g.beginPath(); g.arc(size / 2, size / 2, size * 0.342, 0, Math.PI * 2); g.fillStyle = grad; g.fill();
    img.src = cv.toDataURL('image/png');
    return img.decode();
  }));
}

// the phone: bezel + screen (428 x 900) + status bar + tab bar, all inside one wrapper that can be transformed
const PH = { w: 428, h: 900 };
function Phone(parent, x, y, { tab = 0, time = '9:41', z = 2 } = {}) {
  const wrap = el(parent, { left: x - 11, top: y - 11, width: PH.w + 22, height: PH.h + 22, zIndex: z, transformOrigin: '50% 50%' });
  const bezel = el(wrap, { left: 0, top: 0, width: PH.w + 22, height: PH.h + 22, borderRadius: 56, background: C.forest,
    boxShadow: '0 50px 90px rgba(22,59,50,.16), 0 14px 30px rgba(22,59,50,.12)' });
  for (const [bx, by, bh] of [[-3, 150, 34], [-3, 206, 58], [-3, 276, 58], [PH.w + 22, 220, 92]]) el(bezel, { left: bx, top: by, width: 4, height: bh, borderRadius: 2, background: C.forest });
  const scr = el(wrap, { left: 11, top: 11, width: PH.w, height: PH.h, borderRadius: 45, overflow: 'hidden', background: C.cream });
  const clock = el(scr, { left: 34, top: 15, fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em', zIndex: 40, whiteSpace: 'pre' }, time);
  el(scr, { left: 318, top: 18, zIndex: 40 }, `<svg width="80" height="14" viewBox="0 0 80 14"><g fill="${C.forest}"><rect x="0" y="9" width="3.4" height="4.5" rx="1"/><rect x="5" y="6.5" width="3.4" height="7" rx="1"/><rect x="10" y="4" width="3.4" height="9.5" rx="1"/><rect x="15" y="1.5" width="3.4" height="12" rx="1"/></g><path d="M27 5.2a10 10 0 0 1 13.6 0M29.4 8a6.4 6.4 0 0 1 8.8 0" stroke="${C.forest}" stroke-width="1.9" fill="none" stroke-linecap="round"/><circle cx="33.8" cy="11.2" r="1.7" fill="${C.forest}"/><rect x="48" y="1.5" width="25" height="12" rx="3.6" fill="none" stroke="${C.forest}" stroke-opacity=".45" stroke-width="1.3"/><rect x="50.2" y="3.7" width="18" height="7.6" rx="2" fill="${C.forest}"/><path d="M75 5.6v3.8" stroke="${C.forest}" stroke-opacity=".45" stroke-width="1.6" stroke-linecap="round"/></svg>`);
  const tabbar = el(scr, { left: 16, top: 812, width: 396, height: 70, borderRadius: 35, background: C.white, zIndex: 30,
    boxShadow: '0 1px 2px rgba(22,59,50,.06), 0 10px 28px rgba(22,59,50,.10)' });
  [['play', 'Play'], ['explore', 'Explore'], ['multi', 'Multiplayer'], ['passport', 'Passport']].forEach(([ic, label], i) => {
    const on = i === tab, cx = 49.5 + i * 99;
    if (on) el(tabbar, { left: cx - 26, top: 9, width: 52, height: 32, borderRadius: 16, background: C.mint });
    el(tabbar, { left: cx - 12, top: 13 }, icon(ic, 24, on ? C.green : 'rgba(22,59,50,.55)', 2));
    el(tabbar, { left: cx - 45, top: 45, width: 90, textAlign: 'center', fontSize: 11, fontWeight: 700, color: on ? C.green : 'rgba(22,59,50,.55)' }, label);
  });
  return { wrap, bezel, scr, clock, tabbar, x, y };
}
const card = (parent, x, y, w, h, z = 5) => el(parent, { left: x, top: y, width: w, height: h, borderRadius: 22, background: C.white, overflow: 'hidden', zIndex: z,
  boxShadow: '0 1px 2px rgba(22,59,50,.06), 0 12px 32px rgba(22,59,50,.09)' });

// TikTok-style caption: a white card whose lines rise out of mask lines. Lines may hold <b> (green) or <i> (red) words.
function Caption(parent, lines, { cy = 250, size = 58, lh = 1.18, pad = 30, z = 50, bg = C.white, color = C.forest, width = null } = {}) {
  const box = el(parent, { borderRadius: 30, background: bg, zIndex: z, overflow: 'hidden', transformOrigin: '50% 50%',
    boxShadow: '0 2px 4px rgba(22,59,50,.06), 0 18px 40px rgba(22,59,50,.14)' });
  const L = size * lh;
  const rows = lines.map((html, i) => {
    const m = el(box, { left: pad, top: pad * 0.72 + i * L, height: L, overflow: 'hidden' });
    const sp = el(m, { left: 0, top: 0, whiteSpace: 'pre', fontFamily: 'Fredoka', fontWeight: 600, fontSize: size, lineHeight: L + 'px', color }, html, 'a', 'span');
    sp.querySelectorAll('b').forEach(e => S(e, { color: C.green, fontWeight: 600 }));
    sp.querySelectorAll('i').forEach(e => S(e, { color: C.red, fontStyle: 'normal' }));
    return { m, sp, html };
  });
  const cap = { box, rows, w: 0, h: pad * 1.44 + lines.length * L, cy, set(pIn, pOut = 0) {
    // the card springs up from a pill, each line rises in after it; out: lines drop away, the card shrinks
    const s = lerp(0.2, 1, clamp(pIn, 0, 1.2)) * (1 - E.inBack(clamp(pOut)));
    S(box, { transform: `scale(${s})` });
    show(box, pIn > 0.001 && pOut < 1);
    rows.forEach((r, i) => {
      const q = clamp((pIn - 0.25 - i * 0.12) / 0.55);
      S(r.sp, { transform: `translateY(${(1 - E.outQuint(q)) * L * 1.05}px)` });
    });
  } };
  LAYOUT.push(() => {
    const cx = document.createElement('canvas').getContext('2d');
    cx.font = `600 ${size}px Fredoka`;
    const ws = rows.map(r => cx.measureText(r.html.replace(/<[^>]+>/g, '')).width);
    const inner = Math.max(...ws);
    cap.w = width || inner + 2 * pad;
    const W0 = parseFloat(document.body.style.width) || 1080;
    S(box, { left: W0 / 2 - cap.w / 2, top: cap.cy - cap.h / 2, width: cap.w, height: cap.h });
    rows.forEach((r, i) => S(r.m, { left: (cap.w - ws[i]) / 2, width: ws[i] + 4 }));
  });
  return cap;
}

// round pointer with a tap ring
function Pointer(parent, z = 60) {
  const dot = el(parent, { width: 30, height: 30, borderRadius: 15, background: 'rgba(22,59,50,.34)', boxShadow: '0 0 0 3px rgba(255,255,255,.9), 0 4px 12px rgba(22,59,50,.25)', zIndex: z });
  const ring = el(parent, { borderRadius: '50%', border: '3px solid rgba(22,59,50,.4)', zIndex: z - 1 });
  return { set(x, y, sc, tapT, t, tx = x, ty = y) {
    S(dot, { left: x - 15, top: y - 15, transform: `scale(${sc})` }); show(dot, sc > 0.01);
    const rp = tapT == null ? 1 : clamp((t - tapT) / 0.4), rr = 16 + 34 * E.outCubic(rp);
    S(ring, { left: tx - rr, top: ty - rr, width: 2 * rr, height: 2 * rr, borderWidth: (3 * (1 - rp)) + 'px' });
    show(ring, tapT != null && t > tapT && rp < 1);
  } };
}
// pointer path between two points with a bow, an eased approach, a press and a fade-by-scale
function pointerAt(t, { from, to, b0, b1, tap, gone, bow = 20 }) {
  const p = segB(t, b0, b1, E.inOutCubic);
  const press = t >= T(tap) - 0.05 ? Math.exp(-Math.max(0, t - T(tap) + 0.05) * 14) : 0;
  const sc = spB(t, b0 - 0.1, 3, 0.6) * (1 - segB(t, gone, gone + 0.25, E.inCubic)) * (1 - 0.28 * press);
  return { x: lerp(from[0], to[0], p) + Math.sin(p * Math.PI) * bow, y: lerp(from[1], to[1], p), sc };
}

// end card: cream floods out of a point, Roviko pops up and waves, the wordmark wipes out below, tagline, roviko.app
function EndCard(parent, { mx = 540, my = 700, r = 150, z = 80, tagline = 'A small geography trip. Every day.' } = {}) {
  const layer = el(parent, { width: 1080, height: 1920, zIndex: z, overflow: 'hidden' });
  const flood = el(layer, { borderRadius: '50%', background: C.cream });
  const box = el(layer, { width: 600, height: 600, zIndex: 3 });
  const m = Mascot(box, 600); S(m.svg, { left: 0, top: 0 });
  const shadow = el(layer, { borderRadius: '50%', background: 'rgba(22,59,50,.12)', filter: 'blur(4px)', zIndex: 2 });
  const wmMask = el(layer, { overflow: 'hidden', zIndex: 2, left: 0, width: 1080 });
  const wm = el(wmMask, { fontFamily: 'Fredoka', fontWeight: 700, color: C.forest, whiteSpace: 'pre', letterSpacing: '-0.01em', fontSize: 230, lineHeight: '276px' }, 'roviko');
  const tag = maskText(layer, tagline, { left: 0, top: 0, width: 1080, height: 60 }, { width: 1080, textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 500, fontSize: 46, lineHeight: '60px', color: C.forest });
  const url = maskText(layer, 'roviko.app', { left: 0, top: 0, width: 1080, height: 56 }, { width: 1080, textAlign: 'center', fontFamily: 'Manrope', fontWeight: 800, fontSize: 40, lineHeight: '56px', color: C.green, letterSpacing: '0.01em' });
  S(tag.box, { zIndex: 4 }); S(url.box, { zIndex: 4 });
  const G = {};
  LAYOUT.push(() => {
    const cx = document.createElement('canvas').getContext('2d'); cx.font = '700 230px Fredoka';
    G.wmW = cx.measureText('roviko').width; G.wmY = my + r + 70; G.tagY = G.wmY + 262; G.urlY = G.tagY + 66;
  });
  // b0: flood starts; origin [x, y] in screen px. opts: hop beats, blink beats, wink beat
  return { layer, update(t, b0, origin, { hops = [], blinks = [], wink = null } = {}) {
    const on = t >= T(b0);
    show(layer, on);
    if (!on) return;
    const cf = inv(T(b0), T(b0) + 0.4, t);
    const far = Math.max(...[[0, 0], [1080, 0], [0, 1920], [1080, 1920]].map(([x, y]) => Math.hypot(x - origin[0], y - origin[1]))) + 30;
    const cr = lerp(20, far, E.inOutSine(cf) * 0.35 + E.outCubic(cf) * 0.65);
    S(flood, { left: origin[0] - cr, top: origin[1] - cr, width: 2 * cr, height: 2 * cr });
    const g = spB(t, b0 + 0.25, 1.9, 0.55);
    const cy = lerp(my + 80, my, spB(t, b0 + 0.25, 2.2, 0.8));
    const scale = lerp(0.15, 1, g) * r / (100 * 600 / 340);
    S(box, { left: mx - 300, top: cy - 300, transform: `scale(${scale})`, transformOrigin: '300px 300px' });
    show(box, g > 0.001);
    const legs = spB(t, b0 + 0.45, 2.4, 0.6), armsIn = spB(t, b0 + 0.55, 2.4, 0.6);
    const waveAmt = spB(t, b0 + 0.9, 2, 0.7), wave = Math.sin((t - T(b0 + 0.9)) * 11) * (t > T(b0 + 0.9) ? 1 : 0);
    let hop = 0;
    for (const h of hops) if (t > T(h) && t < T(h) + 0.5) hop = -Math.sin(inv(T(h), T(h) + 0.4, t) * Math.PI) * 16;
    drawMascot(m, { blink: blinkAt(t, blinks), wink: wink == null ? 0 : segB(t, wink, wink + 0.1) * (1 - segB(t, wink + 0.9, wink + 1.0)),
      mouth: 'smile', cheeks: wink == null ? 0 : segB(t, wink, wink + 0.15), legs, hop,
      arms: armsIn > 0.02 ? [[-lerp(90, 118 + 6 * wave * waveAmt, armsIn), lerp(30, lerp(70, -86, waveAmt), armsIn), lerp(10, -18, waveAmt), 10 * armsIn], [lerp(90, 112, armsIn), lerp(30, 76, armsIn), 10, 10 * armsIn]] : null });
    const shw = r * 1.1 * legs;
    S(shadow, { left: mx - shw / 2, top: my + r + 72, width: shw, height: 16 }); show(shadow, legs > 0.05);
    const wp = segB(t, b0 + 0.6, b0 + 1.6, E.outCubic);
    S(wmMask, { top: my, height: (G.wmY - my) + wp * 290 });
    S(wm, { left: 540 - G.wmW / 2, top: (G.wmY - my) - (1 - wp) * 60 });
    show(wmMask, wp > 0);
    S(tag.box, { top: G.tagY }); S(url.box, { top: G.urlY });
    tag.set(segB(t, b0 + 1.3, b0 + 1.8, E.outQuint));
    url.set(segB(t, b0 + 1.7, b0 + 2.2, E.outQuint));
  } };
}

// ------------------------------------------------------------------ sound events (read by build/mix.py)
// t: seconds, the moment the effect's measured peak must land on. DIL comes from the short.
const EVENTS = [];
const ev = (b, sfx, gain = 0, extra = {}) => EVENTS.push(Object.assign({ t: +(T(b) / DIL).toFixed(4), beat: +b.toFixed(3), sfx, gain }, extra));

// ------------------------------------------------------------------ boot
function boot(seek, duration) {
  window.seek = seek;
  window.DURATION = duration;
  window.EVENTS = EVENTS;
  window.filmReady = (async () => {
    const fonts = ['500 20px Fredoka', '600 28px Fredoka', '700 40px Fredoka', '600 13px Manrope', '700 13px Manrope', '800 13px Manrope'];
    await Promise.all(fonts.map(f => document.fonts.load(f)));
    await document.fonts.ready;
    await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
    await paintHalos();
    LAYOUT.forEach(f => f());
    seek(+(Q.get('t') || 0));
    return true;
  })();
}
