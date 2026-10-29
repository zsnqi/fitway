import { existsSync } from "node:fs";
import { lstat, readdir, readFile, rm, unlink } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { collectTrackedCitationRecords } from "./cited-evidence.mjs";
import {
	citationIndex,
	citationsAtOrAbove,
	inside,
	key,
	MIN_FOLDER_AGE_DAYS,
} from "./facts.mjs";
import {
	collectGit,
	describeLink,
	filesystemPath,
	inspectWorktreeLinks,
	measureFolder,
	plainPath,
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

const CAPTURE_EXTENSION_PATTERN = [...CAPTURE_EXTENSIONS]
	.map((extension) => extension.slice(1))
	.join("|");
// A capture name is a token without spaces; a path before it (`frames/en.png`) leaves `en.png`.
const CAPTURE_TOKEN = new RegExp(
	`[\\w.-]+\\.(?:${CAPTURE_EXTENSION_PATTERN})\\b`,
	"gi",
);
// Inside backticks or straight quotes a name may hold spaces.
const QUOTED_CAPTURE = new RegExp(
	`([\`"'])([^\`"'\\r\\n]*?\\.(?:${CAPTURE_EXTENSION_PATTERN}))\\1`,
	"gi",
);
// Inside a cited folder these are kept whole and never walked, like a directory holding `.git`.
const KEPT_WHOLE_NAMES = new Set(["node_modules"]);

function captureNames(text, names) {
	for (const match of text.matchAll(CAPTURE_TOKEN))
		names.add(match[0].toLowerCase());
	for (const match of text.matchAll(QUOTED_CAPTURE))
		names.add(
			path.posix.basename(match[2].replaceAll("\\", "/")).trim().toLowerCase(),
		);
}

const slashed = (value) => value.replaceAll("\\", "/");

function withoutLinks(links, excluded = []) {
	return links.filter(
		(link) => !excluded.some((exclude) => inside(exclude, link.path)),
	);
}

function emptyKept() {
	return {
		bytes: 0,
		captureNamedByText: 0,
		citedFile: 0,
		examples: [],
		files: 0,
		nonCaptureInCitedFolder: 0,
		wholeFolders: 0,
	};
}

function withheldFolder(folder, reason, links = []) {
	return {
		path: folder,
		bytes: 0,
		candidates: 0,
		deleteDirectories: [],
		deleteFiles: [],
		files: 0,
		kept: emptyKept(),
		links: withoutLinks(links),
		unmeasured: 0,
		withheld: reason,
	};
}

// Visits every regular file below a directory without following links. `skipNames`
// drops entries by name and `skipGitTrees` drops any directory that holds `.git`.
async function walkFiles(
	directory,
	excluded,
	visit,
	{ skipGitTrees = false, skipNames = [] } = {},
) {
	if (excluded.some((exclude) => inside(exclude, directory))) return;
	const entries = await readdir(filesystemPath(directory), {
		withFileTypes: true,
	});
	if (skipGitTrees && entries.some((entry) => entry.name === ".git")) return;
	for (const entry of entries) {
		if (skipNames.includes(entry.name)) continue;
		const child = path.join(directory, entry.name);
		if (excluded.some((exclude) => inside(exclude, child))) continue;
		const info = await lstat(filesystemPath(child));
		if (info.isSymbolicLink()) continue;
		if (info.isDirectory())
			await walkFiles(child, excluded, visit, { skipGitTrees, skipNames });
		else if (info.isFile())
			await visit({
				path: slashed(child),
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

async function citedDirectories(targets) {
	const citedFolders = new Set();
	for (const target of targets) {
		try {
			if ((await lstat(filesystemPath(target))).isDirectory())
				citedFolders.add(target);
		} catch {
			// Missing citations cannot protect a folder.
		}
	}
	return citedFolders;
}

// Every directory from `folder` down to each path in `paths`: the directories a citation (or an
// excluded path) reaches, which the prune has to walk.
function reachedDirectories(folder, paths) {
	const reached = new Set();
	for (const target of paths) {
		let current = key(target);
		while (inside(folder, current) && !reached.has(current)) {
			reached.add(current);
			if (current === key(folder)) break;
			current = current.slice(0, current.lastIndexOf("/"));
		}
	}
	return reached;
}

function keep(totals, file, reason) {
	totals.kept.files += 1;
	totals.kept.bytes += file.size;
	totals.kept[reason] += 1;
	if (totals.kept.examples.length < 10)
		totals.kept.examples.push({ path: file.path, reason });
}

function propose(totals, file) {
	totals.bytes += file.size;
	totals.deleteFiles.push(file.path);
}

async function fileFacts(file) {
	const info = await lstat(filesystemPath(file));
	return {
		path: slashed(file),
		size: info.size,
		extension: path.extname(file).toLowerCase(),
	};
}

// Walks only the directories a citation reaches; an unreached directory is set aside whole, and
// inside a cited folder a `node_modules` or a directory holding `.git` is kept whole unwalked.
async function walkReached(directory, inCitedFolder, scan) {
	const cited = inCitedFolder || scan.citedFolders.has(key(directory));
	if (cited && KEPT_WHOLE_NAMES.has(path.basename(directory).toLowerCase())) {
		scan.keptWhole.push(slashed(directory));
		return;
	}
	const entries = await readdir(filesystemPath(directory), {
		withFileTypes: true,
	});
	if (cited && entries.some((entry) => entry.name === ".git")) {
		scan.keptWhole.push(slashed(directory));
		return;
	}
	for (const entry of entries) {
		const child = path.join(directory, entry.name);
		if (scan.excluded.some((exclude) => inside(exclude, child))) continue;
		if (entry.isSymbolicLink()) scan.links.push(child);
		else if (entry.isDirectory()) {
			if (cited || scan.reached.has(key(child)))
				await walkReached(child, cited, scan);
			else scan.unreached.push(child);
		} else if (entry.isFile()) scan.files.push(child);
	}
}

async function holdsNamedCapture(directory, names) {
	for (const entry of await readdir(filesystemPath(directory), {
		withFileTypes: true,
	})) {
		const child = path.join(directory, entry.name);
		if (entry.isDirectory() && (await holdsNamedCapture(child, names)))
			return true;
		if (
			entry.isFile() &&
			CAPTURE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()) &&
			names.has(entry.name.toLowerCase())
		)
			return true;
	}
	return false;
}

// An unreached directory goes whole unless it holds a capture a kept text file names; then its
// named captures stay and the rest is proposed file by file or directory by directory.
async function resolveUnreached(directory, names, scan, totals) {
	if (!names.size || !(await holdsNamedCapture(directory, names))) {
		totals.deleteDirectories.push({ path: slashed(directory), bytes: null });
		return;
	}
	for (const entry of await readdir(filesystemPath(directory), {
		withFileTypes: true,
	})) {
		const child = path.join(directory, entry.name);
		if (entry.isSymbolicLink()) scan.links.push(child);
		else if (entry.isDirectory())
			await resolveUnreached(child, names, scan, totals);
		else if (entry.isFile()) {
			const file = await fileFacts(child);
			if (
				CAPTURE_EXTENSIONS.has(file.extension) &&
				names.has(path.basename(child).toLowerCase())
			)
				keep(totals, file, "captureNamedByText");
			else propose(totals, file);
		}
	}
}

// Runs `work` over `items` with at most `limit` in flight; file reads on Windows gain from it.
async function eachLimited(items, limit, work) {
	let next = 0;
	const worker = async () => {
		while (next < items.length) {
			const at = next++;
			await work(items[at], at);
		}
	};
	await Promise.all(
		Array.from({ length: Math.min(limit, items.length) }, worker),
	);
}

// Reads kept text files for capture names only while a name can still change a decision: an
// uncited capture here, or an unreached directory that may hold one. With no unreached directory,
// reading stops once every uncited capture is named.
async function readCaptureNames(texts, captures, scan, names) {
	const open = new Set(
		captures.map((file) => path.basename(file.path).toLowerCase()),
	);
	const unreadable = [];
	if (!open.size && !scan.unreached.length) return unreadable;
	const settled = () =>
		!scan.unreached.length && [...open].every((name) => names.has(name));
	await eachLimited(texts, 16, async (file) => {
		if (settled()) return;
		try {
			captureNames(await readFile(filesystemPath(file.path), "utf8"), names);
		} catch (error) {
			unreadable.push(`${file.path} (${error.code ?? error.message})`);
		}
	});
	return unreadable.sort();
}

async function classifyFiles(scan, index, folder, totals, names) {
	const files = new Array(scan.files.length);
	await eachLimited(scan.files, 16, async (child, at) => {
		files[at] = await fileFacts(child);
	});
	const captures = [];
	const texts = [];
	for (const file of files) {
		if (CAPTURE_EXTENSIONS.has(file.extension)) {
			captures.push(file);
			continue;
		}
		const reason = hasCitedAncestor(file.path, folder, scan.citedFolders)
			? "nonCaptureInCitedFolder"
			: citationsAtOrAbove(file.path, index).length
				? "citedFile"
				: null;
		if (!reason) {
			propose(totals, file);
			continue;
		}
		keep(totals, file, reason);
		texts.push(file);
	}
	const unreadable = await readCaptureNames(
		texts,
		captures.filter((file) => !index.has(key(file.path))),
		scan,
		names,
	);
	for (const file of captures) {
		const cited = index.has(key(file.path));
		if (cited || names.has(path.basename(file.path).toLowerCase()))
			keep(totals, file, cited ? "citedFile" : "captureNamedByText");
		else propose(totals, file);
	}
	return unreadable;
}

async function unsafeLinks(scan, folder) {
	const links = [];
	for (const link of scan.links) links.push(await describeLink(link, folder));
	return {
		links,
		unsafe: links.some((link) => link.outside !== false || link.error),
	};
}

async function scanFolder(folder, index, targets, excluded) {
	const scan = {
		citedFolders: await citedDirectories(targets),
		excluded,
		files: [],
		keptWhole: [],
		links: [],
		reached: reachedDirectories(folder, [
			...targets,
			...excluded.filter((item) => inside(folder, item)),
		]),
		unreached: [],
	};
	const totals = {
		bytes: 0,
		deleteDirectories: [],
		deleteFiles: [],
		kept: emptyKept(),
	};
	const names = new Set();
	try {
		await walkReached(folder, false, scan);
		const unreadable = await classifyFiles(scan, index, folder, totals, names);
		// A kept file that cannot be read may name a capture, so no capture here is safe to propose.
		if (unreadable.length)
			return { withheld: `unreadable kept file: ${unreadable.join("; ")}` };
		for (const directory of scan.unreached)
			await resolveUnreached(directory, names, scan, totals);
	} catch (error) {
		return {
			withheld: `unreadable directory: ${error.path ? plainPath(error.path) : error.message} (${error.code ?? "ERROR"})`,
		};
	}
	const links = await unsafeLinks(scan, folder);
	if (links.unsafe)
		return { withheld: "unsafe or unmeasured links", links: links.links };
	totals.kept.wholeFolders = scan.keptWhole.length;
	for (const directory of scan.keptWhole.slice(
		0,
		10 - totals.kept.examples.length,
	))
		totals.kept.examples.push({ path: directory, reason: "wholeFolder" });
	return {
		...totals,
		files: scan.files.length,
		links: links.links,
		unmeasured: totals.deleteDirectories.length,
	};
}

// A top-level folder no citation reaches is proposed whole; its bytes come from the survey's
// measurement when there is one.
function wholeFolder(folder, measurement) {
	const bytes = measurement?.bytes ?? null;
	return {
		path: folder,
		bytes: bytes ?? 0,
		candidates: 1,
		deleteDirectories: [{ path: slashed(folder), bytes }],
		deleteFiles: [],
		files: 0,
		kept: emptyKept(),
		links: [],
		unmeasured: bytes === null ? 1 : 0,
		withheld: null,
	};
}

async function isLinkOrMissing(folder) {
	try {
		return (await lstat(filesystemPath(folder))).isSymbolicLink();
	} catch {
		return true;
	}
}

// The cleanup's rule: only a folder whose newest modification is at least MIN_FOLDER_AGE_DAYS old
// is proposed, judged from the survey's folder measurement.
function folderAgeReason(measurement, now) {
	const ageDays = (now - Date.parse(measurement?.modifiedAt)) / 86400000;
	if (!Number.isFinite(ageDays)) return "age not measured";
	return ageDays >= MIN_FOLDER_AGE_DAYS
		? null
		: `younger than ${MIN_FOLDER_AGE_DAYS} days`;
}

async function planFolder(
	folder,
	{ excluded, index, measurement, now, targets, worktrees },
) {
	if (
		worktrees.some((worktree) => worktree.path && inside(folder, worktree.path))
	)
		return withheldFolder(folder, "registered worktree");
	if (measurement?.errors?.length || (await isLinkOrMissing(folder)))
		return withheldFolder(folder, "unsafe or unmeasured links");
	// The survey's own output folder is never pruned.
	if (excluded.some((exclude) => inside(exclude, folder)))
		return withheldFolder(folder, null);
	const tooYoung = folderAgeReason(measurement, now);
	if (tooYoung) return withheldFolder(folder, tooYoung);
	if (!targets.length && !excluded.some((item) => inside(folder, item)))
		return wholeFolder(folder, measurement);
	const scanned = await scanFolder(folder, index, targets, excluded);
	if (scanned.withheld)
		return withheldFolder(
			folder,
			scanned.withheld,
			withoutLinks(scanned.links ?? [], excluded),
		);
	return {
		...scanned,
		path: folder,
		candidates: scanned.deleteFiles.length + scanned.deleteDirectories.length,
		links: withoutLinks(scanned.links, excluded),
		withheld: null,
	};
}

// Cited paths below the temp root, grouped by the top-level folder that holds them.
function citedTargetsByFolder(index, tempRoot) {
	const byFolder = new Map();
	const rootKey = key(tempRoot);
	for (const target of index.keys()) {
		if (!target.startsWith(`${rootKey}/`)) continue;
		const top = `${rootKey}/${target.slice(rootKey.length + 1).split("/")[0]}`;
		byFolder.set(top, [...(byFolder.get(top) ?? []), target]);
	}
	return byFolder;
}

export async function planEvidencePrune({
	excluded = [],
	folderPaths,
	measurements = [],
	now = Date.now(),
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
	const index = citationIndex(records, { tempRoot: resolvedRoot });
	const targets = citedTargetsByFolder(index, resolvedRoot);
	const resolvedExcluded = excluded.map((item) => path.resolve(item));
	const measured = new Map(measurements.map((item) => [key(item.path), item]));
	const plans = [];
	for (const folder of folders) {
		const resolved = path.resolve(folder);
		if (
			key(path.dirname(resolved)) !== key(resolvedRoot) ||
			!inside(resolvedRoot, resolved)
		)
			throw new Error(`Prune target is not a top-level temp folder: ${folder}`);
		plans.push(
			await planFolder(resolved, {
				excluded: resolvedExcluded,
				index,
				measurement: measured.get(key(resolved)),
				now,
				targets: targets.get(key(resolved)) ?? [],
				worktrees,
			}),
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
		let scripts = 0;
		await walkFiles(
			folder,
			excludedPaths,
			(file) => {
				if (SCRIPT_EXTENSIONS.has(file.extension)) scripts += 1;
			},
			{ skipGitTrees: true, skipNames: ["node_modules"] },
		);
		folders.push({ path: folder.replaceAll("\\", "/"), scripts });
	}
	return {
		folders,
		since,
		total: folders.reduce((sum, folder) => sum + folder.scripts, 0),
	};
}

// A whole-folder proposal is deleted only if it is still a directory, holds and sits in no
// registered worktree, and every link in it resolves inside it; links are removed, never followed.
async function removeWholeFolder(directory, worktrees) {
	const info = await lstat(filesystemPath(directory));
	if (!info.isDirectory() || info.isSymbolicLink())
		throw new Error("candidate is no longer a directory");
	if (
		worktrees.some(
			(worktree) =>
				worktree.path &&
				(inside(directory, worktree.path) || inside(worktree.path, directory)),
		)
	)
		throw new Error("registered worktree");
	const inspected = await inspectWorktreeLinks(directory);
	const unsafe = [
		...inspected.linkErrors,
		...inspected.links
			.filter((link) => link.outside !== false || link.error)
			.map((link) => `${link.path} -> ${link.resolvedTarget ?? link.error}`),
	];
	if (!inspected.linksMeasured || unsafe.length)
		throw new Error(`unsafe or unmeasured links: ${unsafe.join("; ")}`);
	await rm(filesystemPath(directory), { recursive: true });
}

// The user-run prune measures each folder again, so the age rule judges what is on disk now.
async function measureFolders(folders) {
	const measurements = [];
	for (const folder of folders) {
		try {
			measurements.push(await measureFolder(path.resolve(folder)));
		} catch {
			// A missing folder has no measurement; the plan withholds it.
		}
	}
	return measurements;
}

export async function pruneEvidence(
	snapshot,
	{ checkout = root, now = Date.now() } = {},
) {
	if (
		key(snapshot.root) !== key(checkout) ||
		!path.isAbsolute(snapshot.tempRoot)
	)
		throw new Error("Prune snapshot has a different checkout or temp root");
	const records = await collectTrackedCitationRecords({ checkout });
	const git = await collectGit(records, { current: checkout });
	const plans = await planEvidencePrune({
		folderPaths: snapshot.folders,
		measurements: await measureFolders(snapshot.folders),
		now,
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
		for (const directory of plan.deleteDirectories) {
			try {
				await removeWholeFolder(directory.path, git.worktrees);
			} catch (error) {
				failures += 1;
				folderFailures += 1;
				console.error(`FAILED: ${directory.path}: ${error.message}`);
			}
		}
		if (!folderFailures)
			console.log(
				`PRUNED: ${plan.path}: ${plan.bytes} bytes in ${plan.deleteFiles.length} files and ${plan.deleteDirectories.length} whole folders`,
			);
	}
	console.log(
		`PRUNE ${failures ? "FAIL" : "PASS"}: ${plans.length} folders, ${failures} failures`,
	);
	process.exitCode = failures ? 1 : 0;
}
