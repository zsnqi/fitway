import path from "node:path";
import ts from "typescript";

export const MIN_FOLDER_AGE_DAYS = 7;
export const TRUNK_REF = "origin/main";

export function localDate(date = new Date()) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function key(value) {
	return value.replaceAll("\\", "/").replace(/\/+$/, "").toLowerCase();
}

export function inside(parent, child) {
	return key(child) === key(parent) || key(child).startsWith(`${key(parent)}/`);
}

export function deletionTarget(candidate, base) {
	const style = /^[a-z]:[\\/]|^\\\\/i.test(candidate) ? path.win32 : path.posix;
	if (!style.isAbsolute(candidate) || !style.isAbsolute(base))
		throw new Error(`Unsafe deletion path: ${candidate}`);
	const resolved = style.resolve(candidate);
	if (
		(style === path.win32
			? key(style.dirname(resolved)) !== key(base)
			: style.dirname(resolved) !== style.resolve(base)) ||
		!inside(base, resolved) ||
		/[&|<>^%!"\r\n]/.test(resolved)
	)
		throw new Error(`Unsafe deletion path: ${candidate}`);
	return style === path.win32 ? style.toNamespacedPath(resolved) : resolved;
}

function escapeRegex(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Proposals in this explicit rolling-report section are not evidence citations.
export function referenceText(record) {
	if (
		record.kind !== "gardener" &&
		record.source !== ".agents/skills/gardener/REPORT.md"
	)
		return record.text;
	return record.text.replace(
		/^## Folder removal proposals\r?\n[\s\S]*?(?=^## |$(?![\s\S]))/gm,
		(section) => section.replace(/[^\r\n]/g, " "),
	);
}

export function references(value, records, { branch = false, tempRoot } = {}) {
	const normalized = key(value);
	const aliases = branch
		? [
				normalized,
				normalized.replace(/^(?:(?:refs\/)?remotes\/[^/]+|origin)\//, ""),
			]
		: [];
	return records.flatMap((record) => {
		const lines = referenceText(record).replaceAll("\\", "/").split(/\r?\n/);
		return lines.flatMap((line, index) => {
			const text = line
				.toLowerCase()
				.replace(/(^|[^a-z0-9_./:-])(fitway-temp\/)/g, "$1d:/$2");
			const named = aliases.some((alias) =>
				new RegExp(
					`(^|[^a-z0-9_.:/-])${escapeRegex(alias)}(?=$|[^a-z0-9_.-])`,
				).test(text),
			);
			// Only path citations protect folders, never a matching prose word.
			// A pointer to an ancestor or to evidence below a folder protects it.
			const cited =
				!branch &&
				[
					...text.matchAll(
						/(?:[a-z]:\/|\/)[^\s`"'<>),;]+|[`"'<]((?:[a-z]:\/|\/)[^`"'<>\r\n]+)[`"'>]/g,
					),
				].some((match) => {
					const raw = match[1] ?? match[0];
					// Ambiguous sentence punctuation must also protect a folder
					// whose real name ends in a dot; quoted spelling stays exact.
					const targets = match[1] ? [raw] : [raw, raw.replace(/[.:*]+$/, "")];
					return targets.some((value) => {
						const target = value
							.replace(/:\d+(?:-\d+)?$/, "")
							.replace(/^\/([a-z])\//, "$1:/");
						return (
							text[match.index + match[0].length] !== "<" &&
							!/[<*?]/.test(target) &&
							key(target) !== key(tempRoot ?? "D:/fitway-temp") &&
							key(target) !== key("D:/fitway-temp") &&
							(inside(target, normalized) || inside(normalized, target))
						);
					});
				});
			return named || cited
				? [{ source: record.source, line: index + 1, text: line.trim() }]
				: [];
		});
	});
}

export function classifyBranches(branches, records, worktrees) {
	return branches.map((branch) => {
		const protectedBy = references(branch.name, records, { branch: true });
		if (branch.remote && branch.plain !== branch.name)
			protectedBy.push(...references(branch.plain, records, { branch: true }));
		const registered = worktrees.filter(
			(worktree) => worktree.branch === branch.ref,
		);
		return {
			...branch,
			protectedBy,
			worktrees: registered.map((item) => item.path),
			candidate:
				branch.merged &&
				!branch.symbolic &&
				branch.plain !== "main" &&
				!protectedBy.length &&
				!registered.length,
		};
	});
}

export function classifyWorktrees(worktrees, records, current) {
	return worktrees.map((worktree) => {
		const protectedBy = [
			...references(worktree.path, records),
			...references(
				worktree.branch?.replace(/^refs\/heads\//, "") ?? "<detached>",
				records,
				{ branch: true },
			),
		];
		const statusMeasured = typeof worktree.status === "string";
		const clean = statusMeasured ? worktree.status === "" : null;
		const ageDays = (Date.now() - Date.parse(worktree.lastCommitAt)) / 86400000;
		const self =
			key(worktree.path) === key(current) ||
			key(worktree.path) === "d:/projects/fitway-worktrees/gardener" ||
			worktree.branch?.startsWith("refs/heads/gardener/");
		return {
			...worktree,
			status: worktree.status ?? null,
			statusMeasured,
			statusReason: statusMeasured
				? null
				: (worktree.statusReason ??
					(worktree.exists === false
						? "Registration path is missing"
						: "Status was not measured")),
			clean,
			self,
			coordinatorReview:
				worktree.exists &&
				worktree.merged === false &&
				!self &&
				!protectedBy.length &&
				ageDays >= MIN_FOLDER_AGE_DAYS,
			protectedBy,
			missing: worktree.exists === false,
			mergedClean: worktree.exists && worktree.merged && clean,
			candidate:
				worktree.exists &&
				worktree.merged &&
				clean &&
				!worktree.locked &&
				!protectedBy.length &&
				!self &&
				worktree.branch !== "refs/heads/main",
		};
	});
}

export function classifyFolders(folders, records, worktrees, tempRoot, now) {
	return folders.map((folder) => {
		const protectedBy = references(folder.path, records, { tempRoot });
		const ageDays = (now - Date.parse(folder.modifiedAt)) / 86400000;
		const containedWorktrees = worktrees.filter((worktree) =>
			inside(folder.path, worktree.path),
		);
		const unsafeWorktrees = containedWorktrees.filter(
			(worktree) => !worktree.candidate,
		);
		const unknownGitRoots = (folder.gitRoots ?? []).filter(
			(gitRoot) =>
				!containedWorktrees.some(
					(worktree) => key(worktree.path) === key(gitRoot),
				),
		);
		let deletionPathSafe = true;
		try {
			deletionTarget(folder.path, tempRoot);
		} catch {
			deletionPathSafe = false;
		}
		const safe =
			deletionPathSafe &&
			key(path.dirname(folder.path)) === key(tempRoot) &&
			!folder.link &&
			!(folder.skippedLinks > 0) &&
			!folder.errors.length;
		return {
			...folder,
			ageDays: Number.isFinite(ageDays) ? Math.max(0, ageDays) : null,
			minimumAgeDays: MIN_FOLDER_AGE_DAYS,
			deletionPathSafe,
			protectedBy,
			worktrees: containedWorktrees.map((worktree) => worktree.path),
			unknownGitRoots,
			candidate:
				safe &&
				ageDays >= MIN_FOLDER_AGE_DAYS &&
				!protectedBy.length &&
				!unsafeWorktrees.length &&
				!unknownGitRoots.length,
		};
	});
}

export function duplicateRules(records) {
	const occurrences = new Map();
	for (const record of records) {
		for (const [index, line] of record.text.split(/\r?\n/).entries()) {
			const text = line.trim().replace(/\s+/g, " ");
			if (text.length < 40) continue;
			const entries = occurrences.get(text) ?? [];
			entries.push({ source: record.source, line: index + 1 });
			occurrences.set(text, entries);
		}
	}
	return [...occurrences]
		.filter(
			([, entries]) => new Set(entries.map((entry) => entry.source)).size > 1,
		)
		.map(([text, locations]) => ({ text, locations }))
		.sort((a, b) => a.text.localeCompare(b.text));
}

export function pathMentions(text) {
	const mentions = [];
	for (const [index, line] of text.split(/\r?\n/).entries()) {
		for (const match of line.matchAll(
			/(?:[A-Za-z]:[\\/])?(?:\.?[A-Za-z0-9_.-]+[\\/])+[A-Za-z0-9_.*/?-]*|\b[A-Z][A-Z0-9_-]+\.md\b/g,
		)) {
			const value = match[0].replaceAll("\\", "/").replace(/\/$/, "");
			const looksLikePath =
				/^[a-z]:\//i.test(value) ||
				/\.[a-z0-9]{1,12}$/i.test(value) ||
				/^(?:\.?\/|docs\/|scripts\/|tests\/|apps\/|packages\/|edge\/|\.[a-z]+\/|design-research\/|visual-direction-gate\/)/.test(
					value,
				) ||
				line[match.index - 1] === "`";
			if (
				!looksLikePath ||
				line.lastIndexOf("<", match.index) >
					line.lastIndexOf(">", match.index) ||
				line[match.index + match[0].length] === "<" ||
				/https?:\/\//.test(
					line.slice(Math.max(0, match.index - 8), match.index + 8),
				) ||
				!value
			)
				continue;
			mentions.push({ path: value, line: index + 1, text: line.trim() });
		}
	}
	return mentions;
}

export function deadPaths(records, exists, branches = [], knownPaths = []) {
	const branchNames = new Set(
		branches.flatMap((branch) => [branch.name, branch.plain, branch.ref]),
	);
	return records.flatMap((record) =>
		pathMentions(record.text).flatMap((mention) => {
			if (branchNames.has(mention.path)) return [];
			if (
				!mention.path.includes("/") &&
				knownPaths.some(
					(file) => file === mention.path || file.endsWith(`/${mention.path}`),
				)
			)
				return [];
			const target = mention.path.split(/[*?]/, 1)[0].replace(/\/$/, "") || ".";
			return exists(target)
				? []
				: [{ source: record.source, ...mention, checked: target }];
		}),
	);
}

export function parseWorktreePorcelain(text) {
	return text
		.split(/\r?\n\r?\n/)
		.filter(Boolean)
		.map((block) => {
			const result = {};
			for (const line of block.split(/\r?\n/)) {
				const space = line.indexOf(" ");
				const field = space < 0 ? line : line.slice(0, space);
				const value = space < 0 ? true : line.slice(space + 1);
				result[field === "worktree" ? "path" : field] = value;
			}
			return result;
		});
}

export function parseFastSteps(source) {
	const ast = ts.createSourceFile(
		"verify.mjs",
		source,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.JS,
	);
	const fn = ast.statements.find(
		(node) => ts.isFunctionDeclaration(node) && node.name?.text === "fastSteps",
	);
	const statement = fn?.body?.statements.find(ts.isReturnStatement);
	function literal(node) {
		if (ts.isStringLiteral(node)) return node.text;
		if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
		throw new Error(
			"fastSteps contains a non-literal step; cannot establish gate coverage",
		);
	}
	if (!statement?.expression)
		throw new Error("fastSteps return array is missing");
	return literal(statement.expression);
}

export function calledImports(source) {
	const ast = ts.createSourceFile(
		"check.mjs",
		source,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.JS,
	);
	const names = new Set();
	function visit(node) {
		if (ts.isCallExpression(node) && ts.isIdentifier(node.expression))
			names.add(node.expression.text);
		ts.forEachChild(node, visit);
	}
	visit(ast);
	return ast.statements.filter(ts.isImportDeclaration).flatMap((node) => {
		const bindings = node.importClause?.namedBindings;
		return bindings &&
			ts.isNamedImports(bindings) &&
			bindings.elements.some((item) => names.has(item.name.text))
			? [node.moduleSpecifier.text]
			: [];
	});
}

export function gateGaps(scripts, steps, calls = {}) {
	const executions = new Map();
	const missing = [];
	function expand(command, trail, seen = new Set()) {
		if (seen.has(command))
			throw new Error(`Check invocation cycle: ${command}`);
		const next = new Set([...seen, command]);
		const list = executions.get(command) ?? [];
		list.push(trail);
		executions.set(command, list);
		for (const child of calls[command] ?? [])
			expand(child, [...trail, child], next);
	}
	for (const [label, args] of steps) {
		if (scripts[args[0]]) expand(args[0], [label, args[0]]);
		else {
			const command = args.slice(args[0] === "exec" ? 1 : 0).join(" ");
			const matching = Object.keys(scripts).filter(
				(name) => scripts[name] === command,
			);
			for (const name of matching) expand(name, [label, name]);
		}
	}
	for (const [name, command] of Object.entries(scripts)) {
		if (/(?:^|:)check(?::|-|$)/.test(name) && !executions.has(name))
			missing.push({ name, command });
	}
	return {
		missing,
		duplicates: [...executions]
			.filter(([, trails]) => trails.length > 1)
			.map(([name, trails]) => ({ name, trails })),
	};
}

export function landedBriefSources(briefs, rounds) {
	const landed = new Set();
	for (const heading of rounds
		.split(/\r?\n/)
		.filter((line) => /^## /.test(line))) {
		if (!/\bresults?\s+`[a-f0-9]{7,40}`/i.test(heading)) continue;
		for (const mention of heading.matchAll(/`([^`]+\.md)`/g)) {
			for (const brief of briefs) {
				if (
					brief.source === mention[1] ||
					brief.source.endsWith(`/${mention[1]}`)
				)
					landed.add(brief.source);
			}
		}
	}
	return landed;
}

export function openBriefs(records, briefs, landed = new Set()) {
	const selected = new Map();
	for (const record of records.filter(
		(item) => item.kind === "resume" || item.kind === "ledger",
	)) {
		let section = record.kind === "ledger" ? "ledger" : "";
		let paragraph = "";
		const inspect = (text, line) => {
			if (!text.trim()) return;
			for (const brief of briefs) {
				if (landed.has(brief.source)) continue;
				const explicitlyNamed = text.includes(brief.source);
				if (
					brief.owners &&
					!brief.owners.includes(record.source) &&
					!explicitlyNamed
				)
					continue;
				const round = brief.source.match(/round-(\d+[a-z]?)\.md$/)?.[1];
				const roundNamed =
					round && new RegExp(`\\bround\\s+${round}\\b`, "i").test(text);
				const subject = brief.text
					.match(/^# .*?:\s*(.*?)\s*\(/m)?.[1]
					?.replace(/^(?:a|the)\s+(?:permanent\s+)?/i, "");
				const subjectNamed =
					subject &&
					subject.length >= 6 &&
					text.toLowerCase().includes(subject.toLowerCase()) &&
					/brief|draft/i.test(text);
				if (explicitlyNamed || roundNamed || subjectNamed)
					selected.set(brief.source, {
						...brief,
						namedBy: { source: record.source, line, text: text.trim() },
					});
			}
		};
		const lines = record.text.split(/\r?\n/);
		for (const [index, line] of lines.entries()) {
			if (/^## /.test(line)) {
				inspect(paragraph, index);
				paragraph = "";
				section = line.slice(3).trim().toLowerCase();
			}
			if (!/^(running now|next steps|ledger)$/.test(section)) continue;
			if (/^(?:\d+\. |[-*] )/.test(line)) {
				inspect(paragraph, index);
				paragraph = "";
			}
			paragraph += `${line}\n`;
		}
		inspect(paragraph, lines.length);
	}
	return [...selected.values()].sort((a, b) =>
		a.source.localeCompare(b.source),
	);
}

export function activeBriefPointers(records) {
	return records
		.filter((record) => ["ledger", "resume"].includes(record.kind))
		.flatMap((record) => {
			let active = record.kind === "ledger";
			return record.text.split(/\r?\n/).flatMap((line, index) => {
				if (/^## /.test(line))
					active = /^## (?:Running now|Next steps)\s*$/i.test(line);
				if (!active) return [];
				return pathMentions(line)
					.filter(
						(mention) =>
							mention.path.endsWith(".md") &&
							(/brief/i.test(mention.path) || /brief/i.test(line)),
					)
					.map((mention) => ({
						source: record.source,
						line: index + 1,
						path: mention.path,
					}));
			});
		});
}
