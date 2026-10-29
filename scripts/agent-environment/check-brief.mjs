// Check a Codex brief's format, scope, references, worktree, and review sources.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { validateReferences, validateWorktree } from "./brief-checks.mjs";
import { parseBriefFormat } from "./brief-format.mjs";
import {
	codexScopeProblem,
	ENVIRONMENT_PATH,
	mask,
	sectionIds,
	withoutCode,
	withoutComments,
} from "./brief-markdown.mjs";
import { environmentBlock } from "./brief-references.mjs";
import { validateReviewSources } from "./brief-review-sources.mjs";
import { readGit } from "./git-context.mjs";
import { lineAt, lines } from "./markdown-lines.mjs";
import { samePath } from "./path-identity.mjs";
import { beginToolCommand, resolveToolArguments } from "./tool-contract.mjs";

export function parseBriefArgs(inputArgs) {
	const parsed = Array.isArray(inputArgs)
		? resolveToolArguments("brief:check", inputArgs, {
				validate: false,
			})
		: inputArgs;
	if (parsed.positionals.length !== 1)
		throw new Error("A brief path is required");
	if (parsed.counts.fillEnvironment > 1)
		throw new Error("Duplicate argument: --fill-environment");
	return {
		briefPath: parsed.positionals[0],
		fillEnvironment: parsed.options.fillEnvironment === true,
	};
}

export async function checkBrief({
	repositoryRoot,
	briefPath,
	fillEnvironment = false,
	git = readGit,
}) {
	const absoluteBrief = path.resolve(repositoryRoot, briefPath);
	let text = await readFile(absoluteBrief, "utf8");
	const problems = [];
	const report = (rule, line, message, severity = "FAIL") =>
		problems.push({
			rule,
			line,
			message: message.replace(/[\r\n]+/g, " "),
			severity,
		});
	const canonical = await readFile(
		path.resolve(repositoryRoot, ENVIRONMENT_PATH),
		"utf8",
	);
	const canonicalBlock = environmentBlock(canonical);
	if (
		!canonicalBlock ||
		canonical.trimEnd() !==
			canonical.slice(canonicalBlock.start, canonicalBlock.end)
	)
		throw new Error(`Invalid shared environment source: ${ENVIRONMENT_PATH}`);
	let block = environmentBlock(text);
	let filled = false;
	if (fillEnvironment && block && !block.inner.trim()) {
		const eol = text.match(/\r?\n/)?.[0] ?? "\n";
		text =
			text.slice(0, block.innerStart) +
			canonicalBlock.inner.replace(/\r?\n/g, eol) +
			text.slice(block.innerEnd);
		await writeFile(absoluteBrief, text, "utf8");
		block = environmentBlock(text);
		filled = true;
	}
	const format = parseBriefFormat(text);
	const role = format.role;
	if (format.problem) report("brief-format", 1, format.problem);
	if (!block)
		report(
			"brief-format",
			1,
			"requires one ordered pair of environment:start v1 and environment:end markers",
		);
	else if (
		block.inner.replace(/\r\n/g, "\n") !==
		canonicalBlock.inner.replace(/\r\n/g, "\n")
	)
		report(
			"brief-format",
			lineAt(text, block.start),
			`environment block differs from ${ENVIRONMENT_PATH}${fillEnvironment ? "; --fill-environment only fills empty markers" : ""}`,
		);

	let prose = text;
	if (block)
		prose =
			prose.slice(0, block.start) +
			mask(prose.slice(block.start, block.end)) +
			prose.slice(block.end);
	const scopeProse = prose;
	prose = withoutComments(prose);
	prose = withoutCode(prose);
	for (const checklist of prose.matchAll(
		/^## Coordinator checklist(?:\s.*)?\r?$/gim,
	))
		report(
			"brief-readiness",
			lineAt(text, checklist.index),
			"remove the Coordinator checklist section before launch",
		);
	for (const placeholder of prose.matchAll(/<[^<>\r\n]+>/g))
		report(
			"brief-readiness",
			lineAt(text, placeholder.index),
			`unfilled placeholder: ${text.slice(placeholder.index, placeholder.index + placeholder[0].length)}`,
		);
	if (role === "codex")
		for (const forbidden of text.matchAll(/fitway-grader|held-out/gi))
			report(
				"brief-readiness",
				lineAt(text, forbidden.index),
				`codex brief mentions forbidden text: ${forbidden[0]}`,
			);
	const lineCount = lines(text);
	if (role === "codex") {
		const scopeProblem = codexScopeProblem(scopeProse);
		if (scopeProblem)
			report("brief-scope", scopeProblem.line, scopeProblem.message);
	}
	const outcomeIds = sectionIds(prose, [
		"Causes and required outcomes",
		"Causes and outcomes",
	]);
	const limitIds = sectionIds(prose, ["Limits", "Limits the result keeps"]);
	const validatedWorktree = await validateWorktree(text, report, git);
	const worktree = validatedWorktree?.root ?? null;
	const namedHead = validatedWorktree?.head ?? null;
	const requiredChanges = worktree
		? await validateReferences(
				text,
				worktree,
				namedHead,
				repositoryRoot,
				report,
				git,
			)
		: [];
	if (role === "codex" && worktree && namedHead)
		await validateReviewSources(text, {
			worktree,
			head: namedHead,
			repositoryRoot,
			report,
		});
	problems.sort((a, b) => a.line - b.line || a.rule.localeCompare(b.rule));
	return {
		briefPath: absoluteBrief,
		role,
		delivers: format.delivers ?? null,
		worktree,
		requiredChanges,
		lineCount,
		outcomeIds,
		limitIds,
		filled,
		problems,
		ok: !problems.some((problem) => problem.severity === "FAIL"),
	};
}

export function formatBriefResult(result) {
	const output = result.problems.map(
		(problem) =>
			`${result.briefPath}:${problem.line}: ${problem.severity} ${problem.rule}: ${problem.message}`,
	);
	output.push(
		`${result.briefPath}:1: INFO brief-ids: ${result.outcomeIds} outcome IDs, ${result.limitIds} limit IDs`,
	);
	if (result.filled)
		output.push(`${result.briefPath}:1: filled shared environment block`);
	if (result.ok)
		output.push(
			`${result.briefPath}:1: PASS brief:check (${result.role}, ${result.lineCount} lines)`,
		);
	return output.join("\n");
}

if (
	process.argv[1] &&
	(await samePath(fileURLToPath(import.meta.url), process.argv[1]))
) {
	try {
		const parsed = beginToolCommand("brief:check", process.argv.slice(2));
		const options = parseBriefArgs(parsed);
		const repositoryRoot = readGit(process.cwd(), [
			"rev-parse",
			"--show-toplevel",
		]);
		const result = await checkBrief({
			...options,
			briefPath: path.resolve(process.cwd(), options.briefPath),
			repositoryRoot,
		});
		console.log(formatBriefResult(result));
		process.exitCode = result.ok ? 0 : 1;
	} catch (error) {
		console.error(
			`brief:check:1: FAIL: ${error.message.replace(/[\r\n]+/g, " ")}`,
		);
		process.exitCode = 1;
	}
}
