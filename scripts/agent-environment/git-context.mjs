import { execFileSync } from "node:child_process";

export function readGit(repositoryRoot, args) {
	return execFileSync("git", args, {
		cwd: repositoryRoot,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
		windowsHide: true,
	}).trim();
}

// Reads fetched refs only. Detached HEADs and branches without upstreams are quiet.
export function behindUpstreamWarning(repositoryRoot, git = readGit) {
	try {
		const branch = git(repositoryRoot, [
			"symbolic-ref",
			"--quiet",
			"--short",
			"HEAD",
		]);
		const upstream = git(repositoryRoot, [
			"rev-parse",
			"--abbrev-ref",
			"--symbolic-full-name",
			"@{upstream}",
		]);
		const behind = Number(
			git(repositoryRoot, ["rev-list", "--count", "HEAD..@{upstream}"]),
		);
		if (!Number.isInteger(behind) || behind <= 0) return null;
		return `WARNING: branch ${branch} is behind ${upstream} by ${behind} commit(s); fetched refs only. Read the upstream resume point before continuing.`;
	} catch {
		return null;
	}
}
