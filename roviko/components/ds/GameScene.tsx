import React from 'react';
import { CharacterArt, type CharacterMood, type CharacterPose } from './Character';

/**
 * Game covers as vector scenes in the style of the social videos (1.22): flat colour, white cards with a
 * hard soft shadow, forest pills, gold accents and Roviko with arms and legs. Vector, so they are sharp on
 * every screen (the old covers were upscaled bitmaps). Real flags come from /flags/.
 * Each scene is drawn in a 320 × 240 box around its centre; `shape` widens the canvas for the wide cards
 * and the background decorations simply run further. Decorative only: never used as quiz geography.
 */
export type SceneMode = 'daily' | 'rank' | 'duel' | 'compare' | 'mosaic' | 'trail' | 'flags' | 'capitals' | 'pinpoint' | 'borders' | 'order' | 'shape' | 'mystery' | 'classic' | 'room';
export type SceneShape = 'card' | 'wide' | 'banner';
const BOX: Record<SceneShape, [number, number]> = { card: [320, 240], wide: [460, 200], banner: [560, 190] };

const C = { forest: '#163B32', green: '#1F806B', mint: '#DDEDE6', gold: '#F6B84B', cream: '#F6F3E9', ocean: '#36B3F5', water: '#BFE4F8', ink: '#06224F', red: '#E5484D', white: '#FFFFFF', land: '#5ED34F' };
const BG: Record<SceneMode, [string, string]> = {
  daily: ['#DDEDE6', '#BFE3D3'], rank: ['#F9E4DC', '#F3C9B8'], duel: ['#F4DDE7', '#EBC0D3'], compare: ['#F7E8CE', '#EFD3A2'], mosaic: ['#E3E7F6', '#C9D1EE'], trail: ['#DAEEF1', '#B7DDE4'],
  flags: ['#F9E4DC', '#F3C9B8'], capitals: ['#E3E7F6', '#C9D1EE'], pinpoint: ['#DDEDE6', '#BFE3D3'], borders: ['#F7E8CE', '#EFD3A2'], order: ['#F4DDE7', '#EBC0D3'], shape: ['#DCEDF5', '#B9DCEC'],
  mystery: ['#E7E2F6', '#CFC6EE'], classic: ['#DDEDE6', '#BFE3D3'], room: ['#FBECCB', '#F5D78F'],
};

const Shadow = ({ children, dy = 5 }: { children: React.ReactNode; dy?: number }) => <><g transform={`translate(0 ${dy})`} opacity=".13" fill={C.ink} stroke="none">{children}</g>{children}</>;
const Card = ({ x, y, w, h, r = 16, fill = C.white, rot = 0, children }: { x: number; y: number; w: number; h: number; r?: number; fill?: string; rot?: number; children?: React.ReactNode }) =>
  <g transform={`rotate(${rot} ${x + w / 2} ${y + h / 2})`}><g transform={`translate(0 5)`} opacity=".13"><rect x={x} y={y} width={w} height={h} rx={r} fill={C.ink}/></g><rect x={x} y={y} width={w} height={h} rx={r} fill={fill}/>{children}</g>;
const Flag = ({ code, x, y, w, h }: { code: string; x: number; y: number; w: number; h: number }) =>
  <><rect x={x - 1} y={y - 1} width={w + 2} height={h + 2} rx="3" fill={C.ink} opacity=".1"/><image href={'/flags/' + code + '.svg'} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid slice"/></>;
const Pin = ({ x, y, color = C.red, s = 1 }: { x: number; y: number; color?: string; s?: number }) =>
  <g transform={`translate(${x} ${y}) scale(${s})`}><ellipse cx="0" cy="2" rx="7" ry="2.6" fill={C.ink} opacity=".16"/><path d="M0 0C-9 -12 -12 -18 -12 -24a12 12 0 0 1 24 0c0 6 -3 12 -12 24z" fill={color}/><circle cy="-24" r="4.6" fill={C.white}/></g>;
const Spark = ({ x, y, s = 1, color = C.white }: { x: number; y: number; s?: number; color?: string }) =>
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -10 2.6 -2.6 10 0 2.6 2.6 0 10 -2.6 2.6 -10 0 -2.6 -2.6z" fill={color}/>;
const Pill = ({ x, y, w, h = 26, fill = C.forest, color = C.white, text, size = 13 }: { x: number; y: number; w: number; h?: number; fill?: string; color?: string; text: string; size?: number }) =>
  <><rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill}/><text x={x + w / 2} y={y + h / 2 + size * .36} textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="600" fontSize={size} fill={color}>{text}</text></>;
/** Roviko standing with its feet at (x, y), `w` wide. */
const Roviko = ({ x, y, w = 120, mood = 'happy', pose = 'stand', flip = false }: { x: number; y: number; w?: number; mood?: CharacterMood; pose?: CharacterPose; flip?: boolean }) => {
  const s = w / 340;
  return <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s}) translate(0 -160)`}><CharacterArt mood={mood} pose={pose}/></g>;
};
const ITALY = 'M47.8,4.6L49.4,6.8L55.8,7.9L54.1,9.5L55.5,10.3L55.2,12.8L56.8,14L52.8,13.1L49.3,15.5L48,16.6L49.9,18.7L48.4,20.4L49.2,24L53.7,27.6L55.3,28.4L57.3,34.5L59.7,37.3L63.1,39.6L67.3,39.5L68.2,40.6L66.9,42.7L73.2,45.8L77.5,49.1L79.9,52L79.1,54.3L76.6,50.9L73.3,50.1L71.8,49.8L70.3,52.3L70,55.3L73,57.1L73.1,60L70.2,61.2L70.1,63.7L67.6,67.2L65.4,65.1L66.8,63.1L68.4,60.4L67.4,57.4L66.2,53.8L64.8,52.4L61.9,51.3L61.1,48.3L58.8,49L55.8,44.3L52.7,44.4L50,42.5L46.7,38.9L45.3,37L43.2,36.3L40.9,33.4L39.7,30.5L38.4,26.4L35.7,24.5L30.8,22.4L27.9,25.6L24.7,26.8L25.6,24.8L22.2,23.6L21.3,21.6L22.2,19.6L20.1,17.7L22.8,15.8L21.1,12.7L24.7,11.7L27.8,10.5L29.2,8.4L31.1,11.6L33.5,9.5L34.4,8.3L36.8,8.9L37.4,7.8L39.4,7.8L39.5,5.5L42.2,6.2L44.6,4.6L48.3,4.1ZM64.9,65.7L62.7,70.3L63.8,73.5L62.6,76L60,75.1L57.7,72.8L53.8,71.1L50.5,69.7L49.3,68.1L50.8,65.7L53.8,65.2L56,66.9L59.8,66.4L62.7,65.9L65.5,64.8ZM34.7,45L36.2,49.3L35.2,51.1L34.9,58.8L32.2,58L31.3,60.6L29.5,59.4L28.9,57.2L29.4,51.3L27.8,48.8L28.2,46.4L30.1,47.1L32.9,44.7Z';

function Scene({ mode }: { mode: SceneMode }) {
  switch (mode) {
    case 'daily': return <>
      <path d="M-400 230C-200 160 -60 140 30 190S80 200 110 150S250 40 440 70S640 40 720 80" stroke={C.green} strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" fill="none" opacity=".55"/>
      <Card x={44} y={46} w={98} h={128} r={14} fill="#1D3A6E" rot={-10}>
        <circle cx={93} cy={98} r={25} fill="none" stroke={C.gold} strokeWidth="4"/><ellipse cx={93} cy={98} rx={11} ry={25} fill="none" stroke={C.gold} strokeWidth="3"/><path d="M68 98h50M72 86h42M72 110h42" stroke={C.gold} strokeWidth="3"/>
        <rect x={66} y={140} width={54} height={6} rx={3} fill={C.gold} opacity=".8"/><rect x={74} y={152} width={38} height={5} rx={2.5} fill={C.gold} opacity=".5"/></Card>
      <g transform="translate(236 46) rotate(-18)"><Shadow dy={4}><path d="M-26 0 20 -5Q30 0 20 5Z M-4 -3 -14 -24h8l14 20Z M-4 3 -14 24h8l14 -20Z M-22 -1 -28 -11h5l7 9Z M-22 1 -28 11h5l7 -9Z" fill={C.white}/></Shadow></g>
      <Roviko x={232} y={212} w={124} pose="wave"/>
      <Spark x={34} y={36} s={1.1}/><Spark x={292} y={118} s={.7} color={C.gold}/><Pin x={170} y={74} s={.9}/>
    </>;
    case 'rank': return <>
      <g opacity=".22" fill="none" stroke="#C4553A" strokeWidth="2.5"><circle cx={262} cy={52} r={34}/><circle cx={262} cy={52} r={58}/><circle cx={262} cy={52} r={84}/></g>
      <Card x={30} y={34} w={176} h={170} r={22} rot={-5}>
        {[0, 1, 2].map(i => { const y = 52 + i * 48, on = i === 0; return <g key={i}>
          <rect x={44} y={y} width={148} height={36} rx={18} fill={on ? C.forest : C.cream}/>
          <circle cx={63} cy={y + 18} r={11} fill={on ? 'rgba(255,255,255,.18)' : C.white}/><circle cx={63} cy={y + 18} r={5} fill={[C.gold, C.ocean, C.land][i]}/>
          <rect x={80} y={y + 14} width={i === 1 ? 44 : 52} height={8} rx={4} fill={on ? 'rgba(255,255,255,.5)' : 'rgba(6,34,79,.18)'}/>
          {on && <Flag code="jp" x={136} y={y + 11} w={21} h={14}/>}
          <text x={186} y={y + 24} textAnchor="end" fontFamily="Fredoka, sans-serif" fontWeight="600" fontSize="16" fill={on ? C.gold : C.forest}>{['#1', '#12', '#40'][i]}</text></g>; })}
      </Card>
      <Roviko x={250} y={214} w={118} mood="cool" pose="point" flip/>
      <Spark x={222} y={30} s={.9} color={C.white}/>
    </>;
    case 'duel': return <>
      <path d="M-400 60h1120M-400 190h1120" stroke={C.white} strokeWidth="18" opacity=".35"/>
      <Card x={38} y={44} w={98} h={132} r={16} rot={-11}><Flag code="jp" x={56} y={62} w={62} h={41}/><rect x={56} y={118} width={62} height={9} rx={4.5} fill={C.forest} opacity=".2"/><rect x={56} y={134} width={44} height={9} rx={4.5} fill={C.forest} opacity=".12"/></Card>
      <Card x={184} y={44} w={98} h={132} r={16} fill={C.forest} rot={11}><Flag code="br" x={202} y={62} w={62} h={43}/><rect x={202} y={118} width={62} height={9} rx={4.5} fill={C.white} opacity=".45"/><rect x={202} y={134} width={44} height={9} rx={4.5} fill={C.white} opacity=".25"/></Card>
      <Roviko x={160} y={258} w={130} mood="cheer" pose="cheer"/>
      <Shadow dy={4}><circle cx={160} cy={102} r={26} fill={C.gold}/></Shadow><text x={160} y={110} textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="21" fill={C.forest}>VS</text>
    </>;
    case 'compare': return <>
      <Card x={34} y={40} w={104} h={140} r={18} rot={-6}><Flag code="ca" x={52} y={58} w={68} h={34}/><rect x={56} y={146} width={60} height={14} rx={7} fill={C.green}/><rect x={56} y={104} width={60} height={34} rx={8} fill={C.mint}/></Card>
      <Card x={182} y={40} w={104} h={140} r={18} rot={6}><Flag code="au" x={200} y={58} w={68} h={34}/><rect x={204} y={124} width={60} height={36} rx={8} fill={C.green}/><rect x={204} y={104} width={60} height={14} rx={7} fill={C.mint}/></Card>
      <Shadow dy={4}><circle cx={160} cy={96} r={22} fill={C.forest}/></Shadow>
      <path d="M152 92l8 -9 8 9M152 101l8 9 8 -9" stroke={C.gold} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <Roviko x={160} y={244} w={104} mood="curious" pose="stand"/>
    </>;
    case 'mosaic': return <>
      <g transform="rotate(-6 120 120)">
        <Card x={36} y={40} w={76} h={64} r={14}><Flag code="it" x={51} y={57} w={46} h={31}/></Card>
        <Card x={122} y={40} w={76} h={64} r={14} fill={C.forest}><g transform="translate(138 46) scale(.5)"><path d={ITALY} fill={C.white}/></g></Card>
        <Card x={36} y={114} w={76} h={64} r={14} fill={C.gold}><path d="M62 160h24M64 156v-16M70 156v-16M76 156v-16M82 156v-16M60 140l14 -10 14 10z" stroke={C.forest} strokeWidth="3.4" strokeLinejoin="round" fill="none"/></Card>
        <Card x={122} y={114} w={76} h={64} r={14}><circle cx={160} cy={140} r={13} fill={C.gold}/><path d="M154 158h12M156 164h8" stroke={C.forest} strokeWidth="3.4" strokeLinecap="round"/></Card>
        <rect x={119} y={37} width={82} height={70} rx={17} fill="none" stroke={C.green} strokeWidth="4"/>
      </g>
      <Roviko x={256} y={214} w={116} pose="wave" flip/>
      <Spark x={226} y={40} s={.9}/>
    </>;
    case 'trail': return <>
      <Card x={30} y={46} w={180} h={136} r={10} rot={-7}>
        <rect x={30} y={46} width={60} height={136} fill={C.mint} rx={10}/><rect x={150} y={46} width={60} height={136} fill={C.mint} rx={10}/>
        <path d="M50 160C70 120 110 150 120 110S170 80 186 66" stroke={C.red} strokeWidth="3.4" strokeDasharray="7 7" strokeLinecap="round" fill="none"/>
        <Pin x={50} y={162} color={C.forest} s={.8}/><Pin x={120} y={112} color={C.gold} s={.8}/><Pin x={188} y={68} s={.95}/>
      </Card>
      <g transform="translate(206 120) rotate(-30)"><Shadow dy={4}><rect x={-6} y={26} width={12} height={46} rx={6} fill={C.forest}/><circle r={30} fill="none" stroke={C.gold} strokeWidth="10"/></Shadow><circle r={25} fill={C.white} opacity=".55"/></g>
      <Roviko x={262} y={222} w={104} mood="curious" pose="stand" flip/>
    </>;
    case 'flags': return <>
      {[['fr', -14, 70], ['br', 0, 124], ['jp', 14, 178]].map(([code, rot, x]) => <Card key={code as string} x={(x as number) - 44} y={60} w={88} h={112} r={16} rot={rot as number}><Flag code={code as string} x={(x as number) - 30} y={78} w={60} h={40}/><rect x={(x as number) - 24} y={134} width={48} height={9} rx={4.5} fill={C.forest} opacity=".18"/></Card>)}
      <Roviko x={262} y={222} w={108} pose="wave" flip/>
      <Spark x={40} y={44} s={1}/><Spark x={232} y={52} s={.7} color={C.gold}/>
    </>;
    case 'capitals': return <>
      <circle cx={112} cy={86} r={56} fill={C.white} opacity=".5"/>
      <Shadow dy={5}><path d="M62 186V124h100v62zM56 124l56 -36 56 36z" fill={C.white}/></Shadow>
      <path d="M78 178v-44M98 178v-44M126 178v-44M146 178v-44" stroke={C.forest} strokeWidth="6" strokeLinecap="round" opacity=".85"/><path d="M84 116l28 -18 28 18z" fill={C.gold}/>
      <Pin x={112} y={72} s={1.2}/>
      <Pill x={190} y={56} w={50} h={34} text="?" size={20}/>
      <Roviko x={238} y={220} w={108} mood="curious" pose="point" flip/>
    </>;
    case 'pinpoint': return <>
      <Card x={34} y={44} w={196} h={140} r={22} fill={C.water}>
        <path d="M66 120c10 -30 40 -46 66 -38s30 30 54 22 22 30 6 42 -60 10 -86 6 -50 -2 -40 -32z" fill="#B2D9C3" stroke={C.white} strokeWidth="3"/>
        <g fill="none" stroke={C.red} strokeWidth="2.6" opacity=".6"><circle cx={140} cy={112} r={14}/><circle cx={140} cy={112} r={26}/></g>
      </Card>
      <Pin x={140} y={112} s={1.25}/>
      <Roviko x={268} y={220} w={104} pose="point" flip/>
    </>;
    case 'borders': return <>
      <Card x={30} y={44} w={204} h={140} r={22} fill={C.white}>
        <path d="M52 80l48 -18 30 22 -6 40 -38 26 -38 -16z" fill="#B2D9C3"/><path d="M130 84l52 -10 30 34 -16 44 -50 6 -22 -34z" fill={C.gold} opacity=".75"/>
        <path d="M130 84l-6 40 22 34" stroke={C.forest} strokeWidth="3.4" strokeDasharray="6 6" strokeLinecap="round" fill="none"/>
      </Card>
      <Pin x={86} y={104} color={C.green} s={.9}/><Pin x={176} y={112} s={.9}/>
      <Roviko x={268} y={220} w={100} mood="wink" pose="hips" flip/>
    </>;
    case 'order': return <>
      {[[44, 18], [88, 28], [140, 40], [202, 54]].map(([x, r], i) => <g key={i}><Shadow dy={4}><circle cx={x + r} cy={170 - r} r={r} fill={[C.ocean, C.green, C.gold, C.forest][i]}/></Shadow><text x={x + r} y={176 - r} textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="600" fontSize={12 + r / 3} fill={C.white}>{i + 1}</text></g>)}
      <path d="M40 196h240" stroke={C.forest} strokeWidth="3" strokeLinecap="round" opacity=".25"/>
      <Roviko x={58} y={128} w={70} mood="cheer" pose="cheer"/>
    </>;
    case 'shape': return <>
      <Card x={44} y={40} w={150} h={150} r={24} fill={C.white}><g transform="translate(66 52) scale(1.32)"><path d={ITALY} fill="#2C6E8F"/></g></Card>
      <Shadow dy={4}><circle cx={194} cy={52} r={22} fill={C.gold}/></Shadow><text x={194} y={61} textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="24" fill={C.forest}>?</text>
      <Roviko x={262} y={222} w={104} mood="curious" pose="point" flip/>
    </>;
    case 'mystery': return <>
      <Card x={150} y={42} w={130} h={150} r={20} fill={C.white} rot={8}><text x={215} y={140} textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="72" fill="#6B5AA8">?</text></Card>
      <Roviko x={104} y={218} w={140} mood="curious" pose="stand"/>
      <g transform="translate(150 118) rotate(-24)"><Shadow dy={4}><rect x={-6} y={24} width={12} height={40} rx={6} fill={C.forest}/><circle r={27} fill="none" stroke={C.gold} strokeWidth="9"/></Shadow><circle r={22} fill={C.white} opacity=".4"/></g>
    </>;
    case 'classic': return <>
      <path d="M-400 200h1120" stroke={C.green} strokeWidth="40" opacity=".18"/>
      <g transform="translate(206 70)"><rect x={-3} y={0} width={6} height={110} rx={3} fill={C.forest}/><path d="M3 4h46l-10 14 10 14H3z" fill={C.gold}/></g>
      <Pin x={262} y={150} s={1.1}/><Pin x={62} y={120} color={C.gold} s={.8}/>
      <Roviko x={130} y={214} w={140} pose="wave"/>
      <Spark x={40} y={50} s={1}/><Spark x={280} y={40} s={.7}/>
    </>;
    case 'room': return <>
      <Roviko x={160} y={222} w={128} mood="cheer" pose="cheer"/>
      {[[54, 84, '#E5484D', 'A'], [266, 84, '#36B3F5', 'B'], [70, 168, '#F6B84B', 'C'], [252, 168, '#1F806B', 'D']].map(([x, y, c, l]) => <g key={l as string}><Shadow dy={4}><circle cx={x as number} cy={y as number} r={22} fill={C.white}/></Shadow><circle cx={x as number} cy={y as number} r={16} fill={c as string}/><text x={x as number} y={(y as number) + 6} textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="600" fontSize="16" fill={C.white}>{l as string}</text></g>)}
      <Pill x={118} y={28} w={84} h={28} text="LIVE" size={13} fill={C.red}/>
    </>;
  }
}

export function GameScene({ mode, shape = 'card', className = '' }: { mode: SceneMode; shape?: SceneShape; className?: string }) {
  const [W, H] = BOX[shape], s = Math.min(W / 320, H / 240), [bg, glow] = BG[mode];
  return <svg className={'game-scene scene-' + mode + (className ? ' ' + className : '')} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <rect width={W} height={H} fill={bg}/>
    <circle cx={W * .5} cy={H * .42} r={H * .62} fill={glow} opacity=".55"/>
    <circle cx={W * .08} cy={H * .9} r={H * .34} fill={C.white} opacity=".28"/>
    <circle cx={W * .95} cy={H * .1} r={H * .26} fill={C.white} opacity=".3"/>
    <g transform={`translate(${W / 2} ${H / 2}) scale(${s}) translate(-160 -120)`}><Scene mode={mode}/></g>
  </svg>;
}
