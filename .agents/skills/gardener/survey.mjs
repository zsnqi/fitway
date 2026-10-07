import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, realpathSync } from "node:fs";
import { lstat, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
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
	deadPaths,
	deletionTarget,
	duplicateRules,
	gateGaps,
	inside,
	key,
	openBriefs,
	parseFastSteps,
	parseWorktreePorcelain,
} from "./facts.mjs";

export const root = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../..",
);
export const tempRoot = "D:/fitway-temp";

export function git(args, cwd = root) {
	return execFileSync("git", ["--no-optional-locks", ...args], {
		cwd,
		encoding: "utf8",
		windowsHide: true,
		maxBuffer: 32 * 1024 * 1024,
	}).trimEnd();
}

async function record(source, kind) {
	const absolute = path.resolve(root, source);
	if (!inside(root, absolute))
		throw new Error(`Open record escapes checkout: ${source}`);
	const text = await readFile(absolute, "utf8");
	return {
		source,
		kind,
		text,
		sha256: createHash("sha256").update(text).digest("hex"),
	};
}

export async function collectRecords({ load = record, trackedFiles } = {}) {
	const ledger = await load("PROJECT_STATE.yaml", "ledger");
	const state = parseYaml(ledger.text);
	const records = [ledger];
	if (state.gardener?.report)
		records.push(await load(state.gardener.report, "gardener"));
	for (const [id, milestone] of Object.entries(state.milestones)) {
		for (const [field, kind] of [
			["handoff", "resume"],
			["taskPacket", "packet"],
		]) {
			if (!milestone[field]) throw new Error(`${id}: missing ${field}`);
			records.push(await load(milestone[field], kind));
		}
	}
	const tracked =
		trackedFiles ?? git(["ls-files", "-z"]).split("\0").filter(Boolean);
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
	const selected = openBriefs(records, briefs);
	return {
		records: [...records, ...selected],
		briefs: selected,
		state,
	};
}

export async function collectGit(records) {
	const branches = git([
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
		git([
			"for-each-ref",
			"--merged=main",
			"--format=%(refname)",
			"refs/heads",
			"refs/remotes",
		]).split(/\r?\n/),
	);
	for (const branch of branches) branch.merged = merged.has(branch.ref);
	const mainCommit = git(["rev-parse", "main"]);
	const registrations = parseWorktreePorcelain(
		git(["worktree", "list", "--porcelain"]),
	);
	for (const worktree of registrations) {
		worktree.exists = existsSync(worktree.path);
		if (worktree.exists) {
			let status;
			try {
				git(["merge-base", "--is-ancestor", worktree.HEAD, "main"]);
				worktree.merged = true;
			} catch (error) {
				if (error.status !== 1) throw error;
				worktree.merged = false;
			}
			if (worktree.merged)
				status = git(
					["status", "--porcelain=v1", "--untracked-files=all"],
					worktree.path,
				);
			worktree.status = status ?? null;
		}
	}
	const worktrees = classifyWorktrees(registrations, records, root);
	return {
		mainCommit,
		branches: classifyBranches(branches, records, worktrees),
		worktrees,
	};
}

export async function measureFolder(absolute) {
	const details = await lstat(absolute);
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
			for (const entry of await readdir(directory, { withFileTypes: true })) {
				if (entry.name === ".git")
					result.gitRoots.push(directory.replaceAll("\\", "/"));
				const child = path.join(directory, entry.name);
				const info = await lstat(child);
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

async function collectFolders(records, worktrees, out) {
	const folders = [];
	for (const entry of await readdir(tempRoot, { withFileTypes: true })) {
		if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
		const absolute = path.join(tempRoot, entry.name);
		if (inside(absolute, out)) continue;
		if (folders.length % 50 === 0)
			console.log(`Survey folders measured: ${folders.length}`);
		folders.push(await measureFolder(absolute));
	}
	return classifyFolders(folders, records, worktrees, tempRoot, Date.now());
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

const readOnlyChecks = new Map([
	["check:repository", "node scripts/verify-repository.mjs"],
	["check:agent-context", "node scripts/check-agent-context.mjs"],
	["check:design-context", "node scripts/check-design-context.mjs"],
	[
		"check:verification-map",
		"node .agents/skills/verify-fitway/cli.mjs drift-tree",
	],
]);

function captureCheck(name, command, args) {
	try {
		const output = execFileSync(process.execPath, args, {
			cwd: root,
			encoding: "utf8",
			windowsHide: true,
			timeout: 180000,
			maxBuffer: 8 * 1024 * 1024,
			env: {
				...process.env,
				GIT_OPTIONAL_LOCKS: "0",
				TEMP: tempRoot,
				TMP: tempRoot,
			},
		});
		return { name, command, exitCode: 0, output };
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

function validateOutput(out, worktrees) {
	if (
		!path.isAbsolute(out) ||
		!inside(tempRoot, out) ||
		key(out) === key(tempRoot)
	)
		throw new Error(
			"--out must be an absolute fresh directory under D:/fitway-temp",
		);
	if (existsSync(out))
		throw new Error(`Output directory already exists: ${out}`);
	let ancestor = path.dirname(out);
	while (!existsSync(ancestor)) ancestor = path.dirname(ancestor);
	const resolved = path.join(
		realpathSync(ancestor),
		path.relative(ancestor, out),
	);
	if (
		!inside(realpathSync(tempRoot), resolved) ||
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
		`Checkout: ${root}`,
		`HEAD: ${report.head}`,
		`Local main: ${report.git?.mainCommit ?? "unavailable"} (no fetch)`,
		`Repository unchanged: ${report.repositoryUnchanged}`,
		"",
		`Counts: ${report.git?.worktrees.filter((item) => item.missing).length ?? 0} missing registrations; ${report.git?.worktrees.filter((item) => item.mergedClean).length ?? 0} merged clean worktrees; ${report.git?.branches.filter((item) => item.merged && !item.protectedBy.length && item.plain !== "main" && !item.symbolic).length ?? 0} unreferenced merged branches; ${report.folders?.filter((item) => !item.protectedBy.length).length ?? 0} unreferenced temp folders; ${report.gates?.missing.length ?? 0} gate gaps; ${report.gates?.duplicates.length ?? 0} duplicate gates; ${report.checks?.filter((item) => item.exitCode !== 0).length ?? 0} failing/blocked checks; ${report.rules?.duplicates.length ?? 0} duplicate rule lines; ${report.rules?.dead.length ?? 0} dead path mentions.`,
		"",
	];
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

async function main(args) {
	process.env.GIT_OPTIONAL_LOCKS = "0";
	if (args.length !== 2 || args[0] !== "--out")
		throw new Error(
			"Usage: node <checkout>/.agents/skills/gardener/survey.mjs --out D:/fitway-temp/<fresh-run>",
		);
	const out = path.resolve(args[1]);
	const registrations = parseWorktreePorcelain(
		git(["worktree", "list", "--porcelain"]),
	);
	validateOutput(out, registrations);
	const before = await repositoryFingerprint({ cwd: root });
	const report = {
		date: new Date().toISOString().slice(0, 10),
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
		collectFolders(context?.records ?? [], report.git?.worktrees ?? [], out),
	);
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
	report.checks = [];
	for (const [name, command] of Object.entries(scripts).filter(([name]) =>
		name.startsWith("check:"),
	)) {
		if (readOnlyChecks.get(name) !== command) {
			report.errors.push(
				`Read-only behavior not established for ${name}: ${command}`,
			);
			report.checks.push({
				name,
				command,
				exitCode: null,
				output: "BLOCKED: unknown check command",
			});
			continue;
		}
		console.log(`Survey check: ${name}`);
		report.checks.push(
			captureCheck(name, command, command.split(" ").slice(1)),
		);
	}
	for (const brief of context?.briefs ?? []) {
		const command = `pnpm brief:check ${brief.source}`;
		console.log(`Survey check: ${command}`);
		report.checks.push({
			...captureCheck("brief:check", command, [
				"scripts/agent-environment/check-brief.mjs",
				path.join(root, brief.source),
			]),
			source: brief.source,
		});
	}
	report.repositoryUnchanged =
		before === (await repositoryFingerprint({ cwd: root }));
	if (!report.repositoryUnchanged)
		report.errors.push("Repository changed during survey");
	if (report.checks.some((item) => item.exitCode === null))
		report.errors.push("One or more checks could not finish");
	if (report.folders?.some((item) => item.errors.length))
		report.errors.push(
			"Some temp folder measurements are incomplete; see folder errors",
		);
	report.complete = report.errors.length === 0;
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
			context && report.git && report.repositoryUnchanged
				? report.folders.filter((item) => item.candidate)
				: [],
	};
	await writeFile(
		path.join(out, "cleanup.mjs"),
		`// USER-RUN PROPOSAL ONLY. The survey never executes this file.\nimport { cleanup } from ${JSON.stringify(pathToFileURL(path.join(root, ".agents/skills/gardener/cleanup.mjs")).href)};\nawait cleanup(${JSON.stringify(cleanupData, null, 2)});\n`,
		"utf8",
	);
	console.log(
		`SURVEY ${report.complete ? "PASS" : "BLOCKED"}: ${path.join(out, "REPORT.md")} (${report.checks.filter((item) => item.exitCode !== 0).length} failing/blocked checks; repository unchanged=${report.repositoryUnchanged})`,
	);
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
	const resolved = path.win32.resolve(candidate);
	if (!existsSync(resolved)) return null;
	if (
		lstatSync(resolved).isSymbolicLink() ||
		!inside(realpathSync(base), realpathSync(resolved))
	)
		throw new Error(`Deletion path aliases outside temp root: ${candidate}`);
	return target;
}
