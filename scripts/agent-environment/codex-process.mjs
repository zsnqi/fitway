// Starting the Codex process, through cmd.exe for a Windows command script.
import { spawn } from "node:child_process";

function startCodex(
	executable,
	args,
	worktree,
	environment = process.env,
	stderr = "inherit",
) {
	const options = {
		cwd: worktree,
		stdio: ["pipe", "pipe", stderr],
		env: environment,
		windowsHide: true,
	};
	if (process.platform !== "win32" || !/\.(cmd|bat)$/i.test(executable))
		return spawn(executable, args, options);
	// Expand environment references once, with delayed expansion disabled. The
	// values are quoted data; embedded percent references are not expanded again.
	const env = { ...environment, FITWAY_CODEX_COMMAND: executable };
	const references = args.map((argument, index) => {
		// cmd.exe strips unescaped quotes while expanding a quoted %VAR%.
		// Keep embedded quotes in the child argv without re-interpreting %.
		env[`FITWAY_CODEX_ARG_${index}`] = argument.replaceAll('"', '\\"');
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

export { startCodex };
