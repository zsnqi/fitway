import { describe, expect, it } from "vitest";
import { scanScope } from "./code-health.mjs";

const body = Array.from(
	{ length: 80 },
	(_, index) => `    void ${index};`,
).join("\n");
const arrow = `() => {\n${body}\n}`;
const functionExpression = `function () {\n${body}\n}`;
const standardImport =
	'import { describe, it, test, beforeAll, beforeEach, afterEach, afterAll } from "vitest";';
const aliasImport =
	'import { describe as suite, it, test, beforeAll, beforeEach, afterEach, afterAll } from "vitest";';

function fixture(header: string, ...calls: string[]) {
	return [header, ...calls].join("\n");
}

function longFunctionTotal(text: string, file = "suite.test.ts") {
	return scanScope([{ file, text }]).longFunctions.total;
}

function suiteFixture(call: string) {
	return fixture(aliasImport, `suite("suite", ${arrow});`, call);
}

describe("C2 Vitest describe callbacks are not long functions", () => {
	it.each([
		[
			"C2 direct describe with an arrow",
			"direct.test.ts",
			fixture(
				standardImport,
				`describe("suite", ${arrow});`,
				`it("case", ${arrow});`,
			),
		],
		[
			"C2 describe with options and a function expression",
			"options.test.ts",
			fixture(
				standardImport,
				`describe("suite", { timeout: 1000 }, ${functionExpression});`,
				`it("case", ${arrow});`,
			),
		],
		[
			"C2 describe.each",
			"each.test.ts",
			fixture(
				standardImport,
				`describe.each([["case"]])("suite", ${arrow});`,
				`it("case", ${arrow});`,
			),
		],
		[
			"C2 describe.sequential",
			"sequential.test.ts",
			fixture(
				standardImport,
				`describe.sequential("suite", ${arrow});`,
				`it("case", ${arrow});`,
			),
		],
		[
			"C2 describe.concurrent",
			"concurrent.test.ts",
			fixture(
				standardImport,
				`describe.concurrent("suite", ${arrow});`,
				`it("case", ${arrow});`,
			),
		],
		[
			"C2 describe.skip",
			"skip.test.ts",
			fixture(
				standardImport,
				`describe.skip("suite", ${arrow});`,
				`it("case", ${arrow});`,
			),
		],
		[
			"C2 describe.only",
			"only.test.ts",
			fixture(
				standardImport,
				`describe.only("suite", ${arrow});`,
				`it("case", ${arrow});`,
			),
		],
		[
			"C2 describe.todo",
			"todo.test.ts",
			fixture(
				standardImport,
				`describe.todo("suite", ${arrow});`,
				`it("case", ${arrow});`,
			),
		],
		[
			"C2 describe.skipIf",
			"skip-if.test.ts",
			fixture(
				standardImport,
				`describe.skipIf(condition)("suite", ${arrow});`,
				`it("case", ${arrow});`,
			),
		],
		[
			"C2 describe.runIf",
			"run-if.test.ts",
			fixture(
				standardImport,
				`describe.runIf(condition)("suite", ${arrow});`,
				`it("case", ${arrow});`,
			),
		],
		[
			"C2 describe.sequential.each",
			"sequential-each.test.ts",
			fixture(
				standardImport,
				`describe.sequential.each([["case"]])("suite", ${arrow});`,
				`it("case", ${arrow});`,
			),
		],
		[
			"C2 accepts an aliased Vitest import",
			"alias.spec.mjs",
			fixture(
				aliasImport,
				`suite("suite", ${arrow});`,
				`it("case", ${arrow});`,
			),
		],
		[
			"C2 accepts a multiline Vitest import",
			"multiline.test.ts",
			fixture(
				["import {", "  describe as suite,", "  it,", '} from "vitest";'].join(
					"\n",
				),
				`suite("suite", ${arrow});`,
				`it("case", ${arrow});`,
			),
		],
	])("%s", (_name, file, text) => {
		expect(longFunctionTotal(text, file)).toBe(1);
	});

	it.each([
		["C2 still counts it", suiteFixture(`it("case", ${arrow});`)],
		["C2 still counts test", suiteFixture(`test("case", ${arrow});`)],
		[
			"C2 still counts it.each",
			suiteFixture(`it.each([["case"]])("case", ${arrow});`),
		],
		["C2 still counts test.only", suiteFixture(`test.only("case", ${arrow});`)],
		["C2 still counts beforeAll", suiteFixture(`beforeAll(${arrow});`)],
		["C2 still counts beforeEach", suiteFixture(`beforeEach(${arrow});`)],
		["C2 still counts afterEach", suiteFixture(`afterEach(${arrow});`)],
		["C2 still counts afterAll", suiteFixture(`afterAll(${arrow});`)],
		[
			"C2 still counts another call",
			suiteFixture(`register("case", ${arrow});`),
		],
	])("%s", (_name, text) => {
		expect(longFunctionTotal(text)).toBe(1);
	});

	it("C2 still counts a helper declared inside a suite", () => {
		const text = fixture(
			aliasImport,
			[
				`suite("suite", () => {`,
				"  function helper() {",
				body,
				"  }",
				"  helper();",
				"});",
			].join("\n"),
		);
		expect(longFunctionTotal(text)).toBe(1);
	});

	it("C2 still counts a locally defined describe", () => {
		const text = fixture(
			aliasImport,
			"function describe(_name: string, callback: () => void) { callback(); }",
			`suite("suite", ${arrow});`,
			`describe("local", ${arrow});`,
		);
		expect(longFunctionTotal(text)).toBe(1);
	});

	it("C2 still counts describe imported from another module", () => {
		const text = fixture(
			aliasImport,
			'import { describe as otherDescribe } from "./other.js";',
			`suite("suite", ${arrow});`,
			`otherDescribe("other", ${arrow});`,
		);
		expect(longFunctionTotal(text)).toBe(1);
	});

	it("C2 still counts an object's describe method", () => {
		const text = fixture(
			aliasImport,
			"const schema = { describe(_name: string, callback: () => void) { callback(); } };",
			`suite("suite", ${arrow});`,
			`schema.describe("schema", ${arrow});`,
		);
		expect(longFunctionTotal(text)).toBe(1);
	});

	it("C2 still counts a production function named describe", () => {
		const production = fixture(
			"function describe(callback: () => void) { callback(); }",
			`describe(${arrow});`,
		);
		const result = scanScope([
			{ file: "src/describe.ts", text: production },
			{ file: "suite.test.ts", text: suiteFixture("") },
		]);
		expect(result.longFunctions.total).toBe(1);
	});
});
