// Copy selected evidence into the repository with hashes and source records.
import {
	copyFileSync,
	existsSync,
	lstatSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	realpathSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { readGit } from "./code-health-ratchet.mjs";
import { sha256 } from "./codex-environment.mjs";
import { beginToolCommand } from "./tool-contract.mjs";

const EVIDENCE_ROOT = "docs/phase-records/evidence";
const SOURCES_FILE = "SOURCES.md";
const SOURCES_HEADER = [
	"# Evidence sources",
	"",
	"| Original path | SHA-256 | Evidence |",
	"| --- | --- | --- |",
].join("\n");
const IMAGE_VIDEO_EXTENSIONS = new Set([
	".avif",
	".bmp",
	".gif",
	".heic",
	".jpeg",
	".jpg",
	".m4v",
	".mkv",
	".mov",
	".mp4",
	".mpeg",
	".mpg",
	".png",
	".svg",
	".tif",
	".tiff",
	".webm",
	".webp",
	".wmv",
]);

export const EVIDENCE_LIMITS = Object.freeze({
	fileBytes: 1_000_000,
	callFiles: 200,
	callBytes: 5_000_000,
	evidenceBytes: 50_000_000,
});

function normalized(value) {
	return value.replaceAll("\\", "/");
}

function inside(root, candidate) {
	const relative = path.relative(root, candidate);
	return (
		relative === "" ||
		(!relative.startsWith("..") && !path.isAbsolute(relative))
	);
}

function assertCanonicalRoot(root) {
	let result;
	try {
		result = readGit(root, ["rev-parse", "--show-toplevel"]);
	} catch (error) {
		throw new Error(`not a Git worktree: ${root}: ${error.message}`);
	}
	if (result.status !== 0)
		throw new Error(`not a Git worktree: ${root}: ${result.stderr.trim()}`);
	// Git prints the long path; a temp root may be a Windows short alias (RUNNER~1).
	const top = realpathSync.native(result.stdout.trim());
	if (!inside(top, realpathSync.native(root)))
		throw new Error(`repository root is outside its Git worktree: ${root}`);
	return top;
}

function destinationParts(value) {
	const parts = normalized(value).split("/");
	if (
		parts.length !== 2 ||
		parts.some(
			(part) =>
				!part ||
				part === "." ||
				part === ".." ||
				/[<>:"|?*\0]/.test(part) ||
				/[. ]$/.test(part),
		)
	)
		throw new Error(`--to must name exactly <milestone>/<topic>: ${value}`);
	return parts;
}

function walkNamedPath(source, relative = path.basename(source)) {
	const details = lstatSync(source);
	if (details.isSymbolicLink())
		throw new Error(`refusing symbolic link: ${source}`);
	if (details.isFile()) return [{ source, relative }];
	if (!details.isDirectory())
		throw new Error(`not a regular file or folder: ${source}`);
	const files = [];
	for (const entry of readdirSync(source, { withFileTypes: true }).sort(
		(left, right) => left.name.localeCompare(right.name, "en"),
	)) {
		const child = path.join(source, entry.name);
		if (entry.isSymbolicLink())
			throw new Error(`refusing symbolic link: ${child}`);
		files.push(
			...walkNamedPath(
				child,
				relative === ""
					? entry.name
					: path.posix.join(normalized(relative), entry.name),
			),
		);
	}
	return files;
}

function tableCell(value) {
	return `\`${normalized(value).replaceAll("|", "\\|")}\``;
}

function sourceLine(entry, destination, repositoryRoot) {
	const evidence = normalized(
		path.relative(repositoryRoot, path.join(destination, entry.relative)),
	);
	return `| ${tableCell(entry.source)} | \`${entry.sha256}\` | ${tableCell(
		evidence,
	)} |`;
}

function sourcesText(existing, lines) {
	const present = new Set(existing.split(/\r?\n/));
	const additions = lines.filter((line) => !present.has(line)).sort();
	if (!existing.trim()) return `${SOURCES_HEADER}\n${additions.join("\n")}\n`;
	if (!additions.length) return existing;
	const base = existing.endsWith("\n") ? existing : `${existing}\n`;
	const body = base.includes("| Original path | SHA-256 | Evidence |")
		? base
		: `${base}\n${SOURCES_HEADER.slice(SOURCES_HEADER.indexOf("|"))}\n`;
	return `${body}${additions.join("\n")}\n`;
}

function checkIgnored(repositoryRoot, target, sources) {
	for (const candidate of [
		target,
		path.join(target, ".evidence-probe"),
		sources,
	]) {
		const relative = normalized(path.relative(repositoryRoot, candidate));
		const result = readGit(repositoryRoot, [
			"check-ignore",
			"--quiet",
			"--no-index",
			"--",
			relative,
		]);
		if (result.status === 0)
			throw new Error(`destination is ignored by Git: ${relative}`);
		if (result.status !== 1)
			throw new Error(`git check-ignore failed: ${result.stderr.trim()}`);
	}
}

function plannedEvidence(repositoryRoot, inputs, destination) {
	const entries = [];
	for (const input of inputs) {
		const source = path.resolve(repositoryRoot, input);
		if (!existsSync(source))
			throw new Error(`evidence path not found: ${input}`);
		entries.push(
			...walkNamedPath(
				source,
				lstatSync(source).isDirectory() ? "" : path.basename(source),
			),
		);
	}

	const targets = new Map();
	for (const entry of entries) {
		const relative = normalized(entry.relative);
		const target = path.resolve(destination, relative);
		if (!inside(destination, target))
			throw new Error(`evidence path escapes destination: ${entry.source}`);
		const bytes = readFileSync(entry.source);
		if (bytes.byteLength > EVIDENCE_LIMITS.fileBytes)
			throw new Error(
				`file exceeds 1 MB: ${entry.source} (${bytes.byteLength} bytes)`,
			);
		if (IMAGE_VIDEO_EXTENSIONS.has(path.extname(entry.source).toLowerCase()))
			throw new Error(
				`image or video belongs in concept evidence: ${entry.source}`,
			);
		const item = {
			source: normalized(entry.source),
			relative,
			bytes,
			sha256: sha256(bytes),
			target,
		};
		const prior = targets.get(target);
		if (prior && prior.sha256 !== item.sha256)
			throw new Error(
				`two evidence files map to ${normalized(target)}: ${prior.source} and ${item.source}`,
			);
		if (!prior) targets.set(target, item);
	}
	return [...targets.values()];
}

function plannedAdditions(planned) {
	const additions = [];
	let addedBytes = 0;
	for (const item of planned) {
		if (!existsSync(item.target)) {
			additions.push(item);
			addedBytes += item.bytes.byteLength;
			continue;
		}
		const existing = lstatSync(item.target);
		if (!existing.isFile())
			throw new Error(`evidence target is not a file: ${item.target}`);
		const bytes = readFileSync(item.target);
		if (sha256(bytes) !== item.sha256)
			throw new Error(
				`evidence target already holds a different file: ${item.target}`,
			);
	}
	if (additions.length > EVIDENCE_LIMITS.callFiles)
		throw new Error(
			`evidence call would copy ${additions.length} files; limit is ${EVIDENCE_LIMITS.callFiles}`,
		);
	if (addedBytes > EVIDENCE_LIMITS.callBytes)
		throw new Error(
			`evidence call would copy ${addedBytes} bytes; limit is ${EVIDENCE_LIMITS.callBytes}`,
		);
	return { additions, addedBytes };
}

function plannedSources({
	planned,
	destination,
	repositoryRoot,
	sources,
	addedBytes,
}) {
	const existingSources = existsSync(sources)
		? readFileSync(sources, "utf8")
		: "";
	const lines = planned.map((item) =>
		sourceLine(item, destination, repositoryRoot),
	);
	const nextSources = sourcesText(existingSources, lines);
	const sourceDelta =
		Buffer.byteLength(nextSources) - Buffer.byteLength(existingSources);
	const evidenceFolder = path.join(repositoryRoot, EVIDENCE_ROOT);
	const keptBytes = existsSync(evidenceFolder)
		? walkNamedPath(evidenceFolder, "").reduce(
				(total, entry) => total + lstatSync(entry.source).size,
				0,
			)
		: 0;
	const evidenceBytes = keptBytes + addedBytes + sourceDelta;
	if (evidenceBytes > EVIDENCE_LIMITS.evidenceBytes)
		throw new Error(
			`evidence folder would reach ${evidenceBytes} bytes; limit is ${EVIDENCE_LIMITS.evidenceBytes}`,
		);
	return { existingSources, nextSources };
}

export function keepEvidence({ root = process.cwd(), inputs, to } = {}) {
	if (!Array.isArray(inputs) || inputs.length === 0)
		throw new Error("at least one evidence path is required");
	const repositoryRoot = assertCanonicalRoot(root);
	const parts = destinationParts(to);
	const evidenceRoot = path.join(repositoryRoot, EVIDENCE_ROOT);
	const destination = path.join(evidenceRoot, ...parts);
	const sources = path.join(destination, SOURCES_FILE);
	checkIgnored(repositoryRoot, destination, sources);
	const planned = plannedEvidence(repositoryRoot, inputs, destination);
	const { additions, addedBytes } = plannedAdditions(planned);
	const { existingSources, nextSources } = plannedSources({
		planned,
		destination,
		repositoryRoot,
		sources,
		addedBytes,
	});

	for (const item of additions) {
		mkdirSync(path.dirname(item.target), { recursive: true });
		copyFileSync(item.source, item.target);
	}
	mkdirSync(destination, { recursive: true });
	if (nextSources !== existingSources)
		writeFileSync(sources, nextSources, "utf8");

	const changed = [
		...new Set([...planned.map((item) => item.target), sources]),
	];
	const relativeChanged = [...changed]
		.map((file) => normalized(path.relative(repositoryRoot, file)))
		.sort();
	const staged = readGit(repositoryRoot, ["add", "--", ...relativeChanged]);
	if (staged.status !== 0)
		throw new Error(`git add failed: ${staged.stderr.trim()}`);
	return {
		destination: normalized(path.relative(repositoryRoot, destination)),
		files: relativeChanged.filter(
			(file) =>
				file !==
				path.posix.join(
					normalized(path.relative(repositoryRoot, destination)),
					SOURCES_FILE,
				),
		),
		sources: normalized(path.relative(repositoryRoot, sources)),
		added: additions.length,
	};
}

export function evidenceOptions(parsed) {
	return {
		inputs: parsed.positionals,
		to: parsed.options?.to,
	};
}

function main(options) {
	const result = keepEvidence({ ...options, root: process.cwd() });
	console.log(`Evidence: ${result.destination}/`);
	console.log(`Sources: ${result.sources}`);
}

if (
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	try {
		main(
			evidenceOptions(beginToolCommand("evidence:keep", process.argv.slice(2))),
		);
	} catch (error) {
		console.error(`evidence:keep: FAIL: ${error.message}`);
		process.exitCode = 1;
	}
}
