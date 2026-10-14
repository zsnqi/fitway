import { execFileSync, spawnSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	realpathSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
	checkBrief,
	formatBriefResult,
	parseBriefArgs,
} from "./check-brief.mjs";
import { git, put } from "./fixtures";

const repository = fileURLToPath(new URL("../../", import.meta.url));
const script = path.join(
	repository,
	"scripts/agent-environment/check-brief.mjs",
);
const environmentPath = "docs/agent-context/briefs/ENVIRONMENT.md";
const environment = readFileSync(
	path.join(repository, environmentPath),
	"utf8",
);
const roots: string[] = [];

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
	).toEqual(
		new Set([
			"brief-references",
			"brief-format",
			"brief-readiness",
			"brief-length",
		]),
	);
	expect(formatBriefResult(result)).not.toMatch(/\b(?:FAIL|WARNING) B\d+:/);
	const template = readFileSync(
		path.join(repository, "docs/agent-context/briefs/codex.md"),
		"utf8",
	);
	expect(template).toMatch(/B10\.[\s\S]*?brief-references/);
});

afterEach(() => {
	for (const root of roots.splice(0)) {
		const absolute = realpathSync.native(root);
		const relative = path.relative(realpathSync.native(tmpdir()), absolute);
		if (
			relative.startsWith("..") ||
			path.isAbsolute(relative) ||
			!relative.startsWith("fitway-brief-test-")
		)
			throw new Error(`Unsafe fixture cleanup: ${absolute}`);
		rmSync(absolute, { recursive: true, force: true });
	}
});

function fixture() {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-brief-test-"));
	roots.push(root);
	const commandRepository = path.join(root, "coordinator");
	const worktree = path.join(root, "build");
	mkdirSync(commandRepository);
	put(commandRepository, environmentPath, environment);
	put(
		commandRepository,
		"docs/guide.md",
		"# Guide\n\n## Selected heading\nLast line.\n",
	);
	put(commandRepository, "docs/file with spaces.md", "Setext heading\n===\n");
	put(commandRepository, "LICENSE", "Fixture license\n");
	git(commandRepository, "init", "--initial-branch=coordinator");
	git(commandRepository, "config", "user.name", "Brief fixture");
	git(commandRepository, "config", "user.email", "brief@example.invalid");
	git(commandRepository, "config", "commit.gpgsign", "false");
	git(
		commandRepository,
		"config",
		"core.hooksPath",
		path.join(root, "empty-hooks"),
	);
	git(commandRepository, "add", ".");
	git(commandRepository, "commit", "-m", "fixture base");
	const head = git(commandRepository, "rev-parse", "--short", "HEAD");
	git(commandRepository, "worktree", "add", "-b", "feature/build", worktree);
	const valid = `<!-- brief-format: v1 role: codex -->\n# Fixture brief\n\n- **Worktree:** \`${worktree.replaceAll("\\", "/")}\`, branch \`feature/build\`, HEAD \`${head}\`\n\n${environment}\n## Goal\n\nRead \`docs/guide.md:4\` §"Selected heading".\n`;
	const briefPath = path.join(commandRepository, "brief.md");
	const check = async (text = valid, fillEnvironment = false) => {
		writeFileSync(briefPath, text);
		return checkBrief({
			repositoryRoot: commandRepository,
			briefPath,
			fillEnvironment,
		});
	};
	return { root, commandRepository, worktree, head, valid, briefPath, check };
}

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

describe("brief-review-sources: the pre-launch source contract", () => {
	it("reports every refused source in one pass with its line", async () => {
		const f = fixture();
		const outside = path.join(f.root, "outside-review-source.txt");
		writeFileSync(outside, "outside\n");
		writeFileSync(path.join(f.worktree, ".env"), "SECRET=value\n");
		const sources = [
			"docs/guide.md",
			"docs/./guide.md",
			"docs/missing-review-source.md",
			"docs/",
			".env",
			outside.replaceAll("\\", "/"),
		];
		const text = f.valid.replace(
			"## Goal",
			`- **Read first, only these:**\n\n${sources
				.map((source) => `  - \`${source}\``)
				.join("\n")}\n\n## Goal`,
		);
		const result = await f.check(text);
		const problems = result.problems.filter(
			(problem: { rule: string }) => problem.rule === "brief-review-sources",
		);
		expect(problems).toHaveLength(5);
		expect(formatBriefResult(result)).toContain(
			"two named review sources map to one file: docs/./guide.md",
		);
		expect(formatBriefResult(result)).toContain(
			"named review source not found: docs/missing-review-source.md",
		);
		expect(formatBriefResult(result)).toContain(
			"named review source is not a file: docs/",
		);
		expect(formatBriefResult(result)).toContain(
			"named review source holds credentials: .env",
		);
		expect(formatBriefResult(result)).toContain(
			"absolute review source is outside D:/fitway-temp and the launcher checkout",
		);
		const lines = text.split("\n");
		for (const problem of problems)
			expect(lines[problem.line - 1]).toMatch(
				/docs\/|\.env|outside-review-source/,
			);
	});

	it("refuses a repository source that is a symbolic link at the named HEAD", async () => {
		const f = fixture();
		const target = path.join(f.root, "link-target.txt");
		writeFileSync(target, "link target\n");
		const blob = git(f.worktree, "hash-object", "-w", target);
		git(
			f.worktree,
			"update-index",
			"--add",
			"--cacheinfo",
			`120000,${blob},docs/link-source.md`,
		);
		git(f.worktree, "commit", "-m", "add symbolic review source");
		const head = git(f.worktree, "rev-parse", "--short=8", "HEAD");
		const text = f.valid
			.replace(f.head, head)
			.replace(
				"## Goal",
				"- **Read first, only these:**\n\n  - `docs/link-source.md`\n\n## Goal",
			);
		const result = await f.check(text);
		expect(formatBriefResult(result)).toContain(
			"named review source is a symbolic link: docs/link-source.md",
		);
	});

	it("accepts a committed launcher-checkout absolute source and refuses untracked or changed copies", async () => {
		const f = fixture();
		const accepted = path
			.join(f.commandRepository, "docs", "guide.md")
			.replaceAll("\\", "/");
		const untracked = path
			.join(f.commandRepository, "docs", "untracked-source.md")
			.replaceAll("\\", "/");
		const changed = path
			.join(f.commandRepository, "docs", "changed-source.md")
			.replaceAll("\\", "/");
		put(f.commandRepository, "docs/changed-source.md", "head\n");
		git(f.commandRepository, "add", ".");
		git(f.commandRepository, "commit", "-m", "checkout source");
		put(f.commandRepository, "docs/changed-source.md", "working\n");
		put(f.commandRepository, "docs/untracked-source.md", "untracked\n");
		const acceptedResult = await f.check(
			f.valid.replace(
				"## Goal",
				`- **Read first, only these:**\n\n  - \`${accepted}\`\n\n## Goal`,
			),
		);
		expect(acceptedResult.ok, formatBriefResult(acceptedResult)).toBe(true);
		const result = await f.check(
			f.valid.replace(
				"## Goal",
				`- **Read first, only these:**\n\n  - \`${untracked}\`\n  - \`${changed}\`\n\n## Goal`,
			),
		);
		expect(formatBriefResult(result)).toContain(
			`absolute review source not found: ${untracked}`,
		);
		expect(formatBriefResult(result)).toContain(
			`absolute review source differs from the launcher checkout HEAD: ${changed}`,
		);
	});
});

describe("brief-references: decision item citations", () => {
	it.each([
		["single", "1. One.\n", "item 2", [2]],
		["list", "1. One.\n3. Three.\n", "items 1, 2, 3", [2]],
		["range", "1. One.\n2. Two.\n3. Three.\n4. Four.\n", "items 1-5", [5]],
		[
			"mixed list",
			"1. One.\n2. Two.\n3. Three.\n4. Four.\n",
			"items 1-2, 5 and 3-4",
			[5],
		],
	])("rejects a missing item in a %s citation", async (_shape, decisions, citation, missing) => {
		const f = fixture();
		put(f.worktree, "docs/DECISIONS.md", decisions);
		const result = await f.check(
			`${f.valid}\n\`docs/DECISIONS.md\` ${citation}.\n`,
		);
		expect(result.ok).toBe(false);
		expect(result.problems).toHaveLength(missing.length);
		for (const item of missing)
			expect(formatBriefResult(result)).toContain(
				`missing decision item ${item}`,
			);
	});

	it("accepts single, list, range and mixed citations when all items exist", async () => {
		const f = fixture();
		put(
			f.worktree,
			"docs/DECISIONS.md",
			"1. One.\n2. Two.\n3. Three.\n4. Four.\n5. Five.\n",
		);
		for (const citation of [
			"item 3",
			"items 1, 3 and 5",
			"items 1-5",
			"items 1-2, 5 and 3-4",
		])
			expect(
				(await f.check(`${f.valid}\n\`docs/DECISIONS.md\` ${citation}.\n`))
					.problems,
			).toEqual([]);
	});

	it("rejects a missing middle item in a range", async () => {
		const f = fixture();
		put(f.worktree, "docs/DECISIONS.md", "1. One.\n3. Three.\n");
		const result = await f.check(
			`${f.valid}\n\`docs/DECISIONS.md\` items 1-3.\n`,
		);
		expect(result.ok).toBe(false);
		expect(result.problems).toHaveLength(1);
		expect(formatBriefResult(result)).toContain("missing decision item 2");
	});

	it("checks decision items for absolute paths, including paths inside the named worktree", async () => {
		const f = fixture();
		const decisions = "1. One.\n2. Two.\n";
		put(f.worktree, "docs/DECISIONS.md", decisions);
		put(f.root, "absolute-DECISIONS.md", decisions);
		for (const file of [
			path.join(f.worktree, "docs/DECISIONS.md"),
			path.join(f.root, "absolute-DECISIONS.md"),
		]) {
			const absolute = file.replaceAll("\\", "/");
			const result = await f.check(
				`${f.valid}\n\`${absolute}\` items 2 and 999.\n`,
			);
			expect(result.ok).toBe(false);
			expect(result.problems).toHaveLength(1);
			expect(formatBriefResult(result)).toContain("missing decision item 999");
		}
	});

	it("ignores numbered lines inside fenced decision content", async () => {
		const f = fixture();
		put(
			f.worktree,
			"docs/DECISIONS.md",
			"1. One.\n```text\n7. Fenced example.\n```\n",
		);
		const result = await f.check(
			`${f.valid}\n\`docs/DECISIONS.md\` items 1 and 7.\n`,
		);
		expect(result.ok).toBe(false);
		expect(result.problems).toHaveLength(1);
		expect(formatBriefResult(result)).toContain("missing decision item 7");
	});

	it("does not accept a decisions file that only exists in the command repository", async () => {
		const f = fixture();
		put(f.commandRepository, "docs/DECISIONS.md", "42. Command only.\n");
		const result = await f.check(
			`${f.valid}\n\`docs/DECISIONS.md\` item 42.\n`,
		);
		expect(result.ok).toBe(false);
		expect(formatBriefResult(result)).toContain("drift: missing");
		expect(formatBriefResult(result)).toMatch(/docs[\\/]DECISIONS\.md/);
	});
});

describe("brief-format: shared environment and brief role", () => {
	it.each([
		"codex",
		"builder",
		"designer",
		"verifier",
	])("accepts role %s and ignores line-ending differences", async (role) => {
		const f = fixture();
		const text = f.valid
			.replace("role: codex", `role: ${role}`)
			.replace(/\r?\n/g, "\r\n");
		expect((await f.check(text)).ok).toBe(true);
	});

	it("rejects missing, unknown, misplaced and BOM-prefixed format headers", async () => {
		const f = fixture();
		for (const text of [
			f.valid.replace(/^.*\n/, ""),
			f.valid.replace("role: codex", "role: other"),
			`\n${f.valid}`,
			`\uFEFF${f.valid}`,
		])
			expect(formatBriefResult(await f.check(text))).toMatch(
				/:1: FAIL brief-format: must start/,
			);
	});

	it("rejects missing, duplicate, reversed markers and shared-rule drift", async () => {
		const f = fixture();
		for (const text of [
			f.valid.replace("<!-- environment:end -->", ""),
			`${f.valid}\n${environment}`,
			f.valid
				.replace("<!-- environment:start v1 -->", "<!-- environment:end -->")
				.replace(
					/<!-- environment:end -->\n\n- Work/,
					"<!-- environment:start v1 -->\n\n- Work",
				),
			f.valid.replace("Never push, fetch, switch", "Push when ready"),
		])
			expect(
				(await f.check(text)).problems.some(
					(problem: { rule: string }) => problem.rule === "brief-format",
				),
			).toBe(true);
	});

	it.each([
		"\n",
		"\r\n",
	])("fills only empty markers and preserves all other bytes with %j endings", async (eol) => {
		const f = fixture();
		const empty = f.valid
			.replace(
				environment,
				"<!-- environment:start v1 -->\n\n<!-- environment:end -->\n",
			)
			.replace(/\r?\n/g, eol);
		const expected = f.valid.replace(/\r?\n/g, eol);
		expect((await f.check(empty, true)).filled).toBe(true);
		expect(readFileSync(f.briefPath, "utf8")).toBe(expected);
		expect(readFileSync(f.briefPath)[0]).not.toBe(0xef);
		const before = readFileSync(f.briefPath);
		expect(
			(
				await checkBrief({
					repositoryRoot: f.commandRepository,
					briefPath: f.briefPath,
					fillEnvironment: true,
				})
			).filled,
		).toBe(false);
		expect(readFileSync(f.briefPath)).toEqual(before);
	});

	it("leaves nonempty drift and briefs with missing markers byte-for-byte untouched", async () => {
		const f = fixture();
		for (const text of [
			f.valid.replace("Never push", "Please push"),
			f.valid.replace(environment, ""),
		]) {
			const result = await f.check(text, true);
			expect(result.ok).toBe(false);
			expect(result.filled).toBe(false);
			expect(readFileSync(f.briefPath, "utf8")).toBe(text);
		}
	});
});

describe("brief-readiness and brief-length: launch readiness and diagnostics", () => {
	it.each([
		"coordinator checklist",
		"COORDINATOR CHECKLIST",
		"CoOrDiNaToR ChEcKlIsT",
	])("rejects the %s heading in any case", async (heading) => {
		const f = fixture();
		const text = `${f.valid}\n## ${heading} (delete before launch)\n`;
		const result = await f.check(text);
		expect(result.ok).toBe(false);
		expect(result.problems).toHaveLength(1);
		expect(result.problems[0].rule).toBe("brief-readiness");
		expect(text.split("\n")[result.problems[0].line - 1]).toBe(
			`## ${heading} (delete before launch)`,
		);
	});

	it("reports placeholders and Coordinator checklist on their exact lines", async () => {
		const f = fixture();
		const text = `${f.valid}\n<Fill goal>\n## Coordinator checklist (delete before launch)\n`;
		const result = await f.check(text);
		expect(result.problems).toHaveLength(2);
		const sourceLines = text.split("\n");
		for (const problem of result.problems)
			expect(sourceLines[problem.line - 1]).toMatch(
				/<Fill goal>|## Coordinator checklist/,
			);
		expect(
			(
				await f.check(
					`${f.valid}\n<!-- <comment placeholder> -->\n\`<code placeholder>\`\n\`\`<two-backtick placeholder>\`\`\n`,
				)
			).ok,
		).toBe(true);
	});

	it("rejects forbidden codex text in any case and allows it in other roles", async () => {
		const f = fixture();
		const text = `${f.valid}\n\`FITWAY-GRADER\` <!-- HeLd-OuT -->\n`;
		expect(
			(await f.check(text)).problems.filter(
				(problem: { rule: string }) => problem.rule === "brief-readiness",
			),
		).toHaveLength(2);
		for (const role of ["builder", "designer", "verifier"])
			expect(
				(await f.check(text.replace("role: codex", `role: ${role}`))).ok,
			).toBe(true);
	});

	it("warns at 81 lines without failing; 80 lines has no warning", async () => {
		const f = fixture();
		const base = f.valid.trimEnd().split(/\r?\n/);
		const eighty = `${[...base, ...Array(80 - base.length).fill("Detail.")].join("\n")}\n`;
		expect((await f.check(eighty)).problems).toEqual([]);
		const result = await f.check(`${eighty}Detail.\n`);
		expect(result.ok).toBe(true);
		expect(formatBriefResult(result)).toMatch(
			/:81: WARNING brief-length: 81 lines/,
		);
	});

	it.each([
		"codex",
		"builder",
		"designer",
		"verifier",
	])("fails the real %s template and names the broken rules", async (role) => {
		const result = await checkBrief({
			repositoryRoot: repository,
			briefPath: `docs/agent-context/briefs/${role}.md`,
		});
		expect(result.ok).toBe(false);
		expect(
			result.problems.some(
				(problem: { rule: string }) => problem.rule === "brief-references",
			),
		).toBe(true);
		expect(
			result.problems.some(
				(problem: { rule: string }) => problem.rule === "brief-readiness",
			),
		).toBe(true);
		for (const line of formatBriefResult(result).split("\n"))
			expect(line).toMatch(
				/:\d+: FAIL brief-(?:references|format|readiness|length):/,
			);
	});

	it("CLI returns only 0 or 1 with one numbered line per problem, including read errors", () => {
		const f = fixture();
		writeFileSync(f.briefPath, `${f.valid}\n${"detail\n".repeat(81)}`);
		const run = (args: string[]) =>
			spawnSync(process.execPath, [script, ...args], {
				cwd: f.commandRepository,
				encoding: "utf8",
				windowsHide: true,
			});
		const pass = run(["brief.md"]);
		expect(pass.status).toBe(0);
		expect(pass.stdout).toContain("WARNING brief-length");
		writeFileSync(f.briefPath, `${f.valid}\n<unfilled>\n`);
		const fail = run(["brief.md"]);
		expect(fail.status).toBe(1);
		expect(fail.stdout.trim().split("\n")).toHaveLength(1);
		expect(fail.stdout).toMatch(/:\d+: FAIL brief-readiness:/);
		const missing = run(["missing.md"]);
		expect(missing.status).toBe(1);
		expect(missing.stderr.trim().split("\n")).toHaveLength(1);
		expect(missing.stderr).toContain("brief:check:1: FAIL:");
		expect(run([]).status).toBe(1);
		expect(
			execFileSync(process.execPath, [script, "--help"], {
				cwd: f.commandRepository,
				encoding: "utf8",
				windowsHide: true,
			}),
		).toContain("Usage: pnpm brief:check");
	});

	it("accepts the pnpm separator and flag in either position; rejects ambiguous arguments", () => {
		expect(parseBriefArgs(["--", "brief.md", "--fill-environment"])).toEqual({
			briefPath: "brief.md",
			fillEnvironment: true,
		});
		expect(parseBriefArgs(["--fill-environment", "brief.md"]).briefPath).toBe(
			"brief.md",
		);
		for (const args of [
			[],
			["--unknown"],
			["one.md", "two.md"],
			["--fill-environment", "--fill-environment", "brief.md"],
		])
			expect(() => parseBriefArgs(args)).toThrow();
	});
});
