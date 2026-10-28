import { existsSync } from "node:fs";
import { lstat, readdir, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { collectTrackedCitationRecords } from "./cited-evidence.mjs";
import { citationIndex, citationsAtOrAbove, inside, key } from "./facts.mjs";
import {
	collectGit,
	filesystemPath,
	inspectWorktreeLinks,
	root,
} from "./survey-evidence.mjs";

export const SCRIPT_EXTENSIONS = new Set([
	".mjs",
	".js",
	".cjs",
	".py",
	".ps1",
	".sh",
]);

const CAPTURE_EXTENSIONS = new Set([
	".7z",
	".avi",
	".avif",
	".bmp",
	".bz2",
	".gif",
	".gz",
	".har",
	".jpeg",
	".jpg",
	".jsonl",
	".m4v",
	".mkv",
	".mov",
	".mp4",
	".ndjson",
	".png",
	".rar",
	".tar",
	".tgz",
	".tif",
	".tiff",
	".trace",
	".webm",
	".webp",
	".xz",
	".zip",
]);

const CAPTURE_NAME = new RegExp(
	`[\\w .-]+\\.(?:${[...CAPTURE_EXTENSIONS]
		.map((extension) => extension.slice(1))
		.join("|")})\\b`,
	"gi",
);

function withoutLinks(links, excluded = []) {
	return links.filter(
		(link) => !excluded.some((exclude) => inside(exclude, link.path)),
	);
}

function withheldFolder(folder, reason, links = []) {
	return {
		path: folder,
		bytes: 0,
		candidates: 0,
		deleteFiles: [],
		files: 0,
		kept: {
			bytes: 0,
			captureNamedByText: 0,
			citedFile: 0,
			files: 0,
			nonCaptureInCitedFolder: 0,
		},
		links: withoutLinks(links),
		withheld: reason,
	};
}

async function walkFiles(directory, excluded, visit) {
	if (excluded.some((exclude) => inside(exclude, directory))) return;
	for (const entry of await readdir(filesystemPath(directory), {
		withFileTypes: true,
	})) {
		const child = path.join(directory, entry.name);
		if (excluded.some((exclude) => inside(exclude, child))) continue;
		const info = await lstat(filesystemPath(child));
		if (info.isSymbolicLink()) continue;
		if (info.isDirectory()) await walkFiles(child, excluded, visit);
		else if (info.isFile())
			await visit({
				path: child.replaceAll("\\", "/"),
				size: info.size,
				extension: path.extname(child).toLowerCase(),
			});
	}
}

function hasCitedAncestor(file, folder, citedFolders) {
	let current = path.dirname(file);
	while (inside(folder, current)) {
		if (citedFolders.has(key(current))) return true;
		if (key(current) === key(folder)) break;
		current = path.dirname(current);
	}
	return false;
}

async function citedDirectories(folder, index) {
	const citedFolders = new Set();
	for (const target of index.keys())
		if (inside(folder, target)) {
			try {
				if ((await lstat(filesystemPath(target))).isDirectory())
					citedFolders.add(target);
			} catch {
				// Missing citations cannot protect a folder.
			}
		}
	return citedFolders;
}

function keepNonCapture(file, folder, index, citedFolders, totals) {
	let reason = null;
	if (hasCitedAncestor(file.path, folder, citedFolders))
		reason = "nonCaptureInCitedFolder";
	else if (citationsAtOrAbove(file.path, index).length) reason = "citedFile";
	if (!reason) return false;
	totals.kept.files += 1;
	totals.kept.bytes += file.size;
	totals.kept[reason] += 1;
	if (totals.kept.examples.length < 10)
		totals.kept.examples.push({ path: file.path, reason });
	return true;
}

async function scanFolder(folder, index, excluded) {
	const citedFolders = await citedDirectories(folder, index);
	const names = new Map();
	const captures = [];
	const totals = {
		kept: {
			bytes: 0,
			captureNamedByText: 0,
			citedFile: 0,
			examples: [],
			files: 0,
			nonCaptureInCitedFolder: 0,
		},
	};
	const deleteFiles = [];
	let files = 0;
	let bytes = 0;
	await walkFiles(folder, excluded, async (file) => {
		files += 1;
		if (CAPTURE_EXTENSIONS.has(file.extension)) {
			captures.push(file);
			return;
		}
		if (keepNonCapture(file, folder, index, citedFolders, totals)) {
			try {
				const text = await readFile(filesystemPath(file.path), "utf8");
				const directory = path.dirname(file.path);
				const found = names.get(key(directory)) ?? new Set();
				for (const match of text.matchAll(CAPTURE_NAME))
					found.add(path.basename(match[0].trim()).toLowerCase());
				names.set(key(directory), found);
			} catch {
				// An unreadable kept file names no additional captures.
			}
			return;
		}
		bytes += file.size;
		deleteFiles.push(file.path);
	});
	for (const file of captures) {
		const directory = path.dirname(file.path);
		const cited = index.has(key(file.path));
		if (
			cited ||
			names.get(key(directory))?.has(path.basename(file.path).toLowerCase())
		) {
			totals.kept.files += 1;
			totals.kept.bytes += file.size;
			totals.kept[cited ? "citedFile" : "captureNamedByText"] += 1;
			if (totals.kept.examples.length < 10)
				totals.kept.examples.push({
					path: file.path,
					reason: cited ? "citedFile" : "captureNamedByText",
				});
		} else {
			bytes += file.size;
			deleteFiles.push(file.path);
		}
	}
	return { bytes, deleteFiles, files, kept: totals.kept };
}

async function planFolder(
	folder,
	records,
	worktrees,
	excluded,
	inspectLinks,
	tempRoot,
	measurement,
) {
	if (
		worktrees.some((worktree) => worktree.path && inside(folder, worktree.path))
	)
		return withheldFolder(folder, "registered worktree");
	const inspected =
		measurement && !measurement.skippedLinks && !measurement.errors?.length
			? { linksMeasured: true, links: [], linkErrors: [] }
			: await inspectLinks(folder);
	const unsafe =
		Boolean(measurement?.errors?.length) ||
		!inspected.linksMeasured ||
		inspected.linkErrors.length ||
		inspected.links.some((link) => link.outside !== false || link.error);
	if (unsafe)
		return withheldFolder(
			folder,
			"unsafe or unmeasured links",
			inspected.links,
		);

	const index = citationIndex(records, { tempRoot });
	const scanned = await scanFolder(folder, index, excluded);
	return {
		...scanned,
		path: folder,
		candidates: scanned.deleteFiles.length,
		links: withoutLinks(inspected.links, excluded),
		withheld: null,
	};
}

export async function planEvidencePrune({
	excluded = [],
	folderPaths,
	inspectLinks = inspectWorktreeLinks,
	measurements = [],
	records,
	tempRoot = "D:/fitway-temp",
	worktrees = [],
}) {
	const resolvedRoot = path.resolve(tempRoot);
	const folders =
		folderPaths ??
		(
			await readdir(filesystemPath(resolvedRoot), {
				withFileTypes: true,
			})
		)
			.filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
			.map((entry) => path.join(resolvedRoot, entry.name));
	const plans = [];
	for (const folder of folders) {
		const resolved = path.resolve(folder);
		if (
			key(path.dirname(resolved)) !== key(resolvedRoot) ||
			!inside(resolvedRoot, resolved)
		)
			throw new Error(`Prune target is not a top-level temp folder: ${folder}`);
		plans.push(
			await planFolder(
				resolved,
				records,
				worktrees,
				excluded.map((item) => path.resolve(item)),
				inspectLinks,
				resolvedRoot,
				measurements.find((item) => key(item.path) === key(resolved)),
			),
		);
	}
	return plans;
}

function reportDate(text) {
	const frontmatter = text?.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!frontmatter) return null;
	try {
		return String(parseYaml(frontmatter[1])?.date ?? "") || null;
	} catch {
		return null;
	}
}

async function countScripts(directory, excluded, totals) {
	const entries = await readdir(filesystemPath(directory), {
		withFileTypes: true,
	});
	if (entries.some((entry) => entry.name === ".git")) return;
	for (const entry of entries) {
		if (entry.name === "node_modules" || entry.name === ".git") continue;
		const child = path.join(directory, entry.name);
		if (excluded.paths.some((item) => inside(item, child))) continue;
		const info = await lstat(filesystemPath(child));
		if (info.isSymbolicLink()) continue;
		if (info.isDirectory()) await countScripts(child, excluded, totals);
		else if (
			info.isFile() &&
			SCRIPT_EXTENSIONS.has(path.extname(child).toLowerCase())
		)
			totals.scripts += 1;
	}
}

export async function countNewTempScripts({
	excluded = [],
	previousReportText,
	tempRoot = "D:/fitway-temp",
} = {}) {
	const since = reportDate(previousReportText);
	if (!since || !existsSync(tempRoot)) return { folders: [], since, total: 0 };
	const sinceTime = Date.parse(`${since}T00:00:00Z`);
	const folders = [];
	for (const entry of await readdir(filesystemPath(tempRoot), {
		withFileTypes: true,
	})) {
		if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
		const folder = path.join(tempRoot, entry.name);
		const info = await lstat(filesystemPath(folder));
		if (info.birthtimeMs < sinceTime) continue;
		const excludedPaths = excluded.map((item) => path.resolve(item));
		if (excludedPaths.some((item) => inside(item, folder))) continue;
		const totals = { scripts: 0 };
		await countScripts(folder, { paths: excludedPaths }, totals);
		folders.push({
			path: folder.replaceAll("\\", "/"),
			scripts: totals.scripts,
		});
	}
	return {
		folders,
		since,
		total: folders.reduce((sum, folder) => sum + folder.scripts, 0),
	};
}

export async function pruneEvidence(snapshot, { checkout = root } = {}) {
	if (
		key(snapshot.root) !== key(checkout) ||
		!path.isAbsolute(snapshot.tempRoot)
	)
		throw new Error("Prune snapshot has a different checkout or temp root");
	const records = await collectTrackedCitationRecords({ checkout });
	const git = await collectGit(records, { current: checkout });
	const plans = await planEvidencePrune({
		folderPaths: snapshot.folders,
		records,
		tempRoot: snapshot.tempRoot,
		worktrees: git.worktrees,
	});
	let failures = 0;
	for (const plan of plans) {
		if (plan.withheld) {
			failures += 1;
			console.error(`FAILED: ${plan.path}: ${plan.withheld}`);
			continue;
		}
		let folderFailures = 0;
		for (const file of plan.deleteFiles) {
			try {
				const info = await lstat(filesystemPath(file));
				if (!info.isFile() || info.isSymbolicLink())
					throw new Error("candidate is no longer a regular file");
				await unlink(filesystemPath(file));
			} catch (error) {
				failures += 1;
				folderFailures += 1;
				console.error(`FAILED: ${file}: ${error.message}`);
			}
		}
		if (!folderFailures)
			console.log(
				`PRUNED: ${plan.path}: ${plan.bytes} bytes in ${plan.candidates} files`,
			);
	}
	console.log(
		`PRUNE ${failures ? "FAIL" : "PASS"}: ${plans.length} folders, ${failures} failures`,
	);
	process.exitCode = failures ? 1 : 0;
}
