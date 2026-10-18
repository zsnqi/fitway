// Tracked-path inspection and path classification.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readdir, readlink, realpath, stat } from "node:fs/promises";
import path from "node:path";
import {
	HISTORICAL_PREFIXES,
	ILLEGAL_STARTUP_SEGMENTS,
	PACKET_DIRECTORY,
} from "./agent-context-rules.mjs";

function asError(value) {
	return value instanceof Error ? value.message : String(value);
}

function normalizeRelativePath(value) {
	if (typeof value !== "string" || value.trim() === "") {
		throw new Error("path must be a non-empty repository-relative string");
	}
	const normalized = value.replaceAll("\\", "/").replace(/^\.\//, "");
	if (
		path.posix.isAbsolute(normalized) ||
		/^[A-Za-z]:\//.test(normalized) ||
		normalized.split("/").some((part) => part === ".." || part === "")
	) {
		throw new Error(`path is not a safe repository-relative path: ${value}`);
	}
	return normalized;
}

function sha256(bytes) {
	return createHash("sha256").update(bytes).digest("hex");
}

function stablePacketPath(milestoneId) {
	return `${PACKET_DIRECTORY}/${milestoneId}.yaml`;
}

function normalizeHeading(value) {
	return String(value)
		.replace(/^\s*#{1,6}\s*/, "")
		.replace(/\s+#+\s*$/, "")
		.trim()
		.replace(/\s+/g, " ");
}

function isHistoricalPath(relativePath) {
	const normalized = relativePath.replaceAll("\\", "/");
	return HISTORICAL_PREFIXES.some(
		(prefix) => normalized === prefix || normalized.startsWith(prefix),
	);
}

function isIllegalStartupPath(relativePath) {
	const normalized = relativePath.replaceAll("\\", "/");
	if (isHistoricalPath(normalized)) return true;
	const segments = normalized.toLowerCase().split("/");
	return segments.some((segment) => ILLEGAL_STARTUP_SEGMENTS.includes(segment));
}

export async function inspectPath(root, relativePath) {
	let normalized;
	try {
		normalized = normalizeRelativePath(relativePath);
	} catch (error) {
		return { normalized: relativePath, exists: false, unsafe: asError(error) };
	}
	const rootRealPath = await realpath(root).catch((_error) => null);
	if (!rootRealPath) {
		return {
			normalized,
			exists: false,
			error: `repository root cannot be resolved: ${root}`,
		};
	}
	let current = root;
	const isOutsideRoot = (candidate) => {
		const relative = path.relative(rootRealPath, candidate);
		return (
			relative === ".." ||
			relative.startsWith(`..${path.sep}`) ||
			path.isAbsolute(relative)
		);
	};
	const segments = normalized.split("/");
	for (const segment of segments) {
		let entries;
		try {
			entries = await readdir(current);
		} catch (error) {
			if (error?.code === "ENOENT") {
				return { normalized, exists: false, caseMismatch: false };
			}
			return { normalized, exists: false, error: asError(error) };
		}
		if (!entries.includes(segment)) {
			const folded = entries.find(
				(entry) => entry.toLowerCase() === segment.toLowerCase(),
			);
			return {
				normalized,
				exists: false,
				caseMismatch: Boolean(folded),
				actualCase: folded,
			};
		}
		current = path.join(current, segment);
		try {
			const resolved = await realpath(current);
			if (isOutsideRoot(resolved)) {
				return {
					normalized,
					exists: false,
					escape: true,
					resolved,
				};
			}
		} catch (error) {
			if (error?.code !== "ENOENT") {
				return { normalized, exists: false, error: asError(error) };
			}
			try {
				if ((await lstat(current)).isSymbolicLink()) {
					const linkTarget = await readlink(current);
					const resolvedLink = path.resolve(path.dirname(current), linkTarget);
					if (isOutsideRoot(resolvedLink)) {
						return {
							normalized,
							exists: false,
							escape: true,
							resolved: resolvedLink,
						};
					}
				}
			} catch (linkError) {
				if (linkError?.code !== "ENOENT") {
					return { normalized, exists: false, error: asError(linkError) };
				}
			}
		}
	}
	try {
		const resolved = await realpath(current);
		if (isOutsideRoot(resolved)) {
			return { normalized, exists: false, escape: true, resolved };
		}
		const details = await stat(resolved);
		return {
			normalized,
			exists: true,
			isDirectory: details.isDirectory(),
			absolute: resolved,
		};
	} catch (error) {
		return { normalized, exists: false, error: asError(error) };
	}
}

function isGitRepository(root) {
	try {
		execFileSync("git", ["rev-parse", "--show-toplevel"], {
			cwd: root,
			stdio: ["ignore", "pipe", "ignore"],
		});
		return true;
	} catch {
		return false;
	}
}

function trackedPath(root, relativePath) {
	try {
		const output = execFileSync(
			"git",
			["ls-files", "--error-unmatch", "--", relativePath],
			{ cwd: root, stdio: ["ignore", "pipe", "ignore"], encoding: "utf8" },
		);
		return output.trim().length > 0;
	} catch {
		return false;
	}
}

export {
	asError,
	isGitRepository,
	isHistoricalPath,
	isIllegalStartupPath,
	normalizeHeading,
	normalizeRelativePath,
	sha256,
	stablePacketPath,
	trackedPath,
};
