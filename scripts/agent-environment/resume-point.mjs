import { readFile } from "node:fs/promises";
import path from "node:path";
import { inspectPath } from "../check-agent-context.mjs";
import {
	createPathReferenceResolver,
	exists,
	referenceTarget,
} from "./path-reference.mjs";

export const RESUME_POINT_MARKER = "<!-- handoff-format: resume-point-v1 -->";
export const MAX_RESUME_POINT_BYTES = 12_288;
export const RESUME_POINT_HEADERS = [
	"As of",
	"Previous resume point",
	"Standing decisions",
];
export const RESUME_POINT_SECTIONS = [
	"State",
	"Running now",
	"Next steps",
	"Waiting on the user",
	"Known risks",
	"Pointers",
];

// Exact filler from HANDOFF_TEMPLATE.md; angle-bracket filename patterns are valid.
const TEMPLATE_PLACEHOLDERS = [
	"<milestone-id>",
	"<branch>",
	"<short sha>",
	"<YYYY-MM-DD HH:MM>",
	"<repo path>",
	"<repo path to the milestone's DECISIONS.md>",
	"<absolute path>",
	"What exists now and what was last delivered, with commit hashes.",
	'Agents, Codex rounds or jobs in flight, and where their output will land. "Nothing." if none.',
	"Decided steps only, in order; each names its inputs by path and section.",
	'Questions or picks the user owes, each answerable in one line. "Nothing." if none.',
	"Traps the next session would otherwise rediscover: environment quirks, defects already in the baseline, assumptions not yet measured.",
].map(
	(placeholder) =>
		new RegExp(
			placeholder
				.split(/\s+/)
				.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
				.join("\\s+"),
		),
);

export function hasResumePointMarker(text) {
	return text.includes(RESUME_POINT_MARKER);
}

async function hasStandingDecisionsFile(line, repositoryRoot, resolver) {
	for (const match of line.matchAll(/`([^`\r\n]+)`/g)) {
		const reference = await resolver.reference(match[1], { allowBare: true });
		if (!reference || path.posix.basename(reference.file) !== "DECISIONS.md")
			continue;
		try {
			if (path.isAbsolute(reference.file)) {
				if ((await exists(reference.file))?.isFile()) return true;
			} else {
				const details = await repositoryPath(repositoryRoot, reference.file);
				if (!details.isDirectory) return true;
			}
		} catch {
			// A missing or unsafe candidate cannot satisfy the standing-decisions header.
		}
	}
	return false;
}

export async function repositoryPath(
	repositoryRoot,
	relativePath,
	{ allowMissing = false } = {},
) {
	if (typeof relativePath !== "string" || /^[A-Za-z]:/.test(relativePath))
		throw new Error(`Unsafe repository path: ${relativePath}`);
	const details = await inspectPath(repositoryRoot, relativePath);
	if (details.unsafe || details.escape || details.error || details.caseMismatch)
		throw new Error(`Unsafe or unresolved repository path: ${relativePath}`);
	if (!allowMissing && !details.exists)
		throw new Error(`Missing repository path: ${relativePath}`);
	return details;
}

async function referencedFilePaths(text, resolver) {
	const paths = new Set();
	for (const line of text.split(/\r?\n/)) {
		const allowBare =
			/^- \*\*(?:Previous resume point|Standing decisions):\*\*/.test(line);
		for (const match of line.matchAll(/`([^`\r\n]+)`/g)) {
			const reference = await resolver.reference(match[1], { allowBare });
			if (reference) paths.add(reference.file);
		}
	}
	return paths;
}

export async function validateResumePoint({
	repositoryRoot,
	handoffPath,
	bytes,
}) {
	const text = bytes.toString("utf8");
	if (!hasResumePointMarker(text)) return false;
	const fail = (message) => {
		throw new Error(`${handoffPath}: ${message}`);
	};
	if (bytes.byteLength > MAX_RESUME_POINT_BYTES)
		fail(
			`resume point exceeds ${MAX_RESUME_POINT_BYTES} bytes (${bytes.byteLength})`,
		);
	if (/local_[A-Za-z\d_-]+/.test(text))
		fail("resume point contains a stale local_ session id");
	const placeholder = TEMPLATE_PLACEHOLDERS.map((pattern) => pattern.exec(text))
		.filter(Boolean)
		.sort((left, right) => left.index - right.index)[0];
	if (placeholder) {
		const line = text.slice(0, placeholder.index).split(/\r?\n/).length;
		fail(
			`line ${line}: resume point contains template placeholder: ${placeholder[0].replace(/\s+/g, " ")}`,
		);
	}
	const headers = [
		...text.matchAll(
			/^- \*\*(As of|Previous resume point|Standing decisions):\*\*[^\r\n]*$/gm,
		),
	];
	if (
		headers.length !== RESUME_POINT_HEADERS.length ||
		headers.some((match, index) => match[1] !== RESUME_POINT_HEADERS[index])
	)
		fail(
			`resume point requires header lines in order: ${RESUME_POINT_HEADERS.join(", ")}`,
		);
	const sections = [...text.matchAll(/^## ([^\r\n]+)\r?$/gm)];
	if (
		sections.length !== RESUME_POINT_SECTIONS.length ||
		sections.some(
			(match, index) => match[1] !== RESUME_POINT_SECTIONS[index],
		) ||
		headers[2].index > sections[0].index
	)
		fail(
			`resume point requires six sections in order: ${RESUME_POINT_SECTIONS.join(", ")}`,
		);
	const resolver = createPathReferenceResolver(repositoryRoot);
	if (
		!(await hasStandingDecisionsFile(headers[2][0], repositoryRoot, resolver))
	) {
		const line = text.slice(0, headers[2].index).split(/\r?\n/).length;
		fail(
			`line ${line}: Standing decisions must name an existing DECISIONS.md file; found ${headers[2][0].slice("- **Standing decisions:**".length).trim() || "(empty)"}`,
		);
	}
	for (const relativePath of await referencedFilePaths(text, resolver)) {
		try {
			const { wildcard, file } = referenceTarget(relativePath);
			if (path.isAbsolute(file)) {
				const details = await exists(file);
				if (!details) throw new Error("path does not exist");
				if (wildcard && !details.isDirectory()) throw new Error("not a folder");
			} else {
				// inspectPath rejects empty segments; a final slash denotes a folder.
				const folder = wildcard || file.endsWith("/");
				const details = await repositoryPath(
					repositoryRoot,
					file.endsWith("/") ? file.slice(0, -1) : file,
				);
				if (folder && !details.isDirectory) throw new Error("not a folder");
			}
		} catch {
			fail(
				`resume point references a missing or unsafe repository path: ${relativePath}${resolver.missingPathHint(relativePath)}`,
			);
		}
	}
	return true;
}

export async function validateActiveResumePoints({ repositoryRoot, state }) {
	let checked = 0;
	for (const milestone of Object.values(state.milestones ?? {})) {
		if (!milestone.handoff) continue;
		const details = await repositoryPath(repositoryRoot, milestone.handoff);
		const bytes = await readFile(details.absolute);
		if (
			await validateResumePoint({
				repositoryRoot,
				handoffPath: milestone.handoff,
				bytes,
			})
		)
			checked += 1;
	}
	return checked;
}
