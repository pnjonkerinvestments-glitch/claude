'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, Table2, LineChart } from 'lucide-react';
import { api } from '@/lib/client';
import type { GrowthDay, GrowthWindow, Platform } from '@/lib/growth';

/**
 * 1.49 · growth dashboard on /admin (owner only). Live numbers from the database each time it opens:
 * players, new players per platform, games, estimated play time, return rates and the most played games.
 * Charts follow the dataviz rules: one axis, thin marks, a legend for more than one series, hover tooltips,
 * a table view, and the validated categorical order (blue, orange, aqua) for the three platforms.
 */
type Growth = {
  today: string; days: number; series: GrowthDay[];
  totals: { players: number; accounts: number; games: number; hours: number };
  active: { today: number; week: number; month: number };
  windows: Record<number, GrowthWindow>;
  platforms: { ios: number; android: number; web: number };
  returns: { day2: number | null; day2Cohort: number; week: number | null; weekCohort: number };
  topGames: { game: string; n: number }[];
};
const PLATFORMS: { key: Platform; color: string }[] = [
  { key: 'web', color: '#2a78d6' }, { key: 'ios', color: '#eb6834' }, { key: 'android', color: '#1baf7a' }, { key: 'unknown', color: '#b9b6ab' },
];
const BRAND = '#1F806B';
// Two series (accounts, guests): the first two validated categorical slots.
const WHO = [{ key: 'accounts', color: '#2a78d6' }, { key: 'guests', color: '#eb6834' }] as const;

export function GrowthDashboard({ t, locale }: { t: (k: string) => string; locale: string }) {
  const [period, setPeriod] = useState(30), [data, setData] = useState<Growth | null>(null), [error, setError] = useState(false), [loading, setLoading] = useState(false), [table, setTable] = useState(false), [at, setAt] = useState(0);
  const load = (days: number) => { setLoading(true); setError(false); api('/admin/growth?days=' + Math.min(365, days * 2)).then((d: Growth) => { setData(d); setAt(Date.now()); }).catch(() => setError(true)).finally(() => setLoading(false)); };
  useEffect(() => { load(period); }, [period]);
  const n = (v: number) => v.toLocaleString(locale);
  const pct = (v: number | null) => v === null ? '–' : Math.round(v * 100) + '%';
  const view = useMemo(() => {
    if (!data) return null;
    const cur = data.series.slice(-period), prev = data.series.slice(-period * 2, -period);
    const sum = (list: GrowthDay[], k: 'newPlayers' | 'games' | 'minutes') => list.reduce((s, d) => s + d[k], 0);
    const change = (a: number, b: number) => b > 0 ? (a - b) / b : null;
    const activeDays = cur.reduce((s, d) => s + d.active, 0);
    return { cur, newAcc: cur.reduce((x, d) => x + d.newAccounts, 0), newNow: sum(cur, 'newPlayers'), newPrev: sum(prev, 'newPlayers'), games: sum(cur, 'games'), gamesPrev: sum(prev, 'games'), minutes: sum(cur, 'minutes'), minutesPrev: sum(prev, 'minutes'), perPlayer: activeDays ? sum(cur, 'minutes') / activeDays : 0, change, full: prev.length === period };
  }, [data, period]);
  const w = data?.windows?.[period];
  const delta = (a: number, b: number) => { if (!view?.full) return null; const c = view.change(a, b); return c === null ? null : <span className={'gd-delta ' + (c >= 0 ? 'is-up' : 'is-down')}>{c >= 0 ? '▲' : '▼'} {Math.abs(Math.round(c * 100))}% {t('gdVsBefore')}</span>; };
  return <section className="growth-dash" aria-labelledby="gd-title">
    <header className="gd-head">
      <div><h2 id="gd-title">{t('gdTitle')}</h2><p className="muted">{at ? t('gdUpdated').replace('{time}', new Date(at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })) : t('loading')}</p></div>
      <div className="gd-controls">
        <div className="segmented-pill gd-period" role="radiogroup" aria-label={t('gdPeriod')}>{[7, 30, 90].map(d => <button key={d} type="button" role="radio" aria-checked={period === d} onClick={() => setPeriod(d)}>{t('gdDays').replace('{n}', String(d))}</button>)}</div>
        <button type="button" className="icon-btn" onClick={() => setTable(v => !v)} aria-pressed={table} aria-label={t(table ? 'gdShowCharts' : 'gdShowTable')} title={t(table ? 'gdShowCharts' : 'gdShowTable')}>{table ? <LineChart size={18}/> : <Table2 size={18}/>}</button>
        <button type="button" className="icon-btn" onClick={() => load(period)} disabled={loading} aria-label={t('gdRefresh')} title={t('gdRefresh')}><RefreshCw size={18} className={loading ? 'gd-spin' : ''}/></button>
      </div>
    </header>
    {error && <p className="inline-error" role="alert">{t('gdError')} <button className="text-link" onClick={() => load(period)}>{t('retry')}</button></p>}
    {data && view && <>
      <div className="gd-tiles">
        <Tile label={t('gdPlayers')} value={n(data.totals.players)} sub={t('gdAccounts').replace('{n}', n(data.totals.accounts))}/>
        {w && <Tile label={t('gdPlayersPeriod').replace('{n}', String(period))} value={n(w.players)} sub={t('gdSplit').replace('{a}', n(w.accounts)).replace('{g}', n(w.guests))}/>}
        <Tile label={t('gdActiveToday')} value={n(data.active.today)} sub={data.windows?.[1] ? t('gdSplit').replace('{a}', n(data.windows[1].accounts)).replace('{g}', n(data.windows[1].guests)) : undefined}/>
        <Tile label={t('gdNew').replace('{n}', String(period))} value={n(view.newNow)} sub={<>{t('gdNewAccounts').replace('{n}', n(view.newAcc))} {delta(view.newNow, view.newPrev)}</>}/>
        <Tile label={t('gdTime').replace('{n}', String(period))} value={t('gdHours').replace('{n}', n(Math.round(view.minutes / 60)))} sub={<>{t('gdPerPlayer').replace('{n}', n(Math.round(view.perPlayer)))} {delta(view.minutes, view.minutesPrev)}</>}/>
        <Tile label={t('gdGames').replace('{n}', String(period))} value={n(view.games)} sub={delta(view.games, view.gamesPrev)}/>
        <Tile label={t('gdReturn')} value={pct(data.returns.day2)} sub={t('gdReturnWeek').replace('{pct}', pct(data.returns.week)).replace('{n}', n(data.returns.weekCohort))}/>
        <Tile label={t('gdDevices')} value={n(data.platforms.ios + data.platforms.android)} sub={t('gdDevicesSub').replace('{ios}', n(data.platforms.ios)).replace('{android}', n(data.platforms.android)).replace('{web}', n(data.platforms.web))}/>
      </div>
      {w && <><h3 className="gd-sub">{t('gdMultiplayer')}</h3>
      <div className="gd-tiles">
        <Tile label={t('gdMpMatches').replace('{n}', String(period))} value={n(w.mpMatches)}/>
        <Tile label={t('gdMpPlayers').replace('{n}', String(period))} value={n(w.mpPlayers)} sub={t('gdSplit').replace('{a}', n(w.mpAccounts)).replace('{g}', n(w.mpPlayers - w.mpAccounts))}/>
        <Tile label={t('gdMpPerMatch')} value={w.mpMatches ? (w.mpSeats / w.mpMatches).toLocaleString(locale, { maximumFractionDigits: 1 }) : '–'}/>
        <Tile label={t('gdAllTime')} value={t('gdHours').replace('{n}', n(data.totals.hours))} sub={t('gdAllGames').replace('{n}', n(data.totals.games))}/>
      </div></>}
      {table ? <SeriesTable days={view.cur} t={t} n={n}/> : <div className="gd-charts">
        <Card title={t('gdChartActive')} legend={WHO.map(x => ({ color: x.color, label: t('gdWho_' + x.key) }))}><TwoLines days={view.cur} t={t} n={n} locale={locale}/></Card>
        <Card title={t('gdChartNew')} legend={PLATFORMS.map(p => ({ color: p.color, label: t('gdPf_' + p.key) }))}><Stacked days={view.cur} t={t} n={n} locale={locale}/></Card>
        <Card title={t('gdChartTime')}><Bars days={view.cur} value={d => d.minutes} unit={t('gdMin')} t={t} n={n} locale={locale}/></Card>
        <Card title={t('gdChartMp')}><Bars days={view.cur} value={d => d.mpMatches} unit={t('gdMpUnit')} t={t} n={n} locale={locale} extra={d => <span>{n(d.mpPlayers)} {t('gdPlayersUnit')}</span>}/></Card>
        <Card title={t('gdChartTop').replace('{n}', String(period))}><TopGames rows={data.topGames} t={t} n={n}/></Card>
      </div>}
      <p className="gd-note muted">{t('gdNote')}</p>
    </>}
  </section>;
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return <div className="gd-tile"><span className="gd-tile-label">{label}</span><strong className="gd-tile-value">{value}</strong>{sub ? <span className="gd-tile-sub">{sub}</span> : null}</div>;
}
function Card({ title, legend, children }: { title: string; legend?: { color: string; label: string }[]; children: React.ReactNode }) {
  return <figure className="gd-card"><figcaption><strong>{title}</strong>{legend && <ul className="gd-legend">{legend.map(l => <li key={l.label}><i style={{ background: l.color }} aria-hidden="true"/>{l.label}</li>)}</ul>}</figcaption>{children}</figure>;
}

const H = 210, PAD = { l: 40, r: 10, t: 12, b: 26 };
const niceMax = (v: number) => { if (v <= 4) return 4; const p = 10 ** Math.floor(Math.log10(v)); const m = Math.ceil(v / p); return (m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; };
const shortDate = (date: string, locale: string) => new Date(date + 'T12:00:00Z').toLocaleDateString(locale, { day: 'numeric', month: 'short' });

/** Shared frame: recessive grid, one y-axis, a few date ticks, and a hover layer that reports the day under the pointer. */
function Frame({ days, max, locale, children, tip }: { days: GrowthDay[]; max: number; locale: string; children: (x: (i: number) => number, y: (v: number) => number, band: number) => React.ReactNode; tip: (d: GrowthDay) => React.ReactNode }) {
  const [hover, setHover] = useState<number | null>(null), ref = useRef<SVGSVGElement>(null), box = useRef<HTMLDivElement>(null);
  // The chart draws at its real width, so the labels keep their size on a phone.
  const [W, setW] = useState(640);
  useEffect(() => { const el = box.current; if (!el) return; const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width)))); ro.observe(el); return () => ro.disconnect(); }, []);
  const top = niceMax(max), iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b, band = iw / Math.max(1, days.length);
  const x = (i: number) => PAD.l + band * i + band / 2, y = (v: number) => PAD.t + ih - (v / top) * ih;
  const ticks = [0, top / 2, top];
  const every = Math.ceil(days.length / Math.max(3, Math.floor(W / 95)));
  const move = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width * W; const i = Math.floor((px - PAD.l) / band); setHover(i >= 0 && i < days.length ? i : null); };
  return <div className="gd-plot" ref={box}>
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" onPointerMove={move} onPointerLeave={() => setHover(null)} onPointerDown={move}>
      {ticks.map(v => <g key={v}><line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="gd-grid"/><text x={PAD.l - 6} y={y(v) + 4} className="gd-axis" textAnchor="end">{Math.round(v).toLocaleString(locale)}</text></g>)}
      {days.map((d, i) => i % every === 0 ? <text key={d.date} x={x(i)} y={H - 6} className="gd-axis" textAnchor="middle">{shortDate(d.date, locale)}</text> : null)}
      {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + ih} className="gd-cross"/>}
      {children(x, y, band)}
    </svg>
    {hover !== null && <div className="gd-tip" style={{ left: `${(x(hover) / W) * 100}%` }}><b>{new Date(days[hover].date + 'T12:00:00Z').toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'long' })}</b>{tip(days[hover])}</div>}
  </div>;
}
function Line({ days, value, t, n, locale }: { days: GrowthDay[]; value: (d: GrowthDay) => number; t: (k: string) => string; n: (v: number) => string; locale: string }) {
  const max = Math.max(1, ...days.map(value));
  return <Frame days={days} max={max} locale={locale} tip={d => <span>{n(value(d))} {t('gdPlayersUnit')}</span>}>{(x, y) => {
    const pts = days.map((d, i) => `${x(i)},${y(value(d))}`).join(' ');
    return <><polygon points={`${x(0)},${y(0)} ${pts} ${x(days.length - 1)},${y(0)}`} fill={BRAND} opacity=".1"/><polyline points={pts} fill="none" stroke={BRAND} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      {days.length <= 31 && days.map((d, i) => <circle key={d.date} cx={x(i)} cy={y(value(d))} r="3.2" fill={BRAND} stroke="#fff" strokeWidth="1.5"/>)}</>;
  }}</Frame>;
}
/** Players per day as two lines: with an account and guests (validated blue and orange, legend above). */
function TwoLines({ days, t, n, locale }: { days: GrowthDay[]; t: (k: string) => string; n: (v: number) => string; locale: string }) {
  const val = { accounts: (d: GrowthDay) => d.accounts, guests: (d: GrowthDay) => d.active - d.accounts };
  const max = Math.max(1, ...days.map(d => Math.max(val.accounts(d), val.guests(d))));
  return <Frame days={days} max={max} locale={locale} tip={d => <span className="gd-tip-rows">{WHO.map(x => <span key={x.key}><i style={{ background: x.color }}/>{t('gdWho_' + x.key)}: {n(val[x.key](d))}</span>)}<span>{t('gdTotal')}: {n(d.active)}</span></span>}>{(x, y) => WHO.map(w => {
    const pts = days.map((d, i) => `${x(i)},${y(val[w.key](d))}`).join(' ');
    return <g key={w.key}><polyline points={pts} fill="none" stroke={w.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>{days.length <= 31 && days.map((d, i) => <circle key={d.date} cx={x(i)} cy={y(val[w.key](d))} r="3" fill={w.color} stroke="#fff" strokeWidth="1.5"/>)}</g>;
  })}</Frame>;
}
function Bars({ days, value, unit, t, n, locale, extra }: { days: GrowthDay[]; value: (d: GrowthDay) => number; unit: string; t: (k: string) => string; n: (v: number) => string; locale: string; extra?: (d: GrowthDay) => React.ReactNode }) {
  const max = Math.max(1, ...days.map(value));
  return <Frame days={days} max={max} locale={locale} tip={d => <><span>{n(value(d))} {unit}</span>{extra?.(d)}</>}>{(x, y, band) => days.map((d, i) => { const w = Math.max(2, band - 2), h = y(0) - y(value(d)); return h > 0 ? <rect key={d.date} x={x(i) - w / 2} y={y(value(d))} width={w} height={h} rx={Math.min(4, w / 2)} fill={BRAND}/> : null; })}</Frame>;
}
function Stacked({ days, t, n, locale }: { days: GrowthDay[]; t: (k: string) => string; n: (v: number) => string; locale: string }) {
  const max = Math.max(1, ...days.map(d => d.newPlayers));
  return <Frame days={days} max={max} locale={locale} tip={d => <span className="gd-tip-rows">{PLATFORMS.map(p => d.newByPlatform[p.key] ? <span key={p.key}><i style={{ background: p.color }}/>{t('gdPf_' + p.key)}: {n(d.newByPlatform[p.key])}</span> : null)}<span>{t('gdTotal')}: {n(d.newPlayers)}</span></span>}>{(x, y, band) => days.map((d, i) => {
    const w = Math.max(2, band - 2); let base = 0;
    return <g key={d.date}>{PLATFORMS.map(p => { const v = d.newByPlatform[p.key]; if (!v) return null; const y1 = y(base + v), y0 = y(base); base += v; return <rect key={p.key} x={x(i) - w / 2} y={y1} width={w} height={Math.max(0, y0 - y1 - 1.5)} rx="2" fill={p.color}/>; })}</g>;
  })}</Frame>;
}
function TopGames({ rows, t, n }: { rows: { game: string; n: number }[]; t: (k: string) => string; n: (v: number) => string }) {
  const max = Math.max(1, ...rows.map(r => r.n));
  const name = (g: string) => { const [a, b] = g.split(' '); const base = t(a === 'daily' && b ? 'gdDailyPrefix' : a === 'bonus' ? 'gdBonusPrefix' : a === 'survival' ? 'gdSurvivalPrefix' : a === 'rank' ? 'rankRadar' : a); return b ? base + ' · ' + t(b) : base; };
  return rows.length ? <ul className="gd-top">{rows.map(r => <li key={r.game}><span className="gd-top-name">{name(r.game)}</span><span className="gd-top-bar"><i style={{ width: (r.n / max * 100) + '%' }}/></span><b>{n(r.n)}</b></li>)}</ul> : <p className="muted">{t('gdEmpty')}</p>;
}
function SeriesTable({ days, t, n }: { days: GrowthDay[]; t: (k: string) => string; n: (v: number) => string }) {
  return <div className="gd-table-wrap"><table className="gd-table"><thead><tr><th>{t('gdDate')}</th><th>{t('gdChartActive')}</th><th>{t('gdWho_accounts')}</th><th>{t('gdWho_guests')}</th><th>{t('gdNewShort')}</th><th>{t('gdPf_ios')}</th><th>{t('gdPf_android')}</th><th>{t('gdGamesShort')}</th><th>{t('gdMin')}</th><th>{t('gdMpUnit')}</th></tr></thead>
    <tbody>{[...days].reverse().map(d => <tr key={d.date}><td>{d.date}</td><td>{n(d.active)}</td><td>{n(d.accounts)}</td><td>{n(d.active - d.accounts)}</td><td>{n(d.newPlayers)}</td><td>{n(d.newByPlatform.ios)}</td><td>{n(d.newByPlatform.android)}</td><td>{n(d.games)}</td><td>{n(d.minutes)}</td><td>{n(d.mpMatches)}</td></tr>)}</tbody></table></div>;
}
