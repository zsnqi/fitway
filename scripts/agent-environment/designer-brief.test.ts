import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkBrief, formatBriefResult } from "./check-brief.mjs";
import { readGit } from "./git-context.mjs";

const repository = fileURLToPath(new URL("../../", import.meta.url));
const environment = readFileSync(
	path.join(repository, "docs/agent-context/briefs/ENVIRONMENT.md"),
	"utf8",
);
const head = readGit(repository, ["rev-parse", "HEAD"]);
const branch = readGit(repository, ["symbolic-ref", "--short", "HEAD"]);
const worktree = repository.replaceAll("\\", "/");

function briefText(role: string, body: string) {
	return `<!-- brief-format: v1 role: ${role} -->
# Designer brief: fixture

- **Worktree:** \`${worktree}\`, branch \`${branch}\`, HEAD \`${head}\`

${environment}
## The question

${body}
`;
}

async function check(role: string, body: string) {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-designer-brief-"));
	try {
		const brief = path.join(root, "brief.md");
		writeFileSync(brief, briefText(role, body));
		return await checkBrief({ repositoryRoot: repository, briefPath: brief });
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}

const refusedPhrases: Array<[string, string]> = [
	["node script", "Use a node script."],
	["node scripts", "Use node scripts."],
	["capture script", "Use a capture script."],
	["capture scripts", "Use capture scripts."],
	["render script", "Use a render script."],
	["render scripts", "Use render scripts."],
	["rendering script", "Use a rendering script."],
	["rendering scripts", "Use rendering scripts."],
	["screenshot script", "Use a screenshot script."],
	["screenshot scripts", "Use screenshot scripts."],
	["sheet script", "Use a sheet script."],
	["sheet scripts", "Use sheet scripts."],
	["frame script", "Use a frame script."],
	["frame scripts", "Use frame scripts."],
	["your own script", "Use your own script."],
	["your own scripts", "Use your own scripts."],
	["write a script", "Write a script for it."],
	["that you write", "Use the checker that you write."],
	["you write yourself", "Use the helper you write yourself."],
	["in the style of", "Render in the style of `D:/fitway-temp/...`."],
	["in the style of", String.raw`Render in the style of D:\fitway-temp\...`],
	["playwright", "Use @playwright/test for this."],
];

describe("designer brief capture-tool requests", () => {
	it("refuses the real sketch 25 request at its source line", async () => {
		const result = await checkBrief({
			repositoryRoot: repository,
			briefPath:
				"docs/phase-records/handoffs/public-redesign/briefs/designer-public-sketch-25.md",
		});
		const problem = result.problems.find(
			(candidate: { line: number; message: string }) =>
				candidate.line === 114 &&
				candidate.message.includes("hand-built capture work"),
		);
		expect(problem?.message).toContain('"node scripts"');
		expect(problem?.message).toContain(
			"Render with the `pnpm verify:owner` commands",
		);
	});

	it.each(refusedPhrases)("refuses %s", async (phrase, body) => {
		const designer = await check("designer", body);
		const problem = designer.problems.find((candidate: { message: string }) =>
			candidate.message.includes("pnpm verify:owner"),
		);
		expect(problem?.message.toLowerCase()).toContain(phrase.toLowerCase());
		expect(problem?.message).toContain(
			"`.agents/skills/verify-fitway/SKILL.md`",
		);

		const builder = await check("builder", body);
		expect(
			builder.problems.filter((candidate: { message: string }) =>
				candidate.message.includes("hand-built capture work"),
			),
		).toEqual([]);
		expect(builder.ok, formatBriefResult(builder)).toBe(true);
	});

	it("accepts rendered frames named through the registered command", async () => {
		const result = await check(
			"designer",
			"Render the frames with `pnpm verify:owner frames`.",
		);
		expect(result.ok, formatBriefResult(result)).toBe(true);
	});

	it("refuses frame work when verify:owner has no command", async () => {
		const result = await check(
			"designer",
			"Render the frames with `pnpm verify:owner`.",
		);
		expect(
			result.problems.some(
				(problem: { rule: string; message: string }) =>
					problem.rule === "brief-readiness" &&
					problem.message.includes("without a registered"),
			),
		).toBe(true);
	});

	it("ignores Playwright and frame words in the shared environment", async () => {
		const result = await check("designer", "Choose two clear directions.");
		expect(result.ok, formatBriefResult(result)).toBe(true);
	});

	it("accepts a designer brief that asks for no frame work", async () => {
		const result = await check(
			"designer",
			"Describe the two directions and where each one breaks.",
		);
		expect(result.ok, formatBriefResult(result)).toBe(true);
	});

	it("judges inline and fenced code as brief prose", async () => {
		const result = await check(
			"designer",
			"Use `node scripts`.\n\n```sh\nnode scripts/capture.mjs\n```",
		);
		expect(
			result.problems.filter((problem: { message: string }) =>
				problem.message.includes("hand-built capture work"),
			).length,
		).toBeGreaterThan(0);
	});
});
