"""Which capital is closest, for every bit of Italy? Grid of points inside Italy (equal-area weights), nearest capital by great-circle distance.
  python3 social/roviko-trends/build_italy.py  ->  data/italy.json (shares + a coarse grid for the map)"""
import json, math
from pathlib import Path
H = Path(__file__).resolve().parent
s = (H.parent / 'roviko-carousels/data/geo.js').read_text(); G = json.loads(s[s.index('{'):s.rindex('}') + 1])
CAP = json.loads((H / 'data/capitals.json').read_text())
def inside(x, y, ring):
    c = False
    for i in range(len(ring)):
        (x1, y1), (x2, y2) = ring[i - 1], ring[i]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: c = not c
    return c
def in_country(x, y, polys):
    return any(inside(x, y, p[0]) and not any(inside(x, y, h) for h in p[1:]) for p in polys)
def hav(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    return 2 * 6371 * math.asin(math.sqrt(math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2))
caps = [(k, (v['lat'], v['lon'])) for k, v in CAP.items()]
near = [(k, p) for k, p in caps if 30 < p[0] < 52 and 0 < p[1] < 25]
polys = G['ITA']; step = 0.025
tot = 0; share = {}; share_nomicro = {}; grid = []
y = 35.4
while y < 47.2:
    x = 6.5
    while x < 18.6:
        if in_country(x, y, polys):
            w = math.cos(math.radians(y)); tot += w
            d = sorted((hav((y, x), p), k) for k, p in near)
            share[d[0][1]] = share.get(d[0][1], 0) + w
            d2 = [t for t in d if t[1] not in ('VAT', 'SMR')]
            share_nomicro[d2[0][1]] = share_nomicro.get(d2[0][1], 0) + w
            if round(y / step) % 4 == 0 and round(x / step) % 4 == 0: grid.append([round(x, 2), round(y, 2), d[0][1], d2[0][1]])
        x += step
    y += step
out = dict(all={k: round(100 * v / tot, 2) for k, v in sorted(share.items(), key=lambda t: -t[1])},
           no_micro={k: round(100 * v / tot, 2) for k, v in sorted(share_nomicro.items(), key=lambda t: -t[1])}, grid=grid)
(H / 'data/italy.json').write_text(json.dumps(out))
print('with San Marino + Vatican:', out['all']); print('without:', out['no_micro'])
