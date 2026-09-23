"""Import a pinned CC0 Factbook archive. No gameplay network requests.
Usage: python scripts/content/import-country-metrics.py [--download]
Source prose and numbers remain attributed; missing/ambiguous values are omitted.
"""
import html, io, json, pathlib, re, sys, unicodedata, urllib.request, zipfile
ROOT=pathlib.Path(__file__).resolve().parents[2]
PIN='144d6977b2b01ac1cbd220de754c0a005616760b'
CACHE=ROOT/'.test-runtime/factbook'
if '--download' in sys.argv or not CACHE.exists():
 with urllib.request.urlopen(f'https://codeload.github.com/factbook/factbook.json/zip/{PIN}',timeout=60) as r: archive=r.read()
 with zipfile.ZipFile(io.BytesIO(archive)) as z:
  for item in z.infolist():
   parts=pathlib.PurePosixPath(item.filename).parts[1:]
   if len(parts)==2 and parts[-1].endswith('.json'):
    out=CACHE.joinpath(*parts);out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(z.read(item))
   if parts==('LICENSE.md',):
    CACHE.mkdir(parents=True,exist_ok=True);(CACHE/'LICENSE.md').write_bytes(z.read(item))
COUNTRIES=json.loads((ROOT/'lib/data/countries.json').read_text())
def clean(v):
 if isinstance(v,dict):v=v.get('text','')
 return re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',str(v)))).strip()
def norm(v):return re.sub('[^a-z0-9]','',unicodedata.normalize('NFKD',clean(v).lower()))
lookup={norm(c[k]):c['id'] for c in COUNTRIES for k in ['name','official']}
overrides={'iv':'CIV','bm':'MMR','tu':'TUR','vt':'VAT'}
records={};mapped={};omitted=[]
for path in sorted(CACHE.glob('*/*.json')):
 data=json.loads(path.read_text()); names=data.get('Government',{}).get('Country name',{})
 cid=overrides.get(path.stem) or next((lookup[norm(v)] for k,v in names.items() if k in ['conventional short form','conventional long form'] and norm(v) in lookup),None)
 if not cid:continue
 assert cid not in mapped,('Duplicate mapping',cid)
 mapped[cid]=str(path.relative_to(CACHE)); geo=data.get('Geography',{}); people=data.get('People and Society',{}); elevation=geo.get('Elevation',{})
 fields={'coastline':clean(geo.get('Coastline','')),'highest':clean(elevation.get('highest point','')),'elevation':clean(elevation.get('mean elevation','')),'age':clean(people.get('Median age',{}).get('total',''))}
 output={}
 for key,raw in fields.items():
  if not raw or raw.lower().startswith(('na','n/a','none')):continue
  unit='km' if key=='coastline' else 'years' if key=='age' else 'm'
  # A single geographic measurement is required; multi-part ranges are not guessed.
  matches=list(re.finditer(r'(?<![\w.])(-?\d[\d,]*(?:\.\d+)?)\s*'+unit+r'\b',raw))
  if not matches:omitted.append([cid,key,raw]);continue
  if key=='coastline' and (len(matches)>1 or ';' in raw):omitted.append([cid,key,raw]);continue
  match=matches[-1] if key=='highest' else matches[0];value=float(match.group(1).replace(',',''))
  if value<0 or (key=='age' and not 10<value<70):continue
  year=re.search(r'\((20\d{2})',raw)
  if key=='age' and not year:omitted.append([cid,key,raw]);continue
  record={'value':value,'unit':unit,'reference_year':int(year.group(1)) if year else None,'estimated':'est.' in raw,'source_id':'factbook-archive','source_url':f'https://github.com/factbook/factbook.json/blob/{PIN}/{path.relative_to(CACHE)}','raw':raw}
  if key=='highest':record['place']=re.sub(r'\([^)]*\)','',raw[:match.start()]).strip(' ,;')
  if key=='highest' and cid=='NLD':
   # The archive and current source pages disagree (862/887/870 m). Omit pending review.
   omitted.append([cid,key,'Conflicting primary/source measurements; excluded rather than asserting a current height.']);continue
  if key=='highest' and cid=='DEU':
   record.update(value=2962,place='Zugspitze',source_id='zugspitze-operator',source_url='https://zugspitze.de/en/Our-mountain-worlds/The-areas/Zugspitze',raw='Zugspitze · 2,962 m (numeric fact verified with the mountain operator)')
  output[key]=record
 records[cid]=output
assert len(mapped)==194,('Review country-name mapping',len(mapped))
snapshot={'id':'roviko-country-metrics-v1','imported_at':'2026-09-21','archive_commit':PIN,'source':'CIA World Factbook, archived by factbook/factbook.json','license':'CC0 1.0 (archive); individual numerical correction is a factual observation','license_url':'https://creativecommons.org/publicdomain/zero/1.0/','archive_url':f'https://github.com/factbook/factbook.json/tree/{PIN}','source_status':'Archived source: the CIA discontinued The World Factbook in February 2026. Import date is not an observation year.','modifications':'Filtered to the existing country roster; only coastline, highest point, mean elevation and total median age parsed. GEC codes are explicitly mapped, never treated as ISO. Missing/ambiguous values omitted. Dutch highest-point observation omitted for conflicting figures. German highest point corrected to the operator’s 2962 m. No photos or emblems.','records':records,'country_mapping':mapped,'omitted':omitted}
encoded=json.dumps(snapshot,ensure_ascii=False,indent=2)+'\n'
for path in ['lib/data/country-metrics.json','public/data/country-metrics.json']:(ROOT/path).write_text(encoded)
(ROOT/'public/licenses/factbook-CC0.txt').write_text((CACHE/'LICENSE.md').read_text())
print('Country profiles:',len(records),'measurements:',sum(map(len,records.values())))
print('Coverage:',{k:sum(k in r for r in records.values()) for k in ['coastline','highest','elevation','age']})
print('Omitted ambiguous/missing:',len(omitted))
