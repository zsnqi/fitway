import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
	cleanupHealthFixtures,
	createHealthFixture,
} from "./code-health-fixture.ts";

afterEach(cleanupHealthFixtures);

const stagedScript = fileURLToPath(
	new URL("./check-staged-giant-files.mjs", import.meta.url),
);
const baselinePath = "docs/agent-context/CODE_HEALTH_BASELINE.json";
const splitGuidance = [
	"  To split it: move code out by responsibility into a new module named for what it holds, and update its imports.",
	"  Never delete blank lines, comments or explanations.",
	"  Never join lines, because the formatter splits them again.",
	"  Then run pnpm code-health:baseline.",
].join("\n");

function giant(lines: number) {
	return Array.from(
		{ length: lines },
		(_, index) => `const giant${index} = ${index};`,
	).join("\n");
}

function committedGiant() {
	const fixture = createHealthFixture();
	fixture.write("scripts/giant.ts", giant(801));
	fixture.writeBaseline();
	fixture.commit("giant baseline");
	return fixture;
}

function runStaged(root: string) {
	return spawnSync(process.execPath, [stagedScript], {
		cwd: root,
		encoding: "utf8",
		windowsHide: true,
	});
}

describe("giant-file failures say how to split", () => {
	it("prints the split guidance after a giant file's rise in the check", () => {
		const fixture = committedGiant();
		fixture.write("scripts/giant.ts", giant(802));

		const checked = fixture.runCheck();
		expect(checked.status, checked.stderr).toBe(1);
		expect(checked.stdout).toContain(
			`scripts/giant.ts: giantFiles baseline=801 current=802; hits: 1; run pnpm code-health:baseline\n${splitGuidance}\n`,
		);
	});

	it("prints the split guidance after a giant file's working-baseline inflation", () => {
		const fixture = committedGiant();
		fixture.write("scripts/giant.ts", giant(802));
		const target = path.join(fixture.root, baselinePath);
		const baseline = JSON.parse(readFileSync(target, "utf8"));
		baseline.files["scripts/giant.ts"].giantFiles = 802;
		writeFileSync(target, `${JSON.stringify(baseline, null, "\t")}\n`);

		const checked = fixture.runCheck();
		expect(checked.status, checked.stderr).toBe(1);
		expect(checked.stdout).toContain(
			`working baseline inflation: scripts/giant.ts: giantFiles baseline=801 current=802; run pnpm code-health:baseline\n${splitGuidance}\n`,
		);
	});

	it("prints the split guidance after the baseline writer refuses a giant file's rise", () => {
		const fixture = committedGiant();
		fixture.write("scripts/giant.ts", giant(802));

		const refused = fixture.runBaseline();
		expect(refused.status, refused.stdout).toBe(1);
		expect(refused.stderr).toContain(
			`scripts/giant.ts: giantFiles baseline=801 current=802\n${splitGuidance}\n`,
		);
	});

	it("prints no split guidance after a failure on another measure", () => {
		const fixture = committedGiant();
		fixture.write("scripts/giant.ts", giant(802));
		fixture.write("scripts/escape.ts", "const value: any = 1;\n");
		const guidanceCount = (text: string) =>
			text.split("Never join lines").length - 1;

		const checked = fixture.runCheck();
		expect(checked.status, checked.stderr).toBe(1);
		expect(checked.stdout).toContain(
			"scripts/escape.ts: typeEscapes baseline=0 current=1; hits: 1; run pnpm code-health:baseline\nscripts/giant.ts: giantFiles",
		);
		expect(guidanceCount(checked.stdout)).toBe(1);
		const refused = fixture.runBaseline();
		expect(refused.status, refused.stdout).toBe(1);
		expect(refused.stderr).toContain(
			"scripts/escape.ts: typeEscapes baseline=0 current=1\nscripts/giant.ts: giantFiles",
		);
		expect(guidanceCount(refused.stderr)).toBe(1);
	});
});

describe("pre-commit giant-file check on staged content", () => {
	it("fails on a staged giant file whose working copy was then shortened", () => {
		const fixture = committedGiant();
		fixture.write("scripts/giant.ts", giant(802));
		fixture.git("add", "scripts/giant.ts");
		fixture.write("scripts/giant.ts", giant(801));

		const staged = runStaged(fixture.root);
		expect(staged.status, staged.stderr).toBe(1);
		expect(staged.stdout).toContain(
			`scripts/giant.ts: giantFiles baseline=801 current=802; hits: 1; run pnpm code-health:baseline\n${splitGuidance}\n`,
		);
	});

	it("passes a staged giant file at its baseline whose working copy then grew", () => {
		const fixture = committedGiant();
		fixture.write("scripts/giant.ts", `${giant(801)}\n// staged comment`);
		fixture.git("add", "scripts/giant.ts");
		fixture.write("scripts/giant.ts", giant(900));

		const staged = runStaged(fixture.root);
		expect(staged.status, `${staged.stdout}\n${staged.stderr}`).toBe(0);
		expect(staged.stdout).not.toContain("giantFiles");
	});

	it("fails on a new staged giant file", () => {
		const fixture = committedGiant();
		fixture.write("scripts/second.ts", giant(801));
		fixture.git("add", "scripts/second.ts");

		const staged = runStaged(fixture.root);
		expect(staged.status, staged.stderr).toBe(1);
		expect(staged.stdout).toContain(
			`scripts/second.ts: giantFiles baseline=0 current=801; hits: 1; run pnpm code-health:baseline\n${splitGuidance}\n`,
		);
	});
});
