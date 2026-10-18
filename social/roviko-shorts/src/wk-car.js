/*
  Roviko content week (19-25 Oct 2026): the five photo carousels, 1080x1350 (4:5). wk-car.html?id=friend-1
  friend: Challenge your smartest friend (Mon) · haunted: Haunted house of geography (Wed, Halloween) · zoom: swipe to zoom out,
  guess the country (Fri) · monaco: Monaco, Indonesia, Poland (Sat flags) · week: weekly score challenge (Sun). Rendered by
  build/week-car.mjs. iPhone-style glyphs and cards from lib/ios.js; no emoji in picture.
*/
// @scripts lib/ios.js
const id = Q.get('id') || 'friend-1', [post, nStr] = id.split('-'), N = +nStr;
const W = 1080, H = 1350;
S(document.body, { width: W, height: H }); S(stage, { width: W, height: H, overflow: 'hidden' });
const DARK = post === 'haunted';
S(stage, { background: DARK ? 'radial-gradient(900px 700px at 80% 10%, rgba(255,149,0,.22), transparent 70%), radial-gradient(900px 800px at 10% 90%, rgba(175,82,222,.25), transparent 70%), #11231D'
  : 'radial-gradient(900px 700px at 85% 8%, rgba(31,128,107,.10), transparent 70%), radial-gradient(1000px 900px at 15% 85%, rgba(54,179,245,.10), transparent 70%), #F6F3E9' });
const uiL = el(stage, { width: W, height: H, zIndex: 20 });
const TXT = DARK ? '#F6F3E9' : C.forest, SUB = DARK ? 'rgba(246,243,233,.6)' : IOS.grey;
const COUNT = { friend: 8, haunted: 8, zoom: 5, monaco: 4, week: 5 };
const SER = { friend: ['people', 'FRIEND CHALLENGE', ['#FFCC00', '#FF9500']], haunted: ['ghost', 'HALLOWEEN', ['#FF9F0A', '#FF6B00']], zoom: ['search', 'SWIPE TO REVEAL', ['#5AC8FA', '#0A84FF']],
  monaco: ['flag', 'GUESS THE FLAG', ['#FF6B5E', '#E5484D']], week: ['trophy', 'WEEKLY SCORE', ['#34C759', '#1F806B']] }[post];
// header: logo, series tile, slide counter
el(uiL, { left: 64, top: 60, height: 70, display: 'flex', alignItems: 'center', gap: '14px' }, `<img src="${ASSETS}roviko-globe.svg" style="width:52px;height:52px"><span style="font-family:Fredoka;font-weight:600;font-size:42px;color:${TXT}">roviko</span>`);
el(uiL, { left: 'auto', right: 64, top: 64, height: 62, display: 'flex', alignItems: 'center', gap: '12px', padding: '0 20px 0 6px', borderRadius: 31, background: DARK ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.85)' },
  `${iconTile(SER[0], 50, ...SER[2])}<span style="font-family:Manrope;font-weight:800;font-size:22px;letter-spacing:.1em;color:${TXT}">${SER[1]}</span><span style="font-family:Manrope;font-weight:800;font-size:22px;color:${SUB}">${N}/${COUNT[post]}</span>`);
const title = (l1, l2, top = 170, size = 76) => el(uiL, { left: 64, top, width: W - 128, fontFamily: 'Fredoka', fontWeight: 600, fontSize: size, lineHeight: 1.12, color: TXT }, `<div>${l1}</div>${l2 ? `<div style="color:${DARK ? '#FF9F0A' : C.green}">${l2}</div>` : ''}`);
const swipe = (txt = 'Swipe') => { if (N < COUNT[post]) el(uiL, { left: 'auto', top: 'auto', right: 64, bottom: 56, display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Manrope', fontWeight: 800, fontSize: 28, color: SUB }, `${txt}${glyph('arrow', 34, SUB)}`); };
const ccard = (x, y, w, h, css = {}) => el(uiL, Object.assign({ left: x, top: y, width: w, height: h, borderRadius: 46, background: DARK ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.9)',
  border: DARK ? '1px solid rgba(255,255,255,.12)' : '1px solid rgba(255,255,255,.9)', boxShadow: DARK ? '0 20px 50px rgba(0,0,0,.3)' : '0 1px 2px rgba(22,59,50,.06), 0 22px 50px rgba(22,59,50,.12)', overflow: 'hidden' }, css));
function roviko(x, y, d, st) { const px = d * 340 / 200, box = el(uiL, { left: x - px / 2, top: y - px / 2, width: px, height: px, zIndex: 30 }); const m = Mascot(box, px); S(m.svg, { left: 0, top: 0 }); drawMascot(m, Object.assign({ legs: 1 }, st)); }
const M = {
  wave: { mouth: 'smile', cheeks: 0.5, arms: [[-112, 66, 22, 10], [118, -86, -18, 10]] }, think: { look: [-0.7, -0.8], mouth: 'flat', brow: 1, arms: [[-112, 66, 22, 10], [40, 30, -40, 10]] },
  cool: { mouth: 'smile', brow: 1, shades: { on: 1, drop: 0 }, arms: [[-90, 40, 30, 10], [90, 40, -30, 10]] }, shock: { mouth: 'o', eyesBig: 0.6, brows: 'up', arms: [[-92, -58, -30, 11], [92, -58, -30, 11]] },
  cheer: { happy: 1, mouth: 'grin', cheeks: 0.9, arms: [[-118, -92, -22, 11], [118, -92, -22, 11]] }, scared: { mouth: 'wobble', brows: 'worried', sweat: 1, eyesBig: 0.4, arms: [[-34, -6, -30, 11], [34, -6, -30, 11]] },
};
const abc = (opts, y, { right = -1, flags = null } = {}) => {
  const c = ccard(64, y, W - 128, opts.length * 132);
  opts.forEach((o, i) => el(c, { left: 0, top: i * 132, width: W - 128, height: 132, background: i === right ? 'rgba(48,199,89,.14)' : 'transparent', borderTop: i ? `2px solid ${IOS.sep}` : 'none' },
    `<div style="display:flex;align-items:center;gap:26px;height:132px;padding:0 36px">${flags ? flagW(flags[i], 56) : `<span style="width:64px;height:64px;border-radius:32px;background:${IOS.fill};display:grid;place-items:center;font-family:Manrope;font-weight:800;font-size:28px;color:${C.forest}">${'ABC'[i]}</span>`}<span style="flex:1;font-family:Fredoka;font-weight:600;font-size:52px;color:${C.forest}">${o}</span>${i === right ? glyph('check', 60, IOS.green) : ''}</div>`));
  return c;
};

// ------------------------------------------------------------------ the posts
const FRIEND = [['Which city is further north?', ['London', 'Calgary'], 0, 'London (51.5°N) is a little further north than Calgary (51.0°N).'],
  ['Which country has more people?', ['Nigeria', 'Russia'], 0, 'Nigeria has over 200 million people. Russia about 145 million.'],
  ['Smallest country in Africa?', ['Gambia', 'Seychelles', 'Djibouti'], 1, 'The Seychelles: a group of islands, about 460&nbsp;km².'],
  ['Which of these flags shows a map of the country?', ['Cyprus', 'Malta', 'Greece'], 0, 'Cyprus: the island in copper on white.'],
  ['Longest coastline in the world?', ['Norway', 'Canada', 'Indonesia'], 1, 'Canada, by far. Even Norway’s fjords can’t beat it.']];
const HAUNT = [['Someone says the capital of Australia is Sydney.', 'It’s Canberra. Sydney is just the biggest city.'], ['Niger and Nigeria are two different countries…', '…and they’re neighbours.'],
  ['On the map, Greenland looks as big as Africa.', 'Africa is 14 times bigger. The map lied.'], ['Chad and Romania have the same flag.', 'Almost: only the shade of blue is different.'],
  ['Kazakhstan’s capital was Astana, then Nur-Sultan…', '…and since 2022 it’s Astana again.'], ['Iceland sounds icy. Greenland sounds green.', 'Greenland is about 80% ice. Iceland is mostly not.']];
const WEEK = [['Nepal’s flag is the only one that isn’t a…?', 'Rectangle'], ['Which is bigger: Germany or Japan?', 'Japan'], ['Capital of Australia?', 'Canberra'], ['Senegal’s flag has a green…?', 'Star'],
  ['Which is bigger: Spain or Sweden?', 'Spain'], ['The only landlocked country in Southeast Asia?', 'Laos'], ['Ljubljana is the capital of…?', 'Slovenia']];

const P = {
  friend: () => {
    if (N === 1) {
      title('Send this to your', 'smartest friend', 200, 92);
      el(uiL, { left: 64, top: 440, fontFamily: 'Fredoka', fontWeight: 500, fontSize: 44, color: SUB }, '5 questions. No googling. Compare scores.');
      const c1 = chatBubble('you think you’re good at geography?', { x: 64, y: 600, size: 42, parent: uiL }), c2 = chatBubble('prove it.', { x: 0, y: 740, me: true, size: 42, parent: uiL });
      LAYOUT.push(() => S(c2, { left: W - 64 - c2.getBoundingClientRect().width }));
      roviko(860, 1080, 230, M.cool); swipe('Start');
    } else if (N <= 6) {
      const [q, opts, , ] = FRIEND[N - 2];
      el(uiL, { left: 64, top: 180, fontFamily: 'Manrope', fontWeight: 800, fontSize: 28, letterSpacing: '.12em', color: SUB }, `QUESTION ${N - 1} OF 5`);
      title(q, null, 230, 70);
      abc(opts, 600);
      el(uiL, { left: 64, top: 'auto', bottom: 56, display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Manrope', fontWeight: 800, fontSize: 28, color: SUB }, `${glyph('eye', 34, SUB)}Answers on slide 7`);
      roviko(900, 1080, 170, M.think); swipe();
    } else if (N === 7) {
      title('Answers', null, 180, 76);
      FRIEND.forEach(([q, opts, r, why], i) => el(uiL, { left: 64, top: 300 + i * 190, width: W - 128 }, `<div style="display:flex;gap:22px;align-items:flex-start">${glyph('check', 56, IOS.green)}<div><div style="font-family:Fredoka;font-weight:600;font-size:44px;color:${C.forest}">${i + 1}. ${opts[r]}</div><div style="font-family:Manrope;font-weight:600;font-size:30px;color:${IOS.grey};line-height:1.3">${why}</div></div></div>`));
      swipe();
    } else {
      title('Your score?', 'Now send it to your friend', 180, 80);
      [['5', 'Geography genius', IOS.green], ['3–4', 'Seasoned traveller', IOS.blue], ['1–2', 'Tourist', IOS.orange], ['0', 'Lost at the airport', IOS.red]].forEach(([s, n, c], i) =>
        el(uiL, { left: 64, top: 440 + i * 150, width: W - 128, height: 128, borderRadius: 34, background: 'rgba(255,255,255,.9)', boxShadow: '0 12px 30px rgba(22,59,50,.1)' },
          `<div style="display:flex;align-items:center;gap:28px;height:128px;padding:0 34px"><span style="min-width:120px;height:80px;padding:0 20px;border-radius:40px;background:${c};color:#fff;display:grid;place-items:center;font-family:Fredoka;font-weight:700;font-size:44px">${s}</span><span style="font-family:Fredoka;font-weight:600;font-size:50px;color:${C.forest}">${n}</span></div>`));
      el(uiL, { left: 64, top: 1080, display: 'flex', alignItems: 'center', gap: '16px', fontFamily: 'Manrope', fontWeight: 800, fontSize: 32, color: C.forest }, `${glyph('send', 44, IOS.blue)}Send it. Whoever scores lower picks dinner.`);
    }
  },
  haunted: () => {
    if (N === 1) {
      el(uiL, { left: 0, top: 230, width: W, display: 'flex', justifyContent: 'center', gap: '30px' }, `${glyph('ghost', 170, '#F6F3E9')}${glyph('pumpkin', 170, '#FF9F0A')}`);
      el(uiL, { left: 64, top: 480, width: W - 128, textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 96, lineHeight: 1.05, color: TXT }, 'The haunted house<br><span style="color:#FF9F0A">of geography</span>');
      el(uiL, { left: 64, top: 760, width: W - 128, textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 500, fontSize: 46, color: SUB }, '6 rooms. Every geography fan’s nightmare.');
      roviko(540, 1060, 200, M.scared); swipe('Enter if you dare');
    } else if (N <= 7) {
      const [scare, truth] = HAUNT[N - 2];
      el(uiL, { left: 64, top: 190, display: 'flex', alignItems: 'center', gap: '16px' }, `${glyph(N % 2 ? 'ghost' : 'pumpkin', 64, N % 2 ? '#F6F3E9' : '#FF9F0A')}<span style="font-family:Manrope;font-weight:800;font-size:30px;letter-spacing:.14em;color:#FF9F0A">ROOM ${N - 1}</span>`);
      el(uiL, { left: 64, top: 300, width: W - 128, fontFamily: 'Fredoka', fontWeight: 600, fontSize: 72, lineHeight: 1.15, color: TXT }, scare);
      const c = ccard(64, 780, W - 128, 300, { background: 'rgba(255,255,255,.95)' });
      el(c, { left: 0, top: 0, width: W - 128, height: 300 }, `<div style="padding:40px 44px"><div style="display:flex;align-items:center;gap:14px;font-family:Manrope;font-weight:800;font-size:26px;letter-spacing:.12em;color:${IOS.green}">${glyph('check', 40, IOS.green)}THE TRUTH</div><div style="font-family:Fredoka;font-weight:600;font-size:54px;line-height:1.2;color:${C.forest};margin-top:16px">${truth}</div></div>`);
      swipe('Next room');
    } else {
      el(uiL, { left: 64, top: 220, width: W - 128, textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 88, lineHeight: 1.1, color: TXT }, 'Which room<br><span style="color:#FF9F0A">haunts you most?</span>');
      el(uiL, { left: 64, top: 480, width: W - 128, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }, [1, 2, 3, 4, 5, 6].map(i => `<div style="height:150px;border-radius:34px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;gap:12px">${glyph(i % 2 ? 'ghost' : 'pumpkin', 52, i % 2 ? '#F6F3E9' : '#FF9F0A')}<span style="font-family:Fredoka;font-weight:700;font-size:64px;color:#F6F3E9">${i}</span></div>`).join(''));
      el(uiL, { left: 64, top: 860, width: W - 128, textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 500, fontSize: 46, color: SUB }, 'Comment the room number. Add your own nightmare.');
      roviko(540, 1120, 170, M.scared);
    }
  },
  zoom: () => {
    const VIEWS = [[15.5, 42.75, 18.5, 44.0], [13.2, 41.8, 20.4, 46.6], [6, 38, 30, 50], [5, 37, 31, 51]];
    if (N <= 4) {
      const [lo0, la0, lo1, la1] = VIEWS[N - 1];
      title(N === 1 ? 'Which country?' : N === 4 ? 'It’s <span style="color:' + C.green + '">Croatia</span>' : 'Zooming out…', N === 1 ? 'Swipe to zoom out' : N === 4 ? null : 'Got it yet?', 170, 76);
      const B = { x: 64, y: 400, w: W - 128, h: 780 };
      const k = Math.min(B.w / (lo1 - lo0), B.h / (la1 - la0)), ox = B.x + (B.w - k * (lo1 - lo0)) / 2, oy = B.y + (B.h - k * (la1 - la0)) / 2;
      const pt = (lo, la) => [ox + (lo - lo0) * k, oy + (la1 - la) * k];
      const s = svgEl(el(uiL, { width: W, height: H, zIndex: 10 }), 'svg', { width: W, height: H }); s.style.position = 'absolute';
      const cid = 'zc', defs = svgEl(s, 'defs'); svgEl(svgEl(defs, 'clipPath', { id: cid }), 'rect', { x: B.x, y: B.y, width: B.w, height: B.h, rx: 46 });
      const g = svgEl(s, 'g', { 'clip-path': `url(#${cid})` });
      svgEl(g, 'rect', { x: B.x, y: B.y, width: B.w, height: B.h, fill: '#BFE4F8' });
      const ringD = r => r.map(([lo, la], i) => { const [x, y] = pt(lo, la); return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }).join('') + 'Z';
      for (const iso in GEO) svgEl(g, 'path', { d: GEO[iso].map(p => p.map(ringD).join('')).join(''), fill: iso === 'HRV' && N === 4 ? IOS.green : '#CFE9DA', stroke: '#fff', 'stroke-width': N < 3 ? 3 : 1.5, 'fill-rule': 'evenodd' });
      (window.GEO_EXTRA || []).forEach(r => svgEl(g, 'path', { d: ringD(r), fill: '#CFE9DA', stroke: '#fff', 'stroke-width': 1.5 }));
      el(uiL, { left: 64, top: 400, width: W - 128, height: 780, borderRadius: 46, zIndex: 11, boxShadow: 'inset 0 0 0 1px rgba(22,59,50,.08)' });
      if (N === 4) el(uiL, { left: 100, top: 430, zIndex: 12 }, `<div style="display:flex;align-items:center;gap:18px;padding:16px 24px;border-radius:30px;background:rgba(255,255,255,.95);box-shadow:0 10px 24px rgba(22,59,50,.15)">${flagW('hr', 70)}<span style="font-family:Fredoka;font-weight:600;font-size:46px;color:${C.forest}">Croatia</span></div>`);
      el(uiL, { left: 64, top: 'auto', bottom: 56, fontFamily: 'Manrope', fontWeight: 800, fontSize: 28, color: SUB }, `ZOOM ${N}/4`);
      swipe(N === 3 ? 'Last chance' : 'Zoom out');
    } else {
      title('How many swipes', 'did you need?', 180, 80);
      const c = ccard(64, 440, W - 128, 380);
      el(c, { left: 0, top: 0, width: W - 128, height: 380 }, `<div style="padding:44px"><div style="display:flex;align-items:center;gap:14px;font-family:Manrope;font-weight:800;font-size:26px;letter-spacing:.12em;color:${IOS.grey}">${glyph('bulb', 40, IOS.orange)}DID YOU KNOW</div><div style="font-family:Fredoka;font-weight:600;font-size:54px;line-height:1.2;color:${C.forest};margin-top:16px">Croatia has more than 1,000 islands. Slide 1 was the coast near Dubrovnik.</div></div>`);
      el(uiL, { left: 64, top: 880, fontFamily: 'Fredoka', fontWeight: 500, fontSize: 46, color: SUB }, 'Comment 1, 2, 3 or 4. Which country next?');
      roviko(880, 1120, 170, M.cheer);
    }
  },
  monaco: () => {
    const F = [['mc', 'Monaco', 1.25, 'Red on white, a bit squarer (4:5)'], ['id', 'Indonesia', 1.5, 'Red on white, longer (2:3)'], ['pl', 'Poland', 1.6, 'White on top, red below']];
    if (N === 1) {
      title('Monaco, Indonesia or Poland?', 'Name all 3', 170, 70);
      F.forEach(([c], i) => { const e = ccard(64, 400 + i * 270, W - 128, 240); el(e, { left: 40, top: 30, height: 180, display: 'flex', alignItems: 'center', gap: '40px' }, `${flagW(c, 180)}<span style="width:90px;height:90px;border-radius:45px;background:${IOS.fill};display:grid;place-items:center;font-family:Fredoka;font-weight:600;font-size:52px;color:${C.forest}">${'ABC'[i]}</span>`); });
      swipe('Answers');
    } else if (N === 2) {
      title('Here’s how to tell', null, 170, 76);
      F.forEach(([c, n, , why], i) => { const e = ccard(64, 320 + i * 290, W - 128, 260); el(e, { left: 40, top: 40, height: 180, display: 'flex', alignItems: 'center', gap: '36px' }, `${flagW(c, 180)}<div><div style="display:flex;align-items:center;gap:12px">${glyph('check', 46, IOS.green)}<span style="font-family:Fredoka;font-weight:600;font-size:56px;color:${C.forest}">${'ABC'[i]}: ${n}</span></div><div style="font-family:Manrope;font-weight:700;font-size:30px;color:${IOS.grey};margin-top:6px">${why}</div></div>`); });
      swipe();
    } else if (N === 3) {
      title('Same flag.', 'Very different countries', 170, 76);
      const c = ccard(64, 420, W - 128, 640);
      el(c, { left: 0, top: 0, width: W - 128, height: 640 }, `<div style="padding:44px;display:flex;flex-direction:column;gap:30px">
        <div style="display:flex;align-items:center;gap:26px">${flagW('mc', 80)}<span style="font-family:Fredoka;font-weight:600;font-size:50px;color:${C.forest}">Monaco: 2&nbsp;km²</span></div>
        <div style="display:flex;align-items:center;gap:26px">${flagW('id', 80)}<span style="font-family:Fredoka;font-weight:600;font-size:50px;color:${C.forest}">Indonesia: 1.9 million km²</span></div>
        <div style="padding:28px 32px;border-radius:30px;background:rgba(48,199,89,.12)"><div style="font-family:Fredoka;font-weight:700;font-size:64px;color:${IOS.green};line-height:1.1">~940,000×</div><div style="font-family:Fredoka;font-weight:500;font-size:42px;color:${C.forest}">Indonesia is about 940,000 times bigger than Monaco.</div></div></div>`);
      roviko(900, 1140, 160, M.shock); swipe();
    } else {
      title('Which flag twins', 'should we do next?', 180, 80);
      [['Chad', 'td', 'Romania', 'ro'], ['Ireland', 'ie', 'Ivory Coast', 'ci'], ['Norway', 'no', 'Iceland', 'is']].forEach(([a, fa, b, fb], i) =>
        el(uiL, { left: 64, top: 440 + i * 180, width: W - 128, height: 150, borderRadius: 36, background: 'rgba(255,255,255,.9)', boxShadow: '0 12px 30px rgba(22,59,50,.1)' },
          `<div style="display:flex;align-items:center;gap:20px;height:150px;padding:0 34px">${flagW(fa, 70)}<span style="font-family:Fredoka;font-weight:600;font-size:42px;color:${C.forest}">${a}</span><span style="font-family:Manrope;font-weight:800;font-size:26px;color:${IOS.grey}">VS</span>${flagW(fb, 70)}<span style="font-family:Fredoka;font-weight:600;font-size:42px;color:${C.forest}">${b}</span></div>`));
      el(uiL, { left: 64, top: 1010, fontFamily: 'Fredoka', fontWeight: 500, fontSize: 44, color: SUB }, 'Comment your pick, or a pair we missed.');
    }
  },
  week: () => {
    if (N === 1) {
      title('This week in', '7 questions', 200, 96);
      el(uiL, { left: 64, top: 460, fontFamily: 'Fredoka', fontWeight: 500, fontSize: 46, color: SUB }, 'Keep score. Then compare with a friend.');
      const c = ccard(64, 580, W - 128, 300); el(c, { left: 0, top: 0, width: W - 128, height: 300 }, `<div style="display:flex;align-items:center;justify-content:space-around;height:300px">${['flag', 'globe', 'map', 'columns'].map((g, i) => iconTile(g, 130, ...[['#FF6B5E', '#E5484D'], ['#34C759', '#1F806B'], ['#5AC8FA', '#0A84FF'], ['#FFCC00', '#FF9500']][i])).join('')}</div>`);
      roviko(860, 1110, 190, M.cool); swipe('Start');
    } else if (N <= 3) {
      const qs = N === 2 ? WEEK.slice(0, 4) : WEEK.slice(4);
      title(N === 2 ? 'Questions 1–4' : 'Questions 5–7', null, 170, 70);
      qs.forEach(([q], i) => el(uiL, { left: 64, top: 300 + i * 220, width: W - 128, height: 196, borderRadius: 38, background: 'rgba(255,255,255,.9)', boxShadow: '0 12px 30px rgba(22,59,50,.1)' },
        `<div style="display:flex;align-items:center;gap:26px;height:196px;padding:0 34px"><span style="width:76px;height:76px;border-radius:38px;background:${C.forest};color:#fff;display:grid;place-items:center;font-family:Fredoka;font-weight:700;font-size:40px;flex:none">${(N === 2 ? 1 : 5) + i}</span><span style="font-family:Fredoka;font-weight:600;font-size:46px;line-height:1.2;color:${C.forest}">${q}</span></div>`));
      swipe(N === 3 ? 'Answers' : 'Next');
    } else if (N === 4) {
      title('Answers', null, 170, 76);
      WEEK.forEach(([, a], i) => el(uiL, { left: 64, top: 290 + i * 128, width: W - 128 }, `<div style="display:flex;align-items:center;gap:22px">${glyph('check', 54, IOS.green)}<span style="font-family:Fredoka;font-weight:600;font-size:52px;color:${C.forest}">${i + 1}. ${a}</span></div>`));
      swipe();
    } else {
      title('Your score: __ / 7', 'Beat it every day', 180, 80);
      const c = ccard(64, 440, W - 128, 520);
      el(c, { left: 0, top: 0, width: W - 128, height: 520 }, `<div style="padding:46px;display:flex;flex-direction:column;gap:26px">
        <div style="display:flex;align-items:center;gap:24px"><span style="width:120px;height:120px;border-radius:30px;background:#fff;display:grid;place-items:center;box-shadow:0 0 0 1px rgba(0,0,0,.06), 0 10px 24px rgba(22,59,50,.14)"><img src="${ASSETS}roviko-globe.svg" style="width:92px;height:92px"></span><div><div style="font-family:Fredoka;font-weight:700;font-size:64px;color:${C.forest};line-height:1">Roviko</div><div style="font-family:Manrope;font-weight:700;font-size:30px;color:${IOS.grey}">iPhone and iPad</div></div></div>
        <div style="font-family:Fredoka;font-weight:500;font-size:44px;line-height:1.3;color:${C.forest}">New geography games every day: clues, flags, maps and duels. Keep your streak, fill your passport.</div>
        <div style="display:flex;gap:14px">${['Free', 'No ads', 'No account'].map(x => `<span style="display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:999px;background:${IOS.fill};font-family:Manrope;font-weight:800;font-size:28px;color:${C.forest}">${glyph('check', 30, IOS.green)}${x}</span>`).join('')}</div></div>`);
      el(uiL, { left: 64, top: 1010, fontFamily: 'Fredoka', fontWeight: 500, fontSize: 44, color: SUB }, 'Comment your score. Link in bio.');
    }
  },
};
P[post]();
window.filmReady = (async () => {
  await Promise.all(['500 20px Fredoka', '600 28px Fredoka', '700 28px Fredoka', '700 13px Manrope', '800 13px Manrope'].map(f => document.fonts.load(f)));
  await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  LAYOUT.forEach(f => f()); return true;
})();
