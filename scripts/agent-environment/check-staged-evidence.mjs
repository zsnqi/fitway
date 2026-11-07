// Check the index for dead temp citations, run-folder provenance, and designer-brief asks.
import { readFileSync } from "node:fs";
import path from "node:path";
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
import { parseBriefFormat } from "./brief-format.mjs";
import { readIndexFiles } from "./check-staged-giant-files.mjs";
import { readGit } from "./code-health-ratchet.mjs";
import { DESIGN_WORK_ROLES, designerBriefProblems } from "./designer-brief.mjs";

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

function changedFiles(root, filter, parent) {
	return splitNul(
		readGitText(root, [
			"diff",
			"--cached",
			"--name-only",
			`--diff-filter=${filter}`,
			"-z",
			...(parent ? [parent, "--"] : []),
		]),
	);
}

// The commits a merge in progress brings besides HEAD: every line of MERGE_HEAD, found through
// `git rev-parse --git-path` (in a worktree `.git` is a file) and resolved by git. Empty outside a merge.
function mergeParents(root) {
	const merging = readGitResult(root, [
		"rev-parse",
		"-q",
		"--verify",
		"MERGE_HEAD",
	]);
	if (merging.status === 1) return [];
	if (merging.status !== 0)
		throw new Error(`git rev-parse failed: ${String(merging.stderr).trim()}`);
	const mergeHead = path.resolve(
		root,
		readGitText(root, ["rev-parse", "--git-path", "MERGE_HEAD"]).trim(),
	);
	return readFileSync(mergeHead, "utf8")
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) =>
			readGitText(root, ["rev-parse", "--verify", `${line}^{commit}`]).trim(),
		);
}

// Files the index adds: new against HEAD and, in a merge, against every merge parent.
function newStagedFiles(root, parents) {
	const files = new Set(changedFiles(root, "A"));
	for (const parent of parents) {
		if (!files.size) break;
		const added = new Set(changedFiles(root, "A", parent));
		for (const file of files) if (!added.has(file)) files.delete(file);
	}
	return files;
}

function addedLines(root, source, parents) {
	return stagedLineNumbers(root, source, stagedDiffReader, parents);
}

function readIndexText(root, file) {
	return readIndexFiles(root, [file])[0].text;
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

function designerFileProblems(root, file, text, { newFiles, parents }) {
	const role = parseBriefFormat(text).role;
	if (!DESIGN_WORK_ROLES.has(role)) return [];
	const lines = newFiles.has(file)
		? undefined
		: addedLines(root, file, parents);
	if (lines && !lines.size) return [];
	return designerBriefProblems(text, {
		role,
		checkFrames: role === "designer" && newFiles.has(file),
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
	const parents = mergeParents(checkout);
	const staged = changedFiles(checkout, "ACMR");
	const recordFiles = staged.filter(
		(file) =>
			file !== LOST_TEMP_EVIDENCE_PATH &&
			TRACKED_RECORD_EXTENSIONS.has(
				`.${file.split(".").at(-1)?.toLowerCase()}`,
			),
	);
	const addedByFile = new Map(
		recordFiles.map((file) => [file, addedLines(checkout, file, parents)]),
	);
	const evidenceRecords = recordFiles.filter(
		(file) => addedByFile.get(file)?.size,
	);
	const markdownFiles = staged.filter((file) => /\.md$/i.test(file));
	const newFiles = newStagedFiles(checkout, parents);
	const designerFiles = markdownFiles.filter(
		(file) => newFiles.has(file) || addedByFile.get(file)?.size,
	);
	let audit = null;
	if (evidenceRecords.length) {
		const records = readIndexFiles(checkout, evidenceRecords).map(
			({ file, text }) => ({ source: file, text }),
		);
		audit = await auditTempCitations({
			checkout,
			exists,
			holdsCommit,
			lostEvidenceRows: lostEvidenceRows(checkout),
			mergeParents: parents,
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
		designerFileProblems(checkout, file, readIndexText(checkout, file), {
			newFiles,
			parents,
		}),
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
