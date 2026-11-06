import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	assertGardenerFixtureCitations,
	verifyRepositoryBriefRules,
} from "./repository-document-rules.mjs";

const scopeSentence =
	"If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report.";
const roots: string[] = [];

afterEach(() => {
	for (const root of roots.splice(0))
		rmSync(root, { recursive: true, force: true });
});

function fixture() {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-document-rules-"));
	roots.push(root);
	return root;
}

function writeBrief(root: string, folder: string, name: string, text: string) {
	const directory = path.join(root, folder);
	mkdirSync(directory, { recursive: true });
	writeFileSync(path.join(directory, name), text, "utf8");
}

function codexBrief(scope = scopeSentence, outcome = "- **Q1.** Check it.") {
	return [
		"<!-- brief-format: v1 role: codex delivers: report -->",
		"# Fixture",
		"## Scope",
		"",
		`Change only the fixture. ${scope}`,
		"",
		"## Causes and required outcomes",
		"",
		outcome,
		"",
	].join("\n");
}

describe("repository brief document rules", () => {
	it("accepts a good Codex brief and skips another known role", () => {
		const root = fixture();
		const folder = "docs/briefs";
		writeBrief(root, folder, "good.md", codexBrief());
		writeBrief(
			root,
			folder,
			"older-codex.md",
			codexBrief().replace(" delivers: report", ""),
		);
		writeBrief(
			root,
			folder,
			"builder.md",
			"<!-- brief-format: v1 role: builder -->\n# Builder\n",
		);

		expect(verifyRepositoryBriefRules(root, { folders: [folder] })).toEqual({
			filesChecked: 3,
			folders: [{ folder, filesChecked: 3 }],
		});
	});

	it("names a bad Codex Scope and a brief with no outcome ID", () => {
		const root = fixture();
		const folder = "docs/briefs";
		writeBrief(root, folder, "bad-scope.md", codexBrief("No final sentence."));
		writeBrief(
			root,
			folder,
			"no-outcome.md",
			codexBrief(scopeSentence, "No outcome record."),
		);

		expect(() =>
			verifyRepositoryBriefRules(root, { folders: [folder] }),
		).toThrow(/bad-scope\.md:\d+: Codex Scope must end with/);
		expect(() =>
			verifyRepositoryBriefRules(root, { folders: [folder] }),
		).toThrow(/no-outcome\.md:1: has no outcome IDs/);
	});

	it("names Markdown without a known brief header", () => {
		const root = fixture();
		const folder = "docs/briefs";
		writeBrief(root, folder, "loose.md", "# Loose document\n");

		expect(() =>
			verifyRepositoryBriefRules(root, { folders: [folder] }),
		).toThrow(/loose\.md:1: must start with <!-- brief-format:/);
	});

	it("fails a missing folder and counts an empty folder as zero", () => {
		const root = fixture();
		const empty = "docs/empty";
		mkdirSync(path.join(root, empty), { recursive: true });

		expect(verifyRepositoryBriefRules(root, { folders: [empty] })).toEqual({
			filesChecked: 0,
			folders: [{ folder: empty, filesChecked: 0 }],
		});
		expect(() =>
			verifyRepositoryBriefRules(root, { folders: ["docs/missing"] }),
		).toThrow(/docs\/missing: brief folder does not exist/);
	});
});

describe("repository gardener citation rule", () => {
	const testRecord = {
		source: ".agents/skills/gardener/example.test.ts",
		text: 'const run = "D:/fitway-temp/shared-run";',
	};
	const outsideRecord = {
		source: ".agents/skills/gardener/REPORT.md",
		text: "Evidence: D:/fitway-temp/shared-run/report.json",
	};

	it("names a test path cited by a non-test gardener record", () => {
		expect(() =>
			assertGardenerFixtureCitations([testRecord, outsideRecord], {
				tempRoot: "D:/fitway-temp",
				exists: () => false,
				readdir: () => [],
			}),
		).toThrow(
			/\.agents\/skills\/gardener\/example\.test\.ts.*shared-run.*REPORT\.md/,
		);
	});
});
