'use client';
import React, { useEffect, useState } from 'react';

/**
 * The map after a neighbours (Next Door) answer, since 1.24: the whole continent (or, for big continents, the
 * region around the country) with every border, so you learn where it all sits. The asked country is gold,
 * the right neighbour green and, when it is on this map, your own wrong pick red; a legend repeats it in text.
 * Drawn from the same small world map as Pinpoint (`/data/world-map.json`, equirectangular 1000 × 500) and the
 * public country list. It only renders after the answer: `ids` comes with the server's feedback, so nothing is
 * revealed before you answer, and in daily games nothing before the server confirmed it.
 */
type Country = { id: string; numeric: string; region: string; subregion: string; latlng: [number, number]; borders: string[]; name: string; nl: string };
type Shape = { id: string; path: string };
let cache: Promise<[Shape[], Country[]]> | null = null;
const load = () => cache ??= Promise.all([
  fetch('/data/world-map.json').then(r => { if (!r.ok) throw Error(); return r.json(); }),
  fetch('/data/countries.json').then(r => { if (!r.ok) throw Error(); return r.json(); }),
]).catch(e => { cache = null; throw e; }) as Promise<[Shape[], Country[]]>;

const X = (lon: number) => (lon + 180) / 360 * 1000, Y = (lat: number) => (90 - lat) / 180 * 500;
/** Continents that fit on a phone as a whole; for the others the map shows the region around the country. */
const WHOLE = new Set(['Africa', 'Europe', 'South America', 'Oceania']);
/** Far-flung members that would stretch the view (Russia reaches the Pacific, Kiribati and friends sit far out). */
const SKIP_BOUNDS = new Set(['RUS', 'KIR', 'TUV', 'NRU', 'MHL', 'FSM', 'PLW', 'WSM', 'TON', 'NZL', 'FJI']);

function bboxOfPath(d: string) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const m of d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)) { const x = +m[1], y = +m[2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return [x0, y0, x1, y1];
}
/** The bounds of a country's own land near its centre: overseas parts (French Guiana for France, Alaska for the US) don't stretch the view. */
function homeBounds(d: string, cx: number, cy: number) {
  const parts = d.split(/(?=M)/).filter(p => p.trim()).map(bboxOfPath);
  const gap = (b: number[]) => Math.hypot(Math.max(b[0] - cx, 0, cx - b[2]), Math.max(b[1] - cy, 0, cy - b[3]));
  const near = parts.filter(b => gap(b) < 35);
  if (!near.length) near.push(parts.reduce((a, b) => gap(b) < gap(a) ? b : a));
  return [Math.min(...near.map(b => b[0])), Math.min(...near.map(b => b[1])), Math.max(...near.map(b => b[2])), Math.max(...near.map(b => b[3]))];
}

export default function BorderMap({ ids, names, picked, pickedName, t }: { ids: string[]; names: string[]; picked?: string; pickedName?: string; t: (key: string) => string }) {
  const [data, setData] = useState<[Shape[], Country[]] | null>(null), [failed, setFailed] = useState(false), [retry, setRetry] = useState(0);
  useEffect(() => { let on = true; setFailed(false); load().then(d => { if (on) setData(d); }).catch(() => { if (on) setFailed(true); }); return () => { on = false; }; }, [retry]);
  if (failed) return <p>{t('mapFailed')} <button className="text-link" onClick={() => setRetry(n => n + 1)}>{t('retry')}</button></p>;
  if (!data) return <p role="status">{t('loading')}</p>;
  const [shapes, countries] = data;
  const byId = new Map(countries.map(c => [c.id, c])), byNumeric = new Map(countries.map(c => [String(+c.numeric), c]));
  const [targetId, answerId] = ids, target = byId.get(targetId), answer = byId.get(answerId);
  const wrong = picked && picked !== answerId && byId.get(picked) ? byId.get(picked) : undefined;
  if (!target || !answer) return null;
  const shapeOf = new Map(shapes.map(s => [byNumeric.get(String(+s.id))?.id ?? '', s]));
  // Which countries frame the view: the whole continent, or for Asia and North America the target's region and its neighbours.
  const frame = countries.filter(c => !SKIP_BOUNDS.has(c.id) && (WHOLE.has(target.region) ? c.region === target.region : c.subregion === target.subregion || target.borders.includes(c.id)));
  const members = new Set([...frame.map(c => c.id), target.id, answer.id, ...(wrong && wrong.region === target.region ? [wrong.id] : [])]);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const grow = (b: number[]) => { x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]); };
  for (const id of members) { const c = byId.get(id)!; const s = shapeOf.get(id); if (s && !SKIP_BOUNDS.has(id)) grow(homeBounds(s.path, X(c.latlng[1]), Y(c.latlng[0]))); else grow([X(c.latlng[1]) - 3, Y(c.latlng[0]) - 3, X(c.latlng[1]) + 3, Y(c.latlng[0]) + 3]); }
  // The asked country itself always fits, even when it is one of the far-flung ones.
  const own = shapeOf.get(target.id); if (own) grow(homeBounds(own.path, X(target.latlng[1]), Y(target.latlng[0])));
  // Equirectangular maps stretch away from the equator: squeeze x by cos(latitude) so shapes look right.
  const latMid = 90 - (y0 + y1) / 2 / 500 * 180, k = Math.max(.45, Math.cos(latMid * Math.PI / 180));
  let w = (x1 - x0) * k, h = y1 - y0;
  const pad = Math.max(w, h) * .08 + 4;
  // Never narrower than a square, never a sliver.
  if (w < h) { const add = (h - w) / 2; x0 -= add / k; x1 += add / k; w = h; }
  const vb = [x0 * k - pad, y0 - pad, w + pad * 2, h + pad * 2], unit = Math.max(vb[2], vb[3]) / 400;
  const role = (id: string) => id === target.id ? 'is-target' : id === answer.id ? 'is-answer' : wrong && id === wrong.id ? 'is-wrong' : members.has(id) ? 'is-region' : 'is-other';
  const marked = [target, answer, ...(wrong ? [wrong] : [])];
  return <figure className="border-reveal-map is-continent">
    <svg viewBox={vb.map(n => n.toFixed(2)).join(' ')} style={{ '--ar': (vb[2] / vb[3]).toFixed(3) } as React.CSSProperties} role="img" aria-label={t('borderMapLabel') + ': ' + [names[0], names[1], ...(wrong && pickedName ? [pickedName] : [])].join(' / ')}>
      <rect className="bm-sea" x={vb[0]} y={vb[1]} width={vb[2]} height={vb[3]}/>
      <g transform={`scale(${k} 1)`}>
        {shapes.map(s => { const c = byNumeric.get(String(+s.id)); return <path key={s.id} d={s.path} className={'bm-land ' + role(c?.id ?? '')} fillRule="evenodd"/>; })}
      </g>
      {/* Countries too small for this map get a round dot, so the asked country and the answer are always visible. */}
      {marked.filter(c => !shapeOf.has(c.id)).map(c => <circle key={c.id} className={'bm-dot ' + role(c.id)} cx={X(c.latlng[1]) * k} cy={Y(c.latlng[0])} r={unit * 6}/>)}
    </svg>
    <figcaption>
      <span className="target"><i aria-hidden="true"/>{names[0]}</span>
      <span className="neighbor"><i aria-hidden="true"/>{names[1]}</span>
      {wrong && pickedName && <span className="wrong"><i aria-hidden="true"/>{pickedName}</span>}
    </figcaption>
  </figure>;
}
