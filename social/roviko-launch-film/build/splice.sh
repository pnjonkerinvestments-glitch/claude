#!/bin/sh
# Replace frames [A, B) of a lossless master with a re-rendered patch of the same frames, losslessly.
# Frames are picked by index and renumbered (no timestamp maths, so no dropped or doubled frames).
#   build/splice.sh out/master-16x9.mkv out/patch-16x9.mkv 1400 1525
set -e
M=$1; P=$2; A=$3; B=$4
ffmpeg -v error -y -i "$M" -i "$P" -filter_complex \
  "[0]select='lt(n\,$A)',setpts=N[a];[1]setpts=N[b];[0]select='gte(n\,$B)',setpts=N[c];[a][b][c]concat=n=3:v=1,setpts=N/(60*TB)[v]" \
  -map '[v]' -fps_mode passthrough -c:v ffv1 -level 3 "$M.spliced.mkv"
mv "$M.spliced.mkv" "$M"
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$M"
