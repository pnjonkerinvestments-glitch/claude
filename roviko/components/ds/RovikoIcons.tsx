import React from 'react';

/*
 * Roviko icons (1.24): small cartoon stickers in the style of the social videos. Flat colours, a thick dark
 * outline and, where it fits, Roviko the globe. One 32 × 32 drawing per icon, readable from 20 px up.
 * Colours are fixed (they are pictures, not text), except `var(--g)`: the game's own colour from the
 * `game-icon-<mode>` class, so every game keeps its recognisable colour. The outline is `--ri-ink`.
 */
const K = 'var(--ri-ink, #163B32)';
const SW = 1.9;
const C = { blue: '#36B3F5', land: '#5ED34F', gold: '#F6B84B', red: '#E5484D', white: '#FFFFFF', cream: '#FFF6E2', mint: '#DDEDE6', navy: '#1D3A6E', pink: '#FF9DB0', orange: '#FF8A3D', sky: '#BFE4F8' };
const T = 'var(--g, #1F806B)';
const o = { stroke: K, strokeWidth: SW, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** Roviko the globe at (x, y), radius r: ocean, two green continents, eyes and a smile (face can be left out when tiny). */
function Globe({ x, y, r, face = true, wink = false }: { x: number; y: number; r: number; face?: boolean; wink?: boolean }) {
  return <g>
    <circle cx={x} cy={y} r={r} fill={C.blue} {...o}/>
    <path d={`M${x - r * .78} ${y - r * .2}c${r * .2} ${-r * .5} ${r * .62} ${-r * .66} ${r * .9} ${-r * .44}c${r * .2} ${r * .18} ${-r * .06} ${r * .42} ${-r * .34} ${r * .5}c${-r * .26} ${r * .1} ${-r * .5} ${r * .1} ${-r * .56} ${-r * .06}z`} fill={C.land}/>
    <path d={`M${x + r * .2} ${y + r * .5}c${r * .14} ${-r * .3} ${r * .5} ${-r * .38} ${r * .62} ${-r * .14}c${r * .06} ${r * .2} ${-r * .14} ${r * .38} ${-r * .36} ${r * .42}c${-r * .16} ${r * .02} ${-r * .3} ${-r * .08} ${-r * .26} ${-r * .28}z`} fill={C.land}/>
    {face && <g fill={K}>
      <circle cx={x - r * .3} cy={y - r * .02} r={Math.max(.9, r * .13)}/>
      {wink ? <path d={`M${x + r * .18} ${y}q${r * .12} ${-r * .16} ${r * .24} 0`} fill="none" stroke={K} strokeWidth={Math.max(.9, r * .1)} strokeLinecap="round"/> : <circle cx={x + r * .3} cy={y - r * .02} r={Math.max(.9, r * .13)}/>}
      <path d={`M${x - r * .18} ${y + r * .26}q${r * .18} ${r * .2} ${r * .36} 0`} fill="none" stroke={K} strokeWidth={Math.max(.9, r * .1)} strokeLinecap="round"/>
    </g>}
  </g>;
}
const Star = ({ x, y, r, fill = C.gold }: { x: number; y: number; r: number; fill?: string }) => {
  const p = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; return `${(x + rr * Math.cos(a)).toFixed(2)} ${(y + rr * Math.sin(a)).toFixed(2)}`; });
  return <path d={'M' + p.join('L') + 'Z'} fill={fill} {...o}/>;
};
const Spark = ({ x, y, r, fill = C.gold }: { x: number; y: number; r: number; fill?: string }) =>
  <path d={`M${x} ${y - r}Q${x + r * .18} ${y - r * .18} ${x + r} ${y}Q${x + r * .18} ${y + r * .18} ${x} ${y + r}Q${x - r * .18} ${y + r * .18} ${x - r} ${y}Q${x - r * .18} ${y - r * .18} ${x} ${y - r}Z`} fill={fill} {...o} strokeWidth={1.5}/>;
const Pin = ({ x, y, s = 1, fill = C.red }: { x: number; y: number; s?: number; fill?: string }) =>
  <g transform={`translate(${x} ${y}) scale(${s})`}><path d="M0 0C-4.6-5.4-6.4-8.4-6.4-11.2a6.4 6.4 0 0 1 12.8 0C6.4-8.4 4.6-5.4 0 0Z" fill={fill} {...o}/><circle cy="-11.2" r="2.3" fill={C.white} {...o} strokeWidth={1.3}/></g>;
const Flame = ({ x = 16, y = 16, s = 1 }: { x?: number; y?: number; s?: number }) =>
  <g transform={`translate(${x} ${y}) scale(${s}) translate(-16 -16)`}><path d="M16.6 3.5c1.2 4.2-.9 6.3-2.9 8.4C11.9 13.8 10 15.8 10 19.2 10 23.4 12.9 27 16.6 27s6.6-3.3 6.6-7.6c0-2.8-1.3-4.8-2.6-6.2.1 1.8-.5 3.2-1.9 3.8 1.1-5-1-10-2.1-13.5Z" fill={C.orange} {...o}/><path d="M16.4 16.7c.3 1.8-1 2.8-1.6 3.6-.5.6-.8 1.3-.8 2 0 1.5 1.1 2.6 2.5 2.6s2.5-1.1 2.5-2.7c0-2-1.4-3.6-2.6-5.5Z" fill={C.gold}/></g>;
const Crown = ({ x = 16, y = 16, s = 1 }: { x?: number; y?: number; s?: number }) =>
  <g transform={`translate(${x} ${y}) scale(${s}) translate(-16 -16)`}><path d="M5 23 3.5 10l7 5.5L16 7l5.5 8.5 7-5.5L27 23Z" fill={C.gold} {...o}/><path d="M5.5 26.5h21" {...o} strokeWidth={2.6} stroke={K}/><circle cx="16" cy="18.5" r="1.9" fill={C.red} {...o} strokeWidth={1.3}/></g>;
const Plane = ({ x, y, s = 1, rot = -30, fill = C.white }: { x: number; y: number; s?: number; rot?: number; fill?: string }) =>
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}><path d="M-9.5-1.4H6.2C8.8-1.4 10.5-.7 10.5 0S8.8 1.4 6.2 1.4H-9.5Z M1.2-1.3-3.8-9h-2.6l1.8 7.7Z M1.2 1.3-3.8 9h-2.6l1.8-7.7Z M-7.4-1.3-9.6-5h-1.6l.6 3.7Z M-7.4 1.3-9.6 5h-1.6l.6-3.7Z" fill={fill} {...o} strokeWidth={1.3}/></g>;
const Check = ({ x = 16, y = 16, s = 1, color = C.white }: { x?: number; y?: number; s?: number; color?: string }) =>
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M-5 .3l3.4 3.4L5.2-3.6" fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round"/>;
const Card = ({ x, y, w, h, r = 3, fill = C.white, rot = 0 }: { x: number; y: number; w: number; h: number; r?: number; fill?: string; rot?: number }) =>
  <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} {...o} transform={rot ? `rotate(${rot} ${x + w / 2} ${y + h / 2})` : undefined}/>;
const TwoGlobes = () => <><Globe x={11} y={17} r={7.2}/><Globe x={21.5} y={18.5} r={8} wink/></>;

export const ICONS: Record<string, React.ReactNode> = {
  // ── Games ──
  // Daily Detour: Roviko on a trip, a plane on a dotted route.
  daily: <><path d="M4.5 10.5C8 5.8 14 4 19.5 5" fill="none" stroke={K} strokeWidth={1.4} strokeDasharray="1.2 2.6" strokeLinecap="round"/><Globe x={13.5} y={19} r={9.5}/><Plane x={24.5} y={8} s={.95} rot={-28}/></>,
  // Rank Radar: a radar screen with a sweep and a gold blip.
  rank: <><circle cx="16" cy="16.5" r="12" fill={C.white} {...o}/><path d="M16 16.5V4.5a12 12 0 0 1 10.4 6Z" fill={T} opacity=".9"/><circle cx="16" cy="16.5" r="12" fill="none" {...o}/><circle cx="16" cy="16.5" r="6.6" fill="none" stroke={K} strokeWidth={1.3} opacity=".55"/><circle cx="16" cy="16.5" r="1.8" fill={K}/><circle cx="21.6" cy="11.4" r="2.6" fill={C.gold} {...o} strokeWidth={1.4}/></>,
  // World Duel: two country cards face to face, VS.
  duel: <><Card x={3.5} y={6.5} w={12} h={17} rot={-10}/><rect x={6.2} y={9.6} width={6.6} height={4.4} rx={.8} fill={C.red} transform="rotate(-10 9.5 15)"/><Card x={16.5} y={7.5} w={12} h={17} fill={T} rot={10}/><rect x={19.2} y={10.6} width={6.6} height={4.4} rx={.8} fill={C.white} transform="rotate(10 22.5 16)"/><circle cx="16" cy="22.5" r="5" fill={C.gold} {...o}/><path d="M13.7 21l1.2 3 1.2-3M18.6 21.1c-.6-.4-2-.3-2 .5 0 1 2 .6 2 1.6 0 .8-1.4.9-2 .4" fill="none" stroke={K} strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round"/></>,
  // Side by Side: a balance with a globe on one pan and a flag on the other.
  compare: <><path d="M16 6v19M9 26.5h14" {...o} fill="none" strokeWidth={2.4}/><path d="M5 9.5h22" {...o} fill="none" strokeWidth={2.2}/><circle cx="16" cy="6" r="2" fill={C.gold} {...o} strokeWidth={1.4}/><path d="M5 9.5 2 17h6Z M27 9.5 24 17h6Z" fill="none" stroke={K} strokeWidth={1.2}/><path d="M1.5 17a3.5 3 0 0 0 7 0Z M23.5 17a3.5 3 0 0 0 7 0Z" fill={C.gold} {...o} strokeWidth={1.5}/><Globe x={5} y={13.6} r={3.2} face={false}/><rect x={24.6} y={11.6} width={4.8} height={3.6} rx={.6} fill={T} {...o} strokeWidth={1.3}/></>,
  // Country Mosaic: four tiles that belong together.
  mosaic: <><Card x={4} y={4} w={11} h={11} fill={C.white}/><rect x={6.5} y={7.2} width={6} height={4.4} rx={.6} fill={C.red}/><Card x={17} y={4} w={11} h={11} fill={T}/><path d="M20 12.5c.6-2.6 2.3-4.6 4.5-4.8.7 1.6-.1 3.2-1.3 3.9-1 .6-2.2.7-3.2.9Z" fill={C.white}/><Card x={4} y={17} w={11} h={11} fill={C.gold}/><path d="M6.6 25.5h6M7.4 25v-4.6M9.6 25v-4.6M11.8 25v-4.6M6.6 20.4l3-2.2 3 2.2Z" fill="none" stroke={K} strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round"/><Card x={17} y={17} w={11} h={11} fill={C.sky}/><Spark x={22.5} y={22.5} r={3.4}/></>,
  // Clue Trail: a folded map with a dotted route to a red pin.
  trail: <><path d="M3.5 8.5 11 6l10 3 7.5-2.5v17L21 26l-10-3-7.5 2.5Z" fill={C.cream} {...o}/><path d="M11 6v17M21 9v17" stroke={K} strokeWidth={1.3}/><path d="M11 6l10 3v17l-10-3Z" fill={C.mint}/><path d="M3.5 8.5 11 6l10 3 7.5-2.5v17L21 26l-10-3-7.5 2.5Z" fill="none" {...o}/><path d="M6.5 21.5c2.5-2 4-5.5 7.5-5.5s4 2.5 7-2" fill="none" stroke={C.red} strokeWidth={1.7} strokeDasharray="1.6 2" strokeLinecap="round"/><Pin x={22.5} y={14.5} s={.72} fill={T}/></>,
  // Mystery country: a magnifier over a question mark.
  mystery: <><circle cx="13.5" cy="13.5" r="9" fill={C.white} {...o}/><circle cx="13.5" cy="13.5" r="9" fill="none" stroke={C.gold} strokeWidth={3.2}/><circle cx="13.5" cy="13.5" r="10.6" fill="none" stroke={K} strokeWidth={SW}/><circle cx="13.5" cy="13.5" r="7.4" fill="none" stroke={K} strokeWidth={1.3}/><path d="M20.8 21 28 28.2" stroke={K} strokeWidth={4.4} strokeLinecap="round"/><path d="M11.2 11.4a2.4 2.4 0 1 1 3.4 2.1c-.7.4-1.1.9-1.1 1.7" fill="none" stroke={T} strokeWidth={2.2} strokeLinecap="round"/><circle cx="13.5" cy="18.3" r="1.25" fill={T}/></>,
  // City Circuit (capitals): a capitol building with a pin above it.
  capitals: <><path d="M6 27.5h20" {...o} strokeWidth={2.4} fill="none"/><path d="M7.5 13.5 16 8l8.5 5.5Z" fill={C.gold} {...o}/><rect x={8} y={14} width={16} height={11} rx={1} fill={C.white} {...o}/><path d="M11.5 16.5v6M16 16.5v6M20.5 16.5v6" stroke={T} strokeWidth={2.2} strokeLinecap="round"/><Pin x={24.5} y={11} s={.62}/></>,
  // Flag Signal: a flag waving on its pole.
  flags: <><path d="M7 28V4" {...o} strokeWidth={2.4}/><circle cx="7" cy="4" r="1.9" fill={C.gold} {...o} strokeWidth={1.3}/><path d="M7.5 5.5c4-1.6 6.8 1.4 10.6.4 2.4-.6 4-1.6 6.4-1.6v12c-2.4 0-4 1-6.4 1.6-3.8 1-6.6-2-10.6-.4Z" fill={T} {...o}/><path d="M7.5 11.4c4-1.6 6.8 1.4 10.6.4 2.4-.6 4-1.6 6.4-1.6v-.1" fill="none" stroke={C.white} strokeWidth={2.4}/></>,
  // Pinpoint: a red pin dropped on a little map.
  pinpoint: <><rect x={3.5} y={12} width={25} height={15} rx={3.5} fill={C.sky} {...o}/><path d="M6.5 22c1-3.4 4.6-5.2 8-4.2 2.4.7 3.4 2.6 6 2 2.4-.6 4 1.4 3.2 3.4H7.8c-1 0-1.6-.4-1.3-1.2Z" fill={C.land} {...o} strokeWidth={1.2}/><ellipse cx="16" cy="21.4" rx="3.4" ry="1.2" fill={K} opacity=".25"/><Pin x={16} y={21} s={1.05} fill={C.red}/></>,
  // Next Door (borders): two neighbouring countries with a dotted border.
  borders: <><path d="M3.5 10.5 10 6l6.5 3-1 8 2 7-8 3-6-4.5Z" fill={C.land} {...o}/><path d="M16.5 9l7-2 5 5-1 9-6 5-4-2-2-7Z" fill={T} {...o}/><path d="M16.5 9l-1 8 2 7" fill="none" stroke={C.white} strokeWidth={1.8} strokeDasharray="1.5 2.2" strokeLinecap="round"/></>,
  // Size Shuffle (order): three countries from small to big.
  order: <><path d="M3 27.5h26" {...o} strokeWidth={2.2} fill="none"/><circle cx="7" cy="23.5" r="3.6" fill={C.blue} {...o}/><circle cx="14.2" cy="21" r="5.6" fill={C.land} {...o}/><circle cx="23.2" cy="18.5" r="8" fill={T} {...o}/><path d="M19.6 15.4a5 5 0 0 1 3.6-1.6" fill="none" stroke={C.white} strokeWidth={1.8} strokeLinecap="round" opacity=".7"/></>,
  // Shape Shift: a country's outline on a card, and a question.
  shape: <><Card x={4} y={6} w={20} h={21} r={4}/><path d="M10 10.5l3.4-1 1.6 2.6 3.6.6-.6 3 2.6 3.4-2.4 1-.4 3.4-3.6-2.2-2.6 1.2-.4-3.2-2.8-1.4 1.8-2.6-1.6-2.8Z" fill={T} {...o} strokeWidth={1.3}/><circle cx="24.5" cy="8.5" r="5.2" fill={C.gold} {...o}/><path d="M22.9 7.3a1.7 1.7 0 1 1 2.4 1.5c-.5.3-.8.6-.8 1.2" fill="none" stroke={K} strokeWidth={1.5} strokeLinecap="round"/><circle cx="24.5" cy="11.8" r=".9" fill={K}/></>,
  // Around the World: Roviko with an orbit and a little plane.
  mixed: <><ellipse cx="16" cy="17" rx="14" ry="5.4" fill="none" stroke={K} strokeWidth={1.5} transform="rotate(-18 16 17)" strokeDasharray="0" opacity=".55"/><Globe x={16} y={16.5} r={10}/><path d="M3.4 21.4c1.2 2 6 2.6 12.4 1.4s11.6-3.6 13-6" fill="none" stroke={K} strokeWidth={1.5} strokeLinecap="round"/><Plane x={26.6} y={6.4} s={.6} rot={-35}/></>,
  // Rooms with friends.
  room: <TwoGlobes/>,

  // ── Tab bar ──
  play: <><Globe x={14.5} y={15.5} r={11}/><circle cx="24" cy="24" r="6" fill={C.gold} {...o}/><path d="M22.4 21.2v5.6l4.6-2.8Z" fill={K}/></>,
  explore: <><circle cx="16" cy="16" r="12.5" fill={C.white} {...o}/><circle cx="16" cy="16" r="9.4" fill="none" stroke={K} strokeWidth={1.2} opacity=".35"/><path d="M16 5.5l3 10.5h-6Z" fill={C.red} {...o} strokeWidth={1.4}/><path d="M16 26.5l-3-10.5h6Z" fill={C.blue} {...o} strokeWidth={1.4}/><circle cx="16" cy="16" r="1.7" fill={C.gold} {...o} strokeWidth={1.2}/></>,
  multiplayer: <TwoGlobes/>,
  passport: <><rect x={6.5} y={3.5} width={19} height={25} rx={3} fill={C.navy} {...o}/><circle cx="16" cy="14" r="5.6" fill="none" stroke={C.gold} strokeWidth={1.9}/><ellipse cx="16" cy="14" rx="2.4" ry="5.6" fill="none" stroke={C.gold} strokeWidth={1.4}/><path d="M10.4 14h11.2" stroke={C.gold} strokeWidth={1.4}/><path d="M11 23.5h10" stroke={C.gold} strokeWidth={1.9} strokeLinecap="round"/></>,

  // ── Multiplayer choices ──
  friends: <TwoGlobes/>,
  random: <><Globe x={13} y={14} r={9.5}/><g transform="rotate(12 22.5 22.5)"><rect x={16.5} y={16.5} width={12} height={12} rx={3} fill={C.white} {...o}/><circle cx="19.8" cy="19.8" r="1.2" fill={K}/><circle cx="22.5" cy="22.5" r="1.2" fill={K}/><circle cx="25.2" cy="25.2" r="1.2" fill={K}/></g></>,
  computer: <><path d="M16 4.5v3.4" stroke={K} strokeWidth={1.8} strokeLinecap="round"/><circle cx="16" cy="4" r="2" fill={C.red} {...o} strokeWidth={1.3}/><circle cx="16" cy="18" r="11" fill={C.blue} {...o}/><path d="M7.4 13.6c1.6-2.6 4.2-3.6 6.4-2.8.8 1.2-.6 2.6-2.4 3.2-1.6.5-3 .4-4-.4Z" fill={C.land}/><rect x={9} y={15} width={14} height={7} rx={3.5} fill={C.navy} {...o} strokeWidth={1.5}/><rect x={11.2} y={17} width={3.2} height={3} rx={1} fill="#7CF0C8"/><rect x={17.6} y={17} width={3.2} height={3} rx={1} fill="#7CF0C8"/><path d="M5 18h-1.5M27 18h1.5" stroke={K} strokeWidth={2.2} strokeLinecap="round"/></>,

  // ── Daily quests ──
  target: <><circle cx="16" cy="16" r="12" fill={C.white} {...o}/><circle cx="16" cy="16" r="8.4" fill={C.red} {...o} strokeWidth={1.4}/><circle cx="16" cy="16" r="4.8" fill={C.white} {...o} strokeWidth={1.4}/><circle cx="16" cy="16" r="1.9" fill={C.red}/><path d="M16 16 26 6" stroke={K} strokeWidth={2} strokeLinecap="round"/><path d="M23.5 4.2l3.2-.2-.2 3.2-2.4.6-1.2-1.2Z" fill={C.gold} {...o} strokeWidth={1.2}/></>,
  crown: <Crown/>,
  flame: <Flame/>,
  gift: <><rect x={5} y={13} width={22} height={14.5} rx={2.2} fill={C.red} {...o}/><rect x={3.5} y={9} width={25} height={5.5} rx={1.8} fill={C.red} {...o}/><path d="M16 9v18.5" stroke={C.gold} strokeWidth={3.4}/><path d="M16 9v18.5" stroke={K} strokeWidth={0} /><path d="M16 9c-2.6-4.6-8.6-4.4-7.4-1.2.8 1.8 4.8 1.6 7.4 1.2 2.6.4 6.6.6 7.4-1.2 1.2-3.2-4.8-3.4-7.4 1.2Z" fill={C.gold} {...o} strokeWidth={1.5}/></>,

  // ── Passport, account, friends ──
  account: <><rect x={3.5} y={7} width={25} height={18} rx={3} fill={C.white} {...o}/><Globe x={11} y={16} r={5}/><path d="M18.5 13h6.5M18.5 16.5h6.5M18.5 20h4" stroke={K} strokeWidth={1.8} strokeLinecap="round"/></>,
  settings: <><path d="M16 3.8l2.2 2.6 3.3-.7 1 3.2 3.2 1-.7 3.3 2.6 2.2-2.6 2.2.7 3.3-3.2 1-1 3.2-3.3-.7L16 28.2l-2.2-2.6-3.3.7-1-3.2-3.2-1 .7-3.3L4.4 16 7 13.8l-.7-3.3 3.2-1 1-3.2 3.3.7Z" fill={C.gold} {...o}/><circle cx="16" cy="16" r="4.6" fill={C.white} {...o}/></>,
  trophy: <><path d="M10 5.5h12v6.5a6 6 0 0 1-12 0Z" fill={C.gold} {...o}/><path d="M10 7.5H6.5c0 4 1.6 6 4.2 6.5M22 7.5h3.5c0 4-1.6 6-4.2 6.5" fill="none" {...o}/><path d="M16 18v4.5" {...o} strokeWidth={2.6}/><rect x={10.5} y={22.5} width={11} height={4.5} rx={1.4} fill={C.navy} {...o}/><Star x={16} y={10.6} r={2.6} fill={C.white}/></>,
  help: <><circle cx="16" cy="16" r="12" fill={C.sky} {...o}/><path d="M12.4 12.6a3.7 3.7 0 1 1 5.4 3.3c-1.1.6-1.8 1.4-1.8 2.7" fill="none" stroke={K} strokeWidth={2.6} strokeLinecap="round"/><circle cx="16" cy="22.6" r="1.6" fill={K}/></>,
  sparkles: <><Spark x={12.5} y={15} r={8.5}/><Spark x={23.5} y={8} r={4.2} fill={C.white}/><Spark x={23} y={23.5} r={3.6} fill={C.sky}/></>,

  // ── Achievements ──
  footprints: <><g transform="rotate(-12 11 15)"><ellipse cx="11" cy="17" rx="4" ry="6.5" fill={C.gold} {...o}/><circle cx="8.6" cy="8.6" r="1.4" fill={C.gold} {...o} strokeWidth={1.2}/><circle cx="11.4" cy="7.8" r="1.4" fill={C.gold} {...o} strokeWidth={1.2}/><circle cx="14" cy="8.8" r="1.3" fill={C.gold} {...o} strokeWidth={1.2}/></g><g transform="rotate(14 21 15)"><ellipse cx="21.5" cy="19" rx="3.6" ry="6" fill={C.orange} {...o}/><circle cx="19.4" cy="11.2" r="1.3" fill={C.orange} {...o} strokeWidth={1.2}/><circle cx="22" cy="10.5" r="1.3" fill={C.orange} {...o} strokeWidth={1.2}/><circle cx="24.4" cy="11.4" r="1.2" fill={C.orange} {...o} strokeWidth={1.2}/></g></>,
  map: <><path d="M3.5 8.5 11 6l10 3 7.5-2.5v17L21 26l-10-3-7.5 2.5Z" fill={C.cream} {...o}/><path d="M11 6l10 3v17l-10-3Z" fill={C.mint}/><path d="M3.5 8.5 11 6l10 3 7.5-2.5v17L21 26l-10-3-7.5 2.5Z M11 6v17M21 9v17" fill="none" {...o} strokeWidth={1.5}/><Pin x={16} y={17.5} s={.7}/></>,
  compass: <><circle cx="16" cy="16" r="12.5" fill={C.white} {...o}/><path d="M16 5.5l3 10.5h-6Z" fill={C.red} {...o} strokeWidth={1.4}/><path d="M16 26.5l-3-10.5h6Z" fill={C.blue} {...o} strokeWidth={1.4}/><circle cx="16" cy="16" r="1.7" fill={C.gold} {...o} strokeWidth={1.2}/></>,
  plane: <><path d="M3 23.5c4-1 8 1 12 0s8-3 14-2" fill="none" stroke={K} strokeWidth={1.3} strokeDasharray="1.2 2.6" strokeLinecap="round"/><Plane x={16} y={13} s={1.45} rot={-22}/></>,
  earth: <Globe x={16} y={16} r={12.5}/>,
  lightbulb: <><path d="M16 3.8a8.6 8.6 0 0 0-5 15.6c.9.7 1.4 1.8 1.4 2.9h7.2c0-1.1.5-2.2 1.4-2.9A8.6 8.6 0 0 0 16 3.8Z" fill={C.gold} {...o}/><rect x={12} y={22.4} width={8} height={4.4} rx={1.4} fill={C.white} {...o} strokeWidth={1.5}/><path d="M13.4 28.6h5.2" {...o} strokeWidth={1.8}/><path d="M13.6 12.6c.6-1.8 2.2-2.6 3.6-2.4" fill="none" stroke={C.white} strokeWidth={1.8} strokeLinecap="round"/></>,
  brain: <><path d="M15.5 6.2c-2-2-5.6-1.2-6 1.6-2.8.2-4.4 3.2-3 5.6-2 1.6-1.8 5 .6 6.2-.4 3 2.6 5.2 5.4 4 1.2 2 3 2.2 3 2.2Z M16.5 6.2c2-2 5.6-1.2 6 1.6 2.8.2 4.4 3.2 3 5.6 2 1.6 1.8 5-.6 6.2.4 3-2.6 5.2-5.4 4-1.2 2-3 2.2-3 2.2Z" fill={C.pink} {...o}/><path d="M16 6v20M10 12.6c1.6 0 2.6 1 2.6 2.6M22 12.6c-1.6 0-2.6 1-2.6 2.6M10.6 19.4c1.2-.6 2.6-.2 3.2.8M21.4 19.4c-1.2-.6-2.6-.2-3.2.8" fill="none" stroke={K} strokeWidth={1.4} strokeLinecap="round"/></>,
  graduation: <><path d="M2.5 12.5 16 6.5l13.5 6-13.5 6Z" fill={C.navy} {...o}/><path d="M8.5 15.2v5.6c0 1.8 3.4 3.6 7.5 3.6s7.5-1.8 7.5-3.6v-5.6L16 18.5Z" fill={C.navy} {...o}/><path d="M26 13.8v7.2" stroke={K} strokeWidth={1.6}/><circle cx="26" cy="22.4" r="2" fill={C.gold} {...o} strokeWidth={1.3}/></>,
  star: <Star x={16} y={16.6} r={12.5}/>,
  rocket: <><path d="M16 3c4.6 3.4 6.4 8.4 5.4 15H10.6C9.6 11.4 11.4 6.4 16 3Z" fill={C.white} {...o}/><circle cx="16" cy="11.6" r="2.6" fill={C.sky} {...o} strokeWidth={1.4}/><path d="M10.8 15 6.5 19.5v3.5l4.4-2.4ZM21.2 15l4.3 4.5v3.5l-4.4-2.4Z" fill={C.red} {...o} strokeWidth={1.5}/><path d="M13 18.5c0 3.4 1.4 6.4 3 8.6 1.6-2.2 3-5.2 3-8.6Z" fill={C.orange} {...o} strokeWidth={1.4}/><path d="M14.8 19.4c0 2 .5 3.6 1.2 4.8.7-1.2 1.2-2.8 1.2-4.8Z" fill={C.gold}/></>,
  zap: <path d="M18.6 3 6.5 18h8.2l-1.4 11L25.5 13.6h-8.4Z" fill={C.gold} {...o}/>,
  medal: <><path d="M10 3.5h4.6l3 9-3.6 2.6Z M22 3.5h-4.6l-3 9 3.6 2.6Z" fill={C.red} {...o} strokeWidth={1.5}/><circle cx="16" cy="20" r="8" fill={C.gold} {...o}/><circle cx="16" cy="20" r="5" fill="none" stroke={K} strokeWidth={1.2} opacity=".5"/><Star x={16} y={20.3} r={3} fill={C.white}/></>,
  sunrise: <><path d="M5 22a11 11 0 0 1 22 0Z" fill={C.gold} {...o}/><path d="M16 4.5v3.4M6.6 8.4l2.4 2.4M25.4 8.4 23 10.8M2.8 15.6h3.2M26 15.6h3.2" stroke={K} strokeWidth={1.9} strokeLinecap="round"/><rect x={2.5} y={22} width={27} height={6} rx={2} fill={C.blue} {...o}/><path d="M7 25h4M15 25h7" stroke={C.white} strokeWidth={1.6} strokeLinecap="round"/></>,
  calendar: <><rect x={4} y={6} width={24} height={22} rx={3.2} fill={C.white} {...o}/><path d="M4 9.2A3.2 3.2 0 0 1 7.2 6h17.6A3.2 3.2 0 0 1 28 9.2V12H4Z" fill={C.red} {...o}/><path d="M10.5 3.6v4.6M21.5 3.6v4.6" stroke={K} strokeWidth={2.2} strokeLinecap="round"/><circle cx="16" cy="20" r="5" fill={C.land} {...o} strokeWidth={1.5}/><Check x={16} y={20} s={.62}/></>,
  award: <><path d="M10 18 7 28.5l4-1.6 2.4 3.4L16 21M22 18l3 10.5-4-1.6-2.4 3.4L16 21" fill={T} {...o} strokeWidth={1.5}/><circle cx="16" cy="13" r="9.5" fill={C.gold} {...o}/><circle cx="16" cy="13" r="5.6" fill={C.white} {...o} strokeWidth={1.5}/><Star x={16} y={13.3} r={3} fill={C.gold}/></>,
  gem: <><path d="M9 5h14l5 7-12 15L4 12Z" fill={C.sky} {...o}/><path d="M4 12h24M12 5l-2 7 6 15 6-15-2-7" fill="none" stroke={K} strokeWidth={1.4} strokeLinejoin="round"/><path d="M10 12l6 15L12 12Z" fill={C.blue} opacity=".55"/><path d="M13.2 7.2h2.4" stroke={C.white} strokeWidth={1.8} strokeLinecap="round"/></>,
  party: <><path d="M4 28 10.5 9.5l12 12Z" fill={C.gold} {...o}/><path d="M7.4 18.5l6.6 6.6M9.2 13.6l8.6 8.6" stroke={C.red} strokeWidth={2} /><path d="M4 28 10.5 9.5l12 12Z" fill="none" {...o}/><circle cx="20" cy="6" r="1.8" fill={C.blue} {...o} strokeWidth={1.2}/><circle cx="26.5" cy="13" r="1.7" fill={C.red} {...o} strokeWidth={1.2}/><path d="M15.5 4.5c.4 1.8-.4 3-1.6 3.6M28 6.5c-1.6.4-2.8 1.6-3 3.2" fill="none" stroke={K} strokeWidth={1.6} strokeLinecap="round"/><Spark x={24.5} y={21} r={2.8}/></>,
  checkCircle: <><circle cx="16" cy="16" r="12" fill={C.land} {...o}/><Check x={16} y={16.3} s={1.2}/></>,
  badgeCheck: <><path d="M16 3.5l3 2.4 3.8-.4 1.2 3.6 3.4 1.8-.8 3.8 1.9 3.3-2.6 2.8.1 3.8-3.7 1.1-1.9 3.3-3.5-1.6-3.5 1.6-1.9-3.3-3.7-1.1.1-3.8-2.6-2.8 1.9-3.3-.8-3.8 3.4-1.8 1.2-3.6 3.8.4Z" fill={T} {...o}/><Check x={16} y={16.3} s={1.15}/></>,
  users: <TwoGlobes/>,
  key: <><circle cx="10.5" cy="12" r="6.5" fill={C.gold} {...o}/><circle cx="10.5" cy="12" r="2.4" fill={C.white} {...o} strokeWidth={1.4}/><path d="M15.2 16.6 26.5 27.5M21.5 22.6l2.6-2.6M24.6 25.6l2.4-2.4" {...o} strokeWidth={2.6}/></>,
  download: <><rect x={4.5} y={17} width={23} height={10.5} rx={3} fill={C.mint} {...o}/><path d="M16 4.5v14" {...o} strokeWidth={2.8}/><path d="M10.5 13.5 16 19l5.5-5.5" fill="none" {...o} strokeWidth={2.8}/><circle cx="22.5" cy="22.4" r="1.4" fill={C.land} {...o} strokeWidth={1}/></>,
  mail: <><rect x={3.5} y={7.5} width={25} height={17} rx={3} fill={C.white} {...o}/><path d="M4.5 9 16 17.5 27.5 9" fill="none" {...o}/><circle cx="16" cy="18" r="3.4" fill={C.red} {...o} strokeWidth={1.4}/></>,
  shield: <><path d="M16 3.8 26 7.5v7.2c0 6.4-4.2 11-10 13.5C10.2 25.7 6 21.1 6 14.7V7.5Z" fill={C.land} {...o}/><Check x={16} y={15.4} s={1.05}/></>,
  userPlus: <><Globe x={13} y={16} r={10}/><circle cx="24.5" cy="23.5" r="5.6" fill={C.gold} {...o}/><path d="M24.5 20.8v5.4M21.8 23.5h5.4" stroke={K} strokeWidth={2} strokeLinecap="round"/></>,
};
ICONS['daily-trail'] = ICONS.trail;

/** One Roviko icon as an inline SVG. Decorative unless a `label` is given. */
export function RIcon({ name, size = 24, className = '', label }: { name: string; size?: number; className?: string; label?: string }) {
  return <svg viewBox="0 0 32 32" width={size} height={size} className={'r-icon r-icon-' + name + (className ? ' ' + className : '')} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
    {ICONS[name] ?? ICONS.mixed}
  </svg>;
}
