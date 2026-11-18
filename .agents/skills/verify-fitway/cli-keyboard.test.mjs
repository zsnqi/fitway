import assert from "node:assert/strict";
import { after, before, test as nodeTest } from "node:test";
import {
	createUnitConcept,
	removeUnitConcept,
	scratch,
} from "./cli-test-harness.mjs";
import {
	KeyboardReachError,
	performAction,
	proveFeature,
	reachByKeyboard,
} from "./drive.mjs";
import { inputAxis } from "./drive-plan.mjs";
import { verificationTest } from "./skip-gate.mjs";

const test = verificationTest(nodeTest);
before(createUnitConcept);
after(removeUnitConcept);

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
