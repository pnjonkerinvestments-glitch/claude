/*
  Roviko short 16: "Which one is bigger?" (Roviko is very sure, every time)
  16.4 s, 1080x1920, 110 BPM ("Aerobic Fashion", Mixkit, from song beat 31). Three rounds, as in Roviko's Side by Side:
  Japan or Germany, Brazil or Australia, Mongolia or Iran. Roviko picks the "obvious" one with full confidence; the two
  shapes then spring up at true relative size with their areas, and he is wrong all three times. "Roviko: 0/3." Your score?
  Areas (roviko.app data): Japan 377,930 km², Germany 357,114; Brazil 8,515,767, Australia 7,692,024; Iran 1,648,195, Mongolia 1,564,110.
*/
const TEMPO = 110.01, DIL = TEMPO / 130, END = 30, DURATION = END * 60 / TEMPO;
const TL = { r: [-0.6, 6.6, 13.8], pick: 1.8, reveal: 3.6, score: 20.6, cap2: 21.6, end: 24.4, hop: 28, blink2: 26.4 };
setupStage(C.cream);
const world = el(stage, { width: 1080, height: 1920, zIndex: 1 });
const uiL = el(stage, { width: 1080, height: 1920, zIndex: 20 });
const capL = el(stage, { width: 1080, height: 1920, zIndex: 50 });
Halo(world, 540, 900, 1700);
const ROUNDS = [
  { a: ['JPN', 'jp', 'Japan', '377,930 km²'], b: ['DEU', 'de', 'Germany', '357,114 km²'], win: 0, pick: 1, say: 'Germany. Easy. 😎' },
  { a: ['BRA', 'br', 'Brazil', '8.52M km²'], b: ['AUS', 'au', 'Australia', '7.69M km²'], win: 0, pick: 1, say: 'Australia, it’s a continent!' },
  { a: ['MNG', 'mn', 'Mongolia', '1.56M km²'], b: ['IRN', 'ir', 'Iran', '1.65M km²'], win: 1, pick: 0, say: 'Mongolia. It’s HUGE. 🐎' },
];
// one equal-area projection per country, all at the same scale within a round
function shapePath(rings, lon0, lat0, cx, cy, s) {
  const P = laea(lon0, lat0);
  return rings.map(r => r.map(([lo, la], i) => { const [x, y] = P(lo, la); return (i ? 'L' : 'M') + (cx + s * x).toFixed(1) + ' ' + (cy + s * y).toFixed(1); }).join('') + 'Z').join('');
}
const ringsOf = id => geoCentre(id).near.flatMap(p => p);
const centreOf = id => { const pts = ringsOf(id).flat(); const b = bboxOf(pts); return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; };
const rounds = ROUNDS.map(R => {
  const g = el(uiL, { width: 1080, height: 1920, zIndex: 10, transformOrigin: '540px 800px' });
  const sides = [R.a, R.b].map(([id, fl, name, area], k) => {
    const x = k ? 760 : 300;
    const card = el(g, { left: x - 180, top: 420, width: 360, height: 150, borderRadius: 40, background: C.white, zIndex: 11, transformOrigin: '50% 50%', overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(22,59,50,.06), 0 16px 36px rgba(22,59,50,.16)' });
    const fill = el(card, { left: 0, top: 0, width: 360, height: 150, background: k === R.win ? '#2FBF71' : C.red });
    el(card, { left: 0, top: 0, width: 360, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', zIndex: 2 },
      `<img src="${FLAG_DIR}${fl}.svg" style="height:56px;border-radius:6px;box-shadow:0 0 0 3px #fff, 0 4px 10px rgba(0,0,0,.15)"><span class="nm" style="font-family:Fredoka;font-weight:600;font-size:40px">${name}</span>`);
    const nm = card.querySelector('.nm');
    const tag = Tag(g, area, { bg: C.forest, fg: C.white, font: 'Fredoka', weight: 600, size: 34, h: 66, ls: '0', z: 12 });
    LAYOUT.push(() => S(tag, { left: x - tag.getBoundingClientRect().width / 2, top: 1120 }));
    return { card, fill, nm, tag, x };
  });
  // true relative size: the bigger country fits a 400 x 440 box, the other uses the same scale
  const ids = [R.a[0], R.b[0]];
  const fits = ids.map(id => { const c = centreOf(id), P = laea(c[0], c[1]); const b = bboxOf(ringsOf(id).flat().map(([lo, la]) => P(lo, la))); return { c, w: b[2] - b[0], h: b[3] - b[1] }; });
  const s = Math.min(...fits.map(f => Math.min(380 / f.w, 440 / f.h)));
  const svg = svgEl(g, 'svg', { width: 1080, height: 1920 }); S(svg, { position: 'absolute', zIndex: 10 });
  const shapes = ids.map((id, k) => { const e = svgEl(svg, 'path', { d: shapePath(ringsOf(id), fits[k].c[0], fits[k].c[1], k ? 760 : 300, 850, s), fill: k === R.win ? '#2FBF71' : '#F7B7B2', stroke: C.forest, 'stroke-width': 4, 'stroke-linejoin': 'round' });
    e.style.transformOrigin = `${k ? 760 : 300}px 850px`; return e; });
  const vs = el(g, { left: 490, top: 455, width: 80, height: 80, borderRadius: 40, background: C.gold, color: C.forest, fontFamily: 'Fredoka', fontWeight: 600, fontSize: 30, lineHeight: '80px', textAlign: 'center', zIndex: 13, transformOrigin: '50% 50%' }, 'vs');
  return { g, sides, shapes, vs, R };
});
const qTag = Tag(uiL, 'Which one is BIGGER?', { bg: C.forest, fg: C.white, font: 'Fredoka', weight: 600, size: 36, h: 72, ls: '0', z: 12 });
centreX(qTag, 330);
const score = Tag(uiL, 'Roviko: 0 / 3 😭', { bg: C.red, fg: C.white, font: 'Fredoka', weight: 600, size: 56, h: 110, ls: '0', z: 14 });
centreX(score, 760);
const MX = 220, MY = 1370, MR = 92;
const mBox = el(uiL, { left: MX - MR * 1.7, top: MY - MR * 1.7, width: MR * 3.4, height: MR * 3.4, zIndex: 30 });
const mascot = Mascot(mBox, MR * 3.4); S(mascot.svg, { left: 0, top: 0 });
const says = ROUNDS.map(R => Bubble(uiL, R.say, { x: 370, y: 1270, w: 540, size: 42, tail: 'left', z: 35 }));
const cap1 = Caption(capL, ['Roviko is <b>very</b> sure', 'which one is bigger 😎'], { cy: 236, size: 58 });
const cap2 = Caption(capL, ['Did you beat Roviko?', 'Comment your score <b>/3</b> 👇'], { cy: 236, size: 58 });
const endCard = EndCard(stage, { my: 690, tagline: 'Play Side by Side. Every day.' });

ev(0.02, 'pop', -12, { rate: 1.1 });
TL.r.forEach((b0, i) => {
  if (i) { ev(b0, 'whoosh', -8); ev(b0 + 0.2, 'pop', -8); ev(b0 + 0.4, 'pop', -8, { rate: 1.1 }); }
  ev(b0 + TL.pick, 'mention', -7); ev(b0 + TL.pick + 0.6, 'lock', -8);
  ev(b0 + TL.reveal, 'expand', -7); ev(b0 + TL.reveal + 0.5, 'correct', -6); ev(b0 + TL.reveal + 0.6, 'error', -7, { rate: 0.9 + i * 0.06 });
});
ev(TL.score, 'impact', -5); ev(TL.score + 0.3, 'boing', -7, { rate: 0.8 });
ev(TL.cap2 + 0.1, 'mention', -7);
ev(TL.end + 0.1, 'swoosh', -7); ev(TL.end + 0.35, 'sparkle', -7); ev(TL.end + 0.7, 'expand', -10);

function seek(tReal) {
  const t = clamp(tReal, 0, DURATION) * DIL, b = t / BEAT;
  HALOS[0].img.style.transform = `rotate(${20 + t * 14}deg)`;
  let cur = 0;
  rounds.forEach((r, i) => {
    const b0 = TL.r[i], next = i < 2 ? TL.r[i + 1] - 0.3 : TL.score - 0.3;
    if (b >= b0) cur = i;
    const out = segB(t, next, next + 0.3, E.inBack), g = spB(t, b0, 2.2, 0.62);
    show(r.g, g > 0.001 && out < 1); S(r.g, { transform: `translateX(${-out * 300}px) scale(${1 - out})` });
    r.sides.forEach((s, k) => {
      const p = spB(t, b0 + 0.2 * k, 2.4, 0.6), picked = k === r.R.pick && b >= b0 + TL.pick + 0.6;
      const press = picked ? 1 - 0.06 * Math.exp(-(t - T(b0 + TL.pick + 0.6)) * 10) : 1;
      S(s.card, { transform: `scale(${p * press})`, boxShadow: picked ? `0 0 0 8px ${C.gold}, 0 16px 36px rgba(22,59,50,.16)` : '0 2px 4px rgba(22,59,50,.06), 0 16px 36px rgba(22,59,50,.16)' });
      const fr = lerp(0, 460, segB(t, b0 + TL.reveal + 0.5, b0 + TL.reveal + 1.0, E.outCubic));
      S(s.fill, { clipPath: `circle(${fr.toFixed(1)}px at 50% 50%)` }); show(s.fill, fr > 0.5); S(s.nm, { color: fr > 120 ? C.white : C.forest });
      const sp = spB(t, b0 + TL.reveal + 0.1 * k, 2.4, 0.55); S(r.shapes[k], { transform: `scale(${sp})` }); r.shapes[k].style.display = sp > 0.001 ? '' : 'none';
      const tp = spB(t, b0 + TL.reveal + 0.4 + 0.1 * k, 2.6, 0.55); S(s.tag, { transform: `scale(${tp})` }); show(s.tag, tp > 0.001);
    });
    const v = spB(t, b0 + 0.5, 3, 0.5); S(r.vs, { transform: `scale(${v})` });
    says[i].set(spB(t, b0 + TL.pick, 2.4, 0.6), segB(t, b0 + TL.reveal + 1.4, b0 + TL.reveal + 1.7));
  });
  const qp = spB(t, -1, 2.6, 0.55) * (1 - segB(t, TL.score - 0.3, TL.score, E.inBack)); S(qTag, { transform: `scale(${qp})` }); show(qTag, qp > 0.001);
  const sc = spB(t, TL.score, 2.6, 0.45) * (1 - segB(t, TL.end - 0.4, TL.end - 0.1, E.inBack)); S(score, { transform: `scale(${sc}) rotate(${-4 * sc}deg)` }); show(score, sc > 0.001);
  // Roviko: smug when he picks, shocked when he's wrong, crying at 0/3, then laughing it off
  const r0 = TL.r[cur], sinceRev = b - (r0 + TL.reveal);
  const smug = b >= r0 + TL.pick && b < r0 + TL.reveal, shocked = sinceRev >= 0.5 && sinceRev < 2.6 && b < TL.score, sad = b >= TL.score && b < TL.cap2 + 1.5;
  drawMascot(mascot, { look: smug ? [0.6, -0.6] : shocked ? [0, 0] : [0.7, -0.9], mouth: smug ? 'smile' : shocked ? 'o' : sad ? 'frown' : b >= TL.cap2 + 1.5 ? 'grin' : 'smile',
    brow: smug ? 1 : 0, brows: sad ? 'worried' : shocked ? 'up' : null, eyesBig: shocked ? 0.5 : 0, sweat: shocked || sad ? 1 : 0, legs: 1,
    shades: { on: smug ? segB(t, r0 + TL.pick, r0 + TL.pick + 0.3) : 0, drop: 0 },
    hop: smug ? bop(b, 8) : shocked || sad ? 0 : bop(b, 5), blink: blinkAt(t, [5.2, 12.4, 23.4]), cheeks: b >= TL.cap2 + 1.5 ? 0.7 : 0,
    arms: smug ? [[-90, 40, 30, 10], [90, 40, -30, 10]] : shocked ? [[-92, -58, -30, 11], [92, -58, -30, 11]] : sad ? [[-34, -6, -30, 11], [34, -6, -30, 11]] : [[-112, 66, 22, 10], [112, 66, 22, 10]] });
  cap1.set(spB(t, -1.5, 1.9, 0.62), segB(t, TL.cap2 - 0.2, TL.cap2 + 0.15));
  cap2.set(spB(t, TL.cap2, 1.9, 0.62), segB(t, TL.end - 0.05, TL.end + 0.2));
  endCard.update(t, TL.end, [MX, MY], { hops: [TL.hop], blinks: [TL.blink2] });
}
boot(seek, DURATION);
