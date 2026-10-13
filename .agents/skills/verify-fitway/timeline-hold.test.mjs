import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { after, before, test as nodeTest } from "node:test";
import { createContext, runInContext } from "node:vm";
import { compare } from "./compare.mjs";
import { verificationTest } from "./skip-gate.mjs";
import { captureTimeline, observeTimeline } from "./timeline.mjs";

const test = verificationTest(nodeTest);
let scratch;
let serial = 0;
before(async () => {
	scratch = await mkdtemp(resolve(tmpdir(), "verify-fitway-hold-unit-"));
});
after(async () => {
	if (scratch) await rm(scratch, { recursive: true, force: true });
});

// Browser-boundary contract, following cli.test.mjs. These synthetic RGBA samples
// are not browser screenshots or CSS integration evidence. Production observation,
// scheduling, capture and comparison run unchanged; actual CSS proof is external.
function fixture() {
	let wall = 10000;
	let nextId = 0;
	const nativeTasks = new Map();
	const effects = [];
	class Event {
		constructor(type) {
			this.type = type;
			this.wallStamp = wall;
		}
		get timeStamp() {
			return this.wallStamp;
		}
	}
	class EventTarget {
		listeners = new Map();
		nativeHandlers = new Map();
		addEventListener(type, fn) {
			const entries = this.listeners.get(type) || [];
			if (!entries.includes(fn)) entries.push(fn);
			this.listeners.set(type, entries);
		}
		removeEventListener(type, fn) {
			this.listeners.set(
				type,
				(this.listeners.get(type) || []).filter((entry) => entry !== fn),
			);
		}
		deliver(event) {
			for (const fn of [...(this.listeners.get(event.type) || [])])
				if (typeof fn === "function") fn.call(this, event);
				else fn.handleEvent(event);
			this.nativeHandlers.get(`on${event.type}`)?.call(this, event);
		}
		dispatchEvent(event) {
			if (this instanceof Element) {
				window.deliver(event);
				document.deliver(event);
			}
			this.deliver(event);
		}
	}
	const handler = (prototype, name) =>
		Object.defineProperty(prototype, name, {
			configurable: true,
			get() {
				return this.nativeHandlers.get(name) || null;
			},
			set(value) {
				this.nativeHandlers.set(name, value);
			},
		});
	class Animation extends EventTarget {
		constructor(duration, intensity = 200) {
			super();
			Object.assign(this, {
				duration,
				intensity,
				startedAt: wall,
				state: "running",
				phase: 0,
			});
			this.effect = {
				getComputedTiming: () => ({
					endTime: duration,
					progress: Math.min(1, Math.max(0, this.currentTime / duration)),
				}),
			};
		}
		get currentTime() {
			return this.state === "running" ? wall - this.startedAt : this.phase;
		}
		set currentTime(value) {
			this.phase = value;
		}
		get playState() {
			return this.currentTime >= this.duration ? "finished" : this.state;
		}
		pause() {
			this.phase = this.currentTime;
			this.state = "paused";
		}
		play() {
			this.phase = this.playState === "finished" ? 0 : this.currentTime;
			this.startedAt = wall - this.phase;
			this.state = "running";
		}
		finish() {
			this.phase = this.duration;
			this.state = "finished";
		}
	}
	class Element extends EventTarget {
		animate(_frames, options) {
			const effect = new Animation(options.duration, options.intensity);
			effects.push(effect);
			return effect;
		}
	}
	class Document extends EventTarget {
		getAnimations() {
			return effects.filter((effect) => effect.playState !== "finished");
		}
	}
	class Window extends EventTarget {}
	class XMLHttpRequest extends EventTarget {}
	class MessagePort extends EventTarget {}
	for (const name of ["onkeyup", "onkeydown", "ontransitionend"])
		handler(Element.prototype, name);
	handler(XMLHttpRequest.prototype, "onload");
	handler(MessagePort.prototype, "onmessage");
	class MutationObserver {
		observe() {}
		takeRecords() {
			return [];
		}
	}
	const document = new Document();
	const window = new Window();
	const scheduleNative = (kind, fn, args = []) => {
		const id = ++nextId;
		nativeTasks.set(id, { kind, fn, args });
		return id;
	};
	Object.assign(window, {
		Element,
		HTMLElement: Element,
		Document,
		Window,
		XMLHttpRequest,
		MessagePort,
		Animation,
		setTimeout: (fn, _delay, ...args) => scheduleNative("timer", fn, args),
		setInterval: (fn, _delay, ...args) => scheduleNative("interval", fn, args),
		requestAnimationFrame: (fn) => scheduleNative("frame", fn),
		clearTimeout: (id) => nativeTasks.delete(id),
		clearInterval: (id) => nativeTasks.delete(id),
		cancelAnimationFrame: (id) => nativeTasks.delete(id),
		queueMicrotask,
	});
	const context = createContext({
		window,
		document,
		Event,
		EventTarget,
		Element,
		Animation,
		MutationObserver,
		URL,
		queueMicrotask,
		performance: { now: () => wall },
		nativeWall: () => wall,
		control: new Element(),
		request: new XMLHttpRequest(),
		port: new MessagePort(),
	});
	// A separate native Date in this VM realm reads fixture wall, not logical time.
	runInContext(
		`const RealDate=Date;
function NativeDate(...args){if(!new.target)return new RealDate(100000+nativeWall()).toString();return Reflect.construct(RealDate,args.length?args:[100000+nativeWall()],new.target)}
Object.setPrototypeOf(NativeDate,RealDate);NativeDate.prototype=RealDate.prototype;NativeDate.now=()=>100000+nativeWall();globalThis.Date=NativeDate;`,
		context,
	);
	const evaluate = (fn, arg) => {
		context.argument = arg;
		return runInContext(`(${fn.toString()})(argument)`, context);
	};
	const author = (script) =>
		runInContext(script, context, { filename: "http://fixture.test/app.js" });
	evaluate(observeTimeline);
	let pixel = () => 0;
	const page = {
		evaluate,
		screenshot: async () => Buffer.from([Math.round(pixel()), 0, 0, 255]),
	};
	return {
		page,
		evaluate,
		author,
		window,
		render(fn) {
			pixel = fn;
		},
		advanceWall(ms) {
			wall += ms;
		},
		async event(type) {
			evaluate((name) => control.dispatchEvent(new Event(name)), type);
			await Promise.resolve();
		},
		async arm() {
			window.__verifyFitwayTimeline.arm("click:#control", "mouse");
			await this.event("mousedown");
		},
		startRelease(duration) {
			// Native effects expire in wall time unless paused at the release boundary.
			const effect = new Animation(duration);
			effects.push(effect);
			pixel = () =>
				effect.intensity *
				Math.max(0, 1 - effect.currentTime / effect.duration);
			return effect;
		},
		nativeFrame() {
			const entry = [...nativeTasks].find(([, task]) => task.kind === "frame");
			assert.ok(entry, "startup scheduled a native frame");
			nativeTasks.delete(entry[0]);
			entry[1].fn(wall);
		},
	};
}

async function compared(makeFixture, times) {
	const out = resolve(scratch, `comparison-${++serial}`);
	const captures = { build: 0, base: 0 };
	let failure;
	const lines = [];
	const log = console.log;
	console.log = (...args) => lines.push(args.join(" "));
	try {
		await compare(
			{
				out,
				concept: "build",
				baseline: "base",
				page: "fixture.html",
				"timeline-times": times,
			},
			{
				// No socket listeners, Chromium, ui-forensics, Python or external processes.
				checkPort: async () => {},
				doctor: async (options) => ({
					concept: options.concept,
					tools: scratch,
					map: { pages: [{ page: "fixture.html" }] },
				}),
				child: async (_command, args) => {
					const [a, b] = await Promise.all([
						readFile(args[1]),
						readFile(args[2]),
					]);
					assert.equal(a.length, 4);
					assert.equal(b.length, 4);
					await writeFile(
						args[args.indexOf("--json") + 1],
						JSON.stringify({
							identical: a.equals(b),
							bbox: a.equals(b) ? null : [0, 0, 1, 1],
							changedPixels: a.equals(b) ? 0 : 1,
							images: {},
						}),
					);
				},
				captureItems: async (options, setup, folder) => {
					const side = setup.concept;
					const current = await makeFixture(side, ++captures[side]);
					const timeline = await captureTimeline(current.page, {
						out: folder,
						stem: "fixture",
						times: options["timeline-times"].split(",").map(Number),
					});
					current.verify?.();
					await writeFile(
						resolve(folder, "settled.png"),
						Buffer.from([0, 0, 0, 255]),
					);
					return {
						items: [
							{
								feature: "fixture.html/hold",
								state: "default",
								language: "en",
								size: "desktop",
								input: "mouse",
								motion: "full",
								transport: "http",
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
	} catch (error) {
		failure = error;
	} finally {
		console.log = log;
	}
	if (failure && !/differences or problems/.test(failure.message))
		throw failure;
	const summary = lines.findLast((line) =>
		/^TIMELINE (PASS|FAIL|INCOMPLETE):/.test(line),
	);
	if (summary) console.log(summary);
	const report = JSON.parse(
		await readFile(resolve(out, "comparison.json"), "utf8"),
	);
	assert.equal(report.timelineSummary.problem, 0, failure?.stack);
	assert.equal(report.items[0].result, "equal", failure?.stack);
	return { report, failure, lines };
}
function different(result) {
	assert.match(result.failure?.message || "", /differences or problems/);
	assert.ok(
		result.lines.some((line) => line.startsWith("TIMELINE DIFFERENT:")),
	);
	assert.ok(result.report.timelineSummary.different > 0);
	assert.equal(result.report.timelineSummary["not-held"], 0);
}

test("release boundary holds an expiring native fade before a late capture", async () => {
	const make = (planted) => async (side) => {
		const current = fixture();
		await current.arm();
		current.startRelease(planted && side === "build" ? 160 : 120);
		await current.event("mouseup");
		current.advanceWall(250);
		return current;
	};
	const self = await compared(make(false), "61,141");
	assert.equal(self.failure, undefined);
	assert.equal(self.report.timelineSummary.equal, 2);
	different(await compared(make(true), "61,141"));
});
for (const clock of ["performance.now()", "Date.now()"])
	test(`held ${clock} makes a changed clock-timed moment DIFFERENT`, async () => {
		const make = (planted) => async (side) => {
			const current = fixture();
			const duration = planted && side === "build" ? 560 : 400;
			current.author(
				`window.pixel=0;control.addEventListener('click',()=>{const start=${clock};function tick(){if(${clock}-start>=${duration})window.pixel=200;else window.setTimeout(tick,20)}window.setTimeout(tick,20)});`,
			);
			current.render(() => current.evaluate(() => window.pixel));
			await current.arm();
			await current.event("click");
			return current;
		};
		const self = await compared(make(false), "1,450,650");
		assert.equal(self.failure, undefined);
		assert.equal(self.report.timelineSummary.equal, 3);
		different(await compared(make(true), "1,450,650"));
	});
test("startup, event properties, Date and frame callbacks share one page clock", async () => {
	const result = await compared(async () => {
		const current = fixture();
		current.author(`window.coherent=performance.now()===0;
function check(t){const now=performance.now();window.coherent&&=Date.now()===new Date().getTime()&&Date.now()===Math.floor(performance.timeOrigin+now)&&(t===undefined||t===now)}
check();window.coherent&&=new Date(1234).getTime()===1234&&Date()===new Date().toString();
window.requestAnimationFrame(t=>check(t));
let events=[];control.onkeyup=e=>events.push([e,performance.now()]);request.onload=e=>events.push([e,performance.now()]);port.onmessage=e=>events.push([e,performance.now()]);
control.nativeHandlers.set('onkeydown',e=>events.push([e,performance.now()]));
control.addEventListener('click',e=>{check(e.timeStamp);window.requestAnimationFrame(t=>check(t));window.setTimeout(()=>{control.dispatchEvent(new Event('keyup'));request.dispatchEvent(new Event('load'));port.dispatchEvent(new Event('message'));control.dispatchEvent(new Event('keydown'))},20);window.setTimeout(()=>{window.coherent&&=events.length===4&&events.every(([event,at])=>event.timeStamp===at);check()},30)});`);
		current.nativeFrame();
		await current.arm();
		await current.event("click");
		current.verify = () =>
			assert.equal(
				current.evaluate(() => window.coherent),
				true,
				"authored clock coherence, not just matching pixels",
			);
		return current;
	}, "1,21,41,101");
	assert.equal(result.failure, undefined);
	assert.equal(result.report.timelineSummary.equal, 4);
});
test("idle driver waits advance setup time without advancing the armed clock", async () => {
	const result = await compared(async () => {
		const current = fixture();
		current.author(`window.pixel=0;const shownAt=performance.now();
control.addEventListener('click',e=>{if(e.timeStamp-shownAt>=500)window.pixel=200});`);
		current.render(() => current.evaluate(() => window.pixel));
		// The driver's wait runs outside the page, with no authored timer or frame.
		current.advanceWall(600);
		assert.equal(
			current.evaluate(() => new Event("unused").timeStamp),
			0,
			"a page timestamp getter reads only the logical clock",
		);
		await current.arm();
		current.advanceWall(1000);
		await current.event("click");
		current.verify = () => {
			assert.equal(
				current.evaluate(() => window.pixel),
				200,
				"save passes its age guard",
			);
			assert.equal(
				current.evaluate(() => performance.now()),
				641,
				"capture wall time stays outside the page clock",
			);
			current.advanceWall(50);
			current.evaluate(() => control.dispatchEvent(new Event("keydown")));
			assert.equal(
				current.evaluate(() => performance.now()),
				691,
				"release excludes held wall time from the next setup event",
			);
		};
		return current;
	}, "1,21,41");
	assert.equal(result.failure, undefined);
	assert.equal(result.report.timelineSummary.equal, 3);
});
test("targetless browser clocks are held when started and replayed", async () => {
	for (const birth of ["startup", "click", "resume"]) {
		const make = (planted) => async (side) => {
			const current = fixture();
			const duration = planted && side === "build" ? 160 : 120;
			current.author(`window.pixel=200;const clockEffect=new Animation(${duration});
function draw(){const progress=clockEffect.effect.getComputedTiming().progress;window.pixel=200*(1-progress);if(progress<1)window.requestAnimationFrame(draw)}
function start(){clockEffect.play();draw()}
${birth === "startup" ? "start();" : "control.addEventListener('click',start);"}
window.setTimeout(()=>{${birth === "resume" ? "clockEffect.pause();clockEffect.currentTime=20;" : ""}start();window.replayPhase=clockEffect.currentTime},200);`);
			current.render(() => current.evaluate(() => window.pixel));
			await current.arm();
			await current.event("click");
			current.advanceWall(250);
			current.verify = () =>
				assert.equal(
					current.evaluate(() => window.replayPhase),
					birth === "resume" ? 20 : 0,
					"play preserves a paused phase and rewinds a finished effect",
				);
			return current;
		};
		const self = await compared(make(false), "61,141,241,341");
		assert.equal(self.failure, undefined);
		assert.equal(self.report.timelineSummary.equal, 4);
		const plant = await compared(make(true), "61,141,241,341");
		different(plant);
		assert.ok(
			plant.report.items[0].timeline.samples.some(
				(sample) => sample.time < 200 && sample.result === "different",
			),
			"the first play is held, including plays during startup",
		);
		assert.ok(
			plant.report.items[0].timeline.samples.some(
				(sample) => sample.time > 200 && sample.result === "different",
			),
			"replaying a finished effect renews its hold",
		);
	}
});
test("genuine same-side frame variation remains NOT-HELD", async () => {
	const result = await compared(async (_side, capture) => {
		const current = fixture();
		await current.arm();
		const effect = current.startRelease(100);
		// Independent fresh-context values vary frames; one context remains stable.
		const intensity = 40 + capture * 30;
		current.render(
			() => intensity * Math.max(0, 1 - effect.currentTime / effect.duration),
		);
		await current.event("mouseup");
		return current;
	}, "1,21,41");
	assert.equal(result.failure, undefined);
	assert.equal(result.report.timelineSummary["not-held"], 3);
	assert.ok(result.lines.some((line) => line.startsWith("TIMELINE NOT-HELD:")));
	for (const sample of result.report.items[0].timeline.samples) {
		const pair = Object.values(sample.stability).find(
			(entry) => entry?.identical === false,
		);
		assert.ok(pair);
		const [first, repeat] = await Promise.all([
			readFile(pair.first),
			readFile(pair.repeat),
		]);
		assert.notDeepEqual(
			first,
			repeat,
			"NOT-HELD has an actual differing same-side pair",
		);
	}
});
