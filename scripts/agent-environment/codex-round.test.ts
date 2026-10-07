import { execFileSync, spawnSync } from "node:child_process";
import {
	chmodSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	realpathSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const repository = fileURLToPath(new URL("../../", import.meta.url));
const script = path.join(
	repository,
	"scripts/agent-environment/codex-round.mjs",
);
const environment = readFileSync(
	path.join(repository, "docs/agent-context/briefs/ENVIRONMENT.md"),
	"utf8",
);
const roots: string[] = [];
const thread = "fixture-thread-123";

function git(root: string, ...args: string[]) {
	return execFileSync("git", args, {
		cwd: root,
		encoding: "utf8",
		windowsHide: true,
		stdio: ["ignore", "pipe", "pipe"],
	}).trim();
}

function initialize(root: string) {
	mkdirSync(root);
	git(root, "init", "--initial-branch=fixture");
	git(root, "config", "user.name", "Round fixture");
	git(root, "config", "user.email", "round@example.invalid");
	git(root, "config", "commit.gpgsign", "false");
	git(root, "config", "core.autocrlf", "false");
	git(root, "config", "core.hooksPath", path.join(root, "no-hooks"));
	git(root, "commit", "--allow-empty", "-m", "fixture base");
}

afterEach(() => {
	for (const root of roots.splice(0)) {
		const absolute = realpathSync.native(root);
		const relative = path.relative(realpathSync.native(tmpdir()), absolute);
		if (path.isAbsolute(relative) || !relative.startsWith("fitway-round-test-"))
			throw new Error(`Unsafe fixture cleanup: ${absolute}`);
		rmSync(absolute, { recursive: true, force: true });
	}
});

function fixture(eol = "\n") {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-round-test-"));
	roots.push(root);
	const worktree = path.join(root, "build space «العربية»");
	const coordinator = path.join(root, "coordinator");
	initialize(worktree);
	initialize(coordinator);
	const head = git(worktree, "rev-parse", "HEAD");
	const brief = path.join(coordinator, "brief.md");
	const bytes = Buffer.from(
		`<!-- brief-format: v1 role: codex -->\n# Fixture\n\n- **Worktree:** \`${worktree.replaceAll("\\", "/")}\`, branch \`fixture\`, HEAD \`${head.slice(0, 8)}\`\n\n${environment.replaceAll("\r\n", "\n")}\n## Goal\n\nالنص «كما هو»\n`.replaceAll(
			"\n",
			eol,
		),
	);
	writeFileSync(brief, bytes);
	git(coordinator, "add", ".");
	git(coordinator, "commit", "-m", "tracked brief");
	const bin = path.join(root, "bin");
	mkdirSync(bin);
	const standin = path.join(bin, "stand-in.cjs");
	writeFileSync(
		standin,
		`const fs = require('node:fs');
const args = process.argv.slice(2);
const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
  fs.writeFileSync(process.env.ROUND_CAPTURE, JSON.stringify({args, cwd:process.cwd(), input:Buffer.concat(chunks).toString('base64')}));
  fs.writeFileSync(args[args.indexOf('-o') + 1], args.includes('resume') ? 'stand-in resumed message\\n' : 'stand-in last message\\n');
  process.stdout.write('{"type":"thread.star');
  process.stdout.write('ted","thread_id":"${thread}"}\\n');
  process.stdout.write('{"type":"item.completed","text":"العربية «»"}\\r\\n');
  process.exitCode = Number(process.env.ROUND_EXIT || 0);
});\n`,
	);
	if (process.platform === "win32") {
		writeFileSync(
			path.join(bin, "codex.cmd"),
			`@"${process.execPath}" "%~dp0stand-in.cjs" %*\r\n`,
		);
	} else {
		const executable = path.join(bin, "codex");
		writeFileSync(
			executable,
			`#!/bin/sh\nexec '${process.execPath.replaceAll("'", "'\\''")}' '${standin.replaceAll("'", "'\\''")}' "$@"\n`,
		);
		chmodSync(executable, 0o755);
	}
	const capture = path.join(root, "capture.json");
	const run = path.join(root, "run");
	const env = {
		...process.env,
		PATH: `${bin}${path.delimiter}${process.env.PATH}`,
		ROUND_CAPTURE: capture,
	};
	const invoke = (
		args = [brief, "high", "--run", run],
		extraEnv = {},
		cwd = root,
	) => {
		const result = spawnSync(process.execPath, [script, ...args], {
			cwd,
			env: { ...env, ...extraEnv },
			encoding: "utf8",
			windowsHide: true,
		});
		if (result.error) throw result.error;
		return { ...result, output: result.stdout + result.stderr };
	};
	const captured = () => JSON.parse(readFileSync(capture, "utf8"));
	const laterHead = () => {
		writeFileSync(path.join(worktree, "launch.md"), "# Brief commit\n");
		git(worktree, "add", ".");
		git(worktree, "commit", "-m", "brief over named head");
		return git(worktree, "rev-parse", "HEAD");
	};
	return {
		root,
		worktree,
		coordinator,
		head,
		brief,
		bytes,
		bin,
		capture,
		run,
		env,
		invoke,
		captured,
		laterHead,
	};
}

function expectedArgs(
	f: ReturnType<typeof fixture>,
	last: string,
	resume = false,
) {
	return [
		"exec",
		"--approve-for-me",
		"-C",
		f.worktree,
		"-m",
		"gpt-6.1-sol",
		"-c",
		"model_reasoning_effort=high",
		"--json",
		"-o",
		path.join(f.run, last),
		...(resume ? ["resume", thread] : []),
		"-",
	];
}

function refused(
	f: ReturnType<typeof fixture>,
	result: ReturnType<ReturnType<typeof fixture>["invoke"]>,
	reason: string,
) {
	expect(result.status, result.output).toBe(1);
	expect(result.stderr.trim().split(/\r?\n/)).toHaveLength(1);
	expect(result.stderr).toContain(reason);
	expect(existsSync(f.capture)).toBe(false);
}

describe("L1 launch", () => {
	it("runs brief:check first and launches nothing for a failing brief", () => {
		const f = fixture();
		writeFileSync(f.brief, "broken brief\n");
		refused(
			f,
			f.invoke([f.brief, "invalid", "--run", f.run]),
			"brief:check failed",
		);
		expect(existsSync(f.run)).toBe(false);
	});
	it("keeps exact HEAD input, argument order, events, last message, run folder and thread id", () => {
		const f = fixture();
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		expect(result.stdout).toContain("PASS brief:check");
		expect(result.stdout.match(/Run folder: /g)).toHaveLength(1);
		expect(result.stdout).toContain(`Run folder: ${f.run}`);
		expect(result.stdout.match(/Thread id: /g)).toHaveLength(1);
		expect(result.stdout).toContain(`Thread id: ${thread}`);
		expect(f.captured().args).toEqual(expectedArgs(f, "last-message.md"));
		expect(realpathSync.native(f.captured().cwd)).toBe(
			realpathSync.native(f.worktree),
		);
		expect(Buffer.from(f.captured().input, "base64")).toEqual(f.bytes);
		expect(readFileSync(path.join(f.run, "input.md"))).toEqual(f.bytes);
		expect(readFileSync(path.join(f.run, "last-message.md"), "utf8")).toBe(
			"stand-in last message\n",
		);
		expect(readFileSync(path.join(f.run, "events.jsonl"), "utf8")).toBe(
			`{"type":"thread.started","thread_id":"${thread}"}\n{"type":"item.completed","text":"العربية «»"}\r\n`,
		);
		expect(git(f.worktree, "status", "--short")).toBe("");
	});
	it("prefixes exactly the agreement note when HEAD is later", () => {
		const f = fixture();
		const head = f.laterHead();
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		expect(Buffer.from(f.captured().input, "base64")).toEqual(
			Buffer.concat([
				Buffer.from(
					`Launch note: HEAD ${head} only adds this brief over the named HEAD.\n\n`,
				),
				f.bytes,
			]),
		);
	});
	it("returns Codex's exit code, retaining stopped-run evidence", () => {
		const f = fixture();
		expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
		expect(existsSync(path.join(f.run, "events.jsonl"))).toBe(true);
		expect(existsSync(path.join(f.run, ".running"))).toBe(false);
	});
});

describe("L2 resume", () => {
	it("resumes the first-line thread with all flags before resume and preserves earlier captures", () => {
		const f = fixture();
		expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
		const original = readFileSync(path.join(f.run, "events.jsonl"));
		writeFileSync(
			path.join(f.worktree, "unfinished.ts"),
			"// interrupted round\n",
		);
		writeFileSync(f.brief, "the saved input must be used\n");
		for (let attempt = 0; attempt < 2; attempt += 1) {
			const result = f.invoke(["resume", f.run], { ROUND_EXIT: "19" });
			expect(result.status, result.output).toBe(19);
			expect(f.captured().args).toEqual(
				expectedArgs(f, "last-message.md", true),
			);
			expect(Buffer.from(f.captured().input, "base64")).toEqual(f.bytes);
		}
		expect(readFileSync(path.join(f.run, "events.jsonl"))).toEqual(original);
		expect(
			readdirSync(f.run).filter((file) => file.endsWith(".jsonl")),
		).toEqual(["events-resume-2.jsonl", "events-resume.jsonl", "events.jsonl"]);
		expect(readFileSync(path.join(f.run, "last-message.md"), "utf8")).toBe(
			"stand-in resumed message\n",
		);
	});
	it("refuses a run whose first event has no thread", () => {
		const f = fixture();
		f.invoke();
		rmSync(f.capture);
		writeFileSync(
			path.join(f.run, "events.jsonl"),
			'{}\n{"type":"thread.started","thread_id":"wrong-line"}\n',
		);
		refused(f, f.invoke(["resume", f.run]), "first event has no thread id");
		expect(existsSync(path.join(f.run, "events-resume.jsonl"))).toBe(false);
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
	it("refuses a run through a junction or directory link into a Git tree", () => {
		const f = fixture();
		const link = path.join(f.root, "linked-tree");
		symlinkSync(
			f.coordinator,
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
	it("refuses a directory link pointing out of a Git tree", () => {
		const f = fixture();
		const link = path.join(f.coordinator, "linked-out");
		symlinkSync(f.bin, link, process.platform === "win32" ? "junction" : "dir");
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

describe("L4 shell and byte parity", () => {
	it.each([
		"\n",
		"\r\n",
	])("passes Arabic and punctuation unchanged with %j endings", (eol) => {
		const f = fixture(eol);
		const result = f.invoke(
			[
				f.brief.replaceAll(path.sep, "/"),
				"high",
				"--run",
				f.run.replaceAll(path.sep, "\\"),
			],
			{},
			f.coordinator,
		);
		expect(result.status, result.output).toBe(0);
		expect(Buffer.from(f.captured().input, "base64")).toEqual(f.bytes);
	});
	it("resolves a repository-root relative brief from an unrelated cwd", () => {
		const f = fixture();
		const relative = path
			.relative(repository, f.brief)
			.replaceAll(path.sep, "\\");
		const result = f.invoke([relative, "high", "--run", f.run]);
		expect(result.status, result.output).toBe(0);
		expect(Buffer.from(f.captured().input, "base64")).toEqual(f.bytes);
	});
	it.skipIf(process.platform !== "win32")(
		"gives the same launch in PowerShell and Git Bash",
		() => {
			const f = fixture("\r\n");
			const args = [process.execPath, script, f.brief, "high", "--run", f.run];
			const psQuote = (value: string) => `'${value.replaceAll("'", "''")}'`;
			const ps = spawnSync(
				"powershell.exe",
				["-NoProfile", "-Command", `& ${args.map(psQuote).join(" ")}`],
				{ cwd: f.root, env: f.env, encoding: "utf8", windowsHide: true },
			);
			expect(ps.status, ps.stdout + ps.stderr).toBe(0);
			const first = f.captured();
			// Each shell gets a fresh run with the identical command text.
			for (const file of readdirSync(f.run)) rmSync(path.join(f.run, file));
			const bashQuote = (value: string) =>
				`'${value.replaceAll("'", "'\\''")}'`;
			const bash = spawnSync(
				"bash.exe",
				[
					"--noprofile",
					"--norc",
					"-c",
					args.map((arg) => bashQuote(arg.replaceAll("\\", "/"))).join(" "),
				],
				{ cwd: f.coordinator, env: f.env, encoding: "utf8", windowsHide: true },
			);
			expect(bash.status, bash.stdout + bash.stderr).toBe(0);
			expect(f.captured()).toEqual(first);
		},
	);
	it.skipIf(process.platform !== "win32")(
		"keeps shell metacharacters in run paths as data for .cmd shims",
		() => {
			const f = fixture();
			const run = path.join(f.root, "run & %PATH% !literal! ^ (space)");
			const result = f.invoke([f.brief, "high", "--run", run]);
			expect(result.status, result.output).toBe(0);
			expect(f.captured().args[10]).toBe(path.join(run, "last-message.md"));
			expect(Buffer.from(f.captured().input, "base64")).toEqual(f.bytes);
		},
	);
});

it("prints the command's usage without starting Codex", () => {
	const f = fixture();
	const result = f.invoke(["--help"]);
	expect(result.status).toBe(0);
	expect(result.stdout).toContain(
		"Usage: pnpm codex:round [--] <brief> <level> [--run <folder>]",
	);
	expect(result.stdout).toContain("pnpm codex:round [--] resume <folder>");
	expect(existsSync(f.capture)).toBe(false);
});
