# Positive control for compare7.py: a single +1 change in one channel of one pixel must be reported.
import json, os, sys, numpy as np
from PIL import Image
SP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rows = json.load(open(os.path.join(SP, "static", "manifest.json")))
r = [x for x in rows if x["name"] == "preset-v2-chart-light" and x["mode"] == "reduce"][0]
A = np.asarray(Image.open(r["file"]).convert("RGB")).copy()
A[40, 40, 1] = (int(A[40, 40, 1]) + 1) % 256
os.makedirs(os.path.join(SP, "controls"), exist_ok=True)
p = os.path.join(SP, "controls", "perturbed-1px.png")
Image.fromarray(A).save(p)
json.dump([dict(r, file=p, mode="control", name="perturbed-1px(+1 G)")], open(os.path.join(SP, "controls", "manifest-perturbed.json"), "w"))
