import json,math
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def simplify(points,tol=.025):
 if len(points)<5:return points
 a,b=points[0],points[-1];dx,dy=b[0]-a[0],b[1]-a[1];den=dx*dx+dy*dy
 def distance(p):
  t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den)) if den else 0
  return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)
 k=max(range(1,len(points)-1),key=lambda i:distance(points[i]))
 if distance(points[k])>tol:return simplify(points[:k+1],tol)[:-1]+simplify(points[k:],tol)
 return [a,b]
out={}
for p in (root/'public/shapes').glob('*.geo.json'):
 polys=[]
 for f in json.loads(p.read_text())['features']:
  g=f['geometry'];pp=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
  for poly in pp:
   rings=[]
   for r in poly:
    s=simplify(r);s=s if len(s)>=4 else r
    rings.append([[round(x,5),round(y,5)] for x,y,*_ in s])
   polys.append(rings)
 out[p.name.split('.')[0]]=polys
(root/'public/data/boundaries.json').write_text(json.dumps(out,separators=(',',':')))
print(len(out),'country geometries;', (root/'public/data/boundaries.json').stat().st_size,'bytes')
