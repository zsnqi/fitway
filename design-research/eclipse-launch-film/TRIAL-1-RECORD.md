# Trial 1: what the first Eclipse film taught us

Trial 1 ran 2026-10-28 to 2026-10-29. The user closed it as an experiment that set the direction: "the experiment was
excellent and taught us a lot". No fix is applied to it. The real film starts when the user says so, after the Public
page is finished, and it shows Public as well as Owner (DECISIONS items 27–28). Read this file before planning that
film. User notes still to come are added under "The user's notes".

## The user's notes on the trial render
- **Taste:** some shots and moves felt cliché ("مبتذل"). The user has not yet named all of them.
- **Reports' entrance (about 10 s):** abrupt. It has no smooth transition that matches the moves around it.
- **The English-to-Arabic switch:** the way it was shown was bad; every block slid to its mirrored slot.
- **The Busy times card on Reports:** the red light under and behind the card should be off. This is a note on
  Eclipse's design, carried for when Eclipse is next worked on; the film shows the pinned Eclipse (`fedbdb6d`), so
  nothing changed here.
- **More notes to come.** The user said there are others, which is expected for a trial.

## The direction for the real film (user)
- **Purpose:** the film presents the product: its beauty and its quality. The product is the hero, and every move
  exists to show it, not to show off.
- **Feeling:** the Polar launch film's confidence and luxury, building to an explosion (DECISIONS item 24). Polar's own
  score does this: a quiet arpeggio bed for 53 s, then a sub-heavy lift that holds to the logo
  (`references/refs-listening-notes.md`).
- **Effects:** few. Each one belongs to something in this film's story, not copied from Polar (item 25).
- **Music:** there is no outside track, so Polar's score is the reference to analyse. We write an original score in its
  spirit and measure the sketches against it with earshot. CC0 recorded instruments are allowed; AI music-generation
  models are not (items 22–23).
- **Scope:** Owner (Eclipse) and the Public page, once Public is finished.

## What worked: keep it
- **Real screens:** Eclipse's real pages, loaded in iframes and driven through their own DOM. The line draws by the
  minute, the counts roll, Reports switches period, and `?lang=ar` gives the real Arabic page. No screen was redrawn.
- **One timeline:** a HyperFrames composition with one paused GSAP timeline and a single `render(f)` that sets every
  layer from the frame number alone. Every cue is derived from `b(bar, beat, sixteenth)` (`film/motion.js`,
  `film/timeline.js`), so a tempo or bar-map change is a retime.
- **Devices (three.js):** the camera is close, the screen is readable, and the phone lies beside the laptop at true
  scale with contact shadows. The device's live end point becomes the red dot of the mark's construction.
- **The mark:** drafted from the vector mark (`storyboard/src/fitway-mark.svg`, within RMS 0.27 px of the PNG), with
  one red stroke at a time.
- **Review by contact sheet:** a timed sheet of the render (`film/trial-1-contact-sheet.png`) shows pace and
  composition at a glance.
- **Listening:** earshot (`describe`, `match`, `realness`, `timeline --video`, `sheet`, `critique`) reads music and
  effects, and checks sound against the cuts. It needs `huggingface.co` and `download.pytorch.org`, both open since
  2026-10-29.
- **A/B by ear:** short sketches go to the user as one preview video with titles, and the user picks.

## What did not work: lessons
- **Pace:** the trial is busy from the 4th second, with many screens, many moves and short holds. That is the
  opposite of Polar, which holds fewer screens for longer and saves its energy for one lift. It is the likely root of
  "cliché".
- **Transitions as a system:** each shot's entrance was designed alone (Reports' cover wipe, the montage cuts, the
  language FLIP), so they do not belong to one family. Design the transitions first, as one family, and then the
  shots.
- **The language switch needs a different idea.** Reshuffling every block reads as a gimmick.
- **The music came before its reference.** The three sketches were written to a verbal brief ("warm cinematic pulse"),
  and the user picked Drive. Once earshot could listen, it heard Drive as synthwave (96%). Start from an analysed
  reference and measure every sketch against it.
- **Changing the timbre lost the drive.** Drive v2 replaced the synths with VSCO-2 CE instruments. Realness rose from
  0.39 to 0.85, but:
  - the pulse was lost: 128 BPM at clarity 0.51 became 64 BPM at 0.17;
  - the hit's lift over the bed fell from 22 dB to 8;
  - it tipped toward "orchestral trailer".

  When the timbre changes, hold beat clarity, onset density and accent contrast as measured constraints.
- **Pick a tempo that fits the frame grid.** At 60 fps, 128 BPM gives a beat of 28.125 frames, so cinetic's tools
  refuse it and needed a workaround. Beats that are whole frames: 90 (40 f), 100 (36), 120 (30), 144 (25), 150 (24).
- **Render cost:**
  - A full sharp render takes 16 minutes with 3 workers; device frames take about 3.5 s each in software 3D.
  - Render pages on the CPU: the software GPU path left stale tiles on single frames.
- **Pin tools by full commit id.** A short SHA cannot be fetched.

## Tools, skills and sources used
| What | Where | Pin |
| --- | --- | --- |
| cinetic (direction, scripts, audio master) | github.com/Leonxlnx/cinetic | `ecfa6605de1adb9345ce937724810dc32267d068` |
| HyperFrames (engine) | github.com/heygen-com/hyperframes | `81959201f0acb2e265e4d8c30daa89ffc1c9607d` |
| earshot (listening, effects bank) | github.com/Leonxlnx/earshot | `591fa3e028032e6dce56620a20e932e35667e8d8` |
| taste-skill (frame judgement) | github.com/Leonxlnx/taste-skill | `12af471f627f866411b4bd785b19646d3672784c` |
| Impeccable (frame judgement) | this repository's `.claude/skills/impeccable/` | — |
| VSCO-2 CE (CC0 instruments) | github.com/sgossner/VSCO-2-CE | `440300901dfe9275fd84e0b7763af1f8443ae62e` |
| Eclipse (the screens) | `origin/owner-followup-r04-build` | `fedbdb6d` |

`scripts/setup-tools.sh` rebuilds all of them. The references are A (Polar launch, Emil Widlund), B (Polar logo sting)
and C (Ramp Inspect). They are analysed in `references/ref-{A,B,C}-notes.md` (measurement) and
`references/refs-listening-notes.md` (listening). The videos are user uploads, not in git.

## Where the trial lives
- **Stills:** `storyboard/`.
- **Treatment:** `TREATMENT.md`.
- **The trial film:** `film/`. Its re-render steps are in `film/README.md`; the trial frames are not kept.
- **Music sketches:** `music-sketches/`.
- **Drive v2:** `music-v2/`.
