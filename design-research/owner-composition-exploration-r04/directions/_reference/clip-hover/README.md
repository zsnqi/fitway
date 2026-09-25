# Reference clip: hover motion (feel only)

The user supplied a screen recording as the reference for smooth chart-hover motion (Round 7).

- **The source:** it is on the user's machine and is not committed:
  `D:\Projects\LLM_HANDOFFS\FITWAY\20260317-1837-34.2222242.mp4`.
  - 30 fps, 2554×1274, 367 frames, about 21 MB.
- **How to use it:** for its feel only. Do not copy its styling or layout.

## Files

- **`track.json`:** per frame, `[frame, brightPixelCount, meanX, meanY]` for near-white pixels (every channel
  above 200) in the chart band, y 980–1274 of the video.
  - It follows the tooltip's text. The mouse pointer is also white, about 75 px, and adds a small drift before
    each jump.
  - Ignore frames with a count below about 400: there the tooltip is not shown.
- **`ref-ring-3x.png`:** frame 130, enlarged. The hollow ring on the line and the tooltip.
- **`move1.png`:** frames 112–135 of one hourly transition, from 11:00 to 12:00.

## What the clip does (the coordinator's measurement)

- **Stops:** they are hourly. Each jump is about 140 video px.
- **Text:** it changes at once. Then the tooltip travels in x and y together, following the line's height.
- **Easing:** the fraction of the distance covered is about 0.19 at 33 ms, 0.43 at 66 ms, 0.60 at 100 ms, 0.72
  at 133 ms, 0.87 at 200 ms, 0.95 at 266 ms, and settled at about 400 ms.
  - The remaining distance shrinks by about 0.7 per 33 ms frame. That is exponential, or critically damped:
    a fast start and a long, soft landing.
- **Retargeting:** once the pointer moved two hours quickly (frames 180–196), and the motion took up the new
  target without restarting.
- **The ring:** it does not travel. The old ring shrinks away in about 130 ms, and the new one appears when the
  tooltip is nearly there.
  - The user chose otherwise for Eclipse: form B glides along the curve with the tooltip, on the same easing.
    See `../../NEXT-DIRECTION-BRIEF.md`, "Round 7" → "Decisions after step 1".
- **Appearing:** on first hover the tooltip appears within about 60–100 ms.
