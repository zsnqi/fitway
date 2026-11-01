import assert from "node:assert/strict";
import test from "node:test";
import {
	applyFrameActions,
	frameClip,
	parseFrameActions,
} from "./frame-actions.mjs";

test("frame actions parse every supported step at its first equal sign", () => {
	const actions = parseFrameActions(
		'click=.slot[data-h="18"];tap=.slot[data-h="18"];hover=.slot;focus=.slot;press=Enter;wait=0',
	);
	assert.deepEqual(
		actions.map(({ kind, argument }) => [kind, argument]),
		[
			["click", '.slot[data-h="18"]'],
			["tap", '.slot[data-h="18"]'],
			["hover", ".slot"],
			["focus", ".slot"],
			["press", "Enter"],
			["wait", "0"],
		],
	);
});

test("frame actions refuse missing values and waits outside the bound", () => {
	for (const value of ["", "click", "wait=-1", "wait=5001", "wait=1.5"]) {
		assert.throws(
			() => parseFrameActions(value),
			/frame action|Missing frame actions/i,
		);
	}
});

test("frame actions preserve the full failing step and require touch for tap", async () => {
	const calls = [];
	const ui = {
		runAction: async (_page, action) => calls.push(action),
		twoFrames: async () => {},
	};
	await applyFrameActions(
		ui,
		{},
		parseFrameActions('click=.slot[data-h="18"];press=Enter'),
		"mouse",
	);
	assert.deepEqual(calls, ['click:.slot[data-h="18"]', "press:Enter"]);
	await assert.rejects(
		applyFrameActions(ui, {}, parseFrameActions("tap=.slot"), "mouse"),
		/tap=\.slot/,
	);
	await assert.rejects(
		applyFrameActions(ui, {}, [
			{ step: "scroll=10", kind: "scroll", argument: "10" },
		]),
		/scroll=10/,
	);
});

test("frame clips widen by eight pixels and stay inside the viewport", async () => {
	const page = {
		locator: () => ({
			first: () => ({
				boundingBox: async () => ({
					x: 4,
					y: 8,
					width: 100,
					height: 50,
				}),
			}),
		}),
		evaluate: async () => ({
			width: 80,
			height: 60,
			scrollX: 10,
			scrollY: 20,
		}),
	};
	assert.deepEqual(await frameClip(page, ".card"), {
		x: 10,
		y: 20,
		width: 80,
		height: 60,
	});
});
