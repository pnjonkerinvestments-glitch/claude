"""Bundle content week 2 (26 Oct - 1 Nov 2026) into one folder and one zip per day.
  python3 build/w2_pack.py   (after build/week2.sh, build/w2-car.mjs and roviko-carousels/build/shots.mjs 28-34)
  -> ../roviko-week2/D<n>/  D<n>P1-flag-twins/ · D<n>P2-map-challenge-NN/ · D<n>P3.. reels with cover · banners/ · CAPTIONS.txt
  -> ../roviko-week2/Roviko-week2-D<n>-<day>.zip
Every post folder has caption.txt: paste it as it is."""
import json, shutil, subprocess, sys, zipfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from w2_posts import DAYS, SLOTS, MAPN, POSTS

ROOT = Path(__file__).resolve().parent.parent          # roviko-shorts
OUT = ROOT.parent / 'roviko-week2'
CAR = ROOT.parent / 'roviko-carousels' / 'out'
REEL = {'P3': ('w2-flag.html', 'flag-twins-reel'), 'P4': ('w2-clue.html', '3-facts-reel'), 'P5': ('w2-map.html', 'map-facts-reel')}
# cover moment per page (seconds): everything of the question on screen, nothing given away
COVER_T = {'w2-flag.html': 1.7, 'w2-clue.html': 1.2, 'w2-map.html': 1.3}
run = lambda *a: subprocess.run(a, cwd=ROOT, check=True)

for f in ['w2-car', 'w2-banner', 'w2-flag', 'w2-clue', 'w2-map']:
    if f != 'w2-banner': run('python3', 'build/mkshort.py', f'src/{f}.js')
tmp = OUT / '_car'; run('node', 'build/w2-car.mjs', str(tmp))

folders, covers, banners = {}, [], {}
for d, (slug, day) in DAYS.items():
    base = OUT / f'D{d}'; base.mkdir(parents=True, exist_ok=True)
    for p, (label, kind, time) in SLOTS.items():
        pid = f'D{d}P{p[1]}'
        if p == 'P1':
            fol = base / f'{pid}-flag-twins'; shutil.copytree(tmp / f'twins{d}', fol, dirs_exist_ok=True); first, reel = fol / '01.png', False
        elif p == 'P2':
            n = MAPN[d]; fol = base / f'{pid}-map-challenge-{n}'
            for fmt in ['tiktok', 'instagram']: shutil.copytree(CAR / f'post-{n}' / fmt, fol / fmt, dirs_exist_ok=True)
            first, reel = fol / 'instagram' / '01.png', False
        elif pid == 'D6P5':
            fol = base / f'{pid}-halloween'; shutil.copytree(tmp / 'halloween', fol, dirs_exist_ok=True); first, reel = fol / '01.png', False
        else:
            page, name = REEL[p]; fol = base / f'{pid}-{name}'; fol.mkdir(exist_ok=True)
            src = base / f'{pid}.mp4'
            if src.exists(): shutil.move(src, fol / f'{pid}.mp4')
            if not (fol / f'{pid}.mp4').exists(): sys.exit(f'missing reel {pid}')
            covers.append(dict(page=page, query=f'd={d}', t=COVER_T[page], w=1080, h=1920, out=str(fol / f'{pid}-cover.jpg')))
            first, reel = fol / f'{pid}-cover.jpg', True
        (fol / 'caption.txt').write_text(POSTS[pid][0] + '\n')
        folders[pid] = fol
        kindtxt = 'NEW REEL' if reel else ('NEW SWIPE POST · 12 SLIDES' if p == 'P2' else 'NEW SWIPE POST')
        banners[pid] = dict(day=day, kind=kindtxt, l1=POSTS[pid][1], l2=POSTS[pid][2], reel=reel, src='../' + str(first.relative_to(ROOT.parent)))
shutil.rmtree(tmp)
Path(ROOT / 'build' / '_covers.json').write_text(json.dumps(covers)); run('node', 'build/w2-shots.mjs', 'build/_covers.json')
(ROOT / 'data' / 'w2banners.js').write_text('// written by build/w2_pack.py: banner texts and images for src/w2-banner.js\nwindow.W2B = ' + json.dumps(banners, ensure_ascii=False, indent=1) + ';\n')
run('python3', 'build/mkshort.py', 'src/w2-banner.js')
jobs = []
for pid in banners:
    bd = OUT / f'D{pid[1]}' / 'banners'; bd.mkdir(exist_ok=True)
    jobs.append(dict(page='w2-banner.html', query=f'id={pid}', w=1080, h=1920, out=str(bd / f'{pid}-banner.png')))
Path(ROOT / 'build' / '_banners.json').write_text(json.dumps(jobs)); run('node', 'build/w2-shots.mjs', 'build/_banners.json')
for f in ['_covers.json', '_banners.json']: (ROOT / 'build' / f).unlink()

# one CAPTIONS.txt per day, then the zips
for d, (slug, day) in DAYS.items():
    base = OUT / f'D{d}'
    lines = [f'ROVIKO @playroviko · {day}', 'Elke post heeft een eigen map met caption.txt: kopieer die tekst en plak hem zoals hij is.', 'Reels: upload de .mp4 en kies de -cover.jpg als omslag. Banners (1080x1920) staan in banners/.', '']
    for p, (label, kind, time) in sorted(SLOTS.items(), key=lambda kv: kv[1][2]):
        pid = f'D{d}P{p[1]}'; fol = folders[pid]
        what = 'Halloween carrousel (7 slides)' if pid == 'D6P5' else {'car': 'Carrousel (5 slides)', 'map': 'Carrousel (12 slides)', 'reel': 'Reel'}[kind]
        lines += ['=' * 60, f'{pid} · {what} · {label if pid != "D6P5" else "Halloween"} · voorstel {time}', f'Map: {fol.name}/', '=' * 60, '', POSTS[pid][0], '']
    (base / 'CAPTIONS.txt').write_text('\n'.join(lines))
    z = OUT / f'Roviko-week2-D{d}-{slug}.zip'
    with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as zf:
        for f in sorted(base.rglob('*')):
            if f.is_file(): zf.write(f, Path(f'Roviko-D{d}-{slug}') / f.relative_to(base))
    print(z.name, round(z.stat().st_size / 1e6, 1), 'MB')
