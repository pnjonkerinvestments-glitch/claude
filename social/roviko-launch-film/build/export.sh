#!/usr/bin/env bash
# Encode a lossless master + the final mix into a delivery MP4 (H.264 High, BT.709, 60 fps, AAC 320k).
#   build/export.sh out/master-16x9.mkv out/roviko-launch-16x9.mp4
set -euo pipefail
master="$1"; dst="$2"
ffmpeg -v error -y -i "$master" -i audio/mix.wav \
  -map 0:v:0 -map 1:a:0 \
  -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf 15 -tune animation -profile:v high -level 4.2 -r 60 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$dst"
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate -of compact "$dst"
