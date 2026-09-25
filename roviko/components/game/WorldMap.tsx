'use client';
import { useEffect, useState, useRef } from 'react';
import { initialCamera, zoomCamera, panCamera, type MapCamera } from '@/lib/game-engine/map-camera';
import { Plus, Minus, RotateCcw, MapPin } from 'lucide-react';
type Props = {
    value: number[] | null;
    onChange: (v: number[]) => void;
    disabled?: boolean;
    correct?: boolean;
    target?: number[];
    onConfirm?: (v: number[]) => void;
    /** Called only when a pin is placed with a tap or click (not with the arrow keys), so solo games can answer in one step. */
    onTap?: (v: number[]) => void;
    t: (key: string) => string;
};
export default function WorldMap({ value, onChange, disabled, target, t, onConfirm, onTap, correct }: Props) {
    const [paths, setPaths] = useState<any[]>([]), [failed, setFailed] = useState(false), [camera, setCamera] = useState<MapCamera>(initialCamera);
    const [detailPaths, setDetailPaths] = useState<any[] | null>(null);
    const zoom = camera.zoom;
    const cameraRef = useRef(camera);
    const update = (next: MapCamera) => { cameraRef.current = next; setCamera(next); };
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
    const gesture = useRef<{ camera: MapCamera; point: number[]; distance: number; anchor: number[]; moved: boolean; multiple: boolean } | null>(null);
    const load = () => { setFailed(false); fetch('/data/world-map.json', { signal: AbortSignal.timeout(10000) }).then(r => { if (!r.ok) throw Error(); return r.json(); }).then(setPaths).catch(() => setFailed(true)); };
    useEffect(load, []);
    const fraction = (x: number, y: number) => {
        const r = ref.current!.getBoundingClientRect(), scale = Math.min(r.width / 1000, r.height / 500);
        return [(x-r.left-(r.width-1000*scale)/2)/(1000*scale), (y-r.top-(r.height-500*scale)/2)/(500*scale)];
    };
    const world = (f: number[], c = cameraRef.current) => [c.x + f[0]*1000/c.zoom, c.y + f[1]*500/c.zoom];
    const changeZoom = (z: number) => update(zoomCamera(cameraRef.current,z));
    const begin = () => {
        const points=[...active.current.values()], c=cameraRef.current;
        const point=points.length>1 ? [(points[0][0]+points[1][0])/2,(points[0][1]+points[1][1])/2] : points[0];
        gesture.current={camera:c,point,anchor:world(fraction(...point as [number,number]),c),distance:points.length>1?Math.hypot(points[0][0]-points[1][0],points[0][1]-points[1][1]):0,moved:gesture.current?.moved??false,multiple:points.length>1||!!gesture.current?.multiple};
    };
    const pointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        active.current.set(e.pointerId,[e.clientX,e.clientY]);begin();
    };
    const pointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
        if (!active.current.has(e.pointerId)||!gesture.current) return;
        active.current.set(e.pointerId,[e.clientX,e.clientY]);
        const g=gesture.current, points=[...active.current.values()];
        if(points.length>=2){
            const [a,b]=points, midpoint=[(a[0]+b[0])/2,(a[1]+b[1])/2];g.moved=true;
            const z=g.camera.zoom*Math.hypot(a[0]-b[0],a[1]-b[1])/Math.max(1,g.distance);
            update(zoomCamera(g.camera,z,g.anchor,fraction(...midpoint as [number,number])));
        }else{
            if(Math.hypot(e.clientX-g.point[0],e.clientY-g.point[1])>7)g.moved=true;
            if(g.moved){const start=fraction(...g.point as [number,number]), end=fraction(e.clientX,e.clientY);update(panCamera(g.camera,[end[0]-start[0],end[1]-start[1]]));}
        }
    };
    const pointerEnd = (e: React.PointerEvent<SVGSVGElement>) => {
        const g=gesture.current;
        if(e.type==='pointerup' && active.current.size===1 && g && !g.moved && !g.multiple && !disabled){
            const f=fraction(e.clientX,e.clientY);
            if(f.every(v=>v>=0&&v<=1)){const p=world(f),pin=[Math.max(-90,Math.min(90,90-p[1]/500*180)),Math.max(-180,Math.min(180,p[0]/1000*360-180))];onChange(pin);onTap?.(pin);}
        }
        active.current.delete(e.pointerId);
        if(active.current.size)begin();else gesture.current=null;
    };
    useEffect(()=>{
        const svg=ref.current;if(!svg)return;
        const wheel=(e:WheelEvent)=>{e.preventDefault();const c=cameraRef.current,f=fraction(e.clientX,e.clientY);update(zoomCamera(c,c.zoom*Math.exp(-e.deltaY*.002),world(f,c),f));};
        svg.addEventListener('wheel',wheel,{passive:false});return()=>svg.removeEventListener('wheel',wheel);
    },[failed]);
    const viewBox = `${camera.x} ${camera.y} ${1000/zoom} ${500/zoom}`;
    const marker = (v: number[], color: string, key: string) => <g key={key} transform={`translate(${(v[1] + 180) / 360 * 1000} ${(90 - v[0]) / 180 * 500})`}><circle r={13 / zoom} fill={color} opacity=".18"/><circle r={5 / zoom} fill={color} stroke="#111622" strokeWidth={2 / zoom}/><path d={`M0 ${-5 / zoom}V${-24 / zoom}`} stroke={color} strokeWidth={3 / zoom}/><circle cy={-24 / zoom} r={6 / zoom} fill={color}/></g>;
    if (failed)
        return <div className="empty-state"><MapPin /><p>{t('mapFailed')}</p><button className="btn secondary" onClick={load}>{t('retry')}</button></div>;
    return <div className="map-wrap"><div className="map-tools"><button className="icon-btn" aria-label={t('mapZoomIn')} onClick={() => changeZoom(zoom * 1.5)}><Plus size={18}/></button><button className="icon-btn" aria-label={t('mapZoomOut')} onClick={() => changeZoom(zoom / 1.5)}><Minus size={18}/></button><button className="icon-btn" aria-label={t('mapReset')} onClick={() => { update(initialCamera); }}><RotateCcw size={17}/></button></div><svg ref={ref} className="world-map" viewBox={viewBox} role="application" aria-label={t('mapHint') + ' ' + t('mapKeyboard')} tabIndex={disabled ? -1 : 0} style={{touchAction:"none"}} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd} onKeyDown={e => { if (['+','=','-','0'].includes(e.key)) { e.preventDefault(); if(e.key==='0')update(initialCamera);else changeZoom(cameraRef.current.zoom*(e.key==='-'?1/1.5:1.5)); return; } if (disabled)
        return; if (e.key === 'Enter' && value) {
        e.preventDefault();
        onConfirm?.(value);
        return;
    } const [lat, lng] = value ?? [0, 0], step = (e.shiftKey ? .5 : 5) / zoom; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        onChange([Math.max(-90, Math.min(90, lat + (e.key === 'ArrowUp' ? step : e.key === 'ArrowDown' ? -step : 0))), Math.max(-180, Math.min(180, lng + (e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0)))]);
    } }}><rect width="1000" height="500" fill="var(--map-water)"/>{Array.from({ length: 11 }, (_, i) => <path key={'v' + i} d={`M${(i + 1) * 1000 / 12} 0V500`} stroke="var(--map-grid)" strokeWidth=".5"/>)}{Array.from({ length: 5 }, (_, i) => <path key={'h' + i} d={`M0 ${(i + 1) * 500 / 6}H1000`} stroke="var(--map-grid)" strokeWidth=".5"/>)}<g fill="var(--map-land)" stroke="var(--map-border)" strokeWidth={.6 / zoom}>{(detailed && detailPaths ? detailPaths : paths).map((p, i) => <path key={i} d={p.path} fillRule="evenodd"/>)}</g>{value && target && <path d={`M${(value[1] + 180) / 360 * 1000} ${(90 - value[0]) / 180 * 500}L${(target[1] + 180) / 360 * 1000} ${(90 - target[0]) / 180 * 500}`} stroke="var(--error-ink)" strokeDasharray={`${4 / zoom} ${3 / zoom}`} strokeWidth={1.5 / zoom}/>}{value && marker(value, target ? correct ? 'var(--success)' : 'var(--error-ink)' : 'var(--primary)', 'value')}{target && marker(target, 'var(--success)', 'target')}</svg><div className="map-caption">{target ? <span className="map-legend"><span className={correct ? 'right' : 'wrong'}>× {t('yourPin')}</span><span className="right">✓ {t('correctLocation')}</span></span> : <span>{t('mapGestures')} · {Math.round(zoom*10)/10}×</span>}<a href="/sources">{detailed && detailPaths ? 'World countries · ODbL' : 'Natural Earth'}</a></div></div>;
}
