/*
  Roviko ad (Jean): the end card
  5 s, 1080x1920, 120 BPM ("Funkee Monkeee", Mixkit, from song beat 48). "Think you can do better?" with Roviko grinning, then
  the Roviko end card: "Download Roviko in the App Store" and roviko.app. Cut it right after Jean's line to camera.
*/
const TEMPO = 120.384, DIL = TEMPO / 130, END = 10, DURATION = END * 60 / TEMPO;
const TL = { end: 3.0, hop: 7.6, blink2: 6.4 };
setupStage(C.cream);
const world = el(stage, { width: 1080, height: 1920, zIndex: 1 });
const uiL = el(stage, { width: 1080, height: 1920, zIndex: 20 });
const capL = el(stage, { width: 1080, height: 1920, zIndex: 50 });
Halo(world, 540, 900, 1700);
const MX = 540, MY = 980, MR = 150;
const mBox = el(uiL, { left: MX - MR * 1.7, top: MY - MR * 1.7, width: MR * 3.4, height: MR * 3.4, zIndex: 30 });
const mascot = Mascot(mBox, MR * 3.4); S(mascot.svg, { left: 0, top: 0 });
const cap = Caption(capL, ['Think you can', 'do <b>better</b>? 🤔'], { cy: 520, size: 76 });
const endCard = EndCard(stage, { my: 690, tagline: 'Download Roviko in the App Store' });
ev(0.02, 'pop', -10); ev(1.0, 'boing', -9); ev(TL.end + 0.1, 'swoosh', -7); ev(TL.end + 0.35, 'sparkle', -7); ev(TL.end + 0.7, 'expand', -10);
function seek(tReal) {
  const t = clamp(tReal, 0, DURATION) * DIL, b = t / BEAT;
  HALOS[0].img.style.transform = `rotate(${20 + t * 14}deg)`;
  cap.set(spB(t, -1.5, 1.9, 0.62), segB(t, TL.end - 0.2, TL.end + 0.1));
  const mp = spB(t, -1.2, 2.2, 0.6);
  S(mBox, { transform: `scale(${clamp(mp, 0, 1.1)})` }); show(mBox, b < TL.end + 0.5);
  drawMascot(mascot, { look: [0, -0.2], mouth: 'grin', brow: 1, cheeks: 0.6, legs: 1, hop: bop(b, 8), blink: blinkAt(t, [1.6]),
    arms: [[-112, 66, 22, 10], [100, -40 + Math.sin(t * 9) * 6, -20, 10]] });
  endCard.update(t, TL.end, [MX, MY], { hops: [TL.hop], blinks: [TL.blink2] });
}
boot(seek, DURATION);
