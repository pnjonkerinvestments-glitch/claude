#!/usr/bin/env bash
# Build the five real-app films: sound cues, mix, render, MP4.   build/viral.sh [n ...]  ->  out/viral/roviko-real-N.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
python3 build/mkshort.py src/viral.js >/dev/null
mkdir -p out/viral
declare -A TEMPO=([1]=124.01 [2]=120.384 [3]=119.998 [4]=110.01 [5]=120.384)
declare -A ENDB=([1]=34 [2]=28 [3]=30 [4]=26 [5]=24)
declare -A CARD=([1]=28.4 [2]=21 [3]=23.6 [4]=18.6 [5]=16.6)
ns=("$@"); [ ${#ns[@]} -eq 0 ] && ns=(1 2 3 4 5)
for n in "${ns[@]}"; do
  a="viral-$n"
  DUR=$(python3 -c "print(f'{${ENDB[$n]}*60/${TEMPO[$n]}:.3f}')")
  FAST=$(python3 -c "f=lambda b: round(b*60/${TEMPO[$n]}*60); print(f'{f(${CARD[$n]})}-{f(${CARD[$n]}+1.2)}')")
  python3 build/music_cut.py "$a" >/dev/null
  node build/events.mjs viral.html "$a" "v=$n" >/dev/null
  python3 build/mix.py "$a" | tail -1
  node ../roviko-launch-film/build/render.mjs viral.html "out/master-$a.mkv" --dur "$DUR" --w 1080 --h 1920 --query "v=$n" --sub 6 --fast "$FAST" --fastsub 24 | tail -1
  build/export.sh "out/master-$a.mkv" "audio/$a/mix.wav" "out/viral/roviko-real-$n.mp4" | tail -1
  echo "DONE $a"
done
echo VIRALDONE
