/*
  Roviko TikTok ad: the cover (ad-cover.html?v=1|2)
  1080x1920 still. v1: the Bhutan flag big, "Can you name this flag?" and a 3-second timer, Roviko sweating next to it, and
  the gold "answer in the video" pill. v2: the same, with the real Roviko question screen in a phone.
  Everything important sits in the middle 1080x1440 band, so the profile grid (3:4 crop) still shows the flag and the question.
*/
const V = +(Q.get('v') || 1), DURATION = 1, DIL = 1;
setupStage(C.cream);
const world = el(stage, { width: 1080, height: 1920, zIndex: 1 });
const uiL = el(stage, { width: 1080, height: 1920, zIndex: 20 });
Halo(world, 540, 860, 1900, 0.5);
const pill = Tag(uiL, 'ANSWER IN THE VIDEO 👀', { bg: C.gold, fg: C.forest, size: 34, h: 76, z: 30 });
centreX(pill, 270);
const title = el(uiL, { left: 0, top: 380, width: 1080, textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 112, lineHeight: '118px', color: C.forest, zIndex: 25 },
  'Can you name<br>this <span style="color:#1F806B">flag</span>?');
if (V === 1) {
  const fl = el(uiL, { left: 140, top: 680, width: 800, height: 533, borderRadius: 34, overflow: 'hidden', zIndex: 22, transform: 'rotate(-4deg)',
    boxShadow: '0 0 0 16px #fff, 0 40px 80px rgba(22,59,50,.28)' }, `<img src="${FLAG_DIR}bt.svg" style="width:100%;height:100%;object-fit:cover;display:block">`);
} else {
  const ph = el(uiL, { left: 300, top: 640, width: 508, height: 1067, borderRadius: 68, background: C.forest, zIndex: 22, transform: 'rotate(-3deg)', boxShadow: '0 50px 90px rgba(22,59,50,.25)' });
  el(ph, { left: 14, top: 14, width: 480, height: 1039, borderRadius: 56, overflow: 'hidden' }, `<img src="screens34/hook-q.jpg" style="width:480px;height:1039px;display:block">`);
}
// the 3-second timer
const timer = el(uiL, { left: V === 1 ? 760 : 790, top: V === 1 ? 1130 : 1120, width: 210, height: 210, borderRadius: 105, background: C.white, zIndex: 28, display: 'grid', placeItems: 'center',
  boxShadow: '0 0 0 14px ' + C.red + ', 0 20px 40px rgba(22,59,50,.25)', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 120, color: C.red }, '3');
const sec = Tag(uiL, 'SECONDS ⏱️', { bg: C.red, fg: C.white, size: 26, h: 56, z: 29 });
LAYOUT.push(() => { const r = timer.getBoundingClientRect(); S(sec, { left: r.left + r.width / 2 - sec.getBoundingClientRect().width / 2, top: r.bottom + 14 }); });
// Roviko, nervous
const MX = V === 1 ? 250 : 190, MY = V === 1 ? 1390 : 1480, MR = 120;
const mBox = el(uiL, { left: MX - MR * 1.7, top: MY - MR * 1.7, width: MR * 3.4, height: MR * 3.4, zIndex: 30 });
const mascot = Mascot(mBox, MR * 3.4); S(mascot.svg, { left: 0, top: 0 });
const wm = el(uiL, { left: 0, top: 1600, width: 1080, textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 64, color: C.forest, zIndex: 25 }, V === 1 ? 'roviko' : '');
function seek() {
  HALOS[0].img.style.transform = 'rotate(30deg)';
  drawMascot(mascot, { look: [0.8, -0.8], mouth: 'wobble', brows: 'worried', sweat: 1, eyesBig: 0.3, legs: 1, arms: [[-34, -6, -30, 11], [104, 62, 22, 10]] });
}
boot(seek, DURATION);
