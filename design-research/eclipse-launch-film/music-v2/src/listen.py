#!/usr/bin/env python3
"""
listen.py: earshot's readings of the original Drive (A) and Drive v2 (B), side by side, in one process so the
listening models load once. Run it with earshot's Python:

  /home/user/.venvs/earshot/bin/python listen.py --a A.wav --b B.wav [--stems-a DIR --stems-b DIR] --out R.json

For each file: realness (the whole mix, its 4 s windows, and each stem over the span where it sounds), describe
(the whole and the three sections: intro 0.10-3.85 s, lift 3.85-7.60 s, hit and tail 7.60-10.0 s), match as a
forced choice (the coordinator's four descriptions, then the same plus "an epic orchestral trailer", and per
section with "techno music" added), critique against the launch-film profile, measure --music and the sfx click
audit. The readings are diagnosis, not targets: earshot's own README warns that its realness model is easy to fool.
"""
import argparse
import json
import os
import sys

import numpy as np
import soundfile as sf

from earshot import api

SECTIONS = {'intro': (0.10, 3.85), 'lift': (3.85, 7.60), 'hit+tail': (7.60, 10.0)}
QUERY = 'warm cinematic music with a driving pulse'
ALTS = ['synthwave music', 'minimal electronic music', 'corporate background music']
ALTS_TRAILER = ALTS + ['an epic orchestral trailer']
ALTS_SECTION = ALTS_TRAILER + ['techno music']
# the original sketch's stems, grouped into v2's six (its reverb is one shared stem and is left out)
ORIGINAL_GROUPS = {'bass': ['bass'], 'drums': ['kick', 'hats', 'snare'], 'strings': ['pad'], 'keys': ['stabs'],
                   'fx': ['riser'], 'hit': ['hit', 'hit_low', 'hit_tone']}


def forced(path, alts, start=None, end=None):
    r = api.match(path, QUERY, alts=alts, start=start, end=end)
    p = {QUERY: round(100 * r['p_vs_alts'], 1)}
    p.update({x['query']: round(100 * x['p'], 1) for x in r.get('alts', [])})
    return {'p_pct': p, 'query_z': round(r['z'], 2), 'verdict': r['verdict'],
            'closest_vocab': [(x['term'], round(x['z'], 1)) for x in r['closest_vocab'][:3]]}


def tags(r, k=4):
    return [(t['term'], round(t['z'], 1)) for t in r.get('top_tags', [])[:k]]


def span(x, floor_db=-45.0):
    """first and last time a stem sounds (its 50 ms level within floor_db of its loudest)"""
    m = np.abs(x).max(axis=1)
    h = 2400
    lv = np.array([m[i:i + h].max() for i in range(0, len(m), h)])
    on = np.flatnonzero(lv > lv.max() * 10 ** (floor_db / 20))
    return on[0] * h / 48000, min(len(m), (on[-1] + 1) * h) / 48000


def group_stems(d, groups, tmp):
    """sum the original's per-voice stems into v2's six groups, as files in tmp"""
    out = {}
    for g, names in groups.items():
        xs = [sf.read(os.path.join(d, f'{n}.wav'), always_2d=True)[0] for n in names
              if os.path.exists(os.path.join(d, f'{n}.wav'))]
        if xs:
            p = os.path.join(tmp, f'{g}.wav')
            sf.write(p, sum(xs), 48000, subtype='FLOAT')
            out[g] = p
    return out


def stem_realness(stems):
    rows = {}
    for g, p in stems.items():
        x, _ = sf.read(p, always_2d=True)
        if not np.any(x):
            continue
        a, b = span(x)
        r = api.realness(p, start=a, end=b)
        rows[g] = {'p_real': round(r['p_real'], 2), 'verdict': r['verdict'], 'span_s': [round(a, 2), round(b, 2)]}
    return rows


def listen(path, stems=None):
    res = {'file': path}
    r = api.realness(path)
    segs = r.get('segments') or []
    res['realness'] = {'p_real': round(r['p_real'], 2), 'verdict': r['verdict'],
                       'windows': [(round(s['start'], 1), round(s['end'], 1),
                                    None if s.get('p_real') is None else round(s['p_real'], 2), s.get('why'))
                                   for s in segs],
                       'evidence': r.get('evidence')}
    if stems:
        res['realness']['stems'] = stem_realness(stems)
    d = api.describe(path)
    res['describe'] = {'whole': tags(d), 'audioset': [(a['label'], round(a['p'], 2)) for a in d.get('audioset', [])[:4]]
                       if isinstance(d.get('audioset'), list) and d['audioset'] and isinstance(d['audioset'][0], dict)
                       else d.get('audioset'), 'shape': d.get('shape')}
    for name, (a, b) in SECTIONS.items():
        res['describe'][name] = tags(api.describe(path, start=a, end=b))
    res['match'] = {'coordinator_alts': forced(path, ALTS), 'with_trailer': forced(path, ALTS_TRAILER)}
    for name, (a, b) in SECTIONS.items():
        res['match'][name] = forced(path, ALTS_SECTION, a, b)
    c = api.critique(path)
    res['critique'] = {'verdict': c.get('verdict'), 'score': c.get('score'), 'in_range': c.get('in_range'),
                       'scored': c.get('scored'),
                       'rows': {r_['metric']: {k: r_.get(k) for k in ('value', 'status', 'range', 'median', 'weight')}
                                for r_ in c.get('metrics', [])},
                       'actions': c.get('actions')}
    m = api.measure(path, music=True)
    res['measure'] = {k: m.get(k) for k in ('lufs', 'true_peak_dbtp', 'lra_lu', 'short_term_max_lufs', 'brightness_hz',
                                            'centroid_hz', 'rolloff95_hz', 'tempo', 'key', 'bands_db', 'side_to_mid_db',
                                            'correlation', 'onsets_per_s', 'dynamic_range_db', 'harmonic_ratio',
                                            'noise_floor_dbfs', 'clipped_samples')}
    ck = api.sfx_check(path)
    res['sfx_check'] = {'ok': ck.get('ok'), 'summary': ck.get('summary'),
                        'issues': ck.get('issues') or ck.get('warnings')}
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--a', required=True)
    ap.add_argument('--b', required=True)
    ap.add_argument('--stems-a')
    ap.add_argument('--stems-b')
    ap.add_argument('--out', required=True)
    ap.add_argument('--only-b', action='store_true', help='skip A (reuse its readings from --out when present)')
    a = ap.parse_args()
    prev = {}
    if a.only_b and os.path.exists(a.out):
        with open(a.out) as fh:
            prev = json.load(fh)
    tmp = os.path.join(os.path.dirname(os.path.abspath(a.out)), 'grouped-original-stems')
    os.makedirs(tmp, exist_ok=True)
    out = {}
    if a.only_b and 'A' in prev:
        out['A'] = prev['A']
    else:
        sa = group_stems(a.stems_a, ORIGINAL_GROUPS, tmp) if a.stems_a else None
        out['A'] = listen(a.a, sa)
    sb = {os.path.splitext(f)[0]: os.path.join(a.stems_b, f) for f in sorted(os.listdir(a.stems_b))
          if f.endswith('.wav')} if a.stems_b else None
    out['B'] = listen(a.b, sb)
    with open(a.out, 'w') as fh:
        json.dump(out, fh, indent=1, default=str)
    for k in ('A', 'B'):
        r = out[k]
        print(f"== {k}: {os.path.basename(r['file'])}")
        print(f"  realness p_real {r['realness']['p_real']} ({r['realness']['verdict']}); windows "
              f"{[(w[0], w[1], w[2]) for w in r['realness']['windows']]}")
        if 'stems' in r['realness']:
            print('  stems ' + ', '.join(f"{g} {v['p_real']}" for g, v in r['realness']['stems'].items()))
        print(f"  match {r['match']['coordinator_alts']['p_pct']}")
        print(f"  match+trailer {r['match']['with_trailer']['p_pct']} z {r['match']['with_trailer']['query_z']}")
        for s in SECTIONS:
            print(f"  {s:9s} describe {r['describe'][s][:3]}  match {r['match'][s]['p_pct']}")
        print(f"  whole describe {r['describe']['whole']}")
        cr = r['critique']
        print(f"  critique {cr['verdict']} {cr['in_range']}/{cr['scored']}; off: " + ', '.join(
            f"{k} {v['value']} ({v['status']}, {v['range']})" for k, v in cr['rows'].items()
            if v['status'] not in ('ok', 'info', 'n.a.')))
        ms = r['measure']
        print(f"  measure --music: {ms['lufs']} LUFS, TP {ms['true_peak_dbtp']} dBTP, LRA {ms['lra_lu']} LU, "
              f"brightness {ms['brightness_hz']} Hz, tempo {ms['tempo']}, key {(ms['key'] or [{}])[0].get('key')}")
        print(f"  sfx check {r['sfx_check']['summary']}")
    sys.stdout.flush()


if __name__ == '__main__':
    main()
