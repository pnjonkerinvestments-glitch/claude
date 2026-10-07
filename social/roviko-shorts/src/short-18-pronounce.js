/*
  Roviko short 18: "Countries you've been pronouncing wrong"
  15 s, 1080x1920, 120 BPM ("Funkee Monkeee", Mixkit, from song beat 32). Four countries, one every 4.4 beats: the flag and the
  name pop up, Roviko says it the way most people do (red, crossed out), then the real way lands in green.
  Kiribati = KIRR-i-bass, Lesotho = leh-SOO-too, Niger = nee-ZHAIR, Nauru = nah-OO-roo. "Which one did you say wrong?"
*/
const TEMPO = 120.384, DIL = TEMPO / 130, END = 30, DURATION = END * 60 / TEMPO;
const TL = { w: [-0.4, 4.0, 8.4, 12.8], bad: 1.0, good: 2.4, cap2: 18, end: 21.8, hop: 26, blink2: 24 };
setupStage(C.cream);
const world = el(stage, { width: 1080, height: 1920, zIndex: 1 });
const uiL = el(stage, { width: 1080, height: 1920, zIndex: 20 });
const capL = el(stage, { width: 1080, height: 1920, zIndex: 50 });
Halo(world, 540, 900, 1700);
const WORDS = [['ki', 'Kiribati', 'Kiri-BAH-tee', 'KIRR-i-bass'], ['ls', 'Lesotho', 'Leh-SO-tho', 'Leh-SOO-too'], ['ne', 'Niger', 'NYE-jer', 'Nee-ZHAIR'], ['nr', 'Nauru', 'NOR-oo', 'Nah-OO-roo']];
const items = WORDS.map(([fl, name, bad, good]) => {
  const g = el(uiL, { width: 1080, height: 1920, zIndex: 10, transformOrigin: '540px 760px' });
  const f = FlagCard(g, fl, 540, 560, 170);
  const nm = el(g, { left: 0, top: 690, width: 1080, textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 104, lineHeight: '120px', color: C.forest, transformOrigin: '50% 50%' }, name);
  const b1 = Tag(g, '❌  ' + bad, { bg: '#FBE0E1', fg: C.red, font: 'Fredoka', weight: 600, size: 54, h: 104, ls: '0', z: 12 });
  const b2 = Tag(g, '✅  ' + good, { bg: '#2FBF71', fg: C.white, font: 'Fredoka', weight: 600, size: 64, h: 120, ls: '0', z: 12 });
  centreX(b1, 870); centreX(b2, 1010);
  const strike = el(b1, { left: 80, top: 50, height: 6, borderRadius: 3, background: C.red, zIndex: 3 });
  LAYOUT.push(() => S(strike, { width: b1.getBoundingClientRect().width - 100 }));
  return { g, f, nm, b1, b2, strike };
});
const count = Tag(uiL, '1 / 4', { bg: C.forest, fg: C.white, size: 28, h: 58, z: 12 });
centreX(count, 390);
const MX = 220, MY = 1360, MR = 90;
const mBox = el(uiL, { left: MX - MR * 1.7, top: MY - MR * 1.7, width: MR * 3.4, height: MR * 3.4, zIndex: 30 });
const mascot = Mascot(mBox, MR * 3.4); S(mascot.svg, { left: 0, top: 0 });
const cap1 = Caption(capL, ['Countries you’ve been', 'pronouncing <i>wrong</i> 🗣️'], { cy: 236, size: 60 });
const cap2 = Caption(capL, ['Which one did <b>you</b>', 'say wrong? 👇'], { cy: 236, size: 60 });
const endCard = EndCard(stage, { my: 690, tagline: 'Know them. Say them right.' });

ev(0.02, 'pop', -12, { rate: 1.1 });
TL.w.forEach((b0, i) => { if (i) ev(b0, 'whoosh', -8); ev(Math.max(0.1, b0 + 0.2), 'pop', -8, { rate: 1 + i * 0.04 }); ev(b0 + TL.bad, 'error', -6, { rate: 1 + i * 0.05 }); ev(b0 + TL.good, 'correct', -5, { rate: 1 + i * 0.05 }); ev(b0 + TL.good + 0.1, 'sparkle', -10); });
ev(TL.cap2 + 0.1, 'mention', -7);
ev(TL.end + 0.1, 'swoosh', -7); ev(TL.end + 0.35, 'sparkle', -7); ev(TL.end + 0.7, 'expand', -10);

function seek(tReal) {
  const t = clamp(tReal, 0, DURATION) * DIL, b = t / BEAT;
  HALOS[0].img.style.transform = `rotate(${20 + t * 14}deg)`;
  let cur = 0;
  items.forEach((it, i) => {
    const b0 = TL.w[i], next = i < 3 ? TL.w[i + 1] - 0.3 : TL.cap2 + 1.2;
    if (b >= b0) cur = i;
    const out = segB(t, next, next + 0.3, E.inBack), g = spB(t, b0, 2.2, 0.62);
    show(it.g, g > 0.001 && out < 1); S(it.g, { transform: `translateX(${-out * 300}px) scale(${1 - out})` });
    S(it.f, { transform: `scale(${spB(t, b0 + 0.1, 2.6, 0.55)}) rotate(${-3 + Math.sin(t * 2) * 1.5}deg)` });
    S(it.nm, { transform: `scale(${spB(t, b0 + 0.3, 2.6, 0.55)})` });
    const p1 = spB(t, b0 + TL.bad, 2.6, 0.55), sh = b >= b0 + TL.bad && b < b0 + TL.bad + 0.6 ? Math.sin((t - T(b0 + TL.bad)) * 60) * 8 : 0;
    S(it.b1, { transform: `translateX(${sh}px) scale(${p1})` }); show(it.b1, p1 > 0.001);
    S(it.strike, { transformOrigin: '0 50%', transform: `scaleX(${segB(t, b0 + TL.bad + 0.3, b0 + TL.bad + 0.6, E.outCubic)})` });
    const p2 = spB(t, b0 + TL.good, 2.6, 0.5); S(it.b2, { transform: `scale(${p2}) rotate(${-2 * p2}deg)` }); show(it.b2, p2 > 0.001);
  });
  count.textContent = `${cur + 1} / 4`;
  const cp = spB(t, -1, 2.6, 0.55) * (1 - segB(t, TL.cap2 + 1.2, TL.cap2 + 1.5, E.inBack)); S(count, { transform: `scale(${cp})` }); show(count, cp > 0.001);
  const b0 = TL.w[cur], saying = b >= b0 + TL.bad - 0.2 && b < b0 + TL.good, learnt = b >= b0 + TL.good && b < b0 + TL.good + 1.5;
  drawMascot(mascot, { look: [0.7, -0.9], mouth: saying ? (Math.sin(t * 22) > 0 ? 'o' : 'open') : learnt ? 'o' : 'smile', eyesBig: learnt ? 0.45 : 0, brows: learnt ? 'up' : null,
    legs: 1, hop: bop(b, 5), blink: blinkAt(t, [3.1, 11.5, 19.2]),
    arms: saying ? [[-112, 40, 22, 10], [100, -30 + Math.sin(t * 14) * 10, -20, 10]] : learnt ? [[-92, -58, -30, 11], [92, -58, -30, 11]] : [[-112, 66, 22, 10], [112, 66, 22, 10]] });
  cap1.set(spB(t, -1.5, 1.9, 0.62), segB(t, TL.cap2 - 0.2, TL.cap2 + 0.15));
  cap2.set(spB(t, TL.cap2, 1.9, 0.62), segB(t, TL.end - 0.05, TL.end + 0.2));
  endCard.update(t, TL.end, [MX, MY], { hops: [TL.hop], blinks: [TL.blink2] });
}
boot(seek, DURATION);
