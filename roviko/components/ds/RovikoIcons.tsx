import React from 'react';
import { RV, MiniGlobe, Sparkle, Plane, Pin } from './RovikoArt';

/*
 * Interface icons in Roviko's illustration style (1.23.1): the same soft flat shapes, warm colours and small
 * navy details as the game logos (GameIcon), drawn in a 24 box with few bold shapes so they stay crisp at
 * 18–28 px. Full colour, readable on cream, white, mint and the dark theme. Small control glyphs (arrows,
 * chevrons, X, checks, the burger) stay plain line icons; these are for things: places, people, rewards.
 * Always decorative (aria-hidden): the label next to the icon carries the meaning.
 */

const NAVY = '#1F3A78';
const PAPER = RV.paper;

/** A white check, for seals and badges. */
const tick = (d = 'M8.4 12.3l2.4 2.4 4.8-5', w = 2) => <path d={d} fill="none" stroke="#fff" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/>;
/** A small shine on a round shape. */
const shine = (cx: number, cy: number, rx = 1.6, ry = .9, angle = -35) => <ellipse cx={cx} cy={cy} rx={rx} ry={ry} transform={`rotate(${angle} ${cx} ${cy})`} fill="#fff" opacity=".55"/>;
/** A scalloped seal (rosette) of radius r around cx, cy. */
const rosette = (cx: number, cy: number, r: number, fill: string) => {
  const pts: string[] = [];
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, rr = i % 2 ? r * .86 : r; pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)} ${(cy + Math.sin(a) * rr).toFixed(2)}`); }
  return <path d={'M' + pts.join('L') + 'Z'} fill={fill} stroke={fill} strokeWidth="1.4" strokeLinejoin="round"/>;
};
/** A five-point star centred on cx, cy. */
const starPath = (cx: number, cy: number, r: number, inner = .48) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * inner : r; pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)} ${(cy + Math.sin(a) * rr).toFixed(2)}`); }
  return 'M' + pts.join('L') + 'Z';
};
/** A gear outline with n teeth. */
const gearPath = (cx: number, cy: number, r: number, teeth = 8, depth = 2.3) => {
  const pts: string[] = [], steps = teeth * 4;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2 - Math.PI / steps, rr = (i % 4 === 1 || i % 4 === 2) ? r + depth : r;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)} ${(cy + Math.sin(a) * rr).toFixed(2)}`);
  }
  return 'M' + pts.join('L') + 'Z';
};

type Art = () => React.ReactElement;

const Compass: Art = () => <>
  <circle cx="12" cy="12.6" r="10.4" fill={RV.goldDeep}/>
  <circle cx="12" cy="12" r="10.4" fill={RV.gold}/>
  <circle cx="12" cy="12" r="7.6" fill={PAPER}/>
  <path d="M12 5.4v1.6M12 17v1.6M5.4 12H7M17 12h1.6" stroke="#C9BFA6" strokeWidth="1.1" strokeLinecap="round"/>
  <g transform="rotate(40 12 12)">
    <path d="M12 4.9l2.3 7.1h-4.6Z" fill={RV.red} stroke={RV.red} strokeWidth=".6" strokeLinejoin="round"/>
    <path d="M12 19.1l2.3-7.1h-4.6Z" fill={NAVY} stroke={NAVY} strokeWidth=".6" strokeLinejoin="round"/>
  </g>
  <circle cx="12" cy="12" r="1.5" fill={RV.gold} stroke={PAPER} strokeWidth=".8"/>
  {shine(6.6, 5.6, 2, .9)}
</>;

const Play: Art = () => <>
  <MiniGlobe x={11} y={11.6} r={10}/>
  <circle cx="18.6" cy="18.4" r="5" fill={RV.gold} stroke={PAPER} strokeWidth="1.3"/>
  <path d="M17.3 16.2v4.4l3.6-2.2Z" fill="#fff" stroke="#fff" strokeWidth="1" strokeLinejoin="round"/>
</>;

/** Two Roviko friends side by side; the front one has a white edge so the two read apart. */
const Friends: Art = () => <>
  <MiniGlobe x={16} y={9.4} r={7} mood="wink" look={-.3}/>
  <path d="M9.6 6.4c-.2-6.6 13-6.6 12.8 0" fill="none" stroke={RV.rose} strokeWidth="1.4" strokeLinecap="round"/>
  <rect x="8.4" y="5.2" width="2.4" height="4" rx="1.1" fill={RV.rose}/><rect x="21.2" y="5.2" width="2.4" height="4" rx="1.1" fill={RV.rose}/>
  <circle cx="8.6" cy="14.8" r="8.4" fill={PAPER}/>
  <MiniGlobe x={8.6} y={14.8} r={7.3} look={.3}/>
</>;

/** Three little Roviko globes (playing with friends). */
const Group: Art = () => <>
  <MiniGlobe x={5.6} y={11.6} r={4.9} mood="wink" look={-.3}/>
  <path d="M1.2 8.6C1.3 3.5 10 3.5 10 8.3Z" fill={RV.gold}/>
  <MiniGlobe x={18.4} y={11.6} r={4.9} mood="cheer" look={.3}/>
  <path d="M13.6 11.4c-.2-6.4 9.8-6.4 9.6 0" fill="none" stroke={RV.rose} strokeWidth="1.3" strokeLinecap="round"/>
  <rect x="12.6" y="9.8" width="2.2" height="3.6" rx="1" fill={RV.rose}/><rect x="22" y="9.8" width="2.2" height="3.6" rx="1" fill={RV.rose}/>
  <circle cx="12" cy="15.4" r="7.6" fill={PAPER}/>
  <MiniGlobe x={12} y={15.4} r={6.7}/>
</>;

/** A globe and a gold question bubble: someone you don't know yet. */
const Random: Art = () => <>
  <MiniGlobe x={10.6} y={13.4} r={9.6} mood="curious" look={-.2}/>
  <path d="M18 1.6a5.1 5.1 0 1 1-2.4 9.6l-2.6.8.8-2.4A5.1 5.1 0 0 1 18 1.6Z" fill={RV.gold} stroke={PAPER} strokeWidth="1.1" strokeLinejoin="round"/>
  <path d="M16.6 5.4a1.5 1.5 0 1 1 2.2 1.3c-.5.3-.8.6-.8 1.1" fill="none" stroke={RV.ink} strokeWidth="1.2" strokeLinecap="round"/>
  <circle cx="18" cy="9.4" r=".65" fill={RV.ink}/>
</>;

/** Roviko as a friendly robot: antenna, dark visor, mint eyes (like the computer avatar). */
const Robot: Art = () => <>
  <path d="M12 4.2V1.8" stroke={RV.ink} strokeWidth="1.2" strokeLinecap="round"/>
  <circle cx="12" cy="1.8" r="1.4" fill={RV.gold}/>
  <MiniGlobe x={12} y={13.6} r={9.6} mood="none"/>
  <rect x="5" y="9.6" width="14" height="5.8" rx="2.9" fill="#0F2C25"/>
  <ellipse cx="9.2" cy="12.5" rx="1.25" ry="1.4" fill="#7CF3D4"/><ellipse cx="14.8" cy="12.5" rx="1.25" ry="1.4" fill="#7CF3D4"/>
  <path d="M10.4 18q1.6 1.2 3.2 0" stroke={RV.ink} strokeWidth=".9" strokeLinecap="round" fill="none"/>
  <rect x="1.2" y="11.4" width="2.2" height="4.4" rx="1.1" fill={RV.gold}/><rect x="20.6" y="11.4" width="2.2" height="4.4" rx="1.1" fill={RV.gold}/>
</>;

const Passport: Art = () => <g transform="rotate(-7 12 12)">
  <rect x="6.2" y="2.6" width="14" height="19.6" rx="2.2" fill={PAPER} stroke="#E6DCC4" strokeWidth=".8"/>
  <rect x="4.4" y="1.8" width="14" height="19.6" rx="2.2" fill={NAVY}/>
  <path d="M6.6 1.8H5.9a1.5 1.5 0 0 0-1.5 1.5v16.6a1.5 1.5 0 0 0 1.5 1.5h.7Z" fill="#162C5E"/>
  <g fill="none" stroke={RV.gold} strokeWidth="1.15" strokeLinecap="round">
    <circle cx="12" cy="9.4" r="3.7"/><ellipse cx="12" cy="9.4" rx="1.55" ry="3.7"/><path d="M8.4 9.4h7.2" strokeWidth=".9"/>
  </g>
  <rect x="8.2" y="15.4" width="7.6" height="1.4" rx=".7" fill={RV.gold}/>
  <rect x="9.2" y="18" width="5.6" height="1.1" rx=".55" fill={RV.gold} opacity=".55"/>
</g>;

const Account: Art = () => <>
  <rect x="1.6" y="4.4" width="20.8" height="16" rx="3" fill="#E6DCC4"/>
  <rect x="1.6" y="3.6" width="20.8" height="16" rx="3" fill={PAPER}/>
  <path d="M1.6 6.6a3 3 0 0 1 3-3h14.8a3 3 0 0 1 3 3v.6H1.6Z" fill={RV.green}/>
  <circle cx="7.6" cy="13.2" r="3.9" fill={RV.mint}/>
  <MiniGlobe x={7.6} y={13.2} r={3.3}/>
  <rect x="13" y="10.6" width="6.6" height="1.6" rx=".8" fill={RV.gold}/>
  <rect x="13" y="14" width="5" height="1.4" rx=".7" fill="#CFC5AE"/>
</>;

const Settings: Art = () => <>
  <path d={gearPath(12, 12.6, 7.4)} fill={RV.goldDeep} stroke={RV.goldDeep} strokeWidth="1.2" strokeLinejoin="round"/>
  <path d={gearPath(12, 12, 7.4)} fill={RV.gold} stroke={RV.gold} strokeWidth="1.2" strokeLinejoin="round"/>
  <circle cx="12" cy="12" r="3.2" fill={PAPER} stroke={RV.goldDeep} strokeWidth="1"/>
  {shine(8.4, 7.4, 1.6, .8)}
</>;

const Trophy: Art = () => <>
  <path d="M6.6 5.4H3.6c0 4 1.6 5.8 4.4 6.2M17.4 5.4h3c0 4-1.6 5.8-4.4 6.2" fill="none" stroke={RV.goldDeep} strokeWidth="1.7" strokeLinecap="round"/>
  <path d="M5.8 2.6h12.4v4.6a6.2 6.2 0 0 1-12.4 0Z" fill={RV.gold}/>
  <path d="M14.6 2.6h3.6v4.6a6.2 6.2 0 0 1-4.7 6Z" fill={RV.goldDeep} opacity=".5"/>
  <rect x="10.6" y="13" width="2.8" height="4" fill={RV.goldDeep}/>
  <rect x="7" y="16.6" width="10" height="3.2" rx="1.2" fill={RV.wood}/>
  <rect x="5.8" y="19.4" width="12.4" height="2.6" rx="1.3" fill="#7F5130"/>
  <path d={starPath(12, 7.4, 2.7)} fill="#fff" stroke="#fff" strokeWidth=".4" strokeLinejoin="round"/>
</>;

const Help: Art = () => <>
  <path d="M12 2.4c5.5 0 9.6 3.6 9.6 8.2s-4.1 8.2-9.6 8.2c-.9 0-1.8-.1-2.6-.3L5 21.4l.8-4.4c-2.1-1.5-3.4-3.8-3.4-6.4 0-4.6 4.1-8.2 9.6-8.2Z" fill={RV.blue}/>
  <path d="M9.3 8.5a2.8 2.8 0 1 1 4.1 2.5c-.9.5-1.4 1-1.4 2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
  <circle cx="12" cy="15.9" r="1.15" fill="#fff"/>
  {shine(6.8, 5.6, 1.8, .8)}
</>;

const Scoring: Art = () => <>
  <circle cx="11" cy="13.4" r="9.6" fill={RV.goldDeep}/>
  <circle cx="11" cy="12.4" r="9.6" fill={RV.gold}/>
  <circle cx="11" cy="12.4" r="6.9" fill="none" stroke={RV.goldDeep} strokeWidth="1.3"/>
  <path d={starPath(11, 12.6, 4)} fill="#fff" stroke="#fff" strokeWidth=".6" strokeLinejoin="round"/>
  {shine(6.6, 6.8, 1.9, .9)}
  <Sparkle x={20.4} y={4.2} s={1.15} fill={RV.goldDeep}/>
</>;

const Target: Art = () => <>
  <circle cx="11" cy="13" r="9.6" fill={RV.red}/>
  <circle cx="11" cy="13" r="6.8" fill="#fff"/>
  <circle cx="11" cy="13" r="4.2" fill={RV.red}/>
  <circle cx="11" cy="13" r="1.8" fill="#fff"/>
  <path d="M11.4 12.6l8.4-8.4" stroke={RV.ink} strokeWidth="1.6" strokeLinecap="round"/>
  <path d="M18.4 5.6l.4-3.6 2-.4.2 2.4 2.4.2-.4 2-3.6.4Z" fill={RV.gold} stroke={RV.gold} strokeWidth=".6" strokeLinejoin="round"/>
</>;

const Crown: Art = () => <>
  <path d="M3.4 18.4 2.4 7.6l5 4.2L12 4.4l4.6 7.4 5-4.2-1 10.8Z" fill={RV.gold} stroke={RV.gold} strokeWidth="1.4" strokeLinejoin="round"/>
  <path d="M12 4.4l4.6 7.4 5-4.2-1 10.8h-6.8Z" fill={RV.goldDeep} opacity=".35"/>
  <rect x="3.2" y="17.4" width="17.6" height="3.6" rx="1.4" fill={RV.goldDeep}/>
  <circle cx="12" cy="13.4" r="1.9" fill={RV.red}/>
  <circle cx="2.4" cy="7" r="1.4" fill={RV.gold}/><circle cx="12" cy="3.6" r="1.5" fill={RV.gold}/><circle cx="21.6" cy="7" r="1.4" fill={RV.gold}/>
  {shine(6.2, 13, 1.4, .7, -60)}
</>;

const Flame: Art = () => <>
  <path d="M12.2 1.8c.7 3.3-1.1 5-2.8 6.8C7.7 10.4 6 12.2 6 15c0 4 2.7 7.2 6 7.2s6.1-3 6.1-7c0-2.4-1-4.2-2.4-5.7.1 1.7-.5 3-1.6 3.5.4-3.9-.8-8.2-1.9-11.2z" fill="#F0642B"/>
  <path d="M12.1 22.2c-2.1 0-3.6-1.6-3.6-3.8 0-2.1 1.6-3.2 2.7-4.7.3 1.3 1 2.1 2 2.4-.2-1.1.2-2.1.9-2.7 1 1.3 1.6 2.7 1.6 4.4 0 2.5-1.5 4.4-3.6 4.4z" fill="#FFC93D"/>
</>;

const Gift: Art = () => <>
  <rect x="3.4" y="10.4" width="17.2" height="11.2" rx="2" fill={RV.coral}/>
  <rect x="2.4" y="7.4" width="19.2" height="4.4" rx="1.6" fill="#F7826B"/>
  <rect x="10.4" y="7.4" width="3.2" height="14.2" fill={RV.gold}/>
  <rect x="3.4" y="11.8" width="17.2" height="1.4" fill={RV.coralDeep} opacity=".35"/>
  <path d="M12 7.4C9.6 3.4 5.6 4 6.6 6.4c.6 1.3 3.2 1 5.4 1ZM12 7.4c2.4-4 6.4-3.4 5.4-1-.6 1.3-3.2 1-5.4 1Z" fill={RV.gold} stroke={RV.goldDeep} strokeWidth=".7" strokeLinejoin="round"/>
</>;

const Sound: Art = () => <>
  <path d="M2.8 9.2h3.6l5.4-4.6v14.8l-5.4-4.6H2.8a1 1 0 0 1-1-1V10.2a1 1 0 0 1 1-1Z" fill={RV.blue} stroke={RV.blue} strokeWidth="1" strokeLinejoin="round"/>
  <path d="M6.4 9.2l5.4-4.6v14.8l-5.4-4.6Z" fill={RV.blueDeep}/>
  <path d="M15.2 9.2c1.4 1.6 1.4 4 0 5.6M18.2 6.4c3 3.2 3 8 0 11.2" fill="none" stroke={RV.gold} strokeWidth="1.9" strokeLinecap="round"/>
</>;

const Music: Art = () => <>
  <path d="M8.6 17.2V5.6l11-2.6v11.6" fill="none" stroke={RV.purple} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
  <path d="M8.6 5.6l11-2.6v3.4l-11 2.6Z" fill={RV.purple}/>
  <ellipse cx="6" cy="17.6" rx="3.4" ry="2.7" transform="rotate(-18 6 17.6)" fill={RV.purple}/>
  <ellipse cx="17" cy="15.2" rx="3.4" ry="2.7" transform="rotate(-18 17 15.2)" fill={RV.purple}/>
  {shine(5, 16.6, 1.2, .6)}{shine(16, 14.2, 1.2, .6)}
  <Sparkle x={3.6} y={5.2} s={1.05} fill={RV.gold}/>
</>;

const Phone: Art = () => <>
  <rect x="6.6" y="1.6" width="10.8" height="20.8" rx="2.6" fill={NAVY}/>
  <rect x="8" y="4" width="8" height="14.6" rx="1.2" fill={RV.sky}/>
  <MiniGlobe x={12} y={11.4} r={3.3}/>
  <rect x="10.4" y="19.8" width="3.2" height="1" rx=".5" fill="#fff" opacity=".7"/>
  <path d="M3.6 8.4c-1 2.2-1 5 0 7.2M20.4 8.4c1 2.2 1 5 0 7.2" fill="none" stroke={RV.gold} strokeWidth="1.7" strokeLinecap="round"/>
</>;

const Language: Art = () => <>
  <path d="M15 6.6h4.6a2.4 2.4 0 0 1 2.4 2.4v5.4a2.4 2.4 0 0 1-2.4 2.4h-.6v2.6l-3-2.6h-3.6a2.4 2.4 0 0 1-2.4-2.4V9a2.4 2.4 0 0 1 2.4-2.4Z" fill={RV.gold}/>
  <path d="M13.4 10h6M16.4 8.8v1.2M14.4 10c.4 2 2 3.6 4.4 4.2M18.4 10c-.4 2-2 3.6-4.4 4.2" fill="none" stroke={RV.ink} strokeWidth="1" strokeLinecap="round"/>
  <path d="M4.4 2.6h7.2A2.4 2.4 0 0 1 14 5v6a2.4 2.4 0 0 1-2.4 2.4H8.2L5 16.2v-2.8h-.6A2.4 2.4 0 0 1 2 11V5a2.4 2.4 0 0 1 2.4-2.4Z" fill={RV.green} stroke={PAPER} strokeWidth="1"/>
  <path d="M5.4 11l2.6-6.4 2.6 6.4M6.3 8.9h3.4" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</>;

const Palette: Art = () => <>
  <path d="M12 2.4c5.6 0 10 3.8 10 8.6 0 3-2 4.4-4.4 4.4h-2.2c-1.3 0-2 1.1-1.4 2.2.8 1.6-.2 3.8-2.6 3.8C6 21.4 2 17 2 11.6 2 6.4 6.4 2.4 12 2.4Z" fill="#F4E3BF"/>
  <path d="M12 2.4c5.6 0 10 3.8 10 8.6 0 3-2 4.4-4.4 4.4h-2.2c-1.3 0-2 1.1-1.4 2.2.8 1.6-.2 3.8-2.6 3.8-.4 0 2.4-2 .4-3.6s1.4-3.8 4-3.8 4.4-1 4.4-3.8S18 4.4 12 2.4Z" fill="#E6CF9C" opacity=".7"/>
  <circle cx="7" cy="12.4" r="1.9" fill={RV.red}/><circle cx="7.8" cy="7.4" r="1.9" fill={RV.gold}/>
  <circle cx="12.6" cy="5.8" r="1.9" fill={RV.blue}/><circle cx="17" cy="8.6" r="1.9" fill={RV.land}/>
</>;

const Sun: Art = () => <>
  <g stroke={RV.gold} strokeWidth="2" strokeLinecap="round">
    {[0, 45, 90, 135, 180, 225, 270, 315].map(a => <path key={a} d="M12 1.8v2.4" transform={`rotate(${a} 12 12)`}/>)}
  </g>
  <circle cx="12" cy="12" r="5.6" fill={RV.gold}/>
  <path d="M12 6.4a5.6 5.6 0 0 1 0 11.2Z" fill={RV.goldDeep} opacity=".35"/>
  {shine(9.8, 9.6, 1.4, .7)}
</>;

const Moon: Art = () => <>
  <path d="M15.6 3.2A9.4 9.4 0 1 0 20.8 16a7.6 7.6 0 0 1-5.2-12.8Z" fill={RV.purpleLight}/>
  <path d="M15.6 3.2A9.4 9.4 0 0 0 7 19.4a9 9 0 0 0 13.8-3.4 7.6 7.6 0 0 1-5.2-12.8Z" fill={RV.purple} opacity=".35"/>
  <Sparkle x={19.4} y={5.4} s={1.1} fill={RV.gold}/>
  <circle cx="8.6" cy="11.2" r="1.1" fill="#fff" opacity=".45"/>
</>;

const Chart: Art = () => <>
  <rect x="3" y="11.4" width="4.6" height="9.4" rx="1.4" fill={RV.coral}/>
  <rect x="9.7" y="6.8" width="4.6" height="14" rx="1.4" fill={RV.blue}/>
  <rect x="16.4" y="2.8" width="4.6" height="18" rx="1.4" fill={RV.gold}/>
  <rect x="1.8" y="20.2" width="20.4" height="1.8" rx=".9" fill="#B9AE95"/>
</>;

const Verified: Art = () => <>{rosette(12, 12, 10, RV.landDeep)}{tick('M7.8 12.3l2.8 2.8 5.6-6', 2.2)}</>;
const VerifiedGold: Art = () => <>{rosette(12, 12, 10, RV.blue)}{tick('M7.8 12.3l2.8 2.8 5.6-6', 2.2)}</>;

const Envelope = ({ alert = false }: { alert?: boolean }) => <>
  <rect x="1.8" y="5" width="20.4" height="15" rx="2.4" fill={PAPER} stroke="#D9CFB8" strokeWidth=".9"/>
  <path d="M2.6 6.4l9.4 7 9.4-7" fill="none" stroke={RV.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  {alert
    ? <><circle cx="19" cy="17" r="4.6" fill={RV.gold} stroke={PAPER} strokeWidth="1.1"/><path d="M19 14.6v2.6" stroke={RV.ink} strokeWidth="1.5" strokeLinecap="round"/><circle cx="19" cy="19.4" r=".8" fill={RV.ink}/></>
    : <rect x="16" y="14.4" width="4" height="3.6" rx=".6" fill={RV.coral}/>}
</>;

const Key: Art = () => <>
  <circle cx="8" cy="12" r="5.8" fill={RV.gold}/>
  <circle cx="7" cy="12" r="1.9" fill={PAPER}/>
  <path d="M13 10.6h9a.9.9 0 0 1 .9.9v1.1a.9.9 0 0 1-.9.9h-1.2v2.6h-2.4v-2.6h-1.4v2h-2.4v-2H13Z" fill={RV.goldDeep}/>
  {shine(5.6, 8.4, 1.4, .7)}
</>;

const Download: Art = () => <>
  <path d="M2.4 14.4h5.2l1.4 2.4h6l1.4-2.4h5.2v5a2.4 2.4 0 0 1-2.4 2.4H4.8a2.4 2.4 0 0 1-2.4-2.4Z" fill={RV.blue}/>
  <path d="M2.4 14.4h5.2l1.4 2.4h6l1.4-2.4h5.2v1.4H16.2l-1.4 2.4H9.2L7.8 15.8H2.4Z" fill={RV.blueDeep}/>
  <path d="M10.2 2.4h3.6v6.2h3.2L12 13.8 7 8.6h3.2Z" fill={RV.landDeep} stroke={RV.landDeep} strokeWidth="1" strokeLinejoin="round"/>
</>;

const Shield: Art = () => <>
  <path d="M12 1.8 20.4 5v6.2c0 5.2-3.6 9-8.4 11-4.8-2-8.4-5.8-8.4-11V5Z" fill={RV.green}/>
  <path d="M12 1.8 20.4 5v6.2c0 5.2-3.6 9-8.4 11Z" fill="#17654F"/>
  {tick('M8.2 11.8l2.6 2.6 5-5.2', 2.1)}
</>;

const Door: Art = () => <>
  <rect x="3.4" y="2.4" width="12" height="19.2" rx="1.6" fill="#7F5130"/>
  <path d="M5 4h8.8v17.6L5 19.8Z" fill={RV.wood}/>
  <circle cx="11.6" cy="12.6" r="1" fill={RV.gold}/>
  <path d="M15.6 12h6.2M19.2 9.2l2.8 2.8-2.8 2.8" fill="none" stroke={RV.coral} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
</>;

const Trash: Art = () => <>
  <rect x="4.6" y="7.4" width="14.8" height="14.4" rx="2.4" fill={RV.coral}/>
  <path d="M9.2 10.6v7.6M12 10.6v7.6M14.8 10.6v7.6" stroke="#fff" strokeOpacity=".7" strokeWidth="1.3" strokeLinecap="round"/>
  <rect x="2.6" y="4.4" width="18.8" height="3.4" rx="1.7" fill={RV.coralDeep}/>
  <path d="M9.4 4.4V3.4a1.2 1.2 0 0 1 1.2-1.2h2.8a1.2 1.2 0 0 1 1.2 1.2v1" fill="none" stroke={RV.coralDeep} strokeWidth="1.4"/>
</>;

const AddFriend: Art = () => <>
  <MiniGlobe x={10} y={12.6} r={9}/>
  <circle cx="18.6" cy="18.2" r="5" fill={RV.green} stroke={PAPER} strokeWidth="1.3"/>
  <path d="M18.6 15.8v4.8M16.2 18.2H21" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
</>;

const Clock: Art = () => <>
  <circle cx="12" cy="12" r="10" fill={RV.blue}/>
  <circle cx="12" cy="12" r="7.6" fill={PAPER}/>
  <path d="M12 7.4V12l3 2" fill="none" stroke={RV.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
</>;

/* ── achievements ─────────────────────────────────────────────────────────── */

const Footprints: Art = () => {
  const foot = (x: number, y: number, a: number, c: string) => <g transform={`translate(${x} ${y}) rotate(${a})`}>
    <path d="M0-3.6c2 0 2.8 1.8 2.6 4-.2 2.4-1 4.6-2.6 4.6S-2.8 3-2.6.6C-2.4-1.8-2-3.6 0-3.6Z" fill={c}/>
    <circle cx="-1.6" cy="-5.2" r=".9" fill={c}/><circle cx="0" cy="-5.8" r=".95" fill={c}/><circle cx="1.6" cy="-5.2" r=".85" fill={c}/>
  </g>;
  return <>{foot(8, 15, -14, RV.wood)}{foot(16, 9.4, 12, '#C98B55')}</>;
};

const MapIcon: Art = () => <>
  <path d="M2 5.4l6.4-2 7.2 2 6.4-2v15.2l-6.4 2-7.2-2-6.4 2Z" fill="#FBF0D6"/>
  <path d="M8.4 3.4l7.2 2v15.2l-7.2-2Z" fill="#EEDDB6"/>
  <path d="M4.6 16.4c2.6 1.8 4.6-2.4 7.6-1.4 2.8 1 3.4-3.6 6-4.4" fill="none" stroke={RV.green} strokeWidth="1.3" strokeLinecap="round" strokeDasharray="1.4 1.6"/>
  <path d="M5 6.8l1.8 3.2H3.2Z" fill={RV.landDeep}/>
  <Pin x={18.6} y={10.8} s={.95}/>
</>;

const PlaneIcon: Art = () => <>
  <path d="M2.4 20.4c3-1.4 4.6-4.6 7.6-6" fill="none" stroke={RV.blue} strokeWidth="1.3" strokeLinecap="round" strokeDasharray="1.4 1.8"/>
  <Plane x={14.4} y={10} s={1.35} angle={-35}/>
</>;

const Earth: Art = () => <MiniGlobe x={12} y={12} r={10.4}/>;

const Bulb: Art = () => <>
  <path d="M12 2.6a6.6 6.6 0 0 0-3.8 12v2.2h7.6v-2.2A6.6 6.6 0 0 0 12 2.6Z" fill={RV.gold}/>
  <path d="M12 2.6a6.6 6.6 0 0 1 3.8 12v2.2H13.4v-2.6c2.6-2 3.2-7.4-1.4-11.6Z" fill={RV.goldDeep} opacity=".4"/>
  <rect x="8.4" y="16.4" width="7.2" height="2.2" rx=".8" fill="#8D97AE"/>
  <rect x="9.2" y="18.8" width="5.6" height="2.2" rx="1" fill="#6F7A93"/>
  <ellipse cx="9.8" cy="7.2" rx="1.1" ry="1.6" fill="#fff" opacity=".7"/>
  <path d="M2.6 8.6h1.8M19.6 8.6h1.8M4.4 3.4l1.3 1.3M19.6 3.4l-1.3 1.3" stroke={RV.goldDeep} strokeWidth="1.3" strokeLinecap="round"/>
</>;

const Brain: Art = () => <>
  <path d="M11.4 4.2C10 2.4 6.6 2.8 6.2 5.2 3.6 5.2 2.4 8 3.6 9.8 1.8 11.4 2.4 14.4 4.6 15c-.2 2.6 2.4 4.4 4.6 3.4.8 1.8 2.2 2 2.2 2Z" fill="#FF9FB4"/>
  <path d="M12.6 4.2C14 2.4 17.4 2.8 17.8 5.2c2.6 0 3.8 2.8 2.6 4.6 1.8 1.6 1.2 4.6-1 5.2.2 2.6-2.4 4.4-4.6 3.4-.8 1.8-2.2 2-2.2 2Z" fill="#FF8FA3"/>
  <path d="M6.2 5.2c1 .2 1.8 1 2 2M3.6 9.8c1-.4 2.4-.2 3.2.8M4.6 15c.8-1 2-1.4 3-1.2M17.8 5.2c-1 .2-1.8 1-2 2M20.4 9.8c-1-.4-2.4-.2-3.2.8M19.4 15c-.8-1-2-1.4-3-1.2" fill="none" stroke="#D9577A" strokeWidth="1.1" strokeLinecap="round"/>
</>;

const Graduation: Art = () => <>
  <path d="M6 11v4.4c0 1.8 2.8 3.2 6 3.2s6-1.4 6-3.2V11" fill="#2C4C93"/>
  <path d="M12 4 1.6 8.8 12 13.6l10.4-4.8Z" fill={NAVY} stroke={NAVY} strokeWidth="1" strokeLinejoin="round"/>
  <path d="M12 8.8l7.6 1.6v6.4" fill="none" stroke={RV.gold} strokeWidth="1.2" strokeLinecap="round"/>
  <path d="M19.6 16.4l1.4 3.4h-2.8Z" fill={RV.gold} stroke={RV.gold} strokeWidth=".8" strokeLinejoin="round"/>
</>;

const Sparkles: Art = () => <>
  <Sparkle x={10} y={13} s={3.4}/>
  <Sparkle x={18.8} y={5.4} s={1.6} fill={RV.goldDeep}/>
  <Sparkle x={18.6} y={18.6} s={1.2} fill={RV.purpleLight}/>
</>;

const Star: Art = () => <>
  <path d={starPath(12, 13, 10.4, .5)} fill={RV.goldDeep} stroke={RV.goldDeep} strokeWidth="1.6" strokeLinejoin="round"/>
  <path d={starPath(12, 12.2, 10.4, .5)} fill={RV.gold} stroke={RV.gold} strokeWidth="1.6" strokeLinejoin="round"/>
  {shine(9.4, 8.6, 1.4, .8, -50)}
</>;

const Rocket: Art = () => <g transform="rotate(40 12 12)">
  <path d="M12 21.6c-1.4-1.6-1.8-3-1.4-4.4h2.8c.4 1.4 0 2.8-1.4 4.4Z" fill={RV.orange}/>
  <path d="M8.4 13.2 5.6 17v1.4l3.2-1.4ZM15.6 13.2l2.8 3.8v1.4l-3.2-1.4Z" fill={RV.coral}/>
  <path d="M12 1.6c3.2 2.4 4.4 6.4 3.6 15.6H8.4C7.6 8 8.8 4 12 1.6Z" fill={PAPER} stroke="#D9CFB8" strokeWidth=".8"/>
  <path d="M12 1.6c1.4 1 2.4 2.4 3 4.2H9c.6-1.8 1.6-3.2 3-4.2Z" fill={RV.coral}/>
  <circle cx="12" cy="10" r="2.1" fill={RV.ocean} stroke={NAVY} strokeWidth="1"/>
</g>;

const Zap: Art = () => <>
  <path d="M13.6 1.8 4.6 13.4h6.2l-1.8 8.8 9.4-12.2h-6.4Z" fill={RV.gold} stroke={RV.gold} strokeWidth="1.4" strokeLinejoin="round"/>
  <path d="M13.6 1.8 12 10h6.4l-9.4 12.2 2.2-7.2Z" fill={RV.goldDeep} opacity=".4"/>
</>;

const Medal: Art = () => <>
  <path d="M5.6 1.8h4.6l3 6.4-3.4 2.4Z" fill={RV.blue}/>
  <path d="M18.4 1.8h-4.6l-3 6.4 3.4 2.4Z" fill={RV.red}/>
  <circle cx="12" cy="15.4" r="7" fill={RV.goldDeep}/>
  <circle cx="12" cy="14.8" r="6.6" fill={RV.gold}/>
  <path d={starPath(12, 15, 3.4)} fill="#fff" stroke="#fff" strokeWidth=".5" strokeLinejoin="round"/>
</>;

const Sunrise: Art = () => <>
  <g stroke={RV.gold} strokeWidth="1.9" strokeLinecap="round">
    {[-70, -35, 0, 35, 70].map(a => <path key={a} d="M12 2.6v2.4" transform={`rotate(${a} 12 14)`}/>)}
  </g>
  <path d="M5 14.4a7 7 0 0 1 14 0Z" fill={RV.gold}/>
  <path d="M1.6 21.4c3-5.6 7.6-7.2 10.6-5.6 3-2 7.4-1.2 10.2 5.6Z" fill={RV.land}/>
  <path d="M12.2 15.8c3-2 7.4-1.2 10.2 5.6h-4.6c-1-3-3-4.8-5.6-5.6Z" fill={RV.landDeep}/>
</>;

const Calendar: Art = () => <>
  <rect x="2.6" y="4" width="18.8" height="17.6" rx="2.6" fill={PAPER} stroke="#D9CFB8" strokeWidth=".9"/>
  <path d="M2.6 6.6A2.6 2.6 0 0 1 5.2 4h13.6a2.6 2.6 0 0 1 2.6 2.6v2.6H2.6Z" fill={RV.coral}/>
  <rect x="6.6" y="2" width="2" height="4.4" rx="1" fill={NAVY}/><rect x="15.4" y="2" width="2" height="4.4" rx="1" fill={NAVY}/>
  <path d="M7.8 14.6l2.8 2.8 5.6-5.6" fill="none" stroke={RV.green} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
</>;

const Award: Art = () => <>
  <path d="M7.2 13.6 4.6 21.6l3.4-1 2 2.6 2-7.2ZM16.8 13.6l2.6 8-3.4-1-2 2.6-2-7.2Z" fill={RV.coral}/>
  {rosette(12, 10, 8.4, RV.blue)}
  <circle cx="12" cy="10" r="4.6" fill={RV.gold}/>
  <path d={starPath(12, 10.2, 2.6)} fill="#fff"/>
</>;

const Gem: Art = () => <>
  <path d="M6.4 3.4h11.2l4.4 5.6L12 21.4 2 9Z" fill="#4FC3E8" stroke="#4FC3E8" strokeWidth="1" strokeLinejoin="round"/>
  <path d="M2 9h20L12 21.4Z" fill="#2E9FD0"/>
  <path d="M7.6 9 12 21.4 16.4 9Z" fill="#62D2F2"/>
  <path d="M6.4 3.4 7.6 9 12 3.4l4.4 5.6 1.2-5.6" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth=".9" strokeLinejoin="round"/>
  {shine(8, 6.2, 1.2, .6, -20)}
</>;

const Party: Art = () => <>
  <path d="M2.4 21.6 7 8.2l8.8 8.8Z" fill={RV.gold}/>
  <path d="M4.2 16.4l3.4 3.4M5.6 12.2l6.2 6.2" stroke={RV.coral} strokeWidth="1.6" strokeLinecap="round"/>
  <path d="M7 8.2l8.8 8.8" stroke={RV.goldDeep} strokeWidth="1.2" strokeLinecap="round"/>
  <path d="M12.6 7.4c.8-2 2.6-2.6 2.4-4.6M16.4 11.4c2-.8 2.8.6 4.8-.4" fill="none" stroke={RV.purple} strokeWidth="1.4" strokeLinecap="round"/>
  <circle cx="19.4" cy="4.4" r="1.4" fill={RV.blue}/><circle cx="10.2" cy="3.2" r="1.1" fill={RV.coral}/><circle cx="20.8" cy="15.4" r="1.1" fill={RV.land}/>
  <Sparkle x={15.6} y={7.4} s={.9} fill={RV.rose}/>
</>;

const CheckCircle: Art = () => <><circle cx="12" cy="12" r="10" fill={RV.landDeep}/>{tick('M7.6 12.4l3 3 5.8-6.2', 2.4)}{shine(7, 6.4, 1.6, .8)}</>;

const ICONS = {
  // tab bar and menu
  play: Play, explore: Compass, multiplayer: Friends, passport: Passport,
  account: Account, friends: Friends, settings: Settings, trophy: Trophy, tour: Compass, help: Help, scoring: Scoring,
  // multiplayer choices
  group: Group, random: Random, robot: Robot,
  // quests, home and rewards
  target: Target, crown: Crown, flame: Flame, gift: Gift, clock: Clock,
  // settings
  sound: Sound, music: Music, phone: Phone, language: Language, palette: Palette, sun: Sun, moon: Moon, chart: Chart,
  // account and friends
  verified: Verified, mail: () => <Envelope/>, mailAlert: () => <Envelope alert/>, key: Key, download: Download, shield: Shield,
  logout: Door, trash: Trash, addFriend: AddFriend,
  // achievements
  footprints: Footprints, map: MapIcon, plane: PlaneIcon, earth: Earth, bulb: Bulb, brain: Brain, graduation: Graduation,
  sparkles: Sparkles, star: Star, rocket: Rocket, zap: Zap, medal: Medal, sunrise: Sunrise, calendar: Calendar,
  award: Award, gem: Gem, party: Party, checkCircle: CheckCircle, badgeCheck: VerifiedGold,
} satisfies Record<string, Art>;

export type RovikoIconName = keyof typeof ICONS;
export const ROVIKO_ICON_NAMES = Object.keys(ICONS) as RovikoIconName[];

/** One Roviko interface icon. Decorative: always put a text label next to it. */
export function RovikoIcon({ name, size = 24, className = '' }: { name: RovikoIconName; size?: number; className?: string }) {
  const Art = ICONS[name] ?? Compass;
  return <svg viewBox="0 0 24 24" width={size} height={size} className={`rv-icon rv-icon-${name}${className ? ' ' + className : ''}`} aria-hidden="true" focusable="false">
    <g stroke="none"><Art/></g>
  </svg>;
}
