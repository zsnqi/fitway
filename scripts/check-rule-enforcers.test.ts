import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	checkRuleEnforcers,
	RULE_ENFORCERS_PATH,
} from "./agent-environment/rule-enforcers.mjs";

const roots: string[] = [];

afterEach(() => {
	for (const root of roots.splice(0))
		rmSync(root, { recursive: true, force: true });
});

function fixture({
	command = "check:real",
	script = "node scripts/check.mjs",
	files = ["scripts/check.mjs"],
	rowFiles = "`scripts/check.mjs`",
}: {
	command?: string;
	script?: string;
	files?: string[];
	rowFiles?: string;
} = {}) {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-rule-enforcers-"));
	roots.push(root);
	for (const file of files) {
		const target = path.join(root, file);
		mkdirSync(path.dirname(target), { recursive: true });
		writeFileSync(target, "");
	}
	writeFileSync(
		path.join(root, "package.json"),
		`${JSON.stringify({ scripts: { "check:real": script } })}\n`,
	);
	const table = path.join(root, RULE_ENFORCERS_PATH);
	mkdirSync(path.dirname(table), { recursive: true });
	writeFileSync(
		table,
		[
			"# Rule enforcers",
			"",
			"| Rule | Source | Enforced by | Where it fails |",
			"| --- | --- | --- | --- |",
			`| A rule | AGENTS.md | \`pnpm ${command}\` | ${rowFiles} |`,
			"| A written rule | AGENTS.md | written only |  |",
			"",
		].join("\n"),
	);
	return root;
}

describe("rule-enforcer validation", () => {
	it("accepts a defined command with an existing repository file", () => {
		expect(checkRuleEnforcers({ root: fixture() })).toEqual([]);
	});

	it("fails a renamed pnpm command and names the row", () => {
		const root = fixture({ command: "check:renamed" });
		const errors = checkRuleEnforcers({ root });
		expect(errors).toHaveLength(1);
		expect(errors[0]).toContain(RULE_ENFORCERS_PATH);
		expect(errors[0]).toContain('row "A rule"');
		expect(errors[0]).toContain('"check:renamed"');
	});

	it("fails a defined command whose repository file is missing", () => {
		const root = fixture({ files: [] });
		const errors = checkRuleEnforcers({ root });
		expect(errors).toHaveLength(2);
		expect(errors.some((error) => error.includes("scripts/check.mjs"))).toBe(
			true,
		);
		expect(errors.some((error) => error.includes('"check:real"'))).toBe(true);
	});

	it("fails a cell that names a missing file", () => {
		const root = fixture({
			script: "written only",
			files: [],
			rowFiles: "`scripts/missing.mjs:12`",
		});
		const errors = checkRuleEnforcers({ root });
		expect(errors).toEqual([
			`${RULE_ENFORCERS_PATH}:5: row "A rule" names missing file: scripts/missing.mjs`,
		]);
	});

	it("passes a row enforced only in writing", () => {
		const root = fixture({
			script: "written only",
			files: [],
			rowFiles: "",
		});
		expect(checkRuleEnforcers({ root })).toEqual([]);
	});
});
