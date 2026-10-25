/*
  Roviko content week 2 (26 Oct - 1 Nov 2026): a banner per post, 1080x1920 (Stories, or to announce the post). w2-banner.html?id=D1P1
  The layout of the post that went big: a big two-tone headline, then the post itself in one big card (slide 1 of a carousel,
  or the reel's cover). Texts and image paths come from data/w2banners.js, written by build/w2_pack.py.
*/
// @scripts data/w2banners.js lib/ios.js
const id = Q.get('id') || 'D1P1', B = W2B[id];
const W = 1080, H = 1920;
S(document.body, { width: W, height: H }); S(stage, { width: W, height: H, overflow: 'hidden' });
S(stage, { background: 'radial-gradient(900px 800px at 85% 6%, rgba(31,128,107,.12), transparent 70%), radial-gradient(1000px 900px at 10% 90%, rgba(54,179,245,.12), transparent 70%), #F6F3E9' });
const uiL = el(stage, { width: W, height: H, zIndex: 20 });
el(uiL, { left: 64, top: 118, display: 'flex', alignItems: 'center', gap: '14px' },
  `<span style="padding:14px 26px;border-radius:999px;background:${C.forest};color:#fff;font-family:Manrope;font-weight:800;font-size:28px;letter-spacing:.08em">${B.day}</span><span style="padding:14px 26px;border-radius:999px;background:rgba(255,255,255,.92);box-shadow:0 6px 18px rgba(22,59,50,.1);color:${C.forest};font-family:Manrope;font-weight:800;font-size:28px;letter-spacing:.08em">${B.kind}</span>`);
const head = el(uiL, { left: 64, top: 228, width: 952, fontFamily: 'Fredoka', fontWeight: 600, fontSize: 84, lineHeight: 1.1, color: C.forest, whiteSpace: 'nowrap' }, `<div>${B.l1}</div><div style="color:${C.green}">${B.l2}</div>`);
const CW = 952, CH = Math.round(CW * 1350 / 1080);
const card = el(uiL, { left: 64, top: 470, width: CW, height: CH, borderRadius: 46, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 4px rgba(22,59,50,.06), 0 30px 70px rgba(22,59,50,.18)' },
  `<img src="${B.src}" style="width:100%;height:100%;object-fit:cover;object-position:50% ${B.reel ? 42 : 50}%;display:block">`);
el(uiL, { left: 0, top: 470 + CH + 50, width: W, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '22px' },
  `<span style="display:inline-flex;align-items:center;gap:14px;padding:22px 40px;border-radius:999px;background:${C.forest};color:#fff;font-family:Fredoka;font-weight:600;font-size:48px">${B.reel ? 'Watch and guess' : 'Swipe and guess'}${glyph('arrow', 44, '#fff')}</span>`);
window.filmReady = (async () => {
  await Promise.all(['600 28px Fredoka', '800 13px Manrope'].map(f => document.fonts.load(f)));
  await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  // the headline shrinks to fit the width
  const w = head.scrollWidth; if (w > 952) S(head, { fontSize: 84 * 952 / w });
  return true;
})();
