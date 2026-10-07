/*
  Roviko short 17: "POV: your friend has 'been to Africa'"
  15.9 s, 1080x1920, 120 BPM ("Life is a Dream", Mixkit, from song beat 16). A chat: "I've been to Africa!" "Which country?"
  "…Africa." Roviko facepalms. Then Africa fills up, one country at a time, 54 in total, while a counter rolls up to 54.
  "Africa is 54 countries." "Name 5 that aren't Egypt."
*/
const TEMPO = 119.998, DIL = TEMPO / 130, END = 32, DURATION = END * 60 / TEMPO;
const TL = { m: [-0.4, 2.4, 5.2], palm: 6.4, map: 9, fill: [10, 16.4], count: 16.8, cap2: 22, end: 25.6, hop: 29.6, blink2: 27.8 };
const AFRICA = ["AGO","BDI","BEN","BFA","BWA","CAF","CIV","CMR","COD","COG","COM","CPV","DJI","DZA","EGY","ERI","ETH","GAB","GHA","GIN","GMB","GNB","GNQ","KEN","LBR","LBY","LSO","MAR","MDG","MLI","MOZ","MRT","MUS","MWI","NAM","NER","NGA","RWA","SDN","SEN","SLE","SOM","SSD","STP","SWZ","SYC","TCD","TGO","TUN","TZA","UGA","ZAF","ZMB","ZWE"];
setupStage(C.cream);
const world = el(stage, { width: 1080, height: 1920, zIndex: 1 });
const uiL = el(stage, { width: 1080, height: 1920, zIndex: 20 });
const capL = el(stage, { width: 1080, height: 1920, zIndex: 50 });
Halo(world, 540, 900, 1700);
const chat = [
  FlagMsg(uiL, { emoji: '🧑', name: 'Sam', text: 'I’ve been to Africa! 🌍✈️', y: 470, size: 40 }),
  FlagMsg(uiL, { emoji: '🙂', name: 'You', text: 'Cool! Which country?', y: 640, size: 40 }),
  FlagMsg(uiL, { emoji: '🧑', name: 'Sam', text: '…Africa.', y: 810, size: 40 }),
];
const BOX = { x: 120, y: 400, w: 840, h: 820 };
const map = WorldMap(uiL, { lon: 18, lat: 2, fit: ['DZA', 'ZAF', 'SOM', 'SEN', 'EGY'], box: BOX, pad: 0.04, sea: '#BFE4F8', land: '#E8EEE9', z: 8 });
const PAL = ['#5ED34F', '#F6B84B', '#36B3F5', '#E5484D', '#F6A04D', '#1F806B', '#FF8FA3', '#8FD3FF', '#C9E265'];
const order = AFRICA.map(id => { const c = geoCentre(id); return { id, k: -c.lat * 1.3 + c.lon * 0.2 }; }).sort((a, b) => b.k - a.k).map(o => o.id);   // north to south
order.forEach((id, i) => { const p = map.paths[id]; if (!p) return; p.dataset.b = (TL.fill[0] + (TL.fill[1] - TL.fill[0]) * i / (order.length - 1)).toFixed(3); p.dataset.c = PAL[i % PAL.length]; });
const counter = el(uiL, { left: 540 - 170, top: 1110, width: 340, height: 110, borderRadius: 55, background: C.forest, color: C.white, zIndex: 12, textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 60, lineHeight: '110px', transformOrigin: '50% 50%' }, '0');
const MX = 230, MY = 1370, MR = 90;
const mBox = el(uiL, { left: MX - MR * 1.7, top: MY - MR * 1.7, width: MR * 3.4, height: MR * 3.4, zIndex: 30 });
const mascot = Mascot(mBox, MR * 3.4); S(mascot.svg, { left: 0, top: 0 });
const cap1 = Caption(capL, ['POV: your friend', 'has “been to Africa” 🌍'], { cy: 250, size: 60 });
const cap1b = Caption(capL, ['Africa is <b>54 countries</b> 👀'], { cy: 270, size: 62 });
const cap2 = Caption(capL, ['Name 5 African countries', 'that aren’t Egypt 👇'], { cy: 250, size: 58 });
const endCard = EndCard(stage, { my: 690, tagline: 'All 54 of them. Every day.' });

ev(0.02, 'pop', -12, { rate: 1.1 });
TL.m.forEach((b, i) => ev(Math.max(0.1, b + 0.05), 'mention', -6, { rate: 1 + i * 0.05 }));
ev(TL.palm, 'thud', -8); ev(TL.map, 'whoosh', -7); ev(TL.map + 0.3, 'expand', -8);
for (let i = 0; i < 18; i++) ev(TL.fill[0] + i * (TL.fill[1] - TL.fill[0]) / 18, 'pop', -14, { rate: 0.9 + i * 0.03 });
ev(TL.count, 'levelup', -6); ev(TL.count + 0.2, 'impact', -8);
ev(TL.cap2 + 0.1, 'mention', -7);
ev(TL.end + 0.1, 'swoosh', -7); ev(TL.end + 0.35, 'sparkle', -7); ev(TL.end + 0.7, 'expand', -10);

function seek(tReal) {
  const t = clamp(tReal, 0, DURATION) * DIL, b = t / BEAT;
  HALOS[0].img.style.transform = `rotate(${20 + t * 14}deg)`;
  chat.forEach((m, i) => m.set(spB(t, TL.m[i], 2.4, 0.62), segB(t, TL.map - 0.4 + i * 0.05, TL.map + i * 0.05)));
  const mOut = segB(t, TL.end - 0.5, TL.end - 0.1, E.inBack);
  const mp = spB(t, TL.map, 2, 0.62) * (1 - mOut); S(map.wrap, { transform: `scale(${mp})` }); show(map.wrap, mp > 0.001);
  let n = 0;
  for (const id of order) { const p = map.paths[id]; if (!p) continue; const b0 = +p.dataset.b, f = segB(t, b0, b0 + 0.25, E.outCubic);
    if (b >= b0) n++; p.setAttribute('fill', f > 0 ? mixc('#E8EEE9', p.dataset.c, f) : '#E8EEE9'); }
  counter.textContent = String(n);
  const cp = spB(t, TL.fill[0] - 0.4, 2.6, 0.55) * (1 - mOut), kick = b >= TL.count ? 1 + 0.15 * Math.exp(-(t - T(TL.count)) * 6) : 1;
  S(counter, { transform: `scale(${cp * kick})`, background: b >= TL.count ? C.green : C.forest }); show(counter, cp > 0.001);
  // Roviko: listens, facepalms at "…Africa.", then watches the map fill, wide-eyed
  const palm = b >= TL.palm && b < TL.map + 0.5, watch = b >= TL.fill[0] && b < TL.count, cheer = b >= TL.count && b < TL.cap2 + 1;
  drawMascot(mascot, { look: palm ? [0, 0.3] : watch ? [0.7, -0.9] : [0.6, -0.8], mouth: palm ? 'flat' : watch ? 'o' : cheer ? 'grin' : 'smile', blink: palm ? 1 : blinkAt(t, [3.6, 20.4]),
    eyesBig: watch ? 0.4 : 0, happy: cheer ? 1 : 0, cheeks: cheer ? 0.8 : 0, legs: 1, hop: cheer ? bop(b, 12) : palm ? 0 : bop(b, 5),
    arms: palm ? [[-30, -12, -30, 11], [112, 66, 22, 10]] : cheer ? [[-118, -92, -22, 11], [118, -92, -22, 11]] : [[-112, 66, 22, 10], [112, 66, 22, 10]] });
  cap1.set(spB(t, -1.5, 1.9, 0.62), segB(t, TL.map - 0.4, TL.map - 0.05));
  cap1b.set(spB(t, TL.map, 1.9, 0.62), segB(t, TL.cap2 - 0.2, TL.cap2 + 0.15));
  cap2.set(spB(t, TL.cap2, 1.9, 0.62), segB(t, TL.end - 0.05, TL.end + 0.2));
  endCard.update(t, TL.end, [MX, MY], { hops: [TL.hop], blinks: [TL.blink2] });
}
boot(seek, DURATION);
