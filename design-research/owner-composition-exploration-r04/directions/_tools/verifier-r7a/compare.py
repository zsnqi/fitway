import json, sys, numpy as np
from PIL import Image
rows = json.load(open(sys.argv[1]))
ok = True
for r in rows:
    A = np.asarray(Image.open(r["file"]).convert("RGB")).astype(int)
    B = np.asarray(Image.open(r["ref"]).convert("RGB")).astype(int)
    if A.shape != B.shape:
        print(f"{r['mode']:7s} {r['name']:34s} SHAPE {A.shape} vs {B.shape}"); ok = False; continue
    d = np.abs(A - B).max(2); ys, xs = np.nonzero(d > 0)
    bbox = f"bbox x{xs.min()}-{xs.max()} y{ys.min()}-{ys.max()}" if len(ys) else ""
    extra = f" anims={r.get('anims')}" if r.get("anims") else ""
    print(f"{r['mode']:7s} {r['name']:34s} max {d.max():3d} px>0 {len(ys):6d} {bbox} errors {len(r['errors'])}{extra}")
    ok = ok and d.max() == 0 and not r["errors"]
print("ALL IDENTICAL" if ok else "DIFFERENCES FOUND")
