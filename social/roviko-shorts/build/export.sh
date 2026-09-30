#!/usr/bin/env bash
# Encode a lossless master + its mix into a delivery MP4 for TikTok / Reels (H.264 High, BT.709, 60 fps, AAC 320k).
#   build/export.sh out/master-1-sydney.mkv audio/sydney/mix.wav out/roviko-short-1-sydney.mp4
set -euo pipefail
master="$1"; mix="$2"; dst="$3"
ffmpeg -v error -y -i "$master" -i "$mix" \
  -map 0:v:0 -map 1:a:0 \
  -vf "setpts=N/(60*TB),scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" -fps_mode passthrough \
  -c:v libx264 -preset slow -crf 16 -tune animation -profile:v high -level 4.2 -video_track_timescale 60000 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$dst"
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height -of compact "$dst"
