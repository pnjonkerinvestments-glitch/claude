#!/usr/bin/env bash
# Build the five real-app films: sound cues, mix, render, MP4.   build/viral.sh [n ...]  ->  out/tt/roviko-tiktok-N.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
python3 build/mkshort.py src/tt.js >/dev/null
mkdir -p out/tt
declare -A TEMPO=([1]=124.01 [2]=120.384 [3]=119.998 [4]=110.01 [5]=120.384)
declare -A ENDB=([1]=36 [2]=29 [3]=33 [4]=31 [5]=29)
declare -A CARD=([1]=30.4 [2]=22.6 [3]=26.4 [4]=24.6 [5]=22.6)
ns=("$@"); [ ${#ns[@]} -eq 0 ] && ns=(1 2 3 4 5)
for n in "${ns[@]}"; do
  a="tt-$n"
  DUR=$(python3 -c "print(f'{${ENDB[$n]}*60/${TEMPO[$n]}:.3f}')")
  FAST=$(python3 -c "f=lambda b: round(b*60/${TEMPO[$n]}*60); print(f'{f(${CARD[$n]})}-{f(${CARD[$n]}+1.2)}')")
  python3 build/music_cut.py "$a" >/dev/null
  node build/events.mjs tt.html "$a" "v=$n" >/dev/null
  python3 build/mix.py "$a" | tail -1
  node ../roviko-launch-film/build/render.mjs tt.html "out/master-$a.mkv" --dur "$DUR" --w 1080 --h 1920 --query "v=$n" --sub 6 --fast "$FAST" --fastsub 24 | tail -1
  build/export.sh "out/master-$a.mkv" "audio/$a/mix.wav" "out/tt/roviko-tiktok-$n.mp4" | tail -1
  echo "DONE $a"
done
echo TTDONE
