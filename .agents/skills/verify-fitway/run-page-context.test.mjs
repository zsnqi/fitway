import assert from "node:assert/strict";
import test from "node:test";
import { contextOptions } from "./drive-plan.mjs";
import { newPageContextOptions, runPorts } from "./run.mjs";

const sizes = {
	desktop: { width: 1440, height: 900 },
	phone: { width: 390, height: 844 },
	zoom: { width: 1440, height: 900, zoom: 2 },
};

test("run.newPage uses drive's context options for every named axis", () => {
	for (const [size, dimensions] of Object.entries(sizes))
		for (const language of ["ar", "en"])
			for (const input of ["mouse", "touch", "keyboard"])
				for (const motion of ["reduce", "full"])
					for (const colours of ["normal", "forced"]) {
						const axes = {
							size,
							language,
							input,
							motion,
							colours,
						};
						assert.deepEqual(
							newPageContextOptions(axes, sizes),
							contextOptions({
								...dimensions,
								input,
								motion,
								color: colours,
								language,
							}),
							JSON.stringify(axes),
						);
					}
});

test("frame contexts carry density and leave ordinary contexts at density one", () => {
	const base = {
		input: "touch",
		motion: "reduce",
		color: "normal",
		language: "en",
	};
	assert.equal(
		contextOptions({
			...sizes.phone,
			...base,
			dsf: 3,
		}).dsf,
		3,
	);
	assert.equal(
		contextOptions({
			...sizes.desktop,
			...base,
		}).dsf,
		1,
	);
});

test("run.newPage accepts a free size with density", () => {
	assert.deepEqual(
		newPageContextOptions(
			{
				size: "1280x720@2",
				language: "en",
				input: "mouse",
				motion: "reduce",
				colours: "normal",
			},
			sizes,
		),
		contextOptions({
			width: 1280,
			height: 720,
			dsf: 2,
			input: "mouse",
			motion: "reduce",
			color: "normal",
			language: "en",
		}),
	);
});

test("a single-concept run owns the full requested pair", () => {
	assert.deepEqual(runPorts({}), [3176, 3177]);
	assert.deepEqual(runPorts({ port: "3188" }), [3188, 3189]);
	assert.throws(
		() => runPorts({ port: "3189" }),
		/requires a pair's first port.*received 3189/,
	);
});
