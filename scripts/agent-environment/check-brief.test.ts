import { execFileSync, spawnSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
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

afterEach(() => {
	for (const root of roots.splice(0)) {
		const absolute = path.resolve(root);
		const relative = path.relative(path.resolve(tmpdir()), absolute);
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

describe("B1: resolve a brief against its named Git worktree", () => {
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
			/:4: FAIL B1:.*non-Markdown paths: build.js/,
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
		).toMatch(/B1: worktree does not exist/);
		expect(
			formatBriefResult(
				await f.check(f.valid.replace("`feature/build`", "`wrong/branch`")),
			),
		).toMatch(/B1: branch mismatch/);
		expect(
			formatBriefResult(
				await f.check(f.valid.replace(`\`${f.head}\``, "`--help`")),
			),
		).toMatch(/B1: HEAD must be a commit hash/);
		expect(
			formatBriefResult(
				await f.check(f.valid.replace(`\`${f.head}\``, "`deadbeef`")),
			),
		).toMatch(/B1: named HEAD.*missing/);
		put(f.commandRepository, "coordinator-only.md", "# New commit\n");
		git(f.commandRepository, "add", "coordinator-only.md");
		git(f.commandRepository, "commit", "-m", "coordinator ahead");
		const future = git(f.commandRepository, "rev-parse", "--short", "HEAD");
		expect(
			formatBriefResult(
				await f.check(f.valid.replace(`\`${f.head}\``, `\`${future}\``)),
			),
		).toMatch(/B1: named HEAD.*not an ancestor/);
		git(f.worktree, "checkout", "--detach");
		expect(formatBriefResult(await f.check())).toContain(
			"found <detached HEAD>",
		);
	});

	it("reports drift with both repositories and fails missing relative and absolute paths", async () => {
		const f = fixture();
		put(f.commandRepository, "docs/coordinator-only.md", "# Drift\n");
		const absent = path
			.join(path.dirname(process.execPath), "fitway-absent-brief-fixture.md")
			.replaceAll("\\", "/");
		const result = await f.check(
			`${f.valid}\n\`docs/coordinator-only.md\`\n\`docs/missing.md\`\n\`${absent}\`\n`,
		);
		expect(result.problems).toHaveLength(3);
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

describe("B2: shared environment and brief role", () => {
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
				/:1: FAIL B2: must start/,
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
					(problem: { rule: string }) => problem.rule === "B2",
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

describe("B3 and B4: launch readiness and diagnostics", () => {
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
		expect(result.problems[0].rule).toBe("B3");
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
				(problem: { rule: string }) => problem.rule === "B3",
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
		expect(formatBriefResult(result)).toMatch(/:81: WARNING B4: 81 lines/);
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
				(problem: { rule: string }) => problem.rule === "B1",
			),
		).toBe(true);
		expect(
			result.problems.some(
				(problem: { rule: string }) => problem.rule === "B3",
			),
		).toBe(true);
		for (const line of formatBriefResult(result).split("\n"))
			expect(line).toMatch(/:\d+: FAIL B[1-4]:/);
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
		expect(pass.stdout).toContain("WARNING B4");
		writeFileSync(f.briefPath, `${f.valid}\n<unfilled>\n`);
		const fail = run(["brief.md"]);
		expect(fail.status).toBe(1);
		expect(fail.stdout.trim().split("\n")).toHaveLength(1);
		expect(fail.stdout).toMatch(/:\d+: FAIL B3:/);
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
