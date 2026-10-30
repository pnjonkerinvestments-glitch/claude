#!/usr/bin/env python3
"""Road Trip (1.56): per country the box of its main land (west, south, east, north) and a point in its middle, from the
same licensed boundaries file as the Next Door map. Small, so the server can frame a trip without loading the shapes.
Run: python3 scripts/prepare-road-boxes.py  (writes lib/data/road-boxes.json)."""
import json

world = json.load(open('public/data/boundaries.json'))

def ring_box(r):
    xs = [p[0] for p in r]; ys = [p[1] for p in r]
    return [min(xs), min(ys), max(xs), max(ys)]

def ring_area(r):
    s = 0
    for i in range(len(r)):
        x1, y1 = r[i - 1]; x2, y2 = r[i]
        s += (x1 + x2) * (y2 - y1)
    return abs(s / 2)

def centroid(r):
    a = cx = cy = 0
    for i in range(len(r)):
        x1, y1 = r[i - 1]; x2, y2 = r[i]
        f = x1 * y2 - x2 * y1
        a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f
    if abs(a) < 1e-12:
        b = ring_box(r); return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]
    return [cx / (3 * a), cy / (3 * a)]

def union(a, b): return [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]
def meets(a, b, gap): return a[0] - gap <= b[2] and b[0] - gap <= a[2] and a[1] - gap <= b[3] and b[1] - gap <= a[3]
def area(b): return max(.01, b[2] - b[0]) * max(.01, b[3] - b[1])

out = {}
for cid, polys in sorted(world.items()):
    parts = sorted(({'box': ring_box(p[0]), 'size': ring_area(p[0]), 'ring': p[0]} for p in polys), key=lambda p: -p['size'])
    box, grew = parts[0]['box'], True
    while grew:
        grew = False
        for p in parts:
            nxt = union(box, p['box'])
            if meets(box, p['box'], 2.5) and area(nxt) > area(box): box, grew = nxt, True
    c = centroid(parts[0]['ring'])
    out[cid] = {'box': [round(v, 2) for v in box], 'c': [round(c[0], 2), round(c[1], 2)]}

json.dump({'id': 'roviko-road-boxes-v1', 'source': 'Derived from public/data/boundaries.json (see /sources)', 'countries': out}, open('lib/data/road-boxes.json', 'w'), separators=(',', ':'))
print(len(out), 'countries')
