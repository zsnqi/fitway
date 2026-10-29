// Brief worktree and cited-source validation.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { codeSpans, headings, withoutComments } from "./brief-markdown.mjs";
import {
	citedDecisionItems,
	citedRows,
	reportMissingDecisionItems,
	reportMissingRows,
	rowContent,
} from "./brief-references.mjs";
import { lineAt, lines } from "./markdown-lines.mjs";
import { pathKey, samePath } from "./path-identity.mjs";
import {
	createPathReferenceResolver,
	exists,
	referenceTarget,
} from "./path-reference.mjs";

async function validateWorktree(text, report, git) {
	const source = withoutComments(text);
	const headers = [...source.matchAll(/^- \*\*Worktree:\*\*[^\r\n]*$/gm)];
	const header = headers[0];
	const line = header ? lineAt(text, header.index) : 1;
	const fields = header?.[0].match(
		/^- \*\*Worktree:\*\* `([^`]+)`, branch `([^`]+)`, HEAD `([^`]+)`\s*$/,
	);
	if (headers.length !== 1 || !fields || /<[^>]*>/.test(fields[0])) {
		report(
			"brief-references",
			line,
			"requires one filled Worktree line with path, branch and HEAD",
		);
		return null;
	}
	const [, worktree, branch, head] = fields;
	if (!path.isAbsolute(worktree) || !(await exists(worktree))?.isDirectory()) {
		report(
			"brief-references",
			line,
			`worktree does not exist or is not absolute: ${worktree}`,
		);
		return null;
	}
	try {
		const root = git(worktree, ["rev-parse", "--show-toplevel"]);
		if (!(await samePath(root, worktree))) {
			report(
				"brief-references",
				line,
				`named worktree is not a Git worktree root: ${worktree}`,
			);
			return null;
		}
		let currentBranch;
		try {
			currentBranch = git(worktree, [
				"symbolic-ref",
				"--quiet",
				"--short",
				"HEAD",
			]);
		} catch {
			currentBranch = "<detached HEAD>";
		}
		if (currentBranch !== branch)
			report(
				"brief-references",
				line,
				`branch mismatch in ${worktree}: expected ${branch}, found ${currentBranch}`,
			);
		if (!/^[a-f\d]{4,40}$/i.test(head)) {
			report("brief-references", line, `HEAD must be a commit hash: ${head}`);
			return { root: worktree, head: null };
		}
		let namedHead;
		try {
			namedHead = git(worktree, ["rev-parse", "--verify", `${head}^{commit}`]);
			git(worktree, ["merge-base", "--is-ancestor", namedHead, "HEAD"]);
		} catch {
			report(
				"brief-references",
				line,
				`named HEAD ${head} is missing or is not an ancestor of HEAD in ${worktree}`,
			);
			return { root: worktree, head: null };
		}
		// Check each intervening commit: a non-Markdown edit followed by a revert still fails.
		const later = git(worktree, ["rev-list", `${namedHead}..HEAD`]);
		for (const commit of later.split("\n").filter(Boolean)) {
			const changed = git(worktree, [
				"diff-tree",
				"--no-commit-id",
				"--name-only",
				"--no-renames",
				"-r",
				"-m",
				"-z",
				commit,
			])
				.split("\0")
				.filter(Boolean);
			const nonMarkdown = changed.filter(
				(file) => !/\.(?:md|markdown)$/i.test(file),
			);
			if (nonMarkdown.length)
				report(
					"brief-references",
					line,
					`commit ${commit} after named HEAD ${head} changes non-Markdown paths: ${nonMarkdown.join(", ")}`,
				);
		}
		return { root: worktree, head: namedHead };
	} catch (error) {
		report(
			"brief-references",
			line,
			`cannot inspect worktree ${worktree}: ${error.message}`,
		);
		return null;
	}
}

async function validateReferences(
	text,
	worktree,
	namedHead,
	repositoryRoot,
	report,
	git,
) {
	const source = withoutComments(text);
	const resolver = createPathReferenceResolver(worktree, git);
	const references = [];
	const requiredChanges = [];
	for (const span of codeSpans(source)) {
		const line = lineAt(text, span.index);
		const tail = source.slice(span.index + span[0].length);
		const after = tail.match(/^\s*§"([^"]+)"/);
		// Markdown reads a line break inside a code span as a space.
		const split = /[\r\n]/.test(span[2]);
		const value = span[2].replace(/(?:\r\n|[\r\n])[ \t]*/g, " ");
		// The explicit marker opts even bare and machine-local paths into checking.
		if (/^ \(must change\)(?=\s|[.,;:]|$)/.test(tail)) {
			const absolute = path.resolve(worktree, value.replaceAll("\\", "/"));
			const details = await exists(absolute);
			if (!details)
				report(
					"brief-references",
					line,
					`must change path does not exist: ${absolute}`,
				);
			else if (!details.isFile() && !details.isDirectory())
				report(
					"brief-references",
					line,
					`must change path must be a file or folder: ${absolute}`,
				);
			else
				requiredChanges.push({
					path: value,
					absolute,
					line,
					outcome: text.split(/\r?\n/)[line - 1],
				});
			continue;
		}
		const decisionItems = citedDecisionItems(tail);
		const rowIds = citedRows(tail);
		const reference = await resolver.reference(value);
		if (!reference) {
			if ((decisionItems.length || rowIds.length) && path.isAbsolute(value)) {
				const absolute = path.resolve(value);
				const details = await exists(absolute);
				if (details?.isFile()) {
					if (rowIds.length)
						reportMissingRows(
							await rowContent({
								worktree,
								head: namedHead,
								absolute,
								fallback: () => readFile(absolute, "utf8"),
								git,
							}),
							rowIds,
							value,
							absolute,
							namedHead,
							line,
							report,
						);
					reportMissingDecisionItems(
						await readFile(absolute, "utf8"),
						decisionItems,
						value,
						absolute,
						worktree,
						line,
						report,
					);
				} else if (rowIds.length)
					report(
						"brief-references",
						line,
						`missing row file ${value} at HEAD ${namedHead}`,
					);
			}
			continue;
		}
		references.push({
			...reference,
			split,
			lineNumber: line,
			heading: reference.heading ?? after?.[1],
			decisionItems,
			rowIds,
			isNew: /^[ \t]+\(new\)(?=\s|[.,;:]|$)/.test(tail),
		});
	}
	const newPaths = new Set(
		await Promise.all(
			references
				.filter((reference) => reference.isNew)
				.map((reference) => pathKey(path.resolve(worktree, reference.file))),
		),
	);
	for (const reference of references) {
		const { lineNumber: line, heading } = reference;
		const { wildcard, file: checkedPath } = referenceTarget(reference.file);
		const absolute = path.resolve(worktree, checkedPath);
		const details = await exists(absolute);
		if (reference.isNew) {
			if (details)
				report(
					"brief-references",
					line,
					`new path already exists: ${absolute}`,
				);
			const parent = path.dirname(absolute);
			const parentDetails = await exists(parent);
			if (
				parentDetails
					? !parentDetails.isDirectory()
					: !newPaths.has(await pathKey(parent))
			)
				report(
					"brief-references",
					line,
					`parent folder must exist or be declared (new): ${parent}`,
				);
			continue;
		}
		if (!details) {
			const inCommandRepository = path.resolve(repositoryRoot, reference.file);
			const hint = `${reference.split ? "; this code span breaks across lines, which Markdown reads as a space" : ""}${resolver.missingPathHint(reference.file)}`;
			if (
				!path.isAbsolute(reference.file) &&
				(await exists(inCommandRepository))
			)
				report(
					"brief-references",
					line,
					`drift: missing ${absolute} in worktree ${worktree}; present at ${inCommandRepository} in command repository ${repositoryRoot}${hint}`,
				);
			else
				report(
					"brief-references",
					line,
					`missing path in ${worktree}: ${absolute}${hint}`,
				);
			continue;
		}
		if (wildcard && !details.isDirectory()) {
			report(
				"brief-references",
				line,
				`glob folder is not a directory: ${absolute}`,
			);
			continue;
		}
		if (
			!heading &&
			reference.line === null &&
			!reference.decisionItems.length &&
			!reference.rowIds.length
		)
			continue;
		if (!details.isFile()) {
			report(
				"brief-references",
				line,
				`heading or line selector requires a file: ${absolute}`,
			);
			continue;
		}
		const content = await readFile(absolute, "utf8");
		const lastLine = reference.endLine ?? reference.line;
		if (
			reference.line !== null &&
			(reference.line < 1 ||
				lastLine < reference.line ||
				lastLine > lines(content))
		)
			report(
				"brief-references",
				line,
				`${reference.file}:${reference.line}${reference.endLine === null ? "" : `-${reference.endLine}`} exceeds file length (${lines(content)} lines), is below line 1, or ends before it starts in ${worktree}`,
			);
		if (heading && !headings(content).some(({ title }) => title === heading))
			report(
				"brief-references",
				line,
				`missing heading §"${heading}" in ${absolute}`,
			);
		if (reference.decisionItems.length) {
			reportMissingDecisionItems(
				content,
				reference.decisionItems,
				reference.file,
				absolute,
				worktree,
				line,
				report,
			);
		}
		if (reference.rowIds.length) {
			reportMissingRows(
				await rowContent({
					worktree,
					head: namedHead,
					absolute,
					fallback: () => readFile(absolute, "utf8"),
					git,
				}),
				reference.rowIds,
				reference.file,
				absolute,
				namedHead,
				line,
				report,
			);
		}
	}
	return requiredChanges;
}

export { validateReferences, validateWorktree };
