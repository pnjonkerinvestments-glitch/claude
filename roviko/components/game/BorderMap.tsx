'use client';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

/**
 * The reveal map after a Next Door answer. It shows the whole region around the asked country, every country with its
 * borders in calm colours, the asked country (gold) and the right neighbour (green) highlighted, the land border they
 * share drawn as a dark line, and (when the parent passes it) the wrong pick in coral. Small countries get a ring.
 * Geometry: the one licensed boundaries file the atlas also loads when you zoom in (/data/boundaries.json, keyed by
 * ISO3), so one cached download serves every border question. Nothing here is fetched before the answer is confirmed:
 * this component is only mounted with the feedback.
 */
type Polygon = number[][][];
type World = Record<string, Polygon[]>;
type Country = { id: string; region: string; subregion?: string };
type Box = [number, number, number, number]; // west, south, east, north (degrees)
type Props = {
    /** [asked country, right neighbour] as ISO3 ids (feedback.borderCountries). */
    ids: string[];
    /** Their display names, in the same order. */
    names: string[];
    /** The wrong country the player picked, if any: only ever passed after the answer is confirmed. */
    picked?: { id: string; name: string } | null;
    t: (key: string) => string;
};

let atlas: Promise<[World, Country[]]> | null = null;
const getJson = (url: string) => fetch(url, { signal: AbortSignal.timeout(20000) }).then(r => { if (!r.ok) throw Error(url); return r.json(); });
/** One shared download per page view; a failure clears it so "Try again" really fetches again. */
const loadAtlas = () => atlas ??= (Promise.all([getJson('/data/boundaries.json'), getJson('/data/countries.json')]) as Promise<[World, Country[]]>).catch(e => { atlas = null; throw e; });

/** A readable crop per part of the world (west, south, east, north). Europe and Africa show the whole continent; Asia and the Americas a sub-region, because the continent would make every country tiny. */
const FRAMES: Record<string, Box> = {
    Europe: [-12, 35, 42, 71],
    Africa: [-18, -35, 52, 37.5],
    'Western Asia': [25, 12, 61, 43],
    'Southern Asia': [44, 5, 98, 40],
    'Central Asia': [46, 34, 88, 56],
    'Eastern Asia': [73, 18, 146, 54],
    'South-Eastern Asia': [92, -11, 141, 29],
    'South America': [-82, -56, -34, 13],
    'Central America': [-118, 6, -76, 33],
    'North America': [-168, 14, -52, 72],
    Caribbean: [-86, 9, -59, 24],
    Melanesia: [94, -24, 160, 8],
    'Australia and New Zealand': [110, -48, 180, -8],
};
const frameFor = (c?: Country): Box | undefined => !c ? undefined : c.region === 'Europe' || c.region === 'Africa' ? FRAMES[c.region] : FRAMES[c.subregion ?? ''] ?? FRAMES[c.region];

const ringBox = (ring: number[][]): Box => { let w = 180, s = 90, e = -180, n = -90; for (const [x, y] of ring) { if (x < w) w = x; if (x > e) e = x; if (y < s) s = y; if (y > n) n = y; } return [w, s, e, n]; };
const union = (a: Box, b: Box): Box => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
const meets = (a: Box, b: Box, gap = 0) => a[0] - gap <= b[2] && b[0] - gap <= a[2] && a[1] - gap <= b[3] && b[1] - gap <= a[3];
const area = (b: Box) => Math.max(.01, b[2] - b[0]) * Math.max(.01, b[3] - b[1]);
const ringArea = (ring: number[][]) => { let sum = 0; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) sum += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]); return Math.abs(sum / 2); };
/** The box of a country's main land and the islands right next to it, so French Guiana, Alaska or Svalbard do not stretch the view. */
function mainBox(polys: Polygon[]): Box {
    const parts = polys.map(p => ({ box: ringBox(p[0]), size: ringArea(p[0]) })).sort((a, b) => b.size - a.size);
    let box = parts[0].box, grew = true;
    while (grew) { grew = false; for (const p of parts) { const next = union(box, p.box); if (meets(box, p.box, 2.5) && area(next) > area(box)) { box = next; grew = true; } } }
    return box;
}
/** Runs of vertices two countries share: their common land border, as polylines. */
function sharedBorder(a: Polygon[], b: Polygon[]): number[][][] {
    const key = (p: number[]) => p[0].toFixed(4) + ',' + p[1].toFixed(4), other = new Set<string>();
    for (const poly of b) for (const ring of poly) for (const p of ring) other.add(key(p));
    const lines: number[][][] = [];
    for (const poly of a) for (const ring of poly) {
        let run: number[][] = [];
        // Start where the ring leaves the shared border, so a border that wraps past the ring's first vertex stays one line.
        const start = Math.max(0, ring.findIndex(p => !other.has(key(p))));
        for (let i = 0; i <= ring.length; i++) {
            const p = ring[(start + i) % ring.length];
            if (other.has(key(p))) run.push(p); else { if (run.length > 1) lines.push(run); run = []; }
        }
        if (run.length > 1) lines.push(run);
    }
    return lines;
}

type Mark = { id: string; role: Role; d: string; ring?: [number, number, number]; dot: boolean; pointer?: { x: number; y: number; r: number; angle: number } };
type Built = { viewBox: string; land: { id: string; d: string; home: boolean }[]; marks: Mark[]; border: string; regionName: string };
type Role = 'target' | 'neighbor' | 'picked';

function build(world: World, countries: Country[], ids: string[], pickedId?: string): Built | null {
    const [targetId, answerId] = ids, target = world[targetId], answer = world[answerId];
    if (!target || !answer) return null;
    const meta = new Map(countries.map(c => [c.id, c])), home = meta.get(targetId);
    // The frame: the region, always the asked country, and the others when that does not blow up the view (Russia).
    let frame: Box = frameFor(home) ?? union(mainBox(target), mainBox(answer));
    frame = union(frame, mainBox(target));
    const offMap = new Set<string>();
    for (const id of [answerId, pickedId]) {
        if (!id || !world[id]) continue;
        const box = mainBox(world[id]), grown = union(frame, box);
        if (area(grown) <= area(frame) * 2.5) frame = grown; else if (!meets(frame, box)) offMap.add(id);
    }
    // Never zoom in closer than ~14 degrees, so even a fallback frame shows a neighbourhood.
    const grow = (lo: number, hi: number, min: number) => hi - lo >= min ? [lo, hi] : [(lo + hi) / 2 - min / 2, (lo + hi) / 2 + min / 2];
    [frame[0], frame[2]] = grow(frame[0], frame[2], 18); [frame[1], frame[3]] = grow(frame[1], frame[3], 14);
    // A simple equal-distance projection, squeezed by the cosine of the middle latitude so the north does not look stretched.
    const k = Math.max(.35, Math.cos((frame[1] + frame[3]) / 2 * Math.PI / 180));
    let x0 = frame[0] * k, x1 = frame[2] * k, y0 = -frame[3], y1 = -frame[1];
    const padX = (x1 - x0) * .04, padY = (y1 - y0) * .05; x0 -= padX; x1 += padX; y0 -= padY; y1 += padY;
    // Keep a pleasant card shape: between square and 1.6 : 1.
    let w = x1 - x0, h = y1 - y0;
    if (w / h < 1) { const d = h - w; x0 -= d / 2; x1 += d / 2; w = h; }
    if (w / h > 1.6) { const d = w / 1.6 - h; y0 -= d / 2; y1 += d / 2; h = w / 1.6; }
    // Everything a bit beyond the frame is drawn too, so the edges stay filled when the card is wider or taller than the map.
    const cull: Box = [(x0 - w * .6) / k, -(y1 + h * .3), (x1 + w * .6) / k, -(y0 - h * .3)];
    const tol = w / 900, fmt = (n: number) => (Math.round(n * 100) / 100).toString();
    const pathOf = (polys: Polygon[], keepSmall: boolean) => {
        let d = '';
        for (const poly of polys) {
            const outer = ringBox(poly[0]);
            if (!meets(outer, cull)) continue;
            if (!keepSmall && Math.max((outer[2] - outer[0]) * k, outer[3] - outer[1]) < tol * 2.5) continue;
            for (const ring of poly) {
                let last: number[] | null = null, part = '', n = 0;
                for (const [lon, lat] of ring) {
                    const x = lon * k, y = -lat;
                    if (last && Math.abs(x - last[0]) < tol && Math.abs(y - last[1]) < tol) continue;
                    part += (last ? 'L' : 'M') + fmt(x) + ',' + fmt(y); last = [x, y]; n++;
                }
                if (n > 2) d += part + 'Z';
            }
        }
        return d;
    };
    const roles: [string, Role][] = [[answerId, 'neighbor'], [targetId, 'target']];
    if (pickedId && pickedId !== answerId && pickedId !== targetId && world[pickedId]) roles.push([pickedId, 'picked']);
    const highlighted = new Set(roles.map(r => r[0]));
    const region = home?.region;
    const land = Object.entries(world).filter(([id]) => !highlighted.has(id)).map(([id, polys]) => ({ id, d: pathOf(polys, false), home: meta.get(id)?.region === region })).filter(c => c.d);
    const marks = roles.map(([id, role]): Mark => {
        const box = mainBox(world[id]), cx = (box[0] + box[2]) / 2 * k, cy = -(box[1] + box[3]) / 2;
        const bw = (box[2] - box[0]) * k, bh = box[3] - box[1], size = Math.max(bw, bh);
        // Thin countries (Israel, The Gambia) count by their area too: their long side alone would skip the ring they need.
        const small = Math.min(size, Math.sqrt(bw * bh) * 1.25) < w * .045;
        // A wrong pick on the other side of the world (New Zealand for Ireland): a coral arrow on the edge of the map points its way.
        if (offMap.has(id)) {
            const r = w * .045, mx = x0 + w / 2, my = y0 + h / 2, dx = cx - mx, dy = cy - my;
            const s = Math.min(Math.abs(dx) > 1e-6 ? (w / 2 - r * 1.6) / Math.abs(dx) : Infinity, Math.abs(dy) > 1e-6 ? (h / 2 - r * 1.6) / Math.abs(dy) : Infinity);
            return { id, role, d: pathOf(world[id], true), dot: false, pointer: { x: mx + dx * s, y: my + dy * s, r, angle: Math.atan2(dy, dx) * 180 / Math.PI } };
        }
        // A ring around countries that would be a few pixels on a phone (Eswatini, Luxembourg, San Marino).
        const ring: [number, number, number] | undefined = small ? [cx, cy, Math.max(w * .03, size * .8)] : undefined;
        // Under ~1.5% of the width the shape itself is a speck: a dot in its colour marks the spot.
        return { id, role, d: pathOf(world[id], true), ring, dot: size < w * .016 };
    });
    // The shared border as a line, unless one of the two is so small that the line would hide it.
    const border = marks.some(m => m.role !== 'picked' && m.ring) ? '' : sharedBorder(target, answer).map(line => {
        // Thinned with the same tolerance as the land, so the line follows the drawn edge instead of zigzagging over it.
        let last: number[] | null = null, d = '';
        line.forEach(([lon, lat], i) => { const x = lon * k, y = -lat; if (last && i < line.length - 1 && Math.abs(x - last[0]) < tol && Math.abs(y - last[1]) < tol) return; d += (last ? 'L' : 'M') + fmt(x) + ',' + fmt(y); last = [x, y]; });
        return d;
    }).join('');
    return { viewBox: [x0, y0, w, h].map(fmt).join(' '), land, marks, border, regionName: home?.region ?? '' };
}

const ICON: Record<Role, string> = { target: '?', neighbor: '✓', picked: '✕' };

export default function BorderMap({ ids, names, picked, t }: Props) {
    const [data, setData] = useState<[World, Country[]] | null>(null), [failed, setFailed] = useState(false), [retry, setRetry] = useState(0);
    useEffect(() => {
        let active = true;
        setFailed(false);
        loadAtlas().then(v => { if (active) setData(v); }).catch(() => { if (active) setFailed(true); });
        return () => { active = false; };
    }, [retry]);
    const pickedId = picked?.id;
    const map = useMemo(() => data ? build(data[0], data[1], ids, pickedId) : null, [data, ids.join(','), pickedId]);
    // The region label sits in the corner that covers the least of the coloured countries (Greece hid under it top left).
    const figRef = useRef<HTMLElement>(null), [corner, setCorner] = useState<{ top: number; left: number } | null>(null);
    useLayoutEffect(() => {
        const fig = figRef.current, svg = fig?.querySelector('svg'), tag = fig?.querySelector<HTMLElement>('.bm-region-name');
        if (!fig || !svg || !tag) return;
        const place = () => {
            const f = fig.getBoundingClientRect(), s = svg.getBoundingClientRect(), lw = tag.offsetWidth, lh = tag.offsetHeight, mx = 20, my = 18;
            if (!s.width || !lw) return;
            const rects = [...svg.querySelectorAll<SVGGraphicsElement>('.bm-mark, .bm-ring, .bm-pointer, .bm-shared')].map(el => el.getBoundingClientRect());
            const spots = [[my, mx], [my, s.width - lw - mx], [s.height - lh - my, mx], [s.height - lh - my, s.width - lw - mx]];
            let best = spots[0], least = Infinity;
            for (const [top, left] of spots) {
                const x0 = s.left - f.left + left - 6, y0 = s.top - f.top + top - 6, x1 = x0 + lw + 12, y1 = y0 + lh + 12;
                const cover = rects.reduce((sum, r) => sum + Math.max(0, Math.min(x1, r.right - f.left) - Math.max(x0, r.left - f.left)) * Math.max(0, Math.min(y1, r.bottom - f.top) - Math.max(y0, r.top - f.top)), 0);
                if (cover < least - 1) { least = cover; best = [top, left]; }
            }
            const next = { top: Math.round(s.top - f.top + best[0]), left: Math.round(s.left - f.left + best[1]) };
            setCorner(c => c && c.top === next.top && c.left === next.left ? c : next);
        };
        place();
        const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(place);
        ro?.observe(fig);
        return () => ro?.disconnect();
    }, [map]);
    if (failed) return <figure className="border-reveal-map bm-state"><p role="status">{t('mapFailed')} <button className="text-link" onClick={() => setRetry(n => n + 1)}>{t('retry')}</button></p></figure>;
    if (!data) return <figure className="border-reveal-map bm-state" aria-busy="true"><p role="status">{t('loading')}</p></figure>;
    if (!map) return null;
    const label = (role: Role) => role === 'target' ? names[0] : role === 'neighbor' ? names[1] : picked?.name ?? '';
    const legend = map.marks.slice().sort((a, b) => ['target', 'neighbor', 'picked'].indexOf(a.role) - ['target', 'neighbor', 'picked'].indexOf(b.role));
    const region = t(map.regionName);
    return <figure ref={figRef} className="border-reveal-map bm-region">
        <svg viewBox={map.viewBox} preserveAspectRatio="xMidYMid meet" role="img" aria-label={t('borderMapLabel') + ': ' + names.join(' / ')}>
            <g className="bm-land">{map.land.map(c => <path key={c.id} className={c.home ? 'bm-home' : 'bm-far'} d={c.d} fillRule="evenodd" vectorEffect="non-scaling-stroke"/>)}</g>
            {map.marks.map(m => <path key={m.id} className={'bm-mark bm-' + m.role} d={m.d} fillRule="evenodd" vectorEffect="non-scaling-stroke"/>)}
            {map.border && <path className="bm-shared" d={map.border} fill="none" vectorEffect="non-scaling-stroke"/>}
            {map.marks.filter(m => m.ring).map(m => <g key={'ring' + m.id} className={'bm-ring bm-ring-' + m.role}><circle cx={m.ring![0]} cy={m.ring![1]} r={m.ring![2]} className="bm-ring-halo" vectorEffect="non-scaling-stroke"/><circle cx={m.ring![0]} cy={m.ring![1]} r={m.ring![2]} vectorEffect="non-scaling-stroke"/>{m.dot && <circle className="bm-dot" cx={m.ring![0]} cy={m.ring![1]} r={m.ring![2] * .28} vectorEffect="non-scaling-stroke"/>}</g>)}
            {map.marks.filter(m => m.pointer).map(({ id, role, pointer: p }) => <g key={'ptr' + id} className={'bm-pointer bm-pointer-' + role} transform={`translate(${p!.x} ${p!.y})`}>
                <circle r={p!.r} vectorEffect="non-scaling-stroke"/>
                <path d={`M${p!.r * -.42},${p!.r * -.5}L${p!.r * .55},0L${p!.r * -.42},${p!.r * .5}Z`} transform={`rotate(${p!.angle})`} vectorEffect="non-scaling-stroke"/>
            </g>)}
        </svg>
        {map.regionName && <span className="bm-region-name" style={corner ?? undefined} aria-hidden="true">{region}</span>}
        <figcaption>{legend.map(m => <span key={m.id} className={'bm-key ' + (m.role === 'target' ? 'target' : m.role === 'neighbor' ? 'neighbor' : 'picked')}>
            <i aria-hidden="true">{ICON[m.role]}</i>{label(m.role)}{m.role === 'picked' && <b className="sr-only"> ({t('yourAnswer')})</b>}{m.role === 'neighbor' && <b className="sr-only"> ({t('correctAnswerLabel')})</b>}
        </span>)}</figcaption>
    </figure>;
}
