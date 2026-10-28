import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	beginToolCommand,
	toolStartupLine,
} from "../../../scripts/agent-environment/tool-contract.mjs";
import { repositoryFingerprint } from "../../../scripts/repository-fingerprint.mjs";
import { collectCitedSurveyEvidence } from "./cited-survey.mjs";
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
	consoleSummary,
	finalFolderSelection,
	parseOptions,
	surveyOutcome,
	surveyProposals,
	writeSurveyOutputs,
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

function goneCitationLines(goneCitations) {
	const lines = ["## Cited temp paths gone", ""];
	if (!goneCitations?.checked)
		return [
			...lines,
			`Not checked: ${JSON.stringify(goneCitations?.tempRoot ?? "D:/fitway-temp")} is absent.`,
			"",
		];
	if (!goneCitations.dead.length) return [...lines, "None.", ""];
	for (const citation of goneCitations.dead)
		lines.push(
			`- ${JSON.stringify(citation.path)} (${citation.source}:${citation.line}${citation.changed ? "; changed" : "; unchanged"})`,
		);
	return [...lines, ""];
}

function pruneProposalLines(prune) {
	const lines = ["## Evidence prune proposals", ""];
	const withheld = (prune ?? []).filter((item) => item.withheld);
	const proposed = (prune ?? []).filter(
		(item) => !item.withheld && item.candidates,
	);
	for (const item of withheld)
		lines.push(`- Withheld ${JSON.stringify(item.path)}: ${item.withheld}`);
	for (const item of proposed) {
		const kept = item.kept;
		lines.push(
			`- ${JSON.stringify(item.path)}: frees ${item.bytes} bytes from ${item.candidates} files; keeps ${kept.files} files (${kept.citedFile} cited, ${kept.nonCaptureInCitedFolder} non-captures in cited folders, ${kept.captureNamedByText} named captures; ${kept.bytes} bytes); links not followed: ${item.links.length}.`,
		);
	}
	if (!withheld.length && !proposed.length) lines.push("None.");
	return [...lines, ""];
}

function scriptFileLines(scriptFiles) {
	const lines = ["## Script files in new temp folders", ""];
	if (!scriptFiles?.since)
		return [
			...lines,
			"Previous report date unavailable; no invented comparison.",
			"",
		];
	lines.push(`Since ${scriptFiles.since}:`);
	for (const folder of scriptFiles.folders)
		lines.push(
			`- ${JSON.stringify(folder.path)}: ${folder.scripts} script files`,
		);
	return [...lines, `Total: ${scriptFiles.total} script files.`, ""];
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
		"",
		...goneCitationLines(report.goneCitations),
		...pruneProposalLines(report.prune),
		...scriptFileLines(report.scriptFiles),
	);
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
				"goneCitations",
				"prune",
				"records",
				"scriptFiles",
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
	const citedEvidence = await collectCitedSurveyEvidence({
		attempt,
		checkout: root,
		context,
		folders: report.folders,
		out,
		tempRoot,
		worktrees: report.git?.worktrees,
	});
	report.goneCitations = citedEvidence.goneCitations;
	report.prune = citedEvidence.prune;
	report.scriptFiles = citedEvidence.scriptFiles;
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
	report.proposals = surveyProposals(report, out);
	const cleanupData = {
		root,
		tempRoot,
		records: report.recordSources,
		folders:
			context && report.git && report.complete && report.repositoryUnchanged
				? report.folders.filter((item) => item.candidate)
				: [],
	};
	await writeSurveyOutputs({
		cleanupData,
		out,
		report,
		text: formatReport(report),
	});
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
