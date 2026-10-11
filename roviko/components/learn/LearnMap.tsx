'use client';
import React, { useEffect, useMemo, useState } from 'react';

/**
 * The map for Learn (1.38): a calm crop of one part of the world with countries marked. Used to meet a country
 * (gold, the rest of the lesson in mint), to ask "which country is this?" and "where is …?" (four lettered
 * options you can tap) and to show the answer (green right, coral wrong). Small countries get a ring and a dot,
 * so San Marino or Tuvalu are always visible. Geometry: the same licensed boundaries file as the Next Door map
 * (/data/boundaries.json, keyed by ISO3), downloaded once and cached.
 */
type Polygon = number[][][];
type World = Record<string, Polygon[]>;
type Box = [number, number, number, number];
export type MapMark = { id: string; tone: 'focus' | 'soft' | 'right' | 'wrong' | 'option'; label?: string };

let atlas: Promise<World> | null = null;
const loadWorld = () => atlas ??= fetch('/data/boundaries.json').then(r => { if (!r.ok) throw new Error('map'); return r.json(); }).catch(e => { atlas = null; throw e; });

/** The part of the world a lesson can show (west, south, east, north); Oceania runs past 180° east. */
const CLIP: Record<string, Box> = {
  Europe: [-25, 34, 60, 72], Africa: [-26, -36, 58, 38], Asia: [25, -12, 150, 56],
  'North America': [-170, 7, -52, 72], 'South America': [-82, -56, -34, 13], Oceania: [110, -48, 212, 20],
};
const ringBox = (ring: number[][], wrap: (x: number) => number): Box => { let w = 999, s = 90, e = -999, n = -90; for (const [x0, y] of ring) { const x = wrap(x0); if (x < w) w = x; if (x > e) e = x; if (y < s) s = y; if (y > n) n = y; } return [w, s, e, n]; };
const union = (a: Box, b: Box): Box => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
const meets = (a: Box, b: Box, gap = 0) => a[0] - gap <= b[2] && b[0] - gap <= a[2] && a[1] - gap <= b[3] && b[1] - gap <= a[3];
const clip = (a: Box, b: Box): Box | null => meets(a, b) ? [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])] : null;
const area = (b: Box) => Math.max(.01, b[2] - b[0]) * Math.max(.01, b[3] - b[1]);
const ringArea = (ring: number[][]) => { let sum = 0; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) sum += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]); return Math.abs(sum / 2); };
/** A country's main land plus the islands right next to it (no Alaska stretching the USA, no French Guiana). */
function mainBox(polys: Polygon[], wrap: (x: number) => number): Box {
  const parts = polys.map(p => ({ box: ringBox(p[0], wrap), size: ringArea(p[0]) })).sort((a, b) => b.size - a.size);
  let box = parts[0].box, grew = true;
  while (grew) { grew = false; for (const p of parts) { const next = union(box, p.box); if (meets(box, p.box, 2.5) && area(next) > area(box)) { box = next; grew = true; } } }
  return box;
}

type Built = { viewBox: string; land: string; marks: (MapMark & { d: string; cx: number; cy: number; ox: number; oy: number; r?: number; dot: boolean })[]; unit: number };
function build(world: World, region: string, frameIds: string[], marks: MapMark[]): Built | null {
  const wrap = region === 'Oceania' ? (x: number) => x < 0 ? x + 360 : x : (x: number) => x;
  const limit = CLIP[region] ?? [-180, -60, 180, 80];
  let frame: Box | null = null;
  for (const id of frameIds) { if (!world[id]) continue; const b = clip(mainBox(world[id], wrap), limit) ?? mainBox(world[id], wrap); frame = frame ? union(frame, b) : b; }
  if (!frame) return null;
  const grow = (lo: number, hi: number, min: number) => hi - lo >= min ? [lo, hi] : [(lo + hi) / 2 - min / 2, (lo + hi) / 2 + min / 2];
  [frame[0], frame[2]] = grow(frame[0], frame[2], 16); [frame[1], frame[3]] = grow(frame[1], frame[3], 11);
  const k = Math.max(.35, Math.cos((frame[1] + frame[3]) / 2 * Math.PI / 180));
  let x0 = frame[0] * k, x1 = frame[2] * k, y0 = -frame[3], y1 = -frame[1];
  const padX = (x1 - x0) * .14, padY = (y1 - y0) * .14; x0 -= padX; x1 += padX; y0 -= padY; y1 += padY;
  let w = x1 - x0, h = y1 - y0;
  if (w / h < 1.15) { const d = h * 1.15 - w; x0 -= d / 2; x1 += d / 2; w = h * 1.15; }
  if (w / h > 1.6) { const d = w / 1.6 - h; y0 -= d / 2; y1 += d / 2; h = w / 1.6; }
  const cull: Box = [(x0 - w * .3) / k, -(y1 + h * .3), (x1 + w * .3) / k, -(y0 - h * .3)];
  const tol = w / 700, fmt = (n: number) => (Math.round(n * 100) / 100).toString();
  const pathOf = (polys: Polygon[], keepSmall: boolean) => {
    let d = '';
    for (const poly of polys) {
      const outer = ringBox(poly[0], wrap);
      if (!meets(outer, cull)) continue;
      if (!keepSmall && Math.max((outer[2] - outer[0]) * k, outer[3] - outer[1]) < tol * 2.5) continue;
      for (const ring of poly) {
        let last: number[] | null = null, part = '', n = 0;
        for (const [lon, lat] of ring) {
          const x = wrap(lon) * k, y = -lat;
          if (last && Math.abs(x - last[0]) < tol && Math.abs(y - last[1]) < tol) continue;
          part += (last ? 'L' : 'M') + fmt(x) + ',' + fmt(y); last = [x, y]; n++;
        }
        if (n > 2) d += part + 'Z';
      }
    }
    return d;
  };
  const marked = new Set(marks.map(m => m.id));
  let land = '';
  for (const [id, polys] of Object.entries(world)) if (!marked.has(id)) land += pathOf(polys, false);
  const out = marks.filter(m => world[m.id]).map(m => {
    const box = clip(mainBox(world[m.id], wrap), limit) ?? mainBox(world[m.id], wrap);
    const cx = Math.min(x1 - w * .04, Math.max(x0 + w * .04, (box[0] + box[2]) / 2 * k)), cy = Math.min(y1 - h * .05, Math.max(y0 + h * .05, -(box[1] + box[3]) / 2));
    const size = Math.max((box[2] - box[0]) * k, box[3] - box[1]);
    const small = size < w * .05;
    return { ...m, d: pathOf(world[m.id], true), cx, cy, ox: cx, oy: cy, r: small ? Math.max(w * .032, size * .8) : undefined, dot: size < w * .018 };
  });
  // Letters that would overlap (North and South Korea) are pushed apart a little, and kept inside the map.
  const gap = w * .075, lab = out.filter(m => m.label);
  for (let round = 0; round < 12; round++) for (let i = 0; i < lab.length; i++) for (let j = i + 1; j < lab.length; j++) {
    const a = lab[i], b = lab[j], dx = b.cx - a.cx, dy = b.cy - a.cy, d = Math.hypot(dx, dy) || .001;
    if (d >= gap) continue;
    const push = (gap - d) / 2, ux = dx / d, uy = dy / d;
    a.cx -= ux * push; a.cy -= uy * push; b.cx += ux * push; b.cy += uy * push;
  }
  for (const m of lab) { m.cx = Math.min(x1 - w * .04, Math.max(x0 + w * .04, m.cx)); m.cy = Math.min(y1 - h * .06, Math.max(y0 + h * .06, m.cy)); }
  return { viewBox: [x0, y0, w, h].map(fmt).join(' '), land, marks: out, unit: w };
}

export function LearnMap({ region, frame, marks, onPick, disabled = false, label, className = '' }: { region: string; frame: string[]; marks: MapMark[]; onPick?: (id: string) => void; disabled?: boolean; label: string; className?: string }) {
  const [world, setWorld] = useState<World | null>(null), [failed, setFailed] = useState(false), [retry, setRetry] = useState(0);
  useEffect(() => { let on = true; setFailed(false); loadWorld().then(v => { if (on) setWorld(v); }).catch(() => { if (on) setFailed(true); }); return () => { on = false; }; }, [retry]);
  const key = frame.join(',') + '|' + marks.map(m => m.id + m.tone + (m.label ?? '')).join(',');
  const map = useMemo(() => world ? build(world, region, frame, marks) : null, [world, region, key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (failed) return <div className={'learn-map is-state ' + className}><button className="text-link" onClick={() => setRetry(n => n + 1)}>↻</button></div>;
  if (!map) return <div className={'learn-map is-state ' + className} aria-busy="true"><span className="lm-loading"/></div>;
  const u = map.unit;
  const tap = (id: string) => (onPick && !disabled ? () => onPick(id) : undefined);
  return <figure className={'learn-map ' + className} role="img" aria-label={label}>
    <svg viewBox={map.viewBox} preserveAspectRatio="xMidYMid slice">
      <rect className="lm-sea" x="-1000" y="-1000" width="3000" height="3000"/>
      <path className="lm-land" d={map.land} strokeWidth={u / 900}/>
      {map.marks.map(m => <g key={m.id} className={'lm-mark is-' + m.tone + (onPick && !disabled ? ' is-tappable' : '')} onClick={tap(m.id)}>
        <path d={m.d} strokeWidth={u / 500}/>
        {m.r && <circle className="lm-ring" cx={m.ox} cy={m.oy} r={m.r} strokeWidth={u / 260}/>}
        {m.dot && <circle className="lm-dot" cx={m.ox} cy={m.oy} r={u / 120}/>}
        {m.r && onPick && !disabled && <circle cx={m.ox} cy={m.oy} r={m.r} fill="transparent"/>}
        {m.label && <g className="lm-label" transform={`translate(${m.cx} ${m.cy})`}><circle r={u * .034} strokeWidth={u / 400}/><text fontSize={u * .04} dy={u * .014} textAnchor="middle">{m.label}</text></g>}
      </g>)}
    </svg>
  </figure>;
}
