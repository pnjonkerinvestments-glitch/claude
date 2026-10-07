import React from 'react';
import { RV, MiniGlobe, Sparkle, GroundShadow, Plane, Pin, Hand } from '../ds/RovikoArt';

/*
 * One logo per game, used everywhere the interface names a game: game headers, cards, tabs, quests,
 * scoring and the room settings. Since 1.23.1 every logo is a tiny full-colour version of that game's
 * illustration, drawn in Roviko's own style (soft flat shapes, warm colours, navy only for small details,
 * Roviko the globe where it helps). It sits on a soft tile in the game's own colour (`game-icon-<mode>`
 * in design.css, refined in trip-icons.css). Drawn in a 40 box; few bold shapes so it still reads at 24px.
 */

type Logo = () => React.ReactElement;

// Daily Detour: a navy passport with a gold globe emblem, Roviko peeking from behind and a plane on its way.
const Daily: Logo = () => <>
  <GroundShadow x={19} y={36} rx={13}/>
  <MiniGlobe x={29.2} y={22.5} r={7.6} mood="wink" look={.5}/>
  <Hand x={22.8} y={27.8} angle={-30}/>
  <g transform="rotate(-9 15 21)">
    <rect x="8.4" y="9.4" width="17" height="24.6" rx="2.6" fill={RV.paper}/>
    <rect x="7" y="8" width="17" height="24.6" rx="2.6" fill="#1F3A78"/>
    <path d="M9.6 8H7.8A.8.8 0 0 0 7 8.8v23a.8.8 0 0 0 .8.8h1.8Z" fill="#162C5E"/>
    <rect x="7.6" y="8.6" width="15.8" height="23.4" rx="2.1" fill="none" stroke="#fff" strokeOpacity=".14" strokeWidth=".8"/>
    <g fill="none" stroke={RV.gold} strokeWidth="1.25" strokeLinecap="round">
      <circle cx="16.3" cy="17.4" r="4.6"/>
      <ellipse cx="16.3" cy="17.4" rx="2" ry="4.6"/>
      <path d="M11.8 17.4h9M12.6 15h7.4M12.6 19.8h7.4" strokeWidth=".9"/>
    </g>
    <rect x="11.6" y="25" width="9.4" height="1.5" rx=".75" fill={RV.gold}/>
    <rect x="12.8" y="28" width="7" height="1.3" rx=".65" fill={RV.gold} opacity=".55"/>
  </g>
  <path d="M5.2 10.4C6.4 4.6 14 2.4 23.6 5.4" fill="none" stroke={RV.blue} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1.6 2"/>
  <Plane x={30} y={7.4} s={.95} angle={-14}/>
</>;

// Rank Radar: Roviko holding on behind three podium bars, the tallest gold one with a crown.
const Rank: Logo = () => {
  const bar = (x: number, top: number, w: number, c: string, dark: string, light: string) => <g>
    <path d={`M${x} ${top}V33.2a${w / 2} 1.6 0 0 0 ${w} 0V${top}Z`} fill={c}/>
    <path d={`M${x + w * .76} ${top}V34.7a${w / 2} 1.6 0 0 0 ${w * .24} -1.5V${top}Z`} fill={dark} opacity=".45"/>
    <ellipse cx={x + w / 2} cy={top} rx={w / 2} ry="1.6" fill={light}/>
  </g>;
  return <>
    <GroundShadow x={20} y={35.4} rx={15.5}/>
    <MiniGlobe x={19.8} y={13.4} r={8.2} mood="wink"/>
    {bar(4.6, 24.6, 9.6, RV.coral, RV.coralDeep, '#F9A08A')}
    {bar(15, 20.4, 9.6, RV.blue, RV.blueDeep, '#8FC3FA')}
    {bar(25.4, 16.4, 9.6, RV.gold, RV.goldDeep, RV.goldLight)}
    <Hand x={15.9} y={20.2} angle={20}/><Hand x={23.7} y={20.2} angle={-20}/>
    <path d="M27.3 27.4l-.5-4.2 2 1.7 1.4-2.8 1.4 2.8 2-1.7-.5 4.2Z" fill="#D88A16" stroke="#D88A16" strokeWidth=".5" strokeLinejoin="round"/>
    <circle cx="30.2" cy="21.8" r=".7" fill="#D88A16"/>
    <g transform="translate(34.2 7.4)"><circle r="3" fill="#fff"/><circle r="1.25" fill={RV.red}/></g>
    <Sparkle x={5.6} y={13} s={.95}/>
  </>;
};

// World Duel: two tilted cards, Roviko against a purple rival planet, a gold VS badge between them.
const Duel: Logo = () => <>
  <GroundShadow x={20} y={35.4} rx={14}/>
  <g transform="rotate(-11 11.5 21)">
    <rect x="3.4" y="10.4" width="15.4" height="20.6" rx="2.8" fill={RV.paper}/>
    <rect x="5" y="12" width="12.2" height="17.4" rx="1.9" fill="#C9EED3"/>
    <MiniGlobe x={11.1} y={20.6} r={5.1}/>
  </g>
  <g transform="rotate(11 28.5 21)">
    <rect x="21.2" y="10.4" width="15.4" height="20.6" rx="2.8" fill={RV.paper}/>
    <rect x="22.8" y="12" width="12.2" height="17.4" rx="1.9" fill="#2D2A6E"/>
    <MiniGlobe x={28.9} y={20.6} r={5.1} mood="calm" ocean="#8F7CF2" land="#6B57D8"/>
  </g>
  <circle cx="20" cy="25.6" r="4.9" fill={RV.gold} stroke={RV.paper} strokeWidth="1.3"/>
  <path d="M17.1 23.9l1.15 3.4 1.15-3.4M22.9 24.3c-.35-.5-2.1-.7-2.1.3 0 1 2.3.7 2.3 1.85 0 1.05-1.85 1.05-2.45.35" fill="none" stroke={RV.ink} strokeWidth="1.05" strokeLinecap="round" strokeLinejoin="round"/>
  <Sparkle x={34.6} y={6.4} s={1.05} fill="#fff"/>
  <Sparkle x={5.4} y={6.8} s={.75}/>
</>;

// Side by Side: two photo cards (a city and the mountains) with Roviko peeking over them.
const Compare: Logo = () => <>
  <GroundShadow x={20} y={36} rx={14}/>
  <MiniGlobe x={20} y={11} r={7.2} mood="cheer"/>
  <g transform="rotate(-8 12.5 25)">
    <rect x="4.6" y="14.4" width="15.4" height="20" rx="2.4" fill={RV.paper}/>
    <rect x="6.2" y="16" width="12.2" height="13.4" rx="1.4" fill={RV.sky}/>
    <path d="M6.2 26.4c3-1.8 7-2.4 12.2-.8v2.4a1.4 1.4 0 0 1-1.4 1.4H7.6a1.4 1.4 0 0 1-1.4-1.4Z" fill={RV.land}/>
    <circle cx="16" cy="18.6" r="1.3" fill="#FFE27A"/>
    <path d="M12.3 17.2l.5 3.4.9 2.8 1.6 3.6h-1.5c-.4-1.1-.9-1.7-1.5-1.7s-1.1.6-1.5 1.7H9.3l1.6-3.6.9-2.8Z" fill="#1F3A78"/>
    <path d="M10.9 23.4h2.8M11.6 20.6h1.4" stroke="#1F3A78" strokeWidth=".8" strokeLinecap="round"/>
  </g>
  <g transform="rotate(8 27.5 25)">
    <rect x="20" y="14.4" width="15.4" height="20" rx="2.4" fill={RV.paper}/>
    <rect x="21.6" y="16" width="12.2" height="13.4" rx="1.4" fill={RV.sky}/>
    <path d="M21.6 26.6l5.4-7.6 3 4 1.6-1.8 2.2 3v3.6a1.4 1.4 0 0 1-1.4 1.4H23a1.4 1.4 0 0 1-1.4-1.4Z" fill="#4E86C9"/>
    <path d="M25.6 21l1.4-2 1.5 2-.8.7-.7-.6-.7.6Z" fill="#fff"/>
    <path d="M21.6 27c3.2-1.6 7.4-1.8 12.2-.4v1.4a1.4 1.4 0 0 1-1.4 1.4H23a1.4 1.4 0 0 1-1.4-1.4Z" fill={RV.landDeep}/>
  </g>
  <Hand x={14.4} y={14.8} angle={-12}/><Hand x={25.6} y={14.8} angle={12}/>
  <circle cx="20" cy="26.4" r="4" fill={RV.gold} stroke={RV.paper} strokeWidth="1.2"/>
  <path d="M17.7 25l.95 2.8.95-2.8M22.4 25.4c-.3-.45-1.75-.55-1.75.25 0 .85 1.9.55 1.9 1.5 0 .85-1.55.85-2.05.3" fill="none" stroke={RV.ink} strokeWidth=".9" strokeLinecap="round" strokeLinejoin="round"/>
</>;

// Country Mosaic: four little tiles: a flag, a country shape, Roviko and a light bulb.
const Mosaic: Logo = () => {
  const tile = (x: number, y: number) => <g key={x + '-' + y}>
    <rect x={x} y={y + 1.1} width="13.4" height="13.4" rx="3" fill="#D9CFB8"/>
    <rect x={x} y={y} width="13.4" height="13.4" rx="3" fill={RV.paper}/>
  </g>;
  return <>
    <GroundShadow x={20} y={36} rx={14}/>
    {tile(5.4, 5)}{tile(21.2, 5)}{tile(5.4, 20.8)}{tile(21.2, 20.8)}
    <rect x="7.9" y="8.4" width="8.4" height="6.6" rx="1.2" fill={RV.red}/>
    <rect x="10.7" y="8.4" width="2.8" height="6.6" fill="#fff"/>
    <path d="M10.7 8.4H9.1a1.2 1.2 0 0 0-1.2 1.2v4.2a1.2 1.2 0 0 0 1.2 1.2h1.6Z" fill="#2FA75A"/>
    <path d="M27.2 7.4l2.4 1.2 2.2.1.6 1.9-1.2 2.3 1 1.7-1.3 1.8-2.6.4-2.3-.7-1.5-1.3.5-2-1.3-1.7 1.6-1.6Z" fill="#1F3A78" strokeLinejoin="round" stroke="#1F3A78" strokeWidth=".5"/>
    <MiniGlobe x={12.1} y={27.5} r={4.6}/>
    <path d="M27.9 23.5a3.4 3.4 0 0 0-2 6.2v1.2h4v-1.2a3.4 3.4 0 0 0-2-6.2Z" fill={RV.gold}/>
    <rect x="26" y="31.1" width="3.8" height="1.5" rx=".6" fill="#7A88A6"/>
    <ellipse cx="26.8" cy="25.6" rx=".8" ry="1.1" fill="#fff" opacity=".7"/>
    <path d="M23.4 24.5l-.9-.6M32.4 24.5l.9-.6M23.2 27.4h-1M32.6 27.4h1" stroke={RV.goldDeep} strokeWidth=".8" strokeLinecap="round"/>
  </>;
};

// Clue Trail: a folded treasure map with trees, a dashed route from a red pin to a green flag, Roviko peeking.
const Trail: Logo = () => <>
  <GroundShadow x={20} y={36.4} rx={15}/>
  <MiniGlobe x={20} y={9.4} r={7} mood="cheer"/>
  <path d="M4.4 13.4l10-3 11.2 3 10-3v22.4l-10 3-11.2-3-10 3Z" fill="#FBF0D6"/>
  <path d="M14.4 10.4l11.2 3v22.4l-11.2-3Z" fill="#EEDDB6"/>
  <path d="M4.4 13.4l10-3v22.4l-10 3Z" fill="#F7E8C6" opacity=".6"/>
  <Hand x={15.2} y={11.4} angle={-15}/><Hand x={24.8} y={12.4} angle={15}/>
  <path d="M8.6 15.2l2.4 4.2H6.2Z" fill={RV.landDeep}/>
  <path d="M8.6 18.2l2.6 4.4H6Z" fill={RV.landDeep}/>
  <path d="M27.2 32.8l3.6-6 3.4 5.4Z" fill="#46B48C"/>
  <path d="M30.8 26.8l1.1 1.8-1.1-.4-1 .6Z" fill="#fff"/>
  <path d="M10.4 27.4c3.8 3.4 6-2.6 9.4-1.6 3.6 1 3.2-5.2 8.6-6" fill="none" stroke={RV.green} strokeWidth="1.25" strokeLinecap="round" strokeDasharray="1.5 1.7"/>
  <rect x="29" y="15" width=".9" height="6.4" rx=".45" fill={RV.ink}/>
  <path d="M29.9 15.2l4.2 1.6-4.2 1.7Z" fill="#2FA75A"/>
  <Pin x={10.2} y={28} s={1.05}/>
</>;

// Mystery country: Roviko looking through a magnifying glass at a card with a question mark.
const Mystery: Logo = () => <>
  <GroundShadow x={17} y={36.4} rx={13}/>
  <g transform="rotate(9 27 14)">
    <rect x="18.4" y="3.6" width="16.4" height="20.4" rx="2.8" fill={RV.paper}/>
    <rect x="20.4" y="5.6" width="12.4" height="11.4" rx="2.2" fill={RV.purple}/>
    <path d="M24.6 9.4a2.1 2.1 0 1 1 3.1 1.8c-.8.4-1.1.9-1.1 1.6" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="26.6" cy="14.9" r=".9" fill="#fff"/>
    <rect x="20.4" y="19.2" width="9" height="1.6" rx=".8" fill="#E3DBCB"/>
  </g>
  <MiniGlobe x={12.6} y={26.2} r={9.4} mood="curious" look={.45}/>
  <path d="M21.6 18.6l-3.4 3.8" stroke={RV.ink} strokeWidth="2.6" strokeLinecap="round"/>
  <circle cx="25.6" cy="13.4" r="5.8" fill="#DDF3FF" fillOpacity=".3" stroke={RV.ink} strokeWidth="1.8"/>
  <path d="M22.4 11.6a3.8 3.8 0 0 1 2.6-2.2" fill="none" stroke="#fff" strokeWidth="1.1" strokeLinecap="round"/>
  <Hand x={18.4} y={22.6} s={1.15} angle={-45}/>
</>;

// City Circuit: a little capital with a domed palace, a tower and the capital star.
const Capitals: Logo = () => <>
  <rect x="3.6" y="31.2" width="32.8" height="3.6" rx="1.8" fill={RV.land}/>
  <rect x="5.2" y="20" width="8.6" height="11.8" fill="#FFF1D4"/>
  <path d="M4.2 20.6l5.3-4.8 5.3 4.8Z" fill={RV.coral} stroke={RV.coral} strokeWidth=".8" strokeLinejoin="round"/>
  <rect x="7" y="23" width="1.8" height="2.4" rx=".6" fill="#1F3A78"/><rect x="10.2" y="23" width="1.8" height="2.4" rx=".6" fill="#1F3A78"/>
  <rect x="7" y="27.4" width="1.8" height="2.4" rx=".6" fill="#1F3A78"/><rect x="10.2" y="27.4" width="1.8" height="2.4" rx=".6" fill="#1F3A78"/>
  <rect x="26.4" y="13" width="7" height="18.8" fill="#FBE0A8"/>
  <path d="M25.6 13.6l4.3-8.4 4.3 8.4Z" fill="#2FA5A0" stroke="#2FA5A0" strokeWidth=".8" strokeLinejoin="round"/>
  <circle cx="29.9" cy="4.8" r="1" fill={RV.gold}/>
  <circle cx="29.9" cy="17.4" r="1.9" fill="#fff" stroke="#1F3A78" strokeWidth=".7"/>
  <rect x="28.6" y="23" width="2.6" height="3.4" rx="1.3" fill="#1F3A78"/>
  <rect x="13.6" y="19" width="12.8" height="12.8" fill="#FFE6B5"/>
  <rect x="12.8" y="18" width="14.4" height="2" rx=".6" fill="#F4CF8A"/>
  <path d="M14.6 18a5.4 5.4 0 0 1 10.8 0Z" fill="#2FA5A0"/>
  <path d="M16.4 16.4a3.6 3.6 0 0 1 2.4-2.6" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth=".9" strokeLinecap="round"/>
  <path d="M17.6 31.8v-4.4a2.4 2.4 0 0 1 4.8 0v4.4Z" fill="#1F3A78"/>
  <rect x="15.2" y="22" width="1.8" height="2.6" rx=".6" fill="#1F3A78"/><rect x="23" y="22" width="1.8" height="2.6" rx=".6" fill="#1F3A78"/>
  <path d="M20 5.4l1.3 2.6 2.8.4-2 2 .5 2.8L20 11.9l-2.6 1.3.5-2.8-2-2 2.8-.4Z" fill={RV.gold} stroke={RV.goldDeep} strokeWidth=".5" strokeLinejoin="round"/>
</>;

// Flag Signal: two flags waving on golden-knobbed poles.
const Flags: Logo = () => {
  const wave = 'M0 0C3.6-1.6 7.2 1.6 14.6 0V10C7.2 11.6 3.6 8.4 0 10Z';
  return <>
    <GroundShadow x={18} y={36} rx={13}/>
    <g transform="translate(22.6 7.6) scale(.86)">
      <path d={wave} fill="#2FA75A"/>
      <path d="M7.3 1.4l6 3.6-6 3.6-6-3.6Z" fill="#FFD23F"/>
      <circle cx="7.3" cy="5" r="2.3" fill="#2A5DB0"/>
    </g>
    <rect x="21.6" y="6.6" width="1.4" height="28" rx=".7" fill={RV.wood}/>
    <circle cx="22.3" cy="6.2" r="1.5" fill={RV.gold}/>
    <g transform="translate(8.8 10.4)">
      <path d={wave} fill="#fff"/>
      <path d="M0 6.4C3.6 4.8 7.2 8 14.6 6.4V10C7.2 11.6 3.6 8.4 0 10Z" fill={RV.ink} opacity=".06"/>
      <circle cx="7.3" cy="5" r="3" fill={RV.red}/>
    </g>
    <rect x="7.4" y="9.2" width="1.6" height="26.4" rx=".8" fill="#B47A45"/>
    <circle cx="8.2" cy="8.6" r="1.8" fill={RV.gold}/>
    <circle cx="7.7" cy="8.1" r=".55" fill="#fff" opacity=".7"/>
  </>;
};

// Pinpoint: a big red pin landing on a folded green map, with a target ring.
const Pinpoint: Logo = () => <>
  <path d="M3 25.6l10.4-3.4 13 3.4 10.6-3.4v9.4l-10.6 3.6-13-3.6L3 35Z" fill="#8ED86C"/>
  <path d="M13.4 22.2l13 3.4v9.6l-13-3.6Z" fill="#74C85A"/>
  <path d="M27.8 27.6c2.4-1.4 5-1 6.6.2-1 1.8-4.2 2.4-6.6-.2Z" fill="#5FB8F2"/>
  <path d="M5 30.4c1.6-.9 3.4-.6 4.4.4" fill="none" stroke="#5FB8F2" strokeWidth="1.1" strokeLinecap="round"/>
  <ellipse cx="20" cy="29.4" rx="5.4" ry="2" fill="none" stroke="#fff" strokeWidth="1.1"/>
  <ellipse cx="20" cy="29.4" rx="2.2" ry=".85" fill={RV.ink} opacity=".25"/>
  <Pin x={20} y={29.2} s={2.3}/>
  <ellipse cx="17.4" cy="10.4" rx="1.6" ry="1" transform="rotate(-40 17.4 10.4)" fill="#fff" opacity=".5"/>
</>;

// Next Door: a wooden signpost with arrows to the neighbours.
const Borders: Logo = () => <>
  <ellipse cx="20" cy="35" rx="9" ry="2.4" fill={RV.land}/>
  <rect x="18.4" y="5.6" width="3.2" height="29.4" rx="1.2" fill={RV.wood}/>
  <rect x="20.2" y="5.6" width="1.4" height="29.4" fill="#7F5130" opacity=".5"/>
  <path d="M21.6 8.2h10.2l3.6 3.7-3.6 3.7H21.6Z" fill={RV.gold} stroke={RV.gold} strokeWidth="1.2" strokeLinejoin="round"/>
  <path d="M21.6 13.6h12l-1.8 2H21.6Z" fill={RV.goldDeep} opacity=".55"/>
  <path d="M18.4 17.2H8.2l-3.6 3.7 3.6 3.7h10.2Z" fill={RV.blue} stroke={RV.blue} strokeWidth="1.2" strokeLinejoin="round"/>
  <path d="M18.4 22.6h-12l1.8 2h10.2Z" fill={RV.blueDeep} opacity=".55"/>
  <path d="M21.6 25.4h8.8l3.2 3.3-3.2 3.3h-8.8Z" fill={RV.coral} stroke={RV.coral} strokeWidth="1.2" strokeLinejoin="round"/>
  <circle cx="20" cy="5.6" r="1.6" fill="#B47A45"/>
  <path d="M23.4 11.9h6M16.6 20.9h-6" stroke="#fff" strokeOpacity=".75" strokeWidth="1" strokeLinecap="round"/>
</>;

// Size Shuffle: three globes on pastel pedestals, from small to large.
const Order: Logo = () => {
  const block = (x: number, top: number, w: number, c: string, light: string) => <g>
    <rect x={x} y={top} width={w} height={34.4 - top} rx="1.4" fill={c}/>
    <rect x={x} y={top} width={w} height="2" rx="1" fill={light}/>
  </g>;
  return <>
    <GroundShadow x={20} y={35.2} rx={16}/>
    {block(3.6, 29.4, 9.6, '#F7A8B8', '#FBCAD4')}
    {block(14.4, 27, 10.2, RV.gold, RV.goldLight)}
    {block(25.8, 24.6, 10.8, '#F48A78', '#F9B3A6')}
    <MiniGlobe x={8.4} y={26} r={3.4} mood="none"/>
    <MiniGlobe x={19.5} y={21.4} r={5.4} mood="none"/>
    <MiniGlobe x={31.2} y={16} r={8.4}/>
  </>;
};

// Shape Shift: a country shape sliding into its dashed outline, with a question badge.
const SHAPE = 'M14.6 8.6l4-1.4 3.4 1.8 4.2-.8 2.4 3.2-.8 3.2 2.8 3-.8 4.2-3.6 1.2-1 3.6-4.2.6-2.8-2.6-3.2.4-1.6-3.6 1.4-3.2-2.2-3.2 1.6-3.6Z';
const Shape: Logo = () => <>
  <GroundShadow x={20} y={36.2} rx={13}/>
  <rect x="5.4" y="5.6" width="29.2" height="29.2" rx="5" fill={RV.paper}/>
  <path d={SHAPE} fill="none" stroke="#9AA6B8" strokeWidth="1.1" strokeDasharray="1.6 1.5" strokeLinejoin="round" transform="translate(-1 1.4)"/>
  <g transform="translate(1.6 -.4) rotate(8 20 18)">
    <path d={SHAPE} fill={RV.land} stroke={RV.landDeep} strokeWidth=".9" strokeLinejoin="round"/>
    <path d="M17 10.6l2.2-.6 1.6.9" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="1" strokeLinecap="round"/>
  </g>
  <circle cx="29.6" cy="29.4" r="5.4" fill={RV.purple} stroke={RV.paper} strokeWidth="1.3"/>
  <path d="M28 28.1a1.7 1.7 0 1 1 2.5 1.5c-.6.3-.9.7-.9 1.3" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/>
  <circle cx="29.6" cy="32.4" r=".75" fill="#fff"/>
</>;

// Around the World: Roviko with a golden orbit and a little plane flying around.
const Mixed: Logo = () => <>
  <GroundShadow x={20} y={36.4} rx={10}/>
  <g transform="translate(20 20) rotate(-20)">
    <path d="M-17.4 0A17.4 6.2 0 0 1 17.4 0" fill="none" stroke={RV.gold} strokeWidth="1.5" strokeLinecap="round" opacity=".55"/>
  </g>
  <MiniGlobe x={20} y={20} r={11.2}/>
  <g transform="translate(20 20) rotate(-20)">
    <path d="M17.4 0A17.4 6.2 0 0 1-17.4 0" fill="none" stroke={RV.gold} strokeWidth="1.6" strokeLinecap="round" strokeDasharray="0 0"/>
    <Plane x={12.6} y={4.3} s={.85} angle={-14}/>
  </g>
  <Sparkle x={33.6} y={7.2} s={1.1}/>
  <Sparkle x={6.4} y={30.6} s={.8} fill="#fff"/>
</>;

// Playing together: three little Roviko globes, two friends with a cap and headphones behind.
const Room: Logo = () => <>
  <GroundShadow x={20} y={35.6} rx={15}/>
  <MiniGlobe x={9.6} y={20.4} r={6.6} mood="wink" look={-.3}/>
  <path d="M3.6 16.6C3.8 9.6 15.4 9.6 15.6 16.2Z" fill={RV.gold}/>
  <path d="M3.2 16.4c-1.4.2-2.8.9-3.2 1.6 1.6.4 3.6.2 5.4-.6Z" fill={RV.goldDeep}/>
  <MiniGlobe x={30.4} y={20.4} r={6.6} mood="cheer" look={.3}/>
  <path d="M24 20c-.2-8.6 13-8.6 12.8 0" fill="none" stroke={RV.rose} strokeWidth="1.5" strokeLinecap="round"/>
  <rect x="22.6" y="18" width="2.8" height="4.6" rx="1.3" fill={RV.rose}/>
  <rect x="35.4" y="18" width="2.8" height="4.6" rx="1.3" fill={RV.rose}/>
  <MiniGlobe x={20} y={25.4} r={9.2}/>
</>;

const LOGOS: Record<string, Logo> = {
  rank: Rank, daily: Daily, compare: Compare, mosaic: Mosaic, trail: Trail, 'daily-trail': Trail, duel: Duel,
  mystery: Mystery, capitals: Capitals, flags: Flags, pinpoint: Pinpoint, borders: Borders, order: Order,
  shape: Shape, mixed: Mixed, room: Room,
};

/** A soft tile with the game's logo. The colour comes from the `game-icon-<mode>` class. */
export function GameIcon({ mode, size = 'md', className = '' }: { mode: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const Art = LOGOS[mode] ?? Mixed;
  return <span className={`game-icon game-icon-${mode} game-icon-${size} ${className}`} aria-hidden="true">
    <svg viewBox="0 0 40 40" className="game-logo" focusable="false"><Art/></svg>
  </span>;
}
