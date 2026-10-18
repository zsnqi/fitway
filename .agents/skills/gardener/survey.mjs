import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	beginToolCommand,
	toolStartupLine,
} from "../../../scripts/agent-environment/tool-contract.mjs";
import { collectCodeHealth } from "./code-health.mjs";
import { config, MIN_FOLDER_AGE_DAYS, TRUNK_REF } from "./facts.mjs";
import { checkFailed } from "./survey-checks.mjs";
import { git } from "./survey-evidence.mjs";
import { main } from "./survey-main.mjs";

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
