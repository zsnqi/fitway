# Pixel comparison of static7.mjs renders against the pre-motion references (and, for by-design frames, against the
# designer's evidence PNGs). Writes a JSON summary. Usage: python compare7.py <manifest.json> <out.json>
import json, sys, os, numpy as np
from PIL import Image
rows = json.load(open(sys.argv[1]))
def cmp(a, b):
    if not b or not os.path.exists(b): return None
    A = np.asarray(Image.open(a).convert("RGB")).astype(int)
    B = np.asarray(Image.open(b).convert("RGB")).astype(int)
    if A.shape != B.shape: return {"shape": [list(A.shape), list(B.shape)]}
    d = np.abs(A - B).max(2); ys, xs = np.nonzero(d > 0)
    return {"max": int(d.max()), "px": int(len(ys)), "bbox": [int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())] if len(ys) else None}
out = []; ok = True
for r in rows:
    ref = cmp(r["file"], r["ref"]); ev = cmp(r["file"], r.get("evid"))
    o = {"mode": r["mode"], "name": r["name"], "byDesign": r.get("byDesign"), "marker": r.get("marker"), "vsRef": ref, "vsEvidence": ev, "errors": r["errors"], "anims": r.get("anims")}
    out.append(o)
    if not r.get("byDesign"):
        good = ref is not None and "shape" not in ref and ref["max"] == 0 and not r["errors"]
        ok = ok and good
    print(f"{r['mode']:7s} {r['name']:34s} ref {ref}  evid {ev}  err {len(r['errors'])} anims {len(r.get('anims') or [])}")
json.dump({"allNonByDesignIdentical": ok, "rows": out}, open(sys.argv[2], "w"), indent=1)
print("ALL NON-BY-DESIGN FRAMES IDENTICAL" if ok else "DIFFERENCES FOUND")
