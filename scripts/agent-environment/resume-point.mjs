import { readFile } from "node:fs/promises";
import path from "node:path";
import { inspectPath } from "../check-agent-context.mjs";
import { readGit } from "./git-context.mjs";
import {
	createPathReferenceResolver,
	exists,
	referenceTarget,
} from "./path-reference.mjs";

export const RESUME_POINT_MARKER = "<!-- handoff-format: resume-point-v1 -->";
export const MAX_RESUME_POINT_BYTES = 12_288;
export const RESUME_POINT_HEADERS = ["As of", "Standing decisions"];
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

export function resumePointFilename(milestoneId) {
	return `${milestoneId}-resume.md`;
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

// Exit 0 means ignored; tracked files are never reported. Exit 1 (not ignored) and 128 (no repository) pass.
function gitIgnored(repositoryRoot, relativePath) {
	try {
		readGit(repositoryRoot, ["check-ignore", "-q", "--", relativePath]);
		return true;
	} catch {
		return false;
	}
}

async function referencedFilePaths(text, resolver) {
	const paths = new Set();
	for (const line of text.split(/\r?\n/)) {
		if (/^- \*\*Previous resume point:\*\*/.test(line)) continue;
		const allowBare = /^- \*\*Standing decisions:\*\*/.test(line);
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
	milestoneId,
}) {
	const text = bytes.toString("utf8");
	const fail = (message) => {
		throw new Error(`${handoffPath}: ${message}`);
	};
	if (!hasResumePointMarker(text)) {
		const filename = path.posix.basename(handoffPath.replaceAll("\\", "/"));
		const timestamp = filename.match(/^\d{8}-\d{6}/)?.[0];
		if (
			milestoneId !== undefined &&
			(filename === resumePointFilename(milestoneId) ||
				filename === `${timestamp}-${milestoneId}-resume.md`)
		)
			fail(`resume point is missing required marker: ${RESUME_POINT_MARKER}`);
		return false;
	}
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
	const headerMatches = [
		...text.matchAll(
			/^- \*\*(As of|Previous resume point|Standing decisions):\*\*[^\r\n]*$/gm,
		),
	];
	const headers = headerMatches.filter(
		(match) => match[1] !== "Previous resume point",
	);
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
		headers[1].index > sections[0].index
	)
		fail(
			`resume point requires six sections in order: ${RESUME_POINT_SECTIONS.join(", ")}`,
		);
	const resolver = createPathReferenceResolver(repositoryRoot);
	if (
		!(await hasStandingDecisionsFile(headers[1][0], repositoryRoot, resolver))
	) {
		const line = text.slice(0, headers[1].index).split(/\r?\n/).length;
		fail(
			`line ${line}: Standing decisions must name an existing DECISIONS.md file; found ${headers[1][0].slice("- **Standing decisions:**".length).trim() || "(empty)"}`,
		);
	}
	for (const relativePath of await referencedFilePaths(text, resolver)) {
		let ignored = false;
		try {
			const { wildcard, file } = referenceTarget(relativePath);
			if (path.isAbsolute(file)) {
				const details = await exists(file);
				if (!details) throw new Error("path does not exist");
				if (wildcard && !details.isDirectory()) throw new Error("not a folder");
			} else {
				// inspectPath rejects empty segments; a final slash denotes a folder.
				const folder = wildcard || file.endsWith("/");
				const target = file.endsWith("/") ? file.slice(0, -1) : file;
				const details = await repositoryPath(repositoryRoot, target);
				if (folder && !details.isDirectory) throw new Error("not a folder");
				ignored = gitIgnored(repositoryRoot, target);
			}
		} catch {
			fail(
				`resume point references a missing or unsafe repository path: ${relativePath}${resolver.missingPathHint(relativePath)}`,
			);
		}
		if (ignored)
			fail(
				`resume point references a git-ignored path, present on this disk and absent in CI: ${relativePath}`,
			);
	}
	return true;
}

export async function validateActiveResumePoints({ repositoryRoot, state }) {
	let checked = 0;
	for (const [milestoneId, milestone] of Object.entries(
		state.milestones ?? {},
	)) {
		if (!milestone.handoff) continue;
		const details = await repositoryPath(repositoryRoot, milestone.handoff);
		const bytes = await readFile(details.absolute);
		if (
			await validateResumePoint({
				repositoryRoot,
				handoffPath: milestone.handoff,
				bytes,
				milestoneId,
			})
		)
			checked += 1;
	}
	return checked;
}
