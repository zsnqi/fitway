# Rendered colours of the marker parts (3x clips): core, rim, glow ring samples, and the line far from the marker,
# with hue in degrees (FITWAY red #ff2946 is hue ~351).
import json, sys, os, colorsys, numpy as np
from PIL import Image
D = sys.argv[1]; S = 3
G = json.load(open(os.path.join(D, "geom.json")))
def hue(rgb):
    h, l, s = colorsys.rgb_to_hls(*(c / 255 for c in rgb)); return round(h * 360, 1), round(s, 2), round(l, 2)
out = {}
for key in ("a-ar-live", "b-ar-live"):
    rows = {r["key"]: r for r in G[key]["rows"]}
    for stop in ("h660", "h240", "peak", "latest"):
        r = rows[stop]
        on = np.asarray(Image.open(os.path.join(D, "px", f"{key}-{stop}-on.png")).convert("RGB")).astype(int)
        off = np.asarray(Image.open(os.path.join(D, "px", f"{key}-{stop}-off.png")).convert("RGB")).astype(int)
        cx = (r["x"] + r["svgLeft"] - r["clip"]["x"]) * S; cy = (r["y"] + r["svgTop"] - r["clip"]["y"]) * S
        def at(dx, dy, img=on): return [int(c) for c in img[int(round(cy + dy * S)), int(round(cx + dx * S))]]
        # radial profile straight up (no line there for most stops): 0..16 css px
        prof = [(d, at(0, -d), hue(at(0, -d))) for d in (0, 2, 3.5, 4.5, 5, 6, 6.5, 7, 8, 9, 10, 12, 14, 16)]
        out[f"{key}:{stop}"] = {"profileUp": prof, "offUp": [(d, at(0, -d, off)) for d in (0, 6, 10, 14)]}
json.dump(out, open(os.path.join(D, "colors.json"), "w"), indent=1)
for k, v in out.items():
    print(k); print("   on up:", "; ".join(f"{d}:{c}h{h[0]}" for d, c, h in v["profileUp"])); print("   off up:", v["offUp"])
