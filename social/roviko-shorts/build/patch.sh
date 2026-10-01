#!/usr/bin/env bash
# Re-render frames [A, B) of a short at 32 subframes and splice them into its master, then re-export the MP4.
#   build/patch.sh <name> <file> <dur> A B      e.g. build/patch.sh greenland 4-greenland 15.000 576 592
set -euo pipefail
cd "$(dirname "$0")/.."
n=$1; f=$2; dur=$3; A=$4; B=$5
node ../roviko-launch-film/build/render.mjs "short-$f.html" "out/patch-$f.mkv" --dur "$dur" --w 1080 --h 1920 --from "$A" --to "$B" --sub 32 | tail -1
../roviko-launch-film/build/splice.sh "out/master-$f.mkv" "out/patch-$f.mkv" "$A" "$B"
rm -f "out/patch-$f.mkv"
build/export.sh "out/master-$f.mkv" "audio/$n/mix.wav" "out/roviko-short-$f.mp4" | tail -1
