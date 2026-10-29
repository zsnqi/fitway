"""
voices.py: the instruments of the Eclipse music sketches.

Built on cinetic's own DSP (scripts/audio/synth.py: PolyBLEP saw and square, seeded noise, filters,
constant-power placement) and its master chain (master.py), imported from the cinetic clone. cinetic's
built-in band (supersaw pads, pluck arps) cannot play a felt piano or a warm filtered pulse, so the voices
below add what it lacks:

  felt_piano   modal string model: stiff-string partials, a felt hammer's spectral roll-off and strike
               position, two detuned strings per note (beating, two-stage decay), a felt thump, key noise
               and a damper
  pad_chord    a warm pad: 7 detuned PolyBLEP saws per note with slow pitch drift, spread across the
               field, mildly saturated, through a resonant 4-pole low-pass that can sweep
  pulse_note   a low synth pulse: two detuned saws and a pulse wave through a resonant low-pass with its
               own envelope per note (the ostinato voice, soft or growling)
  warm_bass    a rounded synth bass: sine with 2nd and 3rd harmonics and a little filtered saw, so the
               line reads on phones that play nothing under 60 Hz
  kick, shaker, snap, clap, snare, hat, noise_riser   the percussion
  hall_ir      a computed stereo hall: early reflections plus a noise tail whose decay is shorter in the
               highs (2.6 s low, 0.9 s air), so the space stays warm

Every random choice takes a seed. Every function returns float64 arrays at 48 kHz.
"""
import os
import sys
from functools import lru_cache

import numpy as np
from scipy import signal

CINETIC_AUDIO = os.environ.get('CINETIC_AUDIO', '/home/user/leonxlnx/cinetic/skills/cinetic/scripts/audio')
sys.dont_write_bytecode = True  # never write caches into the cinetic clone
sys.path.insert(0, CINETIC_AUDIO)
import master as M  # noqa: E402,F401  (re-exported for sketches.py)
import synth as S  # noqa: E402

SR = S.SR


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def tt_n(n):
    return np.arange(n) / SR


def raised(n):
    """0 -> 1 raised-cosine ramp of n samples"""
    return 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, max(n, 2)))


# ------------------------------------------------------------------------------------------
# filters
# ------------------------------------------------------------------------------------------
@lru_cache(maxsize=16384)
def _lp_row(k96, q100):
    """RBJ low-pass biquad at 2**(k96/96) Hz with Q q100/100, as one sos row"""
    fc = min(2.0 ** (k96 / 96.0), SR * 0.45)
    q = q100 / 100.0
    w0 = 2 * np.pi * fc / SR
    alpha = np.sin(w0) / (2 * q)
    cw = np.cos(w0)
    a0 = 1 + alpha
    return np.array([(1 - cw) / 2 / a0, (1 - cw) / a0, (1 - cw) / 2 / a0, 1.0, -2 * cw / a0, (1 - alpha) / a0])


def vlp(x, cutoff, q=0.707, stages=2, block=64):
    """Time-varying resonant low-pass (stages x 12 dB/oct). cutoff: Hz, scalar or one value per sample.
    The resonance sits in the first stage; coefficients are redesigned per block with the state carried."""
    x2 = x[:, None] if x.ndim == 1 else x
    n = len(x2)
    cut = np.broadcast_to(np.asarray(cutoff, dtype=float), (n,))
    qs = [int(round(q * 100))] + [71] * (stages - 1)
    y = np.empty_like(x2)
    zi = np.zeros((stages, 2, x2.shape[1]))
    for s in range(0, n, block):
        c = float(np.mean(cut[s:s + block]))
        k = int(round(96 * np.log2(max(c, 20.0))))
        sos = np.vstack([_lp_row(k, qq) for qq in qs])
        y[s:s + block], zi = signal.sosfilt(sos, x2[s:s + block], axis=0, zi=zi)
    return y[:, 0] if x.ndim == 1 else y


def hp(x, f, order=2):
    return S.filt(x, S.hp(f, order))


def lp(x, f, order=2):
    return S.filt(x, S.lp(f, order))


def bp(x, lo, hi, order=2):
    return S.filt(x, S.bp(lo, hi, order))


def peq(x, f, gain_db, q=0.8):
    """RBJ peaking EQ"""
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f / SR
    alpha = np.sin(w0) / (2 * q)
    b = np.array([1 + alpha * A, -2 * np.cos(w0), 1 - alpha * A])
    a = np.array([1 + alpha / A, -2 * np.cos(w0), 1 - alpha / A])
    return signal.lfilter(b / a[0], a / a[0], x, axis=0)


def shelf_hi(x, f, gain_db):
    """RBJ high shelf (S = 1)"""
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f / SR
    alpha = np.sin(w0) / 2 * np.sqrt(2)
    cw = np.cos(w0)
    b = np.array([A * ((A + 1) + (A - 1) * cw + 2 * np.sqrt(A) * alpha), -2 * A * ((A - 1) + (A + 1) * cw),
                  A * ((A + 1) + (A - 1) * cw - 2 * np.sqrt(A) * alpha)])
    a = np.array([(A + 1) - (A - 1) * cw + 2 * np.sqrt(A) * alpha, 2 * ((A - 1) - (A + 1) * cw),
                  (A + 1) - (A - 1) * cw - 2 * np.sqrt(A) * alpha])
    return signal.lfilter(b / a[0], a / a[0], x, axis=0)


# ------------------------------------------------------------------------------------------
# space
# ------------------------------------------------------------------------------------------
_IRS = {}


def hall_ir(name='hall'):
    """Computed stereo rooms, unit energy. 'hall': 2.6 s lows, 2.2 s mids, 1.5 s presence, 0.8 s air, 22 ms
    predelay, 10 early reflections. 'room': 0.9 s, for percussion. Highs die first, so tails stay warm."""
    if name in _IRS:
        return _IRS[name]
    if name == 'hall':
        rts, pre, seed, width, er_n, er_span = (2.6, 2.2, 1.5, 0.8), 0.022, 3, 0.9, 10, 0.075
    else:
        rts, pre, seed, width, er_n, er_span = (0.9, 0.75, 0.55, 0.35), 0.008, 5, 0.7, 7, 0.035
    r = np.random.default_rng(seed)
    n = int(max(rts) * 1.2 * SR)
    t = tt_n(n)
    nz = r.standard_normal((n, 2))
    edges = [('low', 350), ('band', (350, 1800)), ('band', (1800, 5000)), ('high', 5000)]
    tail = np.zeros((n, 2))
    for (kind, f), rt in zip(edges, rts):
        sos = signal.butter(2, f, kind, fs=SR, output='sos')
        tail += signal.sosfilt(sos, nz, axis=0) * np.exp(-6.91 * t / rt)[:, None]
    tail = S.filt(tail, S.lp(9000, 2))
    tail *= (1 - np.exp(-t / 0.015))[:, None]          # diffuse build-up
    mid = tail.mean(axis=1, keepdims=True)
    tail = mid + (tail - mid) * width
    tail /= np.sqrt(np.sum(tail ** 2))
    er = np.zeros((int((er_span + 0.01) * SR), 2))
    for _ in range(er_n):
        d = r.uniform(0.005, er_span)
        g = np.exp(-d / (er_span * 0.6)) * r.uniform(0.5, 1.0)
        a = (r.uniform(-0.8, 0.8) + 1) * np.pi / 4
        i = int(d * SR)
        er[i, 0] += g * np.cos(a)
        er[i, 1] += g * np.sin(a)
    er = S.filt(er, S.lp(5500, 1))
    er /= np.sqrt(np.sum(er ** 2)) + 1e-12
    k = int(pre * SR)
    ir = np.zeros((k + n, 2))
    ir[k:] += tail
    ir[:len(er)] += er * 0.55
    ir /= np.sqrt(np.sum(ir ** 2))
    _IRS[name] = ir
    return ir


def reverb(x, name='hall', send_hp=220):
    """Convolution with a computed room; the send is high-passed so the low end stays dry."""
    x = S.stereo(hp(S.stereo(x), send_hp))
    h = hall_ir(name)
    return np.stack([signal.fftconvolve(x[:, c], h[:, c])[:len(x)] for c in (0, 1)], axis=1)


# ------------------------------------------------------------------------------------------
# felt piano
# ------------------------------------------------------------------------------------------
def felt_piano(midi, vel=0.6, hold=1.0, seed=0, ring=2.2, bright=1.0):
    """One felt-piano note held `hold` seconds (key or pedal), then damped. Stiff-string partials
    f_n = n f0 sqrt(1 + B n^2); amplitudes from the strike position (~1/8 of the string, so the 8th
    partial is nearly absent), a felt roll-off 18 dB/oct above a velocity-dependent corner, two strings
    0.4-1.2 cents apart (beating and a two-stage decay), higher partials decaying faster
    (sigma = s0 + s2 f^2), a 1-4 ms felt attack, a low felt thump and faint key noise. Mono."""
    r = np.random.default_rng(seed)
    f0 = mtof(midi)
    d = hold + min(ring, 3.0)
    n = S.ns(d)
    t = tt_n(n)
    B = 3.8e-4 * 2 ** ((midi - 60) / 12 * 0.85)
    beta = 0.125 + r.uniform(-0.008, 0.008)
    fc = (520 + 1500 * vel ** 1.6 + 0.9 * f0) * bright
    s0 = 1.05 * (f0 / 261.6) ** 0.55
    s2 = 1.7
    x = np.zeros(n)
    for k in range(1, 48):
        fk = k * f0 * np.sqrt(1 + B * k * k)
        if fk > 7000:
            break
        a = max(abs(np.sin(np.pi * k * beta)), 0.04) / k ** 0.55 / (1 + (fk / fc) ** 3)
        if a < 2e-4:
            continue
        sig = s0 + s2 * (fk / 1000.0) ** 2
        env = 0.76 * np.exp(-sig * t) + 0.24 * np.exp(-sig * t / 5.0)
        cents = r.uniform(0.4, 1.2) * (1 if r.random() < 0.5 else -1)
        ph = r.uniform(0, 0.15)
        x += a * env * 0.5 * (np.sin(2 * np.pi * fk * t + ph) + np.sin(2 * np.pi * fk * 2 ** (cents / 1200) * t + ph))
    attack_tau = 0.0009 + 0.0022 * (1 - vel)
    x *= 1 - np.exp(-t / attack_tau)
    thump = lp(S.noise(d, seed + 101), 260) * np.exp(-t / 0.011) * 0.05 * vel
    knock = f0 / 2 ** max(0, int(np.ceil(np.log2(f0 / 160.0))))   # the body knock on the note's own octave, 80-160 Hz
    thump += np.sin(2 * np.pi * knock * t) * np.exp(-t / 0.018) * 0.04 * vel * (1 - np.exp(-t / 0.002))
    keyn = bp(S.noise(d, seed + 202), 1400, 4200) * np.exp(-t / 0.004) * 0.004 * vel
    y = x + thump + keyn
    tau_d = 0.085 if f0 > 150 else 0.16
    y *= np.exp(-np.maximum(t - hold, 0) / tau_d)
    end = min(n, S.ns(hold + 8 * tau_d))
    y = y[:end]
    return y * vel ** 1.25


# ------------------------------------------------------------------------------------------
# warm pad
# ------------------------------------------------------------------------------------------
def pad_chord(midis, d, cutoff, width=0.4, voices=7, detune=11.0, attack=0.25, release=0.9, seed=0,
              drive=1.25, q=0.85, decay=None):
    """A sustained pad chord, stereo, `d` seconds plus its release. cutoff: Hz, scalar or (start, end)
    across `d`, held through the release. decay: optional time constant (s) for a struck chord that dies
    away instead of sustaining (the hit's tail)."""
    r = np.random.default_rng(seed)
    n = S.ns(d + release)
    t = tt_n(n)
    out = np.zeros((n, 2))
    for k, m in enumerate(midis):
        f0 = mtof(m)
        for v in range(voices):
            pos = (v - (voices - 1) / 2) / ((voices - 1) / 2)
            off = pos * detune + r.normal(0, 1.2)
            drift = 2.2 * np.sin(2 * np.pi * r.uniform(0.07, 0.25) * t + r.uniform(0, 2 * np.pi))
            f = f0 * 2 ** ((off + drift) / 1200)
            s = S.saw(f, n / SR, r.random())
            pan = pos * width * (1 if k % 2 == 0 else -1)
            out += S.pan2(s, pan)
        # a quiet sine on the fundamental gives the chord a round core under the saws
        out += S.pan2(np.sin(2 * np.pi * f0 * t + r.uniform(0, 6.28)), 0.0) * 0.6
    out /= np.sqrt(voices)
    out = np.tanh(out * 0.35 * drive) / np.tanh(drive)
    if np.isscalar(cutoff):
        cut = np.full(n, float(cutoff))
    else:
        c0, c1 = cutoff
        nd = S.ns(d)
        cut = np.full(n, float(c1))
        cut[:nd] = c0 * (c1 / c0) ** np.linspace(0, 1, nd)
    if decay:
        cut = cut * (0.45 + 0.55 * np.exp(-t / (decay * 1.5)))
    out = vlp(out, cut, q, stages=2, block=128)
    na = S.ns(attack)
    env = np.ones(n)
    env[:na] = raised(na)
    nd = S.ns(d)
    if decay:
        env *= np.exp(-t / decay)
    if nd < n:
        env[nd:] *= np.exp(-(t[nd:] - t[nd]) / (release / 4.6))
    k = min(n, S.ns(0.01))
    env[-k:] *= np.linspace(1, 0, k)
    return out * env[:, None]


# ------------------------------------------------------------------------------------------
# synth pulses and basses
# ------------------------------------------------------------------------------------------
def pulse_note(m, gate, vel=1.0, base=400.0, env=1200.0, tau=0.07, q=1.1, seed=0, sub=0.0, tail=0.04,
               decay=0.14, sus=0.5, drive=1.4, pw=0.36):
    """One note of a synth pulse: two detuned saws and a pulse wave through a resonant low-pass whose
    cutoff falls from base+env*vel to base with time constant tau; amplitude decays toward `sus`.
    sub adds the pure fundamental under it. Mono."""
    r = np.random.default_rng(seed)
    d = gate + tail
    n = S.ns(d)
    t = tt_n(n)
    f0 = mtof(m)
    x = (0.55 * S.saw(np.full(n, f0 * 2 ** (r.normal(0, 1.5) / 1200)), d, r.random())
         + 0.45 * S.saw(np.full(n, f0 * 2 ** (7 / 1200)), d, r.random())
         + 0.22 * S.square(np.full(n, f0), d, r.random(), pw))
    y = vlp(x, base + env * vel * np.exp(-t / tau), q, stages=2, block=32)
    if sub:
        y = y + sub * np.sin(2 * np.pi * f0 * t)
    amp = (1 - np.exp(-t / 0.0015)) * (sus + (1 - sus) * np.exp(-t / decay))
    ng = S.ns(gate)
    if ng < n:
        amp[ng:] *= np.cos(np.linspace(0, np.pi / 2, n - ng)) ** 2
    return np.tanh(y * amp * drive) / np.tanh(drive) * vel


def warm_bass(m, d, vel=1.0, seed=0, decay=0.32, sus=0.5):
    """Rounded bass: sine with 2nd and 3rd harmonics and a little low-passed saw. The harmonics carry
    the line on phones. Mono."""
    f0 = mtof(m)
    n = S.ns(d)
    t = tt_n(n)
    x = (np.sin(2 * np.pi * f0 * t) + 0.38 * np.sin(2 * np.pi * 2 * f0 * t + 0.3)
         + 0.14 * np.sin(2 * np.pi * 3 * f0 * t + 0.7))
    x += 0.16 * lp(S.saw(np.full(n, f0 * 1.002), d, 0.1), 650, 2)
    amp = (1 - np.exp(-t / 0.004)) * (sus + (1 - sus) * np.exp(-t / decay))
    k = min(n, S.ns(0.06))
    amp[-k:] *= np.cos(np.linspace(0, np.pi / 2, k)) ** 2
    return np.tanh(x * amp * 1.3) / np.tanh(1.3) * vel


def sub_note(m, d, attack=0.05, release=0.2, h2=0.12):
    """Sustained sine sub with a touch of 2nd harmonic. Mono."""
    f0 = mtof(m)
    n = S.ns(d + release)
    t = tt_n(n)
    x = np.sin(2 * np.pi * f0 * t) + h2 * np.sin(2 * np.pi * 2 * f0 * t)
    env = np.ones(n)
    na = S.ns(attack)
    env[:na] = raised(na)
    nd = S.ns(d)
    env[nd:] = np.cos(np.linspace(0, np.pi / 2, n - nd)) ** 2
    return x * env


# ------------------------------------------------------------------------------------------
# percussion
# ------------------------------------------------------------------------------------------
def kick(root=73.42, start=165.0, tau_p=0.03, tau_a=0.2, d=0.55, beater=0.08, beater_lp=1500, click=0.0,
         drive=1.3, seed=0):
    """A kick whose pitch settles on `root` (the tonic). Soft: a low-passed felt beater; tight: add
    `click`, a band-passed 2-5 kHz tick of 1.5 ms. Mono."""
    n = S.ns(d)
    t = tt_n(n)
    f = root + (start - root) * np.exp(-t / tau_p) + 40 * np.exp(-t / 0.004)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / tau_a)
    x = body + lp(S.noise(d, seed), beater_lp) * np.exp(-t / 0.005) * beater
    if click:
        x += bp(S.noise(d, seed + 1), 2000, 5000) * np.exp(-t / 0.0015) * click
    na = S.ns(0.001)
    x[:na] *= raised(na)
    k = S.ns(0.02)
    x[-k:] *= np.linspace(1, 0, k)
    return np.tanh(x * drive) / np.tanh(drive)


def shaker(seed=0, d=0.09, tau=0.028, attack=0.006):
    """Bead shaker: noise band 3-8.5 kHz, a soft 6 ms swell and a 28 ms decay. Mono."""
    n = S.ns(d)
    t = tt_n(n)
    x = lp(bp(S.noise(d, seed), 3000, 8500), 9500)
    env = (1 - np.exp(-t / attack)) * np.exp(-t / tau)
    return x * env / 0.35


def snap(seed=0, d=0.16):
    """Finger snap: a 1.6-3.8 kHz noise crack, a short modal body near 1.2-2.6 kHz and a soft flesh
    thump. Centroid about 2.4 kHz, nothing harsh above 6 kHz. Mono."""
    r = np.random.default_rng(seed)
    n = S.ns(d)
    t = tt_n(n)
    on = 1 - np.exp(-t / 0.0004)
    crack = lp(bp(S.noise(d, seed), 1600, 3800), 6000) * np.exp(-t / 0.011)
    body = sum(g * np.sin(2 * np.pi * f * r.uniform(0.97, 1.03) * t) * np.exp(-t / tt_)
               for f, tt_, g in ((1180, 0.016, 0.20), (1850, 0.010, 0.12), (2600, 0.007, 0.08)))
    thump = np.sin(2 * np.pi * 320 * t) * np.exp(-t / 0.008) * 0.12
    return (crack * 1.6 + body + thump) * on


def clap(seed=0):
    """cinetic's clap (four bursts 9-10 ms apart), low-passed at 6.5 kHz for warmth. Mono."""
    return lp(S.clap(0.4, seed), 6500)


def snare(seed=0, tight=True, d=0.35):
    """Snare: a body tuned to A3 (220 Hz, the key's fifth) falling from 270 Hz, and a noise wire.
    tight=False: a brushed, softer snare with a 5 ms swell and a longer, darker wire. Mono."""
    n = S.ns(d)
    t = tt_n(n)
    f = 220 + 50 * np.exp(-t / 0.012)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.045 if tight else 0.06))
    if tight:
        wire = lp(bp(S.noise(d, seed), 900, 7000), 8000) * np.exp(-t / 0.055)
        x = body * 0.7 + wire * 1.4
        on = 1 - np.exp(-t / 0.0006)
    else:
        wire = lp(bp(S.noise(d, seed), 500, 5000), 6000) * np.exp(-t / 0.12)
        x = body * 0.35 + wire * 1.3
        on = 1 - np.exp(-t / 0.005)
    return x * on


def tom(m=50, d=1.2, seed=0, tau=0.38, bend=0.1, mallet=0.15):
    """A tuned drum on note m, timpani-like: air-loaded membrane modes pulled near harmonic (1, 1.5, 2,
    3: D3, A3, D4, A4 on D3, all in key), the higher ones dying faster, a small downward bend and a
    felt-mallet attack. Its partials sit at 150-450 Hz, so the hit stays audible on phones. Mono."""
    r = np.random.default_rng(seed)
    f0 = mtof(m)
    n = S.ns(d)
    t = tt_n(n)
    bendf = 1 + bend * np.exp(-t / 0.05)
    x = np.zeros(n)
    for ratio, g, k in ((1.0, 1.0, 1.0), (1.5, 0.42, 0.55), (2.0, 0.25, 0.4), (3.0, 0.12, 0.3)):
        ph = 2 * np.pi * np.cumsum(f0 * ratio * r.uniform(0.995, 1.005) * bendf) / SR
        x += g * np.sin(ph) * np.exp(-t / (tau * k))
    x += lp(S.noise(d, seed), 1800) * np.exp(-t / 0.006) * mallet
    x *= 1 - np.exp(-t / 0.0012)
    k = S.ns(0.03)
    x[-k:] *= np.linspace(1, 0, k)
    return x


def hat(seed=0, tau=0.012, d=0.12):
    """Closed (tau ~0.012) or open (~0.05) hat: noise 6.5-11 kHz. No tonal partials. Mono."""
    n = S.ns(d)
    t = tt_n(n)
    x = lp(hp(S.noise(d, seed), 6500, 2), 9500, 2)
    return x * (1 - np.exp(-t / 0.0005)) * np.exp(-t / tau) / 0.4


def noise_riser(d, f0=350.0, f1=4200.0, seed=0, curve=2.2, width=0.7):
    """Tension riser without a pitched sweep: two decorrelated noise bands whose centre rises
    exponentially from f0 to f1 while the level grows as u^curve. Ends at full level: the caller cuts it
    into the stop-down. Stereo."""
    n = S.ns(d)
    u = np.linspace(0, 1, n)
    centre = f0 * (f1 / f0) ** u
    out = np.zeros((n, 2))
    for c in (0, 1):
        x = S.noise(d, seed + c)
        y = vlp(x, centre * 1.5, 0.9, stages=2, block=128)
        y = y - vlp(y, centre / 1.6, 0.707, stages=1, block=128)   # a band around the centre
        out[:, c] = y
    mid = out.mean(axis=1, keepdims=True)
    out = mid + (out - mid) * width
    env = (0.03 + 0.97 * u ** curve)
    return out * env[:, None] / (np.std(out) + 1e-12) * 0.3
