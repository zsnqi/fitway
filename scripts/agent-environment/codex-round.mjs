import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
	access,
	mkdir,
	open,
	readdir,
	readFile,
	realpath,
	stat,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";
import { finished } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { checkBrief, formatBriefResult } from "./check-brief.mjs";
import { readGit } from "./git-context.mjs";
import { samePath } from "./path-identity.mjs";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const MODEL = "gpt-6.1-sol";
const LEVELS = new Set(["medium", "high", "xhigh"]);
const HELP = `Usage: pnpm codex:round [--] <brief> <level> [--run <folder>]
       pnpm codex:round [--] resume <folder> [--message <text>]
       node <repository>/scripts/agent-environment/codex-round.mjs <brief> <level> [--run <folder>]
       node <repository>/scripts/agent-environment/codex-round.mjs resume <folder> [--message <text>]

Levels: medium, high, xhigh (WORKING_AGREEMENTS.md, Delegation).
Relative brief and run paths start at the repository root, in either shell.
Default run folder: ${process.platform === "win32" ? "D:/fitway-temp" : tmpdir()}/codex-round-<id>.
Resume allows unfinished changes, keeps each event stream, and updates last-message.md.
--message sends the exact text instead of the saved launch input.`;

function resolvePath(value) {
	return path.resolve(repositoryRoot, value.replaceAll("\\", "/"));
}

function parseArgs(input) {
	const args = input[0] === "--" ? input.slice(1) : input;
	if (args.length === 1 && ["--help", "-h"].includes(args[0]))
		return { help: true };
	if (args[0] === "resume") {
		if (
			![2, 4].includes(args.length) ||
			(args.length === 4 && args[2] !== "--message")
		)
			throw new Error("expected resume <folder> [--message <text>]");
		return { resume: true, run: resolvePath(args[1]), message: args[3] };
	}
	if (
		![2, 4].includes(args.length) ||
		(args.length === 4 && args[2] !== "--run") ||
		args[0]?.startsWith("-")
	)
		throw new Error(
			"expected <brief> <level> [--run <folder>] or resume <folder> [--message <text>]",
		);
	return {
		brief: resolvePath(args[0]),
		level: args[1],
		run: args[3]
			? resolvePath(args[3])
			: path.join(
					process.platform === "win32" ? "D:/fitway-temp" : tmpdir(),
					`codex-round-${randomUUID()}`,
				),
	};
}

// Resolve only PATH entries, never a shell alias or the invoking directory.
async function findCodex() {
	const extensions =
		process.platform === "win32" ? [".exe", ".com", ".cmd", ".bat"] : [""];
	for (const directory of (process.env.PATH ?? "").split(path.delimiter)) {
		if (!directory) continue;
		for (const extension of extensions) {
			const candidate = path.resolve(
				directory.replace(/^"|"$/g, ""),
				`codex${extension}`,
			);
			try {
				if (!(await stat(candidate)).isFile()) continue;
				await access(
					candidate,
					process.platform === "win32" ? constants.F_OK : constants.X_OK,
				);
				return candidate;
			} catch {
				// Try the next PATH entry.
			}
		}
	}
	throw new Error("codex is not on PATH");
}

async function existingAncestor(value) {
	let current = value;
	for (;;) {
		try {
			const details = await stat(current);
			return details.isDirectory() ? current : path.dirname(current);
		} catch (error) {
			if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
			const parent = path.dirname(current);
			if (parent === current) throw error;
			current = parent;
		}
	}
}

async function assertOutsideGit(run) {
	const existing = await existingAncestor(run);
	// Inspect both routes: a junction into a tree, or out of a tree, still fails.
	for (const start of [existing, await realpath(existing)]) {
		let current = start;
		for (;;) {
			let inside = false;
			try {
				inside =
					readGit(current, ["rev-parse", "--is-inside-work-tree"]) === "true";
			} catch {
				// A path outside Git is expected.
			}
			if (inside) throw new Error("run folder is inside a Git working tree");
			const parent = path.dirname(current);
			if (parent === current) break;
			current = parent;
		}
	}
}

async function assertFresh(run) {
	await assertOutsideGit(run);
	try {
		if ((await readdir(run)).length)
			throw new Error("run folder already holds a run or is not empty");
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
}

async function prepareLaunch(options) {
	// The checker is the first launch gate; it never fills or rewrites the brief.
	const result = await checkBrief({ repositoryRoot, briefPath: options.brief });
	if (!result.ok) {
		const failure = result.problems.find(
			(problem) => problem.severity === "FAIL",
		);
		throw new Error(
			`brief:check failed (${failure.rule}, line ${failure.line}): ${failure.message}`,
		);
	}
	if (result.role !== "codex") throw new Error("brief must have role: codex");
	if (!LEVELS.has(options.level))
		throw new Error(
			`unsupported reasoning level: ${options.level}; use medium, high or xhigh`,
		);
	const worktree = resolvePath(result.worktree);
	if (readGit(worktree, ["status", "--short"]))
		throw new Error("target worktree has uncommitted changes");
	readGit(path.dirname(options.brief), [
		"ls-files",
		"--error-unmatch",
		options.brief,
	]);
	await assertFresh(options.run);
	const executable = await findCodex();
	const brief = await readFile(options.brief);
	const named = brief
		.toString("utf8")
		.replace(/<!--[\s\S]*?-->/g, "")
		.match(
			/^- \*\*Worktree:\*\* `[^`]+`, branch `[^`]+`, HEAD `([^`]+)`\s*$/m,
		)?.[1];
	const head = readGit(worktree, ["rev-parse", "HEAD"]);
	const namedHead = readGit(worktree, ["rev-parse", `${named}^{commit}`]);
	const note =
		head === namedHead
			? Buffer.alloc(0)
			: Buffer.from(
					`Launch note: HEAD ${head} only adds this brief over the named HEAD.\n\n`,
				);
	const input = Buffer.concat([note, brief]);
	const metadata = {
		version: 1,
		worktree,
		head,
		level: options.level,
		model: MODEL,
	};
	await mkdir(options.run, { recursive: true });
	await assertFresh(options.run);
	// Exclusive creation also arbitrates simultaneous launches into an empty folder.
	await writeFile(
		path.join(options.run, "run.json"),
		`${JSON.stringify(metadata, null, 2)}\n`,
		{ flag: "wx" },
	);
	await writeFile(path.join(options.run, "input.md"), input, { flag: "wx" });
	console.log(formatBriefResult(result));
	return { metadata, input, executable };
}

async function firstThread(run) {
	const file = await open(path.join(run, "events.jsonl"), "r");
	try {
		const buffer = Buffer.alloc(65536);
		const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
		const end = buffer.subarray(0, bytesRead).indexOf(10);
		if (end < 0) throw new Error("event stream has no complete first line");
		const event = JSON.parse(buffer.subarray(0, end).toString("utf8"));
		if (
			event.type !== "thread.started" ||
			!/^[\w-]+$/.test(event.thread_id ?? "")
		)
			throw new Error("first event has no thread id");
		return event.thread_id;
	} finally {
		await file.close();
	}
}

async function prepareResume(options) {
	await assertOutsideGit(options.run);
	const metadata = JSON.parse(
		await readFile(path.join(options.run, "run.json"), "utf8"),
	);
	if (
		metadata.version !== 1 ||
		metadata.model !== MODEL ||
		!LEVELS.has(metadata.level) ||
		typeof metadata.worktree !== "string" ||
		!path.isAbsolute(metadata.worktree) ||
		!(await samePath(
			readGit(metadata.worktree, ["rev-parse", "--show-toplevel"]),
			metadata.worktree,
		))
	)
		throw new Error("invalid run metadata");
	return {
		metadata,
		input:
			options.message === undefined
				? await readFile(path.join(options.run, "input.md"))
				: Buffer.from(options.message, "utf8"),
		thread: await firstThread(options.run),
		executable: await findCodex(),
	};
}

function startCodex(executable, args, worktree) {
	const options = {
		cwd: worktree,
		stdio: ["pipe", "pipe", "inherit"],
		windowsHide: true,
	};
	if (process.platform !== "win32" || !/\.(cmd|bat)$/i.test(executable))
		return spawn(executable, args, options);
	// Expand environment references once, with delayed expansion disabled. The
	// values are quoted data; embedded percent references are not expanded again.
	const env = { ...process.env, FITWAY_CODEX_COMMAND: executable };
	const references = args.map((argument, index) => {
		env[`FITWAY_CODEX_ARG_${index}`] = argument;
		return `"%FITWAY_CODEX_ARG_${index}%"`;
	});
	return spawn(
		process.env.ComSpec ?? "cmd.exe",
		[
			"/d",
			"/v:off",
			"/s",
			"/c",
			`""%FITWAY_CODEX_COMMAND%" ${references.join(" ")}"`,
		],
		{ ...options, env, windowsVerbatimArguments: true },
	);
}

async function capture(run, resume) {
	for (let index = 1; ; index += 1) {
		const suffix = !resume ? "" : `-resume${index === 1 ? "" : `-${index}`}`;
		const events = path.join(run, `events${suffix}.jsonl`);
		try {
			const file = await open(events, "wx");
			return { file, events, last: path.join(run, "last-message.md") };
		} catch (error) {
			if (!resume || error.code !== "EEXIST") throw error;
		}
	}
}

async function execute(options, prepared) {
	const output = await capture(options.run, options.resume);
	const { metadata, input, executable, thread } = prepared;
	const args = [
		"exec",
		"--approve-for-me",
		"-C",
		metadata.worktree,
		"-m",
		metadata.model,
		"-c",
		`model_reasoning_effort=${metadata.level}`,
		"--json",
		"-o",
		output.last,
		...(options.resume ? ["resume", thread] : []),
		"-",
	];
	console.log(`Run folder: ${options.run}`);
	const stream = output.file.createWriteStream();
	const child = startCodex(executable, args, metadata.worktree);
	let reported = false;
	const lines = createInterface({ input: child.stdout });
	lines.on("line", (line) => {
		try {
			const event = JSON.parse(line);
			if (
				!reported &&
				event.type === "thread.started" &&
				typeof event.thread_id === "string"
			) {
				console.log(`Thread id: ${event.thread_id}`);
				reported = true;
			}
		} catch {
			// Preserve even incomplete or non-JSON output in the event stream.
		}
	});
	child.stdout.pipe(stream);
	child.stdin.on("error", (error) => {
		if (error.code !== "EPIPE") console.error(`codex-round: ${error.message}`);
	});
	const completion = new Promise((resolve, reject) => {
		child.once("error", reject);
		child.once("close", (code, signal) =>
			resolve(code ?? (signal === "SIGINT" ? 130 : 1)),
		);
	});
	child.stdin.end(input);
	try {
		const [code] = await Promise.all([completion, finished(stream)]);
		return code;
	} finally {
		if (child.exitCode === null) child.kill();
		lines.close();
		stream.destroy();
		await output.file.close();
	}
}

export async function main(args = process.argv.slice(2)) {
	try {
		const options = parseArgs(args);
		if (options.help) {
			console.log(HELP);
			return 0;
		}
		const prepared = options.resume
			? await prepareResume(options)
			: await prepareLaunch(options);
		return await execute(options, prepared);
	} catch (error) {
		console.error(`codex-round: ${error.message.replace(/[\r\n]+/g, " ")}`);
		return 1;
	}
}

if (
	process.argv[1] &&
	(await samePath(fileURLToPath(import.meta.url), process.argv[1]))
)
	process.exitCode = await main();
