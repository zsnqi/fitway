import { readFile } from "node:fs/promises";
import { inspectPath } from "../check-agent-context.mjs";

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

function referencedFilePaths(text) {
	const paths = new Set();
	for (const line of text.split(/\r?\n/)) {
		// This header's backticks hold a Git branch and HEAD, not file paths.
		if (line.startsWith("- **As of:**")) continue;
		for (const match of line.matchAll(/`([^`\r\n]+)`/g)) {
			const value = match[1].replaceAll("\\", "/");
			if (
				/<[^>]*>/.test(value) ||
				value.startsWith("/") ||
				/^[A-Za-z]:/.test(value)
			)
				continue;
			if (/\bbranch\s*$/i.test(line.slice(0, match.index))) continue;
			// Backticks also hold commands, hashes and titles. File paths can contain spaces.
			if (
				/^(?:pnpm|npm|node|git|npx)\s/.test(value) ||
				/^[a-z][a-z\d+.-]*:\/\//i.test(value)
			)
				continue;
			if (
				value.includes("/") ||
				/(?:^\.|\.)[A-Za-z\d_-]+$/.test(value) ||
				/^(?:LICENSE|NOTICE|COPYING|Dockerfile|Makefile|Justfile|Procfile)$/.test(
					value,
				) ||
				/^- \*\*(?:Previous resume point|Standing decisions):\*\*/.test(line)
			)
				paths.add(value);
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
	for (const relativePath of referencedFilePaths(text)) {
		try {
			const details = await repositoryPath(repositoryRoot, relativePath);
			if (details.isDirectory) throw new Error("not a file");
		} catch {
			fail(
				`resume point references a missing or unsafe repository file: ${relativePath}`,
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
