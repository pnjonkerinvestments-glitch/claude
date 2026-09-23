'use client';
import { useEffect, useState, useRef } from 'react';
import { Plus, Minus, RotateCcw, MapPin } from 'lucide-react';
type Props = {
    value: number[] | null;
    onChange: (v: number[]) => void;
    disabled?: boolean;
    correct?: boolean;
    target?: number[];
    onConfirm?: (v: number[]) => void;
    t: (key: string) => string;
};
export default function WorldMap({ value, onChange, disabled, target, t, onConfirm, correct }: Props) {
    const [paths, setPaths] = useState<any[]>([]), [failed, setFailed] = useState(false), [zoom, setZoom] = useState(1), [center, setCenter] = useState([500, 240]);
    const [detailPaths, setDetailPaths] = useState<any[] | null>(null);
    const detailed = zoom > 2;
    useEffect(() => {
        if (!detailed || detailPaths) return;
        const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 10000);
        fetch('/data/boundaries.json', { signal: controller.signal }).then(r => { if (!r.ok) throw Error(); return r.json(); }).then(data => {
            const refined = Object.values(data).map((polygons: any) => ({ path: polygons.map((poly: number[][][]) => poly.map(ring => ring.map((c,i) => (i ? 'L':'M') + ((c[0]+180)/360*1000).toFixed(3) + ',' + ((90-c[1])/180*500).toFixed(3)).join('')+'Z').join('')).join('') })); setDetailPaths(refined);
        }).catch(() => { /* The low-resolution map remains usable within the declared margin. */ }).finally(() => clearTimeout(timeout));
        return () => { controller.abort(); clearTimeout(timeout); };
    }, [detailed]);
    const ref = useRef<SVGSVGElement>(null);
    const active = useRef(new Map<number, number[]>());
    const pinch = useRef(0);
    const startZoom = useRef(1);
    const load = () => { setFailed(false); fetch('/data/world-map.json', { signal: AbortSignal.timeout(10000) }).then(r => { if (!r.ok)
        throw Error(); return r.json(); }).then(setPaths).catch(() => setFailed(true)); };
    useEffect(load, []);
    const vw = 1000 / zoom, vh = 500 / zoom;
    const viewBox = `${Math.max(0, Math.min(1000 - vw, center[0] - vw / 2))} ${Math.max(0, Math.min(500 - vh, center[1] - vh / 2))} ${vw} ${vh}`;
    const position = (e: any) => { const pt = ref.current!.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(ref.current!.getScreenCTM()!.inverse()); };
    const pick = (e: any) => { if (disabled)
        return; const p = position(e); onChange([Math.max(-90, Math.min(90, 90 - p.y / 500 * 180)), Math.max(-180, Math.min(180, p.x / 1000 * 360 - 180))]); };
    const changeZoom = (v: number) => { if (value)
        setCenter([(value[1] + 180) / 360 * 1000, (90 - value[0]) / 180 * 500]); setZoom(Math.max(1, Math.min(64, v))); };
    const marker = (v: number[], color: string, key: string) => <g key={key} transform={`translate(${(v[1] + 180) / 360 * 1000} ${(90 - v[0]) / 180 * 500})`}><circle r={13 / zoom} fill={color} opacity=".18"/><circle r={5 / zoom} fill={color} stroke="#111622" strokeWidth={2 / zoom}/><path d={`M0 ${-5 / zoom}V${-24 / zoom}`} stroke={color} strokeWidth={3 / zoom}/><circle cy={-24 / zoom} r={6 / zoom} fill={color}/></g>;
    if (failed)
        return <div className="empty-state"><MapPin /><p>{t('mapFailed')}</p><button className="btn secondary" onClick={load}>{t('retry')}</button></div>;
    return <div className="map-wrap"><div className="map-tools"><button className="icon-btn" aria-label={t('mapZoomIn')} onClick={() => changeZoom(zoom * 1.5)}><Plus size={18}/></button><button className="icon-btn" aria-label={t('mapZoomOut')} onClick={() => changeZoom(zoom / 1.5)}><Minus size={18}/></button><button className="icon-btn" aria-label={t('mapReset')} onClick={() => { setZoom(1); setCenter([500, 240]); }}><RotateCcw size={17}/></button></div><svg ref={ref} className="world-map" viewBox={viewBox} role="application" aria-label={t('mapHint') + ' ' + t('mapKeyboard')} tabIndex={disabled ? -1 : 0} onPointerDown={e => { active.current.set(e.pointerId, [e.clientX, e.clientY]); if (active.current.size === 2) {
        const [a, b] = [...active.current.values()];
        pinch.current = Math.hypot(a[0] - b[0], a[1] - b[1]);
        startZoom.current = zoom;
    }
    else if (active.current.size === 1)
        pick(e); }} onPointerMove={e => { if (!active.current.has(e.pointerId))
        return; active.current.set(e.pointerId, [e.clientX, e.clientY]); if (active.current.size === 2) {
        const [a, b] = [...active.current.values()];
        changeZoom(startZoom.current * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.current);
    } }} onPointerUp={e => active.current.delete(e.pointerId)} onPointerCancel={e => active.current.delete(e.pointerId)} onKeyDown={e => { if (disabled)
        return; if (e.key === 'Enter' && value) {
        e.preventDefault();
        onConfirm?.(value);
        return;
    } const [lat, lng] = value ?? [0, 0], step = (e.shiftKey ? .5 : 5) / zoom; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        onChange([Math.max(-90, Math.min(90, lat + (e.key === 'ArrowUp' ? step : e.key === 'ArrowDown' ? -step : 0))), Math.max(-180, Math.min(180, lng + (e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0)))]);
    } }}><rect width="1000" height="500" fill="var(--map-water)"/>{Array.from({ length: 11 }, (_, i) => <path key={'v' + i} d={`M${(i + 1) * 1000 / 12} 0V500`} stroke="var(--map-grid)" strokeWidth=".5"/>)}{Array.from({ length: 5 }, (_, i) => <path key={'h' + i} d={`M0 ${(i + 1) * 500 / 6}H1000`} stroke="var(--map-grid)" strokeWidth=".5"/>)}<g fill="var(--map-land)" stroke="var(--map-border)" strokeWidth={.6 / zoom}>{(detailed && detailPaths ? detailPaths : paths).map((p, i) => <path key={i} d={p.path} fillRule="evenodd"/>)}</g>{value && target && <path d={`M${(value[1] + 180) / 360 * 1000} ${(90 - value[0]) / 180 * 500}L${(target[1] + 180) / 360 * 1000} ${(90 - target[0]) / 180 * 500}`} stroke="var(--error-ink)" strokeDasharray={`${4 / zoom} ${3 / zoom}`} strokeWidth={1.5 / zoom}/>}{value && marker(value, target ? correct ? 'var(--success)' : 'var(--error-ink)' : 'var(--primary)', 'value')}{target && marker(target, 'var(--success)', 'target')}</svg><div className="map-caption">{target ? <span className="map-legend"><span className={correct ? 'right' : 'wrong'}>× {t('yourPin')}</span><span className="right">✓ {t('correctLocation')}</span></span> : <span>{t('mapTarget')}</span>}<a href="/sources">{detailed && detailPaths ? 'World countries · ODbL' : 'Natural Earth'}</a></div></div>;
}
