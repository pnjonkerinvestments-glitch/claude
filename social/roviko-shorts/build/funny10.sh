#!/usr/bin/env bash
# Build shorts 11-20: page from src/, sound cues, mix, render, MP4.   build/funny10.sh [name ...]
set -euo pipefail
cd "$(dirname "$0")/.."
declare -A FILE=([groupchat]=11-groupchat [nolabels]=12-nolabels [italy]=13-italy [twinflags]=14-twinflags [memory]=15-memory [bigger]=16-bigger [africa]=17-africa [pronounce]=18-pronounce [onegame]=19-onegame [illegal]=20-illegal)
names=("$@"); [ ${#names[@]} -eq 0 ] && names=(groupchat nolabels italy twinflags memory bigger africa pronounce onegame illegal)
for n in "${names[@]}"; do
  f=${FILE[$n]}
  python3 build/mkshort.py "src/short-$f.js" >/dev/null
  # duration and the end-card flood (rendered at 32 subframes) from the page's own constants
  read -r DUR FAST < <(node -e '
    const s = require("fs").readFileSync(process.argv[1], "utf8");
    const tempo = +s.match(/const TEMPO = ([\d.]+)/)[1], end = +s.match(/END = (\d+)/)[1], e = +s.match(/end: ([\d.]+)/)[1];
    const f = b => Math.round(b * 60 / tempo * 60);
    console.log((end * 60 / tempo).toFixed(3), `${f(e)}-${f(e + 1.2)}`);' "src/short-$f.js")
  python3 build/music_cut.py "$n" >/dev/null
  node build/events.mjs "short-$f.html" "$n" >/dev/null
  python3 build/mix.py "$n" | tail -1
  node ../roviko-launch-film/build/render.mjs "short-$f.html" "out/master-$f.mkv" --dur "$DUR" --w 1080 --h 1920 --fast "$FAST" --fastsub 32 | tail -1
  build/export.sh "out/master-$f.mkv" "audio/$n/mix.wav" "out/roviko-short-$f.mp4" | tail -1
  echo "DONE $n"
done
echo ALLDONE
