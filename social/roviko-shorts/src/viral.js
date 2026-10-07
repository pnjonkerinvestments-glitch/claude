/*
  Roviko: five "real app" films for roviko.app 1.24 (viral.html?v=1..5)
  1080x1920, 60 fps. A big phone shows real screens of roviko.app 1.24 (captured from the site at 390x844, light mode,
  local test data only). Screens change with a circle wipe from the tap, a round pointer taps the answers, and the
  camera punches in on what matters. Roviko stands next to the phone and reacts. A caption at the top carries the joke,
  the last one asks a question that is easy to answer in one comment; then the end card.
    1 tour: "This site makes you better at geography in 5 minutes a day"
    2 neighbours: "POV: you get it wrong and it shows you exactly where" (the 1.24 continent map)
    3 flags: "Guess the flag before I do (I'm bad at this)": a play-along, Roviko gets 1/4
    4 game night: "Game night idea: a geography battle" (room, round, reveal, podium)
    5 rank radar: "Where does Austria rank highest? I said forest. #52."
*/
const SONGS = { take: 124.01, funkee: 120.384, life: 119.998, aerobic: 110.01 };
// steps: [screen, beat, tap {x, y} in screen px (390x844) or null, zoom {x, y, k, b0, b1} or null]
const FILMS = {
  1: { song: 'take', end: 28.4, END: 34, steps: [
      ['home', -1], ['home-trip', 2.8], ['flag-q3', 5.4], ['flag-a3', 7.6, { x: 195, y: 612 }], ['border0-q', 10], ['border0-a', 11.8, { x: 195, y: 452 }],
      ['border0-map', 13.8, null, { x: 195, y: 540, k: 1.3, b0: 14.2, b1: 16.4 }], ['rank-reveal', 17], ['compare-a', 19.6, { x: 104, y: 386 }], ['mp-reveal', 22.2], ['finish', 24.8]],
    caps: [[-1, ['This site makes you better at', 'geography in <b>5 min a day</b> 🌍']], [5.4, ['Guess the flag 🏳️']], [10, ['Wrong? It shows you', 'the <b>whole map</b> 🗺️']],
      [17, ['6 tiny games a day 📡⚖️🧩']], [22.2, ['Up to <b>12 friends</b> 🎮']], [24.8, ['Keep your streak 🔥']]],
    says: [[12.2, 'oops 🙈'], [17.4, 'Rank Radar!'], [25.2, 'Day 1 🔥']], tagline: 'Free. No account needed.' },
  2: { song: 'funkee', end: 21, END: 28, steps: [
      ['border2-q', -1], ['border2-a', 4.4, { x: 195, y: 560 }], ['border2-map', 7.4, null, { x: 195, y: 470, k: 1.22, b0: 8.2, b1: 10.6 }]],
    caps: [[-1, ['POV: you get a geography', 'question <i>wrong</i>…']], [7.4, ['…and it shows you', '<b>exactly</b> where 🗺️']], [16.4, ['Name all <b>5</b> of', 'Bolivia’s neighbours 👇']]],
    says: [[2.4, 'Ivory Coast. Easy. 😎'], [5, 'wait what 😳'], [11.6, 'ohhh, THAT Paraguay 😅']], tagline: 'Wrong answers, finally explained.' },
  3: { song: 'life', end: 23.6, END: 30, steps: [
      ['flag-q', -1], ['flag-a0', 2.5, { x: 195, y: 484 }], ['flag-q1', 5], ['flag-a1', 7.5, { x: 195, y: 554 }], ['flag-q2', 10], ['flag-a2', 12.5, { x: 195, y: 554 }], ['flag-q3', 15], ['flag-a3', 17.5, { x: 195, y: 612 }]],
    caps: [[-1, ['Guess the flag <b>before I do</b> 🏳️', '(I’m bad at this)']], [20, ['Your score? <b>/4</b> 👇', '(beat my 1/4)']]],
    says: [[2.9, 'Canada?! 🙈'], [7.9, 'nooo 😭'], [12.9, 'Gabon AGAIN?!'], [17.9, 'FINALLY 🎉']], tagline: 'Flags, maps and capitals. Every day.' },
  4: { song: 'aerobic', end: 18.6, END: 26, steps: [
      ['mp-lobby', -1], ['mp-round', 3.6], ['mp-reveal', 6.4, { x: 195, y: 412 }], ['mp-results', 10]],
    caps: [[-1, ['Game night idea:', 'a <b>geography battle</b> 🎮']], [6.4, ['Everyone sees who', 'picked what 👀']], [10, ['Up to <b>12 friends</b>', '(or the computer 🤖)']], [14.6, ['Tag your game', 'night crew 👇']]],
    says: [[7, 'Monaco… 🙈'], [10.6, '3rd! 🥉']], tagline: 'Game night for up to 12 friends.' },
  5: { song: 'funkee', end: 16.6, END: 24, steps: [
      ['rank-q', -1], ['rank-picked', 3.6, { x: 195, y: 562 }], ['rank-reveal', 5.8, { x: 195, y: 826 }, { x: 230, y: 545, k: 1.3, b0: 6.4, b1: 8.4 }]],
    caps: [[-1, ['Where does <b>Austria</b> rank', 'highest in the world? 🇦🇹']], [6.2, ['I picked forest.', '<i>#52</i> 😭']], [12.4, ['What would <b>you</b>', 'pick for Austria? 👇']]],
    says: [[2.2, 'Forest. Obviously 🌲'], [7, '#52?!']], tagline: 'Rank Radar. A new country every day.' },
};
const V = Math.max(1, Math.min(5, +(Q.get('v') || 1))), F = FILMS[V];
const TEMPO = SONGS[F.song], DIL = TEMPO / 130, END = F.END, DURATION = END * 60 / TEMPO;
const TL = { end: F.end, hop: F.end + 3.6, blink2: F.end + 1.8 };
setupStage(C.cream);
const world = el(stage, { width: 1080, height: 1920, zIndex: 1 });
const uiL = el(stage, { width: 1080, height: 1920, zIndex: 20 });
const capL = el(stage, { width: 1080, height: 1920, zIndex: 50 });
Halo(world, 540, 900, 1700);
// the phone: 390x844 screens at 1.2x (468 x 1013)
const SW = 468, SH = 1013, PX = 300, PY = 380, K = SW / 390;
const phone = el(uiL, { left: PX - 14, top: PY - 14, width: SW + 28, height: SH + 28, borderRadius: 66, background: C.forest, zIndex: 5, transformOrigin: '50% 50%',
  boxShadow: '0 50px 90px rgba(22,59,50,.18), 0 14px 30px rgba(22,59,50,.14)' });
const scr = el(phone, { left: 14, top: 14, width: SW, height: SH, borderRadius: 54, overflow: 'hidden', background: C.cream });
const cam = el(scr, { left: 0, top: 0, width: SW, height: SH });
const shots = F.steps.map(([name], i) => el(cam, { left: 0, top: 0, width: SW, height: SH, zIndex: i + 1 }, `<img src="screens/${name}.jpg" style="width:${SW}px;height:${SH}px;display:block">`));
const ptr = Pointer(uiL, 40);
const MX = 160, MY = 1330, MR = 78;
const mBox = el(uiL, { left: MX - MR * 1.7, top: MY - MR * 1.7, width: MR * 3.4, height: MR * 3.4, zIndex: 30 });
const mascot = Mascot(mBox, MR * 3.4); S(mascot.svg, { left: 0, top: 0 });
const says = F.says.map(([b, txt]) => ({ b, bub: Bubble(uiL, txt, { x: 40, y: 1060, w: 300, size: 34, tail: 'down', tx: 120, z: 35 }) }));
const caps = F.caps.map(([b, lines]) => ({ b, cap: Caption(capL, lines, { cy: 250, size: lines.length > 1 ? 56 : 60 }) }));
const endCard = EndCard(stage, { my: 690, tagline: F.tagline });

ev(0.02, 'pop', -12, { rate: 1.1 });
F.steps.forEach(([, b, tap], i) => { if (!i) return; if (tap) { ev(b - 0.05, 'tap', -6); ev(b + 0.25, i % 2 ? 'correct' : 'pop', -9); } else ev(b, 'swoosh', -9, { rate: 1.1 }); if (F.steps[i][3]) ev(F.steps[i][3].b0, 'whoosh', -10); });
caps.forEach(({ b }, i) => { if (i) ev(b + 0.1, 'mention', -9); });
says.forEach(({ b }, i) => ev(b + 0.05, 'pop', -10, { rate: 0.95 + i * 0.07 }));
ev(TL.end + 0.1, 'swoosh', -7); ev(TL.end + 0.35, 'sparkle', -7); ev(TL.end + 0.7, 'expand', -10);

function seek(tReal) {
  const t = clamp(tReal, 0, DURATION) * DIL, b = t / BEAT;
  HALOS[0].img.style.transform = `rotate(${20 + t * 14}deg)`;
  const pOut = segB(t, TL.end - 0.5, TL.end - 0.1, E.inBack), pp = spB(t, -1.6, 2, 0.62) * (1 - pOut);
  S(phone, { transform: `scale(${pp})` }); show(phone, pp > 0.001);
  // screens: each one wipes in as a circle from its tap point (or from the right edge), the camera zooms on a step's focus
  let cur = 0;
  F.steps.forEach(([, b0, tap], i) => {
    if (b >= b0) cur = i;
    if (!i) return;
    const o = tap ? [tap.x * K, tap.y * K] : [SW, SH / 2];
    const r = lerp(0, 1300, segB(t, b0, b0 + 0.5, E.inOutCubic));
    S(shots[i], { clipPath: `circle(${r.toFixed(1)}px at ${o[0]}px ${o[1]}px)` }); show(shots[i], r > 0.5);
  });
  const zm = F.steps.map(s => s[3]).filter(Boolean).find(z => b >= z.b0 - 0.01 && b < (F.steps[F.steps.findIndex(s => s[3] === z) + 1]?.[1] ?? TL.end));
  let k = 1, zx = SW / 2, zy = SH / 2;
  if (zm) { const p = segB(t, zm.b0, zm.b1, E.inOutCubic); k = lerp(1, zm.k, p); zx = zm.x * K; zy = zm.y * K; }
  S(cam, { transformOrigin: `${zx}px ${zy}px`, transform: `scale(${k})` });
  // the pointer: glides to each tap a beat early, presses, leaves
  const nextTap = F.steps.map(s => s).find(s => s[2] && b >= s[1] - 1.2 && b < s[1] + 0.6);
  if (nextTap) {
    const [, b0, tap] = nextTap, to = [PX + tap.x * K, PY + tap.y * K];
    const p = pointerAt(t, { from: [to[0] + 160, to[1] + 260], to, b0: b0 - 1.1, b1: b0 - 0.1, tap: b0 - 0.05, gone: b0 + 0.3 });
    ptr.set(p.x, p.y, p.sc, t >= T(b0 - 0.05) ? T(b0 - 0.05) : null, t, to[0], to[1]);
  } else ptr.set(0, 0, 0, null, t);
  // captions: each holds until the next one
  caps.forEach(({ b: b0, cap }, i) => { const nx = i + 1 < caps.length ? caps[i + 1].b : TL.end; cap.set(spB(t, b0 === -1 ? -1.5 : b0, 1.9, 0.62), segB(t, nx - 0.25, nx + 0.1)); });
  says.forEach(({ b: b0, bub }, i) => { const nx = i + 1 < says.length ? Math.min(says[i + 1].b, b0 + 3) : Math.min(TL.end - 0.3, b0 + 3); bub.set(spB(t, b0, 2.4, 0.55), segB(t, nx - 0.3, nx)); });
  // Roviko: watches the phone, bounces on the beat, reacts when he talks
  const talking = says.find(s => b >= s.b && b < s.b + 1.4);
  const sad = talking && /🙈|😭|nooo|AGAIN|#52|what/.test(talking.bub.body.textContent), happy = talking && !sad;
  drawMascot(mascot, { look: [0.9, -0.6], mouth: sad ? 'o' : happy ? 'grin' : 'smile', eyesBig: sad ? 0.4 : 0, brows: sad ? 'up' : null, happy: happy ? 1 : 0, cheeks: happy ? 0.8 : 0,
    sweat: sad ? 1 : 0, legs: 1, hop: sad ? 0 : bop(b, happy ? 10 : 5), blink: blinkAt(t, [3.4, 9.2, 15.6]),
    arms: sad ? [[-92, -58, -30, 11], [92, -58, -30, 11]] : happy ? [[-118, -92, -22, 11], [118, -92, -22, 11]] : [[-112, 66, 22, 10], [112, 66, 22, 10]] });
  endCard.update(t, TL.end, [MX, MY], { hops: [TL.hop], blinks: [TL.blink2] });
}
boot(seek, DURATION);
