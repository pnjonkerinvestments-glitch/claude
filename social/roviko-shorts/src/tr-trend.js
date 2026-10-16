/*
  Roviko trend video 2: "We drew a trendline through all 195 capitals"
  20.2 s, 1080x1920, 119 BPM ("Light it Up Boy", Mixkit, from song beat 16). A world map, 195 capital dots pop in while a
  counter rolls to 195. Roviko is sure the line will be a diagonal; a drumroll, the line of best fit draws itself… flat at
  ~19°N (r = 0.01), straight through Mexico City. Then the "average capital" (18.8°N 21.8°E) drops into the Sahara, in Chad.
  "Name the capital of Chad." Capitals: Natural Earth, matched to roviko.app's 195 countries (social/roviko-trends).
*/
// @scripts lib/trendfilm.js ../roviko-trends/data/trends.js
const TEMPO = 118.998, DIL = TEMPO / 130, END = 40, DURATION = END * 60 / TEMPO;
const TL = { map: 0, dots: [0.8, 5.4], say: 6, roll: 8, line: [10, 12], flat: 12.2, mex: 14, r: 18, africa: 22, drop: 24.6, ask: 28, end: 32, hop: 36, blink2: 34 };
const TRD = TR.trend;
// world
const card1 = tcard(90, 420, 900, 470);
const B1 = { x: 110, y: 440, w: 860, h: 430 }, M1 = flatMap(B1, [-180, -58, 180, 83], { z: 10 });
const rnd = rng(7);
const dots = TR.caps.map(([id, name, lo, la]) => { const [x, y] = M1.pt(lo, la); const d = svgEl(M1.g, 'circle', { cx: x, cy: y, r: 6.5, fill: C.forest, stroke: '#fff', 'stroke-width': 1.6 });
  d.style.transformOrigin = `${x}px ${y}px`; return { d, id, x, y, at: lerp(TL.dots[0], TL.dots[1], rnd()) }; });
const [lx1, ly1] = M1.pt(-180, TRD.a - 180 * TRD.b), [lx2, ly2] = M1.pt(180, TRD.a + 180 * TRD.b);
const line = svgEl(M1.g, 'line', { x1: lx1, y1: ly1, x2: lx2, y2: ly2, stroke: C.red, 'stroke-width': 8, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1' });
const guess = svgEl(M1.g, 'line', { x1: B1.x + 60, y1: B1.y + B1.h - 50, x2: B1.x + B1.w - 60, y2: B1.y + 50, stroke: C.forest, 'stroke-width': 6, 'stroke-dasharray': '18 14', opacity: 0.55 });
const mex = dots.find(d => d.id === 'MEX');
const mexRing = svgEl(M1.g, 'circle', { cx: mex.x, cy: mex.y, r: 10, fill: 'none', stroke: C.gold, 'stroke-width': 6 });
const mexTag = pinLabel('🇲🇽 Mexico City', { size: 38 }); LAYOUT.push(() => S(mexTag, { left: mex.x - 40, top: mex.y - 92 }));
const count = Tag(uiL, '', { bg: C.forest, fg: C.white, font: 'Fredoka', weight: 600, size: 40, h: 80, ls: '0', z: 12 }); centreX(count, 930);
const flat = el(uiL, { left: 0, top: 920, width: 1080, textAlign: 'center', zIndex: 16, transformOrigin: '50% 50%' },
  `<span style="display:inline-block;padding:16px 34px;border-radius:30px;background:${C.red};color:#fff;font-family:Fredoka;font-weight:700;font-size:72px;box-shadow:0 16px 40px rgba(229,72,77,.4)">…it’s FLAT. 😐</span>`);
const rTag = el(uiL, { left: 0, top: 1060, width: 1080, textAlign: 'center', zIndex: 16, transformOrigin: '50% 50%' },
  `<span style="display:inline-block;padding:12px 26px;border-radius:24px;background:#fff;box-shadow:0 10px 24px rgba(22,59,50,.14);font-weight:800;font-size:32px;letter-spacing:.04em;color:${C.forest}">r = ${Math.abs(TRD.r).toFixed(2)} · explains NOTHING 😂</span>`);
// Africa
const card2 = tcard(90, 420, 900, 760);
const B2 = { x: 110, y: 440, w: 860, h: 720 }, M2 = flatMap(B2, [-20, -37, 57, 39], { z: 10 });
const [ax, ay] = M2.pt(TRD.mlon, TRD.mlat);
const halo = svgEl(M2.g, 'circle', { cx: ax, cy: ay, r: 60, fill: 'rgba(229,72,77,.18)' });
const avgDot = el(uiL, { left: ax - 18, top: ay - 18, width: 36, height: 36, borderRadius: 18, background: C.red, boxShadow: '0 0 0 7px #fff, 0 8px 18px rgba(22,59,50,.3)', zIndex: 14, transformOrigin: '50% 50%' });
const avgTag = pinLabel(`🇹🇩 Chad · ${TRD.mlat.toFixed(1)}°N ${TRD.mlon.toFixed(1)}°E`, { size: 36 }); LAYOUT.push(() => S(avgTag, { left: ax - 150, top: ay - 104 }));
const says = [['It’ll be a diagonal.<br>Trust me 📈', TL.say, TL.flat], ['THE MAP IS BROKEN 😭', TL.flat + 1, TL.mex + 2], ['the SAHARA?! 🐪', TL.drop + 1, TL.ask]]
  .map(([h, b0, b1]) => ({ bub: Bubble(uiL, h, { x: 370, y: 1250, w: 560, size: 42, tail: 'left', z: 35 }), b0, b1 }));
const caps = [
  [['We drew a trendline through', '<b>all 195 capitals</b> 📈'], -1.5, TL.mex],
  [['It goes straight through', '<b>Mexico City</b> 🇲🇽'], TL.mex, TL.africa],
  [['And the “average capital”?', 'In the <b>Sahara</b> 🏜️'], TL.africa, TL.ask],
  [['Name the capital', 'of Chad 👇 (no googling)'], TL.ask, TL.end],
].map(([lines, b0, b1]) => ({ c: Caption(capL, lines, { cy: 236, size: 54 }), b0, b1 }));
const endCard = EndCard(stage, { my: 690, tagline: 'Know your capitals. Every day.' });

// ---- sound
ev(0.02, 'pop', -12, { rate: 1.1 }); ev(0.2, 'swish', -10); ev(TL.dots[0] + 0.3, 'slot', -10);
for (let b = TL.dots[0]; b < TL.dots[1]; b += 0.5) ev(b, 'coin2', -16, { rate: 0.9 + (b - TL.dots[0]) * 0.06 });
ev(TL.dots[1], 'kaching', -9); ev(TL.say, 'slide', -8); ev(TL.say + 0.1, 'mention', -9);
ev(TL.roll, 'drumroll', -7); ev(TL.line[0], 'swish', -9);
ev(TL.flat, 'scratch', -4); ev(TL.flat + 0.05, 'boom', -4); ev(TL.flat + 1, 'mention', -9);
ev(TL.mex, 'pin', -7); ev(TL.mex + 0.2, 'kaching', -8); ev(TL.mex + 0.4, 'crowdcheer', -12);
ev(TL.r, 'pop', -8); ev(TL.r + 0.3, 'laugh', -10); ev(TL.r + 1, 'trombone', -8);
ev(TL.africa, 'swish', -7); ev(TL.africa + 0.3, 'expand', -9); ev(TL.drop, 'fallwhistle', -8); ev(TL.drop + 0.05, 'boom', -4); ev(TL.drop + 1, 'mention', -9);
ev(TL.ask, 'pop', -8); ev(TL.ask + 0.2, 'mention', -10);
ev(TL.end + 0.1, 'swoosh', -7); ev(TL.end + 0.35, 'sparkle', -7); ev(TL.end + 0.7, 'expand', -10);

function seek(tReal) {
  const t = clamp(tReal, 0, DURATION) * DIL, b = t / BEAT;
  HALOS[0].img.style.transform = `rotate(${20 + t * 14}deg)`;
  const w1 = popAt(card1, t, TL.map, TL.africa, 2.2, 0.62); S(M1.wrap, { transform: card1.style.transform, visibility: card1.style.visibility });
  popAt(card2, t, TL.africa + 0.2, TL.end + 0.5, 2.2, 0.62); S(M2.wrap, { transform: card2.style.transform, visibility: card2.style.visibility });
  let n = 0;
  for (const d of dots) { const p = spB(t, d.at, 3, 0.5); if (b >= d.at) n++; d.d.style.transform = `scale(${p})`; d.d.style.opacity = b >= TL.mex && d.id !== 'MEX' ? 0.55 : 1; }
  count.textContent = `${n} / 195 capitals`; popAt(count, t, TL.dots[0], TL.flat - 0.3);
  line.setAttribute('stroke-dashoffset', (1 - segB(t, TL.line[0], TL.line[1], E.inOutCubic)).toFixed(4));
  guess.style.opacity = (0.55 * segB(t, TL.say, TL.say + 0.4) * (1 - segB(t, TL.flat, TL.flat + 0.3))).toFixed(3);
  const fp = popAt(flat, t, TL.flat, TL.mex, 3, 0.4); if (fp > 0.001) S(flat, { transform: `scale(${fp}) rotate(${-4 * Math.min(1, fp)}deg)` });
  const mr = segB(t, TL.mex, TL.mex + 0.5, E.outCubic); mexRing.setAttribute('r', (10 + 26 * mr * (1 + 0.15 * Math.sin(t * 8))).toFixed(1)); mexRing.style.opacity = mr * (1 - segB(t, TL.africa - 0.3, TL.africa));
  popAt(mexTag, t, TL.mex + 0.1, TL.africa - 0.2);
  popAt(rTag, t, TL.r, TL.africa - 0.2);
  const dp = spB(t, TL.drop, 3, 0.4), fall = segB(t, TL.drop - 1.6, TL.drop, E.inQuad);
  S(avgDot, { transform: `translateY(${(1 - fall) * -500}px) scale(${b >= TL.drop ? dp : fall > 0 ? 1 : 0})`, visibility: fall > 0 && b < TL.end + 0.5 ? 'visible' : 'hidden' });
  halo.setAttribute('r', (60 * spB(t, TL.drop, 2, 0.5) * (1 + 0.1 * Math.sin(t * 6))).toFixed(1));
  popAt(avgTag, t, TL.drop + 0.4, TL.end + 0.4);
  says.forEach(s => s.bub.set(spB(t, s.b0, 2.4, 0.6), segB(t, s.b1, s.b1 + 0.3)));
  caps.forEach(c => c.c.set(spB(t, c.b0, 1.9, 0.62), segB(t, c.b1 - 0.2, c.b1 + 0.15)));
  const mood = b < TL.say ? 'calm' : b < TL.flat ? 'smug' : b < TL.mex + 2 ? 'shock' : b < TL.africa ? 'laugh' : b < TL.drop ? 'think' : b < TL.ask ? 'shock' : 'point';
  rovikoMood(t, b, mood, [3, 16.4, 21]);
  endCard.update(t, TL.end, [MX, MY], { hops: [TL.hop], blinks: [TL.blink2] });
}
boot(seek, DURATION);
