# Opus 5.5 motion graphics: examples, tools, pipeline (sonnet-researcher, 2026-10-04)

Saved by the coordinator from the agent's final message (condensed). X posts unreadable (HTTP 402); most hits are SEO/marketing.

- Opus 5.5 released 2026-09-22 (TechCrunch, MacRumors): all Opus 5.5 motion work is under two weeks old.

## Examples
- Credible collection: github.com/athemeroy/awesome-claude-5-5-videos (frozen 2026-09-26; 1,511 posts, 1,401 MP4s, 168 case
  studies; separates creator-disclosed / matching code / observed; CC BY 4.0). Links lemomo-ai/lemo-opuscar (MIT),
  francozanardi/papermotion (deterministic render, contact sheets), JohnHeibel/ClaudeAnimationBase (p5.js, storyboard).
- github.com/opusvideo/awesome-claude-video (46 examples, 36 creators): HyperFrames launch video; Remotion + SVG/Canvas history
  piece; HTML + Playwright + FFmpeg UI morph loop; Manim + Kokoro TTS explainer.
- Mike Codeur blog (2026-03-03): 30 s product video with Claude Code + Remotion skills (Claude generally, pre-5.5).
- Hype: many "awesome-opus-5.5-*" repos and marketing sites; inflated numbers.
- Limit: no reproducible 1-2 min Arabic/RTL product video by Opus 5.5 found; strength claims rest on 10-30 s social clips.

## Tools
- Remotion: React, headless Chromium + FFmpeg; free for individuals and companies up to 3 people; Windows x64 headless shell
  supported; @remotion/fonts for local fonts; Arabic via Chromium (unverified); official skills remotion-dev/skills; product
  skill EveryInc/product-launch-video (storyboard, build, render, 4 critic agents).
- HyperFrames (HeyGen): HTML/CSS + GSAP/Lottie/Three.js, headless Chrome + FFmpeg; Apache-2.0; very active (v0.8.123,
  2026-10-04); Node 22+, FFmpeg; Claude Code skill/plugin; Windows works with rough edges (console pop-ups issues); font
  localization and non-Latin subsets mentioned; RTL not documented.
- Playwright recording + FFmpeg: real screens; frame-stepping screenshots for determinism.
- Manim/Motion Canvas/p5/Lottie: non-browser renderers break Arabic joining unless shaping is on; Chromium-based tools avoid it.

## Workflow advice
Storyboard first; start short; deterministic offline render with contact sheets; several independent reviewers; fact-check
against the live product.

## Recommendation
HyperFrames first (plain HTML reuses the existing screens), Remotion as fallback. Bilingual shot table with timings ->
1080p scenes -> contact sheet + separate reviewer incl. Arabic reading -> audio last. Before committing: a 5-second spike
rendering one Arabic line in Readex Pro in each tool, checking joining and no font fallback.
