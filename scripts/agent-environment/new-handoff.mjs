import { createHash } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { isScalar, parseDocument } from "yaml";
import { buildAgentContextPlan } from "../show-agent-context.mjs";
import { behindUpstreamWarning, readGit } from "./git-context.mjs";
import { RESUME_POINT_MARKER, repositoryPath } from "./resume-point.mjs";

const STATE_PATH = "PROJECT_STATE.yaml";
const TEMPLATE_PATH = "docs/agent-context/HANDOFF_TEMPLATE.md";
const ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

export function parseHandoffArgs(inputArgs) {
	const args = inputArgs[0] === "--" ? inputArgs.slice(1) : inputArgs;
	const options = {};
	const names = new Map([
		["--milestone", "milestoneId"],
		["--slug", "slug"],
		["--dir", "directory"],
		["--lease-hours", "leaseHours"],
		["--now", "now"],
	]);
	for (let index = 0; index < args.length; index += 1) {
		const argument = args[index];
		if (argument === "--help" || argument === "-h") return { help: true };
		const name = names.get(argument);
		if (!name) throw new Error(`Unknown argument: ${argument}`);
		if (Object.hasOwn(options, name))
			throw new Error(`Duplicate argument: ${argument}`);
		const value = args[++index];
		if (!value || value.startsWith("--"))
			throw new Error(`${argument} requires a value`);
		options[name] = value;
	}
	return options;
}

function yamlDocument(text, label) {
	const document = parseDocument(text);
	if (document.errors.length)
		throw new Error(`${label}: ${document.errors[0].message}`);
	return document;
}

// Replace only scalar value ranges, preserving indentation, comments, quotes and CRLF.
export function replaceYamlScalars(text, replacements, label) {
	const document = yamlDocument(text, label);
	const edits = replacements
		.map(([keys, value]) => {
			const node = document.getIn(keys, true);
			if (
				!isScalar(node) ||
				!node.range ||
				!["PLAIN", "QUOTE_DOUBLE", "QUOTE_SINGLE"].includes(node.type)
			)
				throw new Error(
					`${label}: missing or unsupported scalar ${keys.join(".")}`,
				);
			let replacement =
				node.type === "QUOTE_DOUBLE"
					? JSON.stringify(value)
					: node.type === "QUOTE_SINGLE"
						? `'${value.replaceAll("'", "''")}'`
						: value;
			if (node.type === "PLAIN") {
				const probe = parseDocument(`value: ${replacement}\n`);
				if (probe.errors.length || probe.get("value") !== value)
					replacement = JSON.stringify(value);
			}
			return { start: node.range[0], end: node.range[1], replacement };
		})
		.sort((a, b) => b.start - a.start);
	let updatedText = text;
	for (const edit of edits)
		updatedText =
			updatedText.slice(0, edit.start) +
			edit.replacement +
			updatedText.slice(edit.end);
	yamlDocument(updatedText, label);
	return updatedText;
}

function parseNow(value) {
	if (value === undefined) return new Date();
	const match = value.match(
		/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
	);
	const now = new Date(value);
	if (!match || !Number.isFinite(now.getTime()))
		throw new Error("--now requires an ISO-8601 timestamp with a UTC offset");
	const [, year, month, day, hour, minute, second, offset] = match;
	const lastDay = new Date(
		Date.UTC(Number(year), Number(month), 0),
	).getUTCDate();
	if (
		+month < 1 ||
		+month > 12 ||
		+day < 1 ||
		+day > lastDay ||
		+hour > 23 ||
		+minute > 59 ||
		+second > 59 ||
		(offset !== "Z" && (+offset.slice(1, 3) > 23 || +offset.slice(4) > 59))
	)
		throw new Error("--now requires a valid ISO-8601 timestamp");
	return now;
}

export function localTimestamp(now) {
	const pad = (value) => String(value).padStart(2, "0");
	const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
	const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
	const offset = -now.getTimezoneOffset();
	const zone = `${offset >= 0 ? "+" : "-"}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`;
	return {
		filename: `${date}-${time}`,
		label: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())} ${zone}`,
		iso: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}${zone}`,
	};
}

function replaceHeader(text, name, value) {
	const pattern = new RegExp(`^- \\*\\*${name}:\\*\\*[^\\r\\n]*`, "gm");
	if ([...text.matchAll(pattern)].length !== 1)
		throw new Error(`Resume point requires one ${name} header line`);
	return text.replace(pattern, () => `- **${name}:** ${value}`);
}

export async function createResumePoint({
	repositoryRoot = readGit(process.cwd(), ["rev-parse", "--show-toplevel"]),
	milestoneId,
	slug,
	directory,
	leaseHours = 72,
	now: nowValue,
	git = readGit,
	writeFileImpl = writeFile,
}) {
	if (!ID_PATTERN.test(milestoneId ?? ""))
		throw new Error("--milestone requires a lowercase milestone id");
	if (!ID_PATTERN.test(slug ?? ""))
		throw new Error(
			"--slug requires a lowercase run id (letters, digits, hyphens or underscores)",
		);
	const now = parseNow(nowValue);
	const hours = Number(leaseHours);
	const expiry = new Date(now.getTime() + hours * 3_600_000);
	if (
		!Number.isFinite(hours) ||
		hours <= 0 ||
		!Number.isFinite(expiry.getTime())
	)
		throw new Error("--lease-hours must be a positive finite number");
	const stateDetails = await repositoryPath(repositoryRoot, STATE_PATH);
	const stateText = await readFile(stateDetails.absolute, "utf8");
	const state = yamlDocument(stateText, STATE_PATH).toJS();
	const milestone = state.milestones?.[milestoneId];
	if (!milestone) throw new Error(`Unknown active milestone: ${milestoneId}`);
	if (!milestone.taskPacket || !milestone.taskPacketSha256)
		throw new Error(`${milestoneId}: a registered task packet is required`);
	// Fail before writing on stale hashes, identity, continuity, scope or lifecycle.
	await buildAgentContextPlan({ repositoryRoot, milestoneId });
	const packetDetails = await repositoryPath(
		repositoryRoot,
		milestone.taskPacket,
	);
	const packetText = await readFile(packetDetails.absolute, "utf8");
	const handoffDetails = await repositoryPath(
		repositoryRoot,
		milestone.handoff,
	);
	const oldHandoff = handoffDetails.normalized;
	const current = await readFile(handoffDetails.absolute, "utf8");
	let content = current;
	if (!current.includes(RESUME_POINT_MARKER)) {
		const templateDetails = await repositoryPath(repositoryRoot, TEMPLATE_PATH);
		const template = await readFile(templateDetails.absolute, "utf8");
		const blocks = [
			...template.matchAll(
				/<!-- template:start -->\r?\n([\s\S]*?)<!-- template:end -->/g,
			),
		];
		if (blocks.length !== 1 || !blocks[0][1].startsWith(RESUME_POINT_MARKER))
			throw new Error(`${TEMPLATE_PATH}: missing or invalid template block`);
		content = blocks[0][1];
	}
	const targetDirectory = directory ?? path.posix.dirname(oldHandoff);
	const directoryDetails = await repositoryPath(
		repositoryRoot,
		targetDirectory,
		{ allowMissing: true },
	);
	if (directoryDetails.exists && !directoryDetails.isDirectory)
		throw new Error(`--dir must target a directory: ${targetDirectory}`);
	const timestamp = localTimestamp(now);
	const newPath = path.posix.join(
		directoryDetails.normalized,
		`${timestamp.filename}-${milestoneId}-${slug}.md`,
	);
	const newDetails = await repositoryPath(repositoryRoot, newPath, {
		allowMissing: true,
	});
	if (newDetails.exists)
		throw new Error(`Refusing to overwrite resume point: ${newPath}`);
	const branch = git(repositoryRoot, [
		"symbolic-ref",
		"--quiet",
		"--short",
		"HEAD",
	]);
	const head = git(repositoryRoot, ["rev-parse", "--short", "HEAD"]);
	content = content.replaceAll("<milestone-id>", milestoneId);
	content = replaceHeader(
		content,
		"As of",
		`\`${branch}\` at \`${head}\`, ${timestamp.label}`,
	);
	content = replaceHeader(
		content,
		"Previous resume point",
		`\`${oldHandoff}\` (history; open it only where a pointer below names a section)`,
	);
	const newPacket = replaceYamlScalars(
		packetText,
		[[["continuity", "currentHandoff"], newPath]],
		milestone.taskPacket,
	);
	const packetHash = createHash("sha256").update(newPacket).digest("hex");
	const newState = replaceYamlScalars(
		stateText,
		[
			[["milestones", milestoneId, "handoff"], newPath],
			[["milestones", milestoneId, "taskPacketSha256"], packetHash],
			[["milestones", milestoneId, "lastHeartbeatAt"], timestamp.iso],
			[
				["milestones", milestoneId, "leaseExpiresAt"],
				localTimestamp(expiry).iso,
			],
			[["updatedAt"], timestamp.iso],
		],
		STATE_PATH,
	);
	// Detect a coordinator update during preparation rather than overwriting it.
	if (
		(await readFile(stateDetails.absolute, "utf8")) !== stateText ||
		(await readFile(packetDetails.absolute, "utf8")) !== packetText
	)
		throw new Error(
			"State or packet changed while preparing the resume point; retry from the current state",
		);
	const absoluteNewPath = path.resolve(repositoryRoot, newPath);
	await mkdir(path.dirname(absoluteNewPath), { recursive: true });
	await writeFileImpl(absoluteNewPath, content, { flag: "wx" });
	try {
		await writeFileImpl(packetDetails.absolute, newPacket);
		await writeFileImpl(stateDetails.absolute, newState);
	} catch (error) {
		const restore = async (absolute, original) => {
			if ((await readFile(absolute, "utf8")) !== original)
				await writeFileImpl(absolute, original);
		};
		const rollback = await Promise.allSettled([
			restore(packetDetails.absolute, packetText),
			restore(stateDetails.absolute, stateText),
		]);
		const rollbackErrors = rollback
			.filter((result) => result.status === "rejected")
			.map((result) => result.reason);
		if (rollbackErrors.length)
			throw new AggregateError(
				[error, ...rollbackErrors],
				`Resume point update and rollback failed; inspect ledger and packet. File retained: ${newPath}`,
			);
		try {
			await unlink(absoluteNewPath);
		} catch (cleanupError) {
			throw new AggregateError(
				[error, cleanupError],
				`Resume point update failed; original pointers restored but cleanup failed: ${newPath}`,
			);
		}
		throw error;
	}
	const lines = [
		`Created resume point: ${newPath}`,
		`Next actions: fill every section; git add "${newPath}"; run pnpm check:repository; commit; push.`,
	];
	const warning = behindUpstreamWarning(repositoryRoot, git);
	if (warning) lines.push(warning);
	return { newPath, output: lines.join("\n") };
}

if (
	process.argv[1] &&
	fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
	try {
		const options = parseHandoffArgs(process.argv.slice(2));
		if (options.help)
			console.log(
				"Usage: pnpm handoff:new [--] --milestone <id> --slug <run-id> [--dir <repo-relative dir>] [--lease-hours <n>] [--now <ISO-8601>]",
			);
		else console.log((await createResumePoint(options)).output);
	} catch (error) {
		console.error(
			`handoff:new FAILED: ${error instanceof Error ? error.message : String(error)}`,
		);
		process.exitCode = 1;
	}
}
