# Eclipse launch film: decisions

A concept film that presents the Eclipse Owner design. It is not product code, not visual authority, and it changes
no Owner, Public or canonical state. Every decision below is the user's (2026-10-28), unless marked as the
coordinator's default.

## The film
1. Audience: the FITWAY gym owner, as a pitch for the Eclipse Owner design.
2. Format: 1920x1080 at 60 fps, 16:9, about 32 s.
3. Language: English. There is no voiceover and no subtitles.
4. Style: hybrid. Most of the film is the interface as the hero: real Eclipse screens, close-ups, the camera moving
   inside the UI, and short copy fragments. A device moment (laptop and phone, three.js) comes near the end.
5. Screens: Daily and Reports carry the story. Access, Activity log and Settings appear as a fast montage.
6. One moment shows the interface switching from English to Arabic.
7. Ending: the white FITWAY mark (`brand/fitway-logo.png`) and the name FITWAY. The mark is constructed with drafting
   lines, after reference B.
8. The data shown is Eclipse's own synthetic data. There is no "illustrative data" label, because this is a trial film.
9. Copy stays truthful to the product. The count is always approximate. There are no invented claims, no people, no
   cameras and no faces.

## Story (coordinator draft, approved with "go")
- 0–4 s: black frame; short copy fragments.
- 4–12 s: Daily. The "Inside now" count rolls and the crowd curve draws.
- 12–19 s: Reports. The heatmap fills and the busiest hour is named.
- 19–23 s: a fast montage of Access, Activity and Settings, with the EN to AR switch.
- 23–27 s: the full Daily screen on a laptop and a phone (three.js). This is the music's biggest lift.
- 27–32 s: the mark is built with drafting lines and locks up with FITWAY; hold, then end.

## Sound
10. The music is designed in code by Claude (cinetic score, earshot kit). There is no licensed track.
11. Before the full score, 2–3 sketches of about 10 s each, in different characters, go to the user to choose by ear.
    The user disliked "minimal electronic". Target a warm cinematic pulse, minor key, 125–130 BPM.
12. Effects come from the earshot bank. Movement is silent; landings, taps and keys are heard; there are no whooshes
    (from Emil's rules). Master at -14 LUFS, true peak at most -1.5 dBTP.

## Tools and process
13. cinetic directs (Leonxlnx/cinetic, used from its clone, not installed into the repo). HyperFrames (HTML and GSAP)
    is the engine. earshot provides the sound. three.js is used only for the device moment. Impeccable and
    taste-skill judge the frames. The user waived the repository's single-design-skill rule for this film.
14. Design work runs on Opus 5.5 at xhigh effort.
15. Review stations: (1) storyboard stills plus music sketches, (2) motion without sound, (3) the full film.
16. Every note the user gives becomes a rule in `RULES.md` and stays in force.

## Station 1 outcome (user, 2026-10-29)
17. Music: sketch 3, "Drive" (`music-sketches/sketch-3-drive.m4a`, 128 BPM, D minor). The full score grows from it.
18. The concept is approved: Eclipse's red crowd line draws the day, and its live reading becomes the FITWAY mark's dot
    (`TREATMENT.md`).
19. The three copy lines are approved: "Every day has a shape." / "Every week, a rhythm." / "Now, read yours." → FITWAY.
20. Carried into Station 2 (coordinator's review): the device stills (09, 10) are the weakest. The screen is too small to
    read and the phone sits far from the laptop at a different scale. Bring the camera closer, make the devices larger
    and keep the phone beside the laptop at true relative scale.

## After Station 1, with earshot's listening open (user, 2026-10-29)
21. Drive is the starting point, not a fixed target. The user picked it as the best of three, and the score may change
    wherever earshot's listening and measurements show a better result. The user still judges it by ear.
22. Recorded instruments released under CC0 may be played by the score code (for example VSCO-2 CE strings and piano).
    The notes, the arrangement and the mix stay code, and there is still no licensed track. This narrows item 10.
23. No AI music-generation models (MusicGen, Stable Audio and the like), for any layer.

Coordinator defaults, stated to the user: the tempo stays 128 BPM, because the picture is cut to its bar grid; the key,
the voices and the arrangement are free. Sample sets are CC0 only (so the film needs no credit line), fetched at a
pinned version into the gitignored `vendor/`, and never committed. The sample source is VSCO-2 Community Edition
(github.com/sgossner/VSCO-2-CE at `440300901dfe9275fd84e0b7763af1f8443ae62e`, CC0 1.0), fetched by
`music-v2/src/fetch-samples.sh`; its readme asks, as a courtesy and not a licence term, for credit where applicable.

## Direction re-opened (user, 2026-10-29)
24. The feeling: confidence and luxury like the Polar launch film (reference A), building to an explosion.
25. The effects come from this film's own story (the count, the line landing on now, the presses, the language key,
    the mark), not copied from Polar's, because Polar shows a different product.
26. There is no outside music reference. The user saw the raw first render of Station 2 before deciding on the idea.
    No redesign starts until the user says so.

## References
- A: Polar launch film (Emil Widlund), 85 s.
- B: Polar logo sting, 33 s.
- C: Ramp Inspect, 30 s.
- The analysis notes are in `references/ref-{A,B,C}-notes.md`. The rules they support are folded into `RULES.md`. The videos
  were user uploads and are not in git; ask the user to re-upload them if a frame-level comparison is needed.
- Emil Widlund's thread and Florence's "Opus 5.5 Motion Lab" article.

## Source pin
`scripts/fetch-eclipse.sh` extracts Eclipse at `fedbdb6d` (`origin/owner-followup-r04-build`) into `vendor/eclipse/`,
which git ignores.
