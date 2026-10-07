/*
  Roviko short 19: "Me at 20:00: just ONE quick game"
  15.5 s, 1080x1920, 124 BPM ("Take this Higher", Mixkit, from song beat 38). A phone with a big clock. Roviko starts one
  quick game and every beat and a half another one ticks off: the Daily Detour, Rank Radar, World Duel, Side by Side, Country
  Mosaic, Clue Trail, the bonus tour, Survival… while the clock races from 20:00 to 02:47. Eye bags, a yawn: "ok… one more."
  "Tag the friend who always says 'one more game'."
*/
const TEMPO = 124.01, DIL = TEMPO / 130, END = 32, DURATION = END * 60 / TEMPO;
const GAMES = [['🧭', 'Daily Detour'], ['📡', 'Rank Radar'], ['⚔️', 'World Duel'], ['⚖️', 'Side by Side'], ['🧩', 'Country Mosaic'], ['🔎', 'Clue Trail'], ['🎁', 'Bonus tour'], ['🔥', 'Survival']];
const TL = { start: 1.2, rows: GAMES.map((_, i) => 2.4 + i * 1.6), late: 15.6, more: 17.4, cap2: 22.4, end: 26, hop: 30, blink2: 28.2 };
setupStage(C.cream);
const world = el(stage, { width: 1080, height: 1920, zIndex: 1 });
const uiL = el(stage, { width: 1080, height: 1920, zIndex: 20 });
const capL = el(stage, { width: 1080, height: 1920, zIndex: 50 });
Halo(world, 540, 900, 1700);
const ph = Phone(uiL, 470, 410, { tab: 0, time: '20:00', z: 6 });
S(ph.wrap, { transformOrigin: '684px 860px' });
const clock = el(ph.scr, { left: 0, top: 54, width: PH.w, textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 84, lineHeight: '100px', color: C.forest, zIndex: 5 }, '20:00');
const rows = GAMES.map(([e, n], i) => {
  const r = el(ph.scr, { left: 20, top: 168 + i * 78, width: PH.w - 40, height: 68, borderRadius: 22, background: C.white, zIndex: 5, transformOrigin: '50% 50%',
    boxShadow: '0 1px 2px rgba(22,59,50,.06), 0 8px 20px rgba(22,59,50,.08)' });
  el(r, { left: 12, top: 10, width: 48, height: 48, borderRadius: 24, background: C.mint, display: 'grid', placeItems: 'center', fontSize: 26 }, e);
  el(r, { left: 74, top: 0, height: 68, lineHeight: '68px', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 28, color: C.forest, whiteSpace: 'pre' }, n);
  const ck = el(r, { left: PH.w - 40 - 58, top: 12, width: 44, height: 44, borderRadius: 22, background: '#2FBF71', display: 'grid', placeItems: 'center', transformOrigin: '50% 50%' }, icon('check', 28, C.white, 3.4));
  return { r, ck };
});
const MX = 240, MY = 1250, MR = 96;
const mBox = el(uiL, { left: MX - MR * 1.7, top: MY - MR * 1.7, width: MR * 3.4, height: MR * 3.4, zIndex: 30 });
const mascot = Mascot(mBox, MR * 3.4); S(mascot.svg, { left: 0, top: 0 });
const more = Bubble(uiL, 'ok… one more 😵‍💫', { x: 90, y: 940, w: 400, size: 42, tail: 'down', tx: 140, z: 35 });
const cap1 = Caption(capL, ['Me at 20:00: “just', '<b>ONE</b> quick game” 😌'], { cy: 250, size: 60 });
const cap1b = Caption(capL, ['Me at <i>02:47</i>:'], { cy: 270, size: 66 });
const cap2 = Caption(capL, ['Tag the friend who always', 'says “one more game” 👇'], { cy: 250, size: 56 });
const endCard = EndCard(stage, { my: 690, tagline: 'Six games a day. Then stop. Maybe.' });
const START = 20 * 60, FINAL = 26 * 60 + 47;   // 20:00 -> 02:47 (+1 day)
const hhmm = m => { m = Math.round(m) % (24 * 60); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };

ev(0.02, 'pop', -12, { rate: 1.1 });
ev(TL.start, 'tap', -6);
TL.rows.forEach((b, i) => { ev(b, 'correct', -9, { rate: 1 + i * 0.05 }); ev(b + 0.3, 'coin', -12, { rate: 1 + i * 0.04 }); });
ev(TL.late, 'clock', -4); ev(TL.late + 0.3, 'thud', -8);
ev(TL.more + 0.05, 'mention', -7);
ev(TL.cap2 + 0.1, 'mention', -7);
ev(TL.end + 0.1, 'swoosh', -7); ev(TL.end + 0.35, 'sparkle', -7); ev(TL.end + 0.7, 'expand', -10);

function seek(tReal) {
  const t = clamp(tReal, 0, DURATION) * DIL, b = t / BEAT;
  HALOS[0].img.style.transform = `rotate(${20 + t * 14}deg)`;
  const mOut = segB(t, TL.end - 0.5, TL.end - 0.1, E.inBack);
  const pp = spB(t, -1.4, 2, 0.62) * (1 - mOut);
  S(ph.wrap, { transform: `scale(${pp}) rotate(${b >= TL.late ? Math.sin(t * 3) * 1.5 : 0}deg)` }); show(ph.wrap, pp > 0.001);
  const prog = segB(t, TL.start, TL.late, E.inQuad);
  const mins = lerp(START, FINAL, prog), txt = hhmm(mins);
  clock.textContent = txt; ph.clock.textContent = txt;
  S(clock, { color: mins > 24 * 60 ? C.red : C.forest });
  rows.forEach((r, i) => { const p = spB(t, TL.rows[i] - 0.5, 2.6, 0.6); S(r.r, { transform: `scale(${p})` }); show(r.r, p > 0.001);
    const c = spB(t, TL.rows[i], 3, 0.45); S(r.ck, { transform: `scale(${c})` }); show(r.ck, c > 0.001); });
  more.set(spB(t, TL.more, 2.4, 0.55), segB(t, TL.cap2 + 1, TL.cap2 + 1.3));
  // Roviko: fresh and happy, then more and more tired: eye bags, droopy lids, sweat, a yawn
  const tired = clamp((b - 6) / 9);
  const yawn = b >= TL.late + 0.3 && b < TL.more;
  drawMascot(mascot, { look: [0.8, -0.6], mouth: yawn ? 'o' : b >= TL.more ? 'wobble' : tired > 0.5 ? 'flat' : 'smile', eyesBig: yawn ? 0.3 : 0,
    blink: yawn ? 0.8 : Math.max(0.45 * tired, blinkAt(t, [4.4, 9.1])), sweat: b >= TL.late ? 1 : 0, legs: 1, hop: tired < 0.5 ? bop(b, 6) : 0,
    tilt: tired * Math.sin(t * 2) * 5, arms: yawn ? [[-30, 6, -30, 11], [112, 66, 22, 10]] : [[-112, 66, 22, 10], [104, -10 + Math.sin(t * 16) * 6 * (1 - tired), -20, 10]] });
  if (tired > 0) mascot.face.innerHTML += `<g fill="#7B6FB0" opacity="${(0.55 * tired).toFixed(2)}"><ellipse cx="${-30 + 3}" cy="11" rx="13" ry="4.5"/><ellipse cx="${31 + 3}" cy="11" rx="13" ry="4.5"/></g>`;
  cap1.set(spB(t, -1.5, 1.9, 0.62), segB(t, TL.late - 0.3, TL.late));
  cap1b.set(spB(t, TL.late, 1.9, 0.62), segB(t, TL.cap2 - 0.2, TL.cap2 + 0.15));
  cap2.set(spB(t, TL.cap2, 1.9, 0.62), segB(t, TL.end - 0.05, TL.end + 0.2));
  endCard.update(t, TL.end, [MX, MY], { hops: [TL.hop], blinks: [TL.blink2] });
}
boot(seek, DURATION);
