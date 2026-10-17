import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, watch } from "node:fs";
import {
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import { createServer, request } from "node:http";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { after, before, test as nodeTest } from "node:test";
import { copyAllFixture, copyHelpFixture } from "./fixture-copy.mjs";
import { verificationTest } from "./skip-gate.mjs";

const test = verificationTest(nodeTest);

import { fileURLToPath, pathToFileURL } from "node:url";
import { createContext, runInContext, runInNewContext } from "node:vm";
import { child, doctorFix, help, playwright } from "./cli.mjs";
import { measurementColors } from "./colors.mjs";
import { compare, diffStem } from "./compare.mjs";
import {
	assertOutsideGit,
	lanOrigins,
	outputFile,
	parsePortOwners,
	portAvailable,
	preview,
	reserveVerificationPorts,
	shortFinding,
	verificationPairs,
	verificationPort,
} from "./core.mjs";
import {
	focusedElement,
	KeyboardReachError,
	performAction,
	proveFeature,
	reachByKeyboard,
} from "./drive.mjs";
import {
	coverageProblems,
	discoverElements,
	drift,
	extractDependencies,
	extractSwitches,
	generateMap,
	readRecipes,
	repairRecipes,
} from "./map.mjs";
import { sourceProbe } from "./probes.mjs";
import { inputAxis, itemSummary, resolveQuery, stateCases } from "./runner.mjs";
import {
	captureTimeline,
	observeTimeline,
	timelineTimes,
} from "./timeline.mjs";

let scratch;
let concept;
let recipes;
const heldSessions = [];
const html =
	'<main>Fixture</main><button id="ops-btn" aria-controls="ops-pop">Status</button><div id="ops-pop" role="dialog" hidden></div><script src="app.js"></script>';
const js =
	'const params=new URLSearchParams(location.search);const state=params.get("state")||"live";if(["live","loading","error"].includes(state)){};window.__fixture={ready:true};';
const authored = () => ({
	schema: 1,
	pages: {
		"index.html": {
			features: [
				{
					id: "status",
					marker: "ops-btn",
					source: { file: "index.html", line: 1 },
					actions: ["activate:#ops-btn"],
					proof: { selector: "#ops-pop", visible: true },
					covers: ["#ops-pop"],
				},
			],
			states: [
				{
					when: {},
					shows: "Visible fixture",
					proof: { selector: "main", visible: true },
				},
			],
		},
	},
});
before(async () => {
	scratch = await mkdtemp(resolve(tmpdir(), "verify-fitway-unit-"));
	concept = resolve(scratch, "concept");
	recipes = resolve(concept, "verification-recipes.json");
	await mkdir(concept);
	await writeFile(resolve(concept, "index.html"), html);
	await writeFile(resolve(concept, "app.js"), js);
	await writeFile(recipes, JSON.stringify(authored()));
});
after(async () => {
	for (const session of heldSessions.splice(0))
		runCli(["cleanup", "--session", session]);
	if (scratch) await rm(scratch, { recursive: true, force: true });
});

// The browser boundary is simulated, as in the existing runner contracts. The
// real scheduler and capture code run unchanged; the fixture paints one pixel
// whose channel differs only inside a finite effect, never at either endpoint.
function timelineFixture(midpoint = 100) {
	const effects = [];
	const listeners = new Map();
	let mutationObserver;
	class EventTarget {
		listeners = new Map();
		addEventListener(event, fn) {
			this.listeners.set(event, fn);
		}
		removeEventListener(event, fn) {
			if (this.listeners.get(event) === fn) this.listeners.delete(event);
		}
		dispatchEvent(event) {
			const fn = this.listeners.get(event.type);
			if (typeof fn === "function") fn.call(this, event);
			else fn?.handleEvent(event);
			this.ending?.call(this, event);
		}
	}
	class Element extends EventTarget {
		animate(frames, options) {
			const a = {
				frames,
				currentTime: 0,
				playState: "running",
				effect: { getComputedTiming: () => ({ endTime: options.duration }) },
				pause() {
					this.playState = "paused";
				},
				play() {
					this.playState = "running";
				},
				finish() {
					this.playState = "finished";
				},
				cancel() {
					this.playState = "idle";
				},
			};
			effects.push(a);
			return a;
		}
	}
	class MutationObserver {
		constructor(callback) {
			this.callback = callback;
			this.records = [];
			mutationObserver = this;
		}
		observe() {}
		takeRecords() {
			const records = this.records;
			this.records = [];
			return records;
		}
	}
	const window = {};
	Object.defineProperty(Element.prototype, "ontransitionend", {
		configurable: true,
		get() {
			return this.ending;
		},
		set(fn) {
			this.ending = fn;
		},
	});
	window.HTMLElement = Element;
	const sandbox = {
		window,
		Element,
		Animation: class Animation {},
		EventTarget,
		MutationObserver,
		URL,
		queueMicrotask,
		performance: { now: () => 10000 },
		document: {
			getAnimations: () => effects.filter((a) => a.playState !== "idle"),
			addEventListener: (name, fn) => listeners.set(name, fn),
		},
	};
	Object.assign(window, {
		setTimeout: () => 1,
		setInterval: () => 1,
		clearTimeout() {},
		clearInterval() {},
		requestAnimationFrame: () => 1,
		cancelAnimationFrame() {},
	});
	const context = createContext(sandbox);
	const evaluate = (fn, arg) => {
		context.argument = arg;
		return runInContext(`(${fn.toString()})(argument)`, context);
	};
	evaluate(observeTimeline);
	window.__verifyFitwayTimeline.arm("click:#control", "mouse");
	listeners.get("mousedown")({});
	new Element().animate([0, midpoint, 0], { duration: 200 });
	const page = {
		evaluate,
		screenshot: async () => {
			const t = effects[0].currentTime;
			return Buffer.from([
				Math.round(
					t <= 100 ? (midpoint * t) / 100 : (midpoint * (200 - t)) / 100,
				),
			]);
		},
	};
	return {
		page,
		window,
		effects,
		evaluate,
		author: (script, filename) => runInContext(script, context, { filename }),
		mutate: () => mutationObserver.records.push({ type: "attributes" }),
	};
}

test("T1: a mid-motion-only defect differs, self frames equal, and default times cover the end", async () => {
	const captured = [];
	for (const [index, mid] of [100, 200, 100].entries()) {
		const fixture = timelineFixture(mid);
		const out = resolve(scratch, `timeline-${index}`);
		const result = await captureTimeline(fixture.page, {
			out,
			stem: "fixture",
		});
		assert.deepEqual(result.times, [1, 100, 200]);
		captured.push(
			await Promise.all(
				result.samples.map((s) => readFile(resolve(out, s.file))),
			),
		);
	}
	assert.deepEqual(
		captured[0],
		captured[2],
		"same fixture must be byte EQUAL at every time",
	);
	assert.notDeepEqual(
		captured[0][1],
		captured[1][1],
		"mid-motion-only defect must be DIFFERENT",
	);
	assert.deepEqual(
		captured[0][2],
		captured[1][2],
		"settled frame must remain EQUAL",
	);
	assert.deepEqual(timelineTimes("0,40,120,40"), [0, 40, 120]);
	assert.throws(() => timelineTimes("-1"), /nonnegative/);
	assert.deepEqual(timelineTimes("6000"), [6000]);
});

test("T1/T3: compare reports timeline DIFFERENT, self EQUAL and named NOT-HELD beside settled EQUAL", async () => {
	for (const [tag, midpoint, timer] of [
		["different", 200, true],
		["equal", 100, false],
		["not-held", 100, true],
	]) {
		const out = resolve(scratch, `compare-timeline-${tag}`);
		let captureNumber = 0;
		const lines = [];
		const original = console.log;
		console.log = (...args) => lines.push(args.join(" "));
		try {
			const call = compare(
				{
					out,
					concept: "build",
					baseline: "base",
					page: "fixture.html",
					timeline: true,
				},
				{
					checkPort: async () => {},
					doctor: async (options) => ({
						concept: options.concept,
						tools: scratch,
						map: { pages: [{ page: "fixture.html" }] },
					}),
					child: async (_command, args) =>
						writeFile(
							args[args.indexOf("--json") + 1],
							JSON.stringify({
								identical: false,
								bbox: [0, 0, 1, 1],
								changedPixels: 1,
								images: {},
							}),
						),
					captureItems: async (_options, setup, folder) => {
						const run = captureNumber++;
						const fixture = timelineFixture(
							setup.concept === "build"
								? tag === "not-held" && run === 2
									? 200
									: midpoint
								: 100,
						);
						if (timer) {
							fixture.window.mutate = fixture.mutate;
							runInNewContext(
								"window.setTimeout(() => window.mutate(), 40)",
								{ window: fixture.window },
								{ filename: "http://fixture.test/timer.js" },
							);
						}
						const timeline = await captureTimeline(fixture.page, {
							out: folder,
							stem: "fixture",
						});
						await writeFile(resolve(folder, "settled.png"), Buffer.from([0]));
						return {
							items: [
								{
									feature: "fixture.html/open",
									state: "default",
									language: "en",
									size: "desktop",
									input: "mouse",
									motion: "full",
									transport: "file",
									colors: "normal",
									status: "pass",
									query: {},
									problems: [],
									files: ["settled.png"],
									timeline,
								},
							],
						};
					},
				},
			);
			if (tag === "different")
				await assert.rejects(call, /differences or problems/);
			else await call;
		} finally {
			console.log = original;
		}
		const report = JSON.parse(
			await readFile(resolve(out, "comparison.json"), "utf8"),
		);
		assert.equal(report.items[0].result, "equal");
		assert.ok(
			lines.some((line) => line.startsWith(`TIMELINE ${tag.toUpperCase()}:`)),
			lines.join("\n"),
		);
		assert.ok(
			report.items[0].timeline.samples.some((sample) => sample.result === tag),
		);
		if (tag === "not-held") {
			assert.match(lines.join("\n"), /NOT-HELD:.*time 100 ms;.*timer.js:1/);
			assert.equal(report.timelineSummary["not-held"], 2);
		}
	}
});

test("T3: script timer movement keeps its source without skipping a reproducible frame", async () => {
	const fixture = timelineFixture();
	fixture.window.mutate = fixture.mutate;
	runInNewContext(
		"window.setTimeout(() => window.mutate(), 40)",
		{ window: fixture.window },
		{ filename: "http://fixture.test/timer.js" },
	);
	const out = resolve(scratch, "timer-timeline");
	const result = await captureTimeline(fixture.page, {
		out,
		stem: "timer",
		times: [1, 40, 100, 200],
	});
	assert.equal(result.samples[0].result, "held");
	for (const sample of result.samples.slice(1)) {
		assert.equal(sample.result, "held");
		assert.equal(sample.sources[0].time, 40);
		assert.equal(sample.sources[0].source.file, "timer.js");
		assert.equal(sample.sources[0].source.line, 1);
	}
});

test("X5: deterministic callback defects are DIFFERENT; varying callback frames are NOT-HELD on their own side", async () => {
	for (const mode of [
		"deterministic",
		"equal",
		"vary-build",
		"vary-baseline",
		"vary-confirm",
		"vary-confirm-baseline",
		"vary-size-build",
		"vary-size-baseline",
		"vary-size-confirm",
		"cross-size",
		"confirmation-fails",
	]) {
		const kind = mode.replace("vary-size-", "vary-");
		const out = resolve(scratch, `callback-${mode}`);
		const runs = { build: 0, base: 0 };
		const lines = [];
		const original = console.log;
		console.log = (...args) => lines.push(args.join(" "));
		try {
			const call = compare(
				{
					out,
					concept: "build",
					baseline: "base",
					page: "fixture.html",
					"timeline-times": "1,100,200",
				},
				{
					checkPort: async () => {},
					doctor: async (options) => ({
						concept: options.concept,
						tools: scratch,
						map: { pages: [{ page: "fixture.html" }] },
					}),
					child: async (_command, args) => {
						const a = await readFile(args[1]);
						const b = await readFile(args[2]);
						const sizesDiffer = a.length !== b.length;
						await writeFile(
							args[args.indexOf("--json") + 1],
							JSON.stringify(
								sizesDiffer
									? {
											tool: "diff_map",
											a: args[1],
											b: args[2],
											sizeA: [a.length, 1],
											sizeB: [b.length, 1],
											sameSize: false,
											ok: false,
											error:
												"size mismatch: an exact comparison needs equal sizes",
										}
									: {
											identical: false,
											bbox: [0, 0, 1, 1],
											changedPixels: 1,
										},
							),
						);
						if (sizesDiffer) throw new Error("diff_map exited 2");
					},
					captureItems: async (_options, setup, folder) => {
						const fixture = timelineFixture();
						const side = setup.concept;
						const run = ++runs[side];
						if (mode === "confirmation-fails" && side === "build" && run === 3)
							throw new Error("confirmation fixture failed");
						let pixel = 0;
						fixture.window.paint = () => {
							pixel = kind.startsWith("vary-confirm")
								? side === (kind.endsWith("baseline") ? "base" : "build")
									? Number(run > 2)
									: 1
								: ["deterministic", "confirmation-fails"].includes(mode)
									? side === "build"
										? 1
										: 0
									: kind === `vary-${side === "base" ? "baseline" : "build"}`
										? run
										: 0;
							fixture.mutate();
						};
						fixture.author(
							"window.setTimeout(() => window.paint(), 40)",
							"http://fixture.test/callback.js",
						);
						const screenshot = fixture.page.screenshot;
						fixture.page.screenshot = async () => {
							const bytes = await screenshot();
							if (fixture.effects[0].currentTime < 200) bytes[0] += pixel;
							if (
								mode === "cross-size" &&
								side === "build" &&
								fixture.effects[0].currentTime === 100
							)
								return Buffer.concat([bytes, Buffer.from([0])]);
							if (
								mode.startsWith("vary-size-") &&
								fixture.effects[0].currentTime === 100 &&
								side === (kind.endsWith("baseline") ? "base" : "build") &&
								run > (kind.startsWith("vary-confirm") ? 2 : 1)
							)
								return Buffer.concat([bytes, Buffer.from([0])]);
							return bytes;
						};
						const timeline = await captureTimeline(fixture.page, {
							out: folder,
							stem: "callback",
							times: [1, 100, 200],
						});
						await writeFile(resolve(folder, "settled.png"), Buffer.from([0]));
						return {
							items: [
								{
									feature: "fixture.html/callback",
									state: "default",
									query: {},
									language: "en",
									size: "desktop",
									input: "mouse",
									motion: "full",
									transport: "http",
									colors: "normal",
									status: "pass",
									problems: [],
									files: ["settled.png"],
									timeline,
								},
							],
						};
					},
				},
			);
			if (["deterministic", "confirmation-fails", "cross-size"].includes(mode))
				await assert.rejects(call, /differences or problems/);
			else await call;
		} finally {
			console.log = original;
		}
		const report = JSON.parse(
			await readFile(resolve(out, "comparison.json"), "utf8"),
		);
		const samples = report.items[0].timeline.samples;
		if (["confirmation-fails", "cross-size"].includes(mode)) {
			assert.equal(report.items[0].result, "problem");
			assert.ok(
				report.items[0].problems.includes(
					mode === "cross-size"
						? "diff_map exited 2"
						: "confirmation fixture failed",
				),
			);
			assert.ok(
				report.items[0].timeline.captureSources.build.some(({ sources }) =>
					sources.some((finding) => finding.source.file === "callback.js"),
				),
			);
			assert.ok(
				lines.some((line) => /COMPARE FAIL:.*1 problems/.test(line)),
				lines.join("\n"),
			);
			continue;
		}
		assert.equal(report.items[0].result, "equal", "endpoints stay equal");
		assert.deepEqual(
			samples.map((s) => s.result),
			[
				"equal",
				mode === "deterministic"
					? "different"
					: mode === "equal"
						? "equal"
						: "not-held",
				"equal",
			],
		);
		assert.ok(
			samples[1].sources.some(
				(f) => f.source.file === "callback.js" && f.source.line === 1,
			),
		);
		for (const side of ["build", "baseline"]) {
			const stability = samples[1].stability[side];
			assert.equal(
				stability.identical,
				kind !== `vary-${side}` &&
					!(kind === "vary-confirm" && side === "build") &&
					!(kind === "vary-confirm-baseline" && side === "baseline"),
			);
			assert.equal(
				(await readFile(stability.first)).equals(
					await readFile(stability.repeat),
				),
				stability.identical,
			);
		}
		if (mode.startsWith("vary-")) {
			const side = kind.startsWith("vary-confirm")
				? kind.endsWith("baseline")
					? "baseline"
					: "build"
				: kind.slice(5);
			const line = lines.find((l) => l.startsWith("NOT-HELD:"));
			assert.ok(
				line.includes(
					`${side} captures ${samples[1].stability[side].first} and ${samples[1].stability[side].repeat}`,
				),
				line,
			);
			assert.ok(line.includes("callback.js:1"), line);
			assert.equal(report.timelineSummary["not-held"], 1);
			if (mode.startsWith("vary-confirm")) {
				assert.ok(
					(await readFile(samples[1].stability[side].first)).equals(
						await readFile(samples[1].stability[side].previousRepeat),
					),
					"the initial pair coincided before a later capture proved variation",
				);
				assert.equal(runs[side === "baseline" ? "base" : "build"], 3);
			}
		}
	}
});

test("X1: shared-time recapture retains callback findings from the initial capture", async () => {
	const out = resolve(scratch, "shared-callback-sources");
	const runs = { build: 0, base: 0 };
	await compare(
		{
			out,
			concept: "build",
			baseline: "base",
			page: "fixture.html",
			timeline: true,
			quiet: true,
		},
		{
			checkPort: async () => {},
			doctor: async (options) => ({
				concept: options.concept,
				tools: scratch,
				map: { pages: [{ page: "fixture.html" }] },
			}),
			child: async () => assert.fail("identical frames need no pixel diff"),
			captureItems: async (options, setup, folder) => {
				const fixture = timelineFixture();
				const run = ++runs[setup.concept];
				if (setup.concept === "build" && run === 1)
					fixture.author(
						"window.setTimeout(() => {}, 40)",
						"http://fixture.test/initial-only.js",
					);
				fixture.page.screenshot = async () => Buffer.from([0]);
				const timeline = await captureTimeline(fixture.page, {
					out: folder,
					stem: "shared",
					times:
						Object.values(options.timelineTimesByItem || {})[0] ||
						(setup.concept === "build" ? [1, 100] : [1, 100, 200]),
				});
				await writeFile(resolve(folder, "settled.png"), Buffer.from([0]));
				return {
					items: [
						{
							feature: "fixture.html/open",
							state: "default",
							query: {},
							language: "en",
							size: "desktop",
							input: "mouse",
							motion: "full",
							transport: "http",
							colors: "normal",
							status: "pass",
							problems: [],
							files: ["settled.png"],
							timeline,
						},
					],
				};
			},
		},
	);
	const report = JSON.parse(
		await readFile(resolve(out, "comparison.json"), "utf8"),
	);
	assert.deepEqual(report.items[0].timeline.times, [1, 100, 200]);
	assert.equal(report.timelineSummary.equal, 3);
	assert.ok(
		report.items[0].timeline.samples
			.find((sample) => sample.time === 100)
			.sources.some((finding) => finding.source.file === "initial-only.js"),
	);
	assert.equal(
		runs.build,
		3,
		"build uses initial, shared-time and stability captures",
	);
});

test("T1: playback rate changes remain visible, and cancelled effects cannot stall the scheduler", async () => {
	const frames = [];
	for (const rate of [1, 2]) {
		const fixture = timelineFixture();
		fixture.effects[0].playbackRate = rate;
		const out = resolve(scratch, `rate-${rate}`);
		const result = await captureTimeline(fixture.page, {
			out,
			stem: "rate",
			times: [1, 50, 100, 200],
		});
		frames.push(await readFile(resolve(out, result.samples[1].file)));
	}
	assert.notDeepEqual(
		frames[0],
		frames[1],
		"rate-only regression must differ mid-motion",
	);
	const fixture = timelineFixture();
	fixture.effects[0].cancel();
	const result = await captureTimeline(fixture.page, {
		out: resolve(scratch, "cancelled-effect"),
		stem: "cancelled",
	});
	assert.deepEqual(result.times, [1]);
	const settled = timelineFixture();
	settled.window.__verifyFitwayTimeline.release();
	settled.effects[0].currentTime = 200;
	settled.effects[0].finish();
	const prior = await captureTimeline(settled.page, {
		out: resolve(scratch, "prior-settled"),
		stem: "prior",
	});
	assert.deepEqual(prior.times, [1]);
	assert.equal(
		settled.effects[0].currentTime,
		200,
		"earlier settled effects must not replay",
	);
	const cancelledTimer = timelineFixture();
	let moved = false;
	const timer = cancelledTimer.window.setTimeout(() => {
		moved = true;
	}, 200);
	const finish = cancelledTimer.effects[0].finish.bind(
		cancelledTimer.effects[0],
	);
	cancelledTimer.effects[0].finish = () => {
		finish();
		cancelledTimer.window.clearTimeout(timer);
	};
	await captureTimeline(cancelledTimer.page, {
		out: resolve(scratch, "cancelled-timer"),
		stem: "timer",
	});
	assert.equal(
		moved,
		false,
		"effect completion can cancel a queued task before it executes",
	);
});

test("T1/T3: long finite effects have no time cap; late callback sources remain attached", async () => {
	const fixture = timelineFixture();
	fixture.effects[0].effect.getComputedTiming = () => ({ endTime: 6000 });
	runInNewContext(
		"window.setTimeout(() => {}, 6000)",
		{ window: fixture.window },
		{ filename: "http://fixture.test/delayed.js" },
	);
	const result = await captureTimeline(fixture.page, {
		out: resolve(scratch, "delayed-bound"),
		stem: "delayed",
	});
	assert.equal(result.times.at(-1), 6000);
	assert.equal(result.samples[0].result, "held");
	assert.equal(result.samples.at(-1).result, "held");
	assert.equal(result.samples.at(-1).sources[0].source.file, "delayed.js");
	assert.match(result.samples.at(-1).sources[0].reason, /timer callback/);
	const explicit = timelineFixture();
	explicit.effects[0].effect.getComputedTiming = () => ({ endTime: 6000 });
	await captureTimeline(explicit.page, {
		out: resolve(scratch, "long-explicit"),
		stem: "long",
		times: [1],
	});
	assert.equal(explicit.effects[0].playState, "finished");
	const successor = timelineFixture();
	successor.author(
		"window.setTimeout(()=>new Element().animate([0,1],{duration:10000}),50)",
		"http://fixture.test/successor.js",
	);
	await captureTimeline(successor.page, {
		out: resolve(scratch, "long-successor"),
		stem: "successor",
		times: [1],
	});
	assert.equal(
		successor.effects[1].playState,
		"finished",
		"explicit finalization follows longer effects created during it",
	);
});

test("T3: endless callbacks, pending intervals and unsupported rates retain findings", async () => {
	const endless = timelineFixture();
	runInNewContext(
		"function again(){window.setTimeout(again,1)};window.setTimeout(again,1)",
		{ window: endless.window },
		{ filename: "http://fixture.test/endless.js" },
	);
	const stopped = await captureTimeline(endless.page, {
		out: resolve(scratch, "endless-budget"),
		stem: "endless",
	});
	assert.ok(stopped.times.at(-1) <= 2100);
	assert.ok(
		stopped.samples
			.at(-1)
			.sources.some(
				(f) =>
					f.source.file === "endless.js" && /budget exhausted/.test(f.reason),
			),
	);
	for (const kind of ["interval", "rate"]) {
		const fixture = timelineFixture();
		if (kind === "interval")
			runInNewContext(
				"window.setInterval(()=>{},10000)",
				{ window: fixture.window },
				{ filename: "http://fixture.test/interval.js" },
			);
		else fixture.effects[0].playbackRate = 0;
		const result = await captureTimeline(fixture.page, {
			out: resolve(scratch, kind),
			stem: kind,
		});
		assert.equal(result.samples[0].result, "held");
		assert.match(
			result.samples[0].sources[0].reason,
			kind === "interval" ? /interval continuation/ : /playbackRate/,
		);
	}
});

test("T3: promise and completion callbacks remain attributed without forcing NOT-HELD", async () => {
	for (const [kind, script, trigger] of [
		[
			"promise",
			"window.promise=new Promise(ok=>window.resolve=ok);window.promise.then(()=>{})",
			"window.resolve()",
		],
		[
			"object",
			'window.target=new EventTarget();window.target.addEventListener("finish",{handleEvent(){}})',
			'window.target.dispatchEvent({type:"finish"})',
		],
		[
			"property",
			"window.target=new Element();window.target.ontransitionend=()=>{}",
			'window.target.dispatchEvent({type:"transitionend"})',
		],
	]) {
		const fixture = timelineFixture();
		fixture.author(script, "http://fixture.test/completion.js");
		const screenshot = fixture.page.screenshot;
		fixture.page.screenshot = async () => {
			fixture.author(trigger, "http://fixture.test/trigger.js");
			await Promise.resolve();
			return screenshot();
		};
		const result = await captureTimeline(fixture.page, {
			out: resolve(scratch, `completion-${kind}`),
			stem: kind,
			times: [1],
		});
		assert.equal(result.samples[0].result, "held");
		assert.equal(result.samples[0].sources[0].source.file, "completion.js");
		assert.equal(result.samples[0].sources[0].source.line, 1);
	}
});

test("T8: Windows declared, runtime, nested and caught skips fail by name/reason; other platforms skip", async () => {
	const gate = pathToFileURL(
		fileURLToPath(new URL("./skip-gate.mjs", import.meta.url)),
	).href;
	const env = { ...process.env };
	delete env.NODE_TEST_CONTEXT;
	for (const [name, body] of [
		["declared", 'test("planted declared", {skip:"planted reason"},()=>{});'],
		["runtime", 'test("planted runtime",t=>t.skip("planted reason"));'],
		[
			"nested",
			'test("parent",async t=>{await t.test("planted nested",{skip:"planted reason"},()=>{})});',
		],
		[
			"caught",
			'test("planted caught",t=>{try{t.skip("planted reason")}catch{}});',
		],
		["method", 'test.skip("planted method",()=>{});'],
		["unnamed", 'test(function planted_unnamed(t){t.skip("planted reason")});'],
		["options", 'test({skip:"planted reason"},function planted_options(){});'],
		[
			"hook",
			'beforeEach(t=>t.skip("planted reason"));test("planted hook",()=>{});',
		],
		[
			"hook_caught",
			'beforeEach(t=>{try{t.skip("planted reason")}catch{}});test("planted hook_caught",()=>{});',
		],
		[
			"teardown",
			'afterEach(t=>{try{t.skip("planted reason")}catch{}});test("planted teardown",()=>{});',
		],
	]) {
		const file = resolve(scratch, `skip-${name}.mjs`);
		await writeFile(
			file,
			`import {test as nodeTest,beforeEach,afterEach} from "node:test";import {verificationTest} from ${JSON.stringify(gate)};const test=verificationTest(nodeTest,"win32");${body}`,
		);
		const result = spawnSync(process.execPath, ["--test", file], {
			encoding: "utf8",
			windowsHide: true,
			env,
		});
		assert.notEqual(result.status, 0, result.stdout + result.stderr);
		assert.match(
			result.stdout + result.stderr,
			new RegExp(`planted[ _]${name}`),
		);
		assert.match(result.stdout + result.stderr, /planted reason|test.skip/);
		assert.match(result.stdout, /skipped 0/);
	}
	const file = resolve(scratch, "platform-skip.mjs");
	await writeFile(
		file,
		`import {test as nodeTest} from "node:test";import {verificationTest} from ${JSON.stringify(gate)};const test=verificationTest(nodeTest,"linux");test("Windows only",{skip:"other platform"},()=>{});`,
	);
	const result = spawnSync(process.execPath, ["--test", file], {
		encoding: "utf8",
		windowsHide: true,
		env,
	});
	assert.equal(result.status, 0, result.stdout + result.stderr);
	assert.match(result.stdout, /skipped 1/);
});

test("source derives pages, readiness, domains, openings and opener source; recipes prove coverage", () => {
	const map = generateMap(concept);
	const page = map.pages[0];
	assert.equal(page.ready, "window.__fixture?.ready === true");
	assert.deepEqual(page.switches.find((s) => s.name === "state").values, [
		"error",
		"live",
		"loading",
	]);
	assert.equal(
		page.openings.find((o) => o.selector === "#ops-pop").openers[0].selector,
		"#ops-btn",
	);
	assert.deepEqual(drift(map, concept), []);
});
test("switch scanner follows lexical scope and ignores unrelated Map.get", () => {
	const found = extractSwitches(
		'const p=new URLSearchParams(location.search);const v=p.get("kind");if(["all","count"].includes(v)){};function other(){const v="else";if(v==="wrong"){};const p=new Map();p.get("not-a-switch")}',
		"scope.js",
	);
	assert.deepEqual(
		found.map((s) => s.name),
		["kind"],
	);
	assert.deepEqual(found[0].values, ["all", "count"]);
});
test("source dependency is applied with a default or refused with its source reason; wide is independent", () => {
	const deps = extractDependencies(
		'const p=new URLSearchParams(location.search);\nif(p.has("record") && p.get("case")==="long"){};\nif(p.get("case")==="wide"){}',
		"activity.js",
	);
	assert.deepEqual(deps, [
		{
			switch: "case",
			value: "long",
			requires: [{ name: "record", present: true }],
			source: { file: "activity.js", line: 2 },
		},
	]);
	const page = {
		page: "activity.html",
		switches: [
			{ name: "case", values: ["long", "wide"], dependencies: deps },
			{ name: "record", values: [] },
		],
		defaults: { record: "1001" },
	};
	assert.deepEqual(resolveQuery(page, { case: "long" }).query, {
		case: "long",
		record: "1001",
	});
	assert.deepEqual(resolveQuery(page, { case: "wide" }).query, {
		case: "wide",
	});
	assert.deepEqual(resolveQuery(page, { case: "long", record: "1002" }).query, {
		case: "long",
		record: "1002",
	});
	assert.throws(
		() => resolveQuery({ ...page, defaults: {} }, { case: "long" }),
		/activity.js:2: case=long needs record/,
	);
	assert.ok(
		stateCases(page, { states: "all" }).some(
			(s) => s.name === "case=long&record=1001",
		),
	);
	assert.throws(
		() => stateCases(page, { query: "retired=1" }),
		/unmapped query switch retired/,
	);
});
test("value dependencies reject conflicts instead of changing an explicit request", () => {
	const page = {
		page: "fixture",
		switches: [
			{
				name: "arrive",
				dependencies: [
					{
						switch: "arrive",
						value: "500",
						requires: [{ name: "state", value: "loading" }],
						source: { file: "fixture.js", line: 3 },
					},
				],
			},
			{ name: "state" },
		],
	};
	assert.deepEqual(resolveQuery(page, { arrive: "500" }).query, {
		arrive: "500",
		state: "loading",
	});
	assert.throws(
		() => resolveQuery(page, { arrive: "500", state: "error" }),
		/needs state=loading; conflicting value error/,
	);
});
test("planted dialog fails by name, file, line and opener; adding a recipe restores coverage", async () => {
	const map = generateMap(concept);
	const file = resolve(concept, "index.html");
	try {
		await writeFile(
			file,
			`${html}\n<button id="novel-open" aria-controls="novel-dialog">Open</button><dialog id="novel-dialog"></dialog>`,
		);
		assert.match(
			drift(map, concept).join("\n"),
			/index.html:2: uncovered dialog #novel-dialog; openers: #novel-open/,
		);
		const r = authored();
		r.pages["index.html"].features.push({
			id: "novel",
			marker: "novel-dialog",
			actions: ["activate:#novel-open"],
			proof: { selector: "#novel-dialog", visible: true },
			covers: ["#novel-dialog"],
		});
		await writeFile(recipes, JSON.stringify(r));
		assert.deepEqual(drift(map, concept), []);
	} finally {
		await writeFile(file, html);
		await writeFile(recipes, JSON.stringify(authored()));
	}
});
test("JS factory dialog discovery includes opener and ignores comment markup", () => {
	const found = discoverElements([
		{
			file: "factory.js",
			text: '// <dialog id="comment-only">\nconst el=(tag,attrs)=>{};const button=el("button",{id:"drawer-open","aria-controls":"drawer"});const panel=el("section",{id:"drawer",role:"dialog",hidden:""});',
		},
	]);
	assert.equal(
		found.openings.some((o) => o.selector === "#comment-only"),
		false,
	);
	assert.ok(
		found.openings.some(
			(o) =>
				o.selector === "#drawer" &&
				o.source.line === 2 &&
				o.openers[0].selector === "#drawer-open",
		),
	);
});
test("native JS-created dialog and dynamically assigned role are named, with their opening controls", () => {
	const d = discoverElements([
		{
			file: "new.js",
			text: 'const dlg=document.createElement("dialog");\ndlg.id="native-dialog";\nconst open=document.querySelector("#open");open.addEventListener("click",()=>dlg.showModal());\nconst pop=document.createElement("div");pop.id="native-pop";pop.setAttribute("role","dialog");',
		},
	]);
	assert.ok(
		d.openings.some(
			(o) =>
				o.selector === "#native-dialog" &&
				o.openers.some((op) => op.selector === "#open"),
		),
	);
	assert.ok(d.openings.some((o) => o.selector === "#native-pop"));
});
test("recipe selector attribute values and nested state proofs cannot disappear unnoticed", async () => {
	const file = resolve(concept, "index.html");
	const r = authored();
	r.pages["index.html"].features.push({
		id: "custom",
		actions: ['activate:[data-range="custom"]'],
		proof: { selector: "main", visible: true },
	});
	r.pages["index.html"].states.push({
		when: { state: "loading" },
		proof: { allOf: [{ selector: "#gone-state", visible: true }] },
	});
	try {
		await writeFile(file, `${html}<button data-range="7d">Seven</button>`);
		await writeFile(recipes, JSON.stringify(r));
		const findings = coverageProblems(generateMap(concept), concept).join("\n");
		assert.match(findings, /selector gone: \[data-range="custom"\]/);
		assert.match(findings, /selector gone: #gone-state/);
	} finally {
		await writeFile(file, html);
		await writeFile(recipes, JSON.stringify(authored()));
	}
});
test("exact source probe exports work without running a checkout-dependent bootstrap", async () => {
	const file = resolve(scratch, "source-probe.mjs");
	await writeFile(
		file,
		'throw new Error("bootstrap must not run");\nexport const pure=(value)=>value+1;',
	);
	const p = sourceProbe(file, "pure");
	assert.equal(p.fn(4), 5);
	assert.equal(p.source.line, 2);
	assert.throws(() => sourceProbe(file, "missing"), /update the probe adapter/);
});
test("shared dialog helpers retain the source-derived opener relationship", () => {
	const found = discoverElements([
		{
			file: "shared.html",
			text: '<button id="export-btn"></button><dialog id="export-dialog"></dialog>',
		},
		{
			file: "shared.js",
			text: 'const dialog=document.querySelector("#export-dialog");const button=document.querySelector("#export-btn");function open(target){target.showModal();}button.addEventListener("click",()=>open(dialog));',
		},
	]);
	assert.ok(
		found.openings
			.find((o) => o.selector === "#export-dialog")
			.openers.some(
				(o) => o.selector === "#export-btn" && o.source.file === "shared.js",
			),
	);
});
test("vanished selector and marker fail even with a fresh map; renamed dialog is uncovered", async () => {
	const file = resolve(concept, "index.html");
	try {
		await writeFile(file, html.replace('id="ops-pop"', 'id="renamed-pop"'));
		const findings = coverageProblems(generateMap(concept), concept).join("\n");
		assert.match(findings, /uncovered dialog #renamed-pop/);
		assert.match(findings, /recipe status selector gone: #ops-pop/);
		await writeFile(file, html.replace("ops-btn", "retired-btn"));
		assert.match(
			coverageProblems(generateMap(concept), concept).join("\n"),
			/recipe status marker gone: ops-btn/,
		);
	} finally {
		await writeFile(file, html);
	}
});
test("unrelated source edits and line shifts pass coverage drift", async () => {
	const map = generateMap(concept);
	const file = resolve(concept, "app.js");
	try {
		await writeFile(file, `// harmless\n${js}`);
		assert.deepEqual(drift(map, concept), []);
	} finally {
		await writeFile(file, js);
	}
});
test("recipes are required, never inferred from a maintained CLI catalog", async () => {
	const r = await readFile(recipes, "utf8");
	try {
		await rm(recipes);
		assert.throws(() => generateMap(concept), /Recipes missing/);
	} finally {
		await writeFile(recipes, r);
	}
});
test("Playwright resolves from the skill checkout for a package-free concept", () => {
	const loaded = playwright(concept);
	assert.match(loaded.resolved, /@playwright/);
	assert.ok(loaded.pw.chromium);
});
test("short summary preserves axes, state, result and measuring error without bulk geometry", () => {
	assert.equal(shortFinding("one\n  two"), "one two");
	assert.match(shortFinding("detail ".repeat(1000)), /… \(see record\)$/);
	assert.ok(shortFinding("detail ".repeat(1000)).length < 260);
	const e = {
		feature: "page",
		state: "case=long&record=1001",
		query: { case: "long", record: "1001" },
		language: "ar",
		size: "narrow",
		input: "touch",
		motion: "reduce",
		transport: "http",
		status: "problem",
		problems: ["geometry: planted throw"],
		geometry: Array(1000).fill("detail"),
		files: ["frame.png"],
	};
	const s = itemSummary(e);
	assert.equal(s.result, "problem");
	assert.deepEqual(s.problems, e.problems);
	assert.equal(s.geometry, undefined);
	assert.ok(JSON.stringify(s).length < 500);
});
test("doctor gives portable concrete repair commands; verification ports are restricted", async () => {
	const opts = { concept, recipes };
	assert.match(
		await doctorFix(opts, new Error("Recipe drift")),
		/node '.*cli.mjs' repair-recipes --concept/,
	);
	assert.match(
		await doctorFix(opts, new Error("Chromium missing")),
		/cli.js' install chromium/,
	);
	for (const port of [3174, 3180, 3185])
		assert.throws(() => verificationPort(port), /choose 3176 or 3177/);
	assert.equal(verificationPort("3176"), 3176);
});

test("keyboard is an axis; Tab reaches controls and Space activates a button", async () => {
	assert.deepEqual(inputAxis("keyboard"), ["keyboard"]);
	const keys = [];
	let focus = 0;
	const stops = ["body", "#first", "#pin-change", "#pin-code"];
	const page = {
		evaluate: async () => ({ selector: stops[focus], text: stops[focus] }),
		locator: (selector) => ({
			first() {
				return this;
			},
			count: async () => 1,
			evaluate: async () => stops[focus] === selector,
		}),
		keyboard: {
			down: async (key) => {
				keys.push(key);
			},
			up: async (key) => {
				keys.push(key);
				focus = 3;
			},
			press: async (key) => {
				keys.push(key);
				focus = (focus + 1) % stops.length;
			},
		},
	};
	const entry = {};
	await performAction(
		{},
		page,
		"activate:#pin-change",
		"keyboard",
		scratch,
		"test",
		entry,
	);
	assert.deepEqual(keys, ["Tab", "Tab", "Space", "Space"]);
	assert.deepEqual(
		entry.focusSteps.map((s) => s.after.selector),
		["#first", "#pin-change", "#pin-code"],
	);
	await assert.rejects(
		reachByKeyboard(page, "#pointer-only", entry, "focus:#pointer-only"),
		/Not reachable by keyboard: #pointer-only; focus stopped at #pin-code.*cycle repeated/,
	);
});

test("a focused control whose keys do not produce the feature reports keyboard unreachability", async () => {
	const page = {
		evaluate: async () => ({ selector: "#mouse-only" }),
		locator: () => ({
			first() {
				return this;
			},
			waitFor: async () => {
				throw new Error("dialog stayed closed");
			},
		}),
	};
	await assert.rejects(
		proveFeature(
			page,
			{ selector: "#dialog", visible: true },
			"ar",
			"keyboard",
		),
		/Not reachable by keyboard via the recorded sequence: #dialog; focus stopped at #mouse-only \(element\); dialog stayed closed/,
	);
	await assert.rejects(
		proveFeature(page, { selector: "#dialog", visible: true }, "ar", "mouse"),
		/^Error: dialog stayed closed$/,
	);
});

test("planted aria-haspopup openers without targets, ids or classes fail by name, including specimens", async () => {
	const file = resolve(concept, "index.html");
	try {
		await writeFile(
			file,
			`${html}\n<button id="next-menu" aria-haspopup="menu">Next</button>\n<button aria-haspopup="true">Unnamed</button>\n<button id="closed" aria-haspopup="false">Closed</button>`,
		);
		const found = coverageProblems(generateMap(concept), concept).join("\n");
		assert.match(found, /index.html:2: uncovered opener #next-menu/);
		assert.match(
			found,
			/index.html:3: uncovered opener button\[aria-haspopup="true"\]/,
		);
		assert.doesNotMatch(found, /uncovered opener #closed/);
		const specimen = discoverElements([
			{
				file: "components.js",
				text: 'const specimen=`<button id="sample" tabindex="-1" aria-haspopup="menu"></button>`;const live=`<button id="live" aria-haspopup="menu"></button>`;',
			},
		]);
		assert.deepEqual(
			specimen.openers.map((o) => o.selector),
			["#sample", "#live"],
		);
	} finally {
		await writeFile(file, html);
	}
});

test("repair removes stale feature and state selectors/markers, preserves good entries and leaves only drafts; source is unchanged", async () => {
	const file = resolve(concept, "index.html");
	const stale = authored();
	stale.pages["index.html"].features.push({
		id: "gone-marker",
		marker: "retired",
		actions: [],
		proof: { ready: true },
	});
	stale.pages["index.html"].states.push({
		when: { state: "old" },
		proof: { selector: "#old-state", visible: true },
	});
	try {
		const source = `${html.replaceAll("ops-pop", "new-pop")}\n<button id="new-menu" aria-haspopup="menu">New</button>`;
		await writeFile(file, source);
		await writeFile(recipes, JSON.stringify(stale));
		const before = await readFile(recipes, "utf8");
		const repaired = repairRecipes(concept);
		assert.equal(repaired.dropped.length, 3);
		assert.equal(
			repaired.recipes.pages["index.html"].features.some(
				(f) => f.id === "status" || f.id === "gone-marker",
			),
			false,
		);
		assert.equal(repaired.recipes.pages["index.html"].states.length, 1);
		const copy = resolve(scratch, "repaired.json");
		await writeFile(copy, JSON.stringify(repaired.recipes));
		const findings = drift(generateMap(concept, copy), concept, copy);
		assert.equal(findings.length, 2);
		assert.ok(findings.every((p) => p.includes("draft recipe")));
		assert.equal(await readFile(file, "utf8"), source);
		assert.equal(await readFile(recipes, "utf8"), before);
		for (const f of repaired.recipes.pages["index.html"].features) {
			delete f.draft;
			f.proof = { selector: "main", visible: true };
		}
		await writeFile(copy, JSON.stringify(repaired.recipes));
		assert.deepEqual(drift(generateMap(concept, copy), concept, copy), []);
	} finally {
		await writeFile(file, html);
		await writeFile(recipes, JSON.stringify(authored()));
	}
});

test("missing recipes repair to drafts without touching concept inputs", async () => {
	const missing = resolve(scratch, "no-recipes.json");
	const result = repairRecipes(concept, missing);
	assert.ok(result.drafts.length);
	assert.equal(result.recipes.pages["index.html"].features[0].draft, true);
});

test("repaired duplicate selectors report only occurrence-bound drafts", async () => {
	const file = resolve(concept, "index.html");
	try {
		await writeFile(
			file,
			`${html}\n<button class="same" aria-haspopup="menu"></button><button class="same" aria-haspopup="menu"></button>`,
		);
		const repaired = repairRecipes(concept);
		assert.equal(repaired.drafts.length, 2);
		const copy = resolve(scratch, "duplicate-drafts.json");
		await writeFile(copy, JSON.stringify(repaired.recipes));
		const findings = coverageProblems(generateMap(concept, copy), concept);
		assert.equal(findings.length, 2);
		assert.ok(findings.every((p) => p.includes("draft recipe")));
	} finally {
		await writeFile(file, html);
	}
});

test("opener template parameters keep the enclosing function's literal call values", () => {
	const d = discoverElements([
		{
			file: "scope.js",
			// biome-ignore lint/suspicious/noTemplateCurlyInString: Fixture source intentionally contains a template expression.
			text: 'function render(act){return `<button data-act="${act}" aria-haspopup="dialog"></button>`;}function other(act){};render("mine");render("off");other("add");',
		},
	]);
	assert.deepEqual(
		d.openers.map((o) => o.selector),
		['[data-act="mine"]', '[data-act="off"]'],
	);
});

test("specimen source coverage cannot cover a live opener with identical classes; comment shifts retain coverage", async () => {
	const script = resolve(concept, "app.js");
	const r = authored();
	r.pages["index.html"].features.push({
		id: "specimen",
		actions: [],
		proof: { ready: true },
		coversOpeners: [
			{
				selector: 'button[aria-haspopup="menu"].same',
				file: "app.js",
				marker: "const specimen =",
			},
		],
	});
	const specimen =
		'\nconst specimen = `<button class="same" aria-haspopup="menu" tabindex="-1"></button>`;';
	try {
		await writeFile(recipes, JSON.stringify(r));
		await writeFile(script, js + specimen);
		assert.deepEqual(coverageProblems(generateMap(concept), concept), []);
		await writeFile(script, `// shifted\n${js}${specimen}`);
		assert.deepEqual(coverageProblems(generateMap(concept), concept), []);
		await writeFile(
			script,
			js +
				specimen +
				'\nconst live = `<button class="same" aria-haspopup="menu"></button>`;',
		);
		assert.match(
			coverageProblems(generateMap(concept), concept).join("\n"),
			/app.js:3: uncovered opener button\[aria-haspopup="menu"\].same/,
		);
		await writeFile(
			script,
			js +
				specimen +
				'const live = `<button class="same" aria-haspopup="menu"></button>`;',
		);
		const sameLine = generateMap(concept);
		assert.equal(sameLine.pages[0].openers.length, 2);
		assert.equal(
			coverageProblems(sameLine, concept).filter((p) =>
				p.includes("uncovered opener"),
			).length,
			1,
		);
		r.pages["index.html"].features.at(-1).coversOpeners = undefined;
		r.pages["index.html"].features.at(-1).actions = ["activate:#known .same"];
		await writeFile(recipes, JSON.stringify(r));
		assert.equal(
			coverageProblems(generateMap(concept), concept).filter((p) =>
				p.includes("uncovered opener"),
			).length,
			2,
		);
	} finally {
		await writeFile(script, js);
		await writeFile(recipes, JSON.stringify(authored()));
	}
});

test("JS-assigned aria-haspopup is discovered on native elements without ids", () => {
	const d = discoverElements([
		{
			file: "dynamic.js",
			text: 'const button=document.createElement("button");button.setAttribute("aria-haspopup","menu");\nconst second=document.createElement("button");second.ariaHasPopup="dialog";',
		},
	]);
	assert.equal(d.openers.length, 2);
	assert.equal(d.openers[0].selector, 'button[aria-haspopup="menu"]');
	assert.equal(d.openers[1].selector, 'button[aria-haspopup="dialog"]');
	const booleans = discoverElements([
		{
			file: "boolean.js",
			text: 'const button=document.createElement("button");button.id="boolean-menu";button.setAttribute("aria-haspopup",true);const second=document.createElement("button");second.ariaHasPopup=true;',
		},
	]);
	assert.deepEqual(
		booleans.openers.map((o) => o.kind),
		["true", "true"],
	);
});

test("IPv6 listener refusal names :: and leaves its owner running", async () => {
	const server = createServer((_, res) => res.end("foreign IPv6"));
	await new Promise((done) => server.listen(0, "::", done));
	const port = server.address().port;
	assert.ok(port >= 49152);
	try {
		const cli = fileURLToPath(new URL("./cli.mjs", import.meta.url));
		const result = spawnSync(
			process.execPath,
			[
				cli,
				"launch",
				"--concept",
				concept,
				"--isolated-port",
				String(port),
				"--out",
				resolve(scratch, "ipv6-refusal"),
			],
			{ encoding: "utf8", windowsHide: true },
		);
		assert.equal(result.status, 1);
		if (process.platform === "win32") assert.match(result.stderr, /:: pid=/);
		assert.ok(result.stderr.includes(`Port ${port}`), result.stderr);
		assert.equal((await fetchRaw(port, "/")).body.toString(), "foreign IPv6");
	} finally {
		await new Promise((done) => server.close(done));
	}
});

test("listener parsing preserves IPv6 and IPv4 addresses; LAN URLs use real external interfaces", () => {
	assert.deepEqual(
		lanOrigins(
			3176,
			{
				net: [
					{ family: "IPv4", address: "169.254.1.2", internal: false },
					{ family: "IPv4", address: "172.24.1.1", internal: false },
					{ family: "IPv4", address: "192.168.1.8", internal: false },
				],
			},
			["192.168.1.8"],
		),
		["http://192.168.1.8:3176"],
	);
	assert.deepEqual(
		parsePortOwners(
			"TCP [::]:3177 [::]:0 LISTENING 42\nTCP 0.0.0.0:3176 0.0.0.0:0 LISTENING 43",
			3177,
		),
		[{ address: "::", pid: 42 }],
	);
	assert.deepEqual(
		lanOrigins(3176, {
			net: [{ family: "IPv4", address: "192.168.1.8", internal: false }],
			local: [{ family: "IPv4", address: "127.0.0.1", internal: true }],
		}),
		["http://192.168.1.8:3176"],
	);
	assert.throws(() => lanOrigins(3176, {}), /No external IPv4 LAN address/);
	assert.match(
		diffStem({
			feature: "access.html/pinChange",
			state: "pin=none",
			language: "ar",
			size: "tablet",
			input: "keyboard",
			motion: "reduce",
			transport: "http",
		}),
		/access-html-pinChange-pin-none-ar-tablet-keyboard-reduce-http/,
	);
});

test("help in a dependency-free clone succeeds and names installation", async () => {
	const folder = resolve(scratch, "clone/.agents/skills/verify-fitway");
	await copyHelpFixture(folder);
	const result = spawnSync(
		process.execPath,
		[resolve(folder, "cli.mjs"), "help"],
		{ encoding: "utf8", windowsHide: true },
	);
	assert.equal(result.status, 0, result.stderr + result.stdout);
	assert.match(result.stdout, /--inputs mouse,touch,keyboard/);
	assert.match(result.stdout, /pnpm --dir .* install --frozen-lockfile/);
	assert.doesNotMatch(result.stderr, /Cannot find module/);
});
test("quiet comparison children keep diff JSON and diagnostics off success output, and preserve failure diagnostics", async () => {
	const noisy = resolve(scratch, "noisy-diff.mjs");
	const caller = resolve(scratch, "quiet-caller.mjs");
	await writeFile(
		noisy,
		'console.log(JSON.stringify({diff:Array(1000).fill("detail")}));console.error("diff_map: summary");',
	);
	await writeFile(
		caller,
		`import {child} from ${JSON.stringify(new URL("./cli.mjs", import.meta.url).href)};try{await child(process.execPath,[${JSON.stringify(noisy)}],${JSON.stringify(scratch)},undefined,true)}catch(error){console.error(error.message);process.exitCode=1}`,
	);
	const success = spawnSync(process.execPath, [caller], {
		encoding: "utf8",
		windowsHide: true,
	});
	assert.equal(success.status, 0);
	assert.equal(success.stdout, "");
	assert.equal(success.stderr, "");
	await writeFile(
		noisy,
		'console.error("planted diff failure");process.exit(2);',
	);
	const failure = spawnSync(process.execPath, [caller], {
		encoding: "utf8",
		windowsHide: true,
	});
	assert.equal(failure.status, 1);
	assert.match(failure.stderr, /planted diff failure/);
});
function fetchRaw(port, path, method = "GET") {
	return new Promise((done, reject) => {
		const req = request({ host: "127.0.0.1", port, path, method }, (res) => {
			const chunks = [];
			res.on("data", (c) => chunks.push(c));
			res.on("end", () =>
				done({
					status: res.statusCode,
					headers: res.headers,
					body: Buffer.concat(chunks),
				}),
			);
		});
		req.once("error", reject);
		req.end();
	});
}
test("foreign wildcard port is refused; launch never passes; cleanup after refusal retains the foreign server", async () => {
	const server = createServer((_, res) => res.end("foreign wildcard"));
	await new Promise((done) => server.listen(0, "0.0.0.0", done));
	const port = server.address().port;
	assert.ok(port >= 49152);
	const cli = fileURLToPath(new URL("./cli.mjs", import.meta.url));
	const folder = resolve(scratch, "refused-launch");
	try {
		await assert.rejects(portAvailable(port), /did not start/);
		const result = spawnSync(
			process.execPath,
			[
				cli,
				"launch",
				"--concept",
				concept,
				"--isolated-port",
				String(port),
				"--out",
				folder,
			],
			{ encoding: "utf8", windowsHide: true },
		);
		assert.equal(result.status, 1);
		assert.doesNotMatch(result.stdout, /LAUNCH PASS/);
		assert.match(result.stderr, /did not start/);
		assert.ok(result.stderr.includes(`Port ${port}`), result.stderr);
		const cleanup = spawnSync(
			process.execPath,
			[cli, "cleanup", "--session", folder],
			{ encoding: "utf8", windowsHide: true },
		);
		assert.equal(cleanup.status, 0);
		assert.match(cleanup.stdout, /CLEANUP PASS: no owned preview started/);
		assert.equal(
			(await fetchRaw(port, "/")).body.toString(),
			"foreign wildcard",
		);
	} finally {
		await new Promise((done) => server.close(done));
	}
	await portAvailable(port);
});
test("preview no-store covers every response class, HEAD/query and containment; only owned resources close", async () => {
	for (const name of ["style.css", "font.woff2", "image.png", "data.json"])
		await writeFile(resolve(concept, name), "fixture");
	const outside = resolve(scratch, "outside.txt");
	await writeFile(outside, "SECRET OUTSIDE");
	await symlink(outside, resolve(concept, "escape.txt"));
	const server = await preview({ concept, port: 0 });
	try {
		for (const path of [
			"/",
			"/app.js",
			"/style.css",
			"/font.woff2",
			"/image.png",
			"/data.json",
			"/missing",
			"/index.html?lang=en",
			"/escape.txt",
			"/%2e%2e%2foutside.txt",
			"/%00",
		])
			for (const method of ["GET", "HEAD"]) {
				const result = await fetchRaw(server.port, path, method);
				assert.equal(result.headers["cache-control"], "no-store");
				assert.ok(!result.body.toString().includes("SECRET OUTSIDE"));
				if (method === "HEAD") assert.equal(result.body.length, 0);
			}
		await assert.rejects(
			preview({ concept, port: server.port }),
			/held by a process|busy/,
		);
		assert.equal(
			(await fetchRaw(server.port, "/__verify/stop", "POST")).status,
			403,
		);
	} finally {
		await server.close();
	}
	await portAvailable(server.port);
});
test("output refuses git worktrees, junction aliases and escaping paths before writes", async () => {
	const tree = resolve(scratch, "tree");
	await mkdir(tree);
	await writeFile(resolve(tree, ".git"), "gitdir: D:/elsewhere");
	const link = resolve(scratch, "alias");
	await symlink(tree, link, process.platform === "win32" ? "junction" : "dir");
	for (const root of [tree, link])
		assert.throws(
			() => assertOutsideGit(resolve(root, "never-created")),
			/Refusing output/,
		);
	await assert.rejects(outputFile(scratch, "../escaped.json"), /escapes/);
});
test("delegated tool interruption finishes its own cleanup before the parent returns", async () => {
	const helper = resolve(scratch, "cancel-fixture.mjs");
	const cleaned = resolve(scratch, "cleaned.txt");
	await writeFile(
		helper,
		'import {writeFileSync} from "node:fs";import {resolve} from "node:path";process.once("SIGINT",()=>{writeFileSync(resolve(process.cwd(),"cleaned.txt"),"cleaned");process.exit(130)});writeFileSync(resolve(process.cwd(),"ready.txt"),"ready");setInterval(()=>{},1000);',
	);
	const ready = new Promise((done, reject) => {
		const watcher = watch(scratch, (_, name) => {
			if (name === "ready.txt") {
				clearTimeout(timeout);
				watcher.close();
				done();
			}
		});
		const timeout = setTimeout(() => {
			watcher.close();
			reject(new Error("Worker readiness timeout"));
		}, 5000);
	});
	const controller = new AbortController();
	const running = child(process.execPath, [helper], scratch, controller.signal);
	try {
		await ready;
		controller.abort();
		await assert.rejects(running, /130.*cleanup completed/);
	} finally {
		controller.abort();
	}
	assert.equal(await readFile(cleaned, "utf8"), "cleaned");
});

const cliPath = fileURLToPath(new URL("./cli.mjs", import.meta.url));
const portObserverPath = fileURLToPath(
	new URL("./port-observer.cjs", import.meta.url),
);
function runCli(args, cli = cliPath, env = {}) {
	return spawnSync(process.execPath, [cli, ...args], {
		encoding: "utf8",
		windowsHide: true,
		env: {
			...process.env,
			VERIFY_FITWAY_TEST_DOCTOR_PORT_PROBE: "0",
			...env,
		},
	});
}
function sessionCommandArgs(command, folder, out) {
	if (command === "cleanup") return [command, "--session", folder];
	return [
		command,
		"--concept",
		concept,
		"--session",
		folder,
		...(command === "drive" ? ["--out", out] : []),
	];
}
test("Y2: a test-only doctor seam never probes a verification port", async () => {
	const folder = resolve(scratch, "doctor-test-port-seam");
	const port = await isolatedPort();
	const log = resolve(scratch, "doctor-test-port-seam.jsonl");
	await mkdir(folder);
	await writeFile(
		resolve(folder, "session.json"),
		JSON.stringify({
			concept,
			pid: 2147483647,
			port,
			token: "test-only",
		}),
	);
	const result = spawnSync(
		process.execPath,
		[
			"--require",
			portObserverPath,
			cliPath,
			"doctor",
			"--concept",
			concept,
			"--session",
			folder,
		],
		{
			encoding: "utf8",
			windowsHide: true,
			env: {
				...process.env,
				VERIFY_FITWAY_PORT_HOOK_LOG: log,
				VERIFY_FITWAY_TEST_DOCTOR_PORT_PROBE: "0",
			},
		},
	);
	assert.equal(result.status, 1, result.stdout + result.stderr);
	assert.match(result.stderr, /FIX: .*--port 3176 /);
	const observations = existsSync(log)
		? (await readFile(log, "utf8"))
				.trim()
				.split("\n")
				.filter(Boolean)
				.map(JSON.parse)
		: [];
	assert.deepEqual(observations, [], result.stdout + result.stderr);
});
test("V1: no recipe file is SKIP, while a checked recipe still passes", async () => {
	const empty = resolve(scratch, "no-recipes");
	await mkdir(empty);
	const skipped = runCli(["drift-tree", "--root", empty]);
	assert.equal(skipped.status, 0, skipped.stderr);
	assert.match(skipped.stdout, /no recipe file was found/i);
	assert.match(skipped.stdout, /verification-recipes.json/);
	assert.doesNotMatch(skipped.stdout, /PASS/);
	const checked = runCli(["drift-tree", "--root", concept]);
	assert.equal(checked.status, 0, checked.stderr);
	assert.match(
		checked.stdout,
		/DRIFT PASS: 1 recipe files found and checked\./,
	);
});
test("V2: dependency-free discovery and browser commands name the package and install once", async () => {
	const folder = resolve(scratch, "cold/.agents/skills/verify-fitway");
	await copyAllFixture(folder);
	const cli = resolve(folder, "cli.mjs");
	for (const command of [
		"map",
		"list",
		"drift",
		"repair-recipes",
		"drift-tree",
	]) {
		const result = runCli(
			command === "drift-tree"
				? [command, "--root", concept]
				: [
						command,
						"--concept",
						concept,
						...(["map", "repair-recipes"].includes(command)
							? ["--out", resolve(scratch, `cold-${command}`)]
							: []),
					],
			cli,
		);
		assert.equal(result.status, 1, result.stdout);
		assert.match(result.stderr, /Missing dependency: typescript/);
		assert.match(
			result.stderr,
			/FIX: pnpm --dir '.*cold.*' install --frozen-lockfile/,
		);
		assert.doesNotMatch(
			result.stderr,
			/Cannot find module|Require stack|\n\s+at /,
		);
		assert.equal((result.stderr.match(/FAIL:/g) || []).length, 1);
	}
	const caller = resolve(scratch, "cold-playwright.mjs");
	await writeFile(
		caller,
		`import {playwright} from ${JSON.stringify(pathToFileURL(cli).href)};
try {playwright()} catch(error) {console.error(error.message + "\\nFIX: " + error.fix); process.exitCode=1}`,
	);
	const browser = spawnSync(process.execPath, [caller], {
		encoding: "utf8",
		windowsHide: true,
	});
	assert.equal(browser.status, 1);
	assert.match(browser.stderr, /Missing dependency: @playwright\/test/);
	assert.match(browser.stderr, /pnpm --dir .* install --frozen-lockfile/);
	assert.doesNotMatch(
		browser.stderr,
		/Cannot find module|Require stack|\n\s+at /,
	);
});
test("V3: doctor and drive setup failures print one fault block", () => {
	for (const command of ["doctor", "drive", "compare"]) {
		const result = runCli([
			command,
			"--concept",
			concept,
			...(command === "compare" ? ["--baseline", concept] : []),
			...(command === "doctor"
				? []
				: ["--out", resolve(scratch, `one-block-${command}`)]),
		]);
		assert.equal(result.status, 1);
		assert.equal(
			(result.stderr.match(/FAIL:/g) || []).length,
			1,
			result.stderr,
		);
		assert.equal(
			(result.stderr.match(/Probe kit missing/g) || []).length,
			1,
			result.stderr,
		);
		assert.match(result.stderr, /DOCTOR FAIL:/);
		assert.match(result.stderr, /FIX BLOCKED: restore the missing probe kit/);
	}
});

// Exercise the runner's actual evidence/summary path through a deterministic UI
// adapter. The fast ladder does not need a browser installation for these contracts.
async function runnerFixture(name, features, options = {}) {
	const root = resolve(scratch, name);
	const build = resolve(root, "concept");
	const tools = resolve(root, "tools");
	const out = resolve(root, "out");
	await mkdir(resolve(build, "tools/probes"), { recursive: true });
	await mkdir(resolve(tools, "scripts/web"), { recursive: true });
	await writeFile(
		resolve(tools, "scripts/web/_common.mjs"),
		'export const TOOL_VERSION="1.2.0"; export const CONTEXT_SPEC={forcedColors:{type:"string"}};',
	);
	await writeFile(
		resolve(build, "tools/probes/lib.mjs"),
		"export const introSettled=async()=>{}; export const overflowProbe=()=>({hScroll:false});",
	);
	await writeFile(
		resolve(build, "tools/probes/geom.mjs"),
		"export const geometryProbe=()=>({});",
	);
	await writeFile(
		resolve(build, "tools/probes/a11y.mjs"),
		"export const accessibilityProbe=()=>({});",
	);
	await writeFile(
		resolve(tools, "scripts/web/lib.mjs"),
		`
import {appendFile,writeFile} from "node:fs/promises";
import {createContext,runInContext} from "node:vm";
const motion=${JSON.stringify(options.scriptMotion || null)}, phase=${JSON.stringify(options.scriptPhase || 0)};
const dynamicState=${JSON.stringify(Boolean(options.dynamicState))};
const transitionOnCapture=${JSON.stringify(Boolean(options.transitionOnCapture))};
const capturePhases=${JSON.stringify(options.capturePhases || [])};
const transitionAfterProofs=${JSON.stringify(options.transitionAfterProofs ?? null)};
let fixturePhase="loading", phaseReads=0;
let captureCount=0;
const capture=async(via,options,picture)=>{await appendFile(${JSON.stringify(resolve(root, "captures.jsonl"))},JSON.stringify({via,options})+"\\n");return Buffer.from(picture)};
export const launchChromium=async(loaded,options)=>{await writeFile(${JSON.stringify(resolve(root, "launch.json"))},JSON.stringify(options||null));return {close:async()=>{}}};
export async function newContext(browser, options) {
 let language=options.locale?.startsWith("ar")?"ar":"en";
 let focus="body", open=false;
 let now=0, next=0; const frames=new Map();
 const sandbox={position:0,document:{getAnimations:()=>[]},
 requestAnimationFrame:(callback)=>{const id=++next;frames.set(id,callback);return id},
 cancelAnimationFrame:(id)=>frames.delete(id)};
 sandbox.window=sandbox; createContext(sandbox);
 const run=(fn)=>runInContext('('+fn.toString()+')()',sandbox);
 const tick=()=>{now+=16;for(const id of [...frames.keys()]){const callback=frames.get(id);if(callback){frames.delete(id);callback.call(sandbox,now)}}};
const page={setDefaultTimeout(){},addInitScript:async(fn)=>{await appendFile(${JSON.stringify(resolve(root, "init.jsonl"))},"observer\\n");if(motion)run(fn)},
 startMotion:()=>{if(motion){runInContext('function move(){position++;if('+JSON.stringify(motion==='forever')+'||position<20)requestAnimationFrame(move)};requestAnimationFrame(move)',sandbox);for(let i=0;i<phase;i++)tick()}},
  tick,picture:()=>dynamicState?fixturePhase:motion?JSON.stringify({x:sandbox.position}):"fixture",
  waitForFunction:async(fn,arg,options)=>{
   if(dynamicState&&typeof fn==="string"&&fn.includes("__fixturePhase")){
    if(transitionAfterProofs!==null&&phaseReads===transitionAfterProofs)fixturePhase="ready";
    phaseReads++;
    const wantsLoading=fn.includes("'loading'")||fn.includes('"loading"');
    if(wantsLoading&&fixturePhase!=="loading")throw new Error("Timeout 5000 ms: loading state changed before capture");
    if(!wantsLoading&&fixturePhase!=="ready")throw new Error("Timeout 5000 ms: arrival state not observed");
    return;
   }
   if(!motion)return;if(!Number.isFinite(options.timeout)||options.timeout<=0)throw new Error('Motion wait must have a finite positive bound');let remaining=options.timeout;while(!run(fn)){if(remaining<=0)throw new Error('Timeout '+options.timeout+' ms: script motion still schedules frames');tick();remaining-=16}},
 transitionOnCapture:()=>{const phase=capturePhases[captureCount++];if(transitionOnCapture)fixturePhase="ready";if(phase)fixturePhase=phase},
  screenshot:async(options)=>{page.transitionOnCapture();return capture("native",options,page.picture())},
context:()=>({newCDPSession:async()=>({send:async(method)=>method==="Runtime.evaluate"?{result:{objectId:"focus"}}:method==="Accessibility.getPartialAXTree"?{nodes:[{role:{value:"button"},name:{value:"Open details"}}]}:{},detach:async()=>{}})}),
  evaluate:async(fn)=>fn.toString().includes("coarse")
   ? {language,direction:language==="ar"?"rtl":"ltr",coarse:false,touchPoints:0}
   : fn.toString().includes("Canvas") ? {active:true,background:"rgb(0, 0, 0)",canvas:"rgb(0, 0, 0)"}
: fn.toString().includes("document.activeElement") ? {selector:focus,tag:focus==="body"?"body":"button",page:focus==="body",text:"Whole page text must never appear in a focus message"} : motion&&fn.toString().includes("document.getAnimations")?run(fn):{},
locator:(selector)=>({first(){return this},count:async()=>1,
evaluate:async()=>focus===selector,ariaSnapshot:async()=>selector==="body"?"body":'- button "Open details"',
   waitFor:async()=>{if(selector==="#dialog"&&!open)throw new Error("dialog stayed closed")}}),
  keyboard:{
   down:async()=>{},
   up:async(key)=>{if(key==="Space"&&focus==="#opener"){open=true;focus="#field"}},
   press:async(key)=>{if(key==="Tab")focus=focus==="body"?"#opener":"body";
    if(key==="Enter"&&focus==="#opener"){open=true;focus="#field"}}}};
 return {page,context:{close:async()=>{}},errors:[],emulation:{forcedColors:options.forcedColors || "none"}};
}
export const withParams=(url)=>url;
export const preparePage=async(page)=>{page.startMotion();return {ready:true}};
export const screenshot=async(page,options)=>{page.transitionOnCapture();return capture("adapter",options,page.picture())};
export const twoFrames=async(page)=>{page.tick();page.tick()};
export const injectProbe=async()=>{};
export const renderSheet=async()=>{};
`,
	);
	const caller = resolve(root, "caller.mjs");
	await writeFile(
		caller,
		`import {drive} from ${JSON.stringify(new URL("./runner.mjs", import.meta.url).href)};
import * as core from ${JSON.stringify(new URL("./core.mjs", import.meta.url).href)};
try {await drive(${JSON.stringify({
			concept: build,
			tools,
			out,
			loaded: {},
			map: {
				sizes: { desktop: { width: 1440, height: 900 } },
				pages: [
					{
						page: "fixture.html",
						ready: "true",
						switches: options.switches || [],
						features,
						states: options.mapStates || [
							{
								when: {},
								shows: "Fixture state",
								proof: { selector: "main", visible: true },
							},
						],
						defaults: options.defaults || {},
					},
				],
			},
			page: "fixture.html",
			feature: "all",
			languages: "en",
			sizes: "desktop",
			inputs: "keyboard",
			motions: "reduce",
			transports: "file",
			...options,
		})})}
catch(error){if(!(core.ReportedFailure && error instanceof core.ReportedFailure))console.error("FAIL: "+error.message);process.exitCode=1}`,
	);
	return {
		root,
		out,
		result: spawnSync(process.execPath, [caller], {
			encoding: "utf8",
			windowsHide: true,
		}),
	};
}
test("R20 V1: colours multiply states and reach the context, manifest and FRAME; default stays normal", async () => {
	const features = [{ id: "page", proof: { selector: "main", visible: true } }];
	const { result, out } = await runnerFixture("colours", features, {
		colors: "normal,forced",
		states: ",",
	});
	assert.equal(result.status, 0, result.stderr + result.stdout);
	const manifest = JSON.parse(
		await readFile(resolve(out, "manifest.json"), "utf8"),
	);
	assert.deepEqual(
		manifest.items.map((i) => i.colors),
		["normal", "forced", "normal", "forced"],
	);
	assert.equal(manifest.items[1].emulation.forcedColors, "active");
	assert.match(result.stdout, /FRAME PASS: .* file normal/);
	assert.match(result.stdout, /FRAME PASS: .* file forced/);
	assert.notEqual(manifest.items[0].files[0], manifest.items[1].files[0]);
	const normal = await runnerFixture("colours-default", features);
	assert.equal(normal.result.status, 0, normal.result.stderr);
	const one = JSON.parse(
		await readFile(resolve(normal.out, "manifest.json"), "utf8"),
	);
	assert.equal(one.items[0].colors, "normal");
	const invalid = await runnerFixture("colours-invalid", features, {
		colors: "sepia",
	});
	assert.equal(invalid.result.status, 1);
	assert.match(invalid.result.stderr, /Unsupported.*sepia.*normal.*forced/);
});
test("R20 V2: drive, compare and measure refuse forced requests with ui-forensics 1.1.0 before rendering", async () => {
	const tools = resolve(scratch, "old-forensics");
	await mkdir(resolve(tools, "scripts/web"), { recursive: true });
	await writeFile(
		resolve(tools, "scripts/web/_common.mjs"),
		'export const TOOL_VERSION="1.2.0"; export const CONTEXT_SPEC={forcedColors:{type:"string"}};',
	);
	await writeFile(
		resolve(tools, "scripts/web/_common.mjs"),
		'export const TOOL_VERSION = "1.1.0";',
	);
	for (const command of ["drive", "compare", "measure"]) {
		const axes =
			command === "measure"
				? [
						"--tool",
						"focus",
						"--out",
						resolve(scratch, "refusal"),
						"--",
						"--forced-colors",
						"active",
					]
				: ["--colors", "forced"];
		const result = spawnSync(
			process.execPath,
			[
				fileURLToPath(new URL("./cli.mjs", import.meta.url)),
				command,
				"--forensics",
				tools,
				...(command === "measure" ? [] : ["--concept", concept]),
				...axes,
			],
			{ encoding: "utf8", windowsHide: true },
		);
		assert.equal(result.status, 1, result.stdout);
		assert.match(result.stderr, /forced.*ui-forensics.*1\.2\.0.*1\.1\.0/i);
		assert.doesNotMatch(result.stdout, /FRAME|DRIVE PASS|COMPARE|MEASURE PASS/);
	}
});
test("R20 V2: measurement matrices and inline options also fail closed, with the tool's whitespace handling", async () => {
	const tools = resolve(scratch, "matrix-old-forensics");
	await mkdir(resolve(tools, "scripts/web"), { recursive: true });
	await writeFile(
		resolve(tools, "scripts/web/_common.mjs"),
		'export const TOOL_VERSION="1.1.0";',
	);
	const frames = resolve(scratch, "forced-frames.json");
	await writeFile(
		frames,
		JSON.stringify({ matrix: { forcedColors: ["none", "active"] } }),
	);
	for (const extra of [
		["--forced-colors=active"],
		["--each", "forced-colors =none, active"],
		["--frames", frames],
		["--spec", frames],
	]) {
		assert.equal(measurementColors({ extra }).forced, true);
		const result = spawnSync(
			process.execPath,
			[
				fileURLToPath(new URL("./cli.mjs", import.meta.url)),
				"measure",
				"--tool",
				"capture",
				"--forensics",
				tools,
				"--out",
				resolve(scratch, "matrix-refusal"),
				"--",
				...extra,
			],
			{ encoding: "utf8", windowsHide: true },
		);
		assert.equal(result.status, 1);
		assert.match(
			result.stderr,
			/Forced colours require ui-forensics >=1\.2\.0.*found 1\.1\.0/,
		);
	}
	assert.deepEqual(measurementColors({ colors: "forced", extra: [] }).args, [
		"--forced-colors",
		"active",
	]);
	assert.throws(
		() => measurementColors({ extra: ["--forced-colors", "sepia"] }),
		/none or active/,
	);
});

// Stub only the browser/tool boundary; exercise the real CLI and drive runner.
async function heldCliFixture(name, explicitRelease = false) {
	const root = resolve(scratch, name);
	const build = resolve(root, "concept");
	const tools = resolve(root, "tools");
	await mkdir(resolve(build, "tools/probes"), { recursive: true });
	await mkdir(resolve(tools, "scripts/web"), { recursive: true });
	await writeFile(
		resolve(build, "fixture.html"),
		'<main>Fixture</main><button id="control">Hold</button><script src="app.js"></script>',
	);
	await writeFile(resolve(build, "app.js"), "window.__fixture={ready:true};");
	await writeFile(
		resolve(build, "verification-recipes.json"),
		JSON.stringify({
			schema: 1,
			pages: {
				"fixture.html": {
					features: [
						{
							id: "held",
							actions: [
								"hold:#control",
								...(explicitRelease ? ["release"] : []),
							],
							proof: { ready: true },
						},
						{ id: "next", actions: [], proof: { ready: true } },
					],
					states: [
						{ when: {}, shows: "Fixture state", proof: { ready: true } },
					],
				},
			},
		}),
	);
	await writeFile(
		resolve(build, "tools/probes/lib.mjs"),
		"export const introSettled=async()=>{}; export const overflowProbe=()=>({hScroll:false});",
	);
	await writeFile(
		resolve(build, "tools/probes/geom.mjs"),
		"export const geometryProbe=()=>({});",
	);
	await writeFile(
		resolve(build, "tools/probes/a11y.mjs"),
		"export const accessibilityProbe=()=>({});",
	);
	await writeFile(resolve(tools, "SKILL.md"), "Test adapter");
	await writeFile(resolve(tools, "scripts/web/probe.js"), "");
	await writeFile(
		resolve(tools, "scripts/web/_common.mjs"),
		'export const TOOL_VERSION="1.3.1";',
	);
	await writeFile(
		resolve(tools, "scripts/web/lib.mjs"),
		`
import {appendFile,mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
export const TOOL_VERSION="1.3.1";
let held=null;
const event=async(type)=>{await mkdir(process.env.PROBE_OUT,{recursive:true});await appendFile(resolve(process.env.PROBE_OUT,"events.jsonl"),JSON.stringify({type,held:Boolean(held)})+"\\n")};
export const launchChromium=async()=>({close:async()=>{}});
export async function newContext(browser,options){
 await event("item-start");
 const page={setDefaultTimeout(){},
 evaluate:async(fn)=>fn.toString().includes("coarse")?{language:"en",direction:"ltr",coarse:false,touchPoints:0}
 :fn.toString().includes("document.activeElement")?{selector:"body",text:"body"}:{},
 locator:()=>({first(){return this},ariaSnapshot:async()=>"body",waitFor:async()=>{}})};
 return {page,context:{close:async()=>event("context-close")},errors:[],emulation:{}};
}
export async function runAction(page,action){
 await event(action);
 if(action==="hold:#control")held={selector:"#control",input:"mouse",pressedAt:performance.now(),active:true,classification:"stub classification"};
 else if(action==="release")await releaseHeld(page);
 else throw new Error("Unexpected stub action: "+action);
}
export const heldPressInfo=async()=>held;
export async function releaseHeld(){await event("release");held=null;}
export const withParams=(url)=>url;
export const preparePage=async()=>({ready:true});
export const screenshot=async()=>{await event("capture");return Buffer.from(held?"held-frame":"rest-frame")};
export const twoFrames=async()=>{};
export const injectProbe=async()=>{};
export const renderSheet=async(browser,spec,file)=>writeFile(file,"stub sheet");
`,
	);
	const preload = resolve(root, "browser-stub.cjs");
	await writeFile(
		preload,
		`const Module=require("node:module"),load=Module._load;
Module._load=function(name,...args){return name==="@playwright/test"?{chromium:{executablePath:()=>process.execPath}}:load.call(this,name,...args)};`,
	);
	const session = resolve(root, "session");
	const launched = runCli([
		"launch",
		"--concept",
		build,
		"--isolated-port",
		String(await isolatedPort()),
		"--idle-timeout-ms",
		"60000",
		"--out",
		session,
	]);
	assert.equal(launched.status, 0, launched.stderr + launched.stdout);
	heldSessions.push(session);
	const invoke = (command, out, extra = []) =>
		spawnSync(
			process.execPath,
			[
				"--require",
				preload,
				fileURLToPath(new URL("./cli.mjs", import.meta.url)),
				command,
				"--forensics",
				tools,
				"--out",
				out,
				...(command === "drive" ? ["--session", session] : []),
				...extra,
			],
			{ encoding: "utf8", windowsHide: true },
		);
	const driveArgs = [
		"--concept",
		build,
		"--page",
		"fixture.html",
		"--feature",
		"all",
		"--languages",
		"en",
		"--sizes",
		"desktop",
		"--motions",
		"reduce",
		"--transports",
		"file",
	];
	return { root, tools, invoke, driveArgs };
}
test("R21: CLI saves a held frame, records classification, and releases before the next item", async () => {
	const { root, invoke, driveArgs } = await heldCliFixture("held-cli");
	const out = resolve(root, "out");
	const result = invoke("drive", out, [...driveArgs, "--inputs", "mouse"]);
	assert.equal(result.status, 0, result.stderr + result.stdout);
	const manifest = JSON.parse(
		await readFile(resolve(out, "manifest.json"), "utf8"),
	);
	const item = manifest.items.find(
		(item) => item.feature === "fixture.html/held",
	);
	assert.equal(item.heldPress.classification, "stub classification");
	assert.equal(item.heldPress.selector, "#control");
	assert.equal(item.heldPress.active, true);
	assert.equal(item.heldPress.input, "mouse");
	assert.ok(Number.isFinite(item.heldPress.pressedAt));
	assert.ok(Number.isFinite(item.heldPress.capturedAt));
	assert.ok(Number.isFinite(item.heldPress.captureDelayMs));
	assert.ok(item.heldPress.captureDelayMs >= 0);

	const frame = item.files.find((file) => file.endsWith("-held.png"));
	assert.ok(frame, "no held frame saved");
	assert.equal(await readFile(resolve(out, frame), "utf8"), "held-frame");
	const events = (await readFile(resolve(out, "events.jsonl"), "utf8"))
		.trim()
		.split("\n")
		.map(JSON.parse);
	assert.ok(
		events.some((e) => e.type === "hold:#control"),
		"hold never reached the tool",
	);
	assert.ok(
		events.some((e) => e.type === "capture" && e.held),
		"capture never occurred while held",
	);
	const hold = events.findIndex((e) => e.type === "hold:#control");
	const next = events.findIndex((e, i) => i > hold && e.type === "item-start");
	assert.ok(next > hold, "no next item started");
	assert.equal(events[next].held, false, "next item started with a held press");
	assert.ok(
		events.slice(hold, next).some((e) => e.type === "release"),
		"cleanup never released the press",
	);
});
test("R22: bare release reaches the tool in a recipe before the next item", async () => {
	const { root, invoke, driveArgs } = await heldCliFixture(
		"bare-release",
		true,
	);
	const out = resolve(root, "out");
	const result = invoke("drive", out, [...driveArgs, "--inputs", "mouse"]);
	assert.equal(result.status, 0, result.stderr + result.stdout);
	const manifest = JSON.parse(
		await readFile(resolve(out, "manifest.json"), "utf8"),
	);
	const item = manifest.items.find(
		(item) => item.feature === "fixture.html/held",
	);
	assert.deepEqual(item.actions, ["hold:#control", "release"]);
	assert.equal(item.heldPress.classification, "stub classification");
	const events = (await readFile(resolve(out, "events.jsonl"), "utf8"))
		.trim()
		.split("\n")
		.map(JSON.parse);
	const hold = events.findIndex((e) => e.type === "hold:#control");
	const release = events.findIndex(
		(e, i) => i > hold && e.type === "release" && e.held,
	);
	const next = events.findIndex((e, i) => i > hold && e.type === "item-start");
	assert.ok(hold >= 0 && release > hold && release < next);
	assert.equal(events[next].held, false);
});
test("R22: drive requires 1.3.1 for hold and every release form before reaching tools", async () => {
	let reached = false;
	const ui = {
		TOOL_VERSION: "1.3.0",
		runAction: async () => {
			reached = true;
		},
	};
	for (const action of [
		"hold:#control",
		"release",
		"release:",
		"release:#control",
	]) {
		await assert.rejects(
			performAction(ui, {}, action, "mouse", "", "", {}),
			/Held presses require ui-forensics >=1\.3\.1; found 1\.3\.0/,
		);
	}
	assert.equal(reached, false);
});
test("R22: keyboard refuses bare release before reaching the tool", async () => {
	let reached = false;
	const ui = {
		TOOL_VERSION: "1.3.1",
		runAction: async () => {
			reached = true;
		},
	};
	await assert.rejects(
		performAction(ui, {}, "release", "keyboard", "", "", {}),
		/Keyboard input cannot hold a pointer press; release requires mouse or touch/,
	);
	assert.equal(reached, false);
});
test("R21: CLI keyboard input refuses a held press before reaching the tool", async () => {
	const { root, invoke, driveArgs } = await heldCliFixture("held-keyboard");
	const out = resolve(root, "out");
	const result = invoke("drive", out, [...driveArgs, "--inputs", "keyboard"]);
	assert.equal(result.status, 1, result.stdout);
	assert.match(
		result.stdout,
		/Keyboard input cannot hold a pointer press; hold:#control requires mouse or touch/,
	);
	const events = await readFile(resolve(out, "events.jsonl"), "utf8");
	assert.doesNotMatch(events, /hold:#control/);
	const manifest = JSON.parse(
		await readFile(resolve(out, "manifest.json"), "utf8"),
	);
	assert.equal(
		manifest.items.find((item) => item.feature === "fixture.html/held").status,
		"keyboard-unreachable",
	);
});

test("R21: CLI forwards hold actions to measurements and refuses tools older than 1.3.1", async () => {
	const { root, tools, invoke } = await heldCliFixture("held-measure");
	await writeFile(
		resolve(tools, "scripts/web/capture.mjs"),
		`import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
const args=process.argv.slice(2),out=args[args.indexOf("--out")+1];
await mkdir(out,{recursive:true});
await writeFile(resolve(out,"tool-invoked.json"),JSON.stringify(args));`,
	);
	const out = resolve(root, "current");
	const args = ["--tool", "capture", "--", "--action", "hold:#control"];
	const current = invoke("measure", out, args);
	assert.equal(current.status, 0, current.stderr + current.stdout);
	assert.ok(
		JSON.parse(
			await readFile(resolve(out, "tool-invoked.json"), "utf8"),
		).includes("hold:#control"),
	);
	await writeFile(
		resolve(tools, "scripts/web/_common.mjs"),
		'export const TOOL_VERSION="1.3.0";',
	);
	const oldOut = resolve(root, "old");
	const old = invoke("measure", oldOut, args);
	assert.equal(old.status, 1, old.stdout);
	assert.match(
		old.stderr,
		/Held presses require ui-forensics >=1\.3\.1; found 1\.3\.0/,
	);
	assert.equal(existsSync(resolve(oldOut, "tool-invoked.json")), false);
	assert.equal(existsSync(resolve(oldOut, "measure-manifest.json")), false);
});

test("R30 V1/V2: focus names the page or control and summaries distinguish absence from keyboard access", async () => {
	const { result, out } = await runnerFixture("keyboard-summary", [
		{
			id: "open",
			actions: ["activate:#opener"],
			proof: { selector: "#dialog", visible: true },
		},
		{
			id: "absent",
			actions: [],
			proof: { ready: true },
			unreachable: [
				{ when: {}, reason: "Absent by design", proof: { ready: true } },
			],
		},
		{
			id: "pointer-only",
			actions: ["activate:#pointer-only"],
			proof: { ready: true },
		},
	]);
	assert.equal(result.status, 1, result.stdout);
	assert.match(
		result.stdout,
		/DRIVE FAIL: 3 items; 1 state\/feature unavailable by recipe \(cannot be reached\); 1 pointer feature unreachable by keyboard \(fixture.html\/pointer-only default en desktop keyboard reduce file\); 0 problems/,
	);
	assert.match(
		result.stdout,
		/State\/feature cannot be reached: Absent by design/,
	);
	assert.match(result.stdout, /Pointer feature unreachable by keyboard/);
	assert.match(
		result.stdout,
		/Keyboard focus stopped on the page itself: body \(document\)/,
	);
	assert.doesNotMatch(result.stdout, /Whole page text|\(body\)/);
	assert.equal(result.stderr, "", result.stderr);
	const summary = JSON.parse(
		await readFile(resolve(out, "summary.json"), "utf8"),
	);
	assert.deepEqual(
		summary.map((item) => item.result),
		["pass", "not-reachable", "keyboard-unreachable"],
	);
});

test("R30 V1: focus uses the element's accessibility name or role without reading text content", async () => {
	const focus = { selector: "#control", tag: "input", role: null };
	const node = {
		role: { value: "textbox" },
		name: { value: "Name from associated label" },
	};
	const requests = [];
	let detached = 0;
	const page = {
		evaluate: async () => focus,
		context: () => ({
			newCDPSession: async () => ({
				send: async (method, options) => {
					requests.push([method, options]);
					return method === "Runtime.evaluate"
						? { result: { objectId: "focus" } }
						: method === "Accessibility.getPartialAXTree"
							? { nodes: [node] }
							: {};
				},
				detach: async () => {
					detached++;
				},
			}),
		}),
	};
	assert.equal((await focusedElement(page)).name, "Name from associated label");
	assert.deepEqual(requests[1], [
		"Accessibility.getPartialAXTree",
		{ objectId: "focus", fetchRelatives: false },
	]);
	assert.equal(detached, 1);
	assert.equal(requests.at(-1)[0], "Runtime.releaseObject");
	delete node.name;
	assert.equal((await focusedElement(page)).name, "");
	assert.equal((await focusedElement(page)).role, "textbox");
	focus.page = true;
	focus.tag = "body";
	const count = requests.length;
	assert.equal((await focusedElement(page)).role, "document");
	assert.equal((await focusedElement(page)).name, "");
	assert.equal(requests.length, count);
});

test("R30 repair V3: every comparison mode hides carets and paints fresh tiles without changing ordinary drive", async () => {
	const features = [
		{ id: "page", actions: [], proof: { selector: "main", visible: true } },
	];
	for (const comparisonCapture of [true, false]) {
		const { root, result } = await runnerFixture(
			`caret-${comparisonCapture}`,
			features,
			{
				comparisonCapture,
				motions: "full,reduce",
			},
		);
		assert.equal(result.status, 0, result.stderr + result.stdout);
		const launch = JSON.parse(
			await readFile(resolve(root, "launch.json"), "utf8"),
		);
		assert.deepEqual(
			launch,
			comparisonCapture ? { args: ["--disable-partial-raster"] } : null,
		);
		assert.equal(
			existsSync(resolve(root, "init.jsonl")),
			comparisonCapture,
			"ordinary drive must not install the comparison frame observer",
		);
		const captures = (await readFile(resolve(root, "captures.jsonl"), "utf8"))
			.trim()
			.split("\n")
			.map(JSON.parse);
		assert.equal(
			captures.length,
			4,
			"both before/after frames in both motion modes must use the capture policy",
		);
		for (const capture of captures) {
			assert.deepEqual(
				capture,
				comparisonCapture
					? {
							via: "native",
							options: { fullPage: false, animations: "allow", caret: "hide" },
						}
					: {
							via: "adapter",
							options: {
								method: "playwright",
								fullPage: false,
								animations: "allow",
							},
						},
			);
		}
	}
});

test("R30 V3: comparison waits for finite motion and fixes the phase of persistent motion", async () => {
	const { settleComparison } = await import("./runner.mjs");
	const finite = {
		playState: "running",
		effect: { getComputedTiming: () => ({ endTime: 200 }) },
		finish() {
			assert.fail("finite motion must finish naturally");
		},
	};
	const persistent = {
		playState: "running",
		currentTime: 187,
		effect: {
			getComputedTiming: () => ({ endTime: Number.POSITIVE_INFINITY }),
		},
		pause() {
			this.playState = "paused";
		},
	};
	const sandbox = {
		window: { __verifyFitwayFrames: { pending: 0 } },
		document: { getAnimations: () => [finite, persistent] },
	};
	const run = (fn) => runInNewContext(`(${fn.toString()})()`, sandbox);
	const page = {
		waitForFunction: async (predicate, arg, options) => {
			assert.equal(arg, undefined);
			assert.equal(options.timeout, 5000);
			assert.equal(
				run(predicate),
				false,
				"capture must wait while the popover is opening",
			);
			assert.equal(persistent.currentTime, 187);
			finite.playState = "finished";
			assert.equal(run(predicate), true);
		},
		evaluate: async (fn) => run(fn),
	};
	await settleComparison(page);
	assert.equal(persistent.playState, "paused");
	assert.equal(persistent.currentTime, 0);
	let captured = false;
	await assert.rejects(
		settleComparison({
			waitForFunction: async () => {
				throw new Error("finite movement never settled");
			},
			evaluate: async () => {
				captured = true;
			},
		}),
		/never settled/,
	);
	assert.equal(captured, false);
});

test("R30 repair 2 R5: finite requestAnimationFrame motion compares equal; endless script motion is a capture problem", async () => {
	const features = [
		{ id: "page", actions: [], proof: { selector: "main", visible: true } },
	];
	const frames = [];
	for (const phase of [1, 4]) {
		const { result, out } = await runnerFixture(
			`raf-finite-${phase}`,
			features,
			{
				comparisonCapture: true,
				motions: "full",
				scriptMotion: "finite",
				scriptPhase: phase,
			},
		);
		assert.equal(result.status, 0, result.stderr + result.stdout);
		const { items } = JSON.parse(
			await readFile(resolve(out, "manifest.json"), "utf8"),
		);
		frames.push(await readFile(resolve(out, items[0].files.at(-1))));
	}
	assert.deepEqual(
		frames[0],
		frames[1],
		"different initial RAF phases must capture the same final picture",
	);
	assert.deepEqual(
		JSON.parse(frames[0]),
		{ x: 20 },
		"the script must finish naturally before capture",
	);
	const { result, out } = await runnerFixture("raf-endless", features, {
		comparisonCapture: true,
		motions: "full",
		scriptMotion: "forever",
	});
	assert.equal(result.status, 1);
	const { items } = JSON.parse(
		await readFile(resolve(out, "manifest.json"), "utf8"),
	);
	assert.equal(items[0].status, "problem");
	assert.equal(
		items[0].files.length,
		0,
		"unsettled frames must never be saved or passed",
	);
	assert.match(
		items[0].problems.join(" "),
		/Comparison capture did not settle \(5000 ms bound\).*script motion still schedules frames/,
	);
	assert.match(result.stdout, /FRAME PROBLEM:/);
});

test("V5: successful feature proof survives in both summaries beside state proof", async () => {
	const proof = { selector: "#dialog", visible: true };
	const { result, out } = await runnerFixture("feature-proof", [
		{ id: "open", actions: ["activate:#opener"], proof },
	]);
	assert.equal(result.status, 0, result.stderr + result.stdout);
	const [summary] = JSON.parse(
		await readFile(resolve(out, "summary.json"), "utf8"),
	);
	assert.equal(summary.result, "pass");
	assert.deepEqual(summary.proof, ["Fixture state"]);
	assert.deepEqual(summary.featureProof, proof);
	const itemFile = (await readdir(out)).find((file) =>
		file.endsWith("-summary.json"),
	);
	assert.deepEqual(
		JSON.parse(await readFile(resolve(out, itemFile), "utf8")).featureProof,
		proof,
	);
	const { result: failed, out: failedOut } = await runnerFixture(
		"unproved-feature",
		[{ id: "closed", actions: ["focus:#opener"], proof }],
	);
	assert.equal(failed.status, 1);
	const [unproved] = JSON.parse(
		await readFile(resolve(failedOut, "summary.json"), "utf8"),
	);
	assert.equal(unproved.featureProof, undefined);
});

test("V6: Tab evidence names the move and focus destination; Space names activation", async () => {
	let focus = "body";
	const page = {
		evaluate: async () => ({ selector: focus }),
		locator: () => ({
			first() {
				return this;
			},
			count: async () => 1,
			evaluate: async () => focus === "#opener",
		}),
		keyboard: {
			down: async () => {},
			up: async () => {
				focus = "#field";
			},
			press: async (key) => {
				focus = key === "Tab" ? "#opener" : "#field";
			},
		},
	};
	const entry = {};
	await performAction(
		{},
		page,
		"activate:#opener",
		"keyboard",
		scratch,
		"labels",
		entry,
	);
	assert.deepEqual(
		entry.focusSteps.map((step) => step.action),
		["Tab move to #opener", "activate:#opener"],
	);
	assert.deepEqual(
		entry.focusSteps.map((step) => step.key),
		["Tab", "Space"],
	);
});

test("V1: afterActions state proofs run after the feature and must read the page", async () => {
	const features = [
		{
			id: "open",
			actions: ["activate:#opener"],
			proof: { selector: "#dialog", visible: true },
		},
	];
	const passing = await runnerFixture("after-actions-pass", features, {
		mapStates: [
			{
				when: { state: "after" },
				afterActions: true,
				shows: "Dialog after action",
				proof: { selector: "#dialog", visible: true },
			},
		],
		switches: [{ name: "state", values: ["after"], samples: [] }],
		states: "state=after",
	});
	assert.equal(
		passing.result.status,
		0,
		passing.result.stderr + passing.result.stdout,
	);
	const [summary] = JSON.parse(
		await readFile(resolve(passing.out, "summary.json"), "utf8"),
	);
	assert.deepEqual(summary.proof, ["Dialog after action"]);
	const refused = await runnerFixture("after-actions-refused", features, {
		mapStates: [
			{
				when: { state: "after" },
				afterActions: true,
				shows: "Not page reading",
				proof: { ready: true },
			},
		],
		switches: [{ name: "state", values: ["after"], samples: [] }],
		states: "state=after",
	});
	assert.equal(refused.result.status, 1);
	const refusedSummary = JSON.parse(
		await readFile(resolve(refused.out, "summary.json"), "utf8"),
	);
	assert.match(
		refusedSummary[0].problems.join(" "),
		/afterActions state proof must read the page with a selector or expression/,
	);
});

test("V1: ended rules lift only the matching language's before rule", async () => {
	const features = [
		{ id: "page", actions: [], proof: { selector: "main", visible: true } },
	];
	const { out, result } = await runnerFixture(
		"ended-language-rules",
		features,
		{
			inputs: "mouse",
			languages: "ar,en",
			mapStates: [
				{
					language: "ar",
					when: { state: "loading" },
					shows: "Arabic loading",
					proof: { selector: "main", visible: true },
				},
				{
					language: "en",
					when: { state: "loading" },
					shows: "English loading",
					proof: { selector: "main", visible: true },
				},
				{
					when: { arrive: "500" },
					afterActions: true,
					ends: [{ when: { state: "loading" } }],
					shows: "Arrived",
					proof: { expression: "document.body !== null" },
				},
			],
			switches: [
				{ name: "state", values: ["loading"], samples: [] },
				{ name: "arrive", values: ["500"], samples: [] },
			],
			states: "state=loading&arrive=500",
		},
	);
	assert.equal(result.status, 0, result.stderr + result.stdout);
	const summaries = JSON.parse(
		await readFile(resolve(out, "summary.json"), "utf8"),
	);
	assert.deepEqual(
		summaries.map((item) => ({
			afterFrameProof: item.afterFrameProof,
			language: item.language,
			proof: item.proof,
		})),
		[
			{
				afterFrameProof: [],
				language: "ar",
				proof: ["Arabic loading", "Arrived"],
			},
			{
				afterFrameProof: [],
				language: "en",
				proof: ["English loading", "Arrived"],
			},
		],
	);
});

test("V1: a time-changing state is captured before its declared after-action arrival", async () => {
	const features = [{ id: "page", actions: [], proof: { ready: true } }];
	const mapStates = [
		{
			when: { state: "loading" },
			shows: "Loading",
			proof: { expression: "window.__fixturePhase === 'loading'" },
		},
		{
			when: { arrive: "500" },
			afterActions: true,
			ends: [{ when: { state: "loading" } }],
			shows: "Arrived",
			proof: { expression: "window.__fixturePhase === 'ready'" },
		},
	];
	const options = {
		dynamicState: true,
		transitionAfterProofs: 2,
		mapStates,
		switches: [
			{ name: "state", values: ["loading"], samples: [] },
			{ name: "arrive", values: ["500"], samples: [] },
		],
		states: "state=loading&arrive=500",
	};
	const passing = await runnerFixture("time-changing-pass", features, options);
	assert.equal(
		passing.result.status,
		0,
		passing.result.stderr + passing.result.stdout,
	);
	const passingManifest = JSON.parse(
		await readFile(resolve(passing.out, "manifest.json"), "utf8"),
	);
	assert.equal(passingManifest.items[0].files.length, 2);
	assert.equal(
		await readFile(
			resolve(passing.out, passingManifest.items[0].files[0]),
			"utf8",
		),
		"loading",
	);
	assert.equal(
		await readFile(
			resolve(passing.out, passingManifest.items[0].files[1]),
			"utf8",
		),
		"ready",
	);
	const passingSummary = JSON.parse(
		await readFile(resolve(passing.out, "summary.json"), "utf8"),
	);
	assert.deepEqual(passingSummary[0].proof, ["Loading", "Arrived"]);

	const forced = await runnerFixture("time-changing-forced", features, {
		...options,
		transitionOnCapture: true,
	});
	assert.equal(forced.result.status, 1);
	const forcedSummary = JSON.parse(
		await readFile(resolve(forced.out, "summary.json"), "utf8"),
	);
	assert.match(
		forcedSummary[0].problems.join(" "),
		/loading state changed before capture/,
	);
});

test("V1: post-capture proofs hold every state an arrival does not end", async () => {
	const features = [{ id: "page", actions: [], proof: { ready: true } }];
	const switches = [
		{ name: "state", values: ["loading"], samples: [] },
		{ name: "arrive", values: ["500"], samples: [] },
	];
	const postBefore = await runnerFixture("post-before-proof", features, {
		dynamicState: true,
		capturePhases: ["ready"],
		mapStates: [
			{
				when: { state: "loading" },
				shows: "Loading",
				proof: { expression: "window.__fixturePhase === 'loading'" },
			},
			{
				when: { arrive: "500" },
				afterActions: true,
				shows: "Arrived",
				proof: { expression: "window.__fixturePhase === 'ready'" },
			},
		],
		switches,
		states: "state=loading&arrive=500",
	});
	assert.equal(
		postBefore.result.status,
		1,
		postBefore.result.stderr + postBefore.result.stdout,
	);
	const postBeforeSummary = JSON.parse(
		await readFile(resolve(postBefore.out, "summary.json"), "utf8"),
	);
	assert.match(
		postBeforeSummary[0].problems.join(" "),
		/loading state changed before capture/,
	);
	assert.ok(
		postBeforeSummary[0].files.some((file) => file.endsWith("-before.png")),
	);

	const preAfter = await runnerFixture("pre-after-proof", features, {
		dynamicState: true,
		transitionAfterProofs: 4,
		mapStates: [
			{
				when: { state: "loading" },
				shows: "Loading",
				proof: { expression: "window.__fixturePhase === 'loading'" },
			},
			{
				when: { arrive: "500" },
				shows: "Arrival companion",
				proof: { expression: "window.__fixturePhase === 'loading'" },
			},
			{
				when: { arrive: "500" },
				afterActions: true,
				ends: [{ when: { state: "loading" } }],
				shows: "Arrived",
				proof: { expression: "window.__fixturePhase === 'ready'" },
			},
		],
		switches,
		states: "state=loading&arrive=500",
	});
	assert.equal(
		preAfter.result.status,
		1,
		preAfter.result.stderr + preAfter.result.stdout,
	);
	const preAfterSummary = JSON.parse(
		await readFile(resolve(preAfter.out, "summary.json"), "utf8"),
	);
	assert.match(
		preAfterSummary[0].problems.join(" "),
		/loading state changed before capture/,
	);
	assert.equal(
		preAfterSummary[0].files.some((file) => file.endsWith("-after.png")),
		false,
	);

	const postAfter = await runnerFixture("post-after-proof", features, {
		dynamicState: true,
		capturePhases: [null, "ready"],
		mapStates: [
			{
				when: { state: "loading" },
				shows: "Loading",
				proof: { expression: "window.__fixturePhase === 'loading'" },
			},
			{
				when: { arrive: "500" },
				afterActions: true,
				shows: "Arrived",
				proof: { expression: "document.body !== null" },
			},
		],
		switches,
		states: "state=loading&arrive=500",
	});
	assert.equal(
		postAfter.result.status,
		1,
		postAfter.result.stderr + postAfter.result.stdout,
	);
	const postAfterSummary = JSON.parse(
		await readFile(resolve(postAfter.out, "summary.json"), "utf8"),
	);
	assert.match(
		postAfterSummary[0].problems.join(" "),
		/loading state changed before capture/,
	);
	assert.deepEqual(postAfterSummary[0].afterFrameProof, ["Loading"]);
	assert.ok(
		postAfterSummary[0].files.some((file) => file.endsWith("-after.png")),
	);

	const afterAction = await runnerFixture("after-action-proof", features, {
		dynamicState: true,
		transitionAfterProofs: 0,
		capturePhases: [null, "loading"],
		mapStates: [
			{
				when: { state: "loading" },
				shows: "Static",
				proof: { expression: "document.body !== null" },
			},
			{
				when: { arrive: "500" },
				afterActions: true,
				shows: "Arrived",
				proof: { expression: "window.__fixturePhase === 'ready'" },
			},
		],
		switches,
		states: "state=loading&arrive=500",
	});
	assert.equal(
		afterAction.result.status,
		1,
		afterAction.result.stderr + afterAction.result.stdout,
	);
	const afterActionSummary = JSON.parse(
		await readFile(resolve(afterAction.out, "summary.json"), "utf8"),
	);
	assert.match(
		afterActionSummary[0].problems.join(" "),
		/arrival state not observed/,
	);
	assert.deepEqual(afterActionSummary[0].afterFrameProof, ["Static"]);
});

test("V1: ended-rule declarations are exact and checked when recipes load", async () => {
	const root = resolve(scratch, "ends-validation");
	const recipePath = resolve(root, "verification-recipes.json");
	await mkdir(root, { recursive: true });
	const write = async (ends) => {
		await writeFile(
			recipePath,
			JSON.stringify({
				schema: 1,
				pages: {
					"fixture.html": {
						features: [],
						states: [
							{
								when: { state: "loading" },
								shows: "Loading",
								proof: { selector: "main", visible: true },
							},
							{
								when: { arrive: "500" },
								afterActions: true,
								ends,
								shows: "Arrived",
								proof: { expression: "document.body !== null" },
							},
						],
					},
				},
			}),
		);
	};
	for (const [ends, message] of [
		[[{ when: { state: "ready" } }], /matches no before rule/],
		[[{ when: {} }], /non-wildcard when/],
		[[{ shows: "Loading" }], /may only name when/],
	]) {
		await write(ends);
		assert.throws(() => readRecipes(root), message);
	}
	await writeFile(
		recipePath,
		JSON.stringify({
			schema: 1,
			pages: {
				"fixture.html": {
					features: [],
					states: [
						{
							when: { state: "loading" },
							shows: "Loading one",
							proof: { selector: "main", visible: true },
						},
						{
							when: { state: "loading" },
							shows: "Loading two",
							proof: { selector: "main", visible: true },
						},
						{
							when: { arrive: "500" },
							afterActions: true,
							ends: [{ when: { state: "loading" } }],
							shows: "Arrived",
							proof: { expression: "document.body !== null" },
						},
					],
				},
			},
		}),
	);
	assert.throws(() => readRecipes(root), /matches several before rules/);
	await writeFile(
		recipePath,
		JSON.stringify({
			schema: 1,
			pages: {
				"fixture.html": {
					features: [],
					states: [
						{
							when: { state: "loading", arrive: "500" },
							shows: "Loading",
							proof: { selector: "main", visible: true },
						},
						{
							when: { arrive: "500" },
							afterActions: true,
							ends: [{ when: { arrive: "500", state: "loading" } }],
							shows: "Arrived",
							proof: { expression: "document.body !== null" },
						},
					],
				},
			},
		}),
	);
	assert.doesNotThrow(() => readRecipes(root));
	await writeFile(
		recipePath,
		JSON.stringify({
			schema: 1,
			pages: {
				"fixture.html": {
					features: [],
					states: [
						{
							language: "ar",
							when: { state: "loading" },
							shows: "Loading in Arabic",
							proof: { selector: "main", visible: true },
						},
						{
							language: "en",
							when: { arrive: "500" },
							afterActions: true,
							ends: [{ when: { state: "loading" } }],
							shows: "Arrived in English",
							proof: { expression: "document.body !== null" },
						},
					],
				},
			},
		}),
	);
	assert.throws(() => readRecipes(root), /matches no before rule/);
	await writeFile(
		recipePath,
		JSON.stringify({
			schema: 1,
			pages: {
				"fixture.html": {
					features: [],
					states: [
						{
							language: "ar",
							when: { state: "loading" },
							shows: "Loading in Arabic",
							proof: { selector: "main", visible: true },
						},
						{
							when: { state: "loading" },
							shows: "Loading in every language",
							proof: { selector: "main", visible: true },
						},
						{
							language: "ar",
							when: { arrive: "500" },
							afterActions: true,
							ends: [{ when: { state: "loading" } }],
							shows: "Arrived in Arabic",
							proof: { expression: "document.body !== null" },
						},
					],
				},
			},
		}),
	);
	assert.throws(() => readRecipes(root), /matches several before rules/);
	await writeFile(
		recipePath,
		JSON.stringify({
			schema: 1,
			pages: {
				"fixture.html": {
					features: [],
					states: [
						{
							language: "ar",
							when: { state: "loading" },
							shows: "Loading in Arabic",
							proof: { selector: "main", visible: true },
						},
						{
							language: "en",
							when: { state: "loading" },
							shows: "Loading in English",
							proof: { selector: "main", visible: true },
						},
						{
							when: { arrive: "500" },
							afterActions: true,
							ends: [{ when: { state: "loading" } }],
							shows: "Arrived",
							proof: { expression: "document.body !== null" },
						},
					],
				},
			},
		}),
	);
	assert.doesNotThrow(() => readRecipes(root));
});

test("V1: a feature's ended-rule declarations are exact for every item", async () => {
	const root = resolve(scratch, "feature-ends-validation");
	const recipePath = resolve(root, "verification-recipes.json");
	await mkdir(root, { recursive: true });
	const states = [
		{
			when: { state: "loading" },
			shows: "Loading",
			proof: { selector: "main", visible: true },
		},
	];
	const feature = (overrides = {}) => ({
		id: "close",
		actions: ["activate:#close"],
		proof: { selector: "#closed", hidden: true },
		ends: [{ when: { state: "loading" } }],
		...overrides,
	});
	const write = async (value, pageStates = states) => {
		await writeFile(
			recipePath,
			JSON.stringify({
				schema: 1,
				pages: { "fixture.html": { features: [value], states: pageStates } },
			}),
		);
	};

	await write(feature());
	assert.doesNotThrow(() => readRecipes(root));

	for (const [value, message] of [
		[feature({ changesState: true }), /both changesState and ends/],
		[
			feature({ ends: { when: { state: "loading" } } }),
			/ends must be an array/,
		],
		[feature({ ends: [{ when: {} }] }), /non-wildcard when/],
		[feature({ ends: [{ shows: "Loading" }] }), /may only name when/],
		[
			feature({ ends: [{ when: { state: "ready" } }] }),
			/matches no before rule/,
		],
		[
			feature({
				items: [
					{ actions: ["activate:#one"], input: "mouse" },
					{ actions: ["activate:#two"], input: "mouse" },
				],
			}),
			/actions and inputs/,
		],
		[
			feature({
				items: [
					{ actions: ["activate:#one"], input: "mouse" },
					{ actions: ["activate:#one"], input: "touch" },
				],
			}),
			/actions and inputs/,
		],
		[
			feature({ keyboardActions: ["activate:#different"] }),
			/actions and inputs/,
		],
	]) {
		await write(value);
		assert.throws(() => readRecipes(root), message);
	}

	await write(feature(), [
		...states,
		{
			when: { state: "loading" },
			shows: "Loading again",
			proof: { selector: "main", visible: true },
		},
	]);
	assert.throws(() => readRecipes(root), /matches several before rules/);
});

test("V1: a feature ends only the before rules it declares", async () => {
	const features = [
		{
			id: "page",
			actions: [],
			proof: { ready: true },
			ends: [{ when: { state: "loading" } }],
		},
	];
	const switches = [
		{ name: "state", values: ["loading"], samples: [] },
		{ name: "flag", values: ["1"], samples: [] },
	];
	const mapStates = [
		{
			when: { state: "loading" },
			shows: "Ended",
			proof: { expression: "window.__fixturePhase === 'loading'" },
		},
		{
			when: { flag: "1" },
			shows: "Survivor",
			proof: { expression: "document.body !== null" },
		},
	];
	const passing = await runnerFixture("feature-ends-pass", features, {
		dynamicState: true,
		capturePhases: [null, "ready"],
		mapStates,
		switches,
		states: "state=loading&flag=1",
	});
	assert.equal(
		passing.result.status,
		0,
		passing.result.stderr + passing.result.stdout,
	);
	const passingSummary = JSON.parse(
		await readFile(resolve(passing.out, "summary.json"), "utf8"),
	);
	assert.deepEqual(passingSummary[0].proof, ["Ended", "Survivor"]);
	assert.deepEqual(passingSummary[0].afterFrameProof, ["Survivor"]);

	const failing = await runnerFixture(
		"feature-ends-failing-survivor",
		features,
		{
			dynamicState: true,
			capturePhases: [null, "ready"],
			mapStates: mapStates.map((rule) =>
				rule.shows === "Survivor"
					? {
							...rule,
							proof: { expression: "window.__fixturePhase === 'loading'" },
						}
					: rule,
			),
			switches,
			states: "state=loading&flag=1",
		},
	);
	assert.equal(
		failing.result.status,
		1,
		failing.result.stderr + failing.result.stdout,
	);
	const failingSummary = JSON.parse(
		await readFile(resolve(failing.out, "summary.json"), "utf8"),
	);
	assert.deepEqual(failingSummary[0].afterFrameProof, ["Survivor"]);
	assert.match(failingSummary[0].problems.join(" "), /after-frame:post/);
	assert.match(failingSummary[0].problems.join(" "), /Survivor/);
});

test("V1: failed state proofs name their rule and moment", async () => {
	const states = (proof) => [
		{
			when: { state: "loading" },
			shows: "Ended control",
			proof: { expression: "document.body !== null" },
		},
		{
			when: { flag: "1" },
			shows: "Moment rule",
			proof,
		},
	];
	const switches = [
		{ name: "state", values: ["loading"], samples: [] },
		{ name: "flag", values: ["1"], samples: [] },
	];
	const feature = {
		id: "page",
		actions: [],
		proof: { ready: true },
		ends: [{ when: { state: "loading" } }],
	};
	const moments = [
		{
			moment: "before-frame:pre",
			proof: { expression: "window.__fixturePhase === 'ready'" },
			options: {},
		},
		{
			moment: "before-frame:post",
			proof: { expression: "window.__fixturePhase === 'loading'" },
			options: { transitionOnCapture: true },
		},
		{
			moment: "after-frame:pre",
			proof: { expression: "window.__fixturePhase === 'loading'" },
			options: { transitionAfterProofs: 2 },
		},
		{
			moment: "after-frame:post",
			proof: { expression: "window.__fixturePhase === 'loading'" },
			options: { capturePhases: [null, "ready"] },
		},
	];
	const allMoments = moments.map(({ moment }) => moment);
	for (const { moment, proof, options } of moments) {
		const { out, result } = await runnerFixture(
			`state-proof-${moment.replace(":", "-")}`,
			[feature],
			{
				dynamicState: true,
				mapStates: states(proof),
				switches,
				states: "state=loading&flag=1",
				...options,
			},
		);
		assert.equal(result.status, 1, result.stderr + result.stdout);
		const [summary] = JSON.parse(
			await readFile(resolve(out, "summary.json"), "utf8"),
		);
		const message = summary.problems.join(" ");
		assert.match(message, new RegExp(moment));
		for (const other of allMoments.filter((candidate) => candidate !== moment))
			assert.doesNotMatch(message, new RegExp(other));
		assert.match(message, /Moment rule/);
		assert.match(message, /\[\["flag","1"\]\]/);
		assert.match(message, /language none/);
		assert.match(message, /before rule/);
	}
});

test("V1: equal state-proof shows labels keep distinct rules readable", async () => {
	const run = async (name, when, query) => {
		const { out, result } = await runnerFixture(
			name,
			[
				{
					id: "page",
					actions: [],
					proof: { ready: true },
					ends: [{ when: { state: "loading" } }],
				},
			],
			{
				dynamicState: true,
				mapStates: [
					{
						when: { state: "loading" },
						shows: "Ended control",
						proof: { expression: "document.body !== null" },
					},
					{
						when,
						shows: "Same label",
						proof: { expression: "window.__fixturePhase === 'ready'" },
					},
				],
				switches: [
					{ name: "state", values: ["loading"], samples: [] },
					{ name: query.key, values: [query.value], samples: [] },
				],
				states: `state=loading&${query.key}=${query.value}`,
			},
		);
		assert.equal(result.status, 1, result.stderr + result.stdout);
		const [summary] = JSON.parse(
			await readFile(resolve(out, "summary.json"), "utf8"),
		);
		return summary.problems.join(" ");
	};

	const first = await run(
		"state-proof-shared-shows-a",
		{ flag: "1" },
		{ key: "flag", value: "1" },
	);
	const second = await run(
		"state-proof-shared-shows-b",
		{ other: "2" },
		{ key: "other", value: "2" },
	);
	assert.match(first, /Same label/);
	assert.match(second, /Same label/);
	assert.notEqual(first, second);
});

test("V2: an address-only feature is captured under keyboard", async () => {
	const { result } = await runnerFixture(
		"address-only-keyboard",
		[
			{
				id: "address-only",
				actions: [],
				proof: { selector: "main", visible: true },
			},
		],
		{ inputs: "keyboard" },
	);
	assert.equal(result.status, 0, result.stderr + result.stdout);
});

test("V3: recipe dependencies merge with source dependencies and conflicts are refused", async () => {
	const root = resolve(scratch, "dependency-map");
	await mkdir(root);
	await writeFile(
		resolve(root, "fixture.html"),
		'<main>Fixture</main><script src="app.js"></script>',
	);
	await writeFile(
		resolve(root, "app.js"),
		`const params=new URLSearchParams(location.search);
const arrive=params.get("arrive");
const from=params.get("from");
const to=params.get("to");
const state=params.get("state");
if(params.get("state")==="loading" && params.get("arrive")==="500"){}
window.__fixture={ready:true};`,
	);
	const recipePath = resolve(root, "verification-recipes.json");
	const recipes = {
		schema: 1,
		pages: {
			"fixture.html": {
				features: [],
				states: [],
				samples: {
					arrive: ["500"],
					from: ["2026-09-01"],
					to: ["2026-09-10"],
				},
				dependencies: [
					{
						switch: "arrive",
						value: "500",
						requires: [{ name: "state", value: "loading" }],
					},
					{
						switch: "from",
						value: "2026-09-01",
						requires: [{ name: "to", value: "2026-09-10" }],
					},
					{
						switch: "to",
						value: "2026-09-10",
						requires: [{ name: "from", value: "2026-09-01" }],
					},
				],
			},
		},
	};
	await writeFile(recipePath, JSON.stringify(recipes));
	const page = generateMap(root, recipePath).pages[0];
	const cases = stateCases(page, { states: "all" });
	const arrive = cases.find((entry) => entry.query.arrive === "500");
	assert.equal(arrive.query.state, "loading");
	const from = cases.find((entry) => entry.query.from === "2026-09-01");
	assert.equal(from.query.to, "2026-09-10");
	const to = cases.find((entry) => entry.query.to === "2026-09-10");
	assert.equal(to.query.from, "2026-09-01");
	const conflictPath = resolve(scratch, "dependency-conflict.json");
	await writeFile(
		conflictPath,
		JSON.stringify({
			...recipes,
			pages: {
				"fixture.html": {
					...recipes.pages["fixture.html"],
					dependencies: [
						{
							switch: "arrive",
							value: "500",
							requires: [{ name: "state", value: "error" }],
						},
					],
				},
			},
		}),
	);
	assert.throws(
		() => generateMap(root, conflictPath),
		/declared dependency conflicts with source/,
	);
});

function interactiveKeyboardPage(kind) {
	let focus = "body";
	const events = [];
	const page = {
		evaluate: async (fn) =>
			fn.toString().includes("document.activeElement")
				? { selector: focus, tag: focus === "body" ? "body" : "button" }
				: {},
		locator: () => ({
			first() {
				return this;
			},
			count: async () => 1,
			evaluate: async (fn) =>
				fn.toString().includes("localName")
					? {
							key: kind === "button" ? "Space" : "Enter",
							navigation: kind !== "button",
						}
					: focus === "#control",
			waitFor: async () => {},
		}),
		keyboard: {
			down: async (key) => events.push(`down:${key}`),
			up: async (key) => events.push(`up:${key}`),
			press: async (key) => {
				events.push(`press:${key}`);
				if (key === "Tab") focus = "#control";
			},
		},
		context: () => ({
			newCDPSession: async () => ({
				send: async (method) =>
					method === "Runtime.evaluate"
						? { result: { objectId: "focus" } }
						: method === "Accessibility.getPartialAXTree"
							? {
									nodes: [
										{ role: { value: "button" }, name: { value: "Open" } },
									],
								}
							: {},
				detach: async () => {},
			}),
		}),
	};
	return { page, events };
}

test("V4: keyboard activation uses Space for buttons and Enter for links", async () => {
	const link = interactiveKeyboardPage("link");
	await performAction(
		{},
		link.page,
		"activate:#control",
		"keyboard",
		scratch,
		"link",
		{},
	);
	assert.deepEqual(link.events, ["press:Tab", "down:Enter", "up:Enter"]);
	const button = interactiveKeyboardPage("button");
	await performAction(
		{},
		button.page,
		"activate:#control",
		"keyboard",
		scratch,
		"button",
		{},
	);
	assert.deepEqual(button.events, ["press:Tab", "down:Space", "up:Space"]);
});

test("V7: navigation settles before the action returns and a wrong destination fails", async () => {
	const button = interactiveKeyboardPage("link");
	let settle;
	let settled = false;
	button.page.waitForNavigation = () =>
		new Promise((done) => {
			settle = done;
		}).then(() => {
			settled = true;
		});
	const originalUp = button.page.keyboard.up;
	button.page.keyboard.up = async (key) => {
		await originalUp(key);
		settle?.();
	};
	await performAction(
		{},
		button.page,
		"activate:#control",
		"keyboard",
		scratch,
		"navigation",
		{},
	);
	assert.equal(settled, true);
	const proofPage = {
		waitForURL: async () => {
			throw new Error("wrong destination");
		},
		locator: () => ({ first: () => ({ waitFor: async () => {} }) }),
	};
	const error = await assert.rejects(
		proveFeature(
			proofPage,
			{ path: "activity.html", selector: ".rec", visible: true },
			"en",
			"keyboard",
		),
		/wrong destination/,
	);
	assert.equal(error instanceof KeyboardReachError, false);

	const pressed = interactiveKeyboardPage("button");
	let settlePress;
	let pressSettled = false;
	let focusReads = 0;
	pressed.page.waitForNavigation = () =>
		new Promise((done) => {
			settlePress = done;
		}).then(() => {
			pressSettled = true;
		});
	pressed.page.keyboard.press = () => {
		setTimeout(() => settlePress(), 20);
	};
	const originalEvaluate = pressed.page.evaluate;
	pressed.page.evaluate = async (fn) => {
		if (fn.toString().includes("document.activeElement")) {
			focusReads++;
			if (focusReads === 2 && !pressSettled)
				throw new Error("focus read before navigation settled");
		}
		return originalEvaluate(fn);
	};
	await performAction(
		{},
		pressed.page,
		"press:Space",
		"keyboard",
		scratch,
		"pressed-navigation",
		{},
	);
	assert.equal(pressSettled, true);
	assert.equal(focusReads, 2);
});

function usageCliOptions(helpText) {
	const options = new Set();
	const lines = helpText.split(/\r?\n/);
	const start = lines.findIndex((line) => line.trim() === "Commands:");
	for (let index = start + 1; index < lines.length; index++) {
		const line = lines[index];
		if (!/^\s{2,}\S/.test(line)) break;
		for (const match of line.matchAll(/--[a-z][a-z0-9-]*/g))
			options.add(match[0]);
	}
	return options;
}

function shellSegments(command) {
	const segments = [];
	let current = [];
	let tokenStart = null;
	let quote = null;
	const pushToken = (end) => {
		if (tokenStart === null) return;
		if (end > tokenStart)
			current.push({
				text: command.slice(tokenStart, end),
				index: tokenStart,
			});
		tokenStart = null;
	};
	for (let index = 0; index < command.length; index++) {
		const character = command[index];
		if (quote) {
			if (character === quote) quote = null;
			continue;
		}
		if (character === "'" || character === '"') {
			if (tokenStart === null) tokenStart = index;
			quote = character;
			continue;
		}
		if (/\s/.test(character)) {
			pushToken(index);
			continue;
		}
		const separator =
			character === ";"
				? ";"
				: character === "&" || character === "|"
					? command.startsWith(`${character}${character}`, index)
						? `${character}${character}`
						: character
					: null;
		if (!separator) {
			if (tokenStart === null) tokenStart = index;
			continue;
		}
		pushToken(index);
		current.push({ text: separator, index, separator: true });
		segments.push(current);
		current = [];
		index += separator.length - 1;
	}
	pushToken(command.length);
	if (current.length) segments.push(current);
	return segments;
}

function measureExemptRanges(skillText) {
	const ranges = [];
	const record = (command, offset) => {
		for (const tokens of shellSegments(command)) {
			const commandIndex =
				tokens[0]?.text === "measure"
					? 0
					: tokens[0]?.text === "node" &&
							tokens[1]?.text === "$cli" &&
							tokens[2]?.text === "measure"
						? 2
						: -1;
			if (commandIndex < 0) continue;
			const separator = tokens.findIndex(
				(token, index) => index > commandIndex && token.text === "--",
			);
			if (separator < 0) continue;
			for (let index = separator + 1; index < tokens.length; index++) {
				const option = /^--[a-z][a-z0-9-]*/.exec(tokens[index].text);
				if (option)
					ranges.push({
						start: offset + tokens[index].index,
						end: offset + tokens[index].index + option[0].length,
					});
			}
		}
	};
	for (const match of skillText.matchAll(/`([^`\n]+)`/g))
		record(match[1], match.index + 1);
	for (const fence of skillText.matchAll(/```[^\n]*\n([\s\S]*?)```/g)) {
		const body = fence[1];
		const bodyStart = fence.index + fence[0].indexOf(body);
		for (const line of body.matchAll(/[^\r\n]+/g))
			record(line[0], bodyStart + line.index);
	}
	return ranges;
}

function assertGuideOptions(skillText, helpText) {
	const cliOptions = usageCliOptions(helpText);
	for (const option of cliOptions)
		assert.ok(skillText.includes(option), `${option} is missing from SKILL.md`);
	const exempt = measureExemptRanges(skillText);
	for (const match of skillText.matchAll(/--[a-z][a-z0-9-]*/g))
		if (
			!exempt.some(
				(range) => match.index >= range.start && match.index < range.end,
			)
		)
			assert.ok(cliOptions.has(match[0]), `${match[0]} is not a CLI option`);
}

const measureSeparatorRejectCases = [
	[
		"semicolon attached to the preceding token",
		"`measure --tool focus -- --allowed;node $cli drive --invented-semicolon`",
	],
	[
		"semicolon at the start of the next token",
		"`measure --tool focus -- --allowed ;node $cli drive --invented-leading-semicolon`",
	],
	[
		"semicolon separated from both commands",
		"`measure --tool focus -- --max-stops 40; node $cli drive --invented-attached-semicolon`",
	],
	[
		"single ampersand",
		"`measure --tool focus -- --allowed & node $cli drive --invented-ampersand`",
	],
	[
		"double ampersand attached to the preceding token",
		"`measure --tool focus -- --max-stops 40&&node $cli drive --invented-and`",
	],
	[
		"double pipe attached to the preceding token",
		"`measure --tool focus -- --max-stops 40||node $cli drive --invented-or`",
	],
	[
		"pipe inside a token",
		"`measure --tool focus -- --max-stops a|b --invented-pipe`",
	],
	[
		"fenced semicolon",
		"```powershell\nmeasure --tool focus -- --allowed;node $cli drive --invented-fenced-semicolon\n```",
	],
];

const measureSeparatorAcceptCases = [
	[
		"single-quoted pipe",
		"`measure --tool focus -- --pattern 'a|b' --invented-single-quoted`",
	],
	[
		"double-quoted pipe",
		'`measure --tool focus -- --pattern "a|b" --invented-double-quoted`',
	],
];

test("V5: SKILL names CLI options, ports and rendered artifacts without drift", async () => {
	const skill = await readFile(
		fileURLToPath(new URL("./SKILL.md", import.meta.url)),
		"utf8",
	);
	assertGuideOptions(skill, help);
	const plant = (text) => `${skill}\n${text}\n`;
	for (const text of [
		"`--invented-prose`",
		"```\n--invented-fence\n```",
		"`pnpm --invented-pnpm`",
		"measure --tool focus -- --invented-plain",
		"`measure --invented-before -- --allowed`",
		"`compare --concept x -- --invented-other`",
		"`measure --tool focus -- --allowed && other --invented-other`",
		...measureSeparatorRejectCases.map(([, text]) => text),
	])
		assert.throws(
			() => assertGuideOptions(plant(text), help),
			/--invented-/,
			text,
		);
	for (const text of [
		"`measure --tool focus --out <folder> -- --invented-tool`",
		"`node $cli measure --tool focus --out <folder> -- --invented-tool-prefix`",
		"```powershell\nmeasure --tool focus --out <folder> -- --invented-tool-fence\n```",
		...measureSeparatorAcceptCases.map(([, text]) => text),
	])
		assert.doesNotThrow(() => assertGuideOptions(plant(text), help), text);
	for (const pair of skill.match(/\b31\d\d-31\d\d\b/g) || [])
		if (pair !== "3178-3185")
			assert.ok(
				verificationPairs.some(([a, b]) => pair === `${a}-${b}`),
				`${pair} is not a verification pair`,
			);
	assert.match(skill, /does not render language sheets/);
	assert.doesNotMatch(skill, /language sheets remain after cleanup/);
	assert.match(
		await readFile(
			fileURLToPath(new URL("./runner.mjs", import.meta.url)),
			"utf8",
		),
		/comparisonCapture[\s\S]*break/,
	);
});

test("Y1: every unquoted separator ends a measure tool-argument exemption", async () => {
	const skill = await readFile(
		fileURLToPath(new URL("./SKILL.md", import.meta.url)),
		"utf8",
	);
	const plant = (text) => `${skill}\n${text}\n`;
	const leaked = [];
	for (const [label, text] of measureSeparatorRejectCases) {
		try {
			assertGuideOptions(plant(text), help);
			leaked.push(label);
		} catch (error) {
			assert.match(error.message, /--invented-/, label);
		}
	}
	assert.deepEqual(
		leaked,
		[],
		`Unquoted separators left the next option exempt: ${leaked.join(", ")}`,
	);
	for (const [label, text] of measureSeparatorAcceptCases)
		assert.doesNotThrow(() => assertGuideOptions(plant(text), help), label);
});

test("V6: a released lease removes its empty port folder", async () => {
	const port = await isolatedPort();
	const folder = resolve("D:/fitway-verify-captures", `.port-${port}-lease`);
	const lease = await reserveVerificationPorts([port]);
	assert.equal(existsSync(folder), true);
	await lease.release();
	assert.equal(existsSync(folder), false);
});

async function isolatedPort() {
	const server = createServer();
	await new Promise((done) => server.listen(0, "127.0.0.1", done));
	const port = server.address().port;
	await new Promise((done) => server.close(done));
	assert.ok(port >= 49152, `Kernel allocated unsafe test port ${port}`);
	return port;
}

async function launched(name, idle = 1500) {
	const folder = resolve(scratch, name);
	const result = runCli([
		"launch",
		"--concept",
		concept,
		"--isolated-port",
		String(await isolatedPort()),
		"--idle-timeout-ms",
		String(idle),
		"--out",
		folder,
	]);
	assert.equal(result.status, 0, result.stderr + result.stdout);
	const session = JSON.parse(
		await readFile(resolve(folder, "session.json"), "utf8"),
	);
	return { folder, session };
}

async function waitForExit(session) {
	const deadline = Date.now() + 5000;
	while (true) {
		try {
			process.kill(session.pid, 0);
		} catch (error) {
			if (error.code === "ESRCH") break;
			throw error;
		}
		assert.ok(
			Date.now() < deadline,
			`Preview pid ${session.pid} did not exit after idle timeout`,
		);
		await new Promise((done) => setTimeout(done, 50));
	}
	await portAvailable(session.port);
}

test("W1: port options keep other previews excluded, and help names isolation and idle bounds", () => {
	for (const command of ["launch", "doctor", "drive", "compare"]) {
		for (const port of [
			0,
			3174,
			3175,
			...Array.from({ length: 8 }, (_, i) => 3178 + i),
			49152,
		]) {
			const result = runCli([
				command,
				"--concept",
				concept,
				...(command === "compare" ? ["--baseline", concept] : []),
				"--port",
				String(port),
			]);
			assert.equal(result.status, 1);
			assert.match(result.stderr, /choose 3176 or 3177/);
		}
	}
	for (const port of [0, 3174, 3176, 3177, 3185, 49151, 65536]) {
		const result = runCli([
			"launch",
			"--concept",
			concept,
			"--isolated-port",
			String(port),
		]);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /49152-65535/);
	}
	const both = runCli([
		"launch",
		"--concept",
		concept,
		"--port",
		"3180",
		"--isolated-port",
		"49152",
	]);
	assert.match(both.stderr, /choose 3176 or 3177/);
	for (const idle of ["0", "-1", "1800001", "NaN"]) {
		const result = runCli([
			"launch",
			"--concept",
			concept,
			"--idle-timeout-ms",
			idle,
		]);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /at most 30 minutes/);
	}
	const help = runCli(["help"]);
	assert.match(help.stdout, /--isolated-port.*49152-65535/);
	assert.match(help.stdout, /30 minutes without a request/);
});

test("R17 V1: relaunch checks availability, prefers the session port and blocks when both are held", async () => {
	const folder = resolve(scratch, "relaunch-session");
	await mkdir(folder);
	for (const sessionPort of [3176, 3177]) {
		await writeFile(
			resolve(folder, "session.json"),
			JSON.stringify({ port: sessionPort }),
		);
		for (const held of [[], [3176], [3177], [3176, 3177]]) {
			const checked = [];
			const available = async (port) => {
				checked.push(port);
				if (held.includes(port)) throw new Error(`Port ${port} held`);
			};
			const fix = await doctorFix(
				{ concept, session: folder },
				new Error(`Session preview on port ${sessionPort} has stopped`),
				available,
			);
			const expected = [sessionPort, sessionPort === 3176 ? 3177 : 3176].find(
				(port) => !held.includes(port),
			);
			if (expected) {
				assert.match(fix, new RegExp(` launch .*--port ${expected} `));
				assert.equal(checked.at(-1), expected);
			} else {
				assert.match(fix, /^BLOCKED:.*3176.*3177.*held/);
				assert.doesNotMatch(fix, /--port|\bstop\b/i);
			}
			assert.equal(checked[0], sessionPort);
		}
	}
	const checked = [];
	const fix = await doctorFix(
		{ concept, port: 3177 },
		new Error("Port 3177 held"),
		async (port) => {
			checked.push(port);
			if (port === 3177) throw new Error("held");
		},
	);
	assert.deepEqual(checked, [3177, 3176]);
	assert.match(fix, /--port 3176 /);
});

function runCliAsync(args) {
	return new Promise((done, reject) => {
		const child = spawn(process.execPath, [cliPath, ...args], {
			windowsHide: true,
			stdio: ["ignore", "pipe", "pipe"],
			env: {
				...process.env,
				VERIFY_FITWAY_TEST_DOCTOR_PORT_PROBE: "0",
			},
		});
		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (bytes) => {
			stdout += bytes;
		});
		child.stderr.on("data", (bytes) => {
			stderr += bytes;
		});
		child.once("error", reject);
		child.once("close", (status) => done({ status, stdout, stderr }));
	});
}

test("R17 V2: foreign status, body and silence name the session port without stopping its owner", async () => {
	const { folder, session } = await launched("foreign-session", 10000);
	assert.equal(runCli(["cleanup", "--session", folder]).status, 0);
	let mode;
	let stops = 0;
	const server = createServer((req, res) => {
		if (req.url === "/__verify/stop") stops++;
		if (req.url !== "/__verify/identity") return res.end("foreign alive");
		if (mode === "silent") return;
		if (mode === "body-timeout") {
			res.writeHead(200);
			res.flushHeaders();
			return;
		}
		if (mode === "disconnect") return req.socket.destroy();
		res.writeHead(
			mode === "status"
				? 503
				: mode === "empty"
					? 204
					: mode === "redirect"
						? 302
						: 200,
			mode === "redirect" ? { Location: "/" } : {},
		);
		res.end(
			mode === "json" ? "{}" : mode === "null" ? "null" : "foreign 127.0.0.1",
		);
	});
	await new Promise((done) => server.listen(session.port, "127.0.0.1", done));
	try {
		for (mode of [
			"text",
			"json",
			"null",
			"status",
			"empty",
			"redirect",
			"silent",
			"body-timeout",
			"disconnect",
		]) {
			for (const command of ["cleanup", "doctor", "drive"]) {
				const result = await runCliAsync(
					sessionCommandArgs(
						command,
						folder,
						resolve(scratch, `foreign-${mode}-${command}`),
					),
				);
				assert.equal(result.status, 1, `${mode}/${command}: ${result.stdout}`);
				assert.match(
					result.stderr,
					new RegExp(`Port ${session.port} is not owned by this session`),
					`${mode}/${command}: ${result.stderr}`,
				);
				assert.doesNotMatch(
					result.stderr,
					/Unexpected token|JSON|SyntaxError|Cannot read properties/,
				);
				assert.equal(
					(await fetchRaw(session.port, "/")).body.toString(),
					"foreign alive",
				);
			}
		}
		assert.equal(stops, 0);
	} finally {
		server.closeAllConnections();
		await new Promise((done) => server.close(done));
	}
	await portAvailable(session.port);
});

test("R19 V1: a verified preview sharing its port names every foreign pid and refuses all session commands", {
	skip:
		process.platform !== "win32" &&
		"Shared-port ownership proof requires Windows listener inspection",
}, async (t) => {
	const { folder, session } = await launched("shared-session", 60000);
	const record = await readFile(resolve(folder, "session.json"), "utf8");
	const server = createServer((_, res) => res.end("foreign IPv4"));
	const foreign = spawn(
		process.execPath,
		[
			"-e",
			`
		const server = require("node:http").createServer((_, res) => res.end("foreign IPv6"));
		server.listen(${session.port}, "::1", () => process.send("ready"));
	`,
		],
		{ windowsHide: true, stdio: ["ignore", "ignore", "ignore", "ipc"] },
	);
	const exited = new Promise((done) => foreign.once("exit", done));
	try {
		await new Promise((done, reject) => {
			foreign.once("message", done);
			foreign.once("error", reject);
			foreign.once("exit", (code) =>
				reject(new Error(`Foreign fixture exited ${code} before ready`)),
			);
		});
		await new Promise((done, reject) => {
			server.once("error", reject);
			server.listen(session.port, "127.0.0.2", done);
		});
		for (const command of ["doctor", "cleanup", "drive"]) {
			const result = await runCliAsync(
				sessionCommandArgs(
					command,
					folder,
					resolve(scratch, `shared-${command}`),
				),
			);
			assert.equal(result.status, 1, result.stdout);
			assert.match(
				result.stderr,
				new RegExp(`Port ${session.port} .*foreign pids?`),
			);
			for (const pid of [process.pid, foreign.pid])
				assert.match(result.stderr, new RegExp(`\\b${pid}\\b`));
			assert.match(result.stderr, /refuse session/);
			assert.doesNotMatch(result.stderr, /not owned|not served|\bstop\b/i);
			assert.equal((await fetchRaw(session.port, "/index.html")).status, 200);
			for (const [host, body] of [
				["[::1]", "foreign IPv6"],
				["127.0.0.2", "foreign IPv4"],
			])
				assert.equal(
					await (await fetch(`http://${host}:${session.port}/`)).text(),
					body,
				);
			assert.equal(
				await readFile(resolve(folder, "session.json"), "utf8"),
				record,
			);
			t.diagnostic(
				`${command}: ${result.stderr.split("\n")[0]}; preview and both foreign listeners still answer`,
			);
		}
	} finally {
		server.closeAllConnections();
		if (server.listening) await new Promise((done) => server.close(done));
		if (foreign.exitCode === null) foreign.kill();
		await exited;
		const cleaned = runCli(["cleanup", "--session", folder]);
		assert.equal(cleaned.status, 0, cleaned.stderr);
		t.diagnostic(cleaned.stdout.trim());
	}
	await portAvailable(session.port);
});

test("W2: detached idle preview exits, frees its port, cleans idempotently and sessions require relaunch", async () => {
	const { folder, session } = await launched("idle-expiry");
	try {
		await waitForExit(session);
		for (const command of ["doctor", "drive"]) {
			const result = runCli(
				sessionCommandArgs(
					command,
					folder,
					resolve(scratch, `expired-${command}`),
				),
			);
			assert.equal(result.status, 1);
			assert.match(result.stderr, /Session preview.*stopped or is unreachable/);
			assert.match(
				result.stderr,
				/FIX(?:: .* launch .*--concept| BLOCKED:.*3176.*3177.*held)/,
			);
		}
		const cleaned = runCli(["cleanup", "--session", folder]);
		assert.equal(cleaned.status, 0, cleaned.stderr);
		assert.match(cleaned.stdout, /CLEANUP PASS: .*already stopped/);
	} finally {
		runCli(["cleanup", "--session", folder]);
	}
});

test("W2: requests renew the idle bound, then the detached preview leaves no process", async () => {
	const { folder, session } = await launched("idle-renewal");
	try {
		const until = Date.now() + 3500;
		while (Date.now() < until) {
			assert.equal((await fetchRaw(session.port, "/index.html")).status, 200);
			await new Promise((done) => setTimeout(done, 400));
		}
		assert.equal((await fetchRaw(session.port, "/index.html")).status, 200);
		process.kill(session.pid, 0);
		await waitForExit(session);
	} finally {
		runCli(["cleanup", "--session", folder]);
	}
});

test("W3: cleanup accepts a session file and verifies stopped records", async () => {
	const { folder, session } = await launched("cleanup-file", 10000);
	try {
		const path = resolve(folder, "session.json");
		await writeFile(path, JSON.stringify({ ...session, stopped: true }));
		const cleaned = runCli(["cleanup", "--session", path]);
		assert.equal(cleaned.status, 0, cleaned.stderr);
		assert.match(cleaned.stdout, /CLEANUP PASS: .* stopped;/);
		await portAvailable(session.port);
		const again = runCli(["cleanup", "--session", folder]);
		assert.equal(again.status, 0, again.stderr);
		assert.match(again.stdout, /already stopped/);
	} finally {
		await writeFile(resolve(folder, "session.json"), JSON.stringify(session));
		runCli(["cleanup", "--session", folder]);
	}
});

test("W3: cleanup rejects nonexistent paths by name", () => {
	const missing = resolve(scratch, "nonexistent-session");
	const result = runCli(["cleanup", "--session", missing]);
	assert.equal(result.status, 1);
	assert.ok(result.stderr.includes(missing));
	assert.doesNotMatch(result.stdout, /PASS/);
});

test("W3: cleanup never stops a preview with a different session token", async () => {
	const { folder, session } = await launched("cleanup-identity", 10000);
	try {
		const impostor = resolve(scratch, "impostor");
		await mkdir(impostor);
		await writeFile(
			resolve(impostor, "session.json"),
			JSON.stringify({ ...session, token: "wrong" }),
		);
		const result = runCli(["cleanup", "--session", impostor]);
		assert.equal(result.status, 1);
		assert.doesNotMatch(result.stdout, /PASS/);
		assert.match(result.stderr, /not owned by this session/);
		assert.equal((await fetchRaw(session.port, "/index.html")).status, 200);
	} finally {
		const cleaned = runCli(["cleanup", "--session", folder]);
		assert.equal(cleaned.status, 0, cleaned.stderr);
	}
	await portAvailable(session.port);
});
