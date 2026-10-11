'use client';
/** The party for streak day 3, 7 and 30 (1.39), shown inside the streak moment. */
export const PARTY_DAYS = [3, 7, 30];
/** A short burst of paper confetti (pure CSS, app/v139.css; hidden with reduced motion). */
export function Confetti() {
  return <span className="confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ ['--i' as any]: i }}/>)}</span>;
}
