import { execFileSync, spawnSync } from "node:child_process";
import {
	copyFileSync,
	existsSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
	captureKeys,
	findGitBash,
	fixture,
	gitBashEnvironment,
	repository,
	samePath,
	script,
} from "./codex-round-test-support.ts";

const bashQuote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;

function runGitBash(
	gitBash: string,
	args: string[],
	cwd: string,
	env: NodeJS.ProcessEnv,
) {
	return spawnSync(
		gitBash,
		[
			"--noprofile",
			"--norc",
			"-c",
			args.map((arg) => bashQuote(arg.replaceAll("\\", "/"))).join(" "),
		],
		{ cwd, env, encoding: "utf8", windowsHide: true },
	);
}

const powershellQuote = (value: string) => `'${value.replaceAll("'", "''")}'`;

const windowsCommandLine = (parts: readonly string[]) =>
	parts.map((part) => (/[\s"]/.test(part) ? `"${part}"` : part)).join(" ");

function powershellMessageGuard(
	f: ReturnType<typeof fixture>,
	resumeArgs: string[],
) {
	return spawnSync(
		"powershell.exe",
		[
			"-NoProfile",
			"-Command",
			`& ${[process.execPath, script, ...resumeArgs]
				.map(powershellQuote)
				.join(" ")}`,
		],
		{
			cwd: repository,
			env: f.env,
			encoding: "utf8",
			windowsHide: true,
		},
	);
}

function cmdMessageGuard(f: ReturnType<typeof fixture>, resumeArgs: string[]) {
	return spawnSync(
		process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe",
		[
			"/d",
			"/s",
			"/c",
			`"${windowsCommandLine([process.execPath, script, ...resumeArgs])}"`,
		],
		{
			cwd: repository,
			env: f.env,
			encoding: "utf8",
			windowsHide: true,
			windowsVerbatimArguments: true,
		},
	);
}

function messageGuardCases(f: ReturnType<typeof fixture>) {
	const gitBash = findGitBash(f.env.PATH);
	const gitBashEnv = gitBashEnvironment(gitBash, f.env);
	const resumeArgs = ["resume", f.run, "--message", "/api"];
	const bashCase = (name: string, args: string[], refused = true) => ({
		name,
		refused,
		run: () => runGitBash(gitBash, args, repository, gitBashEnv),
	});
	return [
		bashCase("Git Bash pnpm", ["pnpm", "codex:round", ...resumeArgs]),
		bashCase("Git Bash pnpm -s", ["pnpm", "-s", "codex:round", ...resumeArgs]),
		bashCase("Git Bash node", [process.execPath, script, ...resumeArgs]),
		{
			name: "PowerShell node",
			refused: false,
			run: () => powershellMessageGuard(f, resumeArgs),
		},
		{
			name: "cmd node",
			refused: false,
			run: () => cmdMessageGuard(f, resumeArgs),
		},
	];
}

function expectMessageGuard(
	f: ReturnType<typeof fixture>,
	entry: ReturnType<typeof messageGuardCases>[number],
) {
	rmSync(f.capture, { force: true });
	const result = entry.run();
	expect(result.status, `${entry.name}: ${result.stdout}${result.stderr}`).toBe(
		entry.refused ? 1 : 0,
	);
	if (entry.refused) {
		expect(result.stderr).toContain("--message-file");
		expect(existsSync(f.capture)).toBe(false);
		return;
	}
	expect(existsSync(f.capture)).toBe(true);
	expect(f.captured().input).toBe(
		Buffer.from("/api", "utf8").toString("base64"),
	);
}

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
		async () => {
			const f = fixture("\r\n");
			// An executable stand-in and the WSL launcher both precede Git Bash.
			const impostor = path.join(f.bin, "bash.exe");
			copyFileSync(process.execPath, impostor);
			const env = {
				...f.env,
				PATH: `${f.bin}${path.delimiter}${path.join(process.env.SystemRoot ?? "C:/Windows", "System32")}${path.delimiter}${process.env.PATH}`,
			};
			const firstBash = execFileSync("where.exe", ["bash.exe"], {
				env,
				encoding: "utf8",
				windowsHide: true,
			})
				.trim()
				.split(/\r?\n/)[0];
			// where.exe expands short TEMP aliases; vary case and slashes too.
			const impostorAlias = impostor.toUpperCase().replaceAll("\\", "/");
			expect(await samePath(firstBash, impostorAlias)).toBe(true);
			const gitBash = findGitBash(env.PATH);
			expect(await samePath(gitBash, impostorAlias)).toBe(false);
			const args = [process.execPath, script, f.brief, "high", "--run", f.run];
			const psQuote = (value: string) => `'${value.replaceAll("'", "''")}'`;
			const ps = spawnSync(
				"powershell.exe",
				["-NoProfile", "-Command", `& ${args.map(psQuote).join(" ")}`],
				{ cwd: f.root, env, encoding: "utf8", windowsHide: true },
			);
			expect(ps.status, ps.stdout + ps.stderr).toBe(0);
			const first = f.captured();
			// Each shell gets a fresh run with the identical command text.
			for (const file of readdirSync(f.run)) rmSync(path.join(f.run, file));
			const bash = runGitBash(gitBash, args, f.coordinator, env);
			expect(bash.status, bash.stdout + bash.stderr).toBe(0);
			expect(await captureKeys(f.captured())).toEqual(await captureKeys(first));
		},
	);
	it.skipIf(process.platform !== "win32")(
		"names missing Git for Windows Bash in one line",
		() => {
			const f = fixture();
			copyFileSync(process.execPath, path.join(f.bin, "git.exe"));
			copyFileSync(process.execPath, path.join(f.bin, "bash.exe"));
			expect(() => findGitBash(f.bin)).toThrow(
				/^Git for Windows Bash is missing \(required for shell parity\)$/,
			);
		},
	);
	it.skipIf(process.platform !== "win32")(
		"keeps shell metacharacters in run paths as data for .cmd shims",
		async () => {
			const f = fixture();
			const run = path.join(f.root, "run & %PATH% !literal! ^ (space)");
			const result = f.invoke([f.brief, "high", "--run", run]);
			expect(result.status, result.output).toBe(0);
			expect(
				await samePath(
					f.captured().args[10],
					path.join(run, "last-message.md"),
				),
			).toBe(true);
			expect(Buffer.from(f.captured().input, "base64")).toEqual(f.bytes);
		},
	);
	it.skipIf(process.platform !== "win32")(
		"delivers a message file unchanged from PowerShell and Git Bash",
		() => {
			const f = fixture();
			expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
			const message = Buffer.from(
				`double "quote", 'single' quote, backslash before quote: \\"\nالعربية «كما هي» and $PATH\r\nlast line`,
				"utf8",
			);
			const messageFile = path.join(f.root, "resume message.txt");
			writeFileSync(messageFile, message);
			const impostor = path.join(f.bin, "bash.exe");
			copyFileSync(process.execPath, impostor);
			const env = {
				...f.env,
				PATH: `${f.bin}${path.delimiter}${path.join(
					process.env.SystemRoot ?? "C:/Windows",
					"System32",
				)}${path.delimiter}${process.env.PATH}`,
			};
			const args = [
				process.execPath,
				script,
				"resume",
				f.run,
				"--message-file",
				messageFile,
			];
			const psQuote = (value: string) => `'${value.replaceAll("'", "''")}'`;
			const powershells = ["powershell.exe"];
			if (
				spawnSync("where.exe", ["pwsh.exe"], {
					env,
					windowsHide: true,
					stdio: "ignore",
				}).status === 0
			)
				powershells.push("pwsh.exe");
			for (const shell of powershells) {
				const result = spawnSync(
					shell,
					["-NoProfile", "-Command", `& ${args.map(psQuote).join(" ")}`],
					{
						cwd: f.root,
						env,
						encoding: "utf8",
						windowsHide: true,
					},
				);
				expect(result.status, result.stdout + result.stderr).toBe(0);
				expect(Buffer.from(f.captured().input, "base64")).toEqual(message);
			}
			const gitBash = findGitBash(env.PATH);
			const bash = runGitBash(gitBash, args, f.coordinator, env);
			expect(bash.status, bash.stdout + bash.stderr).toBe(0);
			expect(Buffer.from(f.captured().input, "base64")).toEqual(message);
		},
	);
	it.skipIf(process.platform !== "win32")(
		"enforces the Git Bash --message guard through every launcher form",
		() => {
			const f = fixture();
			expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
			for (const entry of messageGuardCases(f)) expectMessageGuard(f, entry);
		},
	);
	it.skipIf(process.platform !== "win32")(
		"keeps the Git Bash guard when pnpm's parent has exited",
		async () => {
			const f = fixture();
			expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
			rmSync(f.capture, { force: true });
			const gitBash = findGitBash(f.env.PATH);
			const status = path.join(f.root, "detached-status.txt");
			const log = path.join(f.root, "detached.log");
			const bashQuote = (value: string) =>
				`'${value.replaceAll("'", "'\\''")}'`;
			const command = `(${[
				"pnpm",
				"-s",
				"codex:round",
				"resume",
				f.run,
				"--message",
				"check /api now",
			]
				.map((arg) => bashQuote(arg.replaceAll("\\", "/")))
				.join(
					" ",
				)} > ${bashQuote(log)} 2>&1; printf '%s' "$?" > ${bashQuote(status)}) &`;
			const outer = spawnSync(
				gitBash,
				["--noprofile", "--norc", "-c", command],
				{
					cwd: repository,
					env: gitBashEnvironment(gitBash, f.env),
					encoding: "utf8",
					windowsHide: true,
				},
			);
			expect(outer.status, outer.stdout + outer.stderr).toBe(0);
			await vi.waitFor(
				() => {
					expect(existsSync(status)).toBe(true);
				},
				{ timeout: 30_000, interval: 25 },
			);
			expect(readFileSync(status, "utf8")).toBe("1");
			expect(readFileSync(log, "utf8")).toContain("--message-file");
			expect(existsSync(f.capture)).toBe(false);
		},
	);
	it.skipIf(process.platform !== "win32")(
		"decodes PowerShell Out-File and Set-Content defaults",
		() => {
			const f = fixture();
			expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
			const outFile = path.join(f.root, "out-file message.txt");
			const setFile = path.join(f.root, "set-content message.txt");
			const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;
			const powershell = spawnSync(
				"powershell.exe",
				[
					"-NoProfile",
					"-Command",
					`"العربية\`r\`nASCII" | Out-File -LiteralPath ${quote(outFile)}; "العربية\`r\`nASCII" | Set-Content -LiteralPath ${quote(setFile)}`,
				],
				{ cwd: f.root, encoding: "utf8", windowsHide: true },
			);
			expect(powershell.status, powershell.stdout + powershell.stderr).toBe(0);
			expect(
				f.invoke(["resume", f.run, "--message-file", outFile]).status,
			).toBe(0);
			expect(Buffer.from(f.captured().input, "base64")).toEqual(
				Buffer.from("العربية\r\nASCII\r\n", "utf8"),
			);
			expect(
				f.invoke(["resume", f.run, "--message-file", setFile]).status,
			).toBe(0);
			expect(Buffer.from(f.captured().input, "base64")).toEqual(
				Buffer.from("???????\r\nASCII\r\n", "utf8"),
			);
		},
	);
});

it("prints the command's usage without starting Codex", () => {
	const f = fixture();
	const result = f.invoke(["--help"]);
	expect(result.status).toBe(0);
	expect(result.stdout).toContain(
		"Usage: pnpm codex:round [--] <brief> [<level>] [--model <model>] [--run <folder>] [--new-review]",
	);
	expect(result.stdout).toContain(
		"pnpm codex:round [--] resume <folder> [--message <text> | --message-file <file>]",
	);
	expect(result.stdout).toContain(
		"--message sends the exact text instead of the saved launch input.",
	);
	expect(result.stdout).toContain("resumes automatically up to 10 times");
	expect(result.stdout).toContain(
		"Models: deepseek-v4.1-flash (default), gpt-6.1-sol.",
	);
	expect(result.stdout).toContain(
		"Levels: deepseek-v4.1-flash: high, max (default max); gpt-6.1-sol: medium, high, xhigh, max.",
	);
	expect(existsSync(f.capture)).toBe(false);
});
