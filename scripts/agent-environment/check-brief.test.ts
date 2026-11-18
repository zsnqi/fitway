import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
	reviewSourcePlan,
	setReviewSourcePlaceObserver,
} from "./brief-review-sources.mjs";
import { formatBriefResult } from "./check-brief.mjs";
import {
	createReviewSourceRoot,
	environmentPath,
	fixture,
	removeBriefFixtures,
} from "./check-brief-fixture";
import { captureReviewSourceAccess } from "./check-brief-review-access-fixture.mjs";
import { copyReviewSources } from "./codex-review-launch.mjs";
import { git, put } from "./fixtures";

vi.mock("node:fs", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:fs")>();
	return {
		...actual,
		readFileSync: vi.fn((...args: unknown[]) => {
			const log = Reflect.get(
				globalThis,
				Symbol.for("fitway.review-source-access-test"),
			);
			if (Array.isArray(log))
				log.push({
					type: "read",
					route: "readFileSync",
					value: args[0],
				});
			return (
				actual.readFileSync as unknown as (...values: unknown[]) => unknown
			)(...args);
		}),
		createReadStream: vi.fn((...args: unknown[]) => {
			const log = Reflect.get(
				globalThis,
				Symbol.for("fitway.review-source-access-test"),
			);
			if (Array.isArray(log))
				log.push({
					type: "read",
					route: "createReadStream",
					value: args[0],
				});
			return (
				actual.createReadStream as unknown as (...values: unknown[]) => unknown
			)(...args);
		}),
	};
});

vi.mock("node:fs/promises", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:fs/promises")>();
	return {
		...actual,
		readFile: vi.fn((...args: unknown[]) => {
			const log = Reflect.get(
				globalThis,
				Symbol.for("fitway.review-source-access-test"),
			);
			if (Array.isArray(log))
				log.push({
					type: "read",
					route: "readFile",
					value: args[0],
				});
			return (actual.readFile as unknown as (...values: unknown[]) => unknown)(
				...args,
			);
		}),
	};
});

vi.mock("node:child_process", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:child_process")>();
	const recordGitShow = (args: unknown[]) => {
		const command = args[0];
		const commandArgs = args[1];
		if (
			command === "git" &&
			Array.isArray(commandArgs) &&
			commandArgs[0] === "show"
		) {
			const log = Reflect.get(
				globalThis,
				Symbol.for("fitway.review-source-access-test"),
			);
			if (Array.isArray(log))
				log.push({
					type: "read",
					route: "git-show",
					value: commandArgs[2],
				});
		}
	};
	return {
		...actual,
		execFileSync: vi.fn((...args: unknown[]) => {
			recordGitShow(args);
			return (
				actual.execFileSync as unknown as (...values: unknown[]) => unknown
			)(...args);
		}),
		spawnSync: vi.fn((...args: unknown[]) => {
			recordGitShow(args);
			return (actual.spawnSync as unknown as (...values: unknown[]) => unknown)(
				...args,
			);
		}),
	};
});
afterEach(removeBriefFixtures);
beforeAll(createReviewSourceRoot);

describe("brief-review-sources: the pre-launch source contract", () => {
	it("checks each source's place before reading it", async () => {
		const f = fixture();
		const temporary = mkdtempSync(
			path.join("D:/fitway-temp", "brief-source-place-"),
		);
		const temporaryFile = path.join(temporary, "source.md");
		const checkout = path.join(f.commandRepository, "checkout-place-dir");
		const checkoutFile = path.join(f.commandRepository, "docs", "guide.md");
		const outside = path.join(f.root, "outside-place-dir");
		const outsideFile = path.join(f.root, "outside-source.md");
		mkdirSync(checkout);
		mkdirSync(outside);
		writeFileSync(temporaryFile, "temporary source\n");
		writeFileSync(outsideFile, "outside source\n");
		try {
			const plan = (value: string) =>
				reviewSourcePlan(value, {
					worktree: f.worktree,
					head: f.head,
					checkoutRoot: f.commandRepository,
				});
			const accessKey = Symbol.for("fitway.review-source-access-test");
			const cases = [
				{
					name: "temp directory",
					value: temporary,
					error: "named review source is not a file",
				},
				{
					name: "checkout directory",
					value: checkout,
					error: "named review source is not a file",
				},
				{
					name: "outside directory",
					value: outside,
					error:
						"absolute review source is outside D:/fitway-temp and the launcher checkout",
				},
				{ name: "temp file", value: temporaryFile },
				{ name: "checkout file", value: checkoutFile },
				{
					name: "outside file",
					value: outsideFile,
					error:
						"absolute review source is outside D:/fitway-temp and the launcher checkout",
				},
				{ name: "repository file", value: "docs/guide.md" },
			] as const;
			for (const item of cases) {
				const events: {
					type: "place" | "read";
					kind?: string;
					route?: string;
					value?: unknown;
				}[] = [];
				Reflect.set(globalThis, accessKey, events);
				setReviewSourcePlaceObserver((event) => {
					events.push({ type: "place", ...event });
				});
				try {
					if ("error" in item) {
						await expect(plan(item.value), item.name).rejects.toThrow(
							item.error,
						);
					} else {
						await expect(plan(item.value), item.name).resolves.toBeTruthy();
					}
				} finally {
					setReviewSourcePlaceObserver(undefined);
					Reflect.deleteProperty(globalThis, accessKey);
				}
				const reads = events.filter((event) => event.type === "read");
				if ("error" in item) {
					expect(reads, item.name).toEqual([]);
					continue;
				}
				const firstPlace = events.findIndex((event) => event.type === "place");
				const firstRead = events.findIndex((event) => event.type === "read");
				expect(firstPlace, item.name).toBeGreaterThanOrEqual(0);
				expect(firstRead, item.name).toBeGreaterThan(firstPlace);
			}
		} finally {
			rmSync(temporary, { recursive: true, force: true });
		}
	});

	it("keeps source reads after the place check through the checker", async () => {
		const f = fixture();
		const goal = f.valid.indexOf("## Goal");
		expect(goal).toBeGreaterThan(0);
		const text = `${f.valid.slice(0, goal)}- **Read first, only these:**

  - \`docs/guide.md\`

## Goal

No file references.
`;
		const events = await captureReviewSourceAccess(() => f.check(text));
		const allowed = new Set([
			path.normalize(path.resolve(f.briefPath)),
			path.normalize(path.resolve(f.commandRepository, environmentPath)),
		]);
		const sourceReads = events.filter(
			(event) =>
				event.type === "read" &&
				(typeof event.value !== "string" ||
					!allowed.has(path.normalize(path.resolve(event.value)))),
		);
		const firstPlace = events.findIndex((event) => event.type === "place");
		expect(sourceReads.length).toBeGreaterThan(0);
		for (const read of sourceReads)
			expect(events.indexOf(read)).toBeGreaterThan(firstPlace);
	});

	it("keeps source reads after the place check through review copying", async () => {
		const f = fixture();
		const brief = `- **Read first, only these:**

  - \`docs/guide.md\`
`;
		const events = await captureReviewSourceAccess(() =>
			copyReviewSources(
				path.join(f.root, "copy-review"),
				brief,
				f.worktree,
				f.head,
			),
		);
		const firstPlace = events.findIndex((event) => event.type === "place");
		const firstRead = events.findIndex((event) => event.type === "read");
		expect(firstPlace).toBeGreaterThanOrEqual(0);
		expect(firstRead).toBeGreaterThan(firstPlace);
	});

	it("checks a repository source's type before reading it", async () => {
		const f = fixture();
		const source = "docs/gitlink-source";
		const trace = path.join(f.root, "git-trace.jsonl");
		git(
			f.worktree,
			"update-index",
			"--add",
			"--cacheinfo",
			`160000,${"1".repeat(40)},${source}`,
		);
		git(f.worktree, "commit", "-m", "add gitlink review source");
		const head = git(f.worktree, "rev-parse", "HEAD");
		const previous = process.env.GIT_TRACE2_EVENT;
		process.env.GIT_TRACE2_EVENT = trace;
		try {
			await expect(
				reviewSourcePlan(source, {
					worktree: f.worktree,
					head,
					checkoutRoot: f.commandRepository,
				}),
			).rejects.toThrow("named review source is not a file");
		} finally {
			if (previous === undefined) delete process.env.GIT_TRACE2_EVENT;
			else process.env.GIT_TRACE2_EVENT = previous;
		}
		const events = readFileSync(trace, "utf8");
		expect(events).toContain("ls-tree");
		expect(events).not.toContain("show");
	});

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
