import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { after, before, test as nodeTest } from "node:test";
import { createContext, runInContext, runInNewContext } from "node:vm";
import {
	createUnitConcept,
	removeUnitConcept,
	scratch,
} from "./cli-test-harness.mjs";
import { compare } from "./compare.mjs";
import { verificationTest } from "./skip-gate.mjs";
import {
	captureTimeline,
	observeTimeline,
	timelineTimes,
} from "./timeline.mjs";

const test = verificationTest(nodeTest);
before(createUnitConcept);
after(removeUnitConcept);

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
		if (mode === "confirmation-fails") {
			assert.equal(report.items[0].result, "problem");
			assert.ok(
				report.items[0].problems.includes("confirmation fixture failed"),
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
				["deterministic", "cross-size"].includes(mode)
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
		if (mode === "cross-size") {
			const [baseline, build] = await Promise.all(
				[samples[1].files.baseline, samples[1].files.build].map((file) =>
					readFile(file),
				),
			);
			assert.notEqual(baseline.length, build.length);
			assert.deepEqual(samples[1].sizes, {
				baseline: [baseline.length, 1],
				build: [build.length, 1],
			});
			assert.ok(
				lines.some(
					(line) =>
						line.startsWith("TIMELINE DIFFERENT:") &&
						line.includes(
							`; sizes baseline ${baseline.length}x1, build ${build.length}x1`,
						),
				),
				lines.join("\n"),
			);
		}
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
