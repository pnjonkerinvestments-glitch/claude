#!/usr/bin/env bash
# Build shorts 4-10: sound cues, mix, render, MP4.   build/funny7.sh [name ...]
set -euo pipefail
cd "$(dirname "$0")/.."
declare -A FILE=([greenland]=4-greenland [wronganswers]=5-wronganswers [austria]=6-austria [stages]=7-stages [moon]=8-moon [lobby]=9-lobby [uk]=10-uk)
declare -A DUR=([greenland]=15.000 [wronganswers]=13.955 [austria]=14.180 [stages]=16.946 [moon]=13.090 [lobby]=20.000 [uk]=14.952)
declare -A FAST=([greenland]=688-705 [wronganswers]=655-672 [austria]=685-702 [stages]=895-912 [moon]=554-570 [lobby]=1018-1035 [uk]=716-733)
names=("$@"); [ ${#names[@]} -eq 0 ] && names=(greenland wronganswers austria stages moon lobby uk)
for n in "${names[@]}"; do
  f=${FILE[$n]}
  python3 build/music_cut.py "$n" >/dev/null
  node build/events.mjs "short-$f.html" "$n" >/dev/null
  python3 build/mix.py "$n" | tail -1
  node ../roviko-launch-film/build/render.mjs "short-$f.html" "out/master-$f.mkv" --dur "${DUR[$n]}" --w 1080 --h 1920 --fast "${FAST[$n]}" --fastsub 32 | tail -1
  build/export.sh "out/master-$f.mkv" "audio/$n/mix.wav" "out/roviko-short-$f.mp4" | tail -1
  echo "DONE $n"
done
echo ALLDONE
