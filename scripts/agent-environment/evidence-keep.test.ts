import {
	existsSync,
	mkdirSync,
	readFileSync,
	truncateSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	cleanupHealthFixtures,
	runGit,
	temporaryRepository,
} from "./code-health-fixture.ts";
import { keepEvidence } from "./evidence-keep.mjs";

afterEach(cleanupHealthFixtures);

function repository() {
	const { root, repository } = temporaryRepository(
		"fitway-evidence-",
		"evidence@example.invalid",
	);
	return { root, repo: repository };
}

function write(root: string, relative: string, bytes: string | Buffer) {
	const target = path.join(root, relative);
	mkdirSync(path.dirname(target), { recursive: true });
	writeFileSync(target, bytes);
	return target;
}

function failure(run: () => unknown) {
	try {
		run();
	} catch (error) {
		return error instanceof Error ? error.message : String(error);
	}
	throw new Error("expected evidence:keep to refuse");
}

describe("evidence:keep", () => {
	it("copies a folder, records hashes, and stages the evidence", () => {
		const { root, repo } = repository();
		const source = path.join(root, "run");
		write(source, "REPORT.md", "verdict: pass\n");
		write(source, "logs/check.log", "one line\n");
		const result = keepEvidence({
			root: repo,
			inputs: [source],
			to: "agent-tooling-r01/evidence-home",
		});
		const destination = path.join(
			repo,
			"docs/phase-records/evidence/agent-tooling-r01/evidence-home",
		);
		expect(readFileSync(path.join(destination, "REPORT.md"), "utf8")).toBe(
			"verdict: pass\n",
		);
		expect(readFileSync(path.join(destination, "logs/check.log"), "utf8")).toBe(
			"one line\n",
		);
		const sources = readFileSync(path.join(destination, "SOURCES.md"), "utf8");
		expect(sources).toContain("REPORT.md");
		expect(sources).toContain("logs/check.log");
		expect(sources).toMatch(/[a-f0-9]{64}/);
		expect(result.destination).toBe(
			"docs/phase-records/evidence/agent-tooling-r01/evidence-home",
		);
		expect(
			runGit(repo, ["diff", "--cached", "--name-only"]).split(/\r?\n/).sort(),
		).toEqual(
			[
				"docs/phase-records/evidence/agent-tooling-r01/evidence-home/REPORT.md",
				"docs/phase-records/evidence/agent-tooling-r01/evidence-home/SOURCES.md",
				"docs/phase-records/evidence/agent-tooling-r01/evidence-home/logs/check.log",
			].sort(),
		);

		const before = {
			sources,
			index: runGit(repo, ["diff", "--cached", "--binary"]),
		};
		keepEvidence({
			root: repo,
			inputs: [source],
			to: "agent-tooling-r01/evidence-home",
		});
		expect(readFileSync(path.join(destination, "SOURCES.md"), "utf8")).toBe(
			before.sources,
		);
		expect(runGit(repo, ["diff", "--cached", "--binary"])).toBe(before.index);
	});

	it("refuses a file over 1 MB before copying anything", () => {
		const { root, repo } = repository();
		const source = write(root, "large.log", Buffer.alloc(1_000_001));
		const message = failure(() =>
			keepEvidence({
				root: repo,
				inputs: [source],
				to: "milestone/too-large",
			}),
		);
		expect(message).toContain("file exceeds 1 MB");
		expect(message).toContain(source);
		expect(
			existsSync(
				path.join(repo, "docs/phase-records/evidence/milestone/too-large"),
			),
		).toBe(false);
	});

	it.each([".png", ".mp4"])("refuses an image or video (%s)", (extension) => {
		const { root, repo } = repository();
		const source = write(root, `frame${extension}`, "not binary");
		const message = failure(() =>
			keepEvidence({
				root: repo,
				inputs: [source],
				to: "milestone/media",
			}),
		);
		expect(message).toContain("image or video belongs in concept evidence");
		expect(message).toContain(source);
		expect(
			existsSync(
				path.join(repo, "docs/phase-records/evidence/milestone/media"),
			),
		).toBe(false);
	});

	it("refuses a target that already holds different bytes", () => {
		const { root, repo } = repository();
		const source = write(root, "REPORT.md", "first\n");
		keepEvidence({
			root: repo,
			inputs: [source],
			to: "milestone/changed",
		});
		write(root, "REPORT.md", "second\n");
		const message = failure(() =>
			keepEvidence({
				root: repo,
				inputs: [source],
				to: "milestone/changed",
			}),
		);
		expect(message).toContain("already holds a different file");
		expect(
			readFileSync(
				path.join(
					repo,
					"docs/phase-records/evidence/milestone/changed/REPORT.md",
				),
				"utf8",
			),
		).toBe("first\n");
	});

	it("refuses more than 200 files before copying", () => {
		const { root, repo } = repository();
		const source = path.join(root, "many");
		for (let index = 0; index < 201; index += 1)
			write(source, `entries/${index}.txt`, "");
		const message = failure(() =>
			keepEvidence({
				root: repo,
				inputs: [source],
				to: "milestone/many",
			}),
		);
		expect(message).toContain("would copy 201 files");
		expect(
			existsSync(path.join(repo, "docs/phase-records/evidence/milestone/many")),
		).toBe(false);
	});

	it("refuses more than 5 MB in one call before copying", () => {
		const { root, repo } = repository();
		const source = path.join(root, "large-call");
		for (let index = 0; index < 6; index += 1)
			write(source, `part-${index}.txt`, Buffer.alloc(900_000, index));
		const message = failure(() =>
			keepEvidence({
				root: repo,
				inputs: [source],
				to: "milestone/large-call",
			}),
		);
		expect(message).toContain("limit is 5000000");
		expect(
			existsSync(
				path.join(repo, "docs/phase-records/evidence/milestone/large-call"),
			),
		).toBe(false);
	});

	it("refuses a destination Git ignores", () => {
		const { root, repo } = repository();
		write(repo, ".gitignore", "docs/phase-records/evidence/ignored/**\n");
		const source = write(root, "REPORT.md", "report\n");
		const message = failure(() =>
			keepEvidence({
				root: repo,
				inputs: [source],
				to: "ignored/anything",
			}),
		);
		expect(message).toContain("destination is ignored by Git");
		expect(
			existsSync(path.join(repo, "docs/phase-records/evidence/ignored")),
		).toBe(false);
	});

	it("refuses a call that brings the evidence folder past 50 MB", () => {
		const { root, repo } = repository();
		const occupied = write(
			repo,
			"docs/phase-records/evidence/existing/large.bin",
			"",
		);
		truncateSync(occupied, 50_000_001);
		const source = write(root, "REPORT.md", "report\n");
		const message = failure(() =>
			keepEvidence({
				root: repo,
				inputs: [source],
				to: "milestone/full",
			}),
		);
		expect(message).toContain("evidence folder would reach");
		expect(message).toContain("limit is 50000000");
		expect(
			existsSync(path.join(repo, "docs/phase-records/evidence/milestone/full")),
		).toBe(false);
	});
});
