import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, realpathSync } from "node:fs";
import {
	lstat,
	mkdir,
	readdir,
	readFile,
	readlink,
	realpath,
	writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";
import { repositoryFingerprint } from "../../../scripts/repository-fingerprint.mjs";
import {
	activeBriefPointers,
	calledImports,
	classifyBranches,
	classifyFolders,
	classifyWorktrees,
	config,
	deadPaths,
	deletionTarget,
	duplicateRules,
	gateGaps,
	inside,
	key,
	landedBriefSources,
	ledgerHash,
	localDate,
	MIN_FOLDER_AGE_DAYS,
	openBriefs,
	parseFastSteps,
	parseWorktreePorcelain,
	references,
	TRUNK_REF,
} from "./facts.mjs";

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

export function git(args, cwd = root) {
	return execFileSync("git", ["--no-optional-locks", ...args], {
		cwd,
		encoding: "utf8",
		windowsHide: true,
		maxBuffer: 32 * 1024 * 1024,
	}).trimEnd();
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

// Read tracked files for folder citations only: closed records are never instructions.
export async function collectFolderRecords(
	records,
	{
		checkout = root,
		trackedFiles = git(["ls-files", "-z"], checkout)
			.split("\0")
			.filter(Boolean),
		load = (source) => record(source, "tracked", checkout),
		tempRoot,
	} = {},
) {
	const all = new Map(records.map((item) => [item.source, item]));
	for (const source of trackedFiles) {
		if (all.has(source)) continue;
		try {
			all.set(source, await load(source));
		} catch (error) {
			throw new Error(
				`Cannot read tracked citation source ${source}: ${error.message}`,
			);
		}
	}
	// Any citation related to a child of tempRoot must also be related to tempRoot.
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
		folders.push(await measureFolder(absolute));
	}
	return classifyFolders(
		folders,
		folderRecords,
		worktrees,
		tempRoot,
		Date.now(),
	);
}

async function ruleHomes() {
	const homes = [
		"AGENTS.md",
		"docs/WORKFLOW.md",
		"docs/agent-context/WORKING_AGREEMENTS.md",
	];
	for (const entry of await readdir(
		path.join(root, "docs/agent-context/briefs"),
	)) {
		if (entry.endsWith(".md")) homes.push(`docs/agent-context/briefs/${entry}`);
	}
	return Promise.all(homes.map((source) => record(source, "rule")));
}

async function checkGraph(scripts) {
	const calls = {};
	for (const [name, command] of Object.entries(scripts)) {
		const dependencies = new Set(
			[...command.matchAll(/\bpnpm\s+(?:run\s+)?(check[:\w-]*)/g)].map(
				(match) => match[1],
			),
		);
		const entry = command.match(/^node\s+([.\w/-]+\.mjs)(?:\s|$)/)?.[1];
		if (entry) {
			const visited = new Set();
			async function scan(file) {
				if (visited.has(file)) return;
				visited.add(file);
				const source = await readFile(path.join(root, file), "utf8");
				for (const imported of calledImports(source).filter((value) =>
					value.startsWith("."),
				)) {
					const relative = path
						.relative(root, path.resolve(root, path.dirname(file), imported))
						.replaceAll("\\", "/");
					for (const [other, script] of Object.entries(scripts)) {
						if (other !== name && script === `node ${relative}`)
							dependencies.add(other);
					}
					if (relative.endsWith(".mjs")) await scan(relative);
				}
			}
			await scan(entry);
		}
		calls[name] = [...dependencies];
	}
	return calls;
}

export const surveyPnpmEnv = {
	pnpm_config_verify_deps_before_run: "error",
	pnpm_config_manage_package_manager_versions: "false",
	pnpm_config_package_manager_strict_version: "true",
};

export function checkEnvironment(inherited, tempRoot) {
	const overrides = {
		...surveyPnpmEnv,
		GIT_OPTIONAL_LOCKS: "0",
		TEMP: tempRoot,
		TMP: tempRoot,
		NODE_COMPILE_CACHE: path.join(tempRoot, "node-compile-cache"),
	};
	const names = new Set(
		Object.keys(overrides).map((name) => name.toLowerCase()),
	);
	// Windows child environments are case insensitive; remove inherited aliases
	// before adding overrides (pnpm run exports an uppercase false preflight).
	return {
		...Object.fromEntries(
			Object.entries(inherited).filter(
				([name]) => !names.has(name.toLowerCase()),
			),
		),
		...overrides,
	};
}

function captureCheck(name, command, args, { cwd, tempRoot }) {
	try {
		const windows = process.platform === "win32";
		const result = spawnSync(
			windows ? (process.env.ComSpec ?? "C:/Windows/System32/cmd.exe") : "pnpm",
			windows
				? ["/d", "/s", "/c", "pnpm", "run", name, ...args]
				: ["run", name, ...args],
			{
				cwd,
				encoding: "utf8",
				windowsHide: true,
				timeout: 180000,
				maxBuffer: 8 * 1024 * 1024,
				env: checkEnvironment(process.env, tempRoot),
			},
		);
		return {
			name,
			command,
			exitCode: result.status,
			output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
			error: result.error?.code ?? null,
			signal: result.signal,
		};
	} catch (error) {
		return {
			name,
			command,
			exitCode: error.status ?? null,
			output: `${error.stdout ?? ""}${error.stderr ?? ""}`,
			error: error.code ?? null,
		};
	}
}

export async function runChecks(
	scripts,
	{
		cwd = root,
		tempRoot = defaultTempRoot,
		briefs = [],
		capture = captureCheck,
		notRunChecks = config.notRunChecks ?? {},
	} = {},
) {
	const checks = [];
	const entries = Object.entries(scripts)
		.filter(([name]) => name.startsWith("check:"))
		.map(([name, command]) => ({ name, command, args: [] }));
	for (const name of Object.keys(notRunChecks)) {
		if (!entries.some((entry) => entry.name === name))
			entries.push({ name, command: scripts[name], args: [] });
	}
	for (const brief of briefs)
		entries.push({
			name: "brief:check",
			command: scripts["brief:check"],
			args: [brief.source],
			source: brief.source,
		});
	let dependencyBlocked = false;
	for (const entry of entries) {
		if (Object.hasOwn(notRunChecks, entry.name)) {
			const reason = notRunChecks[entry.name];
			if (typeof reason !== "string" || !reason.trim())
				throw new Error(
					`Not-run check ${entry.name} requires a reason in config.json`,
				);
			const defined = Object.hasOwn(scripts, entry.name);
			const output = defined
				? ""
				: `Configured not-run check ${entry.name} is not defined in package.json`;
			console.log(
				`Survey check: ${entry.name}: ${defined ? "not run" : "missing"}; ${reason}${output ? `; ${output}` : ""}`,
			);
			checks.push({
				name: entry.name,
				command: entry.command,
				checkout: cwd,
				notRun: defined,
				reason,
				exitCode: null,
				output,
				error: defined ? null : "NOT_DEFINED",
			});
			continue;
		}
		if (dependencyBlocked) continue;
		console.log(
			`Survey check: ${entry.name}${entry.source ? ` ${entry.source}` : ""}`,
		);
		const statusBefore = git(
			["status", "--porcelain=v1", "--untracked-files=all"],
			cwd,
		);
		const before = await repositoryFingerprint({ cwd });
		const result = capture(entry.name, entry.command, entry.args, {
			cwd,
			tempRoot,
		});
		const statusAfter = git(
			["status", "--porcelain=v1", "--untracked-files=all"],
			cwd,
		);
		const repositoryChanged = before !== (await repositoryFingerprint({ cwd }));
		checks.push({
			...result,
			source: entry.source,
			checkout: cwd,
			statusBefore,
			statusAfter,
			statusChanged: statusBefore !== statusAfter,
			repositoryChanged,
			dependencyBlocker: /ERR_PNPM_VERIFY_DEPS_BEFORE_RUN/.test(result.output),
			waitingForCoordinator:
				entry.name === "check:repository" &&
				/(?:Error:|FAILED_VALIDATION:) Gardener ledger date\/outcome does not match the rolling report/.test(
					result.output,
				),
		});
		dependencyBlocked = checks.at(-1).dependencyBlocker;
	}
	return checks;
}

function checkFailed(check) {
	return !check.notRun && check.exitCode !== 0;
}

function validateOutput(out, worktrees, tempRoot) {
	if (
		!path.isAbsolute(out) ||
		!inside(tempRoot, out) ||
		key(out) === key(tempRoot)
	)
		throw new Error(
			`--out must be an absolute fresh directory under ${tempRoot}`,
		);
	if (existsSync(out))
		throw new Error(`Output directory already exists: ${out}`);
	let ancestor = path.dirname(out);
	while (!existsSync(ancestor)) ancestor = path.dirname(ancestor);
	const resolved = path.join(
		realpathSync.native(ancestor),
		path.relative(ancestor, out),
	);
	if (
		!inside(realpathSync.native(tempRoot), resolved) ||
		worktrees.some((worktree) => inside(worktree.path, resolved))
	)
		throw new Error("Output aliases a worktree or escapes the temp root");
}

export function formatReport(report) {
	const lines = [
		"# Gardener survey",
		"",
		`Date: ${report.date}`,
		`Collection: ${report.complete ? "complete" : "blocked"}`,
		`Checkout: ${report.checkout}`,
		`HEAD: ${report.head}`,
		`Trunk: ${report.git?.trunk.ref ?? TRUNK_REF} at ${report.git?.trunk.commit ?? "unavailable"} (as last fetched; survey does not fetch)`,
		`Outcome: ${report.outcome}`,
		`Minimum folder age: ${MIN_FOLDER_AGE_DAYS} days (newest modification)`,
		`Repository unchanged: ${report.repositoryUnchanged}`,
		`Proposed temp folders: ${report.proposals?.folders.paths.length ?? 0}; unreferenced temp folders include young and unsafe folders.`,
		"",
		`Counts: ${report.git?.worktrees.filter((item) => item.missing).length ?? 0} missing registrations; ${report.git?.worktrees.filter((item) => item.mergedClean).length ?? 0} merged clean worktrees; ${report.git?.branches.filter((item) => item.merged && !item.protectedBy.length && item.plain !== "main" && !item.symbolic).length ?? 0} unreferenced merged branches; ${report.folders?.filter((item) => !item.protectedBy.length).length ?? 0} unreferenced temp folders; ${report.gates?.missing.length ?? 0} gate gaps; ${report.gates?.duplicates.length ?? 0} duplicate gates; ${report.checks?.filter(checkFailed).length ?? 0} failing/blocked checks; ${report.checks?.filter((item) => item.notRun).length ?? 0} not-run checks; ${report.rules?.duplicates.length ?? 0} duplicate rule lines; ${report.rules?.dead.length ?? 0} dead path mentions.`,
		"",
	];
	lines.push("## Worktrees awaiting review", "");
	const awaiting =
		report.git?.worktrees.filter((item) => item.coordinatorReview) ?? [];
	if (!awaiting.length) lines.push("None.", "");
	for (const item of awaiting) {
		lines.push(
			`- Path: ${JSON.stringify(item.path)}; branch: ${JSON.stringify(item.branch ?? "<detached>")}; last commit date: ${item.lastCommitAt ?? "unknown"}; status: ${item.statusMeasured ? (item.status ? JSON.stringify(item.status) : "clean") : `unknown (${item.statusReason})`}`,
		);
	}
	lines.push("");
	for (const [name, value] of Object.entries(report).filter(
		([name]) =>
			!["date", "head", "complete", "repositoryUnchanged"].includes(name),
	)) {
		lines.push(
			`## ${name}`,
			"",
			"```json",
			JSON.stringify(value, null, 2),
			"```",
			"",
		);
	}
	return lines.join("\n");
}

export function parseOptions(args) {
	const options = { tempRoot: defaultTempRoot };
	for (let index = 0; index < args.length; index += 2) {
		if (
			!["--out", "--temp-root", "--final-report"].includes(args[index]) ||
			!args[index + 1] ||
			!path.isAbsolute(args[index + 1])
		)
			throw new Error(
				"Usage: node <checkout>/.agents/skills/gardener/survey.mjs --out <absolute-fresh-run> [--temp-root <absolute-temp-root>]",
			);
		const field =
			args[index] === "--out"
				? "out"
				: args[index] === "--final-report"
					? "finalReport"
					: "tempRoot";
		if (field === "out" && options.out) throw new Error("Duplicate --out");
		options[field] = path.resolve(args[index + 1]);
	}
	if (!options.out) throw new Error("--out is required");
	return options;
}

export function finalFolderSelection(folders, rollingReport) {
	const sections = [
		...rollingReport.matchAll(
			/^## Folder removal proposals\r?\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm,
		),
	];
	if (sections.length !== 1)
		throw new Error(
			"Final rolling report requires one Folder removal proposals section",
		);
	const paths = [...sections[0][1].matchAll(/^- `([^`\r\n]+)`\s*$/gm)].map(
		(match) => match[1],
	);
	if (
		sections[0][1]
			.split(/\r?\n/)
			.some(
				(line) =>
					line.trim() &&
					!/^- `[^`\r\n]+`\s*$/.test(line) &&
					line.trim() !== "None.",
			)
	)
		throw new Error(
			"Final folder proposal section must contain only absolute path bullets or None.",
		);
	if (new Set(paths.map(key)).size !== paths.length)
		throw new Error("Duplicate final folder proposal");
	for (const target of paths)
		if (
			!folders.some(
				(folder) => key(folder.path) === key(target) && folder.candidate,
			)
		)
			throw new Error(`Final proposal is no longer safe: ${target}`);
	return folders.map((folder) => ({
		...folder,
		candidate:
			folder.candidate &&
			paths.some((target) => key(target) === key(folder.path)),
	}));
}

export function cleanupScript(snapshot, checkout = root) {
	return `// USER-RUN PROPOSAL ONLY. Review the listed folders before running. The survey never executes this file.\nimport { cleanup } from ${JSON.stringify(pathToFileURL(path.join(root, ".agents/skills/gardener/cleanup.mjs")).href)};\nawait cleanup(${JSON.stringify(snapshot, null, 2)}, { checkout: ${JSON.stringify(checkout)} });\n`;
}

function powershellQuote(value) {
	return `'${value.replaceAll("'", "''")}'`;
}

export function worktreeRemovalCommand(target, checkout = root) {
	return `node ${powershellQuote(path.join(root, ".agents/skills/gardener/remove-worktree.mjs"))} --checkout ${powershellQuote(checkout)} --worktree ${powershellQuote(target)}`;
}

export function surveyOutcome(report) {
	return !report.complete ||
		report.checks.some(checkFailed) ||
		report.gates?.missing.some(
			(gate) =>
				!report.checks.some(
					(check) => check.name === gate.name && check.notRun,
				),
		) ||
		report.gates?.duplicates.length ||
		report.rules?.duplicates.length ||
		report.rules?.dead.length ||
		report.folders?.some((item) => item.candidate) ||
		report.git?.branches.some((item) => item.candidate) ||
		report.git?.worktrees.some(
			(item) =>
				item.candidate || item.missing || (item.exists && !item.statusMeasured),
		)
		? "blocked"
		: "clean";
}

export function consoleSummary(report, out) {
	return `SURVEY ${report.outcome.toUpperCase()}: ${path.join(out, "REPORT.md")} (collection=${report.complete ? "complete" : "blocked"}; ${report.git?.worktrees.filter((item) => item.coordinatorReview).length ?? 0} worktrees await coordinator review; ${report.checks.filter(checkFailed).length} failing/blocked checks; ${report.checks.filter((item) => item.notRun).length} not-run checks; repository unchanged=${report.repositoryUnchanged})`;
}

async function main(args) {
	process.env.GIT_OPTIONAL_LOCKS = "0";
	const { out, tempRoot, finalReport } = parseOptions(args);
	const registrations = parseWorktreePorcelain(
		git(["worktree", "list", "--porcelain"]),
	);
	validateOutput(out, registrations, tempRoot);
	const before = await repositoryFingerprint({ cwd: root });
	const report = {
		date: localDate(),
		checkout: root,
		tempRoot,
		head: git(["rev-parse", "HEAD"]),
		complete: false,
		errors: [],
	};
	const attempt = async (label, work) => {
		try {
			return await work();
		} catch (error) {
			report.errors.push(`${label}: ${error.message}`);
			return null;
		}
	};
	const context = await attempt("open records", collectRecords);
	report.records =
		context?.records.map(({ source, kind, sha256 }) => ({
			source,
			kind,
			sha256,
		})) ?? [];
	report.git = await attempt("git", () => collectGit(context?.records ?? []));
	report.folders = await attempt("folders", () =>
		collectFolders(
			context?.records ?? [],
			report.git?.worktrees ?? [],
			out,
			tempRoot,
		),
	);
	if (finalReport && context && report.folders) {
		report.folders = await attempt("final proposals", () => {
			const rolling = context.records.find(
				(item) =>
					item.kind === "gardener" &&
					key(path.resolve(root, item.source)) === key(finalReport),
			);
			if (!rolling)
				throw new Error(
					"--final-report must name the collected rolling gardener report",
				);
			return finalFolderSelection(report.folders, rolling.text);
		});
	}
	const scripts = JSON.parse(
		await readFile(path.join(root, "package.json"), "utf8"),
	).scripts;
	report.gates = await attempt("gate coverage", async () =>
		gateGaps(
			scripts,
			parseFastSteps(
				await readFile(path.join(root, "scripts/verify.mjs"), "utf8"),
			),
			await checkGraph(scripts),
		),
	);
	report.rules = await attempt("rule homes", async () => {
		const homes = await ruleHomes();
		return {
			duplicates: duplicateRules(homes),
			dead: deadPaths(
				homes,
				(value) => existsSync(path.resolve(root, value)),
				report.git?.branches ?? [],
				git(["ls-files", "-z"]).split("\0"),
			),
		};
	});
	report.openBriefs =
		context?.briefs.map(({ source, namedBy }) => ({ source, namedBy })) ?? [];
	report.landedBriefs = context?.landedBriefs ?? [];
	report.waitingBriefs = context?.waitingBriefs ?? [];
	await mkdir(path.join(out, "scratch"), { recursive: true });
	report.checks = await runChecks(scripts, {
		tempRoot: path.join(out, "scratch"),
		briefs: context?.briefs ?? [],
	});
	for (const check of report.checks.filter((item) => item.dependencyBlocker))
		report.errors.push(
			`Dependency mismatch blocks collection: ${check.name}: ${check.output.trim()}`,
		);
	for (const check of report.checks.filter((item) => item.repositoryChanged))
		report.errors.push(
			`Check ${check.name}${check.source ? ` (${check.source})` : ""} changed checkout ${check.checkout}; status changed=${check.statusChanged}`,
		);
	report.repositoryUnchanged =
		before === (await repositoryFingerprint({ cwd: root }));
	if (!report.repositoryUnchanged)
		report.errors.push("Repository changed during survey");
	if (report.checks.some((item) => !item.notRun && item.exitCode === null))
		report.errors.push("One or more checks could not finish");
	if (report.folders?.some((item) => item.errors.length))
		report.errors.push(
			"Some temp folder measurements are incomplete; see folder errors",
		);
	report.complete = report.errors.length === 0;
	// Review-only worktrees are explicitly deferred; other findings still block.
	report.outcome = surveyOutcome(report);
	report.proposals = {
		folders: {
			command: report.complete
				? `node ${powershellQuote(path.join(out, "cleanup.mjs"))}`
				: null,
			paths: report.complete
				? report.folders
						.filter((item) => item.candidate)
						.map((item) => item.path)
				: [],
			condition:
				"User only; review the whole list before running; incomplete collection withholds cleanup",
		},
		branches:
			report.git?.branches
				.filter((item) => item.candidate)
				.map((item) => ({
					ref: item.ref,
					command: item.remote
						? `git push ${powershellQuote(item.name.split("/")[0])} --delete ${powershellQuote(item.plain)}`
						: `git branch -d -- ${powershellQuote(item.name)}`,
					condition:
						"Coordinator/user only; recheck against the recorded trunk and open references before running",
				})) ?? [],
		worktrees:
			report.git?.worktrees
				.filter((item) => item.candidate)
				.map((item) => ({
					path: item.path,
					command: worktreeRemovalCommand(item.path),
				})) ?? [],
		registrations:
			report.git?.worktrees
				.filter(
					(item) =>
						item.missing &&
						!item.self &&
						!item.locked &&
						!item.protectedBy.length,
				)
				.map((item) => ({
					path: item.path,
					command: "git worktree prune --dry-run",
					removalCommand: report.git.worktrees.some(
						(item) =>
							item.missing &&
							(item.self || item.locked || item.protectedBy.length),
					)
						? null
						: "git worktree prune",
					condition:
						"Coordinator/user only; review every missing registration before the global prune",
				})) ?? [],
	};
	await mkdir(out, { recursive: true });
	await writeFile(
		path.join(out, "survey.json"),
		`${JSON.stringify(report, null, 2)}\n`,
		"utf8",
	);
	await writeFile(path.join(out, "REPORT.md"), formatReport(report), "utf8");
	const cleanupData = {
		root,
		tempRoot,
		records: report.records,
		folders:
			context && report.git && report.complete && report.repositoryUnchanged
				? report.folders.filter((item) => item.candidate)
				: [],
	};
	await writeFile(
		path.join(out, "cleanup.mjs"),
		cleanupScript(cleanupData),
		"utf8",
	);
	console.log(consoleSummary(report, out));
	process.exitCode = report.complete ? 0 : 1;
}

if (
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	main(process.argv.slice(2)).catch((error) => {
		console.error(`SURVEY BLOCKED: ${error.message}`);
		process.exitCode = 1;
	});
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
