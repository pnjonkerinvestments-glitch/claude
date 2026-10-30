'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';

/**
 * The fog map of Daily Road Trip (1.56). The land is one grey shape without inner borders; only start and finish (purple),
 * the countries on your route (green closer, orange detour) and the neighbours you can drive to now (light blue, dashed,
 * named, tappable) are drawn. A dotted line joins the middles of your stops and draws itself to every new stop. A peek
 * shows every border for a moment (no names). At the end one shortest route is drawn for comparison. Zoom works exactly
 * like the Pinpoint map (components/game/WorldMap.tsx): drag to pan, pinch or the wheel to zoom around your fingers or the
 * pointer, a tap without moving picks a neighbour, and +, − and reset in the corner. Names, pins and lines keep their size
 * on screen, so zooming in shows the small countries.
 * Geometry: the licensed boundaries file of the Next Door map (/data/boundaries.json, one cached download).
 */
type Polygon = number[][][];
type World = Record<string, Polygon[]>;
type Box = [number, number, number, number];
export type RoadStop = { country: string; closer: boolean | null; auto?: boolean };
type Props = {
  start: string; finish: string; frame: Box; route: RoadStop[]; options: string[]; middles: Record<string, [number, number]>;
  best?: string[] | null; peeking: boolean; disabled?: boolean; name: (id: string) => string; onPick: (id: string) => void; label: string; failText: string; retryText: string;
  zoomText: { in: string; out: string; reset: string };
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
const MAX_ZOOM = 12;

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
  // Zoom and pan, the Pinpoint way: z = 1 shows the whole trip; the centre (cx, cy) is in map units.
  const [view, setView] = useState<View | null>(null);
  const svgRef = useRef<SVGSVGElement>(null), viewRef = useRef<View | null>(null);
  const active = useRef(new Map<number, [number, number]>());
  const gesture = useRef<{ view: View; point: [number, number]; anchor: [number, number]; distance: number; moved: boolean; multiple: boolean } | null>(null);
  const whole = useMemo<View | null>(() => map ? { z: 1, cx: map.base[0] + map.base[2] / 2, cy: map.base[1] + map.base[3] / 2 } : null, [map]);
  // At most one redraw per frame: dragging and pinching stay smooth on a phone.
  const redraw = useRef(0);
  const update = (next: View) => { viewRef.current = next; if (!redraw.current) redraw.current = requestAnimationFrame(() => { redraw.current = 0; setView(viewRef.current); }); };
  useEffect(() => () => cancelAnimationFrame(redraw.current), []);
  const now = () => viewRef.current ?? whole!;
  const fit = useCallback((v: View): View => {
    const [x0, y0, w, h] = map!.base, z = Math.max(1, Math.min(MAX_ZOOM, v.z)), vw = w / z, vh = h / z;
    return { z, cx: Math.min(x0 + w - vw / 2, Math.max(x0 + vw / 2, v.cx)), cy: Math.min(y0 + h - vh / 2, Math.max(y0 + vh / 2, v.cy)) };
  }, [map]);
  /** Where a screen point falls on the drawn map, as a fraction of its width and height (the svg may be letterboxed). */
  const fraction = (x: number, y: number): [number, number] => {
    const r = svgRef.current!.getBoundingClientRect(), [, , w, h] = map!.base, scale = Math.min(r.width / w, r.height / h);
    return [(x - r.left - (r.width - w * scale) / 2) / (w * scale), (y - r.top - (r.height - h * scale) / 2) / (h * scale)];
  };
  const worldAt = (f: [number, number], v = now()): [number, number] => { const [, , w, h] = map!.base; return [v.cx + (f[0] - .5) * w / v.z, v.cy + (f[1] - .5) * h / v.z]; };
  /** Zoom to z keeping the map point `anchor` under the screen fraction `f` (the middle by default). */
  const zoomAt = (v: View, z: number, anchor: [number, number] = [v.cx, v.cy], f: [number, number] = [.5, .5]): View => {
    const [, , w, h] = map!.base, zz = Math.max(1, Math.min(MAX_ZOOM, z));
    return fit({ z: zz, cx: anchor[0] - (f[0] - .5) * w / zz, cy: anchor[1] - (f[1] - .5) * h / zz });
  };
  const changeZoom = (z: number) => update(zoomAt(now(), z));
  const begin = () => {
    const points = [...active.current.values()], v = now();
    const point: [number, number] = points.length > 1 ? [(points[0][0] + points[1][0]) / 2, (points[0][1] + points[1][1]) / 2] : points[0];
    gesture.current = { view: v, point, anchor: worldAt(fraction(...point), v), distance: points.length > 1 ? Math.hypot(points[0][0] - points[1][0], points[0][1] - points[1][1]) : 0,
      moved: gesture.current?.moved ?? false, multiple: points.length > 1 || !!gesture.current?.multiple };
  };
  // A new trip (or a wider frame) starts from the whole trip again.
  useEffect(() => { viewRef.current = null; setView(null); }, [map?.base.join(',')]);
  // Zoomed in and driving on: when your new country is out of sight, the map moves to it.
  const hereId = route.at(-1)?.country;
  useEffect(() => {
    const v = viewRef.current;
    if (!v || v.z <= 1.01 || !hereId || !middles[hereId] || !map) return;
    const [x, y] = map.project(middles[hereId]), [, , w, h] = map.base;
    if (Math.abs(x - v.cx) > w / v.z * .4 || Math.abs(y - v.cy) > h / v.z * .4) update(fit({ ...v, cx: x, cy: y }));
  }, [hereId]); // eslint-disable-line react-hooks/exhaustive-deps
  // The wheel zooms around the pointer, like Pinpoint.
  useEffect(() => {
    const el = svgRef.current;
    if (!el || !map) return;
    const wheel = (e: WheelEvent) => { e.preventDefault(); const v = now(), f = fraction(e.clientX, e.clientY); update(zoomAt(v, v.z * Math.exp(-e.deltaY * .002), worldAt(f, v), f)); };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }); // eslint-disable-line react-hooks/exhaustive-deps
  if (failed) return <figure className="rt-map rt-map-state"><p role="status">{failText} <button className="text-link" onClick={() => setRetry(n => n + 1)}>{retryText}</button></p></figure>;
  const current = view ?? whole;
  if (!map || !current) return <figure className="rt-map rt-map-state" aria-busy="true"><span className="rt-map-spinner" aria-hidden="true"/></figure>;
  const zoom = current.z, [, , bw0, bh0] = map.base, vbw = bw0 / zoom, vbh = bh0 / zoom, vbx = current.cx - vbw / 2, vby = current.cy - vbh / 2;
  const viewBox = [vbx, vby, vbw, vbh].map(n => Math.round(n * 1000) / 1000).join(' ');
  const pointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* an unknown pointer (tests, old browsers): drag still works while over the map */ }
    active.current.set(e.pointerId, [e.clientX, e.clientY]); begin();
  };
  const pointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!active.current.has(e.pointerId) || !gesture.current) return;
    active.current.set(e.pointerId, [e.clientX, e.clientY]);
    const g = gesture.current, points = [...active.current.values()];
    if (points.length >= 2) {
      const [a, b] = points; g.moved = true;
      update(zoomAt(g.view, g.view.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / Math.max(1, g.distance), g.anchor, fraction((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)));
    } else {
      if (Math.hypot(e.clientX - g.point[0], e.clientY - g.point[1]) > 7) g.moved = true;
      if (g.moved) { const s0 = fraction(...g.point), s1 = fraction(e.clientX, e.clientY), [, , w, h] = map.base;
        update(fit({ ...g.view, cx: g.view.cx - (s1[0] - s0[0]) * w / g.view.z, cy: g.view.cy - (s1[1] - s0[1]) * h / g.view.z })); }
    }
  };
  const pointerEnd = (e: React.PointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    // A tap without moving picks the neighbour under your finger (the map holds the pointer, so it looks it up itself).
    if (e.type === 'pointerup' && active.current.size === 1 && g && !g.moved && !g.multiple && !disabled) {
      const hit = document.elementsFromPoint(e.clientX, e.clientY).find(el => (el as HTMLElement).dataset?.pick) as HTMLElement | undefined;
      if (hit) onPick(hit.dataset.pick!);
    }
    active.current.delete(e.pointerId);
    if (active.current.size) begin(); else gesture.current = null;
  };

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
      style={{ touchAction: 'none' }} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd}>
      <defs>
        <radialGradient id="rt-sea" cx="50%" cy="40%" r="75%"><stop offset="0" className="rt-sea-a"/><stop offset="1" className="rt-sea-b"/></radialGradient>
        <radialGradient id="rt-fog" cx="50%" cy="50%" r="72%"><stop offset=".68" className="rt-fog-a"/><stop offset="1" className="rt-fog-b"/></radialGradient>
      </defs>
      <rect x={vbx} y={vby} width={vbw} height={vbh} fill="url(#rt-sea)"/>
      <path className="rt-land" d={map.land}/>
      <path className="rt-borders" d={map.borders}/>
      <rect className="rt-fog" x={vbx} y={vby} width={vbw} height={vbh} fill="url(#rt-fog)" pointerEvents="none"/>
      <g>
        {painted.map(([id, role]) => role === 'option'
          ? <path key={id} className={'rt-c is-' + role + (disabled ? '' : ' is-live')} d={map.shapes[id]} data-pick={disabled ? undefined : id} aria-hidden="true"/>
          : <path key={id} className={'rt-c is-' + role}  d={map.shapes[id]} aria-hidden="true"/>)}
      </g>
      {/* Small countries (Luxembourg, Rwanda) get a ring in their colour, and a bigger target when you can drive there. */}
      {painted.filter(([id]) => small(id) && at(id)).map(([id, role]) => { const [x, y] = at(id)!;
        return <circle key={'ring-' + id} className={'rt-ring is-' + role + (role === 'option' && !disabled ? ' is-live' : '')} cx={x} cy={y} r={map.w * .022 / zoom} data-pick={role === 'option' && !disabled ? id : undefined} aria-hidden="true"/>; })}
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
    <div className="map-tools rt-zoom">
      <button type="button" className="icon-btn" aria-label={zoomText.in} onClick={() => changeZoom(zoom * 1.5)}><Plus size={18}/></button>
      <button type="button" className="icon-btn" aria-label={zoomText.out} onClick={() => changeZoom(zoom / 1.5)}><Minus size={18}/></button>
      <button type="button" className="icon-btn" aria-label={zoomText.reset} onClick={() => update(whole!)}><RotateCcw size={17}/></button>
    </div>
  </figure>;
}
