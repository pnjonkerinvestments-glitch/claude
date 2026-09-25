'use client';
import { useEffect, useState } from 'react';
/** A labelled reveal map, using the same licensed country geometries as the atlas. */
export default function BorderMap({ ids, names, t }: { ids: string[]; names: string[]; t: (key: string) => string }) {
    const [data, setData] = useState<any[] | null>(null), [failed, setFailed] = useState(false), [retry, setRetry] = useState(0);
    useEffect(() => {
        const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 10000);
        setFailed(false);
        Promise.all(ids.map(id => fetch('/shapes/' + id + '.geo.json', { signal: controller.signal }).then(r => { if (!r.ok) throw Error(); return r.json(); })))
            .then(setData).catch(() => setFailed(true)).finally(() => clearTimeout(timeout));
        return () => { controller.abort(); clearTimeout(timeout); };
    }, [ids.join(','), retry]);
    if (failed) return <p>{t('mapFailed')} <button className="text-link" onClick={() => setRetry(n => n + 1)}>{t('retry')}</button></p>;
    if (!data) return <p role="status">{t('loading')}</p>;
    const polygons = data.map(collection => collection.features.flatMap((f: any) => f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates));
    const points = polygons.flat(3), xs = points.map((p: number[]) => p[0]), ys = points.map((p: number[]) => -p[1]);
    const minX = Math.min(...xs), minY = Math.min(...ys), width = Math.max(2, Math.max(...xs) - minX), height = Math.max(2, Math.max(...ys) - minY), pad = Math.max(width, height) * .1;
    return <figure className="border-reveal-map"><svg viewBox={`${minX-pad} ${minY-pad} ${width+pad*2} ${height+pad*2}`} role="img" aria-label={t('borderMapLabel') + ': ' + names.join(' / ')}>
        {polygons.map((country, i) => <g key={ids[i]} fill={i ? 'var(--success)' : 'var(--primary)'} stroke="var(--card)" strokeWidth={Math.max(width,height)/250} fillRule="evenodd">{country.map((p: number[][][], n: number) => <path key={n} d={p.map(r => r.map((c,j) => (j ? 'L':'M')+c[0]+','+(-c[1])).join('')+'Z').join('')}/>)}</g>)}
    </svg><figcaption>{names.map((name, i) => <span key={i} className={i ? 'neighbor' : 'target'}>{i+1}. {name}</span>)}</figcaption></figure>;
}
