# Music sketches: Eclipse launch film

These are three sketches of about 10 s for review station 1 (`DECISIONS.md` items 11 and 15). The user picks one by
ear, and the full 32 s score is then written in that character. All three follow `DECISIONS.md` item 12 and the
Sound section of `RULES.md`: they use a minor key and a warm pulse, master at -14 LUFS with a true peak of -1.5 dBTP
or lower, and the audio starts at about 0.1 s and fades over the last 0.8 s.

## Files

| File | What |
| --- | --- |
| `sketch-1-warm-pulse.m4a`, `sketch-2-piano-pulse.m4a`, `sketch-3-drive.m4a` | phone previews, AAC 192 kb/s |
| `sketches-preview.mp4` | all three back to back with 1 s gaps, 1920x1080, a title card over a waveform (32 s) |
| `../out/music-sketches/sketch-N-*.wav` | the masters, 48 kHz, 24-bit, stereo (gitignored) |
| `../out/music-sketches/measurements.json`, `earshot-*.json` | the measurements quoted below |
| `src/render.sh` | one command that re-renders all of the above and verifies it |
| `src/sketches.py`, `src/voices.py` | the arrangements and the instruments |

Re-render with `bash music-sketches/src/render.sh` (about 70 s). Add `--no-verify` to skip the ebur128 and earshot
passes. Every random choice is seeded, so two renders give identical WAVs (checked by md5).

## The shared frame

- **Tempo and key:** 128 BPM in 4/4, so one bar lasts 1.875 s. All three sketches are in D minor.
- **Form:** four bars plus a hit. Bars 1–2 are the intro, bars 3–4 the lift, and the hit lands on the downbeat of
  bar 5 (7.60 s), followed by a tonal tail to 10.0 s.
- **Times:** the first downbeat is at 0.10 s.
- **Stop-down:** just before the hit, the music steps back for a breath: an 8th note (234 ms) in sketches 1 and 2,
  and a 16th (117 ms) dead stop in sketch 3. Measured against the body of bar 4, the gap sits at -11, -10.5 and
  -20 dB. cinetic's measured range for pre-impact gaps is -11 to -42 dB.
- **Low end:** the kicks are tuned to the tonic, D2 (73 Hz). The bass lines sit between 55 and 110 Hz, and their
  harmonics carry them on phones.
- **Where the code comes from:**
  - **cinetic:** the DSP primitives in `synth.py` (PolyBLEP saw and square, seeded noise, constant-power placement,
    the clap) and the master chain `master.finish`. That chain sums the stereo image to mono below 120 Hz, applies a
    2:1 glue compressor, soft saturation and a gentle air shelf, then runs loudness passes with a true-peak limiter
    oversampled 4x (ceiling -2 dBFS) and edge fades. The mix enters it at -20 LUFS, so the compressor only touches
    peaks (at most 0.6 dB).
  - **cinetic's band, not used:** cinetic's own built-in band (supersaw pads and pluck arps) cannot play a felt
    piano or a warm filtered pulse, so the voices in `voices.py` are new.
  - **earshot:** three bank sounds, rendered by `earshot sfx render` into `out/music-sketches/kit/`. They are
    `impact/punch --pitch D2` (the low body of every hit), `cut_hit/sub --pitch D2` (Drive's hit attack) and
    `riser/dark --dur 1.4` (layered into Drive's riser).
  - **Reverb:** a computed hall: early reflections plus a noise tail whose decay is longer in the lows (2.6 s) than
    in the air (0.8 s). The send is high-passed at 220 Hz.

## 1 · Warm pulse

**Character:** cinematic and warm. Wide detuned pads over a rolling, filtered low pulse, with a descending lament
bass line.

| Bar | 1 | 2 | 3 | 4 | Hit |
| --- | --- | --- | --- | --- | --- |
| Chord | Dm9 | C6 | Bbmaj9 | A7sus4, then A7 on beat 3 | Dm(add9) |
| Bass | D2 | C2 | Bb1 | A1 | D2 |
| Pad voicing | F3 C4 E4 A4 | G3 C4 E4 A4 | F3 C4 D4 A4 | G3 D4 E4 A4, then G3 C#4 E4 A4 | D3 A3 E4 F4 A4 D5 F5 |

**Voices**

- **Pad:** 7 detuned saws per note (±11 cents, with slow drift) plus a sine core, run through a resonant 4-pole
  low-pass.
- **Octave layer:** the same voicing an octave up, wider and more detuned. It plays in bars 3–4 only.
- **Ostinato:** a filtered two-saw pulse on the root an octave above the bass, in 8ths with 16th pickups into
  beats 3 and 1.
- **Sub:** a sine on the bass notes, from bar 2.
- **Kick:** a soft felt-beater kick on 1 and 3 in bar 2, then on every beat.
- **Percussion:** a bead shaker in 16ths with a slight swing, and a brushed snare on 2 and 4 in the lift.
- **Hit:** the soft kick, the earshot impact, a D3 drum tuned like a timpani, and the pad chord struck and decaying.
  A last low pulse and a brush sit under it.

**Arc:** bar 1 is the pad and the ostinato alone, dark (filter at 600–800 Hz) and narrow. Bar 2 adds the sub, the
kick and the shaker. The lift widens the pad, adds the octave layer and opens the filter from 1.8 kHz to 4.5 kHz.
The kick goes to four on the floor, and the brush comes in. The pad ducks for the last 8th, and then the hit
resolves A7 to Dm through the leading tone, C# to D.

## 2 · Piano pulse

**Character:** intimate, in the Apple-ad lineage. A felt-piano figure in a 3+3+2 grouping over a soft kick pulse.
The lift adds snaps, claps and a bass line.

| Bar | 1 | 2 | 3 | 4 | Hit |
| --- | --- | --- | --- | --- | --- |
| Chord | Dm7 | Bbmaj7 | F | C | Dm(add9) |
| Left hand | D2 + D3, then A2 on beat 3 | Bb1 + Bb2, F2 | F2 + F3, C3 | C2 + C3, G2 | D2 A2 F3, rolled |
| Right-hand cell, cycled in 8ths | F4 A4 C5 | F4 A4 D5 | F4 A4 C5 | G4 C5 E5 | F4 A4 D5 E5 |
| Bass line, from bar 3 | — | — | F2 F2 A2 | C2 C2 E2 | D2 |

The top line of the figure runs C5, D5, C5, E5 and resolves down to D5 on the hit.

**Voices**

- **Felt piano:** a modal string model.
  - Partials follow a stiff string, f_n = n·f0·√(1 + B·n²).
  - The hammer strikes at 1/8 of the string, so the 8th partial is almost absent.
  - The felt rolls off at 18 dB per octave above a corner that rises with velocity.
  - Two strings per note sit 0.4–1.2 cents apart, which gives beating and a two-stage decay.
  - Higher partials decay faster.
  - The felt gives a 1–4 ms attack, and each note adds a body knock on its own octave, faint key noise and a damper.
  - The sustain pedal changes on each bar and lifts in the breath before the hit.
  - The timing is humanised with a 4 ms standard deviation (8 ms at most), the velocity with 0.02.
- **Pulse:** a soft kick on every beat, quiet in the intro.
- **Lift:** a rounded synth bass (sine with its 2nd and 3rd harmonics), finger snaps on 2 and 4, claps that join
  them in bar 4, and a very quiet pad underneath.
- **Hit:** the rolled piano chord on the pedal, a soft kick, the earshot impact (lower than in the other two
  sketches) and the bass.

**Arc:** the piano's velocity climbs bar by bar (0.44, 0.50, 0.60, 0.66 on the accents), so the felt opens as it gets
louder. The lift brings in the bass and the snaps, and bar 4 adds the claps. On the final "and" of bar 4 the figure
rests and the pedal lifts. The hit is the loudest moment.

## 3 · Drive

**Character:** darker and more energetic, but controlled. A rolling 16th bass on a D pedal under moving chords,
tight drums, offbeat stabs, and a riser into a hard stop and a hit. It is the closest to Ramp.

| Bar | 1 | 2 | 3 | 4 | Hit |
| --- | --- | --- | --- | --- | --- |
| Chord over a D pedal | Dm | Bb/D | Gm/D | A7/D | Dm |
| Stab voicing | A3 D4 F4 | Bb3 D4 F4 | Bb3 D4 G4 | A3 C#4 E4 G4 | D3 A3 D4 F4 A4 |

**Voices**

- **Bass ostinato:** two saws and a pulse through a resonant low-pass with a per-note envelope, plus a sine for
  weight. It plays D2/D2/D3/D2 in 16ths in bar 1. From bar 2 it plays only the three 16ths after each kick
  (a rolling bass), and its filter opens from 300 Hz to 900 Hz.
- **Kick:** a tight kick with a 2–5 kHz beater click, four on the floor from bar 2.
- **Hats:** 16th noise hats, open on the 8th offbeats in bar 3.
- **Snare:** a snare tuned to A3, on 2 and 4 in bar 3 and on 2 in bar 4.
- **Roll:** a 16th roll from beat 3 of bar 4.
- **Stabs and pad:** offbeat chord stabs in the lift, and a dark pad (filter at 480 Hz rising to 2 kHz).
- **Riser:** a rising noise band (350 Hz to 4.2 kHz, with no pitched sweep) layered with earshot's `riser/dark`. Both
  are cut into the 16th of silence.
- **Hit:** a hard kick, earshot's `cut_hit/sub` and impact, the D3 drum, a tight snare and a clap, a struck synth
  chord that closes and dies, the pad, and a last bass note.

**Arc:** bar 1 has the bass dark (filter at 200–280 Hz), soft hats and the pad. The kick enters in bar 2. Bar 3 adds
the snare, the stabs and the open hats. Bar 4 brings the riser and the roll, and the bass filter is fully open. The
music stops dead (-20 dB) for one 16th, and then the hit lands. The riser's level was set so that the hit stays the
loudest moment.

## Measured numbers

These are measured on the WAV masters with `sketches.py` (pyloudnorm, and the 4x oversampled true peak of cinetic's
`master.py`). They were confirmed with `ffmpeg -af ebur128=peak=true` and `earshot measure --music`.

| Measure | 1 · Warm pulse | 2 · Piano pulse | 3 · Drive |
| --- | --- | --- | --- |
| Integrated loudness | -14.0 LUFS | -14.0 LUFS | -14.0 LUFS |
| True peak, WAV | -2.0 dBTP | -2.0 dBTP | -2.0 dBTP |
| True peak, AAC preview (ebur128) | -1.8 dBTP | -1.8 dBTP | -1.3 dBTP |
| LRA (ebur128 / earshot) | 5.3 / 5.2 LU | 5.2 / 5.2 LU | 4.1 / 4.1 LU |
| Energy below 60 Hz | 5.5 % | 0.7 % | 0.3 % |
| 60–120 / 120–250 / 250–1k / 1–4k / 4–8k Hz | 36 / 20 / 27 / 8.5 / 3.0 % | 28 / 23 / 38 / 8.7 / 0.8 % | 47 / 21 / 23 / 5.3 / 2.5 % |
| Momentary loudness, bars 1–4, then the hit (LUFS) | -20.3, -15.9, -12.4, -11.8, -10.2 | -18.4, -16.3, -13.7, -11.4, -9.9 | -19.8, -14.7, -13.4, -11.8, -9.7 |
| Mono fold-down (mono minus stereo loudness) | -0.46 LU | -0.36 LU | -0.28 LU |
| Side to mid / L-R correlation | -10.4 dB / 0.83 | -11.1 dB / 0.86 | -13.0 dB / 0.91 |
| Limiter gain reduction, maximum | 0.04 dB | 0.09 dB | 0.12 dB |
| Clipped samples | 0 | 0 | 0 |
| First sound, last sound | 0.10 s, 9.86 s | 0.10 s, 9.88 s | 0.10 s, 9.83 s |
| earshot: tempo, key, brightness | 129.2 BPM, D minor, 1310 Hz | 129.2 BPM, D minor, 619 Hz | 129.2 BPM, D minor, 1211 Hz |

**Arc and edges:** the hit is the loudest moment in each sketch, at 7.8 s, which is 78% of the way in. The last 480
samples are digital zero, the first 5 ms are silent, and `earshot sfx check` reports each master clean (no clicks,
cut tails or clipping). A detector run on the 10 kHz high-passed signal finds no spikes either.

**Harmony:** a chroma check runs per half bar on the signal high-passed at 180 Hz. Its strongest pitch classes are
the written chord tones in every half bar, and each hit reads as D minor (D, A, F).

**Phone:** a phone speaker is simulated with a 4th-order high-pass at 180 Hz and a low-pass at 9 kHz, in mono.
- Through it, the sketches lose 2.8, 1.9 and 3.2 LU, and the bar-by-bar arc survives.
- On the simulated phone, the warm and drive hits sit only 0.5 and 1.8 LU above bar 4, so they resolve rather than
  peak there. The piano hit stays clearly the loudest.

## Limits

- **Not listened to:** I cannot listen. Everything above is construction (voicing, register, rhythm, arrangement)
  and measurement: loudness, peaks, spectrum, chroma against the chord chart, earshot's tempo and key, and a click
  audit. Whether each sketch actually sounds warm, premium or "not minimal electronic" has not been judged by ear.
  That is the user's call.
- **Code-made timbre:** the felt piano, the pads and the drums are synthesised. earshot's own playbook says code
  synthesis can read as cheaper than produced music, and its realness model could not run here (it needs
  huggingface.co, which is blocked). The felt piano is the voice most at risk of sounding artificial.
- **Darkness:** the piano sketch is dark by design (brightness 619 Hz, against a reference range of 1170–3630 Hz).
  The snaps and claps carry its top end. On small speakers it may read as muffled.
- **Drive's range:** Drive's LRA (4.1 LU) is at the low end of the 4–6 LU expected for short pieces, because the
  groove runs from bar 2.
- **Low end:** every sketch keeps less than 6% of its energy below 60 Hz, far from dominating. The low end lives at
  60–120 Hz.
- **Tempo reading:** earshot's beat tracker reads 129.2 BPM. The grid is exactly 128 by construction, so the
  difference is the tracker's resolution.

## For the full 32 s score

- **Bars:** at 128 BPM, 32 s is 17 bars. Cut the picture to the bar lines: the first downbeat at 0.10 s, and every
  bar at 0.10 + 1.875·(n−1) s. The device reveal at about 23 s falls on bar 13 (22.60 s), which is where the drop
  should land.
- **Map the arc to the story:**
  - bars 1–2: the cold open, played like this intro;
  - bars 3–6: Daily, the body;
  - bars 7–10: Reports, with a second chord cycle so the music does not loop;
  - bars 11–12: the montage, as a thinned breakdown about 5 LU down, which gives the LRA of 5–8 LU that a 20 s+
    film needs;
  - bar 13: the drop on the device reveal, the loudest moment;
  - bars 15–17: the music stops or filters down as the mark is drawn, then one soft resolved element on the
    wordmark and a 1.5–2.5 s tail.
- **The ending:** at 32 s the hit used here becomes the drop on the reveal. The ending resolves rather than peaks,
  per `RULES.md`.
- **Room for effects:** render the music as stems so that cinetic's `score.py` can lay the earshot effects (landings,
  taps, keys) over it, duck the music around them and run its stack guard on the lockup.
- **Variation:** add a 3-note signature motif (for example 1–5–9) on the mark, vary the ostinato or figure every
  four bars, and automate the filter across sections rather than within one bar.
- **Character fixes:**
  - If the user picks the piano sketch, raise the felt brightness and add a soft high pad or shaker in the body, so
    that phones get more presence.
  - If the user picks Drive, thin bars 11–12 harder to widen its dynamic range.
