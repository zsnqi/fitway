/*
 * timeline.js: the Eclipse launch film's single source of timing, in FRAMES on the 128 BPM grid.
 *
 * TREATMENT.md §5 is the script: bar n starts at 1.875 * (n - 1) s; b() (motion.js) floors every grid point to the
 * frame at or before the true beat (bar 3 = f225, bar 4 = f337, bar 13 = f1350, bar 16 = f1687). index.html and
 * src/*.js build the picture from these numbers; Station 3's sound reads the same numbers through FILM.cues().
 *
 * Keep index.html's root data-duration equal to TOTAL / FPS (32 s).
 */
(function (root) {
  'use strict';
  const MOTION = root.MOTION || (typeof require === 'function' ? require('./motion.js') : null);
  if (!MOTION) throw new Error('timeline.js: load motion.js first');
  const { b, E, FPS, BPM, BEAT, peak, settleOf, pace, wordCount, holdFor, readingWindows } = MOTION;

  const TAIL = 2 * FPS; // 16 bars + a 2 s tail (BRIEF): the lockup holds while the music resolves and fades
  const S16 = BEAT / 4; // a 16th, 7.03 f

  // Acts: contiguous, bar-aligned (the device act ends on bar 15). One shot or one continuous take each.
  const ACT = {
    hook: { from: 0, dur: b(3) }, //                         bars 1-2: the line draws on black
    drop: { from: b(3), dur: b(3, 2) - b(3) }, //            3.1: the hard cut wide, the answers roll
    insert: { from: b(3, 2), dur: b(4) - b(3, 2) }, //       3.3: Inside now, edge to edge
    landing: { from: b(4), dur: b(7) - b(4) }, //            bars 4-6: back wide, the line lands on now
    fill: { from: b(7), dur: b(9) - b(7) }, //               bars 7-8: Reports covers Daily, the pattern fills
    busiest: { from: b(9), dur: b(11) - b(9) }, //           bars 9-10: the light, the named hour, the refrain
    montage: { from: b(11), dur: b(12) - b(11) }, //         bar 11: four pages, one beat each
    switch: { from: b(12), dur: b(13) - b(12) }, //          bar 12: English to Arabic
    devices: { from: b(13), dur: b(15) - b(13) }, //         bars 13-14: the devices, then the flat hold
    construct: { from: b(15), dur: b(16) - b(15) }, //       bar 15: the reading becomes the mark's dot
    lockup: { from: b(16), dur: b(17) + TAIL - b(16) }, //   bar 16 + tail: the mark and FITWAY
  };
  const TOTAL = b(17) + TAIL; // 1920 f = 32.0 s

  // Move lengths (frames) that the picture and the cue export share.
  const DUR = {
    roll: 24, //          Eclipse's intro roll: 400 ms (MOT-10)
    bar: 12, //           a level bar fills in 200 ms ...
    barStagger: 3, //     ... 50 ms apart (MOT-3)
    swell: 28, //         the end point and the peak ring: 0.34 -> 1, one beat (Eclipse's 257 ms, stretched)
    pulse: 300, //        the live pulse: a 5 s cycle, visible for its first 48% (MOT-7)
    wipe: 44, //          Reports rises over Daily and lands on bar 7.1 (tr-cover-wipe, land variant, glide)
    fillRow: Math.round(BEAT), // each weekday's hours fill in one beat ...
    fillStep: BEAT / 2, //  ... and the rows start an 8th apart
    ring: Math.round(BEAT), // the chalk ring round the busiest hour, one beat
    flip: 30, //          English to Arabic: every block to its mirrored slot (20 f in TREATMENT; see README)
    keyHold: 14, //       the AR key stays seated for a 16th pair before it is released and the page switches
    rise: 44, //          the devices rise into frame already moving (pd-device-rise-on-cut)
    dot: 18, //           the end point's dot swells to the mark's dot (tr-shape-match-cut)
  };

  // Line clock: today's line is mid-draw at 3:20 PM on frame 0 and lands on the latest reading, 7:42 PM, on bar 5.
  const LINE = { f0: 0, f1: b(5), m0: 560, m1: 822 }; // minutes after the 6:00 AM opening
  /** Minutes after opening that the line has reached on frame f (fractional frames allowed). */
  const lineMinute = (f) => LINE.m0 + (LINE.m1 - LINE.m0) * E.line(Math.min(1, Math.max(0, (f - LINE.f0) / (LINE.f1 - LINE.f0))));
  /** First frame on which the line has reached minute m (the crest at 6:31 PM is minute 751). */
  const lineReaches = (m) => { for (let f = LINE.f0; f <= LINE.f1; f++) if (lineMinute(f) >= m) return f; return LINE.f1; };

  // Camera moves whose velocity peaks are part of the picture's pulse (computed, so they are exact).
  const MOVE = {
    pushA: { from: b(4), to: b(5, 1) }, //        wide -> the reading, on E.cam (near rest by the landing)
    pushB: { from: b(5, 1), to: b(7) }, //        the slow push toward now (2.2 -> 2.9), on E.dolly, under the wipe
    wipe: { from: b(7) - 44, to: b(7) }, //       Reports rises from below and lands on the downbeat of bar 7
    flip: { from: b(12, 0, 2), to: b(12, 0, 2) + 30 }, // released on the 8th after the seat; lands at rest
    reportsUp: { from: b(8, 1), to: b(9, 3) }, // Reports: from the wide to the pattern card, on E.cam
    devPull: { from: b(13) + 42, to: b(13) + 75 }, // the devices: close -> the hold; lands on the flat hold (23.75 s)
    lock: { from: b(16), to: b(16) + 30 }, //     the mark into the lockup (E.cam, 0.5 s)
  };

  // Named cues: absolute frames. On the 16th grid (b() floors them), or with a trailing offgrid reason.
  const CUE = {
    tip: 0, //                             frame 0 is moving: the line mid-draw
    drop: b(3), //                         the hard cut wide
    answers: [b(3), b(3, 0, 1), b(3, 0, 2), b(3, 0, 3)], // the four answers roll in on 16ths
    bars: b(3, 1), //                      the level badge's bars fill, 50 ms apart
    insert: b(3, 2), //                    punch-in on Inside now
    wide: b(4), //                         back wide
    pushPeak: peak(MOVE.pushA.from, MOVE.pushA.to, E.cam), // offgrid: computed velocity peak of the push
    landing: b(5), //                      the line lands on now: the end point swells into its halo
    peakRing: b(5, 1), //                  the peak ring lands with "Peak 62" (a tap)
    pulse: b(5, 2), //                     the live pulse starts (5 s cycle)
    pushB: peak(MOVE.pushB.from, MOVE.pushB.to, E.dolly), // offgrid: computed velocity peak of the slow push
    wipeIn: b(7) - 44, //                  offgrid: Reports starts to rise so that it lands on 7.1
    wipe: b(7), //                         Reports has landed over Daily (the section's downbeat)
    press: b(7, 2), //                     "Last 28 days" seats (the press)
    release: b(7, 2, 1), //                ... and is released: the period changes, the four values roll
    fill: b(8), //                         the pattern fills, a weekday per 8th
    rows: [0, 1, 2, 3, 4, 5, 6].map((wd) => Math.floor(b(8) + wd * (BEAT / 2) + 1e-9)), // each weekday's first hour
    upPeak: peak(MOVE.reportsUp.from, MOVE.reportsUp.to, E.cam), // offgrid: computed velocity peak of the move up
    light: b(9), //                        the light comes on at once with the complete pattern (LGT-11)
    name: b(9, 1), //                      the subtitle names the busiest hour
    montage: [b(11), b(11, 1), b(11, 2), b(11, 3)], // Activity log, Access, Settings, Today
    seat: b(12), //                        the AR key is seated (pressed) in the wide
    flip: b(12, 0, 2), //                  released: every block travels to its mirrored slot
    flipLand: b(12, 0, 2) + 30, //         offgrid: computed, the blocks are home and read in Arabic
    devices: b(13), //                     the biggest lift: laptop and phone rise into frame
    hold: MOVE.devPull.to, //              offgrid: the pull-back lands so the flat hold runs 2.5 s (RULES)
    riseLand: b(13) + 44, //               offgrid: computed, the rise has landed close
    construct: b(15), //                   cut to black: the reading's dot, at the same place, swells
    strokes: [], //                        the drafting strokes, on 16ths (filled from CONSTRUCT below)
    fills: b(15, 3), //                    the pieces fill
    lockup: b(16), //                      the construction clears; the mark eases into the lockup
  };

  // The construction (bar 15): every drafting stroke starts on a 16th of bar 15 and runs `dur` 16ths; the pieces fill
  // on 15.4. A stroke arrives red and relaxes to chalk within a 16th and a half of its start, so at most two read red.
  const CONSTRUCT = {
    relax: 1.5, // 16ths from a stroke's start until it is chalk
    strokes: [
      { id: 'dot', kind: 'circle', at: 0, dur: 2 }, //   the reading's own circle
      { id: 'RO', kind: 'circle', at: 1, dur: 3 }, //    compass sweeps from the ring's opening
      { id: 'RI', kind: 'circle', at: 2, dur: 3 },
      { id: 'AO2', kind: 'circle', at: 3, dur: 3 },
      { id: 'AI2', kind: 'circle', at: 4, dur: 2.5 },
      { id: 'AI3', kind: 'circle', at: 5, dur: 2.5 },
      { id: 'u1', kind: 'band', at: 6, dur: 2 }, //      the chevron's four bands
      { id: 'u2', kind: 'band', at: 7, dur: 2 },
      { id: 'l1', kind: 'band', at: 8, dur: 2 },
      { id: 'l2', kind: 'band', at: 9, dur: 2 },
      { id: 'g1', kind: 'cut', at: 10, dur: 1.5, node: ['ring', 0] }, // the cuts: the opening, the arcs' ends, the arm
      { id: 'g2', kind: 'cut', at: 10, dur: 1.5, node: ['ring', 1] },
      { id: 'c2a', kind: 'cut', at: 11, dur: 1.5, node: ['arc2', 0] },
      { id: 'c2b', kind: 'cut', at: 11, dur: 1.5, node: ['arc2', 2] },
      { id: 'c3', kind: 'cut', at: 11, dur: 1.5, node: ['arc3', 0] },
      { id: 'capL', kind: 'cut', at: 11, dur: 1.5, node: ['arms', 4] },
    ],
    fills: { ring: 12, arc2: 12.5, arc3: 13, armU: 13.5, armL: 13.5, dot: 14 }, // 16ths from bar 15
  };
  CUE.strokes = [...new Set(CONSTRUCT.strokes.map((s) => Math.floor(b(15) + s.at * S16 + 1e-9)))];

  // Floored grid points that sit more than half a frame before the true 16th (the beat is 28.125 f) carry the reason
  // grid-check accepts: they are the frame at or before the grid point, never after it.
  const OFFGRID = {};
  for (const [name, v] of Object.entries(CUE)) {
    for (const f of [v].flat()) {
      const off = Math.abs(f - Math.round(f / S16) * S16);
      if (off > 0.5 && f === Math.floor(Math.round(f / S16) * S16 + 1e-9) && !OFFGRID[name]) OFFGRID[name] = 'floored to the frame at or before the 128 BPM 16th';
    }
  }

  // Copy (TREATMENT §6, DECISIONS item 19): one anchor, lower left. `in` sits on the grid minus one frame, so the first
  // visible change is on the grid; `resolved` comes from how each line is set (src/copy.js).
  //   c1  two halves clamp on one baseline in 18 f (ty-phrase-clamp-junction), the film's only clamp
  //   c2, c3  each word rises out of its own mask, 6 f apart over 24 f (no fade, no slide across the frame)
  //   w   the wordmark: its letter gaps close to 0.12 em as the lockup assembles (le-accordion-cta-collapse)
  const COPY_SET = { clamp: 18, maskWord: 24, maskStagger: 6, exit: 24 };
  const COPY = [
    { id: 'c1', text: 'Every day has a shape.', in: b(1, 0, 3) - 1, resolved: b(1, 0, 3) - 1 + COPY_SET.clamp, out: 165 },
    { id: 'c2', text: 'Every week, a rhythm.', in: b(9, 2) - 1, resolved: b(9, 2) - 1 + 3 * COPY_SET.maskStagger + COPY_SET.maskWord, out: 1092 },
    { id: 'c3', text: 'Now, read yours.', in: b(13, 3) - 1, resolved: b(13, 3) - 1 + 2 * COPY_SET.maskStagger + COPY_SET.maskWord, out: b(15) - COPY_SET.exit },
    { id: 'w', text: 'FITWAY', in: b(16) + 16, resolved: b(16) + 30, out: TOTAL }, // once the mark has cleared its slot
  ];
  const READ = readingWindows(COPY, pace, FPS, TOTAL);

  // Designed hard cuts (forensics.py --cuts): every shot change that is a cut, not a move.
  const CUTS = [b(3), b(3, 2), b(4), b(11), b(11, 1), b(11, 2), b(11, 3), b(12), b(13), b(15)];

  /** out/cues.json for Station 3 (the schema of scripts/export-cues.ts): visual hits, landings, taps, the key. */
  function cues() {
    const events = [
      { f: CUE.drop, kind: 'drop', weight: 1, id: 'drop' },
      { f: CUE.insert, kind: 'tap', weight: 0.6, id: 'insert' },
      { f: settleOf(CUE.landing - 1, CUE.landing - 1 + DUR.swell, E.state, 0.5), kind: 'land', variant: 'tuned', weight: 0.9, id: 'landing' },
      { f: settleOf(CUE.peakRing - 1, CUE.peakRing - 1 + DUR.swell, E.state, 0.5), kind: 'tap', weight: 0.5, id: 'peak-ring' },
      { f: CUE.press, kind: 'press', weight: 0.6, id: 'last-28-days' },
      { f: CUE.light, kind: 'land', variant: 'tuned', weight: 0.9, id: 'busiest' },
      { f: CUE.seat, kind: 'key', weight: 0.6, id: 'ar-key' },
      { f: CUE.devices, kind: 'lift', weight: 1.2, id: 'devices' },
      { f: CUE.fills, kind: 'land', variant: 'soft', weight: 0.5, id: 'fills' },
      { f: COPY[3].resolved, kind: 'hit', weight: 0.8, id: 'wordmark' },
    ].sort((p, q) => p.f - q.f);
    const copy = COPY.map((c) => ({ ...c, words: wordCount(c.text), kind: c.kind || 'copy', read: READ[c.id] || [] }));
    return { fps: FPS, bpm: BPM, total: TOTAL, pace: MOTION.PACE_NAME, acts: ACT, cue: CUE, copy, events, qa: { cuts: CUTS } };
  }

  const FILM = { FPS, BPM, TAIL, S16, ACT, TOTAL, DUR, LINE, MOVE, CUE, CONSTRUCT, OFFGRID, COPY, COPY_SET, READ, CUTS, lineMinute, lineReaches, PACE_NAME: MOTION.PACE_NAME, PACE: MOTION.PACE, cues, holdFor };
  root.FILM = FILM;
  if (typeof module === 'object' && module.exports) module.exports = FILM;
})(typeof window !== 'undefined' ? window : globalThis);
