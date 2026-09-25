# DOM-level summary of geom7 output: marker distance to what it describes, forms, elements drawn, hairline, halo.
import json, sys, collections
G = json.load(open(sys.argv[1]))
summary = {}
for key, v in G.items():
    rows = v["rows"]
    s = {"api": v["api"], "errors": len(v["errors"]), "afterClear": v["afterClear"], "stops": len(rows)}
    kinds = collections.Counter(r["kind"] for r in rows); s["kinds"] = dict(kinds)
    lineRows = [r for r in rows if r.get("form") in ("line",) and r["kind"] not in ("peak",)]
    s["maxDistLine"] = round(max([r["distLine"] for r in lineRows] or [0]), 4)
    s["maxCoreVsTransform"] = round(max([r["coreVsTransform"] for r in rows if r.get("coreVsTransform") is not None] or [0]), 4)
    us = [r for r in rows if r.get("form") == "usual"]
    s["usualCount"] = len(us); s["maxDistUsual"] = round(max([r["distUsual"] for r in us] or [0]), 4)
    pk = [r for r in rows if r["kind"] == "peak"]
    s["peak"] = [{"form": r.get("form"), "distPeakDot": round(r.get("distPeakDot", -1), 4), "coreR": r.get("coreR"), "fill": r.get("coreFill"), "stroke": r.get("coreStroke"), "sw": r.get("coreStrokeW"), "tipV": r["tipV"]} for r in pk]
    lt = [r for r in rows if r["kind"] == "latest"]
    s["latest"] = [{"form": r.get("form"), "distEndDot": round(r.get("distEndDot", -1), 4), "distLine": round(r.get("distLine", -1), 4), "fill": r.get("coreFill"), "stroke": r.get("coreStroke"), "halo": r["haloVisibility"], "tipV": r["tipV"], "tip": r["tipText"]} for r in lt]
    # forms by kind, marker attribute, fills/strokes
    s["formsByKind"] = {k: sorted(set(str(r.get("form")) for r in rows if r["kind"] == k)) for k in kinds}
    s["markerAttrs"] = sorted(set(str(r.get("markerAttr")) for r in rows if r.get("form")))
    s["coreStyleByForm"] = {}
    for r in rows:
        if r.get("form"):
            s["coreStyleByForm"].setdefault(f'{r["kind"]}/{r["form"]}', set()).add(f'r={r.get("coreR")} fill={r.get("coreFill")} stroke={r.get("coreStroke")} sw={r.get("coreStrokeW")}')
    s["coreStyleByForm"] = {k: sorted(v) for k, v in s["coreStyleByForm"].items()}
    # elements drawn: tags/classes; anything that extends above the point beyond the marker's own round parts
    tagset = collections.Counter()
    above = []
    ticks = []
    hair = []
    for r in rows:
        for e in r["els"]:
            tagset[f'{e["parent"]}>{e["tag"]}.{e["cls"]}'] += 1
        if r.get("form") is None:
            continue
        y = r["y"]; x = r["x"]
        for e in r["els"]:
            bb = e["bbox"]
            if not bb: continue
            # round parts centred on the point (circles/ellipses/use-bloom) are allowed; anything else must not reach above y - 1
            centred = abs(bb["x"] + bb["w"] / 2 - x) < 0.6 and abs(bb["y"] + bb["h"] / 2 - y) < 0.6
            if e["tag"] in ("rect", "path", "line") and not centred and bb["y"] < y - 1 and r.get("form") != "gap":
                above.append({"key": r["key"], "tag": e["tag"], "cls": e["cls"], "bboxTop": round(bb["y"], 2), "pointY": round(y, 2)})
            if e["tag"] in ("path", "line") and bb["h"] < 0.5 and bb["w"] > 2 and r.get("form") != "gap":
                ticks.append({"key": r["key"], "cls": e["cls"]})
            if e["cls"] in ("sg-lit", "sg-drop"):
                hair.append({"key": r["key"], "kind": r["kind"], "cls": e["cls"], "top": round(bb["y"], 2), "bottom": round(bb["y"] + bb["h"], 2), "axisY": r["axisY"], "pointY": round(y, 2), "gapTopMinusPoint": round(bb["y"] - y, 2), "bottomMinusAxis": round(bb["y"] + bb["h"] - r["axisY"], 2), "fill": e["fill"], "stroke": e["stroke"]})
    s["elementTypes"] = dict(tagset)
    s["drawnAbovePointNonRound"] = above
    s["horizontalTicks"] = ticks
    hs = [h for h in hair]
    s["hairline"] = {"count": len(hs), "withMarker": sum(1 for r in rows if r.get("form") and r.get("form") != "gap"), "maxBottomMinusAxis": max([abs(h["bottomMinusAxis"]) for h in hs] or [0]), "minTopBelowPoint": min([h["gapTopMinusPoint"] for h in hs] or [0]), "kinds": sorted(set(f'{h["kind"]}:{h["cls"]}:{h["fill"] or h["stroke"]}' for h in hs))}
    s["noMarkerStops"] = [f'{r["key"]}({r["kind"]}) tick={r.get("tick")}' for r in rows if not r.get("form")]
    s["gap"] = [{"form": r.get("form"), "els": [f'{e["tag"]}.{e["cls"]} fill={e["fill"]} stroke={e["stroke"]}' for e in r["els"]][:4], "tip": r["tipText"]} for r in rows if r["kind"] == "gap"]
    s["tipValueMismatch"] = [f'{r["key"]}:{r["tipV"]}!={r["apiValue"]}' for r in rows if r["tipV"] is not None and r["apiValue"] is not None and str(r["apiValue"]) != r["tipV"].replace("⁨", "").replace("⁩", "") and r["kind"] != "latest"]
    summary[key] = s
json.dump(summary, open(sys.argv[2], "w"), indent=1, default=list)
for k, s in summary.items():
    print(k, "stops", s["stops"], "maxDistLine", s["maxDistLine"], "coreVsT", s["maxCoreVsTransform"], "usual", s["usualCount"], s["maxDistUsual"], "peak", s["peak"], "latest", [(l["form"], l["distEndDot"], l["fill"], l["halo"], l["tipV"]) for l in s["latest"]], "above", len(s["drawnAbovePointNonRound"]), "ticks", len(s["horizontalTicks"]), "hair", s["hairline"]["count"], "/", s["hairline"]["withMarker"], "maxBotVsAxis", s["hairline"]["maxBottomMinusAxis"], "minTopBelow", s["hairline"]["minTopBelowPoint"], "noMarker", len(s["noMarkerStops"]), "api", s["api"], "err", s["errors"], "clear", s["afterClear"])
