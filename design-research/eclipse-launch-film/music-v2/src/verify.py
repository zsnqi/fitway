#!/usr/bin/env python3
"""
verify.py: the fixed constraints and the model-free checks of Drive v2 (B), next to the original Drive (A).

  python -I verify.py --a A.wav --b B.wav --m4a B.m4a --out verify.json

Checks B and fails (exit 1) when one does not hold: 48 kHz / 24-bit stereo, 10.0 s; integrated -14.0 +- 0.1 LUFS;
true peak <= -1.5 dBTP (4x oversampled) on the WAV and on the decoded AAC; the hit (7.60 s) is the loudest moment;
sound starts within 0.1-0.2 s, the first 3 ms rise from zero and the last 480 samples are zero; no spikes in the
10 kHz high-passed signal; the strongest three pitch classes of each bar and of the hit are its chord tones (the
samples are pitch-shifted, the timpani by up to -3.9 semitones). Reports for both A and B: momentary loudness per
bar, the same arc through a phone speaker (mono, 4th-order high-pass at 180 Hz and low-pass at 9 kHz, as in the
sketches' notes), band shares, mono fold-down and the stop-down depth.
"""
import argparse
import json
import os
import subprocess
import sys

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
FILM = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(FILM, 'music-sketches', 'src'))

import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402
from scipy import signal  # noqa: E402

import sketches as SK  # noqa: E402

M, SR, at, HIT = SK.M, SK.SR, SK.at, SK.HIT
STOP = HIT - SK.BEAT / 4


def arc(x):
    tm, L = M.blocks(x, 0.4, 0.1)
    out = {}
    for b in range(1, 5):
        sel = (tm >= at(b) + 0.2) & (tm < at(b + 1) - 0.2)
        out[f'bar{b}'] = round(float(np.mean(L[sel])), 1)
    out['hit'] = round(float(np.max(L[(tm >= HIT) & (tm < HIT + 0.6)])), 1)
    out['tail'] = round(float(np.mean(L[(tm >= HIT + 1.2) & (tm < SK.LEN - 0.5)])), 1)
    return out


def phone(x):
    m = x.mean(axis=1)
    m = signal.sosfilt(signal.butter(4, 180, 'high', fs=SR, output='sos'), m)
    m = signal.sosfilt(signal.butter(4, 9000, 'low', fs=SR, output='sos'), m)
    return np.stack([m, m], axis=1)


def spikes(x, thr=12.0):
    """samples where the 10 kHz high-passed signal jumps over thr x its local (20 ms) RMS and above -50 dBFS"""
    y = signal.sosfilt(signal.butter(4, 10000, 'high', fs=SR, output='sos'), x.mean(axis=1))
    w = int(0.02 * SR)
    rms = np.sqrt(np.convolve(y ** 2, np.ones(w) / w, mode='same')) + 1e-9
    return int(np.sum((np.abs(y) > thr * rms) & (np.abs(y) > 10 ** (-50 / 20))))


def loudest_block(x):
    tm, L = M.blocks(x, 0.4, 0.05)
    i = int(np.argmax(L))
    return round(float(tm[i]), 2), round(float(L[i]), 1)


def stopdown_db(x):
    """the stop's level (its 16th, minus 10 ms edges) against the body of bar 4, in dB of RMS"""
    a, b = int((STOP + 0.01) * SR), int((HIT - 0.01) * SR)
    body = x[int((at(4) + 0.2) * SR):int((STOP - 0.1) * SR)]
    return round(float(20 * np.log10(np.sqrt(np.mean(x[a:b] ** 2)) / np.sqrt(np.mean(body ** 2)) + 1e-12)), 1)


PCS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']
CHORDS = {'bar1': {'D', 'F', 'A'}, 'bar2': {'Bb', 'D', 'F'}, 'bar3': {'G', 'Bb', 'D'},
          'bar4': {'A', 'C#', 'E', 'G', 'D'}, 'hit': {'D', 'F', 'A'}}   # bar 4: A7 over the D pedal


def chroma(x):
    """the three strongest pitch classes per bar and in the hit's first 1.2 s, on the mono signal high-passed at
    180 Hz (so the kick and sub do not decide it), against the written chord (bar 4: A7 over the D pedal)"""
    m = signal.sosfilt(signal.butter(4, 180, 'high', fs=SR, output='sos'), x.mean(axis=1))
    spans = {f'bar{b}': (at(b) + 0.05, at(b + 1) - 0.15) for b in range(1, 5)}
    spans['hit'] = (HIT + 0.05, HIT + 1.25)
    out = {}
    for k, (a, b) in spans.items():
        seg = m[int(a * SR):int(b * SR)]
        X = np.abs(np.fft.rfft(seg * np.hanning(len(seg)))) ** 2
        f = np.fft.rfftfreq(len(seg), 1 / SR)
        sel = (f > 180) & (f < 2000)
        pc = np.round(12 * np.log2(f[sel] / 440.0)).astype(int) % 12
        e = np.bincount((pc + 9) % 12, weights=X[sel], minlength=12)
        top = [PCS[i] for i in np.argsort(e)[::-1][:3]]
        out[k] = {'top3': top, 'in_chord': all(t in CHORDS[k] for t in top)}
    return out


def decode(path):
    out = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         check=True, stdout=subprocess.PIPE).stdout
    return np.frombuffer(out, dtype='<f4').reshape(-1, 2).astype(np.float64)


def report(path):
    x, sr = sf.read(path, always_2d=True)
    info = sf.info(path)
    ph = phone(x)
    a, p = arc(x), arc(ph)
    above = np.flatnonzero(np.abs(x).max(axis=1) > 10 ** (-60 / 20))
    mid = np.repeat(x.mean(axis=1, keepdims=True), 2, axis=1)
    lufs = M.integrated(x)
    return {
        'file': os.path.basename(path), 'sr': sr, 'subtype': info.subtype, 'channels': x.shape[1],
        'seconds': round(len(x) / sr, 3), 'lufs': round(lufs, 2), 'true_peak_dbtp': round(M.true_peak_db(x), 2),
        'lra': round(M.lra(x), 2), 'arc': a, 'hit_over_bar4_lu': round(a['hit'] - a['bar4'], 1),
        'loudest_block': loudest_block(x), 'phone_arc': p, 'phone_loss_lu': round(M.integrated(ph) - lufs, 1),
        'phone_hit_over_bar4_lu': round(p['hit'] - p['bar4'], 1), 'bands_pct': SK.band_shares(x),
        'mono_fold_lu': round(M.integrated(mid) - lufs, 2), 'first_sound_s': round(float(above[0] / sr), 3),
        'last_sound_s': round(float(above[-1] / sr), 3), 'head_3ms_max': float(np.abs(x[:int(0.003 * sr)]).max()),
        'tail_480_zero': bool(np.all(x[-480:] == 0)), 'spikes_10k': spikes(x), 'stopdown_db': stopdown_db(x),
        'clipped': int(np.sum(np.abs(x) >= 0.9999)), 'chroma': chroma(x),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--a', required=True)
    ap.add_argument('--b', required=True)
    ap.add_argument('--m4a', required=True)
    ap.add_argument('--a-m4a')
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    res = {'A': report(a.a), 'B': report(a.b)}
    for k, f in (('B', a.m4a), ('A', a.a_m4a)):
        if f:
            y = decode(f)
            res[k]['m4a'] = {'lufs': round(M.integrated(y), 2), 'true_peak_dbtp': round(M.true_peak_db(y), 2)}
    b = res['B']
    fails = []
    if (b['sr'], b['subtype'], b['channels'], b['seconds']) != (48000, 'PCM_24', 2, 10.0):
        fails.append(f"format {b['sr']} {b['subtype']} {b['channels']} ch {b['seconds']} s")
    if abs(b['lufs'] + 14.0) > 0.1:
        fails.append(f"integrated {b['lufs']} LUFS")
    if b['true_peak_dbtp'] > -1.5 or b['m4a']['true_peak_dbtp'] > -1.5:
        fails.append(f"true peak WAV {b['true_peak_dbtp']} / AAC {b['m4a']['true_peak_dbtp']} dBTP")
    if not (b['hit_over_bar4_lu'] > 0 and abs(b['loudest_block'][0] - HIT) < 0.4):
        fails.append(f"the hit is not the loudest moment ({b['loudest_block']}, hit - bar4 {b['hit_over_bar4_lu']} LU)")
    if not (0.1 <= b['first_sound_s'] <= 0.2) or b['head_3ms_max'] > 1e-3 or not b['tail_480_zero']:
        fails.append(f"edges: first sound {b['first_sound_s']} s, head {b['head_3ms_max']:.2g}, "
                     f"tail zero {b['tail_480_zero']}")
    if not all(c['in_chord'] for c in b['chroma'].values()):
        fails.append(f"chroma: a bar's strongest pitch classes are not its chord tones ({b['chroma']})")
    if b['spikes_10k'] or b['clipped']:
        fails.append(f"{b['spikes_10k']} spikes in the 10 kHz band, {b['clipped']} clipped samples")
    res['fails'] = fails
    with open(a.out, 'w') as fh:
        json.dump(res, fh, indent=1)
    for k in ('A', 'B'):
        r = res[k]
        m4a = f"  AAC I {r['m4a']['lufs']} TP {r['m4a']['true_peak_dbtp']}" if 'm4a' in r else ''
        print(f"  {k} {r['file']}: I {r['lufs']} LUFS TP {r['true_peak_dbtp']} dBTP LRA {r['lra']}{m4a}")
        print(f"     arc {r['arc']}  phone {r['phone_arc']} (loss {r['phone_loss_lu']} LU)")
        print(f"     loudest {r['loudest_block']}  stop {r['stopdown_db']} dB  mono {r['mono_fold_lu']} LU  "
              f"first {r['first_sound_s']} s  last {r['last_sound_s']} s  spikes {r['spikes_10k']}  "
              f"bands {r['bands_pct']}")
        print('     chroma ' + '  '.join(f"{k} {'/'.join(v['top3'])}{'' if v['in_chord'] else ' (!)'}"
                                     for k, v in r['chroma'].items()))
    if fails:
        print('verify: FAIL: ' + '; '.join(fails))
        sys.exit(1)
    print('verify: every fixed constraint holds for B')


if __name__ == '__main__':
    main()
