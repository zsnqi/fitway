import { writeFile } from "node:fs/promises";
import { outputFile } from "./core.mjs";

export { timelineTimes } from "./timeline-times.mjs";

// Installed before source scripts. Page clocks share a logical origin even during
// startup; the observer alone keeps native clocks for scheduling outside captures.
export function observeTimeline() {
	const native = {
		timeout: window.setTimeout.bind(window),
		interval: window.setInterval.bind(window),
		clear: window.clearTimeout.bind(window),
		clearInterval: window.clearInterval.bind(window),
		frame: window.requestAnimationFrame.bind(window),
		cancel: window.cancelAnimationFrame.bind(window),
		now: performance.now.bind(performance),
		Date: Date,
		animate: Element.prototype.animate,
		play: Animation.prototype.play,
	};
	let clock = 0;
	let realAnchor = native.now();
	function advanceSetupClock() {
		if (held) return;
		const now = native.now();
		clock += Math.max(0, now - realAnchor);
		realAnchor = now;
	}
	const epoch = 0;
	const pageNow = () => (held ? origin + time : clock);
	Object.defineProperty(performance, "now", {
		configurable: true,
		value: pageNow,
	});
	Object.defineProperty(performance, "timeOrigin", {
		configurable: true,
		value: epoch,
	});
	function HeldDate(...args) {
		if (!new.target) return new native.Date(epoch + pageNow()).toString();
		return Reflect.construct(
			native.Date,
			args.length ? args : [epoch + pageNow()],
			new.target,
		);
	}
	Object.setPrototypeOf(HeldDate, native.Date);
	HeldDate.prototype = native.Date.prototype;
	Object.defineProperty(HeldDate.prototype, "constructor", {
		configurable: true,
		writable: true,
		value: HeldDate,
	});
	HeldDate.now = () => Math.floor(epoch + pageNow());
	globalThis.Date = HeldDate;
	const eventTimes = new WeakMap();
	const stamp = (event, advance = true) => {
		if (
			event &&
			(typeof event === "object" || typeof event === "function") &&
			!eventTimes.has(event)
		) {
			if (advance) advanceSetupClock();
			eventTimes.set(event, pageNow());
		}
	};
	if (globalThis.Event)
		Object.defineProperty(Event.prototype, "timeStamp", {
			configurable: true,
			get() {
				stamp(this, false);
				return eventTimes.get(this);
			},
		});
	let held = false;
	let waiting = null;
	let time = 0;
	let origin = 0;
	let sequence = 0;
	let callbackSource = null;
	let painting = false;
	let callbacks = 0;
	let schedulingBlocked = false;
	const tasks = new Map();
	const effects = new Map();
	const played = new Set();
	const findings = [];
	const stringTasks = [];
	const source = () => {
		const stack = new Error().stack || "";
		const line = stack
			.split("\n")
			.find((s) => /(?:https?:\/\/|file:\/\/).*:\d+:\d+/.test(s));
		const match = line?.match(/((?:https?:\/\/|file:\/\/).*?):(\d+):(\d+)\)?$/);
		return match
			? {
					file: decodeURIComponent(new URL(match[1]).pathname).replace(
						/^\//,
						"",
					),
					line: Number(match[2]),
					column: Number(match[3]),
				}
			: { file: "<page script>", line: 1, stack };
	};
	let observed = [];
	const observer = new MutationObserver((records) => observed.push(...records));
	observer.observe(document, {
		subtree: true,
		childList: true,
		attributes: true,
		characterData: true,
	});
	const note = (src, reason) => {
		if (
			!findings.some(
				(f) =>
					f.time === time &&
					f.source.file === src.file &&
					f.source.line === src.line &&
					f.reason === reason,
			)
		)
			findings.push({ time, source: src, reason });
	};
	if (typeof navigator !== "undefined" && navigator.clipboard)
		for (const method of ["writeText", "readText", "write", "read"]) {
			const original = navigator.clipboard[method];
			if (typeof original !== "function") continue;
			navigator.clipboard[method] = function (...args) {
				if (held)
					note(
						source(),
						"clipboard promise resolves outside held animation effects",
					);
				return Reflect.apply(original, this, args);
			};
		}
	// Completion handlers and promise reactions are native tasks/microtasks, not
	// CSS/WAAPI effects. Attribute authored callbacks even if they arrive while
	// the screenshot awaits Chromium's paint, rather than silently passing them.
	const then = Promise.prototype.then;
	const finished = Object.getOwnPropertyDescriptor(
		Animation.prototype,
		"finished",
	);
	if (finished?.get)
		Object.defineProperty(Animation.prototype, "finished", {
			...finished,
			get() {
				const promise = finished.get.call(this);
				const src = source();
				if (src.file !== "<page script>")
					then.call(
						promise,
						() => {
							if (held)
								note(
									src,
									"animation finished promise resolves outside held animation effects",
								);
						},
						() => {},
					);
				return promise;
			},
		});
	const microtask = window.queueMicrotask?.bind(window);
	if (microtask)
		window.queueMicrotask = (fn) => {
			const src = source();
			return microtask(() => {
				if (held && src.file !== "<page script>")
					note(src, "microtask callback runs outside held animation effects");
				fn();
			});
		};
	if (window.fetch) {
		const fetch = window.fetch;
		window.fetch = function (...args) {
			if (held)
				note(source(), "fetch promise resolves outside held animation effects");
			return Reflect.apply(fetch, this, args);
		};
	}
	// biome-ignore lint/suspicious/noThenProperty: Wrap the existing native Promise method to attribute completion callbacks; this is intentionally a Promise.
	Promise.prototype.then = function (fulfilled, rejected) {
		const src = source();
		const wrap = (fn) =>
			typeof fn !== "function"
				? fn
				: function (...args) {
						if (held && src.file !== "<page script>")
							note(src, "promise callback runs outside held animation effects");
						return Reflect.apply(fn, this, args);
					};
		return then.call(this, wrap(fulfilled), wrap(rejected));
	};
	const addListener = EventTarget.prototype.addEventListener;
	const removeListener = EventTarget.prototype.removeEventListener;
	const completionListeners = new WeakMap();
	EventTarget.prototype.addEventListener = function (event, fn, options) {
		if (!(typeof fn === "function" || typeof fn?.handleEvent === "function"))
			return addListener.call(this, event, fn, options);
		const src = source();
		let entries = completionListeners.get(this);
		if (!entries) {
			entries = new Map();
			completionListeners.set(this, entries);
		}
		let byEvent = entries.get(fn);
		if (!byEvent) {
			byEvent = new Map();
			entries.set(fn, byEvent);
		}
		const key = `${event}:${Boolean(typeof options === "boolean" ? options : options?.capture)}`;
		const wrapped =
			byEvent.get(key) ||
			function (...args) {
				stamp(args[0]);
				if (held && ["finish", "animationend", "transitionend"].includes(event))
					note(src, `${event} handler runs outside held animation effects`);
				return typeof fn === "function"
					? Reflect.apply(fn, this, args)
					: Reflect.apply(fn.handleEvent, fn, args);
			};
		byEvent.set(key, wrapped);
		return addListener.call(this, event, wrapped, options);
	};
	EventTarget.prototype.removeEventListener = function (event, fn, options) {
		const key = `${event}:${Boolean(typeof options === "boolean" ? options : options?.capture)}`;
		return removeListener.call(
			this,
			event,
			completionListeners.get(this)?.get(fn)?.get(key) || fn,
			options,
		);
	};
	const finish = Object.getOwnPropertyDescriptor(
		Animation.prototype,
		"onfinish",
	);
	if (finish?.set)
		Object.defineProperty(Animation.prototype, "onfinish", {
			...finish,
			set(fn) {
				const src = source();
				finish.set.call(
					this,
					typeof fn !== "function"
						? fn
						: function (...args) {
								stamp(args[0]);
								if (held)
									note(
										src,
										"onfinish handler runs outside held animation effects",
									);
								return Reflect.apply(fn, this, args);
							},
				);
			},
		});
	// Native event-property deliveries do not pass through JS addEventListener.
	// Discover their owners before scripts, including targets outside the DOM,
	// without evaluating window getters or naming an interface/control.
	const eventOwners = new Set([window]);
	const eventTypes = new Set();
	for (const name of Object.getOwnPropertyNames(window)) {
		const value = Object.getOwnPropertyDescriptor(window, name)?.value;
		let prototype = typeof value === "function" ? value.prototype : null;
		if (
			!prototype ||
			!Object.prototype.isPrototypeOf.call(EventTarget.prototype, prototype)
		)
			continue;
		while (prototype && !eventOwners.has(prototype)) {
			eventOwners.add(prototype);
			prototype = Object.getPrototypeOf(prototype);
		}
	}
	for (const prototype of eventOwners)
		for (const property of Object.getOwnPropertyNames(prototype).filter(
			(name) => /^on/.test(name),
		)) {
			const descriptor = Object.getOwnPropertyDescriptor(prototype, property);
			eventTypes.add(property.slice(2));
			if (!descriptor?.set || !descriptor.configurable) continue;
			const assigned = new WeakMap();
			Object.defineProperty(prototype, property, {
				...descriptor,
				get() {
					return assigned.has(this)
						? assigned.get(this)
						: descriptor.get.call(this);
				},
				set(fn) {
					assigned.set(this, fn);
					const src = source();
					descriptor.set.call(
						this,
						typeof fn !== "function"
							? fn
							: function (...args) {
									stamp(args[0]);
									if (
										held &&
										["onanimationend", "ontransitionend"].includes(property)
									)
										note(
											src,
											`${property} handler runs outside held animation effects`,
										);
									return Reflect.apply(fn, this, args);
								},
					);
				},
			});
		}
	// Inline handlers are compiled by the browser without invoking those setters.
	for (const event of eventTypes) {
		if (typeof window.addEventListener === "function")
			addListener.call(window, event, stamp, true);
		document.addEventListener(event, stamp, true);
	}
	const clearNative = (task) =>
		task.kind === "frame"
			? native.cancel(task.nativeId)
			: task.kind === "interval"
				? native.clearInterval(task.nativeId)
				: native.clear(task.nativeId);
	function schedule(kind, fn, delay, args) {
		if (kind === "frame" && typeof fn !== "function") return native.frame(fn);
		advanceSetupClock();
		const id = ++sequence;
		const task = {
			id,
			kind,
			fn,
			args,
			source: source(),
			delay: kind === "frame" ? 1000 / 60 : Math.max(1, Number(delay) || 0),
			due:
				(held ? time : clock) +
				(kind === "frame" ? 1000 / 60 : Math.max(1, Number(delay) || 0)),
		};
		if (held && schedulingBlocked) {
			note(
				task.source,
				"authored callback budget exhausted; further script work cannot be held",
			);
			return id;
		}
		const run = () => {
			advanceSetupClock();
			clock = Math.max(clock, task.due);
			if (kind !== "interval") tasks.delete(id);
			else task.due = clock + task.delay;
			if (typeof fn === "function")
				Reflect.apply(fn, window, kind === "frame" ? [clock] : args);
		};
		if (!held)
			task.nativeId =
				kind === "frame"
					? native.frame(run)
					: kind === "interval"
						? native.interval(
								typeof fn === "function" ? run : fn,
								task.delay,
								...args,
							)
						: native.timeout(
								typeof fn === "function" ? run : fn,
								task.delay,
								...args,
							);
		if (!held && typeof fn !== "function" && kind !== "interval")
			native.timeout(() => tasks.delete(id), task.delay);
		tasks.set(id, task);
		return id;
	}
	window.setTimeout = (fn, delay, ...args) =>
		schedule("timer", fn, delay, args);
	window.setInterval = (fn, delay, ...args) =>
		schedule("interval", fn, delay, args);
	window.requestAnimationFrame = (fn) => schedule("frame", fn, 0, []);
	const cancel = (id) => {
		const task = tasks.get(id);
		if (task) {
			clearNative(task);
			tasks.delete(id);
		}
	};
	window.clearTimeout =
		window.clearInterval =
		window.cancelAnimationFrame =
			cancel;
	Element.prototype.animate = function (...args) {
		const animation = native.animate.apply(this, args);
		if (held) remember(animation);
		return animation;
	};
	// Directly constructed effects can drive script without a document target.
	// An authored play also resumes or rewinds a previously held effect.
	Animation.prototype.play = function (...args) {
		const result = native.play.apply(this, args);
		played.add(this);
		if (held) remember(this, true);
		return result;
	};
	function remember(animation, restart = false) {
		if (effects.has(animation) && !restart) return;
		const end = animation.effect?.getComputedTiming().endTime;
		if (!restart && animation.playState === "finished" && Number.isFinite(end))
			return;
		const initial = restart ? Number(animation.currentTime) || 0 : 0;
		effects.set(animation, {
			start: time,
			end,
			initial,
			finished: false,
			source: source(),
		});
		animation.pause();
		animation.currentTime = initial;
	}
	const phase = Object.getOwnPropertyDescriptor(
		Animation.prototype,
		"currentTime",
	);
	if (phase?.set)
		Object.defineProperty(Animation.prototype, "currentTime", {
			...phase,
			set(value) {
				phase.set.call(this, value);
				if (held && !painting && effects.has(this) && !callbackSource)
					effects.get(this).initial = Number(value) || 0;
			},
		});
	const until = (a, e) => {
		const rate = a.playbackRate ?? 1;
		if (!(rate > 0) || !Number.isFinite(rate)) {
			note(
				e.source,
				"non-positive or non-finite animation playbackRate cannot be held",
			);
			e.unsupported = true;
			return e.start;
		}
		return e.start + Math.max(0, e.end - e.initial) / rate;
	};
	function collect() {
		for (const animation of document.getAnimations()) remember(animation);
		for (const animation of played) {
			if (["idle", "finished"].includes(animation.playState))
				played.delete(animation);
			else remember(animation);
		}
	}
	function begin() {
		if (held) return;
		held = true;
		waiting = null;
		time = 0;
		origin = clock;
		effects.clear();
		findings.length = 0;
		callbacks = 0;
		schedulingBlocked = false;
		for (const task of tasks.values()) {
			clearNative(task);
			task.due =
				task.kind === "frame" ? 1000 / 60 : Math.max(1, task.due - origin);
		}
		observer.takeRecords();
		observed = [];
		queueMicrotask(collect);
	}
	for (const event of [
		"pointerdown",
		"pointerup",
		"click",
		"mousedown",
		"touchstart",
		"mouseup",
		"touchend",
		"keydown",
		"input",
		"change",
		"focusin",
	])
		document.addEventListener(
			event,
			(e) => {
				if (
					waiting?.events.includes(event) &&
					(!waiting.key || waiting.key === e.key)
				)
					begin();
				stamp(e);
				if (held) {
					// Flush the pressed pose before the browser removes :active. The
					// next flush discovers its release transitions, including registered
					// custom properties, without adding a style or changing the DOM.
					collect();
					queueMicrotask(collect);
				}
			},
			true,
		);
	async function paint(at) {
		time = at;
		painting = true;
		for (const [animation, effect] of effects) {
			if (animation.playState === "idle") effect.finished = true;
			if (effect.finished) continue;
			const endAt = until(animation, effect);
			if (effect.unsupported) continue;
			animation.pause();
			animation.currentTime = Number.isFinite(effect.end)
				? Math.min(
						Math.max(
							0,
							effect.initial +
								(at - effect.start) * (animation.playbackRate ?? 1),
						),
						effect.end,
					)
				: 0;
			if (Number.isFinite(effect.end) && at >= endAt) {
				effect.finished = true;
				animation.finish();
			}
		}
		painting = false;
		await Promise.resolve();
		await Promise.resolve();
		collect();
	}
	async function seek(at) {
		if (!held) {
			advanceSetupClock();
			begin();
		}
		collect();
		while (true) {
			const nextTask = [...tasks.values()].sort(
				(a, b) => a.due - b.due || a.id - b.id,
			)[0];
			const ends = [...effects]
				.filter(
					([a, e]) =>
						a.playState !== "idle" &&
						!e.finished &&
						!e.unsupported &&
						Number.isFinite(e.end),
				)
				.map(([a, e]) => until(a, e));
			const next = Math.min(nextTask?.due ?? Number.POSITIVE_INFINITY, ...ends);
			if (next > at) break;
			await paint(Math.max(time, next));
			if (
				nextTask &&
				tasks.get(nextTask.id) === nextTask &&
				nextTask.due <= time
			) {
				if (++callbacks > 2000) {
					note(
						nextTask.source,
						"authored callback budget exhausted; further script work cannot be held",
					);
					schedulingBlocked = true;
					tasks.clear();
					continue;
				}
				if (nextTask.kind === "interval") nextTask.due = time + nextTask.delay;
				else tasks.delete(nextTask.id);
				observer.takeRecords();
				observed = [];
				callbackSource = nextTask.source;
				// Executing authored callback code is outside a browser-effect hold.
				// This includes canvas/CSSOM writes and async continuations, which a DOM
				// MutationObserver alone cannot certify. Keep their origin visible.
				note(
					callbackSource,
					`${nextTask.kind} callback runs outside held animation effects`,
				);
				if (typeof nextTask.fn === "function")
					Reflect.apply(
						nextTask.fn,
						window,
						nextTask.kind === "frame" ? [origin + time] : nextTask.args,
					);
				else if (nextTask.kind !== "interval") stringTasks.push(nextTask);
				await Promise.resolve();
				await Promise.resolve();
				const mutations = [...observed, ...observer.takeRecords()];
				observed = [];
				if (mutations.length)
					note(
						callbackSource,
						`${nextTask.kind} callback changes the document outside held animation effects`,
					);
				// Script-driven effect phases cannot be certified by seeking browser motion.
				for (const [a, e] of effects)
					if (
						!e.finished &&
						a.playState !== "idle" &&
						Math.abs(
							Number(a.currentTime) -
								(Number.isFinite(e.end) ? Math.min(time - e.start, e.end) : 0),
						) > 0.01
					)
						note(
							callbackSource,
							`${nextTask.kind} callback changes an animation phase`,
						);
				callbackSource = null;
				collect();
			}
		}
		await paint(at);
		return info();
	}
	function info() {
		for (const task of tasks.values())
			if (task.kind === "interval")
				note(
					task.source,
					"interval continuation is outside held finite animation effects",
				);
		return {
			time,
			end: Math.max(
				0,
				...[...effects]
					.filter(([a, e]) => a.playState !== "idle" && Number.isFinite(e.end))
					.map(([a, e]) => until(a, e)),
			),
			pending: [...tasks.values()].map(({ due, kind, source }) => ({
				due,
				kind,
				source,
			})),
			findings: [...findings],
		};
	}
	window.__verifyFitwayTimeline = {
		arm(action, input) {
			advanceSetupClock();
			const [kind, arg] = action.split(/:(.*)/s);
			const keyboardActivation =
				input === "keyboard" &&
				!["type", "select", "focus", "press"].includes(kind);
			waiting = {
				events: [
					kind === "hold"
						? input === "touch"
							? "touchstart"
							: "mousedown"
						: kind === "release"
							? input === "touch"
								? "touchend"
								: "mouseup"
							: kind === "type"
								? "input"
								: kind === "select"
									? "change"
									: kind === "focus"
										? "focusin"
										: kind === "press" || keyboardActivation
											? "keydown"
											: input === "touch"
												? "touchstart"
												: "mousedown",
				],
				key:
					kind === "press"
						? arg === "Space"
							? " "
							: arg.split("+").at(-1)
						: null,
			};
			if (["wait", "waitFor", "gesture", "eval", "scroll"].includes(kind))
				begin();
		},
		seek,
		info,
		release() {
			waiting = null;
			clock = origin + time;
			held = false;
			realAnchor = native.now();
			for (const [a, e] of effects)
				if (!e.finished && a.playState !== "idle") a.play();
			for (const task of stringTasks) native.timeout(task.fn, 0, ...task.args);
			stringTasks.length = 0;
			for (const task of [...tasks.values()]) {
				const remaining = Math.max(1, task.due - time);
				task.due = clock + remaining;
				const run = () => {
					advanceSetupClock();
					clock = Math.max(clock, task.due);
					if (task.kind !== "interval") tasks.delete(task.id);
					else task.due = clock + task.delay;
					if (typeof task.fn === "function")
						Reflect.apply(
							task.fn,
							window,
							task.kind === "frame" ? [clock] : task.args,
						);
				};
				task.nativeId =
					task.kind === "frame"
						? native.frame(run)
						: task.kind === "interval"
							? native.interval(
									typeof task.fn === "function" ? run : task.fn,
									task.delay,
									...task.args,
								)
							: native.timeout(
									typeof task.fn === "function" ? run : task.fn,
									remaining,
									...task.args,
								);
			}
		},
	};
}

export async function captureTimeline(page, { out, stem, times }) {
	const samples = [];
	const used = [];
	let info = await page.evaluate(() => window.__verifyFitwayTimeline.seek(0));
	const requested = times || [1];
	let cursor = 0;
	while (cursor < requested.length) {
		const time = requested[cursor++];
		info = await page.evaluate(
			(t) => window.__verifyFitwayTimeline.seek(t),
			time,
		);
		// Chromium may defer compositor tile invalidation after a logical seek.
		// Paint until two consecutive byte-identical frames; the final one is
		// the evidence frame, so no tolerance is introduced.
		let frame;
		let previous;
		for (let warmup = 0; warmup < 4; warmup++) {
			frame = await page.screenshot({
				fullPage: false,
				animations: "allow",
				caret: "hide",
			});
			if (previous?.equals(frame)) break;
			previous = frame;
		}
		const name = `${stem}-time-${String(time).replace(".", "_")}ms.png`;
		await writeFile(await outputFile(out, name), frame);
		info = await page.evaluate(() => window.__verifyFitwayTimeline.info());
		used.push(time);
		// Callback findings are evidence about work that ran during the
		// seek. They do not, by themselves, make the captured picture
		// unstable: compare classifies NOT-HELD only after it captures
		// the same side again at this exact time and the pixels differ.
		samples.push({
			time,
			file: name,
			result: "held",
			sources: info.findings,
		});
		if (!times) {
			// Follow finite effects and later starts; callback work is separately
			// bounded inside the scheduler. Intervals do not invent an infinite end.
			const nextPending = info.pending
				.filter((p) => p.kind !== "interval")
				.map((p) => p.due);
			const end = Math.ceil(Math.max(info.end, ...nextPending, 0) / 100) * 100;
			if (time < end)
				requested.push(Math.min(time === 1 ? 100 : time + 100, end));
		}
	}
	// Explicit samples may end before a long effect. Finish it logically before
	// the ordinary settled capture, rather than waiting on the running clock.
	let finalizationPasses = 0;
	while (info.end > info.time && finalizationPasses++ < 32)
		info = await page.evaluate(
			(t) => window.__verifyFitwayTimeline.seek(t),
			info.end,
		);
	await page.evaluate(() => window.__verifyFitwayTimeline.release());
	return { times: used, end: info.end, samples };
}
