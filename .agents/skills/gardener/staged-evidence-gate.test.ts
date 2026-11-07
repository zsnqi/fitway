import { spawnSync } from "node:child_process";
import {
	copyFileSync,
	mkdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import {
	checkStagedEvidence,
	formatStagedEvidencePass,
	stagedEvidenceFailures,
} from "../../../scripts/agent-environment/check-staged-evidence.mjs";
import { checkoutFixture } from "./checkout-test-fixture.mjs";
import {
	TEMP_PROVENANCE_CUTOFF,
	TEMP_PROVENANCE_CUTOFF_ISO,
} from "./run-folder-provenance.mjs";
import { sha256, writeProvenance } from "./run-folder-test-fixture.mjs";

const repository = fileURLToPath(new URL("../../../", import.meta.url));
const actualCheck = path.join(
	repository,
	"scripts/agent-environment/check-staged-evidence.mjs",
);
const postCutoff = TEMP_PROVENANCE_CUTOFF;
const preCutoff = new Date(postCutoff.getTime() - 1);

function statAt(birthtime: Date) {
	return (file: string) => ({
		birthtime,
		isDirectory: () => statSync(file).isDirectory(),
	});
}

function statByPath(times: Map<string, Date>) {
	return (file: string) => ({
		birthtime: times.get(path.resolve(file)) ?? preCutoff,
		isDirectory: () => statSync(file).isDirectory(),
	});
}

function stageRecord(f: ReturnType<typeof checkoutFixture>, line: string) {
	writeFileSync(path.join(f.checkout, "record.txt"), `${line}\n`);
	f.git(["add", "--", "record.txt"]);
}

function stageRecordLines(
	f: ReturnType<typeof checkoutFixture>,
	lines: string[],
) {
	writeFileSync(path.join(f.checkout, "record.txt"), `${lines.join("\n")}\n`);
	f.git(["add", "--", "record.txt"]);
}

function stageFile(
	f: ReturnType<typeof checkoutFixture>,
	file: string,
	text: string,
) {
	const absolute = path.join(f.checkout, file);
	mkdirSync(path.dirname(absolute), { recursive: true });
	writeFileSync(absolute, text);
	f.git(["add", "--", file]);
}

function stageLostEvidence(
	f: ReturnType<typeof checkoutFixture>,
	record: string,
	line: number,
	citedPath: string,
) {
	stageFile(
		f,
		"docs/agent-context/LOST_TEMP_EVIDENCE.tsv",
		[
			"path\trecord\tline\tcause",
			`${citedPath.toLowerCase()}\t${record}\t${line}\tcause not found`,
			"",
		].join("\n"),
	);
}

function citationLine(citation: string) {
	return `Evidence: \`${citation}\``;
}

async function stagedFailure(
	f: ReturnType<typeof checkoutFixture>,
	stat = statAt(postCutoff),
	options: Record<string, unknown> = {},
) {
	const result = await checkStagedEvidence({
		checkout: f.checkout,
		stat,
		tempRoot: f.tempRoot,
		...options,
	});
	return { result, failures: stagedEvidenceFailures(result) };
}

async function withEvidenceFixture(
	run: (f: ReturnType<typeof checkoutFixture>) => Promise<void>,
) {
	const f = checkoutFixture("gardener-staged-evidence-");
	try {
		await run(f);
	} finally {
		f.dispose();
	}
}

function evidenceFolder(f: ReturnType<typeof checkoutFixture>, name: string) {
	const folder = path.join(f.tempRoot, name);
	mkdirSync(folder, { recursive: true });
	writeFileSync(path.join(folder, "REPORT.md"), "report\n");
	return folder;
}

const citationForms: Array<[string, (root: string) => string, string]> = [
	[
		"forward-slash drive path",
		(root) => `${root.replaceAll("\\", "/")}/gone/file.md`,
		"gone/file.md",
	],
	[
		"backslash drive path",
		(root) => `${root.replaceAll("/", "\\")}\\gone\\file.md`,
		"gone\\file.md",
	],
	[
		"uppercase temp root",
		(root) => `${root.replaceAll("\\", "/").toUpperCase()}/gone/file.md`,
		"GONE/FILE.MD",
	],
	["bare temp-root prefix", () => "fitway-temp/gone/file.md", "gone/file.md"],
	[
		"folder with trailing slash",
		(root) => `${root.replaceAll("\\", "/")}/gone-folder/`,
		"gone-folder",
	],
	[
		"folder without trailing slash",
		(root) => `${root.replaceAll("\\", "/")}/gone-folder`,
		"gone-folder",
	],
	[
		"file inside a folder",
		(root) => `${root.replaceAll("\\", "/")}/gone-folder/evidence.txt`,
		"gone-folder/evidence.txt",
	],
];

describe("staged temp-citation evidence gate", () => {
	it.each(
		citationForms,
	)("refuses an added citation in %s form", async (_name, makeCitation, expectedPath) => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			const citation = makeCitation(f.tempRoot);
			stageRecord(f, citationLine(citation));
			const { failures } = await stagedFailure(f);
			const text = failures.join("\n").replaceAll("\\", "/").toLowerCase();
			expect(text).toContain("record.txt:1");
			expect(text).toContain(expectedPath.replaceAll("\\", "/").toLowerCase());
		} finally {
			f.dispose();
		}
	});

	it("ignores the same citation when it is not staged", async () => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			writeFileSync(
				path.join(f.checkout, "record.txt"),
				`${citationLine(`${f.tempRoot}/gone/file.md`)}\n`,
			);
			const { failures, result } = await stagedFailure(f);
			expect(failures).toEqual([]);
			expect(result.audit).toBeNull();
		} finally {
			f.dispose();
		}
	});

	it("ignores a documented ellipsis instead of treating it as evidence", async () => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			stageRecord(f, "Forms: `D:/fitway-temp/...` and `D:\\fitway-temp\\...`.");
			expect((await stagedFailure(f)).failures).toEqual([]);
		} finally {
			f.dispose();
		}
	});

	it("accepts a staged citation marked gone on that line", async () => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			stageRecord(
				f,
				`${citationLine(`${f.tempRoot}/gone/file.md`)} (gone: fixture loss)`,
			);
			expect((await stagedFailure(f)).failures).toEqual([]);
		} finally {
			f.dispose();
		}
	});

	it("accepts a staged citation named by the indexed lost-evidence list", async () => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			const gone = `${f.tempRoot}/gone/listed.md`;
			stageRecord(f, citationLine(gone));
			stageLostEvidence(f, "record.txt", 1, gone.replaceAll("\\", "/"));
			expect((await stagedFailure(f)).failures).toEqual([]);
		} finally {
			f.dispose();
		}
	});

	it("names the run-folder command in a gone-citation failure", async () => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			stageRecord(f, citationLine(`${f.tempRoot}/new-run/REPORT.md`));
			const { failures } = await stagedFailure(f);
			expect(failures.join("\n")).toContain(
				"pnpm run-folder:new new-run --brief <file> --for <who>",
			);
		} finally {
			f.dispose();
		}
	});

	it.each([
		["the folder itself", "new-run", true],
		["the folder with a trailing slash", "new-run/", true],
		["a nested file", "new-run/REPORT.md", true],
		["a file directly in the temp root", "codex-accounts.mjs", false],
	])("gives a gone citation of %s the run-folder command only when it can be a run folder", async (_name, cited, expectsFix) => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			stageRecord(
				f,
				citationLine(`${f.tempRoot.replaceAll("\\", "/")}/${cited}`),
			);
			const text = (await stagedFailure(f)).failures.join("\n");
			expect(text).toContain("record.txt:1");
			if (expectsFix)
				expect(text).toContain(
					"Run folder not made yet? pnpm run-folder:new new-run --brief <file> --for <who>",
				);
			else expect(text).not.toContain("pnpm run-folder:new");
		} finally {
			f.dispose();
		}
	});

	it("fails a moved gone citation because its destination is an added line", async () => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			const gone = `${f.tempRoot}/gone/moved.md`;
			writeFileSync(
				path.join(f.checkout, "record.txt"),
				`${citationLine(gone)}\nAfter\n`,
			);
			f.commit();
			writeFileSync(
				path.join(f.checkout, "record.txt"),
				`After\n${citationLine(gone)}\n`,
			);
			f.git(["add", "--", "record.txt"]);
			const { failures } = await stagedFailure(f);
			expect(failures.join("\n")).toContain("record.txt:2");
		} finally {
			f.dispose();
		}
	});

	it("passes a .mjs-only commit without reading record content", async () => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			stageFile(f, "helper.mjs", "export const value = 1;\n");
			const result = await checkStagedEvidence({
				checkout: f.checkout,
				tempRoot: f.tempRoot,
			});
			expect(result.audit).toBeNull();
			expect(stagedEvidenceFailures(result)).toEqual([]);
		} finally {
			f.dispose();
		}
	});

	it("checks a first commit against the empty tree", async () => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			f.git(["update-ref", "-d", "refs/heads/main"]);
			stageRecord(f, citationLine(`${f.tempRoot}/gone/first.md`));
			expect((await stagedFailure(f)).failures.join("\n")).toContain(
				"record.txt:1",
			);
		} finally {
			f.dispose();
		}
	});

	it("passes and says nothing was checked when the temp root is absent", async () => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			stageRecord(f, citationLine(`${f.tempRoot}/gone/not-visible.md`));
			rmSync(f.tempRoot, { recursive: true, force: true });
			const { result, failures } = await stagedFailure(f);
			expect(failures).toEqual([]);
			expect(result.audit?.checked).toBe(false);
			expect(formatStagedEvidencePass(result)).toContain("not checked");
		} finally {
			f.dispose();
		}
	});

	it("runs the exact staged-evidence pre-commit command from lefthook", () => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			stageRecord(f, citationLine(`${f.tempRoot}/gone/hooked.md`));
			const config = parseYaml(
				readFileSync(path.join(repository, "lefthook.yml"), "utf8"),
			);
			const job = config["pre-commit"].jobs.find(
				(candidate: { name: string }) => candidate.name === "staged-evidence",
			);
			expect(typeof job?.run).toBe("string");
			// The job's own line runs in the fixture checkout; its script is replaced
			// by a shim that imports the real check, so the line is what is tested.
			const script = job.run
				.split(/\s+/)
				.find((token: string) => token.endsWith(".mjs"));
			expect(script).toBeTruthy();
			const shim = path.join(f.checkout, script);
			mkdirSync(path.dirname(shim), { recursive: true });
			writeFileSync(
				shim,
				`import { runStagedEvidenceCheck } from ${JSON.stringify(pathToFileURL(actualCheck).href)};\ntry { await runStagedEvidenceCheck(); } catch (error) { console.error(error.message); process.exitCode = 1; }\n`,
			);
			const result = spawnSync(job.run, {
				cwd: f.checkout,
				encoding: "utf8",
				env: { ...process.env, FITWAY_TEMP_ROOT: f.tempRoot },
				shell: true,
				windowsHide: true,
			});
			expect(result.status).not.toBe(0);
			expect(result.stderr).toContain(
				"Evidenced temp citations are gone on added staged lines",
			);
			expect(result.stderr).toContain("record.txt:1");
		} finally {
			f.dispose();
		}
	});
});

// Commits `files` on a branch `other`, adds an unrelated commit on main, and leaves
// `git merge --no-commit --no-ff other` in progress, so MERGE_HEAD names `other`.
function startMerge(
	f: ReturnType<typeof checkoutFixture>,
	files: Record<string, string>,
) {
	f.git(["checkout", "-q", "-b", "other"]);
	for (const [file, text] of Object.entries(files)) {
		const absolute = path.join(f.checkout, file);
		mkdirSync(path.dirname(absolute), { recursive: true });
		writeFileSync(absolute, text);
	}
	f.commit();
	f.git(["checkout", "-q", "main"]);
	writeFileSync(path.join(f.checkout, "main-only.txt"), "main\n");
	f.commit();
	f.git([
		"-c",
		"user.name=Gardener fixture",
		"-c",
		"user.email=gardener@example.test",
		"merge",
		"--no-commit",
		"--no-ff",
		"-q",
		"other",
	]);
	expect(f.git(["rev-parse", "-q", "--verify", "MERGE_HEAD"]).trim()).toBe(
		f.git(["rev-parse", "other"]).trim(),
	);
}

describe("staged evidence during a merge", () => {
	const designer =
		"<!-- brief-format: v1 role: designer -->\n# Designer brief\n";

	it("passes a merge whose other parent brings a line citing a missing temp folder", async () => {
		await withEvidenceFixture(async (f) => {
			startMerge(f, {
				"record.txt": `${citationLine(`${f.tempRoot}/gone/merged.md`)}\n`,
			});
			expect((await stagedFailure(f)).failures).toEqual([]);
		});
	});

	it("refuses only the brought missing-folder line that is edited during the merge", async () => {
		await withEvidenceFixture(async (f) => {
			startMerge(f, {
				"record.txt": `${citationLine(`${f.tempRoot}/gone/first.md`)}\n${citationLine(`${f.tempRoot}/gone/second.md`)}\n`,
			});
			stageRecordLines(f, [
				citationLine(`${f.tempRoot}/gone/edited.md`),
				citationLine(`${f.tempRoot}/gone/second.md`),
			]);
			const text = (await stagedFailure(f)).failures.join("\n");
			expect(text).toContain("record.txt:1");
			expect(text.replaceAll("\\", "/")).toContain("gone/edited.md");
			expect(text).not.toContain("record.txt:2");
		});
	});

	it("refuses only the missing-folder line added in the merge, not the brought one", async () => {
		await withEvidenceFixture(async (f) => {
			startMerge(f, {
				"record.txt": `${citationLine(`${f.tempRoot}/gone/brought.md`)}\n`,
			});
			stageRecordLines(f, [
				citationLine(`${f.tempRoot}/gone/brought.md`),
				citationLine(`${f.tempRoot}/gone/added.md`),
			]);
			const text = (await stagedFailure(f)).failures.join("\n");
			expect(text).toContain("record.txt:2");
			expect(text).not.toContain("record.txt:1");
		});
	});

	it("passes a designer brief with a raw-tool line that the other parent added", async () => {
		await withEvidenceFixture(async (f) => {
			startMerge(f, {
				"briefs/other-designer.md": `${designer}\nUse node scripts.\n`,
			});
			expect((await stagedFailure(f)).failures).toEqual([]);
		});
	});

	it("refuses a raw-tool line added in the merge to the other parent's designer brief", async () => {
		await withEvidenceFixture(async (f) => {
			const file = "briefs/other-designer.md";
			startMerge(f, { [file]: `${designer}\nUse node scripts.\n` });
			stageFile(f, file, `${designer}\nUse node scripts.\nUse node scripts.\n`);
			const text = (await stagedFailure(f)).failures.join("\n");
			expect(text).toContain(`${file}:5`);
			expect(text).not.toContain(`${file}:4`);
		});
	});

	it("still refuses a new missing-folder line in a plain commit with no merge", async () => {
		await withEvidenceFixture(async (f) => {
			stageRecord(f, citationLine(`${f.tempRoot}/gone/plain.md`));
			expect(() =>
				f.git(["rev-parse", "-q", "--verify", "MERGE_HEAD"]),
			).toThrow();
			expect((await stagedFailure(f)).failures.join("\n")).toContain(
				"record.txt:1",
			);
		});
	});
});

describe("staged designer-brief instructions", () => {
	const designer =
		"<!-- brief-format: v1 role: designer -->\n# Designer brief\n";

	it("refuses a new designer brief that asks for node scripts", async () => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			stageFile(
				f,
				"briefs/new-designer.md",
				`${designer}\nUse node scripts.\n`,
			);
			const { failures } = await stagedFailure(f);
			expect(failures.join("\n")).toContain("briefs/new-designer.md:4");
			expect(failures.join("\n")).toContain("node scripts");
		} finally {
			f.dispose();
		}
	});

	it("leaves a committed designer brief alone on an unrelated modification", async () => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			const file = "briefs/committed-designer.md";
			stageFile(f, file, `${designer}\nUse node scripts.\n`);
			f.commit();
			writeFileSync(
				path.join(f.checkout, file),
				`${designer}\nUse node scripts.\nMore context.\n`,
			);
			f.git(["add", "--", file]);
			expect((await stagedFailure(f)).failures).toEqual([]);
		} finally {
			f.dispose();
		}
	});

	it("refuses a new refused phrase on a modified designer brief", async () => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			const file = "briefs/clean-designer.md";
			stageFile(f, file, `${designer}\nChoose two directions.\n`);
			f.commit();
			writeFileSync(
				path.join(f.checkout, file),
				`${designer}\nChoose two directions.\nUse node scripts.\n`,
			);
			f.git(["add", "--", file]);
			expect((await stagedFailure(f)).failures.join("\n")).toContain(
				"briefs/clean-designer.md:5",
			);
		} finally {
			f.dispose();
		}
	});

	it("does not apply the designer rule to a builder brief", async () => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			stageFile(
				f,
				"briefs/new-builder.md",
				"<!-- brief-format: v1 role: builder -->\n# Builder brief\n\nUse node scripts.\n",
			);
			expect((await stagedFailure(f)).failures).toEqual([]);
		} finally {
			f.dispose();
		}
	});

	it("ignores render words without a command on an unrelated modification", async () => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			const file = "briefs/command-free-designer.md";
			stageFile(f, file, `${designer}\nChoose two directions.\n`);
			f.commit();
			writeFileSync(
				path.join(f.checkout, file),
				`${designer}\nChoose two directions.\nConsider the render after inspection.\n`,
			);
			f.git(["add", "--", file]);
			expect((await stagedFailure(f)).failures).toEqual([]);
		} finally {
			f.dispose();
		}
	});
});

describe("staged run-folder provenance", () => {
	it("refuses a post-cutoff folder with no provenance record", async () => {
		await withEvidenceFixture(async (f) => {
			const folder = evidenceFolder(f, "made-by-hand");
			stageRecord(f, citationLine(path.join(folder, "REPORT.md")));
			const { failures } = await stagedFailure(f);
			const text = failures.join("\n");
			const normalizedText = text.replaceAll("\\", "/").toLowerCase();
			expect(text).toContain("record.txt:1");
			expect(normalizedText).toContain(
				path.join(folder, "REPORT.md").replaceAll("\\", "/").toLowerCase(),
			);
			expect(text).toContain(folder);
			expect(text).toContain(
				`Folder made after ${TEMP_PROVENANCE_CUTOFF_ISO} with no provenance record`,
			);
			expect(text).toContain(
				"pnpm run-folder:new <name> --brief <file> --for <who>",
			);
		});
	});

	it.each([
		"manifest",
		"run",
		"review",
	] as const)("accepts a %s provenance record", async (kind) => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			const folder = evidenceFolder(f, `${kind}-run`);
			writeProvenance(folder, kind, f.git(["rev-parse", "HEAD"]));
			stageRecord(f, citationLine(path.join(folder, "REPORT.md")));
			expect((await stagedFailure(f)).failures).toEqual([]);
		} finally {
			f.dispose();
		}
	});

	const malformed = [
		["missing field", (kind: string) => JSON.stringify({ version: 1, kind })],
		[
			"wrong length",
			(kind: string) =>
				JSON.stringify({
					version: 1,
					kind,
					for: "fixture",
					briefSha256: "abc",
					commit: "abc",
					head: "abc",
					sha256: "abc",
					status: "running",
					report: "REPORT.md",
				}),
		],
		["not JSON", () => "{"],
	];
	it.each([
		"manifest",
		"run",
		"review",
	] as const)("refuses each malformed %s record", async (kind) => {
		await withEvidenceFixture(async (f) => {
			const folder = evidenceFolder(f, `malformed-${kind}`);
			const name = `${kind}.json`;
			for (const [, value] of malformed) {
				writeFileSync(path.join(folder, name), value(kind));
				stageRecord(f, citationLine(path.join(folder, "REPORT.md")));
				expect((await stagedFailure(f)).failures.length).toBeGreaterThan(0);
			}
		});
	});

	it.each([
		"manifest",
		"run",
		"review",
	] as const)("refuses a %s record copied into another folder", async (kind) => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			const original = evidenceFolder(f, `original-${kind}`);
			writeProvenance(original, kind, f.git(["rev-parse", "HEAD"]));
			const copied = evidenceFolder(f, `copied-${kind}`);
			copyFileSync(
				path.join(original, `${kind}.json`),
				path.join(copied, `${kind}.json`),
			);
			stageRecord(f, citationLine(path.join(copied, "REPORT.md")));
			expect((await stagedFailure(f)).failures.length).toBeGreaterThan(0);
		} finally {
			f.dispose();
		}
	});

	it("refuses a manifest whose brief was edited after recording", async () => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			const folder = evidenceFolder(f, "edited-brief");
			writeProvenance(folder, "manifest", f.git(["rev-parse", "HEAD"]));
			writeFileSync(path.join(folder, "BRIEF.md"), "edited\n");
			stageRecord(f, citationLine(path.join(folder, "REPORT.md")));
			expect((await stagedFailure(f)).failures.length).toBeGreaterThan(0);
		} finally {
			f.dispose();
		}
	});

	it.each([
		"manifest",
		"run",
	] as const)("refuses a %s whose commit is not held by the repository", async (kind) => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			const folder = evidenceFolder(f, `unknown-${kind}`);
			writeProvenance(folder, kind, "a".repeat(40));
			stageRecord(f, citationLine(path.join(folder, "REPORT.md")));
			expect(
				(
					await stagedFailure(f, statAt(postCutoff), {
						holdsCommit: () => false,
					})
				).failures.length,
			).toBeGreaterThan(0);
		} finally {
			f.dispose();
		}
	});

	it("refuses a verify:owner manifest as run-folder provenance", async () => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			const folder = evidenceFolder(f, "verify-owner");
			const brief = "brief\n";
			writeFileSync(path.join(folder, "BRIEF.md"), brief);
			writeFileSync(
				path.join(folder, "manifest.json"),
				JSON.stringify({
					version: 1,
					for: "fixture",
					briefSha256: sha256(brief),
					commit: f.git(["rev-parse", "HEAD"]),
					report: path.join(folder, "REPORT.md"),
					command: "drive",
					checkout: f.checkout,
				}),
			);
			stageRecord(f, citationLine(path.join(folder, "REPORT.md")));
			expect((await stagedFailure(f)).failures.length).toBeGreaterThan(0);
		} finally {
			f.dispose();
		}
	});

	it("fails a post-cutoff nested folder without a record", async () => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			const container = path.join(f.tempRoot, "brief-review");
			const nested = path.join(container, "x-sol");
			mkdirSync(nested, { recursive: true });
			const report = path.join(nested, "REPORT.md");
			writeFileSync(report, "report\n");
			stageRecord(f, citationLine(report));
			const stat = statByPath(
				new Map([
					[path.resolve(container), preCutoff],
					[path.resolve(nested), postCutoff],
				]),
			);
			const { failures } = await stagedFailure(f, stat);
			expect(failures.join("\n")).toContain(nested);
		} finally {
			f.dispose();
		}
	});

	it("accepts a post-cutoff nested folder below a recorded container", async () => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			const container = path.join(f.tempRoot, "brief-review");
			const nested = path.join(container, "x-sol");
			mkdirSync(nested, { recursive: true });
			writeFileSync(path.join(nested, "REPORT.md"), "report\n");
			writeProvenance(container, "manifest", f.git(["rev-parse", "HEAD"]));
			stageRecord(f, citationLine(path.join(nested, "REPORT.md")));
			const stat = statByPath(
				new Map([
					[path.resolve(container), preCutoff],
					[path.resolve(nested), postCutoff],
				]),
			);
			expect((await stagedFailure(f, stat)).failures).toEqual([]);
		} finally {
			f.dispose();
		}
	});

	it("accepts and counts a folder whose levels all predate the cutoff", async () => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			const folder = evidenceFolder(f, "legacy-run");
			stageRecord(f, citationLine(path.join(folder, "REPORT.md")));
			const { result, failures } = await stagedFailure(f, statAt(preCutoff));
			expect(failures).toEqual([]);
			expect(result.audit?.legacyAccepted).toBe(1);
		} finally {
			f.dispose();
		}
	});

	it("accepts a cited file directly under the temp root", async () => {
		const f = checkoutFixture("gardener-staged-evidence-");
		try {
			const helper = path.join(f.tempRoot, "helper.mjs");
			writeFileSync(helper, "export const value = 1;\n");
			stageRecord(f, citationLine(helper));
			const { result, failures } = await stagedFailure(f);
			expect(failures).toEqual([]);
			expect(result.audit?.legacyAccepted).toBe(0);
		} finally {
			f.dispose();
		}
	});
});
