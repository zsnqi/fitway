import { readFile } from "node:fs/promises";
import path from "node:path";
import { inspectPath } from "../check-agent-context.mjs";
import { createPathReferenceResolver, exists } from "./path-reference.mjs";

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
	if (!text.includes(RESUME_POINT_MARKER)) return false;
	const fail = (message) => {
		throw new Error(`${handoffPath}: ${message}`);
	};
	if (bytes.byteLength > MAX_RESUME_POINT_BYTES)
		fail(
			`resume point exceeds ${MAX_RESUME_POINT_BYTES} bytes (${bytes.byteLength})`,
		);
	if (/local_[A-Za-z\d_-]+/.test(text))
		fail("resume point contains a stale local_ session id");
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
	for (const relativePath of await referencedFilePaths(text, resolver)) {
		try {
			if (path.isAbsolute(relativePath)) {
				const details = await exists(relativePath);
				if (!details?.isFile()) throw new Error("not a file");
			} else {
				const details = await repositoryPath(repositoryRoot, relativePath);
				if (details.isDirectory) throw new Error("not a file");
			}
		} catch {
			fail(
				`resume point references a missing or unsafe repository file: ${relativePath}${resolver.missingPathHint(relativePath)}`,
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
