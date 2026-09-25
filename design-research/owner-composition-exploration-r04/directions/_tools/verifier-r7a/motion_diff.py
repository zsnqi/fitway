# Compare motion.json from the current code with the Round 6 copy: structure of animations, roll, bars, delayed, chip.
import json, sys, numpy as np
from PIL import Image
A = json.load(open(sys.argv[1] + "/motion.json")); B = json.load(open(sys.argv[2] + "/motion.json"))
out = {}
def anims(lst): return sorted(set(f"{a['type']}|{a.get('name')}|{a['target']}|{','.join(a['props'])}|{a.get('pseudo')}" for a in lst))
for lang in ("ar", "en"):
    a, b = A["roll"][lang], B["roll"][lang]
    out[f"roll-{lang}"] = {
        "stepSame": a["stepRes"] == b["stepRes"], "beforeText": a["beforeText"] == b["beforeText"], "afterText": a["afterText"] == b["afterText"],
        "afterPlain": [a["afterIsPlain"], b["afterIsPlain"]], "opacityHits": [a["opacityHitCount"], b["opacityHitCount"]],
        "animsSame": anims(a["anims"]) == anims(b["anims"]), "anims": anims(a["anims"]), "rollFrames": [a["rollFrames"], b["rollFrames"]],
        "firstFramesSame": json.dumps(a["frames"][:1]) == json.dumps(b["frames"][:1]), "liveSay": a["liveSay"] == b["liveSay"],
        "down": [a["down"]["before"], a["down"]["after"], a["down"]["wordAtOnce"]], "downSame": {k: a["down"][k] == b["down"][k] for k in ("before", "after", "wordAtOnce", "liveSay", "slots")},
    }
out["bars"] = [{"dir": x["dir"], "words": [x["wordBefore"], x["wordNow"]], "animsSame": anims(x["anims"]) == anims(y["anims"]), "anims": anims(x["anims"]), "opacityHits": [x["opacityHits"], y["opacityHits"]], "plainAfter": [x["plainAfter"], y["plainAfter"]]} for x, y in zip(A["bars"]["r"], B["bars"]["r"])]
out["delayed"] = {"restAnims": [anims(A["delayed"]["restAnims"]), anims(B["delayed"]["restAnims"])], "afterStepSame": anims(A["delayed"]["afterStep"]["anims"]) == anims(B["delayed"]["afterStep"]["anims"]), "afterStep": anims(A["delayed"]["afterStep"]["anims"]), "ping": [A["delayed"]["afterStep"]["ping"], B["delayed"]["afterStep"]["ping"]], "stepSame": A["delayed"]["afterStep"]["step"] == B["delayed"]["afterStep"]["step"]}
out["firstPaint"] = [{"name": x["name"], "animsSame": anims(x["anims"]) == anims(y["anims"]), "anims": anims(x["anims"]), "hiddenEarly": [x["early"]["hidden"], y["early"]["hidden"]]} for x, y in zip(A["firstPaint"], B["firstPaint"])]
def pxsame(f1, f2):
    a = np.asarray(Image.open(f1).convert("RGB")).astype(int); b = np.asarray(Image.open(f2).convert("RGB")).astype(int)
    return a.shape == b.shape and int(np.abs(a - b).max()) == 0
out["firstPaintPixelsSame"] = [pxsame(x["file"], y["file"]) for x, y in zip(A["firstPaint"], B["firstPaint"])]
out["chip"] = {k: A["chip"].get(k) == B["chip"].get(k) for k in ("selector", "htmlBefore", "htmlAfter", "htmlReset")}
out["chipPixels"] = {n: pxsame(f"{sys.argv[1]}/{n}", f"{sys.argv[2]}/{n}") for n in ("chip-before-2x.png", "chip-after-2x.png", "chip-reset-2x.png", "page-after-reset.png")}
json.dump(out, open(sys.argv[3], "w"), indent=1, ensure_ascii=False)
print(json.dumps(out, ensure_ascii=False)[:5000])
