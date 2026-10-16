#!/usr/bin/env bash
# Build the trend videos: page from src/tr-*.js, sound cues, mix, render, MP4.   build/trends.sh [italy trend forest size score]
set -euo pipefail
cd "$(dirname "$0")/.."
names=("$@"); [ ${#names[@]} -eq 0 ] && names=(italy trend forest size score)
for n in "${names[@]}"; do
  python3 build/mkshort.py "src/tr-$n.js" >/dev/null
  read -r DUR FAST < <(node -e '
    const s = require("fs").readFileSync(process.argv[1], "utf8");
    const tempo = +s.match(/const TEMPO = ([\d.]+)/)[1], end = +s.match(/END = (\d+)/)[1], e = +s.match(/end: ([\d.]+)/)[1];
    const f = b => Math.round(b * 60 / tempo * 60);
    console.log((end * 60 / tempo).toFixed(3), `${f(e)}-${f(e + 1.2)}`);' "src/tr-$n.js")
  python3 build/music_cut.py "tr-$n" >/dev/null
  node build/events.mjs "tr-$n.html" "tr-$n" >/dev/null
  python3 build/mix.py "tr-$n" | tail -1
  node ../roviko-launch-film/build/render.mjs "tr-$n.html" "out/master-tr-$n.mkv" --dur "$DUR" --w 1080 --h 1920 --fast "$FAST" --fastsub 32 | tail -1
  mkdir -p out/trends
  build/export.sh "out/master-tr-$n.mkv" "audio/tr-$n/mix.wav" "out/trends/roviko-trend-$n.mp4" | tail -1
  echo "DONE $n"
done
echo ALLDONE
