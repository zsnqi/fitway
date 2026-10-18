// Repository file, byte, tree, and Claude instruction checks.
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

export const root = process.cwd();

export function fail(message) {
	throw new Error(message);
}

export const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);
export const CLAUDE_AGENT_DIRECTORY = ".claude/agents";
export const CLAUDE_INSTRUCTIONS_FILE = "CLAUDE.md";

export const TRACKED_BOM_EXCEPTIONS = Object.freeze([
	{
		path: "apps/server/src/phase11-settings.integration.test.ts",
		reason:
			"Pre-existing tracked BOM; kept byte-for-byte outside this round's approved scope.",
	},
	{
		path: "apps/web/src/components/owner/settings/owner-settings-section.test.tsx",
		reason:
			"Pre-existing tracked BOM; kept byte-for-byte outside this round's approved scope.",
	},
	{
		path: "apps/web/src/components/owner/settings/owner-settings-section.tsx",
		reason:
			"Pre-existing tracked BOM; kept byte-for-byte outside this round's approved scope.",
	},
	{
		path: "apps/web/src/components/owner/settings/owner-settings-view.tsx",
		reason:
			"Pre-existing tracked BOM; kept byte-for-byte outside this round's approved scope.",
	},
	{
		path: "docs/phase-records/handoffs/coordinator/20260915-183000-design-agent-environment-repair-r01-pre-existing-frontier.txt",
		reason: "Historical evidence preserved with its original bytes and BOM.",
	},
	{
		path: "tests/browser/phase11-settings.browser.spec.ts",
		reason:
			"Pre-existing tracked BOM; kept byte-for-byte outside this round's approved scope.",
	},
]);

const CLAUDE_MODEL_ALIASES = new Map([
	["opus", "opus"],
	["sonnet", "sonnet"],
	["haiku 5.5", "claude-haiku-5-5"],
]);

export function normalizeClaudeModel(value) {
	const normalized = String(value).trim().toLowerCase().replace(/\s+/g, " ");
	return CLAUDE_MODEL_ALIASES.get(normalized) ?? normalized;
}

export function resolveRepositoryPath(relativePath) {
	const absolute = path.resolve(root, relativePath);
	const relative = path.relative(root, absolute);
	if (relative.startsWith("..") || path.isAbsolute(relative)) {
		fail(`Path escapes the repository: ${relativePath}`);
	}
	return absolute;
}

export async function readBytes(relativePath) {
	return readFile(resolveRepositoryPath(relativePath));
}

function sha256(bytes) {
	return createHash("sha256").update(bytes).digest("hex");
}

export async function assertFileRecord(record, label) {
	if (!record?.path || !Number.isInteger(record.bytes) || !record.sha256) {
		fail(`${label} is missing path, bytes, or sha256`);
	}
	const bytes = await readBytes(record.path);
	if (bytes.byteLength !== record.bytes) {
		fail(`${label} byte count changed: ${record.path}`);
	}
	if (sha256(bytes) !== record.sha256) {
		fail(`${label} SHA-256 changed: ${record.path}`);
	}
}

async function walkFiles(directory, prefix = "") {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
		const absolute = path.join(directory, entry.name);
		if (entry.isDirectory())
			files.push(...(await walkFiles(absolute, relative)));
		else if (entry.isFile()) files.push({ absolute, relative });
		else fail(`Approval tree contains a non-file entry: ${relative}`);
	}
	return files;
}

export async function assertTreeRecord(record, label) {
	if (
		!record?.path ||
		!Number.isInteger(record.fileCount) ||
		!record.treeSha256
	) {
		fail(`${label} is missing path, fileCount, or treeSha256`);
	}
	const directory = resolveRepositoryPath(record.path);
	if (!(await stat(directory)).isDirectory())
		fail(`${label} is not a directory`);
	const files = (await walkFiles(directory)).sort((a, b) =>
		a.relative < b.relative ? -1 : a.relative > b.relative ? 1 : 0,
	);
	if (files.length !== record.fileCount) {
		fail(`${label} file count changed: ${record.path}`);
	}
	const tree = createHash("sha256");
	for (const file of files) {
		tree.update(
			`${sha256(await readFile(file.absolute))}  ${file.relative}\n`,
			"utf8",
		);
	}
	if (tree.digest("hex") !== record.treeSha256) {
		fail(`${label} tree SHA-256 changed: ${record.path}`);
	}
}
