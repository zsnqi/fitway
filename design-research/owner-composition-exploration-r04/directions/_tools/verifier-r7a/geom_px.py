# Pixel-level marker check from geom7's 3x clips: the rendered marker's centre (circle fit on the marker's own pixels,
# found as "on" minus "off"), its distance to what it describes, what is drawn above the point, the hairline's
# extent to the axis, and red pixels after now. Usage: python geom_px.py <geom dir> <out.json>
import json, sys, os, math, numpy as np
from PIL import Image
D = sys.argv[1]; S = 3
G = json.load(open(os.path.join(D, "geom.json")))
def load(p): return np.asarray(Image.open(p).convert("RGB")).astype(int)
def fit(mask):
    ys, xs = np.nonzero(mask)
    if len(xs) < 6: return None
    x = xs + 0.5; y = ys + 0.5
    A = np.c_[2 * x, 2 * y, np.ones_like(x)]; bvec = x * x + y * y
    c, *_ = np.linalg.lstsq(A, bvec, rcond=None)
    cx, cy = c[0], c[1]; r = math.sqrt(max(0.0, c[2] + cx * cx + cy * cy))
    return cx, cy, r, len(xs)
def centroid(mask):
    ys, xs = np.nonzero(mask)
    if not len(xs): return None
    return xs.mean() + 0.5, ys.mean() + 0.5, None, len(xs)
out = {}; worst = {}
for key, v in G.items():
    res = []
    for r in v["rows"]:
        base = os.path.join(D, "px", f"{key}-{r['key']}")
        on, off = load(base + "-on.png"), load(base + "-off.png")
        clip = r["clip"]
        toSvg = lambda px, py: (clip["x"] + px / S - r["svgLeft"], clip["y"] + py / S - r["svgTop"])
        form, mk = r.get("form"), r.get("markerAttr")
        diff = np.abs(on - off).max(2) > 10
        row = {"key": r["key"], "kind": r["kind"], "form": form, "marker": mk, "diffPx": int(diff.sum())}
        onR, onG, onB = on[..., 0], on[..., 1], on[..., 2]
        offR, offG = off[..., 0], off[..., 1]
        on_min, off_min = on.min(2), off.min(2)
        # coarse window: only pixels within WIN css px of the DOM centre take part in the fit (excludes the hairline)
        yy, xx = np.mgrid[0:on.shape[0], 0:on.shape[1]]
        if r.get("x") is not None:
            wcx, wcy = (r["x"] + r["svgLeft"] - clip["x"]) * S, (r["y"] + r["svgTop"] - clip["y"]) * S
            win = np.hypot(xx + 0.5 - wcx, yy + 0.5 - wcy) <= 11 * S
        else:
            win = np.ones(on.shape[:2], bool)
        on_red = (onR > 170) & (onG < 95) & (onB < 110)
        off_red = (offR > 150) & (offG < 110)
        if form in ("line", "peak", "usual"):
            stale = r["kind"] == "latest" and r.get("coreFill") == "#8f898b" or (r.get("coreStroke") == "#8f898b")
            if form == "usual":
                m = (on_min > 150) & (off_min < 110); how = "chalk ring fit"; fn = fit
            elif mk == "a" and form == "peak":
                m = on_red & ~off_red; how = "red fill centroid"; fn = centroid
            elif mk == "a":
                m = (on_min > 150) & (off_min < 110); how = "chalk rim fit"; fn = fit
            elif stale:
                m = (np.abs(onR - onG) < 25) & (onR > 105) & (onR < 190) & (off.max(2) < 70); how = "grey ring fit"; fn = fit
            else:
                m = on_red & ~off_red; how = "red ring fit"; fn = fit
            f = fn(m & win)
            row["method"] = how
            if f:
                sx, sy = toSvg(f[0], f[1])
                row.update(fitX=round(sx, 3), fitY=round(sy, 3), fitR=None if f[2] is None else round(f[2] / S, 3), fitPx=int(f[3]))
                row["fitVsDom"] = round(math.hypot(sx - r["x"], sy - r["y"]), 3)
                if form == "peak": row["fitToTarget"] = round(math.hypot(sx - r["peakDot"][0], sy - r["peakDot"][1]), 3); row["target"] = "peak dot"
                elif r["kind"] == "latest" and r.get("endDot"): row["fitToTarget"] = round(math.hypot(sx - r["endDot"][0], sy - r["endDot"][1]), 3); row["target"] = "end dot"
                else:
                    P = np.array(r["pathNear"]) if r["pathNear"] else None
                    row["fitToTarget"] = round(float(np.min(np.hypot(P[:, 0] - sx, P[:, 1] - sy))), 3) if P is not None else None
                    row["target"] = "usual line" if form == "usual" else "line"
            # what is drawn, relative to the rendered centre (DOM centre used for the geometry of the diff)
            ys, xs = np.nonzero(diff)
            X, Y = clip["x"] + (xs + 0.5) / S - r["svgLeft"], clip["y"] + (ys + 0.5) / S - r["svgTop"]
            dc = np.hypot(X - r["x"], Y - r["y"])
            P = np.array(r["pathNear"]) if r["pathNear"] else np.zeros((0, 2))
            if len(P) and len(X):
                dp = np.min(np.hypot(X[:, None] - P[None, :, 0], Y[:, None] - P[None, :, 1]), axis=1)
            else:
                dp = np.full(len(X), 1e9)
            above = Y < r["y"] - 0.5
            band = 11 if mk == "a" else 4
            glowR = 14 if mk == "a" else 15
            offline_above = above & (dp > band)
            dv = np.abs(on - off).max(2)[ys, xs]
            stray = above & (dp > band) & (dc > glowR)
            row["strayAbove10"] = int(stray.sum()); row["strayAbove24"] = int((stray & (dv > 24)).sum()); row["strayAboveMaxDiff"] = int(dv[stray].max()) if stray.any() else 0
            row["maxExtentAboveOffLine"] = round(float(dc[offline_above].max()), 2) if offline_above.any() else 0.0
            row["maxRiseAboveOffLine"] = round(float((r["y"] - Y[offline_above]).max()), 2) if offline_above.any() else 0.0
            row["maxExtentAlongLine"] = round(float(dc[dp <= 4].max()), 2) if (dp <= 4).any() else 0.0
            # red added after now (usual form must add no red)
            if form == "usual":
                row["redAddedPx"] = int((on_red & ~off_red).sum())
        elif form == "gap":
            chalk = (on_min > 150) & (off_min < 110)
            ys, xs = np.nonzero(diff)
            X, Y = clip["x"] + (xs + 0.5) / S - r["svgLeft"], clip["y"] + (ys + 0.5) / S - r["svgTop"]
            row["diffBox"] = [round(float(X.min()), 2), round(float(X.max()), 2), round(float(Y.min()), 2), round(float(Y.max()), 2)] if len(xs) else None
            row["diffCentreX"] = round(float((X.min() + X.max()) / 2), 2) if len(xs) else None
            row["markX"] = round(r["x"], 2); row["axisY"] = r["axisY"]
            row["redAddedPx"] = int((on_red & ~off_red).sum())
        else:  # no marker (no history, after now)
            ys, xs = np.nonzero(diff)
            Y = clip["y"] + (ys + 0.5) / S - r["svgTop"]
            row["diffRows"] = [round(float(Y.min()), 2), round(float(Y.max()), 2)] if len(ys) else None
            row["axisY"] = r["axisY"]
        # hairline column
        con, coff = load(base + "-colon.png"), load(base + "-coloff.png")
        cd = np.abs(con - coff).max(2) > 6
        rows_any = np.nonzero(cd.any(1))[0]
        cc = r["colClip"]; cy0 = r.get("y", r["axisY"])
        if len(rows_any):
            topY = cc["y"] + (rows_any.min() + 0.5) / S - r["svgTop"]; botY = cc["y"] + (rows_any.max() + 0.5) / S - r["svgTop"]
            row["colTopRel"] = round(topY - cy0, 2); row["colBottomMinusAxis"] = round(botY - r["axisY"], 2)
            # hairline colour at mid-height between the point and the axis
            mid = int(((cy0 + r["axisY"]) / 2 + r["svgTop"] - cc["y"]) * S)
            if 0 <= mid < con.shape[0]:
                rowpx = con[mid]; j = int(np.argmax(np.abs(rowpx - coff[mid]).max(1)))
                row["hairMidRGB"] = [int(c) for c in rowpx[j]]; row["hairMidBgRGB"] = [int(c) for c in coff[mid][j]]
        else:
            row["colTopRel"] = None; row["colBottomMinusAxis"] = None
        res.append(row)
    out[key] = res
    L = [x for x in res if x.get("fitToTarget") is not None]
    worst[key] = {
        "maxFitToTarget": max([x["fitToTarget"] for x in L] or [None]),
        "maxFitVsDom": max([x["fitVsDom"] for x in L] or [None]),
        "fitted": len(L), "withMarker": sum(1 for x in res if x["form"] in ("line", "peak", "usual")),
        "maxRiseAboveOffLine": max([x.get("maxRiseAboveOffLine", 0) for x in res]),
        "maxExtentAboveOffLine": max([x.get("maxExtentAboveOffLine", 0) for x in res]),
        "maxExtentAlongLine": max([x.get("maxExtentAlongLine", 0) for x in res]),
        "strayAbove10": sum(x.get("strayAbove10", 0) for x in res), "strayAbove24": sum(x.get("strayAbove24", 0) for x in res), "strayAboveMaxDiff": max([x.get("strayAboveMaxDiff", 0) for x in res]),
        "minColTopRel": min([x["colTopRel"] for x in res if x.get("colTopRel") is not None and x["form"] in ("line", "peak", "usual")] or [None]),
        "colBottomMinusAxis": sorted(set(x["colBottomMinusAxis"] for x in res if x.get("colBottomMinusAxis") is not None and x["form"] in ("line", "peak", "usual"))),
        "redAddedAfterNow": sum(x.get("redAddedPx", 0) for x in res if x["form"] == "usual"),
        "fitR": sorted(set(x.get("fitR") for x in res if x.get("fitR") is not None and x["form"] == "line"))[:1] + sorted(set(x.get("fitR") for x in res if x.get("fitR") is not None and x["form"] == "line"))[-1:],
    }
json.dump({"worst": worst, "rows": out}, open(sys.argv[2], "w"), indent=1)
for k, w in worst.items(): print(k, json.dumps(w))
