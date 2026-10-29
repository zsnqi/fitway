# Drive v2: music sketch for the Eclipse launch film

Drive v2 is a 10 s sketch that grows from "Drive", the sketch the user chose at Station 1 (`DECISIONS.md` items 17
and 21). It is for the user to judge by ear as an A/B against the original. It keeps Drive's frame and what likely
made it win: controlled energy, the rolling 16th drive on a D pedal, and a clear arc into a hard stop and a hit. It
moves the character from synthwave toward a warm cinematic pulse.

The notes, the arrangement and the mix are code. The instruments are now mostly recordings released under CC0
(VSCO-2 Community Edition), played note by note by that code (item 22). No AI music model is used for any layer
(item 23), and there is no licensed track or loop.

## Files

| File | What |
| --- | --- |
| `drive-v2.m4a` | the phone preview, AAC 192 kb/s |
| `ab-preview.mp4` | A (the original Drive), 1 s of silence, then B (Drive v2): 1920x1080, 21 s, a Readex Pro title over a red waveform on Eclipse's page colour |
| `../out/music-v2/drive-v2.wav` | the master: 48 kHz, 24-bit, stereo (gitignored) |
| `../out/music-v2/stems/{bass,drums,strings,keys,fx,hit}.wav` | the six stems, pre-master, at the level the mix enters the master (gitignored) |
| `../out/music-v2/verify.json`, `listen/earshot.json`, `measurements.json` | the measurements quoted below (gitignored) |
| `../out/music-v2/original/` | the original Drive, re-rendered by its own code with its stems for the comparison (gitignored) |
| `src/render.sh` | one command that fetches, renders and verifies all of the above |
| `src/drive_v2.py`, `src/sampler.py` | the score and the sampler |
| `src/verify.py`, `src/listen.py` | the model-free checks and the earshot readings |
| `src/fetch-samples.sh`, `src/vsco2ce.lock` | the sample fetch, pinned to a full commit id and checked file by file |

## Re-render and verify

Run `bash music-v2/src/render.sh` (about 50 s once the samples are present). Add `--no-verify` to stop after the
previews. The script runs these steps:

1. **Samples.** `fetch-samples.sh` downloads only the files that are missing. Each file is checked against its git
   blob hash.
2. **The original.** It re-renders the original Drive with `music-sketches/src/sketches.py` (read only) and checks
   that the result is bit-identical to the master the user chose (md5 `d3264a38…`).
3. **Drive v2.** It renders Drive v2 twice and checks that both renders have the same md5. The current master is
   `c24986d25f67f06c122956ce88d0582c`.
4. **Previews.** It writes the AAC preview and the A/B film.
5. **Verification.** It runs `verify.py`, ffmpeg `ebur128=peak=true` on all four audio files, and `listen.py`
   (earshot).

The score runs with `python -I`, because the samples it reads are untrusted downloads.

## What changed, and why

**Kept from Drive:**
- the tempo and grid: 128 BPM in 4/4, the first downbeat at 0.10 s, the hit on bar 5 at 7.60 s;
- the form: bars 1–2 intro, bars 3–4 lift, a 16th of dead stop, the hit, a tonal tail;
- the key and harmony: D minor, Dm | Bb/D | Gm/D | A7/D | Dm over a D pedal;
- the drive: the 16th ostinato D2 D2 D3 D2 on every beat;
- the bar-by-bar arc: within 1.4 LU of the original's in every bar.

**Changed**, each move followed by the measurement that motivated it:

- **The rolling 16th drive is a cello section playing spiccato.** It used to be a synth bass. The soft layer plays in
  bars 1–2, and the full layer only on the accents in the lift. A low-pass on the cellos opens bar by bar, as the
  synth's filter did. A quiet code sine on D1 sits under bars 2–4. *Why:* the saw bass was the synthwave signature.
- **A piano pulse joins.** An upright piano plays 8ths on the D octave from bar 1, with a 3+3+2 cell of chord tones
  on top from bar 2 (borrowed from the piano sketch). *Why:* alone, the strings read "an epic orchestral trailer" to
  earshot (z about 3). The piano is the one layer that reads warm with trailer far behind (warm z 1.9, trailer 0.4).
  In the full mix, bringing the piano forward is what made the intro read warm.
- **The chords are a viola and violin section.** Each voice is tied where it holds its note. The soft layer plays in
  bars 1–2 and the full layer in the lift, with a high violin line D5 → E5 in bars 3–4. Drive's own dark pad stays
  8 dB down under the strings. *Why:* in the balance tests, removing the pad raised the synthwave z (1.9 → 2.4) and
  the techno z (0.7 → 1.4), so it stays as a bed.
- **Drums.** The 16th noise hats are gone, and so is the four-on-the-floor click kick.
  - Kick: a soft tuned code kick over a recorded concert bass drum, on 1 and 3 in bar 2 and every beat in the lift.
  - Snare: a recorded orchestral snare on the backbeats, and the 16th build into the stop climbs its recorded
    dynamic layers.
  - Tambourine: recorded hits on the lift's offbeats, where the open hats were.
  - *Why:* the coordinator's reading of bars 3–4 was "techno / tech house". 16th hats, open hats on the offbeats
    and offbeat stabs over a four-on-the-floor click kick are that pattern.
- **The riser is tonal.** The noise band and earshot's `riser/dark` are replaced by a string tremolo crescendo on A7
  (A3 C#4 E4 G4 A4) and a reversed piano D over the last 0.6 s. Both are cut into the stop. *Why:* the whole
  original read "an uplifter sweep" (z +3.6), and the rules ban whooshes.
- **The hit is led by the piano.** It strikes a low D octave and the Dm chord, with F doubled. Under it sit:
  - the recorded bass drum and a snare crack;
  - two soft timpani on D (D3 and D2);
  - a low spiccato chord on cellos and violas;
  - the low strings holding D2 and D3;
  - a code sub that falls from D2 to D1 in 50 ms.

  *Why:* every hit that leaned on strings, brass, cymbal or timpani read trailer. The piano-led hit dropped the hit
  section's trailer z from 2.7 to 1.7, with the hit still the loudest moment (3.4 LU above bar 4).
- **Mix.** The recorded sections are wide, so I narrowed the stems (side gain 0.6–0.9). The mono fold-down is now
  −0.54 LU, against about −1.0 LU before narrowing. The piano and strings get +6 dB above 2.5 kHz and the master uses cinetic's
  default air. Without that lift the mix measured 974 Hz bright, below every reference film. The piano pedal lifts
  after 0.9 s so that the tail resolves at about the original's level (−26.3 LUFS against −26.9), because the quiet
  ending is intended.

**Dropped after measuring:**
- a timpani roll in the riser, horns and trombones, and a cymbal on the hit: these were trailer staples, and earshot
  read them as such;
- a solo contrabass on the 8ths: it added weight but read orchestral;
- a full string chord held through the tail: its D3 with F3 read trailer. The F now comes from the piano.

**Two harmonic fixes found by the chroma check:**
- The low strings' D octave has a strong 5th partial (F#, 734 Hz). Without F sustained above it, the hit's three
  strongest pitch classes were D, C and A, with no minor third.
- The piano's low D1, struck hard, has a 7th partial at 257 Hz (a flat C) that outweighed the chord's F.

Softening the D1 and doubling F (F3 and F4) fixed both. The hit now reads A/D/F, as the original's does.

## Chord and voice chart

The chart gives scientific pitch (D4 = MIDI 62). Bar n starts at 0.10 + 1.875·(n − 1) s.

| Bar | 1 | 2 | 3 | 4 | Hit (7.60 s) |
| --- | --- | --- | --- | --- | --- |
| Chord over the D pedal | Dm | Bb/D | Gm/D | A7/D | Dm |
| Cellos, spiccato 16ths | D2 D2 D3 D2, soft layer | same | full layer on the accents | same, crescendo, last 16th silent | struck D2 D3 |
| Piano 8ths (D4 + D5) | soft | soft | firmer | firmer, last 8th silent | D1 D2 D3 F3 A3 D4 F4 |
| Piano cell (3+3+2) | — | F4 Bb4 D5 | G4 Bb4 D5 | A4 C#5 E5 | — |
| Violas | A3 | Bb3 | Bb3 | A3 | struck A3 D4 |
| Violins 2 | D4 | D4 (tied) | D4 | C#4 | — |
| Violins 1 | F4 | F4 (tied) | G4 | G4 (tied) | — |
| Violins 1, high | — | — | D5 | E5 | — |
| Low strings, held | — | — | — | — | D2 (contrabass), D3 (cellos), dying to −24 dB |
| Warm code pad, −8 dB | D3 A3 D4 F4 | D3 Bb3 D4 F4 | D3 Bb3 D4 G4 | D3 A3 C#4 E4 | — |
| Code sub | — | D1, rising | D1 | D1 | D2 → D1 drop, about 2 s |
| Kick + concert bass drum | — | 1, 3 | every beat | every beat | bass drum, snare, timpani D3 + D2 |
| Snare | — | — | 2, 4 | 2, then a 16th build from 3 | — |
| Tambourine | — | — | offbeat 8ths | offbeat 8ths | — |
| Riser (fx) | — | — | — | tremolo A3 C#4 E4 G4 A4 swelling −30 → 0 dB; reversed piano D2 + D3 | — |

**Timing:**
- Each recorded note is placed so that its own attack point lands on the grid. The attack point is the first −12 dB
  point of its envelope: strings speak 30–75 ms into their files, the piano about 10 ms.
- Nothing starts before 0.10 s.
- Timing is humanised by a 3 ms standard deviation (6 ms at most), and velocity by 0.03.
- Round robins alternate per note.

**Pitch shifts:**
- Each note uses the nearest recorded keycentre, so no string or piano note is shifted by more than 2 semitones.
- Timpani 3 is raised 0.5 semitones to D3, and timpani 1 is lowered 3.9 semitones to D2. Both were measured on the
  files from their partials.

## Voices and sources

| Stem | Recorded (VSCO-2 CE, CC0) | Code |
| --- | --- | --- |
| bass | cello section spiccato | D1 sine sub (voices.py `sub_note`), sidechained under the kick |
| keys | upright piano (dynamic layers 1–3) | — |
| strings | viola and violin sections, sustain with vibrato | Drive's pad (voices.py `pad_chord`), −8 dB |
| drums | concert bass drum, orchestral snare, tambourine | soft tuned kick (voices.py `kick`, no click) |
| fx | viola and violin section tremolo, the piano reversed | — |
| hit | concert bass drum, snare, timpani, cello and viola spiccato, contrabass and cello sustain | D2 → D1 sub |

The reverb is the sketches' computed hall, with the send high-passed at 220 Hz. The master chain is cinetic's
`master.finish`, as for the sketches:
- mono below 120 Hz;
- a 2:1 glue compressor, at most 1.65 dB on the hit;
- soft saturation;
- loudness passes with a 4x-oversampled true-peak limiter, ceiling −2 dBFS, at most 0.08 dB;
- edge fades and a 0.8 s end fade.

## Before and after

A is the original Drive (`out/music-sketches/sketch-3-drive.wav`, md5 `d3264a38…`) and B is Drive v2. Every number
comes from `render.sh`. The earshot readings are diagnosis, not targets: its own README warns that the realness
model is easy to fool, and a mix made of recordings reads "real" largely by construction.

### Character (earshot `match`, `describe`)

| Reading | A · Drive | B · Drive v2 |
| --- | --- | --- |
| Forced choice: warm cinematic pulse / synthwave / minimal electronic / corporate | 0.9 / **96.2** / 1.0 / 1.9 % | 33.6 / **53.5** / 0.1 / 12.8 % |
| Same, plus "an epic orchestral trailer" | 0.9 / **96.2** / 1.0 / 1.9 / 0.0 % | 18.2 / 28.9 / 0.0 / 6.9 / **46.0** % |
| z per description, whole: warm / synthwave / minimal / corporate / trailer / techno | 2.7 / **3.8** / 2.0 / 2.6 / 0.8 / 3.3 | 2.4 / 2.1 / 0.1 / 1.8 / **2.5** / 1.1 |
| Intro 0.10–3.85 s, z (same order) | 2.7 / 2.1 / 1.4 / 2.0 / 0.1 / **3.0** | **3.0** / 1.8 / 0.0 / 2.1 / 2.5 / 1.3 |
| Lift 3.85–7.60 s, z | 1.9 / 2.8 / 1.6 / 2.5 / 0.1 / **3.3** | 1.7 / 2.0 / −0.2 / **2.8** / 2.4 / 1.5 |
| Hit and tail 7.60–10 s, z | 1.0 / **1.4** / −0.5 / **1.4** / 1.2 / 0.3 | 1.0 / −0.1 / −0.5 / 0.9 / **1.7** / −0.6 |
| Forced choice per section (six descriptions), top | intro techno 62 %, lift techno 47 %, hit corporate 44 % | intro **warm 69 %**, lift corporate 87 %, hit trailer 84 % |
| `describe`, whole, top tags (z) | an uplifter sweep 3.6, a downlifter falling sweep 2.6, a vacuum cleaner 2.1 | a rising riser building tension 1.7, a cinematic hit with a long tail 1.6, church bells 1.3 (none clear) |
| `describe`, intro | an uplifter sweep 1.8, a vacuum cleaner 1.8, people talking 1.7 | a vacuum cleaner 2.1, a rising riser 2.0, an uplifter sweep 1.5 |
| `describe`, lift | an uplifter sweep 2.6, a downlifter 2.1, a vacuum cleaner 1.9 | applause 1.4, a vacuum cleaner 1.1, a power drill 1.1 (none clear) |
| `describe`, hit and tail | a snare hit 3.7, a cinematic hit with a long tail 3.1, a gunshot 2.2 | a cinematic hit with a long tail 3.5, a snare hit 3.0, a big drum hit 2.4 |
| AudioSet tagger (never steered by) | Music 0.86, Electronica 0.18, Trance music 0.17, Electronic music 0.11 | Music 0.73, Theme music 0.19, Background music 0.17, Sad music 0.12 |

### Realness (earshot `realness`)

| Reading | A | B |
| --- | --- | --- |
| Whole mix, p_real (thresholds 0.40 / 0.77) | 0.39, likely code-synthesized | 0.85, real or pro-produced |
| 4 s windows: 0–4, 4–8, 6–10 s | 0.52, 0.57, **0.08** | 0.86, 0.93, 0.77 |
| Stems (over the span where each sounds): bass / drums / strings / keys / fx / hit | 0.07 / 0.03 / 0.03 / 0.02 / 0.06 / 0.05 | 0.78 / 0.40 / 0.81 / 0.57 / 0.43 / 0.98 |

A's stems are its per-voice stems grouped into the same six: kick, hats and snare as drums; the pad as strings; the
stabs as keys; the riser as fx. A's reverb is one shared stem and is left out.

### Scorecard and measurements

| Measure | A | B |
| --- | --- | --- |
| `critique` (launch-film profile) | needs work, 19 of 22: p_real low, sub −25.6 dB low, end −15.9 LU low | launch-grade, 21 of 22: onset rate 1.0/s low (refs 2.2–8.5) |
| Band shares in dB (critique): sub / low / low-mid / mid / presence / air | −25.6 / −1.7 / −6.4 / −12.6 / −15.7 / −21.9 | −10.9 / −4.0 / −3.3 / −13.1 / −24.8 / −30.7 (all in range) |
| `measure --music`: brightness, tempo, key | 1211 Hz, 129.2 BPM, D minor | 1268 Hz, 129.2 BPM, D minor (r 0.79) |
| ffmpeg ebur128, WAV: I / LRA / TP | −14.0 LUFS / 4.1 LU / −2.0 dBTP | −14.0 LUFS / 5.6 LU / −2.0 dBTP |
| ffmpeg ebur128, AAC preview: I / LRA / TP | −14.0 / 4.1 / **−1.3 dBTP** (over the −1.5 limit) | −14.0 / 5.6 / −2.0 dBTP |
| Momentary loudness, bars 1–4, then the hit (LUFS) | −19.8, −14.7, −13.4, −11.8, **−9.7** | −20.0, −16.1, −13.8, −12.1, **−8.7** |
| Hit above bar 4 | 2.1 LU | 3.4 LU |
| Tail, 8.8–9.5 s | −26.9 LUFS | −26.3 LUFS |
| Phone (mono, 180 Hz–9 kHz): bars 1–4, hit | −23.7, −20.5, −16.6, −14.3, −12.3 | −20.9, −17.8, −16.1, −14.4, −9.7 |
| Phone: loudness lost, hit above bar 4 | −3.1 LU, 2.0 LU | −1.8 LU, 4.7 LU |
| Stop-down (the 16th against bar 4's body) | −19.6 dB | −27.3 dB |
| Mono fold-down, side to mid, L/R correlation | −0.28 LU, −13.0 dB, 0.91 | −0.54 LU, −9.8 dB, 0.81 |
| Energy below 60 Hz | 0.3 % | 8.1 % |
| First and last sound | 0.10 s, 9.83 s | 0.10 s, 9.83 s |
| Clicks: `earshot sfx check`, spikes in the 10 kHz band, clipped samples | clean, 0, 0 | clean, 0, 0 |
| Chroma: top three pitch classes per bar, then the hit | A/D/F, D/Bb/F, D/G/Bb, C#/A/G, A/D/F | D/A/F, D/Bb/F, D/G/Bb, D/C#/E, A/D/F |
| Deterministic (two renders) | md5 identical | md5 identical, `c24986d2…` |

**Summary:**
- **Away from what the user disliked.** Every electronic reading falls: synthwave z drops from 3.8 to 2.1, techno
  from 3.3 to 1.1, and minimal electronic from 2.0 to 0.1. The AudioSet classes change from Electronica and Trance to
  Theme and Background music.
- **Toward "warm cinematic pulse": only in part.**
  - The intro now reads warm on top (z 3.0, forced choice 69 %).
  - Over the whole file, warm z is 2.4, against 2.7 for A.
  - The whole-file forced choice is now a near tie with synthwave (34 against 54 %), where A was 1 against 96 %.
  - With the trailer description added, the largest single share is trailer (46 %), so B leans orchestral.
  - The lift reads "corporate background music" (z 2.8) and the hit reads as a cinematic hit.
- **Recorded.** B reads as a recording or produced music (0.85) everywhere, including the hit window that read 0.08
  in A.

## Recorded instruments: source and licence

- **Set:** VS Chamber Orchestra 2, Community Edition (VSCO-2 CE), by Versilian Studios: recorded by Sam Gossner and
  Simon Dalzell, cut by Elan Hickler (Soundemote).
- **URL:** https://github.com/sgossner/VSCO-2-CE
- **Pinned commit:** `440300901dfe9275fd84e0b7763af1f8443ae62e`, the `master` head (2020-08-04, "Updated Readme").
  Every file is fetched from this full id, never from a branch.
- **Licence:** the `LICENSE` file at that commit is the full text of **CC0 1.0 Universal**. I read it, and
  `fetch-samples.sh` checks its first line on every run.
- **Readme requests:**
  - `Readme.txt` asks, as requests and not as licence terms, that the samples not be sold directly, and that credit
    be given to Versilian Studios / Sam Gossner and/or Ivy Audio / Simon Dalzell "where applicable".
  - CC0 requires neither, so the film needs no credit line (the coordinator's default). A courtesy credit is
    possible.
  - The same readme says the Miscellania and VSCO 1 percussion folders are offered "as-is". None of them is used.
- **Files:** `src/vsco2ce.lock` lists exactly the 57 files the score plays, plus `LICENSE` and the two readmes, each
  with its git blob hash. A render against only those files is bit-identical to one against the fuller set they were
  chosen from. The 57 files are:
  - cello spiccato: 8 (E1 and D2 files, both layers, both round robins);
  - cello sustain: 1;
  - contrabass sustain: 1;
  - viola: 2 spiccato, 2 sustain, 2 tremolo;
  - violin: 5 sustain, 2 tremolo;
  - upright piano: 15;
  - concert bass drum: 5;
  - orchestral snare: 8;
  - tambourine: 4;
  - timpani hits: 2.
- **Size and location:** about 104 MB, in `vendor/samples/vsco2ce/` (gitignored). They are never committed.
- **Handling:** the downloads are untrusted data. Nothing in them is executed, they are read only by `soundfile`,
  and the score runs with `python -I`.
- **No other sources.** The code layers are the sketches' own DSP. The earshot bank sounds that the original Drive
  used (`impact/punch`, `cut_hit/sub`, `riser/dark`) are not used in v2.

## Limits

- **Not judged by ear.** I cannot listen. Whether B sounds warm, premium, or better than A has not been heard by
  anyone. The evidence is construction and measurement only:
  - the chart;
  - loudness, peaks, the arc, phone simulation and chroma;
  - earshot's readings.
- **The character readings are coarse.** earshot's forced choice is sharp: a z gap of 0.1–0.5 swings it by tens of
  percent. The whole-file reading leans trailer (2.5) over warm (2.4), the lift reads corporate, and the hit reads as
  a cinematic hit. The user's ear should decide whether that is "warm cinematic" or "trailer".
- **Realness is partly by construction.** A mix of recordings reads real. The jump from 0.39 to 0.85 shows that the
  synthetic layers no longer dominate; it does not show quality.
- **Code layers remain.** These are the soft kick, the D1 sub, the hit's sub drop and the quiet pad. Removing the
  kick raised the drums stem's realness (0.40 → 0.72), but cost the pulse reading: warm z fell from 2.4 to 2.1, and
  the forced choice became 76 % trailer (measured at the balance before the last two changes). I kept the kick.
- **Sparse onsets.** The spiccato's soft attacks give 1.0 detected onsets per second, where A's hats gave 5.2. The
  critique flags this. In the film, the effects (landings, taps, keys) add onsets.
- **The mix is still darker than A.** 95 % of the energy sits below about 1 kHz, against 2.75 kHz for A. Presence is
  −24.8 dB, against −15.7 dB. The +6 dB lift on the piano and strings brought the brightness into the references'
  range, but this is a strong EQ on an upright piano I have not heard.
- **The hit stands further above the body.** It is 3.4 LU above bar 4, against 2.1 for A. On the phone it is 4.7 LU
  above, against 2.0.
- **Untuned by ear.** The timpani tunings were measured from partials, and timpani 1 is shifted by −3.9 semitones.
  The violins' low files have weak fundamentals; their pitch was confirmed from the harmonic spacing.
- **Stems and master.** The six stems sum exactly to the mix that enters the master, at −20 LUFS. They do not sum to
  the master, because the master chain is non-linear (compression, saturation, limiting).
- **Unexplained tags.** B's intro still draws "a vacuum cleaner" (z 2.1) and "a rising riser" (z 2.0) as its
  nearest single-sound tags. I did not trace them; the likely sources are the spiccato's bow noise and the strings'
  soft swells. The hats were not the cause of A's "vacuum cleaner", or not the only one.
- **Exploration not committed.** The arrangement was chosen through about 60 rendered variants: stem ablations,
  alternative ostinatos, hit and tail variants, balance and brightness. That scratch harness is not in the repository;
  the findings that shaped the score are summarised above.
