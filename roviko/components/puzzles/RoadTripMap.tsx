'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LocateFixed, Maximize2, Minus, Plus } from 'lucide-react';

/**
 * The fog map of Daily Road Trip (1.56). The land is one grey shape without inner borders; only start and finish (purple),
 * the countries on your route (green closer, orange detour) and the neighbours you can drive to now (light blue, dashed,
 * named, tappable) are drawn. A dotted line joins the middles of your stops and draws itself to every new stop. A peek
 * shows every border for a moment (no names). At the end one shortest route is drawn for comparison. Zoom: pinch or drag
 * on a phone, ctrl + wheel or a trackpad pinch on a laptop, and the +, −, "where am I" and "whole trip" buttons; names,
 * pins and lines keep their size on screen, so zooming in shows the small countries.
 * Geometry: the licensed boundaries file of the Next Door map (/data/boundaries.json, one cached download).
 */
type Polygon = number[][][];
type World = Record<string, Polygon[]>;
type Box = [number, number, number, number];
export type RoadStop = { country: string; closer: boolean | null; auto?: boolean };
type Props = {
  start: string; finish: string; frame: Box; route: RoadStop[]; options: string[]; middles: Record<string, [number, number]>;
  best?: string[] | null; peeking: boolean; disabled?: boolean; name: (id: string) => string; onPick: (id: string) => void; label: string; failText: string; retryText: string;
  zoomText: { in: string; out: string; here: string; all: string };
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
type Built = { base: Box; w: number; h: number; land: string; borders: string; shapes: Record<string, string>; boxes: Record<string, Box>; project: (p: [number, number]) => [number, number] };
type View = { z: number; cx: number; cy: number };
const MAX_ZOOM = 8;

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
  const boxes: Record<string, Box> = {};
  for (const [id, polys] of Object.entries(world)) {
    const d = pathOf(polys, true);
    if (!d) continue;
    shapes[id] = d; land += d;
    const b = mainBox(polys);
    boxes[id] = [b[0] * k, -b[3], b[2] * k, -b[1]];
  }
  return { base: [x0, y0, w, h], w, h, land, borders: land, shapes, boxes, project: ([lon, lat]) => [lon * k, -lat] };
}

export function RoadTripMap({ start, finish, frame, route, options, middles, best, peeking, disabled, name, onPick, label, failText, retryText, zoomText }: Props) {
  const [world, setWorld] = useState<World | null>(null), [failed, setFailed] = useState(false), [retry, setRetry] = useState(0);
  useEffect(() => { let on = true; setFailed(false); loadAtlas().then(w => { if (on) setWorld(w); }).catch(() => { if (on) setFailed(true); }); return () => { on = false; }; }, [retry]);
  const extra = useMemo(() => [...new Set([...route.map(r => r.country), ...options, ...(best ?? [])])], [route, options, best]);
  const map = useMemo(() => world ? build(world, frame, extra) : null, [world, frame.join(','), extra.join(',')]);
  // Zoom and pan: z = 1 shows the whole trip; the centre (cx, cy) is in map units.
  const [view, setView] = useState<View | null>(null);
  const svgRef = useRef<SVGSVGElement>(null), pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ dist: number; z: number; mx: number; my: number; fx: number; fy: number } | null>(null), moved = useRef(false), animation = useRef(0);
  const fit = useCallback((v: View): View => {
    if (!map) return v;
    const [x0, y0, w, h] = map.base, z = Math.max(1, Math.min(MAX_ZOOM, v.z)), vw = w / z, vh = h / z;
    return { z, cx: Math.min(x0 + w - vw / 2, Math.max(x0 + vw / 2, v.cx)), cy: Math.min(y0 + h - vh / 2, Math.max(y0 + vh / 2, v.cy)) };
  }, [map]);
  const whole = map ? { z: 1, cx: map.base[0] + map.base[2] / 2, cy: map.base[1] + map.base[3] / 2 } : null;
  const current = view ?? whole;
  /** Glide to another view in a quarter of a second (buttons only; fingers move the map directly). */
  const glide = (to: View) => {
    if (!current) return;
    const from = current, target = fit(to), t0 = performance.now();
    cancelAnimationFrame(animation.current);
    const step = (now: number) => { const p = Math.min(1, (now - t0) / 250), e = 1 - Math.pow(1 - p, 3);
      setView({ z: from.z + (target.z - from.z) * e, cx: from.cx + (target.cx - from.cx) * e, cy: from.cy + (target.cy - from.cy) * e });
      if (p < 1) animation.current = requestAnimationFrame(step); };
    animation.current = requestAnimationFrame(step);
  };
  /** "Where am I": your last country and every neighbour you can drive to, as big as fits. */
  const focusHere = () => {
    if (!map) return;
    const ids = [route.at(-1)?.country, ...options].filter((id): id is string => !!id && !!map.boxes[id]);
    if (!ids.length) return;
    const b = ids.map(id => map.boxes[id]).reduce(union), [, , w, h] = map.base;
    const bw = Math.max(b[2] - b[0], w / MAX_ZOOM), bh = Math.max(b[3] - b[1], h / MAX_ZOOM);
    glide({ z: Math.min(w / bw, h / bh) * .8, cx: (b[0] + b[2]) / 2, cy: (b[1] + b[3]) / 2 });
  };
  // A new trip (or a wider frame) starts from the whole trip again.
  useEffect(() => { setView(null); }, [map?.base.join(',')]);
  // Zoomed in and driving on: the map follows you.
  const hereId = route.at(-1)?.country;
  useEffect(() => { if (view && view.z > 1.05 && hereId && middles[hereId] && map) { const [x, y] = map.project(middles[hereId]); glide({ ...view, cx: x, cy: y }); } }, [hereId]); // eslint-disable-line react-hooks/exhaustive-deps
  // Ctrl + wheel and trackpad pinches zoom around the pointer; a plain wheel keeps scrolling the page.
  useEffect(() => {
    const el = svgRef.current;
    if (!el || !current) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setView(v => { const now = v ?? whole!; const r = el.getBoundingClientRect(), [, , w, h] = map!.base;
        const z = Math.max(1, Math.min(MAX_ZOOM, now.z * Math.exp(-e.deltaY * .01))), fx = (e.clientX - r.left) / r.width - .5, fy = (e.clientY - r.top) / r.height - .5;
        const px = now.cx + fx * w / now.z, py = now.cy + fy * h / now.z;
        return fit({ z, cx: px - fx * w / z, cy: py - fy * h / z }); });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }); // eslint-disable-line react-hooks/exhaustive-deps
  if (failed) return <figure className="rt-map rt-map-state"><p role="status">{failText} <button className="text-link" onClick={() => setRetry(n => n + 1)}>{retryText}</button></p></figure>;
  if (!map || !current) return <figure className="rt-map rt-map-state" aria-busy="true"><span className="rt-map-spinner" aria-hidden="true"/></figure>;
  const zoom = current.z, [, , bw0, bh0] = map.base, vbw = bw0 / zoom, vbh = bh0 / zoom, vbx = current.cx - vbw / 2, vby = current.cy - vbh / 2;
  const viewBox = [vbx, vby, vbw, vbh].map(n => Math.round(n * 1000) / 1000).join(' ');
  const pick = (id: string) => { if (!moved.current) onPick(id); };
  const onDown = (e: React.PointerEvent) => {
    cancelAnimationFrame(animation.current);
    if (pointers.current.size === 0) moved.current = false;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()], r = svgRef.current!.getBoundingClientRect();
      const fx = ((a.x + b.x) / 2 - r.left) / r.width - .5, fy = ((a.y + b.y) / 2 - r.top) / r.height - .5;
      gesture.current = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: zoom, mx: current.cx + fx * bw0 / zoom, my: current.cy + fy * bh0 / zoom, fx, fy };
    }
  };
  const onMove = (e: React.PointerEvent) => {
    const last = pointers.current.get(e.pointerId);
    if (!last) return;
    const r = svgRef.current!.getBoundingClientRect(), dx = e.clientX - last.x, dy = e.clientY - last.y;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && gesture.current) {
      // Pinch: the point between your fingers stays under your fingers.
      const [a, b] = [...pointers.current.values()], g = gesture.current, z = Math.max(1, Math.min(MAX_ZOOM, g.z * Math.hypot(a.x - b.x, a.y - b.y) / g.dist));
      moved.current = true;
      setView(fit({ z, cx: g.mx - g.fx * bw0 / z, cy: g.my - g.fy * bh0 / z }));
    } else if (pointers.current.size === 1 && zoom > 1.01 && (Math.abs(dx) + Math.abs(dy) > 0)) {
      if (Math.abs(e.clientX - last.x) + Math.abs(e.clientY - last.y) > 0) moved.current = moved.current || Math.abs(dx) + Math.abs(dy) > 3;
      setView(v => { const now = v ?? current; return fit({ ...now, cx: now.cx - dx * vbw / r.width, cy: now.cy - dy * vbh / r.height }); });
    }
  };
  const onUp = (e: React.PointerEvent) => { pointers.current.delete(e.pointerId); if (pointers.current.size < 2) gesture.current = null; };

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
  const fs = map.w * .03 / zoom, here = stops.at(-1);
  const small = (id: string) => { const b = map.boxes[id]; return !!b && Math.max(b[2] - b[0], b[3] - b[1]) * zoom < map.w * .035; };
  const order: Role[] = ['best', 'option', 'closer', 'detour', 'end'];
  const painted = [...roles].filter(([id]) => map.shapes[id]).sort((a, b) => order.indexOf(a[1]) - order.indexOf(b[1]));
  // Names: the most important first (start and finish, then where you can drive, then your route); a name that would sit on
  // one already placed tries below, right and left of its country, and is left out when nothing fits (the buttons have it).
  const rank: Role[] = ['end', 'option', 'detour', 'closer', 'best'];
  const placed: Box[] = [], labels: { id: string; role: Role; x: number; y: number }[] = [];
  // The pins of start and finish stand above their middles: no name on top of them.
  for (const id of [start, finish]) { const p = at(id); if (p) placed.push([p[0] - map.w * .016 / zoom, p[1] - map.w * .038 / zoom, p[0] + map.w * .016 / zoom, p[1]]); }
  for (const [id, role] of [...roles].sort((a, b) => rank.indexOf(a[1]) - rank.indexOf(b[1]))) {
    const p = at(id); if (!p) continue;
    const tw = name(id).length * fs * .56 + fs * .9, th = fs * 1.3;
    // Start and finish carry a pin above their middle, so their name goes below it first.
    const spots = [[0, -fs * .8], [0, fs * 1.7], [tw / 2 + fs * .7, fs * .4], [-tw / 2 - fs * .7, fs * .4], [0, -fs * 2.2]];
    if (role === 'end') spots.unshift(spots.splice(1, 1)[0]);
    for (const [dx, dy] of spots) {
      // Kept inside the map, so no name is cut off at the edge.
      const vx0 = vbx, vy0 = vby, vw0 = vbw, vh0 = vbh;
      const x = Math.min(vx0 + vw0 - tw / 2 - fs * .3, Math.max(vx0 + tw / 2 + fs * .3, p[0] + dx)), y = Math.min(vy0 + vh0 - fs * .5, Math.max(vy0 + fs * 1.2, p[1] + dy)), box: Box = [x - tw / 2, y - fs * .95, x + tw / 2, y - fs * .95 + th];
      if (placed.some(b => meets(b, box))) continue;
      placed.push(box); labels.push({ id, role, x, y }); break;
    }
  }

  const u = map.w / 100 / zoom;
  const pin = (id: string, kind: 'start' | 'finish') => { const p = at(id); if (!p) return null;
    return <g key={'pin-' + kind} className={'rt-pin is-' + kind} transform={`translate(${p[0]} ${p[1]}) scale(${u / 5.5})`} aria-hidden="true">
      <ellipse className="rt-pin-shadow" cx="0" cy="1" rx="6" ry="2.2"/>
      <path className="rt-pin-body" d="M0 0C-1.6-4-7-7.2-7-13a7 7 0 0 1 14 0C7-7.2 1.6-4 0 0Z"/>
      {kind === 'start' ? <circle className="rt-pin-dot" cx="0" cy="-13" r="3"/> : <g className="rt-pin-flag">
        <rect x="-3.6" y="-16.4" width="7.2" height="6.8" rx=".8"/><path d="M-3.6-16.4h2.4v2.27h-2.4zM1.2-16.4h2.4v2.27H1.2zM-1.2-14.13h2.4v2.27h-2.4zM-3.6-11.86h2.4v2.26h-2.4zM1.2-11.86h2.4v2.26H1.2z"/></g>}
    </g>; };

  return <figure className={'rt-map' + (peeking ? ' is-peeking' : '') + (zoom > 1.01 ? ' is-zoomed' : '')} aria-label={label}>
    <svg ref={svgRef} viewBox={viewBox} preserveAspectRatio="xMidYMid meet" role="img" aria-label={label}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}>
      <defs>
        <radialGradient id="rt-sea" cx="50%" cy="40%" r="75%"><stop offset="0" className="rt-sea-a"/><stop offset="1" className="rt-sea-b"/></radialGradient>
        <radialGradient id="rt-fog" cx="50%" cy="50%" r="72%"><stop offset=".68" className="rt-fog-a"/><stop offset="1" className="rt-fog-b"/></radialGradient>
        <filter id="rt-soft" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy={map.w / 100 * .15} stdDeviation={map.w / 100 * .5} floodColor="#0b2a22" floodOpacity=".18"/></filter>
      </defs>
      <rect x={vbx} y={vby} width={vbw} height={vbh} fill="url(#rt-sea)"/>
      <path className="rt-land" d={map.land} filter="url(#rt-soft)"/>
      <path className="rt-borders" d={map.borders}/>
      <rect className="rt-fog" x={vbx} y={vby} width={vbw} height={vbh} fill="url(#rt-fog)" pointerEvents="none"/>
      <g>
        {painted.map(([id, role]) => role === 'option'
          ? <path key={id} className={'rt-c is-' + role + (disabled ? '' : ' is-live')} d={map.shapes[id]} onClick={disabled ? undefined : () => pick(id)} aria-hidden="true"/>
          : <path key={id} className={'rt-c is-' + role}  d={map.shapes[id]} aria-hidden="true"/>)}
      </g>
      {/* Small countries (Luxembourg, Rwanda) get a ring in their colour, and a bigger target when you can drive there. */}
      {painted.filter(([id]) => small(id) && at(id)).map(([id, role]) => { const [x, y] = at(id)!;
        return <circle key={'ring-' + id} className={'rt-ring is-' + role + (role === 'option' && !disabled ? ' is-live' : '')} cx={x} cy={y} r={map.w * .022 / zoom} onClick={role === 'option' && !disabled ? () => pick(id) : undefined} aria-hidden="true"/>; })}
      {bestLine.slice(1).map((p, i) => <path key={'best' + i} className="rt-best-line" d={seg(bestLine[i], p)}/>)}
      {/* Your route: one calm dashed line between the middles of your stops. */}
      {stops.slice(1).map((p, i) => <path key={'s' + i + route[i + 1].country} className={'rt-line' + (route[i + 1].closer === false ? ' is-detour' : '')} d={seg(stops[i], p)}/>)}
      {stops.slice(1, -1).map(([x, y], i) => <circle key={'dot' + i} className={'rt-stop' + (route[i + 1].closer === false ? ' is-detour' : '')} cx={x} cy={y} r={u * .9}/>)}
      {pin(start, 'start')}{pin(finish, 'finish')}
      {here && <g className="rt-here" transform={`translate(${here[0]} ${here[1]})`} aria-hidden="true"><circle r={u * 1.9}/><circle className="rt-here-dot" r={u * .8}/></g>}
      {labels.map(({ id, role, x, y }) => { const tw = name(id).length * fs * .56 + fs * .9;
        return <g key={'t-' + id} className={'rt-tag is-' + role} aria-hidden="true">
          <rect x={x - tw / 2} y={y - fs * .95} width={tw} height={fs * 1.3} rx={fs * .65}/>
          <text x={x} y={y} fontSize={fs} textAnchor="middle">{name(id)}</text>
        </g>; })}
    </svg>
    <div className="rt-zoom" role="group" aria-label={zoomText.in + ' / ' + zoomText.out}>
      <button type="button" onClick={() => glide({ ...current, z: zoom * 1.8 })} disabled={zoom >= MAX_ZOOM - .01} aria-label={zoomText.in} title={zoomText.in}><Plus size={18} strokeWidth={2.6}/></button>
      <button type="button" onClick={() => glide({ ...current, z: zoom / 1.8 })} disabled={zoom <= 1.01} aria-label={zoomText.out} title={zoomText.out}><Minus size={18} strokeWidth={2.6}/></button>
      {route.length > 0 && options.length > 0 && <button type="button" onClick={focusHere} aria-label={zoomText.here} title={zoomText.here}><LocateFixed size={17} strokeWidth={2.4}/></button>}
      {zoom > 1.01 && <button type="button" onClick={() => glide(whole!)} aria-label={zoomText.all} title={zoomText.all}><Maximize2 size={16} strokeWidth={2.4}/></button>}
    </div>
  </figure>;
}
