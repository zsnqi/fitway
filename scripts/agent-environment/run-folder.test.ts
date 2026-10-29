import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	cleanupHealthFixtures,
	runGit,
	temporaryRepository,
} from "./code-health-fixture.ts";
import { createRunFolder } from "./run-folder.mjs";

afterEach(cleanupHealthFixtures);

function fixture() {
	const { root, repository } = temporaryRepository(
		"fitway-run-folder-",
		"run-folder@example.invalid",
	);
	const brief = path.join(repository, "brief.md");
	writeFileSync(brief, "# Fixture round\n\nBody\n");
	runGit(repository, ["add", "."]);
	runGit(repository, ["commit", "-qm", "brief"]);
	return {
		root,
		repository,
		brief,
		git: (args: string[]) => runGit(repository, args),
	};
}

describe("run-folder:new", () => {
	it("copies the brief and records the checkout, owner, and report", () => {
		const f = fixture();
		const tempRoot = path.join(f.root, "temp");
		const createdAt = new Date("2026-10-28T12:34:56.000Z");
		const result = createRunFolder({
			name: "coordinator-round",
			brief: "brief.md",
			for: "coordinator",
			root: f.repository,
			tempRoot,
			now: () => createdAt,
		});
		expect(result.folder).toBe(path.join(tempRoot, "coordinator-round"));
		expect(readFileSync(path.join(result.folder, "BRIEF.md"), "utf8")).toBe(
			readFileSync(f.brief, "utf8"),
		);
		const manifest = JSON.parse(
			readFileSync(path.join(result.folder, "manifest.json"), "utf8"),
		);
		expect(manifest).toMatchObject({
			worktree: f.repository,
			commit: f.git(["rev-parse", "HEAD"]),
			branch: f.git(["rev-parse", "--abbrev-ref", "HEAD"]),
			createdAt: createdAt.toISOString(),
			for: "coordinator",
			briefPath: f.brief.replaceAll("\\", "/"),
			report: path.join(result.folder, "REPORT.md"),
		});
		expect(manifest.briefSha256).toMatch(/^[a-f0-9]{64}$/);
	});

	it("records a custom report path", () => {
		const f = fixture();
		const result = createRunFolder({
			name: "custom-report",
			brief: f.brief,
			for: "subagent",
			report: "notes/report.md",
			root: f.repository,
			tempRoot: path.join(f.root, "temp"),
		});
		expect(result.manifest.report).toBe(
			path.join(result.folder, "notes/report.md"),
		);
	});

	it("refuses an existing run folder without changing it", () => {
		const f = fixture();
		const tempRoot = path.join(f.root, "temp");
		const folder = path.join(tempRoot, "already-there");
		mkdirSync(folder, { recursive: true });
		writeFileSync(path.join(folder, "keep.txt"), "keep\n");
		expect(() =>
			createRunFolder({
				name: "already-there",
				brief: f.brief,
				for: "coordinator",
				root: f.repository,
				tempRoot,
			}),
		).toThrow(/run folder already exists/);
		expect(readFileSync(path.join(folder, "keep.txt"), "utf8")).toBe("keep\n");
		expect(existsSync(path.join(folder, "manifest.json"))).toBe(false);
	});
});
