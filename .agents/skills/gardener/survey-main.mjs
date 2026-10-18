// The gardener survey command workflow.

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { repositoryFingerprint } from "../../../scripts/repository-fingerprint.mjs";
import { collectCodeHealth } from "./code-health.mjs";
import {
	config,
	deadPaths,
	duplicateRules,
	gateGaps,
	key,
	localDate,
	parseFastSteps,
	parseWorktreePorcelain,
} from "./facts.mjs";
import { collectRecordSurvey } from "./records.mjs";
import { checkGraph, ruleHomes, runChecks } from "./survey-checks.mjs";
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

export { main };
