#!/usr/bin/env bash
# encode.sh <frames dir> <out.mp4> [crf|size-MB]  - one H.264 encode of a PNG sequence (f0000.png ...): 1920x1080, 60 fps,
# yuv420p, BT.709 limited range and tagged, +faststart, no audio track. A third argument ending in M (e.g. 19M) aims the
# file at that size with a two-pass encode; otherwise it is a CRF (default 14, the master).
set -euo pipefail
IN="$1"; OUT="$2"; Q="${3:-14}"
COMMON=(-framerate 60 -start_number 0 -i "$IN/f%04d.png" -an -vf "scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p"
  -c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709
  -x264-params "colorprim=bt709:transfer=bt709:colormatrix=bt709" -movflags +faststart -r 60)
if [[ "$Q" == *M ]]; then
  MB="${Q%M}"; N=$(ls "$IN"/f*.png | wc -l); SECS=$(echo "$N / 60" | bc -l)
  KBPS=$(echo "($MB * 8 * 1024 * 0.97) / $SECS" | bc)   # 3% for the container
  LOG="$(mktemp -d)/x264"
  ffmpeg -y -loglevel error "${COMMON[@]}" -b:v "${KBPS}k" -pass 1 -passlogfile "$LOG" -f mp4 /dev/null
  ffmpeg -y -loglevel error "${COMMON[@]}" -b:v "${KBPS}k" -maxrate "$((KBPS * 2))k" -bufsize "$((KBPS * 4))k" -pass 2 -passlogfile "$LOG" "$OUT"
else
  ffmpeg -y -loglevel error "${COMMON[@]}" -crf "$Q" "$OUT"
fi
ls -la "$OUT"
