# Decode the coordinator's recordings and build strips of the frames where things change.
import cv2, numpy as np, json, sys, os
from PIL import Image, ImageDraw
D = sys.argv[1]
log = json.load(open(f"{D}/video-log.json"))
def load(name):
    cap = cv2.VideoCapture(f"{D}/{name}.webm"); fps = cap.get(cv2.CAP_PROP_FPS); fr = []
    while True:
        ok, f = cap.read()
        if not ok: break
        fr.append(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    return fps, fr
def crop(f, b, pad=6):
    x, y, w, h = max(0, b["x"] - pad), max(0, b["y"] - pad), b["w"] + 2 * pad, b["h"] + 2 * pad
    return f[y:y + h, x:x + w]
def strip(frames, idx, b, scale, path, label=True, cols=None):
    tiles = []
    for i in idx:
        t = Image.fromarray(crop(frames[i], b) if b else frames[i])
        t = t.resize((int(t.width * scale), int(t.height * scale)), Image.LANCZOS if scale < 1 else Image.NEAREST)
        if label: ImageDraw.Draw(t).text((3, 2), str(i), fill=(255, 255, 0))
        tiles.append(t)
    if not tiles: return
    cols = cols or len(tiles); rows = (len(tiles) + cols - 1) // cols
    W, H = tiles[0].width, tiles[0].height
    sheet = Image.new("RGB", (W * cols + 2 * (cols - 1), H * rows + 2 * (rows - 1)), (60, 60, 60))
    for k, t in enumerate(tiles): sheet.paste(t, ((k % cols) * (W + 2), (k // cols) * (H + 2)))
    sheet.save(path)
def active(frames, b, thr=6):
    out = []
    for i in range(1, len(frames)):
        d = np.abs(crop(frames[i], b).astype(int) - crop(frames[i - 1], b).astype(int)).max()
        if d > thr: out.append((i, int(d)))
    return out
rep = {}
os.makedirs(f"{D}/strips", exist_ok=True)
# Load: first content frame, then how far each later frame is from the final one (the pulse area masked).
for name in ("load-ar-cold", "load-ar", "load-en"):
    fps, fr = load(name)
    B = log[name]["boxes"]; pl = B["plot"]
    final = fr[-1].astype(int)
    mask = np.ones(final.shape[:2], bool)
    mask[pl["y"]:pl["y"] + pl["h"], pl["x"]:pl["x"] + pl["w"]] = False  # the chart holds the pulse
    start = next((i for i, f in enumerate(fr) if f[100:700, 100:1300].max() > 200), None)
    diffs = [int((np.abs(f.astype(int) - final).max(2) * mask).max()) for f in fr]
    stable = next((i for i in range(len(fr)) if all(d <= 8 for d in diffs[i:-1])), None)
    rep[name] = {"fps": fps, "frames": len(fr), "firstContent": start, "stableFrom": stable, "diffsAfterContent": diffs[start:start + 14] if start is not None else None}
    if start is not None: strip(fr, list(range(max(0, start - 1), min(len(fr), start + 7))), None, 0.25, f"{D}/strips/{name}.png")
# Live: activity in each region, strips of changing frames.
for name in ("live-ar", "live-en", "slow-live-ar"):
    fps, fr = load(name); B = log[name]["boxes"]
    card = {"x": min(B["now"]["x"], B["foot"]["x"]) - 20, "y": B["now"]["y"] - 10, "w": max(B["now"]["x"] + B["now"]["w"], B["foot"]["x"] + B["foot"]["w"]) - min(B["now"]["x"], B["foot"]["x"]) + 40, "h": B["foot"]["y"] + B["foot"]["h"] - B["now"]["y"] + 20}
    ent = {"x": B["entries"]["x"] - 20, "y": B["entries"]["y"] - 10, "w": B["entries"]["w"] + 40, "h": B["entries"]["h"] + 20}
    a_now, a_ent, a_plot = active(fr, card), active(fr, ent), active(fr, B["plot"], thr=10)
    rep[name] = {"fps": fps, "frames": len(fr), "nowCardActive": a_now[:60], "entriesActive": a_ent[:60], "plotActiveCount": len(a_plot)}
    # group active frames into episodes and strip each with one frame either side
    for tag, act, b, sc in (("now", a_now, card, 2), ("entries", a_ent, ent, 2)):
        idx = [i for i, _ in act]
        eps = []
        for i in idx:
            if eps and i - eps[-1][-1] <= 2: eps[-1].append(i)
            else: eps.append([i])
        for k, e in enumerate(eps[:6]):
            rng = list(range(max(0, e[0] - 1), min(len(fr), e[-1] + 2)))
            if len(rng) > 24: rng = rng[:: max(1, len(rng) // 24)]
            strip(fr, rng, b, sc, f"{D}/strips/{name}-{tag}-{k}.png", cols=min(len(rng), 8 if sc >= 2 else 12))
        rep[name][f"{tag}Episodes"] = [(e[0], e[-1]) for e in eps]
# Hover / keys: plot activity and strips around the marker.
for name in ("hover-ar", "hover-en", "keys-ar", "slow-keys-ar"):
    fps, fr = load(name); B = log[name]["boxes"]
    act = active(fr, B["plot"], thr=10)
    rep[name] = {"fps": fps, "frames": len(fr), "plotActiveFrames": len(act)}
    idx = [i for i, _ in act]
    step = max(1, len(idx) // 40)
    strip(fr, idx[::step][:40], B["plot"], 0.5, f"{D}/strips/{name}-plot.png", cols=5)
# Rail
for name in ("rail-ar", "rail-en"):
    fps, fr = load(name); B = log[name]["boxes"]
    r = {"x": 1440 - 260 if name.endswith("ar") else 0, "y": 0, "w": 260, "h": 900}
    act = active(fr, r)
    idx = [i for i, _ in act]
    rep[name] = {"fps": fps, "frames": len(fr), "railActive": idx}
    strip(fr, idx[:16], r, 0.5, f"{D}/strips/{name}.png", cols=16)
# Delayed: where does anything change over time?
fps, fr = load("delayed-ar")
chg = []
for i in range(1, len(fr)):
    d = np.abs(fr[i].astype(int) - fr[i - 1].astype(int)).max(2)
    ys, xs = np.nonzero(d > 8)
    if len(ys): chg.append((i, int(d.max()), int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())))
rep["delayed-ar"] = {"fps": fps, "frames": len(fr), "changes": chg}
json.dump(rep, open(f"{D}/frames-report.json", "w"), indent=1)
print(json.dumps(rep, indent=None)[:6000])
