# Side-by-side: on, off, and an amplified diff, for given geom rows. Usage: python sheet_onoff.py <geom dir> <out.png> key:stop,...
import sys, os, numpy as np
from PIL import Image, ImageDraw
D = sys.argv[1]; out = sys.argv[2]; items = sys.argv[3].split(",")
tiles = []
for it in items:
    key, stop = it.split(":")
    b = os.path.join(D, "px", f"{key}-{stop}")
    on = np.asarray(Image.open(b + "-on.png").convert("RGB")).astype(int); off = np.asarray(Image.open(b + "-off.png").convert("RGB")).astype(int)
    d = np.clip(np.abs(on - off).max(2) * 4, 0, 255).astype(np.uint8)
    row = np.concatenate([on.astype(np.uint8), off.astype(np.uint8), np.stack([d, d, d], 2)], 1)
    im = Image.fromarray(row); ImageDraw.Draw(im).text((4, 4), it, fill=(255, 255, 0)); tiles.append(im)
W = max(t.width for t in tiles); H = sum(t.height + 4 for t in tiles)
sh = Image.new("RGB", (W, H), (60, 60, 60)); y = 0
for t in tiles: sh.paste(t, (0, y)); y += t.height + 4
sh.save(out); print(out, sh.size)
