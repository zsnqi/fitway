#!/usr/bin/env python3
"""Average a frame's motion-blur sub-samples in linear light (float), quantise once. average.py <dir of s*.png> <out.png>"""
import os, sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
files = sorted(f for f in os.listdir(src) if f.endswith('.png'))
def lin(a):
    a = a / 255.0
    return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
def srgb(l):
    l = np.clip(l, 0, 1)
    return np.where(l <= 0.0031308, l * 12.92, 1.055 * l ** (1 / 2.4) - 0.055) * 255.0
acc = None
for f in files:
    a = lin(np.asarray(Image.open(os.path.join(src, f)).convert('RGB'), dtype=np.float64))
    acc = a if acc is None else acc + a
img = srgb(acc / len(files))
# ordered dither of +-0.5 code value before rounding, so soft blur ramps do not band
h, w, _ = img.shape
bayer = (np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) + 0.5) / 16 - 0.5
img = img + np.tile(bayer, (h // 4 + 1, w // 4 + 1))[:h, :w, None]
Image.fromarray(np.clip(np.round(img), 0, 255).astype(np.uint8)).save(out)
