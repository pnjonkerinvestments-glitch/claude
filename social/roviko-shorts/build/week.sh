#!/usr/bin/env bash
# Build the content-week reels (19-25 Oct 2026): page, song cut, sound cues, mix, render, MP4 + cover.
#   build/week.sh [D1P1 D1P2 ...]   ->  ../roviko-week/D<n>/<id>.mp4 and <id>-cover.jpg
set -euo pipefail
cd "$(dirname "$0")/.."
declare -A PAGE=( [P1]=wk-country [P2]=wk-flag [P3]=wk-chal [P4]=wk-comm )
ALL=(); for d in 1 2 3 4 5 6 7; do ALL+=(D${d}P1 D${d}P3); [ "$d" != 6 ] && ALL+=(D${d}P2); [[ "$d" =~ ^[246]$ ]] && ALL+=(D${d}P4); done
ids=("$@"); [ ${#ids[@]} -eq 0 ] && ids=("${ALL[@]}")
for f in wk-country wk-flag wk-chal wk-comm; do python3 build/mkshort.py "src/$f.js" >/dev/null; done
for id in "${ids[@]}"; do
  d=${id:1:1}; p=${id:2:2}; page="${PAGE[$p]}.html"; name="wk-$id"
  # length, tempo and song from the page itself
  read -r DUR TEMPO SONG < <(node -e '
    const { chromium } = require("../roviko-launch-film/node_modules/playwright");
    (async () => { const b = await chromium.launch(); const pg = await b.newPage();
      await pg.goto("file://" + require("path").resolve(process.argv[1]) + "?d=" + process.argv[2]); await pg.evaluate(() => window.filmReady);
      const r = await pg.evaluate("[DURATION, TEMPO, (typeof DAY !== \"undefined\" && DAY.song) || SONG[0]]"); console.log(r.join(" ")); await b.close(); })();' "$page" "$d")
  python3 - "$name" "$SONG" "$DUR" "$TEMPO" <<'PY'
import json, sys, math
from pathlib import Path
name, song, dur, tempo = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
START = {'games-worldbeat': 0, 'bob': 16, 'fun-and-games': 0, 'light-it-up-boy': 16, 'keeping-fit': 4, 'upbeat-jazz': 36, 'mi-gente': 24, 'ko-games': 32, 'take-this-higher': 38}
p = Path('build/week_music.json'); m = json.loads(p.read_text()) if p.exists() else {}
m[name] = dict(song=song, end=math.ceil(dur * tempo / 60), fade=0.8, pieces=[(0, START[song], None)])
p.write_text(json.dumps(m, indent=1))
PY
  python3 build/music_cut.py "$name" >/dev/null
  node build/events.mjs "$page" "$name" "d=$d" >/dev/null
  python3 build/mix.py "$name" | tail -1
  node ../roviko-launch-film/build/render.mjs "$page" "out/master-$name.mkv" --dur "$DUR" --w 1080 --h 1920 --sub 3 --query "d=$d" | tail -1
  mkdir -p "../roviko-week/D$d"
  build/export.sh "out/master-$name.mkv" "audio/$name/mix.wav" "../roviko-week/D$d/$id.mp4" | tail -1
  rm -f "out/master-$name.mkv"
  echo "DONE $id"
done
echo ALLDONE
