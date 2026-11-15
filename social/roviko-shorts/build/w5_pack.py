"""Bundle content week 5 (16-22 Nov 2026): one folder and one zip per day, in posting order, plus one zip for the week.
  python3 build/w5_pack.py   (after build/w5ex.sh, and with roviko-carousels/out/post-49..55 rendered)
  -> ../roviko-week5/D<n>/  1-0800-what-flag-is-this/ · 2-1230-map-challenge-NN/ · 3-1730-roviko-explains/ · 4-1900-flag-twins/ · banners/ · CAPTIONS.txt
Every post folder has caption.txt: paste it as it is."""
import json, os, shutil, subprocess, sys, zipfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from w5_posts import DAYS, SLOTS, MAPN, POSTS

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT.parent / 'roviko-week5'
CAR = ROOT.parent / 'roviko-carousels' / 'out'
run = lambda *a, **k: subprocess.run(a, cwd=ROOT, check=True, **k)
ORDER = [('P4', 'what-flag-is-this'), ('P2', 'map-challenge'), ('P3', 'roviko-explains'), ('P1', 'flag-twins')]   # by posting time

for f in ['w2-car', 'w5-gtf', 'w5-explain']: run('python3', 'build/mkshort.py', f'src/{f}.js', stdout=subprocess.DEVNULL)
tmp = OUT / '_tmp'
run('node', 'build/w2-car.mjs', str(tmp), *[f'twins{d}' for d in DAYS], env=dict(os.environ, W='5'))
run('node', 'build/w5-gtf.mjs', str(tmp))
# the explainers' cover: one second after the first label lands
starts = json.loads(subprocess.run(['node', '-e', '''
const { chromium } = require("../roviko-launch-film/node_modules/playwright");
(async () => { const b = await chromium.launch(); const pg = await b.newPage(); const r = {};
  for (let d = 1; d <= 7; d++) { await pg.goto("file://" + require("path").resolve("w5-explain.html") + "?d=" + d); await pg.evaluate(() => window.filmReady); r[d] = await pg.evaluate("starts[1]"); }
  console.log(JSON.stringify(r)); await b.close(); })();'''], cwd=ROOT, check=True, capture_output=True, text=True).stdout)

folders, covers, banners = {}, [], {}
for d, (slug, day) in DAYS.items():
    base = OUT / f'D{d}'; base.mkdir(parents=True, exist_ok=True)
    for k, (p, name) in enumerate(ORDER, 1):
        pid = f'D{d}{p}'; time = SLOTS[p][2]
        nm = f'{k}-{time.replace(":", "")}-{name}' + (f'-{MAPN[d]}' if p == 'P2' else '')
        fol = base / nm
        if fol.exists() and p != 'P3': shutil.rmtree(fol)
        if p == 'P1': shutil.copytree(tmp / f'twins{d}', fol); first, reel = fol / '01.png', False
        elif p == 'P4': shutil.copytree(tmp / f'gtf{d}', fol); first, reel = fol / '01.png', False
        elif p == 'P2':
            for fmt in ['tiktok', 'instagram']: shutil.copytree(CAR / f'post-{MAPN[d]}' / fmt, fol / fmt)
            first, reel = fol / 'instagram' / '01.png', False
        else:
            fol.mkdir(exist_ok=True); src = base / f'{pid}.mp4'
            if src.exists(): shutil.move(src, fol / f'{pid}.mp4')
            if not (fol / f'{pid}.mp4').exists(): sys.exit(f'missing explainer {pid}')
            covers.append(dict(page='w5-explain.html', query=f'd={d}', t=starts[str(d)] + 1.6, w=1080, h=1920, out=str(fol / f'{pid}-cover.jpg')))
            first, reel = fol / f'{pid}-cover.jpg', True
        (fol / 'caption.txt').write_text(POSTS[pid][0] + '\n')
        folders[pid] = fol
        kind = 'NEW REEL' if reel else 'NEW SWIPE POST · ' + {'P1': '5 SLIDES', 'P2': '12 SLIDES', 'P4': '16 SLIDES'}[p]
        banners[pid] = dict(day=day, kind=kind, l1=POSTS[pid][1], l2=POSTS[pid][2], reel=reel, src='../' + str(first.relative_to(ROOT.parent)), cta='Watch and learn' if p == 'P3' else None)
shutil.rmtree(tmp)
(ROOT / 'build' / '_covers.json').write_text(json.dumps(covers)); run('node', 'build/w2-shots.mjs', 'build/_covers.json')
(ROOT / 'data' / 'w5banners.js').write_text('// written by build/w5_pack.py: banner texts and images for src/w2-banner.js (?w=5)\nwindow.W5B = ' + json.dumps(banners, ensure_ascii=False, indent=1) + ';\n')
run('python3', 'build/mkshort.py', 'src/w2-banner.js', stdout=subprocess.DEVNULL)
jobs = []
for pid in banners:
    bd = OUT / f'D{pid[1]}' / 'banners'; bd.mkdir(exist_ok=True)
    jobs.append(dict(page='w2-banner.html', query=f'id={pid}&w=5', w=1080, h=1920, out=str(bd / f'{pid}-banner.png')))
(ROOT / 'build' / '_banners.json').write_text(json.dumps(jobs)); run('node', 'build/w2-shots.mjs', 'build/_banners.json')
for f in ['_covers.json', '_banners.json']: (ROOT / 'build' / f).unlink()

WHAT = {'P1': 'Carrousel, 5 slides', 'P2': 'Carrousel, 12 slides (tiktok/ 3:4 en instagram/ 4:5)', 'P3': 'Reel (video, met -cover.jpg als omslag)', 'P4': 'Carrousel, 16 slides'}
for d, (slug, day) in DAYS.items():
    base = OUT / f'D{d}'
    lines = [f'ROVIKO @playroviko · {day}', '', '4 posts vandaag, in volgorde. Elke map heeft een caption.txt: kopieer en plak hem zoals hij is.',
             'Banners (1080x1920, voor Stories) staan in banners/.', '']
    for k, (p, _) in enumerate(ORDER, 1):
        pid = f'D{d}{p}'
        lines += ['=' * 60, f'{k}. {SLOTS[p][2]}  ·  {SLOTS[p][0]}  ·  {WHAT[p]}', f'Map: {folders[pid].name}/', '=' * 60, '', POSTS[pid][0], '']
    (base / 'CAPTIONS.txt').write_text('\n'.join(lines))
    z = OUT / f'Roviko-week5-D{d}-{slug}.zip'
    with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as zf:
        for f in sorted(base.rglob('*')):
            if f.is_file(): zf.write(f, Path(f'Roviko-D{d}-{slug}') / f.relative_to(base))
    print(z.name, round(z.stat().st_size / 1e6, 1), 'MB')
z = OUT / 'Roviko-week5-alle-7-dagen.zip'
with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as zf:
    if (OUT / 'PLAN.md').exists(): zf.write(OUT / 'PLAN.md', 'Roviko-week5/PLAN.md')
    for d, (slug, day) in DAYS.items():
        for f in sorted((OUT / f'D{d}').rglob('*')):
            if f.is_file(): zf.write(f, Path('Roviko-week5') / f'D{d}-{slug}' / f.relative_to(OUT / f'D{d}'))
print(z.name, round(z.stat().st_size / 1e6, 1), 'MB')
