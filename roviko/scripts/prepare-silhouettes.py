"""Derive north-up quiz silhouettes from the pinned ODbL country geometries."""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def area(ring):
    return abs(sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(ring, ring[1:]))) / 2

def simplify(points, tolerance):
    if len(points) < 3:
        return points
    a, b = points[0], points[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    length = dx * dx + dy * dy
    def distance(p):
        t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length)) if length else 0
        return math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
    index, maximum = max(enumerate(map(distance, points)), key=lambda x: x[1])
    if maximum <= tolerance:
        return [a, b]
    return simplify(points[:index + 1], tolerance)[:-1] + simplify(points[index:], tolerance)

result = {}
for country in json.loads((ROOT / 'lib/data/countries.json').read_text()):
    geo = json.loads((ROOT / 'public/shapes' / (country['id'] + '.geo.json')).read_text())
    rings = []
    for feature in geo['features']:
        g = feature['geometry']
        polygons = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
        for polygon in polygons:
            ring = polygon[0]
            # Unwrap each ring at the date line before measuring it.
            unwrapped = [ring[0][:2]]
            for lon, lat, *_ in ring[1:]:
                prev = unwrapped[-1][0]
                lon += round((prev - lon) / 360) * 360
                unwrapped.append([lon, lat])
            rings.append(unwrapped)
    rings.sort(key=area, reverse=True)
    largest = area(rings[0])
    major = [r for r in rings if area(r) >= largest * .025]
    center = sum(p[0] for p in major[0]) / len(major[0])
    lat = sum(p[1] for p in major[0]) / len(major[0])
    cosine = max(.2, math.cos(math.radians(lat)))
    projected = []
    for ring in major:
        mid = sum(p[0] for p in ring) / len(ring)
        shift = round((center - mid) / 360) * 360
        # Omit far overseas components; the silhouette is the main landmass.
        main_minx, main_miny = map(min, zip(*major[0])); main_maxx, main_maxy = map(max, zip(*major[0]))
        part_minx, part_miny = map(min, zip(*ring)); part_maxx, part_maxy = map(max, zip(*ring))
        gap_x = max(0, main_minx - part_maxx - shift, part_minx + shift - main_maxx) * cosine
        gap_y = max(0, main_miny - part_maxy, part_miny - main_maxy)
        if math.hypot(gap_x, gap_y) > 12:
            continue
        projected.append([[(x + shift) * cosine, -y] for x, y in ring])
    points = [p for ring in projected for p in ring]
    minx, miny = map(min, zip(*points)); maxx, maxy = map(max, zip(*points))
    scale = min(92 / max(.0001, maxx - minx), 72 / max(.0001, maxy - miny))
    ox, oy = (100 - (maxx - minx) * scale) / 2, (80 - (maxy - miny) * scale) / 2
    paths = []
    for ring in projected:
        p = simplify([[(x - minx) * scale + ox, (y - miny) * scale + oy] for x, y in ring], .18)
        paths.append('M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in p) + 'Z')
    result[country['id']] = ''.join(paths)
encoded = json.dumps(result, separators=(',', ':')) + '\n'
(ROOT / 'lib/data/silhouettes.json').write_text(encoded)
(ROOT / 'public/data/silhouettes.json').write_text(encoded)
print('Prepared', len(result), 'silhouettes;', len(encoded), 'bytes')
