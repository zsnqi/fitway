import { realpath, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beginToolCommand } from "../../../scripts/agent-environment/tool-contract.mjs";
import { collectTrackedCitationRecords } from "./cited-evidence.mjs";
import { inside, key, references } from "./facts.mjs";
import {
	collectGit,
	collectRecords,
	filesystemPath,
	git,
	inspectWorktreeLinks,
	plainPath,
} from "./survey-evidence.mjs";

// Git prints worktrees by their long path; an existing target is looked up by its real path.
async function registeredWorktree(worktrees, target) {
	let lookup = target;
	try {
		lookup = plainPath(await realpath(filesystemPath(target)));
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
	return worktrees.find((item) => key(item.path) === key(lookup));
}

// User-run proposal only. Recheck the target at execution, never trust an old survey.
export async function removeWorktree(checkout, target) {
	if (!path.isAbsolute(checkout) || !path.isAbsolute(target))
		throw new Error("Checkout and worktree must be absolute paths");
	const context = await collectRecords({ checkout });
	const state = await collectGit(context.records, { current: checkout });
	const tree = await registeredWorktree(state.worktrees, target);
	if (!tree) throw new Error(`Unregistered worktree: ${target}`);
	if (!tree.linksSafe)
		throw new Error(
			`unsafe worktree links: ${target}: ${JSON.stringify({ links: tree.links, errors: tree.linkErrors })}`,
		);
	const citationRecords = await collectTrackedCitationRecords({ checkout });
	const ignored = git(
		["ls-files", "--others", "--ignored", "--exclude-standard", "-z"],
		tree.path,
	)
		.split("\0")
		.filter(Boolean);
	for (const file of ignored) {
		const absolute = path.resolve(tree.path, file);
		const citations = references(absolute, citationRecords);
		if (citations.length)
			throw new Error(
				`Ignored evidence would be removed: ${absolute}; cited by ${citations
					.map((citation) => `${citation.source}:${citation.line}`)
					.join(", ")}`,
			);
	}
	if (!tree.candidate)
		throw new Error(`Worktree no longer qualifies for removal: ${target}`);
	// Git for Windows can follow directory links or leave dangling internal links.
	// unlink removes each link itself, never its target, after the whole tree qualifies.
	for (const link of tree.links) {
		if (
			!inside(
				tree.path,
				plainPath(await realpath(filesystemPath(path.dirname(link.path)))),
			)
		)
			throw new Error(`Link parent now aliases outside worktree: ${link.path}`);
		await unlink(filesystemPath(link.path));
	}
	const after = await inspectWorktreeLinks(tree.path);
	if (!after.linksMeasured || after.links.length || after.linkErrors.length)
		throw new Error(`Worktree links changed before removal: ${tree.path}`);
	// A tracked internal symlink is now a deletion made by this helper; the tree
	// was clean before unlinking, so allow only these known deletions through Git.
	const removed = git(
		["diff", "--name-only", "--diff-filter=D", "-z"],
		tree.path,
	)
		.split("\0")
		.filter(Boolean);
	const changed = git(["diff", "--name-only", "-z"], tree.path)
		.split("\0")
		.filter(Boolean);
	if (
		git(["diff", "--cached", "--name-only"], tree.path) ||
		git(["ls-files", "--others", "--exclude-standard"], tree.path) ||
		changed.some(
			(file) =>
				!removed.includes(file) ||
				!tree.links.some(
					(link) => key(path.resolve(tree.path, file)) === key(link.path),
				),
		)
	)
		throw new Error(`Worktree changed during removal checks: ${tree.path}`);
	git(
		[
			"worktree",
			"remove",
			...(removed.length ? ["--force"] : []),
			"--",
			tree.path,
		],
		checkout,
	);
	console.log(`REMOVED worktree: ${tree.path}`);
}

export function removeWorktreeOptions(parsed) {
	return {
		checkout: parsed.options.checkout,
		worktree: parsed.options.worktree,
	};
}

if (
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	const options = removeWorktreeOptions(
		beginToolCommand("gardener:remove-worktree", process.argv.slice(2)),
	);
	removeWorktree(options.checkout, options.worktree).catch((error) => {
		console.error(`REFUSED: ${error.message}`);
		process.exitCode = 1;
	});
}
