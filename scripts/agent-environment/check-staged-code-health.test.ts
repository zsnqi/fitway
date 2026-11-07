import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
	cleanupHealthFixtures,
	createHealthFixture,
} from "./code-health-fixture.ts";

const repository = fileURLToPath(new URL("../../", import.meta.url));
const stagedCheck = path.join(
	repository,
	"scripts/agent-environment/check-staged-giant-files.mjs",
);
const baselinePath = "docs/agent-context/CODE_HEALTH_BASELINE.json";

afterEach(cleanupHealthFixtures);

function sourceLines(count: number) {
	return Array.from(
		{ length: count },
		(_, index) => `const giant${index} = ${index};`,
	).join("\n");
}

function runStagedCheck(root: string) {
	return spawnSync(process.execPath, [stagedCheck], {
		cwd: root,
		encoding: "utf8",
		windowsHide: true,
	});
}

function indexedBaseline(root: string) {
	const shown = spawnSync("git", ["show", `:${baselinePath}`], {
		cwd: root,
		encoding: "utf8",
		windowsHide: true,
	});
	expect(shown.status, shown.stderr).toBe(0);
	return JSON.parse(shown.stdout);
}

describe("staged code-health baseline falls", () => {
	it("locks a smaller staged file into the baseline before commit", () => {
		const fixture = createHealthFixture();
		const file = "scripts/giant.ts";
		fixture.write(file, sourceLines(901));
		fixture.writeBaseline();
		fixture.commit("giant baseline");

		fixture.write(file, sourceLines(900));
		fixture.git("add", file);
		const checked = runStagedCheck(fixture.root);

		expect(checked.status, checked.stderr).toBe(0);
		expect(checked.stdout).toContain("baseline=901 current=900");
		expect(checked.stderr).toBe("");
		expect(indexedBaseline(fixture.root).files[file]).toEqual({
			giantFiles: 900,
		});
		expect(
			JSON.parse(readFileSync(path.join(fixture.root, baselinePath), "utf8"))
				.files[file],
		).toEqual({ giantFiles: 900 });

		fixture.git("commit", "-qm", "shrink giant");
		const health = fixture.runCheck();
		expect(health.status, `${health.stdout}\n${health.stderr}`).toBe(0);
		expect(health.stdout).toContain("PASS: code health");
	});

	it("uses staged bytes when the working file grows after staging", () => {
		const fixture = createHealthFixture();
		const file = "scripts/giant.ts";
		fixture.write(file, sourceLines(901));
		fixture.writeBaseline();
		fixture.commit("giant baseline");

		fixture.write(file, sourceLines(900));
		fixture.git("add", file);
		fixture.write(file, sourceLines(1000));
		const checked = runStagedCheck(fixture.root);

		expect(checked.status, checked.stderr).toBe(0);
		expect(indexedBaseline(fixture.root).files[file]).toEqual({
			giantFiles: 900,
		});
	});

	it("removes deleted and moved source paths and measures the moved path", () => {
		const fixture = createHealthFixture();
		const deleted = "scripts/deleted.ts";
		const moved = "scripts/moved.ts";
		fixture.write(deleted, sourceLines(801));
		fixture.write(moved, sourceLines(802));
		fixture.writeBaseline();
		fixture.commit("source baseline");

		fixture.git("rm", deleted);
		fixture.git("mv", moved, "scripts/renamed.ts");
		const checked = runStagedCheck(fixture.root);
		const baseline = indexedBaseline(fixture.root);

		expect(checked.status, checked.stderr).toBe(0);
		expect(baseline.files[deleted]).toBeUndefined();
		expect(baseline.files[moved]).toBeUndefined();
		expect(baseline.files["scripts/renamed.ts"]).toEqual({
			giantFiles: 802,
		});
	});

	it("locks a smaller staged giant document into the baseline", () => {
		const fixture = createHealthFixture();
		const file = "docs/giant.md";
		fixture.write(file, `# Giant\n\n${"x".repeat(40_100)}\n`);
		fixture.writeBaseline();
		fixture.commit("document baseline");

		fixture.write(file, `# Giant\n\n${"x".repeat(40_050)}\n`);
		fixture.git("add", file);
		const checked = runStagedCheck(fixture.root);

		expect(checked.status, checked.stderr).toBe(0);
		expect(indexedBaseline(fixture.root).files[file]).toEqual({
			giantDocuments: 40_060,
		});
	});

	it("still refuses a staged rise and leaves the baseline unchanged", () => {
		const fixture = createHealthFixture();
		const file = "scripts/giant.ts";
		fixture.write(file, sourceLines(801));
		fixture.writeBaseline();
		fixture.commit("giant baseline");

		fixture.write(file, sourceLines(802));
		fixture.git("add", file);
		const checked = runStagedCheck(fixture.root);

		expect(checked.status, checked.stderr).toBe(1);
		expect(checked.stdout).toContain(
			"scripts/giant.ts: giantFiles baseline=801 current=802",
		);
		expect(indexedBaseline(fixture.root).files[file]).toEqual({
			giantFiles: 801,
		});
	});
});
