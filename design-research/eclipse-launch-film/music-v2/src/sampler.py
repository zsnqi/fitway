"""
sampler.py: plays the CC0 recorded instruments of VSCO-2 Community Edition (fetched by fetch-samples.sh into
FILM/vendor/samples/vsco2ce at a pinned commit) from code. Nothing here is a performance or a loop: each call
plays one recorded note, and the notes, timing, dynamics and mix are written in drive_v2.py.

  Instrument   one articulation of one instrument: its zones (keycentre, dynamic layer, round robin, file),
               chosen per note by the nearest keycentre, so no note is shifted by more than two semitones
  load         a file as float64 stereo at 48 kHz, pitch-shifted by resampling (resample_poly, an exact
               rational ratio within 0.01 cent), normalised to a fixed level, cached
  attack_point where the note speaks: its envelope's first -12 dB point, so a spiccato lands on the grid by
               its bite, not by its file start (strings speak 30-75 ms into the file)

The sample files are untrusted data: they are only ever read with soundfile, never executed, and the score is
run with `python -I`. File names follow VSCO's octave convention (MIDI 60 = C3, so a file named D2 sounds D3);
note numbers in this code are MIDI, written in scientific pitch in the comments (MIDI 62 = D4).
"""
import glob
import os
import re
from fractions import Fraction
from functools import lru_cache

import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.environ.get('VSCO_ROOT') or os.path.join(os.path.dirname(os.path.dirname(HERE)), 'vendor', 'samples',
                                                   'vsco2ce')
_PC = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}


def vsco_midi(name):
    """'D2' in a VSCO file name -> MIDI 50 (VSCO names MIDI 60 C3)"""
    m = re.fullmatch(r'([A-G]#?)(\d)', name)
    return 12 * (int(m.group(2)) + 2) + _PC[m.group(1)]


def check_root():
    if not os.path.isfile(os.path.join(ROOT, 'LICENSE')):
        raise SystemExit(f'sampler: no samples in {ROOT}: run music-v2/src/fetch-samples.sh first')


# ------------------------------------------------------------------------------------------
# loading
# ------------------------------------------------------------------------------------------
def _ratio(semis, sr_in):
    """the resample_poly (up, down) that converts sr_in to 48 kHz and raises the pitch by `semis`"""
    r = Fraction(SR, sr_in) * Fraction(2 ** (-semis / 12.0)).limit_denominator(4000)
    r = r.limit_denominator(4000)
    return r.numerator, r.denominator


@lru_cache(maxsize=512)
def _raw(path, semis):
    x, sr = sf.read(path, always_2d=True, dtype='float64')
    if x.shape[1] == 1:
        x = np.repeat(x, 2, axis=1)
    x = x[:, :2]
    up, down = _ratio(semis, sr)
    if (up, down) != (1, 1):
        x = signal.resample_poly(x, up, down, axis=0, window=('kaiser', 8.0))
    return x


def _env(m, tau=0.003):
    a = np.exp(-1 / (tau * SR))
    return np.sqrt(np.maximum(signal.lfilter([1 - a], [1, -a], m ** 2), 0))


@lru_cache(maxsize=512)
def _meta(path, semis, norm):
    """(gain to the reference level, attack point in s). norm 'peak': the loudest 100 ms (one-shots);
    'body': the median 100 ms level between 0.4 and 3.0 s (sustains, whose attack differs per layer)"""
    x = _raw(path, semis)
    m = x.mean(axis=1)
    h = int(0.1 * SR)
    p = np.cumsum(np.concatenate([[0.0], m ** 2]))
    if norm == 'body':
        a, b = int(0.4 * SR), min(len(m) - h, int(3.0 * SR))
        lv = np.median((p[a + h:b + h:h // 4] - p[a:b:h // 4]) / h) if b > a else np.mean(m ** 2)
    else:
        lv = np.max((p[h:] - p[:-h]) / h)
    gain = 10 ** (-20 / 20) / np.sqrt(max(lv, 1e-12))
    e = _env(m)
    att = int(np.argmax(e >= e.max() * 10 ** (-12 / 20))) / SR
    return float(gain), float(min(att, 0.09))


def load(path, semis=0.0, norm='peak'):
    """(audio at the reference level -20 dBFS RMS, attack point in s); the cached array is never modified"""
    g, att = _meta(path, float(semis), norm)
    return _raw(path, float(semis)) * g, att


# ------------------------------------------------------------------------------------------
# instruments
# ------------------------------------------------------------------------------------------
class Instrument:
    """One articulation: files matching `pattern` (a glob under ROOT) whose basename matches `rx`, a regex with
    the groups note (a VSCO note name), layer (dynamic layer number) and optionally rr (round robin); `key`
    maps the match groups to a MIDI keycentre where the file name carries no note (the upright piano)."""

    def __init__(self, name, pattern, rx, norm='peak', max_shift=2.0, key=None):
        self.name, self.norm, self.max_shift = name, norm, max_shift
        self.zones = []
        for p in sorted(glob.glob(os.path.join(ROOT, pattern))):
            m = re.fullmatch(rx, os.path.basename(p))
            if not m:
                continue
            d = m.groupdict()
            midi = key(d) if key else vsco_midi(d['note'])
            self.zones.append(dict(midi=midi, layer=int(d['layer']), rr=int(d.get('rr') or 1), path=p))
        if not self.zones:
            raise SystemExit(f'sampler: {name}: no files match {pattern}')
        self.layers = sorted({z['layer'] for z in self.zones})

    def zone(self, midi, layer, rr=0):
        """the file and the shift for one note: the nearest keycentre in that layer (ties: shift down, which
        keeps the formants lower and warmer), then the round robin rr (cycled)"""
        cand = [z for z in self.zones if z['layer'] == layer] or self.zones
        best = min(abs(z['midi'] - midi) for z in cand)
        near = [z for z in cand if abs(z['midi'] - midi) == best]
        keys = sorted({z['midi'] for z in near}, key=lambda k: (k - midi) < 0)   # a keycentre above first
        near = [z for z in near if z['midi'] == keys[0]]
        z = sorted(near, key=lambda z: z['rr'])[rr % len(near)]
        shift = midi - z['midi']
        if abs(shift) > self.max_shift:
            raise ValueError(f'{self.name}: MIDI {midi} is {shift:+} semitones from the nearest file')
        return z['path'], float(shift)

    def note(self, midi, layer, rr=0):
        path, shift = self.zone(midi, layer, rr)
        return load(path, shift, self.norm)


def one_shot(relpath, semis=0.0, norm='peak'):
    p = os.path.join(ROOT, relpath)
    if not os.path.isfile(p):
        raise SystemExit(f'sampler: missing {relpath}: run fetch-samples.sh')
    return load(p, semis, norm)


# ------------------------------------------------------------------------------------------
# shaping
# ------------------------------------------------------------------------------------------
def shape(x, start=0.0, hold=None, release=0.12, attack=0.0, gain=1.0, reverse=False):
    """a copy of x from `start` s, `hold` s long, then a raised-cosine release; an optional fade-in"""
    i = int(round(start * SR))
    y = x[i:] if not reverse else x[::-1][i:]
    if hold is not None:
        n_hold, n_rel = int(round(hold * SR)), int(round(release * SR))
        y = y[:n_hold + n_rel].copy()
        if n_rel > 1 and len(y) > n_hold:
            k = len(y) - n_hold
            y[n_hold:] *= (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, n_rel)))[:k, None]
    else:
        y = y.copy()
    if attack > 0:
        k = min(len(y), int(attack * SR))
        y[:k] *= (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, k)))[:, None]
    return y * gain


def curve(n, points):
    """a gain curve of n samples through (time s, dB) points, linear in dB between them"""
    t = np.arange(n) / SR
    ts, ds = zip(*points)
    return (10 ** (np.interp(t, ts, ds) / 20))[:, None]
