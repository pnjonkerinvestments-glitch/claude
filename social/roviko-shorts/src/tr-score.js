/*
  Roviko trend video 5: "What did you score today?" (like the Pindrop crowd posting their daily score)
  20.7 s, 1080x1920, 110 BPM ("Mi Gente", Mixkit, from song beat 24, so its drop lands on the score). The roviko.app share
  card builds up square by square, a drumroll, and on the drop the score slams to 900 / 1,000 with "Number 1 in the world
  today". Then: share yours in 3 taps, and Roviko's whole day (4,000 / 6,000) to beat. The scores are examples.
*/
// @scripts lib/trendfilm.js
const TEMPO = 110.002, DIL = TEMPO / 130, END = 38, DURATION = END * 60 / TEMPO;
const TL = { card: 0, sq: [1.2, 2, 2.8, 3.6, 4.4], roll: 6, drop: 8, rank: 9.4, steps: 14, day: 20, ask: 26, end: 28, hop: 32, blink2: 30 };
const ANS = [1, 1, 0, 1, 1];
// the share card
const share = tcard(220, 420, 640, 700);
const head = el(uiL, { left: 270, top: 460, width: 540, zIndex: 11 }, `<div style="display:flex;align-items:center;gap:14px"><img src="${ASSETS}roviko-globe.svg" style="width:56px;height:56px"><span style="font-family:Fredoka;font-weight:600;font-size:50px;color:${C.forest}">Roviko</span><span style="flex:1"></span><span style="padding:8px 20px;border-radius:999px;background:#FFF1D6;color:#B5701A;font-weight:800;font-size:28px">🔥 12</span></div>`);
const game = el(uiL, { left: 270, top: 560, zIndex: 11, fontWeight: 800, fontSize: 26, letterSpacing: '.12em', color: C.green }, 'DAILY DETOUR');
const squares = ANS.map((ok, i) => el(uiL, { left: 270 + i * 106, top: 612, width: 90, height: 90, borderRadius: 18, background: ok ? '#2FBF71' : C.red, zIndex: 11, transformOrigin: '50% 50%',
  boxShadow: '0 6px 14px rgba(22,59,50,.15)' }));
const score = el(uiL, { left: 270, top: 740, zIndex: 11, transformOrigin: '0 60%' }, `<span class="n" style="font-family:Fredoka;font-weight:700;font-size:150px;color:${C.forest};line-height:1"></span><span style="font-family:Fredoka;font-weight:500;font-size:48px;color:rgba(22,59,50,.5)"> / 1,000 pts</span>`);
const scoreN = score.querySelector('.n');
const rank = el(uiL, { left: 270, top: 940, width: 540, height: 96, borderRadius: 26, background: C.chip, zIndex: 11, transformOrigin: '50% 50%' },
  `<div style="display:flex;align-items:center;height:96px;padding:0 26px;font-family:Fredoka;font-weight:600;font-size:34px;white-space:nowrap;color:${C.forest}">🏆 Number 1 in the world today</div>`);
const flash = el(uiL, { left: 0, top: 0, width: 1080, height: 1920, background: '#fff', zIndex: 60, opacity: 0 });
// 3 taps
const stepCard = tcard(90, 420, 900, 620);
const STEPS = [['1', 'Play today’s trip', 'roviko.app · free, no account'], ['2', 'Tap Share', 'on your result screen'], ['3', 'Paste it in the comments', 'best score gets pinned 📌']].map(([n, a, s], i) =>
  el(uiL, { left: 140, top: 480 + i * 180, width: 800, zIndex: 11, transformOrigin: '0 50%' },
    `<div style="display:flex;align-items:center;gap:30px"><span style="width:110px;height:110px;border-radius:55px;background:${C.forest};color:#fff;display:grid;place-items:center;font-family:Fredoka;font-weight:600;font-size:56px;flex:none">${n}</span><div><div style="font-family:Fredoka;font-weight:600;font-size:52px;color:${C.forest}">${a}</div><div style="font-weight:700;font-size:30px;color:rgba(22,59,50,.55)">${s}</div></div></div>`));
// Roviko's day
const dayCard = tcard(90, 420, 900, 720);
const dayLab = el(uiL, { left: 140, top: 456, zIndex: 11, fontWeight: 800, fontSize: 26, letterSpacing: '.12em', color: C.green, whiteSpace: 'pre' }, 'ROVIKO’S DAY · ALL 6 GAMES');
const dayTot = el(uiL, { left: 140, top: 496, zIndex: 11 }, `<span class="n" style="font-family:Fredoka;font-weight:700;font-size:110px;color:${C.forest}"></span><span style="font-family:Fredoka;font-weight:500;font-size:44px;color:rgba(22,59,50,.5)"> / 6,000</span>`);
const dayN = dayTot.querySelector('.n');
const GAMES = [['Daily Detour', 820], ['World Duel', 640], ['Clue Trail', 900], ['Side by Side', 500], ['Size Shuffle', 760], ['Rank Radar', 380]];
const gRows = GAMES.map(([g, p], i) => {
  const y = 660 + i * 76;
  const r = el(uiL, { left: 140, top: y, width: 800, zIndex: 11 }, `<div style="display:flex;align-items:center;gap:20px"><span style="width:250px;font-weight:700;font-size:32px;color:${C.forest}">${g}</span><span style="flex:1;height:24px;border-radius:12px;background:#EEF2EF;position:relative;overflow:hidden"><span class="bar" style="position:absolute;left:0;top:0;bottom:0;width:${p / 10}%;background:${C.green};border-radius:12px;transform-origin:0 50%"></span></span><span class="v" style="width:90px;text-align:right;font-family:Fredoka;font-weight:600;font-size:36px;color:${C.forest}"></span></div>`);
  return { r, p, bar: r.querySelector('.bar'), val: r.querySelector('.v') };
});
const says = [['Beat THAT 😎', TL.rank + 0.6, TL.steps], ['Your turn 👇', TL.steps + 3, TL.day], ['4,000. Come at me 😤', TL.day + 3.6, TL.ask]]
  .map(([h, b0, b1]) => ({ bub: Bubble(uiL, h, { x: 370, y: 1250, w: 560, size: 42, tail: 'left', z: 35 }), b0, b1 }));
const caps = [
  [['What did you score', 'on <b>Roviko</b> today? 👇'], -1.5, TL.steps],
  [['Share yours', 'in <b>3 taps</b> 👇'], TL.steps, TL.day],
  [['Roviko’s whole day:', '<b>4,000</b>. Beat it 😎'], TL.day, TL.ask],
  [['Drop your score 👇', 'Best one gets pinned 📌'], TL.ask, TL.end],
].map(([lines, b0, b1]) => ({ c: Caption(capL, lines, { cy: 236, size: 54 }), b0, b1 }));
const endCard = EndCard(stage, { my: 690, tagline: 'Post your score. Every day.' });

// ---- sound
ev(0.02, 'pop', -12, { rate: 1.1 }); ev(0.2, 'swish', -10); ev(0.6, 'pop', -9);
TL.sq.forEach((b, i) => ANS[i] ? ev(b, 'coin2', -9, { rate: 1 + 0.08 * i }) : ev(b, 'error', -7));
ev(TL.roll, 'drumroll', -8);
ev(TL.drop, 'boom', -3); ev(TL.drop + 0.02, 'impactbig', -6); ev(TL.drop + 0.1, 'slot', -10); ev(TL.drop + 1, 'kaching', -7);
ev(TL.rank, 'fanfare', -8); ev(TL.rank + 0.2, 'crowdcheer', -9); ev(TL.rank + 0.6, 'slide', -8);
ev(TL.steps, 'swish', -8); [0.4, 1.4, 2.4].forEach((d, i) => { ev(TL.steps + d, 'pop', -8, { rate: 1 + 0.08 * i }); ev(TL.steps + d + 0.2, 'tap', -10); }); ev(TL.steps + 3, 'notify', -9);
ev(TL.day, 'swish', -8); ev(TL.day + 0.3, 'slot', -12); GAMES.forEach((_, i) => ev(TL.day + 0.6 + 0.4 * i, 'coin2', -12, { rate: 0.95 + 0.06 * i })); ev(TL.day + 3.4, 'kaching', -8); ev(TL.day + 3.6, 'mention', -9);
ev(TL.ask, 'pop', -8); ev(TL.ask + 0.2, 'mention', -10);
ev(TL.end + 0.1, 'swoosh', -7); ev(TL.end + 0.35, 'sparkle', -7); ev(TL.end + 0.7, 'expand', -10);

function seek(tReal) {
  const t = clamp(tReal, 0, DURATION) * DIL, b = t / BEAT;
  HALOS[0].img.style.transform = `rotate(${20 + t * 14}deg)`;
  const out1 = TL.steps - 0.3;
  const shake = b >= TL.drop && b < TL.drop + 0.6 ? Math.sin((t - T(TL.drop)) * 70) * 12 * (1 - inv(T(TL.drop), T(TL.drop + 0.6), t)) : 0;
  const sp = popAt(share, t, TL.card, out1, 2.2, 0.62); if (shake) S(share, { transform: `scale(${sp}) translate(${shake}px, ${-shake * 0.5}px)` });
  popAt(head, t, 0.4, out1); popAt(game, t, 0.6, out1);
  squares.forEach((q, i) => { const p = popAt(q, t, TL.sq[i], out1, 3, 0.45); if (p > 0.001) S(q, { transform: `scale(${p}) rotate(${(1 - Math.min(1, p)) * 30}deg)` }); });
  const scp = popAt(score, t, TL.drop, out1, 3.2, 0.35);
  scoreN.textContent = rollN(t, TL.drop, TL.drop + 1, 900);
  if (scp > 0.001) S(score, { transform: `scale(${scp}) translateX(${shake}px)` });
  const rk = popAt(rank, t, TL.rank, out1, 3, 0.45);
  S(flash, { opacity: (0.7 * (1 - inv(T(TL.drop), T(TL.drop) + 0.25, t)) * (b >= TL.drop ? 1 : 0)).toFixed(3) });
  const out2 = TL.day - 0.3;
  popAt(stepCard, t, TL.steps, out2, 2.2, 0.62);
  STEPS.forEach((s, i) => popAt(s, t, TL.steps + 0.4 + i, out2));
  popAt(dayCard, t, TL.day, TL.end + 0.5, 2.2, 0.62); popAt(dayLab, t, TL.day + 0.2, TL.end + 0.5); popAt(dayTot, t, TL.day + 0.3, TL.end + 0.5);
  let tot = 0;
  gRows.forEach((G, i) => {
    const b0 = TL.day + 0.6 + 0.4 * i; popAt(G.r, t, b0 - 0.3, TL.end + 0.5);
    const g = segB(t, b0, b0 + 1, E.outCubic); G.bar.style.transform = `scaleX(${g.toFixed(4)})`; G.val.textContent = Math.round(G.p * g); tot += G.p * g;
  });
  dayN.textContent = Math.round(tot).toLocaleString('en-US');
  says.forEach(s => s.bub.set(spB(t, s.b0, 2.4, 0.6), segB(t, s.b1, s.b1 + 0.3)));
  caps.forEach(c => c.c.set(spB(t, c.b0, 1.9, 0.62), segB(t, c.b1 - 0.2, c.b1 + 0.15)));
  const mood = b < TL.roll ? 'calm' : b < TL.drop ? 'think' : b < TL.rank ? 'shock' : b < TL.steps ? 'cool' : b < TL.day ? 'point' : b < TL.ask ? 'cool' : 'point';
  rovikoMood(t, b, mood, [3, 12.4, 18.6]);
  endCard.update(t, TL.end, [MX, MY], { hops: [TL.hop], blinks: [TL.blink2] });
}
boot(seek, DURATION);
