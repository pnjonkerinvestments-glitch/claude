#!/usr/bin/env bash
# Build the "you just watched…" videos: hope.html?v=1|2|3 -> out/hope/roviko-hope-N.mp4 (+ cover). Silent hook, the song drops on "This is Roviko".
set -euo pipefail
cd "$(dirname "$0")/.."
python3 build/mkshort.py src/hope.js >/dev/null
vs=("$@"); [ ${#vs[@]} -eq 0 ] && vs=(1 2 3)
mkdir -p out/hope
for v in "${vs[@]}"; do
  name="hope-$v"
  read -r DUR TEMPO SONG PHONE < <(node -e '
    const { chromium } = require("../roviko-launch-film/node_modules/playwright");
    (async () => { const b = await chromium.launch(); const pg = await b.newPage();
      await pg.goto("file://" + require("path").resolve("hope.html") + "?v=" + process.argv[1]); await pg.evaluate(() => window.filmReady);
      console.log((await pg.evaluate("[DURATION, TEMPO, SONG[0], TL.phone]")).join(" ")); await b.close(); })();' "$v")
  python3 - "$name" "$SONG" "$DUR" "$TEMPO" "$PHONE" <<'PY'
import json, sys, math
from pathlib import Path
name, song, dur, tempo, phone = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])
DROP = {'mi-gente': 32, 'ko-games': 32, 'light-it-up-boy': 16}[song]
lead = 4 if song == 'mi-gente' else 0     # mi-gente: 4 beats of its build-up before the drop
p = Path('build/week_music.json'); m = json.loads(p.read_text()) if p.exists() else {}
m[name] = dict(song=song, end=math.ceil(dur * tempo / 60), fade=0.9, pieces=[(phone - lead, DROP - lead, None)])
p.write_text(json.dumps(m, indent=1))
PY
  python3 build/music_cut.py "$name" >/dev/null
  node build/events.mjs hope.html "$name" "v=$v" >/dev/null
  python3 build/mix.py "$name" | tail -1
  node ../roviko-launch-film/build/render.mjs hope.html "out/master-$name.mkv" --dur "$DUR" --w 1080 --h 1920 --sub 4 --query "v=$v" | tail -1
  build/export.sh "out/master-$name.mkv" "audio/$name/mix.wav" "out/hope/roviko-hope-$v.mp4" | tail -1
  rm -f "out/master-$name.mkv"
  echo "DONE $v"
done
echo ALLDONE
