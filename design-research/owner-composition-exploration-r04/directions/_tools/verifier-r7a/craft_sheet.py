# Verifier's own 3x craft crops: A and B at every stop kind, one sheet per language (tooltip hidden, real page).
# Usage: python craft_sheet.py <geom dir> <out dir> [halfCss=35]
import sys, os, numpy as np
from PIL import Image, ImageDraw
D, OUT = sys.argv[1], sys.argv[2]; H = int(sys.argv[3]) if len(sys.argv) > 3 else 35; S = 3
os.makedirs(OUT, exist_ok=True)
cols = [("live", "h0", "zero (6:00 AM)"), ("live", "h240", "valley 10:00"), ("live", "h660", "slope 5:00 PM"), ("live", "peak", "peak 6:29 PM"),
        ("live", "latest", "latest, live"), ("delayed", "latest", "latest, delayed"), ("live", "gap", "missing span"),
        ("live", "h900", "after now 9 PM"), ("nohistory", "h900", "after now, no history")]
for lang in ("ar", "en"):
    rows = []
    for form in ("a", "b"):
        tiles = []
        for state, stop, cap in cols:
            p = os.path.join(D, "px", f"{form}-{lang}-{state}-{stop}-on.png")
            im = Image.open(p).convert("RGB")
            c = im.width // 2
            t = im.crop((c - H * S, c - H * S, c + H * S, c + H * S))
            d = ImageDraw.Draw(t); d.text((4, 3), f"{form.upper()} {cap}", fill=(255, 235, 0))
            tiles.append(t)
        rows.append(tiles)
    W = H * 2 * S
    sheet = Image.new("RGB", (len(cols) * (W + 3), 2 * (W + 3)), (70, 70, 70))
    for i, r in enumerate(rows):
        for j, t in enumerate(r): sheet.paste(t, (j * (W + 3), i * (W + 3)))
    sheet.save(os.path.join(OUT, f"craft-{lang}-3x.png")); print(sheet.size)
