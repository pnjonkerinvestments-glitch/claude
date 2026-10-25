// 1.52: on a laptop or desktop with a low window, a game must fit on the screen without scrolling (the owner's report:
// on a laptop you had to scroll to reach the answers and the next button). The layout already puts question and
// answers side by side on wide screens (app/v152.css); this is the safety net: when a game screen is still taller than
// the window, it is scaled down (CSS zoom, never below MIN) so everything is in view. Phones keep their own layout
// (app/v142.css), and result screens, the waiting room and lessons' end screens may scroll as before.
const MIN = 0.66;
const SKIP = '.daily-finish,.results-page,.finish-stage,.ln-result,.match-results,.room-lobby,.lobby-page,.state-empty';

export function fitGame(main: HTMLElement | null) {
  if (!main || typeof window === 'undefined') return () => {};
  let frame = 0;
  const fit = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const el = main.firstElementChild as HTMLElement | null;
      if (!el) return;
      const style = el.style as CSSStyleDeclaration & { zoom: string };
      if (window.innerWidth < 561 || el.matches(SKIP) || el.querySelector(SKIP)) { if (style.zoom) style.zoom = ''; return; }
      const before = style.zoom;
      style.zoom = '';
      const top = el.getBoundingClientRect().top + window.scrollY;
      const height = el.scrollHeight;
      const room = window.innerHeight - top - parseFloat(getComputedStyle(main).paddingBottom || '0') - 4;
      const z = height > room ? Math.max(MIN, Math.floor(room / height * 100) / 100) : 1;
      style.zoom = z < 1 ? String(z) : '';
      if (style.zoom !== before && z < 1) window.scrollTo({ top: 0 });
    });
  };
  const resize = new ResizeObserver(fit);
  const watch = () => { resize.disconnect(); resize.observe(main); const el = main.firstElementChild; if (el) { resize.observe(el); for (const c of Array.from(el.children)) resize.observe(c); } fit(); };
  const changes = new MutationObserver(watch);
  changes.observe(main, { childList: true, subtree: true });
  window.addEventListener('resize', fit);
  watch();
  return () => { cancelAnimationFrame(frame); resize.disconnect(); changes.disconnect(); window.removeEventListener('resize', fit); const el = main.firstElementChild as HTMLElement | null; if (el) (el.style as any).zoom = ''; };
}
