"""Refresh the reviewed World Bank WDI snapshot. Gameplay never calls the API.

Run explicitly after reviewing indicator licences. Each indicator uses ONE reference year for every
country (so a comparison never mixes years): the newest year that covers at least 95% of the
countries the indicator covered in the previous import. No interpolation, missing-value
substitution, or competitor data is used.
"""
import concurrent.futures
import datetime
import json
import pathlib
import re
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
FIRST_YEAR, LAST_YEAR = 2021, datetime.date.today().year
PREVIOUS = json.loads((ROOT / 'lib/data/comparisons.json').read_text())['topics']
INDICATORS = {
    'population': 'SP.POP.TOTL',
    'urban': 'SP.URB.TOTL.IN.ZS',
    'life': 'SP.DYN.LE00.IN',
    'births': 'SP.DYN.TFRT.IN',
    'income': 'NY.GDP.PCAP.CD',
    'economy': 'NY.GDP.MKTP.CD',
    'forest': 'AG.LND.FRST.ZS',
    'farmland': 'AG.LND.AGRI.ZS',
    'exports': 'NE.EXP.GNFS.ZS',
    'internet': 'IT.NET.USER.ZS',
}
COUNTRIES = {c['id'] for c in json.loads((ROOT / 'lib/data/countries.json').read_text())}

def fetch(url):
    with urllib.request.urlopen(url, timeout=45) as response:
        return json.load(response)

def indicator(item):
    key, code = item
    license_page = f'https://data.worldbank.org/indicator/{code}'
    with urllib.request.urlopen(license_page, timeout=45) as response:
        html = response.read().decode()
    assert re.search(r'"License_Type",\["\^ ","\^2","atom","\^3","CC BY-4.0"\]', html), ('Review changed indicator licence before importing', code)
    url = f'https://api.worldbank.org/v2/country/all/indicator/{code}?format=json&date={FIRST_YEAR}:{LAST_YEAR}&per_page=4000'
    header, records = fetch(url)
    assert header['pages'] == 1
    metadata = fetch(f'https://api.worldbank.org/v2/indicator/{code}?format=json')[1][0]
    by_year = {}
    for r in records:
        if r['countryiso3code'] in COUNTRIES and isinstance(r['value'], (int, float)):
            by_year.setdefault(int(r['date']), {})[r['countryiso3code']] = r['value']
    needed = max(40, int(0.95 * len(PREVIOUS.get(key, {}).get('values', {}))))
    year = max(y for y, v in by_year.items() if len(v) >= needed)
    values = by_year[year]
    return key, {'indicator': code, 'reference_year': year, 'source_id': 'worldbank-wdi', 'url': url.replace(f'{FIRST_YEAR}:{LAST_YEAR}', str(year)), 'source_updated': header['lastupdated'], 'license': 'CC BY-4.0', 'license_checked_at': datetime.date.today().isoformat(), 'license_metadata_url': license_page, 'provider': metadata['sourceOrganization'], 'definition': metadata['sourceNote'], 'values': values}

if __name__ == '__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        topics = dict(pool.map(indicator, INDICATORS.items()))
    years = sorted({t['reference_year'] for t in topics.values()})
    snapshot = {'source': 'The World Bank: World Development Indicators', 'license': 'CC BY 4.0 with World Bank additional terms', 'license_url': 'https://www.worldbank.org/ext/en/legal/terms-conditions/datasets', 'imported_at': datetime.date.today().isoformat(), 'reference_year': years[-1], 'changes': 'Filtered to the Roviko country roster. Each indicator uses its newest year with near-full coverage (' + ', '.join(f"{k} {t['reference_year']}" for k, t in topics.items()) + '); missing observations omitted. Display values rounded only in the interface.', 'topics': topics}
    encoded = json.dumps(snapshot, ensure_ascii=False, separators=(',', ':')) + '\n'
    (ROOT / 'lib/data/comparisons.json').write_text(encoded)
    (ROOT / 'public/data/comparisons.json').write_text(encoded)
    manifest_path = ROOT / 'public/data/sources.json'
    sources = json.loads(manifest_path.read_text())
    sources = [s for s in sources if s['id'] not in ('worldbank-wdi-2023', 'worldbank-wdi')]
    sources.append({'id': 'worldbank-wdi', 'name': 'The World Bank: World Development Indicators (' + '–'.join(str(y) for y in (years[0], years[-1]) if y) + ')', 'url': 'https://datacatalog.worldbank.org/search/dataset/0037712/world-development-indicators', 'license': snapshot['license'], 'importedAt': snapshot['imported_at'], 'attribution': 'The World Bank: World Development Indicators. Original providers are retained for every indicator in /data/comparisons.json. Filtered to the Roviko roster, one reference year per indicator (the newest with near-full coverage); display values rounded.'})
    manifest_path.write_text(json.dumps(sources, ensure_ascii=False, indent=2) + '\n')
    print('Imported observations:', {k: len(v['values']) for k, v in topics.items()})
