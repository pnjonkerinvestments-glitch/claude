#!/usr/bin/env bash
# Build "Sounds fake, but it's true": per video the sound cues, the mix, the render and the MP4.
#   build/funfacts.sh [first] [last]   ->  out/fun-facts/fun-fact-1.mp4 ...
set -euo pipefail
cd "$(dirname "$0")/.."
python3 build/music_cut.py funfact >/dev/null
mkdir -p out/fun-facts
FAST=316-330,357-371,420-440,474-500,748-770,925-940,1000-1032
for n in $(seq "${1:-1}" "${2:-5}"); do
  a="fact-$n"
  mkdir -p "audio/$a"
  ln -sf ../funfact/music.wav "audio/$a/music.wav"
  node build/events.mjs fun-fact.html "$a" "n=$n" >/dev/null
  python3 build/mix.py "$a" | tail -1
  node ../roviko-launch-film/build/render.mjs fun-fact.html "out/master-$a.mkv" --dur 19.634 --w 1080 --h 1920 --query "n=$n" --fast $FAST --fastsub 32 | tail -1
  build/export.sh "out/master-$a.mkv" "audio/$a/mix.wav" "out/fun-facts/fun-fact-$n.mp4" | tail -1
  echo "DONE $a"
done
echo SERIESDONE
