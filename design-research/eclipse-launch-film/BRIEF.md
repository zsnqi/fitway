# BRIEF: the Eclipse launch film

cinetic Step 0. Binding inputs are `DECISIONS.md` and `RULES.md`; where this brief and either of them differ, they win.
Critics are prompted with this file word for word, so it doubles as the QA contract.

**Spec:** `1920x1080@60, 32s (16 bars + 2 s tail), 128BPM, pace: calm with two crisp bursts, audio: code-made score (earshot kit), sync from picture`

| | |
| --- | --- |
| Format | Launch film (a pitch), one 16:9 master. No 9:16 or 1:1 re-layouts are asked for. |
| Engine | HyperFrames (HTML + GSAP, one paused timeline). three.js only for the device moment (bars 13–14). |
| Product | FITWAY Owner, the Eclipse concept: an approximate, live crowd level, today's crowd against the gym's usual day, and the busy-hour pattern over weeks, for the person who runs the gym. |
| Viewer | The FITWAY gym owner, watching a pitch of the Eclipse Owner design. English, no voiceover, no subtitles. It must read muted. |
| Story | Fixed by the user (DECISIONS, "Story"): hook on black, Daily, Reports, a fast montage with the EN→AR switch, a device reveal on the biggest lift, the mark built from drafting lines. |
| Length and grid | 128 BPM in 4/4: a beat is 0.46875 s (28.125 f), a bar 1.875 s (112.5 f). Frames are computed from time and rounded once (`f = round(60 · t)`), never by adding rounded beats. Section changes on downbeats, cuts on 8ths. |
| Pace | Calm by default (RULES: median shot 3–4 s; reading holds 0.3 s per word + 0.5 s). Two crisp bursts: the bar-11 montage (shots of one beat, 0.47 s) and the drafting construction (lines landing on 16ths). |

## Assumptions (inferred, not told)
- The pitch plays with sound, but every beat must also read muted, because a shared link autoplays muted.
- "The full Daily screen" on the devices is the English page at 1440×900 on the laptop and the English phone page
  (390×844, first screen) on the phone. The laptop carries the chart; the phone carries Inside now.
- Fragments may run 3–5 words. RULES asks for 3–7; cinetic's calm profile caps a fragment at 4 and its crisp profile
  at 5. Five is the ceiling that satisfies both.
- The end card is the mark and the name only (DECISIONS item 7). cinetic would add one descriptor line under the
  name; the user's decision wins, and the line before the mark ("Now, read yours.") carries the promise instead.
- The lockup holds 3.5 s (RULES), longer than cinetic's 1.5–2.5 s end card, so the hold must build (a slow push of
  about 8%) rather than sit still.

## Hard bans (cinetic `SKILL.md`, merged with `RULES.md` "Picture")
- **Words:** eyebrow or kicker labels; stacked taglines; "Introducing…"; a sentence dumped at once (copy arrives as
  fragments, one at a time, with picture between); text walls; filler text (decorative mono captions, fake metrics,
  labels nobody needs, lorem ipsum, micro-labels on the drafting lines).
- **Type:** serif, italic or oblique, a skew that fakes one. One family: Readex Pro.
- **Colour:** orange, amber, beige, cream, tan or sand; neon accents, bloom and halos; purple, violet, indigo or blue
  (RULES bans blue outright); purple-to-blue or any multi-hue gradient; glassmorphism.
- **Decoration:** emoji, stock icons, sparkles, particles, confetti, lens flares, code rain; bouncy overshoot on
  anything that isn't landing (two true landings at most); any overshoot or per-letter trick on copy (only the one
  hero word, FITWAY, may move letter by letter).
- **RULES additions:** fade-and-slide-up on everything; text moving while it is read (at most a 0.3–1 px/f drift);
  fake metrics; any colour not taken from Eclipse's tokens; motion on anything but transform and opacity (clips and
  SVG draws are reveals of real product motion, see below); unseeded randomness. Every frame is a function of t.
- **Truth bans:** an exact headcount; people, cameras, faces; an invented feature, number or comparison; hand-typed
  Arabic; a live look on anything stale; a count-up through values Eclipse never draws (its intro reveals the reading,
  MOT-10: "no zero or intermediate value is ever drawn").

## Brand-supplied exceptions
Mark each line that sets one of these with `// cinetic:brand-supplied <what>` so `lint-film.mjs` accepts it.

| Exception | Why it is allowed | Limit |
| --- | --- | --- |
| Eclipse's red light and gradients: the summary light, the data light and the page wash (obsidian `#08090A` → oxblood `#4D0713` → FITWAY red `#E51935` → `#FF2946` at the single hottest point) | It is the design being pitched (Eclipse spec LGT-1…11). Bans on glow and gradients do not apply to it. | Only Eclipse's own recipes, rendered by Eclipse or copied from its CSS. The film adds no glow of its own: no bloom pass in three.js, no halo around copy or the mark. Lights never move or pulse (LGT-1); the camera moves past them. |
| Readex Pro, weights 400 and 500 only | Eclipse's typeface (TYP-1), self-hosted from `vendor/eclipse/fonts/`. | No other family; no synthetic weights. The wordmark is Readex Pro 500 at 0.12 em tracking, as in Eclipse's rail (TYP-5). |
| The white FITWAY mark (`brand/fitway-logo.png`) | The user's logo. | Drawn from the measured vector (`storyboard/src/fitway-mark.svg`), within about 1 px of the PNG at 1024. |
| The live green `#4BE29B` | Eclipse's verified-live signal (COL-15), inside real screens only. | Never film copy, never the accent, never on anything that is not live. |

## Colour: one accent, one meaning
- **FITWAY red** (`--red #E51935`, `--red-hi #FF2946`) means **"the crowd's reading"**: today's line, the live end
  point, the pattern's cells, the active rail item, and in the film's own layer only the stroke being drawn right now
  in the construction (it arrives red and relaxes to chalk). That is Eclipse's own rule (COL-21: red is the brand, the
  data, the light and the active rail item; never a button, never general emphasis).
- Stage `--page #070707`, cards `#0F0E0F`, ink chalk `#F5F3F2`, secondary `#C9C3C4`, captions `#AAA4A6`, lines
  `rgba(255,255,255,.075/.10/.24)`. Film copy is chalk; nothing in the film's own layer uses a colour Eclipse does not.

## Copy contract
- Fragments of 3–5 words, one at a time, cut at grammar; one copy anchor for the whole film (lower left, the same
  size and baseline every time, after reference A's "caption always in the same place").
- Hold every fragment at least 0.3 s per word + 0.5 s, drifting, never frozen; nothing new starts during a read.
- Word budget 15–25 for 32 s (cap 30); copy on at most about 65% of frames, with 1.5 s text-free in every 10 s.
- The count is always "approx." and is only ever Eclipse's own number. No claims beyond what Eclipse shows.
- Arabic appears only as real `?lang=ar` renders of Eclipse.

## Sound contract (Stations 1–3; from DECISIONS 10–12 and RULES)
Warm cinematic pulse, minor key, 128 BPM, no "minimal electronic". Movement is silent; landings, taps and keys are
heard; no whooshes. A visual hit lands 1 frame before its sound. The biggest lift lands on the device reveal (bar 13
downbeat, 22.5 s); the music resolves, not peaks, as the mark locks up. Audio starts at about 0.2 s and fades over
the last 0.8 s. Master at −14 LUFS, true peak at most −1.5 dBTP.
