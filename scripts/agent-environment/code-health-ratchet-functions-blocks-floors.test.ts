import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
	expect as assert,
	afterEach as cleanupAfter,
	it as spec,
	describe as suite,
} from "vitest";
import { snapshotCodeHealth as snapshot } from "./code-health-baseline.mjs";
import {
	cleanupHealthFixtures,
	createHealthFixture,
} from "./code-health-fixture.ts";

cleanupAfter(cleanupHealthFixtures);

function longFunction(total: number, exception?: string) {
	const first = `function sample() {${exception ? ` // ${exception}` : ""}`;
	return [
		first,
		...Array.from({ length: total - 2 }, (_, index) => `void ${index};`),
		"}",
	].join("\n");
}

function testSource(name: string, skipped = false) {
	return [
		'import { it, expect } from "vitest";',
		`it${skipped ? ".skip" : ""}("${name}", () => {`,
		"\texpect(1).toBe(1);",
		"});",
	].join("\n");
}

function exception(measure: string, reason: string) {
	const until = new Date();
	until.setUTCDate(until.getUTCDate() + 10);
	return `code-health-exception: ${measure}; until=${until
		.toISOString()
		.slice(0, 10)}; reason=${reason}`;
}

const baselinePath = "docs/agent-context/CODE_HEALTH_BASELINE.json";

suite("long-function growth", () => {
	spec("refuses a new 90-line production function", () => {
		const fixture = createHealthFixture();
		fixture.write("scripts/clean.ts", "export const clean = true;\n");
		fixture.writeBaseline();
		fixture.commit("clean baseline");
		fixture.write("scripts/sample.ts", longFunction(90));

		const refused = fixture.runBaseline();
		assert(refused.status, refused.stdout).toBe(1);
		assert(refused.stderr).toContain(
			"scripts/sample.ts: longFunctionLines baseline=0 current=90",
		);
		const checked = fixture.runCheck();
		assert(checked.status, checked.stderr).toBe(1);
		assert(checked.stdout).toContain(
			"scripts/sample.ts: longFunctionLines baseline=0 current=90",
		);
	});

	spec("refuses a one-line increase in a long function", () => {
		const fixture = createHealthFixture();
		fixture.write("scripts/sample.ts", longFunction(90));
		fixture.writeBaseline();
		fixture.commit("long function baseline");
		fixture.write("scripts/sample.ts", longFunction(91));

		const checked = fixture.runCheck();
		assert(checked.status, checked.stderr).toBe(1);
		assert(checked.stdout).toContain(
			"scripts/sample.ts: longFunctionLines baseline=90 current=91",
		);
	});

	spec("writes a fall when a 90-line function becomes 80 lines", () => {
		const fixture = createHealthFixture();
		fixture.write("scripts/sample.ts", longFunction(90));
		fixture.writeBaseline();
		fixture.commit("long function baseline");
		fixture.write("scripts/sample.ts", longFunction(80));

		const baseline = fixture.writeBaseline();
		assert(
			baseline.files["scripts/sample.ts"]?.longFunctionLines,
		).toBeUndefined();
	});

	spec("keeps a length rise carrying its own exception line", () => {
		const fixture = createHealthFixture();
		const line = exception("longFunctionLines", "measured threshold");
		fixture.write("scripts/sample.ts", longFunction(90, line));
		fixture.writeBaseline();
		fixture.commit("excepted baseline");
		fixture.write("scripts/sample.ts", longFunction(91, line));

		const checked = fixture.runCheck();
		assert(checked.status, checked.stderr).toBe(0);
		assert(checked.stdout).toContain("PASS: code health");
	});
});

suite("empty blocks", () => {
	spec("refuses a new empty block in check and baseline", () => {
		const fixture = createHealthFixture();
		fixture.write("scripts/sample.ts", "export const clean = true;\n");
		fixture.writeBaseline();
		fixture.commit("clean baseline");
		fixture.write("scripts/sample.ts", "if (ready) {}\n");

		const refused = fixture.runBaseline();
		assert(refused.status, refused.stdout).toBe(1);
		assert(refused.stderr).toContain(
			"scripts/sample.ts: emptyBlocks baseline=0 current=1",
		);
		const checked = fixture.runCheck();
		assert(checked.status, checked.stderr).toBe(1);
		assert(checked.stdout).toContain(
			"scripts/sample.ts: emptyBlocks baseline=0 current=1",
		);
	});

	spec("keeps a new empty block with an exception on its line", () => {
		const fixture = createHealthFixture();
		fixture.write("scripts/sample.ts", "export const clean = true;\n");
		fixture.writeBaseline();
		fixture.commit("clean baseline");
		fixture.write(
			"scripts/sample.ts",
			`if (ready) {} // ${exception("emptyBlocks", "intentional")}\n`,
		);

		const checked = fixture.runCheck();
		assert(checked.status, checked.stderr).toBe(0);
		assert(checked.stdout).toContain("PASS: code health");
	});

	spec("writes a fall when the empty block is removed", () => {
		const fixture = createHealthFixture();
		fixture.write("scripts/sample.ts", "if (ready) {}\n");
		fixture.writeBaseline();
		fixture.commit("empty block baseline");
		fixture.write("scripts/sample.ts", "if (ready) run();\n");

		const baseline = fixture.writeBaseline();
		assert(baseline.files["scripts/sample.ts"]?.emptyBlocks).toBeUndefined();
	});
});

suite("directory test floors", () => {
	spec("aggregates direct files without folding descendants", () => {
		const result = snapshot(
			[
				{ file: "scripts/a.test.ts", text: testSource("a") },
				{ file: "scripts/b.test.ts", text: testSource("b") },
				{ file: "scripts/nested/c.test.ts", text: testSource("c") },
			],
			{ today: "2026-10-18" },
		);
		assert(result.directoryCounts?.scripts ?? {}).toEqual({
			testCases: 2,
			expectCalls: 2,
		});
		assert(result.directoryCounts?.["scripts/nested"] ?? {}).toEqual({
			testCases: 1,
			expectCalls: 1,
		});
	});

	spec("keeps same-directory rename and file movement unchanged", () => {
		const fixture = createHealthFixture();
		fixture.write("scripts/a.test.ts", testSource("one"));
		fixture.writeBaseline();
		fixture.commit("test floor baseline");
		fixture.git("mv", "scripts/a.test.ts", "scripts/b.test.ts");

		const renamed = fixture.runCheck();
		assert(renamed.status, renamed.stderr).toBe(0);
		assert(renamed.stdout).toContain("PASS: code health");
		fixture.write("scripts/b.test.ts", "");
		fixture.write("scripts/c.test.ts", testSource("one"));
		const moved = fixture.runCheck();
		assert(moved.status, moved.stderr).toBe(0);
		assert(moved.stdout).toContain("PASS: code health");
	});

	spec("refuses a skipped case and a deleted expectation", () => {
		const fixture = createHealthFixture();
		fixture.write("scripts/a.test.ts", testSource("one"));
		fixture.writeBaseline();
		fixture.commit("test floor baseline");
		fixture.write("scripts/a.test.ts", testSource("one", true));

		const skipped = fixture.runCheck();
		assert(skipped.status, skipped.stderr).toBe(1);
		assert(skipped.stdout).toContain("scripts: testCases baseline=1 current=0");

		fixture.write(
			"scripts/a.test.ts",
			[
				'import { it } from "vitest";',
				'it("one", () => {',
				"\tvoid 1;",
				"});",
			].join("\n"),
		);
		const deleted = fixture.runCheck();
		assert(deleted.status, deleted.stderr).toBe(1);
		assert(deleted.stdout).toContain(
			"scripts: expectCalls baseline=1 current=0",
		);
	});

	spec("writes a rise and gates a cross-directory fall", () => {
		const fixture = createHealthFixture();
		fixture.write("scripts/a.test.ts", testSource("one"));
		fixture.writeBaseline();
		fixture.commit("test floor baseline");
		fixture.write("scripts/b.test.ts", testSource("two"));

		const raised = fixture.writeBaseline();
		assert(raised.directories?.scripts ?? {}).toEqual({
			testCases: 2,
			expectCalls: 2,
		});
		const raisedCheck = fixture.runCheck();
		assert(raisedCheck.status, raisedCheck.stderr).toBe(0);
		assert(raisedCheck.stdout).toContain("PASS: code health");
		fixture.commit("raised floor");
		fixture.write("scripts/nested/.keep", "");
		fixture.git("mv", "scripts/a.test.ts", "scripts/nested/a.test.ts");
		fixture.git("rm", "scripts/b.test.ts");
		fixture.write("scripts/nested/a.test.ts", testSource("one"));

		const refused = fixture.runBaseline();
		assert(refused.status, refused.stdout).toBe(1);
		assert(refused.stderr).toContain("scripts: testCases baseline=2 current=0");
		fixture.write(
			"scripts/marker.test.ts",
			[
				`// ${exception("testCases", "directory move")}`,
				`// ${exception("expectCalls", "directory move")}`,
			].join("\n"),
		);
		const accepted = fixture.writeBaseline();
		assert(accepted.directories?.scripts).toBeUndefined();
		assert(accepted.directories?.["scripts/nested"] ?? {}).toEqual({
			testCases: 1,
			expectCalls: 1,
		});
		const acceptedBeforeCommit = fixture.runCheck();
		assert(acceptedBeforeCommit.status, acceptedBeforeCommit.stderr).toBe(0);
		assert(acceptedBeforeCommit.stdout).toContain("PASS: code health");
		fixture.commit("accepted directory move");
		const checked = fixture.runCheck();
		assert(checked.status, checked.stderr).toBe(0);
		assert(checked.stdout).toContain("PASS: code health");
	});

	spec("rejects a hand-lowered test floor before it is committed", () => {
		const fixture = createHealthFixture();
		fixture.write("scripts/a.test.ts", testSource("one"));
		fixture.writeBaseline();
		fixture.commit("test floor baseline");
		fixture.write("scripts/a.test.ts", 'import { it } from "vitest";\n');
		const working = JSON.parse(
			readFileSync(path.join(fixture.root, baselinePath), "utf8"),
		);
		delete working.directories.scripts;
		writeFileSync(
			path.join(fixture.root, baselinePath),
			`${JSON.stringify(working, null, "\t")}\n`,
			"utf8",
		);

		const checked = fixture.runCheck();
		assert(checked.status, checked.stderr).toBe(1);
		assert(checked.stdout).toContain(
			"working baseline inflation: scripts: testCases baseline=1 current=0",
		);
	});
});
