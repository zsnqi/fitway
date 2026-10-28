import assert from "node:assert/strict";
import { test as nodeTest } from "node:test";
import { comparisonParts } from "./comparison-capture.mjs";
import { verificationTest } from "./skip-gate.mjs";

const test = verificationTest(nodeTest);

test("a document taller than its viewport is planned as viewport-sized parts, the last scrolled no further than the document", () => {
	assert.deepEqual(
		comparisonParts({ viewportHeight: 844, documentHeight: 1654 }),
		[
			{ documentTop: 0, scrollTop: 0, sourceTop: 0, height: 844 },
			{ documentTop: 844, scrollTop: 810, sourceTop: 34, height: 810 },
		],
	);
	assert.deepEqual(
		comparisonParts({ viewportHeight: 844, documentHeight: 1688 }),
		[
			{ documentTop: 0, scrollTop: 0, sourceTop: 0, height: 844 },
			{ documentTop: 844, scrollTop: 844, sourceTop: 0, height: 844 },
		],
	);
});

test("a document as tall as its viewport is planned as one part", () => {
	assert.deepEqual(
		comparisonParts({ viewportHeight: 844, documentHeight: 844 }),
		[{ documentTop: 0, scrollTop: 0, sourceTop: 0, height: 844 }],
	);
});

test("a comparison that fits the viewport remains one unchanged screenshot", async () => {
	const { captureComparison } = await import("./comparison-capture.mjs");
	const expected = Buffer.from("viewport");
	const screenshots = [];
	const page = {
		waitForFunction: async () => {},
		evaluate: async (fn) => {
			if (fn.toString().includes("document.scrollingElement"))
				return {
					scrollX: 0,
					scrollY: 0,
					viewportWidth: 1440,
					viewportHeight: 900,
					documentHeight: 900,
				};
		},
		screenshot: async (options) => {
			screenshots.push(options);
			return expected;
		},
	};

	assert.equal(await captureComparison(page), expected);
	assert.deepEqual(screenshots, [
		{ fullPage: false, animations: "allow", caret: "hide" },
	]);
});
