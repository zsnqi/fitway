import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { formatReport } from "./survey.mjs";
import {
	cleanupScript,
	pruneScript,
	writeSurveyOutputs,
} from "./survey-cli.mjs";
import { root } from "./survey-evidence.mjs";

const gardener = pathToFileURL(path.join(root, ".agents/skills/gardener")).href;
const snapshot = {
	root: "C:/checkout",
	tempRoot: "C:/temp",
	folders: ["C:/temp/a"],
};

// One fixed input; `sections` and `emptySections` are what formatReport wrote for it at 564625f5.
const report = {
	checks: [],
	complete: true,
	date: "2026-10-28",
	folders: [],
	git: { branches: [], trunk: {}, worktrees: [] },
	goneCitations: {
		checked: true,
		dead: [
			{ path: "D:/fitway-temp/a", source: "r.md", line: 3, changed: true },
			{
				path: "D:/fitway-temp/b.log",
				source: "s.tsv",
				line: 9,
				changed: false,
			},
		],
		tempRoot: "D:/fitway-temp",
	},
	prune: [
		{ path: "D:/fitway-temp/w", withheld: "registered worktree" },
		{
			path: "D:/fitway-temp/p",
			withheld: null,
			bytes: 40,
			candidates: 2,
			kept: {
				files: 4,
				citedFile: 1,
				nonCaptureInCitedFolder: 2,
				captureNamedByText: 1,
				bytes: 12,
			},
			links: [{}],
		},
		{ path: "D:/fitway-temp/e", withheld: null, candidates: 0 },
	],
	repositoryUnchanged: true,
	scriptFiles: {
		folders: [{ path: "D:/fitway-temp/n", scripts: 3 }],
		since: "2026-10-01",
		total: 3,
	},
};
const sections = [
	"## Cited temp paths gone",
	"",
	'- "D:/fitway-temp/a" (r.md:3; changed)',
	'- "D:/fitway-temp/b.log" (s.tsv:9; unchanged)',
	"",
	"## Evidence prune proposals",
	"",
	'- Withheld "D:/fitway-temp/w": registered worktree',
	'- "D:/fitway-temp/p": frees 40 bytes from 2 files; keeps 4 files (1 cited, 2 non-captures in cited folders, 1 named captures; 12 bytes); links not followed: 1.',
	"",
	"## Script files in new temp folders",
	"",
	"Since 2026-10-01:",
	'- "D:/fitway-temp/n": 3 script files',
	"Total: 3 script files.",
	"",
	"## Records",
].join("\n");
const emptySections = [
	"## Cited temp paths gone",
	"",
	'Not checked: "D:/fitway-temp" is absent.',
	"",
	"## Evidence prune proposals",
	"",
	"None.",
	"",
	"## Script files in new temp folders",
	"",
	"Previous report date unavailable; no invented comparison.",
	"",
	"## Records",
].join("\n");

describe("cited-evidence survey output", () => {
	it("writes the three cited-evidence report sections byte for byte as before", () => {
		expect(formatReport(report)).toContain(
			`Temp folders gone during inventory\n\nNone.\n\n\n${sections}\n`,
		);
		expect(
			formatReport({
				...report,
				goneCitations: undefined,
				prune: undefined,
				scriptFiles: undefined,
			}),
		).toContain(`\n\n\n${emptySections}\n`);
	});

	it("writes the cleanup and prune scripts byte for byte as before", () => {
		const body = `${JSON.stringify(snapshot, null, 2)}, { checkout: "C:/checkout" });\n`;
		const header =
			"// USER-RUN PROPOSAL ONLY. Review the listed folders before running. The survey never executes this file.\n";
		expect(cleanupScript(snapshot, "C:/checkout")).toBe(
			`${header}import { cleanup } from "${gardener}/cleanup.mjs";\nawait cleanup(${body}`,
		);
		expect(pruneScript(snapshot, "C:/checkout")).toBe(
			`${header}import { pruneEvidence } from "${gardener}/prune-evidence.mjs";\nawait pruneEvidence(${body}`,
		);
	});

	it("writes prune.mjs from the report's prune proposal paths", async () => {
		const base = path.resolve(process.env.GARDENER_TEST_RUN ?? os.tmpdir());
		mkdirSync(base, { recursive: true });
		const out = mkdtempSync(path.join(base, "gardener-survey-output-"));
		try {
			await writeSurveyOutputs({
				cleanupData: snapshot,
				out,
				report: {
					...report,
					proposals: { prune: { paths: ["D:/fitway-temp/proposed"] } },
				},
				text: "report\n",
			});
			const written = readFileSync(path.join(out, "prune.mjs"), "utf8");
			expect(written).toBe(
				pruneScript({
					root: snapshot.root,
					tempRoot: snapshot.tempRoot,
					folders: ["D:/fitway-temp/proposed"],
				}),
			);
		} finally {
			rmSync(out, { recursive: true, force: true });
		}
	});
});
