import { describe, expect, it } from "vitest";
import { scanScope } from "./code-health.mjs";

function totals(text: string, file = "cases.test.ts") {
	const result = scanScope([{ file, text }]);
	return {
		cases: result.testCases?.total ?? 0,
		expects: result.expectCalls?.total ?? 0,
	};
}

describe("test case and expectation floors", () => {
	it("counts direct, aliased, chained and conditional test calls once", () => {
		const text = [
			'import { it, test } from "vitest";',
			'import { it as nodeIt } from "node:test";',
			'it("direct", () => {});',
			'test.only("only", () => {});',
			'it.each([["value"]])("each", () => {});',
			'it.only.each([["value"]])("only each", () => {});',
			'it.concurrent("concurrent", () => {});',
			'it.sequential.each([["value"]])("sequential each", () => {});',
			'it.fails("fails", () => {});',
			'it.runIf(true)("running", () => {});',
			'it.skipIf(false)("not skipped", () => {});',
			'nodeIt("node", () => {});',
		].join("\n");
		expect(totals(text).cases).toBe(10);
	});

	it("excludes skipped, todo and literal-false conditional cases", () => {
		const text = [
			'import { it, test } from "vitest";',
			'it.skip("skip", () => {});',
			'test.todo("todo");',
			'it.skipIf(true)("skip if", () => {});',
			'it.runIf(false)("run if", () => {});',
		].join("\n");
		expect(totals(text).cases).toBe(0);
	});

	it("ignores a local it that shadows the Vitest import", () => {
		const text = [
			'import { it } from "vitest";',
			"{",
			"  const it = () => {};",
			'  it("local", () => {});',
			"}",
		].join("\n");
		expect(totals(text).cases).toBe(0);
	});

	it("counts expect, soft, poll and aliases without counting helpers", () => {
		const text = [
			'import { expect } from "vitest";',
			'import { expect as verify } from "vitest";',
			"expect(value).toBe(true);",
			"expect.soft(value).toBe(true);",
			"expect.poll(read).toBe(true);",
			"verify(value);",
			"expect.assertions(1);",
			"expect.hasAssertions();",
		].join("\n");
		expect(totals(text).expects).toBe(4);
	});

	it("ignores a local expect that shadows the Vitest import", () => {
		const text = [
			'import { expect } from "vitest";',
			"{",
			"  const expect = () => {};",
			"  expect(value);",
			"}",
		].join("\n");
		expect(totals(text).expects).toBe(0);
	});

	it("recognises .spec files the same way as describe callbacks", () => {
		expect(
			totals(
				'import { it } from "vitest";\nit("spec", () => {});',
				"case.spec.mjs",
			).cases,
		).toBe(1);
		expect(
			totals('import { it } from "vitest";\nit("source", () => {});', "case.ts")
				.cases,
		).toBe(0);
	});
});
