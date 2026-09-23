import { haversine } from './scoring';
export type Polygons = number[][][][];
function unwrap(ring: number[][], longitude: number) {
    const result: number[][] = [];
    for (const p of ring) {
        let x = p[0], reference = result.at(-1)?.[0] ?? longitude;
        while (x - reference > 180) x -= 360;
        while (x - reference < -180) x += 360;
        result.push([x, p[1]]);
    }
    return result;
}
export function locateInCountry(point: number[], polygons: Polygons, toleranceKm = 25) {
    let closest = Infinity;
    for (const polygon of polygons) {
        let inPolygon = false;
        polygon.forEach((raw, ringIndex) => {
            const ring = unwrap(raw, point[1]);
            const middle = ring.reduce((a, p) => a + p[0], 0) / ring.length;
            const x = point[1] + 360 * Math.round((middle - point[1]) / 360), y = point[0];
            let inside = false;
            for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
                const [ax, ay] = ring[j], [bx, by] = ring[i];
                if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
                const scale = Math.max(.01, Math.cos(y * Math.PI / 180));
                const dx = (bx - ax) * scale, dy = by - ay, denom = dx * dx + dy * dy;
                const t = denom ? Math.max(0, Math.min(1, ((x - ax) * scale * dx + (y - ay) * dy) / denom)) : 0;
                closest = Math.min(closest, haversine(point, [ay + t * (by - ay), ax + t * (bx - ax)]));
            }
            if (ringIndex === 0) inPolygon = inside;
            else if (inside) inPolygon = false;
        });
        if (inPolygon) return { correct: true, distance: 0 };
    }
    return { correct: closest <= toleranceKm, distance: Math.round(closest) };
}
