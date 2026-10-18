/*
  Roviko content week (19-25 Oct 2026), post 2 of every day: Guess the Flag. wk-flag.html?d=1|2|3|4|5|7 (d6 is a carousel)
  True-ratio flags (roviko.app 1.34) in glass cards. "spot": both names shown, find the differences; "which": unnamed A/B, pick
  one; "three": name all three. A ring counts down, then the names land and round magnifier lenses zoom into the detail that
  tells them apart, with a fact as the payoff.
*/
// @scripts lib/trendfilm.js lib/ios.js
const D = +(Q.get('d') || 1);
const RATIO = { nl: 1.5, lu: 5 / 3, au: 2, nz: 2, td: 1.5, ro: 1.5, ie: 2, ci: 1.5, ml: 1.5, sn: 1.5, gn: 1.5, sk: 1.5, si: 2, ad: 10 / 7 };
const DAY = {
  1: { mode: 'spot', song: 'ko-games', tempo: 110.992, level: 'SPOT THE DIFFERENCE', flags: [['nl', 'Netherlands'], ['lu', 'Luxembourg']],
    hook: ['Same flag?', 'Find 2 differences'], ask: 'Find 2 differences',
    lens: [[0, .5, .84, 2.6, 'Dark blue'], [1, .5, .84, 2.6, 'Light blue']], chips: ['2 : 3', '3 : 5'], chipLabel: 'SHAPE',
    fact: 'Luxembourg’s flag is longer and its blue is lighter. The colours come from its coat of arms: a red lion on blue and white stripes.',
    cta: ['Send this to someone', 'who mixes them up'] },
  2: { mode: 'which', song: 'keeping-fit', tempo: 130.001, level: 'PICK ONE', flags: [['au', 'Australia'], ['nz', 'New Zealand']], answer: 1,
    hook: ['Which one is', '<b>New Zealand</b>?'], ask: 'A or B?',
    lens: [[0, .25, .74, 2.4, '7-point star'], [1, .75, .5, 1.5, 'Red stars']],
    fact: 'New Zealand has 4 red stars with a white edge. Australia has 6 white stars; the big one has 7 points, for its 6 states plus its territories.',
    cta: ['A or B: what did', 'you pick? Be honest'] },
  3: { mode: 'which', song: 'mi-gente', tempo: 110.002, level: 'PICK ONE', flags: [['ro', 'Romania'], ['td', 'Chad']], answer: 1,
    hook: ['One is Romania, one is Chad.', 'Which one is <b>Chad</b>?'], ask: 'A or B?',
    lens: [[0, .17, .5, 3, 'Brighter blue'], [1, .17, .5, 3, 'Darker blue']], extra: ['ad', 'Andorra'],
    fact: 'They are nearly identical: only the blue is different. And Andorra uses the same colours too, with a coat of arms in the middle.',
    cta: ['Did you get it', 'or did you guess?'] },
  4: { mode: 'which', song: 'games-worldbeat', tempo: 115.993, level: 'PICK ONE', flags: [['ci', 'Ivory Coast'], ['ie', 'Ireland']], answer: 1,
    hook: ['Quick. Which one', 'is <b>Ireland</b>?'], ask: 'A or B?',
    lens: [[0, .1, .5, 2.2, 'Orange by the pole'], [1, .07, .5, 2.2, 'Green by the pole']],
    fact: 'Same colours, mirrored. Green next to the pole means Ireland. And Ireland’s flag is longer (1:2).',
    cta: ['Tag the friend who', 'would get this wrong'] },
  5: { mode: 'three', song: 'upbeat-jazz', tempo: 110.004, level: 'NAME ALL 3', flags: [['ml', 'Mali'], ['sn', 'Senegal'], ['gn', 'Guinea']],
    hook: ['Mali, Senegal or Guinea?', 'Name all 3 flags'], ask: 'Name all 3',
    lens: [[1, .5, .5, 2.4, 'The green star']], tags: ['Plain', 'Green star', 'Mali, mirrored'],
    fact: 'These three are neighbours. Senegal adds a green star, and Guinea is Mali flipped around: red next to the pole.',
    cta: ['How many did you get?', '0, 1, 2 or 3'] },
  7: { mode: 'spot', song: 'bob', tempo: 119.996, level: 'SPOT THE DIFFERENCE', flags: [['sk', 'Slovakia'], ['si', 'Slovenia']],
    hook: ['Slovakia vs Slovenia.', 'Spot the difference'], ask: 'Look at the shields',
    lens: [[0, .34, .5, 2.2, 'Double cross'], [1, .25, .31, 3.2, 'Mount Triglav']],
    fact: 'Slovakia’s shield is bigger, with a double cross on three hills. Slovenia’s is smaller, with Triglav, its highest mountain (2,864&nbsp;m).',
    cta: ['Save this for your', 'next quiz night'] },
}[D];
const TEMPO = DAY.tempo, DIL = TEMPO / 130;
const TL = { tag: 0, f: [0.4, 0.9, 1.4], ask: 2, rev: 8, lens: [9.4, 10.4], fact: 12.6, cta: 17.4 };
const END = 23, DURATION = END * 60 / TEMPO;
const tag = seriesTag(...SERIES.flag.slice(0, 2), SERIES.flag[2], `${DAYS[D]} · ${DAY.level}`);
// the flags
const n = DAY.flags.length, FH = n === 3 ? 190 : 250, FY0 = 470, FGAP = n === 3 ? 250 : 340;
const flags = DAY.flags.map(([code, name], i) => {
  const y = FY0 + i * FGAP, w = FH * RATIO[code];
  const card = glass(90, y - 30, 900, FH + 60, 10 + i);
  const img = el(uiL, { left: 130, top: y, width: w, height: FH, zIndex: 12 + i, transformOrigin: '50% 50%' }, flagW(code, FH));
  const lab = DAY.mode === 'spot' ? name : 'ABC'[i];
  const badge = el(uiL, { left: 130 + w + 36, top: y + FH / 2 - 40, zIndex: 13, transformOrigin: '0 50%', whiteSpace: 'pre' },
    `<span style="display:inline-flex;align-items:center;gap:14px;font-family:Fredoka;font-weight:600;font-size:${DAY.mode === 'spot' ? 48 : 64}px;color:${C.forest}">${DAY.mode === 'spot' ? '' : `<span style="width:80px;height:80px;border-radius:40px;background:${IOS.fill};display:grid;place-items:center">${lab}</span>`}${DAY.mode === 'spot' ? lab : ''}</span>`);
  const named = el(uiL, { left: 130 + w + 36, top: y + FH / 2 - 44, zIndex: 14, transformOrigin: '0 50%', whiteSpace: 'pre' },
    `<span style="display:inline-flex;flex-direction:column;gap:6px"><span style="display:flex;align-items:center;gap:12px">${DAY.mode === 'which' ? glyph(i === DAY.answer ? 'check' : 'xmark', 48, i === DAY.answer ? IOS.green : IOS.red) : ''}<span style="font-family:Fredoka;font-weight:600;font-size:${name.length > 10 ? 44 : 52}px;color:${C.forest}">${name}</span></span>${DAY.tags ? `<span style="font-family:Manrope;font-weight:800;font-size:24px;letter-spacing:.08em;color:${IOS.grey}">${DAY.tags[i].toUpperCase()}</span>` : ''}</span>`);
  const chip = el(uiL, { left: 130 + 14, top: y + FH - 30, zIndex: 17, transformOrigin: '0 50%', whiteSpace: 'pre' },
    `<span style="display:inline-flex;align-items:center;gap:8px;padding:8px 18px;border-radius:999px;background:rgba(255,255,255,.95);box-shadow:0 6px 16px rgba(22,59,50,.18);font-family:Manrope;font-weight:800;font-size:26px;color:${C.forest}">${DAY.mode === 'which' ? glyph(i === DAY.answer ? 'check' : 'xmark', 28, i === DAY.answer ? IOS.green : IOS.red) : ''}${name}</span>`);
  return { card, img, badge, named, chip, y, w, code };
});
// ratio chips (d1)
const chips = (DAY.chips || []).map((c, i) => el(uiL, { left: 130 + flags[i].w - 20, top: flags[i].y + FH - 46, zIndex: 16, transformOrigin: '50% 50%', whiteSpace: 'pre' },
  `<span style="padding:10px 22px;border-radius:999px;background:${C.forest};color:#fff;font-family:Manrope;font-weight:800;font-size:28px">${DAY.chipLabel} ${c}</span>`));
// magnifier lenses: a round crop of the flag, scaled up
const LR = 130;
const lenses = DAY.lens.map(([fi, fx, fy, zoom, label], k) => {
  const F = flags[fi], fw = F.w * zoom, fh = FH * zoom;
  const lx = DAY.mode === 'three' ? 760 : 850, ly = F.y + FH / 2;
  const e = el(uiL, { left: lx - LR, top: ly - LR, width: 2 * LR, height: 2 * LR, borderRadius: LR, overflow: 'hidden', zIndex: 20, transformOrigin: '50% 50%',
    border: '8px solid #fff', boxShadow: '0 18px 40px rgba(22,59,50,.28)', background: `url(${FLAG_W}${F.code}.svg) ${(LR - fx * fw).toFixed(1)}px ${(LR - fy * fh).toFixed(1)}px / ${fw.toFixed(1)}px ${fh.toFixed(1)}px no-repeat` });
  const lab = el(uiL, { left: lx - 160, top: ly + LR - 6, width: 320, textAlign: 'center', zIndex: 21, transformOrigin: '50% 0%' },
    `<span style="display:inline-block;padding:8px 20px;border-radius:999px;background:#fff;box-shadow:0 8px 20px rgba(22,59,50,.16);font-family:Manrope;font-weight:800;font-size:26px;color:${C.forest};white-space:nowrap">${label}</span>`);
  const dot = el(uiL, { left: 130 + fx * F.w - 26, top: F.y + fy * FH - 26, width: 52, height: 52, borderRadius: 26, border: '6px solid #fff', boxShadow: '0 0 0 3px rgba(22,59,50,.25)', zIndex: 19, transformOrigin: '50% 50%' });
  return { e, lab, dot, b0: TL.lens[Math.min(k, 1)] };
});
let extra = null;
if (DAY.extra) extra = el(uiL, { left: 0, top: 1150, width: 1080, zIndex: 16, transformOrigin: '50% 50%' },
  `<div style="display:flex;justify-content:center;align-items:center;gap:24px">${flagW(DAY.extra[0], 120)}<span style="font-family:Fredoka;font-weight:600;font-size:44px;color:${C.forest}">${DAY.extra[1]} too?!</span></div>`);
const ring = ringTimer(900, 1250, 66);
const askChip = el(uiL, { left: 0, top: 1210, width: 1080, textAlign: 'center', zIndex: 15, transformOrigin: '50% 50%' },
  `<span style="display:inline-flex;align-items:center;gap:14px;padding:16px 30px;border-radius:999px;background:${C.forest};color:#fff;font-family:Fredoka;font-weight:600;font-size:44px">${glyph('eye', 44, '#fff')}${DAY.ask}</span>`);
const fact = factCard('bulb', ['#FFD60A', '#FF9F0A'], 'THE DIFFERENCE', DAY.fact, { x: 330, w: 660, y: n === 3 ? 1220 : 1130 });
const caps = [[DAY.hook, -1.5, TL.rev], [DAY.mode === 'which' ? [`It’s <b>${String.fromCharCode(65 + DAY.answer)}</b>`] : ['Here’s how to tell'], TL.rev, TL.cta], [DAY.cta, TL.cta, END + 1]]
  .map(([lines, b0, b1]) => ({ c: Caption(capL, lines, { cy: 300, size: 52 }), b0, b1 }));

// ---- sound
ev(0.02, 'pop', -12, { rate: 1.1 }); TL.f.slice(0, n).forEach((b, i) => ev(b, 'pop', -8, { rate: 1 + 0.1 * i }));
ev(TL.ask, 'swish', -10); for (let k = 1; k < 6; k++) ev(TL.ask + k, 'clock', -11, { rate: 1 + 0.04 * k });
ev(TL.rev, 'scratch', -6); ev(TL.rev + 0.1, 'correct', -6); flags.forEach((_, i) => ev(TL.rev + 0.2 + 0.2 * i, 'pop', -10));
lenses.forEach((L, k) => { ev(L.b0, 'expand', -8); ev(L.b0 + 0.2, 'sparkle', -11); });
if (extra) { ev(TL.fact - 1.2, 'boinghit', -7); }
ev(TL.fact, 'pop', -8); ev(TL.cta, 'swish', -10); ev(TL.cta + 0.2, 'mention', -10);

function seek(tReal) {
  const t = clamp(tReal, 0, DURATION) * DIL, b = t / BEAT;
  HALOS[0].img.style.transform = `rotate(${20 + t * 14}deg)`;
  popAt(tag, t, TL.tag);
  flags.forEach((F, i) => {
    popAt(F.card, t, TL.f[i], END + 2, 2.4, 0.6); popAt(F.img, t, TL.f[i] + 0.1, END + 2, 2.4, 0.55);
    popAt(F.badge, t, TL.f[i] + 0.3, TL.rev - 0.2);
    popAt(F.named, t, TL.rev + 0.2 + 0.2 * i, TL.lens[0] - 0.3);
    popAt(F.chip, t, TL.lens[0] - 0.1 + 0.1 * i, END + 2);
    if (DAY.mode === 'which' && b >= TL.rev) F.card.style.boxShadow = i === DAY.answer ? `0 0 0 8px ${IOS.green}, 0 22px 50px rgba(22,59,50,.14)` : '0 1px 2px rgba(22,59,50,.06), 0 22px 50px rgba(22,59,50,.14)';
  });
  chips.forEach((c, i) => popAt(c, t, TL.lens[1] + 0.4 + 0.2 * i, END + 2));
  lenses.forEach(L => { popAt(L.dot, t, L.b0 - 0.2, END + 2, 3, 0.5); const p = popAt(L.e, t, L.b0, END + 2, 2.6, 0.55); popAt(L.lab, t, L.b0 + 0.3, END + 2); });
  if (extra) popAt(extra, t, TL.fact - 1.2, TL.fact - 0.2, 2.6, 0.5);
  const inAsk = b >= TL.ask && b < TL.rev; if (inAsk) { const q = clamp((b - TL.ask) / 6); ring.set(q, Math.max(1, Math.ceil((1 - q) * 3))); }
  popAt(ring.e, t, TL.ask, TL.rev - 0.2); popAt(askChip, t, TL.ask + 0.2, TL.rev - 0.2);
  popAt(fact, t, TL.fact, END + 2, 2.4, 0.6);
  caps.forEach(c => c.c.set(spB(t, c.b0, 1.9, 0.62), segB(t, c.b1 - 0.2, c.b1 + 0.15)));
  const mood = b < TL.ask ? 'calm' : b < TL.rev ? 'think' : b < TL.rev + 2 ? 'shock' : b < TL.cta ? 'calm' : 'point';
  rovikoMood(t, b, mood, [3, 11, 19]);
}
boot(seek, DURATION);
