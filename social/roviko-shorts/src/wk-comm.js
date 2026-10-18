/*
  Roviko content week (19-25 Oct 2026), post 4 on Tue, Thu and Sat (Mon, Wed, Fri and Sun are carousels). wk-comm.html?d=2|4|6
  2 Country Mosaic: match 3 shapes to 3 flags, then a short look at the game (promo). 4 World Duel: you vs Roviko, five
  quick-fire questions, answer before he does (subtle promo). 6 POV: the geography friend in the group chat (humour).
*/
// @scripts lib/trendfilm.js lib/ios.js
const D = +(Q.get('d') || 2);
const SONG = { 2: ['mi-gente', 110.002], 4: ['take-this-higher', 124.01], 6: ['fun-and-games', 99.547] }[D];
const TEMPO = SONG[1], DIL = TEMPO / 130;
const LEVEL = { 2: 'COUNTRY MOSAIC', 4: 'WORLD DUEL', 6: 'POV' }[D];
const tag = seriesTag(...SERIES.community.slice(0, 2), SERIES.community[2], `${DAYS[D]} · ${LEVEL}`);
let TL, END, update, caps = [];
const capOf = list => list.map(([lines, b0, b1]) => ({ c: Caption(capL, lines, { cy: 300, size: 52 }), b0, b1 }));
let moodAt = b => 'calm';

if (D === 2) {
  // ---------------- Country Mosaic: three shapes, three flags (shuffled); lines join them at the reveal
  const SH = [['VNM', 'Vietnam'], ['CUB', 'Cuba'], ['ISL', 'Iceland']], FL = ['is', 'vn', 'cu'], MATCH = [1, 2, 0];   // shape i -> flag row MATCH[i]
  TL = { tiles: 0.4, ask: 3, rev: 9, game: 14, cta: 20 }; END = 27;
  const board = glass(90, 440, 900, 720, 10);
  const shapes = SH.map(([iso], i) => { const g = el(uiL, { left: 130, top: 470 + i * 230, width: 300, height: 200, zIndex: 12, borderRadius: 34, background: 'rgba(255,255,255,.9)', transformOrigin: '50% 50%', boxShadow: '0 10px 24px rgba(22,59,50,.1)' });
    const f = fitShape(iso, { cx: 150, cy: 100, w: 240, h: 160 }); const s = svgEl(g, 'svg', { width: 300, height: 200 }); s.style.position = 'absolute'; svgEl(s, 'path', { d: f.d, fill: C.green }); return g; });
  const flags = FL.map((fl, i) => el(uiL, { left: 650, top: 470 + i * 230, width: 300, height: 200, zIndex: 12, borderRadius: 34, background: 'rgba(255,255,255,.9)', transformOrigin: '50% 50%', boxShadow: '0 10px 24px rgba(22,59,50,.1)', display: 'grid', placeItems: 'center' }, flagW(fl, 120)));
  const ls = svgEl(el(uiL, { width: 1080, height: 1920, zIndex: 11 }), 'svg', { width: 1080, height: 1920 }); ls.style.position = 'absolute';
  const lines = MATCH.map((r, i) => svgEl(ls, 'line', { x1: 430, y1: 570 + i * 230, x2: 650, y2: 570 + r * 230, stroke: IOS.green, 'stroke-width': 10, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1' }));
  const names = SH.map(([, n], i) => el(uiL, { left: 140, top: 470 + i * 230 + 152, zIndex: 13, transformOrigin: '0 50%', whiteSpace: 'pre' }, `<span style="padding:6px 16px;border-radius:999px;background:${C.forest};color:#fff;font-family:Manrope;font-weight:800;font-size:24px">${n}</span>`));
  // the game card
  const game = glass(90, 440, 900, 760, 20);
  el(game, { left: 0, top: 0, width: 900, height: 760 }, `<div style="padding:50px;display:flex;flex-direction:column;gap:30px;align-items:center;text-align:center">
    <span style="width:170px;height:170px;border-radius:44px;background:#fff;display:grid;place-items:center;box-shadow:0 0 0 1px rgba(0,0,0,.06), 0 14px 30px rgba(22,59,50,.16)"><img src="${ASSETS}roviko-globe.svg" style="width:130px;height:130px"></span>
    <div style="font-family:Fredoka;font-weight:700;font-size:72px;color:${C.forest};line-height:1">Country Mosaic</div>
    <div style="font-family:Fredoka;font-weight:500;font-size:42px;color:${C.forest};line-height:1.3">Flag, name, shape and a fact:<br>put the right pieces together.</div>
    <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center">${['Free', 'No ads', 'No account'].map(x => `<span style="display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:999px;background:${IOS.fill};font-family:Manrope;font-weight:800;font-size:28px;color:${C.forest}">${glyph('check', 30, IOS.green)}${x}</span>`).join('')}</div>
    <div style="font-family:Manrope;font-weight:700;font-size:30px;color:${IOS.grey}">One of the daily games in Roviko · iPhone and iPad</div></div>`);
  const ring = ringTimer(900, 1250, 66);
  caps = capOf([[['Match each shape', 'to its <b>flag</b>'], -1.5, TL.rev], [['How many did you get?', '3 out of 3?'], TL.rev, TL.game], [['This is <b>Country Mosaic</b>'], TL.game, TL.cta], [['Your Mosaic score?', 'Tell us below'], TL.cta, END + 1]]);
  update = (t, b) => {
    popAt(board, t, 0, TL.game - 0.2, 2.2, 0.62);
    shapes.forEach((g, i) => popAt(g, t, TL.tiles + 0.2 * i, TL.game - 0.25)); flags.forEach((g, i) => popAt(g, t, TL.tiles + 0.6 + 0.2 * i, TL.game - 0.25));
    lines.forEach((l, i) => { l.setAttribute('stroke-dashoffset', (1 - segB(t, TL.rev + 0.4 * i, TL.rev + 0.4 * i + 0.6, E.outCubic)).toFixed(3)); l.style.opacity = b < TL.game - 0.2 ? 1 : 0; });
    names.forEach((n, i) => popAt(n, t, TL.rev + 0.4 * i + 0.4, TL.game - 0.25));
    popAt(game, t, TL.game, END + 2, 2.4, 0.6);
    const inAsk = b >= TL.ask && b < TL.rev; if (inAsk) { const q = clamp((b - TL.ask) / 6); ring.set(q, Math.max(1, Math.ceil((1 - q) * 6 * 60 / TEMPO))); } popAt(ring.e, t, TL.ask, TL.rev - 0.2);
  };
  moodAt = b => b < TL.ask ? 'calm' : b < TL.rev ? 'think' : b < TL.game ? 'cheer' : 'point';
  [0, 1, 2].forEach(i => { ev(TL.tiles + 0.2 * i, 'pop', -9); ev(TL.tiles + 0.6 + 0.2 * i, 'pop', -9, { rate: 1.1 }); });
  for (let k = 1; k < 6; k++) ev(TL.ask + k, 'clock', -11, { rate: 1 + 0.04 * k });
  [0, 1, 2].forEach(i => { ev(TL.rev + 0.4 * i, 'swish', -10); ev(TL.rev + 0.4 * i + 0.5, 'coin2', -9, { rate: 1 + 0.1 * i }); });
  ev(TL.rev + 1.6, 'kaching', -8); ev(TL.game, 'impactbig', -8); ev(TL.game + 0.4, 'sparkle', -9); ev(TL.cta, 'mention', -10);
} else if (D === 4) {
  // ---------------- World Duel: you vs Roviko, five quick-fire questions
  const QS = [['Capital of Canada?', 'Toronto', 'Ottawa', 0], ['Biggest country in South America?', 'Brazil', 'Brazil', 1], ['Which country has a maple leaf on its flag?', 'Canada', 'Canada', 1],
    ['Longest river in Africa?', 'The Nile', 'The Nile', 1], ['Which country has the most time zones?', 'Russia', 'France (12)', 0]];
  TL = { q0: 1, step: 4.4, cta: 0 }; TL.end = TL.q0 + QS.length * TL.step; TL.cta = TL.end + 1; END = Math.ceil(TL.cta + 8);
  const board = glass(90, 440, 900, 150, 12);
  el(board, { left: 0, top: 0, width: 900, height: 150 }, `<div style="display:flex;align-items:center;justify-content:space-around;height:150px"><div style="display:flex;align-items:center;gap:18px"><span style="width:80px;height:80px;border-radius:40px;background:${IOS.blue};display:grid;place-items:center">${glyph('people', 46, '#fff')}</span><span style="font-family:Fredoka;font-weight:600;font-size:46px;color:${C.forest}">You</span><span class="you" style="font-family:Fredoka;font-weight:700;font-size:62px;color:${IOS.blue}">?</span></div><span style="font-family:Manrope;font-weight:800;font-size:30px;color:${IOS.grey}">VS</span><div style="display:flex;align-items:center;gap:18px"><span class="rov" style="font-family:Fredoka;font-weight:700;font-size:62px;color:${C.green}">0</span><span style="font-family:Fredoka;font-weight:600;font-size:46px;color:${C.forest}">Roviko</span><img src="${ASSETS}roviko-globe.svg" style="width:80px;height:80px"></div></div>`);
  const rovN = board.querySelector('.rov');
  const qs = QS.map(([q, ra, right, ok], i) => {
    const g = el(uiL, { left: 90, top: 630, width: 900, zIndex: 13, transformOrigin: '50% 50%' });
    el(g, { left: 0, top: 0, width: 900 }, `<div style="padding:34px 40px;border-radius:44px;background:rgba(255,255,255,.94);box-shadow:0 22px 50px rgba(22,59,50,.14)"><div style="font-family:Manrope;font-weight:800;font-size:26px;letter-spacing:.12em;color:${IOS.grey}">QUESTION ${i + 1} OF 5</div><div style="font-family:Fredoka;font-weight:600;font-size:60px;line-height:1.15;color:${C.forest};margin-top:10px">${q}</div></div>`);
    const ansE = el(g, { left: 0, top: 290, width: 900, transformOrigin: '50% 0%' }, `<div style="display:flex;align-items:center;gap:20px;padding:26px 36px;border-radius:40px;background:${ok ? 'rgba(48,199,89,.14)' : 'rgba(255,59,48,.1)'}"><img src="${ASSETS}roviko-globe.svg" style="width:70px;height:70px"><span style="flex:1;font-family:Fredoka;font-weight:600;font-size:54px;color:${C.forest}">${ra}</span>${glyph(ok ? 'check' : 'xmark', 64, ok ? IOS.green : IOS.red)}</div>${ok ? '' : `<div style="margin-top:16px;font-family:Fredoka;font-weight:600;font-size:46px;color:${IOS.green};padding-left:36px">Answer: ${right}</div>`}`);
    return { g, ansE, ok };
  });
  const final = stamp(`${glyph('trophy', 72, IOS.yellow)}Roviko: 3 / 5`, C.forest, 640, 84);
  const beat = el(uiL, { left: 0, top: 800, width: 1080, textAlign: 'center', zIndex: 18, transformOrigin: '50% 50%' }, `<span style="font-family:Fredoka;font-weight:600;font-size:56px;color:${C.forest}">Did you beat him?</span>`);
  const promo = el(uiL, { left: 0, top: 920, width: 1080, textAlign: 'center', zIndex: 18, transformOrigin: '50% 50%' }, `<span style="display:inline-flex;align-items:center;gap:14px;padding:16px 30px;border-radius:999px;background:rgba(255,255,255,.95);box-shadow:0 10px 24px rgba(22,59,50,.12);font-family:Manrope;font-weight:800;font-size:32px;color:${C.forest}">${glyph('game', 38, C.green)}Rematch him in World Duel · Roviko</span>`);
  caps = capOf([[['You vs Roviko.', 'Answer <b>before</b> he does'], -1.5, TL.cta], [['Your score out of 5?', 'Comment it'], TL.cta, END + 1]]);
  update = (t, b) => {
    popAt(board, t, 0.2, TL.cta - 0.2, 2.4, 0.6);
    let rs = 0;
    qs.forEach((Q, i) => { const b0 = TL.q0 + i * TL.step; popAt(Q.g, t, b0, b0 + TL.step - 0.3, 2.6, 0.55); popAt(Q.ansE, t, b0 + 2.2, b0 + TL.step - 0.3, 2.8, 0.5); if (Q.ok && b >= b0 + 2.2) rs++; });
    rovN.textContent = rs;
    popAt(final, t, TL.end, END + 2, 3, 0.45); popAt(beat, t, TL.end + 0.6, END + 2); popAt(promo, t, TL.cta + 1, END + 2);
  };
  moodAt = b => { if (b >= TL.end) return 'cool'; const i = Math.floor((b - TL.q0) / TL.step), ph = (b - TL.q0) % TL.step; if (i < 0) return 'calm'; return ph < 2.2 ? 'think' : QS[Math.min(4, i)][3] ? 'cool' : 'shock'; };
  QS.forEach(([, , , ok], i) => { const b0 = TL.q0 + i * TL.step; ev(b0, 'swish', -10); ev(b0 + 0.1, 'pop', -9); ev(b0 + 1, 'clock', -11); ev(b0 + 2.2, ok ? 'correct' : 'error', -6); if (!ok) ev(b0 + 2.4, 'clownhorn', -11); });
  ev(TL.end, 'fanfare', -8); ev(TL.end + 0.6, 'mention', -10); ev(TL.cta + 1, 'pop', -9);
} else {
  // ---------------- POV: the geography friend in the group chat
  const MSG = [[0, 'Sam', 'Australia looks so small on maps lol'], [1, null, 'It’s bigger than the whole EU.'], [0, 'Mia', 'ok but the capital of Brazil is Rio'], [1, null, 'Brasília.'],
    [0, 'Sam', 'Greenland is basically the size of Africa'], [1, null, 'Africa is 14 times bigger.'], [0, 'Mia', 'you’re no fun'], [1, null, 'No fun. But correct.']];
  TL = { m0: 1.2, step: 2.6 }; TL.last = TL.m0 + (MSG.length - 1) * TL.step; TL.cta = TL.last + 3; END = Math.ceil(TL.cta + 7);
  // the thread lives in a clipped window and scrolls up like a real chat
  const WIN = { top: 470, h: 790 };
  const win = el(uiL, { left: 0, top: WIN.top, width: 1080, height: WIN.h, overflow: 'hidden', zIndex: 30, maskImage: 'linear-gradient(180deg, transparent 0, #000 60px)' });
  const inner = el(win, { left: 0, top: 0, width: 1080, height: 3000 });
  const head = el(inner, { left: 90, top: 10, width: 900, transformOrigin: '50% 0%' }, `<div style="display:flex;flex-direction:column;align-items:center;gap:8px"><div style="display:flex">${['S', 'M', 'R'].map((x, i) => `<span style="width:76px;height:76px;border-radius:38px;margin-left:${i ? -18 : 0}px;border:4px solid #F6F3E9;background:${[IOS.orange, IOS.purple, C.green][i]};display:grid;place-items:center;color:#fff;font-family:Manrope;font-weight:800;font-size:32px">${x}</span>`).join('')}</div><span style="font-family:Manrope;font-weight:800;font-size:28px;color:${C.forest}">Geography is fun (3)</span></div>`);
  const msgs = MSG.map(([me, who, txt], i) => {
    const e = chatBubble(txt, { x: me ? 0 : 110, y: 0, me: !!me, size: 40, parent: inner });
    const nm = who ? el(inner, { left: 140, top: 0, fontFamily: 'Manrope', fontWeight: 700, fontSize: 26, color: IOS.grey, transformOrigin: '0 50%' }, who) : null;
    return { e, nm, me, b0: TL.m0 + i * TL.step, y: 0, h: 0 };
  });
  LAYOUT.push(() => { let y = 170; msgs.forEach(m => { if (m.nm) { S(m.nm, { top: y }); y += 38; } m.y = y; m.h = m.e.getBoundingClientRect().height; S(m.e, { top: y }); if (m.me) S(m.e, { left: 990 - m.e.getBoundingClientRect().width }); y += m.h + 22; }); });
  caps = capOf([[['POV: you’re the', '<b>geography friend</b>'], -1.5, TL.cta], [['Tag your group chat’s', 'geography friend'], TL.cta, END + 1]]);
  update = (t, b) => {
    popAt(head, t, 0.4, END + 2);
    // scroll so the newest message (eased in over half a beat) sits at the bottom of the window
    let target = 0;
    msgs.forEach(m => { popAt(m.e, t, m.b0, END + 2, 2.8, 0.6); if (m.nm) popAt(m.nm, t, m.b0, END + 2);
      const k = segB(t, m.b0 - 0.1, m.b0 + 0.4, E.outCubic); if (k > 0) target = Math.max(target, (m.y + m.h + 30 - WIN.h) * k); });
    S(inner, { top: -Math.max(0, target) });
  };
  moodAt = b => { const i = Math.floor((b - TL.m0) / TL.step); if (b >= TL.cta) return 'point'; if (i < 0) return 'calm'; return i % 2 ? 'cool' : 'palm'; };
  msgs.forEach((m, i) => { ev(m.b0, i % 2 ? 'send' : 'mention', -8); if (i % 2) ev(m.b0 + 0.3, i === 7 ? 'badumtss' : 'boom', i === 7 ? -7 : -8); });
  ev(TL.last + 1.2, 'laugh', -11); ev(TL.cta, 'swish', -10);
}
const DURATION = END * 60 / TEMPO;
ev(0.02, 'pop', -12, { rate: 1.1 });

function seek(tReal) {
  const t = clamp(tReal, 0, DURATION) * DIL, b = t / BEAT;
  HALOS[0].img.style.transform = `rotate(${20 + t * 14}deg)`;
  popAt(tag, t, 0);
  update(t, b);
  caps.forEach(c => c.c.set(spB(t, c.b0, 1.9, 0.62), segB(t, c.b1 - 0.2, c.b1 + 0.15)));
  rovikoMood(t, b, moodAt(b), [3, 11, 19]);
}
boot(seek, DURATION);
