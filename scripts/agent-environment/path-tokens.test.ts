import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkBrief, formatBriefResult } from "./check-brief.mjs";
import { git, put } from "./fixtures";
import { validateResumePoint } from "./resume-point.mjs";

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
let root: string;
let commandRepository: string;
let worktree: string;
let foreignRepository: string;
let brief: string;
const resume = `<!-- handoff-format: resume-point-v1 -->
# Fixture resume point
- **As of:** \`feature/build\` at \`a1b2c3d\`
- **Previous resume point:** \`DECISIONS.md\`
- **Standing decisions:** \`DECISIONS.md\`
## State
## Running now
## Next steps
## Waiting on the user
## Known risks
## Pointers
`;

function initialize(directory: string) {
	mkdirSync(directory);
	put(directory, environmentPath, environment);
	git(directory, "init", "--initial-branch=coordinator");
	git(directory, "config", "user.name", "Path token fixture");
	git(directory, "config", "user.email", "path-tokens@example.invalid");
	git(directory, "config", "commit.gpgsign", "false");
	git(directory, "config", "core.hooksPath", path.join(root, "empty-hooks"));
}

// Git fixture setup launches multiple processes during the full scripts suite.
beforeAll(() => {
	root = mkdtempSync(path.join(tmpdir(), "fitway-path-tokens-test-"));
	commandRepository = path.join(root, "coordinator");
	worktree = path.join(root, "build");
	foreignRepository = path.join(root, "foreign");
	initialize(commandRepository);
	for (const file of [
		"DECISIONS.md",
		"docs/branch.md",
		"docs/nested/unique.md",
		"docs/a/repeated/file.md",
		"docs/b/repeated/file.md",
		"eclipse/tools/first.mjs",
		"eclipse/tools/second.mjs",
	])
		put(commandRepository, file, "# Fixture\n");
	git(commandRepository, "add", ".");
	git(commandRepository, "commit", "-m", "fixture paths");
	const head = git(commandRepository, "rev-parse", "--short", "HEAD");
	git(commandRepository, "worktree", "add", "-b", "feature/build", worktree);
	git(worktree, "branch", "docs/branch.md");
	git(worktree, "update-ref", "refs/remotes/origin/feature/remote", "HEAD");
	put(worktree, "docs/untracked/file.md", "# Untracked\n");
	put(worktree, "feature/build", "# Existing branch-named file\n");
	initialize(foreignRepository);
	put(
		foreignRepository,
		"origin/feature/remote",
		"# Command repository only\n",
	);
	git(foreignRepository, "add", ".");
	git(foreignRepository, "commit", "-m", "foreign fixture");
	git(foreignRepository, "branch", "feature/command-only");
	brief = `<!-- brief-format: v1 role: codex -->
# Fixture brief
- **Worktree:** \`${worktree.replaceAll("\\", "/")}\`, branch \`feature/build\`, HEAD \`${head}\`
${environment}
## Goal
`;
}, 60_000);

afterAll(() => {
	if (!root) return;
	const relative = path.relative(path.resolve(tmpdir()), path.resolve(root));
	if (
		relative.startsWith("..") ||
		path.isAbsolute(relative) ||
		!relative.startsWith("fitway-path-tokens-test-")
	)
		throw new Error(`Unsafe fixture cleanup: ${root}`);
	rmSync(root, { recursive: true, force: true });
});

async function check(token: string, prefix = "Input: ") {
	const briefPath = path.join(foreignRepository, "brief.md");
	put(foreignRepository, "brief.md", `${brief}\n${prefix}\`${token}\`\n`);
	return checkBrief({ repositoryRoot: foreignRepository, briefPath });
}

function validate(token: string, prefix = "Input: ") {
	return validateResumePoint({
		repositoryRoot: worktree,
		handoffPath: "resume.md",
		bytes: Buffer.from(`${resume}\n${prefix}\`${token}\`\n`),
	});
}

const tokens = [
	["P1", "@playwright/test", false],
	["P1", "@playwright/test@1.56.0", false],
	["P1", "@scope/package@^2.0.0-beta.1", false],
	["P1", "@scope/package@latest", false],
	["P1", "vitest", false],
	["P1", "vitest@4.0.0", false],
	["P1", "vitest@next", false],
	["P2", "origin/feature/remote", false],
	["P2", "remotes/origin/feature/remote", false],
	["P2", "refs/remotes/origin/feature/remote", false],
	["P2", "refs/heads/feature/build", false],
	["P2", "feature/unknown", true],
	["P2", "feature/command-only", true],
	["P3", "missing.md", false],
	["P3", "check-brief.mjs", false],
	["P3", "core.longpaths", false],
	["P3", "missing.md:999", false],
	["P3", 'missing.md §"Missing"', false],
	["P3", ".missing", false],
	["P3", "LICENSE", false],
	["P3", "Makefile", false],
	["P4", "tools/", true],
	["P4", "nested/unique.md", true],
	["P5", "docs/missing.md", true],
	["P5", "docs\\missing.md", true],
	["P5", "docs/missing file.md", true],
	["P5", "docs/missing.md:10", true],
	["P5", 'docs/missing.md §"Heading"', true],
	["P5", "../outside.md", true],
	["P5", "/api", false],
	["P5", "https://example.invalid/file.md", false],
	["P5", "docs/<run>/missing.md", false],
	["P5", "D:/fitway-temp/missing.md", false],
	["P5", "pnpm biome ci apps/packages/scripts", false],
	["P5", "pwsh scripts/missing.ps1", false],
	["P5", "1.0.0-beta.1", false],
] as const;

describe("P5: shared token decisions through both validators", () => {
	it.each(
		tokens,
	)("%s: token %s is a path: %s", async (_outcome, token, isPath) => {
		const result = await check(token);
		expect(result.ok).toBe(!isPath);
		if (isPath)
			await expect(validate(token)).rejects.toThrow(
				token.replaceAll("\\", "/").split(/[ :]/)[0],
			);
		else await expect(validate(token)).resolves.toBe(true);
	});
	it("P2: skips local and remote branches at every line position", async () => {
		git(worktree, "branch", "feature/local");
		for (const token of ["feature/local", "origin/feature/remote"])
			for (const prefix of ["", "Input: ", "branch ", "Compared with "]) {
				expect((await check(token, prefix)).problems).toEqual([]);
				await expect(validate(token, prefix)).resolves.toBe(true);
			}
		await expect(validate("feature/unknown", "branch ")).rejects.toThrow(
			"feature/unknown",
		);
	});
	it("P2: an existing path wins over a matching branch", async () => {
		expect((await check("feature/build")).ok).toBe(true);
		await expect(validate("feature/build")).resolves.toBe(true);
		const result = await check("docs/branch.md:999");
		expect(formatBriefResult(result)).toContain("exceeds file length");
	});
	it.each([
		"Previous resume point",
		"Standing decisions",
	])("P3: keeps bare paths checked on the %s header", async (header) => {
		await expect(
			validateResumePoint({
				repositoryRoot: worktree,
				handoffPath: "resume.md",
				bytes: Buffer.from(
					resume.replace(
						`- **${header}:** \`DECISIONS.md\``,
						`- **${header}:** \`missing.md\``,
					),
				),
			}),
		).rejects.toThrow("missing.md");
	});
	it.each([
		["tools/", "eclipse/tools"],
		["nested/unique.md", "docs/nested/unique.md"],
	])("P4: rejects %s with root guidance and one tracked suffix", async (token, suggestion) => {
		const result = await check(token);
		const message = result.problems[0]?.message;
		expect(message).toContain("repository root or as absolute paths");
		expect(message).toContain(
			`tracked suffix match: ${path.resolve(worktree, suggestion)}`,
		);
		await expect(validate(token)).rejects.toThrow(
			"repository root or as absolute paths",
		);
		await expect(validate(token)).rejects.toThrow(
			`tracked suffix match: ${path.resolve(worktree, suggestion)}`,
		);
	});
	it.each([
		"repeated/file.md",
		"repeated/",
		"untracked/file.md",
		"untracked/",
	])("P4: gives no suffix suggestion for ambiguous or untracked %s", async (token) => {
		expect((await check(token)).problems[0]?.message).not.toContain(
			"tracked suffix match:",
		);
		await expect(validate(token)).rejects.not.toThrow("tracked suffix match:");
	});
	it("P5: agrees on existing and missing absolute paths", async () => {
		const existing = script.replaceAll("\\", "/");
		const missing = path
			.join(repository, "scripts/agent-environment/missing.md")
			.replaceAll("\\", "/");
		expect((await check(existing)).ok).toBe(true);
		await expect(validate(existing)).resolves.toBe(true);
		expect((await check(missing)).ok).toBe(false);
		await expect(validate(missing)).rejects.toThrow("missing.md");
	});
	it("P1/P2: Node CLI resolves refs in the named worktree from either repository", () => {
		const briefPath = path.join(foreignRepository, "cli.md");
		put(
			foreignRepository,
			"cli.md",
			`${brief}\n\`@playwright/test@latest\` and \`origin/feature/remote\`\n`,
		);
		for (const cwd of [worktree, commandRepository, foreignRepository]) {
			const result = spawnSync(process.execPath, [script, briefPath], {
				cwd,
				encoding: "utf8",
				windowsHide: true,
			});
			expect(result.status, result.stdout + result.stderr).toBe(0);
			expect(result.stdout).toContain("PASS brief:check");
		}
	});
});
