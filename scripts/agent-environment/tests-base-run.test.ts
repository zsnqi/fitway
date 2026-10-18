import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	type BaseRunFixtureSpec,
	createBaseRunFixture,
	judgedClasses,
	runBase,
} from "./tests-base-run-fixture";

const fixtures: Array<ReturnType<typeof createBaseRunFixture>> = [];

afterEach(() => {
	for (const fixture of fixtures.splice(0)) fixture.cleanup();
});

function fixture(spec: BaseRunFixtureSpec) {
	const created = createBaseRunFixture(spec);
	fixtures.push(created);
	return created;
}

const valueTest = (expected: number) => `import { expect, it } from "vitest";
import { value } from "../src/value";

it("returns the result", () => {
	expect(value()).toBe(${expected});
});
`;

describe("tests:base-run selection", () => {
	it("classifies a changed assertion against the base production code", () => {
		const test = fixture({
			baseFiles: {
				"src/value.ts": "export const value = () => 1;\n",
				"tests/value.test.ts": valueTest(1),
			},
			resultFiles: {
				"src/value.ts": "export const value = () => 2;\n",
				"tests/value.test.ts": valueTest(2),
			},
		});
		const before = test.git("status", "--short");
		const result = runBase(test);
		expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
		expect(result.stdout).toMatch(
			/^assertion tests\/value\.test\.ts > returns the result: AssertionError:/m,
		);
		expect(result.stdout).toContain("result-file tests/value.test.ts");
		expect(result.stdout).not.toContain("result-file src/value.ts");
		expect(test.git("status", "--short")).toBe(before);
		expect(readdirSync(path.join(test.root, "node_modules", ".cache"))).toEqual(
			[],
		);
	});

	it("defaults --result to HEAD", () => {
		const test = fixture({
			baseFiles: {
				"src/value.ts": "export const value = () => 1;\n",
				"tests/value.test.ts": valueTest(1),
			},
			resultFiles: { "tests/value.test.ts": valueTest(2) },
		});
		const result = test.run(["--base", test.base]);
		expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
		expect(result.stdout).toMatch(
			/^assertion tests\/value\.test\.ts > returns the result: AssertionError:/m,
		);
	});

	it("classifies a changed test that still passes on the base", () => {
		const test = fixture({
			baseFiles: {
				"src/value.ts": "export const value = () => 1;\n",
				"tests/value.test.ts": valueTest(1),
			},
			resultFiles: {
				"tests/value.test.ts": valueTest(1).replace(
					".toBe(1)",
					'.toBe(1, "changed expectation")',
				),
			},
		});
		const result = runBase(test);
		expect(result.status).toBe(1);
		expect(result.stdout).toMatch(
			/^green-on-base tests\/value\.test\.ts > returns the result:$/m,
		);
	});

	it("classifies a TypeError before the assertion as the wrong reason", () => {
		const test = fixture({
			baseFiles: {
				"src/value.ts": "export const value = () => 1;\n",
				"tests/value.test.ts": valueTest(1),
			},
			resultFiles: {
				"tests/value.test.ts": `import { expect, it } from "vitest";
import { value } from "../src/value";

it("reads a property", () => {
	const result = value() as unknown as { missing: { deep: number } };
	expect(result.missing.deep).toBe(1);
});
`,
			},
		});
		const result = runBase(test);
		expect(result.status).toBe(1);
		expect(result.stdout).toMatch(
			/^wrong-reason tests\/value\.test\.ts > reads a property: TypeError:/m,
		);
	});

	it("lists an added module the base lacks as missing-module", () => {
		const test = fixture({
			baseFiles: {
				"src/value.ts": "export const value = () => 1;\n",
			},
			resultFiles: {
				"src/new-only.ts": "export const added = () => 2;\n",
				"tests/new-only.test.ts": `import { expect, it } from "vitest";
import { added } from "../src/new-only";

it("uses the added module", () => {
	expect(added()).toBe(2);
});
`,
			},
		});
		const result = runBase(test);
		expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
		expect(result.stdout).toMatch(
			/^missing-module tests\/new-only\.test\.ts > uses the added module: .+\(module: src\/new-only\.ts\)$/m,
		);
		expect(result.stdout).not.toContain("result-file src/new-only.ts");
	});

	it("applies a file-load failure to every judged test", () => {
		const test = fixture({
			baseFiles: {
				"src/value.ts": "export const value = () => 1;\n",
			},
			resultFiles: {
				"src/load-only.ts": "export const added = () => 2;\n",
				"tests/load-only.test.ts": `import { expect, it } from "vitest";
import { added } from "../src/load-only";

it("first judged test", () => expect(added()).toBe(2));
it("second judged test", () => expect(added()).toBe(2));
`,
			},
		});
		const result = runBase(test);
		expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
		expect(judgedClasses(result.stdout)).toEqual([
			"missing-module",
			"missing-module",
		]);
	});

	it("takes a changed test-support file and judges every importer test", () => {
		const test = fixture({
			baseFiles: {
				"src/value.ts": "export const value = () => 1;\n",
				"tests/value-fixture.ts": "export const expected = 1;\n",
				"tests/value.test.ts": `import { expect, it } from "vitest";
import { value } from "../src/value";
import { expected } from "./value-fixture";

it("first importer test", () => expect(value()).toBe(expected));
it("second importer test", () => expect(value()).toBe(expected));
`,
			},
			resultFiles: {
				"tests/value-fixture.ts": "export const expected = 2;\n",
			},
		});
		const result = runBase(test);
		expect(result.status, result.stdout).toBe(0);
		expect(result.stdout).toContain("result-file tests/value-fixture.ts");
		expect(judgedClasses(result.stdout)).toEqual(["assertion", "assertion"]);
	});

	it("reads static, export, dynamic, extensionless, and deleted imports", () => {
		const test = fixture({
			baseFiles: {
				"src/static.ts": "export const staticValue = () => 1;\n",
				"src/dynamic.ts": "export const dynamicValue = () => 1;\n",
				"src/extension.ts": "export const extensionValue = () => 1;\n",
				"src/deleted.mjs": "export const deletedValue = () => 1;\n",
			},
			resultFiles: {
				"src/deleted.mjs": null,
				"tests/static.test.ts": `import { expect, it } from "vitest";
import { staticValue } from "../src/static";
it("static import", () => expect(staticValue()).toBe(2));
`,
				"tests/export.test.ts": `import { expect, it } from "vitest";
export { staticValue as exportedValue } from "../src/static";
import { exportedValue } from "./export.test";
it("export from", () => expect(exportedValue()).toBe(2));
`,
				"tests/dynamic.test.ts": `import { expect, it } from "vitest";
it("dynamic import", async () => {
	const { dynamicValue } = await import("../src/dynamic");
	expect(dynamicValue()).toBe(2);
});
`,
				"tests/extension.test.ts": `import { expect, it } from "vitest";
import { extensionValue } from "../src/extension";
it("extensionless import", () => expect(extensionValue()).toBe(2));
`,
				"tests/deleted.test.ts": `import { expect, it } from "vitest";
import { deletedValue } from "../src/deleted.mjs";
it("imports a deleted module from the base", () => expect(deletedValue()).toBe(1));
`,
			},
		});
		const result = runBase(test);
		expect(result.status).toBe(1);
		expect(judgedClasses(result.stdout).sort()).toEqual([
			"assertion",
			"assertion",
			"assertion",
			"assertion",
			"green-on-base",
		]);
	});
});

describe("tests:base-run test discovery", () => {
	it("finds nested, table, template, duplicate, skipped, todo, and only tests", () => {
		const test = fixture({
			baseFiles: {
				"src/math.ts": "export const double = (value: number) => value * 2;\n",
			},
			resultFiles: {
				"tests/forms.test.ts": `import { describe, expect, it } from "vitest";
import { double } from "../src/math";

describe("outer", () => {
	it.each([{ input: 1, expected: 3 }])("doubles $input", ({ input, expected }) => {
		expect(double(input)).toBe(expected);
	});
	it(\`names \${1}\`, () => expect(1).toBe(2));
	it("same title", () => expect(1).toBe(2));
	it("same title", () => expect(1).toBe(2));
	it.skip("skipped test", () => expect(1).toBe(2));
	it.todo("todo test");
});
`,
				"tests/only.test.ts": `import { expect, it } from "vitest";
it.only("selected test", () => expect(1).toBe(2));
it("filtered test", () => expect(1).toBe(2));
`,
			},
		});
		const result = runBase(test);
		expect(result.status, result.stdout).toBe(0);
		expect(
			judgedClasses(result.stdout).filter((value) => value === "assertion"),
		).toHaveLength(5);
		expect(result.stdout).toMatch(
			/^skipped tests\/forms\.test\.ts > outer skipped test/m,
		);
		expect(result.stdout).toMatch(
			/^skipped tests\/forms\.test\.ts > outer todo test/m,
		);
		expect(result.stdout).toMatch(
			/^skipped tests\/only\.test\.ts > filtered test/m,
		);
	});

	it("judges one added duplicate title without blaming the existing duplicate", () => {
		const test = fixture({
			baseFiles: {
				"src/math.ts": "export const double = (value: number) => value * 2;\n",
				"tests/duplicate.test.ts": `import { expect, it } from "vitest";
import { double } from "../src/math";
it("same title", () => expect(double(1)).toBe(2));
`,
			},
			resultFiles: {
				"tests/duplicate.test.ts": `import { expect, it } from "vitest";
import { double } from "../src/math";
it("same title", () => expect(double(1)).toBe(2));
it("same title", () => expect(double(1)).toBe(3));
`,
			},
		});
		const result = runBase(test);
		expect(result.status, result.stdout).toBe(0);
		expect(result.stdout).toMatch(
			/^unchanged tests\/duplicate\.test\.ts > same title$/m,
		);
		expect(result.stdout).toMatch(
			/^assertion tests\/duplicate\.test\.ts > same title: AssertionError:/m,
		);
	});

	it("judges every test when top-level test code changes", () => {
		const test = fixture({
			baseFiles: {
				"src/value.ts": "export const value = () => 1;\n",
				"tests/table.test.ts": `import { expect, it } from "vitest";
import { value } from "../src/value";
const expected = 1;
it("first", () => expect(value()).toBe(expected));
it("second", () => expect(value()).toBe(expected));
`,
			},
			resultFiles: {
				"tests/table.test.ts": `import { expect, it } from "vitest";
import { value } from "../src/value";
const expected = 2;
it("first", () => expect(value()).toBe(expected));
it("second", () => expect(value()).toBe(expected));
`,
			},
		});
		const result = runBase(test);
		expect(result.status).toBe(0);
		expect(judgedClasses(result.stdout)).toEqual(["assertion", "assertion"]);
	});

	it("does not judge tests when only import declarations change", () => {
		const test = fixture({
			baseFiles: {
				"src/value.ts": "export const value = () => 1;\n",
				"tests/import-only.test.ts": `import { expect, it } from "vitest";
import { value as subject } from "../src/value";
it("still unchanged", () => expect(subject()).toBe(1));
`,
			},
			resultFiles: {
				"tests/import-only.test.ts": `import { expect, it } from "vitest";
import {
	value as subject
} from "../src/value";
it("still unchanged", () => expect(subject()).toBe(1));
`,
			},
		});
		const result = runBase(test);
		expect(result.status).toBe(0);
		expect(judgedClasses(result.stdout)).toEqual([]);
		expect(result.stdout).toMatch(
			/^unchanged tests\/import-only\.test\.ts > still unchanged$/m,
		);
	});

	it("matches a renamed test file to its base path", () => {
		const content = `import { expect, it } from "vitest";
import { value } from "../src/value";
it("survives a rename", () => expect(value()).toBe(1));
`;
		const test = fixture({
			baseFiles: {
				"src/value.ts": "export const value = () => 1;\n",
				"tests/old-name.test.ts": content,
			},
			resultFiles: {
				"tests/old-name.test.ts": null,
				"tests/new-name.test.ts": content,
			},
		});
		const result = runBase(test);
		expect(result.status).toBe(0);
		expect(judgedClasses(result.stdout)).toEqual([]);
		expect(result.stdout).toMatch(
			/^unchanged tests\/new-name\.test\.ts > survives a rename$/m,
		);
	});

	it("judges a runner-reported test whose source call is in test support", () => {
		const test = fixture({
			baseFiles: {
				"src/value.ts": "export const value = () => 1;\n",
				"tests/runtime.test.ts": `import "./runtime-fixture";
`,
			},
			resultFiles: {
				"tests/runtime-fixture.ts": `import { expect, it } from "vitest";
import { value } from "../src/value";
it("runtime-generated", () => expect(value()).toBe(2));
`,
			},
		});
		const result = runBase(test);
		expect(result.status).toBe(0);
		expect(result.stdout).toMatch(
			/^assertion tests\/runtime\.test\.ts > runtime-generated: AssertionError:/m,
		);
	});

	it("lists browser and integration changes as not-run", () => {
		const test = fixture({
			baseFiles: { "src/value.ts": "export const value = () => 1;\n" },
			resultFiles: {
				"tests/browser/value.browser.spec.ts": "export {};\n",
				"tests/value.integration.test.ts": "export {};\n",
			},
		});
		const result = runBase(test);
		expect(result.status).toBe(0);
		expect(result.stdout).toContain(
			"not-run tests/browser/value.browser.spec.ts: browser test outside the fast ladder",
		);
		expect(result.stdout).toContain(
			"not-run tests/value.integration.test.ts: integration test outside the fast Vitest config",
		);
	});

	it("classifies a changed node --test assertion", () => {
		const nodeTest = (
			expected: number,
		) => `import assert from "node:assert/strict";
import test from "node:test";
import { value } from "../../../src/value.mjs";
test("node value", () => assert.equal(value(), ${expected}));
`;
		const test = fixture({
			baseFiles: {
				"src/value.mjs": "export const value = () => 1;\n",
				".agents/skills/verify-fitway/value.test.mjs": nodeTest(1),
			},
			resultFiles: {
				".agents/skills/verify-fitway/value.test.mjs": nodeTest(2),
			},
		});
		const result = runBase(test);
		expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
		expect(result.stdout).toMatch(
			/^assertion \.agents\/skills\/verify-fitway\/value\.test\.mjs > node value: AssertionError:/m,
		);
	});

	it("re-runs a timeout once and reports the wrong reason when it repeats", () => {
		const timeoutConfig = `import { defineConfig } from "vitest/config";
export default defineConfig({ test: { testTimeout: 100 } });
`;
		const test = fixture({
			baseFiles: {
				"src/value.ts": "export const value = () => 1;\n",
				"tests/slow.test.ts": valueTest(1),
				"vitest.config.ts": timeoutConfig,
			},
			resultFiles: {
				"tests/slow.test.ts": `import { expect, it } from "vitest";
import { value } from "../src/value";
it("returns the result", async () => {
	await new Promise((resolve) => setTimeout(resolve, 400));
	expect(value()).toBe(2);
});
`,
			},
		});
		const result = runBase(test);
		expect(result.status).toBe(1);
		expect(result.stdout).toMatch(
			/^wrong-reason tests\/slow\.test\.ts > returns the result: .+\(timeout\)$/m,
		);
	});
});

describe("tests:base-run refusals", () => {
	it("refuses a missing --base with the contract line", () => {
		const test = fixture({
			baseFiles: { "src/value.ts": "export const value = () => 1;\n" },
			resultFiles: {},
		});
		const result = test.run([]);
		expect(result.status).toBe(1);
		expect(result.stderr).toBe(
			"tests:base-run: FAIL: missing required option --base (run pnpm tests:base-run --base <ref> [--result <ref>])\n",
		);
	});

	it("refuses a base ref that names no commit", () => {
		const test = fixture({
			baseFiles: { "src/value.ts": "export const value = () => 1;\n" },
			resultFiles: {},
		});
		const result = test.run(["--base", "no-such-ref", "--result", test.result]);
		expect(result.status).toBe(1);
		expect(result.stderr).toBe(
			"tests:base-run: FAIL: --base does not name a commit: no-such-ref (pass an existing commit; run pnpm tests:base-run --base <ref> [--result <ref>])\n",
		);
	});

	it("refuses a result ref that names no commit", () => {
		const test = fixture({
			baseFiles: { "src/value.ts": "export const value = () => 1;\n" },
			resultFiles: {},
		});
		const result = test.run(["--base", test.base, "--result", "no-such-ref"]);
		expect(result.status).toBe(1);
		expect(result.stderr).toBe(
			"tests:base-run: FAIL: --result does not name a commit: no-such-ref (pass an existing commit; run pnpm tests:base-run --base <ref> [--result <ref>])\n",
		);
	});

	it("refuses a base that is not an ancestor of the result", () => {
		const test = fixture({
			baseFiles: { "src/value.ts": "export const value = () => 1;\n" },
			resultFiles: { "src/result.ts": "export const result = 1;\n" },
		});
		test.git("checkout", "--quiet", "--detach", test.base);
		writeFileSync(
			path.join(test.root, "src", "side.ts"),
			"export const side = 1;\n",
		);
		test.git("add", ".");
		test.git("commit", "--quiet", "-m", "side");
		const side = test.git("rev-parse", "HEAD");
		const result = test.run(["--base", side, "--result", test.result]);
		expect(result.status).toBe(1);
		expect(result.stderr).toBe(
			`tests:base-run: FAIL: base ${side} is not an ancestor of result ${test.result} (pass an ancestor with --base; run pnpm tests:base-run --base <ref> [--result <ref>])\n`,
		);
	});

	it("refuses a checkout without node_modules", () => {
		const test = fixture({
			baseFiles: { "src/value.ts": "export const value = () => 1;\n" },
			resultFiles: {},
			installMarker: false,
		});
		const result = test.run(["--base", test.base, "--result", test.result]);
		expect(result.status).toBe(1);
		expect(result.stderr).toBe(
			"tests:base-run: FAIL: checkout has no node_modules (run pnpm install in this checkout first)\n",
		);
	});
});

describe("tests:base-run ordinary paths", () => {
	it("prints both commits when the diff has no test changes", () => {
		const test = fixture({
			baseFiles: { "src/value.ts": "export const value = () => 1;\n" },
			resultFiles: { "src/value.ts": "export const value = () => 2;\n" },
		});
		const result = runBase(test);
		expect(result.status).toBe(0);
		expect(result.stdout.trim()).toBe(
			`tests:base-run: no test changes between ${test.base} and ${test.result}`,
		);
	});

	it("prints the registered help for a checkout", () => {
		const test = fixture({
			baseFiles: { "src/value.ts": "export const value = () => 1;\n" },
			resultFiles: {},
		});
		const result = test.run(["--help"]);
		expect(result.status).toBe(0);
		expect(result.stdout).toContain(
			"Usage: pnpm tests:base-run --base <ref> [--result <ref>]",
		);
		expect(result.stdout).toContain("--base <value>");
		expect(result.stdout).toContain("--result <value>");
	});
});
