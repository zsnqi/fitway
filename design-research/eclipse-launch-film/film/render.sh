#!/usr/bin/env bash
# render.sh: the whole silent film from source, in one command (about 40-60 min on 4 CPUs).
#   bash render.sh            setup -> device textures -> every frame (motion blur where blur.json says) -> encodes ->
#                             probe -> contact sheet
#   WORKERS=3 bash render.sh  parallel browser workers (default 3)
# Needs: Eclipse in ../vendor/eclipse (../scripts/fetch-eclipse.sh), npm, ffmpeg, the Playwright Chromium, and the cinetic
# venv for Python (/home/user/.venvs/cinetic, ../scripts/setup-tools.sh). Big files stay in ../out/film/ (gitignored):
#   ../out/film/frames/f0000.png...      the frames
#   ../out/film/eclipse-silent-master.mp4  CRF 14 master
#   eclipse-silent-v1.mp4                the delivery (two-pass, about 19 MB), contact-sheet.png
set -euo pipefail
cd "$(dirname "$0")"
PY="${CINETIC_PY:-/home/user/.venvs/cinetic/bin/python}"
OUT=../out/film
[ -d node_modules ] || npm install --no-audit --no-fund
node setup.mjs > /dev/null
node tools/textures.mjs
node tools/render.mjs --all --out "$OUT/frames" --workers "${WORKERS:-3}" --blur auto
bash tools/encode.sh "$OUT/frames" "$OUT/eclipse-silent-master.mp4" 14
bash tools/encode.sh "$OUT/frames" eclipse-silent-v1.mp4 19M
"$PY" scripts/probe.py eclipse-silent-v1.mp4 --spec 1920x1080@60 --dur 32 --audio none --max-mb 20
"$PY" tools/sheet.py "$OUT/frames" contact-sheet.png --frames "$(node tools/keyframes.mjs)" --labels tools/keyframes.json --cols 6 --width 520 \
  --title "Eclipse launch film · Station 2, silent motion · 1920x1080 at 60 fps, 128 BPM, 32.0 s"
echo "render.sh: done"
