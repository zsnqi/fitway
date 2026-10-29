#!/usr/bin/env python3
"""FITWAY red on screen: the share of pixels that read as the accent (red hue, saturated, bright enough to read as red,
not oxblood), per frame. accent.py <frames dir> <from> <to> [--exclude cx,cy,r] [--every N] [--json out.json]
--exclude leaves out a disc (the construction's red dot, which is the reading, not a stroke)."""
import argparse, json, os
import numpy as np
from PIL import Image
ap = argparse.ArgumentParser(); ap.add_argument('dir'); ap.add_argument('a', type=int); ap.add_argument('b', type=int)
ap.add_argument('--exclude', default=None); ap.add_argument('--every', type=int, default=1); ap.add_argument('--json', default=None)
a = ap.parse_args()
rows = []
for f in range(a.a, a.b + 1, a.every):
    p = os.path.join(a.dir, f'f{f:04d}.png')
    if not os.path.exists(p): continue
    im = np.asarray(Image.open(p).convert('RGB')).astype(np.int16)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    red = (r > 140) & (r - g > 90) & (r - b > 70)
    if a.exclude:
        cx, cy, rr = map(float, a.exclude.split(','))
        yy, xx = np.mgrid[0:im.shape[0], 0:im.shape[1]]
        red &= (xx - cx) ** 2 + (yy - cy) ** 2 > (rr + 3) ** 2
    rows.append({'f': f, 'red_pct': round(100 * red.mean(), 3), 'red_px': int(red.sum())})
for x in rows: print(f"f{x['f']}: {x['red_pct']:.3f}% ({x['red_px']} px)")
if a.json: json.dump(rows, open(a.json, 'w'), indent=1)
