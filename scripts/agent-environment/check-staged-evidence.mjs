// Check the index for dead temp citations, run-folder provenance, and designer-brief asks.
import process from "node:process";
import { pathToFileURL } from "node:url";
import {
	auditTempCitations,
	LOST_TEMP_EVIDENCE_PATH,
	parseLostTempEvidence,
	stagedLineNumbers,
	TRACKED_RECORD_EXTENSIONS,
} from "../../.agents/skills/gardener/cited-evidence.mjs";
import {
	formatTempCitationDetails,
	RUN_FOLDER_REPLACEMENT_FIX,
} from "../../.agents/skills/gardener/run-folder-provenance.mjs";
import { readIndexFiles } from "./check-staged-giant-files.mjs";
import { readGit } from "./code-health-ratchet.mjs";
import { designerBriefProblems } from "./designer-brief.mjs";

const DESIGNER_HEADER = "<!-- brief-format: v1 role: designer -->";

function readGitResult(root, args, options = {}) {
	return readGit(root, args, options);
}

function readGitText(root, args) {
	const result = readGitResult(root, args);
	if (result.status !== 0)
		throw new Error(`git ${args[0]} failed: ${String(result.stderr).trim()}`);
	return result.stdout;
}

function stagedDiffReader(args, root) {
	return readGitText(root, args);
}

function splitNul(text) {
	return text.split("\0").filter(Boolean);
}

function changedFiles(root, filter) {
	return splitNul(
		readGitText(root, [
			"diff",
			"--cached",
			"--name-only",
			`--diff-filter=${filter}`,
			"-z",
		]),
	);
}

function addedLines(root, source) {
	return stagedLineNumbers(root, source, stagedDiffReader);
}

function readIndexText(root, file) {
	return readIndexFiles(root, [file], readGitResult)[0].text;
}

function lostEvidenceRows(root) {
	const present = readGitResult(root, [
		"ls-files",
		"-z",
		"--",
		LOST_TEMP_EVIDENCE_PATH,
	]);
	if (present.status !== 0)
		throw new Error(`git ls-files failed: ${String(present.stderr).trim()}`);
	if (!splitNul(present.stdout).includes(LOST_TEMP_EVIDENCE_PATH)) return [];
	return parseLostTempEvidence(readIndexText(root, LOST_TEMP_EVIDENCE_PATH));
}

function designerFileProblems(root, file, text, newFiles) {
	if (text.split(/\r?\n/, 1)[0] !== DESIGNER_HEADER) return [];
	const lines = newFiles.has(file) ? undefined : addedLines(root, file);
	if (lines && !lines.size) return [];
	return designerBriefProblems(text, {
		checkFrames: newFiles.has(file),
		lineNumbers: lines,
	}).map((problem) => ({ ...problem, file }));
}

export async function checkStagedEvidence({
	checkout = process.cwd(),
	exists,
	holdsCommit,
	readFile,
	stat,
	tempRoot = process.env.FITWAY_TEMP_ROOT ?? "D:/fitway-temp",
} = {}) {
	const staged = changedFiles(checkout, "ACMR");
	const recordFiles = staged.filter(
		(file) =>
			file !== LOST_TEMP_EVIDENCE_PATH &&
			TRACKED_RECORD_EXTENSIONS.has(
				`.${file.split(".").at(-1)?.toLowerCase()}`,
			),
	);
	const addedByFile = new Map(
		recordFiles.map((file) => [file, addedLines(checkout, file)]),
	);
	const evidenceRecords = recordFiles.filter(
		(file) => addedByFile.get(file)?.size,
	);
	const markdownFiles = staged.filter((file) => /\.md$/i.test(file));
	const newFiles = new Set(changedFiles(checkout, "A"));
	const designerFiles = markdownFiles.filter(
		(file) => newFiles.has(file) || addedByFile.get(file)?.size,
	);
	let audit = null;
	if (evidenceRecords.length) {
		const records = readIndexFiles(
			checkout,
			evidenceRecords,
			readGitResult,
		).map(({ file, text }) => ({ source: file, text }));
		audit = await auditTempCitations({
			checkout,
			exists,
			holdsCommit,
			lostEvidenceRows: lostEvidenceRows(checkout),
			readFile,
			readGit: stagedDiffReader,
			records,
			staged: true,
			stat,
			tempRoot,
			validateLostEvidence: false,
		});
	}
	const designerProblems = designerFiles.flatMap((file) =>
		designerFileProblems(
			checkout,
			file,
			readIndexText(checkout, file),
			newFiles,
		),
	);
	return { audit, designerProblems, recordFiles };
}

export function stagedEvidenceFailures(result) {
	const failures = [];
	if (result.audit?.changed.length)
		failures.push(
			`Evidenced temp citations are gone on added staged lines:\n${formatTempCitationDetails(result.audit.changed, { tempRoot: result.audit.tempRoot })}\nFix: correct each path, mark it (gone: <why>), or add one row per citation to ${LOST_TEMP_EVIDENCE_PATH}.`,
		);
	if (result.audit?.provenanceFailures.length)
		failures.push(
			`Evidenced temp citations lack run-folder provenance on added staged lines:\n${formatTempCitationDetails(result.audit.provenanceFailures, { tempRoot: result.audit.tempRoot, withProvenance: true })}\nFix: ${RUN_FOLDER_REPLACEMENT_FIX}`,
		);
	for (const problem of result.designerProblems)
		failures.push(`${problem.file}:${problem.line}: ${problem.message}`);
	return failures;
}

export function formatStagedEvidencePass(result) {
	if (!result.audit) return null;
	if (!result.audit.checked)
		return `Evidenced temp citations not checked: ${result.audit.tempRoot} does not exist.`;
	return `Staged temp citations passed: 0 gone, 0 without provenance, ${result.audit.legacyAccepted} legacy folders accepted without provenance.`;
}

export async function runStagedEvidenceCheck(options = {}) {
	const result = await checkStagedEvidence(options);
	const failures = stagedEvidenceFailures(result);
	if (failures.length) throw new Error(failures.join("\n"));
	const pass = formatStagedEvidencePass(result);
	if (pass) console.log(pass);
	return result;
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	try {
		await runStagedEvidenceCheck();
	} catch (error) {
		console.error(`pre-commit staged-evidence check: FAIL: ${error.message}`);
		process.exitCode = 1;
	}
}
