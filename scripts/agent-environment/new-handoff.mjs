import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { isScalar, parseDocument } from "yaml";
import { buildAgentContextPlan } from "../show-agent-context.mjs";
import { behindUpstreamWarning, readGit } from "./git-context.mjs";
import { samePath } from "./path-identity.mjs";
import {
	RESUME_POINT_MARKER,
	repositoryPath,
	resumePointFilename,
} from "./resume-point.mjs";

const STATE_PATH = "PROJECT_STATE.yaml";
const TEMPLATE_PATH = "docs/agent-context/HANDOFF_TEMPLATE.md";
const ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

export function parseHandoffArgs(inputArgs) {
	const args = inputArgs[0] === "--" ? inputArgs.slice(1) : inputArgs;
	const options = {};
	const names = new Map([
		["--milestone", "milestoneId"],
		["--dir", "directory"],
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
	const offset = -now.getTimezoneOffset();
	const zone = `${offset >= 0 ? "+" : "-"}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`;
	return {
		label: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())} ${zone}`,
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
	directory,
	now: nowValue,
	git = readGit,
	writeFileImpl = writeFile,
}) {
	if (!ID_PATTERN.test(milestoneId ?? ""))
		throw new Error("--milestone requires a lowercase milestone id");
	const now = parseNow(nowValue);
	const stateDetails = await repositoryPath(repositoryRoot, STATE_PATH);
	const stateText = await readFile(stateDetails.absolute, "utf8");
	const state = yamlDocument(stateText, STATE_PATH).toJS();
	const milestone = state.milestones?.[milestoneId];
	if (!milestone) throw new Error(`Unknown active milestone: ${milestoneId}`);
	if (!milestone.taskPacket)
		throw new Error(`${milestoneId}: a registered task packet is required`);
	// Validate the active packet identity and lifecycle before writing.
	await buildAgentContextPlan({ repositoryRoot, milestoneId });
	const handoffDetails = await repositoryPath(
		repositoryRoot,
		milestone.handoff,
	);
	const oldHandoff = handoffDetails.normalized;
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
		resumePointFilename(milestoneId),
	);
	const newDetails = await repositoryPath(repositoryRoot, newPath, {
		allowMissing: true,
	});
	if (newDetails.isDirectory)
		throw new Error(`Resume point must be a file: ${newPath}`);
	const original = newDetails.exists
		? await readFile(newDetails.absolute, "utf8")
		: null;
	let content = original;
	if (content === null) {
		const templateDetails = await repositoryPath(repositoryRoot, TEMPLATE_PATH);
		const template = await readFile(templateDetails.absolute, "utf8");
		const blocks = [
			...template.matchAll(
				/<!-- template:start -->\r?\n([\s\S]*?)<!-- template:end -->/g,
			),
		];
		if (blocks.length !== 1 || !blocks[0][1].startsWith(RESUME_POINT_MARKER))
			throw new Error(`${TEMPLATE_PATH}: missing or invalid template block`);
		content = blocks[0][1].replaceAll("<milestone-id>", milestoneId);
	}
	let branch;
	try {
		branch = git(repositoryRoot, [
			"symbolic-ref",
			"--quiet",
			"--short",
			"HEAD",
		]);
	} catch (error) {
		if (error.status !== 1) throw error;
	}
	if (!branch)
		throw new Error(
			"A branch must be checked out before creating a resume point.",
		);
	const head = git(repositoryRoot, ["rev-parse", "--short", "HEAD"]);
	content = replaceHeader(
		content,
		"As of",
		`\`${branch}\` at \`${head}\`, ${timestamp.label}`,
	);
	const newState = replaceYamlScalars(
		stateText,
		[[["milestones", milestoneId, "handoff"], newPath]],
		STATE_PATH,
	);
	// Avoid overwriting concurrent coordinator edits.
	if (
		(await readFile(stateDetails.absolute, "utf8")) !== stateText ||
		(original !== null &&
			(await readFile(newDetails.absolute, "utf8")) !== original)
	) {
		throw new Error(
			"State or resume point changed while preparing the update; retry from the current state",
		);
	}
	const absoluteNewPath =
		newDetails.absolute ?? path.resolve(repositoryRoot, newPath);
	await mkdir(path.dirname(absoluteNewPath), { recursive: true });
	try {
		await writeFileImpl(
			absoluteNewPath,
			content,
			original === null ? { flag: "wx" } : undefined,
		);
	} catch (error) {
		// A failed exclusive create must never remove somebody else's file.
		if (original !== null) await writeFileImpl(absoluteNewPath, original);
		throw error;
	}
	try {
		if (newState !== stateText)
			await writeFileImpl(stateDetails.absolute, newState);
	} catch (error) {
		const restoreState = async () => {
			if ((await readFile(stateDetails.absolute, "utf8")) !== stateText)
				await writeFileImpl(stateDetails.absolute, stateText);
		};
		const rollback = await Promise.allSettled([
			restoreState(),
			original === null
				? unlink(absoluteNewPath)
				: writeFileImpl(absoluteNewPath, original),
		]);
		const failures = rollback
			.filter((result) => result.status === "rejected")
			.map((result) => result.reason);
		if (failures.length)
			throw new AggregateError(
				[error, ...failures],
				`Resume point update and rollback failed; inspect ledger and ${newPath}`,
			);
		throw error;
	}
	const lines = [
		`${original === null ? "Created" : "Updated"} resume point: ${newPath}`,
		`Next actions: fill every section; git add "${newPath}"; run pnpm check:repository; commit; push.`,
	];
	const warning = behindUpstreamWarning(repositoryRoot, git);
	if (warning) lines.push(warning);
	return { newPath, output: lines.join("\n") };
}

if (
	process.argv[1] &&
	(await samePath(fileURLToPath(import.meta.url), process.argv[1]))
) {
	try {
		const options = parseHandoffArgs(process.argv.slice(2));
		if (options.help)
			console.log(
				"Usage: pnpm handoff:new [--] --milestone <milestone-id> [--dir <repo-relative dir>] [--now <ISO-8601>] (writes <milestone-id>-resume.md)",
			);
		else console.log((await createResumePoint(options)).output);
	} catch (error) {
		console.error(
			`handoff:new FAILED: ${error instanceof Error ? error.message : String(error)}`,
		);
		process.exitCode = 1;
	}
}
