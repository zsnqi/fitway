import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	beginToolCommand,
	toolStartupLine,
} from "../../../scripts/agent-environment/tool-contract.mjs";
import { repositoryFingerprint } from "../../../scripts/repository-fingerprint.mjs";
import { collectCodeHealth } from "./code-health.mjs";
import {
	config,
	deadPaths,
	duplicateRules,
	gateGaps,
	key,
	localDate,
	MIN_FOLDER_AGE_DAYS,
	parseFastSteps,
	parseWorktreePorcelain,
	TRUNK_REF,
} from "./facts.mjs";
import { collectRecordSurvey } from "./records.mjs";
import {
	checkFailed,
	checkGraph,
	ruleHomes,
	runChecks,
} from "./survey-checks.mjs";
import {
	cleanupScript,
	consoleSummary,
	finalFolderSelection,
	parseOptions,
	powershellQuote,
	surveyOutcome,
	worktreeRemovalCommand,
} from "./survey-cli.mjs";
import {
	collectFolders,
	collectGit,
	collectRecords,
	git,
	root,
} from "./survey-evidence.mjs";
import { validateOutput } from "./survey-output.mjs";

export function collectSurveyCodeHealth({
	readGit = git,
	previousReportText = null,
	previousReportSource = null,
} = {}) {
	return collectCodeHealth({
		config,
		git: readGit,
		previousReportText,
		previousReportSource,
	});
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
		`Counts: ${report.git?.worktrees.filter((item) => item.missing).length ?? 0} missing registrations; ${report.git?.worktrees.filter((item) => item.mergedClean).length ?? 0} merged clean worktrees; ${report.git?.worktrees.filter((item) => item.mergedCleanWithheldForLinks).length ?? 0} merged clean worktrees withheld for links; ${report.git?.branches.filter((item) => item.merged && !item.protectedBy.length && item.plain !== "main" && !item.symbolic).length ?? 0} unreferenced merged branches; ${report.folders?.filter((item) => !item.gone && !item.protectedBy.length).length ?? 0} unreferenced temp folders; ${report.gates?.missing.length ?? 0} gate gaps; ${report.gates?.duplicates.length ?? 0} duplicate gates; ${report.checks?.filter(checkFailed).length ?? 0} failing/blocked checks; ${report.checks?.filter((item) => item.notRun).length ?? 0} not-run checks; ${report.rules?.duplicates.length ?? 0} duplicate rule lines; ${report.rules?.dead.length ?? 0} dead path mentions.`,
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
	lines.push("", "## Worktrees withheld for links", "");
	const withheld =
		report.git?.worktrees.filter((item) => item.linksWithheld) ?? [];
	if (!withheld.length) lines.push("None.", "");
	for (const item of withheld) {
		lines.push(`- Path: ${JSON.stringify(item.path)}`);
		for (const link of item.links ?? [])
			lines.push(
				`  - Link: ${JSON.stringify(link.path)}; target: ${JSON.stringify(link.target)}; resolved target: ${JSON.stringify(link.resolvedTarget ?? null)}; outside: ${link.outside ?? "unknown"}; error: ${link.error ?? "none"}`,
			);
		for (const error of item.linkErrors ?? [])
			lines.push(`  - Inspection error: ${error}`);
		if (!item.linksMeasured)
			lines.push("  - Link inspection was not completed.");
	}
	lines.push("", "## Temp folders gone during inventory", "");
	const gone = report.folders?.filter((item) => item.gone) ?? [];
	if (!gone.length) lines.push("None.", "");
	for (const item of gone)
		lines.push(`- Gone before measurement: ${JSON.stringify(item.path)}`);
	lines.push(
		"## Records",
		"",
		"```json",
		JSON.stringify(report.records ?? {}, null, 2),
		"```",
		"",
	);
	lines.push("");
	if (report.codeHealth) {
		lines.push(
			"## Code health",
			"",
			`Compared with: ${report.codeHealth.comparedWith}`,
			"",
		);
		for (const scope of report.codeHealth.scopes) {
			lines.push(`### ${scope.name} (${scope.status})`);
			if (scope.baselineKey)
				lines.push(`Baseline: ${JSON.stringify(scope.baselineKey)}`);
			if (scope.status === "unknown") lines.push(`Reason: ${scope.reason}`);
			for (const measure of Object.keys(scope.measures)) {
				const value = scope.measures[measure];
				const total = value.total === null ? "unknown" : value.total;
				const previous =
					value.previous === null || value.previous === undefined
						? "no previous"
						: value.previous;
				const trend =
					typeof value.trend === "number"
						? `${value.trend >= 0 ? "+" : ""}${value.trend}`
						: (value.trend ?? "no previous");
				lines.push(
					`- ${measure}: ${total} (previous ${previous}; trend ${trend})`,
				);
				for (const item of value.hits ?? []) {
					lines.push(`  - ${item.file}:${item.line} — ${item.detail}`);
					if (item.places)
						for (const place of item.places)
							lines.push(`    - ${place.file}:${place.line}`);
				}
			}
			lines.push("");
		}
	}
	for (const [name, value] of Object.entries(report).filter(
		([name]) =>
			![
				"date",
				"head",
				"complete",
				"repositoryUnchanged",
				"records",
				"codeHealth",
			].includes(name),
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

async function main(input) {
	process.env.GIT_OPTIONAL_LOCKS = "0";
	const { out, tempRoot, finalReport } = parseOptions(input);
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
	report.recordSources =
		context?.records.map(({ source, kind, sha256 }) => ({
			source,
			kind,
			sha256,
		})) ?? [];
	report.records = await attempt("round and finding records", () =>
		collectRecordSurvey({ checkout: root }),
	);
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
	const rollingReport = context?.records.find(
		(item) => item.kind === "gardener",
	);
	report.codeHealth = await attempt("code health", () =>
		collectCodeHealth({
			config,
			git,
			previousReportText: rollingReport?.text ?? null,
			previousReportSource: rollingReport?.source ?? null,
		}),
	);
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
		records: report.recordSources,
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
	const parsed = beginToolCommand("gardener:survey", process.argv.slice(2));
	main(parsed).catch((error) => {
		const line = toolStartupLine("gardener:survey", error);
		if (line) console.error(line);
		console.error(`SURVEY BLOCKED: ${error.message}`);
		process.exitCode = 1;
	});
}
