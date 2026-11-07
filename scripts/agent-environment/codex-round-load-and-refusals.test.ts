import { execFileSync } from "node:child_process";
import {
	existsSync,
	readFileSync,
	realpathSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	firstShortWindowsPath,
	fixture,
	git,
	refused,
	samePath,
	session,
	thread,
	tokenCount,
} from "./codex-round-test-support.ts";

describe("L5 start load", () => {
	const record = (f: ReturnType<typeof fixture>) =>
		JSON.parse(readFileSync(path.join(f.run, "start-load.json"), "utf8"));
	it("records the thread's first counted request, never a later one or another thread's", async () => {
		const f = fixture();
		session(f, "other-thread", [tokenCount(99999)]);
		session(
			f,
			thread,
			[
				'{"type":"session_meta","payload":{}}',
				"not json",
				tokenCount(null),
				tokenCount(27063),
				tokenCount(32109, 59172),
			],
			"2026/10/08",
		);
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		expect(result.stdout).toContain(
			"Start load: 27063 input tokens in the first request",
		);
		const saved = record(f);
		expect(saved).toMatchObject({
			thread,
			input_tokens: 27063,
			cached_input_tokens: 7296,
		});
		expect(
			await samePath(
				saved.session,
				path.join(
					f.codexHome,
					"sessions/2026/10/08",
					`rollout-2026-10-09T10-00-00-${thread}.jsonl`,
				),
			),
		).toBe(true);
	});
	it("records nothing and keeps Codex's exit code without a session or a count", () => {
		const f = fixture();
		const result = f.invoke(undefined, { ROUND_EXIT: "37" });
		expect(result.status, result.output).toBe(37);
		expect(result.stdout).toContain(
			`Start load: no session file for thread ${thread}`,
		);
		expect(existsSync(path.join(f.run, "start-load.json"))).toBe(false);
		session(f, thread, [tokenCount(null)]);
		const resumed = f.invoke(["resume", f.run]);
		expect(resumed.status, resumed.output).toBe(0);
		expect(resumed.stdout).toContain("Start load: no token count in");
		expect(existsSync(path.join(f.run, "start-load.json"))).toBe(false);
	});
	it("fills a missing record on resume and never replaces one", () => {
		const f = fixture();
		expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
		session(f, thread, [tokenCount(27063)]);
		expect(f.invoke(["resume", f.run]).status).toBe(0);
		expect(record(f).input_tokens).toBe(27063);
		session(f, thread, [tokenCount(11111)]);
		expect(f.invoke(["resume", f.run]).status).toBe(0);
		expect(record(f).input_tokens).toBe(27063);
	});
});

describe("L3 refusals", () => {
	it.each([
		"untracked",
		"staged",
		"modified",
	])("refuses %s worktree changes", (kind) => {
		const f = fixture();
		if (kind === "modified") f.laterHead();
		writeFileSync(
			path.join(f.worktree, kind === "modified" ? "launch.md" : "change.txt"),
			"change\n",
		);
		if (kind === "staged") git(f.worktree, "add", ".");
		refused(f, f.invoke(), "uncommitted changes");
	});
	it.each([
		"TEMP",
		"TMP",
	])("refuses %s inside D:/fitway-temp before review or Codex", (key) => {
		const f = fixture();
		const bad = path.join("D:/fitway-temp", `round-${key}`, "child");
		rmSync(f.reviewRoot, { recursive: true });
		const result = f.invoke([f.brief, "high", "--new-review", "--run", f.run], {
			[key]: bad,
		});
		refused(f, result, key);
		expect(result.stderr).toContain("D:/fitway-temp");
		expect(f.reviewCalls()).toEqual([]);
		expect(existsSync(f.run)).toBe(false);
		expect(existsSync(f.reviewRoot)).toBe(false);
	});
	it("refuses a case-varied, relative TEMP through a junction into the gardener root", () => {
		const f = fixture();
		const link = path.join(f.root, "gardener-temp-link");
		symlinkSync("D:/fitway-temp", link, "junction");
		const bad = `${link.toUpperCase()}/child/../nested`;
		delete f.env.TEMP;
		delete f.env.TMP;
		Object.assign(f.env, { temp: bad });
		const result = f.invoke();
		refused(f, result, "temp");
		expect(result.stderr).toContain("temp");
		expect(f.reviewCalls()).toEqual([]);
		expect(existsSync(f.run)).toBe(false);
	});
	it("refuses a bad TEMP before Codex on resume", () => {
		const f = fixture();
		expect(f.invoke().status).toBe(0);
		rmSync(f.capture);
		const result = f.invoke(["resume", f.run], {
			TEMP: "D:/FITWAY-TEMP/../fitway-temp/resume",
		});
		refused(f, result, "TEMP");
		expect(existsSync(f.capture)).toBe(false);
	});
	it("keeps a sibling of D:/fitway-temp and other values unchanged", () => {
		const f = fixture();
		const temp = "D:/fitway-temp-logs/round-temp";
		const tmp = "D:/fitway-temp-logs/round-tmp";
		const result = f.invoke(undefined, { TEMP: temp, TMP: tmp });
		expect(result.status, result.output).toBe(0);
		expect(f.captured().env).toEqual({ TEMP: temp, TMP: tmp });
	});
	it.skipIf(process.platform !== "win32")(
		"expands an 8.3 TEMP for Codex and leaves other values unchanged",
		({ skip }) => {
			const f = fixture();
			const probe = firstShortWindowsPath();
			if (!("short" in probe))
				skip(
					`no available drive offers an 8.3 folder name; drives probed: ${
						probe.drives.join(", ") || "none"
					}`,
				);
			const tmp = "D:/fitway-temp-logs/round-normal";
			const result = f.invoke(undefined, {
				TEMP: probe.short,
				TMP: tmp,
			});
			expect(result.status, result.output).toBe(0);
			expect(f.captured().env).toEqual({
				TEMP: realpathSync.native(probe.long),
				TMP: tmp,
			});
		},
	);
	it("refuses an unsupported level", () => {
		const f = fixture();
		refused(
			f,
			f.invoke([f.brief, "ultra", "--run", f.run]),
			"unsupported reasoning level",
		);
	});
	it("refuses a run in any Git tree, including a nonexistent descendant", () => {
		const f = fixture();
		refused(
			f,
			f.invoke([
				f.brief,
				"high",
				"--run",
				path.join(f.coordinator, "missing", "run"),
			]),
			"inside a Git working tree",
		);
	});
	it.each([
		[
			"refuses a run through a junction or directory link into a Git tree",
			(f: ReturnType<typeof fixture>) => path.join(f.root, "linked-tree"),
			(f: ReturnType<typeof fixture>) => f.coordinator,
		],
		[
			"refuses a directory link pointing out of a Git tree",
			(f: ReturnType<typeof fixture>) => path.join(f.coordinator, "linked-out"),
			(f: ReturnType<typeof fixture>) => f.bin,
		],
	] as const)("%s", (_name, linkPath, targetPath) => {
		const f = fixture();
		const link = linkPath(f);
		symlinkSync(
			targetPath(f),
			link,
			process.platform === "win32" ? "junction" : "dir",
		);
		try {
			refused(
				f,
				f.invoke([f.brief, "high", "--run", path.join(link, "missing", "run")]),
				"inside a Git working tree",
			);
		} finally {
			rmSync(link);
		}
	});
	it("refuses a folder already holding a run without overwriting it", () => {
		const f = fixture();
		f.invoke();
		rmSync(f.capture);
		const original = readFileSync(path.join(f.run, "events.jsonl"));
		refused(f, f.invoke(), "already holds a run");
		expect(readFileSync(path.join(f.run, "events.jsonl"))).toEqual(original);
	});
	it("refuses absent codex on PATH", () => {
		const f = fixture();
		const gitExecutable =
			process.platform === "win32"
				? execFileSync("where.exe", ["git.exe"], {
						encoding: "utf8",
						windowsHide: true,
					})
						.trim()
						.split(/\r?\n/)[0]
				: execFileSync("which", ["git"], { encoding: "utf8" }).trim();
		refused(
			f,
			f.invoke(undefined, { PATH: path.dirname(gitExecutable) }),
			"codex is not on PATH",
		);
		expect(existsSync(f.run)).toBe(false);
	});
});
