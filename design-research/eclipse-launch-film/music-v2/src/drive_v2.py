#!/usr/bin/env python3
"""
drive_v2.py: Drive v2, a 10 s music sketch for the Eclipse launch film. It keeps Drive's frame (128 BPM, 4/4,
D minor, Dm | Bb/D | Gm/D | A7/D over a D pedal, four bars and a hit on the downbeat of bar 5 at 7.60 s, a 16th
dead stop before it, a tonal tail) and moves its character from synthwave toward a warm cinematic pulse.

What plays (the notes, timing, dynamics and mix are all code; NOTES.md has the chart):
  bass     the rolling 16th drive, now a cello section playing spiccato (VSCO-2 CE, CC0): the soft layer in
           bars 1-2, the full layer on the accents in the lift; a code sine sub on D1 under bars 2-4
  keys     an upright piano (VSCO-2 CE): an 8th pulse on the D octave from bar 1, with a 3+3+2 cell of chord
           tones on top from bar 2; a low D and the Dm chord on the hit, the pedal lifting after 0.9 s so the tail
           resolves
  strings  the chords as sustained viola and violin sections (VSCO-2 CE), soft in bars 1-2 and full in the lift,
           over a quiet warm code pad (the sketch's own pad voice)
  drums    a soft tuned code kick over a recorded concert bass drum (1 and 3 in bar 2, every beat in the lift),
           a recorded orchestral snare on the backbeats, a 16th build of recorded snare hits into the stop, and a
           recorded tambourine on the lift's offbeats
  fx       the riser, now tonal: a string tremolo crescendo on A7 and a reversed piano D, both cut into the stop
           (no noise riser, no whoosh)
  hit      led by the piano (keys): its low D octave and the Dm chord struck hard; under it the recorded concert
           bass drum and a snare crack, two soft timpani on D, a low spiccato chord (cellos and violas), the low
           strings held through the tail, and a code sub that falls from D2 to D1

The DSP (filters, the computed hall, the code kick and pad) and the master chain are the sketches' own (voices.py
on cinetic's synth.py and master.py), and the measurements are sketches.py's. Every random choice is seeded, so
two renders are identical.

Usage: python -I drive_v2.py --out DIR [--stems]
Writes DIR/drive-v2.wav (48 kHz, 24-bit, stereo), DIR/stems/*.wav (with --stems) and DIR/measurements.json.
"""
import argparse
import json
import os
import sys

sys.dont_write_bytecode = True  # no caches in this folder, the sketches' folder or the cinetic clone
HERE = os.path.dirname(os.path.abspath(__file__))
FILM = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(FILM, 'music-sketches', 'src'))

import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402

import sampler as SM  # noqa: E402
import sketches as SK  # noqa: E402  (the sketches' grid, measurements and band shares)
import voices as V  # noqa: E402

S, M, SR = V.S, V.M, V.SR
BPM, BEAT, BAR, T0, LEN, HIT = SK.BPM, SK.BEAT, SK.BAR, SK.T0, SK.LEN, SK.HIT
LUFS, CEILING, END_FADE, PRE_LUFS = SK.LUFS, SK.CEILING, SK.END_FADE, SK.PRE_LUFS
at = SK.at
GAP = BEAT / 4                       # one 16th of dead stop before the hit
STOP = HIT - GAP                     # 7.483 s
SEED = 44
STEMS = ('bass', 'drums', 'strings', 'keys', 'fx', 'hit')

# MIDI notes (scientific pitch: 62 = D4)
SPEC = dict(
    title='Drive v2',
    tempo='128 BPM, 4/4, D minor; bar n starts at 0.10 + 1.875 (n - 1) s; the hit at 7.60 s',
    chords=['Dm', 'Bb/D', 'Gm/D', 'A7/D', 'Dm: the hit'],
    ostinato=[38, 38, 50, 38],                               # the cellos' 16ths per beat: D2 D2 D3 D2
    pulse=[62, 74],                                          # the piano's 8ths: D4 + D5
    cell=[None, [65, 70, 74], [67, 70, 74], [69, 73, 76]],   # its 3-note cell per bar, cycled in 8ths
    strings={'viola': [57, 58, 58, 57], 'violin 2': [62, 62, 62, 61], 'violin 1': [65, 65, 67, 67],
             'violin 1 high': [None, None, 74, 76]},         # bars 1-4, None = rest
    pad=[[50, 57, 62, 65], [50, 58, 62, 65], [50, 58, 62, 67], [50, 57, 61, 64]],
    swell=[57, 61, 64, 67, 69],                              # bar 4 tremolo: A3 C#4 E4 G4 A4
    hit_chord=[('cello_spic', 38), ('cello_spic', 50), ('viola_spic', 57), ('viola_spic', 62)],  # D2 D3 A3 D4
    # the piano's hit: (note, dynamic layer, velocity), D1 D2 D3 F3 A3 D4 F4. The low D1 is softer than the D2 above
    # it (struck hard, its 7th partial, a flat C at 257 Hz, outweighed the chord's F in the chroma check), and the
    # minor third is doubled (F3, F4), because the low strings' D octave carries a strong 5th partial (F#, 734 Hz)
    hit_piano=[(26, 2, 0.72), (38, 3, 0.86), (50, 2, 0.7), (53, 2, 0.7), (57, 2, 0.62), (62, 2, 0.62), (65, 2, 0.78)],
    hit_tail=[('bass_sus', 38), ('cello_sus', 50)],          # D2 D3, held through the tail
)


# ------------------------------------------------------------------------------------------
# instruments (VSCO-2 CE, CC0)
# ------------------------------------------------------------------------------------------
def instruments():
    SM.check_root()
    N = r'(?P<note>[A-G]#?\d)'
    I = SM.Instrument
    return dict(
        cello_spic=I('cello section spiccato', 'Strings/Cello Section/spic/*.wav',
                     rf'spic_{N}_v(?P<layer>\d)_RR(?P<rr>\d)\.wav'),
        viola_spic=I('viola section spiccato', 'Strings/Viola Section/spic/*.wav',
                     rf'Violas_spic_{N}_v(?P<layer>\d)_rr(?P<rr>\d)\.wav'),
        bass_sus=I('contrabass sustain', 'Strings/Solo Contrabass/SusVib/*.wav',
                   rf'BKCtbss_SusVib_{N}_v(?P<layer>\d)_rr(?P<rr>\d)\.wav', norm='body'),
        cello_sus=I('cello section sustain', 'Strings/Cello Section/susvib/*.wav',
                    rf'susvib_{N}_v(?P<layer>\d)_1\.wav', norm='body'),
        viola_sus=I('viola section sustain', 'Strings/Viola Section/susvib/*.wav',
                    rf'ViolaEns_susvib_{N}_v(?P<layer>\d)_1\.wav', norm='body'),
        violin_sus=I('violin section sustain', 'Strings/Violin Section/susVib/*.wav',
                     rf'VlnEns_susVib_{N}_v(?P<layer>\d)\.wav', norm='body'),
        viola_trem=I('viola section tremolo', 'Strings/Viola Section/trem/*.wav',
                     rf'Violas_trem_{N}_v(?P<layer>\d)_rr(?P<rr>\d)\.wav', norm='body'),
        violin_trem=I('violin section tremolo', 'Strings/Violin Section/Trem/*.wav',
                      rf'VlnEns_Trem_{N}_v(?P<layer>\d)\.wav', norm='body'),
        # the upright's files are numbered, not named: keycentre 21 + 2 x index (VSCO's UprightPiano.sfz)
        piano=I('upright piano', 'Keys/Upright Piano/Player_dyn*.wav',
                r'Player_dyn(?P<layer>\d)_rr(?P<rr>\d)_(?P<idx>\d{3})\.wav', key=lambda d: 21 + 2 * int(d['idx'])),
    )


# timpani tunings, measured on the files (principal tone): drum 3 sits at D3 -50 cents, drum 1 at F#2 -10 cents
TIMP_D3 = 0.50          # semitones that bring drum 3 to D3
TIMP_D2 = -3.90         # and drum 1 down to D2, for the low boom of the hit


# ------------------------------------------------------------------------------------------
# the score
# ------------------------------------------------------------------------------------------
class Score:
    """Buses named 'stem/part'. Each bus has a dry buffer and a reverb send; post buses start at the hit and are
    not silenced by the stop."""

    def __init__(self, rng):
        self.n = S.ns(LEN)
        self.rng = rng
        self.dry, self.send, self.post = {}, {}, set()
        self.kicks = []
        self.rr = {}
        self.I = instruments()

    def put(self, bus, x, t, gain=1.0, pan=0.0, send=0.0, post=False):
        """add x (mono or stereo) at t s; pan: constant-power balance; send: the reverb send level"""
        if bus not in self.dry:
            self.dry[bus] = np.zeros((self.n, 2))
            self.send[bus] = np.zeros((self.n, 2))
        if post:
            self.post.add(bus)
        if x.ndim == 1:
            x = S.pan2(x, pan)
        elif pan:
            a = (float(np.clip(pan, -1, 1)) + 1) * np.pi / 4
            x = x * np.array([np.cos(a), np.sin(a)]) * np.sqrt(2)
        S.place(self.dry[bus], x, t, gain)
        if send:
            S.place(self.send[bus], x, t, gain * send)

    def next_rr(self, key):
        self.rr[key] = self.rr.get(key, -1) + 1
        return self.rr[key]

    def jitter(self, sd=0.003, lim=0.006):
        return float(np.clip(self.rng.normal(0, sd), -lim, lim))

    def vel(self, v, sd=0.03):
        return float(np.clip(v + self.rng.normal(0, sd), 0.05, 1.0))

    def short(self, inst, midi, layer, t, gain, bus, hold=0.22, release=0.25, pan=0.0, send=0.0, post=False):
        """one recorded note whose attack point lands on t, held `hold` s and released; nothing starts before the
        first downbeat (the opening notes speak a few ms late instead)"""
        x, att = self.I[inst].note(midi, layer, self.next_rr((inst, midi, layer)))
        self.put(bus, SM.shape(x, hold=hold, release=release), max(t - att, T0), gain, pan, send, post)

    def sustain(self, inst, midi, layer, t0, t1, gain, bus, release=0.15, attack=0.0, pan=0.0, send=0.0,
                post=False, env=None):
        """one sustained recorded note from t0 (its file start) held to t1, then released; env: a gain curve over
        the note's own time (sampler.curve)"""
        x, _ = self.I[inst].note(midi, layer, 0)
        y = SM.shape(x, hold=t1 - t0, release=release, attack=attack)
        if env is not None:
            y = y * env(len(y))
        self.put(bus, y, t0, gain, pan, send, post)


def db(v):
    return 10 ** (v / 20)


def bass(sc):
    """the rolling 16th drive: cellos spiccato on the D pedal, the soft layer until the lift; a sine sub on D1"""
    accents = [[0.60, 0.40, 0.52, 0.44], [0.68, 0.46, 0.60, 0.50], [0.86, 0.62, 0.80, 0.66], [0.92, 0.68, 0.86, 0.72]]
    for b in range(4):
        for p in range(16):
            if b == 3 and p == 15:
                continue                                    # the 16th of dead stop
            q = p % 4
            v = sc.vel(accents[b][q] * (1 + 0.025 * (p // 4) * (b == 3)))
            layer = 2 if v >= 0.76 else 1                   # only the lift's accents reach the full layer
            t = at(b + 1, p / 4) + sc.jitter()
            sc.short('cello_spic', SPEC['ostinato'][q], layer, t, v ** 1.5, 'bass/cello', hold=0.2, release=0.22,
                     pan=0.2, send=0.10)
    d = STOP - at(2)
    sub = V.sub_note(26, d, attack=0.25, release=0.01, h2=0.25)
    ramp = SM.curve(len(sub), [(0, -8), (BAR, -4), (2 * BAR, -1.5), (d, 0)])
    sc.put('bass/sub', sub[:, None] * ramp * np.ones((1, 2)), at(2), 1.0)


def keys(sc):
    """the upright: 8ths on the D octave from bar 1, a 3+3+2 cell of chord tones on top from bar 2; the hit"""
    for b in range(4):
        for p in range(8):
            if b == 3 and p == 7:
                continue                                    # the 8th that holds the stop
            t = at(b + 1, p / 2) + (0.0 if p == 0 else sc.jitter(0.003, 0.006))
            down = p % 2 == 0
            cell = SPEC['cell'][b]
            top = cell[p % 3] if cell else None
            for m in SPEC['pulse']:
                if m == top:
                    continue                                # the cell's note takes this one
                sc.short('piano', m, 1 if b < 2 else 2, t, (0.5 + 0.1 * b) * (1.0 if down else 0.8), 'keys/pulse',
                         hold=0.18, release=0.12, send=0.2)
            if top is not None:
                acc = p in (0, 3, 6)
                v = sc.vel([0, (0.34, 0.26), (0.46, 0.34), (0.56, 0.42)][b][0 if acc else 1], 0.02)
                sc.short('piano', top, 1 if v < 0.5 else 2, t, v ** 1.4, 'keys/cell', hold=0.42, release=0.3,
                         pan=float(np.clip((top - 66) / 20, -0.3, 0.3)), send=0.35)
    for k, (m, layer, v) in enumerate(SPEC['hit_piano']):
        sc.short('piano', m, layer, HIT + 0.006 * k, v ** 1.4, 'keys/hit', hold=0.9, release=0.9,
                 pan=float(np.clip((m - 55) / 30, -0.3, 0.3)), send=0.35, post=True)


def strings(sc):
    """the chords as sustained sections, soft (v1) in bars 1-2 and full (v2) in the lift, tied where a voice holds
    its note; a quiet code pad under them"""
    inst = {'viola': 'viola_sus', 'violin 2': 'violin_sus', 'violin 1': 'violin_sus', 'violin 1 high': 'violin_sus'}
    pan = {'viola': 0.15, 'violin 2': -0.2, 'violin 1': -0.35, 'violin 1 high': -0.3}
    bar_db = [-9, -6, -9.5, -7]                             # the full layer is brighter, so the lift starts lower
    for voice, line in SPEC['strings'].items():
        b = 0
        while b < 4:
            m = line[b]
            if m is None:
                b += 1
                continue
            layer = 1 if b < 2 else 2
            e = b
            while e + 1 < 4 and line[e + 1] == m and (1 if e + 1 < 2 else 2) == layer:
                e += 1
            t0, t1 = at(b + 1), (at(e + 2) if e < 3 else STOP)
            pts = [(0.0, bar_db[b])] + [(at(k + 1) - t0, bar_db[k]) for k in range(b + 1, e + 1)]
            pts.append((t1 - t0 + 1.0, bar_db[e] + (1.5 if e == 3 else 0)))
            pre = 0.06 if layer == 1 and b > 0 else 0.0
            sc.sustain(inst[voice], m, layer, t0 - pre, t1, 1.0, 'strings/chords', release=0.18 if e < 3 else 0.02,
                       attack=0.0 if b == 0 else 0.04, pan=pan[voice], send=0.35,
                       env=lambda n, pts=pts: SM.curve(n, pts))
            b = e + 1
    cuts = [(480, 620), (620, 820), (900, 1300), (1300, 2000)]
    for b in range(4):
        sc.put('strings/pad', V.pad_chord(SPEC['pad'][b], BAR if b < 3 else BAR - GAP, cuts[b], 0.5,
                                          attack=0.2 if b == 0 else 0.08, release=0.3 if b < 3 else 0.02,
                                          seed=1000 + b, detune=9, q=0.9), at(b + 1),
               db(-2) * [0.6, 0.72, 0.95, 1.0][b], send=0.25)


def drums(sc):
    """a tuned soft kick over a concert bass drum, the snare on the backbeats, a 16th build into the stop, a
    tambourine on the lift's offbeats"""
    pattern = {1: (0, 2), 2: (0, 1, 2, 3), 3: (0, 1, 2, 3)}
    level = {1: 0.72, 2: 0.86, 3: 1.0}
    for b, beats in pattern.items():
        for q in beats:
            t = at(b + 1, q)
            w = level[b]
            sc.put('drums/kick', V.kick(start=150, tau_p=0.028, tau_a=0.17, beater=0.03, beater_lp=900, click=0.0,
                                        drive=1.2, seed=2200 + b * 4 + q), t, w)
            bd, att = SM.one_shot(f'Percussion/BDrumNewhit_v{4 if b < 3 else 5}_rr{1 + q % 2}_Sum.wav')
            sc.put('drums/bassdrum', SM.shape(bd, hold=0.22, release=0.18), t - att * 0.5, w, send=0.08)
            sc.kicks.append((t, w))
    for k, (b, q) in enumerate([(3, 1), (3, 3), (4, 1)]):
        x, att = SM.one_shot(f'Percussion/Snare2-HitSN_v7_rr{1 + k % 2}_Sum.wav')
        sc.put('drums/snare', x, at(b, q) + sc.jitter(0.002, 0.004) - att * 0.3, 1.0, pan=-0.05, send=0.35)
    layers = [1, 1, 3, 3, 5, 7, 9]                          # the build climbs the snare's dynamic layers
    for k in range(7):
        x, att = SM.one_shot(f'Percussion/Snare2-HitSN_v{layers[k]}_rr{1 + k % 2}_Sum.wav')
        sc.put('drums/snare', x, at(4, 2 + k * 0.25) + sc.jitter(0.002, 0.004) - att * 0.3,
               db(-14 + 14 * (k / 6) ** 1.3), pan=-0.05, send=0.3)
    for b in (2, 3):
        for q in (0.5, 1.5, 2.5, 3.5):
            if b == 3 and q > 3:
                continue
            x, att = SM.one_shot(f'Percussion/Tamb1-Hit_v{1 + (q > 2)}_rr{1 + int(q) % 2}_Sum.wav')
            sc.put('drums/tambourine', SM.shape(x, hold=0.25, release=0.15), at(b + 1, q) + sc.jitter() - att * 0.5,
                   sc.vel(0.8 if b == 3 else 0.65, 0.05), pan=0.25, send=0.2)


def fx(sc):
    """the riser, tonal: strings tremolo on A7 swelling through bar 4 and a reversed piano D over its last 0.6 s,
    both cut into the stop"""
    t0 = at(4)
    d = STOP - t0
    swell = lambda n: SM.curve(n, [(0, -30), (0.5 * d, -16), (0.85 * d, -6), (d, 0)])  # noqa: E731
    for m in SPEC['swell']:
        sc.sustain('viola_trem' if m < 62 else 'violin_trem', m, 2, t0, STOP, db(-8), 'fx/tremolo', release=0.01,
                   pan=0.15 if m < 62 else -0.3, send=0.3, env=swell)
    for m in (38, 50):
        x, _ = sc.I['piano'].note(m, 3)
        r = SM.shape(x[:S.ns(2.0)], reverse=True)[-S.ns(0.6):]
        sc.put('fx/reverse', r * SM.curve(len(r), [(0, -24), (0.6, 0)]), STOP - 0.6, db(-6), send=0.25)


def hit(sc):
    """the downbeat of bar 5, under the piano's chord (keys): the bass drum, a snare crack, soft timpani on D3 and
    D2, a low spiccato chord, the low strings held, and a sub that falls from D2 to D1 in 50 ms and dies in about
    2 s (saturated, so phones hear its harmonics)"""
    t = HIT
    x, att = SM.one_shot('Percussion/BDrumNewhit_v7_rr1_Sum.wav')
    sc.put('hit/bassdrum', x, t - att * 0.3, 1.0, send=0.15, post=True)
    x, att = SM.one_shot('Percussion/Snare2-HitSN_v9_rr1_Sum.wav')
    sc.put('hit/snare', x, t - att * 0.3, 1.0, pan=-0.05, send=0.45, post=True)
    x, att = SM.one_shot('Percussion/Timpani/Timpani3_Hit_v3_rr1_Sum.wav', TIMP_D3)
    sc.put('hit/timpani', x, t - att * 0.3, db(-1), send=0.25, post=True)
    x, att = SM.one_shot('Percussion/Timpani/Timpani1_Hit_v3_rr1_Sum.wav', TIMP_D2)
    sc.put('hit/timpani', x, t - att * 0.3, db(-6), send=0.2, post=True)
    for inst, m in SPEC['hit_chord']:
        sc.short(inst, m, 2, t, db(-6), 'hit/strings', hold=0.5, release=0.6, pan=0.2 if m < 55 else 0.1, send=0.4,
                 post=True)
    tail = lambda n: SM.curve(n, [(0, 0), (0.25, -3), (1.4, -10), (2.4, -24)])  # noqa: E731
    for inst, m in SPEC['hit_tail']:
        sc.sustain(inst, m, 3, t, LEN, db(-10), 'hit/tail', release=0.02, pan=0.3 if m < 45 else 0.2, send=0.25,
                   post=True, env=tail)
    n = S.ns(2.3)
    tt = np.arange(n) / SR
    f = 36.71 + (73.42 - 36.71) * np.exp(-tt / 0.05)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.75) * (1 - np.exp(-tt / 0.002))
    sc.put('hit/sub', np.tanh(1.6 * s) / np.tanh(1.6), t, db(-4), post=True)


# ------------------------------------------------------------------------------------------
# mix, master, measure
# ------------------------------------------------------------------------------------------
GAINS = {'bass/cello': -4.0, 'bass/sub': -16.0,
         'keys/pulse': 2.0, 'keys/cell': -1.0, 'keys/hit': 12.5,
         'strings/chords': -5.0, 'strings/pad': -8.0,
         'drums/kick': -6.0, 'drums/bassdrum': -5.0, 'drums/snare': -7.0, 'drums/tambourine': -10.0,
         'fx/tremolo': -7.0, 'fx/reverse': -10.0,
         'hit/bassdrum': 4.5, 'hit/snare': 0.5, 'hit/timpani': 0.5, 'hit/strings': 2.5, 'hit/tail': 3.5,
         'hit/sub': -6.5}
HP = {'strings/chords': 110, 'keys/cell': 120, 'fx/tremolo': 120}            # Hz: keep the lows to the bass
# a presence lift on the recorded piano and strings: the upright and the sections are dark, and the mix read 974 Hz
# bright (references 1169-3633 Hz); +6 dB above 2.5 kHz brings it to about 1260 Hz without moving its character
SHELF = {b: (2500, 6.0) for b in ('keys/pulse', 'keys/cell', 'keys/hit', 'strings/chords', 'hit/strings', 'fx/tremolo')}
SIDECHAIN = {'bass/sub': 0.6}                                             # depth under the kick
CELLO_LP = [(0.0, 1500), (at(2), 2400), (at(3), 9000)]                    # the drive opens bar by bar
WIDTH = {'strings': 0.6, 'keys': 0.7, 'fx': 0.6, 'hit': 0.7, 'drums': 0.9}  # side gain per stem: the recorded
#                                                                           sections are wide; phones play mono
AIR = 0.25                                                                # the master's air shelf (cinetic's default)


def gate(n, t0, floor_db=-60.0, ramp=0.012):
    """1 until t0 - ramp, then down to floor_db for good: the stop silences everything before the hit"""
    t = np.arange(n) / SR
    g = np.ones(n)
    fl = 10 ** (floor_db / 20)
    a = (t >= t0 - ramp) & (t < t0)
    g[a] = 1 - (1 - fl) * (0.5 - 0.5 * np.cos(np.pi * (t[a] - (t0 - ramp)) / ramp))
    g[t >= t0] = fl
    return g[:, None]


def width(x, side):
    mid = x.mean(axis=1, keepdims=True)
    return mid + (x - mid) * side


def render(seed=SEED):
    sc = Score(np.random.default_rng(seed))
    for part in (bass, keys, strings, drums, fx, hit):
        part(sc)
    n = sc.n
    g_stop = gate(n, STOP)
    stems = {k: np.zeros((n, 2)) for k in STEMS}
    for bus in sorted(sc.dry):
        g = db(GAINS.get(bus, 0.0))
        y, s = sc.dry[bus] * g, sc.send[bus] * g
        if bus == 'bass/cello':
            cut = np.interp(np.arange(n) / SR, [p[0] for p in CELLO_LP], [p[1] for p in CELLO_LP])
            y = V.vlp(y, cut, 0.707, stages=1, block=256)
            s = V.vlp(s, cut, 0.707, stages=1, block=256)
        if bus in HP:
            y, s = V.hp(y, HP[bus]), V.hp(s, HP[bus])
        if bus in SHELF:
            y, s = V.shelf_hi(y, *SHELF[bus]), V.shelf_hi(s, *SHELF[bus])
        if bus in SIDECHAIN:
            y = y * M.sidechain_times(sc.kicks, n, SIDECHAIN[bus], 0.12)
        out = y + (V.reverb(s) if np.any(s) else 0.0)
        if bus not in sc.post:
            out = out * g_stop
        stems[bus.split('/')[0]] += out
    stems = {k: width(v, WIDTH.get(k, 1.0)) for k, v in stems.items()}
    mix = sum(stems.values())
    g = 10 ** ((PRE_LUFS - M.integrated(mix)) / 20)
    mix = mix * g
    stems = {k: v * g for k, v in stems.items()}
    master, info = M.finish(mix, lufs=LUFS, ceiling=CEILING, mono_hz=120, comp=True, drive=1.1, air=AIR,
                            hp_hz=30, fade=END_FADE, end_fade=0.06, tail_zero=480)
    return master, info, stems


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[1])
    ap.add_argument('--out', required=True, help='folder for the master (gitignored)')
    ap.add_argument('--stems', action='store_true', help='also write the stems (pre-master, at the mix level)')
    a = ap.parse_args(argv)
    os.makedirs(a.out, exist_ok=True)
    master, info, stems = render()
    sf.write(os.path.join(a.out, 'drive-v2.wav'), master, SR, subtype='PCM_24')
    if a.stems:
        sd = os.path.join(a.out, 'stems')
        os.makedirs(sd, exist_ok=True)
        for k, x in stems.items():
            pk = float(np.abs(x).max())
            assert pk < 1.0, f'stem {k} peaks at {pk:.3f}'
            sf.write(os.path.join(sd, f'{k}.wav'), x, SR, subtype='PCM_24')
    rep = SK.measurements(master, info)
    rep['title'] = SPEC['title']
    rep['chords'] = SPEC['chords']
    rep['stem_lufs'] = {k: round(M.integrated(x), 1) for k, x in stems.items()}
    with open(os.path.join(a.out, 'measurements.json'), 'w') as fh:
        json.dump(rep, fh, indent=1)
    print(f"Drive v2  I {rep['lufs']:6.2f} LUFS  TP {rep['true_peak_db']:6.2f} dBTP  LRA {rep['lra']:4.1f}  "
          f"<60Hz {rep['below_60hz_pct']:4.1f}%  mono {rep['mono_fold_lu']:+.2f} LU  "
          f"side/mid {rep['side_to_mid_db']} dB  "
          f"lim {rep['limiter_max_gr_db']:.2f} dB")
    print(f"  arc {rep['momentary_lufs_by_section']}")
    print(f"  bands {rep['bands_pct']}")
    print(f"  stems {rep['stem_lufs']}")


if __name__ == '__main__':
    main()
