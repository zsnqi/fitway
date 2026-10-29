#!/usr/bin/env bash
# Re-renders Drive v2 end to end and verifies it, in one command:
#   0. fetch-samples.sh: the CC0 recorded instruments at the pinned commit (verified file by file; downloads only
#      what is missing)
#   1. the original Drive (A), re-rendered by its own code (music-sketches/src/sketches.py, read only) into
#      out/music-v2/original with its stems, and checked bit-identical to the master the user chose
#   2. drive_v2.py: the master and the six stems in out/music-v2 (gitignored), rendered twice and compared by md5
#   3. ffmpeg: drive-v2.m4a (AAC 192 kb/s) and ab-preview.mp4 (A, 1 s of silence, B) in music-v2/
#   4. verification: verify.py (the fixed constraints, the phone, the click detector), ffmpeg ebur128 on the WAVs
#      and the AAC files, and listen.py (earshot: realness per mix and stem, describe, match, critique,
#      measure --music, the sfx click audit) for A and B
# Usage: bash music-v2/src/render.sh [--no-verify]       (--no-verify: steps 0-3 only)
# Environment: CINETIC_PY (python with numpy, scipy, soundfile), EARSHOT_PY (earshot's python), EARSHOT (its CLI),
# CINETIC_AUDIO (cinetic's scripts/audio). The defaults are this machine's virtualenvs and clones.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
V2="$(dirname "$HERE")"
FILM="$(dirname "$V2")"
OUT="$FILM/out/music-v2"
PY="${CINETIC_PY:-/home/user/.venvs/cinetic/bin/python}"
EPY="${EARSHOT_PY:-/home/user/.venvs/earshot/bin/python}"
export EARSHOT="${EARSHOT:-/home/user/.venvs/earshot/bin/earshot}"
export CINETIC_AUDIO="${CINETIC_AUDIO:-/home/user/leonxlnx/cinetic/skills/cinetic/scripts/audio}"
export PYTHONDONTWRITEBYTECODE=1
FONT="$FILM/vendor/eclipse/fonts/readex-pro-latin.woff2"
ORIGINAL_MD5="d3264a3887093bea053eec60e9229bac"   # out/music-sketches/sketch-3-drive.wav, the master the user chose
VERIFY=1
[ "${1:-}" = "--no-verify" ] && VERIFY=0
[ -f "$FONT" ] || { echo "render: missing $FONT (run scripts/fetch-eclipse.sh)" >&2; exit 1; }

echo "== samples"
bash "$HERE/fetch-samples.sh"

echo "== A: the original Drive, by its own code"
mkdir -p "$OUT/original"
"$PY" "$FILM/music-sketches/src/sketches.py" --out "$OUT/original" --only drive --stems > /dev/null
A="$OUT/original/sketch-3-drive.wav"
[ "$(md5sum < "$A" | cut -d' ' -f1)" = "$ORIGINAL_MD5" ] || { echo "render: A is not the chosen master" >&2; exit 1; }
echo "  $A: md5 $ORIGINAL_MD5, as chosen"

echo "== B: Drive v2"
"$PY" -I "$HERE/drive_v2.py" --out "$OUT" --stems | sed 's/^/  /'
B="$OUT/drive-v2.wav"
rm -rf "$OUT/.again"
"$PY" -I "$HERE/drive_v2.py" --out "$OUT/.again" > /dev/null
M1="$(md5sum < "$B" | cut -d' ' -f1)"
M2="$(md5sum < "$OUT/.again/drive-v2.wav" | cut -d' ' -f1)"
rm -rf "$OUT/.again"
[ "$M1" = "$M2" ] || { echo "render: two renders differ ($M1, $M2)" >&2; exit 1; }
echo "  deterministic: two renders, md5 $M1"

echo "== previews"
ffmpeg -hide_banner -loglevel error -y -i "$B" -c:a aac -b:a 192k -movflags +faststart "$V2/drive-v2.m4a"
# the A/B film: A, 1 s of silence, B, on Eclipse's page colour, each title in Readex Pro over a red waveform
DA=$("$PY" -c "import soundfile as sf; print(sf.info('$A').duration)")
DB=$("$PY" -c "import soundfile as sf; print(sf.info('$B').duration)")
B0=$("$PY" -c "print($DA + 1)")
E1=$("$PY" -c "print($B0 + $DB)")
mkdir -p "$OUT/preview"
printf '%s' "A · Drive" > "$OUT/preview/title-a.txt"
printf '%s' "B · Drive v2" > "$OUT/preview/title-b.txt"
ffmpeg -hide_banner -loglevel error -y -i "$A" -f lavfi -t 1 -i anullsrc=r=48000:cl=stereo -i "$B" \
  -filter_complex "\
[0:a][1:a][2:a]concat=n=3:v=0:a=1[aud];\
[aud]asplit=2[a_out][a_vis];\
[a_vis]aformat=channel_layouts=mono,showwaves=s=1600x300:mode=cline:rate=30:scale=sqrt:colors=0xe51935[wav];\
color=c=0x070707:s=1920x1080:r=30:d=$E1[bg];\
[bg][wav]overlay=x=160:y=600:shortest=1[v0];\
[v0]drawtext=fontfile='$FONT':textfile='$OUT/preview/title-a.txt':fontcolor=0xf5f3f2:fontsize=84:x=(w-text_w)/2:y=400:enable='between(t,0,$DA)',\
drawtext=fontfile='$FONT':textfile='$OUT/preview/title-b.txt':fontcolor=0xf5f3f2:fontsize=84:x=(w-text_w)/2:y=400:enable='between(t,$B0,$E1)',\
format=yuv420p[vid]" \
  -map "[vid]" -map "[a_out]" -c:v libx264 -preset slow -crf 20 -profile:v high -r 30 \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart -t "$E1" "$V2/ab-preview.mp4"
echo "  $V2/drive-v2.m4a, $V2/ab-preview.mp4"

if [ "$VERIFY" = 1 ]; then
  echo "== verify: constraints, phone, clicks (verify.py)"
  "$PY" -I "$HERE/verify.py" --a "$A" --b "$B" --m4a "$V2/drive-v2.m4a" \
    --a-m4a "$FILM/music-sketches/sketch-3-drive.m4a" --out "$OUT/verify.json"
  echo "== verify: ffmpeg ebur128 (integrated, LRA, true peak)"
  for f in "$A" "$FILM/music-sketches/sketch-3-drive.m4a" "$B" "$V2/drive-v2.m4a"; do
    ffmpeg -hide_banner -nostats -i "$f" -af ebur128=peak=true -f null - 2>&1 \
      | awk -v f="$(basename "$f")" '/Integrated loudness/{s=1} s&&/ I:/{i=$2} s&&/ LRA:/{l=$2} s&&/Peak:/{p=$2} END{printf "  %-22s I %s LUFS  LRA %s LU  TP %s dBTP\n", f, i, l, p}'
  done
  echo "== verify: earshot (listen.py)"
  mkdir -p "$OUT/listen"
  "$EPY" "$HERE/listen.py" --a "$A" --stems-a "$OUT/original/stems/drive" --b "$B" --stems-b "$OUT/stems" \
    --out "$OUT/listen/earshot.json" 2>&1 | grep -v '^\s*$' | sed 's/^/  /'
fi
echo "done: $OUT, $V2"
