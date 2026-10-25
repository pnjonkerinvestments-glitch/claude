/*
  Roviko content week 2 (26 Oct - 1 Nov 2026), post 5 of the weekdays: map facts. w2-map.html?d=1|2|3|4|5|7 (d6 is a carousel)
  "find": five numbered pins on a map, which number is X? Roviko is sure of the wrong one (the "Number 4. Trust me." post did
  best of last week's challenges). "size": two countries on a normal web map, then at true size on the same scale.
  Areas: roviko.app data.
*/
// @scripts lib/trendfilm.js lib/ios.js lib/flagratio.js lib/w2.js
const D = +(Q.get('d') || 1);
const DAY = {
  1: { mode: 'find', song: 'games-worldbeat', tempo: 115.993, iso: 'URY', name: 'Uruguay', bounds: [-76, -40, -40, -13.5], answer: 4,
    pins: [['BOL', 1, -64.5, -17], ['PRY', 2, -58.2, -23.4], ['ARG', 3, -64, -34], ['URY', 4, -56, -32.8], ['BRA', 5, -51.5, -28]],
    hook: ['Which number', 'is Uruguay?'], say: 'Number 2. Trust me.', win: ['It’s number 4.', 'Paraguay is number 2'],
    fact: 'Uruguay has about 3.4 million people and about 12 million cows. That’s more than 3 cows per person.',
    cta: ['Send this to a friend.', 'Which number would they pick?'] },
  2: { mode: 'size', song: 'bob', tempo: 119.996, a: ['fr', 'France', 'FRA', 551695], b: ['mg', 'Madagascar', 'MDG', 587041], scale: 1150,
    hook: ['France or Madagascar:', 'which one is bigger?'], say: 'France. Look at it!', win: ['Madagascar.', 'Yes, really.'],
    fact: 'Madagascar is bigger by about 35,000&nbsp;km². Web maps stretch everything far from the equator, so France looks bigger.',
    cta: ['Which map trick', 'should we expose next?'] },
  3: { mode: 'find', song: 'mi-gente', tempo: 110.002, iso: 'MWI', name: 'Malawi', bounds: [21, -25, 43, -8.8], answer: 4,
    pins: [['ZMB', 1, 27.8, -14.5], ['TZA', 2, 35.5, -9.8], ['MOZ', 3, 37.6, -15.5], ['MWI', 4, 33.8, -13.8], ['ZWE', 5, 29.8, -19.2]],
    hook: ['Which number', 'is Malawi?'], say: 'Number 3. Easy.', win: ['It’s number 4.', 'The long thin one'],
    fact: 'Lake Malawi has more kinds of fish than any other lake on Earth. It covers about a fifth of the country.',
    cta: ['Did you get it?', 'Comment your number'] },
  4: { mode: 'size', song: 'light-it-up-boy', tempo: 118.998, a: ['gb', 'UK', 'GBR', 242900], b: ['ec', 'Ecuador', 'ECU', 276841], scale: 1500,
    hook: ['UK or Ecuador:', 'which one is bigger?'], say: 'The UK. Easy.', win: ['Ecuador.', 'The map lied.'],
    fact: 'Ecuador is bigger by about 34,000&nbsp;km². Web maps blow up places far from the equator, like the UK. Ecuador sits right on it.',
    cta: ['Did you say UK?', 'Be honest'] },
  5: { mode: 'find', song: 'ko-games', tempo: 110.992, iso: 'AUT', name: 'Austria', bounds: [5, 42, 22, 54.5], answer: 4,
    pins: [['CHE', 1, 8.2, 46.8], ['CZE', 2, 15.4, 49.8], ['HUN', 3, 19.4, 47.1], ['AUT', 4, 13.3, 47.4], ['SVN', 5, 14.9, 46.0]],
    hook: ['Which number', 'is Austria?'], say: 'Number 1. Kangaroos, right?', win: ['It’s number 4.', 'No kangaroos'],
    fact: 'Austria borders 8 countries: Germany, Czechia, Slovakia, Hungary, Slovenia, Italy, Switzerland and Liechtenstein.',
    cta: ['Tag someone who mixes up', 'Austria and Australia'] },
  7: { mode: 'find', song: 'upbeat-jazz', tempo: 110.004, iso: 'BIH', name: 'Bosnia and Herzegovina', bounds: [13, 40.5, 23.5, 48.2], answer: 3,
    pins: [['SVN', 1, 14.6, 46.1], ['HRV', 2, 16, 45.8], ['BIH', 3, 17.8, 44.2], ['SRB', 4, 20.8, 44.0], ['MNE', 5, 19.25, 42.75]],
    hook: ['Which number is', 'Bosnia and Herzegovina?'], say: 'Number 2. Trust me.', win: ['It’s number 3.', 'Croatia is number 2'],
    fact: 'Bosnia and Herzegovina has only about 20&nbsp;km of coast, at Neum. That little strip cuts Croatia’s coast in two.',
    cta: ['Which country should', 'we hide next?'] },
}[D];
const TEMPO = DAY.tempo, DIL = TEMPO / 130;
const brand = brandRow(SERIES.challenge, `${W2DAYS[D]} · ${DAY.mode === 'find' ? 'FIND IT' : 'MAPS LIE'}`);
const ring = ringTimer(900, 1340, 62);
let TL, END = 24, update;
const sayB = (h, b0, b1, w = DAY.sayW || 440) => ({ bub: Bubble(uiL, h, { x: 360, y: 1300, w, size: 40, tail: 'left', z: 35 }), b0, b1 });
let says = [];

if (DAY.mode === 'find') {
  TL = { pins: 0.2, ask: 1.6, rev: 8, fact: 10.6, cta: 17.6 };
  const B = { x: 64, y: LY.body, w: 952, h: 700 };
  const card = wcard(64, LY.body, 952, 700, 9);
  const M = flatMap(B, DAY.bounds, { z: 10 });
  el(uiL, { left: 64, top: LY.body, width: 952, height: 700, borderRadius: 28, zIndex: 11, boxShadow: 'inset 0 0 0 1px rgba(22,59,50,.08)' });
  const ringD = r => r.map(([lo, la], i) => { const [x, y] = M.pt(lo, la); return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }).join('') + 'Z';
  const hit = svgEl(M.g, 'path', { d: GEO[DAY.iso].map(p => p.map(ringD).join('')).join(''), fill: IOS.green, opacity: 0, 'fill-rule': 'evenodd' });
  const pins = DAY.pins.map(([iso, n, lo, la]) => { const [x, y] = M.pt(lo, la);
    return { n, e: el(uiL, { left: x - 42, top: y - 42, width: 84, height: 84, borderRadius: 42, background: C.forest, color: '#fff', zIndex: 14, display: 'grid', placeItems: 'center', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 46,
      border: '5px solid #fff', boxShadow: '0 8px 20px rgba(22,59,50,.3)', transformOrigin: '50% 50%' }, String(n)) }; });
  const fact = factCard('pin', ['#34C759', '#1F806B'], 'DID YOU KNOW', DAY.fact, { x: 360, w: 656, y: 1310 });
  says = [sayB(DAY.say, 3, TL.rev)];
  update = (t, b) => {
    popAt(card, t, -9, END + 2, 2.2, 0.62); S(M.wrap, { visibility: card.style.visibility });
    pins.forEach((p, i) => { const pp = popAt(p.e, t, -9 + 0 * i, END + 2, 3, 0.45); const right = p.n === DAY.answer;
      if (b >= TL.rev) S(p.e, { background: right ? IOS.green : C.forest, opacity: right ? 1 : 0.35, transform: `scale(${pp * (right ? 1.25 : 1)})` }); else S(p.e, { opacity: 1, background: C.forest }); });
    hit.setAttribute('opacity', (0.85 * segB(t, TL.rev, TL.rev + 0.5)).toFixed(2));
    popAt(fact, t, TL.fact, END + 2);
  };
  ev(0.02, 'pop', -12); ev(TL.ask, 'swish', -10);
  ev(TL.rev, 'pin', -6); ev(TL.rev + 0.1, 'correct', -6); ev(TL.rev + 0.4, 'crowdcheer', -12); ev(TL.rev + 0.8, 'trombone', -10); ev(TL.fact, 'pop', -8);
} else {
  // two cards, a normal web map (Mercator), then both at true size on the same scale
  TL = { ask: 1.6, rev: 8, nums: 9.6, fact: 12.4, cta: 17.6 };
  const A = DAY.a, Bc = DAY.b, win = A[3] > Bc[3] ? 0 : 1;
  const cards = [A, Bc].map(([code, name], i) => { const c = wcard(i ? 552 : 64, LY.body, 464, 200, 11);
    el(c, { left: 0, top: 0, width: 464, height: 200, display: 'grid', placeItems: 'center' }, `<div style="display:flex;flex-direction:column;align-items:center;gap:14px">${flagW(code, 86)}<span style="font-family:Fredoka;font-weight:600;font-size:48px;color:${C.forest}">${name}</span></div>`); return c; });
  const vs = el(uiL, { left: 490, top: LY.body + 50, width: 100, height: 100, borderRadius: 50, background: C.forest, color: '#fff', zIndex: 13, display: 'grid', placeItems: 'center', fontFamily: 'Manrope', fontWeight: 800, fontSize: 32, transformOrigin: '50% 50%' }, 'VS');
  const stage2 = wcard(64, LY.body + 225, 952, 500, 10);
  const sw = el(uiL, { width: 1080, height: 1920, zIndex: 12 }), svg = svgEl(sw, 'svg', { width: 1080, height: 1920 }); svg.style.position = 'absolute';
  const CYs = LY.body + 470, XA = 310, XB = 770;
  // (Ecuador: leave out the Galápagos, 1,000 km off the coast)
  const proj = (iso, cx, cy, k, f, attrs) => { const ctr = geoCentre(iso), rings = ctr.near.filter(p => iso !== 'ECU' || p[0][0][0] > -85).flatMap(p => p.map(r => r.map(([lo, la]) => f(lo, la, ctr))));
    const bb = bboxOf(rings.flat()), ox = cx - k * (bb[0] + bb[2]) / 2, oy = cy - k * (bb[1] + bb[3]) / 2;
    const e = svgEl(svg, 'path', Object.assign({ d: rings.map(r => r.map(([x, y], i) => (i ? 'L' : 'M') + (ox + k * x).toFixed(1) + ' ' + (oy + k * y).toFixed(1)).join('') + 'Z').join(''), 'stroke-linejoin': 'round' }, attrs));
    e.style.transformOrigin = `${cx}px ${cy}px`; return e; };
  const laeaF = (lo, la, ctr) => laea(ctr.lon, ctr.lat)(lo, la);
  const mercF = (lo, la) => [lo * Math.PI / 180, -Math.log(Math.tan(Math.PI / 4 + la * Math.PI / 360))];
  const tA = proj(A[2], XA, CYs, DAY.scale, laeaF, { fill: win === 0 ? '#BFEBD0' : '#FBD5D3', stroke: C.forest, 'stroke-width': 3 });
  const tB = proj(Bc[2], XB, CYs, DAY.scale, laeaF, { fill: win === 1 ? '#BFEBD0' : '#FBD5D3', stroke: C.forest, 'stroke-width': 3 });
  const mA = proj(A[2], XA, CYs, DAY.scale / 1.9, mercF, { fill: '#DDE7F2', stroke: '#5B7FA6', 'stroke-width': 3 });
  const mB = proj(Bc[2], XB, CYs, DAY.scale / 1.9, mercF, { fill: '#DDE7F2', stroke: '#5B7FA6', 'stroke-width': 3 });
  const lab = el(uiL, { left: 110, top: LY.body + 255, zIndex: 13, transformOrigin: '0 50%', whiteSpace: 'pre' }, `<span style="font-family:Manrope;font-weight:800;font-size:26px;letter-spacing:.12em;color:${IOS.grey}">ON A NORMAL WEB MAP</span>`);
  const lab2 = el(uiL, { left: 110, top: LY.body + 255, zIndex: 13, transformOrigin: '0 50%', whiteSpace: 'pre' }, `<span style="font-family:Manrope;font-weight:800;font-size:26px;letter-spacing:.12em;color:${IOS.green}">TRUE SIZE, SAME SCALE</span>`);
  const chip = (txt, x, w_) => el(uiL, { left: x - 220, top: LY.body + 598, width: 440, textAlign: 'center', zIndex: 16, transformOrigin: '50% 50%' },
    `<span style="display:inline-flex;align-items:center;gap:10px;padding:12px 24px;border-radius:999px;background:${w_ ? IOS.green : '#fff'};color:${w_ ? '#fff' : C.forest};font-family:Fredoka;font-weight:600;font-size:40px;box-shadow:0 8px 20px rgba(22,59,50,.16)">${w_ ? glyph('crown', 36, '#fff') : ''}${txt}</span>`);
  const nA = chip(`${A[3].toLocaleString('en-US')} km²`, XA, win === 0), nB = chip(`${Bc[3].toLocaleString('en-US')} km²`, XB, win === 1);
  const fact = factCard('ruler', ['#5AC8FA', '#0A84FF'], 'THE DIFFERENCE', DAY.fact, { x: 360, w: 656, y: 1340 });
  says = [sayB(DAY.say, 3, TL.rev), sayB('the map LIED to me', TL.rev + 1.6, TL.fact)];
  update = (t, b) => {
    cards.forEach((c, i) => popAt(c, t, -9, END + 2)); popAt(vs, t, -9, END + 2, 3, 0.45);
    popAt(stage2, t, -9, END + 2, 2.2, 0.62); S(sw, { visibility: stage2.style.visibility });
    const mp = 1 - segB(t, TL.rev - 0.2, TL.rev + 0.3, E.inCubic), sp = spB(t, TL.rev + 0.2, 2.4, 0.55);
    [mA, mB].forEach(e => { e.style.transform = `scale(${mp})`; e.style.opacity = mp > 0.01 ? 1 : 0; });
    [tA, tB].forEach(e => { e.style.transform = `scale(${sp})`; e.style.opacity = sp > 0.01 ? 1 : 0; });
    popAt(lab, t, -9, TL.rev - 0.2); popAt(lab2, t, TL.rev + 0.4, END + 2);
    popAt(nA, t, TL.nums, END + 2); popAt(nB, t, TL.nums + 0.3, END + 2);
    popAt(fact, t, TL.fact, END + 2);
    cards.forEach((c, i) => c.style.boxShadow = b >= TL.rev && i === win ? `0 0 0 8px ${IOS.green}, 0 22px 50px rgba(22,59,50,.14)` : '0 1px 2px rgba(22,59,50,.06), 0 22px 50px rgba(22,59,50,.12)');
  };
  ev(0.02, 'pop', -12); ev(TL.ask, 'swish', -10);
  ev(TL.rev, 'scratch', -5); ev(TL.rev + 0.2, 'morph', -8); ev(TL.rev + 0.3, 'impactbig', -8); ev(TL.nums, 'kaching', -8); ev(TL.rev + 1.6, 'boinghit', -8); ev(TL.fact, 'pop', -8);
}
const DURATION = END * 60 / TEMPO;
says.forEach(s => ev(s.b0, 'mention', -9));
for (let k = 1; k < 6; k++) ev(TL.ask + k + 0.4, 'clock', -11, { rate: 1 + 0.04 * k });
ev(TL.cta, 'swish', -10); ev(TL.cta + 0.2, 'mention', -10);
const heads = [[DAY.hook, -9, TL.rev], [DAY.win, TL.rev, TL.cta], [DAY.cta, TL.cta, END + 2]].map(([lines, b0, b1]) => ({ h: Head(lines), b0, b1 }));

function seek(tReal) {
  const t = clamp(tReal, 0, DURATION) * DIL, b = t / BEAT;
  HALOS[0].img.style.transform = `rotate(${20 + t * 14}deg)`;
  brand.set(spB(t, -9, 2.4, 0.6));
  update(t, b);
  const inAsk = b >= TL.ask && b < TL.rev; if (inAsk) { const q = clamp((b - TL.ask - 0.4) / 6); ring.set(q, Math.max(1, Math.ceil((1 - q) * 3))); }
  popAt(ring.e, t, TL.ask + 0.4, TL.rev - 0.2);
  says.forEach(s => s.bub.set(spB(t, s.b0, 2.4, 0.6), segB(t, s.b1, s.b1 + 0.3)));
  heads.forEach(h => h.h.set(spB(t, h.b0, 1.9, 0.7), segB(t, h.b1 - 0.25, h.b1)));
  const smug = b >= 3 && b < TL.rev;
  const mood = b < 2 ? 'calm' : b < TL.rev ? (smug ? 'smug' : 'think') : b < TL.rev + 2.5 ? 'shock' : b < TL.cta ? 'calm' : 'point';
  rovikoMood(t, b, mood, [3, 11, 19]);
}
boot(seek, DURATION);
