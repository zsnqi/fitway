import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkBrief, formatBriefResult } from "./check-brief.mjs";
import { designerBriefProblems } from "./designer-brief.mjs";
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

describe("design-work briefs use the maintained CLI working loop", () => {
	it.each([
		"designer",
		"builder",
		"verifier",
	])("refuses raw ui-forensics scripts in a %s brief", async (role) => {
		for (const pathLine of [
			"```powershell\nnode C:/Users/Pc Force/.agents/skills/ui-forensics/scripts/web/motion.mjs\n```",
			String.raw`C:\Users\Pc Force\.agents\skills\ui-forensics\scripts\web\motion.mjs`,
		]) {
			const result = await check(role, pathLine);
			const problem = result.problems.find((candidate: { message: string }) =>
				candidate.message.includes("ui-forensics script path"),
			);
			expect(problem?.message).toContain("pnpm verify:owner measure --page");
			expect(problem?.message).toContain(
				"pnpm verify:owner run --script <file>",
			);
		}
	});

	it("refuses direct script and server starts", async () => {
		for (const body of [
			"Run `node capture.mjs`.",
			"Run `node.exe capture.mjs`.",
			"Use `python shot.py`.",
			"Use `python3 shot.py`.",
			"Run `py -3 shot.py`.",
			"Use `python -m http.server 3188`.",
			"Use `npx serve .`.",
			"Run `node serve.mjs`.",
		]) {
			const result = await check("builder", body);
			expect(result.ok, `${body}\n${formatBriefResult(result)}`).toBe(false);
			expect(result.problems[0]?.message).toContain("pnpm verify:owner");
		}
	});

	it("refuses serve instructions that do not use the maintained server", async () => {
		for (const body of [
			"Serve the concept on port 3188.",
			"Choose a free port to serve the phone build.",
			"Start a static server for the page.",
			"Run a local server for the concept.",
			"Host the page on port 3188.",
			"`pnpm verify:owner run --script check.mjs` then serve the page.",
		]) {
			const result = await check("verifier", body);
			const problem = result.problems.find((candidate: { message: string }) =>
				candidate.message.includes("without the maintained command"),
			);
			expect(problem?.message).toContain("pnpm verify:owner serve");
		}
	});

	it("allows maintained servers, run scripts, and ui-forensics guides", async () => {
		for (const body of [
			"`pnpm verify:owner serve --concept <folder> --port 3188 --lan`",
			"`pnpm verify:owner run --script <file> --ref <commit> --out <folder>`",
			"C:/Users/Pc Force/.agents/skills/ui-forensics/references/browser-tools.md",
			String.raw`C:\Users\Pc Force\.agents\skills\ui-forensics\references\browser-tools.md`,
		]) {
			const result = await check("verifier", body);
			expect(result.ok, `${body}\n${formatBriefResult(result)}`).toBe(true);
		}
	});

	it("masks the environment and leaves codex outside the capture rule", () => {
		const inside = `<!-- environment:start v1 -->
C:/Users/Pc Force/.agents/skills/ui-forensics/scripts/web/motion.mjs
<!-- environment:end -->`;
		expect(designerBriefProblems(inside, { role: "designer" })).toEqual([]);
		expect(
			designerBriefProblems(
				"Run C:/Users/Pc Force/.agents/skills/ui-forensics/scripts/web/motion.mjs",
				{ role: "codex" },
			),
		).toEqual([]);
	});
});

describe("design-work briefs that discuss code or run tracked scripts", () => {
	const fixThreeLines = [
		"3. **Sol 3 (D7).** `servePort` in `.agents/skills/verify-fitway/serve-command.mjs` validates `--port`'s range a second",
		"   time beside the registry's option contract. The registry's `serve --port` descriptor carries the range 1024-65535",
		"   and the shared contract refuses a value outside it; `serveCommand` reads the number it is given.",
	].join("\n");
	const checksLines = [
		"From the worktree root in PowerShell: `pnpm test:verification`, `node scripts/run-vitest.mjs run",
		"scripts/agent-environment/designer-brief.test.ts scripts/agent-environment/check-staged-briefs.test.ts`,",
		"`pnpm check:tooling-map` (regenerate with `pnpm map:tooling` if the map changed), `pnpm check:code-health`, then",
	].join("\n");

	it.each([
		["fix 3's lines", fixThreeLines],
		["the Checks line", checksLines],
		[
			"a fenced repository script",
			"```powershell\nnode .agents/skills/verify-fitway/cli.mjs help\n```",
		],
	])("allows %s in a builder brief", async (_name, body) => {
		const result = await check("builder", body);
		expect(result.ok, formatBriefResult(result)).toBe(true);
	});

	it.each([
		[
			"a fenced temp server",
			"```powershell\nnode D:/fitway-temp/x/serve.mjs\n```",
			"starts its own server",
		],
		[
			"a fenced temp script",
			"```powershell\nnode D:/fitway-temp/x/check.mjs\n```",
			"runs a script directly",
		],
		[
			"a profile script",
			'Run `node "C:/Users/Pc Force/tools/shot.mjs"`.',
			"runs a script directly",
		],
		[
			"a single-quoted temp script",
			"Run `node 'D:/fitway-temp/x/check.mjs'`.",
			"runs a script directly",
		],
		[
			"a home-folder script",
			"Run `node ~/tools/shot.mjs`.",
			"runs a script directly",
		],
		[
			"a script escaping scripts/",
			"Run `node scripts/../../x/shot.mjs`.",
			"runs a script directly",
		],
		[
			"serve guidance in prose",
			"Then serve the page on port 4100.",
			"without the maintained command",
		],
	])("still refuses %s", async (_name, body, message) => {
		const result = await check("builder", body);
		expect(
			result.problems.some((problem: { message: string }) =>
				problem.message.includes(message),
			),
			formatBriefResult(result),
		).toBe(true);
	});
});
