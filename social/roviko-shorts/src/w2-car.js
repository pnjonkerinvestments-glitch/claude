/*
  Roviko content week 2 (26 Oct - 1 Nov 2026): the photo carousels, 1080x1350 (4:5). w2-car.html?id=twins1-1 … twins7-5, halloween-1 … -7
  twins<d>: post 1 of every day, built like the post that went big (Monaco, Indonesia or Poland, 10.3K views): 1 name all 3 (or 4),
  2 the answers and how to tell, 3 magnifiers on the detail, 4 one fact, 5 which twins next. halloween: Saturday's post 5, real
  places with scary names. Rendered by build/w2-car.mjs. Areas: roviko.app data.
*/
// @scripts lib/ios.js lib/flagratio.js
const id = Q.get('id') || 'twins1-1', [post, nStr] = id.split('-'), N = +nStr;
const W = 1080, H = 1350, DARK = post === 'halloween';
S(document.body, { width: W, height: H }); S(stage, { width: W, height: H, overflow: 'hidden' });
S(stage, { background: DARK ? 'radial-gradient(900px 700px at 80% 10%, rgba(255,149,0,.22), transparent 70%), radial-gradient(900px 800px at 10% 90%, rgba(175,82,222,.25), transparent 70%), #11231D'
  : 'radial-gradient(900px 700px at 85% 8%, rgba(31,128,107,.10), transparent 70%), radial-gradient(1000px 900px at 15% 85%, rgba(54,179,245,.10), transparent 70%), #F6F3E9' });
const uiL = el(stage, { width: W, height: H, zIndex: 20 });
const TXT = DARK ? '#F6F3E9' : C.forest, SUB = DARK ? 'rgba(246,243,233,.6)' : IOS.grey, ACC = DARK ? '#FF9F0A' : C.green;
const COUNT = DARK ? 7 : 5;
const SER = DARK ? ['ghost', 'HALLOWEEN', ['#FF9F0A', '#FF6B00']] : ['flag', 'FLAG TWINS', ['#FF6B5E', '#E5484D']];
el(uiL, { left: 64, top: 60, height: 70, display: 'flex', alignItems: 'center', gap: '14px' }, `<img src="${ASSETS}roviko-globe.svg" style="width:52px;height:52px"><span style="font-family:Fredoka;font-weight:600;font-size:42px;color:${TXT}">roviko</span>`);
el(uiL, { left: 'auto', right: 64, top: 64, height: 62, display: 'flex', alignItems: 'center', gap: '12px', padding: '0 20px 0 6px', borderRadius: 31, background: DARK ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.85)' },
  `${iconTile(SER[0], 50, ...SER[2])}<span style="font-family:Manrope;font-weight:800;font-size:22px;letter-spacing:.1em;color:${TXT}">${SER[1]}</span><span style="font-family:Manrope;font-weight:800;font-size:22px;color:${SUB}">${N}/${COUNT}</span>`);
const title = (l1, l2, top = 170, size = 76) => el(uiL, { left: 64, top, width: W - 128, fontFamily: 'Fredoka', fontWeight: 600, fontSize: size, lineHeight: 1.12, color: TXT }, `<div>${l1}</div>${l2 ? `<div style="color:${ACC}">${l2}</div>` : ''}`);
const swipe = (txt = 'Swipe') => { if (N < COUNT) el(uiL, { left: 'auto', top: 'auto', right: 64, bottom: 56, display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Manrope', fontWeight: 800, fontSize: 28, color: SUB }, `${txt}${glyph('arrow', 34, SUB)}`); };
const ccard = (x, y, w, h, css = {}) => el(uiL, Object.assign({ left: x, top: y, width: w, height: h, borderRadius: 46, background: DARK ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.9)',
  border: DARK ? '1px solid rgba(255,255,255,.12)' : '1px solid rgba(255,255,255,.9)', boxShadow: DARK ? '0 20px 50px rgba(0,0,0,.3)' : '0 1px 2px rgba(22,59,50,.06), 0 22px 50px rgba(22,59,50,.12)', overflow: 'hidden' }, css));
const badge = (ch, d = 90) => `<span style="width:${d}px;height:${d}px;border-radius:${d / 2}px;background:${IOS.fill};display:grid;place-items:center;font-family:Fredoka;font-weight:600;font-size:${d * 0.58}px;color:${C.forest};flex:none">${ch}</span>`;
const lens = (code, h, fx, fy, zoom, r) => { const w = h * FRATIO[code], fw = w * zoom, fh = h * zoom;
  return `<span style="display:block;width:${2 * r}px;height:${2 * r}px;border-radius:${r}px;border:8px solid #fff;box-shadow:0 18px 40px rgba(22,59,50,.25);background:url(${FLAG_W}${code}.svg) ${(r - 8 - fx * fw).toFixed(1)}px ${(r - 8 - fy * fh).toFixed(1)}px / ${fw.toFixed(1)}px ${fh.toFixed(1)}px no-repeat"></span>`; };

// ------------------------------------------------------------------ the twins: [code, name, how to tell, lens [fx, fy, zoom, label]]
const TWINS = {
  1: { cover: ['Romania, Andorra, Chad', 'or Moldova? Name all 4'], flags: [['ro', 'Romania', 'Brighter blue, nothing on it', [.17, .5, 3, 'Brighter blue']], ['ad', 'Andorra', 'A coat of arms in the middle', [.5, .5, 2.4, 'Two cows on the shield']],
      ['td', 'Chad', 'Darker blue, nothing on it', [.17, .5, 3, 'Darker blue']], ['md', 'Moldova', 'An eagle in the middle', [.5, .48, 2.4, 'An eagle']]],
    fact: { t: ['Same colours.', 'Very different sizes'], big: ['~2,700×', 'Chad is about 2,700 times bigger than Andorra.'], note: 'Chad and Romania didn’t copy each other: Romania’s colours go back to 1848, Chad chose its flag in 1959.' },
    next: [['Ireland', 'ie', 'Ivory Coast', 'ci'], ['Norway', 'no', 'Iceland', 'is'], ['Australia', 'au', 'New Zealand', 'nz']] },
  2: { flags: [['ci', 'Ivory Coast', 'Orange next to the pole', [.12, .5, 2.4, 'Orange by the pole']], ['it', 'Italy', 'Green, white and red', [.85, .5, 2.4, 'Red at the end']],
      ['ie', 'Ireland', 'Green next to the pole, a longer flag', [.1, .5, 2.4, 'Green by the pole']]],
    fact: { t: ['Ireland’s flag', 'has a meaning'], rows: [['#169B62', 'Green: the Irish Catholic tradition'], ['#FF883E', 'Orange: the Protestant followers of William of Orange'], ['#FFFFFF', 'White: peace between the two']],
      note: 'Ivory Coast uses the same colours, mirrored: orange comes first.' },
    next: [['Colombia', 'co', 'Ecuador', 'ec'], ['Slovenia', 'si', 'Slovakia', 'sk'], ['Netherlands', 'nl', 'Luxembourg', 'lu']] },
  3: { cover: ['Venezuela, Colombia', 'or Ecuador? Name all 3'], flags: [['ve', 'Venezuela', 'Equal stripes, an arc of 8 stars', [.5, .5, 1.6, '8 stars']], ['co', 'Colombia', 'Yellow takes up half, nothing on it', [.5, .5, 1.8, 'Nothing in the middle']],
      ['ec', 'Ecuador', 'Like Colombia, plus a condor', [.5, .42, 2.4, 'A condor']]],
    fact: { t: ['Three flags,', 'one old country'], flagsRow: ['co', 've', 'ec'], note: 'All three were once one country: Gran Colombia (1819–1831). That’s why they share yellow, blue and red.' },
    next: [['Norway', 'no', 'Iceland', 'is'], ['Australia', 'au', 'New Zealand', 'nz'], ['Senegal', 'sn', 'Mali', 'ml']] },
  4: { flags: [['is', 'Iceland', 'A red cross on blue', [.36, .5, 2.2, 'Red cross, white edge']], ['dk', 'Denmark', 'A white cross on red', [.38, .5, 2.2, 'Just a white cross']],
      ['no', 'Norway', 'A blue cross on red', [.36, .5, 2.2, 'Blue cross, white edge']]],
    fact: { t: ['One cross,', 'five countries'], flagsRow: ['dk', 'no', 'se', 'fi', 'is'], note: 'Denmark’s flag is often called the oldest national flag still in use. All five Nordic countries use its cross.' },
    next: [['Netherlands', 'nl', 'Luxembourg', 'lu'], ['Slovenia', 'si', 'Russia', 'ru'], ['Mexico', 'mx', 'Italy', 'it']] },
  5: { cover: ['Luxembourg, Paraguay', 'or Netherlands? Name all 3'], flags: [['lu', 'Luxembourg', 'Lighter blue, a bit longer', [.5, .84, 2.6, 'Light blue']], ['py', 'Paraguay', 'A seal in the middle', [.5, .5, 2.6, 'A seal']],
      ['nl', 'Netherlands', 'Darker blue', [.5, .84, 2.6, 'Dark blue']]],
    fact: { t: ['Flip it over:', 'Paraguay is different'], flagsRow: ['py'], note: 'Paraguay’s flag has a different seal on each side: the coat of arms on the front, the treasury seal on the back. Almost no flag does that.' },
    next: [['Slovenia', 'si', 'Slovakia', 'sk'], ['Australia', 'au', 'New Zealand', 'nz'], ['Egypt', 'eg', 'Iraq', 'iq']] },
  6: { flags: [['sk', 'Slovakia', 'A big shield: a double cross on 3 hills', [.34, .5, 2.2, 'Double cross']], ['ru', 'Russia', 'No shield at all', [.25, .5, 2, 'Nothing']],
      ['si', 'Slovenia', 'A small shield: a mountain and 3 stars', [.25, .3, 3.4, 'Mount Triglav']]],
    fact: { t: ['Same stripes.', 'Very different sizes'], big: ['~840×', 'Russia is about 840 times bigger than Slovenia.'], note: 'The mountain on Slovenia’s shield is Triglav (2,864&nbsp;m), its highest peak.' },
    next: [['Australia', 'au', 'New Zealand', 'nz'], ['Egypt', 'eg', 'Iraq', 'iq'], ['Senegal', 'sn', 'Mali', 'ml']] },
  7: { cover: ['New Zealand, Tuvalu,', 'Australia or Fiji? Name all 4'], flags: [['nz', 'New Zealand', '4 red stars', [.75, .5, 1.6, '4 red stars']], ['tv', 'Tuvalu', 'Light blue, 9 yellow stars', [.75, .5, 1.5, '9 stars, 9 islands']],
      ['au', 'Australia', '6 white stars', [.25, .75, 2, 'A 7-point star']], ['fj', 'Fiji', 'Light blue, a shield', [.75, .5, 2, 'A shield']]],
    fact: { t: ['New Zealand voted', 'on a new flag'], flagsRow: ['nz'], note: 'In 2016 New Zealanders voted on swapping their flag for a silver fern design. The old flag won, about 57% to 43%.' },
    next: [['Egypt', 'eg', 'Iraq', 'iq'], ['Senegal', 'sn', 'Mali', 'ml'], ['Mexico', 'mx', 'Italy', 'it']] },
};
const HAUNT = [['Hell', 'no', 'Norway', 'flame', 'A real village near Trondheim. And yes: in winter, Hell freezes over.'],
  ['Skeleton Coast', 'na', 'Namibia', 'ghost', 'Named after the whale bones and shipwrecks along its foggy shore.'],
  ['Transylvania', 'ro', 'Romania', 'mountain', 'A real region of Romania. Bran Castle here is sold as “Dracula’s castle”.'],
  ['Death Valley', 'us', 'United States', 'flame', 'The hottest air temperature ever recorded on Earth: 56.7&nbsp;°C, in 1913.'],
  ['Island of the Dolls', 'mx', 'Mexico', 'eye', 'In the canals of Xochimilco, Mexico City: an island full of old dolls hanging from the trees.']];

function twins(T) {
  const F = T.flags, n = F.length, names = F.map(f => f[1]);
  if (N === 1) {
    if (T.cover) title(T.cover[0], T.cover[1], 170, 66); else title(`${names[0]}, ${names[1]} or ${names[2]}?`, `Name all ${n}`, 170, 70);
    const top = n === 4 ? 420 : 400, step = n === 4 ? 208 : 270, ch = n === 4 ? 188 : 240, fh = n === 4 ? 138 : 180;
    F.forEach(([c], i) => { const e = ccard(64, top + i * step, W - 128, ch); el(e, { left: 40, top: (ch - fh) / 2, height: fh, display: 'flex', alignItems: 'center', gap: '40px' }, `${flagW(c, fh)}${badge('ABCD'[i], n === 4 ? 80 : 90)}`); });
    swipe('Answers');
  } else if (N === 2) {
    title('Here’s how to tell', null, 170, 76);
    const top = n === 4 ? 300 : 320, step = n === 4 ? 230 : 290, ch = n === 4 ? 210 : 260, fh = n === 4 ? 130 : 170;
    F.forEach(([c, nm, why], i) => { const e = ccard(64, top + i * step, W - 128, ch); el(e, { left: 36, top: (ch - fh) / 2, height: fh, display: 'flex', alignItems: 'center', gap: '32px' },
      `${flagW(c, fh)}<div><div style="display:flex;align-items:center;gap:12px">${glyph('check', 44, IOS.green)}<span style="font-family:Fredoka;font-weight:600;font-size:${n === 4 ? 48 : 54}px;color:${C.forest}">${'ABCD'[i]}: ${nm}</span></div><div style="font-family:Manrope;font-weight:700;font-size:${n === 4 ? 26 : 29}px;color:${IOS.grey};margin-top:6px;max-width:${W - 128 - 72 - fh * FRATIO[c] - 32}px;line-height:1.3">${why}</div></div>`); });
    swipe('Zoom in');
  } else if (N === 3) {
    title('The detail', 'that gives it away', 170, 76);
    const r = n === 4 ? 150 : 140, cols = n === 4 ? 2 : 3, cw = (W - 128) / cols;
    F.forEach(([c, nm, , [fx, fy, z, lab]], i) => {
      const x = 64 + (i % cols) * cw, y = (n === 4 ? 390 : 520) + Math.floor(i / cols) * 430;
      el(uiL, { left: x, top: y, width: cw, textAlign: 'center' }, `<div style="display:flex;flex-direction:column;align-items:center;gap:16px">${lens(c, n === 4 ? 230 : 240, fx, fy, z, r)}<span style="display:inline-block;padding:8px 20px;border-radius:999px;background:${C.forest};color:#fff;font-family:Manrope;font-weight:800;font-size:24px;white-space:nowrap">${lab}</span><span style="font-family:Fredoka;font-weight:600;font-size:44px;color:${C.forest}">${nm}</span></div>`);
    });
    swipe();
  } else if (N === 4) {
    const f = T.fact; title(f.t[0], f.t[1], 170, 76);
    const c = ccard(64, 420, W - 128, 700);
    let inner = '';
    if (f.big) inner = `<div style="padding:30px 34px;border-radius:32px;background:rgba(48,199,89,.12)"><div style="font-family:Fredoka;font-weight:700;font-size:110px;color:${IOS.green};line-height:1">${f.big[0]}</div><div style="font-family:Fredoka;font-weight:500;font-size:46px;color:${C.forest};line-height:1.2;margin-top:10px">${f.big[1]}</div></div>`;
    if (f.rows) inner = f.rows.map(([col, txt]) => `<div style="display:flex;align-items:center;gap:26px"><span style="width:90px;height:90px;border-radius:24px;background:${col};flex:none;box-shadow:inset 0 0 0 2px rgba(22,59,50,.12)"></span><span style="font-family:Fredoka;font-weight:500;font-size:42px;line-height:1.2;color:${C.forest}">${txt}</span></div>`).join('');
    if (f.flagsRow) inner = `<div style="display:flex;justify-content:center;flex-wrap:wrap;gap:22px">${f.flagsRow.map(fl => flagW(fl, f.flagsRow.length > 3 ? 92 : f.flagsRow.length > 1 ? 120 : 200)).join('')}</div>`;
    el(c, { left: 0, top: 0, width: W - 128, height: 700 }, `<div style="padding:46px;display:flex;flex-direction:column;gap:34px;height:700px;box-sizing:border-box;justify-content:center">${inner}<div style="display:flex;gap:20px;align-items:flex-start">${iconTile('bulb', 64, '#FFD60A', '#FF9F0A')}<div style="font-family:Fredoka;font-weight:500;font-size:40px;line-height:1.3;color:${C.forest}">${f.note}</div></div></div>`);
    swipe();
  } else {
    title('Which flag twins', 'should we do next?', 180, 80);
    T.next.forEach(([a, fa, b, fb], i) => el(uiL, { left: 64, top: 440 + i * 180, width: W - 128, height: 150, borderRadius: 36, background: 'rgba(255,255,255,.9)', boxShadow: '0 12px 30px rgba(22,59,50,.1)' },
      `<div style="display:flex;align-items:center;gap:20px;height:150px;padding:0 34px"><span style="width:56px;height:56px;border-radius:28px;background:${C.forest};color:#fff;display:grid;place-items:center;font-family:Fredoka;font-weight:700;font-size:30px;flex:none">${i + 1}</span>${flagW(fa, 64)}<span style="font-family:Fredoka;font-weight:600;font-size:40px;color:${C.forest}">${a}</span><span style="font-family:Manrope;font-weight:800;font-size:24px;color:${IOS.grey}">VS</span>${flagW(fb, 64)}<span style="font-family:Fredoka;font-weight:600;font-size:40px;color:${C.forest}">${b}</span></div>`));
    el(uiL, { left: 64, top: 1010, width: W - 128, fontFamily: 'Fredoka', fontWeight: 500, fontSize: 44, color: SUB, lineHeight: 1.3 }, 'Comment 1, 2 or 3. Or a pair we missed.<br>And your score: how many did you get?');
  }
}
function halloween() {
  if (N === 1) {
    el(uiL, { left: 0, top: 230, width: W, display: 'flex', justifyContent: 'center', gap: '30px' }, `${glyph('ghost', 170, '#F6F3E9')}${glyph('pumpkin', 170, '#FF9F0A')}`);
    el(uiL, { left: 64, top: 480, width: W - 128, textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 96, lineHeight: 1.05, color: TXT }, 'Real places with<br><span style="color:#FF9F0A">terrifying names</span>');
    el(uiL, { left: 64, top: 760, width: W - 128, textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 500, fontSize: 46, color: SUB }, '5 places. All real. Would you go?');
    const c = ccard(140, 880, W - 280, 150); el(c, { left: 0, top: 0, width: W - 280, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px' }, HAUNT.map(h => flagW(h[1], 64)).join(''));
    swipe('Enter if you dare');
  } else if (N <= 6) {
    const [name, fl, country, ic, fact] = HAUNT[N - 2];
    el(uiL, { left: 64, top: 190, display: 'flex', alignItems: 'center', gap: '16px' }, `${glyph(N % 2 ? 'ghost' : 'pumpkin', 64, N % 2 ? '#F6F3E9' : '#FF9F0A')}<span style="font-family:Manrope;font-weight:800;font-size:30px;letter-spacing:.14em;color:#FF9F0A">PLACE ${N - 1} OF 5</span>`);
    el(uiL, { left: 64, top: 290, width: W - 128, fontFamily: 'Fredoka', fontWeight: 700, fontSize: name.length > 14 ? 92 : 112, lineHeight: 1.05, color: TXT }, name);
    el(uiL, { left: 64, top: 440, display: 'flex', alignItems: 'center', gap: '22px' }, `${flagW(fl, 70)}<span style="font-family:Fredoka;font-weight:600;font-size:52px;color:${SUB}">${country}</span>`);
    el(uiL, { left: 'auto', right: 40, top: 'auto', bottom: 90, opacity: 0.16 }, glyph(ic, 300, '#F6F3E9'));
    const c = ccard(64, 600, W - 128, 440, { background: 'rgba(255,255,255,.95)' });
    el(c, { left: 0, top: 0, width: W - 128, height: 440 }, `<div style="padding:48px"><div style="display:flex;align-items:center;gap:14px;font-family:Manrope;font-weight:800;font-size:26px;letter-spacing:.12em;color:${IOS.green}">${glyph('check', 40, IOS.green)}100% REAL</div><div style="font-family:Fredoka;font-weight:600;font-size:58px;line-height:1.2;color:${C.forest};margin-top:18px">${fact}</div></div>`);
    swipe('Next place');
  } else {
    el(uiL, { left: 64, top: 200, width: W - 128, textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 88, lineHeight: 1.1, color: TXT }, 'Which one would<br><span style="color:#FF9F0A">you visit?</span>');
    HAUNT.forEach(([name, fl], i) => el(uiL, { left: 64, top: 450 + i * 128, width: W - 128, height: 112, borderRadius: 30, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)' },
      `<div style="display:flex;align-items:center;gap:24px;height:112px;padding:0 30px"><span style="font-family:Fredoka;font-weight:700;font-size:56px;color:#FF9F0A;width:40px">${i + 1}</span>${flagW(fl, 56)}<span style="font-family:Fredoka;font-weight:600;font-size:48px;color:#F6F3E9">${name}</span></div>`));
    el(uiL, { left: 64, top: 1130, width: W - 128, textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 500, fontSize: 44, color: SUB }, 'Comment the number. Know a scarier one?');
  }
}
if (DARK) halloween(); else twins(TWINS[+post.replace('twins', '')]);
window.filmReady = (async () => {
  await Promise.all(['500 20px Fredoka', '600 28px Fredoka', '700 28px Fredoka', '700 13px Manrope', '800 13px Manrope'].map(f => document.fonts.load(f)));
  await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  LAYOUT.forEach(f => f()); return true;
})();
