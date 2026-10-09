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
import { git, gitFixture } from "./fixtures";
import {
	MAX_RESUME_POINT_BYTES,
	RESUME_POINT_MARKER,
	validateActiveResumePoints,
	validateResumePoint,
} from "./resume-point.mjs";

const roots: string[] = [];
const template = readFileSync(
	fileURLToPath(
		new URL("../../docs/agent-context/HANDOFF_TEMPLATE.md", import.meta.url),
	),
	"utf8",
);
const block = template.match(
	/<!-- template:start -->\r?\n([\s\S]*?)<!-- template:end -->/,
)?.[1];
if (!block) throw new Error("Missing template block");
const valid = block
	.replaceAll("<milestone-id>", "fixture-r01")
	.replaceAll("<branch>", "main")
	.replaceAll("<short sha>", "a1b2c3d")
	.replaceAll("<YYYY-MM-DD HH:MM>", "2026-10-02 20:40")
	.replaceAll("<absolute path>", "D:/fitway-temp/fixture")
	.replaceAll("<repo path>", "DECISIONS.md")
	.replaceAll("<repo path to the milestone's DECISIONS.md>", "DECISIONS.md")
	.replace(
		"What exists now and what was last delivered, with commit hashes.",
		"Delivered a1b2c3d.",
	)
	.replace(
		'Agents, Codex rounds or jobs in flight, and where their output will land. "Nothing." if none.',
		"Nothing.",
	)
	.replace(
		"Decided steps only, in order; each names its inputs by path and section.",
		"Read `DECISIONS.md`.",
	)
	.replace(
		'Questions or picks the user owes, each answerable in one line. "Nothing." if none.',
		"Nothing.",
	)
	.replace(
		/Traps the next session would otherwise rediscover: environment quirks, defects already in\s+the\s+baseline, assumptions not yet measured\./,
		"Nothing.",
	);
const placeholders = [
	...new Set([...block.matchAll(/<(?!!)[^>\r\n]+>/g)].map((match) => match[0])),
	...block
		.split(/^## [^\r\n]+\r?$/m)
		.slice(1, 6)
		.map((section) => section.trim().replace(/^1\. /, "")),
];

afterEach(() => {
	for (const root of roots.splice(0))
		rmSync(root, { recursive: true, force: true });
});

function fixture() {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-resume-point-test-"));
	roots.push(root);
	writeFileSync(path.join(root, "DECISIONS.md"), "Standing decisions.\n");
	mkdirSync(path.join(root, "docs/agent-context"), { recursive: true });
	writeFileSync(
		path.join(root, "docs/agent-context/WORKING_AGREEMENTS.md"),
		"Agreements.\n",
	);
	return root;
}

function validate(root: string, text: string | Buffer = valid) {
	return validateResumePoint({
		repositoryRoot: root,
		handoffPath: "resume.md",
		bytes: Buffer.from(text),
	});
}

describe("O5: marked active resume point validation", () => {
	it.each([
		{ milestoneId: "fixture-r01", status: "IN_PROGRESS" },
		{ milestoneId: "fixture_with-underscores-r01", status: "PLANNED" },
		{ milestoneId: "resume", status: "IN_PROGRESS" },
	])("S1: the canonical active handoff for $milestoneId requires its marker", async ({
		milestoneId,
		status,
	}) => {
		const root = fixture();
		const handoff = `docs/agent-context/20261002-204012-${milestoneId}-resume.md`;
		writeFileSync(
			path.join(root, handoff),
			valid.replace(RESUME_POINT_MARKER, ""),
		);
		const state = { milestones: { [milestoneId]: { handoff, status } } };
		await expect(
			validateActiveResumePoints({ repositoryRoot: root, state }),
		).rejects.toThrow(
			`${handoff}: resume point is missing required marker: ${RESUME_POINT_MARKER}`,
		);
		writeFileSync(
			path.join(root, handoff),
			"## State\n## Running now\n## Next steps\n## Pointers\n",
		);
		await expect(
			validateActiveResumePoints({ repositoryRoot: root, state }),
		).rejects.toThrow(/missing required marker/);
		writeFileSync(path.join(root, handoff), valid);
		await expect(
			validateActiveResumePoints({ repositoryRoot: root, state }),
		).resolves.toBe(1);
	});
	it.each([
		"20261002-204012-fixture-r01-coordinator-resume.md",
		"20261002-204012-fixture-r01-resume-activation.md",
		"20261002-204012-fixture-r01-round_1.md",
		"20261002-204012-another-r01-resume.md",
		"2026102-204012-fixture-r01-resume.md",
		"20261002-20401-fixture-r01-resume.md",
		"prefix-20261002-204012-fixture-r01-resume.md",
		"20261002-204012-fixture-r01-resume.md.backup",
		"20261002-204012-fixture-r01-resume.MD",
		"resume.md",
	])("S1: leaves other unmarked active handoff names unchanged: %s", async (filename) => {
		const root = fixture();
		const handoff = `docs/agent-context/${filename}`;
		writeFileSync(path.join(root, handoff), `local_old ${"a".repeat(20_000)}`);
		await expect(
			validateActiveResumePoints({
				repositoryRoot: root,
				state: { milestones: { "fixture-r01": { handoff } } },
			}),
		).resolves.toBe(0);
	});
	it.each(
		placeholders,
	)("S2: rejects the template placeholder %s and names its line", async (placeholder) => {
		const text = `${valid}\n${placeholder}\n`;
		const line = text.slice(0, text.indexOf(placeholder)).split(/\r?\n/).length;
		await expect(validate(fixture(), text)).rejects.toThrow(
			new RegExp(`line ${line}:.*template placeholder`),
		);
	});
	it("S2: rejects the unedited template", async () => {
		await expect(validate(fixture(), block)).rejects.toThrow(
			/line 2:.*template placeholder/,
		);
	});
	it.each([
		"",
		"`docs/agent-context/WORKING_AGREEMENTS.md`",
		"`missing/DECISIONS.md`",
		"`DECISIONS.md/*`",
		"`docs/agent-context/DECISIONS.md`",
	])("S2: requires an existing DECISIONS.md file on the standing-decisions line: %s", async (value) => {
		const root = fixture();
		mkdirSync(path.join(root, "docs/agent-context/DECISIONS.md"));
		await expect(
			validate(
				root,
				valid.replace(
					/^- \*\*Standing decisions:\*\*[^\r\n]*/m,
					`- **Standing decisions:** ${value}`,
				),
			),
		).rejects.toThrow(/Standing decisions.*existing DECISIONS\.md file/);
	});
	it("S2: accepts filename patterns in angle brackets that are not template placeholders", async () => {
		await expect(
			validate(fixture(), `${valid}\nPattern: \`docs/<run>/file.md\`\n`),
		).resolves.toBe(true);
	});
	it("accepts the real template sections and existing file paths in LF and CRLF", async () => {
		const root = fixture();
		await expect(validate(root)).resolves.toBe(true);
		await expect(validate(root, valid.replace(/\r?\n/g, "\r\n"))).resolves.toBe(
			true,
		);
	});
	it("measures bytes, accepts exactly 12,288 and rejects 12,289", async () => {
		const root = fixture();
		const sized =
			valid + "a".repeat(MAX_RESUME_POINT_BYTES - Buffer.byteLength(valid));
		await expect(validate(root, sized)).resolves.toBe(true);
		await expect(validate(root, `${sized}a`)).rejects.toThrow(
			/exceeds 12288 bytes/,
		);
		await expect(validate(root, valid + "كمّل".repeat(2000))).rejects.toThrow(
			/exceeds 12288 bytes/,
		);
	});
	it.each([
		"As of",
		"Standing decisions",
	])("rejects missing or duplicate %s header lines", async (name) => {
		const root = fixture();
		const line = valid
			.split(/\r?\n/)
			.find((line) => line.startsWith(`- **${name}:**`));
		if (!line) throw new Error("Missing fixture header");
		await expect(validate(root, valid.replace(line, ""))).rejects.toThrow(
			/header lines in order/,
		);
		await expect(
			validate(root, valid.replace(line, `${line}\n${line}`)),
		).rejects.toThrow(/header lines in order/);
	});
	it("M4: accepts both header formats and never follows the previous resume pointer", async () => {
		const root = fixture();
		await expect(validate(root, valid)).resolves.toBe(true);
		await expect(
			validate(
				root,
				valid.replace(
					"- **Standing decisions:**",
					"- **Previous resume point:** `gone/previous.md`\n- **Standing decisions:**",
				),
			),
		).resolves.toBe(true);
	});
	it("M4: the stable filename also requires a resume marker", async () => {
		const root = fixture();
		await expect(
			validateResumePoint({
				repositoryRoot: root,
				handoffPath: "fixture-r01-resume.md",
				milestoneId: "fixture-r01",
				bytes: Buffer.from(valid.replace(RESUME_POINT_MARKER, "")),
			}),
		).rejects.toThrow(/missing required marker/);
	});
	it("rejects reordered or misplaced headers", async () => {
		const root = fixture();
		await expect(
			validate(
				root,
				valid
					.replace("- **As of:**", "- **Temporary:**")
					.replace("- **Standing decisions:**", "- **As of:**")
					.replace("- **Temporary:**", "- **Standing decisions:**"),
			),
		).rejects.toThrow(/header lines in order/);
		const lines = valid.split(/\r?\n/);
		const header = lines.splice(
			lines.findIndex((line) => line.startsWith("- **Standing decisions:**")),
			1,
		)[0];
		await expect(
			validate(root, `${lines.join("\n")}\n${header}`),
		).rejects.toThrow(/six sections in order/);
	});
	it.each([
		"State",
		"Running now",
		"Next steps",
		"Waiting on the user",
		"Known risks",
		"Pointers",
	])("rejects missing or duplicate %s section", async (name) => {
		const root = fixture();
		await expect(
			validate(root, valid.replace(`## ${name}`, `### ${name}`)),
		).rejects.toThrow(/six sections in order/);
		await expect(validate(root, `${valid}\n## ${name}\n`)).rejects.toThrow(
			/six sections in order/,
		);
	});
	it("rejects reordered and unexpected sections", async () => {
		const root = fixture();
		await expect(
			validate(
				root,
				valid
					.replace("## State", "## Running now")
					.replace("## Running now\n\nNothing", "## State\n\nNothing"),
			),
		).rejects.toThrow(/six sections in order/);
		await expect(validate(root, `${valid}\n## Extra\n`)).rejects.toThrow(
			/six sections in order/,
		);
	});
	it.each([
		"docs/missing.md",
		"docs/missing file.md",
		"../outside.md",
	])("rejects missing or escaping path %s", async (file) => {
		await expect(
			validate(fixture(), `${valid}\n- Input: \`${file}\`\n`),
		).rejects.toThrow(/missing or unsafe repository path/);
	});
	it("accepts existing paths with spaces and extensionless root files", async () => {
		const root = fixture();
		writeFileSync(path.join(root, "docs/input file.md"), "Input.\n");
		writeFileSync(path.join(root, "LICENSE"), "License.\n");
		await expect(
			validate(root, `${valid}\n\`docs/input file.md\` \`LICENSE\`\n`),
		).resolves.toBe(true);
	});
	it("rejects a git-ignored file present on disk, and accepts a tracked file in an ignored folder", async () => {
		const root = fixture();
		gitFixture(root);
		writeFileSync(path.join(root, ".gitignore"), ".env\nconfig/\n");
		mkdirSync(path.join(root, "server"));
		writeFileSync(path.join(root, "server/.env"), "SECRET=placeholder\n");
		mkdirSync(path.join(root, "config"));
		writeFileSync(path.join(root, "config/agent.md"), "Agent.\n");
		git(root, "add", "-f", ".gitignore", "config/agent.md");
		git(root, "commit", "-m", "tracked file in an ignored folder");
		await expect(
			validate(root, `${valid}\n- Local: \`server/.env\`\n`),
		).rejects.toThrow(
			/git-ignored path, present on this disk and absent in CI: server\/\.env/,
		);
		await expect(
			validate(root, `${valid}\n- Tracked: \`config/agent.md\`\n`),
		).resolves.toBe(true);
	});
	it("skips bare mentions, temp paths, placeholders, commands and hashes", async () => {
		const root = fixture();
		gitFixture(root);
		const text =
			valid.replace("`main`", "`feature/resume`") +
			"\n`missing.md` `.missing` `LICENSE` `Makefile` `D:/fitway-temp/absent.md` `/api` `docs/<run>/file.md` `pnpm check:repository` `a1b2c3d`\n";
		await expect(validate(root, text)).resolves.toBe(true);
	});
	it("rejects stale local_ session ids anywhere, including outside backticks", async () => {
		await expect(
			validate(fixture(), `${valid}\nSession local_deadbeef-123.\n`),
		).rejects.toThrow(/stale local_ session id/);
	});
	it("checks every active marked handoff, including PLANNED, but leaves legacy handoffs unchecked", async () => {
		const root = fixture();
		writeFileSync(path.join(root, "first.md"), valid);
		writeFileSync(
			path.join(root, "legacy.md"),
			`local_old ${"a".repeat(20_000)}`,
		);
		writeFileSync(
			path.join(root, "planned.md"),
			`${RESUME_POINT_MARKER}\nlocal_stale\n`,
		);
		const state = {
			milestones: {
				first: { handoff: "first.md", status: "IN_PROGRESS" },
				legacy: { handoff: "legacy.md" },
				planned: { status: "PLANNED", handoff: "planned.md" },
			},
		};
		await expect(
			validateActiveResumePoints({ repositoryRoot: root, state }),
		).rejects.toThrow(/planned.md:.*local_/);
		writeFileSync(path.join(root, "planned.md"), valid);
		await expect(
			validateActiveResumePoints({ repositoryRoot: root, state }),
		).resolves.toBe(2);
		await expect(
			validate(root, "# Old handoff\nlocal_id\n`missing.md`\n"),
		).resolves.toBe(false);
	});
});
