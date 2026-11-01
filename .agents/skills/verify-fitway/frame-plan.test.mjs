import assert from "node:assert/strict";
import test from "node:test";
import { framePlan, parseFrameSizes } from "./frame-plan.mjs";

const sizes = {
	desktop: { width: 1440, height: 900 },
	phone: { width: 390, height: 844 },
	phone360: { width: 360, height: 780 },
};

const map = {
	sizes,
	pages: [
		{
			page: "public.html",
			ready: "window.__ready === true",
			defaults: {},
			switches: [
				{
					name: "chart",
					values: ["line", "dots"],
					samples: [],
					dependencies: [],
				},
				{
					name: "level",
					values: ["quiet", "packed"],
					samples: [],
					dependencies: [],
				},
			],
			states: [],
			features: [],
		},
	],
};

const options = {
	page: "public.html",
	languages: "en",
	states: "chart=line&level=quiet,chart=dots&level=packed",
};

test("frame planning multiplies states by sizes with density in every name", () => {
	const plan = framePlan(map, {
		...options,
		sizes: "phone@3,desktop@2",
	});
	assert.equal(plan.frames.length, 4);
	assert.equal(new Set(plan.frames.map((frame) => frame.file)).size, 4);
	assert.deepEqual(
		plan.frames.map((frame) => [frame.file, frame.density]),
		[
			["en-phone-chart-line-level-quiet.png", 3],
			["en-desktop-chart-line-level-quiet.png", 2],
			["en-phone-chart-dots-level-packed.png", 3],
			["en-desktop-chart-dots-level-packed.png", 2],
		],
	);
});

test("frame size syntax accepts free CSS sizes with density", () => {
	assert.deepEqual(
		parseFrameSizes("1280x720@1,390x844@3", sizes).map(
			({ name, density, dimensions }) => [name, density, dimensions],
		),
		[
			["1280x720", 1, { width: 1280, height: 720 }],
			["390x844", 3, { width: 390, height: 844 }],
		],
	);
	assert.doesNotThrow(() =>
		parseFrameSizes("desktop,zoom", {
			...sizes,
			zoom: { width: 1440, height: 900, zoom: 2 },
		}),
	);
});

test("frame size syntax refuses invalid and duplicate free dimensions", () => {
	for (const value of [
		"239x720",
		"3841x720",
		"390x239",
		"390x2401",
		"390.5x720",
		"phone,390x844",
		"1280x720@1,1280X720@2",
	])
		assert.throws(
			() => parseFrameSizes(value, sizes),
			(error) =>
				error.message.includes(value.split(",")[0]) &&
				error.message.includes("<width>x<height>"),
			value,
		);
});

test("frame planning records supplied actions and clip on every frame", () => {
	const plan = framePlan(map, {
		...options,
		sizes: "1280x720@1",
		states: "chart=line&level=quiet",
		actions: 'click=.slot[data-h="18"];wait=20',
		clip: ".chart-card",
	});
	assert.deepEqual(
		plan.frames[0].actions.map((action) => action.step),
		['click=.slot[data-h="18"]', "wait=20"],
	);
	assert.equal(plan.frames[0].clip, ".chart-card");
	const plain = framePlan(map, {
		...options,
		sizes: "phone",
		states: "chart=line&level=quiet",
	});
	assert.equal("actions" in plain.frames[0], false);
	assert.equal("clip" in plain.frames[0], false);
});

test("an explicit multi-value input axis is added to every frame name", () => {
	const plan = framePlan(map, {
		...options,
		sizes: "phone@3,desktop@2",
		inputs: "touch,mouse",
	});
	assert.equal(plan.frames.length, 8);
	for (const frame of plan.frames) {
		assert.match(frame.file, new RegExp(`-${frame.input}\\.png$`));
	}
});

test("frame planning refuses file-safe name collisions", () => {
	const collisionMap = structuredClone(map);
	collisionMap.pages[0].switches[0].values = ["a.b", "a-b"];
	assert.throws(
		() =>
			framePlan(collisionMap, {
				...options,
				sizes: "phone@3",
				states: "chart=a.b,chart=a-b",
			}),
		/Frame name collision/,
	);
});

test("frame planning refuses an unmapped state switch", () => {
	assert.throws(
		() =>
			framePlan(map, {
				...options,
				sizes: "phone@3",
				states: "unknown=value",
			}),
		/unmapped query switch unknown/,
	);
});

test("frame size syntax accepts named densities and refuses malformed values", () => {
	assert.deepEqual(
		parseFrameSizes("phone,phone360@3,desktop@2", sizes).map(
			({ name, density }) => [name, density],
		),
		[
			["phone", 1],
			["phone360", 3],
			["desktop", 2],
		],
	);
	for (const value of [
		"unknown@3",
		"phone@0",
		"phone@5",
		"phone@1.5",
		"phone@x",
		"phone@",
		"@3",
		"phone@3@2",
		"phone@3,phone@2",
	])
		assert.throws(
			() => parseFrameSizes(value, sizes),
			(error) =>
				error.message.includes(value.split(",")[0]) &&
				/(?:Unknown frame size|Invalid frame size|Duplicate frame size)/.test(
					error.message,
				),
			value,
		);
});
