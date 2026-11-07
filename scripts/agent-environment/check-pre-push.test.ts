import { describe, expect, it } from "vitest";
import { pushedRefProblem, workingTreeProblem } from "./check-pre-push.mjs";

const head = "a".repeat(40);

describe("pre-push checkout guard", () => {
	it("accepts a clean tracked working tree", () => {
		expect(workingTreeProblem("")).toBeNull();
	});

	it("refuses staged or modified tracked files with one commit-or-stash line", () => {
		for (const status of ["M  file.ts\n", " M file.ts\n", "D  file.ts\n"]) {
			const problem = workingTreeProblem(status);
			expect(problem).toContain("commit or stash tracked changes first");
			expect(problem?.split("\n")).toHaveLength(1);
		}
	});

	it("accepts refs at HEAD and lets a deleted ref through", () => {
		expect(
			pushedRefProblem(
				`refs/heads/tooling-ci-speed ${head} refs/heads/tooling-ci-speed ${"b".repeat(40)}\n(delete) ${"0".repeat(40)} refs/heads/old ${head}`,
				head,
			),
		).toBeNull();
	});

	it("names a pushed local ref that is not HEAD", () => {
		const problem = pushedRefProblem(
			`refs/heads/other ${"b".repeat(40)} refs/heads/other ${"c".repeat(40)}`,
			head,
		);
		expect(problem).toContain("refs/heads/other");
		expect(problem?.split("\n")).toHaveLength(1);
	});
});
