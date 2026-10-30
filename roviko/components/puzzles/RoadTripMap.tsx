'use client';
import React, { useEffect, useMemo, useState } from 'react';

/**
 * The fog map of Daily Road Trip (1.56). The land is one grey shape without inner borders; only start and finish (purple),
 * the countries on your route (green closer, orange detour) and the neighbours you can drive to now (light blue, dashed,
 * named, tappable) are drawn. A dotted line joins the middles of your stops and draws itself to every new stop. A peek
 * shows every border for a moment (no names). At the end one shortest route is drawn for comparison.
 * Geometry: the licensed boundaries file of the Next Door map (/data/boundaries.json, one cached download).
 */
type Polygon = number[][][];
type World = Record<string, Polygon[]>;
type Box = [number, number, number, number];
export type RoadStop = { country: string; closer: boolean | null; auto?: boolean };
type Props = {
  start: string; finish: string; frame: Box; route: RoadStop[]; options: string[]; middles: Record<string, [number, number]>;
  best?: string[] | null; peeking: boolean; disabled?: boolean; name: (id: string) => string; onPick: (id: string) => void; label: string; failText: string; retryText: string;
};

let atlas: Promise<World> | null = null;
const loadAtlas = () => atlas ??= fetch('/data/boundaries.json', { signal: AbortSignal.timeout(20000) }).then(r => { if (!r.ok) throw Error('map'); return r.json() as Promise<World>; }).catch(e => { atlas = null; throw e; });

const ringBox = (ring: number[][]): Box => { let w = 180, s = 90, e = -180, n = -90; for (const [x, y] of ring) { if (x < w) w = x; if (x > e) e = x; if (y < s) s = y; if (y > n) n = y; } return [w, s, e, n]; };
const union = (a: Box, b: Box): Box => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
const meets = (a: Box, b: Box) => a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];
const ringArea = (ring: number[][]) => { let sum = 0; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) sum += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]); return Math.abs(sum / 2); };
/** The box of a country's main land (so French Guiana or Alaska never stretch the view). */
function mainBox(polys: Polygon[]): Box {
  const parts = polys.map(p => ({ box: ringBox(p[0]), size: ringArea(p[0]) })).sort((a, b) => b.size - a.size);
  let box = parts[0].box, grew = true;
  while (grew) { grew = false; for (const p of parts) { const next = union(box, p.box); const near = box[0] - 2.5 <= p.box[2] && p.box[0] - 2.5 <= box[2] && box[1] - 2.5 <= p.box[3] && p.box[1] - 2.5 <= box[3];
    if (near && (next[2] - next[0]) * (next[3] - next[1]) > (box[2] - box[0]) * (box[3] - box[1])) { box = next; grew = true; } } }
  return box;
}

type Role = 'end' | 'closer' | 'detour' | 'option' | 'best';
type Built = { viewBox: string; w: number; land: string; borders: string; shapes: Record<string, string>; small: Set<string>; project: (p: [number, number]) => [number, number] };

function build(world: World, frame: Box, extra: string[]): Built {
  let box = frame;
  // The frame comes from the server (start, finish and every country on a shortest route); stops and neighbours off it widen it.
  for (const id of extra) if (world[id]) box = union(box, mainBox(world[id]));
  const k = Math.max(.4, Math.cos((box[1] + box[3]) / 2 * Math.PI / 180));
  let x0 = box[0] * k, x1 = box[2] * k, y0 = -box[3], y1 = -box[1], w = x1 - x0, h = y1 - y0;
  // A card that suits a phone and a laptop: between 1 : 1.15 (tall) and 1.45 : 1 (wide).
  if (w / h < 1 / 1.15) { const d = h / 1.15 - w; x0 -= d / 2; x1 += d / 2; w = h / 1.15; }
  if (w / h > 1.45) { const d = w / 1.45 - h; y0 -= d / 2; y1 += d / 2; h = w / 1.45; }
  const cull: Box = [(x0 - w * .2) / k, -(y1 + h * .2), (x1 + w * .2) / k, -(y0 - h * .2)];
  const tol = w / 700, fmt = (n: number) => (Math.round(n * 100) / 100).toString();
  const pathOf = (polys: Polygon[], keepSmall: boolean) => {
    let d = '';
    for (const poly of polys) {
      const outer = ringBox(poly[0]);
      if (!meets(outer, cull)) continue;
      if (!keepSmall && Math.max((outer[2] - outer[0]) * k, outer[3] - outer[1]) < tol * 2) continue;
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
  const shapes: Record<string, string> = {};
  let land = '';
  const small = new Set<string>();
  for (const [id, polys] of Object.entries(world)) {
    const d = pathOf(polys, true);
    if (!d) continue;
    shapes[id] = d; land += d;
    const b = mainBox(polys);
    if (Math.max((b[2] - b[0]) * k, b[3] - b[1]) < w * .035) small.add(id);
  }
  return { viewBox: [x0, y0, w, h].map(fmt).join(' '), w, land, borders: land, shapes, small, project: ([lon, lat]) => [lon * k, -lat] };
}

/** A segment of the dotted route line; the newest one draws itself (a solid mask grows over the dashes). */
function Segment({ d, id, fresh, className }: { d: string; id: string; fresh: boolean; className: string }) {
  if (!fresh) return <path className={className} d={d}/>;
  return <>
    <mask id={id} maskUnits="userSpaceOnUse"><path className="rt-seg-mask" d={d} pathLength={1}/></mask>
    <path className={className} d={d} mask={`url(#${id})`}/>
  </>;
}

export function RoadTripMap({ start, finish, frame, route, options, middles, best, peeking, disabled, name, onPick, label, failText, retryText }: Props) {
  const [world, setWorld] = useState<World | null>(null), [failed, setFailed] = useState(false), [retry, setRetry] = useState(0);
  useEffect(() => { let on = true; setFailed(false); loadAtlas().then(w => { if (on) setWorld(w); }).catch(() => { if (on) setFailed(true); }); return () => { on = false; }; }, [retry]);
  const extra = useMemo(() => [...new Set([...route.map(r => r.country), ...options, ...(best ?? [])])], [route, options, best]);
  const map = useMemo(() => world ? build(world, frame, extra) : null, [world, frame.join(','), extra.join(',')]);
  if (failed) return <figure className="rt-map rt-map-state"><p role="status">{failText} <button className="text-link" onClick={() => setRetry(n => n + 1)}>{retryText}</button></p></figure>;
  if (!map) return <figure className="rt-map rt-map-state" aria-busy="true"><span className="rt-map-spinner" aria-hidden="true"/></figure>;

  // The colour of each country: its latest status on the route; start and finish always purple.
  const roles = new Map<string, Role>();
  for (const id of best ?? []) roles.set(id, 'best');
  for (const id of options) roles.set(id, 'option');
  for (const stop of route) if (stop.closer !== null) roles.set(stop.country, stop.closer ? 'closer' : 'detour');
  roles.set(start, 'end'); roles.set(finish, 'end');
  const at = (id: string) => middles[id] ? map.project(middles[id]) : null;
  const line = (ids: string[]) => ids.map(at).filter(Boolean) as [number, number][];
  const stops = line(route.map(r => r.country));
  const seg = (a: [number, number], b: [number, number]) => `M${a[0]},${a[1]}L${b[0]},${b[1]}`;
  const bestLine = best ? line(best) : [];
  const fs = map.w * .03, here = stops.at(-1);
  const order: Role[] = ['best', 'option', 'closer', 'detour', 'end'];
  const painted = [...roles].filter(([id]) => map.shapes[id]).sort((a, b) => order.indexOf(a[1]) - order.indexOf(b[1]));
  // Names: the most important first (start and finish, then where you can drive, then your route); a name that would sit on
  // one already placed tries below, right and left of its country, and is left out when nothing fits (the buttons have it).
  const rank: Role[] = ['end', 'option', 'detour', 'closer', 'best'];
  const placed: Box[] = [], labels: { id: string; role: Role; x: number; y: number }[] = [];
  for (const [id, role] of [...roles].sort((a, b) => rank.indexOf(a[1]) - rank.indexOf(b[1]))) {
    const p = at(id); if (!p) continue;
    const tw = name(id).length * fs * .56, th = fs * 1.05;
    for (const [dx, dy] of [[0, -fs * .7], [0, fs * 1.5], [tw / 2 + fs * .6, fs * .4], [-tw / 2 - fs * .6, fs * .4], [0, -fs * 1.9]]) {
      const x = p[0] + dx, y = p[1] + dy, box: Box = [x - tw / 2, y - th * .8, x + tw / 2, y + th * .2];
      if (placed.some(b => meets(b, box))) continue;
      placed.push(box); labels.push({ id, role, x, y }); break;
    }
  }

  return <figure className={'rt-map' + (peeking ? ' is-peeking' : '')} aria-label={label}>
    <svg viewBox={map.viewBox} preserveAspectRatio="xMidYMid meet" role="img" aria-label={label}>
      <path className="rt-land" d={map.land}/>
      <path className="rt-borders" d={map.borders}/>
      {painted.map(([id, role]) => role === 'option'
        ? <path key={id} className={'rt-c is-' + role + (disabled ? '' : ' is-live')} d={map.shapes[id]} onClick={disabled ? undefined : () => onPick(id)} aria-hidden="true"/>
        : <path key={id} className={'rt-c is-' + role} d={map.shapes[id]} aria-hidden="true"/>)}
      {/* Small countries (Luxembourg, Rwanda) get a ring in their colour, and a bigger target when you can drive there. */}
      {painted.filter(([id]) => map.small.has(id) && at(id)).map(([id, role]) => { const [x, y] = at(id)!;
        return <circle key={'ring-' + id} className={'rt-ring is-' + role + (role === 'option' && !disabled ? ' is-live' : '')} cx={x} cy={y} r={map.w * .022} onClick={role === 'option' && !disabled ? () => onPick(id) : undefined} aria-hidden="true"/>; })}
      {bestLine.slice(1).map((p, i) => <path key={'best' + i} className="rt-best-line" d={seg(bestLine[i], p)}/>)}
      {stops.slice(1).map((p, i) => <Segment key={'s' + i + route[i + 1].country} id={'rt-mask-' + i} fresh={i === stops.length - 2} d={seg(stops[i], p)} className={'rt-line' + (route[i + 1].closer === false ? ' is-detour' : '')}/>)}
      {stops.map(([x, y], i) => <circle key={'dot' + i} className="rt-dot" cx={x} cy={y} r={map.w * .007}/>)}
      {here && <g className="rt-car" style={{ transform: `translate(${here[0]}px, ${here[1]}px)` }} aria-hidden="true">
        <circle r={map.w * .019}/><text fontSize={map.w * .024} textAnchor="middle" dominantBaseline="central">🚗</text>
      </g>}
      {labels.map(({ id, role, x, y }) => <text key={'t-' + id} className={'rt-name is-' + role} x={x} y={y} fontSize={fs} textAnchor="middle">{name(id)}</text>)}
    </svg>
  </figure>;
}
