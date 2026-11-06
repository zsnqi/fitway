import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
	captureReviewSourceAccess,
	copyReviewSources,
	fixture,
	git,
	refused,
	repository,
	reviewRefused,
} from "./codex-round-test-support.ts";

vi.mock("node:fs", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:fs")>();
	const recordRead = (route: string, args: unknown[]) => {
		const log = Reflect.get(
			globalThis,
			Symbol.for("fitway.review-source-access-test"),
		);
		if (Array.isArray(log)) log.push({ type: "read", route, value: args[0] });
	};
	const wrapRead = (route: string, method: (...values: unknown[]) => unknown) =>
		vi.fn((...args: unknown[]) => {
			recordRead(route, args);
			return method(...args);
		});
	return {
		...actual,
		readFileSync: wrapRead(
			"readFileSync",
			actual.readFileSync as unknown as (...values: unknown[]) => unknown,
		),
		createReadStream: wrapRead(
			"createReadStream",
			actual.createReadStream as unknown as (...values: unknown[]) => unknown,
		),
	};
});
vi.mock("node:fs/promises", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:fs/promises")>();
	const readFile = vi.fn((...args: unknown[]) => {
		const log = Reflect.get(
			globalThis,
			Symbol.for("fitway.review-source-access-test"),
		);
		if (Array.isArray(log))
			log.push({ type: "read", route: "readFile", value: args[0] });
		return (actual.readFile as unknown as (...values: unknown[]) => unknown)(
			...args,
		);
	});
	return {
		...actual,
		readFile,
	};
});
vi.mock("node:child_process", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:child_process")>();
	const processStartValue = (args: unknown[]) => {
		const command = args[0];
		const commandArgs = args[1];
		return [
			typeof command === "string" ? command : String(command),
			...(Array.isArray(commandArgs)
				? commandArgs.filter(
						(value): value is string => typeof value === "string",
					)
				: []),
		].join(" ");
	};
	const recordProcessStart = (route: string, args: unknown[]) => {
		const value = processStartValue(args);
		// The source plan uses ls-tree to decide whether a Git path is a file.
		// That metadata lookup is not a read of the source bytes.
		if (/(?:^|\s)git(?:\.exe)?\s+ls-tree(?:\s|$)/i.test(value)) return;
		const log = Reflect.get(
			globalThis,
			Symbol.for("fitway.review-source-access-test"),
		);
		if (Array.isArray(log))
			log.push({
				type: "read",
				route,
				value,
			});
	};
	const wrap = (route: string, method: (...values: unknown[]) => unknown) =>
		vi.fn((...args: unknown[]) => {
			recordProcessStart(route, args);
			return method(...args);
		});
	return {
		...actual,
		exec: wrap(
			"child-process.exec",
			actual.exec as unknown as (...values: unknown[]) => unknown,
		),
		execFile: wrap(
			"child-process.execFile",
			actual.execFile as unknown as (...values: unknown[]) => unknown,
		),
		execFileSync: wrap(
			"child-process.execFileSync",
			actual.execFileSync as unknown as (...values: unknown[]) => unknown,
		),
		execSync: wrap(
			"child-process.execSync",
			actual.execSync as unknown as (...values: unknown[]) => unknown,
		),
		fork: wrap(
			"child-process.fork",
			actual.fork as unknown as (...values: unknown[]) => unknown,
		),
		spawn: wrap(
			"child-process.spawn",
			actual.spawn as unknown as (...values: unknown[]) => unknown,
		),
		spawnSync: wrap(
			"child-process.spawnSync",
			actual.spawnSync as unknown as (...values: unknown[]) => unknown,
		),
	};
});

describe("D5 review sources", () => {
	it("copies repository sources at the named HEAD and D:/fitway-temp sources", () => {
		const f = fixture();
		const absoluteDir = mkdtempSync(
			path.join("D:/fitway-temp", "round-source-"),
		);
		try {
			const repositorySource = path.join(
				f.worktree,
				"docs",
				"review-source.md",
			);
			const decisionsSource = path.join(f.worktree, "docs", "decisions.md");
			mkdirSync(path.dirname(repositorySource), { recursive: true });
			writeFileSync(repositorySource, "repository source\n");
			writeFileSync(decisionsSource, "decision one\n1. Decision\n");
			git(f.worktree, "add", ".");
			git(f.worktree, "commit", "-m", "review sources");
			const head = git(f.worktree, "rev-parse", "HEAD");

			const absoluteSource = path.join(absoluteDir, "trial.txt");
			mkdirSync(absoluteDir, { recursive: true });
			writeFileSync(absoluteSource, "temporary source\n");
			const brief = readFileSync(f.brief, "utf8")
				.replace(
					new RegExp(`HEAD \`${f.head.slice(0, 8)}\``),
					`HEAD \`${head.slice(0, 8)}\``,
				)
				.replace(
					"## Goal",
					`- **Read first, only these:**\n\n  - \`docs/review-source.md\` whole\n  - \`${absoluteSource.replaceAll("\\", "/")}\`\n\nDecisions: \`docs/decisions.md\` item 1.\n\n## Goal\n\nA later note about the "Read first" process names \`prompt.md\` but is not a source list.`,
				);
			writeFileSync(f.brief, brief);
			git(f.coordinator, "add", ".");
			git(f.coordinator, "commit", "-m", "brief names review sources");
			rmSync(f.reviewRoot, { recursive: true });

			const result = f.invokeRaw([f.brief, "--new-review", "--run", f.run], {
				REVIEW_ANSWER: "No such readings.\n",
			});
			reviewRefused(f, result, "record its dispositions before launching");
			const folder = path.join(f.reviewRoot, "brief-1");
			expect(
				readFileSync(path.join(folder, "sources", "docs", "review-source.md")),
			).toEqual(Buffer.from("repository source\n"));
			expect(
				readFileSync(path.join(folder, "sources", "docs", "decisions.md")),
			).toEqual(Buffer.from("decision one\n1. Decision\n"));
			const relativeAbsolute = path.relative(
				path.resolve("D:/fitway-temp"),
				absoluteSource,
			);
			expect(
				readFileSync(path.join(folder, "sources", "temp", relativeAbsolute)),
			).toEqual(Buffer.from("temporary source\n"));
			expect(existsSync(path.join(folder, "sources", "prompt.md"))).toBe(false);
		} finally {
			rmSync(absoluteDir, { recursive: true, force: true });
		}
	});

	it("copies a repository source at the named HEAD, not its working copy", async () => {
		const f = fixture();
		const source = path.join(f.worktree, "docs", "named-head-source.md");
		mkdirSync(path.dirname(source), { recursive: true });
		writeFileSync(source, "named head\n");
		git(f.worktree, "add", ".");
		git(f.worktree, "commit", "-m", "named-head source");
		const namedHead = git(f.worktree, "rev-parse", "HEAD");
		writeFileSync(source, "working copy\n");
		git(f.worktree, "add", ".");
		git(f.worktree, "commit", "-m", "working-copy source");
		const folder = path.join(f.root, "direct-review");
		await copyReviewSources(
			folder,
			Buffer.from(
				"## Read first, only these:\n\n- `docs/named-head-source.md`\n",
			),
			f.worktree,
			namedHead,
		);
		expect(
			readFileSync(
				path.join(folder, "sources", "docs", "named-head-source.md"),
			),
		).toEqual(Buffer.from("named head\n"));
	});

	it.each([
		"repository",
		"checkout",
		"temp",
	] as const)("checks %s review sources for the place before any read", async (kind) => {
		const f = fixture();
		let source: string;
		let head = f.head;
		let cleanup: (() => void) | undefined;
		if (kind === "repository") {
			const filename = path.join(f.worktree, "docs", "ordered-source.md");
			mkdirSync(path.dirname(filename), { recursive: true });
			writeFileSync(filename, "repository source\n");
			git(f.worktree, "add", ".");
			git(f.worktree, "commit", "-m", "ordered repository source");
			head = git(f.worktree, "rev-parse", "HEAD");
			source = "docs/ordered-source.md";
		} else if (kind === "checkout") {
			source = path
				.join(repository, "docs/agent-context/briefs/REVIEW.md")
				.replaceAll("\\", "/");
		} else {
			const directory = mkdtempSync(
				path.join("D:/fitway-temp", "round-order-"),
			);
			source = path.join(directory, "source.md").replaceAll("\\", "/");
			writeFileSync(source, "temporary source\n");
			cleanup = () => rmSync(directory, { recursive: true, force: true });
		}
		try {
			const events = await captureReviewSourceAccess(() =>
				copyReviewSources(
					path.join(f.root, `ordered-${kind}`),
					`- **Read first, only these:**\n\n- \`${source}\`\n`,
					f.worktree,
					head,
				),
			);
			const firstPlace = events.findIndex((event) => event.type === "place");
			const firstRead = events.findIndex((event) => event.type === "read");
			expect(firstPlace, kind).toBeGreaterThanOrEqual(0);
			expect(firstRead, kind).toBeGreaterThan(firstPlace);
		} finally {
			cleanup?.();
		}
	});

	it("checks each of two source places before that source's child-process read", async () => {
		const f = fixture();
		const first = "docs/ordered-first.md";
		const second = "docs/ordered-second.md";
		for (const source of [first, second]) {
			const filename = path.join(f.worktree, ...source.split("/"));
			mkdirSync(path.dirname(filename), { recursive: true });
			writeFileSync(filename, `${source}\n`);
		}
		git(f.worktree, "add", ".");
		git(f.worktree, "commit", "-m", "two ordered review sources");
		const head = git(f.worktree, "rev-parse", "HEAD");
		const events = await captureReviewSourceAccess(() =>
			copyReviewSources(
				path.join(f.root, "ordered-two"),
				`- **Read first, only these:**\n\n- \`${first}\`\n- \`${second}\`\n`,
				f.worktree,
				head,
			),
		);
		const processEvents = events.filter(
			(event) =>
				event.type === "place" ||
				(event.type === "read" &&
					String(event.route).startsWith("child-process.")),
		);
		expect(
			processEvents.map((event) => {
				if (event.type === "place")
					return { type: event.type, value: event.value };
				let value = String(event.value);
				if (value.includes(first)) value = first;
				else if (value.includes(second)) value = second;
				return { type: event.type, value };
			}),
		).toEqual([
			{ type: "place", value: first },
			{ type: "read", value: first },
			{ type: "place", value: second },
			{ type: "read", value: second },
		]);
	});

	it("refuses a repository source changed after the brief's named HEAD", () => {
		const f = fixture();
		const source = path.join(f.worktree, "docs", "review-source.md");
		mkdirSync(path.dirname(source), { recursive: true });
		writeFileSync(source, "named head\n");
		git(f.worktree, "add", ".");
		git(f.worktree, "commit", "-m", "named-head source");
		const namedHead = git(f.worktree, "rev-parse", "HEAD");
		writeFileSync(source, "later head\n");
		git(f.worktree, "add", ".");
		git(f.worktree, "commit", "-m", "later Markdown source");
		const brief = readFileSync(f.brief, "utf8")
			.replace(
				new RegExp(`HEAD \`${f.head.slice(0, 8)}\``),
				`HEAD \`${namedHead.slice(0, 8)}\``,
			)
			.replace(
				"## Goal",
				"- **Read first, only these:**\n\n  - `docs/review-source.md`\n\n## Goal",
			);
		writeFileSync(f.brief, brief);
		git(f.coordinator, "add", ".");
		git(f.coordinator, "commit", "-m", "brief source after named head");
		rmSync(f.reviewRoot, { recursive: true, force: true });

		const result = f.invokeRaw([f.brief, "--new-review", "--run", f.run], {
			REVIEW_ANSWER: "No such readings.\n",
		});
		expect(refused(f, result, "differs between named HEAD")).toMatchObject({
			status: 1,
		});
		expect(f.reviewCalls()).toEqual([]);
		expect(existsSync(f.reviewRoot)).toBe(false);
	});

	it.each([
		["missing repository source", "missing-review-source.md"],
		["a credential file", ".env"],
	])("refuses %s before Codex starts", (_name, source) => {
		const f = fixture();
		if (source === ".env")
			writeFileSync(path.join(f.worktree, source), "SECRET=value\n");
		git(f.worktree, "add", ".");
		git(f.worktree, "commit", "--allow-empty", "-m", source);
		const head = git(f.worktree, "rev-parse", "HEAD");
		const brief = readFileSync(f.brief, "utf8")
			.replace(
				new RegExp(`HEAD \`${f.head.slice(0, 8)}\``),
				`HEAD \`${head.slice(0, 8)}\``,
			)
			.replace(
				"## Goal",
				`## Read first, only these:\n\n- \`${source}\`\n\n## Goal`,
			);
		writeFileSync(f.brief, brief);
		git(f.coordinator, "add", ".");
		git(f.coordinator, "commit", "-m", `brief names ${source}`);
		rmSync(f.reviewRoot, { recursive: true });

		const result = f.invokeRaw([f.brief, "--new-review", "--run", f.run], {
			REVIEW_ANSWER: "No such readings.\n",
		});
		expect(refused(f, result, source)).toMatchObject({ status: 1 });
		expect(f.reviewCalls()).toEqual([]);
	});

	it("refuses an absolute source reached through a junction outside D:/fitway-temp", () => {
		const f = fixture();
		const linkRoot = mkdtempSync(path.join("D:/fitway-temp", "round-link-"));
		try {
			const outside = path.join(f.root, "outside-source");
			mkdirSync(outside, { recursive: true });
			writeFileSync(path.join(outside, "source.txt"), "outside source\n");
			const link = path.join(linkRoot, "escape");
			symlinkSync(
				outside,
				link,
				process.platform === "win32" ? "junction" : "dir",
			);
			const source = path.join(link, "source.txt");
			const brief = readFileSync(f.brief, "utf8").replace(
				"## Goal",
				`## Read first, only these:\n\n- \`${source.replaceAll("\\", "/")}\`\n\n## Goal`,
			);
			writeFileSync(f.brief, brief);
			git(f.coordinator, "add", ".");
			git(f.coordinator, "commit", "-m", "brief names linked source");
			rmSync(f.reviewRoot, { recursive: true, force: true });

			const result = f.invokeRaw([f.brief, "--new-review", "--run", f.run], {
				REVIEW_ANSWER: "No such readings.\n",
			});
			expect(
				refused(
					f,
					result,
					"absolute review source is outside D:/fitway-temp and the launcher checkout",
				),
			).toMatchObject({ status: 1 });
			expect(f.reviewCalls()).toEqual([]);
		} finally {
			rmSync(path.join(linkRoot, "escape"), { force: true });
			rmSync(linkRoot, { recursive: true, force: true });
		}
	});

	it("refuses an absolute source outside D:/fitway-temp", () => {
		const f = fixture();
		const source = path.join(f.root, "outside-review-source.txt");
		writeFileSync(source, "outside source\n");
		const brief = readFileSync(f.brief, "utf8").replace(
			"## Goal",
			`## Read first, only these:\n\n- \`${source.replaceAll("\\", "/")}\`\n\n## Goal`,
		);
		writeFileSync(f.brief, brief);
		git(f.coordinator, "add", ".");
		git(f.coordinator, "commit", "-m", "brief names outside source");
		rmSync(f.reviewRoot, { recursive: true });

		const result = f.invokeRaw([f.brief, "--new-review", "--run", f.run], {
			REVIEW_ANSWER: "No such readings.\n",
		});
		expect(
			refused(f, result, "absolute review source is outside D:/fitway-temp"),
		).toMatchObject({ status: 1 });
		expect(f.reviewCalls()).toEqual([]);
	});
});
