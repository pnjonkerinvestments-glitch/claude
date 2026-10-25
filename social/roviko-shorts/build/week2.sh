#!/usr/bin/env bash
# Build the content-week-2 reels (26 Oct - 1 Nov 2026): page, song cut, sound cues, mix, render, MP4.
#   build/week2.sh [D1P3 D1P4 ...]   ->  ../roviko-week2/D<n>/<id>.mp4   (P3 flag twins, P4 3 facts, P5 map facts; D6P5 is a carousel)
set -euo pipefail
cd "$(dirname "$0")/.."
declare -A PAGE=( [P3]=w2-flag [P4]=w2-clue [P5]=w2-map )
ALL=(); for d in 1 2 3 4 5 6 7; do ALL+=(D${d}P3 D${d}P4); [ "$d" != 6 ] && ALL+=(D${d}P5); done
ids=("$@"); [ ${#ids[@]} -eq 0 ] && ids=("${ALL[@]}")
for f in w2-flag w2-clue w2-map; do python3 build/mkshort.py "src/$f.js" >/dev/null; done
for id in "${ids[@]}"; do
  d=${id:1:1}; p=${id:2:2}; page="${PAGE[$p]}.html"; name="w2-$id"
  read -r DUR TEMPO SONG < <(node -e '
    const { chromium } = require("../roviko-launch-film/node_modules/playwright");
    (async () => { const b = await chromium.launch(); const pg = await b.newPage();
      await pg.goto("file://" + require("path").resolve(process.argv[1]) + "?d=" + process.argv[2]); await pg.evaluate(() => window.filmReady);
      const r = await pg.evaluate("[DURATION, TEMPO, DAY.song]"); console.log(r.join(" ")); await b.close(); })();' "$page" "$d")
  python3 - "$name" "$SONG" "$DUR" "$TEMPO" <<'PY'
import json, sys, math
from pathlib import Path
name, song, dur, tempo = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
START = {'games-worldbeat': 0, 'bob': 16, 'fun-and-games': 0, 'light-it-up-boy': 16, 'keeping-fit': 4, 'upbeat-jazz': 36, 'mi-gente': 24, 'ko-games': 32}
p = Path('build/week_music.json'); m = json.loads(p.read_text()) if p.exists() else {}
m[name] = dict(song=song, end=math.ceil(dur * tempo / 60), fade=0.8, pieces=[(0, START[song], None)])
p.write_text(json.dumps(m, indent=1))
PY
  python3 build/music_cut.py "$name" >/dev/null
  node build/events.mjs "$page" "$name" "d=$d" >/dev/null
  python3 build/mix.py "$name" | tail -1
  node ../roviko-launch-film/build/render.mjs "$page" "out/master-$name.mkv" --dur "$DUR" --w 1080 --h 1920 --sub 3 --query "d=$d" | tail -1
  mkdir -p "../roviko-week2/D$d"
  build/export.sh "out/master-$name.mkv" "audio/$name/mix.wav" "../roviko-week2/D$d/$id.mp4" | tail -1
  rm -f "out/master-$name.mkv"
  echo "DONE $id"
done
echo ALLDONE
