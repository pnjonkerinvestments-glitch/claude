/*
  Roviko short 15: "I drew Europe from memory"
  14.9 s, 1080x1920, 120 BPM ("Funkee Monkeee", Mixkit, from song beat 16). Roviko draws Europe from memory, one wobbly blob per
  beat and a half: a round UK, a square Spain, a France, a very long Italy, a noodle Norway, a "Germany-ish" and a scribble for
  the Balkans. "10/10, no notes." Then the real map slides in under his drawing. "…close enough." Rate my Europe 1-10.
*/
const TEMPO = 120.384, DIL = TEMPO / 130, END = 30, DURATION = END * 60 / TEMPO;
const TL = { draw: [-1.0, 1.5, 3.0, 4.5, 6.0, 7.5, 9.0], proud: 11, real: 13.4, close: 16, cap2: 19.6, end: 23.2, hop: 27, blink2: 25.4 };
setupStage(C.cream);
const world = el(stage, { width: 1080, height: 1920, zIndex: 1 });
const uiL = el(stage, { width: 1080, height: 1920, zIndex: 20 });
const capL = el(stage, { width: 1080, height: 1920, zIndex: 50 });
Halo(world, 540, 900, 1700);
const BOX = { x: 110, y: 420, w: 860, h: 780 };
const paper = el(uiL, { left: BOX.x - 14, top: BOX.y - 14, width: BOX.w + 28, height: BOX.h + 28, borderRadius: 54, background: C.white, zIndex: 3, transformOrigin: '50% 50%',
  boxShadow: '0 4px 10px rgba(22,59,50,.08), 0 30px 70px rgba(22,59,50,.18)' });
const real = WorldMap(uiL, { lon: 12, lat: 52, fit: ['PRT', 'NOR', 'GRC', 'FIN', 'IRL', 'ROU'], box: BOX, pad: 0.04, sea: '#BFE4F8', land: '#CFE9DA', z: 4 });
// the drawing: hand-made wobbly blobs (seeded noise), drawn on with a pen
const dsvg = svgEl(uiL, 'svg', { width: 1080, height: 1920 }); S(dsvg, { position: 'absolute', zIndex: 6 });
function blob(cx, cy, rx, ry, seed, n = 12, rot = 0) {
  const r = rng(seed), pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, k = 0.82 + r() * 0.36; const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
    pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); }
  let d = '';
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; d += (i ? '' : `M${((pts[n - 1][0] + p[0]) / 2).toFixed(1)} ${((pts[n - 1][1] + p[1]) / 2).toFixed(1)}`) + `Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`; }
  return d + 'Z';
}
const DRAW = [
  { d: blob(330, 690, 60, 60, 3), fill: '#FFD7A8', label: 'UK ⭕', lx: 330, ly: 600 },
  { d: blob(300, 1050, 105, 95, 7, 4, 0.1), fill: '#FFE9A8', label: 'Spain (a square)', lx: 300, ly: 1050 },
  { d: blob(420, 880, 85, 80, 11), fill: '#C9E2FF', label: 'France?', lx: 420, ly: 880 },
  { d: blob(640, 1040, 32, 170, 5, 12, -0.5), fill: '#BFEBD0', label: 'Italy (long boy)', lx: 700, ly: 1130 },
  { d: blob(640, 560, 22, 130, 9, 12, 0.6), fill: '#FFD0D2', label: 'Norway 🍝', lx: 570, ly: 500 },
  { d: blob(600, 820, 70, 70, 13), fill: '#E8DDFE', label: 'Germany-ish', lx: 620, ly: 820 },
  { d: 'M760 930c30 -40 60 20 40 40s-60 -30 -20 -60 70 10 50 50 -50 20 -30 -10 40 -40 60 -10', fill: 'none', label: '????', lx: 840, ly: 900 },
];
const strokes = DRAW.map(o => {
  const fillP = svgEl(dsvg, 'path', { d: o.d, fill: o.fill, opacity: 0.9 });
  const line = svgEl(dsvg, 'path', { d: o.d, fill: 'none', stroke: C.forest, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': '1 1' });
  const lab = el(uiL, { left: 0, top: 0, zIndex: 7, fontFamily: 'Fredoka', fontWeight: 500, fontSize: 34, color: C.forest, whiteSpace: 'pre', transformOrigin: '50% 50%' }, o.label);
  LAYOUT.push(() => { const r = lab.getBoundingClientRect(); S(lab, { left: o.lx - r.width / 2, top: o.ly - r.height / 2 }); });
  return { fillP, line, lab };
});
const pen = el(uiL, { width: 80, height: 80, zIndex: 9 }, `<svg width="80" height="80" viewBox="0 0 24 24"><path d="M3 21l3.5-1 11-11-2.5-2.5-11 11z" fill="${C.gold}" stroke="${C.forest}" stroke-width="1.6" stroke-linejoin="round"/><path d="M15 6.5l2.5 2.5 2-2a1.8 1.8 0 0 0-2.5-2.5z" fill="${C.red}" stroke="${C.forest}" stroke-width="1.6" stroke-linejoin="round"/></svg>`);
const realTag = Tag(uiL, 'Reality: 👇', { bg: C.forest, fg: C.white, font: 'Fredoka', weight: 600, size: 40, h: 80, ls: '0', z: 9 });
centreX(realTag, 1150);
const MX = 220, MY = 1360, MR = 92;
const mBox = el(uiL, { left: MX - MR * 1.7, top: MY - MR * 1.7, width: MR * 3.4, height: MR * 3.4, zIndex: 30 });
const mascot = Mascot(mBox, MR * 3.4); S(mascot.svg, { left: 0, top: 0 });
const proud = Bubble(uiL, '10/10, no notes 🎨', { x: 370, y: 1260, w: 500, size: 46, tail: 'left', z: 35 });
const close = Bubble(uiL, '…close enough 😅', { x: 370, y: 1260, w: 500, size: 46, tail: 'left', z: 35 });
const cap1 = Caption(capL, ['I drew <b>Europe</b>', 'from memory ✏️'], { cy: 250, size: 62 });
const cap2 = Caption(capL, ['Rate my Europe', '1 to 10 👇 (be nice)'], { cy: 250, size: 60 });
const endCard = EndCard(stage, { my: 690, tagline: 'Learn the real map. Every day.' });

ev(0.02, 'pop', -12, { rate: 1.1 });
TL.draw.forEach((b, i) => { ev(Math.max(0.1, b + 0.1), 'swoosh', -11, { rate: 1.2 + i * 0.05 }); ev(b + 1.0, 'pop', -12, { rate: 1 + i * 0.05 }); });
ev(TL.proud + 0.05, 'mention', -7); ev(TL.proud + 0.6, 'sparkle', -9);
ev(TL.real, 'whoosh', -6); ev(TL.real + 0.3, 'expand', -7); ev(TL.real + 0.9, 'pop', -8);
ev(TL.close + 0.05, 'error', -8, { rate: 0.8 }); ev(TL.close + 0.2, 'mention', -8);
ev(TL.cap2 + 0.1, 'mention', -7);
ev(TL.end + 0.1, 'swoosh', -7); ev(TL.end + 0.35, 'sparkle', -7); ev(TL.end + 0.7, 'expand', -10);

function seek(tReal) {
  const t = clamp(tReal, 0, DURATION) * DIL, b = t / BEAT;
  HALOS[0].img.style.transform = `rotate(${20 + t * 14}deg)`;
  const mOut = segB(t, TL.end - 0.5, TL.end - 0.1, E.inBack);
  const pp = spB(t, -1.6, 2, 0.62) * (1 - mOut); S(paper, { transform: `scale(${pp})` }); show(paper, pp > 0.001);
  // the real map slides up under the drawing
  const rp = segB(t, TL.real, TL.real + 0.8, E.outCubic);
  S(real.wrap, { transform: `translateY(${(1 - rp) * 900}px) scale(${1 - mOut})`, clipPath: `inset(0 0 ${Math.max(0, 1920 - BOX.y - BOX.h)}px 0)` }); show(real.wrap, rp > 0 && mOut < 1);
  S(dsvg, { transform: `scale(${1 - mOut})`, transformOrigin: '540px 810px' }); show(dsvg, mOut < 1);
  let penAt = null;
  strokes.forEach((s, i) => {
    const b0 = TL.draw[i], p = segB(t, b0, b0 + 1.1, E.inOutSine);
    s.line.setAttribute('stroke-dashoffset', (1 - p).toFixed(3)); s.line.style.display = p > 0 ? '' : 'none';
    const f = segB(t, b0 + 0.9, b0 + 1.2, E.outCubic); s.fillP.style.display = f > 0 ? '' : 'none'; s.fillP.setAttribute('opacity', (0.9 * f).toFixed(2));
    if (b >= b0 && b < b0 + 1.1) { const L = s.line.getTotalLength ? s.line : null; const pt = s.line.getPointAtLength(s.line.getTotalLength() * p); penAt = [pt.x, pt.y]; }
    const lp = spB(t, b0 + 1.0, 2.6, 0.55) * (1 - mOut); S(s.lab, { transform: `scale(${lp}) rotate(${(i % 2 ? 4 : -4) * lp}deg)` }); show(s.lab, lp > 0.001);
  });
  if (penAt) { S(pen, { left: penAt[0] - 8, top: penAt[1] - 72 }); show(pen, true); } else show(pen, false);
  const tp = spB(t, TL.real + 0.8, 2.6, 0.55) * (1 - mOut); S(realTag, { transform: `scale(${tp})` }); show(realTag, tp > 0.001);
  proud.set(spB(t, TL.proud, 2.4, 0.55), segB(t, TL.real - 0.2, TL.real + 0.1));
  close.set(spB(t, TL.close, 2.4, 0.55), segB(t, TL.cap2 + 1, TL.cap2 + 1.3));
  const drawing = b < TL.proud, isProud = b >= TL.proud && b < TL.real, shook = b >= TL.real && b < TL.close + 2;
  drawMascot(mascot, { look: drawing ? [0.8, -0.9] : shook ? [0.7, -0.9] : [0.4, -0.4], mouth: isProud ? 'grin' : shook ? (b < TL.close ? 'o' : 'wobble') : 'smile',
    happy: isProud ? 1 : 0, cheeks: isProud ? 1 : 0, eyesBig: b >= TL.real && b < TL.close ? 0.5 : 0, sweat: b >= TL.close && b < TL.cap2 + 1 ? 1 : 0, brows: shook && b >= TL.close ? 'worried' : null,
    legs: 1, hop: isProud ? bop(b, 10) : drawing ? bop(b, 4) : 0, blink: blinkAt(t, [8.2, 21]),
    arms: drawing ? [[-112, 66, 22, 10], [100, -40 + Math.sin(t * 20) * 8, -20, 10]] : isProud ? [[-90, -90, -30, 11], [90, -90, -30, 11]] : [[-112, 66, 22, 10], [60, -20, -20, 10]] });
  cap1.set(spB(t, -1.5, 1.9, 0.62), segB(t, TL.cap2 - 0.2, TL.cap2 + 0.15));
  cap2.set(spB(t, TL.cap2, 1.9, 0.62), segB(t, TL.end - 0.05, TL.end + 0.2));
  endCard.update(t, TL.end, [MX, MY], { hops: [TL.hop], blinks: [TL.blink2] });
}
boot(seek, DURATION);
