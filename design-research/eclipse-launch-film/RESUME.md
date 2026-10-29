# Eclipse launch film: resume here

A new session starts from this file. It is the only handoff. Read it, then `DECISIONS.md` and `RULES.md`, in that
order. Talk to the user in Arabic (Gulf dialect is fine), even though the files are English.

## Where we are (2026-10-29)
- **Branch:** `ccr-026baa79-tycnnr`, pushed. Everything below is committed there. `main` does not have it.
- **Station 1: done and approved by the user.**
  - `storyboard/`: 12 stills and `contact-sheet.png`. `storyboard/src/render.mjs` re-renders them in about a minute.
  - `TREATMENT.md`: concept, bar map, copy, technique draw (seed 1760106441) and the mark sheet.
  - `BRIEF.md`: cinetic's spec line and bans.
  - `storyboard/src/fitway-mark.svg`: the vector mark, within RMS 0.27 px of `brand/fitway-logo.png`.
  - `storyboard/REVIEW.md`: the three review rounds.
- **Music:** the user picked sketch 3, "Drive". Its code is in `music-sketches/src/`; `music-sketches/NOTES.md` gives
  the key (D minor), the chords and the voices. Re-render with `bash music-sketches/src/render.sh`. The WAV masters and
  stems go to the gitignored `out/`.
- **Next: Station 2.** Build the motion, with no sound:
  1. Scaffold the film in `film/` with cinetic's HyperFrames engine (`references/hyperframes-engine.md`,
     `scripts/new-film.sh`) at 1920x1080, 60 fps, 128 BPM, 16 bars plus a 2 s tail.
  2. Animate the treatment.
  3. Fix the device shots (DECISIONS item 20).
  4. Render previews and review them on contact sheets.
  5. Send the user a silent MP4.
- **Then Station 3:** the full 32 s score grown from "Drive", with stems. Then the earshot kit effects (movement is silent,
  no whooshes), the mix (-14 LUFS, true peak ≤ -1.5 dBTP), the sync audit and the final render.

## How the work runs
- The main session is the coordinator only. Keep its context lean and delegate.
  - Design, motion and music go to `general-purpose` agents with `effort: "xhigh"` (Opus 5.5). The user asked for this.
  - Research and lookups go to `sonnet-researcher` or `sonnet-scout`.
  - Review every result yourself against the rendered frames or the measured audio before showing the user.
- **Review stations with the user:** (1) stills and music, done; (2) silent motion; (3) the full film. Every user note
  becomes a rule in `RULES.md`.
- **Skills:** cinetic directs. HyperFrames and GSAP are the engine. earshot provides the sound. three.js is used only
  for the devices. Impeccable and taste-skill judge frames. Use them from their clones; never install them into the
  repo's `.claude/`. The user waived the repository's single-design-skill rule for this film (DECISIONS item 13).
- Commit and push after each delivered step, then check that the CI run on the pushed commit passes. `design-research/`
  is outside Biome and has no special checks.

## Fresh-container setup
1. Attach these repositories with read access (`add_repo`): Leonxlnx/earshot, Leonxlnx/cinetic, Leonxlnx/taste-skill and
   heygen-com/hyperframes.
2. Run `bash design-research/eclipse-launch-film/scripts/setup-tools.sh`. It:
   - clones the four repositories at the pinned commits into `/home/user/<owner-lowercase>/<repo>`
   - builds `/home/user/.venvs/earshot` and `/home/user/.venvs/cinetic`
   - fetches Eclipse into `vendor/`
   - installs the storyboard's node packages
3. `export EARSHOT_PYTHON=/home/user/.venvs/earshot/bin/python` before running cinetic's audio scripts.
4. **Network:**
   - npm, PyPI and GitHub reads work.
   - earshot's listening commands (`describe`, `match`, `timeline`, `critique`, realness) need `huggingface.co` and
     `download.pytorch.org`. Without them, only `measure`, `sfx` and `kit` work.
   - Chromium is preinstalled for Playwright.

## Ground truth to keep
- **Source pin:** Eclipse comes from `fedbdb6d` on `origin/owner-followup-r04-build` (`scripts/fetch-eclipse.sh`). The film shows the real
  screens, so never redraw them.
- **Copy is truthful:** the count is always approximate, with no invented claims, people, cameras or faces.
- **Scope:** this is a concept film. It changes no Owner, Public, canonical or visual-authority state, and it is not a
  milestone in `PROJECT_STATE.yaml`.
