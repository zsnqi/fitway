#!/usr/bin/env bash
# Re-renders the three Eclipse music sketches end to end:
#   1. sketches.py: the WAV masters (48 kHz, 24-bit) and measurements.json in out/music-sketches/ (gitignored)
#   2. ffmpeg: the AAC 192k previews and the 1920x1080 preview film in music-sketches/
#   3. verification: ffmpeg ebur128 (true peak) on every WAV and m4a, earshot measure --music on every WAV
# Usage: bash music-sketches/src/render.sh [--no-verify]
# Environment: CINETIC_PY (python with numpy, scipy, soundfile, pyloudnorm), CINETIC_AUDIO (cinetic's
# scripts/audio), EARSHOT (the earshot CLI). The defaults are this machine's virtualenvs and clone.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKETCHES="$(dirname "$HERE")"
FILM="$(dirname "$SKETCHES")"
OUT="$FILM/out/music-sketches"
PY="${CINETIC_PY:-/home/user/.venvs/cinetic/bin/python}"
export PYTHONDONTWRITEBYTECODE=1
export EARSHOT="${EARSHOT:-/home/user/.venvs/earshot/bin/earshot}"
export CINETIC_AUDIO="${CINETIC_AUDIO:-/home/user/leonxlnx/cinetic/skills/cinetic/scripts/audio}"
FONT="$FILM/vendor/eclipse/fonts/readex-pro-latin.woff2"
[ -f "$FONT" ] || FONT="$(fc-match -f '%{file}' 'Inter:style=Regular' 2>/dev/null || true)"
VERIFY=1
[ "${1:-}" = "--no-verify" ] && VERIFY=0

NAMES=(sketch-1-warm-pulse sketch-2-piano-pulse sketch-3-drive)
TITLES=("1 · Warm pulse" "2 · Piano pulse" "3 · Drive")

echo "== render"
mkdir -p "$OUT/preview"
"$PY" "$HERE/sketches.py" --out "$OUT"

echo "== previews"
for n in "${NAMES[@]}"; do
  ffmpeg -hide_banner -loglevel error -y -i "$OUT/$n.wav" -c:a aac -b:a 192k -movflags +faststart "$SKETCHES/$n.m4a"
done

# The preview film: the three sketches back to back with 1 s of silence between them, on a dark card
# (Eclipse's page colour) with each title in Readex Pro over a red waveform.
DUR=()
for n in "${NAMES[@]}"; do DUR+=("$("$PY" -c "import soundfile as sf; print(sf.info('$OUT/$n.wav').duration)")"); done
A0=0
A1=$("$PY" -c "print(${DUR[0]} + 1)")
A2=$("$PY" -c "print(${DUR[0]} + ${DUR[1]} + 2)")
E0=${DUR[0]}
E1=$("$PY" -c "print($A1 + ${DUR[1]})")
E2=$("$PY" -c "print($A2 + ${DUR[2]})")
for i in 0 1 2; do printf '%s' "${TITLES[$i]}" > "$OUT/preview/title-$i.txt"; done
ffmpeg -hide_banner -loglevel error -y \
  -i "$OUT/${NAMES[0]}.wav" -i "$OUT/${NAMES[1]}.wav" -i "$OUT/${NAMES[2]}.wav" \
  -f lavfi -t 1 -i anullsrc=r=48000:cl=stereo -f lavfi -t 1 -i anullsrc=r=48000:cl=stereo \
  -filter_complex "\
[0:a][3:a][1:a][4:a][2:a]concat=n=5:v=0:a=1[aud];\
[aud]asplit=2[a_out][a_vis];\
[a_vis]aformat=channel_layouts=mono,showwaves=s=1600x300:mode=cline:rate=30:scale=sqrt:colors=0xe51935[wav];\
color=c=0x070707:s=1920x1080:r=30:d=$E2[bg];\
[bg][wav]overlay=x=160:y=600:shortest=1[v0];\
[v0]drawtext=fontfile='$FONT':textfile='$OUT/preview/title-0.txt':fontcolor=0xf5f3f2:fontsize=84:x=(w-text_w)/2:y=400:enable='between(t,$A0,$E0)',\
drawtext=fontfile='$FONT':textfile='$OUT/preview/title-1.txt':fontcolor=0xf5f3f2:fontsize=84:x=(w-text_w)/2:y=400:enable='between(t,$A1,$E1)',\
drawtext=fontfile='$FONT':textfile='$OUT/preview/title-2.txt':fontcolor=0xf5f3f2:fontsize=84:x=(w-text_w)/2:y=400:enable='between(t,$A2,$E2)',\
format=yuv420p[vid]" \
  -map "[vid]" -map "[a_out]" -c:v libx264 -preset slow -crf 20 -profile:v high -r 30 \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart -t "$E2" "$SKETCHES/sketches-preview.mp4"

if [ "$VERIFY" = 1 ]; then
  echo "== verify: ffmpeg ebur128 (integrated, LRA, true peak) on the WAV masters and the AAC previews"
  for n in "${NAMES[@]}"; do
    for f in "$OUT/$n.wav" "$SKETCHES/$n.m4a"; do
      ffmpeg -hide_banner -nostats -i "$f" -af ebur128=peak=true -f null - 2>&1 \
        | awk -v f="$(basename "$f")" '/Integrated loudness/{s=1} s&&/ I:/{i=$2} s&&/ LRA:/{l=$2} s&&/Peak:/{p=$2} END{printf "  %-26s I %s LUFS  LRA %s LU  TP %s dBTP\n", f, i, l, p}'
    done
  done
  echo "== verify: earshot measure --music"
  for n in "${NAMES[@]}"; do
    "$EARSHOT" measure --music --out "$OUT/earshot-$n.json" "$OUT/$n.wav" | sed 's/^/  /'
  done
fi
echo "done: $OUT, $SKETCHES"
