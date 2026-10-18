// Git, record, folder, and worktree evidence collection.

import { createHash } from "node:crypto";
import { existsSync, lstatSync, realpathSync } from "node:fs";
import { lstat, readdir, readFile, readlink, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import {
	activeBriefPointers,
	classifyBranches,
	classifyFolders,
	classifyWorktrees,
	deletionTarget,
	inside,
	key,
	landedBriefSources,
	ledgerHash,
	openBriefs,
	parseWorktreePorcelain,
	references,
	TRUNK_REF,
} from "./facts.mjs";
import { readGit } from "./git-reader.mjs";

export const root = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../..",
);
export const defaultTempRoot = "D:/fitway-temp";

export function filesystemPath(absolute) {
	return process.platform === "win32"
		? path.toNamespacedPath(absolute)
		: absolute;
}

export function git(args, cwd = root, options = {}) {
	return readGit(args, cwd, options);
}

async function record(source, kind, checkout = root) {
	const absolute = path.resolve(checkout, source);
	if (!inside(checkout, absolute))
		throw new Error(`Open record escapes checkout: ${source}`);
	const text = await readFile(absolute, "utf8");
	return {
		source,
		kind,
		text,
		sha256: createHash("sha256").update(text).digest("hex"),
	};
}

export async function collectRecords({
	checkout = root,
	load = (source, kind) => record(source, kind, checkout),
	trackedFiles,
	readGit = (args, cwd) => git(args, cwd),
} = {}) {
	const loadedLedger = await load("PROJECT_STATE.yaml", "ledger");
	const ledger = { ...loadedLedger, sha256: ledgerHash(loadedLedger.text) };
	const state = parseYaml(ledger.text);
	const records = [ledger];
	const tracked =
		trackedFiles ??
		git(["ls-files", "-z"], checkout).split("\0").filter(Boolean);
	const rollingReport =
		state.gardener?.report ??
		(tracked.includes(".agents/skills/gardener/REPORT.md")
			? ".agents/skills/gardener/REPORT.md"
			: null);
	if (rollingReport) records.push(await load(rollingReport, "gardener"));
	for (const [id, milestone] of Object.entries(state.milestones)) {
		for (const [field, kind] of [
			["handoff", "resume"],
			["taskPacket", "packet"],
		]) {
			if (!milestone[field]) throw new Error(`${id}: missing ${field}`);
			records.push(await load(milestone[field], kind));
		}
	}
	const briefPaths = new Set();
	const briefOwners = new Map();
	for (const pointer of activeBriefPointers(records)) {
		if (!tracked.includes(pointer.path))
			throw new Error(
				`${pointer.source}:${pointer.line}: open brief is missing or untracked: ${pointer.path}`,
			);
		briefPaths.add(pointer.path);
		briefOwners.set(pointer.path, [pointer.source]);
	}
	for (const item of [...records]) {
		for (const match of item.text.matchAll(
			/(?:\.?[a-zA-Z0-9_-]+\/)+[a-zA-Z0-9_.-]*\/?/g,
		)) {
			const value = match[0];
			if (/brief/i.test(value)) {
				for (const file of tracked.filter(
					(file) =>
						file === value || file.startsWith(`${value.replace(/\/$/, "")}/`),
				)) {
					if (file.endsWith(".md")) briefPaths.add(file);
					const owners = briefOwners.get(file) ?? [];
					owners.push(item.source);
					briefOwners.set(file, owners);
				}
			}
			if (
				/(?:DECISIONS|AUDIT)\.md$/.test(value) &&
				!records.some((entry) => entry.source === value)
			)
				records.push(await load(value, "pointer"));
		}
	}
	const briefs = [];
	for (const source of [...briefPaths].sort()) {
		const item = await load(source, "brief");
		if (/<!-- brief-format:/.test(item.text))
			briefs.push({ ...item, owners: briefOwners.get(source) });
	}
	for (const pointer of activeBriefPointers(records)) {
		if (!briefs.some((brief) => brief.source === pointer.path))
			throw new Error(
				`${pointer.source}:${pointer.line}: named open brief lacks brief-format frontmatter: ${pointer.path}`,
			);
	}
	const roundsSource =
		"docs/phase-records/handoffs/agent-environment/codex-rounds.md";
	const rounds = briefs.some((brief) =>
		brief.source.startsWith("docs/phase-records/handoffs/agent-environment/"),
	)
		? await load(roundsSource, "round-results")
		: null;
	if (rounds) records.push(rounds);
	const landed = landedBriefSources(briefs, rounds?.text ?? "");
	const selected = openBriefs(records, briefs, landed);
	const waitingBriefs = [];
	const active = [];
	for (const brief of selected) {
		const lifecycle = briefLifecycle(brief, readGit);
		if (lifecycle.waitingForRecord)
			waitingBriefs.push({ source: brief.source, ...lifecycle });
		else active.push(brief);
	}
	return {
		records: [...records, ...selected],
		briefs: active,
		waitingBriefs,
		landedBriefs: [...landed].sort(),
		state,
	};
}

// Let Git classify current tracked content, including .gitattributes overrides.
// Comparing against an empty tree includes unchanged and newly staged files too.
function binaryCitationSources(checkout) {
	const emptyTree = git(["hash-object", "-t", "tree", "--stdin"], checkout);
	return new Set(
		git(
			[
				"diff",
				"--numstat",
				"-z",
				"--no-renames",
				"--no-ext-diff",
				"--no-textconv",
				emptyTree,
				"--",
			],
			checkout,
		)
			.split("\0")
			.filter((entry) => entry.startsWith("-\t-\t"))
			.map((entry) => entry.slice(4)),
	);
}

// Read tracked text for folder citations only: closed records are never instructions.
export async function collectFolderRecords(
	records,
	{
		checkout = root,
		trackedFiles,
		// Injected source lists belong to fixtures; real checkouts always use Git.
		binaryFiles = trackedFiles ? new Set() : binaryCitationSources(checkout),
		load = (source) => record(source, "tracked", checkout),
		tempRoot,
	} = {},
) {
	const all = new Map(
		records
			.filter((item) => !binaryFiles.has(item.source))
			.map((item) => [item.source, item]),
	);
	const tracked =
		trackedFiles ??
		git(["ls-files", "-z"], checkout).split("\0").filter(Boolean);
	for (const source of tracked) {
		if (all.has(source) || binaryFiles.has(source)) continue;
		try {
			all.set(source, await load(source));
		} catch (error) {
			throw new Error(
				`Cannot read tracked citation source ${source}: ${error.message}`,
			);
		}
	}
	// Any eligible citation related to a child of tempRoot is at or below tempRoot.
	// Preserve original line numbers and reuse the same matcher to select lines once.
	return [...all.values()].map((item) =>
		tempRoot
			? {
					...item,
					referenceScope: tempRoot,
					referenceLines: references(tempRoot, [item], { tempRoot }),
				}
			: item,
	);
}

export function plainPath(value) {
	return value
		.replace(/^\\\\\?\\UNC\\/i, "\\\\")
		.replace(/^\\\\\?\\/, "")
		.replaceAll("\\", "/");
}

export async function inspectWorktreeLinks(
	absolute,
	{ readLink = readlink } = {},
) {
	const base = path.resolve(absolute);
	const result = { linksMeasured: true, links: [], linkErrors: [] };
	async function visit(target) {
		try {
			const info = await lstat(filesystemPath(target));
			if (info.isSymbolicLink()) {
				const link = {
					path: plainPath(target),
					target: null,
					resolvedTarget: null,
					outside: null,
					error: null,
				};
				result.links.push(link);
				try {
					link.target = plainPath(await readLink(filesystemPath(target)));
					link.resolvedTarget = plainPath(
						await realpath(filesystemPath(target)),
					);
					link.outside = !inside(base, link.resolvedTarget);
				} catch (error) {
					link.error = `${error.code ?? "ERROR"}: ${error.message}`;
				}
				return; // Never enter a junction or symlink, even an internal one.
			}
			if (info.isDirectory()) {
				for (const entry of await readdir(filesystemPath(target)))
					await visit(path.join(target, entry));
			}
		} catch (error) {
			result.linksMeasured = false;
			result.linkErrors.push(
				`${plainPath(target)}: ${error.code ?? "ERROR"}: ${error.message}`,
			);
		}
	}
	try {
		const resolved = plainPath(await realpath(filesystemPath(base)));
		if (key(base) !== key(resolved))
			result.linkErrors.push(
				`${plainPath(base)}: worktree path aliases ${resolved}`,
			);
	} catch (error) {
		result.linksMeasured = false;
		result.linkErrors.push(
			`${plainPath(base)}: ${error.code ?? "ERROR"}: ${error.message}`,
		);
	}
	await visit(base);
	return result;
}

export function briefLifecycle(brief, readGit = git) {
	const fields = brief.text.match(
		/^- \*\*Worktree:\*\* `([^`]+)`, branch `([^`]+)`, HEAD `([a-f0-9]{4,40})`\s*$/im,
	);
	if (!fields) return { waitingForRecord: false };
	const [, checkout, branch, namedHead] = fields;
	try {
		if (
			readGit(["symbolic-ref", "--quiet", "--short", "HEAD"], checkout) !==
			branch
		)
			return { waitingForRecord: false };
		readGit(["merge-base", "--is-ancestor", namedHead, "HEAD"], checkout);
		const commits = readGit(["rev-list", `${namedHead}..HEAD`], checkout)
			.split(/\r?\n/)
			.filter(Boolean);
		const implemented = commits.some((commit) =>
			readGit(
				[
					"diff-tree",
					"--no-commit-id",
					"--name-only",
					"--no-renames",
					"-r",
					"-m",
					"-z",
					commit,
				],
				checkout,
			)
				.split("\0")
				.some((file) => file && !/\.(?:md|markdown)$/i.test(file)),
		);
		if (
			implemented &&
			!readGit(["status", "--porcelain=v1", "--untracked-files=all"], checkout)
		)
			return {
				waitingForRecord: true,
				checkout,
				branch,
				namedHead,
				reason:
					"Committed implementation beyond launch HEAD; clean worktree waiting for its round record",
			};
	} catch {
		// Unlaunched, unavailable and ambiguous briefs still go through brief:check.
	}
	return { waitingForRecord: false };
}

export async function collectGit(
	records,
	{
		current = root,
		readGit = (args, cwd = current) => git(args, cwd),
		exists = existsSync,
		inspectLinks = inspectWorktreeLinks,
		worktreeRoot,
	} = {},
) {
	const trunk = {
		ref: TRUNK_REF,
		commit: readGit(["rev-parse", "--verify", TRUNK_REF]),
	};
	const branches = readGit([
		"for-each-ref",
		"--format=%(refname)|%(objectname)|%(symref)",
		"refs/heads",
		"refs/remotes",
	])
		.split(/\r?\n/)
		.filter(Boolean)
		.map((line) => {
			const [ref, commit, symbolic] = line.split("|");
			const remote = ref.startsWith("refs/remotes/");
			const name = ref.replace(/^refs\/(?:heads|remotes)\//, "");
			return {
				ref,
				name,
				plain: remote ? name.replace(/^[^/]+\//, "") : name,
				remote,
				symbolic,
				commit,
			};
		});
	const merged = new Set(
		readGit([
			"for-each-ref",
			`--merged=${trunk.commit}`,
			"--format=%(refname)",
			"refs/heads",
			"refs/remotes",
		]).split(/\r?\n/),
	);
	for (const branch of branches) branch.merged = merged.has(branch.ref);
	const registrations = parseWorktreePorcelain(
		readGit(["worktree", "list", "--porcelain"]),
	);
	for (const worktree of registrations) {
		// Cleanup needs fresh safety state only for worktrees inside this candidate.
		if (worktreeRoot && !inside(worktreeRoot, worktree.path)) continue;
		worktree.exists = exists(worktree.path);
		if (worktree.exists) {
			try {
				worktree.lastCommitAt = readGit([
					"show",
					"-s",
					"--format=%cI",
					worktree.HEAD,
				]);
			} catch (error) {
				worktree.commitDateReason = error.message;
			}
			try {
				readGit(["merge-base", "--is-ancestor", worktree.HEAD, trunk.commit]);
				worktree.merged = true;
			} catch (error) {
				worktree.merged = error.status === 1 ? false : null;
				if (error.status !== 1)
					worktree.mergeReason = `Merge status unavailable: ${error.message}`;
			}
			try {
				worktree.status = readGit(
					["status", "--porcelain=v1", "--untracked-files=all"],
					worktree.path,
				);
			} catch (error) {
				worktree.status = null;
				worktree.statusReason = `Status could not be measured: ${error.message}`;
			}
		}
		Object.assign(worktree, await inspectLinks(worktree.path));
	}
	const worktrees = classifyWorktrees(registrations, records, current);
	return {
		trunk,
		branches: classifyBranches(branches, records, worktrees),
		worktrees,
	};
}

export async function measureFolder(absolute) {
	const details = await lstat(filesystemPath(absolute));
	const result = {
		path: absolute.replaceAll("\\", "/"),
		bytes: 0,
		files: 0,
		modifiedAt: details.mtime.toISOString(),
		link: details.isSymbolicLink(),
		gitRoots: [],
		skippedLinks: 0,
		linkExamples: [],
		errors: [],
	};
	async function walk(directory) {
		try {
			for (const entry of await readdir(filesystemPath(directory), {
				withFileTypes: true,
			})) {
				if (entry.name === ".git")
					result.gitRoots.push(directory.replaceAll("\\", "/"));
				const child = path.join(directory, entry.name);
				const info = await lstat(filesystemPath(child));
				if (info.isSymbolicLink()) {
					result.skippedLinks++;
					if (result.linkExamples.length < 10) result.linkExamples.push(child);
					continue;
				}
				if (info.mtime > new Date(result.modifiedAt))
					result.modifiedAt = info.mtime.toISOString();
				if (info.isDirectory()) await walk(child);
				else if (info.isFile()) {
					result.bytes += info.size;
					result.files++;
				}
			}
		} catch (error) {
			result.errors.push(`${directory}: ${error.code ?? error.message}`);
		}
	}
	if (!result.link) await walk(absolute);
	return result;
}

export async function collectFolders(
	records,
	worktrees,
	out,
	tempRoot = defaultTempRoot,
	referenceOptions = {},
) {
	const folderRecords = await collectFolderRecords(records, {
		...referenceOptions,
		tempRoot,
	});
	const folders = [];
	for (const entry of await readdir(filesystemPath(tempRoot), {
		withFileTypes: true,
	})) {
		if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
		const absolute = path.join(tempRoot, entry.name);
		if (inside(absolute, out)) continue;
		if (folders.length % 50 === 0)
			console.log(`Survey folders measured: ${folders.length}`);
		try {
			const measured = await measureFolder(absolute);
			// A directory can disappear after its initial stat, during the walk.
			// Retain every other error, and retain subtree ENOENT if the root exists.
			if (
				measured.errors.length &&
				measured.errors.every((error) => error.endsWith(": ENOENT"))
			)
				await lstat(filesystemPath(absolute));
			folders.push(measured);
		} catch (error) {
			if (error.code !== "ENOENT") throw error;
			// Only inventory tolerates this race. Cleanup still requires measurement.
			folders.push({
				path: absolute.replaceAll("\\", "/"),
				gone: true,
				bytes: null,
				files: null,
				modifiedAt: null,
				errors: [],
			});
		}
	}
	return classifyFolders(
		folders,
		folderRecords,
		worktrees,
		tempRoot,
		Date.now(),
	);
}

export function safeDeletionPath(candidate, base) {
	const target = deletionTarget(candidate, base);
	if (!existsSync(target)) return null;
	if (
		!lstatSync(target).isDirectory() ||
		lstatSync(target).isSymbolicLink() ||
		!inside(
			realpathSync.native(filesystemPath(base)),
			realpathSync.native(target),
		)
	)
		throw new Error(`Deletion path aliases outside temp root: ${candidate}`);
	return target;
}
export { record };
