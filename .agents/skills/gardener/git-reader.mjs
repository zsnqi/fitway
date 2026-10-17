import { execFileSync } from "node:child_process";

export function readGit(args, cwd, { trimEnd = true } = {}) {
	const output = execFileSync("git", ["--no-optional-locks", ...args], {
		cwd,
		encoding: "utf8",
		windowsHide: true,
		maxBuffer: 32 * 1024 * 1024,
	});
	return trimEnd ? output.trimEnd() : output;
}
