/*
  Roviko: five TikTok films for roviko.app 1.31 (tt.html?v=1..5)
  1080x1920, 60 fps. A big phone shows real screens of roviko.app 1.31 (captured at 390x844 @2x from a local copy of the
  site, local test data only, never the live database). Screens change with a circle wipe from the tap, a round pointer
  taps, the camera punches in or scrolls. Roviko stands next to the phone and reacts. The caption carries the hook from
  frame 1 and the last caption asks for one easy comment; then the end card.
    1 doomscroll: "You scrolled for 3 hours today. Name ONE thing you learned."  (learning instead of scrolling)
    2 rage bait: "Put these in order by size": China beats the USA in Roviko's atlas
    3 alien: "When an alien invites you to a geography battle" (Lucia 👽, friend code CAFE1C1A)
    4 day 1 vs day 30: "POV: you swapped doomscrolling for Roviko for 30 days"  (learning instead of scrolling)
    5 play-along: "Guess the country before clue 4" (Clue Trail, Mongolia)
*/
const SONGS = { take: 124.01, funkee: 120.384, life: 119.998, aerobic: 110.01 };
// steps: [screen, beat, tap {x, y} in screen px (390x844) or null, zoom {x, y, k, b0, b1} or null, pan {to, b0, b1} (px down the tall image) or null]
const FILMS = {
  1: { song: 'take', end: 30.4, END: 36, steps: [
      ['feed', -1], ['detour-q0', 5.2, null, { x: 195, y: 300, k: 1.15, b0: 5.6, b1: 6.6 }], ['detour-a0', 7.6, { x: 195, y: 550 }], ['detour-q7', 10], ['detour-a7', 12, { x: 195, y: 510 }],
      ['finish', 14.4, null, { x: 195, y: 500, k: 1.32, b0: 15.4, b1: 17.2 }], ['finish', 19.6, { x: 195, y: 712 }]],
    caps: [[-1, ['You scrolled for <i>3 hours</i> today.', 'Name <b>ONE</b> thing you learned 👇']], [5.2, ['Same phone.', '<b>5 minutes</b> of Roviko:']],
      [14.4, ['Brain: 📈', 'Rank: <b>#3 of 413</b> today 🌍']], [19.6, ['Then make your friends', '<b>jealous</b> 😏']], [25.6, ['Swap ONE scroll session.', 'Comment <b>“done”</b> 👇']]],
    says: [[2.2, 'uhh… a cat video? 🫠', 'zombie'], [8, 'Canada! 🇨🇦', 'happy'], [12.4, 'San José 🧠', 'happy'], [16, 'WORLD CLASS?! 🤩', 'happy']],
    share: { b: 20.4, lines: ['Roviko scored <b>958/1,000</b> in', 'Daily Detour 🌍', '🏆 <b>#3 of 413</b> players worldwide today', 'Can you beat that? 👀'] },
    tagline: '5 minutes a day beats 3 hours of scrolling.' },
  2: { song: 'funkee', end: 22.6, END: 29, steps: [
      ['order-q', -1, null, { x: 195, y: 330, k: 1.2, b0: 0.4, b1: 1.4 }], ['order-a-full', 4.6, { x: 195, y: 657 }, null, { to: 330, b0: 9.6, b1: 11.6 }]],
    caps: [[-1, ['Put these in order <b>by size</b>.', 'Bet you get it wrong 😏']], [5.2, ['China is <i>bigger</i>', 'than the USA?! 😳']],
      [11.6, ['China 9.71M km² · USA 9.37M km²', '<i>Americans</i>, explain 👇']], [17.4, ['Today’s Size Shuffle is live.', 'Play it, then argue 👇']]],
    says: [[1.8, 'USA #2. Obviously 😎', 'cool'], [6.2, 'WAIT WHAT 😳', 'shock'], [13.4, 'the lakes?! the LAKES? 🌊', 'sad']],
    tagline: 'Size Shuffle. New countries every day.' },
  3: { song: 'life', end: 26.4, END: 33, steps: [
      ['invite', -1], ['lf-q0', 4, { x: 342, y: 73 }], ['lf-r0', 7, null, { x: 195, y: 330, k: 1.18, b0: 7.6, b1: 8.6 }], ['lf-r1-full', 12.2, null, null, { to: 300, b0: 13, b1: 14.6 }], ['lf-results', 16.6], ['lf-results', 20.6, { x: 195, y: 709 }]],
    caps: [[-1, ['When an <b>alien</b> invites you', 'to a geography battle 👽']], [7, ['She knew the <b>Bahamas</b>.', 'I said Jamaica 💀']],
      [12.2, ['Round 2. Same thing.', '<i>Lucia 👽 2 · Me 0</i>']], [16.6, ['Lost to an alien.', '<i>2nd of 2</i> 🥲']], [21.6, ['Add her if you dare:', 'friend code <b>CAFE1C1A</b> 👽']]],
    says: [[1.8, 'lol, easy win 😎', 'cool'], [8.4, 'she’s… good?? 😳', 'shock'], [13.8, 'nooo 😭', 'sad'], [18.2, 'rematch. NOW. 😤', 'angry']],
    tagline: 'Lucia 👽 is always up for a match.' },
  4: { song: 'aerobic', end: 24.6, END: 31, stamps: [[-1, 'DAY 1', 8.6], [8.6, 'DAY 30 🔥', 24.4]], steps: [
      ['detour-q3', -1], ['detour-a3-full', 3.2, null, { x: 195, y: 470, k: 1.18, b0: 3.8, b1: 5.6 }], ['detour-q7', 8.6], ['detour-a7', 10.6, { x: 195, y: 510 }],
      ['finish', 14, null, { x: 195, y: 500, k: 1.3, b0: 14.6, b1: 16.4 }]],
    caps: [[-1, ['POV: you swapped doomscrolling', 'for Roviko for <b>30 days</b>']], [3.2, ['Day 1: where is <i>Suriname</i>?!', '(not in Africa btw)']],
      [8.6, ['Day 30: capitals', '<b>first try</b> 😎']], [14, ['Day 30: <b>#3 of 413</b>', 'players worldwide 🌍']], [18.6, ['600 questions later.', 'Your brain says thanks 🧠']], [21.6, ['Your day 1 is today.', 'Comment <b>“day 1”</b> 👇']]],
    says: [[1.6, 'Africa? 🙈', 'sad'], [11, 'San José. Easy 😎', 'cool'], [15, 'who even am I 🤓', 'happy']],
    tagline: 'Learn something real. 5 minutes a day.' },
  5: { song: 'funkee', end: 22.6, END: 29, steps: [
      ['trail-1', -1], ['trail-2', 4, { x: 195, y: 527 }], ['trail-3', 8, { x: 195, y: 527 }], ['trail-4', 12, { x: 195, y: 527 }], ['trail-a', 15.4, { x: 195, y: 759 }]],
    caps: [[-1, ['Guess the country', '<b>before clue 4</b> 🕵️']], [4, ['Clue 2: only <b>2</b> neighbours 🤔']], [8, ['Clue 3: borders <b>Russia</b> 👀']],
      [12, ['Last chance… 🏳️']], [15.4, ['<b>Mongolia</b> 🇲🇳', 'Which clue got you? 👇']], [19.4, ['A new mystery country', 'every day. Fewer clues, <b>more points</b>.']]],
    says: [[1.8, 'Japan? 🗾', 'cool'], [5.6, 'Nepal? Bhutan?? 😵', 'shock'], [9.6, 'OHHH 💡', 'happy'], [16, 'knew it 😎', 'cool']],
    tagline: 'Clue Trail. A new mystery country every day.' },
};
const V = Math.max(1, Math.min(5, +(Q.get('v') || 1))), F = FILMS[V];
const TEMPO = SONGS[F.song], DIL = TEMPO / 130, END = F.END, DURATION = END * 60 / TEMPO;
const TL = { end: F.end, hop: F.end + 3.6, blink2: F.end + 1.8 };
setupStage(C.cream);
const world = el(stage, { width: 1080, height: 1920, zIndex: 1 });
const uiL = el(stage, { width: 1080, height: 1920, zIndex: 20 });
const capL = el(stage, { width: 1080, height: 1920, zIndex: 50 });
Halo(world, 540, 900, 1700);
// the phone: 390x844 screens at 1.44x (560 x 1212); images are @2x captures, shown at 1.2x
const SW = 560, SH = 1212, PX = 270, PY = 384, K = SW / 390;
const phone = el(uiL, { left: PX - 14, top: PY - 14, width: SW + 28, height: SH + 28, borderRadius: 66, background: C.forest, zIndex: 5, transformOrigin: '50% 50%',
  boxShadow: '0 50px 90px rgba(22,59,50,.18), 0 14px 30px rgba(22,59,50,.14)' });
const scr = el(phone, { left: 14, top: 14, width: SW, height: SH, borderRadius: 54, overflow: 'hidden', background: C.cream });
const cam = el(scr, { left: 0, top: 0, width: SW, height: SH });
// a screen is a captured image, or the doomscroll feed (film 1)
const FEED = [['#FF8FA3', '😹', 'cat vs cucumber (part 7)'], ['#7CC6FE', '🫠', 'POV: it’s Monday again'], ['#FFD166', '🍝', 'rating gas station pasta'],
  ['#B8F2E6', '💅', '5 am routine nobody asked for'], ['#CDB4DB', '🤡', 'he said WHAT 😭'], ['#F4A261', '🐸', 'frog does a flip (slowmo)'], ['#90E0EF', '📦', 'unboxing an empty box']];
function Feed(parent) {
  const box = el(parent, { left: 0, top: 0, width: SW, height: SH, background: '#101418', overflow: 'hidden' });
  const strip = el(box, { left: 0, top: 0, width: SW });
  const cards = [];
  for (let i = 0; i < 21; i++) {
    const [bg, emo, txt] = FEED[i % FEED.length];
    const c = el(strip, { left: 0, top: i * SH, width: SW, height: SH, background: `linear-gradient(160deg, ${bg}, #101418 92%)` });
    el(c, { left: 0, top: 300, width: SW, textAlign: 'center', fontSize: 190 }, emo);
    el(c, { left: 34, top: SH - 210, width: SW - 120, fontFamily: 'Manrope', fontWeight: 800, fontSize: 30, color: '#fff', lineHeight: '38px' }, txt);
    el(c, { left: 34, top: SH - 130, width: SW - 140, height: 14, borderRadius: 7, background: 'rgba(255,255,255,.35)' });
    el(c, { left: 34, top: SH - 100, width: SW - 220, height: 14, borderRadius: 7, background: 'rgba(255,255,255,.25)' });
    el(c, { left: SW - 82, top: SH - 330, width: 60, textAlign: 'center', fontFamily: 'Manrope', fontWeight: 800, fontSize: 22, color: '#fff', lineHeight: '30px' }, '♥<br>2.1M<br><br>💬<br>48K');
    cards.push(c);
  }
  return { box, set(t) {
    // flick, flick, flick: each card holds a moment, then snaps up; faster and faster
    const tt = Math.max(0, t), per = Math.max(0.42, 0.95 - tt * 0.09);
    let pos = 0, acc = 0;
    while (acc + per <= tt && pos < 19) { acc += per; pos++; }
    const p = pos > 0 ? E.inOutCubic(clamp((tt - acc) / 0.28)) : 1;
    S(strip, { transform: `translateY(${-(pos - 1 + p) * SH}px)` });
  } };
}
let feedCtl = null;
const shots = F.steps.map(([name], i) => {
  if (name === 'feed') { feedCtl = Feed(cam); S(feedCtl.box, { zIndex: i + 1 }); return feedCtl.box; }
  return el(cam, { left: 0, top: 0, width: SW, height: SH, zIndex: i + 1, overflow: 'hidden' }, `<img src="screens131/${name}.jpg" style="width:${SW}px;display:block">`);
});
const ptr = Pointer(uiL, 40);
const MX = 150, MY = 1520, MR = 78;
const mBox = el(uiL, { left: MX - MR * 1.7, top: MY - MR * 1.7, width: MR * 3.4, height: MR * 3.4, zIndex: 30 });
const mascot = Mascot(mBox, MR * 3.4); S(mascot.svg, { left: 0, top: 0 });
const says = F.says.map(([b, txt, mood]) => ({ b, mood, bub: Bubble(uiL, txt, { x: 24, y: 1250, w: 340, size: 34, tail: 'down', tx: 126, z: 35 }) }));
const caps = F.caps.map(([b, lines]) => ({ b, cap: Caption(capL, lines, { cy: 250, size: lines.some(l => l.replace(/<[^>]+>/g, '').length > 26) ? 50 : lines.length > 1 ? 56 : 60 }) }));
const stamps = (F.stamps || []).map(([b0, text, b1]) => { const e = Tag(uiL, text, { bg: C.forest, fg: C.white, size: 38, h: 78, font: 'Fredoka', weight: 700, ls: '0.04em', z: 36 }); S(e, { left: 200, top: 330 }); return { e, b0, b1 }; });
// the share message (film 1): what your friends get, as a chat bubble over the phone
let share = null;
if (F.share) {
  const box = el(capL, { left: 110, top: 900, width: 860, boxSizing: 'border-box', borderRadius: 34, background: '#DCF8C6', zIndex: 60, transformOrigin: '80% 100%', padding: '26px 34px',
    boxShadow: '0 2px 4px rgba(22,59,50,.06), 0 22px 44px rgba(22,59,50,.22)', fontFamily: 'Manrope', fontWeight: 700, fontSize: 36, lineHeight: '50px', color: C.forest },
    F.share.lines.join('<br>') + '<div style="margin-top:8px;font-size:30px;color:#1F806B;font-weight:800">roviko.app/daily ↗</div>');
  box.querySelectorAll('b').forEach(e => S(e, { color: C.green }));
  share = { box, b: F.share.b };
}
const endCard = EndCard(stage, { my: 690, tagline: F.tagline });

ev(0.02, 'pop', -12, { rate: 1.1 });
F.steps.forEach(([, b, tap, zm, pan], i) => { if (!i) return; if (tap) { ev(b - 0.05, 'tap', -6); ev(b + 0.25, i % 2 ? 'correct' : 'pop', -9); } else ev(b, 'swoosh', -9, { rate: 1.1 }); if (zm) ev(zm.b0, 'whoosh', -10); if (pan) ev(pan.b0, 'slide', -10); });
caps.forEach(({ b }, i) => { if (i) ev(b + 0.1, 'mention', -9); });
says.forEach(({ b, mood }, i) => ev(b + 0.05, mood === 'sad' || mood === 'shock' ? 'boing' : 'pop', -10, { rate: 0.95 + i * 0.07 }));
stamps.forEach(({ b0 }) => { if (b0 > 0) ev(b0, 'impact', -11); });
if (share) { ev(share.b, 'send', -8); ev(share.b + 0.4, 'notify', -10); }
if (feedCtl) for (let b = 0.6; b < 5; b += 0.9) ev(b, 'swoosh', -16, { rate: 1.4 });
ev(TL.end + 0.1, 'swoosh', -7); ev(TL.end + 0.35, 'sparkle', -7); ev(TL.end + 0.7, 'expand', -10);

function seek(tReal) {
  const t = clamp(tReal, 0, DURATION) * DIL, b = t / BEAT;
  HALOS[0].img.style.transform = `rotate(${20 + t * 14}deg)`;
  const pOut = segB(t, TL.end - 0.5, TL.end - 0.1, E.inBack), pp = spB(t, -1.6, 2, 0.62) * (1 - pOut);
  S(phone, { transform: `scale(${pp})` }); show(phone, pp > 0.001);
  if (feedCtl) feedCtl.set(t * 1.2);
  // screens: each one wipes in as a circle from its tap point (or from the right edge); a step may scroll its tall image
  F.steps.forEach(([name, b0, tap, , pan], i) => {
    if (pan) { const img = shots[i].querySelector('img'); if (img) S(img, { transform: `translateY(${-pan.to * K * segB(t, pan.b0, pan.b1, E.inOutCubic)}px)` }); }
    if (!i) return;
    if (name === F.steps[i - 1][0] && !pan) { show(shots[i], false); return; }  // same screen again: only the tap
    const o = tap ? [tap.x * K, tap.y * K] : [SW, SH / 2];
    const r = lerp(0, 1300, segB(t, b0, b0 + 0.5, E.inOutCubic));
    S(shots[i], { clipPath: `circle(${r.toFixed(1)}px at ${o[0]}px ${o[1]}px)` }); show(shots[i], r > 0.5);
  });
  const zsteps = F.steps.map((s, i) => ({ z: s[3], i })).filter(s => s.z);
  const zm = zsteps.find(({ z, i }) => b >= z.b0 - 0.01 && b < (F.steps[i + 1]?.[1] ?? TL.end));
  let k = 1, zx = SW / 2, zy = SH / 2;
  if (zm) { const p = segB(t, zm.z.b0, zm.z.b1, E.inOutCubic) * (1 - segB(t, (F.steps[zm.i + 1]?.[1] ?? TL.end) - 0.6, (F.steps[zm.i + 1]?.[1] ?? TL.end) - 0.05, E.inOutCubic)); k = lerp(1, zm.z.k, p); zx = zm.z.x * K; zy = zm.z.y * K; }
  S(cam, { transformOrigin: `${zx}px ${zy}px`, transform: `scale(${k})` });
  // the pointer: glides to each tap a beat early, presses, leaves
  const nextTap = F.steps.find(s => s[2] && b >= s[1] - 1.2 && b < s[1] + 0.6);
  if (nextTap) {
    const [, b0, tap] = nextTap, to = [PX + tap.x * K, PY + tap.y * K];
    const p = pointerAt(t, { from: [to[0] + 160, to[1] + 260], to, b0: b0 - 1.1, b1: b0 - 0.1, tap: b0 - 0.05, gone: b0 + 0.3 });
    ptr.set(p.x, p.y, p.sc, t >= T(b0 - 0.05) ? T(b0 - 0.05) : null, t, to[0], to[1]);
  } else ptr.set(0, 0, 0, null, t);
  // captions: each holds until the next one
  caps.forEach(({ b: b0, cap }, i) => { const nx = i + 1 < caps.length ? caps[i + 1].b : TL.end; cap.set(spB(t, b0 === -1 ? -1.5 : b0, 1.9, 0.62), segB(t, nx - 0.25, nx + 0.1)); });
  says.forEach(({ b: b0, bub }, i) => { const nx = i + 1 < says.length ? Math.min(says[i + 1].b, b0 + 3) : Math.min(TL.end - 0.3, b0 + 3); bub.set(spB(t, b0, 2.4, 0.55), segB(t, nx - 0.3, nx)); });
  stamps.forEach(({ e, b0, b1 }) => { const p = spB(t, b0 === -1 ? -1.2 : b0, 2.6, 0.5) * (1 - segB(t, b1 - 0.3, b1, E.inBack)); S(e, { transform: `scale(${p}) rotate(${-12 + 6 * clamp(p)}deg)` }); show(e, p > 0.001); });
  if (share) { const p = spB(t, share.b, 2.2, 0.6) * (1 - segB(t, TL.end - 1.2, TL.end - 0.6, E.inBack)); S(share.box, { transform: `scale(${lerp(0.2, 1, clamp(p, 0, 1.2))})` }); show(share.box, p > 0.001); }
  // Roviko: watches the phone, bounces on the beat, reacts in the mood of what he says
  const talking = says.find(s => b >= s.b && b < s.b + 1.6);
  const mood = talking ? talking.mood : (feedCtl && b < 5 ? 'zombie' : null);
  const sad = mood === 'sad', shock = mood === 'shock', happy = mood === 'happy', cool = mood === 'cool', zombie = mood === 'zombie', angry = mood === 'angry';
  drawMascot(mascot, { look: zombie ? [0.9, 0.5] : [0.9, -0.6], mouth: sad || shock ? 'o' : happy ? 'grin' : zombie ? 'flat' : angry ? 'wobble' : cool ? 'smile' : 'smile',
    eyesBig: shock ? 1 : sad ? 0.4 : 0, brows: sad || shock ? 'up' : angry ? 'angry' : null, happy: happy ? 1 : 0, cheeks: happy ? 0.8 : 0,
    sweat: sad || shock ? 1 : 0, legs: 1, hop: sad || zombie ? 0 : bop(b, happy ? 10 : 5), blink: zombie ? 0.55 : blinkAt(t, [3.4, 9.2, 15.6]),
    shades: cool ? { on: spB(t, talking.b, 3, 0.6), drop: 0 } : null, flush: angry ? 0.6 : 0,
    arms: sad || shock ? [[-92, -58, -30, 11], [92, -58, -30, 11]] : happy || angry ? [[-118, -92, -22, 11], [118, -92, -22, 11]] : zombie ? [[-100, 96, 30, 10], [100, 96, 30, 10]] : [[-112, 66, 22, 10], [112, 66, 22, 10]] });
  endCard.update(t, TL.end, [MX, MY], { hops: [TL.hop], blinks: [TL.blink2] });
}
boot(seek, DURATION);
