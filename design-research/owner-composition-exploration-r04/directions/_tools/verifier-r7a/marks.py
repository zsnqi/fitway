# Strips cut at each recorded action: frames from the action's time (ms/40) for N frames, for a region.
import cv2, numpy as np, json, sys, os
from PIL import Image, ImageDraw
D = sys.argv[1]; name = sys.argv[2]; region = sys.argv[3]; n = int(sys.argv[4]); scale = float(sys.argv[5]); labels = sys.argv[6].split(",") if len(sys.argv) > 6 and sys.argv[6] != "-" else None; stride = int(sys.argv[7]) if len(sys.argv) > 7 else 1
log = json.load(open(f"{D}/video-log.json"))[name]
cap = cv2.VideoCapture(f"{D}/{name}.webm"); fr = []
while True:
    ok, f = cap.read()
    if not ok: break
    fr.append(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
B = log["boxes"]
def reg(r):
    if r in B: b = B[r]; return (b["x"] - 24, b["y"] - 14, b["x"] + b["w"] + 24, b["y"] + b["h"] + 14)
    return tuple(int(v) for v in r.split(":"))
x0, y0, x1, y1 = reg(region)
x0, y0 = max(0, x0), max(0, y0)
rows = []
for m in log["marks"]:
    if labels and m["label"] not in labels: continue
    i0 = int(m["ms"] / 40) - 1
    tiles = []
    for i in range(i0, min(len(fr), i0 + n), stride):
        t = Image.fromarray(fr[i][y0:y1, x0:x1]); t = t.resize((int(t.width * scale), int(t.height * scale)), Image.NEAREST if scale >= 1 else Image.LANCZOS)
        ImageDraw.Draw(t).text((3, 2), f"{m['label']} {i}", fill=(255, 255, 0)); tiles.append(t)
    rows.append(tiles)
W, H = rows[0][0].width, rows[0][0].height
sheet = Image.new("RGB", (max(len(r) for r in rows) * (W + 2), len(rows) * (H + 2)), (70, 70, 70))
for k, r in enumerate(rows):
    for j, t in enumerate(r): sheet.paste(t, (j * (W + 2), k * (H + 2)))
out = f"{D}/strips/m-{name}-{region.replace(':', '_')}.png"; sheet.save(out); print(out, sheet.size, len(fr))
