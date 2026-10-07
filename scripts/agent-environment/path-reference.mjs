import { stat } from "node:fs/promises";
import path from "node:path";
import { readGit } from "./git-context.mjs";

export async function exists(absolute) {
	try {
		return await stat(absolute);
	} catch (error) {
		if (error.code === "ENOENT" || error.code === "ENOTDIR") return null;
		throw error;
	}
}

export function referenceTarget(file) {
	const wildcard = /[*?]/.test(file);
	const prefix = file.split(/[*?]/, 1)[0];
	return {
		wildcard,
		file: wildcard ? prefix.slice(0, prefix.lastIndexOf("/") + 1) || "." : file,
	};
}

function pathReference(value, { allowBare = false } = {}) {
	const normalized = value.trim().replaceAll("\\", "/");
	// Machine-local absolute paths (a drive letter, a UNC share or a home folder) are not judged: they exist on one
	// machine only, and these files are read on others (CI, cloud sessions). Repository paths are written from the root.
	if (
		/<[^>]*>/.test(normalized) ||
		/^v?\d+\.\d+(?:\.\d+)?(?:[-+][\w.-]+)?$/.test(normalized) ||
		/^[a-z]:\//i.test(normalized) ||
		/^\/\/[^/]/.test(normalized) ||
		/^~\//.test(normalized) ||
		/^(?:pnpm|npm|node|git|npx|powershell|pwsh)\s/i.test(normalized) ||
		/^[a-z][a-z\d+.-]*:\/\//i.test(normalized) ||
		/^@[^@/\s]+\/[^@/\s]+(?:@[^/\r\n]+)?$/.test(normalized)
	)
		return null;
	// With `s`, no character in the value can make the match fail.
	const match = normalized.match(
		/^(.*?)(?::(\d+)(?:-(\d+))?)?(?:\s+§"([^"]+)")?$/s,
	);
	const file = match[1];
	// Bare names are mentions except in the two explicit resume-point path headers.
	// A single leading slash also occurs in API routes such as `/api`.
	if (!allowBare && !file.includes("/", file.startsWith("/") ? 1 : 0))
		return null;
	// A line selector is `:line` or a range `:start-end`.
	return {
		file,
		line: match[2] ? Number(match[2]) : null,
		endLine: match[3] ? Number(match[3]) : null,
		heading: match[4],
	};
}

export function createPathReferenceResolver(repositoryRoot, git = readGit) {
	let branches;
	let trackedPaths;
	function gitEntries(args, separator = "\n") {
		try {
			return git(repositoryRoot, args).split(separator).filter(Boolean);
		} catch (error) {
			// Non-Git directories have no branches or tracked suffix suggestions.
			if (/not a git repository/i.test(error.stderr?.toString() ?? ""))
				return [];
			throw error;
		}
	}
	async function reference(value, options) {
		const candidate = pathReference(value, options);
		if (!candidate?.file.includes("/")) return candidate;
		if (await exists(path.resolve(repositoryRoot, candidate.file)))
			return candidate;
		branches ??= new Set(
			gitEntries([
				"for-each-ref",
				"--format=%(refname)",
				"refs/heads/",
				"refs/remotes/",
			]).flatMap((ref) => [
				ref,
				ref.slice("refs/".length),
				ref.replace(/^refs\/(?:heads|remotes)\//, ""),
				// A remote-tracking branch also by its plain name: CI checks out one branch and fetches the rest as remotes.
				ref.replace(/^refs\/remotes\/[^/]+\//, ""),
			]),
		);
		return branches.has(candidate.file) ? null : candidate;
	}
	function missingPathHint(file) {
		let suggestion = "";
		if (!path.isAbsolute(file) && !/[*?]/.test(file)) {
			trackedPaths ??= new Set(
				gitEntries(["ls-files", "-z"], "\0").flatMap((tracked) => {
					const entries = [tracked];
					for (
						let folder = path.posix.dirname(tracked);
						folder !== ".";
						folder = path.posix.dirname(folder)
					)
						entries.push(folder);
					return entries;
				}),
			);
			const suffix = `/${path.posix.normalize(file).replace(/\/+$/, "")}`;
			const matches = [...trackedPaths].filter((entry) =>
				entry.endsWith(suffix),
			);
			if (matches.length === 1)
				suggestion = `; tracked suffix match: ${path.resolve(repositoryRoot, matches[0])}`;
		}
		return `; repository paths are written from the repository root${suggestion}`;
	}
	return { reference, missingPathHint };
}
