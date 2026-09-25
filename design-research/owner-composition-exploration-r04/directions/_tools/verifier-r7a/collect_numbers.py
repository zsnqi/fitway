# Collect the verifier's key numbers into one JSON.
import json, os, statistics as st
SP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda *p: json.load(open(os.path.join(SP, *p), encoding="utf-8"))
N = {}
c = J("static", "compare.json")
N["static"] = {
    "allNonByDesignIdentical": c["allNonByDesignIdentical"],
    "identical": sum(1 for r in c["rows"] if not r["byDesign"] and r["vsRef"] and r["vsRef"].get("max") == 0),
    "nonByDesignRows": sum(1 for r in c["rows"] if not r["byDesign"]),
    "byDesign": {f'{r["mode"]}:{r["name"]}': {"vsRef": r["vsRef"], "vsEvidence": r["vsEvidence"]} for r in c["rows"] if r["byDesign"]},
}
f = J("firstpaint", "compare.json")
N["firstPaintMotionOn"] = {f'{r["mode"]}:{r["name"]}': r["vsRef"]["max"] for r in f["rows"]}
ctl = J("controls", "compare-perturbed.json"); bc = J("controls", "before-copy", "compare.json")
N["controls"] = {"onePixelPlusOne": ctl["rows"][0]["vsRef"], "round6CopyNonByDesignIdentical": bc["allNonByDesignIdentical"],
                 "round6CopyHoverVsNewEvidence": {r["name"]: r["vsEvidence"] for r in bc["rows"] if r["byDesign"]}}
d = J("geom", "dom-summary.json"); p = J("geom", "px-summary.json")
N["geometry"] = {k: {"stops": v["stops"], "domMaxDistLine": v["maxDistLine"], "domMaxDistUsual": v["maxDistUsual"], "peakDistPeakDot": v["peak"][0]["distPeakDot"],
                     "latestDistEndDot": v["latest"][0]["distEndDot"], "latestFill": v["latest"][0]["fill"], "haloAtLatest": v["latest"][0]["halo"],
                     "nonRoundAbovePoint": len(v["drawnAbovePointNonRound"]), "horizontalTicks": len(v["horizontalTicks"]), "hairlineMaxBottomVsAxis": v["hairline"]["maxBottomMinusAxis"],
                     "noMarkerStops": len(v["noMarkerStops"]),
                     "pxMaxFitToTarget": p["worst"][k]["maxFitToTarget"], "pxMaxFitVsDom": p["worst"][k]["maxFitVsDom"], "pxStrayAbove": p["worst"][k]["strayAbove10"],
                     "pxMaxRiseAboveOffLine": p["worst"][k]["maxRiseAboveOffLine"], "pxBloomAlongLine": p["worst"][k]["maxExtentAlongLine"], "pxRedAddedAfterNow": p["worst"][k]["redAddedAfterNow"],
                     "pxFitRadius": p["worst"][k]["fitR"]} for k, v in d.items()}
s1 = J("controls", "geom-shift1", "px-summary.json")["rows"]
N["controls"]["shift1px"] = {k: round(st.median([r["fitToTarget"] for r in s1[k] if r.get("fitToTarget") is not None and r["form"] == "line"]), 3) for k in s1}
g = J("glide", "glide.json"); g6 = J("controls", "glide-r6", "glide.json")
N["glide"] = {k: {"maxDistFromTrack": max(x["maxDistFromTrackPx"] for x in v["glides"]), "maxOffStraight": max(x["maxOffStraightPx"] for x in v["glides"]),
                  "settleMs": [x["settledByMs"] for x in v["glides"] if x["glided"]], "framesWithNonRoundAbove": sum(x["nonRoundAbovePointFrames"] for x in v["glides"] if x["to"] != "gap"),
                  "cuts": [f'{x["from"]}->{x["to"]}' for x in v["glides"] if not x["glided"]]} for k, v in g.items()}
N["controls"]["round6GlideFramesWithGuideAbove"] = {k: sum(x["nonRoundAbovePointFrames"] for x in v["glides"] if x["to"] != "gap") for k, v in g6.items()}
sw = J("switch", "switch.json")
N["switch"] = {k: {kk: sw[k].get(kk) for kk in ("marker", "fromUrl", "shown", "selected")} | {"stored": (sw[k].get("storage") or {}).get("fitway.eclipse.v3.marker")} for k in sw if isinstance(sw[k], dict) and "marker" in sw[k] and "buttons" in sw[k]}
N["switch"]["freshUrlB"] = sw["freshUrlB"]; N["switch"]["midGlide"] = sw["midGlide"]; N["switch"]["freshTuner0"] = sw["freshTuner0"]
N["switch"]["labels"] = {"legend": sw["freshDefault"]["legend"], "buttons": [b["text"] for b in sw["freshDefault"]["buttons"]], "groupAriaLabel": sw["freshDefault"]["groupLabel"]}
N["unchanged"] = {"motionDiff": J("motion", "motion-diff.json"), "tailAndRail": {k: {"tailSvgEqual": v["tailSvgEqual"], "railAnimsEqual": v["railAnimsEqual"]} for k, v in J("unchanged", "unchanged.json").items()}}
L = J("glide", "live.json")
N["liveStepLatestSelected"] = {k: {"haloVisibleFramesMs": [s["t"] for s in v["step"]["frames"] if s["key"] == "latest" and s["halo"] == "visible"], "maxToEnd": max(s["toEnd"] or 0 for s in v["step"]["frames"]), "restHalo": v["step"]["rest"]["halo"]} for k, v in L.items()}
N["perfFirstEntryIntoFuture"] = {k: [x for x in v if x["from"] == "latest"][0] for k, v in J("glide", "perf.json").items()}
json.dump(N, open(os.path.join(SP, "numbers.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print(json.dumps({k: N["geometry"][k] for k in ("a-ar-live", "b-en-delayed")}, indent=0)[:3000])
print(N["controls"])
