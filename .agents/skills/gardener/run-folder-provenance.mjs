// Validate run-folder provenance records and describe their citation failures.
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { inside, key } from "./facts.mjs";
import { git } from "./survey-evidence.mjs";

export const TEMP_PROVENANCE_CUTOFF_ISO = "2026-11-01T00:00:00+03:00";
export const TEMP_PROVENANCE_CUTOFF = new Date(TEMP_PROVENANCE_CUTOFF_ISO);
export const RUN_FOLDER_REPLACEMENT_FIX =
	"make a new run folder with pnpm run-folder:new <name> --brief <file> --for <who>, move the evidence into it and cite the new folder.";

function plainRecord(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function fileSha256(file, readFile) {
	try {
		return createHash("sha256").update(readFile(file)).digest("hex");
	} catch {
		return null;
	}
}

function reportInside(folder, report) {
	return (
		typeof report === "string" &&
		report.trim().length > 0 &&
		inside(folder, path.resolve(folder, report))
	);
}

function provenanceAt(folder, { holdsCommit, readFile }) {
	for (const [name, accept] of [
		[
			"manifest.json",
			(record) => {
				if (
					Object.hasOwn(record, "command") ||
					Object.hasOwn(record, "checkout")
				)
					return false;
				if (
					record.version !== 1 ||
					typeof record.for !== "string" ||
					!record.for.trim() ||
					!/^[a-f\d]{64}$/i.test(record.briefSha256 ?? "") ||
					!/^[a-f\d]{40}$/i.test(record.commit ?? "") ||
					!reportInside(folder, record.report) ||
					!holdsCommit(record.commit)
				)
					return false;
				return (
					fileSha256(path.join(folder, "BRIEF.md"), readFile)?.toLowerCase() ===
					record.briefSha256.toLowerCase()
				);
			},
		],
		[
			"run.json",
			(record) =>
				record.version === 1 &&
				/^[a-f\d]{64}$/i.test(record.briefSha256 ?? "") &&
				/^[a-f\d]{40}$/i.test(record.head ?? "") &&
				reportInside(folder, record.report) &&
				holdsCommit(record.head),
		],
		[
			"review.json",
			(record) =>
				/^[a-f\d]{64}$/i.test(record.sha256 ?? "") &&
				typeof record.status === "string" &&
				record.status.trim().length > 0 &&
				fileSha256(path.join(folder, "brief.md"), readFile)?.toLowerCase() ===
					record.sha256.toLowerCase(),
		],
	]) {
		let record;
		try {
			record = JSON.parse(readFile(path.join(folder, name), "utf8"));
		} catch {
			continue;
		}
		if (plainRecord(record) && accept(record)) return true;
	}
	return false;
}

function foldersToCitation(tempRoot, citationPath, stat) {
	const absoluteRoot = path.resolve(tempRoot);
	const absoluteCitation = path.resolve(citationPath);
	if (
		key(absoluteRoot) === key(absoluteCitation) ||
		!inside(absoluteRoot, absoluteCitation)
	)
		return [];
	const relative = path.relative(absoluteRoot, absoluteCitation);
	const segments = relative.split(path.sep).filter(Boolean);
	if (!stat(absoluteCitation).isDirectory()) segments.pop();
	let current = absoluteRoot;
	return segments.map((segment) => {
		current = path.join(current, segment);
		return current;
	});
}

function provenanceDecision(
	citationPath,
	{ holdsCommit, readFile = readFileSync, stat = statSync, tempRoot },
) {
	const folders = foldersToCitation(tempRoot, citationPath, stat);
	if (!folders.length) return { kind: "outside-run-folder" };
	if (folders.some((folder) => provenanceAt(folder, { holdsCommit, readFile })))
		return { kind: "provenanced" };
	const creationTimes = folders.map((folder) => ({
		folder,
		birthtime: stat(folder).birthtime,
	}));
	const current = creationTimes.find(
		({ birthtime }) =>
			!(birthtime instanceof Date) ||
			!Number.isFinite(birthtime.getTime()) ||
			birthtime.getTime() >= TEMP_PROVENANCE_CUTOFF.getTime(),
	);
	return current
		? {
				kind: "missing",
				folder: current.folder,
			}
		: { kind: "legacy", folders };
}

function runFolderNewFix(citationPath, tempRoot = "D:/fitway-temp") {
	const absoluteRoot = path.resolve(tempRoot);
	const absoluteCitation = path.resolve(citationPath);
	if (!inside(absoluteRoot, absoluteCitation)) return null;
	const segments = path
		.relative(absoluteRoot, absoluteCitation)
		.split(path.sep)
		.filter(Boolean);
	const [name] = segments;
	return name && segments.length > 1
		? `pnpm run-folder:new ${name} --brief <file> --for <who>`
		: null;
}

export function auditRunFolderProvenance(
	existing,
	{
		checkout,
		holdsCommit = (commit) => {
			try {
				git(["cat-file", "-e", `${commit}^{commit}`], checkout);
				return true;
			} catch {
				return false;
			}
		},
		lineChanged,
		readFile,
		stat,
		tempRoot,
	},
) {
	const legacy = [];
	const provenanceFailures = [];
	for (const citation of existing) {
		if (!lineChanged(citation)) continue;
		const decision = provenanceDecision(citation.path, {
			holdsCommit,
			readFile,
			stat,
			tempRoot,
		});
		if (
			decision.kind === "outside-run-folder" ||
			decision.kind === "provenanced"
		)
			continue;
		if (decision.kind === "legacy") {
			legacy.push({ ...citation, changed: true });
			continue;
		}
		provenanceFailures.push({
			...citation,
			changed: true,
			folder: decision.folder,
		});
	}
	return { legacy, provenanceFailures };
}

export function formatTempCitationDetails(
	citations,
	{ tempRoot, withProvenance = false } = {},
) {
	return citations
		.map((citation) => {
			const fix = runFolderNewFix(citation.path, tempRoot);
			const provenance = withProvenance
				? `\n  Folder made after ${TEMP_PROVENANCE_CUTOFF_ISO} with no provenance record: ${citation.folder}`
				: "";
			const goneFix =
				!withProvenance && fix ? `\n  Run folder not made yet? ${fix}` : "";
			return `${citation.source}:${citation.line}: ${citation.path}${provenance}${goneFix}`;
		})
		.join("\n");
}
