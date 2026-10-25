/*
  Roviko content week 2 (26 Oct - 1 Nov 2026), post 4 of every day: Guess the Country in 3 facts. w2-clue.html?d=1..7
  Under the big headline three clue cards land, hard to easy, each a real fact (roviko.app data and well-known records); a ring
  counts each clue down, then the answer (silhouette, true-ratio flag, name) and one more fact as the payoff.
*/
// @scripts lib/trendfilm.js lib/ios.js lib/flagratio.js lib/w2.js
const D = +(Q.get('d') || 1);
const DAY = {
  1: { iso: 'ZAF', fl: 'za', name: 'South Africa', song: 'fun-and-games', tempo: 99.547, hook: ['3 clues. 1 country.', 'Got it on clue 1?'],
    clues: [['columns', 'It has three capital cities'], ['map', 'A whole other country sits inside it'], ['pin', 'Cape Town is here']],
    fact: 'Pretoria (government), Cape Town (parliament), Bloemfontein (courts). And Lesotho sits completely inside it.',
    cta: ['Clue 1, 2 or 3?', 'Comment when you got it'] },
  2: { iso: 'JPN', fl: 'jp', name: 'Japan', song: 'bob', tempo: 119.996, hook: ['Hard clues first.', 'When did you get it?'],
    clues: [['globe', 'It has more than 14,000 islands'], ['mountain', 'About two-thirds of it is forest'], ['flag', 'Mount Fuji is here']],
    fact: 'In 2023 Japan recounted its islands with better maps: 14,125. The old count, from 1987, was 6,852.',
    cta: ['Did you know about', 'the 14,000 islands?'] },
  3: { iso: 'KAZ', fl: 'kz', name: 'Kazakhstan', song: 'light-it-up-boy', tempo: 118.998, hook: ['Only 3 clues.', 'Name this country'],
    clues: [['map', 'It’s the biggest landlocked country on Earth'], ['columns', 'Its capital changed its name, then changed it back'], ['star', 'Rockets to the space station launch from here']],
    fact: 'Astana became Nur-Sultan in 2019 and Astana again in 2022. Gagarin took off from Baikonur, here, in 1961.',
    cta: ['Which clue gave it away?', '1, 2 or 3'] },
  4: { iso: 'ITA', fl: 'it', name: 'Italy', song: 'keeping-fit', tempo: 130.001, hook: ['Easy? Prove it.', 'Name it in 3 clues'],
    clues: [['crown', 'Two whole countries sit inside it'], ['mountain', 'Europe’s most active volcano is here'], ['map', 'It’s shaped like a boot']],
    fact: 'San Marino and Vatican City are completely surrounded by Italy. The volcano is Etna, on Sicily.',
    cta: ['Could you name', 'both countries inside it?'] },
  5: { iso: 'BRA', fl: 'br', name: 'Brazil', song: 'games-worldbeat', tempo: 115.993, hook: ['Guess the country', 'before clue 3'],
    clues: [['map', 'It borders every South American country but two'], ['globe', 'Most of the Amazon rainforest is here'], ['pin', 'Rio de Janeiro is here']],
    fact: 'The two it doesn’t border: Chile and Ecuador. And its capital, Brasília, was built from scratch and opened in 1960.',
    cta: ['Did you know', 'the two it doesn’t touch?'] },
  6: { iso: 'ROU', fl: 'ro', name: 'Romania', song: 'ko-games', tempo: 110.992, hook: ['Halloween special:', 'name this country'],
    clues: [['columns', 'Its parliament is the heaviest building on Earth'], ['map', 'The Danube flows into the Black Sea here'], ['pumpkin', 'Dracula’s castle is here']],
    fact: 'Bran Castle is sold as “Dracula’s castle”, but Bram Stoker, who wrote Dracula, never visited Romania.',
    cta: ['Would you visit', 'Dracula’s castle?'] },
  7: { iso: 'IDN', fl: 'id', name: 'Indonesia', song: 'mi-gente', tempo: 110.002, hook: ['Week finale.', 'Name it before clue 3'],
    clues: [['globe', 'It has more than 17,000 islands'], ['columns', 'It’s building a new capital on Borneo'], ['flag', 'Its flag looks just like Monaco’s']],
    fact: 'It’s the biggest island country on Earth. And its flag is Monaco’s twin: same colours, a longer shape.',
    cta: ['How many did you get', 'this week? Comment it'] },
}[D];
const TEMPO = DAY.tempo, DIL = TEMPO / 130;
const GAP = 4, TL = { c: [0.6, 0.6 + GAP, 0.6 + 2 * GAP] };
TL.rev = TL.c[2] + GAP; TL.fact = TL.rev + 1.6; TL.cta = TL.rev + 6.5;
const END = Math.ceil(TL.rev + 11), DURATION = END * 60 / TEMPO;
const brand = brandRow(SERIES.country, `${W2DAYS[D]} · 3 FACTS`);
// clue cards, hard to easy; the first one is on screen from the first frame (the cover)
const CH = 196, CG = 22, TIER = [['HARD', IOS.red], ['MEDIUM', IOS.orange], ['EASY', IOS.green]];
const COLS = [['#5AC8FA', '#0A84FF'], ['#34C759', '#1F806B'], ['#FF9F0A', '#FF6B00']];
const clues = DAY.clues.map(([ic, txt], i) => {
  const y = LY.body + i * (CH + CG), card = wcard(64, y, 952, CH, 10 + i);
  el(card, { left: 0, top: 0, width: 952, height: CH }, `<div style="display:flex;align-items:center;gap:28px;height:${CH}px;padding:0 36px">${iconTile(ic, 100, ...COLS[i])}<div style="flex:1"><div style="display:flex;align-items:center;gap:14px"><span style="font-family:Manrope;font-weight:800;font-size:24px;letter-spacing:.14em;color:${IOS.grey}">CLUE ${i + 1}</span><span style="padding:6px 16px;border-radius:999px;background:${TIER[i][1]};color:#fff;font-family:Manrope;font-weight:800;font-size:22px">${TIER[i][0]}</span></div><div style="font-family:Fredoka;font-weight:600;font-size:${txt.length > 40 ? 42 : 48}px;line-height:1.15;color:${C.forest};margin-top:6px">${txt}</div></div></div>`);
  return { card, y };
});
// locked placeholders for the clues still to come
const locks = [1, 2].map(i => { const c = wcard(64, LY.body + i * (CH + CG), 952, CH, 9); S(c, { background: 'rgba(255,255,255,.45)', boxShadow: 'none', border: '2px dashed rgba(22,59,50,.16)' });
  el(c, { left: 0, top: 0, width: 952, height: CH, display: 'grid', placeItems: 'center' }, `<span style="font-family:Manrope;font-weight:800;font-size:26px;letter-spacing:.14em;color:rgba(22,59,50,.35)">CLUE ${i + 1}</span>`); return c; });
const ring = ringTimer(900, 1330, 66);
const who = el(uiL, { left: 0, top: 1292, width: 1080, textAlign: 'center', zIndex: 15, transformOrigin: '50% 50%' },
  `<span style="display:inline-flex;align-items:center;gap:14px;padding:16px 32px;border-radius:999px;background:${C.forest};color:#fff;font-family:Fredoka;font-weight:600;font-size:46px">Who am I?</span>`);
// the answer
const ans = wcard(64, LY.body, 952, 560, 20);
const fS = fitShape(DAY.iso, { cx: 290, cy: 280, w: 400, h: 440 });
const ansSvg = svgEl(ans, 'svg', { width: 952, height: 560 }); ansSvg.style.position = 'absolute';
const shape = svgEl(ansSvg, 'path', { d: fS.d, fill: '#CFE9DA', stroke: C.forest, 'stroke-width': 3, 'stroke-linejoin': 'round' });
el(ans, { left: 540, top: 110, width: 380 }, `<div style="display:flex;flex-direction:column;gap:22px;align-items:flex-start">${flagW(DAY.fl, 150)}<div style="font-family:Fredoka;font-weight:700;font-size:${DAY.name.length > 9 ? 60 : 78}px;color:${C.forest};line-height:1.02">${DAY.name}</div><div style="display:flex;align-items:center;gap:10px">${glyph('check', 42, IOS.green)}<span style="font-family:Manrope;font-weight:800;font-size:26px;letter-spacing:.1em;color:${IOS.green}">ANSWER</span></div></div>`);
const fact = factCard('bulb', ['#FFD60A', '#FF9F0A'], 'DID YOU KNOW', DAY.fact, { x: 360, w: 656, y: 1180 });
const heads = [[DAY.hook, -9, TL.rev], [[`It’s ${DAY.name}`, ''], TL.rev, TL.cta], [DAY.cta, TL.cta, END + 2]].map(([lines, b0, b1]) => ({ h: Head(lines.filter(Boolean)), b0, b1 }));

// ---- sound
ev(0.02, 'pop', -12, { rate: 1.1 });
TL.c.forEach((b, i) => { if (i) { ev(b, 'pop', -7, { rate: 1 + 0.08 * i }); ev(b + 0.1, 'swish', -12); } for (let k = 1; k < GAP - 0.5; k++) ev(b + k, 'clock', -12, { rate: 1 + 0.05 * k }); });
ev(TL.rev - 1.2, 'drumroll', -10); ev(TL.rev, 'impactbig', -6); ev(TL.rev + 0.05, 'correct', -6); ev(TL.rev + 0.3, 'crowdcheer', -13);
ev(TL.fact, 'pop', -8); ev(TL.fact + 0.1, 'sparkle', -10); ev(TL.cta, 'swish', -10); ev(TL.cta + 0.2, 'mention', -10);
if (D === 6) ev(TL.c[2] + 0.2, 'laugh', -14);

function seek(tReal) {
  const t = clamp(tReal, 0, DURATION) * DIL, b = t / BEAT;
  HALOS[0].img.style.transform = `rotate(${20 + t * 14}deg)`;
  brand.set(spB(t, -9, 2.4, 0.6));
  clues.forEach((c, i) => {
    const p = popAt(c.card, t, i ? TL.c[i] : -9, TL.rev - 0.3 + 0.06 * i, 2.4, 0.6);
    if (p > 0.001) S(c.card, { transform: `translateY(${(1 - Math.min(1, p)) * 50}px) scale(${0.92 + 0.08 * p})` });
  });
  locks.forEach((l, i) => popAt(l, t, -9, TL.c[i + 1] + 0.1));
  const ci = TL.c.findLastIndex(c => b >= c), inClue = ci >= 0 && b < TL.rev;
  if (inClue) { const b0 = TL.c[ci], q = clamp((b - b0) / GAP); ring.set(q, Math.max(1, Math.ceil((1 - q) * GAP * 60 / TEMPO))); }
  popAt(ring.e, t, TL.c[0], TL.rev - 0.3); popAt(who, t, -9, TL.rev - 0.3);
  popAt(ans, t, TL.rev, END + 2, 2.4, 0.55);
  shape.style.transform = `scale(${spB(t, TL.rev + 0.2, 2.6, 0.55)})`; shape.style.transformOrigin = '290px 280px';
  popAt(fact, t, TL.fact, END + 2, 2.4, 0.6);
  heads.forEach(h => h.h.set(spB(t, h.b0, 1.9, 0.7), segB(t, h.b1 - 0.25, h.b1)));
  const mood = b < TL.c[0] ? 'calm' : b < TL.rev ? 'think' : b < TL.rev + 2 ? 'cheer' : b < TL.cta ? 'calm' : 'point';
  rovikoMood(t, b, mood, [3.4, 9.8, 16.2, 22]);
}
boot(seek, DURATION);
