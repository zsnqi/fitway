// Review-source path resolution, copying, and credential checks.

import { execFileSync } from "node:child_process";
import { readFile, realpath, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { mask } from "./brief-markdown.mjs";

const REVIEW_TEMP_ROOT =
	process.platform === "win32" ? "D:/fitway-temp" : tmpdir();

let reviewSourcePlaceObserver;

export function setReviewSourcePlaceObserver(observer) {
	reviewSourcePlaceObserver = observer;
}

function recordReviewSourcePlace(value, kind) {
	reviewSourcePlaceObserver?.({ kind, value });
}

function sourceFileValue(value) {
	return value.replace(/:\d+(?:-\d+)?$/, "");
}

function isAbsolutePath(value) {
	return path.isAbsolute(value) || path.win32.isAbsolute(value);
}

function repositorySourcePath(value) {
	const normalized = value.replaceAll("\\", "/");
	if (
		!normalized ||
		normalized.startsWith("/") ||
		/^[A-Za-z]:/.test(normalized)
	)
		return null;
	const result = path.posix.normalize(normalized);
	if (
		result === "." ||
		result === ".." ||
		result.startsWith("../") ||
		result.includes("/../")
	)
		return null;
	return result;
}

function looksLikeNamedSource(value) {
	const trimmed = value.trim();
	if (!trimmed || /[\r\n]/.test(trimmed)) return false;
	if (isAbsolutePath(trimmed)) return true;
	if (repositorySourcePath(trimmed)) {
		return (
			trimmed.includes("/") ||
			trimmed.includes("\\") ||
			/\.[A-Za-z0-9]+$/.test(trimmed)
		);
	}
	return false;
}

export function namedReviewSourceEntries(brief) {
	const text = brief.toString("utf8").replace(/<!--[\s\S]*?-->/g, mask);
	const found = [];
	let section = null;
	const lines = text.split(/\r?\n/);
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		const heading = line.match(/^#{1,6}\s+(.*)$/);
		const boldBullet = line.match(/^\s*-\s+\*\*([^*]+)\*\*/);
		const label = heading?.[1]?.trim() ?? boldBullet?.[1]?.trim() ?? "";
		if (heading || (boldBullet && !/^\s{2,}/.test(line))) {
			if (/^Read first\b/i.test(label)) section = "read first";
			else if (/^Decisions\b/i.test(label)) section = "decisions";
			else section = null;
		}
		const decisionsLine = /\bDecisions\s*:/i.test(line);
		if (section !== "read first" && section !== "decisions" && !decisionsLine)
			continue;
		for (const span of line.matchAll(/(`+)([^`]*?)\1(?!`)/g)) {
			const value = span[2].trim();
			if (looksLikeNamedSource(value)) found.push({ value, line: index + 1 });
		}
	}
	const seen = new Set();
	return found.filter((entry) => {
		if (seen.has(entry.value)) return false;
		seen.add(entry.value);
		return true;
	});
}

export function namedReviewSources(brief) {
	return namedReviewSourceEntries(brief).map((entry) => entry.value);
}

function isCredentialSourceName(value) {
	const name = path.basename(sourceFileValue(value)).toLowerCase();
	return (
		name === ".env" ||
		(/^\.env\.[^.]+$/.test(name) &&
			!/\.(?:example|sample|template)$/.test(name)) ||
		name === ".netrc" ||
		name === "auth.json" ||
		/^id_(?:rsa|ed25519|ecdsa)$/.test(name) ||
		/\.(?:key|pem|p12|pfx|ppk)$/.test(name)
	);
}

export function isCredentialSource(value, bytes) {
	return (
		isCredentialSourceName(value) ||
		/-----BEGIN [^-]*PRIVATE KEY-----/.test(bytes.toString("utf8"))
	);
}

function isWithin(root, absolute) {
	const rootValue = path.resolve(root);
	const absoluteValue = path.resolve(absolute);
	const relative = path.relative(
		process.platform === "win32" ? rootValue.toLowerCase() : rootValue,
		process.platform === "win32" ? absoluteValue.toLowerCase() : absoluteValue,
	);
	return (
		relative === "" ||
		(!relative.startsWith("..") && !path.isAbsolute(relative))
	);
}

async function realSourcePath(value) {
	try {
		return await realpath(path.resolve(value));
	} catch (error) {
		if (error.code === "ENOENT" || error.code === "ENOTDIR")
			throw new Error(`named review source not found: ${value}`);
		throw error;
	}
}

async function requireSourceFile(absolute, value) {
	let details;
	try {
		details = await stat(absolute);
	} catch (error) {
		if (error.code === "ENOENT" || error.code === "ENOTDIR")
			throw new Error(`named review source not found: ${value}`);
		throw error;
	}
	if (!details.isFile())
		throw new Error(`named review source is not a file: ${value}`);
}

function gitSourceBytes(worktree, head, relative, value, label) {
	const objectPath = relative.replace(/\/+$/, "");
	if (!objectPath) throw new Error(`invalid named review source: ${value}`);
	let listing;
	try {
		listing = execFileSync("git", ["ls-tree", "-z", head, "--", objectPath], {
			cwd: worktree,
			encoding: "utf8",
			maxBuffer: 256 * 1024 * 1024,
			stdio: ["ignore", "pipe", "pipe"],
			windowsHide: true,
		});
	} catch {
		throw new Error(`${label} not found: ${value}`);
	}
	const entry = listing
		.split("\0")
		.filter(Boolean)
		.find((line) => line.slice(line.indexOf("\t") + 1) === objectPath);
	if (!entry) throw new Error(`${label} not found: ${value}`);
	const [metadata] = entry.split("\t");
	const [mode, type] = metadata.trim().split(/\s+/);
	if (type !== "blob" || !/^100(?:644|755)$/.test(mode)) {
		if (mode === "120000")
			throw new Error(`${label} is a symbolic link: ${value}`);
		throw new Error(`${label} is not a file: ${value}`);
	}
	recordReviewSourcePlace(
		value,
		label === "absolute review source" ? "checkout" : "repository",
	);
	try {
		return execFileSync("git", ["show", `${head}:${objectPath}`], {
			cwd: worktree,
			encoding: "buffer",
			maxBuffer: 256 * 1024 * 1024,
			stdio: ["ignore", "pipe", "pipe"],
			windowsHide: true,
		});
	} catch {
		throw new Error(`${label} not found: ${value}`);
	}
}

export async function reviewSourcePlan(
	value,
	{ worktree, head, checkoutRoot } = {},
) {
	const sourceValue = sourceFileValue(value);
	if (isAbsolutePath(sourceValue)) {
		const real = await realSourcePath(sourceValue);
		let insideTemp = false;
		let insideCheckout = false;
		for (const root of [REVIEW_TEMP_ROOT, checkoutRoot].filter(Boolean)) {
			let realRoot;
			try {
				realRoot = await realpath(path.resolve(root));
			} catch {
				continue;
			}
			if (root === REVIEW_TEMP_ROOT) insideTemp = isWithin(realRoot, real);
			else insideCheckout = isWithin(realRoot, real);
		}
		if (insideTemp) {
			await requireSourceFile(real, value);
			recordReviewSourcePlace(value, "temp");
			const realRoot = await realpath(path.resolve(REVIEW_TEMP_ROOT));
			const relative = path.relative(realRoot, real);
			return {
				kind: "temp",
				value,
				target: path.join("temp", relative),
				bytes: await readFile(real),
			};
		}
		if (insideCheckout) {
			await requireSourceFile(real, value);
			const realRoot = await realpath(path.resolve(checkoutRoot));
			const relative = path.relative(realRoot, real).replaceAll(path.sep, "/");
			if (!relative)
				throw new Error(`absolute review source is not a file: ${value}`);
			const bytes = gitSourceBytes(
				checkoutRoot,
				"HEAD",
				relative,
				value,
				"absolute review source",
			);
			const working = await readFile(real);
			if (!bytes.equals(working))
				throw new Error(
					`absolute review source differs from the launcher checkout HEAD: ${value}`,
				);
			return {
				kind: "checkout",
				value,
				target: path.join("checkout", ...relative.split("/")),
				bytes,
			};
		}
		throw new Error(
			`absolute review source is outside D:/fitway-temp and the launcher checkout: ${value}`,
		);
	}
	const relative = repositorySourcePath(sourceValue);
	if (!relative) throw new Error(`invalid named review source: ${value}`);
	return {
		kind: "repository",
		value,
		target: relative,
		bytes: gitSourceBytes(
			worktree,
			head,
			relative,
			value,
			"named review source",
		),
	};
}

async function validateReviewSources(
	text,
	{ worktree, head, repositoryRoot, report },
) {
	const targets = new Map();
	for (const entry of namedReviewSourceEntries(text)) {
		const { value, line } = entry;
		if (isCredentialSourceName(value)) {
			report(
				"brief-review-sources",
				line,
				`named review source holds credentials: ${value}`,
			);
			continue;
		}
		try {
			const source = await reviewSourcePlan(value, {
				worktree,
				head,
				checkoutRoot: repositoryRoot,
			});
			const key = path.normalize(source.target).replaceAll("\\", "/");
			const targetKey = process.platform === "win32" ? key.toLowerCase() : key;
			if (targets.has(targetKey)) {
				report(
					"brief-review-sources",
					line,
					`two named review sources map to one file: ${value}; also ${targets.get(targetKey)}`,
				);
			} else targets.set(targetKey, value);
		} catch (error) {
			report("brief-review-sources", line, error.message);
		}
	}
}

export { isWithin, validateReviewSources };
