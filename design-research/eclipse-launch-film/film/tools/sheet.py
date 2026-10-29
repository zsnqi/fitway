#!/usr/bin/env python3
"""Contact sheet of rendered frames, each labelled with its shot, frame, time and bar.beat (128 BPM).

    python tools/sheet.py <frames dir> <out.png> [--frames 0,225,...] [--cols 4] [--width 640] [--title "..."]
    [--labels labels.json]   optional {frame: "shot: what"} for the captions
Frames are read as <dir>/f0000.png. Needs Pillow and fontTools (the cinetic venv has both).
"""
import argparse, json, os, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ap = argparse.ArgumentParser()
ap.add_argument('dir'); ap.add_argument('out')
ap.add_argument('--frames', default=None); ap.add_argument('--cols', type=int, default=4)
ap.add_argument('--width', type=int, default=640); ap.add_argument('--title', default='')
ap.add_argument('--labels', default=None)
a = ap.parse_args()

def font(size):
    ttf = os.path.join(ROOT, 'build', 'readex.ttf')
    if not os.path.exists(ttf):
        from fontTools.ttLib import TTFont
        f = TTFont(os.path.join(ROOT, 'fonts', 'readex-pro-latin.woff2')); f.flavor = None; f.save(ttf)
    from PIL import ImageFont
    fnt = ImageFont.truetype(ttf, size)
    try: fnt.set_variation_by_axes([500])
    except Exception: pass
    return fnt

ACTS = [('hook', 0), ('drop', 225), ('insert', 281), ('landing', 337), ('fill', 675), ('busiest', 900), ('montage', 1125),
        ('switch', 1237), ('devices', 1350), ('construct', 1575), ('lockup', 1687)]
def act_of(f):
    name = ACTS[0][0]
    for n, s in ACTS:
        if f >= s: name = n
    return name
def barbeat(f):
    t = f / 60.0; beat = 60 / 128; bar = int(t // (4 * beat)) + 1
    b = int((t - (bar - 1) * 4 * beat) // beat + 1e-9) + 1
    return f'{bar}.{b}' if bar <= 16 else f'tail +{t - 30:.2f}s'

if a.frames:
    frames = []
    for p in a.frames.split(','):
        if '-' in p: x, y = map(int, p.split('-')); frames += list(range(x, y + 1))
        else: frames.append(int(p))
else:
    frames = sorted(int(n[1:5]) for n in os.listdir(a.dir) if n.startswith('f') and n.endswith('.png'))
labels = json.load(open(a.labels)) if a.labels else {}
W = a.width; H = round(W * 9 / 16); pad = 28; cap = 58; head = 110 if a.title else pad
cols = a.cols; rows = (len(frames) + cols - 1) // cols
sheet = Image.new('RGB', (pad + cols * (W + pad), head + rows * (H + cap + pad)), (7, 7, 7))
d = ImageDraw.Draw(sheet)
f1, f2, f3 = font(34), font(20), font(17)
if a.title:
    d.text((pad, 30), a.title, font=f1, fill=(245, 243, 242))
for i, fr in enumerate(frames):
    x = pad + (i % cols) * (W + pad); y = head + (i // cols) * (H + cap + pad)
    p = os.path.join(a.dir, f'f{fr:04d}.png')
    if os.path.exists(p):
        im = Image.open(p).convert('RGB').resize((W, H), Image.LANCZOS); sheet.paste(im, (x, y))
    d.rectangle([x - 1, y - 1, x + W, y + H], outline=(40, 38, 40))
    lab = labels.get(str(fr), act_of(fr))
    d.text((x, y + H + 8), f'f{fr}', font=f2, fill=(255, 41, 70))
    d.text((x + 70, y + H + 8), f'{fr/60:.2f} s · bar {barbeat(fr)}', font=f2, fill=(245, 243, 242))
    d.text((x, y + H + 33), lab, font=f3, fill=(170, 164, 166))
sheet.save(a.out, optimize=True)
print(f'sheet: {len(frames)} frames -> {a.out} ({sheet.width}x{sheet.height})')
