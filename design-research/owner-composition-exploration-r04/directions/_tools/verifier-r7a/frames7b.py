# Tight strips of the frames where the marker region changes (one frame either side), 2x, per recording and action.
# Usage: python frames7b.py <video dir> <geom.json>
import cv2, numpy as np, json, sys, os
from PIL import Image, ImageDraw
D = sys.argv[1]; G = json.load(open(sys.argv[2]))
log = json.load(open(f"{D}/video-log.json"))
os.makedirs(f"{D}/tight", exist_ok=True)
def load(name):
    cap = cv2.VideoCapture(f"{D}/{name}.webm"); fr = []
    while True:
        ok, f = cap.read()
        if not ok: break
        fr.append(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    return fr
rep = {}
for name, v in log.items():
    fr = load(name)
    parts = name.split("-"); lang, form = parts[-2], parts[-1]
    rows = {r["key"]: r for r in G[f"{form}-{lang}-live"]["rows"]}
    P = lambda k: (rows[k]["svgLeft"] + rows[k]["x"], rows[k]["svgTop"] + rows[k]["y"])
    pts = [P(k) for k in ("h660", "h690", "peak", "h780", "h810", "latest")]
    x0, x1 = int(min(p[0] for p in pts) - 26), int(max(p[0] for p in pts) + 26)
    y0, y1 = int(min(p[1] for p in pts) - 22), int(max(p[1] for p in pts) + 40)
    reg = (x0, y0, x1, y1)
    marks = v["marks"]
    for j, m in enumerate(marks):
        if m["label"] in ("loaded", "gap", "ahead", "leave"): continue
        i0 = int(m["ms"] / 40) - 1
        i1 = int(marks[j + 1]["ms"] / 40) + 2 if j + 1 < len(marks) else min(len(fr), i0 + 34)
        act = [i for i in range(max(1, i0), min(len(fr), i1)) if np.abs(fr[i][y0:y1, x0:x1].astype(int) - fr[i - 1][y0:y1, x0:x1].astype(int)).max() > 12]
        keep = sorted(set([i0] + act + [i + 1 for i in act if i + 1 < len(fr)]))
        if name.startswith("slow"): keep = keep[:24]
        else: keep = keep[:48]
        tiles = []
        for i in keep:
            t = Image.fromarray(fr[i][y0:y1, x0:x1]); t = t.resize((t.width * 2, t.height * 2), Image.NEAREST)
            ImageDraw.Draw(t).text((3, 2), f"{i}", fill=(255, 255, 0)); tiles.append(t)
        cols = 8
        W, H = tiles[0].size; nr = (len(tiles) + cols - 1) // cols
        sh = Image.new("RGB", (cols * (W + 2), nr * (H + 2)), (70, 70, 70))
        for k, t in enumerate(tiles): sh.paste(t, ((k % cols) * (W + 2), (k // cols) * (H + 2)))
        out = f"{D}/tight/{name}-{j:02d}-{m['label']}.png"; sh.save(out)
        rep[f"{name}-{m['label']}{j}"] = {"frames": keep, "activeCount": len(act), "size": sh.size}
json.dump(rep, open(f"{D}/tight-report.json", "w"), indent=1)
for k, v in rep.items(): print(k, v["activeCount"], v["size"], v["frames"][:30])
