#!/usr/bin/env python3
"""
sketches.py: three ~10 s music sketches for the Eclipse launch film, rendered offline in numpy, mixed,
mastered with cinetic's master chain (master.finish: mono below 120 Hz, glue compressor, soft saturation,
loudness passes with a 4x oversampled true-peak limiter, edge fades) and measured.

  warm-pulse   cinematic and warm: sub, soft kick, detuned pads, a pulsing low synth ostinato
  piano-pulse  a felt-piano figure over a soft pulse; the lift adds snaps, claps and a bass line
  drive        tight percussion, a deep bass ostinato on a D pedal, a riser into a hit

All three are 128 BPM, 4/4, D minor: four bars (an intro of two, a lift of two), then one hit on the
downbeat of bar 5 with a tonal tail. The hits' low body is earshot's impact/punch tuned to D2 (and
cut_hit/sub for Drive), the Drive riser layers earshot's riser/dark; they are rendered once by the
earshot CLI into DIR/kit/ (pure DSP, no models). Everything else is code below, seeded.

Usage: python sketches.py --out DIR [--only NAME ...] [--stems]
Writes DIR/sketch-N-NAME.wav (48 kHz, 24-bit, stereo) and DIR/measurements.json.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy import signal

sys.dont_write_bytecode = True  # leave no caches here or in the cinetic clone
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import voices as V  # noqa: E402

S, M, SR = V.S, V.M, V.SR

BPM = 128
BEAT = 60.0 / BPM          # 0.46875 s
BAR = 4 * BEAT             # 1.875 s
T0 = 0.10                  # the first downbeat: audio starts within 0.2 s
LEN = 10.0                 # seconds, every sketch
HIT = T0 + 4 * BAR         # bar 5, beat 1: 7.6 s
LUFS = -14.0
CEILING = 10 ** (-2.0 / 20)  # limiter ceiling -2 dBFS (true peak, 4x oversampled), so the WAV holds <= -1.5 dBTP
END_FADE = 0.8             # RULES.md: audio fades over the last 0.8 s
PRE_LUFS = -20.0           # the mix's level going into the master chain
D2 = 38

EARSHOT = os.environ.get('EARSHOT') or shutil.which('earshot') or '/home/user/.venvs/earshot/bin/earshot'
KIT = {  # name: (bank id, knobs). Default seed = the bank's delivered final, so every render is identical.
    'impact': ('impact/punch', ['--pitch', 'D2']),
    'cut_sub': ('cut_hit/sub', ['--pitch', 'D2']),
    'riser': ('riser/dark', ['--dur', '1.4']),
}


def at(bar, beat=0.0):
    """time of bar (1-based) and beat (0-based, fractional: 0.25 = a 16th)"""
    return T0 + (bar - 1) * BAR + beat * BEAT


# ------------------------------------------------------------------------------------------
# the earshot kit
# ------------------------------------------------------------------------------------------
def load_kit(out_dir):
    kit_dir = os.path.join(out_dir, 'kit')
    os.makedirs(kit_dir, exist_ok=True)
    kit = {}
    for name, (sid, knobs) in KIT.items():
        path = os.path.join(kit_dir, f'{name}.wav')
        if not os.path.exists(path):
            try:
                subprocess.run([EARSHOT, 'sfx', 'render', sid, '-o', path] + knobs, check=True,
                               stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            except (OSError, subprocess.CalledProcessError) as e:
                print(f'WARNING: earshot could not render {sid} ({e}); its layer falls back to a synth voice',
                      file=sys.stderr)
                kit[name] = None
                continue
        x, sr = sf.read(path, always_2d=True)
        assert sr == SR, f'{path}: {sr} Hz'
        kit[name] = x
    return kit


def impact_layer(kit, name='impact'):
    x = kit.get(name)
    if x is None:  # fallback: cinetic's sub boom onto D2
        x = S.stereo(S.sub_boom(146.8, 73.4, 0.08, 2.4, 12, 0.7))
    return x


# ------------------------------------------------------------------------------------------
# the mix
# ------------------------------------------------------------------------------------------
class Mix:
    def __init__(self):
        self.n = S.ns(LEN)
        self.stems = {}
        self.kicks = []

    def bus(self, name):
        if name not in self.stems:
            self.stems[name] = np.zeros((self.n, 2))
        return self.stems[name]

    def add(self, name, x, t, gain=1.0, pan=0.0):
        S.place(self.bus(name), x, t, gain, pan)


def stopdown(n, t0, t1, floor_db, ramp=0.012):
    """gain (n, 1): 1 until t0 - ramp, down to floor_db at t0, held to t1, then 1 again"""
    t = np.arange(n) / SR
    g = np.ones(n)
    fl = 10 ** (floor_db / 20)
    a = (t >= t0 - ramp) & (t < t0)
    g[a] = 1 - (1 - fl) * (0.5 - 0.5 * np.cos(np.pi * (t[a] - (t0 - ramp)) / ramp))
    g[(t >= t0) & (t < t1)] = fl
    return g[:, None]


def human(rng, sd=0.003, lim=0.006):
    return float(np.clip(rng.normal(0, sd), -lim, lim))


# ------------------------------------------------------------------------------------------
# 1. warm pulse
# ------------------------------------------------------------------------------------------
WARM = dict(
    title='Warm pulse',
    chords=['Dm9', 'C6', 'Bbmaj9', 'A7sus4 -> A7 (beat 3)', 'Dm(add9): the hit'],
    bass=[38, 36, 34, 33],                                  # D2 C2 Bb1 A1: the lament line down to the V
    pads=[[53, 60, 64, 69], [55, 60, 64, 69], [53, 60, 62, 69], ([55, 62, 64, 69], [55, 61, 64, 69])],
    hit=[50, 57, 64, 65, 69, 74, 77],                       # D3 A3 E4 F4 A4 D5 F5
)


def warm_pulse(kit, rng):
    mx = Mix()
    gap = BEAT / 2                                          # the last 8th of bar 4 breathes before the hit
    cuts = [(600, 800), (800, 1300), (1800, 3000), (3000, 4500)]   # the rising filter
    widths = [0.3, 0.35, 0.85, 0.95]                                # the pad widens in the lift
    arc = [0.68, 0.8, 0.92, 1.0]                                    # the pad's level per bar
    for b in range(4):
        t = at(b + 1)
        v = WARM['pads'][b]
        if b < 3:
            mx.add('pad', V.pad_chord(v, BAR, cuts[b], widths[b], attack=0.3 if b == 0 else 0.12, release=0.45,
                                      seed=100 + b), t, arc[b])
        else:
            h = BAR / 2
            mx.add('pad', V.pad_chord(v[0], h, (cuts[3][0], 2800), widths[3], attack=0.1, release=0.12, seed=103), t)
            mx.add('pad', V.pad_chord(v[1], h - gap, (2800, cuts[3][1]), widths[3], attack=0.06, release=0.06,
                                      seed=104), t + h)
        if b >= 2:  # the added octave: the voicing an octave up, wider, more detuned, quieter
            oc = [m + 12 for m in (v if b < 3 else v[0])]
            d = BAR if b < 3 else BAR / 2
            mx.add('pad_oct', V.pad_chord(oc, d, (cuts[b][0] * 1.2, cuts[b][1] * 1.3), 1.0, detune=15, attack=0.2,
                                          release=0.3 if b < 3 else 0.1, seed=200 + b), t)
            if b == 3:
                oc2 = [m + 12 for m in v[1]]
                mx.add('pad_oct', V.pad_chord(oc2, BAR / 2 - gap, (3300, 4300), 1.0, detune=15, attack=0.05,
                                              release=0.06, seed=204), t + BAR / 2)
    # the ostinato: 8ths with 16th pickups into beats 3 and 1, on the root an octave above the bass
    grid = [(0, 1.0), (2, 0.7), (4, 0.85), (6, 0.7), (7, 0.5), (8, 0.95), (10, 0.7), (12, 0.85), (14, 0.7), (15, 0.5)]
    for b in range(4):
        m = WARM['bass'][b] + 12
        for p, vel in grid:
            if b == 0 and p in (7, 15):
                continue                                    # the intro bar: plain 8ths
            if b == 3 and p >= 14:
                continue                                    # the breath before the hit
            u = (b * 16 + p) / 64
            base = 240 + 160 * u if b < 2 else 420 + 520 * (u - 0.5) * 2
            env = 700 if b < 2 else 1500
            gate = 0.8 * (BEAT / 2 if p not in (7, 15) else BEAT / 4)
            x = V.pulse_note(m, gate, vel * (0.85 + 0.15 * (b >= 2)), base, env, 0.06, 1.15, seed=300 + b * 16 + p,
                             sub=0.15)
            mx.add('ostinato', x, at(b + 1, p / 4) + human(rng, 0.002, 0.004), [0.8, 0.9, 1.0, 1.0][b], 0.0)
    # sub: from bar 2
    for b in range(1, 4):
        d = BAR if b < 3 else BAR - gap
        mx.add('sub', V.sub_note(WARM['bass'][b], d, 0.06, 0.05 if b == 3 else 0.12), at(b + 1))
    # soft kick: 1 and 3 in bar 2, every beat in the lift
    for b in range(1, 4):
        for q in ((0, 2) if b == 1 else (0, 1, 2, 3)):
            w = 0.8 if b == 1 else 1.0
            mx.add('kick', V.kick(start=160, tau_a=0.19, beater=0.07, beater_lp=1300, seed=400 + b * 4 + q), at(b + 1, q),
                   w)
            mx.kicks.append((at(b + 1, q), w))
    # shaker: 16ths from bar 2, the 8th offbeat leaning, a light swing
    for b in range(1, 4):
        acc = [0.35, 0.2, 0.6, 0.25] if b == 1 else [0.5, 0.3, 0.8, 0.35]
        for p in range(16):
            if b == 3 and p >= 14:
                continue
            t = at(b + 1, p / 4) + (0.012 if p % 2 else 0.0) + human(rng)
            mx.add('perc', V.shaker(seed=500 + b * 16 + p), t, acc[p % 4] * 10 ** (rng.normal(0, 1.0) / 20), 0.3)
    # brushed snare on 2 and 4 in the lift
    for b in (2, 3):
        for q in (1, 3):
            mx.add('snare', V.snare(seed=600 + b * 4 + q, tight=False), at(b + 1, q) + human(rng), 1.0, -0.08)
    # the hit: soft kick, earshot's impact on D2, the pad's Dm(add9) struck and ringing, a last low pulse
    mx.add('hit', V.kick(start=180, tau_a=0.32, beater=0.09, beater_lp=1300, seed=450), HIT, 1.1)
    mx.add('hit_low', impact_layer(kit), HIT, 0.55)
    mx.add('hit_tone', V.pad_chord(WARM['hit'], 2.3, (3000, 1400), 0.9, attack=0.012, release=0.1, seed=150,
                                   decay=0.9), HIT, 1.0)
    mx.add('hit_tone', V.pulse_note(D2 + 12, 1.6, 1.0, 380, 1800, 0.12, 1.0, seed=350, sub=0.3, decay=0.35, sus=0.0),
           HIT, 0.9)
    mx.add('hit_low', V.sub_note(D2, 0.9, 0.008, 0.9), HIT, 0.7)
    mx.add('hit', V.tom(50, 1.4, seed=460, tau=0.42), HIT, 0.55)
    mx.add('hit_tone', V.snare(seed=470, tight=False, d=0.5), HIT, 0.5)
    gains = dict(pad=0.55, pad_oct=0.32, ostinato=0.75, sub=0.30, kick=0.62, perc=0.5, snare=1.3,
                 hit=0.75, hit_low=0.8, hit_tone=0.85)
    sends = dict(pad=0.30, pad_oct=0.45, ostinato=0.10, perc=0.25, snare=0.45, hit_tone=0.55, hit=0.18)
    sc = dict(pad=0.28, pad_oct=0.28, ostinato=0.45, sub=0.55)
    stop = dict(t0=HIT - gap, floor_db=-12, stems=('pad', 'pad_oct', 'ostinato', 'sub'), verb=False)
    return mx, gains, sends, sc, stop


# ------------------------------------------------------------------------------------------
# 2. piano pulse
# ------------------------------------------------------------------------------------------
PIANO = dict(
    title='Piano pulse',
    chords=['Dm7', 'Bbmaj7', 'F', 'C', 'Dm(add9): the hit'],
    bass=[38, 34, 41, 36],                                  # D2 Bb1 F2 C2 (left hand octaves)
    cells=[[65, 69, 72], [65, 69, 74], [65, 69, 72], [67, 72, 76]],   # the right-hand 3-note cell, cycled in 8ths
    lh5=[45, 41, 48, 43],                                   # the left hand's fifth on beat 3
    line=[[], [], [(0, 41, 3), (3, 41, 3), (6, 45, 2)], [(0, 36, 3), (3, 36, 3), (6, 40, 1)]],  # bass line, 8ths
    hit_lh=[38, 45, 53], hit_rh=[65, 69, 74, 76],          # D2 A2 F3 | F4 A4 D5 E5
)


def piano_pulse(kit, rng):
    mx = Mix()
    gap = BEAT / 2

    def note(m, t, vel, hold, seed, gain=1.0):
        x = V.felt_piano(m, vel, max(0.05, hold), seed, bright=1.15)
        mx.add('piano', x, t, gain, float(np.clip((m - 60) / 30, -0.35, 0.35)))

    for b in range(4):
        tb = at(b + 1)
        pedal = at(b + 2) + 0.04 if b < 3 else HIT - gap + 0.03    # pedal changes on each bar; lifts in the breath
        r = PIANO['bass'][b]
        lh = [0.42, 0.48, 0.55, 0.58][b]
        note(r, tb, lh, pedal - tb, 700 + b)
        note(r + 12, tb + 0.004, lh * 0.88, pedal - tb, 710 + b)
        note(PIANO['lh5'][b], at(b + 1, 2) + human(rng), lh * 0.75, pedal - at(b + 1, 2), 720 + b)
        cell = PIANO['cells'][b]
        for p in range(8):
            if b == 3 and p == 7:
                continue
            acc = p in (0, 3, 6)                             # 3 + 3 + 2 across the bar
            vel = [(0.44, 0.34), (0.5, 0.38), (0.6, 0.46), (0.66, 0.5)][b][0 if acc else 1] + rng.normal(0, 0.02)
            t = at(b + 1, p / 2) + (0.0 if p == 0 else human(rng, 0.004, 0.008))
            note(cell[p % 3], t, float(np.clip(vel, 0.3, 0.8)), pedal - t, 730 + b * 8 + p)
    # the soft pulse: a felt kick on every beat, softer in the intro
    for b in range(4):
        w = [0.35, 0.5, 0.8, 0.9][b]
        for q in range(4):
            mx.add('kick', V.kick(start=140, tau_a=0.16, beater=0.05, beater_lp=1000, seed=800 + b * 4 + q),
                   at(b + 1, q), w)
            mx.kicks.append((at(b + 1, q), w))
    # the lift: a bass line, snaps on 2 and 4, claps join in bar 4, a soft pad under them
    for b in (2, 3):
        for p8, m, dur8 in PIANO['line'][b]:
            d = dur8 * BEAT / 2 * 0.92
            mx.add('bass', V.warm_bass(m, d, 1.0 if p8 == 0 else 0.85, seed=900 + p8), at(b + 1, p8 / 2))
        for q in (1, 3):
            t = at(b + 1, q) + human(rng, 0.003, 0.005)
            mx.add('snap', V.snap(seed=950 + b * 4 + q), t, 1.0, 0.12)
            if b == 3:
                mx.add('clap', V.clap(seed=970 + q), t + 0.004, 1.0, -0.05)
        pv = [[57, 60, 65], [55, 60, 64]][b - 2]
        mx.add('pad', V.pad_chord(pv, BAR if b == 2 else BAR - gap, (900, 1300), 0.7, attack=0.25,
                                  release=0.4 if b == 2 else 0.06, seed=980 + b), at(b + 1))
    # the hit: the Dm(add9) chord rolled from the bass up, held on the pedal; a soft kick, the impact, the bass
    for k, m in enumerate(PIANO['hit_lh'] + PIANO['hit_rh']):
        note(m, HIT + 0.009 * k, [0.6, 0.5, 0.52, 0.6, 0.5, 0.6, 0.42][k], 2.6, 760 + k)
    mx.add('hit', V.kick(start=150, tau_a=0.26, beater=0.06, beater_lp=1000, seed=860), HIT, 1.0)
    mx.add('hit_low', impact_layer(kit), HIT, 0.4)
    mx.add('bass', V.warm_bass(D2, 1.9, 1.0, seed=990, decay=0.55, sus=0.0), HIT)
    mx.add('pad', V.pad_chord([57, 62, 65, 69], 2.3, (1400, 800), 0.8, attack=0.02, release=0.1, seed=990,
                              decay=1.0), HIT)
    gains = dict(piano=1.0, kick=0.5, bass=0.55, snap=3.0, clap=2.0, pad=0.28, hit=0.6, hit_low=0.9)
    sends = dict(piano=0.30, snap=0.30, clap=0.35, pad=0.4)
    sc = dict(pad=0.3, bass=0.2)
    stop = dict(t0=HIT - gap, floor_db=-12, stems=('pad', 'bass'), verb=False)
    return mx, gains, sends, sc, stop


# ------------------------------------------------------------------------------------------
# 3. drive
# ------------------------------------------------------------------------------------------
DRIVE = dict(
    title='Drive',
    chords=['Dm', 'Bb/D', 'Gm/D', 'A7/D', 'Dm: the hit'],
    pads=[[50, 57, 62, 65], [50, 58, 62, 65], [50, 58, 62, 67], [50, 57, 61, 64]],
    stabs=[[57, 62, 65], [58, 62, 65], [58, 62, 67], [57, 61, 64, 67]],
    hit=[50, 57, 62, 65, 69],
)


def drive(kit, rng):
    mx = Mix()
    gap = BEAT / 4                                          # one 16th of dead stop before the hit
    cuts = [(480, 620), (620, 820), (900, 1300), (1300, 2000)]
    for b in range(4):
        mx.add('pad', V.pad_chord(DRIVE['pads'][b], BAR if b < 3 else BAR - gap, cuts[b], 0.5,
                                  attack=0.2 if b == 0 else 0.08, release=0.3 if b < 3 else 0.02, seed=1000 + b,
                                  detune=9, q=0.9), at(b + 1), [0.6, 0.72, 0.95, 1.0][b])
    # the deep bass ostinato on a D pedal: 16ths in the intro bar, then rolling off the kick
    pitch = [38, 38, 50, 38]
    for b in range(4):
        for p in range(16):
            if b >= 1 and p % 4 == 0:
                continue
            if b == 3 and p >= 15:
                continue
            vel = [1.0, 0.6, 0.8, 0.65][p % 4] if b == 0 else [0, 0.85, 0.92, 0.72][p % 4]
            u = (b * 16 + p) / 64
            base = 200 + 80 * u * 4 if b == 0 else 300 + 600 * (u - 0.25) / 0.75
            env = 600 if b == 0 else 1500 + 700 * (b - 1) / 2
            x = V.pulse_note(pitch[p % 4], 0.8 * BEAT / 4, vel, base, env, 0.045, 1.25, seed=1100 + b * 16 + p,
                             sub=0.4, decay=0.06, sus=0.35, drive=1.6)
            mx.add('bass', x, at(b + 1, p / 4), [0.7, 0.9, 1.0, 1.0][b])
    # tight kick on every beat from bar 2
    for b in range(1, 4):
        for q in range(4):
            mx.add('kick', V.kick(start=220, tau_p=0.022, tau_a=0.14, beater=0.05, click=0.18, drive=1.5,
                                  seed=1200 + b * 4 + q), at(b + 1, q), 1.0)
            mx.kicks.append((at(b + 1, q), 1.0))
    # hats: 16ths throughout, open on the 8th offbeats in the lift
    for b in range(4):
        for p in range(16):
            if b == 3 and p >= 15:
                continue
            acc = ([0.25, 0.15, 0.55, 0.18] if b == 0 else [0.3, 0.18, 0.6, 0.2])[p % 4]
            open_ = b == 2 and p % 4 == 2
            x = V.hat(seed=1300 + b * 16 + p, tau=0.05 if open_ else 0.012, d=0.2 if open_ else 0.08)
            mx.add('hats', x, at(b + 1, p / 4) + human(rng, 0.002, 0.004),
                   acc * (0.7 if open_ else 1.0) * 10 ** (rng.normal(0, 1.0) / 20), 0.2 if p % 2 else -0.2)
    # snare on 2 and 4 in bar 3, on 2 in bar 4, then a 16th roll rising into the stop
    for b, qs in ((2, (1, 3)), (3, (1,))):
        for q in qs:
            mx.add('snare', V.snare(seed=1400 + b * 4 + q), at(b + 1, q), 1.0)
    for k in range(7):
        q = 2 + k * 0.25
        mx.add('snare', V.snare(seed=1450 + k, d=0.2), at(4, q), 0.2 + 0.32 * (k / 6) ** 1.4)
    # offbeat chord stabs in the lift
    for b in (2, 3):
        for q in (0.5, 1.5, 2.5, 3.5):
            if b == 3 and q > 3:
                continue
            for k, m in enumerate(DRIVE['stabs'][b]):
                x = V.pulse_note(m, 0.15, 0.8, 520, 2400, 0.05, 1.0, seed=1500 + b * 32 + int(q * 4) * 4 + k,
                                 decay=0.07, sus=0.25)
                mx.add('stabs', x, at(b + 1, q), 1.0, 0.3 * (1 if k % 2 else -1))
    # the riser: a rising noise band over bar 4 plus earshot's riser/dark, both cut into the stop
    end = HIT - gap
    nr = V.noise_riser(end - at(4), 350, 4200, seed=1600)
    mx.add('riser', nr, at(4), 1.0)
    rk = kit.get('riser')
    if rk is not None:
        env = np.abs(rk).max(axis=1)
        pk = int(np.argmax(signal.convolve(env, np.ones(240) / 240, mode='same')))
        cut = min(len(rk), pk + S.ns(0.02))
        rk = rk[:cut].copy()
        k = S.ns(0.015)
        rk[-k:] *= (np.cos(np.linspace(0, np.pi / 2, k)) ** 2)[:, None]
        mx.add('riser', rk, end - len(rk) / SR, 0.55)
    # the hit: a hard kick, earshot's cut_hit/sub and impact on D2, a struck Dm chord and a last bass note
    mx.add('hit', V.kick(start=230, tau_p=0.025, tau_a=0.3, beater=0.06, click=0.22, drive=1.6, seed=1250), HIT, 1.0)
    mx.add('hit_low', impact_layer(kit), HIT, 0.6)
    if kit.get('cut_sub') is not None:
        mx.add('hit_low', kit['cut_sub'], HIT, 0.45)
    for k, m in enumerate(DRIVE['hit']):
        mx.add('hit_tone', V.pulse_note(m, 1.9, 0.9, 480, 3200, 0.22, 0.9, seed=1700 + k, decay=0.55, sus=0.0),
               HIT, 0.5, 0.35 * ((k % 3) - 1))
    mx.add('hit_tone', V.pad_chord(DRIVE['hit'], 2.3, (2200, 900), 0.8, attack=0.01, release=0.1, seed=1750,
                                   decay=0.85, detune=9), HIT, 0.9)
    mx.add('hit_low', V.pulse_note(D2, 1.4, 1.0, 260, 900, 0.1, 1.1, seed=1760, sub=0.5, decay=0.45, sus=0.0),
           HIT, 0.6)
    mx.add('hit', V.tom(50, 1.3, seed=1770, tau=0.36), HIT, 0.6)
    mx.add('hit_tone', V.snare(seed=1780, d=0.4), HIT, 0.9)
    mx.add('hit_tone', V.clap(seed=1790), HIT + 0.003, 0.6)
    gains = dict(pad=0.42, bass=0.55, kick=0.7, hats=0.42, snare=1.3, stabs=0.45, riser=0.36,
                 hit=0.85, hit_low=0.75, hit_tone=0.8)
    sends = dict(pad=0.25, snare=0.35, stabs=0.35, riser=0.2, hats=0.1, hit_tone=0.5, hit=0.05)
    sc = dict(bass=0.6, pad=0.45, stabs=0.4)
    stop = dict(t0=HIT - gap, floor_db=-40, stems=('pad', 'bass', 'stabs', 'hats', 'snare'), verb=True)
    return mx, gains, sends, sc, stop


SKETCHES = [('warm-pulse', 1, warm_pulse, WARM, 11), ('piano-pulse', 2, piano_pulse, PIANO, 22),
            ('drive', 3, drive, DRIVE, 33)]


# ------------------------------------------------------------------------------------------
# render, master, measure
# ------------------------------------------------------------------------------------------
def render(builder, kit, seed):
    rng = np.random.default_rng(seed)
    mx, gains, sends, sc, stop = builder(kit, rng)
    n = mx.n
    hits = [(t, w) for t, w in mx.kicks]
    music = {}
    for name, x in mx.stems.items():
        y = x * gains.get(name, 1.0)
        if name in sc:
            y = y * M.sidechain_times(hits, n, sc[name], 0.13)
        if name in ('pad', 'pad_oct'):
            y = V.hp(y, 140)
        if name in stop['stems']:
            y = y * stopdown(n, stop['t0'], HIT, stop['floor_db'])
        music[name] = y
    if 'piano' in music:  # a felt piano: a little warmth at 250 Hz, the top rolled off
        music['piano'] = V.shelf_hi(V.peq(music['piano'], 250, 1.5, 0.8), 4500, -1.5)
    pre = [k for k in music if not k.startswith('hit')]
    post = [k for k in music if k.startswith('hit')]
    verb_pre = V.reverb(sum(music[k] * sends.get(k, 0.0) for k in pre))
    verb_post = V.reverb(sum(music[k] * sends.get(k, 0.0) for k in post))
    if stop['verb']:
        verb_pre = verb_pre * stopdown(n, stop['t0'], LEN + 1, -40)
    stems = dict(music)
    stems['reverb'] = verb_pre + verb_post
    mix = sum(stems.values())
    # into the master at about -20 LUFS, so its glue compressor (2:1 over -14 dBFS RMS) only touches the peaks
    g = 10 ** ((PRE_LUFS - M.integrated(mix)) / 20)
    mix = mix * g
    stems = {k: v * g for k, v in stems.items()}
    master, info = M.finish(mix, lufs=LUFS, ceiling=CEILING, mono_hz=120, comp=True, drive=1.1, air=0.12,
                            hp_hz=30, fade=END_FADE, end_fade=0.06, tail_zero=480)
    return master, info, stems


def band_shares(x):
    mid = x.mean(axis=1)
    f, p = signal.welch(mid, SR, nperseg=16384)
    tot = p.sum()
    edges = [0, 60, 120, 250, 1000, 4000, 8000, 24001]
    return {f'{a}-{b if b < 24001 else 24000}': round(100 * float(p[(f >= a) & (f < b)].sum() / tot), 1)
            for a, b in zip(edges[:-1], edges[1:])}


def measurements(x, info):
    rep = M.measure(x)
    mid = np.repeat(x.mean(axis=1, keepdims=True), 2, axis=1)
    side = (x[:, 0] - x[:, 1]) / 2
    rep['mono_fold_lu'] = round(M.integrated(mid) - rep['lufs'], 2)
    rep['side_to_mid_db'] = round(float(10 * np.log10(np.sum(side ** 2) / np.sum(mid[:, 0] ** 2))), 1)
    rep['lr_correlation'] = round(float(np.corrcoef(x[:, 0], x[:, 1])[0, 1]), 3)
    rep['limiter_max_gr_db'] = round(float(info['limiter_gr_db'].max()), 2)
    rep['comp_max_gr_db'] = round(float(info['comp_gr_db'].max()), 2)
    rep['bands_pct'] = band_shares(x)
    rep['below_60hz_pct'] = rep['bands_pct']['0-60']
    above = np.flatnonzero(np.abs(x).max(axis=1) > 10 ** (-60 / 20))
    rep['first_sound_s'] = round(float(above[0] / SR), 3)
    rep['last_sound_s'] = round(float(above[-1] / SR), 3)
    rep['clipped_samples'] = int(np.sum(np.abs(x) >= 0.9999))
    tm, L = M.blocks(x, 0.4, 0.1)
    arc = {}
    for b in range(1, 5):
        sel = (tm >= at(b) + 0.2) & (tm < at(b + 1) - 0.2)
        arc[f'bar{b}'] = round(float(np.mean(L[sel])), 1)
    sel = (tm >= HIT) & (tm < HIT + 0.6)
    arc['hit'] = round(float(np.max(L[sel])), 1)
    sel = (tm >= HIT + 1.2) & (tm < LEN - 0.5)
    arc['tail'] = round(float(np.mean(L[sel])), 1)
    rep['momentary_lufs_by_section'] = arc
    return rep


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[1])
    ap.add_argument('--out', required=True, help='folder for the WAV masters (gitignored)')
    ap.add_argument('--only', nargs='*', help='render only these sketches')
    ap.add_argument('--stems', action='store_true', help='also write the pre-master stems')
    a = ap.parse_args(argv)
    os.makedirs(a.out, exist_ok=True)
    kit = load_kit(a.out)
    report_path = os.path.join(a.out, 'measurements.json')
    report = {}
    if os.path.exists(report_path):
        with open(report_path) as fh:
            report = json.load(fh)
    for name, num, builder, spec, seed in SKETCHES:
        if a.only and name not in a.only:
            continue
        master, info, stems = render(builder, kit, seed)
        path = os.path.join(a.out, f'sketch-{num}-{name}.wav')
        sf.write(path, master, SR, subtype='PCM_24')
        if a.stems:
            sd = os.path.join(a.out, 'stems', name)
            os.makedirs(sd, exist_ok=True)
            for k, x in stems.items():
                sf.write(os.path.join(sd, f'{k}.wav'), x.astype(np.float32), SR, subtype='FLOAT')
        rep = measurements(master, info)
        rep['title'] = spec['title']
        rep['chords'] = spec['chords']
        report[name] = rep
        print(f"{num} {spec['title']:12s} I {rep['lufs']:6.2f} LUFS  TP {rep['true_peak_db']:6.2f} dBTP  "
              f"LRA {rep['lra']:4.1f}  <60Hz {rep['below_60hz_pct']:4.1f}%  mono {rep['mono_fold_lu']:+.2f} LU  "
              f"lim {rep['limiter_max_gr_db']:.1f} dB  arc {rep['momentary_lufs_by_section']}")
    with open(report_path, 'w') as fh:
        json.dump(report, fh, indent=1)


if __name__ == '__main__':
    main()
