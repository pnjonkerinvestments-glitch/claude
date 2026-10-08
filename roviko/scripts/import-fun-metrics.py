"""Builds lib/data/fun-metrics.json from the archived CIA World Factbook (factbook/factbook.json, CC0 archive),
the same archive commit as lib/data/country-metrics.json. Usage: python3 scripts/import-fun-metrics.py <dir with ISO3.json files>
The directory holds the archive's country files saved as <ISO3>.json (see country_mapping in country-metrics.json)."""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
meta = json.load(open(os.path.join(ROOT, 'lib/data/country-metrics.json')))
COMMIT = meta['archive_commit']
src = sys.argv[1]

def num(text):
    m = re.match(r'\s*([0-9][0-9,]*(?:\.[0-9]+)?)', text or '')
    return float(m.group(1).replace(',', '')) if m else None

def year(text):
    m = re.search(r'\((?:[^()]*?)(\d{4})(?: est\.)?\)', text or '')
    return int(m.group(1)) if m else None

records, skipped = {}, []
for cid, path in sorted(meta['country_mapping'].items()):
    f = os.path.join(src, cid + '.json')
    if not os.path.exists(f):
        skipped.append([cid, 'file', 'missing']); continue
    j = json.load(open(f))
    url = 'https://github.com/factbook/factbook.json/blob/%s/%s' % (COMMIT, path)
    out = {}
    mil = (j.get('Military and Security') or {}).get('Military expenditures') or {}
    years = sorted((int(k[-4:]), v.get('text', '')) for k, v in mil.items() if re.search(r'\d{4}$', k) and isinstance(v, dict))
    if years:
        y, t = years[-1]
        if '% of GDP' in t and num(t) is not None:
            out['military_share'] = {'value': num(t), 'unit': '% of GDP', 'reference_year': y, 'raw': t}
        else:
            skipped.append([cid, 'military_share', t])
    alc = ((j.get('People and Society') or {}).get('Alcohol consumption per capita') or {}).get('total') or {}
    t = alc.get('text')
    if t and 'liters of pure alcohol' in t and num(t) is not None:
        out['alcohol'] = {'value': num(t), 'unit': 'litres of pure alcohol per person (15+)', 'reference_year': year(t), 'raw': t}
    elif t: skipped.append([cid, 'alcohol', t])
    tr = j.get('Transportation') or {}
    t = (tr.get('Airports') or {}).get('text')
    if t and num(t) is not None and re.match(r'\s*[0-9,]+\s*\(\d{4}\)\s*$', t):
        out['airports'] = {'value': num(t), 'unit': 'airports and airfields', 'reference_year': year(t), 'raw': t}
    elif t: skipped.append([cid, 'airports', t])
    t = ((tr.get('Railways') or {}).get('total') or {}).get('text')
    if t and re.match(r'\s*[0-9,.]+ km', t):
        out['railways'] = {'value': num(t), 'unit': 'km', 'reference_year': year(t), 'raw': t}
    elif t: skipped.append([cid, 'railways', t])
    if out:
        for v in out.values(): v['source_url'] = url
        records[cid] = out

json.dump({
    'id': 'roviko-fun-metrics-v1',
    'source': 'CIA World Factbook, archived by factbook/factbook.json',
    'license': 'CC0 1.0 (archive); numbers are factual observations',
    'archive_commit': COMMIT,
    'modifications': 'Only the leading number of each field is kept: the latest military expenditure year (% of GDP), total alcohol consumption, the number of airports and the total railway length. Countries without a railway have no railway value. Fields whose text does not start with a plain number are left out (see skipped).',
    'records': records,
    'skipped': skipped,
}, open(os.path.join(ROOT, 'lib/data/fun-metrics.json'), 'w'), ensure_ascii=False, indent=0)
print(len(records), 'countries;', {k: sum(1 for r in records.values() if k in r) for k in ['military_share', 'alcohol', 'airports', 'railways']}, 'skipped', len(skipped))
