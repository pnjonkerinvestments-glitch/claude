/*
  Roviko TikTok ad: "Can you name this flag in 3 seconds?"
  31 s, 1080x1920, 60 fps, 124 BPM ("Take this Higher", Mixkit, from song beat 38). Real screens of roviko.app 1.34 (local copy,
  local test data only). The hook is an open loop: a flag almost nobody knows (Bhutan), with "answer at the end", so people stay.
  Then the whole app in quick beats: today's trip, the six daily games one by one (Daily Detour, Next Door with the continent
  map after a wrong answer, Rank Radar, World Duel, Side by Side, Size Shuffle, Clue Trail), the streak, multiplayer for up to
  12 friends, the weekly league and the passport. The loop closes: tap, "Bhutan", did you get it? Then "Stop scrolling. Start
  exploring." and the end card: Download Roviko in the App Store.
*/
const TEMPO = 124.01, DIL = TEMPO / 130, END = 64, DURATION = END * 60 / TEMPO;
// [screen, beat, tap {x, y} in screen px (390x844) or null, zoom {x, y, k, b0, b1} or null]
const STEPS = [
  ['hook-q', -1, null, { x: 195, y: 330, k: 1.22, b0: 0.2, b1: 2.6 }],
  ['home-trip', 6], ['detour-q', 9.5], ['border2-q', 12.5], ['border2-a', 14.2, { x: 195, y: 551 }],
  ['border2-map', 16, null, { x: 195, y: 480, k: 1.25, b0: 16.3, b1: 18.6 }],
  ['rank-reveal', 19.5], ['duel', 22], ['compare-a', 24.5], ['order', 27], ['trail', 29.5],
  ['finish', 32], ['mp-lobby', 35], ['mp-reveal', 37], ['mp-results', 39],
  ['leaderboard', 41.5], ['profile', 44.5], ['hook-q', 47.5], ['hook-a', 50, { x: 195, y: 626 }],
];
const CAPS = [
  [-1, ['Can you name this flag', 'in <b>3 seconds</b>? 🐉']],
  [4.2, ['Don’t know it?', 'This app fixes that 👀']],
  [6, ['A new geography trip', '<b>every day</b> 🌍']],
  [9.5, ['6 quick daily games:', '<b>Daily Detour</b> 🧭']],
  [12.5, ['<b>Next Door</b> 🏠']],
  [16, ['Wrong? You see', 'the <b>whole map</b> 🗺️']],
  [19.5, ['<b>Rank Radar</b> 📡']], [22, ['<b>World Duel</b> ⚔️']], [24.5, ['<b>Side by Side</b> ⚖️']],
  [27, ['<b>Size Shuffle</b> 📏']], [29.5, ['<b>Clue Trail</b> 🔎']],
  [32, ['Keep your <b>streak</b> alive 🔥']],
  [35, ['Play with up to', '<b>12 friends</b> 🎮']],
  [41.5, ['Climb the <b>weekly league</b> 🏆']],
  [44.5, ['Collect <b>every country</b> 🛂']],
  [47.5, ['So… which flag', 'was it? 🐉']],
  [50.4, ['<b>Bhutan</b> 🇧🇹', 'Did you get it?']],
  [53.4, ['Stop scrolling.', '<b>Start exploring.</b>']],
];
const GAMES = [[9.5, 1], [12.5, 2], [19.5, 3], [22, 4], [24.5, 5], [27, 6], [29.5, 6]];   // the counter pill (Size Shuffle and Clue Trail are both on the list; Next Door is part of the Detour)
const TL = { end: 56.2, hop: 60, blink2: 58.4, loopClose: 47.5 };
setupStage(C.cream);
const world = el(stage, { width: 1080, height: 1920, zIndex: 1 });
const uiL = el(stage, { width: 1080, height: 1920, zIndex: 20 });
const topL = el(stage, { width: 1080, height: 1920, zIndex: 40 });
const capL = el(stage, { width: 1080, height: 1920, zIndex: 50 });
Halo(world, 540, 900, 1700);
// the phone: 390x844 screens at 1.23x (480 x 1039)
const SW = 480, SH = 1039, PX = 300, PY = 372, K = SW / 390;
const phone = el(uiL, { left: PX - 14, top: PY - 14, width: SW + 28, height: SH + 28, borderRadius: 68, background: C.forest, zIndex: 5, transformOrigin: '50% 50%',
  boxShadow: '0 50px 90px rgba(22,59,50,.18), 0 14px 30px rgba(22,59,50,.14)' });
const scr = el(phone, { left: 14, top: 14, width: SW, height: SH, borderRadius: 56, overflow: 'hidden', background: C.cream });
const cam = el(scr, { left: 0, top: 0, width: SW, height: SH });
const shots = STEPS.map(([name], i) => el(cam, { left: 0, top: 0, width: SW, height: SH, zIndex: i + 1 }, `<img src="screens34/${name}.jpg" style="width:${SW}px;height:${SH}px;display:block">`));
const ptr = Pointer(uiL, 45);
// the open loop: "answer at the end" until the loop closes
const pillCss = (bg, fg) => ({ height: 56, borderRadius: 28, background: bg, color: fg, fontFamily: 'Manrope', fontWeight: 800, fontSize: 24, lineHeight: '56px', padding: '0 22px', letterSpacing: '0.07em', whiteSpace: 'pre', boxShadow: '0 8px 20px rgba(22,59,50,.14)', transformOrigin: '50% 50%', zIndex: 3 });
const loopPill = el(topL, pillCss(C.gold, C.forest), 'ANSWER AT THE END 👀');
const gamePill = el(topL, pillCss(C.forest, C.white), 'DAILY GAME 1/6');
LAYOUT.push(() => { S(loopPill, { left: 540 - loopPill.getBoundingClientRect().width / 2, top: 122 }); S(gamePill, { left: 540 - gamePill.getBoundingClientRect().width / 2, top: 122 }); });
const MX = 150, MY = 1335, MR = 74;
const mBox = el(uiL, { left: MX - MR * 1.7, top: MY - MR * 1.7, width: MR * 3.4, height: MR * 3.4, zIndex: 30 });
const mascot = Mascot(mBox, MR * 3.4); S(mascot.svg, { left: 0, top: 0 });
const caps = CAPS.map(([b, lines]) => ({ b, cap: Caption(capL, lines, { cy: 268, size: lines.length > 1 ? 54 : 60 }) }));
const endCard = EndCard(stage, { my: 690, tagline: 'Download Roviko in the App Store' });

// sound: a soft swoosh on every screen change, taps, the wrong answer, the reveal
ev(0.02, 'pop', -12, { rate: 1.1 });
STEPS.forEach(([, b, tap], i) => { if (!i) return; if (tap) { ev(b - 0.05, 'tap', -6); ev(b + 0.2, b > 40 ? 'correct' : 'error', b > 40 ? -4 : -7); } else ev(b, 'swoosh', -12, { rate: 1.05 + (i % 3) * 0.05 }); });
ev(32.3, 'streak', -7); ev(35.3, 'join', -7); ev(39.3, 'win', -8); ev(41.8, 'levelup', -9);
ev(50.3, 'sparkle', -6); ev(50.5, 'cheer', -9);
ev(53.5, 'mention', -8);
ev(TL.end + 0.1, 'swoosh', -7); ev(TL.end + 0.35, 'sparkle', -7); ev(TL.end + 0.7, 'expand', -10);

function seek(tReal) {
  const t = clamp(tReal, 0, DURATION) * DIL, b = t / BEAT;
  HALOS[0].img.style.transform = `rotate(${20 + t * 14}deg)`;
  const pOut = segB(t, TL.end - 0.5, TL.end - 0.1, E.inBack), pp = spB(t, -1.6, 2, 0.62) * (1 - pOut);
  S(phone, { transform: `scale(${pp})` }); show(phone, pp > 0.001);
  // screens: a circle wipe from the tap point, or a quick wipe from the right edge
  STEPS.forEach(([, b0, tap], i) => {
    if (!i) return;
    const o = tap ? [tap.x * K, tap.y * K] : [SW, SH * 0.45];
    const r = lerp(0, 1300, segB(t, b0, b0 + (tap ? 0.5 : 0.4), E.inOutCubic));
    S(shots[i], { clipPath: `circle(${r.toFixed(1)}px at ${o[0]}px ${o[1]}px)` }); show(shots[i], r > 0.5);
  });
  // camera punch-ins on the hook flag and the continent map
  let k = 1, zx = SW / 2, zy = SH / 2;
  for (let i = 0; i < STEPS.length; i++) { const z = STEPS[i][3], next = STEPS[i + 1]?.[1] ?? TL.end; if (z && b >= z.b0 - 0.01 && b < next) { k = lerp(1, z.k, segB(t, z.b0, z.b1, E.inOutCubic)); zx = z.x * K; zy = z.y * K; } }
  S(cam, { transformOrigin: `${zx}px ${zy}px`, transform: `scale(${k})` });
  // the pointer glides in a beat before each tap
  const tapStep = STEPS.find(s => s[2] && b >= s[1] - 1.2 && b < s[1] + 0.5);
  if (tapStep) {
    const [, b0, tap] = tapStep, to = [PX + tap.x * K, PY + tap.y * K];
    const p = pointerAt(t, { from: [to[0] + 170, to[1] + 260], to, b0: b0 - 1.1, b1: b0 - 0.1, tap: b0 - 0.05, gone: b0 + 0.3 });
    ptr.set(p.x, p.y, p.sc, t >= T(b0 - 0.05) ? T(b0 - 0.05) : null, t, to[0], to[1]);
  } else ptr.set(0, 0, 0, null, t);
  // pills: the open loop until it closes; the daily-game counter during the six games
  const lp = spB(t, -1.2, 2.4, 0.6) * (1 - segB(t, 9.2, 9.5, E.inBack)) + spB(t, TL.loopClose, 2.4, 0.6) * (1 - segB(t, 50.2, 50.5, E.inBack)) * (b >= TL.loopClose ? 1 : 0);
  S(loopPill, { transform: `scale(${clamp(lp, 0, 1.2) * (1 + 0.05 * Math.max(0, Math.sin(t * 7)))})` }); show(loopPill, lp > 0.001);
  const gi = GAMES.reduce((n, [gb, v]) => b >= gb ? v : n, 0), gp = spB(t, 9.6, 2.4, 0.6) * (1 - segB(t, 31.7, 32, E.inBack));
  gamePill.textContent = `DAILY GAME ${gi}/6`;
  S(gamePill, { transform: `scale(${clamp(gp, 0, 1.2)})` }); show(gamePill, gp > 0.001 && b >= 9.5);
  // captions: each holds until the next
  caps.forEach(({ b: b0, cap }, i) => { const nx = i + 1 < caps.length ? caps[i + 1].b : TL.end; cap.set(spB(t, b0 === -1 ? -1.5 : b0, 1.9, 0.62), segB(t, nx - 0.25, nx + 0.08)); });
  // Roviko: nervous at the hook, bouncing through the app, shocked at the wrong answer, cheering at Bhutan
  const hook = b < 6, wrong = b >= 14.2 && b < 16.5, thinking = b >= 47.5 && b < 50, cheer = b >= 50.2 && b < TL.end;
  drawMascot(mascot, { look: [0.9, -0.6], mouth: wrong ? 'o' : cheer ? 'grin' : hook || thinking ? 'wobble' : 'smile', brows: hook || thinking ? 'worried' : wrong ? 'up' : null,
    sweat: hook || thinking ? 1 : 0, eyesBig: wrong ? 0.4 : 0, happy: cheer ? 1 : 0, cheeks: cheer ? 0.8 : 0, legs: 1,
    hop: wrong || hook || thinking ? 0 : bop(b, cheer ? 12 : 6), blink: blinkAt(t, [3.4, 11.2, 20.6, 30.2, 43.1]),
    arms: cheer ? [[-118, -92, -22, 11], [118, -92, -22, 11]] : wrong ? [[-92, -58, -30, 11], [92, -58, -30, 11]] : thinking ? [[-112, 66, 22, 10], [60, -10, -20, 10]] : [[-112, 66, 22, 10], [112, 66, 22, 10]] });
  endCard.update(t, TL.end, [MX, MY], { hops: [TL.hop], blinks: [TL.blink2] });
}
boot(seek, DURATION);
