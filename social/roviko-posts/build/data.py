"""Regenerates build/shapes.json, build/icons.json and assets/world.svg from the Roviko site in roviko/.

Run from social/roviko-posts/: `python3 build/data.py`. Add countries for post 8 to KEEP (ISO3 codes).
"""
import json, math, re

SITE = '../../roviko/'
P = SITE + 'public/'
KEEP = ['CAN', 'AUS', 'ISL', 'ITA', 'CHL', 'MDG', 'JPN', 'NZL', 'GRC', 'VNM']

# Faint world map for backgrounds.
wm = json.load(open(P + 'data/world-map.json'))
ys = [float(b) for p in wm for _, b in re.findall(r'(-?[\d.]+),(-?[\d.]+)', p['path'])]
d = ''.join(p['path'] for p in wm)
open('assets/world.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {int(min(ys))} 1000 {int(max(ys) - min(ys)) + 1}"><path d="{d}" fill="#163B32"/></svg>')

# Country silhouettes (100x80 box) plus South Africa and Lesotho in one shared projection.
sil = json.load(open(P + 'data/silhouettes.json'))
shapes = {k: sil[k] for k in KEEP}
def proj(lon, lat, lat0=-29): return (lon * math.cos(math.radians(lat0)), -lat)
def polys(c):
    g = json.load(open(P + f'shapes/{c}.geo.json'))['features'][0]['geometry']
    return g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
za, pts = {}, []
for c in ['ZAF', 'LSO']:
    # Mainland only: drops the Prince Edward Islands far to the south-east.
    keep = [p for p in polys(c) if max(len(r) for r in p) > 30 and all(-36 < pt[1] < -21 for pt in p[0])]
    path = ''
    for poly in keep:
        for ring in poly:
            ring_pts = [proj(*pt) for pt in ring]; pts += ring_pts
            path += 'M' + 'L'.join(f'{x:.3f},{y:.3f}' for x, y in ring_pts) + 'Z'
    za[c] = path
xs, yy = [p[0] for p in pts], [p[1] for p in pts]
za['bbox'] = [min(xs), min(yy), max(xs) - min(xs), max(yy) - min(yy)]
ring = polys('LSO')[0][0]
za['lso_center'] = [sum(proj(*pt)[0] for pt in ring) / len(ring), sum(proj(*pt)[1] for pt in ring) / len(ring)]
shapes['_za'] = za
json.dump(shapes, open('build/shapes.json', 'w'))

# Game logos from the site's GameIcon component, as plain SVG.
src = open(SITE + 'components/atelier/GameIcon.tsx').read()
body = src[src.index('const LOGOS'):src.index("LOGOS['daily-trail']")]
icons = {}
for m in re.finditer(r"^\s{2}(\w+): <>(.*?)</>,", body, re.S | re.M):
    svg = re.sub(r'//.*', '', m.group(2)).replace('{CUT}', '"var(--gi-bg,#fff)"')
    svg = re.sub(r'\b([a-z]+)([A-Z][a-z]+)=', lambda x: x.group(1) + '-' + x.group(2).lower() + '=', svg)
    icons[m.group(1)] = re.sub(r'\s+', ' ', svg).strip()
json.dump(icons, open('build/icons.json', 'w'))
print(len(shapes) - 1, 'shapes,', len(icons), 'icons')
