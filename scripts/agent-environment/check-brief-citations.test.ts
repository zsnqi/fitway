import path from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { formatBriefResult } from "./check-brief.mjs";
import {
	createReviewSourceRoot,
	fixture,
	removeBriefFixtures,
} from "./check-brief-fixture";
import { git, put } from "./fixtures";

afterEach(removeBriefFixtures);
beforeAll(createReviewSourceRoot);

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

describe("brief-references: row citations", () => {
	const kinds = ["tsv", "markdown"] as const;
	const presentCases = [
		["single row", "row F101", ["F101"]],
		["comma list", "rows F101, F102", ["F101", "F102"]],
		["and list", "rows F101 and F102", ["F101", "F102"]],
		["range", "rows F101-F103", ["F101", "F102", "F103"]],
		["separate backticks", "rows `F101`, `F102`", ["F101", "F102"]],
		[
			"whole list in one code span",
			"rows `F101, F102 and F103`",
			["F101", "F102", "F103"],
		],
	] as const;
	const missingCases = [
		["single row", "row F999", "F999"],
		["comma list", "rows F101, F999", "F999"],
		["and list", "rows F101 and F999", "F999"],
		["range", "rows F109-F111", "F110"],
		["separate backticks", "rows `F101`, `F999`", "F999"],
		["whole list in one code span", "rows `F101, F999 and F102`", "F999"],
	] as const;

	function addRows(
		f: ReturnType<typeof fixture>,
		kind: (typeof kinds)[number],
		ids: readonly string[],
	) {
		const file = kind === "tsv" ? "docs/rows.tsv" : "docs/rows.md";
		const content =
			kind === "tsv"
				? `${ids.map((id) => `${id}\tvalue`).join("\n")}\n`
				: [
						"| ID | Value |",
						"| --- | --- |",
						...ids.map((id) => `| ${id} | value |`),
						"",
					].join("\n");
		put(f.worktree, file, content);
		git(f.worktree, "add", ".");
		git(f.worktree, "commit", "-m", `add ${kind} row fixture`);
		return {
			file,
			head: git(f.worktree, "rev-parse", "--short", "HEAD"),
		};
	}

	function brief(
		f: ReturnType<typeof fixture>,
		head: string,
		file: string,
		citation: string,
	) {
		return `${f.valid.replace(`, HEAD \`${f.head}\``, `, HEAD \`${head}\``)}\n\`${file}\` ${citation}.\n`;
	}

	for (const kind of kinds) {
		it(`accepts every row citation form in ${kind}`, async () => {
			const f = fixture();
			const { file, head } = addRows(f, kind, ["F101", "F102", "F103"]);
			for (const [, citation, ids] of presentCases) {
				const result = await f.check(brief(f, head, file, citation));
				expect(result.problems, `${citation}: ${ids.join(", ")}`).toEqual([]);
			}
		});

		it(`reports every missing row form in ${kind}`, async () => {
			const f = fixture();
			const { file, head } = addRows(f, kind, ["F101", "F102", "F103"]);
			for (const [, citation, missing] of missingCases) {
				const result = await f.check(brief(f, head, file, citation));
				const output = formatBriefResult(result);
				expect(result.ok, `${citation}: ${output}`).toBe(false);
				expect(output).toContain(`missing row ${missing} in ${file}`);
				expect(output).toContain(`HEAD ${head}`);
			}
		});
	}

	it("does not read a row from the command repository", async () => {
		const f = fixture();
		put(f.commandRepository, "docs/command-rows.tsv", "F999\tvalue\n");
		const result = await f.check(
			`${f.valid}\n\`docs/command-rows.tsv\` row F999.\n`,
		);
		const output = formatBriefResult(result);
		expect(result.ok).toBe(false);
		expect(output).toContain("drift: missing");
		expect(output).toContain("command-rows.tsv");
	});

	it("checks rows at the named HEAD, not the working copy", async () => {
		const f = fixture();
		put(
			f.worktree,
			"docs/guide.md",
			"# Guide\n\n## Selected heading\nLast line.\n\n| ID | Value |\n| --- | --- |\n| F999 | working only |\n",
		);
		const result = await f.check(`${f.valid}\n\`docs/guide.md\` row F999.\n`);
		const output = formatBriefResult(result);
		expect(result.ok).toBe(false);
		expect(output).toContain("missing row F999 in docs/guide.md");
		expect(output).toContain(`HEAD ${f.head}`);
	});
});
