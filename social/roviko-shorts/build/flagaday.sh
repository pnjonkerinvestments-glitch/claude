#!/usr/bin/env bash
# Build the whole "Flag a Day" series: per day the sound cues, the mix, the render and the MP4.
#   build/flagaday.sh [first] [last]   ->  out/flag-a-day/flag-a-day-01.mp4 ...
set -euo pipefail
cd "$(dirname "$0")/.."
python3 build/music_cut.py flagaday >/dev/null
mkdir -p out/flag-a-day
for d in $(seq "${1:-1}" "${2:-30}"); do
  n=$(printf 'flag-%02d' "$d")
  mkdir -p "audio/$n"
  ln -sf ../flagaday/music.wav "audio/$n/music.wav"
  node build/events.mjs flag-a-day.html "$n" "day=$d" >/dev/null
  python3 build/mix.py "$n" | tail -1
  node ../roviko-launch-film/build/render.mjs flag-a-day.html "out/$n.mkv" --dur 7.257 --w 1080 --h 1920 --query "day=$d" --fast 200-216,288-312 --fastsub 32 | tail -1
  build/export.sh "out/$n.mkv" "audio/$n/mix.wav" "out/flag-a-day/flag-a-day-$(printf '%02d' "$d").mp4" | tail -1
  rm -f "out/$n.mkv"
done
echo SERIESDONE
