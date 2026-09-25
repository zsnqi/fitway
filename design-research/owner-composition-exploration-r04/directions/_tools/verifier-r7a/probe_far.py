# Where are the on/off differences far from the marker centre? (diagnostic for geom_px)
import json, sys, os, numpy as np
from PIL import Image
D = sys.argv[1]; S = 3
G = json.load(open(os.path.join(D, "geom.json")))
for key in sys.argv[2].split(","):
    for r in G[key]["rows"]:
        if r.get("form") not in ("line", "peak"): continue
        base = os.path.join(D, "px", f"{key}-{r['key']}")
        on = np.asarray(Image.open(base + "-on.png").convert("RGB")).astype(int); off = np.asarray(Image.open(base + "-off.png").convert("RGB")).astype(int)
        d = np.abs(on - off).max(2)
        ys, xs = np.nonzero(d > 10)
        cx, cy = (r["x"] + r["svgLeft"] - r["clip"]["x"]) * S, (r["y"] + r["svgTop"] - r["clip"]["y"]) * S
        dist = np.hypot(xs + 0.5 - cx, ys + 0.5 - cy) / S
        far = dist > 16
        if far.any():
            below = (ys[far] + 0.5 - cy) / S
            print(key, r["key"], "far px", int(far.sum()), "max dist", round(float(dist.max()), 1), "dy range", round(float(below.min()), 1), round(float(below.max()), 1), "dx range", round(float(((xs[far] + 0.5 - cx) / S).min()), 1), round(float(((xs[far] + 0.5 - cx) / S).max()), 1), "max diff", int(d[ys[far], xs[far]].max()))
