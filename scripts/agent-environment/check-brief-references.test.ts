import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { formatBriefResult } from "./check-brief.mjs";
import {
	createReviewSourceRoot,
	fixture,
	removeBriefFixtures,
	repository,
	script,
} from "./check-brief-fixture";
import { git, put } from "./fixtures";

it("C2: the coordinator checklist explains the must change marker", () => {
	const template = readFileSync(
		path.join(repository, "docs/agent-context/briefs/codex.md"),
		"utf8",
	);
	expect(template).toContain(
		"- [ ] Mark with ` (must change)` each path an outcome requires to change.",
	);
});

it("R4: checker diagnostics name their checks without colliding with B1-B10", async () => {
	const f = fixture();
	const text =
		f.valid
			.replace("role: codex", "role: unknown")
			.replace("feature/build", "missing/branch") +
		"\n<unfilled>\n" +
		"\n".repeat(85);
	const result = await f.check(text);
	expect(
		new Set(result.problems.map((problem: { rule: string }) => problem.rule)),
	).toEqual(new Set(["brief-references", "brief-format", "brief-readiness"]));
	expect(formatBriefResult(result)).not.toMatch(/\b(?:FAIL|WARNING) B\d+:/);
	const template = readFileSync(
		path.join(repository, "docs/agent-context/briefs/codex.md"),
		"utf8",
	);
	expect(template).toMatch(/B10\.[\s\S]*?brief-references/);
});
afterEach(removeBriefFixtures);
beforeAll(createReviewSourceRoot);

describe("C1 must change references", () => {
	it("accepts existing repository and absolute files and folders, including bare paths", async () => {
		const f = fixture();
		const absolute = path.join(f.root, "outside git.bin").replaceAll("\\", "/");
		writeFileSync(absolute, "content");
		const paths = [
			"docs/guide.md",
			"docs/",
			"LICENSE",
			absolute,
			f.root.replaceAll("\\", "/"),
		];
		const text =
			f.valid +
			paths
				.map((file) => `\n- Outcome: Update \`${file}\` (must change).`)
				.join("") +
			"\n";
		const result = await f.check(text);
		expect(result.problems).toEqual([]);
		expect(
			result.requiredChanges.map((entry: { path: string }) => entry.path),
		).toEqual(paths);
		for (const entry of result.requiredChanges)
			expect(text.split("\n")[entry.line - 1]).toBe(entry.outcome);
	});
	it.each([
		"repository",
		"absolute",
		"bare",
	])("refuses a missing marked %s path", async (kind) => {
		const f = fixture();
		const file =
			kind === "absolute"
				? path.join(f.root, "missing.bin").replaceAll("\\", "/")
				: kind === "bare"
					? "missing"
					: "docs/missing.md";
		const text = `${f.valid}\n- Outcome: Update \`${file}\` (must change).\n`;
		const result = await f.check(text);
		expect(result.ok).toBe(false);
		expect(formatBriefResult(result)).toContain(
			"must change path does not exist:",
		);
		writeFileSync(f.briefPath, text);
		const cli = spawnSync(process.execPath, [script, f.briefPath], {
			cwd: f.commandRepository,
			encoding: "utf8",
			windowsHide: true,
		});
		expect(cli.status).toBe(1);
		expect(cli.stdout).toContain(
			"FAIL brief-references: must change path does not exist:",
		);
	});
	it("ignores markers in comments and keeps unmarked machine-local paths unjudged", async () => {
		const f = fixture();
		const missing = path.join(f.root, "missing.bin").replaceAll("\\", "/");
		const result = await f.check(
			`${f.valid}\n\`${missing}\`\n<!-- \`${missing}\` (must change) -->\n`,
		);
		expect(result.ok).toBe(true);
		expect(result.requiredChanges).toEqual([]);
	});
});

describe("brief-references: resolve a brief against its named Git worktree", () => {
	it("Q2: accepts short and long named roots and Windows letter case", async () => {
		const f = fixture();
		const long = realpathSync.native(f.worktree);
		const variants = [f.worktree, long];
		if (process.platform === "win32") variants.push(long.toUpperCase());
		for (const variant of variants) {
			const result = await f.check(
				f.valid.replace(
					f.worktree.replaceAll("\\", "/"),
					variant.replaceAll("\\", "/"),
				),
			);
			expect(result.problems).toEqual([]);
		}
		const nested = await f.check(
			f.valid.replace(
				f.worktree.replaceAll("\\", "/"),
				path.join(long, "docs").replaceAll("\\", "/"),
			),
		);
		expect(formatBriefResult(nested)).toContain(
			"named worktree is not a Git worktree root",
		);
	});
	it.skipIf(process.platform !== "win32")(
		"Q2: matches declared new parents across Windows case forms",
		async () => {
			const f = fixture();
			const result = await f.check(
				`${f.valid}\n\`docs/New/\` (new)\n\`DOCS/new/deeper/\` (new)\n\`docs/NEW/DEEPER/file.md\` (new)\n`,
			);
			expect(result.problems).toEqual([]);
		},
	);
	it.skipIf(process.platform !== "win32")(
		"Q2: both CLI entry checks accept Windows letter case",
		() => {
			for (const entry of [
				script,
				path.join(repository, "scripts/agent-environment/new-handoff.mjs"),
			]) {
				const result = spawnSync(
					process.execPath,
					[
						path.join(path.dirname(entry).toUpperCase(), path.basename(entry)),
						"--help",
					],
					{
						cwd: repository,
						encoding: "utf8",
						windowsHide: true,
					},
				);
				expect(result.status, result.stdout + result.stderr).toBe(0);
				expect(result.stdout).toContain("Usage: pnpm");
			}
		},
	);
	it("accepts exact HEAD, relative and absolute files, selectors, scope globs and spaced paths", async () => {
		const f = fixture();
		const absolute = process.execPath.replaceAll("\\", "/");
		const result = await f.check(
			`${f.valid}\n\`${absolute}\`\n\`docs/file with spaces.md\` §"Setext heading"\n\`LICENSE\`\n\`docs/**\`\n\`docs/guide.md §"Guide"\`\n`,
		);
		expect(result.problems).toEqual([]);
		expect(result.ok).toBe(true);
	});

	it("accepts a named ancestor when all intervening commits change only Markdown", async () => {
		const f = fixture();
		put(f.worktree, "launch.md", "# Coordinator launch brief\n");
		git(f.worktree, "add", ".");
		git(f.worktree, "commit", "-m", "add brief after naming HEAD");
		expect((await f.check()).ok).toBe(true);
	});

	it("rejects non-Markdown edits even if a later commit reverts them", async () => {
		const f = fixture();
		put(f.worktree, "build.js", "export const value = 1;\n");
		git(f.worktree, "add", ".");
		git(f.worktree, "commit", "-m", "code change");
		git(f.worktree, "revert", "--no-edit", "HEAD");
		const result = await f.check();
		expect(result.ok).toBe(false);
		expect(formatBriefResult(result)).toMatch(
			/:4: FAIL brief-references:.*non-Markdown paths: build.js/,
		);
	});

	it("rejects a renamed non-Markdown file and records both paths", async () => {
		const f = fixture();
		git(f.worktree, "mv", "LICENSE", "license.md");
		git(f.worktree, "commit", "-m", "rename non-Markdown file");
		expect(formatBriefResult(await f.check())).toMatch(
			/non-Markdown paths: LICENSE/,
		);
	});

	// The worktree's own code before the named HEAD differs only between a later merge and its second parent.
	function mergeFixture() {
		const f = fixture();
		put(f.worktree, "app.js", "export const app = 1;\n");
		git(f.worktree, "add", ".");
		git(f.worktree, "commit", "-m", "worktree code before naming HEAD");
		const named = git(f.worktree, "rev-parse", "--short", "HEAD");
		put(f.commandRepository, "notes.md", "# Coordinator notes\n");
		git(f.commandRepository, "add", ".");
		git(f.commandRepository, "commit", "-m", "coordinator Markdown");
		const brief = f.valid.replace(`HEAD \`${f.head}\``, `HEAD \`${named}\``);
		return { ...f, named, brief };
	}

	it("accepts a later merge whose first-parent diff changes only Markdown", async () => {
		const f = mergeFixture();
		git(f.worktree, "merge", "--no-ff", "--no-edit", "coordinator");
		const result = await f.check(f.brief);
		expect(result.problems).toEqual([]);
		expect(result.ok).toBe(true);
	});

	it("rejects a later merge whose first-parent diff changes a non-Markdown path", async () => {
		const f = mergeFixture();
		git(f.worktree, "merge", "--no-ff", "--no-commit", "coordinator");
		put(f.worktree, "merge.js", "export const merged = 1;\n");
		git(f.worktree, "add", ".");
		git(f.worktree, "commit", "--no-edit");
		const merge = git(f.worktree, "rev-parse", "HEAD");
		const result = await f.check(f.brief);
		expect(result.ok).toBe(false);
		expect(formatBriefResult(result)).toMatch(
			new RegExp(
				`:4: FAIL brief-references: commit ${merge} after named HEAD ${f.named} changes non-Markdown paths: merge\\.js$`,
				"m",
			),
		);
	});

	it("reports an absent worktree, branch mismatch, detached HEAD, invalid hash and nonancestor", async () => {
		const f = fixture();
		expect(
			formatBriefResult(
				await f.check(
					f.valid.replace(
						f.worktree.replaceAll("\\", "/"),
						`${f.root.replaceAll("\\", "/")}/missing`,
					),
				),
			),
		).toMatch(/brief-references: worktree does not exist/);
		expect(
			formatBriefResult(
				await f.check(f.valid.replace("`feature/build`", "`wrong/branch`")),
			),
		).toMatch(/brief-references: branch mismatch/);
		expect(
			formatBriefResult(
				await f.check(f.valid.replace(`\`${f.head}\``, "`--help`")),
			),
		).toMatch(/brief-references: HEAD must be a commit hash/);
		expect(
			formatBriefResult(
				await f.check(f.valid.replace(`\`${f.head}\``, "`deadbeef`")),
			),
		).toMatch(/brief-references: named HEAD.*missing/);
		put(f.commandRepository, "coordinator-only.md", "# New commit\n");
		git(f.commandRepository, "add", "coordinator-only.md");
		git(f.commandRepository, "commit", "-m", "coordinator ahead");
		const future = git(f.commandRepository, "rev-parse", "--short", "HEAD");
		expect(
			formatBriefResult(
				await f.check(f.valid.replace(`\`${f.head}\``, `\`${future}\``)),
			),
		).toMatch(/brief-references: named HEAD.*not an ancestor/);
		git(f.worktree, "checkout", "--detach");
		expect(formatBriefResult(await f.check())).toContain(
			"found <detached HEAD>",
		);
	});

	it("reports drift with both repositories, fails missing repository paths and leaves machine-local paths unjudged", async () => {
		const f = fixture();
		put(f.commandRepository, "docs/coordinator-only.md", "# Drift\n");
		const absent = path
			.join(path.dirname(process.execPath), "fitway-absent-brief-fixture.md")
			.replaceAll("\\", "/");
		const result = await f.check(
			`${f.valid}\n\`docs/coordinator-only.md\`\n\`docs/missing.md\`\n\`${absent}\`\n`,
		);
		expect(result.problems).toHaveLength(2);
		expect(
			result.problems.some((problem: { message: string }) =>
				problem.message.includes("fitway-absent-brief-fixture"),
			),
		).toBe(false);
		const drift = result.problems.find((problem: { message: string }) =>
			problem.message.startsWith("drift:"),
		);
		expect(drift?.message).toContain(f.worktree);
		expect(drift?.message).toContain(f.commandRepository);
		expect(result.ok).toBe(false);
	});

	it("rejects absent headings, headings inside fenced code and out-of-range line selectors", async () => {
		const f = fixture();
		put(f.worktree, "docs/fenced.md", "~~~md\n## Pretend\n~~~\n# Real ###\n");
		const result = await f.check(
			`${f.valid}\n\`docs/guide.md:5\`\n\`docs/guide.md:0\`\n\`docs/guide.md\` §"Missing"\n\`docs/fenced.md\` §"Pretend"\n\`docs/fenced.md\` §"Real"\n\`docs/\` §"Not a file"\n`,
		);
		expect(result.problems).toHaveLength(5);
		expect(formatBriefResult(result)).toContain(
			"exceeds file length (4 lines)",
		);
		expect(formatBriefResult(result)).toContain('missing heading §"Pretend"');
	});

	it("reads a code span that breaks across lines and reports a split path on its opening line", async () => {
		const f = fixture();
		const text = `${f.valid}\n- Served under \`Cache-Control:\n  no-store\` and with no cache header.\n- Read \`docs/guide.md\n  §"Selected heading"\` and \`docs/\n  guide.md\`.\n`;
		const result = await f.check(text);
		expect(result.problems).toHaveLength(1);
		const [problem] = result.problems;
		expect(text.split("\n")[problem.line - 1]).toMatch(/and `docs\/$/);
		expect(formatBriefResult(result)).toMatch(
			new RegExp(
				`:${problem.line}: FAIL brief-references: missing path .*breaks across lines`,
			),
		);
	});

	it("skips bare mentions even with extensions, line selectors or headings", async () => {
		const f = fixture();
		const result = await f.check(
			`${f.valid}\n\`guide.md\` \`check-brief.mjs\` \`core.longpaths\` \`LICENSE\` \`missing.md:999\` §"Missing"\n`,
		);
		expect(result.problems).toEqual([]);
	});

	it("suggests exactly one tracked suffix match without accepting the missing path", async () => {
		const f = fixture();
		put(f.worktree, "docs/nested/unique.md", "# Tracked\n");
		put(f.worktree, "docs/nested/untracked.md", "# Untracked\n");
		git(f.worktree, "add", "docs/nested/unique.md");
		const result = await f.check(
			`${f.valid}\n\`nested/unique.md\`\n\`nested/untracked.md\`\n`,
		);
		expect(result.ok).toBe(false);
		expect(result.problems).toHaveLength(2);
		expect(result.problems[0].message).toContain(
			`tracked suffix match: ${path.join(f.worktree, "docs/nested/unique.md")}`,
		);
		expect(result.problems[1].message).not.toContain("tracked suffix match:");
		put(f.worktree, "other/nested/unique.md", "# Another tracked match\n");
		git(f.worktree, "add", "other/nested/unique.md");
		const ambiguous = await f.check(`${f.valid}\n\`nested/unique.md\`\n`);
		expect(ambiguous.ok).toBe(false);
		expect(ambiguous.problems[0].message).not.toContain(
			"tracked suffix match:",
		);
	});

	it("accepts new files and folders with existing or declared new parents without drift", async () => {
		const f = fixture();
		put(
			f.commandRepository,
			"docs/command-only.md",
			"# Already in command repository\n",
		);
		const result = await f.check(
			`${f.valid}\n\`docs/command-only.md\` (new)\n\`docs/new/deeper/file.md\` (new)\n\`docs/new/deeper/\` (new)\n\`docs/new/\` (new)\n`,
		);
		expect(result.problems).toEqual([]);
		expect(result.ok).toBe(true);
	});

	it("rejects existing new paths and absent or nondirectory parents without drift", async () => {
		const f = fixture();
		put(f.commandRepository, "absent/file.md", "# Command repository only\n");
		const result = await f.check(
			`${f.valid}\n\`docs/guide.md\` (new)\n\`docs/\` (new)\n\`absent/file.md\` (new)\n\`docs/guide.md/child.md\` (new)\n`,
		);
		expect(result.ok).toBe(false);
		expect(result.problems).toHaveLength(4);
		expect(
			result.problems
				.slice(0, 2)
				.every((problem: { message: string }) =>
					problem.message.startsWith("new path already exists:"),
				),
		).toBe(true);
		expect(
			result.problems
				.slice(2)
				.every((problem: { message: string }) =>
					problem.message.startsWith(
						"parent folder must exist or be declared (new):",
					),
				),
		).toBe(true);
		expect(formatBriefResult(result)).not.toContain("drift:");
	});

	it("checks glob folders even when empty and rejects missing or nondirectory folders", async () => {
		const f = fixture();
		mkdirSync(path.join(f.worktree, ".github/workflows"), { recursive: true });
		expect(
			(
				await f.check(
					`${f.valid}\n\`.github/workflows/**\`\n\`docs/no-match*.md\`\n`,
				)
			).problems,
		).toEqual([]);
		const result = await f.check(
			`${f.valid}\n\`.github/missing/**\`\n\`docs/guide.md/**\`\n`,
		);
		expect(result.ok).toBe(false);
		expect(result.problems).toHaveLength(2);
		expect(formatBriefResult(result)).toContain("missing path");
		expect(formatBriefResult(result)).toContain(
			"glob folder is not a directory:",
		);
	});

	it("skips placeholder paths, temp paths, commands, branch names, hashes and HTML comments", async () => {
		const f = fixture();
		expect(
			(
				await f.check(
					`${f.valid}\n\`docs/<run>/absent.md\` \`<path>\` \`D:/fitway-temp/absent.md\` \`pnpm brief:check <brief>\` \`a1b2c3d\` \`24.14.0\` \`v24.14.0\` \`1.0.0-alpha.1\`\n<!-- \`docs/comment-only.md\` -->\n`,
				)
			).ok,
		).toBe(true);
	});
});
