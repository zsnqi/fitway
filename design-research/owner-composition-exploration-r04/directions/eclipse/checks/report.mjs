import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const n = (v, digits = 3) => typeof v === 'number' ? Number(v.toFixed(digits)).toString() : String(v ?? 'not run');
function numbers(check, r) {
  if (check === 'rest') {
    const viewMin = Object.entries(r.rule2.byView).map(([view, row]) => `${view}: ${n(row.min, 4)}`).join(', ');
    const web = r.configs['ar-live-web-1440x900']?.tipW742;
    const fallback = r.configs['ar-live-fallback-1440x900']?.tipW742;
    return `${Object.values(r.configs).reduce((s, c) => s + c.rows, 0)} boxes / ${Object.values(r.configs).reduce((s, c) => s + c.snaps, 0)} snapshots; 7:42 width ${web}/${fallback} px web/fallback; width mismatches ${r.rule1.tipWMismatchSnaps}; minimum clearances ${viewMin} px; under 11: ${r.rule2.violations}; minimal-change mismatches ${r.rule3.mismatchCount}`;
  }
  if (check === 'readings') return `${r.restChangedCases} changed placements (${r.restChangedCovered} covered); over ${r.allowViol}; worst ${n(r.worst.step)} / ${n(r.worst.allow)} px; morph-end stills ${r.stillAtMorphEnd || 0}; settled mismatches ${r.settleMismatch}`;
  if (check === 'hover') return `${r.transitions} transitions; non-gap pinned over ${r.otherHoverViolations}; gap corner over ${r.gapCorner.cornerViol}; gap pinned diagnostic ${r.pinnedEdgeGapDiagnostic}; stall/jump ${r.stj}; settle median/p90 ${n(r.settle.median, 1)}/${n(r.settle.p90, 1)} ms${r.vsBase ? ` vs ${n(r.vsBase.pairedBase.median, 1)}/${n(r.vsBase.pairedBase.p90, 1)}; >1-frame slower ${r.vsBase.slowerByMoreThanOneFrame}` : ''}`;
  if (check === 'gap') return `${r.transitions} moves; corner over ${r.cornerViol}; pinned diagnostic ${r.pinViol}; stalls ${r.stj}; settled mismatches ${r.settledMismatch}`;
  if (check === 'nohist') return `${r.runs} runs / ${r.checks} checks; errors ${r.errors}; wrong ${r.wrong}`;
  if (check === 'width') return `${r.steps} cases / ${r.frames} frames; edge 12 ± ${n(r.maxDev, 4)} px; failures ${r.viol}`;
  if (check === 'quality') return `errors ${r.consoleErrors}; long frames ${r.longFrames}; max rAF gap ${n(r.gapMax, 1)} ms; AX differences ${r.accessibilityDifferences ?? 'no base'}; CLS ${n(r.cls.min, 5)}–${n(r.cls.max, 5)}; 90-ms control ${n(r.control.longFrameMs, 1)} ms / gap ${n(r.control.gapMs, 1)} ms`;
  if (check === 'guard') return `${r.refused}/${r.refusals} refused; valid scratch passes guard ${r.validPassesGuard}; once exit ${r.captures.once.exit}; always exit ${r.captures.always.exit}`;
  if (check === 'layout') return `${r.boxes} boxes; own-ring overlap ${r.overOwnRing}/${r.withRing}; below axis ${r.belowAxis}; does not belong ${r.doesNotBelong}; vertical gap min/median/p90/max ${[r.verticalGap.min, r.verticalGap.median, r.verticalGap.p90, r.verticalGap.max].map(v => n(v, 2)).join('/')} px; reversals ${r.reversals}; Home/End max ${n(Math.max(...r.farMoves.map(f => f.maxStep)), 2)} px/frame`;
}
const thresholds = {
  rest: 'width = ceil(widest numbered max-content + 2); no clip/wrap/outside; clearance ≥ 11; original clear boxes unchanged (0.0101 px); rule3dig minimal shift',
  readings: 'step ≤ chart response fraction × distance + 0.5 px; 0 morph-end stills; settled = rest (0.011 px)',
  hover: 'same step allowance; 0 stall/jumps; settled = rest (0.011 px); median/p90 ≤ base when supplied; slower count measured',
  gap: 'box-corner step ≤ response allowance; 0 stall/jumps; settled = rest (0.011 px); pinned-edge width change diagnostic',
  nohist: '0 page/console errors; text and position match selected stop (0.02 px)',
  width: 'hairline-side edge = 12 ± 0.5 px at all 62 sampled frames',
  quality: '0 errors / LoAF >50 ms; rAF gap ≤50.1 ms; AX = base when supplied; loop, shift and label controls detected; CLS measured',
  guard: 'all 14 paths refused without creating output; valid scratch reaches browser; once exit 0 / always non-zero with repeated planted mismatches',
  layout: 'MEASURED ONLY: no layout acceptance thresholds; a planted overlap is a control finding',
};

function compareReference(summary) {
  if (summary.rev.startsWith('3b1c3da') && summary.checks.readings) {
    const r = summary.checks.readings;
    const total = font => Object.entries(r.byConfig).filter(([cfg]) => cfg.endsWith('-' + font)).reduce((n, [, row]) => n + row.allowViol, 0);
    summary.referenceDifferences.push({ metric: 'readings known-bad collection',
      actual: { full: r.allowViol, web: total('web'), fallback: total('fallback') }, expected: { webOnly: 88 },
      explanation: 'The saved walk-analysis-3b1c3da.json covers only six web-font configurations (79,884 ticks). The complete twelve-configuration matrix includes fallback fonts. Its measured web-font violations are ' + total('web') + ', against 88 in the saved reference; fallback adds ' + total('fallback') + '. The table ranks worst by step/allowance ratio, not by largest pixel step. The reference 97.547-px step is AR/live/web, h1140, minute 1012, frame 16. Settled positions use the measured revision rest map; the original analyzer defaults to the 8ae88f3 map when no restVer is supplied.' });
  }
  if (summary.rev.startsWith('a14009f') && summary.checks.width) {
    const r = summary.checks.width;
    summary.referenceDifferences.push({ metric: 'width known-bad collection', actual: { cases: r.steps, violations: r.viol, maxDeviation: r.maxDev },
      expected: { cases: 12214, violations: 5955, maxDeviation: 12.1094 },
      explanation: 'The saved walk-analysis-a14009f.json is a partial collection: 29,798 ticks in three configuration directories and 12,214 width-change cases. This harness collects all twelve language/state/font configurations, 159,768 ticks and 25,376 same-side width-change cases. The complete set yields ' + r.viol + ' violations. Its measured maximum is ' + r.maxDev + ' px, against 12.1094 px in the reference. The 12 ± 0.5-px edge definition is unchanged.' });
  }
  if (!summary.rev.startsWith('8ae88f3')) return;
  const differences = summary.referenceDifferences;
  const check = (name, actual, expected, explanation) => {
    if (actual != null && actual !== expected) differences.push({ metric: name, actual, expected, explanation });
  };
  const R = summary.checks.rest, W = summary.checks.readings, H = summary.checks.hover, G = summary.checks.gap, N = summary.checks.nohist, B = summary.checks.width, Q = summary.checks.quality;
  if (R) {
    check('rest boxes', Object.values(R.configs).reduce((s, c) => s + c.rows, 0), 599104, 'The complete reference matrix is 48 configurations, every stop, 318 minutes. See raw/sweep for the actual configuration or stop-set difference.');
    if (summary.base?.startsWith('6123863')) for (const [k, expected] of Object.entries({ unchanged: 543705, a: 23502, 'ac-up': 20870, 'ac-down': 10673, 'bc-down': 313, 'bc-up': 41 }))
      check(`rest ${k}`, R.rule3.counts[k] || 0, expected, 'Classification uses the final rule3dig.mjs rendered-geometry definition, rather than analyze-sweep.mjs ideal coordinates.');
    for (const [view, expected] of Object.entries({ '1440x900': 11.0015, '1280x800': 11.0066, '1024x640': 11.0031, '390x844': 11 }))
      check(`rest ${view} min px`, +R.rule2.byView[view].min.toFixed(4), expected, 'Measured in CSS pixels after fonts settle; raw rows retain the unrounded rectangle and SVG coordinates.');
  }
  if (W) check('readings changed cases', W.restChangedCases, 16310, 'The reference counts changes in left/top over 0.01 px in the reduced-motion rest sweep, not all minute ticks.');
  if (H) {
    check('hover transitions', H.transitions, 13416, 'The reference set uses five snapshots, stops ±1/2/3 positions, both fonts, languages and three states.');
    if (summary.base?.startsWith('6123863')) check('hover >1-frame slower', H.vsBase?.slowerByMoreThanOneFrame, 128, 'Paired using configuration, minute, from and to; the reference excludes movement ≤0.5 px.');
  }
  if (G) {
    check('gap moves', G.transitions, 720, 'The gap set is the from/to gap subset of the reference hover transitions.');
    check('gap corner violations', G.cornerViol, 0, 'The brief’s zero uses gapdig.mjs box-corner travel. The pinned-edge analyzer flags width changes in the same clean transitions and is diagnostic only.');
  }
  if (N) {
    check('nohist reference-probe checks', N.checks, 1976, 'The reference nohist.mjs and saved summary sum to 1,976 across twelve runs.');
    differences.push({ metric: 'nohist brief total', actual: N.checks, expected: 1992,
      explanation: 'The supplied independent verifier’s saved summary has eight 166-check runs and four 162-check runs (8×166 + 4×162 = 1,976). This harness retains its pointer/key sequence exactly, so the brief’s 1,992 is an arithmetic or specification discrepancy, not a different check set.' });
  }
  if (B) check('width cases', B.steps, 25376, 'The reference counts width changes only when the same L/R side mode is retained.');
  if (Q && (Q.cls.min < 0.009 || Q.cls.max > 0.016)) differences.push({ metric: 'quality CLS', actual: Q.cls, expected: '0.009–0.016 in the brief', explanation: 'quality.mjs sums all observed layout-shift entries, including recent input. The supplied 6123863_8ae88f3.json already records 0.02221–0.03283 at 8ae88f3 under that definition, outside the brief’s range. This harness preserves the supplied probe’s aggregation and records every source. Timing and CLS are real-time measurements.' });
}

export async function report(out, summary) {
  compareReference(summary);
  const lines = [`# Eclipse checks — ${summary.rev.slice(0, 7)}${summary.base ? ` against ${summary.base.slice(0, 7)}` : ''}`, '', '| Check | Numbers | Threshold | Result |', '| --- | --- | --- | --- |'];
  for (const [check, r] of Object.entries(summary.checks)) lines.push(`| ${check} | ${numbers(check, r)} | ${thresholds[check]} | ${r.pass ? 'PASS' : 'FAIL'} |`);
  lines.push('', 'Raw measurements are in `raw/`; `summary.json` holds the check results. `timing.json` holds nondeterministic wall-time telemetry and is excluded from deterministic rest comparisons.');
  if (summary.checks.rest?.rule3.counts) lines.push('', `Minimal-change candidates: ${JSON.stringify(summary.checks.rest.rule3.counts)}. Largest shift: ${n(summary.checks.rest.rule3.largestShift.v, 2)} px.`);
  if (summary.referenceDifferences.length) {
    lines.push('', 'Reference differences:');
    for (const d of summary.referenceDifferences) lines.push('', `- ${d.metric}: ${JSON.stringify(d.actual)}; reference ${JSON.stringify(d.expected)}. ${d.explanation}`);
  }
  if (summary.infrastructureError) lines.push('', 'Infrastructure failure:', '', '```text', summary.infrastructureError, '```');
  if (summary.frames) lines.push('', 'Named key frames and motion strips: `frames/manifest.json`.');
  await writeFile(path.join(out, 'REPORT.md'), lines.join('\n') + '\n');
}
