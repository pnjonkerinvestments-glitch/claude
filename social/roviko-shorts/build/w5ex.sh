#!/usr/bin/env bash
# Build the week-5 explainers (16-22 Nov 2026): w5-explain.html?d=N -> ../roviko-week5/D<N>/D<N>P3.mp4 (music bed, sound cues, subtitles).
#   build/w5ex.sh [1 2 ...]
set -euo pipefail
cd "$(dirname "$0")/.."
python3 build/mkshort.py src/w5-explain.js >/dev/null
ds=("$@"); [ ${#ds[@]} -eq 0 ] && ds=(1 2 3 4 5 6 7)
for d in "${ds[@]}"; do
  name="w5ex-$d"
  read -r DUR TEMPO SONG < <(node -e '
    const { chromium } = require("../roviko-launch-film/node_modules/playwright");
    (async () => { const b = await chromium.launch(); const pg = await b.newPage();
      await pg.goto("file://" + require("path").resolve("w5-explain.html") + "?d=" + process.argv[1]); await pg.evaluate(() => window.filmReady);
      console.log((await pg.evaluate("[DURATION, TEMPO, X.song]")).join(" ")); await b.close(); })();' "$d")
  python3 - "$name" "$SONG" "$DUR" "$TEMPO" <<'PY'
import json, sys, math
from pathlib import Path
name, song, dur, tempo = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
START = {'games-worldbeat': 0, 'fun-and-games': 0, 'light-it-up-boy': 16, 'upbeat-jazz': 36, 'mi-gente': 24, 'ko-games': 32, 'funkee-monkeee': 8, 'take-this-higher': 60}
p = Path('build/week_music.json'); m = json.loads(p.read_text()) if p.exists() else {}
m[name] = dict(song=song, end=math.ceil(dur * tempo / 60), fade=1.2, pieces=[(0, START[song], None)])
p.write_text(json.dumps(m, indent=1))
PY
  python3 build/music_cut.py "$name" >/dev/null
  node build/events.mjs w5-explain.html "$name" "d=$d" >/dev/null
  python3 build/mix.py "$name" | tail -1
  node ../roviko-launch-film/build/render.mjs w5-explain.html "out/master-$name.mkv" --dur "$DUR" --w 1080 --h 1920 --sub 2 --query "d=$d" | tail -1
  mkdir -p "../roviko-week5/D$d"
  build/export.sh "out/master-$name.mkv" "audio/$name/mix.wav" "../roviko-week5/D$d/D${d}P3.mp4" | tail -1
  rm -f "out/master-$name.mkv"
  echo "DONE $d"
done
echo ALLDONE
