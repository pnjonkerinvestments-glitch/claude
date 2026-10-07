/*
  Roviko short 13: "Italy has 2 countries inside it"
  13.1 s, 1080x1920, 110 BPM ("Aerobic Fashion", Mixkit, from song beat 63). Italy springs up as a big boot. A pin drops on
  San Marino (61 km², completely surrounded by Italy), then on Vatican City (under half a km²). The map zooms in on Rome:
  the Vatican is a country inside a city. Roviko's mind is blown. "Name the 3rd country that sits inside another one"
  (Lesotho, inside South Africa).
*/
const TEMPO = 110.01, DIL = TEMPO / 130, END = 24, DURATION = END * 60 / TEMPO;
const TL = { sm: 2.6, va: 5.6, zoom: 8.6, rome: 9.4, blown: 9.8, cap2: 13.6, end: 17.4, hop: 21, blink2: 19.6 };
setupStage(C.cream);
const world = el(stage, { width: 1080, height: 1920, zIndex: 1 });
const uiL = el(stage, { width: 1080, height: 1920, zIndex: 20 });
const capL = el(stage, { width: 1080, height: 1920, zIndex: 50 });
Halo(world, 540, 900, 1700);
const shape = fitShape('ITA', { cx: 560, cy: 790, w: 640, h: 760 });
const mapBox = el(uiL, { width: 1080, height: 1920, zIndex: 5 });
const msvg = svgEl(mapBox, 'svg', { width: 1080, height: 1920 }); msvg.style.position = 'absolute';
svgEl(msvg, 'path', { d: shape.d, fill: '#CFE9DA', stroke: C.forest, 'stroke-width': 5, 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' });
const SM = shape.pt(12.46, 43.94), VA = shape.pt(12.45, 41.90);
const dot = (p, col) => el(mapBox, { left: p[0] - 22, top: p[1] - 22, width: 44, height: 44, borderRadius: 22, background: col, border: `6px solid ${C.forest}`, zIndex: 6, transformOrigin: '50% 50%' });
const smDot = dot(SM, C.ocean), vaDot = dot(VA, C.gold);
const smTag = Tag(uiL, '🇸🇲 San Marino · 61 km²', { bg: C.white, fg: C.forest, font: 'Fredoka', weight: 600, size: 38, h: 76, ls: '0', z: 9 });
const vaTag = Tag(uiL, '🇻🇦 Vatican City · under 0.5 km²', { bg: C.white, fg: C.forest, font: 'Fredoka', weight: 600, size: 38, h: 76, ls: '0', z: 9 });
const romeTag = Tag(uiL, 'A country inside the city of Rome! 🏛️', { bg: C.forest, fg: C.white, font: 'Fredoka', weight: 600, size: 38, h: 80, ls: '0', z: 9 });
LAYOUT.push(() => { S(smTag, { left: SM[0] - 60, top: SM[1] - 120 }); S(vaTag, { left: Math.min(VA[0] - 40, 1000 - vaTag.getBoundingClientRect().width), top: VA[1] - 120 }); });
centreX(romeTag, 1150);
const MX = 230, MY = 1350, MR = 96;
const mBox = el(uiL, { left: MX - MR * 1.7, top: MY - MR * 1.7, width: MR * 3.4, height: MR * 3.4, zIndex: 30 });
const mascot = Mascot(mBox, MR * 3.4); S(mascot.svg, { left: 0, top: 0 });
const say = Bubble(uiL, 'WAIT. 🤯', { x: 400, y: 1240, w: 320, size: 52, tail: 'left', z: 35 });
const cap1 = Caption(capL, ['Italy has <b>2 countries</b>', 'inside it 🇮🇹'], { cy: 250, size: 62 });
const cap2 = Caption(capL, ['Name the <b>3rd</b> country that', 'sits inside another one 👇'], { cy: 250, size: 56 });
const endCard = EndCard(stage, { my: 690, tagline: 'Geography is weird. Play it daily.' });

ev(0.02, 'pop', -12, { rate: 1.1 });
ev(TL.sm, 'pin', -5); ev(TL.sm + 0.4, 'pop', -8);
ev(TL.va, 'pin', -5, { rate: 1.1 }); ev(TL.va + 0.4, 'pop', -8, { rate: 1.1 });
ev(TL.zoom, 'whoosh', -6); ev(TL.rome + 0.1, 'expand', -8);
ev(TL.blown + 0.2, 'boing', -6);
ev(TL.cap2 + 0.1, 'mention', -7);
ev(TL.end + 0.1, 'swoosh', -7); ev(TL.end + 0.35, 'sparkle', -7); ev(TL.end + 0.7, 'expand', -10);

function seek(tReal) {
  const t = clamp(tReal, 0, DURATION) * DIL, b = t / BEAT;
  HALOS[0].img.style.transform = `rotate(${20 + t * 14}deg)`;
  const mOut = segB(t, TL.end - 0.5, TL.end - 0.1, E.inBack);
  const mp = spB(t, -1.5, 2, 0.62), z = segB(t, TL.zoom, TL.zoom + 1.0, E.inOutCubic);
  // zoom: Rome comes to the middle of the screen at 2.6x
  const k = lerp(1, 2.6, z), tx = lerp(0, 540 - VA[0], z), ty = lerp(0, 780 - VA[1], z);
  S(mapBox, { transformOrigin: `${VA[0]}px ${VA[1]}px`, transform: `translate(${tx}px, ${ty}px) scale(${lerp(0.3, 1, clamp(mp, 0, 1.1)) * k * (1 - mOut)})` }); show(mapBox, mOut < 1);
  [[smDot, TL.sm], [vaDot, TL.va]].forEach(([d, b0]) => { const p = spB(t, b0, 2.8, 0.45); S(d, { transform: `scale(${p / k * (1 + 0.1 * Math.sin(t * 8))})` }); show(d, p > 0.001); });
  const sp = spB(t, TL.sm + 0.3, 2.6, 0.55) * (1 - segB(t, TL.zoom - 0.2, TL.zoom + 0.1, E.inBack)); S(smTag, { transform: `scale(${sp}) rotate(${-3 * sp}deg)` }); show(smTag, sp > 0.001);
  const vp = spB(t, TL.va + 0.3, 2.6, 0.55) * (1 - segB(t, TL.zoom - 0.2, TL.zoom + 0.1, E.inBack)); S(vaTag, { transform: `scale(${vp}) rotate(${-3 * vp}deg)` }); show(vaTag, vp > 0.001);
  const rp = spB(t, TL.rome, 2.6, 0.55) * (1 - mOut); S(romeTag, { transform: `scale(${rp})` }); show(romeTag, rp > 0.001);
  say.set(spB(t, TL.blown, 2.4, 0.55), segB(t, TL.cap2 - 0.2, TL.cap2 + 0.1));
  const blown = b >= TL.blown && b < TL.cap2;
  drawMascot(mascot, { look: blown ? [0, 0] : b < TL.sm ? [0.6, -0.8] : [0.8, -0.9], mouth: blown ? 'o' : b >= TL.cap2 ? 'grin' : 'smile', eyesBig: blown ? 0.6 : 0,
    brows: blown ? 'up' : null, legs: 1, hop: blown ? 0 : bop(b, 6), cheeks: b >= TL.cap2 ? 0.7 : 0,
    arms: blown ? [[-70, -96, -30, 11], [70, -96, -30, 11]] : [[-112, 66, 22, 10], [112, 66, 22, 10]], blink: blinkAt(t, [4.4, 15.2]),
    tilt: blown ? Math.sin(t * 9) * 3 : 0 });
  cap1.set(spB(t, -1.5, 1.9, 0.62), segB(t, TL.cap2 - 0.2, TL.cap2 + 0.15));
  cap2.set(spB(t, TL.cap2, 1.9, 0.62), segB(t, TL.end - 0.05, TL.end + 0.2));
  endCard.update(t, TL.end, [MX, MY], { hops: [TL.hop], blinks: [TL.blink2] });
}
boot(seek, DURATION);
