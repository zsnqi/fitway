import { execFileSync } from "node:child_process";
import {
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	checkStagedEvidence,
	stagedEvidenceFailures,
} from "./check-staged-evidence.mjs";

const header = (role: string) => `<!-- brief-format: v1 role: ${role} -->\n`;

function git(root: string, ...args: string[]) {
	execFileSync("git", args, {
		cwd: root,
		stdio: "ignore",
		windowsHide: true,
	});
}

async function stagedBrief(role: string, body: string) {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-staged-brief-"));
	git(root, "init", "-q");
	git(root, "config", "user.email", "test@example.com");
	git(root, "config", "user.name", "Test");
	await mkdir(path.join(root, "briefs"));
	const file = path.join(root, "briefs", `${role}.md`);
	writeFileSync(file, `${header(role)}${body}\n`);
	git(root, "add", "briefs");
	const result = await checkStagedEvidence({
		checkout: root,
		exists: existsSync,
		holdsCommit: () => false,
		readFile,
		stat: statSync,
	});
	return {
		root,
		problems: result.designerProblems,
		failures: stagedEvidenceFailures(result),
	};
}

describe("staged design-work briefs", () => {
	it.each(["builder", "verifier"])("checks a new %s brief", async (role) => {
		const result = await stagedBrief(
			role,
			"C:/Users/Pc Force/.agents/skills/ui-forensics/scripts/web/motion.mjs",
		);
		try {
			expect(
				result.problems.some((problem: { message: string }) =>
					problem.message.includes("ui-forensics script path"),
				),
			).toBe(true);
			expect(result.failures.join("\n")).toContain(
				"pnpm verify:owner measure --page",
			);
		} finally {
			rmSync(result.root, { recursive: true, force: true });
		}
	});

	it("leaves a new codex brief outside the rule", async () => {
		const result = await stagedBrief(
			"codex",
			"node C:/Users/Pc Force/.agents/skills/ui-forensics/scripts/web/motion.mjs",
		);
		try {
			expect(result.problems).toEqual([]);
		} finally {
			rmSync(result.root, { recursive: true, force: true });
		}
	});

	it("judges only added lines in a modified brief", async () => {
		const result = await stagedBrief(
			"builder",
			"node C:/Users/Pc Force/.agents/skills/ui-forensics/scripts/web/motion.mjs",
		);
		try {
			git(result.root, "commit", "-qm", "base");
			const file = path.join(result.root, "briefs", "builder.md");
			writeFileSync(
				file,
				`${readFileSync(file, "utf8")}Use the maintained command.\n`,
			);
			git(result.root, "add", "briefs/builder.md");
			const changed = await checkStagedEvidence({
				checkout: result.root,
				exists: existsSync,
				holdsCommit: () => false,
				readFile,
				stat: statSync,
			});
			expect(changed.designerProblems).toEqual([]);
		} finally {
			rmSync(result.root, { recursive: true, force: true });
		}
	});
});
