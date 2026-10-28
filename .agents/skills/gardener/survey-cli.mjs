// Survey options, cleanup commands, outcomes, and console summary.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { resolveToolArguments } from "../../../scripts/agent-environment/tool-contract.mjs";
import { key } from "./facts.mjs";
import { checkFailed } from "./survey-checks.mjs";
import { defaultTempRoot, root } from "./survey-evidence.mjs";

export function parseOptions(input) {
	const parsed = Array.isArray(input)
		? resolveToolArguments("gardener:survey", input, {
				validate: false,
			})
		: input;
	const resolved = (value) => (value ? path.resolve(value) : undefined);
	return {
		out: path.resolve(parsed.options.out),
		tempRoot: resolved(parsed.options.tempRoot) ?? defaultTempRoot,
		finalReport: resolved(parsed.options.finalReport),
	};
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

export function pruneScript(snapshot, checkout = root) {
	return `// USER-RUN PROPOSAL ONLY. Review the listed folders before running. The survey never executes this file.\nimport { pruneEvidence } from ${JSON.stringify(pathToFileURL(path.join(root, ".agents/skills/gardener/prune-evidence.mjs")).href)};\nawait pruneEvidence(${JSON.stringify(snapshot, null, 2)}, { checkout: ${JSON.stringify(checkout)} });\n`;
}

function powershellQuote(value) {
	return `'${value.replaceAll("'", "''")}'`;
}

export function worktreeRemovalCommand(target, checkout = root) {
	return `node ${powershellQuote(path.join(root, ".agents/skills/gardener/remove-worktree.mjs"))} --checkout ${powershellQuote(checkout)} --worktree ${powershellQuote(target)}`;
}

export function surveyProposals(report, out) {
	const complete = report.complete;
	return {
		folders: {
			command: complete
				? `node ${powershellQuote(path.join(out, "cleanup.mjs"))}`
				: null,
			paths: complete
				? report.folders
						.filter((item) => item.candidate)
						.map((item) => item.path)
				: [],
			condition:
				"User only; review the whole list before running; incomplete collection withholds cleanup",
		},
		prune: {
			command: complete
				? `node ${powershellQuote(path.join(out, "prune.mjs"))}`
				: null,
			paths:
				complete && report.prune
					? report.prune
							.filter((item) => !item.withheld && item.candidates)
							.map((item) => item.path)
					: [],
			condition:
				"User only; rechecks tracked citations, links and registered worktrees before deleting any file",
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
}

export async function writeSurveyOutputs({ cleanupData, out, report, text }) {
	await mkdir(out, { recursive: true });
	await writeFile(
		path.join(out, "survey.json"),
		`${JSON.stringify(report, null, 2)}\n`,
		"utf8",
	);
	await writeFile(path.join(out, "REPORT.md"), text, "utf8");
	await writeFile(
		path.join(out, "cleanup.mjs"),
		cleanupScript(cleanupData),
		"utf8",
	);
	await writeFile(
		path.join(out, "prune.mjs"),
		pruneScript({
			root: cleanupData.root,
			tempRoot: cleanupData.tempRoot,
			folders:
				report.complete && report.prune
					? report.prune
							.filter((item) => !item.withheld && item.candidates)
							.map((item) => item.path)
					: [],
		}),
		"utf8",
	);
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
		report.prune?.some((item) => !item.withheld && item.candidates) ||
		report.git?.branches.some((item) => item.candidate) ||
		report.git?.worktrees.some(
			(item) =>
				item.candidate || item.missing || (item.exists && !item.statusMeasured),
		)
		? "blocked"
		: "clean";
}

export function consoleSummary(report, out) {
	return `SURVEY ${report.outcome.toUpperCase()}: ${path.join(out, "REPORT.md")} (collection=${report.complete ? "complete" : "blocked"}; ${report.git?.worktrees.filter((item) => item.coordinatorReview).length ?? 0} worktrees await coordinator review; ${report.git?.worktrees.filter((item) => item.mergedClean).length ?? 0} merged clean worktrees; ${report.git?.worktrees.filter((item) => item.linksWithheld).length ?? 0} worktrees withheld for links; ${report.git?.worktrees.filter((item) => item.mergedCleanWithheldForLinks).length ?? 0} merged clean worktrees withheld for links; ${report.folders?.filter((item) => item.gone).length ?? 0} temp folders gone; ${report.checks.filter(checkFailed).length} failing/blocked checks; ${report.checks.filter((item) => item.notRun).length} not-run checks; repository unchanged=${report.repositoryUnchanged})`;
}
export { powershellQuote };
