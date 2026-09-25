# Decode the verifier's recordings and cut strips per recorded action over a region around the marker's path.
# Usage: python frames7.py <video dir> <geom.json>
import cv2, numpy as np, json, sys, os
from PIL import Image, ImageDraw
D = sys.argv[1]; G = json.load(open(sys.argv[2]))
log = json.load(open(f"{D}/video-log.json"))
os.makedirs(f"{D}/strips", exist_ok=True)
def load(name):
    cap = cv2.VideoCapture(f"{D}/{name}.webm"); fps = cap.get(cv2.CAP_PROP_FPS); fr = []
    while True:
        ok, f = cap.read()
        if not ok: break
        fr.append(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    return fps, fr
def region(lang, form, keys, pad=34):
    rows = {r["key"]: r for r in G[f"{form}-{lang}-live"]["rows"]}
    xs = [rows[k]["svgLeft"] + (rows[k]["x"] if rows[k].get("x") is not None else 0) for k in keys]
    ys = [rows[k]["svgTop"] + rows[k]["y"] for k in keys if rows[k].get("y") is not None]
    ax = rows[keys[0]]["svgTop"] + rows[keys[0]]["axisY"]
    return int(min(xs) - pad), int(min(ys) - pad - 40), int(max(xs) + pad), int(ax + 8)
def strip(fr, idx, reg, scale, path, cols, labels):
    x0, y0, x1, y1 = reg; tiles = []
    for i in idx:
        if i >= len(fr): break
        t = Image.fromarray(fr[i][y0:y1, x0:x1]); t = t.resize((int(t.width * scale), int(t.height * scale)), Image.LANCZOS if scale < 1 else Image.NEAREST)
        ImageDraw.Draw(t).text((3, 2), f"{labels} {i}", fill=(255, 255, 0)); tiles.append(t)
    W, H = tiles[0].size; rows = (len(tiles) + cols - 1) // cols
    sh = Image.new("RGB", (cols * (W + 2), rows * (H + 2)), (70, 70, 70))
    for k, t in enumerate(tiles): sh.paste(t, ((k % cols) * (W + 2), (k // cols) * (H + 2)))
    sh.save(path); return sh.size
rep = {}
for name, v in log.items():
    fps, fr = load(name)
    parts = name.split("-"); lang = parts[-2]; form = parts[-1]
    reg = region(lang, form, ["h660", "h690", "peak", "h780", "h810", "latest"])
    marks = v["marks"]; rep[name] = {"fps": fps, "frames": len(fr), "region": reg}
    for j, m in enumerate(marks):
        if m["label"] == "loaded": continue
        i0 = int(m["ms"] / 40) - 1
        i1 = int(marks[j + 1]["ms"] / 40) + 2 if j + 1 < len(marks) else min(len(fr), i0 + 40)
        if name.startswith("slow"):
            idx = list(range(i0, min(i1, i0 + 32), 2)); cols = 8; sc = 1.0
        elif m["label"] == "jumps":
            idx = list(range(i0, min(i1, i0 + 60))); cols = 12; sc = 0.75
        else:
            idx = list(range(i0, min(i1, i0 + 36))); cols = 12; sc = 0.75
        r = reg
        if m["label"] in ("gap", "ahead", "leave"):
            rows = {q["key"]: q for q in G[f"{form}-{lang}-live"]["rows"]}
            xs = [rows[k]["svgLeft"] + rows[k]["x"] for k in ("h480", "gap", "h540")] + [rows[k]["svgLeft"] + rows[k]["x"] for k in ("h810", "latest", "h840", "h900")]
            r = (int(min(xs) - 30), reg[1] - 60, int(max(xs) + 30), reg[3])
            sc = 0.5
        out = f"{D}/strips/{name}-{j:02d}-{m['label']}.png"
        rep[name][m["label"] + str(j)] = {"from": i0, "to": idx[-1] if idx else None, "size": strip(fr, idx, r, sc, out, cols, m["label"])}
json.dump(rep, open(f"{D}/frames-report.json", "w"), indent=1)
print(json.dumps(rep)[:3000])
